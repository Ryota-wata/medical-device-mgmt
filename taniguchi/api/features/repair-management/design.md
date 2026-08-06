# 修理管理 API内部設計

## 第1章 概要

### 本書の目的

本書は、修理管理タブ画面（`/quotation-data-box/repair-requests`）および修理申請管理タスク画面（`/repair-task`）で利用する API の設計内容を整理し、画面要件、DB設計、修理申請API設計書、移動・廃棄管理との責務境界を一致させることを目的とする。

特に以下を明確にする。

- No.6 修理申請API設計書で起票された修理申請を受け付ける I/F
- タスク管理配下の修理管理一覧・詳細・工程進行 I/F
- 登録済み資産と未登録資産の修理管理上の扱い
- 院内修理と院外修理のステータス遷移
- 初回受付時はログインユーザーを受付担当者の初期選択値とし、各STEPの確定操作時に選択された担当者へ受付情報を更新する方針
- 導入業者・保守契約は初回受付時にサーバー側で保存する参照情報とし、STEP1の手入力見積依頼先とは分離する方針
- 申請時の代替機選択 `NOT_NEEDED` / `NEEDED` / `REQUESTED` を保持し、STEP1の必要／不要を別の管理判断として保存する方針
- 参考見積・発注登録用見積・追加見積の登録上限と発注時の採用見積決定
- 修理タスク一覧のステータス別期限表示と、複数依頼先の最短見積提出期限の算出
- 二重作成を伴う登録系POST APIの冪等再送、状態更新系POST APIの自然冪等、DBコミット結果不明時の復旧、共通ロック順序
- ファイル登録時の決定的な最終S3キーへの直接保存、コミット前失敗時のAPI内補償削除、再送時の同一オブジェクト再利用
- 依頼送信操作における依頼先情報の保存と、外部メール送信対象外の責務境界
- STEP4完了書類の複数ファイル一括登録、条件付き必須項目、論理削除、および修理申請単位の所有関係
- 通常却下と修理不能による廃棄申請接続の内部識別
- 登録済み資産および修理申請経由の未登録資産を対象とする廃棄申請接続
- 申請者情報のログインユーザー自動取得と feature_code 分離

### 対象システム概要

修理管理は、No.6 修理申請API設計書で起票された現場からの修理依頼を受け付け、ME室または修理管理担当者が院内対応または外部依頼へ振り分け、STEP1 見積依頼、STEP2 見積登録・発注、STEP3 作業日登録、STEP4 完了登録まで進行する業務機能である。メニューからの修理依頼起票と、タスク管理配下の修理管理は別機能として認可する。

修理申請の起票APIは No.6 修理申請API設計書で定義する。本書では起票済みの `applications.application_type='REPAIR'` を対象に、受付後の工程進行、ドキュメント管理、廃棄申請接続を扱う。

### 用語定義

| 用語 | 説明 |
| --- | --- |
| 修理申請 | No.6 修理申請API設計書で起票される現場依頼。本書では起票後の管理工程を扱う |
| 修理管理 | タスク管理配下で修理申請を受付・進行する業務。`repair_management` で認可する |
| 登録済み資産 | 資産台帳 `asset_ledgers` に存在し、`application_assets.asset_ledger_id` を保持する修理対象 |
| 未登録資産 | 資産台帳に登録せず、`repair_request_details.manual_item_name` 等の手入力列と `application_assets` スナップショットで保持する修理対象 |
| 院内修理 | `repair_request_details.repair_category='IN_HOUSE'`。外部見積・発注工程をスキップし、`applications.status='納期確定'` としてSTEP3へ進む |
| 院外修理 | `repair_request_details.repair_category='OUTSOURCED'`。見積依頼、見積登録・発注、作業日登録、完了登録へ進む |
| 発注登録用見積 | `quotations.quotation_phase='ORDER_REGISTRATION'`。1修理タスクにつき有効な見積を1件だけ許可し、発注時にサーバー側で自動採用する |
| 追加見積 | `quotations.quotation_phase='ADDITIONAL'`。発注後からタスク完了前まで複数登録でき、採用済み発注登録用見積と発注情報は変更しない |
| 修理不能 | 通常却下と区別するため `application_task_steps.completion_reason='UNREPAIRABLE'` を保持し、廃棄申請接続APIで後続廃棄申請を作成する判断 |

### 対象画面

| 画面名 | 画面パス | 利用目的 |
| --- | --- | --- |
| 修理管理タブ画面 | /quotation-data-box/repair-requests | 修理申請受付一覧と修理タスク管理リストを表示し、詳細画面へ遷移する |
| 修理申請管理タスク画面 | /repair-task | 修理申請を受付から完了まで4ステップで進行する |

## 第2章 システム全体構成

### API の位置づけ

本API群は、起票済み修理申請の受付から修理管理タスクの完了までを扱う。修理申請の起票前準備と起票登録は No.6 修理申請API設計書を正本とし、本書では `/repair-request` 系APIを定義しない。

修理不能から廃棄申請へ接続する場合は、登録済み資産と未登録資産の両方を対象とし、廃棄申請側の `disposal_application_details.related_repair_application_id` に元修理申請IDを保持する。未登録資産の場合も資産台帳へ登録せず、修理申請内の手入力情報と申請明細スナップショットを廃棄対象物品情報として引き継ぐ。修理申請を経由しない未登録資産の単独廃棄申請は本書の対象外である。

### 画面と API の関係

| 画面操作 | API | 補足 |
| --- | --- | --- |
| 修理管理タブ初期表示/フィルター | `GET /quotation-data-box/repair-requests/tasks` | 初期表示では `step=RECEPTION` と `step=ALL` を並列実行し、申請受付一覧と受付済み修理タスク一覧を分けて取得する |
| 受付担当者候補検索 | `GET /repair-task/reception-assignees` | 作業対象施設で修理申請管理を担当できる病院ユーザー・SHIPユーザーを氏名検索する |
| 修理タスク削除 | `DELETE /repair-task/tasks/{repairTaskId}` | 見積登録済かつ発注前の修理タスクを論理削除し、修理管理タブ一覧から除外する |
| 修理タスク詳細表示 | `GET /repair-task/tasks/{repairTaskId}` | STEP表示、入力済み内容、初回受付時の導入業者・保守契約参照情報、登録済み添付情報を取得する |
| 修理申請書プレビュー | `GET /repair-task/tasks/{repairTaskId}/application-preview` | 保存済みの修理申請データから申請書PDFを都度生成し、PDFバイナリを返す。DB・Amazon S3には保存しない |
| 院内/院外振り分け | `POST /repair-task/tasks/{repairTaskId}/approve` | STEP1の受付判定、選択した受付担当者情報、資産・契約参照情報のスナップショットを保存する |
| 申請却下 | `POST /repair-task/tasks/{repairTaskId}/reject` | 有効な発注登録用見積がある発注前のSTEP2で通常却下を保存する |
| 見積依頼書プレビュー | `POST /repair-task/tasks/{repairTaskId}/vendor-requests/preview` | 画面入力中の業者情報から見積依頼書を一時生成し、DB保存せず右ペインへ表示する |
| 見積依頼先登録・依頼送信 | `POST /repair-task/tasks/{repairTaskId}/vendor-requests` | 院外修理の見積依頼先、依頼内容、STEP1入力、依頼操作日時、操作ユーザーを保存する。外部メールは送信しない |
| 見積依頼先削除 | `DELETE /repair-task/tasks/{repairTaskId}/vendor-requests/{rfqVendorId}` | STEP1完了前の依頼先を一覧から論理削除する |
| 見積依頼完了 | `POST /repair-task/tasks/{repairTaskId}/vendor-requests/complete` | 依頼送信操作が保存済みの有効な依頼先が1件以上あることを確認し、STEP2へ進める |
| 見積登録 | `POST /repair-task/tasks/{repairTaskId}/quotations` | 参考見積、発注登録用見積、追加見積と見積原本を保存する |
| 登録済み見積表示 | `GET /repair-task/tasks/{repairTaskId}/quotations/{quotationId}/preview-url` | 一覧で選択した登録済み見積書の認可済みプレビューURLを取得する |
| 登録済み見積削除 | `DELETE /repair-task/tasks/{repairTaskId}/quotations/{quotationId}` | 発注前見積、または発注後から完了前までの追加見積を論理削除し、見積書原本のS3オブジェクトを同期削除する |
| 発注書プレビュー | `POST /repair-task/tasks/{repairTaskId}/order/preview` | 唯一の発注登録用見積から発注書を一時生成し、DB保存せず右ペインへ表示する |
| 発注書発行 | `POST /repair-task/tasks/{repairTaskId}/order` | 唯一の発注登録用見積を自動採用し、発注情報と発注書を登録して `発注済` へ進める。発注書送付は行わない |
| 作業日登録 | `POST /repair-task/tasks/{repairTaskId}/work-date` | 作業完了予定日を保存しSTEP4へ進める |
| 完了書類追加/削除/表示 | `POST /repair-task/tasks/{repairTaskId}/documents` / `DELETE /repair-task/tasks/{repairTaskId}/documents/{documentId}` / `GET /repair-task/tasks/{repairTaskId}/documents/{documentId}/preview-url` | STEP4の完了書類を修理申請単位で管理する |
| 完了登録 | `POST /repair-task/tasks/{repairTaskId}/complete` | 修理申請と工程を完了し、貸出管理機器が使用不可の場合は貸出可へ戻す。資産台帳・個体情報は更新しない |
| 対象品の廃棄申請へ | `POST /repair-task/tasks/{repairTaskId}/disposal-application` | STEP2の見積登録済で、登録済み資産または未登録資産の修理不能から廃棄申請を作成する。元修理申請は `却下` / `UNREPAIRABLE` で終端する |

### 使用テーブル

| テーブル名 | 利用種別 | 用途 |
| --- | --- | --- |
| `applications` | READ / CREATE / UPDATE | 修理申請ヘッダー、申請者情報、状態、却下情報。修理不能から廃棄申請へ接続する場合は廃棄申請ヘッダーを作成する |
| `repair_request_details` | READ / UPDATE | 修理対象の登録済/未登録区分、症状、申請時の代替機選択、修理管理の代替機対応判断、修理区分、現在の受付担当者情報、初回受付時の導入業者・保守契約参照情報、主依頼先業者、最短見積提出期限、代替機の日付・返却状態、商品引取情報、作業完了予定日。`alternative_device_status` は読取専用とし、`alternative_device_handling_required_flag` と `repair_category` を修理管理で設定する |
| `application_assets` | READ / CREATE | 修理対象機器の明細。登録済み資産は `asset_ledger_id`、未登録資産は表示用スナップショットを保持する。修理不能から廃棄申請へ接続する場合は廃棄対象明細を作成する |
| `application_task_steps` | READ / CREATE / UPDATE | 修理タスク工程、スキップ工程、通常却下/修理不能の完了理由 |
| `application_status_histories` | CREATE / READ | 状態遷移履歴 |
| `rfq_status_histories` | CREATE / READ | 院外修理RFQの作成・見積依頼完了・見積登録・見積削除・発注・納期確定・申請見送り・完了の状態遷移履歴 |
| `application_status_definitions` | READ | REPAIRの保存ステータス、表示順、終端判定 |
| `repair_requests` VIEW | READ | 修理管理タブ一覧、絞り込み、タスク遷移用の投影。期限列は本VIEWに加えて `repair_request_details` と修理RFQの依頼先情報を補助参照して算出する |
| `asset_ledgers` | READ | 登録済み資産の施設スコープ確認、初回受付時の導入業者フォールバック情報。未登録資産の廃棄申請接続では作成・更新しない |
| `maintenance_contract_assets` / `maintenance_contracts` | READ | 初回受付時に登録済み資産の有効な保守契約を参照する |
| `inspection_results` | READ | 修理申請に紐づく点検結果の参照・詳細表示補助 |
| `application_documents` | READ / CREATE / UPDATE | 見積書、発注書、STEP4完了書類のファイルメタデータ。ファイル実体はAmazon S3に保存し、`file_path` にはS3オブジェクトキーのみ保持する。DELETE APIも物理DELETEは行わず、`deleted_at` を更新し、対象ファイルを他の有効なドキュメントが参照していない場合にS3オブジェクトを同期削除する |
| `rfqs` | READ / CREATE / UPDATE | 院外修理の見積依頼グループ。1修理申請につき有効な `management_type='REPAIR'`、`workflow_type='RFQ'` を1件だけ許可する。グループ単位のご依頼事項は `request_comment`、一覧用の最短見積提出期限は `due_on` を保持する |
| `rfq_vendors` | READ / CREATE / UPDATE | 手入力した見積依頼先、主依頼先、依頼送信状態、業者別回答期限。修理RFQの有効な `SENT` / `REPLIED` 行に設定された `due_on` の最小値を一覧期限へ同期する |
| `rfq_applications` | CREATE / READ | RFQと修理申請/申請明細の紐づけ |
| `quotations` | READ / CREATE / UPDATE | 参考見積、発注登録用見積、追加見積。発注登録用見積は1タスク1有効行、参考見積と追加見積は複数可。DELETE APIも物理DELETEは行わず `deleted_at` を更新する |
| `quotation_items` | READ / CREATE / UPDATE | 修理見積明細。画面から明細配列を受け取らず、修理対象と見積金額から1件をサーバー生成する。見積削除時は物理DELETEせず `deleted_at` を更新する |
| `orders` / `order_items` | CREATE / READ | 初回受付時は登録済み資産の登録元発注から導入業者を参照する。発注登録時は院外修理の発注情報と発注明細を作成し、採用した発注登録用見積のサーバー生成済み見積明細を引き継ぐ。発注書は外部送付せず、送付方法・送付状態・送付日時はNULLとする。院内修理では作成しない |
| `lending_devices` | READ / UPDATE | タスク完了時に修理対象が貸出管理機器かつ `使用不可` の場合、`貸出可` へ戻す |
| `disposal_application_details` | CREATE | 登録済み資産または未登録資産の修理不能から廃棄申請を作成する場合の関連修理申請ID |
| `vendors` | READ | 初回受付時の導入業者担当者・電話参照、および業者マスタID指定時の見積依頼先・見積業者存在確認 |
| `users` | READ | 受付担当者候補、選択された受付担当者の氏名・所属部署・電話番号、操作ユーザー、共有システム管理者アカウント判定 |
| `api_idempotency_records` | READ / CREATE / UPDATE / DELETE | 二重作成を防止する登録系POST APIの冪等キー、正規化済みリクエストハッシュ、処理状態、処理中有効期限、初回成功結果、結果保持期限。RFQ状態履歴の冪等キーは監査用途とし、本テーブルを再送判定の正本とする |
| `facilities` | READ | Bearer トークン上の作業対象施設の存在確認、未削除確認 |
| `user_facility_assignments` | READ | 通常アカウントにおける作業対象施設への有効担当施設割当確認 |
| `facility_feature_settings` | READ | 通常アカウントにおける施設提供機能 `repair_management` の有効化確認 |
| `user_facility_feature_settings` | READ | 通常アカウントにおけるユーザー施設別 `repair_management` の有効化確認 |

## 第3章 共通仕様

### API 共通仕様

- 通信方式: HTTPS
- データ形式: JSON。ファイル本体を受け取るPOST APIは multipart/form-data を使用し、`payload` を `application/json` のJSONパートとする。見積登録は固定名 `file` に見積書原本1ファイル、完了書類登録は `files` に1件以上のファイル本体を指定する
- 文字コード: UTF-8
- 日時形式: ISO 8601（例: `2026-05-19T10:00:00+09:00`）
- 日付形式: `YYYY-MM-DD`
- 認証済みAPIは Bearer トークンを `Authorization` ヘッダーに付与する
- 各APIは Bearer トークン上の作業対象施設を基準に自施設データのみ処理する

### 未保存PDFプレビューの返却ルール

- 修理申請書PDF取得、修理見積依頼書プレビュー、修理発注書プレビューは、成功時に `Content-Type: application/pdf` のPDFバイナリをレスポンスボディへ直接返す。フロントエンドは受信したBlobから画面表示用のObject URLを生成し、右ペインへ表示する
- 未保存PDFプレビューでは `application_documents`、業務DB、Amazon S3へ保存せず、プレビューURL、S3オブジェクトキー、バケット名を返さない
- 登録済み見積書・発注書・完了書類は本ルールの対象外とし、各プレビューURL取得APIが保存済みS3オブジェクトに対する短時間有効の認可済みURLを返す

### ファイル保存ルール

- 見積書原本は multipart/form-data の固定名 `file` パートとして1ファイルを受け取る。STEP4完了書類は `files` パートの配列として1件以上を受け取り、`payload.documents` と配列順で1対1に対応させる。発注書はAPIが生成し、画面からファイルをアップロードしない
- ブラウザ上のファイル選択、入力途中、プレビュー表示だけでは業務DBへ保存しない。見積書は「見積書の登録」、完了書類は「ドキュメント登録」、発注書は「発注登録」の確定時に保存する
- STEP4完了書類は選択済みの全ファイルを1回の「ドキュメント登録」で一括登録する。画面入力の書類属性は全ファイルへ共通適用し、異なる書類属性で登録するファイルは操作を分ける
- S3オブジェクトキーは `application-documents/facility-{facilityId}/{yyyy}/{mm}/{operationKey}/{fileIndex}-{contentHash}.{ext}` とする。`operationKey` は作業対象施設ID、認証ユーザーID、HTTPメソッド、実リクエストパス、`Idempotency-Key` を区切り文字付きで正規化し、UTF-8バイト列のSHA-256を小文字16進数化してサーバー側で生成する。`Idempotency-Key` の生値はS3キーへ含めない。`{yyyy}/{mm}` は冪等記録の初回受付日時、`fileIndex` はリクエスト内のファイル順、`contentHash` はAPIが実ファイルから算出したSHA-256とし、同一要求の再送で同じ最終キーを再現可能にする
- 全ファイルの入力検証とSHA-256算出を完了し、冪等行を `IN_PROGRESS` として確保した後、決定的な最終キーへ直接PutObjectする。PutObjectは `If-None-Match: *` とSHA-256 checksumを指定し、上書きを許可しない
- 再送時に同じ最終キーが存在する場合はHeadObjectで保存済みSHA-256、ファイルサイズ、MIME Typeを確認し、今回のファイルと一致する場合だけ既存オブジェクトを再利用する。不一致の場合は上書きせず502 (`REPAIR_FILE_502_S3_OPERATION_FAILED`) を返す
- 全ファイルの最終キーへの保存後に業務DBトランザクションを開始し、業務状態を再検証してから業務データ、`application_documents`、状態履歴、冪等完了記録を同一トランザクションで確定する
- STEP4完了書類の一括登録はS3とDBを含めて全件成功または全件失敗とする。PutObject途中、ロック後の業務競合、DB登録等でDBコミット前のロールバックを確認できた場合は、今回のAPI実行でPutObjectにより新規作成した最終キーのオブジェクトだけをAPI内で補償削除して `application_documents` を作成しない。HeadObject照合により再利用した既存オブジェクトは、既存の有効な業務ドキュメントが参照している可能性があるため補償削除しない。COMMIT実行後に成否が不明となった場合は直ちに補償削除せず、冪等再送ルールに従って書込先DBで結果を確認する
- `application_documents.file_path` にはS3オブジェクトキーのみ保存し、S3バケット名、S3の直接URL、認可なしで利用できるURLはDBへ保存しない
- アップロードされた原本のファイル名は `application_documents.file_name`、最終S3オブジェクトキーは `application_documents.file_path` に保存する
- ファイル内容ハッシュはクライアントから受け取らず、APIが実際のファイル本文から算出して `application_documents.content_hash` に保存する。`payload` に任意指定された `contentType` または `fileSize` は実際のファイルパートを正本として照合し、不一致の場合は400を返す
- レスポンスではS3オブジェクトキー、S3バケット名、S3の直接URLを返さず、画面表示やダウンロードが必要な場合は認可済み `downloadUrl` を返す
- 補償削除は今回のAPI実行で新規作成したオブジェクトだけを対象とし、`NoSuchKey` を成功として扱う。一時的な通信エラーまたはAmazon S3が再試行可能と判断できるエラーだけを初回削除に加えて最大3回、指数バックオフで再試行する。補償削除を完了できない場合は502 (`REPAIR_FILE_502_S3_OPERATION_FAILED`) を返し、`operationKey`、対象S3オブジェクトキー、失敗工程、トレースIDを運用ログへ記録する
- 通常のドキュメント削除APIは `application_documents.deleted_at` をDBで先にコミットし、当該削除対象のドキュメントID群を除いて同じ `file_path` を参照する有効な `application_documents` が存在しない場合だけ、同じAPI内でS3オブジェクトを同期削除する。S3削除に失敗した場合はDBの論理削除を維持して502を返し、同じDELETEの再送でS3削除を再実行する

### 登録系POST APIの冪等再送ルール

- `Idempotency-Key` を必須とするのは、見積依頼先登録・依頼送信、見積登録、発注登録、完了書類登録、廃棄申請接続の5 APIとする。いずれも再送による依頼先、見積、発注、文書、廃棄申請の二重作成を防止する
- 冪等判定のスコープは、作業対象施設ID、認証ユーザーID、HTTPメソッド、パスパラメータを展開した実リクエストパス、`Idempotency-Key` とする。クライアントは論理操作ごとにUUID等の新しいキーを発行する
- JSONはオブジェクトキー順、NULL表現、日付・数値表現を共通規則で正規化してハッシュ化する。multipart/form-data は業務項目に加え、ファイル名、サイズ、MIMEタイプ、ファイル内容ハッシュ、保存形式、ドキュメント属性を正規化済みリクエストハッシュへ含める
- `api_idempotency_records` を冪等判定の正本とし、`processing_status='IN_PROGRESS'` と `in_progress_expires_at` を一意制約の下で確保してから業務処理を開始する。`in_progress_expires_at` はAPIの実行上限時間に余裕時間を加えた設定値から決定し、処理中の定期更新は行わない。`rfq_status_histories.idempotency_key` はRFQ操作監査用に記録するが、再送判定には使用しない
- 業務DBトランザクションを開始する際は対象 `api_idempotency_records` 行を最初に `SELECT ... FOR UPDATE` でロックし、同一ハッシュかつ有効期限内の `IN_PROGRESS` であることを再確認してから共通ロック順で業務行をロックする
- 同一スコープ・同一キー・同一ハッシュの `COMPLETED` は、`response_status` と `response_body_json` に保存した初回HTTPステータス・業務ID・結果をそのまま返す。初回が201の登録APIは再送時も201を返し、業務テーブル、ファイルメタデータ、状態履歴を再作成・再更新しない
- 同一スコープ・同一キーでリクエストハッシュが異なる場合は409 (`IDEMPOTENCY_KEY_REUSED`)、期限内の `IN_PROGRESS` は409 (`IDEMPOTENCY_REQUEST_IN_PROGRESS`) と `Retry-After: 5` を返し、キー未指定は400 (`IDEMPOTENCY_KEY_REQUIRED`) とする
- `in_progress_expires_at` を超過した同一要求の再送では、書込先DBの新しい接続で対象冪等行を `SELECT ... FOR UPDATE` し、前回トランザクションの終了を待って状態を再確認する。`COMPLETED` なら保存済み結果を返す。ロック取得後も `IN_PROGRESS` で、業務データと冪等完了結果が確定していないことを確認できた場合は、`in_progress_expires_at` を更新して同一要求の再実行権を取得する。読取レプリカは使用しない
- 再実行時のファイルは同じ決定的な最終キーを使用し、保存済みオブジェクトが内容ハッシュ、サイズ、MIME Typeのすべてで一致する場合は再利用し、不足分だけをPutObjectする。`COMPLETED` 再送ではS3操作を再実行しない
- 入力不正、認証・認可失敗、業務競合、DB処理失敗、S3処理失敗等について、業務DBが未コミットで、作成済みS3オブジェクトの補償削除も完了したことを確認できる場合は、予約した冪等行を削除して同一キーでの再試行を可能にする。ただし、修理発注登録で発注番号・発注日を採番済みの場合は同じPDFを再現するため冪等行と再開情報を保持し、`in_progress_expires_at` を現在日時以前へ更新して同一キー・同一ハッシュの再送だけが直ちに再実行権を取得できるようにする。補償削除を完了できない場合は502を返し、冪等行を `IN_PROGRESS` のまま保持して期限内の重複処理を防止する
- 業務トランザクションの確定と冪等行の `COMPLETED`、`response_status`、`response_body_json` 更新を同一トランザクションで行う。`response_body_json` は業務IDと再送時の結果復元に必要な値だけを保持し、署名付きURL、認証情報、機微情報は保存しない。再送応答でURLが必要な場合は認可確認後に再発行する
- COMMIT実行後にタイムアウトまたは接続切断が発生した場合はS3オブジェクトを直ちに補償削除しない。書込先DBの新しい接続で同じ冪等スコープとリクエストハッシュの行を再取得し、`COMPLETED` ならS3オブジェクトを保持して保存済み結果を返す
- DB障害または確認処理のタイムアウトによりコミット成否を確認できない場合は、`IN_PROGRESS` を保持し、ファイルを伴う操作ではS3オブジェクトも保持したまま、503 (`REPAIR_DB_503_COMMIT_OUTCOME_UNKNOWN`) と `Retry-After: 5` を返す。クライアントは同じ `Idempotency-Key` と同じリクエストで再送し、APIはDB復旧後に前回結果を再確認する
- `expires_at` は `COMPLETED` の結果保持期限として成功確定から24時間以上とする。期限切れ行が物理削除された後に同じキーを受け取った場合は新規リクエストとして扱い、現在の業務前提・一意制約を再検証する。クライアントは保持期間経過後の結果再生には依存しない

### 状態更新系POST APIの自然冪等ルール

- 受付判定、申請却下、見積依頼完了、作業日登録、完了登録の5 APIは `Idempotency-Key` を要求しない
- 各APIは共通ロック順で現在行をロックし、保存済み状態と要求値を確認する。要求した目標状態へ同じ業務値と同じ `receptionUserId` ですでに到達している場合は業務データ、状態履歴、工程履歴を追加更新せず、保存済みの現在結果を200で返す
- 目標状態へ到達済みでも要求値が保存済み値と異なる場合、または別の終端状態・後続工程へ進行済みの場合は409を返し、上書きや工程の巻き戻しを行わない
- COMMIT実行後に成否を確認できない場合は503 (`REPAIR_DB_503_COMMIT_OUTCOME_UNKNOWN`) と `Retry-After: 5` を返す。クライアントは同じリクエストを再送でき、APIは保存済み状態を基準に初回成功結果または競合を判定する

### 更新処理の排他制御ルール

- 更新APIは既存行の悲観ロックを使用し、修理管理専用の `lock_version` 列は追加しない
- 登録系の `Idempotency-Key` 対象APIは、業務トランザクション内で対象 `api_idempotency_records` 行を先にロックする。この技術ロックの後に、以下の共通業務行ロック順を適用する。状態更新系POST APIは冪等行を使用せず、共通業務行ロック順を直接適用する
- 共通ロック順は `applications` → `repair_request_details` → 現在工程の `application_task_steps` → `rfqs` → 対象子行（`rfq_vendors` / `quotations` / `orders` / `application_documents`）→ 他機能連携行（`lending_devices` 等）とする。対象テーブルが存在しない処理はその段階をスキップする
- ロック取得後に、作業対象施設、未削除、`application_type='REPAIR'`、修理区分、申請ステータス、現在STEP、対象RFQ・子行の所属と有効性を再検証する。先行処理によって前提状態が変わっている場合は上書きせず409を返し、画面へ再取得を促す
- STEP1の依頼先登録・削除・完了は、共通親行に続いて対象RFQと有効な依頼先行をロックする。STEP2の見積登録・削除・発注・却下・廃棄申請接続は、共通親行に続いて対象RFQ、見積、発注を同じ順序でロックする
- STEP4の完了書類登録・削除と完了登録は、先に `applications` と現在工程をロックして直列化する。完了登録が先行した場合、後続の書類登録・削除は409とする
- 完了登録で貸出管理機器を更新する場合は、修理申請・工程・RFQのロック後に対象 `lending_devices` をロックし、既存の `lock_version` も再確認する

### DELETE APIの再送ルール

- 見積依頼先、見積、完了書類、修理タスクのDELETE APIは `Idempotency-Key` を要求せず、論理削除を利用して自然冪等とする。見積書原本・完了書類のS3削除では、S3の対象なしも削除成功として扱う
- 対象IDが同一修理申請に属し、作業対象施設内に存在することを削除済み行を含めて確認する。未削除なら共通ロック順で削除可否を再検証して論理削除し、対象が既に論理削除済みの場合はDBを追加更新しない
- 見積書原本または完了書類を削除するAPIは、対象メタデータの `deleted_at` をDBで先にコミットする。当該削除対象のドキュメントID群を除いて同じ `file_path` を参照する有効な `application_documents` が存在しない場合だけ、DBコミット後にDeleteObjectを同期実行する。他の有効な参照が存在する場合はS3オブジェクトを削除せず204を返す
- DeleteObjectで対象なしとなった場合は削除成功として扱う。一時的な通信エラーまたはAmazon S3が再試行可能と判断できるエラーだけを初回削除に加えて最大3回、指数バックオフで再試行する。完了できない場合はDBの論理削除を維持して502 (`REPAIR_FILE_502_S3_OPERATION_FAILED`) を返す
- 同じDELETEの再送では、対象が論理削除済みでもS3削除対象を再判定し、必要なDeleteObjectを再実行する。S3削除成功、対象なし、または他の有効な参照が存在する場合に204を返す
- 対象が一度も存在しない、別の修理申請に属する、または作業対象施設外の場合は404を返す。対象が未削除のまま工程進行、採用、発注、完了等により削除不可となった場合は409を返す

### ファイル登録と冪等・排他制御の順序

- 見積登録・完了書類登録は、DB業務行のロックを保持しない状態で全ファイルの検証と内容ハッシュ算出を行い、全ファイルの内容ハッシュを含む最終リクエストハッシュで冪等行を `IN_PROGRESS` として確保してから、決定的な最終S3キーへ直接保存する。発注登録は安定したJSONリクエストハッシュで冪等行を先に確保し、当該冪等記録の初回受付日時と再送用に確定した発注番号・発注日を使用して発注書を生成してから、最終S3キーへ直接保存する
- 全ファイルの保存後にDBトランザクションを開始し、対象冪等行を先にロックしてから共通ロック順で業務状態を再検証する。検証成功後、業務データ、`application_documents`、状態履歴、冪等行の `COMPLETED` 更新を同一トランザクションで確定する
- PutObject途中の失敗、ロック後の業務競合、DB登録失敗等、DBコミット前のロールバックを確認できる失敗では、今回のAPI実行でPutObjectにより新規作成した最終キーのオブジェクトだけをAPI内で補償削除する。再送時にHeadObject照合で再利用した既存オブジェクトは補償削除しない。補償削除に成功した場合は原則として冪等行を削除するが、修理発注登録は採番済み発注番号・発注日を固定するため冪等行の再開情報を保持する。業務競合は元の409、DB登録失敗は元の500、Amazon S3処理失敗は502を返して同一キーで再試行可能とする。COMMIT実行後に成否が不明な場合は補償削除せず、書込先DBでの再確認または503再送へ進む
- 補償削除は `NoSuchKey` を成功とし、再試行可能エラーだけを初回に加えて最大3回、指数バックオフで再試行する。完了できない場合は502を返して `operationKey`、対象S3オブジェクトキー、失敗工程、トレースIDを記録する

### 外部メール送信対象外ルール

- STEP1の「依頼送信」は、業者情報、依頼内容、依頼操作日時、操作ユーザーをDBへ保存する業務操作であり、外部メールは送信しない
- `rfq_vendors.request_status='SENT'` は依頼送信操作と依頼先情報の登録完了を表し、メール配信成功を意味しない
- STEP2の「メール送信」に対応するAPIは定義せず、当該操作によるDB保存、発注確定、STEP遷移は行わない
- 本API群では、メール送信API、メール送信用の冪等キー、メール送信失敗エラーを定義しない

### 認証・認可

本API群で使用する `feature_code` は `repair_management` である。メニューからの修理依頼起票に使用する `repair_request_create` は No.6 修理申請API設計書で扱い、本書では修理管理タブ一覧と修理タスク操作の実効権限を判定する。画面表示用の `/auth/context` はUX用キャッシュであり、各業務APIでも同条件を再判定する。通常アカウントでは作業対象施設への有効担当施設割当、施設提供機能、ユーザー施設別機能設定を確認する。共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）では、作業対象施設が未削除であることを確認できれば、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする。

| 処理 | 必要 feature_code | 判定テーブル | 説明 |
| --- | --- | --- | --- |
| 修理管理一覧、修理タスク詳細、工程進行、廃棄申請接続 | `repair_management` | `users`, `facilities`, `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings` | 通常アカウントは担当施設割当と実効 `repair_management` を確認する。共有システム管理者アカウントは作業対象施設が未削除であれば通常権限判定をバイパスする |

### 作業対象施設ベースの認可例外

- 各APIは Bearer トークン上の作業対象施設が存在し、未削除であることを確認する
- 通常アカウントでは、作業対象施設に対する有効担当施設割当と実効 `repair_management` を都度再判定する
- 共有システム管理者アカウントでは、作業対象施設が未削除であれば通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による認可判定をバイパスする
- `applications.application_type='REPAIR'`、対象修理申請・資産・RFQ・見積・発注・ドキュメントの未削除/作業対象施設所属、保存ステータス遷移順序、院内/院外修理区分、依頼送信操作保存済みの見積依頼先有無、発注前削除可否、修理不能からの廃棄申請接続条件といった業務制約は共有システム管理者でもバイパスしない
- 通常アカウントで作業対象施設に対して必要な実効 `repair_management` がない場合は403を返す
- 作業対象施設が存在しない、または削除済みの場合は404を返す

### 受付担当者の選択・保存ルール

- 受付担当者は画面上で氏名から選択し、APIでは選択した `users.user_id` を `receptionUserId` として受け取る。通常アカウントの初期表示ではログインユーザーを選択済みとし、共有システム管理者アカウントは候補に含まれないため、処理前に通常アカウントを選択する
- 選択候補は `users.account_type IN ('HOSPITAL','SHIP')`、`users.is_active=true`、`users.deleted_at IS NULL` を満たし、作業対象施設への有効な `user_facility_assignments` と実効 `repair_management` を持つユーザーに限定する
- 保存APIは `receptionUserId` が候補条件を満たすことを処理時点で再検証し、満たさない場合は400 (`RECEPTION_ASSIGNEE_INVALID`) を返す
- 選択したユーザーから `repair_request_details.reception_user_id=users.user_id`、`reception_person=users.name`、`reception_department=users.section_name`、`reception_contact=users.phone_number` を導出して同一トランザクションで保存する。`section_name` または `phone_number` が未設定の場合はNULLを許容し、`department_name` やメールアドレスへフォールバックしない
- `repair_request_details.reception_confirmed_at` は受付判定時の初回受付確定日時として一度だけ設定し、担当者変更時は更新しない
- 受付情報を更新する契機は、受付判定、STEP1見積依頼完了、STEP2発注登録、STEP3作業日登録、STEP4完了登録、通常却下、修理不能による廃棄申請接続の各確定操作とする。詳細取得、再アクセス、プレビュー、見積依頼先登録・削除、見積登録・削除、完了書類登録・削除、ファイル選択、一覧・表示では更新しない
- 終端状態のタスクは受付情報を読取専用とする。各STEP操作を実行したユーザーは `application_status_histories.changed_by_user_id`、`rfq_status_histories.changed_by_user_id`、工程更新者等へ別途記録し、現在の受付担当者とは区別する

### ステータス・工程共通ルール

- `applications.application_type='REPAIR'` の新規フローで使用する保存ステータスは `新規申請` / `見積依頼済` / `見積登録済` / `発注済` / `納期確定` / `完了` / `却下` を正本とする。`検収登録` は旧データ参照時だけSTEP4へ読み替え、新規遷移では使用しない
- 修理管理で受け付ける起票済み申請は `新規申請` とする。画面表示上の `依頼受付` は保存値にしない
- 申請受付一覧は `status='新規申請'` かつ `repair_category IS NULL` の未受付申請、修理タスク管理リストは `repair_category IN ('IN_HOUSE','OUTSOURCED')` の受付済み申請を対象とする。院外修理は受付後も `status='新規申請'` を維持するが、申請受付一覧には残さずSTEP1の修理タスクとして扱う
- 修理管理タブの初期表示では一覧取得APIを `step=RECEPTION` と `step=ALL` で並列実行する。`RECEPTION` は申請受付一覧、`ALL` と各工程値は修理タスク管理リストだけを対象とし、未受付申請と受付済み修理タスクを同一ページング結果へ混在させない
- 修理管理タブの表示上の `発注登録済` は `発注済`、`作業日確定` は `納期確定` に対応させる
- 通常却下は `applications.status='却下'`、`application_task_steps.completion_reason='REJECTED'` とする
- 修理不能から廃棄申請へ接続する場合は `applications.status='却下'`、`application_task_steps.completion_reason='UNREPAIRABLE'` とし、履歴コメント入力は要求しない
- 院内修理は `repair_category='IN_HOUSE'` と `status='納期確定'` を保存し、外部見積・発注工程は `application_task_steps` で `SKIPPED_IN_HOUSE_REPAIR` として扱う
- 院外修理は `repair_category='OUTSOURCED'` とし、見積依頼、見積登録・発注、作業日登録、完了登録へ進行する
- 現在工程は `application_task_steps.is_current` を正本とし、`applications.status` は工程行が存在しない既存データの補完にだけ利用する
- `applications.status` の変更時は `application_status_histories`、院外修理の `rfqs.status` の作成・変更時は `rfq_status_histories` を同一トランザクションで追加し、`changed_by_user_id` に各操作を実行した認証ユーザーIDを保存する
- 工程開始・完了・スキップ・取消時は対象 `application_task_steps.assigned_user_id` に操作ユーザーIDを保存する。確定操作で選択された現在の受付担当者は `repair_request_details.reception_user_id` に保存し、操作ユーザーとは独立して管理する

### 登録済み資産・未登録資産の扱い

- 登録済み資産は `application_assets.asset_ledger_id` を保持し、申請時点の品目、メーカー、型式、シリアルNo.、設置場所を `application_assets` にスナップショット保存する
- 未登録資産は `asset_ledgers` へ登録しない。`repair_request_details.manual_item_name`、`manual_maker_name`、`manual_model_name`、`manual_serial_no`、`manual_department_name`、`manual_room_name` と `application_assets` の表示用スナップショットに保持する
- 未登録資産の修理が完了しても資産台帳に対する CRUD は行わない
- 修理不能から廃棄申請へ接続する場合は登録済み資産と未登録資産の両方を対象とする
- 未登録資産の廃棄申請は修理申請経由のみ対象とし、修理申請を経由しない未登録資産の単独廃棄申請は扱わない

### 外部I/Fとの責務分離

- Request / Response の項目、型、必須性、列挙値、HTTPステータスおよびエラーコードは `openapi.yaml` を正本とし、本書ではDTO項目表を重複定義しない
- Responseはスキーマを安定させるため、条件により値が存在しない項目もキー自体は返し、JSONの `null` を設定する。該当項目はOpenAPIで `required` と `nullable: true` を併記する
- 配列項目に対象データがない場合は `null` ではなく空配列 `[]` を返す
- 本書は処理、権限、DB利用、トランザクション、業務ルール、およびエラー発生条件を定義する

### ドキュメント保存マッピング

ドキュメント所有者、工程、区分は呼び出しAPIと対象タスクからサーバー側で確定し、クライアントから `ownerType` / `ownerId` / `stepCode` / `documentCategory` を受け付けない。アップロード時の元ファイル名は `application_documents.file_name`、決定的な最終S3オブジェクトキーは `application_documents.file_path`、実ファイルのMIME Typeは `mime_type`、ファイルサイズは `file_size_bytes`、APIが算出したSHA-256は `content_hash`、認証ユーザーIDは `uploaded_by_user_id`、現在日時は `uploaded_at` に設定する。修理管理ではファイル名とは別の表示タイトルを受け取らず、`application_documents.title` はNULLとする。

## 第4章 API 一覧

| No | API名 | メソッド | パス | 用途 | 権限 |
| --- | --- | --- | --- | --- | --- |
| 1 | 修理管理タブ一覧取得 | GET | /quotation-data-box/repair-requests/tasks | `step` に応じて申請受付一覧または受付済み修理タスク一覧を取得する | `repair_management` |
| 2 | 修理受付担当者候補取得 | GET | /repair-task/reception-assignees | 作業対象施設で選択可能な受付担当者を取得する | `repair_management` |
| 3 | 修理タスク詳細取得 | GET | /repair-task/tasks/{repairTaskId} | 修理タスク詳細とSTEP表示情報を取得する | `repair_management` |
| 4 | 修理申請書プレビュー | GET | /repair-task/tasks/{repairTaskId}/application-preview | 保存済み申請データから申請書PDFを都度生成する。DB・Amazon S3へ保存しない | `repair_management` |
| 5 | 受付判定登録 | POST | /repair-task/tasks/{repairTaskId}/approve | 院内/院外振り分けを登録する | `repair_management` |
| 6 | 申請却下 | POST | /repair-task/tasks/{repairTaskId}/reject | 通常却下を登録する。修理不能として廃棄申請へ接続する場合は廃棄申請接続APIを使用する | `repair_management` |
| 7 | 修理見積依頼書プレビュー | POST | /repair-task/tasks/{repairTaskId}/vendor-requests/preview | 画面入力中の業者情報から見積依頼書PDFを一時生成する。DB・Amazon S3へ保存しない | `repair_management` |
| 8 | 見積依頼先登録・依頼送信 | POST | /repair-task/tasks/{repairTaskId}/vendor-requests | 院外修理の依頼先とSTEP1入力を保存する。外部メールは送信しない | `repair_management` |
| 9 | 見積依頼先削除 | DELETE | /repair-task/tasks/{repairTaskId}/vendor-requests/{rfqVendorId} | STEP1完了前の依頼先を論理削除する | `repair_management` |
| 10 | 見積依頼完了 | POST | /repair-task/tasks/{repairTaskId}/vendor-requests/complete | 依頼送信操作保存済みの依頼先を確認しSTEP2へ進める | `repair_management` |
| 11 | 修理見積登録 | POST | /repair-task/tasks/{repairTaskId}/quotations | 参考・発注登録用・追加見積と見積原本を登録する | `repair_management` |
| 12 | 修理見積削除 | DELETE | /repair-task/tasks/{repairTaskId}/quotations/{quotationId} | 削除可能な登録済み見積を論理削除し、見積書原本のS3オブジェクトを同期削除する | `repair_management` |
| 13 | 修理見積プレビュー | GET | /repair-task/tasks/{repairTaskId}/quotations/{quotationId}/preview-url | 登録済み見積書の認可済みプレビューURLを取得する | `repair_management` |
| 14 | 修理発注書プレビュー | POST | /repair-task/tasks/{repairTaskId}/order/preview | 発注登録前の発注書PDFを一時生成する。DB・Amazon S3へ保存しない | `repair_management` |
| 15 | 修理発注登録 | POST | /repair-task/tasks/{repairTaskId}/order | 唯一の発注登録用見積から発注情報を作成する | `repair_management` |
| 16 | 作業日登録 | POST | /repair-task/tasks/{repairTaskId}/work-date | 作業完了予定日を保存してSTEP4へ進める | `repair_management` |
| 17 | 完了書類登録 | POST | /repair-task/tasks/{repairTaskId}/documents | STEP4の完了書類を修理申請単位で追加する | `repair_management` |
| 18 | 完了書類削除 | DELETE | /repair-task/tasks/{repairTaskId}/documents/{documentId} | タスク完了前の完了書類を論理削除し、S3オブジェクトを同期削除する | `repair_management` |
| 19 | 完了書類プレビュー | GET | /repair-task/tasks/{repairTaskId}/documents/{documentId}/preview-url | 完了書類の認可済みプレビューURLを取得する | `repair_management` |
| 20 | 完了登録 | POST | /repair-task/tasks/{repairTaskId}/complete | 修理申請と現在工程を完了する | `repair_management` |
| 21 | 修理タスク削除 | DELETE | /repair-task/tasks/{repairTaskId} | 見積登録済かつ発注前の修理タスクを論理削除する | `repair_management` |
| 22 | 廃棄申請接続 | POST | /repair-task/tasks/{repairTaskId}/disposal-application | 登録済み資産または未登録資産の修理不能から廃棄申請を作成する | `repair_management` |

## 第5章 修理管理機能設計

### getQuotationDataBoxRepairRequestsTasks

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `repair_requests` VIEW を一覧表示の起点として取得し、VIEWに含まれない `repair_category`、`is_registered_asset`、`asset_ledger_id`、`pickup_required_flag`、`work_planned_on`、操作可否判定に必要な現在工程は `repair_request_details`、代表 `application_assets`、必要に応じて `application_task_steps` を補助結合して返す
3. 申請受付一覧の `sourceDepartmentName`、`sourceSectionName`、`sourceRoomName` は代表 `application_assets` の `source_department_name`、`source_section_name`、`source_room_name` から返す。修理タスク管理リストの `vendorName`、`vendorPerson`、`vendorContact` は `repair_requests.current_vendor_name`、`current_vendor_person`、`current_vendor_contact` から返し、院内対応または未設定時はNULLとする
4. 期限列は `deadlineLabel` / `deadlineOn` で返す。`新規申請` と `見積登録済` は両方NULL、`見積依頼済` は `deadlineLabel='見積提出期限'`、`deadlineOn=repair_request_details.quotation_due_on` とする。`quotation_due_on` は有効な修理RFQ依頼先（`deleted_at IS NULL` かつ `request_status IN ('SENT','REPLIED')`）の `due_on` 最小値を依頼先登録・論理削除時に同期した値であり、対象日付が全件NULLの場合もラベルは維持して `deadlineOn=NULL` とする
5. `発注済` は `pickup_required_flag=true` の場合だけ `deadlineLabel='引取日'`、`deadlineOn=pickup_on` とし、不要の場合は両方NULLとする。`納期確定` と旧データの `検収登録` は `deadlineLabel='納入予定日'`、`deadlineOn=work_planned_on` とする。代替機の納品日・返却予定日は期限列の算出に使用しない
6. `requestAlternativeDeviceStatus` は `repair_requests.alternative_device_status` から申請時の `NOT_NEEDED` / `NEEDED` / `REQUESTED` を返す。申請内容モーダルは `NOT_NEEDED` を「不要」、`NEEDED` / `REQUESTED` を「必要」と表示する
7. `applications.application_type='REPAIR'`、作業対象施設、`deleted_at IS NULL` の行に限定する
8. 申請受付一覧と `pendingCount` は `status='新規申請'` かつ `repair_request_details.repair_category IS NULL` の未受付申請だけを対象とする。受付判定済みの院外修理は `status='新規申請'` でも未処理件数に含めない
9. 修理タスク管理リストは `repair_category IN ('IN_HOUSE','OUTSOURCED')` の受付済み申請を対象とする。`OUTSOURCED` は現在工程STEP1以降、`IN_HOUSE` はSTEP3以降の工程情報に基づいて表示する
10. `step=RECEPTION` は未受付申請だけを返す。`step=ALL` またはstep未指定時は、受付済みかつ `applications.status NOT IN ('完了','却下')` の修理タスクを工程横断で返し、未受付申請を含めない
11. `step=QUOTE_REQUEST` / `QUOTATION_ORDER` / `WORK_DATE` / `COMPLETE` は、受付済み修理タスクを `application_task_steps.is_current=true` の現在工程で絞り込む。現在工程が存在しない既存データだけは保存ステータスから工程を補完し、旧データの `検収登録` は `COMPLETE` として扱う。`完了` / `却下` は全stepで表示対象外とする
12. `step=RECEPTION` と `repairCategory` または `alternativeUnreturnedOnly` が同時指定された場合は400を返す。`departmentName` は未受付申請と受付済み修理タスクのどちらにも適用できる
13. 画面初期表示では本APIを `step=RECEPTION` と `step=ALL` で並列実行し、STEPタブ切替時は修理タスク管理リスト側だけを選択したstepで再取得する。申請受付一覧と修理タスク管理リストのページ番号・総件数は呼び出しごとに独立して扱う
14. ステップタブの表示ラベルは画面に合わせるが、保存ステータスは `application_status_definitions` の `REPAIR` を正本とする
15. 既定並び順は各呼び出しとも `requested_on DESC, repair_request_id DESC` とし、未受付申請と受付済み修理タスクを混在させた優先順位付けは行わない
16. レスポンスには各行の `availableActions` を返し、保存ステータス、登録済み資産区分、修理区分に基づく操作ボタン表示をこの値で制御する。`status='見積登録済'` かつ発注前の場合のみ `DELETE_TASK` を含める

### getRepairTaskReceptionAssignees

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `repair_management` の実効権限があること。共有システム管理者アカウントは作業対象施設が未削除であればAPIを利用できる

#### 処理仕様

1. 作業対象施設が存在し、未削除であることと、API実行者が当該施設の修理管理を利用できることを確認する
2. 共通の受付担当者候補条件を満たす `users` を取得する。`keyword` 指定時は `users.name` または `users.section_name` の部分一致で絞り込み、`limit` 件まで返す
3. `keyword` 未指定かつAPI実行ユーザー自身が候補条件を満たす場合は当該ユーザーを先頭とし、以降は氏名、所属部署、ユーザーIDの順で安定ソートする。`userId=users.user_id`、`name=users.name`、`department=users.section_name`、`contact=users.phone_number`、`accountType=users.account_type` を返す。所属部署・電話番号の未設定はNULLとし、別項目へフォールバックしない
4. 候補取得はREAD処理とし、タスクの受付情報やユーザー情報を更新しない

### getRepairTaskTasksByRepairTaskId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `applications`、`repair_request_details`、代表 `application_assets`、`application_task_steps` を取得する
3. 登録済み資産は `application_assets.asset_ledger_id`、未登録資産は `repair_request_details.manual_item_name` 等の手入力列を優先して表示値を組み立てる
4. 院外修理では対象申請に紐づく有効な `management_type='REPAIR'`、`workflow_type='RFQ'` の `rfqs` を1件だけ取得し、`rfq_vendors`、`quotations`、`quotation_items`、`orders`、`order_items`、`application_documents` を必要に応じて結合する。複数の有効RFQが存在する場合は409としてデータ不整合を返す
5. 見積依頼先は `is_primary_vendor` 降順、`requested_at`、`rfq_vendor_id` 昇順で返す
6. 現在STEPは `application_task_steps.is_current=true` の行を正本とする。現在工程が存在しない既存データに限り、院外修理は `新規申請→STEP1`、`見積依頼済/見積登録済→STEP2`、`発注済→STEP3`、`納期確定/検収登録→STEP4`、院内修理は `納期確定→STEP3` として補完する
7. 登録済み見積一覧は有効行をフェーズ、登録日時、見積IDとともに返し、見積原本のプレビューURLは一覧レスポンスへ含めない。表示押下時に個別プレビューAPIを呼び出す。レスポンス直下の `documents` は `owner_type='APPLICATION'`、`application_id=repairTaskId`、`step_code='COMPLETE'`、`document_category='COMPLETE'`、`deleted_at IS NULL` のSTEP4完了書類だけを返し、見積書と発注書は含めない
8. 受付部署・受付担当者・受付連絡先・受付担当者ユーザーIDは保存済みの現在値を返し、GET時のログインユーザー情報で上書きしない。`reception_confirmed_at` は初回受付確定日時として返す
9. 導入業者・保守契約は初回受付時に `repair_request_details` へ保存された参照情報を返し、現在の資産・発注・保守契約情報や画面入力値で上書きしない
10. 本方針適用前に受付済みで導入業者・保守契約参照情報が未設定の既存データはバックフィルせず、未設定のまま返す。`maintenance_contract_flag` がNULLの場合はレスポンス上だけfalseとして返す
11. `requestAlternativeDeviceStatus` は `repair_request_details.alternative_device_status` の申請時点値、`alternativeHandlingRequiredFlag` は `alternative_device_handling_required_flag` の保存値をそのまま返す。管理判断未保存は `alternativeHandlingRequiredFlag=NULL` とする
12. `effectiveAlternativeHandlingRequiredFlag` はSTEP1の画面表示用実効値とする。`alternativeHandlingRequiredFlag` が非NULLの場合は保存済み管理判断を返し、NULLの場合だけ `requestAlternativeDeviceStatus` が `NEEDED` / `REQUESTED` ならtrue、`NOT_NEEDED` / NULLならfalseを返す。実効値の算出と詳細取得だけではDBを更新しない
13. 保存済み `vendorRequests` が0件の場合、画面は `installerName`、`installerPerson`、`installerContact` を1行目の編集可能な初期候補に使用できる。候補表示だけでは `rfq_vendors` を作成しない
14. 修理申請書PDFまたはプレビューURLは本APIで返さない。画面の申請書表示時は専用の `GET /repair-task/tasks/{repairTaskId}/application-preview` を呼び出す
15. 右ペインの資産登録情報は `application_assets` と、登録済み資産の場合の `asset_ledgers` から参照表示し、本APIでは更新しない
16. 詳細画面の操作可否はレスポンス直下の `availableActions` を正本とし、`task` 配下には重複して返さない。`repair_category='OUTSOURCED'`、現在STEPがSTEP2、`status='見積登録済'`、有効な `quotation_phase='ORDER_REGISTRATION'` が1件、発注未登録の場合だけ、`availableActions` に `PREVIEW_ORDER` / `REGISTER_ORDER` / `REJECT_TASK` を含める。登録済み資産・未登録資産のどちらでも廃棄対象物品情報が揃う場合は `CREATE_DISPOSAL_APPLICATION` も含める。参考見積だけの場合、発注登録用見積を削除した場合、院内修理、STEP2以外、発注済み、または対象物品情報不足の場合はこれらの操作を含めない

### getRepairTaskTasksByRepairTaskIdApplicationPreview

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象が `application_type='REPAIR'`、未削除、作業対象施設一致の修理申請であることを確認する
3. `applications`、`repair_request_details`、代表 `application_assets` の保存済み申請データから修理申請書PDFを都度生成し、`Content-Type: application/pdf` のバイナリで返す
4. プレビュー生成では `application_documents` を作成せず、Amazon S3にも保存しない。画面は受信したPDFからブラウザー内のObject URLを生成し、右ペインへ表示する

### postRepairTaskTasksByRepairTaskIdApprove

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps`、既存のREPAIR/RFQをロックし、`application_type='REPAIR'`、未削除、作業対象施設一致、現在状態を再確認する
3. `repair_category IS NULL` の場合だけ初回受付として後続処理を実行し、`status='新規申請'`、受付情報5項目が未設定であることを確認する。修理区分未設定にもかかわらず受付情報または有効なREPAIR/RFQが存在する場合はデータ不整合として409を返す
4. `repair_category` がリクエストの `decision` と同じ受付済み申請で、`IN_HOUSE` は `status='納期確定'` かつ現在工程STEP3、`OUTSOURCED` は `status='新規申請'` かつ現在工程STEP1、かつ `receptionUserId` が保存済み受付担当者と一致する場合は同じ受付操作の再送として、受付情報、申請状態、工程、RFQ、履歴を更新せず保存済みの現在結果を200で返す。担当者が異なる場合または後続工程へ進行済みの場合は409とする。修理区分設定済みで `reception_user_id` がNULLの既存データも再受付・自動補完しない
5. `repair_category` がリクエストの `decision` と異なる場合は409 (`REPAIR_RECEPTION_DECISION_CONFLICT`) を返し、院内対応と外部依頼の変更を行わない
6. `decision=IN_HOUSE` の場合、`repair_request_details.repair_category='IN_HOUSE'`、`applications.status='納期確定'` を保存し、STEP1・STEP2を `SKIPPED_IN_HOUSE_REPAIR` として完了させてSTEP3を現在工程とする。院内修理ではRFQ、発注、発注明細を作成しない
7. `decision=OUTSOURCED` の場合、`repair_category='OUTSOURCED'`、`applications.status='新規申請'` を維持し、STEP1を現在工程とする。初回受付時に `management_type='REPAIR'`、`workflow_type='RFQ'`、`quotation_type='REPAIR'`、`status='見積依頼'` のRFQを1件作成し、`rfq_applications` に修理申請と代表明細を紐づける。競合により有効RFQが既に作成された場合はロールバックして409を返す
8. 作成するREPAIR/RFQは、`rfq_no` をサーバー側で一意に採番し、`rfq_group_name='修理：{修理申請No.}'`、`facility_id=修理申請の対象施設`、`requested_on=受付日`、`created_by_user_id=受付操作ユーザーID` とする
9. `receptionUserId` を共通の受付担当者候補条件で検証し、選択ユーザーの `users.name`、`section_name`、`phone_number` から `repair_request_details.reception_person`、`reception_department`、`reception_contact` を導出して `reception_user_id` とともに保存する。`reception_confirmed_at` は初回受付確定日時として設定する。通常アカウントではログインユーザーを画面の初期選択値とするが、サーバーはリクエストで選択されたユーザーを保存する
10. 登録済み資産は、`asset_ledgers.source_order_item_id` から `order_items` / `orders` を辿り、`orders.vendor_name`、`orders.vendor_contact_person` を導入業者名・担当者名として優先する。担当者名が未設定の場合は `orders.vendor_id` に対応する有効な `vendors.contact_person`、連絡先は `vendors.phone` を使用する。登録元発注を特定できない場合は `asset_ledgers.delivery_vendor_name` を業者名のフォールバックとし、担当者・連絡先はNULLとする
11. 登録済み資産に `maintenance_contract_assets.excluded_flag=false` で紐づき、受付日時点で `status='完了'`、契約開始日前でなく契約終了日超過でもない有効な `maintenance_contracts` を検索する。複数時は `contract_start_on`、`maintenance_contract_id` 降順の先頭を採用し、`maintenance_contract_flag=true`、`warranty_end_on=contract_end_on` とする。有効契約がない場合または未登録資産は `maintenance_contract_flag=false`、`warranty_end_on=NULL` とする
12. 導入業者・保守契約参照情報は `repair_request_details.installer_name`、`installer_person`、`installer_contact`、`maintenance_contract_flag`、`warranty_end_on` に受付情報と同一トランザクションで保存する。受付済み申請の再送・再アクセス・各STEP操作では参照情報を再取得・上書きしない
13. REPAIR/RFQ新規作成時は `rfq_status_histories.action_code='CREATE_RFQ'` を記録する。状態変更と申請・RFQ履歴、`application_task_steps` 更新は同一トランザクションで行う

### postRepairTaskTasksByRepairTaskIdReject

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps`、REPAIR/RFQ、有効な発注登録用見積と既存発注をロックし、後続の状態・所属条件を再確認する
3. `applications.status='却下'`、対象工程が完了済み、`completion_reason='REJECTED'`、対象REPAIR/RFQが `status='申請を見送る'`、かつ `receptionUserId` が保存済み受付担当者と一致する場合は同じ却下操作の再送として、履歴を追加せず保存済みの現在結果を200で返す。担当者が異なる場合または `completion_reason='UNREPAIRABLE'` 等の別終端状態は409とする
4. 初回処理の対象は `application_type='REPAIR'`、`repair_category='OUTSOURCED'`、現在工程STEP2、`status='見積登録済'`、発注未登録の修理申請に限定する
5. 対象修理RFQに有効な `quotation_phase='ORDER_REGISTRATION'` の見積が1件だけ存在することを確認する。0件または2件以上の場合は409を返す
6. `receptionUserId` を検証し、選択ユーザーから導出した現在の受付担当者情報を `repair_request_details` へ保存する。`applications.status='却下'`、`applications.rejected_by_user_id`、`rejected_by_name`、`rejected_at` を更新する
7. `application_task_steps.completion_reason` に `REJECTED` を保存する。却下理由コメント入力は要求しない
8. 対象REPAIR/RFQを `status='申請を見送る'` とし、RFQ状態履歴へ `action_code='SKIP_APPLICATION'` と操作ユーザーを記録する
9. 受付担当者情報、申請・RFQ状態変更、履歴、工程完了は同一トランザクションで行う

### postRepairTaskTasksByRepairTaskIdVendorRequestsPreview

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象は `repair_category='OUTSOURCED'`、`status='新規申請'`、現在工程STEP1の修理申請に限定する
3. 申請情報、保存済みの現在の受付担当者情報、入力中の `alternativeHandlingRequiredFlag`、代替機の日付・返却済フラグ、商品引取情報、依頼先、`requestComment` と、DBに保存済みの導入業者・保守契約参照情報を用いて見積依頼書を一時生成する
4. 導入業者・保守契約参照情報、代替機情報の既存参照値、グループ共通の見積提出期限はリクエスト本文から受け取らない。提出期限は `vendor.dueOn` を業者別の入力値とする
5. 生成したPDFは `Content-Type: application/pdf` のバイナリで直接返す。画面は受信したPDFからブラウザー内のObject URLを生成して右ペインへ表示する。`rfqs`、`rfq_vendors`、`application_documents`、Amazon S3には保存しない

### postRepairTaskTasksByRepairTaskIdVendorRequests

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps` をロックし、院外修理・STEP1・作業対象施設一致を再確認する
3. 対象は `repair_category='OUTSOURCED'`、`status='新規申請'`、現在工程STEP1の修理申請に限定する
4. 対象修理申請に有効な `management_type='REPAIR'`、`workflow_type='RFQ'`、`quotation_type='REPAIR'` のRFQが1件だけ存在することを確認する。未作成または2件以上の場合は409を返す
5. 共通親行に続いて対象 `rfqs` 行と有効な `rfq_vendors` 行をロックして主依頼先の有無を再確認し、同時登録で複数の主依頼先が生じないようにする
6. `requestComment` は `rfqs.request_comment` に保存し、グループ共通コメントを `repair_request_details.vendor_request_comment` へ二重保存しない
7. `step1.alternativeHandlingRequiredFlag` を `repair_request_details.alternative_device_handling_required_flag`、納品日・返却予定日・返却済フラグ、商品引取要否・引取日を各対応列に保存する。`alternativeHandlingRequiredFlag=false` の場合は `alternative_delivery_on` と `alternative_return_on` をNULL、`alternative_returned_flag=false` とし、過去の代替機日付を残さない。`pickupRequiredFlag=false` の場合は `pickup_on` をNULLにする。申請時の `alternative_device_status`、導入業者・保守契約参照情報、既存の `alternative_device_info` はリクエスト本文から受け取らず、更新しない
8. 対象業者の業者名とメールを必須として、担当者名、電話番号、業者別提出期限、業者別依頼事項を `rfq_vendors` に新規保存し、`request_status='SENT'`、`requested_at=依頼送信操作日時`、`requested_by_user_id=操作ユーザーID` とする
9. 外部メールは送信しない。`SENT` は依頼送信操作と依頼先情報の登録完了を表し、メール配信成功を意味しない
10. 有効な `SENT` 依頼先が0件の場合は新規行を `is_primary_vendor=true` とする。有効な `SENT` 行があるのに主依頼先がない既存データでは、`requested_at`、`rfq_vendor_id` 昇順の先頭既存行を主依頼先へ設定し、新規行は `false` とする。既存の有効な主依頼先がある場合も新規行は `false` とする
11. 主依頼先の `vendor_id`・`vendor_name`・`contact_person`・`phone` を `repair_request_details.current_vendor_id`・`current_vendor_name`・`current_vendor_person`・`current_vendor_contact` へ同一トランザクションで同期する。`current_vendor_contact` は電話番号専用とし、`rfq_vendors.email` を保存しない。追加依頼先は主依頼先業者のスナップショットを上書きしない
12. 画面/APIにグループ共通の見積提出期限は設けず、業者別の `vendor.dueOn` を `rfq_vendors.due_on` の入力正本とする。依頼先登録後、有効な依頼先（`deleted_at IS NULL` かつ `request_status IN ('SENT','REPLIED')`）の `due_on` 最小値を再計算し、`repair_request_details.quotation_due_on` と `rfqs.due_on` へ同一トランザクションで同期する。該当日付がない場合は両方をNULLにする。追加依頼先の登録でも最短期限は更新され得る
13. 保存済み依頼先の訂正はSTEP1完了前に対象行を論理削除して再登録する
14. 依頼送信操作の保存後も `applications.status='新規申請'` とSTEP1を維持する。STEP2への遷移は見積依頼完了APIだけで行う
15. 依頼先、依頼内容、STEP1入力、依頼操作情報の保存は同一トランザクションで行う

### deleteRepairTaskTasksByRepairTaskIdVendorRequestsByRfqVendorId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象依頼先を削除済み行を含めて取得し、対象修理申請のREPAIR/RFQに属することと作業対象施設一致を確認する。対象が存在しない、別修理申請、または作業対象施設外の場合は404を返す。既に `deleted_at IS NOT NULL` の場合は追加更新せず204を返す
3. 未削除の場合は共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps`、`rfqs`、対象を含む有効な `rfq_vendors` をロックして状態を再確認する
4. 対象は `repair_category='OUTSOURCED'`、`status='新規申請'`、現在工程STEP1で、対象依頼先の `request_status` が `DRAFT` または `SENT` の修理申請に限定する。対象行が有効なまま条件外となった場合は409を返す
5. `rfq_vendors.deleted_at` を設定する論理削除とする。削除した依頼先は見積依頼完了の件数判定およびSTEP2の業者候補から除外する
6. 削除対象が主依頼先の場合、残る有効な `SENT` / `REPLIED` 行を `requested_at`、`rfq_vendor_id` 昇順で評価し、先頭1件を `is_primary_vendor=true` へ昇格する。昇格行の `vendor_id`・`vendor_name`・`contact_person`・`phone` を `repair_request_details.current_vendor_*` へ同期し、メールアドレスは `current_vendor_contact` へ保存しない
7. 削除対象が主依頼先かどうかにかかわらず、削除後の有効な `SENT` / `REPLIED` 行のうち `due_on IS NOT NULL` の最小値を再計算し、`repair_request_details.quotation_due_on` と `rfqs.due_on` へ同一トランザクションで同期する。該当日付がない場合は期限スナップショットだけをNULLにする
8. 削除後の有効な `SENT` / `REPLIED` 行が0件の場合は `repair_request_details.current_vendor_*` をNULLにする。有効な `SENT` 行が0件の場合は見積依頼完了APIを実行不可とし、申請ステータスとSTEP1は変更しない

### postRepairTaskTasksByRepairTaskIdVendorRequestsComplete

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps`、REPAIR/RFQ、有効な `rfq_vendors` をロックし、作業対象施設、院外修理、STEP1、依頼先状態を再確認する
3. `applications.status='見積依頼済'`、対象RFQが `status='見積依頼済'`、STEP1が `COMPLETED`、STEP2が `IN_PROGRESS` で、`requestComment` と `step1` の要求値が保存済み値と一致し、`receptionUserId` が保存済み受付担当者と一致する場合は同じ完了操作の再送として、履歴を追加せず保存済みの現在結果を200で返す。要求値または担当者が異なる場合、後続工程へ進行済みの場合は409とする
4. 初回処理の対象は `repair_category='OUTSOURCED'`、`applications.status='新規申請'`、現在工程STEP1の修理申請に限定する
5. 対象修理申請に紐づく有効な修理RFQが1件だけ存在し、`rfq_vendors.request_status='SENT'` の依頼先が1件以上あることを確認する
6. `requestComment` と `step1` の管理判断・日付・返却状態・商品引取入力を見積依頼送信APIと同じ保存先へ更新する。画面で最後に変更した値は本APIの確定値を正本とする。`receptionUserId` を検証し、選択ユーザーから導出した現在の受付担当者情報も `repair_request_details` へ保存する
7. 申請時の `alternative_device_status`、導入業者・保守契約参照情報、既存の `alternative_device_info`、業者別依頼先・提出期限は本APIのリクエスト本文から受け取らず、保存済み値を維持する
8. `rfqs.status='見積依頼済'`、`applications.status='見積依頼済'` に更新し、RFQ状態履歴へ `action_code='COMPLETE_RFQ_REQUEST'` を記録する
9. `application_task_steps` のSTEP1を `COMPLETED`、STEP2を `IN_PROGRESS` とし、操作ユーザーを工程・状態履歴へ記録する
10. 受付担当者情報、RFQ、申請状態、工程、履歴の更新は同一トランザクションで行う

### postRepairTaskTasksByRepairTaskIdQuotations

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象修理申請に有効な修理RFQが1件だけ存在し、指定 `rfqVendorId` がそのRFQに属する `deleted_at IS NULL` かつ `request_status IN ('SENT','REPLIED')` の有効な依頼先であることを事前確認する
3. DB業務行のロックを保持せずに、JSONパート `payload` の見積フェーズ、`rfqVendorId`、見積No.、見積日付、見積金額（税別）、勘定科目、保存形式と、固定名 `file` パートの見積書原本を必須検証する。クライアントからファイル内容ハッシュは受け取らない。見積書は拡張子 `.pdf` / `.jpg` / `.jpeg` / `.png`、MIME Type `application/pdf` / `image/jpeg` / `image/png` に限定し、拡張子とMIME Typeの対応、ファイルサイズを検証する。APIが実ファイルから内容ハッシュを算出して、ファイル内容ハッシュを含む最終リクエストハッシュで冪等行を確保してから、共通ルールで決定した最終S3キーへ直接保存する
4. ファイル準備後にDB登録トランザクションを開始し、共通ロック順に従って対象 `applications`、`repair_request_details`、現在工程の `application_task_steps`、対象REPAIR/RFQ、`rfq_vendors`、有効な `quotations` の順で `FOR UPDATE` ロックを取得する
5. ロック取得後に、修理申請の未削除・作業対象施設一致、現在工程、`applications.status`、対象RFQと指定 `rfqVendorId` の有効性を再確認する。`ESTIMATE` と `ORDER_REGISTRATION` は現在工程STEP2、`applications.status` が `見積依頼済` または `見積登録済` の場合に登録でき、`ADDITIONAL` は発注後からタスク完了前まで登録できる
6. `ESTIMATE` と `ADDITIONAL` は複数登録できる。`ORDER_REGISTRATION` はロック保持中に `quotation_phase='ORDER_REGISTRATION' AND deleted_at IS NULL` の既存行を再検索し、有効な既存行が0件の場合だけ登録する。既存行が1件以上ある場合は見積・見積明細・ドキュメント・状態を登録せず、409 (`REPAIR_ORDER_QUOTATION_CONFLICT`) を返す
7. `quotations.quotation_no` は共通の受領見積番号採番処理でサーバー採番する。画面入力を `vendor_quotation_no`、`quotation_on`、`quotation_phase`、`total_amount_excl_tax`、`account_division_code` に保存し、指定 `rfq_vendors` の業者ID・業者名・担当者名・メールを見積時点スナップショットとして保存する
8. 対象REPAIR/RFQの `rfq_applications.application_asset_id` から修理対象 `application_assets` を1件取得する。未設定または複数件で一意に特定できない場合は409を返す
9. ロック後の再検証に成功した場合、共通ルールで最終S3キーのオブジェクトが今回の内容ハッシュ、サイズ、MIME Typeと一致することを再確認する。不一致または取得不能の場合はDBをコミットしない
10. 見積書原本の `fileName` をアップロード時の元ファイル名として `application_documents.file_name` に保存し、右ペインの見積書一覧表示に使用する。`application_documents.title` はNULLとし、最終S3キーを `file_path` に保存する
11. 見積明細配列はリクエストから受け取らず、`quotation_items` を1件サーバー生成する。`row_no=1`、`item_type='E_その他役務'`、原文・確定の品目/メーカー/型式は修理対象スナップショット、`original_quantity=1`、`ai_quantity=1`、`unit='式'`、`purchase_price_unit=totalAmountExclTax`、`purchase_price_total=totalAmountExclTax`、`account_title=OpenAPIのRepairAccountDivisionCodeに記載した表示名（例: 01 医療機器）`、`is_specification_line=false` とする
12. 見積書原本の `application_documents` は `owner_type='QUOTATION'`、`quotation_id=quotationId`、`step_code='QUOTATION'`、`document_category='QUOTATION'`、`document_type='見積書'`、`document_date=quotationOn`、`document_no=vendorQuotationNo`、`storage_format=payload.document.storageFormat` とする
13. 対象依頼先が `request_status='SENT'` の場合は初回見積受領として `REPLIED` に更新し、すでに `REPLIED` の同じ業者から参考見積または追加見積を登録する場合は状態を維持する
14. `quotations`、サーバー生成した `quotation_items`、見積書原本の `application_documents`、必要な依頼先状態更新を同一トランザクションで確定する
15. 登録後の有効な見積構成を再判定し、`ORDER_REGISTRATION` があれば `rfqs.status='発注見積登録済'`、`ORDER_REGISTRATION` がなく `ESTIMATE` があれば `rfqs.status='見積DB登録済'` とする。RFQ状態が変わる場合は見積区分に応じて `action_code='REGISTER_ORDER_QUOTATION'` または `REGISTER_QUOTATION_DB` を履歴へ記録する。初回のいずれかの登録時に `applications.status='見積登録済'` とするが、STEP2は継続する
16. `ADDITIONAL` 登録ではRFQ状態、申請状態、採用済み発注登録用見積、発注情報を変更しない
17. PutObject失敗、ロック後の再検証失敗、発注登録用見積の競合、DB登録失敗等、DBコミット前のロールバックを確認できる場合は、共通の補償削除ルールに従い、今回のAPI実行で新規作成したS3オブジェクトだけを削除する。HeadObject照合で再利用した既存オブジェクトは削除しない。補償削除成功後は冪等行を削除し、業務競合は元の409、DB登録失敗は元の500、Amazon S3処理失敗は502を返す。COMMIT実行後に成否が不明な場合は補償削除せず、書込先DBで `COMPLETED` を再確認し、確認不能時は503を返す

### deleteRepairTaskTasksByRepairTaskIdQuotationsByQuotationId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象見積を削除済み行を含めて取得し、対象修理申請のREPAIR/RFQに属することと作業対象施設一致を確認する。対象が存在しない、別修理申請、または作業対象施設外の場合は404を返す。見積書原本の `application_documents` は削除済み行を含めて取得し、対象ドキュメントIDと `file_path` を確定する
3. 対象見積が既に `deleted_at IS NOT NULL` の場合はDBを追加更新せず、見積書原本のS3削除判定へ進む
4. 未削除の場合は共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps`、`rfqs`、対象 `quotations`、関連 `orders` と見積所有ドキュメントをロックして削除可否を再確認する
5. `ESTIMATE` と `ORDER_REGISTRATION` は発注登録前かつSTEP2の間だけ削除できる。`orders.quotation_id=quotationId` の発注登録用見積は削除できない
6. `ADDITIONAL` は発注後からタスク完了前まで削除できる
7. `quotations.deleted_at`、配下の `quotation_items.deleted_at`、見積書原本の `application_documents.deleted_at` を同一トランザクションで設定してコミットする
8. 発注前見積の削除後は、有効な `ORDER_REGISTRATION` があれば `rfqs.status='発注見積登録済'`、`ESTIMATE` だけなら `見積DB登録済`、いずれもなければ `見積依頼済` とする。RFQ状態が変わる場合は `rfq_status_histories.action_code='DELETE_QUOTATION'` を記録し、`applications.status` と現在工程は変更しない
9. DBコミット後、見積書原本の対象ドキュメントID群を除いて同じ `file_path` を参照する `deleted_at IS NULL` の `application_documents` が存在しない場合だけ、同じAPI内でDeleteObjectを同期実行する。他の有効な参照が存在する場合はS3オブジェクトを削除せず204を返す
10. DeleteObjectの対象なしは成功とし、再試行可能エラーは初回に加えて最大3回、指数バックオフで再試行する。S3削除成功または対象なしの場合は204を返す。削除を完了できない場合はDBの論理削除を維持して502 (`REPAIR_FILE_502_S3_OPERATION_FAILED`) を返し、同じDELETEの再送でS3削除を再実行する

### getRepairTaskTasksByRepairTaskIdQuotationsByQuotationIdPreviewUrl

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象見積が対象修理申請の有効な修理RFQに属し、未削除であることを確認する
3. 対象見積が所有する未削除の見積書原本について、短時間だけ有効な認可済みURLを発行する
4. S3オブジェクトキー、バケット名、S3直接URLは返さない

### postRepairTaskTasksByRepairTaskIdOrderPreview

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象は現在工程STEP2かつ `status='見積登録済'` の院外修理申請に限定する
3. 対象修理RFQに有効な `quotation_phase='ORDER_REGISTRATION'` の見積が1件だけ存在することを確認し、サーバー側で自動採用する。0件または2件以上の場合は409を返す
4. 採用見積、決済日、決済No.から発注書を一時生成する。発注日はサーバー処理日、支払条件は `未指定` としてプレビューへ反映する
5. 生成したPDFは `Content-Type: application/pdf` のバイナリで直接返す。画面は受信したPDFからブラウザー内のObject URLを生成して右ペインへ表示する
6. `orders`、`order_items`、`application_documents`、Amazon S3へは保存しない

### postRepairTaskTasksByRepairTaskIdOrder

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `settlementNo`、`settlementOn`、`receptionUserId` を含む正規化済みJSONから安定したリクエストハッシュを算出し、共通冪等ルールに従って業務処理より先に冪等行を `IN_PROGRESS` として確保する
3. 初回実行時だけ発注番号をサーバー側で一意に採番し、冪等行の初回受付日を発注日とする。採番済み発注番号と発注日は、同一キーの再実行で変化しないよう `IN_PROGRESS` の冪等行へ再開情報として保存する
4. DB業務行のロックを保持せず、対象修理申請、唯一の有効な発注登録用見積、対応する有効な見積明細1件を事前取得する。見積が0件または2件以上、見積明細が0件または2件以上、単価・金額を構成できない場合は409を返す
5. 事前取得した申請・RFQ・見積・見積明細の値、リクエストの決済No.・決済日、固定した発注番号・発注日から発注書PDFと登録内容を生成する。再送ごとに変化する生成日時等はPDFへ埋め込まず、同一冪等キー・同一リクエストでは同じPDF内容と内容ハッシュを再現する
6. 共通ルールで決定した最終S3キーに対してHeadObjectを行い、同じ内容ハッシュ・サイズ・MIME Typeの既存オブジェクトがあれば再利用し、存在しなければ発注書PDFをPutObjectする
7. ファイル準備後にDB登録トランザクションを開始し、対象 `api_idempotency_records` を先頭に、共通ロック順に従って `applications`、`repair_request_details`、現在工程の `application_task_steps`、REPAIR/RFQ、有効な `quotations`、対象 `quotation_items`、既存 `orders` の順でロックする
8. ロック取得後に作業対象施設、`repair_category='OUTSOURCED'`、現在工程STEP2、`applications.status='見積登録済'`、発注未登録、有効な発注登録用見積が1件、その有効な見積明細が1件であることを再確認する。さらに、事前取得時にPDFと登録内容へ使用した申請・RFQ・見積・見積明細のIDおよび各値がロック後の値と完全に一致することを確認し、不一致の場合は登録を確定しない
9. `orders` には固定した `order_no` と `order_on`、リクエストの `settlement_no` と `settlement_on`、`order_type='修理'`、`payment_terms='未指定'`、`storage_format='UNSPECIFIED'`、`status='ORDERED'`、採用見積の `quotation_id`・業者・担当者・メール・合計金額を発注時点スナップショットとして保存する。`order_document_delivery_method`、`order_document_delivery_status`、`order_document_sent_at` はNULLとする
10. `order_items` は採用見積明細から1件作成する。`quotation_item_id` に元見積明細ID、`registration_type='本体'` を保存し、品目・メーカー・型式・数量・単価・金額を見積明細から引き継ぐ
11. `repair_request_details.current_vendor_id`・`current_vendor_name`・`current_vendor_person` は採用見積の業者ID・業者名・担当者名、`current_vendor_contact` は採用見積の `rfq_vendor_id` に対応する有効な `rfq_vendors.phone`、`ordered_on` は固定した発注日から同一トランザクションで同期する。見積・発注のメールアドレスを `current_vendor_contact` へ保存しない
12. `receptionUserId` を検証し、選択ユーザーから導出した現在の受付担当者情報を `repair_request_details` へ保存する。採用見積を `ORDER_SELECTED`、`applications.status='発注済'`、`rfqs.status='発注済'` とし、RFQ状態履歴へ `action_code='REGISTER_ORDER'`、リクエストの `Idempotency-Key`、操作ユーザーを記録する。STEP2を `COMPLETED`、STEP3を `IN_PROGRESS` とする
13. 発注書は `application_documents.owner_type='RFQ'`、対象修理RFQの `rfq_id`、`order_id=orderId`、`step_code='ORDER'`、`document_category='ORDER'`、`document_type='発注書'`、`document_date=order_on`、`document_no=order_no`、`storage_format='UNSPECIFIED'` として1件保存する。`title=NULL`、`file_name='{orderNo}.pdf'`、`file_path=最終S3キー`、`mime_type='application/pdf'`、`file_size_bytes=生成PDFサイズ`、`content_hash=生成PDFのSHA-256`、`uploaded_by_user_id=操作ユーザーID`、`uploaded_at=現在日時` とし、`application_id`、`application_asset_id`、`quotation_id` はNULLとする
14. 有効な発注書は `order_id` 単位で1件だけ許可する
15. PutObject失敗、ロック後の再検証失敗、発注済み競合、DB登録失敗等、DBコミット前のロールバックを確認できる場合は、共通の補償削除ルールに従い、今回のAPI実行で新規作成したS3オブジェクトだけを削除する。HeadObject照合で再利用した既存オブジェクトは削除しない。補償削除成功後も冪等行の発注番号・発注日は保持し、再実行権を直ちに取得できる期限へ更新することで、同じキー・同じリクエストの再送で同じ発注書PDFを再現する。業務競合は元の409、DB登録失敗は元の500、Amazon S3処理失敗は502を返す。COMMIT実行後に成否が不明な場合は補償削除せず、書込先DBで `COMPLETED` を再確認し、確認不能時は503を返す
16. 受付担当者情報、発注、発注明細、発注書、申請・RFQ状態履歴、工程遷移、冪等行の `COMPLETED`・正式応答への更新は同一トランザクションで確定する。同一キーの成功済み再送は保存済みの発注番号・発注日・発注IDを含む初回結果を返し、PDFと業務行を再作成しない

### postRepairTaskTasksByRepairTaskIdWorkDate

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps`、院外修理の場合はREPAIR/RFQをロックし、作業対象施設、修理区分、現在STEP、ステータスを再確認する
3. STEP3が `COMPLETED`、STEP4が `IN_PROGRESS`、`applications.status='納期確定'`、`repair_request_details.work_planned_on` が要求日と一致し、`receptionUserId` が保存済み受付担当者と一致する場合は同じ作業日登録の再送として、履歴を追加せず保存済みの現在結果を200で返す。保存済み日付または担当者が異なる場合、後続工程へ進行済みの場合は409とする
4. 初回処理の対象は現在工程STEP3で、院外修理は `status='発注済'`、院内修理は `status='納期確定'` の修理申請に限定する
5. `repair_request_details.work_planned_on` に作業完了予定日を保存する
6. 院外修理は `applications.status='納期確定'` に更新し、院内修理は `納期確定` を維持する
7. `receptionUserId` を検証し、選択ユーザーから導出した現在の受付担当者情報を `repair_request_details` へ保存する
8. 院外修理では `rfqs.status='納期確定'` に更新し、RFQ状態履歴へ `action_code='REGISTER_WORK_DATE'` を記録する
9. 受付担当者情報、STEP3の `COMPLETED`、STEP4の `IN_PROGRESS`、申請・RFQ状態、工程・状態履歴を同一トランザクションで更新し、操作ユーザーを履歴へ記録する

### postRepairTaskTasksByRepairTaskIdDocuments

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `payload.documents` と `files` がともに1件以上であること、件数が一致することを検証し、同じ配列インデックスのメタデータとファイル本体を1対1で対応させる
3. 画面共通項目である `documentType`、`otherDocumentName`、`storageFormat`、`documentDate`、`documentNo`、`actualAmountExclTax`、`accountDivisionCode` は、`payload.documents` の全要素で同じ値であることを検証する。異なる書類属性のファイルは別の登録操作として受け付ける
4. 対象は現在工程STEP4かつ `status='納期確定'` の修理申請に限定する
5. 書類種別は `院内決済書類` / `修理報告書` / `検収書` / `その他` / `見積書（変更が発生した場合）` / `納品書` / `請求書` に限定する。文書日付とドキュメントNo.は任意とする
6. `documentType=その他` の場合は `otherDocumentName` を必須とする。`documentType=見積書（変更が発生した場合）` の場合は `actualAmountExclTax` と `accountDivisionCode` を必須とする
7. 配列順で対応する各ファイルについて、拡張子を `.pdf` / `.jpg` / `.jpeg` / `.png`、MIME Typeを `application/pdf` / `image/jpeg` / `image/png` に限定し、拡張子とMIME Typeの対応、ファイルサイズ、保存形式を検証する。`payload.documents` の `contentType` または `fileSize` が指定された場合は実際のファイル本体と照合し、不一致の場合は400を返す
8. クライアントからファイル内容ハッシュは受け取らず、DB業務行のロックを保持しない状態でAPIが全ファイルの実体から内容ハッシュを算出する。全ファイルの内容ハッシュを含む最終リクエストハッシュで冪等行を確保し、検証とハッシュ算出が全件完了するまではAmazon S3へ保存しない
9. 冪等行の確保後、全ファイルを共通ルールで決定した最終S3キーへ順次直接保存する。1件でもPutObjectに失敗した場合は処理を中断し、今回のAPI実行で新規作成したオブジェクトだけを共通の補償削除ルールで削除する。HeadObject照合で再利用した既存オブジェクトは削除しない。DBトランザクションは開始せず、`application_documents` を1件も作成しない
10. PutObject途中失敗時は、補償削除に成功した場合に冪等行を削除して502 (`REPAIR_FILE_502_S3_OPERATION_FAILED`) を返し、同一冪等キー・同一ファイル・同一入力内容で再試行可能とする。補償削除を完了できない場合は冪等行を `IN_PROGRESS` のまま保持して502を返し、`operationKey`、対象S3オブジェクトキー、失敗工程、トレースIDを運用ログへ記録する
11. 全ファイルのAmazon S3保存成功後にDB登録トランザクションを開始し、共通ロック順に従って対象 `applications`、`repair_request_details`、現在工程の `application_task_steps`、院外修理の場合はREPAIR/RFQ、既存のSTEP4 `application_documents` の順でロックして現在状態を再確認する
12. ロック後の再検証に成功した場合、全ファイルの最終S3キーが今回の内容ハッシュ、サイズ、MIME Typeと一致することを再確認する。1件でも不一致または取得不能の場合はDBをコミットせず、今回のAPI実行で新規作成したオブジェクトだけを補償削除する
13. 1ファイルにつき `application_documents` を1行作成する。`owner_type='APPLICATION'`、`application_id=repairTaskId`、`step_code='COMPLETE'`、`document_category='COMPLETE'` はサーバー側で固定する
14. 各行には画面共通入力を `document_type`、`other_document_name`、`storage_format`、`document_date`、`document_no`、`actual_amount_excl_tax`、`account_division_code` として保存する。`documentType=その他` 以外では `other_document_name=NULL`、`documentType=見積書（変更が発生した場合）` 以外では `actual_amount_excl_tax=NULL`、`account_division_code=NULL` とする
15. 各要素の `fileName` をアップロード時の元ファイル名として `file_name`、最終S3キーを `file_path`、実ファイルのMIME Typeを `mime_type`、ファイルサイズを `file_size_bytes`、API算出SHA-256を `content_hash`、操作ユーザーIDを `uploaded_by_user_id`、登録日時を `uploaded_at` に保存する。右ペインの一覧表示には `file_name` を使用し、ファイル名とは別の表示タイトルは受け取らず `title=NULL` とする
16. `account_division_code` はOpenAPIの `RepairAccountDivisionCode` に定義した値だけを受け付ける。クライアントから所有者・工程・区分は受け付けない
17. 全 `application_documents` と冪等行の `COMPLETED` 更新を同一トランザクションで確定し、部分登録を許可しない。DB登録失敗等、DBコミット前のロールバックを確認できる場合は、今回のAPI実行で新規作成したS3オブジェクトだけを共通の補償削除ルールで削除し、再利用した既存オブジェクトは削除しない。補償削除に成功した場合は冪等行を削除して元の500、補償削除を完了できない場合は冪等行を `IN_PROGRESS` のまま保持して502を返す。COMMIT実行後に成否が不明な場合は補償削除せず、書込先DBで `COMPLETED` を再確認し、確認不能時は503を返す

### deleteRepairTaskTasksByRepairTaskIdDocumentsByDocumentId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象完了書類を削除済み行を含めて取得し、`owner_type='APPLICATION'`、`application_id=repairTaskId`、`step_code='COMPLETE'`、`document_category='COMPLETE'` であることと作業対象施設一致を確認する。対象が存在しない、別修理申請、または作業対象施設外の場合は404を返す。対象ドキュメントIDと `file_path` を確定する
3. 対象完了書類が既に `deleted_at IS NOT NULL` の場合はDBを追加更新せず、S3削除判定へ進む
4. 未削除の場合は共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps`、院外修理の場合はREPAIR/RFQ、対象 `application_documents` をロックする。修理申請が `完了`、またはSTEP4が完了済みの場合は409を返す
5. 未削除の場合は `application_documents.deleted_at` を設定してDBをコミットする
6. DBコミット後、対象ドキュメントIDを除いて同じ `file_path` を参照する `deleted_at IS NULL` の `application_documents` が存在しない場合だけ、同じAPI内でDeleteObjectを同期実行する。他の有効な参照が存在する場合はS3オブジェクトを削除せず204を返す
7. DeleteObjectの対象なしは成功とし、再試行可能エラーは初回に加えて最大3回、指数バックオフで再試行する。S3削除成功または対象なしの場合は204を返す。削除を完了できない場合はDBの論理削除を維持して502 (`REPAIR_FILE_502_S3_OPERATION_FAILED`) を返し、同じDELETEの再送でS3削除を再実行する

### getRepairTaskTasksByRepairTaskIdDocumentsByDocumentIdPreviewUrl

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象は `owner_type='APPLICATION'`、`application_id=repairTaskId`、`step_code='COMPLETE'`、`document_category='COMPLETE'`、`deleted_at IS NULL` の完了書類に限定する
3. 短時間だけ有効な認可済みURLを発行し、S3オブジェクトキー、バケット名、S3直接URLは返さない

### postRepairTaskTasksByRepairTaskIdComplete

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps`、院外修理の場合はREPAIR/RFQをロックし、作業対象施設、STEP4、ステータスを再確認する
3. 初回処理で `completedOn` が未指定の場合はサーバー処理日を使用し、保存する完了日を確定する
4. `applications.status='完了'` かつSTEP4が `COMPLETED` の場合は同じ完了登録の再送候補とする。院外修理の保存済み完了日は `rfqs.completed_on`、院内修理はSTEP4の `completed_at` の日付を使用する。再送で `completedOn` が未指定の場合は保存済み完了日を採用し、明示された場合だけ一致を確認する。`alternativeReturnedFlag` も明示された場合だけ保存済み値との一致を確認し、`receptionUserId` は保存済み受付担当者との一致を必須とする。各値が一致する場合は履歴と貸出状態を追加更新せず保存済みの現在結果を200で返し、不一致または別の終端状態の場合は409とする
5. 初回処理の対象は現在工程STEP4かつ `status='納期確定'` の修理申請に限定し、`confirmCompletion=true` を確認する
6. 完了書類の登録件数を完了条件にしない。0件の場合も確認済みであれば完了できる
7. `receptionUserId` を検証し、選択ユーザーから導出した現在の受付担当者情報を `repair_request_details` へ保存する。`applications.status='完了'`、STEP4を `COMPLETED` とし、操作ユーザーを状態履歴・工程履歴へ記録する。院内修理では確定した完了日をSTEP4の `completed_at` の日付部分、完了登録操作時刻を時刻部分として保持する。実際の操作日時は `application_status_histories.changed_at` および各更新行の `updated_at` にも記録し、入力された完了日と監査上の操作日時を区別する
8. 院外修理では対象の修理RFQを `status='完了'`、`completed_on=completedOn` とし、RFQ状態履歴へ `action_code='COMPLETE_TASK'` を記録する。院内修理ではRFQを作成しない
9. `repair_request_details.alternative_returned_flag` は指定時だけ更新する
10. 修理対象に紐づく有効な `lending_devices` 行がある場合は対象行をロックし、現在状態と `lock_version` を再確認する
11. `lending_devices.status='使用不可'` の場合だけ既存の `ENABLE` 遷移を使用し、`status='貸出可'`、`lock_version=lock_version+1`、`updated_at=現在日時` に更新する。貸出管理対象外または別ステータスは更新しない
12. 完了登録では `asset_ledgers`、`individuals`、発注情報、見積情報を作成・更新しない
13. 受付担当者情報、申請状態、工程、履歴、貸出状態の更新は同一トランザクションで行う

### deleteRepairTaskTasksByRepairTaskId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象修理申請を削除済み行を含めて取得し、`application_type='REPAIR'` と作業対象施設一致を確認する。対象が存在しない、または作業対象施設外の場合は404を返す。既に `applications.deleted_at IS NOT NULL` の場合は追加更新せず204を返す
3. 未削除の場合は共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps`、REPAIR/RFQ、`rfq_vendors`、`quotations`、`orders`、関連 `application_documents` をロックして削除可否を再確認する
4. 対象は `status='見積登録済'` の修理申請に限定する
5. `orders` が作成済み、または `status` が `発注済` / `納期確定` / `完了` / `却下` の場合は409を返す
6. `applications.deleted_at` を設定して修理管理タブ一覧から除外する。`asset_ledgers`、`application_assets.asset_ledger_id`、`individuals` は更新しない
7. 紐づく `rfqs` が未発注の場合は `rfqs.deleted_at`、`rfq_vendors.deleted_at`、未採用の `quotations.deleted_at`、`quotation_items.deleted_at` も同一トランザクションで論理削除する。発注済みデータは削除しない
8. `rfq_applications` は削除済みRFQとの紐づけ履歴として保持し、通常一覧・現在割当判定では `rfqs.deleted_at IS NULL` のRFQのみ有効扱いとする
9. `application_documents` は監査証跡として物理削除しない。必要な非表示は所有者側の削除状態で制御する
10. `application_task_steps` は現在工程を `CANCELED`、`completion_reason='CANCEL'` として終了する

### postRepairTaskTasksByRepairTaskIdDisposalApplication

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 共通ロック順に従い、元修理申請の `applications`、`repair_request_details`、現在工程の `application_task_steps`、REPAIR/RFQ、有効な発注登録用 `quotations`、既存 `orders` をロックし、作業対象施設、院外修理、STEP2、発注未登録を再確認する
3. 対象は `application_type='REPAIR'`、`status='見積登録済'`、現在工程STEP2、`repair_request_details.repair_category='OUTSOURCED'`、発注未登録の修理申請に限定する
4. 対象修理RFQに有効な `quotation_phase='ORDER_REGISTRATION'` の見積が1件だけ存在することを確認する。0件または2件以上の場合は409を返す
5. 登録済み資産の場合は代表 `application_assets.asset_ledger_id` が存在し、作業対象施設の資産であることを検証する
6. 未登録資産の場合は `repair_request_details.is_registered_asset=false`、代表 `application_assets.asset_ledger_id IS NULL`、`repair_request_details.manual_item_name` など廃棄対象物品の表示に必要な手入力情報が存在することを検証する
7. `receptionUserId` を検証し、選択ユーザーから導出した現在の受付担当者情報を元修理申請の `repair_request_details` へ保存する。元修理申請は `applications.status='却下'` とし、`rejected_by_user_id=操作ユーザーID`、`rejected_by_name=操作ユーザー名`、`rejected_at=現在日時` を保存する。現在のSTEP2は `step_status='COMPLETED'`、`is_current=false`、`completed_at=現在日時`、`completion_reason='UNREPAIRABLE'` として終端する
8. 対象REPAIR/RFQは `status='申請を見送る'` とし、RFQ状態履歴へ `action_code='SKIP_APPLICATION'` と操作ユーザーを記録する。元修理申請の状態履歴にも `見積登録済→却下` と操作ユーザーを記録する
9. `applications` に廃棄申請ヘッダーを作成する。`application_no` はサーバー側で一意に採番し、`application_type='DISPOSAL'`、`facility_id=元修理申請の施設ID`、`status='新規申請'`、`requested_by_user_id`・`requested_by_name`・`requested_by_department_name`・`requested_by_contact` は廃棄申請接続を実行した認証ユーザーの現在情報、`requested_on`・`requested_at_time` は現在日時から設定する。設置場所は元修理申請・代表明細のスナップショットを引き継ぐ
10. 登録済み資産では `application_assets` に `asset_role='DISPOSAL'`、元修理対象の `asset_ledger_id` とスナップショットを保存する
11. 未登録資産では `application_assets` に `asset_role='DISPOSAL'`、`asset_ledger_id=NULL`、元修理申請の `application_assets` スナップショットおよび `repair_request_details.manual_*` から引き継いだ品目、メーカー、型式、シリアルNo.、設置部署、室名を保存する。`asset_ledgers` の作成・更新は行わない
12. `disposal_application_details` に `application_id=作成した廃棄申請ID`、`application_type='DISPOSAL'`、`disposal_reason_code='UNREPAIRABLE'`、`related_repair_application_id=元修理申請ID` を保存する。関連購入申請ID、廃棄業者、受付情報、期限・実施日は起票時点ではNULLとする
13. 作成した廃棄申請の `application_status_histories` に初期状態 `新規申請` と操作ユーザーを記録する。廃棄申請管理でのグループ化・受付以降は廃棄申請管理側のAPIへ引き継ぐ
14. 元修理申請の受付担当者情報、却下終端、REPAIR/RFQ終端、廃棄申請ヘッダー・明細・詳細の作成、申請・RFQ・工程履歴作成、冪等行の `COMPLETED` 更新は同一トランザクションで行う。同一冪等キーの再送では `receptionUserId` を含むリクエストハッシュが一致する場合だけ初回結果を返す

## 第6章 権限・業務ルール

### 必要権限

| 処理 | 必要 feature_code | 判定基準 | 説明 |
| --- | --- | --- | --- |
| 修理管理一覧・詳細・工程操作・削除 | `repair_management` | 通常アカウントは作業対象施設に対して実効 `repair_management` を持つこと。共有システム管理者アカウントは作業対象施設が未削除であれば通常権限判定をバイパスする | 修理管理タブと修理タスクの進行・発注前削除 |
| 廃棄申請接続 | `repair_management` | 通常アカウントは作業対象施設に対して実効 `repair_management` を持つこと。共有システム管理者アカウントは作業対象施設が未削除であれば通常権限判定をバイパスする | 登録済み資産または未登録資産の修理不能から廃棄申請を作成する |

### 登録済み資産・未登録資産ルール

- 登録済み資産は `asset_ledger_id` 必須とし、作業対象施設の資産であることを検証する
- 未登録資産は `manualItemName` を必須とし、`asset_ledgers` への登録、更新、削除を行わない
- 未登録資産でも修理依頼写真は添付できる
- 未登録資産は修理不能になった場合、修理申請経由の廃棄申請として廃棄申請接続APIで廃棄申請を作成できる
- 修理申請を経由しない未登録資産の単独廃棄申請は本書では定義せず、入口UI/APIを設けない
- 未登録資産の修理完了は申請履歴としてDBに保存するだけで、原本資産CRUDは発生しない

### 状態遷移ルール

| 操作 | 遷移前 | 遷移後 | 補足 |
| --- | --- | --- | --- |
| 院内修理選択 | 新規申請 | 納期確定 | `repair_category=IN_HOUSE`。STEP1を完了し、STEP2をスキップしてSTEP3へ進む |
| 院外修理選択 | 新規申請 | 新規申請 | `repair_category=OUTSOURCED`。STEP1で見積依頼を続行する |
| 受付判定の同一再送 | 受付済み | 変更なし | 保存済み修理区分と同じ判定かつ同じ受付担当者は200で現在結果を返し、受付情報・工程・RFQ・履歴を更新しない。異なる判定または担当者は409 |
| 見積依頼先登録・依頼送信 | 新規申請 | 新規申請 | 手入力した業者情報、依頼内容、依頼操作日時、操作ユーザーを保存し、依頼先を `SENT` とする。初回受付時の導入業者・保守契約参照情報は上書きしない。外部メールは送信せず、STEP1を継続する |
| 見積依頼完了 | 新規申請 | 見積依頼済 | 依頼送信操作が保存済みの有効な `SENT` 依頼先が1件以上ある場合にSTEP2へ進む |
| 参考見積／発注登録用見積の初回登録 | 見積依頼済 | 見積登録済 | STEP2を継続する。発注登録用見積は有効な1件だけ許可する |
| 追加見積登録 | 発注済 / 納期確定 | 変更なし | タスク完了前まで複数登録でき、採用見積・発注情報を変更しない |
| 修理見積削除 | 見積依頼済 / 見積登録済 / 発注済 / 納期確定 | 変更なし | 見積区分ごとの削除可能期間を検証して論理削除する |
| 修理タスク削除 | 見積登録済 | 論理削除 | `applications.deleted_at` を設定する。発注済み以降は削除不可 |
| 発注登録 | 見積登録済 | 発注済 | 唯一の発注登録用見積を自動採用し、STEP3へ進む |
| 作業日登録 | 発注済 / 納期確定 | 納期確定 | 院内修理は状態を維持し、院外修理は `納期確定` へ更新してSTEP4へ進む |
| 完了書類登録・削除 | 納期確定 | 納期確定 | STEP4中に修理申請単位で管理する |
| 完了登録 | 納期確定 | 完了 | 書類0件でも確認済みなら完了できる。資産台帳・個体情報は更新しない |
| 通常却下 | 見積登録済 | 却下 | 院外修理の発注前STEP2で、有効な `quotation_phase='ORDER_REGISTRATION'` の見積が1件だけ存在する場合に `completion_reason=REJECTED` とする |
| 修理不能 | 見積登録済 | 却下 | `completion_reason=UNREPAIRABLE`。登録済み資産または未登録資産の修理申請経由廃棄申請を作成する |

### STEP1参照情報・依頼先保存ルール

- No.6 修理申請APIが保存した `alternative_device_status` は申請時の `NOT_NEEDED` / `NEEDED` / `REQUESTED` を保持し、本書のAPIでは上書きしない。STEP1の必要／不要は `alternative_device_handling_required_flag` に保存する
- 修理タスク詳細APIは、申請時点値を `requestAlternativeDeviceStatus`、DB保存値を `alternativeHandlingRequiredFlag`、画面表示用実効値を `effectiveAlternativeHandlingRequiredFlag` として分けて返す。管理判断が未保存の場合だけ `NEEDED` / `REQUESTED` をtrue、`NOT_NEEDED` / NULLをfalseとして実効値を算出する。初期表示だけでは保存せず、依頼送信または見積依頼完了で受け取った `alternativeHandlingRequiredFlag` を保存した後は当該保存値を優先する
- 導入業者・保守契約は初回受付時にサーバー側で `repair_request_details` へ保存する参照表示用スナップショットであり、STEP1のプレビュー、依頼送信、見積依頼完了のリクエスト項目に含めない
- 保存済み依頼先が0件の場合、画面は導入業者スナップショットを1行目の初期候補として表示できるが、候補表示・編集だけではDBへ保存しない
- 業者名とメールを必須として依頼送信した時点で、編集後の業者情報を `rfq_vendors` に保存する。手入力した依頼先から導入業者スナップショットへ逆書きしない
- 業者ごとの提出期限は `rfq_vendors.due_on` を入力正本とし、`RepairStep1Input` では共通期限を受け取らない
- 最初の有効依頼先を主依頼先とし、主依頼先の業者ID・業者名・担当者名・電話番号を `repair_request_details.current_vendor_*` へ同期する。`current_vendor_contact` は `rfq_vendors.phone` 由来の電話番号専用とし、メールアドレスを保存しない。追加依頼先は主依頼先業者のスナップショットを上書きせず、主依頼先削除時だけ残る有効行を昇格する
- 見積提出期限は主依頼先とは分離する。有効な修理RFQ依頼先（`deleted_at IS NULL` かつ `request_status IN ('SENT','REPLIED')`）の `due_on` 最小値を、依頼先登録・論理削除時に `repair_request_details.quotation_due_on` と `rfqs.due_on` へ同一トランザクションで同期し、該当日付がない場合は両方をNULLにする

### 既存受付データの扱い

- `repair_request_details.reception_user_id` が保存済みの行では、そのユーザーを現在の受付担当者として詳細表示する
- 進行中の既存行で `reception_user_id IS NULL` の場合はGET時にログインユーザーや申請者から自動補完せず、次回のSTEP確定または終端操作で有効な `receptionUserId` の選択を必須とする
- 完了・却下済みの既存行は保存済み受付スナップショットを保持し、一括バックフィルしない

### 他機能との責務境界

- 日常点検APIと点検管理APIは修理申請連携用の初期値までを返し、修理申請の作成は No.6 修理申請API設計書の `POST /repair-request/requests` を正本とする
- 移動・廃棄管理は作成済み廃棄申請の受付、見積、発注、完了を扱う。修理不能からの廃棄申請起票は本書の接続APIで扱う
- 修理申請を経由しない未登録資産の単独廃棄申請はPhase1対象外であり、本書では定義しない
- 修理タスク内で生成するRFQ、見積、発注は `management_type='REPAIR'` として購入管理・リモデル管理と分離する

## 第7章 エラー条件補足

HTTPステータス、エラーコードおよびエラーレスポンス構造は `openapi.yaml` を正本とする。本章では各エラーコードを返す内部条件を補足する。

| エラーコード | 発生条件 |
| --- | --- |
| VALIDATION_ERROR | 必須不足、列挙値不正、日付形式不正 |
| RECEPTION_ASSIGNEE_INVALID | `receptionUserId` が未指定、受付担当者候補に存在しない、無効・削除済み、施設割当または実効 `repair_management` を満たさない |
| IDEMPOTENCY_KEY_REQUIRED | 見積依頼先登録・依頼送信、見積登録、発注登録、完了書類登録、廃棄申請接続のいずれかで `Idempotency-Key` が未指定 |
| UNAUTHORIZED | 認証トークン未付与または無効 |
| AUTH_403_REPAIR_MANAGEMENT_DENIED | 通常アカウントで作業対象施設に対する実効 `repair_management` がない。共有システム管理者アカウントでは作業対象施設が未削除であれば通常権限判定をバイパスする |
| FACILITY_NOT_FOUND | 作業対象施設が存在しない、または削除済み |
| REPAIR_REQUEST_NOT_FOUND | 対象の修理申請が存在しない |
| REPAIR_ASSET_NOT_FOUND | 対象修理申請に紐づく登録済み資産が存在しない |
| REPAIR_STATUS_CONFLICT | 現在ステータスが対象操作を許可しない |
| REPAIR_RECEPTION_DECISION_CONFLICT | 受付済みの修理区分と異なる院内対応／外部依頼への変更要求、または未受付データの受付情報・RFQ不整合 |
| REPAIR_TASK_DELETE_NOT_ALLOWED | 発注済み以降または削除対象外ステータスのため修理タスクを削除できない |
| REPAIR_QUOTATION_DELETE_NOT_ALLOWED | 採用済み、発注済み以降、または削除対象外ステータスのため修理見積を削除できない |
| REPAIR_DISPOSAL_APPLICATION_NOT_ALLOWED | 現在ステータス、院内修理、または対象物品情報不足により廃棄申請接続を実行できない |
| REPAIR_RFQ_NOT_FOUND | 院外修理の見積依頼グループが未作成 |
| REPAIR_RFQ_CONFLICT | 対象修理申請に有効な修理RFQが複数存在する |
| REPAIR_VENDOR_REQUEST_NOT_SENT | 見積依頼完了に必要な `SENT` の有効依頼先が存在しない |
| REPAIR_QUOTATION_NOT_LINKED | 指定見積が対象修理申請に紐づかない |
| REPAIR_ORDER_QUOTATION_CONFLICT | 発注登録用見積の新規登録時に有効な既存行が存在する、または後続操作時に有効な発注登録用見積が0件・複数件で一意に決まらない |
| REPAIR_ORDER_ALREADY_REGISTERED | 対象修理申請の発注が登録済み |
| IDEMPOTENCY_KEY_REUSED | 同一スコープ・同一 `Idempotency-Key` が異なる正規化済みリクエストで再利用された |
| IDEMPOTENCY_REQUEST_IN_PROGRESS | 同一スコープ・同一 `Idempotency-Key` の初回処理が進行中 |
| REPAIR_DOCUMENT_VALIDATION_ERROR | 完了書類の種別、条件付き項目、保存形式、またはファイル対応が不正 |
| REPAIR_DOCUMENT_LOCKED | タスク完了後のため完了書類を削除できない |
| REPAIR_FILE_502_S3_OPERATION_FAILED | 修理関連ドキュメントの決定的な最終S3キーへの保存、既存オブジェクト照合、失敗時の補償削除、または通常DELETE時のS3同期削除を完了できない |
| REPAIR_DB_503_COMMIT_OUTCOME_UNKNOWN | DBコミット成否を書込先DBで確認できない。登録系APIはIN_PROGRESSの冪等記録とS3オブジェクトを保持して同じ `Idempotency-Key` での再送を要求し、状態更新系APIは保存済み状態を基準に同じリクエストを再送可能とする |
| INTERNAL_SERVER_ERROR | サーバー内部エラー |

## 第8章 運用・保守方針

### 監査・履歴方針

- 修理申請の状態変更は `application_status_histories` に履歴を残す
- 工程進行、スキップ、通常却下、修理不能は `application_task_steps` の状態、`completion_reason`、実行ユーザーで追跡する。各STEP操作を実行したユーザーは状態履歴の `changed_by_user_id` と工程の更新者として記録する
- 申請者情報は起票時点のログインユーザー情報を `applications` にスナップショット保存する
- 申請時の代替機選択は `repair_request_details.alternative_device_status` に保持して修理管理で上書きせず、管理担当者の判断は `alternative_device_handling_required_flag` に分離して保存する
- 初回受付および各STEPの確定・終端操作では、選択された受付担当ユーザーのID・氏名・所属部署・電話番号を `repair_request_details.reception_user_id`、`reception_person`、`reception_department`、`reception_contact` に保存する。詳細取得やプレビュー等のREAD操作では保存済み受付情報を表示し、ログインユーザー情報で上書きしない
- 初回受付時に導入業者・保守契約参照情報も `repair_request_details` にスナップショット保存し、以降の資産・発注・保守契約マスタ変更やSTEP1の手入力依頼先によって上書きしない
- STEP1の依頼送信操作を実行したユーザーは `rfq_vendors.requested_by_user_id`、操作保存日時は `requested_at` に記録する。メール配信成否は記録しない
- 登録時のファイル実体はAPI内で決定的な最終S3キーへ直接保存する。DBコミット前のロールバックを確認できる登録失敗では、今回のAPI実行で新規作成したS3オブジェクトだけをAPI内で補償削除し、再利用した既存オブジェクトは削除しない。COMMIT実行後に成否が不明な場合はS3を保持して書込先DBで結果を再確認する。`application_documents.file_path` は最終S3キーの正本とし、S3バケット名やS3直接URLは通常APIログ・レスポンスに出力しない

## 第9章 未確定事項

| ID | 未確定事項 | 現時点の扱い |
| --- | --- | --- |
| OPEN-REPAIR-001 | 1ファイル当たりの最大サイズ、1回の登録ファイル数、リクエスト全体サイズ、文字列長、および `pageSize` の最大値 | 既存仕様に上限値が定義されていないため保留とし、推測による `maximum` / `maxLength` / `maxItems` はOpenAPIへ設定しない。共通基盤または業務仕様で上限が確定した時点で、OpenAPI、入力検証および試験項目を同時に更新する |
