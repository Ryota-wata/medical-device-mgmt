@{
    TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
    OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_SHIP代理作業依頼.docx'
    ScreenLabel = 'SHIP代理作業依頼'
    CoverDateText = '2026年5月12日'
    RevisionDateText = '2026/5/12'
    Sections = @(
        @{
            Type = 'Heading1'
            Text = '第1章 概要'
        },
        @{
            Type = 'Heading2'
            Text = '1.1 目的'
        },
        @{
            Type = 'Paragraph'
            Text = '本書は、購入管理の見積登録・マスタ紐づけ等の作業をSHIPユーザーへ内部的に代理依頼する「SHIP代理作業依頼」機能のAPI仕様を定義する。対象は、病院ユーザーによる依頼作成、SHIPユーザーによる依頼一覧参照・詳細参照・担当取得・差戻し・完了、および病院ユーザーによる依頼取消である。'
        },
        @{
            Type = 'Paragraph'
            Text = '本機能は外部SHIPシステムへの見積依頼送信ではなく、医療機器管理システム内でSHIPユーザーが代理作業対象を把握し、通常のタスク管理画面と同等の操作感で作業できるようにするための内部依頼管理である。'
        },
        @{
            Type = 'Heading2'
            Text = '1.2 対象範囲'
        },
        @{
            Type = 'Table'
            Title = '対象範囲'
            Headers = @('分類', '対象', '本書での扱い')
            Rows = @(
                @('依頼作成', '病院ユーザーがRFQグループからSHIP代理作業依頼を作成する', '対象')
                @('依頼一覧', 'SHIPユーザーが複数施設から届いた依頼を一覧で確認する', '対象')
                @('依頼詳細', 'SHIPユーザーが対象RFQ・対象業者・履歴を確認する', '対象')
                @('担当取得', 'SHIPユーザーが依頼を自分の担当として開始する', '対象')
                @('差戻し', 'SHIPユーザーが作業継続不可の理由を病院側へ戻す', '対象')
                @('完了', 'SHIPユーザーが代理作業完了を登録し、RFQを次工程へ進める', '対象')
                @('取消', '病院ユーザーが未完了の依頼を取り消す', '対象')
                @('外部SHIP送信', '外部SHIPシステムへの業者別見積依頼送信', '対象外。別APIで定義する')
                @('見積明細登録', '代理作業中に行う見積登録・マスタ紐づけの詳細CRUD', '対象外。見積登録・見積管理APIで定義する')
            )
        },
        @{
            Type = 'Heading2'
            Text = '1.3 関連画面・関連設計'
        },
        @{
            Type = 'Table'
            Title = '関連画面・関連設計'
            Headers = @('区分', '名称', '関連内容')
            Rows = @(
                @('画面', '23a. /quotation-data-box/ship-proxy-requests', 'SHIP代理作業依頼一覧・詳細導線')
                @('画面', '51. 注文書作成 / 55. リモデル履歴登録 / 60. RFQ作成管理', '依頼元RFQ・購入管理業務')
                @('要件', '機能要件.md 8.3.9.13', 'SHIP依頼一覧画面の表示条件、一覧、操作')
                @('要件', '機能要件.md 12.4.2', 'SHIP代理作業依頼テーブル定義')
                @('DB', 'db-schema.puml', 'ship_proxy_requests / ship_proxy_request_vendors / ship_proxy_request_status_histories')
                @('API一覧', 'API設計書_一覧.md No.19', '購入管理・リモデル管理・RFQ・SHIP代理作業依頼')
            )
        },
        @{
            Type = 'Heading2'
            Text = '1.4 用語'
        },
        @{
            Type = 'Table'
            Title = '用語定義'
            Headers = @('用語', '定義')
            Rows = @(
                @('SHIP代理作業依頼', '病院ユーザーが、購入管理・RFQに関する作業をSHIPユーザーへ内部的に代理依頼する単位。ship_proxy_requestsで管理する。')
                @('依頼元施設', '依頼を作成した病院施設。ship_proxy_requests.requesting_facility_idで管理する。')
                @('対象業者', '代理作業の対象となるRFQ業者行。ship_proxy_request_vendors.rfq_vendor_idで管理する。')
                @('担当取得', 'SHIPユーザーが依頼を自分の担当としてIN_PROGRESSへ遷移させる操作。')
                @('差戻し', 'SHIPユーザーが代理作業継続不可の理由を登録し、RETURNEDへ遷移させる操作。')
                @('完了', 'SHIPユーザーが代理作業完了を登録し、COMPLETEDへ遷移させる操作。')
                @('normal_ship_request', '病院ユーザー側でSHIP代理作業依頼を作成・取消できる機能コード。')
                @('ship_proxy_task', 'SHIPユーザー側でSHIP代理作業依頼一覧を表示し、依頼に対して作業できる機能コード。')
            )
        },
        @{
            Type = 'Heading1'
            Text = '第2章 システム全体構成'
        },
        @{
            Type = 'Heading2'
            Text = '2.1 API構成'
        },
        @{
            Type = 'Table'
            Title = 'API一覧'
            Headers = @('No.', 'API名', 'メソッド', 'パス', '利用者')
            Rows = @(
                @('1', 'SHIP代理作業依頼作成', 'POST', '/quotation-data-box/rfq-groups/{rfqGroupId}/ship-proxy-request', '病院ユーザー')
                @('2', 'SHIP代理作業依頼一覧取得', 'GET', '/quotation-data-box/ship-proxy-requests', 'SHIPユーザー')
                @('3', 'SHIP代理作業依頼詳細取得', 'GET', '/quotation-data-box/ship-proxy-requests/{shipProxyRequestId}', 'SHIPユーザー')
                @('4', 'SHIP代理作業依頼担当取得', 'POST', '/quotation-data-box/ship-proxy-requests/{shipProxyRequestId}/start', 'SHIPユーザー')
                @('5', 'SHIP代理作業依頼差戻し', 'POST', '/quotation-data-box/ship-proxy-requests/{shipProxyRequestId}/return', 'SHIPユーザー')
                @('6', 'SHIP代理作業依頼完了', 'POST', '/quotation-data-box/ship-proxy-requests/{shipProxyRequestId}/complete', 'SHIPユーザー')
                @('7', 'SHIP代理作業依頼取消', 'POST', '/quotation-data-box/ship-proxy-requests/{shipProxyRequestId}/cancel', '病院ユーザー')
            )
        },
        @{
            Type = 'Heading2'
            Text = '2.2 主要テーブル'
        },
        @{
            Type = 'Table'
            Title = '主要テーブル'
            Headers = @('テーブル', '用途', '本APIでの操作')
            Rows = @(
                @('ship_proxy_requests', 'SHIP代理作業依頼の親レコード', '作成、一覧、詳細、状態更新')
                @('ship_proxy_request_vendors', '依頼対象のRFQ業者行', '作成、詳細取得、完了・取消時の状態更新')
                @('ship_proxy_request_status_histories', '状態変更履歴', '状態変更ごとに追加')
                @('rfqs', '対象RFQ', '依頼作成時・完了時・取消時の状態更新')
                @('rfq_vendors', '対象RFQの業者行', '依頼対象抽出、詳細表示')
                @('facilities', '依頼元施設', '一覧・詳細表示、権限判定')
                @('users', '依頼者・担当者', '一覧・詳細表示、権限判定')
            )
        },
        @{
            Type = 'Heading2'
            Text = '2.3 同期・非同期方針'
        },
        @{
            Type = 'Bullets'
            Items = @(
                '本APIは外部SHIP連携を行わない。依頼作成時に外部送信キューや外部API呼び出しは実行しない。',
                '依頼作成、担当取得、差戻し、完了、取消はDBトランザクション内で同期的に完了させる。',
                '通知機能を追加する場合は、状態変更履歴の登録後に非同期通知ジョブへ連携する。通知の宛先・媒体・再送は本書の対象外とする。',
                'rfq_vendors.request_statusは外部送信状態を表すため、SHIP代理作業依頼の作成ではSENTへ更新しない。'
            )
        },
        @{
            Type = 'Heading1'
            Text = '第3章 共通仕様'
        },
        @{
            Type = 'Heading2'
            Text = '3.1 通信仕様'
        },
        @{
            Type = 'Table'
            Title = '通信仕様'
            Headers = @('項目', '仕様')
            Rows = @(
                @('プロトコル', 'HTTPS')
                @('認証', 'Bearer Token')
                @('リクエスト形式', 'application/json; charset=utf-8')
                @('レスポンス形式', 'application/json; charset=utf-8')
                @('日時形式', 'ISO 8601（例: 2026-05-12T09:30:00+09:00）')
                @('冪等性', 'POST系APIはIdempotency-Keyヘッダーを任意指定可能。指定時は同一ユーザー・同一キー・同一リクエストの再送を同一結果として扱う。')
            )
        },
        @{
            Type = 'Heading2'
            Text = '3.2 認可仕様'
        },
        @{
            Type = 'Table'
            Title = '認可仕様'
            Headers = @('操作', '認可条件')
            Rows = @(
                @('依頼作成', 'ログインユーザーの選択中施設が対象RFQの施設と一致し、当該施設でnormal_ship_requestの実効権限が成立すること。')
                @('依頼取消', 'ログインユーザーの選択中施設が依頼元施設と一致し、当該施設でnormal_ship_requestの実効権限が成立すること。')
                @('一覧取得', 'users.account_typeがSHIPであり、少なくとも1施設に対してship_proxy_taskの実効権限が成立すること。')
                @('詳細取得', 'users.account_typeがSHIPであり、依頼元施設に対してship_proxy_taskの実効権限が成立すること。')
                @('担当取得', '詳細取得条件を満たし、対象依頼が未担当または自分が担当中であること。')
                @('差戻し', '詳細取得条件を満たし、対象依頼が自分に割り当てられたIN_PROGRESSであること。')
                @('完了', '詳細取得条件を満たし、対象依頼が自分に割り当てられたIN_PROGRESSであること。')
            )
        },
        @{
            Type = 'Paragraph'
            Text = 'normal_ship_requestおよびship_proxy_taskはconfig_scope=FACILITY_USERの機能コードとして扱い、facility_feature_settings.is_enabled=trueかつuser_facility_feature_settings.is_enabled=trueの場合のみ実効権限が成立する。API実行時は画面表示条件に依存せず、各APIで実効権限を再判定する。'
        },
        @{
            Type = 'Paragraph'
            Text = 'SHIPユーザーは施設選択画面から「SHIP依頼一覧へ」を押下して本機能に遷移するが、一覧取得時のスコープは画面上で選択した施設ではなく、ship_proxy_taskの実効権限が成立する施設集合から決定する。施設選択ボタンで施設が選択済みかどうかは、SHIP代理作業依頼一覧への遷移可否および一覧スコープに影響しない。'
        },
        @{
            Type = 'Heading2'
            Text = '3.3 状態遷移'
        },
        @{
            Type = 'Table'
            Title = '状態遷移'
            Headers = @('操作', '変更前', '変更後', '主な更新内容')
            Rows = @(
                @('依頼作成', '-', 'REQUESTED', 'ship_proxy_requestsを作成し、対象業者をREQUESTEDで作成する。rfqs.statusを見積登録依頼中へ更新する。')
                @('担当取得', 'REQUESTED', 'IN_PROGRESS', 'assigned_user_id、started_atを設定する。')
                @('担当取得（再送）', 'IN_PROGRESS（担当者が自分）', 'IN_PROGRESS', '同一Idempotency-Keyまたは同一担当者の再送は現在状態を返す。')
                @('差戻し', 'IN_PROGRESS', 'RETURNED', 'return_reasonを設定し、状態履歴を追加する。')
                @('完了', 'IN_PROGRESS', 'COMPLETED', 'completed_atを設定し、対象業者をCOMPLETEDへ更新する。RFQを次工程へ進める。')
                @('取消', 'REQUESTED / RETURNED', 'CANCELED', 'canceled_atを設定し、対象業者をCANCELEDへ更新する。RFQを依頼前の状態へ戻す。')
            )
        },
        @{
            Type = 'Paragraph'
            Text = 'RETURNED後に再依頼する場合は、病院ユーザーが差戻し内容を確認したうえで当該依頼を取消し、必要な修正後に新規依頼を作成する。同一RFQにREQUESTED、IN_PROGRESS、RETURNEDのいずれかの未完了依頼が存在する場合、新規作成は409で拒否する。'
        },
        @{
            Type = 'Heading2'
            Text = '3.4 共通レスポンス'
        },
        @{
            Type = 'Table'
            Title = 'エラーレスポンス'
            Headers = @('フィールド', '型', '必須', '説明')
            Rows = @(
                @('error.code', 'string', '○', 'アプリケーションエラーコード')
                @('error.message', 'string', '○', '利用者向けメッセージ')
                @('error.details[]', 'array', '-', '項目別エラー。入力エラー時に設定')
                @('traceId', 'string', '○', '問い合わせ用の追跡ID')
            )
        },
        @{
            Type = 'Heading1'
            Text = '第4章 API一覧'
        },
        @{
            Type = 'Heading2'
            Text = 'SHIP代理作業依頼API'
        },
        @{
            Type = 'Table'
            Headers = @('機能名', 'Method', 'Path', '概要', '認証')
            Rows = @(
                @('SHIP代理作業依頼作成', 'POST', '/quotation-data-box/rfq-groups/{rfqGroupId}/ship-proxy-request', '未送信業者を対象に内部代理作業依頼を作成する', '要')
                @('SHIP代理作業依頼一覧取得', 'GET', '/quotation-data-box/ship-proxy-requests', 'SHIPユーザーが担当施設群に届いた依頼を一覧取得する', '要')
                @('SHIP代理作業依頼詳細取得', 'GET', '/quotation-data-box/ship-proxy-requests/{shipProxyRequestId}', '依頼、RFQ、対象業者、履歴を取得する', '要')
                @('SHIP代理作業依頼担当取得', 'POST', '/quotation-data-box/ship-proxy-requests/{shipProxyRequestId}/start', '依頼を自分の担当として作業中にする', '要')
                @('SHIP代理作業依頼差戻し', 'POST', '/quotation-data-box/ship-proxy-requests/{shipProxyRequestId}/return', '担当SHIPユーザーが理由を登録して差し戻す', '要')
                @('SHIP代理作業依頼完了', 'POST', '/quotation-data-box/ship-proxy-requests/{shipProxyRequestId}/complete', '代理作業完了を登録しRFQを次工程へ進める', '要')
                @('SHIP代理作業依頼取消', 'POST', '/quotation-data-box/ship-proxy-requests/{shipProxyRequestId}/cancel', '病院ユーザーが未完了依頼を取り消す', '要')
            )
        },
        @{
            Type = 'Heading1'
            Text = '第5章 SHIP代理作業依頼機能設計'
        },
        @{
            Type = 'EndpointBlocks'
            Items = @(
                @{
                    Title = '5.1 SHIP代理作業依頼作成'
                    Overview = 'RFQグループに紐づく未送信業者を対象に、SHIP代理作業依頼を作成する。外部SHIP送信は行わず、内部依頼レコードのみを作成する。'
                    Method = 'POST'
                    Path = '/quotation-data-box/rfq-groups/{rfqGroupId}/ship-proxy-request'
                    Auth = 'Bearer Token（normal_ship_request）'
                    ParametersTitle = 'パスパラメータ'
                    ParametersHeaders = @('項目', '型', '必須', '説明')
                    ParametersRows = @(
                        @('rfqGroupId', 'string', '○', '対象RFQグループID。実装上は対象rfqs.rfq_idへ解決する。')
                    )
                    RequestTitle = 'リクエスト'
                    RequestHeaders = @('項目', '型', '必須', '説明')
                    RequestRows = @(
                        @('requestNote', 'string', '-', '依頼メモ。最大1000文字。')
                    )
                    PermissionLines = @(
                        'ログイン済みであること。',
                        '選択中施設が対象RFQの依頼元施設と一致すること。',
                        '選択中施設でnormal_ship_requestの実効権限が成立すること。'
                    )
                    ProcessingLines = @(
                        '対象RFQを取得し、ログインユーザーの選択中施設とrfqs.facility_idが一致することを検証する。',
                        'rfqs.statusが見積DB登録済であることを検証する。',
                        '同一RFQにREQUESTED、IN_PROGRESS、RETURNEDの未完了SHIP代理作業依頼が存在しないことを検証する。',
                        'rfq_vendorsからrequest_statusがDRAFTの業者行を依頼対象として抽出する。対象が0件の場合は409を返す。',
                        'ship_proxy_requestsをrequest_status=REQUESTED、request_type=QUOTATION_REGISTRATIONで作成する。',
                        '抽出したrfq_vendorsごとにship_proxy_request_vendorsをtarget_status=REQUESTEDで作成する。',
                        'ship_proxy_request_status_historiesへ状態変更履歴を追加する。',
                        'rfqs.statusを見積登録依頼中へ更新する。',
                        'rfq_vendors.request_statusは更新しない。外部送信済みを示すSENTにはしない。'
                    )
                    ResponseTitle = 'レスポンス（201 Created）'
                    ResponseHeaders = @('項目', '型', '必須', '説明')
                    ResponseRows = @(
                        @('shipProxyRequestId', 'string', '○', 'SHIP代理作業依頼ID')
                        @('requestNo', 'string', '○', '依頼番号')
                        @('requestStatus', 'string', '○', 'REQUESTED')
                        @('requestingFacilityId', 'string', '○', '依頼元施設ID')
                        @('rfqId', 'string', '○', '対象RFQ ID')
                        @('targetVendorCount', 'number', '○', '依頼対象業者数')
                        @('rfqStatus', 'string', '○', '更新後RFQステータス。見積登録依頼中')
                        @('requestedAt', 'string', '○', '依頼日時')
                    )
                    StatusRows = @(
                        @('201', '作成成功', 'ShipProxyRequestCreateResponse')
                        @('400', '入力形式不正', 'ErrorResponse')
                        @('401', '未認証', 'ErrorResponse')
                        @('403', 'normal_ship_request権限なし、または施設不一致', 'ErrorResponse')
                        @('404', 'RFQが存在しない', 'ErrorResponse')
                        @('409', 'RFQステータス不正、依頼対象業者なし、または未完了依頼が存在する', 'ErrorResponse')
                    )
                },
                @{
                    Title = '5.2 SHIP代理作業依頼一覧取得'
                    Overview = 'SHIPユーザーが、ship_proxy_taskの実効権限が成立する施設に届いた代理作業依頼を一覧取得する。施設選択画面で選択済みの施設は一覧スコープに使用しない。'
                    Method = 'GET'
                    Path = '/quotation-data-box/ship-proxy-requests'
                    Auth = 'Bearer Token（SHIPユーザー + ship_proxy_task）'
                    ParametersTitle = 'クエリパラメータ'
                    ParametersHeaders = @('項目', '型', '必須', '説明')
                    ParametersRows = @(
                        @('status', 'string', '-', '依頼ステータス。REQUESTED / IN_PROGRESS / RETURNED / COMPLETED / CANCELED。未指定時はREQUESTED, IN_PROGRESS, RETURNED。')
                        @('requestingFacilityId', 'string', '-', '依頼元施設ID。指定時もship_proxy_task実効権限成立施設内に限定する。')
                        @('requestType', 'string', '-', '依頼種別。現時点はQUOTATION_REGISTRATION。')
                        @('assignedScope', 'string', '-', '担当範囲。all / mine / unassigned。未指定時はall。')
                        @('requestedFrom', 'string', '-', '依頼日時From。ISO 8601。')
                        @('requestedTo', 'string', '-', '依頼日時To。ISO 8601。')
                        @('keyword', 'string', '-', '見積依頼No.、見積グループ名、依頼者名の部分一致検索。')
                        @('limit', 'number', '-', '取得件数。1-100。未指定時50。')
                        @('cursor', 'string', '-', '次ページ取得カーソル。')
                    )
                    PermissionLines = @(
                        'users.account_typeがSHIPであること。',
                        'ship_proxy_taskの実効権限が成立する施設が1件以上存在すること。',
                        '検索結果はship_proxy_task実効権限成立施設の依頼に限定する。'
                    )
                    ProcessingLines = @(
                        'ログインユーザーに対してship_proxy_taskの実効権限が成立する施設ID集合を解決する。',
                        'ship_proxy_requests.requesting_facility_idが当該施設ID集合に含まれる依頼のみを検索する。',
                        '検索条件、担当範囲、ページング条件を適用する。',
                        '依頼日時の降順、ship_proxy_request_idの降順で安定ソートする。',
                        '一覧表示に必要な施設名、見積依頼No.、見積グループ名、依頼者名、担当者名、対象業者数をJOINまたは集計して返却する。'
                    )
                    ResponseTitle = 'レスポンス（200 OK）'
                    ResponseHeaders = @('項目', '型', '必須', '説明')
                    ResponseRows = @(
                        @('items[]', 'array', '○', '依頼一覧')
                        @('nextCursor', 'string', '-', '次ページカーソル。次ページがない場合はnull。')
                    )
                    ResponseSubtables = @(
                        @{
                            Title = 'items[]'
                            Headers = @('項目', '型', '必須', '説明')
                            Rows = @(
                                @('shipProxyRequestId', 'string', '○', 'SHIP代理作業依頼ID')
                                @('requestNo', 'string', '○', '依頼番号')
                                @('requestStatus', 'string', '○', '依頼ステータス')
                                @('requestingFacilityId', 'string', '○', '依頼元施設ID')
                                @('requestingFacilityName', 'string', '○', '依頼元施設名')
                                @('rfqId', 'string', '○', '対象RFQ ID')
                                @('rfqNo', 'string', '○', '見積依頼No.')
                                @('rfqGroupName', 'string', '○', '見積グループ名')
                                @('requestType', 'string', '○', '依頼種別')
                                @('requestTypeLabel', 'string', '○', '依頼種別表示名。例: 見積登録・マスタ紐付け')
                                @('targetVendorCount', 'number', '○', '対象業者数')
                                @('requestedByUserName', 'string', '○', '依頼者名')
                                @('requestedAt', 'string', '○', '依頼日時')
                                @('assignedUserId', 'string', '-', '担当SHIPユーザーID')
                                @('assignedUserName', 'string', '-', '担当SHIPユーザー名')
                                @('updatedAt', 'string', '○', '最終更新日時')
                            )
                        }
                    )
                    StatusRows = @(
                        @('200', '取得成功', 'ShipProxyRequestListResponse')
                        @('400', '検索条件不正', 'ErrorResponse')
                        @('401', '未認証', 'ErrorResponse')
                        @('403', 'SHIPユーザーでない、またはship_proxy_task実効権限成立施設が存在しない', 'ErrorResponse')
                    )
                },
                @{
                    Title = '5.3 SHIP代理作業依頼詳細取得'
                    Overview = 'SHIP代理作業依頼の詳細、対象RFQ、対象業者、関連見積登録状況、状態履歴、利用可能アクションを取得する。'
                    Method = 'GET'
                    Path = '/quotation-data-box/ship-proxy-requests/{shipProxyRequestId}'
                    Auth = 'Bearer Token（SHIPユーザー + ship_proxy_task）'
                    ParametersTitle = 'パスパラメータ'
                    ParametersHeaders = @('項目', '型', '必須', '説明')
                    ParametersRows = @(
                        @('shipProxyRequestId', 'string', '○', 'SHIP代理作業依頼ID')
                    )
                    PermissionLines = @(
                        'users.account_typeがSHIPであること。',
                        '対象依頼のrequesting_facility_idに対してship_proxy_taskの実効権限が成立すること。'
                    )
                    ProcessingLines = @(
                        'ship_proxy_requestsを取得する。',
                        '依頼元施設に対するship_proxy_taskの実効権限を検証する。',
                        '対象RFQ、対象業者、関連見積登録状況、状態履歴、担当者・依頼者情報を取得する。',
                        '現在の依頼ステータスと担当者に基づいてavailableActionsを算出する。'
                    )
                    ResponseTitle = 'レスポンス（200 OK）'
                    ResponseHeaders = @('項目', '型', '必須', '説明')
                    ResponseRows = @(
                        @('request', 'object', '○', '依頼情報')
                        @('rfq', 'object', '○', 'RFQ情報')
                        @('vendors[]', 'array', '○', '対象業者')
                        @('quotationRegistration', 'object', '○', '関連見積登録状況')
                        @('histories[]', 'array', '○', '状態履歴')
                        @('availableActions[]', 'array', '○', '現在ユーザーが実行可能な操作')
                    )
                    ResponseSubtables = @(
                        @{
                            Title = 'request'
                            Headers = @('項目', '型', '必須', '説明')
                            Rows = @(
                                @('shipProxyRequestId', 'string', '○', 'SHIP代理作業依頼ID')
                                @('requestNo', 'string', '○', '依頼番号')
                                @('requestStatus', 'string', '○', '依頼ステータス')
                                @('requestType', 'string', '○', '依頼種別')
                                @('requestTypeLabel', 'string', '○', '依頼種別表示名')
                                @('requestNote', 'string', '-', '依頼メモ')
                                @('returnReason', 'string', '-', '差戻し理由')
                                @('requestingFacilityId', 'string', '○', '依頼元施設ID')
                                @('requestingFacilityName', 'string', '○', '依頼元施設名')
                                @('requestedByUserId', 'string', '○', '依頼者ID')
                                @('requestedByUserName', 'string', '○', '依頼者名')
                                @('requestedAt', 'string', '○', '依頼日時')
                                @('assignedUserId', 'string', '-', '担当SHIPユーザーID')
                                @('assignedUserName', 'string', '-', '担当SHIPユーザー名')
                                @('startedAt', 'string', '-', '開始日時')
                                @('completedAt', 'string', '-', '完了日時')
                                @('canceledAt', 'string', '-', '取消日時')
                                @('updatedAt', 'string', '○', '最終更新日時')
                            )
                        },
                        @{
                            Title = 'rfq'
                            Headers = @('項目', '型', '必須', '説明')
                            Rows = @(
                                @('rfqId', 'string', '○', '対象RFQ ID')
                                @('rfqNo', 'string', '○', '見積依頼No.')
                                @('rfqGroupName', 'string', '○', '見積グループ名')
                                @('rfqStatus', 'string', '○', 'RFQステータス')
                                @('facilityId', 'string', '○', '対象施設ID')
                                @('requestedOn', 'string', '-', '依頼日')
                                @('dueOn', 'string', '-', '回答期限')
                                @('remarks', 'string', '-', 'RFQコメント')
                            )
                        },
                        @{
                            Title = 'vendors[]'
                            Headers = @('項目', '型', '必須', '説明')
                            Rows = @(
                                @('shipProxyRequestVendorId', 'string', '○', '依頼対象業者ID')
                                @('rfqVendorId', 'string', '○', 'RFQ業者ID')
                                @('vendorId', 'string', '○', '業者ID')
                                @('vendorName', 'string', '○', '業者名')
                                @('targetStatus', 'string', '○', 'REQUESTED / COMPLETED / CANCELED')
                                @('rfqVendorRequestStatus', 'string', '○', 'rfq_vendors.request_status')
                                @('latestQuotationId', 'string', '-', '対象業者に紐づく最新見積ID。未登録時はnull。')
                                @('latestQuotationStatus', 'string', '-', '最新見積のquotations.status。未登録時はnull。')
                                @('registeredQuotationExists', 'boolean', '○', 'REGISTERED以上の見積が存在する場合true。')
                            )
                        },
                        @{
                            Title = 'quotationRegistration'
                            Headers = @('項目', '型', '必須', '説明')
                            Rows = @(
                                @('targetVendorCount', 'number', '○', '依頼対象業者数')
                                @('registeredQuotationCount', 'number', '○', 'quotations.statusがREGISTEREDまたはORDER_SELECTEDの対象業者数')
                                @('draftQuotationCount', 'number', '○', 'quotations.statusがDRAFTの対象業者数')
                                @('incompleteVendorCount', 'number', '○', 'REGISTERED以上の見積が存在しない対象業者数')
                                @('incompleteItemCount', 'number', '○', 'No.20の見積登録確定条件を満たさない見積明細数')
                                @('allTargetVendorsRegistered', 'boolean', '○', '全対象業者で見積登録が完了している場合true')
                                @('canComplete', 'boolean', '○', '完了APIを実行可能な見積登録状態の場合true')
                            )
                        },
                        @{
                            Title = 'histories[]'
                            Headers = @('項目', '型', '必須', '説明')
                            Rows = @(
                                @('historyId', 'string', '○', '履歴ID')
                                @('fromStatus', 'string', '-', '変更前ステータス')
                                @('toStatus', 'string', '○', '変更後ステータス')
                                @('actedByUserId', 'string', '○', '操作ユーザーID')
                                @('actedByUserName', 'string', '○', '操作ユーザー名')
                                @('actedAt', 'string', '○', '操作日時')
                                @('comment', 'string', '-', 'コメント')
                            )
                        },
                        @{
                            Title = 'availableActions[]'
                            Headers = @('項目', '型', '必須', '説明')
                            Rows = @(
                                @('action', 'string', '○', 'START / OPEN_PROXY_WORK / RETURN / COMPLETE')
                                @('enabled', 'boolean', '○', '現在ユーザーが当該操作を実行可能な場合true')
                                @('reason', 'string', '-', 'enabled=falseの場合の理由')
                                @('href', 'string', '-', '画面遷移が必要な操作の遷移先。OPEN_PROXY_WORKの場合に設定する。')
                            )
                        }
                    )
                    StatusRows = @(
                        @('200', '取得成功', 'ShipProxyRequestDetailResponse')
                        @('401', '未認証', 'ErrorResponse')
                        @('403', 'SHIPユーザーでない、または対象施設へのship_proxy_task権限なし', 'ErrorResponse')
                        @('404', '依頼が存在しない', 'ErrorResponse')
                    )
                },
                @{
                    Title = '5.4 SHIP代理作業依頼担当取得'
                    Overview = 'SHIPユーザーが依頼を自分の担当として取得し、作業中状態へ遷移させる。'
                    Method = 'POST'
                    Path = '/quotation-data-box/ship-proxy-requests/{shipProxyRequestId}/start'
                    Auth = 'Bearer Token（SHIPユーザー + ship_proxy_task）'
                    ParametersTitle = 'パスパラメータ'
                    ParametersHeaders = @('項目', '型', '必須', '説明')
                    ParametersRows = @(
                        @('shipProxyRequestId', 'string', '○', 'SHIP代理作業依頼ID')
                    )
                    RequestTitle = 'リクエスト'
                    RequestHeaders = @('項目', '型', '必須', '説明')
                    RequestRows = @(
                        @('expectedUpdatedAt', 'string', '-', '画面表示時のupdated_at。指定時は一致しない場合409。')
                    )
                    PermissionLines = @(
                        'users.account_typeがSHIPであること。',
                        '対象依頼のrequesting_facility_idに対してship_proxy_taskの実効権限が成立すること。'
                    )
                    ProcessingLines = @(
                        '対象依頼を行ロック付きで取得する。',
                        'request_statusがREQUESTEDである場合、assigned_user_idにログインユーザーID、started_atに現在日時を設定し、IN_PROGRESSへ更新する。',
                        'request_statusがIN_PROGRESSかつassigned_user_idがログインユーザーIDの場合、再送として現在状態を返す。',
                        '他ユーザーが担当中、またはREQUESTED/IN_PROGRESS以外の場合は409を返す。',
                        '状態変更が発生した場合、ship_proxy_request_status_historiesへ履歴を追加する。'
                    )
                    ResponseTitle = 'レスポンス（200 OK）'
                    ResponseHeaders = @('項目', '型', '必須', '説明')
                    ResponseRows = @(
                        @('shipProxyRequestId', 'string', '○', 'SHIP代理作業依頼ID')
                        @('requestStatus', 'string', '○', 'IN_PROGRESS')
                        @('assignedUserId', 'string', '○', '担当SHIPユーザーID')
                        @('startedAt', 'string', '○', '開始日時')
                        @('updatedAt', 'string', '○', '最終更新日時')
                    )
                    StatusRows = @(
                        @('200', '担当取得成功、または同一担当者による再送', 'ShipProxyRequestStartResponse')
                        @('400', '入力形式不正', 'ErrorResponse')
                        @('401', '未認証', 'ErrorResponse')
                        @('403', 'SHIPユーザーでない、または対象施設へのship_proxy_task権限なし', 'ErrorResponse')
                        @('404', '依頼が存在しない', 'ErrorResponse')
                        @('409', '既に他ユーザーが担当中、状態不正、またはupdated_at不一致', 'ErrorResponse')
                    )
                },
                @{
                    Title = '5.5 SHIP代理作業依頼差戻し'
                    Overview = '担当SHIPユーザーが、代理作業を継続できない理由を登録して依頼を差し戻す。'
                    Method = 'POST'
                    Path = '/quotation-data-box/ship-proxy-requests/{shipProxyRequestId}/return'
                    Auth = 'Bearer Token（SHIPユーザー + ship_proxy_task）'
                    ParametersTitle = 'パスパラメータ'
                    ParametersHeaders = @('項目', '型', '必須', '説明')
                    ParametersRows = @(
                        @('shipProxyRequestId', 'string', '○', 'SHIP代理作業依頼ID')
                    )
                    RequestTitle = 'リクエスト'
                    RequestHeaders = @('項目', '型', '必須', '説明')
                    RequestRows = @(
                        @('returnReason', 'string', '○', '差戻し理由。1-1000文字。')
                        @('expectedUpdatedAt', 'string', '-', '画面表示時のupdated_at。指定時は一致しない場合409。')
                    )
                    PermissionLines = @(
                        'users.account_typeがSHIPであること。',
                        '対象依頼のrequesting_facility_idに対してship_proxy_taskの実効権限が成立すること。',
                        '対象依頼がログインユーザーに割り当てられたIN_PROGRESSであること。'
                    )
                    ProcessingLines = @(
                        '対象依頼を行ロック付きで取得する。',
                        'request_statusがIN_PROGRESSであり、assigned_user_idがログインユーザーIDであることを検証する。',
                        'return_reasonを更新し、request_statusをRETURNEDへ更新する。',
                        'ship_proxy_request_status_historiesへIN_PROGRESSからRETURNEDへの履歴を追加する。',
                        'rfqs.statusおよびrfq_vendors.request_statusは更新しない。'
                    )
                    ResponseTitle = 'レスポンス（200 OK）'
                    ResponseHeaders = @('項目', '型', '必須', '説明')
                    ResponseRows = @(
                        @('shipProxyRequestId', 'string', '○', 'SHIP代理作業依頼ID')
                        @('requestStatus', 'string', '○', 'RETURNED')
                        @('returnReason', 'string', '○', '差戻し理由')
                        @('updatedAt', 'string', '○', '最終更新日時')
                    )
                    StatusRows = @(
                        @('200', '差戻し成功', 'ShipProxyRequestReturnResponse')
                        @('400', '入力形式不正', 'ErrorResponse')
                        @('401', '未認証', 'ErrorResponse')
                        @('403', 'SHIPユーザーでない、対象施設へのship_proxy_task権限なし、または担当者不一致', 'ErrorResponse')
                        @('404', '依頼が存在しない', 'ErrorResponse')
                        @('409', '状態不正、またはupdated_at不一致', 'ErrorResponse')
                    )
                },
                @{
                    Title = '5.6 SHIP代理作業依頼完了'
                    Overview = '担当SHIPユーザーが代理作業完了を登録し、依頼と対象業者を完了状態へ更新する。'
                    Method = 'POST'
                    Path = '/quotation-data-box/ship-proxy-requests/{shipProxyRequestId}/complete'
                    Auth = 'Bearer Token（SHIPユーザー + ship_proxy_task）'
                    ParametersTitle = 'パスパラメータ'
                    ParametersHeaders = @('項目', '型', '必須', '説明')
                    ParametersRows = @(
                        @('shipProxyRequestId', 'string', '○', 'SHIP代理作業依頼ID')
                    )
                    RequestTitle = 'リクエスト'
                    RequestHeaders = @('項目', '型', '必須', '説明')
                    RequestRows = @(
                        @('completeNote', 'string', '-', '完了メモ。最大1000文字。')
                        @('expectedUpdatedAt', 'string', '-', '画面表示時のupdated_at。指定時は一致しない場合409。')
                    )
                    PermissionLines = @(
                        'users.account_typeがSHIPであること。',
                        '対象依頼のrequesting_facility_idに対してship_proxy_taskの実効権限が成立すること。',
                        '対象依頼がログインユーザーに割り当てられたIN_PROGRESSであること。'
                    )
                    ProcessingLines = @(
                        '対象依頼を行ロック付きで取得する。',
                        'request_statusがIN_PROGRESSであり、assigned_user_idがログインユーザーIDであることを検証する。',
                        '対象業者ごとにquotations.statusがREGISTEREDまたはORDER_SELECTEDの見積が存在し、かつ対象見積明細がNo.20の見積登録確定条件を満たすことを検証する。',
                        'ship_proxy_requests.request_statusをCOMPLETEDへ更新し、completed_atを設定する。',
                        'ship_proxy_request_vendors.target_statusをCOMPLETEDへ更新する。',
                        'ship_proxy_request_status_historiesへIN_PROGRESSからCOMPLETEDへの履歴を追加する。',
                        'rfqs.statusを発注用見積依頼済へ更新する。',
                        'rfq_vendors.request_statusは外部送信状態であるため更新しない。'
                    )
                    ResponseTitle = 'レスポンス（200 OK）'
                    ResponseHeaders = @('項目', '型', '必須', '説明')
                    ResponseRows = @(
                        @('shipProxyRequestId', 'string', '○', 'SHIP代理作業依頼ID')
                        @('requestStatus', 'string', '○', 'COMPLETED')
                        @('rfqId', 'string', '○', '対象RFQ ID')
                        @('rfqStatus', 'string', '○', '更新後RFQステータス。発注用見積依頼済')
                        @('completedAt', 'string', '○', '完了日時')
                        @('updatedAt', 'string', '○', '最終更新日時')
                    )
                    StatusRows = @(
                        @('200', '完了成功', 'ShipProxyRequestCompleteResponse')
                        @('400', '入力形式不正', 'ErrorResponse')
                        @('401', '未認証', 'ErrorResponse')
                        @('403', 'SHIPユーザーでない、対象施設へのship_proxy_task権限なし、または担当者不一致', 'ErrorResponse')
                        @('404', '依頼が存在しない', 'ErrorResponse')
                        @('409', '状態不正、見積登録未完了、またはupdated_at不一致', 'ErrorResponse')
                    )
                },
                @{
                    Title = '5.7 SHIP代理作業依頼取消'
                    Overview = '病院ユーザーが、未完了のSHIP代理作業依頼を取消す。IN_PROGRESSの依頼はSHIPユーザーの差戻し後に取消可能とする。'
                    Method = 'POST'
                    Path = '/quotation-data-box/ship-proxy-requests/{shipProxyRequestId}/cancel'
                    Auth = 'Bearer Token（normal_ship_request）'
                    ParametersTitle = 'パスパラメータ'
                    ParametersHeaders = @('項目', '型', '必須', '説明')
                    ParametersRows = @(
                        @('shipProxyRequestId', 'string', '○', 'SHIP代理作業依頼ID')
                    )
                    RequestTitle = 'リクエスト'
                    RequestHeaders = @('項目', '型', '必須', '説明')
                    RequestRows = @(
                        @('cancelReason', 'string', '-', '取消理由。最大1000文字。')
                        @('expectedUpdatedAt', 'string', '-', '画面表示時のupdated_at。指定時は一致しない場合409。')
                    )
                    PermissionLines = @(
                        'ログイン済みであること。',
                        '選択中施設が対象依頼の依頼元施設と一致すること。',
                        '選択中施設でnormal_ship_requestの実効権限が成立すること。'
                    )
                    ProcessingLines = @(
                        '対象依頼を行ロック付きで取得する。',
                        'request_statusがREQUESTEDまたはRETURNEDであることを検証する。',
                        'ship_proxy_requests.request_statusをCANCELEDへ更新し、canceled_atを設定する。',
                        'ship_proxy_request_vendors.target_statusをCANCELEDへ更新する。',
                        'ship_proxy_request_status_historiesへ状態変更履歴を追加する。コメントにはcancelReasonを保存する。',
                        'rfqs.statusを見積DB登録済へ戻す。',
                        'rfq_vendors.request_statusは更新しない。'
                    )
                    ResponseTitle = 'レスポンス（200 OK）'
                    ResponseHeaders = @('項目', '型', '必須', '説明')
                    ResponseRows = @(
                        @('shipProxyRequestId', 'string', '○', 'SHIP代理作業依頼ID')
                        @('requestStatus', 'string', '○', 'CANCELED')
                        @('rfqId', 'string', '○', '対象RFQ ID')
                        @('rfqStatus', 'string', '○', '更新後RFQステータス。見積DB登録済')
                        @('canceledAt', 'string', '○', '取消日時')
                        @('updatedAt', 'string', '○', '最終更新日時')
                    )
                    StatusRows = @(
                        @('200', '取消成功', 'ShipProxyRequestCancelResponse')
                        @('400', '入力形式不正', 'ErrorResponse')
                        @('401', '未認証', 'ErrorResponse')
                        @('403', 'normal_ship_request権限なし、または施設不一致', 'ErrorResponse')
                        @('404', '依頼が存在しない', 'ErrorResponse')
                        @('409', '状態不正、またはupdated_at不一致', 'ErrorResponse')
                    )
                }
            )
        },
        @{
            Type = 'Heading1'
            Text = '第6章 業務ルール'
        },
        @{
            Type = 'Heading2'
            Text = '5.1 依頼対象業者の決定'
        },
        @{
            Type = 'Bullets'
            Items = @(
                '依頼作成APIは、対象RFQに紐づくrfq_vendorsのうちrequest_statusがDRAFTの業者のみを対象にする。',
                '画面から任意の業者IDリストは受け取らない。未送信業者だけを送る条件はサーバー側で一元判定する。',
                '対象業者が0件の場合、依頼作成は409で拒否する。',
                '依頼作成後にrfq_vendorsへ追加された業者は、既存SHIP代理作業依頼の対象には自動追加しない。必要な場合は既存依頼の取消後に再作成する。'
            )
        },
        @{
            Type = 'Heading2'
            Text = '5.2 再送・重複実行'
        },
        @{
            Type = 'Table'
            Title = '再送・重複実行ルール'
            Headers = @('操作', '扱い')
            Rows = @(
                @('依頼作成', 'Idempotency-Keyが同一で同一リクエストの場合は作成済み依頼を返す。キーなしで未完了依頼が存在する場合は409。')
                @('担当取得', '同一担当者がIN_PROGRESS状態の依頼に再送した場合は現在状態を返す。他担当者の場合は409。')
                @('差戻し', 'RETURNED後の再送は409。ただし同一Idempotency-Keyの再送は初回結果を返す。')
                @('完了', 'COMPLETED後の再送は409。ただし同一Idempotency-Keyの再送は初回結果を返す。')
                @('取消', 'CANCELED後の再送は409。ただし同一Idempotency-Keyの再送は初回結果を返す。')
            )
        },
        @{
            Type = 'Heading2'
            Text = '5.3 一覧スコープ'
        },
        @{
            Type = 'Bullets'
            Items = @(
                'SHIP依頼一覧へボタンは、SHIPユーザーかつship_proxy_taskの実効権限が成立するユーザーにのみ施設選択画面で表示する。',
                '一覧APIは画面上で選択された施設ではなく、ship_proxy_taskの実効権限が成立する施設集合をスコープにする。',
                'requestingFacilityIdを指定した場合でも、指定施設がスコープ外であれば403ではなく0件を返す。存在有無の推測を避けるためである。',
                '詳細・状態更新APIは対象依頼がスコープ外の場合、404ではなく403を返す。'
            )
        },
        @{
            Type = 'Heading2'
            Text = '5.4 完了判定'
        },
        @{
            Type = 'Bullets'
            Items = @(
                '完了APIは、依頼対象業者ごとにquotations.statusがREGISTEREDまたはORDER_SELECTEDの見積が存在し、対象見積明細が業務上完了している場合のみ成功する。',
                '対象見積明細の登録区分、品目紐づけ、申請明細紐づけ等の確定条件は、見積登録・見積管理APIの仕様に準拠する。',
                '完了条件を満たさない場合、QUOTATION_REGISTRATION_INCOMPLETEを409で返す。',
                '完了成功時はrfqs.statusを発注用見積依頼済へ更新する。'
            )
        },
        @{
            Type = 'Heading1'
            Text = '第7章 エラーコード'
        },
        @{
            Type = 'Table'
            Title = 'エラーコード一覧'
            Headers = @('HTTP', 'code', '説明')
            Rows = @(
                @('400', 'VALIDATION_ERROR', '入力値が不正。')
                @('401', 'AUTH_REQUIRED', '認証が必要。')
                @('403', 'FORBIDDEN', '操作権限がない。')
                @('403', 'ACCOUNT_TYPE_INVALID', 'SHIPユーザーでないため操作できない。')
                @('404', 'RFQ_NOT_FOUND', '対象RFQが存在しない。')
                @('404', 'SHIP_PROXY_REQUEST_NOT_FOUND', '対象依頼が存在しない。')
                @('409', 'RFQ_STATUS_INVALID', '対象RFQのステータスが操作可能状態ではない。')
                @('409', 'NO_DRAFT_VENDOR', '依頼対象となる未送信業者が存在しない。')
                @('409', 'ACTIVE_PROXY_REQUEST_EXISTS', '同一RFQに未完了のSHIP代理作業依頼が存在する。')
                @('409', 'PROXY_REQUEST_STATUS_INVALID', '対象依頼のステータスが操作可能状態ではない。')
                @('409', 'PROXY_REQUEST_ASSIGNED_TO_OTHER', '対象依頼は他ユーザーが担当中。')
                @('409', 'QUOTATION_REGISTRATION_INCOMPLETE', '見積登録・マスタ紐づけが完了していない。')
                @('409', 'CONFLICT_UPDATED_AT', '画面表示時点から対象データが更新されている。')
                @('409', 'IDEMPOTENCY_KEY_CONFLICT', '同一Idempotency-Keyで異なるリクエストが送信された。')
                @('500', 'INTERNAL_ERROR', '想定外エラー。')
            )
        },
        @{
            Type = 'Heading1'
            Text = '第8章 監査・ログ'
        },
        @{
            Type = 'Bullets'
            Items = @(
                '依頼作成、担当取得、差戻し、完了、取消の各操作では、ship_proxy_request_status_historiesへ履歴を必ず登録する。',
                '履歴にはfrom_status、to_status、acted_by_user_id、acted_at、commentを保存する。',
                'アプリケーションログにはtraceId、操作ユーザーID、対象ship_proxy_request_id、HTTPステータス、エラーコードを出力する。',
                'リクエスト本文に含まれるメモ・理由は業務ログとして扱い、認証情報やトークンは記録しない。'
            )
        },
        @{
            Type = 'Heading1'
            Text = '第9章 補足'
        },
        @{
            Type = 'Bullets'
            Items = @(
                '本書ではship_proxy_taskを閲覧・作業共通の機能コードとして扱う。ship_proxy_task_viewとship_proxy_task_workの分離は行わない。',
                '専用SHIPユーザーは新設しない。病院ユーザー、SHIPユーザーともログイン後は/facility-selectへ遷移し、SHIPユーザーかつship_proxy_taskの実効権限が成立する場合のみ「SHIP依頼一覧へ」ボタンを表示する。',
                '「SHIP依頼一覧へ」押下時は、施設選択ボタンで施設が選択済みかどうかにかかわらずSHIP代理作業依頼一覧へ遷移する。',
                'ユーザー管理では、SHIPユーザーの新規作成・変更時のみship_proxy_taskを設定候補として表示・保存可能にする。非SHIPユーザーでは表示しない、または保存時に拒否する。'
            )
        }
    )
}
