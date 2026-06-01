$purchasePermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_purchase` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_purchase` が有効であること'
)

$quotationPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_quotation` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_quotation` が有効であること',
  '認可条件: 対象RFQは `rfqs.management_type=''PURCHASE''` かつ `workflow_type=''RFQ''` かつ `deleted_at IS NULL` であること'
)

$orderPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_order` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_order` が有効であること',
  '認可条件: 対象RFQは `rfqs.management_type=''PURCHASE''` かつ `workflow_type=''RFQ''` かつ `deleted_at IS NULL` であること'
)

$acceptancePermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_acceptance` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_acceptance` が有効であること',
  '認可条件: 対象RFQは `rfqs.management_type=''PURCHASE''` かつ `workflow_type=''RFQ''` かつ `deleted_at IS NULL` であること'
)

$contextPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_purchase` / `normal_order` / `normal_acceptance` / `normal_quotation` 判定をバイパスする。`normal_ship_request` はSHIPへ一括依頼ボタンの表示可否として有効扱いにする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、購入管理タブ入口は作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_purchase` / `normal_order` / `normal_acceptance` / `normal_quotation` のいずれかが有効であれば参照可能とする',
  '認可条件: 個別操作APIでは、各操作に対応する `feature_code` をサーバー側で再判定する',
  '認可条件: 通常アカウントの `normal_ship_request` は購入管理タブ表示権限とは独立し、SHIPへ一括依頼ボタンの表示可否だけに使用する'
)

$workFacilityProcessingLine = 'Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。'

$commonErrorRows = @(
  @('AUTH_401_UNAUTHORIZED', '401', '認証情報が存在しない、または無効', 'Bearer トークン未指定、期限切れ、署名不正'),
  @('FACILITY_NOT_FOUND', '404', '作業対象施設を参照できない', 'Bearer トークン上の作業対象施設が存在しない、または削除済み'),
  @('AUTH_403_PURCHASE_DENIED', '403', '購入管理の実効権限がない', '通常アカウントで `normal_purchase` が実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする'),
  @('AUTH_403_QUOTATION_DENIED', '403', '通常購入の見積登録・見積参照権限がない', '通常アカウントで `normal_quotation` が実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする'),
  @('AUTH_403_ORDER_DENIED', '403', '通常購入の発注権限がない', '通常アカウントで `normal_order` が実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする'),
  @('AUTH_403_ACCEPTANCE_DENIED', '403', '通常購入の検収・原本登録権限がない', '通常アカウントで `normal_acceptance` が実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする'),
  @('PURCHASE_APPLICATION_NOT_FOUND', '404', '購入申請を参照できない', 'ID不存在、施設不一致、削除済み、購入申請以外、または権限外'),
  @('PURCHASE_APPLICATION_STATUS_CONFLICT', '409', '購入申請の状態が操作条件を満たさない', '申請中以外の却下または編集リスト取り込み、既に取り込み済みの申請を処理した'),
  @('EDIT_LIST_NOT_FOUND', '404', '編集リストを参照できない', 'ID不存在、施設不一致、削除済み、または `list_type=''PURCHASE''` ではない'),
  @('EDIT_LIST_LOCK_CONFLICT', '409', '編集リスト作業ロックが無効', '既存編集リストへの取り込み時に `lock_token` が未指定、期限切れ、または保持者不一致'),
  @('RFQ_GROUP_NOT_FOUND', '404', 'RFQグループを参照できない', 'ID不存在、施設不一致、削除済み、または `management_type=''PURCHASE''` ではない'),
  @('RFQ_STATUS_CONFLICT', '409', 'RFQステータスが操作条件を満たさない', '発注済以降の削除、未送信条件不一致、ステータス遷移順序不一致'),
  @('RFQ_VENDOR_NOT_FOUND', '404', '見積依頼先を参照できない', 'ID不存在、RFQ不一致、削除済み'),
  @('QUOTATION_NOT_FOUND', '404', '見積を参照できない', 'ID不存在、RFQ不一致、削除済み'),
  @('ORDER_NOT_FOUND', '404', '発注を参照できない', 'ID不存在、RFQ不一致'),
  @('ORDER_QUOTATION_REQUIRED', '409', '発注登録用見積が確定済みでない', '発注登録時に `発注見積登録済` のRFQまたは採用見積が存在しない'),
  @('INDIVIDUAL_REGISTRATION_INCOMPLETE', '409', '検収登録済み個体が不足している', '資産登録時に対象発注明細分の `individuals` が未作成'),
  @('VALIDATION_ERROR', '400', '入力値不正', '必須不足、列挙値不正、文字数超過、日付前後関係不正'),
  @('CONFLICT', '409', '競合更新', '`expectedUpdatedAt` または `Idempotency-Key` の競合'),
  @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー', '想定外例外')
)

$rfqSummaryRows = @(
  @('rfqGroupId', 'int64', '✓', '`rfqs.rfq_id`'),
  @('rfqNo', 'string', '✓', '`rfqs.rfq_no`'),
  @('rfqGroupName', 'string', '✓', '`rfqs.rfq_group_name`'),
  @('managementType', 'string', '✓', '`PURCHASE` 固定'),
  @('workflowType', 'string', '✓', '`RFQ`'),
  @('status', 'string', '✓', '`rfqs.status`'),
  @('quotationPhase', 'string', '-', '`rfqs.quotation_phase`'),
  @('dueOn', 'date', '-', '`rfqs.due_on`'),
  @('editListId', 'int64', '-', '`rfqs.edit_list_id`'),
  @('editListName', 'string', '-', '`edit_lists.list_name`'),
  @('targetItemCount', 'int32', '✓', '`rfq_applications` に紐づく有効明細数'),
  @('vendorRows', 'RfqVendorSummary[]', '✓', '画面表示用の業者行。依頼先未登録時は空配列'),
  @('availableActions', 'string[]', '✓', '`OPEN_RFQ_PROCESS` / `REGISTER_ORDER_QUOTATION` / `REGISTER_ORDER` / `REGISTER_DELIVERY_DATE` / `REGISTER_ACCEPTANCE` / `REGISTER_ASSET` / `DELETE_RFQ` など')
)

$rfqVendorRows = @(
  @('rfqVendorId', 'int64', '✓', '`rfq_vendors.rfq_vendor_id`'),
  @('vendorId', 'int64', '-', '業者マスタID。手入力業者は null'),
  @('vendorName', 'string', '✓', '依頼先業者名'),
  @('contactPerson', 'string', '-', '担当者名'),
  @('email', 'string', '-', 'メールアドレス'),
  @('phone', 'string', '-', '連絡先'),
  @('dueOn', 'date', '-', '提出期限'),
  @('requestNote', 'string', '-', 'ご依頼事項'),
  @('requestStatus', 'string', '✓', '`DRAFT` / `SENT` / `REPLIED` / `CANCELED`'),
  @('requestedAt', 'datetime', '-', '依頼送信日時'),
  @('requestedByUserId', 'int64', '-', '依頼実行者ユーザーID')
)

$documentRows = @(
  @('documentId', 'int64', '✓', '`application_documents.application_document_id`'),
  @('ownerType', 'string', '✓', '`APPLICATION` / `RFQ` / `RFQ_VENDOR` / `QUOTATION` / `ASSET_LEDGER`'),
  @('documentCategory', 'string', '✓', '`REQUEST_ATTACHMENT` / `RFQ_REQUEST` / `QUOTATION` / `ORDER` / `ACCEPTANCE` / `PHOTO` / `OTHER`'),
  @('documentType', 'string', '✓', '見積依頼書 / 見積書 / 発注書 / 検収書 / 機器写真 など'),
  @('fileName', 'string', '✓', 'ファイル名'),
  @('contentType', 'string', '-', 'MIMEタイプ'),
  @('fileSize', 'int64', '-', 'ファイルサイズ'),
  @('storageKey', 'string', '✓', '`application_documents.file_path` に保存するストレージキー'),
  @('storageFormat', 'string', '-', '`電子取引` / `スキャナ保存` / `未指定`'),
  @('uploadedAt', 'datetime', '✓', '登録日時')
)

$quotationItemRows = @(
  @('quotationItemId', 'int64', '-', '`quotation_items.quotation_item_id`。新規行は null'),
  @('rowNo', 'int32', '✓', '表示順'),
  @('itemType', 'string', '-', '`親明細` / `子明細` / `孫明細` / `その他` / `値引き` など'),
  @('originalItemName', 'string', '✓', '見積原文の品名'),
  @('originalMakerName', 'string', '-', '見積原文のメーカー'),
  @('originalModelName', 'string', '-', '見積原文の型式'),
  @('quantity', 'int32', '✓', '数量'),
  @('categoryName', 'string', '-', '確定category'),
  @('largeClassName', 'string', '-', '確定大分類'),
  @('mediumClassName', 'string', '-', '確定中分類'),
  @('itemName', 'string', '-', '確定品目名'),
  @('makerName', 'string', '-', '確定メーカー名'),
  @('modelName', 'string', '-', '確定型式'),
  @('unit', 'string', '-', '単位'),
  @('purchasePriceUnit', 'decimal', '-', '購入単価'),
  @('purchasePriceTotal', 'decimal', '-', '購入金額'),
  @('allocPriceUnit', 'decimal', '-', '按分登録単価'),
  @('allocTaxTotal', 'decimal', '-', '按分税込金額'),
  @('accountTitle', 'string', '-', '勘定科目'),
  @('seqId', 'string', '-', 'SEQ_ID'),
  @('parentSeqId', 'string', '-', '親SEQ_ID')
)

$orderItemRows = @(
  @('orderItemId', 'int64', '✓', '`order_items.order_item_id`'),
  @('quotationItemId', 'int64', '✓', '`quotation_items.quotation_item_id`'),
  @('itemName', 'string', '✓', '品目名'),
  @('makerName', 'string', '-', 'メーカー名'),
  @('modelName', 'string', '-', '型式'),
  @('quantity', 'int32', '✓', '発注明細数量。個体登録時は数量分を個体候補へ展開する'),
  @('unitPrice', 'decimal', '-', '単価'),
  @('amount', 'decimal', '-', '金額'),
  @('deliveryOn', 'date', '-', '納品日')
)

$individualRows = @(
  @('individualId', 'int64', '-', '`individuals.individual_id`。新規登録時は null'),
  @('orderItemId', 'int64', '✓', '`order_items.order_item_id`'),
  @('qrCodeValue', 'string', '-', 'QRコード値'),
  @('serialNo', 'string', '-', 'シリアルNo.'),
  @('itemName', 'string', '✓', '品目名'),
  @('makerName', 'string', '-', 'メーカー名'),
  @('modelName', 'string', '-', '型式'),
  @('acquisitionAmount', 'decimal', '-', '取得金額'),
  @('acquiredOn', 'date', '-', '取得日'),
  @('facilityLocationId', 'int64', '-', '設置ロケーションID'),
  @('floorName', 'string', '-', '階'),
  @('departmentName', 'string', '-', '部門'),
  @('sectionName', 'string', '-', '部署'),
  @('roomName', 'string', '-', '室名'),
  @('provisionalAccountTitle', 'string', '-', '仮勘定科目'),
  @('fixedAssetNo', 'string', '-', '固定資産番号'),
  @('registrationStatus', 'string', '✓', '`INSPECTED` / `REGISTERED`')
)

function New-EndpointBlock {
  param(
    [Parameter(Mandatory = $true)][string]$Title,
    [Parameter(Mandatory = $true)][string]$Overview,
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Auth,
    [object[]]$ParametersRows = @(),
    [object[]]$RequestRows = @(),
    [object[]]$RequestSubtables = @(),
    [string[]]$PermissionLines = @(),
    [string[]]$ProcessingLines = @(),
    [object[]]$ExtraTables = @(),
    [object[]]$ResponseRows = @(),
    [object[]]$ResponseSubtables = @(),
    [object[]]$StatusRows = @()
  )

  $block = @{
    Title = $Title
    Overview = $Overview
    Method = $Method
    Path = $Path
    Auth = $Auth
    StatusRows = $StatusRows
  }

  if ($ParametersRows.Count -gt 0) {
    $block.ParametersTitle = 'リクエストパラメータ'
    $block.ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    $block.ParametersRows = $ParametersRows
  }

  if ($RequestRows.Count -gt 0) {
    $block.RequestTitle = 'リクエストボディ'
    $block.RequestHeaders = @('フィールド', '型', '必須', '説明')
    $block.RequestRows = $RequestRows
  }

  if ($RequestSubtables.Count -gt 0) {
    $block.RequestSubtables = $RequestSubtables
  }

  if ($PermissionLines.Count -gt 0) {
    $block.PermissionLines = $PermissionLines
  }

  $effectiveProcessingLines = @()
  if ($Auth -match 'Bearer') {
    $effectiveProcessingLines += $workFacilityProcessingLine
  }
  $effectiveProcessingLines += $ProcessingLines

  if ($effectiveProcessingLines.Count -gt 0) {
    $block.ProcessingLines = $effectiveProcessingLines
  }

  if ($ExtraTables.Count -gt 0) {
    $block.ExtraTables = $ExtraTables
  }

  if ($ResponseRows.Count -gt 0) {
    $block.ResponseTitle = 'レスポンス（成功時）'
    $block.ResponseHeaders = @('フィールド', '型', '必須', '説明')
    $block.ResponseRows = $ResponseRows
  }

  if ($ResponseSubtables.Count -gt 0) {
    $block.ResponseSubtables = $ResponseSubtables
  }

  return $block
}

$endpointBlocks = @(
  New-EndpointBlock `
    -Title '購入管理コンテキスト取得（/quotation-data-box/purchase-management/context）' `
    -Overview '購入管理タブ初期表示に必要な申請受付一覧、編集リスト候補、RFQステップタブ、権限表示、既定検索条件をまとめて取得する。' `
    -Method 'GET' `
    -Path '/quotation-data-box/purchase-management/context' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('facilityId', 'query', 'int64', '-', '対象施設ID。省略時はセッションの作業対象施設'),
      @('applicationLimit', 'query', 'int32', '-', '申請受付一覧の初期取得件数。既定50、最大200'),
      @('rfqLimit', 'query', 'int32', '-', 'RFQ一覧の初期取得件数。既定50、最大200')
    ) `
    -PermissionLines $contextPermissionLines `
    -ProcessingLines @(
      '作業対象施設に対する購入管理タブ入口権限を判定する。',
      '`GET /quotation-data-box/purchase-management/applications`、`GET /quotation-data-box/purchase-management/edit-list-candidates`、`GET /quotation-data-box/rfq-groups?managementType=PURCHASE` と同じ条件で初期データを取得する。',
      '`normal_ship_request` の実効有無を `permissions.canRequestShipProxy` として返す。本書ではボタン表示可否のみを返し、依頼作成APIは呼び出さない。',
      '個別操作の可否は `normal_purchase` / `normal_quotation` / `normal_order` / `normal_acceptance` ごとに返し、各操作APIでも再判定する。',
      '実効権限がないセクションの一覧は空配列または操作不可として返し、画面側で該当CTAを非表示または非活性にできるようにする。'
    ) `
    -ResponseRows @(
      @('applications', 'PurchaseApplicationSummary[]', '✓', '申請受付一覧の初期表示データ'),
      @('editListCandidates', 'EditListCandidate[]', '✓', '取り込み可能な通常編集リスト候補'),
      @('rfqGroups', 'PurchaseRfqSummary[]', '✓', '購入管理対象RFQの初期表示データ'),
      @('tabCounts', 'object', '✓', 'ステップタブ別件数'),
      @('permissions', 'object', '✓', '実効機能コード別の画面表示・操作可否'),
      @('defaultFilters', 'object', '✓', '既定検索条件。申請は `status=申請中`、RFQは `完了` / `申請を見送る` を除外')
    ) `
    -StatusRows @(
      @('200', '取得成功', 'PurchaseManagementContextResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '購入管理タブ入口権限なし', 'ErrorResponse'),
      @('404', '作業対象施設なし', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '購入申請受付一覧取得（/quotation-data-box/purchase-management/applications）' `
    -Overview '購入管理タブの申請受付一覧に表示する、起票済み購入申請の未処理キューを取得する。' `
    -Method 'GET' `
    -Path '/quotation-data-box/purchase-management/applications' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('facilityId', 'query', 'int64', '-', '対象施設ID。省略時は作業対象施設'),
      @('status', 'query', 'string', '-', '既定値は `申請中`。受付一覧は未処理申請のみを既定表示する'),
      @('keyword', 'query', 'string', '-', '申請No、申請者名、代表品目名の部分一致'),
      @('departmentName', 'query', 'string', '-', '設置部門名の完全一致'),
      @('sectionName', 'query', 'string', '-', '設置部署名の完全一致'),
      @('requestedOnFrom', 'query', 'date', '-', '申請日From'),
      @('requestedOnTo', 'query', 'date', '-', '申請日To'),
      @('limit', 'query', 'int32', '-', '既定50、最大200'),
      @('cursor', 'query', 'string', '-', '次ページ取得カーソル')
    ) `
    -PermissionLines $contextPermissionLines `
    -ProcessingLines @(
      '`purchase_applications` VIEWを施設スコープ、ステータス、検索条件で絞り込む。',
      '既定では `applications.status=''申請中''` かつ `applications.edit_list_id IS NULL` の購入申請を未処理キューとして返す。',
      '`requested_on DESC, application_no DESC` で並び替え、`limit + 1` 件で次ページ有無を判定する。',
      '`assets_json`、`attached_files_json`、`rfq_group_ids_json` はAPIレスポンス用の配列へ整形する。'
    ) `
    -ResponseRows @(
      @('items', 'PurchaseApplicationSummary[]', '✓', '購入申請一覧'),
      @('items[].purchaseApplicationId', 'int64', '✓', '`purchase_applications.purchase_application_id`'),
      @('items[].applicationNo', 'string', '✓', '申請番号'),
      @('items[].purchaseType', 'string', '✓', '`NEW` / `EXPANSION` / `REPLACEMENT`'),
      @('items[].status', 'string', '✓', '申請ステータス'),
      @('items[].requestedOn', 'date', '✓', '申請日'),
      @('items[].requestedByName', 'string', '✓', '申請者名'),
      @('items[].departmentName', 'string', '-', '設置部門'),
      @('items[].sectionName', 'string', '-', '設置部署'),
      @('items[].roomName', 'string', '-', '設置室名'),
      @('items[].representativeItemName', 'string', '-', '代表品目名'),
      @('items[].desiredDeliveryOn', 'date', '-', '希望納期'),
      @('items[].priority', 'string', '-', '優先順位'),
      @('items[].requestComment', 'string', '-', '申請理由・コメント'),
      @('items[].assetCount', 'int32', '✓', '申請明細数'),
      @('items[].editListId', 'int64', '-', '取り込み済み編集リストID。未処理一覧では通常null'),
      @('nextCursor', 'string', '-', '次ページカーソル')
    ) `
    -StatusRows @(
      @('200', '取得成功', 'PurchaseApplicationListResponse'),
      @('400', '検索条件不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '購入管理タブ入口権限なし', 'ErrorResponse'),
      @('404', '作業対象施設なし', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '購入申請詳細取得（/quotation-data-box/purchase-management/applications/{applicationId}）' `
    -Overview '購入申請詳細モーダルで表示する申請ヘッダー、対象資産、添付、履歴、RFQ紐づけ情報を取得する。' `
    -Method 'GET' `
    -Path '/quotation-data-box/purchase-management/applications/{applicationId}' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('applicationId', 'path', 'int64', '✓', '`applications.application_id`')
    ) `
    -PermissionLines $purchasePermissionLines `
    -ProcessingLines @(
      '`applications.application_type=''PURCHASE''`、施設スコープ内、`deleted_at IS NULL` を検証する。',
      '`purchase_applications` VIEW、`application_assets`、`application_documents`、`application_status_histories`、`rfq_applications` / `rfqs` を取得する。',
      '更新購入の場合は `application_assets.replacement_action` を返し、資産登録完了時の後処理方針を確認できるようにする。'
    ) `
    -ResponseRows @(
      @('application', 'PurchaseApplicationDetail', '✓', '申請ヘッダー'),
      @('application.purchaseApplicationId', 'int64', '✓', '`applications.application_id`'),
      @('application.applicationNo', 'string', '✓', '申請番号'),
      @('application.purchaseType', 'string', '✓', '`purchase_application_details.purchase_type`'),
      @('application.status', 'string', '✓', '`applications.status`'),
      @('application.requestedByName', 'string', '✓', '申請者名'),
      @('application.requestedByContact', 'string', '-', '申請者連絡先'),
      @('application.usagePurpose', 'string', '-', '使用用途'),
      @('application.requestComment', 'string', '-', '申請理由・コメント'),
      @('assets', 'PurchaseApplicationAsset[]', '✓', '申請明細'),
      @('documents', 'DocumentSummary[]', '✓', '添付ファイル'),
      @('statusHistories', 'ApplicationStatusHistory[]', '✓', '状態履歴'),
      @('rfqLinks', 'RfqLinkSummary[]', '✓', 'RFQ紐づき情報')
    ) `
    -ResponseSubtables @(
      @{ Title = 'assets要素（PurchaseApplicationAsset）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
        @('applicationAssetId', 'int64', '✓', '`application_assets.application_asset_id`'),
        @('assetRole', 'string', '✓', '`CURRENT` / `REQUEST`'),
        @('assetLedgerId', 'int64', '-', '既存資産を参照する場合のみ設定'),
        @('itemName', 'string', '✓', '申請品目名'),
        @('makerName', 'string', '-', 'メーカー名'),
        @('modelName', 'string', '-', '型式'),
        @('quantity', 'int32', '✓', '数量'),
        @('destinationLocationName', 'string', '-', '設置予定場所'),
        @('desiredDeliveryOn', 'date', '-', '希望納期'),
        @('replacementAction', 'string', '-', '更新購入後処理。`DISPOSAL` / `TRANSFER` / `CONTINUE`')
      ) },
      @{ Title = 'documents要素（DocumentSummary）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentRows }
    ) `
    -StatusRows @(
      @('200', '取得成功', 'PurchaseApplicationDetailResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '実効 `normal_purchase` なし', 'ErrorResponse'),
      @('404', '購入申請なし', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '購入申請却下（/quotation-data-box/purchase-management/applications/{applicationId}/reject）' `
    -Overview '申請中の購入申請を却下し、申請受付一覧から除外する。' `
    -Method 'POST' `
    -Path '/quotation-data-box/purchase-management/applications/{applicationId}/reject' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('applicationId', 'path', 'int64', '✓', '`applications.application_id`')
    ) `
    -RequestRows @(
      @('reason', 'string', '-', '却下理由。画面に入力欄がないため任意。指定時だけ履歴コメントへ保存する'),
      @('expectedUpdatedAt', 'datetime', '-', '画面取得時の `applications.updated_at`。競合更新検出用')
    ) `
    -PermissionLines $purchasePermissionLines `
    -ProcessingLines @(
      '`applications.application_type=''PURCHASE''`、`status=''申請中''`、`edit_list_id IS NULL` を検証する。',
      '`applications.status` を `却下` に更新し、`rejected_by_user_id`、`rejected_by_name`、`rejected_at` を設定する。',
      '`application_status_histories` に `申請中 -> 却下` の履歴を登録する。',
      '却下後の再受付APIは定義しない。再申請は資産申請起票APIから新規起票する。'
    ) `
    -ResponseRows @(
      @('purchaseApplicationId', 'int64', '✓', '却下した申請ID'),
      @('status', 'string', '✓', '`却下`'),
      @('updatedAt', 'datetime', '✓', '更新後日時')
    ) `
    -StatusRows @(
      @('200', '却下成功', 'PurchaseApplicationActionResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '実効 `normal_purchase` なし', 'ErrorResponse'),
      @('404', '購入申請なし', 'ErrorResponse'),
      @('409', '申請状態不整合または競合更新', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '編集リスト候補取得（/quotation-data-box/purchase-management/edit-list-candidates）' `
    -Overview '購入申請を取り込める通常編集リスト候補を取得する。リモデル編集リストは候補に含めない。' `
    -Method 'GET' `
    -Path '/quotation-data-box/purchase-management/edit-list-candidates' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('facilityId', 'query', 'int64', '-', '対象施設ID。省略時は作業対象施設'),
      @('keyword', 'query', 'string', '-', '編集リスト名の部分一致'),
      @('includeLocked', 'query', 'boolean', '-', '作業ロック中のリストも候補表示するか。既定 false'),
      @('limit', 'query', 'int32', '-', '既定50、最大200'),
      @('cursor', 'query', 'string', '-', '次ページ取得カーソル')
    ) `
    -PermissionLines $purchasePermissionLines `
    -ProcessingLines @(
      '`edit_lists.list_type=''PURCHASE''`、`deleted_at IS NULL`、`closed_at IS NULL` の編集リストだけを候補にする。',
      '対象施設は `edit_list_facilities` に作業対象施設を含むリストに限定する。',
      '`includeLocked=false` の場合は、有効な `edit_list_work_locks` が存在するリストを候補から除外する。',
      '既存編集リストへの購入申請取り込みAPIでは、候補表示とは別に有効な作業ロックと `lock_token` を必ず検証する。'
    ) `
    -ResponseRows @(
      @('items', 'EditListCandidate[]', '✓', '編集リスト候補'),
      @('items[].editListId', 'int64', '✓', '`edit_lists.edit_list_id`'),
      @('items[].listName', 'string', '✓', '編集リスト名'),
      @('items[].primaryFacilityId', 'int64', '✓', '主施設ID'),
      @('items[].facilityNames', 'string[]', '✓', '対象施設名一覧'),
      @('items[].itemCount', 'int32', '✓', '有効な編集リスト明細件数'),
      @('items[].lockedByName', 'string', '-', '作業中ユーザー名。ロック中の場合のみ'),
      @('items[].lockExpiresAt', 'datetime', '-', 'ロック有効期限'),
      @('nextCursor', 'string', '-', '次ページカーソル')
    ) `
    -StatusRows @(
      @('200', '取得成功', 'EditListCandidateListResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '実効 `normal_purchase` なし', 'ErrorResponse'),
      @('404', '作業対象施設なし', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '編集リスト新規作成・購入申請取り込み（/quotation-data-box/purchase-management/edit-lists）' `
    -Overview '購入管理タブから通常編集リストを新規作成し、選択した購入申請を取り込む。' `
    -Method 'POST' `
    -Path '/quotation-data-box/purchase-management/edit-lists' `
    -Auth '要（Bearer）' `
    -RequestRows @(
      @('listName', 'string', '✓', '編集リスト名'),
      @('facilityIds', 'int64[]', '✓', '対象施設ID。1件以上。複数施設指定可'),
      @('primaryFacilityId', 'int64', '-', '主施設ID。省略時は `facilityIds[0]`'),
      @('applicationIds', 'int64[]', '✓', '取り込む購入申請ID。1件以上'),
      @('idempotencyKey', 'string', '-', '二重送信抑止キー')
    ) `
    -PermissionLines $purchasePermissionLines `
    -ProcessingLines @(
      '対象施設すべてに対する担当施設権限と `normal_purchase` 実効権限を検証する。',
      '`edit_lists` を `list_type=''PURCHASE''`、`primary_facility_id`、`created_by_user_id` 付きで作成する。作成後の `list_type` 変更APIは提供しない。',
      '`edit_list_facilities` に対象施設を登録し、主施設は `facility_role=''PRIMARY''`、その他は `ADDITIONAL` とする。',
      '対象施設の有効な `asset_ledgers` を `edit_list_items.source_type=''BASE_ASSET''` としてコピーする。',
      '選択した購入申請は `application_type=''PURCHASE''` かつ `status=''申請中''` のみ許可し、申請明細を `edit_list_items.source_type=''APPLICATION''` として取り込む。',
      '取り込み後は `applications.edit_list_id` と `edit_list_name` を設定し、`applications.status=''編集中''`、`application_status_histories` を登録する。',
      '同一申請明細の重複は `(edit_list_id, source_type, source_application_id, source_application_asset_id)` で防止し、同一 `idempotencyKey` の再送は冪等成功とする。'
    ) `
    -ResponseRows @(
      @('editListId', 'int64', '✓', '作成した編集リストID'),
      @('listName', 'string', '✓', '編集リスト名'),
      @('primaryFacilityId', 'int64', '✓', '主施設ID'),
      @('importedApplicationIds', 'int64[]', '✓', '取り込み完了した申請ID'),
      @('baseAssetItemCount', 'int32', '✓', '原本コピー明細件数'),
      @('applicationItemCount', 'int32', '✓', '購入申請由来明細件数'),
      @('updatedAt', 'datetime', '✓', '更新日時')
    ) `
    -StatusRows @(
      @('201', '作成・取り込み成功', 'PurchaseEditListImportResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '実効 `normal_purchase` なし', 'ErrorResponse'),
      @('404', '対象施設または購入申請なし', 'ErrorResponse'),
      @('409', '購入申請状態不整合または重複取り込み', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '既存編集リストへの購入申請取り込み（/quotation-data-box/purchase-management/edit-lists/{editListId}/import-applications）' `
    -Overview '既存の通常編集リストへ、申請受付一覧で選択した購入申請明細を追加する。' `
    -Method 'POST' `
    -Path '/quotation-data-box/purchase-management/edit-lists/{editListId}/import-applications' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('editListId', 'path', 'int64', '✓', '`edit_lists.edit_list_id`')
    ) `
    -RequestRows @(
      @('applicationIds', 'int64[]', '✓', '取り込む購入申請ID。1件以上'),
      @('lockToken', 'string', '✓', '編集リスト作業ロックトークン'),
      @('idempotencyKey', 'string', '-', '二重送信抑止キー')
    ) `
    -PermissionLines $purchasePermissionLines `
    -ProcessingLines @(
      '`edit_lists.list_type=''PURCHASE''`、`deleted_at IS NULL`、対象施設スコープ内であることを検証する。',
      '有効な `edit_list_work_locks` が存在し、ログインユーザー、`editListId`、`lockToken`、有効期限が一致することを検証する。',
      '選択した購入申請は `application_type=''PURCHASE''` かつ `status=''申請中''` のみ許可する。',
      '申請明細を `edit_list_items.source_type=''APPLICATION''` として追加し、重複取り込みを拒否または同一 `idempotencyKey` の再送として冪等成功にする。',
      '取り込み後は `applications.edit_list_id` と `edit_list_name` を設定し、`applications.status=''編集中''`、`application_status_histories` を登録する。',
      '取り込み成功時は作業ロックの `last_heartbeat_at` と `lock_expires_at` を更新する。'
    ) `
    -ResponseRows @(
      @('editListId', 'int64', '✓', '取り込み先編集リストID'),
      @('importedApplicationIds', 'int64[]', '✓', '取り込み完了した申請ID'),
      @('applicationItemCount', 'int32', '✓', '追加した購入申請由来明細件数'),
      @('lockExpiresAt', 'datetime', '✓', '更新後ロック有効期限'),
      @('updatedAt', 'datetime', '✓', '更新日時')
    ) `
    -StatusRows @(
      @('200', '取り込み成功', 'PurchaseEditListImportResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '実効 `normal_purchase` なし', 'ErrorResponse'),
      @('404', '編集リストまたは購入申請なし', 'ErrorResponse'),
      @('409', '作業ロック不整合、購入申請状態不整合、重複取り込み', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '購入管理RFQ一覧取得（/quotation-data-box/rfq-groups）' `
    -Overview '購入管理タブの見積（発注）グループ一覧を取得する。`managementType=PURCHASE` のRFQだけを返す。' `
    -Method 'GET' `
    -Path '/quotation-data-box/rfq-groups' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('managementType', 'query', 'string', '✓', '`PURCHASE` 固定。本書対象外の値は拒否する'),
      @('facilityId', 'query', 'int64', '-', '対象施設ID。省略時は作業対象施設'),
      @('step', 'query', 'string', '-', '`ALL` / `QUOTE` / `ORDER` / `DELIVERY` / `ACCEPTANCE` / `ASSET_REGISTRATION`'),
      @('keyword', 'query', 'string', '-', 'RFQ No、グループ名、業者名の部分一致'),
      @('includeCompleted', 'query', 'boolean', '-', '`完了` / `申請を見送る` を含めるか。既定 false'),
      @('limit', 'query', 'int32', '-', '既定50、最大200'),
      @('cursor', 'query', 'string', '-', '次ページ取得カーソル')
    ) `
    -PermissionLines $contextPermissionLines `
    -ProcessingLines @(
      '`rfqs.management_type=''PURCHASE''`、`workflow_type=''RFQ''`、`deleted_at IS NULL` のRFQを対象とする。',
      'ステップタブの状態集合は、ALL=完了/申請を見送るを除外、QUOTE=見積依頼/見積依頼済/見積DB登録済、ORDER=発注見積登録済、DELIVERY=発注済、ACCEPTANCE=納期確定、ASSET_REGISTRATION=検収済とする。',
      '`見積登録依頼中` / `発注用見積依頼済` は内部ステータスとして扱い、独立タブは設けない。',
      '`rfq_vendors` は業者行へ展開して返す。同一 `rfq_no` のRFQヘッダ複製はDB/API正本として扱わない。',
      '同じ施設・検索条件で `tabCounts` を算出して返す。'
    ) `
    -ResponseRows @(
      @('items', 'PurchaseRfqSummary[]', '✓', 'RFQ一覧'),
      @('tabCounts.all', 'int32', '✓', 'すべて件数'),
      @('tabCounts.quote', 'int32', '✓', '①見積依頼/登録件数'),
      @('tabCounts.order', 'int32', '✓', '②発注登録件数'),
      @('tabCounts.delivery', 'int32', '✓', '③納品日登録件数'),
      @('tabCounts.acceptance', 'int32', '✓', '④検収登録件数'),
      @('tabCounts.assetRegistration', 'int32', '✓', '⑤資産登録件数'),
      @('nextCursor', 'string', '-', '次ページカーソル')
    ) `
    -ResponseSubtables @(
      @{ Title = 'items要素（PurchaseRfqSummary）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $rfqSummaryRows },
      @{ Title = 'vendorRows要素（RfqVendorSummary）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $rfqVendorRows }
    ) `
    -StatusRows @(
      @('200', '取得成功', 'PurchaseRfqListResponse'),
      @('400', '検索条件不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '購入管理タブ入口権限なし', 'ErrorResponse'),
      @('404', '作業対象施設なし', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title 'RFQグループ詳細取得（/quotation-data-box/rfq-groups/{rfqGroupId}）' `
    -Overview 'RFQプロセス、見積登録、発注、納品日登録、検収、資産登録の各画面で共通利用するRFQ詳細を取得する。' `
    -Method 'GET' `
    -Path '/quotation-data-box/rfq-groups/{rfqGroupId}' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('rfqGroupId', 'path', 'int64', '✓', '`rfqs.rfq_id`'),
      @('managementType', 'query', 'string', '✓', '`PURCHASE` 固定'),
      @('returnTo', 'query', 'string', '-', '戻り先。購入管理起点では `/quotation-data-box/purchase-management`')
    ) `
    -PermissionLines $purchasePermissionLines `
    -ProcessingLines @(
      '`rfqs.management_type=''PURCHASE''`、施設スコープ内、`deleted_at IS NULL` を検証する。',
      '`rfq_applications` に紐づく `edit_list_items` だけを対象明細として返す。同一編集リスト内の未選択明細はRFQ詳細・依頼書プレビューへ含めない。',
      '`rfq_vendors`、`quotations`、`quotation_items`、`orders`、`order_items`、`individuals`、`application_documents` を必要に応じて取得する。',
      'レスポンスの `context.managementType` は `PURCHASE`、`context.returnTo` は購入管理タブを返し、共通画面の戻り先を固定する。'
    ) `
    -ResponseRows @(
      @('rfq', 'PurchaseRfqDetail', '✓', 'RFQヘッダー'),
      @('targetItems', 'RfqTargetItem[]', '✓', '`rfq_applications` に紐づく対象明細'),
      @('vendors', 'RfqVendorSummary[]', '✓', '見積依頼先'),
      @('quotations', 'QuotationSummary[]', '✓', '登録済みまたはドラフト見積'),
      @('order', 'OrderSummary', '-', '発注情報。未発注時は null'),
      @('individuals', 'IndividualSummary[]', '✓', '検収登録済み個体'),
      @('documents', 'DocumentSummary[]', '✓', 'RFQ/見積/発注/検収関連ドキュメント'),
      @('context.managementType', 'string', '✓', '`PURCHASE`'),
      @('context.returnTo', 'string', '✓', '`/quotation-data-box/purchase-management`'),
      @('availableActions', 'string[]', '✓', '現在ステータスと権限に応じた可能操作')
    ) `
    -ResponseSubtables @(
      @{ Title = 'vendors要素（RfqVendorSummary）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $rfqVendorRows },
      @{ Title = 'documents要素（DocumentSummary）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentRows }
    ) `
    -StatusRows @(
      @('200', '取得成功', 'PurchaseRfqDetailResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '実効 `normal_purchase` なし', 'ErrorResponse'),
      @('404', 'RFQグループなし', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '見積依頼先保存（/quotation-data-box/rfq-groups/{rfqGroupId}/vendor-requests）' `
    -Overview 'RFQプロセス画面で依頼先業者の下書き行を追加・更新・未送信削除する。' `
    -Method 'POST' `
    -Path '/quotation-data-box/rfq-groups/{rfqGroupId}/vendor-requests' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('rfqGroupId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
    ) `
    -RequestRows @(
      @('vendors', 'RfqVendorInput[]', '✓', '保存する依頼先業者行。1件以上'),
      @('expectedUpdatedAt', 'datetime', '-', '画面取得時の `rfqs.updated_at`')
    ) `
    -RequestSubtables @(
      @{ Title = 'vendors要素（RfqVendorInput）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
        @('rfqVendorId', 'int64', '-', '既存更新時に指定。新規追加時は null'),
        @('vendorId', 'int64', '-', '業者マスタID。手入力業者は null'),
        @('vendorName', 'string', '✓', '依頼先業者名'),
        @('contactPerson', 'string', '-', '担当者名'),
        @('email', 'string', '-', 'メールアドレス'),
        @('phone', 'string', '-', '連絡先'),
        @('dueOn', 'date', '-', '提出期限'),
        @('requestNote', 'string', '-', 'ご依頼事項'),
        @('deleteRequested', 'boolean', '-', '未送信行を削除する場合 true')
      ) }
    ) `
    -PermissionLines $purchasePermissionLines `
    -ProcessingLines @(
      '対象RFQが `management_type=''PURCHASE''`、ステータスが `見積依頼` / `見積依頼済` / `見積DB登録済` の範囲であることを検証する。',
      '新規行は `rfq_vendors.request_status=''DRAFT''` として作成する。',
      '`DRAFT` 行のみ業者情報、提出期限、ご依頼事項を更新可能とする。`SENT` / `REPLIED` 行の業者情報更新は拒否する。',
      '`deleteRequested=true` は `DRAFT` 行だけ許可し、`deleted_at` を設定する。送信済み行は削除せず送信履歴として保持する。',
      '`vendorId` 指定時は `vendors.facility_id` が対象施設と一致し、削除済みでないことを確認する。'
    ) `
    -ResponseRows @(
      @('rfqGroupId', 'int64', '✓', '対象RFQ ID'),
      @('vendors', 'RfqVendorSummary[]', '✓', '保存後の依頼先一覧'),
      @('updatedAt', 'datetime', '✓', '更新日時')
    ) `
    -ResponseSubtables @(
      @{ Title = 'vendors要素（RfqVendorSummary）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $rfqVendorRows }
    ) `
    -StatusRows @(
      @('200', '保存成功', 'RfqVendorSaveResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '実効 `normal_purchase` なし', 'ErrorResponse'),
      @('404', 'RFQまたは依頼先なし', 'ErrorResponse'),
      @('409', 'RFQ状態不整合または送信済み行の更新/削除', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '見積依頼個別送信（/quotation-data-box/rfq-groups/{rfqGroupId}/vendor-requests/{rfqVendorId}/send）' `
    -Overview 'RFQプロセス画面で下書き依頼先1件を送信済みにし、RFQステータスを見積依頼済へ進める。' `
    -Method 'POST' `
    -Path '/quotation-data-box/rfq-groups/{rfqGroupId}/vendor-requests/{rfqVendorId}/send' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('rfqGroupId', 'path', 'int64', '✓', '`rfqs.rfq_id`'),
      @('rfqVendorId', 'path', 'int64', '✓', '`rfq_vendors.rfq_vendor_id`')
    ) `
    -RequestRows @(
      @('expectedUpdatedAt', 'datetime', '-', '画面取得時の `rfq_vendors.updated_at`')
    ) `
    -PermissionLines $purchasePermissionLines `
    -ProcessingLines @(
      '対象RFQが `management_type=''PURCHASE''`、ステータスが `見積依頼` または `見積依頼済` であることを検証する。',
      '`rfq_vendors.request_status=''DRAFT''` の行だけ送信可能とする。',
      '送信時に `rfq_vendors.request_status=''SENT''`、`requested_at`、`requested_by_user_id` を同一トランザクションで設定する。',
      'RFQヘッダーが `見積依頼` の場合は `rfqs.status=''見積依頼済''`、`last_status_changed_at` を更新する。',
      '`SHIPへ一括依頼` ボタンからは本APIを呼ばない。SHIP代理作業依頼APIは本書の対象外とする。'
    ) `
    -ResponseRows @(
      @('rfqGroupId', 'int64', '✓', '対象RFQ ID'),
      @('rfqVendorId', 'int64', '✓', '送信した依頼先ID'),
      @('requestStatus', 'string', '✓', '`SENT`'),
      @('rfqStatus', 'string', '✓', '更新後RFQステータス'),
      @('requestedAt', 'datetime', '✓', '依頼送信日時')
    ) `
    -StatusRows @(
      @('200', '送信成功', 'RfqVendorSendResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '実効 `normal_purchase` なし', 'ErrorResponse'),
      @('404', 'RFQまたは依頼先なし', 'ErrorResponse'),
      @('409', 'RFQ状態不整合、依頼先送信状態不整合、競合更新', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '見積ドラフト保存（/quotation-data-box/quotations）' `
    -Overview 'RFQプロセスから見積登録・発注見積登録のドラフトを作成または更新し、見積ヘッダー、見積原本メタデータ、明細を保存する。' `
    -Method 'POST' `
    -Path '/quotation-data-box/quotations' `
    -Auth '要（Bearer）' `
    -RequestRows @(
      @('quotationId', 'int64', '-', '既存ドラフト更新時に指定。新規作成時は null'),
      @('rfqGroupId', 'int64', '✓', '`rfqs.rfq_id`'),
      @('rfqVendorId', 'int64', '-', '見積依頼先ID。依頼先業者に紐づける場合に指定'),
      @('vendorId', 'int64', '-', '業者マスタID。手入力業者は null'),
      @('vendorName', 'string', '✓', '見積業者名'),
      @('quotationNo', 'string', '-', '受領見積番号。確定時未指定の場合は採番する'),
      @('quotationOn', 'date', '✓', '見積日'),
      @('quotationPhase', 'string', '✓', '`定価見積` / `概算見積` / `発注登録用見積`'),
      @('storageFormat', 'string', '-', '`電子取引` / `スキャナ保存` / `未指定`'),
      @('validityPeriodMonths', 'int32', '-', '見積有効期限（月）'),
      @('deliveryPeriodMonths', 'int32', '-', '納期（月）'),
      @('totalAmountExclTax', 'decimal', '-', '合計金額（税抜）。明細合計と自動連動させない'),
      @('document', 'DocumentInput', '-', '見積原本PDF/Excel等のファイルメタデータ'),
      @('items', 'QuotationItemInput[]', '✓', '手動入力または編集済みの見積明細'),
      @('expectedUpdatedAt', 'datetime', '-', '既存ドラフト更新時の競合検出用')
    ) `
    -RequestSubtables @(
      @{ Title = 'document要素（DocumentInput）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentRows },
      @{ Title = 'items要素（QuotationItemInput）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $quotationItemRows }
    ) `
    -PermissionLines $quotationPermissionLines `
    -ProcessingLines @(
      '本書ではOCR実行、OCRジョブ制御、OCR結果取込を行わない。OCR明細確認画面は、見積原本を見ながら手動入力した明細の確認画面として扱う。',
      '対象RFQが `management_type=''PURCHASE''`、ステータスが `見積依頼` / `見積依頼済` / `見積DB登録済` / `発注用見積依頼済` の範囲であることを検証する。',
      '`quotations` を `status=''DRAFT''` として作成または更新し、`application_documents.owner_type=''QUOTATION''` で見積原本メタデータを保存する。',
      '登録区分登録では Model A の `ABC` / `D` / `OTHER` 判定結果を初期値として扱い、`OTHER` 行に限り値引き系キーワード判定を行って `値引き` に置換できる。',
      '個体品目AI判定は `その他` / `値引き` 行を推薦対象外とし、AI適用または資産マスタ選択結果を `quotation_items` の確定列へ保存する。',
      '個体登録・金額按分では `seq_id`、`parent_seq_id`、按分金額、勘定科目を `quotation_items` に保持する。'
    ) `
    -ResponseRows @(
      @('quotationId', 'int64', '✓', '保存した見積ID'),
      @('rfqGroupId', 'int64', '✓', '対象RFQ ID'),
      @('status', 'string', '✓', '`DRAFT`'),
      @('itemCount', 'int32', '✓', '保存明細件数'),
      @('documentId', 'int64', '-', '見積原本ドキュメントID'),
      @('nextStep', 'string', '-', '次画面識別子。例: `CATEGORY_REGISTRATION` / `ITEM_AI_MATCHING` / `PRICE_ALLOCATION` / `CONFIRM`'),
      @('updatedAt', 'datetime', '✓', '更新日時')
    ) `
    -StatusRows @(
      @('200', '更新成功', 'QuotationDraftSaveResponse'),
      @('201', '作成成功', 'QuotationDraftSaveResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '実効 `normal_quotation` なし', 'ErrorResponse'),
      @('404', 'RFQまたは見積なし', 'ErrorResponse'),
      @('409', 'RFQ状態不整合または競合更新', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '見積確定（/quotation-data-box/quotations/{quotationId}/confirm）' `
    -Overview '登録確認画面で見積DB登録または発注見積登録を確定し、RFQステータスを次工程へ進める。' `
    -Method 'POST' `
    -Path '/quotation-data-box/quotations/{quotationId}/confirm' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('quotationId', 'path', 'int64', '✓', '`quotations.quotation_id`')
    ) `
    -RequestRows @(
      @('managementType', 'string', '✓', '`PURCHASE`'),
      @('returnTo', 'string', '-', '完了後の戻り先。既定 `/quotation-data-box/purchase-management`'),
      @('expectedUpdatedAt', 'datetime', '-', '画面取得時の `quotations.updated_at`')
    ) `
    -PermissionLines $quotationPermissionLines `
    -ProcessingLines @(
      '対象見積が `DRAFT` または確定前状態で、親RFQが `management_type=''PURCHASE''` であることを検証する。',
      '見積番号未指定の場合は受領見積番号を採番し、`quotations.status=''REGISTERED''` に更新する。',
      '`quotation_phase=''発注登録用見積''` の場合は `rfqs.status=''発注見積登録済''` に進める。',
      '`定価見積` / `概算見積` など参考系見積の場合は `rfqs.status=''見積DB登録済''` に進める。',
      '関連する購入申請の `applications.status` は `見積中` を維持し、発注登録までは `発注済` へ進めない。',
      '登録完了後の戻り先は `managementType=''PURCHASE''` と `returnTo` に従い購入管理タブとする。'
    ) `
    -ResponseRows @(
      @('quotationId', 'int64', '✓', '確定した見積ID'),
      @('quotationNo', 'string', '✓', '見積番号'),
      @('rfqGroupId', 'int64', '✓', '対象RFQ ID'),
      @('rfqStatus', 'string', '✓', '更新後RFQステータス'),
      @('returnTo', 'string', '✓', '戻り先'),
      @('updatedAt', 'datetime', '✓', '更新日時')
    ) `
    -StatusRows @(
      @('200', '確定成功', 'QuotationConfirmResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '実効 `normal_quotation` なし', 'ErrorResponse'),
      @('404', '見積なし', 'ErrorResponse'),
      @('409', '見積またはRFQ状態不整合、競合更新', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '見積管理明細一覧取得（/quotation-management/quotation-items）' `
    -Overview '見積管理画面の購入見積明細タブで、登録済み見積明細を編集リスト・RFQ単位で参照する。' `
    -Method 'GET' `
    -Path '/quotation-management/quotation-items' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('managementType', 'query', 'string', '✓', '`PURCHASE`'),
      @('facilityId', 'query', 'int64', '-', '対象施設ID。省略時は作業対象施設'),
      @('editListId', 'query', 'int64', '-', '編集リスト絞り込み'),
      @('rfqGroupId', 'query', 'int64', '-', 'RFQグループ絞り込み'),
      @('itemType', 'query', 'string', '-', '明細区分絞り込み。既定は親明細/子明細を表示対象'),
      @('limit', 'query', 'int32', '-', '既定100、最大500'),
      @('cursor', 'query', 'string', '-', '次ページ取得カーソル')
    ) `
    -PermissionLines $quotationPermissionLines `
    -ProcessingLines @(
      '`rfqs.management_type=''PURCHASE''` に紐づく `quotations` / `quotation_items` を取得する。',
      '既定では親明細・子明細を一覧表示し、`その他` / `値引き` は明示条件がある場合のみ返す。',
      '編集リスト候補、見積依頼グループ候補は対象施設と `managementType` に応じて絞り込む。',
      '案分金額合計は検索条件に一致する返却対象明細から集計する。'
    ) `
    -ResponseRows @(
      @('items', 'QuotationManagementItem[]', '✓', '見積明細一覧'),
      @('totalCount', 'int32', '✓', '検索条件一致件数'),
      @('totalAllocatedAmountExclTax', 'decimal', '-', '按分金額合計（税別）'),
      @('editListOptions', 'SelectOption[]', '✓', '編集リスト候補'),
      @('rfqGroupOptions', 'SelectOption[]', '✓', '見積依頼グループ候補'),
      @('nextCursor', 'string', '-', '次ページカーソル')
    ) `
    -ResponseSubtables @(
      @{ Title = 'items要素（QuotationManagementItem）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $quotationItemRows }
    ) `
    -StatusRows @(
      @('200', '取得成功', 'QuotationManagementItemListResponse'),
      @('400', '検索条件不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '実効 `normal_quotation` なし', 'ErrorResponse'),
      @('404', '作業対象施設なし', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '発注登録（/quotation-data-box/order-registration/orders）' `
    -Overview '発注登録画面で発注ヘッダーと発注明細を作成し、RFQステータスを発注済へ進める。' `
    -Method 'POST' `
    -Path '/quotation-data-box/order-registration/orders' `
    -Auth '要（Bearer）' `
    -RequestRows @(
      @('rfqGroupId', 'int64', '✓', '`rfqs.rfq_id`'),
      @('quotationId', 'int64', '✓', '採用する発注登録用見積ID'),
      @('settlementNo', 'string', '-', '院内決済No.'),
      @('orderType', 'string', '✓', '`購入` / `割賦` / `リース（オペレーティング）` / `リース（ファイナンス）`'),
      @('deliveryOn', 'date', '✓', '納期。未入力時はプレビュー・登録不可'),
      @('leaseCompanyName', 'string', '-', 'リース時のみ'),
      @('leaseStartOn', 'date', '-', 'リース時のみ'),
      @('leaseYears', 'int32', '-', 'リース時のみ'),
      @('paymentTerms', 'string', '-', '支払条件'),
      @('paymentDueOn', 'date', '-', '支払期日'),
      @('comment', 'string', '-', 'コメント'),
      @('expectedUpdatedAt', 'datetime', '-', '画面取得時の `rfqs.updated_at`')
    ) `
    -PermissionLines $orderPermissionLines `
    -ProcessingLines @(
      '対象RFQが `management_type=''PURCHASE''`、`status=''発注見積登録済''` であることを検証する。',
      '対象見積が同一RFQに属し、`quotation_phase=''発注登録用見積''` かつ確定済みであることを検証する。',
      '`orders` を作成し、見積業者・申請者・発注形態・決済No・納期・支払条件・合計金額を保存する。',
      '`quotation_items` から `order_items` を作成する。画面要件に合わせ、個体登録対象は数量分を後続の `individuals` 候補へ展開できる粒度で保持する。',
      '`rfqs.status=''発注済''`、`last_status_changed_at` を更新する。',
      '対象RFQに紐づく購入申請のうち、同一申請配下の有効な購入申請明細がすべて発注済以降へ到達した申請は `applications.status=''発注済''` へ更新し、`application_status_histories` を登録する。'
    ) `
    -ResponseRows @(
      @('orderId', 'int64', '✓', '作成した発注ID'),
      @('orderNo', 'string', '✓', '発注番号'),
      @('rfqGroupId', 'int64', '✓', '対象RFQ ID'),
      @('rfqStatus', 'string', '✓', '`発注済`'),
      @('itemCount', 'int32', '✓', '発注明細件数'),
      @('totalAmount', 'decimal', '-', '発注合計金額'),
      @('updatedApplicationIds', 'int64[]', '✓', '`発注済` へロールアップした購入申請ID。該当なしは空配列'),
      @('updatedAt', 'datetime', '✓', '更新日時')
    ) `
    -ResponseSubtables @(
      @{ Title = 'orderItems要素（OrderItemSummary）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $orderItemRows }
    ) `
    -StatusRows @(
      @('201', '登録成功', 'OrderRegistrationResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '実効 `normal_order` なし', 'ErrorResponse'),
      @('404', 'RFQまたは見積なし', 'ErrorResponse'),
      @('409', 'RFQ状態不整合、発注登録用見積不足、競合更新', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '納品検収予定日登録（/quotation-data-box/inspection-registration/records）' `
    -Overview '納品日登録画面で検収日と検収書種別を保存し、RFQステータスを納期確定へ進める。' `
    -Method 'POST' `
    -Path '/quotation-data-box/inspection-registration/records' `
    -Auth '要（Bearer）' `
    -RequestRows @(
      @('rfqGroupId', 'int64', '✓', '`rfqs.rfq_id`'),
      @('orderId', 'int64', '✓', '`orders.order_id`'),
      @('inspectionOn', 'date', '✓', '検収日'),
      @('inspectionCertType', 'string', '✓', '`資産登録単位` / `附属品を含む`'),
      @('expectedUpdatedAt', 'datetime', '-', '画面取得時の `orders.updated_at`')
    ) `
    -PermissionLines $acceptancePermissionLines `
    -ProcessingLines @(
      '対象RFQが `management_type=''PURCHASE''`、`status=''発注済''` であることを検証する。',
      '対象発注が同一RFQに属することを検証する。',
      '`orders.inspection_on` と `orders.inspection_cert_type` を更新する。明細ごとの納品日は本APIの保存対象外とする。',
      '`rfqs.status=''納期確定''`、`last_status_changed_at` を更新する。',
      '対象RFQに紐づく購入申請のうち、同一申請配下の有効な購入申請明細がすべて納品日登録済以降へ到達した申請は `applications.status=''納品済''` へ更新し、`application_status_histories` を登録する。',
      '実際の個体単位検収登録完了は `POST /quotation-data-box/asset-provisional-registration/complete` で扱う。'
    ) `
    -ResponseRows @(
      @('rfqGroupId', 'int64', '✓', '対象RFQ ID'),
      @('orderId', 'int64', '✓', '対象発注ID'),
      @('inspectionOn', 'date', '✓', '登録した検収日'),
      @('inspectionCertType', 'string', '✓', '検収書種別'),
      @('rfqStatus', 'string', '✓', '`納期確定`'),
      @('updatedApplicationIds', 'int64[]', '✓', '`納品済` へロールアップした購入申請ID。該当なしは空配列'),
      @('updatedAt', 'datetime', '✓', '更新日時')
    ) `
    -StatusRows @(
      @('200', '登録成功', 'InspectionScheduleRegistrationResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '実効 `normal_acceptance` なし', 'ErrorResponse'),
      @('404', 'RFQまたは発注なし', 'ErrorResponse'),
      @('409', 'RFQ状態不整合または競合更新', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '検収登録完了（/quotation-data-box/asset-provisional-registration/complete）' `
    -Overview '資産仮登録画面でPC一括入力またはモバイル個体登録を完了し、検収登録済み個体情報を保存する。' `
    -Method 'POST' `
    -Path '/quotation-data-box/asset-provisional-registration/complete' `
    -Auth '要（Bearer）' `
    -RequestRows @(
      @('rfqGroupId', 'int64', '✓', '`rfqs.rfq_id`'),
      @('orderId', 'int64', '✓', '`orders.order_id`'),
      @('mode', 'string', '✓', '`pc` / `mobile`'),
      @('individuals', 'IndividualInput[]', '✓', '検収登録する個体。対象数量分を登録する'),
      @('expectedUpdatedAt', 'datetime', '-', '画面取得時の `rfqs.updated_at`')
    ) `
    -RequestSubtables @(
      @{ Title = 'individuals要素（IndividualInput）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $individualRows }
    ) `
    -PermissionLines $acceptancePermissionLines `
    -ProcessingLines @(
      '対象RFQが `management_type=''PURCHASE''`、`status=''納期確定''` であることを検証する。',
      '対象発注・発注明細が同一RFQに属することを検証する。',
      'PCモードでは全対象明細分の個体情報を一括登録し、モバイルモードでは登録済み個体を集約して全件登録条件を確認する。',
      '`individuals` を作成または更新し、`registration_status=''INSPECTED''`、検収日、設置場所、QR、シリアル、仮勘定科目を保持する。',
      '機器写真を登録する場合は `application_documents.owner_type=''ASSET_LEDGER''` ではなく、資産登録前の段階では `owner_type=''RFQ''` または `owner_type=''QUOTATION''` の工程ドキュメントとして保持する。',
      '全対象数量分の個体が登録済みになった場合だけ `rfqs.status=''検収済''` に更新する。',
      '対象RFQに紐づく購入申請のうち、同一申請配下の有効な購入申請明細がすべて検収登録済以降へ到達した申請は `applications.status=''検収済''` へ更新し、`application_status_histories` を登録する。'
    ) `
    -ResponseRows @(
      @('rfqGroupId', 'int64', '✓', '対象RFQ ID'),
      @('orderId', 'int64', '✓', '対象発注ID'),
      @('registeredIndividualCount', 'int32', '✓', '検収登録済み個体数'),
      @('requiredIndividualCount', 'int32', '✓', '必要個体数'),
      @('rfqStatus', 'string', '✓', '`検収済` または更新前ステータス'),
      @('updatedApplicationIds', 'int64[]', '✓', '`検収済` へロールアップした購入申請ID。該当なしは空配列'),
      @('updatedAt', 'datetime', '✓', '更新日時')
    ) `
    -StatusRows @(
      @('200', '検収登録成功', 'AssetProvisionalRegistrationResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '実効 `normal_acceptance` なし', 'ErrorResponse'),
      @('404', 'RFQまたは発注なし', 'ErrorResponse'),
      @('409', 'RFQ状態不整合、個体数不足、競合更新', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '原本資産登録（/quotation-data-box/asset-registration/register-bulk）' `
    -Overview '資産登録画面で検収登録済み個体に固定資産番号を付与し、原本資産台帳へ一括登録する。' `
    -Method 'POST' `
    -Path '/quotation-data-box/asset-registration/register-bulk' `
    -Auth '要（Bearer）' `
    -RequestRows @(
      @('rfqGroupId', 'int64', '✓', '`rfqs.rfq_id`'),
      @('orderId', 'int64', '✓', '`orders.order_id`'),
      @('assets', 'AssetRegistrationInput[]', '✓', '原本登録する個体。検収済み個体全件を対象にする'),
      @('expectedUpdatedAt', 'datetime', '-', '画面取得時の `rfqs.updated_at`')
    ) `
    -RequestSubtables @(
      @{ Title = 'assets要素（AssetRegistrationInput）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
        @('individualId', 'int64', '✓', '`individuals.individual_id`'),
        @('fixedAssetNo', 'string', '-', '固定資産番号。未管理の場合は null を許容するが、施設運用上必須の場合はバリデーションで拒否する'),
        @('managementDepartmentName', 'string', '-', '管理部署'),
        @('status', 'string', '-', '登録後ステータス。省略時は `ACTIVE`')
      ) }
    ) `
    -PermissionLines $acceptancePermissionLines `
    -ProcessingLines @(
      '対象RFQが `management_type=''PURCHASE''`、`status=''検収済''` であることを検証する。',
      '対象発注に属する `individuals.registration_status=''INSPECTED''` の個体が必要数量分揃っていることを確認する。',
      '各個体から `asset_ledgers` を作成し、品目、メーカー、型式、QR、シリアル、設置場所、取得金額、契約・見積情報、発注日、納品日、検収日、固定資産番号、`source_order_item_id` を反映する。',
      '`individuals.asset_ledger_id` と `registration_status=''REGISTERED''` を更新する。',
      '`purchase_application_details.purchase_type` に応じ、`NEW` は新規原本資産作成、`EXPANSION` は既存資産を維持した増設分作成、`REPLACEMENT` は新規原本資産作成と既存資産の `replacement_action` による後処理追跡を行う。',
      '`replacement_action=''DISPOSAL''` は `disposal_application_details.related_purchase_application_id`、`replacement_action=''TRANSFER''` は `transfer_application_details.related_purchase_application_id` で起点購入申請を追跡する。',
      '更新購入の廃棄/移動後処理は、資産申請起票APIで作成済みの関連廃棄/移動申請を後続管理側で進める。購入管理APIは関連申請を新規起票しない。',
      '全件成功時に `rfqs.status=''完了''`、`completed_on`、`last_status_changed_at` を更新する。',
      '対象RFQに紐づく購入申請のうち、同一申請配下の有効な購入申請明細がすべて原本登録済になった申請は `applications.status=''完了''` へ更新し、`application_status_histories` を登録する。'
    ) `
    -ResponseRows @(
      @('rfqGroupId', 'int64', '✓', '対象RFQ ID'),
      @('orderId', 'int64', '✓', '対象発注ID'),
      @('registeredAssetLedgerIds', 'int64[]', '✓', '作成した原本資産台帳ID'),
      @('rfqStatus', 'string', '✓', '`完了`'),
      @('updatedApplicationIds', 'int64[]', '✓', '`完了` へロールアップした購入申請ID。該当なしは空配列'),
      @('updatedAt', 'datetime', '✓', '更新日時')
    ) `
    -StatusRows @(
      @('200', '原本登録成功', 'AssetBulkRegistrationResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '実効 `normal_acceptance` なし', 'ErrorResponse'),
      @('404', 'RFQ、発注、個体なし', 'ErrorResponse'),
      @('409', 'RFQ状態不整合、検収登録不足、重複固定資産番号、競合更新', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title 'RFQグループ削除（/quotation-data-box/rfq-groups/{rfqGroupId}）' `
    -Overview '発注済到達前の通常購入RFQグループを論理削除し、購入管理タブ一覧から除外する。' `
    -Method 'DELETE' `
    -Path '/quotation-data-box/rfq-groups/{rfqGroupId}' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('rfqGroupId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
    ) `
    -RequestRows @(
      @('reason', 'string', '-', '削除理由。監査ログまたはアプリケーションログ用'),
      @('expectedUpdatedAt', 'datetime', '-', '画面取得時の `rfqs.updated_at`')
    ) `
    -PermissionLines $purchasePermissionLines `
    -ProcessingLines @(
      '対象RFQが `management_type=''PURCHASE''`、`deleted_at IS NULL` であることを検証する。',
      '削除可能ステータスは `見積依頼` / `見積依頼済` / `見積DB登録済` / `見積登録依頼中` / `発注用見積依頼済` / `発注見積登録済` とする。',
      '`発注済` / `納期確定` / `検収済` / `完了` 以降は削除不可とし、409を返す。',
      '`rfqs.deleted_at` を設定し、関連する `rfq_vendors`、`quotations`、`quotation_items`、`quotation_item_application_links` も同一トランザクションで論理削除する。',
      '`rfq_applications` は採用履歴として保持し、通常一覧・現在割当判定では `rfqs.deleted_at IS NULL` のRFQだけを有効扱いにする。',
      '編集リスト上の現在表示用 `rfq_no` / `rfq_group_name` は、削除したRFQが最新表示中の場合に未割当状態へ戻す。過去グループの再表示は行わない。'
    ) `
    -ResponseRows @(
      @('rfqGroupId', 'int64', '✓', '削除したRFQ ID'),
      @('deletedAt', 'datetime', '✓', '削除日時')
    ) `
    -StatusRows @(
      @('200', '削除成功', 'RfqDeleteResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '実効 `normal_purchase` なし', 'ErrorResponse'),
      @('404', 'RFQなし', 'ErrorResponse'),
      @('409', '削除不可ステータスまたは競合更新', 'ErrorResponse')
    )
)

@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_購入管理.docx'
  ScreenLabel = '購入管理'
  CoverDateText = '2026年5月27日'
  RevisionDateText = '2026/5/27'
  RevisionSummaryText = '要件・DB設計に基づく購入管理API設計の再作成'
  RevisionAuthorText = 'Codex'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、購入管理タブ画面および購入管理タブから遷移する通常購入フローの画面で利用する API の設計内容を整理し、画面要件、DB設計、編集リストAPI、資産申請起票APIとの責務境界を一致させることを目的とする。' },
    @{ Type = 'Paragraph'; Text = '対象範囲は、起票済み購入申請の受付一覧・詳細・却下、購入管理タブ起点の通常編集リスト新規作成と購入申請取り込み、既存通常編集リストへの購入申請取り込み、作成済み通常購入RFQの一覧・詳細、依頼先業者管理、見積登録、見積管理、発注登録、納品日登録、検収登録、資産登録、RFQ削除である。' },
    @{ Type = 'Paragraph'; Text = '資産一覧起点の新規購入・増設購入・更新購入申請の起票は No.13「資産申請起票」API設計書を正本とし、本書では起票後の受付以降を扱う。編集リスト本体の汎用編集、セル編集、Data Link、見積DB Link、行削除、行順変更、フリーカラム、編集リスト画面で選択行から実行する通常購入RFQ作成は No.23「編集リスト」API設計書を正本とする。' },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '購入管理は、タスク管理配下で通常購入の申請受付と見積（発注）グループ進行を管理する業務機能である。申請受付一覧では未処理の購入申請を通常編集リストへ取り込み、見積（発注）グループ一覧では `rfqs.management_type=''PURCHASE''` のRFQを見積依頼、見積登録、発注、納品日登録、検収、資産登録まで進行する。' },
    @{ Type = 'Paragraph'; Text = '本書ではOCR抽出、OCRジョブ制御、OCR結果取込APIは扱わない。OCR明細確認やOCR処理中の表示は、見積原本PDF/画像を参照しながら手動入力した見積明細の確認画面として扱う。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('購入申請', '`applications.application_type=''PURCHASE''` の申請。新規購入、増設購入、更新購入を `purchase_application_details.purchase_type` で区分する'),
      @('申請受付一覧', '`applications.status=''申請中''` かつ編集リスト未取り込みの購入申請を表示する未処理キュー'),
      @('通常編集リスト', '`edit_lists.list_type=''PURCHASE''` の編集リスト。購入管理タブから作成・選択できる編集リストはこの種別に限定する'),
      @('RFQグループ', '`rfqs` の1レコード。購入管理対象は `management_type=''PURCHASE''`、`workflow_type=''RFQ''` とする'),
      @('依頼先業者', '`rfq_vendors` の1レコード。複数業者への相見積もりは `rfq_vendors` 複数行で表現し、`rfqs` を業者数分複製しない'),
      @('発注登録用見積', '発注登録へ進める見積。見積確定時にRFQステータスを `発注見積登録済` へ進める'),
      @('参考系見積', '`定価見積` / `概算見積` など。見積DB登録後は `見積DB登録済` とし、発注登録用見積へ進む場合は別RFQグループを作成する'),
      @('SHIPへ一括依頼', '購入管理タブ/RFQプロセスではボタン表示・押下UI枠のみを扱う。実体の依頼作成APIは本書の対象外とする')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面パス', '利用目的'); Rows = @(
      @('購入管理タブ画面', '/quotation-data-box/purchase-management', '購入申請受付、通常購入RFQ一覧、ステップ別進行、申請詳細・却下・編集リスト取り込みを行う'),
      @('見積依頼・見積登録STEP画面', '/quotation-data-box/rfq-process', 'RFQ詳細、依頼先業者、依頼送信、見積ドラフト作成を行う'),
      @('見積登録（購入）OCR明細確認画面', '/quotation-data-box/ocr-confirm', '見積原本を見ながら手動入力した見積明細を確認・編集する'),
      @('見積登録（購入）登録区分登録画面', '/quotation-data-box/category-registration', 'category、明細区分、登録済み状態を確定する'),
      @('見積登録（購入）個体品目AI判定画面', '/quotation-data-box/item-ai-matching', 'AI推薦または資産マスタ選択で個体品目候補を確定する'),
      @('見積登録（購入）個体登録及び金額按分画面', '/quotation-data-box/price-allocation', '個体登録レコード、SEQ、親子No、按分金額を確定する'),
      @('見積登録（購入）登録確認画面', '/quotation-data-box/registration-confirm', '見積ヘッダーと明細を最終確認し、見積DB登録または発注見積登録を確定する'),
      @('見積管理画面', '/quotation-management', '登録済み購入見積明細を編集リスト・RFQ単位で参照する'),
      @('発注登録画面', '/quotation-data-box/order-registration', '発注ヘッダーと発注明細を作成する'),
      @('検収登録画面', '/quotation-data-box/inspection-registration', '納品検収予定日と検収書種別を登録する'),
      @('資産仮登録画面', '/quotation-data-box/asset-provisional-registration', '個体単位の検収登録済み情報を保存する'),
      @('資産登録画面', '/quotation-data-box/asset-registration', '検収登録済み個体を原本資産台帳へ登録する')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'API の位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、購入申請起票後のタスク管理機能である。起票処理は資産申請起票API、編集リスト本体操作と編集リスト画面からのRFQ作成は編集リストAPIに委譲し、本書では購入管理タブの受付・取り込みと、作成済み `PURCHASE` RFQの後続進行だけを定義する。' },
    @{ Type = 'Paragraph'; Text = 'RFQは `rfqs` をグループ正本、`rfq_vendors` を依頼先正本、`rfq_applications` を採用明細リンクとして扱う。一覧レスポンスでは業者行へ展開するが、同一 `rfq_no` のRFQヘッダ複製は行わない。' },
    @{ Type = 'Heading2'; Text = '画面と API の関係' },
    @{ Type = 'Table'; Headers = @('画面操作', 'API', '補足'); Rows = @(
      @('購入管理タブ初期表示', '`GET /quotation-data-box/purchase-management/context`', '申請受付、編集リスト候補、RFQ一覧、権限、既定条件を取得する'),
      @('申請受付一覧表示/検索', '`GET /quotation-data-box/purchase-management/applications`', '未処理の購入申請を取得する'),
      @('申請詳細表示', '`GET /quotation-data-box/purchase-management/applications/{applicationId}`', '申請内容、明細、添付、履歴を取得する'),
      @('購入申請却下', '`POST /quotation-data-box/purchase-management/applications/{applicationId}/reject`', '`申請中` の購入申請だけを却下する'),
      @('編集リスト候補表示', '`GET /quotation-data-box/purchase-management/edit-list-candidates`', '`list_type=''PURCHASE''` の候補だけを返す'),
      @('新規編集リストへ追加', '`POST /quotation-data-box/purchase-management/edit-lists`', '通常編集リストを新規作成し、購入申請を取り込む'),
      @('既存編集リストへ追加', '`POST /quotation-data-box/purchase-management/edit-lists/{editListId}/import-applications`', '作業ロック検証後に購入申請明細を追加する'),
      @('RFQ一覧表示/ステップタブ切替', '`GET /quotation-data-box/rfq-groups?managementType=PURCHASE`', '購入管理対象RFQのみを取得し、`tabCounts` を返す'),
      @('RFQ詳細表示/共通画面表示', '`GET /quotation-data-box/rfq-groups/{rfqGroupId}`', 'RFQ、業者、対象明細、見積、発注、個体、ドキュメントを取得する'),
      @('依頼先業者の追加/更新/未送信削除', '`POST /quotation-data-box/rfq-groups/{rfqGroupId}/vendor-requests`', 'DRAFT行だけ更新・削除可能'),
      @('個別見積依頼送信', '`POST /quotation-data-box/rfq-groups/{rfqGroupId}/vendor-requests/{rfqVendorId}/send`', 'DRAFT依頼先をSENTへ更新する'),
      @('見積ドラフト保存', '`POST /quotation-data-box/quotations`', '見積ヘッダー、原本メタデータ、明細、分類/AI/按分結果を保存する'),
      @('見積登録確定', '`POST /quotation-data-box/quotations/{quotationId}/confirm`', '見積DB登録済または発注見積登録済へ進める'),
      @('見積管理一覧', '`GET /quotation-management/quotation-items`', '登録済み購入見積明細を参照する'),
      @('発注登録', '`POST /quotation-data-box/order-registration/orders`', '発注ヘッダーと発注明細を作成し、RFQを発注済へ進める'),
      @('納品日登録', '`POST /quotation-data-box/inspection-registration/records`', '検収日と検収書種別を保存し、RFQを納期確定へ進める'),
      @('検収登録完了', '`POST /quotation-data-box/asset-provisional-registration/complete`', '個体検収情報を保存し、全件登録時にRFQを検収済へ進める'),
      @('資産登録', '`POST /quotation-data-box/asset-registration/register-bulk`', '検収済み個体を原本資産へ登録し、RFQを完了へ進める'),
      @('RFQ削除', '`DELETE /quotation-data-box/rfq-groups/{rfqGroupId}`', '発注済到達前だけ論理削除する')
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル名', '利用種別', '用途'); Rows = @(
      @('`purchase_applications` VIEW', 'READ', '購入申請受付一覧・詳細の投影。`applications`、`purchase_application_details`、`application_assets`、`edit_lists`、`rfq_applications`、`rfqs` から構成する'),
      @('`applications`', 'READ / UPDATE', '購入申請ヘッダー、ステータス、編集リスト取り込み、却下情報、申請履歴の起点'),
      @('`purchase_application_details`', 'READ', '購入申請区分、優先順位、希望納期、使用用途、症例数'),
      @('`application_assets`', 'READ', '購入申請明細、更新購入後処理区分、既存資産/要望資産の区分'),
      @('`application_status_histories`', 'CREATE / READ', '購入申請の却下、編集リスト取り込み、状態遷移履歴'),
      @('`application_documents`', 'READ / CREATE / UPDATE / DELETE', '申請添付、見積原本、依頼書、発注書、検収書、機器写真などのファイルメタデータ'),
      @('`edit_lists`', 'READ / CREATE / UPDATE', '通常編集リスト候補、新規作成、購入申請取り込み先。`list_type=''PURCHASE''` に限定する'),
      @('`edit_list_facilities`', 'READ / CREATE', '編集リスト対象施設、主施設/追加施設'),
      @('`edit_list_work_locks`', 'READ / UPDATE', '既存編集リスト取り込み時の作業ロック検証とheartbeat更新'),
      @('`edit_list_items`', 'READ / CREATE / UPDATE', '原本資産コピー、購入申請由来明細、RFQ現在表示用のNo/グループ名更新'),
      @('`asset_ledgers`', 'READ / CREATE', '編集リスト作成時の原本コピー元、資産登録完了時の原本資産作成先'),
      @('`rfqs`', 'READ / UPDATE / DELETE', '購入管理対象RFQグループ、ステータス、削除、完了日'),
      @('`rfq_applications`', 'READ', 'RFQに採用した編集リスト明細・申請明細のリンク。購入管理では作成済みリンクを参照する'),
      @('`rfq_vendors`', 'READ / CREATE / UPDATE / DELETE', '見積依頼先業者、依頼送信状態、提出期限、ご依頼事項'),
      @('`quotations`', 'READ / CREATE / UPDATE / DELETE', '見積ヘッダー、発注登録用見積/参考系見積、見積確定状態'),
      @('`quotation_items`', 'READ / CREATE / UPDATE / DELETE', '見積明細、分類、AI判定、個体登録、金額按分、見積管理一覧'),
      @('`quotation_item_application_links`', 'READ / DELETE', '見積DB Link由来の対応関係。RFQ削除時は論理削除する'),
      @('`orders`', 'READ / CREATE / UPDATE', '発注ヘッダー、決済No、納期、検収日、検収書種別'),
      @('`order_items`', 'READ / CREATE / UPDATE', '発注明細、個体登録対象、納品日'),
      @('`individuals`', 'READ / CREATE / UPDATE', '検収登録済み個体の中間正本。資産登録時に `asset_ledgers` へ反映する'),
      @('`vendors`', 'READ', '依頼先業者・見積業者のマスタ参照'),
      @('`users`', 'READ', 'ログインユーザー、依頼送信者、申請者表示、共有システム管理者判定'),
      @('`facilities`', 'READ', 'Bearer トークン上の作業対象施設、申請対象施設、編集リスト対象施設、RFQ対象施設の存在確認・未削除判定'),
      @('`user_facility_assignments`', 'READ', '通常アカウントの作業対象施設割当判定'),
      @('`facility_feature_settings`', 'READ', '通常アカウントの作業対象施設における購入、見積、発注、検収、SHIP依頼表示機能の提供有無判定'),
      @('`user_facility_feature_settings`', 'READ', '通常アカウントのユーザー×作業対象施設単位の購入、見積、発注、検収、SHIP依頼表示機能の利用可否判定')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API 共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON。ファイル実体アップロードは別ストレージ連携を前提とし、本APIでは `application_documents` のメタデータを扱う',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-05-27T10:00:00+09:00`）',
      '日付形式: `YYYY-MM-DD`',
      '認証済みAPIは Bearer トークンを `Authorization` ヘッダーに付与する',
      '一覧APIは cursor 方式のページングを基本とし、`limit` の既定値は50、最大値は200とする。ただし見積明細一覧は既定100、最大500とする',
      '変更系APIは `Idempotency-Key` または `expectedUpdatedAt` を受け付け、二重送信または競合更新を検出する',
      '論理削除は各テーブルの `deleted_at` を設定する。削除済み行は通常一覧から除外し、監査・履歴参照では必要に応じて保持する'
    ) },
    @{ Type = 'Heading2'; Text = '認証・認可' },
    @{ Type = 'Paragraph'; Text = '本API群は、ロール固定ではなく対象施設に対する実効 `feature_code` で認可する。通常アカウントでは、Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）では、作業対象施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず、通常購入、通常購入見積、通常購入発注、通常購入検収・原本登録、SHIP依頼表示の対象 `feature_code` を有効として扱う。' },
    @{ Type = 'Table'; Headers = @('機能コード', '対象操作', '説明'); Rows = @(
      @('`normal_purchase`', '購入申請受付、申請却下、編集リスト取り込み、RFQ一覧・詳細、依頼先保存、個別依頼送信、RFQ削除', '購入管理タブの基礎操作'),
      @('`normal_quotation`', '見積ドラフト保存、見積確定、見積管理一覧', '通常購入の見積登録・見積参照'),
      @('`normal_order`', '発注登録', '通常購入の発注工程'),
      @('`normal_acceptance`', '納品日登録、検収登録、資産登録', '通常購入の検収・原本登録工程'),
      @('`normal_ship_request`', 'SHIPへ一括依頼ボタン表示', 'ボタン表示・押下UI枠だけに使用し、依頼作成APIは呼び出さない')
    ) },
    @{ Type = 'Heading2'; Text = '作業対象施設ベースの認可' },
    @{ Type = 'Bullets'; Items = @(
      '各 API は Bearer トークン上の作業対象施設が存在し、未削除であることを確認する',
      '通常アカウントでは、作業対象施設に対する有効担当施設割当と実効 `feature_code` を都度再判定する',
      '共有システム管理者アカウントでは、作業対象施設が未削除であれば通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による認可判定をバイパスする',
      '`applications.application_type=''PURCHASE''`、`rfqs.management_type=''PURCHASE''`、`workflow_type=''RFQ''`、対象申請・RFQ・編集リストの未削除、ステータス遷移順序、発注登録用見積確定、検収済み個体不足、有効な編集リスト作業ロックといった業務制約は共有システム管理者でもバイパスしない',
      '通常アカウントで作業対象施設に対して必要な実効 `feature_code` がない場合は 403 を返却する',
      '作業対象施設が存在しない、または削除済みの場合は 404 を返却する'
    ) },
    @{ Type = 'Heading2'; Text = '共通エラーレスポンス' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けメッセージ'),
      @('details', 'string[]', '-', '入力項目単位のエラーや補足情報'),
      @('traceId', 'string', '-', '調査用トレースID')
    ) },
    @{ Type = 'Heading2'; Text = 'ステータス遷移の前提' },
    @{ Type = 'Table'; Headers = @('工程', '開始ステータス', '成功後ステータス', '主API'); Rows = @(
      @('購入申請取り込み', '`申請中`', '`編集中`', '`POST /quotation-data-box/purchase-management/edit-lists` / `POST /quotation-data-box/purchase-management/edit-lists/{editListId}/import-applications`'),
      @('購入申請却下', '`申請中`', '`却下`', '`POST /quotation-data-box/purchase-management/applications/{applicationId}/reject`'),
      @('通常購入RFQ作成', '`編集中`', '購入申請=`見積中`', 'No.23「編集リスト」APIでRFQを作成し、購入申請へロールアップする'),
      @('見積依頼送信', '`見積依頼`', '`見積依頼済`', '`POST /quotation-data-box/rfq-groups/{rfqGroupId}/vendor-requests/{rfqVendorId}/send`'),
      @('参考系見積確定', '`見積依頼済` など', '`見積DB登録済`', '`POST /quotation-data-box/quotations/{quotationId}/confirm`'),
      @('発注登録用見積確定', '`発注用見積依頼済` など', '`発注見積登録済`', '`POST /quotation-data-box/quotations/{quotationId}/confirm`'),
      @('発注登録', '`発注見積登録済`', 'RFQ=`発注済` / 購入申請=`発注済`', '`POST /quotation-data-box/order-registration/orders`'),
      @('納品日登録', '`発注済`', 'RFQ=`納期確定` / 購入申請=`納品済`', '`POST /quotation-data-box/inspection-registration/records`'),
      @('検収登録', '`納期確定`', 'RFQ=`検収済` / 購入申請=`検収済`', '`POST /quotation-data-box/asset-provisional-registration/complete`'),
      @('資産登録', '`検収済`', 'RFQ=`完了` / 購入申請=`完了`', '`POST /quotation-data-box/asset-registration/register-bulk`')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API一覧' },
    @{ Type = 'Table'; Headers = @('No', 'API名', 'Method', 'Path', '用途', '主権限'); Rows = @(
      @('25-01', '購入管理コンテキスト取得', 'GET', '/quotation-data-box/purchase-management/context', '購入管理タブ初期表示', '入口権限いずれか'),
      @('25-02', '購入申請受付一覧取得', 'GET', '/quotation-data-box/purchase-management/applications', '未処理購入申請一覧', 'normal_purchase'),
      @('25-03', '購入申請詳細取得', 'GET', '/quotation-data-box/purchase-management/applications/{applicationId}', '申請詳細モーダル', 'normal_purchase'),
      @('25-04', '購入申請却下', 'POST', '/quotation-data-box/purchase-management/applications/{applicationId}/reject', '購入申請却下', 'normal_purchase'),
      @('25-05', '編集リスト候補取得', 'GET', '/quotation-data-box/purchase-management/edit-list-candidates', '通常編集リスト候補', 'normal_purchase'),
      @('25-06', '編集リスト新規作成・購入申請取り込み', 'POST', '/quotation-data-box/purchase-management/edit-lists', '新規通常編集リスト作成と申請取り込み', 'normal_purchase'),
      @('25-07', '既存編集リストへの購入申請取り込み', 'POST', '/quotation-data-box/purchase-management/edit-lists/{editListId}/import-applications', '既存通常編集リストへ申請追加', 'normal_purchase'),
      @('25-08', '購入管理RFQ一覧取得', 'GET', '/quotation-data-box/rfq-groups', '購入管理RFQ一覧とタブ件数', '入口権限いずれか'),
      @('25-09', 'RFQグループ詳細取得', 'GET', '/quotation-data-box/rfq-groups/{rfqGroupId}', 'RFQ詳細・共通画面表示', '入口権限いずれか'),
      @('25-10', '見積依頼先保存', 'POST', '/quotation-data-box/rfq-groups/{rfqGroupId}/vendor-requests', '依頼先の追加・更新・未送信削除', 'normal_purchase'),
      @('25-11', '見積依頼個別送信', 'POST', '/quotation-data-box/rfq-groups/{rfqGroupId}/vendor-requests/{rfqVendorId}/send', '依頼先1件の送信', 'normal_purchase'),
      @('25-12', '見積ドラフト保存', 'POST', '/quotation-data-box/quotations', '見積ヘッダー・明細・原本メタデータ保存', 'normal_quotation'),
      @('25-13', '見積確定', 'POST', '/quotation-data-box/quotations/{quotationId}/confirm', '見積DB登録/発注見積登録の確定', 'normal_quotation'),
      @('25-14', '見積管理明細一覧取得', 'GET', '/quotation-management/quotation-items', '購入見積明細一覧参照', 'normal_quotation'),
      @('25-15', '発注登録', 'POST', '/quotation-data-box/order-registration/orders', '発注ヘッダー・明細作成', 'normal_order'),
      @('25-16', '納品検収予定日登録', 'POST', '/quotation-data-box/inspection-registration/records', '検収日・検収書種別登録', 'normal_acceptance'),
      @('25-17', '検収登録完了', 'POST', '/quotation-data-box/asset-provisional-registration/complete', '検収登録済み個体保存', 'normal_acceptance'),
      @('25-18', '原本資産登録', 'POST', '/quotation-data-box/asset-registration/register-bulk', '検収済み個体の原本資産登録', 'normal_acceptance'),
      @('25-19', 'RFQグループ削除', 'DELETE', '/quotation-data-box/rfq-groups/{rfqGroupId}', '発注済到達前RFQの論理削除', 'normal_purchase')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 機能設計' },
    @{ Type = 'EndpointBlocks'; Items = $endpointBlocks },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '責務境界' },
    @{ Type = 'Bullets'; Items = @(
      '資産一覧からの購入申請起票は No.13 資産申請起票API設計書を正本とし、本書では起票済み購入申請の受付以降を扱う',
      '編集リスト本体操作、Data Link、見積DB Link、行削除、行順変更、フリーカラム、編集リスト画面で選択行から実行する通常購入RFQ作成は No.23 編集リストAPI設計書を正本とする',
      '購入管理タブの申請受付一覧から行う通常編集リスト新規作成・購入申請取り込み、および既存通常編集リストへの購入申請取り込みは本書で扱う',
      '購入管理タブでは作成済み `rfqs.management_type=''PURCHASE''` のRFQ一覧表示と後続進行を扱い、リモデル管理のRFQとは混在させない',
      'SHIP代理作業依頼の作成・一覧・担当取得・差戻し・完了・取消APIは本書の対象外であり、本書では `normal_ship_request` によるボタン表示可否だけを扱う',
      'OCR抽出、OCRジョブ制御、OCR結果取込・補正APIは本書の対象外とし、見積登録APIは手動入力された見積明細を保存する'
    ) },
    @{ Type = 'Heading2'; Text = '購入申請受付ルール' },
    @{ Type = 'Bullets'; Items = @(
      '申請受付一覧は `applications.application_type=''PURCHASE''`、`status=''申請中''`、`edit_list_id IS NULL` の購入申請を未処理キューとして扱う',
      '編集リスト取り込み後は `applications.edit_list_id` を設定し、`applications.status=''編集中''` へ更新する。`受付済` のような中間ステータスは設けない',
      '購入申請却下は `status=''申請中''` の間だけ許可する。編集リスト取り込み後の却下は行わない',
      '却下理由は画面に入力欄がないため任意とし、指定された場合のみ `application_status_histories.comment` へ保存する',
      '同一購入申請明細の同一編集リストへの重複取り込みは、`edit_list_items.source_type=''APPLICATION''` と `(edit_list_id, source_application_id, source_application_asset_id)` の一意性で防止する',
      '通常購入RFQ作成後の購入申請ステータスは、`rfq_applications.edit_list_item_id` から `edit_list_items.source_application_id` / `source_application_asset_id` を辿ってロールアップする。複数RFQに分割された申請は、同一申請配下の有効な購入申請明細のうち最も遅れている工程を `applications.status` とし、完了は全明細の原本登録後とする'
    ) },
    @{ Type = 'Heading2'; Text = 'RFQ・見積ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`rfqs` は見積依頼グループの正本であり、複数業者への相見積もりは `rfq_vendors` 複数行で表現する',
      'RFQ詳細・依頼書プレビュー・見積登録対象明細は `rfq_applications` に紐づく編集リスト明細だけを返し、同一編集リスト内の未選択明細を含めない',
      '`rfq_vendors.request_status=''DRAFT''` の行のみ業者情報、提出期限、ご依頼事項を更新または削除できる',
      '個別依頼送信は `DRAFT` 行だけを `SENT` へ更新し、`requested_at` と `requested_by_user_id` を設定する',
      '参考系見積から発注登録用見積へ進む場合、同一RFQのフェーズ更新ではなく、編集リスト側で発注登録用見積として別RFQグループを作成する。購入管理では作成済みRFQの後続進行を扱う',
      '登録区分登録では `ABC` / `D` / `OTHER` 判定を初期値として使い、値引き系キーワードに該当する `OTHER` 行だけ `値引き` として扱う',
      '個体品目AI判定では `その他` / `値引き` 行をAI推薦対象外とする'
    ) },
    @{ Type = 'Heading2'; Text = '発注・検収・資産登録ルール' },
    @{ Type = 'Bullets'; Items = @(
      '発注登録は `rfqs.status=''発注見積登録済''` のRFQに限り許可し、登録成功時に `発注済` へ進める',
      '納品検収予定日登録は `rfqs.status=''発注済''` のRFQに限り許可し、登録成功時に `納期確定` へ進める',
      '資産仮登録は `rfqs.status=''納期確定''` のRFQに限り許可し、対象数量分の `individuals` が揃った場合だけ `検収済` へ進める',
      '資産登録は `rfqs.status=''検収済''` のRFQに限り許可し、`individuals` を `asset_ledgers` へ反映して `完了` へ進める',
      '更新購入の後処理は申請時の `application_assets.replacement_action` に従い、廃棄管理、移動管理、または継続利用として扱う。`DISPOSAL` は `disposal_application_details.related_purchase_application_id`、`TRANSFER` は `transfer_application_details.related_purchase_application_id` で起点購入申請を追跡し、購入管理APIは関連廃棄/移動申請を新規起票しない'
    ) },
    @{ Type = 'Heading2'; Text = '削除・競合ルール' },
    @{ Type = 'Bullets'; Items = @(
      'RFQ削除は `発注済` 到達前のステータスだけ許可する。`発注済` / `納期確定` / `検収済` / `完了` 以降は削除不可とする',
      'RFQ削除時は `rfqs`、`rfq_vendors`、`quotations`、`quotation_items`、`quotation_item_application_links` を同一トランザクションで論理削除する',
      '`rfq_applications` は採用履歴として保持し、通常一覧・現在割当判定では `rfqs.deleted_at IS NULL` のRFQだけを有効扱いとする',
      '既存編集リストへの購入申請取り込みは編集リスト明細を追加するため、有効な `edit_list_work_locks.lock_token` を必須とする',
      '変更系APIは `expectedUpdatedAt` または `Idempotency-Key` により競合更新と二重送信を検出する'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTPステータス', '内容', '発生条件'); Rows = $commonErrorRows },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = 'データ保守方針' },
    @{ Type = 'Bullets'; Items = @(
      '購入申請の正本は `applications` / `purchase_application_details` / `application_assets` とし、購入管理タブでは起票済み申請の状態更新と編集リスト取り込みを行う',
      '通常購入RFQの正本は `rfqs.management_type=''PURCHASE''` とし、リモデル、廃棄、修理、保守契約のRFQと混在させない',
      '見積明細の分類、AI判定、按分結果は `quotation_items` に保持し、原本資産へは資産登録完了時に必要項目だけ反映する',
      '検収登録済み個体の中間正本は `individuals` とし、資産登録完了時に `asset_ledgers` を作成して `registration_status=''REGISTERED''` へ更新する',
      'ファイル実体は別ストレージを前提とし、本APIでは `application_documents` にファイルメタデータと工程上の所有者を保持する'
    ) },
    @{ Type = 'Heading2'; Text = '拡張時の留意点' },
    @{ Type = 'Bullets'; Items = @(
      'OCR連携を追加する場合は、OCRジョブ、抽出結果、補正結果、手動入力との差分を別APIとして設計し、本書の手動入力APIと責務を混在させない',
      'SHIP代理作業依頼を実装する場合は、外部送信とは別の内部依頼として扱い、`rfq_vendors.request_status` を直接 `SENT` に更新しない',
      '承認フローや見積承認が追加される場合は、`application_approval_steps` または別承認APIとの責務境界を再定義する',
      '帳票出力やメール送信を本実装化する場合は、出力ジョブ、送信ログ、再送条件、SES設定を運用設計と合わせて追加する',
      '固定資産番号の必須性や採番ルールは施設運用差があるため、施設設定で必須化する場合は資産登録APIのバリデーション条件として追加する'
    ) }
  )
}
