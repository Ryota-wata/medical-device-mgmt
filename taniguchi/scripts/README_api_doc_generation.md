# API設計書 自動生成スクリプト

最終更新: 2026-03-13

## 目的
- Fix 済みの [API設計書_SHIP部署マスタ.docx](C:/Projects/mock/medical-device-mgmt/taniguchi/api/Fix/API設計書_SHIP部署マスタ.docx) と同じ Word 体裁を再利用して、API 設計書を安定生成する。
- 手作業での Word 修正を減らし、見出し・表書式・目次更新をスクリプトで揃える。

## 方針
- `taniguchi\\api\\テンプレート\\API設計書_標準テンプレート.docx` を Word テンプレートとして使う。
- 章構成や表データは `scripts\\specs\\api-docs\\*.ps1` の spec に持つ。
- 生成本体は `taniguchi\\scripts\\generate-api-doc-word.ps1` を使う。
- 現時点ではローカルの PowerShell + Word COM を前提とし、MCP 化はしていない。
- Windows PowerShell 5 系で安定実行するため、生成スクリプトと spec は UTF-8 with BOM で保存する。

## 初期化
標準テンプレートを作り直す場合:

```powershell
powershell -ExecutionPolicy Bypass -File taniguchi\scripts\initialize-api-doc-template.ps1
```

## 生成
spec から API 設計書を生成する場合:

```powershell
powershell -ExecutionPolicy Bypass -File taniguchi\scripts\generate-api-doc-word.ps1 `
  -SpecPath taniguchi\scripts\specs\api-docs\ship-department.ps1
```

上記の既定動作では、`taniguchi\api\参考_作業用` 配下にタイムスタンプ付きで出力する。
Fix 済み文書を開いていても、既定では上書きしない。

出力先を上書きしたい場合:

```powershell
powershell -ExecutionPolicy Bypass -File taniguchi\scripts\generate-api-doc-word.ps1 `
  -SpecPath taniguchi\scripts\specs\api-docs\ship-department.ps1 `
  -OutputPath taniguchi\api\参考_作業用\_tmp_API設計書_SHIP部署マスタ.docx
```

SHIP部署マスタだけをすぐ再生成したい場合:

```powershell
powershell -ExecutionPolicy Bypass -File taniguchi\scripts\generate-ship-department-api-word.ps1 `
  -OutputPath taniguchi\api\参考_作業用\_tmp_API設計書_SHIP部署マスタ.docx
```

Fix パスへ明示的に反映したい場合のみ:

```powershell
powershell -ExecutionPolicy Bypass -File taniguchi\scripts\generate-ship-department-api-word.ps1 -Publish
```

## 現在の構成
- `taniguchi\\scripts\\lib\\word-api-doc-common.ps1`
  - Word COM 操作の共通関数
- `taniguchi\\scripts\\generate-api-doc-word.ps1`
  - 汎用ジェネレータ
- `taniguchi\\scripts\\initialize-api-doc-template.ps1`
  - SHIP部署マスタ Fix 文書から標準テンプレートを作る
- `scripts\\specs\\api-docs\\ship-department.ps1`
  - SHIP部署マスタの spec
- `taniguchi\\scripts\\generate-ship-department-api-word.ps1`
  - SHIP部署マスタ専用の薄いラッパー

## 次の拡張候補
- 他の API 設計書も `specs\\api-docs` へ移植する
- 版数や改訂履歴の日付も placeholder 化する
- API設計書一覧のステータス更新まで自動化する
