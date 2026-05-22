$lendingManagementPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`accountType=''SYSTEM_ADMIN''`）の場合は未削除の全施設・全機能を利用可能として扱い、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `lending_management` が有効であること'
)

$deviceStatusRows = @(
  @('貸出可', '貸出実行可能。貸出可能台数の集計対象'),
  @('貸出中', '貸出済み。未返却の `lending_transactions` が存在する'),
  @('使用中', '使用開始済み。未返却の `lending_transactions` が存在する'),
  @('使用済', '使用終了済み。返却待ち。未返却の `lending_transactions` が存在する'),
  @('返却済', '使用後日常点検メニューがある場合の点検待ち。貸出管理タブでは解除不可'),
  @('使用不可', '点検異常等により貸出不可。貸出管理タブの手動操作では貸出可へ戻さない')
)

$deviceSummaryRows = @(
  @('lendingDeviceId', 'int64', '✓', '`lending_devices.lending_device_id`。貸出管理APIの正本ID'),
  @('assetLedgerId', 'int64', '✓', '`asset_ledgers.asset_ledger_id`'),
  @('qrCodeValue', 'string', '-', '代表QR識別子。未発行または削除済みのみの場合は `null`'),
  @('itemName', 'string', '✓', '`asset_ledgers.asset_item_name`'),
  @('makerName', 'string', '-', '`asset_ledgers.manufacturer_name`'),
  @('modelName', 'string', '-', '`asset_ledgers.model_name`'),
  @('managementNo', 'string', '-', '`asset_ledgers.management_no`。画面のME管理No表示値'),
  @('lendingGroupName', 'string', '✓', '`lending_devices.lending_group_name`'),
  @('lendingTypeName', 'string', '-', '`lending_devices.lending_type_name`'),
  @('currentStatus', 'string', '✓', '`lending_devices.status`'),
  @('placementDepartmentName', 'string', '-', '設置部署表示。`lending_devices.fixed_placement_department` があれば優先し、なければ `asset_ledgers.facility_location_id` に紐づく `facility_locations.department_name / section_name` を返す'),
  @('lentOn', 'date', '-', '未返却の最新 `lending_transactions.lent_on`'),
  @('dueOn', 'date', '-', '未返却の最新 `lending_transactions.due_on`'),
  @('overdueDays', 'int32', '✓', '`dueOn` から算出した超過日数。未返却履歴または返却予定日がない場合は 0'),
  @('returnAlertDays', 'int32', '✓', '`lending_devices.return_alert_days`'),
  @('returnAlertStatus', 'string', '✓', '`NONE` / `DUE_SOON` / `OVERDUE`'),
  @('dailyInspectionMenuName', 'string', '-', '有効な日常点検設定のメニュー名。使用前/使用中/使用後を画面表示用に連結する'),
  @('lastDailyInspectionOn', 'date', '-', '対象資産の日常点検最終実施日。該当履歴がない場合は `null`'),
  @('nextPeriodicInspectionOn', 'date', '-', '対象資産の定期点検予定日。該当設定がない場合は `null`'),
  @('lendingCount', 'int32', '✓', '当該 `lending_device_id` の貸出履歴累計件数'),
  @('freeComment', 'string', '-', '`lending_devices.free_comment`'),
  @('lockVersion', 'int64', '✓', '`lending_devices.lock_version`'),
  @('canEditSettings', 'boolean', '✓', '実効権限と有効行であることから算出する設定保存可否'),
  @('canRelease', 'boolean', '✓', '現在状態と未返却履歴の有無から算出する貸出機解除可否')
)

$errorRows = @(
  @('AUTH_401_UNAUTHORIZED', '401', '認証情報が存在しない、または無効', 'Bearer トークン未指定、期限切れ、署名不正'),
  @('AUTH_403_LENDING_MANAGEMENT_DENIED', '403', '作業対象施設に対する実効 `lending_management` がない', '通常アカウントで施設提供設定またはユーザー施設別設定の `lending_management` が無効'),
  @('LENDING_ASSET_NOT_FOUND', '404', '指定資産を作業対象施設内で参照できない', '資産ID不存在、施設不一致、削除済み、または閲覧対象外'),
  @('LENDING_DEVICE_NOT_FOUND', '404', '有効な貸出管理対象機器を参照できない', '`lendingDeviceId` 不存在、施設不一致、または解除済み'),
  @('LENDING_DEVICE_ALREADY_ACTIVE', '409', '同一資産の有効な貸出管理対象機器が既に存在する', '一括登録対象のいずれかに `lending_devices.is_active=true` の行が存在する'),
  @('LENDING_DEVICE_STATUS_CONFLICT', '409', '`expectedStatus` または `expectedLockVersion` がサーバー最新状態と一致しない', '一覧取得後に貸出・返却APIまたは別ユーザーの設定更新で状態が変わった'),
  @('LENDING_DEVICE_RELEASE_BLOCKED', '409', '貸出機解除できない状態である', '貸出中/使用中/使用済/返却済、または未返却の `lending_transactions` が存在する'),
  @('LENDING_CONCURRENCY_TOKEN_REQUIRED', '400', '競合検知用の期待値が未指定', '`expectedStatus` と `expectedLockVersion` の両方が未指定'),
  @('LENDING_GROUP_NAME_REQUIRED', '400', '貸出グループ名が未入力', '既存候補未選択かつ新規グループ名が空'),
  @('LENDING_ALERT_DAYS_INVALID', '400', '返却アラート発生日数が範囲外', '`returnAlertDays` が 1〜365 の範囲外'),
  @('VALIDATION_ERROR', '400', '入力値が不正', 'ページ指定、列挙値、文字数、配列件数などの入力検証エラー'),
  @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー', '想定外例外')
)

@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_貸出管理.docx'
  ScreenLabel = '貸出管理'
  CoverDateText = '2026年5月22日'
  RevisionDateText = '2026/5/22'
  RevisionAuthorText = 'RyokuTaniguchi'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、資産一覧画面（`/asset-search-result`）の貸出機器登録モーダル、およびタスク管理の貸出管理タブ（`/quotation-data-box/lending-management`）で利用する API の設計内容を整理する。' },
    @{ Type = 'Paragraph'; Text = '貸出管理対象機器の登録、一覧表示、貸出設定変更、貸出機解除、日常点検日・定期点検予定・貸出回数累計・返却超過状態の参照表示について、画面要件、DB設計、No.7 貸出・返却APIとの責務境界を一致させる。' },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '貸出管理は、資産一覧で選択した資産を貸出管理対象として `lending_devices` に登録し、貸出グループ名、貸出種別名、返却アラート発生日数、フリーコメントを管理する機能である。登録された機器は、メニュー画面の貸出・返却ボタンから利用する No.7 貸出・返却APIで貸出可能機器として参照される。' },
    @{ Type = 'Paragraph'; Text = '貸出・返却画面で行う貸出、返却、使用開始、使用終了の状態更新は No.7 貸出・返却APIの責務とし、本書ではステータスを直接変更するAPIを定義しない。貸出管理タブの現在ステータスは表示専用である。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('貸出管理対象機器', '`lending_devices.is_active=true` の行。貸出管理APIおよび貸出・返却APIの対象となる'),
      @('貸出機器登録モーダル', '資産一覧で資産選択後に貸出登録ボタンから表示するモーダル。貸出グループ名とアラート発生までの期間を入力して一括登録する'),
      @('貸出管理タブ', '`/quotation-data-box/lending-management`。登録済み貸出管理対象機器の一覧、設定変更、解除を行うタブ'),
      @('貸出機解除', '`lending_devices` を物理削除せず、`is_active=false` と `released_at` を設定して通常一覧から除外する操作'),
      @('返却超過', '未返却の最新 `lending_transactions.due_on` が業務日より前である状態。保存値ではなく一覧表示時に算出する')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面パス', '利用目的'); Rows = @(
      @('資産一覧画面 貸出機器登録モーダル', '/asset-search-result', '選択資産を貸出管理対象機器として一括登録する'),
      @('貸出管理タブ', '/quotation-data-box/lending-management', '貸出管理対象機器の一覧、絞り込み、貸出設定変更、貸出機解除を行う')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'API の位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、`lending_devices` の有効行を正本として貸出管理対象機器を管理する。登録後の貸出・返却操作は No.7 貸出・返却APIが同じ `lending_device_id` を正本IDとして参照・更新する。' },
    @{ Type = 'Heading2'; Text = '画面と API の関係' },
    @{ Type = 'Table'; Headers = @('画面操作', 'API', '補足'); Rows = @(
      @('貸出機器登録モーダル表示', '`GET /quotation-data-box/lending-management/context`', '貸出グループ候補、ステータス候補、権限、選択資産の登録可否を取得する'),
      @('貸出機器として登録', '`POST /quotation-data-box/lending-management/devices`', '選択資産を `lending_devices` へ一括登録する。部分登録は行わない'),
      @('貸出管理タブ初期表示/絞り込み', '`GET /quotation-data-box/lending-management/devices`', '有効な貸出管理対象機器の一覧、点検・貸出履歴の参照情報を取得する'),
      @('貸出設定変更モーダル保存', '`PATCH /quotation-data-box/lending-management/devices/{lendingDeviceId}`', '貸出種別名、貸出グループ名、返却アラート発生日数、フリーコメントを更新する'),
      @('貸出機解除', '`DELETE /quotation-data-box/lending-management/devices/{lendingDeviceId}`', '解除可能な状態で `is_active=false`、`released_at` を保存する')
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル名', '利用種別', '用途'); Rows = @(
      @('`asset_ledgers`', 'READ', '登録対象資産の施設スコープ、品目、メーカー、型式、管理番号、施設ロケーションIDを取得する'),
      @('`facility_locations`', 'READ', '登録対象資産の設置部門/設置部署表示を取得する'),
      @('`qr_codes`', 'READ', '一覧および登録確認用の代表QR識別子を取得する'),
      @('`lending_devices`', 'CREATE / READ / UPDATE', '貸出管理対象機器、貸出グループ名、貸出種別名、返却アラート、解除状態、排他制御版を管理する'),
      @('`lending_transactions`', 'READ', '未返却履歴、貸出日、返却予定日、貸出回数累計、解除可否を参照する'),
      @('`lending_device_status_definitions`', 'READ', '貸出機器ステータス候補と表示順を取得する'),
      @('`inspection_tasks`', 'READ', '日常点検設定行、定期点検予定、対象点検メニューIDを参照する'),
      @('`inspection_menus`', 'READ', '`inspection_tasks` のメニューIDから日常点検メニュー名、定期点検メニュー名を取得する'),
      @('`inspection_results`', 'READ', '日常点検最終実施日を参照する'),
      @('`user_search_conditions`', 'READ / UPDATE', '一覧条件保存を行う場合に利用する任意機能'),
      @('`feature_catalogs`', 'READ', '`lending_management` の機能コード定義と `config_scope` を確認する'),
      @('`facility_feature_settings` / `user_facility_feature_settings`', 'READ', '`lending_management` の実効権限判定'),
      @('`user_facility_assignments`', 'READ', 'ログインユーザーの作業対象施設割当確認')
    ) },
    @{ Type = 'Heading2'; Text = '責務境界' },
    @{ Type = 'Bullets'; Items = @(
      '本書は、貸出管理対象機器の登録、一覧、設定変更、解除を扱う',
      'No.7 貸出・返却は、貸出可能機器閲覧、QR/バーコード起点の機器解決、貸出、返却、使用開始、使用終了を扱う',
      '貸出管理タブでは `lending_devices.status` を表示専用とし、手動で `貸出可` / `使用不可` などへ変更しない',
      '使用後日常点検の結果登録、および `返却済` から `貸出可` / `使用不可` への更新は日常点検API側の責務とする',
      '`asset_ledgers.is_rented_out` は貸出状態の正本ではなく、No.7 貸出・返却APIが貸出状態更新時に同期する検索・一覧表示用の派生フラグとする'
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API 共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON',
      '文字コード: UTF-8',
      '日時形式: ISO 8601。日付のみの項目は `YYYY-MM-DD` とする',
      '認証済み API は Bearer トークンを `Authorization` ヘッダーに付与する',
      '各 API は Bearer トークン上の作業対象施設を基準に自施設データのみ処理する',
      '更新系 API は `expectedStatus` または `expectedLockVersion` の少なくとも一方を必須とし、サーバー最新状態と一致しない場合は更新せず 409 を返す'
    ) },
    @{ Type = 'Heading2'; Text = '認証・認可' },
    @{ Type = 'Paragraph'; Text = '本API群で使用する `feature_code` は `lending_management` とする。Bearer トークン上の作業対象施設について担当施設割当があり、施設提供設定とユーザー施設別設定の両方で `lending_management` が有効な場合に実行を許可する。' },
    @{ Type = 'Bullets'; Items = @(
      '共有システム管理者アカウント（`accountType=''SYSTEM_ADMIN''`）は、未削除の全施設・全機能を利用可能として扱う',
      '通常アカウントでは、`user_facility_assignments`、`facility_feature_settings`、`user_facility_feature_settings` の実効判定を各業務APIで再判定する',
      '資産一覧の貸出登録ボタン表示も `lending_management` の実効権限で判定する'
    ) },
    @{ Type = 'Heading2'; Text = '施設スコープ' },
    @{ Type = 'Bullets'; Items = @(
      '登録対象資産は `asset_ledgers.facility_id` が作業対象施設と一致することを必須とする',
      '貸出管理一覧は `lending_devices.asset_ledger_id` から参照する `asset_ledgers.facility_id` が作業対象施設と一致する行だけを返す',
      '他施設の `lendingDeviceId` または `assetLedgerId` が指定された場合は 404 とし、存在有無を外部に返さない',
      '協業グループや他施設公開設定による他施設閲覧は貸出管理の登録・更新・解除対象に含めない'
    ) },
    @{ Type = 'Heading2'; Text = '貸出機器ステータス' },
    @{ Type = 'Table'; Headers = @('ステータス', '意味'); Rows = $deviceStatusRows },
    @{ Type = 'Heading2'; Text = 'データライフサイクル' },
    @{ Type = 'Table'; Headers = @('状態', '作成/更新契機', '主な保存値', '次の遷移'); Rows = @(
      @('未登録', '資産一覧に存在するが `lending_devices.is_active=true` がない', '保存なし', '貸出機器登録で `貸出可` の有効行を作成'),
      @('有効・貸出可', '貸出機器登録直後、または返却/日常点検合格後', '`status=''貸出可''`, `is_active=true`, `lock_version`', 'No.7 貸出・返却APIで貸出中へ遷移、または貸出機解除'),
      @('有効・未返却中', 'No.7 貸出・返却APIで貸出/使用開始/使用終了', '`status` が `貸出中` / `使用中` / `使用済`、未返却履歴あり', 'No.7 貸出・返却APIで返却。貸出管理APIでは解除不可'),
      @('有効・使用後日常点検待ち', '使用後日常点検メニューありで返却', '`status=''返却済''`, 返却済み履歴あり', '日常点検APIで `貸出可` または `使用不可` へ更新。貸出管理APIでは解除不可'),
      @('有効・使用不可', '日常点検結果で異常あり', '`status=''使用不可''`, `is_active=true`', '日常点検合格で `貸出可` へ復帰、または貸出機解除'),
      @('解除済み', '貸出機解除', '`is_active=false`, `released_at` 設定', '通常一覧から除外。同一資産の再登録時は新しい有効行を作成')
    ) },
    @{ Type = 'Heading2'; Text = '登録・更新・解除ルール' },
    @{ Type = 'Bullets'; Items = @(
      '同一 `asset_ledger_id` に対する `lending_devices.is_active=true` の行は1件のみ許可する',
      '過去に解除済みの `lending_devices` は履歴として保持し、同一資産を再登録する場合は新しい有効行を作成する',
      '貸出機器登録直後の `status` は `貸出可` とし、`待機中` は使用しない',
      '貸出グループ名は独立マスタではなく、`lending_devices.is_active=true` の `lending_group_name` 重複排除値を既存候補として扱う',
      '貸出機器登録は全件成功または全件失敗とし、一括登録対象の一部だけを登録しない',
      '貸出機器登録時の `return_period_days`、`last_lent_on`、`last_returned_on` は `null` とし、返却予定日は No.7 貸出・返却APIで貸出時に `lending_transactions.due_on` として確定する',
      '現行の貸出管理画面では `return_period_days` の入力欄を持たないため、本API群では `return_period_days` を登録・更新しない。`return_period_days` が `null` の機器で返却予定日も未指定の場合、No.7 貸出・返却API側で返却予定日の入力を必須とする',
      '貸出設定変更で更新できるのは貸出種別名、貸出グループ名、返却アラート発生日数、フリーコメントであり、ステータスは更新対象に含めない',
      '貸出機解除は物理削除せず、`is_active=false` と `released_at` を保存する',
      '`貸出中`、`使用中`、`使用済`、`返却済`、または未返却の `lending_transactions` がある場合は貸出機解除を拒否する'
    ) },
    @{ Type = 'Heading2'; Text = '返却アラート・超過日数' },
    @{ Type = 'Bullets'; Items = @(
      '`lending_devices.return_period_days` は、貸出時に返却予定日が未指定の場合に `lending_transactions.due_on` を算出する既定日数である。ただし現行の貸出管理画面/APIでは設定変更対象に含めず、登録時も `null` とする',
      '`return_period_days` が `null` の機器で貸出時に返却予定日も未指定の場合、No.7 貸出・返却APIは `LENDING_DUE_ON_REQUIRED` を返す',
      '登録モーダルの「アラート発生までの期間」は `lending_devices.return_alert_days` に保存し、入力範囲は 1〜365 日とする',
      '`return_alert_days` は返却予定日の何日前から警告対象にするかの判定値であり、返却予定日そのものではない',
      '返却予定日は No.7 貸出・返却APIが貸出時に `lending_transactions.due_on` として保存する',
      '超過日数は未返却の最新 `lending_transactions.due_on` と業務日から `max(0, 業務日 - due_on)` で算出し、`lending_devices` へ保存しない',
      '`returnAlertStatus` は `due_on < 業務日` の場合 `OVERDUE`、`due_on - 業務日 <= return_alert_days` の場合 `DUE_SOON`、それ以外は `NONE` とする'
    ) },
    @{ Type = 'Heading2'; Text = '共通エラーレスポンス' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや競合理由の補足'),
      @('currentStatus', 'string', '-', '競合時のサーバー最新ステータス'),
      @('currentLockVersion', 'int64', '-', '競合時のサーバー最新 `lockVersion`')
    ) },
    @{ Type = 'Heading2'; Text = '共通DTO' },
    @{ Type = 'Heading3'; Text = 'LendingManagementDeviceSummary' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $deviceSummaryRows },

    @{ Type = 'Heading1'; Text = '第4章 API 一覧' },
    @{ Type = 'Table'; Headers = @('No', 'API名', 'Method', 'Path', '用途', '権限'); Rows = @(
      @('1', '貸出管理コンテキスト取得', 'GET', '/quotation-data-box/lending-management/context', '貸出グループ候補、ステータス候補、権限、登録可否を取得する', '`lending_management`'),
      @('2', '貸出管理対象機器一覧取得', 'GET', '/quotation-data-box/lending-management/devices', '貸出管理タブ一覧を取得する', '`lending_management`'),
      @('3', '貸出管理対象機器一括登録', 'POST', '/quotation-data-box/lending-management/devices', '資産一覧で選択した資産を貸出管理対象機器として登録する', '`lending_management`'),
      @('4', '貸出設定変更', 'PATCH', '/quotation-data-box/lending-management/devices/{lendingDeviceId}', '貸出種別名、貸出グループ名、返却アラート発生日数、フリーコメントを更新する', '`lending_management`'),
      @('5', '貸出機解除', 'DELETE', '/quotation-data-box/lending-management/devices/{lendingDeviceId}', '貸出管理対象機器を論理解除する', '`lending_management`')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 貸出管理機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '貸出管理コンテキスト取得（/quotation-data-box/lending-management/context）'
        Overview = '貸出管理タブおよび資産一覧の貸出機器登録モーダルで使用する候補値、権限、選択資産の登録可否を取得する。'
        Method = 'GET'
        Path = '/quotation-data-box/lending-management/context'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('assetLedgerIds', 'query', 'int64[]', '-', '貸出機器登録モーダル表示時の選択資産ID。未指定時は候補値のみ返す')
        )
        PermissionLines = $lendingManagementPermissionLines
        ProcessingLines = @(
          '`lending_devices.is_active=true` の `lending_group_name` を重複排除して既存グループ候補として返す',
          '`lending_device_status_definitions` を表示順で取得し、貸出管理タブのステータスフィルター候補として返す',
          '`assetLedgerIds` が指定された場合、各資産が作業対象施設内に存在することを確認する',
          '各資産について `lending_devices.is_active=true` の有無を確認し、重複登録可否を返す',
          '登録モーダルの返却アラート発生日数の初期値は 7、入力範囲は 1〜365 として返す'
        )
        ResponseTitle = 'レスポンス（200：LendingManagementContextResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('groupOptions', 'string[]', '✓', '既存貸出グループ名候補'),
          @('statusOptions', 'string[]', '✓', '貸出機器ステータス候補'),
          @('permissions.canRegister', 'boolean', '✓', '貸出機器登録可否'),
          @('permissions.canUpdate', 'boolean', '✓', '貸出設定変更可否'),
          @('permissions.canRelease', 'boolean', '✓', '貸出機解除可否'),
          @('defaultReturnAlertDays', 'int32', '✓', '返却アラート発生日数の初期値。7'),
          @('minReturnAlertDays', 'int32', '✓', '返却アラート発生日数の下限。1'),
          @('maxReturnAlertDays', 'int32', '✓', '返却アラート発生日数の上限。365'),
          @('registrationPreview', 'RegistrationPreviewItem[]', '-', '`assetLedgerIds` 指定時の登録可否一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'registrationPreview要素（RegistrationPreviewItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('assetLedgerId', 'int64', '✓', '資産台帳ID'),
              @('qrCodeValue', 'string', '-', '代表QR識別子'),
              @('itemName', 'string', '✓', '品目名'),
              @('makerName', 'string', '-', 'メーカー名'),
              @('modelName', 'string', '-', '型式'),
              @('placementDepartmentName', 'string', '-', '部署/設置部門表示'),
              @('canRegister', 'boolean', '✓', '有効な貸出管理対象がない場合 true'),
              @('blockingLendingDeviceId', 'int64', '-', '重複登録を妨げる既存貸出管理機器ID')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'LendingManagementContextResponse'),
          @('400', '資産ID配列または入力条件が不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `lending_management` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '貸出管理対象機器一覧取得（/quotation-data-box/lending-management/devices）'
        Overview = '貸出管理タブに表示する有効な貸出管理対象機器一覧を取得する。貸出日、返却予定日、超過日数、点検情報、貸出回数累計は関連テーブルから参照または算出する。'
        Method = 'GET'
        Path = '/quotation-data-box/lending-management/devices'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('lendingGroupName', 'query', 'string', '-', '貸出グループ名'),
          @('itemName', 'query', 'string', '-', '品目名の部分一致'),
          @('makerName', 'query', 'string', '-', 'メーカー名の部分一致'),
          @('modelName', 'query', 'string', '-', '型式の部分一致'),
          @('status', 'query', 'string', '-', '貸出機器ステータス'),
          @('placementDepartmentName', 'query', 'string', '-', '設置部署名の部分一致'),
          @('overdueOnly', 'query', 'boolean', '-', '返却超過機器のみ表示する場合 true'),
          @('page', 'query', 'int32', '-', 'ページ番号。未指定時 1'),
          @('pageSize', 'query', 'int32', '-', '1ページ件数。未指定時 50')
        )
        PermissionLines = $lendingManagementPermissionLines
        ProcessingLines = @(
          '`lending_devices.is_active=true` の行を対象とし、解除済み行は通常一覧から除外する',
          '`asset_ledgers.facility_id` が作業対象施設と一致する行だけを返す',
          '未返却の最新 `lending_transactions.returned_on IS NULL` から貸出日、返却予定日、超過日数、アラート状態を算出する',
          '貸出回数累計は対象 `lending_device_id` の `lending_transactions` 件数から算出する',
          '日常点検メニューと定期点検予定は `inspection_tasks.is_active=true` かつ `deleted_at IS NULL` の設定を参照し、メニュー名は `inspection_menus` から取得する',
          '日常点検日は、対象資産の日常点検設定行に紐づく `inspection_results.inspected_on` の最新日を参照表示する',
          '貸出機解除可否は現在ステータスと未返却履歴の有無から算出する',
          '既定並び順は貸出グループ名、品目名、メーカー名、型式、代表QRの昇順とする'
        )
        ResponseTitle = 'レスポンス（200：LendingManagementDeviceListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('items', 'LendingManagementDeviceSummary[]', '✓', '一覧行'),
          @('totalCount', 'int32', '✓', '総件数'),
          @('page', 'int32', '✓', 'ページ番号'),
          @('pageSize', 'int32', '✓', '1ページ件数'),
          @('generatedAt', 'datetime', '✓', 'レスポンス生成日時')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（LendingManagementDeviceSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $deviceSummaryRows
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'LendingManagementDeviceListResponse'),
          @('400', '検索条件またはページ指定が不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `lending_management` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '貸出管理対象機器一括登録（/quotation-data-box/lending-management/devices）'
        Overview = '資産一覧で選択した資産を貸出管理対象機器として一括登録する。初期ステータスは `貸出可` とし、同一資産の有効行がある場合は全体を登録しない。'
        Method = 'POST'
        Path = '/quotation-data-box/lending-management/devices'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('assetLedgerIds', 'int64[]', '✓', '登録対象資産台帳ID。1件以上'),
          @('lendingGroupName', 'string', '✓', '既存候補または新規入力の貸出グループ名。最大200文字'),
          @('returnAlertDays', 'int32', '✓', '返却アラート発生日数。1〜365')
        )
        PermissionLines = $lendingManagementPermissionLines
        ProcessingLines = @(
          'リクエスト全体を1トランザクションで処理する',
          '`assetLedgerIds` の重複を拒否する',
          'すべての対象資産が作業対象施設内に存在することを検証する',
          '貸出グループ名は空文字不可、最大200文字として検証する',
          '返却アラート発生日数は 1〜365 の範囲で検証する',
          'すべての対象資産について `lending_devices.is_active=true` の既存行がないことを検証する。1件でも重複があれば全件登録しない',
          '各資産について `lending_devices` を作成し、`status=''貸出可''`、`lending_group_name`、`return_alert_days`、`is_active=true`、`lock_version=1` を設定する',
          '`lending_type_name`、`return_period_days`、`free_comment`、`last_lent_on`、`last_returned_on` は初期登録モーダルに入力欄がないため `null` とする。`lending_type_name` と `free_comment` は後続の貸出設定変更で更新し、`last_lent_on` と `last_returned_on` は No.7 貸出・返却APIの貸出/返却処理で更新する。`return_period_days` は現行の貸出管理画面/APIでは更新しない',
          '設置部署表示用に、登録時点の `asset_ledgers.facility_location_id` から有効な `facility_locations` を参照し、`department_name / section_name` を連結した値を `fixed_placement_department` へ保存し、`fixed_placement_flag=true` とする。ロケーション未解決の場合は資産台帳の `management_department_name` を補助表示値として保存し、いずれもない場合は `fixed_placement_department=null` とする',
          '`asset_ledgers.is_rented_out` は貸出状態の派生フラグであり、登録直後の `貸出可` では更新しない',
          '登録完了後、作成した貸出管理対象機器を一覧行DTOとして返す'
        )
        ResponseTitle = 'レスポンス（201：LendingManagementRegisterResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('createdItems', 'LendingManagementDeviceSummary[]', '✓', '作成された貸出管理対象機器'),
          @('createdCount', 'int32', '✓', '作成件数'),
          @('completionMessage', 'string', '✓', '登録完了メッセージ')
        )
        ResponseSubtables = @(
          @{
            Title = 'createdItems要素（LendingManagementDeviceSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $deviceSummaryRows
          }
        )
        StatusRows = @(
          @('201', '登録成功', 'LendingManagementRegisterResponse'),
          @('400', '入力値不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `lending_management` なし', 'ErrorResponse'),
          @('404', '登録対象資産を参照できない', 'ErrorResponse'),
          @('409', '同一資産の有効な貸出管理対象機器が既に存在する', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '貸出設定変更（/quotation-data-box/lending-management/devices/{lendingDeviceId}）'
        Overview = '貸出管理対象機器の貸出種別名、貸出グループ名、返却アラート発生日数、フリーコメントを更新する。現在ステータスは表示専用で更新対象に含めない。'
        Method = 'PATCH'
        Path = '/quotation-data-box/lending-management/devices/{lendingDeviceId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'Path Parameter'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('lendingDeviceId', 'path', 'int64', '✓', '貸出管理機器ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('lendingTypeName', 'string', '-', '貸出種別名。最大200文字。未指定時は既存値維持、明示 null はクリア'),
          @('lendingGroupName', 'string', '-', '貸出グループ名。最大200文字。指定時は空文字不可'),
          @('returnAlertDays', 'int32', '-', '返却アラート発生日数。1〜365'),
          @('freeComment', 'string', '-', 'フリーコメント。最大1000文字。未指定時は既存値維持、明示 null はクリア'),
          @('expectedStatus', 'string', '条件必須', '画面取得時の現在ステータス。`expectedLockVersion` 未指定時は必須'),
          @('expectedLockVersion', 'int64', '条件必須', '画面取得時の `lockVersion`。`expectedStatus` 未指定時は必須')
        )
        PermissionLines = $lendingManagementPermissionLines
        ProcessingLines = @(
          '対象 `lending_devices` 行を `asset_ledgers` と結合し、作業対象施設に属する有効行であることを確認する',
          '`expectedStatus` と `expectedLockVersion` が両方未指定の場合は `LENDING_CONCURRENCY_TOKEN_REQUIRED` を返す',
          '`expectedStatus` または `expectedLockVersion` がサーバー最新値と一致することを確認する。両方指定された場合はいずれも一致を必須とする',
          '現在ステータスが変わっている場合は、ステータス表示と設定保存の不整合を避けるため 409 を返す',
          'ステータスはリクエストに含まれていても更新対象として扱わず、入力エラーにする',
          '貸出種別名、貸出グループ名、返却アラート発生日数、フリーコメントのいずれも指定されていない場合は入力エラーにする',
          '貸出グループ名と貸出種別名は最大200文字、フリーコメントは最大1000文字として検証する',
          '返却アラート発生日数は 1〜365 の範囲で検証する',
          '`return_period_days` は現行の貸出管理画面/APIで更新しない。リクエストに `returnPeriodDays` が含まれる場合は入力エラーにする',
          '貸出種別名、貸出グループ名、返却アラート発生日数、フリーコメントを更新し、`lock_version` を +1 する',
          '更新後の一覧行DTOを返す'
        )
        ResponseTitle = 'レスポンス（200：LendingManagementUpdateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'LendingManagementDeviceSummary', '✓', '更新後の貸出管理対象機器'),
          @('completionMessage', 'string', '✓', '設定保存完了メッセージ')
        )
        ResponseSubtables = @(
          @{
            Title = 'item（LendingManagementDeviceSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $deviceSummaryRows
          }
        )
        StatusRows = @(
          @('200', '更新成功', 'LendingManagementUpdateResponse'),
          @('400', '入力値不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `lending_management` なし', 'ErrorResponse'),
          @('404', '有効な貸出管理対象機器を参照できない', 'ErrorResponse'),
          @('409', 'ステータスまたは `lockVersion` 競合', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '貸出機解除（/quotation-data-box/lending-management/devices/{lendingDeviceId}）'
        Overview = '貸出管理対象機器を論理解除する。物理削除は行わず、解除済み行は通常一覧から除外する。'
        Method = 'DELETE'
        Path = '/quotation-data-box/lending-management/devices/{lendingDeviceId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'Path Parameter'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('lendingDeviceId', 'path', 'int64', '✓', '貸出管理機器ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('expectedStatus', 'string', '条件必須', '画面取得時の現在ステータス。`expectedLockVersion` 未指定時は必須'),
          @('expectedLockVersion', 'int64', '条件必須', '画面取得時の `lockVersion`。`expectedStatus` 未指定時は必須')
        )
        PermissionLines = $lendingManagementPermissionLines
        ProcessingLines = @(
          '対象 `lending_devices` 行を `asset_ledgers` と結合し、作業対象施設に属する有効行であることを確認する',
          '`expectedStatus` と `expectedLockVersion` が両方未指定の場合は `LENDING_CONCURRENCY_TOKEN_REQUIRED` を返す',
          '`expectedStatus` または `expectedLockVersion` がサーバー最新値と一致することを確認する。両方指定された場合はいずれも一致を必須とする',
          '`lending_devices.status` が `貸出中` / `使用中` / `使用済` / `返却済` の場合は解除を拒否する',
          '未返却の `lending_transactions.returned_on IS NULL` が存在する場合は解除を拒否する',
          '解除可能な場合、`lending_devices.is_active=false`、`released_at=現在日時`、`lock_version=lock_version+1` を保存する',
          '過去の `lending_transactions` は削除しない',
          '解除後に同一資産を再登録する場合は、新しい `lending_devices` 有効行を作成する'
        )
        ResponseTitle = 'レスポンス（200：LendingManagementReleaseResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('lendingDeviceId', 'int64', '✓', '解除した貸出管理機器ID'),
          @('assetLedgerId', 'int64', '✓', '資産台帳ID'),
          @('releasedAt', 'datetime', '✓', '解除日時'),
          @('completionMessage', 'string', '✓', '解除完了メッセージ')
        )
        StatusRows = @(
          @('200', '解除成功', 'LendingManagementReleaseResponse'),
          @('400', '入力値不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `lending_management` なし', 'ErrorResponse'),
          @('404', '有効な貸出管理対象機器を参照できない', 'ErrorResponse'),
          @('409', '解除不可状態または競合', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = 'CRUD 定義' },
    @{ Type = 'Table'; Headers = @('対象データ', 'Create', 'Read', 'Update', 'Delete/解除'); Rows = @(
      @('`lending_devices`', '貸出機器登録APIで有効行を作成', 'コンテキスト、一覧、No.7貸出・返却で参照', '貸出設定変更API、No.7貸出・返却API、日常点検APIで用途別に更新', '貸出機解除APIで `is_active=false`、`released_at` を保存'),
      @('`lending_transactions`', 'No.7貸出・返却APIで作成', '一覧で貸出日、返却予定日、超過日数、貸出回数を参照', 'No.7貸出・返却APIで使用開始/使用終了/返却を更新', '削除しない'),
      @('`asset_ledgers.is_rented_out`', '対象外', '一覧・検索で参照可能な派生フラグ', 'No.7貸出・返却APIが状態更新時に同期', '対象外')
    ) },
    @{ Type = 'Heading2'; Text = '主要業務ルール' },
    @{ Type = 'Bullets'; Items = @(
      '登録時に作成する `lending_devices` は1資産1有効行を維持する',
      '貸出管理タブの貸出設定変更ではステータスを変更しない',
      '貸出機解除は履歴削除ではなく通常一覧からの除外である',
      '貸出中、使用中、使用済、返却済、未返却履歴ありのいずれかに該当する場合は解除できない',
      '`return_period_days` は現行の貸出管理画面/APIでは登録・更新せず、貸出時に返却予定日が未指定で `return_period_days` も `null` の場合は No.7 貸出・返却APIで返却予定日入力必須として扱う',
      '貸出グループ候補は独立マスタを作らず、現存する有効 `lending_devices` から動的に生成する',
      '貸出可能機器閲覧および貸出/返却処理は No.7 貸出・返却APIの責務であり、本書では呼び出し先として参照する'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('コード', 'HTTP', '説明', '主な発生条件'); Rows = $errorRows },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = 'ログ・監査' },
    @{ Type = 'Bullets'; Items = @(
      '登録、設定変更、貸出機解除の更新系APIでは、操作ユーザーID、作業対象施設ID、対象 `lending_device_id`、更新前後の主要値、結果、エラーコードを監査ログへ記録する',
      '一括登録では対象 `assetLedgerIds` と作成された `lendingDeviceIds` を同一操作IDで追跡できるようにする',
      '解除時は `released_at` と操作ログにより履歴追跡し、過去の貸出履歴は削除しない'
    ) },
    @{ Type = 'Heading2'; Text = '保守時の確認観点' },
    @{ Type = 'Bullets'; Items = @(
      'No.7 貸出・返却APIのステータス遷移定義と `lending_devices.status` の許容値を一致させる',
      'DB制約またはアプリケーション制御で、同一 `asset_ledger_id` の有効 `lending_devices` が複数作成されないことを保証する',
      '返却アラートや超過表示の判定は業務日基準で統一し、保存値と算出値を混在させない',
      '貸出管理タブで参照する点検情報は点検管理・日常点検の正本データから取得し、貸出管理側に複製保存しない'
    ) }
  )
}
