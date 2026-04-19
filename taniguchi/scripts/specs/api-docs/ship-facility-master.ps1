@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_SHIP施設マスタ.docx'
  ScreenLabel = 'SHIP施設マスタ'
  CoverDateText = '2026年4月18日'
  RevisionDateText = '2026/4/18'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、SHIP施設マスタ画面（`/ship-facility-master`）で利用する API の設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      '一覧表示および絞り込み条件の I/F',
      '設立母体候補取得と新規設立母体登録ルール',
      '施設マスタの新規作成・更新・削除 I/F',
      'エクスポート処理の I/F',
      '権限・バリデーション・エラーレスポンス'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = 'SHIP施設マスタは、施設コード、施設名、都道府県、設立母体、病床数などの施設マスタを参照・管理する画面である。ヘッダーの表示件数、一覧絞り込み、エクスポート、新規作成、編集、削除を提供する。' },
    @{ Type = 'Paragraph'; Text = '設立母体は既存候補から選択でき、新規名称が入力された場合は設立母体登録後に施設へ紐づける。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('SHIP施設マスタ', 'SHIP側で参照・管理する施設マスタ画面およびその対象データ'),
      @('設立母体', '施設の上位組織。`establishments` で管理する'),
      @('施設マスタ', '施設コード、施設名、都道府県、病床数などを保持する `facilities` の業務概念'),
      @('作業対象施設', '認可判定の基準となる選択中施設。Bearer トークン上のコンテキストとして扱う')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('項目', '内容'); Rows = @(
      @('画面名', '18. SHIP施設マスタ画面'),
      @('画面URL', '/ship-facility-master'),
      @('主機能', '施設一覧の検索、設立母体候補取得、エクスポート、施設作成、更新、削除')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'APIの位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、SHIP施設マスタ画面の一覧参照、設立母体候補取得、エクスポート、施設登録、施設更新、施設削除を提供する。' },
    @{ Type = 'Paragraph'; Text = '画面は `establishments` と `facilities` を主に参照し、設立母体の新規入力時のみ `establishments` の作成を伴う。施設基本情報として、都道府県と病床数も本APIで扱う。' },
    @{ Type = 'Heading2'; Text = '画面とAPIの関係' },
    @{ Type = 'Numbered'; Items = @(
      '画面初期表示およびフィルタ変更時に施設マスタ一覧取得 API を呼び出す',
      '設立母体コンボボックス表示時に設立母体候補取得 API を呼び出す',
      'エクスポート押下時にエクスポート API を呼び出す',
      '新規作成モーダルの登録押下時に施設マスタ新規作成 API を呼び出す',
      '編集モーダルの更新押下時に施設マスタ更新 API を呼び出す',
      '削除確認モーダルの OK 押下時に施設マスタ削除 API を呼び出す'
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル', '用途', '主な利用カラム'); Rows = @(
      @('establishments', '設立母体候補表示、新規設立母体登録', 'establishment_id, establishment_name'),
      @('facilities', '一覧表示、施設登録、施設更新、施設削除', 'facility_id, establishment_id, facility_code, facility_name, prefecture, bed_count, system_contract_status, deleted_at')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON（エクスポートAPIを除く）',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-04-17T00:00:00Z`）',
      '論理削除済みデータ（`deleted_at` が設定済みのレコード）は一覧・候補・エクスポート対象外とする',
      '施設論理削除時も関連認可設定は保持し、再契約等で `deleted_at` を解除した場合は既存設定を再利用する',
      '`facility_code` は論理削除済み施設を含む `facilities` 全件で一意とし、再利用しない'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '認可判定は `feature_code` を正本とし、`taniguchi/docs/ロール整理.xlsx` の `権限管理単位一覧` シート A列に対応する `facility_master_list` と `facility_master_edit` を用いる。Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。画面表示用の `/auth/context` は UX 用キャッシュであり、各業務 API でも同条件を再判定する。施設を論理削除しても関連認可設定は保持するが、削除済み施設は `/auth/me`、`/auth/context`、業務 API の対象外とする。' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('一覧表示 / 設立母体候補取得 / エクスポート', '`facility_master_list`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '一覧参照系の処理'),
      @('新規作成 / 更新 / 削除', '`facility_master_edit`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '施設マスタ管理処理')
    ) },
    @{ Type = 'Heading2'; Text = '作業対象施設ベースの認可' },
    @{ Type = 'Bullets'; Items = @(
      '各 API は Bearer トークン上の作業対象施設に対する実効 `feature_code` を都度再判定する',
      '一覧・エクスポートの返却対象は施設マスタ全件とし、個票データ閲覧で用いる他施設公開設定は適用しない',
      '作業対象施設に対して必要な実効 `feature_code` がない場合は 403 を返却する'
    ) },
    @{ Type = 'Heading2'; Text = '検索・絞り込み仕様' },
    @{ Type = 'Bullets'; Items = @(
      '都道府県、設立母体、施設コード、施設名は AND 条件で絞り込む',
      '文字列検索は部分一致を基本とする',
      '表示件数は絞り込み後件数をそのまま返却する',
      '画面要件上ページングは定義しない'
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Heading3'; Text = '基本エラーレスポンス（ErrorResponse）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや補足情報')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API一覧' },
    @{ Type = 'Heading2'; Text = 'SHIP施設マスタ（/ship-facility-master）' },
    @{ Type = 'Table'; Headers = @('機能名', 'Method', 'Path', '概要', '認証'); Rows = @(
      @('施設マスタ一覧取得', 'GET', '/ship-facility-master/facilities', '施設一覧と表示件数を取得する', '要'),
      @('設立母体候補取得', 'GET', '/ship-facility-master/establishments', '設立母体コンボボックス用の候補を取得する', '要'),
      @('施設マスタエクスポート', 'GET', '/ship-facility-master/facilities/export', '現在の絞り込み条件で Excel を出力する', '要'),
      @('施設マスタ新規作成', 'POST', '/ship-facility-master/facilities', '施設マスタを新規登録する', '要'),
      @('施設マスタ更新', 'PUT', '/ship-facility-master/facilities/{facilityId}', '施設マスタを更新する', '要'),
      @('施設マスタ削除', 'DELETE', '/ship-facility-master/facilities/{facilityId}', '施設マスタを削除する', '要')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 SHIP施設マスタ機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '施設マスタ一覧取得（/ship-facility-master/facilities）'
        Overview = 'SHIP施設マスタ一覧と表示件数を取得する。都道府県、設立母体、施設コード、施設名で絞り込み可能とする。'
        Method = 'GET'
        Path = '/ship-facility-master/facilities'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('prefecture', 'query', 'string', '-', '都道府県の部分一致条件'),
          @('establishmentName', 'query', 'string', '-', '設立母体名の部分一致条件'),
          @('facilityCode', 'query', 'string', '-', '施設コードの部分一致条件'),
          @('facilityName', 'query', 'string', '-', '施設名の部分一致条件')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `facility_master_list` が有効であること'
        )
        ProcessingLines = @(
          '`facilities.deleted_at IS NULL` のみを対象にする',
          '`establishments` を結合して設立母体名を取得する',
          '都道府県・設立母体・施設コード・施設名は AND 条件で絞り込む',
          '画面要件上ページングは定義しない'
        )
        ResponseTitle = 'レスポンス（200：ShipFacilityListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '絞り込み後の一覧件数'),
          @('items', 'ShipFacilitySummary[]', '✓', '施設マスタ一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（ShipFacilitySummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('facilityId', 'int64', '✓', '施設ID（`facilities.facility_id`）'),
              @('establishmentId', 'int64', '✓', '設立母体ID（`establishments.establishment_id`）'),
              @('establishmentName', 'string', '✓', '設立母体名'),
              @('facilityCode', 'string', '-', '施設コード'),
              @('facilityName', 'string', '✓', '施設名'),
              @('prefecture', 'string', '-', '都道府県'),
              @('bedCount', 'int32', '-', '病床数'),
              @('updatedAt', 'datetime', '✓', '最終更新日時')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'ShipFacilityListResponse'),
          @('400', '不正な検索条件', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `facility_master_list` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '設立母体候補取得（/ship-facility-master/establishments）'
        Overview = '施設マスタ新規作成/編集モーダルの設立母体コンボボックスで使用する既存候補を取得する。'
        Method = 'GET'
        Path = '/ship-facility-master/establishments'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('keyword', 'query', 'string', '-', '設立母体名の前方/部分一致検索条件')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `facility_master_list` が有効であること'
        )
        ProcessingLines = @(
          '`establishments.deleted_at IS NULL` のみを対象にする',
          'keyword 指定時は設立母体名を部分一致で絞り込む'
        )
        ResponseTitle = 'レスポンス（200：EstablishmentCandidateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '返却候補件数'),
          @('items', 'EstablishmentOption[]', '✓', '設立母体候補一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（EstablishmentOption）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('establishmentId', 'int64', '✓', '設立母体ID'),
              @('establishmentName', 'string', '✓', '設立母体名')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'EstablishmentCandidateResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `facility_master_list` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '施設マスタエクスポート（/ship-facility-master/facilities/export）'
        Overview = '現在の絞り込み条件に一致する施設マスタ一覧を Excel ファイルとして出力する。'
        Method = 'GET'
        Path = '/ship-facility-master/facilities/export'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('prefecture', 'query', 'string', '-', '都道府県の部分一致条件'),
          @('establishmentName', 'query', 'string', '-', '設立母体名の部分一致条件'),
          @('facilityCode', 'query', 'string', '-', '施設コードの部分一致条件'),
          @('facilityName', 'query', 'string', '-', '施設名の部分一致条件')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `facility_master_list` が有効であること'
        )
        ProcessingLines = @(
          '一覧取得と同じ絞り込み条件を適用する',
          '出力対象は `deleted_at IS NULL` の未削除施設のみとする'
        )
        ResponseTitle = 'レスポンス（200：Excel File）'
        ResponseSubtables = @(
          @{
            Title = 'Headers'
            Headers = @('ヘッダー名', '必須', '形式', '説明')
            Rows = @(
              @('Content-Type', '✓', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Excel 形式で返却する'),
              @('Content-Disposition', '✓', 'attachment; filename="SHIP施設マスタ_YYYYMMDD.xlsx"', 'ダウンロードファイル名')
            )
          }
        )
        ResponseLines = @(
          'Body: フィルタ適用後の施設マスタ一覧を Excel バイナリで返却する。',
          '出力列の詳細は画面要件に未定義のため、本設計では少なくとも一覧表示項目（都道府県、設立母体、施設コード、施設名、病床数）を含むものとする。'
        )
        StatusRows = @(
          @('200', '出力成功', 'Excel File'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `facility_master_list` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '施設マスタ新規作成（/ship-facility-master/facilities）'
        Overview = '施設マスタを新規登録する。設立母体は既存候補選択または新規名称入力のいずれかを受け付ける。'
        Method = 'POST'
        Path = '/ship-facility-master/facilities'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエスト（FacilityCreateRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('establishmentId', 'int64', '条件付き', '既存設立母体を選択した場合に指定する'),
          @('newEstablishmentName', 'string', '条件付き', '新規設立母体を入力した場合に指定する'),
          @('prefecture', 'string', '-', '都道府県'),
          @('facilityCode', 'string', '✓', '施設コード'),
          @('facilityName', 'string', '✓', '施設名'),
          @('bedCount', 'int32', '-', '病床数')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `facility_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '`establishmentId` と `newEstablishmentName` はどちらか一方を必須とし、両方指定・両方未指定は入力エラーとする',
          '既存の設立母体が選択された場合は、`establishments.deleted_at IS NULL` の未削除設立母体だけを有効とし、存在しないまたは削除済みなら 404 `ESTABLISHMENT_NOT_FOUND` とする',
          '既存の設立母体が選択された場合は、その設立母体IDを `facilities.establishment_id` に設定して施設を登録する',
          '新規の設立母体名が入力された場合は、`establishments` に新規登録後、そのIDを施設へ紐づける',
          '`facilityCode` は論理削除済み施設を含む `facilities` 全件で一意とし、重複する場合は登録エラーとする',
          '`facilities.deleted_at` は `NULL` で登録する'
        )
        ResponseTitle = 'レスポンス（201：FacilityUpsertResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('facilityId', 'int64', '✓', '登録された施設ID'),
          @('establishmentId', 'int64', '✓', '紐づいた設立母体ID'),
          @('establishmentName', 'string', '✓', '紐づいた設立母体名'),
          @('prefecture', 'string', '-', '都道府県'),
          @('facilityCode', 'string', '✓', '施設コード'),
          @('facilityName', 'string', '✓', '施設名'),
          @('bedCount', 'int32', '-', '病床数'),
          @('createdAt', 'datetime', '✓', '作成日時'),
          @('updatedAt', 'datetime', '✓', '更新日時')
        )
        StatusRows = @(
          @('201', '登録成功', 'FacilityUpsertResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `facility_master_edit` なし', 'ErrorResponse'),
          @('404', '指定した設立母体が存在しない', 'ErrorResponse'),
          @('409', '施設コード重複', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '施設マスタ更新（/ship-facility-master/facilities/{facilityId}）'
        Overview = '既存の施設マスタを更新する。設立母体変更時は既存候補への付け替え、または新規設立母体登録後の付け替えを行う。'
        Method = 'PUT'
        Path = '/ship-facility-master/facilities/{facilityId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('facilityId', 'path', 'int64', '✓', '更新対象の施設ID')
        )
        RequestTitle = 'リクエスト（FacilityUpdateRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('establishmentId', 'int64', '条件付き', '既存設立母体を選択した場合に指定する'),
          @('newEstablishmentName', 'string', '条件付き', '新規設立母体を入力した場合に指定する'),
          @('prefecture', 'string', '-', '都道府県'),
          @('facilityCode', 'string', '✓', '施設コード'),
          @('facilityName', 'string', '✓', '施設名'),
          @('bedCount', 'int32', '-', '病床数')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `facility_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象施設が存在し、未削除であることを確認する',
          '`establishmentId` と `newEstablishmentName` はどちらか一方を必須とし、両方指定・両方未指定は入力エラーとする',
          '設立母体が既存候補へ変更された場合は、`establishments.deleted_at IS NULL` の未削除設立母体だけを有効とし、存在しないまたは削除済みなら 404 `ESTABLISHMENT_NOT_FOUND` とする',
          '設立母体が既存候補へ変更された場合は、施設の紐づけ先のみ更新する',
          '設立母体が新規名称へ変更された場合は、`establishments` 登録後に施設の紐づけ先を更新する',
          '`facilityCode` は論理削除済み施設を含む `facilities` 全件で一意とし、自身以外の他レコードと重複する場合は更新エラーとする',
          '`updated_at` を更新する'
        )
        ResponseTitle = 'レスポンス（200：FacilityUpsertResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('facilityId', 'int64', '✓', '更新対象の施設ID'),
          @('establishmentId', 'int64', '✓', '更新後の設立母体ID'),
          @('establishmentName', 'string', '✓', '更新後の設立母体名'),
          @('prefecture', 'string', '-', '都道府県'),
          @('facilityCode', 'string', '✓', '施設コード'),
          @('facilityName', 'string', '✓', '施設名'),
          @('bedCount', 'int32', '-', '病床数'),
          @('createdAt', 'datetime', '✓', '作成日時'),
          @('updatedAt', 'datetime', '✓', '更新日時')
        )
        StatusRows = @(
          @('200', '更新成功', 'FacilityUpsertResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `facility_master_edit` なし', 'ErrorResponse'),
          @('404', '対象施設または指定した設立母体が存在しない', 'ErrorResponse'),
          @('409', '施設コード重複', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '施設マスタ削除（/ship-facility-master/facilities/{facilityId}）'
        Overview = '指定した施設マスタを削除する。施設レコードは論理削除とし、設立母体自体は削除しない。'
        Method = 'DELETE'
        Path = '/ship-facility-master/facilities/{facilityId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('facilityId', 'path', 'int64', '✓', '削除対象の施設ID')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `facility_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象施設が存在し、未削除であることを確認する',
          '`facilities.deleted_at` に削除日時を設定する',
          '`user_facility_assignments`、`facility_feature_settings`、`facility_column_settings`、`user_facility_feature_settings`、`user_facility_column_settings`、`facility_external_view_settings`、`facility_external_column_settings`、`facility_collaboration_group_facilities` は更新・削除しない',
          '`establishments` は削除対象としない',
          '削除済み施設は一覧・候補・エクスポート・認可判定・業務データ参照の対象外とする',
          '再契約等で `deleted_at` を解除した場合は、保持済みの担当施設割当・認可設定をそのまま再利用する'
        )
        ResponseTitle = 'レスポンス'
        ResponseLines = @(
          'Body: なし'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `facility_master_edit` なし', 'ErrorResponse'),
          @('404', '対象施設が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '必要権限' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定基準', '説明'); Rows = @(
      @('一覧表示', '`facility_master_list`', 'Bearer トークン上の作業対象施設に対して実効 `facility_master_list` を持つこと', '施設一覧と表示件数を参照する'),
      @('設立母体候補取得', '`facility_master_list`', 'Bearer トークン上の作業対象施設に対して実効 `facility_master_list` を持つこと', '既存設立母体候補を取得する'),
      @('エクスポート', '`facility_master_list`', 'Bearer トークン上の作業対象施設に対して実効 `facility_master_list` を持つこと', '絞り込み結果を Excel で取得する'),
      @('新規作成 / 更新 / 削除', '`facility_master_edit`', 'Bearer トークン上の作業対象施設に対して実効 `facility_master_edit` を持つこと', '施設マスタを管理する')
    ) },
    @{ Type = 'Heading2'; Text = '設立母体登録ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`establishmentId` と `newEstablishmentName` は排他的必須とし、両方指定・両方未指定は `VALIDATION_ERROR` とする',
      '既存設立母体ID指定時は `establishments.deleted_at IS NULL` の未削除設立母体のみ有効とし、存在しないまたは削除済みの場合は `ESTABLISHMENT_NOT_FOUND` を返す',
      '既存設立母体を選択した場合は、選択した設立母体IDを施設へ紐づける',
      '新規名称が入力された場合は、設立母体登録後に施設へ紐づける',
      '更新時に設立母体が変更された場合も同じルールを適用する'
    ) },
    @{ Type = 'Heading2'; Text = '施設コード管理ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`facility_code` は論理削除済み施設を含む `facilities` 全件で一意とする',
      '施設論理削除後も `facility_code` は再利用しない',
      '再契約等で施設を復活させる場合は、既存施設レコードの `deleted_at` を解除して再利用する'
    ) },
    @{ Type = 'Heading2'; Text = '削除ルール' },
    @{ Type = 'Bullets'; Items = @(
      '削除対象は `facilities` のみとし、`establishments` は削除しない',
      '削除は論理削除（`deleted_at` 更新）とする',
      '論理削除済み施設は一覧、候補、エクスポート、認可判定、業務データ参照の対象外とする',
      '施設論理削除時も関連認可設定は削除せず保持し、再契約等で `deleted_at` を解除した場合は既存設定を再利用する'
    ) },
    @{ Type = 'Heading2'; Text = '未確定事項' },
    @{ Type = 'Bullets'; Items = @(
      'エクスポート API の詳細出力列は画面要件に明記がないため、一覧表示項目を最低限の出力対象としている'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '説明'); Rows = @(
      @('VALIDATION_ERROR', '400', '入力不正、条件付き必須不足、形式不正'),
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
      @('AUTH_403_FACILITY_MASTER_LIST_DENIED', '403', '作業対象施設に対する実効 `facility_master_list` がない'),
      @('AUTH_403_FACILITY_MASTER_EDIT_DENIED', '403', '作業対象施設に対する実効 `facility_master_edit` がない'),
      @('FACILITY_NOT_FOUND', '404', '対象施設が存在しない、または削除済み'),
      @('ESTABLISHMENT_NOT_FOUND', '404', '指定した設立母体が存在しない、または削除済み'),
      @('FACILITY_CODE_DUPLICATE', '409', '論理削除済み施設を含めて施設コードが重複している'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = 'マスタ保守方針' },
    @{ Type = 'Bullets'; Items = @(
      '施設コードの一意性を維持し、論理削除後も再利用しない',
      '設立母体名の新規登録は重複名称の有無を確認して実施する',
      '施設更新・削除後は一覧 API の返却結果に即時反映する'
    ) },
    @{ Type = 'Heading2'; Text = 'エクスポート運用' },
    @{ Type = 'Bullets'; Items = @(
      'エクスポート対象は呼び出し時点の絞り込み結果とする',
      'ファイル名は `SHIP施設マスタ_YYYYMMDD.xlsx` を基本とする',
      '大量件数対応が必要になった場合は非同期出力方式を別途検討する'
    ) }
  )
}
