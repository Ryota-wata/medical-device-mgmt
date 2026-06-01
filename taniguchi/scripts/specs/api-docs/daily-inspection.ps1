$dailyInspectionPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `daily_inspection` が有効であること'
)

@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_日常点検.docx'
  ScreenLabel = '日常点検'
  CoverDateText = '2026年5月18日'
  RevisionDateText = '2026/5/18'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、日常点検オフライン準備画面（`/inspection-prep`）、日常点検画面（`/daily-inspection`）、点検結果画面（`/inspection-result`）で利用する API の設計内容を整理し、画面要件、DB 設計、点検管理タブとの責務境界を一致させることを目的とする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      '日常点検PWAで利用する資産・QR識別子・点検メニュー・資産別日常点検設定の取得 I/F',
      '未送信の日常点検結果をサーバーへ同期する I/F',
      'QR コードを起点とした端末内ローカルデータによる対象資産・日常点検メニュー解決方針',
      '日常点検結果の登録、貸出状態更新、修理申請連携用の結果 ID 返却方針',
      '点検結果画面および報告書出力データ取得 I/F'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '日常点検は、医療機器を QR コードで特定し、使用前・使用中・使用後のタイミングに応じた点検メニューを実施し、結果を記録する業務である。`/inspection-prep` を日常点検PWAの入口とし、オンライン状態で有効QR識別子付き点検対象資産、QR識別子、日常点検メニュー、点検項目、点検管理タブで有効な資産別日常点検設定行を端末内に全量ダウンロードした上で、点検開始後はダウンロード済みデータを用いてQR読取から点検実施までを継続する。' },
    @{ Type = 'Paragraph'; Text = '点検結果は端末内の未送信キューに保持し、オンライン復帰後に同期する。オンライン状態で即時登録する場合も、PWA上で利用したダウンロード済みメニューと項目スナップショットを保持し、同期APIと同じ検証・永続化ルールを適用する。' },
    @{ Type = 'Paragraph'; Text = '点検メニュー登録、資産一覧画面の選択資産から起動する点検管理登録、日常点検設定行の一覧表示・設定変更・設定解除、点検予定表 CSV 出力、定期点検実施、メーカー保守結果登録は No.28 点検管理タブ API 設計書の対象とし、本書では日常点検の準備・実施・結果参照を対象とする。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('日常点検', 'QR 読取した資産に対して、使用前・使用中・使用後のいずれかのタイミングで実施する点検'),
      @('日常点検タイミング', '`BEFORE` / `DURING` / `AFTER`。画面表示では `使用前` / `使用中` / `使用後` とする'),
      @('日常点検メニュー', '`inspection_menus.menu_type=''DAILY''` の点検メニュー。`daily_timing` と資産分類により選択する'),
      @('資産別日常点検設定', '`inspection_tasks.inspection_type=''日常点検''`、`is_active=true` の1資産1有効行。`daily_menu_before_id` / `daily_menu_during_id` / `daily_menu_after_id` に使用前・使用中・使用後メニューを保持する'),
      @('日常点検PWAパッケージ', '`/inspection-prep/master/download` で全量取得し、端末内ストレージへ置換保存する有効QR識別子付き点検対象資産、QR識別子、日常点検メニュー、点検項目、有効な資産別日常点検設定行の集合。設定未登録資産もQR照合と警告表示のため資産側に含める'),
      @('点検結果明細', '点検項目ごとの入力値。`inspection_results.result_details_json` に JSON として保持する')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面パス', '利用目的'); Rows = @(
      @('日常点検オフライン準備画面', '/inspection-prep', '日常点検PWAの入口。オンラインでPWAパッケージを取得し、未送信点検結果を同期する'),
      @('日常点検画面', '/daily-inspection', 'ダウンロード済みPWAパッケージを用いたQR読取、点検タイミング選択、点検項目入力、点検結果一時保存/登録、修理申請連携'),
      @('点検結果画面', '/inspection-result', '点検結果の確認、報告書出力データ取得、次の点検または修理申請への後続導線')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'API の位置づけ' },
    @{ Type = 'Paragraph'; Text = '本 API 群は、日常点検担当者が対象施設内の資産をPWAで点検するためのサーバー I/F を提供する。QR読取後の対象資産特定と点検メニュー選択は、通常経路では `/inspection-prep/master/download` で取得した端末内PWAパッケージを用いてクライアント側で実行する。画面表示制御と API 実行可否は `daily_inspection` の実効 `feature_code` を正本として判定する。' },
    @{ Type = 'Paragraph'; Text = '点検管理タブで作成された点検メニューと、資産一覧画面の点検管理登録導線で登録された資産別日常点検設定を参照するが、メニュー CRUD、点検タスク登録、日程調整、スキップ、点検予定表 CSV 出力は本書の対象外とする。' },
    @{ Type = 'Heading2'; Text = '画面と API の関係' },
    @{ Type = 'Table'; Headers = @('画面操作', 'API', '補足'); Rows = @(
      @('`/inspection-prep` 初期表示', '`GET /inspection-prep/context`', 'ダウンロード状況、対象件数、最終同期情報を取得する'),
      @('データをダウンロード', '`GET /inspection-prep/master/download`', '有効QR識別子付き資産、QR識別子、日常点検メニュー、点検項目、有効な資産別日常点検設定行を全量取得し、端末側ストレージへ置換保存する。設定未登録資産もQR照合と警告表示のため資産側に含める'),
      @('点検結果を送信', '`POST /inspection-prep/results/sync`', '端末側に保持した未送信日常点検結果を一括送信する'),
      @('QR 読取または手入力後の対象資産特定', 'APIなし（端末内PWAパッケージを検索）', 'ダウンロード済みQR識別子、資産、資産別日常点検設定、日常点検メニューから対象資産と点検メニューを決定する。設定行または対象タイミングのメニューがない場合は点検入力画面へ遷移しない'),
      @('オンライン時のQR再検証', '`GET /daily-inspection/assets/by-qr/{qrCode}`', 'PWAパッケージ不整合、未登録警告、オンライン補助確認が必要な場合だけ利用する補助API'),
      @('確認ステップの完了または修理申請連携', '`POST /daily-inspection/results`', 'オンライン実施結果を登録し、修理申請連携用 seed を返す'),
      @('`/inspection-result` 表示または報告書出力', '`GET /inspection-result/reports/{inspectionResultId}`', '日常点検結果の表示と報告書出力に必要なデータを取得する。定期点検結果の参照は No.28 点検管理タブ API 設計書で扱う')
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル名', '利用種別', '用途'); Rows = @(
      @('`asset_ledgers`', 'READ', '点検対象資産の属性取得、施設スコープ判定、管理機器番号による手入力補助検索'),
      @('`qr_codes`', 'READ', 'QR 識別子から資産台帳 ID を解決する'),
      @('`inspection_menus`', 'READ', '日常点検メニューの取得、タイミング別メニュー判定'),
      @('`inspection_menu_items`', 'READ', '点検項目、入力方式、評価方式、選択肢の取得'),
      @('`inspection_tasks`', 'READ', '資産別日常点検設定の解決、点検結果の親タスク参照'),
      @('`inspection_results`', 'CREATE', '日常点検結果の登録、オフライン同期結果の保存'),
      @('`inspection_results`', 'READ', '点検結果画面/報告書データの取得、`clientResultId` 再送検出'),
      @('`application_documents`', 'READ', '点検結果報告書や添付資料のファイルメタデータ取得'),
      @('`lending_devices`', 'READ / UPDATE', '貸出管理対象機器の場合の点検後ステータス更新'),
      @('`lending_device_status_definitions`', 'READ', '貸出管理機器ステータスの許容値確認'),
      @('`lending_device_status_transitions`', 'READ', '貸出管理対象機器の点検後ステータス更新可否確認'),
      @('`users`', 'READ', '実施者ユーザーIDと表示名の解決'),
      @('`facilities`', 'READ', '作業対象施設の存在確認、契約状態、論理削除確認')
    ) },
    @{ Type = 'Paragraph'; Text = '`inspection_results.inspection_task_id` は DB 定義上必須であるため、日常点検結果は `inspection_tasks.inspection_type=''日常点検''`、`is_active=true` の資産別日常点検設定行へ紐づけて登録する。端末内PWAパッケージまたはオンラインQR再検証で対象タイミングの `inspectionTaskId` を解決できない場合、点検入力画面へ遷移させず、結果登録 API は `DAILY_INSPECTION_TASK_REQUIRED` または `DAILY_TIMING_MENU_REQUIRED` を返し、点検管理タブで日常点検設定を登録・変更させる。' },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API 共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-05-16T00:00:00Z`）',
      '日付形式: `YYYY-MM-DD`',
      '認証済み API は Bearer トークンを `Authorization` ヘッダーに付与する',
      '一覧・ダウンロード系 API は Bearer トークン上の作業対象施設を基準に自施設データのみ返却する',
      'QR コードの値は `qr_codes.qr_identifier` を正本とする資産特定用の識別子であり、認証情報・ユーザー情報・権限情報を含めない'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '本 API 群で使用する `feature_code` は以下の通りとする。通常アカウントでは、Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）では、作業対象施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず API 実行を許可する。画面表示用の `/auth/context` は UX 用キャッシュであり、各業務 API でも同条件を再判定する。' },
    @{ Type = 'Table'; Headers = @('管理単位名', 'feature_code', '対象処理'); Rows = @(
      @('日常点検・オフライン準備', '`daily_inspection`', '準備状況取得、PWAパッケージ取得、結果同期、オンラインQR再検証、日常点検結果登録、結果/報告書データ取得')
    ) },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('日常点検 API 全般', '`daily_inspection`', '通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings` / 共有システム管理者: `users.account_type`, `facilities.deleted_at`', '作業対象施設内の日常点検準備・実施・結果参照を許可する')
    ) },
    @{ Type = 'Heading2'; Text = '作業対象施設ベースの認可' },
    @{ Type = 'Bullets'; Items = @(
      '共有システム管理者アカウントでは、Bearer トークン上の作業対象施設が未削除であることを確認し、実効 `daily_inspection` の施設別・ユーザー別 ON/OFF 判定は行わない',
      '通常アカウントでは、各 API が Bearer トークン上の作業対象施設に対する実効 `daily_inspection` を都度再判定する',
      '資産を指定する API は、対象 `asset_ledgers.facility_id` が作業対象施設 ID と一致することを確認する',
      '日常点検対象資産は原則 `asset_ledgers.status=''ACTIVE''` とする。`REPAIR` / `RETIRED` / `LOST` など ACTIVE 以外の資産は、オンラインQR再検証では対象資産情報と警告を返すが、結果登録は拒否する',
      '点検結果を指定する API は、`inspection_results -> inspection_tasks -> asset_ledgers` をたどって作業対象施設内の結果であることを確認する',
      '日常点検は自施設業務として扱い、協業グループや他施設公開設定は適用しない'
    ) },
    @{ Type = 'Heading2'; Text = 'オフライン同期方針' },
    @{ Type = 'Bullets'; Items = @(
      'オフラインパッケージは作業対象施設内の有効QR識別子付き点検対象資産、QR識別子、日常点検メニュー、点検項目、有効な資産別日常点検設定行を含める',
      '有効QR識別子付き点検対象資産は、日常点検設定行の有無にかかわらず含める。これにより、QRは資産に紐づくが日常点検メニューが未設定である状態を、QR未登録エラーと区別して表示できる',
      'QR削除・再割当・資産状態変更を安全に反映するため、PWAパッケージ取得は差分マージではなく全量取得結果による端末内データ置換を正とする',
      '初回、期限切れ、または未ダウンロードの場合は、オンラインでパッケージを取得するまで点検開始を許可しない',
      '点検開始後のQR照合と点検メニュー解決は端末内PWAパッケージを正とし、サーバー照会を必須にしない',
      '端末側は `clientResultId` を生成し、同期 API は同一 `clientResultId` の再送を検出する。現行 DB では専用一意制約を持てないため、同時送信の完全な一意保証は今後拡張事項とする',
      '同期 API は結果 1 件ごとに成功/失敗を返し、失敗した結果は端末側で未送信として残せるようにする',
      'サーバー保存済みの点検結果は `inspectionResultId` を返却し、修理申請起票時の連携キーとして利用する'
    ) },
    @{ Type = 'Heading2'; Text = 'PWAクライアント処理境界' },
    @{ Type = 'Bullets'; Items = @(
      '`/inspection-prep` は日常点検PWAの入口として、オンライン時にPWAパッケージを取得し、端末内ストレージへ保存する',
      '`/daily-inspection` はQR読取後、端末内PWAパッケージのQR識別子、資産、資産別日常点検設定、日常点検メニュー、点検項目を検索する。資産別日常点検設定行がない場合、または選択タイミングのメニューが未設定の場合は警告を表示し、点検実施画面へ進めない',
      '点検結果は端末内の未送信キューへ保存し、`/inspection-prep/results/sync` が成功するまで削除しない',
      '端末内キャッシュ、Service Worker、IndexedDBの実装詳細はフロントエンド実装範囲とし、サーバーDBには保存しない'
    ) },
    @{ Type = 'Heading2'; Text = '点検結果明細 JSON 方針' },
    @{ Type = 'Paragraph'; Text = '`inspection_results.result_details_json` は、点検項目 ID、表示順、入力方式、評価方式、入力値、表示値、単位、判定を保持する。合否入力は画面の `○` / `×` を保存時に `PASS` / `FAIL` へ正規化し、表示用に `displayValue` も保持する。単位入力は数値と単位を分けて保持し、フリー入力は文字列を保持する。' },
    @{ Type = 'Heading3'; Text = '基本エラーレスポンス（ErrorResponse）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや補足情報')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API 一覧' },
    @{ Type = 'Heading2'; Text = '日常点検オフライン準備（/inspection-prep）' },
    @{ Type = 'Table'; Headers = @('No', 'API名', 'メソッド', 'パス', '用途', '権限'); Rows = @(
      @('1', '準備状況取得', 'GET', '/inspection-prep/context', '点検対象件数、点検メニュー件数、最終同期情報、未送信件数を取得する', '`daily_inspection`'),
      @('2', 'PWAパッケージ取得', 'GET', '/inspection-prep/master/download', 'オフライン日常点検に必要な有効QR識別子付き資産・QR識別子・点検メニュー・項目・資産別設定を全量取得する', '`daily_inspection`'),
      @('3', '日常点検結果同期', 'POST', '/inspection-prep/results/sync', 'オフライン端末に保存された未送信点検結果を一括送信する', '`daily_inspection`')
    ) },
    @{ Type = 'Heading2'; Text = '日常点検実施（/daily-inspection）' },
    @{ Type = 'Table'; Headers = @('No', 'API名', 'メソッド', 'パス', '用途', '権限'); Rows = @(
      @('4', 'オンラインQR資産再検証', 'GET', '/daily-inspection/assets/by-qr/{qrCode}', 'PWAパッケージ不整合時またはオンライン補助時にQR読取結果を再検証する', '`daily_inspection`'),
      @('5', '日常点検結果登録', 'POST', '/daily-inspection/results', '日常点検結果を登録し、必要に応じて貸出状態を更新する', '`daily_inspection`')
    ) },
    @{ Type = 'Heading2'; Text = '点検結果（/inspection-result）' },
    @{ Type = 'Table'; Headers = @('No', 'API名', 'メソッド', 'パス', '用途', '権限'); Rows = @(
      @('6', '点検結果報告データ取得', 'GET', '/inspection-result/reports/{inspectionResultId}', '点検結果画面表示および報告書出力に必要なデータを取得する', '`daily_inspection`')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 日常点検機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '準備状況取得（/inspection-prep/context）'
        Overview = '日常点検オフライン準備画面の初期表示に必要なダウンロード状況、件数、最終送信情報を取得する。'
        Method = 'GET'
        Path = '/inspection-prep/context'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('clientDeviceId', 'query', 'string', '-', '端末を識別する任意 ID。未指定時はユーザー単位の最終同期情報を返す')
        )
        PermissionLines = $dailyInspectionPermissionLines
        ProcessingLines = @(
          '作業対象施設の `facilities.deleted_at IS NULL` を確認する',
          '`asset_ledgers.facility_id` が作業対象施設 ID と一致し、`status=''ACTIVE''` かつ有効な `qr_codes` が紐づく資産件数を取得する',
          '`inspection_tasks` から作業対象施設内の `inspection_type=''日常点検''` かつ `is_active=true` の資産別日常点検設定件数を取得する',
          '有効な資産別日常点検設定行から参照される `inspection_menus.menu_type=''DAILY''` のメニュー件数を取得する',
          'サーバー管理の同期履歴がある場合は `clientDeviceId` と認証ユーザーに対応する最終ダウンロード日時・最終送信日時を返す',
          'サーバーは端末内の未送信件数を保持しないため、`serverUnsyncedCount` は常に 0 とし、画面の未送信件数はクライアント側ストレージの件数を優先表示する'
        )
        ResponseTitle = 'レスポンス（200：InspectionPrepContextResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('generatedAt', 'datetime', '✓', 'サーバーがレスポンスを生成した日時'),
          @('assetCount', 'int32', '✓', '作業対象施設内の点検対象資産件数'),
          @('dailyMenuCount', 'int32', '✓', '有効な日常点検メニュー件数'),
          @('dailySettingCount', 'int32', '✓', '資産別日常点検設定件数'),
          @('lastDownloadedAt', 'datetime', '-', '対象端末/ユーザーの最終ダウンロード日時'),
          @('lastSyncedAt', 'datetime', '-', '対象端末/ユーザーの最終同期日時'),
          @('serverUnsyncedCount', 'int32', '✓', 'サーバー側が把握する未同期件数。通常は 0')
        )
        StatusRows = @(
          @('200', '取得成功', 'InspectionPrepContextResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `daily_inspection` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'PWAパッケージ取得（/inspection-prep/master/download）'
        Overview = 'オフライン日常点検で利用する有効QR識別子付き点検対象資産、QR識別子、日常点検メニュー、点検項目、有効な資産別日常点検設定行を全量取得する。クライアントは取得結果でIndexedDB等の端末内ストレージを置換し、点検開始後のQR照合と点検メニュー解決に使用する。日常点検設定が未登録の資産も資産側に含め、QR読取時に設定未登録警告を表示できるようにする。'
        Method = 'GET'
        Path = '/inspection-prep/master/download'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('clientDeviceId', 'query', 'string', '-', '端末を識別する任意 ID')
        )
        PermissionLines = $dailyInspectionPermissionLines
        ProcessingLines = @(
          '作業対象施設の `facilities.deleted_at IS NULL` を確認する',
          '`asset_ledgers.facility_id` が作業対象施設 ID と一致し、`status=''ACTIVE''` かつ有効な `qr_codes` が1件以上紐づく資産を、日常点検設定行の有無にかかわらず取得する',
          '`qr_codes.facility_id` が作業対象施設 ID と一致し、`deleted_at IS NULL`、`asset_ledger_id IS NOT NULL` のQR識別子を取得し、対象資産に紐づけて返す',
          '`inspection_tasks` から、取得対象資産に紐づく `inspection_type=''日常点検''`、`is_active=true` の資産別日常点検設定行を取得する。`status`、`last_inspection_on`、`next_inspection_on` は日常点検では使用しない',
          'PWAへ配信する `inspection_menus` は、取得した有効な資産別日常点検設定行の `daily_menu_before_id` / `daily_menu_during_id` / `daily_menu_after_id` から参照される有効な日常点検メニューに限定する。設定行から参照されない日常点検メニューは、メニュー候補や管理用データとして配信しない',
          '取得対象メニューに紐づく `inspection_menu_items` を `display_order ASC` で取得する',
          '資産に有効な日常点検設定行がない場合、資産データは返すが `settings` には含めない。クライアントはQR読取後に該当設定がないことを検出し、点検入力画面へ遷移させない',
          'レスポンスは常に全量パッケージとし、クライアントは既存の端末内PWAパッケージをマージせず置換する',
          '同期履歴に最終ダウンロード日時を記録できる場合は `clientDeviceId` と認証ユーザーに紐づけて更新する。サーバー側同期履歴テーブルを持たない構成では端末側の最終ダウンロード日時を画面表示の正とする'
        )
        ResponseTitle = 'レスポンス（200：DailyInspectionMasterDownloadResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('downloadedAt', 'datetime', '✓', 'ダウンロード日時'),
          @('isFull', 'boolean', '✓', '常に true。端末側は取得結果でローカルPWAパッケージを置換する'),
          @('packageVersion', 'string', '✓', '端末内キャッシュ識別用のパッケージバージョン。例: `downloadedAt` と作業対象施設IDから生成'),
          @('validUntil', 'datetime', '-', '再ダウンロード推奨期限。期限切れ後は点検開始前にオンライン再取得を促す'),
          @('assets', 'DailyInspectionAsset[]', '✓', '点検対象資産'),
          @('menus', 'DailyInspectionMenu[]', '✓', '日常点検メニュー'),
          @('settings', 'DailyInspectionAssetSetting[]', '✓', '有効な資産別日常点検設定行')
        )
        ResponseSubtables = @(
          @{
            Title = 'assets要素（DailyInspectionAsset）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('assetLedgerId', 'int64', '✓', '資産台帳 ID'),
              @('qrCode', 'string', '✓', '代表QR識別子。単一QR表示用'),
              @('qrIdentifiers', 'string[]', '✓', '対象資産に紐づく有効QR識別子。QR読取時の端末内照合キー'),
              @('assetStatus', 'string', '✓', '`asset_ledgers.status`。オフライン対象は `ACTIVE` のみ'),
              @('largeClassName', 'string', '-', '大分類'),
              @('mediumClassName', 'string', '-', '中分類'),
              @('itemName', 'string', '-', '品目'),
              @('manufacturerName', 'string', '-', 'メーカー'),
              @('modelName', 'string', '-', '型式'),
              @('managementDepartmentName', 'string', '-', '管理部署'),
              @('installationLocation', 'string', '-', '設置場所'),
              @('dailyInspectionConfigured', 'boolean', '✓', '有効な資産別日常点検設定行が存在する場合 true。false の場合、QR照合後に未設定警告を表示し点検開始不可とする'),
              @('configuredTimings', 'string[]', '✓', '設定済みタイミング。`BEFORE` / `DURING` / `AFTER` の配列。未設定時は空配列')
            )
          },
          @{
            Title = 'menus要素（DailyInspectionMenu）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('inspectionMenuId', 'int64', '✓', '点検メニュー ID'),
              @('menuName', 'string', '✓', '点検メニュー名'),
              @('dailyTiming', 'string', '✓', '`BEFORE` / `DURING` / `AFTER`'),
              @('largeClassName', 'string', '-', '対象大分類'),
              @('mediumClassName', 'string', '-', '対象中分類'),
              @('itemName', 'string', '-', '対象品目'),
              @('isActive', 'boolean', '✓', 'PWA配信時点で有効な日常点検メニューのため true'),
              @('updatedAt', 'datetime', '✓', 'メニュー更新日時'),
              @('items', 'DailyInspectionMenuItem[]', '✓', '点検項目')
            )
          },
          @{
            Title = 'items要素（DailyInspectionMenuItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('inspectionMenuItemId', 'int64', '✓', '点検項目 ID'),
              @('displayOrder', 'int32', '✓', '表示順'),
              @('itemName', 'string', '✓', '項目名'),
              @('itemContent', 'string', '✓', '点検内容'),
              @('inputType', 'string', '✓', '`SELECT` / `FREE`。UI 表示では `選択` / `フリー入力` に変換する'),
              @('evaluationType', 'string', '✓', '`PASS_FAIL` / `UNIT` / `FREE`。UI 表示では `合否` / `単位` / `フリー入力` に変換する'),
              @('unitText', 'string', '-', '単位入力時の単位'),
              @('selectOptions', 'string[]', '-', '`select_options_json` を配列化した選択肢')
            )
          },
          @{
            Title = 'settings要素（DailyInspectionAssetSetting）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('inspectionTaskId', 'int64', '✓', '結果登録時に指定する点検タスク ID'),
              @('assetLedgerId', 'int64', '✓', '資産台帳 ID'),
              @('inspectionType', 'string', '✓', '`日常点検` 固定'),
              @('beforeMenuId', 'int64', '-', '使用前日常点検メニュー ID'),
              @('duringMenuId', 'int64', '-', '使用中日常点検メニュー ID'),
              @('afterMenuId', 'int64', '-', '使用後日常点検メニュー ID'),
              @('isActive', 'boolean', '✓', 'PWA配信対象のため true')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'DailyInspectionMasterDownloadResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `daily_inspection` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '日常点検結果同期（/inspection-prep/results/sync）'
        Overview = 'オフラインで実施した日常点検結果を一括送信する。各結果は個別に成功/失敗を返し、クライアント側で未送信結果を再送できるようにする。'
        Method = 'POST'
        Path = '/inspection-prep/results/sync'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエスト（DailyInspectionResultSyncRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('clientDeviceId', 'string', '-', '端末を識別する任意 ID'),
          @('masterDownloadedAt', 'datetime', '✓', '端末が利用したオフラインマスタの取得日時。設定解除後の同期可否判定と再送診断に使用する'),
          @('packageVersion', 'string', '-', '端末が利用したPWAパッケージバージョン。同期結果の監査と再送診断に使用する'),
          @('results', 'DailyInspectionResultInput[]', '✓', '同期対象の日常点検結果')
        )
        RequestSubtables = @(
          @{
            Title = 'results要素（DailyInspectionResultInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('clientResultId', 'string', '✓', '端末内で一意な結果 ID。冪等登録に使用する'),
              @('inspectionTaskId', 'int64', '✓', '資産別日常点検設定の点検タスク ID'),
              @('assetLedgerId', 'int64', '✓', '資産台帳 ID'),
              @('inspectionMenuId', 'int64', '✓', '実施した日常点検メニュー ID'),
              @('dailyTiming', 'string', '✓', '`BEFORE` / `DURING` / `AFTER`'),
              @('inspectedOn', 'date', '✓', '点検実施日'),
              @('inspectedAt', 'datetime', '✓', '端末上の点検完了日時。設定解除日時との前後判定に使用する'),
              @('inspectorName', 'string', '✓', '実施者名'),
              @('overallResult', 'string', '✓', '`PASS` / `REPAIR_REQUEST`。画面表示の `合格` / `異常あり` を正規化する'),
              @('resultDetails', 'DailyInspectionResultDetailInput[]', '✓', '点検項目ごとの結果'),
              @('remarks', 'string', '-', '備考')
            )
          }
        )
        PermissionLines = $dailyInspectionPermissionLines
        ProcessingLines = @(
          '各結果について `inspectionTaskId` が `inspection_type=''日常点検''`、`status IS NULL` の日常点検設定行として存在し、紐づく `asset_ledgers.facility_id` が作業対象施設 ID と一致し、`asset_ledgers.status=''ACTIVE''` であることを検証する',
          'オフライン同期では、対象日常点検設定行が同期時点で `is_active=false` でも、`masterDownloadedAt` 時点でPWAパッケージに含まれ、かつ `deleted_at IS NULL` または `inspectedAt <= deleted_at` の場合は実施済み結果として登録を許可する。`masterDownloadedAt` が解除後、または `inspectedAt` が解除後の場合は `DAILY_INSPECTION_TASK_REQUIRED` とする',
          '`assetLedgerId` が `inspection_tasks.asset_ledger_id` と一致することを検証する',
          '`inspectionMenuId` が対象設定行の `daily_menu_before_id` / `daily_menu_during_id` / `daily_menu_after_id` の指定タイミングと一致することを検証する。対象タイミングのメニューIDが `NULL` の場合は `DAILY_TIMING_MENU_REQUIRED` とする',
          '`inspection_menus.menu_type=''DAILY''` と `daily_timing` を検証する。オフライン同期ではダウンロード後に `is_active=false` へ変更されたメニューでも、メニュー ID と項目 ID が存在し、対象タスクの該当日常メニュー ID と一致する場合は登録を許可する',
          '`resultDetails[*].inspectionMenuItemId` が対象メニュー配下の `inspection_menu_items` であることを検証する',
          '未登録の `clientResultId` は `inspection_results` に登録し、登録済みの `clientResultId` は既存 `inspectionResultId` を返す。現行 DB に `clientResultId` 専用カラムがないため、Phase1 では `clientDeviceId`、認証ユーザー、`clientResultId` の組み合わせをアプリケーションロックし、`result_details_json.clientResultId` を検索して再送を検出する。DB 一意制約による完全な同時実行保証は今後拡張事項とする',
          '合格時に対象資産が `lending_devices` に存在する場合は、`lending_device_status_transitions` で現在ステータスから `貸出可` への遷移が許可される場合のみ `status=''貸出可''` へ更新する',
          '異常あり時に対象資産が `lending_devices` に存在する場合は、`lending_device_status_transitions` で現在ステータスから `使用不可` への遷移が許可される場合のみ `status=''使用不可''` へ更新する',
          '貸出ステータス遷移が未定義の場合、点検結果登録自体は成功させ、レスポンスの `lendingStatusUpdateStatus` に `SKIPPED_TRANSITION_NOT_ALLOWED` を返す',
          '結果 1 件ごとに DB トランザクションを分け、1 件の失敗が他結果の保存を妨げないようにする',
          '同期完了後、成功件数が 1 件以上あれば最終同期日時を更新する'
        )
        ExtraTables = @(
          @{
            Title = '永続化マッピング'
            Headers = @('テーブル', '対象カラム / 操作', '設定値 / 反映内容', '備考')
            Rows = @(
              @('`inspection_results`', '`inspection_task_id`', 'リクエスト `inspectionTaskId`', 'DB 必須 FK'),
              @('`inspection_results`', '`inspected_on`', 'リクエスト `inspectedOn`', '点検日'),
              @('`inspection_results`', '`inspector_user_id` / `inspector_name`', '認証ユーザー ID / リクエスト `inspectorName`', '業務上の表示名は入力値を保持する'),
              @('`inspection_results`', '`overall_result`', '`PASS` または `REPAIR_REQUEST`', '画面の `異常あり` は修理申請導線を持つため `REPAIR_REQUEST` に正規化する'),
              @('`inspection_results`', '`result_details_json`', '点検項目結果、`clientResultId`、`masterDownloadedAt`、`packageVersion`、`inspectedAt`、`dailyTiming`、`inspectionMenuId`、実施時点のメニュー/項目スナップショットを JSON 保存', '項目別結果は正規化テーブルを持たない'),
              @('`inspection_results`', '`remarks`', 'リクエスト `remarks`', '備考'),
              @('`lending_devices`', '`status` / `updated_at`', '合格時 `貸出可`、異常時 `使用不可` / 現在時刻', '`lending_device_status_transitions` で許可される場合のみ')
            )
          }
        )
        ResponseTitle = 'レスポンス（200：DailyInspectionResultSyncResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('syncedAt', 'datetime', '✓', '同期処理日時'),
          @('successCount', 'int32', '✓', '保存または既存確認に成功した件数'),
          @('failureCount', 'int32', '✓', '保存に失敗した件数'),
          @('results', 'DailyInspectionSyncItemResult[]', '✓', '結果ごとの同期結果')
        )
        ResponseSubtables = @(
          @{
            Title = 'results要素（DailyInspectionSyncItemResult）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('clientResultId', 'string', '✓', '端末内結果 ID'),
              @('inspectionResultId', 'int64', '-', '保存済み点検結果 ID'),
              @('status', 'string', '✓', '`SUCCESS` / `FAILED` / `DUPLICATE`'),
              @('lendingStatusUpdateStatus', 'string', '-', '`UPDATED` / `NOT_TARGET` / `SKIPPED_TRANSITION_NOT_ALLOWED`'),
              @('errorCode', 'string', '-', '失敗時のエラーコード'),
              @('message', 'string', '-', '失敗時の補足')
            )
          }
        )
        StatusRows = @(
          @('200', '同期処理完了。結果ごとの成否はレスポンスで確認する', 'DailyInspectionResultSyncResponse'),
          @('400', 'リクエスト形式不正、`results` 空', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `daily_inspection` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'オンラインQR資産再検証（/daily-inspection/assets/by-qr/{qrCode}）'
        Overview = 'PWAパッケージで解決できないQR、期限切れパッケージ利用時のオンライン補助、またはユーザーが再検証を要求した場合に、QR コードから日常点検対象資産を再確認する。通常の点検開始フローでは、クライアントがダウンロード済みPWAパッケージを検索して対象資産と点検メニューを決定し、本 API 呼び出しを必須にしない。'
        Method = 'GET'
        Path = '/daily-inspection/assets/by-qr/{qrCode}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('qrCode', 'path', 'string', '✓', '読取または手入力した QR コード'),
          @('dailyTiming', 'query', 'string', '-', '`BEFORE` / `DURING` / `AFTER`。指定時は対象タイミングのメニューを優先返却する'),
          @('packageVersion', 'query', 'string', '-', '端末が利用中のPWAパッケージバージョン。サーバー側で期限切れや全量再取得推奨を判断するための補助情報')
        )
        PermissionLines = $dailyInspectionPermissionLines
        ProcessingLines = @(
          '通常フローでは、端末内PWAパッケージの `assets[*].qrIdentifiers` を検索して対象資産を決定する。本 API はオンライン再検証用であり、点検開始の必須条件にしない',
          'QR コードを `qr_codes.qr_identifier` として解決し、`qr_codes.facility_id` が作業対象施設 ID と一致し、`qr_codes.deleted_at IS NULL`、`qr_codes.asset_ledger_id IS NOT NULL` であることを確認する',
          '対象資産の `facility_id` が作業対象施設 ID と一致することを確認する',
          '対象資産の `status` が `ACTIVE` 以外の場合は、資産情報を返しつつ `canRegisterResult=false`、`warningCode=DAILY_INSPECTION_ASSET_NOT_TARGET` とする',
          '対象資産に紐づく `inspection_tasks` のうち、`inspection_type=''日常点検''`、`is_active=true` の日常点検設定行を取得する',
          '`dailyTiming` 指定時は対応する `daily_menu_before_id` / `daily_menu_during_id` / `daily_menu_after_id` のメニューを返す',
          '資産別設定がない場合でも、資産の大分類・中分類・品目に一致する有効な日常点検メニュー候補を返す。ただし結果登録には `inspectionTaskId` が必要であるため、`canRegisterResult=false`、`warningCode=DAILY_INSPECTION_TASK_REQUIRED` とし、画面は点検入力画面へ遷移しない。一致する日常点検メニュー候補もない場合は `warningCode=NO_DAILY_MENU` とする',
          '資産別設定行はあるが `dailyTiming` に対応するメニューIDが `NULL` の場合は、`canRegisterResult=false`、`warningCode=DAILY_TIMING_MENU_REQUIRED` とし、該当タイミングの点検入力画面へ遷移しない',
          'メニュー候補は `inspection_menus.menu_type=''DAILY''`、`is_active=true`、資産の大分類/中分類/品目一致、`daily_timing` 一致で絞り込む',
          '条件一致メニューがない場合は 200 で資産情報と空のメニュー配列を返し、画面側で警告を表示できるようにする'
        )
        ResponseTitle = 'レスポンス（200：DailyInspectionAssetByQrResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('asset', 'DailyInspectionAsset', '✓', '対象資産'),
          @('setting', 'DailyInspectionAssetSetting', '-', '資産別日常点検設定。未登録時は null'),
          @('menus', 'DailyInspectionMenu[]', '✓', '利用可能な日常点検メニュー候補'),
          @('canRegisterResult', 'boolean', '✓', '結果登録に必要な `inspectionTaskId` が解決できる場合 true'),
          @('warningCode', 'string', '-', '`NO_DAILY_MENU` / `DAILY_INSPECTION_TASK_REQUIRED` / `DAILY_TIMING_MENU_REQUIRED` / `DAILY_INSPECTION_ASSET_NOT_TARGET`')
        )
        StatusRows = @(
          @('200', '取得成功。メニュー未登録時も 200 で警告コードを返す', 'DailyInspectionAssetByQrResponse'),
          @('400', 'QR コード形式不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `daily_inspection` なし、または対象施設不一致', 'ErrorResponse'),
          @('404', 'QR コードに一致する資産が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '日常点検結果登録（/daily-inspection/results）'
        Overview = 'オンラインで実施した日常点検結果を登録する。オフライン同期 API の 1 件分と同じ検証・永続化を行う。'
        Method = 'POST'
        Path = '/daily-inspection/results'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエスト（DailyInspectionResultCreateRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('clientResultId', 'string', '-', 'PWA端末内で生成した結果 ID。オンライン即時登録でも指定時は冪等登録に使用する'),
          @('masterDownloadedAt', 'datetime', '-', '点検時に利用したPWAパッケージの取得日時'),
          @('packageVersion', 'string', '-', '点検時に利用したPWAパッケージバージョン'),
          @('inspectionTaskId', 'int64', '✓', '資産別日常点検設定の点検タスク ID'),
          @('assetLedgerId', 'int64', '✓', '資産台帳 ID'),
          @('inspectionMenuId', 'int64', '✓', '実施した日常点検メニュー ID'),
          @('dailyTiming', 'string', '✓', '`BEFORE` / `DURING` / `AFTER`'),
          @('inspectedOn', 'date', '✓', '点検実施日'),
          @('inspectedAt', 'datetime', '✓', '端末上の点検完了日時'),
          @('inspectorName', 'string', '✓', '実施者名'),
          @('overallResult', 'string', '✓', '`PASS` / `REPAIR_REQUEST`'),
          @('resultDetails', 'DailyInspectionResultDetailInput[]', '✓', '点検項目ごとの結果'),
          @('remarks', 'string', '-', '備考'),
          @('nextAction', 'string', '-', '`FINISH` / `NEXT_INSPECTION` / `REPAIR_REQUEST`。画面遷移補助情報')
        )
        RequestSubtables = @(
          @{
            Title = 'resultDetails要素（DailyInspectionResultDetailInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('inspectionMenuItemId', 'int64', '✓', '点検項目 ID'),
              @('displayOrder', 'int32', '✓', '実施時点の表示順'),
              @('itemName', 'string', '✓', '項目名スナップショット'),
              @('itemContent', 'string', '✓', '点検内容スナップショット'),
              @('inputType', 'string', '✓', '`SELECT` / `FREE`'),
              @('evaluationType', 'string', '✓', '`PASS_FAIL` / `UNIT` / `FREE`'),
              @('value', 'string', '✓', '入力値。合否は `PASS` / `FAIL`、単位入力は数値文字列、フリー入力は入力文字列'),
              @('displayValue', 'string', '✓', '画面表示値。例: `○`, `×`, `120 ml`'),
              @('unitText', 'string', '-', '単位入力時の単位')
            )
          }
        )
        PermissionLines = $dailyInspectionPermissionLines
        ProcessingLines = @(
          '`inspectionTaskId`、`assetLedgerId`、`inspectionMenuId`、`dailyTiming` の整合を検証する。`inspectionTaskId` は `inspection_type=''日常点検''`、`is_active=true`、`status IS NULL` の日常点検設定行でなければならない',
          '対象資産が作業対象施設内に存在し、`asset_ledgers.status=''ACTIVE''` であることを検証する',
          '対象メニューが日常点検メニューであり、タイミングが一致することを検証する。対象タイミングの `daily_menu_*_id` が `NULL` の場合は `DAILY_TIMING_MENU_REQUIRED` とする',
          '点検項目結果が対象メニュー配下の項目と一致し、必須項目に入力値があることを検証する',
          '`clientResultId` が指定された場合は同期APIと同じ冪等判定を行い、再送であれば既存 `inspectionResultId` を返す',
          '`inspection_results` に点検結果を登録する',
          '対象資産が `lending_devices` に存在する場合、合格は `貸出可`、異常は `使用不可` への更新を試行する。ただし `lending_device_status_transitions` で現在ステータスから遷移先ステータスへの遷移が許可される場合のみ更新する',
          '貸出ステータス遷移が未定義の場合、点検結果登録自体は成功させ、レスポンスの `lendingStatusUpdateStatus` に `SKIPPED_TRANSITION_NOT_ALLOWED` を返す',
          '登録後は `inspectionResultId` と修理申請連携用の `repairRequestSeed` を返す',
          '日常点検実施画面から結果画面を利用する場合は、返却された `inspectionResultId` を用いて点検結果報告データ取得 API を呼び出す'
        )
        ResponseTitle = 'レスポンス（201：DailyInspectionResultCreateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('inspectionResultId', 'int64', '✓', '登録した点検結果 ID'),
          @('assetLedgerId', 'int64', '✓', '資産台帳 ID'),
          @('overallResult', 'string', '✓', '`PASS` / `REPAIR_REQUEST`'),
          @('lendingStatusUpdated', 'boolean', '✓', '貸出管理対象機器のステータスを更新した場合 true'),
          @('newLendingStatus', 'string', '-', '更新後の貸出ステータス'),
          @('lendingStatusUpdateStatus', 'string', '-', '`UPDATED` / `NOT_TARGET` / `SKIPPED_TRANSITION_NOT_ALLOWED`'),
          @('repairRequestSeed', 'RepairRequestSeed', '-', '修理申請へ連携する初期値。`overallResult=REPAIR_REQUEST` の場合に返す')
        )
        ResponseSubtables = @(
          @{
            Title = 'repairRequestSeed要素（RepairRequestSeed）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('inspectionResultId', 'int64', '✓', '点検結果 ID'),
              @('assetLedgerId', 'int64', '✓', '資産台帳 ID'),
              @('qrCode', 'string', '✓', 'QR コード'),
              @('largeClassName', 'string', '-', '大分類'),
              @('mediumClassName', 'string', '-', '中分類'),
              @('itemName', 'string', '-', '品目'),
              @('manufacturerName', 'string', '-', 'メーカー'),
              @('modelName', 'string', '-', '型式'),
              @('symptom', 'string', '-', '修理申請の症状初期値。備考を引き継ぐ'),
              @('inspectionRemarks', 'string', '-', '点検時備考'),
              @('inspectionDate', 'date', '✓', '点検日'),
              @('inspectorName', 'string', '✓', '実施者名')
            )
          }
        )
        StatusRows = @(
          @('201', '登録成功', 'DailyInspectionResultCreateResponse'),
          @('400', '入力不正、必須不足', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `daily_inspection` なし、または対象施設不一致', 'ErrorResponse'),
          @('404', '対象資産、点検タスク、点検メニュー、点検項目が存在しない', 'ErrorResponse'),
          @('409', '資産別日常点検設定が未登録、対象タイミングのメニュー不一致、または対象資産が日常点検対象外', 'ErrorResponse'),
          @('422', '点検結果明細の入力方式・評価方式がメニュー定義と一致しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '点検結果報告データ取得（/inspection-result/reports/{inspectionResultId}）'
        Overview = '点検結果画面表示および報告書出力に必要な日常点検結果、対象資産、点検メニュー、項目結果を取得する。本書では日常点検結果のみを対象とし、定期点検結果の参照は No.28 点検管理タブ API 設計書で扱う。'
        Method = 'GET'
        Path = '/inspection-result/reports/{inspectionResultId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('inspectionResultId', 'path', 'int64', '✓', '点検結果 ID')
        )
        PermissionLines = $dailyInspectionPermissionLines
        ProcessingLines = @(
          '`inspection_results`、`inspection_tasks`、`asset_ledgers` を結合し、対象結果が作業対象施設内の資産に紐づくことを確認する',
          '対象 `inspection_tasks` が `inspection_type=''日常点検''` の日常点検設定行であることを確認する。定期点検結果の場合は本 API の対象外として 403 を返す',
          '`result_details_json` から点検メニュー ID、日常点検タイミング、項目結果を復元する',
          '`application_documents.owner_type=''INSPECTION_RESULT''`、`inspection_result_id=:inspectionResultId`、`document_category<>''PHOTO''`、`deleted_at IS NULL` に一致する点検結果報告書がある場合はメタデータを返す',
          '日常点検結果の `returnTo` は `/inspection-prep` を返す',
          '報告書ファイルをサーバー側で生成済みの場合は `reportDocument` を返す。未生成の場合は画面側または帳票基盤で生成できるデータ一式を返す'
        )
        ResponseTitle = 'レスポンス（200：InspectionResultReportResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('inspectionResultId', 'int64', '✓', '点検結果 ID'),
          @('source', 'string', '✓', '`daily` 固定'),
          @('inspectionType', 'string', '✓', '`日常点検` 固定'),
          @('dailyTiming', 'string', '-', '`BEFORE` / `DURING` / `AFTER`'),
          @('returnTo', 'string', '✓', '`/inspection-prep`'),
          @('asset', 'DailyInspectionAsset', '✓', '対象資産'),
          @('menuName', 'string', '✓', '点検メニュー名'),
          @('inspectorName', 'string', '✓', '実施者名'),
          @('inspectedOn', 'date', '✓', '点検日'),
          @('overallResult', 'string', '✓', '`PASS` / `REPAIR_REQUEST`'),
          @('resultDetails', 'DailyInspectionResultDetail[]', '✓', '点検項目結果'),
          @('remarks', 'string', '-', '備考'),
          @('reportDocument', 'InspectionReportDocument', '-', '保存済み報告書メタデータ')
        )
        ResponseSubtables = @(
          @{
            Title = 'resultDetails要素（DailyInspectionResultDetail）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('inspectionMenuItemId', 'int64', '✓', '点検項目 ID'),
              @('displayOrder', 'int32', '✓', '実施時点の表示順'),
              @('itemName', 'string', '✓', '項目名スナップショット'),
              @('itemContent', 'string', '✓', '点検内容スナップショット'),
              @('inputType', 'string', '✓', '`SELECT` / `FREE`'),
              @('evaluationType', 'string', '✓', '`PASS_FAIL` / `UNIT` / `FREE`'),
              @('value', 'string', '✓', '保存値'),
              @('displayValue', 'string', '✓', '画面表示値'),
              @('unitText', 'string', '-', '単位入力時の単位')
            )
          },
          @{
            Title = 'reportDocument要素（InspectionReportDocument）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('applicationDocumentId', 'int64', '✓', 'ドキュメント ID'),
              @('documentType', 'string', '✓', 'ドキュメント種別'),
              @('title', 'string', '-', 'タイトル'),
              @('fileName', 'string', '✓', 'ファイル名'),
              @('filePath', 'string', '✓', '保存先パス'),
              @('mimeType', 'string', '-', 'MIME タイプ'),
              @('fileSizeBytes', 'int64', '-', 'ファイルサイズ'),
              @('uploadedAt', 'datetime', '-', '登録日時')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'InspectionResultReportResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `daily_inspection` なし、対象施設不一致、または定期点検結果を指定した', 'ErrorResponse'),
          @('404', '点検結果が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '必要権限' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定基準', '説明'); Rows = @(
      @('日常点検準備・実施・結果参照 API 全般', '`daily_inspection`', '通常アカウントは作業対象施設に対する実効 `daily_inspection` を持つこと。共有システム管理者アカウントは作業対象施設が未削除であること', '日常点検担当者が実施する準備、点検、同期、結果参照')
    ) },
    @{ Type = 'Heading2'; Text = '点検管理タブとの責務境界' },
    @{ Type = 'Bullets'; Items = @(
      '点検メニュー登録・更新・削除は No.28 点検管理タブ API 設計書で扱う',
      '資産一覧画面の選択資産から起動する点検管理登録による `inspection_tasks` 作成・更新は No.28 点検管理タブ API 設計書で扱う。日常点検では `inspection_type=''日常点検''`、`is_active=true` の設定行に保持された `daily_menu_before_id` / `daily_menu_during_id` / `daily_menu_after_id` がPWAパッケージの資産別日常点検設定として配信される',
      '日常点検設定行の一覧表示、設定変更、一部解除、設定解除は No.28 点検管理タブ API 設計書で扱う',
      '本 API は No.28 で登録された日常点検メニューと資産別日常点検設定行を参照する',
      '点検予定表 CSV 出力は No.28 の責務であり、本書では扱わない'
    ) },
    @{ Type = 'Heading2'; Text = '日常点検結果登録ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`inspection_results.inspection_task_id` は必須であるため、日常点検結果は `inspection_type=''日常点検''`、`is_active=true` の資産別日常点検設定行に紐づける',
      '端末内PWAパッケージまたはオンラインQR再検証で `canRegisterResult=false` となった場合、画面は点検入力画面へ遷移せず、点検結果登録 API も呼び出さない。点検管理タブで日常点検設定が必要であることを表示する',
      '画面表示の `合格` は `PASS`、`異常あり` は `REPAIR_REQUEST` として保存する',
      '日常点検では `inspection_tasks.status`、`last_inspection_on`、`next_inspection_on` を更新しない。定期点検タスクの状態更新は No.28 の責務とする',
      '貸出管理対象機器の場合、合格時は `貸出可`、異常あり時は `使用不可` への更新を行う。ただし `lending_device_status_transitions` で許可されない遷移は実行せず、点検結果登録は成功させた上でレスポンスに警告状態を返す'
    ) },
    @{ Type = 'Heading2'; Text = 'オフライン同期ルール' },
    @{ Type = 'Bullets'; Items = @(
      '同期 API は結果単位で成否を返し、部分成功を許可する',
      '同一 `clientResultId` の再送を検出できた場合は二重登録せず、既存 `inspectionResultId` を返す',
      '点検開始後のQR照合と点検メニュー解決は端末内PWAパッケージを用いて行う。オンラインQR資産再検証APIは補助用途であり、オフライン点検の必須経路にしない',
      '同期時点でメニューまたは点検項目が無効化されていても、端末がダウンロード時に取得した `inspectionMenuId` と項目 ID が存在する場合は結果登録を許可し、実施時点のスナップショットを `result_details_json` に保持する',
      '同期時点で日常点検設定行が設定解除済みでも、ダウンロード時点でPWAパッケージに含まれ、実施日時が解除日時以前であれば実施済み結果として登録を許可する',
      '同期時点で資産が他施設へ移動済み、削除済み、または作業対象施設外になった場合は登録を拒否する'
    ) },
    @{ Type = 'Heading2'; Text = '設計判断・制約' },
    @{ Type = 'Bullets'; Items = @(
      '現行 DB にはオフライン同期用の専用履歴テーブルおよび `clientResultId` カラムがないため、本版では `result_details_json.clientResultId` に保持し、アプリケーションロックで同一端末・同一利用者・同一 `clientResultId` の同時登録を直列化する。DB 一意制約による完全な冪等保証は専用カラム追加時の拡張事項とし、その場合は `client_device_id` / `client_result_id` に一意制約を設ける',
      '`inspection_type=''日常点検''` は点検予定日・ステータス遷移を持たない資産別日常点検設定行として扱う。日常点検結果登録時は `inspection_tasks.status`、`last_inspection_on`、`next_inspection_on` を更新せず、履歴は `inspection_results` に保存する',
      'PWAの端末内キャッシュ、未送信キュー、Service Worker、IndexedDBはクライアント実装責務であり、サーバーDBのテーブルとしては定義しない'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '説明', '発生条件'); Rows = @(
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効', 'Bearer トークン未付与、期限切れ、署名不正'),
      @('AUTH_403_DAILY_INSPECTION_DENIED', '403', '通常アカウントで作業対象施設に対する実効 `daily_inspection` がない、または対象施設不一致', '通常アカウントの施設割当なし、施設/ユーザー機能設定 OFF、対象資産が作業対象施設外'),
      @('DAILY_INSPECTION_400_INVALID_INPUT', '400', '入力形式、必須項目、日付形式が不正', '必須不足、列挙値外、日付/日時形式不正、`results` 空'),
      @('DAILY_INSPECTION_404_ASSET_NOT_FOUND', '404', 'QR コードに一致する資産が存在しない', '`qr_codes.qr_identifier` に一致する有効QRがない'),
      @('DAILY_INSPECTION_404_TASK_NOT_FOUND', '404', '点検タスクが存在しない', '指定 `inspectionTaskId` が存在しない、または作業対象施設外'),
      @('DAILY_INSPECTION_404_MENU_NOT_FOUND', '404', '日常点検メニューが存在しない', '指定 `inspectionMenuId` が存在しない、または `menu_type<>DAILY`'),
      @('DAILY_INSPECTION_404_RESULT_NOT_FOUND', '404', '点検結果が存在しない', '指定 `inspectionResultId` が存在しない、または作業対象施設外'),
      @('NO_DAILY_MENU', '200', '資産分類に一致する日常点検メニュー候補が存在しない', 'オンラインQR再検証で、資産別設定がなく、かつ大分類・中分類・品目に一致する有効な日常点検メニュー候補もない'),
      @('DAILY_INSPECTION_ASSET_NOT_TARGET', '409', '日常点検対象外の資産', '`asset_ledgers.status` が `ACTIVE` ではない資産に対して結果登録しようとした'),
      @('DAILY_INSPECTION_TASK_REQUIRED', '409', '日常点検結果登録に必要な資産別日常点検設定が未登録', '端末内PWAパッケージまたはオンラインQR再検証で対象タイミングの `inspectionTaskId` を解決できない'),
      @('DAILY_TIMING_MENU_REQUIRED', '409', '対象タイミングの日常点検メニューが未設定', '資産別日常点検設定行は存在するが、指定 `dailyTiming` に対応する `daily_menu_*_id` が `NULL`'),
      @('DAILY_INSPECTION_MENU_MISMATCH', '409', '指定タイミングのメニューが資産別日常点検設定と一致しない', '指定 `dailyTiming` と `inspection_tasks.daily_menu_*_id` が一致しない'),
      @('DAILY_INSPECTION_422_RESULT_DETAIL_INVALID', '422', '点検結果明細の項目、入力方式、評価方式がメニュー定義と一致しない', '点検項目 ID 不一致、入力方式不一致、必須入力不足'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー', '想定外例外')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = 'マスタ保守方針' },
    @{ Type = 'Bullets'; Items = @(
      '日常点検メニューの正本は `inspection_menus` と `inspection_menu_items` とし、登録・編集は点検管理タブ側 API で行う。資産へ適用できるメニューは対象資産の大分類・中分類・品目と一致する有効メニューに限定する',
      '資産別日常点検設定の正本は `inspection_tasks.inspection_type=''日常点検''`、`is_active=true` の1資産1有効行とし、`daily_menu_before_id` / `daily_menu_during_id` / `daily_menu_after_id` を保持する。作成・変更・解除は点検管理タブ側 API で行い、同分類の全資産へ自動展開しない',
      '日常点検実施画面は、オンライン状態で事前取得したPWAパッケージを用いてQR照合とメニュー解決を行う。オフライン実施ではダウンロード時点のメニューと項目スナップショットに基づいて記録する'
    ) },
    @{ Type = 'Heading2'; Text = '今後拡張時の留意点' },
    @{ Type = 'Bullets'; Items = @(
      'オフライン同期の冪等性を強化する場合は、`inspection_results` に `client_result_id` と `client_device_id` を追加し、一意制約を設定する',
      '`inspection_type=''日常点検''` にステータスや予定日を追加する場合は、点検管理タブの一覧表示、PWA配信対象、ステータス定義・遷移定義に影響するため No.28 と同時に見直す',
      '点検結果報告書をサーバー生成する場合は、`application_documents.owner_type=''INSPECTION_RESULT''` として保存し、取得 API の `reportDocument` に返却する',
      '修理申請 API 実装時は、日常点検結果登録 API が返す `inspectionResultId` を `repair_request_details.inspection_result_id` へ引き継ぐ'
    ) }
  )
}
