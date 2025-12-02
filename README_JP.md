# 医療機器管理システム

## 技術スタック

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **Zustand** (状態管理)
- **React Hook Form** (フォーム管理)
- **Zod** (バリデーション)

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番環境実行
npm start

# Lint
npm run lint
```

## 開発URL

http://localhost:3000

## プロジェクト構成

```
app/
  ├── page.tsx              # トップページ
  ├── layout.tsx            # 共通レイアウト
  ├── login/                # ログイン画面
  ├── menu/                 # メニュー画面
  ├── asset-search/         # 資産検索画面
  └── ...                   # その他の画面

components/
  ├── ui/                   # 共通UIコンポーネント
  │   ├── Button.tsx
  │   ├── Modal.tsx
  │   ├── Table.tsx
  │   └── ...
  └── layouts/              # レイアウトコンポーネント
      ├── Header.tsx
      └── Sidebar.tsx

lib/
  ├── types/                # 型定義
  ├── stores/               # Zustand stores
  ├── utils/                # ユーティリティ関数
  └── constants/            # 定数
```

## 開発方針

1. **コンポーネント駆動開発**: 共通コンポーネントを先に作成
2. **型安全**: TypeScriptを最大限活用
3. **再利用性**: DRY原則を守る
4. **段階的移行**: 既存画面モックから優先度順に移植

## 次のステップ

1. 共通UIコンポーネントの作成
2. 共通レイアウトの作成
3. ルーティング設計
4. 既存画面の移植開始
