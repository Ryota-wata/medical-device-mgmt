$repairManagementPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_management` が有効であること'
)

$workFacilityProcessingLine = 'Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。'

$errorRows = @(
  @('200', '処理成功', '各API定義のレスポンス'),
  @('201', '登録成功', '各API定義のレスポンス'),
  @('204', '削除成功', '-'),
  @('400', '入力値不正、冪等キー未指定、状態遷移不正、登録済/未登録資産の条件不整合', 'ErrorResponse'),
  @('401', '未認証', 'ErrorResponse'),
  @('403', '作業対象施設に対する実効 feature_code なし', 'ErrorResponse'),
  @('404', '作業対象施設、対象申請、対象資産、対象ドキュメントが存在しない', 'ErrorResponse'),
  @('409', '現在ステータス不整合、競合更新、冪等キー競合、対象条件不整合', 'ErrorResponse'),
  @('502', 'Amazon S3へのファイル保存、確定コピー、補償削除、または通常削除に失敗した', 'ErrorResponse'),
  @('503', 'DBコミット成否を確認できない一時的なサービス利用不可', 'ErrorResponse'),
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
  @('requestAlternativeDeviceStatus', 'string', '-', '修理依頼起票時の申請者選択。`NOT_NEEDED` / `NEEDED` / `REQUESTED`。修理管理では上書きしない'),
  @('alternativeUnreturnedFlag', 'boolean', '✓', '代替機納品済みかつ未返却の場合 true'),
  @('availableActions', 'string[]', '✓', '画面から実行可能なPhase1操作。例: `PREVIEW_VENDOR_REQUEST` / `SEND_VENDOR_REQUEST` / `DELETE_VENDOR_REQUEST` / `COMPLETE_VENDOR_REQUEST` / `REGISTER_QUOTATION` / `REGISTER_ADDITIONAL_QUOTATION` / `PREVIEW_QUOTATION` / `PREVIEW_ORDER` / `REGISTER_ORDER` / `REJECT_TASK` / `DELETE_TASK` / `REGISTER_WORK_DATE` / `REGISTER_DOCUMENT` / `PREVIEW_DOCUMENT` / `DELETE_DOCUMENT` / `COMPLETE_TASK` / `CREATE_DISPOSAL_APPLICATION`。STEP2の「メール送信」はPhase2向け表示項目のため含めない')
)

$repairTaskListItemRows = $repairRequestSummaryRows + @(
  @('sourceDepartmentName', 'string', '-', '申請受付一覧の部門名。代表 `application_assets.source_department_name`'),
  @('sourceSectionName', 'string', '-', '申請受付一覧の部署名。代表 `application_assets.source_section_name`'),
  @('sourceRoomName', 'string', '-', '申請受付一覧の室名。代表 `application_assets.source_room_name`'),
  @('vendorName', 'string', '-', '修理タスク管理リストの業者名。`repair_requests.current_vendor_name`。院内対応または未設定時はNULL'),
  @('vendorPerson', 'string', '-', '修理タスク管理リストの業者担当者。`repair_requests.current_vendor_person`。院内対応または未設定時はNULL'),
  @('vendorContact', 'string', '-', '修理タスク管理リストの業者電話番号。`repair_requests.current_vendor_contact`。院内対応または未設定時はNULL'),
  @('deadlineLabel', 'string', '-', '期限列ラベル。`見積提出期限` / `引取日` / `納入予定日`。期限を表示しない状態はNULL'),
  @('deadlineOn', 'date', '-', '期限列の日付。対象日付が未設定または期限を表示しない状態はNULL')
)

$documentRows = @(
  @('documentId', 'int64', '✓', '`application_documents.application_document_id`'),
  @('stepCode', 'string', '✓', '`QUOTATION` / `ORDER` / `COMPLETE` など'),
  @('documentCategory', 'string', '✓', '`QUOTATION` / `ORDER` / `COMPLETE` など'),
  @('documentType', 'string', '✓', '`application_documents.document_type`。見積書 / 発注書 / 院内決済書類 / 修理報告書 / 検収書 / その他 / 見積書（変更が発生した場合） / 納品書 / 請求書'),
  @('documentDate', 'date', '-', '文書日付'),
  @('documentNo', 'string', '-', 'ドキュメントNo.'),
  @('otherDocumentName', 'string', '-', '`documentType=その他` の場合の書類名'),
  @('actualAmountExclTax', 'decimal', '-', '`documentType=見積書（変更が発生した場合）` の場合の実績金額（税別）'),
  @('accountDivisionCode', 'string', '-', '`documentType=見積書（変更が発生した場合）` の場合の勘定科目コード'),
  @('storageFormat', 'string', '-', '`ELECTRONIC_TRANSACTION` / `SCANNED` / `UNSPECIFIED`'),
  @('fileName', 'string', '✓', '`application_documents.file_name`。アップロード時の元ファイル名。右ペインの一覧表示に使用する'),
  @('contentType', 'string', '-', 'MIMEタイプ'),
  @('fileSize', 'int64', '-', 'ファイルサイズ'),
  @('downloadUrl', 'string', '-', '表示・ダウンロード用の認可済みURL。S3オブジェクトキー、S3バケット名、S3の直接URLは返さない'),
  @('uploadedAt', 'datetime', '✓', 'アップロード日時'),
  @('uploadedByName', 'string', '-', 'アップロード者名'),
  @('canDelete', 'boolean', '✓', 'タスク完了前の完了書類で削除可能な場合 true')
)

$documentInputRows = @(
  @('documentType', 'string', '✓', '見積登録では `見積書`。完了書類登録では `院内決済書類` / `修理報告書` / `検収書` / `その他` / `見積書（変更が発生した場合）` / `納品書` / `請求書`'),
  @('filePartName', 'string', '✓', 'multipart/form-data のファイルパート名'),
  @('fileName', 'string', '✓', 'アップロード時の元ファイル名。`application_documents.file_name` に保存し、右ペインの各種完了書類一覧に表示する'),
  @('contentType', 'string', '-', 'MIMEタイプ'),
  @('fileSize', 'int64', '-', 'ファイルサイズ'),
  @('contentHash', 'string', '-', 'ファイル本文のハッシュ値。未指定時はAPI側で算出する'),
  @('documentDate', 'date', '-', '文書日付'),
  @('documentNo', 'string', '-', 'ドキュメントNo.'),
  @('otherDocumentName', 'string', '条件付き', '`documentType=その他` の場合は必須'),
  @('actualAmountExclTax', 'decimal', '条件付き', '`documentType=見積書（変更が発生した場合）` の場合は必須'),
  @('accountDivisionCode', 'string', '条件付き', '`documentType=見積書（変更が発生した場合）` の場合は必須'),
  @('storageFormat', 'string', '✓', '`ELECTRONIC_TRANSACTION` / `SCANNED` / `UNSPECIFIED`')
)

$repairQuotationDocumentInputRows = @(
  @('filePartName', 'string', '✓', 'multipart/form-data の見積書ファイルパート名'),
  @('fileName', 'string', '✓', 'アップロード時の元ファイル名。`application_documents.file_name` に保存し、右ペインの見積書一覧に表示する'),
  @('contentType', 'string', '-', 'MIMEタイプ'),
  @('fileSize', 'int64', '-', 'ファイルサイズ'),
  @('contentHash', 'string', '-', 'ファイル本文のハッシュ値。未指定時はAPI側で算出する'),
  @('storageFormat', 'string', '✓', '`ELECTRONIC_TRANSACTION` / `SCANNED` / `UNSPECIFIED`')
)

$repairTaskStepRows = @(
  @('stepCode', 'string', '✓', '`QUOTE_REQUEST` / `QUOTATION_ORDER` / `WORK_DATE` / `COMPLETE`'),
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
  @('email', 'string', '✓', 'メールアドレス'),
  @('phone', 'string', '-', '電話番号。`rfq_vendors.phone`'),
  @('dueOn', 'date', '-', '回答期限'),
  @('requestNote', 'string', '-', '業者単位の補足'),
  @('isPrimaryVendor', 'boolean', '✓', '主依頼先の場合true'),
  @('requestStatus', 'string', '✓', '`DRAFT` / `SENT` / `REPLIED` / `CANCELED`'),
  @('requestedAt', 'datetime', '-', 'Phase1の依頼送信操作を保存した日時。メール配信成功日時ではない'),
  @('requestedByUserId', 'int64', '-', 'Phase1の依頼送信操作を実行したユーザーID')
)

$repairStep1InputRows = @(
  @('alternativeHandlingRequiredFlag', 'boolean', '✓', '修理管理担当者の代替機対応判断。必要=true、不要=false'),
  @('alternativeDeliveryOn', 'date', '-', '代替機納品日'),
  @('alternativeReturnOn', 'date', '-', '代替機返却予定日'),
  @('alternativeReturnedFlag', 'boolean', '✓', '代替機を返却済みにする場合true'),
  @('pickupRequiredFlag', 'boolean', '✓', '商品引取対応が必要な場合true'),
  @('pickupOn', 'date', '条件付き', '`pickupRequiredFlag=true` の場合に必須')
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
  @('vendorQuotationNo', 'string', '✓', '業者側見積No.'),
  @('rfqVendorId', 'int64', '✓', '見積依頼先ID'),
  @('vendorId', 'int64', '-', '業者マスタID'),
  @('vendorName', 'string', '✓', '見積業者名'),
  @('quotationOn', 'date', '✓', '見積日'),
  @('quotationPhase', 'string', '✓', '`ESTIMATE` / `ORDER_REGISTRATION` / `ADDITIONAL`'),
  @('totalAmountExclTax', 'decimal', '✓', '税抜合計金額'),
  @('accountDivisionCode', 'string', '✓', '勘定科目コード'),
  @('storageFormat', 'string', '✓', '見積書原本の保存形式'),
  @('status', 'string', '✓', '`quotations.status`'),
  @('items', 'RepairQuotationItem[]', '✓', '見積明細'),
  @('document', 'DocumentSummary', '✓', '見積書原本')
)

$repairOrderRows = @(
  @('orderId', 'int64', '✓', '`orders.order_id`'),
  @('orderNo', 'string', '✓', '発注番号'),
  @('quotationId', 'int64', '✓', '唯一の有効な発注登録用見積ID'),
  @('vendorName', 'string', '✓', '発注先業者名'),
  @('orderType', 'string', '✓', '`orders.order_type`。修理発注では `修理` 固定で保存する'),
  @('settlementNo', 'string', '-', '院内決済No.'),
  @('settlementOn', 'date', '-', '決済日'),
  @('orderDocumentDeliveryMethod', 'string', '-', 'Phase1では発注書を送付しないためNULL'),
  @('orderDocumentDeliveryStatus', 'string', '-', 'Phase1では発注書を送付しないためNULL'),
  @('orderDocumentSentAt', 'datetime', '-', 'Phase1では発注書を送付しないためNULL'),
  @('orderOn', 'date', '✓', '発注登録確定日。サーバー側で設定する'),
  @('paymentTerms', 'string', '✓', '`orders.payment_terms`。`未指定` 固定で保存する'),
  @('totalAmount', 'decimal', '-', '`orders.total_amount`'),
  @('status', 'string', '✓', '`orders.status`'),
  @('document', 'DocumentSummary', '✓', '生成・保存した発注書'),
  @('applicationStatus', 'string', '✓', '`発注済`'),
  @('currentStep', 'string', '✓', '`WORK_DATE`'),
  @('updatedAt', 'datetime', '✓', '更新日時')
)

@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_修理管理.docx'
  ScreenLabel = '修理管理'
  CoverDateText = '2026年8月2日'
  CoverVersionText = '1.18'
  RevisionVersionText = '1.18'
  RevisionDateText = '2026/8/2'
  RevisionSummaryText = 'DBコミット結果不明時の冪等再送・S3保全・503復旧手順を明記'
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
      '初回受付時だけログインユーザー情報から受付部署・受付担当者を設定し、以降は保存済み受付情報を表示する方針',
      '導入業者・保守契約は初回受付時にサーバー側で保存する参照情報とし、STEP1の手入力見積依頼先とは分離する方針',
      '申請時の代替機選択 `NOT_NEEDED` / `NEEDED` / `REQUESTED` を保持し、STEP1の必要／不要を別の管理判断として保存する方針',
      '参考見積・発注登録用見積・追加見積の登録上限と発注時の採用見積決定',
      '修理タスク一覧のステータス別期限表示と、複数依頼先の最短見積提出期限の算出',
      '更新POST APIの冪等再送、処理リース、DBコミット結果不明時の復旧、共通ロック順序、DELETEの自然冪等性',
      'ファイル登録時のS3一時保存・確定保存、コミット前失敗時のAPI内補償削除、再送時の残存オブジェクト回収',
      'Phase1の依頼送信操作における依頼先情報の保存と、Phase2向けメール送信表示項目の責務境界',
      'STEP4完了書類の複数ファイル一括登録、条件付き必須項目、論理削除、および修理申請単位の所有関係',
      '通常却下と修理不能による廃棄申請接続の内部識別',
      '登録済み資産および修理申請経由の未登録資産を対象とする廃棄申請接続',
      '申請者情報のログインユーザー自動取得と feature_code 分離'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '修理管理は、No.6 修理申請API設計書で起票された現場からの修理依頼を受け付け、ME室または修理管理担当者が院内対応または外部依頼へ振り分け、STEP1 見積依頼、STEP2 見積登録・発注、STEP3 作業日登録、STEP4 完了登録まで進行する業務機能である。メニューからの修理依頼起票と、タスク管理配下の修理管理は別機能として認可する。' },
    @{ Type = 'Paragraph'; Text = '修理申請の起票APIは No.6 修理申請API設計書で定義する。本書では起票済みの `applications.application_type=''REPAIR''` を対象に、受付後の工程進行、ドキュメント管理、廃棄申請接続を扱う。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('修理申請', 'No.6 修理申請API設計書で起票される現場依頼。本書では起票後の管理工程を扱う'),
      @('修理管理', 'タスク管理配下で修理申請を受付・進行する業務。`repair_management` で認可する'),
      @('登録済み資産', '資産台帳 `asset_ledgers` に存在し、`application_assets.asset_ledger_id` を保持する修理対象'),
      @('未登録資産', '資産台帳に登録せず、`repair_request_details.manual_item_name` 等の手入力列と `application_assets` スナップショットで保持する修理対象'),
      @('院内修理', '`repair_request_details.repair_category=''IN_HOUSE''`。外部見積・発注工程をスキップし、`applications.status=''納期確定''` としてSTEP3へ進む'),
      @('院外修理', '`repair_request_details.repair_category=''OUTSOURCED''`。見積依頼、見積登録・発注、作業日登録、完了登録へ進む'),
      @('発注登録用見積', '`quotations.quotation_phase=''ORDER_REGISTRATION''`。1修理タスクにつき有効な見積を1件だけ許可し、発注時にサーバー側で自動採用する'),
      @('追加見積', '`quotations.quotation_phase=''ADDITIONAL''`。発注後からタスク完了前まで複数登録でき、採用済み発注登録用見積と発注情報は変更しない'),
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
      @('修理管理タブ初期表示/フィルター', '`GET /quotation-data-box/repair-requests/tasks`', '初期表示では `step=RECEPTION` と `step=ALL` を並列実行し、申請受付一覧と受付済み修理タスク一覧を分けて取得する'),
      @('修理タスク削除', '`DELETE /repair-task/tasks/{repairTaskId}`', '見積登録済かつ発注前の修理タスクを論理削除し、修理管理タブ一覧から除外する'),
      @('修理タスク詳細表示', '`GET /repair-task/tasks/{repairTaskId}`', 'STEP表示、入力済み内容、初回受付時の導入業者・保守契約参照情報、プレビュー、添付を取得する'),
      @('院内/院外振り分け', '`POST /repair-task/tasks/{repairTaskId}/approve`', 'STEP1の受付判定、初回受付情報、資産・契約参照情報のスナップショットを保存する'),
      @('申請却下', '`POST /repair-task/tasks/{repairTaskId}/reject`', '有効な発注登録用見積がある発注前のSTEP2で通常却下を保存する'),
      @('見積依頼書プレビュー', '`POST /repair-task/tasks/{repairTaskId}/vendor-requests/preview`', '画面入力中の業者情報から見積依頼書を一時生成し、DB保存せず右ペインへ表示する'),
      @('見積依頼先登録・依頼送信', '`POST /repair-task/tasks/{repairTaskId}/vendor-requests`', '院外修理の見積依頼先、依頼内容、STEP1入力、依頼操作日時、操作ユーザーを保存する。Phase1では実メールを送信しない'),
      @('見積依頼先削除', '`DELETE /repair-task/tasks/{repairTaskId}/vendor-requests/{rfqVendorId}`', 'STEP1完了前の依頼先を一覧から論理削除する'),
      @('見積依頼完了', '`POST /repair-task/tasks/{repairTaskId}/vendor-requests/complete`', '依頼送信操作が保存済みの有効な依頼先が1件以上あることを確認し、STEP2へ進める'),
      @('見積登録', '`POST /repair-task/tasks/{repairTaskId}/quotations`', '参考見積、発注登録用見積、追加見積と見積原本を保存する'),
      @('登録済み見積表示', '`GET /repair-task/tasks/{repairTaskId}/quotations/{quotationId}/preview-url`', '一覧で選択した登録済み見積書の認可済みプレビューURLを取得する'),
      @('登録済み見積削除', '`DELETE /repair-task/tasks/{repairTaskId}/quotations/{quotationId}`', '発注前見積、または発注後から完了前までの追加見積を論理削除し、見積書原本のS3オブジェクトを同期削除する'),
      @('発注書プレビュー', '`POST /repair-task/tasks/{repairTaskId}/order/preview`', '唯一の発注登録用見積から発注書を一時生成し、DB保存せず右ペインへ表示する'),
      @('発注書発行', '`POST /repair-task/tasks/{repairTaskId}/order`', '唯一の発注登録用見積を自動採用し、発注情報と発注書を登録して `発注済` へ進める。発注書送付は行わない'),
      @('作業日登録', '`POST /repair-task/tasks/{repairTaskId}/work-date`', '作業完了予定日を保存しSTEP4へ進める'),
      @('完了書類追加/削除/表示', '`POST /repair-task/tasks/{repairTaskId}/documents` / `DELETE /repair-task/tasks/{repairTaskId}/documents/{documentId}` / `GET /repair-task/tasks/{repairTaskId}/documents/{documentId}/preview-url`', 'STEP4の完了書類を修理申請単位で管理する'),
      @('完了登録', '`POST /repair-task/tasks/{repairTaskId}/complete`', '修理申請と工程を完了し、貸出管理機器が使用不可の場合は貸出可へ戻す。資産台帳・個体情報は更新しない'),
      @('対象品の廃棄申請へ', '`POST /repair-task/tasks/{repairTaskId}/disposal-application`', 'STEP2の見積登録済で、登録済み資産または未登録資産の修理不能から廃棄申請を作成する。元修理申請は `却下` / `UNREPAIRABLE` で終端する')
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル名', '利用種別', '用途'); Rows = @(
      @('`applications`', 'READ / CREATE / UPDATE', '修理申請ヘッダー、申請者情報、状態、却下情報。修理不能から廃棄申請へ接続する場合は廃棄申請ヘッダーを作成する'),
      @('`repair_request_details`', 'READ / UPDATE', '修理対象の登録済/未登録区分、症状、申請時の代替機選択、修理管理の代替機対応判断、修理区分、初回受付情報、初回受付時の導入業者・保守契約参照情報、主依頼先業者、最短見積提出期限、代替機の日付・返却状態、商品引取情報、作業完了予定日。`alternative_device_status` は読取専用とし、`alternative_device_handling_required_flag` と `repair_category` を修理管理で設定する'),
      @('`application_assets`', 'READ / CREATE', '修理対象機器の明細。登録済み資産は `asset_ledger_id`、未登録資産は表示用スナップショットを保持する。修理不能から廃棄申請へ接続する場合は廃棄対象明細を作成する'),
      @('`application_task_steps`', 'READ / CREATE / UPDATE', '修理タスク工程、スキップ工程、通常却下/修理不能の完了理由'),
      @('`application_status_histories`', 'CREATE / READ', '状態遷移履歴'),
      @('`rfq_status_histories`', 'CREATE / READ', '院外修理RFQの作成・見積依頼完了・見積登録・見積削除・発注・納期確定・申請見送り・完了の状態遷移履歴'),
      @('`application_status_definitions`', 'READ', 'REPAIRの保存ステータス、表示順、終端判定'),
      @('`repair_requests` VIEW', 'READ', '修理管理タブ一覧、絞り込み、タスク遷移用の投影。期限列は本VIEWに加えて `repair_request_details` と修理RFQの依頼先情報を補助参照して算出する'),
      @('`asset_ledgers`', 'READ', '登録済み資産の施設スコープ確認、初回受付時の導入業者フォールバック情報。未登録資産の廃棄申請接続では作成・更新しない'),
      @('`maintenance_contract_assets` / `maintenance_contracts`', 'READ', '初回受付時に登録済み資産の有効な保守契約を参照する'),
      @('`inspection_results`', 'READ', '修理申請に紐づく点検結果の参照・詳細表示補助'),
      @('`application_documents`', 'READ / CREATE / UPDATE / DELETE', '見積書、発注書、STEP4完了書類のファイルメタデータ。ファイル実体はAmazon S3に保存し、`file_path` にはS3オブジェクトキーのみ保持する。削除時は `deleted_at` を更新し、対象ファイルを他の有効なドキュメントが参照していない場合にS3オブジェクトを同期削除する'),
      @('`rfqs`', 'READ / CREATE / UPDATE', '院外修理の見積依頼グループ。1修理申請につき有効な `management_type=''REPAIR''`、`workflow_type=''RFQ''` を1件だけ許可する。グループ単位のご依頼事項は `request_comment`、一覧用の最短見積提出期限は `due_on` を保持する'),
      @('`rfq_vendors`', 'READ / CREATE / UPDATE', '手入力した見積依頼先、主依頼先、依頼送信状態、業者別回答期限。修理RFQの有効な `SENT` / `REPLIED` 行に設定された `due_on` の最小値を一覧期限へ同期する'),
      @('`rfq_applications`', 'CREATE / READ', 'RFQと修理申請/申請明細の紐づけ'),
      @('`quotations`', 'READ / CREATE / UPDATE / DELETE', '参考見積、発注登録用見積、追加見積。発注登録用見積は1タスク1有効行、参考見積と追加見積は複数可'),
      @('`quotation_items`', 'READ / CREATE / UPDATE / DELETE', '修理見積明細。画面から明細配列を受け取らず、修理対象と見積金額から1件をサーバー生成する。見積削除時は `deleted_at` を更新する'),
      @('`orders` / `order_items`', 'CREATE / READ', '初回受付時は登録済み資産の登録元発注から導入業者を参照する。発注登録時は院外修理の発注情報と発注明細を作成し、採用した発注登録用見積のサーバー生成済み見積明細を引き継ぐ。Phase1では発注書を送付せず、送付方法・送付状態・送付日時はNULLとする。院内修理では作成しない'),
      @('`lending_devices`', 'READ / UPDATE', 'タスク完了時に修理対象が貸出管理機器かつ `使用不可` の場合、`貸出可` へ戻す'),
      @('`disposal_application_details`', 'CREATE', '登録済み資産または未登録資産の修理不能から廃棄申請を作成する場合の関連修理申請ID'),
      @('`vendors`', 'READ', '初回受付時の導入業者担当者・電話参照、および業者マスタID指定時の見積依頼先・見積業者存在確認'),
      @('`users`', 'READ', 'ログインユーザーの表示名、所属、連絡先、処理者情報、共有システム管理者アカウント判定'),
      @('`api_idempotency_records`', 'READ / CREATE / UPDATE', 'DB更新を伴うPOST APIの冪等キー、正規化済みリクエストハッシュ、処理状態、初回成功結果。`updated_at` はIN_PROGRESSの処理リース判定・更新に使用する。RFQ状態履歴の冪等キーは監査用途とし、本テーブルを再送判定の正本とする'),
      @('`facilities`', 'READ', 'Bearer トークン上の作業対象施設の存在確認、未削除確認'),
      @('`user_facility_assignments`', 'READ', '通常アカウントにおける作業対象施設への有効担当施設割当確認'),
      @('`facility_feature_settings`', 'READ', '通常アカウントにおける施設提供機能 `repair_management` の有効化確認'),
      @('`user_facility_feature_settings`', 'READ', '通常アカウントにおけるユーザー施設別 `repair_management` の有効化確認')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API 共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON。見積書、発注書、修理報告書、納品書等のファイル本体を受け取るPOST APIは multipart/form-data を使用し、`payload` に業務データとファイルメタデータ、`files` にファイル本体を指定する',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-05-19T10:00:00+09:00`）',
      '日付形式: `YYYY-MM-DD`',
      '認証済みAPIは Bearer トークンを `Authorization` ヘッダーに付与する',
      '各APIは Bearer トークン上の作業対象施設を基準に自施設データのみ処理する'
    ) },
    @{ Type = 'Heading2'; Text = 'ファイル保存ルール' },
    @{ Type = 'Bullets'; Items = @(
      '見積書原本とSTEP4完了書類のファイル実体は、対象APIが multipart/form-data の `files` パートとして受け取る。発注書はAPIが生成し、画面からファイルをアップロードしない。いずれも登録確定まではAmazon S3の一時保存領域に置く',
      'ブラウザ上のファイル選択、入力途中、プレビュー表示だけでは業務DBへ保存しない。見積書は「見積書の登録」、完了書類は「ドキュメント登録」、発注書は「発注登録」の確定時に保存する',
      'STEP4完了書類は選択済みの全ファイルを1回の「ドキュメント登録」で一括登録する。画面入力の書類属性は全ファイルへ共通適用し、異なる書類属性で登録するファイルは操作を分ける',
      '一時保存キーは `application-documents/staging/facility-{facilityId}/{operationKey}/{fileKey}.{ext}`、確定保存キーは `application-documents/facility-{facilityId}/{yyyy}/{mm}/{fileKey}.{ext}` とする。`operationKey` は作業対象施設、操作ユーザー、HTTPメソッド、実リクエストパスおよび `Idempotency-Key` から、`fileKey` は操作、ファイル順およびファイル内容ハッシュからサーバー側で決定する。確定保存キーの `{yyyy}/{mm}` は冪等記録の初回受付日時から決定し、月をまたぐ場合も含めて同一リクエストの再送で同じキーを再現可能とする。`Idempotency-Key` 自体はS3キーへ直接含めない',
      '全ファイルの一時保存、DBロック後の再検証、全ファイルの確定保存へのCopyObject、全一時保存オブジェクトのDeleteObjectを順に完了してから、業務データ、`application_documents`、状態履歴、冪等完了記録を同一DBトランザクションで確定する。一時保存オブジェクトを削除できない状態ではDBをコミットせず成功を返さない',
      'STEP4完了書類の一括登録はS3とDBを含めて全件成功または全件失敗とする。一時保存、確定コピー、一時保存削除、DB登録等でDBコミット前のロールバックを確認できた場合は、当該操作で作成した一時保存・確定保存オブジェクトをAPI内で補償削除して `application_documents` を作成しない。COMMIT実行後に成否が不明となった場合は直ちに補償削除せず、冪等再送ルールに従って書込先DBで結果を確認する',
      '`application_documents.file_path` にはS3オブジェクトキーのみ保存し、S3バケット名、S3の直接URL、認可なしで利用できるURLはDBへ保存しない',
      '`application_documents.file_path` には確定保存キーだけを保存し、一時保存キーはDBへ保存しない。アップロードされた原本のファイル名は `application_documents.file_name` に保存する',
      'レスポンスではS3オブジェクトキー、S3バケット名、S3の直接URLを返さず、画面表示やダウンロードが必要な場合は認可済み `downloadUrl` を返す',
      '補償削除では `NoSuchKey` を成功として扱い、一時的な通信エラーまたはAmazon S3が再試行可能と判断できるエラーだけを初回削除に加えて最大3回、指数バックオフで再試行する。補償削除を完了できない場合は502 (`REPAIR_FILE_502_S3_OPERATION_FAILED`) を返し、`operationKey`、対象S3オブジェクトキー、失敗工程、トレースIDを運用ログへ記録する',
      '通常のドキュメント削除APIは `application_documents.deleted_at` をDBで先にコミットし、当該削除対象のドキュメントID群を除いて同じ `file_path` を参照する有効な `application_documents` が存在しない場合だけ、同じAPI内でS3オブジェクトを同期削除する。S3削除に失敗した場合はDBの論理削除を維持して502を返し、同じDELETEの再送でS3削除を再実行する'
    ) },
    @{ Type = 'Heading2'; Text = '更新POST APIの冪等再送ルール' },
    @{ Type = 'Bullets'; Items = @(
      'DB更新を伴うPOST APIである受付判定、申請却下、見積依頼先登録・依頼送信、見積依頼完了、見積登録、発注登録、作業日登録、完了書類登録、完了登録、廃棄申請接続は `Idempotency-Key` ヘッダーを必須とする。DB保存しないプレビューPOSTと参照GETは対象外とする',
      '冪等判定のスコープは、作業対象施設ID、認証ユーザーID、HTTPメソッド、パスパラメータを展開した実リクエストパス、`Idempotency-Key` とする。クライアントは論理操作ごとにUUID等の新しいキーを発行する',
      'JSONはオブジェクトキー順、NULL表現、日付・数値表現を共通規則で正規化してハッシュ化する。multipart/form-data は業務項目に加え、ファイル名、サイズ、MIMEタイプ、ファイル内容ハッシュ、保存形式、ドキュメント属性を正規化済みリクエストハッシュへ含める',
      '`api_idempotency_records` を冪等判定の正本とし、`processing_status=''IN_PROGRESS''` を一意制約の下で確保してから業務処理を開始する。`rfq_status_histories.idempotency_key` はRFQ操作監査用に記録するが、再送判定には使用しない',
      '修理管理APIの `IN_PROGRESS` 処理リースは10分とする。処理中はDBコミット開始前まで `api_idempotency_records.updated_at` を最大60秒間隔で更新する。同一要求の再送時に `updated_at` から10分以内であれば有効な処理中と判断する',
      '業務DBトランザクションを開始する際は処理リースの更新を停止し、対象 `api_idempotency_records` 行を最初に `SELECT ... FOR UPDATE` でロックして同一ハッシュかつ `IN_PROGRESS` であることを再確認してから、共通ロック順で業務行をロックする。これにより、再送側の処理リース回収は初回トランザクションのコミットまたはロールバック完了まで待機する',
      '同一スコープ・同一キー・同一ハッシュの `COMPLETED` は、`response_status` と `response_body_json` に保存した初回HTTPステータス・業務ID・結果をそのまま返し、`Idempotency-Replayed: true` を応答ヘッダーへ付与する。初回が201の登録APIは再送時も201を返し、業務テーブル、ファイルメタデータ、状態履歴を再作成・再更新しない',
      '同一スコープ・同一キーでリクエストハッシュが異なる場合は409 (`IDEMPOTENCY_KEY_REUSED`)、有効な処理リース内の `IN_PROGRESS` は409 (`IDEMPOTENCY_REQUEST_IN_PROGRESS`) と `Retry-After: 5` を返し、キー未指定は400 (`IDEMPOTENCY_KEY_REQUIRED`) とする',
      '処理リースを超過した `IN_PROGRESS` の再送では、書込先DBの新しい接続で対象冪等行を `SELECT ... FOR UPDATE` し、前回トランザクションの終了を待って状態を再確認する。`COMPLETED` なら保存済み結果を返し、ロック取得後も `IN_PROGRESS` であれば業務データと `COMPLETED` は確定していないものとして `FAILED_RETRYABLE` へ原子的に切り替える。読取レプリカは使用しない',
      '`FAILED_RETRYABLE` は同一リクエストハッシュの場合だけ、対象冪等行をロックして `IN_PROGRESS` へ原子的に戻し再実行できる。DBコミット前のロールバックを確認できたDB・S3・一時的な外部処理の5xx/502失敗は `FAILED_RETRYABLE` とする。コミット成否を確認できない503は `IN_PROGRESS` を保持する。入力不正、認証・認可失敗、業務競合等の4xxで業務更新が発生していない場合は予約した冪等行を削除して同一キーを再利用可能とする',
      'ファイル登録の `FAILED_RETRYABLE` 再送では同じ一時保存キーと確定保存キーを再計算し、既知の残存オブジェクトを補償削除してから再実行する。残存オブジェクトを削除できない場合は新しいS3オブジェクトまたは業務データを作成せず502を返す。`COMPLETED` 再送ではS3操作を再実行しない',
      '業務トランザクションの確定と冪等行の `COMPLETED`、`response_status`、`response_body_json` 更新を同一トランザクションで行う。`response_body_json` は業務IDと再送時の結果復元に必要な値だけを保持し、署名付きURL、認証情報、機微情報は保存しない。再送応答でURLが必要な場合は認可確認後に再発行する',
      'COMMIT実行後にタイムアウトまたは接続切断が発生した場合は、一時保存・確定保存オブジェクトを直ちに補償削除しない。書込先DBの新しい接続で同じ冪等スコープとリクエストハッシュの行を再取得し、`COMPLETED` ならS3オブジェクトを保持して保存済み結果を返す。元トランザクションの終了後も `IN_PROGRESS` であることをロック取得により確認できた場合だけ `FAILED_RETRYABLE` へ切り替え、必要な補償削除または再実行を行う',
      'DB障害または確認処理のタイムアウトによりコミット成否を確認できない場合は、`IN_PROGRESS` を保持し、ファイルを伴う操作ではS3オブジェクトも保持したまま、503 (`REPAIR_DB_503_COMMIT_OUTCOME_UNKNOWN`) と `Retry-After: 5` を返す。クライアントは同じ `Idempotency-Key` と同じリクエストで再送し、APIはDB復旧後に前回結果を再確認する',
      '冪等記録の保持期間は共通設定で24時間以上とし、`expires_at` 経過後は後続クリーンアップで削除できる'
    ) },
    @{ Type = 'Heading2'; Text = '更新処理の排他制御ルール' },
    @{ Type = 'Bullets'; Items = @(
      '更新APIは既存行の悲観ロックを使用し、修理管理専用の `lock_version` 列は追加しない',
      '`Idempotency-Key` 対象APIは、業務トランザクション内で対象 `api_idempotency_records` 行を先にロックする。この技術ロックの後に、以下の共通業務行ロック順を適用する',
      '共通ロック順は `applications` → `repair_request_details` → 現在工程の `application_task_steps` → `rfqs` → 対象子行（`rfq_vendors` / `quotations` / `orders` / `application_documents`）→ 他機能連携行（`lending_devices` 等）とする。対象テーブルが存在しない処理はその段階をスキップする',
      'ロック取得後に、作業対象施設、未削除、`application_type=''REPAIR''`、修理区分、申請ステータス、現在STEP、対象RFQ・子行の所属と有効性を再検証する。先行処理によって前提状態が変わっている場合は上書きせず409を返し、画面へ再取得を促す',
      'STEP1の依頼先登録・削除・完了は、共通親行に続いて対象RFQと有効な依頼先行をロックする。STEP2の見積登録・削除・発注・却下・廃棄申請接続は、共通親行に続いて対象RFQ、見積、発注を同じ順序でロックする',
      'STEP4の完了書類登録・削除と完了登録は、先に `applications` と現在工程をロックして直列化する。完了登録が先行した場合、後続の書類登録・削除は409とする',
      '完了登録で貸出管理機器を更新する場合は、修理申請・工程・RFQのロック後に対象 `lending_devices` をロックし、既存の `lock_version` も再確認する'
    ) },
    @{ Type = 'Heading2'; Text = 'DELETE APIの再送ルール' },
    @{ Type = 'Bullets'; Items = @(
      '見積依頼先、見積、完了書類、修理タスクのDELETE APIは `Idempotency-Key` を要求せず、論理削除を利用して自然冪等とする。見積書原本・完了書類のS3削除では、S3の対象なしも削除成功として扱う',
      '対象IDが同一修理申請に属し、作業対象施設内に存在することを削除済み行を含めて確認する。未削除なら共通ロック順で削除可否を再検証して論理削除し、対象が既に論理削除済みの場合はDBを追加更新しない',
      '見積書原本または完了書類を削除するAPIは、対象メタデータの `deleted_at` をDBで先にコミットする。当該削除対象のドキュメントID群を除いて同じ `file_path` を参照する有効な `application_documents` が存在しない場合だけ、DBコミット後にDeleteObjectを同期実行する。他の有効な参照が存在する場合はS3オブジェクトを削除せず204を返す',
      'DeleteObjectで対象なしとなった場合は削除成功として扱う。一時的な通信エラーまたはAmazon S3が再試行可能と判断できるエラーだけを初回削除に加えて最大3回、指数バックオフで再試行する。完了できない場合はDBの論理削除を維持して502 (`REPAIR_FILE_502_S3_OPERATION_FAILED`) を返す',
      '同じDELETEの再送では、対象が論理削除済みでもS3削除対象を再判定し、必要なDeleteObjectを再実行する。S3削除成功、対象なし、または他の有効な参照が存在する場合に204を返す',
      '対象が一度も存在しない、別の修理申請に属する、または作業対象施設外の場合は404を返す。対象が未削除のまま工程進行、採用、発注、完了等により削除不可となった場合は409を返す'
    ) },
    @{ Type = 'Heading2'; Text = 'ファイル登録と冪等・排他制御の順序' },
    @{ Type = 'Bullets'; Items = @(
      '見積登録・完了書類登録は、DB業務行のロックを保持しない状態で全ファイルの検証と内容ハッシュ算出を行い、全ファイルの内容ハッシュを含む最終リクエストハッシュで冪等行を `IN_PROGRESS` として確保してから、共通の決定的な一時保存キーへ保存する。発注登録はDB業務行をロックせずに発注書を一時生成して内容ハッシュを算出し、同様に冪等行を確保してから一時保存する',
      '全ファイルの一時保存後にDBトランザクションを開始し、対象冪等行を先にロックしてから共通ロック順で業務状態を再検証する。検証成功後に全ファイルを決定的な確定保存キーへコピーし、全一時保存オブジェクトの削除を確認してから、業務データ、`application_documents`、状態履歴、冪等行の `COMPLETED` 更新を同一トランザクションで確定する',
      '一時保存途中の失敗、ロック後の業務競合、確定コピー途中の失敗、一時保存削除失敗、DB登録失敗等、DBコミット前のロールバックを確認できる失敗では、当該操作で作成済みの一時保存・確定保存オブジェクトをAPI内で補償削除する。補償削除に成功した場合、業務競合は元の409、DB登録失敗は元の500、Amazon S3処理失敗は502を返し、Amazon S3処理またはDB処理の失敗では冪等行を `FAILED_RETRYABLE` とする。COMMIT実行後に成否が不明な場合は補償削除せず、書込先DBでの再確認または503再送へ進む',
      '補償削除は `NoSuchKey` を成功とし、再試行可能エラーだけを初回に加えて最大3回、指数バックオフで再試行する。完了できない場合は502を返して `operationKey`、対象S3オブジェクトキー、失敗工程、トレースIDを記録する'
    ) },
    @{ Type = 'Heading2'; Text = 'Phase1のメール送信対象外ルール' },
    @{ Type = 'Bullets'; Items = @(
      'STEP1の「依頼送信」は、業者情報、依頼内容、依頼操作日時、操作ユーザーをDBへ保存するPhase1の業務操作であり、実メール送信は行わない',
      '`rfq_vendors.request_status=''SENT''` は依頼送信操作と依頼先情報の登録完了を表し、メール配信成功を意味しない',
      'STEP2の「メール送信」はPhase2向け表示項目とし、Phase1ではAPI呼び出し、DB保存、発注確定、STEP遷移を行わない',
      'Phase1の修理管理APIでは、メール送信API、メール送信用の冪等キー、メール送信失敗エラーを定義しない'
    ) },
    @{ Type = 'Heading2'; Text = '認証・認可' },
    @{ Type = 'Paragraph'; Text = '本API群で使用する `feature_code` は `repair_management` である。メニューからの修理依頼起票に使用する `repair_request_create` は No.6 修理申請API設計書で扱い、本書では修理管理タブ一覧と修理タスク操作の実効権限を判定する。画面表示用の `/auth/context` はUX用キャッシュであり、各業務APIでも同条件を再判定する。通常アカウントでは作業対象施設への有効担当施設割当、施設提供機能、ユーザー施設別機能設定を確認する。共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）では、作業対象施設が未削除であることを確認できれば、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `repair_management` 判定をバイパスする。' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('修理管理一覧、修理タスク詳細、工程進行、廃棄申請接続', '`repair_management`', '`users`, `facilities`, `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '通常アカウントは担当施設割当と実効 `repair_management` を確認する。共有システム管理者アカウントは作業対象施設が未削除であれば通常権限判定をバイパスする')
    ) },
    @{ Type = 'Heading2'; Text = '作業対象施設ベースの認可例外' },
    @{ Type = 'Bullets'; Items = @(
      '各APIは Bearer トークン上の作業対象施設が存在し、未削除であることを確認する',
      '通常アカウントでは、作業対象施設に対する有効担当施設割当と実効 `repair_management` を都度再判定する',
      '共有システム管理者アカウントでは、作業対象施設が未削除であれば通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による認可判定をバイパスする',
      '`applications.application_type=''REPAIR''`、対象修理申請・資産・RFQ・見積・発注・ドキュメントの未削除/作業対象施設所属、保存ステータス遷移順序、院内/院外修理区分、依頼送信操作保存済みの見積依頼先有無、発注前削除可否、修理不能からの廃棄申請接続条件といった業務制約は共有システム管理者でもバイパスしない',
      '通常アカウントで作業対象施設に対して必要な実効 `repair_management` がない場合は403を返す',
      '作業対象施設が存在しない、または削除済みの場合は404を返す'
    ) },
    @{ Type = 'Heading2'; Text = 'ステータス・工程共通ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`applications.application_type=''REPAIR''` の新規フローで使用する保存ステータスは `新規申請` / `見積依頼済` / `見積登録済` / `発注済` / `納期確定` / `完了` / `却下` を正本とする。`検収登録` は旧データ参照時だけSTEP4へ読み替え、新規遷移では使用しない',
      '修理管理で受け付ける起票済み申請は `新規申請` とする。画面表示上の `依頼受付` は保存値にしない',
      '申請受付一覧は `status=''新規申請''` かつ `repair_category IS NULL` の未受付申請、修理タスク管理リストは `repair_category IN (''IN_HOUSE'',''OUTSOURCED'')` の受付済み申請を対象とする。院外修理は受付後も `status=''新規申請''` を維持するが、申請受付一覧には残さずSTEP1の修理タスクとして扱う',
      '修理管理タブの初期表示では一覧取得APIを `step=RECEPTION` と `step=ALL` で並列実行する。`RECEPTION` は申請受付一覧、`ALL` と各工程値は修理タスク管理リストだけを対象とし、未受付申請と受付済み修理タスクを同一ページング結果へ混在させない',
      '修理管理タブの表示上の `発注登録済` は `発注済`、`作業日確定` は `納期確定` に対応させる',
      '通常却下は `applications.status=''却下''`、`application_task_steps.completion_reason=''REJECTED''` とする',
      '修理不能から廃棄申請へ接続する場合は `applications.status=''却下''`、`application_task_steps.completion_reason=''UNREPAIRABLE''` とし、履歴コメント入力は要求しない',
      '院内修理は `repair_category=''IN_HOUSE''` と `status=''納期確定''` を保存し、外部見積・発注工程は `application_task_steps` で `SKIPPED_IN_HOUSE_REPAIR` として扱う',
      '院外修理は `repair_category=''OUTSOURCED''` とし、見積依頼、見積登録・発注、作業日登録、完了登録へ進行する',
      '現在工程は `application_task_steps.is_current` を正本とし、`applications.status` は工程行が存在しない既存データの補完にだけ利用する',
      '`applications.status` の変更時は `application_status_histories`、院外修理の `rfqs.status` の作成・変更時は `rfq_status_histories` を同一トランザクションで追加し、`changed_by_user_id` に各操作を実行した認証ユーザーIDを保存する',
      '工程開始・完了・スキップ・取消時は対象 `application_task_steps.assigned_user_id` に操作ユーザーIDを保存する。初回受付担当者を保持する `repair_request_details.reception_user_id` は変更しない'
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
    @{ Type = 'Paragraph'; Text = '複数APIで共通利用する入出力DTOを以下に定義する。ドキュメント所有者、工程、区分は呼び出しAPIと対象タスクからサーバー側で確定し、クライアントから `ownerType` / `ownerId` / `stepCode` / `documentCategory` を受け付けない。`DocumentInput.fileName` はアップロード時の元ファイル名として `application_documents.file_name` に保存する。ファイル本体はAmazon S3の一時保存から確定保存へ移し、一時保存オブジェクトの削除確認後に確定保存キーを `application_documents.file_path`、認証ユーザーIDを `uploaded_by_user_id`、現在日時を `uploaded_at` に設定する。修理管理ではファイル名とは別の表示タイトルを受け取らず、`application_documents.title` はNULLとする。' },
    @{ Type = 'Heading3'; Text = 'DocumentInput' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentInputRows },
    @{ Type = 'Heading3'; Text = 'RepairTaskStep' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $repairTaskStepRows },
    @{ Type = 'Heading3'; Text = 'RepairVendorRequest' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $repairVendorRequestRows },
    @{ Type = 'Heading3'; Text = 'RepairStep1Input' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $repairStep1InputRows },
    @{ Type = 'Heading3'; Text = 'RepairQuotation' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $repairQuotationRows },
    @{ Type = 'Heading3'; Text = 'RepairQuotationItem' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $repairQuotationItemRows },
    @{ Type = 'Heading3'; Text = 'RepairOrder' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $repairOrderRows },

    @{ Type = 'Heading1'; Text = '第4章 API 一覧' },
    @{ Type = 'Table'; Headers = @('No', 'API名', 'メソッド', 'パス', '用途', '権限'); Rows = @(
      @('1', '修理管理タブ一覧取得', 'GET', '/quotation-data-box/repair-requests/tasks', '`step` に応じて申請受付一覧または受付済み修理タスク一覧を取得する', '`repair_management`'),
      @('2', '修理タスク詳細取得', 'GET', '/repair-task/tasks/{repairTaskId}', '修理タスク詳細とSTEP表示情報を取得する', '`repair_management`'),
      @('3', '受付判定登録', 'POST', '/repair-task/tasks/{repairTaskId}/approve', '院内/院外振り分けを登録する', '`repair_management`'),
      @('4', '申請却下', 'POST', '/repair-task/tasks/{repairTaskId}/reject', '通常却下を登録する。修理不能として廃棄申請へ接続する場合は廃棄申請接続APIを使用する', '`repair_management`'),
      @('5', '修理見積依頼書プレビュー', 'POST', '/repair-task/tasks/{repairTaskId}/vendor-requests/preview', '画面入力中の業者情報から見積依頼書を一時生成する。DB保存しない', '`repair_management`'),
      @('6', '見積依頼先登録・依頼送信', 'POST', '/repair-task/tasks/{repairTaskId}/vendor-requests', '院外修理の依頼先とSTEP1入力を保存する。Phase1では実メールを送信しない', '`repair_management`'),
      @('7', '見積依頼先削除', 'DELETE', '/repair-task/tasks/{repairTaskId}/vendor-requests/{rfqVendorId}', 'STEP1完了前の依頼先を論理削除する', '`repair_management`'),
      @('8', '見積依頼完了', 'POST', '/repair-task/tasks/{repairTaskId}/vendor-requests/complete', '依頼送信操作保存済みの依頼先を確認しSTEP2へ進める', '`repair_management`'),
      @('9', '修理見積登録', 'POST', '/repair-task/tasks/{repairTaskId}/quotations', '参考・発注登録用・追加見積と見積原本を登録する', '`repair_management`'),
      @('10', '修理見積削除', 'DELETE', '/repair-task/tasks/{repairTaskId}/quotations/{quotationId}', '削除可能な登録済み見積を論理削除し、見積書原本のS3オブジェクトを同期削除する', '`repair_management`'),
      @('11', '修理見積プレビュー', 'GET', '/repair-task/tasks/{repairTaskId}/quotations/{quotationId}/preview-url', '登録済み見積書の認可済みプレビューURLを取得する', '`repair_management`'),
      @('12', '修理発注書プレビュー', 'POST', '/repair-task/tasks/{repairTaskId}/order/preview', '発注登録前の発注書を一時生成する。DB保存しない', '`repair_management`'),
      @('13', '修理発注登録', 'POST', '/repair-task/tasks/{repairTaskId}/order', '唯一の発注登録用見積から発注情報を作成する', '`repair_management`'),
      @('14', '作業日登録', 'POST', '/repair-task/tasks/{repairTaskId}/work-date', '作業完了予定日を保存してSTEP4へ進める', '`repair_management`'),
      @('15', '完了書類登録', 'POST', '/repair-task/tasks/{repairTaskId}/documents', 'STEP4の完了書類を修理申請単位で追加する', '`repair_management`'),
      @('16', '完了書類削除', 'DELETE', '/repair-task/tasks/{repairTaskId}/documents/{documentId}', 'タスク完了前の完了書類を論理削除し、S3オブジェクトを同期削除する', '`repair_management`'),
      @('17', '完了書類プレビュー', 'GET', '/repair-task/tasks/{repairTaskId}/documents/{documentId}/preview-url', '完了書類の認可済みプレビューURLを取得する', '`repair_management`'),
      @('18', '完了登録', 'POST', '/repair-task/tasks/{repairTaskId}/complete', '修理申請と現在工程を完了する', '`repair_management`'),
      @('19', '修理タスク削除', 'DELETE', '/repair-task/tasks/{repairTaskId}', '見積登録済かつ発注前の修理タスクを論理削除する', '`repair_management`'),
      @('20', '廃棄申請接続', 'POST', '/repair-task/tasks/{repairTaskId}/disposal-application', '登録済み資産または未登録資産の修理不能から廃棄申請を作成する', '`repair_management`')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 修理管理機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '修理管理タブ一覧取得（/quotation-data-box/repair-requests/tasks）'
        Overview = '修理管理タブの申請受付一覧または修理タスク管理リストを `step` に応じて取得する。画面初期表示では本APIを `step=RECEPTION` と `step=ALL` で並列実行する。'
        Method = 'GET'
        Path = '/quotation-data-box/repair-requests/tasks'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('step', 'query', 'string', '-', '`ALL` / `RECEPTION` / `QUOTE_REQUEST` / `QUOTATION_ORDER` / `WORK_DATE` / `COMPLETE`。未指定時は `ALL`。`RECEPTION` は修理区分未設定の申請受付一覧、その他は修理区分設定済みの進行中修理タスク管理リストだけを対象とする'),
          @('repairCategory', 'query', 'string', '-', '`IN_HOUSE` / `OUTSOURCED`。受付済み修理タスクだけに適用し、`step=RECEPTION` との同時指定は不可'),
          @('alternativeUnreturnedOnly', 'query', 'boolean', '-', '代替品未返却のみ表示する場合 true。受付済み修理タスクだけに適用し、`step=RECEPTION` との同時指定は不可'),
          @('departmentName', 'query', 'string', '-', '申請部署の部分一致'),
          @('page', 'query', 'int32', '-', 'ページ番号。未指定時 1'),
          @('pageSize', 'query', 'int32', '-', '1ページ件数。未指定時 50')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '`repair_requests` VIEW を一覧表示の起点として取得し、VIEWに含まれない `repair_category`、`is_registered_asset`、`asset_ledger_id`、`pickup_required_flag`、`work_planned_on`、操作可否判定に必要な現在工程は `repair_request_details`、代表 `application_assets`、必要に応じて `application_task_steps` を補助結合して返す',
          '申請受付一覧の `sourceDepartmentName`、`sourceSectionName`、`sourceRoomName` は代表 `application_assets` の `source_department_name`、`source_section_name`、`source_room_name` から返す。修理タスク管理リストの `vendorName`、`vendorPerson`、`vendorContact` は `repair_requests.current_vendor_name`、`current_vendor_person`、`current_vendor_contact` から返し、院内対応または未設定時はNULLとする',
          '期限列は `deadlineLabel` / `deadlineOn` で返す。`新規申請` と `見積登録済` は両方NULL、`見積依頼済` は `deadlineLabel=''見積提出期限''`、`deadlineOn=repair_request_details.quotation_due_on` とする。`quotation_due_on` は有効な修理RFQ依頼先（`deleted_at IS NULL` かつ `request_status IN (''SENT'',''REPLIED'')`）の `due_on` 最小値を依頼先登録・論理削除時に同期した値であり、対象日付が全件NULLの場合もラベルは維持して `deadlineOn=NULL` とする',
          '`発注済` は `pickup_required_flag=true` の場合だけ `deadlineLabel=''引取日''`、`deadlineOn=pickup_on` とし、不要の場合は両方NULLとする。`納期確定` と旧データの `検収登録` は `deadlineLabel=''納入予定日''`、`deadlineOn=work_planned_on` とする。代替機の納品日・返却予定日は期限列の算出に使用しない',
          '`requestAlternativeDeviceStatus` は `repair_requests.alternative_device_status` から申請時の `NOT_NEEDED` / `NEEDED` / `REQUESTED` を返す。申請内容モーダルは `NOT_NEEDED` を「不要」、`NEEDED` / `REQUESTED` を「必要」と表示する',
          '`applications.application_type=''REPAIR''`、作業対象施設、`deleted_at IS NULL` の行に限定する',
          '申請受付一覧と `pendingCount` は `status=''新規申請''` かつ `repair_request_details.repair_category IS NULL` の未受付申請だけを対象とする。受付判定済みの院外修理は `status=''新規申請''` でも未処理件数に含めない',
          '修理タスク管理リストは `repair_category IN (''IN_HOUSE'',''OUTSOURCED'')` の受付済み申請を対象とする。`OUTSOURCED` は現在工程STEP1以降、`IN_HOUSE` はSTEP3以降の工程情報に基づいて表示する',
          '`step=RECEPTION` は未受付申請だけを返す。`step=ALL` またはstep未指定時は、受付済みかつ `applications.status NOT IN (''完了'',''却下'')` の修理タスクを工程横断で返し、未受付申請を含めない',
          '`step=QUOTE_REQUEST` / `QUOTATION_ORDER` / `WORK_DATE` / `COMPLETE` は、受付済み修理タスクを `application_task_steps.is_current=true` の現在工程で絞り込む。現在工程が存在しない既存データだけは保存ステータスから工程を補完し、旧データの `検収登録` は `COMPLETE` として扱う。`完了` / `却下` は全stepで表示対象外とする',
          '`step=RECEPTION` と `repairCategory` または `alternativeUnreturnedOnly` が同時指定された場合は400を返す。`departmentName` は未受付申請と受付済み修理タスクのどちらにも適用できる',
          '画面初期表示では本APIを `step=RECEPTION` と `step=ALL` で並列実行し、STEPタブ切替時は修理タスク管理リスト側だけを選択したstepで再取得する。申請受付一覧と修理タスク管理リストのページ番号・総件数は呼び出しごとに独立して扱う',
          'ステップタブの表示ラベルは画面に合わせるが、保存ステータスは `application_status_definitions` の `REPAIR` を正本とする',
          '既定並び順は各呼び出しとも `requested_on DESC, repair_request_id DESC` とし、未受付申請と受付済み修理タスクを混在させた優先順位付けは行わない',
          'レスポンスには各行の `availableActions` を返し、保存ステータス、登録済み資産区分、修理区分に基づく操作ボタン表示をこの値で制御する。`status=''見積登録済''` かつ発注前の場合のみ `DELETE_TASK` を含める'
        )
        ResponseTitle = 'レスポンス（200：RepairTaskListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('pendingCount', 'int32', '✓', '指定stepにかかわらず、`status=新規申請` かつ `repairCategory=NULL` の申請受付未処理件数。受付済み外部依頼は含めない'),
          @('items', 'RepairTaskListItem[]', '✓', '指定stepの一覧行。`step=RECEPTION` は未受付申請だけ、その他は受付済み修理タスクだけを返し、両者を同一レスポンスへ混在させない'),
          @('totalCount', 'int32', '✓', '指定stepとフィルター条件に一致する総件数。未受付申請と受付済み修理タスクを合算しない'),
          @('page', 'int32', '✓', 'ページ番号'),
          @('pageSize', 'int32', '✓', '1ページ件数')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（RepairTaskListItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $repairTaskListItemRows
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'RepairTaskListResponse'),
          @('400', '検索条件不正、または `step=RECEPTION` と修理タスク専用フィルターの同時指定', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、または削除済み', 'ErrorResponse'),
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
          $workFacilityProcessingLine,
          '`applications`、`repair_request_details`、代表 `application_assets`、`application_task_steps` を取得する',
          '登録済み資産は `application_assets.asset_ledger_id`、未登録資産は `repair_request_details.manual_item_name` 等の手入力列を優先して表示値を組み立てる',
          '院外修理では対象申請に紐づく有効な `management_type=''REPAIR''`、`workflow_type=''RFQ''` の `rfqs` を1件だけ取得し、`rfq_vendors`、`quotations`、`quotation_items`、`orders`、`order_items`、`application_documents` を必要に応じて結合する。複数の有効RFQが存在する場合は409としてデータ不整合を返す',
          '見積依頼先は `is_primary_vendor` 降順、`requested_at`、`rfq_vendor_id` 昇順で返す',
          '現在STEPは `application_task_steps.is_current=true` の行を正本とする。現在工程が存在しない既存データに限り、院外修理は `新規申請→STEP1`、`見積依頼済/見積登録済→STEP2`、`発注済→STEP3`、`納期確定/検収登録→STEP4`、院内修理は `納期確定→STEP3` として補完する',
          '登録済み見積一覧は有効行をフェーズ、登録日時、見積IDとともに返し、見積原本のプレビューURLは一覧レスポンスへ含めない。表示押下時に個別プレビューAPIを呼び出す',
          '受付部署・受付担当者・受付連絡先は初回受付時に保存された値を返し、現在のログインユーザー情報で上書きしない',
          '導入業者・保守契約は初回受付時に `repair_request_details` へ保存された参照情報を返し、現在の資産・発注・保守契約情報や画面入力値で上書きしない',
          '本方針適用前に受付済みで導入業者・保守契約参照情報が未設定の既存データはバックフィルせず、未設定のまま返す。`maintenance_contract_flag` がNULLの場合はレスポンス上だけfalseとして返す',
          '`requestAlternativeDeviceStatus` は `repair_request_details.alternative_device_status` の申請時点値、`alternativeHandlingRequiredFlag` は `alternative_device_handling_required_flag` の保存値をそのまま返す。管理判断未保存は `alternativeHandlingRequiredFlag=NULL` とする',
          '`effectiveAlternativeHandlingRequiredFlag` はSTEP1の画面表示用実効値とする。`alternativeHandlingRequiredFlag` が非NULLの場合は保存済み管理判断を返し、NULLの場合だけ `requestAlternativeDeviceStatus` が `NEEDED` / `REQUESTED` ならtrue、`NOT_NEEDED` / NULLならfalseを返す。実効値の算出と詳細取得だけではDBを更新しない',
          '保存済み `vendorRequests` が0件の場合、画面は `installerName`、`installerPerson`、`installerContact` を1行目の編集可能な初期候補に使用できる。候補表示だけでは `rfq_vendors` を作成しない',
          '修理申請書は既存の申請書ドキュメントまたは申請データから生成した短時間有効の認可済みプレビューURLを返す。プレビュー生成だけではDBへ保存しない',
          '右ペインの資産登録情報は `application_assets` と、登録済み資産の場合の `asset_ledgers` から参照表示し、本APIでは更新しない',
          '`repair_category=''OUTSOURCED''`、現在STEPがSTEP2、`status=''見積登録済''`、有効な `quotation_phase=''ORDER_REGISTRATION''` が1件、発注未登録の場合だけ、`availableActions` に `PREVIEW_ORDER` / `REGISTER_ORDER` / `REJECT_TASK` を含める。登録済み資産・未登録資産のどちらでも廃棄対象物品情報が揃う場合は `CREATE_DISPOSAL_APPLICATION` も含める。参考見積だけの場合、発注登録用見積を削除した場合、院内修理、STEP2以外、発注済み、または対象物品情報不足の場合はこれらの操作を含めない'
        )
        ResponseTitle = 'レスポンス（200：RepairTaskDetailResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('task', 'RepairTaskDetail', '✓', '修理タスク詳細'),
          @('steps', 'RepairTaskStep[]', '✓', '工程表示情報'),
          @('workPlannedOn', 'date', '-', 'STEP3で登録した作業完了予定日'),
          @('applicationPreviewUrl', 'string', '✓', '修理申請書の認可済みプレビューURL'),
          @('applicationPreviewExpiresAt', 'datetime', '✓', '修理申請書プレビューURL有効期限'),
          @('assetRegistrationInfo', 'RepairAssetRegistrationInfo', '✓', '右ペインへ参照表示する既存資産情報。完了登録の入力値ではない'),
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
              @('receptionUserId', 'int64', '-', '初回受付を行ったユーザーID'),
              @('receptionContact', 'string', '-', '受付連絡先'),
              @('receptionConfirmedAt', 'datetime', '-', '初回受付確定日時'),
              @('requestComment', 'string', '-', '`rfqs.request_comment`。修理RFQ単位のご依頼事項'),
              @('alternativeHandlingRequiredFlag', 'boolean', '-', '`repair_request_details.alternative_device_handling_required_flag`。修理管理担当者の保存済み判断をそのまま返し、未保存はNULL'),
              @('effectiveAlternativeHandlingRequiredFlag', 'boolean', '✓', 'STEP1の画面表示用実効値。保存済み管理判断を優先し、未保存の場合だけ申請時の `NEEDED` / `REQUESTED` をtrue、`NOT_NEEDED` / NULLをfalseとして算出する'),
              @('alternativeDeviceInfo', 'string', '-', '既存データに代替機情報がある場合の参照表示値。STEP1更新リクエストでは受け取らない'),
              @('alternativeDeliveryOn', 'date', '-', '代替機納品日'),
              @('alternativeReturnOn', 'date', '-', '代替機返却予定日'),
              @('alternativeReturnedFlag', 'boolean', '✓', '代替機返却済みフラグ'),
              @('installerName', 'string', '-', '初回受付時に保存した参照表示用の導入業者名'),
              @('installerPerson', 'string', '-', '初回受付時に保存した参照表示用の導入業者担当者名'),
              @('installerContact', 'string', '-', '初回受付時に保存した参照表示用の導入業者連絡先'),
              @('maintenanceContractFlag', 'boolean', '✓', '初回受付時に保存した保守契約対象フラグ'),
              @('warrantyEndOn', 'date', '-', '初回受付時に保存した保守契約期限'),
              @('pickupRequiredFlag', 'boolean', '✓', '商品引取対応要否'),
              @('pickupOn', 'date', '-', '商品引取日'),
              @('quotationDueOn', 'date', '-', '有効な修理RFQ依頼先の `due_on` 最小値を同期した一覧表示用スナップショット'),
              @('orderedOn', 'date', '-', '発注日'),
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
            Title = 'assetRegistrationInfo要素（RepairAssetRegistrationInfo）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('itemName', 'string', '-', '品名'),
              @('makerName', 'string', '-', 'メーカー'),
              @('modelName', 'string', '-', '型式'),
              @('serialNo', 'string', '-', 'シリアルNo.'),
              @('fixedAssetNo', 'string', '-', '登録済み資産の既存資産番号。`asset_ledgers.asset_no` を参照し、未登録資産はNULL'),
              @('finalAccountTitle', 'string', '-', '登録済み資産の既存勘定科目。`asset_ledgers.account_title` を参照し、未登録資産はNULL')
            )
          },
          @{
            Title = 'documents要素（DocumentSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $documentRows
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'RepairTaskDetailResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', '有効な修理RFQが複数存在する', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '受付判定登録（/repair-task/tasks/{repairTaskId}/approve）'
        Overview = '申請内容モーダルで未受付の修理申請を受け付け、院内修理または院外修理の振り分けを登録する。通常却下は reject API、修理不能として廃棄申請へ接続する処理は disposal-application API で扱う。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/approve'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID'),
          @('Idempotency-Key', 'header', 'string', '✓', '受付判定操作の冪等キー')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('decision', 'string', '✓', '`IN_HOUSE` / `OUTSOURCED`')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps`、既存のREPAIR/RFQをロックし、`application_type=''REPAIR''`、未削除、作業対象施設一致、現在状態を再確認する',
          '`repair_category IS NULL` の場合だけ初回受付として後続処理を実行し、`status=''新規申請''`、受付情報5項目が未設定であることを確認する。修理区分未設定にもかかわらず受付情報または有効なREPAIR/RFQが存在する場合はデータ不整合として409を返す',
          '`repair_category` がリクエストの `decision` と同じ受付済み申請は冪等再送として扱い、受付情報、申請状態、工程、RFQ、履歴を更新せず保存済みの現在結果を200で返す。修理区分設定済みで受付情報がNULLの既存データも再受付・自動補完しない',
          '`repair_category` がリクエストの `decision` と異なる場合は409 (`REPAIR_RECEPTION_DECISION_CONFLICT`) を返し、院内対応と外部依頼の変更を行わない',
          '`decision=IN_HOUSE` の場合、`repair_request_details.repair_category=''IN_HOUSE''`、`applications.status=''納期確定''` を保存し、STEP1・STEP2を `SKIPPED_IN_HOUSE_REPAIR` として完了させてSTEP3を現在工程とする。院内修理ではRFQ、発注、発注明細を作成しない',
          '`decision=OUTSOURCED` の場合、`repair_category=''OUTSOURCED''`、`applications.status=''新規申請''` を維持し、STEP1を現在工程とする。初回受付時に `management_type=''REPAIR''`、`workflow_type=''RFQ''`、`quotation_type=''REPAIR''`、`status=''見積依頼''` のRFQを1件作成し、`rfq_applications` に修理申請と代表明細を紐づける。競合により有効RFQが既に作成された場合はロールバックして409を返す',
          '作成するREPAIR/RFQは、`rfq_no` をサーバー側で一意に採番し、`rfq_group_name=''修理：{修理申請No.}''`、`facility_id=修理申請の対象施設`、`requested_on=受付日`、`created_by_user_id=受付操作ユーザーID` とする',
          '初回受付時だけ、認証済みログインユーザーの所属部署・氏名・ユーザーIDと申請者連絡先を `repair_request_details.reception_department`、`reception_person`、`reception_user_id`、`reception_contact`、`reception_confirmed_at` に保存する。受付済み申請の再送・再アクセスでは保存済み値を維持し、現在のログインユーザー情報で上書きしない',
          '登録済み資産は、`asset_ledgers.source_order_item_id` から `order_items` / `orders` を辿り、`orders.vendor_name`、`orders.vendor_contact_person` を導入業者名・担当者名として優先する。担当者名が未設定の場合は `orders.vendor_id` に対応する有効な `vendors.contact_person`、連絡先は `vendors.phone` を使用する。登録元発注を特定できない場合は `asset_ledgers.delivery_vendor_name` を業者名のフォールバックとし、担当者・連絡先はNULLとする',
          '登録済み資産に `maintenance_contract_assets.excluded_flag=false` で紐づき、受付日時点で `status=''完了''`、契約開始日前でなく契約終了日超過でもない有効な `maintenance_contracts` を検索する。複数時は `contract_start_on`、`maintenance_contract_id` 降順の先頭を採用し、`maintenance_contract_flag=true`、`warranty_end_on=contract_end_on` とする。有効契約がない場合または未登録資産は `maintenance_contract_flag=false`、`warranty_end_on=NULL` とする',
          '導入業者・保守契約参照情報は `repair_request_details.installer_name`、`installer_person`、`installer_contact`、`maintenance_contract_flag`、`warranty_end_on` に初回受付情報と同一トランザクションで保存する。受付済み申請の再送・再アクセス・各STEP操作では再取得・上書きしない',
          'REPAIR/RFQ新規作成時は `rfq_status_histories.action_code=''CREATE_RFQ''` を記録する。状態変更と申請・RFQ履歴、`application_task_steps` 更新は同一トランザクションで行う'
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
          @('409', '初回受付条件不整合、受付済み修理区分と判定値の競合、または修理RFQ不整合', 'ErrorResponse'),
          @('503', 'DBコミット成否を確認できない。S3処理はなく、同じ冪等キーで再送する', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '申請却下（/repair-task/tasks/{repairTaskId}/reject）'
        Overview = 'STEP2の「申請を却下し終了」で修理申請を通常却下として終端する。修理不能として廃棄申請へ接続する場合は、本APIではなく廃棄申請接続APIを使用する。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/reject'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID'),
          @('Idempotency-Key', 'header', 'string', '✓', '申請却下操作の冪等キー')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps`、REPAIR/RFQ、有効な発注登録用見積と既存発注をロックし、後続の状態・所属条件を再確認する',
          '対象は `application_type=''REPAIR''`、`repair_category=''OUTSOURCED''`、現在工程STEP2、`status=''見積登録済''`、発注未登録の修理申請に限定する',
          '対象修理RFQに有効な `quotation_phase=''ORDER_REGISTRATION''` の見積が1件だけ存在することを確認する。0件または2件以上の場合は409を返す',
          '`applications.status=''却下''`、`applications.rejected_by_user_id`、`rejected_by_name`、`rejected_at` を更新する',
          '`application_task_steps.completion_reason` に `REJECTED` を保存する。却下理由コメント入力は要求しない',
          '対象REPAIR/RFQを `status=''申請を見送る''` とし、RFQ状態履歴へ `action_code=''SKIP_APPLICATION''` と操作ユーザーを記録する',
          '申請・RFQ状態変更、履歴、工程完了は同一トランザクションで行う'
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
          @('400', '冪等キー未指定', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', '現在工程・ステータス不整合、発注済み、または有効な発注登録用見積が一意に決まらない', 'ErrorResponse'),
          @('503', 'DBコミット成否を確認できない。同じ冪等キーで再送する', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '修理見積依頼書プレビュー（/repair-task/tasks/{repairTaskId}/vendor-requests/preview）'
        Overview = 'STEP1で入力中の依頼先・代替機・商品引取情報と、保存済みの導入業者・保守契約参照情報から修理見積依頼書を一時生成し、右側の見積依頼書セクションへ表示する。プレビューではDBとAmazon S3へ保存しない。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/vendor-requests/preview'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('requestComment', 'string', '-', '依頼グループ共通のご依頼事項'),
          @('step1', 'RepairStep1Input', '✓', 'STEP1の入力内容'),
          @('vendor', 'RepairVendorRequestInput', '✓', 'プレビュー対象の依頼先')
        )
        RequestSubtables = @(
          @{
            Title = 'step1要素（RepairStep1Input）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $repairStep1InputRows
          },
          @{
            Title = 'vendor要素（RepairVendorRequestInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('vendorId', 'int64', '-', '業者マスタID'),
              @('vendorName', 'string', '✓', '業者名'),
              @('contactPerson', 'string', '-', '担当者名'),
              @('email', 'string', '✓', 'メールアドレス。Phase1では実メール送信に使用しない'),
               @('phone', 'string', '-', '電話番号。`rfq_vendors.phone` に保存する'),
              @('dueOn', 'date', '-', '業者別回答期限'),
              @('requestNote', 'string', '-', '業者単位の補足')
            )
          }
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象は `repair_category=''OUTSOURCED''`、`status=''新規申請''`、現在工程STEP1の修理申請に限定する',
          '申請情報、初回受付情報、入力中の `alternativeHandlingRequiredFlag`、代替機の日付・返却済フラグ、商品引取情報、依頼先、`requestComment` と、DBに保存済みの導入業者・保守契約参照情報を用いて見積依頼書を一時生成する',
          '導入業者・保守契約参照情報、代替機情報の既存参照値、グループ共通の見積提出期限はリクエスト本文から受け取らない。提出期限は `vendor.dueOn` を業者別の入力値とする',
          'プレビューURLは短時間だけ有効な認可済みURLとして返し、`rfqs`、`rfq_vendors`、`application_documents`、Amazon S3には保存しない'
        )
        ResponseTitle = 'レスポンス（200：PreviewResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('previewUrl', 'string', '✓', '右側セクションへ表示する一時プレビューURL'),
          @('expiresAt', 'datetime', '✓', 'プレビューURL有効期限')
        )
        StatusRows = @(
          @('200', 'プレビュー生成成功', 'PreviewResponse'),
          @('400', '業者名・メールの必須不足、メール形式不正、または依頼先情報不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', '院外修理、`新規申請`、またはSTEP1ではない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '見積依頼先登録・依頼送信（/repair-task/tasks/{repairTaskId}/vendor-requests）'
        Overview = 'STEP1の「依頼送信」操作で、手入力した依頼先、依頼内容、代替機・商品引取入力、操作日時、操作ユーザーを保存する。導入業者・保守契約参照情報は上書きしない。Phase1では実メールを送信せず、画面入力だけでは保存しない。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/vendor-requests'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID'),
          @('Idempotency-Key', 'header', 'string', '✓', '見積依頼先登録・依頼送信操作の冪等キー')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('requestComment', 'string', '-', '`rfqs.request_comment` に保存する依頼グループ共通のご依頼事項'),
          @('step1', 'RepairStep1Input', '✓', '保存するSTEP1入力内容'),
          @('vendor', 'RepairVendorRequestInput', '✓', '依頼送信操作の対象となる依頼先')
        )
        RequestSubtables = @(
          @{
            Title = 'step1要素（RepairStep1Input）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $repairStep1InputRows
          },
          @{
            Title = 'vendor要素（RepairVendorRequestInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('vendorId', 'int64', '-', '業者マスタID'),
              @('vendorName', 'string', '✓', '依頼送信操作時点の業者名'),
              @('contactPerson', 'string', '-', '担当者名'),
              @('email', 'string', '✓', 'メールアドレス。Phase1では実メール送信に使用しない'),
              @('phone', 'string', '-', '連絡先'),
              @('dueOn', 'date', '-', '業者別回答期限'),
              @('requestNote', 'string', '-', '`rfq_vendors.request_note` に保存する業者単位の補足')
            )
          }
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps` をロックし、院外修理・STEP1・作業対象施設一致を再確認する',
          '対象は `repair_category=''OUTSOURCED''`、`status=''新規申請''`、現在工程STEP1の修理申請に限定する',
          '対象修理申請に有効な `management_type=''REPAIR''`、`workflow_type=''RFQ''`、`quotation_type=''REPAIR''` のRFQが1件だけ存在することを確認する。未作成または2件以上の場合は409を返す',
          '共通親行に続いて対象 `rfqs` 行と有効な `rfq_vendors` 行をロックして主依頼先の有無を再確認し、同時登録で複数の主依頼先が生じないようにする',
          '`requestComment` は `rfqs.request_comment` に保存し、グループ共通コメントを `repair_request_details.vendor_request_comment` へ二重保存しない',
          '`step1.alternativeHandlingRequiredFlag` を `repair_request_details.alternative_device_handling_required_flag`、納品日・返却予定日・返却済フラグ、商品引取要否・引取日を各対応列に保存する。`pickupRequiredFlag=false` の場合は `pickup_on` をNULLにする。申請時の `alternative_device_status`、導入業者・保守契約参照情報、既存の `alternative_device_info` はリクエスト本文から受け取らず、更新しない',
          '対象業者の業者名とメールを必須として、担当者名、電話番号、業者別提出期限、業者別依頼事項を `rfq_vendors` に新規保存し、`request_status=''SENT''`、`requested_at=依頼送信操作日時`、`requested_by_user_id=操作ユーザーID` とする',
          'Phase1では実メールを送信しない。`SENT` は依頼送信操作と依頼先情報の登録完了を表し、メール配信成功を意味しない',
          '有効な `SENT` 依頼先が0件の場合は新規行を `is_primary_vendor=true` とする。有効な `SENT` 行があるのに主依頼先がない既存データでは、`requested_at`、`rfq_vendor_id` 昇順の先頭既存行を主依頼先へ設定し、新規行は `false` とする。既存の有効な主依頼先がある場合も新規行は `false` とする',
          '主依頼先の `vendor_id`・`vendor_name`・`contact_person`・`phone` を `repair_request_details.current_vendor_id`・`current_vendor_name`・`current_vendor_person`・`current_vendor_contact` へ同一トランザクションで同期する。`current_vendor_contact` は電話番号専用とし、`rfq_vendors.email` を保存しない。追加依頼先は主依頼先業者のスナップショットを上書きしない',
          '画面/APIにグループ共通の見積提出期限は設けず、業者別の `vendor.dueOn` を `rfq_vendors.due_on` の入力正本とする。依頼先登録後、有効な依頼先（`deleted_at IS NULL` かつ `request_status IN (''SENT'',''REPLIED'')`）の `due_on` 最小値を再計算し、`repair_request_details.quotation_due_on` と `rfqs.due_on` へ同一トランザクションで同期する。該当日付がない場合は両方をNULLにする。追加依頼先の登録でも最短期限は更新され得る',
          '保存済み依頼先の訂正はSTEP1完了前に対象行を論理削除して再登録する',
          '依頼送信操作の保存後も `applications.status=''新規申請''` とSTEP1を維持する。STEP2への遷移は見積依頼完了APIだけで行う',
          '依頼先、依頼内容、STEP1入力、依頼操作情報の保存は同一トランザクションで行う'
        )
        ResponseTitle = 'レスポンス（200：RepairVendorRequestRegistrationResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('repairTaskId', 'int64', '✓', '修理申請ID'),
          @('rfqId', 'int64', '✓', '見積依頼グループID'),
          @('rfqVendorId', 'int64', '✓', '保存した依頼先ID'),
          @('isPrimaryVendor', 'boolean', '✓', '主依頼先として保存した場合true'),
          @('requestStatus', 'string', '✓', '`SENT`'),
          @('requestedAt', 'datetime', '✓', '依頼送信操作を保存した日時')
        )
        StatusRows = @(
          @('200', '見積依頼先・依頼送信操作の保存成功', 'RepairVendorRequestRegistrationResponse'),
          @('400', '業者名・メールの必須不足、メール形式不正、または依頼先情報不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', '現在工程不整合、または有効RFQ重複', 'ErrorResponse'),
          @('503', 'DBコミット成否を確認できない。同じ冪等キーで再送する', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '見積依頼先削除（/repair-task/tasks/{repairTaskId}/vendor-requests/{rfqVendorId}）'
        Overview = 'STEP1の依頼送信操作で保存した依頼先を、STEP1完了前に論理削除する。'
        Method = 'DELETE'
        Path = '/repair-task/tasks/{repairTaskId}/vendor-requests/{rfqVendorId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID'),
          @('rfqVendorId', 'path', 'int64', '✓', '削除対象の依頼先ID')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象依頼先を削除済み行を含めて取得し、対象修理申請のREPAIR/RFQに属することと作業対象施設一致を確認する。対象が存在しない、別修理申請、または作業対象施設外の場合は404を返す。既に `deleted_at IS NOT NULL` の場合は追加更新せず204を返す',
          '未削除の場合は共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps`、`rfqs`、対象を含む有効な `rfq_vendors` をロックして状態を再確認する',
          '対象は `repair_category=''OUTSOURCED''`、`status=''新規申請''`、現在工程STEP1で、対象依頼先の `request_status` が `DRAFT` または `SENT` の修理申請に限定する。対象行が有効なまま条件外となった場合は409を返す',
          '`rfq_vendors.deleted_at` を設定する論理削除とする。削除した依頼先は見積依頼完了の件数判定およびSTEP2の業者候補から除外する',
          '削除対象が主依頼先の場合、残る有効な `SENT` / `REPLIED` 行を `requested_at`、`rfq_vendor_id` 昇順で評価し、先頭1件を `is_primary_vendor=true` へ昇格する。昇格行の `vendor_id`・`vendor_name`・`contact_person`・`phone` を `repair_request_details.current_vendor_*` へ同期し、メールアドレスは `current_vendor_contact` へ保存しない',
          '削除対象が主依頼先かどうかにかかわらず、削除後の有効な `SENT` / `REPLIED` 行のうち `due_on IS NOT NULL` の最小値を再計算し、`repair_request_details.quotation_due_on` と `rfqs.due_on` へ同一トランザクションで同期する。該当日付がない場合は期限スナップショットだけをNULLにする',
          '削除後の有効な `SENT` / `REPLIED` 行が0件の場合は `repair_request_details.current_vendor_*` をNULLにする。有効な `SENT` 行が0件の場合は見積依頼完了APIを実行不可とし、申請ステータスとSTEP1は変更しない'
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @(
          'Body は返却しない。'
        )
        StatusRows = @(
          @('204', '見積依頼先削除成功、または既削除への再送成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請または依頼先が存在しない', 'ErrorResponse'),
          @('409', 'STEP1完了後、または削除対象外の依頼状態', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '見積依頼完了（/repair-task/tasks/{repairTaskId}/vendor-requests/complete）'
        Overview = 'STEP1の見積依頼完了操作で、依頼送信操作が保存済みの有効な依頼先が1件以上あることを確認してSTEP2へ進める。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/vendor-requests/complete'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID'),
          @('Idempotency-Key', 'header', 'string', '✓', '見積依頼完了操作の冪等キー')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('requestComment', 'string', '-', '`rfqs.request_comment` に保存する依頼グループ共通のご依頼事項'),
          @('step1', 'RepairStep1Input', '✓', '確定するSTEP1入力内容')
        )
        RequestSubtables = @(
          @{
            Title = 'step1要素（RepairStep1Input）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $repairStep1InputRows
          }
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps`、REPAIR/RFQ、有効な `rfq_vendors` をロックし、作業対象施設、院外修理、STEP1、依頼先状態を再確認する',
          '対象は `repair_category=''OUTSOURCED''`、`applications.status=''新規申請''`、現在工程STEP1の修理申請に限定する',
          '対象修理申請に紐づく有効な修理RFQが1件だけ存在し、`rfq_vendors.request_status=''SENT''` の依頼先が1件以上あることを確認する',
          '`requestComment` と `step1` の管理判断・日付・返却状態・商品引取入力を見積依頼送信APIと同じ保存先へ更新する。画面で最後に変更した値は本APIの確定値を正本とする',
          '申請時の `alternative_device_status`、導入業者・保守契約参照情報、既存の `alternative_device_info`、業者別依頼先・提出期限は本APIのリクエスト本文から受け取らず、保存済み値を維持する',
          '`rfqs.status=''見積依頼済''`、`applications.status=''見積依頼済''` に更新し、RFQ状態履歴へ `action_code=''COMPLETE_RFQ_REQUEST''` を記録する',
          '`application_task_steps` のSTEP1を `COMPLETED`、STEP2を `IN_PROGRESS` とし、操作ユーザーを工程・状態履歴へ記録する',
          'RFQ、申請状態、工程、履歴の更新は同一トランザクションで行う'
        )
        ResponseTitle = 'レスポンス（200：RepairTaskActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('repairTaskId', 'int64', '✓', '修理申請ID'),
          @('status', 'string', '✓', '`見積依頼済`'),
          @('currentStep', 'string', '✓', '`QUOTATION_ORDER`'),
          @('updatedAt', 'datetime', '✓', '更新日時')
        )
        StatusRows = @(
          @('200', '見積依頼完了成功', 'RepairTaskActionResponse'),
          @('400', '冪等キー未指定、またはSTEP1入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', 'RFQ未作成、RFQ重複、`SENT` の有効依頼先なし、または現在工程不整合', 'ErrorResponse'),
          @('503', 'DBコミット成否を確認できない。同じ冪等キーで再送する', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '修理見積登録（/repair-task/tasks/{repairTaskId}/quotations）'
        Overview = '参考見積、発注登録用見積、または発注後の追加見積を、見積書原本とともに登録する。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/quotations'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID'),
          @('Idempotency-Key', 'header', 'string', '✓', '見積登録操作の冪等キー')
        )
        RequestTitle = 'リクエストボディ（multipart/form-data）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('payload.rfqVendorId', 'int64', '✓', '見積回答元の依頼先ID'),
          @('payload.vendorQuotationNo', 'string', '✓', '業者側見積No.。`quotations.vendor_quotation_no` と見積書の `document_no` に保存する'),
          @('payload.quotationOn', 'date', '✓', '見積日'),
          @('payload.quotationPhase', 'string', '✓', '`ESTIMATE` / `ORDER_REGISTRATION` / `ADDITIONAL`'),
          @('payload.totalAmountExclTax', 'decimal', '✓', '税抜合計金額。0以上'),
          @('payload.accountDivisionCode', 'string', '✓', '勘定科目コード'),
          @('payload.document', 'RepairQuotationDocumentInput', '✓', '見積書原本メタデータ。文書種別・日付・No.はサーバー側で設定する'),
          @('files', 'binary', '✓', '`payload.document.filePartName` で参照する見積書原本1ファイル')
        )
        RequestSubtables = @(
          @{
            Title = 'payload.document要素（RepairQuotationDocumentInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $repairQuotationDocumentInputRows
          }
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象修理申請に有効な修理RFQが1件だけ存在し、指定 `rfqVendorId` がそのRFQに属する `deleted_at IS NULL` かつ `request_status IN (''SENT'',''REPLIED'')` の有効な依頼先であることを事前確認する',
          'DB業務行のロックを保持せずに見積フェーズ、`rfqVendorId`、見積No.、見積日付、見積金額（税別）、勘定科目、保存形式、見積書原本を必須検証する。見積書の拡張子、MIME Type、ファイルサイズを検証して内容ハッシュを算出し、ファイル内容ハッシュを含む最終リクエストハッシュで冪等行を確保してから、共通ルールで決定した一時保存キーへファイル本体を保存する',
          'ファイル準備後にDB登録トランザクションを開始し、共通ロック順に従って対象 `applications`、`repair_request_details`、現在工程の `application_task_steps`、対象REPAIR/RFQ、`rfq_vendors`、有効な `quotations` の順で `FOR UPDATE` ロックを取得する',
          'ロック取得後に、修理申請の未削除・作業対象施設一致、現在工程、`applications.status`、対象RFQと指定 `rfqVendorId` の有効性を再確認する。`ESTIMATE` と `ORDER_REGISTRATION` は現在工程STEP2、`applications.status` が `見積依頼済` または `見積登録済` の場合に登録でき、`ADDITIONAL` は発注後からタスク完了前まで登録できる',
          '`ESTIMATE` と `ADDITIONAL` は複数登録できる。`ORDER_REGISTRATION` はロック保持中に `quotation_phase=''ORDER_REGISTRATION'' AND deleted_at IS NULL` の既存行を再検索し、有効な既存行が0件の場合だけ登録する。既存行が1件以上ある場合は見積・見積明細・ドキュメント・状態を登録せず、409 (`REPAIR_ORDER_QUOTATION_CONFLICT`) を返す',
          '`quotations.quotation_no` は共通の受領見積番号採番処理でサーバー採番する。画面入力を `vendor_quotation_no`、`quotation_on`、`quotation_phase`、`total_amount_excl_tax`、`account_division_code` に保存し、指定 `rfq_vendors` の業者ID・業者名・担当者名・メールを見積時点スナップショットとして保存する',
          '対象REPAIR/RFQの `rfq_applications.application_asset_id` から修理対象 `application_assets` を1件取得する。未設定または複数件で一意に特定できない場合は409を返す',
          'ロック後の再検証に成功した場合、見積書原本を一時保存キーから共通ルールで決定した確定保存キーへコピーし、一時保存オブジェクトの削除完了を確認する。削除できない場合はDBをコミットせず、確定保存オブジェクトも補償削除する',
          '見積書原本の `fileName` をアップロード時の元ファイル名として `application_documents.file_name` に保存し、右ペインの見積書一覧表示に使用する。`application_documents.title` はNULLとし、確定保存キーを `file_path` に保存する。一時保存キーはDBへ保存しない',
          '見積明細配列はリクエストから受け取らず、`quotation_items` を1件サーバー生成する。`row_no=1`、`item_type=''E_その他役務''`、原文・確定の品目/メーカー/型式は修理対象スナップショット、`original_quantity=1`、`ai_quantity=1`、`unit=''式''`、`purchase_price_unit=totalAmountExclTax`、`purchase_price_total=totalAmountExclTax`、`account_title=accountDivisionCodeに対応する勘定科目表示名`、`is_specification_line=false` とする',
          '見積書原本の `application_documents` は `owner_type=''QUOTATION''`、`quotation_id=quotationId`、`step_code=''QUOTATION''`、`document_category=''QUOTATION''`、`document_type=''見積書''`、`document_date=quotationOn`、`document_no=vendorQuotationNo`、`storage_format=payload.document.storageFormat` とする',
          '対象依頼先が `request_status=''SENT''` の場合は初回見積受領として `REPLIED` に更新し、すでに `REPLIED` の同じ業者から参考見積または追加見積を登録する場合は状態を維持する',
          '`quotations`、サーバー生成した `quotation_items`、見積書原本の `application_documents`、必要な依頼先状態更新を同一トランザクションで確定する',
          '登録後の有効な見積構成を再判定し、`ORDER_REGISTRATION` があれば `rfqs.status=''発注見積登録済''`、`ORDER_REGISTRATION` がなく `ESTIMATE` があれば `rfqs.status=''見積DB登録済''` とする。RFQ状態が変わる場合は見積区分に応じて `action_code=''REGISTER_ORDER_QUOTATION''` または `REGISTER_QUOTATION_DB` を履歴へ記録する。初回のいずれかの登録時に `applications.status=''見積登録済''` とするが、STEP2は継続する',
          '`ADDITIONAL` 登録ではRFQ状態、申請状態、採用済み発注登録用見積、発注情報を変更しない',
          '一時保存失敗、ロック後の再検証失敗、発注登録用見積の競合、確定コピー・一時保存削除の失敗、DB登録失敗等、DBコミット前のロールバックを確認できる場合は、共通の補償削除ルールに従って当該操作で作成済みの一時保存・確定保存オブジェクトをAPI内で削除する。削除成功後、業務競合は元の409、DB登録失敗は元の500、Amazon S3処理失敗は502を返し、Amazon S3処理またはDB処理の失敗では冪等行を `FAILED_RETRYABLE` とする。COMMIT実行後に成否が不明な場合は補償削除せず、書込先DBで `COMPLETED` を再確認し、確認不能時は503を返す'
        )
        ResponseTitle = 'レスポンス（201：RepairQuotationResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('quotationId', 'int64', '✓', '作成した見積ID'),
          @('quotationNo', 'string', '✓', '受領見積番号'),
          @('quotationPhase', 'string', '✓', '登録した見積区分'),
          @('status', 'string', '✓', '修理申請の現在ステータス'),
          @('createdAt', 'datetime', '✓', '作成日時')
        )
        StatusRows = @(
          @('201', '見積登録成功', 'RepairQuotationResponse'),
          @('400', '必須見積項目不足、金額不正、勘定科目不正、または見積書原本不整合', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請、RFQ、または依頼先が存在しない', 'ErrorResponse'),
          @('409', '現在工程不整合、有効RFQ重複、依頼先状態不整合、修理対象を一意に特定できない、または発注登録用見積が登録済み', 'ErrorResponse'),
          @('502', 'Amazon S3への見積書保存またはロールバック削除に失敗した', 'ErrorResponse'),
          @('503', 'DBコミット成否を確認できない。S3を保持し、同じ冪等キーで再送する', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '修理見積削除（/repair-task/tasks/{repairTaskId}/quotations/{quotationId}）'
        Overview = '削除可能な登録済み見積とその明細・原本を論理削除し、見積書原本のS3オブジェクトを同期削除する。'
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
          $workFacilityProcessingLine,
          '対象見積を削除済み行を含めて取得し、対象修理申請のREPAIR/RFQに属することと作業対象施設一致を確認する。対象が存在しない、別修理申請、または作業対象施設外の場合は404を返す。見積書原本の `application_documents` は削除済み行を含めて取得し、対象ドキュメントIDと `file_path` を確定する',
          '対象見積が既に `deleted_at IS NOT NULL` の場合はDBを追加更新せず、見積書原本のS3削除判定へ進む',
          '未削除の場合は共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps`、`rfqs`、対象 `quotations`、関連 `orders` と見積所有ドキュメントをロックして削除可否を再確認する',
          '`ESTIMATE` と `ORDER_REGISTRATION` は発注登録前かつSTEP2の間だけ削除できる。`orders.quotation_id=quotationId` の発注登録用見積は削除できない',
          '`ADDITIONAL` は発注後からタスク完了前まで削除できる',
          '`quotations.deleted_at`、配下の `quotation_items.deleted_at`、見積書原本の `application_documents.deleted_at` を同一トランザクションで設定してコミットする',
          '発注前見積の削除後は、有効な `ORDER_REGISTRATION` があれば `rfqs.status=''発注見積登録済''`、`ESTIMATE` だけなら `見積DB登録済`、いずれもなければ `見積依頼済` とする。RFQ状態が変わる場合は `rfq_status_histories.action_code=''DELETE_QUOTATION''` を記録し、`applications.status` と現在工程は変更しない',
          'DBコミット後、見積書原本の対象ドキュメントID群を除いて同じ `file_path` を参照する `deleted_at IS NULL` の `application_documents` が存在しない場合だけ、同じAPI内でDeleteObjectを同期実行する。他の有効な参照が存在する場合はS3オブジェクトを削除せず204を返す',
          'DeleteObjectの対象なしは成功とし、再試行可能エラーは初回に加えて最大3回、指数バックオフで再試行する。S3削除成功または対象なしの場合は204を返す。削除を完了できない場合はDBの論理削除を維持して502 (`REPAIR_FILE_502_S3_OPERATION_FAILED`) を返し、同じDELETEの再送でS3削除を再実行する'
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @(
          'Body は返却しない。'
        )
        StatusRows = @(
          @('204', '削除成功、または既削除への再送成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請または対象見積が存在しない', 'ErrorResponse'),
          @('409', '採用済み、完了済み、または見積区分に応じた削除可能期間外', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '修理見積プレビュー（/repair-task/tasks/{repairTaskId}/quotations/{quotationId}/preview-url）'
        Overview = '登録済み見積一覧の「表示」押下時に、対象見積書原本の認可済みプレビューURLを返す。'
        Method = 'GET'
        Path = '/repair-task/tasks/{repairTaskId}/quotations/{quotationId}/preview-url'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID'),
          @('quotationId', 'path', 'int64', '✓', '表示対象の見積ID')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象見積が対象修理申請の有効な修理RFQに属し、未削除であることを確認する',
          '対象見積が所有する未削除の見積書原本について、短時間だけ有効な認可済みURLを発行する',
          'S3オブジェクトキー、バケット名、S3直接URLは返さない'
        )
        ResponseTitle = 'レスポンス（200：PreviewResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('quotationId', 'int64', '✓', '見積ID'),
          @('previewUrl', 'string', '✓', '右側の見積書セクションへ表示する認可済みURL'),
          @('expiresAt', 'datetime', '✓', 'URL有効期限')
        )
        StatusRows = @(
          @('200', 'プレビューURL取得成功', 'PreviewResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請、見積、または見積書原本が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '修理発注書プレビュー（/repair-task/tasks/{repairTaskId}/order/preview）'
        Overview = '唯一の有効な発注登録用見積から発注書を一時生成し、DBへ保存せず右側セクションへ表示する。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/order/preview'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('settlementNo', 'string', '-', '院内決済No.'),
          @('settlementOn', 'date', '-', '決済日')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象は現在工程STEP2かつ `status=''見積登録済''` の院外修理申請に限定する',
          '対象修理RFQに有効な `quotation_phase=''ORDER_REGISTRATION''` の見積が1件だけ存在することを確認し、サーバー側で自動採用する。0件または2件以上の場合は409を返す',
          '採用見積、決済日、決済No.から発注書を一時生成する。発注日はサーバー処理日、支払条件は `未指定` としてプレビューへ反映する',
          '`orders`、`order_items`、`application_documents`、Amazon S3へは保存しない'
        )
        ResponseTitle = 'レスポンス（200：OrderPreviewResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('quotationId', 'int64', '✓', '自動採用した発注登録用見積ID'),
          @('previewUrl', 'string', '✓', '発注書の一時プレビューURL'),
          @('expiresAt', 'datetime', '✓', 'URL有効期限')
        )
        StatusRows = @(
          @('200', '発注書プレビュー生成成功', 'OrderPreviewResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', '現在工程不整合、または有効な発注登録用見積が一意に決まらない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '修理発注登録（/repair-task/tasks/{repairTaskId}/order）'
        Overview = '唯一の有効な発注登録用見積を自動採用し、発注情報と発注書を登録してSTEP3へ進める。Phase1では発注書を送付しない。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/order'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID'),
          @('Idempotency-Key', 'header', 'string', '✓', '発注登録操作の冪等キー')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('settlementNo', 'string', '-', '院内決済No.'),
          @('settlementOn', 'date', '-', '決済日')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          'DB業務行のロックを保持せずに唯一の発注登録用見積から発注書PDFと登録内容を一時生成して内容ハッシュを算出し、最終リクエストハッシュで冪等行を確保してから、共通ルールで決定した一時保存キーへ発注書PDFを保存する',
          'ファイル準備後にDB登録トランザクションを開始し、共通ロック順に従って対象 `applications`、`repair_request_details`、現在工程の `application_task_steps`、REPAIR/RFQ、有効な `quotations`、既存 `orders` の順でロックする。ロック取得後に作業対象施設、院外修理、現在工程STEP2、`status=''見積登録済''`、発注未登録を再確認する',
          '対象修理RFQに有効な `quotation_phase=''ORDER_REGISTRATION''` の見積が1件だけ存在することを確認し、リクエストから見積IDを受け取らずサーバー側で自動採用する',
          '採用見積にサーバー生成済みの有効な `quotation_items` が1件だけ存在することを確認する。見積明細が存在しない、複数存在する、単価または金額を作成できない場合は409を返す',
          '採用見積明細から発注書PDF、`orders`、`order_items` の登録内容を組み立てる。`order_items.quotation_item_id` に元見積明細ID、`registration_type=''本体''` を保存し、品目・メーカー・型式・数量・単価・金額を見積明細から引き継ぐ',
          'ロック後の再検証に成功した場合、発注書PDFを一時保存キーから共通ルールで決定した確定保存キーへコピーし、一時保存オブジェクトの削除完了を確認する。削除できない場合はDBをコミットせず、確定保存オブジェクトも補償削除する',
          '`orders.order_type=''修理''`、`payment_terms=''未指定''`、`order_on=発注登録確定日`、`status=''ORDERED''` とし、`order_document_delivery_method`、`order_document_delivery_status`、`order_document_sent_at` はNULLで保存する',
          '採用見積の業者・担当者・メール・金額を発注時点スナップショットとして `orders` に保存する。`repair_request_details.current_vendor_id`・`current_vendor_name`・`current_vendor_person` は採用見積の業者ID・業者名・担当者名、`current_vendor_contact` は採用見積の `rfq_vendor_id` に対応する有効な `rfq_vendors.phone`、`ordered_on` は発注登録確定日から同一トランザクションで同期する。見積・発注のメールアドレスを `current_vendor_contact` へ保存しない',
          '確定時に `orders`、`order_items` を作成し、採用見積を `ORDER_SELECTED`、`applications.status=''発注済''` とする',
          '`rfqs.status=''発注済''` とし、RFQ状態履歴へ `action_code=''REGISTER_ORDER''`、リクエストの `Idempotency-Key`、操作ユーザーを記録する',
          '発注書は `application_documents.owner_type=''RFQ''`、対象修理RFQの `rfq_id`、`order_id=orderId`、`step_code=''ORDER''`、`document_category=''ORDER''`、`document_type=''発注書''` として1件保存する。確定保存キーを `file_path` に保存し、一時保存キーはDBへ保存しない。`application_id`、`application_asset_id`、`quotation_id` はNULLとする',
          '有効な発注書は `order_id` 単位で1件だけ許可する',
          '一時保存失敗、ロック後の再検証失敗、発注済み競合、確定コピー・一時保存削除の失敗、DB登録失敗等、DBコミット前のロールバックを確認できる場合は、共通の補償削除ルールに従って当該操作で作成済みの一時保存・確定保存オブジェクトをAPI内で削除する。削除成功後、業務競合は元の409、DB登録失敗は元の500、Amazon S3処理失敗は502を返し、Amazon S3処理またはDB処理の失敗では冪等行を `FAILED_RETRYABLE` とする。COMMIT実行後に成否が不明な場合は補償削除せず、書込先DBで `COMPLETED` を再確認し、確認不能時は503を返す',
          '発注、発注書、申請・RFQ状態履歴、STEP2完了、STEP3開始、冪等行の `COMPLETED` 更新は同一トランザクションで確定する。同一キーの成功済み再送は共通冪等ルールに従い保存済み発注結果を返す'
        )
        ResponseTitle = 'レスポンス（200：RepairOrderResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $repairOrderRows
        StatusRows = @(
          @('200', '発注登録成功', 'RepairOrderResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', '現在工程不整合、発注済み、有効な発注登録用見積が一意に決まらない、または採用見積明細不整合', 'ErrorResponse'),
          @('502', 'Amazon S3への発注書保存またはロールバック削除に失敗した', 'ErrorResponse'),
          @('503', 'DBコミット成否を確認できない。S3を保持し、同じ冪等キーで再送する', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '作業日登録（/repair-task/tasks/{repairTaskId}/work-date）'
        Overview = 'STEP3で作業完了予定日を保存し、STEP4へ進める。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/work-date'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID'),
          @('Idempotency-Key', 'header', 'string', '✓', '作業日登録操作の冪等キー')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('workPlannedOn', 'date', '✓', '作業完了予定日')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps`、院外修理の場合はREPAIR/RFQをロックし、作業対象施設、修理区分、現在STEP、ステータスを再確認する',
          '対象は現在工程STEP3で、院外修理は `status=''発注済''`、院内修理は `status=''納期確定''` の修理申請に限定する',
          '`repair_request_details.work_planned_on` に作業完了予定日を保存する',
          '院外修理は `applications.status=''納期確定''` に更新し、院内修理は `納期確定` を維持する',
          '院外修理では `rfqs.status=''納期確定''` に更新し、RFQ状態履歴へ `action_code=''REGISTER_WORK_DATE''` を記録する',
          'STEP3を `COMPLETED`、STEP4を `IN_PROGRESS` とし、操作ユーザーを工程・状態履歴へ記録する'
        )
        ResponseTitle = 'レスポンス（200：RepairTaskActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('repairTaskId', 'int64', '✓', '修理申請ID'),
          @('status', 'string', '✓', '`納期確定`'),
          @('workPlannedOn', 'date', '✓', '作業完了予定日'),
          @('currentStep', 'string', '✓', '`COMPLETE`'),
          @('updatedAt', 'datetime', '✓', '更新日時')
        )
        StatusRows = @(
          @('200', '作業日登録成功', 'RepairTaskActionResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', '現在工程または修理区分とステータスが不整合', 'ErrorResponse'),
          @('503', 'DBコミット成否を確認できない。同じ冪等キーで再送する', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '完了書類登録（/repair-task/tasks/{repairTaskId}/documents）'
        Overview = 'STEP4の「ドキュメント登録」押下時に、選択済みの全ファイルを1回のリクエストで修理申請単位へ一括登録する。画面で入力した書類属性は全ファイルへ共通適用し、ファイル選択だけでは保存しない。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/documents'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID'),
          @('Idempotency-Key', 'header', 'string', '✓', '完了書類登録操作の冪等キー')
        )
        RequestTitle = 'リクエストボディ（multipart/form-data）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('payload.documents', 'DocumentInput[]', '✓', '1件以上。登録するファイルごとに1要素を指定し、画面で入力した共通書類属性を各要素へ設定する'),
          @('files', 'binary[]', '✓', '1件以上。`payload.documents[].filePartName` と1対1で対応する全ファイル本体')
        )
        RequestSubtables = @(
          @{
            Title = 'payload.documents要素（DocumentInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $documentInputRows
          }
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '`payload.documents` と `files` がともに1件以上であること、件数が一致すること、各 `filePartName` が重複せずファイルパートと1対1で対応することを検証する',
          '画面共通項目である `documentType`、`otherDocumentName`、`storageFormat`、`documentDate`、`documentNo`、`actualAmountExclTax`、`accountDivisionCode` は、`payload.documents` の全要素で同じ値であることを検証する。異なる書類属性のファイルは別の登録操作として受け付ける',
          '対象は現在工程STEP4かつ `status=''納期確定''` の修理申請に限定する',
          '書類種別は `院内決済書類` / `修理報告書` / `検収書` / `その他` / `見積書（変更が発生した場合）` / `納品書` / `請求書` に限定する。文書日付とドキュメントNo.は任意とする',
          '`documentType=その他` の場合は `otherDocumentName` を必須とする。`documentType=見積書（変更が発生した場合）` の場合は `actualAmountExclTax` と `accountDivisionCode` を必須とする',
          '各メタデータの `filePartName` に対応するファイルパート、拡張子、MIME Type、保存形式を検証する',
          'DB業務行のロックを保持せずに全ファイルの内容ハッシュを算出し、全ファイルの内容ハッシュを含む最終リクエストハッシュで冪等行を確保する。検証とハッシュ算出が全件完了するまではAmazon S3へ保存しない',
          '冪等行の確保後、全ファイルを共通ルールで決定した一時保存キーへ順次保存する。1件でもPutObjectに失敗した場合は処理を中断し、この操作ですでに保存済みの全一時保存オブジェクトを共通の補償削除ルールで削除する。DBトランザクションは開始せず、`application_documents` を1件も作成しない',
          'Amazon S3への一時保存途中失敗時は冪等行を `FAILED_RETRYABLE` へ更新して502 (`REPAIR_FILE_502_S3_OPERATION_FAILED`) を返し、同一冪等キー・同一ファイル・同一入力内容で再試行可能とする。補償削除はAPI内で完結させ、完了できない場合も502を返して `operationKey`、対象S3オブジェクトキー、失敗工程、トレースIDを運用ログへ記録する',
          '全ファイルのAmazon S3一時保存成功後にDB登録トランザクションを開始し、共通ロック順に従って対象 `applications`、`repair_request_details`、現在工程の `application_task_steps`、院外修理の場合はREPAIR/RFQ、既存のSTEP4 `application_documents` の順でロックして現在状態を再確認する',
          'ロック後の再検証に成功した場合、全ファイルを一時保存キーから共通ルールで決定した確定保存キーへコピーし、全一時保存オブジェクトの削除完了を確認する。1件でもコピーまたは削除に失敗した場合はDBをコミットせず、作成済みの確定保存オブジェクトと残存する一時保存オブジェクトを補償削除する',
          '1ファイルにつき `application_documents` を1行作成する。`owner_type=''APPLICATION''`、`application_id=repairTaskId`、`step_code=''COMPLETE''`、`document_category=''COMPLETE''` はサーバー側で固定する',
          '各要素の `fileName` をアップロード時の元ファイル名として `application_documents.file_name` に保存し、右ペインの各種完了書類一覧表示に使用する。ファイル名とは別の表示タイトルはリクエストから受け取らず、`application_documents.title` はNULLとする。確定保存キーを `file_path` に保存し、一時保存キーはDBへ保存しない',
          '書類種別固有値は `other_document_name`、`actual_amount_excl_tax`、`account_division_code` に保存する。クライアントから所有者・工程・区分は受け付けない',
          '全 `application_documents` と冪等行の `COMPLETED` 更新を同一トランザクションで確定し、部分登録を許可しない。DB登録失敗等、DBコミット前のロールバックを確認できる場合は、当該操作で作成済みの一時保存・確定保存オブジェクトを共通の補償削除ルールで削除して冪等行を `FAILED_RETRYABLE` へ更新する。補償削除に成功した場合は元の500、補償削除を完了できない場合は502を返す。COMMIT実行後に成否が不明な場合は補償削除せず、書込先DBで `COMPLETED` を再確認し、確認不能時は503を返す'
        )
        ResponseTitle = 'レスポンス（201：DocumentSummary[]）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $documentRows
        StatusRows = @(
          @('201', '選択済み完了書類の全件登録成功', 'DocumentSummary[]'),
          @('400', '入力不正、条件付き項目不足、配列件数・ファイル対応・共通書類属性の不整合', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', '現在工程がSTEP4ではない、またはタスク完了済み', 'ErrorResponse'),
          @('502', 'Amazon S3への一括保存が途中で失敗した、または補償・ロールバック削除に失敗した', 'ErrorResponse'),
          @('503', 'DBコミット成否を確認できない。S3を保持し、同じ冪等キーで再送する', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '完了書類削除（/repair-task/tasks/{repairTaskId}/documents/{documentId}）'
        Overview = 'タスク完了前に、STEP4で登録した完了書類を論理削除し、S3オブジェクトを同期削除する。'
        Method = 'DELETE'
        Path = '/repair-task/tasks/{repairTaskId}/documents/{documentId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID'),
          @('documentId', 'path', 'int64', '✓', '削除対象の完了書類ID')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象完了書類を削除済み行を含めて取得し、`owner_type=''APPLICATION''`、`application_id=repairTaskId`、`step_code=''COMPLETE''`、`document_category=''COMPLETE''` であることと作業対象施設一致を確認する。対象が存在しない、別修理申請、または作業対象施設外の場合は404を返す。対象ドキュメントIDと `file_path` を確定する',
          '対象完了書類が既に `deleted_at IS NOT NULL` の場合はDBを追加更新せず、S3削除判定へ進む',
          '未削除の場合は共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps`、院外修理の場合はREPAIR/RFQ、対象 `application_documents` をロックする。修理申請が `完了`、またはSTEP4が完了済みの場合は409を返す',
          '未削除の場合は `application_documents.deleted_at` を設定してDBをコミットする',
          'DBコミット後、対象ドキュメントIDを除いて同じ `file_path` を参照する `deleted_at IS NULL` の `application_documents` が存在しない場合だけ、同じAPI内でDeleteObjectを同期実行する。他の有効な参照が存在する場合はS3オブジェクトを削除せず204を返す',
          'DeleteObjectの対象なしは成功とし、再試行可能エラーは初回に加えて最大3回、指数バックオフで再試行する。S3削除成功または対象なしの場合は204を返す。削除を完了できない場合はDBの論理削除を維持して502 (`REPAIR_FILE_502_S3_OPERATION_FAILED`) を返し、同じDELETEの再送でS3削除を再実行する'
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @(
          'Body は返却しない。'
        )
        StatusRows = @(
          @('204', '削除成功、または既削除への再送成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請または対象完了書類が存在しない', 'ErrorResponse'),
          @('409', 'タスク完了後のため削除不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '完了書類プレビュー（/repair-task/tasks/{repairTaskId}/documents/{documentId}/preview-url）'
        Overview = 'STEP4の登録済み完了書類を確認するため、認可済みプレビューURLを返す。'
        Method = 'GET'
        Path = '/repair-task/tasks/{repairTaskId}/documents/{documentId}/preview-url'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID'),
          @('documentId', 'path', 'int64', '✓', '表示対象の完了書類ID')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象は `owner_type=''APPLICATION''`、`application_id=repairTaskId`、`step_code=''COMPLETE''`、`document_category=''COMPLETE''`、`deleted_at IS NULL` の完了書類に限定する',
          '短時間だけ有効な認可済みURLを発行し、S3オブジェクトキー、バケット名、S3直接URLは返さない'
        )
        ResponseTitle = 'レスポンス（200：PreviewResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('documentId', 'int64', '✓', '完了書類ID'),
          @('previewUrl', 'string', '✓', '認可済みプレビューURL'),
          @('expiresAt', 'datetime', '✓', 'URL有効期限')
        )
        StatusRows = @(
          @('200', 'プレビューURL取得成功', 'PreviewResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請または対象完了書類が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '完了登録（/repair-task/tasks/{repairTaskId}/complete）'
        Overview = 'STEP4の登録完了操作で修理申請を完了する。完了書類が0件でも、画面で確認したうえで完了できる。'
        Method = 'POST'
        Path = '/repair-task/tasks/{repairTaskId}/complete'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID'),
          @('Idempotency-Key', 'header', 'string', '✓', '完了登録操作の冪等キー')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('confirmCompletion', 'boolean', '✓', '完了書類が0件の場合を含め、完了することを確認した値。`true` のみ許可する'),
          @('completedOn', 'date', '-', '完了日。未指定時はサーバー処理日'),
          @('alternativeReturnedFlag', 'boolean', '-', '代替機返却済みフラグ')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps`、院外修理の場合はREPAIR/RFQをロックし、作業対象施設、STEP4、ステータスを再確認する',
          '対象は現在工程STEP4かつ `status=''納期確定''` の修理申請に限定し、`confirmCompletion=true` を確認する',
          '完了書類の登録件数を完了条件にしない。0件の場合も確認済みであれば完了できる',
          '`applications.status=''完了''`、STEP4を `COMPLETED` とし、操作ユーザーを状態履歴・工程履歴へ記録する',
          '院外修理では対象の修理RFQを `status=''完了''`、`completed_on=completedOn` とし、RFQ状態履歴へ `action_code=''COMPLETE_TASK''` を記録する。院内修理ではRFQを作成しない',
          '`repair_request_details.alternative_returned_flag` は指定時だけ更新する',
          '修理対象に紐づく有効な `lending_devices` 行がある場合は対象行をロックし、現在状態と `lock_version` を再確認する',
          '`lending_devices.status=''使用不可''` の場合だけ既存の `ENABLE` 遷移を使用し、`status=''貸出可''`、`lock_version=lock_version+1`、`updated_at=現在日時` に更新する。貸出管理対象外または別ステータスは更新しない',
          '完了登録では `asset_ledgers`、`individuals`、発注情報、見積情報を作成・更新しない',
          '申請状態、工程、履歴、貸出状態の更新は同一トランザクションで行う'
        )
        ResponseTitle = 'レスポンス（200：RepairTaskActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('repairTaskId', 'int64', '✓', '修理申請ID'),
          @('status', 'string', '✓', '`完了`'),
          @('completedOn', 'date', '✓', '保存した完了日'),
          @('lendingStatusRestored', 'boolean', '✓', '貸出状態を `貸出可` へ戻した場合true'),
          @('updatedAt', 'datetime', '✓', '更新日時')
        )
        StatusRows = @(
          @('200', '完了登録成功', 'RepairTaskActionResponse'),
          @('400', '`confirmCompletion` 不正、日付不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', '現在工程がSTEP4ではない、またはタスク完了済み', 'ErrorResponse'),
          @('503', 'DBコミット成否を確認できない。同じ冪等キーで再送する', 'ErrorResponse'),
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
          $workFacilityProcessingLine,
          '対象修理申請を削除済み行を含めて取得し、`application_type=''REPAIR''` と作業対象施設一致を確認する。対象が存在しない、または作業対象施設外の場合は404を返す。既に `applications.deleted_at IS NOT NULL` の場合は追加更新せず204を返す',
          '未削除の場合は共通ロック順に従い、対象の `applications`、`repair_request_details`、現在工程の `application_task_steps`、REPAIR/RFQ、`rfq_vendors`、`quotations`、`orders`、関連 `application_documents` をロックして削除可否を再確認する',
          '対象は `status=''見積登録済''` の修理申請に限定する',
          '`orders` が作成済み、または `status` が `発注済` / `納期確定` / `完了` / `却下` の場合は409を返す',
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
          @('204', '削除成功、または既削除への再送成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `repair_management` なし', 'ErrorResponse'),
          @('404', '対象修理申請が存在しない', 'ErrorResponse'),
          @('409', '未削除の対象が発注済み以降、または現在ステータス不整合で削除不可', 'ErrorResponse'),
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
          @('repairTaskId', 'path', 'int64', '✓', '修理申請ID'),
          @('Idempotency-Key', 'header', 'string', '✓', '廃棄申請接続操作の冪等キー')
        )
        PermissionLines = $repairManagementPermissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '共通ロック順に従い、元修理申請の `applications`、`repair_request_details`、現在工程の `application_task_steps`、REPAIR/RFQ、有効な発注登録用 `quotations`、既存 `orders` をロックし、作業対象施設、院外修理、STEP2、発注未登録を再確認する',
          '対象は `application_type=''REPAIR''`、`status=''見積登録済''`、現在工程STEP2、`repair_request_details.repair_category=''OUTSOURCED''`、発注未登録の修理申請に限定する',
          '対象修理RFQに有効な `quotation_phase=''ORDER_REGISTRATION''` の見積が1件だけ存在することを確認する。0件または2件以上の場合は409を返す',
          '登録済み資産の場合は代表 `application_assets.asset_ledger_id` が存在し、作業対象施設の資産であることを検証する',
          '未登録資産の場合は `repair_request_details.is_registered_asset=false`、代表 `application_assets.asset_ledger_id IS NULL`、`repair_request_details.manual_item_name` など廃棄対象物品の表示に必要な手入力情報が存在することを検証する',
          '元修理申請は `applications.status=''却下''` に更新し、`application_task_steps.completion_reason=''UNREPAIRABLE''` を保存する。対象REPAIR/RFQは `status=''申請を見送る''` とし、RFQ状態履歴へ `action_code=''SKIP_APPLICATION''` を記録する',
          '`applications` に `application_type=''DISPOSAL''` の廃棄申請ヘッダーを作成する',
          '登録済み資産では `application_assets` に `asset_role=''DISPOSAL''`、元修理対象の `asset_ledger_id` とスナップショットを保存する',
          '未登録資産では `application_assets` に `asset_role=''DISPOSAL''`、`asset_ledger_id=NULL`、元修理申請の `application_assets` スナップショットおよび `repair_request_details.manual_*` から引き継いだ品目、メーカー、型式、シリアルNo.、設置部署、室名を保存する。`asset_ledgers` の作成・更新は行わない',
          '`disposal_application_details` に `disposal_reason_code=''UNREPAIRABLE''`、`related_repair_application_id=元修理申請ID` を保存する',
          '元修理申請の却下終端、REPAIR/RFQ終端、廃棄申請作成、申請・RFQ・工程履歴作成は同一トランザクションで行う'
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
          @('409', '対象物品情報不足、院内修理、現在工程・ステータス不整合、発注済み、または有効な発注登録用見積が一意に決まらない', 'ErrorResponse'),
          @('503', 'DBコミット成否を確認できない。同じ冪等キーで再送する', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '必要権限' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定基準', '説明'); Rows = @(
      @('修理管理一覧・詳細・工程操作・削除', '`repair_management`', '通常アカウントは作業対象施設に対して実効 `repair_management` を持つこと。共有システム管理者アカウントは作業対象施設が未削除であれば通常権限判定をバイパスする', '修理管理タブと修理タスクの進行・発注前削除'),
      @('廃棄申請接続', '`repair_management`', '通常アカウントは作業対象施設に対して実効 `repair_management` を持つこと。共有システム管理者アカウントは作業対象施設が未削除であれば通常権限判定をバイパスする', '登録済み資産または未登録資産の修理不能から廃棄申請を作成する')
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
      @('院内修理選択', '新規申請', '納期確定', '`repair_category=IN_HOUSE`。STEP1を完了し、STEP2をスキップしてSTEP3へ進む'),
      @('院外修理選択', '新規申請', '新規申請', '`repair_category=OUTSOURCED`。STEP1で見積依頼を続行する'),
      @('受付判定の同一再送', '受付済み', '変更なし', '保存済み修理区分と同じ判定は200で現在結果を返し、受付情報・工程・RFQ・履歴を更新しない。異なる判定は409'),
      @('見積依頼先登録・依頼送信', '新規申請', '新規申請', '手入力した業者情報、依頼内容、依頼操作日時、操作ユーザーを保存し、依頼先を `SENT` とする。初回受付時の導入業者・保守契約参照情報は上書きしない。Phase1では実メールを送信せず、STEP1を継続する'),
      @('見積依頼完了', '新規申請', '見積依頼済', '依頼送信操作が保存済みの有効な `SENT` 依頼先が1件以上ある場合にSTEP2へ進む'),
      @('参考見積／発注登録用見積の初回登録', '見積依頼済', '見積登録済', 'STEP2を継続する。発注登録用見積は有効な1件だけ許可する'),
      @('追加見積登録', '発注済 / 納期確定', '変更なし', 'タスク完了前まで複数登録でき、採用見積・発注情報を変更しない'),
      @('修理見積削除', '見積依頼済 / 見積登録済 / 発注済 / 納期確定', '変更なし', '見積区分ごとの削除可能期間を検証して論理削除する'),
      @('修理タスク削除', '見積登録済', '論理削除', '`applications.deleted_at` を設定する。発注済み以降は削除不可'),
      @('発注登録', '見積登録済', '発注済', '唯一の発注登録用見積を自動採用し、STEP3へ進む'),
      @('作業日登録', '発注済 / 納期確定', '納期確定', '院内修理は状態を維持し、院外修理は `納期確定` へ更新してSTEP4へ進む'),
      @('完了書類登録・削除', '納期確定', '納期確定', 'STEP4中に修理申請単位で管理する'),
      @('完了登録', '納期確定', '完了', '書類0件でも確認済みなら完了できる。資産台帳・個体情報は更新しない'),
      @('通常却下', '見積登録済', '却下', '院外修理の発注前STEP2で、有効な `quotation_phase=''ORDER_REGISTRATION''` の見積が1件だけ存在する場合に `completion_reason=REJECTED` とする'),
      @('修理不能', '見積登録済', '却下', '`completion_reason=UNREPAIRABLE`。登録済み資産または未登録資産の修理申請経由廃棄申請を作成する')
    ) },
    @{ Type = 'Heading2'; Text = 'STEP1参照情報・依頼先保存ルール' },
    @{ Type = 'Bullets'; Items = @(
      'No.6 修理申請APIが保存した `alternative_device_status` は申請時の `NOT_NEEDED` / `NEEDED` / `REQUESTED` を保持し、本書のAPIでは上書きしない。STEP1の必要／不要は `alternative_device_handling_required_flag` に保存する',
      '修理タスク詳細APIは、申請時点値を `requestAlternativeDeviceStatus`、DB保存値を `alternativeHandlingRequiredFlag`、画面表示用実効値を `effectiveAlternativeHandlingRequiredFlag` として分けて返す。管理判断が未保存の場合だけ `NEEDED` / `REQUESTED` をtrue、`NOT_NEEDED` / NULLをfalseとして実効値を算出する。初期表示だけでは保存せず、依頼送信または見積依頼完了で受け取った `alternativeHandlingRequiredFlag` を保存した後は当該保存値を優先する',
      '導入業者・保守契約は初回受付時にサーバー側で `repair_request_details` へ保存する参照表示用スナップショットであり、STEP1のプレビュー、依頼送信、見積依頼完了のリクエスト項目に含めない',
      '保存済み依頼先が0件の場合、画面は導入業者スナップショットを1行目の初期候補として表示できるが、候補表示・編集だけではDBへ保存しない',
      '業者名とメールを必須として依頼送信した時点で、編集後の業者情報を `rfq_vendors` に保存する。手入力した依頼先から導入業者スナップショットへ逆書きしない',
      '業者ごとの提出期限は `rfq_vendors.due_on` を入力正本とし、`RepairStep1Input` では共通期限を受け取らない',
      '最初の有効依頼先を主依頼先とし、主依頼先の業者ID・業者名・担当者名・電話番号を `repair_request_details.current_vendor_*` へ同期する。`current_vendor_contact` は `rfq_vendors.phone` 由来の電話番号専用とし、メールアドレスを保存しない。追加依頼先は主依頼先業者のスナップショットを上書きせず、主依頼先削除時だけ残る有効行を昇格する',
      '見積提出期限は主依頼先とは分離する。有効な修理RFQ依頼先（`deleted_at IS NULL` かつ `request_status IN (''SENT'',''REPLIED'')`）の `due_on` 最小値を、依頼先登録・論理削除時に `repair_request_details.quotation_due_on` と `rfqs.due_on` へ同一トランザクションで同期し、該当日付がない場合は両方をNULLにする'
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
      @('IDEMPOTENCY_KEY_REQUIRED', '400', 'DB更新を伴うPOST APIで `Idempotency-Key` が未指定'),
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
      @('AUTH_403_REPAIR_MANAGEMENT_DENIED', '403', '通常アカウントで作業対象施設に対する実効 `repair_management` がない。共有システム管理者アカウントでは作業対象施設が未削除であれば通常権限判定をバイパスする'),
      @('FACILITY_NOT_FOUND', '404', '作業対象施設が存在しない、または削除済み'),
      @('REPAIR_REQUEST_NOT_FOUND', '404', '対象の修理申請が存在しない'),
      @('REPAIR_ASSET_NOT_FOUND', '404', '対象修理申請に紐づく登録済み資産が存在しない'),
      @('REPAIR_STATUS_CONFLICT', '409', '現在ステータスが対象操作を許可しない'),
      @('REPAIR_RECEPTION_DECISION_CONFLICT', '409', '受付済みの修理区分と異なる院内対応／外部依頼への変更要求、または未受付データの受付情報・RFQ不整合'),
      @('REPAIR_TASK_DELETE_NOT_ALLOWED', '409', '発注済み以降または削除対象外ステータスのため修理タスクを削除できない'),
      @('REPAIR_QUOTATION_DELETE_NOT_ALLOWED', '409', '採用済み、発注済み以降、または削除対象外ステータスのため修理見積を削除できない'),
      @('REPAIR_DISPOSAL_APPLICATION_NOT_ALLOWED', '409', '現在ステータス、院内修理、または対象物品情報不足により廃棄申請接続を実行できない'),
      @('REPAIR_RFQ_NOT_FOUND', '409', '院外修理の見積依頼グループが未作成'),
      @('REPAIR_RFQ_CONFLICT', '409', '対象修理申請に有効な修理RFQが複数存在する'),
      @('REPAIR_VENDOR_REQUEST_NOT_SENT', '409', '見積依頼完了に必要な `SENT` の有効依頼先が存在しない'),
      @('REPAIR_QUOTATION_NOT_LINKED', '409', '指定見積が対象修理申請に紐づかない'),
      @('REPAIR_ORDER_QUOTATION_CONFLICT', '409', '発注登録用見積の新規登録時に有効な既存行が存在する、または後続操作時に有効な発注登録用見積が0件・複数件で一意に決まらない'),
      @('REPAIR_ORDER_ALREADY_REGISTERED', '409', '対象修理申請の発注が登録済み'),
      @('IDEMPOTENCY_KEY_REUSED', '409', '同一スコープ・同一 `Idempotency-Key` が異なる正規化済みリクエストで再利用された'),
      @('IDEMPOTENCY_REQUEST_IN_PROGRESS', '409', '同一スコープ・同一 `Idempotency-Key` の初回処理が進行中'),
      @('REPAIR_DOCUMENT_VALIDATION_ERROR', '400', '完了書類の種別、条件付き項目、保存形式、またはファイル対応が不正'),
      @('REPAIR_DOCUMENT_LOCKED', '409', 'タスク完了後のため完了書類を削除できない'),
      @('REPAIR_FILE_502_S3_OPERATION_FAILED', '502', '修理関連ドキュメントのAmazon S3一時保存、確定保存へのコピー、一時保存オブジェクトの削除、失敗時の補償削除、または通常DELETE時のS3同期削除を完了できない'),
      @('REPAIR_DB_503_COMMIT_OUTCOME_UNKNOWN', '503', 'DBコミット成否を書込先DBで確認できない。IN_PROGRESSの冪等記録と、ファイルを伴う操作ではS3オブジェクトを保持し、同じIdempotency-Keyでの再送を要求する'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = '監査・履歴方針' },
    @{ Type = 'Bullets'; Items = @(
      '修理申請の状態変更は `application_status_histories` に履歴を残す',
      '工程進行、スキップ、通常却下、修理不能は `application_task_steps` の状態、`completion_reason`、実行ユーザーで追跡する。各STEP操作を実行したユーザーは状態履歴の `changed_by_user_id` と工程の更新者として記録する',
      '申請者情報は起票時点のログインユーザー情報を `applications` にスナップショット保存する',
      '申請時の代替機選択は `repair_request_details.alternative_device_status` に保持して修理管理で上書きせず、管理担当者の判断は `alternative_device_handling_required_flag` に分離して保存する',
      '初回受付時だけログインユーザーの部署・氏名・ユーザーIDを `repair_request_details.reception_department`、`reception_person`、`reception_user_id` に保存し、以降のアクセスでは保存済み受付情報を表示して上書きしない',
      '初回受付時に導入業者・保守契約参照情報も `repair_request_details` にスナップショット保存し、以降の資産・発注・保守契約マスタ変更やSTEP1の手入力依頼先によって上書きしない',
      'STEP1の依頼送信操作を実行したユーザーは `rfq_vendors.requested_by_user_id`、操作保存日時は `requested_at` に記録する。Phase1ではメール配信成否を記録しない',
      '登録時のファイル実体はAPI内でAmazon S3の一時保存から確定保存へ移し、一時保存オブジェクトの削除確認後にDBを確定する。DBコミット前のロールバックを確認できる登録失敗では一時保存・確定保存オブジェクトをAPI内で補償削除し、COMMIT実行後に成否が不明な場合はS3を保持して書込先DBで結果を再確認する。`application_documents.file_path` は確定保存キーの正本とし、S3バケット名やS3直接URLは通常APIログ・レスポンスに出力しない'
    ) }
  )
}

