@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_SHIP資産マスタ.docx'
  ScreenLabel = 'SHIP資産マスタ'
  CoverDateText = '2026年4月20日'
  RevisionDateText = '2026/4/20'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、SHIP資産マスタ画面（`/ship-asset-master`）および資産マスタ選択ポップアップ（`/asset-master`）で利用する API の設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      'SHIP資産マスタ一覧参照、絞り込み、エクスポート、テンプレートダウンロード、インポート I/F',
      'Category から型式までの組み合わせ解決と、必要に応じた分割マスタ自動作成ルール',
      'JMDN登録品目の検索・選択、および該当なし時の JMDN分類・一般的名称 / JMDN登録品目 新規作成ルール',
      'SHIP資産マスタ任意カラムの定義管理、および資産マスタ行ごとの任意カラム値保存ルール',
      '資産マスタ選択ポップアップが共通 API を再利用する際の返却データ範囲',
      '権限、バリデーション、論理削除、エラーレスポンス'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = 'SHIP資産マスタは、Category / 大分類 / 中分類 / 品目 / メーカー / 型式の組み合わせを管理する共通マスタであり、資産一覧、資産詳細、編集リスト、Data Link の参照元となる。' },
    @{ Type = 'Paragraph'; Text = '本機能では、組み合わせ本体を `ship_asset_masters`、JMDN の正本を `jmdn_classifications` / `jmdn_registered_items`、任意カラム定義を `ship_asset_master_custom_columns`、任意カラム値を `ship_asset_master_custom_values` で管理する。資産マスタ選択ポップアップは同じ一覧取得 API を再利用し、選択結果を親画面へ返却する。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('SHIP資産マスタ', 'Category から型式までの組み合わせを 1 件で表す共通マスタ。実体は `ship_asset_masters`'),
      @('資産マスタID', '`ship_asset_masters.ship_asset_master_id`。画面表示と下流参照で共通に利用する識別子'),
      @('JMDN分類・一般的名称', '類別コード / 類別名称 / JMDN中分類名 / 一般的名称 / JMDNコードを保持する共有マスタ。実体は `jmdn_classifications`'),
      @('JMDN登録品目', '販売名 / 製造販売業者等 / 添付文書ファイル名 / 添付文書URLを保持する共有マスタ。SHIP資産マスタは本 ID を必須参照する'),
      @('任意カラム', 'SHIP資産マスタに追加できる動的項目。定義は `ship_asset_master_custom_columns`、値は `ship_asset_master_custom_values` に保存する'),
      @('資産マスタ選択ポップアップ', '`/asset-master`。編集リスト等から呼び出され、選択した SHIP 資産マスタ情報を親画面へ返却する'),
      @('追加インポート', 'プレビュー済み行を既存データへ追加・更新する取込モード'),
      @('置換インポート', 'プレビュー済み行を追加・更新し、ファイルに含まれない有効資産マスタを論理削除する取込モード')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面URL', '利用目的'); Rows = @(
      @('17. SHIP資産マスタ画面', '/ship-asset-master', 'SHIP資産マスタ一覧参照、作成、更新、削除、任意カラム設定、エクスポート、インポートを行う'),
      @('30. 資産マスタ選択ポップアップ', '/asset-master', '親画面で使用する資産マスタ候補を検索し、`ship_asset_master_id` と固定/任意項目を返却する')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'APIの位置づけ' },
    @{ Type = 'Paragraph'; Text = '本 API 群は、SHIP資産マスタ画面の一覧参照、登録、更新、削除、任意カラム設定、Excel 入出力を提供する。' },
    @{ Type = 'Paragraph'; Text = 'また、資産マスタ選択ポップアップでは `GET /ship-asset-master/assets` をそのまま再利用し、返却済みの固定階層 ID / 表示値 / 任意カラム値を親画面へ `postMessage` で引き渡す。' },
    @{ Type = 'Heading2'; Text = '画面とAPIの関係' },
    @{ Type = 'Numbered'; Items = @(
      '画面初期表示およびフィルタ変更時に `GET /ship-asset-master/assets` を呼び出し、一覧件数・固定列・JMDN参照列・任意カラム表示値を取得する',
      'エクスポート押下時に `GET /ship-asset-master/assets/export` を呼び出し、現在の絞り込み結果を Excel 出力する',
      'テンプレートダウンロード押下時に `GET /ship-asset-master/assets/template` を呼び出し、取込用テンプレートを取得する',
      'インポートファイル選択時に `POST /ship-asset-master/assets/import-preview` を呼び出してプレビューを作成し、追加インポートまたは置換インポート確定時に `POST /ship-asset-master/assets/import` を呼び出す',
      'JMDN検索モーダルで既存候補を検索する際に `GET /ship-asset-master/jmdn-registered-items` を呼び出す',
      'JMDN作成モーダルの保存時に `POST /ship-asset-master/jmdn-registered-items` を呼び出し、JMDN分類・一般的名称 / JMDN登録品目を再利用または新規作成した結果を受け取る',
      '新規作成モーダルの登録押下時に `POST /ship-asset-master/assets` を呼び出す',
      '編集モーダルの更新押下時に `PUT /ship-asset-master/assets/{shipAssetMasterId}` を呼び出す',
      '削除確認モーダルの OK 押下時に `DELETE /ship-asset-master/assets/{shipAssetMasterId}` を呼び出す',
      '任意カラム設定モーダルでは `GET /ship-asset-master/custom-columns`、`POST /ship-asset-master/custom-columns`、`PUT /ship-asset-master/custom-columns/{customColumnId}`、`DELETE /ship-asset-master/custom-columns/{customColumnId}` を呼び出す',
      '資産マスタ選択ポップアップでは `GET /ship-asset-master/assets` の結果を親画面向けに整形し、通常モード/シンプルモードの返却差分はフロントエンドで吸収する'
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
      @('ship_asset_master_custom_columns', 'READ / CREATE / UPDATE / DELETE', '任意カラム定義一覧、登録、更新、論理削除'),
      @('ship_asset_master_custom_values', 'READ / CREATE / UPDATE', '資産マスタ行ごとの任意カラム値'),
      @('jmdn_classifications', 'READ / CREATE', '類別コード、類別名称、JMDN中分類名、一般的名称、JMDNコードの解決と未登録時の新規作成'),
      @('jmdn_registered_items', 'READ / CREATE', 'JMDN登録品目検索、販売名、製造販売業者等、添付文書ファイル名、添付文書URLの解決と未登録時の新規作成')
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
      '`ship_asset_master_id` を資産マスタIDとして利用し、作成時はサーバー側で採番する'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '認可判定は `feature_code` を正本とし、`taniguchi/docs/ロール整理.xlsx` の `権限管理単位一覧` シート A列に対応する `asset_master_list` と `asset_master_edit` を用いる。Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。画面表示用の `/auth/context` は UX 用キャッシュであり、各業務 API でも同条件を再判定する。' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('一覧取得 / エクスポート', '`asset_master_list`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', 'SHIP資産マスタ一覧参照とポップアップ候補取得'),
      @('テンプレート取得 / インポートプレビュー / インポート', '`asset_master_edit`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '資産マスタ一括更新処理'),
      @('JMDN登録品目検索 / JMDN作成', '`asset_master_edit`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '資産マスタ編集モーダル内の JMDN 選択/作成処理'),
      @('新規作成 / 更新 / 削除', '`asset_master_edit`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '資産マスタ変更系処理'),
      @('任意カラム一覧取得 / 新規作成 / 更新 / 削除', '`asset_master_edit`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '任意カラム設定モーダルの処理')
    ) },
    @{ Type = 'Heading2'; Text = '作業対象施設ベースの認可' },
    @{ Type = 'Bullets'; Items = @(
      '各 API は Bearer トークン上の作業対象施設に対する実効 `feature_code` を都度再判定する',
      'SHIP資産マスタは共通マスタのため、一覧・候補取得の返却対象を施設単位で絞り込まない',
      '作業対象施設に対して必要な実効 `feature_code` がない場合は 403 を返却する'
    ) },
    @{ Type = 'Heading2'; Text = '検索・絞り込み仕様' },
    @{ Type = 'Bullets'; Items = @(
      'Category / 大分類 / 中分類 / 品目 / メーカーは AND 条件で絞り込む',
      'フィルタ未指定項目は条件に含めない',
      '一覧の並び順は `ship_asset_master_id ASC` を既定とする',
      '任意カラム定義は `sort_order ASC, ship_asset_master_custom_column_id ASC` で返却する'
    ) },
    @{ Type = 'Heading2'; Text = 'Excel入出力共通ルール' },
    @{ Type = 'Bullets'; Items = @(
      'テンプレートおよびエクスポートの固定列は `shipAssetMasterId`、Category、大分類、中分類、品目、メーカー、型式、類別コード、類別名称、JMDN中分類名、一般的名称、JMDNコード、販売名、製造販売業者等、添付文書ファイル名、添付文書URLとする',
      'テンプレート入力時の必須固定列は Category、大分類、中分類、品目、類別コード、類別名称、一般的名称、JMDNコード、販売名とし、`shipAssetMasterId` は既存行更新時のみ使用する任意列とする',
      '任意カラムは有効列のみを `sort_order ASC, ship_asset_master_custom_column_id ASC` で固定列の後ろへ可変追加する',
      'テンプレートには hidden sheet `_custom_columns` を付与し、`column_key` と表示名の対応を保持する',
      'インポートプレビューは hidden sheet が存在する場合 `column_key` を優先して任意カラムを解決し、hidden sheet が存在しない場合のみ表示名一致で補完する',
      'インポート実行時はプレビュー作成時の任意カラム定義スナップショットと現行定義の差分を検知し、不整合があれば 409 `IMPORT_PREVIEW_STALE` を返却する',
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
      @('資産マスタ一覧取得', 'GET', '/ship-asset-master/assets', 'SHIP資産マスタ一覧と有効任意カラム定義を取得する', '要'),
      @('資産マスタエクスポート', 'GET', '/ship-asset-master/assets/export', '現在の絞り込み結果を Excel 出力する', '要'),
      @('資産マスタ取込テンプレート取得', 'GET', '/ship-asset-master/assets/template', 'Excel 取込テンプレートを取得する', '要'),
      @('資産マスタ取込プレビュー', 'POST', '/ship-asset-master/assets/import-preview', 'Excel 取込内容を検証し、プレビュー ID を発行する', '要'),
      @('資産マスタ取込実行', 'POST', '/ship-asset-master/assets/import', '追加または置換インポートを実行する', '要'),
      @('JMDN登録品目検索', 'GET', '/ship-asset-master/jmdn-registered-items', 'JMDN検索モーダル向けに候補を検索する', '要'),
      @('JMDN登録品目作成', 'POST', '/ship-asset-master/jmdn-registered-items', 'JMDN分類・一般的名称 / JMDN登録品目を再利用または新規作成する', '要'),
      @('資産マスタ新規作成', 'POST', '/ship-asset-master/assets', 'SHIP資産マスタを新規作成する', '要'),
      @('資産マスタ更新', 'PUT', '/ship-asset-master/assets/{shipAssetMasterId}', 'SHIP資産マスタを更新する', '要'),
      @('資産マスタ削除', 'DELETE', '/ship-asset-master/assets/{shipAssetMasterId}', 'SHIP資産マスタを論理削除する', '要'),
      @('任意カラム一覧取得', 'GET', '/ship-asset-master/custom-columns', '任意カラム定義一覧を取得する', '要'),
      @('任意カラム新規作成', 'POST', '/ship-asset-master/custom-columns', '任意カラム定義を新規作成する', '要'),
      @('任意カラム更新', 'PUT', '/ship-asset-master/custom-columns/{customColumnId}', '任意カラム定義を更新する', '要'),
      @('任意カラム削除', 'DELETE', '/ship-asset-master/custom-columns/{customColumnId}', '任意カラム定義を論理削除する', '要')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 SHIP資産マスタ機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '資産マスタ一覧取得（/ship-asset-master/assets）'
        Overview = 'SHIP資産マスタ一覧、表示件数、および動的表示に必要な有効任意カラム定義を取得する。SHIP資産マスタ画面と資産マスタ選択ポップアップで共通利用する。'
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
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_list` が有効であること'
        )
        ProcessingLines = @(
          '`ship_asset_masters.is_active = true` の有効データのみを対象にする',
          'Category / 大分類 / 中分類 / 品目 / メーカーを AND 条件で絞り込む',
          '`asset_categories` / `asset_large_classes` / `asset_medium_classes` / `asset_items` / `manufacturers` / `models` を結合して固定階層表示値を解決する',
          '`ship_asset_master_custom_columns.is_active = true` の任意カラム定義を `sort_order` 順で取得し、各 `ship_asset_master_id` に紐づく `ship_asset_master_custom_values` を結合する',
          '`ship_asset_masters.jmdn_registered_item_id` から `jmdn_registered_items` と親の `jmdn_classifications` を参照し、JMDN 表示項目を補完する',
          '資産マスタ選択ポップアップでは本レスポンスを再利用し、スコープ付与と `postMessage` はフロントエンドで処理する'
        )
        ResponseTitle = 'レスポンス（200：ShipAssetMasterListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '絞り込み後の一覧件数'),
          @('customColumns', 'ShipAssetCustomColumnSummary[]', '✓', '表示対象の有効任意カラム定義'),
          @('items', 'ShipAssetMasterSummary[]', '✓', '資産マスタ一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'customColumns要素（ShipAssetCustomColumnSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('customColumnId', 'int64', '✓', '任意カラム ID'),
              @('columnKey', 'string', '✓', '任意カラムの不変キー'),
              @('columnName', 'string', '✓', '画面表示名'),
              @('sortOrder', 'int32', '-', '表示順')
            )
          },
          @{
            Title = 'items要素（ShipAssetMasterSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('shipAssetMasterId', 'int64', '✓', '資産マスタID'),
              @('categoryId', 'int64', '✓', 'Category ID'),
              @('categoryName', 'string', '✓', 'Category 名'),
              @('largeClassId', 'int64', '✓', '大分類 ID'),
              @('largeClassName', 'string', '✓', '大分類名'),
              @('mediumClassId', 'int64', '✓', '中分類 ID'),
              @('mediumClassName', 'string', '✓', '中分類名'),
              @('assetItemId', 'int64', '✓', '品目 ID'),
              @('assetItemName', 'string', '✓', '品目名'),
              @('manufacturerId', 'int64', '-', 'メーカー ID'),
              @('manufacturerName', 'string', '-', 'メーカー名'),
              @('modelId', 'int64', '-', '型式 ID'),
              @('modelName', 'string', '-', '型式名'),
              @('jmdnRegisteredItemId', 'int64', '✓', 'JMDN登録品目 ID'),
              @('classCode', 'string', '✓', '類別コード'),
              @('className', 'string', '✓', '類別名称'),
              @('jmdnMediumClassificationName', 'string', '-', 'JMDN中分類名'),
              @('generalName', 'string', '✓', '一般的名称'),
              @('jmdnCode', 'string', '✓', 'JMDNコード'),
              @('marketingName', 'string', '✓', '販売名'),
              @('marketingAuthorizationHolderName', 'string', '-', '製造販売業者等'),
              @('attachmentDocumentFileName', 'string', '-', 'JMDN登録品目に紐づく添付文書ファイル名'),
              @('attachmentDocumentUrl', 'string', '-', 'JMDN登録品目に紐づく添付文書 URL'),
              @('customValues', 'ShipAssetCustomValue[]', '✓', '任意カラム値一覧'),
              @('updatedAt', 'datetime', '✓', '最終更新日時')
            )
          },
          @{
            Title = 'customValues要素（ShipAssetCustomValue）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('columnKey', 'string', '✓', '任意カラムの不変キー'),
              @('valueText', 'string', '-', '任意カラム値。未設定時は `null` または空文字')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'ShipAssetMasterListResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `asset_master_list` なし', 'ErrorResponse'),
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
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_list` が有効であること'
        )
        ProcessingLines = @(
          '一覧取得 API と同一の絞り込み条件、並び順、表示解決ルールを適用する',
          '固定列の後ろに有効任意カラムを可変列として追加する',
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
          '出力列は少なくとも一覧画面の固定表示列と、有効任意カラム列を含む。'
        )
        StatusRows = @(
          @('200', '出力成功', 'Excel File'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `asset_master_list` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産マスタ取込テンプレート取得（/ship-asset-master/assets/template）'
        Overview = 'SHIP 資産マスタ取込用の Excel テンプレートを取得する。有効任意カラムを固定列の後ろに付与し、hidden sheet に `column_key` 対応を持たせる。'
        Method = 'GET'
        Path = '/ship-asset-master/assets/template'
        Auth = '要（Bearer）'
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          'visible sheet には `shipAssetMasterId`、Category、大分類、中分類、品目、メーカー、型式、類別コード、類別名称、JMDN中分類名、一般的名称、JMDNコード、販売名、製造販売業者等、添付文書ファイル名、添付文書URL、および有効任意カラム列を出力する',
          'visible sheet の入力必須列は Category、大分類、中分類、品目、類別コード、類別名称、一般的名称、JMDNコード、販売名とする',
          '`shipAssetMasterId` は既存行更新用の任意列とし、新規登録行では空欄を許容する',
          'hidden sheet `_custom_columns` に `column_key`、`column_name`、`sort_order` を保持する'
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
          @('403', '作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
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
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          'visible sheet の固定列と任意カラム列を解析する',
          'Category / 大分類 / 中分類 / 品目 / 類別コード / 類別名称 / 一般的名称 / JMDNコード / 販売名は必須、JMDN中分類名 / メーカー / 型式 / 製造販売業者等 / 添付文書ファイル名 / 添付文書URLは任意とし、型式が指定される場合はメーカー必須とする',
          '添付文書ファイル名と添付文書URLは両方指定または両方未指定とし、片方のみは行エラーとする',
          'ファイル内で `shipAssetMasterId` が重複する行、または `shipAssetMasterId` 未指定かつ同一組み合わせに正規化される行が複数存在する場合は行エラーとする',
          'hidden sheet `_custom_columns` が存在する場合は `column_key` を優先して任意カラム列を解決し、存在しない場合は表示名一致で補完する',
          'JMDN 固定列から親の JMDN分類・一般的名称と JMDN登録品目の再利用可否を判定し、既存 `JMDNコード` と分類項目が不一致の場合は行エラーとする',
          '不明な任意カラム列、必須不足、桁数超過、階層矛盾、JMDN 不整合は行単位の `validationErrors` へ格納する',
          '検証後の正規化結果、任意カラム定義スナップショット、有効期限を `previewId` 単位で保持する'
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
          @('customColumns', 'ShipAssetCustomColumnSummary[]', '✓', 'プレビュー時点の有効任意カラム定義'),
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
              @('assetItemName', 'string', '✓', '品目名'),
              @('manufacturerName', 'string', '-', 'メーカー名'),
              @('modelName', 'string', '-', '型式名'),
              @('classCode', 'string', '✓', '類別コード'),
              @('className', 'string', '✓', '類別名称'),
              @('jmdnMediumClassificationName', 'string', '-', 'JMDN中分類名'),
              @('generalName', 'string', '✓', '一般的名称'),
              @('jmdnCode', 'string', '✓', 'JMDNコード'),
              @('marketingName', 'string', '✓', '販売名'),
              @('marketingAuthorizationHolderName', 'string', '-', '製造販売業者等'),
              @('attachmentDocumentFileName', 'string', '-', 'JMDN登録品目に紐づく添付文書ファイル名'),
              @('attachmentDocumentUrl', 'string', '-', 'JMDN登録品目に紐づく添付文書 URL'),
              @('resolvedAction', 'string', '✓', 'サーバー解決結果。`CREATE` / `UPDATE` / `REACTIVATE` のいずれか'),
              @('resolvedJmdnAction', 'string', '✓', 'JMDN 解決結果。`REUSE_REGISTERED_ITEM` / `CREATE_REGISTERED_ITEM` のいずれか'),
              @('customValues', 'ShipAssetCustomValue[]', '✓', '任意カラム値一覧'),
              @('validationErrors', 'string[]', '✓', '行エラー一覧。正常行は空配列')
            )
          }
        )
        StatusRows = @(
          @('200', '検証完了', 'ShipAssetMasterImportPreviewResponse'),
          @('400', 'ファイル形式不正、シート解析不能', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
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
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `previewId` が存在し、有効期限内であることを確認する',
          '`errorRows = 0` のプレビューのみ実行可能とし、エラー行を含む場合は 409 `IMPORT_PREVIEW_INVALID` を返す',
          'プレビュー時点の任意カラム定義スナップショットと現行の定義が一致することを確認し、不一致時は 409 `IMPORT_PREVIEW_STALE` を返す',
          '1 プレビュー単位で単一トランザクションを張り、部分成功は許容しない',
          '各行について JMDN 固定列から `jmdn_classifications` / `jmdn_registered_items` を再利用または新規作成し、`ship_asset_masters.jmdn_registered_item_id` を決定する',
          '各行について分割マスタを解決または作成し、`shipAssetMasterId` 指定時は同IDの行へ更新/再有効化、未指定時は同一組み合わせの有効行があれば更新、なければ新規作成する',
          '各行の固定項目と任意カラム値は同一トランザクション内で UPSERT する',
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
          @('403', '作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
          @('404', '対象プレビューが存在しない', 'ErrorResponse'),
          @('409', 'プレビュー期限切れ、プレビューエラー残存、またはプレビュー内容が最新定義と不整合', 'ErrorResponse'),
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
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
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
              @('jmdnMediumClassificationName', 'string', '-', 'JMDN中分類名'),
              @('generalName', 'string', '✓', '一般的名称'),
              @('jmdnCode', 'string', '✓', 'JMDNコード'),
              @('marketingName', 'string', '✓', '販売名'),
              @('marketingAuthorizationHolderName', 'string', '-', '製造販売業者等'),
              @('attachmentDocumentFileName', 'string', '-', 'JMDN登録品目に紐づく添付文書ファイル名'),
              @('attachmentDocumentUrl', 'string', '-', 'JMDN登録品目に紐づく添付文書 URL')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'JmdnRegisteredItemSearchResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
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
          @('jmdnMediumClassificationName', 'string', '-', 'JMDN中分類名'),
          @('generalName', 'string', '✓', '一般的名称'),
          @('jmdnCode', 'string', '✓', 'JMDNコード'),
          @('marketingName', 'string', '✓', '販売名'),
          @('marketingAuthorizationHolderName', 'string', '-', '製造販売業者等'),
          @('attachmentDocumentFileName', 'string', '-', 'JMDN登録品目に紐づく添付文書ファイル名'),
          @('attachmentDocumentUrl', 'string', '-', 'JMDN登録品目に紐づく添付文書 URL')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '`attachmentDocumentFileName` と `attachmentDocumentUrl` は両方指定または両方未指定とし、片方のみは 400 `VALIDATION_ERROR` とする',
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
              @('jmdnMediumClassificationName', 'string', '-', 'JMDN中分類名'),
              @('generalName', 'string', '✓', '一般的名称'),
              @('jmdnCode', 'string', '✓', 'JMDNコード'),
              @('marketingName', 'string', '✓', '販売名'),
              @('marketingAuthorizationHolderName', 'string', '-', '製造販売業者等'),
              @('attachmentDocumentFileName', 'string', '-', 'JMDN登録品目に紐づく添付文書ファイル名'),
              @('attachmentDocumentUrl', 'string', '-', 'JMDN登録品目に紐づく添付文書 URL')
            )
          }
        )
        StatusRows = @(
          @('200', '処理成功', 'JmdnRegisteredItemUpsertResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
          @('409', '既存 JMDNコード と分類項目が不一致', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産マスタ新規作成（/ship-asset-master/assets）'
        Overview = 'SHIP 資産マスタを新規作成する。資産マスタID（`ship_asset_master_id`）はサーバー側で採番し、JMDN登録品目、固定項目、任意カラム値を同一トランザクションで保存する。'
        Method = 'POST'
        Path = '/ship-asset-master/assets'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエスト（ShipAssetMasterCreateRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('categoryId', 'int64', '✓', 'Category ID'),
          @('largeClassName', 'string', '✓', '大分類名'),
          @('mediumClassName', 'string', '✓', '中分類名'),
          @('assetItemName', 'string', '✓', '品目名'),
          @('manufacturerName', 'string', '-', 'メーカー名'),
          @('modelName', 'string', '-', '型式名'),
          @('jmdnRegisteredItemId', 'int64', '✓', 'JMDN登録品目 ID'),
          @('customValues', 'ShipAssetCustomValueUpsert[]', '-', '任意カラム値一覧。未指定列は空欄扱い')
        )
        RequestSubtables = @(
          @{
            Title = 'customValues要素（ShipAssetCustomValueUpsert）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('columnKey', 'string', '✓', '任意カラムの不変キー'),
              @('valueText', 'string', '-', '任意カラム値')
            )
          }
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          'Category / 大分類 / 中分類 / 品目 / `jmdnRegisteredItemId` は必須、メーカー / 型式は任意とする',
          '型式が指定された場合はメーカー必須とし、メーカー未指定の型式入力は 400 `VALIDATION_ERROR` とする',
          '指定された `jmdnRegisteredItemId` が有効な `jmdn_registered_items` に存在することを確認する',
          '大分類 / 中分類 / 品目 / メーカー / 型式の入力値に対応する分割マスタが未登録の場合は、親子関係を保って新規作成する',
          '解決後の組み合わせが既存の有効 `ship_asset_masters` と重複する場合は 409 `DUPLICATE_ASSET_MASTER_COMBINATION` を返す',
          '資産マスタID（`ship_asset_master_id`）はサーバー側で採番する',
          '固定項目と任意カラム値は単一トランザクションで保存し、`customValues` で未指定の有効列は空欄として登録する'
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
            Rows = @(
              @('shipAssetMasterId', 'int64', '✓', '資産マスタID'),
              @('categoryId', 'int64', '✓', 'Category ID'),
              @('categoryName', 'string', '✓', 'Category 名'),
              @('largeClassId', 'int64', '✓', '大分類 ID'),
              @('largeClassName', 'string', '✓', '大分類名'),
              @('mediumClassId', 'int64', '✓', '中分類 ID'),
              @('mediumClassName', 'string', '✓', '中分類名'),
              @('assetItemId', 'int64', '✓', '品目 ID'),
              @('assetItemName', 'string', '✓', '品目名'),
              @('manufacturerId', 'int64', '-', 'メーカー ID'),
              @('manufacturerName', 'string', '-', 'メーカー名'),
              @('modelId', 'int64', '-', '型式 ID'),
              @('modelName', 'string', '-', '型式名'),
              @('jmdnRegisteredItemId', 'int64', '✓', 'JMDN登録品目 ID'),
              @('classCode', 'string', '✓', '類別コード'),
              @('className', 'string', '✓', '類別名称'),
              @('jmdnMediumClassificationName', 'string', '-', 'JMDN中分類名'),
              @('generalName', 'string', '✓', '一般的名称'),
              @('jmdnCode', 'string', '✓', 'JMDNコード'),
              @('marketingName', 'string', '✓', '販売名'),
              @('marketingAuthorizationHolderName', 'string', '-', '製造販売業者等'),
              @('attachmentDocumentFileName', 'string', '-', 'JMDN登録品目に紐づく添付文書ファイル名'),
              @('attachmentDocumentUrl', 'string', '-', 'JMDN登録品目に紐づく添付文書 URL'),
              @('customValues', 'ShipAssetCustomValue[]', '✓', '任意カラム値一覧'),
              @('createdAt', 'datetime', '✓', '作成日時'),
              @('updatedAt', 'datetime', '✓', '更新日時')
            )
          }
        )
        StatusRows = @(
          @('201', '登録成功', 'ShipAssetMasterDetailResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
          @('404', '指定した JMDN登録品目が存在しない', 'ErrorResponse'),
          @('409', '組み合わせ重複、または任意カラム不正', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産マスタ更新（/ship-asset-master/assets/{shipAssetMasterId}）'
        Overview = '指定した SHIP 資産マスタを更新する。資産マスタID（`ship_asset_master_id`）をキーに、JMDN登録品目、固定項目、任意カラム値を同一トランザクションで更新する。'
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
          @('assetItemName', 'string', '✓', '品目名'),
          @('manufacturerName', 'string', '-', 'メーカー名'),
          @('modelName', 'string', '-', '型式名'),
          @('jmdnRegisteredItemId', 'int64', '✓', 'JMDN登録品目 ID'),
          @('customValues', 'ShipAssetCustomValueUpsert[]', '-', '任意カラム値一覧。未指定列は空欄扱い')
        )
        RequestSubtables = @(
          @{
            Title = 'customValues要素（ShipAssetCustomValueUpsert）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('columnKey', 'string', '✓', '任意カラムの不変キー'),
              @('valueText', 'string', '-', '任意カラム値')
            )
          }
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `ship_asset_masters` が存在し、有効であることを確認する',
          '指定された `jmdnRegisteredItemId` が有効な `jmdn_registered_items` に存在することを確認する',
          '解決後の組み合わせが自身以外の有効 `ship_asset_masters` と重複する場合は 409 `DUPLICATE_ASSET_MASTER_COMBINATION` を返す',
          '必要に応じて分割マスタを作成または更新し、対象資産マスタの固定項目を更新する',
          '`jmdn_registered_item_id` を更新し、JMDN 表示項目は参照先の `jmdn_registered_items` / `jmdn_classifications` に従って返却する',
          '`ship_asset_master_id` は更新不可とし、レスポンスで現在値を返す',
          '任意カラム値は `(ship_asset_master_id, custom_column_id)` 単位で UPSERT し、未指定の有効列は空欄へ更新する'
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
            Rows = @(
              @('shipAssetMasterId', 'int64', '✓', '資産マスタID'),
              @('categoryId', 'int64', '✓', 'Category ID'),
              @('categoryName', 'string', '✓', 'Category 名'),
              @('largeClassId', 'int64', '✓', '大分類 ID'),
              @('largeClassName', 'string', '✓', '大分類名'),
              @('mediumClassId', 'int64', '✓', '中分類 ID'),
              @('mediumClassName', 'string', '✓', '中分類名'),
              @('assetItemId', 'int64', '✓', '品目 ID'),
              @('assetItemName', 'string', '✓', '品目名'),
              @('manufacturerId', 'int64', '-', 'メーカー ID'),
              @('manufacturerName', 'string', '-', 'メーカー名'),
              @('modelId', 'int64', '-', '型式 ID'),
              @('modelName', 'string', '-', '型式名'),
              @('jmdnRegisteredItemId', 'int64', '✓', 'JMDN登録品目 ID'),
              @('classCode', 'string', '✓', '類別コード'),
              @('className', 'string', '✓', '類別名称'),
              @('jmdnMediumClassificationName', 'string', '-', 'JMDN中分類名'),
              @('generalName', 'string', '✓', '一般的名称'),
              @('jmdnCode', 'string', '✓', 'JMDNコード'),
              @('marketingName', 'string', '✓', '販売名'),
              @('marketingAuthorizationHolderName', 'string', '-', '製造販売業者等'),
              @('attachmentDocumentFileName', 'string', '-', 'JMDN登録品目に紐づく添付文書ファイル名'),
              @('attachmentDocumentUrl', 'string', '-', 'JMDN登録品目に紐づく添付文書 URL'),
              @('customValues', 'ShipAssetCustomValue[]', '✓', '任意カラム値一覧'),
              @('createdAt', 'datetime', '✓', '作成日時'),
              @('updatedAt', 'datetime', '✓', '更新日時')
            )
          }
        )
        StatusRows = @(
          @('200', '更新成功', 'ShipAssetMasterDetailResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
          @('404', '対象 SHIP 資産マスタまたは指定した JMDN登録品目が存在しない', 'ErrorResponse'),
          @('409', '組み合わせ重複、または任意カラム不正', 'ErrorResponse'),
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
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `ship_asset_masters` が存在することを確認する',
          '`ship_asset_masters.is_active = false` へ更新する',
          '`asset_ledgers` や `edit_list_items` の `ship_asset_master_id` は保持し、履歴参照は壊さない',
          '既存の `ship_asset_master_custom_values` は保持する'
        )
        ResponseTitle = 'レスポンス'
        ResponseLines = @(
          'Body: なし'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
          @('404', '対象 SHIP 資産マスタが存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '任意カラム一覧取得（/ship-asset-master/custom-columns）'
        Overview = '任意カラム設定モーダルで使用する任意カラム定義一覧を取得する。既定では有効/削除済みの両方を返却する。'
        Method = 'GET'
        Path = '/ship-asset-master/custom-columns'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('includeInactive', 'query', 'boolean', '-', '削除済み列を含めるか。省略時は `true`')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '`includeInactive=true` の場合は有効/削除済みの両方を返却する',
          '並び順は `is_active DESC, sort_order ASC, ship_asset_master_custom_column_id ASC` とする',
          '`column_key` はシステム生成値として返却し、画面からの編集対象にしない'
        )
        ResponseTitle = 'レスポンス（200：ShipAssetCustomColumnListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '返却件数'),
          @('items', 'ShipAssetCustomColumnDetail[]', '✓', '任意カラム定義一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（ShipAssetCustomColumnDetail）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('customColumnId', 'int64', '✓', '任意カラム ID'),
              @('columnKey', 'string', '✓', '任意カラムの不変キー'),
              @('columnName', 'string', '✓', '表示名'),
              @('sortOrder', 'int32', '-', '表示順'),
              @('isActive', 'boolean', '✓', '有効フラグ'),
              @('createdAt', 'datetime', '✓', '作成日時'),
              @('updatedAt', 'datetime', '✓', '更新日時')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'ShipAssetCustomColumnListResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '任意カラム新規作成（/ship-asset-master/custom-columns）'
        Overview = '任意カラム定義を新規作成する。`column_key` はサーバー側で生成し、`column_name` は有効列同士で重複不可とする。'
        Method = 'POST'
        Path = '/ship-asset-master/custom-columns'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエスト（ShipAssetCustomColumnCreateRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('columnName', 'string', '✓', '任意カラム表示名'),
          @('sortOrder', 'int32', '-', '表示順')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '`columnName` は `is_active = true` の有効列同士で重複不可とする',
          '`columnKey` はサーバー側で生成し、以後更新不可とする',
          '`sortOrder` 未指定時は `0` を採用する',
          '既存の資産マスタ行には対応する `ship_asset_master_custom_values` を即時作成せず、未入力は空欄扱いとする'
        )
        ResponseTitle = 'レスポンス（201：ShipAssetCustomColumnResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'ShipAssetCustomColumnDetail', '✓', '登録後の任意カラム定義')
        )
        ResponseSubtables = @(
          @{
            Title = 'item要素（ShipAssetCustomColumnDetail）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('customColumnId', 'int64', '✓', '任意カラム ID'),
              @('columnKey', 'string', '✓', '任意カラムの不変キー'),
              @('columnName', 'string', '✓', '表示名'),
              @('sortOrder', 'int32', '-', '表示順'),
              @('isActive', 'boolean', '✓', '有効フラグ'),
              @('createdAt', 'datetime', '✓', '作成日時'),
              @('updatedAt', 'datetime', '✓', '更新日時')
            )
          }
        )
        StatusRows = @(
          @('201', '登録成功', 'ShipAssetCustomColumnResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
          @('409', '有効任意カラム名が重複', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '任意カラム更新（/ship-asset-master/custom-columns/{customColumnId}）'
        Overview = '任意カラム定義を更新する。更新対象は `column_name` と `sort_order` のみで、`column_key` は変更不可とする。'
        Method = 'PUT'
        Path = '/ship-asset-master/custom-columns/{customColumnId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('customColumnId', 'path', 'int64', '✓', '更新対象の任意カラム ID')
        )
        RequestTitle = 'リクエスト（ShipAssetCustomColumnUpdateRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('columnName', 'string', '✓', '更新後の任意カラム表示名'),
          @('sortOrder', 'int32', '-', '更新後の表示順')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象任意カラムが存在し、有効であることを確認する',
          '`columnName` は有効列同士で重複不可とする',
          '`columnKey` は保持し、更新しない',
          '既存の `ship_asset_master_custom_values` および `edit_list_item_custom_values` はそのまま維持する'
        )
        ResponseTitle = 'レスポンス（200：ShipAssetCustomColumnResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'ShipAssetCustomColumnDetail', '✓', '更新後の任意カラム定義')
        )
        ResponseSubtables = @(
          @{
            Title = 'item要素（ShipAssetCustomColumnDetail）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('customColumnId', 'int64', '✓', '任意カラム ID'),
              @('columnKey', 'string', '✓', '任意カラムの不変キー'),
              @('columnName', 'string', '✓', '表示名'),
              @('sortOrder', 'int32', '-', '表示順'),
              @('isActive', 'boolean', '✓', '有効フラグ'),
              @('createdAt', 'datetime', '✓', '作成日時'),
              @('updatedAt', 'datetime', '✓', '更新日時')
            )
          }
        )
        StatusRows = @(
          @('200', '更新成功', 'ShipAssetCustomColumnResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
          @('404', '対象任意カラムが存在しない', 'ErrorResponse'),
          @('409', '有効任意カラム名が重複', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '任意カラム削除（/ship-asset-master/custom-columns/{customColumnId}）'
        Overview = '任意カラム定義を論理削除する。既存値は保持し、新規入力候補・表示列候補・Data Link 候補から除外する。'
        Method = 'DELETE'
        Path = '/ship-asset-master/custom-columns/{customColumnId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('customColumnId', 'path', 'int64', '✓', '削除対象の任意カラム ID')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象任意カラムが存在することを確認する',
          '`ship_asset_master_custom_columns.is_active = false` へ更新する',
          '`ship_asset_master_custom_values` と `edit_list_item_custom_values` の既存値は削除しない',
          'テンプレート、インポート、一覧表示、Data Link 候補には以後含めない'
        )
        ResponseTitle = 'レスポンス'
        ResponseLines = @(
          'Body: なし'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `asset_master_edit` なし', 'ErrorResponse'),
          @('404', '対象任意カラムが存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '必要権限' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定基準', '説明'); Rows = @(
      @('一覧表示 / ポップアップ候補取得 / エクスポート', '`asset_master_list`', 'Bearer トークン上の作業対象施設に対して実効 `asset_master_list` を持つこと', '一覧参照系処理'),
      @('テンプレート取得 / インポートプレビュー / インポート', '`asset_master_edit`', 'Bearer トークン上の作業対象施設に対して実効 `asset_master_edit` を持つこと', '一括更新処理'),
      @('JMDN登録品目検索 / JMDN作成', '`asset_master_edit`', 'Bearer トークン上の作業対象施設に対して実効 `asset_master_edit` を持つこと', '資産マスタ編集モーダル内の JMDN 選択/作成処理'),
      @('新規作成 / 更新 / 削除', '`asset_master_edit`', 'Bearer トークン上の作業対象施設に対して実効 `asset_master_edit` を持つこと', '資産マスタ管理処理'),
      @('任意カラム一覧 / 新規作成 / 更新 / 削除', '`asset_master_edit`', 'Bearer トークン上の作業対象施設に対して実効 `asset_master_edit` を持つこと', '任意カラム設定処理')
    ) },
    @{ Type = 'Heading2'; Text = '階層マスタ解決ルール' },
    @{ Type = 'Bullets'; Items = @(
      'Category は既存 ID 指定を必須とする',
      '大分類 / 中分類 / 品目 / メーカー / 型式は名称入力を受け付け、親子関係に合致する既存行があれば再利用し、なければ新規作成する',
      'メーカーと型式は任意とし、Category から品目までが確定していればメーカー / 型式未設定の資産マスタを登録できる',
      '型式を入力した場合はメーカー必須とする',
      '解決後の組み合わせは `ship_asset_masters` 上で一意とする'
    ) },
    @{ Type = 'Heading2'; Text = 'JMDN運用ルール' },
    @{ Type = 'Bullets'; Items = @(
      'SHIP資産マスタの新規作成 / 更新では `jmdnRegisteredItemId` を必須とし、JMDN 表示項目は常に `jmdn_registered_items` と親の `jmdn_classifications` から解決する',
      'JMDN検索モーダルは既存の `jmdn_registered_items` を検索して選択させ、検索結果がない場合のみ JMDN作成 API を呼び出す',
      '`POST /ship-asset-master/jmdn-registered-items` は既存 `JMDNコード` がある場合に分類項目一致を必須とし、不一致時は 409 `JMDN_CLASSIFICATION_CONFLICT` を返す',
      '`attachmentDocumentFileName` と `attachmentDocumentUrl` は両方設定または両方未設定とし、片方のみは許可しない',
      '同一分類配下で `販売名` / `製造販売業者等` / `添付文書ファイル名` / `添付文書URL` の正規化後組み合わせが一致する JMDN登録品目は再利用し、重複作成しない',
      '添付文書は `jmdn_registered_items.attachment_file_name` を一覧表示用の安定ファイル名、`jmdn_registered_items.attachment_url` をリンク先として返却する read-only 項目とし、SHIP資産マスタ固有の Document 列は持たない',
      'SHIP資産マスタを削除しても `jmdn_classifications` / `jmdn_registered_items` は削除しない'
    ) },
    @{ Type = 'Heading2'; Text = '任意カラム運用ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`column_key` はシステム生成の不変キーとし、画面/API から変更できない',
      '`column_name` は有効列同士で重複不可とする',
      '任意カラム削除は論理削除（`is_active=false`）とし、既存値は保持する',
      '資産マスタ作成/更新では、有効任意カラムの未指定値を空欄として扱う',
      '編集リストへ転記された任意カラム値は `edit_list_item_custom_values` に独立保持され、親 SHIP 資産マスタ更新には自動追従しない'
    ) },
    @{ Type = 'Heading2'; Text = 'インポート運用ルール' },
    @{ Type = 'Bullets'; Items = @(
      'テンプレートの `shipAssetMasterId` は既存行更新用の任意列とし、空欄時は新規行として扱う',
      'インポートの必須固定列は Category、大分類、中分類、品目、類別コード、類別名称、一般的名称、JMDNコード、販売名とする',
      '`REPLACE` ではファイルに含まれない有効資産マスタを論理削除するが、既存資産・編集リストからの参照は保持する',
      'インポートはプレビュー単位で全件成功/全件失敗の一括トランザクションとする',
      'プレビュー後に任意カラム定義が変更された場合は、再プレビューを要求する',
      '有効任意カラムはテンプレート/エクスポート/インポートの固定列後ろに常に同じ順序で付与する',
      'JMDN 固定列はインポート時に `jmdn_classifications` / `jmdn_registered_items` の再利用または新規作成へ使用し、既存 `JMDNコード` と分類項目が不一致の行はエラーとする'
    ) },
    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '説明'); Rows = @(
      @('VALIDATION_ERROR', '400', '必須不足、桁数超過、形式不正、条件付き必須違反'),
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
      @('AUTH_403_ASSET_MASTER_LIST_DENIED', '403', '作業対象施設に対する実効 `asset_master_list` がない'),
      @('AUTH_403_ASSET_MASTER_EDIT_DENIED', '403', '作業対象施設に対する実効 `asset_master_edit` がない'),
      @('SHIP_ASSET_MASTER_NOT_FOUND', '404', '対象 SHIP 資産マスタが存在しない'),
      @('JMDN_REGISTERED_ITEM_NOT_FOUND', '404', '指定した JMDN登録品目が存在しない'),
      @('CUSTOM_COLUMN_NOT_FOUND', '404', '対象任意カラムが存在しない'),
      @('DUPLICATE_ASSET_MASTER_COMBINATION', '409', 'Category から型式までの組み合わせが重複している'),
      @('JMDN_CLASSIFICATION_CONFLICT', '409', '既存 JMDNコード と入力した分類項目が一致しない'),
      @('DUPLICATE_CUSTOM_COLUMN_NAME', '409', '有効任意カラム名が重複している'),
      @('IMPORT_PREVIEW_NOT_FOUND', '404', '対象プレビューが存在しない'),
      @('IMPORT_PREVIEW_INVALID', '409', 'プレビューにエラー行が残っている、または実行条件を満たしていない'),
      @('IMPORT_PREVIEW_STALE', '409', 'プレビュー時点と現在の任意カラム定義が不整合である'),
      @('IMPORT_FILE_INVALID', '400', '取込ファイル形式不正、またはテンプレート構造不正'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー')
    ) }
  )
}
