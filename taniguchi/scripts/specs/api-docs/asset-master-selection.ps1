@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_資産マスタ選択.docx'
  ScreenLabel = '資産マスタ選択'
  CoverDateText = '2026年6月5日'
  RevisionDateText = '2026/6/5'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、資産マスタ選択画面（`/asset-master`）で利用する API の設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。' },
    @{ Type = 'Paragraph'; Text = '資産マスタ選択画面は、他画面から開かれる参照専用のポップアップであり、選択候補となる SHIP資産マスタの検索取得とフィルター候補取得を API の責務とする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      '資産マスタ選択画面の候補一覧取得 I/F',
      'Category / 大分類 / 中分類 / 個体管理品目 / メーカー / 型式のフィルター候補取得 I/F',
      'SHIP資産マスタ管理画面（`/ship-asset-master`）との責務分離',
      '選択結果の保存を呼び出し元画面の保存 API に委譲する方針',
      '認可、バリデーション、エラーレスポンス'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '対象システムは医療機器管理システムである。本機能は、現有品調査、資産台帳突き合わせ、編集リスト、購入/更新申請、見積明細の個体品目紐付けなどから共通利用される資産マスタ選択用の参照機能である。' },
    @{ Type = 'Paragraph'; Text = '本画面は SHIP資産マスタの作成・更新・削除、JMDN検索/作成、固定属性編集、Excel入出力を扱わない。これらは No.14 SHIP資産マスタ API設計書を正本とする。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('資産マスタ選択画面', '他画面からポップアップとして開き、SHIP資産マスタ候補を検索・選択して親画面へ返却する参照専用画面'),
      @('SHIP資産マスタ', 'Category / 大分類 / 中分類 / 明細区分 / 品目 / メーカー / 型式の組み合わせを 1 件で表す共通マスタ。実体は `ship_asset_masters`'),
      @('資産マスタID', '`ship_asset_masters.ship_asset_master_id`。画面および下流テーブルでは `shipAssetMasterId` / `ship_asset_master_id` として扱う'),
      @('フィルター候補', 'Category / 大分類 / 中分類 / 個体管理品目 / メーカー / 型式の選択肢。資産マスタ候補に存在する有効な組み合わせから生成する'),
      @('画面間連携', '`ASSET_SELECTED` や `SET_MATCH_TARGET` など、フロントエンドの `postMessage` による親子画面連携。本APIのリクエスト/レスポンス分岐条件にはしない')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('項目', '内容'); Rows = @(
      @('画面名', '30. 資産マスタ選択画面'),
      @('画面URL', '/asset-master'),
      @('主機能', '資産マスタ候補の検索、単一選択、親画面への選択結果返却'),
      @('一覧カラム', '選択 / No. / Category / 大分類 / 中分類 / 個体管理品目 / メーカー / 型式')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = '資産マスタ選択APIの位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、資産マスタ選択画面の初期表示、検索、フィルター変更時に利用する参照専用 API である。返却対象は有効な `ship_asset_masters` と、その分類階層・メーカー・型式の表示情報に限定する。' },
    @{ Type = 'Paragraph'; Text = '選択結果の保存、呼び出し元明細への反映、台帳や申請・編集リストへの永続化は、各呼び出し元画面の保存 API が責務を持つ。本APIでは保存処理を行わない。' },
    @{ Type = 'Heading2'; Text = '画面とAPIの関係' },
    @{ Type = 'Table'; Headers = @('画面操作', 'API', '補足'); Rows = @(
      @('画面初期表示', 'GET /asset-master/filter-options、GET /asset-master/assets', 'フィルター候補と初期一覧を取得する'),
      @('キーワード検索', 'GET /asset-master/assets', 'Category / 大分類 / 中分類 / 個体管理品目 / メーカー / 型式 / 資産マスタIDを対象に検索する'),
      @('Category / 大分類 / 中分類 / 個体管理品目 / メーカー / 型式フィルター変更', 'GET /asset-master/filter-options、GET /asset-master/assets', '選択済み上位条件に応じて候補と一覧を再取得する'),
      @('適用', 'API呼び出しなし', '選択結果はフロントエンドの画面間連携で親画面へ返却する。保存は呼び出し元画面の保存APIで扱う'),
      @('閉じる', 'API呼び出しなし', '親画面へ選択結果を返却せずポップアップを閉じる')
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル', '利用内容', '主な項目'); Rows = @(
      @('users', '共有システム管理者アカウント判定', 'user_id, account_type'),
      @('facilities', '作業対象施設の存在確認、共有システム管理者アカウントの未削除施設判定', 'facility_id, deleted_at'),
      @('user_facility_assignments', '通常アカウントの作業対象施設割当判定', 'user_id, facility_id, is_active, valid_from, valid_to'),
      @('facility_feature_settings', '通常アカウントの作業対象施設における `asset_master_list` 提供有無判定', 'facility_id, feature_code, is_enabled'),
      @('user_facility_feature_settings', '通常アカウントのユーザー×作業対象施設単位の `asset_master_list` 利用可否判定', 'user_facility_assignment_id, feature_code, is_enabled'),
      @('ship_asset_masters', '資産マスタ選択候補の取得', 'ship_asset_master_id, category_id, large_class_id, medium_class_id, asset_item_id, manufacturer_id, model_id, is_active'),
      @('asset_categories', 'Category 表示名とフィルター候補の取得', 'category_id, category_name, sort_order, is_active'),
      @('asset_large_classes', '大分類表示名とフィルター候補の取得', 'large_class_id, category_id, large_class_name, sort_order, is_active'),
      @('asset_medium_classes', '中分類表示名とフィルター候補の取得', 'medium_class_id, large_class_id, medium_class_name, sort_order, is_active'),
      @('asset_items', '個体管理品目表示名とフィルター候補の取得', 'asset_item_id, medium_class_id, item_name, is_active'),
      @('manufacturers', 'メーカー表示名とフィルター候補の取得', 'manufacturer_id, asset_item_id, manufacturer_name, is_active'),
      @('models', '型式表示名とフィルター候補の取得', 'model_id, manufacturer_id, model_name, is_active')
    ) },
    @{ Type = 'Paragraph'; Text = '`ship_asset_master_details`、`jmdn_classifications`、`jmdn_registered_items` は本画面の一覧カラムに含めないため、本APIの参照対象に含めない。薬事・設備情報・資産情報・PMDA提供・登録状況や JMDN 情報は No.14 SHIP資産マスタ API設計書を正本とする。' },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-06-05T00:00:00Z`）',
      '資産マスタ候補は `ship_asset_masters.is_active=true` の有効データのみ返却する',
      '分類階層・メーカー・型式マスタも `is_active=true` の有効データのみ返却する',
      '返却対象は共通マスタであり、施設単位で候補を絞り込まない'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '本API群で使用する `feature_code` は `asset_master_list` とする。通常アカウントでは、Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_list` が `is_enabled=true` の場合に API 実行を許可する。共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）では、作業対象施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず、`asset_master_list` を有効として扱う。' },
    @{ Type = 'Table'; Headers = @('管理単位名', 'feature_code', '対象処理'); Rows = @(
      @('資産マスタ / 一覧', '`asset_master_list`', '資産マスタ選択候補一覧取得、フィルター候補取得')
    ) },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('候補一覧取得', '`asset_master_list`', '通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`。共有システム管理者: `users`, `facilities`', '資産マスタ選択候補の参照'),
      @('フィルター候補取得', '`asset_master_list`', '通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`。共有システム管理者: `users`, `facilities`', 'Category / 大分類 / 中分類 / 個体管理品目 / メーカー / 型式候補の参照')
    ) },
    @{ Type = 'Heading2'; Text = '検索・絞り込み仕様' },
    @{ Type = 'Bullets'; Items = @(
      'キーワード検索は `ship_asset_master_id`、Category、大分類、中分類、個体管理品目、メーカー、型式の表示名を対象に部分一致で判定する',
      'Category / 大分類 / 中分類 / 個体管理品目 / メーカー / 型式のID条件は AND 条件で適用する',
      '親子階層の整合が取れないID組み合わせは結果0件として扱う',
      '候補一覧の既定ソートは Category sort_order、 大分類 sort_order、中分類 sort_order、品目名、メーカー名、型式名、ship_asset_master_id の昇順とする',
      'No.列はレスポンスの `displayNo` を用いる。絞り込み後一覧内の1始まり連番とする'
    ) },
    @{ Type = 'Heading2'; Text = '一覧取得件数仕様' },
    @{ Type = 'Bullets'; Items = @(
      '画面モックに合わせ、一覧取得APIにページング系パラメータは設けない',
      'レスポンスには `totalCount` と `items` を含め、検索条件に一致する有効な資産マスタ候補を返却する',
      '`displayNo` は返却配列内の表示順として算出する'
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Heading3'; Text = '基本エラーレスポンス（ErrorResponse）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや補足情報')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API一覧' },
    @{ Type = 'Heading2'; Text = '資産マスタ選択（/asset-master）' },
    @{ Type = 'Table'; Headers = @('機能名', 'Method', 'Path', '概要', '認証'); Rows = @(
      @('資産マスタ選択候補一覧取得', 'GET', '/asset-master/assets', '資産マスタ選択画面の一覧候補を検索取得する', '要'),
      @('資産マスタ選択フィルター候補取得', 'GET', '/asset-master/filter-options', '資産マスタ選択画面のフィルター候補を取得する', '要')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 資産マスタ選択機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '資産マスタ選択候補一覧取得（/asset-master/assets）'
        Overview = '資産マスタ選択画面の一覧候補を検索取得する。画面一覧に表示する `選択 / No. / Category / 大分類 / 中分類 / 個体管理品目 / メーカー / 型式` のうち、選択制御を除く表示項目と、親画面へ返却する `shipAssetMasterId` を返す。'
        Method = 'GET'
        Path = '/asset-master/assets'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('keyword', 'query', 'string', '-', 'キーワード。資産マスタID、Category、大分類、中分類、個体管理品目、メーカー、型式の部分一致検索'),
          @('categoryId', 'query', 'int64', '-', 'Category ID'),
          @('largeClassId', 'query', 'int64', '-', '大分類ID'),
          @('mediumClassId', 'query', 'int64', '-', '中分類ID'),
          @('assetItemId', 'query', 'int64', '-', '個体管理品目ID'),
          @('manufacturerId', 'query', 'int64', '-', 'メーカーID'),
          @('modelId', 'query', 'int64', '-', '型式ID')
        )
        PermissionLines = @(
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `asset_master_list` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_list` が有効であること'
        )
        ProcessingLines = @(
          'Bearer トークン上の作業対象施設が存在し、未削除であることを確認する',
          '`ship_asset_masters.is_active=true` の有効資産マスタを対象とする',
          '`asset_categories`、`asset_large_classes`、`asset_medium_classes`、`asset_items`、`manufacturers`、`models` を JOIN し、各表示名とIDを解決する',
          'JOIN先マスタはいずれも `is_active=true` の有効データのみ対象とする',
          '指定されたID条件は AND 条件で適用する',
          '親子階層の整合が取れないID組み合わせは結果0件として返す',
          'キーワードは `ship_asset_master_id` の文字列表現と、Category / 大分類 / 中分類 / 個体管理品目 / メーカー / 型式の表示名に部分一致で適用する',
          'JMDN情報、薬事、設備情報、資産情報、PMDA提供、登録状況の固定属性は本APIでは返却しない',
          '既定ソートは Category sort_order、 大分類 sort_order、中分類 sort_order、品目名、メーカー名、型式名、ship_asset_master_id の昇順とする',
          '`displayNo` は絞り込み後全体結果に対する1始まりの連番として算出する'
        )
        ResponseTitle = 'レスポンス（200：AssetMasterSelectionListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '絞り込み後の総件数'),
          @('items', 'AssetMasterSelectionItem[]', '✓', '資産マスタ候補一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（AssetMasterSelectionItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('displayNo', 'int32', '✓', '一覧の No. 列に表示する連番'),
              @('shipAssetMasterId', 'int64', '✓', 'SHIP資産マスタID。親画面の保存APIへ渡す正本ID'),
              @('categoryId', 'int64', '✓', 'Category ID'),
              @('categoryName', 'string', '✓', 'Category 表示名'),
              @('largeClassId', 'int64', '✓', '大分類ID'),
              @('largeClassName', 'string', '✓', '大分類表示名'),
              @('mediumClassId', 'int64', '✓', '中分類ID'),
              @('mediumClassName', 'string', '✓', '中分類表示名'),
              @('assetItemId', 'int64', '✓', '個体管理品目ID'),
              @('assetItemName', 'string', '✓', '個体管理品目表示名'),
              @('manufacturerId', 'int64', '✓', 'メーカーID'),
              @('manufacturerName', 'string', '✓', 'メーカー表示名'),
              @('modelId', 'int64', '✓', '型式ID'),
              @('modelName', 'string', '✓', '型式表示名')
            )
          }
        )
        ExtraTables = @(
          @{
            Title = '画面表示カラムとの対応'
            Headers = @('画面カラム', 'レスポンス項目', '補足')
            Rows = @(
              @('選択', 'クライアント側状態', 'APIレスポンスには含めない。ラジオボタンの選択状態は画面内で保持する'),
              @('No.', 'displayNo', '絞り込み後全体結果内の連番'),
              @('Category', 'categoryName', 'Category 表示名'),
              @('大分類', 'largeClassName', '大分類表示名'),
              @('中分類', 'mediumClassName', '中分類表示名'),
              @('個体管理品目', 'assetItemName', '個体管理品目表示名'),
              @('メーカー', 'manufacturerName', 'メーカー表示名'),
              @('型式', 'modelName', '型式表示名')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'AssetMasterSelectionListResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `asset_master_list` なし', 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、または削除済み', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '資産マスタ選択フィルター候補取得（/asset-master/filter-options）'
        Overview = '資産マスタ選択画面のフィルター候補を取得する。選択済み条件がある場合は、有効な SHIP資産マスタの組み合わせに存在する候補だけへ絞り込む。'
        Method = 'GET'
        Path = '/asset-master/filter-options'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('categoryId', 'query', 'int64', '-', '選択済み Category ID'),
          @('largeClassId', 'query', 'int64', '-', '選択済み大分類ID'),
          @('mediumClassId', 'query', 'int64', '-', '選択済み中分類ID'),
          @('assetItemId', 'query', 'int64', '-', '選択済み個体管理品目ID'),
          @('manufacturerId', 'query', 'int64', '-', '選択済みメーカーID'),
          @('modelId', 'query', 'int64', '-', '選択済み型式ID')
        )
        PermissionLines = @(
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `asset_master_list` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_master_list` が有効であること'
        )
        ProcessingLines = @(
          'Bearer トークン上の作業対象施設が存在し、未削除であることを確認する',
          '`ship_asset_masters.is_active=true` の有効資産マスタを母集団とする',
          'JOIN先の Category / 大分類 / 中分類 / 個体管理品目 / メーカー / 型式マスタはいずれも `is_active=true` の有効データのみ対象とする',
          '指定済みID条件を母集団へ適用し、条件に一致する資産マスタ組み合わせから各階層の候補を重複排除して返す',
          '親子階層の整合が取れないID組み合わせは各候補配列を空で返す',
          '候補の並び順は各マスタの `sort_order` がある場合はそれを優先し、ない場合は表示名、ID の昇順とする',
          'フィルター候補取得は選択画面の候補絞り込み用であり、選択結果の保存は行わない'
        )
        ResponseTitle = 'レスポンス（200：AssetMasterSelectionFilterOptionsResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('categories', 'MasterFilterOption[]', '✓', 'Category候補'),
          @('largeClasses', 'MasterFilterOption[]', '✓', '大分類候補'),
          @('mediumClasses', 'MasterFilterOption[]', '✓', '中分類候補'),
          @('assetItems', 'MasterFilterOption[]', '✓', '個体管理品目候補'),
          @('manufacturers', 'MasterFilterOption[]', '✓', 'メーカー候補'),
          @('models', 'MasterFilterOption[]', '✓', '型式候補')
        )
        ResponseSubtables = @(
          @{
            Title = '各候補要素（MasterFilterOption）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('id', 'int64', '✓', '候補ID'),
              @('label', 'string', '✓', '画面表示名'),
              @('parentId', 'int64|null', '-', '親候補ID。Categoryは null、大分類は categoryId、中分類は largeClassId、個体管理品目は mediumClassId、メーカーは assetItemId、型式は manufacturerId')
            )
          }
        )
        ExtraTables = @(
          @{
            Title = '候補配列と参照元'
            Headers = @('レスポンス項目', '参照元テーブル', '親項目')
            Rows = @(
              @('categories', '`asset_categories`', 'なし'),
              @('largeClasses', '`asset_large_classes`', 'categoryId'),
              @('mediumClasses', '`asset_medium_classes`', 'largeClassId'),
              @('assetItems', '`asset_items`', 'mediumClassId'),
              @('manufacturers', '`manufacturers`', 'assetItemId'),
              @('models', '`models`', 'manufacturerId')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'AssetMasterSelectionFilterOptionsResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `asset_master_list` なし', 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、または削除済み', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '権限対応表' },
    @{ Type = 'Table'; Headers = @('API', '必要 feature_code', '説明'); Rows = @(
      @('GET /asset-master/assets', '`asset_master_list`', '資産マスタ選択候補一覧を参照する'),
      @('GET /asset-master/filter-options', '`asset_master_list`', '資産マスタ選択画面のフィルター候補を参照する')
    ) },
    @{ Type = 'Heading2'; Text = '保存責務' },
    @{ Type = 'Bullets'; Items = @(
      '本API群は参照専用とし、`ship_asset_masters` や呼び出し元テーブルを更新しない',
      '選択した `shipAssetMasterId` の保存は、資産台帳突き合わせ、現有品調査内容修正、編集リスト、購入/更新申請、見積明細紐付けなど、呼び出し元画面の保存APIで扱う',
      '資産台帳突き合わせでは、呼び出し元の `PUT /asset-matching/rows/{assetImportRowId}` が `selected_ship_asset_master_id` と分類階層・メーカー・型式の選択値を保存する',
      '原本資産台帳への `asset_ledgers.ship_asset_master_id` 反映は、原本確定系APIの責務とする'
    ) },
    @{ Type = 'Heading2'; Text = '画面間連携との責務境界' },
    @{ Type = 'Bullets'; Items = @(
      '`?mode=simple` は画面側の表示/返却制御であり、本APIの検索条件にはしない',
      '`ASSET_SELECTED` と `SET_MATCH_TARGET` はフロントエンドの `postMessage` 仕様であり、APIレスポンスには含めない',
      '適用後にウィンドウを閉じない制御や、親画面でどの入力項目へ反映するかは画面設計・呼び出し元画面要件で扱う',
      '本APIは、親画面が保存APIへ渡すための正本IDと表示名を返すところまでを責務とする'
    ) },
    @{ Type = 'Heading2'; Text = 'SHIP資産マスタ管理画面との責務境界' },
    @{ Type = 'Bullets'; Items = @(
      '資産マスタの作成・更新・削除は No.14 SHIP資産マスタ API設計書を正本とする',
      'JMDN検索/作成、固定属性、Excelエクスポート/テンプレート/インポートは本APIに含めない',
      '本APIで返却する一覧項目は、選択画面の一覧カラムに必要な Category / 大分類 / 中分類 / 個体管理品目 / メーカー / 型式に限定する'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラー仕様' },
    @{ Type = 'Heading2'; Text = 'エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '内容', '発生条件'); Rows = @(
      @('VALIDATION_ERROR', '400', '入力値不正', 'ID条件の型不正など'),
      @('UNAUTHORIZED', '401', '未認証', 'Bearer トークンが未指定または無効'),
      @('FORBIDDEN', '403', '権限不足', '通常アカウントで作業対象施設に対する実効 `asset_master_list` がない'),
      @('TARGET_FACILITY_NOT_FOUND', '404', '作業対象施設なし', 'Bearer トークン上の作業対象施設が存在しない、または削除済み'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー', '想定外エラー')
    ) },
    @{ Type = 'Heading2'; Text = '入力値不正の扱い' },
    @{ Type = 'Bullets'; Items = @(
      'ID系パラメータに数値として解釈できない値が指定された場合は 400 とする',
      '指定IDが存在しない、無効、または親子関係に整合しない場合は 200 の空結果を返す。これはフィルター条件に合致する候補がない状態として扱う'
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = '監査ログ' },
    @{ Type = 'Paragraph'; Text = '本API群は参照専用であり、業務データを更新しないため、監査ログは通常の API アクセスログおよび認可ログで扱う。選択結果を保存した操作の監査は、呼び出し元画面の保存APIで記録する。' },
    @{ Type = 'Heading2'; Text = '性能方針' },
    @{ Type = 'Bullets'; Items = @(
      '`ship_asset_masters` と分類系マスタのJOIN結果は件数が増えるため、`ship_asset_master_id`、各外部キー、`is_active` へ適切なインデックスを設定する',
      '一覧取得は画面モックに合わせてページングなしとし、検索条件に一致する候補を返却する',
      'キーワード検索は名称列とID文字列表現を対象とするため、実装時はDB負荷を確認し、必要に応じて検索用インデックスまたは全文検索方式を検討する',
      'フィルター候補は有効な資産マスタ組み合わせから生成するため、頻繁なアクセスが想定される場合は短時間キャッシュを検討する'
    ) },
    @{ Type = 'Heading2'; Text = '互換性' },
    @{ Type = 'Bullets'; Items = @(
      'APIパスは `/asset-master` 配下に限定し、SHIP資産マスタ管理画面の `/ship-asset-master` API 群とは分離する'
    ) }
  )
}
