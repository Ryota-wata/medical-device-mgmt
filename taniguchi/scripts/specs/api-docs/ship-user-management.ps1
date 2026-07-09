@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_SHIPユーザー管理.docx'
  ScreenLabel = 'SHIPユーザー管理'
  CoverDateText = '2026年7月5日'
  RevisionDateText = '2026/7/5'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、SHIPユーザー管理画面で利用する API の設計内容を整理し、SHIPユーザーの基本情報、担当施設、施設別機能設定、施設別表示カラム設定を一貫して保守するための基準を定義する。画面パスはTBUのため、本書では API ベースパスを `/ship-user-management` として扱う。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      'ユーザー管理APIとの管理対象分離',
      'SHIPユーザー作成・更新時の `account_type=''SHIP''` 固定ルール',
      'SHIPユーザーへ付与する担当施設と施設別機能・カラム設定の保存単位',
      '未削除の全施設を担当施設候補とするルール',
      '初回パスワード設定案内を認証基盤へ委譲する連携方式'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = 'SHIPユーザー管理は、医療機器管理システムの共通管理機能として、`users.account_type=''SHIP''` の通常アカウントを作成・参照・更新・削除する画面である。病院ユーザーはユーザー管理画面（`/user-management`）で扱い、本 API の作成・編集・削除対象には含めない。' },
    @{ Type = 'Paragraph'; Text = 'SHIPユーザーも通常アカウントとして、担当施設ごとに `config_scope=''FACILITY_USER''` の機能・カラムを付与する。施設提供設定で有効な機能・カラムだけを候補とし、対象ユーザーへ保存する有効状態は `user_facility_feature_settings` と `user_facility_column_settings` を正本とする。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('SHIPユーザー', '`users.account_type=''SHIP''` の通常アカウント。SHIPユーザー管理画面/APIで作成・管理する'),
      @('病院ユーザー', '`users.account_type=''HOSPITAL''` の通常アカウント。ユーザー管理画面/APIで作成・管理し、本書の対象外とする'),
      @('共有システム管理者アカウント', '`users.account_type=''SYSTEM_ADMIN''` の共有アカウント。通常ユーザーとして新規作成・編集する対象には含めない'),
      @('担当施設', 'SHIPユーザーが作業対象として選択できる施設。`user_facility_assignments` に保持する'),
      @('既定施設', '複数の担当施設のうち代表として扱う施設。`users.facility_id` と `user_facility_assignments.is_default=true` を同期し、`/auth/me` の `defaultFacilityId` の根拠にする'),
      @('施設別機能設定', '担当施設ごとにユーザーへ許可する `config_scope=''FACILITY_USER''` の機能設定。`user_facility_feature_settings` に保持する'),
      @('施設別表示カラム設定', '担当施設ごとにユーザーへ表示許可するカラム設定。`user_facility_column_settings` に保持する')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面パス', '利用目的'); Rows = @(
      @('67. SHIPユーザー管理画面', 'TBU', 'SHIPユーザー一覧参照、SHIPユーザー新規作成、基本情報編集、担当施設・権限編集、初回設定案内再送、削除を行う')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'API の位置づけ' },
    @{ Type = 'Paragraph'; Text = '本 API 群は、SHIPユーザー管理画面の初期表示に必要なコンテキスト取得、一覧取得、詳細取得、施設候補取得、ユーザー作成、ユーザー基本情報更新、担当施設・権限更新、初回設定案内再送、削除を提供する。' },
    @{ Type = 'Paragraph'; Text = 'ユーザー管理APIと同じ認可基盤・保存テーブルを利用するが、管理対象ユーザーは `account_type=''SHIP''` に固定する。病院ユーザーは `/user-management` 側の責務とする。' },
    @{ Type = 'Paragraph'; Text = 'APIを実行できるかの権限判定と、作成・編集対象のSHIPユーザーへ付与する施設別機能・カラム設定は別の概念として扱う。前者は実行ユーザーの `user_list_view`、`user_edit`、`user_facility_assignment_edit` で判定し、後者はリクエストの `facilityAssignments` を `user_facility_*` 系テーブルへ保存する。' },
    @{ Type = 'Heading2'; Text = '画面と API の関係' },
    @{ Type = 'Numbered'; Items = @(
      '画面初期表示時に `GET /ship-user-management/context` と `GET /ship-user-management/users` を呼び出す',
      '一覧のページ切替、絞り込み、ソート変更時に `GET /ship-user-management/users` を再呼び出す',
      '編集モーダルで基本情報タブを開く時に `GET /ship-user-management/users/{userId}` を呼び出す',
      '担当施設・権限タブを開く時に `GET /ship-user-management/users/{userId}/facility-assignments` を呼び出し、担当施設候補の検索時に `GET /ship-user-management/facilities` を呼び出す',
      '新規作成モーダル保存時に `POST /ship-user-management/users` を呼び出す。初回設定案内を送る場合は続けて `POST /ship-user-management/users/{userId}/setup-invitation` を呼び出す',
      '基本情報タブ保存時は `PUT /ship-user-management/users/{userId}/profile`、担当施設・権限タブ保存時は `PUT /ship-user-management/users/{userId}/facility-assignments` を呼び出す',
      '初回設定案内の再送時は `POST /ship-user-management/users/{userId}/setup-invitation` を呼び出す',
      '削除確認時は `DELETE /ship-user-management/users/{userId}` を呼び出す'
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル', '利用種別', '用途'); Rows = @(
      @('users', 'READ / CREATE / UPDATE / DELETE', 'SHIPユーザー基本情報の参照、登録、更新、論理削除、集約更新トークン管理。新規作成時の `account_type` は `SHIP` 固定とし、`HOSPITAL` / `SYSTEM_ADMIN` は本APIの管理対象外'),
      @('user_facility_assignments', 'READ / CREATE / UPDATE / DELETE', '担当施設、既定施設、割当種別の参照と更新'),
      @('facilities', 'READ', '既定施設候補、担当施設候補、所属母体導出、論理削除判定'),
      @('feature_catalogs', 'READ', '担当施設ごとの利用機能設定に使う機能カタログの取得'),
      @('column_catalogs', 'READ', '担当施設ごとの表示カラム設定に使うカラムカタログの取得'),
      @('facility_feature_settings', 'READ', '施設単位で提供されている機能の取得'),
      @('facility_column_settings', 'READ', '施設単位で提供されている表示カラムの取得'),
      @('user_facility_feature_settings', 'READ / CREATE / UPDATE / DELETE', '`config_scope=''FACILITY_USER''` の担当施設ごとの利用機能設定の参照と保守'),
      @('user_facility_column_settings', 'READ / CREATE / UPDATE / DELETE', '担当施設ごとの表示カラム設定の参照と保守')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API 共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-07-05T00:00:00Z`）',
      '一覧 API の既定並び順は `updatedAt DESC, userId ASC` とする',
      '一覧 API の既定ページサイズは `50`、上限は `200` とする',
      '施設候補検索 API の既定ページサイズは `20`、上限は `100` とする',
      '担当施設候補は `facilities.deleted_at IS NULL` の未削除施設全件とする',
      'ユーザー別機能候補は `config_scope=''FACILITY_USER''` かつ施設提供中の機能に限定する'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '本API群で使用する API 実行用の `feature_code` は、ユーザー管理APIと同じ以下の3種類とする。SHIPユーザー管理で保存する `enabledFeatureCodes` / `enabledColumnCodes` は対象SHIPユーザーへ付与する業務権限であり、API実行可否の判定コードとは分けて扱う。' },
    @{ Type = 'Table'; Headers = @('管理単位名', 'feature_code', '対象処理'); Rows = @(
      @('ユーザー / 一覧', '`user_list_view`', '画面コンテキスト取得、一覧取得'),
      @('ユーザー / 新規作成・編集', '`user_edit`', 'ユーザー基本情報取得、ユーザー基本情報更新、初回設定案内再送、削除、ユーザー新規作成の基本情報側'),
      @('担当施設・権限 / 編集', '`user_facility_assignment_edit`', 'ユーザー担当施設・権限詳細取得、施設候補取得、担当施設・権限更新、ユーザー新規作成の担当施設・権限設定側')
    ) },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('画面コンテキスト取得 / 一覧取得', '`user_list_view`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '一覧参照と新規作成導線表示の前提'),
      @('ユーザー基本情報取得 / ユーザー基本情報更新 / 初回設定案内再送 / 削除', '`user_edit`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', 'PII を含む基本情報参照と基本情報変更系'),
      @('ユーザー担当施設・権限詳細取得 / 施設候補取得 / 担当施設・権限更新', '`user_facility_assignment_edit`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '担当施設とユーザー施設別権限設定の参照・変更系'),
      @('ユーザー新規作成', '`user_edit` と `user_facility_assignment_edit`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '新規ユーザーは基本情報と担当施設・権限設定を同時に持つ前提で作成する')
    ) },
    @{ Type = 'Heading2'; Text = '管理対象スコープ' },
    @{ Type = 'Bullets'; Items = @(
      '管理対象ユーザーは、`users.account_type = ''SHIP''` かつ `users.deleted_at IS NULL` の通常アカウントに限る',
      '病院ユーザー（`account_type=''HOSPITAL''`）は一覧、詳細、更新、初回設定案内送信、削除の対象外とする',
      '共有システム管理者アカウント自体は、一覧、詳細、基本情報更新、担当施設・権限更新、初回設定案内送信、削除の対象外とする',
      '担当施設候補は `facilities.deleted_at IS NULL` の未削除施設全件とし、協業グループ経由の他施設閲覧候補は担当施設候補へ含めない',
      '詳細取得、更新、初回設定案内送信、削除で管理対象外ユーザーが指定された場合は、存在隠蔽のため 404 (`SHIP_USER_NOT_FOUND`) を返却する'
    ) },
    @{ Type = 'Heading2'; Text = '担当施設・既定施設ルール' },
    @{ Type = 'Bullets'; Items = @(
      '新規作成および担当施設・権限更新では、`defaultFacilityId` を必須とし、`facilityAssignments` に同じ施設を必ず含める',
      '`defaultFacilityId` は `users.facility_id` と `user_facility_assignments.is_default=true` の行に同期する',
      '`users.establishment_id` は `defaultFacilityId` の `facilities.establishment_id` から導出する',
      '`user_facility_assignments.assignment_type` は公開 API から受け取らず、既定施設を `PRIMARY`、それ以外を `SECONDARY` としてサーバー側で導出する',
      '担当施設ごとの機能設定は施設提供機能の有効範囲内だけ登録できる',
      '担当施設ごとのカラム設定は施設提供カラムの有効範囲内、かつ対応機能がユーザー側でも有効な場合だけ登録できる'
    ) },
    @{ Type = 'Heading2'; Text = 'トランザクションと競合制御' },
    @{ Type = 'Bullets'; Items = @(
      '`POST /ship-user-management/users`、`PUT /ship-user-management/users/{userId}/profile`、`PUT /ship-user-management/users/{userId}/facility-assignments`、`DELETE /ship-user-management/users/{userId}` は、それぞれ 1 回の API 呼び出しを 1 DB トランザクションで完結させる',
      '競合検知のトークンは `users.updated_at` を用いる。担当施設・権限更新 API は関連テーブル更新と同時に `users.updated_at` も更新し、ユーザー集約全体の版として扱う',
      '更新系・削除系 API は `lastKnownUpdatedAt` を受け取り、取得時点の `users.updated_at` と一致しない場合は 409 (`SHIP_USER_CONFLICT`) を返却する',
      '担当施設・権限更新では `user_facility_assignments` は差分更新し、`user_facility_feature_settings` と `user_facility_column_settings` は候補集合に対する現在値として再計算・総入れ替えする。失敗時は部分反映しない'
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Heading3'; Text = '基本エラーレスポンス（ErrorResponse）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや補足情報')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API 一覧' },
    @{ Type = 'Heading2'; Text = 'SHIPユーザー管理（/ship-user-management）' },
    @{ Type = 'Table'; Headers = @('No', 'API名', 'Method', 'Path', '用途', '権限'); Rows = @(
      @('1', '画面コンテキスト取得', 'GET', '/ship-user-management/context', '施設候補、操作可否、共通選択肢を取得する', '`user_list_view`'),
      @('2', 'SHIPユーザー一覧取得', 'GET', '/ship-user-management/users', 'SHIPユーザー一覧を取得する', '`user_list_view`'),
      @('3', 'SHIPユーザー基本情報取得', 'GET', '/ship-user-management/users/{userId}', 'SHIPユーザー基本情報を取得する', '`user_edit`'),
      @('4', 'SHIPユーザー担当施設・権限取得', 'GET', '/ship-user-management/users/{userId}/facility-assignments', '既定施設、担当施設、施設別機能・カラム設定を取得する', '`user_facility_assignment_edit`'),
      @('5', '担当施設候補取得', 'GET', '/ship-user-management/facilities', '未削除の全施設から担当施設候補を取得する', '`user_facility_assignment_edit`'),
      @('6', 'SHIPユーザー新規作成', 'POST', '/ship-user-management/users', 'SHIPユーザー基本情報、担当施設、施設別設定を登録する', '`user_edit` + `user_facility_assignment_edit`'),
      @('7', 'SHIPユーザー基本情報更新', 'PUT', '/ship-user-management/users/{userId}/profile', 'SHIPユーザー基本情報を更新する', '`user_edit`'),
      @('8', 'SHIPユーザー担当施設・権限更新', 'PUT', '/ship-user-management/users/{userId}/facility-assignments', '既定施設、担当施設、施設別機能・カラム設定を更新する', '`user_facility_assignment_edit`'),
      @('9', '初回設定案内送信', 'POST', '/ship-user-management/users/{userId}/setup-invitation', '未利用SHIPユーザーへ初回パスワード設定案内を送信する', '`user_edit`'),
      @('10', 'SHIPユーザー削除', 'DELETE', '/ship-user-management/users/{userId}', 'SHIPユーザーを論理削除し、担当施設設定とユーザー施設別設定を削除する', '`user_edit`')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '画面コンテキスト取得（/ship-user-management/context）'
        Overview = 'SHIPユーザー管理画面の初期表示に必要な操作可否、施設候補の初期集合、機能・カラム候補の基本情報を取得する。'
        Method = 'GET'
        Path = '/ship-user-management/context'
        Auth = '要（Bearer）'
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について実効 `user_list_view` が有効であること',
          '共有システム管理者アカウントでは作業対象施設が未削除であること'
        )
        ProcessingLines = @(
          '`facilities.deleted_at IS NULL` の施設を候補として取得する',
          '`feature_catalogs` から `config_scope=FACILITY_USER` かつ `is_active=true` の機能をユーザー別設定候補として表示順で取得する',
          '`column_catalogs` から `is_active=true` のカラムを表示順で取得する',
          '各施設で提供設定が有効な `config_scope=''FACILITY_USER''` の機能コードと表示カラムコードを返却する',
          '`canCreate`、`canEditProfile`、`canEditFacilityAssignments`、`canDelete`、`canSendSetupInvitation` は実行ユーザーの実効 feature_code から算出する',
          '共有システム管理者アカウントは未削除施設であれば操作可として扱う'
        )
        ResponseTitle = 'レスポンス（200：ShipUserManagementContextResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('permissions', 'ShipUserManagementPermissions', '✓', '画面操作可否'),
          @('facilityCandidates', 'FacilityPermissionCandidate[]', '✓', '初期表示用の施設候補'),
          @('featureCatalogs', 'FeatureCatalogItem[]', '✓', '担当施設・権限設定で利用する機能カタログ'),
          @('columnCatalogs', 'ColumnCatalogItem[]', '✓', '担当施設・権限設定で利用するカラムカタログ'),
          @('pageSizeOptions', 'int32[]', '✓', 'ページサイズ候補')
        )
        ResponseSubtables = @(
          @{
            Title = 'permissions要素（ShipUserManagementPermissions）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('canView', 'boolean', '✓', '一覧参照可否'),
              @('canCreate', 'boolean', '✓', '新規作成可否'),
              @('canEditProfile', 'boolean', '✓', '基本情報編集可否'),
              @('canEditFacilityAssignments', 'boolean', '✓', '担当施設・権限編集可否'),
              @('canDelete', 'boolean', '✓', '削除可否'),
              @('canSendSetupInvitation', 'boolean', '✓', '初回設定案内送信可否')
            )
          },
          @{
            Title = 'featureCatalogs要素（FeatureCatalogItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('featureCode', 'string', '✓', '機能コード'),
              @('featureName', 'string', '✓', '機能名'),
              @('categoryCode', 'string', '✓', '大分類コード'),
              @('menuGroupCode', 'string', '-', 'メニューグループコード'),
              @('featureKind', 'string', '✓', '機能種別'),
              @('usageContext', 'string', '✓', '利用文脈'),
              @('sortOrder', 'int32', '✓', '表示順')
            )
          },
          @{
            Title = 'columnCatalogs要素（ColumnCatalogItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('columnCode', 'string', '✓', 'カラムコード'),
              @('columnName', 'string', '✓', 'カラム名'),
              @('relatedFeatureCode', 'string', '✓', '関連機能コード'),
              @('columnGroupCode', 'string', '✓', 'カラム分類コード'),
              @('usageContext', 'string', '✓', '利用文脈'),
              @('sortOrder', 'int32', '✓', '表示順')
            )
          },
          @{
            Title = 'facilityCandidates要素（FacilityPermissionCandidate）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '施設ID'),
              @('facilityCode', 'string', '✓', '施設コード'),
              @('facilityName', 'string', '✓', '施設名'),
              @('establishmentId', 'int64', '✓', '設立母体ID'),
              @('availableFeatureCodes', 'string[]', '✓', '当該施設で提供されているユーザー別設定対象の機能コード一覧'),
              @('availableColumnCodes', 'string[]', '✓', '当該施設で提供されているカラムコード一覧')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'ShipUserManagementContextResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_list_view` なし', 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、または削除済み', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'SHIPユーザー一覧取得（/ship-user-management/users）'
        Overview = '`account_type=''SHIP''` の通常ユーザー一覧を取得する。'
        Method = 'GET'
        Path = '/ship-user-management/users'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('name', 'query', 'string', '-', 'ユーザー名の部分一致条件'),
          @('sectionName', 'query', 'string', '-', '部署の部分一致条件。`users.section_name` を対象とする'),
          @('page', 'query', 'int32', '-', 'ページ番号。既定値 `1`'),
          @('pageSize', 'query', 'int32', '-', 'ページサイズ。既定値 `50`、上限 `200`'),
          @('sortBy', 'query', 'string', '-', '並び替え項目。`updatedAt` / `name` / `sectionName` / `positionName` / `emailAddress`'),
          @('sortOrder', 'query', 'string', '-', '並び順。`asc` / `desc`')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について実効 `user_list_view` が有効であること',
          '共有システム管理者アカウントでは作業対象施設が未削除であること'
        )
        ProcessingLines = @(
          '`users.deleted_at IS NULL` かつ `users.account_type = ''SHIP''` のユーザーを対象にする',
          'ユーザー名、部署で AND 条件検索する',
          '一覧には所属部署、役職、ユーザー名、連絡先、メールアドレス、最終ログイン日時、更新日時を返却する',
          '担当施設・権限は担当施設・権限詳細 API で取得する'
        )
        ResponseTitle = 'レスポンス（200：ShipUserListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '検索条件に一致する総件数'),
          @('page', 'int32', '✓', '現在ページ番号'),
          @('pageSize', 'int32', '✓', 'ページサイズ'),
          @('items', 'ShipUserSummary[]', '✓', 'SHIPユーザー一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（ShipUserSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('userId', 'int64', '✓', 'ユーザーID'),
              @('sectionName', 'string', '-', '所属部署'),
              @('positionName', 'string', '-', '役職'),
              @('name', 'string', '✓', 'ユーザー名'),
              @('phoneNumber', 'string', '-', '連絡先'),
              @('emailAddress', 'string', '✓', 'メールアドレス'),
              @('lastLoginAt', 'string(datetime)', '-', '最終ログイン日時'),
              @('updatedAt', 'string(datetime)', '✓', '更新日時')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'ShipUserListResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_list_view` なし', 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、または削除済み', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'SHIPユーザー基本情報取得（/ship-user-management/users/{userId}）'
        Overview = '指定したSHIPユーザーの基本情報を取得する。担当施設・施設別機能設定は含めない。'
        Method = 'GET'
        Path = '/ship-user-management/users/{userId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('userId', 'path', 'int64', '✓', '対象ユーザーID')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について実効 `user_edit` が有効であること',
          '共有システム管理者アカウントでは作業対象施設が未削除であること'
        )
        ProcessingLines = @(
          '対象 `users` が `deleted_at IS NULL` かつ `account_type = ''SHIP''` で存在することを確認する',
          '`HOSPITAL` または `SYSTEM_ADMIN` のユーザーIDが指定された場合は 404 (`SHIP_USER_NOT_FOUND`) を返却する',
          '基本情報、アカウント状態、最終ログイン日時、集約更新トークンを返却する'
        )
        ResponseTitle = 'レスポンス（200：ShipUserProfileResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('userId', 'int64', '✓', 'ユーザーID'),
          @('name', 'string', '✓', 'ユーザー名'),
          @('emailAddress', 'string', '✓', 'メールアドレス'),
          @('departmentName', 'string', '-', '所属部門'),
          @('sectionName', 'string', '-', '所属部署'),
          @('positionName', 'string', '-', '役職'),
          @('phoneNumber', 'string', '-', '連絡先'),
          @('isActive', 'boolean', '✓', 'アカウント有効フラグ'),
          @('lastLoginAt', 'string(datetime)', '-', '最終ログイン日時'),
          @('updatedAt', 'string(datetime)', '✓', '集約更新トークン')
        )
        StatusRows = @(
          @('200', '取得成功', 'ShipUserProfileResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_edit` なし', 'ErrorResponse'),
          @('404', '対象SHIPユーザーが存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'SHIPユーザー担当施設・権限取得（/ship-user-management/users/{userId}/facility-assignments）'
        Overview = '指定したSHIPユーザーの既定施設、担当施設、施設別機能設定、施設別表示カラム設定を取得する。'
        Method = 'GET'
        Path = '/ship-user-management/users/{userId}/facility-assignments'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('userId', 'path', 'int64', '✓', '対象ユーザーID')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について実効 `user_facility_assignment_edit` が有効であること',
          '共有システム管理者アカウントでは作業対象施設が未削除であること'
        )
        ProcessingLines = @(
          '対象 `users` が `deleted_at IS NULL` かつ `account_type = ''SHIP''` で存在することを確認する',
          '対象ユーザーの `user_facility_assignments` を担当施設として取得する',
          '各担当施設について、施設提供設定が有効な `config_scope=''FACILITY_USER''` の機能・カラムを候補として返却する',
          '対象ユーザーの `user_facility_feature_settings` / `user_facility_column_settings` から現在の有効状態を返却する'
        )
        ResponseTitle = 'レスポンス（200：ShipUserFacilityAssignmentsResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('userId', 'int64', '✓', 'ユーザーID'),
          @('defaultFacilityId', 'int64', '✓', '既定施設ID'),
          @('updatedAt', 'string(datetime)', '✓', '集約更新トークン'),
          @('items', 'ShipUserFacilityAssignmentDetail[]', '✓', '担当施設・権限一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（ShipUserFacilityAssignmentDetail）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('userFacilityAssignmentId', 'int64', '✓', 'ユーザー施設割当ID'),
              @('facilityId', 'int64', '✓', '施設ID'),
              @('facilityCode', 'string', '✓', '施設コード'),
              @('facilityName', 'string', '✓', '施設名'),
              @('isDefault', 'boolean', '✓', '既定施設フラグ'),
              @('availableFeatureCodes', 'string[]', '✓', '当該施設で提供されているユーザー別設定対象の機能コード一覧'),
              @('availableColumnCodes', 'string[]', '✓', '当該施設で提供されているカラムコード一覧'),
              @('enabledFeatureCodes', 'string[]', '✓', '当該ユーザーへ有効化済みの機能コード一覧'),
              @('enabledColumnCodes', 'string[]', '✓', '当該ユーザーへ有効化済みのカラムコード一覧')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'ShipUserFacilityAssignmentsResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_facility_assignment_edit` なし', 'ErrorResponse'),
          @('404', '対象SHIPユーザーが存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '担当施設候補取得（/ship-user-management/facilities）'
        Overview = 'SHIPユーザーへ割り当て可能な担当施設候補を取得する。候補は未削除の全施設とする。'
        Method = 'GET'
        Path = '/ship-user-management/facilities'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('keyword', 'query', 'string', '-', '施設名または施設コードの部分一致条件'),
          @('page', 'query', 'int32', '-', 'ページ番号。既定値 `1`'),
          @('pageSize', 'query', 'int32', '-', 'ページサイズ。既定値 `20`、上限 `100`')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について実効 `user_facility_assignment_edit` が有効であること',
          '共有システム管理者アカウントでは作業対象施設が未削除であること'
        )
        ProcessingLines = @(
          '`facilities.deleted_at IS NULL` の施設を候補として取得する',
          '施設名または施設コードで部分一致検索する',
          '各施設について、施設提供設定が有効な `config_scope=''FACILITY_USER''` の機能・カラムを返却する',
          '協業グループ経由の他施設閲覧候補という概念は担当施設候補へ適用しない'
        )
        ResponseTitle = 'レスポンス（200：FacilityPermissionCandidateListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '検索条件に一致する総件数'),
          @('page', 'int32', '✓', '現在ページ番号'),
          @('pageSize', 'int32', '✓', 'ページサイズ'),
          @('items', 'FacilityPermissionCandidate[]', '✓', '担当施設候補')
        )
        StatusRows = @(
          @('200', '取得成功', 'FacilityPermissionCandidateListResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_facility_assignment_edit` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'SHIPユーザー新規作成（/ship-user-management/users）'
        Overview = 'SHIPユーザーの基本情報、既定施設、担当施設、施設別機能設定、施設別表示カラム設定を登録する。'
        Method = 'POST'
        Path = '/ship-user-management/users'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('name', 'string', '✓', 'ユーザー名'),
          @('emailAddress', 'string', '✓', 'メールアドレス。未削除ユーザー間で一意'),
          @('departmentName', 'string', '-', '所属部門'),
          @('sectionName', 'string', '-', '所属部署'),
          @('positionName', 'string', '-', '役職'),
          @('phoneNumber', 'string', '-', '連絡先'),
          @('defaultFacilityId', 'int64', '✓', '既定施設ID。`facilityAssignments` に含める'),
          @('facilityAssignments', 'ShipUserFacilityAssignmentInput[]', '✓', '担当施設と施設別機能・カラム設定。1件以上')
        )
        RequestSubtables = @(
          @{
            Title = 'facilityAssignments要素（ShipUserFacilityAssignmentInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '担当施設ID。未削除施設のみ指定可能'),
              @('enabledFeatureCodes', 'string[]', '✓', '対象施設で提供中の `config_scope=FACILITY_USER` 機能のうち、対象ユーザーへ有効化するコード'),
              @('enabledColumnCodes', 'string[]', '✓', '対象施設で提供中のカラムのうち、対象ユーザーへ有効化するコード')
            )
          }
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について実効 `user_edit` と `user_facility_assignment_edit` が有効であること',
          '共有システム管理者アカウントでは作業対象施設が未削除であること'
        )
        ProcessingLines = @(
          '`users.email_address` が未削除ユーザー間で重複しないことを確認する',
          '`facilityAssignments` が1件以上で、`defaultFacilityId` が `facilityAssignments[*].facilityId` に含まれることを確認する',
          '指定施設がすべて `facilities.deleted_at IS NULL` であることを確認する',
          '`users` へ `account_type=''SHIP''` 固定で登録する。`facility_id` は `defaultFacilityId`、`establishment_id` は既定施設から導出する',
          '`user_facility_assignments` を作成し、既定施設を `assignment_type=''PRIMARY''` / `is_default=true`、その他を `SECONDARY` / `false` とする',
          '施設提供設定の候補集合に対して、`enabledFeatureCodes` / `enabledColumnCodes` の現在値を `user_facility_feature_settings` / `user_facility_column_settings` へ保存する',
          '平文パスワードやトークン文字列は返却しない。初回設定案内は専用 API で送信する'
        )
        ResponseTitle = 'レスポンス（201：ShipUserCreateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('userId', 'int64', '✓', '作成したユーザーID'),
          @('defaultFacilityId', 'int64', '✓', '既定施設ID'),
          @('updatedAt', 'string(datetime)', '✓', '集約更新トークン')
        )
        StatusRows = @(
          @('201', '作成成功', 'ShipUserCreateResponse'),
          @('400', '入力不正、担当施設未指定、既定施設が担当施設に含まれない、担当施設重複', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_edit` または `user_facility_assignment_edit` なし', 'ErrorResponse'),
          @('404', '指定施設が存在しない、または論理削除済み。機能コード、カラムコードが存在しない場合も含む', 'ErrorResponse'),
          @('409', 'メールアドレス重複、または施設提供設定と矛盾する機能・カラム指定', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'SHIPユーザー基本情報更新（/ship-user-management/users/{userId}/profile）'
        Overview = 'SHIPユーザーの基本情報のみを更新する。担当施設・施設別機能設定は更新しない。'
        Method = 'PUT'
        Path = '/ship-user-management/users/{userId}/profile'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('userId', 'path', 'int64', '✓', '対象ユーザーID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('name', 'string', '✓', 'ユーザー名'),
          @('emailAddress', 'string', '✓', 'メールアドレス。未削除ユーザー間で一意'),
          @('departmentName', 'string', '-', '所属部門'),
          @('sectionName', 'string', '-', '所属部署'),
          @('positionName', 'string', '-', '役職'),
          @('phoneNumber', 'string', '-', '連絡先'),
          @('isActive', 'boolean', '✓', 'アカウント有効フラグ'),
          @('lastKnownUpdatedAt', 'string(datetime)', '✓', '取得時点の `updatedAt`。競合検知に用いる')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について実効 `user_edit` が有効であること',
          '共有システム管理者アカウントでは作業対象施設が未削除であること'
        )
        ProcessingLines = @(
          '対象 `users` が `deleted_at IS NULL` かつ `account_type = ''SHIP''` で存在することを確認する',
          '`lastKnownUpdatedAt` と `users.updated_at` を比較し、不一致時は 409 (`SHIP_USER_CONFLICT`) を返却する',
          'メールアドレスが他の未削除ユーザーと重複しないことを確認する',
          '`users` の基本情報、`is_active`、`updated_at` を更新する。`account_type`、`facility_id`、`establishment_id` は更新しない'
        )
        ResponseTitle = 'レスポンス（200：ShipUserProfileResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('userId', 'int64', '✓', 'ユーザーID'),
          @('name', 'string', '✓', 'ユーザー名'),
          @('emailAddress', 'string', '✓', 'メールアドレス'),
          @('departmentName', 'string', '-', '所属部門'),
          @('sectionName', 'string', '-', '所属部署'),
          @('positionName', 'string', '-', '役職'),
          @('phoneNumber', 'string', '-', '連絡先'),
          @('isActive', 'boolean', '✓', 'アカウント有効フラグ'),
          @('updatedAt', 'string(datetime)', '✓', '更新後の集約更新トークン')
        )
        StatusRows = @(
          @('200', '更新成功', 'ShipUserProfileResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_edit` なし', 'ErrorResponse'),
          @('404', '対象SHIPユーザーが存在しない', 'ErrorResponse'),
          @('409', 'メールアドレス重複、または更新競合', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'SHIPユーザー担当施設・権限更新（/ship-user-management/users/{userId}/facility-assignments）'
        Overview = 'SHIPユーザーの既定施設、担当施設、施設別機能設定、施設別表示カラム設定を更新する。'
        Method = 'PUT'
        Path = '/ship-user-management/users/{userId}/facility-assignments'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('userId', 'path', 'int64', '✓', '対象ユーザーID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('defaultFacilityId', 'int64', '✓', '既定施設ID。`facilityAssignments` に含める'),
          @('facilityAssignments', 'ShipUserFacilityAssignmentInput[]', '✓', '担当施設と施設別機能・カラム設定。1件以上'),
          @('lastKnownUpdatedAt', 'string(datetime)', '✓', '取得時点の `updatedAt`。競合検知に用いる')
        )
        RequestSubtables = @(
          @{
            Title = 'facilityAssignments要素（ShipUserFacilityAssignmentInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '担当施設ID。未削除施設のみ指定可能'),
              @('enabledFeatureCodes', 'string[]', '✓', '対象施設で提供中の `config_scope=FACILITY_USER` 機能のうち、対象ユーザーへ有効化するコード'),
              @('enabledColumnCodes', 'string[]', '✓', '対象施設で提供中のカラムのうち、対象ユーザーへ有効化するコード')
            )
          }
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について実効 `user_facility_assignment_edit` が有効であること',
          '共有システム管理者アカウントでは作業対象施設が未削除であること'
        )
        ProcessingLines = @(
          '対象 `users` が `deleted_at IS NULL` かつ `account_type = ''SHIP''` で存在することを確認する',
          '`lastKnownUpdatedAt` と `users.updated_at` を比較し、不一致時は 409 (`SHIP_USER_CONFLICT`) を返却する',
          '`facilityAssignments` が1件以上で、`defaultFacilityId` が `facilityAssignments[*].facilityId` に含まれることを確認する',
          '指定施設がすべて `facilities.deleted_at IS NULL` であることを確認する',
          '`users.facility_id` を `defaultFacilityId`、`users.establishment_id` を既定施設の設立母体へ更新する',
          '`user_facility_assignments` は指定施設に合わせて差分更新し、既定施設を `PRIMARY` / `is_default=true`、その他を `SECONDARY` / `false` とする',
          '`user_facility_feature_settings` と `user_facility_column_settings` は候補集合に対する現在値として再計算し、施設提供設定と矛盾する指定は 409 を返却する',
          '担当施設・権限更新成功時は `users.updated_at` も更新する'
        )
        ResponseTitle = 'レスポンス（200：ShipUserFacilityAssignmentsResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('userId', 'int64', '✓', 'ユーザーID'),
          @('defaultFacilityId', 'int64', '✓', '既定施設ID'),
          @('updatedAt', 'string(datetime)', '✓', '更新後の集約更新トークン'),
          @('items', 'ShipUserFacilityAssignmentDetail[]', '✓', '更新後の担当施設・権限一覧')
        )
        StatusRows = @(
          @('200', '更新成功', 'ShipUserFacilityAssignmentsResponse'),
          @('400', '入力不正、担当施設未指定、既定施設が担当施設に含まれない、担当施設重複', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_facility_assignment_edit` なし', 'ErrorResponse'),
          @('404', '対象SHIPユーザーまたは指定施設が存在しない', 'ErrorResponse'),
          @('409', '施設提供設定と矛盾する機能・カラム指定、または更新競合', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '初回設定案内送信（/ship-user-management/users/{userId}/setup-invitation）'
        Overview = '未利用SHIPユーザーに対して初回パスワード設定案内を送信する。トークン生成とメール送信は認証基盤へ委譲する。'
        Method = 'POST'
        Path = '/ship-user-management/users/{userId}/setup-invitation'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('userId', 'path', 'int64', '✓', '対象ユーザーID')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について実効 `user_edit` が有効であること',
          '共有システム管理者アカウントでは作業対象施設が未削除であること'
        )
        ProcessingLines = @(
          '対象 `users` が `deleted_at IS NULL` かつ `account_type = ''SHIP''` で存在することを確認する',
          '`last_login_at IS NOT NULL` の既利用ユーザーには送信しない。既利用ユーザーの再設定は認証 API の `/auth/password/forgot` を利用する',
          '認証基盤内部サービスへ、旧未使用トークン無効化、新規招待トークン発行、メール送信を一括依頼し、成功時は 202 を返却する',
          '平文パスワードや再設定トークン文字列は API レスポンスに含めない'
        )
        ResponseTitle = 'レスポンス（202：ShipUserSetupInvitationResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('status', 'string', '✓', '受理状態。`ACCEPTED`'),
          @('targetEmailAddress', 'string', '✓', '送信対象メールアドレス')
        )
        StatusRows = @(
          @('202', '送信依頼受理', 'ShipUserSetupInvitationResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_edit` なし', 'ErrorResponse'),
          @('404', '対象SHIPユーザーが存在しない', 'ErrorResponse'),
          @('409', '対象ユーザーがすでに初回利用済みである', 'ErrorResponse'),
          @('500', 'トークン発行または送信依頼に失敗', 'ErrorResponse')
        )
      },
      @{
        Title = 'SHIPユーザー削除（/ship-user-management/users/{userId}）'
        Overview = '指定したSHIPユーザーを論理削除し、担当施設設定とユーザー施設別設定を削除する。自身の削除は認めない。'
        Method = 'DELETE'
        Path = '/ship-user-management/users/{userId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('userId', 'path', 'int64', '✓', '削除対象ユーザーID'),
          @('lastKnownUpdatedAt', 'query', 'string(datetime)', '✓', '取得時点の `updatedAt`。競合検知に用いる')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について実効 `user_edit` が有効であること',
          '共有システム管理者アカウントでは作業対象施設が未削除であること'
        )
        ProcessingLines = @(
          '対象 `users` が `deleted_at IS NULL` かつ `account_type = ''SHIP''` で存在することを確認する',
          '`lastKnownUpdatedAt` と `users.updated_at` を比較し、不一致時は 409 (`SHIP_USER_CONFLICT`) を返却する',
          '実行ユーザー自身を削除対象にすることはできない',
          '`users.deleted_at` と `users.updated_at` を現在日時へ更新し、`is_active=false` とする',
          '対象ユーザーの `user_facility_column_settings`、`user_facility_feature_settings`、`user_facility_assignments` を削除する',
          '削除処理は 1 トランザクションで実行する'
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @(
          'Body は返却しない。'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_edit` なし', 'ErrorResponse'),
          @('404', '対象SHIPユーザーが存在しない', 'ErrorResponse'),
          @('409', '更新競合、または自身削除禁止', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '必要権限' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定基準', '説明'); Rows = @(
      @('画面コンテキスト取得 / 一覧取得', '`user_list_view`', 'Bearer トークン上の作業対象施設に対して実効 `user_list_view` を持つこと', '一覧参照系'),
      @('ユーザー基本情報取得 / ユーザー基本情報更新 / 初回設定案内送信 / 削除', '`user_edit`', 'Bearer トークン上の作業対象施設に対して実効 `user_edit` を持つこと', 'PII を含む基本情報参照と基本情報変更系'),
      @('担当施設・権限詳細取得 / 施設候補取得 / 担当施設・権限更新', '`user_facility_assignment_edit`', 'Bearer トークン上の作業対象施設に対して実効 `user_facility_assignment_edit` を持つこと', '担当施設とユーザー施設別権限の変更系'),
      @('ユーザー新規作成', '`user_edit` と `user_facility_assignment_edit`', '同一作業対象施設に対して両 feature_code を持つこと', '新規作成は基本情報と担当施設・権限設定を同時に扱う')
    ) },
    @{ Type = 'Heading2'; Text = '一意性・整合性ルール' },
    @{ Type = 'Bullets'; Items = @(
      '管理対象ユーザーは `users.account_type = ''SHIP''` の通常ユーザーに限る',
      '病院ユーザーと共有システム管理者アカウントは本 API の作成・編集・削除・初回設定案内対象に含めない',
      '`users.email_address` は未削除ユーザー間で一意に保つ',
      '`user_facility_assignments` は `(user_id, facility_id)` を一意に保つ',
      '担当施設候補は未削除の全施設とする',
      '既定施設は担当施設に必ず含め、`users.facility_id` と `is_default=true` の担当施設を一致させる',
      '公開 API では `assignmentType` を受け取らず、既定施設を `PRIMARY`、それ以外を `SECONDARY` として内部導出する',
      '担当施設ごとの機能設定は施設提供機能の有効範囲内だけ登録できる',
      '担当施設ごとのカラム設定は施設提供カラムの有効範囲内、かつ対応機能がユーザー側でも有効な場合だけ登録できる',
      '担当施設・権限更新成功時は `users.updated_at` も更新し、プロフィール更新との競合検知に使う'
    ) },
    @{ Type = 'Heading2'; Text = '削除・招待ルール' },
    @{ Type = 'Bullets'; Items = @(
      '実行ユーザー自身の削除は認めない',
      '初回設定案内送信は `last_login_at IS NULL` の未利用ユーザーだけを対象とする',
      '既利用ユーザーのパスワード再設定は `/auth/password/forgot` の責務とし、本 API では扱わない'
    ) },
    @{ Type = 'Heading2'; Text = '実装前提・設計判断' },
    @{ Type = 'Bullets'; Items = @(
      '一覧 API は要約情報のみ返し、詳細情報は `GET /ship-user-management/users/{userId}` と `GET /ship-user-management/users/{userId}/facility-assignments` に分離する',
      '基本情報更新と担当施設・権限更新は API を分離し、`user_edit` と `user_facility_assignment_edit` の境界に一致させる',
      'SHIPユーザーの担当施設候補は未削除の全施設とし、選択中施設や設立母体による絞り込みは行わない',
      '平文パスワードやトークン文字列はSHIPユーザー管理 API の入出力へ含めず、認証基盤へ委譲する',
      '競合検知は `users.updated_at` を集約更新トークンとして扱う方式を採用し、HTTP 条件付き更新ヘッダーは採用しない'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '説明'); Rows = @(
      @('VALIDATION_ERROR', '400', '必須不足、形式不正、担当施設未指定、担当施設重複などの入力不正'),
      @('DEFAULT_FACILITY_NOT_ASSIGNED', '400', '既定施設が担当施設に含まれていない'),
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
      @('AUTH_403_USER_LIST_VIEW_DENIED', '403', '作業対象施設に対する実効 `user_list_view` がない'),
      @('AUTH_403_USER_EDIT_DENIED', '403', '作業対象施設に対する実効 `user_edit` がない'),
      @('AUTH_403_USER_FACILITY_ASSIGNMENT_EDIT_DENIED', '403', '作業対象施設に対する実効 `user_facility_assignment_edit` がない'),
      @('SHIP_USER_NOT_FOUND', '404', '対象SHIPユーザーが存在しない、またはSHIPユーザー管理対象外である'),
      @('FACILITY_NOT_FOUND', '404', '指定施設が存在しない、または論理削除済みである'),
      @('FEATURE_OR_COLUMN_NOT_FOUND', '404', '指定した機能コードまたはカラムコードが存在しない、または候補外である'),
      @('SHIP_USER_EMAIL_DUPLICATE', '409', 'メールアドレスが重複している'),
      @('SHIP_USER_CONFLICT', '409', '他ユーザー更新により `lastKnownUpdatedAt` が不一致である'),
      @('FACILITY_PERMISSION_SCOPE_CONFLICT', '409', '施設提供設定または親子機能条件と矛盾する機能・カラム指定である'),
      @('SHIP_USER_SELF_DELETE_FORBIDDEN', '409', '実行ユーザー自身は削除できない'),
      @('SHIP_USER_ALREADY_ACTIVATED', '409', '対象ユーザーはすでに初回利用済みである'),
      @('INVITATION_DISPATCH_FAILED', '500', '初回設定案内の送信依頼に失敗した'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = 'SHIPユーザーマスタ保守方針' },
    @{ Type = 'Bullets'; Items = @(
      'SHIPユーザー削除は `users` の論理削除で管理し、監査上必要な基本情報は保持する',
      '担当施設およびユーザー施設別権限設定は削除ユーザーへ不要となるため、削除時に関連テーブルから除去する',
      '施設が論理削除されても既存設定行は残り得るが、候補表示や認可判定では `facilities.deleted_at IS NULL` を前提に扱う',
      '設定系テーブルの `created_by` / `updated_by` は問い合わせ調査の根拠になるため必ず保存する'
    ) },
    @{ Type = 'Heading2'; Text = '運用上の留意点' },
    @{ Type = 'Bullets'; Items = @(
      '基本情報タブと担当施設・権限タブを同一モーダルに置く場合でも、バックエンド契約は分離したまま維持する',
      '初回設定案内の再送履歴や配信状態を可視化する場合は、認証基盤または通知基盤側に監査テーブルを追加する',
      'SHIPユーザー管理画面の正式パスが確定した場合は、画面要件、API候補、API設計書本文の画面パス表記を同時に更新する'
    ) }
  )
}




