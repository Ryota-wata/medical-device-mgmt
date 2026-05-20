$repairManagementPermissionLines = @(
  '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること'
)

$errorRows = @(
  @('200', '処理成功', '各API定義のレスポンス'),
  @('201', '登録成功', '各API定義のレスポンス'),
  @('204', '削除成功', '-'),
  @('400', '入力値不正、状態遷移不正、登録済/未登録資産の条件不整合', 'ErrorResponse'),
  @('401', '未認証', 'ErrorResponse'),
  @('403', '作業対象施設に対する実効 feature_code なし', 'ErrorResponse'),
  @('404', '対象申請、対象資産、対象ドキュメントが存在しない', 'ErrorResponse'),
  @('409', '現在ステータス不整合、競合更新、対象条件不整合', 'ErrorResponse'),
  @('500', 'サーバー内部エラー', 'ErrorResponse')
)

$repairRequestSummaryRows = @(
  @('repairRequestId', 'int64', '✓', '`applications.application_id`'),
  @('applicationNo', 'string', '✓', '修理依頼No.'),
  @('status', 'string', '✓', '`applications.status` の保存正本'),
  @('statusLabel', 'string', '✓', '画面表示用ステータス'),
  @('requestedOn', 'date', '✓', '申請日'),
  @('requestedAtTime', 'time', '-', '申請時刻'),
  @('requestedByName', 'string', '✓', '申請者名'),
  @('requestedByDepartmentName', 'string', '-', '申請者所属'),
  @('requestedByContact', 'string', '-', '申請者連絡先'),
  @('isRegisteredAsset', 'boolean', '✓', '登録済み資産かどうか'),
  @('assetLedgerId', 'int64', '-', '登録済み資産の場合のみ設定'),
  @('qrCodeValue', 'string', '-', 'QRラベル'),
  @('itemName', 'string', '-', '品目名。未登録資産は手入力値'),
  @('makerName', 'string', '-', 'メーカー名。未登録資産は手入力値'),
  @('modelName', 'string', '-', '型式。未登録資産は手入力値'),
  @('serialNo', 'string', '-', 'シリアルNo.'),
  @('repairCategory', 'string', '-', '`IN_HOUSE` / `OUTSOURCED`'),
  @('alternativeUnreturnedFlag', 'boolean', '✓', '代替機納品済みかつ未返却の場合 true'),
  @('availableActions', 'string[]', '✓', '画面表示可能操作。例: `REQUEST_QUOTATION` / `REGISTER_QUOTATION` / `REGISTER_ORDER` / `DELETE_TASK` / `REGISTER_WORK_DATE` / `COMPLETE_TASK` / `CREATE_DISPOSAL_APPLICATION`')
)

$documentRows = @(
  @('documentId', 'int64', '✓', '`application_documents.application_document_id`'),
  @('documentCategory', 'string', '✓', '`REQUEST_ATTACHMENT` / `QUOTATION` / `CONTRACT` / `DELIVERY` / `ACCEPTANCE` / `REPORT` / `PHOTO` / `OTHER` など'),
  @('documentType', 'string', '✓', '`application_documents.document_type`。呼び出しAPIの工程から補完した 機器写真 / 見積書 / 発注書 / 納品書 / 検収書 / 修理報告書 などの保存値を返す'),
  @('fileName', 'string', '✓', 'ファイル名'),
  @('contentType', 'string', '-', 'MIMEタイプ'),
  @('fileSize', 'int64', '-', 'ファイルサイズ'),
  @('uploadedAt', 'datetime', '✓', 'アップロード日時'),
  @('uploadedByName', 'string', '-', 'アップロード者名')
)

$documentCreateInputRows = @(
  @('documentCategory', 'string', '-', '`REQUEST_ATTACHMENT` / `QUOTATION` / `CONTRACT` / `DELIVERY` / `ACCEPTANCE` / `REPORT` / `PHOTO` / `OTHER` など。未指定時は呼び出しAPIの工程と `documentType` から決定する'),
  @('documentType', 'string', '✓', '`application_documents.document_type`。例: 修理依頼書 / 見積書 / 発注書 / 納品書 / 検収書 / 修理報告書'),
  @('fileName', 'string', '✓', 'ファイル名'),
  @('contentType', 'string', '-', 'MIMEタイプ'),
  @('fileSize', 'int64', '-', 'ファイルサイズ'),
  @('storageKey', 'string', '✓', 'ファイル実体のストレージキー'),
  @('title', 'string', '-', '表示タイトル'),
  @('documentDate', 'date', '-', '文書日付'),
  @('accountType', 'string', '-', '`application_documents.account_type` に保存する勘定科目区分'),
  @('accountOtherText', 'string', '-', '`application_documents.account_other_text` に保存する勘定科目補足'),
  @('isPrimary', 'boolean', '-', '代表写真として扱う場合 true')
)

$repairTaskStepRows = @(
  @('stepCode', 'string', '✓', '`REQUEST` / `QUOTE` / `ORDER` / `SCHEDULE` / `INSPECTION` / `COMPLETE` など'),
  @('stepName', 'string', '✓', '画面表示工程名'),
  @('stepStatus', 'string', '✓', '`application_task_steps.step_status`。`NOT_STARTED` / `IN_PROGRESS` / `COMPLETED` / `SKIPPED` / `CANCELED` / `REOPENED`'),
  @('isCurrent', 'boolean', '✓', '現在工程の場合 true'),
  @('startedAt', 'datetime', '-', '工程開始日時'),
  @('completedAt', 'datetime', '-', '工程完了日時'),
  @('completionReason', 'string', '-', '`REJECTED` / `UNREPAIRABLE` / `SKIPPED_IN_HOUSE_REPAIR` など')
)

$repairVendorRequestRows = @(
  @('rfqVendorId', 'int64', '✓', '`rfq_vendors.rfq_vendor_id`'),
  @('vendorId', 'int64', '-', '業者マスタID'),
  @('vendorName', 'string', '✓', '依頼先業者名'),
  @('contactPerson', 'string', '-', '担当者名'),
  @('email', 'string', '-', 'メールアドレス'),
  @('phone', 'string', '-', '連絡先'),
  @('dueOn', 'date', '-', '回答期限'),
  @('requestStatus', 'string', '✓', '`DRAFT` / `SENT` / `REPLIED` / `CANCELED`')
)

$repairQuotationItemRows = @(
  @('quotationItemId', 'int64', '✓', '`quotation_items.quotation_item_id`'),
  @('itemName', 'string', '✓', '`quotation_items.item_name`。未確定時は `original_item_name` も同値で保存する'),
  @('makerName', 'string', '-', '`quotation_items.maker_name`。未確定時は `original_maker_name` も同値で保存する'),
  @('modelName', 'string', '-', '`quotation_items.model_name`。未確定時は `original_model_name` も同値で保存する'),
  @('quantity', 'int32', '✓', '`quotation_items.original_quantity`。AI判定を使わない場合は `ai_quantity` も同値で保存する'),
  @('unitPrice', 'decimal', '-', '`quotation_items.purchase_price_unit`'),
  @('amount', 'decimal', '-', '`quotation_items.purchase_price_total`'),
  @('accountTitle', 'string', '-', '`quotation_items.account_title`')
)

$repairQuotationRows = @(
  @('quotationId', 'int64', '✓', '`quotations.quotation_id`'),
  @('quotationNo', 'string', '✓', '受領見積番号'),
  @('vendorId', 'int64', '-', '業者マスタID'),
  @('vendorName', 'string', '✓', '見積業者名'),
  @('quotationOn', 'date', '✓', '見積日'),
  @('totalAmountExclTax', 'decimal', '-', '税抜合計金額'),
  @('status', 'string', '✓', '`quotations.status`'),
  @('items', 'RepairQuotationItem[]', '✓', '見積明細')
)

$repairOrderRows = @(
  @('orderId', 'int64', '✓', '`orders.order_id`'),
  @('orderNo', 'string', '✓', '発注番号'),
  @('vendorName', 'string', '✓', '発注先業者名'),
  @('orderType', 'string', '✓', '`orders.order_type`。修理発注では `購入` 固定で保存する'),
  @('orderOn', 'date', '✓', '発注日'),
  @('orderDeadlineOn', 'date', '-', '`repair_request_details.order_deadline_on`'),
  @('paymentTerms', 'string', '✓', '`orders.payment_terms`。未入力時は `未指定` を保存する'),
  @('totalAmount', 'decimal', '-', '`orders.total_amount`'),
  @('status', 'string', '✓', '`orders.status`')
)

@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_修理管理.docx'
  ScreenLabel = '修理管理'
  CoverDateText = '2026年5月20日'
  RevisionDateText = '2026/5/20'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、修理管理タブ画面（`/quotation-data-box/repair-requests`）および修理申請管理タスク画面（`/repair-task`）で利用する API の設計内容を整理し、画面要件、DB設計、修理申請API設計書、移動・廃棄管理との責務境界を一致させることを目的とする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      'No.6 修理申請API設計書で起票された修理申請を受け付ける I/F',
      'タスク管理配下の修理管理一覧・詳細・工程進行 I/F',
      '登録済み資産と未登録資産の修理管理上の扱い',
      '院内修理と院外修理のステータス遷移',
      '通常却下と修理不能による廃棄申請接続の内部識別',
      '登録済み資産および修理申請経由の未登録資産を対象とする廃棄申請接続',
      '申請者情報のログインユーザー自動取得と feature_code 分離'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '修理管理は、No.6 修理申請API設計書で起票された現場からの修理依頼を受け付け、ME室または修理管理担当者が院内対応、外部修理依頼、見積登録、発注、納期・検収、完了まで進行する業務機能である。メニューからの修理依頼起票と、タスク管理配下の修理管理は別機能として認可する。' },
    @{ Type = 'Paragraph'; Text = '修理申請の起票APIは No.6 修理申請API設計書で定義する。本書では起票済みの `applications.application_type=''REPAIR''` を対象に、受付後の工程進行、ドキュメント管理、廃棄申請接続を扱う。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('修理申請', 'No.6 修理申請API設計書で起票される現場依頼。本書では起票後の管理工程を扱う'),
      @('修理管理', 'タスク管理配下で修理申請を受付・進行する業務。`repair_management` で認可する'),
      @('登録済み資産', '資産台帳 `asset_ledgers` に存在し、`application_assets.asset_ledger_id` を保持する修理対象'),
      @('未登録資産', '資産台帳に登録せず、`repair_request_details.manual_item_name` 等の手入力列と `application_assets` スナップショットで保持する修理対象'),
      @('院内修理', '`repair_request_details.repair_category=''IN_HOUSE''`。外部見積・発注工程をスキップし、`applications.status=''納期確定''` としてSTEP3へ進む'),
      @('院外修理', '`repair_request_details.repair_category=''OUTSOURCED''`。見積依頼、見積登録、発注、検収へ進む'),
      @('修理不能', '通常却下と区別するため `application_task_steps.completion_reason=''UNREPAIRABLE''` を保持し、廃棄申請接続APIで後続廃棄申請を作成する判断')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面パス', '利用目的'); Rows = @(
      @('修理管理タブ画面', '/quotation-data-box/repair-requests', '修理申請受付一覧と修理タスク管理リストを表示し、詳細画面へ遷移する'),
      @('修理申請管理タスク画面', '/repair-task', '修理申請を受付から完了まで4ステップで進行する')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'API の位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、起票済み修理申請の受付から修理管理タスクの完了までを扱う。修理申請の起票前準備と起票登録は No.6 修理申請API設計書を正本とし、本書では `/repair-request` 系APIを定義しない。' },
    @{ Type = 'Paragraph'; Text = '修理不能から廃棄申請へ接続する場合は、登録済み資産と未登録資産の両方を対象とし、廃棄申請側の `disposal_application_details.related_repair_application_id` に元修理申請IDを保持する。未登録資産の場合も資産台帳へ登録せず、修理申請内の手入力情報と申請明細スナップショットを廃棄対象物品情報として引き継ぐ。修理申請を経由しない未登録資産の単独廃棄申請は本書の対象外である。' },
    @{ Type = 'Heading2'; Text = '画面と API の関係' },
    @{ Type = 'Table'; Headers = @('画面操作', 'API', '補足'); Rows = @(
      @('修理管理タブ初期表示/フィルター', '`GET /quotation-data-box/repair-requests/tasks`', '受付一覧と修理タスク一覧を取得する'),
      @('修理タスク削除', '`DELETE /repair-task/tasks/{repairTaskId}`', '見積登録済かつ発注前の修理タスクを論理削除し、修理管理タブ一覧から除外する'),
      @('修理タスク詳細表示', '`GET /repair-task/tasks/{repairTaskId}`', 'STEP表示、入力済み内容、プレビュー、添付を取得する'),
      @('院内/院外振り分け', '`POST /repair-task/tasks/{repairTaskId}/approve`', 'STEP1の受付判定を保存する'),
      @('申請却下', '`POST /repair-task/tasks/{repairTaskId}/reject`', 'STEP1またはSTEP2の通常却下を保存する'),
      @('見積依頼先登録・依頼送信', '`POST /repair-task/tasks/{repairTaskId}/vendor-requests`', '院外修理の見積依頼先と送付情報を保存する'),
      @('見積依頼完了', '`POST /repair-task/tasks/{repairTaskId}/vendor-requests/complete`', '送信済み見積依頼が1件以上あることを確認し、STEP2へ進める'),
      @('見積登録', '`POST /repair-task/tasks/{repairTaskId}/quotations`', '見積ヘッダー、見積明細、見積原本添付を保存する'),
      @('登録済み見積削除', '`DELETE /repair-task/tasks/{repairTaskId}/quotations/{quotationId}`', 'STEP2で発注前の登録済み見積を論理削除する'),
      @('発注書発行', '`POST /repair-task/tasks/{repairTaskId}/order`', '採用見積から発注情報を作成し `発注済` へ進める'),
      @('引取/発送・納期確定', '`POST /repair-task/tasks/{repairTaskId}/pickup`', '引取日、修理品納品予定日、納期確定を保存する'),
      @('検収登録', '`POST /repair-task/tasks/{repairTaskId}/inspection`', '修理報告書、検収金額、仮勘定科目を保存し `検収登録` へ進める。院外発注修理では `orders` / `order_items` を更新し、登録済み資産の院外発注修理では `individuals` も更新する'),
      @('完了登録', '`POST /repair-task/tasks/{repairTaskId}/complete`', '固定資産番号を、登録済み資産の院外発注修理で作成済みの `individuals` がある場合に保存する。最終勘定科目は `quotation_items` または `application_documents` に保存し `完了` へ進める'),
      @('ドキュメント追加/削除', '`POST /repair-task/tasks/{repairTaskId}/documents` / `DELETE /repair-task/tasks/{repairTaskId}/documents/{documentId}`', '修理依頼書、見積書、発注書、修理報告書、納品書等のファイルメタデータを管理する'),
      @('対象品の廃棄申請へ', '`POST /repair-task/tasks/{repairTaskId}/disposal-application`', 'STEP2の見積登録済で、登録済み資産または未登録資産の修理不能から廃棄申請を作成する。元修理申請は `却下` / `UNREPAIRABLE` で終端する')
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル名', '利用種別', '用途'); Rows = @(
      @('`applications`', 'READ / CREATE / UPDATE', '修理申請ヘッダー、申請者情報、状態、却下情報。修理不能から廃棄申請へ接続する場合は廃棄申請ヘッダーを作成する'),
      @('`repair_request_details`', 'READ / UPDATE', '修理対象の登録済/未登録区分、症状、修理区分、受付情報、現在担当業者、期限、代替機情報。`repair_category` は修理管理STEP1で設定する'),
      @('`application_assets`', 'READ / CREATE', '修理対象機器の明細。登録済み資産は `asset_ledger_id`、未登録資産は表示用スナップショットを保持する。修理不能から廃棄申請へ接続する場合は廃棄対象明細を作成する'),
      @('`application_task_steps`', 'READ / CREATE / UPDATE', '修理タスク工程、スキップ工程、通常却下/修理不能の完了理由'),
      @('`application_status_histories`', 'CREATE / READ', '状態遷移履歴'),
      @('`application_status_definitions`', 'READ', 'REPAIRの保存ステータス、表示順、終端判定'),
      @('`repair_requests` VIEW', 'READ', '修理管理タブ一覧、絞り込み、期限列、タスク遷移用の投影'),
      @('`asset_ledgers`', 'READ', '登録済み資産の施設スコープ確認。未登録資産の廃棄申請接続では作成・更新しない'),
      @('`inspection_results`', 'READ', '修理申請に紐づく点検結果の参照・詳細表示補助'),
      @('`application_documents`', 'READ / CREATE / UPDATE / DELETE', '修理依頼写真、見積書、発注書、修理報告書、納品書等のファイルメタデータ。削除は `deleted_at` 更新による論理削除'),
      @('`rfqs`', 'READ / CREATE / UPDATE', '院外修理の見積依頼グループ。`management_type=''REPAIR''`'),
      @('`rfq_vendors`', 'READ / CREATE / UPDATE', '見積依頼先、依頼送信状態、回答期限'),
      @('`rfq_applications`', 'CREATE / READ', 'RFQと修理申請/申請明細の紐づけ'),
      @('`quotations`', 'READ / CREATE / UPDATE / DELETE', '修理見積ヘッダー、採用見積。削除は発注前見積の `deleted_at` 更新による論理削除'),
      @('`quotation_items`', 'READ / CREATE / UPDATE / DELETE', '修理見積明細。見積削除時は `deleted_at` を更新する'),
      @('`orders` / `order_items`', 'CREATE / READ / UPDATE', '院外発注修理の発注情報、発注明細。検収登録時に納品日、検収日、金額を更新する。院内修理では作成しない'),
      @('`individuals`', 'CREATE / READ / UPDATE', '登録済み資産かつ院外発注修理の検収金額、仮勘定科目、固定資産番号、検収日を保持する中間正本。`order_item_id` / `rfq_id` が必須のため院内修理では作成しない。未登録資産では作成しない'),
      @('`disposal_application_details`', 'CREATE', '登録済み資産または未登録資産の修理不能から廃棄申請を作成する場合の関連修理申請ID'),
      @('`vendors`', 'READ', '業者マスタID指定時の見積依頼先・見積業者存在確認'),
      @('`users`', 'READ', 'ログインユーザーの表示名、所属、連絡先、処理者情報')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API 共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON。ファイル実体アップロードは別ストレージ連携を前提とし、本APIでは `application_documents` のメタデータを扱う',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-05-19T10:00:00+09:00`）',
      '日付形式: `YYYY-MM-DD`',
      '認証済みAPIは Bearer トークンを `Authorization` ヘッダーに付与する',
      '各APIは Bearer トークン上の作業対象施設を基準に自施設データのみ処理する'
    ) },
    @{ Type = 'Heading2'; Text = '認証・認可' },
    @{ Type = 'Paragraph'; Text = '本API群で使用する `feature_code` は `repair_management` である。メニューからの修理依頼起票に使用する `repair_request_create` は No.6 修理申請API設計書で扱い、本書では修理管理タブ一覧と修理タスク操作の実効権限を判定する。画面表示用の `/auth/context` はUX用キャッシュであり、各業務APIでも同条件を再判定する。' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('修理管理一覧、修理タスク詳細、工程進行、廃棄申請接続', '`repair_management`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '修理管理担当者が修理タスクを進行する')
    ) },
    @{ Type = 'Heading2'; Text = 'ステータス・工程共通ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`applications.application_type=''REPAIR''` の保存ステータスは `新規申請` / `見積依頼済` / `見積登録済` / `発注済` / `納期確定` / `検収登録` / `完了` / `却下` を正本とする',
      '修理管理で受け付ける起票済み申請は `新規申請` とする。画面表示上の `依頼受付` は保存値にしない',
      '修理管理タブの表示上の `発注登録済` は `発注済`、`作業日確定` は `納期確定` に対応させる',
      '通常却下は `applications.status=''却下''`、`application_task_steps.completion_reason=''REJECTED''` とする',
      '修理不能から廃棄申請へ接続する場合は `applications.status=''却下''`、`application_task_steps.completion_reason=''UNREPAIRABLE''` とし、履歴コメント入力は要求しない',
      '院内修理は `repair_category=''IN_HOUSE''` と `status=''納期確定''` を保存し、外部見積・発注工程は `application_task_steps` で `SKIPPED_IN_HOUSE_REPAIR` として扱う',
      '院外修理は `repair_category=''OUTSOURCED''` とし、見積依頼、見積登録、発注、納期確定、検収登録、完了へ進行する'
    ) },
    @{ Type = 'Heading2'; Text = '登録済み資産・未登録資産の扱い' },
    @{ Type = 'Bullets'; Items = @(
      '登録済み資産は `application_assets.asset_ledger_id` を保持し、申請時点の品目、メーカー、型式、シリアルNo.、設置場所を `application_assets` にスナップショット保存する',
      '未登録資産は `asset_ledgers` へ登録しない。`repair_request_details.manual_item_name`、`manual_maker_name`、`manual_model_name`、`manual_serial_no`、`manual_department_name`、`manual_room_name` と `application_assets` の表示用スナップショットに保持する',
      '未登録資産の修理が完了しても資産台帳に対する CRUD は行わない',
      '修理不能から廃棄申請へ接続する場合は登録済み資産と未登録資産の両方を対象とする',
      '未登録資産の廃棄申請は修理申請経由のみ対象とし、修理申請を経由しない未登録資産の単独廃棄申請は扱わない'
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや競合理由の補足')
    ) },
    @{ Type = 'Heading2'; Text = '共通DTO' },
    @{ Type = 'Paragraph'; Text = '複数APIで共通利用する入出力DTOを以下に定義する。各業務API内で所有者や工程が一意に決まる添付は、リクエスト本文で `ownerType` を受け取らず、処理仕様に従って `application_documents` の実FKへ保存する。`DocumentCreateInput` を保存するAPIは、認証ユーザーIDを `uploaded_by_user_id`、現在日時を `uploaded_at` に設定する。' },
    @{ Type = 'Heading3'; Text = 'DocumentCreateInput' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentCreateInputRows },
    @{ Type = 'Heading3'; Text = 'RepairTaskStep' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $repairTaskStepRows },
    @{ Type = 'Heading3'; Text = 'RepairVendorRequest' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $repairVendorRequestRows },
    @{ Type = 'Heading3'; Text = 'RepairQuotation' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $repairQuotationRows },
    @{ Type = 'Heading3'; Text = 'RepairQuotationItem' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $repairQuotationItemRows },
    @{ Type = 'Heading3'; Text = 'RepairOrder' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $repairOrderRows },

    @{ Type = 'Heading1'; Text = '第4章 API 一覧' },
    @{ Type = 'Table'; Headers = @('No', 'API名', 'メソッド', 'パス', '用途', '権限'); Rows = @(
      @('1', '修理管理タブ一覧取得', 'GET', '/quotation-data-box/repair-requests/tasks', '申請受付一覧と修理タスク一覧を取得する', '`repair_management`'),
      @('2', '修理タスク詳細取得', 'GET', '/repair-task/tasks/{repairTaskId}', '修理タスク詳細とSTEP表示情報を取得する', '`repair_management`'),
      @('3', '受付判定登録', 'POST', '/repair-task/tasks/{repairTaskId}/approve', '院内/院外振り分けを登録する', '`repair_management`'),
      @('4', '申請却下', 'POST', '/repair-task/tasks/{repairTaskId}/reject', '通常却下を登録する。修理不能として廃棄申請へ接続する場合は廃棄申請接続APIを使用する', '`repair_management`'),
      @('5', '見積依頼先登録・送信', 'POST', '/repair-task/tasks/{repairTaskId}/vendor-requests', '院外修理の見積依頼先を登録し依頼送信する', '`repair_management`'),
      @('6', '見積依頼完了', 'POST', '/repair-task/tasks/{repairTaskId}/vendor-requests/complete', '送信済み見積依頼を確認しSTEP2へ進める', '`repair_management`'),
      @('7', '修理見積登録', 'POST', '/repair-task/tasks/{repairTaskId}/quotations', '修理見積ヘッダー・明細・添付を登録する', '`repair_management`'),
      @('8', '修理見積削除', 'DELETE', '/repair-task/tasks/{repairTaskId}/quotations/{quotationId}', '発注前の登録済み見積を論理削除する', '`repair_management`'),
      @('9', '修理発注登録', 'POST', '/repair-task/tasks/{repairTaskId}/order', '採用見積から発注情報を作成する', '`repair_management`'),
      @('10', '引取/発送・納期確定登録', 'POST', '/repair-task/tasks/{repairTaskId}/pickup', '引取日、修理品納品予定日、納期確定を登録する', '`repair_management`'),
      @('11', '検収登録', 'POST', '/repair-task/tasks/{repairTaskId}/inspection', '修理報告書・検収金額・仮勘定科目を登録する', '`repair_management`'),
      @('12', '完了登録', 'POST', '/repair-task/tasks/{repairTaskId}/complete', '固定資産番号・最終勘定科目を登録し完了する', '`repair_management`'),
      @('13', 'ドキュメント登録', 'POST', '/repair-task/tasks/{repairTaskId}/documents', '修理関連ドキュメントを追加する', '`repair_management`'),
      @('14', 'ドキュメント削除', 'DELETE', '/repair-task/tasks/{repairTaskId}/documents/{documentId}', '修理関連ドキュメントを削除する', '`repair_management`'),
      @('15', '修理タスク削除', 'DELETE', '/repair-task/tasks/{repairTaskId}', '見積登録済かつ発注前の修理タスクを論理削除する', '`repair_management`'),
      @('16', '廃棄申請接続', 'POST', '/repair-task/tasks/{repairTaskId}/disposal-application', '登録済み資産または未登録資産の修理不能から廃棄申請を作成する', '`repair_management`')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 修理管理機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '修理管理タブ一覧取得（/quotation-data-box/repair-requests/tasks）'
        Overview = '修理管理タブの申請受付一覧と修理タスク管理リストを取得する。'
        Method = 'GET'
        Path = '/quotation-data-box/repair-requests/tasks'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('step', 'query', 'string', '-', '`ALL` / `REQUEST` / `QUOTE_REQUEST` / `QUOTE_REGISTERED` / `ORDERED` / `SCHEDULED` / `INSPECTED` / `COMPLETED` / `REJECTED`'),
          @('repairCategory', 'query', 'string', '-', '`IN_HOUSE` / `OUTSOURCED`'),
          @('alternativeUnreturnedOnly', 'query', 'boolean', '-', '代替品未返却のみ表示する場合 true'),
          @('departmentName', 'query', 'string', '-', '申請部署の部分一致'),
          @('page', 'query', 'int32', '-', 'ページ番号。未指定時 1'),
          @('pageSize', 'query', 'int32', '-', '1ページ件数。未指定時 50')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          '`repair_requests` VIEW を一覧表示の起点として取得し、VIEWに含まれない `repair_category`、`is_registered_asset`、`asset_ledger_id`、操作可否判定に必要な現在工程は `repair_request_details`、代表 `application_assets`、必要に応じて `application_task_steps` を補助結合して返す',
          '`applications.application_type=''REPAIR''`、作業対象施設、`deleted_at IS NULL` の行に限定する',
          '申請受付一覧は `status=''新規申請''` の行を未処理件数として集計する',
          'ステップタブの表示ラベルは画面に合わせるが、保存ステータスは `application_status_definitions` の `REPAIR` を正本とする',
          '既定並び順は未処理申請を先頭、以降 `requested_on DESC, repair_request_id DESC` とする',
          'レスポンスには各行の `availableActions` を返し、保存ステータス、登録済み資産区分、修理区分に基づく操作ボタン表示をこの値で制御する。`status=''見積登録済''` かつ発注前の場合のみ `DELETE_TASK` を含める'
        )
        ResponseTitle = 'レスポンス（200：RepairTaskListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('pendingCount', 'int32', '✓', '申請受付の未処理件数'),
          @('items', 'RepairTaskListItem[]', '✓', '一覧行'),
          @('totalCount', 'int32', '✓', '総件数'),
          @('page', 'int32', '✓', 'ページ番号'),
          @('pageSize', 'int32', '✓', '1ページ件数')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（RepairTaskListItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $repairRequestSummaryRows
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'RepairTaskListResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '修理タスク詳細取得（/repair-task/tasks/{repairTaskId}）'
        Overview = '修理申請管理タスク画面に表示する申請情報、修理詳細、工程、見積、発注、添付、プレビュー情報を取得する。'
        Method = 'GET'
        Path = '/repair-task/tasks/{repairTaskId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '`applications.application_id`。修理申請ID')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          '`applications`、`repair_request_details`、代表 `application_assets`、`application_task_steps` を取得する',
          '登録済み資産は `application_assets.asset_ledger_id`、未登録資産は `repair_request_details.manual_item_name` 等の手入力列を優先して表示値を組み立てる',
          '`rfqs`、`rfq_vendors`、`quotations`、`quotation_items`、`orders`、`order_items`、`individuals`、`application_documents` を必要に応じて結合する',
          'ステータスから初期表示STEPを算出し、URL IDやモック固定mapには依存しない',
          '`status=''見積登録済''` かつ `repair_category=''OUTSOURCED''` の場合は、登録済み資産・未登録資産のどちらでも `availableActions` に `CREATE_DISPOSAL_APPLICATION` を含める。院内修理、STEP2以外、または修理対象物品情報が不足する場合は含めない'
        )
        ResponseTitle = 'レスポンス（200：RepairTaskDetailResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('task', 'RepairTaskDetail', '✓', '修理タスク詳細'),
          @('steps', 'RepairTaskStep[]', '✓', '工程表示情報'),
          @('inspection', 'RepairInspectionSummary', '-', 'STEP3 検収入力済み値'),
          @('completion', 'RepairCompletionSummary', '-', 'STEP4 完了入力済み値'),
          @('documents', 'DocumentSummary[]', '✓', '添付ドキュメント一覧'),
          @('availableActions', 'string[]', '✓', '表示可能操作')
        )
        ResponseSubtables = @(
          @{
            Title = 'task要素（RepairTaskDetail）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $repairRequestSummaryRows + @(
              @('symptomText', 'string', '✓', '症状'),
              @('freeComment', 'string', '-', 'フリーコメント'),
              @('receptionDepartment', 'string', '-', '受付部署'),
              @('receptionPerson', 'string', '-', '受付担当者'),
              @('receptionContact', 'string', '-', '受付連絡先'),
              @('vendorRequests', 'RepairVendorRequest[]', '✓', '見積依頼先'),
              @('quotations', 'RepairQuotation[]', '✓', '登録済み見積'),
              @('order', 'RepairOrder', '-', '発注情報')
            )
          },
          @{
            Title = 'steps要素（RepairTaskStep）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $repairTaskStepRows
          },
          @{
            Title = 'vendorRequests要素（RepairVendorRequest）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $repairVendorRequestRows
          },
          @{
            Title = 'quotations要素（RepairQuotation）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $repairQuotationRows
          },
          @{
            Title = 'quotations 配下 items 要素（RepairQuotationItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $repairQuotationItemRows
          },
          @{
            Title = 'order要素（RepairOrder）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $repairOrderRows
          },
          @{
            Title = 'documents要素（DocumentSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $documentRows
          },
          @{
            Title = 'inspection要素（RepairInspectionSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('deliveredOn', 'date', '-', '`repair_request_details.delivered_on`'),
              @('inspectionOn', 'date', '-', '院外発注修理では `orders.inspection_on`、登録済み資産の院外発注修理では `individuals.inspected_on` も参照する。院内修理では申請履歴上の検収登録日として返す'),
              @('inspectionAmount', 'decimal', '-', '院外発注修理では `orders.total_amount`、登録済み資産の院外発注修理では `individuals.acquisition_amount` も参照する'),
              @('provisionalAccountTitle', 'string', '-', '登録済み資産の院外発注修理では `individuals.provisional_account_title`。未登録資産または院内修理では検収書類の `application_documents.account_type` / `account_other_text`'),
              @('individualId', 'int64', '-', '登録済み資産かつ院外発注修理で作成または更新した `individuals.individual_id`')
            )
          },
          @{
            Title = 'completion要素（RepairCompletionSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('fixedAssetNo', 'string', '-', '`individuals.fixed_asset_no`'),
              @('finalAccountTitle', 'string', '-', '`quotation_items.account_title` または `application_documents.account_type` / `application_documents.account_other_text`'),
              @('completedOn', 'date', '-', '完了登録日。`applications.status=''完了''` 到達履歴から表示用に返す'),
              @('alternativeReturnedFlag', 'boolean', '-', '`repair_request_details.alternative_returned_flag`')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'RepairTaskDetailResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '受付判定登録（/repair-task/tasks/{repairTaskId}/approve）'
        Overview = 'STEP1で修理申請を受付し、院内修理または院外修理の振り分けを登録する。通常却下は reject API、修理不能として廃棄申請へ接続する処理は disposal-application API で扱う。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/approve'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('decision', 'string', '✓', '`IN_HOUSE` / `OUTSOURCED`'),
          @('receptionDepartment', 'string', '-', '受付部署'),
          @('receptionPerson', 'string', '-', '受付担当者'),
          @('receptionContact', 'string', '-', '受付連絡先'),
          @('alternativeDeviceStatus', 'string', '-', '`NEEDED` / `NOT_NEEDED` / `REQUESTED`'),
          @('alternativeDeviceInfo', 'string', '-', '代替機情報'),
          @('alternativeDeliveryOn', 'date', '-', '代替機納品日'),
          @('alternativeReturnOn', 'date', '-', '代替機返却予定日'),
          @('pickupOn', 'date', '-', '商品引取日'),
          @('deliveryDueOn', 'date', '-', '修理品納品予定日')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          '対象は `application_type=''REPAIR''` かつ `status=''新規申請''` の修理申請に限定する',
          '`decision=IN_HOUSE` の場合、`repair_request_details.repair_category=''IN_HOUSE''`、`applications.status=''納期確定''` を保存し、外部見積・発注相当工程を `SKIPPED_IN_HOUSE_REPAIR` として完了させる',
          '`decision=OUTSOURCED` の場合、`repair_category=''OUTSOURCED''`、`applications.status=''見積依頼済''` を保存し、STEP1内で見積依頼先登録へ進める',
          '受付部署、受付担当者、受付連絡先、代替機情報、引取日、修理品納品予定日は `repair_request_details` に保存する',
          '状態変更と `application_status_histories`、`application_task_steps` 更新は同一トランザクションで行う'
        )
        ResponseTitle = 'レスポンス（200：RepairTaskActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('repairTaskId', 'int64', '✓', '修理申請ID'),
          @('status', 'string', '✓', '更新後ステータス'),
          @('repairCategory', 'string', '-', '修理区分'),
          @('currentStep', 'string', '✓', '更新後の表示STEP'),
          @('updatedAt', 'datetime', '✓', '更新日時')
        )
        StatusRows = @(
          @('200', '受付判定登録成功', 'RepairTaskActionResponse'),
          @('400', '判定値不正、必須不足', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', '現在ステータスが `新規申請` ではない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '申請却下（/repair-task/tasks/{repairTaskId}/reject）'
        Overview = 'STEP1またはSTEP2で修理申請を通常却下として終端する。修理不能として廃棄申請へ接続する場合は、本APIではなく廃棄申請接続APIを使用する。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/reject'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('completionReason', 'string', '-', '`REJECTED` 固定。未指定時も `REJECTED` として扱う')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          '対象は `application_type=''REPAIR''` かつ `status=''新規申請''` または `status=''見積登録済''` の修理申請に限定する',
          '`completionReason` は未指定または `REJECTED` のみ許可し、通常却下として扱う',
          '`completionReason=UNREPAIRABLE` は受け付けない。修理不能として廃棄申請へ接続する場合は廃棄申請接続APIを使用する',
          '`applications.status=''却下''`、`applications.rejected_by_user_id`、`rejected_by_name`、`rejected_at` を更新する',
          '`application_task_steps.completion_reason` に `REJECTED` を保存する。却下理由コメント入力は要求しない',
          '状態変更、履歴、工程完了は同一トランザクションで行う'
        )
        ResponseTitle = 'レスポンス（200：RepairTaskActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('repairTaskId', 'int64', '✓', '修理申請ID'),
          @('status', 'string', '✓', '`却下`'),
          @('completionReason', 'string', '✓', '`REJECTED`'),
          @('updatedAt', 'datetime', '✓', '更新日時')
        )
        StatusRows = @(
          @('200', '却下終端成功', 'RepairTaskActionResponse'),
          @('400', '入力不正、completionReason不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', '現在ステータスが却下可能状態ではない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '見積依頼先登録・送信（/repair-task/tasks/{repairTaskId}/vendor-requests）'
        Overview = '院外修理で見積依頼先を登録し、修理依頼書プレビューおよび依頼送信状態を保存する。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/vendor-requests'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('requestComment', 'string', '-', '見積依頼コメント'),
          @('quotationDueOn', 'date', '-', '見積提出期限'),
          @('vendors', 'RepairVendorRequestInput[]', '✓', '見積依頼先一覧')
        )
        RequestSubtables = @(
          @{
            Title = 'vendors要素（RepairVendorRequestInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('vendorId', 'int64', '-', '業者マスタID'),
              @('vendorName', 'string', '✓', '送付時点の業者名'),
              @('contactPerson', 'string', '-', '担当者名'),
              @('email', 'string', '-', 'メールアドレス'),
              @('phone', 'string', '-', '連絡先'),
              @('dueOn', 'date', '-', '業者別回答期限')
            )
          }
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          '対象は `repair_category=''OUTSOURCED''` かつ `status=''見積依頼済''` の修理申請に限定する',
          '`rfqs` が未作成の場合は、見積依頼Noを採番し、`rfq_group_name` は修理依頼Noを含む名称、`facility_id` は作業対象施設、`management_type=''REPAIR''`、`workflow_type=''RFQ''`、`quotation_type=''REPAIR''`、`status=''見積依頼''`、`requested_on`、`created_by_user_id` を保存して作成する',
          '依頼送信完了時に `rfqs.status=''見積依頼済''`、`due_on`、`last_status_changed_at` を更新する。RFQ作成時は初期状態 `見積依頼` でINSERTし、同一トランザクション内で状態遷移定義に従って `見積依頼済` へ進める',
          '`rfq_applications` に修理申請IDと代表 `application_asset_id` を紐づける',
          '`vendorId` 指定時は `vendors` に存在し、作業対象施設で利用可能な業者であることを検証する',
          '`rfq_vendors` に依頼先を作成し、`request_status=''SENT''`、先頭業者のみ `is_primary_vendor=true`、その他は false、`requested_at`、`requested_by_user_id` と依頼送信時点値を保存する',
          '`repair_request_details.current_vendor_id`、`current_vendor_name`、`current_vendor_person`、`current_vendor_contact`、`quotation_due_on`、`vendor_request_comment` を一覧表示用スナップショットとして更新する',
          '`applications.status` は `見積依頼済` のまま変更しない。STEP2へ進める処理は見積依頼完了APIで行う'
        )
        ResponseTitle = 'レスポンス（200：RepairTaskActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('repairTaskId', 'int64', '✓', '修理申請ID'),
          @('rfqId', 'int64', '✓', '作成または更新した見積依頼ID'),
          @('status', 'string', '✓', '`見積依頼済`'),
          @('updatedAt', 'datetime', '✓', '更新日時')
        )
        StatusRows = @(
          @('200', '見積依頼先登録成功', 'RepairTaskActionResponse'),
          @('400', '依頼先必須不足、メール形式不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', '院外修理または `見積依頼済` ではない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '見積依頼完了（/repair-task/tasks/{repairTaskId}/vendor-requests/complete）'
        Overview = 'STEP1の見積依頼完了操作で、送信済み見積依頼が1件以上あることを確認し、修理申請をSTEP2の見積登録へ進める。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/vendor-requests/complete'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          '対象は `repair_category=''OUTSOURCED''` かつ `applications.status=''見積依頼済''` の修理申請に限定する',
          '対象修理申請に紐づく `rfqs.management_type=''REPAIR''`、`rfqs.workflow_type=''RFQ''` の未削除RFQを取得する。存在しない場合は409を返す',
          '`rfq_vendors.request_status=''SENT''` の依頼先が1件以上存在することを確認する。送信済み依頼先がない場合は409を返す',
          '`applications.status=''見積登録済''` に更新し、`application_status_histories` に状態遷移を記録する',
          '`application_task_steps` のSTEP1を `COMPLETED`、STEP2を `IN_PROGRESS` として更新する'
        )
        ResponseTitle = 'レスポンス（200：RepairTaskActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('repairTaskId', 'int64', '✓', '修理申請ID'),
          @('status', 'string', '✓', '`見積登録済`'),
          @('updatedAt', 'datetime', '✓', '更新日時')
        )
        StatusRows = @(
          @('200', '見積依頼完了成功', 'RepairTaskActionResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', 'RFQ未作成、送信済み依頼先なし、または現在ステータス不整合', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '修理見積登録（/repair-task/tasks/{repairTaskId}/quotations）'
        Overview = 'STEP2で受領した修理見積を登録する。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/quotations'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('vendorId', 'int64', '-', '見積業者ID'),
          @('vendorName', 'string', '✓', '見積業者名'),
          @('quotationOn', 'date', '✓', '見積日'),
          @('quotationPhase', 'string', '-', '見積フェーズ。未指定時は修理見積'),
          @('totalAmountExclTax', 'decimal', '-', '税抜合計金額'),
          @('storageFormat', 'string', '-', '保存形式'),
          @('items', 'RepairQuotationItemInput[]', '✓', '見積明細'),
          @('documents', 'DocumentCreateInput[]', '-', '見積書原本メタデータ')
        )
        RequestSubtables = @(
          @{
            Title = 'items要素（RepairQuotationItemInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('itemName', 'string', '✓', '品名'),
              @('makerName', 'string', '-', 'メーカー'),
              @('modelName', 'string', '-', '型式'),
              @('quantity', 'int32', '✓', '数量'),
              @('unitPrice', 'decimal', '-', '単価'),
              @('amount', 'decimal', '-', '金額'),
              @('accountTitle', 'string', '-', '仮勘定科目')
            )
          }
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          '対象は `status=''見積登録済''` の修理申請に限定する',
          '対象修理申請に紐づく `rfqs.management_type=''REPAIR''` を取得する。存在しない場合は409を返す',
          '`vendorId` 指定時は `vendors` に存在し、作業対象施設で利用可能な業者であることを検証する',
          '`quotations` は見積番号を採番し、`rfq_id`、業者情報、`quotation_on`、`quotation_phase`（未指定時 `修理見積`）、`total_amount_excl_tax`、`status=''REGISTERED''` を保存して作成する',
          '`quotation_items` は入力行ごとに作成し、`item_type` は未指定のため `E_その他役務`、`original_item_name` / `item_name`、`original_maker_name` / `maker_name`、`original_model_name` / `model_name`、`original_quantity`、`ai_quantity`、`purchase_price_unit`、`purchase_price_total`、`account_title`、`is_specification_line=false` へ保存する',
          '見積原本は `application_documents.owner_type=''QUOTATION''`、`document_category=''QUOTATION''`、`document_type=''見積書''` としてメタデータを保存する',
          '採用見積の選択は発注登録APIで行うため、本API登録時点では `applications.status` を変更しない'
        )
        ResponseTitle = 'レスポンス（201：RepairQuotationResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('quotationId', 'int64', '✓', '作成した見積ID'),
          @('quotationNo', 'string', '✓', '受領見積番号'),
          @('status', 'string', '✓', '修理申請の現在ステータス'),
          @('createdAt', 'datetime', '✓', '作成日時')
        )
        StatusRows = @(
          @('201', '見積登録成功', 'RepairQuotationResponse'),
          @('400', '入力不正、明細不足', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', 'RFQ未作成または現在ステータス不整合', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '修理見積削除（/repair-task/tasks/{repairTaskId}/quotations/{quotationId}）'
        Overview = '登録済み見積一覧の削除操作で、発注前の修理見積を論理削除する。発注登録で採用済み、または発注済み以降の業務証跡がある見積は削除不可とする。'
        Method = 'DELETE'
        Path = '/repair-task/tasks/{repairTaskId}/quotations/{quotationId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID'),
          @('quotationId', 'path', 'int64', '✓', '削除対象の見積ID')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          '対象修理申請は `applications.application_type=''REPAIR''`、`applications.deleted_at IS NULL`、作業対象施設内、`status=''見積登録済''` に限定する',
          '対象見積は、対象修理申請に紐づく `rfqs.management_type=''REPAIR''` 配下の `quotations` で、`deleted_at IS NULL` かつ `status=''REGISTERED''` のものに限定する',
          '`orders.quotation_id=quotationId` が存在する、または修理申請が `発注済` / `納期確定` / `検収登録` / `完了` / `却下` の場合は409を返す',
          '`quotations.deleted_at`、対象見積配下の `quotation_items.deleted_at`、対象見積所有の `application_documents.deleted_at` を同一トランザクションで設定する',
          '`applications.status` は変更しない。削除後に有効見積が0件になってもSTEP2に留まり、見積を再登録可能とする',
          'ファイル実体削除はストレージ側のライフサイクルまたは別処理に委譲する'
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @(
          'Body は返却しない。'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請または対象見積が存在しない', 'ErrorResponse'),
          @('409', '採用済み、発注済み以降、または現在ステータス不整合で削除不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '修理発注登録（/repair-task/tasks/{repairTaskId}/order）'
        Overview = '採用する修理見積から発注情報を作成し、修理申請を `発注済` へ進める。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/order'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('quotationId', 'int64', '✓', '採用する見積ID'),
          @('orderOn', 'date', '✓', '発注日'),
          @('orderDeadlineOn', 'date', '-', '発注期限'),
          @('paymentTerms', 'string', '-', '支払条件。未入力時は `未指定` を保存する'),
          @('documents', 'DocumentCreateInput[]', '-', '発注書メタデータ')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          '対象は `status=''見積登録済''` の修理申請に限定する',
          '指定 `quotationId` が対象修理申請の `rfqs` に紐づくことを検証する',
          '採用見積の有効明細に `purchase_price_unit` または `purchase_price_total` が未設定の行がある場合は、`order_items.unit_price` / `amount` の必須値を作れないため400を返す',
          '`orders` は発注番号を採番し、`rfq_id`、`quotation_id`、採用見積の業者情報、`order_type=''購入''`、`payment_terms`（未入力時 `未指定`）、`order_on`、`status=''ORDERED''`、見積合計金額を保存して作成する',
          '`order_items` は採用見積の `quotation_items` から作成し、`registration_type` は `quotation_items.item_type=''D_付属品''` の場合 `付属品`、それ以外は `本体` とする。品目/メーカー/型式、数量、単価、金額は `quotation_items.item_name` / `maker_name` / `model_name` / `original_quantity` / `purchase_price_unit` / `purchase_price_total` から転記する',
          '`quotations.status=''ORDER_SELECTED''` に更新する',
          '`applications.status=''発注済''`、`repair_request_details.ordered_on`、`order_deadline_on`、`current_vendor_id`、`current_vendor_name`、`current_vendor_person`、`current_vendor_contact` を更新する',
          '発注書メタデータは `application_documents.owner_type=''APPLICATION''`、`step_code=''ORDER''`、`document_category=''CONTRACT''`、`document_type=''発注書''` として保存する',
          '状態変更、発注作成、履歴、工程更新は同一トランザクションで行う'
        )
        ResponseTitle = 'レスポンス（200：RepairOrderResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('orderId', 'int64', '✓', '発注ID'),
          @('orderNo', 'string', '✓', '発注番号'),
          @('status', 'string', '✓', '`発注済`'),
          @('updatedAt', 'datetime', '✓', '更新日時')
        )
        StatusRows = @(
          @('200', '発注登録成功', 'RepairOrderResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請または見積が存在しない', 'ErrorResponse'),
          @('409', '現在ステータス不整合、見積が対象修理申請に紐づかない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '引取/発送・納期確定登録（/repair-task/tasks/{repairTaskId}/pickup）'
        Overview = 'STEP3で商品引取日、修理品納品予定日、納期確定情報を登録する。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/pickup'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('pickupOn', 'date', '-', '商品引取日'),
          @('deliveryDueOn', 'date', '✓', '修理品納品予定日'),
          @('alternativeReturnedFlag', 'boolean', '-', '代替機返却済みフラグ')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          '対象は `status=''発注済''` または院内修理で `status=''納期確定''` の修理申請に限定する',
          '`repair_request_details.pickup_on`、`delivery_due_on`、`alternative_returned_flag` を更新する',
          '院外修理で納期確定する場合は `applications.status=''納期確定''` に更新する',
          '院内修理ですでに `納期確定` の場合はステータスを維持し、入力値のみ更新する',
          '状態変更時は `application_status_histories` と `application_task_steps` を同一トランザクションで更新する'
        )
        ResponseTitle = 'レスポンス（200：RepairTaskActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('repairTaskId', 'int64', '✓', '修理申請ID'),
          @('status', 'string', '✓', '`納期確定`'),
          @('pickupOn', 'date', '-', '商品引取日'),
          @('deliveryDueOn', 'date', '✓', '修理品納品予定日'),
          @('updatedAt', 'datetime', '✓', '更新日時')
        )
        StatusRows = @(
          @('200', '納期確定成功', 'RepairTaskActionResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', '現在ステータスが納期確定可能状態ではない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '検収登録（/repair-task/tasks/{repairTaskId}/inspection）'
        Overview = '修理報告書、検収金額、仮勘定科目等を登録し、修理申請を `検収登録` へ進める。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/inspection'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('deliveredOn', 'date', '✓', '納品日'),
          @('inspectionOn', 'date', '✓', '検収日'),
          @('inspectionAmount', 'decimal', '-', '検収金額'),
          @('provisionalAccountTitle', 'string', '-', '仮勘定科目'),
          @('documents', 'DocumentCreateInput[]', '-', '修理報告書、納品書等のメタデータ')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          '対象は `status=''納期確定''` の修理申請に限定する',
          '`repair_request_details.delivered_on` を更新する',
          '検収書類は `application_documents.owner_type=''APPLICATION''`、`step_code=''INSPECTION''`、`document_category=''REPORT''` / `DELIVERY` / `ACCEPTANCE`、`document_type=''修理報告書''` / `納品書` / `検収書` 等で保存する',
          '院外発注修理の場合は、`orders.delivery_on`、`orders.inspection_on`、`orders.total_amount` と対象 `order_items.delivery_on`、`order_items.amount` を検収入力値で更新する',
          '登録済み資産かつ院外発注修理の場合のみ `individuals` を対象修理明細単位で作成または更新し、必須の `order_item_id`、`rfq_id`、`asset_ledger_id`、品目/メーカー/型式/シリアルのスナップショット、`acquisition_amount=inspectionAmount`、`provisional_account_title`、`inspected_on=inspectionOn`、`registration_status=''PROVISIONAL''` を保持する',
          '院内修理は `rfqs` / `orders` / `order_items` が存在しないため、`order_item_id` / `rfq_id` が必須の `individuals` は作成しない。検収書類、検収金額、仮勘定科目は `application_documents` と申請履歴の表示情報として扱う',
          '未登録資産の場合は院外発注修理であっても `individuals` を作成せず、検収金額は `orders`、仮勘定科目や添付は `application_documents`、対象物品情報は `repair_request_details.manual_item_name` / `manual_maker_name` / `manual_model_name` / `manual_serial_no` / `manual_department_name` / `manual_room_name` と `application_assets` のスナップショットに保持する。資産台帳 `asset_ledgers` の作成・更新は行わない',
          '`applications.status=''検収登録''` に更新し、履歴と工程を同一トランザクションで更新する'
        )
        ResponseTitle = 'レスポンス（200：RepairTaskActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('repairTaskId', 'int64', '✓', '修理申請ID'),
          @('status', 'string', '✓', '`検収登録`'),
          @('deliveredOn', 'date', '✓', '納品日'),
          @('individualId', 'int64', '-', '登録済み資産かつ院外発注修理で作成または更新した `individuals.individual_id`'),
          @('updatedAt', 'datetime', '✓', '更新日時')
        )
        StatusRows = @(
          @('200', '検収登録成功', 'RepairTaskActionResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', '現在ステータスが `納期確定` ではない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '完了登録（/repair-task/tasks/{repairTaskId}/complete）'
        Overview = 'STEP4で固定資産番号、最終勘定科目等を登録し、修理申請を完了する。固定資産番号は登録済み資産の院外発注修理で `individuals` が存在する場合だけ保存対象とし、院内修理や未登録資産では資産台帳CRUDを行わず修理申請履歴として完了する。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/complete'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('fixedAssetNo', 'string', '-', '登録済み資産の院外発注修理で `individuals` が存在する場合に `individuals.fixed_asset_no` へ保存する固定資産番号'),
          @('finalAccountTitle', 'string', '-', '最終勘定科目。採用見積明細の `quotation_items.account_title` または書類補足の `application_documents.account_type` / `application_documents.account_other_text` に保存する'),
          @('completedOn', 'date', '✓', '完了日'),
          @('alternativeReturnedFlag', 'boolean', '-', '代替機返却済みフラグ')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          '対象は `status=''検収登録''` または院内修理で完了可能な `納期確定` の修理申請に限定する',
          '`applications.status=''完了''` に更新する',
          '検収時に作成した `individuals` が存在する場合は `fixed_asset_no` を保存し、登録済み資産の場合のみ `registration_status=''REGISTERED''` に更新する',
          '院内修理など `individuals` が存在しない修理申請では、`fixedAssetNo` を保存できないため、値が指定された場合は400を返す。修理申請の完了、添付、最終勘定科目、代替機返却済みフラグは保存する',
          '未登録資産の場合は `individuals` を作成・更新せず、`asset_ledgers` の作成・更新・削除も行わない',
          '`finalAccountTitle` は採用見積明細が存在する場合は対象 `quotation_items.account_title`、書類単位の補足が必要な場合は `application_documents.account_type` / `application_documents.account_other_text` に保存する',
          '`repair_request_details.alternative_returned_flag` を更新し、代替機未返却表示を解消できる',
          '状態変更、履歴、工程完了は同一トランザクションで行う'
        )
        ResponseTitle = 'レスポンス（200：RepairTaskActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('repairTaskId', 'int64', '✓', '修理申請ID'),
          @('status', 'string', '✓', '`完了`'),
          @('completedOn', 'date', '✓', '完了日'),
          @('updatedAt', 'datetime', '✓', '更新日時')
        )
        StatusRows = @(
          @('200', '完了登録成功', 'RepairTaskActionResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', '現在ステータスが完了可能状態ではない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'ドキュメント登録（/repair-task/tasks/{repairTaskId}/documents）'
        Overview = '修理タスクに修理依頼書、見積書、発注書、修理報告書、納品書等のドキュメントメタデータを追加する。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/documents'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('documentCategory', 'string', '✓', '`REQUEST_ATTACHMENT` / `QUOTATION` / `CONTRACT` / `DELIVERY` / `ACCEPTANCE` / `REPORT` / `PHOTO` / `OTHER` など'),
          @('documentType', 'string', '✓', '`application_documents.document_type`。例: 修理依頼書 / 見積書 / 発注書 / 納品書 / 検収書 / 修理報告書'),
          @('ownerType', 'string', '✓', '`APPLICATION` / `APPLICATION_ASSET` / `RFQ` / `RFQ_VENDOR` / `QUOTATION` / `ASSET_LEDGER`'),
          @('ownerId', 'int64', '✓', '`ownerType` に応じて `application_id`、`application_asset_id`、`rfq_id`、`rfq_vendor_id`、`quotation_id`、`asset_ledger_id` のいずれかへ設定するID'),
          @('stepCode', 'string', '-', '`REQUEST` / `QUOTE` / `ORDER` / `INSPECTION` / `COMPLETE` などの工程コード'),
          @('accountType', 'string', '-', '`application_documents.account_type` に保存する勘定科目区分'),
          @('accountOtherText', 'string', '-', '`application_documents.account_other_text` に保存する勘定科目補足'),
          @('fileName', 'string', '✓', 'ファイル名'),
          @('contentType', 'string', '-', 'MIMEタイプ'),
          @('fileSize', 'int64', '-', 'ファイルサイズ'),
          @('storageKey', 'string', '✓', 'ファイル実体のストレージキー')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          '対象修理申請が作業対象施設内に存在することを検証する',
          '`ownerType` と `ownerId` が対象修理申請、対象申請明細、対象RFQ、対象見積、または対象登録済み資産に紐づくことを検証する',
          '`application_documents` には `owner_type` に応じた実FK（`application_id` / `application_asset_id` / `rfq_id` / `rfq_vendor_id` / `quotation_id` / `asset_ledger_id`）を設定し、生成列 `owner_key` は直接書き込まない',
          '発注書を後続追加する場合は `owner_type=''APPLICATION''`、`application_id=repairTaskId`、`step_code=''ORDER''`、`document_category=''CONTRACT''`、`document_type=''発注書''` として保存する',
          '`application_documents` にファイルメタデータ、工程コード、必要に応じた勘定科目情報を作成する。`storageKey` は `file_path`、`contentType` は `mime_type`、`fileSize` は `file_size_bytes`、認証ユーザーIDは `uploaded_by_user_id`、現在日時は `uploaded_at` に保存する',
          'ファイル実体のアップロード/削除は別ストレージ連携を前提とし、本APIではメタデータ正本を扱う'
        )
        ResponseTitle = 'レスポンス（201：DocumentSummary）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $documentRows
        StatusRows = @(
          @('201', 'ドキュメント登録成功', 'DocumentSummary'),
          @('400', '入力不正、ownerType不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請または所有者が存在しない', 'ErrorResponse'),
          @('409', '所有者が対象修理申請に紐づかない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'ドキュメント削除（/repair-task/tasks/{repairTaskId}/documents/{documentId}）'
        Overview = '修理タスクに紐づくドキュメントメタデータを削除する。'
        Method = 'DELETE'
        Path = '/repair-task/tasks/{repairTaskId}/documents/{documentId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID'),
          @('documentId', 'path', 'int64', '✓', '削除対象ドキュメントID')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          '対象ドキュメントが対象修理申請に紐づくことを検証する',
          '`application_documents.deleted_at` を設定する論理削除とする',
          '確定済み見積、発注、検収に必要な証跡を削除しようとする場合は409を返す',
          'ファイル実体削除はストレージ側のライフサイクルまたは別処理に委譲する'
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @(
          'Body は返却しない。'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請またはドキュメントが存在しない', 'ErrorResponse'),
          @('409', '確定済み工程の証跡で削除不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '修理タスク削除（/repair-task/tasks/{repairTaskId}）'
        Overview = '修理管理タブの削除操作で、見積登録済かつ発注前の修理タスクを論理削除する。発注済み以降の業務証跡がある修理タスクは削除不可とする。'
        Method = 'DELETE'
        Path = '/repair-task/tasks/{repairTaskId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '削除対象の修理申請ID')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          '対象は `applications.application_type=''REPAIR''`、`applications.deleted_at IS NULL`、作業対象施設内、`status=''見積登録済''` の修理申請に限定する',
          '`orders` が作成済み、または `status` が `発注済` / `納期確定` / `検収登録` / `完了` / `却下` の場合は409を返す',
          '`applications.deleted_at` を設定して修理管理タブ一覧から除外する。`asset_ledgers`、`application_assets.asset_ledger_id`、`individuals` は更新しない',
          '紐づく `rfqs` が未発注の場合は `rfqs.deleted_at`、`rfq_vendors.deleted_at`、未採用の `quotations.deleted_at`、`quotation_items.deleted_at` も同一トランザクションで論理削除する。発注済みデータは削除しない',
          '`rfq_applications` は削除済みRFQとの紐づけ履歴として保持し、通常一覧・現在割当判定では `rfqs.deleted_at IS NULL` のRFQのみ有効扱いとする',
          '`application_documents` は監査証跡として物理削除しない。必要な非表示は所有者側の削除状態で制御する',
          '`application_task_steps` は現在工程を `CANCELED`、`completion_reason=''CANCEL''` として終了する'
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @(
          'Body は返却しない。'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', '発注済み以降、削除済み、または現在ステータス不整合で削除不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄申請接続（/repair-task/tasks/{repairTaskId}/disposal-application）'
        Overview = '修理不能となった登録済み資産または未登録資産について、元修理申請を却下終端し、廃棄申請を作成する。未登録資産の場合も資産台帳へ登録せず、修理申請内の手入力情報と申請明細スナップショットを廃棄対象物品情報として引き継ぐ。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/disposal-application'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          '対象は `application_type=''REPAIR''`、`status=''見積登録済''`、`repair_request_details.repair_category=''OUTSOURCED''` の修理申請に限定する',
          '登録済み資産の場合は代表 `application_assets.asset_ledger_id` が存在し、作業対象施設の資産であることを検証する',
          '未登録資産の場合は `repair_request_details.is_registered_asset=false`、代表 `application_assets.asset_ledger_id IS NULL`、`repair_request_details.manual_item_name` など廃棄対象物品の表示に必要な手入力情報が存在することを検証する',
          '元修理申請は `applications.status=''却下''` に更新し、`application_task_steps.completion_reason=''UNREPAIRABLE''` を保存する',
          '`applications` に `application_type=''DISPOSAL''` の廃棄申請ヘッダーを作成する',
          '登録済み資産では `application_assets` に `asset_role=''DISPOSAL''`、元修理対象の `asset_ledger_id` とスナップショットを保存する',
          '未登録資産では `application_assets` に `asset_role=''DISPOSAL''`、`asset_ledger_id=NULL`、元修理申請の `application_assets` スナップショットおよび `repair_request_details.manual_*` から引き継いだ品目、メーカー、型式、シリアルNo.、設置部署、室名を保存する。`asset_ledgers` の作成・更新は行わない',
          '`disposal_application_details` に `disposal_reason_code=''UNREPAIRABLE''`、`related_repair_application_id=元修理申請ID` を保存する',
          '元修理申請の却下終端、廃棄申請作成、履歴作成は同一トランザクションで行う'
        )
        ResponseTitle = 'レスポンス（201：RepairDisposalApplicationResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('repairTaskId', 'int64', '✓', '元修理申請ID'),
          @('repairStatus', 'string', '✓', '`却下`'),
          @('completionReason', 'string', '✓', '`UNREPAIRABLE`'),
          @('disposalApplicationId', 'int64', '✓', '作成した廃棄申請ID'),
          @('disposalApplicationNo', 'string', '✓', '廃棄申請No.'),
          @('createdAt', 'datetime', '✓', '作成日時')
        )
        StatusRows = @(
          @('201', '廃棄申請接続成功', 'RepairDisposalApplicationResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', '対象物品情報不足、院内修理、または現在ステータス不整合', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '必要権限' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定基準', '説明'); Rows = @(
      @('修理管理一覧・詳細・工程操作・削除', '`repair_management`', '作業対象施設に対して実効 `repair_management` を持つこと', '修理管理タブと修理タスクの進行・発注前削除'),
      @('廃棄申請接続', '`repair_management`', '作業対象施設に対して実効 `repair_management` を持つこと', '登録済み資産または未登録資産の修理不能から廃棄申請を作成する')
    ) },
    @{ Type = 'Heading2'; Text = '登録済み資産・未登録資産ルール' },
    @{ Type = 'Bullets'; Items = @(
      '登録済み資産は `asset_ledger_id` 必須とし、作業対象施設の資産であることを検証する',
      '未登録資産は `manualItemName` を必須とし、`asset_ledgers` への登録、更新、削除を行わない',
      '未登録資産でも修理依頼写真は添付できる',
      '未登録資産は修理不能になった場合、修理申請経由の廃棄申請として廃棄申請接続APIで廃棄申請を作成できる',
      '修理申請を経由しない未登録資産の単独廃棄申請は本書では定義せず、入口UI/APIを設けない',
      '未登録資産の修理完了は申請履歴としてDBに保存するだけで、原本資産CRUDは発生しない'
    ) },
    @{ Type = 'Heading2'; Text = '状態遷移ルール' },
    @{ Type = 'Table'; Headers = @('操作', '遷移前', '遷移後', '補足'); Rows = @(
      @('院内修理選択', '新規申請', '納期確定', '`repair_category=IN_HOUSE`。外部見積・発注工程はスキップ扱い'),
      @('院外修理選択', '新規申請', '見積依頼済', '`repair_category=OUTSOURCED`'),
      @('見積依頼完了', '見積依頼済', '見積登録済', 'STEP2へ進む'),
      @('修理見積削除', '見積登録済', '見積登録済', '発注前の登録済み見積を論理削除する。削除後もSTEP2に留まる'),
      @('修理タスク削除', '見積登録済', '論理削除', '`applications.deleted_at` を設定する。発注済み以降は削除不可'),
      @('発注登録', '見積登録済', '発注済', '採用見積から発注を作成する'),
      @('納期確定', '発注済', '納期確定', '院内修理はSTEP1から直接この状態へ進む'),
      @('検収登録', '納期確定', '検収登録', '修理報告書、納品書等を保存する。院外発注修理では `orders` / `order_items` を更新し、登録済み資産の院外発注修理では `individuals` も更新する'),
      @('完了登録', '検収登録', '完了', '未登録資産でも資産CRUDは行わない。未登録資産または `individuals` がない院内修理では固定資産番号を保存しない'),
      @('通常却下', '新規申請 / 見積登録済', '却下', '`completion_reason=REJECTED`'),
      @('修理不能', '見積登録済', '却下', '`completion_reason=UNREPAIRABLE`。登録済み資産または未登録資産の修理申請経由廃棄申請を作成する')
    ) },
    @{ Type = 'Heading2'; Text = '他機能との責務境界' },
    @{ Type = 'Bullets'; Items = @(
      '日常点検APIと点検管理APIは修理申請連携用の初期値までを返し、修理申請の作成は No.6 修理申請API設計書の `POST /repair-request/requests` を正本とする',
      '移動・廃棄管理は作成済み廃棄申請の受付、見積、発注、完了を扱う。修理不能からの廃棄申請起票は本書の接続APIで扱う',
      '修理申請を経由しない未登録資産の単独廃棄申請はPhase1対象外であり、本書では定義しない',
      '修理タスク内で生成するRFQ、見積、発注は `management_type=''REPAIR''` として購入管理・リモデル管理と分離する'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '説明'); Rows = @(
      @('VALIDATION_ERROR', '400', '必須不足、列挙値不正、日付形式不正'),
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
      @('AUTH_403_REPAIR_MANAGEMENT_DENIED', '403', '作業対象施設に対する実効 `repair_management` がない'),
      @('REPAIR_REQUEST_NOT_FOUND', '404', '対象の修理申請が存在しない'),
      @('REPAIR_ASSET_NOT_FOUND', '404', '対象修理申請に紐づく登録済み資産が存在しない'),
      @('REPAIR_STATUS_CONFLICT', '409', '現在ステータスが対象操作を許可しない'),
      @('REPAIR_TASK_DELETE_NOT_ALLOWED', '409', '発注済み以降または削除対象外ステータスのため修理タスクを削除できない'),
      @('REPAIR_QUOTATION_DELETE_NOT_ALLOWED', '409', '採用済み、発注済み以降、または削除対象外ステータスのため修理見積を削除できない'),
      @('REPAIR_DISPOSAL_APPLICATION_NOT_ALLOWED', '409', '現在ステータス、院内修理、または対象物品情報不足により廃棄申請接続を実行できない'),
      @('REPAIR_RFQ_NOT_FOUND', '409', '院外修理の見積依頼グループが未作成'),
      @('REPAIR_VENDOR_REQUEST_NOT_SENT', '409', '見積依頼完了に必要な送信済み依頼先が存在しない'),
      @('REPAIR_QUOTATION_NOT_LINKED', '409', '指定見積が対象修理申請に紐づかない'),
      @('REPAIR_DOCUMENT_LOCKED', '409', '確定済み工程の証跡ドキュメントで削除不可'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = '監査・履歴方針' },
    @{ Type = 'Bullets'; Items = @(
      '修理申請の状態変更は `application_status_histories` に履歴を残す',
      '工程進行、スキップ、通常却下、修理不能は `application_task_steps` の状態と `completion_reason` で追跡する',
      '申請者情報は起票時点のログインユーザー情報を `applications` にスナップショット保存する',
      'ファイル実体の保管、ウイルスチェック、署名URL発行はストレージ基盤側で扱い、本APIは `application_documents` のメタデータを正本とする'
    ) }
  )
}

