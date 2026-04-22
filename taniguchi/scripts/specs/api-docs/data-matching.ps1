$surveyLedgerMatchingPermissionLines = @(
  '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること'
)

$commonFilterParameterRows = @(
  @('departmentName', 'query', 'string', '-', '共通部門名の完全一致条件'),
  @('sectionName', 'query', 'string', '-', '共通部署名の完全一致条件'),
  @('categoryId', 'query', 'int64', '-', 'カテゴリID'),
  @('largeClassId', 'query', 'int64', '-', '大分類ID'),
  @('mediumClassId', 'query', 'int64', '-', '中分類ID'),
  @('assetItemId', 'query', 'int64', '-', '品目ID'),
  @('manufacturerId', 'query', 'int64', '-', 'メーカーID'),
  @('modelId', 'query', 'int64', '-', '型式ID'),
  @('keyword', 'query', 'string', '-', '資産番号 / ME番号 / 品目 / メーカー / 型式の部分一致条件'),
  @('matchMode', 'query', 'string', '-', '一致検索種別。`NONE` / `CATEGORY` / `ASSET_NO` / `LARGE_CLASS` / `ASSET_ITEM` / `MANUFACTURER`')
)

$cursorPaginationParameterRows = @(
  @('cursor', 'query', 'string', '-', '既定ソート順の続き位置を表す continuation token'),
  @('pageSize', 'query', 'int32', '-', '取得件数。`1-500`、既定値 `100`')
)

$listLockVersionParameterRows = @(
  @('lockVersion', 'query', 'int64', '-', '一覧取得中の snapshot 固定に用いる session lock version。初回要求では省略可')
)

$mutationIdempotencyHeaderRows = @(
  @('Idempotency-Key', 'header', 'string', '✓', '更新系 API の冪等性キー。同一 `sessionId` + 実行ユーザー + API パスで一意に扱う')
)

$apiListRows = @(
  @('画面コンテキスト取得', 'GET', '/data-matching/context', '対象施設、進行中セッション、統合対象一覧、件数サマリ、フィルタ候補を取得する', '要'),
  @('データ突合セッション開始', 'POST', '/data-matching/sessions', '進行中セッションを再開または新規開始し、統合対象リストを確定する', '要'),
  @('統合リスト一覧取得', 'GET', '/data-matching/sessions/{sessionId}/merged-items', '上パネルの統合リスト一覧、進捗、タブ別件数を取得する', '要'),
  @('固定資産台帳（対応中）一覧取得', 'GET', '/data-matching/sessions/{sessionId}/fixed-asset-ledger-items', '固定資産台帳側の対応中一覧と件数サマリを取得する', '要'),
  @('ME管理台帳（対応中）一覧取得', 'GET', '/data-matching/sessions/{sessionId}/me-ledger-items', 'ME管理台帳側の対応中一覧と件数サマリを取得する', '要'),
  @('突合結果登録', 'POST', '/data-matching/sessions/{sessionId}/matches', '完全一致 / 部分一致 / 数量不一致 / 再確認を登録する', '要'),
  @('未登録確定', 'POST', '/data-matching/sessions/{sessionId}/mark-unregistered', '現有品側のみ存在する項目を未登録として確定する', '要'),
  @('未確認確定', 'POST', '/data-matching/sessions/{sessionId}/mark-unconfirmed', '台帳側のみ存在する項目を未確認として確定する', '要'),
  @('判定差し戻し', 'POST', '/data-matching/sessions/{sessionId}/revert-decision', '現在リストに対する判定を差し戻し、必要に応じて論理統合を復元する', '要'),
  @('突合完了 / 原本確定', 'POST', '/data-matching/sessions/{sessionId}/complete', '現在リスト完了または原本リスト確定を実行する', '要'),
  @('統合結果一覧取得', 'GET', '/data-matching/sessions/{sessionId}/result', '原本リストモーダル用の統合結果一覧を取得する', '要')
)

$endpointSpecs = @(
  @{
    Title = '画面コンテキスト取得（/data-matching/context）'
    Overview = 'データ突合画面の初期表示に必要な対象施設、進行中セッション、統合対象一覧、件数サマリ、共通フィルタ候補を取得する。進行中セッションがある場合はその再開情報を返し、ない場合は新規開始可能な候補一覧を返却する。'
    Method = 'GET'
    Path = '/data-matching/context'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('facilityId', 'query', 'int64', '条件付き', '対象施設ID。Bearer トークンから作業対象施設を導出できる場合は省略可能')
    )
    PermissionLines = $surveyLedgerMatchingPermissionLines
    ProcessingLines = @(
      '`facilityId` 省略時は Bearer トークン上の作業対象施設IDを採用し、指定時はそれと一致することを検証する',
      '対象施設が `facilities.deleted_at IS NULL` の未削除施設であることを検証する',
      '同一施設に `asset_data_matching_sessions.session_status=''IN_PROGRESS''` のセッションが存在する場合は、そのセッションと配下 `asset_data_matching_session_lists` / `asset_data_matching_items` / `asset_data_matching_item_list_results` を返却する',
      '進行中セッションがある場合は、`source_type=''IMPORT_JOB'' AND merge_status=''PENDING''` のうち `source_order` 最小の 1 件を現在処理対象リストとし、判定登録 / `COMPLETE_LIST` は当該リストに対してのみ許可する',
      '進行中セッションが存在しない場合は、最新の確定済み現有品調査セッションを基底候補とし、`asset_import_jobs.status=''MATCHING_COMPLETED''` の整形済み台帳リストを統合候補として返却する',
      'フィルタ候補は、進行中セッションがある場合は現在の統合リストと未完了対象リストから、未開始の場合は基底調査データと統合候補リストから算出する',
      '`canConfirmOriginal` は進行中セッションがあり、かつ現在の `asset_data_matching_items` が原本確定必須項目と QR 解決・紐付け可否の両方を満たす場合に true を返し、途中確定ボタン活性判定に利用する'
    )
    ResponseTitle = 'レスポンス（200：DataMatchingContextResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('selectedFacility', 'FacilitySummary', '✓', '対象施設'),
      @('surveyBase', 'SurveyBaseSummary|null', '✓', '基底となる現有品調査セッション要約。見つからない場合は null'),
      @('activeSession', 'DataMatchingSessionSummary|null', '✓', '進行中セッション。存在しない場合は null'),
      @('currentMergedSummary', 'DataMatchingMergedSummary|null', '✓', '現在の統合リスト件数サマリ。進行中セッションがない場合は null'),
      @('targetLists', 'DataMatchingTargetList[]', '✓', '統合対象一覧。進行中セッションがある場合はその session list、ない場合は新規開始候補'),
      @('filterOptions', 'DataMatchingFilterOptions', '✓', '共通フィルタ候補'),
      @('canStartSession', 'boolean', '✓', '新規セッション開始可能な場合は true'),
      @('canConfirmOriginal', 'boolean', '✓', '原本直前スナップショットが原本確定必須項目と QR 解決・紐付け可否を満たす場合は true')
    )
    ResponseSubtables = @(
      @{
        Title = 'selectedFacility（FacilitySummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('facilityId', 'int64', '✓', '施設ID'),
          @('facilityName', 'string', '✓', '施設名')
        )
      },
      @{
        Title = 'surveyBase（SurveyBaseSummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('assetSurveySessionId', 'int64', '✓', '基底に採用する現有品調査セッションID'),
          @('sourceLabel', 'string', '✓', '画面表示用ラベル。例: `現有品調査リスト_2026-04-20`'),
          @('recordCount', 'int32', '✓', '基底調査レコード件数'),
          @('createdAt', 'datetime', '✓', '調査セッション作成日時')
        )
      },
      @{
        Title = 'activeSession（DataMatchingSessionSummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('sessionId', 'int64', '✓', 'データ突合セッションID'),
          @('sessionStatus', 'string', '✓', 'セッション状態。`IN_PROGRESS` / `CONFIRMED`'),
          @('lockVersion', 'int64', '✓', '更新競合検知と一覧 snapshot 固定に用いる `asset_data_matching_sessions.lock_version`'),
          @('sessionUpdatedAt', 'datetime', '✓', 'セッション最終更新日時'),
          @('createdByUserId', 'int64', '✓', 'セッション作成者ユーザーID'),
          @('createdAt', 'datetime', '✓', 'セッション作成日時'),
          @('confirmedAt', 'datetime', '-', '原本確定日時。`CONFIRMED` 時のみ設定'),
          @('pendingListCount', 'int32', '✓', '未完了の統合対象リスト件数'),
          @('completedListCount', 'int32', '✓', '完了済み統合対象リスト件数')
        )
      },
      @{
        Title = 'currentMergedSummary（DataMatchingMergedSummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('mergedItemCount', 'int32', '✓', '`merged_into_item_id IS NULL AND item_status=''ACTIVE''` の現在有効な統合リスト行数'),
          @('sourceListLabels', 'string[]', '✓', 'すでに統合済みのリスト表示名'),
          @('remainingListCount', 'int32', '✓', '未完了リスト件数'),
          @('unreadyItemCount', 'int32', '✓', '原本確定を阻害している統合リスト行件数（必須項目不足または QR 阻害）'),
          @('qrBlockingItemCount', 'int32', '✓', 'QR 解決または QR 紐付け可否が原因で原本確定を阻害している統合リスト行件数')
        )
      },
      @{
        Title = 'targetLists要素（DataMatchingTargetList）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('sessionListId', 'int64|null', '✓', '進行中セッション配下の統合対象リストID。未開始時は null'),
          @('listType', 'string', '✓', '論理リスト種別。`FIXED_ASSET` / `ME_LEDGER` / `OTHER_LEDGER` / `SURVEY_BASE`'),
          @('assetImportJobId', 'int64|null', '✓', '対応する資産インポートジョブID。調査基底行は null'),
          @('sourceLabel', 'string', '✓', '画面表示用リスト名'),
          @('recordCount', 'int32', '✓', 'リスト件数'),
          @('sourceOrder', 'int32', '✓', '統合順'),
          @('mergeStatus', 'string', '✓', 'リスト状態。`BASE_LOADED` / `PENDING` / `COMPLETED` / `SKIPPED`'),
          @('createdAt', 'datetime', '✓', 'リスト作成日時'),
          @('createdBy', 'string', '-', '画面表示用作成者名')
        )
      },
      @{
        Title = 'filterOptions（DataMatchingFilterOptions）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('departmentNames', 'string[]', '✓', '共通部門候補'),
          @('sectionNames', 'string[]', '✓', '共通部署候補'),
          @('categories', 'MasterOption[]', '✓', 'カテゴリ候補'),
          @('largeClasses', 'MasterOption[]', '✓', '大分類候補'),
          @('mediumClasses', 'MasterOption[]', '✓', '中分類候補'),
          @('assetItems', 'MasterOption[]', '✓', '品目候補'),
          @('manufacturers', 'MasterOption[]', '✓', 'メーカー候補'),
          @('models', 'MasterOption[]', '✓', '型式候補')
        )
      },
      @{
        Title = 'categories / largeClasses / mediumClasses / assetItems / manufacturers / models 要素（MasterOption）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('id', 'int64', '✓', 'マスタID'),
          @('label', 'string', '✓', '画面表示用名称')
        )
      }
    )
    StatusRows = @(
      @('200', '取得成功', 'DataMatchingContextResponse'),
      @('400', 'facilityId 不正など入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `survey_ledger_matching` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象施設が存在しない、または削除済み', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = 'データ突合セッション開始（/data-matching/sessions）'
    Overview = 'データ突合セッションを開始する。既存の進行中セッションがあればそれを返し、なければ現有品調査を基底に新規セッションを作成して統合対象リストを確定する。'
    Method = 'POST'
    Path = '/data-matching/sessions'
    Auth = '要（Bearer）'
    RequestTitle = 'リクエストボディ'
    RequestHeaders = @('フィールド', '型', '必須', '説明')
    RequestRows = @(
      @('facilityId', 'int64', '条件付き', '対象施設ID。Bearer トークンから作業対象施設を導出できる場合は省略可能')
    )
    PermissionLines = $surveyLedgerMatchingPermissionLines
    ProcessingLines = @(
      '`facilityId` 省略時は Bearer トークン上の作業対象施設IDを採用し、指定時はそれと一致することを検証する',
      '同一施設に `session_status=''IN_PROGRESS''` の `asset_data_matching_sessions` が存在する場合は新規作成せず、その既存セッションを再開結果として返却する',
      '進行中セッションがない場合は、最新の確定済み現有品調査セッションを基底 `asset_data_matching_session_lists.source_type=''SURVEY_BASE''` として登録する',
      '`asset_import_jobs.status=''MATCHING_COMPLETED''` の整形済み台帳リストを取得し、固定資産台帳 -> ME管理台帳 -> その他の表示順優先度と `created_at ASC` で `asset_data_matching_session_lists` に初期登録する',
      '`source_type=''IMPORT_JOB'' AND merge_status=''PENDING''` のうち `source_order` 最小の 1 件を現在処理対象リストとし、以後の判定登録はこの順序でのみ許可する',
      '基底調査レコードごとに `asset_data_matching_items` を作成し、`creation_type=''SURVEY_BASE''`、`item_status=''ACTIVE''` を設定する。元レコードは `asset_data_matching_item_sources` に `source_type=''SURVEY_RECORD''` として登録し、`active_survey_record_key` を設定して有効統合リスト行の代表元重複を禁止する',
      '初期生成時の `qr_identifier` / `qr_resolution_status` は基底調査レコードの `asset_survey_records.qr_identifier` から設定し、QRありなら `RESOLVED`、QRなしなら `NONE` とする',
      '新規作成は 1 トランザクションで実行し、施設単位の `IN_PROGRESS` 一意制約で同時開始競合を吸収する',
      '新規作成時は `currentMergedSummary.sourceListLabels` に基底調査リストのみを設定し、`asset_data_matching_sessions.lock_version=0` と `updated_at` を返却する。以後の競合検知は `lockVersion`、`updated_at` は監査用の最終更新日時として扱う'
    )
    ResponseTitle = 'レスポンス（200 / 201：DataMatchingSessionStartResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('sessionId', 'int64', '✓', 'データ突合セッションID'),
      @('createdNew', 'boolean', '✓', '新規作成時は true、既存再開時は false'),
      @('sessionStatus', 'string', '✓', 'セッション状態。通常は `IN_PROGRESS`'),
      @('lockVersion', 'int64', '✓', '更新競合検知と一覧 snapshot 固定に用いる `asset_data_matching_sessions.lock_version`'),
      @('sessionUpdatedAt', 'datetime', '✓', 'セッション最終更新日時'),
      @('mergedItemCount', 'int32', '✓', '`merged_into_item_id IS NULL AND item_status=''ACTIVE''` の現在有効な統合リスト件数'),
      @('sourceListLabels', 'string[]', '✓', '統合済みリスト表示名'),
      @('targetLists', 'DataMatchingTargetList[]', '✓', '確定した統合対象一覧'),
      @('canConfirmOriginal', 'boolean', '✓', '原本直前スナップショットが原本確定必須項目と QR 解決・紐付け可否を満たす場合は true')
    )
    ResponseSubtables = @(
      @{
        Title = 'targetLists要素（DataMatchingTargetList）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('sessionListId', 'int64', '✓', '統合対象リストID'),
          @('listType', 'string', '✓', '論理リスト種別。`SURVEY_BASE` / `FIXED_ASSET` / `ME_LEDGER` / `OTHER_LEDGER`'),
          @('assetImportJobId', 'int64|null', '✓', '対応する資産インポートジョブID'),
          @('sourceLabel', 'string', '✓', '画面表示用リスト名'),
          @('recordCount', 'int32', '✓', '対象件数'),
          @('sourceOrder', 'int32', '✓', '統合順'),
          @('mergeStatus', 'string', '✓', 'リスト状態')
        )
      }
    )
    StatusRows = @(
      @('200', '既存進行中セッションを再開', 'DataMatchingSessionStartResponse'),
      @('201', '新規セッション作成成功', 'DataMatchingSessionStartResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `survey_ledger_matching` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象施設、または基底に使える現有品調査セッションが存在しない', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '統合リスト一覧取得（/data-matching/sessions/{sessionId}/merged-items）'
    Overview = '現在の統合リストを取得する。選択中リストに対する `対応中` / `対応済み` タブ、共通フィルタ、一致検索を反映した上パネル表示に利用する。'
    Method = 'GET'
    Path = '/data-matching/sessions/{sessionId}/merged-items'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('sessionId', 'path', 'int64', '✓', 'データ突合セッションID'),
      @('sessionListId', 'query', 'int64', '✓', '現在突合中の統合対象リストID'),
      @('tab', 'query', 'string', '-', '取得対象タブ。`PENDING` / `COMPLETED`。既定値は `PENDING`')
    ) + $commonFilterParameterRows + $listLockVersionParameterRows + $cursorPaginationParameterRows
    PermissionLines = $surveyLedgerMatchingPermissionLines
    ProcessingLines = @(
      '対象 `sessionId` が Bearer トークン上の作業対象施設と同一施設に属する `IN_PROGRESS` セッションであることを検証する',
      '`sessionListId` が当該セッション配下の `source_type=''IMPORT_JOB''` であり、`merge_status=''PENDING''` または `''COMPLETED''` であることを検証する',
      '初回要求で `lockVersion` 省略時は現在の `asset_data_matching_sessions.lock_version` を当該一覧の snapshot version として採用する。指定時は `cursor` に埋め込まれた `lockVersion` と一致し、かつ `session_status=''IN_PROGRESS''` の間は現在の `lock_version` と一致することを検証する。不一致時は 409 (`LIST_SNAPSHOT_EXPIRED`) を返却する',
      '`asset_data_matching_items` のうち `merged_into_item_id IS NULL AND item_status=''ACTIVE''` の有効行を対象に、`asset_data_matching_item_list_results.result_status=''ACTIVE''` を `sessionListId` で突合し、選択中リストに対する `matchingStatus`・`decisionNote`・完了済み判定・進捗件数を算出する',
      '`tab=''PENDING''` では `result_status=''ACTIVE''` の判定結果が存在しない統合リスト行のみ、`tab=''COMPLETED''` では当該リストに対する有効判定結果行が存在する統合リスト行のみを返却する',
      '共通フィルタは `department_name` / `section_name` と各種マスタID列に対して適用する',
      '一致検索は選択中リストの未完了台帳行と比較し、カテゴリ / 資産番号 / 大分類 / 品目 / メーカーの一致候補のみを残す',
      '`cursor` 指定時は既定ソート順と `lockVersion` を固定した snapshot の続き位置から取得し、`pageSize` 件を上限に返却する',
      '返却順は `department_name ASC, section_name ASC, asset_item_name ASC, asset_data_matching_item_id ASC` を既定とする'
    )
    ResponseTitle = 'レスポンス（200：DataMatchingMergedItemListResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('sessionId', 'int64', '✓', 'データ突合セッションID'),
      @('lockVersion', 'int64', '✓', '今回返却した一覧 snapshot の `asset_data_matching_sessions.lock_version`'),
      @('sessionUpdatedAt', 'datetime', '✓', 'セッション最終更新日時'),
      @('currentList', 'CurrentListSummary', '✓', '現在突合中リストの要約'),
      @('progress', 'MatchingProgressSummary', '✓', '進捗件数 / 進捗率'),
      @('totalCount', 'int32', '✓', '条件一致した有効統合リスト総件数'),
      @('returnedCount', 'int32', '✓', '今回返却した items 件数'),
      @('nextCursor', 'string|null', '✓', '次ページ取得用 continuation token。末尾まで取得済みの場合は null'),
      @('hasMore', 'boolean', '✓', '続きが存在する場合は true'),
      @('items', 'MergedItemSummary[]', '✓', '統合リスト一覧')
    )
    ResponseSubtables = @(
      @{
        Title = 'currentList（CurrentListSummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('sessionListId', 'int64', '✓', '統合対象リストID'),
          @('listType', 'string', '✓', '論理リスト種別'),
          @('sourceLabel', 'string', '✓', '画面表示用リスト名'),
          @('mergeStatus', 'string', '✓', 'リスト状態')
        )
      },
      @{
        Title = 'progress（MatchingProgressSummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('totalItems', 'int32', '✓', '現在リストに対して判定対象となる統合リスト総件数'),
          @('completedItems', 'int32', '✓', '現在リストに対して判定済みの統合リスト件数'),
          @('pendingItems', 'int32', '✓', '現在リストに対して未判定の統合リスト件数'),
          @('progressPercent', 'int32', '✓', '進捗率（0-100）')
        )
      },
      @{
        Title = 'items要素（MergedItemSummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('assetDataMatchingItemId', 'int64', '✓', '統合リスト行ID'),
          @('matchingStatus', 'string|null', '✓', '選択中リストに対する突合状況。`FULL_MATCH` / `PARTIAL_MATCH` / `QUANTITY_MISMATCH` / `RECHECK` / `UNCONFIRMED` / `UNREGISTERED`'),
          @('creationType', 'string', '✓', '行生成起点。`SURVEY_BASE` / `UNCONFIRMED_IMPORT`'),
          @('qrIdentifier', 'string', '-', 'QR識別子'),
          @('assetNo', 'string', '-', '資産番号'),
          @('equipmentNo', 'string', '-', 'ME番号'),
          @('departmentName', 'string', '✓', '共通部門名'),
          @('sectionName', 'string', '✓', '共通部署名'),
          @('roomName', 'string', '-', '室名'),
          @('categoryName', 'string', '-', 'カテゴリ名'),
          @('largeClassName', 'string', '-', '大分類名'),
          @('mediumClassName', 'string', '-', '中分類名'),
          @('assetItemName', 'string', '-', '品目名'),
          @('manufacturerName', 'string', '-', 'メーカー名'),
          @('modelName', 'string', '-', '型式名'),
          @('detailType', 'string|null', '✓', '明細区分。`MAIN` / `DETAIL` / `ACCESSORY`'),
          @('parentAssetDataMatchingItemId', 'int64|null', '✓', '親統合リスト行ID'),
          @('quantity', 'int32', '✓', '数量'),
          @('purchasedOn', 'date', '-', '購入日'),
          @('sourceSummary', 'string', '-', '統合元サマリ'),
          @('decisionNote', 'string', '-', '選択中リストに対する有効判定メモ'),
          @('completedForCurrentList', 'boolean', '✓', '現在リストに対して判定済みなら true')
        )
      }
    )
    StatusRows = @(
      @('200', '取得成功', 'DataMatchingMergedItemListResponse'),
      @('400', 'tab / フィルタ条件不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `survey_ledger_matching` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象セッションまたは対象統合リストが存在しない', 'ErrorResponse'),
      @('409', 'セッションが `CONFIRMED` など取得不可状態である、または一覧 snapshot の `lockVersion` が失効した', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '固定資産台帳（対応中）一覧取得（/data-matching/sessions/{sessionId}/fixed-asset-ledger-items）'
    Overview = '選択中の固定資産台帳リストに対する対応中一覧と件数サマリを取得する。`/data-matching` 下パネルおよび参考画面 `/data-matching/ledger` の表示に利用する。'
    Method = 'GET'
    Path = '/data-matching/sessions/{sessionId}/fixed-asset-ledger-items'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('sessionId', 'path', 'int64', '✓', 'データ突合セッションID'),
      @('sessionListId', 'query', 'int64', '✓', '現在突合中の固定資産台帳リストID')
    ) + $commonFilterParameterRows + $listLockVersionParameterRows + $cursorPaginationParameterRows
    PermissionLines = $surveyLedgerMatchingPermissionLines
    ProcessingLines = @(
      '対象セッションと `sessionListId` の施設整合を検証し、対象 list が固定資産台帳系の整形済みリストであることを検証する',
      '初回要求で `lockVersion` 省略時は現在の `asset_data_matching_sessions.lock_version` を当該一覧の snapshot version として採用する。指定時は `cursor` に埋め込まれた `lockVersion` と一致し、かつ `session_status=''IN_PROGRESS''` の間は現在の `lock_version` と一致することを検証する。不一致時は 409 (`LIST_SNAPSHOT_EXPIRED`) を返却する',
      '対象 `asset_import_job_id` 配下の `asset_import_rows` から、`asset_data_matching_item_list_results.result_status=''ACTIVE''` に未登録の行のみを `items` として返却する',
      '`matchedCount` は当該 `sessionListId` の有効 `asset_data_matching_item_list_results.asset_import_row_id` 件数、`pendingCount` は未処理行数として算出する',
      '共通フィルタおよび一致検索条件は上パネルと同じ条件を適用し、下パネル候補を同期表示する',
      '`cursor` 指定時は既定ソート順と `lockVersion` を固定した snapshot の続き位置から取得し、`pageSize` 件を上限に返却する',
      '返却順は `parsed_ledger_no ASC, asset_import_row_id ASC` を既定とする'
    )
    ResponseTitle = 'レスポンス（200：FixedAssetLedgerItemListResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('sessionId', 'int64', '✓', 'データ突合セッションID'),
      @('sessionListId', 'int64', '✓', '統合対象リストID'),
      @('lockVersion', 'int64', '✓', '今回返却した一覧 snapshot の `asset_data_matching_sessions.lock_version`'),
      @('sessionUpdatedAt', 'datetime', '✓', 'セッション最終更新日時'),
      @('totalCount', 'int32', '✓', '対象リスト総件数'),
      @('pendingCount', 'int32', '✓', '対応中件数'),
      @('matchedCount', 'int32', '✓', '突合済件数'),
      @('returnedCount', 'int32', '✓', '今回返却した items 件数'),
      @('nextCursor', 'string|null', '✓', '次ページ取得用 continuation token。末尾まで取得済みの場合は null'),
      @('hasMore', 'boolean', '✓', '続きが存在する場合は true'),
      @('items', 'FixedAssetLedgerItemSummary[]', '✓', '対応中一覧')
    )
    ResponseSubtables = @(
      @{
        Title = 'items要素（FixedAssetLedgerItemSummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('assetImportRowId', 'int64', '✓', '資産インポート行ID'),
          @('assetNo', 'string', '-', '資産番号'),
          @('departmentName', 'string', '-', '共通部門名'),
          @('sectionName', 'string', '-', '共通部署名'),
          @('roomName', 'string', '-', '室名'),
          @('categoryName', 'string', '-', 'カテゴリ名'),
          @('largeClassName', 'string', '-', '大分類名'),
          @('mediumClassName', 'string', '-', '中分類名'),
          @('assetItemName', 'string', '-', '品目名'),
          @('manufacturerName', 'string', '-', 'メーカー名'),
          @('modelName', 'string', '-', '型式名'),
          @('quantity', 'int32', '✓', '数量'),
          @('purchasedOn', 'date', '-', '購入日')
        )
      }
    )
    StatusRows = @(
      @('200', '取得成功', 'FixedAssetLedgerItemListResponse'),
      @('400', 'フィルタ条件不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `survey_ledger_matching` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象セッションまたは対象統合リストが存在しない', 'ErrorResponse'),
      @('409', '固定資産台帳以外のリストを指定した、または一覧 snapshot の `lockVersion` が失効した', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = 'ME管理台帳（対応中）一覧取得（/data-matching/sessions/{sessionId}/me-ledger-items）'
    Overview = '選択中のME管理台帳リストに対する対応中一覧と件数サマリを取得する。`/data-matching` 下パネルおよび参考画面 `/data-matching/me-ledger` の表示に利用する。'
    Method = 'GET'
    Path = '/data-matching/sessions/{sessionId}/me-ledger-items'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('sessionId', 'path', 'int64', '✓', 'データ突合セッションID'),
      @('sessionListId', 'query', 'int64', '✓', '現在突合中のME管理台帳リストID')
    ) + $commonFilterParameterRows + $listLockVersionParameterRows + $cursorPaginationParameterRows
    PermissionLines = $surveyLedgerMatchingPermissionLines
    ProcessingLines = @(
      '対象セッションと `sessionListId` の施設整合を検証し、対象 list がME管理台帳系の整形済みリストであることを検証する',
      '初回要求で `lockVersion` 省略時は現在の `asset_data_matching_sessions.lock_version` を当該一覧の snapshot version として採用する。指定時は `cursor` に埋め込まれた `lockVersion` と一致し、かつ `session_status=''IN_PROGRESS''` の間は現在の `lock_version` と一致することを検証する。不一致時は 409 (`LIST_SNAPSHOT_EXPIRED`) を返却する',
      '対象 `asset_import_job_id` 配下の `asset_import_rows` から、`asset_data_matching_item_list_results.result_status=''ACTIVE''` に未登録のME台帳行のみを `items` として返却する',
      '`matchedCount` は当該 `sessionListId` の有効 `asset_data_matching_item_list_results.asset_import_row_id` 件数、`pendingCount` は未処理行数として算出する',
      '共通フィルタおよび一致検索条件は上パネルと同じ条件を適用し、ME台帳候補を同期表示する',
      '`cursor` 指定時は既定ソート順と `lockVersion` を固定した snapshot の続き位置から取得し、`pageSize` 件を上限に返却する',
      '返却順は `parsed_management_device_no ASC, asset_import_row_id ASC` を既定とする'
    )
    ResponseTitle = 'レスポンス（200：MELedgerItemListResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('sessionId', 'int64', '✓', 'データ突合セッションID'),
      @('sessionListId', 'int64', '✓', '統合対象リストID'),
      @('lockVersion', 'int64', '✓', '今回返却した一覧 snapshot の `asset_data_matching_sessions.lock_version`'),
      @('sessionUpdatedAt', 'datetime', '✓', 'セッション最終更新日時'),
      @('totalCount', 'int32', '✓', '対象リスト総件数'),
      @('pendingCount', 'int32', '✓', '対応中件数'),
      @('matchedCount', 'int32', '✓', '突合済件数'),
      @('returnedCount', 'int32', '✓', '今回返却した items 件数'),
      @('nextCursor', 'string|null', '✓', '次ページ取得用 continuation token。末尾まで取得済みの場合は null'),
      @('hasMore', 'boolean', '✓', '続きが存在する場合は true'),
      @('items', 'MELedgerItemSummary[]', '✓', '対応中一覧')
    )
    ResponseSubtables = @(
      @{
        Title = 'items要素（MELedgerItemSummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('assetImportRowId', 'int64', '✓', '資産インポート行ID'),
          @('equipmentNo', 'string', '-', 'ME番号'),
          @('assetNo', 'string', '-', '資産番号'),
          @('departmentName', 'string', '-', '共通部門名'),
          @('sectionName', 'string', '-', '共通部署名'),
          @('roomName', 'string', '-', '室名'),
          @('assetItemName', 'string', '-', '品目名'),
          @('manufacturerName', 'string', '-', 'メーカー名'),
          @('modelName', 'string', '-', '型式名'),
          @('serialNo', 'string', '-', 'シリアル番号'),
          @('quantity', 'int32', '✓', '数量'),
          @('inspectionDate', 'date', '-', '点検日')
        )
      }
    )
    StatusRows = @(
      @('200', '取得成功', 'MELedgerItemListResponse'),
      @('400', 'フィルタ条件不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `survey_ledger_matching` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象セッションまたは対象統合リストが存在しない', 'ErrorResponse'),
      @('409', 'ME管理台帳以外のリストを指定した、または一覧 snapshot の `lockVersion` が失効した', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '突合結果登録（/data-matching/sessions/{sessionId}/matches）'
    Overview = '完全一致 / 部分一致 / 数量不一致 / 再確認の突合結果を登録する。上パネル複数件と下パネル1件を、要求 `representativeItemId` で指定した 1 つの代表統合リスト行へ集約する。'
    Method = 'POST'
    Path = '/data-matching/sessions/{sessionId}/matches'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('sessionId', 'path', 'int64', '✓', 'データ突合セッションID')
    ) + $mutationIdempotencyHeaderRows
    RequestTitle = 'リクエストボディ'
    RequestHeaders = @('フィールド', '型', '必須', '説明')
    RequestRows = @(
      @('lockVersion', 'int64', '✓', '取得時点の `asset_data_matching_sessions.lock_version`。競合検知に用いる'),
      @('sessionListId', 'int64', '✓', '現在突合中の統合対象リストID'),
      @('mergedItemIds', 'int64[]', '✓', '統合対象とする上パネル行ID一覧。1件以上'),
      @('representativeItemId', 'int64', '✓', '`mergedItemIds` に含まれる代表統合リスト行ID'),
      @('ledgerItemId', 'int64', '✓', '対応づける下パネルの資産インポート行ID。ちょうど1件'),
      @('matchingStatus', 'string', '✓', '登録する突合状況。`FULL_MATCH` / `PARTIAL_MATCH` / `QUANTITY_MISMATCH` / `RECHECK`'),
      @('decisionNote', 'string', '-', '当該リスト判定メモ')
    )
    PermissionLines = $surveyLedgerMatchingPermissionLines
    ProcessingLines = @(
      '対象セッションが `IN_PROGRESS` であり、`sessionListId` が未完了の統合対象リストであることを検証する',
      '`sessionListId` が `source_type=''IMPORT_JOB'' AND merge_status=''PENDING''` のうち `source_order` 最小の現在処理対象リストであることを検証し、異なる場合は 409 (`SESSION_LIST_SEQUENCE_INVALID`) を返却する',
      '要求 `lockVersion` と `asset_data_matching_sessions.lock_version` を比較し、不一致時は 409 (`SESSION_CONFLICT`) を返却する',
      '`Idempotency-Key` の再送時は、同一 `sessionId` + 実行ユーザー + API パス + 同一 payload であれば初回応答を再返却し、異なる payload なら 409 (`IDEMPOTENCY_KEY_REUSED`) を返却する',
      '`asset_data_matching_sessions` / `asset_data_matching_session_lists` / 対象 `asset_data_matching_items` / 対象 `asset_import_rows` を 1 トランザクション内で排他取得する',
      '`mergedItemIds` はすべて同一セッション配下の `merged_into_item_id IS NULL AND item_status=''ACTIVE''` な有効行であり、かつ当該リストに対する `asset_data_matching_item_list_results.result_status=''ACTIVE''` が未作成であることを検証する',
      '`representativeItemId` が `mergedItemIds` に含まれ、かつ同一セッション配下の有効統合リスト行であることを検証する',
      '`mergedItemIds` のうち代表行以外は、他 `asset_data_matching_session_list_id` 向けの `result_status=''ACTIVE''` 判定履歴を持たず、かつ他行から `parent_asset_data_matching_item_id` で参照されていないことを検証する。満たさない場合は 409 (`MERGED_ITEM_NOT_MERGEABLE`) を返却する',
      '`ledgerItemId` が当該 `sessionListId` 配下の `asset_import_rows` に属し、同一 `sessionListId` の有効 `asset_data_matching_item_list_results` で未消費であることを検証する',
      '同一 `sessionListId` 内で1回の登録に利用できる下パネル行は 1 件のみとする',
      '選択上パネル行の `detail_type` および `parent_asset_data_matching_item_id` を比較し、`representativeItemId` の値と整合しない組み合わせや、非NULL値どうしの矛盾がある選択は 409 (`MERGE_HIERARCHY_CONFLICT`) を返却する',
      '選択上パネル行に含まれる既存 `IMPORT_ROW` 元レコードを source label 単位で重複検査し、`台帳1 : 現有品調査n` 制約を崩す選択は 409 (`MATCH_RULE_VIOLATION`) とする',
      '代表行以外の選択行は物理削除せず、`merged_into_item_id=代表行ID`、`merged_by_session_list_id=sessionListId` を設定して論理統合状態へ更新する',
      '代表行に対する `asset_data_matching_item_list_results` を `result_status=''ACTIVE''` で1件作成し、`decision_note` に要求 `decisionNote` を保存する',
      '更新した判定履歴と論理統合状態を入力として、共通 snapshot 再構築サービスが影響 item を `asset_data_matching_session_lists.source_order ASC` の `result_status=''ACTIVE''` 判定履歴順に再計算する',
      '同サービスは current list の台帳行を原本直前 snapshot へ反映する際、分類 ID / 名称は `selected_* -> suggested_* -> 既存 snapshot`、`asset_name` は `parsed_asset_name -> 既存 asset_name -> asset_item_name`、`unit` は `parsed_unit -> 既存 unit` の優先順で更新する。`detail_type` と `parent_asset_data_matching_item_id` は `representativeItemId` の既存値を保持する',
      '同サービスは `matching_status` を要求 `matchingStatus` に更新し、`asset_data_matching_item_sources` / `source_summary` を再計算する。`source_type=''IMPORT_ROW''` は `ledgerItemId`、`source_type=''SURVEY_RECORD''` は代表行と論理統合対象行に紐づく調査レコードの和集合とし、`active_import_row_key` / `active_survey_record_key` を同一トランザクションで再設定する。一意制約違反時は 409 (`MATCH_RULE_VIOLATION`) を返却する',
      '同サービスは再集約後の `SURVEY_RECORD` 集合に含まれる `asset_survey_records.qr_identifier` の非NULL distinct 値から、`qr_identifier` / `qr_resolution_status` を再計算する。0 件なら `NONE`、1 件ならその値を採用して `RESOLVED`、2 件以上なら `qr_identifier=NULL` / `CONFLICT` とする',
      '更新成功時は `asset_data_matching_sessions.lock_version` を +1 し、`updated_at` も更新した上で、新しい `lockVersion` と `sessionUpdatedAt` を返却する'
    )
    ResponseTitle = 'レスポンス（200：DataMatchingRegisterMatchResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('assetDataMatchingItemId', 'int64', '✓', '更新後の代表統合リスト行ID'),
      @('logicallyMergedItemIds', 'int64[]', '✓', '論理統合状態へ更新した統合リスト行ID一覧'),
      @('representativeImportRowId', 'int64', '✓', '現在代表台帳行として紐づけた資産インポート行ID'),
      @('matchingStatus', 'string', '✓', '登録後の突合状況'),
      @('sourceSummary', 'string', '-', '更新後の統合元サマリ'),
      @('lockVersion', 'int64', '✓', '更新後の `asset_data_matching_sessions.lock_version`'),
      @('sessionUpdatedAt', 'datetime', '✓', '更新後のセッション最終更新日時'),
      @('completedAt', 'datetime', '✓', '登録日時')
    )
    StatusRows = @(
      @('200', '登録成功', 'DataMatchingRegisterMatchResponse'),
      @('400', '入力不正、選択件数不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `survey_ledger_matching` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象セッション、対象統合リスト、対象行が存在しない', 'ErrorResponse'),
      @('409', 'セッション競合、現在処理対象リスト以外の指定、再集約不可 item の指定、代表行を含む階層矛盾、既に判定済み、台帳行の二重消費、または `台帳1 : 現有品調査n` 制約違反', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '未登録確定（/data-matching/sessions/{sessionId}/mark-unregistered）'
    Overview = '現有品側にのみ存在する統合リスト行を、選択中台帳リストに対して `未登録` として確定する。統合リスト行自体は維持したまま、現在リストに対する判定完了状態へ更新する。'
    Method = 'POST'
    Path = '/data-matching/sessions/{sessionId}/mark-unregistered'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('sessionId', 'path', 'int64', '✓', 'データ突合セッションID')
    ) + $mutationIdempotencyHeaderRows
    RequestTitle = 'リクエストボディ'
    RequestHeaders = @('フィールド', '型', '必須', '説明')
    RequestRows = @(
      @('lockVersion', 'int64', '✓', '取得時点の `asset_data_matching_sessions.lock_version`。競合検知に用いる'),
      @('sessionListId', 'int64', '✓', '現在突合中の統合対象リストID'),
      @('mergedItemIds', 'int64[]', '✓', '未登録として確定する統合リスト行ID一覧'),
      @('decisionNote', 'string', '-', '当該リスト判定メモ')
    )
    PermissionLines = $surveyLedgerMatchingPermissionLines
    ProcessingLines = @(
      '対象セッションが `IN_PROGRESS` であり、`sessionListId` が未完了の統合対象リストであることを検証する',
      '`sessionListId` が `source_type=''IMPORT_JOB'' AND merge_status=''PENDING''` のうち `source_order` 最小の現在処理対象リストであることを検証し、異なる場合は 409 (`SESSION_LIST_SEQUENCE_INVALID`) を返却する',
      '要求 `lockVersion` と `asset_data_matching_sessions.lock_version` を比較し、不一致時は 409 (`SESSION_CONFLICT`) を返却する',
      '`Idempotency-Key` の再送時は、同一 payload であれば初回応答を再返却し、異なる payload なら 409 (`IDEMPOTENCY_KEY_REUSED`) を返却する',
      '`asset_data_matching_sessions` / `asset_data_matching_session_lists` / 対象 `asset_data_matching_items` を 1 トランザクション内で排他取得する',
      '`mergedItemIds` はすべて同一セッション配下の `merged_into_item_id IS NULL AND item_status=''ACTIVE''` な有効行であり、かつ当該リストに対する `asset_data_matching_item_list_results.result_status=''ACTIVE''` が未作成であることを検証する',
      '選択行ごとに `asset_data_matching_item_list_results` を `matching_status=''UNREGISTERED''`、`result_status=''ACTIVE''`、`asset_import_row_id=NULL` で作成し、`decision_note` を保存する',
      '更新した判定履歴を入力として、共通 snapshot 再構築サービスが対象 item を `asset_data_matching_session_lists.source_order ASC` の `result_status=''ACTIVE''` 判定履歴順に再計算する。current list は `IMPORT_ROW` を持たない `UNREGISTERED` 判定として扱い、`matching_status` / `asset_data_matching_item_sources` / `source_summary` / `qr_identifier` / `qr_resolution_status` を同一トランザクションで再更新する',
      '更新成功時は `asset_data_matching_sessions.lock_version` を +1 し、`updated_at` も更新した上で、新しい `lockVersion` と `sessionUpdatedAt` を返却する',
      '新たな `asset_ledgers` は作成せず、原本確定時まで統合リスト行として保持する'
    )
    ResponseTitle = 'レスポンス（200：DataMatchingMarkUnregisteredResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('updatedItemIds', 'int64[]', '✓', '更新した統合リスト行ID一覧'),
      @('matchingStatus', 'string', '✓', '登録後の突合状況。常に `UNREGISTERED`'),
      @('lockVersion', 'int64', '✓', '更新後の `asset_data_matching_sessions.lock_version`'),
      @('sessionUpdatedAt', 'datetime', '✓', '更新後のセッション最終更新日時'),
      @('completedAt', 'datetime', '✓', '登録日時')
    )
    StatusRows = @(
      @('200', '登録成功', 'DataMatchingMarkUnregisteredResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `survey_ledger_matching` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象セッション、対象統合リスト、対象行が存在しない', 'ErrorResponse'),
      @('409', 'セッション競合、現在処理対象リスト以外の指定、または既に判定済み', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '未確認確定（/data-matching/sessions/{sessionId}/mark-unconfirmed）'
    Overview = '台帳側にのみ存在する行を `未確認` として確定する。選択した台帳行ごとに新しい統合リスト行を作成し、現在リストに対する判定結果として保持する。'
    Method = 'POST'
    Path = '/data-matching/sessions/{sessionId}/mark-unconfirmed'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('sessionId', 'path', 'int64', '✓', 'データ突合セッションID')
    ) + $mutationIdempotencyHeaderRows
    RequestTitle = 'リクエストボディ'
    RequestHeaders = @('フィールド', '型', '必須', '説明')
    RequestRows = @(
      @('lockVersion', 'int64', '✓', '取得時点の `asset_data_matching_sessions.lock_version`。競合検知に用いる'),
      @('sessionListId', 'int64', '✓', '現在突合中の統合対象リストID'),
      @('ledgerItemIds', 'int64[]', '✓', '未確認として確定する資産インポート行ID一覧'),
      @('decisionNote', 'string', '-', '当該リスト判定メモ')
    )
    PermissionLines = $surveyLedgerMatchingPermissionLines
    ProcessingLines = @(
      '対象セッションが `IN_PROGRESS` であり、`sessionListId` が未完了の統合対象リストであることを検証する',
      '`sessionListId` が `source_type=''IMPORT_JOB'' AND merge_status=''PENDING''` のうち `source_order` 最小の現在処理対象リストであることを検証し、異なる場合は 409 (`SESSION_LIST_SEQUENCE_INVALID`) を返却する',
      '要求 `lockVersion` と `asset_data_matching_sessions.lock_version` を比較し、不一致時は 409 (`SESSION_CONFLICT`) を返却する',
      '`Idempotency-Key` の再送時は、同一 payload であれば初回応答を再返却し、異なる payload なら 409 (`IDEMPOTENCY_KEY_REUSED`) を返却する',
      '`asset_data_matching_sessions` / `asset_data_matching_session_lists` / 対象 `asset_import_rows` を 1 トランザクション内で排他取得する',
      '`ledgerItemIds` はすべて当該リスト配下の未処理 `asset_import_rows` であり、同一 `sessionListId` の有効 `asset_data_matching_item_list_results` で未消費であることを検証する',
      '選択した台帳行ごとに `asset_data_matching_items` を新規作成し、`parsed_asset_name`、分類ID/名称、`parsed_manufacturer_name` / `parsed_model_name` を含むメーカー・型式情報、`asset_no`、`equipment_no`、`quantity`、`unit`、`department_name`、`section_name`、`room_name` を原本直前スナップショットとして複写する',
      '新規統合リスト行の `creation_type` を `UNCONFIRMED_IMPORT`、`item_status` を `ACTIVE`、`matching_status` を `UNCONFIRMED`、`detail_type` を `MAIN`、`qr_identifier` を NULL、`qr_resolution_status` を `NONE`、`parent_asset_data_matching_item_id` / `merged_into_item_id` / `merged_by_session_list_id` を NULL とし、元レコードは `asset_data_matching_item_sources` に `source_type=''IMPORT_ROW''` で紐づける。`active_import_row_key` は後続の共通 snapshot 再構築サービスが設定し、一意制約違反時は 409 (`MATCH_RULE_VIOLATION`) を返却する',
      '同時に `asset_data_matching_item_list_results` を `matching_status=''UNCONFIRMED''`、`result_status=''ACTIVE''` で作成し、`asset_import_row_id` に消費した台帳行IDと `decision_note` を保存する',
      '作成した item と判定履歴を入力として、共通 snapshot 再構築サービスが対象 item を `asset_data_matching_session_lists.source_order ASC` の `result_status=''ACTIVE''` 判定履歴順に正規化し、`matching_status` / `source_summary` / `active_import_row_key` を確定する',
      '更新成功時は `asset_data_matching_sessions.lock_version` を +1 し、`updated_at` も更新した上で、新しい `lockVersion` と `sessionUpdatedAt` を返却する'
    )
    ResponseTitle = 'レスポンス（200：DataMatchingMarkUnconfirmedResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('createdItemIds', 'int64[]', '✓', '新規作成した統合リスト行ID一覧'),
      @('matchingStatus', 'string', '✓', '登録後の突合状況。常に `UNCONFIRMED`'),
      @('createdCount', 'int32', '✓', '作成件数'),
      @('lockVersion', 'int64', '✓', '更新後の `asset_data_matching_sessions.lock_version`'),
      @('sessionUpdatedAt', 'datetime', '✓', '更新後のセッション最終更新日時'),
      @('completedAt', 'datetime', '✓', '登録日時')
    )
    StatusRows = @(
      @('200', '登録成功', 'DataMatchingMarkUnconfirmedResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `survey_ledger_matching` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象セッション、対象統合リスト、対象台帳行が存在しない', 'ErrorResponse'),
      @('409', 'セッション競合、現在処理対象リスト以外の指定、または既に判定済み', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '判定差し戻し（/data-matching/sessions/{sessionId}/revert-decision）'
    Overview = '現在リストに対する有効判定を差し戻し、必要に応じて論理統合された統合リスト行を復元する。'
    Method = 'POST'
    Path = '/data-matching/sessions/{sessionId}/revert-decision'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('sessionId', 'path', 'int64', '✓', 'データ突合セッションID')
    ) + $mutationIdempotencyHeaderRows
    RequestTitle = 'リクエストボディ'
    RequestHeaders = @('フィールド', '型', '必須', '説明')
    RequestRows = @(
      @('lockVersion', 'int64', '✓', '取得時点の `asset_data_matching_sessions.lock_version`。競合検知に用いる'),
      @('sessionListId', 'int64', '✓', '差し戻し対象の統合対象リストID'),
      @('assetDataMatchingItemIds', 'int64[]', '✓', '差し戻す代表統合リスト行ID一覧。1件以上'),
      @('revertNote', 'string', '-', '差し戻し理由メモ')
    )
    PermissionLines = $surveyLedgerMatchingPermissionLines
    ProcessingLines = @(
      '対象セッションが `IN_PROGRESS` であり、`sessionListId` が当該セッション配下の対象リストであることを検証する',
      '要求 `lockVersion` と `asset_data_matching_sessions.lock_version` を比較し、不一致時は 409 (`SESSION_CONFLICT`) を返却する',
      '`Idempotency-Key` の再送時は、同一 payload であれば初回応答を再返却し、異なる payload なら 409 (`IDEMPOTENCY_KEY_REUSED`) を返却する',
      '`asset_data_matching_sessions` / `asset_data_matching_session_lists` / 対象 `asset_data_matching_items` / 有効 `asset_data_matching_item_list_results` を 1 トランザクション内で排他取得する',
      '`assetDataMatchingItemIds` はすべて `merged_into_item_id IS NULL AND item_status=''ACTIVE''` な有効統合リスト行であり、当該 `sessionListId` に対する `result_status=''ACTIVE''` 判定結果が存在することを検証する。存在しない場合は 404 (`DATA_MATCHING_DECISION_RESULT_NOT_FOUND`) を返却する',
      '対象 `assetDataMatchingItemIds` について、`sessionListId` より大きい `source_order` を持つ `asset_data_matching_session_lists` に `result_status=''ACTIVE''` 判定履歴が残る場合は、後続リスト依存が解消されていないため 409 (`RESULT_REVERT_NOT_ALLOWED`) を返却する。差し戻しは後ろから順にのみ許可する',
      '対象有効判定結果を `result_status=''REVERTED''` へ更新し、`revert_note`、`reverted_by_user_id`、`reverted_at` を保存する。対応する `asset_import_row_id` は未消費状態へ戻す',
      '`merged_by_session_list_id=sessionListId` かつ `merged_into_item_id=代表行ID` の論理統合行を復元し、`merged_into_item_id` / `merged_by_session_list_id` を NULL へ戻す',
      '復元後の影響 item は、共通 snapshot 再構築サービスが残存する `result_status=''ACTIVE''` 判定履歴を `asset_data_matching_session_lists.source_order ASC` で再適用して `asset_data_matching_items` / `asset_data_matching_item_sources` / `source_summary` / `active_import_row_key` / `active_survey_record_key` を再計算する。一意制約違反時は 409 (`MATCH_RULE_VIOLATION`) を返却する。有効判定が残らない場合、`matching_status` は NULL に戻す',
      '再計算後の `SURVEY_RECORD` 集合に含まれる `asset_survey_records.qr_identifier` の非NULL distinct 値から、`qr_identifier` / `qr_resolution_status` も再計算する。0 件なら `NONE`、1 件ならその値を採用して `RESOLVED`、2 件以上なら `qr_identifier=NULL` / `CONFLICT` とする',
      '`creation_type=''UNCONFIRMED_IMPORT''` の行について、差し戻し後に `result_status=''ACTIVE''` 判定履歴が0件となる場合は `item_status=''INVALIDATED''` に更新し、以後の上パネル一覧 / 原本候補一覧 / 原本確定対象から除外する',
      '対象 `sessionListId` が `merge_status=''COMPLETED''` の場合は `PENDING` へ戻し、`completed_at` を NULL として再作業可能にする',
      '更新成功時は `asset_data_matching_sessions.lock_version` を +1 し、`updated_at` も更新した上で、新しい `lockVersion` と `sessionUpdatedAt` を返却する'
    )
    ResponseTitle = 'レスポンス（200：DataMatchingRevertDecisionResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('sessionListId', 'int64', '✓', '差し戻し対象の統合対象リストID'),
      @('revertedItemIds', 'int64[]', '✓', '差し戻した代表統合リスト行ID一覧'),
      @('restoredMergedItemIds', 'int64[]', '✓', '論理統合状態から復元した統合リスト行ID一覧'),
      @('releasedLedgerItemIds', 'int64[]', '✓', '未消費状態へ戻した資産インポート行ID一覧'),
      @('reopenedList', 'boolean', '✓', '対象リストを `PENDING` へ再オープンした場合は true'),
      @('lockVersion', 'int64', '✓', '更新後の `asset_data_matching_sessions.lock_version`'),
      @('sessionUpdatedAt', 'datetime', '✓', '更新後のセッション最終更新日時'),
      @('completedAt', 'datetime', '✓', '差し戻し日時')
    )
    StatusRows = @(
      @('200', '差し戻し成功', 'DataMatchingRevertDecisionResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `survey_ledger_matching` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象セッション、対象統合対象リスト、または有効判定結果が存在しない', 'ErrorResponse'),
      @('409', 'セッション競合、後続リスト依存が残る状態、または差し戻し不可状態', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '突合完了 / 原本確定（/data-matching/sessions/{sessionId}/complete）'
    Overview = '現在リストとの突合完了、または現在の統合リストを原本リストとして確定する。早期確定時は残りリストを `SKIPPED` として扱い、`asset_ledgers` を生成し、必要な `qr_codes.asset_ledger_id` を確定する。'
    Method = 'POST'
    Path = '/data-matching/sessions/{sessionId}/complete'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('sessionId', 'path', 'int64', '✓', 'データ突合セッションID')
    ) + $mutationIdempotencyHeaderRows
    RequestTitle = 'リクエストボディ'
    RequestHeaders = @('フィールド', '型', '必須', '説明')
    RequestRows = @(
      @('lockVersion', 'int64', '✓', '取得時点の `asset_data_matching_sessions.lock_version`。競合検知に用いる'),
      @('completionType', 'string', '✓', '実行種別。`COMPLETE_LIST` / `CONFIRM_ORIGINAL`'),
      @('sessionListId', 'int64', '条件付き', '`COMPLETE_LIST` 時に必須。完了対象の統合対象リストID'),
      @('skipRemaining', 'boolean', '-', '`CONFIRM_ORIGINAL` 時に、未完了リストを `SKIPPED` として途中確定する場合は true')
    )
    PermissionLines = $surveyLedgerMatchingPermissionLines
    ProcessingLines = @(
      '対象セッションが `IN_PROGRESS` であり、Bearer トークン上の作業対象施設と一致することを検証する',
      '要求 `lockVersion` と `asset_data_matching_sessions.lock_version` を比較し、不一致時は 409 (`SESSION_CONFLICT`) を返却する',
      '`Idempotency-Key` の再送時は、同一 payload であれば初回応答を再返却し、異なる payload なら 409 (`IDEMPOTENCY_KEY_REUSED`) を返却する',
      '`asset_data_matching_sessions` と対象 `asset_data_matching_session_lists` を 1 トランザクション内で排他取得する',
      '`completionType=''COMPLETE_LIST''` の場合は、`sessionListId` が当該セッション配下の未完了リストであり、かつ `source_type=''IMPORT_JOB'' AND merge_status=''PENDING''` のうち `source_order` 最小の現在処理対象リストであることを検証し、異なる場合は 409 (`SESSION_LIST_SEQUENCE_INVALID`) を返却する。当該リストに対する `asset_data_matching_item_list_results.result_status=''ACTIVE''` 未作成の有効統合リスト行（`merged_into_item_id IS NULL AND item_status=''ACTIVE''`）と未処理台帳行が 0 件であることもあわせて検証する',
      '`COMPLETE_LIST` では `asset_data_matching_session_lists.merge_status` を `COMPLETED` に更新し、`completed_at` を記録する',
      '`completionType=''CONFIRM_ORIGINAL''` の場合は、未完了リストが残るとき `skipRemaining=true` を必須とし、残存 `PENDING` リストを `SKIPPED` へ更新する',
      '原本確定時は、現在の `asset_data_matching_items` のうち `merged_into_item_id IS NULL AND item_status=''ACTIVE''` の有効行について `category_id`、`large_class_name`、`medium_class_name`、`asset_item_name`、`asset_name`、`quantity` の必須項目が全件で解決済みであることを検証し、不足があれば 409 (`ORIGINAL_LEDGER_SNAPSHOT_INCOMPLETE`) を返却する',
      '原本確定時は、`qr_resolution_status=''CONFLICT''` の有効行（`item_status=''ACTIVE''`）が存在しないことを検証する。存在する場合は 409 (`ORIGINAL_QR_BINDING_CONFLICT`) を返却し、`ErrorResponse.conflictItems[]` に `conflictType=''UNRESOLVED''` を返す',
      '原本確定時は、`qr_resolution_status=''RESOLVED''` かつ `qr_identifier IS NOT NULL` の有効行（`item_status=''ACTIVE''`）について同一セッション内で重複がないことを検証し、`(facility_id, qr_identifier)` で `qr_codes` を排他取得する。未発行、論理削除済み、別資産へ紐付済み、または施設不整合がある場合は 409 (`ORIGINAL_QR_BINDING_CONFLICT`) を返却し、`ErrorResponse.conflictItems[]` に競合行ごとの詳細を返す',
      '原本確定時は `parent_asset_data_matching_item_id` を考慮した親優先順で `asset_ledgers` を作成し、`parent_asset_ledger_id` へ変換する。同時に対応する `asset_data_matching_items.created_asset_ledger_id` へ採番済み `asset_ledger_id` を保存し、結果確認画面や資産カルテ遷移の追跡キーとして保持する',
      '`qr_identifier` が設定された行は、対応する `qr_codes.asset_ledger_id` に今回作成した `asset_ledgers.asset_ledger_id` を設定し、更新は原本生成、`created_asset_ledger_id` 保存と同一トランザクションで完了させる',
      '生成値の具体的なマッピングは第6章の `asset_data_matching_items -> asset_ledgers` ルールに従う',
      '原本生成と QR 紐付け更新の完了後に、実行ユーザーを `asset_data_matching_sessions.confirmed_by_user_id`、サーバ時刻を `confirmed_at` へ保存した上でセッションを `CONFIRMED` に更新する',
      '更新成功時は `asset_data_matching_sessions.lock_version` を +1 し、`updated_at` も更新した上で、新しい `lockVersion` と `sessionUpdatedAt` を返却する',
      '`CONFIRMED` となったセッションは read-only とし、以後の一覧更新・突合登録・再確定は受け付けない'
    )
    ResponseTitle = 'レスポンス（200：DataMatchingCompleteResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('sessionId', 'int64', '✓', 'データ突合セッションID'),
      @('sessionStatus', 'string', '✓', '更新後セッション状態。`IN_PROGRESS` / `CONFIRMED`'),
      @('lockVersion', 'int64', '✓', '更新後の `asset_data_matching_sessions.lock_version`'),
      @('sessionUpdatedAt', 'datetime', '✓', '更新後のセッション最終更新日時'),
      @('completedSessionListId', 'int64|null', '✓', '`COMPLETE_LIST` 時に完了した統合対象リストID'),
      @('nextPendingSessionListId', 'int64|null', '✓', '次に選択可能な未完了リストID。存在しない場合は null'),
      @('createdLedgerCount', 'int32', '✓', '原本確定時に生成した `asset_ledgers` 件数'),
      @('linkedQrCount', 'int32', '✓', '原本確定時に `qr_codes.asset_ledger_id` を設定した件数'),
      @('skippedListCount', 'int32', '✓', '途中確定により `SKIPPED` へ更新したリスト件数'),
      @('skippedLists', 'SkippedListSummary[]', '✓', '途中確定で `SKIPPED` としたリスト一覧'),
      @('confirmedAt', 'datetime', '-', '原本確定日時')
    )
    ResponseSubtables = @(
      @{
        Title = 'skippedLists要素（SkippedListSummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('sessionListId', 'int64', '✓', '統合対象リストID'),
          @('sourceLabel', 'string', '✓', '画面表示用リスト名'),
          @('sourceOrder', 'int32', '✓', '統合順'),
          @('mergeStatus', 'string', '✓', '常に `SKIPPED`')
        )
      }
    )
    StatusRows = @(
      @('200', '更新成功', 'DataMatchingCompleteResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `survey_ledger_matching` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象セッションまたは対象統合リストが存在しない', 'ErrorResponse'),
      @('409', 'セッション競合、現在処理対象リスト以外の完了要求、未判定行残存、原本直前スナップショット不足、QR紐付け競合、または途中確定条件未達', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '統合結果一覧取得（/data-matching/sessions/{sessionId}/result）'
    Overview = '原本リストモーダル用の統合結果一覧を取得する。現在の統合リストをページ単位で返却し、原本確定前のレビューと確定後の参照の両方に利用する。'
    Method = 'GET'
    Path = '/data-matching/sessions/{sessionId}/result'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('sessionId', 'path', 'int64', '✓', 'データ突合セッションID')
    ) + $listLockVersionParameterRows + $cursorPaginationParameterRows
    PermissionLines = $surveyLedgerMatchingPermissionLines
    ProcessingLines = @(
      '対象セッションが Bearer トークン上の作業対象施設に属することを検証する',
      '初回要求で `lockVersion` 省略時は現在の `asset_data_matching_sessions.lock_version` を当該一覧の snapshot version として採用する。指定時は `cursor` に埋め込まれた `lockVersion` と一致し、かつ `session_status=''IN_PROGRESS''` の間は現在の `lock_version` と一致することを検証する。不一致時は 409 (`LIST_SNAPSHOT_EXPIRED`) を返却する',
      '`asset_data_matching_items` のうち `merged_into_item_id IS NULL AND item_status=''ACTIVE''` の有効行を現在の原本候補一覧として取得し、`source_summary`、現在代表台帳行、統合済み調査レコード一覧、原本直前スナップショット項目、原本確定必須項目の充足可否、`qrResolutionStatus`、`qrBindingCheckStatus`、`blockingReasons` を返却する',
      '各統合リスト行について、`asset_data_matching_item_sources` から現在代表元の `sourceDetails`、`asset_data_matching_item_list_results` から対象リストごとの `listResults` を `source_order ASC` で返却する。`sourceDetails` の `SURVEY_RECORD` には元調査レコードごとの `qrIdentifier` を含め、`listResults` には `result_status=''ACTIVE''` / `''REVERTED''` の両方を含める。`created_asset_ledger_id` が設定済みの場合は `assetLedgerId` として返却する',
      'セッションが `CONFIRMED` の場合も、当該セッション確定時点の統合結果として同じ形式で返却する',
      '`canConfirmOriginal` は全件が原本確定必須項目と QR 解決・紐付け可否の両方を満たす場合のみ true とし、阻害件数を `unreadyItemCount` と `qrBlockingItemCount` で返却する',
      '`cursor` 指定時は既定ソート順と `lockVersion` を固定した snapshot の続き位置から取得し、`pageSize` 件を上限に返却する',
      '返却順は `department_name ASC, section_name ASC, asset_item_name ASC, asset_data_matching_item_id ASC` を既定とする'
    )
    ResponseTitle = 'レスポンス（200：DataMatchingResultResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('sessionId', 'int64', '✓', 'データ突合セッションID'),
      @('sessionStatus', 'string', '✓', 'セッション状態'),
      @('lockVersion', 'int64', '✓', '今回返却した一覧 snapshot の `asset_data_matching_sessions.lock_version`'),
      @('sessionUpdatedAt', 'datetime', '✓', 'セッション最終更新日時'),
      @('mergedItemCount', 'int32', '✓', '`merged_into_item_id IS NULL AND item_status=''ACTIVE''` の統合結果件数'),
      @('remainingListCount', 'int32', '✓', '未完了リスト件数'),
      @('skippedLists', 'SkippedListSummary[]', '✓', '途中確定で `SKIPPED` としたリスト一覧'),
      @('canConfirmOriginal', 'boolean', '✓', '原本直前スナップショットが原本確定必須項目と QR 解決・紐付け可否を満たす場合は true'),
      @('unreadyItemCount', 'int32', '✓', '原本確定を阻害している統合リスト行件数（必須項目不足または QR 阻害）'),
      @('qrBlockingItemCount', 'int32', '✓', 'QR 解決または QR 紐付け可否が原因で原本確定を阻害している統合リスト行件数'),
      @('returnedCount', 'int32', '✓', '今回返却した items 件数'),
      @('nextCursor', 'string|null', '✓', '次ページ取得用 continuation token。末尾まで取得済みの場合は null'),
      @('hasMore', 'boolean', '✓', '続きが存在する場合は true'),
      @('items', 'OriginalLedgerCandidate[]', '✓', '統合結果一覧')
    )
    ResponseSubtables = @(
      @{
        Title = 'skippedLists要素（SkippedListSummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('sessionListId', 'int64', '✓', '統合対象リストID'),
          @('sourceLabel', 'string', '✓', '画面表示用リスト名'),
          @('sourceOrder', 'int32', '✓', '統合順'),
          @('mergeStatus', 'string', '✓', '常に `SKIPPED`')
        )
      },
      @{
        Title = 'items要素（OriginalLedgerCandidate）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('assetDataMatchingItemId', 'int64', '✓', '統合リスト行ID'),
          @('assetLedgerId', 'int64|null', '✓', '原本確定後に作成された `asset_ledgers.asset_ledger_id`。未確定セッションでは null'),
          @('matchingStatus', 'string|null', '✓', '原本直前スナップショット上の最新確定判定結果'),
          @('representativeImportRowId', 'int64|null', '✓', '現在代表台帳行として採用されている資産インポート行ID'),
          @('surveySourceRecordIds', 'int64[]', '✓', '現在統合済みの現有品調査レコードID一覧'),
          @('qrIdentifier', 'string', '-', '現有品調査由来の採用済み QR 識別子。`qrResolutionStatus=''RESOLVED''` の場合のみ設定'),
          @('qrResolutionStatus', 'string', '✓', 'QR 採否状態。`NONE` / `RESOLVED` / `CONFLICT`'),
          @('qrBindingCheckStatus', 'string', '✓', '原本確定時の QR 紐付け可否。`NO_QR` / `READY_TO_BIND` / `UNRESOLVED` / `DUPLICATED_IN_SESSION` / `NOT_ISSUED` / `DELETED` / `BOUND_OTHER_ASSET` / `FACILITY_MISMATCH`'),
          @('assetNo', 'string', '-', '資産番号'),
          @('equipmentNo', 'string', '-', 'ME番号'),
          @('facilityLocationId', 'int64|null', '✓', '原本生成に用いる施設ロケーションID'),
          @('assetName', 'string|null', '✓', '原本生成に用いる資産名'),
          @('departmentName', 'string', '✓', '共通部門名'),
          @('sectionName', 'string', '✓', '共通部署名'),
          @('roomName', 'string', '-', '室名'),
          @('categoryName', 'string', '-', 'カテゴリ名'),
          @('largeClassName', 'string', '-', '大分類名'),
          @('mediumClassName', 'string', '-', '中分類名'),
          @('assetItemName', 'string', '-', '品目名'),
          @('manufacturerName', 'string', '-', 'メーカー名'),
          @('modelName', 'string', '-', '型式名'),
          @('serialNo', 'string', '-', 'シリアル番号'),
          @('detailType', 'string|null', '✓', '原本生成に用いる明細区分。`MAIN` / `DETAIL` / `ACCESSORY`'),
          @('parentAssetDataMatchingItemId', 'int64|null', '✓', '親統合リスト行ID'),
          @('quantity', 'int32', '✓', '数量'),
          @('unit', 'string|null', '✓', '数量単位'),
          @('purchasedOn', 'date', '-', '購入日'),
          @('sourceSummary', 'string', '-', '統合元サマリ'),
          @('sourceDetails', 'SourceDetail[]', '✓', '現在代表元の詳細一覧'),
          @('listResults', 'ListResultSummary[]', '✓', '対象リストごとの判定履歴一覧'),
          @('blockingReasons', 'string[]', '✓', '原本確定を阻害している理由コード一覧。例: `MISSING_CATEGORY_ID`、`QR_UNRESOLVED`、`QR_NOT_ISSUED`'),
          @('isOriginalReady', 'boolean', '✓', '原本確定必須項目と QR 解決・紐付け可否の両方を満たす場合は true'),
          @('missingRequiredFields', 'string[]', '✓', '不足している原本確定必須項目名一覧')
        )
      },
      @{
        Title = 'sourceDetails要素（SourceDetail）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('sourceType', 'string', '✓', '元種別。`SURVEY_RECORD` / `IMPORT_ROW`'),
          @('sourceLabel', 'string', '✓', '画面表示用元リスト名'),
          @('sourceRelationType', 'string', '✓', '元反映区分。例: `MATCHED` / `UNREGISTERED` / `UNCONFIRMED`'),
          @('assetSurveyRecordId', 'int64|null', '✓', '`sourceType=''SURVEY_RECORD''` の場合の調査レコードID'),
          @('assetImportRowId', 'int64|null', '✓', '`sourceType=''IMPORT_ROW''` の場合の資産インポート行ID'),
          @('qrIdentifier', 'string|null', '✓', '`sourceType=''SURVEY_RECORD''` の場合は当該調査レコードの QR 識別子、`IMPORT_ROW` の場合は null')
        )
      },
      @{
        Title = 'listResults要素（ListResultSummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('sessionListId', 'int64', '✓', '統合対象リストID'),
          @('sourceLabel', 'string', '✓', '画面表示用リスト名'),
          @('sourceOrder', 'int32', '✓', '統合順'),
          @('mergeStatus', 'string', '✓', '対象リスト状態。`PENDING` / `COMPLETED` / `SKIPPED`'),
          @('resultStatus', 'string', '✓', '判定履歴状態。`ACTIVE` / `REVERTED`'),
          @('matchingStatus', 'string', '✓', '判定結果'),
          @('consumedAssetImportRowId', 'int64|null', '✓', '判定時に消費した資産インポート行ID'),
          @('decisionNote', 'string', '-', '判定メモ。更新系 API の `decisionNote` 保存先'),
          @('decidedByUserId', 'int64', '✓', '判定実行ユーザーID'),
          @('decidedAt', 'datetime', '✓', '判定実行日時'),
          @('revertedByUserId', 'int64|null', '✓', '差し戻し実行ユーザーID'),
          @('revertedAt', 'datetime|null', '✓', '差し戻し実行日時')
        )
      }
    )
    StatusRows = @(
      @('200', '取得成功', 'DataMatchingResultResponse'),
      @('400', 'cursor / pageSize 不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `survey_ledger_matching` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象セッションが存在しない', 'ErrorResponse'),
      @('409', '一覧 snapshot の `lockVersion` が失効した', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  }
)

@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\参考_作業用\API設計書_データ突合.docx'
  ScreenLabel = 'データ突合'
  CoverDateText = '2026年4月23日'
  RevisionDateText = '2026/4/23'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、データ突合画面（`/data-matching`）、固定資産台帳（対応中）画面（`/data-matching/ledger`）、ME管理台帳（対応中）画面（`/data-matching/me-ledger`）で利用する API の設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      '現有品調査を基底としたデータ突合セッション開始 / 再開 I/F',
      '統合リスト、固定資産台帳、ME管理台帳の一覧取得と一致検索 I/F',
      '完全一致 / 部分一致 / 数量不一致 / 再確認 / 未登録 / 未確認の判定登録ルール',
      '原本直前スナップショット、更新競合制御、`asset_ledgers` 生成と `qr_codes` 紐付けルール'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = 'データ突合は、現有品調査リストを起点に整形済み台帳リスト（固定資産台帳 / ME管理台帳 / その他）を 1 リストずつ統合し、最終的な原本リストを確定する機能である。' },
    @{ Type = 'Paragraph'; Text = '現行主導線は `/data-matching` のセッション型 API を正本とし、`/data-matching/ledger` と `/data-matching/me-ledger` は同一セッションの参考表示画面として扱う。個別対応補助テーブル `asset_import_survey_mappings` は参照補助であり、主導線の正本は `asset_data_matching_sessions` / `asset_data_matching_session_lists` / `asset_data_matching_items` / `asset_data_matching_item_sources` / `asset_data_matching_item_list_results` とする。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('データ突合セッション', '施設単位で進行する統合作業ヘッダ。`asset_data_matching_sessions` に保持する'),
      @('統合対象リスト', '現有品調査を基底として順次統合する整形済み台帳リスト。`asset_data_matching_session_lists` に保持する'),
      @('統合リスト', '現在の原本候補一覧。原本確定直前のスナップショット正本を `asset_data_matching_items` に保持する'),
      @('統合元レコード', '統合リスト行の元になった現有品調査レコード / 台帳行。`asset_data_matching_item_sources` に保持する'),
      @('対象リスト判定結果', '統合対象リストごとの判定結果、進捗、台帳行消費判定。`asset_data_matching_item_list_results` に保持する'),
      @('未登録', '現有品側に存在し、現在の台帳リストに対応行がない状態。API 上は `UNREGISTERED`'),
      @('未確認', '台帳側に存在し、現有品側に対応行がない状態。API 上は `UNCONFIRMED`')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面パス', '利用目的'); Rows = @(
      @('14. データ突合画面', '/data-matching', 'リスト選択、統合リストと台帳リストの突合、原本リスト確定'),
      @('33. 固定資産台帳（対応中）画面', '/data-matching/ledger', '固定資産台帳側の候補確認と未確認確定の参考表示'),
      @('34. ME管理台帳（対応中）画面', '/data-matching/me-ledger', 'ME管理台帳側の候補確認と未確認確定の参考表示')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'APIの位置づけ' },
    @{ Type = 'Paragraph'; Text = '本 API 群は、現有品調査・資産台帳取込の後段で、複数リストを統合して原本台帳を生成するための I/F を提供する。`/data-matching` が主導線であり、セッション開始、一覧取得、判定登録、原本確定、および QR 遷移用の資産紐付け確定までを一連で扱う。' },
    @{ Type = 'Paragraph'; Text = '参考画面 `/data-matching/ledger` と `/data-matching/me-ledger` は、選択中セッションの台帳側候補を補助的に表示する位置づけであり、独立した正本 API 群は設けない。' },
    @{ Type = 'Heading2'; Text = '画面とAPIの関係' },
    @{ Type = 'Numbered'; Items = @(
      'データ突合画面初期表示時に画面コンテキスト取得 API を呼び出す',
      '初回利用または再開時にデータ突合セッション開始 API を呼び出す',
      'リスト選択後の上パネル表示で統合リスト一覧取得 API、下パネル表示で固定資産台帳 / ME管理台帳一覧取得 API を呼び出す',
      '完全一致 / 部分一致 / 数量不一致 / 再確認押下時に突合結果登録 API を呼び出す',
      '未登録 / 未確認押下時に未登録確定 API または未確認確定 API を呼び出す',
      '誤判定を戻す場合は判定差し戻し API を呼び出す',
      'このリストとの突合完了、および原本リストとして確定押下時に突合完了 / 原本確定 API を呼び出す',
      '原本リストモーダル表示時に統合結果一覧取得 API を呼び出す'
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル', '利用内容', '主な項目'); Rows = @(
      @('asset_data_matching_sessions', 'セッション開始 / 再開 / 原本確定', 'asset_data_matching_session_id, facility_id, session_status, lock_version, created_by_user_id, confirmed_by_user_id, confirmed_at'),
      @('asset_data_matching_session_lists', '統合対象リスト確定、完了状態管理', 'asset_data_matching_session_list_id, asset_import_job_id, source_label, source_order, merge_status, completed_at'),
      @('asset_data_matching_items', '統合リスト一覧取得、原本直前スナップショット更新、論理統合保持、原本確定時の元データ', 'asset_data_matching_item_id, creation_type, item_status, matching_status, qr_identifier, qr_resolution_status, created_asset_ledger_id, facility_location_id, asset_no, equipment_no, asset_name, department_name, section_name, room_name, category_id, large_class_id, medium_class_id, asset_item_id, manufacturer_id, model_id, detail_type, parent_asset_data_matching_item_id, merged_into_item_id, merged_by_session_list_id, quantity, unit, purchased_on, source_summary'),
      @('asset_data_matching_item_sources', '現在代表元レコード紐付けと再集約、および有効代表元の一意制御', 'asset_data_matching_item_source_id, asset_data_matching_item_id, source_type, asset_survey_record_id, asset_import_row_id, source_label, source_relation_type, active_import_row_key, active_survey_record_key'),
      @('asset_data_matching_item_list_results', '統合対象リストごとの判定結果、進捗、台帳行消費判定の正本', 'asset_data_matching_item_list_result_id, asset_data_matching_session_list_id, asset_data_matching_item_id, asset_import_row_id, matching_status, result_status, decision_note, decided_by_user_id, decided_at, reverted_by_user_id, reverted_at'),
      @('asset_survey_sessions / asset_survey_records', '基底現有品調査の選定と統合リスト初期生成', 'asset_survey_session_id, asset_survey_record_id, qr_identifier, department_name, section_name, room_name, asset_item_id'),
      @('asset_import_jobs / asset_import_rows', '統合候補リスト選定、台帳側一覧取得、表示スナップショット反映', 'asset_import_job_id, status, import_type, asset_import_row_id, parsed_ledger_no, parsed_management_device_no, parsed_department_name, parsed_section_name, parsed_asset_name, parsed_manufacturer_name, parsed_model_name, parsed_quantity, parsed_unit'),
      @('asset_ledgers', '原本リスト確定時の作成先、確定後参照', 'asset_ledger_id, facility_id, facility_location_id, asset_no, equipment_no, category_id, large_class_name, medium_class_name, asset_item_name, asset_name, detail_type, parent_asset_ledger_id, quantity, unit'),
      @('qr_codes', '原本確定時の QR 紐付け更新と QR 遷移有効化', 'qr_code_id, facility_id, qr_identifier, asset_ledger_id, updated_at, deleted_at'),
      @('asset_import_survey_mappings', '参考画面での個別対応補助管理。主導線の正本ではない', 'asset_import_survey_mapping_id, mapping_type, matching_status, confirm_status, decision_note'),
      @('facilities / facility_locations', '施設整合検証、部門 / 部署 / 室表示', 'facility_id, facility_name, department_name, section_name, room_name'),
      @('asset_categories / asset_large_classes / asset_medium_classes / asset_items / manufacturers / models', 'フィルタ候補、正規分類 / 表示スナップショット整合', '各マスタID, 表示名, deleted_at')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-04-20T00:00:00Z`）',
      '一覧系 API は `cursor` / `pageSize` による cursor pagination を採用し、対象施設 / セッション単位の全件一括返却を前提にしない'
    ) },
    @{ Type = 'Heading2'; Text = '一覧ページング仕様' },
    @{ Type = 'Bullets'; Items = @(
      '一覧系 API の既定 `pageSize` は `100`、最大 `500` とする',
      '`cursor` は既定ソート順の最終行キーと `lockVersion` を符号化した continuation token とし、クライアントは `nextCursor` が返る間だけ続きを取得する',
      '更新可能な `IN_PROGRESS` セッションでは、初回一覧取得時点の `lockVersion` を一覧 snapshot version として固定し、2ページ目以降は同じ `lockVersion` を付与する。不一致時は 409 (`LIST_SNAPSHOT_EXPIRED`) を返却する',
      '`totalCount` は条件一致総件数または対象リスト総件数、`returnedCount` は今回返却した件数を表す',
      'レビューや帳票で全件が必要な場合も、UI 用一覧 API ではなく別途 export / バッチ導線を設ける方針とする'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '認可判定は `feature_code` を正本とし、データ突合の各 API は `survey_ledger_matching` を用いる。Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が `is_enabled=true` の場合に API 実行を許可する。画面表示用の `/auth/context` は UX 用キャッシュであり、各業務 API でも同条件を再判定する。' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('画面コンテキスト取得 / セッション開始 / 一覧取得 / 判定登録 / 完了 / 原本確定 / 結果一覧取得', '`survey_ledger_matching`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', 'データ突合業務を実行する')
    ) },
    @{ Type = 'Heading2'; Text = '作業対象施設ベースの認可' },
    @{ Type = 'Bullets'; Items = @(
      '各 API は Bearer トークン上の作業対象施設に対する実効 `survey_ledger_matching` を都度再判定する',
      '`facilityId` を受け付ける API は、指定施設が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを前提とする',
      '`sessionId` / `sessionListId` を受け付ける API は、対象セッション / リストの `facility_id` が Bearer トークン上の作業対象施設IDと一致することを前提とする',
      'データ突合は自施設業務として扱い、協業グループや他施設公開設定は適用しない'
    ) },
    @{ Type = 'Heading2'; Text = '突合ステータスコード' },
    @{ Type = 'Table'; Headers = @('コード', '画面表示', '説明'); Rows = @(
      @('FULL_MATCH', '完全一致', '選択した台帳行と統合リスト行群が整合している状態'),
      @('PARTIAL_MATCH', '部分一致', '一部属性が異なるが同一資産と判断した状態'),
      @('QUANTITY_MISMATCH', '数量不一致', '同一資産と判断するが数量が一致しない状態'),
      @('RECHECK', '再確認', '判断保留として次回確認対象に残す状態'),
      @('UNCONFIRMED', '未確認', '台帳側のみ存在する行として原本候補へ追加した状態'),
      @('UNREGISTERED', '未登録', '現有品側のみ存在する行として原本候補へ残した状態')
    ) },
    @{ Type = 'Heading2'; Text = '更新競合 / 冪等性仕様' },
    @{ Type = 'Bullets'; Items = @(
      '競合検知トークンは `asset_data_matching_sessions.lock_version` を用いる。更新系 API は `lockVersion` を受け取り、取得時点の値と一致しない場合は 409 (`SESSION_CONFLICT`) を返却する',
      '更新系 API 成功時は `asset_data_matching_sessions.lock_version` を +1 し、その値をレスポンスへ返却する。`updated_at` は監査用の最終更新日時として保持する',
      '`POST /data-matching/sessions/{sessionId}/matches`、`mark-unregistered`、`mark-unconfirmed`、`revert-decision`、`complete` は `Idempotency-Key` ヘッダーを必須とし、同一 `sessionId` + 実行ユーザー + API パス + 同一 payload の再送は初回応答を再返却する',
      '同一 `Idempotency-Key` に対して payload が異なる場合は 409 (`IDEMPOTENCY_KEY_REUSED`) を返却する',
      '更新系 API は `asset_data_matching_sessions`、対象 `asset_data_matching_session_lists`、対象 `asset_data_matching_items` / `asset_data_matching_item_sources` / `asset_import_rows` / `asset_data_matching_item_list_results` を1トランザクションで更新し、失敗時は部分反映しない',
      '`POST /data-matching/sessions` は施設単位の `IN_PROGRESS` 一意制約により業務的に冪等化し、同時開始競合時も既存セッション再開結果を返却する'
    ) },
    @{ Type = 'Heading2'; Text = '代表値と正本の責務' },
    @{ Type = 'Bullets'; Items = @(
      '`asset_data_matching_item_list_results` は対象リスト単位の判定正本であり、`result_status=''ACTIVE''` の行を用いて `対応中` / `対応済み`、進捗件数、台帳行消費判定を決定する',
      '現在処理対象リストは `source_type=''IMPORT_JOB'' AND merge_status=''PENDING''` のうち `source_order` 最小の 1 件とし、`matches` / `mark-unregistered` / `mark-unconfirmed` / `COMPLETE_LIST` は当該リストに対してのみ実行する',
      '`decisionNote` の保存先は `asset_data_matching_item_list_results.decision_note` に統一し、結果確認画面では `listResults[].decisionNote` を判定メモの正本として返す',
      '`asset_data_matching_items.creation_type` / `item_status` は統合リスト行の生成起点と有効状態を表し、上パネル一覧 / 原本候補一覧 / 原本確定では `merged_into_item_id IS NULL AND item_status=''ACTIVE''` の行のみを対象とする',
      '`asset_data_matching_items.matching_status` は最新確定判定の代表値を保持する denormalized snapshot とし、更新系 API は判定履歴または論理統合状態保存後に共通 snapshot 再構築サービスを呼び出し、`result_status=''ACTIVE''` の判定履歴を `source_order ASC` で再適用して同一トランザクションで更新する',
      '`asset_data_matching_items.qr_identifier` / `qr_resolution_status` は `SURVEY_RECORD` 集合の QR 代表値を保持する denormalized snapshot とし、共通 snapshot 再構築サービスが非NULL distinct QR を集約して 0 件なら `NONE`、1 件ならその値を採用して `RESOLVED`、2 件以上なら `qr_identifier=NULL` / `CONFLICT` とする',
      '`asset_data_matching_items.created_asset_ledger_id` は原本確定後に作成された `asset_ledgers.asset_ledger_id` を保持する監査・遷移用キーであり、`GET /result` で返却して確定後の資産カルテ参照に利用する',
      '`asset_data_matching_item_sources` は現在代表元の provenance を保持し、`source_type=''IMPORT_ROW''` は現在代表台帳行、`source_type=''SURVEY_RECORD''` は統合済み現有品調査レコード集合を表す。`active_import_row_key` / `active_survey_record_key` は共通 snapshot 再構築サービスが同一トランザクション内に更新し、同一セッション内の有効代表元重複を一意制約で禁止する',
      '`asset_data_matching_items.source_summary` は画面表示用のサマリ列であり、完了判定や重複消費判定には用いない'
    ) },
    @{ Type = 'Heading2'; Text = '一致検索 / フィルタ仕様' },
    @{ Type = 'Bullets'; Items = @(
      '共通フィルタは部門 / 部署 / カテゴリ / 大分類 / 中分類 / 品目 / メーカー / 型式 / キーワードをAND条件で適用する',
      '`keyword` は `asset_no` / `equipment_no` / `asset_item_name` / `manufacturer_name` / `model_name` の表示列にのみ部分一致し、`decisionNote` など判定履歴メモは共通 keyword 検索に含めない',
      '一致検索は選択中リストの未完了台帳行と比較し、`CATEGORY` / `ASSET_NO` / `LARGE_CLASS` / `ASSET_ITEM` / `MANUFACTURER` のいずれか 1 種類を適用する',
      '統合リスト側の `tab=PENDING` は当該 `sessionListId` に対する `asset_data_matching_item_list_results.result_status=''ACTIVE''` が存在しない行、`tab=COMPLETED` は有効判定結果行が存在する行を返す',
      '固定資産台帳（対応中）画面とME管理台帳（対応中）画面は、主導線の session API と同一条件でフィルタリングする'
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Heading3'; Text = '基本エラーレスポンス（ErrorResponse）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや補足情報'),
      @('conflictItems', 'QrBindingConflictItem[]', '-', '`ORIGINAL_QR_BINDING_CONFLICT` 時の競合明細')
    ) },
    @{ Type = 'Heading3'; Text = 'conflictItems要素（QrBindingConflictItem）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('assetDataMatchingItemId', 'int64', '✓', '競合した統合リスト行ID'),
      @('qrIdentifier', 'string|null', '✓', '対象 QR 識別子。未解決時は null'),
      @('conflictType', 'string', '✓', '競合種別。`UNRESOLVED` / `DUPLICATED_IN_SESSION` / `NOT_ISSUED` / `DELETED` / `BOUND_OTHER_ASSET` / `FACILITY_MISMATCH`'),
      @('conflictingAssetDataMatchingItemId', 'int64|null', '✓', '`DUPLICATED_IN_SESSION` 時に衝突している相手側統合リスト行ID'),
      @('sourceSurveyRecordIds', 'int64[]', '✓', '競合判定の根拠となった現有品調査レコードID一覧'),
      @('conflictingQrCodeId', 'int64|null', '✓', '競合した `qr_codes.qr_code_id`。未発行時は null'),
      @('conflictingAssetLedgerId', 'int64|null', '✓', '既に紐づいていた `asset_ledgers.asset_ledger_id`。未紐付時は null')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API一覧' },
    @{ Type = 'Heading2'; Text = 'データ突合（/data-matching）' },
    @{ Type = 'Table'; Headers = @('機能名', 'Method', 'Path', '概要', '認証'); Rows = $apiListRows },

    @{ Type = 'Heading1'; Text = '第5章 データ突合機能設計' },
    @{ Type = 'EndpointBlocks'; Items = $endpointSpecs },

    @{ Type = 'Heading1'; Text = '第6章 原本生成マッピングルール' },
    @{ Type = 'Heading2'; Text = '台帳行 -> 原本直前スナップショット優先順位' },
    @{ Type = 'Table'; Headers = @('asset_data_matching_items', '更新元', '優先順位 / ルール'); Rows = @(
      @('category_id / category_name', '`asset_import_rows`', '`selected_category_*` → `suggested_category_*` → 既存代表行値。未確認追加行でいずれもない場合、名称のみ `parsed_category_name` を補完値として利用し、ID は NULL を許容する'),
      @('large_class_id / large_class_name', '`asset_import_rows`', '`selected_large_class_*` → `suggested_large_class_*` → 既存代表行値。未確認追加行で補完元がなければ NULL を許容する'),
      @('medium_class_id / medium_class_name', '`asset_import_rows`', '`selected_medium_class_*` → `suggested_medium_class_*` → 既存代表行値。未確認追加行で補完元がなければ NULL を許容する'),
      @('asset_item_id / asset_item_name', '`asset_import_rows`', '`selected_asset_item_*` → `suggested_asset_item_*` → 既存代表行値。未確認追加行で補完元がなければ NULL を許容する'),
      @('manufacturer_id / manufacturer_name', '`asset_import_rows`', '`selected_manufacturer_*` → `suggested_manufacturer_*` → 既存代表行値。未確認追加行でいずれもない場合、名称のみ `parsed_manufacturer_name` を補完値として利用する'),
      @('model_id / model_name', '`asset_import_rows`', '`selected_model_*` → `suggested_model_*` → 既存代表行値。未確認追加行でいずれもない場合、名称のみ `parsed_model_name` を補完値として利用する'),
      @('asset_name', '`asset_import_rows` と既存 snapshot', '`parsed_asset_name` → 既存 `asset_name` → `asset_item_name`。未確認追加行では `parsed_asset_name` → `selected_asset_item_name` → `suggested_asset_item_name` の順で補完する'),
      @('unit', '`asset_import_rows` と既存 snapshot', '`parsed_unit` → 既存 `unit`。未確認追加行で値がなければ NULL を許容する'),
      @('quantity', '`asset_import_rows` と既存 snapshot', '`parsed_quantity` がある場合はそれを採用し、ない場合は既存代表行値を保持する。未確認追加行で未入力なら 1 を既定値とする'),
      @('creation_type / item_status', 'system managed', '初期生成行は `SURVEY_BASE / ACTIVE`、未確認追加行は `UNCONFIRMED_IMPORT / ACTIVE`。差し戻しで根拠を失った未確認追加行は `INVALIDATED` とする'),
      @('matching_status', 'mutation payload', '`matches` は要求 `matchingStatus`、`mark-unregistered` は `UNREGISTERED`、`mark-unconfirmed` は `UNCONFIRMED` を保存し、`revert-decision` は残存する有効判定履歴から再計算して最新確定判定代表値とする'),
      @('detail_type / parent_asset_data_matching_item_id', 'representative item', '`matches` は要求 `representativeItemId` の既存値を保持し、矛盾する階層構造の選択は 409 (`MERGE_HIERARCHY_CONFLICT`) とする。`mark-unconfirmed` は `detail_type=''MAIN''` / `parent=NULL`'),
      @('qr_identifier / qr_resolution_status', '`asset_survey_records`', '現在代表元 `SURVEY_RECORD` 集合の `qr_identifier` 非NULL distinct 値を集約し、0 件なら `NONE`、1 件ならその値を採用して `RESOLVED`、2 件以上なら `qr_identifier=NULL` / `CONFLICT` とする')
    ) },
    @{ Type = 'Heading2'; Text = '共通 snapshot 再構築ルール' },
    @{ Type = 'Bullets'; Items = @(
      '更新系 API は、判定履歴または論理統合状態を保存した後に共通 snapshot 再構築サービスを呼び出し、影響 item の `asset_data_matching_items` / `asset_data_matching_item_sources` / `source_summary` / QR snapshot を `result_status=''ACTIVE''` の判定履歴と現在の論理統合状態から再計算する',
      '共通 snapshot 再構築サービスは、`asset_data_matching_item_list_results` を `asset_data_matching_session_lists.source_order ASC` の順で再適用し、操作順ではなく統合順を正とする',
      '差し戻し対象リストの判定履歴は `asset_data_matching_item_list_results.result_status=''REVERTED''` へ更新し、進捗・台帳行消費判定には以後利用しない',
      '対象 `sessionListId` によって論理統合された行は `merged_into_item_id` / `merged_by_session_list_id` を NULL に戻して復元する',
      '代表行の原本直前スナップショットと現在代表元は、残存する `result_status=''ACTIVE''` の判定履歴を `asset_data_matching_session_lists.source_order ASC` の順で再適用して再計算する',
      '有効判定履歴が1件も残らない代表行は、`matching_status` を NULL に戻し、`source_type=''IMPORT_ROW''` の現在代表元を持たない survey-only 行として扱う',
      '`creation_type=''UNCONFIRMED_IMPORT''` の行で有効判定履歴が1件も残らない場合は `item_status=''INVALIDATED''` とし、上パネル一覧 / 原本候補一覧 / 原本確定対象から除外する',
      '再計算時は `SURVEY_RECORD` 集合の QR も同時に見直し、`qr_identifier` / `qr_resolution_status` を同一トランザクションで再計算する'
    ) },
    @{ Type = 'Heading2'; Text = 'asset_data_matching_items -> asset_ledgers 主要マッピング' },
    @{ Type = 'Table'; Headers = @('asset_ledgers', '値の決定元', 'ルール'); Rows = @(
      @('facility_id', '`asset_data_matching_items.facility_id`', '必須。対象セッション施設と一致させる'),
      @('facility_location_id', '`asset_data_matching_items.facility_location_id`', '解決済みの場合に設定。未解決時は NULL'),
      @('ship_asset_master_id', '現時点では解決対象外', '本 API では決定せず、解決済み値がない場合は NULL で作成する'),
      @('category_id', '`asset_data_matching_items.category_id`', '必須。未解決なら原本確定不可'),
      @('large_class_name', '`asset_data_matching_items.large_class_name`', '必須。未解決なら原本確定不可'),
      @('medium_class_name', '`asset_data_matching_items.medium_class_name`', '必須。未解決なら原本確定不可'),
      @('asset_item_id', '`asset_data_matching_items.asset_item_id`', '解決済みの場合に設定。未解決時は NULL 可'),
      @('asset_item_name', '`asset_data_matching_items.asset_item_name`', '必須。未解決なら原本確定不可'),
      @('manufacturer_id / model_id', '`asset_data_matching_items.manufacturer_id` / `model_id`', '解決済みの場合に設定。未解決時は NULL 可'),
      @('manufacturer_name / model_name', '`asset_data_matching_items.manufacturer_name` / `model_name`', '表示スナップショットをそのまま複写する'),
      @('asset_name', '`asset_data_matching_items.asset_name`', '必須。通常は台帳 `parsed_asset_name` 優先、未確認・現有品のみ行は `asset_item_name` 補完値を許容する'),
      @('asset_no / equipment_no / serial_no', '`asset_data_matching_items.asset_no` / `equipment_no` / `serial_no`', '保持しているスナップショットをそのまま複写する'),
      @('detail_type', '`asset_data_matching_items.detail_type`', '保持値を複写する。台帳のみの未確認追加行は `MAIN` を既定とする'),
      @('parent_asset_ledger_id', '`asset_data_matching_items.parent_asset_data_matching_item_id`', '親統合リスト行から先に `asset_ledgers` を作成し、その採番結果へ変換して設定する'),
      @('quantity', '`asset_data_matching_items.quantity`', '必須。未解決なら原本確定不可'),
      @('unit', '`asset_data_matching_items.unit`', '保持値を複写する。未解決時は NULL 可'),
      @('status', '固定値', '`ACTIVE` を設定する'),
      @('is_leased / is_rented_out', '固定値', 'いずれも `false` を設定する'),
      @('その他 nullable 項目', '固定値または未設定', '本 API の確定時点で値を持たない列は NULL またはテーブル既定値で作成し、後続の台帳保守機能で更新する')
    ) },
    @{ Type = 'Heading2'; Text = '原本確定時の QR 紐付け更新ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`merged_into_item_id IS NULL AND item_status=''ACTIVE''` かつ `qr_resolution_status=''RESOLVED''` かつ `qr_identifier IS NOT NULL` の統合リスト行のみを QR 紐付け更新対象とする',
      '`item_status=''ACTIVE''` な統合リスト行のうち `qr_resolution_status=''CONFLICT''` の行が1件でも残る場合は、QR 採否未解決として 409 (`ORIGINAL_QR_BINDING_CONFLICT`) とし、`ErrorResponse.conflictItems[].conflictType=''UNRESOLVED''` を返す',
      '対象 QR は `(facility_id, qr_identifier)` で `qr_codes` を解決し、未発行、論理削除済み、同一セッション内重複、別資産への既存紐付け、施設不整合のいずれかに該当する場合は 409 (`ORIGINAL_QR_BINDING_CONFLICT`) とする',
      '対応する `asset_ledgers` 作成後に `qr_codes.asset_ledger_id` へ採番済み `asset_ledger_id` を設定し、更新は原本生成と同一トランザクションで完了させる',
      '原本確定後の QR 再発行、貼替え、別資産への付替えは本 API の責務に含めず、QR発行・台帳保守側の機能で扱う'
    ) },
    @{ Type = 'Heading2'; Text = '原本確定時の生成順序' },
    @{ Type = 'Bullets'; Items = @(
      '原本確定前に、対象セッションの `asset_data_matching_items` のうち `merged_into_item_id IS NULL AND item_status=''ACTIVE''` の有効行について必須項目の充足を検証し、不足行が1件でもあれば確定を中止する',
      '生成順序は `merged_into_item_id IS NULL AND item_status=''ACTIVE''` かつ `parent_asset_data_matching_item_id IS NULL` の行から開始し、親の `asset_ledger_id` が確定した後に子行の `parent_asset_ledger_id` へ設定する',
      '`qr_resolution_status=''RESOLVED''` かつ `qr_identifier` が設定された行は、対応する `asset_ledger_id` が確定した時点で `qr_codes.asset_ledger_id` を更新し、未解決または競合があれば 409 エラーとして原本確定を失敗させる',
      '親参照が欠落している行、循環参照、または別セッション行を参照する親子関係は 409 エラーとして原本確定を失敗させる',
      '原本生成と QR 紐付け更新が完了した後に `asset_data_matching_sessions.session_status` を `CONFIRMED` とし、同セッションを read-only 化する'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '必要権限' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定基準', '説明'); Rows = @(
      @('データ突合の全 API', '`survey_ledger_matching`', 'Bearer トークン上の作業対象施設に対して実効 `survey_ledger_matching` を持つこと', 'データ突合セッション開始、一覧取得、判定登録、原本確定を行う')
    ) },
    @{ Type = 'Heading2'; Text = 'セッション運用ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`asset_data_matching_sessions.session_status=''IN_PROGRESS''` のセッションは施設ごとに 1 件までとし、同一施設内では別ユーザーが途中から継続できる前提とする',
      '新規セッション開始時に、基底現有品調査セッションと統合対象 `asset_import_jobs` をスナップショットとして確定し、進行中に新しい台帳リストが増えても自動追加しない',
      '基底現有品調査セッションが存在しない施設ではデータ突合セッションを開始できない',
      '`source_type=''IMPORT_JOB'' AND merge_status=''PENDING''` のうち `source_order` 最小の 1 件を現在処理対象リストとし、判定登録と `COMPLETE_LIST` はこのリストに対してのみ許可する',
      '`COMPLETE_LIST` 済みリストであっても、セッションが `IN_PROGRESS` の間は `revert-decision` により `PENDING` へ再オープンできる',
      '`CONFIRMED` となったセッションは read-only とし、再度の判定登録や再確定は受け付けない'
    ) },
    @{ Type = 'Heading2'; Text = '統合判定ルール' },
    @{ Type = 'Bullets'; Items = @(
      '1 回の `matches` 実行では、下パネル 1 件に対して上パネル 1 件以上を選択し、`representativeItemId` で代表行を明示する',
      '原本リスト 1 行は `現有品調査のみ`、`台帳のみ`、`台帳1 + 現有品調査n` のいずれでも成立できる',
      '同一 source label に対して複数の `IMPORT_ROW` を 1 行へ集約する選択は許可せず、`台帳1 : 現有品調査n` 制約を維持する',
      '複数の統合リスト行を 1 行へ再集約できるのは、代表行以外の行が他の `asset_data_matching_item_list_results` 判定履歴を持たず、かつ他行から `parent_asset_data_matching_item_id` で参照されていない場合に限る',
      '選択した統合リスト行どうしで `detail_type` または `parent_asset_data_matching_item_id` が矛盾する場合はマージせず、409 (`MERGE_HIERARCHY_CONFLICT`) を返す',
      '再集約時も代表行以外を物理削除せず、`merged_into_item_id` と `merged_by_session_list_id` により論理統合状態として保持する',
      '`mark-unregistered` は既存の統合リスト行を残したまま `UNREGISTERED` とし、`mark-unconfirmed` は台帳行から新しい統合リスト行を追加して `UNCONFIRMED` とする',
      '同一セッション内で同一 `asset_import_row_id` と同一 `asset_survey_record_id` は、`asset_data_matching_item_sources.active_*_key` の一意制約により、`merged_into_item_id IS NULL AND item_status=''ACTIVE''` な有効統合リスト行に対して 1 つの統合リスト行にのみ属する',
      '`mark-unconfirmed` で追加した `UNCONFIRMED_IMPORT` 行は、差し戻し後に有効判定根拠を失った場合 `INVALIDATED` として原本候補から除外する',
      '差し戻しは、対象リストより後続 `source_order` のリストに `ACTIVE` 判定履歴が残らない場合に限り許可し、後ろから順にのみ戻せる',
      '同一統合リスト行に集約された `SURVEY_RECORD` 集合の QR は `asset_data_matching_items.qr_identifier` / `qr_resolution_status` へ正規化し、原本確定前に `result` / `context` で可視化する',
      '現在リストに対する進捗、`対応中` / `対応済み`、台帳行消費判定の正本は `asset_data_matching_item_list_results` とし、`asset_data_matching_items.source_summary` は画面表示用途に限定する',
      '誤判定差し戻し時は、対象リストの有効判定履歴を履歴化し、必要に応じて論理統合行を復元した上で代表 snapshot を再計算する'
    ) },
    @{ Type = 'Heading2'; Text = '完了・原本確定ルール' },
    @{ Type = 'Bullets'; Items = @(
      '現在リスト完了（`COMPLETE_LIST`）は、当該リストに対する未判定の統合リスト行と未処理台帳行が 0 件の場合のみ許可する',
      '残りリストがある状態で原本確定する場合は `skipRemaining=true` を必須とし、残存 `PENDING` リストを `SKIPPED` として監査可能に残す',
      '原本確定時は `asset_data_matching_items` の原本直前スナップショットを使って `asset_ledgers` を作成し、`qr_resolution_status=''RESOLVED''` かつ `qr_identifier` がある行は対応する `qr_codes.asset_ledger_id` も同一トランザクションで更新する。原本生成時に元の `asset_survey_records` / `asset_import_rows` を再解釈しない',
      '原本確定可否の正本は `result` / `context` が返す `canConfirmOriginal`、`unreadyItemCount`、`qrBlockingItemCount`、各 item の `blockingReasons` とする',
      '確定後の台帳編集、QR 再発行、QR 貼替え、別資産への付替え責務は本 API 群に含めず、以後の台帳保守・QR発行機能で扱う'
    ) },
    @{ Type = 'Heading2'; Text = '参考画面の扱い' },
    @{ Type = 'Bullets'; Items = @(
      '`/data-matching/ledger` と `/data-matching/me-ledger` は現行主導線の参考画面とし、独立した正本 API 群は設けない',
      '参考画面は session API で取得した候補一覧と `mark-unconfirmed` の結果を利用する',
      '`asset_import_survey_mappings` は個別対応履歴や補助管理に利用できるが、主導線 `/data-matching` の正本は `asset_data_matching_items` / `asset_data_matching_item_sources` / `asset_data_matching_item_list_results` とする'
    ) },

    @{ Type = 'Heading1'; Text = '第8章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '説明'); Rows = @(
      @('VALIDATION_ERROR', '400', '入力不正、必須不足、フィルタ条件不正'),
      @('FACILITY_SELECTION_REQUIRED', '400', '対象施設を確定できない状態で実行した'),
      @('IDEMPOTENCY_KEY_REQUIRED', '400', '更新系 API に `Idempotency-Key` が指定されていない'),
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
      @('AUTH_403_SURVEY_LEDGER_MATCHING_DENIED', '403', '作業対象施設に対する実効 `survey_ledger_matching` がない、または対象施設不一致'),
      @('FACILITY_NOT_FOUND', '404', '対象施設が存在しない、または削除済み'),
      @('DATA_MATCHING_SESSION_NOT_FOUND', '404', '対象データ突合セッションが存在しない'),
      @('DATA_MATCHING_SESSION_LIST_NOT_FOUND', '404', '対象統合対象リストが存在しない'),
      @('DATA_MATCHING_MERGED_ITEM_NOT_FOUND', '404', '対象統合リスト行が存在しない'),
      @('DATA_MATCHING_DECISION_RESULT_NOT_FOUND', '404', '差し戻し対象の有効判定結果が存在しない'),
      @('DATA_MATCHING_LEDGER_ITEM_NOT_FOUND', '404', '対象台帳行が存在しない'),
      @('BASE_SURVEY_SESSION_NOT_FOUND', '404', '基底に使える現有品調査セッションが存在しない'),
      @('SESSION_CONFLICT', '409', '要求 `lockVersion` と現在の `asset_data_matching_sessions.lock_version` が一致しない'),
      @('LIST_SNAPSHOT_EXPIRED', '409', '一覧取得に指定した `lockVersion` が現在の session snapshot と一致しない'),
      @('SESSION_STATUS_INVALID', '409', 'セッション状態上、要求処理を実行できない'),
      @('SESSION_LIST_TYPE_MISMATCH', '409', '指定した session list と API の期待リスト種別が一致しない'),
      @('SESSION_LIST_SEQUENCE_INVALID', '409', '指定した session list が現在処理対象の最小 `source_order` `PENDING` リストではない'),
      @('IDEMPOTENCY_KEY_REUSED', '409', '同一 `Idempotency-Key` で異なる payload が再送された'),
      @('MERGED_ITEM_NOT_MERGEABLE', '409', '指定した統合リスト行が他リスト判定履歴または子参照を持つため、再集約できない'),
      @('MERGE_HIERARCHY_CONFLICT', '409', '代表行指定と `detail_type` / `parent_asset_data_matching_item_id` の階層整合性が取れない統合リスト行の再集約を要求した'),
      @('MATCH_SELECTION_INVALID', '409', '選択件数や選択状態が判定ルールを満たさない'),
      @('MATCH_RULE_VIOLATION', '409', '`台帳1 : 現有品調査n` 制約、または `asset_data_matching_item_sources.active_*_key` の一意制約に抵触した'),
      @('LEDGER_ROW_ALREADY_CONSUMED', '409', '対象 `sessionListId` で指定した台帳行がすでに他の判定結果で消費済みである'),
      @('RESULT_REVERT_NOT_ALLOWED', '409', '対象判定結果が確定済みセッションに属する、後続 `source_order` の `ACTIVE` 判定が残っている、または差し戻し不可状態である'),
      @('CURRENT_LIST_NOT_COMPLETED', '409', '現在リストに未判定の統合リスト行または未処理台帳行が残っている'),
      @('ORIGINAL_LEDGER_SNAPSHOT_INCOMPLETE', '409', '原本直前スナップショットに必須項目不足、親子不整合、または循環参照がある'),
      @('ORIGINAL_QR_BINDING_CONFLICT', '409', '原本確定時の QR 解決または紐付け更新に失敗した（QR 採否未解決、未発行、論理削除済み、同一セッション内重複、別資産紐付済み、施設不整合）。`ErrorResponse.conflictItems[]` で競合明細を返す'),
      @('ORIGINAL_CONFIRM_NOT_ALLOWED', '409', '途中確定条件を満たさない、または確定済みセッションに対して再確定を要求した'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー')
    ) },

    @{ Type = 'Heading1'; Text = '第9章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = '運用方針' },
    @{ Type = 'Bullets'; Items = @(
      '画面表示時は `/data-matching/context` で進行中セッション有無を確認し、既存セッションがあれば必ずそれを再開する',
      '共通フィルタ候補と一致検索条件の UI 変更時は、`merged-items` / `fixed-asset-ledger-items` / `me-ledger-items` のクエリ仕様と `cursor` 継続取得仕様を同時に見直す',
      '原本確定前のレビューは `/data-matching/sessions/{sessionId}/result` を正本とし、クライアント側で独自に統合結果を再計算しない',
      '原本確定後の `asset_ledgers` 件数が `mergedItemCount` と一致し、`qrResolutionStatus=''RESOLVED''` の確定行は対応する `qr_codes.asset_ledger_id` が設定されていることを監査対象とする'
    ) },
    @{ Type = 'Heading2'; Text = '今後拡張時の留意点' },
    @{ Type = 'Bullets'; Items = @(
      'その他台帳リストの種類が増える場合は、`listType` と `source_order` の決定ルールを追加定義する',
      '個別対応履歴を画面上で詳細表示する要件が確定した場合は、`asset_import_survey_mappings` と主導線 session API の責務分担を再整理する',
      '`Idempotency-Key` の保持期間、`REVERTED` 判定履歴の保管年限、一覧 export 導線は運用設計で確定する'
    ) }
  )
}
