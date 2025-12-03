# HEALTHCARE 医療機器管理システム

医療機器の資産管理システム

## 機能

- QRコード発行・印刷プレビュー
- オフライン準備・調査場所入力
- 資産調査・詳細表示
- 資産検索・個別管理一覧
- 改修申請・見積処理
- レスポンシブデザイン対応(PC/タブレット/スマホ)

## 開発環境のセットアップ

### 依存パッケージのインストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

`app/page.tsx` を編集すると、ページが自動的に更新されます。

### ビルド

静的ファイルとしてビルドするには:

```bash
npm run build
```

ビルドされたファイルは `out/` ディレクトリに出力されます。

## GitHub Pages へのデプロイ

このプロジェクトはGitHub Pagesで公開できるように設定されています。

### 1. GitHubリポジトリの作成

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/medical-device-mgmt.git
git push -u origin main
```

### 2. GitHub Pagesの設定

1. GitHubリポジトリページを開く
2. **Settings** → **Pages** に移動
3. **Source** を **GitHub Actions** に変更

### 3. 自動デプロイ

mainブランチにpushすると、GitHub Actionsが自動的にビルドしてデプロイします。

デプロイされたサイトのURL: `https://YOUR-USERNAME.github.io/medical-device-mgmt/`

## 技術スタック

- **フレームワーク**: Next.js 16.0.6 (App Router)
- **言語**: TypeScript 5
- **スタイリング**: Inline CSS
- **デプロイ**: GitHub Pages (静的エクスポート)

## プロジェクト構造

```
/app                    # Next.js App Router
  /qr-issue            # QRコード発行画面
  /qr-print            # QR印刷プレビュー画面
  /offline-prep        # オフライン準備画面
  /survey-location     # 調査場所入力画面
  /asset-survey        # 資産調査画面
  /asset-detail        # 資産詳細画面
  /asset-search-result # 資産検索結果画面
  /...                 # その他の画面
/components            # 共通コンポーネント
/lib                   # ユーティリティ・型定義
  /hooks              # カスタムフック
  /styles             # スタイルユーティリティ
  /types              # 型定義
/public                # 静的ファイル
```

## ライセンス

このプロジェクトはサンプルプロジェクトです。
