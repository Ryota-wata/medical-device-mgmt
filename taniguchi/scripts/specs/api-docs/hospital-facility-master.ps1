@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_個別部署マスタ.docx'
  ScreenLabel = '個別部署マスタ'
  CoverDateText = '2026年4月18日'
  RevisionDateText = '2026/4/18'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、個別部署マスタ画面（`/hospital-facility-master`）で利用する API の設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      '選択施設単位の個別部署マスタ一覧取得、登録、更新、削除 I/F',
      'SHIP部署・諸室区分候補、および施設候補の取得 I/F',
      'Excel テンプレート取得、プレビュー、追加/置換インポート I/F',
      '現行ロケーション正本 `facility_locations` とリモデル先 `facility_location_remodels` の取り扱い'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '個別部署マスタは、施設ごとの現行ロケーション正本 `facility_locations` と、そのリモデル先情報 `facility_location_remodels` を参照・管理する画面である。' },
    @{ Type = 'Paragraph'; Text = '画面表示は `facility_locations` と `facility_location_remodels` を結合した1行DTOで構成し、リモデル先が未登録の場合は新欄を空表示とする。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('現行ロケーション', '`facility_locations` に保持する現状の施設ロケーション情報'),
      @('リモデル先ロケーション', '`facility_location_remodels` に保持する新側ロケーション情報'),
      @('個別部署マスタ', '選択施設ごとの部門/部署/室情報を管理する画面およびデータ'),
      @('SHIP標準候補', '`ship_departments` と `ship_room_categories` の共通マスタ候補')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('項目', '内容'); Rows = @(
      @('画面名', '19. 個別部署マスタ画面'),
      @('画面URL', '/hospital-facility-master'),
      @('主機能', '施設選択、一覧表示、インライン新規作成/編集、Excel入出力')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'APIの位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、個別部署マスタ画面における施設候補取得、SHIP標準候補取得、一覧取得、Excel入出力、新規作成、更新、削除を提供する。' },
    @{ Type = 'Paragraph'; Text = '現行ロケーションの正本は `facility_locations`、新側ロケーションは `facility_location_remodels` を0..1件の子テーブルとして扱う。' },
    @{ Type = 'Heading2'; Text = '画面とAPIの関係' },
    @{ Type = 'Numbered'; Items = @(
      '施設選択候補表示時に対象施設候補取得 API を呼び出す',
      '共通マスタ候補表示時に SHIP部署候補取得 API / SHIP諸室区分候補取得 API を呼び出す',
      '施設選択後またはフィルタ変更時に個別部署マスタ一覧取得 API を呼び出す',
      'テンプレートDL時にテンプレート取得 API、エクスポート時に一覧エクスポート API を呼び出す',
      'ファイル選択後にインポートプレビュー API を呼び出し、追加または置換選択後にインポート実行 API を呼び出す',
      '新規作成・編集・削除時にそれぞれ対応する変更系 API を呼び出す'
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル', '利用内容', '主な項目'); Rows = @(
      @('facilities', '施設候補の取得、施設存在確認', 'facility_id, facility_name'),
      @('ship_departments', '共通マスタ部門/部署候補の取得、名称解決', 'ship_department_id, division_name, department_name'),
      @('ship_room_categories', '共通マスタ諸室区分候補の取得、名称解決', 'ship_room_category_id, room_category1, room_category2'),
      @('facility_locations', '現行ロケーションの正本', 'facility_location_id, facility_id, division_id, department_id, room_id, building, floor, department_name, section_name, room_name, ship_department_id, ship_room_category_id, deleted_at'),
      @('facility_location_remodels', 'リモデル先ロケーション', 'facility_location_id, target_ship_department_id, target_ship_room_category_id, target_building, target_floor, target_department_name, target_section_name, target_room_name, target_room_count, deleted_at')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON（Excel入出力を除く）',
      'ファイルアップロード: multipart/form-data',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-04-18T00:00:00Z`）',
      '一覧取得では `deleted_at IS NULL` の未削除データのみ対象とする'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '本API群で使用する `feature_code` は以下の通りとする。対象施設に対する `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。画面表示用の `/auth/context` は UX 用キャッシュであり、各業務 API でも同条件を再判定する。' },
    @{ Type = 'Table'; Headers = @('管理単位名', 'feature_code', '対象処理'); Rows = @(
      @('個別部署マスタ / 一覧', '`hospital_dept_master_list`', '施設候補取得、SHIP候補取得、一覧取得、エクスポート、テンプレート取得'),
      @('個別部署マスタ / 新規作成・編集', '`hospital_dept_master_edit`', 'インポートプレビュー、インポート実行、新規作成、更新、削除')
    ) },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('施設候補取得 / SHIP候補取得 / 一覧取得 / エクスポート / テンプレート取得', '`hospital_dept_master_list`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '一覧参照系処理'),
      @('インポートプレビュー / インポート実行 / 新規作成 / 更新 / 削除', '`hospital_dept_master_edit`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '変更系処理')
    ) },
    @{ Type = 'Heading2'; Text = '対象施設ベースの認可' },
    @{ Type = 'Bullets'; Items = @(
      '対象施設候補取得 API は、`user_facility_assignments` 上の有効担当施設のうち、対象施設に対して実効 `hospital_dept_master_list` を持つ施設のみ返却する',
      '`facilityId` を受ける参照系 API は、指定施設に対する実効 `hospital_dept_master_list` を都度再判定する',
      '`facilityId` を受ける変更系 API は、指定施設に対する実効 `hospital_dept_master_edit` を都度再判定する',
      '一覧取得・エクスポートで `facilityId` 未指定かつ対象施設を1件に確定できない場合は 400 を返却する',
      '対象施設が `facilities.deleted_at IS NOT NULL` の場合は 404 を返却する'
    ) },
    @{ Type = 'Heading2'; Text = 'ファイル入出力仕様' },
    @{ Type = 'Bullets'; Items = @(
      'インポート対象拡張子は `.xlsx` / `.xls` とする',
      'テンプレートとエクスポートは同一列定義を採用する',
      'インポートはプレビュー成功後に追加または置換で確定する',
      '置換は選択施設分のみを対象とし、他施設データは変更しない'
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Heading3'; Text = '基本エラーレスポンス（ErrorResponse）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや補足情報')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API一覧' },
    @{ Type = 'Heading2'; Text = '個別部署マスタ（/hospital-facility-master）' },
    @{ Type = 'Table'; Headers = @('機能名', 'Method', 'Path', '概要', '認証'); Rows = @(
      @('対象施設候補取得', 'GET', '/hospital-facility-master/facilities', '施設候補を取得する', '要'),
      @('SHIP部署候補取得', 'GET', '/hospital-facility-master/ship-departments', '共通マスタの部門/部署候補を取得する', '要'),
      @('SHIP諸室区分候補取得', 'GET', '/hospital-facility-master/ship-room-categories', '共通マスタの諸室区分候補を取得する', '要'),
      @('個別部署マスタ一覧取得', 'GET', '/hospital-facility-master/facility-locations', '選択施設の個別部署マスタ一覧を取得する', '要'),
      @('個別部署マスタエクスポート', 'GET', '/hospital-facility-master/facility-locations/export', '絞り込み結果を Excel 出力する', '要'),
      @('個別部署マスタテンプレート取得', 'GET', '/hospital-facility-master/facility-locations/template', 'インポート用テンプレートを取得する', '要'),
      @('個別部署マスタインポートプレビュー', 'POST', '/hospital-facility-master/facility-locations/import-preview', 'Excel 取込内容を検証してプレビューを返す', '要'),
      @('個別部署マスタインポート実行', 'POST', '/hospital-facility-master/facility-locations/import', '追加/置換インポートを実行する', '要'),
      @('個別部署マスタ新規作成', 'POST', '/hospital-facility-master/facility-locations', '個別部署マスタ1行を新規登録する', '要'),
      @('個別部署マスタ更新', 'PUT', '/hospital-facility-master/facility-locations/{facilityLocationId}', '個別部署マスタ1行を更新する', '要'),
      @('個別部署マスタ削除', 'DELETE', '/hospital-facility-master/facility-locations/{facilityLocationId}', '個別部署マスタ1行を削除する', '要')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 個別部署マスタ機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '対象施設候補取得（/hospital-facility-master/facilities）'
        Overview = '施設選択コンボボックスで利用する施設候補を取得する。'
        Method = 'GET'
        Path = '/hospital-facility-master/facilities'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('keyword', 'query', 'string', '-', '施設名の部分一致検索条件')
        )
        PermissionLines = @(
          '認可条件: `user_facility_assignments` 上の有効担当施設が1件以上あること',
          '認可条件: 各候補施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `hospital_dept_master_list` が有効であること'
        )
        ProcessingLines = @(
          '`user_facility_assignments` の有効割当施設のみを対象にする',
          '`facilities.deleted_at IS NULL` の未削除施設のみ返却する',
          '各施設について実効 `hospital_dept_master_list` を再判定し、有効な施設のみ返却する',
          'キーワード指定時は施設名の部分一致で絞り込む'
        )
        ResponseTitle = 'レスポンス（200：FacilityOptionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '返却件数'),
          @('items', 'FacilityOption[]', '✓', '施設候補一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（FacilityOption）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '施設ID'),
              @('facilityName', 'string', '✓', '施設名')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'FacilityOptionResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '実効 `hospital_dept_master_list` を持つ担当施設がない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'SHIP部署候補取得（/hospital-facility-master/ship-departments）'
        Overview = '共通マスタの部門/部署候補を取得する。'
        Method = 'GET'
        Path = '/hospital-facility-master/ship-departments'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('divisionName', 'query', 'string', '-', '部門名で候補を絞り込む'),
          @('keyword', 'query', 'string', '-', '部門名/部署名の部分一致検索条件')
        )
        PermissionLines = @(
          '認可条件: 有効な担当施設のうち少なくとも1件で `hospital_dept_master_list` が有効であること'
        )
        ProcessingLines = @(
          '`ship_departments` の未削除レコードを返却する',
          '個別部署マスタ画面の共通マスタ候補として利用するため、対象施設ごとの差分公開設定は適用しない'
        )
        ResponseTitle = 'レスポンス（200：ShipDepartmentOptionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '返却件数'),
          @('items', 'ShipDepartmentOption[]', '✓', 'SHIP部署候補一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（ShipDepartmentOption）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('shipDepartmentId', 'int64', '✓', 'SHIP部署ID'),
              @('divisionName', 'string', '✓', '部門名'),
              @('departmentName', 'string', '✓', '部署名')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'ShipDepartmentOptionResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '実効 `hospital_dept_master_list` を持つ担当施設がない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = 'SHIP諸室区分候補取得（/hospital-facility-master/ship-room-categories）'
        Overview = '共通マスタの諸室区分候補を取得する。'
        Method = 'GET'
        Path = '/hospital-facility-master/ship-room-categories'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('roomCategory1', 'query', 'string', '-', '諸室区分①で候補を絞り込む'),
          @('keyword', 'query', 'string', '-', '諸室区分①/②の部分一致検索条件')
        )
        PermissionLines = @(
          '認可条件: 有効な担当施設のうち少なくとも1件で `hospital_dept_master_list` が有効であること'
        )
        ProcessingLines = @(
          '`ship_room_categories` の未削除レコードを返却する',
          '個別部署マスタ画面の共通マスタ候補として利用するため、対象施設ごとの差分公開設定は適用しない'
        )
        ResponseTitle = 'レスポンス（200：ShipRoomCategoryOptionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '返却件数'),
          @('items', 'ShipRoomCategoryOption[]', '✓', 'SHIP諸室区分候補一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（ShipRoomCategoryOption）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('shipRoomCategoryId', 'int64', '✓', 'SHIP諸室区分ID'),
              @('roomCategory1', 'string', '✓', '諸室区分①'),
              @('roomCategory2', 'string', '✓', '諸室区分②')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'ShipRoomCategoryOptionResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '実効 `hospital_dept_master_list` を持つ担当施設がない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '個別部署マスタ一覧取得（/hospital-facility-master/facility-locations）'
        Overview = '選択施設の個別部署マスタ一覧を取得する。`facility_locations` と `facility_location_remodels` を結合した1行DTOとして返却する。'
        Method = 'GET'
        Path = '/hospital-facility-master/facility-locations'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('facilityId', 'query', 'int64', '条件付き', '選択施設ID。対象施設が1件に確定できる場合は省略可'),
          @('shipDivisionName', 'query', 'string', '-', '共通マスタ-部門の部分一致条件'),
          @('shipDepartmentName', 'query', 'string', '-', '共通マスタ-部署の部分一致条件')
        )
        PermissionLines = @(
          '認可条件: 指定 `facilityId` または自動確定された対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `hospital_dept_master_list` が有効であること'
        )
        ProcessingLines = @(
          '`facilityId` 未指定時は、実効 `hospital_dept_master_list` を持つ対象施設が1件に確定できる場合のみ自動適用する',
          '対象施設の `facility_locations` を取得する',
          '`facility_location_remodels` を左外部結合し、1行DTOとして返却する',
          '部門・部署フィルタは SHIP標準名称ベースで絞り込む'
        )
        ResponseTitle = 'レスポンス（200：HospitalFacilityLocationListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '絞り込み後件数'),
          @('selectedFacility', 'FacilityOption', '✓', '選択中施設'),
          @('items', 'HospitalFacilityLocationSummary[]', '✓', '個別部署マスタ一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'selectedFacility（FacilityOption）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '施設ID'),
              @('facilityName', 'string', '✓', '施設名')
            )
          },
          @{
            Title = 'items要素（HospitalFacilityLocationSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityLocationId', 'int64', '✓', '施設ロケーションID'),
              @('facilityId', 'int64', '✓', '施設ID'),
              @('shipDepartmentId', 'int64', '-', '現行側SHIP部署ID'),
              @('shipDivisionName', 'string', '-', '現行側SHIP部門名'),
              @('shipDepartmentName', 'string', '-', '現行側SHIP部署名'),
              @('shipRoomCategoryId', 'int64', '-', '現行側SHIP諸室区分ID'),
              @('shipRoomCategory1', 'string', '-', '現行側諸室区分①'),
              @('shipRoomCategory2', 'string', '-', '現行側諸室区分②'),
              @('divisionId', 'string', '-', '旧_部門ID'),
              @('departmentId', 'string', '-', '旧_部署ID'),
              @('roomId', 'string', '-', '旧_諸室ID'),
              @('building', 'string', '-', '旧_棟'),
              @('floor', 'string', '-', '旧_階'),
              @('departmentName', 'string', '-', '旧_部門'),
              @('sectionName', 'string', '-', '旧_部署'),
              @('roomName', 'string', '-', '旧_諸室'),
              @('targetShipDepartmentId', 'int64', '-', '新側SHIP部署ID'),
              @('targetShipDivisionName', 'string', '-', '新側SHIP部門名'),
              @('targetShipDepartmentName', 'string', '-', '新側SHIP部署名'),
              @('targetShipRoomCategoryId', 'int64', '-', '新側SHIP諸室区分ID'),
              @('targetShipRoomCategory1', 'string', '-', '新側諸室区分①'),
              @('targetShipRoomCategory2', 'string', '-', '新側諸室区分②'),
              @('targetBuilding', 'string', '-', '新_棟'),
              @('targetFloor', 'string', '-', '新_階'),
              @('targetDepartmentName', 'string', '-', '新_部門'),
              @('targetSectionName', 'string', '-', '新_部署'),
              @('targetRoomName', 'string', '-', '新_諸室'),
              @('targetRoomCount', 'int32', '-', '新_室数'),
              @('updatedAt', 'datetime', '✓', '更新日時')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'HospitalFacilityLocationListResponse'),
          @('400', '施設未選択など不正な検索条件', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象施設に対する実効 `hospital_dept_master_list` なし', 'ErrorResponse'),
          @('404', '対象施設が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '個別部署マスタエクスポート（/hospital-facility-master/facility-locations/export）'
        Overview = '選択施設の個別部署マスタ一覧を Excel ファイルとして返却する。'
        Method = 'GET'
        Path = '/hospital-facility-master/facility-locations/export'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('facilityId', 'query', 'int64', '条件付き', '選択施設ID。対象施設が1件に確定できる場合は省略可'),
          @('shipDivisionName', 'query', 'string', '-', '共通マスタ-部門の部分一致条件'),
          @('shipDepartmentName', 'query', 'string', '-', '共通マスタ-部署の部分一致条件')
        )
        PermissionLines = @(
          '認可条件: 指定 `facilityId` または自動確定された対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `hospital_dept_master_list` が有効であること'
        )
        ProcessingLines = @(
          '`facilityId` 未指定時は、実効 `hospital_dept_master_list` を持つ対象施設が1件に確定できる場合のみ自動適用する',
          '一覧取得と同一条件で対象行を抽出する',
          'テンプレートと同一列順で Excel を生成する'
        )
        ResponseTitle = 'レスポンス（200：Excel File）'
        ResponseLines = @(
          'Body: 絞り込み結果を先頭シート `個別部署マスタ` として返却する。',
          'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        StatusRows = @(
          @('200', '出力成功', 'Excel File'),
          @('400', '施設未選択など不正な検索条件', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象施設に対する実効 `hospital_dept_master_list` なし', 'ErrorResponse'),
          @('404', '対象施設が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '個別部署マスタテンプレート取得（/hospital-facility-master/facility-locations/template）'
        Overview = 'インポート用テンプレートを返却する。'
        Method = 'GET'
        Path = '/hospital-facility-master/facility-locations/template'
        Auth = '要（Bearer）'
        PermissionLines = @(
          '認可条件: 有効な担当施設のうち少なくとも1件で `hospital_dept_master_list` が有効であること'
        )
        ProcessingLines = @(
          'エクスポートと同一列定義のヘッダーのみを返却する'
        )
        ResponseTitle = 'レスポンス（200：Excel File）'
        ResponseLines = @(
          'Body: ヘッダー行のみを保持したテンプレートファイルを返却する。',
          'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        StatusRows = @(
          @('200', '取得成功', 'Excel File'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '実効 `hospital_dept_master_list` を持つ担当施設がない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '個別部署マスタインポートプレビュー（/hospital-facility-master/facility-locations/import-preview）'
        Overview = 'アップロードされた Excel ファイルを解析し、取込可否とエラー内容を返却する。'
        Method = 'POST'
        Path = '/hospital-facility-master/facility-locations/import-preview'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエスト（multipart/form-data）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('facilityId', 'int64', '✓', '選択施設ID'),
          @('file', 'binary', '✓', '.xlsx / .xls ファイル')
        )
        PermissionLines = @(
          '認可条件: 指定 `facilityId` について `user_facility_assignments` に有効割当があること',
          '認可条件: 指定 `facilityId` について `facility_feature_settings` と `user_facility_feature_settings` の両方で `hospital_dept_master_edit` が有効であること'
        )
        ProcessingLines = @(
          'テンプレート列定義に基づきヘッダーと各行を検証する',
          '選択施設とファイル内施設情報が不整合な場合はエラーとする',
          'プレビュー成功時は後続の本取込で使う `previewToken` を返却する'
        )
        ResponseTitle = 'レスポンス（200：HospitalFacilityImportPreviewResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('previewToken', 'string', '✓', 'プレビュー識別子'),
          @('validRowCount', 'int32', '✓', '取込可能件数'),
          @('errorCount', 'int32', '✓', 'エラー件数'),
          @('errors', 'ImportPreviewError[]', '-', 'エラー詳細')
        )
        ResponseSubtables = @(
          @{
            Title = 'errors要素（ImportPreviewError）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('rowNumber', 'int32', '✓', 'Excel上の行番号'),
              @('message', 'string', '✓', 'エラー内容')
            )
          }
        )
        StatusRows = @(
          @('200', 'プレビュー成功', 'HospitalFacilityImportPreviewResponse'),
          @('400', 'ファイル形式不正または内容不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象施設に対する実効 `hospital_dept_master_edit` なし', 'ErrorResponse'),
          @('404', '対象施設が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '個別部署マスタインポート実行（/hospital-facility-master/facility-locations/import）'
        Overview = 'プレビュー済みデータを追加または置換モードで反映する。'
        Method = 'POST'
        Path = '/hospital-facility-master/facility-locations/import'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('facilityId', 'int64', '✓', '選択施設ID'),
          @('previewToken', 'string', '✓', 'プレビュー識別子'),
          @('mode', 'string', '✓', '`ADD` または `REPLACE`')
        )
        PermissionLines = @(
          '認可条件: 指定 `facilityId` について `user_facility_assignments` に有効割当があること',
          '認可条件: 指定 `facilityId` について `facility_feature_settings` と `user_facility_feature_settings` の両方で `hospital_dept_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '`ADD` は既存データへ追記する',
          '`REPLACE` は選択施設分の `facility_locations` と関連 `facility_location_remodels` を置き換える',
          '反映後、インポート結果件数を返却する'
        )
        ResponseTitle = 'レスポンス（200：HospitalFacilityImportResultResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('importedCount', 'int32', '✓', '反映件数'),
          @('updatedCount', 'int32', '✓', '更新件数'),
          @('deletedCount', 'int32', '✓', '置換時に削除した件数')
        )
        StatusRows = @(
          @('200', '取込成功', 'HospitalFacilityImportResultResponse'),
          @('400', 'プレビュー未実施またはモード不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象施設に対する実効 `hospital_dept_master_edit` なし', 'ErrorResponse'),
          @('404', '対象施設が存在しない', 'ErrorResponse'),
          @('404', 'プレビュー情報が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '個別部署マスタ新規作成（/hospital-facility-master/facility-locations）'
        Overview = '個別部署マスタ1行を新規登録する。リモデル先項目が入力されている場合は子レコードも同時作成する。'
        Method = 'POST'
        Path = '/hospital-facility-master/facility-locations'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('facilityId', 'int64', '✓', '対象施設ID'),
          @('shipDepartmentId', 'int64', '-', '現行側SHIP部署ID'),
          @('shipRoomCategoryId', 'int64', '-', '現行側SHIP諸室区分ID'),
          @('divisionId', 'string', '-', '旧_部門ID'),
          @('departmentId', 'string', '-', '旧_部署ID'),
          @('roomId', 'string', '-', '旧_諸室ID'),
          @('building', 'string', '-', '旧_棟'),
          @('floor', 'string', '✓', '旧_階'),
          @('departmentName', 'string', '✓', '旧_部門'),
          @('sectionName', 'string', '-', '旧_部署'),
          @('roomName', 'string', '✓', '旧_諸室'),
          @('targetShipDepartmentId', 'int64', '-', '新側SHIP部署ID'),
          @('targetShipRoomCategoryId', 'int64', '-', '新側SHIP諸室区分ID'),
          @('targetBuilding', 'string', '-', '新_棟'),
          @('targetFloor', 'string', '-', '新_階'),
          @('targetDepartmentName', 'string', '-', '新_部門'),
          @('targetSectionName', 'string', '-', '新_部署'),
          @('targetRoomName', 'string', '-', '新_諸室'),
          @('targetRoomCount', 'int32', '-', '新_室数')
        )
        PermissionLines = @(
          '認可条件: 指定 `facilityId` について `user_facility_assignments` に有効割当があること',
          '認可条件: 指定 `facilityId` について `facility_feature_settings` と `user_facility_feature_settings` の両方で `hospital_dept_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '`facility_locations` に現行ロケーションを新規作成する',
          'リモデル先項目が1つ以上入力されている場合は `facility_location_remodels` を同時作成する',
          'リモデル先未入力の場合は子レコードを作成しない'
        )
        ResponseTitle = 'レスポンス（201：HospitalFacilityLocationResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'HospitalFacilityLocationSummary', '✓', '登録後の1行DTO')
        )
        StatusRows = @(
          @('201', '登録成功', 'HospitalFacilityLocationResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象施設に対する実効 `hospital_dept_master_edit` なし', 'ErrorResponse'),
          @('404', '施設が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '個別部署マスタ更新（/hospital-facility-master/facility-locations/{facilityLocationId}）'
        Overview = '既存の個別部署マスタ1行を更新する。'
        Method = 'PUT'
        Path = '/hospital-facility-master/facility-locations/{facilityLocationId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('facilityLocationId', 'path', 'int64', '✓', '更新対象ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('shipDepartmentId', 'int64', '-', '現行側SHIP部署ID'),
          @('shipRoomCategoryId', 'int64', '-', '現行側SHIP諸室区分ID'),
          @('divisionId', 'string', '-', '旧_部門ID'),
          @('departmentId', 'string', '-', '旧_部署ID'),
          @('roomId', 'string', '-', '旧_諸室ID'),
          @('building', 'string', '-', '旧_棟'),
          @('floor', 'string', '✓', '旧_階'),
          @('departmentName', 'string', '✓', '旧_部門'),
          @('sectionName', 'string', '-', '旧_部署'),
          @('roomName', 'string', '✓', '旧_諸室'),
          @('targetShipDepartmentId', 'int64', '-', '新側SHIP部署ID'),
          @('targetShipRoomCategoryId', 'int64', '-', '新側SHIP諸室区分ID'),
          @('targetBuilding', 'string', '-', '新_棟'),
          @('targetFloor', 'string', '-', '新_階'),
          @('targetDepartmentName', 'string', '-', '新_部門'),
          @('targetSectionName', 'string', '-', '新_部署'),
          @('targetRoomName', 'string', '-', '新_諸室'),
          @('targetRoomCount', 'int32', '-', '新_室数')
        )
        PermissionLines = @(
          '認可条件: 対象 `facility_locations.facility_id` について `user_facility_assignments` に有効割当があること',
          '認可条件: 対象 `facility_locations.facility_id` について `facility_feature_settings` と `user_facility_feature_settings` の両方で `hospital_dept_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `facility_locations` が未削除で存在することを確認する',
          '現行ロケーションを更新する',
          '新側項目が入力されていれば `facility_location_remodels` を作成または更新し、すべて空なら削除または論理削除する'
        )
        ResponseTitle = 'レスポンス（200：HospitalFacilityLocationResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'HospitalFacilityLocationSummary', '✓', '更新後の1行DTO')
        )
        StatusRows = @(
          @('200', '更新成功', 'HospitalFacilityLocationResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象施設に対する実効 `hospital_dept_master_edit` なし', 'ErrorResponse'),
          @('404', '対象ロケーションが存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '個別部署マスタ削除（/hospital-facility-master/facility-locations/{facilityLocationId}）'
        Overview = '指定した個別部署マスタ1行を削除する。'
        Method = 'DELETE'
        Path = '/hospital-facility-master/facility-locations/{facilityLocationId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('facilityLocationId', 'path', 'int64', '✓', '削除対象ID')
        )
        PermissionLines = @(
          '認可条件: 対象 `facility_locations.facility_id` について `user_facility_assignments` に有効割当があること',
          '認可条件: 対象 `facility_locations.facility_id` について `facility_feature_settings` と `user_facility_feature_settings` の両方で `hospital_dept_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象 `facility_locations` を論理削除する',
          '関連する `facility_location_remodels` も同時に論理削除する'
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @(
          'Body は返却しない。'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象施設に対する実効 `hospital_dept_master_edit` なし', 'ErrorResponse'),
          @('404', '対象ロケーションが存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '必要権限' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定基準', '説明'); Rows = @(
      @('対象施設候補取得 / SHIP候補取得 / 一覧取得 / エクスポート / テンプレート取得', '`hospital_dept_master_list`', '対象施設に対して実効 `hospital_dept_master_list` を持つこと、または少なくとも1件の担当施設で同 feature を持つこと', '一覧参照と画面利用開始に必要'),
      @('インポートプレビュー / インポート実行 / 新規作成 / 更新 / 削除', '`hospital_dept_master_edit`', '対象施設に対して実効 `hospital_dept_master_edit` を持つこと', '変更系処理に必要')
    ) },
    @{ Type = 'Heading2'; Text = 'リモデル子レコード運用ルール' },
    @{ Type = 'Bullets'; Items = @(
      '現行ロケーションは `facility_locations` を正本とする',
      '1つの現行ロケーションに対して有効な `facility_location_remodels` は 0..1 件とする',
      '新側項目が全て空の場合は子レコードを作成しない、または既存子レコードを削除する'
    ) },
    @{ Type = 'Heading2'; Text = 'インポート運用ルール' },
    @{ Type = 'Bullets'; Items = @(
      '追加インポートは既存データへ追記する',
      '置換インポートは選択施設分のみを置き換える',
      'テンプレート列定義と一致しない場合はプレビュー段階でエラーとする'
    ) },
    @{ Type = 'Heading2'; Text = '未確定事項' },
    @{ Type = 'Bullets'; Items = @(
      'Excel テンプレートの最終必須列定義は、運用詳細確定時に再確認余地がある',
      'モックでは一部新側項目がインライン表示されていないが、DB/API は `targetFloor` / `targetRoomCount` を保持可能とする'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '説明'); Rows = @(
      @('VALIDATION_ERROR', '400', '入力不正、必須不足、形式不正'),
      @('FACILITY_SELECTION_REQUIRED', '400', '施設未選択で一覧/出力/取込を要求した'),
      @('IMPORT_FILE_INVALID', '400', '取込ファイル形式不正または内容不正'),
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
      @('AUTH_403_HOSPITAL_DEPT_MASTER_LIST_DENIED', '403', '対象施設に対する実効 `hospital_dept_master_list` がない、または実効 `hospital_dept_master_list` を持つ担当施設がない'),
      @('AUTH_403_HOSPITAL_DEPT_MASTER_EDIT_DENIED', '403', '対象施設に対する実効 `hospital_dept_master_edit` がない'),
      @('FACILITY_NOT_FOUND', '404', '対象施設が存在しない、または削除済み'),
      @('FACILITY_LOCATION_NOT_FOUND', '404', '対象施設ロケーションが存在しない'),
      @('IMPORT_PREVIEW_NOT_FOUND', '404', 'プレビュー情報が存在しない'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = 'マスタ保守方針' },
    @{ Type = 'Bullets'; Items = @(
      '個別部署マスタは施設単位で保守する',
      'SHIP部署・諸室区分は標準候補として利用し、現有品調査/調査登録内容修正の部門・部署正本は `facility_locations` 側とする',
      '削除済みデータは一覧、エクスポート、候補表示の対象外とする'
    ) },
    @{ Type = 'Heading2'; Text = '今後拡張時の留意点' },
    @{ Type = 'Bullets'; Items = @(
      '件数増加時はページングや並び順指定の追加を検討する',
      'インポートが大規模化する場合は非同期ジョブ化を検討する',
      '現行値反映の別機能を設ける場合は `facility_location_remodels` のライフサイクル整理が必要になる'
    ) }
  )
}
