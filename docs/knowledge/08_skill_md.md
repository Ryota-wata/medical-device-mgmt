# 第8章：Skill.mdによる品質向上

## 8.1 Skill.mdとは

### 概要

Skill.mdは、Claude Codeに特定の専門知識やルールセットを追加するためのファイルです。CLAUDE.mdがプロジェクト全体のルールを定義するのに対し、Skill.mdは特定の作業領域に特化したルールを定義します。

### 役割と効果

| 役割 | 効果 |
|------|------|
| **専門知識の追加** | UI設計、アクセシビリティなどの専門ルール |
| **品質基準の統一** | 一貫した品質のアウトプット |
| **レビュー自動化** | コードレビューの観点を明文化 |
| **ナレッジの蓄積** | チームの知見を形式知化 |

### CLAUDE.mdとの違い

| 項目 | CLAUDE.md | Skill.md |
|------|-----------|----------|
| 配置場所 | プロジェクトルート | `.claude/commands/` |
| 読み込み | 自動（常時） | 明示的に呼び出し |
| 用途 | プロジェクト全体ルール | 特定作業のルール |
| 粒度 | 広範囲・概要レベル | 特定領域・詳細レベル |

---

## 8.2 Skillをプロンプトで作成する

### Step 1: 初期Skillの生成

品質課題に応じたSkillを生成させます。

```
UI品質を担保するためのSkillを作成して。
.claude/commands/ui-skills.md に配置して。

【含めてほしいルール】
- コンポーネントのアクセシビリティ
- タイポグラフィ
- デザインの一貫性

【フォーマット】
- MUST: 必須ルール
- SHOULD: 推奨ルール
- NEVER: 禁止事項
```

### 実行例（UI Skill）

```
UI品質を担保するためのSkillを作成して。
.claude/commands/ui-skills.md に配置して。

【含めてほしいルール】
- アイコンボタンのaria-label
- 破壊的アクションの確認ダイアログ
- h-screen禁止
- 見出しのtext-balance
- データ値のtabular-nums
- グラデーション禁止
- 空の状態の次アクション
```

---

### Step 2: 他のSkillも同様に生成

```
レイアウト品質を担保するためのSkillを作成して。
.claude/commands/layout-skills.md に配置して。

【含めてほしいルール】
- 入力幅のルール（郵便番号、電話、メール等）
- スペーシングのルール（8pxの倍数）
- グリッド・フレックスのルール
```

```
デザイン品質を担保するためのSkillを作成して。
.claude/commands/design-quality-skills.md に配置して。

【含めてほしいルール】
- 色のコントラスト比
- フォントサイズスケール
- シャドウ・角丸のスケール
```

```
UXフローを担保するためのSkillを作成して。
.claude/commands/ux-flow-skills.md に配置して。

【含めてほしいルール】
- Primary CTAは1画面に1つ
- ボタンラベルは具体的な動詞
- 完了画面のルール
- 確認ダイアログのルール
```

---

## 8.3 問題発生時のルール追加

### 繰り返し発生する問題をルール化

開発中に品質問題が発生したら、該当するSkillにルールを追加します。

```
ui-skills.md に以下のルールを追加して。

【発生した問題】
input要素でペーストがブロックされていた

【追加するルール】
- NEVER block paste in `input` or `textarea` elements
```

```
layout-skills.md に以下のルールを追加して。

【発生した問題】
全ての入力欄が同じ幅になっていた

【追加するルール】
- NEVER make all input fields the same width
- MUST match input width to expected data length
```

---

### レビュー指摘をルール化

```
レビューで以下の指摘があった。
該当するSkillにルールとして追加して。

【指摘内容】
- フォームのリセットボタンが送信ボタンの隣にあり、誤操作しやすい
- 処理完了後にフィードバックなしで画面遷移している

【追加先】
ux-flow-skills.md
```

---

## 8.4 Skillを使ったレビュー

### 画面モックのレビュー

```
作成した画面を ui-skills でレビューして。
```

または

```
/ui-skills app/login/page.tsx
```

### 複数Skillでのレビュー

```
作成した画面を以下のSkillでレビューして。
- ui-skills
- layout-skills
- design-quality-skills

問題があれば修正して。
```

### 全画面一括レビュー

```
app/配下の全画面を ui-skills でレビューして。
問題のある画面をリストアップして。
```

---

## 8.5 Skillの確認・整理

### 現在のSkill一覧を確認

```
.claude/commands/ 配下のSkillを一覧表示して。
各Skillの主なルールを要約して。
```

### Skillの整理・統合

```
ui-skills.md のルールを整理して。

【やってほしいこと】
- 重複するルールを統合
- カテゴリ分けを見直し
- 読みやすく整形
```

### Skillの分割

```
ui-skills.md が大きくなってきた。
アクセシビリティに関するルールを
.claude/commands/a11y-skills.md として分離して。
```

---

## 8.6 本プロジェクトで使用したSkillの例

### ui-skills（UI品質ルール）

```markdown
## Components
- MUST add an `aria-label` to icon-only buttons
- MUST use an `AlertDialog` for destructive or irreversible actions
- NEVER use `h-screen`, use `h-dvh`

## Typography
- MUST use `text-balance` for headings
- MUST use `tabular-nums` for data

## Design
- NEVER use gradients unless explicitly requested
- MUST give empty states one clear next action
```

### layout-skills（レイアウトルール）

```markdown
## 入力幅
- 郵便番号: 100px
- 電話: 150px
- メール: 280px
- 日付: 150-180px
- 数値: 60-80px

## スペーシング
- 8px の倍数を使用
- セクション間: 32-48px
- グループ間: 16-24px
- 項目間: 8-16px
```

### ux-flow-skills（UXフロー）

```markdown
## アクション配置
- Primary CTA は1画面に1つ
- ボタンラベルは具体的な動詞（「OK」「はい」禁止）

## 完了画面
- 「次に何をすべきか」を必ず示す
- 単なる「成功！」は不可

## 確認パターン
- 確認ラベルは結果を要約（「レコードを削除」等）
- 「はい」/「いいえ」禁止
```

---

## 8.7 Skill運用のベストプラクティス

### Do（推奨）

| 項目 | 理由 |
|------|------|
| 問題発生時にルール追加 | 再発防止になる |
| MUST/SHOULD/NEVERを使い分け | 優先度が明確に |
| 具体的な数値を記載 | 解釈のブレを防止 |
| 定期的に整理 | 可読性を維持 |

### Don't（非推奨）

| 項目 | 理由 |
|------|------|
| 最初から完璧を目指す | 過剰なルールは邪魔になる |
| 長すぎる説明 | 読み込みに時間がかかる |
| Skillを増やしすぎる | 管理が困難になる |
| CLAUDE.mdと重複 | どちらを見るか迷う |

### 推奨するSkill数

```
推奨: 3-5個
- ui-skills（UI品質）
- layout-skills（レイアウト）
- design-quality-skills（デザイン品質）
- ux-flow-skills（UXフロー）

多すぎると管理が困難になるため、
関連するルールは1つのSkillにまとめる。
```
