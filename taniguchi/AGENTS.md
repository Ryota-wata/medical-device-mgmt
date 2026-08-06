# taniguchi 設計成果物の作業ルール

このファイルは `taniguchi/` 配下の要件、API設計、DB設計、生成スクリプト、納品物に適用する。
リポジトリルートの `AGENTS.md` と併せて適用し、矛盾する場合は、より具体的な本ファイルのルールを `taniguchi/` 配下に限って優先する。

## 1. 基本原則

- 人が継続的に修正する正本は、可能な限り Git 差分を確認できる Markdown、YAML、PlantUML、スクリプトで管理する。
- Word、SVG、Excel、HTML、bundle、検証レポートは正本から生成する成果物とし、生成物だけを直接修正しない。
- 同じ定義を複数ファイルへ重複記載しない。特に API の Request / Response / HTTP ステータスは、移行後は OpenAPI を唯一の正本とする。
- `機能要件.md` は依頼者・AIが検討途中の情報を置く内部作業メモであり、開発者への連携物および実装時の正本には含めない。
- 開発者が `機能要件.md` を参照しなくても実装できるよう、承認済みの仕様は機能別 `openapi.yaml`、`design.md`、必要な `api/common/` へ反映してから連携する。
- 機能単位で必要なファイルを特定し、横断変更でない限り全機能・全設計書を読み込まない。
- 実データ、患者情報、顧客機密情報をサンプルや OpenAPI example に含めない。

## 2. 領域別の正本と内部メモ

1. 現在のユーザー指示と承認済み判断を最優先する。
2. API の URL、HTTPメソッド、Request / Response、認証、HTTPステータスは機能別 `openapi.yaml` を正本とする。
3. API の画面対応、処理、権限、DB利用、トランザクション、業務ルール、運用設計は機能別 `design.md` を正本とする。
4. テーブル、カラム、制約、リレーションは `db/db-schema.puml` を正本とする。
5. `feature.yaml` と `api/catalog.yaml` は、対象機能、参照先、生成先、状態を管理する内部メタデータとする。
6. `機能要件.md` は検討・起票・確認に用いる内部作業メモであり、確定仕様を直接実装するための正本にはしない。
7. 生成された Word、SVG、Excel、HTML、bundle、レポートは、各正本の特定時点のスナップショットとする。

`機能要件.md` と OpenAPI / `design.md` / DB設計が異なる場合、作業メモの内容を自動的に採用しない。未反映の承認事項か新しい検討案かを確認し、承認済みの場合だけ該当する正本へ反映する。
OpenAPI、`design.md`、DB設計の間で実装不能な矛盾がある場合は独自解決せず、矛盾を記録してユーザー判断を求める。
承認された変更は、開発者へ連携する前に関連する正本へ反映し、`機能要件.md` だけに確定仕様を残さない。

## 3. API設計の移行状態

- `feature.yaml` が存在しない機能、または `authoringMode: legacy-ps1` の機能は、`scripts/specs/api-docs/<slug>.ps1` を現行の Word 内容ソースとして扱う。
- `authoringMode: openapi` の機能は、`api/features/<slug>/openapi.yaml`、`design.md`、`feature.yaml` を正本とする。
- `authoringMode: none` の機能は、個別API設計書を作らず、`rationale`と必要に応じて`coveredBy`で理由と統合先を明示する。
- 1機能を移行している途中に OpenAPI と `.ps1` を並行して手修正しない。切替単位は機能ごととする。
- OpenAPI方式への移行完了は、OpenAPI検証、`design.md`・DB設計・移行前specとの整合確認、ソース監査が完了した状態とする。Word再生成と内容・体裁確認は納品時の完了条件として別に扱う。

## 4. OpenAPIの作成ルール

- 当面は OpenAPI `3.0.4` を既定とし、開発側ツールチェーンの対応確認後に版を変更する。
- 機能ディレクトリ名は ASCII の `kebab-case` とする。
- `operationId` は API 全体で一意な `lowerCamelCase` とし、`design.md`との安定した紐付けキーとして扱う。
- 各operationに`x-authorization-mode`を記載し、`public`、`authenticated`、`feature-code`、`feature-code-all`、`system-admin`、`dynamic`、`system-fixed`のいずれかで認可方式を明示する。`feature-code`では`x-feature-code`、`feature-code-all`と`dynamic`では`x-feature-codes`も必須とする。
- 共通 schema、response、parameter、security scheme は `api/common/` へ置き、機能側から参照する。
- 各 operation には summary、description、主要な正常応答、想定エラーを記載し、securityはAPI全体またはoperation単位で明示する。
- Request / Response schema には型、必須、format、制約、説明を記載し、可能な範囲で合成サンプルを付ける。
- DB内部名や詳細な処理手順を外部公開用 OpenAPI へ過剰に埋め込まない。内部設計は `design.md` に記載する。

## 5. design.mdの作成ルール

- APIごとの記述は OpenAPI の `operationId` を見出しとして対応づける。
- 少なくとも、対象画面操作、使用テーブル、権限・施設スコープ、処理仕様、トランザクション、業務ルール、エラー補足を記載する。
- Request / Response の項目表を OpenAPI から転記しない。Word生成時に OpenAPI から展開する。
- 長い機能固有仕様を `api/API設計書_一覧.md` に蓄積せず、該当機能の `design.md` へ置く。
- 未確定事項には識別子と判断が必要な論点を記載し、確定後は正本へ反映して未確定記述を解消する。

## 6. DB設計の作業ルール

- DB構造の正本は `db/db-schema.puml` とする。
- `db-schema.svg`、`データベース定義書.xlsx`、同期レポートは生成物として扱う。
- テーブル、カラム、型、NULL可否、制約、リレーション変更は、最初に PUML へ反映する。
- API変更で永続化へ影響する場合は、関連テーブルだけを確認し、OpenAPIと`design.md`の双方から整合を検証する。
- 生成物の不具合は PUML、同期スクリプト、テンプレートのいずれかへ戻して修正する。

## 7. Word API設計書の作業ルール

- Wordは納品必須成果物だが、日常の編集元および通常の開発者連携物にはしない。
- `legacy-ps1`機能は`scripts/generate-api-doc-word.ps1`、`openapi`機能は`scripts/generate-api-doc-word-from-openapi.ps1`を使い、共通書式処理は`scripts/lib/word-api-doc-common.ps1`を利用する。
- Wordは原則として納品時に全対象をまとめて生成する。ユーザーが明示したレビューまたは生成依頼がある場合だけ、途中時点のドラフトを `api/参考_作業用` へ生成する。
- `api/Fix` の既存Wordは最後に生成・承認した時点のスナップショットであり、現在のOpenAPI＋MDと常時同期しているとはみなさない。`api/Fix` の更新は納品またはユーザーが明示した場合だけ行う。
- 書式不具合は生成済み `.docx` ではなく、仕様ソース、共通生成ライブラリ、テンプレートへ戻して修正する。
- 納品時の生成後は、OpenAPI、`design.md`、DB設計、移行前specとの内容整合、およびテンプレート準拠を確認する。
- 納品版Wordと、その生成元ソースのコミットまたはタグを対応づけ、どの時点の仕様から生成したか追跡可能にする。

## 8. AI作業手順

1. `api/catalog.yaml`または`api/API設計書_一覧.md`から対象機能を特定する。
2. `feature.yaml`があれば`authoringMode`と関連ファイルを確認する。
3. ユーザー指示と対象機能のOpenAPI、`design.md`、関連DB定義を確認する。`機能要件.md`は、ユーザーが参照を求めた場合または検討経緯の確認が必要な場合だけ内部資料として読む。
4. `機能要件.md`を参照した場合も、その記述を確定仕様と仮定せず、採用する内容を整理する。
5. 変更対象となる正本ファイルと生成物を整理し、正本を修正する。
6. 構文、参照、DB、OpenAPI、`design.md`間の整合と、開発者が連携物だけで実装できることを検証する。
7. 通常開発ではソース監査まで行い、Wordは生成しない。納品または明示依頼時だけWordやDB成果物を生成する。
8. 生成した場合は内容・体裁を再確認し、対象機能の状態を更新する。

API設計基盤を変更した場合は、リポジトリルートから`npm run api:foundation:verify`を実行する。

## 9. 状態と公開

- `未着手`: 個別設計未作成
- `作成済み`: OpenAPI＋`design.md`のドラフト作成済み、レビュー未完了。Word生成は必須ではない
- `Fix`: OpenAPI、`design.md`、DB整合、ソース監査が完了し、開発者向けAPI設計が実装可能な水準
- `不要`: 他設計書に統合、または個別API不要
- `旧版`: 現行正本ではない履歴資料
- `参考_作業用`: 一時生成・レビュー用

状態を `Fix` に変更したり、正式Wordを置き換えたりする操作は、ユーザーの明示指示がある場合だけ行う。`Fix` はWordが最新であることを意味せず、納品用Wordの同期確認は納品監査で判定する。

## 10. 開発者へのAPI設計連携

開発者へ連携するAPI設計の標準セットは次のとおりとする。

1. 対象機能の `api/features/<slug>/openapi.yaml`
2. 対象機能の `api/features/<slug>/design.md`
3. OpenAPIが参照する `api/common/` 配下の共通定義、または外部参照を解決したbundle
4. 変更対象・変更理由・基準コミットを記載した短い連絡文またはPull Request

次の内部資材は標準の開発者連携セットへ含めない。

- `機能要件.md`
- `feature.yaml`、`api/catalog.yaml`、各JSON SchemaなどのAI・生成・監査用メタデータ
- `scripts/specs/api-docs/*.ps1`などの旧Word生成元
- `work/`配下の監査中間物、検証レポート、作業ファイル
- 納品時より前のWord API設計書

DB変更がある場合の `db/db-schema.puml` やDB成果物は、API設計セットへ暗黙に追加せず、DB設計の連携物として別途明示する。
開発者は `機能要件.md` を参照せず、OpenAPIと `design.md` のGit差分を実装・レビューの基準とする。
同じGitリポジトリ全体への閲覧権限を付与すると `機能要件.md` も技術的には閲覧可能になる。単に「実装正本・連携対象から外す」場合はPRと案内文で対象パスを限定し、内容自体を非共有にする場合は上記ファイルだけを含む開発者向け別リポジトリまたは配布パッケージを使用する。

## 11. Gitと安全性

- 既存の未コミット変更はユーザーの作業として扱い、上書き、巻き戻し、無断移動をしない。
- 生成前後で対象ファイルの差分を確認する。
- Wordの差分だけで変更内容を判断せず、必ず生成元のテキスト差分をレビューする。
- ファイル移動や旧資材削除は、参照元と生成スクリプトを確認したうえで独立した変更として実施する。
- `git push` はユーザーの明示的な許可があるまで実行しない。
