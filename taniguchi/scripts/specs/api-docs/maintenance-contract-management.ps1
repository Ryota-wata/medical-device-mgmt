$permissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `maintenance_contract` が有効であること'
)

$workFacilityProcessingLine = 'Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。'
$auth401StatusRow = @('401', '未認証', 'ErrorResponse')
$auth403StatusRow = @('403', '通常アカウントで作業対象施設に対する実効 `maintenance_contract` なし', 'ErrorResponse')
$workFacility404StatusRow = @('404', '作業対象施設が存在しない、または削除済み', 'ErrorResponse')

$contractStatusRows = @(
  @('見積依頼', '初期状態。保守契約グループ作成後、業者登録・見積依頼書作成・送信を行う'),
  @('見積依頼済', '少なくとも1社へ見積依頼送信済み。見積書登録へ進める'),
  @('見積登録済', '発注登録用見積が1件以上登録済み。契約登録・明細登録・ドキュメント登録へ進める'),
  @('完了', '保守登録済み。契約中一覧に表示し、詳細閲覧、契約内容見直し、契約更新が可能'),
  @('申請見送り', '見積依頼工程で見送り確定した終端状態。通常一覧から除外する')
)

$contractTaskSummaryRows = @(
  @('maintenanceContractId', 'int64', '✓', '`maintenance_contracts.maintenance_contract_id`'),
  @('maintenanceContractNo', 'string', '✓', '保守契約No.。画面上の申請No.列に表示する場合もこの値を返す'),
  @('contractGroupName', 'string', '✓', '契約グループ名'),
  @('maintenanceType', 'string', '✓', '保守契約/定期点検/スポット契約/借用契約/その他'),
  @('maintenanceTypeNote', 'string', '-', '種別備考'),
  @('contractedOn', 'date', '-', '契約日'),
  @('contractStartOn', 'date', '-', '契約開始日'),
  @('contractEndOn', 'date', '-', '契約終了日'),
  @('contractReviewStartOn', 'date', '-', '契約検討開始日'),
  @('vendorName', 'string', '-', '契約業者名。完了前は null'),
  @('vendorContactPerson', 'string', '-', '契約業者担当者名'),
  @('vendorEmail', 'string', '-', '契約業者メール'),
  @('vendorPhone', 'string', '-', '契約業者連絡先'),
  @('contractAmountExclTax', 'decimal', '-', '契約金額(税抜)'),
  @('annualAmountExclTax', 'decimal', '-', '単年度金額(税抜)'),
  @('status', 'string', '✓', '`maintenance_contracts.status`'),
  @('dueStatus', 'string', '✓', '`NONE` / `WARRANTY_EXPIRED` / `WARRANTY_ENDING_SOON` / `CONTRACT_ENDING_SOON` / `CONTRACT_EXPIRED`'),
  @('dueLabel', 'string', '-', '画面表示用期限ラベル。例: `契約更新 3ヶ月前`、`30日超過`'),
  @('assetCount', 'int32', '✓', '有効な契約対象資産数。`excluded_flag=false` の件数'),
  @('comment', 'string', '-', 'フリーコメント'),
  @('availableActions', 'string[]', '✓', '`QUOTE_REQUEST` / `CANCEL_APPLICATION` / `REGISTER_QUOTATION` / `REGISTER_CONTRACT` / `CONTENT_REVIEW` / `RENEWAL` / `DETAIL`')
)

$contractAssetRows = @(
  @('maintenanceContractAssetId', 'int64', '-', '`maintenance_contract_assets.maintenance_contract_asset_id`。新規追加時は null'),
  @('assetLedgerId', 'int64', '✓', '`asset_ledgers.asset_ledger_id`'),
  @('qrCodeValue', 'string', '-', '代表QR識別子'),
  @('departmentName', 'string', '-', '設置部署または管理部署表示'),
  @('sectionName', 'string', '-', '設置部門表示'),
  @('itemName', 'string', '✓', '品目名'),
  @('makerName', 'string', '-', 'メーカー名'),
  @('modelName', 'string', '-', '型式'),
  @('inspectionGroupName', 'string', '-', '点検グループ名'),
  @('inspectionType', 'string', '-', '`メーカー保守` / `院内定期点検` / `院内スポット点検`。未設定可'),
  @('inspectionCycleMonths', 'int32', '-', '点検周期（月）'),
  @('inspectionCountPerYear', 'int32', '-', '年間点検回数'),
  @('warrantyStartOn', 'date', '-', '保証開始日'),
  @('warrantyEndOn', 'date', '-', '保証終了日'),
  @('partsExemptionFlag', 'boolean', '-', '部品免責有無'),
  @('partsExemptionText', 'string', '-', '部品免責条件'),
  @('exemptionAmount', 'decimal', '-', '免責金額'),
  @('onCallSupport', 'boolean', '-', 'オンコール対応'),
  @('remoteMaintenanceAvailable', 'boolean', '-', 'リモート対応'),
  @('legalInspectionFlag', 'boolean', '-', '法定点検フラグ'),
  @('legalInspectionBasis', 'string', '-', '法定点検根拠'),
  @('contractUnitPriceExclTax', 'decimal', '-', '契約単価。個別入力は任意'),
  @('excludedFlag', 'boolean', '✓', '契約内容見直しで期中除外された場合 true'),
  @('remarks', 'string', '-', '備考')
)

$contractAssetSaveInputRows = @(
  @('maintenanceContractAssetId', 'int64', '-', '既存明細更新時に指定。新規追加時は null'),
  @('assetLedgerId', 'int64', '✓', '契約対象資産ID。新規追加時も必須'),
  @('inspectionGroupName', 'string', '-', '点検グループ名'),
  @('inspectionType', 'string', '-', '`メーカー保守` / `院内定期点検` / `院内スポット点検`。未設定可'),
  @('inspectionCycleMonths', 'int32', '-', '点検周期（月）'),
  @('inspectionCountPerYear', 'int32', '-', '年間点検回数'),
  @('warrantyStartOn', 'date', '-', '保証開始日'),
  @('warrantyEndOn', 'date', '-', '保証終了日'),
  @('partsExemptionFlag', 'boolean', '-', '部品免責有無。未指定時 false'),
  @('partsExemptionText', 'string', '-', '部品免責条件'),
  @('exemptionAmount', 'decimal', '-', '免責金額'),
  @('onCallSupport', 'boolean', '-', 'オンコール対応。未指定時 false'),
  @('remoteMaintenanceAvailable', 'boolean', '-', 'リモート対応。未指定時 false'),
  @('legalInspectionFlag', 'boolean', '-', '法定点検フラグ。未指定時 false'),
  @('legalInspectionBasis', 'string', '-', '法定点検根拠'),
  @('contractUnitPriceExclTax', 'decimal', '-', '契約単価。個別入力は任意'),
  @('remarks', 'string', '-', '備考')
)

$documentRows = @(
  @('documentId', 'int64', '✓', '`application_documents.application_document_id`'),
  @('ownerType', 'string', '✓', '`RFQ` / `RFQ_VENDOR` / `QUOTATION` / `MAINTENANCE_CONTRACT_REVIEW`'),
  @('documentCategory', 'string', '✓', '`REQUEST_ATTACHMENT` / `QUOTATION` / `CONTRACT` / `CONTRACT_REVIEW` / `OTHER`'),
  @('documentType', 'string', '✓', '見積依頼書 / 見積書 / 契約書 / 免責部品一覧 / 契約変更覚書 など'),
  @('fileName', 'string', '✓', 'ファイル名'),
  @('contentType', 'string', '-', '`application_documents.mime_type` に保存するMIMEタイプ'),
  @('fileSize', 'int64', '-', '`application_documents.file_size_bytes` に保存するファイルサイズ'),
  @('downloadUrl', 'string', '-', 'S3オブジェクトキーからAPI側で発行する認可済みダウンロードURL。S3オブジェクトキー、S3バケット名、S3直接URLは返却しない'),
  @('uploadedAt', 'datetime', '✓', '登録日時'),
  @('uploadedByName', 'string', '-', '登録者名')
)

$quotationRows = @(
  @('quotationId', 'int64', '✓', '`quotations.quotation_id`'),
  @('quotationNo', 'string', '✓', '見積番号'),
  @('quotationPhase', 'string', '✓', '`発注登録用見積` / `参考見積`'),
  @('quotationOn', 'date', '✓', '見積日。入力省略時は業務日'),
  @('storageFormat', 'string', '✓', '見積原本の `application_documents.storage_format`。`電子取引` / `スキャナ保存` / `未指定`'),
  @('vendorId', 'int64', '-', '業者マスタID'),
  @('vendorName', 'string', '✓', '見積業者名'),
  @('totalAmountExclTax', 'decimal', '-', '見積金額(税抜)'),
  @('annualAmountExclTax', 'decimal', '-', '単年度金額(税抜)'),
  @('accountDivisionCode', 'string', '-', '会計区分コード'),
  @('status', 'string', '✓', '`DRAFT` / `REGISTERED` / `ORDER_SELECTED`'),
  @('document', 'DocumentSummary', '-', '見積原本メタデータ')
)

$rfqVendorSummaryRows = @(
  @('rfqVendorId', 'int64', '✓', '`rfq_vendors.rfq_vendor_id`'),
  @('vendorId', 'int64', '-', '業者マスタID'),
  @('vendorName', 'string', '✓', '依頼先業者名'),
  @('contactPerson', 'string', '-', '担当者名'),
  @('email', 'string', '-', 'メールアドレス'),
  @('phone', 'string', '-', '連絡先'),
  @('requestStatus', 'string', '✓', '`DRAFT` / `SENT` / `CANCELED`'),
  @('requestedAt', 'datetime', '-', '送信日時'),
  @('requestedByName', 'string', '-', '送信者名')
)

$maintenanceRfqSummaryRows = @(
  @('rfqId', 'int64', '✓', '`rfqs.rfq_id`'),
  @('rfqNo', 'string', '✓', '見積依頼No.'),
  @('status', 'string', '✓', '`見積依頼` / `見積依頼済` / `見積DB登録済` / `申請を見送る`'),
  @('vendorRequestComment', 'string', '-', 'ご依頼事項。`rfqs.remarks` から返す')
)

$maintenanceContractHeaderRows = @(
  @('maintenanceContractId', 'int64', '✓', '`maintenance_contracts.maintenance_contract_id`'),
  @('maintenanceContractNo', 'string', '✓', '保守契約No.'),
  @('contractGroupName', 'string', '✓', '契約グループ名'),
  @('renewalSourceMaintenanceContractId', 'int64', '-', '契約更新元の保守契約ID'),
  @('rfqId', 'int64', '-', '保守契約RFQ ID'),
  @('settlementNo', 'string', '-', '決済No.'),
  @('maintenanceType', 'string', '✓', '契約種別'),
  @('maintenanceTypeNote', 'string', '-', '種別備考'),
  @('contractedOn', 'date', '-', '契約日'),
  @('contractStartOn', 'date', '-', '契約開始日'),
  @('contractEndOn', 'date', '-', '契約終了日'),
  @('contractReviewStartOn', 'date', '-', '契約検討開始日'),
  @('vendorId', 'int64', '-', '契約業者ID'),
  @('vendorName', 'string', '-', '契約業者名'),
  @('vendorContactPerson', 'string', '-', '契約業者担当者名'),
  @('vendorEmail', 'string', '-', '契約業者メール'),
  @('vendorPhone', 'string', '-', '契約業者連絡先'),
  @('contractAmountExclTax', 'decimal', '-', '契約金額(税抜)'),
  @('annualAmountExclTax', 'decimal', '-', '単年度金額(税抜)'),
  @('status', 'string', '✓', '`maintenance_contracts.status`'),
  @('comment', 'string', '-', 'コメント')
)

$documentInputRows = @(
  @('documentCategory', 'string', '✓', '`REQUEST_ATTACHMENT` / `QUOTATION` / `CONTRACT` / `CONTRACT_REVIEW` / `OTHER`'),
  @('documentType', 'string', '✓', '見積依頼書 / 見積書 / 契約書 / 免責部品一覧 / 契約変更覚書 など'),
  @('fileName', 'string', '✓', 'ファイル名'),
  @('contentType', 'string', '-', '`application_documents.mime_type` に保存するMIMEタイプ'),
  @('fileSize', 'int64', '-', '`application_documents.file_size_bytes` に保存するファイルサイズ'),
  @('filePartName', 'string', '✓', 'multipart/form-data 内のファイルパート名。ファイル実体とメタデータを対応付ける'),
  @('contentHash', 'string', '-', '改ざん検知・重複確認用ハッシュ。指定時はアップロード実体と照合し `application_documents.content_hash` に保存する'),
  @('title', 'string', '-', '文書タイトル'),
  @('documentDate', 'date', '-', '文書日付'),
  @('storageFormat', 'string', '-', '`電子取引` / `スキャナ保存` / `未指定`。保存先ではなく電帳法等の保存形式区分を表す'),
  @('accountType', 'string', '-', '会計区分'),
  @('accountOtherText', 'string', '-', '会計区分その他')
)

$quotationDocumentInputRows = @($documentInputRows | Where-Object { $_[0] -ne 'storageFormat' })

$errorRows = @(
  @('AUTH_401_UNAUTHORIZED', '401', '認証情報が存在しない、または無効', 'Bearer トークン未指定、期限切れ、署名不正'),
  @('AUTH_403_MAINTENANCE_CONTRACT_DENIED', '403', '通常アカウントで作業対象施設に対する実効 `maintenance_contract` がない', '共有システム管理者アカウントでは作業対象施設が未削除であれば通常権限判定をバイパスする'),
  @('FACILITY_NOT_FOUND', '404', '作業対象施設が存在しない、または削除済み', 'Bearer トークン上の作業対象施設を参照できない'),
  @('MAINTENANCE_CONTRACT_NOT_FOUND', '404', '保守契約を参照できない', 'ID不存在、施設不一致、削除済み、または権限外'),
  @('MAINTENANCE_CONTRACT_ASSET_NOT_FOUND', '404', '契約対象資産を参照できない', '対象資産ID不存在、施設不一致、または契約に属さない'),
  @('MAINTENANCE_CONTRACT_ASSET_DUPLICATE', '409', '同一契約内に同じ資産が重複している', '新規作成、明細登録、契約内容見直し追加で重複'),
  @('MAINTENANCE_CONTRACT_STATUS_CONFLICT', '409', '現在ステータスが操作条件を満たさない', 'ステータス遷移不一致、完了済みに対する前工程更新など'),
  @('MAINTENANCE_QUOTE_REQUEST_NOT_SENT', '409', '見積依頼完了条件を満たさない', '送信済み依頼先が0件'),
  @('MAINTENANCE_CONTRACT_CANCEL_BLOCKED', '409', '申請見送り条件を満たさない', '見積依頼以外、または後続工程へ進行済み'),
  @('MAINTENANCE_ORDER_QUOTATION_REQUIRED', '409', '発注登録用見積が未登録', '見積登録完了または保守登録時に発注登録用見積がない'),
  @('MAINTENANCE_CONTRACT_DOCUMENT_REQUIRED', '409', '契約書または契約補助資料が未登録', '保守登録時に契約ドキュメントが0件'),
  @('MAINTENANCE_CONTRACT_ASSET_DETAIL_REQUIRED', '409', '明細登録済み対象資産が存在しない', '保守登録時に有効な対象資産が0件'),
  @('MAINTENANCE_CONTRACT_REVIEW_TARGET_REQUIRED', '400', '契約内容見直し対象が未指定', '除外対象と追加対象がどちらも0件'),
  @('MAINTENANCE_CONTRACT_EXPIRED', '409', '契約期間終了済みのため操作できない', '契約内容見直しを期限切れ契約に実行'),
  @('MAINTENANCE_CONTRACT_FILE_502_S3_WRITE_FAILED', '502', 'ファイル保存または保存後ロールバックに失敗', 'Amazon S3 PutObject 失敗、またはDB保存失敗後のS3 DeleteObject 失敗'),
  @('VALIDATION_ERROR', '400', '入力値不正', '必須不足、列挙値不正、文字数超過、日付前後関係不正'),
  @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー', '想定外例外')
)

$spec = @{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_保守契約管理.docx'
  ScreenLabel = '保守契約管理'
  CoverDateText = '2026年5月27日'
  RevisionDateText = '2026/5/27'
  RevisionAuthorText = 'RyokuTaniguchi'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、資産一覧画面の保守契約登録導線、保守契約管理タブ、保守契約見積登録画面で利用する API の設計内容を整理し、画面要件、DB設計、点検管理APIとの責務境界を一致させることを目的とする。' },
    @{ Type = 'Paragraph'; Text = '保守契約は `applications` を作成しないドメイン管理とし、`maintenance_contracts` と `maintenance_contract_assets` を正本として、見積依頼、見積登録、契約登録、保守登録、完了後の契約内容見直し・契約更新までを1本のAPI設計書で扱う。' },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '保守契約管理は、資産一覧または保守契約管理タブから契約対象資産を選択して保守契約グループを作成し、業者への見積依頼、見積登録、契約情報・契約ドキュメント・明細登録を経て保守登録を完了する業務機能である。' },
    @{ Type = 'Paragraph'; Text = '完了後の契約は契約中一覧に残し、期限切れ契約は既定非表示とする。完了レコードの詳細モーダルは閲覧専用とし、契約内容見直しと契約更新のみを後続操作として許可する。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('保守契約グループ', '`maintenance_contracts` の1レコード。複数の契約対象資産、見積依頼、見積、契約情報を束ねる'),
      @('契約対象資産', '`maintenance_contract_assets` の1レコード。保守契約グループに属する資産単位の点検情報・保証条件・契約単価を保持する'),
      @('発注登録用見積', '契約登録で採用できる見積。`quotation_phase=''発注登録用見積''` として保存する'),
      @('参考見積', '見積DB登録までで参照目的に利用する見積。契約登録時の採用見積にはできない'),
      @('保守登録', 'STEP③で契約情報、ドキュメント、明細登録が揃った時点で `maintenance_contracts.status=''完了''` へ進める操作'),
      @('契約内容見直し', '完了かつ契約中の保守契約に対し、既存資産の除外と新規資産追加、見直し後金額、理由、契約変更ドキュメントを履歴登録する操作'),
      @('契約更新', '完了レコードを再オープンせず、契約グループ名と契約種別を新規入力し、部署情報・商品情報・対象資産だけを複製した後継の保守契約グループを作成する操作')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面パス', '利用目的'); Rows = @(
      @('資産一覧画面 保守契約登録導線', '/asset-search-result', '選択資産を初期対象として保守契約グループを作成する'),
      @('保守契約管理タブ', '/quotation-data-box/maintenance-contracts', '保守契約一覧、期限表示、詳細閲覧、契約内容見直し、契約更新を行う'),
      @('保守契約見積登録画面', '/maintenance-quote-registration', '見積依頼、見積登録、契約登録、保守登録を3ステップで進行する')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'API の位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、保守契約管理の契約グループ作成から完了後運用までを一貫して扱う。資産一覧は保守契約作成の入口にすぎず、作成される正本データは保守契約ドメインの `maintenance_contracts` / `maintenance_contract_assets` である。' },
    @{ Type = 'Paragraph'; Text = '点検管理への連携は保守登録時に `maintenance_contract_assets` の資産別点検条件を入力として `inspection_tasks` を作成または更新する。点検実施、日程調整、メーカー保守結果登録は No.30 点検管理APIの責務とする。' },
    @{ Type = 'Heading2'; Text = '画面と API の関係' },
    @{ Type = 'Table'; Headers = @('画面操作', 'API', '補足'); Rows = @(
      @('保守契約管理タブ初期表示/期限切れ表示切替', '`GET /quotation-data-box/maintenance-contracts/tasks`', '進行中契約と契約中の完了契約を取得する。`includeExpired=true` で期限切れ契約も含める'),
      @('資産一覧または保守契約管理タブから契約グループ作成', '`POST /quotation-data-box/maintenance-contracts`', '`maintenance_contracts.status=''見積依頼''` と契約対象資産を作成する'),
      @('見積依頼先登録', '`POST /quotation-data-box/maintenance-contracts/{maintenanceContractId}/quote-request`', '保守契約RFQと依頼先を登録・更新する'),
      @('依頼送信', '`POST /quotation-data-box/maintenance-contracts/{maintenanceContractId}/quote-request/vendors/{rfqVendorId}/send`', '依頼先単位で送信済みにする'),
      @('見積依頼完了', '`POST /quotation-data-box/maintenance-contracts/{maintenanceContractId}/quote-request/complete`', '送信済み依頼先が1件以上ある場合に `見積依頼済` へ進める'),
      @('申請見送り', '`POST /quotation-data-box/maintenance-contracts/{maintenanceContractId}/cancel`', 'STEP①の保守契約を `申請見送り` へ終端化する'),
      @('保守契約見積登録画面表示', '`GET /maintenance-quote-registration/contracts/{maintenanceContractId}`', '3ステップ画面のヘッダ、資産、RFQ、見積、文書を取得する'),
      @('明細登録', '`PUT /maintenance-quote-registration/contracts/{maintenanceContractId}/assets`', '対象資産別の点検情報、保証条件、契約単価、追加資産を保存する'),
      @('見積登録', '`POST /maintenance-quote-registration/contracts/{maintenanceContractId}/quotations`', '発注登録用見積または参考見積を登録する'),
      @('見積登録完了', '`POST /maintenance-quote-registration/contracts/{maintenanceContractId}/quotations/complete`', '発注登録用見積が1件以上ある場合に `見積登録済` へ進める'),
      @('見積削除', '`DELETE /maintenance-quote-registration/contracts/{maintenanceContractId}/quotations/{quotationId}`', '保守登録前かつ採用前の見積を論理削除する'),
      @('契約登録保存', '`PUT /maintenance-quote-registration/contracts/{maintenanceContractId}/contract-registration`', '採用見積、決済No.、契約期間、契約種別などを保存する'),
      @('契約ドキュメント登録/削除', '`POST /maintenance-quote-registration/contracts/{maintenanceContractId}/documents` / `DELETE /maintenance-quote-registration/contracts/{maintenanceContractId}/documents/{documentId}`', '契約書、免責部品一覧などのメタデータを管理する'),
      @('保守登録', '`POST /maintenance-quote-registration/contracts/{maintenanceContractId}/complete`', '必須条件を検証し、`完了` へ進め、点検管理へ連携する'),
      @('契約内容見直し', '`POST /quotation-data-box/maintenance-contracts/{maintenanceContractId}/content-review`', '完了契約の資産除外・資産追加・金額変更履歴を登録する'),
      @('契約更新', '`POST /quotation-data-box/maintenance-contracts/{maintenanceContractId}/renewal`', '元契約を参照する後継契約を `見積依頼` で作成する')
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル名', '利用種別', '用途'); Rows = @(
      @('`asset_ledgers`', 'READ', '保守契約対象資産の施設スコープ、部署情報、商品情報、QR表示情報の取得'),
      @('`qr_codes`', 'READ', '保守契約対象資産の代表QR識別子取得'),
      @('`maintenance_contracts`', 'CREATE / READ / UPDATE', '保守契約ヘッダー、ステータス、契約情報、契約更新元、契約金額の正本'),
      @('`maintenance_contract_assets`', 'CREATE / READ / UPDATE', '契約対象資産、資産別点検情報、保証条件、契約単価、期中除外フラグの正本'),
      @('`maintenance_contract_status_definitions`', 'READ', '保守契約ステータス許容値、初期状態、終端状態の確認'),
      @('`maintenance_contract_status_transitions`', 'READ', '保守契約ステータス遷移可否の確認'),
      @('`maintenance_contract_reviews`', 'CREATE / READ', '契約内容見直し履歴、変更前後金額、理由、登録者の保存'),
      @('`maintenance_contract_review_assets`', 'CREATE / READ', '契約内容見直し時の追加資産・除外資産の履歴保存'),
      @('`rfqs`', 'CREATE / READ / UPDATE', '保守契約RFQヘッダー。`management_type=''MAINTENANCE''`'),
      @('`rfq_vendors`', 'CREATE / READ / UPDATE', '見積依頼先、依頼送信状態、担当者、連絡先'),
      @('`quotations`', 'CREATE / READ / UPDATE / DELETE', '発注登録用見積、参考見積、採用見積、削除状態'),
      @('`application_documents`', 'CREATE / READ / UPDATE / DELETE', '見積依頼書、見積書、契約書、免責部品一覧、契約変更覚書のファイルメタデータ。ファイル実体はAmazon S3に保存し、`file_path` にはS3オブジェクトキーのみを保持する'),
      @('`inspection_tasks`', 'CREATE / READ / UPDATE', '保守登録時の点検管理連携先。保守契約由来の定期点検系タスク'),
      @('`inspection_task_status_definitions` / `inspection_task_status_transitions`', 'READ', '保守契約由来点検タスク作成時の初期ステータス・遷移制約確認'),
      @('`vendors`', 'READ', '見積依頼先、見積業者、契約業者の存在確認とスナップショット生成'),
      @('`users`', 'READ', '登録者、送信者、見直し登録者の表示名取得、共有システム管理者アカウント判定'),
      @('`facilities`', 'READ', 'Bearer トークン上の作業対象施設の存在確認、未削除確認'),
      @('`user_facility_assignments`', 'READ', '通常アカウントにおける作業対象施設への有効担当施設割当確認'),
      @('`facility_feature_settings`', 'READ', '通常アカウントにおける施設提供機能 `maintenance_contract` の有効化確認'),
      @('`user_facility_feature_settings`', 'READ', '通常アカウントにおけるユーザー施設別 `maintenance_contract` の有効化確認')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API 共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON（ファイル実体を受け取るPOST APIは multipart/form-data を使用し、`payload` に業務データとファイルメタデータ、`files` にファイル本体を指定する）',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-05-27T10:00:00+09:00`）',
      '日付形式: `YYYY-MM-DD`',
      '認証済みAPIは Bearer トークンを `Authorization` ヘッダーに付与する',
      '各APIは Bearer トークン上の作業対象施設を基準に自施設データのみ処理する',
      '更新系APIは現在ステータスを再取得して遷移可否を検証し、条件を満たさない場合は 409 を返す'
    ) },
    @{ Type = 'Heading2'; Text = 'ファイル保存ルール' },
    @{ Type = 'Bullets'; Items = @(
      '見積依頼書、見積書、契約書、免責部品一覧、契約変更覚書などのファイル実体は、対象APIが multipart/form-data の `files` パートとして受け取り、API内でAmazon S3へPutObjectする',
      '`application_documents.file_path` にはS3オブジェクトキーのみ保存し、S3バケット名、S3の直接URL、認可なしで利用できるURLはDBへ保存しない',
      'レスポンスではS3オブジェクトキー、S3バケット名、S3の直接URLを返さず、画面表示やダウンロードが必要な場合は認可済み `downloadUrl` を返す',
      'Amazon S3保存後にDBメタデータ保存または業務トランザクションへ失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄する。破棄に失敗した場合は 502 (`MAINTENANCE_CONTRACT_FILE_502_S3_WRITE_FAILED`) を返却し、再試行可能な運用ログを残す',
      '`storageFormat` は保存先ではなく、電子取引/スキャナ保存/未指定などの保存形式区分を表す列として扱い、S3保存有無の表現には使用しない',
      '削除APIは `application_documents.deleted_at` の論理削除を正本とし、S3実体は同一S3オブジェクトキーを参照する有効メタデータがなくなったことと保存期間を確認するS3ライフサイクルまたは後続クリーンアップで扱う'
    ) },
    @{ Type = 'Heading2'; Text = '認証・認可' },
    @{ Type = 'Paragraph'; Text = '本API群で使用する `feature_code` は `maintenance_contract` とする。資産一覧の保守契約登録導線、保守契約管理タブ、保守契約見積登録画面の全操作で同じ実効権限を判定する。画面表示用の `/auth/context` はUX用キャッシュであり、各業務APIでも同条件を再判定する。通常アカウントでは作業対象施設への有効担当施設割当、施設提供機能、ユーザー施設別機能設定を確認する。共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）では、作業対象施設が未削除であることを確認できれば、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `maintenance_contract` 判定をバイパスする。' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('保守契約API全般', '`maintenance_contract`', '`users`, `facilities`, `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '通常アカウントは担当施設割当と実効 `maintenance_contract` を確認する。共有システム管理者アカウントは作業対象施設が未削除であれば通常権限判定をバイパスする')
    ) },
    @{ Type = 'Heading2'; Text = '作業対象施設ベースの認可例外' },
    @{ Type = 'Bullets'; Items = @(
      '各APIは Bearer トークン上の作業対象施設が存在し、未削除であることを確認する',
      '通常アカウントでは、作業対象施設に対する有効担当施設割当と実効 `maintenance_contract` を都度再判定する',
      '共有システム管理者アカウントでは、作業対象施設が未削除であれば通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による認可判定をバイパスする',
      '対象資産の作業対象施設所属、保守契約グループの対象資産所属、`rfqs.management_type=''MAINTENANCE''`、保守契約ステータス遷移順序、送信済み依頼先有無、発注登録用見積、契約ドキュメント、契約対象資産明細、契約内容見直し/契約更新条件、点検管理連携時の競合確認といった業務制約は共有システム管理者でもバイパスしない',
      '通常アカウントで作業対象施設に対して必要な実効 `maintenance_contract` がない場合は403を返す',
      '作業対象施設が存在しない、または削除済みの場合は404を返す'
    ) },
    @{ Type = 'Heading2'; Text = '施設スコープ' },
    @{ Type = 'Bullets'; Items = @(
      '対象資産は `asset_ledgers.facility_id` が作業対象施設と一致することを必須とする',
      '一覧取得は `maintenance_contract_assets.asset_ledger_id` から参照する `asset_ledgers.facility_id` が作業対象施設と一致する契約のみ返す',
      '同一契約に複数資産がある場合も、作業対象施設外の資産を含む契約は登録・更新不可とする',
      '他施設の `maintenanceContractId`、`assetLedgerId`、`quotationId`、`documentId` が指定された場合は 404 とし、存在有無を返さない'
    ) },
    @{ Type = 'Heading2'; Text = '保守契約ステータス' },
    @{ Type = 'Table'; Headers = @('ステータス', '意味'); Rows = $contractStatusRows },
    @{ Type = 'Heading2'; Text = 'データライフサイクル' },
    @{ Type = 'Table'; Headers = @('状態', '作成/更新契機', '主な保存値', '次の遷移'); Rows = @(
      @('契約グループ作成前', '資産一覧または保守契約管理タブで対象資産を選択', '保存なし', '契約グループ作成で `見積依頼` へ'),
      @('見積依頼', '契約グループ作成', '`maintenance_contracts.status=''見積依頼''`, `maintenance_contract_assets`', '業者登録・依頼送信後、見積依頼完了で `見積依頼済`'),
      @('申請見送り', 'STEP①で申請を見送る', '`maintenance_contracts.status=''申請見送り''`。RFQ作成済みの場合は `rfqs.status=''申請を見送る''`', '終端。通常一覧から除外'),
      @('見積依頼済', '送信済み依頼先が1件以上ある状態で見積依頼完了', '`rfq_vendors.request_status=''SENT''`, `maintenance_contracts.status=''見積依頼済''`', '発注登録用見積登録後、見積登録完了で `見積登録済`'),
      @('見積登録済', '発注登録用見積が1件以上ある状態で見積登録完了', '`quotations.quotation_phase=''発注登録用見積''`, `maintenance_contracts.status=''見積登録済''`', '契約情報・ドキュメント・明細登録後、保守登録で `完了`'),
      @('完了', '保守登録', '採用見積、契約期間、契約金額、契約書、対象資産明細、点検管理連携結果', '契約内容見直しまたは契約更新。ステータスは原則維持'),
      @('契約内容見直し済み', '完了契約に契約内容見直し登録', '`maintenance_contract_reviews`, `maintenance_contract_review_assets`, `maintenance_contracts.contract_amount_excl_tax` 更新', '契約は `完了` のまま継続'),
      @('契約更新後継作成済み', '完了契約から契約更新', '後継 `maintenance_contracts.renewal_source_maintenance_contract_id`', '後継契約を `見積依頼` から進行')
    ) },
    @{ Type = 'Heading2'; Text = '一覧表示・期限表示ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`GET /quotation-data-box/maintenance-contracts/tasks` は、既定で `見積依頼` / `見積依頼済` / `見積登録済` と、契約終了日を過ぎていない `完了` を返す',
      '`申請見送り` は既定一覧から除外する',
      '契約終了日を過ぎた期限切れ契約は既定非表示とし、`includeExpired=true` の場合だけ返す',
      '保証終了日が存在する場合は保証終了日を優先し、期限切れは `保証期限切れ`、6ヶ月以内は `保証期間終了 Nヶ月前` として表示する',
      '保証終了日が未設定または6ヶ月超過の場合は契約終了日を参照し、6ヶ月以内は `契約更新 Nヶ月前` として表示する',
      '期限列は保証終了日と契約終了日のうち注意喚起が必要な日付を基準に `N日前` / `N日超過` として返す'
    ) },
    @{ Type = 'Heading2'; Text = '契約更新・契約内容見直しルール' },
    @{ Type = 'Bullets'; Items = @(
      '契約更新は完了済み契約を再オープンせず、契約グループ名と契約種別を新規入力して元契約を参照する後継契約を新規作成する',
      '契約更新で複製するのは部署情報・商品情報・対象資産のみとし、見積依頼先、登録済み見積、採用見積、契約業者、契約金額、契約期間、契約書、点検情報、契約単価は複製しない',
      '契約内容見直しは完了かつ契約終了日を過ぎていない契約のみ許可する',
      '契約内容見直しは除外対象または追加対象のいずれか1件以上を必須とする',
      '除外対象は既存 `maintenance_contract_assets.excluded_flag=true` に更新し、追加対象は同一契約の `maintenance_contract_assets` に新規作成する',
      '同一契約内に同一 `asset_ledger_id` を重複登録してはならない',
      '契約内容見直し後も `maintenance_contracts.status` は `完了` のまま維持する'
    ) },
    @{ Type = 'Heading2'; Text = '点検管理連携ルール' },
    @{ Type = 'Bullets'; Items = @(
      '保守登録時、対象資産明細に点検種別が設定されている場合は `inspection_tasks` を作成または更新する',
      '`inspection_type=''メーカー保守''` は日程未定登録を許可し、日程未定の場合は `next_inspection_on=NULL`、初期 `status=''点検日調整''` とする',
      '`inspection_type=''院内定期点検''` / `院内スポット点検` は契約開始日または明細の保証期間をもとに初回予定を算出する',
      '日常点検は保守契約管理から作成しない',
      '`excluded_flag=true` の契約対象資産は点検管理連携対象から除外する',
      '別契約由来で同一資産・同一点検種別の有効タスクが存在する場合は競合として扱い、保守登録を中断する'
    ) },
    @{ Type = 'Heading2'; Text = '共通エラーレスポンス' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや競合理由の補足'),
      @('currentStatus', 'string', '-', '競合時のサーバー最新ステータス')
    ) },
    @{ Type = 'Heading2'; Text = '共通DTO' },
    @{ Type = 'Heading3'; Text = 'MaintenanceContractTaskSummary' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $contractTaskSummaryRows },
    @{ Type = 'Heading3'; Text = 'MaintenanceContractAssetDetail' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $contractAssetRows },
    @{ Type = 'Heading3'; Text = 'MaintenanceQuotationSummary' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $quotationRows },
    @{ Type = 'Heading3'; Text = 'RfqVendorSummary' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $rfqVendorSummaryRows },
    @{ Type = 'Heading3'; Text = 'MaintenanceRfqSummary' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $maintenanceRfqSummaryRows },
    @{ Type = 'Heading3'; Text = 'MaintenanceContractHeader' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $maintenanceContractHeaderRows },
    @{ Type = 'Heading3'; Text = 'DocumentInput' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentInputRows },
    @{ Type = 'Heading3'; Text = 'DocumentSummary' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentRows },

    @{ Type = 'Heading1'; Text = '第4章 API 一覧' },
    @{ Type = 'Table'; Headers = @('No', 'API名', 'Method', 'Path', '用途', '権限'); Rows = @(
      @('1', '保守契約タスク一覧取得', 'GET', '/quotation-data-box/maintenance-contracts/tasks', '保守契約管理タブ一覧を取得する', '`maintenance_contract`'),
      @('2', '保守契約グループ作成', 'POST', '/quotation-data-box/maintenance-contracts', '資産一覧または保守契約管理タブから契約グループを作成する', '`maintenance_contract`'),
      @('3', '見積依頼先登録', 'POST', '/quotation-data-box/maintenance-contracts/{maintenanceContractId}/quote-request', '保守契約RFQと依頼先を登録・更新する', '`maintenance_contract`'),
      @('4', '見積依頼送信', 'POST', '/quotation-data-box/maintenance-contracts/{maintenanceContractId}/quote-request/vendors/{rfqVendorId}/send', '依頼先単位で送信済みにする', '`maintenance_contract`'),
      @('5', '見積依頼完了', 'POST', '/quotation-data-box/maintenance-contracts/{maintenanceContractId}/quote-request/complete', '`見積依頼済` へ進める', '`maintenance_contract`'),
      @('6', '申請見送り', 'POST', '/quotation-data-box/maintenance-contracts/{maintenanceContractId}/cancel', 'STEP①で保守契約を申請見送りにする', '`maintenance_contract`'),
      @('7', '保守契約詳細取得', 'GET', '/maintenance-quote-registration/contracts/{maintenanceContractId}', '保守契約見積登録画面の詳細を取得する', '`maintenance_contract`'),
      @('8', '契約対象資産明細登録', 'PUT', '/maintenance-quote-registration/contracts/{maintenanceContractId}/assets', '資産別点検情報、保証条件、契約単価、追加資産を保存する', '`maintenance_contract`'),
      @('9', '見積登録', 'POST', '/maintenance-quote-registration/contracts/{maintenanceContractId}/quotations', '発注登録用見積または参考見積を登録する', '`maintenance_contract`'),
      @('10', '見積登録完了', 'POST', '/maintenance-quote-registration/contracts/{maintenanceContractId}/quotations/complete', '`見積登録済` へ進める', '`maintenance_contract`'),
      @('11', '見積削除', 'DELETE', '/maintenance-quote-registration/contracts/{maintenanceContractId}/quotations/{quotationId}', '保守登録前の見積を論理削除する', '`maintenance_contract`'),
      @('12', '契約登録保存', 'PUT', '/maintenance-quote-registration/contracts/{maintenanceContractId}/contract-registration', '契約情報と採用見積を保存する', '`maintenance_contract`'),
      @('13', '契約ドキュメント登録', 'POST', '/maintenance-quote-registration/contracts/{maintenanceContractId}/documents', '契約書などの文書メタデータを登録する', '`maintenance_contract`'),
      @('14', '契約ドキュメント削除', 'DELETE', '/maintenance-quote-registration/contracts/{maintenanceContractId}/documents/{documentId}', '保守登録前の契約ドキュメントを論理削除する', '`maintenance_contract`'),
      @('15', '保守登録完了', 'POST', '/maintenance-quote-registration/contracts/{maintenanceContractId}/complete', '必須条件を検証し `完了` へ進め、点検管理へ連携する', '`maintenance_contract`'),
      @('16', '契約内容見直し登録', 'POST', '/quotation-data-box/maintenance-contracts/{maintenanceContractId}/content-review', '完了契約の追加/除外・金額変更履歴を登録する', '`maintenance_contract`'),
      @('17', '契約更新作成', 'POST', '/quotation-data-box/maintenance-contracts/{maintenanceContractId}/renewal', '完了契約から後継契約を作成する', '`maintenance_contract`')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '保守契約タスク一覧取得（/quotation-data-box/maintenance-contracts/tasks）'
        Overview = '保守契約管理タブの一覧に表示する保守契約タスクを取得する。'
        Method = 'GET'
        Path = '/quotation-data-box/maintenance-contracts/tasks'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('includeExpired', 'query', 'boolean', '-', '期限切れ契約を含める場合 true。未指定時 false'),
          @('status', 'query', 'string', '-', '`見積依頼` / `見積依頼済` / `見積登録済` / `完了`'),
          @('maintenanceType', 'query', 'string', '-', '契約種別'),
          @('keyword', 'query', 'string', '-', '保守契約No.、契約グループ名、業者名、品目名の部分一致'),
          @('page', 'query', 'int32', '-', 'ページ番号。未指定時 1'),
          @('pageSize', 'query', 'int32', '-', '1ページ件数。未指定時 50')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '`maintenance_contracts` を `maintenance_contract_assets`、`asset_ledgers`、`qr_codes` と結合し、作業対象施設の契約のみ取得する',
          '既定では `見積依頼` / `見積依頼済` / `見積登録済` と、`完了` かつ `contract_end_on >= 業務日` の契約を返す',
          '`includeExpired=true` の場合のみ `完了` かつ `contract_end_on < 業務日` の期限切れ契約を返す',
          '`申請見送り` は通常一覧対象外とし、個別ステータス指定時も返さない',
          '期限表示は保証終了日を優先し、該当しない場合に契約終了日を参照して算出する',
          '既定並び順は進行中を上位、期限警告ありを次点、`last_status_changed_at DESC`、`maintenance_contract_id DESC` とする'
        )
        ResponseTitle = 'レスポンス（200：MaintenanceContractTaskListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('items', 'MaintenanceContractTaskSummary[]', '✓', '一覧行'),
          @('totalCount', 'int32', '✓', '総件数'),
          @('page', 'int32', '✓', 'ページ番号'),
          @('pageSize', 'int32', '✓', '1ページ件数')
        )
        StatusRows = @(
          @('200', '取得成功', 'MaintenanceContractTaskListResponse'),
          @('400', '検索条件、ページ指定、列挙値が不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `maintenance_contract` なし', 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、または削除済み', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '保守契約グループ作成（/quotation-data-box/maintenance-contracts）'
        Overview = '資産一覧または保守契約管理タブから保守契約グループを作成し、初期ステータス `見積依頼` で登録する。'
        Method = 'POST'
        Path = '/quotation-data-box/maintenance-contracts'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('contractGroupName', 'string', '✓', '契約グループ名'),
          @('maintenanceType', 'string', '✓', '保守契約/定期点検/スポット契約/借用契約/その他'),
          @('contractReviewStartOn', 'date', '-', '契約検討開始日'),
          @('comment', 'string', '-', 'コメント'),
          @('assetLedgerIds', 'int64[]', '✓', '対象資産ID。1件以上')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象資産が1件以上指定されていることを検証する',
          '全対象資産が作業対象施設に属し、削除済みでないことを検証する',
          '同一リクエスト内の `assetLedgerIds` 重複を拒否する',
          '`maintenance_contract_no` を採番し、`maintenance_contracts` を `status=''見積依頼''`、`contract_review_start_on=入力値`、`remote_maintenance_available=false`、`on_call_support=false`、`last_status_changed_at=現在日時` で作成する',
          '対象資産ごとに `maintenance_contract_assets` を `excluded_flag=false` で作成する',
          '複数資産登録は全件成功または全件失敗とし、部分登録は行わない',
          '`applications` と `rfq_applications` は作成しない'
        )
        ResponseTitle = 'レスポンス（201：MaintenanceContractCreateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('maintenanceContractId', 'int64', '✓', '作成した保守契約ID'),
          @('maintenanceContractNo', 'string', '✓', '採番した保守契約No.'),
          @('status', 'string', '✓', '`見積依頼`'),
          @('assetCount', 'int32', '✓', '登録した対象資産数'),
          @('nextPath', 'string', '✓', '`/maintenance-quote-registration?id={maintenanceContractId}`')
        )
        StatusRows = @(
          @('201', '作成成功', 'MaintenanceContractCreateResponse'),
          @('400', '必須不足、契約種別不正、対象資産未指定', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '実効 `maintenance_contract` なし', 'ErrorResponse'),
          @('404', '対象資産が存在しない、または施設外', 'ErrorResponse'),
          @('409', '対象資産重複', 'ErrorResponse')
        )
      },
      @{
        Title = '見積依頼先登録（/quotation-data-box/maintenance-contracts/{maintenanceContractId}/quote-request）'
        Overview = 'STEP①で保守契約RFQを作成または取得し、依頼先業者と依頼事項を保存する。'
        Method = 'POST'
        Path = '/quotation-data-box/maintenance-contracts/{maintenanceContractId}/quote-request'
        Auth = '要（Bearer）'
        ParametersTitle = 'パスパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('maintenanceContractId', 'path', 'int64', '✓', '保守契約ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('receptionDepartmentName', 'string', '-', '受付部署名'),
          @('receptionPersonName', 'string', '-', '受付担当者名'),
          @('receptionContact', 'string', '-', '受付連絡先'),
          @('vendorRequestComment', 'string', '-', 'ご依頼事項'),
          @('vendors', 'QuoteRequestVendorInput[]', '✓', '依頼先。1件以上')
        )
        RequestSubtables = @(
          @{
            Title = 'vendors要素（QuoteRequestVendorInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('rfqVendorId', 'int64', '-', '既存行更新時に指定'),
              @('vendorId', 'int64', '-', '業者マスタID'),
              @('vendorName', 'string', '✓', '業者名'),
              @('contactPerson', 'string', '-', '担当者名'),
              @('email', 'string', '-', 'メールアドレス'),
              @('phone', 'string', '-', '連絡先')
            )
          }
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象契約が `見積依頼` であることを確認する',
          '`rfqs.management_type=''MAINTENANCE''`、`workflow_type=''RFQ''`、`status=''見積依頼''`、`requested_on=業務日`、`created_by_user_id=ログインユーザー`、`last_status_changed_at=現在日時` のRFQを作成または取得し、`maintenance_contracts.rfq_id` に設定する',
          '受付部署名、受付担当者名、受付連絡先は `maintenance_contracts.reception_department_name`、`reception_person_name`、`reception_contact` に保存する',
          'ご依頼事項は `rfqs.remarks` に保存し、作成/更新する依頼先の `rfq_vendors.request_note` にも反映する',
          '依頼先は `rfq_vendors` に作成または更新し、未送信行は `request_status=''DRAFT''` とする',
          '既に `SENT` の依頼先は送信履歴保持のため削除せず、更新対象外とする'
        )
        ResponseTitle = 'レスポンス（200：QuoteRequestResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('rfqId', 'int64', '✓', '保守契約RFQ ID'),
          @('vendors', 'RfqVendorSummary[]', '✓', '依頼先一覧'),
          @('status', 'string', '✓', '`見積依頼`')
        )
        StatusRows = @(
          @('200', '保存成功', 'QuoteRequestResponse'),
          @('400', '依頼先未指定、メール形式不正、文字数超過', 'ErrorResponse'),
          @('404', '対象契約または業者が存在しない', 'ErrorResponse'),
          @('409', '対象契約が見積依頼以外', 'ErrorResponse')
        )
      },
      @{
        Title = '見積依頼送信（/quotation-data-box/maintenance-contracts/{maintenanceContractId}/quote-request/vendors/{rfqVendorId}/send）'
        Overview = '依頼先業者1社に対して見積依頼を送信済みにし、送信日時と送信者を保持する。'
        Method = 'POST'
        Path = '/quotation-data-box/maintenance-contracts/{maintenanceContractId}/quote-request/vendors/{rfqVendorId}/send'
        Auth = '要（Bearer）'
        ParametersTitle = 'パスパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('maintenanceContractId', 'path', 'int64', '✓', '保守契約ID'),
          @('rfqVendorId', 'path', 'int64', '✓', '見積依頼先ID')
        )
        RequestTitle = 'リクエストボディ（multipart/form-data）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('payload.requestDocument', 'DocumentInput', '-', '送付文書メタデータ。`filePartName` で対応するファイルパートを指定する。送付文書が不要な場合は省略可'),
          @('files', 'binary[]', '-', '`payload.requestDocument.filePartName` で参照される送付文書ファイル本体')
        )
        RequestSubtables = @(
          @{ Title = 'payload.requestDocument要素（DocumentInput）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentInputRows }
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象契約が `見積依頼` であることを確認する',
          '対象 `rfq_vendors` が契約の `rfq_id` に属し、`request_status` が `DRAFT` または未送信相当であることを確認する',
          '`payload.requestDocument` を指定した場合は、`filePartName` が multipart のファイルパートに存在することを確認し、拡張子・MIME Type・ファイルサイズ・`contentHash` を検証する',
          '送付文書ファイル本体をAPI内でAmazon S3へPutObjectし、S3オブジェクトキーは `application-documents/facility-{facilityId}/{yyyy}/{mm}/{uploadUuid}.{ext}` 形式で発行する。keyは保存場所識別子であり、`maintenanceContractId` や `rfqVendorId` などの業務IDを含めない',
          '送付文書メタデータは `application_documents.owner_type=''RFQ_VENDOR''`、`rfq_id=契約のRFQ ID`、`rfq_vendor_id=対象依頼先ID`、`document_category=''REQUEST_ATTACHMENT''`、`document_type`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`storage_format`、`uploaded_by_user_id`、`uploaded_at` として保存する。S3バケット名やHTTPS URLはDBへ保存しない',
          'Amazon S3保存後に文書メタデータ保存または依頼先状態更新へ失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄する。破棄に失敗した場合は 502 (`MAINTENANCE_CONTRACT_FILE_502_S3_WRITE_FAILED`) を返却し、再試行可能な運用ログを残す',
          '`rfq_vendors.request_status=''SENT''`、`requested_at=現在日時`、`requested_by_user_id=ログインユーザー` を更新する'
        )
        ResponseTitle = 'レスポンス（200：RfqVendorSendResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('rfqVendorId', 'int64', '✓', '送信済みにした依頼先ID'),
          @('requestStatus', 'string', '✓', '`SENT`'),
          @('requestedAt', 'datetime', '✓', '送信日時')
        )
        StatusRows = @(
          @('200', '送信状態更新成功', 'RfqVendorSendResponse'),
          @('400', '送付文書メタデータまたはファイル本体が不正', 'ErrorResponse'),
          @('404', '対象契約または依頼先が存在しない', 'ErrorResponse'),
          @('409', '対象契約ステータスまたは依頼先状態が不正', 'ErrorResponse'),
          @('502', 'S3保存または保存後ロールバック失敗', 'ErrorResponse')
        )
      },
      @{
        Title = '見積依頼完了（/quotation-data-box/maintenance-contracts/{maintenanceContractId}/quote-request/complete）'
        Overview = '少なくとも1社に見積依頼を送信済みであることを確認し、契約ステータスを `見積依頼済` へ進める。'
        Method = 'POST'
        Path = '/quotation-data-box/maintenance-contracts/{maintenanceContractId}/quote-request/complete'
        Auth = '要（Bearer）'
        ParametersTitle = 'パスパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('maintenanceContractId', 'path', 'int64', '✓', '保守契約ID')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象契約が `見積依頼` であることを確認する',
          '`rfq_vendors.request_status=''SENT''` の依頼先が1件以上存在することを確認する',
          '`maintenance_contracts.status=''見積依頼済''`、`maintenance_contracts.last_status_changed_at=現在日時`、`rfqs.status=''見積依頼済''`、`rfqs.last_status_changed_at=現在日時` を同一トランザクションで更新する'
        )
        ResponseTitle = 'レスポンス（200：StatusChangeResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('maintenanceContractId', 'int64', '✓', '保守契約ID'),
          @('status', 'string', '✓', '`見積依頼済`')
        )
        StatusRows = @(
          @('200', '遷移成功', 'StatusChangeResponse'),
          @('404', '対象契約が存在しない', 'ErrorResponse'),
          @('409', '送信済み依頼先が0件、またはステータス不正', 'ErrorResponse')
        )
      },
      @{
        Title = '申請見送り（/quotation-data-box/maintenance-contracts/{maintenanceContractId}/cancel）'
        Overview = 'STEP①で保守契約タスクを申請見送りにし、通常一覧から除外する。'
        Method = 'POST'
        Path = '/quotation-data-box/maintenance-contracts/{maintenanceContractId}/cancel'
        Auth = '要（Bearer）'
        ParametersTitle = 'パスパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('maintenanceContractId', 'path', 'int64', '✓', '保守契約ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('-', '-', '-', 'リクエストボディなし')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象契約が `見積依頼` であることを確認する',
          'RFQ作成済みの場合は `rfqs.status=''申請を見送る''`、`rfqs.last_status_changed_at=現在日時` へ更新する',
          '未送信の `rfq_vendors.request_status=''DRAFT''` は `CANCELED` へ更新する',
          '送信済みの `rfq_vendors.request_status=''SENT''` は送信履歴として保持する',
          '`maintenance_contracts.status=''申請見送り''`、`maintenance_contracts.last_status_changed_at=現在日時` を同一トランザクションで更新する',
          '申請見送り契約は監査目的で保持し、通常一覧から除外する'
        )
        ResponseTitle = 'レスポンス（200：StatusChangeResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('maintenanceContractId', 'int64', '✓', '保守契約ID'),
          @('status', 'string', '✓', '`申請見送り`')
        )
        StatusRows = @(
          @('200', '申請見送り成功', 'StatusChangeResponse'),
          @('404', '対象契約が存在しない', 'ErrorResponse'),
          @('409', '対象契約が見積依頼以外', 'ErrorResponse')
        )
      },
      @{
        Title = '保守契約詳細取得（/maintenance-quote-registration/contracts/{maintenanceContractId}）'
        Overview = '保守契約見積登録画面の3ステップ表示に必要な契約ヘッダー、対象資産、RFQ、見積、文書を取得する。'
        Method = 'GET'
        Path = '/maintenance-quote-registration/contracts/{maintenanceContractId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'パスパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('maintenanceContractId', 'path', 'int64', '✓', '保守契約ID')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象契約が作業対象施設に属することを確認する',
          '`maintenance_contracts.status` から画面ステップを算出する',
          '対象資産は `excluded_flag` を含めて返し、明細登録画面では除外済み行を履歴として表示できるようにする',
          '見積依頼、見積、契約書、契約補助資料を `application_documents` から取得する'
        )
        ResponseTitle = 'レスポンス（200：MaintenanceContractDetailResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('contract', 'MaintenanceContractHeader', '✓', '契約ヘッダー'),
          @('currentStep', 'int32', '✓', '`1` / `2` / `3`。ステータスから算出'),
          @('assets', 'MaintenanceContractAssetDetail[]', '✓', '契約対象資産明細'),
          @('rfq', 'MaintenanceRfqSummary', '-', '保守契約RFQ'),
          @('vendors', 'RfqVendorSummary[]', '✓', '見積依頼先'),
          @('quotations', 'MaintenanceQuotationSummary[]', '✓', '登録済み見積'),
          @('documents', 'DocumentSummary[]', '✓', '契約関連ドキュメント'),
          @('availableActions', 'string[]', '✓', '画面表示可能操作')
        )
        StatusRows = @(
          @('200', '取得成功', 'MaintenanceContractDetailResponse'),
          @('404', '対象契約が存在しない', 'ErrorResponse'),
          @('403', '実効 `maintenance_contract` なし', 'ErrorResponse')
        )
      },
      @{
        Title = '契約対象資産明細登録（/maintenance-quote-registration/contracts/{maintenanceContractId}/assets）'
        Overview = 'STEP③の明細登録として、対象資産別の点検情報、保証条件、契約単価を保存し、必要に応じて契約対象資産を追加する。'
        Method = 'PUT'
        Path = '/maintenance-quote-registration/contracts/{maintenanceContractId}/assets'
        Auth = '要（Bearer）'
        ParametersTitle = 'パスパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('maintenanceContractId', 'path', 'int64', '✓', '保守契約ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('assets', 'MaintenanceContractAssetSaveInput[]', '✓', '保存対象明細。1件以上')
        )
        RequestSubtables = @(
          @{
            Title = 'assets要素（MaintenanceContractAssetSaveInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $contractAssetSaveInputRows
          }
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象契約が `見積登録済` であることを確認する',
          '指定資産が作業対象施設に属することを確認する',
          '同一契約内に同一 `assetLedgerId` が重複しないことを検証する',
          '既存 `maintenanceContractAssetId` は更新し、新規 `assetLedgerId` は `maintenance_contract_assets` に追加する',
          '明細登録自体は保守登録の前提として必須だが、点検情報・契約単価の個別入力は任意とする'
        )
        ResponseTitle = 'レスポンス（200：MaintenanceContractAssetsSaveResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('assets', 'MaintenanceContractAssetDetail[]', '✓', '保存後の対象資産明細'),
          @('assetCount', 'int32', '✓', '有効対象資産数')
        )
        StatusRows = @(
          @('200', '保存成功', 'MaintenanceContractAssetsSaveResponse'),
          @('400', '入力値不正', 'ErrorResponse'),
          @('404', '対象契約または資産が存在しない', 'ErrorResponse'),
          @('409', 'ステータス不正、または資産重複', 'ErrorResponse')
        )
      },
      @{
        Title = '見積登録（/maintenance-quote-registration/contracts/{maintenanceContractId}/quotations）'
        Overview = 'STEP②で発注登録用見積または参考見積を登録する。'
        Method = 'POST'
        Path = '/maintenance-quote-registration/contracts/{maintenanceContractId}/quotations'
        Auth = '要（Bearer）'
        ParametersTitle = 'パスパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('maintenanceContractId', 'path', 'int64', '✓', '保守契約ID')
        )
        RequestTitle = 'リクエストボディ（multipart/form-data）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('payload.quotationPhase', 'string', '✓', '`発注登録用見積` / `参考見積`'),
          @('payload.quotationOn', 'date', '-', '見積日。未指定時は業務日を保存する'),
          @('payload.storageFormat', 'string', '✓', '`電子取引` / `スキャナ保存` / `未指定`。ファイル保存先ではなく保存形式区分を表す'),
          @('payload.vendorId', 'int64', '-', '業者マスタID'),
          @('payload.vendorName', 'string', '✓', '見積登録業者名'),
          @('payload.quotationAmountExclTax', 'decimal', '-', '見積金額(税抜)'),
          @('payload.annualAmountExclTax', 'decimal', '-', '単年度金額(税抜)'),
          @('payload.accountDivisionCode', 'string', '-', '会計区分コード'),
          @('payload.document', 'DocumentInput', '✓', '見積原本メタデータ。`filePartName` で対応するファイルパートを指定する'),
          @('files', 'binary[]', '✓', '`payload.document.filePartName` で参照される見積原本ファイル本体')
        )
        RequestSubtables = @(
          @{ Title = 'payload.document要素（DocumentInput）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $quotationDocumentInputRows }
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象契約が `見積依頼済` または `見積登録済` であることを確認する',
          '`payload.document.filePartName` が multipart のファイルパートに存在することを確認し、拡張子・MIME Type・ファイルサイズ・`contentHash` を検証する',
          '`quotation_no` を採番し、`quotation_on` は入力値または業務日で `quotations` を作成する。`rfq_id` は保守契約RFQに紐づける。`payload.storageFormat` は見積原本メタデータの `application_documents.storage_format` に保存する',
          '見積原本ファイル本体をAPI内でAmazon S3へPutObjectし、S3オブジェクトキーは `application-documents/facility-{facilityId}/{yyyy}/{mm}/{uploadUuid}.{ext}` 形式で発行する。keyは保存場所識別子であり、`maintenanceContractId` や `quotationId` などの業務IDを含めない',
          '見積原本は `application_documents.owner_type=''QUOTATION''`、`quotation_id=作成した見積ID`、`document_category=''QUOTATION''`、`document_type`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`storage_format=payload.storageFormat`、`uploaded_by_user_id`、`uploaded_at` として保存する。S3バケット名やHTTPS URLはDBへ保存しない',
          'Amazon S3保存後に見積作成または文書メタデータ保存へ失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄する。破棄に失敗した場合は 502 (`MAINTENANCE_CONTRACT_FILE_502_S3_WRITE_FAILED`) を返却し、再試行可能な運用ログを残す',
          '参考見積は登録できるが、契約登録時の採用見積にはできない'
        )
        ResponseTitle = 'レスポンス（201：MaintenanceQuotationCreateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('quotation', 'MaintenanceQuotationSummary', '✓', '登録済み見積'),
          @('status', 'string', '✓', '保守契約ステータス。登録のみでは変更しない')
        )
        StatusRows = @(
          @('201', '登録成功', 'MaintenanceQuotationCreateResponse'),
          @('400', '見積フェーズ、金額、文書メタデータまたはファイル本体が不正', 'ErrorResponse'),
          @('404', '対象契約または業者が存在しない', 'ErrorResponse'),
          @('409', 'ステータス不正', 'ErrorResponse'),
          @('502', 'S3保存または保存後ロールバック失敗', 'ErrorResponse')
        )
      },
      @{
        Title = '見積登録完了（/maintenance-quote-registration/contracts/{maintenanceContractId}/quotations/complete）'
        Overview = '発注登録用見積が1件以上あることを確認し、契約ステータスを `見積登録済` へ進める。'
        Method = 'POST'
        Path = '/maintenance-quote-registration/contracts/{maintenanceContractId}/quotations/complete'
        Auth = '要（Bearer）'
        ParametersTitle = 'パスパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('maintenanceContractId', 'path', 'int64', '✓', '保守契約ID')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象契約が `見積依頼済` または `見積登録済` であることを確認する',
          '未削除の `quotation_phase=''発注登録用見積''` が1件以上あることを確認する',
          '`maintenance_contracts.status=''見積登録済''`、`maintenance_contracts.last_status_changed_at=現在日時`、`rfqs.status=''見積DB登録済''`、`rfqs.last_status_changed_at=現在日時` を同一トランザクションで更新する'
        )
        ResponseTitle = 'レスポンス（200：StatusChangeResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('maintenanceContractId', 'int64', '✓', '保守契約ID'),
          @('status', 'string', '✓', '`見積登録済`')
        )
        StatusRows = @(
          @('200', '遷移成功', 'StatusChangeResponse'),
          @('404', '対象契約が存在しない', 'ErrorResponse'),
          @('409', '発注登録用見積が0件、またはステータス不正', 'ErrorResponse')
        )
      },
      @{
        Title = '見積削除（/maintenance-quote-registration/contracts/{maintenanceContractId}/quotations/{quotationId}）'
        Overview = '保守登録前の見積を論理削除する。採用済み見積または完了後の見積は削除できない。'
        Method = 'DELETE'
        Path = '/maintenance-quote-registration/contracts/{maintenanceContractId}/quotations/{quotationId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'パスパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('maintenanceContractId', 'path', 'int64', '✓', '保守契約ID'),
          @('quotationId', 'path', 'int64', '✓', '見積ID')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象契約が `完了` ではないことを確認する',
          '対象見積が契約の保守契約RFQに属することを確認する',
          '`quotations.status=''ORDER_SELECTED''` の採用済み見積は削除不可とする',
          '`quotations.deleted_at` と対象見積所有の `application_documents.deleted_at` を更新する',
          'S3実体は即時DeleteObjectせず、同一S3オブジェクトキーを参照する有効メタデータがなくなったことと保存期間を確認するS3ライフサイクルまたは後続クリーンアップで扱う'
        )
        ResponseTitle = 'レスポンス（204：なし）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('-', '-', '-', 'レスポンスボディなし')
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('404', '対象契約または見積が存在しない', 'ErrorResponse'),
          @('409', '採用済み、完了済み、またはステータス不正', 'ErrorResponse')
        )
      },
      @{
        Title = '契約登録保存（/maintenance-quote-registration/contracts/{maintenanceContractId}/contract-registration）'
        Overview = 'STEP③で決済No.、契約期間、採用見積などの契約情報を保存する。保存のみでは `完了` へ進めない。'
        Method = 'PUT'
        Path = '/maintenance-quote-registration/contracts/{maintenanceContractId}/contract-registration'
        Auth = '要（Bearer）'
        ParametersTitle = 'パスパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('maintenanceContractId', 'path', 'int64', '✓', '保守契約ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('settlementNo', 'string', '-', '決済No.'),
          @('maintenanceType', 'string', '✓', '契約種別'),
          @('maintenanceTypeNote', 'string', '-', '種別備考'),
          @('contractedOn', 'date', '-', '契約日'),
          @('contractStartOn', 'date', '✓', '契約開始日'),
          @('contractEndOn', 'date', '✓', '契約終了日。契約開始日以降'),
          @('contractReviewStartOn', 'date', '-', '契約検討開始日'),
          @('adoptedQuotationId', 'int64', '✓', '採用見積ID。発注登録用見積のみ指定可')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象契約が `見積登録済` であることを確認する',
          '契約終了日が契約開始日以降であることを検証する',
          '採用見積が未削除かつ `quotation_phase=''発注登録用見積''` であることを確認する',
          '採用見積を `quotations.status=''ORDER_SELECTED''` に更新し、他見積は採用解除する',
          '採用見積の業者、担当、メール、連絡先、金額、単年度金額を `maintenance_contracts` へ契約時点スナップショットとして転記する'
        )
        ResponseTitle = 'レスポンス（200：MaintenanceContractHeaderResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('maintenanceContractId', 'int64', '✓', '保守契約ID'),
          @('status', 'string', '✓', '`見積登録済`'),
          @('adoptedQuotationId', 'int64', '✓', '採用見積ID'),
          @('contractStartOn', 'date', '✓', '契約開始日'),
          @('contractEndOn', 'date', '✓', '契約終了日')
        )
        StatusRows = @(
          @('200', '保存成功', 'MaintenanceContractHeaderResponse'),
          @('400', '日付前後関係不正、必須不足', 'ErrorResponse'),
          @('404', '対象契約または採用見積が存在しない', 'ErrorResponse'),
          @('409', 'ステータス不正、または参考見積指定', 'ErrorResponse')
        )
      },
      @{
        Title = '契約ドキュメント登録（/maintenance-quote-registration/contracts/{maintenanceContractId}/documents）'
        Overview = 'STEP③で契約書、免責部品一覧などの契約関連ドキュメントを登録する。'
        Method = 'POST'
        Path = '/maintenance-quote-registration/contracts/{maintenanceContractId}/documents'
        Auth = '要（Bearer）'
        ParametersTitle = 'パスパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('maintenanceContractId', 'path', 'int64', '✓', '保守契約ID')
        )
        RequestTitle = 'リクエストボディ（multipart/form-data）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('payload.documents', 'DocumentInput[]', '✓', '登録する契約関連ドキュメント。1件以上。各要素の `filePartName` で対応するファイルパートを指定する'),
          @('files', 'binary[]', '✓', '`payload.documents[].filePartName` で参照される契約関連ドキュメントのファイル本体')
        )
        RequestSubtables = @(
          @{ Title = 'payload.documents要素（DocumentInput）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentInputRows }
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象契約が `見積登録済` であることを確認する',
          '`payload.documents[].filePartName` が multipart のファイルパートに存在することを確認し、拡張子・MIME Type・ファイルサイズ・`contentHash` を検証する',
          '各ファイル本体をAPI内でAmazon S3へPutObjectし、S3オブジェクトキーは `application-documents/facility-{facilityId}/{yyyy}/{mm}/{uploadUuid}.{ext}` 形式で発行する。keyは保存場所識別子であり、`maintenanceContractId` などの業務IDを含めない',
          '各文書を `application_documents.owner_type=''RFQ''`、`rfq_id=契約のRFQ ID`、`document_category=''CONTRACT''`、`document_type`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`storage_format`、`uploaded_by_user_id`、`uploaded_at` として保存する。S3バケット名やHTTPS URLはDBへ保存しない',
          'Amazon S3保存後に文書メタデータ保存または業務トランザクションへ失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄する。破棄に失敗した場合は 502 (`MAINTENANCE_CONTRACT_FILE_502_S3_WRITE_FAILED`) を返却し、再試行可能な運用ログを残す'
        )
        ResponseTitle = 'レスポンス（201：DocumentCreateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('documents', 'DocumentSummary[]', '✓', '登録後の文書一覧')
        )
        StatusRows = @(
          @('201', '登録成功', 'DocumentCreateResponse'),
          @('400', '文書メタデータまたはファイル本体が不正', 'ErrorResponse'),
          @('404', '対象契約が存在しない', 'ErrorResponse'),
          @('409', 'ステータス不正', 'ErrorResponse'),
          @('502', 'S3保存または保存後ロールバック失敗', 'ErrorResponse')
        )
      },
      @{
        Title = '契約ドキュメント削除（/maintenance-quote-registration/contracts/{maintenanceContractId}/documents/{documentId}）'
        Overview = '保守登録前の契約関連ドキュメントを論理削除する。'
        Method = 'DELETE'
        Path = '/maintenance-quote-registration/contracts/{maintenanceContractId}/documents/{documentId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'パスパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('maintenanceContractId', 'path', 'int64', '✓', '保守契約ID'),
          @('documentId', 'path', 'int64', '✓', 'ドキュメントID')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象契約が `完了` ではないことを確認する',
          '対象ドキュメントが契約の保守契約RFQに属する `owner_type=''RFQ''` の文書であることを確認する',
          '`application_documents.deleted_at` を更新する',
          'S3実体は即時DeleteObjectせず、同一S3オブジェクトキーを参照する有効メタデータがなくなったことと保存期間を確認するS3ライフサイクルまたは後続クリーンアップで扱う'
        )
        ResponseTitle = 'レスポンス（204：なし）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('-', '-', '-', 'レスポンスボディなし')
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('404', '対象契約または文書が存在しない', 'ErrorResponse'),
          @('409', '完了済み契約の文書削除不可', 'ErrorResponse')
        )
      },
      @{
        Title = '保守登録完了（/maintenance-quote-registration/contracts/{maintenanceContractId}/complete）'
        Overview = 'STEP③の必須条件を検証し、保守契約を `完了` にする。同時に保守契約由来の点検タスクを作成または更新する。'
        Method = 'POST'
        Path = '/maintenance-quote-registration/contracts/{maintenanceContractId}/complete'
        Auth = '要（Bearer）'
        ParametersTitle = 'パスパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('maintenanceContractId', 'path', 'int64', '✓', '保守契約ID')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象契約が `見積登録済` であることを確認する',
          '採用見積が存在することを確認する',
          '契約開始日・契約終了日が入力済みであることを確認する',
          '`excluded_flag=false` の明細登録済み対象資産が1件以上あることを確認する',
          '`application_documents.owner_type=''RFQ''` かつ `document_category=''CONTRACT''` の契約書または契約補助資料が1件以上あることを確認する',
          '点検種別が設定された対象資産について `inspection_tasks` を作成または更新する',
          '別契約由来で同一資産・同一点検種別の有効タスクがある場合は競合として扱い、保守登録を中断する',
          '`maintenance_contracts.status=''完了''`、`maintenance_contracts.last_status_changed_at=現在日時` を更新する'
        )
        ResponseTitle = 'レスポンス（200：MaintenanceContractCompleteResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('maintenanceContractId', 'int64', '✓', '保守契約ID'),
          @('status', 'string', '✓', '`完了`'),
          @('createdInspectionTaskIds', 'int64[]', '✓', '作成した点検タスクID'),
          @('updatedInspectionTaskIds', 'int64[]', '✓', '更新した点検タスクID')
        )
        StatusRows = @(
          @('200', '保守登録成功', 'MaintenanceContractCompleteResponse'),
          @('400', '入力値不正', 'ErrorResponse'),
          @('404', '対象契約が存在しない', 'ErrorResponse'),
          @('409', '必須条件不足、点検タスク競合、ステータス不正', 'ErrorResponse')
        )
      },
      @{
        Title = '契約内容見直し登録（/quotation-data-box/maintenance-contracts/{maintenanceContractId}/content-review）'
        Overview = '完了かつ契約中の保守契約に対して、既存資産の除外、新規資産追加、見直し後契約金額、理由、契約変更文書を履歴登録する。'
        Method = 'POST'
        Path = '/quotation-data-box/maintenance-contracts/{maintenanceContractId}/content-review'
        Auth = '要（Bearer）'
        ParametersTitle = 'パスパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('maintenanceContractId', 'path', 'int64', '✓', '保守契約ID')
        )
        RequestTitle = 'リクエストボディ（multipart/form-data）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('payload.removeMaintenanceContractAssetIds', 'int64[]', '-', '除外する既存契約対象資産ID'),
          @('payload.addAssetLedgerIds', 'int64[]', '-', '追加する資産台帳ID'),
          @('payload.newContractAmountExclTax', 'decimal', '✓', '見直し後契約金額(税抜)'),
          @('payload.reviewReason', 'string', '✓', '見直し理由'),
          @('payload.documents', 'DocumentInput[]', '✓', '契約変更覚書等の文書。1件以上。各要素の `filePartName` で対応するファイルパートを指定する'),
          @('files', 'binary[]', '✓', '`payload.documents[].filePartName` で参照される契約変更文書のファイル本体')
        )
        RequestSubtables = @(
          @{ Title = 'payload.documents要素（DocumentInput）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentInputRows }
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象契約が `完了` かつ `contract_end_on >= 業務日` であることを確認する',
          '除外対象または追加対象のいずれか1件以上が指定されていることを確認する',
          '除外対象が対象契約に属し、まだ `excluded_flag=false` であることを確認する',
          '追加対象資産が作業対象施設に属し、同一契約内に未除外の同一資産が存在しないことを確認する',
          '`review_no` を採番し、`maintenance_contract_reviews.review_type=''CONTENT_REVIEW''`、変更前金額、見直し後金額、理由、`reviewed_by_user_id=ログインユーザー`、`reviewed_at=現在日時` を保存する',
          '除外対象は `maintenance_contract_assets.excluded_flag=true` に更新する',
          '追加対象は `maintenance_contract_assets` に `excluded_flag=false` で新規作成する',
          '追加/除外の履歴を `maintenance_contract_review_assets` に作成する',
          '`payload.documents[].filePartName` が multipart のファイルパートに存在することを確認し、拡張子・MIME Type・ファイルサイズ・`contentHash` を検証する',
          '契約変更文書ファイル本体をAPI内でAmazon S3へPutObjectし、S3オブジェクトキーは `application-documents/facility-{facilityId}/{yyyy}/{mm}/{uploadUuid}.{ext}` 形式で発行する。keyは保存場所識別子であり、`maintenanceContractId` や `maintenanceContractReviewId` などの業務IDを含めない',
          '契約変更文書は `application_documents.owner_type=''MAINTENANCE_CONTRACT_REVIEW''`、`maintenance_contract_review_id=作成した見直しID`、`document_category=''CONTRACT_REVIEW''`、`document_type`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`storage_format`、`uploaded_by_user_id`、`uploaded_at` として保存する。S3バケット名やHTTPS URLはDBへ保存しない',
          'Amazon S3保存後に見直し履歴、資産追加/除外、金額更新、文書メタデータ保存のいずれかへ失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄する。破棄に失敗した場合は 502 (`MAINTENANCE_CONTRACT_FILE_502_S3_WRITE_FAILED`) を返却し、再試行可能な運用ログを残す',
          '`maintenance_contracts.contract_amount_excl_tax` を見直し後金額へ更新し、ステータスは `完了` のまま維持する'
        )
        ResponseTitle = 'レスポンス（201：MaintenanceContractReviewResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('maintenanceContractReviewId', 'int64', '✓', '契約内容見直しID'),
          @('reviewNo', 'string', '✓', '見直しNo.'),
          @('status', 'string', '✓', '`完了`'),
          @('newContractAmountExclTax', 'decimal', '✓', '反映後契約金額'),
          @('addedAssetCount', 'int32', '✓', '追加資産数'),
          @('removedAssetCount', 'int32', '✓', '除外資産数')
        )
        StatusRows = @(
          @('201', '登録成功', 'MaintenanceContractReviewResponse'),
          @('400', '見直し対象未指定、金額、理由、文書メタデータまたはファイル本体が不正', 'ErrorResponse'),
          @('404', '対象契約または資産が存在しない', 'ErrorResponse'),
          @('409', '期限切れ、ステータス不正、資産重複', 'ErrorResponse'),
          @('502', 'S3保存または保存後ロールバック失敗', 'ErrorResponse')
        )
      },
      @{
        Title = '契約更新作成（/quotation-data-box/maintenance-contracts/{maintenanceContractId}/renewal）'
        Overview = '完了済み契約から後継の保守契約グループを作成し、`見積依頼` から再開する。'
        Method = 'POST'
        Path = '/quotation-data-box/maintenance-contracts/{maintenanceContractId}/renewal'
        Auth = '要（Bearer）'
        ParametersTitle = 'パスパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('maintenanceContractId', 'path', 'int64', '✓', '更新元保守契約ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('contractGroupName', 'string', '✓', '後継契約グループ名'),
          @('maintenanceType', 'string', '✓', '後継契約の契約種別。保守契約/定期点検/スポット契約/借用契約/その他'),
          @('maintenanceTypeNote', 'string', '-', '後継契約の種別備考'),
          @('contractReviewStartOn', 'date', '-', '後継契約の契約検討開始日'),
          @('comment', 'string', '-', '後継契約コメント')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '更新元契約が `完了` であることを確認する',
          '更新元契約を再オープンせず、`maintenance_contract_no` を採番して新しい `maintenance_contracts` を `contract_group_name=入力値`、`maintenance_type=入力値`、`maintenance_type_note=入力値`、`status=''見積依頼''`、`remote_maintenance_available=false`、`on_call_support=false`、`last_status_changed_at=現在日時` で作成する',
          '新契約の `renewal_source_maintenance_contract_id` に更新元契約IDを保持する',
          '複製するのは部署情報・商品情報・対象資産のみとする',
          '見積依頼先、登録済み見積、採用見積、契約業者、契約金額、契約期間、契約書・添付ドキュメント、点検情報、契約単価は複製しない',
          '更新元契約の `excluded_flag=true` の対象資産は複製対象から除外する',
          '複製する対象資産は後継契約の `maintenance_contract_assets` に `excluded_flag=false` で作成し、点検情報と契約単価は複製しない'
        )
        ResponseTitle = 'レスポンス（201：MaintenanceContractRenewalResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('sourceMaintenanceContractId', 'int64', '✓', '更新元保守契約ID'),
          @('newMaintenanceContractId', 'int64', '✓', '作成した後継保守契約ID'),
          @('newMaintenanceContractNo', 'string', '✓', '後継保守契約No.'),
          @('status', 'string', '✓', '`見積依頼`'),
          @('assetCount', 'int32', '✓', '複製した対象資産数'),
          @('nextPath', 'string', '✓', '`/maintenance-quote-registration?id={newMaintenanceContractId}`')
        )
        StatusRows = @(
          @('201', '作成成功', 'MaintenanceContractRenewalResponse'),
          @('404', '更新元契約が存在しない', 'ErrorResponse'),
          @('409', '更新元契約が完了ではない、または複製対象資産が0件', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '権限対応表' },
    @{ Type = 'Table'; Headers = @('対象操作', '対象API', '必要権限', '業務条件'); Rows = @(
      @('一覧表示・詳細閲覧', 'GET系API', '`maintenance_contract`', '通常アカウントは作業対象施設に有効なユーザー割当があり、施設提供設定とユーザー施設別設定の双方で保守契約管理が有効。共有システム管理者アカウントは作業対象施設が未削除であれば通常権限判定をバイパスする'),
      @('契約グループ作成', 'POST /quotation-data-box/maintenance-contracts', '`maintenance_contract`', '対象資産が作業対象施設に属し、対象資産が1件以上指定されている'),
      @('見積依頼・見積登録・契約登録', '/maintenance-quote-registration 配下の更新系API', '`maintenance_contract`', '保守契約ステータスが各工程の期待状態と一致する'),
      @('申請見送り', 'POST /quotation-data-box/maintenance-contracts/{maintenanceContractId}/cancel', '`maintenance_contract`', '対象契約が `見積依頼` であり、後続工程に進行していない'),
      @('契約内容見直し', 'POST /quotation-data-box/maintenance-contracts/{maintenanceContractId}/content-review', '`maintenance_contract`', '対象契約が `完了` かつ契約終了日を過ぎていない'),
      @('契約更新', 'POST /quotation-data-box/maintenance-contracts/{maintenanceContractId}/renewal', '`maintenance_contract`', '更新元契約が `完了` であり、複製対象の未除外資産が1件以上存在する')
    ) },
    @{ Type = 'Heading2'; Text = 'ステータス遷移ルール' },
    @{ Type = 'Table'; Headers = @('遷移元', '遷移先', '契機', '補足'); Rows = @(
      @('なし', '見積依頼', '契約グループ作成 / 契約更新', '`maintenance_contract_status_definitions.is_initial_status=true` の状態として作成する'),
      @('見積依頼', '見積依頼済', '見積依頼完了', '送信済み依頼先が1件以上必要'),
      @('見積依頼済', '見積登録済', '見積登録完了', '発注登録用見積が1件以上必要'),
      @('見積登録済', '完了', '保守登録', '採用見積、契約期間、明細、契約ドキュメントが揃っていること'),
      @('見積依頼', '申請見送り', '申請見送り', '通常一覧から除外する終端状態')
    ) },
    @{ Type = 'Heading2'; Text = '業務ルール' },
    @{ Type = 'Bullets'; Items = @(
      '保守契約は `applications` を作成せず、`maintenance_contracts` と `maintenance_contract_assets` を正本にする',
      '同一契約グループ内で同一 `asset_ledger_id` を重複登録してはならない',
      '契約内容見直しは契約ステータスを変えず、追加/除外履歴と見直し後金額を保持する',
      '契約更新は元契約を再オープンせず、契約グループ名と契約種別を新規入力した後継契約を `見積依頼` で作成する',
      '契約更新で複製するのは部署情報・商品情報・対象資産のみとし、見積、契約業者、契約金額、契約期間、文書、点検情報、契約単価は複製しない',
      '保守登録時の点検管理連携は、同一契約由来の `inspection_tasks` を作成または更新し、別契約由来の有効な同一資産・同一点検種別タスクがある場合は競合とする'
    ) },
    @{ Type = 'Heading2'; Text = '削除・取消制約' },
    @{ Type = 'Bullets'; Items = @(
      '見積削除は保守登録前かつ採用前のみ許可し、物理削除せず `quotations.deleted_at` と対象見積所有の `application_documents.deleted_at` を設定する。S3実体はS3ライフサイクルまたは後続クリーンアップで扱う',
      '契約ドキュメント削除は完了前のみ許可し、物理削除せず `application_documents.deleted_at` を設定する。S3実体はS3ライフサイクルまたは後続クリーンアップで扱う',
      '申請見送りは `見積依頼` のみ許可し、RFQ作成済みの場合はRFQも `申請を見送る` へ終端化する',
      '完了済み契約は前工程へ戻さず、契約内容見直しまたは契約更新で後続運用する'
    ) },
    @{ Type = 'Heading2'; Text = '未確定事項' },
    @{ Type = 'Paragraph'; Text = '本書時点で、API実装判断を止める未確定事項はない。' },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTPステータス', '内容', '発生条件'); Rows = $errorRows },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = '監査・履歴' },
    @{ Type = 'Bullets'; Items = @(
      '契約ステータス更新時は `maintenance_contracts.last_status_changed_at` を同一トランザクションで更新する',
      '見積依頼送信者は `rfq_vendors.requested_by_user_id` に保持する',
      '契約内容見直しの登録者は `maintenance_contract_reviews.reviewed_by_user_id` に保持する',
      '契約書、見積書、契約変更覚書などの文書メタデータは `application_documents` に一元保存し、`file_path` にはAmazon S3のS3オブジェクトキーのみを保持する。S3バケット名やHTTPS URLは保持しない',
      '見積削除、契約ドキュメント削除は物理削除せず `deleted_at` を設定し、S3実体は同一S3オブジェクトキーを参照する有効メタデータがなくなったことと保存期間を確認するS3ライフサイクルまたは後続クリーンアップで扱う'
    ) },
    @{ Type = 'Heading2'; Text = '排他制御' },
    @{ Type = 'Bullets'; Items = @(
      'ステータス遷移を伴うAPIは更新前に現在ステータスを検証し、期待状態と異なる場合は 409 を返す',
      '同一契約内の同一資産重複はDB一意制約とアプリケーション検証の両方で禁止する',
      '保守登録時の点検管理連携は、契約完了更新と点検タスク作成・更新を同一トランザクションで扱う',
      '契約内容見直しは、見直し履歴、資産追加/除外、契約金額更新、文書登録を同一トランザクションで扱う'
    ) },
    @{ Type = 'Heading2'; Text = '対象外' },
    @{ Type = 'Bullets'; Items = @(
      '契約終了後の過去Document専用閲覧画面は本API設計書では独立定義しない。期限切れ契約を `includeExpired=true` で取得し、詳細取得APIで文書を参照する',
      '点検実施、点検結果登録、メーカー保守結果登録は No.30 点検管理APIの責務とする',
      '購入・移動・廃棄の申請起票は No.13 資産申請起票APIの責務であり、保守契約は `applications` を作成しない'
    ) }
  )
}

function Normalize-MaintenanceContractEndpointStatusRows {
  param(
    [object[]]$Rows
  )

  $normalizedRows = [System.Collections.Generic.List[object]]::new()
  $has401 = @($Rows | Where-Object { $_[0] -eq '401' }).Count -gt 0
  $has403 = @($Rows | Where-Object { $_[0] -eq '403' }).Count -gt 0
  $has404 = @($Rows | Where-Object { $_[0] -eq '404' }).Count -gt 0

  foreach ($row in $Rows) {
    if ($row[0] -eq '403') {
      $row[1] = $auth403StatusRow[1]
    }

    if (($row[0] -eq '404') -and ([string]$row[1] -notmatch '作業対象施設')) {
      $row[1] = "作業対象施設が存在しない/削除済み、または、$($row[1])"
    }

    [void]$normalizedRows.Add($row)
  }

  if (-not $has401) {
    [void]$normalizedRows.Add($auth401StatusRow)
  }

  if (-not $has403) {
    [void]$normalizedRows.Add($auth403StatusRow)
  }

  if (-not $has404) {
    [void]$normalizedRows.Add($workFacility404StatusRow)
  }

  return @($normalizedRows.ToArray() | Sort-Object `
    @{ Expression = { [int]$_[0] }; Ascending = $true }, `
    @{ Expression = { if ([string]$_[1] -match '作業対象施設') { 0 } else { 1 } }; Ascending = $true })
}

foreach ($section in @($spec.Sections | Where-Object { $_.Type -eq 'EndpointBlocks' })) {
  foreach ($endpoint in @($section.Items)) {
    $endpoint.StatusRows = Normalize-MaintenanceContractEndpointStatusRows -Rows $endpoint.StatusRows
  }
}

$spec
