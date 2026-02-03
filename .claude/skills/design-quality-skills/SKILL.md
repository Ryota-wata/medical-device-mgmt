---
name: design-quality-skills
description: デザイン品質（色体系・タイポグラフィ・シャドウ・一貫性）をレビューし、問題を検出・修正する
allowed-tools: Read, Edit, Write, Glob, Grep
---

# Design Quality Skills

デザイン品質に特化したコードレビュー・修正スキルです。色体系、タイポグラフィ階層、シャドウ深度、border-radius、視覚的ヒエラルキー、一貫性パターンをチェックします。

## 使い方

### レビューのみ
```
app/order/page.tsx をDesign Quality Skillsでレビューして
```

### レビュー+修正
```
app/order/page.tsx をDesign Quality Skillsでレビューして修正して
```

## 対応フロー

### Step 1: 対象ファイルの読み込み
```bash
Read: app/order/page.tsx
```

### Step 2: 制約に基づくレビュー
各カテゴリの制約に対して違反をチェックし、以下の形式で出力:

```markdown
### 違反事項

#### 1. [カテゴリ名] - [制約の要約]
**違反箇所:**
\`\`\`tsx
// 問題のあるコード
\`\`\`

**問題:** [MUST/SHOULD/NEVER] [制約内容]

**修正案:**
\`\`\`tsx
// 修正後のコード
\`\`\`
```

### Step 3: サマリー出力
```markdown
### サマリー

| カテゴリ | 違反数 |
|----------|--------|
| 色体系 | X |
| タイポグラフィ | X |
| シャドウ | X |
| border-radius | X |
| 視覚的ヒエラルキー | X |
| 一貫性 | X |
| ステータス色 | X |
| **合計** | **X** |
```

### Step 4: 修正実行（依頼された場合）
Editツールで修正を適用

---

## 制約一覧

### 色体系（Color System）

#### パレット構成
- **MUST** 色を3カテゴリに分けて定義する: (1) グレースケール（8〜10段階）、(2) プライマリ色（1〜2色相、各5〜10段階）、(3) セマンティック色（success/warning/error/info、各5〜10段階）
- **MUST** 全色をトークンとして事前定義する。`lighten()` や `darken()` で場当たり的に生成しない
- **MUST** セマンティックなトークン名を使う（`primary`, `danger`, `success`, `warning`, `info`, `surface`）。`blue-500` のような色相名直接指定はテーマ変更時に破綻する
- **SHOULD** 1画面で使う色相は2〜3色に制限する

#### コントラスト・可読性
- **MUST** 通常テキスト（24px未満）は背景とのコントラスト比 **4.5:1** 以上を確保する（WCAG AA）
- **MUST** 大テキスト（24px以上、または太字18.5px以上）はコントラスト比 **3:1** 以上を確保する
- **MUST** UIコンポーネント（ボーダー、アイコン等）はコントラスト比 **3:1** 以上を確保する
- **NEVER** 純粋な黒 `#000000` をテキストや背景に使わない。ニアブラック（例: `#111827`, `#1a202c`）を使う
- **SHOULD** 純粋な白 `#FFFFFF` より僅かにトーンを落とした背景（例: `#F9FAFB`, `#FAFAFA`）を検討する

#### 色の使い方
- **NEVER** 色付き背景上のテキストを単純にグレーにしない。同じ色相で彩度を下げ明度を調整する
- **MUST** ニュートラルカラーの暖色/寒色を統一する。暖色系の背景に寒色系のグレーを混ぜない
- **SHOULD** メインカラーをドミナントに、アクセントカラーをシャープに使う。均等配分より強弱をつけた方が効果的

### タイポグラフィ（Typography）

#### サイズスケール
- **MUST** 本文テキストは最低 `16px` を確保する
- **MUST** UIに表示するテキストの最小サイズは `12px` とする。それ未満は使わない
- **MUST** フォントサイズは事前定義したスケールから選ぶ。推奨スケール: `12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72px`
- **SHOULD** 1画面で使うフォントサイズは4〜5種類に制限する

#### ウェイト階層
- **MUST** ウェイトを階層ツールとして使う: 見出し `700`、小見出し/ラベル `500〜600`、本文 `400`
- **NEVER** `400`（Regular）未満のウェイトをUIで使わない。テキストの重要度を下げるにはウェイトではなく色を薄くするかサイズを小さくする
- **SHOULD** インターフェース全体で使うウェイトは最大3種類に制限する（例: `400`, `600`, `700`）

#### 行の高さ・長さ
- **MUST** 本文の `line-height` は `1.4〜1.6` とする
- **SHOULD** 見出し・大きなテキストの `line-height` は `1.1〜1.25` とする（テキストが大きいほどタイトに）
- **SHOULD** 本文の行長は45〜75文字に制限する（`max-width` で制御）

### シャドウ（Shadow / Elevation）

#### シャドウスケール
- **MUST** 固定のシャドウスケール（5〜6段階）を定義し、全コンポーネントで共有する

| レベル | 用途 |
|--------|------|
| **sm** | ボタン、入力欄、小さなカード |
| **DEFAULT** | 通常のカード、浮き上がった要素 |
| **md** | ドロップダウン、ポップオーバー |
| **lg** | フローティングパネル、スティッキーヘッダー |
| **xl** | ダイアログ、モーダル |
| **2xl** | フルオーバーレイモーダル（最大エレベーション） |

#### シャドウルール
- **MUST** 光源の方向をインターフェース全体で統一する
- **MUST** 深度表現テクニック（シャドウ/ボーダー/背景色差）をインターフェース全体で統一する。シャドウベースとボーダーベースを理由なく混在させない
- **SHOULD** 各要素に2層のシャドウを重ねる: タイトな「接触」シャドウ + 大きな「アンビエント」シャドウ
- **NEVER** アドホックなシャドウ値を作らない。すべてのシャドウを定義済みレベルにマッピングする

### border-radius

#### スケール
- **MUST** border-radiusのトークンスケールを定義する

| トークン | 値 | 用途 |
|----------|----|------|
| `none` | 0px | データテーブル、厳格な業務UI |
| `sm` | 2px | 小さなバッジ、タグ |
| `md` | 4px | ボタン、入力欄、小カード（デフォルト） |
| `lg` | 8px | 中カード、ドロップダウン |
| `xl` | 12px | 大カード、モーダル |
| `2xl` | 16px | ヒーローセクション |
| `full` | 9999px | ピル、チップ、アバター |

#### ルール
- **MUST** ネストされた要素の radius は `内側radius = 外側radius - gap` で計算する。外側が `12px` でパディングが `8px` なら、内側は `4px`
- **MUST** インターフェース全体で一貫したトーンを維持する。フォーマル（`2〜4px`）かフレンドリー（`8〜12px`）か決めて統一する
- **SHOULD** 要素サイズに比例して radius をスケーリングする。大きな要素には大きい radius（`12〜16px`）、小さな要素には小さい radius（`2〜4px`）
- **NEVER** 定義済みスケール外の任意の radius 値を使わない

### 視覚的ヒエラルキー（Visual Hierarchy）

#### 優先度の表現
- **MUST** サイズを主要な階層ツールとして使う。重要な要素ほど大きく表示する
- **MUST** ボタンの視覚的重みを階層化する: Primary（塗りつぶし）、Secondary（アウトライン/ゴースト）、Tertiary（テキストのみ）
- **SHOULD** ミュートな背景に対して、注目させたい要素に明るい/彩度の高い色を使う
- **SHOULD** 高優先度の要素の周囲には十分な余白を確保する（余白が注目度を高める）

#### 複雑さのバランス
- **MUST** 複雑な背景（画像、パターン）の上にはシンプルな前景（クリーンなテキスト）を配置する。逆も同様。複雑 × 複雑は避ける
- **SHOULD** テキストの重要度を下げるには、ウェイトを落とすよりも色を薄くする方がレイアウトを崩さない

### 一貫性（Consistency）

#### 値の統一
- **MUST** 以下の値はすべて定義済みスケールから選択する:
  1. スペーシング（margin, padding, gap）
  2. カラーパレット（アドホックなHEX値を使わない）
  3. フォントサイズ・ウェイト
  4. シャドウレベル
  5. border-radius
- **MUST** ホバー・フォーカス・アクティブ・無効状態の変化ルールを全コンポーネントで統一する（例: ホバーで常に同じ割合だけ暗くする）
- **MUST** アイコンスタイルを統一する（全てアウトラインか全て塗りつぶし、同じ太さ、同じサイズグリッド）

#### 区切り・分離
- **SHOULD** 要素の分離にはボーダーよりスペーシング・背景色の違いを優先する
- **NEVER** 2つ以上のハードな区切り（ボーダー + 背景色変更、ボーダー + シャドウ境界）を隣接させない。視覚的ノイズになる

### ステータス色（Status Colors）

- **MUST** ステータス色を以下のセマンティックカテゴリで定義する:

| カテゴリ | 色相 | 用途 |
|----------|------|------|
| **success** | 緑系 | 完了、承認、正常 |
| **warning** | 黄/オレンジ系 | 注意、期限切れ間近 |
| **error/danger** | 赤系 | エラー、失敗、削除 |
| **info** | 青系 | 情報、ヒント |
| **neutral** | グレー系 | 無効、完了済み、アーカイブ |

- **MUST** ステータス色には色だけでなくアイコンやテキストを併用する（色覚異常への配慮）
- **SHOULD** 各ステータス色に対して背景用（薄い）とテキスト/アイコン用（濃い）の2段階以上を定義する

---

## よくある違反パターン

### 純粋な黒・白の使用
```tsx
// NG: 純黒と純白
style={{ color: '#000000', background: '#FFFFFF' }}

// OK: ニアブラック + オフホワイト
style={{ color: '#111827', background: '#F9FAFB' }}
```

### アドホックな色の乱立
```tsx
// NG: ファイルごとに異なるHEX値
style={{ color: '#5a6c7d' }}  // ファイルA
style={{ color: '#5b6d7e' }}  // ファイルB（ほぼ同じ）
style={{ color: '#6c757d' }}  // ファイルC

// OK: トークン化して統一
const colors = {
  textSecondary: '#6b7280',  // gray-500相当
};
style={{ color: colors.textSecondary }}
```

### ウェイト400未満の使用
```tsx
// NG: 細すぎるウェイト
style={{ fontWeight: 300 }}  // Light
style={{ fontWeight: 200 }}  // Extra Light

// OK: 色で重要度を下げる
style={{ fontWeight: 400, color: '#9ca3af' }}
```

### フォントサイズの散乱
```tsx
// NG: スケール外の値が混在
style={{ fontSize: '13px' }}
style={{ fontSize: '15px' }}
style={{ fontSize: '11px' }}
style={{ fontSize: '17px' }}

// OK: 定義済みスケールから選択
style={{ fontSize: '12px' }}  // xs
style={{ fontSize: '14px' }}  // sm
style={{ fontSize: '16px' }}  // base
style={{ fontSize: '18px' }}  // lg
```

### シャドウのアドホック定義
```tsx
// NG: コンポーネントごとにバラバラ
style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
style={{ boxShadow: '0 3px 10px rgba(0,0,0,0.12)' }}
style={{ boxShadow: '0 1px 5px rgba(0,0,0,0.2)' }}

// OK: 定数化したスケールから選択
const SHADOW = {
  sm:  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md:  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg:  '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl:  '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};
style={{ boxShadow: SHADOW.md }}
```

### border-radius のネスト計算ミス
```tsx
// NG: 外側も内側も同じ12px
<div style={{ borderRadius: '12px', padding: '8px' }}>
  <div style={{ borderRadius: '12px' }}>  {/* 内側が角に当たる */}
    ...
  </div>
</div>

// OK: 内側 = 外側 - padding
<div style={{ borderRadius: '12px', padding: '8px' }}>
  <div style={{ borderRadius: '4px' }}>  {/* 12 - 8 = 4 */}
    ...
  </div>
</div>
```

### ボタン階層の欠如
```tsx
// NG: 全ボタンが同じ視覚的重み
<button style={{ background: '#3498db', color: 'white' }}>保存</button>
<button style={{ background: '#27ae60', color: 'white' }}>下書き</button>
<button style={{ background: '#e74c3c', color: 'white' }}>キャンセル</button>

// OK: Primary / Secondary / Tertiary の階層
<button style={{ background: '#3498db', color: 'white' }}>保存</button>
<button style={{ background: 'white', color: '#3498db', border: '1px solid #3498db' }}>下書き</button>
<button style={{ background: 'transparent', color: '#6b7280' }}>キャンセル</button>
```

### ハードな区切りの重複
```tsx
// NG: ボーダー + 背景色変更が隣接
<div style={{ borderBottom: '1px solid #ddd', background: '#f5f5f5' }}>Header</div>
<div style={{ borderTop: '1px solid #ddd', background: '#ffffff' }}>Content</div>

// OK: 背景色の差だけで分離
<div style={{ background: '#f5f5f5', padding: '12px 16px' }}>Header</div>
<div style={{ background: '#ffffff', padding: '12px 16px' }}>Content</div>
```

---

## 数値リファレンス

| プロパティ | 推奨値 |
|-----------|--------|
| 本文フォントサイズ | 16〜18px |
| 最小フォントサイズ | 12px |
| フォントサイズスケール | 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72px |
| 1画面のフォントサイズ数 | 4〜5種 |
| フォントウェイト | 400, 500-600, 700（3種まで） |
| 本文 line-height | 1.4〜1.6 |
| 見出し line-height | 1.1〜1.25 |
| 行長 | 45〜75文字 |
| コントラスト比（通常テキスト） | 4.5:1以上 |
| コントラスト比（大テキスト） | 3:1以上 |
| コントラスト比（UIコンポーネント） | 3:1以上 |
| 色相あたりの段階数 | 8〜10段階 |
| シャドウレベル | 5〜6段階 |
| border-radiusスケール | 0, 2, 4, 8, 12, 16, 9999px |

---

## 関連リソース

- [Refactoring UI](https://www.refactoringui.com/) - カラーパレット・タイポグラフィ・シャドウの体系化
- [Anthony Hobday - Visual Design Rules](https://anthonyhobday.com/sideprojects/saferules/) - 安全に従えるビジュアルデザインルール
- [WCAG 2.1 - Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) - コントラスト比要件
- [Tailwind CSS - Box Shadow](https://tailwindcss.com/docs/box-shadow) - シャドウスケールの参照実装
- [Josh Comeau - Designing Beautiful Shadows](https://www.joshwcomeau.com/css/designing-shadows/) - 自然なシャドウの作り方
