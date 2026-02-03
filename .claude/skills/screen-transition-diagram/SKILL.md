---
name: screen-transition-diagram
description: 画面モックから全体画面遷移図をExcelファイルとして自動生成する
allowed-tools: Read, Edit, Write, Bash, Glob, Grep
---

# 画面遷移図自動生成スキル

画面モックのスクリーンショットから全体画面遷移図を自動生成し、PNG/Excelファイルとして出力します。

## 最重要要件

### 1. 画像解像度（高解像度必須）
```python
THUMB_W = 280      # サムネイル幅
THUMB_H = 180      # サムネイル高さ
GAP_X = 70         # 画面間の横間隔
GAP_Y = 80         # 画面間の縦間隔
GROUP_PAD = 35     # グループ内パディング
GROUP_HEADER = 50  # グループヘッダー高さ

# フォントサイズ
title_font = 36pt  # タイトル
group_font = 20pt  # グループ名
screen_font = 13pt # 画面名

# 出力
DPI = 300
矢印太さ = 3px
```

### 2. 重複完全禁止（最重要）

**絶対に以下の重複を発生させないこと：**

| 禁止項目 | 対策 |
|----------|------|
| グループ同士の重複 | 事前にサイズ計算し、左から順に配置 |
| スクリーンショット同士の重複 | GAP_X, GAP_Yで十分な間隔を確保 |
| 矢印と画像の重複 | 直角線で画像を迂回 |
| 矢印とグループの重複 | グループの外側（上/下）を通る経路設定 |

**レイアウト計算の基本パターン：**
```python
SCREEN_H = THUMB_H + 35  # サムネイル + ラベル

# グループサイズ計算
group_w = GROUP_PAD * 2 + THUMB_W * 画面数 + GAP_X * (画面数-1)
group_h = GROUP_PAD + GROUP_HEADER + SCREEN_H * 行数 + GAP_Y * (行数-1)

# グループ配置（左から順に）
group1_x = MARGIN
group2_x = group1_x + group1_w + GAP_X
group3_x = group2_x + group2_w + GAP_X
# ...
```

## 使用方法

### コマンド実行
```bash
python /Users/watanaberyouta/Desktop/medical-device-mgmt/.claude/skills/screen-transition-diagram/generate_final_diagram.py
```

### 自然言語での依頼
```
画面遷移図を更新して
```
```
新しい画面モックをアップロードしたので遷移図を再生成して
```

## 出力ファイル

| ファイル | パス |
|----------|------|
| PNG | `/Users/watanaberyouta/Desktop/画面設計書/全体画面遷移図.png` |
| Excel | `/Users/watanaberyouta/Desktop/画面設計書/全体画面遷移図.xlsx` |

## 入力ファイル

| ファイル | パス |
|----------|------|
| スクリーンショット | `/Users/watanaberyouta/Desktop/画面設計書/screenshots/{画面名}_PC.png` |

## 現在の画面構成

### 認証
- ログイン → PW再設定

### メニュー
- メニュー画面（各グループへ分岐）

### 個体管理リスト作成（グレー背景）
1. オフライン準備 → 調査場所入力 → 現有品調査
2. 登録内容修正
3. 資産台帳取込 → マスタ選択
4. データ突合 → 固定資産台帳
5. ラベル発行 → プレビュー

### 資産管理（黄色背景）
- 資産一覧 → 資産カルテ
- 資産一覧 ↓ 棚卸

### 編集リスト（黄色背景）
- 編集リスト → 見積管理へ

### 見積・発注契約管理（黄色背景）
見積グループ → 見積登録 → OCR確認 → AI判定 → 個体AI判定 → 金額按分 → 登録確認

### マスタ管理（青色背景）
- 施設マスタ
- 資産マスタ
- SHIP部署
- 個別部署
- ユーザー管理

## スクリーンショットマッピング

```python
SCREENSHOTS = {
    'login': 'ログイン画面_PC.png',
    'password-reset': 'パスワード再設定URL送信画面_PC.png',
    'main': 'メニュー画面_PC.png',
    'qr-issue': 'ラベル発行画面_PC.png',
    'qr-print': 'ラベルプレビュー画面_PC.png',
    'offline-prep': 'オフライン準備画面_PC.png',
    'survey-location': 'オフライン準備画面_PC.png',
    'asset-survey': 'オフライン準備画面_PC.png',
    'registration-edit': '登録内容修正画面_PC.png',
    'asset-import': '資産台帳取込画面_PC.png',
    'asset-matching': '資産マスタ選択画面_PC.png',
    'data-matching': 'データ突合画面_PC.png',
    'ledger': '固定資産台帳（未突合）_PC.png',
    'asset-list': '資産一覧画面_PC.png',
    'asset-karte': '資産カルテ画面_PC.png',
    'edit-list': '編集リスト画面_PC.png',
    'quotation-group': '見積書依頼グループタブ画面_PC.png',
    'quotation-modal': '見積書登録モーダル_PC.png',
    'ocr-confirm': 'OCR明細確認画面_PC.png',
    'ai-category': '見積登録（購入）AI判定確認_PC.png',
    'ai-item': '見積登録（購入）個体品目AI判定_PC.png',
    'price-allocation': '見積登録（購入）個体登録及び金額按分_PC.png',
    'registration-confirm': '見積登録（購入）登録確認_PC.png',
    'inventory': '棚卸画面_PC.png',
    'facility-master': '施設マスタ一覧画面_PC.png',
    'asset-master': '資産マスタ一覧画面_PC.png',
    'department-master': 'SHIP部署マスタ一覧画面_PC.png',
    'hospital-master': '個別部署マスタ一覧画面_PC.png',
    'user-management': 'ユーザー一覧画面_PC.png',
}
```

## 更新手順

### 1. スクリーンショット更新のみの場合
```bash
# 新しいスクリーンショットをscreenshots/に配置後
python generate_final_diagram.py
```

### 2. 新しい画面を追加する場合

1. `SCREENSHOTS`辞書に新画面を追加
2. グループ内のサブフロー定義に追加
3. グループサイズを再計算
4. 必要に応じてキャンバスサイズを拡大
5. 生成して重複がないことを確認

### 3. 画面構成を変更する場合

1. グループ定義を更新
2. サイズ計算を全て再計算
3. 矢印の経路を調整（重複回避）
4. 生成して全体を確認

## 重複が発生した場合のトラブルシューティング

### 画像同士が重なる
```python
# GAP_X, GAP_Yを増やす
GAP_X = 70 → 90
GAP_Y = 80 → 100
```

### グループ同士が重なる
```python
# グループ間の間隔を増やす
group2_x = group1_x + group1_w + GAP_X  # GAP_Xを大きく
```

### 矢印がグループを横切る
```python
# 迂回経路を設定
bypass_y = row2_y + kotai_h + 35  # グループの下を通る
draw.line([(from_x, from_y), (from_x, bypass_y)])  # 下へ
draw.line([(from_x, bypass_y), (to_x, bypass_y)])  # 横へ
draw.line([(to_x, bypass_y), (to_x, to_y)])        # 上/下へ
```

## 色定義

```python
COLORS = {
    'bg': (255, 255, 255),        # 背景（白）
    'arrow': (200, 80, 80),       # 矢印（赤）
    'gray': (235, 235, 235),      # データ準備系
    'yellow': (255, 255, 210),    # 業務機能系
    'blue': (230, 245, 255),      # マスタ管理系
    'green': (230, 250, 230),     # 棚卸系
    'outline': (180, 180, 180),   # 枠線
    'text': (40, 40, 40),         # テキスト
}
```

## 依存パッケージ

```bash
pip install Pillow openpyxl
```

## 関連ファイル

- `generate_final_diagram.py` - メイン生成スクリプト（これを使用）
- その他の`generate_*.py` - 過去の試作版（使用しない）
