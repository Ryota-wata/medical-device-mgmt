$ShipAssetMasterFixedDetailRows = @(
  @('pharmaceuticalAffairs', 'string', '✓', '薬事'),
  @('drawingNo', 'string', '✓', '図面No.'),
  @('layoutReflection', 'string', '✓', 'レイアウト反映'),
  @('specialEquipment', 'string', '✓', '特殊設備'),
  @('masterStandardDrawing', 'string', '✓', 'Master標準図'),
  @('widthValue', 'string', '✓', '幅(W)'),
  @('depthValue', 'string', '✓', '奥行(D)'),
  @('heightValue', 'string', '✓', '高さ(H)'),
  @('powerConnection', 'string', '✓', '電源接続'),
  @('powerType', 'string', '✓', '電源種別'),
  @('powerConsumption', 'string', '✓', '消費電力'),
  @('waterSupplySize', 'string', '✓', '給水'),
  @('hotWaterSize', 'string', '✓', '給湯'),
  @('drainageSize', 'string', '✓', '排水'),
  @('exhaustSize', 'string', '✓', '排気サイズ'),
  @('exhaustVolume', 'string', '✓', '排気風量'),
  @('steamSize', 'string', '✓', '蒸気'),
  @('gas', 'string', '✓', 'ガス'),
  @('weightKg', 'string', '✓', '重量(kg)'),
  @('reinforcement', 'string', '✓', '補強'),
  @('mountAnchor', 'string', '✓', '架台・アンカー'),
  @('floorLowering', 'string', '✓', '床下げ'),
  @('equipmentRemarks', 'string', '✓', '設備備考'),
  @('legalServiceLife', 'string', '✓', '耐用年数(法定)'),
  @('serviceLifePeriod', 'string', '✓', '耐用期間'),
  @('endOfSales', 'string', '✓', 'EOS:販売終了'),
  @('endOfMaintenance', 'string', '✓', 'EOS:メンテ終了'),
  @('dedicatedConsumables', 'string', '✓', '専用消耗品'),
  @('catalogDocument', 'string', '✓', 'カタログ'),
  @('operationManual', 'string', '✓', '操作マニュアル'),
  @('otherPdf', 'string', '✓', 'その他PDF'),
  @('pmdaClassNotification', 'string', '✓', 'クラス分類告示'),
  @('pmdaMaintenanceNotification', 'string', '✓', '特定保守告示'),
  @('pmdaInstallNotification', 'string', '✓', '設置管理告示'),
  @('pmdaClassCode', 'string', '✓', '類別コード(PMDA)'),
  @('pmdaClassName', 'string', '✓', '類別名称(PMDA)'),
  @('pmdaMiddleClassName', 'string', '✓', '中分類名(PMDA)'),
  @('pmdaCode', 'string', '✓', 'コード(PMDA)'),
  @('pmdaGeneralName', 'string', '✓', '一般的名称(PMDA)'),
  @('pmdaGeneralNameDefinition', 'string', '✓', '一般的名称定義'),
  @('pmdaClassification', 'string', '✓', 'クラス分類'),
  @('pmdaGhtfRule', 'string', '✓', 'GHTFルール'),
  @('pmdaSpecificMaintenance', 'string', '✓', '特定保守'),
  @('pmdaInstallManagement', 'string', '✓', '設置管理'),
  @('pmdaRepairCategory', 'string', '✓', '修理区分'),
  @('pmdaQms316', 'string', '✓', 'QMS告示316号'),
  @('pmdaOldGeneralNameCode', 'string', '✓', '旧一般的名称コード'),
  @('pmdaOldGeneralName', 'string', '✓', '旧一般的名称'),
  @('pmdaOldClassification', 'string', '✓', '旧クラス分類'),
  @('pmdaOldRepairType', 'string', '✓', '旧修理種別'),
  @('pmdaRevisionCount', 'string', '✓', '改正回数'),
  @('pmdaLastUpdatedOn', 'date', '✓', '最終更新日'),
  @('registrationStatus', 'string', '✓', '登録状況')
)

$ShipAssetMasterSummaryRows = @(
  @('shipAssetMasterId', 'int64', '✓', '資産マスタID'),
  @('categoryId', 'int64', '✓', 'Category ID'),
  @('categoryName', 'string', '✓', 'Category 名'),
  @('largeClassId', 'int64', '✓', '大分類 ID'),
  @('largeClassName', 'string', '✓', '大分類名'),
  @('mediumClassId', 'int64', '✓', '中分類 ID'),
  @('mediumClassName', 'string', '✓', '中分類名'),
  @('detailType', 'string', '✓', '明細区分'),
  @('assetItemId', 'int64', '✓', '品目 ID'),
  @('assetItemName', 'string', '✓', '品目名'),
  @('manufacturerId', 'int64', '✓', 'メーカー ID'),
  @('manufacturerName', 'string', '✓', 'メーカー名'),
  @('modelId', 'int64', '✓', '型式 ID'),
  @('modelName', 'string', '✓', '型式名'),
  @('jmdnRegisteredItemId', 'int64', '✓', 'JMDN登録品目 ID'),
  @('classCode', 'string', '✓', '類別コード'),
  @('className', 'string', '✓', '類別名称'),
  @('jmdnMediumClassificationName', 'string', '✓', 'JMDN中分類名'),
  @('generalName', 'string', '✓', '一般的名称'),
  @('jmdnCode', 'string', '✓', 'JMDNコード'),
  @('marketingName', 'string', '✓', '販売名'),
  @('marketingAuthorizationHolderName', 'string', '✓', '製造販売業者等'),
  @('attachmentDocumentFileName', 'string', '✓', 'JMDN登録品目に紐づく添付文書ファイル名'),
  @('attachmentDocumentUrl', 'string', '✓', 'JMDN登録品目に紐づく添付文書 URL'),
  @('fixedDetails', 'ShipAssetMasterFixedDetails', '✓', '薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況の固定属性。全項目必須'),
  @('createdAt', 'datetime', '✓', '作成日時'),
  @('updatedAt', 'datetime', '✓', '更新日時')
)

@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_SHIP資産マスタ.docx'
  ScreenLabel = 'SHIP資産マスタ'
  CoverDateText = '2026年4月26日'
  RevisionDateText = '2026/4/26'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、SHIP資産マスタ画面（`/ship-asset-master`）で利用する API の設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      'SHIP資産マスタ一覧参照、絞り込み、エクスポート、テンプレートダウンロード、インポート I/F',
      'Category / 大分類 / 中分類 / 明細区分 / 品目 / メーカー / 型式の組み合わせ解決と、必要に応じた分割マスタ自動作成ルール',
      'JMDN登録品目の検索・選択、および該当なし時の JMDN分類・一般的名称 / JMDN登録品目 新規作成ルール',
      '薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況の固定属性を `ship_asset_master_details` に保持するルール',
      '権限、バリデーション、論理削除、エラーレスポンス'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = 'SHIP資産マスタは、Category / 大分類 / 中分類 / 明細区分 / 品目 / メーカー / 型式の組み合わせを管理する共通マスタであり、資産一覧、資産詳細、編集リスト、Data Link の参照元となる。' },
    @{ Type = 'Paragraph'; Text = '本機能では、組み合わせ本体を `ship_asset_masters`、薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況の固定属性を `ship_asset_master_details`、JMDN の正本を `jmdn_classifications` / `jmdn_registered_items` で管理する。資産マスタ選択画面（`/asset-master`）の API は別設計書で扱い、本書には含めない。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('SHIP資産マスタ', 'Category / 大分類 / 中分類 / 明細区分 / 品目 / メーカー / 型式の組み合わせを 1 件で表す共通マスタ。実体は `ship_asset_masters`'),
      @('資産マスタID', '`ship_asset_masters.ship_asset_master_id`。画面表示と下流参照で共通に利用する識別子'),
      @('JMDN分類・一般的名称', '類別コード / 類別名称 / JMDN中分類名 / 一般的名称 / JMDNコードを保持する共有マスタ。実体は `jmdn_classifications`'),
      @('JMDN登録品目', '販売名 / 製造販売業者等 / 添付文書ファイル名 / 添付文書URLを保持する共有マスタ。SHIP資産マスタは本 ID を必須参照する'),
      @('固定属性', 'SHIP資産マスタ一覧固定カラムのうち、薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況に属する必須入力項目。実体は `ship_asset_master_details`'),
      @('追加インポート', 'プレビュー済み行を既存データへ追加・更新する取込モード'),
      @('置換インポート', 'プレビュー済み行を追加・更新し、ファイルに含まれない有効資産マスタを論理削除する取込モード')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面URL', '利用目的'); Rows = @(
      @('17. SHIP資産マスタ画面', '/ship-asset-master', 'SHIP資産マスタ一覧参照、作成、更新、削除、エクスポート、インポートを行う')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'APIの位置づけ' },
    @{ Type = 'Paragraph'; Text = '本 API 群は、SHIP資産マスタ画面の一覧参照、登録、更新、削除、Excel 入出力を提供する。' },
    @{ Type = 'Heading2'; Text = '画面とAPIの関係' },
    @{ Type = 'Numbered'; Items = @(
      '画面初期表示およびフィルタ変更時に `GET /ship-asset-master/assets` を呼び出し、一覧件数・固定列・JMDN参照列を取得する',
      'エクスポート押下時に `GET /ship-asset-master/assets/export` を呼び出し、現在の絞り込み結果を Excel 出力する',
      'テンプレートダウンロード押下時に `GET /ship-asset-master/assets/template` を呼び出し、取込用テンプレートを取得する',
      'インポートファイル選択時に `POST /ship-asset-master/assets/import-preview` を呼び出してプレビューを作成し、追加インポートまたは置換インポート確定時に `POST /ship-asset-master/assets/import` を呼び出す',
      'JMDN検索モーダルで既存候補を検索する際に `GET /ship-asset-master/jmdn-registered-items` を呼び出す',
      'JMDN作成モーダルの保存時に `POST /ship-asset-master/jmdn-registered-items` を呼び出し、JMDN分類・一般的名称 / JMDN登録品目を再利用または新規作成した結果を受け取る',
      '新規作成モーダルの登録押下時に `POST /ship-asset-master/assets` を呼び出す',
      '編集モーダルの更新押下時に `PUT /ship-asset-master/assets/{shipAssetMasterId}` を呼び出す',
      '削除確認モーダルの OK 押下時に `DELETE /ship-asset-master/assets/{shipAssetMasterId}` を呼び出す'
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル', '利用種別', '用途'); Rows = @(
      @('asset_categories', 'READ', 'Category 候補解決'),
      @('asset_large_classes', 'READ / CREATE / UPDATE', '大分類候補解決と未登録時の新規作成'),
      @('asset_medium_classes', 'READ / CREATE / UPDATE', '中分類候補解決と未登録時の新規作成'),
      @('asset_items', 'READ / CREATE / UPDATE', '品目候補解決と未登録時の新規作成'),
      @('manufacturers', 'READ / CREATE / UPDATE', 'メーカー候補解決と未登録時の新規作成'),
      @('models', 'READ / CREATE / UPDATE', '型式候補解決と未登録時の新規作成'),
      @('ship_asset_masters', 'READ / CREATE / UPDATE / DELETE', 'SHIP資産マスタ本体の一覧、登録、更新、論理削除'),
      @('ship_asset_master_details', 'READ / CREATE / UPDATE', '薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況の固定属性'),
      @('jmdn_classifications', 'READ / CREATE', '類別コード、類別名称、JMDN中分類名、一般的名称、JMDNコードの解決と未登録時の新規作成'),
      @('jmdn_registered_items', 'READ / CREATE', 'JMDN登録品目検索、販売名、製造販売業者等、添付文書ファイル名、添付文書URLの解決と未登録時の新規作成'),
      @('facilities', 'READ', '作業対象施設の存在確認、論理削除判定、共有システム管理者アカウントの未削除施設判定に使用する'),
      @('users', 'READ', '共有システム管理者アカウント判定、監査記録の実行ユーザー解決に使用する'),
      @('user_facility_assignments', 'READ', '通常アカウントの作業対象施設割当を判定する'),
      @('facility_feature_settings', 'READ', '通常アカウントの作業対象施設における `asset_master_list` / `asset_master_edit` 提供有無を判定する'),
      @('user_facility_feature_settings', 'READ', '通常アカウントのユーザー施設別 `asset_master_list` / `asset_master_edit` 有効有無を判定する')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON（Excel ファイル応答を除く）',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-04-18T00:00:00Z`）',
      '一覧系 API にページングは設けず、絞り込み後の全件と表示件数を返却する',
      '`GET /ship-asset-master/assets` は `ship_asset_masters.is_active=true` の有効データのみ返却する',
      '`ship_asset_master_id` を資産マスタIDとして利用し、作成時はサーバー側で採番する',
      '共有システム管理者アカウントは、作業対象施設が未削除である限り通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による認可判定をバイパスする'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '本API群で使用する `feature_code` は以下の通りとする。通常アカウントでは、Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）では、作業対象施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず、`asset_master_list` / `asset_master_edit` を有効として扱う。画面表示用の `/auth/context` は UX 用キャッシュとして扱い、各業務 API でも同条件を再判定する。' },
    @{ Type = 'Table'; Headers = @('管理単位名', '種別', 'コード', '対象処理'); Rows = @(
      @('資産マスタ / 一覧', 'feature_code', '`asset_master_list`', '一覧取得、エクスポート'),
      @('資産マスタ / 新規作成・編集', 'feature_code', '`asset_master_edit`', 'テンプレート取得、インポートプレビュー、インポート、JMDN検索、JMDN作成、新規作成、更新、削除')
    ) },
    @{ Type = 'Table'; Headers = @('処理', '必要コード', '判定テーブル', '説明'); Rows = @(
      @('一覧取得 / エクスポート', '`asset_master_list`', '通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`。共有システム管理者: `users`, `facilities`', 'SHIP資産マスタ一覧参照'),
      @('テンプレート取得 / インポートプレビュー / インポート', '`asset_master_edit`', '通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`。共有システム管理者: `users`, `facilities`', '資産マスタ一括更新処理'),
      @('JMDN登録品目検索 / JMDN作成', '`asset_master_edit`', '通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`。共有システム管理者: `users`, `facilities`', '資産マスタ編集モーダル内の JMDN 選択/作成処理'),
      @('新規作成 / 更新 / 削除', '`asset_master_edit`', '通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`。共有システム管理者: `users`, `facilities`', '資産マスタ変更系処理')
    ) },
    @{ Type = 'Heading2'; Text = '作業対象施設ベースの認可' },
    @{ Type = 'Bullets'; Items = @(
      '各 API は Bearer トークン上の作業対象施設を認可コンテキストとして扱い、作業対象施設が存在しない、または `facilities.deleted_at IS NOT NULL` の場合は 404 とする',
      '通常アカウントでは、作業対象施設に対する実効 `feature_code` を都度再判定する。共有システム管理者アカウントでは、作業対象施設が未削除であれば通常判定をバイパスする',
      'SHIP資産マスタは共通マスタのため、一覧取得の返却対象を施設単位で絞り込まない',
      '通常アカウントで作業対象施設に対して必要な実効 `feature_code` がない場合は 403 を返却する'
    ) },
    @{ Type = 'Heading2'; Text = '検索・絞り込み仕様' },
    @{ Type = 'Bullets'; Items = @(
      'Category / 大分類 / 中分類 / 品目 / メーカーは AND 条件で絞り込む',
      'フィルタ未指定項目は条件に含めない',
      '一覧の並び順は `ship_asset_master_id ASC` を既定とする'
    ) },
    @{ Type = 'Heading2'; Text = 'Excel入出力共通ルール' },
    @{ Type = 'Bullets'; Items = @(
      'テンプレートおよびエクスポートの固定列は一覧固定カラム全体（JMDN分類・一般名称、薬事、SHIP_Master、設備情報、資産情報、PMDA提供、登録状況）とする',
      'テンプレート入力時の必須固定列は、JMDN分類・一般名称、SHIP_Master、薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況の全入力カラムとする。ただし新規取込行の `shipAssetMasterId` は空欄を許容し、既存行更新では必須とする',
      '薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況の固定属性列はすべて必須入力とし、未入力時は行単位のバリデーションエラーとする',
      'インポートでは JMDN 固定列から `jmdn_classifications` / `jmdn_registered_items` を再利用または新規作成し、各 SHIP 資産マスタへ紐づける'
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Heading3'; Text = '基本エラーレスポンス（ErrorResponse）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや補足情報')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API一覧' },
    @{ Type = 'Heading2'; Text = 'SHIP資産マスタ（/ship-asset-master）' },
    @{ Type = 'Table'; Headers = @('機能名', 'Method', 'Path', '概要', '認証'); Rows = @(
      @('資産マスタ一覧取得', 'GET', '/ship-asset-master/assets', 'SHIP資産マスタ一覧と一覧固定カラム全体を取得する', '要'),
      @('資産マスタエクスポート', 'GET', '/ship-asset-master/assets/export', '現在の絞り込み結果を Excel 出力する', '要'),
      @('資産マスタ取込テンプレート取得', 'GET', '/ship-asset-master/assets/template', 'Excel 取込テンプレートを取得する', '要'),
      @('資産マスタ取込プレビュー', 'POST', '/ship-asset-master/assets/import-preview', 'Excel 取込内容を検証し、プレビュー ID を発行する', '要'),
      @('資産マスタ取込実行', 'POST', '/ship-asset-master/assets/import', '追加または置換インポートを実行する', '要'),
      @('JMDN登録品目検索', 'GET', '/ship-asset-master/jmdn-registered-items', 'JMDN検索モーダル向けに候補を検索する', '要'),
      @('JMDN登録品目作成', 'POST', '/ship-asset-master/jmdn-registered-items', 'JMDN分類・一般的名称 / JMDN登録品目を再利用または新規作成する', '要'),
      @('資産マスタ新規作成', 'POST', '/ship-asset-master/assets', 'SHIP資産マスタを新規作成する', '要'),
      @('資産マスタ更新', 'PUT', '/ship-asset-master/assets/{shipAssetMasterId}', 'SHIP資産マスタを更新する', '要'),
      @('資産マスタ削除', 'DELETE', '/ship-asset-master/assets/{shipAssetMasterId}', 'SHIP資産マスタを論理削除する', '要')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 SHIP資産マスタ機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '資産マスタ一覧取得（/ship-asset-master/assets）'
        Overview = 'SHIP資産マスタ一覧、表示件数、および一覧固定カラム全体を取得する。'
        Method = 'GET'
        Path = '/ship-asset-master/assets'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('categoryId', 'query', 'int64', '-', 'Category ID'),
          @('largeClassId', 'query', 'int64', '-', '大分類 ID'),
          @('mediumClassId', 'query', 'int64', '-', '中分類 ID'),
          @('assetItemId', 'query', 'int64', '-', '品目 ID'),
          @('manufacturerId', 'query', 'int64', '-', 'メーカー ID')
        )
        PermissionLines = @(
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `asset_master_list` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_list` が有効であること'
        )
        ProcessingLines = @(
          '`ship_asset_masters.is_active = true` の有効データのみを対象にする',
          'Category / 大分類 / 中分類 / 品目 / メーカーを AND 条件で絞り込む',
          '`asset_categories` / `asset_large_classes` / `asset_medium_classes` / `asset_items` / `manufacturers` / `models` を結合して固定階層表示値と明細区分を解決する',
          '`ship_asset_master_details` を1:1で結合し、薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況の固定属性を `fixedDetails` として返却する',
          '`ship_asset_masters.jmdn_registered_item_id` から `jmdn_registered_items` と親の `jmdn_classifications` を参照し、JMDN 表示項目を補完する'
        )
        ResponseTitle = 'レスポンス（200：ShipAssetMasterListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '絞り込み後の一覧件数'),
          @('items', 'ShipAssetMasterSummary[]', '✓', '資産マスタ一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（ShipAssetMasterSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $ShipAssetMasterSummaryRows
          },
          @{
            Title = 'fixedDetails要素（ShipAssetMasterFixedDetails）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $ShipAssetMasterFixedDetailRows
          }
        )
        ResponseLines = @(
          'items要素は一覧画面に表示する固定カラム全体（JMDN分類・一般名称、薬事、SHIP_Master、設備情報、資産情報、PMDA提供、登録状況）を返却する。'
        )
        StatusRows = @(
          @('200', '取得成功', 'ShipAssetMasterListResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `asset_master_list` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産マスタエクスポート（/ship-asset-master/assets/export）'
        Overview = '現在の絞り込み条件に一致する SHIP 資産マスタ一覧を Excel ファイルとして出力する。'
        Method = 'GET'
        Path = '/ship-asset-master/assets/export'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('categoryId', 'query', 'int64', '-', 'Category ID'),
          @('largeClassId', 'query', 'int64', '-', '大分類 ID'),
          @('mediumClassId', 'query', 'int64', '-', '中分類 ID'),
          @('assetItemId', 'query', 'int64', '-', '品目 ID'),
          @('manufacturerId', 'query', 'int64', '-', 'メーカー ID')
        )
        PermissionLines = @(
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `asset_master_list` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_list` が有効であること'
        )
        ProcessingLines = @(
          '一覧取得 API と同一の絞り込み条件、並び順、表示解決ルールを適用する',
          '一覧固定カラム全体（JMDN分類・一般名称、薬事、SHIP_Master、設備情報、資産情報、PMDA提供、登録状況）を要件順で出力する',
          'JMDN 関連列、添付文書ファイル名、添付文書 URL は参照値として出力する'
        )
        ResponseTitle = 'レスポンス（200：Excel File）'
        ResponseSubtables = @(
          @{
            Title = 'Headers'
            Headers = @('ヘッダー名', '必須', '形式', '説明')
            Rows = @(
              @('Content-Type', '✓', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Excel 形式で返却する'),
              @('Content-Disposition', '✓', 'attachment; filename="SHIP資産マスタ_YYYYMMDD.xlsx"', 'ダウンロードファイル名')
            )
          }
        )
        ResponseLines = @(
          'Body: 絞り込み条件に一致する SHIP 資産マスタ一覧を Excel バイナリで返却する。',
          '出力列は一覧画面の固定表示列全体とする。'
        )
        StatusRows = @(
          @('200', '出力成功', 'Excel File'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `asset_master_list` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産マスタ取込テンプレート取得（/ship-asset-master/assets/template）'
        Overview = 'SHIP 資産マスタ取込用の Excel テンプレートを取得する。'
        Method = 'GET'
        Path = '/ship-asset-master/assets/template'
        Auth = '要（Bearer）'
        PermissionLines = @(
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `asset_master_edit` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          'visible sheet には一覧固定カラム全体（JMDN分類・一般名称、薬事、SHIP_Master、設備情報、資産情報、PMDA提供、登録状況）を出力する',
          'visible sheet の入力必須列は JMDN分類・一般名称、SHIP_Master、薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況の全入力カラムとする',
          '`shipAssetMasterId` は SHIP_Master の固定列として出力し、新規登録行では空欄を許容、既存行更新では必須とする',
          '薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況の固定属性列は必須列として出力し、未入力を許容しない'
        )
        ResponseTitle = 'レスポンス（200：Excel File）'
        ResponseSubtables = @(
          @{
            Title = 'Headers'
            Headers = @('ヘッダー名', '必須', '形式', '説明')
            Rows = @(
              @('Content-Type', '✓', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Excel 形式で返却する'),
              @('Content-Disposition', '✓', 'attachment; filename="SHIP資産マスタ_テンプレート_YYYYMMDD.xlsx"', 'ダウンロードファイル名')
            )
          }
        )
        ResponseLines = @(
          'Body: SHIP 資産マスタ取込テンプレートを Excel バイナリで返却する。'
        )
        StatusRows = @(
          @('200', '取得成功', 'Excel File'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産マスタ取込プレビュー（/ship-asset-master/assets/import-preview）'
        Overview = 'アップロードされた Excel を検証し、追加インポート / 置換インポートの事前確認に使うプレビューを作成する。'
        Method = 'POST'
        Path = '/ship-asset-master/assets/import-preview'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエスト（multipart/form-data）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('file', 'file', '✓', '取込対象の Excel ファイル（`.xlsx` / `.xls`）')
        )
        PermissionLines = @(
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `asset_master_edit` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          'visible sheet の固定列を解析する',
          'JMDN分類・一般名称の全カラム（類別コード / 類別名称 / JMDN中分類名 / 一般的名称 / JMDNコード / 販売名 / 製造販売業者等 / 添付文書ファイル名 / 添付文書URL）、SHIP_Master の全カラム（Category / 大分類 / 中分類 / 明細区分 / 品目 / メーカー / 型式）、および固定属性の全カラム（薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況）は必須とする',
          '新規取込行の `shipAssetMasterId` は空欄を許容し、既存行更新では `shipAssetMasterId` を必須とする',
          '固定属性列に未入力がある場合は行単位の `validationErrors` へ格納し、プレビューを実行不可とする',
          'ファイル内で `shipAssetMasterId` が重複する行、または `shipAssetMasterId` 未指定かつ同一組み合わせに正規化される行が複数存在する場合は行エラーとする',
          'JMDN 固定列から親の JMDN分類・一般的名称と JMDN登録品目の再利用可否を判定し、既存 `JMDNコード` と分類項目が不一致の場合は行エラーとする',
          '必須不足、桁数超過、階層矛盾、JMDN 不整合は行単位の `validationErrors` へ格納する',
          '検証後の正規化結果と有効期限を `previewId` 単位で保持する'
        )
        ResponseTitle = 'レスポンス（200：ShipAssetMasterImportPreviewResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('previewId', 'string', '✓', 'プレビュー識別子'),
          @('fileName', 'string', '✓', 'アップロードファイル名'),
          @('totalRows', 'int32', '✓', '総行数'),
          @('validRows', 'int32', '✓', '取込可能行数'),
          @('errorRows', 'int32', '✓', 'エラー行数'),
          @('expiresAt', 'datetime', '✓', 'プレビュー有効期限'),
          @('rows', 'ShipAssetMasterImportPreviewRow[]', '✓', '行ごとの検証結果')
        )
        ResponseSubtables = @(
          @{
            Title = 'rows要素（ShipAssetMasterImportPreviewRow）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('rowNo', 'int32', '✓', 'Excel 上の行番号'),
              @('shipAssetMasterId', 'int64', '-', '資産マスタID。空欄時は新規候補'),
              @('categoryName', 'string', '✓', 'Category 名'),
              @('largeClassName', 'string', '✓', '大分類名'),
              @('mediumClassName', 'string', '✓', '中分類名'),
              @('detailType', 'string', '✓', '明細区分'),
              @('assetItemName', 'string', '✓', '品目名'),
              @('manufacturerName', 'string', '✓', 'メーカー名'),
              @('modelName', 'string', '✓', '型式名'),
              @('classCode', 'string', '✓', '類別コード'),
              @('className', 'string', '✓', '類別名称'),
              @('jmdnMediumClassificationName', 'string', '✓', 'JMDN中分類名'),
              @('generalName', 'string', '✓', '一般的名称'),
              @('jmdnCode', 'string', '✓', 'JMDNコード'),
              @('marketingName', 'string', '✓', '販売名'),
              @('marketingAuthorizationHolderName', 'string', '✓', '製造販売業者等'),
              @('attachmentDocumentFileName', 'string', '✓', 'JMDN登録品目に紐づく添付文書ファイル名'),
              @('attachmentDocumentUrl', 'string', '✓', 'JMDN登録品目に紐づく添付文書 URL'),
              @('fixedDetails', 'ShipAssetMasterFixedDetails', '✓', '薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況の固定属性。全項目必須'),
              @('resolvedAction', 'string', '✓', 'サーバー解決結果。`CREATE` / `UPDATE` / `REACTIVATE` のいずれか'),
              @('resolvedJmdnAction', 'string', '✓', 'JMDN 解決結果。`REUSE_REGISTERED_ITEM` / `CREATE_REGISTERED_ITEM` のいずれか'),
              @('validationErrors', 'string[]', '✓', '行エラー一覧。正常行は空配列')
            )
          },
          @{
            Title = 'fixedDetails要素（ShipAssetMasterFixedDetails）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $ShipAssetMasterFixedDetailRows
          }
        )
        StatusRows = @(
          @('200', '検証完了', 'ShipAssetMasterImportPreviewResponse'),
          @('400', 'ファイル形式不正、シート解析不能', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産マスタ取込実行（/ship-asset-master/assets/import）'
        Overview = 'プレビュー済みの SHIP 資産マスタ取込を追加または置換モードで実行する。'
        Method = 'POST'
        Path = '/ship-asset-master/assets/import'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエスト（ShipAssetMasterImportRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('previewId', 'string', '✓', 'プレビュー識別子'),
          @('importMode', 'string', '✓', '`APPEND` または `REPLACE`')
        )
        PermissionLines = @(
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `asset_master_edit` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `previewId` が存在し、有効期限内であることを確認する',
          '`errorRows = 0` のプレビューのみ実行可能とし、エラー行を含む場合は 409 `IMPORT_PREVIEW_INVALID` を返す',
          '1 プレビュー単位で単一トランザクションを張り、部分成功は許容しない',
          '各行について JMDN 固定列から `jmdn_classifications` / `jmdn_registered_items` を再利用または新規作成し、`ship_asset_masters.jmdn_registered_item_id` を決定する',
          '各行について分割マスタと明細区分を解決または作成し、`shipAssetMasterId` 指定時は同IDの行へ更新/再有効化、未指定時は同一組み合わせの有効行があれば更新、なければ新規作成する',
          '各行の `ship_asset_masters` と `ship_asset_master_details` は同一トランザクション内で UPSERT する',
          '新規作成または再有効化で `ship_asset_master_details` が存在しない場合は、プレビューで検証済みの固定属性値を持つ詳細行を1件作成する',
          '`REPLACE` の場合は、インポート識別集合に含まれない有効 `ship_asset_masters` を `is_active=false` で論理削除する。既存参照は保持する'
        )
        ResponseTitle = 'レスポンス（200：ShipAssetMasterImportResultResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('previewId', 'string', '✓', 'プレビュー識別子'),
          @('importMode', 'string', '✓', '実行モード'),
          @('processedRows', 'int32', '✓', '処理対象行数'),
          @('createdCount', 'int32', '✓', '新規作成件数'),
          @('updatedCount', 'int32', '✓', '更新件数'),
          @('reactivatedCount', 'int32', '✓', '再有効化件数'),
          @('logicallyDeletedCount', 'int32', '✓', '置換時に論理削除した件数'),
          @('importedAt', 'datetime', '✓', '取込実行日時')
        )
        StatusRows = @(
          @('200', '取込成功', 'ShipAssetMasterImportResultResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
          @('404', '対象プレビューが存在しない', 'ErrorResponse'),
          @('409', 'プレビュー期限切れ、またはプレビューエラー残存', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'JMDN登録品目検索（/ship-asset-master/jmdn-registered-items）'
        Overview = 'JMDN検索モーダルで既存の JMDN登録品目候補を検索取得する。返却には親の JMDN分類・一般的名称情報を含める。'
        Method = 'GET'
        Path = '/ship-asset-master/jmdn-registered-items'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('keyword', 'query', 'string', '-', '全体検索文字列。類別コード、類別名称、JMDNコード、販売名、製造販売業者等を横断検索する'),
          @('classCode', 'query', 'string', '-', '類別コード'),
          @('className', 'query', 'string', '-', '類別名称'),
          @('jmdnCode', 'query', 'string', '-', 'JMDNコード'),
          @('marketingName', 'query', 'string', '-', '販売名'),
          @('marketingAuthorizationHolderName', 'query', 'string', '-', '製造販売業者等')
        )
        PermissionLines = @(
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `asset_master_edit` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '`jmdn_registered_items` と親の `jmdn_classifications` を結合して検索候補を構成する',
          '検索条件は AND 条件で適用し、`keyword` 指定時は類別コード、類別名称、JMDNコード、販売名、製造販売業者等へ部分一致で横断検索する',
          '並び順は `jmdn_code ASC, product_name ASC, jmdn_registered_item_id ASC` を既定とする'
        )
        ResponseTitle = 'レスポンス（200：JmdnRegisteredItemSearchResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '返却件数'),
          @('items', 'JmdnRegisteredItemSummary[]', '✓', '検索結果一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（JmdnRegisteredItemSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('jmdnRegisteredItemId', 'int64', '✓', 'JMDN登録品目 ID'),
              @('jmdnClassificationId', 'int64', '✓', 'JMDN分類・一般的名称 ID'),
              @('classCode', 'string', '✓', '類別コード'),
              @('className', 'string', '✓', '類別名称'),
              @('jmdnMediumClassificationName', 'string', '✓', 'JMDN中分類名'),
              @('generalName', 'string', '✓', '一般的名称'),
              @('jmdnCode', 'string', '✓', 'JMDNコード'),
              @('marketingName', 'string', '✓', '販売名'),
              @('marketingAuthorizationHolderName', 'string', '✓', '製造販売業者等'),
              @('attachmentDocumentFileName', 'string', '✓', 'JMDN登録品目に紐づく添付文書ファイル名'),
              @('attachmentDocumentUrl', 'string', '✓', 'JMDN登録品目に紐づく添付文書 URL')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'JmdnRegisteredItemSearchResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'JMDN登録品目作成（/ship-asset-master/jmdn-registered-items）'
        Overview = 'JMDN作成モーダルから JMDN分類・一般的名称 / JMDN登録品目を再利用または新規作成し、資産マスタモーダルで選択する候補を返却する。'
        Method = 'POST'
        Path = '/ship-asset-master/jmdn-registered-items'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエスト（JmdnRegisteredItemUpsertRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('classCode', 'string', '✓', '類別コード'),
          @('className', 'string', '✓', '類別名称'),
          @('jmdnMediumClassificationName', 'string', '✓', 'JMDN中分類名'),
          @('generalName', 'string', '✓', '一般的名称'),
          @('jmdnCode', 'string', '✓', 'JMDNコード'),
          @('marketingName', 'string', '✓', '販売名'),
          @('marketingAuthorizationHolderName', 'string', '✓', '製造販売業者等'),
          @('attachmentDocumentFileName', 'string', '✓', 'JMDN登録品目に紐づく添付文書ファイル名'),
          @('attachmentDocumentUrl', 'string', '✓', 'JMDN登録品目に紐づく添付文書 URL')
        )
        PermissionLines = @(
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `asset_master_edit` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '`attachmentDocumentFileName` と `attachmentDocumentUrl` は両方必須とし、未指定または片方のみは 400 `VALIDATION_ERROR` とする',
          '`jmdn_code` 一致の `jmdn_classifications` が存在する場合は、入力した類別コード / 類別名称 / JMDN中分類名 / 一般的名称と完全一致することを確認し、一致時のみ親分類を再利用する',
          '`jmdn_code` 一致行が存在し、分類項目が不一致の場合は 409 `JMDN_CLASSIFICATION_CONFLICT` を返し、新規作成しない',
          '`jmdn_code` 一致行が存在しない場合のみ `jmdn_classifications` を新規作成する',
          '親分類配下で `marketingName` / `marketingAuthorizationHolderName` / `attachmentDocumentFileName` / `attachmentDocumentUrl` の正規化後組み合わせが一致する `jmdn_registered_items` が存在する場合は既存行を再利用する',
          '一致する JMDN登録品目が存在しない場合のみ `jmdn_registered_items` を新規作成する',
          '返却値は資産マスタモーダルへそのまま反映可能な JMDN登録品目詳細とする'
        )
        ResponseTitle = 'レスポンス（200：JmdnRegisteredItemUpsertResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('createdClassification', 'boolean', '✓', 'JMDN分類・一般的名称を新規作成した場合は `true`'),
          @('createdRegisteredItem', 'boolean', '✓', 'JMDN登録品目を新規作成した場合は `true`'),
          @('item', 'JmdnRegisteredItemSummary', '✓', '資産マスタへ設定する JMDN登録品目')
        )
        ResponseSubtables = @(
          @{
            Title = 'item要素（JmdnRegisteredItemSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('jmdnRegisteredItemId', 'int64', '✓', 'JMDN登録品目 ID'),
              @('jmdnClassificationId', 'int64', '✓', 'JMDN分類・一般的名称 ID'),
              @('classCode', 'string', '✓', '類別コード'),
              @('className', 'string', '✓', '類別名称'),
              @('jmdnMediumClassificationName', 'string', '✓', 'JMDN中分類名'),
              @('generalName', 'string', '✓', '一般的名称'),
              @('jmdnCode', 'string', '✓', 'JMDNコード'),
              @('marketingName', 'string', '✓', '販売名'),
              @('marketingAuthorizationHolderName', 'string', '✓', '製造販売業者等'),
              @('attachmentDocumentFileName', 'string', '✓', 'JMDN登録品目に紐づく添付文書ファイル名'),
              @('attachmentDocumentUrl', 'string', '✓', 'JMDN登録品目に紐づく添付文書 URL')
            )
          }
        )
        StatusRows = @(
          @('200', '処理成功', 'JmdnRegisteredItemUpsertResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
          @('409', '既存 JMDNコード と分類項目が不一致', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産マスタ新規作成（/ship-asset-master/assets）'
        Overview = 'SHIP 資産マスタを新規作成する。資産マスタID（`ship_asset_master_id`）はサーバー側で採番し、JMDN登録品目、SHIP_Master項目、固定属性を同一トランザクションで保存する。'
        Method = 'POST'
        Path = '/ship-asset-master/assets'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエスト（ShipAssetMasterCreateRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('categoryId', 'int64', '✓', 'Category ID'),
          @('largeClassName', 'string', '✓', '大分類名'),
          @('mediumClassName', 'string', '✓', '中分類名'),
          @('detailType', 'string', '✓', '明細区分'),
          @('assetItemName', 'string', '✓', '品目名'),
          @('manufacturerName', 'string', '✓', 'メーカー名'),
          @('modelName', 'string', '✓', '型式名'),
          @('jmdnRegisteredItemId', 'int64', '✓', 'JMDN登録品目 ID'),
          @('fixedDetails', 'ShipAssetMasterFixedDetailsUpsert', '✓', '薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況の固定属性。全項目必須')
        )
        RequestSubtables = @(
          @{
            Title = 'fixedDetails要素（ShipAssetMasterFixedDetailsUpsert）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $ShipAssetMasterFixedDetailRows
          }
        )
        PermissionLines = @(
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `asset_master_edit` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          'Category / 大分類 / 中分類 / 明細区分 / 品目 / メーカー / 型式 / `jmdnRegisteredItemId` / `fixedDetails` は必須とする',
          '`fixedDetails` 配下の薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況の全項目は必須とし、未指定または空値は 400 `VALIDATION_ERROR` とする',
          '指定された `jmdnRegisteredItemId` が有効な `jmdn_registered_items` に存在することを確認する',
          '大分類 / 中分類 / 品目 / メーカー / 型式の入力値に対応する分割マスタが未登録の場合は、親子関係を保って新規作成する',
          '解決後の組み合わせが既存の有効 `ship_asset_masters` と重複する場合は 409 `DUPLICATE_ASSET_MASTER_COMBINATION` を返す',
          '資産マスタID（`ship_asset_master_id`）はサーバー側で採番する',
          '`ship_asset_masters` を作成後、同じ `ship_asset_master_id` の `ship_asset_master_details` を必ず1件作成し、検証済みの固定属性値を保存する',
          'SHIP_Master項目と固定属性は単一トランザクションで保存する'
        )
        ResponseTitle = 'レスポンス（201：ShipAssetMasterDetailResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'ShipAssetMasterSummary', '✓', '登録後の SHIP 資産マスタ')
        )
        ResponseSubtables = @(
          @{
            Title = 'item要素（ShipAssetMasterSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $ShipAssetMasterSummaryRows
          },
          @{
            Title = 'fixedDetails要素（ShipAssetMasterFixedDetails）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $ShipAssetMasterFixedDetailRows
          }
        )
        StatusRows = @(
          @('201', '登録成功', 'ShipAssetMasterDetailResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
          @('404', '指定した JMDN登録品目が存在しない', 'ErrorResponse'),
          @('409', '組み合わせ重複', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産マスタ更新（/ship-asset-master/assets/{shipAssetMasterId}）'
        Overview = '指定した SHIP 資産マスタを更新する。資産マスタID（`ship_asset_master_id`）をキーに、JMDN登録品目、SHIP_Master項目、固定属性を同一トランザクションで更新する。'
        Method = 'PUT'
        Path = '/ship-asset-master/assets/{shipAssetMasterId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('shipAssetMasterId', 'path', 'int64', '✓', '更新対象の資産マスタID')
        )
        RequestTitle = 'リクエスト（ShipAssetMasterUpdateRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('categoryId', 'int64', '✓', 'Category ID'),
          @('largeClassName', 'string', '✓', '大分類名'),
          @('mediumClassName', 'string', '✓', '中分類名'),
          @('detailType', 'string', '✓', '明細区分'),
          @('assetItemName', 'string', '✓', '品目名'),
          @('manufacturerName', 'string', '✓', 'メーカー名'),
          @('modelName', 'string', '✓', '型式名'),
          @('jmdnRegisteredItemId', 'int64', '✓', 'JMDN登録品目 ID'),
          @('fixedDetails', 'ShipAssetMasterFixedDetailsUpsert', '✓', '薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況の固定属性。全項目必須')
        )
        RequestSubtables = @(
          @{
            Title = 'fixedDetails要素（ShipAssetMasterFixedDetailsUpsert）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $ShipAssetMasterFixedDetailRows
          }
        )
        PermissionLines = @(
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `asset_master_edit` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `ship_asset_masters` が存在し、有効であることを確認する',
          'Category / 大分類 / 中分類 / 明細区分 / 品目 / メーカー / 型式 / `jmdnRegisteredItemId` / `fixedDetails` は必須とする',
          '`fixedDetails` 配下の薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況の全項目は必須とし、未指定または空値は 400 `VALIDATION_ERROR` とする',
          '指定された `jmdnRegisteredItemId` が有効な `jmdn_registered_items` に存在することを確認する',
          '解決後の組み合わせが自身以外の有効 `ship_asset_masters` と重複する場合は 409 `DUPLICATE_ASSET_MASTER_COMBINATION` を返す',
          '必要に応じて分割マスタを作成または更新し、対象資産マスタの SHIP_Master 項目を更新する',
          '`jmdn_registered_item_id` を更新し、JMDN 表示項目は参照先の `jmdn_registered_items` / `jmdn_classifications` に従って返却する',
          '`ship_asset_master_id` は更新不可とし、レスポンスで現在値を返す',
          '`ship_asset_master_details` は `(ship_asset_master_id)` 単位で UPSERT し、詳細行が存在しない場合は1件作成する。PUT は全項目更新として扱い、固定属性の未指定項目を暗黙に保持または空値保存しない'
        )
        ResponseTitle = 'レスポンス（200：ShipAssetMasterDetailResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'ShipAssetMasterSummary', '✓', '更新後の SHIP 資産マスタ')
        )
        ResponseSubtables = @(
          @{
            Title = 'item要素（ShipAssetMasterSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $ShipAssetMasterSummaryRows
          },
          @{
            Title = 'fixedDetails要素（ShipAssetMasterFixedDetails）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $ShipAssetMasterFixedDetailRows
          }
        )
        StatusRows = @(
          @('200', '更新成功', 'ShipAssetMasterDetailResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
          @('404', '対象 SHIP 資産マスタまたは指定した JMDN登録品目が存在しない', 'ErrorResponse'),
          @('409', '組み合わせ重複', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産マスタ削除（/ship-asset-master/assets/{shipAssetMasterId}）'
        Overview = '指定した SHIP 資産マスタを論理削除する。既存資産・編集リストからの参照は維持する。'
        Method = 'DELETE'
        Path = '/ship-asset-master/assets/{shipAssetMasterId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('shipAssetMasterId', 'path', 'int64', '✓', '削除対象の資産マスタID')
        )
        PermissionLines = @(
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `asset_master_edit` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `ship_asset_masters` が存在することを確認する',
          '`ship_asset_masters.is_active = false` へ更新する',
          '`asset_ledgers` や `edit_list_items` の `ship_asset_master_id` は保持し、履歴参照は壊さない',
          '既存の `ship_asset_master_details` は保持する'
        )
        ResponseTitle = 'レスポンス'
        ResponseLines = @(
          'Body: なし'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
          @('404', '対象 SHIP 資産マスタが存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '必要権限' },
    @{ Type = 'Table'; Headers = @('処理', '必要コード', '判定基準', '説明'); Rows = @(
      @('一覧表示 / エクスポート', '`asset_master_list`', '通常アカウントは作業対象施設に対して実効 `asset_master_list` を持つこと。共有システム管理者は作業対象施設が未削除であれば許可', '一覧参照系処理'),
      @('テンプレート取得 / インポートプレビュー / インポート', '`asset_master_edit`', '通常アカウントは作業対象施設に対して実効 `asset_master_edit` を持つこと。共有システム管理者は作業対象施設が未削除であれば許可', '一括更新処理'),
      @('JMDN登録品目検索 / JMDN作成', '`asset_master_edit`', '通常アカウントは作業対象施設に対して実効 `asset_master_edit` を持つこと。共有システム管理者は作業対象施設が未削除であれば許可', '資産マスタ編集モーダル内の JMDN 選択/作成処理'),
      @('新規作成 / 更新 / 削除', '`asset_master_edit`', '通常アカウントは作業対象施設に対して実効 `asset_master_edit` を持つこと。共有システム管理者は作業対象施設が未削除であれば許可', '資産マスタ管理処理')
    ) },
    @{ Type = 'Heading2'; Text = '階層マスタ解決ルール' },
    @{ Type = 'Bullets'; Items = @(
      'Category は既存 ID 指定を必須とする',
      '大分類 / 中分類 / 品目 / メーカー / 型式は名称入力を受け付け、親子関係に合致する既存行があれば再利用し、なければ新規作成する',
      '明細区分 / メーカー / 型式は必須とし、未設定の資産マスタは登録・更新できない',
      '解決後の Category / 大分類 / 中分類 / 明細区分 / 品目 / メーカー / 型式の組み合わせは `ship_asset_masters` 上で一意とする'
    ) },
    @{ Type = 'Heading2'; Text = 'JMDN運用ルール' },
    @{ Type = 'Bullets'; Items = @(
      'SHIP資産マスタの新規作成 / 更新では `jmdnRegisteredItemId` を必須とし、JMDN 表示項目は常に `jmdn_registered_items` と親の `jmdn_classifications` から解決する',
      '類別コード / 類別名称 / JMDN中分類名 / 一般的名称 / JMDNコード / 販売名 / 製造販売業者等 / 添付文書ファイル名 / 添付文書URL は必須とする',
      'JMDN検索モーダルは既存の `jmdn_registered_items` を検索して選択させ、検索結果がない場合のみ JMDN作成 API を呼び出す',
      '`POST /ship-asset-master/jmdn-registered-items` は既存 `JMDNコード` がある場合に分類項目一致を必須とし、不一致時は 409 `JMDN_CLASSIFICATION_CONFLICT` を返す',
      '`attachmentDocumentFileName` と `attachmentDocumentUrl` は両方必須とし、未指定または片方のみは許可しない',
      '同一分類配下で `販売名` / `製造販売業者等` / `添付文書ファイル名` / `添付文書URL` の正規化後組み合わせが一致する JMDN登録品目は再利用し、重複作成しない',
      '添付文書は `jmdn_registered_items.attachment_file_name` を一覧表示用の安定ファイル名、`jmdn_registered_items.attachment_url` をリンク先として返却する read-only 項目とし、SHIP資産マスタ固有の Document 列は持たない',
      'SHIP資産マスタを削除しても `jmdn_classifications` / `jmdn_registered_items` は削除しない'
    ) },
    @{ Type = 'Heading2'; Text = '固定属性運用ルール' },
    @{ Type = 'Bullets'; Items = @(
      '薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況の固定属性は `ship_asset_master_details` を正本とする',
      '資産マスタを1件新規作成する場合は、同じ `ship_asset_master_id` の `ship_asset_master_details` を1件作成し、一覧に表示される固定属性をすべて保存する',
      '固定属性の各項目は新規作成 / 更新 / インポートで必須入力とし、未入力値は保存しない',
      '資産マスタ更新では `ship_asset_masters` と `ship_asset_master_details` を同一トランザクションで更新する'
    ) },
    @{ Type = 'Heading2'; Text = 'インポート運用ルール' },
    @{ Type = 'Bullets'; Items = @(
      'テンプレートの `shipAssetMasterId` は既存行更新用の列とし、新規行では空欄を許容、既存行更新では必須とする',
      'インポートの必須固定列は JMDN分類・一般名称、SHIP_Master、薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況の全入力カラムとする',
      '薬事 / 設備情報 / 資産情報 / PMDA提供 / 登録状況の固定属性列はすべて必須入力とし、未入力行はプレビューでエラーにする',
      '`REPLACE` ではファイルに含まれない有効資産マスタを論理削除するが、既存資産・編集リストからの参照は保持する',
      'インポートはプレビュー単位で全件成功/全件失敗の一括トランザクションとする',
      'JMDN 固定列はインポート時に `jmdn_classifications` / `jmdn_registered_items` の再利用または新規作成へ使用し、既存 `JMDNコード` と分類項目が不一致の行はエラーとする'
    ) },
    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '説明'); Rows = @(
      @('VALIDATION_ERROR', '400', '必須不足、桁数超過、形式不正、条件付き必須違反'),
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
      @('AUTH_403_ASSET_MASTER_LIST_DENIED', '403', '通常アカウントで作業対象施設に対する実効 `asset_master_list` がない。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする'),
      @('AUTH_403_ASSET_MASTER_EDIT_DENIED', '403', '通常アカウントで作業対象施設に対する実効 `asset_master_edit` がない。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする'),
      @('FACILITY_NOT_FOUND', '404', '作業対象施設が存在しない、または削除済み'),
      @('SHIP_ASSET_MASTER_NOT_FOUND', '404', '対象 SHIP 資産マスタが存在しない'),
      @('JMDN_REGISTERED_ITEM_NOT_FOUND', '404', '指定した JMDN登録品目が存在しない'),
      @('DUPLICATE_ASSET_MASTER_COMBINATION', '409', 'Category / 大分類 / 中分類 / 明細区分 / 品目 / メーカー / 型式の組み合わせが重複している'),
      @('JMDN_CLASSIFICATION_CONFLICT', '409', '既存 JMDNコード と入力した分類項目が一致しない'),
      @('IMPORT_PREVIEW_NOT_FOUND', '404', '対象プレビューが存在しない'),
      @('IMPORT_PREVIEW_INVALID', '409', 'プレビューにエラー行が残っている、または実行条件を満たしていない'),
      @('IMPORT_FILE_INVALID', '400', '取込ファイル形式不正、またはテンプレート構造不正'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー')
    ) }
  )
}
