$editListEntryPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントで `listType=PURCHASE` または対象 `edit_lists.list_type=''PURCHASE''` の場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_edit_list` が有効であること',
  '認可条件: 通常アカウントで `listType=REMODEL` または対象 `edit_lists.list_type=''REMODEL''` の場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `remodel_edit_list` が有効であること'
)

$editListMutationPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること',
  '認可条件: 対象編集リストが `deleted_at IS NULL` であること',
  '認可条件: `edit_lists.status=''CLOSED''` の編集リストは参照専用とし、更新系APIを拒否すること',
  '認可条件: 更新系APIはログインユーザー、`editListId`、`lock_token` が有効な `edit_list_work_locks` と一致すること'
)

$rfqPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` / `normal_purchase` / `remodel_purchase` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること',
  '認可条件: 通常アカウントで `list_type=''PURCHASE''` のRFQ作成では `normal_purchase` も実効有効であること',
  '認可条件: 通常アカウントで `list_type=''REMODEL''` のRFQ作成では `remodel_purchase` も実効有効であること',
  '認可条件: 有効な作業ロック `lock_token` を保持していること'
)

$disposalTransferPermissionLines = @(
  '認可条件: 対象編集リストは `list_type=''REMODEL''` であること',
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `remodel_edit_list` / `transfer_disposal` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、`remodel_edit_list` と `transfer_disposal` の両方が作業対象施設で実効有効であること',
  '認可条件: 有効な作業ロック `lock_token` を保持していること'
)

$columnSettingPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、`screenId=edit_list` の表示カラム設定は、通常編集リストまたはリモデル編集リストのいずれかの入口権限が有効なユーザーだけ参照・更新できること'
)

$commonErrorRows = @(
  @('AUTH_401_UNAUTHORIZED', '401', '認証情報が存在しない、または無効', 'Bearer トークン未指定、期限切れ、署名不正'),
  @('AUTH_403_EDIT_LIST_DENIED', '403', '編集リスト権限がない', '通常アカウントで対象 listType に対応する `normal_edit_list` / `remodel_edit_list` が実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする'),
  @('AUTH_403_PURCHASE_DENIED', '403', 'RFQ作成権限がない', '通常アカウントで通常購入またはリモデル購入の追加権限が実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする'),
  @('AUTH_403_TRANSFER_DISPOSAL_DENIED', '403', '廃棄・移設申請作成権限がない', '通常アカウントで `transfer_disposal` が実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする'),
  @('FACILITY_NOT_FOUND', '404', '作業対象施設を参照できない', 'Bearer トークン上の作業対象施設が存在しない、または削除済み'),
  @('EDIT_LIST_NOT_FOUND', '404', '編集リストを参照できない', 'ID不存在、施設不一致、削除済み、または導線と listType 不一致'),
  @('EDIT_LIST_CLOSED', '409', '編集リストがクローズ済み', '`edit_lists.status=''CLOSED''` の編集リストへ更新系APIを実行した'),
  @('EDIT_LIST_LOCKED', '423', '他ユーザーが作業中', '有効な他ユーザーロックが存在する'),
  @('LOCK_TOKEN_REQUIRED', '400', '作業ロックトークン未指定', '明細取得または更新系APIで `lockToken` が未指定'),
  @('LOCK_TOKEN_INVALID', '409', '作業ロックトークンが不正', 'ユーザー、editListId、lockToken が有効ロックと一致しない'),
  @('LOCK_EXPIRED', '409', '作業ロック期限切れ', '`lock_expires_at <= CURRENT_TIMESTAMP` または解除済み'),
  @('EDIT_LIST_ITEM_NOT_FOUND', '404', '編集リスト明細を参照できない', 'ID不存在、編集リスト不一致、削除済み'),
  @('INVALID_SOURCE_TYPE', '400', '明細ソース種別が不正', '`BASE_ASSET` / `APPLICATION` / `MANUAL` / `QUOTATION` 以外を指定した'),
  @('DATA_LINK_NO_TARGET', '400', 'Data Link対象不足', '対象明細または転記カラムが空配列'),
  @('QUOTATION_LINK_NO_OPERATION', '400', '見積DB Linkの適用対象がない', '紐付け指定と追加指定がどちらも空'),
  @('RFQ_NO_TARGET_ITEMS', '409', 'RFQ作成対象明細がない', '選択明細が全てスキップ対象'),
  @('DUPLICATE_WORKFLOW_LINK', '409', '同一明細の同一ワークフローが作成済み', '未削除RFQの同一 workflow_type が同じ editListItemId に存在する'),
  @('VALIDATION_ERROR', '400', '入力値不正', '必須不足、列挙値不正、文字数超過、件数範囲外'),
  @('CONFLICT', '409', '競合更新', '`expectedUpdatedAt` または `Idempotency-Key` の競合'),
  @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー', '想定外例外')
)

$editListItemCoreRows = @(
  @('editListItemId', 'int64', '✓', '`edit_list_items.edit_list_item_id`。画面上の `asset.no` や `90000 + index` は返さない'),
  @('rowNo', 'int32', '✓', '編集リスト内の表示順'),
  @('sourceType', 'string', '✓', '`BASE_ASSET` / `APPLICATION` / `MANUAL` / `QUOTATION`'),
  @('sourceAssetLedgerId', 'int64', '-', '原本資産コピー元'),
  @('sourceApplicationId', 'int64', '-', '申請由来行の申請ID'),
  @('sourceApplicationAssetId', 'int64', '-', '申請由来行の申請明細ID'),
  @('sourceQuotationItemId', 'int64', '-', '見積DB Link 追加行の見積明細ID'),
  @('shipAssetMasterId', 'int64', '-', '解決済みSHIP資産マスタID'),
  @('remodelDecision', 'string', '✓', '`UNDECIDED` / `NEW` / `REPLACE` / `ADDITION` / `DISPOSAL` / `TRANSFER`'),
  @('categoryName', 'string', '-', 'Category表示値'),
  @('largeClassName', 'string', '-', '大分類表示値'),
  @('mediumClassName', 'string', '-', '中分類表示値'),
  @('itemName', 'string', '-', '品目表示値'),
  @('makerName', 'string', '-', 'メーカー表示値'),
  @('modelName', 'string', '-', '型式表示値'),
  @('quantity', 'int32', '-', '数量'),
  @('unit', 'string', '-', '単位'),
  @('rfqNo', 'string', '-', '現在表示用の見積依頼No.'),
  @('rfqGroupName', 'string', '-', '現在表示用の見積グループ名'),
  @('applicationNo', 'string', '-', '申請No.'),
  @('quotationNo', 'string', '-', '見積番号。RFQグループ名とは別項目'),
  @('fixedValues', 'object', '✓', '`fixedColumns[].columnKey` をキーにした固定58列の値。DB列は `edit_list_items` の作業スナップショットに対応する'),
  @('freeColumnValues', 'object', '-', 'フリーカラム値。`edit_list_free_column_id` または `column_key` をキーにする'),
  @('recordStatus', 'string', '✓', '`ACTIVE` / `DELETED`'),
  @('updatedAt', 'datetime', '✓', '最終更新日時')
)

$lockRequestRows = @(
  @('lockToken', 'string', '✓', '`POST /edit-lists/{editListId}/lock` で取得した作業ロックトークン'),
  @('expectedUpdatedAt', 'datetime', '-', '競合検知用。指定時は対象行または編集リストの更新日時と一致必須')
)

$workFacilityProcessingLine = 'Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。'

function Normalize-TableRows {
  param(
    [object[]]$Rows = @(),
    [int]$ColumnCount
  )

  if ($null -eq $Rows -or $Rows.Count -eq 0) {
    return @()
  }

  $normalized = New-Object System.Collections.Generic.List[object]
  $buffer = New-Object System.Collections.Generic.List[object]

  foreach ($row in $Rows) {
    $isRowArray = ($row -is [System.Array]) -and -not ($row -is [string])

    if ($isRowArray) {
      if ($buffer.Count -gt 0) {
        $normalized.Add(@($buffer.ToArray()))
        $buffer.Clear()
      }
      $normalized.Add(@($row))
      continue
    }

    $buffer.Add($row)
    if ($ColumnCount -gt 0 -and $buffer.Count -eq $ColumnCount) {
      $normalized.Add(@($buffer.ToArray()))
      $buffer.Clear()
    }
  }

  if ($buffer.Count -gt 0) {
    $normalized.Add(@($buffer.ToArray()))
  }

  return ,@($normalized.ToArray())
}

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
    [string[]]$ExtraSectionLines = @(),
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
    StatusRows = Normalize-TableRows -Rows $StatusRows -ColumnCount 3
  }

  if ($ParametersRows.Count -gt 0) {
    $block.ParametersTitle = 'リクエストパラメータ'
    $block.ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    $block.ParametersRows = Normalize-TableRows -Rows $ParametersRows -ColumnCount 5
  }

  if ($RequestRows.Count -gt 0) {
    $block.RequestTitle = 'リクエストボディ'
    $block.RequestHeaders = @('フィールド', '型', '必須', '説明')
    $block.RequestRows = Normalize-TableRows -Rows $RequestRows -ColumnCount 4
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

  if ($ExtraSectionLines.Count -gt 0) {
    $block.ExtraSections = @(@{ Title = '補足仕様'; Lines = $ExtraSectionLines })
  }

  if ($ResponseRows.Count -gt 0) {
    $block.ResponseTitle = 'レスポンス（成功時）'
    $block.ResponseHeaders = @('フィールド', '型', '必須', '説明')
    $block.ResponseRows = Normalize-TableRows -Rows $ResponseRows -ColumnCount 4
  }

  if ($ResponseSubtables.Count -gt 0) {
    $block.ResponseSubtables = $ResponseSubtables
  }

  return $block
}

$endpointBlocks = @(
  New-EndpointBlock `
    -Title '編集リスト一覧取得（/edit-lists）' `
    -Overview '通常編集リストまたはリモデル編集リストの選択モーダルで表示する編集リスト一覧を取得する。' `
    -Method 'GET' `
    -Path '/edit-lists' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('listType', 'query', 'string', '✓', '`PURCHASE` または `REMODEL`。導線と一致必須'),
      @('facilityId', 'query', 'int64', '-', '対象施設ID。省略時は作業対象施設'),
      @('status', 'query', 'string', '-', '`ACTIVE` / `ARCHIVED` / `CLOSED`。省略時は削除済み以外'),
      @('keyword', 'query', 'string', '-', '編集リスト名の部分一致'),
      @('limit', 'query', 'int32', '-', '既定50、最大200'),
      @('cursor', 'query', 'string', '-', '次ページ取得カーソル')
    ) `
    -PermissionLines $editListEntryPermissionLines `
    -ProcessingLines @(
      '`edit_lists.deleted_at IS NULL` かつ `edit_lists.list_type = listType` の編集リストだけを返す。',
      '対象施設は `edit_list_facilities` の施設または `edit_lists.primary_facility_id` で絞り込む。',
      '通常編集リスト導線で `REMODEL`、リモデル導線で `PURCHASE` を取得しない。',
      '`last_accessed_at DESC, edit_list_id DESC` で並び替え、候補モーダル用にリスト名、対象施設、作成者、ステータスを返す。'
    ) `
    -ResponseRows @(
      @('items', 'EditListSummary[]', '✓', '編集リスト候補'),
      @('items[].editListId', 'int64', '✓', '編集リストID'),
      @('items[].listName', 'string', '✓', '編集リスト名'),
      @('items[].listType', 'string', '✓', '`PURCHASE` / `REMODEL`'),
      @('items[].status', 'string', '✓', '`ACTIVE` / `ARCHIVED` / `CLOSED`'),
      @('items[].facilities', 'FacilitySummary[]', '✓', '対象施設'),
      @('items[].createdAt', 'datetime', '✓', '作成日時'),
      @('nextCursor', 'string', '-', '次ページカーソル')
    ) `
    -StatusRows @(
      @('200', '取得成功', 'EditListListResponse'),
      @('400', '検索条件不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '編集リスト権限なし', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '編集リスト新規作成（/edit-lists）' `
    -Overview '通常購入用またはリモデル用の編集リストを作成し、対象施設の原本資産を作業スナップショットとして複製する。' `
    -Method 'POST' `
    -Path '/edit-lists' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('Idempotency-Key', 'header', 'string', '✓', '同一作成操作の冪等キー')
    ) `
    -RequestRows @(
      @('listName', 'string', '✓', '編集リスト名。最大200文字'),
      @('listType', 'string', '✓', '`PURCHASE` または `REMODEL`'),
      @('primaryFacilityId', 'int64', '✓', '主施設ID。作業対象施設と一致または作業対象施設配下'),
      @('facilityIds', 'int64[]', '✓', '対象施設ID配列。1件以上')
    ) `
    -PermissionLines $editListEntryPermissionLines `
    -ProcessingLines @(
      '`edit_lists` を作成し、`list_type` は作成導線で確定する。作成後の種別変更APIは提供しない。',
      '`edit_list_facilities` に主施設と対象施設を登録する。',
      '作成時点で対象施設に紐づく有効な `asset_ledgers` を `edit_list_items.source_type=''BASE_ASSET''` として必ず全件コピーする。',
      'コピー時は分類、設置場所、契約、取得、見積、申請関連の表示値を `edit_list_items` の作業スナップショットとして保持する。',
      '同一原本資産の重複コピーは `(edit_list_id, source_type, source_asset_ledger_id)` で防止する。',
      '作成APIは作業ロックを取得しない。既存リストを開く場合は別途ロック取得APIを呼ぶ。'
    ) `
    -ResponseRows @(
      @('editListId', 'int64', '✓', '作成した編集リストID'),
      @('listName', 'string', '✓', '編集リスト名'),
      @('listType', 'string', '✓', '`PURCHASE` / `REMODEL`'),
      @('status', 'string', '✓', '`ACTIVE`'),
      @('copiedItemCount', 'int32', '✓', '原本コピー明細数'),
      @('createdAt', 'datetime', '✓', '作成日時')
    ) `
    -StatusRows @(
      @('201', '作成成功', 'EditListCreateResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '編集リスト権限なし', 'ErrorResponse'),
      @('409', '冪等キー競合または対象施設不整合', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '編集リスト削除（/edit-lists/{editListId}）' `
    -Overview '編集リストを論理削除する。RFQ、申請、見積、履歴は削除せず参照関係を保持する。' `
    -Method 'DELETE' `
    -Path '/edit-lists/{editListId}' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('editListId', 'path', 'int64', '✓', '削除対象編集リストID')
    ) `
    -RequestRows @(
      @('lockToken', 'string', '-', '有効ロックが存在する場合はロック保持者本人の `lockToken` が必須')
    ) `
    -PermissionLines $editListEntryPermissionLines `
    -ProcessingLines @(
      '`edit_lists.deleted_at` を設定する論理削除とし、`rfqs`、`applications`、`quotations`、履歴は削除しない。',
      'RFQ割当済み、申請作成済み、見積作成済み、クローズ済みであることを理由に削除不可とはしない。',
      '有効な作業ロックが存在する場合は、ロック保持者本人かつ `lockToken` 一致時だけ削除を許可する。',
      '削除済み編集リストは新規選択候補と編集対象から除外する。'
    ) `
    -ResponseRows @(
      @('editListId', 'int64', '✓', '削除した編集リストID'),
      @('deletedAt', 'datetime', '✓', '削除日時')
    ) `
    -StatusRows @(
      @('200', '削除成功', 'EditListDeleteResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '編集リスト権限なし', 'ErrorResponse'),
      @('404', '編集リストなし', 'ErrorResponse'),
      @('409', '他ユーザーが有効ロック保持中', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '作業ロック取得（/edit-lists/{editListId}/lock）' `
    -Overview '既存編集リストを開く時点で編集リスト単位の作業ロックを取得する。他ユーザーが作業中の場合は画面入場を拒否する。' `
    -Method 'POST' `
    -Path '/edit-lists/{editListId}/lock' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('editListId', 'path', 'int64', '✓', 'ロック対象編集リストID')
    ) `
    -RequestRows @(
      @('listType', 'string', '✓', '呼び出し導線のリスト種別。対象編集リストと一致必須')
    ) `
    -PermissionLines $editListEntryPermissionLines `
    -ProcessingLines @(
      '対象編集リストの存在、施設スコープ、導線と `list_type` の一致、削除済みでないことを検証する。',
      '有効ロックは `released_at IS NULL AND lock_expires_at > CURRENT_TIMESTAMP` とする。',
      '有効な他ユーザーロックがある場合は新規ロックを作成せず、作業中ユーザー名、開始時刻、有効期限を返して入場を拒否する。',
      '同一ユーザーが有効ロックを保持している場合は既存ロックを延長し、同じ `lock_token` または再発行した `lock_token` と有効期限を返す。',
      '取得成功時は `edit_list_work_locks` にDB管理のロック行を作成または延長し、有効期限は最終操作から60分とする。',
      'ロック取得または同一ユーザー延長に成功した時点で `edit_lists.last_accessed_at` をサーバー時刻で更新する。'
    ) `
    -ResponseRows @(
      @('editListId', 'int64', '✓', '編集リストID'),
      @('lockToken', 'string', '✓', '更新系APIで必須のロックトークン'),
      @('lockedByUserId', 'int64', '✓', 'ロック保持ユーザーID'),
      @('lockedByUserName', 'string', '✓', 'ロック保持ユーザー名'),
      @('lockedAt', 'datetime', '✓', 'ロック取得日時'),
      @('lockExpiresAt', 'datetime', '✓', 'ロック有効期限')
    ) `
    -StatusRows @(
      @('200', 'ロック取得成功', 'EditListLockResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '編集リスト権限なし', 'ErrorResponse'),
      @('404', '編集リストなし', 'ErrorResponse'),
      @('423', '他ユーザーが作業中', 'EditListLockedErrorResponse')
    )

  New-EndpointBlock `
    -Title '作業ロックheartbeat（/edit-lists/{editListId}/lock/heartbeat）' `
    -Overview '作業中ユーザーの最終操作/heartbeatを更新し、作業ロックの有効期限を延長する。' `
    -Method 'POST' `
    -Path '/edit-lists/{editListId}/lock/heartbeat' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('editListId', 'path', 'int64', '✓', '編集リストID')
    ) `
    -RequestRows @(
      @('lockToken', 'string', '✓', '作業ロックトークン')
    ) `
    -PermissionLines $editListMutationPermissionLines `
    -ProcessingLines @(
      'ログインユーザー、`editListId`、`lockToken` が有効ロックと一致することを検証する。',
      '`last_heartbeat_at` と `lock_expires_at` をサーバー時刻基準で更新し、有効期限を60分後へ延長する。',
      '期限切れ、解除済み、他ユーザー保持、トークン不一致の場合は延長せずエラーを返す。'
    ) `
    -ResponseRows @(
      @('editListId', 'int64', '✓', '編集リストID'),
      @('lockExpiresAt', 'datetime', '✓', '更新後のロック有効期限')
    ) `
    -StatusRows @(
      @('200', '延長成功', 'EditListLockHeartbeatResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('404', '編集リストまたはロックなし', 'ErrorResponse'),
      @('409', 'ロック不一致または期限切れ', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '作業ロック解除（/edit-lists/{editListId}/lock）' `
    -Overview '画面離脱またはログアウト時に作業ロックを通常解除する。強制解除APIは提供しない。' `
    -Method 'DELETE' `
    -Path '/edit-lists/{editListId}/lock' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('editListId', 'path', 'int64', '✓', '編集リストID')
    ) `
    -RequestRows @(
      @('lockToken', 'string', '✓', '作業ロックトークン'),
      @('releaseReason', 'string', '-', '`LEAVE_SCREEN` / `LOGOUT`。省略時 `LEAVE_SCREEN`')
    ) `
    -PermissionLines $editListMutationPermissionLines `
    -ProcessingLines @(
      'ログインユーザー、`editListId`、`lockToken` が有効ロックと一致することを検証する。',
      '`released_at` と `release_reason` を設定する。',
      '他ユーザーのロックを解除する強制解除は提供しない。通信断やブラウザ放置は60分の期限切れで解除扱いとする。'
    ) `
    -ResponseRows @(
      @('editListId', 'int64', '✓', '編集リストID'),
      @('releasedAt', 'datetime', '✓', '解除日時'),
      @('releaseReason', 'string', '✓', '解除理由')
    ) `
    -StatusRows @(
      @('200', '解除成功', 'EditListLockReleaseResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('404', '編集リストまたはロックなし', 'ErrorResponse'),
      @('409', 'ロック不一致または解除済み', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '編集リスト明細取得（/edit-lists/{editListId}/items）' `
    -Overview '編集リスト画面入場後の初期表示データとして、ヘッダー情報、固定列、フリーカラム、明細、RFQ/申請紐づき状態を取得する。' `
    -Method 'GET' `
    -Path '/edit-lists/{editListId}/items' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('editListId', 'path', 'int64', '✓', '編集リストID'),
      @('lockToken', 'query', 'string', '✓', '画面入場時に取得した作業ロックトークン'),
      @('includeDeleted', 'query', 'boolean', '-', '通常 false。監査参照用途のみ true を許可')
    ) `
    -PermissionLines $editListMutationPermissionLines `
    -ProcessingLines @(
      '明細取得は編集リスト画面への入場後に呼び出すAPIであるため、有効な `lockToken` を必須とする。',
      'ヘッダー表示に必要なリスト名、対象施設、作成日、`listType`、`status`、作業ロック検証結果を同一レスポンスで返す。',
      'チェックボックスの選択状態はレスポンスに含めない。RFQ作成、Data Link、見積DB Link、廃棄/移設申請では実行時の `editListItemIds[]` を受け取る。',
      '固定58列の表示値は `edit_list_items` の作業スナップショットを正とし、原本、申請、見積を直接参照して上書きしない。',
      'レスポンスの明細値は固定58列の `fixedValues` と編集リスト内限定の `freeColumnValues` に分けて返す。',
      '検索、ソート、列内フィルター、列順、列幅は画面内一時状態であり本APIの保存対象外とする。'
    ) `
    -ResponseRows @(
      @('editList', 'EditListHeader', '✓', '編集リストヘッダー'),
      @('lock', 'EditListLockState', '✓', '検証済み作業ロック状態'),
      @('fixedColumns', 'ColumnDefinition[]', '✓', '固定列定義'),
      @('freeColumns', 'FreeColumnDefinition[]', '✓', '有効なフリーカラム定義'),
      @('items', 'EditListItem[]', '✓', '編集リスト明細'),
      @('rfqLinks', 'EditListRfqLink[]', '✓', 'RFQ/申請/見積紐づき状態')
    ) `
    -ResponseSubtables @(
      @{ Title = 'items要素（EditListItem）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $editListItemCoreRows }
    ) `
    -StatusRows @(
      @('200', '取得成功', 'EditListItemsResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '編集リスト権限なし', 'ErrorResponse'),
      @('404', '編集リストなし', 'ErrorResponse'),
      @('409', 'ロック不一致または期限切れ', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '編集リスト明細追加（/edit-lists/{editListId}/items）' `
    -Overview '編集リストへ `BASE_ASSET` / `APPLICATION` / `MANUAL` / `QUOTATION` の明細を追加する。インライン新規要望、更新方針、増設方針は本APIの業務ケースとして扱う。' `
    -Method 'POST' `
    -Path '/edit-lists/{editListId}/items' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('Idempotency-Key', 'header', 'string', '✓', '同一追加操作の冪等キー'),
      @('editListId', 'path', 'int64', '✓', '編集リストID')
    ) `
    -RequestRows @(
      @('lockToken', 'string', '✓', '作業ロックトークン'),
      @('addMode', 'string', '✓', '`INLINE_NEW` / `REPLACE` / `ADDITION` / `MANUAL` / `APPLICATION` / `QUOTATION`'),
      @('sourceEditListItemId', 'int64', '-', '更新/増設/見積DB Link追加時のコピー元明細'),
      @('quantity', 'int32', '-', '`ADDITION` の作成件数。1..99'),
      @('items', 'EditListItemCreateInput[]', '-', '追加明細。インライン新規要望では複数行指定可')
    ) `
    -RequestSubtables @(
      @{ Title = 'items要素（EditListItemCreateInput）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
        @('itemName', 'string', '-', '品目名'),
        @('makerName', 'string', '-', 'メーカー名'),
        @('modelName', 'string', '-', '型式'),
        @('quantity', 'int32', '-', '数量。インライン新規要望で未指定時は1'),
        @('unit', 'string', '-', '単位。インライン新規要望で未指定時は台'),
        @('requestItems', 'RequestCandidateInput[]', '-', '要望1〜3。`application_assets` 複数明細へ分解しない'),
        @('desiredDeliveryOn', 'date', '-', '希望納期'),
        @('priority', 'string', '-', '優先順位'),
        @('usagePurpose', 'string', '-', '使用用途'),
        @('commentText', 'string', '-', 'コメント')
      ) }
    ) `
    -PermissionLines $editListMutationPermissionLines `
    -ProcessingLines @(
      '`INLINE_NEW` は `applications` / `purchase_application_details` / `application_assets` を同一トランザクションで作成し、申請番号をサーバー採番する。',
      'インライン新規要望で作成した申請は `applications.status=''編集中''`、`applications.edit_list_id=editListId` とし、購入管理タブの未処理申請受付一覧には出さない。',
      '`application_status_histories` には申請作成から `編集中` 取り込みまでの状態履歴を同一トランザクションで記録する。',
      '`INLINE_NEW` の編集リスト明細は `source_type=''APPLICATION''`、`purchase_application_details.purchase_type=''NEW''` とする。',
      '`REPLACE` は元行の `remodel_decision` を `DISPOSAL` に更新し、`source_type=''MANUAL''` の更新行を元行直下へ作成する。同一トランザクションで扱う。',
      '`ADDITION` は1〜99件の `source_type=''MANUAL''` 行を元行直下へ作成する。',
      '`MANUAL` / `QUOTATION` の生成行はQRコード、固定資産番号、管理機器番号、シリアル番号などの個体識別子を元行・見積明細から引き継がない。',
      '行追加後は同一編集リスト内の `row_no` を必要に応じて再採番する。'
    ) `
    -ResponseRows @(
      @('createdItems', 'EditListItem[]', '✓', '作成した明細'),
      @('updatedItems', 'EditListItem[]', '✓', '`REPLACE` で廃棄予定化した元行など'),
      @('createdApplications', 'ApplicationSummary[]', '✓', 'インライン新規要望で作成した申請')
    ) `
    -StatusRows @(
      @('201', '追加成功', 'EditListItemsCreateResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '編集リスト権限なし', 'ErrorResponse'),
      @('404', '編集リストまたは元明細なし', 'ErrorResponse'),
      @('409', 'ロック不一致、クローズ済み、または冪等キー競合', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title 'セル編集保存（/edit-lists/{editListId}/items/{editListItemId}）' `
    -Overview '編集リスト明細の単一セルまたは小範囲の編集値を保存する。原本資産、申請正本、見積正本は直接更新しない。' `
    -Method 'PATCH' `
    -Path '/edit-lists/{editListId}/items/{editListItemId}' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('editListId', 'path', 'int64', '✓', '編集リストID'),
      @('editListItemId', 'path', 'int64', '✓', '編集リスト明細ID')
    ) `
    -RequestRows ($lockRequestRows + @(
      @('fields', 'object', '✓', '更新対象フィールド。固定列、フリーカラムを含む'),
      @('fields.freeColumnValues', 'object', '-', '`edit_list_free_column_id` または `column_key` をキーにしたフリーカラム値')
    )) `
    -PermissionLines $editListMutationPermissionLines `
    -ProcessingLines @(
      '固定項目は `edit_list_items`、フリーカラムは `edit_list_free_column_values` へ保存する。',
      '品目、メーカー、型式の更新時は `ship_asset_masters` を `品目 + メーカー + 型式`、`品目 + メーカー`、`品目` の順で再解決し、一意に解決できた場合だけ `ship_asset_master_id` を更新する。',
      '候補なしまたは複数候補で一意に決まらない場合は `ship_asset_master_id=NULL` とし、入力された表示値スナップショットを保持する。',
      'リモデル方針の `NEW` / `DISPOSAL` / `TRANSFER` への単純変更は本APIで保存できる。`REPLACE` / `ADDITION` の派生行作成は明細追加APIの業務ケースで扱う。',
      '編集成功時は作業ロックの `last_heartbeat_at` と `lock_expires_at` を更新する。'
    ) `
    -ResponseRows @(
      @('item', 'EditListItem', '✓', '更新後明細'),
      @('lockExpiresAt', 'datetime', '✓', '延長後ロック期限')
    ) `
    -StatusRows @(
      @('200', '更新成功', 'EditListItemUpdateResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '編集リスト権限なし', 'ErrorResponse'),
      @('404', '明細なし', 'ErrorResponse'),
      @('409', 'ロック不一致、期限切れ、または競合更新', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '一括編集保存（/edit-lists/{editListId}/items/bulk）' `
    -Overview '選択した複数明細に対して、同一カラムの値を一括保存する。' `
    -Method 'PATCH' `
    -Path '/edit-lists/{editListId}/items/bulk' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('editListId', 'path', 'int64', '✓', '編集リストID')
    ) `
    -RequestRows ($lockRequestRows + @(
      @('editListItemIds', 'int64[]', '✓', '対象明細ID配列。1件以上'),
      @('fieldKey', 'string', '✓', '更新カラムキー'),
      @('value', 'any', '-', '更新値。空値指定はクリアとして扱う'),
      @('expectedUpdatedAtMap', 'object', '-', '明細IDごとの競合検知用更新日時')
    )) `
    -PermissionLines $editListMutationPermissionLines `
    -ProcessingLines @(
      '対象明細はすべて同一 `editListId` 配下、`deleted_at IS NULL`、クローズ済みでないことを検証する。',
      '固定列またはフリーカラムの保存先をカラムキーから解決する。',
      '対象明細の一部でも権限、ロック、存在、競合、カラム不正に該当する場合は全体をロールバックする。',
      '品目、メーカー、型式の一括更新時も各行ごとに資産マスタ再解決を行う。'
    ) `
    -ResponseRows @(
      @('updatedCount', 'int32', '✓', '更新明細数'),
      @('items', 'EditListItem[]', '✓', '更新後明細'),
      @('lockExpiresAt', 'datetime', '✓', '延長後ロック期限')
    ) `
    -StatusRows @(
      @('200', '更新成功', 'EditListBulkUpdateResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('404', '対象明細なし', 'ErrorResponse'),
      @('409', 'ロック不一致または競合更新', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '行順変更（/edit-lists/{editListId}/items/reorder）' `
    -Overview '画面上のドラッグ操作などで変更した明細表示順を `row_no` として保存する。' `
    -Method 'PATCH' `
    -Path '/edit-lists/{editListId}/items/reorder' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('editListId', 'path', 'int64', '✓', '編集リストID')
    ) `
    -RequestRows ($lockRequestRows + @(
      @('orders', 'RowOrderInput[]', '✓', '明細IDと行番号の配列')
    )) `
    -RequestSubtables @(
      @{ Title = 'orders要素（RowOrderInput）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
        @('editListItemId', 'int64', '✓', '編集リスト明細ID'),
        @('rowNo', 'int32', '✓', '保存後行番号。1始まり')
      ) }
    ) `
    -PermissionLines $editListMutationPermissionLines `
    -ProcessingLines @(
      '対象配列は同一編集リストの有効明細を過不足なく、または移動対象を含む再採番範囲として受け付ける。',
      '`row_no` は同一 `edit_list_id` 内で重複しないように同一トランザクションで更新する。',
      '画面上の仮番号や `sourceType` の区分に依存せず、`edit_list_item_id` と `row_no` を正本とする。'
    ) `
    -ResponseRows @(
      @('updatedCount', 'int32', '✓', '更新件数'),
      @('items', 'EditListItem[]', '✓', '更新後の行順')
    ) `
    -StatusRows @(
      @('200', '更新成功', 'EditListReorderResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('409', 'ロック不一致または行番号競合', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '編集リスト明細削除（/edit-lists/{editListId}/items/{editListItemId}）' `
    -Overview '編集リスト明細を論理削除する。元の原本資産、申請、見積明細、既存RFQの採用履歴は削除しない。' `
    -Method 'DELETE' `
    -Path '/edit-lists/{editListId}/items/{editListItemId}' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('editListId', 'path', 'int64', '✓', '編集リストID'),
      @('editListItemId', 'path', 'int64', '✓', '削除対象明細ID')
    ) `
    -RequestRows $lockRequestRows `
    -PermissionLines $editListMutationPermissionLines `
    -ProcessingLines @(
      '`edit_list_items.deleted_at` と `record_status=''DELETED''` を設定する論理削除とする。',
      '紐づく `edit_list_free_column_values.deleted_at` を同一トランザクションで設定する。',
      'RFQ紐づき済み明細も削除可能とし、既存RFQは `rfq_applications` 経由で削除済み明細を参照できるようにする。',
      '原本 `asset_ledgers`、元申請 `applications` / `application_assets`、元見積 `quotation_items` は削除しない。'
    ) `
    -ResponseRows @(
      @('editListItemId', 'int64', '✓', '削除明細ID'),
      @('deletedAt', 'datetime', '✓', '削除日時')
    ) `
    -StatusRows @(
      @('200', '削除成功', 'EditListItemDeleteResponse'),
      @('404', '明細なし', 'ErrorResponse'),
      @('409', 'ロック不一致または競合更新', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title 'フリーカラム一覧取得（/edit-lists/{editListId}/free-columns）' `
    -Overview '編集リスト固有のフリーカラム定義を取得する。明細取得レスポンスにも含めるが、モーダル単体再取得用に提供する。' `
    -Method 'GET' `
    -Path '/edit-lists/{editListId}/free-columns' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('editListId', 'path', 'int64', '✓', '編集リストID'),
      @('lockToken', 'query', 'string', '✓', '画面入場時の作業ロックトークン')
    ) `
    -PermissionLines $editListMutationPermissionLines `
    -ProcessingLines @(
      '`edit_list_free_columns.deleted_at IS NULL` の列を `created_at ASC` で返す。',
      'フリーカラムは編集リスト内限定の作業列として管理する。'
    ) `
    -ResponseRows @(
      @('items', 'FreeColumnDefinition[]', '✓', 'フリーカラム定義'),
      @('items[].freeColumnId', 'int64', '✓', 'フリーカラムID'),
      @('items[].columnKey', 'string', '✓', 'サーバー生成の不変キー'),
      @('items[].columnName', 'string', '✓', '表示名')
    ) `
    -StatusRows @(
      @('200', '取得成功', 'FreeColumnListResponse'),
      @('409', 'ロック不一致', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title 'フリーカラム追加（/edit-lists/{editListId}/free-columns）' `
    -Overview '編集リスト単位のフリーカラムを追加する。' `
    -Method 'POST' `
    -Path '/edit-lists/{editListId}/free-columns' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('Idempotency-Key', 'header', 'string', '✓', '同一追加操作の冪等キー'),
      @('editListId', 'path', 'int64', '✓', '編集リストID')
    ) `
    -RequestRows ($lockRequestRows + @(
      @('columnName', 'string', '✓', '列名。前後空白除去後に1〜200文字')
    )) `
    -PermissionLines $editListMutationPermissionLines `
    -ProcessingLines @(
      '`columnName` は前後空白を除去し、空文字を拒否する。',
      '`column_key` はサーバー側で生成する不変キーとする。',
      '同一編集リスト内の表示名重複は許容し、識別は `edit_list_free_column_id` / `column_key` で行う。',
      '作成した列は `edit_list_free_columns` に保存し、既存明細の値は未設定として扱う。'
    ) `
    -ResponseRows @(
      @('item', 'FreeColumnDefinition', '✓', '追加したフリーカラム')
    ) `
    -StatusRows @(
      @('201', '追加成功', 'FreeColumnResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('409', 'ロック不一致または冪等キー競合', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title 'フリーカラム名更新（/edit-lists/{editListId}/free-columns/{freeColumnId}）' `
    -Overview 'フリーカラムの表示名を更新する。`column_key` は変更しない。' `
    -Method 'PATCH' `
    -Path '/edit-lists/{editListId}/free-columns/{freeColumnId}' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('editListId', 'path', 'int64', '✓', '編集リストID'),
      @('freeColumnId', 'path', 'int64', '✓', 'フリーカラムID')
    ) `
    -RequestRows ($lockRequestRows + @(
      @('columnName', 'string', '✓', '更新後列名。前後空白除去後に1〜200文字')
    )) `
    -PermissionLines $editListMutationPermissionLines `
    -ProcessingLines @(
      '対象列が同一編集リスト配下かつ `deleted_at IS NULL` であることを検証する。',
      '`column_name` だけを更新し、`column_key` と既存値は変更しない。'
    ) `
    -ResponseRows @(
      @('item', 'FreeColumnDefinition', '✓', '更新後フリーカラム')
    ) `
    -StatusRows @(
      @('200', '更新成功', 'FreeColumnResponse'),
      @('404', 'フリーカラムなし', 'ErrorResponse'),
      @('409', 'ロック不一致または競合更新', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title 'フリーカラム削除（/edit-lists/{editListId}/free-columns/{freeColumnId}）' `
    -Overview 'フリーカラム定義と入力済み値を論理削除する。' `
    -Method 'DELETE' `
    -Path '/edit-lists/{editListId}/free-columns/{freeColumnId}' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('editListId', 'path', 'int64', '✓', '編集リストID'),
      @('freeColumnId', 'path', 'int64', '✓', 'フリーカラムID')
    ) `
    -RequestRows $lockRequestRows `
    -PermissionLines $editListMutationPermissionLines `
    -ProcessingLines @(
      '`edit_list_free_columns.deleted_at` を設定し、紐づく `edit_list_free_column_values.deleted_at` も同一トランザクションで設定する。',
      '原本資産、SHIP資産マスタ、購入申請明細、見積明細へは反映しない。'
    ) `
    -ResponseRows @(
      @('freeColumnId', 'int64', '✓', '削除したフリーカラムID'),
      @('deletedValueCount', 'int32', '✓', '同時に論理削除した値件数')
    ) `
    -StatusRows @(
      @('200', '削除成功', 'FreeColumnDeleteResponse'),
      @('404', 'フリーカラムなし', 'ErrorResponse'),
      @('409', 'ロック不一致', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title 'Data Linkプレビュー（/edit-lists/{editListId}/data-link/preview）' `
    -Overview '選択行に対して資産Master、業者Master、原本リストから転記した場合の差分をプレビューする。' `
    -Method 'POST' `
    -Path '/edit-lists/{editListId}/data-link/preview' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('editListId', 'path', 'int64', '✓', '編集リストID')
    ) `
    -RequestRows ($lockRequestRows + @(
      @('editListItemIds', 'int64[]', '✓', '対象明細ID配列。空配列は拒否'),
      @('dataSource', 'string', '✓', '`ASSET_MASTER` / `VENDOR_MASTER` / `BASE_LEDGER`'),
      @('linkKey', 'string', '✓', '照合キー。資産Master ID、業者ID/業者名、QRコードなど'),
      @('sourceColumnKeys', 'string[]', '✓', '転記対象ソースカラムキー。空配列は拒否')
    )) `
    -PermissionLines $editListMutationPermissionLines `
    -ProcessingLines @(
      '転記可能カラムと転記先はサーバー定義マッピングで管理し、クライアントから任意の物理カラム名を指定させない。',
      '原本リスト由来は `source_asset_ledger_id` を持つ `BASE_ASSET` 明細だけ対象とし、実行時点の最新 `asset_ledgers` 値を参照する。',
      '資産Master由来は `edit_list_items.ship_asset_master_id` または元資産行の `asset_ledgers.ship_asset_master_id` で `ship_asset_masters` / `ship_asset_master_details` を参照し、サーバー定義マッピングに存在する固定列だけを転記対象とする。',
      '業者Master由来は `vendor_id` または一意な `vendor_name` で `vendors` を参照し、曖昧一致は紐づけなしとして扱う。',
      '転記元に存在する空値はクリア差分としてプレビューに含める。転記元項目自体が存在しない場合は更新しない。',
      '最大20行の差分サンプル、`totalRows`、残件有無を返す。'
    ) `
    -ResponseRows @(
      @('matchedCount', 'int32', '✓', '紐づけ成功件数'),
      @('unmatchedCount', 'int32', '✓', '紐づけなし件数'),
      @('changedColumnCount', 'int32', '✓', '変更対象カラム数'),
      @('totalRows', 'int32', '✓', '対象行数'),
      @('samples', 'DataLinkDiffSample[]', '✓', '最大20行の差分サンプル')
    ) `
    -StatusRows @(
      @('200', 'プレビュー成功', 'DataLinkPreviewResponse'),
      @('400', '対象行または転記カラムが空', 'ErrorResponse'),
      @('409', 'ロック不一致または未対応カラム指定', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title 'Data Link適用（/edit-lists/{editListId}/data-link/apply）' `
    -Overview 'Data Linkの結果を編集リスト側の作業値へ反映する。' `
    -Method 'POST' `
    -Path '/edit-lists/{editListId}/data-link/apply' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('Idempotency-Key', 'header', 'string', '✓', '同一適用操作の冪等キー'),
      @('editListId', 'path', 'int64', '✓', '編集リストID')
    ) `
    -RequestRows ($lockRequestRows + @(
      @('editListItemIds', 'int64[]', '✓', '対象明細ID配列'),
      @('dataSource', 'string', '✓', '`ASSET_MASTER` / `VENDOR_MASTER` / `BASE_LEDGER`'),
      @('linkKey', 'string', '✓', '照合キー'),
      @('sourceColumnKeys', 'string[]', '✓', '転記対象ソースカラムキー')
    )) `
    -PermissionLines $editListMutationPermissionLines `
    -ProcessingLines @(
      'プレビュー時と同じ条件で再照合し、照合できない行はスキップして結果件数を返す。',
      '固定列は `edit_list_items`、フリーカラムは `edit_list_free_column_values` へ反映する。',
      '転記先固定列を持たない資産Master項目は対象外とし、暗黙に新しい物理列や値保持領域を作らない。',
      '未対応の転記先キーは拒否し、暗黙に新しい物理列を作らない。',
      '転記元に存在する空値はクリア差分として上書きできる。',
      '原本 `asset_ledgers`、SHIP資産マスタ、業者マスタは更新しない。'
    ) `
    -ResponseRows @(
      @('matchedCount', 'int32', '✓', '紐づけ成功件数'),
      @('unmatchedCount', 'int32', '✓', '紐づけなし件数'),
      @('updatedItemCount', 'int32', '✓', '更新明細数'),
      @('updatedColumnCount', 'int32', '✓', '更新カラム総数'),
      @('lockExpiresAt', 'datetime', '✓', '延長後ロック期限')
    ) `
    -StatusRows @(
      @('200', '適用成功', 'DataLinkApplyResponse'),
      @('400', '対象不足または未対応カラム指定', 'ErrorResponse'),
      @('409', 'ロック不一致、期限切れ、冪等キー競合', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '見積DB Link候補取得（/edit-lists/{editListId}/quotation-link/candidates）' `
    -Overview '編集リスト配下の有効RFQ、見積フェーズ、見積明細、紐付け済み/未紐付け状態、紐付け可能な編集リスト明細を取得する。' `
    -Method 'GET' `
    -Path '/edit-lists/{editListId}/quotation-link/candidates' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('editListId', 'path', 'int64', '✓', '編集リストID'),
      @('lockToken', 'query', 'string', '✓', '作業ロックトークン'),
      @('rfqId', 'query', 'int64', '-', '対象RFQ ID。省略時は編集リスト配下の候補RFQ一覧を返す'),
      @('quotationPhase', 'query', 'string', '-', '`LIST_PRICE` / `ESTIMATE` / `ORDER_REGISTRATION` / `FINAL_ASSET_REGISTRATION`')
    ) `
    -PermissionLines $editListMutationPermissionLines `
    -ProcessingLines @(
      '画面上は行選択なしでも起動できるため、候補取得はチェックボックス選択状態に依存しない。',
      '文字列のRFQ No. + フェーズを正本キーにせず、`rfq_id`、`quotation_id`、`quotation_item_id`、`edit_list_item_id` を正本キーとして返す。',
      '候補RFQは `rfqs.edit_list_id=editListId`、`deleted_at IS NULL` の範囲に限定する。',
      '有効な `quotation_item_application_links` を参照し、1対1紐付け済み状態を返す。',
      '見積番号とRFQグループ名は別項目として返し、見積番号をRFQグループ名へ転記しない。'
    ) `
    -ResponseRows @(
      @('rfqs', 'QuotationLinkRfqCandidate[]', '✓', '編集リスト配下のRFQ候補'),
      @('quotationItems', 'QuotationLinkItem[]', '✓', '対象見積明細'),
      @('editListItems', 'QuotationLinkTargetItem[]', '✓', '紐付け可能な編集リスト明細'),
      @('links', 'QuotationLinkState[]', '✓', '既存紐付け状態')
    ) `
    -StatusRows @(
      @('200', '取得成功', 'QuotationLinkCandidatesResponse'),
      @('404', '編集リストまたはRFQなし', 'ErrorResponse'),
      @('409', 'ロック不一致', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '見積DB Link適用（/edit-lists/{editListId}/quotation-link/apply）' `
    -Overview '見積明細を編集リスト明細へ1対1で紐づけ、見積ヘッダー/明細分類/価格情報を編集リストへ一括転記する。未紐付け見積明細から新規行も追加できる。' `
    -Method 'POST' `
    -Path '/edit-lists/{editListId}/quotation-link/apply' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('Idempotency-Key', 'header', 'string', '✓', '同一適用操作の冪等キー'),
      @('editListId', 'path', 'int64', '✓', '編集リストID')
    ) `
    -RequestRows ($lockRequestRows + @(
      @('rfqId', 'int64', '✓', '対象RFQ ID。`editListId` 配下の有効RFQに限定'),
      @('quotationId', 'int64', '✓', '対象見積ID'),
      @('pairings', 'QuotationPairingInput[]', '-', '既存行への紐付け指定'),
      @('additions', 'QuotationAdditionInput[]', '-', '未紐付け見積明細から追加する指定')
    )) `
    -RequestSubtables @(
      @{ Title = 'pairings要素（QuotationPairingInput）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
        @('quotationItemId', 'int64', '✓', '見積明細ID'),
        @('editListItemId', 'int64', '✓', '紐付け先編集リスト明細ID')
      ) },
      @{ Title = 'additions要素（QuotationAdditionInput）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
        @('quotationItemId', 'int64', '✓', '追加元見積明細ID'),
        @('inheritFromEditListItemId', 'int64', '-', '新設置場所情報と執行年度だけを継承する元明細ID')
      ) }
    ) `
    -PermissionLines $editListMutationPermissionLines `
    -ProcessingLines @(
      '`pairings` と `additions` がどちらも空の場合は拒否する。',
      '有効なリンクは見積明細1件につき編集リスト明細1件、編集リスト明細1件につき見積明細1件までとする。',
      '差し替え時は旧 `quotation_item_application_links.deleted_at` を設定してから新リンクを作成する。',
      '見積ヘッダー/明細分類/価格情報の対象カラムをサーバー定義マッピングで一括転記する。手動カラム選択は行わない。',
      '未紐付け見積明細から追加する行は `source_type=''QUOTATION''` とし、`source_quotation_item_id` と `quotation_item_application_links` で出所を追跡する。',
      '追加行へ継承できるのは選択元行の新設置場所情報（棟、階、部門、部署、室名）と執行年度に限る。物理識別子はコピーしない。',
      '`rfqs.quotation_type` / `quotation_phase` が未指定のRFQは、有効見積ヘッダ紐付け後に一覧用スナップショットへ同期する。'
    ) `
    -ExtraTables @(
      @{ Title = '見積DB Link source→target主要マッピング'; Headers = @('source', 'target', '説明'); Rows = @(
        @('`quotations.quotation_no`', '`edit_list_items.quotation_no`', '見積番号'),
        @('`rfqs.rfq_group_name`', '`edit_list_items.rfq_group_name`', 'RFQグループ名。見積番号とは別項目'),
        @('`quotations.vendor_id` / `vendor_name`', '`edit_list_items.vendor_id` / `vendor_name`', '見積業者'),
        @('`quotations.quotation_on`', '`edit_list_items.quotation_date`', '見積日付'),
        @('`quotation_items.item_type`', '`edit_list_items.item_type`', '明細区分'),
        @('`quotation_items.category_name`', '`edit_list_items.category_name`', 'Category'),
        @('`quotation_items.large_class_name`', '`edit_list_items.large_class_name`', '大分類'),
        @('`quotation_items.medium_class_name`', '`edit_list_items.medium_class_name`', '中分類'),
        @('`quotation_items.item_name`', '`edit_list_items.item_name`', '品目'),
        @('`quotation_items.maker_name`', '`edit_list_items.maker_name`', 'メーカー'),
        @('`quotation_items.model_name`', '`edit_list_items.model_name`', '型式'),
        @('`quotation_items.list_price_unit`', '`edit_list_items.list_price_unit`', '定価単価'),
        @('`quotation_items.list_price_total`', '`edit_list_items.list_price_total`', '定価金額'),
        @('`quotation_items.purchase_price_unit`', '`edit_list_items.quotation_price_unit`', '見積単価'),
        @('`quotation_items.purchase_price_total`', '`edit_list_items.quotation_price_ex_tax`', '見積金額（税別）'),
        @('`quotation_items.alloc_tax_total`', '`edit_list_items.quotation_price_in_tax`', '見積金額（税込）')
      ) }
    ) `
    -ResponseRows @(
      @('linkedCount', 'int32', '✓', '紐付け更新件数'),
      @('unlinkedCount', 'int32', '✓', '未紐付け件数'),
      @('addedCount', 'int32', '✓', '追加明細件数'),
      @('createdItems', 'EditListItem[]', '✓', '追加された編集リスト明細')
    ) `
    -StatusRows @(
      @('200', '適用成功', 'QuotationLinkApplyResponse'),
      @('400', '適用対象なしまたは入力不正', 'ErrorResponse'),
      @('404', 'RFQ、見積、明細なし', 'ErrorResponse'),
      @('409', 'ロック不一致、1対1制約違反、冪等キー競合', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '見積DB Link解除（/edit-lists/{editListId}/quotation-link/{editListItemId}）' `
    -Overview '編集リスト明細と見積明細の有効リンクを解除する。転記済みの編集リスト作業値は明示指定がない限り残す。' `
    -Method 'DELETE' `
    -Path '/edit-lists/{editListId}/quotation-link/{editListItemId}' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('editListId', 'path', 'int64', '✓', '編集リストID'),
      @('editListItemId', 'path', 'int64', '✓', '解除対象編集リスト明細ID')
    ) `
    -RequestRows ($lockRequestRows + @(
      @('clearTransferredValues', 'boolean', '-', 'true の場合、見積DB Linkで転記した見積系項目をクリアする。既定 false')
    )) `
    -PermissionLines $editListMutationPermissionLines `
    -ProcessingLines @(
      '対象明細の有効な `quotation_item_application_links` に `deleted_at` を設定する。',
      '`source_type=''QUOTATION''` の追加行自体を削除する場合は本APIではなく明細削除APIを使用する。',
      'リンク解除後も編集リストの転記済み作業値は原則保持する。'
    ) `
    -ResponseRows @(
      @('editListItemId', 'int64', '✓', '解除対象明細ID'),
      @('unlinkedQuotationItemId', 'int64', '✓', '解除した見積明細ID')
    ) `
    -StatusRows @(
      @('200', '解除成功', 'QuotationLinkDeleteResponse'),
      @('404', '有効リンクなし', 'ErrorResponse'),
      @('409', 'ロック不一致', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '廃棄・移設申請一括作成（/edit-lists/{editListId}/applications/disposal-transfer）' `
    -Overview 'リモデル編集リストで選択した廃棄予定または移設明細から、廃棄申請・移設申請とリモデル管理ワークフロー行を一括作成する。' `
    -Method 'POST' `
    -Path '/edit-lists/{editListId}/applications/disposal-transfer' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('Idempotency-Key', 'header', 'string', '✓', '同一作成操作の冪等キー'),
      @('editListId', 'path', 'int64', '✓', 'リモデル編集リストID')
    ) `
    -RequestRows @(
      @('lockToken', 'string', '✓', '作業ロックトークン'),
      @('editListItemIds', 'int64[]', '✓', '選択明細ID配列')
    ) `
    -PermissionLines $disposalTransferPermissionLines `
    -ProcessingLines @(
      '通常編集リスト（`PURCHASE`）からの作成は拒否する。',
      '選択行のうち `remodel_decision=''DISPOSAL''` または `TRANSFER` の未申請行だけを作成対象とする。',
      '購入系行、方針未設定行、申請済み行が混在する場合は行単位でスキップし、`skipped[]` に理由を返す。',
      '`applications` / `application_assets` を作成し、`rfqs.management_type=''REMODEL''`、`workflow_type=''DISPOSAL'' / ''TRANSFER''` のワークフロー行を作成する。',
      '`application_status_histories` に廃棄/移設申請の作成履歴を記録する。',
      '廃棄ワークフローの `rfqs.rfq_no` は `DISP-yyyyMMdd-nnnn`、移設ワークフローは `TRAN-yyyyMMdd-nnnn` 形式でサーバー採番する。',
      '`rfqs.rfq_group_name` は廃棄または移設の既定形式でサーバー生成する。',
      '`rfq_applications` には `application_id`、`application_asset_id`、`edit_list_id`、`edit_list_item_id` をすべて保持する。',
      '未削除RFQかつ同一 `workflow_type` かつ同一 `edit_list_item_id` の有効リンクがある場合は重複作成せずスキップする。',
      'リモデル編集リスト起点の移設申請は作成時点の移設先未入力を許容し、リモデルクローズ前に新設置場所を必須検証する。'
    ) `
    -ResponseRows @(
      @('created', 'DisposalTransferCreatedItem[]', '✓', '作成結果'),
      @('skipped', 'DisposalTransferSkippedItem[]', '✓', 'スキップ結果')
    ) `
    -StatusRows @(
      @('200', '作成成功または一部スキップ', 'DisposalTransferCreateResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('403', '廃棄・移設権限なし', 'ErrorResponse'),
      @('409', 'ロック不一致または重複作成', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '廃棄申請個別作成（/edit-lists/{editListId}/applications/disposal）' `
    -Overview '廃棄予定明細だけを明示して廃棄申請を作成する互換/個別API。一括APIと同じ検証、採番、重複判定を用いる。' `
    -Method 'POST' `
    -Path '/edit-lists/{editListId}/applications/disposal' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('Idempotency-Key', 'header', 'string', '✓', '同一作成操作の冪等キー'),
      @('editListId', 'path', 'int64', '✓', 'リモデル編集リストID')
    ) `
    -RequestRows @(
      @('lockToken', 'string', '✓', '作業ロックトークン'),
      @('editListItemIds', 'int64[]', '✓', '廃棄予定明細ID配列')
    ) `
    -PermissionLines $disposalTransferPermissionLines `
    -ProcessingLines @(
      '`remodel_decision=''DISPOSAL''` の明細だけを対象とし、採番形式は `DISP-yyyyMMdd-nnnn` とする。',
      'レスポンス形式、重複判定、`rfq_applications` 保存方針は一括APIと同じとする。'
    ) `
    -ResponseRows @(
      @('created', 'DisposalTransferCreatedItem[]', '✓', '作成結果'),
      @('skipped', 'DisposalTransferSkippedItem[]', '✓', 'スキップ結果')
    ) `
    -StatusRows @(
      @('200', '作成成功または一部スキップ', 'DisposalTransferCreateResponse'),
      @('409', 'ロック不一致または重複作成', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '移設申請個別作成（/edit-lists/{editListId}/applications/transfer）' `
    -Overview '移設明細だけを明示して移設申請を作成する互換/個別API。一括APIと同じ検証、採番、重複判定を用いる。' `
    -Method 'POST' `
    -Path '/edit-lists/{editListId}/applications/transfer' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('Idempotency-Key', 'header', 'string', '✓', '同一作成操作の冪等キー'),
      @('editListId', 'path', 'int64', '✓', 'リモデル編集リストID')
    ) `
    -RequestRows @(
      @('lockToken', 'string', '✓', '作業ロックトークン'),
      @('editListItemIds', 'int64[]', '✓', '移設明細ID配列')
    ) `
    -PermissionLines $disposalTransferPermissionLines `
    -ProcessingLines @(
      '`remodel_decision=''TRANSFER''` の明細だけを対象とし、採番形式は `TRAN-yyyyMMdd-nnnn` とする。',
      '申請作成時点の移設先未入力を許容し、リモデルクローズ前に新設置場所を必須検証する。',
      'レスポンス形式、重複判定、`rfq_applications` 保存方針は一括APIと同じとする。'
    ) `
    -ResponseRows @(
      @('created', 'DisposalTransferCreatedItem[]', '✓', '作成結果'),
      @('skipped', 'DisposalTransferSkippedItem[]', '✓', 'スキップ結果')
    ) `
    -StatusRows @(
      @('200', '作成成功または一部スキップ', 'DisposalTransferCreateResponse'),
      @('409', 'ロック不一致または重複作成', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title 'RFQグループ作成（/edit-lists/{editListId}/rfq-groups）' `
    -Overview '選択した編集リスト明細から通常購入またはリモデルの見積依頼グループを作成する。RFQ No.は作成確定時だけサーバー採番する。' `
    -Method 'POST' `
    -Path '/edit-lists/{editListId}/rfq-groups' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('Idempotency-Key', 'header', 'string', '✓', '同一作成操作の冪等キー'),
      @('editListId', 'path', 'int64', '✓', '編集リストID')
    ) `
    -RequestRows @(
      @('lockToken', 'string', '✓', '作業ロックトークン'),
      @('rfqGroupName', 'string', '✓', '見積依頼グループ名'),
      @('editListItemIds', 'int64[]', '✓', 'RFQに採用する編集リスト明細ID配列')
    ) `
    -PermissionLines $rfqPermissionLines `
    -ProcessingLines @(
      '`rfqs.rfq_no` は `RFQ-yyyyMMdd-nnnn` 形式でサーバー採番する。モーダル事前表示のRFQ No.は採番予約ではなく参考値である。',
      '`edit_lists.list_type=''PURCHASE''` の場合は `rfqs.management_type=''PURCHASE''`、`list_type=''REMODEL''` の場合は `REMODEL` とする。',
      '通常の見積依頼では `workflow_type=''RFQ''` とする。',
      'リモデルRFQでは購入系の `NEW` / `REPLACE` / `ADDITION` 行だけを対象とし、廃棄予定、移設、方針未設定、申請済み行は行単位でスキップする。',
      '対象行が1件もない場合はRFQを作成しない。',
      '`rfqs.quotation_type` / `quotation_phase` は作成時点で未指定を許容する。有効見積ヘッダ紐付け後に一覧用スナップショットへ同期する。',
      '`rfq_applications` に採用した `editListItemId` を登録する。RFQ詳細・依頼書プレビューはこのリンクだけを対象とし、同一編集リスト内の未選択明細を含めない。',
      '選択された明細の `rfq_no` / `rfq_group_name` / `rfq_assignment_status` は現在表示用として新規作成分で上書きする。',
      '同じ編集リスト明細を複数RFQへ紐づけることは許容し、過去リンクは `rfq_applications` で追跡する。'
    ) `
    -ResponseRows @(
      @('created', 'RfqCreatedItem[]', '✓', '採用明細'),
      @('skipped', 'RfqSkippedItem[]', '✓', 'スキップ明細'),
      @('rfqId', 'int64', '✓', '`rfqs.rfq_id`'),
      @('rfqGroupId', 'int64', '✓', '画面遷移用ID。`rfqId` と同値'),
      @('rfqNo', 'string', '✓', '確定RFQ No.'),
      @('managementType', 'string', '✓', '`PURCHASE` / `REMODEL`'),
      @('returnTo', 'string', '✓', '後続画面の既定戻り先'),
      @('editListId', 'int64', '✓', '編集リストID')
    ) `
    -StatusRows @(
      @('201', 'RFQ作成成功', 'EditListRfqCreateResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('403', 'RFQ作成権限なし', 'ErrorResponse'),
      @('409', '対象明細なし、ロック不一致、冪等キー競合', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '表示カラム設定取得（/user-column-settings?screenId=edit_list）' `
    -Overview '編集リスト画面の表示カラム設定とブックマーク一覧を取得する。列幅、列順、ソート、列内フィルターは取得対象外である。' `
    -Method 'GET' `
    -Path '/user-column-settings?screenId=edit_list' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('screenId', 'query', 'string', '✓', '`edit_list` 固定')
    ) `
    -PermissionLines $columnSettingPermissionLines `
    -ProcessingLines @(
      '`user_column_settings` からログインユーザー、`screen_id=''edit_list''` の表示/非表示設定を取得する。',
      '`user_column_setting_presets` と `user_column_setting_preset_items` からブックマーク一覧を取得する。',
      '固定列の `column_key` は画面契約として固定する。',
      '列幅、列順、ソート、列内フィルター、全体検索条件はDB保存対象外とし返さない。'
    ) `
    -ResponseRows @(
      @('columns', 'UserColumnSetting[]', '✓', '表示カラム設定'),
      @('presets', 'UserColumnSettingPreset[]', '✓', '表示カラムブックマーク')
    ) `
    -StatusRows @(
      @('200', '取得成功', 'UserColumnSettingsResponse'),
      @('403', '編集リスト表示権限なし', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '表示カラム設定保存（/user-column-settings?screenId=edit_list）' `
    -Overview '編集リスト画面の現在の表示/非表示設定をユーザー別に保存する。' `
    -Method 'PUT' `
    -Path '/user-column-settings?screenId=edit_list' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('screenId', 'query', 'string', '✓', '`edit_list` 固定')
    ) `
    -RequestRows @(
      @('columns', 'UserColumnSettingInput[]', '✓', 'カラムキーと表示フラグの配列')
    ) `
    -PermissionLines $columnSettingPermissionLines `
    -ProcessingLines @(
      'ログインユーザー、`screen_id=''edit_list''` 単位で `user_column_settings` を置換保存する。',
      '未知の固定列キーは拒否する。',
      '列幅、列順、ソート、列内フィルターは保存しない。'
    ) `
    -ResponseRows @(
      @('columns', 'UserColumnSetting[]', '✓', '保存後設定')
    ) `
    -StatusRows @(
      @('200', '保存成功', 'UserColumnSettingsResponse'),
      @('400', 'カラムキー不正', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '表示カラムブックマーク保存（/user-column-setting-presets）' `
    -Overview '編集リスト画面の現在の表示/非表示設定をブックマークとして保存する。' `
    -Method 'POST' `
    -Path '/user-column-setting-presets' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('Idempotency-Key', 'header', 'string', '✓', '同一保存操作の冪等キー')
    ) `
    -RequestRows @(
      @('screenId', 'string', '✓', '`edit_list` 固定'),
      @('presetName', 'string', '✓', 'ブックマーク名。ユーザー・画面内で有効名重複不可'),
      @('columns', 'UserColumnSettingInput[]', '✓', 'ブックマークに保存する表示状態')
    ) `
    -PermissionLines $columnSettingPermissionLines `
    -ProcessingLines @(
      '`user_column_setting_presets` と `user_column_setting_preset_items` を同一トランザクションで作成する。',
      '同一ユーザー、同一 `screen_id`、同一 `preset_name` の有効ブックマーク重複は拒否する。',
      '列幅、列順、ソート、列内フィルターはブックマーク保存対象外とする。'
    ) `
    -ResponseRows @(
      @('preset', 'UserColumnSettingPreset', '✓', '作成したブックマーク')
    ) `
    -StatusRows @(
      @('201', '保存成功', 'UserColumnSettingPresetResponse'),
      @('409', 'ブックマーク名重複または冪等キー競合', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '表示カラムブックマーク適用（/user-column-setting-presets/{presetId}/apply）' `
    -Overview '保存済みブックマークを現在の表示カラム設定へ適用する。' `
    -Method 'POST' `
    -Path '/user-column-setting-presets/{presetId}/apply' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('presetId', 'path', 'int64', '✓', 'ブックマークID')
    ) `
    -RequestRows @(
      @('screenId', 'string', '✓', '`edit_list` 固定')
    ) `
    -PermissionLines $columnSettingPermissionLines `
    -ProcessingLines @(
      'ログインユーザー所有の有効ブックマークであることを検証する。',
      '`user_column_setting_preset_items` の内容で `user_column_settings` を置換更新する。',
      '適用時点で未知または廃止された固定列キーが含まれる場合は拒否し、利用者に再保存を促す。'
    ) `
    -ResponseRows @(
      @('columns', 'UserColumnSetting[]', '✓', '適用後の表示カラム設定')
    ) `
    -StatusRows @(
      @('200', '適用成功', 'UserColumnSettingsResponse'),
      @('404', 'ブックマークなし', 'ErrorResponse'),
      @('409', '無効カラムを含む', 'ErrorResponse')
    )

  New-EndpointBlock `
    -Title '表示カラムブックマーク削除（/user-column-setting-presets/{presetId}）' `
    -Overview '保存済み表示カラムブックマークを論理削除する。現在の表示カラム設定は変更しない。' `
    -Method 'DELETE' `
    -Path '/user-column-setting-presets/{presetId}' `
    -Auth '要（Bearer）' `
    -ParametersRows @(
      @('presetId', 'path', 'int64', '✓', 'ブックマークID')
    ) `
    -PermissionLines $columnSettingPermissionLines `
    -ProcessingLines @(
      'ログインユーザー所有の有効ブックマークであることを検証する。',
      '`user_column_setting_presets.deleted_at` を設定する。明細は親の論理削除に従い通常取得対象外とする。',
      '削除しても `user_column_settings` の現在設定は変更しない。'
    ) `
    -ResponseRows @(
      @('presetId', 'int64', '✓', '削除したブックマークID'),
      @('deletedAt', 'datetime', '✓', '削除日時')
    ) `
    -StatusRows @(
      @('200', '削除成功', 'UserColumnSettingPresetDeleteResponse'),
      @('404', 'ブックマークなし', 'ErrorResponse')
    )
)

@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_編集リスト.docx'
  ScreenLabel = '編集リスト'
  CoverDateText = '2026年5月28日'
  RevisionDateText = '2026/5/28'
  RevisionSummaryText = '編集リストAPI設計書の初版作成'
  RevisionAuthorText = '-'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、通常購入およびリモデルで利用する編集リスト画面（`/remodel-application`）の API 仕様を定義する。' },
    @{ Type = 'Paragraph'; Text = '対象範囲は、編集リスト一覧・作成・削除、作業ロック、明細取得、セル編集、一括編集、明細追加/削除、行順変更、Data Link、見積DB Link、フリーカラム、表示カラム設定/ブックマーク、編集リスト起点RFQ作成、リモデル編集リスト起点の廃棄・移設申請作成である。' },
    @{ Type = 'Paragraph'; Text = '資産詳細参照は No.12 資産一覧・資産詳細 API、購入管理タブからの購入申請取り込みは No.25 購入管理 API、リモデルダッシュボードとクローズは No.24 リモデル管理 API を正本とし、本書では重複定義しない。' },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '編集リストは、原本資産台帳を編集用スナップショットとして複製し、通常購入またはリモデルの見積依頼・申請・原本反映に向けた編集値を保持する中核画面である。' },
    @{ Type = 'Paragraph'; Text = '通常編集リストは `list_type=''PURCHASE''`、リモデル編集リストは `list_type=''REMODEL''` として作成し、作成後に種別を切り替えない。通常購入RFQ、リモデルRFQ、廃棄/移設ワークフローを1つの編集リスト内で混在させない。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('編集リスト', '`edit_lists` を親に `edit_list_items` で明細を保持する編集用一覧'),
      @('通常編集リスト', '`edit_lists.list_type=''PURCHASE''` の編集リスト。通常購入管理へRFQを渡す'),
      @('リモデル編集リスト', '`edit_lists.list_type=''REMODEL''` の編集リスト。リモデルRFQ、廃棄、移設、リモデルクローズへ渡す'),
      @('作業ロック', '`edit_list_work_locks` で管理する編集リスト単位の排他制御。他ユーザー作業中は画面入場不可'),
      @('明細ソース種別', '`BASE_ASSET` / `APPLICATION` / `MANUAL` / `QUOTATION`。画面上の仮番号ではなく `edit_list_item_id` を正本キーにする'),
      @('Data Link', '資産Master、業者Master、原本リストから選択カラムを編集リストの作業値へ転記する機能'),
      @('見積DB Link', 'RFQ配下の見積明細を編集リスト明細へ1対1で紐づけ、見積情報を転記する機能')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面パス', '利用目的'); Rows = @(
      @('編集リスト画面', '/remodel-application', '通常購入/リモデルの編集リスト本体操作、Data Link、見積DB Link、RFQ作成、廃棄・移設申請作成を行う'),
      @('通常編集リスト選択モーダル', '/quotation-data-box/purchase-management から起動', '通常編集リスト候補表示・作成。購入申請取り込み自体は購入管理APIを利用する'),
      @('リモデル編集リスト選択モーダル', '/quotation-data-box/remodel-management から起動', 'リモデル編集リスト候補表示・作成')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'API の位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、編集リスト画面内の作業値を保存・参照する。セル編集、Data Link、見積DB Link、フリーカラム、行順、RFQ作成、廃棄/移設申請作成の保存単位を個別APIとして扱い、画面全体の一括保存APIは提供しない。' },
    @{ Type = 'Paragraph'; Text = '編集リストの通常操作では原本 `asset_ledgers`、申請正本、見積正本を直接更新しない。原本反映は通常購入の資産登録完了、またはリモデル管理のクローズ時に後続APIで行う。' },
    @{ Type = 'Heading2'; Text = '画面と API の関係' },
    @{ Type = 'Table'; Headers = @('画面操作', 'API', '補足'); Rows = @(
      @('編集リスト候補表示', '`GET /edit-lists`', '`listType=PURCHASE` / `REMODEL` で導線ごとに分離する'),
      @('編集リスト新規作成', '`POST /edit-lists`', '対象施設の原本資産を `BASE_ASSET` としてコピーする'),
      @('既存編集リスト入場', '`POST /edit-lists/{editListId}/lock`', '他ユーザー作業中は入場不可'),
      @('画面初期表示', '`GET /edit-lists/{editListId}/items`', 'ヘッダー、ロック、固定列、フリーカラム、明細を取得する'),
      @('セル編集', '`PATCH /edit-lists/{editListId}/items/{editListItemId}`', '固定列、フリーカラムへ保存する'),
      @('一括編集', '`PATCH /edit-lists/{editListId}/items/bulk`', '選択明細の同一カラムを一括保存する'),
      @('更新/増設/新規要望', '`POST /edit-lists/{editListId}/items`', '専用APIを増やさず明細追加APIの業務ケースとして扱う'),
      @('行順変更', '`PATCH /edit-lists/{editListId}/items/reorder`', '`row_no` を再採番する'),
      @('行削除', '`DELETE /edit-lists/{editListId}/items/{editListItemId}`', '論理削除。元データは削除しない'),
      @('フリーカラム操作', '`GET/POST/PATCH/DELETE /edit-lists/{editListId}/free-columns`', '列定義と値を編集リスト内限定で管理する'),
      @('Data Link', '`POST /data-link/preview` / `POST /data-link/apply`', 'プレビュー後に作業値へ転記する'),
      @('見積DB Link', '`GET /quotation-link/candidates` / `POST /quotation-link/apply` / `DELETE /quotation-link/{editListItemId}`', 'RFQ/見積/明細IDを正本キーにする'),
      @('廃棄・移設申請', '`POST /applications/disposal-transfer`', 'リモデル編集リスト限定で申請とREMODELワークフローを作成する'),
      @('見積依頼グループ作成', '`POST /rfq-groups`', 'RFQ No.は作成確定時に採番する'),
      @('表示カラム設定/ブックマーク', '`/user-column-settings` / `/user-column-setting-presets`', '表示/非表示だけを保存し、列幅・列順・ソートは保存しない')
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル/VIEW', '利用種別', '用途'); Rows = @(
      @('`users`', 'READ', '共有システム管理者アカウント判定、作業ロック保持者名・作成者名の解決'),
      @('`facilities`', 'READ', 'Bearer トークン上の作業対象施設、編集リスト対象施設、主施設の存在確認・未削除判定'),
      @('`user_facility_assignments`', 'READ', '通常アカウントの作業対象施設割当判定'),
      @('`facility_feature_settings`', 'READ', '通常アカウントの作業対象施設における編集リスト、RFQ、廃棄・移設機能の提供有無判定'),
      @('`user_facility_feature_settings`', 'READ', '通常アカウントのユーザー×作業対象施設単位の編集リスト、RFQ、廃棄・移設機能の利用可否判定'),
      @('`edit_lists`', 'READ / CREATE / UPDATE / DELETE', '編集リストヘッダー、種別、ステータス、削除、クローズ状態'),
      @('`edit_list_work_locks`', 'READ / CREATE / UPDATE', '作業ロック取得、heartbeat、通常解除、更新系API検証'),
      @('`edit_list_facilities`', 'READ / CREATE', '編集リスト対象施設'),
      @('`edit_list_items`', 'READ / CREATE / UPDATE / DELETE', '固定58列の作業スナップショット、行順、ソース種別、RFQ現在表示'),
      @('`edit_list_free_columns`', 'READ / CREATE / UPDATE / DELETE', '編集リスト内限定のフリーカラム定義'),
      @('`edit_list_free_column_values`', 'READ / CREATE / UPDATE / DELETE', 'フリーカラム行別値'),
      @('`asset_ledgers`', 'READ', '編集リスト作成時の原本コピー元、原本リストData Linkの転記元'),
      @('`qr_codes`', 'READ', '編集リスト作成時に原本資産へ紐づくQR情報を作業スナップショットへ取り込む'),
      @('`ship_asset_masters` / `ship_asset_master_details`', 'READ', '資産Master Data Link、品目/メーカー/型式編集時の再解決'),
      @('`vendors`', 'READ', '業者Master Data Link'),
      @('`applications` / `purchase_application_details` / `application_assets`', 'CREATE / READ / UPDATE', 'インライン新規要望、廃棄・移設申請、申請由来明細'),
      @('`application_status_histories`', 'CREATE', 'インライン新規要望、廃棄・移設申請の状態履歴'),
      @('`rfqs`', 'CREATE / READ / UPDATE', 'RFQグループ、廃棄/移設ワークフロー、見積DB Link候補'),
      @('`rfq_applications`', 'CREATE / READ', 'RFQ・廃棄・移設に採用した編集リスト明細と申請明細のリンク'),
      @('`quotations` / `quotation_items`', 'READ', '見積DB Linkの候補、転記元'),
      @('`quotation_item_application_links`', 'READ / CREATE / DELETE', '見積明細と編集リスト明細の1対1リンク'),
      @('`user_column_settings`', 'READ / CREATE / UPDATE', 'ユーザー別表示カラム設定'),
      @('`user_column_setting_presets` / `user_column_setting_preset_items`', 'READ / CREATE / UPDATE / DELETE', '表示カラムブックマーク')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API 共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-05-28T10:00:00+09:00`）',
      '日付形式: `YYYY-MM-DD`',
      '認証済みAPIは Bearer トークンを `Authorization` ヘッダーに付与する',
      '変更系APIは `lockToken` を必須とし、必要に応じて `Idempotency-Key` または `expectedUpdatedAt` で二重送信・競合更新を検出する',
      '論理削除は `deleted_at` または対象テーブルの状態列で扱い、監査・履歴参照に必要なリンクは保持する'
    ) },
    @{ Type = 'Heading2'; Text = '認証・認可' },
    @{ Type = 'Paragraph'; Text = '本API群はロール固定ではなく、対象施設に対する実効 `feature_code` で認可する。通常アカウントでは、Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）では、作業対象施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず、編集リスト、RFQ作成、廃棄・移設申請の対象 `feature_code` を有効として扱う。' },
    @{ Type = 'Table'; Headers = @('機能コード', '対象操作', '説明'); Rows = @(
      @('`normal_edit_list`', '通常編集リスト一覧・作成・入場・編集', '通常購入用編集リストの基本権限'),
      @('`remodel_edit_list`', 'リモデル編集リスト一覧・作成・入場・編集', 'リモデル用編集リストの基本権限'),
      @('`normal_purchase`', '通常編集リスト起点RFQ作成', '通常購入RFQを作成する追加権限'),
      @('`remodel_purchase`', 'リモデル編集リスト起点RFQ作成', 'リモデルRFQを作成する追加権限'),
      @('`transfer_disposal`', 'リモデル編集リスト起点の廃棄・移設申請作成', '廃棄/移設ワークフロー作成の追加権限')
    ) },
    @{ Type = 'Heading2'; Text = '作業対象施設ベースの認可' },
    @{ Type = 'Bullets'; Items = @(
      '各 API は Bearer トークン上の作業対象施設が存在し、未削除であることを確認する',
      '通常アカウントでは、作業対象施設に対する有効担当施設割当と実効 `feature_code` を都度再判定する',
      '共有システム管理者アカウントでは、作業対象施設が未削除であれば通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による認可判定をバイパスする',
      '編集リストの `list_type`、対象編集リストの未削除、クローズ済み更新不可、有効な作業ロック、廃棄・移設申請は `REMODEL` 限定といった業務制約は共有システム管理者でもバイパスしない',
      '通常アカウントで作業対象施設に対して必要な実効 `feature_code` がない場合は 403 を返却する',
      '作業対象施設が存在しない、または削除済みの場合は 404 を返却する'
    ) },
    @{ Type = 'Heading2'; Text = '作業ロック共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '既存編集リストを開く時点で `POST /edit-lists/{editListId}/lock` を呼び出し、作業ロックを取得する',
      '有効な他ユーザーロックがある場合、編集リスト画面へ入場できない。APIは作業中ユーザー名、開始時刻、有効期限を返す',
      '明細取得APIと編集リスト更新系APIは有効な `lockToken` を必須とする',
      'heartbeatまたは編集系API成功時に `last_heartbeat_at` と `lock_expires_at` を更新し、有効期限を60分後へ延長する',
      '強制解除APIは提供しない。通信断やブラウザ放置は期限切れで解除扱いとする',
      'タスク管理側で既存RFQを進行・削除するAPIは編集リスト作業ロックの対象外とする'
    ) },
    @{ Type = 'Heading2'; Text = '共通エラーレスポンス' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けメッセージ'),
      @('details', 'string[]', '-', '入力項目単位のエラーや補足情報'),
      @('traceId', 'string', '-', '調査用トレースID')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API一覧' },
    @{ Type = 'Table'; Headers = @('No', 'API名', 'Method', 'Path', '用途', '主権限'); Rows = @(
      @('23-01', '編集リスト一覧取得', 'GET', '/edit-lists', '通常/リモデル編集リスト候補表示', 'normal_edit_list / remodel_edit_list'),
      @('23-02', '編集リスト新規作成', 'POST', '/edit-lists', '編集リスト作成と原本コピー', 'normal_edit_list / remodel_edit_list'),
      @('23-03', '編集リスト削除', 'DELETE', '/edit-lists/{editListId}', '編集リスト論理削除', 'normal_edit_list / remodel_edit_list'),
      @('23-04', '作業ロック取得', 'POST', '/edit-lists/{editListId}/lock', '既存編集リスト入場ロック', 'normal_edit_list / remodel_edit_list'),
      @('23-05', '作業ロックheartbeat', 'POST', '/edit-lists/{editListId}/lock/heartbeat', '作業ロック延長', 'normal_edit_list / remodel_edit_list'),
      @('23-06', '作業ロック解除', 'DELETE', '/edit-lists/{editListId}/lock', '画面離脱/ログアウト時解除', 'normal_edit_list / remodel_edit_list'),
      @('23-07', '編集リスト明細取得', 'GET', '/edit-lists/{editListId}/items', 'ヘッダー、列、明細、リンク状態取得', 'normal_edit_list / remodel_edit_list'),
      @('23-08', '編集リスト明細追加', 'POST', '/edit-lists/{editListId}/items', '新規要望、更新、増設、手動/見積由来行追加', 'normal_edit_list / remodel_edit_list'),
      @('23-09', 'セル編集保存', 'PATCH', '/edit-lists/{editListId}/items/{editListItemId}', '単一明細更新', 'normal_edit_list / remodel_edit_list'),
      @('23-10', '一括編集保存', 'PATCH', '/edit-lists/{editListId}/items/bulk', '選択明細一括更新', 'normal_edit_list / remodel_edit_list'),
      @('23-11', '行順変更', 'PATCH', '/edit-lists/{editListId}/items/reorder', 'row_no保存', 'normal_edit_list / remodel_edit_list'),
      @('23-12', '編集リスト明細削除', 'DELETE', '/edit-lists/{editListId}/items/{editListItemId}', '明細論理削除', 'normal_edit_list / remodel_edit_list'),
      @('23-13', 'フリーカラム一覧取得', 'GET', '/edit-lists/{editListId}/free-columns', 'フリーカラム定義取得', 'normal_edit_list / remodel_edit_list'),
      @('23-14', 'フリーカラム追加', 'POST', '/edit-lists/{editListId}/free-columns', 'フリーカラム定義追加', 'normal_edit_list / remodel_edit_list'),
      @('23-15', 'フリーカラム名更新', 'PATCH', '/edit-lists/{editListId}/free-columns/{freeColumnId}', 'フリーカラム表示名更新', 'normal_edit_list / remodel_edit_list'),
      @('23-16', 'フリーカラム削除', 'DELETE', '/edit-lists/{editListId}/free-columns/{freeColumnId}', 'フリーカラムと値の論理削除', 'normal_edit_list / remodel_edit_list'),
      @('23-17', 'Data Linkプレビュー', 'POST', '/edit-lists/{editListId}/data-link/preview', '転記差分プレビュー', 'normal_edit_list / remodel_edit_list'),
      @('23-18', 'Data Link適用', 'POST', '/edit-lists/{editListId}/data-link/apply', '作業値への転記反映', 'normal_edit_list / remodel_edit_list'),
      @('23-19', '見積DB Link候補取得', 'GET', '/edit-lists/{editListId}/quotation-link/candidates', 'RFQ/見積明細候補取得', 'normal_edit_list / remodel_edit_list'),
      @('23-20', '見積DB Link適用', 'POST', '/edit-lists/{editListId}/quotation-link/apply', '1対1紐付け、転記、新規行追加', 'normal_edit_list / remodel_edit_list'),
      @('23-21', '見積DB Link解除', 'DELETE', '/edit-lists/{editListId}/quotation-link/{editListItemId}', '見積明細リンク解除', 'normal_edit_list / remodel_edit_list'),
      @('23-22', '廃棄・移設申請一括作成', 'POST', '/edit-lists/{editListId}/applications/disposal-transfer', 'リモデル廃棄/移設ワークフロー作成', 'remodel_edit_list + transfer_disposal'),
      @('23-23', '廃棄申請個別作成', 'POST', '/edit-lists/{editListId}/applications/disposal', '廃棄対象だけの互換/個別作成', 'remodel_edit_list + transfer_disposal'),
      @('23-24', '移設申請個別作成', 'POST', '/edit-lists/{editListId}/applications/transfer', '移設対象だけの互換/個別作成', 'remodel_edit_list + transfer_disposal'),
      @('23-25', 'RFQグループ作成', 'POST', '/edit-lists/{editListId}/rfq-groups', '編集リスト選択行からRFQ作成', 'normal_purchase / remodel_purchase'),
      @('23-26', '表示カラム設定取得', 'GET', '/user-column-settings?screenId=edit_list', '表示/非表示とブックマーク取得', '編集リスト入口権限'),
      @('23-27', '表示カラム設定保存', 'PUT', '/user-column-settings?screenId=edit_list', '現在の表示/非表示保存', '編集リスト入口権限'),
      @('23-28', '表示カラムブックマーク保存', 'POST', '/user-column-setting-presets', '表示カラムブックマーク作成', '編集リスト入口権限'),
      @('23-29', '表示カラムブックマーク適用', 'POST', '/user-column-setting-presets/{presetId}/apply', 'ブックマーク適用', '編集リスト入口権限'),
      @('23-30', '表示カラムブックマーク削除', 'DELETE', '/user-column-setting-presets/{presetId}', 'ブックマーク論理削除', '編集リスト入口権限')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 機能設計' },
    @{ Type = 'EndpointBlocks'; Items = $endpointBlocks },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '責務境界' },
    @{ Type = 'Bullets'; Items = @(
      '資産詳細/資産カルテ参照は No.12 資産一覧・資産詳細 API を利用し、本書では新規APIを定義しない',
      '購入管理タブの申請受付一覧から行う通常編集リスト新規作成・購入申請取り込み、および既存通常編集リストへの購入申請取り込みは No.25 購入管理 API を正本とする。ただし既存編集リストへの取り込みは編集リスト作業ロックの `lockToken` 検証対象とする',
      'リモデルダッシュボード、リモデル管理一覧、廃棄/移動承認ワークフローの進行、リモデルクローズと原本反映は No.24 リモデル管理 API を正本とする',
      'タスク管理側で既存RFQを進行・削除するAPIは編集リスト作業ロックの対象外とし、作業ロック中でも実行できる',
      '`API連携` は本書の対象外とし、新規エンドポイントを定義しない。連携仕様を定義する場合は、連携先、同期方向、認証方式、更新対象カラム、監査要否を確定する',
      '`Excel/PDF出力` と `印刷` は本書の対象外とし、帳票/ファイル生成APIを新設しない。帳票出力をAPI化する場合は、出力形式、対象範囲、列設定反映有無、監査要否を定義する'
    ) },
    @{ Type = 'Heading2'; Text = '保存境界' },
    @{ Type = 'Bullets'; Items = @(
      '画面全体の一括保存APIは設けない。セル編集、一括編集、Data Link適用、見積DB Link適用、フリーカラム、行順変更、行削除、インライン登録の各API成功を保存点とする',
      'チェックボックスの選択状態はクライアント内一時状態であり、DB保存しない。実行APIは `editListItemIds[]` を受け取る',
      '検索、ソート、列内フィルター、列順、列幅は画面内一時状態であり保存しない。表示/非表示とブックマークだけを `user_column_settings` 系APIで保存する',
      '通常セル編集、Data Link、見積DB Linkでは原本 `asset_ledgers`、申請正本、見積正本を直接更新しない'
    ) },
    @{ Type = 'Heading2'; Text = '明細ソースと生成行' },
    @{ Type = 'Bullets'; Items = @(
      '`BASE_ASSET` は編集リスト作成時に対象施設の原本資産をコピーした明細で、`source_asset_ledger_id` を必須とする',
      '`APPLICATION` は購入申請由来の明細で、`source_application_id` と `source_application_asset_id` を必須とする。インライン新規要望も登録時に申請正本を作成するため `APPLICATION` として扱う',
      '`MANUAL` は更新/増設など編集リスト内で生成した明細で、外部参照元IDを必須にしない',
      '`QUOTATION` は見積DB Linkの未紐付け見積明細から追加した明細で、`source_quotation_item_id` と `quotation_item_application_links` で出所を追跡する',
      '`MANUAL` / `QUOTATION` の生成行は、QRコード、固定資産番号、管理機器番号、シリアル番号などの個体識別子を引き継がない',
      '画面上の `asset.no` や `90000 + index` は表示・選択用の一時識別子であり、API/DB正本キーは `edit_list_item_id` とする'
    ) },
    @{ Type = 'Heading2'; Text = 'RFQ・廃棄・移設ルール' },
    @{ Type = 'Bullets'; Items = @(
      'RFQ No.は作成確定時だけサーバー採番し、キャンセル/閉じるでは採番予約やRFQヘッダ作成を行わない',
      'リモデルRFQでは購入系の `NEW` / `REPLACE` / `ADDITION` 行だけを対象とし、廃棄予定、移設、方針未設定、申請済み行は行単位でスキップする',
      '同じ編集リスト明細に複数RFQを紐づけることは許容し、編集リスト上のRFQ No./グループ名は最新作成分で上書き表示する',
      '廃棄/移設申請はリモデル編集リスト限定とし、通常編集リストからの作成を拒否する',
      '廃棄/移設ワークフローの表示番号は `rfqs.rfq_no` として、廃棄は `DISP-yyyyMMdd-nnnn`、移設は `TRAN-yyyyMMdd-nnnn` をサーバー採番する',
      '同一編集リスト明細・同一 `workflow_type` の有効リンクが既に存在する場合は、行単位でスキップする'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTPステータス', '内容', '発生条件'); Rows = $commonErrorRows },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = 'データ保守方針' },
    @{ Type = 'Bullets'; Items = @(
      '編集リスト作成時点の原本コピーは作業スナップショットとして保持し、後続の通常編集では原本へ自動反映しない',
      '編集リスト明細の過剰なセル単位変更履歴テーブルは設けず、通常編集は `updated_by_user_id` / `updated_at`、削除は `deleted_at`、業務結果に影響する操作は各業務テーブル・状態履歴で追跡する',
      '作業ロックの取得、heartbeat、自動解除は監査テーブル化せず、アプリケーションログで扱う',
      '解除済みまたは期限切れの `edit_list_work_locks` は長期保管せず、定期削除対象とする',
      '削除済み編集リストは選択候補・編集対象から除外するが、既存RFQ、申請、見積、履歴からの参照は保持する'
    ) },
    @{ Type = 'Heading2'; Text = '拡張時の留意点' },
    @{ Type = 'Bullets'; Items = @(
      'API連携を実装する場合は、連携先、同期方向、認証方式、更新対象カラム、監査要否を確定してから別APIとして追加する',
      '帳票/ファイル生成を実装する場合は、出力形式、対象範囲、表示カラム設定反映有無、ジョブ管理、再出力条件を運用設計と合わせて定義する',
      '作業ロックの強制解除を追加する場合は、クライアント合意済みの排他方針に反するため、権限、監査、通知、編集中データの扱いを再合意する',
      'Data Linkの転記元を増やす場合は、source→targetマッピング、空値上書き可否、曖昧一致時の扱いをサーバー定義として追加する',
      '見積DB Linkの自動マッチング精度を上げる場合でも、有効リンクの1対1制約と `quotation_item_application_links` の差し替えルールは維持する'
    ) }
  )
}
