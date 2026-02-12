# 第3章：プロジェクト初期化

## 3.1 ディレクトリ構成の設計

### 推奨ディレクトリ構造（Next.js App Routerの場合）

```
project-name/
├── .claude/                    # Claude Code設定
│   ├── commands/              # カスタムコマンド（Skill）
│   │   └── ui-skills.md
│   └── settings.json          # プロジェクト設定
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Pages自動デプロイ
├── app/                       # 画面ファイル（App Router）
│   ├── layout.tsx            # 共通レイアウト
│   ├── page.tsx              # トップページ
│   ├── login/
│   │   └── page.tsx          # ログイン画面
│   └── main/
│       └── page.tsx          # メイン画面
├── components/                # 共通コンポーネント
│   ├── layouts/
│   │   └── Header.tsx
│   └── ui/
│       ├── Button.tsx
│       └── Modal.tsx
├── lib/                       # ユーティリティ
│   ├── hooks/                # カスタムフック
│   ├── stores/               # 状態管理（Zustand）
│   └── types/                # 型定義
├── public/                    # 静的ファイル
├── docs/                      # ドキュメント
├── CLAUDE.md                  # プロジェクトルール
├── package.json
├── next.config.ts
└── tsconfig.json
```

### 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| ディレクトリ | ケバブケース | `user-management/` |
| コンポーネントファイル | パスカルケース | `UserList.tsx` |
| ページファイル | Next.js規則 | `page.tsx` |
| ユーティリティ | キャメルケース | `formatDate.ts` |
| 定数ファイル | キャメルケース | `constants.ts` |
| スタイルファイル | コンポーネントと同名 | `UserList.css` |

---

## 3.2 初期プロンプトテンプレート

### プロンプト1: 技術スタック選定

```
業務システムの画面モックを作成したい。
以下の要件に最適な技術スタックを提案して。

【要件】
- ブラウザで動作する画面モック
- 静的ホスティング（GitHub Pages）で公開
- レスポンシブ対応（PC/タブレット/スマホ）
- 複数画面間の遷移をシミュレート
- 将来的にバックエンドと接続可能な構成

【優先事項】
- 実装速度を重視
- 保守性を考慮
- 学習コストは許容

提案する技術スタックとその理由を説明して。
```

**想定回答例**：
```
以下の技術スタックを推奨します：

1. フレームワーク: Next.js 14+ (App Router)
   - 理由: ファイルベースルーティング、静的エクスポート対応

2. 状態管理: Zustand
   - 理由: 軽量、シンプル、モック向き

3. スタイリング: Tailwind CSS
   - 理由: 高速なUI構築、レスポンシブ対応

4. 言語: TypeScript
   - 理由: 型安全性、IDE補完
```

---

### プロンプト2: 環境構築

```
以下の技術スタックでプロジェクトを初期化して。

【技術スタック】
- Next.js（App Router）
- TypeScript
- Tailwind CSS
- Zustand（状態管理）

【プロジェクト名】
medical-device-mgmt（医療機器管理システム）

【初期設定】
- GitHub Pages用の静的エクスポート設定
- 日本語フォント対応
- 基本的なディレクトリ構成

必要なコマンドを実行して、初期ファイルを作成して。
```

---

### プロンプト3: 初期ファイル生成

```
以下の初期ファイルを作成して。

1. CLAUDE.md
   - プロジェクト概要
   - 使用技術
   - コーディング規約の基本ルール

2. 共通レイアウト（app/layout.tsx）
   - ヘッダー/フッターの共通構造
   - メタデータ設定

3. トップページ（app/page.tsx）
   - ログイン画面へのリダイレクト

4. 共通コンポーネント
   - components/layouts/Header.tsx
   - components/ui/Button.tsx
```

---

## 3.3 Git/GitHub連携

### リポジトリ作成プロンプト

```
GitHubにリポジトリを作成して、このプロジェクトをプッシュして。

【リポジトリ設定】
- リポジトリ名: medical-device-mgmt
- 公開設定: Public（GitHub Pages用）
- 説明: 医療機器管理システム画面モック

【コミットメッセージ】
「Initial commit: プロジェクト初期化」

gh CLIを使って実行して。
```

**Claude Codeが実行するコマンド例**：
```bash
# Gitリポジトリを初期化
git init

# .gitignoreを作成
# （Claude Codeが自動生成）

# 初期コミット
git add .
git commit -m "Initial commit: プロジェクト初期化"

# GitHubリポジトリを作成してプッシュ
gh repo create medical-device-mgmt --public --source=. --push
```

### .gitignore設定

Claude Codeが自動生成する標準的な.gitignore：

```gitignore
# Dependencies
node_modules/
.pnp/
.pnp.js

# Build
.next/
out/
build/
dist/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# TypeScript
*.tsbuildinfo
next-env.d.ts
```

---

## 3.4 GitHub Pages公開設定

### 設定プロンプト

```
GitHub Pagesで自動デプロイする設定をして。

【要件】
- mainブランチへのpush時に自動デプロイ
- Next.jsの静的エクスポートを使用
- GitHub Actions経由でデプロイ

必要なファイルを作成して。
```

### 生成されるGitHub Actions設定

**`.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build with Next.js
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### next.config.ts設定

```typescript
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/medical-device-mgmt' : '';

const nextConfig: NextConfig = {
  output: 'export',        // 静的エクスポート
  basePath,                // GitHub Pagesのサブパス
  images: {
    unoptimized: true,     // 静的エクスポート用
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
```

### GitHub Pages有効化手順

1. GitHubリポジトリの「Settings」を開く
2. 左メニューから「Pages」を選択
3. 「Source」で「GitHub Actions」を選択
4. mainブランチにプッシュすると自動デプロイ開始

### 公開URL

デプロイ完了後、以下のURLでアクセス可能：
```
https://[ユーザー名].github.io/[リポジトリ名]/
```

例：
```
https://username.github.io/medical-device-mgmt/
```
