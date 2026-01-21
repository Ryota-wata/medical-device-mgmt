---
name: ui-skills
description: UIコードをレビューし、ベストプラクティスに沿った修正を提案・実行する
allowed-tools: Read, Edit, Write, Glob, Grep
---

# UI Skills

UIコンポーネントのコードレビューと修正を行うスキルです。Tailwind CSS、アクセシビリティ、パフォーマンスのベストプラクティスに基づいてレビューします。

## 使い方

### レビューのみ
```
app/login/page.tsx をUI Skillsでレビューして
```

### レビュー＋修正
```
app/login/page.tsx をUI Skillsでレビューして修正して
```

### 複数ファイル
```
app/以下の全page.tsxをUI Skillsでレビューして
```

## 対応フロー

### Step 1: 対象ファイルの読み込み
```bash
Read: app/login/page.tsx
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
| Stack | X |
| Components | X |
| Interaction | X |
| Animation | X |
| Typography | X |
| Layout | X |
| Performance | X |
| Design | X |
| UX | X |
| **合計** | **X** |
```

### Step 4: 修正実行（依頼された場合）
Editツールで修正を適用

---

## 制約一覧

### Stack
- **MUST** Tailwind CSSのデフォルト値を使用（カスタム値は既存または明示的な要求がある場合のみ）
- **MUST** JSアニメーションには `motion/react` を使用
- **SHOULD** Tailwind CSSのエントランス・マイクロアニメーションには `tw-animate-css` を使用
- **MUST** クラスロジックには `cn` ユーティリティ（`clsx` + `tailwind-merge`）を使用

### Components
- **MUST** キーボード・フォーカス動作には accessible component primitives を使用（`Base UI`, `React Aria`, `Radix`）
- **MUST** プロジェクト既存のコンポーネントを優先使用
- **NEVER** 同一インタラクション面でプリミティブシステムを混在させない
- **SHOULD** 新規プリミティブには `Base UI` を優先
- **MUST** アイコンのみのボタンには `aria-label` を追加
- **NEVER** キーボード・フォーカス動作を手動で再実装しない

### Interaction
- **MUST** 破壊的・不可逆なアクションには `AlertDialog` を使用
- **SHOULD** ローディング状態にはスケルトンを使用
- **NEVER** `h-screen` を使用しない → `h-dvh` を使用
- **MUST** fixed要素には `safe-area-inset` を尊重
- **MUST** エラーはアクション発生箇所の近くに表示
- **NEVER** `input` や `textarea` でペーストをブロックしない

### Animation
- **NEVER** 明示的な要求なしにアニメーションを追加しない
- **MUST** コンポジタープロパティのみアニメーション（`transform`, `opacity`）
- **NEVER** レイアウトプロパティをアニメーションしない（`width`, `height`, `top`, `left`, `margin`, `padding`）
- **SHOULD** ペイントプロパティのアニメーションは小さなUIのみ（`background`, `color`）
- **SHOULD** エントランスには `ease-out` を使用
- **NEVER** インタラクションフィードバックは `200ms` を超えない
- **MUST** ループアニメーションは画面外で一時停止
- **SHOULD** `prefers-reduced-motion` を尊重
- **NEVER** カスタムイージングカーブを導入しない
- **SHOULD** 大きな画像やフルスクリーン面のアニメーションを避ける

### Typography
- **MUST** 見出しには `text-balance`、本文には `text-pretty` を使用
- **MUST** データには `tabular-nums` を使用
- **SHOULD** 密なUIには `truncate` または `line-clamp` を使用
- **NEVER** `letter-spacing`（`tracking-*`）を変更しない

### Layout
- **MUST** 固定の `z-index` スケールを使用（任意の `z-*` は禁止）
- **SHOULD** 正方形要素には `size-*` を使用（`w-*` + `h-*` ではなく）

### Performance
- **NEVER** 大きな `blur()` や `backdrop-filter` 面をアニメーションしない
- **NEVER** アクティブなアニメーション外で `will-change` を適用しない
- **NEVER** レンダーロジックで表現できるものに `useEffect` を使用しない

### Design
- **NEVER** 明示的な要求なしにグラデーションを使用しない
- **NEVER** 紫や多色グラデーションを使用しない
- **NEVER** グロー効果を主要なアフォーダンスとして使用しない
- **SHOULD** Tailwind CSSのデフォルトシャドウスケールを使用
- **MUST** 空の状態には明確な次のアクションを1つ提示
- **SHOULD** アクセントカラーは1ビューに1色まで
- **SHOULD** 新しいカラーを導入する前に既存テーマまたはTailwindカラートークンを使用

### UX (User Experience)

#### タップ・クリック領域
- **MUST** タッチターゲットは最低 `44x44px` を確保（`min-h-11 min-w-11`）
- **SHOULD** 隣接するタップ領域には最低 `8px` の間隔を確保
- **NEVER** テキストリンクのみでタップ領域が小さいボタンを作らない

#### フィードバック
- **MUST** フォーム送信後は成功/失敗のフィードバックを即座に表示
- **MUST** ボタンクリック後はローディング状態を表示（`disabled` + スピナー/テキスト変更）
- **SHOULD** 非同期処理中はユーザーが他の操作をブロックされていることを明示
- **NEVER** 処理完了後にフィードバックなしで画面遷移しない

#### ナビゲーション・フロー
- **MUST** モーダル・ドロワーには常に閉じる手段を提供（×ボタン、背景クリック、Escキー）
- **MUST** 複数ステップのフローには現在位置を表示（ステッパー、プログレスバー）
- **SHOULD** 3クリック/タップ以上必要な頻繁な操作はショートカットを検討
- **SHOULD** 戻る操作で入力内容が失われる場合は確認ダイアログを表示
- **NEVER** ブラウザの戻るボタンで予期しない動作を起こさない

#### フォーム
- **MUST** 必須項目には明確なマーク（`*` または「必須」ラベル）を表示
- **MUST** バリデーションエラーは該当フィールドの近くに表示
- **SHOULD** リアルタイムバリデーションは入力完了後（`onBlur`）に実行
- **SHOULD** 長いフォームはセクション分けまたはステップ分割を検討
- **NEVER** 送信ボタンを押すまでエラーを隠さない（重要なエラーは即座に表示）
- **NEVER** フォームリセットボタンを送信ボタンの隣に配置しない

#### データ表示
- **MUST** 大量データにはページネーションまたは無限スクロールを実装
- **MUST** テーブルの長いテキストは `truncate` + ツールチップで全文表示
- **SHOULD** ソート・フィルター可能なテーブルには現在の状態を明示
- **SHOULD** 日付・数値は一貫したフォーマットで表示（`tabular-nums`）
- **NEVER** 100件以上のデータを一度にレンダリングしない（仮想スクロール検討）

#### エラーハンドリング
- **MUST** エラー発生時は何が起きたか・どうすればいいかを明示
- **MUST** ネットワークエラー時はリトライ手段を提供
- **SHOULD** 404/エラーページにはホームまたは前のページへの導線を設置
- **NEVER** 技術的なエラーメッセージ（スタックトレース等）をユーザーに表示しない

#### 確認・削除操作
- **MUST** 削除操作には確認ダイアログを表示（`AlertDialog`）
- **MUST** 確認ダイアログでは操作対象を明記（「〇〇を削除しますか？」）
- **SHOULD** 可能であれば削除ではなくソフトデリート（ゴミ箱）を実装
- **NEVER** 確認なしでデータを完全削除しない

#### アクセシビリティ（追加）
- **MUST** フォーカス可能な要素には視認できるフォーカスリングを表示
- **MUST** 色だけで情報を伝えない（アイコン・テキストを併用）
- **SHOULD** コントラスト比は WCAG AA 基準（4.5:1）以上を確保
- **SHOULD** スクリーンリーダー用に適切な見出し階層（`h1` → `h2` → `h3`）を維持

#### 認知負荷
- **MUST** 1画面の主要アクション（CTA）は3つ以下に制限
- **MUST** 重要な情報・アクションはスクロールなしで視認可能（Above the fold）
- **SHOULD** 選択肢が7つ以上の場合は検索/フィルター/グループ化を提供
- **SHOULD** 関連する操作はグループ化してセクション分け
- **SHOULD** 初回ユーザー向けに空の状態でヒント/チュートリアルを表示
- **NEVER** 1画面に10個以上の入力フィールドを配置しない（ステップ分割を検討）
- **NEVER** 同じ意味のボタンを異なるラベルで表示しない（「保存」と「登録」の混在等）

#### 情報設計・画面遷移フロー
- **MUST** 深い階層（3階層以上）にはパンくずリストを表示
- **MUST** 現在地がわかるナビゲーション状態を表示（アクティブ状態のハイライト）
- **MUST** 主要な画面へは2クリック以内でアクセス可能にする
- **SHOULD** 関連性の高い機能は近くに配置（フィッツの法則）
- **SHOULD** ユーザーの操作履歴に基づく「最近使った機能」を提供
- **SHOULD** 検索機能はヘッダー等の固定位置に配置
- **NEVER** 同じ機能へのリンク/ボタンを1画面に重複配置しない
- **NEVER** 階層が深すぎる構造（5階層以上）を作らない

#### 離脱防止
- **MUST** 長いフォームには入力進捗を保存（下書き保存/自動保存）
- **MUST** セッションタイムアウト前に警告を表示
- **SHOULD** フォーム入力中の離脱時に確認ダイアログを表示（`beforeunload`）
- **SHOULD** エラー発生時は入力済みデータを保持（フォームリセットしない）
- **SHOULD** 処理時間が長い場合は推定残り時間を表示
- **NEVER** 入力途中でページ遷移してデータを失わせない
- **NEVER** 自動ログアウト後に入力中のデータを破棄しない（復元手段を提供）

#### モバイル操作性
- **MUST** スマホでは横スクロールを発生させない（`overflow-x-hidden` または適切なレスポンシブ）
- **MUST** 入力フィールドタップ時にキーボードで隠れないようスクロール調整
- **SHOULD** モバイルでは固定ヘッダー/フッターを最小限に（コンテンツ領域確保）
- **SHOULD** スワイプジェスチャーが必要な場合は視覚的ヒントを提供
- **SHOULD** 電話番号・メールアドレスは `tel:` / `mailto:` リンクにする
- **SHOULD** 日付入力にはネイティブの日付ピッカー（`type="date"`）を優先
- **NEVER** hover のみで表示される情報をモバイルで必須にしない
- **NEVER** ピンチズームを無効化しない（`user-scalable=no` 禁止）

---

## よくある違反パターン

### インラインスタイル → Tailwindクラス
```tsx
// ❌ Bad
style={{ color: '#5a6c7d', padding: '16px' }}

// ✅ Good
className="text-slate-500 p-4"
```

### h-screen → h-dvh
```tsx
// ❌ Bad
className="min-h-screen"

// ✅ Good
className="min-h-dvh"
```

### w + h → size
```tsx
// ❌ Bad
className="w-10 h-10"

// ✅ Good
className="size-10"
```

### onFocus/onBlur/onMouseEnter → Tailwind疑似クラス
```tsx
// ❌ Bad
onFocus={(e) => { e.target.style.borderColor = '#27ae60' }}

// ✅ Good
className="focus:border-emerald-500"
```

### グラデーション → 単色
```tsx
// ❌ Bad
style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}

// ✅ Good
className="bg-slate-100"
```

### 小さすぎるタップ領域
```tsx
// ❌ Bad: 24x24pxのボタン
<button className="p-1 text-sm">×</button>

// ✅ Good: 44x44px以上を確保
<button className="min-h-11 min-w-11 p-2 flex items-center justify-center">×</button>
```

### フィードバックなしの送信ボタン
```tsx
// ❌ Bad: 状態変化なし
<button onClick={handleSubmit}>送信</button>

// ✅ Good: ローディング状態を表示
<button onClick={handleSubmit} disabled={isLoading}>
  {isLoading ? '送信中...' : '送信'}
</button>
```

### 確認なしの削除
```tsx
// ❌ Bad: 即座に削除
<button onClick={() => deleteItem(id)}>削除</button>

// ✅ Good: 確認ダイアログを表示
<AlertDialog>
  <AlertDialogTrigger>削除</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
    <AlertDialogDescription>この操作は取り消せません。</AlertDialogDescription>
    <AlertDialogAction onClick={() => deleteItem(id)}>削除</AlertDialogAction>
    <AlertDialogCancel>キャンセル</AlertDialogCancel>
  </AlertDialogContent>
</AlertDialog>
```

### エラーメッセージの位置
```tsx
// ❌ Bad: ページ上部にまとめて表示
<div className="text-red-500">{errors.join(', ')}</div>
<input name="email" />
<input name="password" />

// ✅ Good: 各フィールドの近くに表示
<div>
  <input name="email" />
  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
</div>
<div>
  <input name="password" />
  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
</div>
```

### モーダルの閉じ手段不足
```tsx
// ❌ Bad: 閉じるボタンのみ
<div className="modal">
  <button onClick={onClose}>×</button>
  {content}
</div>

// ✅ Good: 背景クリック + Escキー対応
<div className="fixed inset-0 bg-black/50" onClick={onClose}>
  <div onClick={(e) => e.stopPropagation()}>
    <button onClick={onClose} aria-label="閉じる">×</button>
    {content}
  </div>
</div>
// + useEffect for Escape key handling
```

### 認知負荷: CTAの過剰配置
```tsx
// ❌ Bad: 主要アクションが多すぎる
<div className="flex gap-2">
  <button className="btn-primary">保存</button>
  <button className="btn-primary">送信</button>
  <button className="btn-primary">確定</button>
  <button className="btn-primary">登録</button>
  <button className="btn-primary">申請</button>
</div>

// ✅ Good: 主要アクションは1-2個に絞る
<div className="flex gap-2">
  <button className="btn-secondary">下書き保存</button>
  <button className="btn-primary">申請する</button>
</div>
```

### 情報設計: パンくずなしの深い階層
```tsx
// ❌ Bad: 現在地がわからない
<h1>機器詳細</h1>

// ✅ Good: パンくずリストで現在地を明示
<nav aria-label="パンくず">
  <ol className="flex gap-2 text-sm text-slate-500">
    <li><a href="/main">ホーム</a></li>
    <li>/</li>
    <li><a href="/assets">資産一覧</a></li>
    <li>/</li>
    <li className="text-slate-900">機器詳細</li>
  </ol>
</nav>
<h1>機器詳細</h1>
```

### 離脱防止: フォーム離脱時の確認なし
```tsx
// ❌ Bad: 入力中でも確認なしで離脱可能
const FormPage = () => {
  return <form>...</form>;
};

// ✅ Good: 入力中の離脱を確認
const FormPage = () => {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return <form onChange={() => setIsDirty(true)}>...</form>;
};
```

### モバイル: hover依存のUI
```tsx
// ❌ Bad: hoverでのみツールチップ表示
<button
  className="group relative"
  title="削除します"
>
  <span className="hidden group-hover:block absolute">削除します</span>
  削除
</button>

// ✅ Good: タップ/クリックでも情報アクセス可能
<Tooltip>
  <TooltipTrigger asChild>
    <button>削除</button>
  </TooltipTrigger>
  <TooltipContent>削除します</TooltipContent>
</Tooltip>
// または aria-label で説明
<button aria-label="このアイテムを削除します">削除</button>
```

### モバイル: 横スクロールの発生
```tsx
// ❌ Bad: 固定幅でスクロール発生
<div className="w-[800px]">
  <table>...</table>
</div>

// ✅ Good: レスポンシブ対応
<div className="w-full overflow-x-auto">
  <table className="min-w-full">...</table>
</div>
```

---

## 関連リソース

- [Tailwind CSS](https://tailwindcss.com/docs)
- [Base UI](https://base-ui.com/react/components)
- [motion/react](https://motion.dev/)
