/**
 * 画面遷移設計書用 スクリーンショット自動撮影スクリプト
 * Usage: node capture_screenshots.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SS_DIR = join(__dirname, 'screenshots');
const BASE_URL = 'http://localhost:3000';
const VIEWPORT = { width: 1280, height: 900 };

// 全画面定義（フローグループ別）
const SCREENS = {
  // --- 認証フロー ---
  auth: [
    { id: 'login', path: '/login', name: 'ログイン画面', needsLogin: false },
    { id: 'password-reset', path: '/password-reset', name: 'パスワード再設定画面', needsLogin: false },
    { id: 'facility-select', path: '/facility-select', name: '施設選択画面', user: 'admin@ship.com' },
    { id: 'main', path: '/main', name: 'メニュー画面', user: 'admin@ship.com' },
  ],
  // --- 現有品調査フロー ---
  survey: [
    { id: 'offline-prep', path: '/offline-prep', name: 'オフライン準備画面' },
    { id: 'survey-location', path: '/survey-location', name: '調査場所入力画面' },
    { id: 'asset-survey-integrated', path: '/asset-survey-integrated?building=本館&floor=3F&room=301', name: '現有品調査画面' },
    { id: 'history', path: '/history', name: '登録履歴画面' },
    { id: 'registration-edit', path: '/registration-edit', name: '登録内容修正画面' },
    { id: 'asset-import', path: '/asset-import', name: '資産台帳取込画面' },
    { id: 'asset-matching', path: '/asset-matching', name: '資産マスタ登録画面' },
    { id: 'data-matching', path: '/data-matching', name: 'データ突合画面' },
    { id: 'qr-issue', path: '/qr-issue', name: 'QRコード発行画面' },
    { id: 'qr-print', path: '/qr-print?template=standard&start=1&end=10&footer=test', name: 'QR印刷画面' },
  ],
  // --- 購入管理フロー ---
  purchase: [
    { id: 'quotation-data-box', path: '/quotation-data-box/purchase-management', name: '購入管理画面' },
    { id: 'remodel-management', path: '/quotation-data-box/remodel-management', name: 'リモデル管理画面' },
    { id: 'remodel-application', path: '/remodel-application', name: 'リモデル編集画面' },
    { id: 'quotation-management', path: '/quotation-management', name: '見積管理画面' },
    { id: 'quotation-processing', path: '/quotation-processing', name: '見積依頼・登録画面' },
    { id: 'ocr-confirm', path: '/quotation-data-box/ocr-confirm', name: 'OCR明細確認画面' },
    { id: 'category-registration', path: '/quotation-data-box/category-registration', name: '分類登録画面' },
    { id: 'item-ai-matching', path: '/quotation-data-box/item-ai-matching', name: 'AI判定確認画面' },
    { id: 'price-allocation', path: '/quotation-data-box/price-allocation', name: '金額按分画面' },
    { id: 'registration-confirm', path: '/quotation-data-box/registration-confirm', name: '登録確認画面' },
    { id: 'order-registration', path: '/quotation-data-box/order-registration', name: '発注登録画面' },
    { id: 'asset-registration', path: '/quotation-data-box/asset-registration', name: '資産登録画面' },
    { id: 'asset-provisional', path: '/quotation-data-box/asset-provisional-registration', name: '資産仮登録画面' },
    { id: 'inspection-registration', path: '/quotation-data-box/inspection-registration', name: '検収登録画面' },
  ],
  // --- 保守・点検フロー ---
  maintenance: [
    { id: 'inspection-prep', path: '/inspection-prep', name: '日常点検準備画面' },
    { id: 'daily-inspection', path: '/daily-inspection', name: '日常点検実施画面' },
    { id: 'inspection-result', path: '/inspection-result', name: '点検結果画面' },
    { id: 'inspection-requests', path: '/quotation-data-box/inspection-requests', name: '点検管理画面' },
    { id: 'periodic-inspection', path: '/periodic-inspection', name: '定期点検画面' },
    { id: 'maker-maintenance-result', path: '/maker-maintenance-result', name: 'メーカー点検結果画面' },
    { id: 'maintenance-contracts', path: '/quotation-data-box/maintenance-contracts', name: '保守契約管理画面' },
    { id: 'maintenance-quote', path: '/maintenance-quote-registration', name: '保守見積登録画面' },
  ],
  // --- 修理フロー ---
  repair: [
    { id: 'repair-request', path: '/repair-request', name: '修理申請画面' },
    { id: 'repair-requests-list', path: '/quotation-data-box/repair-requests', name: '修理申請一覧画面' },
    { id: 'repair-task', path: '/repair-task', name: '修理タスク画面' },
  ],
  // --- 貸出フロー ---
  lending: [
    { id: 'lending-available', path: '/lending-available', name: '貸出可能機器一覧画面' },
    { id: 'lending-checkout', path: '/lending-checkout', name: '貸出・返却画面' },
    { id: 'lending-management', path: '/quotation-data-box/lending-management', name: '貸出管理画面' },
  ],
  // --- 移動・廃棄フロー ---
  transfer: [
    { id: 'asset-search-result', path: '/asset-search-result', name: '資産一覧画面' },
    { id: 'asset-detail', path: '/asset-detail', name: '資産カルテ画面' },
    { id: 'transfer-management', path: '/quotation-data-box/transfer-management', name: '移動・廃棄管理画面' },
    { id: 'disposal-task', path: '/disposal-task', name: '移動・廃棄タスク画面' },
    { id: 'inventory', path: '/inventory', name: '棚卸画面' },
  ],
  // --- マスタ管理フロー ---
  master: [
    { id: 'ship-facility-master', path: '/ship-facility-master', name: 'SHIP施設マスタ画面' },
    { id: 'ship-asset-master', path: '/ship-asset-master', name: 'SHIP資産マスタ画面' },
    { id: 'ship-department-master', path: '/ship-department-master', name: 'SHIP部門マスタ画面' },
    { id: 'hospital-facility-master', path: '/hospital-facility-master', name: '個別施設マスタ画面' },
    { id: 'vendor-master', path: '/vendor-master', name: '業者マスタ画面' },
    { id: 'user-management', path: '/user-management', name: 'ユーザー管理画面' },
    { id: 'permission-management', path: '/permission-management', name: '権限管理画面' },
    { id: 'facility-group-management', path: '/facility-group-management', name: '施設グループ管理画面' },
    { id: 'user-permission-management', path: '/user-permission-management', name: 'ユーザー権限管理画面' },
    { id: 'asset-master', path: '/asset-master', name: '資産マスタ選択画面' },
  ],
};

async function login(page, email = 'admin@ship.com') {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'あ');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // 施設選択画面が出たら東京中央病院を選択
  if (page.url().includes('facility-select')) {
    try {
      // 全施設管理者の場合 SearchableSelect
      const selectInput = page.locator('input[placeholder*="施設名"]');
      if (await selectInput.isVisible({ timeout: 1000 })) {
        await selectInput.fill('東京中央');
        await page.waitForTimeout(500);
        // ドロップダウンの選択肢をクリック
        const option = page.locator('text=東京中央病院').first();
        if (await option.isVisible({ timeout: 1000 })) {
          await option.click();
        }
        await page.waitForTimeout(300);
        const submitBtn = page.locator('button:has-text("決定")');
        if (await submitBtn.isVisible({ timeout: 500 })) {
          await submitBtn.click();
        }
      } else {
        // カード選択式の場合
        const card = page.locator('button:has-text("東京中央病院")').first();
        if (await card.isVisible({ timeout: 1000 })) {
          await card.click();
        }
      }
      await page.waitForTimeout(2000);
    } catch {
      // auto-redirect の場合はそのまま
    }
  }
}

async function captureScreen(page, screen, groupDir) {
  const filePath = join(groupDir, `${screen.id}.png`);

  try {
    await page.goto(`${BASE_URL}${screen.path}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`  ✓ ${screen.name} → ${screen.id}.png`);
  } catch (err) {
    console.log(`  ✗ ${screen.name} (${err.message.slice(0, 60)})`);
    // エラー時もページの現在の状態をキャプチャ
    try {
      await page.screenshot({ path: filePath, fullPage: false });
    } catch { /* ignore */ }
  }
}

async function main() {
  // 出力ディレクトリ作成
  if (!existsSync(SS_DIR)) mkdirSync(SS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT, locale: 'ja-JP' });
  const page = await context.newPage();

  // system_admin でログイン (最も多くの画面にアクセスできる)
  console.log('ログイン中 (admin@ship.com)...');
  await login(page, 'admin@ship.com');
  console.log('ログイン完了\n');

  for (const [group, screens] of Object.entries(SCREENS)) {
    const groupDir = join(SS_DIR, group);
    if (!existsSync(groupDir)) mkdirSync(groupDir, { recursive: true });
    console.log(`=== ${group} (${screens.length}画面) ===`);

    for (const screen of screens) {
      if (screen.needsLogin === false) {
        // ログイン不要の画面は別途処理
        const freshPage = await context.newPage();
        try {
          await freshPage.goto(`${BASE_URL}${screen.path}`, { waitUntil: 'networkidle', timeout: 15000 });
          await freshPage.waitForTimeout(1500);
          await freshPage.screenshot({
            path: join(groupDir, `${screen.id}.png`),
            fullPage: false,
          });
          console.log(`  ✓ ${screen.name} → ${screen.id}.png`);
        } catch (err) {
          console.log(`  ✗ ${screen.name} (${err.message.slice(0, 60)})`);
          try {
            await freshPage.screenshot({
              path: join(groupDir, `${screen.id}.png`),
              fullPage: false,
            });
          } catch { /* ignore */ }
        }
        await freshPage.close();
        continue;
      }

      if (screen.user && screen.user !== 'admin@ship.com') {
        // 別ユーザーでログインが必要な場合
        await login(page, screen.user);
      }

      await captureScreen(page, screen, groupDir);
    }
    console.log('');
  }

  await browser.close();
  console.log(`\n撮影完了！ 出力先: ${SS_DIR}`);
}

main().catch(console.error);
