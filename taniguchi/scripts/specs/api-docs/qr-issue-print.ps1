@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_QR発行・ラベル印刷.docx'
  ScreenLabel = 'QR発行・ラベル印刷'
  CoverDateText = '2026年3月16日'
  RevisionDateText = '2026/3/16'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、QRコード新規発行画面（`/qr-issue`）および QRコード印刷画面（`/qr-print`）で利用する API の設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。' },
    @{ Type = 'Paragraph'; Text = '特に以下を明確にする。' },
    @{ Type = 'Bullets'; Items = @(
      '新規発行/再発行のプレビュー生成 I/F',
      '印刷ジョブの作成、取得、実行 I/F',
      'QR識別子の採番確定と `qr_codes` 保存タイミング',
      'テンプレート・プリンタ候補の扱い'
    ) },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = 'QR発行・ラベル印刷は、資産管理用QRコードの新規発行・再発行を行う `/qr-issue` と、印刷プレビュー・印刷実行を行う `/qr-print` から構成される。' },
    @{ Type = 'Paragraph'; Text = 'QR識別子は施設単位で一意に管理し、新規発行時の採番確定と `qr_codes` への保存は印刷開始時にサーバー側で行う。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('新規発行', 'プレフィックス・2桁番号・5桁開始番号から新しい QR識別子を連番採番する発行方式'),
      @('再発行', '既存 `qr_identifier` を再利用し、指定範囲の既存 QR を印刷し直す発行方式'),
      @('印刷ジョブ', '印刷開始ボタン押下1回分の実行単位。`qr_print_jobs` に保存する'),
      @('印刷ジョブ明細', '印刷ジョブ配下の個別 QR ごとの印刷結果。`qr_print_job_items` に保存する'),
      @('固定テンプレート', 'テプラクリエイターで事前作成したアプリ内固定ラベルテンプレート。DB テーブルは持たない')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('項目', '内容'); Rows = @(
      @('対象画面', '5. QRコード新規発行画面 / 6. QRコード印刷画面'),
      @('対象URL', '/qr-issue / /qr-print'),
      @('主機能', '新規発行/再発行プレビュー、印刷ジョブ作成、印刷プレビュー取得、印刷実行')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'APIの位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、QR発行画面で入力された条件を検証し、印刷対象のプレビュー情報を返却したうえで、印刷画面でジョブ生成・状態参照・印刷実行を行うための I/F を提供する。' },
    @{ Type = 'Paragraph'; Text = 'テンプレート定義本体はアプリ内固定、プリンタ候補は端末のローカル印刷モジュール依存とし、本API群ではこれらのマスタ配信は行わない。' },
    @{ Type = 'Heading2'; Text = '画面とAPIの関係' },
    @{ Type = 'Numbered'; Items = @(
      '新規発行/再発行条件の入力後、印刷画面へ遷移する前にプレビュー生成 API を呼び出す',
      '印刷画面初期表示は、プレビュー生成結果とローカル印刷モジュールのプリンタ候補をもとにクライアント側で表示する',
      '印刷開始押下時に印刷ジョブ作成 API を呼び出し、ジョブID を採番する',
      '続けて印刷実行 API を呼び出し、`qr_codes`、`qr_print_job_items`、印刷結果を確定する',
      '必要に応じて印刷ジョブ取得 API を呼び出し、ジョブ状態と明細結果を再取得する'
    ) },
    @{ Type = 'Heading2'; Text = '使用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル', '利用内容', '主な項目'); Rows = @(
      @('qr_codes', '既存QR確認、新規発行確定、再発行情報更新', 'qr_code_id, facility_id, qr_identifier, code_prefix, code_branch, code_serial, issue_type, label_template_key, free_entry_text, issued_by_user_id, issued_at, print_status, last_print_job_id, printed_at'),
      @('qr_print_jobs', '印刷ジョブ作成、ジョブ状態保持', 'qr_print_job_id, facility_id, template_key, printer_name, requested_by_user_id, requested_at, started_at, finished_at, status, success_count, failure_count, error_summary'),
      @('qr_print_job_items', '印刷実行後の対象リストと明細結果保持', 'qr_print_job_item_id, qr_print_job_id, qr_code_id, print_order, status, printed_at, error_message'),
      @('facilities', '施設スコープ確認', 'facility_id, facility_name'),
      @('users', '発行者・印刷実行者の監査', 'user_id, user_name')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = 'API共通仕様' },
    @{ Type = 'Bullets'; Items = @(
      '通信方式: HTTPS',
      'データ形式: JSON',
      '文字コード: UTF-8',
      '日時形式: ISO 8601（例: `2026-03-16T00:00:00Z`）',
      'プレビューの QRシンボル自体は base64 PNG 文字列または同等の表示用データを返却する'
    ) },
    @{ Type = 'Heading2'; Text = '認証方式' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Heading2'; Text = '権限モデル' },
    @{ Type = 'Paragraph'; Text = '専用 feature_code の最終定義は未確定だが、本API設計書では QR発行権限または QR印刷権限を持つ利用者が、選択施設に対して実行できる前提で記載する。テンプレート定義本体とプリンタ候補取得はアプリ内固定/ローカルモジュール前提のため、本APIの権限制御対象外とする。' },
    @{ Type = 'Table'; Headers = @('処理', '必要権限', '説明'); Rows = @(
      @('プレビュー生成', 'QR発行権限 + 対象施設アクセス可', '新規発行/再発行の採番条件を検証し、印刷対象一覧を返却する'),
      @('印刷ジョブ作成', 'QR印刷権限 + 対象施設アクセス可', '印刷画面用ジョブと明細を作成する'),
      @('印刷ジョブ取得', 'QR印刷権限 + 対象施設アクセス可', '印刷プレビュー画面の表示情報を取得する'),
      @('印刷実行', 'QR印刷権限 + 対象施設アクセス可', '印刷開始と `qr_codes` / 印刷結果の確定を行う')
    ) },
    @{ Type = 'Heading2'; Text = '施設スコープ仕様' },
    @{ Type = 'Bullets'; Items = @(
      '各APIは `facilityId` または対象ジョブの施設IDを基準に、認証済みユーザーが当該施設を作業対象施設として扱えるかを検証する',
      '施設アクセス不可の場合は 403 を返却する',
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
      @('印刷ジョブ作成', 'POST', '/qr-print/jobs', '印刷開始時に印刷ジョブを作成する', '要'),
      @('印刷ジョブ取得', 'GET', '/qr-print/jobs/{qrPrintJobId}', '印刷開始後のジョブ詳細と明細結果を取得する', '要'),
      @('印刷実行', 'POST', '/qr-print/jobs/{qrPrintJobId}/execute', '印刷開始と QR 保存/印刷結果確定を行う', '要')
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
              @('startSerial', 'int32', '✓', '5桁開始番号。未入力時はサーバー側で max+1 を候補算出')
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
          'QR発行権限を持つ利用者であること',
          '指定 `facilityId` が作業対象施設として許可されていること'
        )
        ProcessingLines = @(
          '入力値の必須・桁数・形式を検証する',
          '新規発行時は `(facility_id, code_prefix, code_branch)` 単位の既存最大 `code_serial` を参照し、必要に応じて `startSerial` 候補を補完する',
          '新規発行時は `codePrefix-codeBranch-serial` 形式で指定枚数分の `qr_identifier` 一覧を生成する',
          '再発行時は指定した `reissueStartQrIdentifier` を起点に、既存 `qr_codes` を連番で件数分取得し、1件でも欠番がある場合はエラーとする',
          'プレビュー生成時点では `qr_codes` を保存しない',
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
              @('qrIdentifier', 'string', '✓', 'QR識別子'),
              @('previewImageBase64', 'string', '-', 'ラベルプレビュー画像'),
              @('existingQrCodeId', 'int64', '-', '再発行時の既存QRコードID')
            )
          }
        )
        StatusRows = @(
          @('200', '生成成功', 'QrIssuePreviewResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象施設へのアクセス不可', 'ErrorResponse'),
          @('404', '施設または再発行起点QRが存在しない', 'ErrorResponse'),
          @('409', '再発行対象に欠番がある', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '印刷ジョブ作成（/qr-print/jobs）'
        Overview = '印刷開始時に印刷ジョブを作成する。'
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
          @('freeEntryText', 'string', '-', 'フリー記入項目'),
          @('items', 'QrPrintJobCreateItem[]', '✓', '印刷対象一覧')
        )
        RequestSubtables = @(
          @{
            Title = 'items要素（QrPrintJobCreateItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('printOrder', 'int32', '✓', '印刷順'),
              @('qrIdentifier', 'string', '✓', '印刷対象のQR識別子'),
              @('existingQrCodeId', 'int64', '-', '再発行時の既存QRコードID')
            )
          }
        )
        PermissionLines = @(
          'QR印刷権限を持つ利用者であること',
          '指定 `facilityId` が作業対象施設として許可されていること'
        )
        ProcessingLines = @(
          '`qr_print_jobs` に1件作成し、`requested_by_user_id` には認証ユーザーIDを設定する',
          'この時点では `qr_codes` の新規保存/更新は行わない',
          'この時点では `qr_print_job_items` も作成しない',
          '新規発行時は `qrIdentifier` の候補一覧をジョブ作成要求として受け取り、印刷実行時に最終確定する',
          '再発行時は `existingQrCodeId` と `qrIdentifier` の対応を検証したうえで、印刷実行時に更新対象として使用する'
        )
        ResponseTitle = 'レスポンス（201：QrPrintJobCreateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('qrPrintJobId', 'int64', '✓', '作成した印刷ジョブID'),
          @('status', 'string', '✓', 'ジョブ初期ステータス'),
          @('requestedItemCount', 'int32', '✓', '印刷対象として受け付けた件数')
        )
        StatusRows = @(
          @('201', '作成成功', 'QrPrintJobCreateResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象施設へのアクセス不可', 'ErrorResponse'),
          @('409', 'ジョブ対象一覧の整合が取れない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '印刷ジョブ取得（/qr-print/jobs/{qrPrintJobId}）'
        Overview = '印刷開始後のジョブ詳細と明細結果を取得する。'
        Method = 'GET'
        Path = '/qr-print/jobs/{qrPrintJobId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('qrPrintJobId', 'path', 'int64', '✓', '印刷ジョブID')
        )
        PermissionLines = @(
          'QR印刷権限を持つ利用者であること',
          '対象ジョブの施設が作業対象施設として許可されていること'
        )
        ProcessingLines = @(
          '`qr_print_jobs` と、作成済みの `qr_print_job_items` を取得する',
          '印刷対象の `qrIdentifier`、表示順、ステータス、エラーメッセージを返却する',
          'テンプレート表示名とシールサイズ表示は `templateKey` に対応するアプリ内固定定義から補完する'
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
          @('status', 'string', '✓', 'ジョブステータス'),
          @('freeEntryText', 'string', '-', 'フリー記入項目'),
          @('items', 'QrPrintJobItemResponse[]', '✓', '印刷対象一覧')
        )
        ResponseSubtables = @(
          @{
            Title = 'items要素（QrPrintJobItemResponse）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('qrPrintJobItemId', 'int64', '✓', '印刷ジョブ明細ID'),
              @('printOrder', 'int32', '✓', '印刷順'),
              @('qrIdentifier', 'string', '✓', 'QR識別子'),
              @('status', 'string', '✓', 'WAITING / PRINTED / FAILED / CANCELED'),
              @('printedAt', 'datetime', '-', '印刷日時'),
              @('errorMessage', 'string', '-', '失敗時エラーメッセージ')
            )
          }
        )
        StatusRows = @(
          @('200', '取得成功', 'QrPrintJobResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象施設へのアクセス不可', 'ErrorResponse'),
          @('404', '対象ジョブが存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '印刷実行（/qr-print/jobs/{qrPrintJobId}/execute）'
        Overview = '印刷開始と QR保存/印刷結果確定を行う。'
        Method = 'POST'
        Path = '/qr-print/jobs/{qrPrintJobId}/execute'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('qrPrintJobId', 'path', 'int64', '✓', '印刷ジョブID')
        )
        RequestTitle = 'リクエスト（QrPrintExecuteRequest）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('resultItems', 'QrPrintExecuteItem[]', '✓', 'ローカル印刷モジュールから受け取った実行結果')
        )
        RequestSubtables = @(
          @{
            Title = 'resultItems要素（QrPrintExecuteItem）'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
              @('printOrder', 'int32', '✓', '印刷順。作成対象明細の突合キー'),
              @('qrIdentifier', 'string', '✓', '印刷対象QR識別子'),
              @('status', 'string', '✓', 'PRINTED / FAILED / CANCELED'),
              @('errorMessage', 'string', '-', '失敗時エラー'),
              @('printedAt', 'datetime', '-', '端末側印刷時刻')
            )
          }
        )
        PermissionLines = @(
          'QR印刷権限を持つ利用者であること',
          '対象ジョブの施設が作業対象施設として許可されていること'
        )
        ProcessingLines = @(
          '`qr_print_jobs.status` を `IN_PROGRESS` へ更新し、`started_at` を設定する',
          '新規発行対象は、`qr_identifier` ごとに `(facility_id, qr_identifier)` と `(facility_id, code_prefix, code_branch, code_serial)` の重複を再検証したうえで `qr_codes` を作成し、`issued_by_user_id` / `issued_at` / `print_status` / `last_print_job_id` を設定する',
          '再発行対象は既存 `qr_codes` を再取得し、存在確認のうえ `label_template_key` / `free_entry_text` / `issued_by_user_id` / `issued_at` / `print_status` / `last_print_job_id` を更新する',
          '新規発行では `qr_codes` 作成後、再発行では既存 `qr_codes` 再取得後に、各 `resultItems` と `qr_identifier` / `printOrder` を突合して `qr_print_job_items` を作成・更新する',
          '印刷成功時は対応する `qr_codes.print_status=''PRINTED''` / `printed_at` を更新し、失敗時は `FAILED` を設定する',
          'ジョブ全体の成功/失敗件数を集計し、`qr_print_jobs.status`、`success_count`、`failure_count`、`finished_at`、`error_summary` を更新する',
          '新規発行で競合が起きた場合は再採番またはリトライで一意性を担保し、それでも解消できない場合はジョブを失敗扱いにする'
        )
        ResponseTitle = 'レスポンス（200：QrPrintExecuteResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('qrPrintJobId', 'int64', '✓', '印刷ジョブID'),
          @('status', 'string', '✓', 'COMPLETED / PARTIAL_FAILED / FAILED / CANCELED'),
          @('successCount', 'int32', '✓', '成功件数'),
          @('failureCount', 'int32', '✓', '失敗件数')
        )
        StatusRows = @(
          @('200', '実行完了', 'QrPrintExecuteResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '対象施設へのアクセス不可', 'ErrorResponse'),
          @('404', '対象ジョブが存在しない', 'ErrorResponse'),
          @('409', '採番競合または再発行対象不整合', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第6章 権限・業務ルール' },
    @{ Type = 'Bullets'; Items = @(
      'テンプレート定義本体はアプリ内固定であり、DB テーブル/専用取得APIは設けない',
      'プリンタ候補は端末上のローカル印刷モジュールが返す前提とし、サーバーAPIでは管理しない',
      'プレビュー生成時点では `qr_codes` を永続化しない',
      '新規発行時の最終採番確定と `qr_codes` 保存は印刷実行時に行う',
      '再発行では新しい QR識別子を採番せず、既存 `qr_identifier` を再利用する'
    ) },

    @{ Type = 'Heading1'; Text = '第7章 エラーコード一覧' },
    @{ Type = 'Table'; Headers = @('エラーコード', 'HTTP', '説明'); Rows = @(
      @('AUTH_401', '401', '未認証'),
      @('AUTH_403_FACILITY_SCOPE', '403', '指定施設へのアクセス権限がない'),
      @('QR_400_INVALID_INPUT', '400', '入力形式または必須項目が不正'),
      @('QR_404_FACILITY_NOT_FOUND', '404', '対象施設が存在しない'),
      @('QR_404_QR_NOT_FOUND', '404', '再発行対象またはジョブ対象QRが存在しない'),
      @('QR_404_PRINT_JOB_NOT_FOUND', '404', '対象印刷ジョブが存在しない'),
      @('QR_409_REISSUE_RANGE_INVALID', '409', '再発行対象に欠番または不整合がある'),
      @('QR_409_SERIAL_CONFLICT', '409', '新規発行時の採番競合が解消できない'),
      @('QR_500_INTERNAL', '500', 'サーバー内部エラー')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 運用・保守方針' },
    @{ Type = 'Bullets'; Items = @(
      'テンプレート一覧とプリンタ候補を API 化する要否は `taniguchi/機能要件.md` の未確定事項として継続確認する',
      'QRコードの採番規則や `qr_identifier` 形式を変更する場合は、`qr_codes` の複合ユニーク制約と API の再発行ロジックを同時に見直す',
      'ローカル印刷モジュールとの連携仕様を変更する場合は、`/qr-print/jobs/{qrPrintJobId}/execute` の request/response を更新する'
    ) }
  )
}
