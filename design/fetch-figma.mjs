/**
 * fetch-figma.mjs
 * Figma API で全セクションのPC版フレームPNGを一括取得し design/screens/ に自動配置する
 *
 * 使い方:
 *   node design/fetch-figma.mjs                  # 全セクション取得
 *   node design/fetch-figma.mjs --dry-run        # マッピング確認のみ（DL しない）
 *   node design/fetch-figma.mjs --page "ページ名" # 特定ページのみ
 *   node design/fetch-figma.mjs --scale 2        # 2x 解像度（デフォルト 2）
 *
 * 必要な環境変数（.env.figma に記載）:
 *   FIGMA_TOKEN     … Personal Access Token
 *   FIGMA_FILE_KEY  … ファイルURL の /design/ 直後の文字列
 *
 * Figmaファイル構造（前提）:
 *   Page "UI"
 *     └ SECTION "1,2：ログイン"          ← screen-map.json のキー
 *         ├ FRAME "PC"                   ← エクスポート対象
 *         ├ FRAME "PC_資産一覧_チェック"  ← バリアント（detail-xxx.png）
 *         ├ FRAME "SP"                   ← スキップ
 *         ├ FRAME "Dialog"               ← スキップ
 *         └ INSTANCE "documents"          ← スキップ
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENS_DIR = resolve(__dirname, 'screens');
const APP_DIR = resolve(__dirname, '..', 'app');
const MAP_PATH = resolve(__dirname, 'screen-map.json');
const HASH_PATH = resolve(__dirname, '.figma-hashes.json');
const ENV_PATH = resolve(__dirname, '..', '.env.figma');

// ────────────────────────────────────────────
// 1. 設定読み込み
// ────────────────────────────────────────────

function loadEnv() {
  if (!existsSync(ENV_PATH)) {
    console.error('❌ .env.figma が見つかりません。以下を作成してください:\n');
    console.error('  FIGMA_TOKEN=figd_xxxxxxxxxxxx');
    console.error('  FIGMA_FILE_KEY=xxxxxxxxxxxxxxxxx\n');
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(ENV_PATH, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

const env = loadEnv();
const FIGMA_TOKEN = env.FIGMA_TOKEN;
const FIGMA_FILE_KEY = env.FIGMA_FILE_KEY;

if (!FIGMA_TOKEN || !FIGMA_FILE_KEY) {
  console.error('❌ .env.figma に FIGMA_TOKEN と FIGMA_FILE_KEY の両方が必要です');
  process.exit(1);
}

// ────────────────────────────────────────────
// 2. CLI 引数
// ────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SCALE = (() => {
  const idx = args.indexOf('--scale');
  return idx !== -1 && args[idx + 1] ? Number(args[idx + 1]) : 2;
})();
const PAGE_FILTER = (() => {
  const idx = args.indexOf('--page');
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
})();

// ────────────────────────────────────────────
// 3. マッピング
// ────────────────────────────────────────────

const norm = (s) => s.normalize('NFC');

const rawMap = JSON.parse(readFileSync(MAP_PATH, 'utf-8'));
const screenMap = Object.fromEntries(
  Object.entries(rawMap)
    .filter(([k]) => !k.startsWith('_'))
    .map(([k, v]) => [norm(k), Array.isArray(v) ? v : [v]])
);

/**
 * セクション名からマッピング先を探す
 * @returns string[] | null | '_skip'
 */
function findMapping(sectionName) {
  const normalized = norm(sectionName.trim());

  // screen-map.json 完全一致
  if (screenMap[normalized]) {
    const dirs = screenMap[normalized];
    // '_skip' はスキップ対象
    if (dirs.length === 1 && dirs[0] === '_skip') return '_skip';
    return dirs;
  }

  // app/ ルートフォルダ直接マッチ
  if (existsSync(resolve(APP_DIR, normalized, 'page.tsx'))) {
    return [normalized];
  }

  return null;
}

// ────────────────────────────────────────────
// 4. フレーム選択ロジック
// ────────────────────────────────────────────

/** スキップ対象のフレーム名パターン */
const SKIP_PATTERNS = [
  /^SP$/i,
  /^Tablet$/i,
  /^Dialog$/i,
  /^div$/i,
  /^没/,
  /^Modal/,
  /^menu$/i,
  /^box$/i,
  /^error$/i,
];

/**
 * セクション内のフレームからPC版の通常状態を選ぶ
 * 戻り値: { primary: Frame, variants: Frame[] }
 */
function selectFrames(frames) {
  // FRAME のみ対象（INSTANCE, CONNECTOR, WIDGET, TEXT は除外）
  const candidates = frames.filter(f => f.type === 'FRAME');

  // スキップ対象を除外
  const pcFrames = candidates.filter(f =>
    !SKIP_PATTERNS.some(pat => pat.test(f.name))
  );

  if (pcFrames.length === 0) {
    // PC版がない場合（SP/Tablet画面など）→ SPを探す
    const spFrames = candidates.filter(f => /^SP$/i.test(f.name));
    const tabletFrames = candidates.filter(f => /^Tablet$/i.test(f.name));
    const fallback = spFrames[0] || tabletFrames[0] || candidates[0];
    return fallback ? { primary: fallback, variants: [] } : null;
  }

  // 先頭をプライマリ、残りをバリアントとする
  const primary = pcFrames[0];
  const variants = pcFrames.slice(1);

  return { primary, variants };
}

/**
 * バリアントフレーム名からファイル名を生成
 * "PC_資産一覧_チェック" → "detail-チェック.png"
 * "パスワード再設定_入力済" → "detail-入力済.png"
 */
function variantFileName(frameName, primaryName) {
  // プライマリ名のプレフィックスを除去してサフィックスを抽出
  const normalized = frameName.replace(/^PC[_]?/, '');
  const primaryNorm = primaryName.replace(/^PC[_]?/, '');

  if (normalized === primaryNorm) return null; // 同名は重複

  // プライマリ名を除去してサフィックスを取得
  let suffix = normalized;
  if (normalized.startsWith(primaryNorm)) {
    suffix = normalized.slice(primaryNorm.length).replace(/^[_]/, '');
  }

  if (!suffix) return null;
  return `detail-${suffix}.png`;
}

// ────────────────────────────────────────────
// 5. Figma API
// ────────────────────────────────────────────

const API_BASE = 'https://api.figma.com/v1';

async function figmaGet(path, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'X-Figma-Token': FIGMA_TOKEN }
    });

    if (res.status === 429) {
      const wait = attempt * 60;
      console.log(`  ⏳ レート制限 (429)。${wait}秒待機中... (${attempt}/${retries})`);
      await new Promise(r => setTimeout(r, wait * 1000));
      continue;
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Figma API ${res.status}: ${body}`);
    }
    return res.json();
  }
  throw new Error('Figma API: レート制限が解除されません。10分以上待ってから再実行してください。');
}

/**
 * フレームIDリストからPNG URLを取得（10件ずつバッチ + ウェイト）
 */
async function getImageUrls(frameIds) {
  const BATCH_SIZE = 5;
  const allUrls = {};

  for (let i = 0; i < frameIds.length; i += BATCH_SIZE) {
    const batch = frameIds.slice(i, i + BATCH_SIZE);
    const ids = batch.join(',');
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(frameIds.length / BATCH_SIZE);
    process.stdout.write(`  バッチ ${batchNum}/${totalBatches} (${batch.length}件)...\r`);

    const data = await figmaGet(
      `/images/${FIGMA_FILE_KEY}?ids=${ids}&format=png&scale=${SCALE}`
    );
    Object.assign(allUrls, data.images || {});

    // レート制限回避: バッチ間に3秒待機
    if (i + BATCH_SIZE < frameIds.length) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log();
  return allUrls;
}

/**
 * URLからPNGをダウンロードして保存。ハッシュを返す。
 */
async function downloadPng(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(destPath), { recursive: true });
  writeFileSync(destPath, buffer);
  return createHash('md5').update(buffer).digest('hex');
}

// ────────────────────────────────────────────
// 6. ハッシュ差分検知
// ────────────────────────────────────────────

function loadHashes() {
  if (existsSync(HASH_PATH)) {
    return JSON.parse(readFileSync(HASH_PATH, 'utf-8'));
  }
  return {};
}

function saveHashes(hashes) {
  writeFileSync(HASH_PATH, JSON.stringify(hashes, null, 2));
}

// ────────────────────────────────────────────
// 7. メイン処理
// ────────────────────────────────────────────

async function main() {
  // depth 未指定で全ノードを取得（Figma APIデフォルト: 全階層）
  console.log('📡 Figma ファイル構造を取得中...\n');
  const file = await figmaGet(`/files/${FIGMA_FILE_KEY}`);

  // 再帰的にセクションを探索（ネストされたセクション内のセクションも検出）
  function collectSections(node, pageName, result) {
    for (const child of node.children || []) {
      if (child.type === 'SECTION') {
        result.push({
          name: child.name,
          page: pageName,
          children: child.children || []
        });
        // セクション内にさらにセクションがある場合も探索
        collectSections(child, pageName, result);
      }
    }
    return result;
  }

  const sections = [];
  for (const page of file.document.children) {
    if (page.type !== 'CANVAS') continue;
    if (PAGE_FILTER && !page.name.includes(PAGE_FILTER)) continue;
    collectSections(page, page.name, sections);
  }

  console.log(`📐 ${sections.length} セクションを検出\n`);

  // マッピング + フレーム選択
  const matched = [];    // { section, screenDir, frame, destName, destPath }
  const unmatched = [];  // { section }
  const skipped = [];    // { section } — _skip 指定
  const matchedRoutes = new Set();

  for (const section of sections) {
    const screenDirs = findMapping(section.name);

    if (screenDirs === '_skip') {
      skipped.push(section);
      continue;
    }

    if (!screenDirs) {
      unmatched.push(section);
      continue;
    }

    const selected = selectFrames(section.children);
    if (!selected) {
      console.log(`  ⚠️  フレームなし: ${section.name}`);
      continue;
    }

    for (const screenDir of screenDirs) {
      matchedRoutes.add(screenDir);

      // プライマリ → full.png
      matched.push({
        section: section.name,
        screenDir,
        frame: selected.primary,
        destName: 'full.png',
        destPath: resolve(SCREENS_DIR, screenDir, 'full.png')
      });

      // バリアント → detail-xxx.png
      for (const variant of selected.variants) {
        const vFile = variantFileName(variant.name, selected.primary.name);
        if (vFile) {
          matched.push({
            section: section.name,
            screenDir,
            frame: variant,
            destName: vFile,
            destPath: resolve(SCREENS_DIR, screenDir, vFile)
          });
        }
      }
    }
  }

  // 結果表示
  console.log('--- マッピング結果 ---\n');

  if (matched.length > 0) {
    console.log(`✅ マッチ: ${matched.length} 件（${matchedRoutes.size} 画面）`);
    let lastSection = '';
    for (const m of matched) {
      if (m.section !== lastSection) {
        console.log(`\n  [${m.section}]`);
        lastSection = m.section;
      }
      console.log(`    ${m.frame.name} → design/screens/${m.screenDir}/${m.destName}`);
    }
  }

  if (unmatched.length > 0) {
    console.log(`\n⚠️  未マッチセクション: ${unmatched.length} 件`);
    for (const u of unmatched) {
      console.log(`  「${u.name}」`);
    }
    console.log('\n💡 screen-map.json に追記してください:');
    for (const u of unmatched) {
      console.log(`  "${u.name}": "app-route-name",`);
    }
  }

  // 逆引きチェック
  const EXCLUDE = new Set(['quotation-data-box', 'data-matching']);
  const appRoutes = readdirSync(APP_DIR)
    .filter(d => existsSync(resolve(APP_DIR, d, 'page.tsx')))
    .filter(d => !EXCLUDE.has(d));
  const missingRoutes = appRoutes.filter(r => !matchedRoutes.has(r));

  if (missingRoutes.length > 0) {
    console.log(`\n📋 Figmaデザイン未検出の画面 (${missingRoutes.length}件):`);
    for (const r of missingRoutes.sort()) {
      console.log(`  - ${r}`);
    }
  }

  if (DRY_RUN) {
    console.log('\n🔍 --dry-run: ダウンロードはスキップしました');
    return;
  }

  if (matched.length === 0) {
    console.log('\nマッチするフレームがありません。screen-map.json を確認してください。');
    return;
  }

  // PNG URL 取得
  const uniqueFrameIds = [...new Set(matched.map(m => m.frame.id))];
  console.log(`\n📥 ${uniqueFrameIds.length} フレームのPNGをエクスポート中...`);
  const imageUrls = await getImageUrls(uniqueFrameIds);

  // ダウンロード + ハッシュ差分検知
  const prevHashes = loadHashes();
  const newHashes = {};
  let downloaded = 0;
  let unchanged = 0;
  let failed = 0;
  const changedScreens = new Set();

  for (const m of matched) {
    const url = imageUrls[m.frame.id];
    if (!url) {
      console.log(`  ⚠️  URL取得失敗: ${m.section} / ${m.frame.name}`);
      failed++;
      continue;
    }

    try {
      const hash = await downloadPng(url, m.destPath);
      const key = `${m.screenDir}/${m.destName}`;
      newHashes[key] = hash;

      if (prevHashes[key] && prevHashes[key] === hash) {
        unchanged++;
      } else {
        changedScreens.add(m.screenDir);
        downloaded++;
      }

      process.stdout.write(`  ✅ [${downloaded + unchanged}/${matched.length}] ${m.screenDir}/${m.destName}\r\n`);
    } catch (err) {
      console.log(`  ❌ DL失敗: ${m.screenDir}/${m.destName} - ${err.message}`);
      failed++;
    }
  }

  // ハッシュ保存
  saveHashes(newHashes);

  // サマリー
  console.log('\n────────────────────────────────');
  console.log(`🎉 完了: ${downloaded + unchanged} 件DL / ${failed} 件失敗 / ${unmatched.length} セクション未マッチ`);

  if (changedScreens.size > 0) {
    console.log(`\n🔄 変更があった画面 (${changedScreens.size}件):`);
    for (const s of [...changedScreens].sort()) {
      console.log(`  - ${s}`);
    }
    console.log('\n👆 これらの画面に対して「Figma反映して」と指示してください');
  } else if (downloaded + unchanged > 0) {
    console.log('\n✨ 前回から変更はありません');
  }
}

main().catch(err => {
  console.error('❌ エラー:', err.message);
  process.exit(1);
});
