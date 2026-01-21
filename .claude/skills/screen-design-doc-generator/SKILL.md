---
name: screen-design-doc-generator
description: 画面モックから①スクリーンショット取得、②要素採番、③Excel画面設計書を自動生成する。
allowed-tools: Read, Edit, Write, Bash, Glob, Grep
---

# 画面設計書自動生成スキル

画面モックファイル（page.tsx等）を解析し、スクリーンショット付きの画面設計書Excelを自動生成するスキルです。

## 出力物

| No | 出力物 | 内容 |
|----|--------|------|
| 1 | スクリーンショット | Puppeteerで画面キャプチャ（PNG）- PC/タブレット/スマホ |
| 2 | 要素一覧MD | 全UI要素の一覧（中間ファイル） |
| 3 | 要素位置MD | 各デバイスでの要素位置座標 |
| 4 | 画面設計書Excel | スクショ+No.マーカー / 要素一覧 |

## 出力先

```
/Users/watanaberyouta/Desktop/画面設計書/
├── 画面設計書.xlsx          # 全画面統合ファイル
├── screenshots/
│   ├── {画面名}_PC.png
│   ├── {画面名}_タブレット.png
│   └── {画面名}_スマホ.png
├── elements/
│   └── {画面名}_elements.md
└── positions/
    └── {画面名}_positions.md
```

## Excelファイル構成

```
画面設計書.xlsx
├── 目次           # 全画面一覧（ユーザー作成済み）
├── No.画像        # 1-30の番号マーカー画像
├── ログイン画面   # PC/タブレット/スマホのスクショ + 要素一覧
├── メニュー画面
└── ...
```

## 対応フロー

### Step 1: 目次から対象画面の情報取得

Excelの目次シートから画面情報を確認する。

```python
# 目次カラム構成
| 機能 | No | 画面名 | 使用目的 | 使用者 | 使用端末 | モックURL |
```

**使用端末の種類:**
- PC: 1920x1080
- タブレット: 768x1024
- スマホ: 375x812

### Step 2: 対象画面のソースコード確認

ユーザー指定の画面モックファイルを読み込み、UI要素を特定する。

```bash
# 例：ログイン画面
Read: app/login/page.tsx
```

### Step 3: スクリーンショット取得（デバイス別）

使用端末に合わせて複数サイズのスクリーンショットを取得する。

```bash
# PC版
node /Users/watanaberyouta/Desktop/medical-device-mgmt/.claude/skills/screen-design-doc-generator/capture_screenshot.js \
  --url "https://ryota-wata.github.io/medical-device-mgmt/login" \
  --output "/Users/watanaberyouta/Desktop/画面設計書/screenshots/ログイン画面_PC.png" \
  --width 1920 \
  --height 1080 \
  --wait 2000

# タブレット版
node ... --width 768 --height 1024 --output "...ログイン画面_タブレット.png"

# スマホ版
node ... --width 375 --height 812 --output "...ログイン画面_スマホ.png"
```

**オプション:**
| オプション | 説明 | デフォルト |
|------------|------|------------|
| --url | 完全なURL | 必須 |
| --output | 出力ファイルパス | 必須 |
| --width | ビューポート幅 | 1400 |
| --height | ビューポート高さ | 900 |
| --wait | 読み込み待機時間(ms) | 1000 |

### Step 4: 要素一覧MD作成

ソースコードからUI要素を抽出し、採番する。

`/Users/watanaberyouta/Desktop/画面設計書/elements/{画面名}_elements.md` に保存。

**フォーマット:**
```markdown
# {画面名} 要素一覧

## 要素一覧

| No | 要素名 | 要素種別 | 必須 | 機能説明 | 初期値 | バリデーション | 備考 |
|----|--------|----------|------|----------|--------|----------------|------|
| 1 | ロゴ | 画像 | - | 「SHIP」ロゴを表示 | SHIP | - | - |
| 2 | 画面タイトル | ラベル | - | 「医療機器管理システム」を表示 | - | - | - |
```

### Step 5: 要素位置MD作成（スクリーンショット確認必須）

**重要**: スクリーンショットをReadツールで読み込み、実際の画像を見て各要素の位置を特定する。

```bash
# スクリーンショットを読み込んで要素位置を確認
Read: /Users/watanaberyouta/Desktop/画面設計書/screenshots/{画面名}_PC.png
Read: /Users/watanaberyouta/Desktop/画面設計書/screenshots/{画面名}_タブレット.png
Read: /Users/watanaberyouta/Desktop/画面設計書/screenshots/{画面名}_スマホ.png
```

**位置特定のポイント:**
- 各要素の左上または中央付近の座標を特定
- 元画像のピクセル座標で指定（スケール前）
- ラベルは左端、入力フィールドやボタンは中央付近を指定

`/Users/watanaberyouta/Desktop/画面設計書/positions/{画面名}_positions.md` に保存。

**フォーマット:**
```markdown
# {画面名} 要素位置定義

## PC (1920x1080)

| No | デバイス | X | Y |
|----|----------|-----|-----|
| 1 | PC | 50 | 50 |
| 2 | PC | 740 | 185 |
| 3 | PC | 935 | 230 |

## タブレット (768x1024)

| No | デバイス | X | Y |
|----|----------|-----|-----|
| 1 | タブレット | 30 | 30 |
| 2 | タブレット | 160 | 175 |
| 3 | タブレット | 360 | 220 |

## スマホ (375x812)

| No | デバイス | X | Y |
|----|----------|-----|-----|
| 1 | スマホ | 15 | 15 |
| 2 | スマホ | 35 | 135 |
| 3 | スマホ | 165 | 175 |
```

**座標の目安（画面中央にカードがある場合）:**
| デバイス | 画面幅 | カード中央X | カード左端X |
|----------|--------|-------------|-------------|
| PC | 1920 | ~960 | ~740 |
| タブレット | 768 | ~384 | ~160 |
| スマホ | 375 | ~187 | ~35 |

### Step 6: Excel設計書シート生成

```python
import sys
sys.path.insert(0, '/Users/watanaberyouta/Desktop/medical-device-mgmt/.claude/skills/screen-design-doc-generator')

from openpyxl import load_workbook
from generate_excel import create_multi_device_sheet, parse_elements_md

# 既存のExcelファイルを読み込み
wb = load_workbook("/Users/watanaberyouta/Desktop/画面設計書/画面設計書.xlsx")

# 既存シートがあれば削除
if "ログイン画面" in wb.sheetnames:
    del wb["ログイン画面"]

# 要素一覧を読み込み
elements = parse_elements_md("/Users/watanaberyouta/Desktop/画面設計書/elements/ログイン画面_elements.md")

# シート作成（複数デバイス対応）
create_multi_device_sheet(
    wb,
    "ログイン画面",
    elements,
    "/Users/watanaberyouta/Desktop/画面設計書/screenshots",
    devices=['PC', 'タブレット', 'スマホ'],
    positions_dir="/Users/watanaberyouta/Desktop/画面設計書/positions"
)

# 保存
wb.save("/Users/watanaberyouta/Desktop/画面設計書/画面設計書.xlsx")
```

### Step 7: 完了報告

```
## ログイン画面 設計書作成完了

### スクリーンショット
| デバイス | サイズ |
|----------|--------|
| PC | 1920x1080 -> 960x540 |
| タブレット | 768x1024 -> 460x614 |
| スマホ | 375x812 -> 262x568 |

### 要素数
12要素（全てにNo.マーカー配置済み）
```

## 使用例

### 基本的な使い方

```
ログイン画面の設計書を作成して
```

### 特定のファイルを指定

```
app/login/page.tsxの画面設計書を作成して
```

## Excel設計書レイアウト

### シート: 目次

| 機能 | No | 画面名 | 使用目的 | 使用者 | 使用端末 | モックURL |

### シート: No.画像

1-30の赤い丸型番号マーカー画像。位置調整が必要な場合にコピー＆ペーストで使用。

### シート: {画面名}

**レイアウト:**
- 左側: スクリーンショット（PC/タブレット/スマホを縦に配置、番号マーカー付き）
- 右側: 要素一覧テーブル

**スクリーンショットのスケール:**
| デバイス | スケール |
|----------|----------|
| PC | 50% |
| タブレット | 60% |
| スマホ | 70% |

**要素一覧カラム:**
| No | 要素名 | 要素種別 | 必須 | 機能説明 | 初期値 | バリデーション | 備考 |

## 要素種別一覧

| 種別 | 説明 |
|------|------|
| ラベル | 静的テキスト |
| ボタン | クリック可能なボタン |
| プルダウン | セレクトボックス |
| タブ | タブ切り替え |
| テーブル | データ一覧 |
| テキスト入力 | 入力フィールド |
| パスワード入力 | パスワードフィールド |
| チェックボックス | チェック選択 |
| モーダル | ダイアログ |
| リンク | クリック可能なテキストリンク |
| 画像 | 画像・アイコン |
| 背景 | 背景要素 |
| コンテナ | グループ化要素 |
| メッセージ | エラー・通知メッセージ |

## 注意事項

1. **モックURL**
   - GitHub Pages: `https://ryota-wata.github.io/medical-device-mgmt/...`
   - ローカル: `http://localhost:3000/...`

2. **依存パッケージ**
   ```bash
   npm install puppeteer
   pip install openpyxl Pillow
   ```

3. **番号マーカーの配置（重要）**
   - **必ずスクリーンショットをReadで読み込んでから位置を決定**
   - positions.mdで定義した座標に自動配置
   - Excelのスケール: PC=50%, タブレット=60%, スマホ=70%
   - 位置がずれている場合はpositions.mdの座標を調整して再生成

4. **デバイス別スクリーンショット**
   - 目次の「使用端末」カラムに合わせて取得
   - PC/タブレット/スマホの3種類対応

5. **位置調整のイテレーション**
   - Excelを確認してズレがあれば:
     1. positions.mdの座標を修正
     2. Pythonスクリプトで再生成
     3. 確認を繰り返す

## 関連ファイル

- [ELEMENT_TYPES.md](ELEMENT_TYPES.md) - 要素種別の詳細定義
- [generate_excel.py](generate_excel.py) - Excel生成スクリプト
- [capture_screenshot.js](capture_screenshot.js) - スクリーンショット取得スクリプト
