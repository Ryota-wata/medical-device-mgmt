/**
 * sync-tokens.mjs
 * design/tokens.json → lib/styles/constants.ts 自動生成スクリプト
 *
 * 使い方: node design/sync-tokens.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = resolve(__dirname, 'tokens.json');
const OUTPUT_PATH = resolve(__dirname, '..', 'lib', 'styles', 'constants.ts');

const tokens = JSON.parse(readFileSync(TOKENS_PATH, 'utf-8'));

// --- helpers ---

/** 値を TypeScript リテラルに変換 (indent = 現在のインデント深さ) */
function toTsValue(val, indent = 0) {
  const pad = ' '.repeat(indent);
  const innerPad = ' '.repeat(indent + 2);

  if (val === null || val === undefined) return 'undefined';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return `'${val}'`;
  if (Array.isArray(val)) {
    const items = val.map((v) => toTsValue(v, indent + 2)).join(', ');
    return `[${items}]`;
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val);
    const lines = entries.map(([k, v]) => {
      const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `'${k}'`;
      return `${innerPad}${key}: ${toTsValue(v, indent + 2)},`;
    });
    return `{\n${lines.join('\n')}\n${pad}}`;
  }
  return String(val);
}

/** セクションの JSDoc コメントを返す */
function sectionComment(name) {
  const comments = {
    colors: ['カラーパレット', '使用頻度の高い色を定数化'],
    spacing: ['スペーシングスケール', 'padding, margin, gap などで使用'],
    fontSize: ['フォントサイズスケール'],
    fontWeight: ['フォントウェイト'],
    borderRadius: ['ボーダーラディウス'],
    shadows: ['シャドウ'],
    zIndex: ['Z-index レイヤー'],
    breakpoints: ['ブレークポイント', 'レスポンシブデザインで使用'],
    transitions: ['トランジション'],
    iconSize: ['アイコンサイズ'],
    buttonSize: ['ボタンサイズ'],
  };
  const lines = comments[name] || [name];
  return [
    '/**',
    ` * ${lines[0]}`,
    ...(lines.length > 1 ? [` * ${lines[1]}`] : []),
    ' */',
  ].join('\n');
}

// --- generate ---

const sections = [
  'colors',
  'spacing',
  'fontSize',
  'fontWeight',
  'borderRadius',
  'shadows',
  'zIndex',
  'breakpoints',
  'transitions',
  'iconSize',
  'buttonSize',
];

const blocks = [];

blocks.push(
  '/**',
  ' * スタイル定数',
  ' * アプリケーション全体で使用する共通のスタイル定数を定義',
  ' *',
  ' * NOTE: このファイルは design/sync-tokens.mjs により自動生成されます。',
  ' * 直接編集せず、design/tokens.json を編集してから',
  ' *   node design/sync-tokens.mjs',
  ' * を実行してください。',
  ' */',
  '',
);

for (const name of sections) {
  const data = tokens[name];
  if (data === undefined) continue;

  blocks.push(sectionComment(name));
  blocks.push(`export const ${name} = ${toTsValue(data)} as const;`);
  blocks.push('');
}

const output = blocks.join('\n');

writeFileSync(OUTPUT_PATH, output, 'utf-8');
console.log(`✓ ${OUTPUT_PATH} を更新しました`);
