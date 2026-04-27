@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_ユーザー管理.docx'
  ScreenLabel = 'ユーザー管理'
  CoverDateText = '2026年4月27日'
  RevisionDateText = '2026/4/27'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、ユーザー管理画面（`/user-management`）および施設グループ管理画面（`/facility-group-management`）で利用する API の設計内容を整理し、Bearer トークン上の作業対象施設に有効な担当施設割当を持つユーザーの基本情報、担当施設、施設別機能設定、施設別表示カラム設定、施設協業グループの構成を、権限制御の境界に合わせて安全に保守するための基準を定義する。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      '一覧 API と詳細 API の責務分担',
      'ユーザー基本情報編集と担当施設編集の権限境界',
      '施設グループ一覧参照と構成編集の権限境界',
      '複数テーブル更新時のトランザクション、競合検知、削除ガード',
      '初回パスワード設定案内を認証基盤へ委譲する連携方式'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = 'ユーザー管理は、医療機器管理システムの共通管理機能として、作業対象施設に有効な担当施設割当を持つ SHIP ユーザー、病院ユーザー、SHRC ユーザーの基本情報と担当施設割当を保守し、あわせて当該施設を起点とする施設協業グループの一覧参照と構成編集を行う画面群である。' },
    @{ Type = 'Paragraph'; Text = '認可判定はロール前提ではなく、施設単位で提供される機能・カラムと、ユーザー施設別に許可された機能・カラムの組み合わせを正本として行う。固定導線を除く現行採用機能は `config_scope=''FACILITY_USER''` に統一し、`normal_ship_request` / `lending_in_use_used` もユーザー施設別設定の対象に含める。子機能など追加条件を持つコードは認証認可 API および業務 API 側の補足規定に従う。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('ユーザー基本情報', '氏名、メールアドレス、アカウント種別、所属部門、所属部署、役職、連絡先など `users` に保持する項目'),
      @('担当施設設定', '既定施設、担当施設、施設別機能設定、施設別表示カラム設定をまとめた更新単位'),
      @('既定施設', 'ユーザーの主所属施設として扱う施設。`users.facility_id` と `user_facility_assignments.is_default=true` を同期する'),
      @('担当施設', 'ユーザーへ直接割り当てる作業対象施設。`user_facility_assignments` に保持する'),
      @('施設提供機能', '施設が所属・担当ユーザーへ提供する機能。`facility_feature_settings` で ON/OFF 管理する'),
      @('ユーザー施設別機能', '担当施設ごとにユーザーへ許可する `config_scope=''FACILITY_USER''` の機能。`user_facility_feature_settings` で ON/OFF 管理する'),
      @('ユーザー施設別カラム', '担当施設ごとにユーザーへ表示許可するカラム。`user_facility_column_settings` で ON/OFF 管理する'),
      @('施設協業グループ', '複数施設間の閲覧連携候補をまとめる任意の施設グループ。`facility_collaboration_groups` と `facility_collaboration_group_facilities` に保持する'),
      @('集約更新トークン', 'ユーザー集約の競合検知に用いる `users.updated_at`。担当施設更新時も同値を更新する')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面パス', '利用目的'); Rows = @(
      @('21. ユーザー管理画面', '/user-management', 'ユーザー一覧参照、ユーザー新規作成、基本情報編集、担当施設編集、初回設定案内再送、削除を行う'),
      @('22. 施設グループ管理画面', '/facility-group-management', '施設協業グループ一覧参照、グループ新規作成、グループ名編集、所属施設編集を行う')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'API の位置づけ' },
    @{ Type = 'Paragraph'; Text = '本 API 群は、ユーザー管理画面および施設グループ管理画面の初期表示に必要なコンテキスト取得、一覧取得、詳細取得、施設候補取得、ユーザー作成、ユーザー基本情報更新、担当施設更新、初回設定案内再送、削除、施設グループ作成、施設グループ更新、施設グループ削除を提供する。' },
    @{ Type = 'Paragraph'; Text = '認証そのものやパスワード再設定トークンの発行・消費は認証 API 群が担い、本書ではユーザー管理画面から認証基盤へ初回設定案内を依頼する連携までを対象とする。認証内部テーブルの CRUD 契約は本 API に露出しない。' },
    @{ Type = 'Heading2'; Text = '画面と API の関係' },
    @{ Type = 'Numbered'; Items = @(
      '画面初期表示時に `GET /user-management/context` と `GET /user-management/users` を呼び出す',
      '一覧のページ切替、絞り込み、ソート変更時に `GET /user-management/users` を再呼び出す',
      '編集モーダルで基本情報タブを開く時に `GET /user-management/users/{userId}` を呼び出す',
      '担当施設タブを開く時に `GET /user-management/users/{userId}/facility-assignments` を呼び出し、候補検索時に `GET /user-management/facilities` を呼び出す',
      '新規作成モーダル保存時に `POST /user-management/users` を呼び出す。初回設定案内を送る場合は続けて `POST /user-management/users/{userId}/setup-invitation` を呼び出す',
      '基本情報タブ保存時は `PUT /user-management/users/{userId}/profile`、担当施設タブ保存時は `PUT /user-management/users/{userId}/facility-assignments` を呼び出す',
      '初回設定案内の再送時は `POST /user-management/users/{userId}/setup-invitation` を呼び出す',
      '削除確認時は `DELETE /user-management/users/{userId}` を呼び出す',
      '施設グループ管理画面の初期表示時に `GET /facility-group-management/context` と `GET /facility-group-management/groups` を呼び出す',
      '施設グループ詳細表示時に `GET /facility-group-management/groups/{groupId}` を呼び出す',
      '施設グループ新規作成時に `POST /facility-group-management/groups` を呼び出し、所属施設編集時は `PUT /facility-group-management/groups/{groupId}` を呼び出す',
      '施設グループ削除確認時は `DELETE /facility-group-management/groups/{groupId}` を呼び出す'
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル', '利用種別', '用途'); Rows = @(
      @('users', 'READ / CREATE / UPDATE / DELETE', 'ユーザー基本情報の参照、登録、更新、論理削除、集約更新トークン管理'),
      @('user_facility_assignments', 'READ / CREATE / UPDATE / DELETE', '担当施設、既定施設、割当種別の参照と更新'),
      @('feature_catalogs', 'READ', '担当施設ごとの利用機能設定に使う機能カタログの取得'),
      @('column_catalogs', 'READ', '担当施設ごとの表示カラム設定に使うカラムカタログの取得'),
      @('facilities', 'READ', '既定施設候補、担当施設候補、所属母体導出、論理削除判定'),
      @('facility_feature_settings', 'READ', '施設単位で提供されている機能の取得'),
      @('facility_column_settings', 'READ', '施設単位で提供されている表示カラムの取得'),
      @('user_facility_feature_settings', 'READ / CREATE / UPDATE / DELETE', '`config_scope=''FACILITY_USER''` の担当施設ごとの利用機能設定の参照と保守'),
      @('user_facility_column_settings', 'READ / CREATE / UPDATE / DELETE', '担当施設ごとの表示カラム設定の参照と保守'),
      @('facility_collaboration_groups', 'READ / CREATE / UPDATE', '施設協業グループ本体の参照、登録、更新、無効化'),
      @('facility_collaboration_group_facilities', 'READ / CREATE / UPDATE / DELETE', '施設協業グループ所属施設の参照と保守')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API 共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-04-20T00:00:00Z`）',
      '一覧 API の既定並び順は `updatedAt DESC, userId ASC` とする',
      '一覧 API の既定ページサイズは `50`、上限は `200` とする',
      '施設候補検索 API の既定ページサイズは `20`、上限は `100` とする',
      '施設グループ一覧 API の既定ページサイズは `50`、上限は `200` とする'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '本API群で使用する `feature_code` は以下の通りとする。業務 API は `/auth/context` の返却値だけを信頼せず、Bearer トークン上の作業対象施設に対して `user_facility_assignments` の有効割当、`facility_feature_settings` の施設提供設定、`user_facility_feature_settings` のユーザー施設別設定を毎回再判定する。ユーザー管理APIの `availableFeatureCodes` / `enabledFeatureCodes` は `config_scope=''FACILITY_USER''` の機能を対象とし、`normal_ship_request` / `lending_in_use_used` も候補に含める。PII を含む基本情報詳細は `user_edit` を前提とし、施設グループ API は `facility_group_list` / `facility_group_edit` を前提とする。共有データ種別に対応する external 専用 `feature_code` / `column_code` は現行カタログ未採用のため、本書では施設グループ構成の保守までを対象にする。' },
    @{ Type = 'Table'; Headers = @('管理単位名', 'feature_code', '対象処理'); Rows = @(
      @('ユーザー / 一覧', '`user_list_view`', '画面コンテキスト取得、一覧取得'),
      @('ユーザー / 新規作成・編集', '`user_edit`', 'ユーザー基本情報取得、ユーザー基本情報更新、初回設定案内再送、削除、ユーザー新規作成の基本情報側'),
      @('担当施設 / 編集', '`user_facility_assignment_edit`', 'ユーザー担当施設詳細取得、施設候補取得、担当施設更新、ユーザー新規作成の担当施設設定側'),
      @('施設グループ / 一覧', '`facility_group_list`', '施設グループ画面コンテキスト取得、施設グループ一覧取得、施設グループ詳細取得'),
      @('施設グループ / 新規作成・編集', '`facility_group_edit`', '施設グループ作成、施設グループ更新、施設グループ削除')
    ) },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('画面コンテキスト取得 / 一覧取得', '`user_list_view`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '一覧参照と新規作成導線表示の前提'),
      @('ユーザー基本情報取得 / ユーザー基本情報更新 / 初回設定案内再送 / 削除', '`user_edit`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', 'PII を含む基本情報参照と基本情報変更系'),
      @('ユーザー担当施設詳細取得 / 施設候補取得 / 担当施設更新', '`user_facility_assignment_edit`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '担当施設と施設別権限設定の参照・変更系'),
      @('ユーザー新規作成', '`user_edit` と `user_facility_assignment_edit`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '新規ユーザーは基本情報と担当施設設定を同時に持つ前提で作成する'),
      @('施設グループ画面コンテキスト取得 / 一覧取得 / 詳細取得', '`facility_group_list`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`, `facility_collaboration_groups`, `facility_collaboration_group_facilities`', '施設協業グループの参照系'),
      @('施設グループ作成 / 更新 / 削除', '`facility_group_edit`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`, `facility_collaboration_groups`, `facility_collaboration_group_facilities`', '施設協業グループの変更系')
    ) },
    @{ Type = 'Heading2'; Text = '権限設定データの保存方針' },
    @{ Type = 'Paragraph'; Text = '`user_list_view`、`user_edit`、`user_facility_assignment_edit` は本 API 群を実行するための権限である。一方、ユーザー新規作成・担当施設更新で受け取る `facilityAssignments[*].enabledFeatureCodes` / `enabledColumnCodes` は、対象ユーザーに付与する業務権限の現在値を表す。画面は担当施設詳細取得や施設候補取得で返す `availableFeatureCodes` / `availableColumnCodes` を候補集合として保持し、保存時はその候補集合に対する ON/OFF を書き戻す。`normal_ship_request` / `lending_in_use_used` は `config_scope=''FACILITY_USER''` として `availableFeatureCodes` / `enabledFeatureCodes` に含める。なお `lending_in_use_used` の実効利用には施設提供設定とユーザー施設別設定に加えて親 `lending_checkout` の実効権限も必要であり、保存時も `lending_in_use_used` を ON にする場合は同じ担当施設の `lending_checkout` も ON であることを必須とする。' },
    @{ Type = 'Table'; Headers = @('入力項目', '候補集合', '保存先', '保存ルール'); Rows = @(
      @('`facilityAssignments[*].enabledFeatureCodes`', '`feature_catalogs.config_scope=''FACILITY_USER''` かつ対象施設の `facility_feature_settings.is_enabled=true` の `feature_code`。`auth_login` / `facility_select` は候補に含めない。`normal_ship_request` / `lending_in_use_used` は候補に含める', '`user_facility_feature_settings`', '候補集合の各 `feature_code` を現在値として管理し、リクエストに含むコードを `is_enabled=true`、含まないコードを `false` として作成・更新する。`lending_in_use_used` を ON にする場合は同じ担当施設の `lending_checkout` も ON にする'),
      @('`facilityAssignments[*].enabledColumnCodes`', '対象施設の `facility_column_settings.is_enabled=true` かつ `column_catalogs.related_feature_code` が施設提供されている `column_code`', '`user_facility_column_settings`', '候補集合の各 `column_code` を現在値として管理し、リクエストに含み、かつ対応機能が `enabledFeatureCodes` に含まれるコードを `is_enabled=true`、それ以外を `false` として作成・更新する')
    ) },
    @{ Type = 'Heading2'; Text = '施設グループ設定データの保存方針' },
    @{ Type = 'Paragraph'; Text = '`facility_group_list` と `facility_group_edit` は施設グループ管理 API 群を実行するための権限である。現行の `権限管理単位一覧` には external 専用 `feature_code` / `column_code` が含まれないため、本書で扱う施設グループ更新は `facility_collaboration_groups` と `facility_collaboration_group_facilities` の保守を対象とし、共有データ種別 UI に対応する他施設公開データ・カラム設定は予約仕様として別追補で定義する。' },
    @{ Type = 'Table'; Headers = @('入力項目', '候補集合', '保存先', '保存ルール'); Rows = @(
      @('`groupName`', '1〜100文字のグループ名', '`facility_collaboration_groups.group_name`', '作成時に新規登録し、更新時は対象グループへ上書きする。更新成功時は `updated_at` を更新する'),
      @('`facilityIds`', '`facilities.deleted_at IS NULL` かつ `system_contract_status=''ACTIVE''` の施設ID。設立母体は問わない', '`facility_collaboration_group_facilities`', '重複を除外した現在値として総入れ替えする。作成時・更新時とも `actingFacilityId` を必ず含める')
    ) },
    @{ Type = 'Heading2'; Text = 'トランザクションと競合制御' },
    @{ Type = 'Bullets'; Items = @(
      '`POST /user-management/users`、`PUT /user-management/users/{userId}/profile`、`PUT /user-management/users/{userId}/facility-assignments`、`DELETE /user-management/users/{userId}`、`POST /facility-group-management/groups`、`PUT /facility-group-management/groups/{groupId}`、`DELETE /facility-group-management/groups/{groupId}` は、それぞれ 1 回の API 呼び出しを 1 DB トランザクションで完結させる',
      '競合検知のトークンは `users.updated_at` を用いる。担当施設更新 API は関連テーブル更新と同時に `users.updated_at` も更新し、ユーザー集約全体の版として扱う',
      '施設グループ更新系 API の競合検知トークンは `facility_collaboration_groups.updated_at` を用いる',
      '更新系・削除系 API は `lastKnownUpdatedAt` を受け取り、取得時点の `users.updated_at` と一致しない場合は 409 (`USER_CONFLICT`) を返却する',
      '施設グループ更新系・削除系 API は `lastKnownUpdatedAt` を受け取り、取得時点の `facility_collaboration_groups.updated_at` と一致しない場合は 409 (`FACILITY_GROUP_CONFLICT`) を返却する',
      '担当施設更新では `user_facility_assignments` は差分更新し、`user_facility_feature_settings` と `user_facility_column_settings` は候補集合に対する現在値として再計算・総入れ替えする。失敗時は部分反映しない',
      '施設グループ更新では `facility_collaboration_group_facilities` を候補集合に対する現在値として再計算・総入れ替えする。失敗時は部分反映しない',
      '設定系テーブルの `created_by` / `updated_by` には実行ユーザー ID を記録する。`users` テーブルは現行スキーマ上 `updated_by` を持たないため `updated_at` のみ更新する'
    ) },
    @{ Type = 'Heading2'; Text = '管理対象スコープ' },
    @{ Type = 'Bullets'; Items = @(
      '管理対象ユーザーは、Bearer トークン上の作業対象施設に対して `user_facility_assignments.is_active=true` の有効割当を持ち、かつ当該施設が `facilities.deleted_at IS NULL` のユーザーに限る',
      '一覧 API は上記条件を満たすユーザーだけを返却する',
      '新規作成および担当施設更新では、更新後の `facilityAssignments` に作業対象施設を必ず含める',
      '詳細取得、更新、初回設定案内送信、削除で管理対象外ユーザーが指定された場合は、存在隠蔽のため 404 (`USER_NOT_FOUND`) を返却する',
      '管理対象施設グループは、`facility_collaboration_groups.is_active=true` で、かつ Bearer トークン上の `actingFacilityId` を `facility_collaboration_group_facilities` に含むグループに限る',
      '施設グループ詳細取得、更新、削除で管理対象外グループが指定された場合は、存在隠蔽のため 404 (`FACILITY_GROUP_NOT_FOUND`) を返却する'
    ) },
    @{ Type = 'Heading2'; Text = '施設・担当施設・施設グループ整合ルール' },
    @{ Type = 'Bullets'; Items = @(
      '担当施設候補は、実行ユーザー自身が `user_facility_assignments.is_active=true` の直接割当を持ち、Bearer トークン上の作業対象施設と同一 `establishment_id` に属する未削除施設に限る',
      '上記候補のうち、実行ユーザーが当該施設に対して実効 `user_facility_assignment_edit` を持つ施設だけを `/user-management/context` と `/user-management/facilities` で返却する',
      '`facility_collaboration_groups` / `facility_external_view_settings` / `facility_external_column_settings` による他施設閲覧候補は担当施設候補へ含めない',
      '新規割当・更新対象とする施設は、管理可能な担当施設候補に含まれる施設のみとする',
      '既定施設は担当施設配列に必ず含め、登録時・担当施設更新時に `users.facility_id` と `user_facility_assignments.is_default=true` を同期する',
      '`users.establishment_id` は既定施設の `establishment_id` から導出する',
      '`user_facility_assignments.assignment_type` は公開 API から受け取らず、既定施設を `PRIMARY`、それ以外を `SECONDARY` として内部導出する',
      '論理削除済み施設に紐づく既存割当行は履歴として残り得るが、本 API の新規設定候補や返却候補には含めない',
      '施設グループ構成施設候補は、`facilities.deleted_at IS NULL` かつ `system_contract_status=''ACTIVE''` の施設に限り、設立母体による制約は設けない',
      '施設グループ新規作成・更新では、更新後の `facilityIds` に `actingFacilityId` を必ず含める',
      '施設グループ内の `facilityId` 重複は認めない'
    ) },
    @{ Type = 'Heading2'; Text = '機能・カラム整合ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`feature_catalogs` は `config_scope=FACILITY_USER` かつ `is_active=true` のものをユーザー別設定対象とする',
      '`user_facility_feature_settings` は、`config_scope=FACILITY_USER` かつ対象施設の `facility_feature_settings.is_enabled=true` の機能のみ有効化できる。`normal_ship_request` / `lending_in_use_used` も対象に含める',
      '`lending_in_use_used` は `lending_checkout` の子機能として扱い、同じ担当施設で `lending_checkout` が ON でない場合はユーザー施設別設定でも ON にできない',
      '`user_facility_column_settings` は、対象施設の `facility_column_settings.is_enabled=true` かつ `column_catalogs.related_feature_code` に対応する `user_facility_feature_settings.is_enabled=true` のカラムのみ有効化できる',
      '`facility_group_list` と `facility_group_edit` は `feature_catalogs` 上の `COMMON / FACILITY_USER` コードとして扱い、施設グループ API では external 専用コードを要求しない',
      '`users.account_type` は表示分類・入力制御用途であり、認可判定には使わない'
    ) },
    @{ Type = 'Heading2'; Text = '初回設定案内の責務分担' },
    @{ Type = 'Bullets'; Items = @(
      'ユーザー作成 API は平文パスワードや再設定トークンを返却しない',
      'ユーザー管理 API は送信依頼結果だけを公開し、`password_reset_tokens` など認証内部テーブルの直接 CRUD 契約は持たない',
      '初回パスワード設定案内は `POST /user-management/users/{userId}/setup-invitation` で明示的に依頼する',
      '招待メール本文、トークン生成、期限管理、トークン消費は認証基盤の責務とし、ユーザー管理 API からは内部サービス連携で実行する',
      '初回設定案内再送の対象は `last_login_at IS NULL` の未利用ユーザーに限定する'
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Heading3'; Text = '基本エラーレスポンス（ErrorResponse）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けメッセージ'),
      @('details', 'string[]', '-', '入力エラーや整合性エラーの詳細')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API 一覧' },
    @{ Type = 'Table'; Headers = @('No', 'API 名', 'Method', 'Path', '用途', '権限'); Rows = @(
      @('1', '画面コンテキスト取得', 'GET', '/user-management/context', '画面初期表示に必要なカタログと操作制約を取得する', '`user_list_view`'),
      @('2', 'ユーザー一覧取得', 'GET', '/user-management/users', 'ユーザー一覧をページング取得する', '`user_list_view`'),
      @('3', 'ユーザー基本情報取得', 'GET', '/user-management/users/{userId}', 'ユーザー基本情報の詳細を取得する', '`user_edit`'),
      @('4', 'ユーザー担当施設詳細取得', 'GET', '/user-management/users/{userId}/facility-assignments', '担当施設と施設別権限設定の詳細を取得する', '`user_facility_assignment_edit`'),
      @('5', '施設候補取得', 'GET', '/user-management/facilities', '担当施設候補と施設提供機能・カラムを取得する', '`user_facility_assignment_edit`'),
      @('6', 'ユーザー新規作成', 'POST', '/user-management/users', 'ユーザー基本情報と担当施設設定を登録する', '`user_edit` + `user_facility_assignment_edit`'),
      @('7', 'ユーザー基本情報更新', 'PUT', '/user-management/users/{userId}/profile', 'ユーザー基本情報を更新する', '`user_edit`'),
      @('8', 'ユーザー担当施設更新', 'PUT', '/user-management/users/{userId}/facility-assignments', '既定施設、担当施設、施設別機能、施設別カラムを更新する', '`user_facility_assignment_edit`'),
      @('9', '初回設定案内送信', 'POST', '/user-management/users/{userId}/setup-invitation', '未利用ユーザーへ初回パスワード設定案内を送信する', '`user_edit`'),
      @('10', 'ユーザー削除', 'DELETE', '/user-management/users/{userId}', 'ユーザーを論理削除する', '`user_edit`'),
      @('11', '施設グループ画面コンテキスト取得', 'GET', '/facility-group-management/context', '施設グループ管理画面の初期表示に必要な施設候補と操作制約を取得する', '`facility_group_list`'),
      @('12', '施設グループ一覧取得', 'GET', '/facility-group-management/groups', '作業対象施設を含む施設グループ一覧をページング取得する', '`facility_group_list`'),
      @('13', '施設グループ詳細取得', 'GET', '/facility-group-management/groups/{groupId}', '指定した施設グループの詳細を取得する', '`facility_group_list`'),
      @('14', '施設グループ新規作成', 'POST', '/facility-group-management/groups', '施設グループを新規作成する', '`facility_group_edit`'),
      @('15', '施設グループ更新', 'PUT', '/facility-group-management/groups/{groupId}', '施設グループ名と所属施設を更新する', '`facility_group_edit`'),
      @('16', '施設グループ削除', 'DELETE', '/facility-group-management/groups/{groupId}', '施設グループを無効化する', '`facility_group_edit`')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 ユーザー・施設グループ管理機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '画面コンテキスト取得（/user-management/context）'
        Overview = 'ユーザー管理画面の初期表示に必要なアカウント種別候補、管理可能な初期施設候補、機能カタログ、カラムカタログ、ログインユーザーの操作制約を取得する。'
        Method = 'GET'
        Path = '/user-management/context'
        Auth = '要（Bearer）'
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_list_view` が有効であること',
          'レスポンス内の操作可否は同一作業対象施設に対する `user_edit` と `user_facility_assignment_edit` の実効有無から導出する'
        )
        ProcessingLines = @(
      '`feature_catalogs` から `config_scope=FACILITY_USER` かつ `is_active=true` の機能をユーザー別設定候補として表示順で取得する。`normal_ship_request` / `lending_in_use_used` も `FACILITY_USER` として取得する',
          '`column_catalogs` から `is_active=true` のカラムを表示順で取得する',
          '実行ユーザー自身が有効な直接担当施設割当を持ち、Bearer トークン上の作業対象施設と同一 `establishment_id` に属し、かつ当該施設に対して実効 `user_facility_assignment_edit` を持つ未削除施設を施設名昇順で先頭 20 件取得し、初期候補として返却する',
          '施設協業グループ経由の他施設閲覧候補は初期候補へ含めない',
          'アカウント種別候補は `SHIP`、`SHRC`、`HOSPITAL` を固定値として返却する',
          '新規作成可否は `user_edit` と `user_facility_assignment_edit` の両方が有効な場合のみ `true` とする'
        )
        ResponseTitle = 'レスポンス（200：UserManagementContextResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('initialFacilityCount', 'int32', '✓', '初期施設候補件数'),
          @('initialFacilities', 'FacilityCandidate[]', '✓', '初期表示用の管理可能施設候補'),
          @('accountTypes', 'AccountTypeOption[]', '✓', 'アカウント種別候補'),
          @('featureCatalogs', 'FeatureCatalogItem[]', '✓', '担当施設設定で利用する機能カタログ'),
          @('columnCatalogs', 'ColumnCatalogItem[]', '✓', '担当施設設定で利用するカラムカタログ'),
          @('permissions', 'UserManagementPermissionContext', '✓', 'ログインユーザーの操作制約')
        )
        ResponseSubtables = @(
          @{
            Title = 'initialFacilities要素（FacilityCandidate）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '施設ID'),
              @('facilityCode', 'string', '✓', '施設コード'),
              @('facilityName', 'string', '✓', '施設名'),
              @('establishmentId', 'int64', '✓', '設立母体ID'),
              @('systemContractStatus', 'string', '✓', 'システム利用契約状態')
            )
          },
          @{
            Title = 'accountTypes要素（AccountTypeOption）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('accountType', 'string', '✓', 'アカウント種別コード。`SHIP` / `SHRC` / `HOSPITAL`'),
              @('label', 'string', '✓', '画面表示用ラベル')
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
            Title = 'permissions要素（UserManagementPermissionContext）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('canViewList', 'boolean', '✓', '一覧表示可否'),
              @('canCreateUser', 'boolean', '✓', '新規作成可否。`user_edit` と `user_facility_assignment_edit` の両方が必要'),
              @('canEditUserProfile', 'boolean', '✓', '基本情報編集可否'),
              @('canEditFacilityAssignments', 'boolean', '✓', '担当施設編集可否'),
              @('canSendSetupInvitation', 'boolean', '✓', '初回設定案内送信可否'),
              @('canDeleteUser', 'boolean', '✓', '削除可否')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'UserManagementContextResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_list_view` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'ユーザー一覧取得（/user-management/users）'
        Overview = '検索条件に一致するユーザー一覧をページング取得する。一覧 API は要約情報のみを返し、編集に必要な詳細情報は別 API で取得する。'
        Method = 'GET'
        Path = '/user-management/users'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('name', 'query', 'string', '-', 'ユーザー名の部分一致条件'),
          @('emailAddress', 'query', 'string', '-', 'メールアドレスの部分一致条件'),
          @('defaultFacilityId', 'query', 'int64', '-', '既定施設での絞り込み条件'),
          @('accountType', 'query', 'string', '-', 'アカウント種別での絞り込み条件'),
          @('page', 'query', 'int32', '-', 'ページ番号。既定値 `1`'),
          @('pageSize', 'query', 'int32', '-', 'ページサイズ。既定値 `50`、上限 `200`'),
          @('sortBy', 'query', 'string', '-', '並び替え項目。`updatedAt` / `name` / `emailAddress` / `defaultFacilityName` / `accountType`'),
          @('sortOrder', 'query', 'string', '-', '並び順。`asc` / `desc`')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_list_view` が有効であること'
        )
        ProcessingLines = @(
          '`users.deleted_at IS NULL` かつ Bearer トークン上の作業対象施設に有効な担当施設割当を持つユーザーを対象とする',
          'ユーザー名、メールアドレス、既定施設、アカウント種別で AND 条件検索する',
          '既定施設は `users.facility_id` を用い、施設名は `facilities.deleted_at IS NULL` の施設だけ解決する',
          '一覧 API では担当施設明細や施設別権限明細は返却しない',
          '既定並び順は `updated_at DESC, user_id ASC` とする'
        )
        ResponseTitle = 'レスポンス（200：UserManagementUserListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('page', 'int32', '✓', '現在ページ'),
          @('pageSize', 'int32', '✓', 'ページサイズ'),
          @('totalCount', 'int32', '✓', '検索結果総件数'),
          @('items', 'UserManagementUserSummary[]', '✓', 'ユーザー一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（UserManagementUserSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('userId', 'int64', '✓', 'ユーザーID'),
              @('name', 'string', '✓', 'ユーザー名'),
              @('emailAddress', 'string', '✓', 'メールアドレス'),
              @('defaultFacilityId', 'int64', '-', '既定施設ID'),
              @('defaultFacilityName', 'string', '-', '既定施設名'),
              @('accountType', 'string', '✓', 'アカウント種別'),
              @('assignedFacilityCount', 'int32', '✓', '未削除・有効な担当施設数'),
              @('updatedAt', 'string(datetime)', '✓', '集約更新トークンとしても使う更新日時')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'UserManagementUserListResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_list_view` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'ユーザー基本情報取得（/user-management/users/{userId}）'
        Overview = '指定したユーザーの基本情報詳細を取得する。基本情報編集で必要な項目のみを返却し、担当施設設定は含めない。'
        Method = 'GET'
        Path = '/user-management/users/{userId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('userId', 'path', 'int64', '✓', '対象ユーザーID')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `users` が `deleted_at IS NULL` で存在することを確認する',
          '対象ユーザーが Bearer トークン上の作業対象施設に対する有効な担当施設割当を持つことを確認し、管理対象外なら 404 (`USER_NOT_FOUND`) を返却する',
          '基本情報編集で扱う `users` の項目を返却する',
          '競合検知用に `updated_at` を返却する'
        )
        ResponseTitle = 'レスポンス（200：UserManagementUserProfileResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'UserManagementUserProfileDetail', '✓', 'ユーザー基本情報')
        )
        ResponseSubtables = @(
          @{
            Title = 'item要素（UserManagementUserProfileDetail）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('userId', 'int64', '✓', 'ユーザーID'),
              @('name', 'string', '✓', 'ユーザー名'),
              @('emailAddress', 'string', '✓', 'メールアドレス'),
              @('accountType', 'string', '✓', 'アカウント種別'),
              @('defaultFacilityId', 'int64', '-', '既定施設ID'),
              @('defaultFacilityName', 'string', '-', '既定施設名'),
              @('departmentName', 'string', '-', '所属部門'),
              @('sectionName', 'string', '-', '所属部署'),
              @('positionName', 'string', '-', '役職'),
              @('contactPersonName', 'string', '-', '連絡担当者名'),
              @('phoneNumber', 'string', '-', '電話番号'),
              @('lastLoginAt', 'string(datetime)', '-', '最終ログイン日時'),
              @('createdAt', 'string(datetime)', '✓', '作成日時'),
              @('updatedAt', 'string(datetime)', '✓', '集約更新トークンとしても使う更新日時')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'UserManagementUserProfileResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_edit` なし', 'ErrorResponse'),
          @('404', '対象ユーザーが存在しない、または作業対象施設の管理対象外', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'ユーザー担当施設詳細取得（/user-management/users/{userId}/facility-assignments）'
        Overview = '指定したユーザーの既定施設、担当施設、施設別機能設定、施設別表示カラム設定の詳細を取得する。'
        Method = 'GET'
        Path = '/user-management/users/{userId}/facility-assignments'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('userId', 'path', 'int64', '✓', '対象ユーザーID')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignment_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `users` が `deleted_at IS NULL` で存在することを確認する',
          '対象ユーザーが Bearer トークン上の作業対象施設に対する有効な担当施設割当を持つことを確認し、管理対象外なら 404 (`USER_NOT_FOUND`) を返却する',
          '`facilities.deleted_at IS NULL` かつ `user_facility_assignments.is_active=true` の担当施設のみ返却する',
          '各担当施設について `feature_catalogs.config_scope=''FACILITY_USER''` かつ `facility_feature_settings.is_enabled=true` の機能コードを `availableFeatureCodes` として返却する。`auth_login` / `facility_select` は含めない。`normal_ship_request` / `lending_in_use_used` は候補に含める',
          '各担当施設について `facility_column_settings.is_enabled=true` かつ関連機能が施設提供されているカラムコードを `availableColumnCodes` として返却する',
          '競合検知用に `users.updated_at` を返却する'
        )
        ResponseTitle = 'レスポンス（200：UserManagementFacilityAssignmentsResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('userId', 'int64', '✓', 'ユーザーID'),
          @('defaultFacilityId', 'int64', '-', '既定施設ID'),
          @('updatedAt', 'string(datetime)', '✓', '集約更新トークンとしても使う更新日時'),
          @('items', 'UserFacilityAssignmentDetail[]', '✓', '担当施設一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（UserFacilityAssignmentDetail）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('userFacilityAssignmentId', 'int64', '✓', 'ユーザー施設割当ID'),
              @('facilityId', 'int64', '✓', '施設ID'),
              @('facilityCode', 'string', '✓', '施設コード'),
              @('facilityName', 'string', '✓', '施設名'),
              @('isDefault', 'boolean', '✓', '既定施設フラグ'),
              @('availableFeatureCodes', 'string[]', '✓', '当該施設で提供されているユーザー別設定対象の機能コード一覧。`config_scope=FACILITY_USER` のみ'),
              @('availableColumnCodes', 'string[]', '✓', '当該施設で提供されているカラムコード一覧'),
              @('enabledFeatureCodes', 'string[]', '✓', '当該ユーザーへ有効化済みのユーザー別設定対象機能コード一覧。`config_scope=FACILITY_USER` のみ'),
              @('enabledColumnCodes', 'string[]', '✓', '当該ユーザーへ有効化済みのカラムコード一覧')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'UserManagementFacilityAssignmentsResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_facility_assignment_edit` なし', 'ErrorResponse'),
          @('404', '対象ユーザーが存在しない、または作業対象施設の管理対象外', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '施設候補取得（/user-management/facilities）'
        Overview = '担当施設選択で利用する管理可能な担当施設候補と、各施設で提供されている機能・表示カラムをページング取得する。協業グループ経由の他施設閲覧候補は含めない。'
        Method = 'GET'
        Path = '/user-management/facilities'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('keyword', 'query', 'string', '-', '施設コードまたは施設名の部分一致条件'),
          @('page', 'query', 'int32', '-', 'ページ番号。既定値 `1`'),
          @('pageSize', 'query', 'int32', '-', 'ページサイズ。既定値 `20`、上限 `100`')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignment_edit` が有効であること'
        )
        ProcessingLines = @(
          '候補施設は、実行ユーザー自身が `user_facility_assignments.is_active=true` の直接割当を持ち、Bearer トークン上の作業対象施設と同一 `establishment_id` に属し、かつ当該施設に対して実効 `user_facility_assignment_edit` を持つ `facilities.deleted_at IS NULL` の施設に限る',
          '施設コード、施設名を部分一致で検索し、施設名昇順で返却する',
          '各施設について `feature_catalogs.config_scope=''FACILITY_USER''` かつ `facility_feature_settings.is_enabled=true` の機能コード一覧を返却する。`auth_login` / `facility_select` は含めない。`normal_ship_request` / `lending_in_use_used` は候補に含める',
          '各施設について `facility_column_settings.is_enabled=true` かつ関連機能が施設提供されているカラムコード一覧を返却する'
        )
        ResponseTitle = 'レスポンス（200：UserManagementFacilityListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('page', 'int32', '✓', '現在ページ'),
          @('pageSize', 'int32', '✓', 'ページサイズ'),
          @('totalCount', 'int32', '✓', '検索結果件数'),
          @('items', 'FacilityPermissionCandidate[]', '✓', '管理可能な施設候補一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（FacilityPermissionCandidate）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '施設ID'),
              @('facilityCode', 'string', '✓', '施設コード'),
              @('facilityName', 'string', '✓', '施設名'),
              @('establishmentId', 'int64', '✓', '設立母体ID'),
              @('systemContractStatus', 'string', '✓', 'システム利用契約状態'),
              @('availableFeatureCodes', 'string[]', '✓', '当該施設で提供されているユーザー別設定対象の機能コード一覧。`config_scope=FACILITY_USER` のみ'),
              @('availableColumnCodes', 'string[]', '✓', '当該施設で提供されているカラムコード一覧')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'UserManagementFacilityListResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_facility_assignment_edit` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'ユーザー新規作成（/user-management/users）'
        Overview = 'ユーザー基本情報、既定施設、担当施設、施設別機能設定、施設別表示カラム設定を一括登録する。新規作成は利用可能な担当施設がないと成立しないため、基本情報権限と担当施設権限の両方を必須とし、作成後も作業対象施設の管理対象に残るよう担当施設へ作業対象施設を含める。'
        Method = 'POST'
        Path = '/user-management/users'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('name', 'string', '✓', 'ユーザー名'),
          @('emailAddress', 'string', '✓', 'メールアドレス（ログイン ID）'),
          @('accountType', 'string', '✓', 'アカウント種別。`SHIP` / `SHRC` / `HOSPITAL`'),
          @('defaultFacilityId', 'int64', '✓', '既定施設ID'),
          @('departmentName', 'string', '-', '所属部門'),
          @('sectionName', 'string', '-', '所属部署'),
          @('positionName', 'string', '-', '役職'),
          @('contactPersonName', 'string', '-', '連絡担当者名'),
          @('phoneNumber', 'string', '-', '電話番号'),
          @('facilityAssignments', 'UserFacilityAssignmentWriteModel[]', '✓', '担当施設ごとの割当・機能・表示カラム設定')
        )
        RequestSubtables = @(
          @{
            Title = 'facilityAssignments要素（UserFacilityAssignmentWriteModel）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '担当施設ID'),
              @('enabledFeatureCodes', 'string[]', '✓', '当該施設でユーザーへ許可するユーザー別設定対象機能コード一覧。`config_scope=FACILITY_USER` のみ'),
              @('enabledColumnCodes', 'string[]', '✓', '当該施設でユーザーへ表示許可するカラムコード一覧')
            )
          }
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_edit` が有効であること',
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignment_edit` が有効であること'
        )
        ProcessingLines = @(
          '未削除ユーザー間で `users.email_address` の重複を禁止する',
          '作業対象施設が `facilityAssignments.facilityId` に含まれていることを確認し、含まれない場合は 400 を返却する',
          '`defaultFacilityId` は `facilityAssignments.facilityId` のいずれかと一致しなければならない',
          '担当施設は重複不可とし、すべて実行ユーザーにとって管理可能な担当施設候補に含まれることを確認する。候補外施設が含まれる場合は 404 (`FACILITY_NOT_FOUND`) を返却する',
          'すべての担当施設が `defaultFacilityId` と同一 `establishment_id` に属することを確認し、満たさない場合は 400 を返却する',
          '`users.establishment_id` は `defaultFacilityId` に紐づく `facilities.establishment_id` から導出する',
          '`users.facility_id` には `defaultFacilityId` を保存する',
          '`users.password_hash` は認証基盤内部のユーザー作成処理でランダム初期ハッシュを設定し、平文パスワードは発行しない',
          '`user_facility_assignments` を作成し、`defaultFacilityId` のみ `is_default=true`、それ以外は `false` とする',
          '`user_facility_assignments.assignment_type` は `defaultFacilityId` の施設を `PRIMARY`、それ以外を `SECONDARY` として内部導出する',
          '`enabledFeatureCodes` は、対象施設の `availableFeatureCodes`（`feature_catalogs.config_scope=''FACILITY_USER''` かつ `facility_feature_settings.is_enabled=true` の `feature_code`）の部分集合でなければならない。`auth_login` と `facility_select` を含む `config_scope=''SYSTEM_FIXED''` の `feature_code` は受け付けない。`normal_ship_request` / `lending_in_use_used` は `FACILITY_USER` として受け付ける',
          '`enabledFeatureCodes` に `lending_in_use_used` を含める場合は、同じ担当施設の `enabledFeatureCodes` に `lending_checkout` も含めなければならない。含まれない場合は 409 (`FACILITY_PERMISSION_SCOPE_CONFLICT`) とする',
          '`user_facility_feature_settings` は、前述の候補集合の各 `feature_code` を現在値として管理し、`enabledFeatureCodes` に含むコードを `is_enabled=true`、含まないコードを `false` として作成する',
          '`enabledColumnCodes` は、対象施設の `availableColumnCodes`（`facility_column_settings.is_enabled=true` かつ関連機能が施設提供されている `column_code`）の部分集合でなければならない',
          '`user_facility_column_settings` は、前述の候補集合の各 `column_code` を現在値として管理し、`enabledColumnCodes` に含み、かつ対応機能が `enabledFeatureCodes` に含まれるコードを `is_enabled=true`、それ以外を `false` として作成する',
          '作成処理は 1 トランザクションで実行する'
        )
        ExtraTables = @(
          @{
            Title = '永続化マッピング'
            Headers = @('テーブル', '対象カラム / 操作', '設定値 / 反映内容', '備考')
            Rows = @(
              @('`users`', '`user_id`', '新規採番する', 'レスポンスの `userId` として返却する'),
              @('`users`', '`name`', 'リクエスト `name` を保存する', '-'),
              @('`users`', '`email_address`', 'リクエスト `emailAddress` を保存する', '未削除ユーザー間で一意に保つ'),
              @('`users`', '`account_type`', 'リクエスト `accountType` を保存する', '`SHIP` / `SHRC` / `HOSPITAL`'),
              @('`users`', '`establishment_id`', '`defaultFacilityId` に紐づく `facilities.establishment_id` を保存する', '既定施設と同一設立母体に統一する'),
              @('`users`', '`facility_id`', 'リクエスト `defaultFacilityId` を保存する', '主所属施設。`user_facility_assignments.is_default=true` の施設と同期する'),
              @('`users`', '`department_name` / `section_name` / `position_name` / `contact_person_name` / `phone_number`', 'リクエスト `departmentName` / `sectionName` / `positionName` / `contactPersonName` / `phoneNumber` を対応カラムへ保存する', '未指定項目は `NULL` を許容する'),
              @('`users`', '`password_hash`', '認証基盤内部で生成したランダム初期ハッシュを保存する', '平文パスワードは発行しない'),
              @('`users`', '`is_active` / `locked_at` / `lock_reason` / `last_login_at` / `deleted_at`', '`true` / `NULL` / `NULL` / `NULL` / `NULL` で作成する', '初回ログイン前・未ロック・未削除状態で開始する'),
              @('`users`', '`created_at` / `updated_at`', '作成時点の日時を設定する', '`updated_at` は集約更新トークンを兼ねる'),
              @('`user_facility_assignments`', '`user_facility_assignment_id`', '担当施設ごとに新規採番する', '1 施設につき 1 行作成する'),
              @('`user_facility_assignments`', '`user_id` / `facility_id`', '新規作成した `users.user_id` と `facilityAssignments[*].facilityId` を保存する', '`(user_id, facility_id)` は一意に保つ'),
              @('`user_facility_assignments`', '`assignment_type` / `is_default`', '`defaultFacilityId` の施設を `PRIMARY` / `true`、それ以外を `SECONDARY` / `false` として保存する', '公開 API からは受け取らず内部導出する'),
              @('`user_facility_assignments`', '`is_active` / `valid_from` / `valid_to`', '`true` / `NULL` / `NULL` で作成する', '失効期間指定は本 API では受け付けない'),
              @('`user_facility_assignments`', '`created_by` / `updated_by` / `created_at` / `updated_at`', '実行ユーザー ID と作成時点の日時を設定する', '監査用'),
              @('`user_facility_feature_settings`', '`user_facility_feature_setting_id`', '候補 `feature_code` ごとの行に対して新規採番する', '1 施設内で候補機能ごとに 1 行作成する'),
              @('`user_facility_feature_settings`', '`user_facility_assignment_id` / `feature_code` / `is_enabled`', '各担当施設の候補集合 `availableFeatureCodes` ごとに 1 行作成し、`enabledFeatureCodes` に含むコードを `true`、含まないコードを `false` で保存する', '`config_scope=''FACILITY_USER''` かつ施設提供中の機能のみ対象'),
              @('`user_facility_feature_settings`', '`created_by` / `updated_by` / `created_at` / `updated_at`', '実行ユーザー ID と作成時点の日時を設定する', '監査用'),
              @('`user_facility_column_settings`', '`user_facility_column_setting_id`', '候補 `column_code` ごとの行に対して新規採番する', '1 施設内で候補カラムごとに 1 行作成する'),
              @('`user_facility_column_settings`', '`user_facility_assignment_id` / `column_code` / `is_enabled`', '各担当施設の候補集合 `availableColumnCodes` ごとに 1 行作成し、`enabledColumnCodes` に含み、かつ対応機能が `enabledFeatureCodes` に含まれるコードを `true`、それ以外を `false` で保存する', '施設提供中かつ対応機能が有効なカラムのみ対象'),
              @('`user_facility_column_settings`', '`created_by` / `updated_by` / `created_at` / `updated_at`', '実行ユーザー ID と作成時点の日時を設定する', '監査用')
            )
          }
        )
        ResponseTitle = 'レスポンス（201：UserManagementUserCreateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'UserManagementUserProfileDetail', '✓', '登録後のユーザー基本情報')
        )
        ResponseSubtables = @(
          @{
            Title = 'item要素（UserManagementUserProfileDetail）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('userId', 'int64', '✓', 'ユーザーID'),
              @('name', 'string', '✓', 'ユーザー名'),
              @('emailAddress', 'string', '✓', 'メールアドレス'),
              @('accountType', 'string', '✓', 'アカウント種別'),
              @('defaultFacilityId', 'int64', '-', '既定施設ID'),
              @('defaultFacilityName', 'string', '-', '既定施設名'),
              @('departmentName', 'string', '-', '所属部門'),
              @('sectionName', 'string', '-', '所属部署'),
              @('positionName', 'string', '-', '役職'),
              @('contactPersonName', 'string', '-', '連絡担当者名'),
              @('phoneNumber', 'string', '-', '電話番号'),
              @('lastLoginAt', 'string(datetime)', '-', '最終ログイン日時。新規作成直後は `null`'),
              @('createdAt', 'string(datetime)', '✓', '作成日時'),
              @('updatedAt', 'string(datetime)', '✓', '集約更新トークンとしても使う更新日時')
            )
          }
        )
        StatusRows = @(
          @('201', '登録成功', 'UserManagementUserCreateResponse'),
          @('400', '入力不正、作業対象施設または既定施設が担当施設に含まれない、担当施設重複、同一設立母体違反', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_edit` または `user_facility_assignment_edit` なし', 'ErrorResponse'),
          @('404', '指定施設が存在しない、論理削除済み、または管理可能な担当施設候補外である。機能コード、カラムコードが存在しない場合も含む', 'ErrorResponse'),
          @('409', 'メールアドレス重複、または施設提供設定と矛盾する機能・カラム指定', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'ユーザー基本情報更新（/user-management/users/{userId}/profile）'
        Overview = '指定したユーザーの基本情報を更新する。担当施設や既定施設は変更せず、`user_edit` 権限の範囲に閉じる。'
        Method = 'PUT'
        Path = '/user-management/users/{userId}/profile'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('userId', 'path', 'int64', '✓', '更新対象ユーザーID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('lastKnownUpdatedAt', 'string(datetime)', '✓', '取得時点の `updatedAt`。競合検知に用いる'),
          @('name', 'string', '✓', 'ユーザー名'),
          @('emailAddress', 'string', '✓', 'メールアドレス'),
          @('accountType', 'string', '✓', 'アカウント種別'),
          @('departmentName', 'string', '-', '所属部門'),
          @('sectionName', 'string', '-', '所属部署'),
          @('positionName', 'string', '-', '役職'),
          @('contactPersonName', 'string', '-', '連絡担当者名'),
          @('phoneNumber', 'string', '-', '電話番号')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `users` が `deleted_at IS NULL` で存在することを確認する',
          '対象ユーザーが Bearer トークン上の作業対象施設に対する有効な担当施設割当を持つことを確認し、管理対象外なら 404 (`USER_NOT_FOUND`) を返却する',
          '`lastKnownUpdatedAt` と `users.updated_at` を比較し、不一致時は 409 (`USER_CONFLICT`) を返却する',
          '自身以外に同一メールアドレスを持つ未削除ユーザーが存在しないことを確認する',
          '担当施設関連テーブルには変更を加えない',
          '更新成功時は `users.updated_at` を現在時刻へ更新する',
          '更新処理は 1 トランザクションで実行する'
        )
        ExtraTables = @(
          @{
            Title = '永続化マッピング'
            Headers = @('テーブル', '対象カラム / 操作', '設定値 / 反映内容', '備考')
            Rows = @(
              @('`users`', '`name` / `email_address` / `account_type` / `department_name` / `section_name` / `position_name` / `contact_person_name` / `phone_number`', '対応するリクエスト項目で上書き更新する', '未指定可の項目は `NULL` を許容する'),
              @('`users`', '`updated_at`', '更新時点の日時へ更新する', '`lastKnownUpdatedAt` による競合チェック後に反映する'),
              @('`users`', '`establishment_id` / `facility_id` / `password_hash` / `is_active` / `locked_at` / `lock_reason` / `last_login_at` / `created_at` / `deleted_at`', '変更しない', '担当施設、認証状態、作成日時、論理削除状態は本 API の対象外'),
              @('`user_facility_assignments` / `user_facility_feature_settings` / `user_facility_column_settings`', '行更新なし', '変更しない', '担当施設設定は `PUT /user-management/users/{userId}/facility-assignments` でのみ更新する')
            )
          }
        )
        ResponseTitle = 'レスポンス（200：UserManagementUserProfileResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'UserManagementUserProfileDetail', '✓', '更新後のユーザー基本情報')
        )
        ResponseSubtables = @(
          @{
            Title = 'item要素（UserManagementUserProfileDetail）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('userId', 'int64', '✓', 'ユーザーID'),
              @('name', 'string', '✓', 'ユーザー名'),
              @('emailAddress', 'string', '✓', 'メールアドレス'),
              @('accountType', 'string', '✓', 'アカウント種別'),
              @('defaultFacilityId', 'int64', '-', '既定施設ID'),
              @('defaultFacilityName', 'string', '-', '既定施設名'),
              @('departmentName', 'string', '-', '所属部門'),
              @('sectionName', 'string', '-', '所属部署'),
              @('positionName', 'string', '-', '役職'),
              @('contactPersonName', 'string', '-', '連絡担当者名'),
              @('phoneNumber', 'string', '-', '電話番号'),
              @('lastLoginAt', 'string(datetime)', '-', '最終ログイン日時'),
              @('createdAt', 'string(datetime)', '✓', '作成日時'),
              @('updatedAt', 'string(datetime)', '✓', '更新後の集約更新トークン')
            )
          }
        )
        StatusRows = @(
          @('200', '更新成功', 'UserManagementUserProfileResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_edit` なし', 'ErrorResponse'),
          @('404', '対象ユーザーが存在しない、または作業対象施設の管理対象外', 'ErrorResponse'),
          @('409', 'メールアドレス重複または更新競合', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'ユーザー担当施設更新（/user-management/users/{userId}/facility-assignments）'
        Overview = '指定したユーザーの既定施設、担当施設、施設別機能設定、施設別表示カラム設定を更新する。更新対象は担当施設設定に閉じ、基本情報項目は変更しない。更新後も対象ユーザーは作業対象施設の管理対象に残る必要がある。'
        Method = 'PUT'
        Path = '/user-management/users/{userId}/facility-assignments'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('userId', 'path', 'int64', '✓', '更新対象ユーザーID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('lastKnownUpdatedAt', 'string(datetime)', '✓', '取得時点の `updatedAt`。競合検知に用いる'),
          @('defaultFacilityId', 'int64', '✓', '既定施設ID'),
          @('facilityAssignments', 'UserFacilityAssignmentWriteModel[]', '✓', '担当施設ごとの割当・機能・表示カラム設定')
        )
        RequestSubtables = @(
          @{
            Title = 'facilityAssignments要素（UserFacilityAssignmentWriteModel）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '担当施設ID'),
              @('enabledFeatureCodes', 'string[]', '✓', '当該施設でユーザーへ許可する機能コード一覧'),
              @('enabledColumnCodes', 'string[]', '✓', '当該施設でユーザーへ表示許可するカラムコード一覧')
            )
          }
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignment_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `users` が `deleted_at IS NULL` で存在することを確認する',
          '対象ユーザーが Bearer トークン上の作業対象施設に対する有効な担当施設割当を持つことを確認し、管理対象外なら 404 (`USER_NOT_FOUND`) を返却する',
          '`lastKnownUpdatedAt` と `users.updated_at` を比較し、不一致時は 409 (`USER_CONFLICT`) を返却する',
          '更新後の `facilityAssignments` に作業対象施設が含まれていることを確認し、含まれない場合は 400 を返却する',
          '`defaultFacilityId` は `facilityAssignments.facilityId` のいずれかと一致しなければならない',
          '担当施設は重複不可とし、すべて実行ユーザーにとって管理可能な担当施設候補に含まれることを確認する。候補外施設が含まれる場合は 404 (`FACILITY_NOT_FOUND`) を返却する',
          'すべての担当施設が `defaultFacilityId` と同一 `establishment_id` に属することを確認し、満たさない場合は 400 を返却する',
          '`users.establishment_id` は `defaultFacilityId` に紐づく `facilities.establishment_id` から導出する',
          '`users.facility_id` を `defaultFacilityId` へ更新する',
          '既存担当施設との差分を比較し、削除された施設の `user_facility_feature_settings`、`user_facility_column_settings`、`user_facility_assignments` を削除する',
          '残存・追加施設について `user_facility_assignments` を更新または追加し、`defaultFacilityId` のみ `is_default=true`、それ以外は `false` とする',
          '`user_facility_assignments.assignment_type` は `defaultFacilityId` の施設を `PRIMARY`、それ以外を `SECONDARY` として内部導出する',
          '`enabledFeatureCodes` は、対象施設の `availableFeatureCodes` の部分集合でなければならず、`auth_login` と `facility_select` を含む `config_scope=''SYSTEM_FIXED''` の `feature_code` は受け付けない。`normal_ship_request` / `lending_in_use_used` は `FACILITY_USER` として受け付ける',
          '`enabledFeatureCodes` に `lending_in_use_used` を含める場合は、同じ担当施設の `enabledFeatureCodes` に `lending_checkout` も含めなければならない。含まれない場合は 409 (`FACILITY_PERMISSION_SCOPE_CONFLICT`) とする',
          '`enabledColumnCodes` は、対象施設の `availableColumnCodes` の部分集合でなければならない',
          '残存・追加施設の `user_facility_feature_settings` / `user_facility_column_settings` は候補集合に対する現在値として総入れ替えし、`enabledFeatureCodes` / `enabledColumnCodes` に含むコードを `true`、含まないコードを `false` へ更新する',
          '更新前後で対象ユーザーの担当施設または管理系 feature が変化する施設について、フル権限ユーザー管理者数が 1 件から 0 件にならないことを確認し、満たさない場合は 409 (`LAST_USER_ADMIN_FORBIDDEN`) を返却する',
          '関連テーブル更新と同時に `users.updated_at` も現在時刻へ更新する',
          '更新処理は 1 トランザクションで実行する'
        )
        ExtraTables = @(
          @{
            Title = '永続化マッピング'
            Headers = @('テーブル', '対象カラム / 操作', '設定値 / 反映内容', '備考')
            Rows = @(
              @('`users`', '`establishment_id` / `facility_id`', '`defaultFacilityId` に紐づく `facilities.establishment_id` と `defaultFacilityId` へ更新する', '既定施設と設立母体を同期する'),
              @('`users`', '`updated_at`', '更新時点の日時へ更新する', '集約更新トークンを再採番する'),
              @('`users`', '`name` / `email_address` / `account_type` / `department_name` / `section_name` / `position_name` / `contact_person_name` / `phone_number` / `password_hash` / `is_active` / `locked_at` / `lock_reason` / `last_login_at` / `created_at` / `deleted_at`', '変更しない', '基本情報更新、認証状態変更、作成日時、論理削除は本 API の対象外'),
              @('`user_facility_assignments`', '削除された施設の行', '物理削除する', '対応する `user_facility_feature_settings` / `user_facility_column_settings` を先に削除する'),
              @('`user_facility_assignments`', '残存施設の `user_facility_assignment_id` / 追加施設の `user_facility_assignment_id`', '残存施設は既存 ID を維持し、追加施設は新規採番する', '担当施設行の識別子を差分更新で管理する'),
              @('`user_facility_assignments`', '残存・追加施設の `user_id` / `facility_id`', '対象ユーザー ID と `facilityAssignments[*].facilityId` で更新または追加する', '追加時は 1 行作成する'),
              @('`user_facility_assignments`', '残存・追加施設の `assignment_type` / `is_default`', '`defaultFacilityId` の施設を `PRIMARY` / `true`、それ以外を `SECONDARY` / `false` へ更新する', '公開 API からは受け取らない'),
              @('`user_facility_assignments`', '残存・追加施設の `is_active` / `valid_from` / `valid_to`', '`is_active=true` を維持し、期間項目は本 API では更新しない。追加行は `true` / `NULL` / `NULL` で作成する', '失効期間指定は本 API の対象外'),
              @('`user_facility_assignments`', '残存・追加施設の `updated_by` / `updated_at`、追加行の `created_by` / `created_at`', '実行ユーザー ID と更新時点の日時を設定する', '監査用'),
              @('`user_facility_feature_settings`', '残存・追加施設の全候補 `feature_code` 行', '候補集合に対する現在値として総入れ替えし、`enabledFeatureCodes` に含むコードを `true`、含まないコードを `false` へ更新する', '削除施設分の行は物理削除する'),
              @('`user_facility_feature_settings`', '`updated_by` / `updated_at`、追加行の `created_by` / `created_at`', '実行ユーザー ID と更新時点の日時を設定する', '監査用'),
              @('`user_facility_column_settings`', '残存・追加施設の全候補 `column_code` 行', '候補集合に対する現在値として総入れ替えし、`enabledColumnCodes` に含み、かつ対応機能が有効なコードを `true`、それ以外を `false` へ更新する', '削除施設分の行は物理削除する'),
              @('`user_facility_column_settings`', '`updated_by` / `updated_at`、追加行の `created_by` / `created_at`', '実行ユーザー ID と更新時点の日時を設定する', '監査用')
            )
          }
        )
        ResponseTitle = 'レスポンス（200：UserManagementFacilityAssignmentsResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('userId', 'int64', '✓', 'ユーザーID'),
          @('defaultFacilityId', 'int64', '-', '既定施設ID'),
          @('updatedAt', 'string(datetime)', '✓', '更新後の集約更新トークン'),
          @('items', 'UserFacilityAssignmentDetail[]', '✓', '更新後の担当施設一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（UserFacilityAssignmentDetail）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('userFacilityAssignmentId', 'int64', '✓', 'ユーザー施設割当ID'),
              @('facilityId', 'int64', '✓', '施設ID'),
              @('facilityCode', 'string', '✓', '施設コード'),
              @('facilityName', 'string', '✓', '施設名'),
              @('isDefault', 'boolean', '✓', '既定施設フラグ'),
              @('availableFeatureCodes', 'string[]', '✓', '当該施設で提供されているユーザー別設定対象の機能コード一覧。`config_scope=FACILITY_USER` のみ'),
              @('availableColumnCodes', 'string[]', '✓', '当該施設で提供されているカラムコード一覧'),
              @('enabledFeatureCodes', 'string[]', '✓', '当該ユーザーへ有効化済みのユーザー別設定対象機能コード一覧。`config_scope=FACILITY_USER` のみ'),
              @('enabledColumnCodes', 'string[]', '✓', '当該ユーザーへ有効化済みのカラムコード一覧')
            )
          }
        )
        StatusRows = @(
          @('200', '更新成功', 'UserManagementFacilityAssignmentsResponse'),
          @('400', '入力不正、作業対象施設または既定施設が担当施設に含まれない、担当施設重複、同一設立母体違反', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_facility_assignment_edit` なし', 'ErrorResponse'),
          @('404', '対象ユーザーが存在しない、または作業対象施設の管理対象外。指定施設が存在しない、論理削除済み、または管理可能な担当施設候補外である場合、機能コード、カラムコードが存在しない場合も含む', 'ErrorResponse'),
          @('409', '施設提供設定と矛盾する機能・カラム指定、更新競合、または最後のユーザー管理者不在化', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '初回設定案内送信（/user-management/users/{userId}/setup-invitation）'
        Overview = '未利用ユーザーに対して初回パスワード設定案内を送信する。トークン生成とメール送信は認証基盤へ委譲し、ユーザー管理 API は依頼結果だけを返す。'
        Method = 'POST'
        Path = '/user-management/users/{userId}/setup-invitation'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('userId', 'path', 'int64', '✓', '対象ユーザーID')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `users` が `deleted_at IS NULL` で存在することを確認する',
          '対象ユーザーが Bearer トークン上の作業対象施設に対する有効な担当施設割当を持つことを確認し、管理対象外なら 404 (`USER_NOT_FOUND`) を返却する',
          '`last_login_at IS NOT NULL` の既利用ユーザーには送信しない。既利用ユーザーの再設定は認証 API の `/auth/password/forgot` を利用する',
          '認証基盤内部サービスへ、旧未使用トークン無効化、新規招待トークン発行、メール送信を一括依頼し、成功時は 202 を返却する',
          '平文パスワードや再設定トークン文字列は API レスポンスに含めない'
        )
        ResponseTitle = 'レスポンス（202：UserSetupInvitationResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('status', 'string', '✓', '受理状態。`ACCEPTED`'),
          @('targetEmailAddress', 'string', '✓', '送信対象メールアドレス')
        )
        StatusRows = @(
          @('202', '送信依頼受理', 'UserSetupInvitationResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_edit` なし', 'ErrorResponse'),
          @('404', '対象ユーザーが存在しない、または作業対象施設の管理対象外', 'ErrorResponse'),
          @('409', '対象ユーザーがすでに初回利用済みである', 'ErrorResponse'),
          @('500', 'トークン発行または送信依頼に失敗', 'ErrorResponse')
        )
      },
      @{
        Title = 'ユーザー削除（/user-management/users/{userId}）'
        Overview = '指定したユーザーを論理削除する。自身の削除や、対象ユーザーが担当するいずれかの施設で最後のユーザー管理者を失わせる削除は認めない。'
        Method = 'DELETE'
        Path = '/user-management/users/{userId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('userId', 'path', 'int64', '✓', '削除対象ユーザーID'),
          @('lastKnownUpdatedAt', 'query', 'string(datetime)', '✓', '取得時点の `updatedAt`。競合検知に用いる')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `users` が `deleted_at IS NULL` で存在することを確認する',
          '対象ユーザーが Bearer トークン上の作業対象施設に対する有効な担当施設割当を持つことを確認し、管理対象外なら 404 (`USER_NOT_FOUND`) を返却する',
          '`lastKnownUpdatedAt` と `users.updated_at` を比較し、不一致時は 409 (`USER_CONFLICT`) を返却する',
          '実行ユーザー自身を削除対象にすることはできない',
          '対象ユーザーが有効割当を持つ各施設について、削除によりフル権限ユーザー管理者数が 1 件から 0 件になる場合は削除不可とする',
          '`users.deleted_at` と `users.updated_at` を現在日時へ更新し、`is_active=false` とする',
          '対象ユーザーの `user_facility_column_settings`、`user_facility_feature_settings`、`user_facility_assignments` を削除する',
          '削除処理は 1 トランザクションで実行する'
        )
        ExtraTables = @(
          @{
            Title = '永続化マッピング'
            Headers = @('テーブル', '対象カラム / 操作', '設定値 / 反映内容', '備考')
            Rows = @(
              @('`users`', '`deleted_at` / `is_active`', '現在日時 / `false` へ更新する', 'ユーザー本体は論理削除する'),
              @('`users`', '`updated_at`', '更新時点の日時へ更新する', '削除後の集約更新トークンも再採番する'),
              @('`users`', '`name` / `email_address` / `establishment_id` / `facility_id` / `account_type` / `department_name` / `section_name` / `position_name` / `contact_person_name` / `phone_number` / `password_hash` / `locked_at` / `lock_reason` / `last_login_at` / `created_at`', '変更しない', '監査・参照履歴のためユーザー本体行は残す'),
              @('`user_facility_column_settings`', '対象ユーザーに紐づく全行', '物理削除する', '対象 `user_facility_assignment_id` 配下の全設定を削除する'),
              @('`user_facility_feature_settings`', '対象ユーザーに紐づく全行', '物理削除する', '対象 `user_facility_assignment_id` 配下の全設定を削除する'),
              @('`user_facility_assignments`', '対象ユーザーに紐づく全行', '物理削除する', '作業対象施設割当を削除する')
            )
          }
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @(
          'Body は返却しない。'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `user_edit` なし', 'ErrorResponse'),
          @('404', '対象ユーザーが存在しない、または作業対象施設の管理対象外', 'ErrorResponse'),
      @('409', '更新競合、自身削除禁止、または最後のユーザー管理者削除禁止', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '施設グループ画面コンテキスト取得（/facility-group-management/context）'
        Overview = '施設グループ管理画面の初期表示に必要な施設候補と操作制約を取得する。'
        Method = 'GET'
        Path = '/facility-group-management/context'
        Auth = '要（Bearer）'
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `facility_group_list` が有効であること',
          'レスポンス内の更新可否は同一作業対象施設に対する `facility_group_edit` の実効有無から導出する'
        )
        ProcessingLines = @(
          '`facilities` から `deleted_at IS NULL` かつ `system_contract_status=''ACTIVE''` の施設を施設名昇順で取得し、施設グループ構成候補として返却する',
          '設立母体による候補制限は行わない',
          '共有データ種別 UI に対応する external 向け `feature_code` / `column_code` は現行カタログ未採用のため、本レスポンスでは返却しない',
          '新規作成可否と編集可否は `facility_group_edit` の実効有無から導出する'
        )
        ResponseTitle = 'レスポンス（200：FacilityGroupContextResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('facilityCandidateCount', 'int32', '✓', '施設グループ構成候補件数'),
          @('facilityCandidates', 'FacilityGroupFacilityCandidate[]', '✓', '施設グループ構成候補'),
          @('permissions', 'FacilityGroupPermissionContext', '✓', 'ログインユーザーの操作制約')
        )
        ResponseSubtables = @(
          @{
            Title = 'facilityCandidates要素（FacilityGroupFacilityCandidate）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '施設ID'),
              @('facilityCode', 'string', '✓', '施設コード'),
              @('facilityName', 'string', '✓', '施設名'),
              @('establishmentId', 'int64', '✓', '設立母体ID'),
              @('systemContractStatus', 'string', '✓', 'システム利用契約状態')
            )
          },
          @{
            Title = 'permissions要素（FacilityGroupPermissionContext）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('canViewGroupList', 'boolean', '✓', '一覧表示可否'),
              @('canCreateGroup', 'boolean', '✓', '新規作成可否'),
              @('canEditGroup', 'boolean', '✓', '編集・削除可否')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'FacilityGroupContextResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `facility_group_list` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '施設グループ一覧取得（/facility-group-management/groups）'
        Overview = '作業対象施設を所属施設に含む有効な施設グループ一覧をページング取得する。'
        Method = 'GET'
        Path = '/facility-group-management/groups'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('groupName', 'query', 'string', '-', 'グループ名の前方一致検索'),
          @('page', 'query', 'int32', '-', 'ページ番号。未指定時は `1`'),
          @('pageSize', 'query', 'int32', '-', 'ページサイズ。未指定時は `50`、上限は `200`')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `facility_group_list` が有効であること'
        )
        ProcessingLines = @(
          '`facility_collaboration_groups.is_active=true` かつ `facility_collaboration_group_facilities` に `actingFacilityId` を含むグループだけを対象にする',
          '`groupName` 指定時はグループ名で前方一致検索する',
          '一覧は `updated_at DESC, facility_collaboration_group_id ASC` で返却する',
          '各グループについて所属施設件数を集計して返却する'
        )
        ResponseTitle = 'レスポンス（200：FacilityGroupListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('page', 'int32', '✓', '現在ページ'),
          @('pageSize', 'int32', '✓', 'ページサイズ'),
          @('totalCount', 'int32', '✓', '総件数'),
          @('groups', 'FacilityGroupSummary[]', '✓', '施設グループ一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'groups要素（FacilityGroupSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('groupId', 'int64', '✓', '施設協業グループID'),
              @('groupName', 'string', '✓', 'グループ名'),
              @('facilityCount', 'int32', '✓', '所属施設数'),
              @('updatedAt', 'string(datetime)', '✓', '最終更新日時')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'FacilityGroupListResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `facility_group_list` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '施設グループ詳細取得（/facility-group-management/groups/{groupId}）'
        Overview = '指定した施設グループの名称と所属施設を取得する。'
        Method = 'GET'
        Path = '/facility-group-management/groups/{groupId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('groupId', 'path', 'int64', '✓', '施設協業グループID')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `facility_group_list` が有効であること'
        )
        ProcessingLines = @(
          '対象 `facility_collaboration_groups` が `is_active=true` で存在することを確認する',
          '対象グループが `facility_collaboration_group_facilities` 上で `actingFacilityId` を含むことを確認し、含まない場合は 404 (`FACILITY_GROUP_NOT_FOUND`) を返却する',
          '所属施設は `facilities.deleted_at IS NULL` の施設だけを名称昇順で返却する',
          '共有データ種別 UI は予約仕様のため、本 API では返却しない'
        )
        ResponseTitle = 'レスポンス（200：FacilityGroupDetailResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('groupId', 'int64', '✓', '施設協業グループID'),
          @('groupName', 'string', '✓', 'グループ名'),
          @('memberFacilities', 'FacilityGroupFacilityCandidate[]', '✓', '所属施設一覧'),
          @('updatedAt', 'string(datetime)', '✓', '最終更新日時')
        )
        ResponseSubtables = @(
          @{
            Title = 'memberFacilities要素（FacilityGroupFacilityCandidate）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '施設ID'),
              @('facilityCode', 'string', '✓', '施設コード'),
              @('facilityName', 'string', '✓', '施設名'),
              @('establishmentId', 'int64', '✓', '設立母体ID'),
              @('systemContractStatus', 'string', '✓', 'システム利用契約状態')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'FacilityGroupDetailResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `facility_group_list` なし', 'ErrorResponse'),
          @('404', '対象施設グループが存在しない、または作業対象施設の管理対象外', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '施設グループ新規作成（/facility-group-management/groups）'
        Overview = '施設グループを新規作成する。作成時点では作業対象施設を初期所属施設として登録する。'
        Method = 'POST'
        Path = '/facility-group-management/groups'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエスト（JSON）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('groupName', 'string', '✓', 'グループ名')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `facility_group_edit` が有効であること'
        )
        ProcessingLines = @(
          '`groupName` の必須・桁数を検証する',
          '`facility_collaboration_groups` へ `is_active=true` で新規行を作成する',
          '`facility_collaboration_group_facilities` へ `actingFacilityId` を初期所属施設として 1 行作成する',
          '共有データ種別 UI に対応する設定値は本 API では初期化対象に含めない'
        )
        ResponseTitle = 'レスポンス（201：FacilityGroupDetailResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('groupId', 'int64', '✓', '施設協業グループID'),
          @('groupName', 'string', '✓', 'グループ名'),
          @('memberFacilities', 'FacilityGroupFacilityCandidate[]', '✓', '所属施設一覧'),
          @('updatedAt', 'string(datetime)', '✓', '最終更新日時')
        )
        StatusRows = @(
          @('201', '作成成功', 'FacilityGroupDetailResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `facility_group_edit` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '施設グループ更新（/facility-group-management/groups/{groupId}）'
        Overview = '施設グループ名と所属施設を更新する。更新後の所属施設には作業対象施設を必ず含める。'
        Method = 'PUT'
        Path = '/facility-group-management/groups/{groupId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('groupId', 'path', 'int64', '✓', '施設協業グループID')
        )
        RequestTitle = 'リクエスト（JSON）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('groupName', 'string', '✓', 'グループ名'),
          @('facilityIds', 'int64[]', '✓', '更新後の所属施設ID一覧。`actingFacilityId` を必ず含める'),
          @('lastKnownUpdatedAt', 'string(datetime)', '✓', '取得時点の `updatedAt`。競合検知に用いる')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `facility_group_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `facility_collaboration_groups` が `is_active=true` で存在し、かつ `actingFacilityId` を所属施設に含むことを確認する',
          '`lastKnownUpdatedAt` と `facility_collaboration_groups.updated_at` を比較し、不一致時は 409 (`FACILITY_GROUP_CONFLICT`) を返却する',
          '`facilityIds` が空でないこと、重複しないこと、`actingFacilityId` を含むことを検証する',
          '指定施設がすべて `facilities.deleted_at IS NULL` かつ `system_contract_status=''ACTIVE''` であることを検証する',
          '`facility_collaboration_group_facilities` を更新後の所属施設一覧で総入れ替えし、`facility_collaboration_groups.group_name` と `updated_at` を更新する',
          '共有データ種別 UI に対応する設定値は本 API の対象外とし、external 専用コード追加時に別 API で拡張する'
        )
        ResponseTitle = 'レスポンス（200：FacilityGroupDetailResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('groupId', 'int64', '✓', '施設協業グループID'),
          @('groupName', 'string', '✓', 'グループ名'),
          @('memberFacilities', 'FacilityGroupFacilityCandidate[]', '✓', '所属施設一覧'),
          @('updatedAt', 'string(datetime)', '✓', '最終更新日時')
        )
        StatusRows = @(
          @('200', '更新成功', 'FacilityGroupDetailResponse'),
          @('400', '入力不正、作業対象施設未所属、施設重複、契約無効施設指定', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `facility_group_edit` なし', 'ErrorResponse'),
          @('404', '対象施設グループが存在しない、または作業対象施設の管理対象外。指定施設が存在しない、または削除済みである場合も含む', 'ErrorResponse'),
          @('409', '更新競合', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '施設グループ削除（/facility-group-management/groups/{groupId}）'
        Overview = '指定した施設グループを無効化する。'
        Method = 'DELETE'
        Path = '/facility-group-management/groups/{groupId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('groupId', 'path', 'int64', '✓', '施設協業グループID'),
          @('lastKnownUpdatedAt', 'query', 'string(datetime)', '✓', '取得時点の `updatedAt`。競合検知に用いる')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `facility_group_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `facility_collaboration_groups` が `is_active=true` で存在し、かつ `actingFacilityId` を所属施設に含むことを確認する',
          '`lastKnownUpdatedAt` と `facility_collaboration_groups.updated_at` を比較し、不一致時は 409 (`FACILITY_GROUP_CONFLICT`) を返却する',
          '`facility_collaboration_groups.is_active=false` とし、`updated_at` を現在日時へ更新する',
          '対象グループの `facility_collaboration_group_facilities` を削除する',
          '削除処理は 1 トランザクションで実行する'
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @(
          'Body は返却しない。'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `facility_group_edit` なし', 'ErrorResponse'),
          @('404', '対象施設グループが存在しない、または作業対象施設の管理対象外', 'ErrorResponse'),
          @('409', '更新競合', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '必要権限' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定基準', '説明'); Rows = @(
      @('画面コンテキスト取得 / 一覧取得', '`user_list_view`', 'Bearer トークン上の作業対象施設に対して実効 `user_list_view` を持つこと', '一覧参照系'),
      @('ユーザー基本情報取得 / ユーザー基本情報更新 / 初回設定案内送信 / 削除', '`user_edit`', 'Bearer トークン上の作業対象施設に対して実効 `user_edit` を持つこと', 'PII を含む基本情報参照と基本情報変更系'),
      @('担当施設詳細取得 / 施設候補取得 / 担当施設更新', '`user_facility_assignment_edit`', 'Bearer トークン上の作業対象施設に対して実効 `user_facility_assignment_edit` を持つこと', '担当施設変更系'),
      @('ユーザー新規作成', '`user_edit` と `user_facility_assignment_edit`', '同一作業対象施設に対して両 feature_code を持つこと', '新規作成は基本情報と担当施設設定を同時に扱う'),
      @('施設グループ画面コンテキスト取得 / 一覧取得 / 詳細取得', '`facility_group_list`', 'Bearer トークン上の作業対象施設に対して実効 `facility_group_list` を持つこと', '施設グループ参照系'),
      @('施設グループ新規作成 / 更新 / 削除', '`facility_group_edit`', 'Bearer トークン上の作業対象施設に対して実効 `facility_group_edit` を持つこと', '施設グループ変更系')
    ) },
    @{ Type = 'Heading2'; Text = '一意性・整合性ルール' },
    @{ Type = 'Bullets'; Items = @(
      '管理対象ユーザーは作業対象施設に有効な担当施設割当を持つユーザーに限る',
      '`users.email_address` は未削除ユーザー間で一意に保つ',
      '`user_facility_assignments` は `(user_id, facility_id)` を一意に保つ',
      '担当施設候補は、実行ユーザーが直接割当を持ち、作業対象施設と同一 `establishment_id` に属し、かつ当該施設で実効 `user_facility_assignment_edit` を持つ未削除施設に限る',
      '`facility_collaboration_groups` / `facility_external_*` による他施設閲覧候補は担当施設候補へ含めない',
      '新規作成および担当施設更新では、更新後の担当施設に作業対象施設を必ず含める',
      '既定施設は担当施設に必ず含め、`users.facility_id` と `is_default=true` の担当施設を一致させる',
      '公開 API では `assignmentType` を受け取らず、既定施設を `PRIMARY`、それ以外を `SECONDARY` として内部導出する',
      '担当施設ごとの機能設定は施設提供機能の有効範囲内だけ登録できる',
      '担当施設ごとのカラム設定は施設提供カラムの有効範囲内、かつ対応機能がユーザー側でも有効な場合だけ登録できる',
      '担当施設更新成功時は `users.updated_at` も更新し、プロフィール更新との競合検知に使う',
      '施設グループは `facility_collaboration_groups.is_active=true` の行のみ管理対象とする',
      '`facility_collaboration_group_facilities` は `(facility_collaboration_group_id, facility_id)` を一意に保つ',
      '施設グループ更新では、更新後の所属施設に `actingFacilityId` を必ず含める',
      '施設グループ所属施設は `facilities.deleted_at IS NULL` かつ `system_contract_status=''ACTIVE''` の施設だけを受け付ける'
    ) },
    @{ Type = 'Heading2'; Text = '削除・招待ルール' },
    @{ Type = 'Bullets'; Items = @(
      '実行ユーザー自身の削除は認めない',
      '削除または担当施設/管理系 feature 更新により、いずれかの担当施設でフル権限ユーザー管理者数を 1 件から 0 件にしてはならない',
      '初回設定案内送信は `last_login_at IS NULL` の未利用ユーザーだけを対象とする',
      '既利用ユーザーのパスワード再設定は `/auth/password/forgot` の責務とし、本 API では扱わない',
      '施設グループ削除は物理削除ではなく `facility_collaboration_groups.is_active=false` による無効化で扱う'
    ) },
    @{ Type = 'Heading2'; Text = '実装前提・設計判断' },
    @{ Type = 'Bullets'; Items = @(
      '一覧 API は要約情報のみ返し、詳細情報は `GET /user-management/users/{userId}` と `GET /user-management/users/{userId}/facility-assignments` に分離する',
      '基本情報更新と担当施設更新は API を分離し、`user_edit` と `user_facility_assignment_edit` の境界に一致させる',
      '管理対象スコープは作業対象施設への有効割当で定義し、新規作成/担当施設更新でもこのスコープを維持する',
      '担当施設候補 API は、管理可能な直接担当施設だけを返し、協業グループ経由の他施設閲覧候補は返さない',
      '新規作成は利用可能な担当施設が存在しないと意味を持たないため、作成時だけは両権限を必須とする',
      '施設グループ API は作業対象施設を所属施設に含むグループだけを管理対象とし、設立母体を横断した施設構成を許可する',
      '共有データ種別 UI に対応する他施設公開データ・カラム設定は、external 専用 `feature_code` / `column_code` 採用後の別追補とし、本 API では施設グループ構成だけを扱う',
      '平文パスワードやトークン文字列はユーザー管理 API の入出力へ含めず、認証基盤へ委譲する',
      '競合検知は `users.updated_at` を集約更新トークンとして扱う方式を採用し、HTTP 条件付き更新ヘッダーは採用しない'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '説明'); Rows = @(
      @('VALIDATION_ERROR', '400', '必須不足、形式不正、作業対象施設未割当、担当施設重複、同一設立母体違反などの入力不正'),
      @('DEFAULT_FACILITY_NOT_ASSIGNED', '400', '既定施設が担当施設に含まれていない'),
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
      @('AUTH_403_USER_LIST_VIEW_DENIED', '403', '作業対象施設に対する実効 `user_list_view` がない'),
      @('AUTH_403_USER_EDIT_DENIED', '403', '作業対象施設に対する実効 `user_edit` がない'),
      @('AUTH_403_USER_FACILITY_ASSIGNMENT_EDIT_DENIED', '403', '作業対象施設に対する実効 `user_facility_assignment_edit` がない'),
      @('AUTH_403_FACILITY_GROUP_LIST_DENIED', '403', '作業対象施設に対する実効 `facility_group_list` がない'),
      @('AUTH_403_FACILITY_GROUP_EDIT_DENIED', '403', '作業対象施設に対する実効 `facility_group_edit` がない'),
      @('USER_NOT_FOUND', '404', '対象ユーザーが存在しない、または作業対象施設の管理対象外である'),
      @('FACILITY_GROUP_NOT_FOUND', '404', '対象施設グループが存在しない、または作業対象施設の管理対象外である'),
      @('FACILITY_NOT_FOUND', '404', '指定施設が存在しない、論理削除済みである、または実行ユーザーの管理可能な担当施設候補外である'),
      @('FEATURE_OR_COLUMN_NOT_FOUND', '404', '指定した機能コードまたはカラムコードが存在しない'),
      @('USER_EMAIL_DUPLICATE', '409', 'メールアドレスが重複している'),
      @('USER_CONFLICT', '409', '他ユーザー更新により `lastKnownUpdatedAt` が不一致である'),
      @('FACILITY_GROUP_CONFLICT', '409', '他ユーザー更新により `lastKnownUpdatedAt` が不一致である'),
      @('FACILITY_PERMISSION_SCOPE_CONFLICT', '409', '施設提供設定または親子機能条件と矛盾する機能・カラム指定である'),
      @('USER_SELF_DELETE_FORBIDDEN', '409', '実行ユーザー自身は削除できない'),
      @('LAST_USER_ADMIN_FORBIDDEN', '409', 'いずれかの担当施設で最後のフル権限ユーザー管理者を失わせる更新/削除はできない'),
      @('USER_ALREADY_ACTIVATED', '409', '対象ユーザーはすでに初回利用済みである'),
      @('INVITATION_DISPATCH_FAILED', '500', '初回設定案内の送信依頼に失敗した'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = 'ユーザーマスタ保守方針' },
    @{ Type = 'Bullets'; Items = @(
      'ユーザー削除は `users` の論理削除で管理し、監査上必要な基本情報は保持する',
      '担当施設および施設別権限設定は削除ユーザーへ不要となるため、削除時に関連テーブルから除去する',
      '施設が論理削除されても既存設定行は残り得るが、候補表示や認可判定では `facilities.deleted_at IS NULL` を前提に扱う',
      '設定系テーブルの `created_by` / `updated_by` は問い合わせ調査の根拠になるため必ず保存する'
    ) },
    @{ Type = 'Heading2'; Text = '施設グループ保守方針' },
    @{ Type = 'Bullets'; Items = @(
      '施設グループ削除は `facility_collaboration_groups.is_active=false` で管理し、グループ本体行は監査のため保持する',
      '所属施設構成は `facility_collaboration_group_facilities` を現在値として保守し、無効化時は関連所属行を除去する',
      '契約無効化または論理削除された施設は、新規のグループ構成候補へ含めない'
    ) },
    @{ Type = 'Heading2'; Text = '今後拡張時の留意点' },
    @{ Type = 'Bullets'; Items = @(
      '一覧件数増加時はページング上限、全文検索、非同期エクスポートを検討する',
      '基本情報タブと担当施設タブを同一モーダルに残す場合でも、バックエンド契約は分離したまま維持する',
      '初回設定案内の再送履歴や配信状態を可視化する場合は、認証基盤または通知基盤側に監査テーブルを追加する',
      '共有データ種別 UI を API 化する場合は、external 専用 `feature_code` / `column_code` カタログを別追補で確定し、`facility_external_view_settings` / `facility_external_column_settings` を連動させる',
      '施設グループ単位で公開可否を変える要件が出た場合は、`facility_external_view_settings` / `facility_external_column_settings` へ `facility_collaboration_group_id` を追加する'
    ) }
  )
}
