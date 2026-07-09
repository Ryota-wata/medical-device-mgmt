$existingSurveyPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `existing_survey` が有効であること'
)

$surveyDataEditPermissionLines = @(
  '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_data_edit` が有効であること'
)

@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_現有品調査.docx'
  ScreenLabel = '現有品調査'
  CoverDateText = '2026年6月18日'
  CoverVersionText = '1.1'
  RevisionVersionText = '1.1'
  RevisionDateText = '2026/6/18'
  RevisionSummaryText = '調査登録内容修正の本体・明細紐付けAPI追加と既存API仕様の明確化'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、現有品調査準備画面（`/offline-prep`）および調査登録内容修正画面（`/registration-edit`）で利用する API の設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      'オフライン利用前に必要なマスタパッケージ取得 I/F',
      'オフラインで収集した調査結果アップロード I/F',
      '送信後データの一覧表示、修正、明細紐付け、写真参照/削除、確定 I/F',
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
      @('主機能', 'マスタパッケージ取得、調査結果送信、送信後データ一覧表示、修正、本体・明細紐付け、写真参照/削除、確定')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'APIの位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、オフライン調査に必要なマスタパッケージを端末へ配布し、端末に保持した調査結果をバックエンドへ取り込み、その後に未確定データをオンラインで修正・確定するための I/F を提供する。' },
    @{ Type = 'Paragraph'; Text = '調査場所選択、現有品入力、履歴表示は PWA のローカル実装として扱い、これらの画面単位の個別APIは設けない。送信後データの一覧表示、インライン編集、明細紐付け、写真モーダル、確定のみ `/registration-edit` の API 対象とする。' },
    @{ Type = 'Heading2'; Text = '画面とAPIの関係' },
    @{ Type = 'Numbered'; Items = @(
      'マスタデータをダウンロード押下時にマスタパッケージ取得 API を呼び出す',
      'データを送信押下時に調査結果アップロード API を呼び出す',
      '調査登録内容修正画面の初期表示・フィルタ変更時に調査レコード一覧取得 API を呼び出す',
      '写真枚数押下時に調査写真一覧取得 API を呼び出す',
      'インライン編集保存時に調査レコード更新 API を呼び出す',
      '本体に設定押下時に調査レコード本体設定 API を呼び出す',
      '明細として紐付ける押下時に調査レコード明細紐付け API を呼び出す',
      '紐付け解除押下時に調査レコード明細紐付け解除 API を呼び出す',
      '写真削除時に調査写真削除 API を呼び出す',
      '確定・一括確定押下時に調査レコード確定 API を呼び出す'
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル', '利用内容', '主な項目'); Rows = @(
      @('facilities', 'マスタパッケージ内の施設情報、修正画面の施設整合確認、共有システム管理者アカウントの未削除施設判定', 'facility_id, facility_name, deleted_at'),
      @('facility_locations', 'ロケーション候補の配布、修正画面のロケーション正本', 'facility_location_id, facility_id, building, floor, department_name, section_name, room_name'),
      @('asset_categories / asset_large_classes / asset_medium_classes / asset_items / manufacturers / models', '分類マスタパッケージの配布、修正画面の分類表示/更新', '各マスタID, 親マスタID, 表示名, is_active。sort_orderはCategory/大分類/中分類のみ'),
      @('ship_asset_masters', '修正画面で選択したSHIP資産マスタと分類組み合わせの整合確認', 'ship_asset_master_id, category_id, large_class_id, medium_class_id, asset_item_id, manufacturer_id, model_id, is_active'),
      @('users', '調査担当者名の解決、送信者/確定者の監査、共有システム管理者アカウント判定', 'user_id, name, account_type'),
      @('asset_survey_sessions', '調査結果アップロード時の親セッション作成', 'asset_survey_session_id, facility_id, created_by_user_id, started_at, ended_at, status'),
      @('asset_survey_records', '調査結果アップロード、一覧表示、修正、本体・明細紐付け、確定', 'asset_survey_record_id, asset_survey_session_id, facility_location_id, ship_asset_master_id, category_id, large_class_id, medium_class_id, asset_item_id, manufacturer_id, model_id, survey_date, surveyor_user_id, confirmed_by_user_id, confirmed_at, building, floor, department_name, section_name, room_name, qr_identifier, detail_type, parent_asset_survey_record_id, asset_no, equipment_no, serial_no, purchased_on, width_mm, depth_mm, height_mm, remarks, survey_status'),
      @('application_documents', '調査写真の正本保存、削除、代表写真更新', 'application_document_id, asset_survey_record_id, owner_type, document_category, file_name, file_path, is_primary, taken_at, taken_by_user_id, uploaded_by_user_id, uploaded_at, deleted_at'),
      @('asset_survey_photos', '修正画面の写真一覧参照互換VIEW', 'asset_survey_photo_id, asset_survey_record_id, file_name, file_path, is_primary')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-04-18T00:00:00Z`）',
      '写真本文は `base64` 文字列で受け取り、バックエンド保存時に Amazon S3 へ書き込む。DB には `application_documents.file_path` として S3 オブジェクトキーを保持し、S3 キー自体はレスポンスで直接返却しない'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '本API群で使用する `feature_code` は以下の通りとする。通常アカウントでは、Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）では、作業対象施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず API 実行を許可する。画面表示用の `/auth/context` は UX 用キャッシュであり、各業務 API でも同条件を再判定する。' },
    @{ Type = 'Table'; Headers = @('管理単位名', 'feature_code', '対象処理'); Rows = @(
      @('現有品調査', '`existing_survey`', 'マスタパッケージ取得、調査結果アップロード'),
      @('現調データ修正', '`survey_data_edit`', '送信後データ一覧、写真参照、更新、本体設定、明細紐付け、紐付け解除、写真削除、確定')
    ) },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('マスタパッケージ取得 / 調査結果アップロード', '`existing_survey`', '通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings` / 共有システム管理者: `users.account_type`, `facilities.deleted_at`', '通常アカウントは作業対象施設で `existing_survey` が実効有効であること。共有システム管理者は作業対象施設が未削除であること。現有品調査の準備・送信を行う'),
      @('調査登録内容修正の一覧 / 写真参照 / 更新 / 本体設定 / 明細紐付け / 紐付け解除 / 写真削除 / 確定', '`survey_data_edit`', '通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings` / 共有システム管理者: `users.account_type`, `facilities.deleted_at`', '通常アカウントは作業対象施設で `survey_data_edit` が実効有効であること。共有システム管理者は作業対象施設が未削除であること。送信後データの修正系処理を行う')
    ) },
    @{ Type = 'Heading2'; Text = '永続化とトランザクション境界' },
    @{ Type = 'Bullets'; Items = @(
      '`POST /offline-prep/survey/upload` は 1 リクエストを 1 調査セッションとして扱い、`asset_survey_sessions` を親、`asset_survey_records` を子、写真メタデータを `application_documents` に保存する。`asset_survey_photos` は `application_documents` からの互換 VIEW であり、直接更新しない',
      '調査結果アップロードは DB 更新を 1 トランザクションで完結させ、Amazon S3 への写真保存に失敗した場合は `asset_survey_sessions` / `asset_survey_records` / `application_documents` をロールバックし、保存済み S3 オブジェクトも破棄する',
      '`localPhotoUuid` はファイル名・ファイルパス生成に使う入力であり、業務テーブルの正本カラムとしては保持しない',
      '`/asset-survey` 画面で行う QR 重複チェックは PWA 側責務とし、`POST /offline-prep/survey/upload` は重複チェック済みの `qrIdentifier` スナップショットを保存する',
      '`PUT /registration-edit/records/{recordId}` は通常の行編集項目のみを保存し、明細区分・親調査レコードIDの操作は専用APIで扱う',
      '`POST /registration-edit/records/{recordId}/set-main`、`POST /registration-edit/records/{parentRecordId}/details/link`、`POST /registration-edit/records/{recordId}/details/unlink` は `asset_survey_records.detail_type` / `parent_asset_survey_record_id` を操作タイミングで更新する',
      '`DELETE /registration-edit/records/{recordId}/photos/{photoId}` は `application_documents` のみ、`POST /registration-edit/records/confirm` は対象 `asset_survey_records` のみを更新する',
      '更新系 API は 1 回の呼び出しを 1 DB トランザクションで完結させる。写真削除 API は論理削除と代表写真付け替えに加えて Amazon S3 の DeleteObject を同一 API 処理内で実行し、DeleteObject 成功後に DB トランザクションを commit する'
    ) },
    @{ Type = 'Heading2'; Text = '作業対象施設ベースの認可' },
    @{ Type = 'Bullets'; Items = @(
      '各 API は Bearer トークン上の作業対象施設に対する実効 `feature_code` または共有システム管理者例外を都度再判定する',
      '通常アカウントでは、作業対象施設に対する `user_facility_assignments` の有効割当、対象 `feature_code` の `facility_feature_settings`、`user_facility_feature_settings` のいずれかを満たさない場合は 403 を返却する',
      '共有システム管理者アカウントでは、作業対象施設の `facilities.deleted_at IS NULL` を確認できれば通常判定をバイパスし、削除済み施設の場合は 403 を返却する',
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
      @('調査レコード本体設定', 'POST', '/registration-edit/records/{recordId}/set-main', '未設定の調査レコードを本体に設定する', '要'),
      @('調査レコード明細紐付け', 'POST', '/registration-edit/records/{parentRecordId}/details/link', '選択した未設定の既存調査レコードを親本体の明細として一括紐付けする', '要'),
      @('調査レコード明細紐付け解除', 'POST', '/registration-edit/records/{recordId}/details/unlink', '明細行の親子紐付けを解除する', '要'),
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
        PermissionLines = $existingSurveyPermissionLines
        ProcessingLines = @(
          '`facilityId` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する',
          '`facilities` から対象施設の基本情報を取得する',
          '`facility_locations.deleted_at IS NULL` の未削除ロケーションのみを取得する',
          '`asset_categories` / `asset_large_classes` / `asset_medium_classes` / `asset_items` / `manufacturers` / `models` の `is_active=true` のマスタだけを取得する',
          '分類マスタは親IDを同時に返す。`asset_categories` / `asset_large_classes` / `asset_medium_classes` は `sort_order ASC, 各ID ASC`、その他は各ID昇順を既定並び順とする',
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
          },
          @{
            Title = 'assetCategories要素（AssetCategoryOption）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('categoryId', 'int64', '✓', 'Category ID'),
              @('categoryName', 'string', '✓', 'Category名'),
              @('sortOrder', 'int32', '✓', '並び順')
            )
          },
          @{
            Title = 'assetLargeClasses要素（AssetLargeClassOption）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('largeClassId', 'int64', '✓', '大分類ID'),
              @('categoryId', 'int64', '✓', '親Category ID'),
              @('largeClassName', 'string', '✓', '大分類名'),
              @('sortOrder', 'int32', '✓', '並び順')
            )
          },
          @{
            Title = 'assetMediumClasses要素（AssetMediumClassOption）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('mediumClassId', 'int64', '✓', '中分類ID'),
              @('largeClassId', 'int64', '✓', '親大分類ID'),
              @('mediumClassName', 'string', '✓', '中分類名'),
              @('sortOrder', 'int32', '✓', '並び順')
            )
          },
          @{
            Title = 'assetItems要素（AssetItemOption）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('assetItemId', 'int64', '✓', '品目ID'),
              @('mediumClassId', 'int64', '✓', '親中分類ID'),
              @('assetItemName', 'string', '✓', '品目名')
            )
          },
          @{
            Title = 'manufacturers要素（ManufacturerOption）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('manufacturerId', 'int64', '✓', 'メーカーID'),
              @('assetItemId', 'int64', '✓', '親品目ID'),
              @('manufacturerName', 'string', '✓', 'メーカー名')
            )
          },
          @{
            Title = 'models要素（ModelOption）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('modelId', 'int64', '✓', '型式ID'),
              @('manufacturerId', 'int64', '✓', '親メーカーID'),
              @('modelName', 'string', '✓', '型式名')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'OfflinePrepMasterDownloadResponse'),
          @('400', '不正な施設指定', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `existing_survey` なし、共有システム管理者で作業対象施設が削除済み、または対象施設不一致', 'ErrorResponse'),
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
          @('records', 'OfflineSurveyRecordInput[]', '✓', 'アップロード対象の調査レコード一覧。1件以上必須')
        )
        RequestSubtables = @(
          @{
            Title = 'records要素（OfflineSurveyRecordInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityLocationId', 'int64', '-', '既存ロケーションへ解決できた場合の施設ロケーションID'),
              @('surveyDate', 'date', '-', '調査日'),
              @('building', 'string', '-', '棟の表示値スナップショット'),
              @('floor', 'string', '-', '階の表示値スナップショット'),
              @('departmentName', 'string', '-', '部門名の表示値スナップショット'),
              @('sectionName', 'string', '-', '部署名の表示値スナップショット'),
              @('roomName', 'string', '-', '室名称'),
              @('qrIdentifier', 'string', '-', '読取QR識別子'),
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
        PermissionLines = $existingSurveyPermissionLines
        ProcessingLines = @(
          '`facilityId` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する',
          '`records` が1件以上あること、すべての `photos[].localPhotoUuid` がUUID形式でリクエスト内で重複しないことを検証する',
          '`asset_survey_sessions` に1件作成し、1回の送信単位をセッションとして記録する。`created_by_user_id` には認証ユーザーIDを設定する',
          '`records[].facilityLocationId` が指定された場合は、同一施設の `facility_locations.deleted_at IS NULL` の行であることを検証する',
          '`categoryId`、`largeClassId`、`mediumClassId`、`assetItemId`、`manufacturerId`、`modelId` が指定された場合は、対応する分類マスタが `is_active=true` であることを検証する',
          '分類マスタIDは「親は子を兼ねる」前提で整合性を検証し、不整合な組み合わせは 422 とする',
          '`records[].facilityLocationId` が指定された場合は、`facility_locations` の当該行から `building` / `floor` / `department_name` / `section_name` / `room_name` を正本スナップショットとして保存する。指定されない場合はリクエストの表示値を保存する',
          '分類マスタIDが指定された場合は、各マスタの正規名称を再解決して `*_name` に保存する。ID 未指定時はリクエストの表示値を保存し、対応する ID は `NULL` のままとする',
          '`records` の各要素を `asset_survey_records` へ保存し、各レコードの `facility_id` にはトップレベルの `facilityId` を設定する',
          '各レコードの `surveyor_user_id` には認証ユーザーIDを設定する',
          '`records[].qrIdentifier` は `/asset-survey` 画面で重複チェック済みの値を受け取り、`asset_survey_records.qr_identifier` のスナップショットとして保存する',
          'アップロード時点では各レコードを独立した未確定調査データとして作成し、`detail_type` / `parent_asset_survey_record_id` は `NULL` で開始する。本体 / 明細の紐付けは `/registration-edit` で行う。本画面では付属品区分は作成しない',
          '写真本文は Amazon S3 へ PutObject し、写真メタデータは `application_documents` に `owner_type=''ASSET_SURVEY_RECORD''` / `document_category=''PHOTO''` として保存する。`taken_by_user_id` と `uploaded_by_user_id` には認証ユーザーIDを設定する',
          '`photos[].contentType` はシステムが許可する画像MIME Typeに限定し、`fileBodyBase64` を復号できない場合は 400 を返す。保存拡張子は検証済みMIME Typeからサーバー側で決定する',
          '写真が1件以上あるレコードでは、`photos[].isPrimary=true` は最大1件だけ許可する。すべて未指定または `false` の場合は先頭写真を `is_primary=true` として保存する',
          '現有品調査写真の `file_name` は、受信した `photos[].fileName` をそのまま使わず、`survey-photo_YYYYMMDD_HHMMSS_{local_photo_uuid先頭8桁}.{拡張子}` 形式のシステム生成名を採番して保存する',
          '写真保存時の `file_path` は S3 オブジェクトキーとして `application-documents/facility-{facilityId}/{yyyy}/{mm}/{localPhotoUuid}.{拡張子}` 形式で生成し、バケット名や HTTPS URL は保存しない。`localPhotoUuid` はオフライン撮影時点で採番済みの写真UUIDを利用し、S3キーに業務DB採番IDを含めない',
          'Amazon S3 への PutObject に失敗した場合は 502 を返し、DB トランザクションをロールバックしたうえで保存済み S3 オブジェクトを破棄する',
          '写真保存時の `uploaded_at` にはサーバー受信時刻を設定する',
          'アップロード完了後、セッションステータスを `COMPLETED` へ更新する'
        )
        ExtraTables = @(
          @{
            Title = '永続化マッピング（調査セッション）'
            Headers = @('テーブル', '対象カラム / 操作', '設定値 / 反映内容', '備考')
            Rows = @(
              @('`asset_survey_sessions`', '`asset_survey_session_id`', '新規採番する', 'レスポンス `assetSurveySessionId` として返却する'),
              @('`asset_survey_sessions`', '`facility_id`', 'リクエスト `facilityId` を保存する', 'Bearer トークン上の作業対象施設と一致している前提'),
              @('`asset_survey_sessions`', '`created_by_user_id`', '認証ユーザーIDを保存する', '送信実行ユーザー'),
              @('`asset_survey_sessions`', '`started_at` / `ended_at`', 'リクエスト `startedAt` / `endedAt` を保存する', '未指定時は `NULL` を許容する'),
              @('`asset_survey_sessions`', '`status`', '作成時は `IN_PROGRESS`、配下レコードと写真の保存完了後に `COMPLETED` へ更新する', '1 回の送信単位の親セッション'),
              @('`asset_survey_sessions`', '`created_at` / `updated_at`', 'サーバー受信時刻を設定し、完了時に `updated_at` を再更新する', '監査用')
            )
          },
          @{
            Title = '永続化マッピング（調査レコード）'
            Headers = @('テーブル', '対象カラム / 操作', '設定値 / 反映内容', '備考')
            Rows = @(
              @('`asset_survey_records`', '`asset_survey_record_id`', 'レコードごとに新規採番する', '1 調査レコード = 1 行'),
              @('`asset_survey_records`', '`asset_survey_session_id` / `facility_id`', '新規作成した親 `asset_survey_session_id` とリクエスト `facilityId` を保存する', '全レコードで同一施設を使う'),
              @('`asset_survey_records`', '`facility_location_id` / `building` / `floor` / `department_name` / `section_name` / `room_name`', '`records[].facilityLocationId` がある場合は当該 `facility_locations` 行の正本スナップショットを保存し、未指定時はリクエスト `building` / `floor` / `departmentName` / `sectionName` / `roomName` を保存する', '既存ロケーションへ解決できない場合は `facility_location_id=NULL`'),
              @('`asset_survey_records`', '`survey_date` / `qr_identifier`', 'リクエスト `surveyDate` / `qrIdentifier` を保存する', '未指定時は `NULL` を許容する'),
              @('`asset_survey_records`', '`detail_type` / `parent_asset_survey_record_id`', '`NULL` / `NULL` で作成する', '本体 / 明細の紐付けは `/registration-edit` で確定する。本画面では付属品区分は作成しない'),
              @('`asset_survey_records`', '`category_id` / `large_class_id` / `medium_class_id` / `asset_item_id` / `manufacturer_id` / `model_id` / `category_name` / `large_class_name` / `medium_class_name` / `asset_item_name` / `manufacturer_name` / `model_name`', '各 ID が指定された場合は対応マスタの正規名称と ID を保存し、ID 未指定時はリクエストの表示値を保存して対応 ID を `NULL` とする', '表示値スナップショットとマスタIDを併存させる'),
              @('`asset_survey_records`', '`asset_no` / `equipment_no` / `serial_no` / `purchased_on` / `width_mm` / `depth_mm` / `height_mm` / `remarks` / `registered_at`', 'リクエスト `assetNo` / `equipmentNo` / `serialNo` / `purchasedOn` / `widthMm` / `depthMm` / `heightMm` / `remarks` / `registeredAt` を保存する', '未指定時は `NULL` を許容する'),
              @('`asset_survey_records`', '`surveyor_user_id` / `confirmed_by_user_id` / `confirmed_at` / `survey_status`', '認証ユーザーID / `NULL` / `NULL` / `DRAFT` で作成する', '調査担当者と確定者は分離して記録する'),
              @('`asset_survey_records`', '`created_at` / `updated_at` / `deleted_at`', 'サーバー受信時刻 / サーバー受信時刻 / `NULL` で作成する', '論理削除状態では開始しない')
            )
          },
          @{
            Title = '永続化マッピング（調査写真）'
            Headers = @('テーブル', '対象カラム / 操作', '設定値 / 反映内容', '備考')
            Rows = @(
              @('`application_documents`', '`application_document_id`', '写真ごとに新規採番する', '互換 VIEW `asset_survey_photos.asset_survey_photo_id` の元になる'),
              @('`application_documents`', '`owner_type` / `asset_survey_record_id` / `document_category`', '`ASSET_SURVEY_RECORD` / 対応する新規 `asset_survey_record_id` / `PHOTO` を保存する', '調査写真の正本'),
              @('`application_documents`', 'リクエスト `photos[].localPhotoUuid` / `photos[].fileName`', '`localPhotoUuid` は DB へ保存せず、`fileName` もそのままは保存しない。両者はサーバー生成 `file_name` / `file_path` の材料としてのみ使う', 'クライアント一時識別子'),
              @('`application_documents` / Amazon S3', 'リクエスト `photos[].fileBodyBase64`', 'DB カラムへは保存しない。復号した写真本文を Amazon S3 へ PutObject し、その結果から `file_size_bytes` / `content_hash` を導出する', '写真実体そのものは DB ではなく Amazon S3 で管理する'),
              @('`application_documents`', '`file_name` / `file_path`', 'システム生成ファイル名 `survey-photo_YYYYMMDD_HHMMSS_{local_photo_uuid先頭8桁}.{拡張子}` と S3 オブジェクトキー `application-documents/facility-{facilityId}/{yyyy}/{mm}/{localPhotoUuid}.{拡張子}` を保存する', '`file_path` は S3 キーであり、バケット名や HTTPS URL は保存しない。S3キーに業務DB採番IDを含めない'),
              @('`application_documents`', '`mime_type` / `file_size_bytes` / `content_hash` / `storage_format`', 'リクエスト `photos[].contentType`、復号後バイト数、サーバー計算ハッシュ、`NULL` を保存する', '`storage_format` は現有品調査写真では未使用。S3 利用有無は `file_path` の S3 オブジェクトキーで表す'),
              @('`application_documents`', '`taken_at` / `taken_by_user_id` / `uploaded_by_user_id` / `uploaded_at`', 'リクエスト `photos[].takenAt`、認証ユーザーID、認証ユーザーID、サーバー受信時刻を保存する', '`takenAt` 未指定時は `uploaded_at` を正本時刻として扱える状態にする'),
              @('`application_documents`', '`is_primary` / `sort_order`', 'レコード配下で `photos[].isPrimary=true` の写真を 1 件だけ `true` とし、未指定時は先頭写真を `true` にする。`sort_order` は `photos[]` の並び順を保存する', '同一 `asset_survey_record_id` で代表写真は必ず 1 件だけ'),
              @('`application_documents`', '`application_id` / `application_asset_id` / `edit_list_item_id` / `rfq_id` / `rfq_vendor_id` / `quotation_id` / `inspection_result_id` / `asset_ledger_id` / `step_code` / `document_type` / `title` / `document_date` / `account_type` / `account_other_text` / `deleted_at`', '`NULL` で作成する', '現有品調査写真では利用しない汎用ドキュメント列'),
              @('`application_documents`', '`created_at` / `updated_at`', 'サーバー受信時刻を設定する', '監査用')
            )
          }
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
          @('403', '通常アカウントで作業対象施設に対する実効 `existing_survey` なし、共有システム管理者で作業対象施設が削除済み、または対象施設不一致', 'ErrorResponse'),
          @('404', '施設または参照マスタが存在しない、または削除済み', 'ErrorResponse'),
          @('422', '親子紐づけや分類階層の整合が取れない', 'ErrorResponse'),
          @('502', 'Amazon S3 への写真保存、またはロールバック時の保存済み S3 オブジェクト破棄に失敗した', 'ErrorResponse'),
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
        PermissionLines = $surveyDataEditPermissionLines
        ProcessingLines = @(
          '`facilityId` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する',
          '`asset_survey_records.deleted_at IS NULL` かつ `asset_survey_records.survey_status=''DRAFT''` の未確定レコードのみを対象にする',
          '選択施設内の `DRAFT` レコードは、作成者・調査担当者に関係なく一覧対象とし、同一施設内では別ユーザーが続き作業を引き継げる前提で返却する',
          'QRコード列は `asset_survey_records.qr_identifier` のスナップショットをそのまま返却し、`qr_codes` の解決は行わない',
          '`users` を結合して調査担当者名を解決する',
          '`asset_survey_records.parent_asset_survey_record_id` で親本体を自己結合し、明細行の `parentQrIdentifier` を解決する',
          '`asset_survey_photos` VIEW の未削除写真を集計し、調査レコード単位の写真枚数を算出する',
          'フィルタ条件は AND 条件で適用する',
          '既定並び順は `asset_survey_records.registered_at ASC, asset_survey_record_id ASC` とする',
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
              @('facilityLocationId', 'int64', '-', '施設ロケーションID。自由記述で未解決の場合は `null`'),
              @('shipAssetMasterId', 'int64', '-', 'SHIP資産マスタID。資産マスタ未選択または自由記述の場合は `null`'),
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
              @('detailType', 'string', '-', '`MAIN` / `DETAIL`。未設定時は `null`'),
              @('parentAssetSurveyRecordId', 'int64', '-', '親調査レコードID。`detailType=''DETAIL''` の場合のみ設定'),
              @('parentQrIdentifier', 'string', '-', '親本体のQR識別子。明細行の操作列で「親: {QRコード}」を表示するために返す')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'RegistrationEditRecordListResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `survey_data_edit` なし、共有システム管理者で作業対象施設が削除済み、または対象施設不一致', 'ErrorResponse'),
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
        PermissionLines = $surveyDataEditPermissionLines
        ProcessingLines = @(
          '対象 `asset_survey_records` が `deleted_at IS NULL` で存在し、その `facility_id` が Bearer トークン上の作業対象施設IDと一致することを検証する',
          '対象レコードの `facilities.deleted_at IS NULL` を検証する',
          '`asset_survey_photos` VIEW から対象レコードの写真を取得する',
          '`file_path` に保持している S3 オブジェクトキーから認可済み表示URLを発行し、S3 キー自体は返却しない',
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
              @('fileUrl', 'string', '✓', '認可済み表示URL。S3 オブジェクトキーは返却しない'),
              @('takenAt', 'datetime', '-', '撮影日時'),
              @('takenByUserId', 'int64', '-', '撮影者ユーザーID'),
              @('isPrimary', 'boolean', '✓', '代表写真フラグ')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'RegistrationEditPhotoListResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `survey_data_edit` なし、共有システム管理者で作業対象施設が削除済み、または対象施設不一致', 'ErrorResponse'),
          @('404', '対象レコードが存在しない', 'ErrorResponse'),
          @('502', 'Amazon S3 表示URLの発行に失敗した', 'ErrorResponse'),
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
          @('shipAssetMasterId', 'int64', '-', 'SHIP資産マスタID'),
          @('building', 'string', '-', '棟の表示値'),
          @('floor', 'string', '-', '階の表示値'),
          @('departmentName', 'string', '-', '部門名の表示値'),
          @('sectionName', 'string', '-', '部署名の表示値'),
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
          @('assetNo', 'string', '-', '資産番号'),
          @('equipmentNo', 'string', '-', 'ME番号'),
          @('serialNo', 'string', '-', 'シリアル番号'),
          @('purchasedOn', 'date', '-', '購入年月日'),
          @('widthMm', 'string', '-', 'W'),
          @('depthMm', 'string', '-', 'D'),
          @('heightMm', 'string', '-', 'H'),
          @('remarks', 'string', '-', '備考')
        )
        PermissionLines = $surveyDataEditPermissionLines
        ProcessingLines = @(
          '対象 `asset_survey_records` が `deleted_at IS NULL` で存在し、その `facility_id` が Bearer トークン上の作業対象施設IDと一致することを検証する',
          '対象レコードの `facilities.deleted_at IS NULL` を検証する',
          '対象レコードが `survey_status=''DRAFT''` であることを確認する',
          '`facilityLocationId` を非 `null` で送信した場合は、同一施設の `facility_locations.deleted_at IS NULL` の行であることを検証し、棟・階・部門・部署・室名の正本スナップショットを保存する',
          '`facilityLocationId` を明示的に `null` で送信した場合は `facility_location_id=NULL` とし、リクエストに含まれる棟・階・部門・部署・室名の表示値だけを更新する。`facilityLocationId` 未送信時は現在値を維持する',
          '`shipAssetMasterId` を非 `null` で送信した場合は `ship_asset_masters.is_active=true` の行を取得し、その分類IDと各分類マスタの正規名称を保存する。同時送信された分類IDと不一致の場合は 422 を返す',
          '`shipAssetMasterId` を明示的に `null` で送信した場合は `ship_asset_master_id=NULL` とする。`shipAssetMasterId` 未送信で分類IDまたは分類表示値のいずれかを更新する場合も、旧資産マスタとの不整合を避けるため `ship_asset_master_id=NULL` とする',
          '個別の分類マスタIDを非 `null` で送信した場合は対応マスタが `is_active=true` であることと階層整合性を検証し、正規名称を `*_name` に保存する。上位IDの変更または `null` 指定で不整合になる下位IDは `NULL` にする',
          '分類IDを明示的に `null` で送信した場合、またはIDを送信せず対応する分類表示値だけを変更した場合は、対応IDを `NULL` として表示値を保存する。上位分類の自由記述化で不整合になる下位IDも `NULL` にする。各フィールドの未送信時は現在値を維持する',
          '`detail_type` / `parent_asset_survey_record_id` は本APIでは更新しない。本体設定・明細紐付け・紐付け解除は専用APIで操作タイミングに永続化する',
          'リクエストで未指定の項目は既存値を維持し、明示的に `null` を送った項目だけ対応カラムをクリアする',
          '更新成功時は `asset_survey_records.updated_at` を現在時刻へ更新する',
          '更新後の `asset_survey_records` を返却する'
        )
        ExtraTables = @(
          @{
            Title = '永続化マッピング'
            Headers = @('テーブル', '対象カラム / 操作', '設定値 / 反映内容', '備考')
            Rows = @(
              @('`asset_survey_records`', '`facility_location_id` / `building` / `floor` / `department_name` / `section_name` / `room_name`', '`facilityLocationId` が非 `null` なら正本スナップショット、明示 `null` ならIDを `NULL` にして送信済み表示値を保存する', '未送信フィールドは既存値を維持する'),
              @('`asset_survey_records`', '`ship_asset_master_id`', '`shipAssetMasterId` 指定時は有効なSHIP資産マスタID、明示 `null` または資産マスタ未指定の分類更新時は `NULL` を保存する', '分類組み合わせとの不整合を残さない'),
              @('`asset_survey_records`', '`detail_type` / `parent_asset_survey_record_id`', '変更しない', '本体設定・明細紐付け・紐付け解除は専用APIで扱う'),
              @('`asset_survey_records`', '`category_id` / `large_class_id` / `medium_class_id` / `asset_item_id` / `manufacturer_id` / `model_id` / `category_name` / `large_class_name` / `medium_class_name` / `asset_item_name` / `manufacturer_name` / `model_name`', '資産マスタ指定時は当該マスタの分類IDと正規名称、個別ID指定時は有効な対応マスタIDと正規名称を保存する', '明示 `null` はID解除、未送信は維持。親子不整合の下位IDはクリアする'),
              @('`asset_survey_records`', '`asset_no` / `equipment_no` / `serial_no` / `purchased_on` / `width_mm` / `depth_mm` / `height_mm` / `remarks`', 'リクエスト `assetNo` / `equipmentNo` / `serialNo` / `purchasedOn` / `widthMm` / `depthMm` / `heightMm` / `remarks` で上書きする', '未指定時は既存値を維持し、明示 `null` はクリアする'),
              @('`asset_survey_records`', '`updated_at`', '更新時点の日時へ更新する', 'インライン編集の最終更新時刻'),
              @('`asset_survey_records`', '`asset_survey_session_id` / `facility_id` / `survey_date` / `surveyor_user_id` / `confirmed_by_user_id` / `confirmed_at` / `qr_identifier` / `survey_status` / `registered_at` / `created_at` / `deleted_at`', '変更しない', '本 API の更新対象外')
            )
          }
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
          @('403', '通常アカウントで作業対象施設に対する実効 `survey_data_edit` なし、共有システム管理者で作業対象施設が削除済み、または対象施設不一致', 'ErrorResponse'),
          @('404', '対象レコードが存在しない', 'ErrorResponse'),
          @('409', '既に確定済みのため更新不可', 'ErrorResponse'),
          @('422', '施設ロケーション、SHIP資産マスタ、または分類階層の整合が取れない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '調査レコード本体設定（/registration-edit/records/{recordId}/set-main）'
        Overview = '明細区分が未設定の調査レコードを本体として設定する。通常のインライン編集保存とは独立し、操作押下時点で永続化する。'
        Method = 'POST'
        Path = '/registration-edit/records/{recordId}/set-main'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('recordId', 'path', 'int64', '✓', '本体に設定する調査レコードID')
        )
        PermissionLines = $surveyDataEditPermissionLines
        ProcessingLines = @(
          '対象 `asset_survey_records` を排他取得し、`deleted_at IS NULL`、`survey_status=''DRAFT''`、`facility_id` が Bearer トークン上の作業対象施設IDと一致することを検証する',
          '対象レコードの `facilities.deleted_at IS NULL` を検証する',
          '対象レコードが明細行（`detail_type=''DETAIL''` または `parent_asset_survey_record_id IS NOT NULL`）の場合は本APIでは本体化せず 409 を返す',
          '対象レコードが既に `detail_type=''MAIN''` の場合は冪等成功として扱い、値を変更せず最新行を返す',
          '対象レコードが未設定の場合は `detail_type=''MAIN''`、`parent_asset_survey_record_id=NULL`、`updated_at=現在時刻` へ更新する',
          '本APIは 1 レコード更新を 1 DB トランザクションで完結する'
        )
        ExtraTables = @(
          @{
            Title = '永続化マッピング'
            Headers = @('テーブル', '対象カラム / 操作', '設定値 / 反映内容', '備考')
            Rows = @(
              @('`asset_survey_records`', '`detail_type`', '`MAIN` へ更新する', '未設定行を本体として扱う'),
              @('`asset_survey_records`', '`parent_asset_survey_record_id`', '`NULL` を設定する', '本体行は親を持たない'),
              @('`asset_survey_records`', '`updated_at`', '現在時刻へ更新する', '操作時点で永続化する')
            )
          }
        )
        ResponseTitle = 'レスポンス（200：RegistrationEditRecordResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'RegistrationEditRecordSummary', '✓', '更新後の調査レコード')
        )
        StatusRows = @(
          @('200', '本体設定成功、または既に本体のため冪等成功', 'RegistrationEditRecordResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `survey_data_edit` なし、共有システム管理者で作業対象施設が削除済み、または対象施設不一致', 'ErrorResponse'),
          @('404', '対象レコードが存在しない', 'ErrorResponse'),
          @('409', '対象レコードが明細行、確定済み、または親子整合上本体化できない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '調査レコード明細紐付け（/registration-edit/records/{parentRecordId}/details/link）'
        Overview = '紐付け登録モードで選択した未設定の既存調査レコードを、指定した本体レコードの明細として一括紐付けする。新規調査レコードは作成しない。'
        Method = 'POST'
        Path = '/registration-edit/records/{parentRecordId}/details/link'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('parentRecordId', 'path', 'int64', '✓', '親本体となる調査レコードID')
        )
        RequestTitle = 'リクエスト（RegistrationEditDetailLinkRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('childRecordIds', 'int64[]', '✓', '明細として紐付ける未設定の調査レコードID一覧。1件以上必須')
        )
        PermissionLines = $surveyDataEditPermissionLines
        ProcessingLines = @(
          '`childRecordIds` が1件以上で、重複がないことを検証する',
          '親本体 `asset_survey_records` を排他取得し、`deleted_at IS NULL`、`survey_status=''DRAFT''`、`facility_id` が Bearer トークン上の作業対象施設IDと一致することを検証する',
          '親本体の `detail_type=''MAIN''` かつ `parent_asset_survey_record_id IS NULL` であることを検証する。未設定行を親にする場合は先に本体設定APIを実行する',
          '子レコードを全件排他取得し、全件が `deleted_at IS NULL`、`survey_status=''DRAFT''`、親と同一 `facility_id`、`detail_type IS NULL`、`parent_asset_survey_record_id IS NULL` であることを検証する',
          '親本体自身が `childRecordIds` に含まれる場合は自己参照として 409 を返す',
          '子候補が他レコードから `parent_asset_survey_record_id` で参照されている場合は、子を持つ本体または中間親を明細化すると階層不整合になるため 409 を返す',
          '検証に成功した子レコード全件について `detail_type=''DETAIL''`、`parent_asset_survey_record_id=parentRecordId`、`updated_at=現在時刻` へ更新する',
          '本APIは選択行全件を 1 DB トランザクションで更新し、1件でも検証に失敗した場合は全件ロールバックする'
        )
        ExtraTables = @(
          @{
            Title = '永続化マッピング'
            Headers = @('テーブル', '対象カラム / 操作', '設定値 / 反映内容', '備考')
            Rows = @(
              @('`asset_survey_records`', '親本体 `parentRecordId` の `detail_type` / `parent_asset_survey_record_id`', '変更しない', '親は既に `MAIN` / `NULL` であることを前提にする'),
              @('`asset_survey_records`', '子 `childRecordIds[*]` の `detail_type`', '`DETAIL` へ更新する', '選択行を明細として扱う'),
              @('`asset_survey_records`', '子 `childRecordIds[*]` の `parent_asset_survey_record_id`', '`parentRecordId` を設定する', '親本体との紐付け'),
              @('`asset_survey_records`', '子 `childRecordIds[*]` の `updated_at`', '現在時刻へ更新する', '操作時点で永続化する')
            )
          }
        )
        ResponseTitle = 'レスポンス（200：RegistrationEditDetailLinkResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('parent', 'RegistrationEditRecordSummary', '✓', '親本体レコード'),
          @('linkedItems', 'RegistrationEditRecordSummary[]', '✓', '紐付け後の明細レコード一覧'),
          @('linkedCount', 'int32', '✓', '紐付け件数')
        )
        StatusRows = @(
          @('200', '明細紐付け成功', 'RegistrationEditDetailLinkResponse'),
          @('400', '入力不正、`childRecordIds` が空、または重複している', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `survey_data_edit` なし、共有システム管理者で作業対象施設が削除済み、または対象施設不一致', 'ErrorResponse'),
          @('404', '親本体または子レコードが存在しない', 'ErrorResponse'),
          @('409', '親が本体でない、子候補が未設定でない、自己参照、循環参照、子を持つ行の明細化、確定済み、または別施設混在により紐付け不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '調査レコード明細紐付け解除（/registration-edit/records/{recordId}/details/unlink）'
        Overview = '明細行の親子紐付けを解除し、明細区分未設定の調査レコードへ戻す。通常のインライン編集保存とは独立し、操作押下時点で永続化する。'
        Method = 'POST'
        Path = '/registration-edit/records/{recordId}/details/unlink'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('recordId', 'path', 'int64', '✓', '紐付け解除対象の明細調査レコードID')
        )
        PermissionLines = $surveyDataEditPermissionLines
        ProcessingLines = @(
          '対象 `asset_survey_records` を排他取得し、`deleted_at IS NULL`、`survey_status=''DRAFT''`、`facility_id` が Bearer トークン上の作業対象施設IDと一致することを検証する',
          '対象レコードの `facilities.deleted_at IS NULL` を検証する',
          '対象レコードが `detail_type=''DETAIL''` かつ `parent_asset_survey_record_id IS NOT NULL` であることを検証する。未設定行や本体行の場合は 409 を返す',
          '対象レコードが他レコードから親として参照されていないことを検証する',
          '対象レコードの `detail_type=NULL`、`parent_asset_survey_record_id=NULL`、`updated_at=現在時刻` へ更新する',
          '本APIは 1 レコード更新を 1 DB トランザクションで完結する'
        )
        ExtraTables = @(
          @{
            Title = '永続化マッピング'
            Headers = @('テーブル', '対象カラム / 操作', '設定値 / 反映内容', '備考')
            Rows = @(
              @('`asset_survey_records`', '`detail_type`', '`NULL` へ更新する', '未設定行へ戻す'),
              @('`asset_survey_records`', '`parent_asset_survey_record_id`', '`NULL` へ更新する', '親本体との紐付けを解除する'),
              @('`asset_survey_records`', '`updated_at`', '現在時刻へ更新する', '操作時点で永続化する')
            )
          }
        )
        ResponseTitle = 'レスポンス（200：RegistrationEditRecordResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'RegistrationEditRecordSummary', '✓', '紐付け解除後の調査レコード')
        )
        StatusRows = @(
          @('200', '紐付け解除成功', 'RegistrationEditRecordResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `survey_data_edit` なし、共有システム管理者で作業対象施設が削除済み、または対象施設不一致', 'ErrorResponse'),
          @('404', '対象レコードが存在しない', 'ErrorResponse'),
          @('409', '対象レコードが明細行でない、確定済み、または親子整合上解除できない', 'ErrorResponse'),
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
          @('nextPrimaryPhotoId', 'query', 'int64', '-', '代表写真削除後も他の写真が残る場合のみ必須。フロントエンドが選択した次代表写真ID')
        )
        PermissionLines = $surveyDataEditPermissionLines
        ProcessingLines = @(
          '対象 `asset_survey_records` が `deleted_at IS NULL` で存在し、その `facility_id` が Bearer トークン上の作業対象施設IDと一致することを検証する',
          '対象レコードが `survey_status=''DRAFT''` であることを検証し、確定済みの場合は 409 を返す',
          '対象写真が同一レコード配下の `owner_type=''ASSET_SURVEY_RECORD''` / `document_category=''PHOTO''` / `deleted_at IS NULL` の `application_documents` であることを検証し、同一レコード配下の未削除写真を排他取得する',
          '削除対象が代表写真で他に写真が残る場合は `nextPrimaryPhotoId` を必須とし、同一レコード配下の別の未削除写真であることを検証する。その他の場合は `nextPrimaryPhotoId` を送信しない',
          '`application_documents.deleted_at` と `updated_at` を更新して論理削除し、削除対象の `is_primary` は `false` にする',
          '削除対象が代表写真で、他に写真が残る場合は、フロントエンドが指定した `nextPrimaryPhotoId` に `is_primary=true` を付け替える',
          '写真が0件になった場合は代表写真なし状態とする',
          '`application_documents.file_path` が指す S3 オブジェクトキーに対して Amazon S3 DeleteObject を実行する。DeleteObject で NoSuchKey が返った場合は削除済みとして成功扱いにする',
          '通信断・一時障害などの再試行可能エラーは最大3回までリトライし、なお失敗した場合は DB 更新を rollback して 502 を返す',
          'DeleteObject 成功後に DB トランザクションを commit し、削除後の残写真件数と新代表写真IDを返す。S3 削除成功後に DB commit が失敗した場合は、再実行時に NoSuchKey を成功扱いにして復旧可能とする'
        )
        ExtraTables = @(
          @{
            Title = '永続化マッピング'
            Headers = @('テーブル', '対象カラム / 操作', '設定値 / 反映内容', '備考')
            Rows = @(
              @('`application_documents`', '削除対象 `photoId` の `deleted_at` / `updated_at` / `is_primary`', '現在時刻 / 現在時刻 / `false` へ更新する', '論理削除した写真は代表フラグも落とす'),
              @('`application_documents`', 'リクエスト `nextPrimaryPhotoId` の `is_primary` / `updated_at`', '`true` / 現在時刻へ更新する', '削除対象が代表写真で、後続写真が残る場合のみ実行する'),
              @('`application_documents`', 'その他の同一 `asset_survey_record_id` 配下写真', '変更しない', '代表写真の付け替え対象以外はそのまま保持する'),
              @('`Amazon S3（DB外）`', '`application_documents.file_path` が指す S3 オブジェクト', 'DeleteObject を実行する。NoSuchKey は削除済みとして成功扱いにする', 'S3 削除成功後に DB トランザクションを commit する'),
              @('`asset_survey_photos`', 'VIEW 行', '直接更新しない', '`application_documents` の更新結果が VIEW に反映される')
            )
          }
        )
        ResponseTitle = 'レスポンス（200：RegistrationEditPhotoDeleteResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('remainingPhotoCount', 'int32', '✓', '削除後の残写真件数'),
          @('newPrimaryPhotoId', 'int64', '-', '新たに代表写真となった写真ID')
        )
        StatusRows = @(
          @('200', '削除成功', 'RegistrationEditPhotoDeleteResponse'),
          @('400', '代表写真削除時の `nextPrimaryPhotoId` が未指定または不正、もしくは不要な場合に指定されている', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `survey_data_edit` なし、共有システム管理者で作業対象施設が削除済み、または対象施設不一致', 'ErrorResponse'),
          @('404', '対象写真が存在しない', 'ErrorResponse'),
          @('409', '対象調査レコードが確定済みのため削除不可', 'ErrorResponse'),
          @('502', 'Amazon S3 の調査写真削除に失敗した', 'ErrorResponse'),
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
          @('recordIds', 'int64[]', '✓', '確定対象の調査レコードID一覧。1件以上必須、重複不可')
        )
        PermissionLines = $surveyDataEditPermissionLines
        ProcessingLines = @(
          '`recordIds` が1件以上で、重複がないことを検証する',
          '指定 `recordIds` の対象 `asset_survey_records` を全件排他取得し、すべて `deleted_at IS NULL` で存在し、その `facility_id` が Bearer トークン上の作業対象施設IDと一致することを検証する',
          '対象レコードの `facilities.deleted_at IS NULL` を検証する',
          '対象レコードが `survey_status=''DRAFT''` であることを確認する',
          '確定条件として `category_id` / `large_class_id` / `medium_class_id` / `asset_item_id` が設定されていることを検証する',
          '`manufacturer_id` / `model_id` は未設定でも許可する',
          '条件を満たしたレコードの `survey_status` を `CONFIRMED` へ更新し、`confirmed_by_user_id` に認証ユーザーID、`confirmed_at` と `updated_at` にサーバー時刻を設定する',
          '対象レコードのいずれかが条件未達または確定済みである場合は一括失敗とし、部分確定しない',
          '複数ユーザーが同一レコードを表示している場合は先に `CONFIRMED` へ更新したユーザーを正とし、後続ユーザーの確定要求は更新対象が `DRAFT` でなくなっているため 409 を返す'
        )
        ExtraTables = @(
          @{
            Title = '永続化マッピング'
            Headers = @('テーブル', '対象カラム / 操作', '設定値 / 反映内容', '備考')
            Rows = @(
              @('`asset_survey_records`', 'リクエスト `recordIds[*]` に一致する各行の `survey_status`', '`CONFIRMED` へ更新する', '`DRAFT` かつ確定条件充足行のみ対象'),
              @('`asset_survey_records`', 'リクエスト `recordIds[*]` に一致する各行の `confirmed_by_user_id` / `confirmed_at` / `updated_at`', '認証ユーザーID / 現在時刻 / 現在時刻を保存する', '確定監査用'),
              @('`asset_survey_records`', '各行の `facility_location_id` / 分類列 / 表示値スナップショット / 資産情報 / `surveyor_user_id` / `registered_at` / `created_at` / `deleted_at`', '変更しない', '確定は状態更新のみを行う'),
              @('`asset_survey_sessions` / `application_documents`', '行更新なし', '変更しない', '本 API の更新対象外')
            )
          }
        )
        ResponseTitle = 'レスポンス（200：RegistrationEditConfirmResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('confirmedCount', 'int32', '✓', '確定した件数'),
          @('failedRecordIds', 'int64[]', '-', '本 API は部分成功を許可しないため、成功時は空配列または未返却。条件未達が含まれる場合は 409 を返す')
        )
        StatusRows = @(
          @('200', '確定成功', 'RegistrationEditConfirmResponse'),
          @('400', '`recordIds` が空、重複、または入力形式が不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `survey_data_edit` なし、共有システム管理者で作業対象施設が削除済み、または対象施設不一致', 'ErrorResponse'),
          @('409', '確定条件未達のレコードが含まれる', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '必要権限' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定基準', '説明'); Rows = @(
      @('マスタパッケージ取得 / 調査結果アップロード', '`existing_survey`', '通常アカウントは作業対象施設に対して実効 `existing_survey` を持つこと。共有システム管理者は作業対象施設が未削除であること', '現有品調査の準備・送信を行う'),
      @('調査登録内容修正の一覧 / 写真参照 / 更新 / 本体設定 / 明細紐付け / 紐付け解除 / 写真削除 / 確定', '`survey_data_edit`', '通常アカウントは作業対象施設に対して実効 `survey_data_edit` を持つこと。共有システム管理者は作業対象施設が未削除であること', '送信後データの修正系処理を行う')
    ) },
    @{ Type = 'Heading2'; Text = 'データ整合ルール' },
    @{ Type = 'Bullets'; Items = @(
      '現有品調査は自施設業務として扱い、協業グループや他施設公開設定は適用しない',
      '`/offline-prep` の `facilityId` は Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設でなければならない',
      '`/registration-edit` の対象レコードは `asset_survey_records.deleted_at IS NULL` かつ `facility_id` が Bearer トークン上の作業対象施設IDと一致するものだけを扱う',
      '調査登録内容修正では、表示値スナップショットとマスタIDの両方を保持する前提で更新する',
      '調査登録内容修正の明細区分は `MAIN` / `DETAIL` / `NULL` を扱い、本画面では `ACCESSORY` を作成・更新しない',
      '本体設定、明細紐付け、紐付け解除は通常の行編集保存とは独立した即時保存操作とし、対象 `asset_survey_records.detail_type` / `parent_asset_survey_record_id` を操作APIのトランザクション内で更新する',
      '明細紐付けでは親・子とも同一施設、`survey_status=''DRAFT''`、`deleted_at IS NULL` であることを必須とし、子候補は未設定行に限定する。自己参照、循環参照、明細行を親にする操作、明細行または本体行を子候補にする操作、確定済み/削除済み/別施設レコードへの紐付けを禁止する',
      '子を持つ本体行を明細化または紐付け解除する操作は階層不整合を招くため拒否する',
      '接続状態表示、未送信件数、端末内一時保存の削除はクライアント側責務とし、本 API では管理しない'
    ) },
    @{ Type = 'Heading2'; Text = '実装前提' },
    @{ Type = 'Bullets'; Items = @(
      'API対象は `/offline-prep` と `/registration-edit` とし、`/survey-location` / `/asset-survey` / `/history` はPWAのフロントエンド実装として扱う',
      '画面表示制御は `/auth/context` の `existing_survey` / `survey_data_edit` を参照して行い、`existing_survey` は `/offline-prep` と PWA 導線、`survey_data_edit` は `/registration-edit` の一覧・編集・本体設定・明細紐付け・紐付け解除・写真削除・確定ボタンを出し分ける',
      'アップロード成功後に端末データを削除するかどうかはクライアント側で制御する'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '説明'); Rows = @(
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
      @('AUTH_403_EXISTING_SURVEY_DENIED', '403', '通常アカウントで作業対象施設に対する実効 `existing_survey` がない、共有システム管理者で作業対象施設が削除済み、または対象施設不一致'),
      @('AUTH_403_SURVEY_DATA_EDIT_DENIED', '403', '通常アカウントで作業対象施設に対する実効 `survey_data_edit` がない、共有システム管理者で作業対象施設が削除済み、または対象施設不一致'),
      @('OFFLINE_PREP_400_INVALID_INPUT', '400', '入力形式または必須項目が不正'),
      @('OFFLINE_PREP_404_FACILITY_NOT_FOUND', '404', '対象施設が存在しない、または削除済み'),
      @('OFFLINE_PREP_404_MASTER_NOT_FOUND', '404', '参照マスタが存在しない、または削除済み'),
      @('OFFLINE_PREP_422_RECORD_RELATION_INVALID', '422', '親子関係または分類階層の整合が取れない'),
      @('OFFLINE_PREP_502_S3_WRITE_FAILED', '502', '調査写真の Amazon S3 保存、またはロールバック時の保存済み S3 オブジェクト破棄に失敗した'),
      @('REG_EDIT_404_RECORD_NOT_FOUND', '404', '対象調査レコードが存在しない'),
      @('REG_EDIT_404_PHOTO_NOT_FOUND', '404', '対象写真が存在しない'),
      @('REG_EDIT_502_S3_URL_SIGN_FAILED', '502', '調査写真一覧取得時に Amazon S3 表示URLの発行に失敗した'),
      @('REG_EDIT_502_S3_DELETE_FAILED', '502', '調査写真削除時に Amazon S3 オブジェクトの削除に失敗した'),
      @('REG_EDIT_400_INVALID_INPUT', '400', '調査登録内容修正APIの入力形式、必須項目、配列要素または代表写真指定が不正'),
      @('REG_EDIT_409_ALREADY_CONFIRMED', '409', '既に確定済みのため更新できない'),
      @('REG_EDIT_409_CONFIRM_CONDITION_FAILED', '409', '確定条件を満たしていない'),
      @('REG_EDIT_409_HIERARCHY_CONFLICT', '409', '本体・明細の親子関係が不整合になるため操作できない'),
      @('REG_EDIT_400_INVALID_CHILD_RECORDS', '400', '明細紐付け対象の `childRecordIds` が空、重複、または入力形式が不正'),
      @('REG_EDIT_422_REFERENCE_INVALID', '422', '施設ロケーション、SHIP資産マスタ、または分類マスタの参照・階層整合が不正'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Bullets'; Items = @(
      '写真保存ルールや Amazon S3 オブジェクトキー命名規則を変更する場合は、`application_documents.file_path` と `asset_survey_photos` VIEW の整合を必ず確認する',
      '調査写真削除時の Amazon S3 DeleteObject は同期 API 内で実行し、NoSuchKey は削除完了扱いにする。再試行可能な一時障害は最大3回までリトライし、なお失敗する場合は DB 更新を rollback して 502 を返す',
      'PWA 画面群のローカル状態管理は本設計書の対象外とし、API追加時はオンライン画面かオフライン同期I/Fかを明確に区別する'
    ) }
  )
}
