# Figmaデザイン反映 手順書

## やることの全体像

```
node design/fetch-figma.mjs        ← Figma API で全画面PNG自動取得（30秒）
    ↓ design/screens/(画面名)/full.png に自動配置
Claude Code: 「Figma反映して」
    ↓ 現モックとFigmaデザインの差分一覧を提示
差分を確認し、反映を許可
    ↓
app/(画面名)/page.tsx にデザイン反映
```

---

## 0. 初回セットアップ（1回だけ）

### Figma Personal Access Token を取得

1. Figma を開く → 左上のアイコン → **Settings**
2. **Personal Access Tokens** → **Generate new token**
3. 名前を入力（例: `design-sync`）→ **Generate token**
4. 表示されたトークンをコピー（画面を閉じると二度と見られない）

### .env.figma を作成

```bash
cp .env.figma.example .env.figma
```

`.env.figma` を開いて値を入力:

```
FIGMA_TOKEN=figd_xxxxxxxxxxxxxxxx
FIGMA_FILE_KEY=xxxxxxxxxxxxxxxx
```

**ファイルキーの取得方法:**

FigmaファイルのURLからコピー:
```
https://www.figma.com/design/AbCdEfGhIjKlMnOp/ファイル名?...
                               ^^^^^^^^^^^^^^^^ ← この部分
```

### screen-map.json の初期マッピング

```bash
node design/fetch-figma.mjs --dry-run
```

`--dry-run` で実際のダウンロードはせず、マッピング結果だけ表示される。
未マッチのフレームが表示されたら `screen-map.json` に追記して再実行。

---

## 1. Figma から全画面PNGを一括取得する

```bash
node design/fetch-figma.mjs
```

これだけで:
1. Figma API からファイル構造を取得
2. 全フレームを `screen-map.json` でマッピング
3. PNGを一括ダウンロード
4. `design/screens/(画面名)/full.png` に自動配置

### オプション

```bash
# マッピング確認のみ（ダウンロードしない）
node design/fetch-figma.mjs --dry-run

# 特定ページのフレームだけ取得
node design/fetch-figma.mjs --page "ページ名"

# 解像度指定（デフォルト: 2x）
node design/fetch-figma.mjs --scale 1
```

### 未マッチのフレームが出た場合

スクリプトが `screen-map.json` への追記例を表示するので、コピーして追記:

```json
{
  "Figmaのフレーム名": "next-jsのディレクトリ名"
}
```

追記したら再実行すれば反映される。

---

## 1b. 手動エクスポート（代替手段）

Figma API が使えない場合の代替手段。

1. Figmaで対象フレームを複数選択（`Shift + クリック`）
2. 右パネル **Export** → **`PNG 1x`** → **Export N layers**
3. ダウンロードしたPNGを `design/input/` に移動
4. 振り分けスクリプトを実行:

```bash
node design/distribute.mjs
```

**ファイル名はFigmaのフレーム名が自動で付く**ので、`screen-map.json` に対応があればリネーム不要。

---

## 3. 差分を確認する

スクショを保存したら、まず **現在のモックとFigmaデザインの差分** を確認する。

### 基本の指示（コピーして使う）

```
design/screens/(画面名)/ のスクショと app/(画面名)/page.tsx を比較して、
デザインの差分を一覧で提示して。まだ反映はしないで。
```

### 例: ログイン画面の差分を確認する場合

```
design/screens/login/ のスクショと app/login/page.tsx を比較して、
デザインの差分を一覧で提示して。まだ反映はしないで。
```

### Claude Code が提示する差分の形式

以下のような一覧が返ってくる:

```
| # | 箇所 | 現モック | Figmaデザイン |
|---|------|---------|-------------|
| 1 | ヘッダー背景色 | slate-700 | #2c3e50（紺） |
| 2 | ボタン角丸 | rounded | rounded-lg |
| 3 | テーブルセル余白 | py-2 px-3 | py-3 px-4 |
```

### 差分を確認したら

- **全部反映してOK** → 「反映して」と指示
- **一部だけ反映** → 「#1 と #3 だけ反映して」のように番号で指定
- **反映しない** → 何もしない

---

## 4. デザインを反映する

差分確認で許可した内容を反映する。

### 全件反映の指示

```
design/screens/(画面名)/ のスクショを参照して、
app/(画面名)/page.tsx のデザインを反映して。
design/tokens.json のトークンを使うこと。
機能は変更せずスタイルのみ適用。
```

### 一部のみ反映の指示

```
先ほどの差分の #1, #3 のみ反映して。
design/tokens.json のトークンを使うこと。
機能は変更せずスタイルのみ適用。
```

### 変更点を補足したい場合

スクショだけでは伝わりにくい変更がある場合、`design/screens/(画面名)/notes.md` を作って補足:

```markdown
## 変更点
- ヘッダーの背景色を紺に変更
- ボタンの角丸を大きくした
- テーブルのセル余白を広げた
```

指示テンプレート:

```
design/screens/(画面名)/ のスクショと notes.md を参照して、
app/(画面名)/page.tsx のデザインを反映して。
design/tokens.json のトークンを使うこと。
機能は変更せずスタイルのみ適用。
```

---

## 5. 画面遷移を反映する

Figmaの Connector line で画面遷移が定義されている場合:

1. `design/transitions.md` に遷移を記入（書式は中に記載済み）
2. Claude Codeに指示:

```
design/transitions.md の画面遷移を反映して。
```

---

## 6. 共通の色やフォントが変わったとき

デザイナーから「ブランドカラーを変えた」等の連絡があった場合:

1. デザイナーに色コードを聞く
2. `design/tokens.json` の該当キーを更新
3. ターミナルで実行:

```bash
node design/sync-tokens.mjs
```

4. Claude Codeに指示:

```
design/tokens.json のカラーが更新されたので、
全画面のローカルCOLORS定数をtokens.jsonの値に合わせて更新して。
```

**主要トークンの対応表:**

| UI要素 | tokens.json のキー | 現在の値 |
|---|---|---|
| Primaryボタン背景色 | `colors.primary` | `#4a6fa5` |
| 危険ボタン背景色 | `colors.status.error` | `#dc2626` |
| 成功表示色 | `colors.status.success` | `#27ae60` |
| ページ背景色 | `colors.surface` | `#f9fafb` |
| テーブルヘッダー背景色 | `colors.sectionHeader` | `#4b5563` |
| 本文テキスト色 | `colors.text.primary` | `#1f2937` |
| 罫線色 | `colors.border.medium` | `#d1d5db` |
| 本文フォントサイズ | `fontSize.md` | `14px` |
| 角丸（小 / 中） | `borderRadius.sm` / `md` | `4px` / `8px` |

---

## 付録: Next.js 画面ディレクトリ一覧

Figmaのセクション名と対応がわからないときに参照。

### トップレベル画面

| ディレクトリ名 | 用途（推定） |
|---|---|
| `login` | ログイン |
| `password-reset` | パスワード再設定 |
| `facility-select` | 施設選択 |
| `main` | メイン（メニュー） |
| `asset-master` | 資産マスタ |
| `asset-detail` | 資産詳細 |
| `asset-import` | 資産台帳取込 |
| `asset-matching` | 資産マッチング |
| `asset-search-result` | 資産検索結果 |
| `asset-survey` | 資産棚卸 |
| `asset-survey-integrated` | 資産棚卸（統合） |
| `daily-inspection` | 日常点検 |
| `periodic-inspection` | 定期点検 |
| `inspection-prep` | 点検準備 |
| `inspection-result` | 点検結果 |
| `inventory` | 在庫管理 |
| `lending-available` | 貸出可能機器閲覧 |
| `lending-checkout` | 貸出・返却 |
| `disposal-task` | 廃棄契約管理タスク |
| `repair-task` | 修理タスク |
| `repair-request` | 修理依頼 |
| `maintenance-quote-registration` | 保守見積登録 |
| `quotation-management` | 見積管理 |
| `quotation-processing` | 見積処理 |
| `remodel-application` | リモデル申請 |
| `registration-edit` | 登録内容修正 |
| `history` | 履歴 |
| `survey-location` | 棚卸ロケーション |
| `offline-prep` | オフライン準備 |
| `qr-issue` | QR発行 |
| `qr-print` | QR印刷 |
| `user-management` | ユーザー管理 |
| `vendor-master` | ベンダーマスタ |
| `maker-maintenance-result` | メーカー保守結果 |
| `hospital-facility-master` | 病院施設マスタ |
| `ship-asset-master` | 出荷資産マスタ |
| `ship-department-master` | 出荷部門マスタ |
| `ship-facility-master` | 出荷施設マスタ |

### quotation-data-box 配下

| ディレクトリ名 | 用途（推定） |
|---|---|
| `quotation-data-box` | 見積データBOX（一覧） |
| `quotation-data-box/quotations` | 見積一覧 |
| `quotation-data-box/purchase-quotations` | 購入見積 |
| `quotation-data-box/remodel-quotations` | リモデル見積 |
| `quotation-data-box/asset-registration` | 資産登録 |
| `quotation-data-box/asset-provisional-registration` | 資産仮登録 |
| `quotation-data-box/registration-confirm` | 登録確認 |
| `quotation-data-box/category-registration` | カテゴリ登録 |
| `quotation-data-box/inspection-registration` | 点検登録 |
| `quotation-data-box/inspection-requests` | 点検依頼 |
| `quotation-data-box/order-registration` | 発注登録 |
| `quotation-data-box/rfq-process` | RFQ処理 |
| `quotation-data-box/purchase-management` | 購入管理 |
| `quotation-data-box/transfer-management` | 移管管理 |
| `quotation-data-box/disposal-management` | 廃棄管理 |
| `quotation-data-box/remodel-management` | リモデル管理 |
| `quotation-data-box/lending-management` | 貸出管理 |
| `quotation-data-box/maintenance-contracts` | 保守契約 |
| `quotation-data-box/price-allocation` | 価格配分 |
| `quotation-data-box/ocr-confirm` | OCR確認 |
| `quotation-data-box/item-ai-matching` | 品目AIマッチング |
| `quotation-data-box/repair-requests` | 修理依頼 |

### data-matching 配下

| ディレクトリ名 | 用途（推定） |
|---|---|
| `data-matching` | データマッチング |
| `data-matching/ledger` | 台帳 |
| `data-matching/me-ledger` | ME台帳 |

---

## ディレクトリ構成

```
design/
├── README.md              ← 本ファイル
├── tokens.json            ← デザイントークン（色・フォント等の定義）
├── transitions.md         ← 画面遷移定義
├── sync-tokens.mjs        ← tokens.json → constants.ts 同期スクリプト
└── screens/               ← 画面スクショ格納
    └── (画面名)/
        ├── full.png       ← 通常状態のスクショ（必須）
        ├── detail-xxx.png ← 特定状態のスクショ（任意）
        └── notes.md       ← 変更メモ（任意）
```
