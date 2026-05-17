@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_権限管理.docx'
  ScreenLabel = '権限管理'
  CoverDateText = '2026年5月17日'
  RevisionDateText = '2026/5/17'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、権限管理画面（`/permission-management`）で利用する API の設計内容を整理し、SHIPシステム管理者が施設単位の提供機能・提供カラムを管理するための実装基準を明確にすることを目的とする。' },
    @{ Type = 'Paragraph'; Text = 'SHIP施設マスタ API に混在していた施設提供設定の責務を本書へ切り出し、施設基本情報管理と権限設定管理の境界を明確にする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      '権限管理画面の初期表示、対象施設選択、設定取得、保存、設定コピーの I/F',
      '施設提供機能・施設提供カラムの候補取得と現在値の返却ルール',
      '`lending_checkout` と `lending_in_use_used` の親子制約',
      '`lending_in_use_used` を OFF にする際の未返却貸出データ検証',
      '施設提供設定とユーザー施設別設定の責務分離',
      '権限・バリデーション・エラーレスポンス'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '権限管理は、メイン画面のマスタ管理モーダルから遷移する独立画面である。SHIPシステム管理者が対象施設を選択し、当該施設で提供する機能および表示カラムを ON/OFF 設定する。' },
    @{ Type = 'Paragraph'; Text = '施設単位の提供設定は、その施設に所属または担当するユーザーが利用できる機能・カラムの上限として働く。`config_scope=''FACILITY_USER''` の機能は、施設提供設定とユーザー施設別設定の両方が有効な場合にのみ実効利用できる。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('権限管理', '施設単位の提供機能・提供カラムを管理する画面および API 群'),
      @('対象施設', '設定を取得・保存する施設。`facilities` で管理する'),
      @('施設提供機能', '対象施設で提供する `feature_code`。`facility_feature_settings` で管理する'),
      @('施設提供カラム', '対象施設で提供する `column_code`。`facility_column_settings` で管理する'),
      @('機能カタログ', '管理対象機能の正本。`feature_catalogs` で管理する'),
      @('カラムカタログ', '管理対象カラムの正本。`column_catalogs` で管理する'),
      @('ユーザー施設別設定', '施設提供設定の範囲内でユーザーごとの利用可否を管理する `user_facility_feature_settings` / `user_facility_column_settings`'),
      @('lending_in_use_used', '貸出・返却の使用中/使用済みフローを制御するユーザー施設別機能。実効利用には `lending_checkout` も有効であることが必要')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('項目', '内容'); Rows = @(
      @('画面名', '64. 権限管理画面'),
      @('画面URL', '/permission-management'),
      @('主機能', '対象施設選択、施設提供機能・提供カラム設定、設定コピー、未保存変更の保存')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'APIの位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、権限管理画面の初期表示、対象施設別の設定取得、設定保存、別施設からの設定コピーを提供する。' },
    @{ Type = 'Paragraph'; Text = '候補正本は `feature_catalogs` / `column_catalogs` とし、施設別の設定値は `facility_feature_settings` / `facility_column_settings` へ保存する。ユーザー施設別設定は本APIでは更新しない。' },
    @{ Type = 'Heading2'; Text = '画面とAPIの関係' },
    @{ Type = 'Table'; Headers = @('画面操作', 'API', '補足'); Rows = @(
      @('画面初期表示', 'GET /permission-management/context', '対象施設候補、機能カタログ、カラムカタログ、初期選択施設、初期選択施設の現在設定を取得する'),
      @('対象施設選択', 'GET /permission-management/facilities/{facilityId}/settings', '選択施設の施設提供機能・施設提供カラムの現在値を取得する'),
      @('保存する', 'PUT /permission-management/facilities/{facilityId}/settings', 'pendingChanges を施設提供設定へ永続化する'),
      @('施設設定コピー', 'POST /permission-management/facilities/{facilityId}/copy-settings', 'コピー元施設の設定をコピー先施設へ置き換える')
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル', '利用種別', '用途'); Rows = @(
      @('facilities', 'READ', '対象施設候補、対象施設・コピー元施設の存在確認、施設名・契約状態の返却'),
      @('feature_catalogs', 'READ', '施設提供機能候補の正本、カテゴリ・表示順・設定スコープの取得'),
      @('column_catalogs', 'READ', '施設提供カラム候補の正本、関連機能コード・表示順の取得'),
      @('facility_feature_settings', 'READ / CREATE / UPDATE', '対象施設の施設提供機能設定の取得、保存、コピー'),
      @('facility_column_settings', 'READ / CREATE / UPDATE', '対象施設の施設提供カラム設定の取得、保存、コピー'),
      @('asset_ledgers', 'READ', '`lending_in_use_used` OFF 可否検証で貸出機器の対象施設を判定する'),
      @('lending_devices', 'READ', '`lending_in_use_used` OFF 可否検証で使用中/使用済み状態の貸出機器を確認する'),
      @('lending_transactions', 'READ', '`lending_in_use_used` OFF 可否検証で未返却の使用中/使用済み履歴を確認する')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-05-17T00:00:00Z`）',
      '論理削除済み施設（`facilities.deleted_at IS NOT NULL`）は対象施設候補、設定取得、保存、コピー元、コピー先の対象外とする',
      'カタログ候補は `is_active=true` の行を対象とし、`sort_order`、コードの順で安定ソートする',
      '`switchContent` は `taniguchi/docs/ロール整理.xlsx` の `権限管理単位一覧` シートを正本とする表示メタ情報であり、`facility_feature_settings` / `facility_column_settings` には保存しない',
      '保存・コピーは1リクエストを1トランザクションで処理し、一部だけ保存された状態を残さない',
      '保存・コピー時は候補集合全体を基準に UPSERT し、リクエストで指定されない候補は `is_enabled=false` として扱う'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '本API群は施設提供設定そのものを管理する管理者 API であるため、対象施設の `facility_feature_settings` / `user_facility_feature_settings` による自己参照型の feature_code 判定は行わない。Bearer トークンの認証コンテキストで SHIPシステム管理者（画面要件上は `user.role === ''system_admin''`）と判定できる場合のみ実行を許可する。' },
    @{ Type = 'Table'; Headers = @('処理', '必要条件', '説明'); Rows = @(
      @('全API', 'Bearer トークンが有効であること', '未認証または期限切れの場合は 401'),
      @('全API', '認証コンテキスト上のユーザーが SHIPシステム管理者であること', '画面要件上は `user.role === ''system_admin''`。SHIPシステム管理者以外は 403'),
      @('設定取得 / 保存 / コピー', '対象施設が未削除であること', '存在しない、または論理削除済みの場合は 404')
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Heading3'; Text = '基本エラーレスポンス（ErrorResponse）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや補足情報')
    ) },
    @{ Type = 'Heading2'; Text = '共通レスポンスDTO' },
    @{ Type = 'Heading3'; Text = 'PermissionFacilitySettingsResponse' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('facilityId', 'int64', '✓', '設定対象施設ID'),
      @('facilityCode', 'string', '-', '施設コード'),
      @('facilityName', 'string', '✓', '施設名'),
      @('permissionUnitCount', 'int32', '✓', '権限管理単位数。施設提供機能候補数と施設提供カラム候補数の合計'),
      @('updatedAt', 'datetime', '-', '施設提供設定の最終更新日時。未設定の場合は null'),
      @('featureSettings', 'PermissionFeatureSettingItem[]', '✓', '施設提供機能候補と現在値'),
      @('columnSettings', 'PermissionColumnSettingItem[]', '✓', '施設提供カラム候補と現在値')
    ) },
    @{ Type = 'Heading3'; Text = 'PermissionFeatureSettingItem' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('featureCode', 'string', '✓', '`feature_catalogs.feature_code`'),
      @('featureName', 'string', '✓', '機能表示名'),
      @('categoryCode', 'string', '✓', 'カテゴリコード'),
      @('menuGroupCode', 'string', '-', 'メニューグループコード'),
      @('featureKind', 'string', '-', '機能種別'),
      @('usageContext', 'string', '-', '利用文脈'),
      @('configScope', 'string', '✓', '`FACILITY` または `FACILITY_USER`'),
      @('sortOrder', 'int32', '✓', '表示順'),
      @('switchContent', 'string', '✓', 'ON の場合に利用可能になる画面・ボタン・カラム・モーダルの説明。`taniguchi/docs/ロール整理.xlsx` の `権限管理単位一覧` シートから導出する'),
      @('isEnabled', 'boolean', '✓', '対象施設で提供するかどうか'),
      @('isSelectable', 'boolean', '✓', '親機能制約などにより ON/OFF 操作できるかどうか'),
      @('disabledReason', 'string', '-', '操作不可理由。操作可能な場合は null')
    ) },
    @{ Type = 'Heading3'; Text = 'PermissionColumnSettingItem' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('columnCode', 'string', '✓', '`column_catalogs.column_code`'),
      @('columnName', 'string', '✓', 'カラム表示名'),
      @('relatedFeatureCode', 'string', '✓', '関連する `feature_code`'),
      @('columnGroupCode', 'string', '-', 'カラム分類コード'),
      @('usageContext', 'string', '-', '利用文脈'),
      @('sortOrder', 'int32', '✓', '表示順'),
      @('switchContent', 'string', '✓', 'ON の場合に利用可能になるカラム表示の説明。`taniguchi/docs/ロール整理.xlsx` の `権限管理単位一覧` シートから導出する'),
      @('isEnabled', 'boolean', '✓', '対象施設で提供するかどうか'),
      @('isSelectable', 'boolean', '✓', '関連 `feature_code` が施設提供機能として有効で、ON にできるかどうか'),
      @('disabledReason', 'string', '-', '操作不可理由。操作可能な場合は null')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API一覧' },
    @{ Type = 'Heading2'; Text = '権限管理（/permission-management）' },
    @{ Type = 'Table'; Headers = @('機能名', 'Method', 'Path', '概要', '認証'); Rows = @(
      @('権限管理コンテキスト取得', 'GET', '/permission-management/context', '初期表示に必要な対象施設候補、機能カタログ、カラムカタログ、現在の施設提供設定を取得する', '要'),
      @('施設提供設定取得', 'GET', '/permission-management/facilities/{facilityId}/settings', '対象施設の施設提供機能・施設提供カラム設定を取得する', '要'),
      @('施設提供設定保存', 'PUT', '/permission-management/facilities/{facilityId}/settings', '対象施設の施設提供機能・施設提供カラム設定を保存する', '要'),
      @('施設提供設定コピー', 'POST', '/permission-management/facilities/{facilityId}/copy-settings', 'コピー元施設の施設提供設定を対象施設へコピーする', '要')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 権限管理機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '権限管理コンテキスト取得（/permission-management/context）'
        Overview = '権限管理画面の初期表示に必要な対象施設候補、施設提供機能候補、施設提供カラム候補を取得する。'
        Method = 'GET'
        Path = '/permission-management/context'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('-', '-', '-', '-', 'なし')
        )
        PermissionLines = @(
          '認可条件: Bearer トークンが有効であること',
          '認可条件: 認証コンテキスト上のユーザーが SHIPシステム管理者（画面要件上は `user.role === ''system_admin''`）であること'
        )
        ProcessingLines = @(
          '`facilities.deleted_at IS NULL` の施設を対象施設候補として取得する',
          '`feature_catalogs.is_active=true` かつ `config_scope in (''FACILITY'', ''FACILITY_USER'')` の `feature_code` を施設提供機能候補として取得する。`auth_login` / `facility_select` など `SYSTEM_FIXED` の固定導線は候補に含めない',
          'Phase1では `normal_ship_request` / `lending_in_use_used` を `FACILITY_USER` として候補に含める',
          '`column_catalogs.is_active=true` のカラム候補を取得し、`related_feature_code` を併せて返却する',
          '初期選択施設は対象施設候補の先頭とする。クライアントが前回選択施設を保持している場合は、`facilities` に当該施設が含まれることを確認したうえで、施設提供設定取得 API を呼び出して表示を切り替える',
          '初期選択施設が存在する場合は、同施設の施設提供機能・施設提供カラム設定を `currentSettings` として同時に返却する。対象施設候補がない場合は `currentSettings=null` とする'
        )
        ResponseTitle = 'レスポンス（200：PermissionManagementContextResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('defaultFacilityId', 'int64', '-', '初期選択する施設ID。対象施設候補がない場合は null'),
          @('facilities', 'PermissionTargetFacility[]', '✓', '対象施設候補'),
          @('featureCatalogs', 'PermissionFeatureCatalogItem[]', '✓', '施設提供機能候補'),
          @('columnCatalogs', 'PermissionColumnCatalogItem[]', '✓', '施設提供カラム候補'),
          @('currentSettings', 'PermissionFacilitySettingsResponse', '-', '初期選択施設の現在設定。対象施設候補がない場合は null')
        )
        ResponseSubtables = @(
          @{
            Title = 'facilities要素（PermissionTargetFacility）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '施設ID（`facilities.facility_id`）'),
              @('facilityCode', 'string', '-', '施設コード'),
              @('facilityName', 'string', '✓', '施設名'),
              @('prefecture', 'string', '-', '都道府県'),
              @('systemContractStatus', 'string', '-', 'システム契約状態')
            )
          },
          @{
            Title = 'featureCatalogs要素（PermissionFeatureCatalogItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('featureCode', 'string', '✓', '`feature_catalogs.feature_code`'),
              @('featureName', 'string', '✓', '機能表示名'),
              @('categoryCode', 'string', '✓', 'カテゴリコード'),
              @('menuGroupCode', 'string', '-', 'メニューグループコード'),
              @('featureKind', 'string', '-', '機能種別'),
              @('usageContext', 'string', '-', '利用文脈'),
              @('configScope', 'string', '✓', '`FACILITY` または `FACILITY_USER`'),
              @('sortOrder', 'int32', '✓', '表示順'),
              @('switchContent', 'string', '✓', 'ON の場合に利用可能になる画面・ボタン・カラム・モーダルの説明')
            )
          },
          @{
            Title = 'columnCatalogs要素（PermissionColumnCatalogItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('columnCode', 'string', '✓', '`column_catalogs.column_code`'),
              @('columnName', 'string', '✓', 'カラム表示名'),
              @('relatedFeatureCode', 'string', '✓', '関連する `feature_code`'),
              @('columnGroupCode', 'string', '-', 'カラム分類コード'),
              @('usageContext', 'string', '-', '利用文脈'),
              @('sortOrder', 'int32', '✓', '表示順'),
              @('switchContent', 'string', '✓', 'ON の場合に利用可能になるカラム表示の説明')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'PermissionManagementContextResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', 'SHIPシステム管理者ではない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '施設提供設定取得（/permission-management/facilities/{facilityId}/settings）'
        Overview = '対象施設で提供する機能およびカラムの現在設定を取得する。対象施設選択時および保存後の再表示に利用する。'
        Method = 'GET'
        Path = '/permission-management/facilities/{facilityId}/settings'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('facilityId', 'path', 'int64', '✓', '設定取得対象の施設ID')
        )
        PermissionLines = @(
          '認可条件: Bearer トークンが有効であること',
          '認可条件: 認証コンテキスト上のユーザーが SHIPシステム管理者（画面要件上は `user.role === ''system_admin''`）であること'
        )
        ProcessingLines = @(
          '対象施設が存在し、未削除であることを確認する',
          '`feature_catalogs.is_active=true` かつ `config_scope in (''FACILITY'', ''FACILITY_USER'')` の `feature_code` を施設提供機能候補として取得する',
          '`column_catalogs.is_active=true` のカラム候補を取得し、`related_feature_code` を併せて返却する',
          '`facility_feature_settings` と `facility_column_settings` の既存値を左結合し、設定行がない候補は `isEnabled=false` として返却する',
          '`lending_in_use_used` は `lending_checkout` の子機能として扱う。`lending_checkout` が OFF の場合、画面は `lending_in_use_used` を非活性または自動 OFF として扱う',
          'カラム候補は、関連 `feature_code` が施設提供機能として有効化されていない場合 `isSelectable=false` として返却する'
        )
        ResponseTitle = 'レスポンス（200：PermissionFacilitySettingsResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('facilityId', 'int64', '✓', '設定対象施設ID'),
          @('facilityCode', 'string', '-', '施設コード'),
          @('facilityName', 'string', '✓', '施設名'),
          @('permissionUnitCount', 'int32', '✓', '権限管理単位数。施設提供機能候補数と施設提供カラム候補数の合計'),
          @('updatedAt', 'datetime', '-', '施設提供設定の最終更新日時。未設定の場合は null'),
          @('featureSettings', 'PermissionFeatureSettingItem[]', '✓', '施設提供機能候補と現在値'),
          @('columnSettings', 'PermissionColumnSettingItem[]', '✓', '施設提供カラム候補と現在値')
        )
        ResponseSubtables = @(
          @{
            Title = 'featureSettings要素（PermissionFeatureSettingItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('featureCode', 'string', '✓', '`feature_catalogs.feature_code`'),
              @('featureName', 'string', '✓', '機能表示名'),
              @('categoryCode', 'string', '✓', 'カテゴリコード'),
              @('menuGroupCode', 'string', '-', 'メニューグループコード'),
              @('featureKind', 'string', '-', '機能種別'),
              @('usageContext', 'string', '-', '利用文脈'),
              @('configScope', 'string', '✓', '`FACILITY` または `FACILITY_USER`'),
              @('sortOrder', 'int32', '✓', '表示順'),
              @('switchContent', 'string', '✓', 'ON の場合に利用可能になる画面・ボタン・カラム・モーダルの説明'),
              @('isEnabled', 'boolean', '✓', '対象施設で提供するかどうか'),
              @('isSelectable', 'boolean', '✓', '親機能制約などにより ON/OFF 操作できるかどうか'),
              @('disabledReason', 'string', '-', '操作不可理由。操作可能な場合は null')
            )
          },
          @{
            Title = 'columnSettings要素（PermissionColumnSettingItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('columnCode', 'string', '✓', '`column_catalogs.column_code`'),
              @('columnName', 'string', '✓', 'カラム表示名'),
              @('relatedFeatureCode', 'string', '✓', '関連する `feature_code`'),
              @('columnGroupCode', 'string', '-', 'カラム分類コード'),
              @('usageContext', 'string', '-', '利用文脈'),
              @('sortOrder', 'int32', '✓', '表示順'),
              @('switchContent', 'string', '✓', 'ON の場合に利用可能になるカラム表示の説明'),
              @('isEnabled', 'boolean', '✓', '対象施設で提供するかどうか'),
              @('isSelectable', 'boolean', '✓', '関連 `feature_code` が施設提供機能として有効で、ON にできるかどうか'),
              @('disabledReason', 'string', '-', '操作不可理由。操作可能な場合は null')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'PermissionFacilitySettingsResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', 'SHIPシステム管理者ではない', 'ErrorResponse'),
          @('404', '対象施設が存在しない、または論理削除済み', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '施設提供設定保存（/permission-management/facilities/{facilityId}/settings）'
        Overview = '対象施設で提供する機能およびカラムの設定を保存する。'
        Method = 'PUT'
        Path = '/permission-management/facilities/{facilityId}/settings'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('facilityId', 'path', 'int64', '✓', '設定保存対象の施設ID')
        )
        RequestTitle = 'リクエスト（PermissionFacilitySettingsUpdateRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('enabledFeatureCodes', 'string[]', '✓', '対象施設で提供する `feature_code` 一覧'),
          @('enabledColumnCodes', 'string[]', '✓', '対象施設で提供する `column_code` 一覧')
        )
        PermissionLines = @(
          '認可条件: Bearer トークンが有効であること',
          '認可条件: 認証コンテキスト上のユーザーが SHIPシステム管理者（画面要件上は `user.role === ''system_admin''`）であること'
        )
        ProcessingLines = @(
          '対象施設が存在し、未削除であることを確認する',
          '`enabledFeatureCodes` は `feature_catalogs.is_active=true` かつ `config_scope in (''FACILITY'', ''FACILITY_USER'')` の候補集合の部分集合でなければならない。`auth_login` / `facility_select` など `SYSTEM_FIXED` の固定導線は受け付けない',
          '`enabledFeatureCodes` に `lending_in_use_used` を含める場合は `lending_checkout` も含めなければならない。含まれない場合は 400 (`PERMISSION_SETTING_PARENT_FEATURE_REQUIRED`) とする',
          '既存設定で `lending_in_use_used=true` の施設について、リクエストで `lending_in_use_used` を OFF にする場合は、`lending_devices.asset_ledger_id` から `asset_ledgers.facility_id` を参照して対象施設の貸出機器に限定し、未返却の `使用中` / `使用済` 状態が存在しないことを確認する。具体的には `lending_devices.status IN (''使用中'',''使用済'')`、または同一 `lending_device_id` の `lending_transactions.returned_on IS NULL AND status IN (''使用中'',''使用済'')` が存在する場合は 409 (`LENDING_IN_USE_USED_ACTIVE_EXISTS`) とする。返却済み履歴や対象施設外の機器は OFF 拒否条件に含めない',
          '`enabledColumnCodes` は `column_catalogs.is_active=true` の候補集合の部分集合でなければならない',
          '`enabledColumnCodes` に含む各 `column_code` は、`column_catalogs.related_feature_code` が `enabledFeatureCodes` に含まれている場合のみ有効化できる。関連機能が無効な場合は 400 (`PERMISSION_SETTING_COLUMN_RELATED_FEATURE_DISABLED`) とする',
          '候補集合の各 `feature_code` について `facility_feature_settings` を UPSERT し、`enabledFeatureCodes` に含むコードを `is_enabled=true`、含まないコードを `false` とする',
          '候補集合の各 `column_code` について `facility_column_settings` を UPSERT し、`enabledColumnCodes` に含み、かつ関連 `feature_code` が有効なコードを `is_enabled=true`、それ以外を `false` とする',
          'ユーザー施設別設定（`user_facility_feature_settings` / `user_facility_column_settings`）は本 API では更新しない。施設提供設定が OFF になったコードは、既存ユーザー設定が残っていても実効権限としては無効になる'
        )
        ResponseTitle = 'レスポンス（200：PermissionFacilitySettingsResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('facilityId', 'int64', '✓', '設定対象施設ID'),
          @('facilityCode', 'string', '-', '施設コード'),
          @('facilityName', 'string', '✓', '施設名'),
          @('permissionUnitCount', 'int32', '✓', '権限管理単位数。施設提供機能候補数と施設提供カラム候補数の合計'),
          @('updatedAt', 'datetime', '✓', '保存後の施設提供設定の最終更新日時'),
          @('featureSettings', 'PermissionFeatureSettingItem[]', '✓', '保存後の施設提供機能候補と現在値'),
          @('columnSettings', 'PermissionColumnSettingItem[]', '✓', '保存後の施設提供カラム候補と現在値')
        )
        StatusRows = @(
          @('200', '保存成功', 'PermissionFacilitySettingsResponse'),
          @('400', '未知のコード、固定導線コード指定、親 feature 不足、または関連 feature が無効な column_code 指定', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', 'SHIPシステム管理者ではない', 'ErrorResponse'),
          @('404', '対象施設が存在しない、または論理削除済み', 'ErrorResponse'),
          @('409', '`lending_in_use_used` を OFF にできない未返却の使用中/使用済データが存在する', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '施設提供設定コピー（/permission-management/facilities/{facilityId}/copy-settings）'
        Overview = 'コピー元施設の施設提供機能・施設提供カラム設定を、対象施設へ置き換える。施設設定コピー確認モーダルの確定操作で利用する。'
        Method = 'POST'
        Path = '/permission-management/facilities/{facilityId}/copy-settings'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('facilityId', 'path', 'int64', '✓', 'コピー先となる対象施設ID')
        )
        RequestTitle = 'リクエスト（PermissionFacilitySettingsCopyRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('sourceFacilityId', 'int64', '✓', 'コピー元施設ID')
        )
        PermissionLines = @(
          '認可条件: Bearer トークンが有効であること',
          '認可条件: 認証コンテキスト上のユーザーが SHIPシステム管理者（画面要件上は `user.role === ''system_admin''`）であること'
        )
        ProcessingLines = @(
          'コピー先施設とコピー元施設が存在し、未削除であることを確認する',
          'コピー元施設とコピー先施設が同一の場合は 400 (`PERMISSION_COPY_SOURCE_INVALID`) とする',
          'コピー元施設の `facility_feature_settings` / `facility_column_settings` を候補集合へ左結合し、設定行がない候補は `is_enabled=false` として扱う',
          'コピー後の `enabledFeatureCodes` / `enabledColumnCodes` に対して、保存 API と同じ候補集合検証、`lending_checkout` と `lending_in_use_used` の親子制約、関連機能 OFF 時のカラム ON 拒否、`lending_in_use_used` OFF 可否検証を行う',
          '検証に成功した場合、コピー先施設の候補集合全体について `facility_feature_settings` / `facility_column_settings` を UPSERT し、コピー元と同じ有効状態へ置き換える',
          'ユーザー施設別設定（`user_facility_feature_settings` / `user_facility_column_settings`）は本 API では更新しない'
        )
        ResponseTitle = 'レスポンス（200：PermissionFacilitySettingsResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('facilityId', 'int64', '✓', 'コピー先施設ID'),
          @('facilityCode', 'string', '-', 'コピー先施設コード'),
          @('facilityName', 'string', '✓', 'コピー先施設名'),
          @('permissionUnitCount', 'int32', '✓', '権限管理単位数。施設提供機能候補数と施設提供カラム候補数の合計'),
          @('sourceFacilityId', 'int64', '✓', 'コピー元施設ID'),
          @('sourceFacilityName', 'string', '✓', 'コピー元施設名'),
          @('updatedAt', 'datetime', '✓', 'コピー後の施設提供設定の最終更新日時'),
          @('featureSettings', 'PermissionFeatureSettingItem[]', '✓', 'コピー後の施設提供機能候補と現在値'),
          @('columnSettings', 'PermissionColumnSettingItem[]', '✓', 'コピー後の施設提供カラム候補と現在値')
        )
        StatusRows = @(
          @('200', 'コピー成功', 'PermissionFacilitySettingsResponse'),
          @('400', 'コピー元施設が未指定、同一施設指定、またはコピー後設定が業務制約に違反', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', 'SHIPシステム管理者ではない', 'ErrorResponse'),
          @('404', 'コピー元施設またはコピー先施設が存在しない、または論理削除済み', 'ErrorResponse'),
          @('409', '`lending_in_use_used` を OFF にできない未返却の使用中/使用済データが存在する', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '必要権限' },
    @{ Type = 'Table'; Headers = @('処理', '必要条件', '判定基準', '説明'); Rows = @(
      @('権限管理コンテキスト取得', 'SHIPシステム管理者', 'Bearer トークンの認証コンテキストで SHIPシステム管理者と判定できること', '初期表示用の対象施設候補とカタログ候補を参照する'),
      @('施設提供設定取得', 'SHIPシステム管理者', 'Bearer トークンの認証コンテキストで SHIPシステム管理者と判定できること', '対象施設の現在設定を参照する'),
      @('施設提供設定保存', 'SHIPシステム管理者', 'Bearer トークンの認証コンテキストで SHIPシステム管理者と判定できること', '対象施設の施設提供設定を更新する'),
      @('施設提供設定コピー', 'SHIPシステム管理者', 'Bearer トークンの認証コンテキストで SHIPシステム管理者と判定できること', 'コピー元施設の設定を対象施設へ反映する')
    ) },
    @{ Type = 'Heading2'; Text = '施設提供設定ルール' },
    @{ Type = 'Bullets'; Items = @(
      '施設提供機能の候補は `feature_catalogs.is_active=true` かつ `config_scope in (''FACILITY'', ''FACILITY_USER'')` の `feature_code` とし、`auth_login` / `facility_select` などの固定導線は対象外とする',
      'Phase1では `normal_ship_request` / `lending_in_use_used` を `FACILITY_USER` として施設提供機能候補に含める',
      '`lending_in_use_used` は `lending_checkout` の子機能であり、`lending_checkout` が OFF の場合は ON にできない。保存 API とコピー API は `lending_in_use_used=true` かつ `lending_checkout=false` の組み合わせを拒否する',
      '`lending_in_use_used` を ON から OFF にする場合は、`lending_devices.asset_ledger_id` から `asset_ledgers.facility_id` を参照して対象施設の貸出機器に限定し、`lending_devices.status IN (''使用中'',''使用済'')`、または同一 `lending_device_id` の `lending_transactions.returned_on IS NULL AND status IN (''使用中'',''使用済'')` が存在しないことを検証する。存在する場合は 409 で拒否し、運用上は該当機器を返却完了してから OFF にする',
      '施設提供カラムの候補は `column_catalogs.is_active=true` の `column_code` とする',
      '施設提供カラムは、`column_catalogs.related_feature_code` に対応する施設提供機能が ON の場合のみ ON にできる',
      '施設提供設定を OFF にしてもユーザー施設別設定は削除しない。`config_scope=''FACILITY_USER''` では実効権限判定時に施設提供設定が OFF であれば、ユーザー側が ON でも利用不可とする',
      '施設論理削除時は `facility_feature_settings` / `facility_column_settings` を削除せず保持する。再契約等で `facilities.deleted_at` を解除した場合は既存設定を再利用する'
    ) },
    @{ Type = 'Heading2'; Text = '設定コピーの業務ルール' },
    @{ Type = 'Bullets'; Items = @(
      'コピーはコピー先施設の設定をコピー元施設の設定へ置き換える処理であり、差分追加ではない',
      'コピー元施設に設定行が存在しない候補は OFF としてコピーする',
      'コピー元施設とコピー先施設が同一の場合は実行しない',
      'コピー先施設の貸出データ状態により `lending_in_use_used` を OFF にできない場合は、コピー処理全体を 409 で拒否する',
      'コピー実行後もユーザー施設別設定は変更しないため、必要に応じてユーザー権限管理画面でユーザー別設定を見直す'
    ) },
    @{ Type = 'Heading2'; Text = '監査・更新者ルール' },
    @{ Type = 'Bullets'; Items = @(
      '保存・コピーで作成する `facility_feature_settings` / `facility_column_settings` の `created_by` / `updated_by` には Bearer トークンのユーザーIDを設定する',
      '既存行を更新する場合は `updated_by` / `updated_at` を更新する',
      'リクエストで指定されず OFF として保存する候補についても、既存行がない場合は OFF 行を作成し、候補集合全体の状態を明示化する'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTPステータス', '内容'); Rows = @(
      @('UNAUTHORIZED', '401', 'Bearer トークン未指定、期限切れ、または不正'),
      @('PERMISSION_MANAGEMENT_FORBIDDEN', '403', 'SHIPシステム管理者ではないユーザーが権限管理 API を呼び出した'),
      @('PERMISSION_TARGET_FACILITY_NOT_FOUND', '404', '対象施設、コピー元施設、またはコピー先施設が存在しない、または論理削除済み'),
      @('PERMISSION_SETTING_CODE_INVALID', '400', '未知の `feature_code` / `column_code`、非アクティブコード、または固定導線コードが指定された'),
      @('PERMISSION_SETTING_PARENT_FEATURE_REQUIRED', '400', '`lending_in_use_used` が ON だが `lending_checkout` が OFF である'),
      @('PERMISSION_SETTING_COLUMN_RELATED_FEATURE_DISABLED', '400', '関連 `feature_code` が OFF の `column_code` を ON にしようとした'),
      @('PERMISSION_COPY_SOURCE_INVALID', '400', 'コピー元施設が未指定、コピー先と同一、またはコピー元として利用できない'),
      @('LENDING_IN_USE_USED_ACTIVE_EXISTS', '409', '`lending_in_use_used` を OFF にできない未返却の使用中/使用済み貸出データが存在する'),
      @('INTERNAL_SERVER_ERROR', '500', '想定外のサーバー内部エラー')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = 'カタログ管理' },
    @{ Type = 'Bullets'; Items = @(
      '権限管理画面に表示する機能・カラムは `feature_catalogs` / `column_catalogs` を正本とする',
      '新しい画面、ボタン、カラムを権限管理対象に追加する場合は、API 実装より先にカタログ定義を追加する',
      '`SYSTEM_FIXED` の固定導線は本画面に表示せず、保存 API でも受け付けない'
    ) },
    @{ Type = 'Heading2'; Text = '保守時の注意点' },
    @{ Type = 'Bullets'; Items = @(
      'SHIP施設マスタ API は施設基本情報管理に限定し、施設提供機能・提供カラム設定は本APIを正本とする',
      '施設グループ管理および他施設向け公開設定は本APIでは扱わず、施設グループ管理 API 設計書で扱う',
      '施設提供設定を OFF にしてもユーザー施設別設定は削除しないため、権限が再度 ON になった際に既存ユーザー設定が再利用される',
      '`lending_in_use_used` OFF 拒否は運用上のデータ不整合を防ぐためのサーバー側必須検証とし、フロントの非活性制御だけに依存しない'
    ) }
  )
}
