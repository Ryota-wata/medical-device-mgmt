# 移動・廃棄管理（廃棄申請管理） API内部設計

## 第1章 概要

### 本書の目的

本書は、移動・廃棄管理タブ画面（`/quotation-data-box/transfer-management`）、廃棄申請管理画面（`/disposal-task`）、旧廃棄管理URL（`/quotation-data-box/disposal-management`）で利用する API の設計内容を定義する。

資産一覧起点、リモデル編集リスト起点、修理不能起点などの申請起票本体は各起票元のAPI設計書を正本とし、本書では起票済み申請の受付、移動承認と原本反映、廃棄申請のRFQグループ化、見積依頼、見積登録、発注登録、作業日/納期登録、完了登録を扱う。

### 対象システム概要

移動・廃棄管理は、タスク管理配下で移動申請と廃棄申請を統合表示する機能である。移動申請は承認時点で資産台帳の設置場所を更新し、同一トランザクションで資産台帳履歴と申請ステータス履歴を作成する。廃棄申請は廃棄申請タスクとしてRFQ、見積、発注、作業日、完了まで進行する。

未登録資産の廃棄は、修理申請で修理不能と判定されて作成された廃棄申請のみを後続管理対象とする。修理申請を経由しない未登録資産の単独廃棄申請入口は Phase1 対象外であり、本書では API を定義しない。

### 用語定義

| 用語 | 説明 |
| --- | --- |
| 移動申請 | `applications.application_type='TRANSFER'` の申請。承認時に `asset_ledgers` の設置場所を原本反映する |
| 廃棄申請 | `applications.application_type='DISPOSAL'` の申請。廃棄申請タスクへ紐づけて後続工程を進行する |
| 廃棄申請タスク | 廃棄申請を1件以上束ねた `rfqs.management_type='DISPOSAL'`、`workflow_type='RFQ'` の廃棄依頼グループ。本書の `disposalTaskId` は `rfqs.rfq_id` を指す。資産一覧起点とリモデル起点を同じグループモデルで扱い、リモデル起点かどうかは `rfq_applications.edit_list_id` / `edit_list_item_id` で判定する |
| 登録済み資産 | `application_assets.asset_ledger_id` を持つ廃棄/移動対象 |
| 未登録資産 | 資産台帳IDを持たない対象。廃棄管理では `disposal_application_details.related_repair_application_id` がある申請のみ許可する |
| 旧廃棄管理URL | `/quotation-data-box/disposal-management`。業務APIは持たず、移動・廃棄管理タブへ正規化する画面ルート |

### 対象画面

| 画面名 | 画面パス | 利用目的 |
| --- | --- | --- |
| 移動・廃棄管理タブ画面 | /quotation-data-box/transfer-management | 移動/廃棄申請の受付一覧、廃棄RFQグループ一覧、移動承認操作を提供する |
| 廃棄申請管理画面 | /disposal-task?groupId={disposalTaskId} | 廃棄RFQグループの見積依頼、見積登録、発注、作業日、完了登録を行う |
| 廃棄管理リダイレクト画面 | /quotation-data-box/disposal-management | 旧URLから移動・廃棄管理タブへ正規化する |

## 第2章 システム全体構成

### API の位置づけ

本API群は、申請作成後のタスク管理機能である。申請起票、申請添付の初期登録、更新購入や棚卸しからの関連申請作成は呼び出し元 API の責務とし、本書では起票済み申請の状態遷移と関連タスクのみを更新する。

廃棄タスクは `rfqs` をグループの正本として利用し、`rfq_applications` で対象 `applications` / `application_assets` と接続する。`rfqs.status` はグループ全体の現在STEP・終端状態、`applications.status` はグループ内の申請単位の業務状態として役割分担し、グループ操作では両方を同一トランザクションで更新する。`application_task_steps` は工程タイムラインの補助情報であり、現在STEPの判定元にはしない。

### 画面と API の関係

| 画面操作 | API | 補足 |
| --- | --- | --- |
| 移動・廃棄管理タブ初期表示/フィルター | `GET /quotation-data-box/transfer-management/tasks` | 移動承認待ち、廃棄申請受付、廃棄RFQグループ一覧を取得する |
| 移動申請詳細確認・承認 | `POST /transfer-applications/{transferApplicationId}/approve` | 移動申請を承認し、資産台帳の設置場所と履歴を同一トランザクションで更新する |
| 廃棄申請から見積依頼グループ作成 | `POST /quotation-data-box/transfer-management/disposal-groups` | 選択した廃棄申請と画面入力したグループ名を `rfqs` / `rfq_applications` に保存し、廃棄申請タスクを作成する |
| 受付担当者候補検索 | `GET /disposal-task/reception-assignees` | 作業対象施設で廃棄申請管理を担当できる病院ユーザー・SHIPユーザーを氏名検索する |
| 廃棄申請タスク詳細表示 | `GET /disposal-task/tasks/{disposalTaskId}` | STEP表示、申請、対象資産、依頼先、見積、発注、添付を取得する |
| 廃棄申請を見送る | `POST /disposal-task/tasks/{disposalTaskId}/cancel` | 発注前の廃棄タスクを `申請見送り` で終端する |
| 見積依頼書プレビュー | `POST /disposal-task/tasks/{disposalTaskId}/vendor-requests/preview` | 画面入力中の未保存依頼先からPDFを生成し、DB・S3へ保存しない |
| 見積依頼先登録 | `POST /disposal-task/tasks/{disposalTaskId}/vendor-requests` | 業者別登録操作で依頼先、ご依頼事項、操作日時、操作ユーザーをDBへ保存する。外部メールは送信せずSTEP①を継続する |
| 見積依頼完了 | `POST /disposal-task/tasks/{disposalTaskId}/vendor-requests/complete` | 登録済み依頼先を確認し、最終のご依頼事項と最早回答期限を保存して `見積依頼済` へ進める |
| 見積登録 | `POST /disposal-task/tasks/{disposalTaskId}/quotations` | 見積ヘッダー、明細、見積原本を保存し、有効な見積構成に応じてRFQを `見積DB登録済` / `発注見積登録済`、申請を `見積DB登録済` / `発注用見積登録済` へ進める |
| 見積削除 | `DELETE /disposal-task/tasks/{disposalTaskId}/quotations/{quotationId}` | 発注前の見積を論理削除する |
| STEP②メール送信 | APIなし | Phase2向けの表示項目。Phase1ではAPI呼び出し、DB保存、発注確定、状態・STEP遷移を行わない |
| 発注登録 | `POST /disposal-task/tasks/{disposalTaskId}/order` | 唯一の有効な発注登録用見積を自動採用して発注を作成し `発注済` へ進める |
| 作業日/納期登録 | `POST /disposal-task/tasks/{disposalTaskId}/delivery-date` | 廃棄予定日を保存し `納期確定` へ進める |
| 完了書類追加/削除 | `POST /disposal-task/tasks/{disposalTaskId}/documents` / `DELETE /disposal-task/tasks/{disposalTaskId}/documents/{documentId}` | 完了報告書、廃棄証明書、マニフェスト、契約書、請求書等を管理する |
| 検収/完了登録 | `POST /disposal-task/tasks/{disposalTaskId}/complete` | 廃棄完了情報と証跡を保存し `完了` へ進める |

### 利用テーブル

| テーブル/VIEW | 利用種別 | 用途 |
| --- | --- | --- |
| `applications` | READ/UPDATE | 移動/廃棄申請ヘッダ、ステータス、申請番号、申請者情報 |
| `application_assets` | READ/UPDATE | 移動/廃棄対象資産、移動先スナップショット、廃棄対象スナップショット |
| `transfer_application_details` | READ | 移動申請の移動先、関連購入申請、コメント（移動理由 他） |
| `disposal_application_details` | READ/UPDATE | 廃棄理由、関連修理/購入、受付、期限、発注、廃棄予定日、検収情報 |
| `application_status_histories` | CREATE | 申請ステータス変更履歴 |
| `application_task_steps` | READ | 既存共通工程情報がある場合の補助表示。No.27では作成・更新せず、現在STEP・再アクセス位置の正本にも使用しない |
| `rfqs` | CREATE/READ/UPDATE | 廃棄申請タスクの業務RFQグループ。`management_type='DISPOSAL'`、`workflow_type='RFQ'`。グループ状態履歴も記録する |
| `rfq_applications` | CREATE/READ | 廃棄RFQグループと申請/申請明細の接続 |
| `rfq_status_histories` | CREATE | 廃棄RFQグループのステータス変更履歴 |
| `rfq_vendors` | CREATE/READ/UPDATE | 廃棄見積依頼先、主依頼先、回答期限、依頼送信操作の保存状態。一覧の発注前業者名・担当者名・電話番号の参照元 |
| `quotations` / `quotation_items` | CREATE/READ/UPDATE | 廃棄見積ヘッダーと、見積金額・勘定科目からサーバー生成する集約明細1件。採用候補と見積削除時の論理削除も管理する |
| `quotation_item_application_links` | READ/UPDATE | 既存の廃棄見積明細リンクを参照し、見積削除時に論理削除する。新規の廃棄見積登録では集約明細と申請明細のリンクを作成しない |
| `orders` / `order_items` | CREATE/READ/UPDATE | 廃棄発注ヘッダーと、採用した発注登録用見積のサーバー生成済み集約明細を引き継ぐ発注明細1件 |
| `application_documents` | CREATE/READ/UPDATE | 見積書、発注書、完了報告書、廃棄証明書等のファイルメタデータ。ファイル実体はAmazon S3に保存し、`file_path` にはS3オブジェクトキーのみ保持する |
| `asset_ledgers` | READ/UPDATE | 移動承認時の設置場所原本反映、廃棄完了時の廃棄済み状態反映 |
| `asset_ledger_histories` | CREATE | 資産台帳更新の監査履歴 |
| `facilities` | READ | Bearerトークン上の作業対象施設の存在・未削除確認 |
| `facility_locations` | READ | 移動元/移動先の設置場所表示と存在確認 |
| `users` | READ | 受付担当者候補、選択された受付担当者の氏名・所属部署・電話番号、操作ユーザーの確認 |
| `user_facility_assignments` | READ | 受付担当者候補を作業対象施設の有効担当ユーザーへ限定する |
| `facility_feature_settings` / `user_facility_feature_settings` | READ | 受付担当者候補とAPI実行者の実効 `transfer_disposal` を確認する |
| `api_idempotency_records` | CREATE/READ/UPDATE/DELETE | 二重作成を防ぐ登録系5 APIの冪等判定と初回結果保持 |

## 第3章 共通仕様

### 認証・認可

ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。

本API群で使用する `feature_code` は `transfer_disposal` である。画面表示用の `/auth/context` はUX用キャッシュであり、各業務APIでも同条件を再判定する。各APIの権限節に記載する `user_facility_assignments`、`facility_feature_settings`、`user_facility_feature_settings` の認可条件は通常アカウントに適用する。共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）は、Bearerトークン上の作業対象施設が存在し未削除であることを確認したうえで、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする。

| 処理 | 必要 feature_code | 判定テーブル | 説明 |
| --- | --- | --- | --- |
| 移動・廃棄管理タブ表示 | `transfer_disposal` | `user_facility_assignments` / `facility_feature_settings` / `user_facility_feature_settings` | 作業対象施設に対して実効有効な場合のみタブ表示と一覧APIを許可する |
| 移動承認・原本反映 | `transfer_disposal` | 同上 | 対象移動申請の対象施設に対する権限を再判定する |
| 廃棄RFQグループ作成/廃棄タスク操作 | `transfer_disposal` | 同上 | 対象廃棄申請または廃棄タスクの施設に対する権限を再判定する |

### 受付担当者の選択・保存ルール

- 受付担当者は画面上で氏名から選択し、APIでは選択した `users.user_id` を `receptionUserId` として受け取る。通常アカウントの初期表示ではログインユーザーを選択済みとし、共有システム管理者アカウントは候補に含まれないため、処理前に通常アカウントを選択する
- 選択候補は `users.account_type IN ('HOSPITAL','SHIP')`、`users.is_active=true`、`users.deleted_at IS NULL` を満たし、作業対象施設への有効な `user_facility_assignments` と実効 `transfer_disposal` を持つユーザーに限定する
- 保存APIは `receptionUserId` が候補条件を満たすことを処理時点で再検証し、満たさない場合は400 (`RECEPTION_ASSIGNEE_INVALID`) を返す
- 選択したユーザーから `rfqs.reception_user_id=users.user_id`、`reception_person=users.name`、`reception_department=users.section_name`、`reception_contact=users.phone_number` を導出して同一トランザクションで保存する。`section_name` または `phone_number` が未設定の場合はNULLを許容し、`department_name` やメールアドレスへフォールバックしない
- `rfqs.reception_confirmed_at` はグループ作成時の初回受付確定日時として一度だけ設定し、担当者変更時は更新しない
- 受付情報を更新する契機は、廃棄RFQグループ作成、STEP1見積依頼完了、STEP2発注登録、STEP3作業日/納期登録、STEP4完了登録、申請見送りの各確定操作とする。詳細取得、再アクセス、プレビュー、見積依頼先登録、見積登録、完了書類登録・削除、ファイル選択、一覧・表示では更新しない
- 終端状態のタスクは受付情報を読取専用とする。各STEP操作を実行したユーザーは `rfq_status_histories.changed_by_user_id`、`application_status_histories.changed_by_user_id` 等へ別途記録し、現在の受付担当者とは区別する

### 共通リクエストヘッダー

| ヘッダー | 必須 | 説明 |
| --- | --- | --- |
| Authorization | ✓ | Bearer トークン |
| X-Acting-Facility-Id | ✓ | 作業対象施設ID。Bearer トークン上の担当施設と一致すること |
| Idempotency-Key | 条件付き | 廃棄RFQグループ作成、見積依頼先登録、見積登録、発注登録、完了書類登録の5 APIで必須。その他のPOST/DELETEでは使用しない |

### 外部メール送信対象外ルール

- STEP1の「依頼送信」は、業者情報、依頼内容、依頼操作日時、操作ユーザーをDBへ保存する業務操作であり、外部メールは送信しない
- `rfq_vendors.request_status='SENT'` は依頼送信操作と依頼先情報の登録完了を表し、メール配信成功を意味しない
- STEP2の「メール送信」はPhase2向けの表示項目とし、Phase1ではAPI呼び出し、DB保存、発注確定、状態・STEP遷移を行わない
- 発注登録では発注情報と発注書PDFを保存するが、発注書の外部送付は行わない。`orders.order_document_delivery_method`、`order_document_delivery_status`、`order_document_sent_at` はNULLとする
- 本API群ではメール送信API、メール送信用の冪等制御、メール送信失敗エラーを定義しない

### 未保存PDFプレビューの返却ルール

- 廃棄見積依頼書プレビューと廃棄発注書プレビューは、成功時に `Content-Type: application/pdf` のPDFバイナリをレスポンスボディへ直接返す。フロントエンドは受信したBlobから画面表示用Object URLを生成する
- 未保存PDFプレビューでは業務DB、`application_documents`、Amazon S3へ保存せず、プレビューURL、S3オブジェクトキー、バケット名を返さない
- 登録済み見積書・発注書・完了書類は本ルールの対象外とし、各プレビューURL取得APIが保存済みS3オブジェクトに対する短時間有効の認可済みURLを返す

### ファイル保存ルール

- GETの一覧・詳細・プレビューURL取得は表示用のREAD処理であり、`rfqs`、`applications`、見積、発注、ドキュメント、状態履歴を更新しない
- 見積原本と完了書類は multipart/form-data の固定名 `file` パートとして1ファイルを受け取る。発注書はAPIが生成し、画面からファイルをアップロードしない
- ブラウザ上のファイル選択・入力途中・プレビュー表示はAPIを呼び出さず、業務DBに保存しない。見積書は「見積書の登録」、完了書類は「ドキュメント登録」、発注書は「発注登録」の押下時だけ、ファイルメタデータと画面入力項目を同一トランザクションで保存する
- 本書ではファイル単体を先に保存するアップロードAPIを設けない。各登録APIがファイル本体とメタデータを一括で受け取り、業務登録成功時にだけ `application_documents` 行を作成する
- S3オブジェクトキーは `application-documents/facility-{facilityId}/{yyyy}/{mm}/{operationKey}/{fileIndex}-{contentHash}.{ext}` とする。`operationKey` は施設ID、認証ユーザーID、HTTPメソッド、実リクエストパス、`Idempotency-Key` を正規化した値からサーバー側で生成し、キーの生値や業務IDをS3キーへ含めない。`contentHash` はAPIがファイル本文から算出する
- 全ファイルの入力検証と内容ハッシュ算出後、冪等行を `IN_PROGRESS` として確保し、決定的な最終キーへ `If-None-Match: *` とSHA-256 checksumを指定して直接PutObjectする。再送時に同じ最終キーがある場合はHeadObjectで内容ハッシュ、サイズ、MIME Typeを照合し、一致する場合だけ再利用する
- S3保存後に業務DBトランザクションを開始し、業務データ、`application_documents`、状態履歴、冪等完了記録を同一トランザクションで確定する。DBコミット前のロールバックを確認できた場合は、今回のAPI実行で新規作成したS3オブジェクトだけを補償削除し、再送時に再利用した既存オブジェクトは削除しない
- `application_documents.file_path` にはS3オブジェクトキーのみ保存し、S3バケット名、S3の直接URL、認可なしで利用できるURLはDBへ保存しない
- アップロード時の元ファイル名は `application_documents.file_name` に保存して右ペインの一覧表示に使用する。ファイル名とは別の表示タイトルは使用せず `application_documents.title=NULL` とする
- ファイル内容ハッシュはクライアントから受け取らず、APIが実ファイルから算出して `application_documents.content_hash` に保存する。任意指定された `contentType` または `fileSize` は実際のファイルパートと照合し、不一致は400とする
- レスポンスではS3オブジェクトキー、S3バケット名、S3の直接URLを返さず、画面表示やダウンロードが必要な場合は認可済み `downloadUrl` を返す
- 補償削除は `NoSuchKey` を成功とし、再試行可能なエラーだけを初回に加えて最大3回、指数バックオフで再試行する。補償削除を完了できない場合は502 (`DISPOSAL_FILE_502_S3_OPERATION_FAILED`) を返し、対象キー、失敗工程、トレースIDを運用ログへ記録する
- 通常の見積・完了書類削除APIはDBの論理削除を先にコミットし、同じ `file_path` を参照する他の有効な `application_documents` が存在しない場合だけ、同じAPI内でS3オブジェクトを同期削除する。S3削除に失敗した場合はDBの論理削除を維持して502を返し、同じDELETEの再送でS3削除を再実行する
- 廃棄申請見送りAPIも、見送り状態と関連行の論理削除をDBへ先にコミットした後、他の有効なドキュメントが参照していない対象S3オブジェクトを同じAPI内で同期削除する。S3削除に失敗した場合は見送り状態を維持して502を返し、同じPOSTの再送では業務状態を再更新せずS3削除だけを再実行する

### 登録系POST APIの冪等再送ルール

- `Idempotency-Key` を必須とするのは、廃棄RFQグループ作成、見積依頼先登録、見積登録、発注登録、完了書類登録の5 APIとする
- 冪等判定のスコープは作業対象施設ID、認証ユーザーID、HTTPメソッド、パスパラメータ展開後の実リクエストパス、`Idempotency-Key` とする。JSON業務項目を正規化し、ファイルAPIではファイル名、サイズ、MIME Type、API算出内容ハッシュ、保存形式、文書属性もリクエストハッシュへ含める
- `api_idempotency_records` を冪等判定の正本とし、`processing_status='IN_PROGRESS'` と `in_progress_expires_at` を一意制約の下で確保してから処理を開始する。期限内の同一キー・同一ハッシュは409 (`IDEMPOTENCY_REQUEST_IN_PROGRESS`) と `Retry-After: 5`、同一キー・異なるハッシュは409 (`IDEMPOTENCY_KEY_REUSED`)、キー未指定は400 (`IDEMPOTENCY_KEY_REQUIRED`) とする
- 同一キー・同一ハッシュの `COMPLETED` は保存済みの初回HTTPステータスと結果を返し、業務行、履歴、ファイルを再作成しない。業務トランザクションの確定と冪等行の `COMPLETED` 更新は同一トランザクションで行う
- COMMIT実行後に成否を確認できない場合はS3オブジェクトを補償削除せず、書込先DBの新しい接続で結果を再確認する。確認不能時は冪等行を `IN_PROGRESS` のまま保持し、503 (`DISPOSAL_DB_503_COMMIT_OUTCOME_UNKNOWN`) と `Retry-After: 5` を返す。クライアントは同じキー・同じリクエストで再送する

### 状態更新系POST APIの自然冪等ルール

- 移動承認、廃棄申請見送り、見積依頼完了、作業日/納期登録、完了登録は `Idempotency-Key` を要求しない
- 各APIは現在行を悲観ロックし、要求した目標状態へ同じ業務値と同じ `receptionUserId` ですでに到達している場合は業務データと履歴を追加更新せず、保存済みの現在結果を200で返す。保存済み値または受付担当者が異なる場合、別の終端状態または後続工程へ進行済みの場合は409を返す
- 廃棄申請見送りの再送では、目標状態へ到達済みでも未完了のS3削除対象を再評価する。対象オブジェクトの削除を完了した場合、または対象が既に存在しない場合に200を返す

### 更新処理の排他制御ルール

- 更新APIは既存行の悲観ロックを使用し、廃棄管理専用の `lock_version` 列や `If-Match` ヘッダーは追加しない
- 登録系APIは業務トランザクション内で対象 `api_idempotency_records` 行を先にロックし、その後 `applications`（ID昇順）→申請詳細→現在工程の `application_task_steps`→`rfqs`→`rfq_applications`→対象子行（`rfq_vendors` / `quotations` / `orders` / `application_documents`）→資産・リモデル連携行の順でロックする。対象外テーブルはその段階をスキップする
- ロック取得後に施設スコープ、未削除、申請種別、`management_type='DISPOSAL'`、`workflow_type='RFQ'`、現在ステータス、対象RFQ・子行の所属を再検証し、前提が変わっている場合は上書きせず409を返す

### DELETE APIの再送ルール

- 見積、完了書類のDELETE APIは `Idempotency-Key` を要求せず、論理削除を利用して自然冪等とする
- 対象IDが同じ廃棄タスクに属することを削除済み行を含めて確認し、既に論理削除済みの場合はDBを追加更新しない。S3削除対象の見積・完了書類は同じDELETEの再送時にも同期削除を再試行する
- 対象が一度も存在しない、別タスクに属する、または施設外の場合は404、未削除のまま工程進行・採用・発注・完了により削除不可となった場合は409を返す

### ステータス正規化

一覧表示ラベルとDB保存ステータスは分離する。画面表示だけに存在するラベルは以下の保存値へ正規化する。

| 画面表示 | 保存ステータス | 対象 | 補足 |
| --- | --- | --- | --- |
| 見積登録済（参考見積） | 見積DB登録済 | 廃棄 | 見積フェーズ `ESTIMATE` の保存値 |
| 見積登録済（発注登録用見積） | rfqs.status=`発注見積登録済` / applications.status=`発注用見積登録済` | 廃棄 | 見積フェーズ `ORDER_REGISTRATION` の保存値。グループと申請で保存値を分ける |
| 作業日確定 | 納期確定 | 廃棄 | 廃棄予定日/作業日が確定した保存値 |
| 申請を見送る | rfqs.status=`申請を見送る` / applications.status=`申請見送り` | 廃棄 | 業務上の見送り終端。物理削除せず、`rfqs.deleted_at` は設定しない |
| 移動完了 | 完了 | 移動 | 移動承認と原本反映が同一操作のため保存上は最終完了 |

### 廃棄ライフサイクル

| 工程 | 保存ステータス | 主なAPI | 次工程 |
| --- | --- | --- | --- |
| 申請受付/グループ作成 | 新規申請 | `POST /quotation-data-box/transfer-management/disposal-groups` | 見積依頼 |
| 見積依頼 | 見積依頼済 | `POST /disposal-task/tasks/{disposalTaskId}/vendor-requests/complete` | 見積登録 |
| 見積登録（ESTIMATE） | 見積DB登録済 | `POST /disposal-task/tasks/{disposalTaskId}/quotations` | 見積登録（ORDER_REGISTRATION）または発注登録 |
| 見積登録（ORDER_REGISTRATION） | rfqs.status=`発注見積登録済` / applications.status=`発注用見積登録済` | `POST /disposal-task/tasks/{disposalTaskId}/quotations` | 発注登録 |
| 発注登録 | 発注済 | `POST /disposal-task/tasks/{disposalTaskId}/order` | 作業日/納期登録 |
| 作業日/納期登録 | 納期確定 | `POST /disposal-task/tasks/{disposalTaskId}/delivery-date` | 完了登録 |
| 完了登録 | 完了 | `POST /disposal-task/tasks/{disposalTaskId}/complete` | 終端。画面上はSTEP③から直接STEP④へ進むため、廃棄申請では `納期確定` から完了登録を許可する |
| 申請見送り | 申請見送り | `POST /disposal-task/tasks/{disposalTaskId}/cancel` | 終端 |

廃棄申請管理画面の工程は常に次の4STEPで返す。STEP②は見積登録から発注登録までを一つの工程として扱い、発注専用の画面STEPを追加しない。

| `rfqs.status` | 現在STEPコード | 画面表示 |
| --- | --- | --- |
| `見積依頼` | `QUOTE_REQUEST` | STEP① 見積依頼 |
| `見積依頼済` / `見積DB登録済` / `発注見積登録済` | `QUOTATION_ORDER` | STEP② 見積登録・発注 |
| `発注済` | `WORK_DATE` | STEP③ 作業日登録 |
| `納期確定` | `COMPLETE` | STEP④ 完了登録 |
| `完了` / `申請を見送る` | 現在STEPなし | 終端状態 |

`steps` は上記4STEPを工程順に返し、現在STEPより前を `COMPLETED`、現在STEPを `IN_PROGRESS`、後続を `NOT_STARTED` とする。`完了` は全STEPを `COMPLETED`、`申請を見送る` は完了済み工程を維持したうえで未完了工程を `CANCELED` とする。廃棄申請の現在STEPは `rfqs.status` から導出し、`application_task_steps` に廃棄専用の工程行を追加しない。

`startedAt` / `completedAt` は `rfqs.created_at` と `rfq_status_histories.changed_at` から算出する。STEP①開始はRFQ作成日時、STEP②開始は最初の `見積依頼済`、STEP③開始は最初の `発注済`、STEP④開始は最初の `納期確定` への遷移日時とし、各STEPの完了日時は次STEPの開始日時、STEP④だけは最初の `完了` への遷移日時とする。既存データで対応履歴を特定できない値はNULLとし、GETで履歴を補完しない。

### 基本エラーレスポンス

エラーレスポンスの項目定義はOpenAPIが参照する共通 `ErrorResponse` を正本とする。本機能固有の不足項目や除外理由は `details` の文字列配列で返す。

## 第4章 API一覧

| No | API名 | メソッド | パス | 用途 | 権限 |
| --- | --- | --- | --- | --- | --- |
| 1 | 移動・廃棄管理一覧取得 | GET | /quotation-data-box/transfer-management/tasks | 移動申請受付、廃棄申請受付、廃棄RFQグループ一覧を取得する | `transfer_disposal` |
| 2 | 移動申請承認 | POST | /transfer-applications/{transferApplicationId}/approve | 移動申請を承認し資産台帳へ原本反映する | `transfer_disposal` |
| 3 | 廃棄RFQグループ作成 | POST | /quotation-data-box/transfer-management/disposal-groups | 選択した廃棄申請を廃棄申請タスクへ束ねる | `transfer_disposal` |
| 4 | 廃棄受付担当者候補取得 | GET | /disposal-task/reception-assignees | 作業対象施設で選択可能な受付担当者を取得する | `transfer_disposal` |
| 5 | 廃棄タスク詳細取得 | GET | /disposal-task/tasks/{disposalTaskId} | 廃棄申請タスク詳細を取得する | `transfer_disposal` |
| 6 | 廃棄申請見送り | POST | /disposal-task/tasks/{disposalTaskId}/cancel | 発注前の廃棄タスクを申請見送りで終端する | `transfer_disposal` |
| 7 | 廃棄見積依頼書プレビュー | POST | /disposal-task/tasks/{disposalTaskId}/vendor-requests/preview | 画面入力中の未保存依頼先から業者別のPDFを直接返す。DB・S3へ保存しない | `transfer_disposal` |
| 8 | 廃棄見積依頼先登録 | POST | /disposal-task/tasks/{disposalTaskId}/vendor-requests | 業者別登録操作で見積依頼先と操作情報を保存する。外部メールは送信しない | `transfer_disposal` |
| 9 | 廃棄見積依頼完了 | POST | /disposal-task/tasks/{disposalTaskId}/vendor-requests/complete | 登録済み依頼先を確認しSTEP②へ進める | `transfer_disposal` |
| 10 | 廃棄見積登録 | POST | /disposal-task/tasks/{disposalTaskId}/quotations | 廃棄見積ヘッダーと見積原本を登録する | `transfer_disposal` |
| 11 | 廃棄見積削除 | DELETE | /disposal-task/tasks/{disposalTaskId}/quotations/{quotationId} | 発注前の登録済み見積を論理削除する | `transfer_disposal` |
| 12 | 廃棄見積プレビュー | GET | /disposal-task/tasks/{disposalTaskId}/quotations/{quotationId}/preview-url | 登録済み見積書の認可済みプレビューURLを取得する | `transfer_disposal` |
| 13 | 廃棄発注登録 | POST | /disposal-task/tasks/{disposalTaskId}/order | 唯一の発注登録用見積から発注情報を作成する | `transfer_disposal` |
| 14 | 廃棄発注書プレビュー | POST | /disposal-task/tasks/{disposalTaskId}/order/preview | 発注登録前の発注書PDFを直接返す。DB・S3へ保存しない | `transfer_disposal` |
| 15 | 廃棄作業日/納期登録 | POST | /disposal-task/tasks/{disposalTaskId}/delivery-date | 廃棄予定日を登録する | `transfer_disposal` |
| 16 | 廃棄完了書類登録 | POST | /disposal-task/tasks/{disposalTaskId}/documents | 廃棄依頼グループ単位で完了書類を追加する | `transfer_disposal` |
| 17 | 廃棄完了書類削除 | DELETE | /disposal-task/tasks/{disposalTaskId}/documents/{documentId} | 対象RFQの完了書類を論理削除する | `transfer_disposal` |
| 18 | 廃棄完了書類プレビュー | GET | /disposal-task/tasks/{disposalTaskId}/documents/{documentId}/preview-url | 対象RFQの完了書類の認可済みプレビューURLを取得する | `transfer_disposal` |
| 19 | 廃棄完了登録 | POST | /disposal-task/tasks/{disposalTaskId}/complete | 登録済み完了書類を確認し廃棄タスクを完了する | `transfer_disposal` |

## 第5章 API詳細設計

### getQuotationDataBoxTransferManagementTasks

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること

#### 処理仕様

1. `applications.application_type IN ('TRANSFER', 'DISPOSAL')`、作業対象施設、`deleted_at IS NULL` の行を対象にする
2. 移動申請は未完了の受付行を中心に返し、承認済み/完了行は履歴表示対象としてフィルター時に返す
3. 廃棄申請受付は、未削除かつ有効な未終端 `DISPOSAL/RFQ` へ未接続の `DISPOSAL` 申請を返す。完了・申請見送り済みの過去リンクは履歴として保持し、現在割当の重複判定から除外する
4. 廃棄RFQグループは `rfqs.management_type='DISPOSAL'`、`workflow_type='RFQ'`、`rfqs.deleted_at IS NULL`、`rfqs.status NOT IN ('完了','申請を見送る')` を基本条件とし、`rfq_applications` に `applications.application_type='DISPOSAL'` が紐づく行を起点に対象申請と期限列を集約する
5. グループ行には `managementType`、`workflowType`、`applicationType`、`isRemodelOrigin`、`editListId`、`editListItemIds` を返す。リモデル起点は `rfq_applications.edit_list_id` / `edit_list_item_id` から判定し、`rfqs.edit_list_id` や管理種別だけでは判定しない
6. 未登録資産を含む廃棄申請は `disposal_application_details.related_repair_application_id IS NOT NULL` の場合のみ受付一覧に出す
7. 表示ステータスは保存ステータス正規化表に従って返し、画面操作可否は `availableActions` で返す
8. 期限列は `deadlineLabel` / `deadlineOn` で返す。`rfqs.status='見積依頼'`、`見積DB登録済`、`発注見積登録済`、`発注済` は両方NULLとする
9. `rfqs.status='見積依頼済'` は `deadlineLabel='見積提出期限'`、`deadlineOn=disposal_application_details.quotation_due_on` とする。`quotation_due_on` は有効な廃棄RFQ依頼先（`deleted_at IS NULL` かつ `request_status IN ('SENT','REPLIED')`）の `due_on` 最小値を同期した値とし、対象日付が全件NULLの場合もラベルは維持して `deadlineOn=NULL` とする
10. `rfqs.status='納期確定'` は `deadlineLabel='廃棄予定日'`、`deadlineOn=disposal_application_details.disposal_scheduled_on` とする
11. 一覧の廃棄業者情報は `vendorName`、`vendorPerson`、`vendorContact` で返す。発注前は対象RFQの有効な `rfq_vendors.is_primary_vendor=true` の行から `vendor_name`、`contact_person`、`phone` を返す。主依頼先がない既存データでは、旧仕様で保存された `DRAFT` を含む有効な `DRAFT` / `SENT` / `REPLIED` 行を `rfq_vendor_id` 昇順で評価した先頭1件を読取時の代表とし、GETではDBを更新しない
12. 発注後は対象RFQの有効な発注と採用見積を起点に、`orders.vendor_name`、`orders.vendor_contact_person`、採用見積の `rfq_vendor_id` に対応する有効な `rfq_vendors.phone` を返す。発注前・発注後とも `vendorContact` にメールアドレスを設定せず、代表業者または各値がない場合は該当フィールドをNULLとする
13. `applicationType` は `ALL` で3配列すべて、`TRANSFER` で `transferApplications` のみ、`DISPOSAL` で `disposalApplications` と `disposalGroups` のみを検索対象とし、対象外の配列は空配列で返す
14. `statusTab` は下表の画面タブ互換トークンとして扱う。値の名称は変更せず、DB保存ステータスの文字列として直接比較しない。`INTAKE` 以外の工程タブでは `disposalGroups` だけを返し、`transferApplications` と `disposalApplications` は空配列とする。`applicationType='TRANSFER'` と廃棄工程タブの組み合わせは検索結果0件として空配列を返す
15. 現行画面にはページング操作がなく、申請受付と廃棄依頼グループを同時に表示するため、本APIは `page` / `pageSize` を受け取らず、条件に一致する行を各配列へ返す。`transferApplications` と `disposalApplications` は `applications.requested_on DESC, applications.application_id DESC`、`disposalGroups` は `rfqs.created_at DESC, rfqs.rfq_id DESC` の安定順で返す

| statusTab | 画面上の対象 | DB抽出条件 |
| --- | --- | --- |
| `ALL` | 現在の一覧対象すべて | `applicationType` の対象範囲に対して工程絞り込みを追加しない。完了・申請見送り済み廃棄グループは基本条件どおり除外 |
| `INTAKE` | 申請受付 | 未終端の `transferApplications` と、有効な未終端 `DISPOSAL/RFQ` へ未接続の `disposalApplications`。`disposalGroups` は空配列 |
| `VENDOR_SELECTION` | 業者選定・見積依頼待ち | `rfqs.status='見積依頼'` の廃棄グループ |
| `QUOTE_COLLECTION` | 見積回収・見積登録待ち | `rfqs.status='見積依頼済'` の廃棄グループ |
| `ORDERED` | STEP②の発注登録または申請見送り判断待ち | `rfqs.status IN ('見積DB登録済','発注見積登録済')` の廃棄グループ。トークン名は互換目的で維持し、`rfqs.status='発注済'` を意味しない |
| `WORK_DATE_CONFIRMED` | STEP③の作業日登録待ち | `rfqs.status='発注済'` の廃棄グループ。トークン名は互換目的で維持し、作業日登録済みを意味しない |
| `COMPLETED` | STEP④の完了登録待ち | `rfqs.status='納期確定'` の廃棄グループ。終端の `完了` は一覧対象外 |

### postTransferApplicationsByTransferApplicationIdApprove

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること

#### 処理仕様

1. `applications.application_type='TRANSFER'`、作業対象施設、未削除であることを確認する
2. 現在ステータスが移動承認可能状態でない場合は 409 を返す
3. `application_assets` の移動先施設/部署/部門/部屋/設置場所を検証し、対象 `asset_ledgers` を同一トランザクションで行ロックする
4. 対象 `asset_ledgers` の設置場所、部署、部門、部屋スナップショットを更新し、変更前後を `asset_ledger_histories` に登録する
5. `applications.status='完了'` に更新し、`application_status_histories` に承認・原本反映履歴を登録する
6. 移動承認と原本反映のどちらか一方だけが成功した状態を禁止する

### postQuotationDataBoxTransferManagementDisposalGroups

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること

#### 処理仕様

1. リクエストの `groupName` は前後空白を除去し、空文字でないことを確認する。`applicationIds[]` は重複排除し、対象 `applications` が `application_type='DISPOSAL'`、作業対象施設、未削除、グループ化可能な状態であることを確認する
2. 未登録資産を含む申請は `disposal_application_details.related_repair_application_id` がある場合のみ許可する
3. 対象 `application_assets` 行を `FOR UPDATE` でロックし、同一資産に対する有効な未終端 `DISPOSAL/RFQ` の `rfq_applications` が存在する申請は `skipped[]` に `DISPOSAL_GROUP_ASSET_DUPLICATE` として返す。管理種別横断の一意制約は追加せず、完了・申請見送り済みの過去リンクは履歴として保持する
4. 作成対象が残った場合、`rfqs.management_type='DISPOSAL'`、`workflow_type='RFQ'`、`rfqs.status='見積依頼'` で業務RFQグループを作成する。`rfqs.rfq_group_name` には正規化済みの `groupName` を保存し、`rfq_no` は作成確定時に `DISP-yyyyMMdd-nnnn` 形式でサーバー採番する。廃棄グループ名を品目名等からサーバー生成しない
5. 対象申請に紐づく廃棄対象 `application_assets` を `rfq_applications` に1明細1行で登録し、`rfq_applications.edit_list_id` / `edit_list_item_id` は起票元の行リンクから引き継ぐ。`applications.primary_rfq_no` は採番したRFQ番号、`applications.rfq_group_name` は `rfqs.rfq_group_name` と同じ画面入力値で更新する
6. `receptionUserId` を共通の受付担当者候補条件で検証し、選択ユーザーの `users.name`、`section_name`、`phone_number` から `rfqs.reception_person`、`reception_department`、`reception_contact` を導出して `rfqs.reception_user_id` とともに保存する。`rfqs.reception_confirmed_at` は初回受付確定日時として設定する。`rfqs.request_comment` はこのAPIでは設定せず、見積依頼先登録または見積依頼完了で保存する
7. 作成直後は `applications.status='新規申請'`、`rfqs.status='見積依頼'`、`application_status_histories`、`rfq_status_histories` を同一トランザクションで保存し、作成結果と除外結果を `created[]` / `skipped[]` で返す
8. 全件が除外された場合はグループを作成せず、409 (`DISPOSAL_GROUP_ASSET_DUPLICATE`) を返す。除外した申請は共通 `ErrorResponse.details` に `applicationId:reasonCode:reason` 形式で格納する。部分作成時の `skipped[]` は201レスポンスで返し、対象申請の一部だけが別トランザクションで成功する状態を作らない
9. 作成直後は廃棄タスク STEP1（見積依頼）を現在工程として返す

### getDisposalTaskReceptionAssignees

#### 権限

- 認可条件: 通常アカウントはBearer トークン上の作業対象施設について `transfer_disposal` の実効権限があること。共有システム管理者アカウントは作業対象施設が未削除であれば認証・認可API設計書の例外規定に従って利用できる

#### 処理仕様

1. 作業対象施設が存在し、未削除であることを確認する。通常アカウントではAPI実行者が当該施設の実効 `transfer_disposal` を持つことも確認する
2. 共通の受付担当者候補条件を満たす `users` を取得する。`keyword` 指定時は `users.name` または `users.section_name` の部分一致で絞り込み、`limit` 件まで返す
3. `keyword` 未指定かつAPI実行ユーザー自身が候補条件を満たす場合は当該ユーザーを先頭とし、以降は氏名、所属部署、ユーザーIDの順で安定ソートする。`userId=users.user_id`、`name=users.name`、`department=users.section_name`、`contact=users.phone_number`、`accountType=users.account_type` を返す。所属部署・電話番号の未設定はNULLとし、別項目へフォールバックしない
4. 候補取得はREAD処理とし、タスクの受付情報やユーザー情報を更新しない

### getDisposalTaskTasksByDisposalTaskId

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること

#### 処理仕様

1. `rfqs.management_type='DISPOSAL'`、`workflow_type='RFQ'`、対象施設、`rfqs.deleted_at IS NULL` を確認し、`workflow_type='DISPOSAL'` の旧廃棄承認ワークフローは本タスク詳細の対象外とする
2. `rfq_applications` から対象 `applications`、`application_assets`、`disposal_application_details` を取得する
3. `rfq_applications.edit_list_id` / `edit_list_item_id` を起点に各申請・明細の `isRemodelOrigin`、`editListId`、`editListItemIds` を算出する。起票元は `rfqs.edit_list_id` や管理種別だけで判定しない
4. `steps` は `rfqs.status` をグループ正本、`applications.status` を申請単位の正本とし、第3章の4STEPマッピングに従って算出する。廃棄申請では `application_task_steps` を現在STEPの判定・返却元に使用しない
5. `rfq_vendors`、`quotations`、`quotation_items`、`orders`、`application_documents` を必要に応じて結合し、`rfqs.reception_department`、`reception_person`、`reception_user_id`、`reception_confirmed_at`、`reception_contact`、`request_comment` は保存済みのグループ情報として返す。受付情報と `request_comment` は保存値を正本とし、GET時のログインユーザー情報で上書きしない
6. ヘッダーの `vendorName` は一覧と同じ代表表示ルールを使用し、発注前は主依頼先、発注後は採用した発注登録用見積の業者名を返す。主依頼先がない既存データの読取フォールバックと、GETでDBを更新しない方針も一覧APIと同じとする
7. `availableActions` は現在ステータス、依頼先・見積・発注・書類の有無から算出する。`PREVIEW_VENDOR_REQUEST` と `REGISTER_VENDOR_REQUEST` は `rfqs.status='見積依頼'`、`COMPLETE_VENDOR_REQUEST` は同状態かつ有効な `SENT` / `REPLIED` 依頼先が1件以上ある場合に返す。`PREVIEW_ORDER` と `REGISTER_ORDER` は有効な `quotation_phase='ORDER_REGISTRATION'` の見積が1件だけ存在し、未発注かつ発注可能状態の場合に限り返す
8. `documents` は対象RFQの完了書類（`owner_type='RFQ'`、`rfq_id=disposalTaskId`、`step_code='COMPLETE'`、`document_category='COMPLETE'`）だけを返す。見積書は `quotations[].documentId`、発注書は `order.documentId` で返し、同じドキュメントを `documents` に重複掲載しない
9. URLの `groupId` を `disposalTaskId` として扱う

### postDisposalTaskTasksByDisposalTaskIdVendorRequestsPreview

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること

#### 処理仕様

1. 対象廃棄タスクが作業対象施設に属し、`rfqs.status='見積依頼'` であることを確認する
2. リクエストの `vendor.vendorName` と `vendor.email` を必須検証し、メール形式と任意項目の形式を確認する。未保存の依頼先を識別する `rfqVendorId` は要求しない
3. `rfqs.reception_department`、`rfqs.reception_person`、`rfqs.reception_user_id`、`rfqs.reception_contact` の保存値と、リクエストの未保存 `vendor` を使用する。`requestComment` が指定された場合は画面入力値、未指定の場合は保存済み `rfqs.request_comment` を使用する。受付部署・受付担当者は現在ログインしているユーザーの情報で上書きしない
4. 見積依頼書を生成し、`Content-Type: application/pdf` のPDFバイナリを直接返す。業務DB、Amazon S3、`application_documents`、`rfq_vendors` は更新しない

### postDisposalTaskTasksByDisposalTaskIdCancel

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること

#### 処理仕様

1. 初回処理では対象廃棄タスクの `rfqs.status` が発注前（`見積依頼` / `見積依頼済` / `見積DB登録済` / `発注見積登録済`）であることを確認する。`発注済`、`納期確定`、`完了` 以降は拒否する。既に `rfqs.status='申請を見送る'` かつ `receptionUserId` が保存済み受付担当者と一致する同じ操作の再送はDBを追加更新せず、見積書S3オブジェクトの削除判定へ進む。担当者が異なる再送は409を返す
2. 初回処理では、紐づく全 `applications.status` を `申請見送り`、`rfqs.status` を `申請を見送る` に更新し、`application_status_histories` と `rfq_status_histories` を同一トランザクションで登録する
3. `rfq_vendors` に登録済みの依頼先がある場合は未回答分を `CANCELED` に更新する
4. `rfqs.deleted_at` は設定しない。`rfq_vendors`、`quotations`、`quotation_items`、`quotation_item_application_links`、見積書の `application_documents` を同一トランザクションで論理削除し、`rfq_applications`、起票元申請、状態履歴は保持する。資産台帳は更新しない。見積書の `file_path` はDBコミット前に削除対象として保持する
5. DBコミット後、各見積書の `file_path` を参照する他の有効な `application_documents` が存在しない場合だけ、同じAPI内でS3オブジェクトを同期削除する。`NoSuchKey` は成功とし、共通S3削除ルールに従って再試行する
6. S3削除を完了できない場合は、DBの見送り・論理削除を維持して502 (`DISPOSAL_FILE_502_S3_OPERATION_FAILED`) を返す。同じ見送り操作の再送ではS3削除を再実行し、完了後に200を返す
7. 初回処理では `receptionUserId` を検証し、選択ユーザーから導出した現在の受付担当者情報を、申請・RFQ状態変更および履歴と同一トランザクションで `rfqs` へ保存する
8. 申請見送り完了後に一覧（`/quotation-data-box/transfer-management`）へ戻れる結果を返す

### postDisposalTaskTasksByDisposalTaskIdVendorRequests

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること

#### 処理仕様

1. 対象廃棄タスクが `rfqs.status='見積依頼'` であり、作業対象施設に属することを確認する。画面入力だけでは保存せず、業者別登録操作で本APIが呼ばれた場合だけ保存する
2. リクエストの `vendor.vendorName` と `vendor.email` を必須検証し、担当者名、電話番号、回答期限、依頼先別補足の形式を確認する
3. 対象 `rfqs` と有効な `rfq_vendors` をロックし、リクエストの依頼先を新規行として保存する。`request_status='SENT'`、`requested_at=操作日時`、`requested_by_user_id=認証ユーザーID` とし、外部メールは送信しない。SENTは依頼先情報と依頼操作のDB登録完了を表す
4. `requestComment` が指定された場合は `rfqs.request_comment` に保存し、未指定の場合は保存済み値を維持する。見積依頼先の個別登録はSTEP確定操作ではないため、受付部署・受付担当者・受付連絡先は更新せず、`rfqs` の現在値を保持する
5. 有効な `SENT` / `REPLIED` 依頼先が0件の場合は新規行を `is_primary_vendor=true` とし、既存の有効な主依頼先がある場合は新規行をfalseとする。有効な依頼先があるのに主依頼先がない既存データでは、`requested_at`、`rfq_vendor_id` 昇順の先頭既存行を主依頼先へ補正し、新規行はfalseとする
6. 依頼先、ご依頼事項、操作日時、操作ユーザーは同一トランザクションで確定する。登録後も `rfqs.status='見積依頼'`、対象 `applications.status='新規申請'` を維持し、STEP①を継続する
7. 登録済み行は画面上で編集・削除せず、追加依頼先は別の業者別登録操作で新規登録する。未登録の画面行を削除する操作はクライアント内で完結し、APIを呼び出さない
8. 同一 `Idempotency-Key`・同一リクエストの再送では初回の `rfqVendorId`、主依頼先フラグ、SENT状態、登録日時を返し、依頼先を重複作成しない

### postDisposalTaskTasksByDisposalTaskIdVendorRequestsComplete

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること

#### 処理仕様

1. 対象廃棄タスク、紐づく全 `applications`、有効な `rfq_vendors` を共通ロック順で取得し、作業対象施設に属することを確認する
2. 既に `rfqs.status='見積依頼済'` かつ対象全申請が `applications.status='見積依頼済'` で、`requestComment` が未指定または保存済み `rfqs.request_comment` と同一、かつ `receptionUserId` が保存済み受付担当者と一致する場合は履歴を追加せず現在結果を200で返す。コメントまたは担当者が異なる場合、後続工程へ進行済みの場合は409を返す
3. 初回処理は `rfqs.status='見積依頼'`、対象全申請が `applications.status='新規申請'` の場合だけ許可する
4. 対象タスクに有効な `request_status IN ('SENT','REPLIED')` の依頼先が1件以上あることを確認する
5. `requestComment` を `rfqs.request_comment` に保存する。未指定の場合は既存値を維持する。`receptionUserId` を検証し、選択ユーザーから導出した現在の受付担当者情報を `rfqs` へ保存する
6. 有効な `SENT` / `REPLIED` 依頼先のうち `due_on IS NOT NULL` の最小値を、対象全申請の `disposal_application_details.quotation_due_on` に保存する。該当日付がない場合はNULLとする
7. 受付担当者情報、`rfqs.status='見積依頼済'`、対象全 `applications.status='見積依頼済'`、`rfq_status_histories`、`application_status_histories` を同一トランザクションで登録する

### postDisposalTaskTasksByDisposalTaskIdQuotations

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること

#### 処理仕様

1. 対象廃棄タスクの `rfqs.status` が `見積依頼済`、`見積DB登録済` または `発注見積登録済` の見積登録可能状態であることを確認する
2. 画面のファイル選択だけではDB保存せず、`payload.document` と `file` が揃った「見積書の登録」押下時にだけ後続処理を行う
3. 固定名 `file` パートが1件存在することを確認する。許可する組み合わせは `.pdf` / `application/pdf`、`.jpg` または `.jpeg` / `image/jpeg`、`.png` / `image/png` とし、拡張子、申告MIME Type、実ファイル形式が一致しない場合は400を返す
4. `payload.rfqVendorId` が対象 `rfqs` に属し、削除されておらず、`request_status IN ('SENT','REPLIED')` の `rfq_vendors.rfq_vendor_id` であることを検証する。未依頼のDRAFT業者、取消済み業者、RFQ不一致は409 (`QUOTATION_VENDOR_MISMATCH`) とする
5. `payload.quotationPhase`、`payload.document.storageFormat`、業者、見積No.、見積日、金額、勘定科目を必須項目としてバリデーションする。`payload.accountDivisionCode` はOpenAPIの `DisposalAccountDivisionCode` のいずれかとする。`quotationPhase='ORDER_REGISTRATION'` は有効行をRFQ単位で1件だけ許可し、既存行がある場合は409 (`DISPOSAL_ORDER_QUOTATION_CONFLICT`) とする
6. `quotations.quotation_no` はサーバー採番し、画面入力の見積No.は `quotations.vendor_quotation_no` に保存する
7. `quotations` は `rfq_id`、`rfq_vendor_id`、業者スナップショット、見積フェーズ、金額、見積番号で作成する。見積明細配列はリクエストから受け取らず、同じトランザクションで `quotation_items` を1件サーバー生成する。`row_no=1`、`item_type='E_その他役務'`、`original_item_name` と `item_name` は `廃棄委託費`、`original_quantity=1`、`ai_quantity=1`、`unit='式'`、`purchase_price_unit` と `purchase_price_total` は `payload.totalAmountExclTax`、`account_title` は `payload.accountDivisionCode` に対応する勘定科目表示名、`is_specification_line=false` とし、メーカー・型式はNULLとする
8. 画面に明細別の対象資産・按分入力がないため、新規の廃棄見積登録では `quotation_item_application_links` を作成しない。廃棄対象は `rfq_applications` で管理し、集約見積明細を個別の申請明細やリモデル編集リスト明細へ自動配賦しない
9. 見積原本の `application_documents.document_date` は `payload.quotationOn`、`document_no` は画面入力の見積No.（`payload.vendorQuotationNo`）を基準に保存し、`storage_format` は `payload.document.storageFormat` を保存する
10. 見積原本は共通ファイル保存ルールに従い、冪等キーから生成した決定的な最終S3キーへ直接保存する
11. 見積原本は `application_documents` に `owner_type='QUOTATION'`、`quotation_id`、`step_code='QUOTATION'`、`document_category='QUOTATION'`、`document_type='見積書'`、`title=NULL`、`document_date`、`document_no`、`storage_format`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、API算出 `content_hash`、`uploaded_by_user_id`、`uploaded_at` として保存する
12. S3保存後のDB登録失敗、補償削除、コミット結果不明時の扱いは共通ファイル保存・冪等再送ルールに従う
13. 登録後の有効な見積構成を再判定する。有効な `ORDER_REGISTRATION` が1件あれば `rfqs.status='発注見積登録済'`、対象全 `applications.status='発注用見積登録済'` とし、`ORDER_REGISTRATION` がなく有効な `ESTIMATE` が1件以上あればRFQ・対象全申請を `見積DB登録済` とする。状態が変わる場合は両方の状態履歴を同一トランザクションで登録する
14. 対象依頼先が `request_status='SENT'` の場合は見積受領済みとして `REPLIED` に更新し、すでに `REPLIED` の場合は維持する

### deleteDisposalTaskTasksByDisposalTaskIdQuotationsByQuotationId

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること

#### 処理仕様

1. 対象見積を削除済み行を含めて取得し、対象廃棄タスクの `rfq_id` と作業対象施設に属することを確認する。対象が存在しない、別タスクに属する、または施設外の場合は404を返す
2. 対象見積が既に論理削除済みの場合はDBと状態を追加更新せず、見積原本のS3削除判定へ進む
3. 未削除の場合は、発注登録済み、採用済みロック、または `rfqs.status` が `発注済` / `納期確定` / `完了` の場合は削除不可とする
4. `quotations.deleted_at`、配下の `quotation_items.deleted_at`、`quotation_item_application_links.deleted_at`、見積原本の `application_documents.deleted_at` を論理削除する
5. 削除後の有効な見積構成を再判定する。有効な `ORDER_REGISTRATION` が1件あれば `rfqs.status='発注見積登録済'`、対象全 `applications.status='発注用見積登録済'` とする。`ORDER_REGISTRATION` がなく有効な `ESTIMATE` が1件以上あればRFQ・対象全申請を `見積DB登録済` とし、いずれもなければRFQ・対象全申請を `見積依頼済` とする。状態が変わる場合は両方の状態履歴を同一トランザクションで保存する
6. 見積原本の `application_documents.deleted_at` を含む論理削除をDBで先にコミットし、同じ `file_path` を参照する他の有効ドキュメントがなければ同じAPI内でS3を同期削除する。S3削除に失敗した場合は502を返し、同じDELETEの再送で再実行する

### getDisposalTaskTasksByDisposalTaskIdQuotationsByQuotationIdPreviewUrl

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること

#### 処理仕様

1. 対象見積が対象廃棄申請タスクに紐づき、`quotations.deleted_at IS NULL` であることを確認する
2. 見積原本に対応する `application_documents(owner_type='QUOTATION', quotation_id, step_code='QUOTATION')` を取得する
3. 短時間有効な認可済み `previewUrl` を生成して返す。S3オブジェクトキー、バケット名、直接URLは返さない。DBは更新しない

### postDisposalTaskTasksByDisposalTaskIdOrder

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること

#### 処理仕様

1. 対象廃棄タスクが `rfqs.status='発注見積登録済'` かつ対象全申請が `applications.status='発注用見積登録済'` の発注可能状態であることを確認する。別状態、完了済み、申請見送り済み、または論理削除済みの場合は409を返す
2. 対象廃棄タスクに有効な `quotation_phase='ORDER_REGISTRATION'` の見積と、その見積に属する有効な `quotation_items` がそれぞれ1件だけ存在することを確認し、サーバー側で自動採用する。クライアントから `quotationId` や見積明細は受け付けず、見積または明細が0件・複数件の場合は409 (`DISPOSAL_ORDER_QUOTATION_CONFLICT`) を返す
3. ファイル選択・発注書プレビューでは `orders` / `application_documents` を保存しない。STEP2の「メール送信」はPhase2向け表示のためPhase1では本APIを呼び出さず、画面の「発注登録」押下時にだけ後続処理を行う
4. `orders.order_no` はサーバーで採番し、リクエストの `orderNo` は受け付けない。`Idempotency-Key` の初回処理で確定した発注番号と発注日を `api_idempotency_records.response_body_json` の再開情報として保持し、業務未コミット後の同一要求再送でも同じ値を使用する
5. `orders` を作成し、自動採用した見積のサーバー生成済み集約明細から `order_items` を1件作成する。`quotation_item_id` に元見積明細ID、`registration_type='本体'` を保存し、品目・メーカー・型式・数量・単価・金額を見積明細から引き継ぐ。見積明細を持たない発注登録は許可しない
6. `orders.order_type='廃棄委託'`、`orders.settlement_no`、`orders.settlement_on`、`orders.status='ORDERED'`、`payment_terms`（未入力時 `未指定`）、`order_on`、見積合計金額を保存する。採用見積の `vendor_id`、`vendor_name`、`vendor_contact_person`、`vendor_email` は発注時点スナップショットとして保存する。廃棄グループとの整合は `orders.rfq_id` と `rfq_applications` で検証する
7. 発注書PDFを生成し、発注情報とともに保存する。外部送付は行わず、`orders.order_document_delivery_method`、`order_document_delivery_status`、`order_document_sent_at` はNULLとする
8. 発注書のメタデータは `application_documents.owner_type='RFQ'`、`rfq_id=disposalTaskId`、`order_id=orderId`、`step_code='ORDER'`、`document_category='ORDER'`、`document_type='注文書'`、`document_no=orders.order_no`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type='application/pdf'`、`file_size_bytes`、`content_hash`、`uploaded_by_user_id`、`uploaded_at` として、発注登録トランザクション内で保存する。`application_id`、`application_asset_id`、`quotation_id` はNULLとする。発注書の実体はAPIが生成し、画面からファイルをアップロードしない
9. 発注書は共通ファイル保存ルールに従い、冪等キーから生成した決定的な最終S3キーへ直接保存する。S3保存後のDB登録失敗、補償削除、コミット結果不明時の扱いも共通ルールに従う
10. `receptionUserId` を検証し、選択ユーザーから導出した現在の受付担当者情報を `rfqs` へ保存する
11. 発注登録成功時は `rfqs.status='発注済'`、対象全 `applications.status='発注済'` に更新し、`rfq_status_histories` と `application_status_histories` を登録する
12. `disposal_application_details.ordered_on`、`order_no`、業者スナップショットを保存する。受付担当者、発注、発注明細、発注書、状態、履歴は同一トランザクションで確定する

### postDisposalTaskTasksByDisposalTaskIdOrderPreview

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること

#### 処理仕様

1. 対象廃棄タスクが `rfqs.status='発注見積登録済'` かつ対象全申請が `applications.status='発注用見積登録済'` の発注書プレビュー可能状態であることを確認する
2. 対象廃棄タスクに有効な `quotation_phase='ORDER_REGISTRATION'` の見積と、その見積に属する有効な `quotation_items` がそれぞれ1件だけ存在することを確認し、サーバー側で自動採用する。クライアントから `quotationId` や見積明細は受け付けず、見積または明細が0件・複数件の場合は409を返す
3. リクエスト本文の未保存入力と、採用見積・サーバー生成済み集約明細を使用して発注書を都度生成する
4. 発注No.は仮表示または未表示とし、`orders`、`application_documents`、ステータス履歴、送付状態を更新しない
5. `Content-Type: application/pdf` のPDFバイナリを直接返す。業務DB、`application_documents`、Amazon S3は更新しない

### postDisposalTaskTasksByDisposalTaskIdDeliveryDate

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること

#### 処理仕様

1. 初回登録は対象廃棄タスクが `発注済` の場合だけ許可する。`納期確定` で保存済み `disposal_scheduled_on` と同じ日付かつ `receptionUserId` が保存済み受付担当者と一致する再送は、履歴を追加せず現在結果を200で返す。日付または担当者が異なる場合は409を返す。その他の状態も409とする
2. `disposal_application_details.disposal_scheduled_on` を更新し、グループ内の対象申請へ必要な廃棄予定日を反映する
3. `receptionUserId` を検証し、選択ユーザーから導出した現在の受付担当者情報を `rfqs` へ保存する
4. 受付担当者情報、`rfqs.status='納期確定'`、対象全 `applications.status='納期確定'`、`rfq_status_histories`、`application_status_histories` を同一トランザクションで登録する
5. 画面表示の `作業日確定` は保存値 `納期確定` から派生させる

### postDisposalTaskTasksByDisposalTaskIdDocuments

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること

#### 処理仕様

1. 対象廃棄タスクが存在し、完了後削除済みでないことを確認する
2. ファイル選択だけではDB保存せず、`payload.document` と `file` が揃った「ドキュメント登録」押下時にだけ後続処理を行う
3. 固定名 `file` パートが1件存在することを確認する。許可する組み合わせは `.pdf` / `application/pdf`、`.jpg` または `.jpeg` / `image/jpeg`、`.png` / `image/png` とし、拡張子、申告MIME Type、実ファイル形式が一致しない場合は400を返す
4. `documentType` はOpenAPIで定義した9種別のいずれかとする。`documentType='その他'` の場合は `otherDocumentName` を必須とし、`documentType='見積書（変更が発生した場合）'` の場合は `actualAmountExclTax` と `accountDivisionCode` を必須とする。`accountDivisionCode` はOpenAPIの `DisposalAccountDivisionCode` のいずれかとし、それ以外の種別では条件付き項目をNULLとして保存する
5. 廃棄完了書類は廃棄依頼グループ単位で保存し、`owner_type='RFQ'`、`rfq_id=disposalTaskId`、`application_id=NULL`、`application_asset_id=NULL`、`order_id=NULL`、`step_code='COMPLETE'`、`document_category='COMPLETE'` を設定する。`applicationId`、`ownerType`、`orderId` などの所有者指定はリクエストから受け付けない
6. 対象タスクが `rfqs.management_type='DISPOSAL'`、`workflow_type='RFQ'`、`rfqs.status='納期確定'` であることを確認する。完了済み・申請見送り済み・論理削除済みのタスクへの登録は拒否する
7. 完了書類のドキュメント種別は、`院内決済書類`、`見積書（変更が発生した場合）`、`産業廃棄物処理委託契約書`、`注文書`、`注文請書`、`廃棄物証明書（処分完了報告書）`、`産業廃棄物管理票（マニフェスト）`、`請求書`、`その他` のいずれかとする
8. ファイル本体は共通ファイル保存ルールに従い、冪等キーから生成した決定的な最終S3キーへ直接保存する
9. `application_documents` に `document_date`、`document_no`、`other_document_name`、`actual_amount_excl_tax`、`account_division_code`、`storage_format`、`title=NULL`、`file_name`、`file_path`、`mime_type`、`file_size_bytes`、API算出 `content_hash`、`uploaded_by_user_id`、`uploaded_at` を保存する
10. `application_documents.file_path` にはS3オブジェクトキーのみ保存し、S3バケット名やHTTPS URLはDBへ保存しない
11. S3保存後のDB登録失敗、補償削除、コミット結果不明時の扱いは共通ファイル保存・冪等再送ルールに従う

### deleteDisposalTaskTasksByDisposalTaskIdDocumentsByDocumentId

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること

#### 処理仕様

1. 対象ドキュメントを削除済み行を含めて取得し、`owner_type='RFQ'`、`rfq_id=disposalTaskId`、`application_id IS NULL`、`application_asset_id IS NULL`、`order_id IS NULL`、`step_code='COMPLETE'`、`document_category='COMPLETE'` であることを確認する。対象が存在しない、申請添付・見積書・発注書である、別タスクに属する、または施設外の場合は404を返す
2. 対象ドキュメントが未削除の場合だけ、対象タスクが完了前であることを確認して `application_documents.deleted_at` をDBでコミットする。既に論理削除済みの場合はDBを追加更新せず、S3削除判定へ進む
3. 同じ `file_path` を参照する他の有効ドキュメントがなければ同じAPI内でS3を同期削除する。S3削除に失敗した場合はDBの論理削除を維持して502を返し、同じDELETEの再送で再実行する

### getDisposalTaskTasksByDisposalTaskIdDocumentsByDocumentIdPreviewUrl

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること

#### 処理仕様

1. 対象ドキュメントが `owner_type='RFQ'`、`rfq_id=disposalTaskId`、`application_id IS NULL`、`application_asset_id IS NULL`、`order_id IS NULL`、`step_code='COMPLETE'`、`document_category='COMPLETE'` の完了書類であることを確認する。見積書・発注書のプレビューは各専用APIで扱う
2. 短時間有効な認可済み `previewUrl` を生成して返す。S3オブジェクトキー、バケット名、直接URLは返さず、DBも更新しない

### postDisposalTaskTasksByDisposalTaskIdComplete

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること

#### 処理仕様

1. 対象廃棄タスクが `納期確定` の完了登録可能状態であることを確認する。画面上はSTEP③の作業日登録後にSTEP④へ進むため、廃棄申請では `納期確定→完了` を許可する。既に完了済みで保存済みの完了条件と `receptionUserId` が一致する再送だけを同一操作として扱い、担当者が異なる再送は409を返す
2. 完了書類は事前に `POST /documents` の「ドキュメント登録」押下で、対象RFQに `owner_type='RFQ'`、`rfq_id=disposalTaskId`、`step_code='COMPLETE'`、`document_category='COMPLETE'` として保存済みであることを確認する。このAPIはファイルを受け取らず、完了登録時に追加アップロードを行わない
3. 不足確認の対象は `院内決済書類`、`見積書（変更が発生した場合）`、`産業廃棄物処理委託契約書`、`注文書`、`注文請書`、`廃棄物証明書（処分完了報告書）`、`産業廃棄物管理票（マニフェスト）`、`請求書` の固定8種類とし、`その他` は対象外とする。未登録種別がある場合、`confirmMissingDocuments=false` では409 (`REQUIRED_DOCUMENT_MISSING`) と不足種別を共通 `ErrorResponse.details` で返す。画面確認後に `true` で再送された場合は、未登録のまま完了を許可する
4. `disposal_application_details.accepted_on` は業務日付、`inspected_by_name` は認証ユーザー名をサーバー側で設定する。画面から任意の日付・担当者名は受け付けない
5. `receptionUserId` を検証し、選択ユーザーから導出した現在の受付担当者情報を `rfqs` へ保存する。`rfqs.status` を `完了`、対象全 `applications.status` を `完了` に更新し、`rfq_status_histories` と `application_status_histories` を登録する。登録済み資産の廃棄対象は `asset_ledgers.status='廃棄済'` へ更新し、`asset_ledger_histories` を登録する
6. 未登録資産は `asset_ledgers` を作成せず、申請および廃棄証跡のみで完了管理する
7. 受付担当者情報、申請・グループステータス更新、完了情報、資産台帳更新、履歴登録は同一トランザクションで処理する。リモデル起点か否か、リモデルクローズの実行有無にかかわらず、登録済み資産は `廃棄済` へ更新する
8. No.27の完了登録ではNo.24のリモデルクローズ処理を実行しない。No.24はクローズ要求時に `rfq_applications`、申請状態、資産台帳、原本登録状況をDBから再取得して判定するため、本APIはクローズ判定結果を受け渡さない

## 第6章 DBマッピング・業務ルール

### 移動承認の原本反映

- 移動承認は `applications`、`application_assets`、対象 `asset_ledgers`、`asset_ledger_histories`、`application_status_histories` を1トランザクションで更新する
- 移動先は申請時に保存済みの `application_assets.destination_*` と `transfer_application_details` を正本とし、承認APIで任意の移動先上書きは受け付けない
- 資産台帳更新後のステータス保存値は `完了` とし、画面表示では `移動完了` として返す

### 廃棄RFQの保存方針

- 本書の廃棄申請タスクは `rfqs.management_type='DISPOSAL'`、`workflow_type='RFQ'` として表す。`applications.application_type='DISPOSAL'` と `rfq_applications` の紐づきで廃棄申請を識別し、資産一覧起点とリモデル起点を同一モデルで扱う
- `rfqs.management_type='REMODEL'`、`workflow_type='DISPOSAL'` は新規廃棄タスクの検索・作成・更新条件に使用しない。旧データは移行方針に従って新モデルへ変換し、移行不能行は新APIへ混在させない
- `rfqs.status` はグループ全体の現在STEP・終端状態、`applications.status` はグループ内申請単位の業務状態とする。RFQ作成直後は `rfqs.status='見積依頼'`、`applications.status='新規申請'` とし、両方の更新と履歴登録を同一トランザクションで行う
- 廃棄依頼グループ作成時を初回受付の確定タイミングとし、選択された `receptionUserId` のユーザーID・氏名・所属部署・電話番号を `rfqs.reception_user_id`、`reception_person`、`reception_department`、`reception_contact` へ保存する。通常アカウントはログインユーザーを初期選択値とするが、保存値は確定操作時にリクエストされた担当者を正本とする
- `reception_person`、`reception_department`、`reception_contact` は `reception_user_id` と同じユーザーの表示用スナップショットとする。所属部署・電話番号が未設定の場合はNULLを許容する。`reception_confirmed_at` は初回受付確定日時として保持し、担当者変更時は更新しない
- STEP1見積依頼完了、STEP2発注登録、STEP3作業日/納期登録、STEP4完了登録、申請見送りでは、その操作で指定された `receptionUserId` から4項目を再導出して更新する。タスク取得・再アクセス・各種プレビュー・見積依頼先登録・見積登録・完了書類登録/削除では受付情報を更新しない
- 各STEPの操作ユーザーは受付担当者とは分離し、ステータス変更時は `rfq_status_histories.changed_by_user_id` / `application_status_histories.changed_by_user_id`、見積依頼先登録時は `rfq_vendors.requested_by_user_id` へ保存する
- 廃棄タスクの対象申請は `rfq_applications.application_id` と `application_asset_id` で追跡し、見積・発注・完了証跡は `rfq_id` 配下へ集約する
- 廃棄完了書類は `application_documents` の `owner_type='RFQ'`、`rfq_id`、`step_code='COMPLETE'`、`document_category='COMPLETE'` を正本とする。`application_id`、`application_asset_id`、`order_id` はNULLとし、完了書類の一覧・削除・プレビューは `rfq_id=disposalTaskId` でスコープする
- 複数申請を1タスクに束ねる場合、グループ操作の成功条件は対象全申請の更新成功とし、`rfqs.status` と紐づく全 `applications.status` を同一保存値へ遷移させる。部分更新を成功扱いにしない
- リモデル起点かどうかは `rfq_applications.edit_list_id` / `edit_list_item_id` で判定し、`rfqs.edit_list_id` や `management_type` だけでは判定しない
- `disposal_application_details.quotation_due_on` は最早回答期限、`disposal_scheduled_on` は作業日/廃棄予定日の正本とする。廃棄タスク一覧の期限列は現在ステータスに応じてこれらからAPIで算出し、`order_deadline_on` は使用・更新しない

### No.24 リモデル管理APIとの連携

- No.24の一覧・ダッシュボード・詳細は、通常リモデルRFQ（`REMODEL/RFQ`）に加え、`rfq_applications` からリモデル編集リストへ辿れる廃棄グループ（`DISPOSAL/RFQ`）を表示対象とする。`DISPOSAL/RFQ` を `REMODEL/RFQ` へ変換して表示してはならない
- No.24からNo.27へ遷移する際は、`rfqGroupId`（No.27では `disposalTaskId` と同一）、`managementType='DISPOSAL'`、`editListId`、戻り先を引き継ぐ。廃棄タスクの業者選定、見積、発注、作業日、完了登録はNo.27のAPIを呼び出す
- No.27の完了登録は、リモデル起点か否かにかかわらず資産台帳の対象資産を `廃棄済` に更新する
- No.24のリモデルクローズAPIは、実行時点の `rfq_applications`、申請状態、資産台帳、原本登録状況をDBから再取得してクローズ可否を判定する。資産を `廃棄済` に更新する処理はNo.27にだけ実装し、No.24へ重複実装しない。クローズ条件未達時は `REMODEL_CLOSE_NOT_READY` と不足対象の詳細を返す

### トランザクション・排他・既存データ移行

- 全POST/DELETE更新APIは対象データを作業対象施設のスコープ内で取得し、第3章の共通ロック順に従って悲観ロックする。ロック取得後の再検証で現在ステータスや所属が変わっている場合は409を返し、後勝ち上書きを行わない
- 初回受付情報の設定は廃棄依頼グループ作成トランザクション内で行い、後続の受付担当者変更は各STEP確定または終端操作と同一トランザクションで行う。`reception_user_id IS NULL` の既存進行中グループはGET時に自動補完せず、次回の確定操作で有効な `receptionUserId` の選択を必須とする。終端済みの既存グループは保存済みスナップショットを維持し、一括バックフィルしない
- グループ操作は `rfqs`、対象全 `applications`、対象 `application_assets`、関連する見積・発注・ドキュメントを必要範囲でロックし、ステータス、履歴、業務データを同一トランザクションで確定する。一部申請だけ更新された状態を成功扱いにしない
- 既存の `owner_type='APPLICATION'` 廃棄完了書類は、リリース前の移行処理で `rfq_applications` から対象RFQを一意に解決できる行だけRFQ所有へバックフィルする。解決不能行はエラー一覧へ出力して手動解決し、API実行時の旧方式フォールバックは設けない
- 発注重複は対象 `rfq_id` と採用見積の有効な `orders` をロックして検証し、重複時は409 (`ORDER_ALREADY_CREATED`) とする。発注書取得は `application_documents` を `rfq_id + order_id` で検索し、組み合わせ不一致は `ORDER_RFQ_MISMATCH` とする
- `management_type='REMODEL'`、`workflow_type='DISPOSAL'` の旧廃棄ワークフローは新APIの一覧・更新対象へ自動混入させない。リリース前に `DISPOSAL/RFQ` と共通廃棄ステータスへ移行し、移行不能行はエラー一覧と対象IDを記録して新APIから除外する
- 旧発注書の `application_documents.order_id` が未設定または `rfq_id + order_id` と不整合な行は、バックフィルまたはデータ修正が完了するまで新発注書の表示・登録対象から除外し、曖昧な `document_no` 検索を代替手段にしない

### 廃棄ドキュメントのS3保存方針

- 廃棄見積原本、発注書、完了報告書、廃棄証明書、マニフェスト、契約書、請求書等は、登録確定APIが決定的な最終S3キーへ直接PutObjectし、`application_documents.file_path` にはS3オブジェクトキーのみ保存する。発注書は登録API側で生成する
- ファイル選択・プレビュー・入力途中では業務DB保存を行わず、「見積書の登録」「ドキュメント登録」「発注登録」でのみ保存する
- `application_documents` の `owner_type` / `rfq_id` / `quotation_id` / `application_id` / `application_asset_id` / `rfq_vendor_id` / `asset_ledger_id` は所有者の正本キーとして保持し、S3オブジェクトキーへ業務上の所有者情報を過度に重複させない
- 画面表示やダウンロードでは `downloadUrl` を都度生成して返し、S3オブジェクトキー、S3バケット名、S3の直接URLはリクエスト/レスポンスで直接扱わない
- 見積・完了書類の論理削除後は、同じ `file_path` を参照する有効なドキュメントがない場合だけ同じDELETE API内でS3オブジェクトを同期削除する
- 申請見送り時も、同じ `file_path` を参照する有効なドキュメントがない場合だけ見積書等のS3オブジェクトを同期削除する。削除失敗時は見送り状態を維持して502を返し、同じ見送りAPIの再送でS3削除を再実行する

### 対象外・境界

| 論点 | 本書の扱い | 参照先 |
| --- | --- | --- |
| 資産一覧起点の移動/廃棄申請起票 | 本書では扱わない。起票後の受付以降を扱う | No.13 資産申請起票 API 設計書 |
| 棚卸しからの移動/廃棄申請作成 | 棚卸しAPIが申請を作成し、本書は承認・後続工程のみ扱う | 棚卸し API 設計書 |
| 修理不能からの未登録資産廃棄申請作成 | 修理管理APIが廃棄申請を作成し、本書は作成済み申請の受付以降を扱う | 修理管理 API 設計書 |
| 未登録資産の単独廃棄申請 | Phase1対象外。入口UI/APIを設けない | - |
| 旧廃棄管理URL | 業務APIを追加せず、画面ルートで `/quotation-data-box/transfer-management?tab=disposal` へ正規化する | - |

## 第7章 エラー設計

### 共通HTTPステータス

各APIが返すHTTPステータスとレスポンススキーマはOpenAPIを正本とする。本章では、業務ルールの実装に必要な代表エラーコードだけを補足する。

### 代表エラーコード

| コード | HTTP | 内容 |
| --- | --- | --- |
| VALIDATION_ERROR | 400 | 必須不足、形式不正、件数不正 |
| RECEPTION_ASSIGNEE_INVALID | 400 | `receptionUserId` が未指定、受付担当者候補に存在しない、無効・削除済み、施設割当または実効 `transfer_disposal` を満たさない |
| IDEMPOTENCY_KEY_REQUIRED | 400 | 対象登録APIで `Idempotency-Key` が指定されていない |
| UNAUTHORIZED | 401 | 認証トークン未付与または無効 |
| FORBIDDEN | 403 | 通常アカウントで、作業対象施設に対する実効 `transfer_disposal` がない。共有システム管理者アカウントは作業対象施設が存在し未削除であれば通常権限判定をバイパスする |
| APPLICATION_NOT_FOUND | 404 | 対象申請が存在しない、または作業対象施設に属さない |
| DISPOSAL_TASK_NOT_FOUND | 404 | 対象廃棄タスクが存在しない |
| INVALID_APPLICATION_TYPE | 409 | 対象申請が `TRANSFER` / `DISPOSAL` の期待種別ではない |
| UNREGISTERED_DISPOSAL_NOT_ALLOWED | 409 | 修理申請経由ではない未登録資産廃棄申請が含まれている |
| STATUS_TRANSITION_NOT_ALLOWED | 409 | 現在ステータスから要求された操作へ遷移できない |
| RFQ_ALREADY_CREATED | 409 | 廃棄申請が既にRFQグループへ接続済み |
| DISPOSAL_TASK_STATE_CONFLICT | 409 | 現在STEPでは要求された操作を実行できない |
| DISPOSAL_GROUP_ASSET_DUPLICATE | 409 | 対象資産が有効な別の廃棄依頼グループへ登録済み |
| QUOTATION_VENDOR_MISMATCH | 409 | 見積業者が対象RFQの有効な `SENT` / `REPLIED` 依頼先ではない |
| DISPOSAL_ORDER_QUOTATION_CONFLICT | 409 | 有効な発注登録用見積または発注時に引き継ぐ有効な見積明細が0件・複数件、または発注登録用見積の新規登録時に既存行があり一意に決まらない |
| ORDER_RFQ_MISMATCH | 409 | `order_id` と `rfq_id` の組み合わせが不一致 |
| ORDER_ALREADY_CREATED | 409 | 対象RFQ・見積に対する発注が既に作成済み |
| DOCUMENT_NOT_FOUND | 404 | 対象RFQの完了書類が存在しない、完了書類以外が指定された、他タスクに属する、または施設外 |
| REQUIRED_DOCUMENT_MISSING | 409 | 完了登録時点で固定8種類の確認対象書類に未登録があり、確認なしではタスク完了できない |
| INVALID_DOCUMENT_TYPE | 400 | 廃棄申請管理で許可されないドキュメント種別、または条件付き項目の組み合わせが指定された |
| INVALID_DOCUMENT_METADATA | 400 | その他ドキュメント名、変更見積の実績金額・勘定科目、保存形式などの入力が不正 |
| IDEMPOTENCY_KEY_REUSED | 409 | 同一スコープ・同一 `Idempotency-Key` が異なるリクエストで再利用された |
| IDEMPOTENCY_REQUEST_IN_PROGRESS | 409 | 同一スコープ・同一 `Idempotency-Key` の初回処理が進行中 |
| CONFLICT_UPDATED | 409 | 悲観ロック取得後の再検証で更新前提が変わっていた |
| DISPOSAL_FILE_502_S3_OPERATION_FAILED | 502 | 廃棄関連ドキュメントの最終S3キーへの保存、既存オブジェクト照合、補償削除、通常DELETE時または申請見送り時の同期削除を完了できない |
| DISPOSAL_DB_503_COMMIT_OUTCOME_UNKNOWN | 503 | DBコミット成否を確認できない。冪等記録とS3を保持し、同じキー・同じリクエストでの再送を要求する |

## 第8章 運用・監査方針

- 移動承認、廃棄RFQグループ作成、見積依頼、見積登録、発注登録、作業日登録、完了登録、見送りは監査対象とし、APIログに作業対象施設、実行ユーザー、申請ID、RFQ ID、更新前後ステータスを記録する。冪等対象の5 APIでは `Idempotency-Key` も記録する
- 添付ファイル本文、見積書本文、証明書本文はアプリケーションログへ出力しない
- S3オブジェクトキー、S3バケット名、認可済み `downloadUrl` は必要最小限の運用ログに限定し、利用者向けエラーメッセージや通常APIログへ直接出力しない
- 廃棄RFQグループ作成、見積依頼先登録、見積登録、発注登録、完了書類登録は `api_idempotency_records` を使用し、同一スコープ・同一キー・同一リクエストの再送では初回結果を返す
- 旧廃棄管理URLの正規化は画面ルーティング層で行い、業務APIログには正規化後の `/quotation-data-box/transfer-management` からのAPI呼び出しとして記録する
- 移動承認および廃棄完了の資産台帳更新は、申請ステータス更新と同一トランザクションで処理し、片側だけが成功した状態を禁止する
