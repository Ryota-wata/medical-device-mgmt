$apiListRows = @(
  @('取込画面コンテキスト取得', 'GET', '/asset-import/context', '選択施設の前回ジョブとアップロード済み一覧を取得する', '要'),
  @('取込ジョブ作成・ファイルアップロード', 'POST', '/asset-import/jobs', '台帳ファイルをアップロードし取込ジョブを開始する', '要'),
  @('取込ジョブ状態取得', 'GET', '/asset-import/jobs/{assetImportJobId}', '取込ジョブの処理状態と件数を取得する', '要'),
  @('取込ジョブ再取込', 'POST', '/asset-import/jobs/{assetImportJobId}/retry', 'FAILED ジョブを参照して新しい取込ジョブを作成する', '要'),
  @('取込ジョブ削除', 'DELETE', '/asset-import/jobs/{assetImportJobId}', 'READY_FOR_MATCHING / FAILED ジョブと関連行を削除する', '要'),
  @('突き合わせ画面コンテキスト取得', 'GET', '/asset-matching/context', '突き合わせ対象ジョブの件数サマリとフィルタ候補を取得する', '要'),
  @('突き合わせ一覧取得', 'GET', '/asset-matching/rows', '取込結果一覧、AI推薦、保存済み選択値を取得する', '要'),
  @('突き合わせ候補取得', 'GET', '/asset-matching/master-options', 'Category/分類/品目/メーカー/型式の検索候補を取得する', '要'),
  @('突き合わせ行更新', 'PUT', '/asset-matching/rows/{assetImportRowId}', '行単位で選択値や確定フラグを更新する', '要'),
  @('突き合わせ一括確定', 'POST', '/asset-matching/rows/confirm-bulk', '選択行をまとめて確定する', '要'),
  @('突き合わせ結果Excel出力', 'GET', '/asset-matching/export', '現在の絞り込み結果を Excel で出力する', '要'),
  @('突き合わせ完了', 'POST', '/asset-matching/complete', '対象ジョブを突き合わせ完了へ更新する', '要')
)

$endpointSpecs = @(
  @{
    Title = '取込画面コンテキスト取得（/asset-import/context）'
    Overview = '資産台帳取込画面の初期表示に必要な情報を取得する。選択施設が確定している場合は前回取込ジョブを確認し、再開対象ジョブやアップロード済み一覧を返却する。'
    Method = 'GET'
    Path = '/asset-import/context'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('facilityId', 'query', 'int64', '条件付き', '選択施設ID。トークンから施設を導出できる場合は省略可能'),
      @('ignoreFailedJobId', 'query', 'int64', '-', 'FAILED 画面からアップロード画面へ戻る際に、今回の自動再開判定から除外するジョブID')
    )
    PermissionLines = @(
      '認可条件: 選択施設が確定している場合は、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
      '認可条件: 選択施設が確定している場合は、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_ledger_import` が有効であること'
    )
    ProcessingLines = @(
      '選択施設が確定している場合は、`facilityId` 省略時に Bearer トークン上の作業対象施設IDを採用し、指定時はそれと一致することを検証する',
      '選択施設が確定している場合は、対象施設が `facilities.deleted_at IS NULL` の未削除施設であることを検証する',
      '選択施設が未確定の場合は施設判定を行わず、施設選択が必要であることを返す',
      '選択施設が確定している場合は施設単位で前回ジョブ（`PROCESSING` / `READY_FOR_MATCHING` / `FAILED`）の有無を判定する',
      '`ignoreFailedJobId` が指定された場合は、同一 `FAILED` ジョブに対する今回の自動再開判定を抑止する',
      '前回ジョブがある場合は `/asset-import` を経由せず `/asset-matching` へ遷移できる情報を返す',
      'アップロード済みファイル一覧は選択施設に紐づく単一ファイルジョブの一覧として返却する。複数件が存在する場合は複数ジョブの履歴を表す'
    )
    ResponseTitle = 'レスポンス（200：AssetImportContextResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('selectedFacility', 'FacilitySummary|null', '✓', '対象施設。未確定時は null'),
      @('facilitySelectionRequired', 'boolean', '✓', '選択施設が未確定で施設選択が必要な場合は true'),
      @('activeJob', 'AssetImportJobSummary|null', '✓', '再開/失敗表示対象ジョブ。存在しない場合は null'),
      @('uploadedFiles', 'AssetImportUploadedFile[]', '✓', 'アップロード済みファイル一覧'),
      @('redirectToMatching', 'boolean', '✓', '前回ジョブがあり `/asset-matching` へ直接遷移すべき場合は true')
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
        Title = 'activeJob（AssetImportJobSummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('assetImportJobId', 'int64', '✓', '資産インポートジョブID'),
          @('importType', 'string', '✓', '取込種別。`FIXED_ASSET` / `OTHER_LEDGER`'),
          @('fileName', 'string', '✓', 'ファイル名'),
          @('status', 'string', '✓', 'ジョブ状態。`PROCESSING` / `READY_FOR_MATCHING` / `MATCHING_COMPLETED` / `FAILED`'),
          @('totalRows', 'int32', '✓', '取込行総数'),
          @('confirmedRows', 'int32', '✓', '確定済み件数'),
          @('remainingRows', 'int32', '✓', '未確定件数'),
          @('uploadedAt', 'datetime', '✓', 'アップロード日時'),
          @('failureReason', 'string', '-', '失敗理由。`FAILED` 時のみ返却し、`asset_import_jobs.error_message` を返す')
        )
      },
      @{
        Title = 'uploadedFiles要素（AssetImportUploadedFile）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('assetImportJobId', 'int64', '✓', '資産インポートジョブID'),
          @('importType', 'string', '✓', '取込種別'),
          @('fileName', 'string', '✓', 'ファイル名'),
          @('rowCount', 'int32', '✓', '取込件数'),
          @('status', 'string', '✓', 'ジョブ状態'),
          @('uploadedAt', 'datetime', '✓', 'アップロード日時')
        )
      }
    )
    StatusRows = @(
      @('200', '取得成功', 'AssetImportContextResponse'),
      @('400', 'facilityId 不正など入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `asset_ledger_import` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象施設が存在しない、または削除済み', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '取込ジョブ作成・ファイルアップロード（/asset-import/jobs）'
    Overview = '台帳ファイルを受け取り、資産インポートジョブを作成する。ジョブ作成後に各行を `asset_import_rows` へ展開し、AI 推薦候補を初期計算する。'
    Method = 'POST'
    Path = '/asset-import/jobs'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('facilityId', 'formData', 'int64', '条件付き', '対象施設ID。トークンから施設を導出できる場合は省略可能'),
      @('importType', 'formData', 'string', '✓', '取込種別。`FIXED_ASSET` / `OTHER_LEDGER`'),
      @('file', 'formData', 'binary', '✓', 'アップロードファイル（`.xlsx` / `.xls` / `.csv`、10MB 以下）')
    )
    PermissionLines = @(
      '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
      '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_ledger_import` が有効であること'
    )
    ProcessingLines = @(
      '`facilityId` 省略時に Bearer トークン上の作業対象施設IDを採用し、指定時はそれと一致することを検証する',
      '対象施設が `facilities.deleted_at IS NULL` の未削除施設であることを検証する',
      '拡張子とファイルサイズを検証し、不正時は 400 を返却する',
      '未完了ジョブが同一施設に存在する場合は新規作成不可とする',
      '`asset_import_jobs` を `PROCESSING` で作成し、ファイルを行単位に分解して `asset_import_rows` を作成する',
      '`selected_*_id` / `suggested_*_id` に使う参照マスタは、存在し、かつ削除済みでないことを前提に保存する',
      '各行について資産マスタ/JMDNマスタとの類似度計算を行い、最良候補の `suggested_*_name` / `suggested_*_id` と `suggested_score` を保存する',
      '初期取込完了後に `asset_import_jobs.status` を `READY_FOR_MATCHING` へ更新する',
      '処理時間が長い場合に備え、本APIは 202 Accepted でジョブを返却し、完了判定は状態照会APIで行う前提とする'
    )
    ResponseTitle = 'レスポンス（202：AssetImportJobAcceptedResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('assetImportJobId', 'int64', '✓', '作成した資産インポートジョブID'),
      @('status', 'string', '✓', '受付直後状態。通常は `PROCESSING`'),
      @('nextPollUrl', 'string', '✓', '状態照会APIのURL'),
      @('message', 'string', '✓', '利用者向けメッセージ')
    )
    StatusRows = @(
      @('202', '受付成功（処理中）', 'AssetImportJobAcceptedResponse'),
      @('400', '形式不正、サイズ超過、必須不足', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `asset_ledger_import` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象施設が存在しない、または削除済み', 'ErrorResponse'),
      @('409', '同一施設に未完了ジョブが存在する', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '取込ジョブ状態取得（/asset-import/jobs/{assetImportJobId}）'
    Overview = '指定した資産インポートジョブの処理状態と件数を取得する。アップロード直後のポーリング、および取込済みファイル詳細の表示に利用する。'
    Method = 'GET'
    Path = '/asset-import/jobs/{assetImportJobId}'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('assetImportJobId', 'path', 'int64', '✓', '資産インポートジョブID')
    )
    PermissionLines = @(
      '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
      '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_ledger_import` が有効であること'
    )
    ProcessingLines = @(
      '対象ジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する'
    )
    ResponseTitle = 'レスポンス（200：AssetImportJobStatusResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('assetImportJobId', 'int64', '✓', '資産インポートジョブID'),
      @('facilityId', 'int64', '✓', '施設ID'),
      @('facilityName', 'string', '✓', '施設名'),
      @('importType', 'string', '✓', '取込種別'),
      @('fileName', 'string', '✓', 'ファイル名'),
      @('status', 'string', '✓', 'ジョブ状態'),
      @('totalRows', 'int32', '✓', '総行数'),
      @('confirmedRows', 'int32', '✓', '確定済み件数'),
      @('remainingRows', 'int32', '✓', '未確定件数'),
      @('startedAt', 'datetime', '-', '開始日時'),
      @('finishedAt', 'datetime', '-', '終了日時'),
      @('failureReason', 'string', '-', '失敗理由。`FAILED` 時のみ返却し、`asset_import_jobs.error_message` を返す')
    )
    StatusRows = @(
      @('200', '取得成功', 'AssetImportJobStatusResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `asset_ledger_import` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象ジョブが存在しない', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '取込ジョブ再取込（/asset-import/jobs/{assetImportJobId}/retry）'
    Overview = 'FAILED となった取込ジョブを参照し、`asset_import_jobs.file_path` に保持した元ファイルを使って新しい資産インポートジョブを作成する。元の FAILED ジョブは履歴として保持する。'
    Method = 'POST'
    Path = '/asset-import/jobs/{assetImportJobId}/retry'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('assetImportJobId', 'path', 'int64', '✓', '再取込元の FAILED ジョブID')
    )
    PermissionLines = @(
      '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
      '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_ledger_import` が有効であること'
    )
    ProcessingLines = @(
      '対象ジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する',
      '対象ジョブが `FAILED` であることを検証する',
      '`asset_import_jobs.file_path` に保持した元ファイルを再利用し、新しい `asset_import_jobs` を `PROCESSING` で作成する',
      '元の FAILED ジョブとその失敗情報は監査用に保持する',
      '新規ジョブ作成後の処理内容は通常の `/asset-import/jobs` と同じとする'
    )
    ResponseTitle = 'レスポンス（202：AssetImportJobRetryAcceptedResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('assetImportJobId', 'int64', '✓', '新しく作成した資産インポートジョブID'),
      @('retriedFromAssetImportJobId', 'int64', '✓', '再取込元の FAILED ジョブID'),
      @('status', 'string', '✓', '受付直後状態。通常は `PROCESSING`'),
      @('nextPollUrl', 'string', '✓', '新規ジョブの状態照会APIのURL'),
      @('message', 'string', '✓', '利用者向けメッセージ')
    )
    StatusRows = @(
      @('202', '受付成功（処理中）', 'AssetImportJobRetryAcceptedResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `asset_ledger_import` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象ジョブが存在しない', 'ErrorResponse'),
      @('409', 'FAILED 以外の状態、または再取込不可状態', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '取込ジョブ削除（/asset-import/jobs/{assetImportJobId}）'
    Overview = 'READY_FOR_MATCHING または FAILED の取込ジョブを削除する。関連する `asset_import_rows` と `asset_import_jobs.file_path` で管理する保存元ファイルもあわせて削除対象とする。'
    Method = 'DELETE'
    Path = '/asset-import/jobs/{assetImportJobId}'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('assetImportJobId', 'path', 'int64', '✓', '削除対象ジョブID')
    )
    PermissionLines = @(
      '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
      '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_ledger_import` が有効であること'
    )
    ProcessingLines = @(
      '対象ジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する',
      '削除対象は `READY_FOR_MATCHING` / `FAILED` のジョブに限定し、`PROCESSING` / `MATCHING_COMPLETED` は 409 とする',
      'ジョブ本体、取込行、保持している元ファイルを一括削除する',
      '突き合わせ途中のデータも削除されるため、確認ダイアログの後に実行する'
    )
    ResponseTitle = 'レスポンス（204：No Content）'
    ResponseLines = @(
      'Body は返却しない。'
    )
    StatusRows = @(
      @('204', '削除成功', '-'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `asset_ledger_import` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象ジョブが存在しない', 'ErrorResponse'),
      @('409', '削除不可状態である', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '突き合わせ画面コンテキスト取得（/asset-matching/context）'
    Overview = '突き合わせ画面の初期表示に必要なジョブサマリ、件数、行由来のフィルタ候補を取得する。ジョブ状態に応じて待機表示、失敗表示、通常の突き合わせ表示を切り替えるために利用する。'
    Method = 'GET'
    Path = '/asset-matching/context'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('assetImportJobId', 'query', 'int64', '-', '対象ジョブID。指定時は当該ジョブを取得する'),
      @('facilityId', 'query', 'int64', '条件付き', '前回ジョブを施設単位で解決する場合の施設ID')
    )
    PermissionLines = @(
      '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
      '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること'
    )
    ProcessingLines = @(
      '対象ジョブ解決後、その `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する',
      '再開対象ジョブが施設単位で 1 件である前提で、`assetImportJobId` 未指定時は施設から `PROCESSING` / `READY_FOR_MATCHING` / `FAILED` の前回ジョブを解決する',
      '全体/残り/完了件数を `asset_import_rows` から集計する',
      '`PROCESSING` / `FAILED` の場合でも `job.status` と `failureReason` を返し、画面状態切替の正本とする',
      '部門/部署のフィルタ候補は `READY_FOR_MATCHING` の場合のみ対象ジョブの `parsed_department_name` / `parsed_section_name` から一意抽出し、それ以外は空配列とする'
    )
    ResponseTitle = 'レスポンス（200：AssetMatchingContextResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('job', 'AssetImportJobStatusResponse', '✓', '対象ジョブ概要'),
      @('counts', 'AssetMatchingCountSummary', '✓', '件数サマリ'),
      @('filterOptions', 'AssetMatchingFilterOptions', '✓', 'フィルタ候補')
    )
    ResponseSubtables = @(
      @{
        Title = 'counts（AssetMatchingCountSummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('totalRows', 'int32', '✓', '総件数'),
          @('remainingRows', 'int32', '✓', '未確定件数'),
          @('completedRows', 'int32', '✓', '確定済み件数')
        )
      },
      @{
        Title = 'filterOptions（AssetMatchingFilterOptions）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('departmentOptions', 'string[]', '✓', '部門候補'),
          @('sectionOptions', 'string[]', '✓', '部署候補')
        )
      }
    )
    StatusRows = @(
      @('200', '取得成功', 'AssetMatchingContextResponse'),
      @('400', 'ジョブ指定不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `survey_ledger_matching` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象ジョブが存在しない', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '突き合わせ一覧取得（/asset-matching/rows）'
    Overview = '取込結果一覧、AI推薦、保存済み選択値を取得する。部門/部署/Category/大分類/中分類/品目で絞り込み可能とし、既定では未確定行のみ返却する。'
    Method = 'GET'
    Path = '/asset-matching/rows'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('assetImportJobId', 'query', 'int64', '✓', '対象ジョブID'),
      @('departmentName', 'query', 'string', '-', '取込元部門名の一致条件'),
      @('sectionName', 'query', 'string', '-', '取込元部署名の一致条件'),
      @('selectedCategoryId', 'query', 'int64', '-', '選択済みCategoryIDの条件'),
      @('selectedLargeClassId', 'query', 'int64', '-', '選択済み大分類IDの条件'),
      @('selectedMediumClassId', 'query', 'int64', '-', '選択済み中分類IDの条件'),
      @('selectedAssetItemId', 'query', 'int64', '-', '選択済み品目IDの条件'),
      @('includeConfirmed', 'query', 'boolean', '-', 'true の場合は確定済み行も返却する。省略時は false')
    )
    PermissionLines = @(
      '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
      '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること'
    )
    ProcessingLines = @(
      '対象ジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する',
      '対象ジョブが `READY_FOR_MATCHING` であることを前提とし、それ以外の状態では 409 を返却する',
      '部門/部署/Category/大分類/中分類/品目は AND 条件で絞り込む',
      '既定では未確定行のみ返却し、`includeConfirmed=true` の場合のみ確定済み行を含める',
      '表示値は `asset_import_rows` に保存した `suggested_*_name` / `selected_*_name` を返却し、マスタ選択済みの場合のみ対応する `*_id` を返却する',
      '現在の画面 DTO では共通部門/共通部署/品目名(原)/メーカー名(原)/型式(原)/数量の表示に必要な項目のみ返却し、固定資産番号/管理機器番号/諸室名称/Category/検収日は監査・後続利用向けに `asset_import_rows` / `raw_data_json` へ保持する',
      '画面要件上ページングは定義しない'
    )
    ResponseTitle = 'レスポンス（200：AssetMatchingRowListResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('totalCount', 'int32', '✓', '返却件数'),
      @('items', 'AssetMatchingRowSummary[]', '✓', '突き合わせ行一覧')
    )
    ResponseSubtables = @(
      @{
        Title = 'items要素（AssetMatchingRowSummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('assetImportRowId', 'int64', '✓', '資産インポート行ID'),
          @('rowNo', 'int32', '✓', '行番号'),
          @('parsedDepartmentName', 'string', '-', '部門名（取込）'),
          @('parsedSectionName', 'string', '-', '部署名（取込）'),
          @('parsedAssetName', 'string', '-', '品目名（原）。`asset_import_rows.parsed_asset_name` を返す'),
          @('parsedManufacturerName', 'string', '-', 'メーカー名（原）。`asset_import_rows.parsed_manufacturer_name` を返す'),
          @('parsedModelName', 'string', '-', '型式名（原）。`asset_import_rows.parsed_model_name` を返す'),
          @('parsedQuantity', 'int32', '-', '数量（取込）'),
          @('parsedUnit', 'string', '-', '単位（取込）'),
          @('suggestedMatch', 'AssetMatchSelection|null', '✓', 'AI推薦候補'),
          @('selectedMatch', 'AssetMatchSelection|null', '✓', 'ユーザー選択結果'),
          @('isConfirmed', 'boolean', '✓', '確定済みフラグ')
        )
      },
      @{
        Title = 'AssetMatchSelection'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('categoryId', 'int64', '-', 'CategoryID。自由記述時は null'),
          @('categoryName', 'string', '-', 'Category表示名。表示値スナップショット'),
          @('largeClassId', 'int64', '-', '大分類ID。自由記述時は null'),
          @('largeClassName', 'string', '-', '大分類表示名。表示値スナップショット'),
          @('mediumClassId', 'int64', '-', '中分類ID。自由記述時は null'),
          @('mediumClassName', 'string', '-', '中分類表示名。表示値スナップショット'),
          @('assetItemId', 'int64', '-', '品目ID。自由記述時は null'),
          @('assetItemName', 'string', '-', '品目表示名。表示値スナップショット'),
          @('manufacturerId', 'int64', '-', 'メーカーID。自由記述時は null'),
          @('manufacturerName', 'string', '-', 'メーカー表示名。表示値スナップショット'),
          @('modelId', 'int64', '-', '型式ID。自由記述時は null'),
          @('modelName', 'string', '-', '型式表示名。表示値スナップショット'),
          @('score', 'decimal(5,3)', '-', 'AI推薦時のみ返却する類似度スコア')
        )
      }
    )
    StatusRows = @(
      @('200', '取得成功', 'AssetMatchingRowListResponse'),
      @('400', '検索条件不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `survey_ledger_matching` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象ジョブが存在しない', 'ErrorResponse'),
      @('409', 'ジョブ状態上、一覧取得不可', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '突き合わせ候補取得（/asset-matching/master-options）'
    Overview = 'Category / 大分類 / 中分類 / 品目 / メーカー / 型式の検索候補を取得する。親階層の選択値に応じて候補を絞り込む。'
    Method = 'GET'
    Path = '/asset-matching/master-options'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('field', 'query', 'string', '✓', '取得対象。`CATEGORY` / `LARGE_CLASS` / `MEDIUM_CLASS` / `ITEM` / `MANUFACTURER` / `MODEL`'),
      @('keyword', 'query', 'string', '-', '候補名称の部分一致検索'),
      @('categoryId', 'query', 'int64', '-', '親CategoryID'),
      @('largeClassId', 'query', 'int64', '-', '親大分類ID'),
      @('mediumClassId', 'query', 'int64', '-', '親中分類ID'),
      @('assetItemId', 'query', 'int64', '-', '親品目ID'),
      @('manufacturerId', 'query', 'int64', '-', '親メーカーID')
    )
    PermissionLines = @(
      '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
      '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること'
    )
    ProcessingLines = @(
      'Bearer トークン上の作業対象施設が `facilities.deleted_at IS NULL` の未削除施設であることを検証する',
      '候補は指定した階層に応じたマスタテーブルから取得する',
      '親階層が指定された場合は整合する子候補だけを返却する',
      '検索条件は部分一致を基本とする'
    )
    ResponseTitle = 'レスポンス（200：AssetMatchingMasterOptionResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('field', 'string', '✓', '取得対象フィールド'),
      @('items', 'MasterOption[]', '✓', '候補一覧')
    )
    ResponseSubtables = @(
      @{
        Title = 'items要素（MasterOption）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('id', 'int64', '✓', '候補ID'),
          @('name', 'string', '✓', '候補表示名')
        )
      }
    )
    StatusRows = @(
      @('200', '取得成功', 'AssetMatchingMasterOptionResponse'),
      @('400', 'field 不正など入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `survey_ledger_matching` なし', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '突き合わせ行更新（/asset-matching/rows/{assetImportRowId}）'
    Overview = '行単位で確定値を保存する。未確定行の編集保存と単票確定の両方に利用する。'
    Method = 'PUT'
    Path = '/asset-matching/rows/{assetImportRowId}'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('assetImportRowId', 'path', 'int64', '✓', '更新対象の資産インポート行ID')
    )
    RequestTitle = 'リクエストボディ'
    RequestHeaders = @('フィールド', '型', '必須', '説明')
    RequestRows = @(
      @('selectedCategoryName', 'string', '-', '選択Category表示名。自由記述時は入力値を保存する'),
      @('selectedCategoryId', 'int64', '-', '選択CategoryID。自由記述時は null'),
      @('selectedLargeClassName', 'string', '-', '選択大分類表示名。自由記述時は入力値を保存する'),
      @('selectedLargeClassId', 'int64', '-', '選択大分類ID。自由記述時は null'),
      @('selectedMediumClassName', 'string', '-', '選択中分類表示名。自由記述時は入力値を保存する'),
      @('selectedMediumClassId', 'int64', '-', '選択中分類ID。自由記述時は null'),
      @('selectedAssetItemName', 'string', '-', '選択品目表示名。自由記述時は入力値を保存する'),
      @('selectedAssetItemId', 'int64', '-', '選択品目ID。自由記述時は null'),
      @('selectedManufacturerName', 'string', '-', '選択メーカー表示名。自由記述時は入力値を保存する'),
      @('selectedManufacturerId', 'int64', '-', '選択メーカーID。自由記述時は null'),
      @('selectedModelName', 'string', '-', '選択型式表示名。自由記述時は入力値を保存する'),
      @('selectedModelId', 'int64', '-', '選択型式ID。自由記述時は null'),
      @('isConfirmed', 'boolean', '-', 'true の場合は当該行を確定済みに更新する')
    )
    PermissionLines = @(
      '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
      '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること'
    )
    ProcessingLines = @(
      '対象行が属するジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する',
      '対象行が属するジョブが `READY_FOR_MATCHING` であることを検証し、それ以外は 409 を返却する',
      '編集対象は未確定行のみとし、未確定行の保存競合は最終保存勝ちとする',
      '`selected_*_name` は画面表示用文字列として保存し、マスタ選択時は対応する `selected_*_id` も保存する。自由記述時は `selected_*_id` を null とする',
      '親は子を兼ねる前提で、下位階層IDが指定された場合は必要な親階層IDを自動補完する',
      '上位階層変更時に整合しない下位階層IDはクリアする',
      '`isConfirmed=true` の場合は保存後に `is_confirmed` と `confirmed_by_user_id` / `confirmed_at` を更新する',
      '対象行がすでに他ユーザーにより確定済みの場合は競合エラーとする'
    )
    ResponseTitle = 'レスポンス（200：AssetMatchingRowResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('item', 'AssetMatchingRowSummary', '✓', '更新後の行データ')
    )
    ResponseSubtables = @(
      @{
        Title = 'item要素（AssetMatchingRowSummary）'
        Headers = @('フィールド', '型', '必須', '説明')
        Rows = @(
          @('assetImportRowId', 'int64', '✓', '資産インポート行ID'),
          @('selectedMatch', 'AssetMatchSelection|null', '✓', '更新後の選択結果'),
          @('isConfirmed', 'boolean', '✓', '確定済みフラグ')
        )
      }
    )
    StatusRows = @(
      @('200', '更新成功', 'AssetMatchingRowResponse'),
      @('400', '入力不正、親子不整合', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `survey_ledger_matching` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象行が存在しない', 'ErrorResponse'),
      @('409', '対象行が確定済み、またはジョブ状態上更新不可', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '突き合わせ一括確定（/asset-matching/rows/confirm-bulk）'
    Overview = '選択した複数行をまとめて確定する。'
    Method = 'POST'
    Path = '/asset-matching/rows/confirm-bulk'
    Auth = '要（Bearer）'
    RequestTitle = 'リクエストボディ'
    RequestHeaders = @('フィールド', '型', '必須', '説明')
    RequestRows = @(
      @('assetImportJobId', 'int64', '✓', '対象ジョブID'),
      @('assetImportRowIds', 'int64[]', '✓', '確定対象の行ID一覧')
    )
    PermissionLines = @(
      '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
      '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること'
    )
    ProcessingLines = @(
      '対象ジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する',
      '対象ジョブが `READY_FOR_MATCHING` であることを検証し、それ以外は 409 を返却する',
      '指定行の `is_confirmed` を true へ更新し、`confirmed_by_user_id` / `confirmed_at` を保存する',
      '対象は未確定行のみとし、他ユーザーが先に確定済みの行が含まれる場合は一括失敗として競合行IDを `details` で返却する',
      '業務必須を満たさない行が含まれる場合も一括失敗とし、どの行が失敗したかを `details` で返却する'
    )
    ResponseTitle = 'レスポンス（200：AssetMatchingBulkConfirmResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('confirmedCount', 'int32', '✓', '確定件数'),
      @('remainingRows', 'int32', '✓', '確定後の未確定件数')
    )
    StatusRows = @(
      @('200', '確定成功', 'AssetMatchingBulkConfirmResponse'),
      @('400', '入力不正、確定不可行を含む', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `survey_ledger_matching` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象ジョブまたは対象行が存在しない', 'ErrorResponse'),
      @('409', '対象行の一部または全部が確定済み、またはジョブ状態上更新不可', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '突き合わせ結果Excel出力（/asset-matching/export）'
    Overview = '現在の絞り込み条件に一致する突き合わせ結果を Excel ファイルで出力する。'
    Method = 'GET'
    Path = '/asset-matching/export'
    Auth = '要（Bearer）'
    ParametersTitle = 'リクエストパラメータ'
    ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
    ParametersRows = @(
      @('assetImportJobId', 'query', 'int64', '✓', '対象ジョブID'),
      @('departmentName', 'query', 'string', '-', '部門名条件'),
      @('sectionName', 'query', 'string', '-', '部署名条件'),
      @('selectedCategoryId', 'query', 'int64', '-', 'Category 条件'),
      @('selectedLargeClassId', 'query', 'int64', '-', '大分類条件'),
      @('selectedMediumClassId', 'query', 'int64', '-', '中分類条件'),
      @('selectedAssetItemId', 'query', 'int64', '-', '品目条件'),
      @('includeConfirmed', 'query', 'boolean', '-', '確定済み行を含めるか')
    )
    PermissionLines = @(
      '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
      '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること'
    )
    ProcessingLines = @(
      '対象ジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する',
      '対象ジョブが `READY_FOR_MATCHING` であることを前提とし、それ以外の状態では 409 を返却する',
      '現在の絞り込み条件に一致する取込結果を Excel として返却する'
    )
    ResponseTitle = 'レスポンス（200：Excel File）'
    ResponseSubtables = @(
      @{
        Title = 'Headers'
        Headers = @('ヘッダー名', '必須', '形式', '説明')
        Rows = @(
          @('Content-Type', '✓', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Excel 形式で返却する'),
          @('Content-Disposition', '✓', 'attachment; filename="資産台帳突き合わせ結果_YYYYMMDD.xlsx"', 'ダウンロードファイル名')
        )
      }
    )
    ResponseLines = @(
      'Body: 絞り込み結果を先頭シート `突き合わせ結果` として返却する。'
    )
    StatusRows = @(
      @('200', '出力成功', 'binary'),
      @('400', '検索条件不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `survey_ledger_matching` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象ジョブが存在しない', 'ErrorResponse'),
      @('409', 'ジョブ状態上、出力不可', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  },
  @{
    Title = '突き合わせ完了（/asset-matching/complete）'
    Overview = '対象ジョブを突き合わせ完了として確定し、メイン画面へ戻るための最終処理を行う。'
    Method = 'POST'
    Path = '/asset-matching/complete'
    Auth = '要（Bearer）'
    RequestTitle = 'リクエストボディ'
    RequestHeaders = @('フィールド', '型', '必須', '説明')
    RequestRows = @(
      @('assetImportJobId', 'int64', '✓', '対象ジョブID')
    )
    PermissionLines = @(
      '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
      '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること'
    )
    ProcessingLines = @(
      '対象ジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する',
      '対象ジョブが `READY_FOR_MATCHING` であり、未確定件数（`remainingRows`）が 0 件であることを検証する',
      '未確定行が 1 件でも残っている場合は `JOB_STATUS_INVALID` を返し、完了させない',
      '条件を満たした場合のみ対象ジョブを `MATCHING_COMPLETED` へ更新する',
      '完了時に `asset_import_jobs.finished_at` を更新し、`remainingRows=0` を返却する'
    )
    ResponseTitle = 'レスポンス（200：AssetMatchingCompleteResponse）'
    ResponseHeaders = @('フィールド', '型', '必須', '説明')
    ResponseRows = @(
      @('assetImportJobId', 'int64', '✓', '対象ジョブID'),
      @('status', 'string', '✓', '更新後状態。`MATCHING_COMPLETED`'),
      @('remainingRows', 'int32', '✓', '完了時点の未確定件数')
    )
    StatusRows = @(
      @('200', '完了成功', 'AssetMatchingCompleteResponse'),
      @('400', '入力不正', 'ErrorResponse'),
      @('401', '未認証', 'ErrorResponse'),
      @('403', '作業対象施設に対する実効 `survey_ledger_matching` なし、または対象施設不一致', 'ErrorResponse'),
      @('404', '対象ジョブが存在しない', 'ErrorResponse'),
      @('409', 'ジョブ状態上完了不可', 'ErrorResponse'),
      @('500', 'サーバー内部エラー', 'ErrorResponse')
    )
  }
)

@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_資産台帳取込.docx'
  ScreenLabel = '資産台帳取込'
  CoverDateText = '2026年4月18日'
  RevisionDateText = '2026/4/18'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、12. 資産台帳取込画面（`/asset-import`）および 13. 資産台帳とマスタの突き合わせ画面（`/asset-matching`）で利用する API の設計を定義する。資産台帳ファイルのアップロード、取込ジョブ管理、失敗ジョブの再取込、AI 推薦付きのマスタ突き合わせ、Excel 出力、突き合わせ完了までを対象とする。' },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面', 'URL', '主機能'); Rows = @(
      @('12. 資産台帳取込画面', '/asset-import', '台帳ファイルのアップロード、未完了ジョブ確認、取込開始'),
      @('13. 資産台帳とマスタの突き合わせ画面', '/asset-matching', '取込行と SHIP 資産マスタの紐づけ、確定、Excel 出力、完了')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = '利用データ' },
    @{ Type = 'Table'; Headers = @('テーブル', '利用内容', '主な項目'); Rows = @(
      @('asset_import_jobs', '取込ジョブの作成、状態管理、件数表示、再取込元ファイル参照、失敗理由保持', 'asset_import_job_id, facility_id, import_type, file_name, file_path, status, error_message'),
      @('asset_import_rows', '取込行の正本、AI推薦、確定値、確定監査情報', 'parsed_*, suggested_*_name/_id, selected_*_name/_id, is_confirmed, confirmed_by_user_id, confirmed_at'),
      @('facilities', '選択施設の解決', 'facility_id, facility_name'),
      @('users', '取込実行/確定ユーザーの記録', 'user_id'),
      @('asset_categories / asset_large_classes / asset_medium_classes / asset_items', 'Category/分類/品目候補', '各マスタID, 名称'),
      @('manufacturers / models', 'メーカー/型式候補', 'manufacturer_id, model_id, name')
    ) },
    @{ Type = 'Heading2'; Text = 'ジョブ状態遷移' },
    @{ Type = 'Bullets'; Items = @(
      '`PROCESSING`: 取込ジョブ作成直後。ファイル解析中',
      '`READY_FOR_MATCHING`: `asset_import_rows` と `suggested_*` の初期投入完了後。突き合わせ待ち',
      '`MATCHING_COMPLETED`: `/asset-matching` 完了後',
      '`FAILED`: 初期取込失敗。`/asset-matching` で失敗表示し、再取込またはアップロード画面復帰を行う'
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON（アップロードAPIと Excel 出力APIを除く）',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-04-18T00:00:00Z`）',
      '論理削除済みの `asset_import_rows` は一覧・集計・出力対象外とする'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '認可判定は `feature_code` を正本とし、対象施設に対する `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。画面表示用の `/auth/context` は UX 用キャッシュであり、各業務 API でも同条件を再判定する。資産台帳取込は `asset_ledger_import`、突き合わせは `survey_ledger_matching` を用いる。' },
    @{ Type = 'Table'; Headers = @('処理', '必要な実効 feature_code', '判定に使う主な情報', '説明'); Rows = @(
      @('取込画面コンテキスト取得 / ジョブ状態取得 / ファイルアップロード / ジョブ再取込 / ジョブ削除', '`asset_ledger_import`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '対象施設への有効割当と実効機能の両方が必要'),
      @('突き合わせ画面コンテキスト取得 / 一覧取得 / 候補取得 / 行更新 / 一括確定 / Excel出力 / 突き合わせ完了', '`survey_ledger_matching`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '対象ジョブまたは Bearer トークン上の作業対象施設に対して再判定する')
    ) },
    @{ Type = 'Heading2'; Text = '作業対象施設ベースの認可' },
    @{ Type = 'Bullets'; Items = @(
      '各 API は Bearer トークン上の作業対象施設に対する実効 `feature_code` を都度再判定する',
      '`/asset-import` 系 API は、対象施設または対象ジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、かつ `facilities.deleted_at IS NULL` の未削除施設であることを前提とする',
      '`/asset-matching` 系 API は、対象ジョブまたは対象行が属する `facility_id` が Bearer トークン上の作業対象施設IDと一致し、かつ `facilities.deleted_at IS NULL` の未削除施設であることを前提とする',
      '資産台帳取込・マスタ突き合わせは自施設業務として扱い、協業グループや他施設公開設定は適用しない'
    ) },
    @{ Type = 'Heading2'; Text = 'ファイル入出力仕様' },
    @{ Type = 'Bullets'; Items = @(
      'アップロード対応拡張子は `.xlsx` / `.xls` / `.csv` とする',
      '最大ファイルサイズは 10MB とする',
      '1行目はヘッダー、データは2行目以降、空白行は自動スキップとする',
      'Excel出力は現在の絞り込み結果を `突き合わせ結果` シートとして返却する'
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Heading3'; Text = '基本エラーレスポンス（ErrorResponse）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや補足情報')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API一覧' },
    @{ Type = 'Heading2'; Text = '資産台帳取込 / 資産台帳とマスタの突き合わせ' },
    @{ Type = 'Table'; Headers = @('機能名', 'Method', 'Path', '概要', '認証'); Rows = $apiListRows },

    @{ Type = 'Heading1'; Text = '第5章 資産台帳取込・突き合わせ機能設計' },
    @{ Type = 'EndpointBlocks'; Items = $endpointSpecs },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '必要権限' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定基準', '説明'); Rows = @(
      @('取込画面コンテキスト取得 / ジョブ状態取得 / ファイルアップロード / ジョブ再取込 / ジョブ削除', '`asset_ledger_import`', 'Bearer トークン上の作業対象施設に対して実効 `asset_ledger_import` を持つこと', '資産台帳取込を実行する'),
      @('突き合わせ画面コンテキスト取得 / 一覧取得 / 候補取得 / 行更新 / 一括確定 / Excel出力 / 突き合わせ完了', '`survey_ledger_matching`', 'Bearer トークン上の作業対象施設に対して実効 `survey_ledger_matching` を持つこと', '資産台帳突き合わせを実行する')
    ) },
    @{ Type = 'Heading2'; Text = '施設単位運用ルール' },
    @{ Type = 'Bullets'; Items = @(
      '未完了ジョブ（`PROCESSING` / `READY_FOR_MATCHING`）は施設ごとに 1 件までとする',
      '同一施設内では `created_by_user_id` に関係なく別ユーザーが続き作業を引き継げる前提とする',
      '対象施設または対象ジョブの `facility_id` は Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設でなければならない',
      '各 API は `/auth/context` の返却値だけを信用せず、対象施設に対する実効 `feature_code` を都度再判定する',
      '資産台帳取込・マスタ突き合わせは自施設業務として扱い、協業グループや他施設公開設定は適用しない'
    ) },
    @{ Type = 'Heading2'; Text = '突き合わせ保存ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`selected_*_name` / `suggested_*_name` は表示値スナップショットとして保持し、マスタ選択時は対応する `selected_*_id` / `suggested_*_id` も保持する',
      '自由記述時は `selected_*_name` に入力値を保存し、対応する `selected_*_id` は null とする',
      '下位階層IDが入る場合は必要な親階層IDも同時に保持する',
      '上位階層変更時は整合しない下位階層IDをクリアする',
      '編集対象は未確定行のみとし、編集保存は最終保存勝ちで `asset_import_rows` へ即時反映する',
      '確定時は `is_confirmed=true` と `confirmed_by_user_id` / `confirmed_at` を保存し、他ユーザーが先に確定済みの行に対する後続の確定操作は競合エラーとする',
      '戻る操作では一時保存確認を行わず、各行の保存内容を保持したまま `/main` へ遷移する。専用一時保存APIは設けない',
      '別途一時保存専用テーブルは設けない前提とする'
    ) },
    @{ Type = 'Heading2'; Text = '完了・削除ルール' },
    @{ Type = 'Bullets'; Items = @(
      '突き合わせ完了時は `asset_import_jobs.status` を `MATCHING_COMPLETED` へ更新し、`finished_at` を記録する',
      '突き合わせ完了は未確定件数が 0 件の場合のみ許可し、1件でも未確定行が残る場合は画面上で完了ボタンを非活性とし、API でも 409 を返す',
      '`MATCHING_COMPLETED` 後のジョブは read-only とし、行更新・一括確定・再完了は受け付けない',
      '再取込に備え、アップロード元ファイルの保持先は `asset_import_jobs.file_path` に記録し、ジョブ削除までサーバー側に保持する',
      '`status=''FAILED''` の場合は `asset_import_jobs.error_message` に利用者向け失敗理由を保存し、API の `failureReason` として返す',
      '再取込時は元の `FAILED` ジョブを保持したまま、新しい `asset_import_jobs` を `PROCESSING` で作成する',
      'ジョブ削除時は `READY_FOR_MATCHING` / `FAILED` のみ許可し、関連する `asset_import_rows` と `asset_import_jobs.file_path` で管理する保存ファイルを一括削除する'
    ) },
    @{ Type = 'Heading2'; Text = 'クライアント連携ルール' },
    @{ Type = 'Bullets'; Items = @(
      '画面表示制御は `/auth/context` の `asset_ledger_import` / `survey_ledger_matching` を参照して行い、取込画面導線・アップロード・削除は `asset_ledger_import`、突き合わせ画面導線・編集・確定・出力・完了は `survey_ledger_matching` で出し分ける',
      '`uploadedFiles` は施設単位のアップロード済みジョブ一覧を表す。複数エントリは複数ジョブの履歴であり、アップロードAPI自体は 1 リクエスト = 1 ファイルで扱う',
      'クライアント内部の fileType は `fixed-asset -> FIXED_ASSET`、`me-ledger -> OTHER_LEDGER` へ変換して API へ送信し、応答受信時は逆変換する',
      '`/asset-matching/rows` は現行画面で表示する列だけを返却する。固定資産番号/管理機器番号/諸室名称/Category/検収日は `asset_import_rows` / `raw_data_json` に保持し、監査・後続利用時に参照する'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '説明'); Rows = @(
      @('VALIDATION_ERROR', '400', '入力不正、必須不足、親子不整合'),
      @('FILE_TYPE_NOT_SUPPORTED', '400', '対応拡張子以外のファイルを指定した'),
      @('FILE_SIZE_EXCEEDED', '400', 'ファイルサイズが 10MB を超えている'),
      @('FACILITY_SELECTION_REQUIRED', '400', '施設未選択で実行した'),
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
      @('AUTH_403_ASSET_LEDGER_IMPORT_DENIED', '403', '作業対象施設に対する実効 `asset_ledger_import` がない、または対象施設不一致'),
      @('AUTH_403_SURVEY_LEDGER_MATCHING_DENIED', '403', '作業対象施設に対する実効 `survey_ledger_matching` がない、または対象施設不一致'),
      @('FACILITY_NOT_FOUND', '404', '対象施設が存在しない、または削除済み'),
      @('ASSET_IMPORT_JOB_NOT_FOUND', '404', '対象ジョブが存在しない'),
      @('ASSET_IMPORT_ROW_NOT_FOUND', '404', '対象行が存在しない'),
      @('UNFINISHED_JOB_ALREADY_EXISTS', '409', '同一施設に未完了ジョブが存在する'),
      @('JOB_STATUS_INVALID', '409', 'ジョブ状態上、要求処理を実行できない'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = '取込運用方針' },
    @{ Type = 'Bullets'; Items = @(
      'アップロード前の形式/サイズ検証はフロントとサーバーの両方で実施する',
      '`/asset-import` 初期表示で前回ジョブが `PROCESSING` / `READY_FOR_MATCHING` / `FAILED` の場合は `/asset-matching` へ遷移し、`job.status` に応じて待機表示・失敗表示・通常表示を切り替える',
      'FAILED 表示から利用者が明示的にアップロード画面へ戻る操作を選んだ場合は、`/asset-import/context?ignoreFailedJobId={assetImportJobId}` を用いて同一 FAILED ジョブに対する自動再開をその画面遷移では抑止する',
      'AI推薦ロジックの改善時は `suggested_score` と推薦元ロジックの整合確認を行う'
    ) },
    @{ Type = 'Heading2'; Text = '突き合わせ運用方針' },
    @{ Type = 'Bullets'; Items = @(
      '確定値は `selected_*_name` を表示値スナップショットとして保持し、マスタ選択時のみ対応する `selected_*_id` を保存する',
      '階層マスタの親子整合が崩れないよう、保存時に自動補完と下位クリアを徹底する',
      '確定時は `confirmed_by_user_id` / `confirmed_at` を保存し、監査可能な状態を維持する',
      'Excel出力列が画面表示列と乖離しないよう、列定義変更時は同時に見直す'
    ) }
  )
}
