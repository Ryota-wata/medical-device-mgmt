$raw = @{
  DocTitle = 'API設計書_購入管理タブ'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\作成済み\API設計書_購入管理タブ.docx'
  CoverDate = '2026年5月14日'
  Revision = '2026/5/14 親設計書方針見直し'
  ScreenLabel = '購入管理タブ'
  Sections = @(
    @{
      Heading = '1. 概要'
      Paragraphs = @(
        '本書は、タスク管理の購入管理タブを親業務単位とし、申請受付一覧、見積（発注）グループ一覧、および見積（発注）グループ一覧の操作ボタンから遷移する通常購入フローの画面で使用するAPI設計を定義する。',
        '親設計書としての対象範囲は、起票済み購入申請の受付・詳細参照・却下、購入管理タブ起点の編集リスト取り込み/通常購入RFQグループ作成、見積（発注）グループ一覧、RFQグループ詳細、依頼先業者の保存、依頼書プレビュー、個別見積依頼送信、見積ファイル登録、見積登録/発注見積登録、発注登録、納品日登録、検収登録、資産登録、RFQグループ削除である。',
        '資産一覧画面から実行できる新規購入/増設購入/更新購入申請の起票APIはNo.16「資産申請起票」で定義し、本書には含めない。本書は起票済み購入申請を購入管理タブで受け付けた後の進行管理を対象とする。',
        'SHIP代理作業依頼の作成・一覧・担当取得・差戻し・完了・取消はNo.19a「API設計書_SHIP代理作業依頼」で定義済みのため、本書では重複定義しない。購入管理タブ/RFQ画面からSHIPへ依頼する場合は、No.19aのAPIを呼び出す。',
        'リモデル申請画面内の編集リスト本体・明細操作およびリモデル管理タブ起点の後続進行はNo.17「リモデル管理タブ」で定義する。購入管理タブ起点の購入申請取り込み、通常購入RFQグループ作成導線、通常購入フローの見積登録から資産登録までは本書の拡張改訂で内包する。'
      )
      Tables = @(
        @{
          Title = '対象画面'
          Columns = @('画面ID', '画面名', '主なAPI用途')
          Rows = @(
            @('51', '/quotation-data-box/purchase-management', '購入申請受付、通常購入RFQグループの進捗一覧、ステータス別画面への遷移'),
            @('60', '/quotation-data-box/rfq-process', 'RFQグループ詳細、業者保存、個別送信、依頼書プレビュー、見積ファイル登録、RFQ削除'),
            @('24/44/47/50/54/59', '見積登録関連画面', '購入管理タブ起点の見積登録/発注見積登録'),
            @('25', '/quotation-data-box/order-registration', '購入管理タブ起点の発注登録'),
            @('26', '/quotation-data-box/inspection-registration', '購入管理タブ起点の納品日登録/検収準備'),
            @('27', '/quotation-data-box/asset-provisional-registration', '購入管理タブ起点の検収登録'),
            @('27a', '/quotation-data-box/asset-registration', '購入管理タブ起点の資産登録')
          )
        },
        @{
          Title = '本書で扱わない関連機能'
          Columns = @('機能', '定義先', '本書での扱い')
          Rows = @(
            @('SHIP代理作業依頼', 'No.19a API設計書_SHIP代理作業依頼', 'RFQ画面上の依頼ボタンはNo.19a APIを呼び出す。認可コードnormal_ship_requestもNo.19aで定義する。'),
            @('資産一覧起点の購入申請起票', 'No.16 資産申請起票', '新規購入/増設購入/更新購入申請の起票はNo.16で扱い、本書は起票後の受付以降を扱う。'),
            @('リモデル管理タブ', 'No.17 リモデル管理タブ', 'リモデル申請画面内の編集リスト本体・明細操作、リモデル管理タブ一覧、リモデル起点の後続進行はNo.17で扱う。'),
            @('見積管理の横断一覧・Phase2 OCRジョブ管理', 'No.20 見積登録・見積管理', '購入管理タブ起点の見積登録/発注見積登録は本書に内包し、横断一覧やPhase2共通化が必要な場合はNo.20で扱う。')
          )
        }
      )
    },
    @{
      Heading = '2. 共通仕様'
      Paragraphs = @(
        '全APIはHTTPS + JSONを使用する。文字コードはUTF-8、日時はISO 8601形式、日付はYYYY-MM-DD形式で返却する。',
        '認証はBearerトークンを必須とする。認可は施設スコープ、SHIP/病院ユーザー種別、ユーザー別機能コードを組み合わせて判定する。',
        'facilityIdを明示指定するAPIでは、ログインユーザーが当該施設を担当施設として参照でき、かつ対象機能コードが有効であることをサーバー側で検証する。facilityId省略時はセッションの選択中施設を既定値とする。',
        '一覧APIはlimit/cursor方式のページングを使用する。limitの既定値は50、最大値は200とする。',
        'POST/PUT/DELETE APIは、二重送信抑止のためIdempotency-KeyまたはexpectedUpdatedAtを受け付ける。競合を検出した場合は409を返却する。',
        'RFQはrfqsをグループの正とし、rfq_vendorsを依頼先業者の正とする。APIレスポンスでは画面表示に合わせて業者行へ展開するが、rfqsを業者数分複製して登録してはならない。'
      )
      Tables = @(
        @{
          Title = '機能コードとAPI範囲'
          Columns = @('機能コード', '対象', '許可される主な操作')
          Rows = @(
            @('normal_purchase', '通常購入管理', '購入申請一覧・詳細・却下、購入管理タブ起点の編集リスト取り込み、通常購入RFQ作成、RFQ詳細、業者保存、個別送信、見積登録までを扱う。'),
            @('normal_order / normal_acceptance', '通常購入の後続ステップ', '購入管理タブのRFQ進捗一覧参照、発注登録、納品日登録、検収登録、資産登録の実行可否判定に利用する。'),
            @('normal_ship_request', 'SHIP代理作業依頼', '本書対象外。No.19aのAPIで作成・一覧・担当取得・差戻し・完了・取消を扱う。')
          )
        },
        @{
          Title = 'RFQステータス区分'
          Columns = @('画面タブ', '対象ステータス', '備考')
          Rows = @(
            @('すべて', '完了、申請を見送るを除く全ステータス', '購入管理タブの既定表示。'),
            @('1 見積依頼/登録', '見積依頼、見積依頼済、見積DB登録済', 'RFQプロセス、業者送信、見積ファイル登録の主対象。'),
            @('2 発注見積依頼', '見積登録依頼中、発注用見積依頼済', '購入管理タブ起点の発注見積登録APIとして本書に内包する。'),
            @('3 発注登録', '発注見積登録済', '購入管理タブ起点の発注登録APIとして本書に内包する。'),
            @('4 納品日登録', '発注済', '購入管理タブ起点の納品日登録APIとして本書に内包する。'),
            @('5 検収登録', '納期確定', '購入管理タブ起点の検収登録APIとして本書に内包する。'),
            @('6 資産登録', '検収済', '購入管理タブ起点の資産登録APIとして本書に内包する。')
          )
        },
        @{
          Title = '主な参照・更新テーブル'
          Columns = @('用途', 'テーブル/ビュー', '利用内容')
          Rows = @(
            @('購入申請参照', 'purchase_applications, applications, application_assets, application_documents', '申請受付一覧・詳細、添付ファイル、申請対象資産を返却する。'),
            @('購入申請却下', 'applications, application_status_histories', '申請ステータスを却下へ更新し、履歴を登録する。'),
            @('RFQグループ参照', 'rfqs, rfq_applications, rfq_vendors, edit_lists, edit_list_items', 'RFQ一覧・詳細・対象明細・依頼先業者を返却する。'),
            @('見積関連参照/更新', 'quotations, quotation_items', 'RFQ一覧の見積登録状況、見積登録/発注見積登録、後続ステップ遷移可否を判定する。'),
            @('発注・検収・資産登録', 'orders, order_items, individuals, asset_ledgers', '購入管理タブ起点の発注登録、納品日登録、検収登録、資産登録を実行する。'),
            @('見積ファイル登録', 'application_documents', 'RFQまたはRFQ業者に紐づく見積書ファイルのメタデータを登録する。')
          )
        }
      )
    },
    @{
      Heading = '3. API一覧'
      Paragraphs = @('現行初版でAPI詳細化済みの範囲は以下の10件である。購入管理タブ親設計書としての拡張改訂では、購入管理タブ起点の編集リスト取り込み、通常購入RFQグループ作成、見積登録/発注見積登録、発注登録、納品日登録、検収登録、資産登録のAPI詳細を本書へ追加する。')
      Tables = @(
        @{
          Title = 'API一覧'
          Columns = @('No.', 'メソッド', 'パス', '概要')
          Rows = @(
            @('19-01', 'GET', '/purchase-applications', '購入申請受付一覧を取得する。'),
            @('19-02', 'GET', '/purchase-applications/{purchaseApplicationId}', '購入申請詳細を取得する。'),
            @('19-03', 'POST', '/purchase-applications/{purchaseApplicationId}/reject', '購入申請を却下する。'),
            @('19-04', 'GET', '/quotation-data-box/rfq-groups', '購入管理タブのRFQグループ一覧を取得する。'),
            @('19-05', 'GET', '/quotation-data-box/rfq-groups/{rfqGroupId}', 'RFQグループ詳細を取得する。'),
            @('19-06', 'PUT', '/quotation-data-box/rfq-groups/{rfqGroupId}/vendors', 'RFQ依頼先業者を保存する。'),
            @('19-07', 'GET', '/quotation-data-box/rfq-groups/{rfqGroupId}/preview', '見積依頼書プレビューを取得する。'),
            @('19-08', 'POST', '/quotation-data-box/rfq-groups/{rfqGroupId}/vendors/{rfqVendorId}/send', 'RFQを業者へ個別送信する。'),
            @('19-09', 'POST', '/quotation-data-box/rfq-groups/{rfqGroupId}/quotation-files', 'RFQに見積ファイルを登録する。'),
            @('19-10', 'DELETE', '/quotation-data-box/rfq-groups/{rfqGroupId}', '未送信RFQグループを削除する。')
          )
        }
      )
    },
    @{
      Heading = '4. 業務ルール'
      Paragraphs = @(
        '購入申請の却下は、application_typeがPURCHASE、かつstatusが申請中の申請に限定する。却下後に再受付するAPIは本書では定義しない。',
        'RFQ一覧はrfqsを1グループとして取得し、rfq_vendorsを表示行へ展開する。依頼先業者が未登録の場合もRFQグループ単位の1行を返却し、業者未設定状態を画面で表示できるようにする。',
        'RFQ個別送信はrfq_vendors.request_statusがDRAFTの業者行に限定する。送信時にrfq_vendors.request_statusをSENTへ更新し、requested_at、requested_by_user_idを設定する。rfqs.statusは見積依頼から見積依頼済へ進める。',
        'SHIP代理作業依頼は外部送信ではなく、SHIPユーザーへの内部代理作業依頼である。RFQ個別送信とは状態更新対象が異なり、SHIP代理作業依頼の作成ではrfq_vendors.request_statusをSENTへ変更しない。',
        '見積ファイル登録APIは、ファイル実体がアップロード済みであることを前提にメタデータをapplication_documentsへ登録する。購入管理タブ起点の見積明細登録、発注見積登録、発注登録、納品日登録、検収登録、資産登録は本書の親設計書範囲に含める。OCRジョブ管理などPhase2共通化が必要な処理のみNo.20で扱う。',
        'RFQ削除は未送信・未処理のRFQに限定する。送信済み業者、見積、注文、SHIP代理作業依頼、またはRFQ配下ドキュメントが存在する場合は削除不可とする。'
      )
    }
  )
  Endpoints = @(
    @{
      Id = '19-01'
      Name = '購入申請受付一覧取得API'
      Method = 'GET'
      Path = '/purchase-applications'
      Summary = '購入管理タブの申請受付エリアに表示する購入申請一覧を取得する。'
      Auth = 'Bearer必須。対象施設でnormal_purchaseが有効なユーザーのみ実行可能。facilityId指定時は担当施設かつ機能コード有効を検証する。'
      RequestTables = @(
        @{
          Title = 'クエリパラメータ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('facilityId', 'int64', '任意', '対象施設ID。省略時は選択中施設。'),
            @('status', 'string', '任意', '申請ステータス。既定値は申請中。'),
            @('keyword', 'string', '任意', '申請番号、申請者名、代表品目名の部分一致。'),
            @('departmentName', 'string', '任意', '申請部署名。purchase_applications.department_nameの完全一致。'),
            @('sectionName', 'string', '任意', '申請部門名。purchase_applications.section_nameの完全一致。'),
            @('requestedOnFrom', 'date', '任意', '申請日From。'),
            @('requestedOnTo', 'date', '任意', '申請日To。'),
            @('limit', 'number', '任意', '取得件数。既定50、最大200。'),
            @('cursor', 'string', '任意', '次ページ取得カーソル。')
          )
        }
      )
      ResponseTables = @(
        @{
          Title = 'レスポンス'
          Columns = @('項目', '型', '説明')
          Rows = @(
            @('items[].purchaseApplicationId', 'int64', '購入申請ID。purchase_applications.purchase_application_id。'),
            @('items[].applicationNo', 'string', '申請番号。'),
            @('items[].status', 'string', '申請ステータス。'),
            @('items[].requestedOn', 'date', '申請日。'),
            @('items[].requestedByName', 'string', '申請者名。'),
            @('items[].departmentName', 'string', '部署名。'),
            @('items[].sectionName', 'string', '部門名。'),
            @('items[].representativeItemName', 'string', '代表品目名。'),
            @('items[].desiredDeliveryOn', 'date|null', '希望納期。'),
            @('items[].priority', 'string|null', '優先度。'),
            @('items[].assetCount', 'number', '申請資産数。assets_jsonから算出。'),
            @('items[].editListId', 'int64|null', '編集リストID。'),
            @('items[].rfqGroupIds', 'int64[]', '紐づくRFQグループID一覧。'),
            @('nextCursor', 'string|null', '次ページカーソル。')
          )
        }
      )
      Process = @(
        'facilityId、status、検索条件を検証する。',
        'purchase_applicationsビューを施設・ステータス・検索条件で絞り込む。',
        'requested_on降順、application_no降順で取得し、limit + 1件で次ページ有無を判定する。',
        'assets_json、rfq_group_ids_jsonをAPIレスポンスの配列へ整形して返却する。'
      )
      Errors = @(
        @('400', 'VALIDATION_ERROR', 'クエリパラメータが不正。'),
        @('401', 'AUTH_REQUIRED', '未認証。'),
        @('403', 'FORBIDDEN', '対象施設のnormal_purchase権限がない。')
      )
    },
    @{
      Id = '19-02'
      Name = '購入申請詳細取得API'
      Method = 'GET'
      Path = '/purchase-applications/{purchaseApplicationId}'
      Summary = '購入申請の詳細、申請資産、添付ファイル、RFQ紐づけ情報を取得する。'
      Auth = 'Bearer必須。対象施設でnormal_purchaseが有効なユーザーのみ実行可能。'
      RequestTables = @(
        @{
          Title = 'パスパラメータ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('purchaseApplicationId', 'int64', '必須', '購入申請ID。')
          )
        }
      )
      ResponseTables = @(
        @{
          Title = 'レスポンス'
          Columns = @('項目', '型', '説明')
          Rows = @(
            @('application.purchaseApplicationId', 'int64', '購入申請ID。'),
            @('application.applicationNo', 'string', '申請番号。'),
            @('application.status', 'string', '申請ステータス。'),
            @('application.purchaseType', 'string', '購入区分。'),
            @('application.requestedByName', 'string', '申請者名。'),
            @('application.requestedByContact', 'string|null', '申請者連絡先。'),
            @('application.usagePurpose', 'string|null', '使用目的。'),
            @('application.requestComment', 'string|null', '申請コメント。'),
            @('assets[].applicationAssetId', 'int64', '申請資産ID。'),
            @('assets[].itemName', 'string', '品目名。'),
            @('assets[].quantity', 'number', '数量。'),
            @('assets[].buildingName', 'string|null', '建物名。'),
            @('assets[].floorName', 'string|null', '階数。'),
            @('assets[].roomName', 'string|null', '部屋名。'),
            @('attachedFiles[].documentId', 'int64', '添付ファイルID。'),
            @('attachedFiles[].fileName', 'string', 'ファイル名。'),
            @('rfqLinks[].rfqGroupId', 'int64', '紐づくRFQグループID。'),
            @('rfqLinks[].rfqNo', 'string', 'RFQ番号。'),
            @('rfqLinks[].status', 'string', 'RFQステータス。')
          )
        }
      )
      Process = @(
        'purchase_applicationsビューから対象申請を取得する。',
        'applications.application_typeがPURCHASEであること、施設スコープ内であることを確認する。',
        'application_assets、application_documents、rfq_applications、rfqsを取得して詳細レスポンスへ整形する。'
      )
      Errors = @(
        @('401', 'AUTH_REQUIRED', '未認証。'),
        @('403', 'FORBIDDEN', '対象施設のnormal_purchase権限がない。'),
        @('404', 'PURCHASE_APPLICATION_NOT_FOUND', '購入申請が存在しない、または参照できない。')
      )
    },
    @{
      Id = '19-03'
      Name = '購入申請却下API'
      Method = 'POST'
      Path = '/purchase-applications/{purchaseApplicationId}/reject'
      Summary = '申請中の購入申請を却下し、ステータス履歴を登録する。'
      Auth = 'Bearer必須。対象施設でnormal_purchaseが有効なユーザーのみ実行可能。'
      RequestTables = @(
        @{
          Title = 'パスパラメータ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('purchaseApplicationId', 'int64', '必須', '購入申請ID。')
          )
        },
        @{
          Title = 'リクエストボディ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('rejectReason', 'string', '任意', '却下理由。Phase1では任意。最大1000文字。'),
            @('expectedUpdatedAt', 'datetime', '任意', '画面表示時のapplications.updated_at。競合検出に使用する。')
          )
        }
      )
      ResponseTables = @(
        @{
          Title = 'レスポンス'
          Columns = @('項目', '型', '説明')
          Rows = @(
            @('purchaseApplicationId', 'int64', '購入申請ID。'),
            @('status', 'string', '却下。'),
            @('rejectedAt', 'datetime', '却下日時。'),
            @('rejectedByUserId', 'int64', '却下実行ユーザーID。'),
            @('historyId', 'int64', '登録したapplication_status_historiesのID。')
          )
        }
      )
      Process = @(
        'Idempotency-Keyが指定されている場合は二重実行を検査する。',
        'applicationsを行ロックして取得し、application_typeがPURCHASE、statusが申請中であることを確認する。',
        'expectedUpdatedAt指定時はapplications.updated_atと一致することを確認する。',
        'applications.statusを却下へ更新し、却下者・却下日時を保存する。',
        'application_status_historiesへ申請中から却下への履歴を登録し、却下理由はcommentへ保存する。',
        'トランザクションをコミットし、更新後ステータスを返却する。'
      )
      Errors = @(
        @('400', 'VALIDATION_ERROR', '却下理由などの入力値が不正。'),
        @('401', 'AUTH_REQUIRED', '未認証。'),
        @('403', 'FORBIDDEN', '対象施設のnormal_purchase権限がない。'),
        @('404', 'PURCHASE_APPLICATION_NOT_FOUND', '購入申請が存在しない、または参照できない。'),
        @('409', 'CONFLICT_UPDATED_AT', '申請が他ユーザーにより更新されている。'),
        @('409', 'PURCHASE_APPLICATION_STATUS_INVALID', '申請中ではないため却下できない。')
      )
    },
    @{
      Id = '19-04'
      Name = 'RFQグループ一覧取得API'
      Method = 'GET'
      Path = '/quotation-data-box/rfq-groups'
      Summary = '購入管理タブの見積（発注）グループ一覧を取得する。'
      Auth = 'Bearer必須。managementTypeはPURCHASEのみを対象とし、normal_purchase/normal_order/normal_acceptanceのいずれかが対象施設で有効であること。REMODELはNo.17「リモデル管理タブ」で扱う。'
      RequestTables = @(
        @{
          Title = 'クエリパラメータ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('facilityId', 'int64', '任意', '対象施設ID。省略時は選択中施設。'),
            @('managementType', 'enum', '任意', 'PURCHASE。省略時はPURCHASEとして扱う。REMODELはNo.17「リモデル管理タブ」で扱う。'),
            @('step', 'enum', '任意', 'ALL, QUOTATION, ORDER_QUOTATION, ORDER, DELIVERY_DATE, ACCEPTANCE, ASSET_REGISTRATION。既定ALL。'),
            @('status', 'string', '任意', 'RFQステータスを直接指定する場合に使用。'),
            @('editListId', 'int64', '任意', '編集リストID。'),
            @('keyword', 'string', '任意', 'RFQ番号、RFQグループ名、業者名、品目名の部分一致。'),
            @('limit', 'number', '任意', '取得件数。既定50、最大200。'),
            @('cursor', 'string', '任意', '次ページ取得カーソル。')
          )
        }
      )
      ResponseTables = @(
        @{
          Title = 'レスポンス'
          Columns = @('項目', '型', '説明')
          Rows = @(
            @('items[].rfqGroupId', 'int64', 'RFQグループID。rfqs.rfq_id。'),
            @('items[].rfqNo', 'string', 'RFQ番号。'),
            @('items[].rfqGroupName', 'string', 'RFQグループ名。'),
            @('items[].status', 'string', 'RFQステータス。'),
            @('items[].editListId', 'int64|null', '編集リストID。'),
            @('items[].editListName', 'string|null', '編集リスト名。'),
            @('items[].rfqVendorId', 'int64|null', '依頼先業者ID。未設定時はnull。'),
            @('items[].vendorName', 'string|null', '依頼先業者名。'),
            @('items[].requestStatus', 'string|null', '業者依頼ステータス。DRAFT/SENT/REPLIED/CANCELED。'),
            @('items[].dueOn', 'date|null', '見積回答期限。'),
            @('items[].requestedAt', 'datetime|null', '個別依頼送信日時。'),
            @('items[].quotationRegistered', 'boolean', '見積DB登録済みか。'),
            @('items[].availableActions[]', 'string', '画面で有効化する操作。rfqProcess, shipProxyRequest, orderRegister等。'),
            @('tabCounts.all', 'number', 'すべてタブ件数。'),
            @('tabCounts.quotation', 'number', '見積依頼/登録タブ件数。'),
            @('tabCounts.orderQuotation', 'number', '発注見積依頼タブ件数。'),
            @('tabCounts.order', 'number', '発注登録タブ件数。'),
            @('tabCounts.deliveryDate', 'number', '納品日登録タブ件数。'),
            @('tabCounts.acceptance', 'number', '検収登録タブ件数。'),
            @('tabCounts.assetRegistration', 'number', '資産登録タブ件数。'),
            @('nextCursor', 'string|null', '次ページカーソル。')
          )
        }
      )
      Process = @(
        'managementTypeがPURCHASEまたは省略であることを確認し、通常購入系機能コードと施設スコープを検証する。',
        'step指定をRFQステータス条件へ変換する。ALLは完了、申請を見送るを除外する。',
        'rfqsを基点にrfq_vendors、edit_lists、rfq_applications、quotations、quotation_itemsを参照して一覧を取得する。',
        'rfq_vendorsが存在するRFQは業者行へ展開し、業者未設定のRFQはrfqVendorId=nullのグループ行として返却する。',
        '同一検索条件でステップ別件数を集計しtabCountsへ設定する。',
        'availableActionsはRFQステータス、業者依頼ステータス、ユーザー機能コードに基づいて算出する。SHIP代理作業依頼ボタンの実行可否はNo.19aのnormal_ship_request要件を参照する。'
      )
      Errors = @(
        @('400', 'VALIDATION_ERROR', 'managementType、step、日付などのクエリパラメータが不正。'),
        @('401', 'AUTH_REQUIRED', '未認証。'),
        @('403', 'FORBIDDEN', '対象施設または購入管理タブの機能権限がない。')
      )
    },
    @{
      Id = '19-05'
      Name = 'RFQグループ詳細取得API'
      Method = 'GET'
      Path = '/quotation-data-box/rfq-groups/{rfqGroupId}'
      Summary = 'RFQプロセス画面の初期表示に必要なRFQグループ、依頼先業者、対象明細、添付ドキュメントを取得する。'
      Auth = 'Bearer必須。通常購入RFQとしてnormal_purchaseが対象施設で有効であること。'
      RequestTables = @(
        @{
          Title = 'パスパラメータ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('rfqGroupId', 'int64', '必須', 'RFQグループID。rfqs.rfq_id。')
          )
        }
      )
      ResponseTables = @(
        @{
          Title = 'レスポンス'
          Columns = @('項目', '型', '説明')
          Rows = @(
            @('rfq.rfqGroupId', 'int64', 'RFQグループID。'),
            @('rfq.rfqNo', 'string', 'RFQ番号。'),
            @('rfq.rfqGroupName', 'string', 'RFQグループ名。'),
            @('rfq.status', 'string', 'RFQステータス。'),
            @('rfq.requestedOn', 'date|null', '依頼日。'),
            @('rfq.dueOn', 'date|null', 'グループ回答期限。'),
            @('rfq.remarks', 'string|null', '備考。'),
            @('vendors[].rfqVendorId', 'int64', 'RFQ業者ID。'),
            @('vendors[].vendorId', 'int64|null', '業者マスタID。'),
            @('vendors[].vendorName', 'string', '業者名。'),
            @('vendors[].contactPerson', 'string|null', '担当者名。'),
            @('vendors[].email', 'string|null', 'メールアドレス。'),
            @('vendors[].phone', 'string|null', '電話番号。'),
            @('vendors[].dueOn', 'date|null', '回答期限。'),
            @('vendors[].requestNote', 'string|null', '依頼メモ。'),
            @('vendors[].requestStatus', 'string', 'DRAFT/SENT/REPLIED/CANCELED。'),
            @('vendors[].requestedAt', 'datetime|null', '送信日時。'),
            @('editList.editListId', 'int64|null', '編集リストID。'),
            @('editList.editListName', 'string|null', '編集リスト名。'),
            @('items[].editListItemId', 'int64|null', '編集リスト明細ID。'),
            @('items[].applicationId', 'int64|null', '申請ID。'),
            @('items[].applicationAssetId', 'int64|null', '申請資産ID。'),
            @('items[].itemName', 'string', '品目名。'),
            @('items[].quantity', 'number', '数量。'),
            @('documents[].documentId', 'int64', 'RFQまたはRFQ業者に紐づくドキュメントID。'),
            @('documents[].ownerType', 'string', 'RFQまたはRFQ_VENDOR。'),
            @('availableActions[]', 'string', '保存、個別送信、SHIP代理依頼、見積登録へ等の操作可否。')
          )
        }
      )
      Process = @(
        'rfqsを取得し、通常購入RFQであること、施設スコープ、normal_purchase機能コードを検証する。',
        'rfq_vendors、rfq_applications、edit_lists、edit_list_items、applications、application_assetsを取得してRFQプロセス表示用に整形する。',
        'application_documentsからowner_typeがRFQまたはRFQ_VENDORのドキュメントを取得する。',
        'RFQステータス、業者依頼ステータス、機能コードからavailableActionsを算出する。SHIP代理依頼の詳細可否はNo.19aを参照する。'
      )
      Errors = @(
        @('401', 'AUTH_REQUIRED', '未認証。'),
        @('403', 'FORBIDDEN', '対象施設または対象RFQの購入管理権限がない。'),
        @('404', 'RFQ_GROUP_NOT_FOUND', 'RFQグループが存在しない、または参照できない。')
      )
    },
    @{
      Id = '19-06'
      Name = 'RFQ依頼先業者保存API'
      Method = 'PUT'
      Path = '/quotation-data-box/rfq-groups/{rfqGroupId}/vendors'
      Summary = 'RFQプロセス画面で編集した依頼先業者行を保存する。'
      Auth = 'Bearer必須。通常購入RFQとしてnormal_purchaseが対象施設で有効であること。'
      RequestTables = @(
        @{
          Title = 'パスパラメータ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('rfqGroupId', 'int64', '必須', 'RFQグループID。')
          )
        },
        @{
          Title = 'リクエストボディ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('vendors[].rfqVendorId', 'int64', '任意', '既存行更新時に指定。未指定時は新規追加。'),
            @('vendors[].vendorId', 'int64', '任意', '業者マスタID。自由入力業者の場合はnull。'),
            @('vendors[].vendorName', 'string', '必須', '業者名。最大255文字。'),
            @('vendors[].contactPerson', 'string', '任意', '担当者名。'),
            @('vendors[].email', 'string', '任意', 'メールアドレス。個別送信時は必須。'),
            @('vendors[].phone', 'string', '任意', '電話番号。'),
            @('vendors[].dueOn', 'date', '任意', '回答期限。個別送信時は必須。'),
            @('vendors[].requestNote', 'string', '任意', '依頼メモ。'),
            @('vendors[].isPrimaryVendor', 'boolean', '任意', '代表業者フラグ。'),
            @('deletedRfqVendorIds[]', 'int64', '任意', '削除対象のRFQ業者ID。DRAFTのみ削除可。'),
            @('expectedRfqUpdatedAt', 'datetime', '任意', '画面表示時のrfqs.updated_at。競合検出に使用する。')
          )
        }
      )
      ResponseTables = @(
        @{
          Title = 'レスポンス'
          Columns = @('項目', '型', '説明')
          Rows = @(
            @('rfqGroupId', 'int64', 'RFQグループID。'),
            @('updatedAt', 'datetime', '更新後のrfqs.updated_at。'),
            @('vendors[]', 'array', '保存後のRFQ業者一覧。項目は詳細取得APIのvendorsと同一。')
          )
        }
      )
      Process = @(
        'rfqsを行ロックして取得し、通常購入RFQであること、施設スコープ、normal_purchase権限を確認する。',
        'expectedRfqUpdatedAt指定時はrfqs.updated_atと一致することを確認する。',
        '既存rfq_vendorsのうちrequest_statusがDRAFTではない行は、業者情報更新・削除対象にできない。',
        'deletedRfqVendorIdsの各行がDRAFTであることを確認して削除する。',
        'vendors配列の既存行を更新し、新規行はrequest_status=DRAFTでrfq_vendorsへ登録する。',
        '保存後に有効な業者行が1件以上残ることを確認する。',
        'rfqs.updated_atを更新し、保存後の業者一覧を返却する。'
      )
      Errors = @(
        @('400', 'VALIDATION_ERROR', '業者名、メール形式、回答期限などの入力値が不正。'),
        @('401', 'AUTH_REQUIRED', '未認証。'),
        @('403', 'FORBIDDEN', '対象RFQの購入管理権限がない。'),
        @('404', 'RFQ_GROUP_NOT_FOUND', 'RFQグループが存在しない。'),
        @('404', 'RFQ_VENDOR_NOT_FOUND', '指定されたRFQ業者が存在しない。'),
        @('409', 'CONFLICT_UPDATED_AT', 'RFQが他ユーザーにより更新されている。'),
        @('409', 'RFQ_VENDOR_STATUS_INVALID', '送信済みまたは返信済み業者行は保存・削除できない。')
      )
    },
    @{
      Id = '19-07'
      Name = '見積依頼書プレビュー取得API'
      Method = 'GET'
      Path = '/quotation-data-box/rfq-groups/{rfqGroupId}/preview'
      Summary = 'RFQプロセス画面で見積依頼書のプレビュー表示に必要なデータを取得する。'
      Auth = 'Bearer必須。通常購入RFQとしてnormal_purchaseが対象施設で有効であること。'
      RequestTables = @(
        @{
          Title = 'パス/クエリパラメータ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('rfqGroupId', 'int64', '必須', 'RFQグループID。'),
            @('rfqVendorId', 'int64', '任意', 'プレビュー対象業者。省略時は代表業者、代表未設定時は先頭業者。')
          )
        }
      )
      ResponseTables = @(
        @{
          Title = 'レスポンス'
          Columns = @('項目', '型', '説明')
          Rows = @(
            @('rfq', 'object', 'RFQ番号、RFQグループ名、回答期限、備考。'),
            @('vendor', 'object|null', 'プレビュー対象業者情報。'),
            @('items[]', 'array', '依頼対象品目、数量、設置場所、申請情報。'),
            @('requestNote', 'string|null', '依頼メモ。'),
            @('previewHtml', 'string', '画面プレビュー用HTML。'),
            @('printData', 'object', 'PDF生成・印刷に利用できる構造化データ。')
          )
        }
      )
      Process = @(
        'RFQ詳細取得と同じ権限・施設スコープを検証する。',
        'rfqVendorId指定時は当該業者が対象RFQに属することを確認する。',
        'rfqs、rfq_vendors、rfq_applications、edit_list_items、applications、application_assetsからプレビュー情報を構築する。',
        '本APIはDB更新を行わない。依頼書ファイルの保存が必要な場合は、生成後に見積ファイル登録APIまたは別紙ドキュメント登録APIを使用する。'
      )
      Errors = @(
        @('401', 'AUTH_REQUIRED', '未認証。'),
        @('403', 'FORBIDDEN', '対象RFQの購入管理権限がない。'),
        @('404', 'RFQ_GROUP_NOT_FOUND', 'RFQグループが存在しない。'),
        @('404', 'RFQ_VENDOR_NOT_FOUND', '指定されたRFQ業者が存在しない。')
      )
    },
    @{
      Id = '19-08'
      Name = 'RFQ個別送信API'
      Method = 'POST'
      Path = '/quotation-data-box/rfq-groups/{rfqGroupId}/vendors/{rfqVendorId}/send'
      Summary = '指定したRFQ業者へ見積依頼を個別送信し、業者依頼ステータスを送信済みに更新する。'
      Auth = 'Bearer必須。通常購入RFQとしてnormal_purchaseが対象施設で有効であること。'
      RequestTables = @(
        @{
          Title = 'パスパラメータ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('rfqGroupId', 'int64', '必須', 'RFQグループID。'),
            @('rfqVendorId', 'int64', '必須', 'RFQ業者ID。')
          )
        },
        @{
          Title = 'リクエストボディ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('email', 'string', '任意', '送信先メールアドレス。指定時はrfq_vendors.emailへ反映する。未指定時は既存値を使用する。'),
            @('dueOn', 'date', '任意', '回答期限。指定時はrfq_vendors.due_onへ反映する。未指定時は既存値を使用する。'),
            @('requestNote', 'string', '任意', '依頼メモ。指定時はrfq_vendors.request_noteへ反映する。'),
            @('expectedVendorUpdatedAt', 'datetime', '任意', '画面表示時のrfq_vendors.updated_at。競合検出に使用する。')
          )
        }
      )
      ResponseTables = @(
        @{
          Title = 'レスポンス'
          Columns = @('項目', '型', '説明')
          Rows = @(
            @('rfqGroupId', 'int64', 'RFQグループID。'),
            @('rfqStatus', 'string', '更新後のRFQステータス。通常は見積依頼済。'),
            @('rfqVendorId', 'int64', 'RFQ業者ID。'),
            @('requestStatus', 'string', 'SENT。'),
            @('requestedAt', 'datetime', '送信日時。'),
            @('requestedByUserId', 'int64', '送信実行ユーザーID。')
          )
        }
      )
      Process = @(
        'Idempotency-Keyが指定されている場合は二重実行を検査する。',
        'rfqs、rfq_vendorsを行ロックして取得し、対象RFQに属する業者であることを確認する。',
        'RFQステータスが見積依頼または見積依頼済であること、rfq_vendors.request_statusがDRAFTであることを確認する。',
        '送信先メールアドレス、回答期限、業者名が設定されていることを確認する。',
        'メール送信または外部送信キュー登録を行う。同期で送信可否のみ判定し、再送要件はDRAFTからの初回送信に限定する。',
        'rfq_vendors.request_statusをSENTへ更新し、requested_at、requested_by_user_idを設定する。',
        'rfqs.statusが見積依頼の場合は見積依頼済へ更新する。既に見積依頼済の場合は維持する。',
        '更新結果を返却する。'
      )
      Errors = @(
        @('400', 'VALIDATION_ERROR', 'メールアドレス、回答期限などの入力値が不正。'),
        @('401', 'AUTH_REQUIRED', '未認証。'),
        @('403', 'FORBIDDEN', '対象RFQの購入管理権限がない。'),
        @('404', 'RFQ_GROUP_NOT_FOUND', 'RFQグループが存在しない。'),
        @('404', 'RFQ_VENDOR_NOT_FOUND', 'RFQ業者が存在しない。'),
        @('409', 'CONFLICT_UPDATED_AT', 'RFQ業者行が他ユーザーにより更新されている。'),
        @('409', 'RFQ_STATUS_INVALID', '現在のRFQステータスでは個別送信できない。'),
        @('409', 'RFQ_VENDOR_STATUS_INVALID', 'DRAFTではない業者行は送信できない。')
      )
    },
    @{
      Id = '19-09'
      Name = 'RFQ見積ファイル登録API'
      Method = 'POST'
      Path = '/quotation-data-box/rfq-groups/{rfqGroupId}/quotation-files'
      Summary = 'RFQまたはRFQ業者に紐づく見積書ファイルのメタデータを登録する。'
      Auth = 'Bearer必須。通常購入RFQとしてnormal_purchaseが対象施設で有効であること。'
      RequestTables = @(
        @{
          Title = 'パスパラメータ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('rfqGroupId', 'int64', '必須', 'RFQグループID。')
          )
        },
        @{
          Title = 'リクエストボディ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('rfqVendorId', 'int64', '任意', '業者別見積として登録する場合に指定。未指定時はRFQグループ添付。'),
            @('files[].fileName', 'string', '必須', '表示ファイル名。'),
            @('files[].filePath', 'string', '必須', 'ストレージ上のファイルパスまたはオブジェクトキー。'),
            @('files[].mimeType', 'string', '必須', 'MIME Type。PDF、Excelを許可する。'),
            @('files[].fileSize', 'number', '必須', 'ファイルサイズ。'),
            @('files[].contentHash', 'string', '任意', '重複検出用ハッシュ。'),
            @('files[].storageFormat', 'string', '任意', '保存形式。既定はBLOBまたはOBJECT_STORAGE。'),
            @('files[].documentDate', 'date', '任意', '見積書日付。'),
            @('files[].title', 'string', '任意', 'ドキュメントタイトル。')
          )
        }
      )
      ResponseTables = @(
        @{
          Title = 'レスポンス'
          Columns = @('項目', '型', '説明')
          Rows = @(
            @('documents[].documentId', 'int64', '登録したapplication_documents.document_id。'),
            @('documents[].ownerType', 'string', 'RFQまたはRFQ_VENDOR。'),
            @('documents[].rfqGroupId', 'int64', 'RFQグループID。'),
            @('documents[].rfqVendorId', 'int64|null', 'RFQ業者ID。'),
            @('documents[].fileName', 'string', 'ファイル名。'),
            @('documents[].mimeType', 'string', 'MIME Type。'),
            @('documents[].fileSize', 'number', 'ファイルサイズ。')
          )
        }
      )
      Process = @(
        'RFQ詳細取得と同じ権限・施設スコープを検証する。',
        'rfqVendorId指定時は対象RFQに属するrfq_vendorsであることを確認する。',
        'files配列の拡張子、MIME Type、サイズ、filePathを検証する。',
        'rfqVendorId指定時はowner_type=RFQ_VENDOR、未指定時はowner_type=RFQとしてapplication_documentsへ登録する。',
        'document_categoryはQUOTATION、document_typeは見積書、step_codeはQUOTATIONを設定する。',
        '本APIではOCR処理、見積明細生成、rfqs.status更新は行わない。登録へ遷移後の見積DB登録は本書の見積登録/発注見積登録APIで実施する。'
      )
      Errors = @(
        @('400', 'QUOTATION_FILE_INVALID', 'ファイル情報、MIME Type、サイズが不正。'),
        @('401', 'AUTH_REQUIRED', '未認証。'),
        @('403', 'FORBIDDEN', '対象RFQの購入管理権限がない。'),
        @('404', 'RFQ_GROUP_NOT_FOUND', 'RFQグループが存在しない。'),
        @('404', 'RFQ_VENDOR_NOT_FOUND', '指定されたRFQ業者が存在しない。')
      )
    },
    @{
      Id = '19-10'
      Name = 'RFQグループ削除API'
      Method = 'DELETE'
      Path = '/quotation-data-box/rfq-groups/{rfqGroupId}'
      Summary = '未送信・未処理のRFQグループを削除する。'
      Auth = 'Bearer必須。通常購入RFQとしてnormal_purchaseが対象施設で有効であること。'
      RequestTables = @(
        @{
          Title = 'パス/クエリパラメータ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('rfqGroupId', 'int64', '必須', 'RFQグループID。'),
            @('expectedUpdatedAt', 'datetime', '任意', '画面表示時のrfqs.updated_at。競合検出に使用する。')
          )
        }
      )
      ResponseTables = @(
        @{
          Title = 'レスポンス'
          Columns = @('項目', '型', '説明')
          Rows = @(
            @('rfqGroupId', 'int64', '削除したRFQグループID。'),
            @('deleted', 'boolean', 'true。')
          )
        }
      )
      Process = @(
        'rfqsを行ロックして取得し、通常購入RFQであること、施設スコープ、normal_purchase権限を確認する。',
        'expectedUpdatedAt指定時はrfqs.updated_atと一致することを確認する。',
        'RFQステータスが見積依頼であることを確認する。',
        'rfq_vendorsにDRAFT以外の行が存在しないことを確認する。SENT、REPLIED、CANCELEDの業者行がある場合は削除不可とする。',
        'quotations、quotation_items、注文関連データ、未完了のSHIP代理作業依頼、application_documentsが存在しないことを確認する。',
        'rfq_vendors、rfq_applications、rfqsを同一トランザクションで削除する。編集リスト本体および編集リスト明細は削除しない。',
        '削除結果を返却する。'
      )
      Errors = @(
        @('401', 'AUTH_REQUIRED', '未認証。'),
        @('403', 'FORBIDDEN', '対象RFQの購入管理権限がない。'),
        @('404', 'RFQ_GROUP_NOT_FOUND', 'RFQグループが存在しない。'),
        @('409', 'CONFLICT_UPDATED_AT', 'RFQが他ユーザーにより更新されている。'),
        @('409', 'RFQ_DELETE_BLOCKED', '送信済み業者、見積、注文、SHIP代理作業依頼、またはドキュメントが存在するため削除できない。')
      )
    }
  )
}

function Convert-HeadingText {
  param([string]$Text)

  if ($Text -match '^(\d+)\.\s*(.+)$') {
    return ('第{0}章 {1}' -f $matches[1], $matches[2])
  }

  return $Text
}

function Convert-SimpleSection {
  param([hashtable]$Section)

  $items = @(
    @{ Type = 'Heading1'; Text = (Convert-HeadingText -Text $Section.Heading) }
  )

  if ($Section.ContainsKey('Paragraphs')) {
    foreach ($paragraph in @($Section.Paragraphs)) {
      $items += @{ Type = 'Paragraph'; Text = $paragraph }
    }
  }

  if ($Section.ContainsKey('Tables')) {
    foreach ($table in @($Section.Tables)) {
      $items += @{ Type = 'Heading4'; Text = $table.Title }
      $items += @{ Type = 'Table'; Headers = $table.Columns; Rows = $table.Rows }
    }
  }

  return $items
}

function Convert-EndpointSpec {
  param([hashtable]$Endpoint)

  $requestSubtables = @()
  foreach ($table in @($Endpoint.RequestTables)) {
    $requestSubtables += @{
      Title = $table.Title
      Headers = $table.Columns
      Rows = $table.Rows
    }
  }

  $responseTables = @($Endpoint.ResponseTables)
  $firstResponse = if ($responseTables.Count -gt 0) { $responseTables[0] } else { $null }
  $responseSubtables = @()
  if ($responseTables.Count -gt 1) {
    for ($i = 1; $i -lt $responseTables.Count; $i++) {
      $responseSubtables += @{
        Title = $responseTables[$i].Title
        Headers = $responseTables[$i].Columns
        Rows = $responseTables[$i].Rows
      }
    }
  }

  $statusRows = @(
    @('200', 'OK', '正常終了')
  )
  foreach ($error in @($Endpoint.Errors)) {
    $statusRows += @($error)
  }

  $converted = @{
    Title = ('{0} {1}' -f $Endpoint.Id, $Endpoint.Name)
    Overview = $Endpoint.Summary
    Method = $Endpoint.Method
    Path = $Endpoint.Path
    Auth = $Endpoint.Auth
    RequestSubtables = $requestSubtables
    PermissionLines = @($Endpoint.Auth)
    ProcessingLines = @($Endpoint.Process)
    StatusRows = $statusRows
  }

  if ($null -ne $firstResponse) {
    $converted.ResponseTitle = ('レスポンス（200：{0}）' -f $firstResponse.Title)
    $converted.ResponseHeaders = $firstResponse.Columns
    $converted.ResponseRows = $firstResponse.Rows
  }

  if ($responseSubtables.Count -gt 0) {
    $converted.ResponseSubtables = $responseSubtables
  }

  return $converted
}

$sections = @()
foreach ($section in $raw.Sections) {
  $sections += Convert-SimpleSection -Section $section
}

$sections += @{ Type = 'Heading1'; Text = '第5章 API詳細' }
$sections += @{ Type = 'EndpointBlocks'; Items = @($raw.Endpoints | ForEach-Object { Convert-EndpointSpec -Endpoint $_ }) }

@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = $raw.OutputPath
  ScreenLabel = $raw.ScreenLabel
  CoverDateText = $raw.CoverDate
  RevisionDateText = $raw.Revision
  Sections = $sections
}
