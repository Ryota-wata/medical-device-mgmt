@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_QR発行・ラベル印刷.docx'
  ScreenLabel = 'QR発行・ラベル印刷'
  CoverDateText = '2026年4月22日'
  RevisionDateText = '2026/4/22'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、QRコード新規発行画面（`/qr-issue`）および QRコード印刷画面（`/qr-print`）で利用する API の設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      '新規発行/再発行のプレビュー生成 I/F',
      '印刷ジョブ開始受付、取得、結果反映 I/F',
      '印刷開始受付時の `qr_codes` / `qr_print_job_items` 確定タイミング',
      '冪等キーによる二重送信対策と、ローカル印刷失敗時の終端方法',
      'サーバーAPIとローカル印刷モジュールの責務分担'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = 'QR発行・ラベル印刷は、資産管理用QRコードの新規発行・再発行を行う `/qr-issue` と、印刷プレビュー・印刷実行を行う `/qr-print` から構成される。' },
    @{ Type = 'Paragraph'; Text = 'QR識別子は施設単位で一意に管理し、新規発行時の採番確定と `qr_codes` / `qr_print_job_items` への保存は印刷開始受付時にサーバー側で行う。物理印刷の成功/失敗は、その後に端末上のローカル印刷モジュールが実行した結果を結果反映 API で更新する。' },
    @{ Type = 'Paragraph'; Text = 'テプラプリンタへの直接接続は端末上のローカル印刷モジュールが担い、サーバーAPIはプリンタ制御を行わない。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('新規発行', 'プレフィックス・2桁番号・5桁開始番号から新しい QR識別子を連番採番する発行方式'),
      @('再発行', '既存 `qr_identifier` を再利用し、指定範囲の既存 QR を印刷し直す発行方式'),
      @('印刷ジョブ', '印刷開始ボタン押下1回分の実行単位。`qr_print_jobs` に保存する'),
      @('印刷ジョブ明細', '印刷ジョブ配下の個別 QR ごとの印刷対象および印刷結果。`qr_print_job_items` に保存する'),
      @('ローカル印刷モジュール', '端末上で起動し、テプラプリンタ一覧取得および印刷実行を担うローカル Web API'),
      @('固定テンプレート', 'テプラクリエイターで事前作成したアプリ内固定ラベルテンプレート。DB テーブルは持たない')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('項目', '内容'); Rows = @(
      @('対象画面', '5. QRコード新規発行画面 / 6. QRコード印刷画面'),
      @('対象URL', '/qr-issue / /qr-print'),
      @('主機能', '新規発行/再発行プレビュー、印刷ジョブ開始受付、印刷ジョブ取得、印刷結果反映')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'APIの位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、QR発行画面で入力された条件を検証してプレビュー情報を返却し、印刷画面で印刷ジョブ開始受付・状態参照・印刷結果反映を行うための I/F を提供する。' },
    @{ Type = 'Paragraph'; Text = 'テンプレート定義本体はアプリ内固定、プリンタ候補は端末のローカル印刷モジュール依存とし、本API群ではこれらのマスタ配信は行わない。' },
    @{ Type = 'Heading2'; Text = '画面とAPIの関係' },
    @{ Type = 'Numbered'; Items = @(
      '新規発行/再発行条件の入力後、印刷画面へ遷移する前にプレビュー生成 API を呼び出す',
      '印刷画面初期表示は、プレビュー生成結果とローカル印刷モジュールのプリンタ候補をもとにクライアント側で表示する',
      '印刷開始押下時に印刷ジョブ開始受付 API を呼び出し、`qr_print_jobs`、`qr_codes`、`qr_print_job_items` を確定する',
      'クライアントは印刷ジョブ開始受付 API の確定結果を用いて、ローカル印刷モジュールへ印刷を依頼する',
      'ローカル印刷モジュールの実行完了後、結果反映 API を呼び出して `qr_print_job_items` と `qr_codes.print_status` を更新する',
      '必要に応じて印刷ジョブ取得 API を呼び出し、ジョブ状態と明細結果を再取得する'
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル', '利用内容', '主な項目'); Rows = @(
      @('qr_codes', '既存QR確認、新規発行確定、再発行情報更新、印刷状態更新', 'qr_code_id, facility_id, qr_identifier, code_prefix, code_branch, code_serial, issue_type, label_template_key, free_entry_text, issued_by_user_id, issued_at, print_status, last_print_job_id, printed_at'),
      @('qr_print_jobs', '印刷ジョブ開始受付、冪等制御、ジョブ状態保持、集計結果更新', 'qr_print_job_id, facility_id, template_key, printer_name, client_request_id, requested_by_user_id, requested_at, started_at, finished_at, status, success_count, failure_count, error_stage, error_summary'),
      @('qr_print_job_items', '印刷開始時の対象明細作成、印刷結果保持', 'qr_print_job_item_id, qr_print_job_id, qr_code_id, print_order, status, printed_at, error_message'),
      @('facilities', '施設スコープ確認', 'facility_id, facility_name'),
      @('users', '発行者・印刷実行者の監査', 'user_id, name')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-04-22T10:30:00+09:00`）',
      'プレビューの QRシンボル自体は base64 PNG 文字列または同等の表示用データを返却する',
      '印刷用の最終確定データは印刷ジョブ開始受付 API のレスポンスを正本とし、クライアントはそれをローカル印刷モジュールへ渡す',
      'QRシンボルへ埋め込む遷移用URLは、アプリ設定ベースURLに `facilityId` と `qrIdentifier` の両方をクエリとして付与した形式を用いる'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '認可判定は `feature_code` を正本とし、`taniguchi/docs/ロール整理.xlsx` の `権限管理単位一覧` シート A列の `QRコード発行` に対応する `qr_issue` を用いる。対象施設に対する `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で `qr_issue` が `is_enabled=true` の場合に API 実行を許可する。画面表示用の `/auth/context` は UX 用キャッシュであり、各業務 API でも同条件を再判定する。テンプレート定義本体とプリンタ候補取得はアプリ内固定/ローカルモジュール前提のため、本APIの権限制御対象外とする。' },
    @{ Type = 'Table'; Headers = @('処理', '必要権限', '説明'); Rows = @(
      @('プレビュー生成', '対象施設に対する実効 `qr_issue`', '新規発行/再発行の採番条件を検証し、印刷対象一覧を返却する'),
      @('印刷ジョブ開始受付', '対象施設に対する実効 `qr_issue`', '印刷開始受付と `qr_codes` / `qr_print_job_items` の確定を行う'),
      @('印刷ジョブ取得', '対象ジョブ施設に対する実効 `qr_issue`', '印刷プレビュー画面の表示情報と現在の結果を取得する'),
      @('印刷結果反映', '対象ジョブ施設に対する実効 `qr_issue`', 'ローカル印刷モジュールの実行結果を `qr_codes` / 印刷結果へ反映する')
    ) },
    @{ Type = 'Heading2'; Text = '施設スコープ仕様' },
    @{ Type = 'Bullets'; Items = @(
      '各 API は `facilityId` または対象ジョブの `facility_id` を基準に、認証済みユーザーが当該施設を作業対象施設として扱えるかを検証する',
      '各 API は `/auth/context` の返却値だけを信用せず、対象施設に対する実効 `qr_issue` を都度再判定する',
      '対象施設に対する `user_facility_assignments` の有効割当、`facility_feature_settings(feature_code=''qr_issue'')`、`user_facility_feature_settings(feature_code=''qr_issue'')` のいずれかを満たさない場合は 403 を返却する',
      '`qr_identifier` の一意性判定および採番は施設単位で行う'
    ) },
    @{ Type = 'Heading2'; Text = 'エラーレスポンス仕様' },
    @{ Type = 'Heading3'; Text = '基本エラーレスポンス（ErrorResponse）' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'エラーコード'),
      @('message', 'string', '✓', '利用者向けエラーメッセージ'),
      @('details', 'string[]', '-', '入力エラーや補足情報')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 API一覧' },
    @{ Type = 'Table'; Headers = @('機能名', 'Method', 'Path', '概要', '認証'); Rows = @(
      @('QR発行プレビュー生成', 'POST', '/qr-issue/preview', '新規発行/再発行の条件を検証し、印刷プレビュー用のQR一覧を返す', '要'),
      @('印刷ジョブ開始受付', 'POST', '/qr-print/jobs', '印刷開始を受け付け、QR保存とジョブ/明細を確定する', '要'),
      @('印刷ジョブ取得', 'GET', '/qr-print/jobs/{qrPrintJobId}', '印刷開始受付後のジョブ詳細と明細結果を取得する', '要'),
      @('印刷結果反映', 'POST', '/qr-print/jobs/{qrPrintJobId}/result', 'ローカル印刷モジュールの実行結果を反映する', '要')
    ) },

    @{ Type = 'Heading1'; Text = '第5章 QR発行・ラベル印刷機能設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = 'QR発行プレビュー生成（/qr-issue/preview）'
        Overview = '新規発行または再発行の入力条件を検証し、印刷画面へ渡すプレビュー情報を生成する。'
        Method = 'POST'
        Path = '/qr-issue/preview'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエスト（QrIssuePreviewRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('facilityId', 'int64', '✓', '対象施設ID'),
          @('issueMode', 'string', '✓', 'NEW / REISSUE'),
          @('templateKey', 'string', '✓', 'アプリ内固定テンプレート識別子'),
          @('freeEntryText', 'string', '-', 'ラベルに印字するフリー記入項目'),
          @('issueCount', 'int32', '✓', '発行枚数。再発行時は既存QRを連番で対象にする件数')
        )
        RequestSubtables = @(
          @{
            Title = 'new発行時の追加項目'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('codePrefix', 'string', '✓', 'アルファベット1文字'),
              @('codeBranch', 'string', '✓', '2桁番号'),
              @('startSerial', 'int32', '-', '5桁開始番号。未入力時はサーバー側で max+1 を候補算出')
            )
          },
          @{
            Title = 'reissue発行時の追加項目'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('reissueStartQrIdentifier', 'string', '✓', '再発行起点の既存QR識別子')
            )
          }
        )
        PermissionLines = @(
          '認可条件: `user_facility_assignments` に対象施設への有効割当があること',
          '認可条件: `facility_feature_settings` と `user_facility_feature_settings` の両方で `qr_issue` が有効であること'
        )
        ProcessingLines = @(
          '入力値の必須・桁数・形式を検証する',
          '新規発行時は `(facility_id, code_prefix, code_branch)` 単位の既存最大 `code_serial` を参照し、`startSerial` 未指定時は候補値を補完する',
          '新規発行時は `codePrefix-codeBranch-serial` 形式で指定枚数分の `qr_identifier` 候補一覧を生成する',
          '再発行時は指定した `reissueStartQrIdentifier` を起点に、既存 `qr_codes` を連番で件数分取得し、1件でも欠番がある場合はエラーとする',
          'プレビュー生成時点では `qr_codes` / `qr_print_jobs` / `qr_print_job_items` を保存しない',
          'テンプレート定義本体はアプリ内固定のため、`templateKey` の妥当性だけを検証する'
        )
        ResponseTitle = 'レスポンス（200：QrIssuePreviewResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('facilityId', 'int64', '✓', '対象施設ID'),
          @('issueMode', 'string', '✓', 'NEW / REISSUE'),
          @('templateKey', 'string', '✓', 'テンプレート識別子'),
          @('templateDisplayName', 'string', '✓', 'テンプレート表示名'),
          @('sealSizeLabel', 'string', '✓', 'シールサイズ表示'),
          @('freeEntryText', 'string', '-', 'フリー記入項目'),
          @('count', 'int32', '✓', '対象件数'),
          @('rangeStartQrIdentifier', 'string', '✓', '先頭QR識別子'),
          @('rangeEndQrIdentifier', 'string', '✓', '末尾QR識別子'),
          @('items', 'QrIssuePreviewItem[]', '✓', '印刷対象プレビュー一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（QrIssuePreviewItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('printOrder', 'int32', '✓', '表示順'),
              @('qrIdentifier', 'string', '✓', 'QR識別子候補'),
              @('previewImageBase64', 'string', '-', 'ラベルプレビュー画像'),
              @('existingQrCodeId', 'int64', '-', '再発行時の既存QRコードID')
            )
          }
        )
        StatusRows = @(
          @('200', '生成成功', 'QrIssuePreviewResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象施設に対する実効 `qr_issue` なし', 'ErrorResponse'),
          @('404', '施設または再発行起点QRが存在しない', 'ErrorResponse'),
          @('409', '再発行対象に欠番がある', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '印刷ジョブ開始受付（/qr-print/jobs）'
        Overview = '印刷開始を受け付け、印刷ジョブ、印刷対象明細、QR正本データを確定する。'
        Method = 'POST'
        Path = '/qr-print/jobs'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエスト（QrPrintJobCreateRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
      @('facilityId', 'int64', '✓', '対象施設ID'),
      @('issueMode', 'string', '✓', 'NEW / REISSUE'),
      @('templateKey', 'string', '✓', 'テンプレート識別子'),
      @('printerName', 'string', '✓', '選択したプリンタ名'),
      @('clientRequestId', 'string(uuid)', '✓', '同一印刷開始操作を識別する冪等キー'),
      @('freeEntryText', 'string', '-', 'フリー記入項目'),
      @('items', 'QrPrintJobCreateItem[]', '✓', '印刷対象一覧')
        )
        RequestSubtables = @(
          @{
            Title = 'items要素（QrPrintJobCreateItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('printOrder', 'int32', '✓', '印刷順'),
              @('qrIdentifier', 'string', '✓', 'プレビュー時点のQR識別子候補または再発行対象QR識別子'),
              @('existingQrCodeId', 'int64', '-', '再発行時の既存QRコードID')
            )
          }
        )
        PermissionLines = @(
          '認可条件: `user_facility_assignments` に対象施設への有効割当があること',
          '認可条件: `facility_feature_settings` と `user_facility_feature_settings` の両方で `qr_issue` が有効であること'
        )
        ProcessingLines = @(
          '入力値、`clientRequestId` の形式、`printOrder` 重複、件数整合を検証する',
          '同一ユーザー・同一施設・同一 `clientRequestId` の再送は冪等に扱う。完全一致する既存開始受付がある場合はそのジョブを返し、内容が異なる場合は 409 を返す',
          '`qr_print_jobs` に1件作成し、`client_request_id`、`requested_by_user_id`、`requested_at`、`started_at`、`status=''IN_PROGRESS''` を設定する。`started_at` は印刷開始受付完了時刻とする',
          '新規発行時は `(facility_id, qr_identifier)` と `(facility_id, code_prefix, code_branch, code_serial)` の重複を再検証したうえで `qr_codes` を作成し、`issued_by_user_id` / `issued_at` / `print_status=''PRINTING''` / `last_print_job_id` を設定する',
          '再発行時は既存 `qr_codes` を再取得し、存在確認と `existingQrCodeId` / `qrIdentifier` の整合を検証したうえで、`label_template_key` / `free_entry_text` / `issued_by_user_id` / `issued_at` / `print_status=''PRINTING''` / `last_print_job_id` を更新する',
          '`qr_print_job_items` を全件 `WAITING` で作成し、各明細に確定した `qr_code_id`、`print_order` を紐づける',
          '印刷用の最終確定データとして、各明細の `qrIdentifier` と QRシンボル用遷移URLをレスポンスへ返却する'
        )
        ResponseTitle = 'レスポンス（201：QrPrintJobCreateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('qrPrintJobId', 'int64', '✓', '作成した印刷ジョブID'),
          @('status', 'string', '✓', 'ジョブステータス（初期値 `IN_PROGRESS`）'),
          @('requestedItemCount', 'int32', '✓', '印刷対象として受け付けた件数'),
          @('clientRequestId', 'string(uuid)', '✓', '受理した冪等キー'),
          @('startedAt', 'datetime', '✓', '印刷開始受付日時'),
          @('items', 'QrPrintJobCreateResponseItem[]', '✓', '印刷用の最終確定対象一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（QrPrintJobCreateResponseItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('qrPrintJobItemId', 'int64', '✓', '印刷ジョブ明細ID'),
              @('qrCodeId', 'int64', '✓', '印刷対象QRコードID'),
              @('printOrder', 'int32', '✓', '印刷順'),
              @('qrIdentifier', 'string', '✓', 'サーバーで確定したQR識別子'),
              @('qrContentUrl', 'string', '✓', 'QRシンボルへ埋め込む遷移用URL')
            )
          }
        )
        StatusRows = @(
          @('201', '開始受付成功', 'QrPrintJobCreateResponse'),
          @('200', '同一 `clientRequestId` の再送を既存ジョブで受理', 'QrPrintJobCreateResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象施設に対する実効 `qr_issue` なし', 'ErrorResponse'),
          @('409', 'ジョブ対象一覧の整合不正、採番競合、または同一 `clientRequestId` の内容競合', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '印刷ジョブ取得（/qr-print/jobs/{qrPrintJobId}）'
        Overview = '印刷開始受付後のジョブ詳細と明細結果を取得する。'
        Method = 'GET'
        Path = '/qr-print/jobs/{qrPrintJobId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('qrPrintJobId', 'path', 'int64', '✓', '印刷ジョブID')
        )
        PermissionLines = @(
          '認可条件: 対象ジョブの `facility_id` について `user_facility_assignments` に有効割当があること',
          '認可条件: 対象ジョブの `facility_id` について `facility_feature_settings` と `user_facility_feature_settings` の両方で `qr_issue` が有効であること'
        )
        ProcessingLines = @(
          '`qr_print_jobs` と `qr_print_job_items` を取得する',
          '印刷対象の `qrIdentifier`、表示順、現在ステータス、エラーメッセージを返却する',
          'テンプレート表示名とシールサイズ表示は `templateKey` に対応するアプリ内固定定義から補完する',
          'ジョブ全体の成功/失敗件数、開始/終了時刻、失敗段階、エラー概要を返却する'
        )
        ResponseTitle = 'レスポンス（200：QrPrintJobResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('qrPrintJobId', 'int64', '✓', '印刷ジョブID'),
          @('facilityId', 'int64', '✓', '対象施設ID'),
          @('templateKey', 'string', '✓', 'テンプレート識別子'),
          @('templateDisplayName', 'string', '✓', 'テンプレート表示名'),
          @('sealSizeLabel', 'string', '✓', 'シールサイズ表示'),
          @('printerName', 'string', '✓', 'プリンタ名'),
          @('clientRequestId', 'string(uuid)', '✓', '冪等キー'),
          @('status', 'string', '✓', 'ジョブステータス'),
          @('freeEntryText', 'string', '-', 'フリー記入項目'),
          @('requestedAt', 'datetime', '✓', 'ジョブ依頼日時'),
          @('startedAt', 'datetime', '✓', 'ジョブ開始受付日時'),
          @('finishedAt', 'datetime', '-', 'ジョブ終了日時'),
          @('successCount', 'int32', '✓', '成功件数'),
          @('failureCount', 'int32', '✓', '失敗件数'),
          @('errorStage', 'string', '-', '失敗段階'),
          @('errorSummary', 'string', '-', 'ジョブ全体のエラー概要'),
          @('items', 'QrPrintJobItemResponse[]', '✓', '印刷対象一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（QrPrintJobItemResponse）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('qrPrintJobItemId', 'int64', '✓', '印刷ジョブ明細ID'),
              @('qrCodeId', 'int64', '✓', 'QRコードID'),
              @('printOrder', 'int32', '✓', '印刷順'),
              @('qrIdentifier', 'string', '✓', 'QR識別子'),
              @('qrContentUrl', 'string', '✓', 'QRシンボルへ埋め込む遷移用URL'),
              @('status', 'string', '✓', 'WAITING / PRINTED / FAILED / CANCELED'),
              @('printedAt', 'datetime', '-', '印刷日時'),
              @('errorMessage', 'string', '-', '失敗時エラーメッセージ')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'QrPrintJobResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象ジョブ施設に対する実効 `qr_issue` なし', 'ErrorResponse'),
          @('404', '対象ジョブが存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '印刷結果反映（/qr-print/jobs/{qrPrintJobId}/result）'
        Overview = 'ローカル印刷モジュールの実行結果を印刷ジョブへ反映する。'
        Method = 'POST'
        Path = '/qr-print/jobs/{qrPrintJobId}/result'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('qrPrintJobId', 'path', 'int64', '✓', '印刷ジョブID')
        )
        RequestTitle = 'リクエスト（QrPrintResultRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('jobErrorStage', 'string', '-', 'ジョブ全体の失敗段階。値: LOCAL_MODULE_INIT / PRINTER_INIT / PRINT_REQUEST / PRINT_EXECUTION'),
          @('jobErrorSummary', 'string', '-', 'ジョブ全体の失敗概要'),
          @('resultItems', 'QrPrintResultItem[]', '✓', 'ローカル印刷モジュールから受け取った実行結果')
        )
        RequestSubtables = @(
          @{
            Title = 'resultItems要素（QrPrintResultItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('qrPrintJobItemId', 'int64', '✓', '印刷ジョブ明細ID'),
              @('status', 'string', '✓', 'PRINTED / FAILED / CANCELED'),
              @('errorMessage', 'string', '-', '失敗時エラー'),
              @('printedAt', 'datetime', '-', '端末側印刷時刻')
            )
          }
        )
        PermissionLines = @(
          '認可条件: 対象ジョブの `facility_id` について `user_facility_assignments` に有効割当があること',
          '認可条件: 対象ジョブの `facility_id` について `facility_feature_settings` と `user_facility_feature_settings` の両方で `qr_issue` が有効であること'
        )
        ProcessingLines = @(
          '対象ジョブと明細を取得し、ジョブ内明細件数と `resultItems` 件数の一致を検証する',
          '各 `resultItems` を `qrPrintJobItemId` で突合し、対象外明細や重複明細が含まれる場合はエラーとする',
          'ローカル印刷モジュール初期化失敗や印刷要求開始失敗など、物理印刷前に失敗した場合でも、本 API を呼び出して対象全件を `FAILED` として終端させる',
          'ジョブがすでに終端ステータスの場合、同一結果の再送は冪等に受理し、矛盾する更新要求は 409 とする',
          '印刷成功時は対応する `qr_print_job_items.status=''PRINTED''` / `printed_at` を更新し、対応する `qr_codes.print_status=''PRINTED''` / `printed_at` を更新する',
          '印刷失敗またはキャンセル時は対応する `qr_print_job_items.status` / `error_message` を更新し、対応する `qr_codes.print_status` を `FAILED` または `CANCELED` へ更新する。失敗時は過去の最終成功 `printed_at` を上書きしない',
          '`jobErrorStage` / `jobErrorSummary` が指定された場合は `qr_print_jobs.error_stage` / `error_summary` へ反映し、未指定時は明細エラーから要約を補完する',
          'ジョブ全体の成功/失敗件数を集計し、`qr_print_jobs.status`、`success_count`、`failure_count`、`finished_at` を更新する'
        )
        ResponseTitle = 'レスポンス（200：QrPrintResultResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('qrPrintJobId', 'int64', '✓', '印刷ジョブID'),
          @('status', 'string', '✓', 'COMPLETED / PARTIAL_FAILED / FAILED / CANCELED'),
          @('successCount', 'int32', '✓', '成功件数'),
          @('failureCount', 'int32', '✓', '失敗件数'),
          @('errorStage', 'string', '-', '失敗段階'),
          @('errorSummary', 'string', '-', 'ジョブ全体のエラー概要'),
          @('finishedAt', 'datetime', '✓', 'ジョブ終了日時')
        )
        StatusRows = @(
          @('200', '結果反映完了', 'QrPrintResultResponse'),
          @('400', '入力不正または結果件数不一致', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象ジョブ施設に対する実効 `qr_issue` なし', 'ErrorResponse'),
          @('404', '対象ジョブが存在しない', 'ErrorResponse'),
          @('409', '結果反映競合、再発行対象不整合、または終端後の矛盾更新', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Bullets'; Items = @(
      'テンプレート定義本体はアプリ内固定であり、DB テーブル/専用取得APIは設けない',
      'プリンタ候補は端末上のローカル印刷モジュールが返す前提とし、サーバーAPIでは管理しない',
      'プレビュー生成時点では `qr_codes` / `qr_print_jobs` / `qr_print_job_items` を永続化しない',
      '新規発行時の最終採番確定と `qr_codes` 保存は `POST /qr-print/jobs` の印刷開始受付時に行う',
      '`POST /qr-print/jobs` は `clientRequestId` を用いて冪等に扱い、同一操作の再送では新規ジョブを二重作成しない',
      '`qr_print_job_items` は `POST /qr-print/jobs` の印刷開始受付時に全件作成する',
      '印刷開始受付完了時点で `qr_codes.print_status` は `PRINTING` へ遷移し、`qr_print_jobs.started_at` には印刷開始受付完了時刻を記録する',
      '印刷結果反映 API は `qr_codes` の新規作成や採番を行わず、印刷状態と集計結果の更新のみを行う',
      'ローカル印刷モジュール初期化失敗など物理印刷前の失敗でも、結果反映 API へ全件 `FAILED` を送ってジョブを終端させる',
      '再発行では新しい QR識別子を採番せず、既存 `qr_identifier` を再利用する',
      '同一ジョブへの同一結果再送は冪等に受理し、矛盾する結果更新は 409 とする'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '説明'); Rows = @(
      @('AUTH_401', '401', '未認証'),
      @('AUTH_403_QR_ISSUE_DENIED', '403', '対象施設に対する実効 `qr_issue` がない'),
      @('QR_400_INVALID_INPUT', '400', '入力形式または必須項目が不正'),
      @('QR_400_RESULT_ITEM_COUNT_MISMATCH', '400', '結果反映対象件数がジョブ明細件数と一致しない'),
      @('QR_404_FACILITY_NOT_FOUND', '404', '対象施設が存在しない'),
      @('QR_404_QR_NOT_FOUND', '404', '再発行対象またはジョブ対象QRが存在しない'),
      @('QR_404_PRINT_JOB_NOT_FOUND', '404', '対象印刷ジョブが存在しない'),
      @('QR_409_REISSUE_RANGE_INVALID', '409', '再発行対象に欠番または不整合がある'),
      @('QR_409_SERIAL_CONFLICT', '409', '新規発行時の採番競合が解消できない'),
      @('QR_409_PRINT_JOB_REQUEST_CONFLICT', '409', '同一 `clientRequestId` に対して異なる開始受付内容が送信された'),
      @('QR_409_PRINT_RESULT_CONFLICT', '409', '印刷結果の再送内容が既存結果と矛盾する'),
      @('QR_500_INTERNAL', '500', 'サーバー内部エラー')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Bullets'; Items = @(
      'テンプレート一覧とプリンタ候補を API 化する要否は `taniguchi/機能要件.md` の未確定事項として継続確認する',
      'QRコードの採番規則や `qr_identifier` 形式を変更する場合は、`qr_codes` の複合ユニーク制約と API の再発行ロジックを同時に見直す',
      'ローカル印刷モジュールとの連携仕様を変更する場合は、`POST /qr-print/jobs` の印刷用確定レスポンスと `POST /qr-print/jobs/{qrPrintJobId}/result` の request/response を同時に更新する',
      '結果未反映のまま長時間 `IN_PROGRESS` に留まるジョブは、通信断または端末異常の可能性があるため、運用上の監視対象として扱う'
    ) }
  )
}
