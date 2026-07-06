$entryPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `remodel_purchase` / `remodel_order` / `remodel_acceptance` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、リモデル管理タブ入口は作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `remodel_purchase` / `remodel_order` / `remodel_acceptance` のいずれかが有効であれば参照可能とする',
  '認可条件: 個別操作APIでは、操作に対応する `feature_code` をサーバー側で再判定する'
)

$purchasePermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `remodel_purchase` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `remodel_purchase` が有効であること',
  '認可条件: 対象RFQは `rfqs.management_type=''REMODEL''` かつ `deleted_at IS NULL` であること'
)

$orderPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `remodel_order` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `remodel_order` が有効であること',
  '認可条件: 対象RFQは `rfqs.management_type=''REMODEL''` かつ `workflow_type=''RFQ''` かつ `deleted_at IS NULL` であること'
)

$acceptancePermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `remodel_acceptance` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `remodel_acceptance` が有効であること',
  '認可条件: 対象RFQは `rfqs.management_type=''REMODEL''` かつ `workflow_type=''RFQ''` かつ `deleted_at IS NULL` であること'
)

$transferDisposalPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `transfer_disposal` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること',
  '認可条件: 対象RFQは `rfqs.management_type=''REMODEL''` かつ `workflow_type IN (''DISPOSAL'',''TRANSFER'')` かつ `deleted_at IS NULL` であること'
)

$closePermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `remodel_acceptance` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `remodel_acceptance` が有効であること',
  '認可条件: 対象編集リストは `edit_lists.list_type=''REMODEL''`、`deleted_at IS NULL`、`status=''ACTIVE''` であること',
  '認可条件: 有効な `edit_list_work_locks` が存在しないこと'
)

$workFacilityProcessingLine = 'Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。'

$commonErrorRows = @(
  @('AUTH_401_UNAUTHORIZED', '401', '認証情報が存在しない、または無効', 'Bearer トークン未指定、期限切れ、署名不正'),
  @('FACILITY_NOT_FOUND', '404', '作業対象施設を参照できない', 'Bearer トークン上の作業対象施設が存在しない、または削除済み'),
  @('AUTH_403_REMODEL_DENIED', '403', 'リモデル管理の実効権限がない', '通常アカウントで `remodel_purchase` / `remodel_order` / `remodel_acceptance` のいずれも実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする'),
  @('AUTH_403_REMODEL_PURCHASE_DENIED', '403', 'リモデル見積・見積登録権限がない', '通常アカウントで `remodel_purchase` が実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする'),
  @('AUTH_403_REMODEL_ORDER_DENIED', '403', 'リモデル発注権限がない', '通常アカウントで `remodel_order` が実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする'),
  @('AUTH_403_REMODEL_ACCEPTANCE_DENIED', '403', 'リモデル検収・原本登録権限がない', '通常アカウントで `remodel_acceptance` が実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする'),
  @('AUTH_403_TRANSFER_DISPOSAL_DENIED', '403', '廃棄・移動操作権限がない', '通常アカウントで `transfer_disposal` が実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする'),
  @('EDIT_LIST_NOT_FOUND', '404', 'リモデル編集リストを参照できない', 'ID不存在、施設不一致、削除済み、または `list_type=''REMODEL''` ではない'),
  @('EDIT_LIST_LOCK_ACTIVE', '409', '編集リスト作業ロックが残っている', 'リモデルクローズ時に有効な `edit_list_work_locks` が存在する'),
  @('RFQ_GROUP_NOT_FOUND', '404', 'RFQグループを参照できない', 'ID不存在、施設不一致、削除済み、または `management_type=''REMODEL''` ではない'),
  @('RFQ_STATUS_CONFLICT', '409', 'RFQステータスが操作条件を満たさない', 'ステータス遷移順序不一致、または終端済みワークフローを更新した'),
  @('RFQ_VENDOR_NOT_FOUND', '404', '見積業者行を参照できない', 'ID不存在、RFQ不一致、削除済み'),
  @('QUOTATION_DRAFT_NOT_FOUND', '404', '見積登録ドラフトを参照できない', 'ID不存在、RFQ不一致、削除済み、または管理区分不一致'),
  @('QUOTATION_CONFIRM_CONFLICT', '409', '見積確定条件を満たさない', '見積フェーズ不正、必須情報不足、明細区分未確定、または未登録個体品目が残っている'),
  @('ORDER_QUOTATION_REQUIRED', '409', '発注登録用見積が確定済みでない', '発注登録時に `発注見積登録済` のRFQまたは採用見積が存在しない'),
  @('ORDER_NOT_FOUND', '404', '発注を参照できない', 'ID不存在、RFQ不一致、または対象発注データなし'),
  @('INDIVIDUAL_REGISTRATION_INCOMPLETE', '409', '検収登録済み個体が不足している', '資産登録時に対象発注明細分の `individuals` が未作成'),
  @('REMODEL_CLOSE_BLOCKED', '409', 'リモデルクローズ条件を満たさない', '方針未決、新設置場所未入力、未終端ワークフロー、原本登録未完了、または作業ロック残存'),
  @('REMODEL_FILE_502_S3_WRITE_FAILED', '502', 'Amazon S3 へのファイル保存またはロールバック削除に失敗した', '見積原本または検収写真のAmazon S3 PutObject、またはDB失敗時の保存済みS3オブジェクト破棄に失敗した'),
  @('VALIDATION_ERROR', '400', '入力値不正', '必須不足、列挙値不正、文字数超過、日付前後関係不正'),
  @('CONFLICT', '409', '競合更新', '`expectedUpdatedAt` または `Idempotency-Key` の競合'),
  @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー', '想定外例外')
)

$taskSummaryRows = @(
  @('rfqGroupId', 'int64', '✓', '`rfqs.rfq_id`'),
  @('rfqNo', 'string', '✓', '`rfqs.rfq_no`。RFQは `RFQ-`、廃棄は `DISP-`、移動は `TRAN-` の採番値'),
  @('rfqGroupName', 'string', '✓', '`rfqs.rfq_group_name`'),
  @('editListId', 'int64', '✓', '`rfqs.edit_list_id`'),
  @('managementType', 'string', '✓', '`REMODEL` 固定'),
  @('workflowType', 'string', '✓', '`RFQ` / `DISPOSAL` / `TRANSFER`'),
  @('quotationType', 'string', '-', '`PURCHASE` / `LEASE` / `INSTALLMENT` / `RENTAL` / `TRIAL` / `BORROW` / `REPAIR` / `MAINTENANCE` / `INSPECTION` / `OTHER`。未指定可'),
  @('quotationPhase', 'string', '-', '`LIST_PRICE` / `ESTIMATE` / `ORDER_REGISTRATION` / `FINAL_ASSET_REGISTRATION`。未指定可'),
  @('status', 'string', '✓', '`rfq_status_definitions` の表示値'),
  @('deadlineLabel', 'string', '-', '見積提出期限、発注期限、登録期限、納入期限、納入年月日、検収年月日、却下日、承認日、完了日'),
  @('deadlineOn', 'date', '-', 'ステータスに対応する期限日または実績日'),
  @('applicationIds', 'int64[]', '✓', '`rfq_applications.application_id` の重複排除配列'),
  @('vendorRows', 'RfqVendorSummary[]', '✓', 'RFQは業者行へ展開、廃棄/移動は空配列または代表行'),
  @('amount', 'decimal', '-', '採用見積または発注の合計金額'),
  @('ownerName', 'string', '-', '作成者または担当者表示名'),
  @('availableActions', 'string[]', '✓', 'ステータスから導出した操作コード')
)

$vendorRows = @(
  @('rfqVendorId', 'int64', '✓', '`rfq_vendors.rfq_vendor_id`'),
  @('vendorId', 'int64', '-', '業者マスタID。手入力業者は null'),
  @('vendorName', 'string', '✓', '見積業者名'),
  @('contactPerson', 'string', '-', '担当者名'),
  @('email', 'string', '-', 'メールアドレス'),
  @('phone', 'string', '-', '電話番号'),
  @('dueOn', 'date', '-', '見積提出期限'),
  @('requestNote', 'string', '-', '依頼メモ'),
  @('requestStatus', 'string', '✓', '`DRAFT` / `SENT` / `REPLIED` / `CANCELED`。Phase1では `SENT` を送信完了正本として更新せず、取得済み見積の登録確定時に必要に応じて `REPLIED` を利用する'),
  @('requestedAt', 'datetime', '-', 'Phase2のOutlook連携または送信管理を持つ他業務で利用する依頼連携日時')
)

$editListItemRows = @(
  @('editListItemId', 'int64', '✓', '`edit_list_items.edit_list_item_id`'),
  @('rowNo', 'int32', '✓', '編集リスト内表示順'),
  @('sourceType', 'string', '✓', '`BASE_ASSET` / `APPLICATION` / `MANUAL` / `QUOTATION`'),
  @('remodelDecision', 'string', '✓', '`UNDECIDED` / `NEW` / `REPLACE` / `ADDITION` / `DISPOSAL` / `TRANSFER`'),
  @('targetFacilityId', 'int64', '-', '`edit_list_items.target_facility_id`'),
  @('targetBuildingName', 'string', '-', '`target_building_name`'),
  @('targetFloorName', 'string', '-', '`target_floor_name`'),
  @('targetDepartmentName', 'string', '-', '`target_department_name`'),
  @('targetSectionName', 'string', '-', '`target_section_name`'),
  @('targetRoomName', 'string', '-', '`target_room_name`'),
  @('targetInstallationLocation', 'string', '-', '`target_installation_location`'),
  @('itemName', 'string', '-', '品目名'),
  @('makerName', 'string', '-', 'メーカー名'),
  @('modelName', 'string', '-', '型式'),
  @('reflectionStatus', 'string', '✓', '`PENDING` / `REFLECTED` / `SKIPPED` / `ERROR`')
)

$quotationDraftRows = @(
  @('draftId', 'int64', '✓', '見積登録ドラフトID。`quotations.quotation_id` を使用し、確定前は `quotations.status=''DRAFT''` として扱う'),
  @('rfqGroupId', 'int64', '✓', '`rfqs.rfq_id`'),
  @('managementType', 'string', '✓', '`REMODEL`'),
  @('returnTo', 'string', '✓', '`/quotation-data-box/remodel-management`'),
  @('quotationPhase', 'string', '✓', '`LIST_PRICE` / `ESTIMATE` / `ORDER_REGISTRATION`'),
  @('storageFormat', 'string', '-', '`電子取引` / `スキャナ保存` / `未指定`'),
  @('registrationDueOn', 'date', '-', '登録期限'),
  @('basicInfo', 'QuotationBasicInfo', '✓', '見積基本情報'),
  @('items', 'QuotationDraftItem[]', '✓', '見積明細'),
  @('progress', 'QuotationDraftProgress', '✓', '共通画面の進捗状態'),
  @('counts', 'object', '✓', '全明細件数、個体管理対象件数、紐付け済み件数')
)

$quotationItemRows = @(
  @('quotationItemId', 'int64', '-', '`quotation_items.quotation_item_id`。ドラフト行は null 可'),
  @('rowNo', 'int32', '✓', '見積書上の行番号'),
  @('originalItemName', 'string', '✓', '原文品目'),
  @('originalMakerName', 'string', '-', '原文メーカー'),
  @('originalModelName', 'string', '-', '原文型式'),
  @('quantity', 'int32', '✓', '数量'),
  @('itemType', 'string', '-', '`明細代表` / `内訳代表` / `親明細` / `子明細` / `孫明細` / `その他` / `値引き`'),
  @('categoryCode', 'string', '-', '会計区分 `01`〜`17`'),
  @('shipAssetMasterId', 'int64', '-', '採用したSHIP資産マスタID'),
  @('unit', 'string', '-', '`台` / `個` / `本` / `枚` / `組` / `セット` / `式`'),
  @('taxType', 'string', '-', '`課税` / `非課税`'),
  @('seqId', 'string', '-', '親子関係SEQ'),
  @('parentSeqId', 'string', '-', '親SEQ'),
  @('excluded', 'boolean', '✓', '登録除外行かどうか')
)

$orderItemRows = @(
  @('orderItemId', 'int64', '✓', '`order_items.order_item_id`'),
  @('quotationItemId', 'int64', '✓', '`quotation_items.quotation_item_id`'),
  @('registrationType', 'string', '✓', '`本体` / `付属品`'),
  @('itemName', 'string', '✓', '品目名'),
  @('makerName', 'string', '-', 'メーカー名'),
  @('modelName', 'string', '-', '型式'),
  @('quantity', 'int32', '✓', '数量'),
  @('unitPrice', 'decimal', '-', '単価'),
  @('amount', 'decimal', '-', '金額'),
  @('deliveryOn', 'date', '-', '明細別納品日')
)

$individualRows = @(
  @('individualId', 'int64', '-', '`individuals.individual_id`'),
  @('orderItemId', 'int64', '✓', '`order_items.order_item_id`'),
  @('qrCodeValue', 'string', '-', 'QRコード値'),
  @('serialNo', 'string', '-', 'シリアルNo.'),
  @('itemName', 'string', '✓', '品目名'),
  @('makerName', 'string', '-', 'メーカー名'),
  @('modelName', 'string', '-', '型式'),
  @('acquisitionAmount', 'decimal', '-', '取得金額'),
  @('acquiredOn', 'date', '-', '取得日'),
  @('facilityLocationId', 'int64', '-', '設置ロケーションID'),
  @('departmentName', 'string', '-', '部門'),
  @('sectionName', 'string', '-', '部署'),
  @('roomName', 'string', '-', '室名'),
  @('photoDocumentIds', 'int64[]', '-', '検収登録中に保存した写真ドキュメントID。原本資産登録時に該当資産写真へ複製する対象'),
  @('fixedAssetNo', 'string', '-', '固定資産番号'),
  @('registrationStatus', 'string', '✓', '`INSPECTED` / `REGISTERED`')
)

$documentInputRows = @(
  @('documentType', 'string', '✓', '`application_documents.document_type`。例: 見積原本 / 検収写真'),
  @('filePartName', 'string', '✓', 'multipart/form-data 内のファイルパート名。ファイル実体とメタデータを対応付ける'),
  @('fileName', 'string', '-', '画面表示用ファイル名。未指定時はアップロードファイル名'),
  @('contentType', 'string', '-', 'MIME Type。未指定時はアップロードファイルまたはサーバー判定値を使用する'),
  @('fileSizeBytes', 'int64', '-', '画面側検証用ファイルサイズ。保存時はサーバーがファイル実体から算出した値を正本にする'),
  @('contentHash', 'string', '-', 'クライアント計算ハッシュ。サーバー側でも再計算する'),
  @('title', 'string', '-', '表示タイトル'),
  @('documentDate', 'date', '-', '文書日付'),
  @('takenAt', 'datetime', '-', '写真撮影日時。見積原本では使用しない'),
  @('isPrimary', 'boolean', '-', '検収写真を代表写真として扱う場合 true')
)

function New-EndpointBlock {
  param(
    [Parameter(Mandatory = $true)][string]$Title,
    [Parameter(Mandatory = $true)][string]$Overview,
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Auth,
    [object[]]$ParametersRows = @(),
    [string]$RequestTitle = 'リクエストボディ',
    [object[]]$RequestRows = @(),
    [object[]]$RequestSubtables = @(),
    [string[]]$PermissionLines = @(),
    [string[]]$ProcessingLines = @(),
    [object[]]$ExtraTables = @(),
    [object[]]$ResponseRows = @(),
    [object[]]$ResponseSubtables = @(),
    [object[]]$StatusRows = @()
  )

  if ($StatusRows.Count -eq 0) {
    $StatusRows = @(
      @('200', '正常終了', '各APIの成功レスポンス'),
      @('400', '入力値不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '権限なし', 'ErrorResponse'),
      @('404', '対象データなし', 'ErrorResponse'),
      @('409', '状態不整合または競合更新', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  }

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
    $block.RequestTitle = $RequestTitle
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
    -Title 'リモデル管理コンテキスト取得' `
    -Overview 'リモデル管理タブの初期表示に必要なリモデル編集リスト候補、絞り込み選択肢、権限、既定戻り先を取得する。' `
    -Method 'GET' `
    -Path '/quotation-data-box/remodel-management/context' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('editListId', 'query', 'int64', '-', '選択中のリモデル編集リストID。未指定時は選択なし状態で返す')
    ) `
    -PermissionLines $entryPermissionLines `
    -ProcessingLines @(
      '作業対象施設で参照可能な `edit_lists.list_type=''REMODEL''`、`deleted_at IS NULL` の候補だけを返す。',
      '`editListId` 未指定時はリスト未選択状態とし、ダッシュボード用の既定候補があれば `defaultDashboardEditListId` に返す。',
      '見積区分、見積フェーズ、ステータスはDB定義済みコードと表示ラベルの組で返す。',
      '戻り先は `/quotation-data-box/remodel-management` を既定とする。'
    ) `
    -ResponseRows @(
      @('editLists', 'EditListOption[]', '✓', 'リモデル編集リスト候補'),
      @('defaultDashboardEditListId', 'int64', '-', 'ダッシュボード既定候補'),
      @('quotationTypes', 'CodeLabel[]', '✓', '見積区分候補'),
      @('quotationPhases', 'CodeLabel[]', '✓', '見積フェーズ候補'),
      @('statuses', 'CodeLabel[]', '✓', 'RFQ/DISPOSAL/TRANSFER の状態候補'),
      @('permissions', 'object', '✓', '操作別可否'),
      @('returnTo', 'string', '✓', '`/quotation-data-box/remodel-management`')
    )

  New-EndpointBlock `
    -Title 'リモデル管理タスク一覧取得' `
    -Overview '編集リストから作成済みのリモデルRFQ、廃棄承認、移動承認を一覧取得する。' `
    -Method 'GET' `
    -Path '/quotation-data-box/remodel-management/tasks' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('editListId', 'query', 'int64', '-', '指定時は当該リモデル編集リストに紐づく行だけを返す'),
      @('quotationType', 'query', 'string', '-', '見積区分。指定時、未指定RFQは除外する'),
      @('quotationPhase', 'query', 'string', '-', '見積フェーズ。指定時、未指定RFQは除外する'),
      @('status', 'query', 'string', '-', 'ステータス'),
      @('cursor', 'query', 'string', '-', 'ページングカーソル'),
      @('limit', 'query', 'int32', '-', '既定50、最大200')
    ) `
    -PermissionLines $entryPermissionLines `
    -ProcessingLines @(
      '`rfqs.management_type=''REMODEL''`、`deleted_at IS NULL` の行だけを対象とする。',
      '通常見積は `workflow_type=''RFQ''`、廃棄は `DISPOSAL`、移動は `TRANSFER` として同一一覧へ返す。',
      '見積区分または見積フェーズを指定した場合は `workflow_type=''RFQ''` かつ指定値に一致する行だけを返し、見積区分/見積フェーズを持たない廃棄・移動ワークフローは除外する。',
      '`editListId` 未指定時は作業対象施設で参照可能なリモデル管理対象を横断表示する。',
      'RFQは `rfqs` 1件と `rfq_vendors` 複数件を画面表示用の業者行へ展開する。',
      '操作可否はステータス、ワークフロー種別、実効権限からサーバー側で導出する。'
    ) `
    -ResponseRows @(
      @('items', 'RemodelTaskSummary[]', '✓', 'リモデル管理一覧行'),
      @('emptyMessage', 'string', '-', '該当なし時の空状態メッセージ'),
      @('nextCursor', 'string', '-', '次ページカーソル')
    ) `
    -ResponseSubtables @(
      @{ Title = 'RemodelTaskSummary'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $taskSummaryRows },
      @{ Title = 'RfqVendorSummary'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $vendorRows }
    )

  New-EndpointBlock `
    -Title 'リモデル管理期限更新' `
    -Overview '一覧の期限欄から、ステータスに応じた期限または実績日を更新する。' `
    -Method 'PATCH' `
    -Path '/quotation-data-box/remodel-management/rfq-groups/{rfqGroupId}/deadlines' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('rfqGroupId', 'path', 'int64', '✓', '対象RFQグループID')
    ) `
    -RequestRows @(
      @('deadlineOn', 'date', '✓', '更新する期限日または実績日'),
      @('expectedUpdatedAt', 'datetime', '-', '競合検知用')
    ) `
    -PermissionLines $entryPermissionLines `
    -ProcessingLines @(
      '対象RFQの `management_type=''REMODEL''` を検証する。',
      'ステータス別に、見積提出期限、発注期限、登録期限、納入期限、納入年月日、検収年月日、却下日、承認日、完了日のいずれかとして保存する。',
      'RFQ系の期限は原則 `rfqs.due_on`、承認日/却下日/完了日は `approved_on` / `rejected_on` / `completed_on` に保存する。',
      '期限更新はステータス遷移ではないため `rfqs.last_status_changed_at` は更新しない。',
      '更新前後の期限ラベル、日付、変更者、変更日時はアプリケーション監査ログへ出力し、業務DBでは対象日付列と `rfqs.updated_at` を現在値正本とする。'
    ) `
    -ResponseRows @(
      @('rfqGroupId', 'int64', '✓', '対象RFQグループID'),
      @('deadlineLabel', 'string', '✓', '画面表示ラベル'),
      @('deadlineOn', 'date', '✓', '更新後日付'),
      @('updatedAt', 'datetime', '✓', '更新日時')
    )

  New-EndpointBlock `
    -Title 'リモデルダッシュボード取得' `
    -Overview '編集リスト単位で、方針別内訳、進捗、クローズ可否、クローズ不可理由を取得する。' `
    -Method 'GET' `
    -Path '/quotation-data-box/remodel-dashboard' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('editListId', 'query', 'int64', '-', '対象リモデル編集リストID。未指定時は既定候補を返す')
    ) `
    -PermissionLines $entryPermissionLines `
    -ProcessingLines @(
      '対象は `edit_lists.list_type=''REMODEL''` の編集リストのみとする。',
      'RFQ単位ではなく `editListId` 単位で集計する。',
      '新設置場所入力状況は廃棄方針の明細を集計対象外とする。',
      'クローズ不可理由は、方針未決、新設置場所未入力、未終端ワークフロー、原本登録未完了、作業ロック残存に区分する。'
    ) `
    -ResponseRows @(
      @('editListId', 'int64', '-', '対象編集リストID'),
      @('editListName', 'string', '-', '編集リスト名'),
      @('decisionCounts', 'object', '✓', '方針別件数'),
      @('locationInputStatus', 'object', '✓', '新設置場所入力状況'),
      @('workflowStatus', 'object', '✓', 'RFQ/廃棄/移動の終端状況'),
      @('originalRegistrationStatus', 'object', '✓', '原本登録状況'),
      @('canClose', 'boolean', '✓', 'クローズ可能か'),
      @('closeBlockers', 'CloseBlocker[]', '✓', 'クローズ不可理由')
    )

  New-EndpointBlock `
    -Title 'RFQグループ詳細取得' `
    -Overview 'リモデル管理タブから遷移したRFQ、廃棄、移動ワークフローの詳細と共通後続画面の文脈を取得する。' `
    -Method 'GET' `
    -Path '/quotation-data-box/rfq-groups/{rfqGroupId}' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('rfqGroupId', 'path', 'int64', '✓', '対象RFQグループID'),
      @('managementType', 'query', 'string', '-', '指定時は `REMODEL` と正本値一致を検証する'),
      @('returnTo', 'query', 'string', '-', '未指定時は `/quotation-data-box/remodel-management` を返す')
    ) `
    -PermissionLines $entryPermissionLines `
    -ProcessingLines @(
      '`rfqs.management_type=''REMODEL''` でない場合は拒否する。',
      '`rfqGroupId` だけで遷移した場合でも、RFQ正本から `managementType`、`editListId`、既定戻り先を解決して返す。',
      'レスポンスにはRFQヘッダー、業者行、対象編集リスト明細、既存見積/発注/検収/資産登録状況を含める。',
      '共通画面側は本レスポンスの `context.managementType` と `returnTo` を戻り先判定に利用する。'
    ) `
    -ResponseRows @(
      @('context', 'RfqContext', '✓', '管理区分、戻り先、次画面候補'),
      @('rfq', 'RemodelTaskSummary', '✓', 'RFQ/ワークフロー概要'),
      @('editListItems', 'EditListItemSummary[]', '✓', '紐づく編集リスト明細'),
      @('vendors', 'RfqVendorSummary[]', '✓', '見積業者行'),
      @('quotations', 'QuotationSummary[]', '✓', '登録済み見積'),
      @('order', 'OrderSummary', '-', '発注済みの場合の発注ヘッダー'),
      @('individuals', 'IndividualSummary[]', '✓', '検収登録済み個体')
    ) `
    -ResponseSubtables @(
      @{ Title = 'EditListItemSummary'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $editListItemRows }
    )

  New-EndpointBlock `
    -Title '廃棄・移動ワークフロー操作' `
    -Overview '廃棄/移動承認待ち、承認済みワークフローに対して承認、却下、完了を実行する。' `
    -Method 'POST' `
    -Path '/quotation-data-box/rfq-groups/{rfqGroupId}/workflow-action' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('rfqGroupId', 'path', 'int64', '✓', '対象廃棄/移動ワークフローID')
    ) `
    -RequestRows @(
      @('action', 'string', '✓', '`APPROVE` / `REJECT` / `COMPLETE_DISPOSAL` / `COMPLETE_TRANSFER`'),
      @('comment', 'string', '-', '画面入力欄はないため任意。指定時のみ備考として保存'),
      @('expectedUpdatedAt', 'datetime', '-', '競合検知用')
    ) `
    -PermissionLines $transferDisposalPermissionLines `
    -ProcessingLines @(
      '本APIは画面から実行する承認、却下、完了操作だけを扱い、次状態はワークフロー種別と現在ステータスからサーバー側で検証する。',
      '`APPROVE` は `廃棄承認待ち` から `廃棄承認済み`、または `移動承認待ち` から `移動承認済み` へ遷移する。',
      '`REJECT` は承認待ち状態から `申請を見送る` へ遷移し、`rfqs.rejected_on` を設定する。',
      '`COMPLETE_DISPOSAL` は `廃棄承認済み` から `廃棄完了`、`COMPLETE_TRANSFER` は `移動承認済み` から `移動完了` へ遷移する。',
      'No.24内の廃棄/移動進行状態は `rfqs.status` を正本とし、`applications.status` は更新しない。',
      '編集リスト起点の廃棄/移動ワークフローは `rfq_applications.application_id` を持つため、遷移成功時は対象申請ごとに更新前後の `rfqs.status` と操作コメントを `application_status_histories` へ記録する。',
      '遷移は `rfq_status_transitions` に存在する組み合わせだけ許可する。'
    ) `
    -ResponseRows @(
      @('rfqGroupId', 'int64', '✓', '対象ID'),
      @('workflowType', 'string', '✓', '`DISPOSAL` / `TRANSFER`'),
      @('status', 'string', '✓', '更新後ステータス'),
      @('approvedOn', 'date', '-', '承認日'),
      @('rejectedOn', 'date', '-', '却下日'),
      @('completedOn', 'date', '-', '完了日'),
      @('updatedAt', 'datetime', '✓', '更新日時')
    )

  New-EndpointBlock `
    -Title '見積登録先業者保存' `
    -Overview 'RFQプロセス画面で取得済み見積書の登録先となる業者行を登録または更新する。業者への見積依頼送信は行わない。' `
    -Method 'POST' `
    -Path '/quotation-data-box/rfq-groups/{rfqGroupId}/vendor-requests' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('rfqGroupId', 'path', 'int64', '✓', '対象RFQグループID')
    ) `
    -RequestRows @(
      @('vendors', 'RfqVendorInput[]', '✓', '保存する見積登録先業者行'),
      @('expectedUpdatedAt', 'datetime', '-', '競合検知用')
    ) `
    -PermissionLines $purchasePermissionLines `
    -ProcessingLines @(
      '対象RFQは `workflow_type=''RFQ''` のみ許可する。Phase1では業者への見積依頼送信をシステム上で管理しないため、`見積依頼済` はPhase2のOutlook連携または送信管理を持つ他業務用の状態として扱う。',
      '業者名、担当者、メール、電話番号、提出期限、補足メモを `rfq_vendors` に保存する。',
      '新規業者は `rfq_vendors.request_status=''DRAFT''` として追加し、業者マスタ未選択の手入力も許可する。',
      '`DRAFT` 行のみ業者情報、提出期限、補足メモを更新可能とする。`SENT` / `REPLIED` 行の業者情報更新は拒否する。',
      '本APIは `rfq_vendors.request_status=''SENT''`、`requested_at`、`requested_by_user_id` を更新しない。'
    ) `
    -ResponseRows @(
      @('rfqGroupId', 'int64', '✓', '対象RFQグループID'),
      @('vendors', 'RfqVendorSummary[]', '✓', '保存後の業者行'),
      @('updatedAt', 'datetime', '✓', '更新日時')
    ) `
    -ResponseSubtables @(
      @{ Title = 'RfqVendorSummary'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $vendorRows }
    )

  New-EndpointBlock `
    -Title '見積登録先業者削除' `
    -Overview 'RFQプロセスで未確定の見積登録先業者行を削除する。業者への見積依頼送信は行わない。' `
    -Method 'DELETE' `
    -Path '/quotation-data-box/rfq-groups/{rfqGroupId}/vendor-requests/{rfqVendorId}' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('rfqGroupId', 'path', 'int64', '✓', '対象RFQグループID'),
      @('rfqVendorId', 'path', 'int64', '✓', '対象見積登録先業者ID')
    ) `
    -PermissionLines $purchasePermissionLines `
    -ProcessingLines @(
      '`request_status=''DRAFT''` の行だけ削除できる。',
      '`SENT` / `REPLIED` 行は送信履歴または取得済み見積の記録として保持し、削除不可とする。',
      '本APIは `rfq_vendors.request_status=''SENT''`、`requested_at`、`requested_by_user_id` を更新しない。',
      '画面内追加行が未保存の場合はサーバー更新を行わず、クライアント側で破棄する。'
    ) `
    -ResponseRows @(
      @('deleted', 'boolean', '✓', '削除した場合 true'),
      @('rfqVendorId', 'int64', '✓', '削除対象ID')
    )

  New-EndpointBlock `
    -Title '見積登録ドラフト作成' `
    -Overview 'RFQプロセスから見積登録ドラフトを作成し、共通見積登録画面へ渡す文脈を保存する。' `
    -Method 'POST' `
    -Path '/quotation-data-box/rfq-groups/{rfqGroupId}/quotation-drafts' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('rfqGroupId', 'path', 'int64', '✓', '対象RFQグループID')
    ) `
    -RequestTitle 'リクエストボディ（multipart/form-data）' `
    -RequestRows @(
      @('payload.quotationPhase', 'string', '✓', '`LIST_PRICE` / `ESTIMATE` / `ORDER_REGISTRATION`'),
      @('payload.storageFormat', 'string', '-', '`電子取引` / `スキャナ保存` / `未指定`。ファイル保存先ではなく保存形式を表す'),
      @('payload.registrationDueOn', 'date', '-', '登録期限'),
      @('payload.vendorId', 'int64', '-', '見積業者ID'),
      @('payload.manualBasicInfo', 'QuotationBasicInfo', '-', '手入力した見積基本情報'),
      @('payload.documents', 'DocumentInput[]', '-', '添付見積書メタデータ。各要素の `filePartName` で対応するファイルパートを指定する'),
      @('payload.returnTo', 'string', '-', '既定 `/quotation-data-box/remodel-management`'),
      @('files', 'binary[]', '-', '`payload.documents[].filePartName` で参照される見積原本ファイル本体')
    ) `
    -RequestSubtables @(
      @{ Title = 'documents要素（DocumentInput）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentInputRows }
    ) `
    -PermissionLines $purchasePermissionLines `
    -ProcessingLines @(
      'RFQプロセスで作成できる見積フェーズは定価見積、概算見積、発注登録用見積とする。',
      '最終原本登録用は一覧絞り込みと既存見積参照候補として扱い、ドラフト作成対象外とする。',
      '`payload.documents[].filePartName` が multipart のファイルパートに存在することを確認し、`.pdf`、`.xlsx`、`.xls` の拡張子とMIME Typeを受け付ける。',
      'OCR実行サービスやExcel取込APIは対象外とし、画面で確認・編集された結果を後続APIで保存する。',
      'ドラフト作成時は `quotations.status=''DRAFT''` の見積ヘッダーを作成し、`draftId` には `quotations.quotation_id` を返す。',
      '見積原本ファイル本体をAPI内でAmazon S3へPutObjectし、S3オブジェクトキーは `application-documents/facility-{facilityId}/{yyyy}/{mm}/{uploadUuid}.{ext}` 形式で発行する。keyは保存場所識別子であり、`rfqGroupId` や `quotationId` などの業務IDを含めない。',
      '見積原本は `application_documents` に `owner_type=''QUOTATION''`、`quotation_id`、`document_category=''QUOTATION''`、`document_type`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`storage_format=payload.storageFormat`、`uploaded_by_user_id`、`uploaded_at` として保存する。S3バケット名やHTTPS URLはDBへ保存しない。',
      '`storageFormat` は保存先ではなく電子取引/スキャナ保存/未指定などの保存形式を表す列として扱い、S3保存有無の表現には使用しない。',
      'Amazon S3保存後にDBメタデータ保存またはドラフト作成トランザクションへ失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄する。破棄に失敗した場合は 502 (`REMODEL_FILE_502_S3_WRITE_FAILED`) を返却し、再試行可能な運用ログを残す。',
      'ドラフト明細は `quotation_items` に保持し、画面上で除外した行は `quotation_items.deleted_at` を設定して確定対象から外す。',
      '`managementType=''REMODEL''`、`returnTo`、対象RFQ/業者/明細の初期値をドラフトへ保持する。'
    ) `
    -ResponseRows @(
      @('draftId', 'int64', '✓', '作成した見積登録ドラフトID'),
      @('nextRoute', 'string', '✓', '次画面URL'),
      @('managementType', 'string', '✓', '`REMODEL`'),
      @('returnTo', 'string', '✓', '戻り先')
    ) `
    -StatusRows @(
      @('201', '作成成功', 'QuotationDraftCreateResponse'),
      @('400', '入力値不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '権限なし', 'ErrorResponse'),
      @('404', '対象RFQなし', 'ErrorResponse'),
      @('409', '状態不整合または競合更新', 'ErrorResponse'),
      @('502', 'Amazon S3 への見積原本保存またはロールバック削除に失敗した', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '見積登録ドラフト取得' `
    -Overview 'OCR確認、明細区分登録、資産マスタ登録、個体登録/金額按分、登録確認の各画面で使うドラフトを取得する。' `
    -Method 'GET' `
    -Path '/quotation-data-box/quotation-drafts/{draftId}' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('draftId', 'path', 'int64', '✓', '見積登録ドラフトID'),
      @('lineScope', 'query', 'string', '-', '`ALL` / `INDIVIDUAL_MANAGED`。未指定は `ALL`')
    ) `
    -PermissionLines $purchasePermissionLines `
    -ProcessingLines @(
      '`lineScope=INDIVIDUAL_MANAGED` の場合は、明細区分が親明細または子明細の行だけを返す。',
      'レスポンスには全明細件数、個体管理対象件数、紐付け済み件数を含める。',
      '戻り先はドラフトに保持された `returnTo` を返し、購入管理固定戻り先を採用しない。'
    ) `
    -ResponseRows $quotationDraftRows `
    -ResponseSubtables @(
      @{ Title = 'QuotationDraftItem'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $quotationItemRows }
    )

  New-EndpointBlock `
    -Title 'OCR確認結果保存' `
    -Overview 'OCR確認画面で修正した見積基本情報と見積明細を保存する。外部OCR実行は対象外とする。' `
    -Method 'PATCH' `
    -Path '/quotation-data-box/quotation-drafts/{draftId}/ocr-confirmation' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('draftId', 'path', 'int64', '✓', '見積登録ドラフトID')
    ) `
    -RequestRows @(
      @('basicInfo', 'QuotationBasicInfo', '✓', '見積日付、納期、見積有効期限、合計金額など'),
      @('items', 'OcrConfirmedItem[]', '✓', '確認済み明細'),
      @('expectedUpdatedAt', 'datetime', '-', '競合検知用')
    ) `
    -PermissionLines $purchasePermissionLines `
    -ProcessingLines @(
      '保存対象は画面で確認・修正された結果に限定する。',
      '明細は見積書上の行番号、原文品目/メーカー/型式/数量、仕様行、価格、行削除/除外結果を保持する。',
      '除外行は `quotation_items.deleted_at` を設定して論理削除扱いとし、確定時の登録対象から除外する。'
    ) `
    -ResponseRows @(
      @('draftId', 'int64', '✓', 'ドラフトID'),
      @('updatedAt', 'datetime', '✓', '更新日時'),
      @('nextStep', 'string', '✓', '次工程コード')
    )

  New-EndpointBlock `
    -Title '明細区分登録保存' `
    -Overview '明細区分登録画面でカテゴリ、明細区分、登録/未登録、除外行を保存する。' `
    -Method 'PATCH' `
    -Path '/quotation-data-box/quotation-drafts/{draftId}/line-categories' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('draftId', 'path', 'int64', '✓', '見積登録ドラフトID')
    ) `
    -RequestRows @(
      @('items', 'LineCategoryInput[]', '✓', '明細区分登録結果'),
      @('allowIncomplete', 'boolean', '-', '未登録行が残る場合でもドラフト保存するか'),
      @('expectedUpdatedAt', 'datetime', '-', '競合検知用')
    ) `
    -PermissionLines $purchasePermissionLines `
    -ProcessingLines @(
      'カテゴリ候補は会計区分 `01` から `17` の固定候補とする。',
      '明細区分は `明細代表` / `内訳代表` / `親明細` / `子明細` / `孫明細` / `その他` / `値引き` とする。',
      '行単位の登録は明細区分が選択済みの場合のみ許可する。',
      '未登録行が残る場合でも、利用者が確認して続行した場合はドラフト状態として保持できる。'
    ) `
    -ResponseRows @(
      @('draftId', 'int64', '✓', 'ドラフトID'),
      @('registeredCount', 'int32', '✓', '登録済み行数'),
      @('unregisteredCount', 'int32', '✓', '未登録行数'),
      @('updatedAt', 'datetime', '✓', '更新日時')
    )

  New-EndpointBlock `
    -Title '資産マスタ照合結果保存' `
    -Overview 'AI候補採用または資産マスタ手動選択の結果を保存する。AI推論サービス自体は対象外とする。' `
    -Method 'PATCH' `
    -Path '/quotation-data-box/quotation-drafts/{draftId}/asset-master-matches' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('draftId', 'path', 'int64', '✓', '見積登録ドラフトID')
    ) `
    -RequestRows @(
      @('items', 'AssetMasterMatchInput[]', '✓', '採用結果'),
      @('expectedUpdatedAt', 'datetime', '-', '競合検知用')
    ) `
    -PermissionLines $purchasePermissionLines `
    -ProcessingLines @(
      'AI候補は明細区分が `明細代表` または `親明細` の行に限定する。',
      '`子明細` は個体管理表示対象だがAI候補の自動提示対象外とする。',
      'その他/値引きは推薦対象外とする。',
      '資産マスタ手動選択時の反映範囲は `all`、`toMaker`、`toItem` を保存する。'
    ) `
    -ResponseRows @(
      @('draftId', 'int64', '✓', 'ドラフトID'),
      @('matchedCount', 'int32', '✓', '紐付け済み件数'),
      @('unmatchedCount', 'int32', '✓', '未紐付け件数'),
      @('updatedAt', 'datetime', '✓', '更新日時')
    )

  New-EndpointBlock `
    -Title '個体登録・金額按分保存' `
    -Overview '親子明細、個体単位数量、税区分、按分金額、見積明細との紐づけを保存する。' `
    -Method 'PATCH' `
    -Path '/quotation-data-box/quotation-drafts/{draftId}/price-allocations' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('draftId', 'path', 'int64', '✓', '見積登録ドラフトID')
    ) `
    -RequestRows @(
      @('items', 'PriceAllocationInput[]', '✓', '按分結果'),
      @('expectedUpdatedAt', 'datetime', '-', '競合検知用')
    ) `
    -PermissionLines $purchasePermissionLines `
    -ProcessingLines @(
      '単位候補は `台` / `個` / `本` / `枚` / `組` / `セット` / `式` とする。',
      '按分区分は `対象` または `-`、税区分は `課税` または `非課税` とする。',
      '親明細は数量分だけ個体行へ展開し、`seqId` と `parentSeqId` で親子関係を保持する。',
      '差額按分がある場合は指定行へ差額を寄せ、合計金額と明細金額の整合を検証する。'
    ) `
    -ResponseRows @(
      @('draftId', 'int64', '✓', 'ドラフトID'),
      @('allocatedCount', 'int32', '✓', '按分済み件数'),
      @('totalAmount', 'decimal', '✓', '按分後合計金額'),
      @('updatedAt', 'datetime', '✓', '更新日時')
    )

  New-EndpointBlock `
    -Title '見積登録確定' `
    -Overview 'リモデル見積登録または発注見積登録を確定し、見積ヘッダー、見積明細、紐づけを作成/更新する。' `
    -Method 'POST' `
    -Path '/quotation-data-box/quotation-drafts/{draftId}/confirm' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('draftId', 'path', 'int64', '✓', '見積登録ドラフトID')
    ) `
    -RequestRows @(
      @('confirmedByUserId', 'int64', '-', '未指定時はログインユーザー'),
      @('expectedUpdatedAt', 'datetime', '-', '競合検知用')
    ) `
    -PermissionLines $purchasePermissionLines `
    -ProcessingLines @(
      '受領見積番号は施設番号、年月、連番でサーバー採番する。',
      '確定時は対象見積ヘッダーを `quotations.status=''REGISTERED''` に更新し、以後は登録済み見積として扱う。',
      '有効見積ヘッダー確定後、`rfqs.quotation_type` / `rfqs.quotation_phase` と一覧用スナップショットを同期する。',
      '見積フェーズが `ORDER_REGISTRATION` の場合はRFQステータスを `発注見積登録済` へ進め、`nextRoute` に発注登録画面を返す。',
      'それ以外の見積フェーズはRFQステータスを `見積DB登録済` へ進め、リモデル管理一覧へ戻す。',
      'Phase1では業者依頼送信をシステム上で管理しないため、`rfqs.status=''見積依頼''` から `見積DB登録済` または `発注見積登録済` へ直接遷移できる。',
      '確定対象見積が `rfq_vendor_id` を保持する場合は、対象 `rfq_vendors.request_status` を取得済み見積として `REPLIED` に更新できる。ただし `SENT`、`requested_at`、`requested_by_user_id` は更新しない。',
      '見積明細には行番号、原文品目/メーカー/型式/数量、AI判定数量、枝番、確定品目/メーカー/型式、価格、`seqId`、`parentSeqId`、仕様行情報を保持する。'
    ) `
    -ResponseRows @(
      @('quotationId', 'int64', '✓', '確定した見積ID'),
      @('quotationNo', 'string', '✓', '受領見積番号'),
      @('rfqGroupId', 'int64', '✓', '対象RFQグループID'),
      @('rfqStatus', 'string', '✓', '`見積DB登録済` または `発注見積登録済`'),
      @('nextRoute', 'string', '✓', '次画面または戻り先')
    )

  New-EndpointBlock `
    -Title '発注登録' `
    -Overview '発注登録画面の入力内容から発注ヘッダーと発注明細を作成し、RFQを発注済へ進める。' `
    -Method 'POST' `
    -Path '/quotation-data-box/order-registration/orders' `
    -Auth 'Bearer' `
    -RequestRows @(
      @('rfqGroupId', 'int64', '✓', '対象RFQグループID'),
      @('quotationId', 'int64', '✓', '採用する発注登録用見積ID'),
      @('settlementNo', 'string', '-', '院内決済No.'),
      @('orderType', 'string', '✓', '`購入` / `割賦` / `リース（オペレーティング）` / `リース（ファイナンス）`'),
      @('orderOn', 'date', '✓', '発注日'),
      @('deliveryDueOn', 'date', '✓', '納品予定日'),
      @('paymentTerms', 'string', '✓', '支払条件。締日、支払日、日サイト等'),
      @('paymentMethod', 'string', '-', '`でんさい` / `銀行振込` / `クレジット` / `現金`。`orders.payment_method` に保存'),
      @('leaseStartOn', 'date', '-', 'リース系選択時のみ'),
      @('leaseEndOn', 'date', '-', 'リース系選択時のみ'),
      @('comment', 'string', '-', 'コメント'),
      @('inspectionCertType', 'string', '-', '未指定時 `本体のみ`'),
      @('storageFormat', 'string', '-', '未指定時 `未指定`'),
      @('items', 'OrderItemInput[]', '✓', '発注明細')
    ) `
    -PermissionLines $orderPermissionLines `
    -ProcessingLines @(
      '対象RFQは `発注見積登録済` のみ許可する。',
      '採用対象の見積は同一RFQに属し、`quotation_phase=''ORDER_REGISTRATION''` かつ `quotations.status=''REGISTERED''` であることを検証する。',
      '発注番号は `PO-yyyyMMdd-nnnn` 形式でサーバー採番する。',
      '`payment_terms` は支払条件、`payment_method` は支払手段として分離して保存する。',
      '発注明細は見積明細ID、登録区分、品目、メーカー、型式、数量、単価、金額を保持する。',
      '個体管理対象は数量分の発注明細または個体候補へ展開する。',
      '登録完了後の印刷はレスポンスの `printContext` を使ったプレビュー/ブラウザ印刷で扱い、No.24では発注メール送信APIを新設しない。',
      '登録成功時は採用した見積を `quotations.status=''ORDER_SELECTED''` に更新する。',
      '登録成功時はRFQステータスを `発注済` へ進める。'
    ) `
    -ResponseRows @(
      @('orderId', 'int64', '✓', '作成した発注ID'),
      @('orderNo', 'string', '✓', '発注番号'),
      @('rfqGroupId', 'int64', '✓', '対象RFQグループID'),
      @('rfqStatus', 'string', '✓', '`発注済`'),
      @('printContext', 'object', '-', '登録後印刷に必要なキー')
    )

  New-EndpointBlock `
    -Title '納品検収予定日登録' `
    -Overview '納品検収予定日、明細別納品日、検収書種別を登録し、RFQを納期確定へ進める。' `
    -Method 'POST' `
    -Path '/quotation-data-box/inspection-registration/records' `
    -Auth 'Bearer' `
    -RequestRows @(
      @('rfqGroupId', 'int64', '✓', '対象RFQグループID'),
      @('orderId', 'int64', '✓', '対象発注ID'),
      @('inspectionOn', 'date', '✓', '納品検収予定日'),
      @('inspectionCertType', 'string', '✓', '`本体のみ` / `付属品含む`'),
      @('items', 'OrderItemDeliveryInput[]', '-', '明細別納品日'),
      @('expectedUpdatedAt', 'datetime', '-', '競合検知用')
    ) `
    -PermissionLines $acceptancePermissionLines `
    -ProcessingLines @(
      '対象RFQは `発注済` のみ許可する。',
      '納品検収予定日は必須とし、未入力の場合は登録を拒否する。',
      '`orders.inspection_on` / `inspection_cert_type` と必要な明細納品日を更新する。',
      '登録完了後の検収書Excel出力とQRラベル発行は後続アクションとして実行可否と出力キーを返す。',
      '登録成功時はRFQステータスを `納期確定` へ進める。'
    ) `
    -ResponseRows @(
      @('rfqGroupId', 'int64', '✓', '対象RFQグループID'),
      @('orderId', 'int64', '✓', '対象発注ID'),
      @('rfqStatus', 'string', '✓', '`納期確定`'),
      @('canExportInspectionSheet', 'boolean', '✓', '検収書Excel出力可否'),
      @('canIssueQrLabels', 'boolean', '✓', 'QRラベル発行可否')
    )

  New-EndpointBlock `
    -Title '検収登録コンテキスト取得' `
    -Overview '資産仮登録/検収登録画面の対象発注明細、既存登録状況、初期候補、戻り先を取得する。' `
    -Method 'GET' `
    -Path '/quotation-data-box/asset-provisional-registration/context' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('rfqGroupId', 'query', 'int64', '✓', '対象RFQグループID'),
      @('mode', 'query', 'string', '-', '`mobile` / `pc`。未指定時は `mobile`')
    ) `
    -PermissionLines $acceptancePermissionLines `
    -ProcessingLines @(
      '対象RFQは `納期確定` のみ許可する。',
      '発注明細の品目名または型式と資産マスタの品目または型式を照合し、分類初期候補を返す。',
      '設置場所初期値は同一RFQ申請資産の資産名または型式と発注明細の品目名または型式を照合して決定する。',
      '付属品行は同一 `quotationItemId` の本体行に一致する申請資産から継承する。',
      '一致しない場合は同一RFQ申請の先頭資産をフォールバック候補とする。'
    ) `
    -ResponseRows @(
      @('context', 'RfqContext', '✓', '管理区分、戻り先、入力モード'),
      @('order', 'OrderSummary', '✓', '対象発注'),
      @('items', 'OrderItemForInspection[]', '✓', '発注明細と登録状況'),
      @('classificationCandidates', 'object', '✓', '分類初期候補'),
      @('locationCandidates', 'object', '✓', '設置場所初期候補')
    ) `
    -ResponseSubtables @(
      @{ Title = 'OrderItemForInspection'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $orderItemRows }
    )

  New-EndpointBlock `
    -Title '検収登録明細保存' `
    -Overview '検収登録の明細単位入力を保存する。モバイル1品目登録とPC一覧編集の双方で利用する。' `
    -Method 'PATCH' `
    -Path '/quotation-data-box/asset-provisional-registration/items/{orderItemId}' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('orderItemId', 'path', 'int64', '✓', '対象発注明細ID')
    ) `
    -RequestTitle 'リクエストボディ（multipart/form-data）' `
    -RequestRows @(
      @('payload.rfqGroupId', 'int64', '✓', '対象RFQグループID'),
      @('payload.serialNo', 'string', '-', 'シリアル番号'),
      @('payload.qrCodeValue', 'string', '-', 'QRコード'),
      @('payload.photoDocumentIds', 'int64[]', '-', '既存写真ファイルID。以前保存済みのRFQ工程写真を継続利用する場合に指定する'),
      @('payload.photoDocuments', 'DocumentInput[]', '-', '新規写真メタデータ。各要素の `filePartName` で対応するファイルパートを指定する'),
      @('files', 'binary[]', '-', '`payload.photoDocuments[].filePartName` で参照される写真ファイル本体'),
      @('payload.labelAttached', 'boolean', '-', 'ラベル貼付有無'),
      @('payload.buildingName', 'string', '-', '棟'),
      @('payload.floorName', 'string', '-', '階'),
      @('payload.departmentName', 'string', '-', '部門'),
      @('payload.sectionName', 'string', '-', '部署'),
      @('payload.roomName', 'string', '-', '室名'),
      @('payload.dimensionText', 'string', '-', '寸法'),
      @('payload.remarks', 'string', '-', '備考'),
      @('payload.shipAssetMasterId', 'int64', '-', 'SHIP分類')
    ) `
    -RequestSubtables @(
      @{ Title = 'photoDocuments要素（DocumentInput）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentInputRows }
    ) `
    -PermissionLines $acceptancePermissionLines `
    -ProcessingLines @(
      '対象発注明細が指定RFQの発注に属することを検証する。',
      '`payload.photoDocuments[].filePartName` が multipart の写真ファイルパートに存在することを確認し、拡張子・MIME Type は画像として許可された形式に限定する。',
      '新規写真ファイル本体をAPI内でAmazon S3へPutObjectし、S3オブジェクトキーは `application-documents/facility-{facilityId}/{yyyy}/{mm}/{uploadUuid}.{ext}` 形式で発行する。keyは保存場所識別子であり、`rfqGroupId` や `orderItemId` などの業務IDを含めない。',
      '検収登録中の写真は資産登録前の工程ドキュメントとして `application_documents` に `owner_type=''RFQ''`、`rfq_id`、`step_code=''ACCEPTANCE''`、`document_category=''PHOTO''`、`document_type`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`taken_at`、`is_primary`、`uploaded_by_user_id`、`uploaded_at` を保存する。S3バケット名やHTTPS URLはDBへ保存しない。',
      '`payload.photoDocumentIds` は同一RFQの未削除 `application_documents(owner_type=''RFQ'', document_category=''PHOTO'')` であり、`application_document_order_item_links(relation_type=''ACCEPTANCE_PHOTO'', order_item_id=対象発注明細ID, deleted_at IS NULL)` に有効リンクがあるIDのみ受け付ける。',
      '保存対象の発注明細IDと写真ドキュメントIDの対応は `application_document_order_item_links` に `relation_type=''ACCEPTANCE_PHOTO''` として保存し、レスポンスやコンテキストの `photoDocumentIds` は同リンクから解決する。S3オブジェクトキーの接頭辞から `orderItemId` を再解決しない。',
      'Amazon S3保存後にDBメタデータ保存または明細保存へ失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄する。破棄に失敗した場合は 502 (`REMODEL_FILE_502_S3_WRITE_FAILED`) を返却し、再試行可能な運用ログを残す。',
      '明細単位の保存ではRFQステータスを変更しない。'
    ) `
    -ResponseRows @(
      @('orderItemId', 'int64', '✓', '対象発注明細ID'),
      @('photoDocumentIds', 'int64[]', '-', '保存後に当該発注明細へ紐付く検収写真ドキュメントID'),
      @('saved', 'boolean', '✓', '保存結果'),
      @('updatedAt', 'datetime', '✓', '更新日時')
    ) `
    -StatusRows @(
      @('200', '保存成功', 'AssetProvisionalItemSaveResponse'),
      @('400', '入力値不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '権限なし', 'ErrorResponse'),
      @('404', '対象発注明細またはRFQなし', 'ErrorResponse'),
      @('409', '状態不整合または競合更新', 'ErrorResponse'),
      @('502', 'Amazon S3 への検収写真保存またはロールバック削除に失敗した', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '検収登録完了' `
    -Overview '全対象明細の検収登録完了を確定し、個体中間データを作成/更新してRFQを検収済へ進める。' `
    -Method 'POST' `
    -Path '/quotation-data-box/asset-provisional-registration/complete' `
    -Auth 'Bearer' `
    -RequestRows @(
      @('rfqGroupId', 'int64', '✓', '対象RFQグループID'),
      @('orderId', 'int64', '✓', '対象発注ID'),
      @('expectedUpdatedAt', 'datetime', '-', '競合検知用')
    ) `
    -PermissionLines $acceptancePermissionLines `
    -ProcessingLines @(
      '対象RFQは `納期確定` のみ許可する。',
      '未登録明細が残る場合は拒否する。',
      '発注明細ID、RFQ ID、QRコード、シリアル番号、品目/メーカー/型式、取得金額、取得日、設置場所、分類、仮勘定情報を持つ `individuals` を作成/更新する。',
      'レスポンスの `IndividualSummary.photoDocumentIds` には、当該発注明細に対応する同一RFQの未削除 `application_documents(owner_type=''RFQ'', document_category=''PHOTO'')` のIDのみを返し、原本資産登録時に別発注明細の写真を誤って複製しない。',
      '登録成功時はRFQステータスを `検収済` へ進める。'
    ) `
    -ResponseRows @(
      @('rfqGroupId', 'int64', '✓', '対象RFQグループID'),
      @('rfqStatus', 'string', '✓', '`検収済`'),
      @('individuals', 'IndividualSummary[]', '✓', '作成/更新した個体')
    ) `
    -ResponseSubtables @(
      @{ Title = 'IndividualSummary'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $individualRows }
    )

  New-EndpointBlock `
    -Title '原本登録コンテキスト取得' `
    -Overview '原本登録対象の検収済個体、発注/見積情報、固定資産番号入力状況、会計区分、勘定科目を取得する。' `
    -Method 'GET' `
    -Path '/quotation-data-box/asset-registration/context' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('rfqGroupId', 'query', 'int64', '✓', '対象RFQグループID')
    ) `
    -PermissionLines $acceptancePermissionLines `
    -ProcessingLines @(
      '対象RFQは `検収済` のみ許可する。',
      '`individuals.registration_status=''INSPECTED''` の個体を原本登録対象として返す。',
      '`IndividualSummary.photoDocumentIds` は同一RFQの未削除RFQ写真のうち `application_document_order_item_links(relation_type=''ACCEPTANCE_PHOTO'', order_item_id=対象発注明細ID, deleted_at IS NULL)` に紐づくドキュメントIDを設定する。',
      '会計区分と勘定科目は固定候補をコード表として返す。'
    ) `
    -ResponseRows @(
      @('context', 'RfqContext', '✓', '管理区分、戻り先'),
      @('order', 'OrderSummary', '✓', '発注情報'),
      @('individuals', 'IndividualSummary[]', '✓', '原本登録対象個体'),
      @('accountCategories', 'CodeLabel[]', '✓', '会計区分候補'),
      @('accountTitles', 'CodeLabel[]', '✓', '勘定科目候補'),
      @('canRegister', 'boolean', '✓', '登録可能か')
    )

  New-EndpointBlock `
    -Title '原本資産登録' `
    -Overview '固定資産番号、会計区分、勘定科目、取得価額、設置場所、個体情報を原本へ反映し、RFQを完了へ進める。' `
    -Method 'POST' `
    -Path '/quotation-data-box/asset-registration/register-bulk' `
    -Auth 'Bearer' `
    -RequestRows @(
      @('rfqGroupId', 'int64', '✓', '対象RFQグループID'),
      @('individuals', 'AssetRegistrationInput[]', '✓', '原本登録対象個体'),
      @('expectedUpdatedAt', 'datetime', '-', '競合検知用')
    ) `
    -PermissionLines $acceptancePermissionLines `
    -ProcessingLines @(
      '対象RFQは `検収済` のみ許可する。',
      '`individuals` を原本資産へ反映し、`asset_ledgers` を作成または更新する。',
      '対象個体、発注明細、見積明細、編集リスト明細の紐づけを保持する。',
      'リクエストの `individuals[].photoDocumentIds` で指定された `application_documents.owner_type=''RFQ''`、`document_category=''PHOTO''` の写真だけを、当該個体から作成/更新した原本資産へ反映する。各IDは同一RFQかつ当該個体の `orderItemId` に対応する `application_document_order_item_links(relation_type=''ACCEPTANCE_PHOTO'')` を持つことを検証する。',
      '検収写真はS3オブジェクト自体を再アップロードせず、作成/更新した原本資産の `application_documents.owner_type=''ASSET_LEDGER''`、`asset_ledger_id`、`document_category=''PHOTO''`、`document_type`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`taken_at`、`is_primary`、`uploaded_by_user_id`、`uploaded_at` としてメタデータを複製する。',
      '登録成功時はRFQステータスを `完了` へ進める。',
      'リモデル管理では、RFQ単位の原本登録完了後も編集リスト全体の原本反映確定はリモデルクローズで行う。'
    ) `
    -ResponseRows @(
      @('rfqGroupId', 'int64', '✓', '対象RFQグループID'),
      @('rfqStatus', 'string', '✓', '`完了`'),
      @('createdAssetLedgerIds', 'int64[]', '✓', '作成/更新した原本資産ID'),
      @('returnTo', 'string', '✓', '`/quotation-data-box/remodel-management`')
    )

  New-EndpointBlock `
    -Title 'リモデルクローズ' `
    -Overview '編集リスト単位でリモデル完了を確定し、編集リスト、編集明細、個別部署マスタ、原本資産、履歴を同一トランザクションで更新する。' `
    -Method 'POST' `
    -Path '/quotation-data-box/remodel-management/edit-lists/{editListId}/close' `
    -Auth 'Bearer' `
    -ParametersRows @(
      @('editListId', 'path', 'int64', '✓', '対象リモデル編集リストID')
    ) `
    -RequestRows @(
      @('closeNote', 'string', '-', 'クローズ備考'),
      @('expectedUpdatedAt', 'datetime', '-', '競合検知用')
    ) `
    -PermissionLines $closePermissionLines `
    -ProcessingLines @(
      '対象 `edit_lists` 行をDBロックし、有効な `edit_list_work_locks` が存在しないことを検証する。',
      '全対象明細で方針が決定済みであることを検証する。',
      '廃棄以外の明細に `target_facility_id`、`target_building_name`、`target_floor_name`、`target_department_name`、`target_section_name`、`target_room_name`、`target_installation_location` の必要項目が入力済みであることを検証する。',
      '当該編集リストに紐づく未削除 `rfqs` が全て終端状態であることを検証する。RFQは `完了` または `申請を見送る`、廃棄は `廃棄完了` または `申請を見送る`、移動は `移動完了` または `申請を見送る` を終端とする。',
      '原本登録未完了の対象が残る場合は拒否する。',
      '`facility_location_remodels` に保持した新居情報を読み取り、追加/更新/移動/廃棄方針に応じて `asset_ledgers`、`facility_locations`、`asset_ledger_histories`、`edit_list_items.reflection_status`、`edit_lists.status/closed_at/closed_by_user_id` を同一トランザクションで更新する。',
      '新居情報を現状へ反映した `facility_location_remodels` は `deleted_at` を設定し、有効なリモデル先情報から除外する。',
      '`asset_ledger_histories` 作成時は `change_source_type=''EDIT_LIST_CLOSE''`、`change_source_id=editListId`、`change_type`、変更前後JSON、`changed_by_user_id`、`changed_at` を設定する。',
      '1件でも反映エラーが残る場合は `edit_lists.status=''CLOSED''` へ進めない。'
    ) `
    -ResponseRows @(
      @('editListId', 'int64', '✓', '対象編集リストID'),
      @('status', 'string', '✓', '`CLOSED`'),
      @('closedAt', 'datetime', '✓', 'クローズ日時'),
      @('closedByUserId', 'int64', '✓', '実行者ユーザーID'),
      @('reflectedCount', 'int32', '✓', '原本反映件数'),
      @('skippedCount', 'int32', '✓', '反映不要件数'),
      @('closeBlockers', 'CloseBlocker[]', '✓', '空配列')
    )
)

@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_リモデル管理.docx'
  ScreenLabel = 'リモデル管理'
  CoverDateText = '2026年5月30日'
  RevisionVersionText = '1.0'
  RevisionDateText = '2026/5/30'
  RevisionSummaryText = '初版作成'
  RevisionAuthorText = '-'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、リモデル管理画面および関連する共通後続画面で利用するAPIの設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。' },
    @{ Type = 'Paragraph'; Text = 'リモデル管理は、編集リストから作成されたリモデルRFQ、廃棄ワークフロー、移動ワークフローを進行し、見積依頼、見積登録、発注登録、納品検収日登録、検収登録、原本登録、リモデルクローズまでを扱う。' },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '対象システムは医療機器管理システムである。本機能はリモデル編集リストで方針決定された購入、更新、増設、廃棄、移動対象を、RFQ、見積、発注、検収、原本反映まで進行管理する業務機能として位置づける。' },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', 'URL', '本書で扱う内容'); Rows = @(
      @('リモデル管理', '/quotation-data-box/remodel-management', 'リモデルRFQ/廃棄/移動ワークフロー一覧、フィルター、ステータス別操作'),
      @('リモデルダッシュボード', '/quotation-data-box/remodel-dashboard', '編集リスト単位の進捗、クローズ可否、クローズ不可理由'),
      @('RFQプロセス', '/quotation-data-box/rfq-process', '見積登録先業者保存、未確定業者行削除、取得済み見積書アップロード、見積登録ドラフト作成'),
      @('見積登録共通画面群', '/quotation-data-box/ocr-confirm ほか', '見積ドラフト、明細区分、資産マスタ照合、個体登録/金額按分、登録確認'),
      @('発注登録', '/quotation-data-box/order-registration', '発注ヘッダー、発注明細、支払条件、支払方法'),
      @('納品検収日登録', '/quotation-data-box/inspection-registration', '納品検収予定日、明細別納品日、検収書種別'),
      @('検収登録', '/quotation-data-box/asset-provisional-registration', 'モバイル/PC入力による検収登録、個体中間データ作成'),
      @('原本資産登録', '/quotation-data-box/asset-registration', '固定資産番号、会計区分、勘定科目、原本反映')
    ) },
    @{ Type = 'Heading2'; Text = '責務境界' },
    @{ Type = 'Bullets'; Items = @(
      '編集リスト本体操作、Data Link、見積DB Link、フリーカラム、行順変更、行削除、編集リスト画面で行選択して実行するRFQ作成は「編集リスト」API設計書を正本とする',
      '購入管理タブの申請受付一覧から行う購入申請取り込み、および通常購入RFQの一覧・後続進行は「購入管理」API設計書を正本とする',
      '本書では `rfqs.management_type=''REMODEL''` のRFQ/廃棄/移動ワークフローを対象とし、通常購入RFQとは混在させない',
      'Phase1では個別依頼送信API、`send-bulk`、RFQプロセスの業者向け `SHIPへ一括依頼` は定義しない。業者への見積依頼はシステム外で実施し、Phase2でOutlook連携を扱う場合もメール送信完了は管理しない',
      'SHIP代理作業依頼は、見積書アップロード後のOCR〜見積DB登録代理依頼としてPhase2で再整理する。業者への見積依頼送信や `rfq_vendors.request_status=''SENT''` 更新とは別責務とする',
      'OCR実行サービス、Excel取込API、AI推論サービス自体は対象外とし、画面で確認・採用された結果の保存を扱う',
      '廃棄/移動は画面の承認、却下、完了操作に対応する単純な状態遷移として扱う'
    ) },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('リモデル編集リスト', '`edit_lists.list_type=''REMODEL''` の編集リスト。リモデル対象資産、購入/更新/増設/廃棄/移動方針、新設置場所を保持する'),
      @('リモデルRFQ', '`rfqs.management_type=''REMODEL''` かつ `workflow_type=''RFQ''` の見積依頼グループ'),
      @('廃棄ワークフロー', '`rfqs.management_type=''REMODEL''` かつ `workflow_type=''DISPOSAL''` の廃棄承認・完了管理'),
      @('移動ワークフロー', '`rfqs.management_type=''REMODEL''` かつ `workflow_type=''TRANSFER''` の移動承認・完了管理'),
      @('リモデルクローズ', '編集リスト単位で全ワークフロー終端、原本登録、新設置場所入力を確認し、新居情報と原本資産へ反映する確定処理')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'APIの位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、編集リストAPIで作成された `rfqs.management_type=''REMODEL''` のRFQ、廃棄ワークフロー、移動ワークフローを後続工程へ進めるための親API設計である。編集リスト本体の行編集やRFQ作成はNo.23、通常購入RFQの一覧・後続進行はNo.25を正本とし、本書はリモデル管理タブから呼び出される一覧、ダッシュボード、共通後続画面連携、リモデルクローズを扱う。' },
    @{ Type = 'Heading2'; Text = '画面とAPIの関係' },
    @{ Type = 'Table'; Headers = @('画面操作', 'API', '補足'); Rows = @(
      @('リモデル管理初期表示', '`GET /quotation-data-box/remodel-management/context`', '編集リスト候補、選択肢、権限、戻り先を取得'),
      @('リモデル管理一覧表示・絞り込み', '`GET /quotation-data-box/remodel-management/tasks`', 'RFQ/廃棄/移動ワークフローを同一一覧で取得'),
      @('期限・実績日の編集', '`PATCH /quotation-data-box/remodel-management/rfq-groups/{rfqGroupId}/deadlines`', 'ステータス別の日付項目を更新'),
      @('リモデルダッシュボード表示', '`GET /quotation-data-box/remodel-dashboard`', '編集リスト単位の進捗、クローズ可否、不可理由を取得'),
      @('廃棄/移動の承認・却下・完了', '`POST /quotation-data-box/rfq-groups/{rfqGroupId}/workflow-action`', '画面にある単純な承認、却下、完了操作だけを扱う'),
      @('RFQプロセスの見積登録先業者保存', '`POST /quotation-data-box/rfq-groups/{rfqGroupId}/vendor-requests` ほか', '見積業者行の保存と未確定削除を扱う。個別送信・一括送信はPhase1対象外'),
      @('見積登録共通画面', '`POST /quotation-data-box/rfq-groups/{rfqGroupId}/quotation-drafts` ほか', 'ドラフト作成から見積確定までを扱う'),
      @('発注登録', '`POST /quotation-data-box/order-registration/orders`', '発注ヘッダー、発注明細、支払条件、支払方法を保存'),
      @('納品検収・検収登録・原本登録', '`POST /quotation-data-box/inspection-registration/records` ほか', '納期確定、検収済、完了まで進行'),
      @('リモデルクローズ', '`POST /quotation-data-box/remodel-management/edit-lists/{editListId}/close`', '編集リスト単位で新居情報、原本資産、履歴を同一トランザクションで反映')
    ) },
    @{ Type = 'Heading2'; Text = '業務フロー概要' },
    @{ Type = 'Table'; Headers = @('工程', '起点', '結果', '主な正本テーブル'); Rows = @(
      @('編集リストからRFQ作成', '編集リストAPI', '`management_type=''REMODEL''` / `workflow_type=''RFQ''` のRFQを作成', '`edit_lists` / `edit_list_items` / `rfqs` / `rfq_applications`'),
      @('編集リストから廃棄/移動申請作成', '編集リストAPI', '`workflow_type=''DISPOSAL''` / `TRANSFER` のワークフローを作成', '`rfqs` / `rfq_applications`'),
      @('リモデル管理一覧', 'リモデル管理API', 'RFQ/廃棄/移動を同一一覧で進行管理', '`rfqs` / `rfq_vendors`'),
      @('見積登録', 'RFQプロセス', '見積ドラフト保存、見積確定、ステータス更新', '`quotations` / `quotation_items`'),
      @('発注・検収・原本登録', '共通後続画面', '発注、納期確定、検収済、完了へ進行', '`orders` / `order_items` / `individuals` / `asset_ledgers`'),
      @('リモデルクローズ', 'リモデルダッシュボード', '編集リストCLOSED、新居→現状反映、履歴保存', '`edit_lists` / `edit_list_items` / `facility_location_remodels` / `facility_locations` / `asset_ledger_histories`')
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル名', '利用種別', '用途'); Rows = @(
      @('`users`', 'READ', '共有システム管理者アカウント判定、作成者、送信者、クローズ実行者の表示'),
      @('`facilities`', 'READ', 'Bearer トークン上の作業対象施設、編集リスト対象施設、RFQ対象施設の存在確認・未削除判定'),
      @('`user_facility_assignments`', 'READ', '通常アカウントの作業対象施設割当判定'),
      @('`facility_feature_settings`', 'READ', '通常アカウントの作業対象施設におけるリモデル見積、発注、検収、廃棄・移動機能の提供有無判定'),
      @('`user_facility_feature_settings`', 'READ', '通常アカウントのユーザー×作業対象施設単位のリモデル見積、発注、検収、廃棄・移動機能の利用可否判定'),
      @('`edit_lists`', 'READ / UPDATE', 'リモデル編集リスト候補、クローズ状態、クローズ日時、実行者'),
      @('`edit_list_work_locks`', 'READ', 'リモデルクローズ時の有効作業ロック残存チェック'),
      @('`edit_list_items`', 'READ / UPDATE', 'リモデル対象明細、方針、新設置場所、原本反映ステータス'),
      @('`rfqs`', 'READ / CREATE / UPDATE', 'リモデルRFQ、廃棄、移動ワークフロー、ステータス、期限、承認日、完了日'),
      @('`rfq_status_definitions`', 'READ', 'ワークフロー別ステータス許容値と終端判定'),
      @('`rfq_status_transitions`', 'READ', 'ステータス遷移許可判定'),
      @('`rfq_applications`', 'READ', 'RFQ/廃棄/移動に採用された編集リスト明細・申請明細のリンク'),
      @('`applications`', 'READ', '廃棄/移動ワークフローに紐づく申請情報'),
      @('`application_status_histories`', 'CREATE', '廃棄/移動ワークフローの承認、却下、完了操作履歴。No.24では申請状態ではなくRFQ進行状態の操作履歴として使用'),
      @('`rfq_vendors`', 'READ / CREATE / UPDATE / DELETE', '見積業者行、取得済み見積の業者、提出期限、補足メモ。Phase1では送信完了の正本として `SENT` を更新しない'),
      @('`quotations`', 'READ / CREATE / UPDATE', '見積ヘッダー、見積フェーズ、確定状態、添付参照'),
      @('`quotation_items`', 'READ / CREATE / UPDATE', '見積明細、明細区分、分類、AI採用結果、按分結果'),
      @('`quotation_item_application_links`', 'READ / CREATE / UPDATE', '見積明細と編集リスト明細の対応'),
      @('`orders`', 'READ / CREATE / UPDATE', '発注ヘッダー、支払条件、支払方法、納品検収予定日、検収書種別'),
      @('`order_items`', 'READ / CREATE / UPDATE', '発注明細、納品日、検収登録対象'),
      @('`individuals`', 'READ / CREATE / UPDATE', '検収登録済み個体の中間正本、原本登録状態'),
      @('`asset_ledgers`', 'READ / CREATE / UPDATE', '原本資産登録、リモデルクローズ時の反映先'),
      @('`facility_location_remodels`', 'READ / UPDATE', '個別部署マスタのリモデル先ロケーション情報、クローズ時の反映元。反映後は `deleted_at` を設定'),
      @('`facility_locations`', 'READ / UPDATE', '個別部署マスタの現状情報への反映先'),
      @('`asset_ledger_histories`', 'CREATE', 'リモデルクローズ時の原本反映監査履歴'),
      @('`application_documents`', 'READ / CREATE / UPDATE', '見積書、発注書、検収書、写真などのファイルメタデータ。ファイル実体はAmazon S3に保存し、`file_path` にはS3オブジェクトキーのみを保持する'),
      @('`application_document_order_item_links`', 'READ / CREATE / UPDATE', '検収写真ドキュメントと発注明細の対応。`relation_type=''ACCEPTANCE_PHOTO''` で、S3オブジェクトキーのprefixに依存せず `photoDocumentIds` を検証する'),
      @('`vendors`', 'READ', '見積業者のマスタ参照')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API 共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON（見積登録ドラフト作成・検収登録明細保存のファイル実体を含む multipart/form-data を除く）。ファイル実体はAPI内でAmazon S3へPutObjectし、DBには `application_documents` のメタデータを保存する',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-05-30T10:00:00+09:00`）',
      '日付形式: `YYYY-MM-DD`',
      '認証済みAPIは Bearer トークンを `Authorization` ヘッダーに付与する',
      '一覧APIは cursor 方式のページングを基本とし、`limit` の既定値は50、最大値は200とする',
      '変更系APIは `Idempotency-Key` または `expectedUpdatedAt` を受け付け、二重送信または競合更新を検出する',
      '共通後続画面は `rfqGroupId` だけで遷移しても、APIが `rfqs.management_type` から `managementType` と既定 `returnTo` を解決して返す'
    ) },
    @{ Type = 'Heading2'; Text = '認証・認可' },
    @{ Type = 'Paragraph'; Text = '本API群は、ロール固定ではなく対象施設に対する実効 `feature_code` で認可する。通常アカウントでは、Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）では、作業対象施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず、リモデル見積、リモデル発注、リモデル検収・原本反映、廃棄・移動操作の対象 `feature_code` を有効として扱う。' },
    @{ Type = 'Table'; Headers = @('機能コード', '対象操作', '説明'); Rows = @(
      @('`remodel_purchase`', 'リモデル管理一覧、見積登録先業者保存、未確定業者行削除、見積登録ドラフト、見積確定', 'リモデル見積工程'),
      @('`remodel_order`', '発注登録', 'リモデル発注工程'),
      @('`remodel_acceptance`', '納品検収日登録、検収登録、原本登録、リモデルクローズ', 'リモデル検収・原本反映工程'),
      @('`transfer_disposal`', '廃棄/移動の承認、却下、廃棄完了、移動完了', '廃棄・移動操作')
    ) },
    @{ Type = 'Heading2'; Text = '作業対象施設ベースの認可' },
    @{ Type = 'Bullets'; Items = @(
      '各 API は Bearer トークン上の作業対象施設が存在し、未削除であることを確認する',
      '通常アカウントでは、作業対象施設に対する有効担当施設割当と実効 `feature_code` を都度再判定する',
      '共有システム管理者アカウントでは、作業対象施設が未削除であれば通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による認可判定をバイパスする',
      '`rfqs.management_type=''REMODEL''`、`workflow_type`、対象RFQ・編集リストの未削除、ステータス遷移順序、発注登録用見積確定、検収済み個体不足、リモデルクローズ条件、有効な編集リスト作業ロック不存在といった業務制約は共有システム管理者でもバイパスしない',
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
    @{ Type = 'Heading2'; Text = '共通DTO' },
    @{ Type = 'Paragraph'; Text = '`DocumentInput` は multipart/form-data のファイルパートに対応するメタデータであり、`filePartName` で対象ファイルを指定する。APIはファイル実体をAmazon S3へPutObjectし、生成したS3オブジェクトキーを `application_documents.file_path` に保存する。S3オブジェクトキー、S3バケット名、HTTPS URLはリクエスト/レスポンスで直接扱わない。`storageFormat` はS3保存先ではなく、電子取引/スキャナ保存/未指定などの保存形式を表す列として扱う。' },
    @{ Type = 'Heading3'; Text = 'DocumentInput' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentInputRows },
    @{ Type = 'Heading2'; Text = 'ステータス遷移の前提' },
    @{ Type = 'Table'; Headers = @('ワークフロー', '工程', '開始ステータス', '成功後ステータス', '主API'); Rows = @(
      @('RFQ', '参考系見積確定', '`見積依頼` / `見積DB登録済` など', '`見積DB登録済`', '`POST /quotation-data-box/quotation-drafts/{draftId}/confirm`'),
      @('RFQ', '発注登録用見積確定', '`見積依頼` / `発注用見積依頼済` など', '`発注見積登録済`', '`POST /quotation-data-box/quotation-drafts/{draftId}/confirm`'),
      @('RFQ', '発注登録', '`発注見積登録済`', '`発注済`', '`POST /quotation-data-box/order-registration/orders`'),
      @('RFQ', '納品検収日登録', '`発注済`', '`納期確定`', '`POST /quotation-data-box/inspection-registration/records`'),
      @('RFQ', '検収登録完了', '`納期確定`', '`検収済`', '`POST /quotation-data-box/asset-provisional-registration/complete`'),
      @('RFQ', '原本資産登録', '`検収済`', '`完了`', '`POST /quotation-data-box/asset-registration/register-bulk`'),
      @('DISPOSAL', '廃棄承認', '`廃棄承認待ち`', '`廃棄承認済み`', '`POST /quotation-data-box/rfq-groups/{rfqGroupId}/workflow-action`'),
      @('DISPOSAL', '廃棄却下', '`廃棄承認待ち`', '`申請を見送る`', '`POST /quotation-data-box/rfq-groups/{rfqGroupId}/workflow-action`'),
      @('DISPOSAL', '廃棄完了', '`廃棄承認済み`', '`廃棄完了`', '`POST /quotation-data-box/rfq-groups/{rfqGroupId}/workflow-action`'),
      @('TRANSFER', '移動承認', '`移動承認待ち`', '`移動承認済み`', '`POST /quotation-data-box/rfq-groups/{rfqGroupId}/workflow-action`'),
      @('TRANSFER', '移動却下', '`移動承認待ち`', '`申請を見送る`', '`POST /quotation-data-box/rfq-groups/{rfqGroupId}/workflow-action`'),
      @('TRANSFER', '移動完了', '`移動承認済み`', '`移動完了`', '`POST /quotation-data-box/rfq-groups/{rfqGroupId}/workflow-action`')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API一覧' },
    @{ Type = 'Table'; Headers = @('No', 'API名', 'Method', 'Path', '用途', '主権限'); Rows = @(
      @('24-01', 'リモデル管理コンテキスト取得', 'GET', '/quotation-data-box/remodel-management/context', '初期表示、選択肢、権限', '入口権限いずれか'),
      @('24-02', 'リモデル管理タスク一覧取得', 'GET', '/quotation-data-box/remodel-management/tasks', 'RFQ/廃棄/移動一覧', '入口権限いずれか'),
      @('24-03', 'リモデル管理期限更新', 'PATCH', '/quotation-data-box/remodel-management/rfq-groups/{rfqGroupId}/deadlines', '期限・実績日更新', '入口権限いずれか'),
      @('24-04', 'リモデルダッシュボード取得', 'GET', '/quotation-data-box/remodel-dashboard', '進捗・クローズ可否', '入口権限いずれか'),
      @('24-05', 'RFQグループ詳細取得', 'GET', '/quotation-data-box/rfq-groups/{rfqGroupId}', '共通後続画面文脈取得', '入口権限いずれか'),
      @('24-06', '廃棄・移動ワークフロー操作', 'POST', '/quotation-data-box/rfq-groups/{rfqGroupId}/workflow-action', '承認/却下/完了', 'transfer_disposal'),
      @('24-07', '見積登録先業者保存', 'POST', '/quotation-data-box/rfq-groups/{rfqGroupId}/vendor-requests', '見積業者行の追加・更新。業者依頼送信は行わない', 'remodel_purchase'),
      @('24-08', '見積登録先業者削除', 'DELETE', '/quotation-data-box/rfq-groups/{rfqGroupId}/vendor-requests/{rfqVendorId}', '未確定業者行削除', 'remodel_purchase'),
      @('24-09', '見積登録ドラフト作成', 'POST', '/quotation-data-box/rfq-groups/{rfqGroupId}/quotation-drafts', '見積登録開始', 'remodel_purchase'),
      @('24-10', '見積登録ドラフト取得', 'GET', '/quotation-data-box/quotation-drafts/{draftId}', '共通見積登録画面取得', 'remodel_purchase'),
      @('24-11', 'OCR確認結果保存', 'PATCH', '/quotation-data-box/quotation-drafts/{draftId}/ocr-confirmation', '見積基本情報・明細保存', 'remodel_purchase'),
      @('24-12', '明細区分登録保存', 'PATCH', '/quotation-data-box/quotation-drafts/{draftId}/line-categories', 'カテゴリ・明細区分保存', 'remodel_purchase'),
      @('24-13', '資産マスタ照合結果保存', 'PATCH', '/quotation-data-box/quotation-drafts/{draftId}/asset-master-matches', 'AI採用/手動選択保存', 'remodel_purchase'),
      @('24-14', '個体登録・金額按分保存', 'PATCH', '/quotation-data-box/quotation-drafts/{draftId}/price-allocations', '按分・個体候補保存', 'remodel_purchase'),
      @('24-15', '見積登録確定', 'POST', '/quotation-data-box/quotation-drafts/{draftId}/confirm', '見積確定', 'remodel_purchase'),
      @('24-16', '発注登録', 'POST', '/quotation-data-box/order-registration/orders', '発注作成', 'remodel_order'),
      @('24-17', '納品検収予定日登録', 'POST', '/quotation-data-box/inspection-registration/records', '納期確定', 'remodel_acceptance'),
      @('24-18', '検収登録コンテキスト取得', 'GET', '/quotation-data-box/asset-provisional-registration/context', '検収登録画面取得', 'remodel_acceptance'),
      @('24-19', '検収登録明細保存', 'PATCH', '/quotation-data-box/asset-provisional-registration/items/{orderItemId}', '明細単位保存', 'remodel_acceptance'),
      @('24-20', '検収登録完了', 'POST', '/quotation-data-box/asset-provisional-registration/complete', '検収済へ更新', 'remodel_acceptance'),
      @('24-21', '原本登録コンテキスト取得', 'GET', '/quotation-data-box/asset-registration/context', '原本登録画面取得', 'remodel_acceptance'),
      @('24-22', '原本資産登録', 'POST', '/quotation-data-box/asset-registration/register-bulk', 'RFQ完了', 'remodel_acceptance'),
      @('24-23', 'リモデルクローズ', 'POST', '/quotation-data-box/remodel-management/edit-lists/{editListId}/close', '編集リスト単位のリモデル完了確定', 'remodel_acceptance')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 機能設計' },
    @{ Type = 'EndpointBlocks'; Items = $endpointBlocks },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '編集リストとの連携ルール' },
    @{ Type = 'Bullets'; Items = @(
      '編集リスト上で行を追加・編集しただけではリモデル管理一覧には表示しない。リモデル管理に表示するトリガーは、編集リストAPIでRFQ作成または廃棄/移動申請作成が完了した時点とする',
      'RFQ作成は編集リストAPIで `editListItemIds[]` を受け取り、`edit_lists.list_type=''REMODEL''` から `rfqs.management_type=''REMODEL''` を確定する',
      '廃棄/移動申請作成は編集リストAPIで行い、`rfqs.workflow_type=''DISPOSAL''` または `TRANSFER` として作成する',
      'リモデル管理は作成済みワークフローの進行管理を担当し、編集リスト明細の通常編集、Data Link、見積DB Link、行削除、行順変更は担当しない',
      '編集リスト作業ロックは編集リスト画面への入場と編集リスト更新APIを制御する。RFQ進行は作業ロック中でも実行できるが、リモデルクローズは有効な作業ロックが残っていないことを検証してから実行する'
    ) },
    @{ Type = 'Heading2'; Text = '一覧・フィルタールール' },
    @{ Type = 'Bullets'; Items = @(
      '`editListId` 指定時は当該リモデル編集リストに紐づくワークフローだけを返す',
      '`editListId` 未指定時は作業対象施設で参照可能なリモデル管理対象を横断表示する',
      '`quotation_type` / `quotation_phase` が未指定のRFQは、該当フィルター指定時には除外し、フィルター未指定時のみ表示対象とする',
      '廃棄/移動ワークフローは見積区分/見積フェーズを持たないため、見積区分/見積フェーズ指定時は除外し、フィルター未指定時のみ表示対象とする',
      '期限表示はステータス別にラベルと日付項目を切り替える'
    ) },
    @{ Type = 'Heading2'; Text = 'リモデルクローズルール' },
    @{ Type = 'Bullets'; Items = @(
      'クローズはRFQ単位ではなく `editListId` 単位で実行する',
      '全対象明細でリモデル方針が決定済みであることを必須とする',
      '廃棄方針以外の明細では新設置場所が入力済みであることを必須とする',
      'RFQは `完了` または `申請を見送る`、廃棄は `廃棄完了` または `申請を見送る`、移動は `移動完了` または `申請を見送る` を終端状態とする',
      '原本登録未完了の対象が残る場合はクローズ不可とする',
      '有効な編集リスト作業ロックが残る場合はクローズ不可とする',
      'クローズ時は対象 `edit_lists` 行をロックし、原本資産、個別部署マスタ、履歴、編集リスト状態を同一トランザクションで更新する'
    ) },
    @{ Type = 'Heading2'; Text = '発注・支払情報ルール' },
    @{ Type = 'Bullets'; Items = @(
      '発注形態は `購入`、`割賦`、`リース（オペレーティング）`、`リース（ファイナンス）` を正本候補とする',
      '支払条件は `orders.payment_terms` に保持する',
      '支払方法は `orders.payment_method` に専用列として保持し、`payment_terms` へ統合しない',
      '支払方法の選択肢は `でんさい`、`銀行振込`、`クレジット`、`現金` とする',
      '検収書種別の保存値は `本体のみ` または `付属品含む` とする'
    ) },
    @{ Type = 'Heading2'; Text = 'ファイル保存ルール' },
    @{ Type = 'Bullets'; Items = @(
      '見積原本と検収写真のファイル実体はAPI内でAmazon S3へPutObjectし、`application_documents.file_path` にはS3オブジェクトキーのみを保存する',
      'S3バケット名、HTTPS URL、S3オブジェクトキーはリクエスト/レスポンスで直接扱わない。表示・ダウンロードが必要な場合は、認可済みURLをAPI側で発行して返す',
      '`storageFormat` / `application_documents.storage_format` / `orders.storage_format` は保存先ではなく電子取引/スキャナ保存/未指定などの保存形式を表す列として扱い、S3保存有無の表現には使用しない',
      'S3保存に成功し、DBメタデータ保存または業務トランザクションに失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄してからエラー応答する',
      '検収写真を原本資産へ反映する場合は、S3オブジェクト自体を再アップロードせず、同一S3オブジェクトキーを含む `application_documents` メタデータを `owner_type=''ASSET_LEDGER''` 側へ複製する',
      'DB確定後に文書や写真を削除する後続APIを追加する場合は、`application_documents.deleted_at` の論理削除を正本とし、S3実体は同一S3オブジェクトキーを参照する有効メタデータがなくなったことと保存期間を確認するストレージ削除処理で扱う'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTPステータス', '内容', '発生条件'); Rows = $commonErrorRows },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = 'データ保守方針' },
    @{ Type = 'Bullets'; Items = @(
      'リモデル管理対象は `rfqs.management_type=''REMODEL''` で判定し、通常購入、修理、保守契約とは一覧・進行を分離する',
      '廃棄/移動は `management_type=''REMODEL''` のまま `workflow_type` で区分し、リモデルダッシュボードとクローズ判定から分離しない',
      '見積依頼先、見積、発注、検収、原本登録の各工程はRFQステータス定義・遷移定義に従って更新する',
      '検収登録済み個体の中間正本は `individuals` とし、原本登録時に `asset_ledgers` へ反映する',
      'リモデルクローズ時の原本反映履歴は `asset_ledger_histories` に `change_source_type=''EDIT_LIST_CLOSE''`、`change_source_id=editListId` として保持し、編集リスト明細単位の反映結果は `edit_list_items.reflection_status` に保持する'
    ) },
    @{ Type = 'Heading2'; Text = '拡張時の留意点' },
    @{ Type = 'Bullets'; Items = @(
      '廃棄/移動の状態遷移を拡張する場合は、既存の承認、却下、完了操作とは別に遷移条件と履歴保存方針を再設計する',
      'OCR連携を追加する場合は、OCRジョブ、抽出結果、補正結果、手動入力との差分を別APIとして設計する',
      'メール送信や帳票出力を本実装化する場合は、出力ジョブ、送信ログ、再送条件、ストレージ保存方針を運用設計と合わせて追加する',
      'リモデルクローズ後の再オープンが必要な場合は、管理者操作、監査、原本反映取り消し可否を別途設計する'
    ) }
  )
}
