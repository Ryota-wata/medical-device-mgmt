@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_認証／認可.docx'
  ScreenLabel = '認証／認可'
  CoverDateText = '2026年4月17日'
  RevisionDateText = '2026/4/17'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、ログイン画面（`/login`）、パスワード再設定URL送信画面（`/password-reset`）、作業対象施設選択画面（`/facility-select`）、ホーム画面（`/main`）で利用する認証／認可 API の設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      'ログイン、ログアウト、トークン再発行、パスワード再設定の I/F',
      '`/auth/me` と `/auth/context` を使った担当施設選択と画面表示制御の成立条件',
      '`feature_code` / `column_code` を正本とした認可判定ルール',
      '他施設閲覧時に必要な協業グループと公開元施設設定の判定条件'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '本 API 群は、認証基盤、施設選択導線、ホーム/各業務画面の表示制御を支える横断 API である。ログイン後は `GET /auth/me` で担当施設一覧を取得し、必要に応じて `GET /auth/context?actingFacilityId=...` を呼び出して実効 `feature_code` / `column_code` を取得する。' },
    @{ Type = 'Paragraph'; Text = '認可正本はロールではなく、`feature_catalogs` / `column_catalogs` / `user_facility_assignments` / 施設別設定 / ユーザー施設別設定 / 他施設公開設定を参照して判断する。' },
    @{ Type = 'Paragraph'; Text = '権限管理画面の管理単位は `taniguchi/docs/ロール整理.xlsx` の `権限管理単位一覧` シート A列を正本とし、1つの管理単位に対して1つの `feature_code` または `column_code` を割り当てる。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('担当施設', '`user_facility_assignments` に直接登録された、ユーザーが作業対象として選択できる施設'),
      @('作業対象施設', 'ログイン後に現在の操作文脈として選択した施設。`actingFacilityId` で表す'),
      @('実効 feature_code', '施設提供機能とユーザー施設別機能の両方が有効な場合に利用できる機能コード'),
      @('実効 column_code', '施設提供カラムとユーザー施設別カラムの両方が有効で、かつ関連 feature が有効な場合に表示できるカラムコード'),
      @('他施設閲覧', '作業対象施設とは別の施設データを、協業グループと公開元施設設定に基づいて閲覧すること')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面パス', '利用目的'); Rows = @(
      @('ログイン画面', '/login', '利用者認証、担当施設決定導線の開始'),
      @('パスワード再設定URL送信画面', '/password-reset', 'パスワード再設定申請'),
      @('作業対象施設選択画面', '/facility-select', '担当施設が複数ある場合の作業対象施設選択'),
      @('ホーム画面', '/main', '選択中施設に対するメニュー表示と業務導線表示')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'API の位置づけ' },
    @{ Type = 'Paragraph'; Text = '本 API 群は、認証状態の確立、担当施設一覧の取得、施設選択後の表示制御情報の取得、共通認可判定を担う。施設選択画面やホーム画面のための専用集約 API は持たず、`/auth/me`、`/auth/context`、各業務 API の組み合わせで構成する。' },
    @{ Type = 'Paragraph'; Text = '`POST /authorization/check` は UI 側の補助判定に利用できるが、最終的な security boundary は各業務 API 側の再判定とする。' },
    @{ Type = 'Heading2'; Text = '画面と API の関係' },
    @{ Type = 'Numbered'; Items = @(
      'ログイン画面で `POST /auth/login` を呼び出し、認証成功後に `GET /auth/me` を呼ぶ',
      '担当施設が1件であればクライアント側で当該施設を選択し、`GET /auth/context?actingFacilityId=...` を呼んで `/main` へ遷移する',
      '担当施設が複数件であれば `/facility-select` で `GET /auth/me` の `assignedFacilities` / `defaultFacilityId` を用いて候補表示し、選択後に `GET /auth/context` を呼ぶ',
      'ホーム画面および各業務画面は `GET /auth/context` の結果を使ってメニュー、画面、ボタン、カラムの表示制御を行う',
      '必要に応じて `POST /authorization/check` を使い、対象施設・対象機能・対象カラムの可否を補助判定する'
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル', '利用内容', '主な項目'); Rows = @(
      @('users', '認証、ユーザー基本情報、アカウント状態、最終ログイン更新', 'user_id, email_address, password_hash, name, account_type, is_active, locked_at, last_login_at'),
      @('user_remember_tokens', 'current device のログイン状態保持トークンの発行・更新・失効', 'token_id, user_id, token, expires_at, last_used_at'),
      @('password_reset_tokens', 'パスワード再設定トークンの発行・使用済み管理、管理者起点の初回設定案内送信時の内部利用', 'token_id, user_id, token, expires_at, used_at'),
      @('user_facility_assignments', '担当施設一覧、既定施設、施設アクセス可否判定', 'user_facility_assignment_id, user_id, facility_id, is_default, is_active, valid_from, valid_to'),
      @('facilities', '担当施設名称、契約状態、公開元施設判定、論理削除状態確認', 'facility_id, facility_name, system_contract_status, deleted_at'),
      @('feature_catalogs', '認可対象機能の正本、承認用 feature を含むコード体系', 'feature_code, feature_name, usage_context, config_scope'),
      @('column_catalogs', '認可対象カラムの正本', 'column_code, column_name, related_feature_code'),
      @('facility_feature_settings', '施設単位の提供機能判定', 'facility_id, feature_code, is_enabled'),
      @('facility_column_settings', '施設単位の提供カラム判定', 'facility_id, column_code, is_enabled'),
      @('user_facility_feature_settings', 'ユーザー施設別の利用機能判定', 'user_facility_assignment_id, feature_code, is_enabled'),
      @('user_facility_column_settings', 'ユーザー施設別の利用カラム判定', 'user_facility_assignment_id, column_code, is_enabled'),
      @('facility_collaboration_groups', '他施設閲覧候補の協業グループ定義', 'facility_collaboration_group_id, group_name, is_active'),
      @('facility_collaboration_group_facilities', '協業グループ所属施設', 'facility_collaboration_group_id, facility_id'),
      @('facility_external_view_settings', '公開元施設の他施設向け公開データ設定', 'provider_facility_id, feature_code, is_enabled'),
      @('facility_external_column_settings', '公開元施設の他施設向け公開カラム設定', 'provider_facility_id, column_code, is_enabled')
    ) },
    @{ Type = 'Paragraph'; Text = 'リフレッシュトークン、remember token による current device の再認証、およびセッション失効の詳細実装は認証基盤側責務とし、DB 正本としては上記テーブルを参照する。remember token は平文保存せずハッシュ化して保持し、クライアント側は `HttpOnly` / `Secure` / `SameSite=Lax` cookie で保持する前提とする。' },
    @{ Type = 'Paragraph'; Text = '管理者がユーザー管理画面から初回設定案内を送信・再送する場合も、公開契約はユーザー管理 API 側に置き、旧トークン無効化・新規トークン発行・メール送信は認証基盤内部処理として本 API 群と同じ責務で扱う。' },
    @{ Type = 'Paragraph'; Text = '`facilities.deleted_at` が設定された施設は、担当施設一覧、施設選択、認可判定、業務 API の対象外とする。一方で `user_facility_assignments` や各種 `*_feature_settings` / `*_column_settings` は削除せず保持し、再契約等で `deleted_at` を解除した場合は既存設定を再利用する。' },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API 共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-04-13T00:00:00Z`）',
      '認証済み API は Bearer トークンを `Authorization` ヘッダーに付与する',
      '`rememberMe=true` の場合は current device 用の remember token を `HttpOnly` / `Secure` / `SameSite=Lax` cookie で保持する',
      '`facilities.deleted_at IS NOT NULL` の施設は `/auth/me`、`/auth/context`、`/authorization/check`、各業務 API の対象外とする',
      '画面表示制御用の `GET /auth/context` は UX 用キャッシュであり、業務 API の認可判定を代替しない'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログインはメールアドレスとパスワードで行う。`POST /auth/login` 成功後は Bearer トークンを用いて `GET /auth/me`、`GET /auth/context`、各業務 API を呼び出す。`rememberMe=true` の場合は current device のログイン状態保持用トークンも発行し、再訪時は認証基盤側でセッション再開を試みる。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '認可判定は `feature_code` / `column_code` を正本とし、施設単位設定とユーザー施設別設定の両方が有効な場合に成立する。`auth_login` と `facility_select` は `config_scope=''SYSTEM_FIXED''` のため、施設・ユーザー単位の ON/OFF 対象に含めない。`棚卸し（事務）` や `DataLINK / SHIP表示列` のように、管理単位がボタン群や列群を含む場合も、当該管理単位に対応する1つの `feature_code` / `column_code` で扱う。' },
    @{ Type = 'Table'; Headers = @('対象', '判定に使う主な情報', '説明'); Rows = @(
      @('ログイン関連', '`users`, `user_remember_tokens`, `password_reset_tokens`', '認証とトークン管理を扱う。施設別権限は判定しない'),
      @('作業対象施設決定', '`user_facility_assignments`, `facilities`', '担当施設一覧と既定施設を決定する'),
      @('自施設機能判定', '`facility_feature_settings`, `user_facility_feature_settings`', '施設提供とユーザー許可の両方が必要'),
      @('自施設カラム判定', '`facility_column_settings`, `user_facility_column_settings`, `column_catalogs.related_feature_code`', '関連 feature が有効な場合のみ成立する'),
      @('他施設閲覧判定', '上記に加え `facility_collaboration_groups`, `facility_collaboration_group_facilities`, `facility_external_view_settings`, `facility_external_column_settings`', '閲覧者側権限と公開元施設設定の両方が必要')
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Heading3'; Text = '基本エラーレスポンス（ErrorResponse）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや補足情報')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API 一覧' },
    @{ Type = 'Table'; Headers = @('機能名', 'Method', 'Path', '概要', '認証'); Rows = @(
      @('ログイン', 'POST', '/auth/login', 'ユーザー認証とトークン発行を行う', '不要'),
      @('ログアウト', 'POST', '/auth/logout', '現在のセッションとトークンを失効する', '要'),
      @('トークン再発行', 'POST', '/auth/refresh', 'リフレッシュトークンでアクセストークンを再発行する', '不要'),
      @('ログインユーザー基本情報取得', 'GET', '/auth/me', 'ログインユーザー、担当施設一覧、既定施設を取得する', '要'),
      @('認可コンテキスト取得', 'GET', '/auth/context', '選択施設に対する実効 feature / column を取得する', '要'),
      @('パスワード再設定申請', 'POST', '/auth/password/forgot', 'パスワード再設定用 URL 発行を受け付ける', '不要'),
      @('パスワード更新', 'POST', '/auth/password/reset', '再設定トークンを使ってパスワードを更新する', '不要'),
      @('認可可否判定', 'POST', '/authorization/check', '画面・操作単位の可否を補助判定する', '要')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 認証／認可機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = 'ログイン（/auth/login）'
        Overview = 'メールアドレスとパスワードで利用者認証を行い、アクセストークン／リフレッシュトークンを発行する。'
        Method = 'POST'
        Path = '/auth/login'
        Auth = '不要'
        RequestTitle = 'リクエストボディ（AuthLoginRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('emailAddress', 'string', '✓', 'ログインIDとして利用するメールアドレス'),
          @('password', 'string', '✓', '平文パスワード'),
          @('rememberMe', 'boolean', '-', 'ログイン情報記憶を希望する場合は true')
        )
        PermissionLines = @(
          '`auth_login` は `SYSTEM_FIXED` の認証前提機能であり、施設・ユーザー権限設定では制御しない',
          '`users.is_active=true` かつ `locked_at IS NULL` のアカウントのみ認証成功とする'
        )
        ProcessingLines = @(
          '`users.email_address` で対象ユーザーを特定し、`password_hash` と入力パスワードを照合する',
          '認証成功時はアクセストークン／リフレッシュトークンを発行し、`users.last_login_at` を更新する',
          '`rememberMe=true` の場合は `user_remember_tokens` に current device のログイン状態保持用トークンを発行または更新する',
          'remember token は平文を保持せず、ハッシュ化した値を `user_remember_tokens` へ保存する',
          'クライアント側には remember token を `HttpOnly` / `Secure` / `SameSite=Lax` cookie として設定する',
          '`rememberMe=false` の場合は記憶トークンを新規発行しない',
          '次回アクセス時に有効な remember token が存在する場合は、認証基盤側で current device のセッション再開を試みる',
          '作業対象施設の確定や `feature_code` / `column_code` の返却は本 API では行わず、後続の `/auth/me` と `/auth/context` で解決する'
        )
        ResponseTitle = 'レスポンス（200：AuthLoginResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('accessToken', 'string', '✓', 'アクセストークン'),
          @('refreshToken', 'string', '✓', 'リフレッシュトークン'),
          @('tokenType', 'string', '✓', '通常は `Bearer`')
        )
        StatusRows = @(
          @('200', '認証成功', 'AuthLoginResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', 'メールアドレスまたはパスワード不正', 'ErrorResponse'),
          @('403', 'アカウント無効またはロック中', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'ログアウト（/auth/logout）'
        Overview = '現在のセッションとトークンを失効する。'
        Method = 'POST'
        Path = '/auth/logout'
        Auth = '要（Bearer）'
        PermissionLines = @(
          '認証済みセッションであること'
        )
        ProcessingLines = @(
          'Authorization ヘッダーで識別される current device の現在セッションを失効対象とする',
          '同一 device に紐づくリフレッシュトークンも同時に失効させる',
          '同一 device に紐づくログイン状態保持トークンが存在する場合は同時に無効化する',
          '他 device のセッションやトークンは本 API の失効対象に含めない'
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @(
          '本文は返却しない。'
        )
        StatusRows = @(
          @('204', 'ログアウト成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'トークン再発行（/auth/refresh）'
        Overview = 'リフレッシュトークンを用いてアクセストークンを再発行する。'
        Method = 'POST'
        Path = '/auth/refresh'
        Auth = '不要'
        RequestTitle = 'リクエストボディ（AuthRefreshRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('refreshToken', 'string', '✓', '再発行対象のリフレッシュトークン')
        )
        ProcessingLines = @(
          'リフレッシュトークンの有効性を検証する',
          'トークンに紐づくユーザーについて `users.is_active=true` かつ `locked_at IS NULL` を再確認する',
          '有効であれば新しいアクセストークンを発行する',
          'リフレッシュトークンのローテーション方式を採る場合は、更新後トークンを返却する'
        )
        ResponseTitle = 'レスポンス（200：AuthRefreshResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('accessToken', 'string', '✓', '再発行したアクセストークン'),
          @('refreshToken', 'string', '-', 'ローテーション時の新しいリフレッシュトークン'),
          @('tokenType', 'string', '✓', '通常は `Bearer`')
        )
        StatusRows = @(
          @('200', '再発行成功', 'AuthRefreshResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', 'リフレッシュトークン不正または失効', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'ログインユーザー基本情報取得（/auth/me）'
        Overview = 'ログイン中ユーザーの基本情報、担当施設一覧、既定施設を取得する。'
        Method = 'GET'
        Path = '/auth/me'
        Auth = '要（Bearer）'
        PermissionLines = @(
          '認証済みセッションであること',
          '認証済みユーザーが `users.is_active=true` かつ `locked_at IS NULL` であること'
        )
        ProcessingLines = @(
          '認証済みユーザーの `users` を取得する',
          '`user_facility_assignments` から有効な担当施設一覧を取得する',
          '`facilities` を JOIN し、`deleted_at IS NULL` の施設だけを `assignedFacilities` へ含める',
          '施設名称、契約状態を付与し、削除済み施設を既定担当に持つ場合は `defaultFacilityId` へ返さない',
          '協業グループ経由で見える施設は `assignedFacilities` へ含めない'
        )
        ResponseTitle = 'レスポンス（200：AuthMeResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('userId', 'int64', '✓', 'ログインユーザーID'),
          @('name', 'string', '✓', 'ユーザー氏名'),
          @('emailAddress', 'string', '✓', 'メールアドレス'),
          @('accountType', 'string', '✓', 'アカウント種別'),
          @('establishmentId', 'int64', '-', '設立母体ID'),
          @('facilityId', 'int64', '-', '主所属施設ID'),
          @('defaultFacilityId', 'int64', '-', '既定担当施設ID'),
          @('assignedFacilities', 'AssignedFacility[]', '✓', '担当施設一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'assignedFacilities要素（AssignedFacility）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '担当施設ID'),
              @('facilityName', 'string', '✓', '施設名'),
              @('assignmentType', 'string', '✓', 'PRIMARY / SECONDARY'),
              @('isDefault', 'boolean', '✓', '既定担当施設フラグ'),
              @('systemContractStatus', 'string', '✓', '施設契約状態'),
              @('validFrom', 'string(date)', '-', '適用開始日'),
              @('validTo', 'string(date)', '-', '適用終了日')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'AuthMeResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '認可コンテキスト取得（/auth/context）'
        Overview = '選択した作業対象施設に対する実効 `feature_code` / `column_code` を返却する。'
        Method = 'GET'
        Path = '/auth/context'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('actingFacilityId', 'query', 'int64', '✓', '作業対象施設ID')
        )
        PermissionLines = @(
          '認証済みセッションであること',
          '認証済みユーザーが `users.is_active=true` かつ `locked_at IS NULL` であること',
          '指定 `actingFacilityId` が `user_facility_assignments` 上の有効な担当施設であること',
          '指定 `actingFacilityId` に対応する `facilities.deleted_at IS NULL` であること'
        )
        ProcessingLines = @(
          '`user_facility_assignments` で対象施設への割当を確認する',
          '`facilities.deleted_at IS NULL` の未削除施設であることを確認し、削除済みなら 404 とする',
          '`facilities.system_contract_status` を確認し、作業対象施設が `ACTIVE` の場合のみ外部閲覧系の `feature_code` / `column_code` を返却候補に含める',
          '`facility_feature_settings` と `user_facility_feature_settings` の両方が `is_enabled=true` の `feature_code` を実効機能として返す',
          '`facility_column_settings` と `user_facility_column_settings` の両方が `is_enabled=true` で、かつ `related_feature_code` が有効な `column_code` を実効カラムとして返す',
          '他施設閲覧の具体的な対象施設可否は本 API では解決せず、協業グループ、対象施設契約状態、公開設定を `/authorization/check` または業務 API 側で再判定する',
          '`config_scope=''SYSTEM_FIXED''` の `auth_login` / `facility_select` は返却対象に含めない'
        )
        ResponseTitle = 'レスポンス（200：AuthContextResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('actingFacilityId', 'int64', '✓', '作業対象施設ID'),
          @('actingFacilityName', 'string', '✓', '作業対象施設名'),
          @('featureCodes', 'string[]', '✓', '実効 `feature_code` 一覧'),
          @('columnCodes', 'string[]', '✓', '実効 `column_code` 一覧')
        )
        StatusRows = @(
          @('200', '取得成功', 'AuthContextResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '担当施設外の施設指定', 'ErrorResponse'),
          @('404', '施設が存在しない、または削除済み', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'パスワード再設定申請（/auth/password/forgot）'
        Overview = 'パスワード再設定用 URL 送信を受け付ける。'
        Method = 'POST'
        Path = '/auth/password/forgot'
        Auth = '不要'
        RequestTitle = 'リクエストボディ（PasswordForgotRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('emailAddress', 'string', '✓', '対象ユーザーのメールアドレス')
        )
        ProcessingLines = @(
          'メールアドレス形式を検証する',
          '`users` に該当ユーザーが存在し、再設定対象として扱える場合は `password_reset_tokens` を発行する',
          '再設定トークンは平文のまま保持せず、ハッシュ化した値を保存する',
          '同一ユーザーの未使用トークンが残っている場合は旧トークンを無効化してから新規トークンを発行する',
          '管理者起点の初回設定案内再送でも、同一のトークン発行・旧トークン無効化ロジックを内部利用してよい',
          '存在有無や有効性にかかわらず、画面上では共通応答を返す',
          'メール送信は非同期ジョブまたはメール基盤側責務としてよい'
        )
        ResponseTitle = 'レスポンス（200：PasswordForgotResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('accepted', 'boolean', '✓', '受け付け結果。常に true を返す'),
          @('message', 'string', '✓', '共通案内メッセージ')
        )
        StatusRows = @(
          @('200', '受け付け成功', 'PasswordForgotResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'パスワード更新（/auth/password/reset）'
        Overview = '再設定トークンを用いてパスワードを更新し、既存セッション/トークンを無効化する。'
        Method = 'POST'
        Path = '/auth/password/reset'
        Auth = '不要'
        RequestTitle = 'リクエストボディ（PasswordResetRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('token', 'string', '✓', 'パスワード再設定トークン'),
          @('newPassword', 'string', '✓', '新しいパスワード')
        )
        ProcessingLines = @(
          '受信した再設定トークンをハッシュ化し、`password_reset_tokens` の保存値と照合する',
          '`password_reset_tokens` の存在、有効期限、未使用状態を確認する',
          '有効なトークンであれば `users.password_hash` を更新する',
          '`password_reset_tokens.used_at` を更新して再利用不可にする',
          '既存の認証セッション、リフレッシュトークン、ログイン情報記憶トークンを失効対象とする'
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @(
          '本文は返却しない。'
        )
        StatusRows = @(
          @('204', '更新成功', '-'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', 'トークン不正または期限切れ', 'ErrorResponse'),
          @('409', 'トークン使用済み', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '認可可否判定（/authorization/check）'
        Overview = '認証済みユーザーに対して、指定した施設文脈・機能・カラムの実行可否を補助判定する。'
        Method = 'POST'
        Path = '/authorization/check'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエストボディ（AuthorizationCheckRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('actingFacilityId', 'int64', '✓', '作業対象施設ID'),
          @('targetFacilityId', 'int64', '-', '閲覧対象施設ID。他施設閲覧時のみ指定'),
          @('featureCode', 'string', '✓', '判定対象 `feature_code`'),
          @('columnCodes', 'string[]', '-', '同時判定する `column_code` 一覧')
        )
        PermissionLines = @(
          '認証済みセッションであること',
          '認証済みユーザーが `users.is_active=true` かつ `locked_at IS NULL` であること',
          '指定 `actingFacilityId` が担当施設であること',
          '指定 `actingFacilityId` に対応する施設が未削除であること'
        )
        ProcessingLines = @(
          '判定対象ユーザーは Bearer トークンから解決し、リクエストボディで `userId` は受け取らない',
          '自施設判定では `user_facility_assignments`、`facility_feature_settings`、`user_facility_feature_settings` を用いて `featureCode` の可否を評価する',
          'カラム判定では `facility_column_settings`、`user_facility_column_settings`、`column_catalogs.related_feature_code` を用いて可否を評価する',
          '`targetFacilityId` が指定され、`actingFacilityId` と異なる場合は、閲覧者側施設と公開元施設の両方が `deleted_at IS NULL` かつ `system_contract_status=''ACTIVE''` であること、協業グループ所属、`facility_external_view_settings`、`facility_external_column_settings` を追加で評価する',
          '本 API は補助判定用であり、各業務 API 側でも同条件を再判定する'
        )
        ResponseTitle = 'レスポンス（200：AuthorizationCheckResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('isAllowed', 'boolean', '✓', '総合判定結果'),
          @('evaluatedFeatureCode', 'string', '✓', '評価した `feature_code`'),
          @('allowedColumnCodes', 'string[]', '-', '許可された `column_code` 一覧'),
          @('deniedReasons', 'string[]', '-', '拒否理由コード一覧')
        )
        StatusRows = @(
          @('200', '判定成功', 'AuthorizationCheckResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設外または判定対象外', 'ErrorResponse'),
          @('404', '施設または機能コードが存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '認可ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`auth_login` と `facility_select` は `SYSTEM_FIXED` のため、施設・ユーザー設定で ON/OFF しない',
      '`/auth/me` は担当施設一覧のみを返し、協業グループ経由で見える施設は返さない',
      '`/auth/me` と `/auth/context` は `facilities.deleted_at IS NULL` の未削除施設だけを対象にする',
      '`/auth/context` は選択施設に対する実効 `feature_code` / `column_code` を返す',
      '他施設閲覧は、閲覧者側の `other_*` 権限と公開元施設側の公開設定の両方が有効な場合のみ許可する',
      '`column_code` は、関連 `feature_code` が有効な場合のみ成立する'
    ) },
    @{ Type = 'Heading2'; Text = '施設選択・ホーム導線ルール' },
    @{ Type = 'Bullets'; Items = @(
      '担当施設が1件の場合は `/auth/me` 取得後に当該施設を自動選択し、`/auth/context` 取得後に `/main` へ遷移する',
      '担当施設が複数件の場合のみ `/facility-select` を表示する',
      'ホーム画面の表示可否は、`/auth/context` の実効 `feature_code` / `column_code` を正本として判断する'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 運用方針' },
    @{ Type = 'Bullets'; Items = @(
      '`GET /auth/context` は画面表示制御のための一括取得 API とし、個別権限確認 API の多重呼び出しを避ける',
      '一方で、業務 API は `GET /auth/context` の結果を信頼して認可判定を省略しない',
      '施設論理削除時は関連認可設定を削除せず保持し、再契約等で `deleted_at` を解除した場合は既存設定を再利用する',
      '認証・認可仕様の正本は `機能要件.md` と `db-schema.puml` を優先し、本設計書はそれに追従して改訂する'
    ) }
  )
}
