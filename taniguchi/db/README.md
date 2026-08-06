# DB設計資産の管理方針

このディレクトリは、DB構造の正本と、そこから生成する確認・納品用成果物を管理する。
詳細な作業ルールは `../AGENTS.md` に従う。

## 現在のファイル責務

| ファイル | 種別 | 扱い |
| --- | --- | --- |
| `db-schema.puml` | 正本 | テーブル、カラム、型、制約、リレーションを編集する |
| `db-schema.svg` | 生成物 | PUMLから生成するER図。直接編集しない |
| `データベース定義書.xlsx` | 納品用生成物 | PUMLとの整合を保ち、直接の構造変更元にしない |
| `db-definition-sync-report.json` | 検証レポート | 同期結果として再生成する |

DB構造に関する情報をExcelだけへ追加しない。必要な構造・定義情報は、PUMLまたは同期処理が参照できるテキスト正本へ戻す。

## 更新フロー

1. 対象機能の要件と関連テーブルを確認する。
2. `db-schema.puml`を更新する。
3. APIへ影響する場合はOpenAPIと機能別`design.md`を更新する。
4. `db-schema.svg`を再生成する。
5. `データベース定義書.xlsx`を同期する。
6. 同期レポートを確認する。
7. PUML、SVG、Excel、API設計の整合をレビューする。

## API設計との境界

- APIのRequest／Response型はOpenAPIを正とする。
- DBの物理名、制約、リレーションはPUMLを正とする。
- APIが利用するテーブル、READ／CREATE／UPDATE／DELETE、処理順、トランザクションは機能別`design.md`に記載する。
- API項目とDBカラムの名称が異なる場合は、`design.md`に対応関係を明記する。
- 要件とDB設計が矛盾する場合は、生成物側で補正せず判断を求める。

## 目標構成

ファイル移動は生成スクリプトの参照先を同時に直せる段階で実施する。

```text
db/
├─ README.md
├─ db-schema.puml
├─ generated/
│  └─ db-schema.svg
├─ deliverables/
│  └─ データベース定義書.xlsx
└─ reports/
   └─ db-definition-sync-report.json
```

移行完了までは現在のパスを維持し、生成物を手作業で別階層へ移さない。

## 検証

- PUMLが構文エラーなく描画できること
- テーブルとカラムがExcel定義書に欠落していないこと
- 主キー、外部キー、一意制約、NULL可否が一致すること
- ER図が最新PUMLから生成されていること
- 関連APIの型、必須、削除制約、トランザクションと矛盾しないこと

