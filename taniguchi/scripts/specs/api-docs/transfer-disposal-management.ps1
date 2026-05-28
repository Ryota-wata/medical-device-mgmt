$transferDisposalPermissionLines = @(
  '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること'
)

$errorRows = @(
  @('200', '処理成功', '各API定義のレスポンス'),
  @('201', '登録成功', '各API定義のレスポンス'),
  @('204', '削除成功', '-'),
  @('400', '入力値不正、状態遷移不正、対象種別不整合', 'ErrorResponse'),
  @('401', '未認証', 'ErrorResponse'),
  @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
  @('404', '対象申請、対象RFQ、対象見積、対象ドキュメントが存在しない', 'ErrorResponse'),
  @('409', '現在ステータス不整合、競合更新、対象条件不整合', 'ErrorResponse'),
  @('500', 'サーバー内部エラー', 'ErrorResponse')
)

$applicationAssetRows = @(
  @('applicationAssetId', 'int64', '✓', '`application_assets.application_asset_id`'),
  @('assetLedgerId', 'int64', '-', '登録済み資産の場合のみ設定。未登録資産は NULL'),
  @('assetRole', 'string', '✓', '`TRANSFER` / `DISPOSAL`'),
  @('qrCodeValue', 'string', '-', 'QRラベル。登録済み資産は `asset_ledgers` 由来'),
  @('itemName', 'string', '✓', '品目名。未登録資産は修理申請から引き継いだ手入力値'),
  @('makerName', 'string', '-', 'メーカー名'),
  @('modelName', 'string', '-', '型式'),
  @('serialNo', 'string', '-', 'シリアルNo.'),
  @('currentLocationName', 'string', '-', '移動前または廃棄対象の現在設置場所'),
  @('destinationLocationName', 'string', '-', '移動申請の場合の移動先設置場所'),
  @('isRegisteredAsset', 'boolean', '✓', '`assetLedgerId` がある場合 true')
)

$transferApplicationRows = @(
  @('transferApplicationId', 'int64', '✓', '`applications.application_id`'),
  @('applicationNo', 'string', '✓', '申請番号'),
  @('status', 'string', '✓', '`applications.status` の保存値。承認・原本反映後は `完了`'),
  @('statusLabel', 'string', '✓', '画面表示用ステータス。例: `移動承認待ち` / `移動完了`'),
  @('requestedOn', 'date', '✓', '申請日'),
  @('requestedByDepartmentName', 'string', '-', '申請者所属'),
  @('requestedByName', 'string', '✓', '申請者名'),
  @('requestedByContact', 'string', '-', '申請者連絡先'),
  @('sourceLocationName', 'string', '-', '移動元設置場所'),
  @('destinationLocationName', 'string', '✓', '移動先設置場所'),
  @('assets', 'ApplicationAssetSummary[]', '✓', '移動対象資産'),
  @('availableActions', 'string[]', '✓', '表示可能操作。例: `APPROVE_TRANSFER` / `VIEW_DETAIL`')
)

$disposalApplicationRows = @(
  @('disposalApplicationId', 'int64', '✓', '`applications.application_id`'),
  @('applicationNo', 'string', '✓', '申請番号'),
  @('status', 'string', '✓', '`applications.status` の保存値'),
  @('statusLabel', 'string', '✓', '画面表示用ステータス。保存値との対応はステータスマッピングに従う'),
  @('requestedOn', 'date', '✓', '申請日'),
  @('requestedByDepartmentName', 'string', '-', '申請者所属'),
  @('requestedByName', 'string', '✓', '申請者名'),
  @('requestedByContact', 'string', '-', '申請者連絡先'),
  @('disposalReasonCode', 'string', '-', '`disposal_application_details.disposal_reason_code`'),
  @('disposalReasonText', 'string', '-', '`disposal_application_details.disposal_reason_text`'),
  @('relatedRepairApplicationId', 'int64', '-', '修理不能から作成された廃棄申請の場合の元修理申請ID'),
  @('relatedPurchaseApplicationId', 'int64', '-', '更新購入後処理から作成された廃棄申請の場合の元購入申請ID'),
  @('assets', 'ApplicationAssetSummary[]', '✓', '廃棄対象資産'),
  @('availableActions', 'string[]', '✓', '表示可能操作。例: `CREATE_DISPOSAL_GROUP` / `VIEW_DETAIL`')
)

$disposalGroupRows = @(
  @('disposalTaskId', 'int64', '✓', '`rfqs.rfq_id`。廃棄契約タスクID'),
  @('rfqNo', 'string', '✓', '`rfqs.rfq_no`'),
  @('groupName', 'string', '✓', '`rfqs.rfq_group_name`'),
  @('status', 'string', '✓', '画面表示用の集約ステータス。保存値は `rfqStatus` と `applicationStatus` を参照する'),
  @('rfqStatus', 'string', '✓', '`rfqs.status`。作成直後は `見積依頼`'),
  @('applicationStatus', 'string', '✓', '紐づく `applications.status` の代表値。作成直後は `新規申請`'),
  @('statusLabel', 'string', '✓', '画面表示用ステータス'),
  @('vendorName', 'string', '-', '採用または最新依頼先業者名'),
  @('quotationDueOn', 'date', '-', '`disposal_application_details.quotation_due_on`。依頼先別期限は `rfq_vendors.due_on`'),
  @('orderDeadlineOn', 'date', '-', '`disposal_application_details.order_deadline_on`'),
  @('disposalScheduledOn', 'date', '-', '`disposal_application_details.disposal_scheduled_on`'),
  @('applicationCount', 'int32', '✓', '紐づく廃棄申請件数'),
  @('assetCount', 'int32', '✓', '紐づく廃棄対象資産件数'),
  @('availableActions', 'string[]', '✓', '表示可能操作。例: `OPEN_TASK` / `CANCEL`')
)

$disposalTaskStepRows = @(
  @('stepCode', 'string', '✓', '`QUOTE_REQUEST` / `QUOTE_REGISTER` / `ORDER` / `SCHEDULE` / `COMPLETE`'),
  @('stepName', 'string', '✓', '画面表示工程名'),
  @('stepStatus', 'string', '✓', '`NOT_STARTED` / `IN_PROGRESS` / `COMPLETED` / `SKIPPED` / `CANCELED`'),
  @('isCurrent', 'boolean', '✓', '現在工程の場合 true'),
  @('startedAt', 'datetime', '-', '工程開始日時'),
  @('completedAt', 'datetime', '-', '工程完了日時')
)

$disposalVendorRequestRows = @(
  @('rfqVendorId', 'int64', '✓', '`rfq_vendors.rfq_vendor_id`'),
  @('vendorId', 'int64', '-', '業者マスタID'),
  @('vendorName', 'string', '✓', '依頼先業者名'),
  @('contactPerson', 'string', '-', '担当者名'),
  @('email', 'string', '-', 'メールアドレス'),
  @('phone', 'string', '-', '連絡先'),
  @('dueOn', 'date', '-', '回答期限'),
  @('requestNote', 'string', '-', '依頼補足'),
  @('requestStatus', 'string', '✓', '`DRAFT` / `SENT` / `REPLIED` / `CANCELED`')
)

$disposalQuotationItemRows = @(
  @('quotationItemId', 'int64', '✓', '`quotation_items.quotation_item_id`'),
  @('itemName', 'string', '✓', '`quotation_items.item_name`'),
  @('quantity', 'int32', '✓', '`quotation_items.original_quantity`'),
  @('unitPrice', 'decimal', '-', '`quotation_items.purchase_price_unit`'),
  @('amount', 'decimal', '-', '`quotation_items.purchase_price_total`'),
  @('accountTitle', 'string', '-', '`quotation_items.account_title`')
)

$disposalQuotationRows = @(
  @('quotationId', 'int64', '✓', '`quotations.quotation_id`'),
  @('quotationNo', 'string', '✓', '受領見積番号'),
  @('vendorId', 'int64', '-', '業者マスタID'),
  @('vendorName', 'string', '✓', '見積業者名'),
  @('quotationOn', 'date', '✓', '見積日'),
  @('totalAmountExclTax', 'decimal', '-', '税抜合計金額'),
  @('status', 'string', '✓', '`quotations.status`'),
  @('items', 'DisposalQuotationItem[]', '✓', '見積明細')
)

$disposalOrderRows = @(
  @('orderId', 'int64', '✓', '`orders.order_id`'),
  @('orderNo', 'string', '✓', '発注番号'),
  @('quotationId', 'int64', '✓', '採用見積ID'),
  @('vendorName', 'string', '✓', '発注先業者名'),
  @('orderType', 'string', '✓', '`orders.order_type`。廃棄契約では既存発注ヘッダの区分に合わせて `購入` 固定で保存し、業務種別は `rfqs.management_type=''DISPOSAL''` で判定する'),
  @('settlementNo', 'string', '-', '`orders.settlement_no`。院内決済No.'),
  @('orderOn', 'date', '✓', '発注日'),
  @('totalAmount', 'decimal', '-', '`orders.total_amount`'),
  @('status', 'string', '✓', '`orders.status`')
)

$documentRows = @(
  @('documentId', 'int64', '✓', '`application_documents.application_document_id`'),
  @('ownerType', 'string', '✓', '`APPLICATION` / `APPLICATION_ASSET` / `RFQ` / `RFQ_VENDOR` / `QUOTATION` / `ASSET_LEDGER`'),
  @('stepCode', 'string', '-', '`QUOTE_REQUEST` / `QUOTE_REGISTER` / `ORDER` / `SCHEDULE` / `COMPLETE` など'),
  @('documentCategory', 'string', '✓', '`QUOTATION` / `ORDER` / `REPORT` / `DISPOSAL_CERTIFICATE` / `MANIFEST` / `CONTRACT` / `INVOICE` / `OTHER`'),
  @('documentType', 'string', '✓', '画面表示用種別。例: 見積書 / 発注書 / 完了報告書 / 廃棄証明書 / マニフェスト / 契約書 / 請求書'),
  @('fileName', 'string', '✓', 'ファイル名'),
  @('contentType', 'string', '-', 'MIMEタイプ'),
  @('fileSize', 'int64', '-', 'ファイルサイズ'),
  @('documentDate', 'date', '-', '文書日付'),
  @('accountType', 'string', '-', '勘定科目区分'),
  @('uploadedAt', 'datetime', '✓', 'アップロード日時'),
  @('uploadedByName', 'string', '-', 'アップロード者名')
)

$documentCreateInputRows = @(
  @('ownerType', 'string', '✓', '`APPLICATION` / `APPLICATION_ASSET` / `RFQ` / `RFQ_VENDOR` / `QUOTATION` / `ASSET_LEDGER`'),
  @('ownerId', 'int64', '-', '所有者ID。省略時は呼び出し中の廃棄タスク `rfq_id` に紐づける'),
  @('stepCode', 'string', '-', '`QUOTE_REQUEST` / `QUOTE_REGISTER` / `ORDER` / `SCHEDULE` / `COMPLETE` などの工程コード'),
  @('documentCategory', 'string', '✓', '`QUOTATION` / `ORDER` / `REPORT` / `DISPOSAL_CERTIFICATE` / `MANIFEST` / `CONTRACT` / `INVOICE` / `OTHER`'),
  @('documentType', 'string', '✓', '文書種別名'),
  @('fileName', 'string', '✓', 'ファイル名'),
  @('contentType', 'string', '-', 'MIMEタイプ'),
  @('fileSize', 'int64', '-', 'ファイルサイズ'),
  @('storageKey', 'string', '✓', 'ファイル実体のストレージキー'),
  @('title', 'string', '-', '表示タイトル'),
  @('documentDate', 'date', '-', '文書日付'),
  @('accountType', 'string', '-', '勘定科目区分'),
  @('accountOtherText', 'string', '-', '勘定科目補足')
)

$actionResponseRows = @(
  @('disposalTaskId', 'int64', '-', '廃棄契約タスクID。移動承認では NULL'),
  @('applicationIds', 'int64[]', '✓', '更新対象申請ID'),
  @('status', 'string', '✓', '更新後保存ステータス'),
  @('statusLabel', 'string', '✓', '更新後表示ステータス'),
  @('updatedAt', 'datetime', '✓', '更新日時')
)

@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_移動・廃棄管理.docx'
  ScreenLabel = '移動・廃棄管理'
  CoverDateText = '2026年5月27日'
  RevisionDateText = '2026/5/27'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、移動・廃棄管理タブ画面（`/quotation-data-box/transfer-management`）、廃棄契約タスク画面（`/disposal-task`）、旧廃棄管理URL（`/quotation-data-box/disposal-management`）で利用する API の設計内容を定義する。' },
    @{ Type = 'Paragraph'; Text = '資産一覧起点の移動/廃棄申請起票は No.13 資産申請起票 API 設計書を正本とし、本書では起票済み申請の受付、移動承認と原本反映、廃棄申請のRFQグループ化、見積依頼、見積登録、発注登録、作業日/納期登録、完了登録を扱う。' },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '移動・廃棄管理は、タスク管理配下で移動申請と廃棄申請を統合表示する機能である。移動申請は承認時点で資産台帳の設置場所を更新し、同一トランザクションで資産台帳履歴と申請ステータス履歴を作成する。廃棄申請は廃棄契約タスクとしてRFQ、見積、発注、作業日、完了まで進行する。' },
    @{ Type = 'Paragraph'; Text = '未登録資産の廃棄は、修理申請で修理不能と判定されて作成された廃棄申請のみを後続管理対象とする。修理申請を経由しない未登録資産の単独廃棄申請入口は Phase1 対象外であり、本書では API を定義しない。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('移動申請', '`applications.application_type=''TRANSFER''` の申請。承認時に `asset_ledgers` の設置場所を原本反映する'),
      @('廃棄申請', '`applications.application_type=''DISPOSAL''` の申請。廃棄契約タスクへ紐づけて後続工程を進行する'),
      @('廃棄契約タスク', '廃棄申請を1件以上束ねた `rfqs.management_type=''DISPOSAL''` のRFQグループ。本書の `disposalTaskId` は `rfqs.rfq_id` を指す'),
      @('登録済み資産', '`application_assets.asset_ledger_id` を持つ廃棄/移動対象'),
      @('未登録資産', '資産台帳IDを持たない対象。廃棄管理では `disposal_application_details.related_repair_application_id` がある申請のみ許可する'),
      @('旧廃棄管理URL', '`/quotation-data-box/disposal-management`。業務APIは持たず、移動・廃棄管理タブへ正規化する画面ルート')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面パス', '利用目的'); Rows = @(
      @('移動・廃棄管理タブ画面', '/quotation-data-box/transfer-management', '移動/廃棄申請の受付一覧、廃棄RFQグループ一覧、移動承認操作を提供する'),
      @('廃棄契約タスク画面', '/disposal-task?groupId={disposalTaskId}', '廃棄RFQグループの見積依頼、見積登録、発注、作業日、完了登録を行う'),
      @('廃棄管理リダイレクト画面', '/quotation-data-box/disposal-management', '旧URLから移動・廃棄管理タブへ正規化する')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'API の位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、申請作成後のタスク管理機能である。申請起票、申請添付の初期登録、更新購入や棚卸しからの関連申請作成は呼び出し元 API の責務とし、本書では起票済み申請の状態遷移と関連タスクのみを更新する。' },
    @{ Type = 'Paragraph'; Text = '廃棄タスクは `rfqs` をRFQグループとして利用し、`rfq_applications` で対象 `applications` / `application_assets` と接続する。廃棄工程の保存ステータス正本は対象申請の `applications.status` とし、`rfqs.status` はRFQ側の補助状態として同期する。' },
    @{ Type = 'Heading2'; Text = '画面と API の関係' },
    @{ Type = 'Table'; Headers = @('画面操作', 'API', '補足'); Rows = @(
      @('移動・廃棄管理タブ初期表示/フィルター', '`GET /quotation-data-box/transfer-management/tasks`', '移動承認待ち、廃棄申請受付、廃棄RFQグループ一覧を取得する'),
      @('移動申請詳細確認・承認', '`POST /transfer-applications/{transferApplicationId}/approve`', '移動申請を承認し、資産台帳の設置場所と履歴を同一トランザクションで更新する'),
      @('廃棄申請から見積依頼グループ作成', '`POST /quotation-data-box/transfer-management/disposal-groups`', '選択した廃棄申請を `rfqs` / `rfq_applications` に紐づけ、廃棄契約タスクを作成する'),
      @('廃棄契約タスク詳細表示', '`GET /disposal-task/tasks/{disposalTaskId}`', 'STEP表示、申請、対象資産、依頼先、見積、発注、添付を取得する'),
      @('廃棄申請を見送る', '`POST /disposal-task/tasks/{disposalTaskId}/cancel`', '発注前の廃棄タスクを `申請見送り` で終端する'),
      @('見積依頼先登録・送信', '`POST /disposal-task/tasks/{disposalTaskId}/vendor-requests`', '依頼先を登録し、依頼完了時に `見積依頼済` へ進める'),
      @('見積登録', '`POST /disposal-task/tasks/{disposalTaskId}/quotations`', '見積ヘッダー、明細、見積原本を保存し `発注用見積登録済` へ進める'),
      @('見積削除', '`DELETE /disposal-task/tasks/{disposalTaskId}/quotations/{quotationId}`', '発注前の見積を論理削除する'),
      @('発注登録', '`POST /disposal-task/tasks/{disposalTaskId}/order`', '採用見積から発注を作成し `発注済` へ進める'),
      @('作業日/納期登録', '`POST /disposal-task/tasks/{disposalTaskId}/delivery-date`', '廃棄予定日を保存し `納期確定` へ進める'),
      @('完了書類追加/削除', '`POST /disposal-task/tasks/{disposalTaskId}/documents` / `DELETE /disposal-task/tasks/{disposalTaskId}/documents/{documentId}`', '完了報告書、廃棄証明書、マニフェスト、契約書、請求書等を管理する'),
      @('検収/完了登録', '`POST /disposal-task/tasks/{disposalTaskId}/complete`', '廃棄完了情報と証跡を保存し `完了` へ進める')
    ) },
    @{ Type = 'Heading2'; Text = '利用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル/VIEW', '利用種別', '用途'); Rows = @(
      @('`applications`', 'READ/UPDATE', '移動/廃棄申請ヘッダ、ステータス、申請番号、申請者情報'),
      @('`application_assets`', 'READ/UPDATE', '移動/廃棄対象資産、移動先スナップショット、廃棄対象スナップショット'),
      @('`transfer_application_details`', 'READ', '移動申請の移動先、関連購入申請、コメント'),
      @('`disposal_application_details`', 'READ/UPDATE', '廃棄理由、関連修理/購入、受付、期限、発注、廃棄予定日、検収情報'),
      @('`application_status_histories`', 'CREATE', '申請ステータス変更履歴'),
      @('`application_task_steps`', 'CREATE/UPDATE', '廃棄契約タスクの工程進捗'),
      @('`rfqs`', 'CREATE/READ/UPDATE', '廃棄RFQグループ。`management_type=''DISPOSAL''`、`workflow_type=''RFQ''`'),
      @('`rfq_applications`', 'CREATE/READ', '廃棄RFQグループと申請/申請明細の接続'),
      @('`rfq_vendors`', 'CREATE/READ/UPDATE', '廃棄見積依頼先、回答期限、送信状態'),
      @('`quotations` / `quotation_items`', 'CREATE/READ/UPDATE', '廃棄見積ヘッダー、明細、採用候補'),
      @('`orders` / `order_items`', 'CREATE/READ/UPDATE', '廃棄発注ヘッダー、明細'),
      @('`application_documents`', 'CREATE/READ/UPDATE', '見積書、発注書、完了報告書、廃棄証明書等のファイルメタデータ'),
      @('`asset_ledgers`', 'READ/UPDATE', '移動承認時の設置場所原本反映、廃棄完了時の廃棄済み状態反映'),
      @('`asset_ledger_histories`', 'CREATE', '資産台帳更新の監査履歴'),
      @('`facility_locations`', 'READ', '移動元/移動先の設置場所表示と存在確認')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = '認証・認可' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Paragraph'; Text = '本API群で使用する `feature_code` は `transfer_disposal` である。画面表示用の `/auth/context` はUX用キャッシュであり、各業務APIでも同条件を再判定する。共有システム管理者アカウントは認証／認可 API 設計書の例外規定に従う。' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('移動・廃棄管理タブ表示', '`transfer_disposal`', '`user_facility_assignments` / `facility_feature_settings` / `user_facility_feature_settings`', '作業対象施設に対して実効有効な場合のみタブ表示と一覧APIを許可する'),
      @('移動承認・原本反映', '`transfer_disposal`', '同上', '対象移動申請の対象施設に対する権限を再判定する'),
      @('廃棄RFQグループ作成/廃棄タスク操作', '`transfer_disposal`', '同上', '対象廃棄申請または廃棄タスクの施設に対する権限を再判定する')
    ) },
    @{ Type = 'Heading2'; Text = '共通リクエストヘッダー' },
    @{ Type = 'Table'; Headers = @('ヘッダー', '必須', '説明'); Rows = @(
      @('Authorization', '✓', 'Bearer トークン'),
      @('X-Acting-Facility-Id', '✓', '作業対象施設ID。Bearer トークン上の担当施設と一致すること'),
      @('Idempotency-Key', 'POSTのみ✓', 'POST API の冪等性キー。同一キー・同一payloadの再送は初回結果を返す'),
      @('If-Match', '-', '更新競合を検出する場合のバージョン値。画面が保持する `updatedAt` または ETag を指定する')
    ) },
    @{ Type = 'Heading2'; Text = 'ステータス正規化' },
    @{ Type = 'Paragraph'; Text = '一覧表示ラベルとDB保存ステータスは分離する。画面表示だけに存在するラベルは以下の保存値へ正規化する。' },
    @{ Type = 'Table'; Headers = @('画面表示/モック表記', '保存ステータス', '対象', '補足'); Rows = @(
      @('見積登録済', '発注用見積登録済', '廃棄', '見積登録後、発注登録前の保存値'),
      @('作業日確定', '納期確定', '廃棄', '廃棄予定日/作業日が確定した保存値'),
      @('申請を見送る', '申請見送り', '廃棄', '業務上の見送り終端。`rfqs.status` 側は表示用に `申請を見送る` を保持してよい'),
      @('移動完了', '完了', '移動', '移動承認と原本反映が同一操作のため保存上は最終完了')
    ) },
    @{ Type = 'Heading2'; Text = '廃棄ライフサイクル' },
    @{ Type = 'Table'; Headers = @('工程', '保存ステータス', '主なAPI', '次工程'); Rows = @(
      @('申請受付/グループ作成', '新規申請', '`POST /quotation-data-box/transfer-management/disposal-groups`', '見積依頼'),
      @('見積依頼', '見積依頼済', '`POST /disposal-task/tasks/{disposalTaskId}/vendor-requests`', '見積登録'),
      @('見積登録', '発注用見積登録済', '`POST /disposal-task/tasks/{disposalTaskId}/quotations`', '発注登録'),
      @('発注登録', '発注済', '`POST /disposal-task/tasks/{disposalTaskId}/order`', '作業日/納期登録'),
      @('作業日/納期登録', '納期確定', '`POST /disposal-task/tasks/{disposalTaskId}/delivery-date`', '完了登録'),
      @('検収/完了登録', '完了', '`POST /disposal-task/tasks/{disposalTaskId}/complete`', '終端'),
      @('申請見送り', '申請見送り', '`POST /disposal-task/tasks/{disposalTaskId}/cancel`', '終端')
    ) },
    @{ Type = 'Heading2'; Text = '基本エラーレスポンス' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'アプリケーションエラーコード'),
      @('message', 'string', '✓', '利用者向けまたは運用者向けメッセージ'),
      @('details', 'object', '-', '入力項目別エラーなどの詳細'),
      @('traceId', 'string', '✓', 'ログ突合用ID')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 データモデル' },
    @{ Type = 'Heading2'; Text = 'ApplicationAssetSummary' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $applicationAssetRows },
    @{ Type = 'Heading2'; Text = 'TransferApplicationListItem' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $transferApplicationRows },
    @{ Type = 'Heading2'; Text = 'DisposalApplicationListItem' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalApplicationRows },
    @{ Type = 'Heading2'; Text = 'DisposalGroupListItem' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalGroupRows },
    @{ Type = 'Heading2'; Text = 'DisposalTaskStep' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalTaskStepRows },
    @{ Type = 'Heading2'; Text = 'DisposalVendorRequest' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalVendorRequestRows },
    @{ Type = 'Heading2'; Text = 'DisposalQuotation / DisposalQuotationItem' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalQuotationRows },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalQuotationItemRows },
    @{ Type = 'Heading2'; Text = 'DisposalOrder' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalOrderRows },
    @{ Type = 'Heading2'; Text = 'DocumentSummary / DocumentCreateInput' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentRows },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentCreateInputRows },

    @{ Type = 'Heading1'; Text = '第5章 API一覧' },
    @{ Type = 'Table'; Headers = @('No', 'API名', 'メソッド', 'パス', '用途', '権限'); Rows = @(
      @('1', '移動・廃棄管理一覧取得', 'GET', '/quotation-data-box/transfer-management/tasks', '移動申請受付、廃棄申請受付、廃棄RFQグループ一覧を取得する', '`transfer_disposal`'),
      @('2', '移動申請承認', 'POST', '/transfer-applications/{transferApplicationId}/approve', '移動申請を承認し資産台帳へ原本反映する', '`transfer_disposal`'),
      @('3', '廃棄RFQグループ作成', 'POST', '/quotation-data-box/transfer-management/disposal-groups', '選択した廃棄申請を廃棄契約タスクへ束ねる', '`transfer_disposal`'),
      @('4', '廃棄タスク詳細取得', 'GET', '/disposal-task/tasks/{disposalTaskId}', '廃棄契約タスク詳細を取得する', '`transfer_disposal`'),
      @('5', '廃棄申請見送り', 'POST', '/disposal-task/tasks/{disposalTaskId}/cancel', '発注前の廃棄タスクを申請見送りで終端する', '`transfer_disposal`'),
      @('6', '廃棄見積依頼先登録・送信', 'POST', '/disposal-task/tasks/{disposalTaskId}/vendor-requests', '見積依頼先を登録し、必要に応じて依頼完了する', '`transfer_disposal`'),
      @('7', '廃棄見積登録', 'POST', '/disposal-task/tasks/{disposalTaskId}/quotations', '廃棄見積ヘッダー・明細・添付を登録する', '`transfer_disposal`'),
      @('8', '廃棄見積削除', 'DELETE', '/disposal-task/tasks/{disposalTaskId}/quotations/{quotationId}', '発注前の登録済み見積を論理削除する', '`transfer_disposal`'),
      @('9', '廃棄発注登録', 'POST', '/disposal-task/tasks/{disposalTaskId}/order', '採用見積から発注情報を作成する', '`transfer_disposal`'),
      @('10', '廃棄作業日/納期登録', 'POST', '/disposal-task/tasks/{disposalTaskId}/delivery-date', '廃棄予定日を登録する', '`transfer_disposal`'),
      @('11', '廃棄ドキュメント登録', 'POST', '/disposal-task/tasks/{disposalTaskId}/documents', '廃棄関連ドキュメントを追加する', '`transfer_disposal`'),
      @('12', '廃棄ドキュメント削除', 'DELETE', '/disposal-task/tasks/{disposalTaskId}/documents/{documentId}', '廃棄関連ドキュメントを削除する', '`transfer_disposal`'),
      @('13', '廃棄完了登録', 'POST', '/disposal-task/tasks/{disposalTaskId}/complete', '検収/完了情報を登録し廃棄タスクを完了する', '`transfer_disposal`')
    ) },

    @{ Type = 'Heading1'; Text = '第6章 API詳細設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '移動・廃棄管理一覧取得（/quotation-data-box/transfer-management/tasks）'
        Overview = '移動・廃棄管理タブの申請受付一覧と廃棄RFQグループ一覧を取得する。'
        Method = 'GET'
        Path = '/quotation-data-box/transfer-management/tasks'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('applicationType', 'query', 'string', '-', '`ALL` / `TRANSFER` / `DISPOSAL`'),
          @('statusTab', 'query', 'string', '-', '`ALL` / `INTAKE` / `VENDOR_SELECTION` / `QUOTE_COLLECTION` / `ORDERED` / `WORK_DATE_CONFIRMED` / `COMPLETED`'),
          @('keyword', 'query', 'string', '-', '申請番号、RFQ番号、QRラベル、品目名、申請者名の部分一致'),
          @('page', 'query', 'int32', '-', 'ページ番号。未指定時 1'),
          @('pageSize', 'query', 'int32', '-', '1ページ件数。未指定時 50')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '`applications.application_type IN (''TRANSFER'', ''DISPOSAL'')`、作業対象施設、`deleted_at IS NULL` の行を対象にする',
          '移動申請は未完了の受付行を中心に返し、承認済み/完了行は履歴表示対象としてフィルター時に返す',
          '廃棄申請受付は、`rfq_applications` に未接続の `DISPOSAL` 申請を返す',
          '廃棄RFQグループは `rfqs.management_type=''DISPOSAL''`、`workflow_type=''RFQ''` を起点に `rfq_applications`、対象 `applications`、期限列を集約する',
          '未登録資産を含む廃棄申請は `disposal_application_details.related_repair_application_id IS NOT NULL` の場合のみ受付一覧に出す',
          '表示ステータスは保存ステータス正規化表に従って返し、画面操作可否は `availableActions` で返す'
        )
        ResponseTitle = 'レスポンス（200：TransferDisposalTaskListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('pendingTransferCount', 'int32', '✓', '未承認の移動申請件数'),
          @('pendingDisposalCount', 'int32', '✓', 'RFQグループ未作成の廃棄申請件数'),
          @('transferApplications', 'TransferApplicationListItem[]', '✓', '移動申請行'),
          @('disposalApplications', 'DisposalApplicationListItem[]', '✓', '廃棄申請受付行'),
          @('disposalGroups', 'DisposalGroupListItem[]', '✓', '廃棄RFQグループ行'),
          @('totalCount', 'int32', '✓', '総件数'),
          @('page', 'int32', '✓', 'ページ番号'),
          @('pageSize', 'int32', '✓', '1ページ件数')
        )
        ResponseSubtables = @(
          @{ Title = 'transferApplications要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $transferApplicationRows },
          @{ Title = 'disposalApplications要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalApplicationRows },
          @{ Title = 'disposalGroups要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalGroupRows }
        )
        StatusRows = @(
          @('200', '取得成功', 'TransferDisposalTaskListResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '移動申請承認（/transfer-applications/{transferApplicationId}/approve）'
        Overview = '起票済み移動申請を承認し、対象資産の設置場所を原本資産台帳へ反映する。'
        Method = 'POST'
        Path = '/transfer-applications/{transferApplicationId}/approve'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('transferApplicationId', 'path', 'int64', '✓', '`applications.application_id`。`application_type=''TRANSFER''`')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('approvedOn', 'date', '-', '承認日。未指定時は業務日付'),
          @('approvalComment', 'string', '-', '承認コメント'),
          @('expectedUpdatedAt', 'datetime', '-', '画面取得時の `applications.updated_at`。競合検出に使用する')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '`applications.application_type=''TRANSFER''`、作業対象施設、未削除であることを確認する',
          '現在ステータスが移動承認可能状態でない場合は 409 を返す',
          '`application_assets` の移動先施設/部署/部門/部屋/設置場所を検証し、対象 `asset_ledgers` を同一トランザクションで行ロックする',
          '対象 `asset_ledgers` の設置場所、部署、部門、部屋スナップショットを更新し、変更前後を `asset_ledger_histories` に登録する',
          '`applications.status=''完了''` に更新し、`application_status_histories` に承認・原本反映履歴を登録する',
          '移動承認と原本反映のどちらか一方だけが成功した状態を禁止する'
        )
        ResponseTitle = 'レスポンス（200：TransferApproveResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('transferApplicationId', 'int64', '✓', '承認した移動申請ID'),
          @('status', 'string', '✓', '`完了`'),
          @('statusLabel', 'string', '✓', '`移動完了`'),
          @('updatedAssetLedgerIds', 'int64[]', '✓', '原本反映した資産台帳ID'),
          @('updatedAt', 'datetime', '✓', '更新日時')
        )
        StatusRows = @(
          @('200', '移動承認成功', 'TransferApproveResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象移動申請または対象資産が存在しない', 'ErrorResponse'),
          @('409', '現在ステータス不整合、移動先不正、または競合更新', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄RFQグループ作成（/quotation-data-box/transfer-management/disposal-groups）'
        Overview = 'RFQ未作成の廃棄申請を選択し、廃棄契約タスクを作成する。'
        Method = 'POST'
        Path = '/quotation-data-box/transfer-management/disposal-groups'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('applicationIds', 'int64[]', '✓', 'グループ化する廃棄申請ID。1件以上'),
          @('groupName', 'string', '✓', 'RFQグループ名'),
          @('note', 'string', '-', '管理メモ')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '全 `applicationIds` が `applications.application_type=''DISPOSAL''`、作業対象施設、未削除、RFQ未接続であることを確認する',
          '未登録資産を含む申請は `disposal_application_details.related_repair_application_id` がある場合のみ許可する',
          '`rfqs.management_type=''DISPOSAL''`、`workflow_type=''RFQ''`、`rfqs.status=''見積依頼''` でRFQグループを作成する。対象 `applications.status` は見積依頼完了まで `新規申請` のままとする',
          '対象申請に紐づく廃棄対象 `application_assets` を `rfq_applications` に1明細1行で登録し、`applications.primary_rfq_no`、`applications.rfq_group_name` を更新する',
          '作成直後は廃棄タスク STEP1（見積依頼）を現在工程として返す'
        )
        ResponseTitle = 'レスポンス（201：DisposalGroupCreateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('disposalTaskId', 'int64', '✓', '`rfqs.rfq_id`'),
          @('rfqNo', 'string', '✓', '`rfqs.rfq_no`'),
          @('groupName', 'string', '✓', '作成したグループ名'),
          @('applicationIds', 'int64[]', '✓', '紐づけた廃棄申請ID'),
          @('status', 'string', '✓', '画面表示用の集約ステータス'),
          @('rfqStatus', 'string', '✓', '`見積依頼`'),
          @('applicationStatus', 'string', '✓', '`新規申請`'),
          @('statusLabel', 'string', '✓', '画面表示ステータス')
        )
        StatusRows = @(
          @('201', '作成成功', 'DisposalGroupCreateResponse'),
          @('400', '入力不正、申請件数不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄申請が存在しない', 'ErrorResponse'),
          @('409', 'RFQ接続済み、未登録資産条件不一致、または現在ステータス不整合', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄タスク詳細取得（/disposal-task/tasks/{disposalTaskId}）'
        Overview = '廃棄契約タスク画面に表示する申請情報、対象資産、工程、見積依頼先、見積、発注、添付を取得する。'
        Method = 'GET'
        Path = '/disposal-task/tasks/{disposalTaskId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '`rfqs.management_type=''DISPOSAL''`、`workflow_type=''RFQ''` の行を取得する',
          '`rfq_applications` から対象 `applications`、`application_assets`、`disposal_application_details` を取得する',
          '`applications.status` から現在STEPを算出し、`application_task_steps` に保存済み工程がある場合は補助情報として返す',
          '`rfq_vendors`、`quotations`、`quotation_items`、`orders`、`application_documents` を必要に応じて結合する',
          '旧URLやモック固定IDではなく、URLの `groupId` を `disposalTaskId` として扱う'
        )
        ResponseTitle = 'レスポンス（200：DisposalTaskDetailResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('task', 'DisposalGroupListItem', '✓', '廃棄タスクヘッダ'),
          @('applications', 'DisposalApplicationListItem[]', '✓', '紐づく廃棄申請'),
          @('steps', 'DisposalTaskStep[]', '✓', '工程表示情報'),
          @('vendorRequests', 'DisposalVendorRequest[]', '✓', '見積依頼先'),
          @('quotations', 'DisposalQuotation[]', '✓', '登録済み見積'),
          @('order', 'DisposalOrder', '-', '発注情報'),
          @('documents', 'DocumentSummary[]', '✓', '添付ドキュメント'),
          @('availableActions', 'string[]', '✓', '表示可能操作')
        )
        ResponseSubtables = @(
          @{ Title = 'task要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalGroupRows },
          @{ Title = 'applications要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalApplicationRows },
          @{ Title = 'steps要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalTaskStepRows },
          @{ Title = 'vendorRequests要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalVendorRequestRows },
          @{ Title = 'quotations要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalQuotationRows },
          @{ Title = 'quotations配下items要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalQuotationItemRows },
          @{ Title = 'order要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalOrderRows },
          @{ Title = 'documents要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentRows }
        )
        StatusRows = @(
          @('200', '取得成功', 'DisposalTaskDetailResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクが存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄申請見送り（/disposal-task/tasks/{disposalTaskId}/cancel）'
        Overview = '発注前の廃棄タスクを申請見送りとして終端する。'
        Method = 'POST'
        Path = '/disposal-task/tasks/{disposalTaskId}/cancel'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('cancelReason', 'string', '✓', '見送り理由'),
          @('canceledOn', 'date', '-', '見送り日。未指定時は業務日付')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象廃棄タスクが発注前であることを確認する',
          '紐づく全 `applications.status` を `申請見送り` に更新し、`application_status_histories` を登録する',
          '`rfq_vendors` に送信済み依頼がある場合は、未回答分を `CANCELED` に更新する',
          '`rfqs.status` は表示互換のため `申請を見送る` 相当へ同期する'
        )
        ResponseTitle = 'レスポンス（200：DisposalTaskActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $actionResponseRows
        StatusRows = @(
          @('200', '見送り成功', 'DisposalTaskActionResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクが存在しない', 'ErrorResponse'),
          @('409', '発注済み以降、完了済み、または現在ステータス不整合', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄見積依頼先登録・送信（/disposal-task/tasks/{disposalTaskId}/vendor-requests）'
        Overview = '廃棄契約タスクの見積依頼先を登録し、依頼完了時に見積依頼済へ進める。'
        Method = 'POST'
        Path = '/disposal-task/tasks/{disposalTaskId}/vendor-requests'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('receptionDepartment', 'string', '-', '受付部署'),
          @('receptionPerson', 'string', '-', '受付担当者'),
          @('receptionContact', 'string', '-', '受付連絡先'),
          @('requestNote', 'string', '-', '見積依頼共通補足'),
          @('action', 'string', '✓', '`SAVE_DRAFT` / `SEND_SELECTED` / `SEND_ALL` / `COMPLETE_REQUEST`'),
          @('targetRfqVendorIds', 'int64[]', '-', '`SEND_SELECTED` の場合に送信対象の既存依頼先IDを指定する'),
          @('vendors', 'DisposalVendorRequestInput[]', '✓', '見積依頼先一覧。1件以上')
        )
        RequestSubtables = @(
          @{ Title = 'vendors要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
            @('vendorId', 'int64', '-', '業者マスタID'),
            @('vendorName', 'string', '✓', '依頼先業者名'),
            @('contactPerson', 'string', '-', '担当者名'),
            @('email', 'string', '-', 'メールアドレス'),
            @('phone', 'string', '-', '電話番号'),
            @('dueOn', 'date', '-', '回答期限'),
            @('requestNote', 'string', '-', '依頼先別補足')
          ) }
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象廃棄タスクが `新規申請` または `見積依頼済` の見積依頼操作可能状態であることを確認する',
          '受付部署/担当者/連絡先を対象 `disposal_application_details` に保存する',
          '`vendors` の新規行は `rfq_vendors.request_status=''DRAFT''` で作成し、既存DRAFT行のみ業者情報、期限、依頼事項を更新できる',
          '`action=''SEND_SELECTED''` の場合は `targetRfqVendorIds` のDRAFT行のみ `request_status=''SENT''`、`requested_at`、`requested_by_user_id` を更新する',
          '`action=''SEND_ALL''` の場合は対象廃棄タスク配下のDRAFT行を一括で `SENT` に更新する',
          '`action=''COMPLETE_REQUEST''` の場合、送信済み依頼先が1件以上あることを確認し、対象 `applications.status` を `見積依頼済`、`rfqs.status` を `見積依頼済` に更新する',
          '`disposal_application_details.quotation_due_on` には送信済み依頼先の最も早い `due_on` を一覧期限として保存する'
        )
        ResponseTitle = 'レスポンス（200：DisposalTaskActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $actionResponseRows
        StatusRows = @(
          @('200', '見積依頼先登録成功', 'DisposalTaskActionResponse'),
          @('400', '依頼先必須不足、メール形式不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクが存在しない', 'ErrorResponse'),
          @('409', '現在ステータスが見積依頼可能状態ではない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄見積登録（/disposal-task/tasks/{disposalTaskId}/quotations）'
        Overview = '廃棄見積のヘッダー、明細、見積原本を登録し、発注用見積登録済へ進める。'
        Method = 'POST'
        Path = '/disposal-task/tasks/{disposalTaskId}/quotations'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('rfqVendorId', 'int64', '-', '依頼先ID。依頼先未登録の持込見積では NULL 可'),
          @('vendorId', 'int64', '-', '業者マスタID'),
          @('vendorName', 'string', '✓', '見積業者名'),
          @('quotationNo', 'string', '✓', '見積番号'),
          @('quotationOn', 'date', '✓', '見積日'),
          @('totalAmountExclTax', 'decimal', '-', '税抜合計金額'),
          @('orderDeadlineOn', 'date', '-', '発注期限'),
          @('items', 'DisposalQuotationItemInput[]', '✓', '見積明細。1件以上'),
          @('documents', 'DocumentCreateInput[]', '-', '見積原本等')
        )
        RequestSubtables = @(
          @{ Title = 'items要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
            @('itemName', 'string', '✓', '明細名'),
            @('quantity', 'int32', '✓', '数量'),
            @('unitPrice', 'decimal', '-', '単価'),
            @('amount', 'decimal', '-', '金額'),
            @('accountTitle', 'string', '-', '勘定科目')
          ) },
          @{ Title = 'documents要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentCreateInputRows }
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象廃棄タスクが `見積依頼済` または `発注用見積登録済` の見積追加可能状態であることを確認する',
          '`quotations` を `rfq_id`、業者、金額、見積番号で作成し、`quotation_items` を明細件数分作成する',
          '見積原本がある場合は `application_documents.owner_type=''QUOTATION''`、`quotation_id` に紐づけて保存する',
          '対象 `applications.status` を `発注用見積登録済` に更新し、`application_status_histories` を登録する',
          '`disposal_application_details.order_deadline_on` に発注期限を保存する'
        )
        ResponseTitle = 'レスポンス（201：DisposalQuotationResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $disposalQuotationRows
        StatusRows = @(
          @('201', '見積登録成功', 'DisposalQuotationResponse'),
          @('400', '入力不正、明細不足', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクが存在しない', 'ErrorResponse'),
          @('409', '現在ステータスが見積登録可能状態ではない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄見積削除（/disposal-task/tasks/{disposalTaskId}/quotations/{quotationId}）'
        Overview = '発注前の登録済み廃棄見積を論理削除する。'
        Method = 'DELETE'
        Path = '/disposal-task/tasks/{disposalTaskId}/quotations/{quotationId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`'),
          @('quotationId', 'path', 'int64', '✓', '`quotations.quotation_id`')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象見積が対象廃棄タスクの `rfq_id` に紐づくことを確認する',
          '発注登録済み、採用済みロック、または完了済みの場合は削除不可とする',
          '`quotations.deleted_at` を設定し、関連見積原本の `application_documents.deleted_at` も設定する',
          '有効見積が0件になった場合、対象 `applications.status` を `見積依頼済` に戻し、`order_deadline_on` をクリアする'
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @('レスポンスボディなし。')
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクまたは対象見積が存在しない', 'ErrorResponse'),
          @('409', '発注済み、採用済み、または現在ステータス不整合で削除不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄発注登録（/disposal-task/tasks/{disposalTaskId}/order）'
        Overview = '採用見積から廃棄発注を作成し、発注済へ進める。'
        Method = 'POST'
        Path = '/disposal-task/tasks/{disposalTaskId}/order'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('quotationId', 'int64', '✓', '採用見積ID'),
          @('orderNo', 'string', '✓', '発注番号'),
          @('settlementNo', 'string', '-', '院内決済No.。`orders.settlement_no` に保存する'),
          @('orderOn', 'date', '✓', '発注日'),
          @('paymentTerms', 'string', '-', '支払条件'),
          @('orderDocument', 'DocumentCreateInput', '-', '発注書メタデータ')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象見積が対象廃棄タスクに紐づき、削除されていないことを確認する',
          '`orders` を作成し、採用見積の `quotation_items` から `order_items` を作成する',
          '`orders.order_type=''購入''`、`orders.settlement_no`、`orders.status=''ORDERED''`、`payment_terms`（未入力時 `未指定`）、`order_on`、見積合計金額を保存する。廃棄業務であることは `rfqs.management_type=''DISPOSAL''` で判定する',
          '発注書がある場合は `application_documents.owner_type=''RFQ''`、`rfq_id=disposalTaskId`、`step_code=''ORDER''`、`document_category=''ORDER''`、`document_type=''発注書''` として保存する',
          '対象 `applications.status` を `発注済` に更新し、`application_status_histories` を登録する',
          '`disposal_application_details.ordered_on`、`order_no`、業者スナップショットを保存する'
        )
        ResponseTitle = 'レスポンス（200：DisposalOrderResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $disposalOrderRows
        StatusRows = @(
          @('200', '発注登録成功', 'DisposalOrderResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクまたは見積が存在しない', 'ErrorResponse'),
          @('409', '現在ステータス不整合、見積が対象廃棄タスクに紐づかない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄作業日/納期登録（/disposal-task/tasks/{disposalTaskId}/delivery-date）'
        Overview = '廃棄予定日または作業日を登録し、納期確定へ進める。'
        Method = 'POST'
        Path = '/disposal-task/tasks/{disposalTaskId}/delivery-date'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('disposalScheduledOn', 'date', '✓', '廃棄予定日/作業日'),
          @('scheduleNote', 'string', '-', '作業日補足')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象廃棄タスクが `発注済` または `納期確定` の日程更新可能状態であることを確認する',
          '`disposal_application_details.disposal_scheduled_on` を更新する',
          '対象 `applications.status` を `納期確定` に更新し、`application_status_histories` を登録する',
          '画面表示の `作業日確定` は保存値 `納期確定` から派生させる'
        )
        ResponseTitle = 'レスポンス（200：DisposalTaskActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $actionResponseRows
        StatusRows = @(
          @('200', '作業日/納期登録成功', 'DisposalTaskActionResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクが存在しない', 'ErrorResponse'),
          @('409', '現在ステータスが日程登録可能状態ではない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄ドキュメント登録（/disposal-task/tasks/{disposalTaskId}/documents）'
        Overview = '廃棄契約タスクに関連するドキュメントメタデータを登録する。'
        Method = 'POST'
        Path = '/disposal-task/tasks/{disposalTaskId}/documents'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = $documentCreateInputRows
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象廃棄タスクが存在し、完了後削除済みでないことを確認する',
          '`ownerType` に応じて `application_documents` の `application_id`、`application_asset_id`、`rfq_id`、`rfq_vendor_id`、`quotation_id`、`asset_ledger_id` のいずれかを設定し、生成列 `owner_key` へ直接書き込まない',
          '完了工程で追加する完了報告書、廃棄証明書、マニフェスト、契約書、請求書は `document_category` で識別する',
          '発注書を後続追加する場合は `owner_type=''RFQ''`、`rfq_id=disposalTaskId`、`step_code=''ORDER''`、`document_category=''ORDER''`、`document_type=''発注書''` として保存する',
          'ファイル実体は別途アップロード済みのストレージキーを受け取り、本APIではメタデータのみ保存する'
        )
        ResponseTitle = 'レスポンス（201：DocumentSummary）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $documentRows
        StatusRows = @(
          @('201', 'ドキュメント登録成功', 'DocumentSummary'),
          @('400', '入力不正、ownerType不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクまたは所有者が存在しない', 'ErrorResponse'),
          @('409', '所有者が対象廃棄タスクに紐づかない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄ドキュメント削除（/disposal-task/tasks/{disposalTaskId}/documents/{documentId}）'
        Overview = '廃棄契約タスクに紐づくドキュメントを論理削除する。'
        Method = 'DELETE'
        Path = '/disposal-task/tasks/{disposalTaskId}/documents/{documentId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`'),
          @('documentId', 'path', 'int64', '✓', '`application_documents.application_document_id`')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象ドキュメントが対象廃棄タスク、またはタスク配下の申請/依頼先/見積/発注に紐づくことを確認する',
          '完了済みタスクの完了証跡、発注済み以降の発注書、採用見積の見積書は削除不可とする',
          '`application_documents.deleted_at` を設定する。ファイル実体の削除はストレージライフサイクルに委ねる'
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @('レスポンスボディなし。')
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクまたはドキュメントが存在しない', 'ErrorResponse'),
          @('409', '確定済み工程の証跡で削除不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄完了登録（/disposal-task/tasks/{disposalTaskId}/complete）'
        Overview = '廃棄完了情報と証跡を登録し、廃棄タスクを完了する。'
        Method = 'POST'
        Path = '/disposal-task/tasks/{disposalTaskId}/complete'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('acceptedOn', 'date', '✓', '検収日/完了確認日'),
          @('inspectedByName', 'string', '-', '検収担当者名'),
          @('completionNote', 'string', '-', '完了補足'),
          @('documents', 'DocumentCreateInput[]', '-', '完了報告書、廃棄証明書、マニフェスト、契約書、請求書等')
        )
        RequestSubtables = @(
          @{ Title = 'documents要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentCreateInputRows }
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象廃棄タスクが `納期確定` または `検収済` の完了登録可能状態であることを確認する',
          '`disposal_application_details.accepted_on`、`inspected_by_name` を更新する',
          '完了証跡ドキュメントを `application_documents.owner_type=''RFQ''`、`rfq_id=disposalTaskId`、`step_code=''COMPLETE''` を基本として保存する',
          '対象 `applications.status` を `完了` に更新し、登録済み資産の廃棄対象は `asset_ledgers.status` を廃棄済み相当へ更新し、`asset_ledger_histories` を登録する',
          '未登録資産は `asset_ledgers` を作成せず、申請および廃棄証跡のみで完了管理する'
        )
        ResponseTitle = 'レスポンス（200：DisposalTaskActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $actionResponseRows
        StatusRows = @(
          @('200', '完了登録成功', 'DisposalTaskActionResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクが存在しない', 'ErrorResponse'),
          @('409', '現在ステータスが完了登録可能状態ではない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第7章 DBマッピング・業務ルール' },
    @{ Type = 'Heading2'; Text = '移動承認の原本反映' },
    @{ Type = 'Bullets'; Items = @(
      '移動承認は `applications`、`application_assets`、対象 `asset_ledgers`、`asset_ledger_histories`、`application_status_histories` を1トランザクションで更新する',
      '移動先は申請時に保存済みの `application_assets.destination_*` と `transfer_application_details` を正本とし、承認APIで任意の移動先上書きは受け付けない',
      '資産台帳更新後のステータス保存値は `完了` とし、画面表示では `移動完了` として返す'
    ) },
    @{ Type = 'Heading2'; Text = '廃棄RFQの保存方針' },
    @{ Type = 'Bullets'; Items = @(
      '`rfqs.management_type=''DISPOSAL''`、`workflow_type=''RFQ''` として廃棄契約タスクを表す。`workflow_type=''DISPOSAL''` はリモデル管理側の用途とし、本書では使用しない',
      '`rfqs.status` はRFQワークフロー状態、`applications.status` は廃棄申請の業務進行状態として分離する。RFQ作成直後は `rfqs.status=''見積依頼''`、`applications.status=''新規申請''` とする',
      '廃棄タスクの対象申請は `rfq_applications.application_id` と `application_asset_id` で追跡し、見積・発注・完了証跡は `rfq_id` 配下へ集約する',
      '複数申請を1タスクに束ねる場合、ステータス遷移は紐づく全申請に同一保存値として適用する',
      '`disposal_application_details.quotation_due_on` は一覧表示用の最早回答期限、`order_deadline_on` は発注期限、`disposal_scheduled_on` は作業日/廃棄予定日の正本とする'
    ) },
    @{ Type = 'Heading2'; Text = '対象外・境界' },
    @{ Type = 'Table'; Headers = @('論点', '本書の扱い', '参照先'); Rows = @(
      @('資産一覧起点の移動/廃棄申請起票', '本書では扱わない。起票後の受付以降を扱う', 'No.13 資産申請起票 API 設計書'),
      @('棚卸しからの移動/廃棄申請作成', '棚卸しAPIが申請を作成し、本書は承認・後続工程のみ扱う', '棚卸し API 設計書'),
      @('修理不能からの未登録資産廃棄申請作成', '修理管理APIが廃棄申請を作成し、本書は作成済み申請の受付以降を扱う', '修理管理 API 設計書'),
      @('未登録資産の単独廃棄申請', 'Phase1対象外。入口UI/APIを設けない', '-'),
      @('旧廃棄管理URL', '業務APIを追加せず、画面ルートで `/quotation-data-box/transfer-management?tab=disposal` へ正規化する', '-')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 エラー設計' },
    @{ Type = 'Heading2'; Text = '共通HTTPステータス' },
    @{ Type = 'Table'; Headers = @('HTTP', '説明', 'レスポンス'); Rows = $errorRows },
    @{ Type = 'Heading2'; Text = '代表エラーコード' },
    @{ Type = 'Table'; Headers = @('コード', 'HTTP', '内容'); Rows = @(
      @('VALIDATION_ERROR', '400', '必須不足、形式不正、件数不正'),
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
      @('FORBIDDEN', '403', '作業対象施設に対する実効 `transfer_disposal` がない'),
      @('APPLICATION_NOT_FOUND', '404', '対象申請が存在しない、または作業対象施設に属さない'),
      @('DISPOSAL_TASK_NOT_FOUND', '404', '対象廃棄タスクが存在しない'),
      @('INVALID_APPLICATION_TYPE', '409', '対象申請が `TRANSFER` / `DISPOSAL` の期待種別ではない'),
      @('UNREGISTERED_DISPOSAL_NOT_ALLOWED', '409', '修理申請経由ではない未登録資産廃棄申請が含まれている'),
      @('STATUS_TRANSITION_NOT_ALLOWED', '409', '現在ステータスから要求された操作へ遷移できない'),
      @('RFQ_ALREADY_CREATED', '409', '廃棄申請が既にRFQグループへ接続済み'),
      @('ORDER_ALREADY_CREATED', '409', '発注済み以降のため見積削除または見送りができない'),
      @('CONFLICT_UPDATED', '409', '画面取得後に対象データが更新された')
    ) },

    @{ Type = 'Heading1'; Text = '第9章 運用・監査方針' },
    @{ Type = 'Bullets'; Items = @(
      '移動承認、廃棄RFQグループ作成、見積依頼、見積登録、発注登録、作業日登録、完了登録、見送りは監査対象とし、APIログに作業対象施設、実行ユーザー、申請ID、RFQ ID、更新前後ステータス、`Idempotency-Key` を記録する',
      '添付ファイル本文、見積書本文、証明書本文はアプリケーションログへ出力しない',
      'POST API は冪等性キーを必須とし、同一キー・同一ユーザー・同一施設・同一APIパス・同一payloadの再送は初回結果を返す',
      '旧廃棄管理URLの正規化は画面ルーティング層で行い、業務APIログには正規化後の `/quotation-data-box/transfer-management` からのAPI呼び出しとして記録する',
      '移動承認および廃棄完了の資産台帳更新は、申請ステータス更新と同一トランザクションで処理し、片側だけが成功した状態を禁止する'
    ) }
  )
}
