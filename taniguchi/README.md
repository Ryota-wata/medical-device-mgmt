# taniguchi 配下の管理方針

この配下には、医療機器管理システムの内部作業メモ、API設計、DB設計、生成基盤、納品成果物をまとめる。
内部検討と開発者向け仕様の境界を保ちつつ、開発者が受け取るOpenAPI＋補足MDをGitでレビューでき、納品時にWord・Excel成果物を再生成できる状態を目標とする。

作業時の必須ルールは[AGENTS.md](./AGENTS.md)を参照する。

## 管理原則

- 編集可能な正本はMarkdown、YAML、PlantUML、スクリプトで管理する。
- Word、SVG、Excelなどのバイナリ成果物は、正本から再生成する。
- APIの外部I/Fと内部処理設計を分離する。
- `機能要件.md`は内部作業メモとし、確定したAPI仕様はOpenAPIと機能別MDへ反映する。
- 1機能ごとに関連ファイルをまとめ、対象外の大規模調査を避ける。
- 移行期間中は機能ごとに旧`.ps1`方式とOpenAPI方式を明示し、二重編集を防ぐ。

## 正本と生成物

| 対象 | 正本 | 主な生成物 |
| --- | --- | --- |
| 内部検討メモ | `機能要件.md` | なし。承認内容を各正本へ反映する |
| API外部契約 | 機能別`openapi.yaml` | Swagger表示、bundle、WordのI/F章 |
| API内部設計 | 機能別`design.md` | Wordの概要・処理・権限・運用章 |
| DB構造 | `db/db-schema.puml` | `db-schema.svg`、`データベース定義書.xlsx` |
| 納品API設計書 | OpenAPI＋MD＋メタデータ | 承認済み`.docx` |

## 現在の構成

- `機能要件.md`
  - 依頼者・AI向けの検討メモ。開発者への連携物には含めない
- `api/`
  - API台帳、Word API設計書、今後追加するOpenAPIと機能別MD
  - 詳細は[api/README.md](./api/README.md)を参照
- `db/`
  - DB構造の正本と生成成果物
  - 詳細は[db/README.md](./db/README.md)を参照
- `docs/`
  - 横断ポリシー、承認済み方針、設計補助資料
- `scripts/`
  - API設計書とDB設計書の生成・同期スクリプト
- `work/`
  - 正本ではないPoC、一時検証、作業メモ

## API設計の段階移行

現時点のWord API設計書は、`scripts/specs/api-docs/*.ps1`から生成する。
今後は機能ごとに次の正本へ移行する。

```text
openapi.yaml
design.md
feature.yaml（内部管理用）
    ↓
Word生成用共通モデル
    ↓
納品用API設計書.docx
```

OpenAPI方式では、開発者向けの正本を`openapi.yaml`と`design.md`に集約する。`feature.yaml`はAI・生成・監査用の内部メタデータであり、開発者向け仕様には含めない。

## 開発者への連携

通常の開発連携では、対象機能の`openapi.yaml`、`design.md`、参照する`api/common/`だけを渡す。`機能要件.md`、`feature.yaml`、`catalog.yaml`、旧`.ps1`、作業レポート、Wordは含めない。

確定事項が`機能要件.md`にだけ残っていないことを確認してから連携する。DB変更がある場合は、DB設計の変更として`db/db-schema.puml`等を別途明示する。

## 生成と公開

- API設計書Wordは原則として納品時にまとめて生成する。途中レビューを明示された場合だけ`api/参考_作業用`へ出力する。
- `api/Fix`は最後に承認したWordスナップショットの保存先とし、納品または明示指示時だけ更新する。
- DBのSVG、Excel、同期レポートは`db-schema.puml`から再生成・同期する。
- 生成物の不具合は、生成元または生成処理へ戻して修正する。
- 納品前は、DB、OpenAPI、内部設計、Wordの整合をまとめて確認する。

## 移行予定

1. 管理ルール、README、Git追跡ルールを整備する。
2. API機能ディレクトリ、共通定義、マニフェストの雛形を作成する。
3. 1機能をOpenAPI方式へ移行し、ソース監査を検証する。
4. 新規・変更対象から段階的に移行する。
5. lint、bundle、差分検出、ソース監査を自動化し、納品工程としてWord生成と成果物整合確認を実行する。
