@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_業者マスタ.docx'
  ScreenLabel = '業者マスタ'
  CoverDateText = '2026年4月18日'
  RevisionDateText = '2026/4/18'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、業者マスタ画面（`/vendor-master`）で利用する API の設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      '業者一覧の取得、絞り込み、新規登録、更新、削除I/F',
      '画面で扱う担当施設、業者情報、連絡先情報の入出力項目',
      '論理削除を前提とした削除方針',
      '権限、バリデーション、エラーレスポンス'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '業者マスタは、見積・修理・保守・貸出・廃棄などのフローで参照する業者情報を管理する画面である。担当施設、インボイス登録番号、住所、担当者、連絡先などを管理し、関連申請で業者候補として再利用する。' },
    @{ Type = 'Paragraph'; Text = 'モック画面は、PCでは表形式、モバイルではカード形式で表示し、フィルター条件による絞り込み、新規作成モーダル、編集モーダル、削除確認ダイアログを備える。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('業者マスタ', '業者情報を管理する `vendors` テーブルおよびその管理画面'),
      @('担当施設', '業者の主担当先として紐づく施設。`facilities` の施設情報を参照する'),
      @('担当フラグ', '当該施設に対するメイン担当者であることを示すフラグ。モックの `isPrimaryContact` に相当する')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('項目', '内容'); Rows = @(
      @('画面名', '63. 業者マスタ画面'),
      @('画面URL', '/vendor-master'),
      @('主機能', '業者一覧の検索、作成、更新、削除')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = '業者マスタAPIの位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、業者マスタ画面の一覧参照、登録、更新、削除を提供する。業者情報は `vendors` を正本とし、画面表示時は `facilities` を参照して担当施設名を解決する。' },
    @{ Type = 'Paragraph'; Text = '新規作成・編集モーダルで選択する担当施設候補は、業者マスタAPI自身では返却せず、既存の施設マスタ取得APIから取得する前提とする。本API群では、選択結果として `facilityId` を受け取り、存在確認のみを行う。' },
    @{ Type = 'Paragraph'; Text = '削除は `deleted_at` を用いた論理削除を前提とし、既存申請・見積・修理・保守などの履歴参照を壊さずに、マスタ候補からは除外する。' },
    @{ Type = 'Heading2'; Text = '画面とAPIの関係' },
    @{ Type = 'Numbered'; Items = @(
      '画面初期表示および絞り込み時に業者一覧取得APIを呼び出す',
      '新規作成モーダルの作成ボタン押下時に業者新規作成APIを呼び出す',
      '編集モーダルの更新ボタン押下時に業者更新APIを呼び出す',
      '削除確認ダイアログで確定した場合に業者削除APIを呼び出す'
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル', '利用内容', '主な項目'); Rows = @(
      @('vendors', '一覧取得・新規作成・更新・削除の正本', 'vendor_id, facility_id, invoice_registration_no, vendor_name, address, position_name, role_name, contact_person, phone, email, is_primary_contact, deleted_at'),
      @('facilities', '担当施設名の解決、施設存在確認、担当施設候補APIの参照元', 'facility_id, facility_name'),
      @('rfq_vendors / quotations / orders / borrowing_application_details / disposal_application_details / repair_request_details / maintenance_contracts / inspection_tasks / edit_list_items', '論理削除後も参照される業者履歴の参照先', 'vendor_id, vendor_name など')
    ) },

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
    @{ Type = 'Paragraph'; Text = '認可判定は `feature_code` を正本とし、`taniguchi/docs/ロール整理.xlsx` の `権限管理単位一覧` シート A列に対応する `vendor_master_list` と `vendor_master_edit` を用いる。Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。画面表示用の `/auth/context` は UX 用キャッシュであり、各業務 API でも同条件を再判定する。' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('業者一覧取得', '`vendor_master_list`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '一覧参照と絞り込み'),
      @('業者新規作成 / 更新 / 削除', '`vendor_master_edit`', '`user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`', '業者マスタ管理処理')
    ) },
    @{ Type = 'Heading2'; Text = '作業対象施設ベースの認可' },
    @{ Type = 'Bullets'; Items = @(
      '各 API は Bearer トークン上の作業対象施設に対する実効 `feature_code` を都度再判定する',
      '業者一覧の返却対象は未削除施設に紐づく未削除業者全件とし、個票データ閲覧で用いる他施設公開設定は適用しない',
      'リクエストボディの `facilityId` は業者データの所属先を表す業務項目であり、認可判定の正本には使わない',
      '作業対象施設に対して必要な実効 `feature_code` がない場合は 403 を返却する'
    ) },
    @{ Type = 'Heading2'; Text = '検索・絞り込み仕様' },
    @{ Type = 'Bullets'; Items = @(
      'モック画面に合わせ、担当施設名、業者名、キーワードで絞り込む',
      '担当施設候補は既存の施設マスタAPIから取得し、業者マスタAPIでは候補一覧を返さない',
      'キーワード検索はインボイス登録番号、住所、役職、役割、氏名、連絡先、メールを対象にする',
      '文字列検索は部分一致を基本とする',
      '一覧取得では `deleted_at IS NULL` の業者のみ返却する'
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Heading3'; Text = '基本エラーレスポンス（ErrorResponse）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや補足情報')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API一覧' },
    @{ Type = 'Heading2'; Text = '業者マスタ（/vendor-master）' },
    @{ Type = 'Table'; Headers = @('機能名', 'Method', 'Path', '概要', '認証'); Rows = @(
      @('業者一覧取得', 'GET', '/vendor-master/vendors', '業者一覧と件数を取得する', '要'),
      @('業者新規作成', 'POST', '/vendor-master/vendors', '業者情報を新規登録する', '要'),
      @('業者更新', 'PUT', '/vendor-master/vendors/{vendorId}', '既存業者情報を更新する', '要'),
      @('業者削除', 'DELETE', '/vendor-master/vendors/{vendorId}', '既存業者を論理削除する', '要')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 業者マスタ機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '業者一覧取得（/vendor-master/vendors）'
        Overview = '業者一覧と表示件数を取得する。担当施設名、業者名、キーワードで絞り込み可能とする。'
        Method = 'GET'
        Path = '/vendor-master/vendors'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('facilityName', 'query', 'string', '-', '担当施設名の部分一致条件'),
          @('vendorName', 'query', 'string', '-', '業者名の部分一致条件'),
          @('keyword', 'query', 'string', '-', 'インボイス登録番号、住所、役職、役割、氏名、連絡先、メールの横断検索')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `vendor_master_list` が有効であること'
        )
        ProcessingLines = @(
          '`vendors.deleted_at IS NULL` かつ `facilities.deleted_at IS NULL` のみを対象にする',
          '`facilities` を参照して担当施設名を解決する',
          '担当施設名・業者名・キーワードは AND 条件で絞り込む',
          '画面要件上ページングは定義しない'
        )
        ResponseTitle = 'レスポンス（200：VendorListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('totalCount', 'int32', '✓', '絞り込み後の一覧件数'),
          @('items', 'VendorSummary[]', '✓', '業者一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（VendorSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('vendorId', 'int64', '✓', '業者ID'),
              @('facilityId', 'int64', '-', '担当施設ID'),
              @('facilityName', 'string', '-', '担当施設名'),
              @('invoiceRegistrationNo', 'string', '-', 'インボイス登録番号'),
              @('vendorName', 'string', '✓', '業者名'),
              @('address', 'string', '-', '住所'),
              @('positionName', 'string', '-', '役職'),
              @('roleName', 'string', '-', '役割'),
              @('contactPerson', 'string', '-', '担当者名'),
              @('phone', 'string', '-', '電話番号'),
              @('email', 'string', '-', 'メール'),
              @('isPrimaryContact', 'boolean', '✓', '主担当フラグ')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'VendorListResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `vendor_master_list` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '業者新規作成（/vendor-master/vendors）'
        Overview = '担当施設、連絡先、業者情報を含む業者マスタを新規登録する。'
        Method = 'POST'
        Path = '/vendor-master/vendors'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('facilityId', 'int64', '✓', '担当施設ID'),
          @('invoiceRegistrationNo', 'string', '✓', 'インボイス登録番号'),
          @('vendorName', 'string', '✓', '業者名'),
          @('address', 'string', '-', '住所'),
          @('positionName', 'string', '-', '役職'),
          @('roleName', 'string', '-', '役割'),
          @('contactPerson', 'string', '✓', '担当者名'),
          @('phone', 'string', '✓', '電話番号'),
          @('email', 'string', '✓', 'メール'),
          @('isPrimaryContact', 'boolean', '-', '主担当フラグ。未指定時は `false`')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `vendor_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '`facilities.deleted_at IS NULL` の未削除施設IDであることを検証する',
          '`vendors` に新規レコードを追加し、`created_at` と `updated_at` を現在時刻で設定する',
          '`deleted_at` は `NULL`、`is_primary_contact` は未指定時 `false` とする'
        )
        ResponseTitle = 'レスポンス（201：VendorResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'VendorSummary', '✓', '登録後の業者情報')
        )
        ResponseSubtables = @(
          @{
            Title = 'item要素（VendorSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('vendorId', 'int64', '✓', '業者ID'),
              @('facilityId', 'int64', '-', '担当施設ID'),
              @('facilityName', 'string', '-', '担当施設名'),
              @('invoiceRegistrationNo', 'string', '-', 'インボイス登録番号'),
              @('vendorName', 'string', '✓', '業者名'),
              @('address', 'string', '-', '住所'),
              @('positionName', 'string', '-', '役職'),
              @('roleName', 'string', '-', '役割'),
              @('contactPerson', 'string', '-', '担当者名'),
              @('phone', 'string', '-', '電話番号'),
              @('email', 'string', '-', 'メール'),
              @('isPrimaryContact', 'boolean', '✓', '主担当フラグ')
            )
          }
        )
        StatusRows = @(
          @('201', '登録成功', 'VendorResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `vendor_master_edit` なし', 'ErrorResponse'),
          @('404', '担当施設が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '業者更新（/vendor-master/vendors/{vendorId}）'
        Overview = '指定した業者マスタを更新する。'
        Method = 'PUT'
        Path = '/vendor-master/vendors/{vendorId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('vendorId', 'path', 'int64', '✓', '更新対象の業者ID')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('facilityId', 'int64', '✓', '担当施設ID'),
          @('invoiceRegistrationNo', 'string', '✓', 'インボイス登録番号'),
          @('vendorName', 'string', '✓', '業者名'),
          @('address', 'string', '-', '住所'),
          @('positionName', 'string', '-', '役職'),
          @('roleName', 'string', '-', '役割'),
          @('contactPerson', 'string', '✓', '担当者名'),
          @('phone', 'string', '✓', '電話番号'),
          @('email', 'string', '✓', 'メール'),
          @('isPrimaryContact', 'boolean', '-', '主担当フラグ')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `vendor_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象の `vendors` が `deleted_at IS NULL` で存在することを確認する',
          '`facilities.deleted_at IS NULL` の未削除施設IDであることを検証する',
          '指定IDの `vendors` を更新し、`updated_at` を現在時刻に更新する'
        )
        ResponseTitle = 'レスポンス（200：VendorResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('item', 'VendorSummary', '✓', '更新後の業者情報')
        )
        ResponseSubtables = @(
          @{
            Title = 'item要素（VendorSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('vendorId', 'int64', '✓', '業者ID'),
              @('facilityId', 'int64', '-', '担当施設ID'),
              @('facilityName', 'string', '-', '担当施設名'),
              @('invoiceRegistrationNo', 'string', '-', 'インボイス登録番号'),
              @('vendorName', 'string', '✓', '業者名'),
              @('address', 'string', '-', '住所'),
              @('positionName', 'string', '-', '役職'),
              @('roleName', 'string', '-', '役割'),
              @('contactPerson', 'string', '-', '担当者名'),
              @('phone', 'string', '-', '電話番号'),
              @('email', 'string', '-', 'メール'),
              @('isPrimaryContact', 'boolean', '✓', '主担当フラグ')
            )
          }
        )
        StatusRows = @(
          @('200', '更新成功', 'VendorResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `vendor_master_edit` なし', 'ErrorResponse'),
          @('404', '対象業者または担当施設が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '業者削除（/vendor-master/vendors/{vendorId}）'
        Overview = '指定した業者マスタを論理削除する。'
        Method = 'DELETE'
        Path = '/vendor-master/vendors/{vendorId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('vendorId', 'path', 'int64', '✓', '削除対象の業者ID')
        )
        PermissionLines = @(
          '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `vendor_master_edit` が有効であること'
        )
        ProcessingLines = @(
          '対象の `vendors` が `deleted_at IS NULL` で存在することを確認する',
          '物理削除は行わず、`deleted_at` と `updated_at` を現在時刻に更新する',
          '既存申請・見積・修理・保守などの履歴参照は保持し、以後の候補一覧からは除外する'
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @(
          'Body は返却しない。'
        )
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `vendor_master_edit` なし', 'ErrorResponse'),
          @('404', '対象業者が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Heading2'; Text = '必要権限' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定基準', '説明'); Rows = @(
      @('業者一覧取得', '`vendor_master_list`', 'Bearer トークン上の作業対象施設に対して実効 `vendor_master_list` を持つこと', '業者一覧と件数を参照する'),
      @('業者新規作成 / 更新 / 削除', '`vendor_master_edit`', 'Bearer トークン上の作業対象施設に対して実効 `vendor_master_edit` を持つこと', '業者マスタの変更系処理')
    ) },
    @{ Type = 'Heading2'; Text = 'データ整合ルール' },
    @{ Type = 'Bullets'; Items = @(
      '`facility_id` は `facilities.deleted_at IS NULL` の未削除施設IDを参照する',
      '一覧取得は `vendors.deleted_at IS NULL` かつ `facilities.deleted_at IS NULL` のみを返却する',
      '削除は論理削除とし、参照元テーブルの履歴は保持する',
      '論理削除済み業者は、新規の見積・修理・保守候補には表示しない前提とする'
    ) },
    @{ Type = 'Heading2'; Text = '実装前提' },
    @{ Type = 'Bullets'; Items = @(
      '画面の表示制御は `/auth/context` の `vendor_master_list` / `vendor_master_edit` を参照して行い、一覧表示、新規作成ボタン、編集ボタン、削除ボタンを同じ `feature_code` で出し分ける',
      '担当施設候補は既存の施設マスタ取得APIから取得し、本 API 群では候補一覧を返さない',
      '業者データはマスタ管理の対象として全施設分を扱うが、他施設閲覧機能ではなくマスタ管理機能として認可する'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '説明'); Rows = @(
      @('VALIDATION_ERROR', '400', '入力不正、必須不足、形式不正'),
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
      @('AUTH_403_VENDOR_MASTER_LIST_DENIED', '403', '作業対象施設に対する実効 `vendor_master_list` がない'),
      @('AUTH_403_VENDOR_MASTER_EDIT_DENIED', '403', '作業対象施設に対する実効 `vendor_master_edit` がない'),
      @('VENDOR_NOT_FOUND', '404', '対象の業者が存在しない'),
      @('FACILITY_NOT_FOUND', '404', '指定した担当施設が存在しない、または削除済み'),
      @('INTERNAL_SERVER_ERROR', '500', 'サーバー内部エラー')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Heading2'; Text = 'マスタ保守方針' },
    @{ Type = 'Bullets'; Items = @(
      '業者削除は論理削除とし、過去申請・見積・修理・保守の履歴参照を壊さない',
      '担当施設名は `facilities` から解決する',
      '画面一覧は論理削除済み業者を表示しない'
    ) },
    @{ Type = 'Heading2'; Text = '今後拡張時の留意点' },
    @{ Type = 'Bullets'; Items = @(
      '共通業者マスタ運用へ変更する場合は `facility_id` の必須性と画面入力項目を再整理する',
      '検索件数が増加した場合はページングや並び順指定の追加を検討する'
    ) }
  )
}
