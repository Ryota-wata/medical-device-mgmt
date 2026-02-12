# 第2章：環境構築

## 2.1 インストール手順

### Step 1: Node.jsのインストール

#### macOSの場合

**方法A: 公式インストーラー（推奨）**

1. [Node.js公式サイト](https://nodejs.org/)にアクセス
2. 「LTS」バージョン（推奨版）をダウンロード
3. ダウンロードしたpkgファイルをダブルクリック
4. インストーラーの指示に従ってインストール

**方法B: Homebrewを使用**

```bash
# Homebrewがインストールされていない場合は先にインストール
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.jsをインストール
brew install node
```

#### Windowsの場合

1. [Node.js公式サイト](https://nodejs.org/)にアクセス
2. 「LTS」バージョンのWindows Installerをダウンロード
3. ダウンロードしたmsiファイルを実行
4. インストーラーの指示に従ってインストール
5. 「Tools for Native Modules」のチェックボックスにチェックを入れる（推奨）

#### インストール確認

```bash
# ターミナル（Mac）またはコマンドプロンプト（Windows）で実行
node -v
# v18.0.0以上が表示されればOK

npm -v
# 9.0.0以上が表示されればOK
```

---

### Step 2: Claude Codeのインストール

```bash
# グローバルインストール
npm install -g @anthropic-ai/claude-code
```

#### インストール確認

```bash
claude --version
# バージョン番号が表示されればOK
```

#### インストールエラーの対処

**権限エラーが出た場合（Mac/Linux）**
```bash
sudo npm install -g @anthropic-ai/claude-code
```

**パスが通っていない場合**
```bash
# npmのグローバルパスを確認
npm config get prefix

# 表示されたパスを環境変数に追加
# 例: /usr/local → /usr/local/bin がPATHに含まれているか確認
```

---

### Step 3: 認証設定

Claude Codeを初めて起動すると、認証フローが開始されます。

```bash
# 任意のディレクトリでClaudeを起動
claude
```

1. 「認証が必要です」というメッセージが表示される
2. ブラウザが自動で開く（開かない場合は表示されたURLにアクセス）
3. Anthropicアカウントでログイン
4. 「Claude Codeを認証」をクリック
5. ターミナルに戻り、認証完了のメッセージを確認

> **注意**: Max Planに加入していないアカウントでは認証後もClaude Codeを使用できません。

---

## 2.2 初期設定

### ターミナルの準備

#### macOS

**iTerm2のインストール（推奨）**
```bash
brew install --cask iterm2
```

iTerm2を使用すると以下のメリットがあります：
- 複数タブ/ペイン対応
- 検索機能の強化
- カラースキームのカスタマイズ

#### Windows

**Windows Terminalのインストール（推奨）**
1. Microsoft Storeを開く
2. 「Windows Terminal」を検索
3. インストールをクリック

---

### 日本語環境の設定

Claude Codeはデフォルトで日本語に対応していますが、以下の設定を推奨します。

#### ターミナルのフォント設定

日本語が正しく表示されるよう、以下のフォントを推奨：
- **macOS**: Menlo, Monaco, Osaka-等幅
- **Windows**: MS Gothic, Consolas

#### 文字化け対策

```bash
# bashrcまたはzshrcに追加
export LANG=ja_JP.UTF-8
export LC_ALL=ja_JP.UTF-8
```

---

### VSCode連携（任意）

VSCodeと連携することで、生成されたコードをエディタで確認しながら作業できます。

#### 推奨設定

1. **VSCodeのターミナル統合**
   - VSCode内蔵ターミナルでClaude Codeを起動可能

2. **Auto Save設定**
   - Claude Codeがファイルを変更すると自動保存される設定を推奨

```json
// settings.json
{
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000
}
```

---

## 2.3 動作確認

### 基本的な起動方法

```bash
# カレントディレクトリでClaude Codeを起動
claude

# 特定のディレクトリを指定して起動
claude /path/to/project

# 新規プロジェクトを作成しながら起動
mkdir my-project && cd my-project && claude
```

### 起動後の画面

```
╭─────────────────────────────────────────────────────────────╮
│ Claude Code                                                 │
│ Type your message or use /help for commands                │
╰─────────────────────────────────────────────────────────────╯

> _
```

### 基本コマンド一覧

| コマンド | 説明 |
|---------|------|
| `/help` | ヘルプを表示 |
| `/cost` | 現在のセッションコストを表示 |
| `/clear` | 会話履歴をクリア |
| `/compact` | コンテキストを圧縮（長時間作業時に有効） |
| `/quit` または `Ctrl+C` | Claude Codeを終了 |

### 動作確認テスト

以下のプロンプトを入力して、正常に動作することを確認します：

```
test.txtというファイルを作成して、「Hello, Claude Code!」と書き込んで
```

**期待される動作**：
1. Claude Codeがファイル作成の確認を求める
2. 承認するとtest.txtが作成される
3. ファイル内容に「Hello, Claude Code!」が記載される

### トラブルシューティング

| 症状 | 原因 | 対処法 |
|------|------|--------|
| `command not found: claude` | パスが通っていない | npmのグローバルパスを確認 |
| 認証エラー | アカウント未連携 | `claude` を再実行して認証 |
| 「プランをアップグレードしてください」 | Max Plan未加入 | Max Planに加入 |
| レスポンスが遅い | ネットワーク問題 | 接続を確認 |
