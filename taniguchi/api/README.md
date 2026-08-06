# API設計資産の管理方針

このディレクトリは、APIの機械可読な契約、内部設計、管理台帳、Word納品物を管理する。
詳細な作業ルールは `../AGENTS.md` に従う。

開発者向けAPI設計の正本は、機能別`openapi.yaml`と`design.md`である。`../機能要件.md`は依頼者・AI向けの内部作業メモであり、開発者への連携物や実装判断の根拠には含めない。

## 管理するもの

- OpenAPI: パス、メソッド、Request、Response、認証、HTTPステータス、エラー形式
- 機能別設計MD: 画面操作、DB利用、権限、処理順、トランザクション、業務ルール
- 機能メタデータ: 機能ID、対象画面、移行状態、関連ファイル、Word出力先
- Word API設計書: ドラフト、承認済み、旧版

## 推奨構成

機能別の正本は`features/<feature-slug>/`へ集約する。Word保管先は既存の`Fix`、`作成済み`、`参考_作業用`、`テンプレート`を移行期間中そのまま使い、生成・参照パスを一度に壊さない。

```text
api/
├─ README.md
├─ catalog.yaml
├─ catalog.schema.json
├─ feature.schema.json
├─ common/
│  ├─ schemas/
│  ├─ responses/
│  ├─ parameters/
│  └─ security/
├─ features/
│  ├─ _template/
│  └─ <feature-slug>/
│     ├─ feature.yaml
│     ├─ openapi.yaml
│     ├─ design.md
│     └─ examples/
├─ generated/
│  ├─ bundled-openapi/
│  ├─ html/
│  └─ reports/
├─ Fix/                  # 承認済み・納品対象Word
├─ 作成済み/             # レビュー前Word
├─ 参考_作業用/          # 再生成可能なドラフト
└─ テンプレート/          # Word生成テンプレート
```

空の `openAPI` と `feature` は現行正本ではなく、今後 `features/<slug>/` へ統合する。

## 機能単位のファイル

### feature.yaml（内部管理用）

機能を特定し、AI作業、検証、Word生成を制御するための機械可読なマニフェストとする。開発者向けAPI設計セットには含めない。`sources.requirements`は内部メモへのトレーサビリティであり、その内容が実装正本であることを意味しない。

```yaml
id: API-019
slug: ship-department
title: SHIP部署マスタ
phase: 1
status: Fix
authoringMode: openapi
screens:
  - /ship-department-master
sources:
  requirements: ../../../機能要件.md # 内部作業メモへのトレーサビリティ
  database: ../../../db/db-schema.puml
  openapi: ./openapi.yaml
  design: ./design.md
deliverable:
  word: ../../Fix/API設計書_SHIP部署マスタ.docx
  template: ../../テンプレート/API設計書_標準テンプレート.docx
  version: "1.0"
```

`authoringMode`は次の3値とする。

- `legacy-ps1`: `scripts/specs/api-docs/<slug>.ps1`をWord内容ソースとする
- `openapi`: `openapi.yaml`、`design.md`、`feature.yaml`を正本とする
- `none`: 個別API設計書を作らず、`rationale`と必要に応じて`coveredBy`で理由と統合先を示す

### openapi.yaml

- 当面は OpenAPI `3.0.4` を使用する。
- APIの外部I/F契約だけを記載する。
- `operationId`を`design.md`との紐付けキーにする。
- 同一Path/Methodを複数の機能設計書で扱う場合は、移行時の`operation-id-prefix`で一方の`operationId`に機能プレフィックスを付ける。URL契約は変更せず、`design.md`の操作見出しにも同じプレフィックスを使用する。
- 共通定義は`../common/`を参照する。
- 単一の機能権限は`x-authorization-mode: feature-code`と`x-feature-code`で表す。
- 複数の機能権限をすべて必要とするAPIは`x-authorization-mode: feature-code-all`と`x-feature-codes`で表す。
- リクエスト値や対象データに応じて必要権限が切り替わるAPIは`x-authorization-mode: dynamic`と候補の`x-feature-codes`で表し、判定条件は`design.md`に記載する。
- 固定クエリを含む旧PathはOpenAPIのPathとquery parameterへ分離し、固定値はquery parameterの`enum`で表す。

### design.md

最低限、次の章を設ける。

1. 概要・対象画面
2. 画面操作とAPIの関係
3. 使用テーブル
4. 共通権限・施設スコープ
5. `operationId`別の処理仕様
6. 業務ルール・状態遷移
7. エラー補足
8. 運用・保守
9. 未確定事項

Request／Responseの項目定義はOpenAPIを正とし、`design.md`へ複製しない。

## Word生成（納品工程）

移行前は、`../scripts/specs/api-docs/*.ps1`から既存ジェネレーターを利用する。

```powershell
powershell -ExecutionPolicy Bypass -File taniguchi\scripts\generate-api-doc-word.ps1 `
  -SpecPath taniguchi\scripts\specs\api-docs\ship-department.ps1
```

Wordは原則として納品時にまとめて生成する。途中時点のWordレビューを明示された場合だけ、既定出力先の`参考_作業用`を使用する。正式な`Fix`更新は納品または明示指示時だけ行う。

OpenAPI移行済み機能は、次のコマンドで`feature.yaml`、`openapi.yaml`、`design.md`からWord生成用共通モデルを構築し、既存のWord書式共通ライブラリへ渡す。

```powershell
powershell -ExecutionPolicy Bypass -File taniguchi\scripts\generate-api-doc-word-from-openapi.ps1 `
  -ManifestPath taniguchi\api\features\ship-department\feature.yaml
```

明示的に途中生成する場合は、`参考_作業用`へタイムスタンプ付きドラフトを生成する。`-OutputPath`でレビュー用出力名を固定できる。`-Publish`は`feature.yaml`の`deliverable.word`へ出力するため、納品または正式な`Fix`更新を明示された場合だけ使う。移行済み機能の`.ps1`は移行根拠として残してよいが、以後は同じAPI定義を手修正しない。

## Git管理

- OpenAPI、MD、YAML、共通定義、生成スクリプト、Wordテンプレートは追跡対象とする。
- bundle、HTML、検証レポート、ドラフトWordは再生成可能なため原則として追跡しない。
- 承認済みWordは納品物として追跡する。
- Word変更時は、同じ変更に生成元テキストの差分を含める。

### 開発者との受け渡し

開発者へ渡す標準セットは、対象機能の`openapi.yaml`、`design.md`、およびOpenAPIが参照する`common/`配下の定義（または外部参照解決済みbundle）とする。開発者はWordファイルを置き換えて仕様変更を伝えるのではなく、これらを同じGitブランチで編集し、Pull Requestのテキスト差分をレビュー対象とする。

`../機能要件.md`、`feature.yaml`、`catalog.yaml`、JSON Schema、旧Word生成用`.ps1`、`work/`配下のファイル、納品前のWordは標準セットへ含めない。DB変更を伴う場合は、DB設計の連携として`../db/db-schema.puml`等を別途明示する。

| 変更内容 | 修正する正本 | 同時確認するもの |
| --- | --- | --- |
| URL、HTTPメソッド、項目、型、必須、ステータス | `openapi.yaml` | API実装、クライアント、テスト、生成Word |
| 権限、DB処理、トランザクション、業務ルール | `design.md` | 要件、DB、実装、生成Word |
| テーブル、カラム、制約、リレーション | `db/db-schema.puml` | OpenAPI、`design.md`、DB定義書 |
| 機能ID、移行状態、入出力先 | `feature.yaml`、`catalog.yaml` | 検証コマンド、生成先 |
| Word書式 | テンプレートまたは共通生成ライブラリ | 全ページ表示、構造、アクセシビリティ |

Wordはバイナリのため、Git上では「ファイルが変わった」ことは分かっても、項目単位の差分レビューには向かない。通常の開発PRには変更したOpenAPI＋MDとソース監査結果を含め、Wordは納品時にまとめて再生成する。開発者がファイル一式を受け取る場合も、フォルダごとの上書きではなくブランチへコミットし、Git差分で競合と変更箇所を確認する。開発者が`機能要件.md`を参照しないと判断できない事項が残っている場合は、連携前にOpenAPIまたは`design.md`へ反映する。

### Pull Requestの最小単位

内部の設計管理PRでは、原則として次を1つのPRへまとめる。開発者へ渡す範囲は前節の標準セットに限定する。

1. `feature.yaml`（メタデータ変更がある場合）
2. `openapi.yaml`
3. `design.md`
4. `db-schema.puml`（DB変更がある場合）
5. 生成したWord（納品更新時のみ）
6. 検証コマンドの結果

## 現行台帳

`catalog.yaml`は、全機能のID、slug、移行方式、legacy spec、承認済みWordを解決する機械可読な入口とする。
移行完了までは`API設計書_一覧.md`を詳細説明と状態の人間向け台帳として併用し、検証コマンドでID、機能名、Phase、状態のずれを検出する。
将来は機能別`feature.yaml`から`catalog.yaml`と`API設計書_一覧.md`を生成し、長い機能固有仕様は各`design.md`へ移す。

## 検証

リポジトリルートから次を実行する。

```powershell
npm run api:foundation:verify
npm run api:source:audit
npm run api:migration:audit
```

基盤検証では、JSON Schema、YAML構文、ID・slugの重複、現行台帳との対応、legacy spec、`coveredBy`、マニフェストの参照先、OpenAPI標準構文と外部参照、operationIdの全機能一意性、認可方式、権限コード、`design.md`との対応、`dbTables`のPUML実在性を確認する。

`api:source:audit`は通常開発用とし、Fix 29機能・318 operation・移行計画の完了状態を横断確認し、29件すべてでlegacy specとOpenAPI＋MD由来モデルの同等性を再検証する。通常のFix判定はこのソース監査までとし、Word本文検証は実行しない。結果を`work/api-openapi-migration/source-audit/report.json`へ出力する。

`api:migration:audit`は納品更新時に使用する。ソース監査に加えて納品用Wordの本文一致を29件すべてで確認し、結果を`work/api-openapi-migration/full-audit/report.json`へ出力する。

通常は`migrationParity: strict`相当として、Word見出し・権限・処理仕様までlegacy specとの同等性を確認する。第三弾パイロットのように内部設計MDを再構成・拡充した機能だけは、`feature.yaml`へ理由を記録したうえで`migrationParity: contract`とし、エンドポイント・入出力・HTTPステータスの契約同等性を確認する。

移行作業中は、現行正本を`authoringMode: legacy-ps1`のまま維持し、`migrationManifest`でレビュー中のOpenAPIマニフェストを登録する。Word・内容・体裁のレビュー完了後に`manifest`へ切り替え、`migrationManifest`を削除する。これにより、未検証のOpenAPIを正本扱いしない。

## OpenAPI移行状態

Fix 29機能はすべてOpenAPI方式へ切り替え済みである。`API-019 SHIP部署マスタ`は第三弾パイロット、残り28機能は第四弾で移行した。各機能は次の3ファイルを正本とする。

- `features/<slug>/feature.yaml`
- `features/<slug>/openapi.yaml`
- `features/<slug>/design.md`

`Fix/*.docx`は最後にOpenAPI＋MDから生成・承認した時点の納品スナップショットであり、通常開発中は最新のテキスト正本と一致するとは限らない。以後の変更はOpenAPI＋MDを修正してソース監査を行い、納品時に全Wordを再生成・確認してFix版を更新する。
