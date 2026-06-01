@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_資産申請起票.docx'
  ScreenLabel = '資産申請起票'
  CoverDateText = '2026年4月27日'
  RevisionDateText = '2026/4/27'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、資産一覧画面（`/asset-search-result`）から起票する新規購入、増設購入、更新購入、移動、廃棄申請の API 仕様を定義する。' },
    @{ Type = 'Paragraph'; Text = '資産一覧・資産詳細 API は申請ボタン表示可否と選択資産の参照までを扱い、本書は申請ヘッダ、申請明細、申請種別別詳細、添付、初期ステータス履歴を作成する責務を扱う。' },
    @{ Type = 'Paragraph'; Text = '資産一覧画面の「貸出登録」ボタンは申請起票ではなく `lending_devices` への貸出管理対象登録であるため、本書では定義しない。貸出機器登録モーダルで利用する API は「貸出管理 API 設計書」を参照する。' },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '対象システムは医療機器管理システムである。資産申請起票は、病院ユーザーが資産一覧で対象資産を選択し、購入、移動、廃棄などの後続業務へ渡す申請レコードを作成する入口機能である。' },
    @{ Type = 'Paragraph'; Text = '起票後の購入申請一覧、編集リスト連携、RFQ、発注、検収は購入管理・リモデル管理・RFQ以降で扱い、移動/廃棄の承認、タスク進行、原本反映は移動・廃棄管理で扱う。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('資産申請起票', '資産一覧から申請を作成し、`applications` を親とする申請レコード群を初期状態で保存する処理'),
      @('購入申請', '`applications.application_type=''PURCHASE''` の申請。`purchase_application_details.purchase_type` で NEW / EXPANSION / REPLACEMENT を区別する'),
      @('移動申請', '`applications.application_type=''TRANSFER''` の申請。選択資産と移動先を保存し、移動・廃棄管理側で承認・原本反映する'),
      @('廃棄申請', '`applications.application_type=''DISPOSAL''` の申請。選択資産と廃棄理由、添付を保存し、廃棄管理側で後続タスクを進める'),
      @('更新購入後処理', '更新購入対象の現行資産について、廃棄、移動、継続利用のいずれにするかを起票時点で保持する処理')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面URL', '利用目的'); Rows = @(
      @('15. 資産一覧画面', '/asset-search-result', '新規購入/増設購入/更新購入/移動/廃棄申請モーダルを開き、申請を起票する')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'APIの位置づけ' },
    @{ Type = 'Paragraph'; Text = '本 API 群は、資産一覧画面からの申請作成入口である。資産一覧・資産詳細 API が返す `canOpenOriginalApplications` と選択資産を前提に、起票時は本 API が `original_application` の実効権限を再判定する。' },
    @{ Type = 'Paragraph'; Text = '申請作成は 1 API 呼び出しを 1 トランザクションで扱う。`applications`、`application_assets`、申請種別別詳細、`application_documents`、`application_status_histories` のいずれかに失敗した場合は全体をロールバックする。' },
    @{ Type = 'Heading2'; Text = '画面とAPIの関係' },
    @{ Type = 'Table'; Headers = @('画面操作', 'API', '補足'); Rows = @(
      @('申請モーダルを開く', 'GET /asset-applications/context', '申請者、設置場所候補、選択資産スナップショット、初期ステータスを取得する'),
      @('新規購入/増設購入/更新購入申請を送信する', 'POST /purchase-applications', '購入申請を作成する。更新購入で廃棄/移動を選んだ場合は関連申請も同一トランザクションで作成する'),
      @('移動申請を送信する', 'POST /transfer-applications', '選択資産と移動先を保存し、移動申請を作成する'),
      @('廃棄申請を送信する', 'POST /disposal-applications', '選択資産、廃棄理由、添付を保存し、廃棄申請を作成する')
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル/VIEW', '利用種別', '用途'); Rows = @(
      @('applications', 'CREATE / READ', '申請共通ヘッダ、申請番号、申請者・設置場所スナップショット、初期ステータスを保持する'),
      @('application_assets', 'CREATE / READ', '既存資産、要望機器、移動/廃棄対象資産、更新購入後処理を明細として保持する'),
      @('purchase_application_details', 'CREATE', '購入申請区分、優先順位、希望納期、用途、症例数、接続要望を保持する'),
      @('transfer_application_details', 'CREATE', '移動元/移動先、移動理由、関連購入申請IDを保持する'),
      @('disposal_application_details', 'CREATE', '廃棄理由、関連購入申請ID、後続廃棄タスク用の詳細を保持する'),
      @('application_documents', 'CREATE', '購入/廃棄申請の添付ファイルを `owner_type=''APPLICATION''` として保存する'),
      @('application_status_definitions', 'READ', '申請種別ごとの初期ステータスを解決する'),
      @('application_status_histories', 'CREATE', '申請作成時の初期ステータス履歴を保存する'),
      @('asset_ledgers', 'READ', '選択済み既存資産の施設所属、状態、分類、設置場所、数量を確認する'),
      @('facility_locations', 'READ', '設置先、移動先、部署/室名候補を確認し、スナップショットを取得する'),
      @('facilities', 'READ', '作業対象施設の存在確認、論理削除判定、共有システム管理者アカウントの未削除施設判定に使用する'),
      @('users', 'READ', '申請者スナップショット、共有システム管理者アカウント判定、監査記録の実行ユーザー解決に使用する'),
      @('user_facility_assignments / facility_feature_settings / user_facility_feature_settings', 'READ', '通常アカウントの担当施設割当、施設提供設定、ユーザー施設別設定から `original_list_view` / `original_application` の実効権限を判定する'),
      @('purchase_applications', 'READ', '購入管理側の互換VIEW。起票 API は直接 DML しない')
    ) },
    @{ Type = 'Heading2'; Text = '責務境界' },
    @{ Type = 'Bullets'; Items = @(
      '資産一覧・資産詳細 API は、一覧取得、詳細取得、申請導線の表示可否、選択資産の参照までを扱う',
      '本 API は、申請レコードの作成、入力検証、添付保存、初期ステータス履歴作成までを扱う',
      '購入管理・リモデル管理・RFQ API は、起票済み購入申請の一覧、編集リスト連携、RFQ 作成、見積依頼進行を扱う',
      '移動・廃棄管理 API は、起票済み移動/廃棄申請の承認、タスク進行、原本反映、廃棄契約タスクを扱う',
      '資産一覧画面の貸出登録ボタンおよび貸出機器登録モーダルは、申請起票ではなく貸出管理対象機器の登録であるため、本書の対象外とし、「貸出管理 API 設計書」を参照する',
      '棚卸し完了時の自動起票は棚卸し API 側のトリガで行うが、payload と永続化ルールは本書の移動/廃棄起票モデルに合わせる'
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON',
      '文字コード: UTF-8',
      '日時形式: ISO 8601。日付のみの項目は `YYYY-MM-DD` とする',
      '更新系 API は `Idempotency-Key` ヘッダーを必須とし、同一ユーザー、同一施設、同一 API パス、同一 payload の再送は初回応答を返す',
      '添付ファイルの実体はオブジェクトストレージに保存し、DB には `application_documents` のメタデータを保存する。レスポンスに物理 `file_path` は返さない',
      '共有システム管理者アカウントは、作業対象施設が未削除である限り通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による認可判定をバイパスする。ただし、選択資産、設置先、移動先、添付保存先などの業務データは作業対象施設に属することを必ず確認する'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '本 API 群は `original_application` を起票実行権限として使用する。既存資産スナップショットを取得する処理では、同じ作業対象施設に対する `original_list_view` も前提とする。業務 API は `/auth/context` の表示用結果だけを信頼せず、Bearer トークン上の作業対象施設について通常アカウントでは `user_facility_assignments`、`facility_feature_settings`、`user_facility_feature_settings` を毎回再判定する。共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）では、作業対象施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず、`original_application` および必要な参照系 `feature_code` を有効として扱う。' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '説明'); Rows = @(
      @('申請モーダルコンテキスト取得', '`original_list_view` + `original_application`', '通常アカウントは両 feature の実効有効を判定する。共有システム管理者は作業対象施設が未削除であれば許可する。選択資産スナップショットと申請可否を返す'),
      @('購入申請作成', '`original_application`', '通常アカウントは実効 `original_application` を判定する。共有システム管理者は作業対象施設が未削除であれば許可する。新規購入/増設購入/更新購入申請を作成する'),
      @('移動申請作成', '`original_application`', '通常アカウントは実効 `original_application` を判定する。共有システム管理者は作業対象施設が未削除であれば許可する。選択資産の移動申請を作成する'),
      @('廃棄申請作成', '`original_application`', '通常アカウントは実効 `original_application` を判定する。共有システム管理者は作業対象施設が未削除であれば許可する。選択資産の廃棄申請を作成する')
    ) },
    @{ Type = 'Heading2'; Text = '施設スコープ' },
    @{ Type = 'Bullets'; Items = @(
      '全 API は Bearer トークン上の作業対象施設を `targetFacilityId` として扱う。リクエストに `targetFacilityId` がある場合は作業対象施設と一致することを必須とする。共有システム管理者アカウントでも、起票対象施設は現在選択中の作業対象施設に限定する',
      '作業対象施設が存在しない、または `facilities.deleted_at IS NOT NULL` の場合は 404 とする。通常アカウントで作業対象施設に対する実効権限がない場合は 403 とする',
      '既存資産を対象にする場合は、`asset_ledgers.facility_id` が作業対象施設と一致する資産だけを許可する',
      '病院ユーザーが協業グループ経由で他施設資産を閲覧できる場合でも、申請起票は作業対象施設の自施設資産に限定する。共有システム管理者が別施設の資産を起票対象にする場合は、その施設を作業対象施設として選択してから本 API を呼び出す',
      '設置先/移動先は同一施設の `facility_locations.deleted_at IS NULL` の候補から選択する'
    ) },
    @{ Type = 'Heading2'; Text = '申請番号・初期ステータス' },
    @{ Type = 'Bullets'; Items = @(
      '`application_no` はサーバー側で生成する。採番は `application_type` 別プレフィックス（PUR / TRF / DSP）と `application_id` を組み合わせ、同一申請を一意に識別できる値とする',
      '`applications.status` は `application_status_definitions` から `application_type` ごとに `is_initial_status=true` の1件を取得して設定する',
      '起票時は `application_status_histories.from_status=null`、`to_status=初期ステータス`、`changed_by_user_id=申請者`、`changed_at=サーバー時刻` の履歴を必ず1件作成する',
      '初期ステータス定義が存在しない、または複数存在する場合は 500 ではなく設定不備として 409 (`APPLICATION_INITIAL_STATUS_INVALID`) を返す'
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Heading3'; Text = '基本エラーレスポンス（ErrorResponse）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力項目別の補足'),
      @('correlationId', 'string', '-', '問い合わせ用トレースID')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API一覧' },
    @{ Type = 'Table'; Headers = @('No', 'API名', 'Method', 'Path', '用途', '権限'); Rows = @(
      @('1', '申請モーダルコンテキスト取得', 'GET', '/asset-applications/context', '起票モーダルの初期表示情報を取得する', '`original_list_view` + `original_application`'),
      @('2', '購入申請作成', 'POST', '/purchase-applications', '新規購入/増設購入/更新購入申請を作成する', '`original_application`'),
      @('3', '移動申請作成', 'POST', '/transfer-applications', '資産一覧選択資産の移動申請を作成する', '`original_application`'),
      @('4', '廃棄申請作成', 'POST', '/disposal-applications', '資産一覧選択資産の廃棄申請を作成する', '`original_application`')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 資産申請起票機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '申請モーダルコンテキスト取得（/asset-applications/context）'
        Overview = '資産一覧画面の申請モーダルを開く前に、申請者、対象施設、設置場所候補、選択資産スナップショット、申請種別ごとの初期ステータスを取得する。'
        Method = 'GET'
        Path = '/asset-applications/context'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('applicationKind', 'query', 'string', '✓', 'NEW_PURCHASE / EXPANSION_PURCHASE / REPLACEMENT_PURCHASE / TRANSFER / DISPOSAL'),
          @('targetFacilityId', 'query', 'int64', '-', '作業対象施設ID。Bearer トークン上の作業対象施設と一致必須'),
          @('assetLedgerIds', 'query', 'int64[]', '-', '選択済み資産台帳ID。新規購入では空、その他では1件以上')
        )
        PermissionLines = @(
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `original_list_view` / `original_application` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `original_list_view` と `original_application` が有効であること',
          '業務条件: 選択資産、設置先、移動先は作業対象施設に属すること。協業グループ経由の他施設閲覧資産は、共有システム管理者であっても対象施設を作業対象施設として選択し直すまで起票対象にしない'
        )
        ProcessingLines = @(
          '`applicationKind` を検証し、購入系は `PURCHASE`、移動は `TRANSFER`、廃棄は `DISPOSAL` の初期ステータスを `application_status_definitions` から取得する',
          '`assetLedgerIds` がある場合は `asset_ledgers` を作業対象施設で絞り、指定件数と一致することを確認する',
          '`facility_locations.deleted_at IS NULL` の設置場所候補を取得し、部署/室名候補として返却する',
          'ログインユーザーの表示名、所属、連絡先を申請者スナップショット初期値として返却する'
        )
        ResponseTitle = 'レスポンス（200：AssetApplicationContextResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('targetFacilityId', 'int64', '✓', '対象施設ID'),
          @('requester', 'RequesterSnapshot', '✓', '申請者初期値'),
          @('applicationKind', 'string', '✓', '受け付けた申請種別'),
          @('initialStatus', 'string', '✓', '申請作成時に設定する初期ステータス'),
          @('selectedAssets', 'ApplicationSourceAsset[]', '✓', '選択資産スナップショット'),
          @('locationOptions', 'FacilityLocationOption[]', '✓', '設置先/移動先候補'),
          @('rules', 'AssetApplicationRules', '✓', '画面入力制約')
        )
        ResponseSubtables = @(
          @{
            Title = 'selectedAssets要素（ApplicationSourceAsset）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('assetLedgerId', 'int64', '✓', '資産台帳ID'),
              @('managementNo', 'string', '-', '管理機器番号'),
              @('assetNo', 'string', '-', '固定資産番号'),
              @('itemName', 'string', '✓', '品目名スナップショット'),
              @('makerName', 'string', '-', 'メーカー名スナップショット'),
              @('modelName', 'string', '-', '型式スナップショット'),
              @('quantity', 'int32', '✓', '数量'),
              @('unit', 'string', '✓', '単位'),
              @('sourceFacilityLocationId', 'int64', '-', '現設置ロケーションID')
            )
          },
          @{
            Title = 'rules要素（AssetApplicationRules）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('maxRequestedAssets', 'int32', '✓', '要望機器の最大件数。新規/更新購入では3'),
              @('requiresSelectedAssets', 'boolean', '✓', '選択資産必須かどうか'),
              @('canAttachFiles', 'boolean', '✓', '添付ファイルを受け付けるかどうか')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'AssetApplicationContextResponse'),
          @('400', '申請種別または対象施設指定が不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `original_list_view` + `original_application` なし', 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、削除済み、または指定資産・設置場所候補が存在しない/作業対象施設に属さない', 'ErrorResponse'),
          @('409', '初期ステータス定義不備', 'ErrorResponse')
        )
      },
      @{
        Title = '購入申請作成（/purchase-applications）'
        Overview = '新規購入、増設購入、更新購入申請を作成する。更新購入で現行資産の廃棄または移動を選択した場合は、関連する廃棄申請または移動申請も同一トランザクションで作成する。'
        Method = 'POST'
        Path = '/purchase-applications'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストヘッダー'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('Idempotency-Key', 'header', 'string', '✓', '同一送信操作を識別する冪等キー')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('targetFacilityId', 'int64', '-', '対象施設ID。Bearer トークン上の作業対象施設と一致必須'),
          @('purchaseType', 'string', '✓', 'NEW / EXPANSION / REPLACEMENT'),
          @('requestedOn', 'date', '-', '申請日。未指定時はサーバー日付'),
          @('managementDepartmentName', 'string', '-', '管理部署スナップショット'),
          @('installationLocationId', 'int64', '-', '設置先ロケーションID。新規/増設/更新購入の設置先'),
          @('priority', 'string', '-', '優先順位'),
          @('desiredDeliveryOn', 'date', '-', '希望納期'),
          @('usagePurpose', 'string', '-', '使用用途'),
          @('casesPerMonth', 'int32', '-', '症例数（月）'),
          @('caseCountUnit', 'string', '-', '件/月など'),
          @('requestComment', 'string', '-', '必要理由、コメント'),
          @('currentConnectionStatus', 'string', '-', '現在の接続状況。増設/更新購入で利用'),
          @('currentConnectionDestination', 'string', '-', '現在の接続先'),
          @('requestConnectionStatus', 'string', '-', '要望接続状況'),
          @('requestConnectionDestination', 'string', '-', '要望接続先'),
          @('currentAssets', 'PurchaseCurrentAssetInput[]', '-', '増設/更新購入の対象既存資産'),
          @('requestedAssets', 'PurchaseRequestedAssetInput[]', '-', '新規/更新購入の要望機器。最大3件'),
          @('replacementActions', 'ReplacementActionInput[]', '-', '更新購入対象資産の廃棄/移動/継続利用指定'),
          @('attachments', 'ApplicationAttachmentInput[]', '-', '添付ファイル')
        )
        RequestSubtables = @(
          @{
            Title = 'currentAssets要素（PurchaseCurrentAssetInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('assetLedgerId', 'int64', '✓', '対象資産台帳ID'),
              @('additionalQuantity', 'int32', '-', '増設購入で追加する数量。EXPANSION の場合は1以上'),
              @('lastKnownUpdatedAt', 'datetime', '-', '画面取得時点の資産更新日時。指定時は競合検知に使用')
            )
          },
          @{
            Title = 'requestedAssets要素（PurchaseRequestedAssetInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('priorityOrder', 'int32', '-', '希望順。1..3'),
              @('assetItemId', 'int64', '-', '資産マスタから選択した品目ID'),
              @('itemName', 'string', '✓', '品目名。`assetItemId` 未指定時も必須'),
              @('manufacturerId', 'int64', '-', 'メーカーID'),
              @('makerName', 'string', '-', 'メーカー名'),
              @('modelId', 'int64', '-', '型式ID'),
              @('modelName', 'string', '-', '型式'),
              @('quantity', 'int32', '✓', '数量。1以上'),
              @('unit', 'string', '✓', '単位')
            )
          },
          @{
            Title = 'replacementActions要素（ReplacementActionInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('assetLedgerId', 'int64', '✓', '更新対象資産台帳ID'),
              @('action', 'string', '✓', 'DISPOSAL / TRANSFER / CONTINUE'),
              @('destinationFacilityLocationId', 'int64', '-', 'TRANSFER の場合の移動先'),
              @('continueReason', 'string', '-', 'CONTINUE の場合の継続利用理由'),
              @('disposalReasonText', 'string', '-', 'DISPOSAL の場合の廃棄補足')
            )
          },
          @{
            Title = 'attachments要素（ApplicationAttachmentInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('clientFileId', 'string', '✓', 'クライアント側一時ID'),
              @('fileName', 'string', '✓', '表示用ファイル名'),
              @('contentType', 'string', '✓', 'MIME Type'),
              @('fileSizeBytes', 'int64', '✓', 'ファイルサイズ'),
              @('contentHash', 'string', '-', 'クライアント計算ハッシュ。サーバー側でも再計算する'),
              @('fileBodyBase64', 'string', '✓', 'ファイル本文')
            )
          }
        )
        PermissionLines = @(
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `original_application` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `original_application` が有効であること',
          '業務条件: 既存資産を指定する場合は、対象資産が作業対象施設に属すること。通常アカウントで既存資産スナップショットを取得する文脈では `original_list_view` も満たすこと'
        )
        ProcessingLines = @(
          '`Idempotency-Key` と正規化 payload の組み合わせを検証し、同一内容の再送は初回応答を返す。異なる payload の再送は 409 (`IDEMPOTENCY_KEY_REUSED`) とする',
          '`purchaseType` ごとの必須条件を検証する。NEW は `requestedAssets` 1..3 件、EXPANSION は `currentAssets` 1件以上かつ `additionalQuantity>=1`、REPLACEMENT は `currentAssets` 1件以上、`requestedAssets` 1..3件、全 `currentAssets` に対応する `replacementActions` を必須とする',
          '対象既存資産を `asset_ledgers` から作業対象施設で排他取得し、存在件数、施設、更新競合を検証する',
          '設置先/移動先が指定された場合は `facility_locations.deleted_at IS NULL` かつ作業対象施設に属することを検証し、名称スナップショットを取得する',
          '`applications` に `application_type=''PURCHASE''`、初期ステータス、申請者/設置場所/管理部署/コメントを保存し、`application_no` をサーバー生成する',
          '`purchase_application_details` に `purchase_type`、`priority`、希望納期、用途、症例数、接続情報、コメントを保存する',
          '`application_assets` へ既存資産は `asset_role=''CURRENT''`、要望機器は `asset_role=''REQUEST''` として保存する。増設購入では対象既存資産ごとに追加数量を `REQUEST` 行として作成する',
          '更新購入の `replacementActions` は `application_assets.replacement_action` / `continue_reason` として CURRENT 行へ保存する',
          '`replacementActions.action=''DISPOSAL''` の対象は、関連する `DISPOSAL` 申請、`application_assets(asset_role=''DISPOSAL'')`、`disposal_application_details.related_purchase_application_id` を同一トランザクションで作成する',
          '`replacementActions.action=''TRANSFER''` の対象は、関連する `TRANSFER` 申請、`application_assets(asset_role=''TRANSFER'')`、`transfer_application_details.related_purchase_application_id` を同一トランザクションで作成する',
          '添付は `application_documents` に `owner_type=''APPLICATION''`、`document_category=''ATTACHMENT''` として保存する',
          '作成した各 `applications` に対し、`application_status_histories` の初期履歴を作成する'
        )
        ResponseTitle = 'レスポンス（201：AssetApplicationCreateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('applicationId', 'int64', '✓', '作成した購入申請ID'),
          @('applicationNo', 'string', '✓', '作成した購入申請番号'),
          @('applicationType', 'string', '✓', 'PURCHASE'),
          @('purchaseType', 'string', '✓', 'NEW / EXPANSION / REPLACEMENT'),
          @('status', 'string', '✓', '初期ステータス'),
          @('createdAssetCount', 'int32', '✓', '作成した購入申請明細数'),
          @('createdAttachmentCount', 'int32', '✓', '作成した添付数'),
          @('linkedApplications', 'LinkedApplicationSummary[]', '✓', '更新購入に伴って作成した移動/廃棄申請一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'linkedApplications要素（LinkedApplicationSummary）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('applicationId', 'int64', '✓', '関連申請ID'),
              @('applicationNo', 'string', '✓', '関連申請番号'),
              @('applicationType', 'string', '✓', 'TRANSFER / DISPOSAL'),
              @('status', 'string', '✓', '初期ステータス')
            )
          }
        )
        StatusRows = @(
          @('201', '作成成功', 'AssetApplicationCreateResponse'),
          @('200', '同一 `Idempotency-Key` の再送を既存結果で受理', 'AssetApplicationCreateResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `original_application` なし', 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、削除済み、または指定資産・設置場所が存在しない/作業対象施設に属さない', 'ErrorResponse'),
          @('409', '更新競合、初期ステータス不備、冪等キー再利用', 'ErrorResponse')
        )
      },
      @{
        Title = '移動申請作成（/transfer-applications）'
        Overview = '資産一覧で選択した既存資産を対象に、移動先を指定して移動申請を作成する。'
        Method = 'POST'
        Path = '/transfer-applications'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストヘッダー'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('Idempotency-Key', 'header', 'string', '✓', '同一送信操作を識別する冪等キー')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('targetFacilityId', 'int64', '-', '対象施設ID。Bearer トークン上の作業対象施設と一致必須'),
          @('assetLedgerIds', 'int64[]', '✓', '移動対象の資産台帳ID。1件以上'),
          @('destinationFacilityLocationId', 'int64', '✓', '移動先施設ロケーションID'),
          @('transferReason', 'string', '-', '移動理由/コメント'),
          @('requestedOn', 'date', '-', '申請日。未指定時はサーバー日付')
        )
        PermissionLines = @(
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `original_application` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `original_application` が有効であること',
          '業務条件: 既存資産を指定する場合は、対象資産が作業対象施設に属すること'
        )
        ProcessingLines = @(
          '`Idempotency-Key` と正規化 payload の組み合わせを検証する',
          '`assetLedgerIds` は1件以上必須とし、重複を禁止する',
          '対象資産を `asset_ledgers` から作業対象施設で排他取得し、指定件数と一致することを確認する',
          '移動先 `facility_locations` が作業対象施設に属し、`deleted_at IS NULL` であることを確認する',
          '`applications` に `application_type=''TRANSFER''`、初期ステータス、申請者、移動先スナップショット、コメントを保存し、`application_no` をサーバー生成する',
          '`application_assets` に対象資産を `asset_role=''TRANSFER''` として保存し、現設置場所と移動先のスナップショットを保持する',
          '`transfer_application_details` に移動元/移動先、移動理由を保存する',
          '`application_status_histories` に初期履歴を作成する'
        )
        ResponseTitle = 'レスポンス（201：AssetApplicationCreateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('applicationId', 'int64', '✓', '作成した移動申請ID'),
          @('applicationNo', 'string', '✓', '作成した移動申請番号'),
          @('applicationType', 'string', '✓', 'TRANSFER'),
          @('status', 'string', '✓', '初期ステータス'),
          @('createdAssetCount', 'int32', '✓', '作成した申請明細数')
        )
        StatusRows = @(
          @('201', '作成成功', 'AssetApplicationCreateResponse'),
          @('200', '同一 `Idempotency-Key` の再送を既存結果で受理', 'AssetApplicationCreateResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `original_application` なし', 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、削除済み、または指定資産・移動先が存在しない/作業対象施設に属さない', 'ErrorResponse'),
          @('409', '初期ステータス不備、冪等キー再利用', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄申請作成（/disposal-applications）'
        Overview = '資産一覧で選択した既存資産を対象に、廃棄理由と添付を保存して廃棄申請を作成する。'
        Method = 'POST'
        Path = '/disposal-applications'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストヘッダー'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('Idempotency-Key', 'header', 'string', '✓', '同一送信操作を識別する冪等キー')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('targetFacilityId', 'int64', '-', '対象施設ID。Bearer トークン上の作業対象施設と一致必須'),
          @('assetLedgerIds', 'int64[]', '✓', '廃棄対象の資産台帳ID。1件以上'),
          @('disposalReasonCode', 'string', '-', 'END_OF_LIFE / UNREPAIRABLE / REPLACEMENT / OTHER。画面入力がコメントのみの場合は OTHER'),
          @('disposalReasonText', 'string', '-', '廃棄理由詳細。画面のコメントを保存する'),
          @('requestedOn', 'date', '-', '申請日。未指定時はサーバー日付'),
          @('attachments', 'ApplicationAttachmentInput[]', '-', '添付ファイル')
        )
        RequestSubtables = @(
          @{
            Title = 'attachments要素（ApplicationAttachmentInput）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('clientFileId', 'string', '✓', 'クライアント側一時ID'),
              @('fileName', 'string', '✓', '表示用ファイル名'),
              @('contentType', 'string', '✓', 'MIME Type'),
              @('fileSizeBytes', 'int64', '✓', 'ファイルサイズ'),
              @('contentHash', 'string', '-', 'クライアント計算ハッシュ。サーバー側でも再計算する'),
              @('fileBodyBase64', 'string', '✓', 'ファイル本文')
            )
          }
        )
        PermissionLines = @(
          '認可条件: 共有システム管理者アカウント（`users.account_type=''SYSTEM_ADMIN''`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `original_application` 判定をバイパスする',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
          '認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `original_application` が有効であること',
          '業務条件: 既存資産を指定する場合は、対象資産が作業対象施設に属すること'
        )
        ProcessingLines = @(
          '`Idempotency-Key` と正規化 payload の組み合わせを検証する',
          '`assetLedgerIds` は1件以上必須とし、重複を禁止する',
          '対象資産を `asset_ledgers` から作業対象施設で排他取得し、指定件数と一致することを確認する',
          '`disposalReasonCode` 未指定時は、資産一覧の廃棄申請モーダルがコメント入力のみであるため `OTHER` を採用し、コメントを `disposalReasonText` として保存する',
          '`applications` に `application_type=''DISPOSAL''`、初期ステータス、申請者、コメントを保存し、`application_no` をサーバー生成する',
          '`application_assets` に対象資産を `asset_role=''DISPOSAL''` として保存する',
          '`disposal_application_details` に廃棄理由を保存する。廃棄業者、受付、期限、発注、検収に関する項目は後続の廃棄管理 API で更新するため起票時は未設定とする',
          '添付は `application_documents` に `owner_type=''APPLICATION''`、`document_category=''ATTACHMENT''` として保存する',
          '`application_status_histories` に初期履歴を作成する'
        )
        ResponseTitle = 'レスポンス（201：AssetApplicationCreateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('applicationId', 'int64', '✓', '作成した廃棄申請ID'),
          @('applicationNo', 'string', '✓', '作成した廃棄申請番号'),
          @('applicationType', 'string', '✓', 'DISPOSAL'),
          @('status', 'string', '✓', '初期ステータス'),
          @('createdAssetCount', 'int32', '✓', '作成した申請明細数'),
          @('createdAttachmentCount', 'int32', '✓', '作成した添付数')
        )
        StatusRows = @(
          @('201', '作成成功', 'AssetApplicationCreateResponse'),
          @('200', '同一 `Idempotency-Key` の再送を既存結果で受理', 'AssetApplicationCreateResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '通常アカウントで作業対象施設に対する実効 `original_application` なし', 'ErrorResponse'),
          @('404', '作業対象施設が存在しない、削除済み、または指定資産が存在しない/作業対象施設に属さない', 'ErrorResponse'),
          @('409', '初期ステータス不備、冪等キー再利用', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 業務ルール・バリデーション' },
    @{ Type = 'Heading2'; Text = '申請種別別必須条件' },
    @{ Type = 'Table'; Headers = @('申請種別', '必須条件', '保存方針'); Rows = @(
      @('新規購入', '`purchaseType=NEW`、`requestedAssets` 1..3件。既存資産は指定しない', '`applications.application_type=PURCHASE`、`purchase_application_details.purchase_type=NEW`、要望機器を `application_assets.asset_role=REQUEST` で保存'),
      @('増設購入', '`purchaseType=EXPANSION`、`currentAssets` 1件以上、各 `additionalQuantity>=1`', '既存資産を `CURRENT`、追加希望を `REQUEST` として保存'),
      @('更新購入', '`purchaseType=REPLACEMENT`、`currentAssets` 1件以上、`requestedAssets` 1..3件、各対象資産の `replacementActions` 必須', '既存資産を `CURRENT`、要望機器を `REQUEST` として保存し、廃棄/移動指定は関連申請を作成'),
      @('移動', '`assetLedgerIds` 1件以上、`destinationFacilityLocationId` 必須', '`applications.application_type=TRANSFER`、対象資産を `application_assets.asset_role=TRANSFER` で保存'),
      @('廃棄', '`assetLedgerIds` 1件以上。画面入力がコメントのみの場合は `disposalReasonCode=OTHER`', '`applications.application_type=DISPOSAL`、対象資産を `application_assets.asset_role=DISPOSAL` で保存')
    ) },
    @{ Type = 'Heading2'; Text = '添付ファイルルール' },
    @{ Type = 'Bullets'; Items = @(
      '購入申請と廃棄申請の添付は `application_documents.owner_type=''APPLICATION''` として申請ヘッダに紐づける',
      '添付は写真ではないため `document_category=''ATTACHMENT''` とし、`is_primary` は設定しない',
      '`owner_key`、`file_path`、`storage_format` は内部項目として扱い、リクエスト/レスポンスでは直接指定・返却しない',
      'ストレージ保存に成功し、DB メタデータ保存に失敗した場合は保存済みオブジェクトを破棄してエラー応答とする'
    ) },
    @{ Type = 'Heading2'; Text = '同時実行・冪等性' },
    @{ Type = 'Bullets'; Items = @(
      'POST API は `Idempotency-Key` を必須とし、キー未指定は 400 (`IDEMPOTENCY_KEY_REQUIRED`) とする',
      '同一キー、同一ユーザー、同一施設、同一 API パス、同一 payload の再送は初回レスポンスを返す',
      '同一キーで payload が異なる場合は 409 (`IDEMPOTENCY_KEY_REUSED`) とする',
      '既存資産を対象にする作成処理では、対象 `asset_ledgers` を同一トランザクション内で検証し、施設違い、存在なし、更新競合を拒否する'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('コード', 'HTTP', '内容'); Rows = @(
      @('VALIDATION_ERROR', '400', '必須不足、形式不正、件数上限超過'),
      @('IDEMPOTENCY_KEY_REQUIRED', '400', 'POST API に `Idempotency-Key` が指定されていない'),
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
      @('FORBIDDEN', '403', '通常アカウントで作業対象施設に対する実効 `original_application` がない。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする'),
      @('TARGET_FACILITY_NOT_SUPPORTED', '400', '指定施設が Bearer トークン上の作業対象施設と一致しない'),
      @('ASSET_NOT_FOUND', '404', '指定資産が存在しない、または作業対象施設に属さない'),
      @('LOCATION_NOT_FOUND', '404', '指定した設置場所/移動先が存在しない、または削除済み'),
      @('APPLICATION_INITIAL_STATUS_INVALID', '409', '申請種別に対する初期ステータス定義が存在しない、または複数存在する'),
      @('ASSET_CONFLICT', '409', '画面取得後に対象資産が更新され、起票条件が変化した'),
      @('IDEMPOTENCY_KEY_REUSED', '409', '同一 `Idempotency-Key` で異なる payload が送信された'),
      @('STORAGE_WRITE_FAILED', '502', '添付ファイルのストレージ保存に失敗した')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・監査方針' },
    @{ Type = 'Bullets'; Items = @(
      '申請作成、関連申請作成、添付保存、初期履歴作成は監査対象とし、APIログには申請ID、申請番号、申請種別、対象施設、実行ユーザー、`Idempotency-Key` を記録する',
      '添付ファイル本文はアプリケーションログへ出力しない',
      '起票後のステータス変更は本 API では行わず、購入管理、移動・廃棄管理、廃棄契約タスク側の API で `application_status_transitions` に従って更新する',
      '申請作成に伴う関連移動/廃棄申請は同一トランザクションで作成し、どちらか一方だけが残る状態を禁止する'
    ) },

    @{ Type = 'Heading1'; Text = '第9章 補足・設計方針' },
    @{ Type = 'Table'; Headers = @('論点', '本書の設計方針', '連携時の扱い'); Rows = @(
      @('廃棄理由コード', '資産一覧の廃棄モーダルはコメントのみのため、未指定時は `OTHER` として保存する', '画面に理由選択を追加する場合は `disposalReasonCode` を必須入力へ変更する'),
      @('更新購入に伴う廃棄/移動', '更新購入送信時に関連 `DISPOSAL` / `TRANSFER` 申請を同一トランザクションで作成する', '後続工程では `related_purchase_application_id` と申請履歴から起点購入申請を追跡する'),
      @('貸出登録', '資産一覧画面の貸出登録は申請起票ではなく `lending_devices` への貸出管理対象登録として扱う', '貸出機器登録モーダルの API は「貸出管理 API 設計書」を参照する'),
      @('借用申請', '資産一覧起点の現行対象外とし、借用管理で扱う', '資産一覧から借用申請を起票する要件が追加された場合は本書へ追加する'),
      @('棚卸し自動起票', '棚卸し API が呼び出し元になるが、保存モデルは本書の移動/廃棄起票に合わせる', '棚卸し API 設計書では本書の移動/廃棄起票 payload と永続化ルールを参照する')
    ) }
  )
}
