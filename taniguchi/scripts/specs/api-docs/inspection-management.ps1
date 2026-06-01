$permissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `inspection_management` 判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `inspection_management` が有効であること'
)

$workFacilityProcessingLine = 'Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。'
$auth401StatusRow = @('401', '未認証', 'ErrorResponse')
$auth403StatusRow = @('403', '通常アカウントで作業対象施設に対する実効 `inspection_management` なし', 'ErrorResponse')
$workFacility404StatusRow = @('404', '作業対象施設が存在しない、または削除済み', 'ErrorResponse')

$spec = @{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_点検管理.docx'
  ScreenLabel = '点検管理'
  CoverDateText = '2026年5月18日'
  RevisionDateText = '2026/5/18'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、点検管理画面（`/quotation-data-box/inspection-requests`）、定期点検画面（`/periodic-inspection`）、メーカー保守 点検結果登録画面（`/maker-maintenance-result`）で利用する API の設計内容を整理し、画面要件、DB設計、日常点検APIとの責務境界を一致させることを目的とする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      '点検管理の定期点検タスクおよび日常点検設定行の一覧取得 I/F',
      '点検メニューの登録・更新・無効化 I/F',
      '資産一覧画面の選択資産から起動する点検管理登録 I/F',
      '日常点検設定行の変更・一部解除・設定解除 I/F',
      '定期点検の実施開始、点検結果登録、日程調整、スキップ、予定表CSV出力 I/F',
      'メーカー保守結果登録と添付ファイルメタデータ保存 I/F',
      'No.4 日常点検APIとの責務境界'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '点検管理は、点検メニューを作成し、資産単位に定期点検タスクまたは日常点検設定行を紐づけ、定期点検の進行管理と日常点検設定の管理CRUDを一元的に扱う機能である。日常点検の実施自体はメイン画面から `/inspection-prep`、`/daily-inspection` へ進む No.4 日常点検APIの責務とし、本書ではその前提となるメニューと資産別設定行を管理する。' },
    @{ Type = 'Paragraph'; Text = '点検管理登録では、対象資産の大分類・中分類・品目と一致する点検メニューのみ適用できる。同じ分類の資産が複数存在しても自動展開せず、選択資産単位で `inspection_tasks` を作成または更新する。定期点検は1資産に複数メニューを紐づけられるが、日常点検は1資産1有効行として使用前・使用中・使用後メニューを保持する。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('点検メニュー', '`inspection_menus` と `inspection_menu_items` に保持する点検項目テンプレート。`menu_type=PERIODIC` または `DAILY` で区分する'),
      @('定期点検タスク', '`inspection_tasks.inspection_type` が `院内定期点検`、`メーカー保守`、`院内スポット点検` の行。予定日、ステータス、前回実施日を持つ'),
      @('日常点検設定行', '`inspection_tasks.inspection_type=''日常点検''` の1資産1有効行。`daily_menu_before_id` / `daily_menu_during_id` / `daily_menu_after_id` に使用前・使用中・使用後メニューを保持する'),
      @('点検種別表示ラベル', '画面表示の `院内点検` / `メーカー点検` / `スポット点検` / `日常点検`。API保存値は `院内定期点検` / `メーカー保守` / `院内スポット点検` / `日常点検` へ変換する'),
      @('点検ステータス', '定期点検系のみ `inspection_task_status_definitions` / `inspection_task_status_transitions` で管理する状態。日常点検行はステータスを持たない')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面パス', '利用目的'); Rows = @(
      @('点検管理画面', '/quotation-data-box/inspection-requests', '点検メニュー、定期点検タスク、日常点検設定行、日程調整、スキップ、予定表CSV出力を管理する'),
      @('定期点検画面', '/periodic-inspection', '点検管理から選択した定期点検タスクに対し、QR照合、点検開始、点検結果登録を行う'),
      @('メーカー保守 点検結果登録画面', '/maker-maintenance-result', 'メーカー保守タスクの点検結果、費用内訳、点検報告書添付を登録する')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'API の位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、点検管理の一覧・メニュー管理・タスク管理・定期点検実施・メーカー保守結果登録を提供する。No.4 日常点検APIはPWAのマスタダウンロード、QR起点の日常点検実施、未送信同期を担当し、本書は日常点検メニュー登録と資産別日常点検設定行の正本管理を担当する。' },
    @{ Type = 'Heading2'; Text = '画面とAPIの関係' },
    @{ Type = 'Table'; Headers = @('画面操作', 'API', '補足'); Rows = @(
      @('点検管理初期表示/フィルター変更', '`GET /quotation-data-box/inspection-requests/tasks`', '定期点検タスクと日常点検設定行を同じ一覧レスポンスで返す'),
      @('点検予定表の出力', '`GET /quotation-data-box/inspection-requests/schedule-export`', '点検管理一覧と同じ正本フィルターを適用できる。定期点検系タスクのみCSV出力対象とし、日常点検行は除外する'),
      @('点検メニュー登録モーダル表示/候補取得', '`GET /quotation-data-box/inspection-requests/menus`', 'メニュー一覧または資産分類に一致する候補を取得する'),
      @('点検メニュー登録', '`POST /quotation-data-box/inspection-requests/menus`', 'メニュー本体と点検項目を同時に登録する'),
      @('点検メニュー更新', '`PUT /quotation-data-box/inspection-requests/menus/{menuId}`', '未使用メニューの内容を更新する。使用中メニューは履歴整合のため更新制限する'),
      @('点検メニュー削除', '`DELETE /quotation-data-box/inspection-requests/menus/{menuId}`', '`inspection_menus.is_active=false` による無効化を行う'),
      @('点検管理登録', '`POST /quotation-data-box/inspection-requests/tasks`', '選択資産に定期点検タスクまたは日常点検設定行を作成/更新する'),
      @('設定変更', '`PUT /quotation-data-box/inspection-requests/tasks/{inspectionTaskId}`', '定期点検タスクまたは日常点検設定行を更新する'),
      @('設定解除', '`DELETE /quotation-data-box/inspection-requests/tasks/{inspectionTaskId}`', '`inspection_tasks.is_active=false`、`deleted_at` 設定で論理解除する'),
      @('定期点検のQR照合後開始', '`POST /quotation-data-box/inspection-requests/tasks/{inspectionTaskId}/start`', '`START_INSPECTION` 遷移で `点検実施中` へ更新する'),
      @('日程調整', '`POST /quotation-data-box/inspection-requests/tasks/{inspectionTaskId}/schedule`', 'メーカー保守タスクの日程を更新し `点検日調整` から予定系ステータスへ戻す'),
      @('スキップ', '`POST /quotation-data-box/inspection-requests/tasks/{inspectionTaskId}/skip`', '次回予定日を再計算し、再計算後の予定系ステータスへ更新する'),
      @('定期点検完了', '`POST /quotation-data-box/inspection-requests/tasks/{inspectionTaskId}/result`', '点検結果を登録し、前回点検日・次回予定日・ステータスを更新する'),
      @('メーカー保守結果登録画面表示', '`GET /maker-maintenance-result/tasks/{maintenanceTaskId}`', '対象タスク、資産、添付候補、費用入力初期値を取得する'),
      @('メーカー保守結果登録', '`POST /maker-maintenance-result/tasks/{maintenanceTaskId}/result`', 'メーカー保守結果、費用、添付ファイルメタデータを保存し、対象タスクを論理解除する')
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル名', '利用種別', '用途'); Rows = @(
      @('`asset_ledgers`', 'READ', '点検対象資産、分類一致、施設スコープ、QR表示情報の取得'),
      @('`qr_codes`', 'READ', '資産に紐づくQR識別子、定期点検開始時のQR照合'),
      @('`inspection_menus`', 'READ / CREATE / UPDATE', '点検メニュー本体、メニュー種別、日常点検タイミング、周期、分類条件の管理'),
      @('`inspection_menu_items`', 'READ / CREATE / UPDATE / DELETE', '点検項目、入力方式、評価方式、表示順の管理'),
      @('`inspection_tasks`', 'READ / CREATE / UPDATE', '定期点検タスクと日常点検設定行の正本。解除時は `is_active=false` と `deleted_at` を設定する'),
      @('`inspection_task_status_definitions`', 'READ', '定期点検系ステータスの許容値、初期状態、終端状態確認'),
      @('`inspection_task_status_transitions`', 'READ', '点検開始、完了、スキップ、日程調整の遷移可否確認'),
      @('`inspection_results`', 'READ / CREATE', '定期点検結果、メーカー保守結果、費用内訳、結果明細JSONの保存'),
      @('`application_documents`', 'CREATE / READ', 'メーカー保守点検報告書や添付資料のファイルメタデータ保存'),
      @('`lending_devices`', 'READ', '貸出状況フィルターおよび一覧表示'),
      @('`maintenance_contracts`', 'READ', 'メーカー保守タスクの契約情報参照'),
      @('`maintenance_contract_assets`', 'READ', '保守契約管理タブから作成された点検条件の由来参照'),
      @('`vendors`', 'READ', '点検委託業者・メーカー保守業者の表示'),
      @('`users`', 'READ', '点検開始者、結果登録者、共有システム管理者アカウント判定'),
      @('`facilities`', 'READ', 'Bearer トークン上の作業対象施設の存在確認、未削除確認'),
      @('`user_facility_assignments`', 'READ', '通常アカウントにおける作業対象施設への有効担当施設割当確認'),
      @('`facility_feature_settings`', 'READ', '通常アカウントにおける施設提供機能 `inspection_management` の有効化確認'),
      @('`user_facility_feature_settings`', 'READ', '通常アカウントにおけるユーザー施設別 `inspection_management` の有効化確認')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API 共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON。CSV出力APIのみ `text/csv; charset=UTF-8` を返す',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-05-18T00:00:00+09:00`）',
      '日付形式: `YYYY-MM-DD`',
      '認証済みAPIは Bearer トークンを `Authorization` ヘッダーに付与する',
      '各APIは Bearer トークン上の作業対象施設を基準に自施設データのみ処理する'
    ) },
    @{ Type = 'Heading2'; Text = '認証・認可' },
    @{ Type = 'Paragraph'; Text = '本API群で使用する `feature_code` は `inspection_management` とする。画面表示用の `/auth/context` はUX用キャッシュであり、各業務APIでも同条件を再判定する。通常アカウントでは作業対象施設への有効担当施設割当、施設提供機能、ユーザー施設別機能設定を確認する。共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）では、作業対象施設が未削除であることを確認できれば、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `inspection_management` 判定をバイパスする。' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('点検管理API全般', '`inspection_management`', '`users`, `facilities`, `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '通常アカウントは担当施設割当と実効 `inspection_management` を確認する。共有システム管理者アカウントは作業対象施設が未削除であれば通常権限判定をバイパスする'),
      @('日常点検PWA本体', '`daily_inspection`', '`users`, `facilities`, `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', 'No.4 日常点検APIで扱う。点検管理では日常点検設定行の管理のみ `inspection_management` で扱う。共有システム管理者アカウントの例外方針はNo.4側の業務APIで再判定する')
    ) },
    @{ Type = 'Heading2'; Text = '作業対象施設ベースの認可例外' },
    @{ Type = 'Bullets'; Items = @(
      '各APIは Bearer トークン上の作業対象施設が存在し、未削除であることを確認する',
      '通常アカウントでは、作業対象施設に対する有効担当施設割当と実効 `inspection_management` を都度再判定する',
      '共有システム管理者アカウントでは、作業対象施設が未削除であれば通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による認可判定をバイパスする',
      '対象資産・点検メニュー・点検タスク・点検結果・メーカー保守タスクが作業対象施設に属すること、点検種別、メニュー分類一致、有効行、削除/解除済み除外、定期点検ステータス遷移順序、QR照合、日常点検行の操作制限、メーカー保守結果登録条件といった業務制約は共有システム管理者でもバイパスしない',
      '通常アカウントで作業対象施設に対して必要な実効 `inspection_management` がない場合は403を返す',
      '作業対象施設が存在しない、または削除済みの場合は404を返す'
    ) },
    @{ Type = 'Heading2'; Text = '点検種別・ステータス共通ルール' },
    @{ Type = 'Bullets'; Items = @(
      '画面表示ラベル `院内点検` は DB/API保存値 `院内定期点検`、`メーカー点検` は `メーカー保守`、`スポット点検` は `院内スポット点検`、`日常点検` は `日常点検` へ変換する',
      '定期点検系タスクは `inspection_tasks.periodic_menu_id`、`status`、`last_inspection_on`、`next_inspection_on` を用いる',
      '日常点検設定行は `inspection_type=''日常点検''`、`status=NULL`、`periodic_menu_id=NULL`、`last_inspection_on=NULL`、`next_inspection_on=NULL` とし、一覧では `-` 表示用に返す',
      '日常点検設定行の使用前・使用中・使用後メニュー更新では、JSONフィールド未指定は既存値維持、明示的な null は該当タイミングの解除として扱う',
      '完了回数は現行DBに保持カラムがないため、対象 `inspection_task_id` または同一資産・同一メニューの `inspection_results` 件数から画面表示時に算出する。`inspection_tasks` へ完了回数を保存しない',
      '日常点検設定行の設定解除は `is_active=false`、`deleted_at=現在日時` とし、過去の `inspection_results` は削除しない',
      '定期点検系ステータス更新は `inspection_task_status_transitions` に存在する遷移のみ許可する。日常点検はステータス遷移対象外とする'
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや競合理由の補足')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API 一覧' },
    @{ Type = 'Table'; Headers = @('No', 'API名', 'Method', 'Path', '用途', '権限'); Rows = @(
      @('1', '点検タスク/日常点検設定一覧取得', 'GET', '/quotation-data-box/inspection-requests/tasks', '点検管理一覧を取得する', '`inspection_management`'),
      @('2', '点検予定表CSV出力', 'GET', '/quotation-data-box/inspection-requests/schedule-export', '定期点検予定表をCSVで出力する', '`inspection_management`'),
      @('3', '点検メニュー一覧取得', 'GET', '/quotation-data-box/inspection-requests/menus', '点検メニュー一覧または資産分類に一致する候補を取得する', '`inspection_management`'),
      @('4', '点検メニュー登録', 'POST', '/quotation-data-box/inspection-requests/menus', '点検メニューと項目を登録する', '`inspection_management`'),
      @('5', '点検メニュー更新', 'PUT', '/quotation-data-box/inspection-requests/menus/{menuId}', '点検メニューと項目を更新する', '`inspection_management`'),
      @('6', '点検メニュー削除', 'DELETE', '/quotation-data-box/inspection-requests/menus/{menuId}', '点検メニューを無効化する', '`inspection_management`'),
      @('7', '点検管理登録', 'POST', '/quotation-data-box/inspection-requests/tasks', '選択資産に点検メニューを紐づける', '`inspection_management`'),
      @('8', '点検タスク/日常点検設定更新', 'PUT', '/quotation-data-box/inspection-requests/tasks/{inspectionTaskId}', '定期点検タスクまたは日常点検設定行を更新する', '`inspection_management`'),
      @('9', '点検タスク/日常点検設定解除', 'DELETE', '/quotation-data-box/inspection-requests/tasks/{inspectionTaskId}', '点検タスクまたは日常点検設定行を論理解除する', '`inspection_management`'),
      @('10', '定期点検開始', 'POST', '/quotation-data-box/inspection-requests/tasks/{inspectionTaskId}/start', 'QR照合後に定期点検タスクを点検実施中へ更新する', '`inspection_management`'),
      @('11', '点検日程調整', 'POST', '/quotation-data-box/inspection-requests/tasks/{inspectionTaskId}/schedule', 'メーカー保守の日程を調整する', '`inspection_management`'),
      @('12', '点検スキップ', 'POST', '/quotation-data-box/inspection-requests/tasks/{inspectionTaskId}/skip', '定期点検タスクの次回予定日を再計算する', '`inspection_management`'),
      @('13', '定期点検結果登録', 'POST', '/quotation-data-box/inspection-requests/tasks/{inspectionTaskId}/result', '定期点検結果を登録しタスク状態を更新する', '`inspection_management`'),
      @('14', 'メーカー保守結果登録詳細取得', 'GET', '/maker-maintenance-result/tasks/{maintenanceTaskId}', 'メーカー保守結果登録画面の詳細を取得する', '`inspection_management`'),
      @('15', 'メーカー保守結果登録', 'POST', '/maker-maintenance-result/tasks/{maintenanceTaskId}/result', 'メーカー保守結果、費用、添付を登録する', '`inspection_management`')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 点検管理機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '点検タスク/日常点検設定一覧取得（/quotation-data-box/inspection-requests/tasks）'
        Overview = '点検管理の一覧に表示する定期点検タスクおよび日常点検設定行を取得する。'
        Method = 'GET'
        Path = '/quotation-data-box/inspection-requests/tasks'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('inspectionDateFilter', 'query', 'string', '-', '`ALL` / `OVERDUE` / `CURRENT_MONTH` / `ONE_MONTH_BEFORE`。日常点検行は `ALL` の場合のみ返す'),
          @('inspectionType', 'query', 'string', '-', '`IN_HOUSE` / `MAKER` / `SPOT` / `DAILY`。DB保存値へ変換して検索する'),
          @('inspectionGroupName', 'query', 'string', '-', '点検グループ名の部分一致'),
          @('lendingStatusFilter', 'query', 'string', '-', '`LENT` / `NOT_LENT`'),
          @('page', 'query', 'int32', '-', 'ページ番号。未指定時 1'),
          @('pageSize', 'query', 'int32', '-', '1ページ件数。未指定時 50')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '`inspection_tasks` を `asset_ledgers`、`inspection_menus`、`qr_codes`、`lending_devices` と結合し、作業対象施設の `asset_ledgers.facility_id` に限定する',
          '`inspection_tasks.is_active=true` かつ `deleted_at IS NULL` の行を対象とする',
          '定期点検系は `periodic_menu_id`、`status`、`next_inspection_on`、`last_inspection_on` を返す',
          '日常点検行は `inspection_type=''日常点検''` の行として返し、点検周期、前回点検日、次回点検予定、ステータスは null として返す',
          '点検日フィルターは定期点検系の `next_inspection_on` と `status` にのみ適用する。日常点検行は `inspectionDateFilter=ALL` または未指定の場合のみ返す',
          '貸出状況フィルターは `lending_devices.status` を参照し、貸出中は `貸出中` / `使用中` / `使用済` を対象とする',
          '既定並び順は、日常点検行を定期点検行の後、定期点検系は `next_inspection_on ASC NULLS LAST`、`inspection_task_id ASC` とする'
        )
        ResponseTitle = 'レスポンス（200：InspectionTaskListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('items', 'InspectionTaskListItem[]', '✓', '一覧行'),
          @('totalCount', 'int32', '✓', '総件数'),
          @('page', 'int32', '✓', 'ページ番号'),
          @('pageSize', 'int32', '✓', '1ページ件数')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（InspectionTaskListItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('inspectionTaskId', 'int64', '✓', '点検タスクID'),
              @('assetLedgerId', 'int64', '✓', '資産台帳ID'),
              @('qrCode', 'string', '-', '代表QR識別子'),
              @('departmentName', 'string', '-', '部署'),
              @('sectionName', 'string', '-', '部門または設置部署'),
              @('itemName', 'string', '-', '品目'),
              @('manufacturerName', 'string', '-', 'メーカー'),
              @('modelName', 'string', '-', '型式'),
              @('lendingStatus', 'string', '-', '貸出管理状態'),
              @('inspectionType', 'string', '✓', 'DB保存値。`院内定期点検` / `メーカー保守` / `院内スポット点検` / `日常点検`'),
              @('inspectionTypeLabel', 'string', '✓', '画面表示値。`院内点検` / `メーカー点検` / `スポット点検` / `日常点検`'),
              @('inspectionGroupName', 'string', '-', '点検グループ名。保守契約由来タスクは `maintenance_contract_assets.inspection_group_name` から返す'),
              @('periodicMenuId', 'int64', '-', '定期点検メニューID。日常点検行は null'),
              @('periodicMenuName', 'string', '-', '定期点検メニュー名'),
              @('dailyBeforeMenuId', 'int64', '-', '使用前日常点検メニューID。設定変更モーダルの初期値に使用する'),
              @('dailyBeforeMenuName', 'string', '-', '使用前日常点検メニュー名'),
              @('dailyDuringMenuId', 'int64', '-', '使用中日常点検メニューID。設定変更モーダルの初期値に使用する'),
              @('dailyDuringMenuName', 'string', '-', '使用中日常点検メニュー名'),
              @('dailyAfterMenuId', 'int64', '-', '使用後日常点検メニューID。設定変更モーダルの初期値に使用する'),
              @('dailyAfterMenuName', 'string', '-', '使用後日常点検メニュー名'),
              @('cycleMonths', 'int32', '-', '点検周期。日常点検行は null'),
              @('lastInspectionOn', 'date', '-', '前回点検日。日常点検行は null'),
              @('nextInspectionOn', 'date', '-', '次回点検予定日。日常点検行は null'),
              @('status', 'string', '-', '定期点検系ステータス。日常点検行は null'),
              @('availableActions', 'string[]', '✓', '`START` / `SCHEDULE` / `MAKER_RESULT` / `SKIP` / `EDIT` / `RELEASE` / `KARTE`')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'InspectionTaskListResponse'),
          @('400', '検索条件の列挙値またはページ指定が不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `inspection_management` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '点検予定表CSV出力（/quotation-data-box/inspection-requests/schedule-export）'
        Overview = '点検管理の点検予定表をCSVで出力する。日常点検行は予定日を持たないため出力対象外とする。'
        Method = 'GET'
        Path = '/quotation-data-box/inspection-requests/schedule-export'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('inspectionDateFilter', 'query', 'string', '-', '`ALL` / `OVERDUE` / `CURRENT_MONTH` / `ONE_MONTH_BEFORE`。`ALL` の場合も日常点検行は出力しない'),
          @('from', 'query', 'date', '-', '出力対象開始日。指定時は `inspectionDateFilter` より優先'),
          @('to', 'query', 'date', '-', '出力対象終了日。指定時は `inspectionDateFilter` より優先'),
          @('inspectionType', 'query', 'string', '-', '`IN_HOUSE` / `MAKER` / `SPOT`。`DAILY` は指定不可'),
          @('inspectionGroupName', 'query', 'string', '-', '点検グループ名の部分一致'),
          @('lendingStatusFilter', 'query', 'string', '-', '`LENT` / `NOT_LENT`')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '`inspection_tasks.inspection_type<>''日常点検''`、`is_active=true`、`deleted_at IS NULL`、`next_inspection_on IS NOT NULL` の行を対象とする',
          '作業対象施設外の資産は出力しない',
          '指定期間がある場合は `next_inspection_on` で絞り込む。期間指定がない場合は点検管理一覧と同じ `inspectionDateFilter` を適用する',
          '貸出状況フィルターは `lending_devices.status` を参照し、貸出中は `貸出中` / `使用中` / `使用済` を対象とする',
          'CSV列は、QRコード、品目、メーカー、型式、点検種別、点検メニュー、点検周期、前回点検日、次回点検予定、ステータス、点検グループ名を含める',
          'レスポンスヘッダーに `Content-Disposition: attachment; filename=inspection_schedule_YYYYMMDD.csv` を設定する'
        )
        ResponseTitle = 'レスポンス（200：text/csv）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('body', 'text/csv', '✓', '点検予定表CSV。UTF-8 BOM付き')
        )
        StatusRows = @(
          @('200', 'CSV出力成功', 'text/csv'),
          @('400', '`inspectionType=DAILY` 指定など入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `inspection_management` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '点検メニュー一覧取得（/quotation-data-box/inspection-requests/menus）'
        Overview = '点検メニューの一覧を取得する。資産ID指定時は対象資産の大分類・中分類・品目に一致するメニュー候補として返す。'
        Method = 'GET'
        Path = '/quotation-data-box/inspection-requests/menus'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('menuType', 'query', 'string', '-', '`PERIODIC` / `DAILY`'),
          @('dailyTiming', 'query', 'string', '-', '`BEFORE` / `DURING` / `AFTER`'),
          @('assetLedgerId', 'query', 'int64', '-', '指定時は対象資産の分類に一致するメニューだけ返す'),
          @('keyword', 'query', 'string', '-', 'メニュー名部分一致'),
          @('isActive', 'query', 'boolean', '-', '未指定時 true')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '`inspection_menus` と `inspection_menu_items` を取得する',
          '`assetLedgerId` 指定時は対象資産が作業対象施設内に存在することを確認し、`large_class_name` / `medium_class_name` / `item_name` が資産と一致するメニューに限定する',
          '`menuType=DAILY` の場合は `daily_timing` を返す。`menuType=PERIODIC` の場合は `cycle_months` を返す',
          '点検項目は `display_order ASC` で返す'
        )
        ResponseTitle = 'レスポンス（200：InspectionMenuListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('menus', 'InspectionMenu[]', '✓', '点検メニュー一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'menus要素（InspectionMenu）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('inspectionMenuId', 'int64', '✓', '点検メニューID'),
              @('menuName', 'string', '✓', 'メニュー名'),
              @('menuType', 'string', '✓', '`PERIODIC` / `DAILY`'),
              @('dailyTiming', 'string', '-', '`BEFORE` / `DURING` / `AFTER`。日常点検のみ'),
              @('cycleMonths', 'int32', '-', '周期（月）。定期点検のみ'),
              @('largeClassName', 'string', '-', '大分類'),
              @('mediumClassName', 'string', '-', '中分類'),
              @('itemName', 'string', '-', '品目'),
              @('isActive', 'boolean', '✓', '有効フラグ'),
              @('items', 'InspectionMenuItem[]', '✓', '点検項目')
            )
          },
          @{
            Title = 'items要素（InspectionMenuItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('inspectionMenuItemId', 'int64', '✓', '点検項目ID'),
              @('displayOrder', 'int32', '✓', '表示順'),
              @('itemName', 'string', '✓', '項目名'),
              @('itemContent', 'string', '✓', '点検内容'),
              @('inputType', 'string', '✓', '`SELECT` / `FREE`'),
              @('evaluationType', 'string', '✓', '`PASS_FAIL` / `UNIT` / `FREE`'),
              @('unitText', 'string', '-', '単位'),
              @('selectOptions', 'string[]', '-', '選択肢')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'InspectionMenuListResponse'),
          @('400', '検索条件の列挙値が不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `inspection_management` なし', 'ErrorResponse'),
          @('404', '指定 `assetLedgerId` が存在しない、または作業対象施設外', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '点検メニュー登録（/quotation-data-box/inspection-requests/menus）'
        Overview = '点検メニューと点検項目を登録する。'
        Method = 'POST'
        Path = '/quotation-data-box/inspection-requests/menus'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエスト（InspectionMenuCreateRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('menuName', 'string', '✓', 'メニュー名'),
          @('menuType', 'string', '✓', '`PERIODIC` / `DAILY`'),
          @('dailyTiming', 'string', '-', '`BEFORE` / `DURING` / `AFTER`。日常点検では必須'),
          @('cycleMonths', 'int32', '-', '周期（月）。定期点検では必須'),
          @('largeClassName', 'string', '✓', '大分類'),
          @('mediumClassName', 'string', '✓', '中分類'),
          @('itemName', 'string', '✓', '品目'),
          @('items', 'InspectionMenuItemInput[]', '✓', '点検項目。1件以上')
        )
        RequestSubtables = @(
          @{
            Title = 'items要素（InspectionMenuItemInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('displayOrder', 'int32', '✓', '表示順'),
              @('itemName', 'string', '✓', '項目名'),
              @('itemContent', 'string', '✓', '点検内容'),
              @('inputType', 'string', '✓', '`SELECT` / `FREE`'),
              @('evaluationType', 'string', '✓', '`PASS_FAIL` / `UNIT` / `FREE`'),
              @('unitText', 'string', '-', '単位入力時の単位'),
              @('selectOptions', 'string[]', '-', '選択式の場合の候補')
            )
          }
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '`menuType=DAILY` の場合は `dailyTiming` 必須、`cycleMonths` は null とする',
          '`menuType=PERIODIC` の場合は `cycleMonths` 必須、`dailyTiming` は null とする',
          '同一 `menuType`、`dailyTiming`、大分類、中分類、品目、メニュー名の有効メニューが既に存在する場合は 409 とする',
          '`inspection_menus` を `is_active=true` で作成し、`inspection_menu_items` を `display_order ASC` の順で作成する',
          '点検項目は1件以上必須とし、`displayOrder` の重複を禁止する'
        )
        ResponseTitle = 'レスポンス（201：InspectionMenuResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('menu', 'InspectionMenu', '✓', '登録した点検メニュー')
        )
        StatusRows = @(
          @('201', '登録成功', 'InspectionMenuResponse'),
          @('400', '入力不正、必須不足、点検項目なし', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `inspection_management` なし', 'ErrorResponse'),
          @('409', '有効な同一メニューが既に存在する', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '点検メニュー更新（/quotation-data-box/inspection-requests/menus/{menuId}）'
        Overview = '未使用の点検メニューを更新する。履歴整合とオフライン同期保護のため、有効タスクまたは点検結果で利用済みのメニューは更新不可とし、旧メニューを無効化して新メニューを作成する運用とする。'
        Method = 'PUT'
        Path = '/quotation-data-box/inspection-requests/menus/{menuId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'Path Parameter'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('menuId', 'path', 'int64', '✓', '点検メニューID')
        )
        RequestTitle = 'リクエスト（InspectionMenuUpdateRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('menuName', 'string', '✓', 'メニュー名'),
          @('dailyTiming', 'string', '-', '日常点検の場合のタイミング'),
          @('cycleMonths', 'int32', '-', '定期点検の場合の周期（月）'),
          @('largeClassName', 'string', '✓', '大分類'),
          @('mediumClassName', 'string', '✓', '中分類'),
          @('itemName', 'string', '✓', '品目'),
          @('items', 'InspectionMenuItemInput[]', '✓', '点検項目。1件以上')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象 `inspection_menus` が存在し `is_active=true` であることを確認する',
          'メニュー種別 `menu_type` は更新不可とし、日常点検メニューでは `dailyTiming`、定期点検メニューでは `cycleMonths` だけを対象種別に応じて更新する',
          '対象メニューを参照する有効な `inspection_tasks`、または `inspection_results.result_details_json.inspectionMenuId` が存在する場合は 409 とする',
          '未使用の場合のみ `inspection_menus` を更新し、既存 `inspection_menu_items` を要求内容に合わせて更新/差し替えする',
          '使用中メニューの項目削除は、PWAダウンロード済み端末の同期結果で項目IDが解決できなくなるため禁止する'
        )
        ResponseTitle = 'レスポンス（200：InspectionMenuResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('menu', 'InspectionMenu', '✓', '更新後の点検メニュー')
        )
        StatusRows = @(
          @('200', '更新成功', 'InspectionMenuResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `inspection_management` なし', 'ErrorResponse'),
          @('404', '対象メニューが存在しない', 'ErrorResponse'),
          @('409', '使用中または結果履歴ありのため更新不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '点検メニュー削除（/quotation-data-box/inspection-requests/menus/{menuId}）'
        Overview = '点検メニューを無効化する。物理削除は行わない。'
        Method = 'DELETE'
        Path = '/quotation-data-box/inspection-requests/menus/{menuId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'Path Parameter'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('menuId', 'path', 'int64', '✓', '点検メニューID')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象 `inspection_menus` が存在することを確認する',
          '対象メニューを参照する有効な `inspection_tasks` が存在する場合は 409 とする',
          '`inspection_menus.is_active=false` に更新する。`inspection_menu_items` は履歴参照と結果スナップショット整合のため保持する',
          '無効化された日常点検メニューは、No.4 日常点検APIのPWAパッケージ取得対象から除外される'
        )
        ResponseTitle = 'レスポンス（204：なし）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('-', '-', '-', 'レスポンスボディなし')
        )
        StatusRows = @(
          @('204', '無効化成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `inspection_management` なし', 'ErrorResponse'),
          @('404', '対象メニューが存在しない', 'ErrorResponse'),
          @('409', '有効な点検タスクまたは日常点検設定行で使用中', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '点検管理登録（/quotation-data-box/inspection-requests/tasks）'
        Overview = '資産一覧画面の点検管理登録から、選択資産に定期点検タスクまたは日常点検設定行を作成/更新する。'
        Method = 'POST'
        Path = '/quotation-data-box/inspection-requests/tasks'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエスト（InspectionTaskUpsertRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('assetLedgerId', 'int64', '✓', '資産台帳ID'),
          @('inspectionType', 'string', '✓', '`院内定期点検` / `メーカー保守` / `院内スポット点検` / `日常点検`'),
          @('periodicMenuId', 'int64', '-', '定期点検系で指定する点検メニューID'),
          @('dailyBeforeMenuId', 'int64', '-', '日常点検 使用前メニューID'),
          @('dailyDuringMenuId', 'int64', '-', '日常点検 使用中メニューID'),
          @('dailyAfterMenuId', 'int64', '-', '日常点検 使用後メニューID'),
          @('nextInspectionOn', 'date', '-', '定期点検系の次回予定日'),
          @('vendorId', 'int64', '-', '委託業者ID。メーカー保守などで使用'),
          @('maintenanceContractId', 'int64', '-', '保守契約ID。保守契約管理タブ由来のタスクで使用する')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象資産が作業対象施設内に存在し、`asset_ledgers.status=''ACTIVE''` であることを確認する',
          '指定メニューはすべて `inspection_menus.is_active=true` であり、対象資産の大分類・中分類・品目と一致することを確認する',
          '定期点検系の場合は `periodicMenuId` 必須、`inspection_menus.menu_type=''PERIODIC''` であることを確認する',
          '`inspection_type=''院内定期点検''` / `院内スポット点検` では `nextInspectionOn` 必須とする。`inspection_type=''メーカー保守''` は日程未定登録を許可し、その場合は `status=''点検日調整''` とする',
          '有効な同一資産・同一点検種別・同一定期メニューの `inspection_tasks` が既に存在する場合は 409 とする',
          '定期点検系の初期 `status` は `inspection_task_status_definitions.is_initial_status=true` の予定系ステータスから `nextInspectionOn` に応じて算出する。`メーカー保守` の日程未定登録は `点検日調整` を許可する',
          '日常点検の場合は指定された日常点検メニューが `menu_type=''DAILY''` であり、`dailyBeforeMenuId` は `daily_timing=''BEFORE''`、`dailyDuringMenuId` は `daily_timing=''DURING''`、`dailyAfterMenuId` は `daily_timing=''AFTER''` と一致することを確認する',
          '日常点検の場合は `periodicMenuId`、`status`、`nextInspectionOn`、`lastInspectionOn` を null とし、`daily_menu_before_id` / `daily_menu_during_id` / `daily_menu_after_id` の少なくとも1つを必須とする',
          '有効な日常点検設定行が既に存在する場合は同じ行を更新し、存在しない場合は新規作成する',
          '同分類の他資産へ自動展開しない'
        )
        ResponseTitle = 'レスポンス（201/200：InspectionTaskUpsertResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('inspectionTaskId', 'int64', '✓', '作成または更新した点検タスクID'),
          @('upsertMode', 'string', '✓', '`CREATED` / `UPDATED`'),
          @('inspectionType', 'string', '✓', 'DB保存値'),
          @('assetLedgerId', 'int64', '✓', '資産台帳ID'),
          @('periodicMenuId', 'int64', '-', '定期点検メニューID。日常点検は null'),
          @('dailyBeforeMenuId', 'int64', '-', '使用前日常点検メニューID'),
          @('dailyDuringMenuId', 'int64', '-', '使用中日常点検メニューID'),
          @('dailyAfterMenuId', 'int64', '-', '使用後日常点検メニューID'),
          @('nextInspectionOn', 'date', '-', '次回予定日。日常点検は null'),
          @('status', 'string', '-', 'ステータス。日常点検は null')
        )
        StatusRows = @(
          @('200', '既存の日常点検設定行を更新', 'InspectionTaskUpsertResponse'),
          @('201', '新規作成成功', 'InspectionTaskUpsertResponse'),
          @('400', '入力不正、必須不足、点検種別とメニュー種別/タイミング不一致、メニュー分類不一致', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `inspection_management` なし', 'ErrorResponse'),
          @('404', '資産またはメニューが存在しない', 'ErrorResponse'),
          @('409', '有効な同一資産・同一定期メニューの重複', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '点検タスク/日常点検設定更新（/quotation-data-box/inspection-requests/tasks/{inspectionTaskId}）'
        Overview = '定期点検タスクまたは日常点検設定行を更新する。'
        Method = 'PUT'
        Path = '/quotation-data-box/inspection-requests/tasks/{inspectionTaskId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'Path Parameter'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('inspectionTaskId', 'path', 'int64', '✓', '点検タスクID')
        )
        RequestTitle = 'リクエスト（InspectionTaskUpdateRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('periodicMenuId', 'int64', '-', '定期点検メニューID'),
          @('dailyBeforeMenuId', 'int64|null', '-', '日常点検 使用前メニューID。未指定は維持、null指定で一部解除'),
          @('dailyDuringMenuId', 'int64|null', '-', '日常点検 使用中メニューID。未指定は維持、null指定で一部解除'),
          @('dailyAfterMenuId', 'int64|null', '-', '日常点検 使用後メニューID。未指定は維持、null指定で一部解除'),
          @('nextInspectionOn', 'date', '-', '定期点検系の次回予定日'),
          @('vendorId', 'int64', '-', '委託業者ID')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象 `inspection_tasks` が作業対象施設内の資産に紐づき、`is_active=true`、`deleted_at IS NULL` であることを確認する',
          '日常点検行の場合は、使用前/使用中/使用後メニューの変更または一部解除を許可する。ただし3タイミングすべてが null になる場合は設定解除APIを利用させ 400 とする',
          '日常点検行では、未指定フィールドは既存値を維持し、明示的な null フィールドのみ該当タイミングを解除する',
          '日常点検行で指定されたメニューは `menu_type=''DAILY''` かつ各フィールドに対応する `daily_timing` と一致することを確認する',
          '日常点検行では `status`、`nextInspectionOn`、`lastInspectionOn` を更新しない',
          '定期点検系で `periodicMenuId` を変更する場合は、指定メニューが `menu_type=''PERIODIC''` であることを確認し、有効な同一資産・同一点検種別・同一定期メニュー重複を禁止する',
          '`inspection_type=''院内定期点検''` / `院内スポット点検` で予定日を更新する場合は `nextInspectionOn` を null にできない。`メーカー保守` は日程未定を許可し、その場合は `点検日調整` へ戻す',
          '指定メニューは対象資産の大分類・中分類・品目と一致することを確認する',
          '点検実施中または完了済みタスクのメニュー変更は 409 とする'
        )
        ResponseTitle = 'レスポンス（200：InspectionTaskUpsertResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('inspectionTaskId', 'int64', '✓', '更新した点検タスクID'),
          @('inspectionType', 'string', '✓', 'DB保存値'),
          @('assetLedgerId', 'int64', '✓', '資産台帳ID'),
          @('periodicMenuId', 'int64', '-', '定期点検メニューID。日常点検は null'),
          @('dailyBeforeMenuId', 'int64', '-', '使用前日常点検メニューID'),
          @('dailyDuringMenuId', 'int64', '-', '使用中日常点検メニューID'),
          @('dailyAfterMenuId', 'int64', '-', '使用後日常点検メニューID'),
          @('nextInspectionOn', 'date', '-', '次回予定日。日常点検は null'),
          @('status', 'string', '-', 'ステータス。日常点検は null')
        )
        StatusRows = @(
          @('200', '更新成功', 'InspectionTaskUpsertResponse'),
          @('400', '入力不正、日常点検メニュー全解除指定、点検種別とメニュー種別/タイミング不一致', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `inspection_management` なし', 'ErrorResponse'),
          @('404', '対象タスクまたはメニューが存在しない', 'ErrorResponse'),
          @('409', '点検実施中/完了済み、または有効行重複', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '点検タスク/日常点検設定解除（/quotation-data-box/inspection-requests/tasks/{inspectionTaskId}）'
        Overview = '定期点検タスクまたは日常点検設定行を論理解除する。'
        Method = 'DELETE'
        Path = '/quotation-data-box/inspection-requests/tasks/{inspectionTaskId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'Path Parameter'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('inspectionTaskId', 'path', 'int64', '✓', '点検タスクID')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象 `inspection_tasks` が作業対象施設内の資産に紐づくことを確認する',
          '定期点検系で `status=''点検実施中''` の場合は解除不可とする',
          '`inspection_tasks.is_active=false`、`deleted_at=現在日時` に更新する',
          '日常点検設定行を解除した場合、以降の No.4 `/inspection-prep/master/download` のPWA配信対象から除外される',
          '過去の `inspection_results` は削除しない'
        )
        ResponseTitle = 'レスポンス（204：なし）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('-', '-', '-', 'レスポンスボディなし')
        )
        StatusRows = @(
          @('204', '解除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `inspection_management` なし', 'ErrorResponse'),
          @('404', '対象タスクが存在しない', 'ErrorResponse'),
          @('409', '点検実施中のため解除不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '定期点検開始（/quotation-data-box/inspection-requests/tasks/{inspectionTaskId}/start）'
        Overview = '定期点検画面でQR照合後に、対象タスクを `点検実施中` へ更新し、点検項目入力に必要なデータを返す。'
        Method = 'POST'
        Path = '/quotation-data-box/inspection-requests/tasks/{inspectionTaskId}/start'
        Auth = '要（Bearer）'
        ParametersTitle = 'Path Parameter'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('inspectionTaskId', 'path', 'int64', '✓', '点検タスクID')
        )
        RequestTitle = 'リクエスト（InspectionTaskStartRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('qrCode', 'string', '✓', '読み取ったQR識別子')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象タスクが定期点検系であり、`inspection_type<>''日常点検''`、`is_active=true`、`deleted_at IS NULL` であることを確認する',
          '`qr_codes.qr_identifier` が対象タスクの `asset_ledger_id` に紐づくことを確認する',
          '`inspection_task_status_transitions` で `START_INSPECTION` が許可される場合のみ `status=''点検実施中''` へ更新する',
          '`inspection_menus` と `inspection_menu_items` を返し、画面は返却データで点検実施ステップへ進む'
        )
        ResponseTitle = 'レスポンス（200：PeriodicInspectionStartResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('inspectionTaskId', 'int64', '✓', '点検タスクID'),
          @('status', 'string', '✓', '更新後ステータス。`点検実施中`'),
          @('asset', 'InspectionAssetSummary', '✓', '対象資産'),
          @('menu', 'InspectionMenu', '✓', '点検メニューと項目')
        )
        StatusRows = @(
          @('200', '開始成功', 'PeriodicInspectionStartResponse'),
          @('400', 'QRコード形式不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `inspection_management` なし', 'ErrorResponse'),
          @('404', '対象タスクまたはQRが存在しない', 'ErrorResponse'),
          @('409', 'QR不一致、日常点検行指定、またはステータス遷移不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '点検日程調整（/quotation-data-box/inspection-requests/tasks/{inspectionTaskId}/schedule）'
        Overview = 'メーカー保守タスクの日程を調整する。'
        Method = 'POST'
        Path = '/quotation-data-box/inspection-requests/tasks/{inspectionTaskId}/schedule'
        Auth = '要（Bearer）'
        ParametersTitle = 'Path Parameter'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('inspectionTaskId', 'path', 'int64', '✓', '点検タスクID')
        )
        RequestTitle = 'リクエスト（InspectionScheduleUpdateRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('nextInspectionOn', 'date', '✓', '調整後の次回予定日'),
          @('reason', 'string', '-', '調整理由')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象タスクが `inspection_type=''メーカー保守''`、`is_active=true` であることを確認する',
          '`inspection_task_status_transitions` で `SET_DATE` が許可されることを確認する',
          '`next_inspection_on` を更新し、調整後日付に応じた予定系ステータスへ更新する',
          '院内定期点検、院内スポット点検、日常点検行では 409 とする'
        )
        ResponseTitle = 'レスポンス（200：InspectionTaskUpsertResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('inspectionTaskId', 'int64', '✓', '点検タスクID'),
          @('nextInspectionOn', 'date', '✓', '更新後予定日'),
          @('status', 'string', '✓', '更新後ステータス')
        )
        StatusRows = @(
          @('200', '日程調整成功', 'InspectionTaskUpsertResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `inspection_management` なし', 'ErrorResponse'),
          @('404', '対象タスクが存在しない', 'ErrorResponse'),
          @('409', '対象点検種別外またはステータス遷移不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '点検スキップ（/quotation-data-box/inspection-requests/tasks/{inspectionTaskId}/skip）'
        Overview = '定期点検系タスクをスキップし、次回予定日とステータスを再計算する。スキップ専用ステータスは保存しない。'
        Method = 'POST'
        Path = '/quotation-data-box/inspection-requests/tasks/{inspectionTaskId}/skip'
        Auth = '要（Bearer）'
        ParametersTitle = 'Path Parameter'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('inspectionTaskId', 'path', 'int64', '✓', '点検タスクID')
        )
        RequestTitle = 'リクエスト（InspectionSkipRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('reason', 'string', '-', 'スキップ理由')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象タスクが定期点検系であり、`inspection_type<>''日常点検''`、`is_active=true` であることを確認する',
          '`inspection_task_status_transitions` で `SKIP` または `RECALCULATE_SCHEDULE` が許可されることを確認する',
          '`inspection_menus.cycle_months` を基準に `next_inspection_on` を再計算する。周期がないスポット点検は `next_inspection_on=NULL` とし終端扱いにする',
          '再計算後の予定系ステータスへ更新する。スキップ専用ステータスは保持しない'
        )
        ResponseTitle = 'レスポンス（200：InspectionTaskUpsertResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('inspectionTaskId', 'int64', '✓', '点検タスクID'),
          @('nextInspectionOn', 'date', '-', '再計算後予定日'),
          @('status', 'string', '✓', '再計算後ステータス')
        )
        StatusRows = @(
          @('200', 'スキップ成功', 'InspectionTaskUpsertResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `inspection_management` なし', 'ErrorResponse'),
          @('404', '対象タスクが存在しない', 'ErrorResponse'),
          @('409', '日常点検行指定、点検実施中、またはステータス遷移不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '定期点検結果登録（/quotation-data-box/inspection-requests/tasks/{inspectionTaskId}/result）'
        Overview = '定期点検画面の完了時に点検結果を登録し、対象タスクの状態、前回点検日、次回予定日を更新する。'
        Method = 'POST'
        Path = '/quotation-data-box/inspection-requests/tasks/{inspectionTaskId}/result'
        Auth = '要（Bearer）'
        ParametersTitle = 'Path Parameter'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('inspectionTaskId', 'path', 'int64', '✓', '点検タスクID')
        )
        RequestTitle = 'リクエスト（PeriodicInspectionResultRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('inspectedOn', 'date', '✓', '点検実施日'),
          @('inspectorName', 'string', '✓', '実施者名'),
          @('overallResult', 'string', '✓', '`PASS` / `REINSPECT` / `REPAIR_REQUEST`'),
          @('resultDetails', 'InspectionResultDetailInput[]', '✓', '点検項目ごとの結果'),
          @('remarks', 'string', '-', '備考')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象タスクが定期点検系であり、`status=''点検実施中''` であることを確認する',
          '点検項目結果が対象 `periodic_menu_id` 配下の `inspection_menu_items` と一致することを確認する',
          '`inspection_results` に点検結果を登録し、`result_details_json` に項目結果とメニュースナップショットを保存する',
          '`overallResult=PASS` の場合は `COMPLETE` 遷移で `点検完了` または次回予定系ステータスへ更新する',
          '`overallResult=REINSPECT` の場合は `再点検` へ更新する',
          '`overallResult=REPAIR_REQUEST` の場合も点検結果は登録し、`REINSPECT` 遷移で `再点検` へ更新したうえで修理申請連携用 `repairRequestSeed` を返す',
          '`last_inspection_on=inspectedOn` を設定し、`inspection_menus.cycle_months` がある場合は `next_inspection_on` を再計算する',
          '完了回数は `inspection_results` の件数集計で算出し、`inspection_tasks` には保持しない'
        )
        ResponseTitle = 'レスポンス（201：PeriodicInspectionResultResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('inspectionResultId', 'int64', '✓', '登録した点検結果ID'),
          @('inspectionTaskId', 'int64', '✓', '点検タスクID'),
          @('status', 'string', '✓', '更新後ステータス'),
          @('lastInspectionOn', 'date', '✓', '前回点検日'),
          @('nextInspectionOn', 'date', '-', '次回点検予定日'),
          @('repairRequestSeed', 'RepairRequestSeed', '-', '修理申請へ連携する初期値。`overallResult=REPAIR_REQUEST` の場合に返す')
        )
        StatusRows = @(
          @('201', '登録成功', 'PeriodicInspectionResultResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `inspection_management` なし', 'ErrorResponse'),
          @('404', '対象タスクまたは点検項目が存在しない', 'ErrorResponse'),
          @('409', '日常点検行指定、ステータス不正、または遷移不可', 'ErrorResponse'),
          @('422', '点検結果明細がメニュー定義と一致しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'メーカー保守結果登録詳細取得（/maker-maintenance-result/tasks/{maintenanceTaskId}）'
        Overview = 'メーカー保守 点検結果登録画面の初期表示に必要な対象タスク、資産、契約、添付情報を取得する。'
        Method = 'GET'
        Path = '/maker-maintenance-result/tasks/{maintenanceTaskId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'Path Parameter'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('maintenanceTaskId', 'path', 'int64', '✓', 'メーカー保守タスクID')
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象 `inspection_tasks` が `inspection_type=''メーカー保守''`、`is_active=true`、`deleted_at IS NULL` であり、作業対象施設内の資産に紐づくことを確認する',
          '`asset_ledgers`、`qr_codes`、`maintenance_contracts`、`vendors` を参照して画面表示情報を返す',
          '既存の `inspection_results` がある完了済みタスクは本API対象外として 409 とする'
        )
        ResponseTitle = 'レスポンス（200：MakerMaintenanceTaskDetailResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('inspectionTaskId', 'int64', '✓', '点検タスクID'),
          @('asset', 'InspectionAssetSummary', '✓', '対象機器情報'),
          @('inspectionGroupName', 'string', '-', '保守・点検グループ名'),
          @('vendorName', 'string', '-', '点検業者名'),
          @('nextInspectionOn', 'date', '-', '予定日'),
          @('defaultCostRows', 'CostRow[]', '✓', '費用行初期値。通常は空配列')
        )
        StatusRows = @(
          @('200', '取得成功', 'MakerMaintenanceTaskDetailResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `inspection_management` なし', 'ErrorResponse'),
          @('404', '対象タスクが存在しない', 'ErrorResponse'),
          @('409', 'メーカー保守以外または完了済み', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'メーカー保守結果登録（/maker-maintenance-result/tasks/{maintenanceTaskId}/result）'
        Overview = 'メーカー保守点検タスクに対して、点検結果、費用内訳、添付ファイルメタデータを登録し、対象タスクを論理解除する。'
        Method = 'POST'
        Path = '/maker-maintenance-result/tasks/{maintenanceTaskId}/result'
        Auth = '要（Bearer）'
        ParametersTitle = 'Path Parameter'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('maintenanceTaskId', 'path', 'int64', '✓', 'メーカー保守タスクID')
        )
        RequestTitle = 'リクエスト（MakerMaintenanceResultRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('inspectedOn', 'date', '✓', '点検実施日'),
          @('vendorName', 'string', '✓', '点検業者名スナップショット'),
          @('vendorStaffName', 'string', '-', '担当者名'),
          @('vendorContact', 'string', '-', '連絡先'),
          @('costRows', 'CostRowInput[]', '✓', '費用行。0円登録時は空配列可'),
          @('documents', 'InspectionDocumentInput[]', '-', 'アップロード済みファイルのメタデータ'),
          @('remarks', 'string', '-', '備考')
        )
        RequestSubtables = @(
          @{
            Title = 'costRows要素（CostRowInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('costType', 'string', '✓', '`PARTS` / `LABOR` / `OTHER`'),
              @('summary', 'string', '-', '概要'),
              @('amount', 'decimal', '✓', '金額')
            )
          },
          @{
            Title = 'documents要素（InspectionDocumentInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('documentCategory', 'string', '✓', '`REPORT` / `OTHER`'),
              @('documentType', 'string', '✓', '点検報告書 / その他'),
              @('fileName', 'string', '✓', 'ファイル名'),
              @('filePath', 'string', '✓', '保存先パス'),
              @('mimeType', 'string', '-', 'MIMEタイプ'),
              @('fileSizeBytes', 'int64', '-', 'ファイルサイズ')
            )
          }
        )
        PermissionLines = $permissionLines
        ProcessingLines = @(
          $workFacilityProcessingLine,
          '対象タスクが `inspection_type=''メーカー保守''`、`is_active=true` であり、作業対象施設内の資産に紐づくことを確認する',
          '費用行から `parts_cost`、`labor_cost`、`total_cost` を算出する。`OTHER` は `labor_cost` 側に含め、内訳詳細は `result_details_json.costRows` に保持する',
          '`inspection_results` にメーカー保守結果を登録する。`overall_result` は `PASS` とし、異常や再修理が必要な場合は修理管理タブ側で別途修理申請を起票する',
          '添付ファイルは `application_documents.owner_type=''INSPECTION_RESULT''`、`inspection_result_id`、`document_category`、`document_type`、`file_path` 等を登録する',
          '登録成功後、対象 `inspection_tasks` を `is_active=false`、`deleted_at=現在日時` として一覧から除外する',
          '1トランザクションで `inspection_results`、`application_documents`、`inspection_tasks` を更新する'
        )
        ResponseTitle = 'レスポンス（201：MakerMaintenanceResultResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('inspectionResultId', 'int64', '✓', '登録した点検結果ID'),
          @('inspectionTaskId', 'int64', '✓', '論理解除した点検タスクID'),
          @('partsCost', 'decimal', '✓', '部品費合計'),
          @('laborCost', 'decimal', '✓', '作業費等合計'),
          @('totalCost', 'decimal', '✓', '総額'),
          @('documentIds', 'int64[]', '✓', '登録したドキュメントID')
        )
        StatusRows = @(
          @('201', '登録成功', 'MakerMaintenanceResultResponse'),
          @('400', '入力不正、費用金額不正、添付メタデータ不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `inspection_management` なし', 'ErrorResponse'),
          @('404', '対象タスクが存在しない', 'ErrorResponse'),
          @('409', 'メーカー保守以外、完了済み、または既に解除済み', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '点検管理との責務境界' },
    @{ Type = 'Bullets'; Items = @(
      '点検メニュー登録、更新、無効化は本書の責務とする',
      '資産一覧画面の `点検管理登録` ボタンから実行する資産別紐づけは本書の責務とする',
      '日常点検PWAの `/inspection-prep`、`/daily-inspection`、未送信結果同期は No.4 日常点検API設計書の責務とする',
      '点検管理の日常点検行では、点検実施、日程調整、スキップのActionを返さない',
      '点検結果から修理申請へ進む起票API本体は修理管理タブAPI設計書の責務とし、本書では `repairRequestSeed` までを返す'
    ) },
    @{ Type = 'Heading2'; Text = '重複・整合性ルール' },
    @{ Type = 'Bullets'; Items = @(
      '有効な定期点検系タスクは `(asset_ledger_id, inspection_type, periodic_menu_id)` の重複を禁止する',
      '有効な日常点検設定行は `(asset_ledger_id, inspection_type=''日常点検'')` の重複を禁止する',
      '点検管理登録で適用できるメニューは、対象資産の大分類・中分類・品目と一致する有効メニューに限定する',
      '日常点検設定行は使用前・使用中・使用後の各タイミングに最大1メニューを保持する',
      '点検メニューが有効タスクまたは点検結果で使用済みの場合、項目IDを破壊する更新は許可せず、新メニュー作成と旧メニュー無効化で運用する'
    ) },
    @{ Type = 'Heading2'; Text = 'ステータス遷移ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`START_INSPECTION` は予定系ステータスまたは再点検から `点検実施中` への遷移に使用する',
      '`COMPLETE` は `点検実施中` から `点検完了` または `再点検` への遷移に使用する',
      '`SKIP` / `RECALCULATE_SCHEDULE` は次回予定日を再計算し、再計算後の予定系ステータスへ更新する',
      '`SET_DATE` はメーカー保守の日程調整に使用する。`inspection_type=''メーカー保守''` 以外で `点検日調整` を保存しない',
      '日常点検行はステータス遷移対象外であり、`inspection_task_status_definitions` / `inspection_task_status_transitions` の対象に含めない'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '説明', '発生条件'); Rows = @(
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効', 'Bearer トークン未付与、期限切れ、署名不正'),
      @('INSPECTION_MGMT_FORBIDDEN', '403', '点検管理権限なし', '作業対象施設に対する実効 `inspection_management` がない'),
      @('FACILITY_NOT_FOUND', '404', '作業対象施設が存在しない、または削除済み', 'Bearer トークン上の作業対象施設を参照できない'),
      @('INSPECTION_MGMT_INVALID_INPUT', '400', '入力形式または必須項目が不正', '必須不足、列挙値外、日付形式不正、点検項目なし'),
      @('INSPECTION_MGMT_ASSET_NOT_FOUND', '404', '資産が存在しない', '指定 `assetLedgerId` が存在しない、または作業対象施設外'),
      @('INSPECTION_MGMT_MENU_NOT_FOUND', '404', '点検メニューが存在しない', '指定 `menuId` / `periodicMenuId` / `dailyMenuId` が存在しない、または無効'),
      @('INSPECTION_MGMT_TASK_NOT_FOUND', '404', '点検タスクが存在しない', '指定 `inspectionTaskId` が存在しない、作業対象施設外、または解除済み'),
      @('INSPECTION_MGMT_MENU_CLASS_MISMATCH', '409', '点検メニューの対象分類が資産分類と一致しない', 'メニューの大分類・中分類・品目と対象資産の分類が不一致'),
      @('INSPECTION_MGMT_TASK_DUPLICATE', '409', '点検タスクまたは日常点検設定が重複', '有効な同一資産・同一定期メニュー、または日常点検設定行が既に存在する'),
      @('INSPECTION_MGMT_MENU_IN_USE', '409', '点検メニューが使用中', '更新時は有効タスクまたは点検結果で参照されるメニュー、削除時は有効タスクまたは日常点検設定行で参照されるメニューを指定した'),
      @('INSPECTION_MGMT_STATUS_TRANSITION_INVALID', '409', 'ステータス遷移不可', '`inspection_task_status_transitions` に対象遷移が存在しない'),
      @('INSPECTION_MGMT_DAILY_ACTION_NOT_ALLOWED', '409', '日常点検行では実行不可の操作', '日常点検行に対して点検開始、日程調整、スキップ、定期点検結果登録を実行した'),
      @('INSPECTION_MGMT_QR_MISMATCH', '409', 'QRコードが対象資産と一致しない', '定期点検開始時に読み取ったQRが対象タスクの資産に紐づかない'),
      @('INSPECTION_MGMT_RESULT_DETAIL_INVALID', '422', '点検結果明細がメニュー定義と一致しない', '点検項目ID、入力方式、評価方式、必須入力が不正'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー', '想定外例外')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = 'マスタ保守方針' },
    @{ Type = 'Bullets'; Items = @(
      '点検メニューは `inspection_menus` と `inspection_menu_items` を正本とする',
      '日常点検メニューは No.4 日常点検APIのPWAパッケージへ配信されるため、使用中メニューの破壊的更新は禁止する',
      '点検タスクと日常点検設定行は `inspection_tasks` を正本とし、解除時は物理削除せず `is_active=false` と `deleted_at` を設定する',
      'メーカー保守結果登録後の対象タスクも、履歴参照のため物理削除せず論理解除する'
    ) },
    @{ Type = 'Heading2'; Text = '今後拡張時の留意点' },
    @{ Type = 'Bullets'; Items = @(
      '点検グループ名を手動登録タスクで恒久保持する場合は、`inspection_tasks` へのカラム追加またはタスク拡張テーブルを検討する',
      '点検メニュー項目を使用中メニューでも非表示化したい場合は、`inspection_menu_items` に `is_active` または版管理カラムを追加する',
      'メーカー保守費用の詳細検索や集計が必要になった場合は、`inspection_results.result_details_json.costRows` から正規化テーブルへの分離を検討する',
      'CSV出力の列追加は画面表示列と検収基準の帳票要件を合わせて見直す'
    ) }
  )
}

function Normalize-InspectionManagementEndpointStatusRows {
  param(
    [object[]]$Rows
  )

  $normalizedRows = [System.Collections.Generic.List[object]]::new()
  $has401 = @($Rows | Where-Object { $_[0] -eq '401' }).Count -gt 0
  $has403 = @($Rows | Where-Object { $_[0] -eq '403' }).Count -gt 0
  $has404 = @($Rows | Where-Object { $_[0] -eq '404' }).Count -gt 0

  foreach ($row in $Rows) {
    if ($row[0] -eq '403') {
      $row[1] = $auth403StatusRow[1]
    }

    if (($row[0] -eq '404') -and ([string]$row[1] -notmatch '作業対象施設が存在しない|削除済み')) {
      $row[1] = "作業対象施設が存在しない/削除済み、または、$($row[1])"
    }

    [void]$normalizedRows.Add($row)
  }

  if (-not $has401) {
    [void]$normalizedRows.Add($auth401StatusRow)
  }

  if (-not $has403) {
    [void]$normalizedRows.Add($auth403StatusRow)
  }

  if (-not $has404) {
    [void]$normalizedRows.Add($workFacility404StatusRow)
  }

  return @($normalizedRows.ToArray() | Sort-Object `
    @{ Expression = { [int]$_[0] }; Ascending = $true }, `
    @{ Expression = { if ([string]$_[1] -match '作業対象施設') { 0 } else { 1 } }; Ascending = $true })
}

foreach ($section in @($spec.Sections | Where-Object { $_.Type -eq 'EndpointBlocks' })) {
  foreach ($endpoint in @($section.Items)) {
    $endpoint.StatusRows = Normalize-InspectionManagementEndpointStatusRows -Rows $endpoint.StatusRows
  }
}

$spec
