$columnDefinitionRows = @(
  @('columnKey', 'string', '✓', 'カラム識別子。固定列は `facilityName` など、任意カラムは `ship_asset_custom:{column_key}` を用いる')
  @('columnLabel', 'string', '✓', '画面表示名')
  @('groupCode', 'string', '✓', '表示グループ。`basic` / `commonMaster` / `location` / `identity` / `classification` / `specification` / `acquisition` / `other` / `shipAssetCustom`')
  @('sortOrder', 'int32', '✓', '表示順')
  @('isCustom', 'boolean', '✓', 'SHIP資産マスタ任意カラムかどうか')
  @('isVisible', 'boolean', '✓', '現在ユーザー設定で表示対象かどうか')
  @('isLocked', 'boolean', '✓', '権限または公開設定により現在ターゲット施設では表示不可かどうか')
)

$customValueRows = @(
  @('columnKey', 'string', '✓', '任意カラム識別子。`ship_asset_custom:{column_key}`')
  @('columnLabel', 'string', '✓', '表示名')
  @('valueText', 'string', '-', '任意カラム値。未設定時は `null`')
)

$accessibleFacilityRows = @(
  @('facilityId', 'int64', '✓', '対象施設ID')
  @('facilityName', 'string', '✓', '施設名')
  @('accessMode', 'string', '✓', '`OWN` / `EXTERNAL`')
  @('isCurrentTarget', 'boolean', '✓', '現在選択中施設かどうか')
)

$filterOptionRows = @(
  @('value', 'string', '✓', '候補値。IDを使う項目も文字列化して返却する')
  @('label', 'string', '✓', '画面表示名')
)

$cursorPaginationParameterRows = @(
  @('cursor', 'query', 'string', '-', '既定ソート順の続き位置を表す continuation token'),
  @('pageSize', 'query', 'int32', '-', '取得件数。`1-500`、既定値 `100`')
)

$bookmarkSummaryRows = @(
  @('bookmarkId', 'int64', '✓', 'ブックマークID'),
  @('bookmarkName', 'string', '✓', 'ブックマーク名'),
  @('columnCount', 'int32', '✓', '保存列数'),
  @('isDefault', 'boolean', '✓', '既定ブックマークかどうか'),
  @('createdAt', 'datetime', '✓', '作成日時'),
  @('updatedAt', 'datetime', '✓', '更新日時')
)

$bookmarkWriteRows = @(
  @('columnKey', 'string', '✓', '固定列キーまたは `ship_asset_custom:{column_key}`'),
  @('isVisible', 'boolean', '✓', '表示フラグ'),
  @('sortOrder', 'int32', '✓', '表示順')
)

$assetHistoryRows = @(
  @('eventId', 'string', '✓', '履歴イベント識別子。例: `APPLICATION_STATUS:101`'),
  @('eventType', 'string', '✓', '`APPLICATION_STATUS` / `INSPECTION_RESULT` / `LENDING_TRANSACTION`'),
  @('occurredAt', 'datetime', '✓', 'イベント発生日時'),
  @('title', 'string', '✓', '一覧表示用タイトル'),
  @('statusLabel', 'string', '-', '状態表示ラベル'),
  @('actorName', 'string', '-', '処理者/実施者名'),
  @('sourceId', 'int64', '✓', '元レコードID'),
  @('sourcePath', 'string', '-', '関連画面への遷移パス'),
  @('summary', 'string', '-', '補足表示')
)

$photoSummaryRows = @(
  @('photoId', 'int64', '✓', '写真ID。`application_documents.application_document_id` を返す')
  @('fileName', 'string', '✓', '表示用ファイル名')
  @('fileUrl', 'string', '✓', '画像表示用URL')
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
  @('downloadUrl', 'string', '✓', 'ダウンロード/プレビュー用URL')
  @('uploadedAt', 'datetime', '✓', '登録日時')
)

$assetListItemRows = @(
  @('assetId', 'int64', '✓', '資産台帳ID')
  @('facilityId', 'int64', '✓', '設置施設ID')
  @('facilityName', 'string', '✓', '施設名')
  @('qrIdentifier', 'string', '-', 'QR識別子')
  @('assetNo', 'string', '-', '固定資産番号')
  @('managementNo', 'string', '-', '管理機器番号')
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
  @('primaryPhotoUrl', 'string', '-', 'カード表示用の代表写真URL')
  @('customValues', 'AssetCustomValue[]', '✓', '任意カラム値一覧')
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
  @('customValues', 'AssetCustomValue[]', '✓', '任意カラム値一覧')
  @('updatedAt', 'datetime', '✓', '競合検知用更新日時')
)

@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_資産検索・資産詳細.docx'
  ScreenLabel = '資産検索・資産詳細'
  CoverDateText = '2026年4月20日'
  RevisionDateText = '2026/4/20'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、資産一覧画面（`/asset-search-result`）および資産詳細画面（`/asset-detail`）で利用する API の設計内容を整理し、自施設資産および協業グループ経由で公開された他施設資産を、権限制御と公開範囲を崩さずに参照・運用するための基準を定義する。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      '資産一覧の検索・絞り込み・ページング・カード/リスト表示・エクスポート I/F',
      '表示カラム現在設定と named bookmark の取得・保存・適用 I/F',
      '資産詳細の参照、QRコード直接遷移解決、履歴表示、および自施設原本に限定した編集・写真・ドキュメント管理 I/F',
      '自施設閲覧、他施設閲覧、価格カラム表示、申請起票導線、原本編集の権限境界'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '資産一覧は `asset_ledgers` を正本として、施設・ロケーション・分類・識別情報・調達情報・ライフサイクル情報を一覧表示し、表示カラム設定に応じて SHIP資産マスタ任意カラムも可変表示する画面である。' },
    @{ Type = 'Paragraph'; Text = '資産詳細は、一覧から選択した資産の詳細情報、QR情報、写真、ドキュメントを表示する画面であり、自施設資産に対してのみ原本編集、写真追加/削除、ドキュメント追加/削除を許可する。他施設資産は閲覧専用とする。' },
    @{ Type = 'Paragraph'; Text = '資産一覧から起動する新規購入/更新/増設/移動/廃棄などの申請処理は、本 API 群ではなく各業務機能の API 設計書で扱う。本書では一覧側から必要となる表示可否と選択対象データの返却までを対象とする。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('資産原本', '`asset_ledgers` に保持する現物資産台帳。資産一覧と資産詳細の主対象'),
      @('表示カラム設定', '`user_column_settings` に保持するユーザー単位の現在列表示設定。画面IDは `asset_search` を用いる'),
      @('named bookmark', '`user_column_setting_presets` / `user_column_setting_preset_items` に保持する列表示プリセット。現在設定とは別管理とする'),
      @('SHIP資産マスタ任意カラム', '`ship_asset_master_custom_columns` / `ship_asset_master_custom_values` で管理する可変項目'),
      @('自施設閲覧', 'Bearer トークン上の作業対象施設を対象に `own_asset_list` を使って資産を参照するモード'),
      @('他施設閲覧', '協業グループと他施設公開設定を満たす施設を対象に `other_asset_list` を使って参照するモード'),
      @('原本編集', '資産詳細から `asset_ledgers` 正本と、資産に紐づく写真・ドキュメントを更新する処理。`original_list_edit` を前提とする'),
      @('価格カラム', '取得価格などの価格系項目。画面文脈では `original_price_column`、データ閲覧文脈では `own_price_column` / `other_price_column` で制御する')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面URL', '利用目的'); Rows = @(
      @('15. 資産一覧画面', '/asset-search-result', '資産一覧表示、検索、表示カラム切替、エクスポート、申請起票導線表示'),
      @('16. 資産詳細画面', '/asset-detail', '資産詳細、QR情報、写真、ドキュメントの参照と、自施設原本の編集')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'API の位置づけ' },
    @{ Type = 'Paragraph'; Text = '本 API 群は、資産一覧画面のコンテキスト取得、表示カラム現在設定保存、named bookmark 一覧/保存/削除/適用、資産一覧取得、一覧結果エクスポート、QRコード直接遷移解決、資産詳細取得、資産履歴取得、資産原本更新、写真追加/削除、ドキュメント一覧取得・追加・削除を提供する。' },
    @{ Type = 'Paragraph'; Text = '他施設閲覧では、閲覧者側施設・ユーザーの `other_asset_list`、同一協業グループ所属、公開元施設の `facility_external_view_settings` / `facility_external_column_settings` を同時に満たす場合だけ許可する。' },
    @{ Type = 'Paragraph'; Text = '資産詳細の履歴表示は、申請履歴、点検結果、貸出/返却履歴を共通イベント形式へ正規化して返却し、詳細本体 API とは分離したタブ読込用 I/F として扱う。' },
    @{ Type = 'Heading2'; Text = '画面と API の関係' },
    @{ Type = 'Numbered'; Items = @(
      '画面初期表示時に `GET /asset-search-result/context` を呼び出し、選択可能施設、フィルタ候補、列定義、現在列設定、操作可否を取得する',
      '表示カラム変更の保存時に `PUT /asset-search-result/column-settings` を呼び出す',
      'named bookmark モーダル表示時に `GET /asset-search-result/column-bookmarks` を呼び出し、保存時は `POST`、削除時は `DELETE`、適用時は `POST /asset-search-result/column-bookmarks/{bookmarkId}/apply` を呼び出す',
      '検索条件変更または表示切替時に `GET /asset-search-result/assets` を呼び出し、一覧データを再取得する',
      'Excel/PDF 出力時に `GET /asset-search-result/assets/export` を呼び出す',
      'QRコード遷移URLで詳細画面を開く場合は `GET /asset-detail/assets/by-qr` で `assetId` を解決してから詳細取得 API を呼び出す',
      '一覧から資産を開く時に `GET /asset-detail/assets/{assetId}` を呼び出す',
      '履歴タブ表示時に `GET /asset-detail/assets/{assetId}/history` を呼び出す',
      '自施設資産の保存時に `PUT /asset-detail/assets/{assetId}` を呼び出す',
      '写真追加/削除時に `POST /asset-detail/assets/{assetId}/photos` または `DELETE /asset-detail/assets/{assetId}/photos/{photoId}` を呼び出す',
      'ドキュメント領域の表示時に `GET /asset-detail/assets/{assetId}/documents` を呼び出し、追加/削除時は `POST` / `DELETE` を呼び出す',
      '一覧起点の各種申請 API は別設計書で扱い、本 API では `canOpenApplications` などの表示制御用フラグのみ返却する'
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル', '利用種別', '用途'); Rows = @(
      @('asset_ledgers', 'READ / UPDATE', '資産一覧・詳細の正本、原本編集、競合検知'),
      @('facilities', 'READ', '施設名表示、対象施設解決、論理削除判定'),
      @('facility_locations', 'READ', 'ロケーション表示、更新時の整合性確認'),
      @('ship_asset_masters', 'READ', 'SHIP資産マスタ参照、任意カラムの親解決'),
      @('ship_asset_master_custom_columns', 'READ', '有効任意カラム定義の取得'),
      @('ship_asset_master_custom_values', 'READ', '資産に紐づく任意カラム値の取得'),
      @('user_column_settings', 'READ / CREATE / UPDATE / DELETE', '現在の表示カラム設定の取得と保存'),
      @('user_column_setting_presets / user_column_setting_preset_items', 'READ / CREATE / UPDATE / DELETE', 'named bookmark の一覧、保存、削除、適用'),
      @('user_facility_assignments / facility_feature_settings / user_facility_feature_settings', 'READ', '画面・業務APIの feature_code 判定'),
      @('facility_column_settings / user_facility_column_settings', 'READ', '自施設閲覧時の column_code 判定'),
      @('facility_collaboration_groups / facility_collaboration_group_facilities', 'READ', '他施設閲覧候補の協業グループ所属確認'),
      @('facility_external_view_settings / facility_external_column_settings', 'READ', '公開元施設の他施設公開可否判定'),
      @('qr_codes', 'READ', '資産詳細画面の QR 情報表示'),
      @('applications / application_assets / application_status_histories', 'READ', '資産関連申請と状態履歴の表示'),
      @('inspection_tasks / inspection_results', 'READ', '資産関連点検結果の履歴表示'),
      @('lending_devices / lending_transactions', 'READ', '資産関連の貸出/返却履歴表示'),
      @('asset_photos', 'READ', '資産写真一覧表示'),
      @('asset_documents', 'READ', '資産ドキュメント一覧表示'),
      @('application_documents', 'CREATE / UPDATE / DELETE', '資産写真・資産ドキュメントの正本更新')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API 共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON（エクスポート応答を除く）',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-04-20T00:00:00Z`）',
      '一覧系 API は `cursor` / `pageSize` による cursor pagination を採用し、既定 `pageSize=100`、上限 `500` とする',
      '対象施設の指定は Bearer トークン上の作業対象施設を基準とし、`targetFacilityId` で他施設を明示した場合のみ外部閲覧判定へ切り替える',
      '一覧/詳細レスポンスは、許可されていないデータ項目やカラムを含めない'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '画面導線・ボタン表示の `feature_code` と、実データ閲覧の `feature_code` / `column_code` は責務を分けて扱う。画面表示用には `original_list_view`、申請起票ボタン用には `original_application`、原本編集用には `original_list_edit` を使う。一方、実際に資産データを返す業務 API は、自施設なら `own_asset_list` / `own_price_column`、他施設なら `other_asset_list` / `other_price_column` を、公開元施設設定も含めて毎回再判定する。' },
    @{ Type = 'Table'; Headers = @('処理', '必要コード', '説明'); Rows = @(
      @('一覧画面表示 / 詳細画面表示', '`original_list_view`', '画面遷移導線と画面本体の表示前提'),
      @('一覧/詳細の自施設データ参照', '`own_asset_list`', '作業対象施設の資産原本データを返却する'),
      @('一覧/詳細の他施設データ参照', '`other_asset_list`', '協業グループ経由で公開された他施設資産を返却する'),
      @('申請起票ボタン表示', '`original_application`', '一覧起点の新規購入/更新/増設/移動/廃棄などの導線表示'),
      @('資産詳細の原本編集 / 写真操作 / ドキュメント操作', '`original_list_edit` + `own_asset_list`', '自施設原本に限定した変更系処理'),
      @('自施設価格項目の返却', '`original_price_column` + `own_price_column`', '取得価格などの価格系項目を返却する'),
      @('他施設価格項目の返却', '`original_price_column` + `other_price_column` + 公開元施設 `facility_external_column_settings`', '他施設公開ポリシーを満たす価格項目だけ返却する')
    ) },
    @{ Type = 'Heading2'; Text = '自施設閲覧 / 他施設閲覧ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`targetFacilityId` 未指定時は Bearer トークン上の作業対象施設を参照対象とする',
      '`targetFacilityId` が作業対象施設と異なる場合は他施設閲覧とみなし、閲覧者側施設・ユーザーの `other_asset_list` が有効であること、両施設が同一協業グループに属すること、公開元施設が `other_asset_list` を公開していることを必須とする',
      '他施設閲覧時の価格項目は、閲覧者側 `other_price_column` と公開元施設 `facility_external_column_settings(column_code=other_price_column)` の両方が有効な場合だけ返却する',
      '他施設閲覧時は `canOpenApplications=false`、`canEditAsset=false` とし、変更系 API は 403 を返却する',
      '対象施設が `facilities.deleted_at IS NOT NULL` の場合は 404 とする'
    ) },
    @{ Type = 'Heading2'; Text = '表示カラム設定ルール' },
    @{ Type = 'Bullets'; Items = @(
      '現在の表示カラム設定は `user_column_settings` に `screen_id=asset_search` で保持する',
      'named bookmark は `user_column_setting_presets` / `user_column_setting_preset_items` に `screen_id=asset_search` で保持し、現在設定とは別に管理する',
      '固定列の `column_key` は画面契約として固定し、SHIP資産マスタ任意カラムは `ship_asset_custom:{column_key}` 形式で保存する',
      '現在設定が未保存で、既定 bookmark が存在する場合は、その bookmark の列構成を初期表示へ適用する',
      '未保存ユーザーの初期表示順は API 側既定値を採用し、任意カラムは `ship_asset_master_custom_columns.sort_order ASC` で末尾追加する',
      '権限や公開設定で返却不可な列は `isLocked=true` として返し、一覧データ本体にも値を含めない',
      'bookmark 適用時は preset の列構成で `user_column_settings` を置換更新し、次回表示時はその current settings を返却する'
    ) },
    @{ Type = 'Heading2'; Text = '検索・絞り込みルール' },
    @{ Type = 'Bullets'; Items = @(
      '管理部署、設置部署、Category、大分類、中分類、品目、キーワードは AND 条件で絞り込む',
      '管理部署は `asset_ledgers.management_department_name` を正本とし、候補・検索条件・一覧/詳細表示で同じ値を用いる',
      'キーワード検索は `qr_identifier`、`asset_no`、`management_no`、`equipment_no`、`asset_name`、`manufacturer_name`、`model_name`、`serial_no`、`room_name`、`installation_location`、表示対象の任意カラム値を対象に部分一致で行う',
      '一覧の既定並び順は `asset_ledger_id ASC` とし、`cursor` は最終返却行の `asset_ledger_id` を符号化して返却する',
      'エクスポートは一覧取得 API と同じ権限・絞り込み・公開カラムルールを適用し、`cursor` には依存せず検索条件一致全件を出力する'
    ) },
    @{ Type = 'Heading2'; Text = 'QR 直接遷移ルール' },
    @{ Type = 'Bullets'; Items = @(
      'QRラベルの遷移用URLは `facilityId` と `qrIdentifier` をクエリとして保持し、`GET /asset-detail/assets/by-qr` で資産詳細の対象を解決する',
      'QR識別子の一意性は施設単位のため、直接遷移解決では `facilityId` の指定を必須とする',
      'QRコードNo. の変更・再発行は QR発行・ラベル印刷 API の責務とし、資産詳細更新 API では扱わない'
    ) },
    @{ Type = 'Heading2'; Text = '競合制御と更新方針' },
    @{ Type = 'Bullets'; Items = @(
      '`PUT /asset-detail/assets/{assetId}` は `asset_ledgers.updated_at` を競合検知トークンとして `lastKnownUpdatedAt` を受け取る',
      '資産詳細更新は `identity` / `location` / `classification` / `specification` / `lifecycle` の責務別ペイロードで受け付ける',
      '分類更新は `classificationMode=LINKED` / `MANUAL` を明示し、`LINKED` 時は `ship_asset_master_id` を基準に分類正規値を再解決する',
      '施設名および QR識別子は別機能の正本責務とし、本 API の更新対象に含めない',
      '写真・ドキュメントの更新は `application_documents` を正本とし、`asset_photos` / `asset_documents` VIEW への DML は行わない',
      '写真追加時に `isPrimary=true` を指定した場合は、同一資産の既存 `ASSET_LEDGER` 写真の代表フラグを解除してから新写真を代表へ切り替える',
      '写真・ドキュメント削除は物理削除ではなく `application_documents.deleted_at` を更新する論理削除とする'
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
      @('1', '一覧画面コンテキスト取得', 'GET', '/asset-search-result/context', '対象施設、フィルタ候補、列定義、現在列設定、操作可否を取得する', '`original_list_view` + (`own_asset_list` or `other_asset_list`)'),
      @('2', '表示カラム設定保存', 'PUT', '/asset-search-result/column-settings', '現在の列表示/順序設定を保存する', '`original_list_view`'),
      @('3', 'named bookmark 一覧取得', 'GET', '/asset-search-result/column-bookmarks', '保存済み named bookmark 一覧を取得する', '`original_list_view`'),
      @('4', 'named bookmark 保存', 'POST', '/asset-search-result/column-bookmarks', '現在の列表示設定を named bookmark として保存する', '`original_list_view`'),
      @('5', 'named bookmark 削除', 'DELETE', '/asset-search-result/column-bookmarks/{bookmarkId}', '保存済み named bookmark を削除する', '`original_list_view`'),
      @('6', 'named bookmark 適用', 'POST', '/asset-search-result/column-bookmarks/{bookmarkId}/apply', '保存済み named bookmark を current settings へ適用する', '`original_list_view`'),
      @('7', '資産一覧取得', 'GET', '/asset-search-result/assets', '資産一覧を検索・絞り込み・ページング取得する', '`own_asset_list` or `other_asset_list`'),
      @('8', '一覧結果エクスポート', 'GET', '/asset-search-result/assets/export', '検索結果を Excel または PDF で出力する', '`own_asset_list` or `other_asset_list`'),
      @('9', 'QRコード直接遷移解決', 'GET', '/asset-detail/assets/by-qr', '施設IDとQR識別子から資産詳細対象を解決する', '`own_asset_list` or `other_asset_list`'),
      @('10', '資産詳細取得', 'GET', '/asset-detail/assets/{assetId}', '資産詳細、写真、QR 情報、任意カラム値を取得する', '`own_asset_list` or `other_asset_list`'),
      @('11', '資産履歴取得', 'GET', '/asset-detail/assets/{assetId}/history', '関連申請、点検結果、貸出/返却履歴を共通形式で取得する', '(`own_asset_list` + `own_data_history`) or (`other_asset_list` + `other_data_history`)'),
      @('12', '資産原本更新', 'PUT', '/asset-detail/assets/{assetId}', '自施設資産の原本情報を更新する', '`original_list_edit` + `own_asset_list`'),
      @('13', '資産写真追加', 'POST', '/asset-detail/assets/{assetId}/photos', '資産写真を追加する', '`original_list_edit` + `own_asset_list`'),
      @('14', '資産写真削除', 'DELETE', '/asset-detail/assets/{assetId}/photos/{photoId}', '資産写真を削除する', '`original_list_edit` + `own_asset_list`'),
      @('15', '資産ドキュメント一覧取得', 'GET', '/asset-detail/assets/{assetId}/documents', '登録済みドキュメント一覧を取得する', '`own_asset_list` or `other_asset_list`'),
      @('16', '資産ドキュメント追加', 'POST', '/asset-detail/assets/{assetId}/documents', '資産ドキュメントを追加する', '`original_list_edit` + `own_asset_list`'),
      @('17', '資産ドキュメント削除', 'DELETE', '/asset-detail/assets/{assetId}/documents/{documentId}', '資産ドキュメントを削除する', '`original_list_edit` + `own_asset_list`')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 資産検索・資産詳細機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '一覧画面コンテキスト取得（/asset-search-result/context）'
        Overview = '資産一覧画面の初期表示に必要な対象施設、フィルタ候補、列定義、現在列設定、操作可否を取得する。'
        Method = 'GET'
        Path = '/asset-search-result/context'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('targetFacilityId', 'query', 'int64', '-', '参照対象施設ID。未指定時は作業対象施設。異なる施設を指定した場合は他施設閲覧判定を行う')
        )
        PermissionLines = @(
          '認可条件: `original_list_view` が有効であること',
          '自施設対象時は `own_asset_list`、他施設対象時は `other_asset_list` が有効であること',
          '他施設対象時は、同一協業グループ所属と、公開元施設の `facility_external_view_settings(feature_code=other_asset_list)` を満たすこと'
        )
        ProcessingLines = @(
          'Bearer トークンから作業対象施設を解決し、`targetFacilityId` 未指定時はそれを参照対象にする',
          '閲覧可能施設一覧として、自施設と、協業グループおよび公開設定を満たす他施設を返却する',
          '参照対象施設の `asset_ledgers` を基準に、管理部署、設置部署、Category、大分類、中分類、品目の候補を取得する',
          '`ship_asset_master_custom_columns.is_active=true` の任意カラム定義を `sort_order ASC` で取得する',
          '`user_column_settings(screen_id=asset_search)` を読み込み、現在列設定へマージする。設定がない列は API 既定値を採用する',
          '`user_column_setting_presets(screen_id=asset_search)` を読み込み、named bookmark 一覧と既定 bookmark を解決する',
          '現在列設定が未保存で既定 bookmark が存在する場合は、その列構成を current settings として返却する',
          '価格カラムのロック状態は `original_price_column` と `own_price_column` / `other_price_column`、および他施設時は公開元施設の `facility_external_column_settings` を元に算出する',
          '`original_application` と `original_list_edit`、および `own_data_history` / `other_data_history` の実効有無から、申請起票導線、編集モード遷移、履歴タブ表示の可否フラグを返却する'
        )
        ResponseTitle = 'レスポンス（200：AssetSearchContextResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('actingFacility', 'FacilityContext', '✓', '作業対象施設'),
          @('targetFacility', 'FacilityContext', '✓', '現在参照中の施設'),
          @('accessibleFacilities', 'AccessibleFacility[]', '✓', '選択可能な施設一覧'),
          @('filterOptions', 'AssetSearchFilterOptions', '✓', '検索候補'),
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
              @('accessMode', 'string', '✓', '`OWN` / `EXTERNAL`')
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
              @('managementDepartments', 'FilterOption[]', '✓', '管理部署候補'),
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
              @('canOpenApplications', 'boolean', '✓', '申請起票ボタンを表示できるかどうか。外部閲覧時は常に `false`'),
              @('canEditAsset', 'boolean', '✓', '資産詳細で編集モードへ遷移できるかどうか'),
              @('canViewPrice', 'boolean', '✓', '価格系項目が返却対象かどうか'),
              @('canViewHistory', 'boolean', '✓', '資産履歴タブを表示できるかどうか'),
              @('targetIsExternal', 'boolean', '✓', '他施設閲覧かどうか')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'AssetSearchContextResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '画面閲覧権限なし、または参照対象施設に対するデータ閲覧権限なし', 'ErrorResponse'),
          @('404', '参照対象施設が存在しない、削除済み、または公開対象外', 'ErrorResponse'),
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
          @('columns', 'AssetSearchColumnSettingWriteModel[]', '✓', '保存対象の列設定一覧')
        )
        RequestSubtables = @(
          @{
            Title = 'columns要素（AssetSearchColumnSettingWriteModel）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $bookmarkWriteRows
          }
        )
        PermissionLines = @(
          '認可条件: `original_list_view` が有効であること'
        )
        ProcessingLines = @(
          '保存単位は `screen_id=asset_search` とする',
          '未知の固定列キー、無効化された任意カラム、`ship_asset_custom:` プレフィックス不正のキーは 400 とする',
          '受信した配列を画面の完全な現在状態として扱い、対象ユーザー・画面の既存 `user_column_settings` を置換更新する',
          '列設定そのものは保存できても、実際の一覧返却時には権限や公開設定により `isLocked=true` となりデータが返らない列があり得る'
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
          @('403', '画面閲覧権限なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'named bookmark 一覧取得（/asset-search-result/column-bookmarks）'
        Overview = '保存済み named bookmark 一覧を取得する。'
        Method = 'GET'
        Path = '/asset-search-result/column-bookmarks'
        Auth = '要（Bearer）'
        PermissionLines = @(
          '認可条件: `original_list_view` が有効であること'
        )
        ProcessingLines = @(
          '`user_column_setting_presets(screen_id=asset_search)` を対象ユーザーで取得する',
          '削除済み bookmark を除外し、`is_default DESC, updated_at DESC, user_column_setting_preset_id ASC` で返却する',
          'bookmark ごとの保存列数は `user_column_setting_preset_items` から算出する'
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
          @('403', '画面閲覧権限なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'named bookmark 保存（/asset-search-result/column-bookmarks）'
        Overview = '現在の列表示構成を named bookmark として保存する。'
        Method = 'POST'
        Path = '/asset-search-result/column-bookmarks'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('bookmarkName', 'string', '✓', 'ブックマーク名'),
          @('isDefault', 'boolean', '-', '既定 bookmark として保存するかどうか。未指定時は `false`'),
          @('columns', 'AssetSearchColumnSettingWriteModel[]', '✓', '保存対象の列設定一覧')
        )
        RequestSubtables = @(
          @{
            Title = 'columns要素（AssetSearchColumnSettingWriteModel）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $bookmarkWriteRows
          }
        )
        PermissionLines = @(
          '認可条件: `original_list_view` が有効であること'
        )
        ProcessingLines = @(
          '保存単位は `screen_id=asset_search` とする',
          '対象ユーザー・画面内で同名の未削除 bookmark が存在する場合は 409 (`BOOKMARK_NAME_DUPLICATED`) を返却する',
          '未知の固定列キー、無効化された任意カラム、`ship_asset_custom:` プレフィックス不正のキーは 400 とする',
          '`isDefault=true` の場合は同一ユーザー・同一画面の既存既定 bookmark を解除してから保存する',
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
          @('403', '画面閲覧権限なし', 'ErrorResponse'),
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
        PermissionLines = @(
          '認可条件: `original_list_view` が有効であること'
        )
        ProcessingLines = @(
          '対象 bookmark が対象ユーザー・`screen_id=asset_search` に属することを確認する',
          '`user_column_setting_presets.deleted_at` を更新して論理削除する',
          '削除対象が既定 bookmark だった場合は既定設定を解除する'
        )
        ResponseTitle = 'レスポンス（204）'
        ResponseLines = @(
          '本文なし（204 No Content）'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '画面閲覧権限なし', 'ErrorResponse'),
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
        PermissionLines = @(
          '認可条件: `original_list_view` が有効であること'
        )
        ProcessingLines = @(
          '対象 bookmark が対象ユーザー・`screen_id=asset_search` に属することを確認する',
          '`user_column_setting_preset_items` を current settings として `user_column_settings(screen_id=asset_search)` へ置換反映する',
          '適用後の列定義に対し、権限や公開設定に起因する `isLocked` を再計算して返却する'
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
          @('403', '画面閲覧権限なし', 'ErrorResponse'),
          @('404', 'bookmark が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産一覧取得（/asset-search-result/assets）'
        Overview = '参照対象施設の資産一覧を検索・絞り込み取得する。権限や公開設定で許可されていない項目は返却しない。'
        Method = 'GET'
        Path = '/asset-search-result/assets'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('targetFacilityId', 'query', 'int64', '-', '参照対象施設ID。未指定時は作業対象施設'),
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
        PermissionLines = @(
          '自施設対象時の認可条件: `own_asset_list` が有効であること',
          '他施設対象時の認可条件: `other_asset_list` が有効であり、同一協業グループ所属と公開元施設の公開設定を満たすこと',
          '価格項目を返す場合は、さらに `original_price_column` と `own_price_column` / `other_price_column` を満たすこと'
        )
        ProcessingLines = @(
          '参照対象施設を解決し、自施設/他施設の別に応じた認可判定を行う',
          '`asset_ledgers` を基準に `facilities`、`qr_codes`、`ship_asset_masters`、`ship_asset_master_custom_values`、代表写真用 `asset_photos` を結合する',
          '`managementDepartmentName` は `asset_ledgers.management_department_name` をそのまま候補・検索・返却に使用する',
          '検索条件は AND 条件で適用し、キーワードは識別情報・名称・設置場所・任意カラム値を対象に部分一致で評価する',
          '`cursor` 指定時は `asset_ledger_id ASC` の続き位置から取得し、`pageSize` 件を上限に返却する',
          '取得価格を含む価格系項目は、権限を満たさない場合レスポンスから完全に除外する',
          '任意カラム定義は有効列のみを返し、各資産行には `customValues` を `columnKey` 単位で格納する'
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
              @('accessMode', 'string', '✓', '`OWN` / `EXTERNAL`')
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
          },
          @{
            Title = 'customValues要素（AssetCustomValue）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $customValueRows
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'AssetSearchResultResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象施設に対するデータ閲覧権限なし、または公開条件未達', 'ErrorResponse'),
          @('404', '参照対象施設が存在しない、削除済み、または公開対象外', 'ErrorResponse'),
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
          @('targetFacilityId', 'query', 'int64', '-', '参照対象施設ID。未指定時は作業対象施設'),
          @('managementDepartmentName', 'query', 'string', '-', '管理部署の部分一致条件'),
          @('installedDepartmentName', 'query', 'string', '-', '設置部署名の部分一致条件'),
          @('categoryId', 'query', 'int64', '-', 'Category ID'),
          @('largeClassName', 'query', 'string', '-', '大分類名'),
          @('mediumClassName', 'query', 'string', '-', '中分類名'),
          @('assetItemId', 'query', 'int64', '-', '品目ID'),
          @('keyword', 'query', 'string', '-', 'キーワード検索'),
          @('format', 'query', 'string', '✓', '`xlsx` または `pdf`')
        )
        PermissionLines = @(
          '認可条件は一覧取得 API と同一とする'
        )
        ProcessingLines = @(
          '一覧取得 API と同一の認可、公開設定、絞り込み、価格マスクルールを適用する',
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
          @('400', '不正な出力形式または検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象施設に対するデータ閲覧権限なし、または公開条件未達', 'ErrorResponse'),
          @('404', '参照対象施設が存在しない、削除済み、または公開対象外', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'QRコード直接遷移解決（/asset-detail/assets/by-qr）'
        Overview = '施設IDとQR識別子から資産詳細画面の対象資産を解決する。'
        Method = 'GET'
        Path = '/asset-detail/assets/by-qr'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('facilityId', 'query', 'int64', '✓', 'QRコードが属する施設ID'),
          @('qrIdentifier', 'query', 'string', '✓', 'QR識別子')
        )
        PermissionLines = @(
          '自施設対象時の認可条件: `own_asset_list` が有効であること',
          '他施設対象時の認可条件: `other_asset_list` が有効であり、同一協業グループ所属と公開元施設の公開設定を満たすこと'
        )
        ProcessingLines = @(
          '`qr_codes` から `(facility_id, qr_identifier)` で対象 QR を解決する',
          '対象 QR に `asset_ledger_id` が紐づき、対応する `asset_ledgers` が存在することを確認する',
          '解決した資産について資産詳細取得 API と同じ施設公開・閲覧権限を再判定する',
          '成功時はフロントエンドが `GET /asset-detail/assets/{assetId}` を呼び出せるよう、資産ID と targetFacility を返却する'
        )
        ResponseTitle = 'レスポンス（200：AssetByQrResolveResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('assetId', 'int64', '✓', '資産台帳ID'),
          @('qrCodeId', 'int64', '✓', 'QRコードID'),
          @('targetFacility', 'FacilityContext', '✓', '詳細表示対象施設'),
          @('detailPath', 'string', '✓', '詳細画面遷移用パス')
        )
        ResponseSubtables = @(
          @{
            Title = 'targetFacility要素（FacilityContext）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '施設ID'),
              @('facilityName', 'string', '✓', '施設名'),
              @('accessMode', 'string', '✓', '`OWN` / `EXTERNAL`')
            )
          }
        )
        StatusRows = @(
          @('200', '解決成功', 'AssetByQrResolveResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象施設に対するデータ閲覧権限なし、または公開条件未達', 'ErrorResponse'),
          @('404', 'QRコードまたは資産が存在しない、または公開対象外', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産詳細取得（/asset-detail/assets/{assetId}）'
        Overview = '指定した資産の詳細情報、写真一覧、QR情報、任意カラム値を取得する。'
        Method = 'GET'
        Path = '/asset-detail/assets/{assetId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('assetId', 'path', 'int64', '✓', '資産台帳ID'),
          @('targetFacilityId', 'query', 'int64', '-', '参照対象施設ID。未指定時は作業対象施設')
        )
        PermissionLines = @(
          '自施設対象時の認可条件: `own_asset_list` が有効であること',
          '他施設対象時の認可条件: `other_asset_list` が有効であり、同一協業グループ所属と公開元施設の公開設定を満たすこと',
          '編集可否フラグは `original_list_edit` の有効有無と、対象が自施設かどうかで決定する'
        )
        ProcessingLines = @(
          '対象 `assetId` の `asset_ledgers` を取得し、参照対象施設との整合を確認する',
          '`qr_codes` から現在有効な QR 情報を取得する',
          '`asset_photos` から表示対象写真一覧を取得し、代表写真フラグ順・登録順で返却する',
          '`ship_asset_master_custom_columns` / `ship_asset_master_custom_values` から任意カラムを取得する',
          '価格項目は一覧と同じ権限条件を満たさない場合は返却しない',
          '`own_data_history` / `other_data_history` の実効有無から履歴タブ表示可否を算出する'
        )
        ExtraSections = @(
          @{
            Title = '直接遷移補足'
            Lines = @(
              'QRコード遷移URLで詳細画面を開く場合は、事前に `GET /asset-detail/assets/by-qr` で `assetId` を解決してから本 API を呼び出す',
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
            Title = 'customValues要素（AssetCustomValue）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $customValueRows
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
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象施設に対するデータ閲覧権限なし、または公開条件未達', 'ErrorResponse'),
          @('404', '資産が存在しない、対象施設不一致、または公開対象外', 'ErrorResponse'),
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
          @('targetFacilityId', 'query', 'int64', '-', '参照対象施設ID。未指定時は作業対象施設'),
          @('cursor', 'query', 'string', '-', '既定ソート順の続き位置を表す continuation token'),
          @('pageSize', 'query', 'int32', '-', '取得件数。`1-500`、既定値 `100`')
        )
        PermissionLines = @(
          '自施設対象時の認可条件: `own_asset_list` と `own_data_history` の両方が有効であること',
          '他施設対象時の認可条件: `other_asset_list` と `other_data_history` が有効であり、同一協業グループ所属と公開元施設の公開設定を満たすこと'
        )
        ProcessingLines = @(
          '対象資産の参照可否を資産詳細取得 API と同条件で判定する',
          '`application_assets`、`applications`、`application_status_histories` から資産関連申請の状態履歴を取得する',
          '`inspection_tasks`、`inspection_results` から資産関連点検結果を取得する',
          '`lending_devices`、`lending_transactions` から貸出/返却履歴を取得する',
          '各履歴を共通イベント形式へ正規化し、`occurredAt DESC, eventId DESC` で並べ替える',
          '`cursor` 指定時は続き位置から取得し、`pageSize` 件を上限に返却する'
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
          @('403', '履歴閲覧権限なし、または公開条件未達', 'ErrorResponse'),
          @('404', '資産が存在しない、対象施設不一致、または公開対象外', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産原本更新（/asset-detail/assets/{assetId}）'
        Overview = '自施設資産の原本情報を更新する。識別・管理情報、設置情報、分類情報、仕様情報、ライフサイクル情報を責務別ペイロードで受け付ける。'
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
              @('managementDepartmentName', 'string', '-', '資産管理部署')
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
        PermissionLines = @(
          '認可条件: `original_list_edit` と `own_asset_list` の両方が有効であること',
          '他施設資産は更新不可とし 403 を返却する',
          '取得価格を更新する場合は `original_price_column` と `own_price_column` も有効であること'
        )
        ProcessingLines = @(
          '対象資産が作業対象施設に属することを確認する',
          '`lastKnownUpdatedAt` と現行 `asset_ledgers.updated_at` を比較し、差異があれば 409 (`ASSET_CONFLICT`) を返却する',
          '`facilityLocationId` が指定された場合は、同一施設の有効ロケーションであることを確認する',
          '`identity.assetNo` と `identity.managementDepartmentName` は `asset_ledgers` 正本へ更新する',
          '`classification.classificationMode=LINKED` の場合は `shipAssetMasterId` を必須とし、参照先 SHIP資産マスタから Category〜型式の正規値を再解決する。リクエスト側の分類値が指定されていて不一致な場合は 409 (`ASSET_MASTER_MISMATCH`) を返却する',
          '`classification.classificationMode=MANUAL` の場合は `ship_asset_master_id` を `NULL` へ更新し、`categoryId` を必須として分類値を直接保存する',
          '任意カラム値は SHIP資産マスタ正本のため更新対象に含めない',
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
          },
          @{
            Title = 'customValues要素（AssetCustomValue）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $customValueRows
          }
        )
        StatusRows = @(
          @('200', '更新成功', 'AssetDetailUpdateResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '編集権限なし、価格更新権限なし、または他施設資産', 'ErrorResponse'),
          @('404', '資産が存在しない、または対象施設不一致', 'ErrorResponse'),
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
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('photos', 'AssetPhotoCreateModel[]', '✓', '追加写真一覧')
        )
        RequestSubtables = @(
          @{
            Title = 'photos要素（AssetPhotoCreateModel）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('fileName', 'string', '✓', '表示用ファイル名'),
              @('contentType', 'string', '✓', 'MIME Type'),
              @('fileBodyBase64', 'string', '✓', '写真本文の base64'),
              @('takenAt', 'datetime', '-', '撮影日時'),
              @('isPrimary', 'boolean', '-', '代表写真指定')
            )
          }
        )
        PermissionLines = @(
          '認可条件: `original_list_edit` と `own_asset_list` の両方が有効であること'
        )
        ProcessingLines = @(
          '対象資産が作業対象施設に属することを確認する',
          '`application_documents` へ `owner_type=ASSET_LEDGER`、`document_category=PHOTO` として保存する',
          '`isPrimary=true` の写真が含まれる場合は既存代表写真を解除し、新規写真を代表へ切り替える',
          '返却値は `asset_photos` VIEW 互換の写真一覧要素とする'
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
          @('403', '編集権限なし、または他施設資産', 'ErrorResponse'),
          @('404', '資産が存在しない、または対象施設不一致', 'ErrorResponse'),
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
        PermissionLines = @(
          '認可条件: `original_list_edit` と `own_asset_list` の両方が有効であること'
        )
        ProcessingLines = @(
          '対象写真が `application_documents(owner_type=ASSET_LEDGER, document_category=PHOTO)` に存在し、対象資産へ紐づくことを確認する',
          '`application_documents.deleted_at` を更新して論理削除する',
          '削除対象が代表写真だった場合は、残存する `ASSET_LEDGER` 写真から代表を再選定する'
        )
        ResponseTitle = 'レスポンス（204）'
        ResponseLines = @(
          '本文なし（204 No Content）'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '編集権限なし、または他施設資産', 'ErrorResponse'),
          @('404', '資産または写真が存在しない、または対象施設不一致', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産ドキュメント一覧取得（/asset-detail/assets/{assetId}/documents）'
        Overview = '指定資産に紐づく登録ドキュメント一覧を取得する。'
        Method = 'GET'
        Path = '/asset-detail/assets/{assetId}/documents'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('assetId', 'path', 'int64', '✓', '資産台帳ID'),
          @('targetFacilityId', 'query', 'int64', '-', '参照対象施設ID。未指定時は作業対象施設')
        )
        PermissionLines = @(
          '認可条件は資産詳細取得 API と同一とする'
        )
        ProcessingLines = @(
          '対象資産の参照可否を資産詳細取得 API と同条件で判定する',
          '`asset_documents` VIEW から `owner_type=ASSET_LEDGER` のドキュメント一覧を取得する',
          'ファイル実体URLはアプリケーションの認可済みダウンロードURLとして返却する'
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
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象施設に対するデータ閲覧権限なし、または公開条件未達', 'ErrorResponse'),
          @('404', '資産が存在しない、または対象施設不一致', 'ErrorResponse'),
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
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('documentType', 'string', '✓', 'ドキュメント種別'),
          @('title', 'string', '-', '表示タイトル'),
          @('documentDate', 'date', '-', '文書日付'),
          @('fileName', 'string', '✓', '表示用ファイル名'),
          @('contentType', 'string', '✓', 'MIME Type'),
          @('fileBodyBase64', 'string', '✓', 'ファイル本文の base64')
        )
        PermissionLines = @(
          '認可条件: `original_list_edit` と `own_asset_list` の両方が有効であること'
        )
        ProcessingLines = @(
          '対象資産が作業対象施設に属することを確認する',
          '`application_documents` へ `owner_type=ASSET_LEDGER`、`document_category` は PHOTO 以外の業務文書として保存する',
          '`asset_documents` VIEW 互換で参照できる状態へ反映する'
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
          @('403', '編集権限なし、または他施設資産', 'ErrorResponse'),
          @('404', '資産が存在しない、または対象施設不一致', 'ErrorResponse'),
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
        PermissionLines = @(
          '認可条件: `original_list_edit` と `own_asset_list` の両方が有効であること'
        )
        ProcessingLines = @(
          '対象ドキュメントが `application_documents(owner_type=ASSET_LEDGER, document_category<>PHOTO)` に存在し、対象資産へ紐づくことを確認する',
          '`application_documents.deleted_at` を更新して論理削除する'
        )
        ResponseTitle = 'レスポンス（204）'
        ResponseLines = @(
          '本文なし（204 No Content）'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '編集権限なし、または他施設資産', 'ErrorResponse'),
          @('404', '資産またはドキュメントが存在しない、または対象施設不一致', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '利用モード別マトリクス' },
    @{ Type = 'Table'; Headers = @('項目', '自施設閲覧', '他施設閲覧'); Rows = @(
      @('一覧取得', '`own_asset_list`', '`other_asset_list` + 協業グループ + 公開元施設公開設定'),
      @('価格項目表示', '`original_price_column` + `own_price_column`', '`original_price_column` + `other_price_column` + 公開元施設価格公開設定'),
      @('申請起票ボタン表示', '`original_application` に従う', '常に不可'),
      @('資産詳細表示', '可', '可'),
      @('資産履歴表示', '`own_data_history` + `own_asset_list`', '`other_data_history` + `other_asset_list` + 協業グループ + 公開元施設公開設定'),
      @('原本編集 / 写真 / ドキュメント更新', '`original_list_edit` があれば可', '不可')
    ) },
    @{ Type = 'Heading2'; Text = '列と任意カラムの扱い' },
    @{ Type = 'Bullets'; Items = @(
      '固定列のラベル変更やグループ変更は API 契約変更として扱う',
      '任意カラムは `ship_asset_master_custom_columns.is_active=true` の列だけを返却し、無効列の既存値は保持しても新規一覧候補へは出さない',
      '価格列は保存済み列設定に含まれていても、権限や公開設定を満たさない場合は `isLocked=true` とし、値も返却しない',
      'named bookmark は current settings とは別に `user_column_setting_presets` / `user_column_setting_preset_items` で管理する',
      '既定 bookmark は `screen_id` 単位で 0..1 件とし、current settings 未保存時の初期表示へ適用する'
    ) },
    @{ Type = 'Heading2'; Text = 'QR・写真・ドキュメント方針' },
    @{ Type = 'Bullets'; Items = @(
      'QR情報は `qr_codes` 正本から参照し、資産詳細取得レスポンスへ含める',
      'QRラベル遷移URLは `facilityId` と `qrIdentifier` を含め、詳細画面では resolve-by-qr API で `assetId` を解決する',
      '資産写真・資産ドキュメントの正本更新先は `application_documents` とし、互換VIEWへ直接書き込まない',
      '写真代表判定は `ASSET_LEDGER` 写真を優先し、調査写真の投影ロジックは `asset_photos` VIEW の定義に従う',
      'ドキュメント一覧取得は `owner_type=ASSET_LEDGER` を対象とし、申請・RFQ・見積の添付は本 API の対象外'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', '主な発生API', '説明'); Rows = @(
      @('ASSET_VIEW_FORBIDDEN', '一覧/詳細参照系', '対象施設に対するデータ閲覧権限がない'),
      @('ASSET_EXTERNAL_VIEW_FORBIDDEN', '一覧/詳細参照系', '他施設閲覧の協業グループまたは公開設定条件を満たさない'),
      @('ASSET_HISTORY_FORBIDDEN', '資産履歴取得', '対象施設に対する履歴閲覧権限がない'),
      @('ASSET_NOT_FOUND', '一覧/詳細/更新/写真/ドキュメント系', '対象資産が存在しない、対象施設不一致、または公開対象外'),
      @('ASSET_QR_NOT_FOUND', 'QRコード直接遷移解決', '指定した施設IDとQR識別子に対応する資産が存在しない'),
      @('ASSET_CONFLICT', '資産原本更新', '取得後に `asset_ledgers.updated_at` が更新され競合した'),
      @('ASSET_MASTER_MISMATCH', '資産原本更新', '`classificationMode=LINKED` の要求内容が参照先 SHIP資産マスタと整合しない'),
      @('COLUMN_SETTING_INVALID', '表示カラム設定保存', '未知の列キーや無効な任意カラムが指定された'),
      @('BOOKMARK_NAME_DUPLICATED', 'named bookmark 保存', '同一ユーザー・同一画面に同名 bookmark が存在する'),
      @('BOOKMARK_NOT_FOUND', 'named bookmark 削除 / 適用', '指定した bookmark が存在しない、または対象ユーザーに属さない'),
      @('PRICE_COLUMN_FORBIDDEN', '一覧/詳細/更新', '価格項目の参照または更新権限がない'),
      @('PHOTO_NOT_FOUND', '資産写真削除', '対象写真が存在しない、または対象資産へ紐づかない'),
      @('DOCUMENT_NOT_FOUND', '資産ドキュメント削除', '対象ドキュメントが存在しない、または対象資産へ紐づかない')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・前提事項' },
    @{ Type = 'Heading2'; Text = '本版で明示した前提' },
    @{ Type = 'Bullets'; Items = @(
      '資産一覧と資産詳細は `taniguchi/api/API設計書_一覧.md` の機能粒度に合わせて1冊に統合する',
      '一覧起点の各種申請 API は別設計書で扱い、本書では表示可否と参照対象返却までを対象とする',
      'named bookmark は current settings と分離し、`user_column_setting_presets` / `user_column_setting_preset_items` を追加してサーバー永続化する',
      '管理部署は `asset_ledgers.management_department_name` を検索・表示・更新の正本とする',
      'QRコード直接遷移は `facilityId` + `qrIdentifier` を入力とし、resolve-by-qr API を経由して詳細画面へ入る',
      '分類更新は `classificationMode=LINKED` / `MANUAL` を明示し、SHIP資産マスタ再紐付けと手動管理切替の両方を許容する'
    ) },
    @{ Type = 'Heading2'; Text = '今後の運用設計で整理する事項' },
    @{ Type = 'Table'; Headers = @('論点', '現状の扱い', '今後の整理方針'); Rows = @(
      @('一覧 export の大規模件数対応', '現時点では同期出力を継続する', '件数・処理時間の実測に応じて非同期ジョブ化とダウンロード通知を追加検討する'),
      @('履歴ソースの拡張', '本版では申請履歴、点検結果、貸出/返却履歴を対象とする', '修理、保守契約、棚卸などを表示対象へ追加する場合は `eventType` を追加して同一 I/F を拡張する')
    ) }
  )
}
