---
name: layout-skills
description: レイアウト品質をレビューし、フォーム・グリッド・スペーシングの問題を検出・修正する
allowed-tools: Read, Edit, Write, Glob, Grep
---

# Layout Skills

レイアウト品質に特化したコードレビュー・修正スキルです。フォームの入力幅、グリッド/フレックスの使い方、スペーシング、密度バランスなどをチェックします。

## 使い方

### レビューのみ
```
app/order/page.tsx をLayout Skillsでレビューして
```

### レビュー+修正
```
app/order/page.tsx をLayout Skillsでレビューして修正して
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
| 入力幅 | X |
| グリッド/フレックス | X |
| スペーシング | X |
| 密度・バランス | X |
| ラベル配置 | X |
| グルーピング | X |
| レスポンシブ | X |
| テーブル | X |
| **合計** | **X** |
```

### Step 4: 修正実行（依頼された場合）
Editツールで修正を適用

---

## 制約一覧

### 入力幅（Input Sizing）

入力欄の幅は、期待される入力内容の長さを視覚的に示すべきである。

- **MUST** 入力フィールドの幅は期待されるデータ長に合わせる
  - 郵便番号: `100px` 程度
  - 電話番号: `150px` 程度
  - メールアドレス: `280px` 程度
  - 人名・会社名: `200px`〜`280px`
  - 住所: `400px`〜`100%`
  - 日付（`type="date"`）: `150px`〜`180px`
  - 月（`type="month"`）: `140px`〜`160px`
  - 数値（数量・年数）: `60px`〜`80px`
  - セレクトボックス: 最長選択肢が収まる幅 + `24px`（矢印分）
- **MUST** `max-width` を設定して大画面でも入力欄が伸びすぎないようにする
- **NEVER** フォーム入力欄に `width: 100%` や `1fr` を無制限に適用しない（`max-width` なしの場合）
- **NEVER** すべての入力欄を同じ幅にしない（内容の長さが明らかに異なる場合）
- **SHOULD** 同じ意味・同じデータ型の入力欄は同じ幅で揃える

### グリッド/フレックス（Grid & Flex）

- **MUST** フォームのグリッドで `1fr` を使う場合は `max-width` を併用する
- **MUST** フォームの2カラム配置では左右カラムの項目数と密度のバランスを取る
- **SHOULD** 関連の薄い項目を無理に同一グリッド行に押し込めない（独立行を使う）
- **SHOULD** フォームレイアウトにはグリッドよりフレックスを優先する（項目数が行ごとに異なる場合）
- **NEVER** `gridTemplateColumns: 'auto 1fr auto 1fr'` のように自動伸長するカラムをフォーム入力に使わない
- **NEVER** `display: grid` と `display: flex` を理由なく混在させない（同一セクション内）

### スペーシング（Spacing）

8pxベースのスペーシンググリッドを基本とする。

- **MUST** スペーシングは `8px` の倍数を使用する（`8px`, `16px`, `24px`, `32px`...）
  - 例外: テキストとの微調整で `4px` は許容
- **MUST** セクション間の余白 > グループ間の余白 > 項目間の余白 の階層を守る
  - セクション間: `32px`〜`48px`
  - グループ間: `16px`〜`24px`
  - 項目間（垂直）: `8px`〜`16px`
  - ラベルと入力間: `4px`〜`8px`
- **SHOULD** `gap` プロパティを優先し、個別の `margin` は避ける
- **NEVER** 同一セクション内で異なるスペーシング値を理由なく混在させない
- **NEVER** `margin` と `padding` の両方で同じ目的の余白を作らない

### 密度・バランス（Density & Balance）

- **MUST** 1行に配置する入力項目は3つ以下に制限（ラベル含まず）
- **MUST** 行内の入力項目の合計幅がコンテナ幅の80%を超えない
- **SHOULD** 左寄せレイアウトでは右側に意図的な余白を残す（コンテンツが呼吸できるように）
- **SHOULD** 情報密度が高いセクションと低いセクションが隣接する場合、セクション区切りを明確にする
- **NEVER** ラベルと入力欄のペアが画面幅いっぱいに引き伸ばされないようにする

### ラベル配置（Label Placement）

- **MUST** ラベル配置はセクション内で統一する（上配置/左配置を混在させない）
- **SHOULD** 入力項目が少ない（5項目以下の）フォームでは上配置ラベルを使用する
- **SHOULD** データ入力が多い業務フォーム（6項目以上）では左配置ラベルを検討する
- **SHOULD** 左配置ラベルの幅は固定値（`80px`〜`120px`）で揃える
- **NEVER** ラベルテキストが折り返されるほど狭い幅を設定しない

### グルーピング（Grouping）

- **MUST** 関連する入力項目はグループ化する（視覚的な区切りまたは近接配置）
- **MUST** グループには見出しまたは視覚的な区切りを設ける（線、背景色、余白）
- **SHOULD** 条件付きで表示/非表示になる項目は、トリガーとなる入力の近くに配置する
- **SHOULD** 依存関係のある入力（例: リース会社→開始日→年数）は同一行に配置する
- **NEVER** 論理的に無関係な項目を同じグループ・同じ行に配置しない

### レスポンシブ（Responsive）

- **MUST** フォームは `768px` 以下で1カラムにフォールバックする
- **SHOULD** 固定幅の入力欄には `min-width` と `max-width` を設定する
- **SHOULD** テーブルを含むフォームでは、テーブル部分に `overflow-x: auto` を設定する
- **NEVER** フォームコンテナに固定の `px` 幅を設定しない（`max-width` は可）
- **NEVER** 入力欄が `320px` 未満の画面幅ではみ出さないようにする

### テーブル（Table Layout）

- **MUST** 金額・数量カラムは右寄せ + `tabular-nums`
- **MUST** テーブルカラム幅は内容に応じて設定する（`auto` のみに頼らない）
- **SHOULD** テキストが長いカラムのみ `1fr` や `auto` で伸長を許容する
- **SHOULD** 操作カラム（ボタン列）は固定幅にする
- **NEVER** すべてのカラムを均等幅にしない（内容が明らかに異なる場合）

---

## よくある違反パターン

### 1fr の無制限使用
```tsx
// NG: 大画面で入力欄が700px以上に伸びる
<div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr' }}>
  <label>会社名</label>
  <input />  {/* 画面幅に応じて無制限に伸びる */}
</div>

// OK: 固定幅で内容に合った入力欄
<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
  <label style={{ width: '100px', flexShrink: 0 }}>会社名</label>
  <input style={{ width: '280px' }} />
</div>
```

### すべての入力欄が同じ幅
```tsx
// NG: 郵便番号もメールも同じ300px
<input name="zip" style={{ width: '300px' }} />
<input name="email" style={{ width: '300px' }} />

// OK: データ長に応じた幅
<input name="zip" style={{ width: '100px' }} />
<input name="email" style={{ width: '280px' }} />
```

### スペーシングの不統一
```tsx
// NG: 10px, 15px, 20px が混在
<div style={{ marginTop: '10px' }}>...</div>
<div style={{ marginTop: '15px' }}>...</div>
<div style={{ marginTop: '20px' }}>...</div>

// OK: 8px グリッドに統一
<div style={{ marginTop: '8px' }}>...</div>
<div style={{ marginTop: '16px' }}>...</div>
<div style={{ marginTop: '24px' }}>...</div>
```

### 無関係な項目を同じ行に押し込む
```tsx
// NG: 発注形態と検収書は関連が薄い
<div style={{ display: 'grid', gridTemplateColumns: '100px 200px 100px 200px' }}>
  <label>発注形態</label>
  <select>...</select>
  <label>検収書</label>
  <select>...</select>
</div>

// OK: 独立した行にする
<div style={{ display: 'flex', gap: '16px' }}>
  <label>発注形態</label>
  <select>...</select>
</div>
<div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
  <label>検収書</label>
  <select>...</select>
</div>
```

### ラベル幅の不統一
```tsx
// NG: ラベル幅がバラバラ
<label style={{ width: '80px' }}>名前</label>
<label style={{ width: '120px' }}>メールアドレス</label>
<label style={{ width: '100px' }}>電話番号</label>

// OK: 同一セクション内で統一
<label style={{ width: '120px' }}>名前</label>
<label style={{ width: '120px' }}>メールアドレス</label>
<label style={{ width: '120px' }}>電話番号</label>
```

### 条件付き項目がトリガーから離れている
```tsx
// NG: リース選択がページ上部、リース詳細が下部
<div>発注形態: <select>リース</select></div>
{/* ... 他の項目が10行 ... */}
<div>リース会社: <input /></div>

// OK: トリガーの直後に配置
<div>発注形態: <select>リース</select></div>
{isLeaseType && (
  <div style={{ marginTop: '8px' }}>
    リース会社: <input />
    開始日: <input />
    年数: <input />
  </div>
)}
```

---

## 関連リソース

- [Andrew Coyle: Design Better Input Fields](https://coyleandrew.medium.com/) - 入力幅のベストプラクティス
- [Interaction Design Foundation: UI Form Design](https://www.interaction-design.org/literature/article/ui-form-design) - フォームレイアウト設計
- [8-Point Grid System](https://spec.fm/specifics/8-pt-grid) - スペーシング基準
