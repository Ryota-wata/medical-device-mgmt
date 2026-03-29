---
name: figma-reflection
description: Figmaの画面デザイン画像を読み取り、既存モックのレイアウト・配色のみを更新する。機能・テキスト・振る舞いは一切変えない。
allowed-tools: Read, Edit, Write, Bash, Glob, Grep
---

# Figmaデザイン反映スキル

## 鉄則

| 変えてよい | 変えてはいけない |
|---|---|
| 配置・レイアウト構造 | テキスト（ラベル・見出し・ボタン文言・プレースホルダー） |
| 配色・背景色・ボーダー | state変数・ハンドラー・ロジック |
| 余白・角丸・シャドウ | 要素の追加・削除 |
| アイコンスタイル（emoji→SVG等） | 振る舞い（sticky, fixed, モーダル, 条件表示等） |
| インラインスタイル→Tailwind CSS | 遷移先・ルーティング |

**Figmaにあっても現モックにない要素は追加しない。現モックにあってもFigmaにない要素は削除しない。**

---

## 画像の命名規則

**PNGファイル名 = `app/` 直下のルートフォルダ名**

```
design/input/
  login.png              → app/login/page.tsx
  survey-location.png    → app/survey-location/page.tsx
```

サフィックス: `login_エラー.png` → `detail-エラー.png`（状態バリアント）

マッチしない場合 `distribute.mjs` が有効名一覧を表示する。

---

## ワークフロー（全自動・途中確認不要）

### Step 1: 現モック棚卸し

対象の `page.tsx` を読み、以下をリスト化する。これが**保持チェックリスト**になる。

- **テキスト**: 見出し、ラベル、ボタン文言、プレースホルダー
- **state変数**: 全useState/useMemo
- **振る舞い**: sticky/fixed/モーダル/条件表示
- **UI部品**: input/select/checkbox/textarea/button の種類と数
- **ナビゲーション**: 各ハンドラーの遷移先

### Step 2: Figma読み取り

`design/screens/(画面名)/full.png` を読み、**レイアウトと配色のみ**抽出する。

- レイアウト構造（ヘッダーパターン、カード構造、グリッド列数）
- 配色・ボーダー・余白・角丸・シャドウ
- アイコンスタイル

**Figma内のテキストは参照しない。**

### Step 3: 差分チェック

| 状況 | 判定 |
|---|---|
| Figmaにあるが現モックにない要素 | 追加しない |
| 現モックにあるがFigmaにない要素 | 削除しない |
| テキストが異なる | 現モックを使う |
| レイアウトが異なる | Figmaを適用 |
| 振る舞いが現モックにある | 必ず維持 |

### Step 4: 実装

Step 3の判定に基づき `page.tsx` を書き換える。CLAUDE.mdの全ルールに準拠。

### Step 5: 検証

1. **チェックリスト照合**: Step 1の全項目が保持されているか確認
2. **ビルド**: `npx tsc --noEmit` → `npm run build`
3. **完了報告**: 変更サマリー出力

---

## 複数画面の一括処理

`design/screens/` 内の `full.png` を持つ画面を検出し、各画面にStep 1〜5を順次実行。ビルド確認は最後にまとめて1回。
