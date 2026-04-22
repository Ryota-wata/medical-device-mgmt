@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_SHIP部署マスタ.docx'
  ScreenLabel = 'SHIP部署マスタ'
  CoverDateText = '2026年4月18日'
  RevisionDateText = '2026/4/18'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、SHIP部署マスタ画面（`/ship-department-master`）で利用する API の設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      '部署マスタおよび諸室区分マスタの一覧取得・登録・更新・削除I/F',
      '個別部署マスタで利用する標準候補の管理方針',
      '一意性、参照整合性、削除制約',
      '権限、バリデーション、エラーレスポンス'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = 'SHIP部署マスタは、部門/部署および諸室区分の標準候補を参照・管理する画面である。個別部署マスタ画面における標準候補選択と、施設ロケーションの標準化に利用する。' },
    @{ Type = 'Paragraph'; Text = '画面は左右2カラムで構成され、左側で部署マスタ、右側で諸室区分マスタを独立して検索・登録・更新・削除する。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('SHIP部署マスタ', 'SHIPで定義する部門/部署の標準候補マスタ'),
      @('SHIP諸室区分マスタ', 'SHIPで定義する諸室区分①/②の標準候補マスタ'),
      @('個別部署マスタ', '施設ごとの部門/部署/諸室を保持し、SHIP標準候補と紐づける画面および対象データ')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('項目', '内容'); Rows = @(
      @('画面名', '20. SHIP部署マスタ画面'),
      @('画面URL', '/ship-department-master'),
      @('主機能', '部署マスタと諸室区分マスタを独立して検索・登録・更新・削除する')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'SHIP部署マスタAPIの位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、SHIP部署マスタ画面の一覧参照、登録、更新、削除を提供する。部署マスタと諸室区分マスタは独立したAPI群として扱う。' },
    @{ Type = 'Paragraph'; Text = 'また、個別部署マスタ画面の標準候補として利用されるため、削除時は関連テーブルからの参照整合性を考慮する。' },
    @{ Type = 'Heading2'; Text = '画面とAPIの関係' },
    @{ Type = 'Numbered'; Items = @(
      '画面初期表示および絞り込み時に部署マスタ一覧取得APIまたは諸室区分マスタ一覧取得APIを呼び出す',
      '左側領域の新規作成・更新・削除操作では部署マスタ変更系APIを呼び出す',
      '右側領域の新規作成・更新・削除操作では諸室区分マスタ変更系APIを呼び出す'
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル', '利用内容', '主な項目'); Rows = @(
      @('ship_departments', '部署マスタの一覧取得・新規作成・更新・削除', 'ship_department_id, division_name, department_name'),
      @('ship_room_categories', '諸室区分マスタの一覧取得・新規作成・更新・削除', 'ship_room_category_id, room_category1, room_category2'),
      @('facility_locations', '部署/諸室区分マスタ削除時の参照有無確認', 'ship_department_id, ship_room_category_id'),
      @('facility_location_remodels', '削除時の参照有無確認', 'target_ship_department_id, target_ship_room_category_id')
    ) },
    @{ Type = 'Paragraph'; Text = '本画面は左右2カラムで構成され、左側の部署マスタ領域と右側の諸室区分マスタ領域を独立した API 群で扱う。' },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-04-18T00:00:00Z`）',
      '画面要件上ページングは定義しない'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '本API群で使用する `feature_code` は以下の通りとする。Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。画面表示用の `/auth/context` は UX 用キャッシュであり、各業務 API でも同条件を再判定する。' },
    @{ Type = 'Table'; Headers = @('管理単位名', 'feature_code', '対象処理'); Rows = @(
      @('SHIP部署マスタ / 一覧', '`ship_dept_master_list`', '部署マスタ一覧取得、諸室区分マスタ一覧取得'),
      @('SHIP部署マスタ / 新規作成・編集', '`ship_dept_master_edit`', '部署マスタ新規作成、更新、削除、諸室区分マスタ新規作成、更新、削除')
    ) },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('部署マスタ一覧取得 / 諸室区分マスタ一覧取得', '`ship_dept_master_list`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '画面表示と一覧参照系の処理'),
      @('部署マスタ新規作成 / 更新 / 削除', '`ship_dept_master_edit`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '部署マスタ変更系の処理'),
      @('諸室区分マスタ新規作成 / 更新 / 削除', '`ship_dept_master_edit`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '諸室区分マスタ変更系の処理')
    ) },
    @{ Type = 'Heading2'; Text = '作業対象施設ベースの認可' },
    @{ Type = 'Bullets'; Items = @(
      '各 API は Bearer トークン上の作業対象施設に対する実効 `feature_code` を都度再判定する',
      'SHIP部署マスタと SHIP諸室区分マスタの返却対象は共通マスタ全件とし、個票データ閲覧で用いる他施設公開設定は適用しない',
      '作業対象施設に対して必要な実効 `feature_code` がない場合は 403 を返却する'
    ) },
    @{ Type = 'Heading2'; Text = '検索・絞り込み仕様' },
    @{ Type = 'Bullets'; Items = @(
      '部署マスタと諸室区分マスタは独立して検索する',
      '各領域の2項目フィルタは AND 条件で絞り込む',
      '文字列検索は部分一致を基本とする',
      '表示件数は絞り込み後件数をそのまま返却する'
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Heading3'; Text = '基本エラーレスポンス（ErrorResponse）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや補足情報')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API一覧' },
    @{ Type = 'Heading2'; Text = 'SHIP部署マスタ（/ship-department-master）' },
    @{ Type = 'Table'; Headers = @('機能名', 'Method', 'Path', '概要', '認証'); Rows = @(
      @('部署マスタ一覧取得', 'GET', '/ship-department-master/departments', '部門/部署の一覧と表示件数を取得する', '要'),
      @('部署マスタ新規作成', 'POST', '/ship-department-master/departments', '部門/部署を新規登録する', '要'),
      @('部署マスタ更新', 'PUT', '/ship-department-master/departments/{shipDepartmentId}', '部門/部署を更新する', '要'),
      @('部署マスタ削除', 'DELETE', '/ship-department-master/departments/{shipDepartmentId}', '部門/部署を削除する', '要'),
      @('諸室区分マスタ一覧取得', 'GET', '/ship-department-master/room-categories', '諸室区分①/②の一覧と表示件数を取得する', '要'),
      @('諸室区分マスタ新規作成', 'POST', '/ship-department-master/room-categories', '諸室区分①/②を新規登録する', '要'),
      @('諸室区分マスタ更新', 'PUT', '/ship-department-master/room-categories/{shipRoomCategoryId}', '諸室区分①/②を更新する', '要'),
      @('諸室区分マスタ削除', 'DELETE', '/ship-department-master/room-categories/{shipRoomCategoryId}', '諸室区分①/②を削除する', '要')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 SHIP部署マスタ機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '部署マスタ一覧取得 （/ship-department-master/departments）'
        Overview = 'SHIP部署マスタの一覧と表示件数を取得する。部門名、部署名で独立して絞り込み可能とする。'
        Method = 'GET'
        Path = '/ship-department-master/departments'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('divisionName', 'query', 'string', '-', '部門名の部分一致条件'),
          @('departmentName', 'query', 'string', '-', '部署名の部分一致条件')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `ship_dept_master_list` が有効であること'
        )
        ProcessingLines = @(
          '`ship_departments` を `sort_order ASC, ship_department_id ASC` で取得する',
          '部門名と部署名は AND 条件で絞り込む',
          '文字列検索は部分一致を基本とする',
          '画面要件上ページングは定義しない'
        )
        ResponseTitle = 'レスポンス（200：ShipDepartmentListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '絞り込み後の一覧件数'),
          @('items', 'ShipDepartmentSummary[]', '✓', '部署マスタ一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（ShipDepartmentSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('shipDepartmentId', 'int64', '✓', 'SHIP部署ID'),
              @('divisionName', 'string', '✓', '部門名'),
              @('departmentName', 'string', '✓', '部署名')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'ShipDepartmentListResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `ship_dept_master_list` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '部署マスタ新規作成 （/ship-department-master/departments）'
        Overview = 'SHIP部署マスタへ部門/部署の組み合わせを新規登録する。'
        Method = 'POST'
        Path = '/ship-department-master/departments'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('divisionName', 'string', '✓', '部門名'),
          @('departmentName', 'string', '✓', '部署名')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `ship_dept_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '`ship_departments` に新規レコードを追加する',
          '`sort_order` は未指定時に既定値 `0` を採用する想定とする',
          '`is_active` は未指定時に `true` を採用する想定とする',
          '`(division_name, department_name)` の重複は登録不可とする'
        )
        ResponseTitle = 'レスポンス（201：ShipDepartmentResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'ShipDepartmentSummary', '✓', '登録後の部署マスタ')
        )
        ResponseSubtables = @(
          @{
            Title = 'item要素（ShipDepartmentSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('shipDepartmentId', 'int64', '✓', 'SHIP部署ID'),
              @('divisionName', 'string', '✓', '部門名'),
              @('departmentName', 'string', '✓', '部署名')
            )
          }
        )
        StatusRows = @(
          @('201', '登録成功', 'ShipDepartmentResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `ship_dept_master_edit` なし', 'ErrorResponse'),
          @('409', '部門/部署の組み合わせが重複', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '部署マスタ更新（/ship-department-master/departments/{shipDepartmentId}）'
        Overview = '指定したSHIP部署マスタを更新する。'
        Method = 'PUT'
        Path = '/ship-department-master/departments/{shipDepartmentId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('shipDepartmentId', 'path', 'int64', '✓', '更新対象のSHIP部署ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('divisionName', 'string', '✓', '更新後の部門名'),
          @('departmentName', 'string', '✓', '更新後の部署名')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `ship_dept_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '指定IDの `ship_departments` を更新する',
          '`(division_name, department_name)` の重複は更新不可とする',
          '`facility_locations` / `facility_location_remodels` は FK 参照を維持したまま、JOIN名称が更新後値へ切り替わる想定とする'
        )
        ResponseTitle = 'レスポンス（200：ShipDepartmentResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'ShipDepartmentSummary', '✓', '更新後の部署マスタ')
        )
        ResponseSubtables = @(
          @{
            Title = 'item要素（ShipDepartmentSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('shipDepartmentId', 'int64', '✓', 'SHIP部署ID'),
              @('divisionName', 'string', '✓', '部門名'),
              @('departmentName', 'string', '✓', '部署名')
            )
          }
        )
        StatusRows = @(
          @('200', '更新成功', 'ShipDepartmentResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `ship_dept_master_edit` なし', 'ErrorResponse'),
          @('404', '対象マスタが存在しない', 'ErrorResponse'),
          @('409', '部門/部署の組み合わせが重複', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '部署マスタ削除（/ship-department-master/departments/{shipDepartmentId}）'
        Overview = '指定したSHIP部署マスタを削除する。'
        Method = 'DELETE'
        Path = '/ship-department-master/departments/{shipDepartmentId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('shipDepartmentId', 'path', 'int64', '✓', '削除対象のSHIP部署ID')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `ship_dept_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象レコードを物理削除する想定とする',
          '`facility_locations.ship_department_id` または `facility_location_remodels.target_ship_department_id` から参照されている場合は削除不可とする'
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @(
          'Body は返却しない。'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `ship_dept_master_edit` なし', 'ErrorResponse'),
          @('404', '対象マスタが存在しない', 'ErrorResponse'),
          @('409', '関連データから参照中で削除不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '諸室区分マスタ一覧取得 （/ship-department-master/room-categories）'
        Overview = 'SHIP諸室区分マスタの一覧と表示件数を取得する。諸室区分①、諸室区分②で独立して絞り込み可能とする。'
        Method = 'GET'
        Path = '/ship-department-master/room-categories'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('roomCategory1', 'query', 'string', '-', '諸室区分①の部分一致条件'),
          @('roomCategory2', 'query', 'string', '-', '諸室区分②の部分一致条件')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `ship_dept_master_list` が有効であること'
        )
        ProcessingLines = @(
          '`ship_room_categories` を `sort_order ASC, ship_room_category_id ASC` で取得する',
          '諸室区分①と諸室区分②は AND 条件で絞り込む',
          '文字列検索は部分一致を基本とする',
          '画面要件上ページングは定義しない'
        )
        ResponseTitle = 'レスポンス（200：ShipRoomCategoryListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '絞り込み後の一覧件数'),
          @('items', 'ShipRoomCategorySummary[]', '✓', '諸室区分マスタ一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（ShipRoomCategorySummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('shipRoomCategoryId', 'int64', '✓', 'SHIP諸室区分ID'),
              @('roomCategory1', 'string', '✓', '諸室区分①'),
              @('roomCategory2', 'string', '✓', '諸室区分②')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'ShipRoomCategoryListResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `ship_dept_master_list` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '諸室区分マスタ新規作成 （/ship-department-master/room-categories）'
        Overview = 'SHIP諸室区分マスタへ諸室区分①/②の組み合わせを新規登録する。'
        Method = 'POST'
        Path = '/ship-department-master/room-categories'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('roomCategory1', 'string', '✓', '諸室区分①'),
          @('roomCategory2', 'string', '✓', '諸室区分②')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `ship_dept_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '`ship_room_categories` に新規レコードを追加する',
          '`sort_order` は未指定時に既定値 `0` を採用する想定とする',
          '`is_active` は未指定時に `true` を採用する想定とする',
          '`(room_category1, room_category2)` の重複は登録不可とする'
        )
        ResponseTitle = 'レスポンス（201：ShipRoomCategoryResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'ShipRoomCategorySummary', '✓', '登録後の諸室区分マスタ')
        )
        ResponseSubtables = @(
          @{
            Title = 'item要素（ShipRoomCategorySummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('shipRoomCategoryId', 'int64', '✓', 'SHIP諸室区分ID'),
              @('roomCategory1', 'string', '✓', '諸室区分①'),
              @('roomCategory2', 'string', '✓', '諸室区分②')
            )
          }
        )
        StatusRows = @(
          @('201', '登録成功', 'ShipRoomCategoryResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `ship_dept_master_edit` なし', 'ErrorResponse'),
          @('409', '諸室区分①/②の組み合わせが重複', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '諸室区分マスタ更新（/ship-department-master/room-categories/{shipRoomCategoryId}）'
        Overview = '指定したSHIP諸室区分マスタを更新する。'
        Method = 'PUT'
        Path = '/ship-department-master/room-categories/{shipRoomCategoryId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('shipRoomCategoryId', 'path', 'int64', '✓', '更新対象のSHIP諸室区分ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('roomCategory1', 'string', '✓', '更新後の諸室区分①'),
          @('roomCategory2', 'string', '✓', '更新後の諸室区分②')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `ship_dept_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '指定IDの `ship_room_categories` を更新する',
          '`(room_category1, room_category2)` の重複は更新不可とする',
          '`facility_locations` / `facility_location_remodels` は FK 参照を維持したまま、JOIN名称が更新後値へ切り替わる想定とする'
        )
        ResponseTitle = 'レスポンス（200：ShipRoomCategoryResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'ShipRoomCategorySummary', '✓', '更新後の諸室区分マスタ')
        )
        ResponseSubtables = @(
          @{
            Title = 'item要素（ShipRoomCategorySummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('shipRoomCategoryId', 'int64', '✓', 'SHIP諸室区分ID'),
              @('roomCategory1', 'string', '✓', '諸室区分①'),
              @('roomCategory2', 'string', '✓', '諸室区分②')
            )
          }
        )
        StatusRows = @(
          @('200', '更新成功', 'ShipRoomCategoryResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `ship_dept_master_edit` なし', 'ErrorResponse'),
          @('404', '対象マスタが存在しない', 'ErrorResponse'),
          @('409', '諸室区分①/②の組み合わせが重複', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '諸室区分マスタ削除（/ship-department-master/room-categories/{shipRoomCategoryId}）'
        Overview = '指定したSHIP諸室区分マスタを削除する。'
        Method = 'DELETE'
        Path = '/ship-department-master/room-categories/{shipRoomCategoryId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('shipRoomCategoryId', 'path', 'int64', '✓', '削除対象のSHIP諸室区分ID')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `ship_dept_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象レコードを物理削除する想定とする',
          '`facility_locations.ship_room_category_id` または `facility_location_remodels.target_ship_room_category_id` から参照されている場合は削除不可とする'
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @(
          'Body は返却しない。'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `ship_dept_master_edit` なし', 'ErrorResponse'),
          @('404', '対象マスタが存在しない', 'ErrorResponse'),
          @('409', '関連データから参照中で削除不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '必要権限' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定基準', '説明'); Rows = @(
      @('部署マスタ一覧取得', '`ship_dept_master_list`', 'Bearer トークン上の作業対象施設に対して実効 `ship_dept_master_list` を持つこと', '部署マスタ一覧と表示件数を参照する'),
      @('諸室区分マスタ一覧取得', '`ship_dept_master_list`', 'Bearer トークン上の作業対象施設に対して実効 `ship_dept_master_list` を持つこと', '諸室区分マスタ一覧と表示件数を参照する'),
      @('部署マスタ新規作成 / 更新 / 削除', '`ship_dept_master_edit`', 'Bearer トークン上の作業対象施設に対して実効 `ship_dept_master_edit` を持つこと', '部署マスタ変更系API'),
      @('諸室区分マスタ新規作成 / 更新 / 削除', '`ship_dept_master_edit`', 'Bearer トークン上の作業対象施設に対して実効 `ship_dept_master_edit` を持つこと', '諸室区分マスタ変更系API')
    ) },
    @{ Type = 'Heading2'; Text = '一意性ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`ship_departments` は `(division_name, department_name)` の組み合わせを一意に保つ',
      '`ship_room_categories` は `(room_category1, room_category2)` の組み合わせを一意に保つ',
      '重複登録・重複更新は 409 を返却する'
    ) },
    @{ Type = 'Heading2'; Text = '削除制約' },
    @{ Type = 'Bullets'; Items = @(
      '`ship_departments` は `facility_locations` または `facility_location_remodels` から参照されている場合、削除不可とする',
      '`ship_room_categories` も同様に `facility_locations` または `facility_location_remodels` から参照されている場合、削除不可とする',
      '参照中削除は 409 (`MASTER_IN_USE`) を返却する想定とする'
    ) },
    @{ Type = 'Heading2'; Text = '実装前提' },
    @{ Type = 'Bullets'; Items = @(
      '画面の表示制御は `/auth/context` の `ship_dept_master_list` / `ship_dept_master_edit` を参照して行い、一覧表示、編集ボタン、新規作成ボタン、削除ボタンを同じ `feature_code` で出し分ける',
      'モックの状態管理は `DEPT001` / `ROOM001` の文字列IDを用いるが、API と DB の正本キーは bigint の内部IDとする',
      '`sort_order` と `is_active` は現行画面の入力項目に含めず、登録時は DB 既定値を採用する',
      '削除は論理削除ではなく物理削除とし、参照整合性を満たす場合のみ実行する'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '説明'); Rows = @(
      @('VALIDATION_ERROR', '400', '入力不正、必須不足、形式不正'),
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
      @('AUTH_403_SHIP_DEPT_MASTER_LIST_DENIED', '403', '作業対象施設に対する実効 `ship_dept_master_list` がない'),
      @('AUTH_403_SHIP_DEPT_MASTER_EDIT_DENIED', '403', '作業対象施設に対する実効 `ship_dept_master_edit` がない'),
      @('SHIP_DEPARTMENT_NOT_FOUND', '404', '対象のSHIP部署マスタが存在しない'),
      @('SHIP_ROOM_CATEGORY_NOT_FOUND', '404', '対象のSHIP諸室区分マスタが存在しない'),
      @('SHIP_DEPARTMENT_DUPLICATE', '409', '部門名/部署名の組み合わせが重複している'),
      @('SHIP_ROOM_CATEGORY_DUPLICATE', '409', '諸室区分①/②の組み合わせが重複している'),
      @('MASTER_IN_USE', '409', '関連データから参照されているため削除できない'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = 'マスタ保守方針' },
    @{ Type = 'Bullets'; Items = @(
      '部署マスタと諸室区分マスタは、個別部署マスタ画面の標準候補として利用される共通マスタとして管理する',
      '名称変更は個別部署マスタ画面の標準候補表示へ即時反映できるよう、FK 参照を前提に運用する',
      '削除は参照整合性を確認したうえで実施する'
    ) },
    @{ Type = 'Heading2'; Text = '今後拡張時の留意点' },
    @{ Type = 'Bullets'; Items = @(
      '`sort_order` や `is_active` を画面から保守する場合は、既存APIに後方互換を保った項目追加で対応する',
      '検索件数が増加した場合はページングや並び順指定の追加を検討する',
      '共通マスタの変更は個別部署マスタ画面の標準候補表示・参照整合性へ影響するため、関連機能と合わせて回帰確認する'
    ) }
  )
}
