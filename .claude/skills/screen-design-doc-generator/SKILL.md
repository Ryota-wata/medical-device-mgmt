---
name: screen-design-doc-generator
description: 画面モックから①スクリーンショット取得、②要素採番、③Excel画面設計書を自動生成する。
allowed-tools: Read, Edit, Write, Bash, Glob, Grep
---

# 画面設計書自動生成スキル

画面モックのソースコード（page.tsx等）を解析し、Playwright自動撮影 + Excel一括生成で画面設計書を作成する。

## データフロー

```
[Phase A: Claude Code によるソースコード解析]
  page.tsx + permissions.ts → elements/{画面名}_elements.md (12カラム)
                                        ↓
[Phase B: Playwright 自動撮影 + 位置抽出]  ← 完全自動
  node capture_design_screenshots.mjs --screen "{画面名}"
       ├── screenshots/{画面名}_{デバイス}.png
       └── positions/{画面名}_positions.json
                                        ↓
[Phase C: Excel 一括生成]  ← 完全自動
  python3 generate_all_v2.py --screen "{画面名}"
       → 画面設計書.xlsx
```

## 出力先

```
/Users/watanaberyouta/Desktop/画面設計書/
├── 画面設計書.xlsx              # 全画面統合ファイル
├── screen_configs.json          # 全画面撮影設定マスタ
├── screenshots/
│   ├── {画面名}_PC.png
│   ├── {画面名}_タブレット.png
│   └── {画面名}_スマホ.png
├── elements/
│   └── {画面名}_elements.md     # 12カラム要素一覧
└── positions/
    └── {画面名}_positions.json  # 自動抽出された座標
```

## 対応フロー

### Step 1: screen_configs.json から対象画面情報を取得

```bash
Read: /Users/watanaberyouta/Desktop/画面設計書/screen_configs.json
```

各画面の設定:
```json
{
  "id": "login",
  "name": "ログイン画面",
  "path": "/login",
  "devices": ["PC", "タブレット", "スマホ"],
  "needsLogin": false,
  "optimalRole": null,
  "fullPage": false,
  "modals": []
}
```

**デバイスサイズ:**
| デバイス | 幅 | 高さ |
|----------|-----|------|
| PC | 1920 | 1080 |
| タブレット | 768 | 1024 |
| スマホ | 375 | 812 |

### Step 2: ソースコード解析 → elements.md 生成（新12カラム）

対象画面の page.tsx を読み込み、以下を解析して要素一覧MDを作成する。

1. **UI要素の特定**: JSXから全要素を抽出
2. **データ型・桁数の推定**: input属性・Zodスキーマから判定（[ELEMENT_COLUMNS.md](ELEMENT_COLUMNS.md) 参照）
3. **バリデーション・エラーメッセージの抽出**: zodスキーマ、フォームerrors、toast.error等
4. **権限情報の取得**: `lib/utils/permissions.ts` の PERMISSION_MATRIX から判定
5. **セレクタヒントの付与**: 備考欄に `selector: {CSSセレクタ}` を記載

**出力**: `/Users/watanaberyouta/Desktop/画面設計書/elements/{画面名}_elements.md`

**12カラムフォーマット:**
```markdown
# {画面名} 要素一覧

## 要素一覧

| No | 要素名 | 要素種別 | データ型 | 桁数 | 必須 | 操作仕様 | 初期値 | バリデーション | エラーメッセージ | 権限 | 備考 |
|----|--------|----------|----------|------|------|----------|--------|----------------|------------------|------|------|
| 1 | ロゴ | 画像 | -- | -- | - | （表示のみ）SHIPロゴを表示 | - | - | -- | 全ロール | selector: img[alt="SHIP"] |
| 2 | メールアドレス | テキスト入力 | email | 最大256文字 | ○ | 入力→リアルタイムバリデーション | - | メール形式チェック | 有効なメールアドレスを入力してください | 全ロール | selector: input[type="email"] |
```

**カラム詳細:**
| カラム | 説明 | 判定ルール |
|--------|------|-----------|
| データ型 | string/number/date/boolean/email/enum/file/-- | [ELEMENT_COLUMNS.md](ELEMENT_COLUMNS.md) 参照 |
| 桁数 | 最大文字数等 | maxLength/max属性 or ビジネスロジック推定 |
| 操作仕様 | `{トリガー}→{動作/遷移先}` | JSXイベントハンドラから |
| エラーメッセージ | バリデーション失敗時のテキスト | zodスキーマ/errors/toast |
| 権限 | ロール別制御 | PERMISSION_MATRIX |
| 備考 | セレクタヒント | `selector: {CSSセレクタ}` |

**要素種別**: [ELEMENT_TYPES.md](ELEMENT_TYPES.md) 参照

**モーダル要素の採番**: `M` プレフィックス付き（M1, M2, ...）

### Step 3: Playwright撮影（自動）

```bash
# ローカルサーバーが起動済みであること（http://localhost:3000）
cd /Users/watanaberyouta/workspace/medical-device-mgmt

# 特定画面の撮影
node /Users/watanaberyouta/workspace/medical-device-mgmt/.claude/skills/screen-design-doc-generator/capture_design_screenshots.mjs --screen "{画面名}"

# 全画面撮影
node /Users/watanaberyouta/workspace/medical-device-mgmt/.claude/skills/screen-design-doc-generator/capture_design_screenshots.mjs
```

**出力:**
- `screenshots/{画面名}_PC.png`, `{画面名}_タブレット.png`, `{画面名}_スマホ.png`
- `screenshots/{画面名}_{モーダル名}_PC.png` 等（モーダルがある場合）
- `positions/{画面名}_positions.json`（セレクタヒントがある場合、自動抽出）

**認証フロー:**
- `needsLogin: false` → 未認証状態で撮影（ログイン画面等）
- `optimalRole: "admin@ship.com"` → SHIP全施設管理者でログイン→施設選択
- `optimalRole: "hospital-admin@hospital.com"` → 病院管理者でログイン→自動リダイレクト
- パスワード: 全ロール "あ"

### Step 4: 位置確認（半自動）

スクリーンショットをReadで読み込み、positions.jsonの座標が正しいか確認する。

```bash
# SSを読み込んで確認
Read: /Users/watanaberyouta/Desktop/画面設計書/screenshots/{画面名}_PC.png

# 位置データ確認
Read: /Users/watanaberyouta/Desktop/画面設計書/positions/{画面名}_positions.json
```

**セレクタヒントがない場合**: 手動でpositions.jsonを作成する。
```json
{
  "PC": {
    "1": {"x": 50, "y": 50, "width": 100, "height": 30},
    "2": {"x": 740, "y": 185, "width": 440, "height": 40}
  },
  "タブレット": {
    "1": {"x": 30, "y": 30, "width": 80, "height": 24}
  },
  "スマホ": {
    "1": {"x": 15, "y": 15, "width": 60, "height": 20}
  }
}
```

### Step 5: Excel生成（自動）

```bash
cd /Users/watanaberyouta/Desktop/画面設計書

# 特定画面のみ生成
python3 generate_all_v2.py --screen "{画面名}"

# 全画面生成
python3 generate_all_v2.py

# 左右分割レイアウト
python3 generate_all_v2.py --layout side-by-side
```

**Excelファイル構成:**
```
画面設計書.xlsx
├── 目次              # 全画面一覧
├── No.画像           # 1-30の番号マーカー画像
├── ログイン画面      # PC/タブレット/スマホのスクショ + 12カラム要素一覧
├── メニュー画面      # ベース画面 + モーダルセクション
└── ...
```

**シートレイアウト（stacked, デフォルト）:**
1. スクリーンショット（PC/タブレット/スマホ、番号マーカー付き）を縦に配置
2. その下に要素一覧テーブル（12カラム）
3. モーダルがある場合、さらに下にモーダルセクション（緑ヘッダー）

**スクリーンショットのスケール:**
| デバイス | スケール |
|----------|----------|
| PC | 50% |
| タブレット | 60% |
| スマホ | 70% |

### Step 6: 完了報告

```
## {画面名} 設計書作成完了

### スクリーンショット
| デバイス | 元サイズ | 表示サイズ |
|----------|----------|------------|
| PC | 1920x1080 | 960x540 |
| タブレット | 768x1024 | 460x614 |
| スマホ | 375x812 | 262x568 |

### 要素数
{N}要素（12カラム v2形式）

### 位置データ
{自動抽出 or 手動} / {N}要素分
```

## 使用例

```
ログイン画面の設計書を作成して
```

```
app/login/page.tsxの画面設計書を作成して
```

```
全画面の画面設計書を一括生成して
```

## 依存パッケージ

```bash
# Playwright（撮影）
npm install playwright
npx playwright install chromium

# Python（Excel生成）
pip install openpyxl Pillow
```

## 関連ファイル

- [ELEMENT_COLUMNS.md](ELEMENT_COLUMNS.md) - 12カラム判定ルール
- [ELEMENT_TYPES.md](ELEMENT_TYPES.md) - 要素種別定義
- [generate_excel_v2.py](generate_excel_v2.py) - Excel生成スクリプト（12カラム対応）
- [capture_design_screenshots.mjs](capture_design_screenshots.mjs) - Playwright撮影スクリプト
- `/Users/watanaberyouta/Desktop/画面設計書/screen_configs.json` - 全画面撮影設定
- `/Users/watanaberyouta/Desktop/画面設計書/generate_all_v2.py` - 一括生成スクリプト
