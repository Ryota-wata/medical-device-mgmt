$checkoutPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`accountType=''SYSTEM_ADMIN''`）の場合は未削除の全施設・全機能を利用可能として扱い、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `lending_checkout` が有効であること'
)

$inUsePermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`accountType=''SYSTEM_ADMIN''`）の場合は未削除の全施設・全機能を利用可能として扱い、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `lending_checkout` が有効であること',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `lending_in_use_used` が有効であること'
)

$deviceStatusRows = @(
  @('貸出可', '貸出実行可能。貸出可能台数の集計対象'),
  @('貸出中', '貸出済み。`lending_in_use_used` 有効時は使用開始へ進める。無効時は直接返却できる'),
  @('使用中', '使用開始済み。`lending_in_use_used` が必要'),
  @('使用済', '使用終了済み。返却待ち。`lending_in_use_used` が必要'),
  @('返却済', '使用後日常点検メニューがある場合の点検待ち。貸出可能台数には含めない'),
  @('使用不可', '異常等により貸出不可。貸出可能台数には含めない')
)

$deviceTransitionRows = @(
  @('貸出可', '貸出中', '貸出する', '貸出時'),
  @('貸出中', '使用中', '使用を開始する', '`lending_checkout` と `lending_in_use_used` が有効な場合'),
  @('使用中', '使用済', '使用を終了する', '`lending_checkout` と `lending_in_use_used` が有効な場合'),
  @('貸出中', '返却済', '返却する', '使用後日常点検メニューあり'),
  @('使用済', '返却済', '返却する', '使用後日常点検メニューあり。`lending_in_use_used` も必要'),
  @('貸出中', '貸出可', '返却する', '使用後日常点検メニューなし'),
  @('使用済', '貸出可', '返却する', '使用後日常点検メニューなし。`lending_in_use_used` も必要'),
  @('返却済', '貸出可', '使用後日常点検合格', '日常点検API側で更新'),
  @('返却済', '使用不可', '使用後日常点検異常あり', '日常点検API側で更新'),
  @('貸出可', '使用不可', '日常点検異常あり', '日常点検API側で更新'),
  @('使用不可', '貸出可', '日常点検合格', '日常点検API側で更新')
)

$transactionTransitionRows = @(
  @('貸出中', '使用中', '使用を開始する', '`lending_in_use_used` 有効時'),
  @('使用中', '使用済', '使用を終了する', '`lending_in_use_used` 有効時'),
  @('貸出中', '返却済', '返却する', '使用開始を経由しない返却。使用後日常点検メニューの有無にかかわらず履歴は終端する'),
  @('使用済', '返却済', '返却する', '`lending_in_use_used` 有効時。使用後日常点検メニューの有無にかかわらず履歴は終端する')
)

$availableDeviceRows = @(
  @('lendingDeviceId', 'int64', '✓', '`lending_devices.lending_device_id`'),
  @('assetLedgerId', 'int64', '✓', '`asset_ledgers.asset_ledger_id`'),
  @('qrCodeValue', 'string', '-', '表示用の代表 `qr_codes.qr_identifier`。未発行または全QR削除済みの場合は `null`。代表決定ルールは「QR代表値の扱い」に従う'),
  @('itemName', 'string', '✓', '品目名'),
  @('makerName', 'string', '-', 'メーカー名'),
  @('modelName', 'string', '-', '型式'),
  @('status', 'string', '✓', '貸出機器ステータス'),
  @('canLend', 'boolean', '✓', '`status=''貸出可''` の場合 true。貸出可能台数の集計対象判定であり、代表QRの有無では変更しない')
)

$activeTransactionRows = @(
  @('lendingTransactionId', 'int64', '✓', '未返却の貸出履歴ID'),
  @('lentOn', 'date', '✓', '貸出日'),
  @('dueOn', 'date', '-', '返却予定日'),
  @('returnedOn', 'date', '-', '未返却時 NULL'),
  @('lentDepartment', 'string', '✓', '貸出先部署'),
  @('transactionStatus', 'string', '✓', '貸出履歴ステータス')
)

$checkoutItemRows = @(
  @('lendingDeviceId', 'int64', '✓', '貸出・返却更新APIの正本ID'),
  @('assetLedgerId', 'int64', '✓', '表示および資産台帳参照用ID'),
  @('qrCodeValue', 'string', '-', 'QR/バーコード解決時は入力に一致した `qr_codes.qr_identifier`。`lendingDeviceId` 起点の更新成功レスポンスでは表示用代表 `qr_codes.qr_identifier`、代表QRがない場合は `null`'),
  @('itemName', 'string', '✓', '品目名'),
  @('makerName', 'string', '-', 'メーカー名'),
  @('modelName', 'string', '-', '型式'),
  @('managementNo', 'string', '-', '`asset_ledgers.management_no`。画面のME管理No表示値として返す'),
  @('lendingGroupName', 'string', '-', '貸出グループ名'),
  @('lendingTypeName', 'string', '-', '貸出種別名'),
  @('currentStatus', 'string', '✓', '現在の `lending_devices.status`'),
  @('lockVersion', 'int64', '✓', '`lending_devices.lock_version`'),
  @('activeTransaction', 'LendingTransactionSummary', '-', '未返却履歴。存在する場合のみ'),
  @('returnPeriodDays', 'int32', '-', '返却予定日未指定時の既定日数'),
  @('returnAlertDays', 'int32', '-', '返却予定日前アラート日数'),
  @('overdueDays', 'int32', '✓', '未返却履歴の `dueOn` から算出した超過日数'),
  @('returnAlertStatus', 'string', '✓', '`NONE` / `DUE_SOON` / `OVERDUE`。未返却履歴の `dueOn` と `returnAlertDays` から算出するアラート状態'),
  @('afterUseDailyInspectionRequired', 'boolean', '✓', '`inspection_tasks.inspection_type=''日常点検''` かつ `daily_menu_after_id IS NOT NULL` の有効行がある場合 true'),
  @('allowedActions', 'string[]', '✓', '実効権限と現在状態から実行可能な操作'),
  @('primaryAction', 'string', '-', '画面で主ボタンとして表示する操作')
)

$checkoutActionResponseRows = @(
  @('item', 'LendingCheckoutItemResponse', '✓', '更新後の貸出対象機器状態'),
  @('completedAction', 'string', '✓', '`CHECKOUT` / `RETURN` / `START_USE` / `END_USE`。`CHECKOUT` は貸出する操作を表し、ステータス遷移定義の `transition_action_code` と一致させる'),
  @('completionTitle', 'string', '✓', '完了表示のタイトル'),
  @('completionMessage', 'string', '✓', '処理結果メッセージ。対象機器名、更新後ステータス、返却予定日または返却日を含める')
)

$errorRows = @(
  @('AUTH_401_UNAUTHORIZED', '401', '認証情報が存在しない、または無効', 'Bearer トークン未指定、期限切れ、署名不正'),
  @('AUTH_403_LENDING_CHECKOUT_DENIED', '403', '作業対象施設に対する実効 `lending_checkout` がない', '通常アカウントで施設提供設定またはユーザー施設別設定の `lending_checkout` が無効'),
  @('AUTH_403_LENDING_IN_USE_USED_DENIED', '403', '使用開始/使用終了/使用済返却に必要な実効 `lending_in_use_used` がない', '通常アカウントの `start-use` / `end-use` / 使用済状態からの `return` で `lending_in_use_used` が無効'),
  @('LENDING_DEVICE_NOT_FOUND', '404', 'QR/バーコードまたは `lendingDeviceId` から有効な貸出対象機器を解決できない', 'QR未発行、削除済み、未紐付、施設不一致、貸出管理対象未登録、または対象ID不存在'),
  @('LENDING_DEVICE_INACTIVE', '409', '貸出管理対象が解除済みで操作できない', '`lending_devices.is_active=false` または `released_at IS NOT NULL`'),
  @('LENDING_STATUS_CONFLICT', '409', '`expectedStatus` または `expectedLockVersion` がサーバー最新状態と一致しない', '画面取得後に別操作でステータスまたは `lock_version` が更新済み'),
  @('LENDING_INVALID_STATUS_TRANSITION', '409', '現在ステータスから要求アクションへの遷移が許可されない', 'ステータス遷移定義に存在しない操作、または権限上許可されない操作'),
  @('LENDING_ACTIVE_TRANSACTION_NOT_FOUND', '409', '返却/使用開始/使用終了に必要な未返却履歴が存在しない', '`returned_on IS NULL` の `lending_transactions` が存在しない'),
  @('LENDING_ACTIVE_TRANSACTION_EXISTS', '409', '貸出時に未返却履歴が既に存在する', '貸出登録時に同一 `lending_device_id` の未返却履歴が存在する'),
  @('LENDING_DUE_ON_REQUIRED', '400', '返却予定日が必須だが指定されておらず既定日数も設定されていない', '`dueOn` 未指定かつ `return_period_days` 未設定'),
  @('LENDING_DUE_ON_INVALID', '400', '返却予定日が貸出日または使用開始日より前である', '`dueOn` が業務日より前'),
  @('LENDING_LENT_DEPARTMENT_REQUIRED', '400', '貸出先部署が未入力', '貸出登録リクエストの `lentDepartment` が空'),
  @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー', '想定外例外')
)

@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_貸出・返却.docx'
  ScreenLabel = '貸出・返却'
  CoverDateText = '2026年5月21日'
  RevisionDateText = '2026/5/21'
  RevisionAuthorText = 'RyokuTaniguchi'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、メニュー画面の貸出・返却ボタンから開く貸出メニューモーダル、および同モーダルから利用する貸出可能機器閲覧画面（`/lending-available`）と貸出・返却画面（`/lending-checkout`）で利用する API の設計内容を整理する。' },
    @{ Type = 'Paragraph'; Text = '貸出管理タブで登録された有効な `lending_devices` を正本として、貸出可能機器の閲覧、QR/バーコード起点の貸出対象解決、貸出、返却、使用開始、使用終了の API 仕様、状態遷移、DB 更新境界、認可条件を明確にする。' },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '貸出・返却は、ME室等が貸出管理対象として登録した機器を、利用部署へ貸出し、必要に応じて使用開始・使用終了を経由して返却する業務である。貸出対象の登録、貸出グループ名、貸出種別名、返却アラート設定、解除は No.31 貸出管理 API 設計書の責務とし、本書はメニュー画面から利用する貸出・返却操作を対象とする。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('貸出・返却', 'メニュー画面の貸出・返却ボタンから利用する貸出可能機器閲覧、貸出、返却、使用開始、使用終了の業務'),
      @('貸出管理対象機器', '`lending_devices` の有効行。貸出・返却更新 API の正本 ID は `lending_device_id` とする'),
      @('貸出可能機器閲覧', '`/lending-available`。貸出グループ別に機器と貸出可能台数を確認する画面'),
      @('貸出・返却画面', '`/lending-checkout`。QR/バーコードから機器を解決し、現在状態に応じた操作を行う画面'),
      @('貸出履歴', '`lending_transactions` の1行。貸出時に作成し、返却時に `returned_on` と `status=''返却済''` を設定する'),
      @('使用後日常点検待ち', '返却時に使用後日常点検メニューが設定されている場合の `lending_devices.status=''返却済''` 状態')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面パス', '利用目的'); Rows = @(
      @('貸出メニューモーダル', '/main', 'メニュー画面の貸出・返却ボタンから開き、貸出可能機器閲覧または貸出・返却画面へ遷移する'),
      @('貸出可能機器閲覧画面', '/lending-available', '貸出管理で登録された有効な貸出対象機器を貸出グループ別に閲覧し、貸出可能台数を確認する'),
      @('貸出・返却画面', '/lending-checkout', 'QR/バーコードから貸出対象機器を解決し、現在状態に応じて貸出、返却、使用開始、使用終了を実行する')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'API の位置づけ' },
    @{ Type = 'Paragraph'; Text = '本 API 群は、貸出管理で登録された `lending_devices.is_active=true` の機器を参照し、貸出・返却系の業務更新を行う。資産一覧からの貸出機器登録、貸出設定変更、貸出機解除は No.31 貸出管理 API 設計書で扱い、本書では定義しない。' },
    @{ Type = 'Paragraph'; Text = '貸出可能機器閲覧と貸出・返却画面の入口権限は `lending_checkout` とする。使用開始、使用終了、使用済状態からの返却は `lending_checkout` に加えて `lending_in_use_used` の実効権限を必須とする。' },
    @{ Type = 'Heading2'; Text = '画面と API の関係' },
    @{ Type = 'Table'; Headers = @('画面操作', 'API', '補足'); Rows = @(
      @('貸出メニューモーダル表示', '専用APIなし', '`/auth/context` の `lending_checkout` 実効権限を用いてモーダルおよび遷移ボタンを表示する'),
      @('貸出可能機器閲覧初期表示/絞り込み', '`GET /lending-available/items`', '貸出グループ、品目、メーカー、型式単位の集計と機器一覧を取得する'),
      @('QR/バーコード入力後の機器解決', '`GET /lending-checkout/items/{qrOrBarcode}`', '現在ステータス、未返却履歴、返却予定日、実行可能アクションを取得する'),
      @('貸出する', '`POST /lending-checkout/devices/{lendingDeviceId}/lend`', '`貸出可` の機器を `貸出中` にする'),
      @('返却する', '`POST /lending-checkout/devices/{lendingDeviceId}/return`', '`貸出中` または `使用済` の機器を返却する。使用後日常点検の有無で貸出機器ステータスを分岐する'),
      @('使用を開始する', '`POST /lending-checkout/devices/{lendingDeviceId}/start-use`', '`貸出中` の機器を `使用中` にする。`lending_in_use_used` が必要'),
      @('使用を終了する', '`POST /lending-checkout/devices/{lendingDeviceId}/end-use`', '`使用中` の機器を `使用済` にする。`lending_in_use_used` が必要')
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル名', '利用種別', '用途'); Rows = @(
      @('`lending_devices`', 'READ / UPDATE', '貸出管理対象機器の正本。状態、貸出グループ名、返却期限日数、返却アラート日数、排他制御版を参照・更新する'),
      @('`lending_transactions`', 'CREATE / READ / UPDATE', '貸出時に未返却履歴を作成し、使用開始/使用終了/返却で履歴ステータスと返却日を更新する'),
      @('`asset_ledgers`', 'READ / UPDATE', '機器属性表示、施設スコープ判定、貸出中派生フラグ `is_rented_out` 同期'),
      @('`qr_codes`', 'READ', 'QR/バーコードから資産台帳IDを解決する'),
      @('`lending_device_status_definitions`', 'READ', '貸出機器ステータスの許容値確認'),
      @('`lending_device_status_transitions`', 'READ', '貸出機器ステータス遷移の許可判定'),
      @('`lending_transaction_status_definitions`', 'READ', '貸出履歴ステータスの許容値確認'),
      @('`lending_transaction_status_transitions`', 'READ', '貸出履歴ステータス遷移の許可判定'),
      @('`inspection_tasks`', 'READ', '対象資産に使用後日常点検メニューが設定されているかを判定する'),
      @('`feature_catalogs`', 'READ', '`lending_checkout` / `lending_in_use_used` の機能コード定義と `config_scope` 確認'),
      @('`facility_feature_settings` / `user_facility_feature_settings`', 'READ', '`lending_checkout` と `lending_in_use_used` の実効権限判定'),
      @('`user_facility_assignments`', 'READ', 'ログインユーザーの作業対象施設割当確認')
    ) },
    @{ Type = 'Heading2'; Text = '責務境界' },
    @{ Type = 'Bullets'; Items = @(
      'No.31 貸出管理は、貸出対象機器の登録、貸出グループ名、貸出種別名、返却アラート設定、貸出機解除、貸出管理タブ一覧を扱う',
      '本書は、No.31 で登録された `lending_devices` を参照し、貸出可能機器閲覧と貸出・返却状態更新を扱う',
      '使用後日常点検の結果登録と `返却済` から `貸出可` / `使用不可` への更新は日常点検 API の責務とする',
      '`asset_ledgers.is_rented_out` は貸出状態の正本ではなく、貸出・返却更新時に同期する検索・一覧表示用の派生フラグとする'
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API 共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON',
      '文字コード: UTF-8',
      '日時形式: ISO 8601。日付のみの項目は `YYYY-MM-DD` とする',
      '認証済み API は Bearer トークンを `Authorization` ヘッダーに付与する',
      '更新系 API は `expectedStatus` または `expectedLockVersion` を受け取り、サーバー最新状態と一致しない場合は 409 を返す',
      '貸出・返却の更新 API は `lending_device_id` をパス ID とする。`asset_ledger_id` は表示と資産台帳参照のために返却するが、更新 API の正本 ID には使用しない'
    ) },
    @{ Type = 'Heading2'; Text = '認証・認可' },
    @{ Type = 'Paragraph'; Text = '`lending_checkout` は貸出可能機器閲覧、貸出・返却画面、貸出、貸出中からの返却の入口権限である。`lending_in_use_used` は使用開始、使用終了、使用済状態からの返却に必要な追加権限であり、単独では画面表示・業務 API 実行を許可しない。' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '説明'); Rows = @(
      @('貸出メニューモーダル、貸出可能機器閲覧、QR/バーコード解決、貸出、貸出中からの返却', '`lending_checkout`', '貸出・返却機能の入口および通常貸出/返却を許可する'),
      @('使用開始、使用終了、使用済状態からの返却', '`lending_checkout` + `lending_in_use_used`', '使用中/使用済みフローを許可する')
    ) },
    @{ Type = 'Bullets'; Items = @(
      '共有システム管理者アカウント（`accountType=''SYSTEM_ADMIN''`）は、未削除の全施設・全機能を利用可能として扱う。通常アカウント向けの `user_facility_assignments`、`facility_feature_settings`、`user_facility_feature_settings` の実効判定は適用しない',
      '通常アカウントでは、作業対象施設に対する担当施設割当と施設提供設定・ユーザー施設別設定の両方を満たす場合だけ実効権限ありとする'
    ) },
    @{ Type = 'Heading2'; Text = '施設スコープ' },
    @{ Type = 'Bullets'; Items = @(
      'すべての API は Bearer トークン上の作業対象施設を基準に処理する',
      'QR/バーコード解決時は `qr_codes` から解決した `asset_ledgers.facility_id` が作業対象施設と一致することを必須とする',
      '`lending_devices.asset_ledger_id` から参照する `asset_ledgers.facility_id` が作業対象施設と一致しない場合は `LENDING_DEVICE_NOT_FOUND`（404）とし、他施設の貸出状態を返さない',
      '協業グループや他施設公開設定による他施設閲覧は貸出・返却の更新対象に含めない'
    ) },
    @{ Type = 'Heading2'; Text = 'QR代表値の扱い' },
    @{ Type = 'Bullets'; Items = @(
      '貸出・返却更新の正本IDは `lending_device_id` であり、`qrCodeValue` は表示とQR/バーコード入力解決のための値とする',
      'QR/バーコード貸出対象取得では、入力値から解決した `qr_codes.qr_identifier` を `qrCodeValue` として返す',
      '貸出可能機器一覧、および `lendingDeviceId` 起点の更新成功レスポンスでは、同一 `asset_ledger_id` に紐づく `qr_codes.deleted_at IS NULL` かつ作業対象施設一致のQRから、`code_prefix`、`code_branch`、`code_serial`、`qr_code_id` の昇順で先頭1件を表示用代表 `qrCodeValue` とする',
      '表示用代表QRが存在しない貸出管理対象は `qrCodeValue=null` として返す。`canLend` と貸出可能台数は `lending_devices.status=''貸出可''` のみで判定し、代表QRの有無では変更しない',
      'QR/バーコード貸出対象取得は入力されたQR/バーコードから `qr_codes` を解決する API のため、該当する有効QRが存在しない入力値では `LENDING_DEVICE_NOT_FOUND` を返す'
    ) },
    @{ Type = 'Heading2'; Text = '貸出機器ステータス' },
    @{ Type = 'Table'; Headers = @('ステータス', '意味'); Rows = $deviceStatusRows },
    @{ Type = 'Heading2'; Text = '貸出機器ステータス遷移' },
    @{ Type = 'Table'; Headers = @('遷移元', '遷移先', 'アクション', '条件'); Rows = $deviceTransitionRows },
    @{ Type = 'Heading2'; Text = '貸出履歴ステータス遷移' },
    @{ Type = 'Table'; Headers = @('遷移元', '遷移先', 'アクション', '条件'); Rows = $transactionTransitionRows },
    @{ Type = 'Heading2'; Text = '返却予定日・アラート・超過日数' },
    @{ Type = 'Bullets'; Items = @(
      '貸出時の `dueOn` が指定されない場合、`lending_devices.return_period_days` が設定済みであれば貸出日 + 返却期限日数を `lending_transactions.due_on` とする',
      '`dueOn` が未指定かつ `return_period_days` も未設定の場合は `LENDING_DUE_ON_REQUIRED` を返す',
      '使用開始時に `dueOn` が指定された場合は、未返却履歴の `lending_transactions.due_on` を更新できる',
      '`lending_devices.return_alert_days` は `due_on` の何日前から警告対象にするかの判定値であり、超過日数とは別に扱う',
      '超過日数は `max(0, 業務日 - lending_transactions.due_on)` で算出する',
      '`returnAlertStatus` は `due_on < 業務日` の場合 `OVERDUE`、`return_alert_days IS NOT NULL` かつ `due_on - 業務日 <= return_alert_days` の場合 `DUE_SOON`、それ以外は `NONE` とする。未返却履歴がない場合、または `return_alert_days` が未設定で超過していない場合は `NONE` とする'
    ) },
    @{ Type = 'Heading2'; Text = '競合制御' },
    @{ Type = 'Bullets'; Items = @(
      '貸出、返却、使用開始、使用終了は対象 `lending_devices` 行と未返却の最新 `lending_transactions` 行を同一トランザクションでロックする',
      '`expectedStatus` と `expectedLockVersion` のいずれか、または両方をリクエストに含める。サーバー最新値と一致しない場合は更新せず 409 を返す',
      '成功時は `lending_devices.lock_version` を +1 し、レスポンスに更新後の `lockVersion` を返す',
      'ステータス更新時は `lending_device_status_transitions` と `lending_transaction_status_transitions` に定義済みの遷移だけを許可する',
      '貸出時は未返却履歴が存在しないことを検証する。存在する場合は `LENDING_ACTIVE_TRANSACTION_EXISTS` を返す',
      '返却、使用開始、使用終了時は未返却履歴が1件存在することを検証する。存在しない場合は `LENDING_ACTIVE_TRANSACTION_NOT_FOUND` を返す'
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
    @{ Type = 'Heading3'; Text = 'LendingAvailableDevice' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $availableDeviceRows },
    @{ Type = 'Heading3'; Text = 'LendingTransactionSummary' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $activeTransactionRows },
    @{ Type = 'Heading3'; Text = 'LendingCheckoutItemResponse' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $checkoutItemRows },
    @{ Type = 'Heading3'; Text = 'LendingCheckoutActionResponse' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $checkoutActionResponseRows },

    @{ Type = 'Heading1'; Text = '第4章 API 一覧' },
    @{ Type = 'Table'; Headers = @('No', 'API名', 'メソッド', 'パス', '用途', '権限'); Rows = @(
      @('1', '貸出可能機器一覧取得', 'GET', '/lending-available/items', '貸出グループ別の貸出対象機器と貸出可能台数を取得する', '`lending_checkout`'),
      @('2', 'QR/バーコード貸出対象取得', 'GET', '/lending-checkout/items/{qrOrBarcode}', 'QR/バーコードから有効な貸出対象機器を解決する', '`lending_checkout`'),
      @('3', '貸出登録', 'POST', '/lending-checkout/devices/{lendingDeviceId}/lend', '貸出履歴を作成し、貸出機器を `貸出中` にする', '`lending_checkout`'),
      @('4', '返却登録', 'POST', '/lending-checkout/devices/{lendingDeviceId}/return', '未返却履歴を返却済みにし、貸出機器を `返却済` または `貸出可` にする', '`lending_checkout`。使用済からの返却は `lending_in_use_used` も必要'),
      @('5', '使用開始登録', 'POST', '/lending-checkout/devices/{lendingDeviceId}/start-use', '貸出機器と未返却履歴を `使用中` にする', '`lending_checkout` + `lending_in_use_used`'),
      @('6', '使用終了登録', 'POST', '/lending-checkout/devices/{lendingDeviceId}/end-use', '貸出機器と未返却履歴を `使用済` にする', '`lending_checkout` + `lending_in_use_used`')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 貸出・返却機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '貸出可能機器一覧取得（/lending-available/items）'
        Overview = '有効な貸出管理対象機器を貸出グループ名、品目、メーカー、型式単位で取得し、各機器のステータスと貸出可能台数を返す。'
        Method = 'GET'
        Path = '/lending-available/items'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('lendingGroupName', 'query', 'string', '-', '貸出グループ名。未指定時は全グループ。画面の貸出グループ選択に連動する')
        )
        PermissionLines = $checkoutPermissionLines
        ProcessingLines = @(
          '`lending_devices.is_active=true` の貸出管理対象機器を取得する',
          '`asset_ledgers.facility_id` が作業対象施設と一致する機器だけを対象にする',
          '`lendingGroupName` が指定された場合は貸出グループ名で絞り込む。品目、メーカー、型式の検索フィルターは本 API では定義せず、返却された集計行を画面表示する',
          '同一資産に有効QRがある場合は「QR代表値の扱い」に従って表示用 `qrCodeValue` を1件選択し、有効QRがない場合は `qrCodeValue=null` とする',
          '貸出可能台数は `lending_devices.status=''貸出可''` のみを集計対象とする',
          '`貸出中`、`使用中`、`使用済`、`返却済`、`使用不可` は機器一覧にはステータス付きで返すが、貸出可能台数には含めない',
          '貸出グループ名、品目名、メーカー名、型式、QRコードの昇順で返す'
        )
        ResponseTitle = 'レスポンス（200：LendingAvailableItemsResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('generatedAt', 'datetime', '✓', 'レスポンス生成日時'),
          @('groups', 'LendingAvailableGroup[]', '✓', '貸出グループ別の集計')
        )
        ResponseSubtables = @(
          @{
            Title = 'groups要素（LendingAvailableGroup）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('lendingGroupName', 'string', '✓', '貸出グループ名'),
              @('totalCount', 'int32', '✓', '貸出グループ内の有効貸出管理対象機器数'),
              @('availableCount', 'int32', '✓', '貸出グループ内の `貸出可` 台数。画面の貸出可能合計表示に使用する'),
              @('items', 'LendingAvailableItem[]', '✓', '品目・メーカー・型式単位の集計')
            )
          },
          @{
            Title = 'items要素（LendingAvailableItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('itemName', 'string', '✓', '品目名'),
              @('makerName', 'string', '-', 'メーカー名'),
              @('modelName', 'string', '-', '型式'),
              @('totalCount', 'int32', '✓', '有効貸出管理対象機器数'),
              @('availableCount', 'int32', '✓', '`貸出可` の台数'),
              @('devices', 'LendingAvailableDevice[]', '✓', '個別機器一覧')
            )
          },
          @{
            Title = 'devices要素（LendingAvailableDevice）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $availableDeviceRows
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'LendingAvailableItemsResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `lending_checkout` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'QR/バーコード貸出対象取得（/lending-checkout/items/{qrOrBarcode}）'
        Overview = 'QR/バーコードから有効な貸出対象機器を解決し、機器情報、現在ステータス、未返却履歴、返却予定日、実行可能アクション、`lockVersion` を返す。'
        Method = 'GET'
        Path = '/lending-checkout/items/{qrOrBarcode}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('qrOrBarcode', 'path', 'string', '✓', '`qr_codes.qr_identifier` 形式（例: `R-07-00001`）またはハイフンなし形式（例: `R0700001`）')
        )
        PermissionLines = $checkoutPermissionLines
        ProcessingLines = @(
          '`qrOrBarcode` を trim・英字大文字化し、`R-07-00001` 形式またはハイフンなしの `R0700001` 形式として正規化する',
          '`qr_codes.deleted_at IS NULL` と `qr_codes.facility_id=作業対象施設` を共通条件に、`qr_codes.qr_identifier=正規化後識別子` または `code_prefix` / `code_branch` / `code_serial` が一致する1件を解決する',
          '`qr_codes.asset_ledger_id` が NULL の場合は `LENDING_DEVICE_NOT_FOUND` を返す',
          '`asset_ledgers.facility_id` が作業対象施設と一致することを確認する',
          '`asset_ledger_id` に紐づく `lending_devices.is_active=true` の有効行を1件取得する',
          '有効な貸出管理対象機器が存在しない場合は `LENDING_DEVICE_NOT_FOUND` を返す',
          '未返却の最新 `lending_transactions.returned_on IS NULL` を取得する',
          '使用後日常点検メニューが設定されているかを `inspection_tasks.inspection_type=''日常点検''`、`is_active=true`、`deleted_at IS NULL`、`daily_menu_after_id IS NOT NULL` の有効行から判定する',
          '現在ステータスと実効権限から `allowedActions` と `primaryAction` を算出する',
          '`使用不可` と `返却済` は貸出操作対象外として返す'
        )
        ResponseTitle = 'レスポンス（200：LendingCheckoutItemResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $checkoutItemRows
        ResponseSubtables = @(
          @{
            Title = 'activeTransaction要素（LendingTransactionSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $activeTransactionRows
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'LendingCheckoutItemResponse'),
          @('400', 'QR/バーコード形式不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `lending_checkout` なし', 'ErrorResponse'),
          @('404', '有効な貸出対象機器が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '貸出登録（/lending-checkout/devices/{lendingDeviceId}/lend）'
        Overview = '`貸出可` の貸出管理対象機器について、貸出先部署と返却予定日を登録し、貸出履歴を作成して機器を `貸出中` にする。'
        Method = 'POST'
        Path = '/lending-checkout/devices/{lendingDeviceId}/lend'
        Auth = '要（Bearer）'
        ParametersTitle = 'Path Parameter'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('lendingDeviceId', 'path', 'int64', '✓', '貸出管理機器ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('lentDepartment', 'string', '✓', '貸出先部署。担当者IDは受け取らない'),
          @('dueOn', 'date', '-', '返却予定日。未指定時は `returnPeriodDays` から算出する'),
          @('expectedStatus', 'string', '条件必須', '`貸出可`。`expectedLockVersion` 未指定時は必須'),
          @('expectedLockVersion', 'int64', '条件必須', '画面取得時点の `lending_devices.lock_version`。`expectedStatus` 未指定時は必須')
        )
        PermissionLines = $checkoutPermissionLines
        ProcessingLines = @(
          '`lending_devices` を `lending_device_id` で取得し、`is_active=true`、作業対象施設一致、`status=''貸出可''` を確認する',
          '`expectedStatus` と `expectedLockVersion` は少なくとも一方を必須とし、両方指定された場合はいずれもサーバー最新値と一致することを確認する',
          '未返却の `lending_transactions.returned_on IS NULL` が存在しないことを確認する',
          '`dueOn` 未指定時は `lending_devices.return_period_days` から貸出日 + 返却期限日数で算出する。算出できない場合は `LENDING_DUE_ON_REQUIRED` を返す',
          '`dueOn` が貸出日より前の場合は `LENDING_DUE_ON_INVALID` を返す',
          '`lending_transactions` を `lent_on=業務日`、`due_on=確定返却予定日`、`lent_department`、`status=''貸出中''` で作成する',
          '`lending_devices.status=''貸出中''`、`last_lent_on=業務日`、`lock_version=lock_version+1` に更新する',
          '`asset_ledgers.is_rented_out=true` に同期する',
          '担当者IDや担当者名は貸出業務履歴として保存しない',
          '上記更新は同一トランザクションで行う'
        )
        ResponseTitle = 'レスポンス（201：LendingCheckoutActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $checkoutActionResponseRows
        ResponseSubtables = @(
          @{
            Title = 'item要素（LendingCheckoutItemResponse）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $checkoutItemRows
          }
        )
        StatusRows = @(
          @('201', '貸出登録成功', 'LendingCheckoutActionResponse'),
          @('400', '貸出先部署未入力、返却予定日不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `lending_checkout` なし', 'ErrorResponse'),
          @('404', '対象貸出機器が存在しない', 'ErrorResponse'),
          @('409', 'ステータス競合、未返却履歴あり、遷移不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '返却登録（/lending-checkout/devices/{lendingDeviceId}/return）'
        Overview = '`貸出中` または `使用済` の貸出管理対象機器について返却を登録し、未返却履歴を終端させる。使用後日常点検メニューの有無により貸出機器ステータスを `返却済` または `貸出可` に分岐する。'
        Method = 'POST'
        Path = '/lending-checkout/devices/{lendingDeviceId}/return'
        Auth = '要（Bearer）'
        ParametersTitle = 'Path Parameter'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('lendingDeviceId', 'path', 'int64', '✓', '貸出管理機器ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('expectedStatus', 'string', '条件必須', '`貸出中` または `使用済`。`expectedLockVersion` 未指定時は必須'),
          @('expectedLockVersion', 'int64', '条件必須', '画面取得時点の `lending_devices.lock_version`。`expectedStatus` 未指定時は必須')
        )
        PermissionLines = $checkoutPermissionLines + @(
          '通常アカウントで現在ステータスが `使用済` の場合は、`lending_checkout` に加えて `lending_in_use_used` の実効権限を必須とする'
        )
        ProcessingLines = @(
          '`lending_devices` を取得し、`is_active=true`、作業対象施設一致、`status IN (''貸出中'',''使用済'')` を確認する',
          '`expectedStatus` と `expectedLockVersion` は少なくとも一方を必須とし、両方指定された場合はいずれもサーバー最新値と一致することを確認する',
          '未返却の最新 `lending_transactions.returned_on IS NULL` を1件取得する。存在しない場合は `LENDING_ACTIVE_TRANSACTION_NOT_FOUND` を返す',
          '現在ステータスが `使用済` の場合は `lending_in_use_used` の実効権限を再判定する',
          '未返却履歴に `returned_on=業務日`、`status=''返却済''` を設定する。貸出・返却画面に返却備考入力はないため、本 API は `remarks` を受け取らない',
          '対象資産に使用後日常点検メニューがある場合は `lending_devices.status=''返却済''` とする',
          '使用後日常点検メニューがない場合は `lending_devices.status=''貸出可''` とし、`返却済` を経由しない',
          '`lending_devices.last_returned_on=業務日`、`lock_version=lock_version+1` に更新する',
          '`asset_ledgers.is_rented_out=false` に同期する',
          '上記更新は同一トランザクションで行う'
        )
        ResponseTitle = 'レスポンス（200：LendingCheckoutActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $checkoutActionResponseRows
        ResponseSubtables = @(
          @{
            Title = 'item要素（LendingCheckoutItemResponse）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $checkoutItemRows
          }
        )
        StatusRows = @(
          @('200', '返却登録成功', 'LendingCheckoutActionResponse'),
          @('400', '入力値不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '実効権限なし', 'ErrorResponse'),
          @('404', '対象貸出機器が存在しない', 'ErrorResponse'),
          @('409', 'ステータス競合、未返却履歴なし、遷移不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '使用開始登録（/lending-checkout/devices/{lendingDeviceId}/start-use）'
        Overview = '`貸出中` の貸出管理対象機器について使用開始を登録し、貸出機器と未返却履歴を `使用中` にする。'
        Method = 'POST'
        Path = '/lending-checkout/devices/{lendingDeviceId}/start-use'
        Auth = '要（Bearer）'
        ParametersTitle = 'Path Parameter'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('lendingDeviceId', 'path', 'int64', '✓', '貸出管理機器ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('dueOn', 'date', '-', '返却予定日を使用開始時に変更する場合に指定'),
          @('expectedStatus', 'string', '条件必須', '`貸出中`。`expectedLockVersion` 未指定時は必須'),
          @('expectedLockVersion', 'int64', '条件必須', '画面取得時点の `lending_devices.lock_version`。`expectedStatus` 未指定時は必須')
        )
        PermissionLines = $inUsePermissionLines
        ProcessingLines = @(
          '`lending_devices` を取得し、`is_active=true`、作業対象施設一致、`status=''貸出中''` を確認する',
          '`expectedStatus` と `expectedLockVersion` は少なくとも一方を必須とし、両方指定された場合はいずれもサーバー最新値と一致することを確認する',
          '未返却の最新 `lending_transactions.returned_on IS NULL` を1件取得する',
          '`dueOn` が指定された場合は未返却履歴の `due_on` を更新する。業務日より前の場合は `LENDING_DUE_ON_INVALID` を返す',
          '`lending_transactions.status=''使用中''` に更新する',
          '`lending_devices.status=''使用中''`、`lock_version=lock_version+1` に更新する',
          '`asset_ledgers.is_rented_out=true` を維持する',
          '上記更新は同一トランザクションで行う'
        )
        ResponseTitle = 'レスポンス（200：LendingCheckoutActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $checkoutActionResponseRows
        ResponseSubtables = @(
          @{
            Title = 'item要素（LendingCheckoutItemResponse）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $checkoutItemRows
          }
        )
        StatusRows = @(
          @('200', '使用開始登録成功', 'LendingCheckoutActionResponse'),
          @('400', '返却予定日不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '`lending_checkout` または `lending_in_use_used` の実効権限なし', 'ErrorResponse'),
          @('404', '対象貸出機器が存在しない', 'ErrorResponse'),
          @('409', 'ステータス競合、未返却履歴なし、遷移不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '使用終了登録（/lending-checkout/devices/{lendingDeviceId}/end-use）'
        Overview = '`使用中` の貸出管理対象機器について使用終了を登録し、貸出機器と未返却履歴を `使用済` にする。'
        Method = 'POST'
        Path = '/lending-checkout/devices/{lendingDeviceId}/end-use'
        Auth = '要（Bearer）'
        ParametersTitle = 'Path Parameter'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('lendingDeviceId', 'path', 'int64', '✓', '貸出管理機器ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('expectedStatus', 'string', '条件必須', '`使用中`。`expectedLockVersion` 未指定時は必須'),
          @('expectedLockVersion', 'int64', '条件必須', '画面取得時点の `lending_devices.lock_version`。`expectedStatus` 未指定時は必須')
        )
        PermissionLines = $inUsePermissionLines
        ProcessingLines = @(
          '`lending_devices` を取得し、`is_active=true`、作業対象施設一致、`status=''使用中''` を確認する',
          '`expectedStatus` と `expectedLockVersion` は少なくとも一方を必須とし、両方指定された場合はいずれもサーバー最新値と一致することを確認する',
          '未返却の最新 `lending_transactions.returned_on IS NULL` を1件取得する',
          '`lending_transactions.status=''使用済''` に更新する',
          '`lending_devices.status=''使用済''`、`lock_version=lock_version+1` に更新する',
          '`asset_ledgers.is_rented_out=true` を維持する',
          '上記更新は同一トランザクションで行う'
        )
        ResponseTitle = 'レスポンス（200：LendingCheckoutActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $checkoutActionResponseRows
        ResponseSubtables = @(
          @{
            Title = 'item要素（LendingCheckoutItemResponse）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $checkoutItemRows
          }
        )
        StatusRows = @(
          @('200', '使用終了登録成功', 'LendingCheckoutActionResponse'),
          @('400', '入力値不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '`lending_checkout` または `lending_in_use_used` の実効権限なし', 'ErrorResponse'),
          @('404', '対象貸出機器が存在しない', 'ErrorResponse'),
          @('409', 'ステータス競合、未返却履歴なし、遷移不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '権限マトリクス' },
    @{ Type = 'Table'; Headers = @('処理', 'feature_code', '判定条件', '説明'); Rows = @(
      @('貸出可能機器閲覧', '`lending_checkout`', '作業対象施設で実効有効', '貸出対象機器の閲覧'),
      @('QR/バーコード貸出対象取得', '`lending_checkout`', '作業対象施設で実効有効', '貸出・返却画面の機器解決'),
      @('貸出登録', '`lending_checkout`', '作業対象施設で実効有効', '`貸出可` から `貸出中` への更新'),
      @('貸出中からの返却', '`lending_checkout`', '作業対象施設で実効有効', '使用開始を経由しない返却'),
      @('使用開始/使用終了/使用済からの返却', '`lending_checkout` + `lending_in_use_used`', '両方が作業対象施設で実効有効', '使用中/使用済みフロー')
    ) },
    @{ Type = 'Heading2'; Text = 'CRUD・ライフサイクル' },
    @{ Type = 'Table'; Headers = @('操作', '対象テーブル', '処理内容'); Rows = @(
      @('参照', '`lending_devices`, `asset_ledgers`, `lending_transactions`', '貸出可能機器閲覧、QR/バーコード解決、現在状態、未返却履歴取得'),
      @('参照', '`qr_codes`', 'QR/バーコード入力から資産を解決し、貸出可能機器一覧と更新成功レスポンスの表示用代表QRを取得'),
      @('参照', '`inspection_tasks`', '使用後日常点検メニュー有無を判定'),
      @('参照', '`feature_catalogs`', '`lending_checkout` / `lending_in_use_used` の機能コード定義と `config_scope` を確認'),
      @('参照', '`lending_device_status_definitions`, `lending_device_status_transitions`, `lending_transaction_status_definitions`, `lending_transaction_status_transitions`', '状態値と遷移許可を検証'),
      @('作成', '`lending_transactions`', '貸出時に `status=''貸出中''` の未返却履歴を作成'),
      @('更新', '`lending_devices`', '貸出、返却、使用開始、使用終了でステータスと `lock_version` を更新'),
      @('更新', '`lending_transactions`', '使用開始、使用終了、返却で履歴ステータス、返却予定日、返却日を更新'),
      @('更新', '`asset_ledgers`', '貸出状態に応じて `is_rented_out` を同期'),
      @('削除', '-', '貸出・返却 API では削除しない。貸出機解除は No.31 貸出管理で扱う')
    ) },
    @{ Type = 'Heading2'; Text = '状態別アクション' },
    @{ Type = 'Table'; Headers = @('現在ステータス', 'primaryAction', 'allowedActions', '備考'); Rows = @(
      @('貸出可', 'CHECKOUT', 'CHECKOUT', '貸出先部署と返却予定日を入力して貸出する。遷移定義の `transition_action_code=''CHECKOUT''` を使用する'),
      @('貸出中', '`lending_in_use_used` 有効時: START_USE / 無効時: RETURN', '`lending_in_use_used` 有効時: START_USE, RETURN / 無効時: RETURN', '使用中/使用済みフロー権限がないユーザーには使用開始を表示・実行させない'),
      @('使用中', 'END_USE', 'END_USE', '`lending_in_use_used` が必要'),
      @('使用済', 'RETURN', 'RETURN', '`lending_in_use_used` が必要'),
      @('返却済', '-', '-', '使用後日常点検待ちのため貸出・返却画面では操作不可'),
      @('使用不可', '-', '-', '貸出不可。日常点検合格で復帰する')
    ) },
    @{ Type = 'Heading2'; Text = 'データ整合ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`lending_devices.status` を貸出状態の正本とし、`asset_ledgers.is_rented_out` は派生フラグとして同一トランザクションで同期する',
      '同一 `lending_device_id` に未返却履歴は1件までとする',
      '返却後の `lending_transactions.status` は使用後日常点検メニューの有無にかかわらず `返却済` とし、`returned_on` を必ず設定する',
      '使用後日常点検メニューがある場合だけ `lending_devices.status=''返却済''` を保持する',
      '使用後日常点検メニューがない場合は返却時に `lending_devices.status=''貸出可''` へ戻す',
      '貸出・返却 API では `待機中` を使用しない',
      '定期点検周期到来だけを理由に本 API が `使用不可` へ自動変更することはない',
      '貸出、返却、使用開始、使用終了の成功レスポンスは `completionTitle` と `completionMessage` を返し、画面は完了表示を出す。`次の機器を処理` は画面内ボタンとして追加 API を呼ばず、QRラベル、貸出先部署、返却予定日の入力状態を初期化する'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('コード', 'HTTP', '内容', '発生条件'); Rows = $errorRows },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Bullets'; Items = @(
      '貸出グループ名、貸出種別名、返却アラート日数、返却期限日数は `lending_devices` を正本とし、設定変更は No.31 貸出管理で行う',
      '貸出・返却更新 API は、貸出管理タブ、貸出可能機器閲覧、資産一覧の表示に影響するため、成功時は更新後状態と `lockVersion` を返してクライアント側の再表示に利用できるようにする',
      '使用後日常点検メニューの設定変更は、返却時点の判定に影響する。返却 API は実行時点の有効設定を参照する',
      '`lending_in_use_used` を施設提供設定で OFF にする可否検証は権限管理 API の責務であり、本書では使用中/使用済フロー実行時の認可再判定を扱う',
      '貸出履歴は監査・集計用途として保持し、返却後も物理削除しない'
    ) }
  )
}

