# 保守契約管理 API内部設計

## 第1章 概要

### 本書の目的

本書は、資産一覧画面の保守契約登録導線、保守契約管理タブ、保守契約見積登録画面で利用する API の設計内容を整理し、画面要件、DB設計、点検管理APIとの責務境界を一致させることを目的とする。

保守契約は `applications` を作成しないドメイン管理とし、`maintenance_contracts` と `maintenance_contract_assets` を正本として、見積依頼、見積登録、契約登録、保守登録、完了後の契約内容見直し・契約更新までを1本のAPI設計書で扱う。

### 対象システム概要

保守契約管理は、資産一覧または保守契約管理タブから契約対象資産を選択して保守契約グループを作成し、業者への見積依頼、見積登録、契約情報・契約ドキュメント・明細登録を経て保守登録を完了する業務機能である。

保守契約管理タブには契約終了日を過ぎていない契約のみ表示し、契約終了済みレコードは一覧から除外する。完了レコードの詳細モーダルは閲覧専用とし、契約内容見直しは完了かつ契約終了日を過ぎていない場合のみ、契約更新は一覧に表示される完了レコードから実行する。

### 用語定義

| 用語 | 説明 |
| --- | --- |
| 保守契約グループ | `maintenance_contracts` の1レコード。複数の契約対象資産、見積依頼、見積、契約情報を束ねる |
| 契約対象資産 | `maintenance_contract_assets` の1レコード。保守契約グループに属する資産単位のメーカー保守情報・契約単価を保持する |
| 発注登録用見積 | 契約登録で採用できる見積。`quotation_phase='発注登録用見積'` として保存する |
| 参考見積 | 見積DB登録までで参照目的に利用する見積。契約登録時の採用見積にはできない |
| 保守登録 | STEP③で契約情報、ドキュメント、明細登録が揃った時点で `maintenance_contracts.status='完了'` へ進める操作 |
| 契約内容見直し | 完了かつ契約終了日を過ぎていない保守契約に対し、既存資産の除外と新規資産追加、見直し後金額、理由を履歴登録し、必要に応じて契約変更ドキュメントを添付する操作 |
| 契約更新 | 完了レコードを再オープンせず、契約グループ名を元契約名に「（更新）」を付けて自動生成し、契約種別・種別備考と対象資産を引き継いだ後継の保守契約グループを作成する操作 |

### 対象画面

| 画面名 | 画面パス | 利用目的 |
| --- | --- | --- |
| 資産一覧画面 保守契約登録導線 | /asset-search-result | 選択資産を初期対象として保守契約グループを作成する |
| 保守契約管理タブ | /quotation-data-box/maintenance-contracts | 保守契約一覧、期限表示、詳細閲覧、契約内容見直し、契約更新を行う |
| 保守契約見積登録画面 | /maintenance-quote-registration | 見積依頼、見積登録、契約登録、保守登録を3ステップで進行する |

## 第2章 システム全体構成

### API の位置づけ

本API群は、保守契約管理の契約グループ作成から完了後運用までを一貫して扱う。資産一覧は保守契約作成の入口にすぎず、作成される正本データは保守契約ドメインの `maintenance_contracts` / `maintenance_contract_assets` である。

点検管理への連携は保守登録時に `maintenance_contract_assets` のメーカー保守条件を入力として、メーカー保守の `inspection_tasks` を作成または更新する。院内定期点検、院内スポット点検、日常点検は保守契約管理から作成しない。点検実施、日程調整、メーカー保守結果登録は No.30 点検管理APIの責務とする。

### 画面と API の関係

| 画面操作 | API | 補足 |
| --- | --- | --- |
| 保守契約管理タブ初期表示 | `GET /quotation-data-box/maintenance-contracts/tasks` | 進行中契約と完了契約のうち契約終了日が未設定または業務日以降の契約を取得し、保守契約No.（画面上の申請No.）昇順で表示する |
| 資産一覧または保守契約管理タブから契約グループ作成 | `POST /quotation-data-box/maintenance-contracts` | `maintenance_contracts.status='見積依頼'` と契約対象資産を作成する |
| 見積依頼先登録 | `POST /quotation-data-box/maintenance-contracts/{maintenanceContractId}/quote-request` | 保守契約RFQと依頼先を登録・更新する |
| 依頼送信 | `POST /quotation-data-box/maintenance-contracts/{maintenanceContractId}/quote-request/vendors/{rfqVendorId}/send` | 依頼先単位で送信済みにする |
| 見積依頼完了 | `POST /quotation-data-box/maintenance-contracts/{maintenanceContractId}/quote-request/complete` | 送信済み依頼先が1件以上ある場合に `見積依頼済` へ進める |
| 申請見送り | `POST /quotation-data-box/maintenance-contracts/{maintenanceContractId}/cancel` | STEP①の保守契約を `申請見送り` へ終端化する |
| 保守契約見積登録画面表示 | `GET /maintenance-quote-registration/contracts/{maintenanceContractId}` | 3ステップ画面のヘッダ、資産、RFQ、見積、文書を取得する |
| 見積依頼書PDFプレビュー/印刷 | `POST /maintenance-quote-registration/contracts/{maintenanceContractId}/quote-request/preview` | 画面入力内容と対象資産情報から見積依頼書PDFを都度生成する。PDFは保存しない |
| 明細登録 | `PUT /maintenance-quote-registration/contracts/{maintenanceContractId}/assets` | 対象資産別のメーカー保守情報、契約単価、追加資産を保存する。保証期間は扱わない |
| 見積登録 | `POST /maintenance-quote-registration/contracts/{maintenanceContractId}/quotations` | 発注登録用見積または参考見積を登録する |
| 見積PDFプレビュー | `GET /maintenance-quote-registration/contracts/{maintenanceContractId}/quotations/{quotationId}/preview-url` | 登録済み見積一覧で選択された見積PDFの認可済みプレビューURLを払い出す |
| 見積登録完了 | `POST /maintenance-quote-registration/contracts/{maintenanceContractId}/quotations/complete` | 発注登録用見積が1件以上ある場合に `見積登録済` へ進める |
| 見積削除 | `DELETE /maintenance-quote-registration/contracts/{maintenanceContractId}/quotations/{quotationId}` | 保守登録前かつ採用前の見積を論理削除する |
| 契約登録保存 | `PUT /maintenance-quote-registration/contracts/{maintenanceContractId}/contract-registration` | 採用見積、決済No.、契約期間、契約種別などを保存する |
| 契約ドキュメント登録/削除 | `POST /maintenance-quote-registration/contracts/{maintenanceContractId}/documents` / `DELETE /maintenance-quote-registration/contracts/{maintenanceContractId}/documents/{documentId}` | 契約書、その他契約補助資料などのメタデータを管理する |
| 契約ドキュメントPDFプレビュー | `GET /maintenance-quote-registration/contracts/{maintenanceContractId}/documents/{documentId}/preview-url` | 登録済みドキュメント一覧で選択された契約書/その他PDFの認可済みプレビューURLを払い出す |
| 保守登録 | `POST /maintenance-quote-registration/contracts/{maintenanceContractId}/complete` | 必須条件を検証し、`完了` へ進め、点検管理へ連携する |
| 契約内容見直し | `POST /quotation-data-box/maintenance-contracts/{maintenanceContractId}/content-review` | 完了契約の資産除外・資産追加・金額変更履歴を登録する |
| 契約更新 | `POST /quotation-data-box/maintenance-contracts/{maintenanceContractId}/renewal` | 元契約を参照する後継契約を `見積依頼` で作成する |

### 使用テーブル

| テーブル名 | 利用種別 | 用途 |
| --- | --- | --- |
| `asset_ledgers` | READ | 保守契約対象資産の施設スコープ、部署情報、商品情報、QR表示情報の取得 |
| `qr_codes` | READ | 保守契約対象資産の代表QR識別子取得 |
| `maintenance_contracts` | CREATE / READ / UPDATE | 保守契約ヘッダー、ステータス、契約情報、契約更新元、契約金額の正本 |
| `maintenance_contract_assets` | CREATE / READ / UPDATE | 契約対象資産、資産別メーカー保守情報、契約単価、期中除外フラグの正本。保証期間は保持しない |
| `maintenance_contract_status_definitions` | READ | 保守契約ステータス許容値、初期状態、終端状態の確認 |
| `maintenance_contract_status_transitions` | READ | 保守契約ステータス遷移可否の確認 |
| `maintenance_contract_reviews` | CREATE / READ | 契約内容見直し履歴、変更前後金額、理由、登録者の保存 |
| `maintenance_contract_review_assets` | CREATE / READ | 契約内容見直し時の追加資産・除外資産の履歴保存 |
| `rfqs` | CREATE / READ / UPDATE | 保守契約RFQヘッダー。`management_type='MAINTENANCE'` |
| `rfq_vendors` | CREATE / READ / UPDATE | 見積依頼先、依頼送信状態、担当者、連絡先 |
| `quotations` | CREATE / READ / UPDATE / DELETE | 発注登録用見積、参考見積、採用見積、削除状態 |
| `application_documents` | CREATE / READ / UPDATE / DELETE | 見積書、契約書、その他、および契約内容見直しで任意添付された契約変更文書のファイルメタデータ。ファイル実体はAmazon S3に保存し、`file_path` にはS3オブジェクトキーのみを保持する。見積依頼書PDFは都度生成のため保存しない |
| `inspection_tasks` | CREATE / READ / UPDATE | 保守登録時の点検管理連携先。保守契約由来はメーカー保守タスクのみ作成または更新する |
| `inspection_task_status_definitions` / `inspection_task_status_transitions` | READ | 保守契約由来点検タスク作成時の初期ステータス・遷移制約確認 |
| `vendors` | READ | 見積依頼先、見積業者、契約業者の存在確認とスナップショット生成 |
| `users` | READ | STEP①受付部署情報の補完、登録者、送信者、見直し登録者の表示名取得、共有システム管理者アカウント判定 |
| `facilities` | READ | Bearer トークン上の作業対象施設の存在確認、未削除確認 |
| `user_facility_assignments` | READ | 通常アカウントにおける作業対象施設への有効担当施設割当確認 |
| `facility_feature_settings` | READ | 通常アカウントにおける施設提供機能 `maintenance_contract` の有効化確認 |
| `user_facility_feature_settings` | READ | 通常アカウントにおけるユーザー施設別 `maintenance_contract` の有効化確認 |

## 第3章 共通仕様

### API 共通仕様

- 通信方式: HTTPS
- データ形式: JSON（ファイル実体を受け取るPOST APIは multipart/form-data を使用し、`payload` に業務データとファイルメタデータ、`files` にファイル本体を指定する）
- 文字コード: UTF-8
- 日時形式: ISO 8601（例: `2026-05-27T10:00:00+09:00`）
- 日付形式: `YYYY-MM-DD`
- 認証済みAPIは Bearer トークンを `Authorization` ヘッダーに付与する
- 各APIは Bearer トークン上の作業対象施設を基準に自施設データのみ処理する
- 更新系APIは現在ステータスを再取得して遷移可否を検証し、条件を満たさない場合は 409 を返す

### ファイル保存ルール

- STEP①の見積依頼書PDFは、プレビュー/印刷時に画面入力内容、受付部署、対象資産情報から都度生成し、Amazon S3および `application_documents` へ保存しない
- STEP②見積原本、STEP③契約書/その他ドキュメント、および契約内容見直しで任意添付された契約変更文書のファイル実体は、対象APIが multipart/form-data の `files` パートとして受け取り、API内でAmazon S3へPutObjectする
- 保守契約管理APIでアップロードする文書はPDFのみ許可し、拡張子 `.pdf`、MIMEタイプ `application/pdf`、1ファイルあたり50MB（52,428,800 bytes）以下を必須とする。PDF以外は 400 (`MAINTENANCE_CONTRACT_FILE_INVALID_TYPE`)、50MB超過時は 400 (`MAINTENANCE_CONTRACT_FILE_SIZE_EXCEEDED`) を返す
- `application_documents.file_path` にはS3オブジェクトキーのみ保存し、S3バケット名、S3の直接URL、認可なしで利用できるURLはDBへ保存しない
- 詳細取得、登録直後レスポンス、一覧レスポンスではS3オブジェクトキー、S3バケット名、S3の直接URL、認可済みプレビューURLを返さない。右ペイン表示時は選択された見積または契約ドキュメントに対して個別のプレビューURL取得APIを呼び出す
- 右ペインの印刷アイコンは、現在表示中のPDFをブラウザ印刷する。PDF未選択の一覧表示中や契約情報サマリー表示中は印刷不可とし、印刷専用APIと印刷履歴保存は設けない
- Amazon S3保存後にDBメタデータ保存または業務トランザクションへ失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄する。破棄に失敗した場合は 502 (`MAINTENANCE_CONTRACT_FILE_502_S3_WRITE_FAILED`) を返却し、再試行可能な運用ログを残す
- `storageFormat` は保存先ではなく、電子取引/スキャナ保存/未指定などの保存形式区分を表す列として扱い、S3保存有無の表現には使用しない
- 削除APIは `application_documents.deleted_at` の論理削除を正本とし、S3実体は同一S3オブジェクトキーを参照する有効メタデータがなくなったことと保存期間を確認するS3ライフサイクルまたは後続クリーンアップで扱う

### 認証・認可

本API群で使用する `feature_code` は `maintenance_contract` とする。資産一覧の保守契約登録導線、保守契約管理タブ、保守契約見積登録画面の全操作で同じ実効権限を判定する。画面表示用の `/auth/context` はUX用キャッシュであり、各業務APIでも同条件を再判定する。通常アカウントでは作業対象施設への有効担当施設割当、施設提供機能、ユーザー施設別機能設定を確認する。共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）では、作業対象施設が未削除であることを確認できれば、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする。

| 処理 | 必要 feature_code | 判定テーブル | 説明 |
| --- | --- | --- | --- |
| 保守契約API全般 | `maintenance_contract` | `users`, `facilities`, `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings` | 通常アカウントは担当施設割当と実効 `maintenance_contract` を確認する。共有システム管理者アカウントは作業対象施設が未削除であれば通常権限判定をバイパスする |

### 作業対象施設ベースの認可例外

- 各APIは Bearer トークン上の作業対象施設が存在し、未削除であることを確認する
- 通常アカウントでは、作業対象施設に対する有効担当施設割当と実効 `maintenance_contract` を都度再判定する
- 共有システム管理者アカウントでは、作業対象施設が未削除であれば通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による認可判定をバイパスする
- 対象資産の作業対象施設所属、保守契約グループの対象資産所属、`rfqs.management_type='MAINTENANCE'`、保守契約ステータス遷移順序、送信済み依頼先有無、発注登録用見積、契約ドキュメント、契約対象資産明細、契約内容見直し/契約更新条件、点検管理連携時の競合確認といった業務制約は共有システム管理者でもバイパスしない
- 通常アカウントで作業対象施設に対して必要な実効 `maintenance_contract` がない場合は403を返す
- 作業対象施設が存在しない、または削除済みの場合は404を返す

### 施設スコープ

- 対象資産は `asset_ledgers.facility_id` が作業対象施設と一致することを必須とする
- 一覧取得は `maintenance_contract_assets.asset_ledger_id` から参照する `asset_ledgers.facility_id` が作業対象施設と一致する契約のみ返す
- 同一契約に複数資産がある場合も、作業対象施設外の資産を含む契約は登録・更新不可とする
- 他施設の `maintenanceContractId`、`assetLedgerId`、`quotationId`、`documentId` が指定された場合は 404 とし、存在有無を返さない

### 保守契約ステータス

| ステータス | 意味 |
| --- | --- |
| 見積依頼 | 初期状態。保守契約グループ作成後、業者登録・見積依頼書PDFプレビュー・送信を行う。見積依頼書PDFは保存しない |
| 見積依頼済 | 少なくとも1社へ見積依頼送信済み。見積書登録へ進める |
| 見積登録済 | 発注登録用見積が1件以上登録済み。契約登録・明細登録・ドキュメント登録へ進める |
| 完了 | 保守登録済み。契約終了日を過ぎていない場合のみ保守契約管理タブ一覧に表示し、詳細閲覧、契約更新、契約内容見直しが可能 |
| 申請見送り | 見積依頼工程で見送り確定した終端状態。通常一覧から除外する |

### データライフサイクル

| 状態 | 作成/更新契機 | 主な保存値 | 次の遷移 |
| --- | --- | --- | --- |
| 契約グループ作成前 | 資産一覧または保守契約管理タブで対象資産を選択 | 保存なし | 契約グループ作成で `見積依頼` へ |
| 見積依頼 | 契約グループ作成 | `maintenance_contracts.status='見積依頼'`, `maintenance_contract_assets` | 業者登録・依頼送信後、見積依頼完了で `見積依頼済` |
| 申請見送り | STEP①で申請を見送る | `maintenance_contracts.status='申請見送り'`。RFQ作成済みの場合は `rfqs.status='申請を見送る'` | 終端。通常一覧から除外 |
| 見積依頼済 | 送信済み依頼先が1件以上ある状態で見積依頼完了 | `rfq_vendors.request_status='SENT'`, `maintenance_contracts.status='見積依頼済'` | 発注登録用見積登録後、見積登録完了で `見積登録済` |
| 見積登録済 | 発注登録用見積が1件以上ある状態で見積登録完了 | `quotations.quotation_phase='発注登録用見積'`, `maintenance_contracts.status='見積登録済'` | 契約情報・ドキュメント・明細登録後、保守登録で `完了` |
| 完了 | 保守登録 | 採用見積、契約期間、契約金額、契約書、対象資産明細、点検管理連携結果 | 契約終了日を過ぎていない場合は契約内容見直しまたは契約更新。ステータスは原則維持 |
| 契約内容見直し済み | 契約終了日を過ぎていない完了契約に契約内容見直し登録 | `maintenance_contract_reviews`, `maintenance_contract_review_assets`, `maintenance_contracts.contract_amount_excl_tax` 更新。添付がある場合は `application_documents` を作成 | 契約は `完了` のまま継続 |
| 契約更新後継作成済み | 完了契約から契約更新 | 後継 `maintenance_contracts.renewal_source_maintenance_contract_id` | 後継契約を `見積依頼` から進行 |

### 一覧表示・期限表示ルール

- `GET /quotation-data-box/maintenance-contracts/tasks` は、`見積依頼` / `見積依頼済` / `見積登録済` と `完了` のうち、`contract_end_on IS NULL OR contract_end_on >= 業務日` の契約を返す
- 契約終了日を過ぎたレコードと `申請見送り` は一覧から除外する
- 本APIでは検索・ステータス・契約種別・期限切れ表示切替用のクエリパラメータを定義しない
- 既定並び順は保守契約No.（画面上の申請No.）昇順とし、同一の場合は `maintenance_contract_id ASC` とする
- `availableActions` は `見積依頼` で `QUOTE_REQUEST` / `CANCEL_APPLICATION` / `DETAIL`、`見積依頼済` で `REGISTER_QUOTATION` / `DETAIL`、`見積登録済` で `REGISTER_CONTRACT` / `DETAIL`、`完了` で `CONTENT_REVIEW` / `RENEWAL` / `DETAIL` を返す
- 期限表示は契約終了日を基準とし、6ヶ月以内は `契約期間終了 Nヶ月前` として返す
- 期限列は契約終了日を基準に `N日前` として返す。契約終了日を過ぎたレコードは一覧対象外のため `N日超過` は返さない

### 契約更新・契約内容見直しルール

- 契約更新は完了かつ契約終了日を過ぎていない契約のみ許可する。元契約を再オープンせず、契約グループ名を元契約名に「（更新）」を付けて自動生成し、契約種別・種別備考を引き継いだ後継契約を新規作成する
- 契約更新では元契約の未除外資産と同じ `asset_ledger_id` を後継契約へ引き継ぐ。部署情報・商品情報は `asset_ledgers` から再取得し、見積依頼先、登録済み見積、採用見積、契約業者、契約金額、契約期間、契約書、点検情報、契約単価は複製しない
- 契約内容見直しは完了かつ契約終了日を過ぎていない契約のみ許可する
- 契約内容見直しは除外対象または追加対象のいずれか1件以上を必須とする
- 契約内容見直しの契約変更文書は任意とし、添付がある場合のみ `application_documents` を作成する
- 除外対象は既存 `maintenance_contract_assets.excluded_flag=true` に更新し、追加対象は同一契約の `maintenance_contract_assets` に新規作成する
- 同一契約内に同一 `asset_ledger_id` を重複登録してはならない
- 契約内容見直し後も `maintenance_contracts.status` は `完了` のまま維持する

### 点検管理連携ルール

- 保守登録時、対象資産明細に `inspection_type='メーカー保守'` が設定されている場合のみ `inspection_tasks` を作成または更新する
- `inspection_type='メーカー保守'` は日程未定登録を許可し、`next_inspection_on=NULL`、初期 `status='点検日調整'` とする
- 院内定期点検、院内スポット点検、日常点検は保守契約管理から作成しない
- 保証期間は保持せず、点検予定日算出にも使用しない
- `excluded_flag=true` の契約対象資産は点検管理連携対象から除外する
- 別契約由来で同一資産の有効なメーカー保守タスクが存在する場合は競合として扱い、保守登録を中断する

### 共通エラーレスポンス

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| code | string | ✓ | エラーコード |
| message | string | ✓ | 利用者向けエラーメッセージ |
| details | string[] | - | 入力エラーや競合理由の補足 |
| currentStatus | string | - | 競合時のサーバー最新ステータス |

### 共通DTO

#### MaintenanceContractTaskSummary

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| maintenanceContractId | int64 | ✓ | `maintenance_contracts.maintenance_contract_id` |
| maintenanceContractNo | string | ✓ | 保守契約No.。画面上の申請No.列に表示する場合もこの値を返す |
| contractGroupName | string | ✓ | 契約グループ名 |
| maintenanceType | string | ✓ | 保守契約/定期点検/スポット契約/借用契約/その他 |
| maintenanceTypeNote | string | - | 種別備考 |
| contractedOn | date | - | 契約日 |
| contractStartOn | date | - | 契約開始日 |
| contractEndOn | date | - | 契約終了日 |
| contractReviewStartOn | date | - | 契約検討開始日 |
| vendorName | string | - | 契約業者名。完了前は null |
| vendorContactPerson | string | - | 契約業者担当者名 |
| vendorEmail | string | - | 契約業者メール |
| vendorPhone | string | - | 契約業者連絡先 |
| contractAmountExclTax | decimal | - | 契約金額(税抜) |
| annualAmountExclTax | decimal | - | 単年度金額(税抜) |
| status | string | ✓ | `maintenance_contracts.status` |
| dueStatus | string | ✓ | `NONE` / `CONTRACT_ENDING_SOON` |
| dueLabel | string | - | 画面表示用期限ラベル。例: `契約期間終了 3ヶ月前`、`30日前` |
| assetCount | int32 | ✓ | 有効な契約対象資産数。`excluded_flag=false` の件数 |
| comment | string | - | フリーコメント |
| availableActions | string[] | ✓ | `QUOTE_REQUEST` / `CANCEL_APPLICATION` / `REGISTER_QUOTATION` / `REGISTER_CONTRACT` / `CONTENT_REVIEW` / `RENEWAL` / `DETAIL` |

#### MaintenanceContractAssetDetail

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| maintenanceContractAssetId | int64 | - | `maintenance_contract_assets.maintenance_contract_asset_id`。新規追加時は null |
| assetLedgerId | int64 | ✓ | `asset_ledgers.asset_ledger_id` |
| qrCodeValue | string | - | 代表QR識別子 |
| departmentName | string | - | 設置部署または管理部署表示 |
| sectionName | string | - | 設置部門表示 |
| itemName | string | ✓ | 品目名 |
| makerName | string | - | メーカー名 |
| modelName | string | - | 型式 |
| inspectionGroupName | string | - | 点検グループ名 |
| inspectionType | string | - | `メーカー保守`。未設定可。院内定期点検・院内スポット点検・日常点検は保守契約管理では扱わない |
| inspectionCycleMonths | int32 | - | メーカー保守の点検周期（月） |
| inspectionCountPerYear | int32 | - | 年間点検回数 |
| partsExemptionFlag | boolean | - | 部品免責有無 |
| partsExemptionText | string | - | 部品免責条件 |
| exemptionAmount | decimal | - | 免責金額 |
| onCallSupport | boolean | - | オンコール対応 |
| remoteMaintenanceAvailable | boolean | - | リモート対応 |
| legalInspectionFlag | boolean | - | 法定点検フラグ |
| legalInspectionBasis | string | - | 法定点検根拠 |
| contractUnitPriceExclTax | decimal | - | 契約単価。個別入力は任意 |
| excludedFlag | boolean | ✓ | 契約内容見直しで期中除外された場合 true |
| remarks | string | - | 備考 |

#### MaintenanceQuotationSummary

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| quotationId | int64 | ✓ | `quotations.quotation_id` |
| quotationNo | string | ✓ | 見積番号 |
| quotationPhase | string | ✓ | `発注登録用見積` / `参考見積` |
| quotationOn | date | ✓ | 見積日。入力省略時は業務日 |
| storageFormat | string | ✓ | 見積原本の `application_documents.storage_format`。`電子取引` / `スキャナ保存` / `未指定` |
| vendorId | int64 | - | 業者マスタID |
| vendorName | string | ✓ | 見積業者名 |
| totalAmountExclTax | decimal | - | 見積金額(税抜) |
| annualAmountExclTax | decimal | - | 単年度金額(税抜) |
| accountDivisionCode | string | - | 会計区分コード |
| status | string | ✓ | `DRAFT` / `REGISTERED` / `ORDER_SELECTED` |
| document | DocumentSummary | - | 見積原本メタデータ |

#### RfqVendorSummary

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| rfqVendorId | int64 | ✓ | `rfq_vendors.rfq_vendor_id` |
| vendorId | int64 | - | 業者マスタID |
| vendorName | string | ✓ | 依頼先業者名 |
| contactPerson | string | - | 担当者名 |
| email | string | - | メールアドレス |
| phone | string | - | 連絡先 |
| requestStatus | string | ✓ | `DRAFT` / `SENT` / `CANCELED` |
| requestedAt | datetime | - | 送信日時 |
| requestedByName | string | - | 送信者名 |

#### MaintenanceRfqSummary

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| rfqId | int64 | ✓ | `rfqs.rfq_id` |
| rfqNo | string | ✓ | 見積依頼No. |
| status | string | ✓ | `見積依頼` / `見積依頼済` / `見積DB登録済` / `申請を見送る` |
| vendorRequestComment | string | - | ご依頼事項。`rfqs.remarks` から返す |

#### MaintenanceContractHeader

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| maintenanceContractId | int64 | ✓ | `maintenance_contracts.maintenance_contract_id` |
| maintenanceContractNo | string | ✓ | 保守契約No. |
| contractGroupName | string | ✓ | 契約グループ名 |
| renewalSourceMaintenanceContractId | int64 | - | 契約更新元の保守契約ID |
| rfqId | int64 | - | 保守契約RFQ ID |
| settlementNo | string | - | 決済No. |
| maintenanceType | string | ✓ | 契約種別 |
| maintenanceTypeNote | string | - | 種別備考 |
| contractedOn | date | - | 契約日 |
| contractStartOn | date | - | 契約開始日 |
| contractEndOn | date | - | 契約終了日 |
| contractReviewStartOn | date | - | 契約検討開始日 |
| vendorId | int64 | - | 契約業者ID |
| vendorName | string | - | 契約業者名 |
| vendorContactPerson | string | - | 契約業者担当者名 |
| vendorEmail | string | - | 契約業者メール |
| vendorPhone | string | - | 契約業者連絡先 |
| receptionDepartmentName | string | - | 受付部署名。見積依頼タスク開始時の `users.section_name` スナップショット |
| receptionPersonName | string | - | 受付担当者名。見積依頼タスク開始時の `users.name` スナップショット |
| receptionContact | string | - | 受付連絡先。見積依頼タスク開始時の `users.phone_number` スナップショット |
| contractAmountExclTax | decimal | - | 契約金額(税抜) |
| annualAmountExclTax | decimal | - | 単年度金額(税抜) |
| status | string | ✓ | `maintenance_contracts.status` |
| comment | string | - | コメント |

#### DocumentInput

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| documentCategory | string | ✓ | `QUOTATION` / `CONTRACT` / `CONTRACT_REVIEW` |
| documentType | string | ✓ | 見積書 / 契約書 / その他 / 契約変更覚書 |
| fileName | string | ✓ | ファイル名 |
| contentType | string | - | `application/pdf` 固定。`application_documents.mime_type` に保存するMIMEタイプ |
| fileSize | int64 | - | `application_documents.file_size_bytes` に保存するファイルサイズ |
| filePartName | string | ✓ | multipart/form-data 内のファイルパート名。ファイル実体とメタデータを対応付ける |
| contentHash | string | - | 改ざん検知・重複確認用ハッシュ。指定時はアップロード実体と照合し `application_documents.content_hash` に保存する |
| title | string | - | 文書タイトル |
| documentDate | date | - | 文書日付 |
| storageFormat | string | - | `電子取引` / `スキャナ保存` / `未指定`。保存先ではなく電帳法等の保存形式区分を表す |
| accountType | string | - | 会計区分 |
| accountOtherText | string | - | 会計区分その他 |

#### DocumentSummary

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| documentId | int64 | ✓ | `application_documents.application_document_id` |
| ownerType | string | ✓ | `RFQ` / `QUOTATION` / `MAINTENANCE_CONTRACT_REVIEW` |
| documentCategory | string | ✓ | `QUOTATION` / `CONTRACT` / `CONTRACT_REVIEW` |
| documentType | string | ✓ | 見積書 / 契約書 / その他 / 契約変更覚書 |
| fileName | string | ✓ | ファイル名 |
| contentType | string | - | `application/pdf`。`application_documents.mime_type` に保存するMIMEタイプ |
| fileSize | int64 | - | `application_documents.file_size_bytes` に保存するファイルサイズ |
| uploadedAt | datetime | ✓ | 登録日時 |
| uploadedByName | string | - | 登録者名 |

#### QuoteRequestPreviewInput

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| vendorRequestComment | string | - | ご依頼事項。未保存の画面入力値を指定し、PDFへ反映する |
| vendors | QuoteRequestVendorInput[] | - | 依頼先業者。未保存の画面入力値を指定し、PDFへ反映する |

#### PdfPreviewUrlResponse

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| documentId | int64 | ✓ | `application_documents.application_document_id` |
| fileName | string | ✓ | 表示対象PDFのファイル名 |
| contentType | string | ✓ | `application/pdf` |
| fileSize | int64 | ✓ | `application_documents.file_size_bytes` |
| previewUrl | string | ✓ | S3オブジェクトキーからAPI側で発行する認可済みプレビューURL。S3オブジェクトキー、S3バケット名、S3直接URLは返却しない |
| expiresAt | datetime | ✓ | プレビューURLの有効期限 |

## 第4章 API 一覧

| No | API名 | Method | Path | 用途 | 権限 |
| --- | --- | --- | --- | --- | --- |
| 1 | 保守契約タスク一覧取得 | GET | /quotation-data-box/maintenance-contracts/tasks | 保守契約管理タブ一覧を取得する | `maintenance_contract` |
| 2 | 保守契約グループ作成 | POST | /quotation-data-box/maintenance-contracts | 資産一覧または保守契約管理タブから契約グループを作成する | `maintenance_contract` |
| 3 | 見積依頼先登録 | POST | /quotation-data-box/maintenance-contracts/{maintenanceContractId}/quote-request | 保守契約RFQと依頼先を登録・更新する | `maintenance_contract` |
| 4 | 見積依頼送信 | POST | /quotation-data-box/maintenance-contracts/{maintenanceContractId}/quote-request/vendors/{rfqVendorId}/send | 依頼先単位で送信済みにする | `maintenance_contract` |
| 5 | 見積依頼完了 | POST | /quotation-data-box/maintenance-contracts/{maintenanceContractId}/quote-request/complete | `見積依頼済` へ進める | `maintenance_contract` |
| 6 | 申請見送り | POST | /quotation-data-box/maintenance-contracts/{maintenanceContractId}/cancel | STEP①で保守契約を申請見送りにする | `maintenance_contract` |
| 7 | 保守契約詳細取得 | GET | /maintenance-quote-registration/contracts/{maintenanceContractId} | 保守契約見積登録画面の詳細を取得する | `maintenance_contract` |
| 8 | 見積依頼書PDFプレビュー生成 | POST | /maintenance-quote-registration/contracts/{maintenanceContractId}/quote-request/preview | 画面入力内容と対象資産情報から見積依頼書PDFを都度生成する | `maintenance_contract` |
| 9 | 契約対象資産明細登録 | PUT | /maintenance-quote-registration/contracts/{maintenanceContractId}/assets | 資産別メーカー保守情報、契約単価、追加資産を保存する | `maintenance_contract` |
| 10 | 見積登録 | POST | /maintenance-quote-registration/contracts/{maintenanceContractId}/quotations | 発注登録用見積または参考見積PDFを登録する | `maintenance_contract` |
| 11 | 見積PDFプレビューURL取得 | GET | /maintenance-quote-registration/contracts/{maintenanceContractId}/quotations/{quotationId}/preview-url | 選択された見積PDFの認可済みプレビューURLを払い出す | `maintenance_contract` |
| 12 | 見積登録完了 | POST | /maintenance-quote-registration/contracts/{maintenanceContractId}/quotations/complete | `見積登録済` へ進める | `maintenance_contract` |
| 13 | 見積削除 | DELETE | /maintenance-quote-registration/contracts/{maintenanceContractId}/quotations/{quotationId} | 保守登録前の見積を論理削除する | `maintenance_contract` |
| 14 | 契約登録保存 | PUT | /maintenance-quote-registration/contracts/{maintenanceContractId}/contract-registration | 契約情報と採用見積を保存する | `maintenance_contract` |
| 15 | 契約ドキュメント登録 | POST | /maintenance-quote-registration/contracts/{maintenanceContractId}/documents | 契約書などのPDF文書メタデータを登録する | `maintenance_contract` |
| 16 | 契約ドキュメントPDFプレビューURL取得 | GET | /maintenance-quote-registration/contracts/{maintenanceContractId}/documents/{documentId}/preview-url | 選択された契約書/その他PDFの認可済みプレビューURLを払い出す | `maintenance_contract` |
| 17 | 契約ドキュメント削除 | DELETE | /maintenance-quote-registration/contracts/{maintenanceContractId}/documents/{documentId} | 保守登録前の契約ドキュメントを論理削除する | `maintenance_contract` |
| 18 | 保守登録完了 | POST | /maintenance-quote-registration/contracts/{maintenanceContractId}/complete | 必須条件を検証し `完了` へ進め、点検管理へ連携する | `maintenance_contract` |
| 19 | 契約内容見直し登録 | POST | /quotation-data-box/maintenance-contracts/{maintenanceContractId}/content-review | 完了契約の追加/除外・金額変更履歴を登録する | `maintenance_contract` |
| 20 | 契約更新作成 | POST | /quotation-data-box/maintenance-contracts/{maintenanceContractId}/renewal | 完了契約から後継契約を作成する | `maintenance_contract` |

## 第5章 機能設計

### getQuotationDataBoxMaintenanceContractsTasks

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `maintenance_contracts` を `maintenance_contract_assets`、`asset_ledgers`、`qr_codes` と結合し、作業対象施設の契約のみ取得する
3. `見積依頼` / `見積依頼済` / `見積登録済` と `完了` のうち、`contract_end_on IS NULL OR contract_end_on >= 業務日` の契約を返す
4. 契約終了日を過ぎたレコードと `申請見送り` は一覧対象外とする
5. 検索・ステータス・契約種別・期限切れ表示切替用のクエリパラメータは定義しない
6. 期限表示は契約終了日を基準に算出する
7. 既定並び順は `maintenance_contract_no ASC`、`maintenance_contract_id ASC` とする

### postQuotationDataBoxMaintenanceContracts

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象資産が1件以上指定されていることを検証する
3. 全対象資産が作業対象施設に属し、削除済みでないことを検証する
4. 同一リクエスト内の `assetLedgerIds` 重複を拒否する
5. `maintenance_contract_no` を採番し、`maintenance_contracts` を `status='見積依頼'`、`contract_review_start_on=入力値`、`remote_maintenance_available=false`、`on_call_support=false`、`last_status_changed_at=現在日時` で作成する
6. 対象資産ごとに `maintenance_contract_assets` を `excluded_flag=false` で作成する
7. 複数資産登録は全件成功または全件失敗とし、部分登録は行わない
8. `applications` と `rfq_applications` は作成しない

### postQuotationDataBoxMaintenanceContractsByMaintenanceContractIdQuoteRequest

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象契約が `見積依頼` であることを確認する
3. `rfqs.management_type='MAINTENANCE'`、`workflow_type='RFQ'`、`status='見積依頼'`、`requested_on=業務日`、`created_by_user_id=ログインユーザー`、`last_status_changed_at=現在日時` のRFQを作成または取得し、`maintenance_contracts.rfq_id` に設定する
4. STEP①の受付部署名、受付担当者名、受付連絡先はリクエスト本文では受け取らず、認証コンテキストのログインユーザー情報から補完する
5. `maintenance_contracts.reception_department_name` 未保存時のみ `users.section_name`、`reception_person_name` 未保存時のみ `users.name`、`reception_contact` 未保存時のみ `users.phone_number` を保存する。保存済みの受付部署スナップショットは再保存時に上書きしない
6. ご依頼事項は `rfqs.remarks` に保存し、作成/更新する依頼先の `rfq_vendors.request_note` にも反映する
7. 依頼先は `rfq_vendors` に作成または更新し、未送信行は `request_status='DRAFT'` とする
8. 既に `SENT` の依頼先は送信履歴保持のため削除せず、更新対象外とする

### postQuotationDataBoxMaintenanceContractsByMaintenanceContractIdQuoteRequestVendorsByRfqVendorIdSend

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象契約が `見積依頼` であることを確認する
3. 対象 `rfq_vendors` が契約の `rfq_id` に属し、`request_status` が `DRAFT` または未送信相当であることを確認する
4. 本APIでは見積依頼書PDFや送付文書ファイルを受け取らず、`application_documents` へ保存しない
5. `rfq_vendors.request_status='SENT'`、`requested_at=現在日時`、`requested_by_user_id=ログインユーザー` を更新する

### postQuotationDataBoxMaintenanceContractsByMaintenanceContractIdQuoteRequestComplete

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象契約が `見積依頼` であることを確認する
3. `rfq_vendors.request_status='SENT'` の依頼先が1件以上存在することを確認する
4. `maintenance_contracts.status='見積依頼済'`、`maintenance_contracts.last_status_changed_at=現在日時`、`rfqs.status='見積依頼済'`、`rfqs.last_status_changed_at=現在日時` を同一トランザクションで更新する

### postQuotationDataBoxMaintenanceContractsByMaintenanceContractIdCancel

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象契約が `見積依頼` であることを確認する
3. RFQ作成済みの場合は `rfqs.status='申請を見送る'`、`rfqs.last_status_changed_at=現在日時` へ更新する
4. 未送信の `rfq_vendors.request_status='DRAFT'` は `CANCELED` へ更新する
5. 送信済みの `rfq_vendors.request_status='SENT'` は送信履歴として保持する
6. `maintenance_contracts.status='申請見送り'`、`maintenance_contracts.last_status_changed_at=現在日時` を同一トランザクションで更新する
7. 申請見送り契約は監査目的で保持し、通常一覧から除外する

### getMaintenanceQuoteRegistrationContractsByMaintenanceContractId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象契約が作業対象施設に属することを確認する
3. `maintenance_contracts.status` から画面ステップを算出する
4. STEP①の受付部署表示は `maintenance_contracts` の保存済み受付部署情報を返す。未保存の場合は認証コンテキストのログインユーザー情報（`users.section_name` / `users.name` / `users.phone_number`）から表示用初期値を補完して返す
5. 対象資産は `excluded_flag` を含めて返し、明細登録画面では除外済み行を履歴として表示できるようにする
6. 見積、契約書、契約補助資料の登録済み一覧は `application_documents` から取得する。見積依頼書PDFは保存しないため `application_documents` から取得しない
7. 登録済み見積と登録済みドキュメントはメタデータのみ返し、S3オブジェクトキー、S3直接URL、認可済みプレビューURLは返さない。右ペインで表示する場合は個別のプレビューURL取得APIを呼び出す

### postMaintenanceQuoteRegistrationContractsByMaintenanceContractIdQuoteRequestPreview

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象契約が作業対象施設に属することを確認する
3. 対象契約ヘッダー、契約対象資産、受付部署情報を取得する。受付部署情報が未保存の場合は認証コンテキストのログインユーザー情報から表示用初期値を補完する
4. リクエストされた `vendorRequestComment` と `vendors` はPDF生成にのみ利用し、`rfqs`、`rfq_vendors`、`maintenance_contracts`、`application_documents` は更新しない
5. PDFは `application/pdf` としてレスポンスボディに返し、Amazon S3およびDBへ保存しない
6. 右ペインの印刷アイコンは、このAPIで表示中のPDFをブラウザ印刷する

### putMaintenanceQuoteRegistrationContractsByMaintenanceContractIdAssets

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象契約が `見積登録済` であることを確認する
3. 指定資産が作業対象施設に属することを確認する
4. 同一契約内に同一 `assetLedgerId` が重複しないことを検証する
5. 既存 `maintenanceContractAssetId` は更新し、新規 `assetLedgerId` は `maintenance_contract_assets` に追加する
6. `inspectionType` は未設定または `メーカー保守` のみ許可する。院内定期点検、院内スポット点検、日常点検は本APIでは受け付けない
7. 保証期間はリクエスト項目として受け付けず、`maintenance_contract_assets` に保存しない
8. 明細登録自体は保守登録の前提として必須だが、点検情報・契約単価の個別入力は任意とする

### postMaintenanceQuoteRegistrationContractsByMaintenanceContractIdQuotations

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象契約が `見積依頼済` または `見積登録済` であることを確認する
3. `payload.document.filePartName` が multipart のファイルパートに存在することを確認する
4. 見積原本はPDFのみ許可する。拡張子 `.pdf`、MIMEタイプ `application/pdf`、1ファイルあたり50MB（52,428,800 bytes）以下を必須とし、PDF以外は 400 (`MAINTENANCE_CONTRACT_FILE_INVALID_TYPE`)、50MB超過は 400 (`MAINTENANCE_CONTRACT_FILE_SIZE_EXCEEDED`) とする
5. `payload.document.fileSize` が指定されている場合はファイル実体のサイズと一致することを確認し、保存時は実体サイズを `application_documents.file_size_bytes` に保存する。`contentHash` 指定時はアップロード実体と照合する
6. `quotation_no` を採番し、`quotation_on` は入力値または業務日で `quotations` を作成する。`rfq_id` は保守契約RFQに紐づける。`payload.storageFormat` は見積原本メタデータの `application_documents.storage_format` に保存する
7. 見積原本PDF本体をAPI内でAmazon S3へPutObjectし、S3オブジェクトキーは `application-documents/facility-{facilityId}/{yyyy}/{mm}/{uploadUuid}.pdf` 形式で発行する。keyは保存場所識別子であり、`maintenanceContractId` や `quotationId` などの業務IDを含めない
8. 見積原本は `application_documents.owner_type='QUOTATION'`、`quotation_id=作成した見積ID`、`document_category='QUOTATION'`、`document_type`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`storage_format=payload.storageFormat`、`uploaded_by_user_id`、`uploaded_at` として保存する。S3バケット名やHTTPS URLはDBへ保存しない
9. 登録レスポンスでは見積PDFのプレビューURLを返さない。右ペイン表示時は `GET /maintenance-quote-registration/contracts/{maintenanceContractId}/quotations/{quotationId}/preview-url` を呼び出す
10. Amazon S3保存後に見積作成または文書メタデータ保存へ失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄する。破棄に失敗した場合は 502 (`MAINTENANCE_CONTRACT_FILE_502_S3_WRITE_FAILED`) を返却し、再試行可能な運用ログを残す
11. 参考見積は登録できるが、契約登録時の採用見積にはできない

### getMaintenanceQuoteRegistrationContractsByMaintenanceContractIdQuotationsByQuotationIdPreviewUrl

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象契約が作業対象施設に属することを確認する
3. 対象見積が契約の保守契約RFQに紐づき、`quotations.deleted_at IS NULL` であることを確認する
4. 対象見積の `application_documents.owner_type='QUOTATION'`、`document_category='QUOTATION'`、`mime_type='application/pdf'`、`deleted_at IS NULL` のPDFメタデータを取得する
5. S3オブジェクトキー、S3バケット名、S3直接URLはレスポンスに含めず、短時間有効な認可済み `previewUrl` を発行する
6. 右ペインの印刷アイコンは、このURLで表示中のPDFをブラウザ印刷する。URL払い出し時に印刷履歴は作成しない

### postMaintenanceQuoteRegistrationContractsByMaintenanceContractIdQuotationsComplete

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象契約が `見積依頼済` または `見積登録済` であることを確認する
3. 未削除の `quotation_phase='発注登録用見積'` が1件以上あることを確認する
4. `maintenance_contracts.status='見積登録済'`、`maintenance_contracts.last_status_changed_at=現在日時`、`rfqs.status='見積DB登録済'`、`rfqs.last_status_changed_at=現在日時` を同一トランザクションで更新する

### deleteMaintenanceQuoteRegistrationContractsByMaintenanceContractIdQuotationsByQuotationId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象契約が `完了` ではないことを確認する
3. 対象見積が契約の保守契約RFQに属することを確認する
4. `quotations.status='ORDER_SELECTED'` の採用済み見積は削除不可とする
5. `quotations.deleted_at` と対象見積所有の `application_documents.deleted_at` を更新する
6. 論理削除後の見積は登録済み見積一覧とプレビューURL取得対象から外す。削除済み見積に対するプレビューURL取得は 404 とする
7. S3実体は即時DeleteObjectせず、同一S3オブジェクトキーを参照する有効メタデータがなくなったことと保存期間を確認するS3ライフサイクルまたは後続クリーンアップで扱う

### putMaintenanceQuoteRegistrationContractsByMaintenanceContractIdContractRegistration

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象契約が `見積登録済` であることを確認する
3. 契約終了日が契約開始日以降であることを検証する
4. 採用見積が未削除かつ `quotation_phase='発注登録用見積'` であることを確認する
5. 採用見積を `quotations.status='ORDER_SELECTED'` に更新し、他見積は採用解除する
6. 採用見積の業者、担当、メール、連絡先、金額、単年度金額を `maintenance_contracts` へ契約時点スナップショットとして転記する

### postMaintenanceQuoteRegistrationContractsByMaintenanceContractIdDocuments

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象契約が `見積登録済` であることを確認する
3. STEP③画面のドキュメント種別は `契約書` / `その他（免責部品一覧など）` の2択のみとし、細分種別選択は設けない
4. `契約書` は `documentCategory='CONTRACT'`、`documentType='契約書'` として保存する
5. `その他（免責部品一覧など）` も契約関連ドキュメントとして扱い、`documentCategory='CONTRACT'`、`documentType='その他'` として保存する
6. `payload.documents[].filePartName` が multipart のファイルパートに存在することを確認する
7. 契約関連ドキュメントはPDFのみ許可する。拡張子 `.pdf`、MIMEタイプ `application/pdf`、1ファイルあたり50MB（52,428,800 bytes）以下を必須とし、PDF以外は 400 (`MAINTENANCE_CONTRACT_FILE_INVALID_TYPE`)、50MB超過は 400 (`MAINTENANCE_CONTRACT_FILE_SIZE_EXCEEDED`) とする
8. `payload.documents[].fileSize` が指定されている場合はファイル実体のサイズと一致することを確認し、保存時は実体サイズを `application_documents.file_size_bytes` に保存する。`contentHash` 指定時はアップロード実体と照合する
9. 各PDFファイル本体をAPI内でAmazon S3へPutObjectし、S3オブジェクトキーは `application-documents/facility-{facilityId}/{yyyy}/{mm}/{uploadUuid}.pdf` 形式で発行する。keyは保存場所識別子であり、`maintenanceContractId` などの業務IDを含めない
10. 各文書を `application_documents.owner_type='RFQ'`、`rfq_id=契約のRFQ ID`、`document_category='CONTRACT'`、`document_type`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`storage_format`、`uploaded_by_user_id`、`uploaded_at` として保存する。S3バケット名やHTTPS URLはDBへ保存しない
11. 登録レスポンスでは契約ドキュメントPDFのプレビューURLを返さない。右ペイン表示時は `GET /maintenance-quote-registration/contracts/{maintenanceContractId}/documents/{documentId}/preview-url` を呼び出す
12. Amazon S3保存後に文書メタデータ保存または業務トランザクションへ失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄する。破棄に失敗した場合は 502 (`MAINTENANCE_CONTRACT_FILE_502_S3_WRITE_FAILED`) を返却し、再試行可能な運用ログを残す

### getMaintenanceQuoteRegistrationContractsByMaintenanceContractIdDocumentsByDocumentIdPreviewUrl

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象契約が作業対象施設に属することを確認する
3. 対象ドキュメントが契約の保守契約RFQに属する `owner_type='RFQ'`、`document_category='CONTRACT'`、`document_type in ('契約書', 'その他')`、`mime_type='application/pdf'`、`deleted_at IS NULL` のPDFであることを確認する
4. S3オブジェクトキー、S3バケット名、S3直接URLはレスポンスに含めず、短時間有効な認可済み `previewUrl` を発行する
5. 右ペインの印刷アイコンは、このURLで表示中のPDFをブラウザ印刷する。URL払い出し時に印刷履歴は作成しない

### deleteMaintenanceQuoteRegistrationContractsByMaintenanceContractIdDocumentsByDocumentId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象契約が `完了` ではないことを確認する
3. 対象ドキュメントが契約の保守契約RFQに属する `owner_type='RFQ'` の文書であることを確認する
4. `application_documents.deleted_at` を更新する
5. 論理削除後のドキュメントは登録済みドキュメント一覧とプレビューURL取得対象から外す。削除済みドキュメントに対するプレビューURL取得は 404 とする
6. S3実体は即時DeleteObjectせず、同一S3オブジェクトキーを参照する有効メタデータがなくなったことと保存期間を確認するS3ライフサイクルまたは後続クリーンアップで扱う

### postMaintenanceQuoteRegistrationContractsByMaintenanceContractIdComplete

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象契約が `見積登録済` であることを確認する
3. 採用見積が存在することを確認する
4. 契約開始日・契約終了日が入力済みであることを確認する
5. `excluded_flag=false` の明細登録済み対象資産が1件以上あることを確認する
6. `application_documents.owner_type='RFQ'` かつ `document_category='CONTRACT'` かつ `document_type in ('契約書', 'その他')` の契約書または契約補助資料が1件以上あることを確認する
7. `inspection_type='メーカー保守'` が設定された対象資産について、同一契約由来のメーカー保守タスクを `inspection_tasks` に作成または更新する。院内定期点検、院内スポット点検、日常点検は作成しない
8. 作成または更新するメーカー保守タスクは `next_inspection_on=NULL`、初期 `status='点検日調整'` とする。保証期間や契約開始日から初回予定日は算出しない
9. 別契約由来で同一資産の有効なメーカー保守タスクがある場合は競合として扱い、保守登録を中断する
10. `maintenance_contracts.status='完了'`、`maintenance_contracts.last_status_changed_at=現在日時` を更新する

### postQuotationDataBoxMaintenanceContractsByMaintenanceContractIdContentReview

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象契約が `完了` かつ `contract_end_on >= 業務日` であることを確認する
3. 除外対象または追加対象のいずれか1件以上が指定されていることを確認する
4. 除外対象が対象契約に属し、まだ `excluded_flag=false` であることを確認する
5. `payload.removeMaintenanceContractAssetIds` と `payload.addAssetLedgerIds` の各配列内に重複がないことを確認する
6. 追加対象資産が作業対象施設に属し、`excluded_flag` にかかわらず同一契約内に同じ `asset_ledger_id` が存在しないことを確認する
7. `review_no` を採番し、`maintenance_contract_reviews.review_type='CONTENT_REVIEW'`、変更前金額、見直し後金額、理由、`reviewed_by_user_id=ログインユーザー`、`reviewed_at=現在日時` を保存する
8. 除外対象は `maintenance_contract_assets.excluded_flag=true` に更新する
9. 追加対象は `maintenance_contract_assets` に `excluded_flag=false` で新規作成する
10. 追加/除外の履歴を `maintenance_contract_review_assets` に作成する
11. `payload.documents` と `files` は両方省略できる。添付する場合は両方を指定し、文書メタデータとファイル本体を `filePartName` で1対1に対応させる。片方のみ指定した場合は400を返す
12. 添付がある場合のみ、`payload.documents[].documentCategory` は `CONTRACT_REVIEW`、`documentType` は `契約変更覚書` / `その他` を許可する
13. 添付がある場合のみ、`payload.documents[].filePartName` が multipart のファイルパートに存在することを確認し、拡張子 `.pdf`、MIMEタイプ `application/pdf`、1ファイル50MB以下、`contentHash` を検証する
14. 添付がある場合のみ契約変更文書ファイル本体をAPI内でAmazon S3へPutObjectし、S3オブジェクトキーは `application-documents/facility-{facilityId}/{yyyy}/{mm}/{uploadUuid}.pdf` 形式で発行する。keyは保存場所識別子であり、`maintenanceContractId` や `maintenanceContractReviewId` などの業務IDを含めない
15. 添付がある場合のみ、契約変更文書を `application_documents.owner_type='MAINTENANCE_CONTRACT_REVIEW'`、`maintenance_contract_review_id=作成した見直しID`、`document_category='CONTRACT_REVIEW'`、`document_type`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`storage_format`、`uploaded_by_user_id`、`uploaded_at` として保存する。S3バケット名やHTTPS URLはDBへ保存しない
16. 添付がある場合、Amazon S3保存後に見直し履歴、資産追加/除外、金額更新、文書メタデータ保存のいずれかへ失敗したときは、保存済みS3オブジェクトをDeleteObjectで破棄する。破棄に失敗した場合は 502 (`MAINTENANCE_CONTRACT_FILE_502_S3_WRITE_FAILED`) を返却し、再試行可能な運用ログを残す
17. `maintenance_contracts.contract_amount_excl_tax` を見直し後金額へ更新し、ステータスは `完了` のまま維持する

### postQuotationDataBoxMaintenanceContractsByMaintenanceContractIdRenewal

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 更新元契約が `完了` かつ `contract_end_on >= 業務日` であることを確認する
3. 更新元契約を再オープンせず、`maintenance_contract_no` を採番して新しい `maintenance_contracts` を `contract_group_name=更新元契約名 + '（更新）'`、`maintenance_type=更新元値`、`maintenance_type_note=更新元値`、`status='見積依頼'`、`remote_maintenance_available=false`、`on_call_support=false`、`last_status_changed_at=現在日時` で作成する
4. 新契約の `renewal_source_maintenance_contract_id` に更新元契約IDを保持する
5. 契約検討開始日、コメント、受付部署、決済No.、契約日、契約業者、契約金額、契約期間は引き継がず、後継契約では未設定とする
6. 見積依頼先、登録済み見積、採用見積、契約業者、契約金額、契約期間、契約書・添付ドキュメント、点検情報、契約単価は複製しない
7. 更新元契約の `excluded_flag=true` の対象資産は複製対象から除外する
8. 更新元契約の未除外資産と同じ `asset_ledger_id` で後継契約の `maintenance_contract_assets` を `excluded_flag=false` として作成する。部署情報・商品情報は `asset_ledgers` から再取得し、点検情報と契約単価は初期化する

## 第6章 権限・業務ルール

### 権限対応表

| 対象操作 | 対象API | 必要権限 | 業務条件 |
| --- | --- | --- | --- |
| 一覧表示・詳細閲覧 | GET系API | `maintenance_contract` | 通常アカウントは作業対象施設に有効なユーザー割当があり、施設提供設定とユーザー施設別設定の双方で保守契約管理が有効。共有システム管理者アカウントは作業対象施設が未削除であれば通常権限判定をバイパスする |
| 契約グループ作成 | POST /quotation-data-box/maintenance-contracts | `maintenance_contract` | 対象資産が作業対象施設に属し、対象資産が1件以上指定されている |
| 見積依頼・見積登録・契約登録 | /maintenance-quote-registration 配下の更新系API | `maintenance_contract` | 保守契約ステータスが各工程の期待状態と一致する |
| 申請見送り | POST /quotation-data-box/maintenance-contracts/{maintenanceContractId}/cancel | `maintenance_contract` | 対象契約が `見積依頼` であり、後続工程に進行していない |
| 契約内容見直し | POST /quotation-data-box/maintenance-contracts/{maintenanceContractId}/content-review | `maintenance_contract` | 対象契約が `完了` かつ契約終了日を過ぎていない |
| 契約更新 | POST /quotation-data-box/maintenance-contracts/{maintenanceContractId}/renewal | `maintenance_contract` | 更新元契約が `完了` かつ契約終了日を過ぎておらず、複製対象の未除外資産が1件以上存在する |

### ステータス遷移ルール

| 遷移元 | 遷移先 | 契機 | 補足 |
| --- | --- | --- | --- |
| なし | 見積依頼 | 契約グループ作成 / 契約更新 | `maintenance_contract_status_definitions.is_initial_status=true` の状態として作成する |
| 見積依頼 | 見積依頼済 | 見積依頼完了 | 送信済み依頼先が1件以上必要 |
| 見積依頼済 | 見積登録済 | 見積登録完了 | 発注登録用見積が1件以上必要 |
| 見積登録済 | 完了 | 保守登録 | 採用見積、契約期間、明細、契約ドキュメントが揃っていること |
| 見積依頼 | 申請見送り | 申請見送り | 通常一覧から除外する終端状態 |

### 業務ルール

- 保守契約は `applications` を作成せず、`maintenance_contracts` と `maintenance_contract_assets` を正本にする
- 同一契約グループ内で同一 `asset_ledger_id` を重複登録してはならない
- 契約内容見直しは契約ステータスを変えず、追加/除外履歴と見直し後金額を保持する
- 契約更新は元契約を再オープンせず、契約グループ名を元契約名に「（更新）」を付けて自動生成し、契約種別・種別備考を引き継いだ後継契約を `見積依頼` で作成する
- 契約更新では元契約の未除外資産と同じ `asset_ledger_id` を引き継ぐ。部署情報・商品情報は `asset_ledgers` から再取得し、見積、契約業者、契約金額、契約期間、文書、点検情報、契約単価は複製しない
- 保守登録時の点検管理連携はメーカー保守のみを対象とし、同一契約由来の `inspection_tasks` を作成または更新する。別契約由来の有効な同一資産メーカー保守タスクがある場合は競合とする
- 保守契約管理では院内定期点検、院内スポット点検、日常点検を作成しない。保証期間は `maintenance_contract_assets` に保持せず、点検予定日算出にも使用しない
- 見積依頼書PDFは保存せず、右ペイン表示または印刷時に都度生成する
- 登録済み見積PDFと契約ドキュメントPDFのプレビューURLは、詳細取得や登録レスポンスでは返さず、選択時の個別APIで払い出す

### 削除・取消制約

- 見積削除は保守登録前かつ採用前のみ許可し、物理削除せず `quotations.deleted_at` と対象見積所有の `application_documents.deleted_at` を設定する。削除後は登録済み見積一覧とプレビューURL取得対象から外し、S3実体はS3ライフサイクルまたは後続クリーンアップで扱う
- 契約ドキュメント削除は完了前のみ許可し、物理削除せず `application_documents.deleted_at` を設定する。削除後は登録済みドキュメント一覧とプレビューURL取得対象から外し、S3実体はS3ライフサイクルまたは後続クリーンアップで扱う
- 申請見送りは `見積依頼` のみ許可し、RFQ作成済みの場合はRFQも `申請を見送る` へ終端化する
- 完了済み契約は前工程へ戻さず、契約内容見直しまたは契約更新で後続運用する

### 未確定事項

本書時点で、API実装判断を止める未確定事項はない。

## 第7章 エラーコード一覧

| エラーコード | HTTPステータス | 内容 | 発生条件 |
| --- | --- | --- | --- |
| AUTH_401_UNAUTHORIZED | 401 | 認証情報が存在しない、または無効 | Bearer トークン未指定、期限切れ、署名不正 |
| AUTH_403_MAINTENANCE_CONTRACT_DENIED | 403 | 通常アカウントで作業対象施設に対する実効 `maintenance_contract` がない | 共有システム管理者アカウントでは作業対象施設が未削除であれば通常権限判定をバイパスする |
| FACILITY_NOT_FOUND | 404 | 作業対象施設が存在しない、または削除済み | Bearer トークン上の作業対象施設を参照できない |
| MAINTENANCE_CONTRACT_NOT_FOUND | 404 | 保守契約を参照できない | ID不存在、施設不一致、削除済み、または権限外 |
| MAINTENANCE_CONTRACT_ASSET_NOT_FOUND | 404 | 契約対象資産を参照できない | 対象資産ID不存在、施設不一致、または契約に属さない |
| MAINTENANCE_CONTRACT_ASSET_DUPLICATE | 409 | 同一契約内に同じ資産が重複している | 新規作成、明細登録、契約内容見直し追加で重複 |
| MAINTENANCE_CONTRACT_STATUS_CONFLICT | 409 | 現在ステータスが操作条件を満たさない | ステータス遷移不一致、完了済みに対する前工程更新など |
| MAINTENANCE_QUOTE_REQUEST_NOT_SENT | 409 | 見積依頼完了条件を満たさない | 送信済み依頼先が0件 |
| MAINTENANCE_CONTRACT_CANCEL_BLOCKED | 409 | 申請見送り条件を満たさない | 見積依頼以外、または後続工程へ進行済み |
| MAINTENANCE_ORDER_QUOTATION_REQUIRED | 409 | 発注登録用見積が未登録 | 見積登録完了または保守登録時に発注登録用見積がない |
| MAINTENANCE_CONTRACT_DOCUMENT_REQUIRED | 409 | 契約書または契約補助資料が未登録 | 保守登録時に契約ドキュメントが0件 |
| MAINTENANCE_CONTRACT_ASSET_DETAIL_REQUIRED | 409 | 明細登録済み対象資産が存在しない | 保守登録時に有効な対象資産が0件 |
| MAINTENANCE_CONTRACT_REVIEW_TARGET_REQUIRED | 400 | 契約内容見直し対象が未指定 | 除外対象と追加対象がどちらも0件 |
| MAINTENANCE_CONTRACT_EXPIRED | 409 | 契約期間終了済みのため操作できない | 契約内容見直しまたは契約更新を期限切れ契約に実行 |
| MAINTENANCE_CONTRACT_FILE_INVALID_TYPE | 400 | 許可されていないファイル形式 | PDF以外、または拡張子とMIMEタイプが不一致 |
| MAINTENANCE_CONTRACT_FILE_SIZE_EXCEEDED | 400 | ファイルサイズ上限超過 | 1ファイルあたり 50MB（52,428,800 bytes）を超過 |
| MAINTENANCE_CONTRACT_FILE_502_S3_WRITE_FAILED | 502 | ファイル保存または保存後ロールバックに失敗 | Amazon S3 PutObject 失敗、またはDB保存失敗後のS3 DeleteObject 失敗 |
| VALIDATION_ERROR | 400 | 入力値不正 | 必須不足、列挙値不正、文字数超過、日付前後関係不正 |
| INTERNAL_SERVER_ERROR | 500 | サーバー内部エラー | 想定外例外 |

## 第8章 運用・保守方針

### 監査・履歴

- 契約ステータス更新時は `maintenance_contracts.last_status_changed_at` を同一トランザクションで更新する
- 見積依頼送信者は `rfq_vendors.requested_by_user_id` に保持する
- 契約内容見直しの登録者は `maintenance_contract_reviews.reviewed_by_user_id` に保持する
- 契約書、見積書、および契約内容見直しで任意添付された契約変更文書のメタデータは `application_documents` に一元保存し、`file_path` にはAmazon S3のS3オブジェクトキーのみを保持する。S3バケット名、HTTPS URL、認可済みプレビューURLは保持しない
- 見積依頼書PDFは都度生成であり、`application_documents` への保存、印刷履歴、出力ファイル保存は行わない
- 見積削除、契約ドキュメント削除は物理削除せず `deleted_at` を設定し、S3実体は同一S3オブジェクトキーを参照する有効メタデータがなくなったことと保存期間を確認するS3ライフサイクルまたは後続クリーンアップで扱う

### 排他制御

- ステータス遷移を伴うAPIは更新前に現在ステータスを検証し、期待状態と異なる場合は 409 を返す
- 同一契約内の同一資産重複はDB一意制約とアプリケーション検証の両方で禁止する
- 保守登録時の点検管理連携は、契約完了更新と点検タスク作成・更新を同一トランザクションで扱う
- 契約内容見直しは、見直し履歴、資産追加/除外、契約金額更新、および添付がある場合の文書登録を同一トランザクションで扱う

### 対象外

- 契約終了後の過去Document専用閲覧画面は本API設計書では独立定義しない。契約終了済みレコードは保守契約管理タブ一覧から除外する
- 点検実施、点検結果登録、メーカー保守結果登録は No.30 点検管理APIの責務とする
- 購入・移動・廃棄の申請起票は No.13 資産申請起票APIの責務であり、保守契約は `applications` を作成しない
