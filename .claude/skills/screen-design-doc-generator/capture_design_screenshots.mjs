#!/usr/bin/env node
/**
 * 画面設計書用 スクリーンショット自動撮影 + 要素位置抽出スクリプト
 *
 * Usage:
 *   node capture_design_screenshots.mjs                        # 全画面撮影
 *   node capture_design_screenshots.mjs --screen "ログイン画面"  # 特定画面のみ
 *   node capture_design_screenshots.mjs --screen "メニュー画面" --no-positions  # 位置抽出なし
 *
 * 依存: playwright (npm install playwright)
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// === 設定 ===
const CONFIG_PATH = '/Users/watanaberyouta/Desktop/画面設計書/screen_configs.json';
const SS_DIR = '/Users/watanaberyouta/Desktop/画面設計書/screenshots';
const POSITIONS_DIR = '/Users/watanaberyouta/Desktop/画面設計書/positions';
const ELEMENTS_DIR = '/Users/watanaberyouta/Desktop/画面設計書/elements';
const BASE_URL = 'http://localhost:3000';

// デバイス別ビューポート
const VIEWPORTS = {
  'PC': { width: 1920, height: 1080 },
  'タブレット': { width: 768, height: 1024 },
  'スマホ': { width: 375, height: 812 },
};

// === CLI引数解析 ===
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    screen: null,
    noPositions: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--screen':
        options.screen = args[++i];
        break;
      case '--no-positions':
        options.noPositions = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
画面設計書用 スクリーンショット自動撮影スクリプト

Usage:
  node capture_design_screenshots.mjs [options]

Options:
  --screen <画面名>    特定画面のみ撮影（例: "ログイン画面"）
  --no-positions       要素位置の自動抽出をスキップ
  -h, --help           このヘルプを表示
`);
}

// === 設定読み込み ===
function loadScreenConfigs() {
  const raw = readFileSync(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw);
}

// === elements.md からセレクタヒント抽出 ===
function loadSelectorHints(screenName) {
  const hints = {};
  const elementsFile = join(ELEMENTS_DIR, `${screenName}_elements.md`);

  if (!existsSync(elementsFile)) return hints;

  const content = readFileSync(elementsFile, 'utf-8');
  const lines = content.split('\n');
  const tableLines = lines.filter(l => l.trim().startsWith('|'));

  if (tableLines.length < 3) return hints;

  for (const line of tableLines.slice(2)) {
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 8) continue;

    const no = cells[0];
    // 新12カラム: 備考は最後のカラム（インデックス11）
    // 旧8カラム: 備考はインデックス7
    const remarks = cells[cells.length - 1] || cells[7] || '';
    const selectorMatch = remarks.match(/selector:\s*(.+?)(?:\s*$|\s*\|)/);
    if (selectorMatch) {
      hints[no] = selectorMatch[1].trim();
    }
  }

  return hints;
}

// === 認証フロー ===
async function login(page, email) {
  console.log(`  認証中: ${email}...`);

  // ログインページに遷移してからlocalStorageクリア（ロール切替のため）
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(500);

  // メールアドレス入力
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'あ');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // 施設選択画面が出たらサンプル病院を選択
  if (page.url().includes('facility-select')) {
    try {
      // SearchableSelect（全施設管理者用）
      const selectInput = page.locator('input[placeholder*="施設名"]');
      if (await selectInput.isVisible({ timeout: 1000 })) {
        await selectInput.fill('サンプル');
        await page.waitForTimeout(500);
        const option = page.locator('text=サンプル病院').first();
        if (await option.isVisible({ timeout: 1000 })) {
          await option.click();
        }
        await page.waitForTimeout(300);
        const submitBtn = page.locator('button:has-text("決定")');
        if (await submitBtn.isVisible({ timeout: 500 })) {
          await submitBtn.click();
        }
      } else {
        // カード選択式
        const card = page.locator('button:has-text("サンプル病院")').first();
        if (await card.isVisible({ timeout: 1000 })) {
          await card.click();
        }
      }
      await page.waitForTimeout(2000);
    } catch {
      // 自動リダイレクトの場合はそのまま
    }
  }

  console.log(`  認証完了: ${email}`);
}

// === fullPage撮影用: レイアウト制約を解除 ===
// 1. fixed/sticky → absolute
// 2. overflow-y-auto/overflow-auto/overflow-hidden → visible
// 3. h-dvh/min-h-dvh/h-screen/max-h-screen → auto
// これによりページ全体がドキュメントフローに展開され、fullPageで全コンテンツが撮影される
async function unfixElements(page) {
  await page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const style = window.getComputedStyle(el);
      const mods = [];

      // fixed/sticky解除
      if (style.position === 'fixed' || style.position === 'sticky') {
        mods.push(['position', style.position, 'absolute']);
      }

      // overflow制約解除（内部スクロール領域を展開）
      if (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'hidden') {
        // bodyやhtml以外のoverflow制約を解除
        if (el !== document.body && el !== document.documentElement) {
          mods.push(['overflowY', style.overflowY, 'visible']);
        }
      }
      if (style.overflowX === 'hidden') {
        if (el !== document.body && el !== document.documentElement) {
          mods.push(['overflowX', style.overflowX, 'visible']);
        }
      }

      // 高さ制約解除
      // computedStyleはpxに変換済みなので、inline styleとCSS classの両方をチェック
      const inlineH = el.style.height || '';
      const inlineMH = el.style.minHeight || '';
      const inlineMaxH = el.style.maxHeight || '';
      const cls = el.className || '';

      // inline style: 100dvh, 100vh等
      if (inlineH.includes('vh') || inlineH.includes('dvh')) {
        mods.push(['height', inlineH, 'auto']);
      }
      if (inlineMH.includes('vh') || inlineMH.includes('dvh')) {
        mods.push(['minHeight', inlineMH, 'auto']);
      }

      // Tailwind CSS class: h-dvh, h-screen, min-h-dvh, min-h-screen
      if (typeof cls === 'string') {
        if (cls.includes('h-dvh') || cls.includes('h-screen')) {
          mods.push(['height', style.height, 'auto']);
        }
        if (cls.includes('min-h-dvh') || cls.includes('min-h-screen')) {
          mods.push(['minHeight', style.minHeight, 'auto']);
        }
        if (cls.includes('max-h-')) {
          if (el !== document.body && el !== document.documentElement) {
            mods.push(['maxHeight', style.maxHeight, 'none']);
          }
        }
      }

      if (mods.length > 0) {
        el.dataset.wasMod = JSON.stringify(mods.map(m => [m[0], m[1]]));
        for (const [prop, , newVal] of mods) {
          el.style[prop] = newVal;
        }
      }
    }
  });
}

async function restoreFixedElements(page) {
  await page.evaluate(() => {
    const elements = document.querySelectorAll('[data-was-mod]');
    for (const el of elements) {
      const mods = JSON.parse(el.dataset.wasMod);
      for (const [prop, origVal] of mods) {
        el.style[prop] = origVal;
      }
      delete el.dataset.wasMod;
    }
  });
}

// === スクリーンショット撮影 ===
async function captureScreen(page, screenConfig, device) {
  const viewport = VIEWPORTS[device];
  const screenshotPath = join(SS_DIR, `${screenConfig.name}_${device}.png`);

  // ビューポート設定
  await page.setViewportSize(viewport);
  await page.waitForTimeout(500);

  // beforeCapture: ページ遷移前にevaluateで実行するJS（sessionStorage設定等）
  if (screenConfig.beforeCapture) {
    await page.evaluate(screenConfig.beforeCapture);
    await page.waitForTimeout(300);
  }

  // skipFacilitySelect: 施設選択画面撮影用。
  // 隔離コンテキストでログインし、施設選択画面に到達した時点でキャプチャ（共有ページを汚さない）
  if (screenConfig.skipFacilitySelect) {
    const email = screenConfig.optimalRole;
    const isoContext = await page.context().browser().newContext({
      viewport: viewport,
      locale: 'ja-JP',
    });
    const isoPage = await isoContext.newPage();
    try {
      await isoPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 15000 });
      await isoPage.waitForTimeout(500);
      await isoPage.fill('input[type="email"]', email);
      await isoPage.fill('input[type="password"]', 'あ');
      await isoPage.click('button[type="submit"]');
      await isoPage.waitForURL('**/facility-select**', { timeout: 10000 });
      await isoPage.waitForTimeout(2000);
      await isoPage.screenshot({ path: screenshotPath, fullPage: screenConfig.fullPage });
      console.log(`    [${device}] ${screenshotPath}`);
    } catch (err) {
      console.log(`    [${device}] (skipFacilitySelect) エラー: ${err.message.slice(0, 80)}`);
    }
    await isoContext.close();
    return screenshotPath;
  }

  // ensureFacilitySelected: ページ遷移前にlocalStorageのselectedFacilityをセット
  if (screenConfig.ensureFacilitySelected) {
    await page.evaluate(() => {
      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.state) {
          parsed.state.selectedFacility = 'サンプル病院';
          localStorage.setItem('auth-storage', JSON.stringify(parsed));
        }
      }
    });
    await page.waitForTimeout(300);
  }

  // ページ遷移
  await page.goto(`${BASE_URL}${screenConfig.path}`, {
    waitUntil: 'networkidle',
    timeout: 15000,
  });

  // コンテンツ描画完了を待機:
  // 1. 「読み込み中」「リダイレクト中」テキストが消えるのを待つ
  // 2. 最低3秒待機（非同期レンダリング完了用）
  try {
    await page.waitForFunction(() => {
      const body = document.body?.innerText || '';
      return !body.includes('読み込み中') && !body.includes('リダイレクト中') && !body.includes('Loading');
    }, { timeout: 8000 });
  } catch {
    // タイムアウトしても続行
  }
  await page.waitForTimeout(3000);

  // selectFacilityOnPage: ページ内の施設セレクタでサンプル病院を選択
  if (screenConfig.selectFacilityOnPage) {
    try {
      const facilityInput = page.locator('input[placeholder*="施設"]').first();
      if (await facilityInput.isVisible({ timeout: 2000 })) {
        await facilityInput.fill('サンプル');
        await page.waitForTimeout(500);
        const option = page.locator('text=サンプル病院').first();
        if (await option.isVisible({ timeout: 2000 })) {
          await option.click();
          await page.waitForTimeout(2000);
        }
      }
    } catch {
      // セレクタが無い場合はスキップ
    }
  }

  // fullPage撮影: fixed/sticky要素をabsoluteに変更
  if (screenConfig.fullPage) {
    await unfixElements(page);
    await page.waitForTimeout(500);
  }

  // スクリーンショット撮影
  await page.screenshot({
    path: screenshotPath,
    fullPage: screenConfig.fullPage,
  });

  // fixed要素を復元
  if (screenConfig.fullPage) {
    await restoreFixedElements(page);
  }

  console.log(`    [${device}] ${screenshotPath}`);
  return screenshotPath;
}

// === モーダル撮影 ===
// modal.role: モーダル固有のロール（省略時は画面のoptimalRoleを使用）
// modal.preTrigger: 多段モーダル用。先にこのセレクタをクリックしてから本triggerをクリック
async function captureModal(page, browser, screenConfig, modal, device, currentRole) {
  const viewport = VIEWPORTS[device];
  const screenshotPath = join(SS_DIR, `${screenConfig.name}_${modal.name}_${device}.png`);

  // モーダル固有ロールが指定されていて、現在のロールと異なる場合はログインし直す
  const modalRole = modal.role || null;
  let activePage = page;
  let tempContext = null;

  if (modalRole && modalRole !== currentRole) {
    tempContext = await browser.newContext({
      viewport: VIEWPORTS[device],
      locale: 'ja-JP',
    });
    activePage = await tempContext.newPage();
    await login(activePage, modalRole);
  } else {
    await activePage.setViewportSize(viewport);
    await activePage.waitForTimeout(500);
  }

  // ベース画面へ遷移
  await activePage.goto(`${BASE_URL}${screenConfig.path}`, {
    waitUntil: 'networkidle',
    timeout: 15000,
  });
  await activePage.waitForTimeout(1500);

  try {
    // preTrigger（多段モーダル: 親モーダルを先に開く）
    if (modal.preTrigger) {
      const pre = activePage.locator(modal.preTrigger.selector);
      if (await pre.isVisible({ timeout: 3000 })) {
        await pre.click();
        await activePage.waitForTimeout(500);
        if (modal.preTrigger.waitFor) {
          await activePage.waitForSelector(modal.preTrigger.waitFor, { timeout: 5000 });
        }
        await activePage.waitForTimeout(500);
      } else {
        console.log(`    [${device}] (モーダル: ${modal.name}) preTrigger要素が見つかりません: ${modal.preTrigger.selector}`);
        if (tempContext) await tempContext.close();
        return;
      }
    }

    // メイントリガーをクリック
    const trigger = activePage.locator(modal.trigger);
    if (await trigger.isVisible({ timeout: 3000 })) {
      await trigger.click();
      await activePage.waitForTimeout(500);

      if (modal.waitFor) {
        await activePage.waitForSelector(modal.waitFor, { timeout: 5000 });
      }
      await activePage.waitForTimeout(500);

      await activePage.screenshot({
        path: screenshotPath,
        fullPage: false,
      });
      console.log(`    [${device}] (モーダル: ${modal.name}) ${screenshotPath}`);
    } else {
      console.log(`    [${device}] (モーダル: ${modal.name}) トリガー要素が見つかりません: ${modal.trigger}`);
    }
  } catch (err) {
    console.log(`    [${device}] (モーダル: ${modal.name}) エラー: ${err.message.slice(0, 80)}`);
  }

  if (tempContext) await tempContext.close();
}

// === 要素位置の自動抽出 ===
async function extractPositions(page, screenConfig, device) {
  const selectorHints = loadSelectorHints(screenConfig.name);
  if (Object.keys(selectorHints).length === 0) return null;

  const viewport = VIEWPORTS[device];
  await page.setViewportSize(viewport);
  await page.waitForTimeout(300);

  // ページ遷移
  await page.goto(`${BASE_URL}${screenConfig.path}`, {
    waitUntil: 'networkidle',
    timeout: 15000,
  });
  await page.waitForTimeout(1000);

  const positions = {};

  for (const [no, selector] of Object.entries(selectorHints)) {
    try {
      const locator = page.locator(selector).first();
      if (await locator.isVisible({ timeout: 1000 })) {
        const box = await locator.boundingBox();
        if (box) {
          // 要素の左上座標を記録
          positions[no] = {
            x: Math.round(box.x),
            y: Math.round(box.y),
            width: Math.round(box.width),
            height: Math.round(box.height),
          };
        }
      }
    } catch {
      // セレクタが見つからない場合はスキップ
    }
  }

  return positions;
}

// === positions.json 書き出し ===
function savePositions(screenName, allPositions) {
  const outputPath = join(POSITIONS_DIR, `${screenName}_positions.json`);
  writeFileSync(outputPath, JSON.stringify(allPositions, null, 2), 'utf-8');
  console.log(`    位置データ保存: ${outputPath}`);
}

// === メイン処理 ===
async function main() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    return;
  }

  // 設定読み込み
  const config = loadScreenConfigs();
  let screens = config.screens;

  // 特定画面フィルタ
  if (options.screen) {
    screens = screens.filter(s => s.name === options.screen);
    if (screens.length === 0) {
      console.error(`エラー: 画面 "${options.screen}" が見つかりません。`);
      console.log('利用可能な画面:');
      config.screens.forEach(s => console.log(`  - ${s.name}`));
      process.exit(1);
    }
  }

  // ディレクトリ作成
  for (const dir of [SS_DIR, POSITIONS_DIR]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  console.log(`=== 画面設計書用スクリーンショット撮影開始 ===`);
  console.log(`対象: ${screens.length}画面\n`);

  const browser = await chromium.launch({ headless: true });

  // ロール別にグルーピング（ログイン回数を最小化）
  const roleGroups = {};
  for (const screen of screens) {
    const role = screen.optimalRole || '__no_login__';
    if (!roleGroups[role]) roleGroups[role] = [];
    roleGroups[role].push(screen);
  }

  let successCount = 0;
  let failCount = 0;

  for (const [role, roleScreens] of Object.entries(roleGroups)) {
    const context = await browser.newContext({
      viewport: VIEWPORTS['PC'],
      locale: 'ja-JP',
    });
    const page = await context.newPage();

    // ログイン（必要な場合）
    if (role !== '__no_login__') {
      await login(page, role);
    }

    for (const screenConfig of roleScreens) {
      console.log(`\n[${screenConfig.name}] (${screenConfig.devices.join('/')}) role=${role}`);

      try {
        // 各デバイスで撮影
        for (const device of screenConfig.devices) {
          if (screenConfig.needsLogin === false) {
            // ログイン不要画面は新しいコンテキストで撮影
            const freshContext = await browser.newContext({
              viewport: VIEWPORTS[device],
              locale: 'ja-JP',
            });
            const freshPage = await freshContext.newPage();

            try {
              await freshPage.goto(`${BASE_URL}${screenConfig.path}`, {
                waitUntil: 'networkidle',
                timeout: 15000,
              });
              await freshPage.waitForTimeout(1500);

              const screenshotPath = join(SS_DIR, `${screenConfig.name}_${device}.png`);
              await freshPage.screenshot({
                path: screenshotPath,
                fullPage: screenConfig.fullPage,
              });
              console.log(`    [${device}] ${screenshotPath}`);
            } catch (err) {
              console.log(`    [${device}] エラー: ${err.message.slice(0, 80)}`);
            }

            await freshContext.close();
          } else {
            await captureScreen(page, screenConfig, device);
          }
        }

        // モーダル撮影
        if (screenConfig.modals && screenConfig.modals.length > 0) {
          for (const modal of screenConfig.modals) {
            for (const device of screenConfig.devices) {
              await captureModal(page, browser, screenConfig, modal, device, role);
            }
          }
        }

        // 要素位置の自動抽出
        if (!options.noPositions && screenConfig.needsLogin !== false) {
          const allPositions = {};
          let hasPositions = false;

          for (const device of screenConfig.devices) {
            const positions = await extractPositions(page, screenConfig, device);
            if (positions && Object.keys(positions).length > 0) {
              allPositions[device] = positions;
              hasPositions = true;
            }
          }

          if (hasPositions) {
            savePositions(screenConfig.name, allPositions);
          }
        }

        successCount++;
      } catch (err) {
        console.log(`  エラー: ${err.message.slice(0, 100)}`);
        failCount++;
      }
    }

    await context.close();
  }

  await browser.close();

  console.log(`\n=== 撮影完了 ===`);
  console.log(`成功: ${successCount} / 失敗: ${failCount} / 合計: ${screens.length}`);
  console.log(`スクリーンショット: ${SS_DIR}`);
  console.log(`位置データ: ${POSITIONS_DIR}`);
}

main().catch(err => {
  console.error('致命的エラー:', err);
  process.exit(1);
});
