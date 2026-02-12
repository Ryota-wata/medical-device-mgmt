# 付録

## A. 用語集

| 用語 | 説明 |
|------|------|
| **Claude Code** | Anthropic社が提供するAI搭載のCLIツール |
| **CLAUDE.md** | プロジェクトルートに配置するルール定義ファイル |
| **Skill.md** | 特定作業領域のルールを定義するファイル |
| **モック** | 実際の機能を持たない画面の試作品 |
| **App Router** | Next.js 13以降の新しいルーティング方式 |
| **Zustand** | 軽量なReact状態管理ライブラリ |
| **GitHub Pages** | GitHubが提供する静的サイトホスティング |
| **GitHub Actions** | GitHubのCI/CD機能 |
| **静的エクスポート** | Next.jsでHTMLファイルを生成する機能 |
| **レスポンシブ** | 画面サイズに応じてレイアウトが変化する設計 |

---

## B. プロンプトテンプレート集（コピペ用）

### B.1 プロジェクト初期化

```
Next.js + TypeScript + Tailwind CSSでプロジェクトを初期化して。

【プロジェクト名】[プロジェクト名]
【追加パッケージ】
- zustand
- zod
- react-hook-form

【設定】
- App Router使用
- GitHub Pages用の静的エクスポート設定
```

---

### B.2 画面モック作成

```
以下の画面のモックを作成して。

【画面名】[画面名]
【画面概要】[概要]

【画面要素】
- [要素1]
- [要素2]
- [要素3]

【デザイン方針】
- メインカラー: #27ae60
- テイスト: 業務システム風

【技術】
- Next.js App Router
- TypeScript
- インラインスタイル
```

---

### B.3 レスポンシブ対応

```
この画面をPC/タブレット/スマートフォンに対応させて。

【ブレークポイント】
- PC: 1024px以上
- タブレット: 768px〜1023px
- スマホ: 767px以下

【実装方法】
useResponsiveフックを使用
```

---

### B.4 修正指示

```
この画面を以下の通り修正して。

1. [修正内容1]
2. [修正内容2]
3. [修正内容3]
```

---

### B.5 画面設計書生成

```
[ファイルパス]の画面設計書を作成して。

【出力内容】
- 基本情報（画面ID、画面名、URL）
- レイアウト図
- 画面要素一覧
- アクション一覧
- バリデーションルール
```

---

### B.6 画面遷移図生成

```
app/配下の全画面を分析して、画面遷移図を作成して。

【出力形式】
1. Mermaid flowchart
2. 遷移マトリクス（表形式）
```

---

### B.7 コードレビュー

```
[ファイルパス]をレビューして。

【レビュー観点】
- CLAUDE.mdのルール準拠
- レスポンシブ対応
- アクセシビリティ

問題があれば修正して。
```

---

### B.8 Git操作

```
変更をコミットしてプッシュして。

【コミットメッセージ】
[変更内容]
```

---

## C. CLAUDE.mdサンプル

```markdown
# プロジェクト名 - 画面モック

プロジェクトの概要説明。

## 技術スタック

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Zustand

## モック実装ルール

### 1. UI

#### コンポーネント
- アイコンのみボタンには `aria-label` 必須
- 破壊的アクションには確認ダイアログ使用
- `h-screen` 禁止 → `h-dvh` を使用

#### タイポグラフィ
- データ値には `tabular-nums`
- 見出しに `text-balance`

### 2. レイアウト

#### 入力幅
- 郵便番号: 100px
- 電話: 150px
- メール: 280px
- 日付: 150-180px

#### スペーシング
- 8px の倍数を使用
- セクション間: 32-48px
- グループ間: 16-24px

### 3. デザイン

#### 色
- コントラスト比 4.5:1 以上
- 純粋な黒 #000000 禁止

### 4. UX

- Primary CTA は1画面に1つ
- ボタンラベルは具体的な動詞
- 完了画面は次のアクションを示す
```

---

## D. Skill.mdサンプル

```markdown
---
name: ui-skills
description: UI品質ルール
---

# UI Skills

## How to use

- `/ui-skills` - このスキルを適用
- `/ui-skills <file>` - ファイルをレビュー

## Components

- MUST add `aria-label` to icon-only buttons
- MUST use `AlertDialog` for destructive actions
- NEVER use `h-screen`, use `h-dvh`

## Typography

- MUST use `text-balance` for headings
- MUST use `tabular-nums` for data

## Design

- NEVER use gradients unless requested
- MUST give empty states one clear next action
```

---

## E. 参考リンク集

### 公式ドキュメント

| 名称 | URL |
|------|-----|
| Claude Code | https://docs.anthropic.com/claude-code |
| Next.js | https://nextjs.org/docs |
| Tailwind CSS | https://tailwindcss.com/docs |
| Zustand | https://zustand-demo.pmnd.rs/ |
| GitHub Pages | https://docs.github.com/pages |
| GitHub Actions | https://docs.github.com/actions |

### ツール

| 名称 | URL |
|------|-----|
| Node.js | https://nodejs.org/ |
| Visual Studio Code | https://code.visualstudio.com/ |
| GitHub CLI (gh) | https://cli.github.com/ |

### デザインリソース

| 名称 | URL |
|------|-----|
| Heroicons | https://heroicons.com/ |
| Lucide Icons | https://lucide.dev/ |
| Tailwind UI | https://tailwindui.com/ |

---

## F. チェックリスト

### プロジェクト開始時

```markdown
- [ ] Node.js 18+がインストールされている
- [ ] Claude Codeがインストールされている
- [ ] Max Planに加入している
- [ ] GitHubアカウントがある
- [ ] gh CLIがインストールされている
```

### 画面作成時

```markdown
- [ ] 画面一覧に追加した
- [ ] レスポンシブ対応した
- [ ] CLAUDE.mdのルールを確認した
- [ ] 動作確認した
- [ ] コミットした
```

### レビュー時

```markdown
- [ ] 要件通りの動作をするか
- [ ] CLAUDE.mdのルールに準拠しているか
- [ ] レスポンシブ対応できているか
- [ ] アクセシビリティは問題ないか
- [ ] コードは読みやすいか
```

### 納品時

```markdown
- [ ] 全画面の動作確認完了
- [ ] 画面一覧が最新
- [ ] 画面遷移図が最新
- [ ] 画面設計書が最新
- [ ] GitHub Pagesで公開確認
- [ ] README.mdを更新
```
