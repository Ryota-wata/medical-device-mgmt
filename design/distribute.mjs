/**
 * distribute.mjs
 * design/input/ の PNG を design/screens/(画面名)/ に配置するスクリプト
 *
 * 使い方: node design/distribute.mjs
 *
 * ファイル命名規則:
 *   login.png              → design/screens/login/full.png
 *   login_全体.png          → design/screens/login/overview.png
 *   login_エラー.png        → design/screens/login/detail-エラー.png
 *
 * マッチング優先順:
 *   1. ルートフォルダ直接マッチ（app/{name}/page.tsx が存在するか）
 *   2. screen-map.json フォールバック（完全一致のみ）
 */

import { readFileSync, readdirSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT_DIR = resolve(__dirname, 'input');
const SCREENS_DIR = resolve(__dirname, 'screens');
const APP_DIR = resolve(__dirname, '..', 'app');
const MAP_PATH = resolve(__dirname, 'screen-map.json');

// Unicode正規化（macOSはNFD、JSONはNFC のため統一が必要）
const norm = (s) => s.normalize('NFC');

// screen-map.json フォールバック用（完全一致のみ）
const rawMap = JSON.parse(readFileSync(MAP_PATH, 'utf-8'));
const screenMap = Object.fromEntries(
  Object.entries(rawMap)
    .filter(([k]) => !k.startsWith('_'))
    .map(([k, v]) => [norm(k), Array.isArray(v) ? v : [v]])
);

// サフィックスパターン: _全体, _エラー, _入力済 など
const SUFFIX_RE = /^(.+?)_(全体|.+)$/;

/**
 * ファイル名からマッピング先を探す
 * @returns {{ screenDirs: string[], suffix: string | null } | null}
 */
function findMapping(name) {
  const m = name.match(SUFFIX_RE);
  const baseName = m ? m[1] : name;
  const suffix = m ? m[2] : null;

  // 1. ルートフォルダ直接マッチ（推奨）
  if (existsSync(resolve(APP_DIR, baseName, 'page.tsx'))) {
    return { screenDirs: [baseName], suffix };
  }

  // 2. screen-map.json 完全一致フォールバック（部分一致は行わない）
  const screenDirs = screenMap[baseName];
  if (screenDirs) {
    return { screenDirs, suffix };
  }

  return null;
}

/**
 * サフィックスから保存ファイル名を決定
 */
function destFileName(suffix) {
  if (!suffix) return 'full.png';
  if (suffix === '全体') return 'overview.png';
  return `detail-${suffix}.png`;
}

// --- main ---

const files = readdirSync(INPUT_DIR).filter(
  (f) => extname(f).toLowerCase() === '.png'
);

if (files.length === 0) {
  console.log('design/input/ にPNGファイルがありません。');
  console.log('ルートフォルダ名でPNGを保存してください（例: login.png, survey-location.png）');
  process.exit(0);
}

console.log(`${files.length} 件のPNGを検出\n`);

const matched = [];
const unmatched = [];

for (const file of files) {
  const name = norm(basename(file, extname(file)));
  const result = findMapping(name);

  if (result) {
    const { screenDirs, suffix } = result;
    const destName = destFileName(suffix);
    for (const screenDir of screenDirs) {
      const destDir = resolve(SCREENS_DIR, screenDir);
      mkdirSync(destDir, { recursive: true });
      const destPath = resolve(destDir, destName);
      copyFileSync(resolve(INPUT_DIR, file), destPath);
      matched.push({ file, dest: `design/screens/${screenDir}/${destName}` });
    }
  } else {
    unmatched.push(file);
  }
}

// 結果表示
if (matched.length > 0) {
  console.log('--- 配置完了 ---');
  for (const { file, dest } of matched) {
    console.log(`  ${file} → ${dest}`);
  }
}

if (unmatched.length > 0) {
  console.log('\n--- マッチングなし ---');
  for (const file of unmatched) {
    console.log(`  ${file}`);
  }
  console.log('\n有効なルートフォルダ名:');
  const routes = readdirSync(APP_DIR)
    .filter(d => existsSync(resolve(APP_DIR, d, 'page.tsx')))
    .sort();
  for (const r of routes) {
    console.log(`  ${r}.png`);
  }
}

console.log(`\n完了: ${matched.length} 件配置 / ${unmatched.length} 件未対応`);
