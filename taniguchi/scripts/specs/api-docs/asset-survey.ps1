@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_現有品調査.docx'
  ScreenLabel = '現有品調査'
  CoverDateText = '2026年4月18日'
  RevisionDateText = '2026/4/18'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、現有品調査準備画面（`/offline-prep`）および調査登録内容修正画面（`/registration-edit`）で利用する API の設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      'オフライン利用前に必要なマスタパッケージ取得 I/F',
      'オフラインで収集した調査結果アップロード I/F',
      '送信後データの一覧表示、修正、写真参照/削除、確定 I/F',
      '現有品調査関連画面のうち API 対象とする画面範囲'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '現有品調査は、オンライン専用の準備画面 `/offline-prep`、PWAでオフライン利用する `/survey-location`、`/asset-survey`、`/history`、および送信後データをオンラインで修正・確定する `/registration-edit` から構成される。' },
    @{ Type = 'Paragraph'; Text = '本API設計書では、オンラインで行うマスタダウンロード・調査結果送信・送信後データ修正を対象とする。`/survey-location`、`/asset-survey`、`/history` はPWAのローカル実装として扱い、画面単位の個別APIは設けない。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('現有品調査準備', 'オンライン環境下でマスタダウンロードと未送信データ送信を行う `/offline-prep` 画面'),
      @('調査登録内容修正', '送信後・未確定状態の調査データを一覧し、修正・マスタ紐付け・確定を行う `/registration-edit` 画面'),
      @('マスタパッケージ', 'オフライン調査で必要となる施設・ロケーション・分類マスタ一式'),
      @('調査セッション', '端末から1回の送信でアップロードされる調査データ一式。`asset_survey_sessions` に保存する'),
      @('調査レコード', '調査セッション配下の個票データ。`asset_survey_records` に保存する')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('項目', '内容'); Rows = @(
      @('対象画面', '7. 現有品調査準備画面 / 11. 調査登録内容修正画面'),
      @('対象URL', '/offline-prep / /registration-edit'),
      @('主機能', 'マスタパッケージ取得、調査結果送信、送信後データ一覧表示、修正、写真参照/削除、確定')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'APIの位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、オフライン調査に必要なマスタパッケージを端末へ配布し、端末に保持した調査結果をバックエンドへ取り込み、その後に未確定データをオンラインで修正・確定するための I/F を提供する。' },
    @{ Type = 'Paragraph'; Text = '調査場所選択、現有品入力、履歴表示は PWA のローカル実装として扱い、これらの画面単位の個別APIは設けない。送信後データの一覧表示、インライン編集、写真モーダル、確定のみ `/registration-edit` の API 対象とする。' },
    @{ Type = 'Heading2'; Text = '画面とAPIの関係' },
    @{ Type = 'Numbered'; Items = @(
      'マスタデータをダウンロード押下時にマスタパッケージ取得 API を呼び出す',
      'データを送信押下時に調査結果アップロード API を呼び出す',
      '調査登録内容修正画面の初期表示・フィルタ変更時に調査レコード一覧取得 API を呼び出す',
      '写真枚数押下時に調査写真一覧取得 API を呼び出す',
      'インライン編集保存時に調査レコード更新 API を呼び出す',
      '写真削除時に調査写真削除 API を呼び出す',
      '確定・一括確定押下時に調査レコード確定 API を呼び出す'
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル', '利用内容', '主な項目'); Rows = @(
      @('facilities', 'マスタパッケージ内の施設情報、修正画面の施設整合確認', 'facility_id, facility_name'),
      @('facility_locations', 'ロケーション候補の配布、修正画面のロケーション正本', 'facility_location_id, facility_id, building, floor, department_name, section_name, room_name'),
      @('asset_categories / asset_large_classes / asset_medium_classes / asset_items / manufacturers / models', '分類マスタパッケージの配布、修正画面の分類表示/更新', '各マスタID, 表示名, 並び順, deleted_at'),
      @('asset_survey_sessions', '調査結果アップロード時の親セッション作成', 'asset_survey_session_id, facility_id, created_by_user_id, started_at, ended_at, status'),
      @('asset_survey_records', '調査結果アップロード、一覧表示、修正、確定', 'asset_survey_record_id, asset_survey_session_id, facility_location_id, category_id, large_class_id, medium_class_id, asset_item_id, manufacturer_id, model_id, survey_date, surveyor_user_id, confirmed_by_user_id, confirmed_at, building, floor, department_name, section_name, room_name, qr_identifier, detail_type, parent_asset_survey_record_id, asset_no, equipment_no, serial_no, purchased_on, width_mm, depth_mm, height_mm, remarks, survey_status'),
      @('application_documents', '調査写真の正本保存、削除、代表写真更新', 'application_document_id, asset_survey_record_id, owner_type, document_category, file_name, file_path, is_primary, taken_at, taken_by_user_id, uploaded_by_user_id, uploaded_at, deleted_at'),
      @('asset_survey_photos', '修正画面の写真一覧参照互換VIEW', 'asset_survey_photo_id, asset_survey_record_id, file_name, file_path, is_primary'),
      @('qr_codes', '修正画面のQR表示補助', 'qr_identifier, facility_id')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-04-18T00:00:00Z`）',
      '写真本文は `base64` 文字列で受け取り、バックエンド保存時にオブジェクトストレージへ書き込む'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '本API群で使用する `feature_code` は以下の通りとする。Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。画面表示用の `/auth/context` は UX 用キャッシュであり、各業務 API でも同条件を再判定する。' },
    @{ Type = 'Table'; Headers = @('管理単位名', 'feature_code', '対象処理'); Rows = @(
      @('現有品調査', '`existing_survey`', 'マスタパッケージ取得、調査結果アップロード'),
      @('現調データ修正', '`survey_data_edit`', '送信後データ一覧、写真参照、更新、写真削除、確定')
    ) },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('マスタパッケージ取得 / 調査結果アップロード', '`existing_survey`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '現有品調査の準備・送信を行う'),
      @('調査登録内容修正の一覧 / 写真参照 / 更新 / 写真削除 / 確定', '`survey_data_edit`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '送信後データの修正系処理を行う')
    ) },
    @{ Type = 'Heading2'; Text = '作業対象施設ベースの認可' },
    @{ Type = 'Bullets'; Items = @(
      '各 API は Bearer トークン上の作業対象施設に対する実効 `feature_code` を都度再判定する',
      '`/offline-prep` 系 API は、指定 `facilityId` が Bearer トークン上の作業対象施設IDと一致し、かつ `facilities.deleted_at IS NULL` の未削除施設であることを前提とする',
      '`/registration-edit` 系 API は、対象レコードの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、かつ `facilities.deleted_at IS NULL` の未削除施設であることを前提とする',
      '現有品調査は自施設業務として扱い、協業グループや他施設公開設定は適用しない'
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Heading3'; Text = '基本エラーレスポンス（ErrorResponse）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや補足情報')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API一覧' },
    @{ Type = 'Heading2'; Text = '現有品調査準備（/offline-prep）' },
    @{ Type = 'Table'; Headers = @('機能名', 'Method', 'Path', '概要', '認証'); Rows = @(
      @('マスタパッケージ取得', 'GET', '/offline-prep/master/download', 'オフライン調査に必要なマスタ一式を取得する', '要'),
      @('調査結果アップロード', 'POST', '/offline-prep/survey/upload', 'オフラインで収集した調査結果を送信する', '要')
    ) },
    @{ Type = 'Heading2'; Text = '調査登録内容修正（/registration-edit）' },
    @{ Type = 'Table'; Headers = @('機能名', 'Method', 'Path', '概要', '認証'); Rows = @(
      @('調査レコード一覧取得', 'GET', '/registration-edit/records', '未確定の調査レコード一覧を取得する', '要'),
      @('調査写真一覧取得', 'GET', '/registration-edit/records/{recordId}/photos', '対象レコードの写真一覧を取得する', '要'),
      @('調査レコード更新', 'PUT', '/registration-edit/records/{recordId}', '調査レコードのインライン編集内容を保存する', '要'),
      @('調査写真削除', 'DELETE', '/registration-edit/records/{recordId}/photos/{photoId}', '対象レコードの写真を削除する', '要'),
      @('調査レコード確定', 'POST', '/registration-edit/records/confirm', '選択したレコードを確定する', '要')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 現有品調査機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = 'マスタパッケージ取得（/offline-prep/master/download）'
        Overview = 'オフライン調査で利用する施設・ロケーション・分類マスタ一式を取得する。'
        Method = 'GET'
        Path = '/offline-prep/master/download'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('facilityId', 'query', 'int64', '✓', 'マスタ取得対象の施設ID')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `existing_survey` が有効であること'
        )
        ProcessingLines = @(
          '`facilityId` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する',
          '`facilities` から対象施設の基本情報を取得する',
          '`facility_locations.deleted_at IS NULL` の未削除ロケーションのみを取得する',
          '`asset_categories` / `asset_large_classes` / `asset_medium_classes` / `asset_items` / `manufacturers` / `models` の未削除マスタを取得する',
          '取得結果をオフライン利用しやすいマスタパッケージ形式で返却する'
        )
        ResponseTitle = 'レスポンス（200：OfflinePrepMasterDownloadResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('downloadedAt', 'datetime', '✓', 'サーバーがマスタパッケージを生成した日時'),
          @('facility', 'OfflinePrepFacility', '✓', '対象施設の基本情報'),
          @('facilityLocations', 'OfflinePrepFacilityLocation[]', '✓', '対象施設のロケーション候補'),
          @('assetCategories', 'AssetCategoryOption[]', '✓', 'Category候補'),
          @('assetLargeClasses', 'AssetLargeClassOption[]', '✓', '大分類候補'),
          @('assetMediumClasses', 'AssetMediumClassOption[]', '✓', '中分類候補'),
          @('assetItems', 'AssetItemOption[]', '✓', '品目候補'),
          @('manufacturers', 'ManufacturerOption[]', '✓', 'メーカー候補'),
          @('models', 'ModelOption[]', '✓', '型式候補')
        )
        ResponseSubtables = @(
          @{
            Title = 'facility要素（OfflinePrepFacility）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '施設ID'),
              @('facilityName', 'string', '✓', '施設名')
            )
          },
          @{
            Title = 'facilityLocations要素（OfflinePrepFacilityLocation）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityLocationId', 'int64', '✓', '施設ロケーションID'),
              @('building', 'string', '-', '棟'),
              @('floor', 'string', '-', '階'),
              @('departmentName', 'string', '-', '部門名'),
              @('sectionName', 'string', '-', '部署名'),
              @('roomName', 'string', '-', '室名称')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'OfflinePrepMasterDownloadResponse'),
          @('400', '不正な施設指定', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `existing_survey` なし、または対象施設不一致', 'ErrorResponse'),
          @('404', '施設が存在しない、または削除済み', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '調査結果アップロード（/offline-prep/survey/upload）'
        Overview = 'オフラインで収集した調査データ一式を1セッションとしてアップロードする。'
        Method = 'POST'
        Path = '/offline-prep/survey/upload'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエスト（OfflineSurveyUploadRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('facilityId', 'int64', '✓', '調査対象施設ID'),
          @('startedAt', 'datetime', '-', '端末上の調査開始日時'),
          @('endedAt', 'datetime', '-', '端末上の調査終了日時'),
          @('records', 'OfflineSurveyRecordInput[]', '✓', 'アップロード対象の調査レコード一覧')
        )
        RequestSubtables = @(
          @{
            Title = 'records要素（OfflineSurveyRecordInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('clientRecordKey', 'string', '✓', '端末内の一時識別子。親子紐づけ解決用'),
              @('parentClientRecordKey', 'string', '-', '本体/明細/付属品の親端末識別子'),
              @('facilityLocationId', 'int64', '-', '既存ロケーションへ解決できた場合の施設ロケーションID'),
              @('surveyDate', 'date', '-', '調査日'),
              @('building', 'string', '-', '棟の表示値スナップショット'),
              @('floor', 'string', '-', '階の表示値スナップショット'),
              @('departmentName', 'string', '-', '部門名の表示値スナップショット'),
              @('sectionName', 'string', '-', '部署名の表示値スナップショット'),
              @('roomName', 'string', '-', '室名称'),
              @('qrIdentifier', 'string', '-', '読取QR識別子'),
              @('detailType', 'string', '-', '本体 / 明細 / 付属品'),
              @('categoryId', 'int64', '-', 'Category ID'),
              @('largeClassId', 'int64', '-', '大分類ID'),
              @('mediumClassId', 'int64', '-', '中分類ID'),
              @('assetItemId', 'int64', '-', '品目ID'),
              @('manufacturerId', 'int64', '-', 'メーカーID'),
              @('modelId', 'int64', '-', '型式ID'),
              @('categoryName', 'string', '-', 'Category表示値'),
              @('largeClassName', 'string', '-', '大分類表示値'),
              @('mediumClassName', 'string', '-', '中分類表示値'),
              @('assetItemName', 'string', '-', '品目表示値'),
              @('manufacturerName', 'string', '-', 'メーカー表示値'),
              @('modelName', 'string', '-', '型式表示値'),
              @('assetNo', 'string', '-', '資産番号'),
              @('equipmentNo', 'string', '-', 'ME番号'),
              @('serialNo', 'string', '-', 'シリアル番号'),
              @('purchasedOn', 'date', '-', '購入日'),
              @('widthMm', 'string', '-', '幅'),
              @('depthMm', 'string', '-', '奥行'),
              @('heightMm', 'string', '-', '高さ'),
              @('remarks', 'string', '-', '備考'),
              @('registeredAt', 'datetime', '-', '端末上の登録日時'),
              @('photos', 'OfflineSurveyPhotoInput[]', '-', '当該レコードの写真一覧')
            )
          },
          @{
            Title = 'photos要素（OfflineSurveyPhotoInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('localPhotoUuid', 'string', '✓', '端末で採番した写真UUID'),
              @('fileName', 'string', '-', '端末保持時の表示名。`application_documents.file_name` には保存せず、サーバー側でシステム生成名を採番する'),
              @('contentType', 'string', '✓', 'MIME Type'),
              @('fileBodyBase64', 'string', '✓', '写真本文の base64'),
              @('takenAt', 'datetime', '-', '撮影日時'),
              @('isPrimary', 'boolean', '-', '代表写真フラグ')
            )
          }
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `existing_survey` が有効であること'
        )
        ProcessingLines = @(
          '`facilityId` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する',
          '`asset_survey_sessions` に1件作成し、1回の送信単位をセッションとして記録する。`created_by_user_id` には認証ユーザーIDを設定する',
          '`records[].facilityLocationId`、`categoryId`、`largeClassId`、`mediumClassId`、`assetItemId`、`manufacturerId`、`modelId` が指定された場合は、いずれも未削除の参照先であることを検証する',
          '`records` の各要素を `asset_survey_records` へ保存し、各レコードの `facility_id` にはトップレベルの `facilityId` を設定する',
          '各レコードの `surveyor_user_id` には認証ユーザーIDを設定する',
          '`clientRecordKey` / `parentClientRecordKey` を用いて、親子関係を `parent_asset_survey_record_id` へ解決する',
          '写真は `application_documents` に `owner_type=''ASSET_SURVEY_RECORD''` / `document_category=''PHOTO''` として保存し、`taken_by_user_id` と `uploaded_by_user_id` には認証ユーザーIDを設定する',
          '現有品調査写真の `file_name` は、受信した `photos[].fileName` をそのまま使わず、`survey-photo_YYYYMMDD_HHMMSS_{local_photo_uuid先頭8桁}.{拡張子}` 形式のシステム生成名を採番して保存する',
          '写真保存時の `file_path` は `asset-survey/{facility_id}/{YYYY}/{MM}/{local_photo_uuid}.{拡張子}` 形式で生成する',
          '写真保存時の `uploaded_at` にはサーバー受信時刻を設定する',
          'アップロード完了後、セッションステータスを `COMPLETED` へ更新する'
        )
        ResponseTitle = 'レスポンス（201：OfflineSurveyUploadResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('assetSurveySessionId', 'int64', '✓', '作成した調査セッションID'),
          @('uploadedRecordCount', 'int32', '✓', '登録した調査レコード件数'),
          @('uploadedPhotoCount', 'int32', '✓', '登録した写真件数'),
          @('status', 'string', '✓', 'セッション最終ステータス')
        )
        StatusRows = @(
          @('201', 'アップロード成功', 'OfflineSurveyUploadResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `existing_survey` なし、または対象施設不一致', 'ErrorResponse'),
          @('404', '施設または参照マスタが存在しない、または削除済み', 'ErrorResponse'),
          @('422', '親子紐づけや分類階層の整合が取れない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '調査レコード一覧取得（/registration-edit/records）'
        Overview = '未確定状態の調査レコード一覧を、フィルタ条件付きで取得する。'
        Method = 'GET'
        Path = '/registration-edit/records'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('facilityId', 'query', 'int64', '✓', '対象施設ID'),
          @('building', 'query', 'string', '-', '棟フィルタ'),
          @('floor', 'query', 'string', '-', '階フィルタ'),
          @('departmentName', 'query', 'string', '-', '部門フィルタ'),
          @('sectionName', 'query', 'string', '-', '部署フィルタ'),
          @('surveyorUserId', 'query', 'int64', '-', '調査担当者フィルタ'),
          @('categoryId', 'query', 'int64', '-', 'Categoryフィルタ'),
          @('largeClassId', 'query', 'int64', '-', '大分類フィルタ'),
          @('mediumClassId', 'query', 'int64', '-', '中分類フィルタ')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_data_edit` が有効であること'
        )
        ProcessingLines = @(
          '`facilityId` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する',
          '`asset_survey_records.deleted_at IS NULL` かつ `asset_survey_records.survey_status=''DRAFT''` の未確定レコードのみを対象にする',
          '選択施設内の `DRAFT` レコードは、作成者・調査担当者に関係なく一覧対象とし、同一施設内では別ユーザーが続き作業を引き継げる前提で返却する',
          '`users` を結合して調査担当者名を解決する',
          '`application_documents` を集計して写真枚数を算出する',
          'フィルタ条件は AND 条件で適用する',
          '画面要件上ページングは定義しない'
        )
        ResponseTitle = 'レスポンス（200：RegistrationEditRecordListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '絞り込み後件数'),
          @('items', 'RegistrationEditRecordSummary[]', '✓', '調査レコード一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（RegistrationEditRecordSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('assetSurveyRecordId', 'int64', '✓', '調査レコードID'),
              @('qrIdentifier', 'string', '-', 'QR識別子'),
              @('building', 'string', '-', '棟'),
              @('floor', 'string', '-', '階'),
              @('departmentName', 'string', '-', '部門名'),
              @('sectionName', 'string', '-', '部署名'),
              @('roomName', 'string', '-', '室名称'),
              @('categoryId', 'int64', '-', 'Category ID'),
              @('largeClassId', 'int64', '-', '大分類ID'),
              @('mediumClassId', 'int64', '-', '中分類ID'),
              @('assetItemId', 'int64', '-', '品目ID'),
              @('manufacturerId', 'int64', '-', 'メーカーID'),
              @('modelId', 'int64', '-', '型式ID'),
              @('categoryName', 'string', '-', 'Category表示値'),
              @('largeClassName', 'string', '-', '大分類表示値'),
              @('mediumClassName', 'string', '-', '中分類表示値'),
              @('assetItemName', 'string', '-', '品目表示値'),
              @('manufacturerName', 'string', '-', 'メーカー表示値'),
              @('modelName', 'string', '-', '型式表示値'),
              @('widthMm', 'string', '-', 'W'),
              @('depthMm', 'string', '-', 'D'),
              @('heightMm', 'string', '-', 'H'),
              @('assetNo', 'string', '-', '資産番号'),
              @('equipmentNo', 'string', '-', 'ME番号'),
              @('serialNo', 'string', '-', 'シリアル番号'),
              @('purchasedOn', 'date', '-', '購入年月日'),
              @('remarks', 'string', '-', '備考'),
              @('surveyDate', 'date', '-', '調査日'),
              @('surveyorUserId', 'int64', '✓', '調査担当者ユーザーID'),
              @('surveyorName', 'string', '✓', '調査担当者表示名'),
              @('photoCount', 'int32', '✓', '写真枚数'),
              @('detailType', 'string', '-', '本体 / 明細 / 付属品'),
              @('parentAssetSurveyRecordId', 'int64', '-', '親調査レコードID')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'RegistrationEditRecordListResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `survey_data_edit` なし、または対象施設不一致', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '調査写真一覧取得（/registration-edit/records/{recordId}/photos）'
        Overview = '写真モーダル表示用に、対象レコードの写真一覧を取得する。'
        Method = 'GET'
        Path = '/registration-edit/records/{recordId}/photos'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('recordId', 'path', 'int64', '✓', '調査レコードID')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_data_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `asset_survey_records` が `deleted_at IS NULL` で存在し、その `facility_id` が Bearer トークン上の作業対象施設IDと一致することを検証する',
          '対象レコードの `facilities.deleted_at IS NULL` を検証する',
          '`asset_survey_photos` VIEW から対象レコードの写真を取得する',
          '代表写真フラグと撮影日時をあわせて返却する'
        )
        ResponseTitle = 'レスポンス（200：RegistrationEditPhotoListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('items', 'RegistrationEditPhoto[]', '✓', '写真一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（RegistrationEditPhoto）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('assetSurveyPhotoId', 'int64', '✓', '調査写真ID'),
              @('fileName', 'string', '✓', 'ファイル名'),
              @('filePath', 'string', '✓', 'ファイルパス'),
              @('takenAt', 'datetime', '-', '撮影日時'),
              @('takenByUserId', 'int64', '-', '撮影者ユーザーID'),
              @('isPrimary', 'boolean', '✓', '代表写真フラグ')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'RegistrationEditPhotoListResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `survey_data_edit` なし、または対象施設不一致', 'ErrorResponse'),
          @('404', '対象レコードが存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '調査レコード更新（/registration-edit/records/{recordId}）'
        Overview = '調査登録内容修正画面のインライン編集内容を保存する。'
        Method = 'PUT'
        Path = '/registration-edit/records/{recordId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('recordId', 'path', 'int64', '✓', '更新対象の調査レコードID')
        )
        RequestTitle = 'リクエスト（RegistrationEditRecordUpdateRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('facilityLocationId', 'int64', '-', '施設ロケーションID'),
          @('building', 'string', '-', '棟の表示値'),
          @('floor', 'string', '-', '階の表示値'),
          @('departmentName', 'string', '-', '部門名の表示値'),
          @('sectionName', 'string', '-', '部署名の表示値'),
          @('roomName', 'string', '-', '室名称'),
          @('detailType', 'string', '-', '本体 / 明細 / 付属品'),
          @('parentAssetSurveyRecordId', 'int64', '-', '親調査レコードID'),
          @('categoryId', 'int64', '-', 'Category ID'),
          @('largeClassId', 'int64', '-', '大分類ID'),
          @('mediumClassId', 'int64', '-', '中分類ID'),
          @('assetItemId', 'int64', '-', '品目ID'),
          @('manufacturerId', 'int64', '-', 'メーカーID'),
          @('modelId', 'int64', '-', '型式ID'),
          @('categoryName', 'string', '-', 'Category表示値'),
          @('largeClassName', 'string', '-', '大分類表示値'),
          @('mediumClassName', 'string', '-', '中分類表示値'),
          @('assetItemName', 'string', '-', '品目表示値'),
          @('manufacturerName', 'string', '-', 'メーカー表示値'),
          @('modelName', 'string', '-', '型式表示値'),
          @('assetNo', 'string', '-', '資産番号'),
          @('equipmentNo', 'string', '-', 'ME番号'),
          @('serialNo', 'string', '-', 'シリアル番号'),
          @('purchasedOn', 'date', '-', '購入年月日'),
          @('widthMm', 'string', '-', 'W'),
          @('depthMm', 'string', '-', 'D'),
          @('heightMm', 'string', '-', 'H'),
          @('remarks', 'string', '-', '備考')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_data_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `asset_survey_records` が `deleted_at IS NULL` で存在し、その `facility_id` が Bearer トークン上の作業対象施設IDと一致することを検証する',
          '対象レコードの `facilities.deleted_at IS NULL` を検証する',
          '対象レコードが `survey_status=''DRAFT''` であることを確認する',
          '`facilityLocationId` や各分類マスタIDが指定された場合は、いずれも未削除の参照先であることを検証する',
          '分類マスタIDは「親は子を兼ねる」前提で整合性を検証する',
          '自由記述のまま保存する場合は表示値を保持し、未確定のマスタIDは `NULL` のままとする',
          '本体/明細/付属品の紐付け更新時は `detail_type` と `parent_asset_survey_record_id` を更新する',
          '更新後の `asset_survey_records` を返却する'
        )
        ResponseTitle = 'レスポンス（200：RegistrationEditRecordResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'RegistrationEditRecordSummary', '✓', '更新後の調査レコード')
        )
        StatusRows = @(
          @('200', '更新成功', 'RegistrationEditRecordResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `survey_data_edit` なし、または対象施設不一致', 'ErrorResponse'),
          @('404', '対象レコードが存在しない', 'ErrorResponse'),
          @('409', '既に確定済みのため更新不可', 'ErrorResponse'),
          @('422', '分類階層または親子関係の整合が取れない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '調査写真削除（/registration-edit/records/{recordId}/photos/{photoId}）'
        Overview = '対象レコードの調査写真を削除し、必要に応じて代表写真を付け替える。'
        Method = 'DELETE'
        Path = '/registration-edit/records/{recordId}/photos/{photoId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('recordId', 'path', 'int64', '✓', '調査レコードID'),
          @('photoId', 'path', 'int64', '✓', '調査写真ID'),
          @('nextPrimaryPhotoId', 'query', 'int64', '-', '代表写真削除時にフロントエンドが選択した次代表写真ID')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_data_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `asset_survey_records` が `deleted_at IS NULL` で存在し、その `facility_id` が Bearer トークン上の作業対象施設IDと一致することを検証する',
          '対象写真が同一レコード配下の未削除 `application_documents` であることを検証する',
          '`application_documents.deleted_at` を更新して論理削除する',
          '削除対象が代表写真で、他に写真が残る場合は、フロントエンドが指定した `nextPrimaryPhotoId` に `is_primary=true` を付け替える',
          '`nextPrimaryPhotoId` が指定された場合は、同一 `asset_survey_record_id` に属する未削除写真であることを検証する',
          '写真が0件になった場合は代表写真なし状態とする'
        )
        ResponseTitle = 'レスポンス（200：RegistrationEditPhotoDeleteResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('remainingPhotoCount', 'int32', '✓', '削除後の残写真件数'),
          @('newPrimaryPhotoId', 'int64', '-', '新たに代表写真となった写真ID')
        )
        StatusRows = @(
          @('200', '削除成功', 'RegistrationEditPhotoDeleteResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `survey_data_edit` なし、または対象施設不一致', 'ErrorResponse'),
          @('404', '対象写真が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '調査レコード確定（/registration-edit/records/confirm）'
        Overview = '選択した調査レコードを確定し、一覧から除外する。'
        Method = 'POST'
        Path = '/registration-edit/records/confirm'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエスト（RegistrationEditConfirmRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('recordIds', 'int64[]', '✓', '確定対象の調査レコードID一覧')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_data_edit` が有効であること'
        )
        ProcessingLines = @(
          '指定 `recordIds` の対象 `asset_survey_records` がすべて `deleted_at IS NULL` で存在し、その `facility_id` が Bearer トークン上の作業対象施設IDと一致することを検証する',
          '対象レコードの `facilities.deleted_at IS NULL` を検証する',
          '対象レコードが `survey_status=''DRAFT''` であることを確認する',
          '確定条件として `category_id` / `large_class_id` / `medium_class_id` / `asset_item_id` が設定されていることを検証する',
          '`manufacturer_id` / `model_id` は未設定でも許可する',
          '条件を満たしたレコードの `survey_status` を `CONFIRMED` へ更新し、`confirmed_by_user_id` に認証ユーザーID、`confirmed_at` にサーバー時刻を設定する',
          '複数ユーザーが同一レコードを表示している場合は先に `CONFIRMED` へ更新したユーザーを正とし、後続ユーザーの確定要求は更新対象が `DRAFT` でなくなっているため 409 を返す'
        )
        ResponseTitle = 'レスポンス（200：RegistrationEditConfirmResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('confirmedCount', 'int32', '✓', '確定した件数'),
          @('failedRecordIds', 'int64[]', '-', '確定条件を満たさず失敗したレコードID一覧')
        )
        StatusRows = @(
          @('200', '確定成功', 'RegistrationEditConfirmResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `survey_data_edit` なし、または対象施設不一致', 'ErrorResponse'),
          @('409', '確定条件未達のレコードが含まれる', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '必要権限' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定基準', '説明'); Rows = @(
      @('マスタパッケージ取得 / 調査結果アップロード', '`existing_survey`', 'Bearer トークン上の作業対象施設に対して実効 `existing_survey` を持つこと', '現有品調査の準備・送信を行う'),
      @('調査登録内容修正の一覧 / 写真参照 / 更新 / 写真削除 / 確定', '`survey_data_edit`', 'Bearer トークン上の作業対象施設に対して実効 `survey_data_edit` を持つこと', '送信後データの修正系処理を行う')
    ) },
    @{ Type = 'Heading2'; Text = 'データ整合ルール' },
    @{ Type = 'Bullets'; Items = @(
      '現有品調査は自施設業務として扱い、協業グループや他施設公開設定は適用しない',
      '`/offline-prep` の `facilityId` は Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設でなければならない',
      '`/registration-edit` の対象レコードは `asset_survey_records.deleted_at IS NULL` かつ `facility_id` が Bearer トークン上の作業対象施設IDと一致するものだけを扱う',
      '調査登録内容修正では、表示値スナップショットとマスタIDの両方を保持する前提で更新する',
      '接続状態表示、未送信件数、端末内一時保存の削除はクライアント側責務とし、本 API では管理しない'
    ) },
    @{ Type = 'Heading2'; Text = '実装前提' },
    @{ Type = 'Bullets'; Items = @(
      'API対象は `/offline-prep` と `/registration-edit` とし、`/survey-location` / `/asset-survey` / `/history` はPWAのフロントエンド実装として扱う',
      '画面表示制御は `/auth/context` の `existing_survey` / `survey_data_edit` を参照して行い、`existing_survey` は `/offline-prep` と PWA 導線、`survey_data_edit` は `/registration-edit` の一覧・編集・写真削除・確定ボタンを出し分ける',
      'アップロード成功後に端末データを削除するかどうかはクライアント側で制御する'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '説明'); Rows = @(
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
      @('AUTH_403_EXISTING_SURVEY_DENIED', '403', '作業対象施設に対する実効 `existing_survey` がない、または対象施設不一致'),
      @('AUTH_403_SURVEY_DATA_EDIT_DENIED', '403', '作業対象施設に対する実効 `survey_data_edit` がない、または対象施設不一致'),
      @('OFFLINE_PREP_400_INVALID_INPUT', '400', '入力形式または必須項目が不正'),
      @('OFFLINE_PREP_404_FACILITY_NOT_FOUND', '404', '対象施設が存在しない、または削除済み'),
      @('OFFLINE_PREP_404_MASTER_NOT_FOUND', '404', '参照マスタが存在しない、または削除済み'),
      @('OFFLINE_PREP_422_RECORD_RELATION_INVALID', '422', '親子関係または分類階層の整合が取れない'),
      @('REG_EDIT_404_RECORD_NOT_FOUND', '404', '対象調査レコードが存在しない'),
      @('REG_EDIT_404_PHOTO_NOT_FOUND', '404', '対象写真が存在しない'),
      @('REG_EDIT_409_ALREADY_CONFIRMED', '409', '既に確定済みのため更新できない'),
      @('REG_EDIT_409_CONFIRM_CONDITION_FAILED', '409', '確定条件を満たしていない'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Bullets'; Items = @(
      '現有品調査API設計書の対象画面範囲を変更する場合は、先に `taniguchi/機能要件.md` の方針メモを更新する',
      '写真保存ルールやオブジェクトキー命名規則を変更する場合は、`application_documents` と `asset_survey_photos` VIEW の整合を必ず確認する',
      'PWA 画面群のローカル状態管理は本設計書の対象外とし、API追加時はオンライン画面かオフライン同期I/Fかを明確に区別する'
    ) }
  )
}
