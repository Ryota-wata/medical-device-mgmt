$raw = @{
  DocTitle = 'API設計書_購入管理'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\作成済み\API設計書_購入管理.docx'
  CoverDate = '2026年5月14日'
  Revision = '2026/5/14 親設計書方針見直し・最新モック整合'
  ScreenLabel = '購入管理'
  Sections = @(
    @{
      Heading = '1. 概要'
      Paragraphs = @(
        '本書は、タスク管理の購入管理タブを親業務単位とし、申請受付一覧、見積（発注）グループ一覧、および見積（発注）グループ一覧の操作ボタンから遷移する通常購入フローの画面で使用するAPI設計を定義する。',
        '親設計書としての対象範囲は、起票済み購入申請の受付・詳細参照・却下、購入管理タブ起点の編集リスト取り込み/通常購入RFQグループ作成、見積（発注）グループ一覧、RFQグループ詳細、依頼先業者の保存、依頼書プレビュー、個別見積依頼送信、見積ファイル登録、見積登録/発注見積登録、発注登録、納品日登録、検収登録、資産登録、RFQグループ削除である。',
        '資産一覧画面から実行できる新規購入/増設購入/更新購入申請の起票APIはNo.16「資産申請起票」で定義し、本書には含めない。本書は起票済み購入申請を購入管理タブで受け付けた後の進行管理を対象とする。',
        'Phase1で残すSHIP関連は、購入管理タブ/RFQ画面に表示する「SHIPへ依頼」ボタンの表示枠までとする。ボタン表示はnormal_ship_requestで判定し、SHIP代理作業依頼の作成・一覧・担当取得・差戻し・完了・取消APIはNo.19a「API設計書_SHIP代理作業依頼」をPhase2参考成果物として扱う。',
        'リモデル申請画面内の編集リスト本体・明細操作およびリモデル管理タブ起点の後続進行はNo.17「リモデル管理タブ」で定義する。購入管理タブ起点の購入申請取り込み、通常購入RFQグループ作成導線、通常購入フローの見積登録から資産登録までは本書の拡張改訂で内包する。',
        'Phase1ではOCR抽出、OCRジョブ制御、OCR結果取込APIを扱わない。現行モック上のOCR明細確認/結果表示は、見積原本を見ながら手動入力した明細の確認画面として扱う。'
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
            @('SHIP代理作業依頼', 'No.19a API設計書_SHIP代理作業依頼 / taniguchi/work/SHIP代理作業依頼_Phase2方針.md', 'Phase1ではRFQ画面上の依頼ボタン表示のみを扱い、依頼作成API本体はPhase2対象とする。ボタン表示権限normal_ship_requestは本書でも明記する。'),
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
        'RFQはrfqsをグループの正とし、rfq_vendorsを依頼先業者の正とする。APIレスポンスでは画面表示に合わせて業者行へ展開するが、rfqsを業者数分複製して登録してはならない。',
        '購入管理タブから共通画面へ遷移するAPIは、rfqGroupId、必要に応じてquotationIdまたはdraftId、managementType=PURCHASE、returnTo=/quotation-data-box/purchase-managementを保持し、共通画面完了後の戻り先と状態遷移をぶらさない。'
      )
      Tables = @(
        @{
          Title = '機能コードとAPI範囲'
          Columns = @('機能コード', '対象', '許可される主な操作')
          Rows = @(
            @('normal_purchase', '通常購入管理', '購入申請一覧・詳細・却下、購入管理タブ起点の編集リスト取り込み、通常購入RFQ作成、RFQ詳細、業者保存、個別送信、見積登録までを扱う。'),
            @('normal_order / normal_acceptance', '通常購入の後続ステップ', '購入管理タブのRFQ進捗一覧参照、発注登録、納品日登録、検収登録、資産登録の実行可否判定に利用する。'),
            @('normal_quotation', '通常購入の見積管理', '購入管理タブの見積管理行や見積参照系の表示可否判定に利用する。'),
            @('normal_ship_request', 'SHIPへ依頼ボタン', 'Phase1では購入管理タブ/RFQ画面のボタン表示可否に利用する。依頼作成・一覧・担当取得・差戻し・完了・取消APIはPhase2対象。')
          )
        },
        @{
          Title = 'RFQステータス区分'
          Columns = @('画面タブ', '対象ステータス', '備考')
          Rows = @(
            @('すべて', '完了、申請を見送るを除く全ステータス', '購入管理タブの既定表示。'),
            @('1 見積依頼/登録', '見積依頼、見積依頼済、見積DB登録済', 'RFQプロセス、業者送信、見積ファイル登録の主対象。'),
            @('2 発注登録', '発注見積登録済', '購入管理タブ起点の発注登録APIとして本書に内包する。'),
            @('3 納品日登録', '発注済', '購入管理タブ起点の納品日登録APIとして本書に内包する。'),
            @('4 検収登録', '納期確定', '購入管理タブ起点の検収登録APIとして本書に内包する。'),
            @('5 資産登録', '検収済', '購入管理タブ起点の資産登録APIとして本書に内包する。'),
            @('内部ステータス', '見積登録依頼中、発注用見積依頼済', 'Phase2のRFQ/SHIP代理作業連携で利用する内部ステータス。現行購入管理タブでは独立タブを設けない。')
          )
        },
        @{
          Title = '主な参照・更新テーブル'
          Columns = @('用途', 'テーブル/ビュー', '利用内容')
          Rows = @(
            @('購入申請参照', 'purchase_applications, applications, application_assets, application_documents', '申請受付一覧・詳細、添付ファイル、申請対象資産を返却する。'),
            @('購入申請却下', 'applications, application_status_histories', '申請ステータスを却下へ更新し、履歴を登録する。'),
            @('RFQグループ参照', 'rfqs, rfq_applications, rfq_vendors, edit_lists, edit_list_items', 'RFQ一覧・詳細・対象明細・依頼先業者を返却する。'),
            @('編集リスト連携', 'edit_lists, edit_list_facilities, edit_list_items, asset_ledgers, applications, application_status_histories', '購入管理タブからの編集リスト新規作成、購入申請明細取り込み、申請ステータス更新を実行する。'),
            @('見積関連参照/更新', 'quotations, quotation_items', 'RFQ一覧の見積登録状況、見積登録/発注見積登録、後続ステップ遷移可否を判定する。'),
            @('発注・検収・資産登録', 'orders, order_items, individuals, asset_ledgers', '購入管理タブ起点の発注登録、納品日登録、検収登録、資産登録を実行する。'),
            @('見積ファイル登録', 'application_documents', 'RFQまたはRFQ業者に紐づく見積書ファイルのメタデータを登録する。')
          )
        }
      )
    },
    @{
      Heading = '3. API一覧'
      Paragraphs = @('現行改訂でAPI詳細化済みの範囲は以下の14件である。購入管理タブ親設計書として、購入申請受付、編集リスト候補取得、編集リスト新規作成と購入申請取り込み、既存編集リストへの購入申請取り込み、通常購入RFQグループ作成、RFQ一覧/詳細、依頼先業者保存、依頼書プレビュー、個別送信、見積ファイル登録、RFQ削除を本書で扱う。SHIP代理作業依頼の依頼作成APIはPhase2対象のため、本書のAPI一覧には含めない。')
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
            @('19-10', 'DELETE', '/quotation-data-box/rfq-groups/{rfqGroupId}', '発注済到達前のRFQグループを論理削除する。'),
            @('19-11', 'GET', '/purchase-management/edit-list-options', '購入申請を追加可能な編集リスト候補を取得する。'),
            @('19-12', 'POST', '/purchase-management/edit-lists', '購入管理タブから編集リストを新規作成し、購入申請を取り込む。'),
            @('19-13', 'POST', '/purchase-management/edit-lists/{editListId}/purchase-applications', '購入申請を既存編集リストへ取り込む。'),
            @('19-14', 'POST', '/purchase-management/edit-lists/{editListId}/rfq-groups', '編集リストの選択明細から通常購入RFQグループを作成する。')
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
        'Phase1ではSHIPへ依頼ボタンの表示枠のみを扱い、SHIP代理作業依頼の作成APIは実装対象外とする。Phase2で実装する場合は外部送信ではなくSHIPユーザーへの内部代理作業依頼として扱い、rfq_vendors.request_statusをSENTへ変更しない。',
        '見積ファイル登録APIは、ファイル実体がアップロード済みであることを前提にメタデータをapplication_documentsへ登録する。購入管理タブ起点の見積明細登録、発注見積登録、発注登録、納品日登録、検収登録、資産登録は本書の親設計書範囲に含める。OCRジョブ管理などPhase2共通化が必要な処理のみNo.20で扱う。',
        '見積登録依頼中および発注用見積依頼済は独立した購入管理ステップタブではなく、Phase2のRFQ/SHIP代理作業連携で利用する内部状態として扱う。',
        'RFQ削除は発注済到達前のRFQに限定する。見積依頼、見積依頼済、見積DB登録済、見積登録依頼中、発注用見積依頼済、発注見積登録済は削除可とし、発注済、納期確定、検収済、完了以降は削除不可とする。削除時はRFQ本体と関連する依頼先、見積ヘッダ、見積明細、見積明細リンクを論理削除する。'
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
      Auth = 'Bearer必須。managementTypeはPURCHASEのみを対象とし、normal_purchase/normal_order/normal_acceptance/normal_quotationのいずれかが対象施設で有効であること。REMODELはNo.17「リモデル管理タブ」で扱う。'
      RequestTables = @(
        @{
          Title = 'クエリパラメータ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('facilityId', 'int64', '任意', '対象施設ID。省略時は選択中施設。'),
            @('managementType', 'enum', '任意', 'PURCHASE。省略時はPURCHASEとして扱う。REMODELはNo.17「リモデル管理タブ」で扱う。'),
            @('step', 'enum', '任意', 'ALL, QUOTATION, ORDER, DELIVERY_DATE, ACCEPTANCE, ASSET_REGISTRATION。既定ALL。見積登録依頼中/発注用見積依頼済は独立stepにしない。'),
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
        'rfqs.deleted_at IS NULLのRFQを基点に、未削除のrfq_vendors、edit_lists、rfq_applications、quotations、quotation_itemsを参照して一覧を取得する。',
        'rfq_vendorsが存在するRFQは業者行へ展開し、業者未設定のRFQはrfqVendorId=nullのグループ行として返却する。',
        '同一検索条件でステップ別件数を集計しtabCountsへ設定する。',
        'availableActionsはRFQステータス、業者依頼ステータス、ユーザー機能コードに基づいて算出する。Phase1ではSHIPへ依頼ボタンの表示可否をnormal_ship_requestで判定し、依頼作成API本体はPhase2対象とする。'
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
            @('availableActions[]', 'string', '保存、個別送信、SHIPへ依頼ボタン表示、見積登録へ等の操作可否。')
          )
        }
      )
      Process = @(
        'rfqs.deleted_at IS NULLのRFQを取得し、通常購入RFQであること、施設スコープ、normal_purchase機能コードを検証する。',
        '未削除のrfq_vendors、rfq_applications、edit_lists、edit_list_items、applications、application_assetsを取得してRFQプロセス表示用に整形する。対象明細はrfq_applicationsに紐づく行に限定し、同一編集リスト内の未選択明細は含めない。',
        'application_documentsからowner_typeがRFQまたはRFQ_VENDOR、かつdeleted_at IS NULLのドキュメントを取得する。',
        'RFQステータス、業者依頼ステータス、機能コードからavailableActionsを算出する。Phase1ではSHIPへ依頼ボタンの表示可否のみをnormal_ship_requestで返す。'
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
        'rfqs.deleted_at IS NULLのRFQを行ロックして取得し、通常購入RFQであること、施設スコープ、normal_purchase権限を確認する。',
        'expectedRfqUpdatedAt指定時はrfqs.updated_atと一致することを確認する。',
        '既存rfq_vendorsのうちrequest_statusがDRAFTではない行は、業者情報更新・削除対象にできない。',
        'deletedRfqVendorIdsの各行がDRAFTであることを確認し、rfq_vendors.deleted_atを設定して論理削除する。',
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
        '未削除のrfqs、rfq_vendors、rfq_applications、edit_list_items、applications、application_assetsからプレビュー情報を構築する。対象明細はrfq_applicationsに紐づく行に限定し、同一編集リスト内の未選択明細は含めない。',
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
      Summary = '発注済到達前のRFQグループを論理削除する。'
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
        'rfqs.deleted_at IS NULLのRFQを行ロックして取得し、通常購入RFQであること、施設スコープ、normal_purchase権限を確認する。',
        'expectedUpdatedAt指定時はrfqs.updated_atと一致することを確認する。',
        'RFQステータスが発注済到達前（見積依頼、見積依頼済、見積DB登録済、見積登録依頼中、発注用見積依頼済、発注見積登録済）であることを確認する。発注済以降は削除不可とする。',
        'orders、order_items、individuals、asset_ledgersへの資産登録結果など発注以降の後続データが存在しないことを確認する。存在する場合は削除不可とする。',
        'rfqs.deleted_atを設定し、関連するrfq_vendors、quotations、quotation_items、quotation_item_application_linksを同一トランザクションで論理削除する。RFQ/QUOTATION/RFQ_VENDOR所有の添付・生成ファイルメタデータはapplication_documents.deleted_atを設定する。',
        'rfq_applicationsは削除済みRFQとの採用履歴として保持する。編集リスト本体および編集リスト明細は削除しない。',
        '削除対象RFQが編集リスト行の現在表示中RFQである場合は、対象edit_list_itemsのrfq_no、rfq_group_name、rfq_assignment_statusを未割当状態へ更新する。過去RFQの再表示は行わない。',
        '削除結果を返却する。'
      )
      Errors = @(
        @('401', 'AUTH_REQUIRED', '未認証。'),
        @('403', 'FORBIDDEN', '対象RFQの購入管理権限がない。'),
        @('404', 'RFQ_GROUP_NOT_FOUND', 'RFQグループが存在しない。'),
        @('409', 'CONFLICT_UPDATED_AT', 'RFQが他ユーザーにより更新されている。'),
        @('409', 'RFQ_DELETE_BLOCKED', '発注済以降のステータス、または発注以降の後続データが存在するため削除できない。')
      )
    },
    @{
      Id = '19-11'
      Name = '編集リスト候補取得API'
      Method = 'GET'
      Path = '/purchase-management/edit-list-options'
      Summary = '購入管理タブの申請受付一覧から購入申請を追加できる編集リスト候補を取得する。'
      Auth = 'Bearer必須。対象施設および候補編集リストの対象施設でnormal_purchaseが有効なユーザーのみ実行可能。'
      RequestTables = @(
        @{
          Title = 'クエリパラメータ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('facilityId', 'int64', '任意', '作業対象施設ID。省略時は選択中施設。'),
            @('keyword', 'string', '任意', '編集リスト名の部分一致。'),
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
            @('items[].editListId', 'int64', '編集リストID。'),
            @('items[].listName', 'string', '編集リスト名。'),
            @('items[].listType', 'string', 'PURCHASE。購入管理タブから選択できる通常編集リストのみを返す。'),
            @('items[].primaryFacilityId', 'int64', '主施設ID。'),
            @('items[].facilities[].facilityId', 'int64', '対象施設ID。'),
            @('items[].facilities[].facilityName', 'string', '対象施設名。'),
            @('items[].itemCount', 'number', '編集リスト明細件数。'),
            @('items[].applicationItemCount', 'number', '購入申請起点明細件数。'),
            @('items[].updatedAt', 'datetime', '最終更新日時。'),
            @('nextCursor', 'string|null', '次ページカーソル。')
          )
        }
      )
      Process = @(
        'facilityIdの施設スコープとnormal_purchase権限を検証する。',
        'edit_lists.status=ACTIVE、deleted_at IS NULL、list_type=PURCHASEの通常編集リストを対象とする。REMODELは候補に含めない。',
        'edit_list_facilitiesの全対象施設について、ログインユーザーの施設スコープとnormal_purchase権限を検証する。',
        'keyword指定時はlist_name部分一致で絞り込み、last_accessed_at降順、updated_at降順で返却する。',
        'edit_list_itemsを集計し、総明細件数とsource_type=APPLICATIONの明細件数を設定する。'
      )
      Errors = @(
        @('400', 'VALIDATION_ERROR', 'クエリパラメータが不正。'),
        @('401', 'AUTH_REQUIRED', '未認証。'),
        @('403', 'FORBIDDEN', '対象施設または編集リスト対象施設の購入管理権限がない。')
      )
    },
    @{
      Id = '19-12'
      Name = '購入管理起点編集リスト作成・購入申請取込API'
      Method = 'POST'
      Path = '/purchase-management/edit-lists'
      Summary = '購入管理タブから編集リストを新規作成し、対象施設の原本資産コピーと選択購入申請明細の取り込みを同一トランザクションで実行する。'
      Auth = 'Bearer必須。targetFacilityIds全施設でnormal_purchaseが有効なユーザーのみ実行可能。'
      RequestTables = @(
        @{
          Title = 'リクエストボディ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('listName', 'string', '必須', '編集リスト名。最大200文字。'),
            @('targetFacilityIds[]', 'int64[]', '必須', '対象施設ID。1件以上。複数施設を許可する。'),
            @('primaryFacilityId', 'int64', '任意', '主施設ID。省略時はtargetFacilityIdsの先頭。'),
            @('purchaseApplicationIds[]', 'int64[]', '必須', '取り込む購入申請ID。1件以上。'),
            @('expectedApplicationUpdatedAts', 'object', '任意', 'キー=購入申請ID、値=画面表示時のapplications.updated_at。競合検出に使用する。')
          )
        }
      )
      ResponseTables = @(
        @{
          Title = 'レスポンス'
          Columns = @('項目', '型', '説明')
          Rows = @(
            @('editList.editListId', 'int64', '作成した編集リストID。'),
            @('editList.listName', 'string', '編集リスト名。'),
            @('editList.listType', 'string', 'PURCHASE。'),
            @('editList.facilityIds[]', 'int64[]', '対象施設ID一覧。'),
            @('baseAssetItemCount', 'number', '原本資産コピー件数。'),
            @('importedApplicationCount', 'number', '取り込んだ購入申請件数。'),
            @('importedItemCount', 'number', '作成した購入申請起点明細件数。'),
            @('applications[].purchaseApplicationId', 'int64', '更新した購入申請ID。'),
            @('applications[].status', 'string', '編集中。')
          )
        }
      )
      Process = @(
        'Idempotency-Keyが指定されている場合は二重実行を検査する。',
        'listName、targetFacilityIds、primaryFacilityId、purchaseApplicationIdsを検証する。',
        'targetFacilityIds全施設について、ログインユーザーの施設スコープとnormal_purchase権限を検証する。',
        '対象購入申請を行ロックし、application_type=PURCHASE、status=申請中、削除なし、施設スコープ内であることを確認する。',
        'expectedApplicationUpdatedAts指定時はapplications.updated_atと一致することを確認する。',
        'edit_listsをlist_type=PURCHASE、status=ACTIVEで作成し、edit_list_facilitiesへPRIMARY/ADDITIONALを登録する。',
        'targetFacilityIdsのasset_ledgersをsource_type=BASE_ASSETとしてedit_list_itemsへスナップショットコピーする。',
        '購入申請のapplication_assetsをsource_type=APPLICATIONとしてedit_list_itemsへ追加する。source_application_id/source_application_asset_idを必ず保持する。',
        'applications.edit_list_idを作成したedit_list_idへ設定し、statusを編集中へ更新し、application_status_historiesへ履歴を登録する。',
        '同一トランザクションで確定し、作成件数を返却する。'
      )
      Errors = @(
        @('400', 'VALIDATION_ERROR', '編集リスト名、対象施設、購入申請IDが不正。'),
        @('401', 'AUTH_REQUIRED', '未認証。'),
        @('403', 'FORBIDDEN', '対象施設または購入申請の購入管理権限がない。'),
        @('404', 'PURCHASE_APPLICATION_NOT_FOUND', '購入申請が存在しない、または参照できない。'),
        @('409', 'CONFLICT_UPDATED_AT', '購入申請が他ユーザーにより更新されている。'),
        @('409', 'PURCHASE_APPLICATION_STATUS_INVALID', '申請中ではない購入申請は取り込めない。')
      )
    },
    @{
      Id = '19-13'
      Name = '既存編集リスト購入申請取込API'
      Method = 'POST'
      Path = '/purchase-management/edit-lists/{editListId}/purchase-applications'
      Summary = '購入管理タブで選択した購入申請を既存編集リストへ取り込み、購入申請を編集中へ更新する。'
      Auth = 'Bearer必須。編集リスト対象施設および購入申請施設でnormal_purchaseが有効なユーザーのみ実行可能。'
      RequestTables = @(
        @{
          Title = 'パスパラメータ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('editListId', 'int64', '必須', '編集リストID。')
          )
        },
        @{
          Title = 'リクエストボディ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('purchaseApplicationIds[]', 'int64[]', '必須', '取り込む購入申請ID。1件以上。'),
            @('expectedEditListUpdatedAt', 'datetime', '任意', '画面表示時のedit_lists.updated_at。競合検出に使用する。'),
            @('expectedApplicationUpdatedAts', 'object', '任意', 'キー=購入申請ID、値=画面表示時のapplications.updated_at。競合検出に使用する。')
          )
        }
      )
      ResponseTables = @(
        @{
          Title = 'レスポンス'
          Columns = @('項目', '型', '説明')
          Rows = @(
            @('editListId', 'int64', '編集リストID。'),
            @('importedApplicationCount', 'number', '取り込んだ購入申請件数。'),
            @('importedItemCount', 'number', '作成した購入申請起点明細件数。'),
            @('applications[].purchaseApplicationId', 'int64', '更新した購入申請ID。'),
            @('applications[].status', 'string', '編集中。')
          )
        }
      )
      Process = @(
        'Idempotency-Keyが指定されている場合は二重実行を検査する。',
        'edit_listsを行ロックして取得し、status=ACTIVE、deleted_at IS NULL、list_type=PURCHASEであることを確認する。REMODELは対象外とする。',
        'expectedEditListUpdatedAt指定時はedit_lists.updated_atと一致することを確認する。',
        'edit_list_facilities全施設と購入申請施設について、ログインユーザーの施設スコープとnormal_purchase権限を検証する。',
        '対象購入申請を行ロックし、application_type=PURCHASE、status=申請中であることを確認する。',
        'source_type=APPLICATIONの一意制約により同一購入申請明細の重複取り込みを防止する。Idempotency-Key一致の再実行は既存結果を返す。',
        'application_assetsをedit_list_itemsへ追加し、applications.edit_list_idとstatus=編集中、application_status_historiesを同一トランザクションで更新する。編集リストのlist_typeは作成時に確定済みのため更新しない。',
        'edit_lists.updated_at、last_accessed_atを更新し、取り込み件数を返却する。'
      )
      Errors = @(
        @('400', 'VALIDATION_ERROR', '購入申請IDが不正。'),
        @('401', 'AUTH_REQUIRED', '未認証。'),
        @('403', 'FORBIDDEN', '編集リストまたは購入申請の購入管理権限がない。'),
        @('404', 'EDIT_LIST_NOT_FOUND', '編集リストが存在しない、または参照できない。'),
        @('404', 'PURCHASE_APPLICATION_NOT_FOUND', '購入申請が存在しない、または参照できない。'),
        @('409', 'CONFLICT_UPDATED_AT', '編集リストまたは購入申請が他ユーザーにより更新されている。'),
        @('409', 'PURCHASE_APPLICATION_STATUS_INVALID', '申請中ではない購入申請は取り込めない。'),
        @('409', 'EDIT_LIST_TYPE_INVALID', 'REMODELの編集リストへ購入申請は取り込めない。'),
        @('409', 'EDIT_LIST_APPLICATION_DUPLICATED', '同一購入申請明細が既に編集リストへ取り込まれている。')
      )
    },
    @{
      Id = '19-14'
      Name = '通常購入RFQグループ作成API'
      Method = 'POST'
      Path = '/purchase-management/edit-lists/{editListId}/rfq-groups'
      Summary = '購入管理タブ起点の編集リストで選択した明細から通常購入RFQグループを作成する。'
      Auth = 'Bearer必須。編集リスト対象施設でnormal_purchaseが有効なユーザーのみ実行可能。'
      RequestTables = @(
        @{
          Title = 'パスパラメータ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('editListId', 'int64', '必須', '編集リストID。')
          )
        },
        @{
          Title = 'リクエストボディ'
          Columns = @('項目', '型', '必須', '説明')
          Rows = @(
            @('rfqGroupName', 'string', '必須', '見積依頼グループ名。最大150文字。'),
            @('editListItemIds[]', 'int64[]', '必須', 'RFQに採用する編集リスト明細ID。1件以上。'),
            @('dueOn', 'date', '任意', 'グループ回答期限。'),
            @('remarks', 'string', '任意', '備考。'),
            @('expectedEditListUpdatedAt', 'datetime', '任意', '画面表示時のedit_lists.updated_at。競合検出に使用する。')
          )
        }
      )
      ResponseTables = @(
        @{
          Title = 'レスポンス'
          Columns = @('項目', '型', '説明')
          Rows = @(
            @('rfqGroupId', 'int64', '作成したrfqs.rfq_id。'),
            @('rfqNo', 'string', '採番された見積依頼No。'),
            @('rfqGroupName', 'string', '見積依頼グループ名。'),
            @('status', 'string', '見積依頼。'),
            @('managementType', 'string', 'PURCHASE。'),
            @('editListId', 'int64', '編集リストID。'),
            @('linkedItemCount', 'number', 'rfq_applicationsへ登録した明細件数。')
          )
        }
      )
      Process = @(
        'Idempotency-Keyが指定されている場合は二重実行を検査する。',
        'edit_listsを行ロックして取得し、status=ACTIVE、deleted_at IS NULL、list_type=PURCHASEであることを確認する。REMODELは対象外とする。',
        'expectedEditListUpdatedAt指定時はedit_lists.updated_atと一致することを確認する。',
        'edit_list_facilities全施設について、ログインユーザーの施設スコープとnormal_purchase権限を検証する。',
        'editListItemIdsの全明細を行ロックし、指定編集リストに属し、record_status=ACTIVEであることを確認する。',
        '同じ編集リスト明細が既に別RFQへ紐づいていても新規RFQ作成は許可する。削除済みRFQは現在割当判定から除外し、有効な過去RFQとのリンクはrfq_applicationsで履歴として追跡する。',
        'rfqsをmanagement_type=PURCHASE、status=見積依頼、edit_list_id指定で作成し、rfq_noを採番する。編集リストのlist_typeは作成時にPURCHASEとして確定済みのため更新しない。',
        '選択されたedit_list_itemsだけをrfq_applicationsへ登録する。source_type=APPLICATIONの明細ではapplication_id/application_asset_idへ出所を設定する。',
        '採用明細のedit_list_items.rfq_no、rfq_group_name、rfq_assignment_status=RFQ_ASSIGNEDを更新する。',
        '作成結果を返却する。RFQ詳細・依頼書プレビューはrfq_applicationsに登録された明細だけを対象とする。'
      )
      Errors = @(
        @('400', 'VALIDATION_ERROR', '見積依頼グループ名または編集リスト明細IDが不正。'),
        @('401', 'AUTH_REQUIRED', '未認証。'),
        @('403', 'FORBIDDEN', '編集リスト対象施設の購入管理権限がない。'),
        @('404', 'EDIT_LIST_NOT_FOUND', '編集リストが存在しない、または参照できない。'),
        @('404', 'EDIT_LIST_ITEM_NOT_FOUND', '編集リスト明細が存在しない、または参照できない。'),
        @('409', 'CONFLICT_UPDATED_AT', '編集リストが他ユーザーにより更新されている。'),
        @('409', 'EDIT_LIST_TYPE_INVALID', 'REMODELの編集リストから通常購入RFQは作成できない。')
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
