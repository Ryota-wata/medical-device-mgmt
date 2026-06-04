$columnDefinitionRows = @(
  @('columnKey', 'string', '✓', 'カラム識別子。`facilityName` などの固定列キーを用いる')
  @('columnLabel', 'string', '✓', '画面表示名')
  @('groupCode', 'string', '✓', '表示グループ。`basic` / `commonMaster` / `location` / `identity` / `classification` / `specification` / `acquisition` / `other`')
  @('isVisible', 'boolean', '✓', '現在ユーザー設定で表示対象かどうか')
  @('isLocked', 'boolean', '✓', '権限により現在ターゲット施設では表示不可かどうか')
)

$assetOwnViewPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `original_list_view` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `original_list_view` が有効であること'
)

$assetCrossFacilityViewPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設および参照対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定・協業グループ・公開元施設設定による判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `original_list_view` が有効であること',
  '認可条件: 通常アカウントの `EXTERNAL_READONLY` では、作業対象施設・参照対象施設が未削除かつ契約中で、協業グループおよび公開元施設の `facility_external_view_settings(sharing_data_type=''asset'')` を満たすこと'
)

$assetManagementDepartmentPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `original_list_view` / `management_department_edit` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `original_list_view` と `management_department_edit` が有効であること'
)

$assetEditPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `original_list_view` / `original_list_edit` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `original_list_view` と `original_list_edit` が有効であること'
)

$assetOwnViewForbiddenDescription = '通常アカウントで作業対象施設に対する実効 `original_list_view` なし、または対象施設不一致'
$assetCrossFacilityForbiddenDescription = '通常アカウントで対象施設に対するデータ閲覧権限なし、または通常アカウントの他施設閲覧条件不成立'
$assetHistoryForbiddenDescription = '通常アカウントで対象施設に対する履歴閲覧権限なし、または通常アカウントの他施設閲覧条件不成立'
$assetManagementDepartmentForbiddenDescription = '通常アカウントで作業対象施設に対する実効 `original_list_view` + `management_department_edit` なし、または作業対象施設以外の資産に対する管理部署編集指定'
$assetEditForbiddenDescription = '通常アカウントで作業対象施設に対する実効 `original_list_view` + `original_list_edit` なし、または作業対象施設以外の資産に対する変更操作指定'
$assetEditPriceForbiddenDescription = '通常アカウントで作業対象施設に対する実効 `original_list_view` + `original_list_edit` なし、価格更新時の `original_price_column` なし、または作業対象施設以外の資産に対する変更操作指定'

$accessibleFacilityRows = @(
  @('facilityId', 'int64', '✓', '対象施設ID')
  @('facilityName', 'string', '✓', '施設名')
  @('accessMode', 'string', '✓', '`OWN` / `EXTERNAL_READONLY`。`EXTERNAL_READONLY` は通常アカウントの協業グループ経由の他施設閲覧、または共有システム管理者が作業対象施設以外を参照する閲覧専用モード')
  @('isCurrentTarget', 'boolean', '✓', '現在選択中施設かどうか')
)

$filterOptionRows = @(
  @('value', 'string', '✓', '候補値。IDを使う項目も文字列化して返却する')
  @('label', 'string', '✓', '画面表示名')
)

$managementDepartmentOptionRows = @(
  @('departmentId', 'string', '✓', '施設側部署ID。`facility_locations.department_id`')
  @('departmentName', 'string', '✓', '部署名。`facility_locations.section_name`')
  @('divisionId', 'string', '-', '施設側部門ID。`facility_locations.division_id`')
  @('divisionName', 'string', '-', '部門名。`facility_locations.department_name`')
  @('displayLabel', 'string', '✓', '候補表示ラベル。`section_name` を基本とし、同一施設内で重複する場合は `department_name / section_name`')
)

$cursorPaginationParameterRows = @(
  @('cursor', 'query', 'string', '-', '既定ソート順の続き位置を表す continuation token'),
  @('pageSize', 'query', 'int32', '-', '取得件数。`1-500`、既定値 `100`')
)

$bookmarkSummaryRows = @(
  @('bookmarkId', 'int64', '✓', 'ブックマークID'),
  @('bookmarkName', 'string', '✓', 'ブックマーク名'),
  @('columnCount', 'int32', '✓', '保存設定数'),
  @('isDefault', 'boolean', '✓', '既定ブックマークかどうか'),
  @('createdAt', 'datetime', '✓', '作成日時'),
  @('updatedAt', 'datetime', '✓', '更新日時')
)

$bookmarkWriteRows = @(
  @('columnKey', 'string', '✓', '固定列キー'),
  @('isVisible', 'boolean', '✓', '表示フラグ')
)

$assetHistoryRows = @(
  @('eventId', 'string', '✓', '履歴イベント識別子。`APPLICATION_STATUS:{application_status_history_id}` / `INSPECTION_RESULT:{inspection_result_id}` / `LENDING_TRANSACTION:{lending_transaction_id}`'),
  @('eventType', 'string', '✓', '`APPLICATION_STATUS` / `INSPECTION_RESULT` / `LENDING_TRANSACTION`'),
  @('occurredAt', 'datetime', '✓', 'イベント発生日時'),
  @('title', 'string', '✓', '一覧表示用タイトル。申請は `申請No.{application_no}`、点検は `点検結果`、貸出は `貸出` / `返却` を基本とする'),
  @('statusLabel', 'string', '-', '状態表示ラベル。申請は遷移先ステータス、点検は総合判定、貸出は取引ステータスを返す'),
  @('actorName', 'string', '-', '処理者/実施者名。履歴ソースに名称スナップショットがない場合は `null`'),
  @('sourceId', 'int64', '✓', '元レコードID'),
  @('sourcePath', 'string', '-', '関連画面ルート。`/quotation-data-box` / `/inspection-result` / `/lending-checkout`。導線を出さない場合は `null`'),
  @('summary', 'string', '-', '補足表示。申請コメント、点検種別と備考、貸出先部署や返却予定日などを source 種別ごとに返す')
)

$photoSummaryRows = @(
  @('photoId', 'int64', '✓', '写真ID。`application_documents.application_document_id` を返す')
  @('fileName', 'string', '✓', '表示用ファイル名')
  @('fileUrl', 'string', '✓', '画像表示用の認可済みURL。S3オブジェクトキーは返却しない')
  @('takenAt', 'datetime', '-', '撮影日時')
  @('isPrimary', 'boolean', '✓', '代表写真かどうか')
  @('sourceOwnerType', 'string', '✓', '`ASSET_LEDGER` / `ASSET_SURVEY_RECORD`')
)

$documentSummaryRows = @(
  @('documentId', 'int64', '✓', 'ドキュメントID。`application_documents.application_document_id` を返す')
  @('documentType', 'string', '✓', 'ドキュメント種別。例: `CONTRACT`, `DELIVERY_NOTE`, `INSPECTION_REPORT`, `OTHER`')
  @('title', 'string', '-', '表示タイトル')
  @('fileName', 'string', '✓', '表示用ファイル名')
  @('documentDate', 'date', '-', '文書日付')
  @('downloadUrl', 'string', '✓', 'ダウンロード/プレビュー用の認可済みURL。S3オブジェクトキーは返却しない')
  @('uploadedAt', 'datetime', '✓', '登録日時')
)

$managementDepartmentBulkUpdateItemRows = @(
  @('assetId', 'int64', '✓', '更新対象の資産台帳ID')
  @('managementDepartmentId', 'string', '✓', '設定する施設側部署ID。対象施設の active `facility_locations.department_id` から選択する')
  @('lastKnownUpdatedAt', 'datetime', '✓', '一覧取得時点の `updatedAt`。競合検知に使用する')
)

$managementDepartmentBulkUpdateResultRows = @(
  @('assetId', 'int64', '✓', '更新した資産台帳ID')
  @('managementDepartmentId', 'string', '✓', '更新後の施設側部署ID')
  @('managementDepartmentName', 'string', '✓', '更新後の管理部署表示名')
  @('updatedAt', 'datetime', '✓', '更新後の資産更新日時')
)

$assetListItemRows = @(
  @('assetId', 'int64', '✓', '資産台帳ID')
  @('facilityId', 'int64', '✓', '設置施設ID')
  @('facilityName', 'string', '✓', '施設名')
  @('qrIdentifier', 'string', '-', 'QR識別子')
  @('assetNo', 'string', '-', '固定資産番号')
  @('managementNo', 'string', '-', '管理機器番号')
  @('managementDepartmentId', 'string', '-', '資産管理部署ID。`asset_ledgers.management_department_id`。legacy 未解決データ、未設定、または一覧編集不可の返却文脈では `null`')
  @('managementDepartmentName', 'string', '-', '資産管理部署。`asset_ledgers.management_department_name` の表示値')
  @('building', 'string', '-', '棟')
  @('floor', 'string', '-', '階')
  @('shipDivisionName', 'string', '-', 'SHIP部門名')
  @('shipDepartmentName', 'string', '-', 'SHIP部署名')
  @('roomCategory1', 'string', '-', '諸室区分①')
  @('roomCategory2', 'string', '-', '諸室区分②')
  @('roomName', 'string', '-', '室名称')
  @('installationLocation', 'string', '-', '設置場所')
  @('categoryId', 'int64', '✓', 'Category ID')
  @('categoryName', 'string', '✓', 'Category 名')
  @('largeClassName', 'string', '✓', '大分類')
  @('mediumClassName', 'string', '✓', '中分類')
  @('assetItemId', 'int64', '-', '品目ID')
  @('assetItemName', 'string', '✓', '品目')
  @('assetName', 'string', '✓', '個体管理名称')
  @('manufacturerName', 'string', '-', 'メーカー名')
  @('modelName', 'string', '-', '型式')
  @('quantity', 'int32', '✓', '数量')
  @('unit', 'string', '-', '単位')
  @('serialNo', 'string', '-', 'シリアル番号')
  @('widthMm', 'string', '-', 'W')
  @('depthMm', 'string', '-', 'D')
  @('heightMm', 'string', '-', 'H')
  @('contractName', 'string', '-', '契約・見積名称')
  @('contractNo', 'string', '-', '契約番号')
  @('quotationNo', 'string', '-', '見積番号')
  @('contractDate', 'date', '-', '契約・発注日')
  @('deliveryDate', 'date', '-', '納品日')
  @('inspectionDate', 'date', '-', '検収日')
  @('isLeased', 'boolean', '✓', 'リース品フラグ')
  @('isRentedOut', 'boolean', '✓', '借用/貸出中フラグ')
  @('leaseStartOn', 'date', '-', 'リース開始日')
  @('leaseEndOn', 'date', '-', 'リース終了日')
  @('acquisitionCost', 'decimal', '-', '取得価格。価格表示権限がない場合は返却しない')
  @('assetInfo', 'string', '-', '資産情報')
  @('legalServiceLife', 'string', '-', '耐用年数（法定）')
  @('recommendedServiceLife', 'string', '-', '使用年数（メーカー推奨）')
  @('endOfServiceOn', 'date', '-', 'End of service')
  @('endOfSupportOn', 'date', '-', 'End of support')
  @('primaryPhotoUrl', 'string', '-', 'カード表示用の代表写真の認可済みURL。S3オブジェクトキーは返却しない')
  @('updatedAt', 'datetime', '✓', '更新日時')
)

$assetDetailRows = @(
  @('assetId', 'int64', '✓', '資産台帳ID')
  @('facilityId', 'int64', '✓', '設置施設ID')
  @('facilityName', 'string', '✓', '施設名')
  @('facilityLocationId', 'int64', '-', '施設ロケーションID')
  @('qrIdentifier', 'string', '-', 'QR識別子')
  @('assetNo', 'string', '-', '固定資産番号')
  @('managementNo', 'string', '-', '管理機器番号')
  @('managementDepartmentId', 'string', '-', '資産管理部署ID。`asset_ledgers.management_department_id`。legacy 未解決データ、未設定、または編集不可の返却文脈では `null`')
  @('managementDepartmentName', 'string', '-', '資産管理部署。`asset_ledgers.management_department_name` の表示値')
  @('equipmentNo', 'string', '-', 'ME番号')
  @('shipAssetMasterId', 'int64', '-', 'SHIP資産マスタID')
  @('categoryId', 'int64', '✓', 'Category ID')
  @('categoryName', 'string', '✓', 'Category 名')
  @('largeClassName', 'string', '✓', '大分類')
  @('mediumClassName', 'string', '✓', '中分類')
  @('assetItemId', 'int64', '-', '品目ID')
  @('assetItemName', 'string', '✓', '品目')
  @('manufacturerId', 'int64', '-', 'メーカーID')
  @('manufacturerName', 'string', '-', 'メーカー名')
  @('modelId', 'int64', '-', '型式ID')
  @('modelName', 'string', '-', '型式名')
  @('assetName', 'string', '✓', '個体管理名称')
  @('detailType', 'string', '-', '明細区分')
  @('building', 'string', '-', '棟')
  @('floor', 'string', '-', '階')
  @('shipDivisionName', 'string', '-', 'SHIP部門名')
  @('shipDepartmentName', 'string', '-', 'SHIP部署名')
  @('roomCategory1', 'string', '-', '諸室区分①')
  @('roomCategory2', 'string', '-', '諸室区分②')
  @('roomName', 'string', '-', '室名称')
  @('installationLocation', 'string', '-', '設置場所')
  @('quantity', 'int32', '✓', '数量')
  @('unit', 'string', '-', '単位')
  @('serialNo', 'string', '-', 'シリアル番号')
  @('widthMm', 'string', '-', 'W')
  @('depthMm', 'string', '-', 'D')
  @('heightMm', 'string', '-', 'H')
  @('assetInfo', 'string', '-', '資産情報')
  @('purchasedOn', 'date', '-', '購入日')
  @('isLeased', 'boolean', '✓', 'リース品フラグ')
  @('isRentedOut', 'boolean', '✓', '借用/貸出中フラグ')
  @('leaseStartOn', 'date', '-', 'リース開始日')
  @('leaseEndOn', 'date', '-', 'リース終了日')
  @('contractName', 'string', '-', '契約・見積名称')
  @('contractNo', 'string', '-', '契約番号')
  @('quotationNo', 'string', '-', '見積番号')
  @('contractDate', 'date', '-', '契約・発注日')
  @('deliveryDate', 'date', '-', '納品日')
  @('inspectionDate', 'date', '-', '検収日')
  @('acquisitionCost', 'decimal', '-', '取得価格。価格表示権限がない場合は返却しない')
  @('legalServiceLife', 'string', '-', '耐用年数（法定）')
  @('recommendedServiceLife', 'string', '-', '使用年数（メーカー推奨）')
  @('endOfServiceOn', 'date', '-', 'End of service')
  @('endOfSupportOn', 'date', '-', 'End of support')
  @('lastInventoryDate', 'date', '-', '最終棚卸日')
  @('updatedAt', 'datetime', '✓', '競合検知用更新日時')
)

@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_資産一覧・資産詳細.docx'
  ScreenLabel = '資産一覧・資産詳細'
  CoverDateText = '2026年5月6日'
  RevisionDateText = '2026/5/6'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、資産一覧画面（`/asset-search-result`）および資産詳細画面（`/asset-detail`）で利用する API の設計内容を整理し、Bearer トークン上で選択した作業対象施設の資産原本を、最新の `権限管理単位一覧` に合わせた権限制御で参照・運用するための基準を定義する。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      '資産一覧の検索・絞り込み・ページング・カード/リスト表示・管理部署インライン編集・エクスポート I/F',
      '表示カラム現在設定と named bookmark の取得・保存・適用 I/F',
      '資産詳細の参照、QRコード直接遷移解決、履歴表示、協業グループ経由の他施設閲覧、および作業対象施設原本に限定した編集・写真・ドキュメント管理 I/F',
      '資産一覧・カルテ閲覧、価格カラム表示、申請起票導線、点検管理登録、保守契約登録、貸出登録導線、原本編集の権限境界'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '資産一覧は `asset_ledgers` を正本として、施設・ロケーション・分類・識別情報・調達情報・ライフサイクル情報を一覧表示し、ユーザー単位の表示カラム設定で固定列の表示/非表示を制御する画面である。作業対象施設かつ編集権限がある場合は、一覧上から管理部署をインライン編集できる。' },
    @{ Type = 'Paragraph'; Text = '資産詳細は、一覧から選択した資産の詳細情報、QR情報、写真、ドキュメントを表示する画面であり、作業対象施設の資産に対してのみ原本編集、写真追加/削除、ドキュメント追加/削除を許可する。協業グループ経由で他施設資産を参照できる場合は閲覧専用とし、編集系操作および申請系導線は許可しない。' },
    @{ Type = 'Paragraph'; Text = '資産一覧から起動する新規購入/更新/増設/移動/廃棄などの申請処理は、本 API 群ではなく各業務機能の API 設計書で扱う。本書では一覧側から必要となる表示可否と選択対象データの返却までを対象とする。' },
    @{ Type = 'Paragraph'; Text = '資産一覧画面の「貸出登録」ボタンおよび貸出機器登録モーダルで利用する API は、本書では定義しない。貸出管理対象機器の登録、登録可否、貸出グループ候補、返却アラート発生日数の保存仕様は「貸出管理 API 設計書」を参照する。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('資産原本', '`asset_ledgers` に保持する現物資産台帳。資産一覧と資産詳細の主対象'),
      @('表示カラム設定', '`user_column_settings` に保持するユーザー単位の表示/非表示設定。画面IDは `asset_search` を用いる'),
      @('named bookmark', '`user_column_setting_presets` / `user_column_setting_preset_items` に保持する表示/非表示プリセット。現在設定とは別管理とする'),
      @('作業対象施設閲覧', 'Bearer トークン上の作業対象施設を対象に `original_list_view` を使って資産を参照するモード'),
      @('他施設閲覧', '通常アカウントが作業対象施設とは異なる施設の資産を、`original_list_view`、協業グループ、公開元施設の `facility_external_view_settings(sharing_data_type=''asset'')` に基づいて閲覧専用で参照するモード。通常アカウントの施設切替候補には含めない。共有システム管理者は未削除施設であれば通常判定をバイパスする'),
      @('原本編集', '資産詳細から `asset_ledgers` 正本と、資産に紐づく写真・ドキュメントを更新する処理。`original_list_edit` を前提とする'),
      @('価格カラム', '取得価格などの価格系項目。閲覧者側の `original_price_column` で制御し、`EXTERNAL_READONLY` では公開元施設の `facility_external_column_settings(column_code=''original_price_column'')` も判定する')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面URL', '利用目的'); Rows = @(
      @('15. 資産一覧画面', '/asset-search-result', '資産一覧表示、検索、管理部署インライン編集、表示カラム切替、エクスポート、申請起票導線表示'),
      @('16. 資産詳細画面', '/asset-detail', '資産詳細、QR情報、写真、ドキュメントの参照と、自施設原本の編集')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'API の位置づけ' },
    @{ Type = 'Paragraph'; Text = '本 API 群は、資産一覧画面のコンテキスト取得、表示カラム現在設定保存、named bookmark 一覧/保存/削除/適用、資産一覧取得、一覧管理部署編集候補の取得と一括保存、一覧結果エクスポート、QRコード直接遷移解決、資産詳細取得、資産履歴取得、資産原本更新、写真追加/削除、ドキュメント一覧取得・追加・削除を提供する。' },
    @{ Type = 'Paragraph'; Text = '本 API は最新の `権限管理単位一覧` における資産一覧・カルテ系の権限管理単位を対象とする。`targetFacilityId` は通常は作業対象施設を指す。通常アカウントの他施設閲覧は施設切替候補には展開せず、QR直接遷移や参照系APIで `targetFacilityId` / `facilityId` が作業対象施設と異なる場合に、協業グループと公開元施設の `facility_external_view_settings(sharing_data_type=''asset'')` を再判定して `EXTERNAL_READONLY` として扱う。共有システム管理者アカウントは未削除施設を対象とする限り、施設切替候補および参照系で通常アカウント向けの権限・協業・公開設定判定をバイパスする。編集系は、参照対象施設を作業対象施設として選択している場合に限り通常アカウント向けの権限判定をバイパスする。' },
    @{ Type = 'Paragraph'; Text = '資産詳細の履歴表示は、申請履歴、点検結果、貸出/返却履歴を共通イベント形式へ正規化して返却し、詳細本体 API とは分離したタブ読込用 I/F として扱う。' },
    @{ Type = 'Heading2'; Text = '画面と API の関係' },
    @{ Type = 'Numbered'; Items = @(
      '画面初期表示時に `GET /asset-search-result/context` を呼び出し、現在参照施設、フィルタ候補、列定義、現在の表示/非表示設定、操作可否を取得する',
      '表示カラム変更の保存時に `PUT /asset-search-result/column-settings` を呼び出す',
      'named bookmark モーダル表示時に `GET /asset-search-result/column-bookmarks` を呼び出し、保存時は `POST`、削除時は `DELETE`、適用時は `POST /asset-search-result/column-bookmarks/{bookmarkId}/apply` を呼び出す',
      '検索条件変更または表示切替時に `GET /asset-search-result/assets` を呼び出し、一覧データを再取得する',
      '自施設閲覧で管理部署編集モードへ入る場合は `GET /asset-search-result/context` に含まれる管理部署編集候補を利用し、保存時に `PUT /asset-search-result/assets/management-departments` を呼び出す',
      'Excel/PDF 出力時に `GET /asset-search-result/assets/export` を呼び出す',
      'QRコード遷移URLで詳細画面を開く場合は `GET /asset-detail/assets/by-qr` で `assetId` を解決してから詳細取得 API を呼び出す',
      '一覧から資産を開く時に `GET /asset-detail/assets/{assetId}` を呼び出す',
      '履歴タブ表示時に `GET /asset-detail/assets/{assetId}/history` を呼び出す',
      '作業対象施設資産の保存時に `PUT /asset-detail/assets/{assetId}` を呼び出す',
      '写真追加/削除時に `POST /asset-detail/assets/{assetId}/photos` または `DELETE /asset-detail/assets/{assetId}/photos/{photoId}` を呼び出す',
      'ドキュメント領域の表示時に `GET /asset-detail/assets/{assetId}/documents` を呼び出し、追加/削除時は `POST` / `DELETE` を呼び出す',
      '一覧起点の各種申請 API、貸出機器登録 API は別設計書で扱い、本 API では `canOpenOriginalApplications` / `canRegisterInspectionManagement` / `canRegisterMaintenanceContract` / `canRegisterLendingManagement` などの表示制御用フラグのみ返却する'
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル', '利用種別', '用途'); Rows = @(
      @('asset_ledgers', 'READ / UPDATE', '資産一覧・詳細の正本、原本編集、競合検知'),
      @('facilities', 'READ', '施設名表示、対象施設解決、論理削除判定、共有システム管理者アカウントの未削除施設判定'),
      @('facility_locations', 'READ', 'ロケーション表示、一覧管理部署編集候補取得、更新時の整合性確認'),
      @('ship_asset_masters', 'READ', 'SHIP資産マスタ参照、分類正規値の解決'),
      @('user_column_settings', 'READ / CREATE / UPDATE / DELETE', '現在の表示カラム設定の取得と保存'),
      @('user_column_setting_presets / user_column_setting_preset_items', 'READ / CREATE / UPDATE / DELETE', 'named bookmark の一覧、保存、削除、適用'),
      @('users', 'READ', '共有システム管理者アカウント判定、写真・ドキュメント更新者の監査'),
      @('user_facility_assignments / facility_feature_settings / user_facility_feature_settings', 'READ', '通常アカウント向けの画面・業務APIの feature_code 判定'),
      @('facility_column_settings / user_facility_column_settings', 'READ', '通常アカウント向けの自施設閲覧時の column_code 判定'),
      @('facility_collaboration_groups / facility_collaboration_group_facilities', 'READ', '協業グループ経由の他施設資産閲覧可否判定'),
      @('facility_external_view_settings / facility_external_column_settings', 'READ', '公開元施設が他施設へ公開するデータ種別・カラムの判定'),
      @('qr_codes', 'READ', '資産詳細画面の QR 情報表示'),
      @('applications / application_assets / application_status_histories', 'READ', '資産関連申請と状態履歴の表示'),
      @('inspection_tasks / inspection_results', 'READ', '資産関連点検結果の履歴表示'),
      @('lending_devices / lending_transactions', 'READ', '資産関連の貸出/返却履歴表示'),
      @('asset_photos', 'READ', '資産写真一覧表示。`application_documents.file_path` に保持したAmazon S3オブジェクトキーから認可済み表示URLを発行する'),
      @('asset_documents', 'READ', '資産ドキュメント一覧表示。`application_documents.file_path` に保持したAmazon S3オブジェクトキーから認可済みダウンロードURLを発行する'),
      @('application_documents', 'CREATE / UPDATE / DELETE', '資産写真・資産ドキュメントの正本更新。ファイル実体はAmazon S3に保存し、`file_path` にはS3オブジェクトキーのみを保持する')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API 共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON（エクスポート応答、および写真/ドキュメント追加の multipart/form-data を除く）',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-04-20T00:00:00Z`）',
      '一覧系 API は `cursor` / `pageSize` による cursor pagination を採用し、既定 `pageSize=100`、上限 `500` とする',
      '対象施設は Bearer トークン上の作業対象施設を基本とする。共有システム管理者アカウントは、作業対象施設および参照対象施設が未削除である限り、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定・協業グループ・公開元施設設定をバイパスする。通常アカウントで `targetFacilityId` または `facilityId` が作業対象施設と異なる場合は、他施設閲覧条件を満たす場合のみ `EXTERNAL_READONLY` として許可する',
      '一覧/詳細レスポンスは、許可されていないデータ項目やカラムを含めない'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '画面導線・ボタン表示の `feature_code` と、表示カラムの `column_code` を処理単位で判定する。通常アカウントでは、作業対象施設の資産データ参照は `original_list_view` を正本とし、他施設資産参照は、作業対象施設側で `original_list_view` が有効であることに加え、協業グループ、施設契約状態、公開元施設の `facility_external_view_settings(sharing_data_type=''asset'')` を満たす場合のみ閲覧専用で許可する。共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）では、作業対象施設および参照対象施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定、協業グループ、公開元施設設定による通常判定を行わず、参照系の `feature_code` / `column_code` を有効として扱う。参照対象施設が作業対象施設と同一の場合は変更操作系の `feature_code` も有効として扱い、参照対象施設が作業対象施設と異なる場合は閲覧系、履歴、価格表示だけを有効とし、申請起票、点検管理登録、保守契約登録、貸出登録、管理部署編集、原本編集、写真追加/削除、ドキュメント追加/削除は許可しない。' },
    @{ Type = 'Table'; Headers = @('処理', '必要コード', '説明'); Rows = @(
      @('一覧画面表示 / 詳細画面表示 / 一覧取得 / 詳細取得 / 履歴取得 / QR解決 / ドキュメント一覧取得', '`original_list_view`', '通常アカウントは作業対象施設の実効 `original_list_view` を判定し、他施設閲覧は協業グループ・公開元施設の `facility_external_view_settings(sharing_data_type=''asset'')` も判定する。共有システム管理者は対象施設が未削除であること'),
      @('新規・更新・増設・移動・廃棄申請ボタン表示', '`original_application`', '通常アカウントは一覧起点の申請系導線を表示する。共有システム管理者は参照対象施設が作業対象施設と同一かつ未削除の場合に表示可'),
      @('点検管理登録ボタン表示', '`inspection_management`', '通常アカウントは一覧起点の点検管理登録導線を表示する。共有システム管理者は参照対象施設が作業対象施設と同一かつ未削除の場合に表示可'),
      @('保守契約登録ボタン表示', '`maintenance_contract`', '通常アカウントは一覧起点の保守契約登録導線を表示する。共有システム管理者は参照対象施設が作業対象施設と同一かつ未削除の場合に表示可'),
      @('貸出登録ボタン表示', '`lending_management`', '通常アカウントは一覧起点の貸出機器登録導線を表示する。共有システム管理者は参照対象施設が作業対象施設と同一かつ未削除の場合に表示可。貸出機器登録モーダルの API は「貸出管理 API 設計書」を参照する'),
      @('一覧管理部署編集', '`original_list_view` + `management_department_edit`', '通常アカウントは両 feature の実効有効を判定する。共有システム管理者は参照対象施設が作業対象施設と同一かつ未削除の場合に許可する。作業対象施設原本の管理部署列だけを一覧上で更新する'),
      @('資産詳細の原本編集 / 写真操作 / ドキュメント追加削除', '`original_list_view` + `original_list_edit`', '通常アカウントは両 feature の実効有効を判定する。共有システム管理者は参照対象施設が作業対象施設と同一かつ未削除の場合に許可する。作業対象施設原本に限定した詳細編集系処理'),
      @('価格項目の返却 / 更新', '`original_price_column`', '通常アカウントは閲覧者側の権限に従い、他施設閲覧では公開元施設の公開カラム設定も判定する。共有システム管理者は参照対象施設が未削除である限り返却可。更新は、通常アカウントでは `OWN` かつ `original_price_column` 有効時、共有システム管理者では参照対象施設が作業対象施設と同一かつ未削除の場合のみ許可する')
    ) },
    @{ Type = 'Heading2'; Text = '施設閲覧ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`targetFacilityId` 未指定時は Bearer トークン上の作業対象施設を参照対象とする',
      '`targetFacilityId` または `facilityId` が作業対象施設と同一の場合、通常アカウントは `OWN` として扱い、作業対象施設に対する `original_list_view` を判定する。共有システム管理者は作業対象施設が未削除であることだけを確認する',
      '`targetFacilityId` または `facilityId` が作業対象施設と異なる場合、通常アカウントは `EXTERNAL_READONLY` 候補として扱い、作業対象施設に対する `original_list_view` が実効有効、作業対象施設・対象施設の双方が `deleted_at IS NULL` かつ `system_contract_status=''ACTIVE''`、双方が active な同一 `facility_collaboration_groups` に所属、公開元施設の `facility_external_view_settings(provider_facility_id=対象施設, sharing_data_type=''asset'', is_enabled=true)` が存在することを確認する。共有システム管理者は作業対象施設・参照対象施設が未削除であることだけを確認し、協業グループと公開元施設設定を判定しない',
      '通常アカウントの他施設閲覧は施設切替候補へ直接展開しない。`accessibleFacilities` には作業対象施設を `OWN` として返し、QR直接遷移や明示的な `targetFacilityId` 指定時だけ `EXTERNAL_READONLY` を解決する。共有システム管理者では未削除の全施設を施設切替候補として返却できる',
      '通常アカウントの他施設閲覧時は資産閲覧のみ許可し、申請起票、点検管理登録、保守契約登録、管理部署編集、原本編集、写真追加/削除、ドキュメント追加/削除は不可とする。共有システム管理者は対象施設が未削除であれば参照できる。別施設に対する変更操作は、その施設を作業対象施設として選択してから編集系APIを呼び出す',
      '価格項目は、通常アカウントの `OWN` では `original_price_column` が有効な場合、通常アカウントの `EXTERNAL_READONLY` では作業対象施設に対する `original_price_column` と公開元施設の `facility_external_column_settings(provider_facility_id=対象施設, column_code=''original_price_column'', is_enabled=true)` が有効な場合だけ返却する。共有システム管理者は参照対象施設が未削除である限り返却する',
      '一覧管理部署編集は、通常アカウントでは `OWN` かつ `management_department_edit` が有効な場合だけ許可する。共有システム管理者では参照対象施設が作業対象施設と同一かつ未削除の場合だけ許可する',
      '原本編集、写真、ドキュメント更新は、通常アカウントでは `OWN` かつ `original_list_edit` が有効な場合だけ許可する。共有システム管理者では参照対象施設が作業対象施設と同一かつ未削除の場合だけ許可する',
      '申請起票、点検管理登録、保守契約登録の表示可否は、通常アカウントでは `OWN` の場合のみ、それぞれ `original_application`、`inspection_management`、`maintenance_contract` を個別に判定する。共有システム管理者では参照対象施設が作業対象施設と同一かつ未削除の場合だけ表示可とする',
      '作業対象施設または参照対象施設が存在しない、または `facilities.deleted_at IS NOT NULL` の場合は 404 とする。施設が存在しても通常アカウントの他施設閲覧条件を満たさない場合は 403 とする'
    ) },
    @{ Type = 'Heading2'; Text = '表示カラム設定ルール' },
    @{ Type = 'Bullets'; Items = @(
      '現在の表示カラム設定は `user_column_settings` に `screen_id=asset_search` で保持する',
      'named bookmark は `user_column_setting_presets` / `user_column_setting_preset_items` に `screen_id=asset_search` で保持し、現在設定とは別に管理する',
      '表示対象にできる `column_key` は画面契約として定義した固定列キーに限定する',
      '既定 bookmark は active 行（`deleted_at IS NULL`）に対して `user_id + screen_id` 単位で 0..1 件とし、現在設定が未保存の場合のみ初期表示へ適用する',
      'current settings が存在する場合はそれを最優先とし、bookmark の保存・削除・既定切替では current settings を自動変更しない',
      '未保存ユーザーの初期表示/非表示は API 側既定値を採用する',
      '権限要件を満たさず返却不可な列は `isLocked=true` として返し、一覧データ本体にも値を含めない',
      'bookmark 適用時は preset の表示/非表示設定で `user_column_settings` を置換更新し、次回表示時はその current settings を返却する',
      '列順と列幅は画面上の一時的な表示調整に留め、`user_column_settings` や bookmark へ保存しない'
    ) },
    @{ Type = 'Heading2'; Text = '検索・絞り込みルール' },
    @{ Type = 'Bullets'; Items = @(
      '管理部署、設置部署、Category、大分類、中分類、品目、キーワードは AND 条件で絞り込む',
      '管理部署の検索候補・検索条件・一覧/詳細表示は `asset_ledgers.management_department_name` を用いる',
      '一覧の管理部署編集候補は対象施設の active `facility_locations` から `department_id IS NOT NULL` の行を `department_id` 単位で重複排除した部署集合を用い、表示は `displayLabel` を使う。保存時は `asset_ledgers.management_department_id` と `asset_ledgers.management_department_name` を同時更新する',
      'キーワード検索は `qr_identifier`、`asset_no`、`management_no`、`equipment_no`、`asset_name`、`manufacturer_name`、`model_name`、`serial_no`、`room_name`、`installation_location` を対象に部分一致で行う',
      '一覧の既定並び順は `asset_ledger_id ASC` とし、`cursor` は最終返却行の `asset_ledger_id` を符号化して返却する',
      'エクスポートは一覧取得 API と同じ権限・絞り込み・公開カラムルールを適用し、`cursor` には依存せず検索条件一致全件を出力する'
    ) },
    @{ Type = 'Heading2'; Text = 'QR 直接遷移ルール' },
    @{ Type = 'Bullets'; Items = @(
      'QRラベルの遷移用URLは `facilityId` と `qr_identifier` をクエリとして保持し、画面起動時にその値を `GET /asset-detail/assets/by-qr` の `facilityId` / `qrIdentifier` へ引き渡して資産詳細の対象を解決する',
      'QR識別子の一意性は施設単位のため、直接遷移解決では `facilityId` の指定を必須とする',
      '`facilityId` が作業対象施設と異なる場合、通常アカウントでは協業グループと公開元施設設定による他施設閲覧条件を満たす場合のみ `EXTERNAL_READONLY` として資産詳細対象を解決する。共有システム管理者では作業対象施設およびQRの施設が未削除であれば通常アカウント向けの協業グループ・公開元施設設定を判定せず、作業対象施設と異なるQRの施設は `EXTERNAL_READONLY` として解決する',
      'QRコードNo. の変更・再発行は QR発行・ラベル印刷 API の責務とし、資産詳細更新 API では扱わない'
    ) },
    @{ Type = 'Heading2'; Text = '競合制御と更新方針' },
    @{ Type = 'Bullets'; Items = @(
      '`PUT /asset-search-result/assets/management-departments` と `PUT /asset-detail/assets/{assetId}` は `asset_ledgers.updated_at` を競合検知トークンとして受け取り、差異があれば 409 (`ASSET_CONFLICT`) を返却する',
      '一覧の管理部署一括更新は対象全件を 1 トランザクションで更新し、1件でも競合または候補不整合があれば全件ロールバックする',
      '管理部署更新時は active `facility_locations` から部署候補を解決し、`management_department_id` と `management_department_name` を同時更新する',
      '`management_department_id` 追加時の既存資産移行は、`facility_id` と `management_department_name=section_name` の完全一致で active `facility_locations` を参照し、一意に解決できる行だけ backfill する',
      '資産詳細更新は `identity` / `location` / `classification` / `specification` / `lifecycle` の責務別ペイロードで受け付ける',
      '分類更新は `classificationMode=LINKED` / `MANUAL` を明示し、`LINKED` 時は `ship_asset_master_id` を基準に分類正規値を再解決する',
      '施設名および QR識別子は別機能の正本責務とし、本 API の更新対象に含めない',
      '写真・ドキュメントの更新は `application_documents` を正本とし、`asset_photos` / `asset_documents` VIEW への DML は行わない。ファイル実体はAPI内でAmazon S3へPutObjectし、`application_documents.file_path` にはS3オブジェクトキーのみを保存する',
      '写真追加時に `isPrimary=true` を指定した場合は、同一資産の既存 `ASSET_LEDGER` 写真の代表フラグを解除してから新写真を代表へ切り替える',
      '写真・ドキュメント削除は物理削除ではなく `application_documents.deleted_at` を更新する論理削除とする。S3実体の削除は、同一S3オブジェクトキーを参照する有効メタデータがなくなったことと保存期間を確認するストレージ削除処理で扱う'
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Heading3'; Text = '基本エラーレスポンス（ErrorResponse）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けメッセージ'),
      @('details', 'string[]', '-', '入力エラーや補足情報')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API 一覧' },
    @{ Type = 'Table'; Headers = @('No', 'API 名', 'Method', 'Path', '用途', '権限'); Rows = @(
      @('1', '一覧画面コンテキスト取得', 'GET', '/asset-search-result/context', '対象施設、フィルタ候補、列定義、現在の表示/非表示設定、操作可否を取得する', '`original_list_view`'),
      @('2', '表示カラム設定保存', 'PUT', '/asset-search-result/column-settings', '現在の表示/非表示設定を保存する', '`original_list_view`'),
      @('3', 'named bookmark 一覧取得', 'GET', '/asset-search-result/column-bookmarks', '保存済み named bookmark 一覧を取得する', '`original_list_view`'),
      @('4', 'named bookmark 保存', 'POST', '/asset-search-result/column-bookmarks', '現在の表示/非表示設定を named bookmark として保存する', '`original_list_view`'),
      @('5', 'named bookmark 削除', 'DELETE', '/asset-search-result/column-bookmarks/{bookmarkId}', '保存済み named bookmark を削除する', '`original_list_view`'),
      @('6', 'named bookmark 適用', 'POST', '/asset-search-result/column-bookmarks/{bookmarkId}/apply', '保存済み named bookmark を current settings へ適用する', '`original_list_view`'),
      @('7', '資産一覧取得', 'GET', '/asset-search-result/assets', '資産一覧を検索・絞り込み・ページング取得する', '`original_list_view`'),
      @('8', '一覧管理部署一括更新', 'PUT', '/asset-search-result/assets/management-departments', '一覧上で編集した管理部署を一括保存する', '`original_list_view` + `management_department_edit`'),
      @('9', '一覧結果エクスポート', 'GET', '/asset-search-result/assets/export', '検索結果を Excel または PDF で出力する', '`original_list_view`'),
      @('10', 'QRコード直接遷移解決', 'GET', '/asset-detail/assets/by-qr', '施設IDとQR識別子から資産詳細対象を解決する', '`original_list_view`'),
      @('11', '資産詳細取得', 'GET', '/asset-detail/assets/{assetId}', '資産詳細、写真、QR 情報を取得する', '`original_list_view`'),
      @('12', '資産履歴取得', 'GET', '/asset-detail/assets/{assetId}/history', '関連申請、点検結果、貸出/返却履歴を共通形式で取得する', '`original_list_view`'),
      @('13', '資産原本更新', 'PUT', '/asset-detail/assets/{assetId}', '作業対象施設資産の原本情報を更新する', '`original_list_view` + `original_list_edit`'),
      @('14', '資産写真追加', 'POST', '/asset-detail/assets/{assetId}/photos', '資産写真を追加する', '`original_list_view` + `original_list_edit`'),
      @('15', '資産写真削除', 'DELETE', '/asset-detail/assets/{assetId}/photos/{photoId}', '資産写真を削除する', '`original_list_view` + `original_list_edit`'),
      @('16', '資産ドキュメント一覧取得', 'GET', '/asset-detail/assets/{assetId}/documents', '登録済みドキュメント一覧を取得する', '`original_list_view`'),
      @('17', '資産ドキュメント追加', 'POST', '/asset-detail/assets/{assetId}/documents', '資産ドキュメントを追加する', '`original_list_view` + `original_list_edit`'),
      @('18', '資産ドキュメント削除', 'DELETE', '/asset-detail/assets/{assetId}/documents/{documentId}', '資産ドキュメントを削除する', '`original_list_view` + `original_list_edit`')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 資産一覧・資産詳細機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '一覧画面コンテキスト取得（/asset-search-result/context）'
        Overview = '資産一覧画面の初期表示に必要な対象施設、フィルタ候補、列定義、現在の表示/非表示設定、操作可否を取得する。'
        Method = 'GET'
        Path = '/asset-search-result/context'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('targetFacilityId', 'query', 'int64', '-', '参照対象施設ID。未指定時は作業対象施設。作業対象施設と異なる場合は他施設閲覧条件を満たす場合のみ許可する')
        )
        PermissionLines = $assetCrossFacilityViewPermissionLines
        ProcessingLines = @(
          'Bearer トークンから作業対象施設を解決し、`targetFacilityId` 未指定時はそれを参照対象にする',
          '`targetFacilityId` が作業対象施設と異なる場合、通常アカウントでは他施設閲覧条件を判定し、成立する場合は `targetFacility.accessMode=EXTERNAL_READONLY`、成立しない場合は 403 (`ASSET_VIEW_FORBIDDEN`) を返却する。共有システム管理者では作業対象施設および参照対象施設が未削除であることだけを確認し、協業グループ・公開元施設設定を判定せず、`targetFacility.accessMode=EXTERNAL_READONLY` として返却する',
          '施設切替候補としての `accessibleFacilities` は、通常アカウントでは作業対象施設のみを返却する。共有システム管理者では未削除の全施設を候補として返却できる。他施設閲覧候補は通常アカウントの施設切替候補へ直接展開せず、`targetFacilityId` 指定時に `targetFacility` として返却する',
          '参照対象施設の `asset_ledgers` を基準に、管理部署、設置部署、Category、大分類、中分類、品目の候補を取得する',
          '`accessMode=OWN` かつ `management_department_edit` が有効な場合は、対象施設の active `facility_locations` から `department_id IS NOT NULL` の行を `department_id` 単位で重複排除した管理部署編集候補を解決し、`displayLabel` を付与して `displayLabel ASC, department_id ASC` で返す。権限がない場合または `EXTERNAL_READONLY` の場合は空配列を返す',
          '既存資産で `management_department_id` が未解決の行は `managementDepartmentId=null` のまま返し、編集モードでは未選択状態として再選択させる',
          '表示カラム定義は画面契約で定義した固定列一覧を返却する',
          '`user_column_settings(screen_id=asset_search)` を読み込み、現在の表示/非表示設定へマージする。設定がない列は API 既定値を採用する',
          '`user_column_setting_presets(screen_id=asset_search)` を読み込み、named bookmark 一覧と既定 bookmark を解決する',
          '現在設定が未保存で既定 bookmark が存在する場合は、その表示/非表示設定を current settings として返却する',
          '価格カラムのロック状態は、通常アカウントでは閲覧者側の `original_price_column` と、`EXTERNAL_READONLY` では公開元施設の `facility_external_column_settings(column_code=''original_price_column'')` の実効有無を元に算出する。共有システム管理者では参照対象施設が未削除であればロックしない',
          '`accessMode=OWN` の場合は `original_application`、`inspection_management`、`maintenance_contract`、`lending_management`、`management_department_edit`、`original_list_edit`、`original_price_column`、`original_list_view` の実効有無から、申請起票導線、点検管理登録、保守契約登録、貸出登録、一覧管理部署編集、詳細編集モード遷移、価格表示、履歴タブ表示の可否フラグを返却する。共有システム管理者では参照対象施設が作業対象施設と同一かつ未削除である場合に全フラグを有効として扱う。共有システム管理者が `targetFacilityId` で作業対象施設以外を参照する場合は閲覧系と価格表示のみ有効とし、変更操作は対象施設を作業対象施設として選択してから実行する。通常アカウントの `EXTERNAL_READONLY` の場合は `original_list_view` と `original_price_column` の実効有無、および公開元施設設定を判定し、閲覧系以外の操作可否を `false` とする'
        )
        ResponseTitle = 'レスポンス（200：AssetSearchContextResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('actingFacility', 'FacilityContext', '✓', '作業対象施設'),
          @('targetFacility', 'FacilityContext', '✓', '現在参照中の施設'),
          @('accessibleFacilities', 'AccessibleFacility[]', '✓', '施設切替候補として参照可能な施設一覧。通常アカウントでは作業対象施設を `OWN` として返却し、共有システム管理者では未削除の全施設を返却できる'),
          @('filterOptions', 'AssetSearchFilterOptions', '✓', '検索候補'),
        @('managementDepartmentEditOptions', 'ManagementDepartmentOption[]', '✓', '一覧の管理部署編集候補。`management_department_edit` が有効な場合のみ返却する'),
          @('columnDefinitions', 'AssetSearchColumnDefinition[]', '✓', '列定義と現在設定'),
          @('bookmarks', 'ColumnBookmarkSummary[]', '✓', '保存済み named bookmark 一覧'),
          @('permissions', 'AssetSearchPermissionContext', '✓', '操作可否'),
          @('totalCount', 'int32', '✓', '現在参照施設の対象資産件数')
        )
        ResponseSubtables = @(
          @{
            Title = 'actingFacility / targetFacility 要素（FacilityContext）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '施設ID'),
              @('facilityName', 'string', '✓', '施設名'),
          @('accessMode', 'string', '✓', '`OWN` / `EXTERNAL_READONLY`。共有システム管理者が作業対象施設以外を参照する場合も `EXTERNAL_READONLY`')
            )
          },
          @{
            Title = 'accessibleFacilities要素（AccessibleFacility）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $accessibleFacilityRows
          },
          @{
            Title = 'filterOptions要素（AssetSearchFilterOptions）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('managementDepartments', 'FilterOption[]', '✓', '管理部署候補。検索用であり `asset_ledgers.management_department_name` を返す'),
              @('installedDepartments', 'FilterOption[]', '✓', '設置部署候補'),
              @('categories', 'FilterOption[]', '✓', 'Category 候補'),
              @('largeClasses', 'FilterOption[]', '✓', '大分類候補'),
              @('mediumClasses', 'FilterOption[]', '✓', '中分類候補'),
              @('assetItems', 'FilterOption[]', '✓', '品目候補')
            )
          },
          @{
            Title = 'FilterOption要素'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $filterOptionRows
          },
          @{
            Title = 'managementDepartmentEditOptions要素（ManagementDepartmentOption）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $managementDepartmentOptionRows
          },
          @{
            Title = 'columnDefinitions要素（AssetSearchColumnDefinition）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $columnDefinitionRows
          },
          @{
            Title = 'bookmarks要素（ColumnBookmarkSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $bookmarkSummaryRows
          },
          @{
            Title = 'permissions要素（AssetSearchPermissionContext）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('canOpenOriginalApplications', 'boolean', '✓', '新規・更新・増設・移動・廃棄申請ボタンを表示できるかどうか'),
              @('canRegisterInspectionManagement', 'boolean', '✓', '点検管理登録ボタンを表示できるかどうか'),
              @('canRegisterMaintenanceContract', 'boolean', '✓', '保守契約登録ボタンを表示できるかどうか'),
              @('canRegisterLendingManagement', 'boolean', '✓', '貸出登録ボタンを表示できるかどうか。登録可否、貸出グループ候補、保存仕様は「貸出管理 API 設計書」を参照する'),
              @('canEditManagementDepartmentList', 'boolean', '✓', '一覧の管理部署編集ボタンを表示し、一括保存できるかどうか'),
              @('canEditAsset', 'boolean', '✓', '資産詳細で編集モードへ遷移できるかどうか'),
              @('canViewPrice', 'boolean', '✓', '価格系項目が返却対象かどうか'),
              @('canViewHistory', 'boolean', '✓', '資産履歴タブを表示できるかどうか。現行仕様では `original_list_view` と同値')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'AssetSearchContextResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', $assetCrossFacilityForbiddenDescription, 'ErrorResponse'),
          @('404', '作業対象施設または指定された参照対象施設が存在しない、または削除済み', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '表示カラム設定保存（/asset-search-result/column-settings）'
        Overview = '現在の表示カラム設定をユーザー単位で保存する。保存対象は current settings のみとし、named bookmark は別 API で扱う。'
        Method = 'PUT'
        Path = '/asset-search-result/column-settings'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('columns', 'AssetSearchColumnSettingWriteModel[]', '✓', '保存対象の表示/非表示設定一覧')
        )
        RequestSubtables = @(
          @{
            Title = 'columns要素（AssetSearchColumnSettingWriteModel）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $bookmarkWriteRows
          }
        )
        PermissionLines = $assetOwnViewPermissionLines
        ProcessingLines = @(
          '保存単位は `screen_id=asset_search` とする',
          '未知の固定列キーは 400 とする',
          '受信した配列を画面の完全な表示/非表示状態として扱い、対象ユーザー・画面の既存 `user_column_settings` を置換更新する',
          '表示/非表示設定そのものは保存できても、実際の一覧返却時には権限要件により `isLocked=true` となりデータが返らない列があり得る'
        )
        ResponseTitle = 'レスポンス（200：AssetSearchColumnSettingsResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('savedAt', 'datetime', '✓', '保存日時')
        )
        StatusRows = @(
          @('200', '保存成功', 'AssetSearchColumnSettingsResponse'),
          @('400', '不正なカラム設定', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', $assetOwnViewForbiddenDescription, 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'named bookmark 一覧取得（/asset-search-result/column-bookmarks）'
        Overview = '保存済み named bookmark 一覧を取得する。'
        Method = 'GET'
        Path = '/asset-search-result/column-bookmarks'
        Auth = '要（Bearer）'
        PermissionLines = $assetOwnViewPermissionLines
        ProcessingLines = @(
          '`user_column_setting_presets(screen_id=asset_search)` を対象ユーザーで取得する',
          '削除済み bookmark を除外し、`is_default DESC, updated_at DESC, user_column_setting_preset_id ASC` で返却する',
          'bookmark ごとの保存設定数は `user_column_setting_preset_items` から算出する'
        )
        ResponseTitle = 'レスポンス（200：ColumnBookmarkListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', 'bookmark 件数'),
          @('items', 'ColumnBookmarkSummary[]', '✓', 'bookmark 一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（ColumnBookmarkSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $bookmarkSummaryRows
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'ColumnBookmarkListResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', $assetOwnViewForbiddenDescription, 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'named bookmark 保存（/asset-search-result/column-bookmarks）'
        Overview = '現在の表示/非表示設定を named bookmark として保存する。'
        Method = 'POST'
        Path = '/asset-search-result/column-bookmarks'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('bookmarkName', 'string', '✓', 'ブックマーク名'),
          @('isDefault', 'boolean', '-', '既定 bookmark として保存するかどうか。未指定時は `false`'),
          @('columns', 'AssetSearchColumnSettingWriteModel[]', '✓', '保存対象の表示/非表示設定一覧')
        )
        RequestSubtables = @(
          @{
            Title = 'columns要素（AssetSearchColumnSettingWriteModel）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $bookmarkWriteRows
          }
        )
        PermissionLines = $assetOwnViewPermissionLines
        ProcessingLines = @(
          '保存単位は `screen_id=asset_search` とする',
          '対象ユーザー・画面内で同名の active bookmark（`deleted_at IS NULL`）が存在する場合は 409 (`BOOKMARK_NAME_DUPLICATED`) を返却する',
          '未知の固定列キーは 400 とする',
          '`isDefault=true` の場合は同一ユーザー・同一画面の active 既存既定 bookmark を解除してから保存する',
          'bookmark 保存は current settings を自動変更しない'
        )
        ResponseTitle = 'レスポンス（201：ColumnBookmarkCreateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'ColumnBookmarkSummary', '✓', '保存した bookmark')
        )
        ResponseSubtables = @(
          @{
            Title = 'item要素（ColumnBookmarkSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $bookmarkSummaryRows
          }
        )
        StatusRows = @(
          @('201', '保存成功', 'ColumnBookmarkCreateResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', $assetOwnViewForbiddenDescription, 'ErrorResponse'),
          @('409', '同名 bookmark が既に存在する', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'named bookmark 削除（/asset-search-result/column-bookmarks/{bookmarkId}）'
        Overview = '保存済み named bookmark を削除する。'
        Method = 'DELETE'
        Path = '/asset-search-result/column-bookmarks/{bookmarkId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('bookmarkId', 'path', 'int64', '✓', 'ブックマークID')
        )
        PermissionLines = $assetOwnViewPermissionLines
        ProcessingLines = @(
          '対象 bookmark が対象ユーザー・`screen_id=asset_search` に属することを確認する',
          '`user_column_setting_presets.deleted_at` を更新して論理削除する',
          '削除対象が既定 bookmark だった場合は既定設定を解除する',
          'bookmark 削除は current settings を自動変更しない'
        )
        ResponseTitle = 'レスポンス（204）'
        ResponseLines = @(
          '本文なし（204 No Content）'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', $assetOwnViewForbiddenDescription, 'ErrorResponse'),
          @('404', 'bookmark が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'named bookmark 適用（/asset-search-result/column-bookmarks/{bookmarkId}/apply）'
        Overview = '保存済み named bookmark を current settings に適用する。'
        Method = 'POST'
        Path = '/asset-search-result/column-bookmarks/{bookmarkId}/apply'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('bookmarkId', 'path', 'int64', '✓', 'ブックマークID')
        )
        PermissionLines = $assetOwnViewPermissionLines
        ProcessingLines = @(
          '対象 bookmark が対象ユーザー・`screen_id=asset_search` に属することを確認する',
          '`user_column_setting_preset_items` の表示/非表示設定を current settings として `user_column_settings(screen_id=asset_search)` へ置換反映する',
          '適用後の列定義に対し、権限要件に起因する `isLocked` を再計算して返却する'
        )
        ResponseTitle = 'レスポンス（200：ColumnBookmarkApplyResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('appliedBookmark', 'ColumnBookmarkSummary', '✓', '適用した bookmark'),
          @('columnDefinitions', 'AssetSearchColumnDefinition[]', '✓', '適用後の current settings'),
          @('savedAt', 'datetime', '✓', '適用日時')
        )
        ResponseSubtables = @(
          @{
            Title = 'appliedBookmark要素（ColumnBookmarkSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $bookmarkSummaryRows
          },
          @{
            Title = 'columnDefinitions要素（AssetSearchColumnDefinition）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $columnDefinitionRows
          }
        )
        StatusRows = @(
          @('200', '適用成功', 'ColumnBookmarkApplyResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', $assetOwnViewForbiddenDescription, 'ErrorResponse'),
          @('404', 'bookmark が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産一覧取得（/asset-search-result/assets）'
        Overview = '参照対象施設の資産一覧を検索・絞り込み取得する。権限で許可されていない項目は返却しない。他施設閲覧時は閲覧専用で返却する。'
        Method = 'GET'
        Path = '/asset-search-result/assets'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('targetFacilityId', 'query', 'int64', '-', '参照対象施設ID。未指定時は作業対象施設。作業対象施設と異なる場合は他施設閲覧条件を満たす場合のみ許可する'),
          @('managementDepartmentName', 'query', 'string', '-', '管理部署の部分一致条件'),
          @('installedDepartmentName', 'query', 'string', '-', '設置部署名の部分一致条件'),
          @('categoryId', 'query', 'int64', '-', 'Category ID'),
          @('largeClassName', 'query', 'string', '-', '大分類名'),
          @('mediumClassName', 'query', 'string', '-', '中分類名'),
          @('assetItemId', 'query', 'int64', '-', '品目ID'),
          @('keyword', 'query', 'string', '-', 'キーワード検索'),
          @('cursor', 'query', 'string', '-', '既定ソート順の続き位置を表す continuation token'),
          @('pageSize', 'query', 'int32', '-', '取得件数。`1-500`、既定値 `100`')
        )
        PermissionLines = $assetCrossFacilityViewPermissionLines + @(
          '認可条件: 価格項目を返す場合、共有システム管理者は参照対象施設が未削除であること。通常アカウントは閲覧者側で `original_price_column` が有効であること。通常アカウントの `EXTERNAL_READONLY` では加えて公開元施設の `facility_external_column_settings(column_code=''original_price_column'')` が有効であること'
        )
        ProcessingLines = @(
          '参照対象施設を解決する。`targetFacilityId` が作業対象施設と異なる場合、通常アカウントでは他施設閲覧条件を判定し、成立しない場合は 403 (`ASSET_VIEW_FORBIDDEN`) を返却する。共有システム管理者では作業対象施設および参照対象施設が未削除であることだけを確認し、`targetFacility.accessMode=EXTERNAL_READONLY` として扱う',
          '`asset_ledgers` を基準に `facilities`、`qr_codes`、`ship_asset_masters`、代表写真用 `asset_photos` を結合する',
          '代表写真の `primaryPhotoUrl` は `application_documents.file_path` に保持したS3オブジェクトキーから認可済み表示URLを発行し、S3オブジェクトキー自体は返却しない',
          '`managementDepartmentName` は `asset_ledgers.management_department_name` をそのまま候補・検索・返却に使用し、`accessMode=OWN` かつ一覧編集可能な文脈では `managementDepartmentId` も併せて返す。legacy 未解決行は `managementDepartmentId=null` として返却する',
          '検索条件は AND 条件で適用し、キーワードは識別情報・名称・設置場所を対象に部分一致で評価する',
          '`cursor` 指定時は `asset_ledger_id ASC` の続き位置から取得し、`pageSize` 件を上限に返却する',
          '取得価格を含む価格系項目は、通常アカウントでは閲覧者側の `original_price_column` と、`EXTERNAL_READONLY` では公開元施設の公開カラム設定を満たさない場合レスポンスから完全に除外する。共有システム管理者では参照対象施設が未削除であれば返却する',
          '一覧行へ返却する列は固定列定義と表示カラム設定に従って制御する'
        )
        ResponseTitle = 'レスポンス（200：AssetSearchResultResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('targetFacility', 'FacilityContext', '✓', '現在参照した施設'),
          @('canViewPrice', 'boolean', '✓', '価格項目を返却したかどうか'),
          @('columnDefinitions', 'AssetSearchColumnDefinition[]', '✓', '現在ターゲット施設に対して有効な列定義'),
          @('pageSize', 'int32', '✓', '今回返却したページサイズ'),
          @('nextCursor', 'string', '-', '次ページ取得用 continuation token。末尾到達時は `null`'),
          @('items', 'AssetSearchResultItem[]', '✓', '検索結果一覧'),
          @('totalCount', 'int32', '✓', '検索結果件数')
        )
        ResponseSubtables = @(
          @{
            Title = 'targetFacility要素（FacilityContext）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '施設ID'),
              @('facilityName', 'string', '✓', '施設名'),
          @('accessMode', 'string', '✓', '`OWN` / `EXTERNAL_READONLY`。共有システム管理者が作業対象施設以外を参照する場合も `EXTERNAL_READONLY`')
            )
          },
          @{
            Title = 'columnDefinitions要素（AssetSearchColumnDefinition）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $columnDefinitionRows
          },
          @{
            Title = 'items要素（AssetSearchResultItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $assetListItemRows
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'AssetSearchResultResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', $assetCrossFacilityForbiddenDescription, 'ErrorResponse'),
          @('404', '作業対象施設または指定された参照対象施設が存在しない、または削除済み', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '一覧管理部署一括更新（/asset-search-result/assets/management-departments）'
        Overview = '一覧の管理部署編集モードで変更した管理部署を一括保存する。対象全件を同一トランザクションで更新し、1件でも競合または候補不整合があれば全件ロールバックする。'
        Method = 'PUT'
        Path = '/asset-search-result/assets/management-departments'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('items', 'AssetManagementDepartmentUpdateItem[]', '✓', '一覧上で変更した管理部署更新対象')
        )
        RequestSubtables = @(
          @{
            Title = 'items要素（AssetManagementDepartmentUpdateItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $managementDepartmentBulkUpdateItemRows
          }
        )
        PermissionLines = $assetManagementDepartmentPermissionLines
        ProcessingLines = @(
          'リクエスト件数は `1-200` 件を許容し、同一 `assetId` の重複指定は 400 を返却する',
          '各 `assetId` が作業対象施設に属する資産であることを確認する',
          '対象施設の active `facility_locations` から `department_id IS NOT NULL` の行を `department_id` 単位で重複排除した管理部署候補を解決し、各 `managementDepartmentId` が有効候補に存在しない場合は 400 (`MANAGEMENT_DEPARTMENT_INVALID`) を返却する',
          '各 `lastKnownUpdatedAt` と現行 `asset_ledgers.updated_at` を比較し、差異があれば 409 (`ASSET_CONFLICT`) を返却する',
          '有効候補の `department_id` / `section_name` を用いて、`asset_ledgers.management_department_id` と `asset_ledgers.management_department_name` を同時更新する',
          '一覧編集モードで `managementDepartmentId=null` の legacy 未解決行を保存対象に含める場合は、候補選択後の値を送信させる'
        )
        ResponseTitle = 'レスポンス（200：AssetManagementDepartmentBulkUpdateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('updatedCount', 'int32', '✓', '更新件数'),
          @('items', 'AssetManagementDepartmentUpdateResult[]', '✓', '更新結果一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（AssetManagementDepartmentUpdateResult）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $managementDepartmentBulkUpdateResultRows
          }
        )
        StatusRows = @(
          @('200', '更新成功', 'AssetManagementDepartmentBulkUpdateResponse'),
          @('400', '入力不正、候補不正、または対象資産重複指定', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', $assetManagementDepartmentForbiddenDescription, 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、削除済み、または資産・管理部署候補が存在しない/対象施設不一致', 'ErrorResponse'),
          @('409', '競合', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '一覧結果エクスポート（/asset-search-result/assets/export）'
        Overview = '現在の検索条件に一致する一覧結果を Excel または PDF として出力する。'
        Method = 'GET'
        Path = '/asset-search-result/assets/export'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('targetFacilityId', 'query', 'int64', '-', '参照対象施設ID。未指定時は作業対象施設。作業対象施設と異なる場合は他施設閲覧条件を満たす場合のみ許可する'),
          @('managementDepartmentName', 'query', 'string', '-', '管理部署の部分一致条件'),
          @('installedDepartmentName', 'query', 'string', '-', '設置部署名の部分一致条件'),
          @('categoryId', 'query', 'int64', '-', 'Category ID'),
          @('largeClassName', 'query', 'string', '-', '大分類名'),
          @('mediumClassName', 'query', 'string', '-', '中分類名'),
          @('assetItemId', 'query', 'int64', '-', '品目ID'),
          @('keyword', 'query', 'string', '-', 'キーワード検索'),
          @('format', 'query', 'string', '✓', '`xlsx` または `pdf`')
        )
        PermissionLines = $assetCrossFacilityViewPermissionLines
        ProcessingLines = @(
          '一覧取得 API と同一の認可、参照対象施設解決、他施設閲覧条件、絞り込み、価格マスクルールを適用する',
          '出力対象列は `user_column_settings` 上の表示対象列と、現在ターゲット施設で許可された列の積集合とする',
          'ファイル名は `assets_{facilityId}_{yyyyMMddHHmmss}.{ext}` を基本とする'
        )
        ResponseTitle = 'レスポンス（200）'
        ResponseLines = @(
          '成功時は `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` または `application/pdf` のバイナリを返却する',
          '価格項目は一覧取得 API と同じ権限条件を満たさない限り出力に含めない'
        )
        StatusRows = @(
          @('200', '出力成功', 'ファイルバイナリ'),
          @('400', '不正な出力形式、または検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', $assetCrossFacilityForbiddenDescription, 'ErrorResponse'),
          @('404', '作業対象施設または指定された参照対象施設が存在しない、または削除済み', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'QRコード直接遷移解決（/asset-detail/assets/by-qr）'
        Overview = '施設IDとQR識別子から資産詳細画面の対象資産を解決する。他施設QRの場合、通常アカウントは他施設閲覧条件を満たす場合のみ、共有システム管理者は作業対象施設およびQRの施設が未削除の場合に閲覧専用で解決する。'
        Method = 'GET'
        Path = '/asset-detail/assets/by-qr'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('facilityId', 'query', 'int64', '✓', 'QRコードが属する施設ID'),
          @('qrIdentifier', 'query', 'string', '✓', 'QR識別子。画面遷移URL上の `qr_identifier` を受けて API では camelCase で扱う')
        )
        PermissionLines = $assetCrossFacilityViewPermissionLines
        ProcessingLines = @(
          'Bearer トークン上の作業対象施設を解決する。通常アカウントでは、`facilityId` が作業対象施設と同一の場合は `OWN`、異なる場合は `EXTERNAL_READONLY` 候補として他施設閲覧条件を判定し、成立しない場合は 403 (`ASSET_VIEW_FORBIDDEN`) を返却する。共有システム管理者では作業対象施設およびQRの施設が未削除であることだけを確認し、QRの施設が作業対象施設と異なる場合は `targetFacility.accessMode=EXTERNAL_READONLY` として返却する',
          '`qr_codes` から `(facility_id, qr_identifier)` で対象 QR を解決する',
          '対象 QR に `asset_ledger_id` が紐づき、対応する `asset_ledgers` が参照対象施設の資産として存在することを確認する',
          '解決した資産について資産詳細取得 API と同じ参照可否判定を適用する',
          '成功時はフロントエンドが `assetId` と `targetFacility` を使って詳細画面遷移を構成できる情報を返却する'
        )
        ResponseTitle = 'レスポンス（200：AssetByQrResolveResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('assetId', 'int64', '✓', '資産台帳ID'),
          @('qrCodeId', 'int64', '✓', 'QRコードID'),
          @('targetFacility', 'FacilityContext', '✓', '詳細表示対象施設')
        )
        ResponseSubtables = @(
          @{
            Title = 'targetFacility要素（FacilityContext）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '施設ID'),
              @('facilityName', 'string', '✓', '施設名'),
          @('accessMode', 'string', '✓', '`OWN` / `EXTERNAL_READONLY`。共有システム管理者が作業対象施設以外のQRを解決する場合も `EXTERNAL_READONLY`')
            )
          }
        )
        StatusRows = @(
          @('200', '解決成功', 'AssetByQrResolveResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', $assetCrossFacilityForbiddenDescription, 'ErrorResponse'),
          @('404', 'QRの施設が存在しない、削除済み、またはQRコード・資産が存在しない/対象施設不一致', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産詳細取得（/asset-detail/assets/{assetId}）'
        Overview = '指定した資産の詳細情報、写真一覧、QR情報を取得する。他施設閲覧時は閲覧専用で返却する。'
        Method = 'GET'
        Path = '/asset-detail/assets/{assetId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('assetId', 'path', 'int64', '✓', '資産台帳ID'),
          @('targetFacilityId', 'query', 'int64', '-', '参照対象施設ID。未指定時は作業対象施設。作業対象施設と異なる場合は他施設閲覧条件を満たす場合のみ許可する')
        )
        PermissionLines = $assetCrossFacilityViewPermissionLines + @(
          '認可条件: 編集可否フラグは、共有システム管理者では参照対象施設が作業対象施設と同一かつ未削除の場合、通常アカウントでは `accessMode=OWN` かつ `original_list_edit` が有効な場合のみ `true` とする。共有システム管理者が作業対象施設以外を参照する場合は閲覧専用として編集系フラグをすべて `false` にする'
        )
        ProcessingLines = @(
          'Bearer トークン上の作業対象施設を解決する。通常アカウントでは、`targetFacilityId` が作業対象施設と同一の場合は `OWN`、異なる場合は `EXTERNAL_READONLY` 候補として他施設閲覧条件を判定し、成立しない場合は 403 (`ASSET_VIEW_FORBIDDEN`) を返却する。共有システム管理者では作業対象施設および参照対象施設が未削除であることだけを確認し、参照対象施設が作業対象施設と異なる場合は `targetFacility.accessMode=EXTERNAL_READONLY` として扱う',
          '対象 `assetId` の `asset_ledgers` を取得し、参照対象施設との整合を確認する',
          '`qr_codes` から現在有効な QR 情報を取得する',
          '`asset_photos` から表示対象写真一覧を取得し、`application_documents.file_path` に保持したS3オブジェクトキーから認可済み表示URLを発行して、代表写真フラグ順・登録順で返却する。S3オブジェクトキー自体は返却しない',
          '`ship_asset_masters` を参照し、分類更新で利用する正規値との整合を確認できる状態で返却する',
          '価格項目は、共有システム管理者では参照対象施設が未削除である場合、通常アカウントでは閲覧者側で `original_price_column` が有効であり、`EXTERNAL_READONLY` では加えて公開元施設の `facility_external_column_settings(column_code=''original_price_column'')` が有効な場合だけ返却する',
          '履歴タブ表示可否は、共有システム管理者では参照対象施設が未削除である場合に `true` とし、通常アカウントでは閲覧者側の `original_list_view` の有効有無から算出し、`EXTERNAL_READONLY` では他施設閲覧条件も前提とする'
        )
        ExtraSections = @(
          @{
            Title = '直接遷移補足'
            Lines = @(
              'QRコード遷移URLで詳細画面を開く場合は、事前に `GET /asset-detail/assets/by-qr` で `assetId` と `targetFacility.accessMode` を解決してから本 API を呼び出す',
              'QR解決結果が `EXTERNAL_READONLY` の場合、本 API も同じ参照対象施設で呼び出し、編集系フラグはすべて `false` とする',
              '施設名と QR識別子は参照専用とし、変更は移動申請および QR発行・ラベル印刷 API の責務で行う'
            )
          }
        )
        ResponseTitle = 'レスポンス（200：AssetDetailResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('asset', 'AssetDetailModel', '✓', '資産詳細本体'),
          @('photos', 'AssetPhotoSummary[]', '✓', '写真一覧'),
          @('qrInfo', 'AssetQrInfo', '-', 'QR情報。未発行時は `null`'),
          @('canEdit', 'boolean', '✓', '編集モードへ遷移できるかどうか'),
          @('canViewPrice', 'boolean', '✓', '価格項目が返却対象かどうか'),
          @('canViewHistory', 'boolean', '✓', '履歴タブを表示できるかどうか')
        )
        ResponseSubtables = @(
          @{
            Title = 'asset要素（AssetDetailModel）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $assetDetailRows
          },
          @{
            Title = 'photos要素（AssetPhotoSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $photoSummaryRows
          },
          @{
            Title = 'qrInfo要素（AssetQrInfo）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('qrCodeId', 'int64', '✓', 'QRコードID'),
              @('qrIdentifier', 'string', '✓', 'QR識別子'),
              @('issueType', 'string', '✓', '`NEW` / `REISSUE`'),
              @('labelTemplateKey', 'string', '✓', 'ラベルテンプレート識別子'),
              @('freeEntryText', 'string', '-', 'ラベルフリー記入項目'),
              @('issuedAt', 'datetime', '✓', '最終発行日時'),
              @('printStatus', 'string', '✓', '印刷状態'),
              @('printedAt', 'datetime', '-', '最終印刷日時')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'AssetDetailResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', $assetCrossFacilityForbiddenDescription, 'ErrorResponse'),
          @('404', '作業対象施設または参照対象施設が存在しない、削除済み、または資産が存在しない/対象施設不一致', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産履歴取得（/asset-detail/assets/{assetId}/history）'
        Overview = '指定資産に紐づく申請履歴、点検結果、貸出/返却履歴を共通イベント形式でページング取得する。'
        Method = 'GET'
        Path = '/asset-detail/assets/{assetId}/history'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('assetId', 'path', 'int64', '✓', '資産台帳ID'),
          @('targetFacilityId', 'query', 'int64', '-', '参照対象施設ID。未指定時は作業対象施設。作業対象施設と異なる場合は他施設閲覧条件を満たす場合のみ許可する'),
          @('cursor', 'query', 'string', '-', '既定ソート順の続き位置を表す continuation token'),
          @('pageSize', 'query', 'int32', '-', '取得件数。`1-500`、既定値 `100`')
        )
        PermissionLines = $assetCrossFacilityViewPermissionLines
        ProcessingLines = @(
          'Bearer トークン上の作業対象施設を解決する。通常アカウントでは `targetFacilityId` が作業対象施設と異なる場合は資産詳細取得 API と同じ他施設閲覧条件を判定し、成立しない場合は 403 (`ASSET_VIEW_FORBIDDEN`) を返却する。共有システム管理者では作業対象施設および参照対象施設が未削除であることだけを確認し、参照対象施設が作業対象施設と異なる場合は閲覧専用として扱う',
          '対象資産の参照可否を資産詳細取得 API と同条件で判定する',
          '`application_assets`、`applications`、`application_status_histories` から資産関連申請の状態履歴を取得する',
          '`inspection_tasks`、`inspection_results` から資産関連点検結果を取得する',
          '`lending_devices`、`lending_transactions` から貸出/返却履歴を取得する',
          '各履歴を共通イベント形式へ正規化し、`occurredAt DESC, eventId DESC` で並べ替える',
          '`cursor` 指定時は続き位置から取得し、`pageSize` 件を上限に返却する'
        )
        ExtraSections = @(
          @{
            Title = '履歴正規化ルール'
            Lines = @(
              '`APPLICATION_STATUS` は `eventId=APPLICATION_STATUS:{application_status_history_id}`、`occurredAt=changed_at`、`title=''申請No.{application_no}''`、`statusLabel=to_status`、`summary=comment`、`sourcePath=/quotation-data-box` を返す。`actorName` は表示名を解決できない場合 `null` とする',
              '`INSPECTION_RESULT` は `eventId=INSPECTION_RESULT:{inspection_result_id}`、`occurredAt=inspected_on` を当日 `00:00:00` の日時へ正規化した値、`title=''点検結果''`、`statusLabel=overall_result`、`actorName=inspector_name`、`summary` は `inspection_type` と `remarks` を結合した値、`sourcePath=/inspection-result` を返す',
              '`LENDING_TRANSACTION` は `eventId=LENDING_TRANSACTION:{lending_transaction_id}`、`occurredAt` は `returned_on` があればその日付、なければ `lent_on` を当日 `00:00:00` の日時へ正規化した値、`title` は返却済みなら `返却`、それ以外は `貸出`、`statusLabel=status`、`actorName=handled_by_name`、`summary` は `lent_department` / `due_on` / `remarks` の利用可能値を連結した値、`sourcePath=/lending-checkout` を返す',
              '`sourcePath` は画面遷移導線を出さない場合や対象画面の閲覧権限がない場合は `null` とする'
            )
          }
        )
        ResponseTitle = 'レスポンス（200：AssetHistoryResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '履歴総件数'),
          @('pageSize', 'int32', '✓', '今回返却したページサイズ'),
          @('nextCursor', 'string', '-', '次ページ取得用 continuation token。末尾到達時は `null`'),
          @('items', 'AssetHistoryItem[]', '✓', '履歴一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（AssetHistoryItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $assetHistoryRows
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'AssetHistoryResponse'),
          @('400', 'cursor / pageSize 不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', $assetHistoryForbiddenDescription, 'ErrorResponse'),
          @('404', '作業対象施設または参照対象施設が存在しない、削除済み、または資産が存在しない/対象施設不一致', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産原本更新（/asset-detail/assets/{assetId}）'
        Overview = '作業対象施設資産の原本情報を更新する。識別・管理情報、設置情報、分類情報、仕様情報、ライフサイクル情報を責務別ペイロードで受け付ける。'
        Method = 'PUT'
        Path = '/asset-detail/assets/{assetId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('assetId', 'path', 'int64', '✓', '資産台帳ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('lastKnownUpdatedAt', 'datetime', '✓', '取得時点の `asset.updatedAt`'),
          @('identity', 'AssetIdentityUpdateModel', '✓', '識別・管理情報更新'),
          @('location', 'AssetLocationUpdateModel', '✓', '設置情報更新'),
          @('classification', 'AssetClassificationUpdateModel', '✓', '分類・名称更新'),
          @('specification', 'AssetSpecificationUpdateModel', '✓', '機器仕様更新'),
          @('lifecycle', 'AssetLifecycleUpdateModel', '✓', '取得・ライフサイクル情報更新')
        )
        RequestSubtables = @(
          @{
            Title = 'identity要素（AssetIdentityUpdateModel）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('assetNo', 'string', '-', '固定資産番号'),
              @('managementDepartmentId', 'string', '-', '資産管理部署ID。指定時は対象施設の active `facility_locations.department_id`（非NULL）として検証する'),
              @('managementDepartmentName', 'string', '-', '資産管理部署名。`managementDepartmentId` を省略した互換更新時のみ使用し、対象施設で一意に解決できる active 部署名であること')
            )
          },
          @{
            Title = 'location要素（AssetLocationUpdateModel）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityLocationId', 'int64', '-', '施設ロケーションID'),
              @('building', 'string', '-', '棟の表示値'),
              @('floor', 'string', '-', '階の表示値'),
              @('shipDivisionName', 'string', '-', 'SHIP部門名'),
              @('shipDepartmentName', 'string', '-', 'SHIP部署名'),
              @('roomCategory1', 'string', '-', '諸室区分①'),
              @('roomCategory2', 'string', '-', '諸室区分②'),
              @('roomName', 'string', '-', '室名称'),
              @('installationLocation', 'string', '-', '設置場所')
            )
          },
          @{
            Title = 'classification要素（AssetClassificationUpdateModel）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('classificationMode', 'string', '✓', '`LINKED` / `MANUAL`'),
              @('shipAssetMasterId', 'int64', '-', '`LINKED` 時に参照する SHIP資産マスタID'),
              @('categoryId', 'int64', '-', '`MANUAL` 時の Category ID。`LINKED` 時に指定した場合は SHIP資産マスタと一致すること'),
              @('assetItemId', 'int64', '-', '品目ID'),
              @('manufacturerId', 'int64', '-', 'メーカーID'),
              @('modelId', 'int64', '-', '型式ID'),
              @('assetName', 'string', '✓', '個体管理名称')
            )
          },
          @{
            Title = 'specification要素（AssetSpecificationUpdateModel）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('managementNo', 'string', '-', '管理機器番号'),
              @('equipmentNo', 'string', '-', 'ME番号'),
              @('serialNo', 'string', '-', 'シリアル番号'),
              @('quantity', 'int32', '✓', '数量'),
              @('unit', 'string', '-', '単位'),
              @('widthMm', 'string', '-', 'W'),
              @('depthMm', 'string', '-', 'D'),
              @('heightMm', 'string', '-', 'H'),
              @('assetInfo', 'string', '-', '資産情報')
            )
          },
          @{
            Title = 'lifecycle要素（AssetLifecycleUpdateModel）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('purchasedOn', 'date', '-', '購入日'),
              @('contractName', 'string', '-', '契約・見積名称'),
              @('contractNo', 'string', '-', '契約番号'),
              @('quotationNo', 'string', '-', '見積番号'),
              @('contractDate', 'date', '-', '契約・発注日'),
              @('deliveryDate', 'date', '-', '納品日'),
              @('inspectionDate', 'date', '-', '検収日'),
              @('isLeased', 'boolean', '✓', 'リース品フラグ'),
              @('isRentedOut', 'boolean', '✓', '借用/貸出中フラグ'),
              @('leaseStartOn', 'date', '-', 'リース開始日'),
              @('leaseEndOn', 'date', '-', 'リース終了日'),
              @('acquisitionCost', 'decimal', '-', '取得価格。更新時も価格権限を必須とする'),
              @('legalServiceLife', 'string', '-', '耐用年数（法定）'),
              @('recommendedServiceLife', 'string', '-', '使用年数（メーカー推奨）'),
              @('endOfServiceOn', 'date', '-', 'End of service'),
              @('endOfSupportOn', 'date', '-', 'End of support')
            )
          }
        )
        PermissionLines = $assetEditPermissionLines + @(
          '認可条件: 取得価格を更新する場合、共有システム管理者は作業対象施設が未削除であること。通常アカウントは `original_price_column` も有効であること'
        )
        ProcessingLines = @(
          '対象資産が作業対象施設に属し、作業対象施設が `facilities.deleted_at IS NULL` の未削除施設であることを確認する',
          '`lastKnownUpdatedAt` と現行 `asset_ledgers.updated_at` を比較し、差異があれば 409 (`ASSET_CONFLICT`) を返却する',
          '`facilityLocationId` が指定された場合は、同一施設の有効ロケーションであることを確認する',
          '`identity.assetNo` は `asset_ledgers.asset_no` 正本へ更新する',
          '`identity.managementDepartmentId` 指定時は、対象施設の active `facility_locations` から `department_id IS NOT NULL` の候補を解決し、`management_department_id` と `management_department_name` を同時更新する',
          '`identity.managementDepartmentId` を省略して `identity.managementDepartmentName` を指定した場合は、active 部署名との完全一致で一意解決できる場合だけ互換更新を許可し、解決不可または複数候補時は 400 (`MANAGEMENT_DEPARTMENT_INVALID` / `MANAGEMENT_DEPARTMENT_AMBIGUOUS`) を返却する',
          '`classification.classificationMode=LINKED` の場合は `shipAssetMasterId` を必須とし、参照先 SHIP資産マスタから Category〜型式の正規値を再解決する。リクエスト側の分類値が指定されていて不一致な場合は 409 (`ASSET_MASTER_MISMATCH`) を返却する',
          '`classification.classificationMode=MANUAL` の場合は `ship_asset_master_id` を `NULL` へ更新し、`categoryId` を必須として分類値を直接保存する',
          'SHIP資産マスタは分類正規値の参照元であり、本 API では `ship_asset_masters` 側の値を更新しない',
          '施設名と QR識別子は別正本の責務とし、本 API の更新対象に含めない'
        )
        ResponseTitle = 'レスポンス（200：AssetDetailUpdateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('asset', 'AssetDetailModel', '✓', '更新後の資産詳細'),
          @('canEdit', 'boolean', '✓', '更新後の編集可否'),
          @('canViewPrice', 'boolean', '✓', '価格項目表示可否'),
          @('canViewHistory', 'boolean', '✓', '履歴タブ表示可否')
        )
        ResponseSubtables = @(
          @{
            Title = 'asset要素（AssetDetailModel）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $assetDetailRows
          }
        )
        StatusRows = @(
          @('200', '更新成功', 'AssetDetailUpdateResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', $assetEditPriceForbiddenDescription, 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、削除済み、または資産が存在しない/対象施設不一致', 'ErrorResponse'),
          @('409', '競合または SHIP資産マスタ整合エラー', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産写真追加（/asset-detail/assets/{assetId}/photos）'
        Overview = '指定資産へ写真を追加する。複数枚を一度に受け付ける。'
        Method = 'POST'
        Path = '/asset-detail/assets/{assetId}/photos'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('assetId', 'path', 'int64', '✓', '資産台帳ID')
        )
        RequestTitle = 'リクエストボディ（multipart/form-data）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('payload.photos', 'AssetPhotoCreateModel[]', '✓', '追加写真メタデータ。各要素の `filePartName` で対応するファイルパートを指定する'),
          @('files', 'binary[]', '✓', '`payload.photos[].filePartName` で参照される写真ファイル本体')
        )
        RequestSubtables = @(
          @{
            Title = 'photos要素（AssetPhotoCreateModel）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('filePartName', 'string', '✓', 'multipart 内の写真ファイルパート名'),
              @('fileName', 'string', '✓', '表示用ファイル名'),
              @('contentType', 'string', '✓', 'MIME Type'),
              @('takenAt', 'datetime', '-', '撮影日時'),
              @('isPrimary', 'boolean', '-', '代表写真指定')
            )
          }
        )
        PermissionLines = $assetEditPermissionLines
        ProcessingLines = @(
          '対象資産が作業対象施設に属し、作業対象施設が `facilities.deleted_at IS NULL` の未削除施設であることを確認する',
          '`payload.photos[].filePartName` が multipart の写真ファイルパートに存在することを確認し、拡張子・MIME Type は画像として許可された形式に限定する',
          '各写真ファイルをAPI内でAmazon S3へPutObjectし、S3オブジェクトキーは `asset-ledgers/{facilityId}/{assetId}/photos/{uploadUuid}.{ext}` 形式で発行する',
          '`application_documents` へ `owner_type=ASSET_LEDGER`、`asset_ledger_id`、`document_category=PHOTO`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`taken_at`、`uploaded_by_user_id`、`uploaded_at` を保存する。S3バケット名やHTTPS URLはDBへ保存しない',
          'S3保存後にDB登録へ失敗した場合は保存済みS3オブジェクトをDeleteObjectで破棄する。破棄に失敗した場合は 502 (`ASSET_FILE_502_S3_WRITE_FAILED`) を返却し、再試行可能な運用ログを残す',
          '`isPrimary=true` の写真が含まれる場合は既存代表写真を解除し、新規写真を代表へ切り替える',
          '返却値は `asset_photos` VIEW 互換の写真一覧要素とし、`fileUrl` はS3オブジェクトキーから発行した認可済み表示URLを返す。S3オブジェクトキー自体は返却しない'
        )
        ResponseTitle = 'レスポンス（201：AssetPhotoCreateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('items', 'AssetPhotoSummary[]', '✓', '追加後の写真一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（AssetPhotoSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $photoSummaryRows
          }
        )
        StatusRows = @(
          @('201', '追加成功', 'AssetPhotoCreateResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', $assetEditForbiddenDescription, 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、削除済み、または資産が存在しない/対象施設不一致', 'ErrorResponse'),
          @('502', 'Amazon S3 への資産写真保存またはロールバック削除に失敗した', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産写真削除（/asset-detail/assets/{assetId}/photos/{photoId}）'
        Overview = '指定した資産写真を論理削除する。'
        Method = 'DELETE'
        Path = '/asset-detail/assets/{assetId}/photos/{photoId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('assetId', 'path', 'int64', '✓', '資産台帳ID'),
          @('photoId', 'path', 'int64', '✓', '写真ID')
        )
        PermissionLines = $assetEditPermissionLines
        ProcessingLines = @(
          '対象写真が `application_documents(owner_type=ASSET_LEDGER, document_category=PHOTO)` に存在し、対象資産へ紐づくことを確認する',
          '`application_documents.deleted_at` を更新して論理削除する',
          'API処理内ではS3オブジェクトを即時DeleteObjectしない。同一S3オブジェクトキーを参照する有効メタデータがなくなったことと保存期間を確認するストレージ削除処理でS3実体を削除する',
          '削除対象が代表写真だった場合は、残存する `ASSET_LEDGER` 写真から代表を再選定する'
        )
        ResponseTitle = 'レスポンス（204）'
        ResponseLines = @(
          '本文なし（204 No Content）'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', $assetEditForbiddenDescription, 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、削除済み、または資産・写真が存在しない/対象施設不一致', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産ドキュメント一覧取得（/asset-detail/assets/{assetId}/documents）'
        Overview = '指定資産に紐づく登録ドキュメント一覧を取得する。他施設閲覧時は閲覧専用で一覧のみ返却する。'
        Method = 'GET'
        Path = '/asset-detail/assets/{assetId}/documents'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('assetId', 'path', 'int64', '✓', '資産台帳ID'),
          @('targetFacilityId', 'query', 'int64', '-', '参照対象施設ID。未指定時は作業対象施設。作業対象施設と異なる場合は他施設閲覧条件を満たす場合のみ許可する')
        )
        PermissionLines = $assetCrossFacilityViewPermissionLines
        ProcessingLines = @(
          'Bearer トークン上の作業対象施設を解決する。通常アカウントでは `targetFacilityId` が作業対象施設と異なる場合は資産詳細取得 API と同じ他施設閲覧条件を判定し、成立しない場合は 403 (`ASSET_VIEW_FORBIDDEN`) を返却する。共有システム管理者では作業対象施設および参照対象施設が未削除であることだけを確認し、参照対象施設が作業対象施設と異なる場合は閲覧専用として扱う',
          '対象資産の参照可否を資産詳細取得 API と同条件で判定する',
          '`asset_documents` VIEW から `owner_type=ASSET_LEDGER` のドキュメント一覧を取得する',
          '`application_documents.file_path` に保持したS3オブジェクトキーから認可済みダウンロードURLを発行し、S3オブジェクトキー自体は返却しない'
        )
        ResponseTitle = 'レスポンス（200：AssetDocumentListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', 'ドキュメント件数'),
          @('items', 'AssetDocumentSummary[]', '✓', 'ドキュメント一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（AssetDocumentSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $documentSummaryRows
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'AssetDocumentListResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', $assetCrossFacilityForbiddenDescription, 'ErrorResponse'),
          @('404', '作業対象施設または参照対象施設が存在しない、削除済み、または資産が存在しない/対象施設不一致', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産ドキュメント追加（/asset-detail/assets/{assetId}/documents）'
        Overview = '指定資産へドキュメントを追加する。'
        Method = 'POST'
        Path = '/asset-detail/assets/{assetId}/documents'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('assetId', 'path', 'int64', '✓', '資産台帳ID')
        )
        RequestTitle = 'リクエストボディ（multipart/form-data）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('payload.documentType', 'string', '✓', 'ドキュメント種別'),
          @('payload.title', 'string', '-', '表示タイトル'),
          @('payload.documentDate', 'date', '-', '文書日付'),
          @('payload.fileName', 'string', '✓', '表示用ファイル名'),
          @('payload.contentType', 'string', '✓', 'MIME Type'),
          @('file', 'binary', '✓', '登録ファイル本体')
        )
        PermissionLines = $assetEditPermissionLines
        ProcessingLines = @(
          '対象資産が作業対象施設に属し、作業対象施設が `facilities.deleted_at IS NULL` の未削除施設であることを確認する',
          'multipart の `file` パートが存在することを確認し、`payload.contentType` と拡張子が許可された業務文書形式であることを検証する',
          'ファイル本体をAPI内でAmazon S3へPutObjectし、S3オブジェクトキーは `asset-ledgers/{facilityId}/{assetId}/documents/{uploadUuid}.{ext}` 形式で発行する',
          '`application_documents` へ `owner_type=ASSET_LEDGER`、`asset_ledger_id`、PHOTO 以外の `document_category`、`document_type`、`title`、`document_date`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`uploaded_by_user_id`、`uploaded_at` を保存する。S3バケット名やHTTPS URLはDBへ保存しない',
          'S3保存後にDB登録へ失敗した場合は保存済みS3オブジェクトをDeleteObjectで破棄する。破棄に失敗した場合は 502 (`ASSET_FILE_502_S3_WRITE_FAILED`) を返却し、再試行可能な運用ログを残す',
          '`asset_documents` VIEW 互換で参照できる状態へ反映し、`downloadUrl` はS3オブジェクトキーから発行した認可済みダウンロードURLを返す。S3オブジェクトキー自体は返却しない'
        )
        ResponseTitle = 'レスポンス（201：AssetDocumentCreateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'AssetDocumentSummary', '✓', '追加後のドキュメント')
        )
        ResponseSubtables = @(
          @{
            Title = 'item要素（AssetDocumentSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $documentSummaryRows
          }
        )
        StatusRows = @(
          @('201', '追加成功', 'AssetDocumentCreateResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', $assetEditForbiddenDescription, 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、削除済み、または資産が存在しない/対象施設不一致', 'ErrorResponse'),
          @('502', 'Amazon S3 への資産ドキュメント保存またはロールバック削除に失敗した', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産ドキュメント削除（/asset-detail/assets/{assetId}/documents/{documentId}）'
        Overview = '指定した資産ドキュメントを論理削除する。'
        Method = 'DELETE'
        Path = '/asset-detail/assets/{assetId}/documents/{documentId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('assetId', 'path', 'int64', '✓', '資産台帳ID'),
          @('documentId', 'path', 'int64', '✓', 'ドキュメントID')
        )
        PermissionLines = $assetEditPermissionLines
        ProcessingLines = @(
          '対象ドキュメントが `application_documents(owner_type=ASSET_LEDGER, document_category<>PHOTO)` に存在し、対象資産へ紐づくことを確認する',
          '`application_documents.deleted_at` を更新して論理削除する',
          'API処理内ではS3オブジェクトを即時DeleteObjectしない。同一S3オブジェクトキーを参照する有効メタデータがなくなったことと保存期間を確認するストレージ削除処理でS3実体を削除する'
        )
        ResponseTitle = 'レスポンス（204）'
        ResponseLines = @(
          '本文なし（204 No Content）'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', $assetEditForbiddenDescription, 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、削除済み、または資産・ドキュメントが存在しない/対象施設不一致', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '権限管理単位別マトリクス' },
    @{ Type = 'Table'; Headers = @('項目', '必要コード', '備考'); Rows = @(
      @('一覧取得 / 詳細取得 / QR解決 / ドキュメント一覧取得', '`original_list_view`', '通常アカウントは作業対象施設の実効 `original_list_view` を判定し、他施設は同じ閲覧者権限、協業グループ、公開元施設の `facility_external_view_settings(sharing_data_type=''asset'')` を満たす場合のみ `EXTERNAL_READONLY` で返却する。共有システム管理者は対象施設が未削除であれば参照でき、作業対象施設以外を参照する場合は `EXTERNAL_READONLY` で返却する'),
      @('資産履歴表示', '`original_list_view`', '通常アカウントは資産詳細取得と同じ参照可否判定に従う。共有システム管理者は対象施設が未削除であること'),
      @('価格項目表示', '`original_price_column`', '通常アカウントは保存済み表示/非表示設定に含まれていても、閲覧者側の権限または公開元施設の `facility_external_column_settings(column_code=''original_price_column'')` を満たさない場合は返却しない。共有システム管理者は対象施設が未削除であれば返却する'),
      @('新規・更新・増設・移動・廃棄申請ボタン表示', '`original_application`', '通常アカウントは一覧起点の申請導線のみ制御する。共有システム管理者は参照対象施設が作業対象施設と同一かつ未削除の場合に表示可'),
      @('点検管理登録ボタン表示', '`inspection_management`', '通常アカウントは一覧起点の点検管理登録導線のみ制御する。共有システム管理者は参照対象施設が作業対象施設と同一かつ未削除の場合に表示可'),
      @('保守契約登録ボタン表示', '`maintenance_contract`', '通常アカウントは一覧起点の保守契約登録導線のみ制御する。共有システム管理者は参照対象施設が作業対象施設と同一かつ未削除の場合に表示可'),
      @('貸出登録ボタン表示', '`lending_management`', '通常アカウントは一覧起点の貸出機器登録導線のみ制御する。共有システム管理者は参照対象施設が作業対象施設と同一かつ未削除の場合に表示可。貸出機器登録モーダルの API は「貸出管理 API 設計書」を参照する'),
      @('一覧の管理部署編集', '`original_list_view` + `management_department_edit`', '通常アカウントは両 feature の実効有効を判定する。共有システム管理者は参照対象施設が作業対象施設と同一かつ未削除の場合に許可する。作業対象施設原本の管理部署列更新だけを制御する'),
      @('原本編集 / 写真 / ドキュメント更新', '`original_list_view` + `original_list_edit`', '通常アカウントは両 feature の実効有効を判定する。共有システム管理者は参照対象施設が作業対象施設と同一かつ未削除の場合に許可する。詳細画面起点の変更系は作業対象施設原本に限定する')
    ) },
    @{ Type = 'Heading2'; Text = '列定義と表示カラム設定の扱い' },
    @{ Type = 'Bullets'; Items = @(
      '固定列のラベル変更やグループ変更は API 契約変更として扱う',
      '価格列は、通常アカウントでは保存済み表示/非表示設定に含まれていても、閲覧者側の `original_price_column` と、`EXTERNAL_READONLY` では公開元施設の `facility_external_column_settings(column_code=''original_price_column'')` を満たさない場合は `isLocked=true` とし、値も返却しない。共有システム管理者では参照対象施設が未削除であれば値を返却する',
      'named bookmark は current settings とは別に `user_column_setting_presets` / `user_column_setting_preset_items` で管理する',
      '既定 bookmark は active 行に対して `user_id + screen_id` 単位で 0..1 件とし、current settings 未保存時の初期表示へ適用する',
      'current settings は bookmark 保存/削除/既定切替では変化させず、bookmark 適用時だけ置換更新する'
    ) },
    @{ Type = 'Heading2'; Text = 'QR・写真・ドキュメント方針' },
    @{ Type = 'Bullets'; Items = @(
      'QR情報は `qr_codes` 正本から参照し、資産詳細取得レスポンスへ含める',
      'QRラベル遷移URLは `facilityId` と `qr_identifier` を含め、詳細画面では画面側で resolve-by-qr API へ橋渡しして `assetId` を解決する',
      'QRラベル遷移URL上の `facilityId` が作業対象施設と異なる場合、通常アカウントは他施設閲覧条件を満たす場合のみ `EXTERNAL_READONLY` として資産詳細へ遷移できる。共有システム管理者は作業対象施設およびQRの施設が未削除であれば、協業グループ・公開元施設設定を判定せず `EXTERNAL_READONLY` として資産詳細へ遷移できる。この場合も編集系フラグはすべて `false` とする',
      '資産写真・資産ドキュメントの正本更新先は `application_documents` とし、互換VIEWへ直接書き込まない',
      '資産写真・資産ドキュメントのファイル本体はAPI内でAmazon S3へPutObjectし、`application_documents.file_path` にはS3オブジェクトキーのみを保存する。S3バケット名やHTTPS URLはDBへ保存しない',
      '写真の `fileUrl`、代表写真の `primaryPhotoUrl`、ドキュメントの `downloadUrl` はS3オブジェクトキーから発行した認可済みURLとして返却し、S3オブジェクトキー自体はレスポンスへ含めない',
      '写真・ドキュメント削除は `application_documents.deleted_at` の論理削除とし、S3実体の削除は同一S3オブジェクトキーを参照する有効メタデータがなくなったことと保存期間を確認するストレージ削除処理で扱う',
      '写真代表判定は `ASSET_LEDGER` 写真を優先し、調査写真の投影ロジックは `asset_photos` VIEW の定義に従う',
      'ドキュメント一覧取得は `owner_type=ASSET_LEDGER` を対象とし、申請・RFQ・見積の添付は本 API の対象外'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', '主な発生API', '説明'); Rows = @(
      @('ASSET_VIEW_FORBIDDEN', '一覧/詳細/履歴/エクスポート/QR解決/ドキュメント一覧系', '通常アカウントで対象施設に対するデータ閲覧権限がない、または通常アカウントの他施設閲覧条件を満たさない'),
      @('TARGET_FACILITY_NOT_SUPPORTED', '更新/写真/ドキュメント更新系', '作業対象施設以外の資産に対する変更操作が指定された'),
      @('ASSET_HISTORY_FORBIDDEN', '資産履歴取得', '通常アカウントで対象施設に対する履歴閲覧権限がない、または通常アカウントの他施設閲覧条件を満たさない'),
      @('ASSET_NOT_FOUND', '一覧/詳細/更新/写真/ドキュメント系', '作業対象施設または参照対象施設が存在しない/削除済み、または対象資産が存在しない/対象施設不一致'),
      @('ASSET_QR_NOT_FOUND', 'QRコード直接遷移解決', '指定した施設IDの施設が存在しない/削除済み、またはQR識別子に対応するQRコード・資産が存在しない/対象施設不一致'),
      @('ASSET_CONFLICT', '一覧管理部署一括更新 / 資産原本更新', '取得後に `asset_ledgers.updated_at` が更新され競合した'),
      @('ASSET_MASTER_MISMATCH', '資産原本更新', '`classificationMode=LINKED` の要求内容が参照先 SHIP資産マスタと整合しない'),
      @('MANAGEMENT_DEPARTMENT_INVALID', '一覧管理部署一括更新 / 資産原本更新', '指定した管理部署IDまたは管理部署名が、対象施設の active 個別部署マスタ候補に存在しない'),
      @('MANAGEMENT_DEPARTMENT_AMBIGUOUS', '資産原本更新', '指定した管理部署名が、対象施設の active 個別部署マスタ候補に複数一致する'),
      @('COLUMN_SETTING_INVALID', '表示カラム設定保存', '未知の固定列キーが指定された'),
      @('BOOKMARK_NAME_DUPLICATED', 'named bookmark 保存', '同一ユーザー・同一画面に同名 bookmark が存在する'),
      @('BOOKMARK_NOT_FOUND', 'named bookmark 削除 / 適用', '指定した bookmark が存在しない、または対象ユーザーに属さない'),
      @('PRICE_COLUMN_FORBIDDEN', '一覧/詳細/更新', '通常アカウントで価格項目の参照または更新権限がない。共有システム管理者では対象施設が未削除である限り価格カラムを利用可能とする'),
      @('PHOTO_NOT_FOUND', '資産写真削除', '対象写真が存在しない、または対象資産へ紐づかない'),
      @('DOCUMENT_NOT_FOUND', '資産ドキュメント削除', '対象ドキュメントが存在しない、または対象資産へ紐づかない'),
      @('ASSET_FILE_502_S3_WRITE_FAILED', '資産写真追加 / 資産ドキュメント追加', '資産写真・資産ドキュメントのAmazon S3 PutObject、またはDB失敗時の保存済みS3オブジェクト破棄に失敗した')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・前提事項' },
    @{ Type = 'Heading2'; Text = '本版で明示した前提' },
    @{ Type = 'Bullets'; Items = @(
      '一覧起点の各種申請 API は別設計書で扱い、本書では表示可否と参照対象返却までを対象とする',
      '資産一覧画面の「貸出登録」ボタンおよび貸出機器登録モーダルの API は「貸出管理 API 設計書」で扱い、本書では `canRegisterLendingManagement` による表示可否までを対象とする',
      'named bookmark は current settings と分離し、`user_column_setting_presets` / `user_column_setting_preset_items` を追加してサーバー永続化する',
      '管理部署は検索・表示では `asset_ledgers.management_department_name` を用い、更新時は `facility_locations` 由来の `management_department_id` と `management_department_name` を同時更新する',
      '一覧の管理部署編集候補は、対象施設の active `facility_locations` のうち `department_id IS NOT NULL` の行を `department_id` 単位で重複排除して生成し、同名候補は `displayLabel=department_name / section_name` で識別する。同一施設・同一 `department_id` では `department_name` / `section_name` が一致している前提で扱う',
      '`management_department_id` 追加時は既存 active 資産を一意一致 backfill し、未解決行は `managementDepartmentId=null` のまま返して編集時に再選択させる',
      'QRコード直接遷移は QRラベルURL上の `facilityId` + `qr_identifier` を入力とし、画面側で resolve-by-qr API へ橋渡しして詳細画面へ入る',
      '分類更新は `classificationMode=LINKED` / `MANUAL` を明示し、SHIP資産マスタ再紐付けと手動管理切替の両方を許容する'
    ) }
  )
}
