$repairRequestPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `repair_request_create` が有効であること'
)

$errorRows = @(
  @('200', '処理成功', '各API定義のレスポンス'),
  @('201', '登録成功', '各API定義のレスポンス'),
  @('400', '入力値不正、登録済/未登録資産の条件不整合', 'ErrorResponse'),
  @('401', '未認証', 'ErrorResponse'),
  @('403', '通常アカウントで作業対象施設に対する実効 `repair_request_create` なし、または共有システム管理者で作業対象施設が削除済み', 'ErrorResponse'),
  @('404', '対象資産または点検結果が存在しない', 'ErrorResponse'),
  @('409', '採番競合または競合更新', 'ErrorResponse'),
  @('500', 'サーバー内部エラー', 'ErrorResponse')
)

$documentCreateInputRows = @(
  @('documentCategory', 'string', '-', '`PHOTO` / `REQUEST_ATTACHMENT` / `OTHER`。機器写真は `PHOTO` として保存する'),
  @('documentType', 'string', '✓', '`application_documents.document_type`。例: 機器写真 / 修理依頼添付'),
  @('fileName', 'string', '✓', 'ファイル名'),
  @('contentType', 'string', '-', 'MIMEタイプ'),
  @('fileSize', 'int64', '-', 'ファイルサイズ'),
  @('storageKey', 'string', '✓', 'ファイル実体のストレージキー'),
  @('title', 'string', '-', '表示タイトル'),
  @('documentDate', 'date', '-', '文書日付'),
  @('isPrimary', 'boolean', '-', '代表写真として扱う場合 true')
)

$repairAssetSnapshotRows = @(
  @('assetLedgerId', 'int64', '✓', '資産台帳ID'),
  @('qrCodeValue', 'string', '✓', 'QRラベル'),
  @('managementNo', 'string', '-', '管理番号'),
  @('itemName', 'string', '✓', '品目名'),
  @('makerName', 'string', '-', 'メーカー名'),
  @('modelName', 'string', '-', '型式'),
  @('serialNo', 'string', '-', 'シリアルNo.'),
  @('departmentName', 'string', '-', '設置部署'),
  @('roomName', 'string', '-', '室名'),
  @('photoDocumentId', 'int64', '-', '代表写真のドキュメントID')
)

$repairRequestSeedRows = @(
  @('inspectionResultId', 'int64', '-', '連携元点検結果ID'),
  @('assetLedgerId', 'int64', '-', '登録済み資産ID'),
  @('qrCodeValue', 'string', '-', 'QRラベル'),
  @('symptomText', 'string', '-', '点検結果から引き継ぐ症状初期値'),
  @('assetSnapshot', 'RepairAssetSnapshot', '-', '登録済み資産の初期表示値')
)

$repairRequestCreatedRows = @(
  @('repairRequestId', 'int64', '✓', '作成した修理申請ID。`applications.application_id`'),
  @('applicationNo', 'string', '✓', '確定した修理依頼No.'),
  @('status', 'string', '✓', '`新規申請`'),
  @('createdAt', 'datetime', '✓', '作成日時')
)

@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_修理申請.docx'
  ScreenLabel = '修理申請'
  CoverDateText = '2026年5月20日'
  RevisionDateText = '2026/5/20'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、メニュー画面から遷移して利用する修理申請画面（`/repair-request`）で利用する API の設計内容を整理し、画面要件、DB設計、修理管理API設計書との責務境界を一致させることを目的とする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      '修理申請画面の初期表示、QR指定資産取得、修理依頼起票 I/F',
      '申請部署、申請者、申請者連絡先をログインユーザー情報から自動取得する方針',
      '登録済み資産と未登録資産の入力条件および保存先',
      '未登録資産を資産台帳へ登録せず、申請内スナップショットとして保持する方針',
      '未登録資産の対象スコープを修理申請と修理申請経由の廃棄申請のみに限定する方針',
      '修理依頼時の機器写真・添付を `application_documents` に保存する方針',
      '修理管理（`/quotation-data-box/repair-requests`、`/repair-task`）との feature_code とAPI設計書の分離'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '修理申請は、現場担当者がメニュー画面から修理依頼画面へ遷移し、登録済み資産または資産台帳に登録されていない物品の修理依頼を起票する機能である。起票後の受付判定、院内/院外修理の振り分け、見積、発注、検収、完了、却下、廃棄申請接続は No.27 修理管理API設計書で扱う。' },
    @{ Type = 'Paragraph'; Text = '修理申請では、資産台帳に登録済みの資産だけでなく未登録資産も受け付ける。ただし未登録資産は `asset_ledgers` へ登録せず、申請内の手入力情報および `application_assets` の表示用スナップショットとして保持する。本システム未登録資産の対象スコープは修理申請と修理申請経由の廃棄申請のみであり、未登録資産の修理が完了しても資産台帳に対する CRUD は行わない。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('修理申請', 'メニュー画面から `/repair-request` で起票する現場依頼。`repair_request_create` で認可する'),
      @('修理管理', 'タスク管理配下で修理申請を受付・進行する業務。`repair_management` で認可し、No.27 修理管理API設計書で扱う'),
      @('登録済み資産', '資産台帳 `asset_ledgers` に存在し、`application_assets.asset_ledger_id` を保持する修理対象'),
      @('未登録資産', '資産台帳に登録せず、`repair_request_details.manual_item_name` 等の手入力列と `application_assets` スナップショットで保持する修理対象'),
      @('依頼受付', '画面表示上の受付状態。保存値にはせず、起票直後の `applications.status` は `新規申請` とする')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面パス', '利用目的'); Rows = @(
      @('修理依頼画面', '/repair-request', '現場担当者が登録済み資産または未登録資産の修理依頼を起票する')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'API の位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、修理申請の起票前準備と起票登録までを扱う。点検結果から修理申請へ遷移する場合は、日常点検APIまたは点検管理APIが返す初期値を `/repair-request` へ渡し、本書の修理依頼起票APIで `repair_request_details.inspection_result_id` として保存する。' },
    @{ Type = 'Paragraph'; Text = '起票後の修理管理タブ表示、修理タスク詳細、受付判定、却下、見積依頼、見積登録、発注、検収、完了、修理不能からの廃棄申請接続は No.27 修理管理API設計書を正本とし、本書では定義しない。修理申請を経由しない未登録資産の単独廃棄申請はPhase1対象外であり、本書にも入口UI/APIを設けない。' },
    @{ Type = 'Heading2'; Text = '画面と API の関係' },
    @{ Type = 'Table'; Headers = @('画面操作', 'API', '補足'); Rows = @(
      @('修理依頼画面初期表示', '`GET /repair-request/context`', 'ログインユーザー由来の申請者情報、連携元点検結果、採番候補を返す'),
      @('QR読取後の登録済み資産取得', '`GET /repair-request/assets/by-qr/{qrCode}`', '登録済み資産の表示用スナップショットを取得する'),
      @('修理依頼送信', '`POST /repair-request/requests`', '`applications`、`repair_request_details`、`application_assets`、`application_documents`、初期履歴を同一トランザクションで作成する')
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル名', '利用種別', '用途'); Rows = @(
      @('`applications`', 'CREATE', '修理申請ヘッダー、申請者情報、状態、申請日、申請時刻'),
      @('`repair_request_details`', 'CREATE', '登録済/未登録区分、症状、代替機要否、点検結果ID、未登録資産の手入力情報。`repair_category` は起票時には設定せず、修理管理STEP1で設定する'),
      @('`application_assets`', 'CREATE', '修理対象機器の明細。登録済み資産は `asset_ledger_id`、未登録資産は表示用スナップショットを保持する'),
      @('`application_documents`', 'CREATE', '修理依頼時の機器写真・添付メタデータ。写真は `document_category=''PHOTO''` として保存する'),
      @('`application_status_histories`', 'CREATE', '起票時の初期ステータス履歴'),
      @('`application_status_definitions`', 'READ', 'REPAIRの初期ステータス `新規申請` の存在確認'),
      @('`qr_codes`', 'READ', 'QRラベルから現行有効QRを解決する'),
      @('`asset_ledgers`', 'READ', '登録済み資産のQR解決、施設スコープ確認、表示用スナップショット取得'),
      @('`inspection_results`', 'READ', '点検結果から修理申請へ遷移する場合の対象資産・症状初期値'),
      @('`users`', 'READ', 'ログインユーザーの表示名、所属、連絡先、共有システム管理者アカウント判定'),
      @('`facilities`', 'READ', '作業対象施設の存在確認、論理削除確認')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API 共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON。ファイル実体アップロードは別ストレージ連携を前提とし、本APIでは `application_documents` のメタデータを扱う',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-05-19T10:00:00+09:00`）',
      '日付形式: `YYYY-MM-DD`',
      '認証済みAPIは Bearer トークンを `Authorization` ヘッダーに付与する',
      '各APIは Bearer トークン上の作業対象施設を基準に自施設データのみ処理する'
    ) },
    @{ Type = 'Heading2'; Text = '認証・認可' },
    @{ Type = 'Paragraph'; Text = '本API群で使用する `feature_code` は `repair_request_create` である。タスク管理配下の修理管理APIで使用する `repair_management` とは分離する。通常アカウントでは、画面表示用の `/auth/context` に依存せず、各業務APIで Bearer トークン上の作業対象施設に対する担当施設割当、施設提供設定、ユーザー施設別設定を再判定する。共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）では、作業対象施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず API 実行を許可する。ただし、登録済み資産や点検結果を指定する場合は、対象データが作業対象施設に属することをアカウント種別にかかわらず必ず確認する。' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('修理依頼画面初期表示、QR資産取得、修理依頼起票', '`repair_request_create`', '通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings` / 共有システム管理者: `users.account_type`, `facilities.deleted_at`', '通常アカウントは作業対象施設で `repair_request_create` が実効有効であること。共有システム管理者は作業対象施設が未削除であること')
    ) },
    @{ Type = 'Heading2'; Text = 'ステータス・工程共通ルール' },
    @{ Type = 'Bullets'; Items = @(
      '起票APIは `applications.application_type=''REPAIR''`、`applications.status=''新規申請''` で申請を作成する',
      '画面表示上の `依頼受付` は保存値にしない',
      '起票時点では院内修理/院外修理の振り分けを行わないため、`repair_request_details.repair_category` は未設定とする',
      '申請部署、申請者、申請者連絡先はログインユーザー情報から自動取得し、リクエスト本文からは受け取らない',
      '起票後のステータス遷移と工程は No.27 修理管理API設計書で扱う'
    ) },
    @{ Type = 'Heading2'; Text = '登録済み資産・未登録資産の扱い' },
    @{ Type = 'Bullets'; Items = @(
      '登録済み資産は `application_assets.asset_ledger_id` を保持し、申請時点の品目、メーカー、型式、シリアルNo.、設置場所を `application_assets` にスナップショット保存する',
      '未登録資産は `asset_ledgers` へ登録しない。`repair_request_details.manual_item_name`、`manual_maker_name`、`manual_model_name`、`manual_serial_no`、`manual_department_name`、`manual_room_name` と `application_assets` の表示用スナップショットに保持する',
      '登録済み資産と未登録資産のどちらでも修理依頼時の機器写真・添付を保存できる',
      '未登録資産の修理申請が完了しても資産台帳に対する CRUD は行わない',
      '未登録資産が修理不能となった場合の廃棄申請接続は No.27 修理管理API設計書で扱い、元修理申請の手入力情報と `application_assets` スナップショットを廃棄対象物品情報として引き継ぐ'
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや競合理由の補足')
    ) },
    @{ Type = 'Heading2'; Text = '共通DTO' },
    @{ Type = 'Paragraph'; Text = '複数APIで共通利用する入出力DTOを以下に定義する。`DocumentCreateInput` を保存するAPIは、`storageKey` を `application_documents.file_path`、`contentType` を `mime_type`、`fileSize` を `file_size_bytes`、認証ユーザーIDを `uploaded_by_user_id`、現在日時を `uploaded_at` に設定する。' },
    @{ Type = 'Heading3'; Text = 'DocumentCreateInput' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentCreateInputRows },
    @{ Type = 'Heading3'; Text = 'RepairAssetSnapshot' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $repairAssetSnapshotRows },
    @{ Type = 'Heading3'; Text = 'RepairRequestSeed' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $repairRequestSeedRows },
    @{ Type = 'Heading3'; Text = 'RepairRequestCreatedResponse' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $repairRequestCreatedRows },

    @{ Type = 'Heading1'; Text = '第4章 API 一覧' },
    @{ Type = 'Table'; Headers = @('No', 'API名', 'メソッド', 'パス', '用途', '権限'); Rows = @(
      @('1', '修理依頼画面コンテキスト取得', 'GET', '/repair-request/context', 'ログインユーザー情報、連携元点検結果、採番候補を取得する', '`repair_request_create`'),
      @('2', 'QR指定資産取得', 'GET', '/repair-request/assets/by-qr/{qrCode}', 'QRラベルから登録済み資産の修理申請用スナップショットを取得する', '`repair_request_create`'),
      @('3', '修理依頼起票', 'POST', '/repair-request/requests', '修理依頼を起票する', '`repair_request_create`')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 修理申請機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '修理依頼画面コンテキスト取得（/repair-request/context）'
        Overview = '修理依頼画面の初期表示に必要なログインユーザー由来の申請者情報、修理依頼No.採番候補、点検結果連携の初期値を取得する。'
        Method = 'GET'
        Path = '/repair-request/context'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('inspectionResultId', 'query', 'int64', '-', '点検結果から修理申請へ遷移した場合の連携元点検結果ID'),
          @('assetLedgerId', 'query', 'int64', '-', '登録済み資産を初期選択する場合の資産台帳ID')
        )
        PermissionLines = $repairRequestPermissionLines
        ProcessingLines = @(
          'ログインユーザー情報から `requestedByUserId`、`requestedByName`、`requestedByDepartmentName`、`requestedByContact` を返す',
          '申請者情報は画面表示用であり、起票APIではリクエスト本文ではなく認証コンテキストから再設定する',
          '`inspectionResultId` 指定時は作業対象施設内の点検結果であることを検証し、症状・対象資産の初期値を返す',
          '`assetLedgerId` 指定時は作業対象施設内の登録済み資産であることを検証し、機器情報スナップショットを返す',
          '修理依頼No.は作成時に確定採番する。画面表示用には採番候補または仮表示用の `provisionalApplicationNo` を返す'
        )
        ResponseTitle = 'レスポンス（200：RepairRequestContextResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('provisionalApplicationNo', 'string', '-', '画面表示用の採番候補。確定値ではない'),
          @('requestedByUserId', 'int64', '✓', 'ログインユーザーID'),
          @('requestedByName', 'string', '✓', 'ログインユーザー表示名'),
          @('requestedByDepartmentName', 'string', '-', 'ログインユーザー所属'),
          @('requestedByContact', 'string', '-', 'ログインユーザー連絡先'),
          @('seed', 'RepairRequestSeed', '-', '点検結果または資産指定からの初期値')
        )
        ResponseSubtables = @(
          @{
            Title = 'seed要素（RepairRequestSeed）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = $repairRequestSeedRows
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'RepairRequestContextResponse'),
          @('400', 'パラメータ不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `repair_request_create` なし、共有システム管理者で作業対象施設が削除済み、または対象施設不一致', 'ErrorResponse'),
          @('404', '指定した点検結果または資産が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'QR指定資産取得（/repair-request/assets/by-qr/{qrCode}）'
        Overview = 'QRラベルから登録済み資産を解決し、修理依頼画面の機器情報へ表示するスナップショットを取得する。'
        Method = 'GET'
        Path = '/repair-request/assets/by-qr/{qrCode}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('qrCode', 'path', 'string', '✓', 'QRラベルまたはQR識別子')
        )
        PermissionLines = $repairRequestPermissionLines
        ProcessingLines = @(
          '`qr_codes` から現行有効QRを解決し、紐づく `asset_ledgers` を取得する',
          '作業対象施設内の資産のみ返却する',
          '修理申請時点で必要な品目、メーカー、型式、シリアルNo.、設置部署、室名、写真代表情報をスナップショットとして返す',
          '未登録資産は本APIの対象外であり、画面上の手入力欄で扱う'
        )
        ResponseTitle = 'レスポンス（200：RepairAssetSnapshot）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $repairAssetSnapshotRows
        StatusRows = @(
          @('200', '取得成功', 'RepairAssetSnapshot'),
          @('400', 'QRコード形式不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `repair_request_create` なし、共有システム管理者で作業対象施設が削除済み、または対象施設不一致', 'ErrorResponse'),
          @('404', 'QRに紐づく登録済み資産が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '修理依頼起票（/repair-request/requests）'
        Overview = '現場担当者が入力した修理依頼を起票する。登録済み資産と未登録資産の両方を受け付ける。'
        Method = 'POST'
        Path = '/repair-request/requests'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('isRegisteredAsset', 'boolean', '✓', '登録済み資産の場合 true'),
          @('assetLedgerId', 'int64', '-', '登録済み資産の場合必須'),
          @('qrCodeValue', 'string', '-', '登録済み資産のQRラベル'),
          @('manualItemName', 'string', '-', '未登録資産の場合必須'),
          @('manualMakerName', 'string', '-', '未登録資産のメーカー名'),
          @('manualModelName', 'string', '-', '未登録資産の型式'),
          @('manualSerialNo', 'string', '-', '未登録資産のシリアルNo.'),
          @('manualDepartmentName', 'string', '-', '未登録資産の設置部署'),
          @('manualRoomName', 'string', '-', '未登録資産の室名'),
          @('symptomText', 'string', '✓', '症状詳細'),
          @('alternativeDeviceStatus', 'string', '-', '`NEEDED` / `NOT_NEEDED` / `REQUESTED`'),
          @('freeComment', 'string', '-', 'フリーコメント'),
          @('inspectionResultId', 'int64', '-', '点検結果から遷移した場合の連携元点検結果ID'),
          @('photoDocuments', 'DocumentCreateInput[]', '-', '修理依頼時の機器写真メタデータ'),
          @('attachmentDocuments', 'DocumentCreateInput[]', '-', '修理依頼時の補足添付メタデータ')
        )
        PermissionLines = $repairRequestPermissionLines
        ProcessingLines = @(
          '認証コンテキストから申請部署、申請者、申請者連絡先を取得し、リクエスト本文の申請者情報は正本にしない',
          '`applications` を `application_type=''REPAIR''`、`status=''新規申請''`、作業対象施設ID、申請者情報、申請日、申請時刻で作成する',
          '登録済み資産の場合は `asset_ledger_id` を必須とし、作業対象施設内の資産であることを検証する',
          '未登録資産の場合は `asset_ledger_id` を保持せず、資産台帳 `asset_ledgers` への登録・更新は行わない',
          '`repair_request_details` に `application_type=''REPAIR''`、`is_registered_asset`、症状、代替機要否、点検結果ID、手入力 `manual_item_name`、`manual_maker_name`、`manual_model_name`、`manual_serial_no`、`manual_department_name`、`manual_room_name` を保存する',
          '`repair_request_details.repair_category` は起票時には設定しない。院内修理/院外修理の振り分けは No.27 修理管理API設計書のSTEP1で登録する',
          '`application_assets` に `asset_role=''REPAIR''`、行番号1、`quantity=1`、`unit=''台''`、登録済み資産または未登録資産の表示用スナップショットを保存する',
          '写真は `application_documents` に `owner_type=''APPLICATION''` または `APPLICATION_ASSET`、`document_category=''PHOTO''`、`document_type=''機器写真''` として保存する',
          '補足添付は `application_documents` に `owner_type=''APPLICATION''`、`document_category=''REQUEST_ATTACHMENT''` として保存する',
          '`storageKey` は `application_documents.file_path`、`contentType` は `mime_type`、`fileSize` は `file_size_bytes` に保存し、生成列 `owner_key` は直接書き込まない',
          '`application_status_histories` に初期ステータス履歴を作成する',
          '`application_no` はDB採番または採番サービスで一意確定し、一意性競合時は409を返す',
          '上記の `applications`、`repair_request_details`、`application_assets`、`application_documents`、`application_status_histories` 作成は同一トランザクションで行う'
        )
        ResponseTitle = 'レスポンス（201：RepairRequestCreatedResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $repairRequestCreatedRows
        StatusRows = @(
          @('201', '起票成功', 'RepairRequestCreatedResponse'),
          @('400', '必須不足、登録済/未登録資産条件不正、症状未入力', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `repair_request_create` なし、共有システム管理者で作業対象施設が削除済み、または対象施設不一致', 'ErrorResponse'),
          @('404', '指定した登録済み資産または点検結果が存在しない', 'ErrorResponse'),
          @('409', '採番競合または競合更新', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '権限マトリクス' },
    @{ Type = 'Table'; Headers = @('処理', 'feature_code', '判定条件', '説明'); Rows = @(
      @('修理依頼画面コンテキスト取得', '`repair_request_create`', '通常アカウントは作業対象施設に対して実効 `repair_request_create` を持つこと。共有システム管理者は作業対象施設が未削除であること', '現場修理依頼の初期表示'),
      @('登録済み資産のQR取得', '`repair_request_create`', '通常アカウントは作業対象施設に対して実効 `repair_request_create` を持つこと。共有システム管理者は作業対象施設が未削除であること。対象資産は作業対象施設内に限定する', '修理申請起票前の資産取得'),
      @('修理依頼起票', '`repair_request_create`', '通常アカウントは作業対象施設に対して実効 `repair_request_create` を持つこと。共有システム管理者は作業対象施設が未削除であること。登録済み資産または点検結果を指定する場合は対象施設一致を確認する', '修理申請の作成')
    ) },
    @{ Type = 'Heading2'; Text = '入力制御ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`isRegisteredAsset=true` の場合は `assetLedgerId` を必須とし、未登録資産用の手入力品目名は保存正本にしない',
      '`isRegisteredAsset=false` の場合は `manualItemName` を必須とし、`assetLedgerId` を受け付けない',
      '申請者情報はログインユーザー情報から自動取得するため、画面入力項目としては扱わない',
      '修理依頼写真は登録済み資産・未登録資産のどちらでも添付できる',
      '未登録資産の修理申請では資産台帳・個別原本・QRへの登録や更新を行わない'
    ) },
    @{ Type = 'Heading2'; Text = '他機能との責務境界' },
    @{ Type = 'Bullets'; Items = @(
      '日常点検APIと点検管理APIは修理申請連携用の初期値までを返し、修理申請の作成は本書の `POST /repair-request/requests` を正本とする',
      '修理申請起票後の受付判定、院内/院外振り分け、見積、発注、検収、完了、却下、廃棄申請接続は No.27 修理管理API設計書を正本とする',
      '未登録資産が修理不能となった場合は、No.27 修理管理API設計書の廃棄申請接続APIで修理申請経由の廃棄申請を作成する',
      '修理申請を経由しない未登録資産の単独廃棄申請はPhase1対象外であり、本書では定義しない'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('コード', 'HTTP', '内容'); Rows = @(
      @('AUTH_401_UNAUTHORIZED', '401', '認証情報が存在しない、または無効'),
      @('AUTH_403_REPAIR_REQUEST_CREATE_DENIED', '403', '通常アカウントで作業対象施設に対する実効 `repair_request_create` がない、共有システム管理者で作業対象施設が削除済み、または対象施設不一致'),
      @('REPAIR_ASSET_NOT_FOUND', '404', '指定した登録済み資産またはQRに紐づく資産が存在しない'),
      @('REPAIR_INSPECTION_RESULT_NOT_FOUND', '404', '指定した点検結果が存在しない'),
      @('REPAIR_REQUEST_INPUT_INVALID', '400', '登録済/未登録資産条件、症状、添付メタデータが不正'),
      @('REPAIR_REQUEST_NUMBER_CONFLICT', '409', '修理依頼No.採番が競合した'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー')
    ) },
    @{ Type = 'Table'; Headers = @('HTTPステータス', '概要', 'レスポンス'); Rows = $errorRows },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Bullets'; Items = @(
      '修理申請の状態変更は `application_status_histories` に履歴を残す',
      '機器写真・添付メタデータは `application_documents` で管理し、ファイル実体は別ストレージ、DB上の保管キーは `application_documents.file_path` を正本とする',
      '未登録資産は修理申請内の履歴として保持し、修理申請経由の廃棄申請へ接続する場合を除いて他申請種別の入口には展開しない。資産台帳への自動登録や原本資産CRUDは行わない',
      '申請者情報はログインユーザー情報から自動取得するため、ユーザー所属情報の更新漏れが申請表示へ影響する点を運用上の注意事項とする',
      '修理管理側で院内/院外振り分けを行うまでは `repair_category` 未設定として扱い、一覧やタスクの表示では未受付状態として扱う'
    ) }
  )
}
