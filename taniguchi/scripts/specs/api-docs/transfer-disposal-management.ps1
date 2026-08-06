$transferDisposalPermissionLines = @(
  '認可条件: Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること',
  '認可条件: Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `transfer_disposal` が有効であること'
)

$errorRows = @(
  @('200', '処理成功', '各API定義のレスポンス'),
  @('201', '登録成功', '各API定義のレスポンス'),
  @('204', '削除成功', '-'),
  @('400', '入力値不正、対象種別不整合、条件付き項目不足', 'ErrorResponse'),
  @('401', '未認証', 'ErrorResponse'),
  @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
  @('404', '対象申請、対象RFQ、対象見積、対象ドキュメントが存在しない', 'ErrorResponse'),
  @('409', '現在ステータス不整合、競合更新、資産重複、RFQ・業者・発注の関連不整合', 'ErrorResponse'),
  @('502', 'Amazon S3 へのファイル保存またはロールバック削除に失敗した', 'ErrorResponse'),
  @('500', 'サーバー内部エラー', 'ErrorResponse')
)

$applicationAssetRows = @(
  @('applicationAssetId', 'int64', '✓', '`application_assets.application_asset_id`'),
  @('assetLedgerId', 'int64', '-', '登録済み資産の場合のみ設定。未登録資産は NULL'),
  @('assetRole', 'string', '✓', '`TRANSFER` / `DISPOSAL`'),
  @('qrCodeValue', 'string', '-', 'QRラベル。登録済み資産は `asset_ledgers` 由来'),
  @('itemName', 'string', '✓', '品目名。未登録資産は修理申請から引き継いだ手入力値'),
  @('makerName', 'string', '-', 'メーカー名'),
  @('modelName', 'string', '-', '型式'),
  @('serialNo', 'string', '-', 'シリアルNo.'),
  @('currentLocationName', 'string', '-', '移動前または廃棄対象の現在設置場所'),
  @('destinationLocationName', 'string', '-', '移動申請の場合の移動先設置場所'),
  @('isRegisteredAsset', 'boolean', '✓', '`assetLedgerId` がある場合 true')
)

$transferApplicationRows = @(
  @('transferApplicationId', 'int64', '✓', '`applications.application_id`'),
  @('applicationNo', 'string', '✓', '申請番号'),
  @('status', 'string', '✓', '`applications.status` の保存値。承認・原本反映後は `完了`'),
  @('statusLabel', 'string', '✓', '画面表示用ステータス。例: `移動承認待ち` / `移動完了`'),
  @('requestedOn', 'date', '✓', '申請日'),
  @('requestedByDepartmentName', 'string', '-', '申請者所属'),
  @('requestedByName', 'string', '✓', '申請者名'),
  @('requestedByContact', 'string', '-', '申請者連絡先'),
  @('sourceLocationName', 'string', '-', '移動元設置場所'),
  @('destinationLocationName', 'string', '✓', '移動先設置場所'),
  @('transferReason', 'string', '-', 'コメント（移動理由 他）。`transfer_application_details.transfer_reason`。一覧テーブル列ではなく、申請内容確認モーダル表示用'),
  @('assets', 'ApplicationAssetSummary[]', '✓', '移動対象資産'),
  @('availableActions', 'string[]', '✓', '表示可能操作。例: `APPROVE_TRANSFER` / `VIEW_DETAIL`')
)

$disposalApplicationRows = @(
  @('disposalApplicationId', 'int64', '✓', '`applications.application_id`'),
  @('applicationNo', 'string', '✓', '申請番号'),
  @('status', 'string', '✓', '`applications.status` の保存値'),
  @('statusLabel', 'string', '✓', '画面表示用ステータス。保存値との対応はステータスマッピングに従う'),
  @('requestedOn', 'date', '✓', '申請日'),
  @('requestedByDepartmentName', 'string', '-', '申請者所属'),
  @('requestedByName', 'string', '✓', '申請者名'),
  @('requestedByContact', 'string', '-', '申請者連絡先'),
  @('disposalReasonCode', 'string', '-', '`disposal_application_details.disposal_reason_code`'),
  @('disposalReasonText', 'string', '-', '`disposal_application_details.disposal_reason_text`'),
  @('relatedRepairApplicationId', 'int64', '-', '修理不能から作成された廃棄申請の場合の元修理申請ID'),
  @('relatedPurchaseApplicationId', 'int64', '-', '更新購入後処理から作成された廃棄申請の場合の元購入申請ID'),
  @('assets', 'ApplicationAssetSummary[]', '✓', '廃棄対象資産'),
  @('availableActions', 'string[]', '✓', '表示可能操作。例: `CREATE_DISPOSAL_GROUP` / `VIEW_DETAIL`')
)

$disposalGroupRows = @(
  @('disposalTaskId', 'int64', '✓', '`rfqs.rfq_id`。廃棄申請タスクID'),
  @('rfqNo', 'string', '✓', '`rfqs.rfq_no`'),
  @('groupName', 'string', '✓', '`rfqs.rfq_group_name`'),
  @('status', 'string', '✓', '画面表示用の集約ステータス。`rfqStatus`（グループ正本）、`applicationStatus`（申請正本）、有効な業者・見積・発注・書類からAPIが導出する'),
  @('rfqStatus', 'string', '✓', '`rfqs.status`。作成直後は `見積依頼`'),
  @('applicationStatus', 'string', '✓', '紐づく全 `applications.status` の代表値。作成直後は `新規申請`。個別申請の状態は `applications` 要素で返す'),
  @('statusLabel', 'string', '✓', '画面表示用ステータス'),
  @('managementType', 'string', '✓', '`DISPOSAL`。廃棄依頼グループの管理種別'),
  @('workflowType', 'string', '✓', '`RFQ`。廃棄依頼グループのワークフロー種別'),
  @('applicationType', 'string', '✓', '`DISPOSAL`。グループ内申請の種別'),
  @('receptionDepartment', 'string', '-', '`rfqs.reception_department`。廃棄依頼グループ作成時に初回受付情報として保存した受付部署。再アクセス時は保存値を返し、ログインユーザーで上書きしない'),
  @('receptionPerson', 'string', '-', '`rfqs.reception_person`。初回受付時のログインユーザー氏名スナップショット。`receptionUserId` と同一人物を示し、再アクセス時は保存値を返す'),
  @('receptionUserId', 'int64', '-', '`rfqs.reception_user_id`。初回受付を行った `users.user_id`'),
  @('receptionConfirmedAt', 'datetime', '-', '`rfqs.reception_confirmed_at`。初回受付情報を保存した日時'),
  @('receptionContact', 'string', '-', '`rfqs.reception_contact`。画面入力不可の見積依頼書表示用受付連絡先'),
  @('isRemodelOrigin', 'boolean', '✓', '`rfq_applications.edit_list_id` または `edit_list_item_id` から判定したリモデル起点フラグ'),
  @('editListId', 'int64', '-', 'リモデル起点の場合の編集リストID。資産一覧等の通常起点では NULL'),
  @('editListItemIds', 'int64[]', '✓', 'グループ内のリモデル編集リスト明細ID。該当なしの場合は空配列'),
  @('remodelCloseImpact', 'object', '✓', 'リモデルクローズへの影響。対象外の場合も `isRemodelOrigin=false` と空の影響情報を返す'),
  @('vendorName', 'string', '-', '採用または最新依頼先業者名'),
  @('quotationDueOn', 'date', '-', '`disposal_application_details.quotation_due_on`。依頼先別期限は `rfq_vendors.due_on`'),
  @('orderDeadlineOn', 'date', '-', '`disposal_application_details.order_deadline_on`'),
  @('disposalScheduledOn', 'date', '-', '`disposal_application_details.disposal_scheduled_on`'),
  @('applicationCount', 'int32', '✓', '紐づく廃棄申請件数'),
  @('assetCount', 'int32', '✓', '紐づく廃棄対象資産件数'),
  @('availableActions', 'string[]', '✓', '表示可能操作。例: `OPEN_TASK` / `CANCEL`')
)

$disposalTaskHeaderRows = @($disposalGroupRows + @(
  @('requestComment', 'string', '-', '`rfqs.request_comment`。廃棄依頼グループ単位のご依頼事項。再アクセス時に保存値を返す')
))

$disposalTaskStepRows = @(
  @('stepCode', 'string', '✓', '`QUOTE_REQUEST` / `QUOTATION` / `ORDER` / `SCHEDULE` / `COMPLETE`'),
  @('stepName', 'string', '✓', '画面表示工程名'),
  @('stepStatus', 'string', '✓', '`NOT_STARTED` / `IN_PROGRESS` / `COMPLETED` / `SKIPPED` / `CANCELED`'),
  @('isCurrent', 'boolean', '✓', '現在工程の場合 true'),
  @('startedAt', 'datetime', '-', '工程開始日時'),
  @('completedAt', 'datetime', '-', '工程完了日時')
)

$disposalVendorRequestRows = @(
  @('rfqVendorId', 'int64', '✓', '`rfq_vendors.rfq_vendor_id`'),
  @('vendorId', 'int64', '-', '業者マスタID'),
  @('vendorName', 'string', '✓', '依頼先業者名'),
  @('contactPerson', 'string', '-', '担当者名'),
  @('email', 'string', '-', 'メールアドレス'),
  @('phone', 'string', '-', '連絡先'),
  @('dueOn', 'date', '-', '回答期限'),
  @('requestNote', 'string', '-', '依頼補足'),
  @('requestStatus', 'string', '✓', '`DRAFT` / `SENT` / `REPLIED` / `CANCELED`')
)

$disposalQuotationItemRows = @(
  @('quotationItemId', 'int64', '✓', '`quotation_items.quotation_item_id`'),
  @('itemName', 'string', '✓', '`quotation_items.item_name`'),
  @('quantity', 'int32', '✓', '`quotation_items.original_quantity`'),
  @('unitPrice', 'decimal', '-', '`quotation_items.purchase_price_unit`'),
  @('amount', 'decimal', '-', '`quotation_items.purchase_price_total`'),
  @('accountTitle', 'string', '-', '`quotation_items.account_title`'),
  @('applicationAssetId', 'int64', '-', '`quotation_item_application_links.application_asset_id`'),
  @('editListId', 'int64', '-', '`quotation_item_application_links.edit_list_id`'),
  @('editListItemId', 'int64', '-', '`quotation_item_application_links.edit_list_item_id`'),
  @('linkedQuantity', 'int32', '-', '`quotation_item_application_links.linked_quantity`'),
  @('linkStatus', 'string', '-', '`quotation_item_application_links.link_status`')
)

$disposalQuotationRows = @(
  @('quotationId', 'int64', '✓', '`quotations.quotation_id`'),
  @('quotationNo', 'string', '✓', 'システム採番の受領見積番号。画面入力の見積No.とは別管理'),
  @('vendorQuotationNo', 'string', '-', '`quotations.vendor_quotation_no`。画面入力の業者側見積No.'),
  @('vendorId', 'int64', '-', '業者マスタID'),
  @('vendorName', 'string', '✓', '見積業者名'),
  @('quotationPhase', 'string', '✓', '`ESTIMATE`（参考見積） / `ORDER_REGISTRATION`（発注登録用見積）'),
  @('quotationOn', 'date', '✓', '見積日'),
  @('totalAmountExclTax', 'decimal', '-', '税抜合計金額'),
  @('accountDivisionCode', 'string', '-', '`quotations.account_division_code`。勘定科目コード'),
  @('storageFormat', 'string', '✓', '見積原本の `application_documents.storage_format`。電子取引 / スキャナ保存 / 未指定'),
  @('documentId', 'int64', '✓', '見積原本の `application_documents.application_document_id`'),
  @('fileName', 'string', '✓', '見積原本ファイル名'),
  @('previewUrl', 'string', '-', '見積書プレビュー用の認可済みURL。未発行時は NULL'),
  @('status', 'string', '✓', '`quotations.status`'),
  @('items', 'DisposalQuotationItem[]', '✓', '見積明細')
)

$disposalOrderRows = @(
  @('orderId', 'int64', '✓', '`orders.order_id`'),
  @('orderNo', 'string', '✓', '発注番号'),
  @('quotationId', 'int64', '✓', '採用見積ID'),
  @('vendorName', 'string', '✓', '発注先業者名'),
  @('orderType', 'string', '✓', '`orders.order_type`。廃棄申請では `廃棄委託` 固定で保存する'),
  @('settlementNo', 'string', '-', '`orders.settlement_no`。院内決済No.'),
  @('settlementOn', 'date', '-', '`orders.settlement_on`。画面入力の決済日'),
  @('orderDocumentDeliveryMethod', 'string', '-', '`PRINT`（印刷） / `EMAIL`（mail送信）'),
  @('orderDocumentDeliveryStatus', 'string', '-', '`PENDING` / `PRINTED` / `SENT` / `FAILED`'),
  @('orderDocumentSentAt', 'datetime', '-', '`orders.order_document_sent_at`'),
  @('orderOn', 'date', '✓', '発注日'),
  @('totalAmount', 'decimal', '-', '`orders.total_amount`'),
  @('status', 'string', '✓', '`orders.status`'),
  @('documentId', 'int64', '-', '発注書の `application_documents.application_document_id`'),
  @('previewUrl', 'string', '-', '発注書プレビュー用の認可済みURL')
)

$documentRows = @(
  @('documentId', 'int64', '✓', '`application_documents.application_document_id`'),
  @('ownerType', 'string', '✓', '廃棄タスクの完了書類は `RFQ`、見積書は `QUOTATION`。`ORDER` は使用しない'),
  @('rfqId', 'int64', '-', '完了書類・発注書の `application_documents.rfq_id`。廃棄タスクの `disposalTaskId` と一致'),
  @('orderId', 'int64', '-', '発注書の場合の `application_documents.order_id`。`ownerType=''ORDER''` は使用せず、`rfq_id + order_id` で対象発注を特定する'),
  @('stepCode', 'string', '-', '`QUOTE_REQUEST` / `QUOTATION` / `ORDER` / `SCHEDULE` / `COMPLETE`'),
  @('documentCategory', 'string', '✓', '見積書は `QUOTATION`、発注書は `ORDER`、完了書類は `COMPLETE`'),
  @('documentType', 'string', '✓', '画面表示用種別。`院内決済書類` / `見積書` / `見積書（変更が発生した場合）` / `産業廃棄物処理委託契約書` / `注文書` / `注文請書` / `廃棄物証明書（処分完了報告書）` / `産業廃棄物管理票（マニフェスト）` / `請求書` / `その他`'),
  @('title', 'string', '-', '表示タイトル'),
  @('documentDate', 'date', '-', '`application_documents.document_date`'),
  @('documentNo', 'string', '-', '`application_documents.document_no`'),
  @('otherDocumentName', 'string', '-', '`documentType=''その他''` の場合のその他ドキュメント名'),
  @('actualAmountExclTax', 'decimal', '-', '`documentType=''見積書（変更が発生した場合）''` の場合の実績金額（税抜）'),
  @('accountDivisionCode', 'string', '-', '`documentType=''見積書（変更が発生した場合）''` の場合の勘定科目コード'),
  @('storageFormat', 'string', '✓', '電子取引 / スキャナ保存 / 未指定'),
  @('fileName', 'string', '✓', 'ファイル名'),
  @('contentType', 'string', '-', 'MIMEタイプ'),
  @('fileSize', 'int64', '-', 'ファイルサイズ'),
  @('downloadUrl', 'string', '-', '表示・ダウンロード用の認可済みURL。S3オブジェクトキー、S3バケット名、S3の直接URLは返さない'),
  @('uploadedAt', 'datetime', '✓', 'アップロード日時'),
  @('uploadedByName', 'string', '-', 'アップロード者名')
)

$documentInputRows = @(
  @('documentType', 'string', '✓', 'STEP④で登録する完了書類の9種別。`院内決済書類` / `見積書（変更が発生した場合）` / `産業廃棄物処理委託契約書` / `注文書` / `注文請書` / `廃棄物証明書（処分完了報告書）` / `産業廃棄物管理票（マニフェスト）` / `請求書` / `その他`。STEP②の通常見積書は見積登録APIが固定する'),
  @('documentDate', 'date', '-', '画面の日付入力。`application_documents.document_date` に保存'),
  @('documentNo', 'string', '-', '画面のドキュメントNo.。`application_documents.document_no` に保存'),
  @('otherDocumentName', 'string', '-', '`documentType=''その他''` の場合に必須'),
  @('actualAmountExclTax', 'decimal', '-', '`documentType=''見積書（変更が発生した場合）''` の場合に必須'),
  @('accountDivisionCode', 'string', '-', '`documentType=''見積書（変更が発生した場合）''` の場合に必須'),
  @('storageFormat', 'string', '✓', '電子取引 / スキャナ保存 / 未指定。初期値は `未指定`'),
  @('filePartName', 'string', '✓', 'multipart/form-data のファイルパート名'),
  @('fileName', 'string', '✓', 'ファイル名'),
  @('contentType', 'string', '-', 'MIMEタイプ'),
  @('fileSize', 'int64', '-', 'ファイルサイズ'),
  @('contentHash', 'string', '-', 'ファイル本文のハッシュ値。未指定時はAPI側で算出する'),
  @('title', 'string', '-', '表示タイトル。未指定時はファイル名からAPIが補完する。所有者種別・所有者IDは画面から受け付けない')
)

$quotationDocumentInputRows = @(
  @('storageFormat', 'string', '✓', '電子取引 / スキャナ保存 / 未指定。`application_documents.storage_format` に保存'),
  @('filePartName', 'string', '✓', 'multipart/form-data のファイルパート名'),
  @('fileName', 'string', '✓', '見積原本ファイル名'),
  @('contentType', 'string', '-', 'MIMEタイプ'),
  @('fileSize', 'int64', '-', 'ファイルサイズ'),
  @('contentHash', 'string', '-', 'ファイル本文のハッシュ値。未指定時はAPI側で算出する'),
  @('title', 'string', '-', '表示タイトル。未指定時は見積No.またはファイル名からAPIが補完')
)

$actionResponseRows = @(
  @('disposalTaskId', 'int64', '-', '廃棄申請タスクID。移動承認では NULL'),
  @('applicationIds', 'int64[]', '✓', '更新対象申請ID'),
  @('status', 'string', '✓', '更新後の画面表示用集約ステータス'),
  @('rfqStatus', 'string', '✓', '更新後の `rfqs.status`。グループ操作時の正本'),
  @('applicationStatus', 'string', '✓', '更新後の対象 `applications.status`。申請操作時の正本'),
  @('statusLabel', 'string', '✓', '更新後表示ステータス'),
  @('remodelCloseImpact', 'object', '-', '完了登録時のリモデル起点資産・編集リストへの影響情報'),
  @('updatedAt', 'datetime', '✓', '更新日時')
)

@{
  TemplatePath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\テンプレート\API設計書_標準テンプレート.docx'
  OutputPath = 'C:\Projects\mock\medical-device-mgmt\taniguchi\api\Fix\API設計書_移動・廃棄管理.docx'
  ScreenLabel = '移動・廃棄管理（廃棄申請管理）'
  CoverDateText = '2026年7月16日'
  RevisionVersionText = '1.2'
  RevisionDateText = '2026/7/21'
  RevisionSummaryText = '廃棄完了書類のRFQ単位化、完了後プレビュー、初回受付情報の保存方針反映'
  RevisionAuthorText = 'Codex'
  Sections = @(
    @{ Type = 'Heading1'; Text = '第1章 概要' },
    @{ Type = 'Heading2'; Text = '本書の目的' },
    @{ Type = 'Paragraph'; Text = '本書は、移動・廃棄管理タブ画面（`/quotation-data-box/transfer-management`）、廃棄申請管理画面（`/disposal-task`）、旧廃棄管理URL（`/quotation-data-box/disposal-management`）で利用する API の設計内容を定義する。' },
    @{ Type = 'Paragraph'; Text = '資産一覧起点、リモデル編集リスト起点、修理不能起点などの申請起票本体は各起票元のAPI設計書を正本とし、本書では起票済み申請の受付、移動承認と原本反映、廃棄申請のRFQグループ化、見積依頼、見積登録、発注登録、作業日/納期登録、完了登録を扱う。' },
    @{ Type = 'Heading2'; Text = '対象システム概要' },
    @{ Type = 'Paragraph'; Text = '移動・廃棄管理は、タスク管理配下で移動申請と廃棄申請を統合表示する機能である。移動申請は承認時点で資産台帳の設置場所を更新し、同一トランザクションで資産台帳履歴と申請ステータス履歴を作成する。廃棄申請は廃棄申請タスクとしてRFQ、見積、発注、作業日、完了まで進行する。' },
    @{ Type = 'Paragraph'; Text = '未登録資産の廃棄は、修理申請で修理不能と判定されて作成された廃棄申請のみを後続管理対象とする。修理申請を経由しない未登録資産の単独廃棄申請入口は Phase1 対象外であり、本書では API を定義しない。' },
    @{ Type = 'Heading2'; Text = '用語定義' },
    @{ Type = 'Table'; Headers = @('用語', '説明'); Rows = @(
      @('移動申請', '`applications.application_type=''TRANSFER''` の申請。承認時に `asset_ledgers` の設置場所を原本反映する'),
      @('廃棄申請', '`applications.application_type=''DISPOSAL''` の申請。廃棄申請タスクへ紐づけて後続工程を進行する'),
      @('廃棄申請タスク', '廃棄申請を1件以上束ねた `rfqs.management_type=''DISPOSAL''`、`workflow_type=''RFQ''` の廃棄依頼グループ。本書の `disposalTaskId` は `rfqs.rfq_id` を指す。資産一覧起点とリモデル起点を同じグループモデルで扱い、リモデル起点かどうかは `rfq_applications.edit_list_id` / `edit_list_item_id` で判定する'),
      @('登録済み資産', '`application_assets.asset_ledger_id` を持つ廃棄/移動対象'),
      @('未登録資産', '資産台帳IDを持たない対象。廃棄管理では `disposal_application_details.related_repair_application_id` がある申請のみ許可する'),
      @('旧廃棄管理URL', '`/quotation-data-box/disposal-management`。業務APIは持たず、移動・廃棄管理タブへ正規化する画面ルート')
    ) },
    @{ Type = 'Heading2'; Text = '対象画面' },
    @{ Type = 'Table'; Headers = @('画面名', '画面パス', '利用目的'); Rows = @(
      @('移動・廃棄管理タブ画面', '/quotation-data-box/transfer-management', '移動/廃棄申請の受付一覧、廃棄RFQグループ一覧、移動承認操作を提供する'),
      @('廃棄申請管理画面', '/disposal-task?groupId={disposalTaskId}', '廃棄RFQグループの見積依頼、見積登録、発注、作業日、完了登録を行う'),
      @('廃棄管理リダイレクト画面', '/quotation-data-box/disposal-management', '旧URLから移動・廃棄管理タブへ正規化する')
    ) },

    @{ Type = 'Heading1'; Text = '第2章 システム全体構成' },
    @{ Type = 'Heading2'; Text = 'API の位置づけ' },
    @{ Type = 'Paragraph'; Text = '本API群は、申請作成後のタスク管理機能である。申請起票、申請添付の初期登録、更新購入や棚卸しからの関連申請作成は呼び出し元 API の責務とし、本書では起票済み申請の状態遷移と関連タスクのみを更新する。' },
    @{ Type = 'Paragraph'; Text = '廃棄タスクは `rfqs` をグループの正本として利用し、`rfq_applications` で対象 `applications` / `application_assets` と接続する。`rfqs.status` はグループ全体の現在STEP・終端状態、`applications.status` はグループ内の申請単位の業務状態として役割分担し、グループ操作では両方を同一トランザクションで更新する。`application_task_steps` は工程タイムラインの補助情報であり、現在STEPの判定元にはしない。' },
    @{ Type = 'Heading2'; Text = '画面と API の関係' },
    @{ Type = 'Table'; Headers = @('画面操作', 'API', '補足'); Rows = @(
      @('移動・廃棄管理タブ初期表示/フィルター', '`GET /quotation-data-box/transfer-management/tasks`', '移動承認待ち、廃棄申請受付、廃棄RFQグループ一覧を取得する'),
      @('移動申請詳細確認・承認', '`POST /transfer-applications/{transferApplicationId}/approve`', '移動申請を承認し、資産台帳の設置場所と履歴を同一トランザクションで更新する'),
      @('廃棄申請から見積依頼グループ作成', '`POST /quotation-data-box/transfer-management/disposal-groups`', '選択した廃棄申請を `rfqs` / `rfq_applications` に紐づけ、廃棄申請タスクを作成する'),
      @('廃棄申請タスク詳細表示', '`GET /disposal-task/tasks/{disposalTaskId}`', 'STEP表示、申請、対象資産、依頼先、見積、発注、添付を取得する'),
      @('廃棄申請を見送る', '`POST /disposal-task/tasks/{disposalTaskId}/cancel`', '発注前の廃棄タスクを `申請見送り` で終端する'),
      @('見積依頼先登録・送信', '`POST /disposal-task/tasks/{disposalTaskId}/vendor-requests`', '依頼先を登録し、依頼完了時に `見積依頼済` へ進める'),
      @('見積登録', '`POST /disposal-task/tasks/{disposalTaskId}/quotations`', '見積ヘッダー、明細、見積原本を保存し、`ESTIMATE` は `見積DB登録済`、`ORDER_REGISTRATION` は `発注用見積登録済` へ進める'),
      @('見積削除', '`DELETE /disposal-task/tasks/{disposalTaskId}/quotations/{quotationId}`', '発注前の見積を論理削除する'),
      @('発注登録', '`POST /disposal-task/tasks/{disposalTaskId}/order`', '採用見積から発注を作成し `発注済` へ進める'),
      @('作業日/納期登録', '`POST /disposal-task/tasks/{disposalTaskId}/delivery-date`', '廃棄予定日を保存し `納期確定` へ進める'),
      @('完了書類追加/削除', '`POST /disposal-task/tasks/{disposalTaskId}/documents` / `DELETE /disposal-task/tasks/{disposalTaskId}/documents/{documentId}`', '完了報告書、廃棄証明書、マニフェスト、契約書、請求書等を管理する'),
      @('検収/完了登録', '`POST /disposal-task/tasks/{disposalTaskId}/complete`', '廃棄完了情報と証跡を保存し `完了` へ進める')
    ) },
    @{ Type = 'Heading2'; Text = '利用テーブル' },
    @{ Type = 'Table'; Headers = @('テーブル/VIEW', '利用種別', '用途'); Rows = @(
      @('`applications`', 'READ/UPDATE', '移動/廃棄申請ヘッダ、ステータス、申請番号、申請者情報'),
      @('`application_assets`', 'READ/UPDATE', '移動/廃棄対象資産、移動先スナップショット、廃棄対象スナップショット'),
      @('`transfer_application_details`', 'READ', '移動申請の移動先、関連購入申請、コメント（移動理由 他）'),
      @('`disposal_application_details`', 'READ/UPDATE', '廃棄理由、関連修理/購入、受付、期限、発注、廃棄予定日、検収情報'),
      @('`application_status_histories`', 'CREATE', '申請ステータス変更履歴'),
      @('`application_task_steps`', 'READ', '既存共通工程情報がある場合の補助表示。No.27では作成・更新せず、現在STEP・再アクセス位置の正本にも使用しない'),
      @('`rfqs`', 'CREATE/READ/UPDATE', '廃棄申請タスクの業務RFQグループ。`management_type=''DISPOSAL''`、`workflow_type=''RFQ''`。グループ状態履歴も記録する'),
      @('`rfq_applications`', 'CREATE/READ', '廃棄RFQグループと申請/申請明細の接続'),
      @('`rfq_status_histories`', 'CREATE', '廃棄RFQグループのステータス変更履歴'),
      @('`rfq_vendors`', 'CREATE/READ/UPDATE', '廃棄見積依頼先、回答期限、送信状態'),
      @('`quotations` / `quotation_items`', 'CREATE/READ/UPDATE', '廃棄見積ヘッダー、明細、採用候補'),
      @('`orders` / `order_items`', 'CREATE/READ/UPDATE', '廃棄発注ヘッダー、明細'),
      @('`application_documents`', 'CREATE/READ/UPDATE', '見積書、発注書、完了報告書、廃棄証明書等のファイルメタデータ。ファイル実体はAmazon S3に保存し、`file_path` にはS3オブジェクトキーのみ保持する'),
      @('`asset_ledgers`', 'READ/UPDATE', '移動承認時の設置場所原本反映、廃棄完了時の廃棄済み状態反映'),
      @('`asset_ledger_histories`', 'CREATE', '資産台帳更新の監査履歴'),
      @('`facility_locations`', 'READ', '移動元/移動先の設置場所表示と存在確認')
    ) },

    @{ Type = 'Heading1'; Text = '第3章 共通仕様' },
    @{ Type = 'Heading2'; Text = '認証・認可' },
    @{ Type = 'Paragraph'; Text = 'ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。' },
    @{ Type = 'Paragraph'; Text = '本API群で使用する `feature_code` は `transfer_disposal` である。画面表示用の `/auth/context` はUX用キャッシュであり、各業務APIでも同条件を再判定する。共有システム管理者アカウントは認証／認可 API 設計書の例外規定に従う。' },
    @{ Type = 'Table'; Headers = @('処理', '必要 feature_code', '判定テーブル', '説明'); Rows = @(
      @('移動・廃棄管理タブ表示', '`transfer_disposal`', '`user_facility_assignments` / `facility_feature_settings` / `user_facility_feature_settings`', '作業対象施設に対して実効有効な場合のみタブ表示と一覧APIを許可する'),
      @('移動承認・原本反映', '`transfer_disposal`', '同上', '対象移動申請の対象施設に対する権限を再判定する'),
      @('廃棄RFQグループ作成/廃棄タスク操作', '`transfer_disposal`', '同上', '対象廃棄申請または廃棄タスクの施設に対する権限を再判定する')
    ) },
    @{ Type = 'Heading2'; Text = '共通リクエストヘッダー' },
    @{ Type = 'Table'; Headers = @('ヘッダー', '必須', '説明'); Rows = @(
      @('Authorization', '✓', 'Bearer トークン'),
      @('X-Acting-Facility-Id', '✓', '作業対象施設ID。Bearer トークン上の担当施設と一致すること'),
      @('Idempotency-Key', 'POSTのみ✓', 'POST API の冪等性キー。同一キー・同一payloadの再送は初回結果を返す'),
      @('If-Match', '-', '更新競合を検出する場合のバージョン値。画面が保持する `updatedAt` または ETag を指定する')
    ) },
    @{ Type = 'Heading2'; Text = 'ファイル保存ルール' },
    @{ Type = 'Bullets'; Items = @(
      'GETの一覧・詳細・プレビューURL取得は表示用のREAD処理であり、`rfqs`、`applications`、見積、発注、ドキュメント、状態履歴を更新しない',
      '見積原本、発注書、完了報告書、廃棄証明書、マニフェスト、契約書、請求書等のファイル実体は、対象APIが multipart/form-data の `files` パートとして受け取り、API内でAmazon S3へPutObjectする',
      'ブラウザ上のファイル選択・入力途中・プレビュー表示はAPIを呼び出さず、業務DBに保存しない。見積書は「見積書の登録」、完了書類は「ドキュメント登録」、発注書は「発注登録」または発注登録モーダルの「確定」の押下時だけ、ファイルメタデータと画面入力項目を同一トランザクションで保存する',
      '本書ではファイル単体を先に保存するアップロードAPIを設けない。各登録APIがファイル本体とメタデータを一括で受け取り、業務登録成功時にだけ `application_documents` 行を作成する',
      '`application_documents.file_path` にはS3オブジェクトキーのみ保存し、S3バケット名、S3の直接URL、認可なしで利用できるURLはDBへ保存しない',
      'レスポンスではS3オブジェクトキー、S3バケット名、S3の直接URLを返さず、画面表示やダウンロードが必要な場合は認可済み `downloadUrl` を返す',
      'DBメタデータ保存または業務トランザクションに失敗した場合、保存済みS3オブジェクトをDeleteObjectで破棄する。PutObjectまたは失敗時のDeleteObjectに失敗した場合は 502 (`FILE_SAVE_FAILED`) を返却し、再試行可能な運用ログを残す',
      'ドキュメント削除APIは `application_documents.deleted_at` を設定する論理削除とし、S3オブジェクトは `deleted_at` 起点のS3ライフサイクルまたは後続クリーンアップで削除する'
    ) },
    @{ Type = 'Heading2'; Text = 'ステータス正規化' },
    @{ Type = 'Paragraph'; Text = '一覧表示ラベルとDB保存ステータスは分離する。画面表示だけに存在するラベルは以下の保存値へ正規化する。' },
    @{ Type = 'Table'; Headers = @('画面表示', '保存ステータス', '対象', '補足'); Rows = @(
      @('見積登録済（参考見積）', '見積DB登録済', '廃棄', '見積フェーズ `ESTIMATE` の保存値'),
      @('見積登録済（発注登録用見積）', 'rfqs.status=`発注見積登録済` / applications.status=`発注用見積登録済`', '廃棄', '見積フェーズ `ORDER_REGISTRATION` の保存値。グループと申請で保存値を分ける'),
      @('作業日確定', '納期確定', '廃棄', '廃棄予定日/作業日が確定した保存値'),
      @('申請を見送る', 'rfqs.status=`申請を見送る` / applications.status=`申請見送り`', '廃棄', '業務上の見送り終端。物理削除せず、`rfqs.deleted_at` は設定しない'),
      @('移動完了', '完了', '移動', '移動承認と原本反映が同一操作のため保存上は最終完了')
    ) },
    @{ Type = 'Heading2'; Text = '廃棄ライフサイクル' },
    @{ Type = 'Table'; Headers = @('工程', '保存ステータス', '主なAPI', '次工程'); Rows = @(
      @('申請受付/グループ作成', '新規申請', '`POST /quotation-data-box/transfer-management/disposal-groups`', '見積依頼'),
      @('見積依頼', '見積依頼済', '`POST /disposal-task/tasks/{disposalTaskId}/vendor-requests`', '見積登録'),
      @('見積登録（ESTIMATE）', '見積DB登録済', '`POST /disposal-task/tasks/{disposalTaskId}/quotations`', '見積登録（ORDER_REGISTRATION）または発注登録'),
      @('見積登録（ORDER_REGISTRATION）', 'rfqs.status=`発注見積登録済` / applications.status=`発注用見積登録済`', '`POST /disposal-task/tasks/{disposalTaskId}/quotations`', '発注登録'),
      @('発注登録', '発注済', '`POST /disposal-task/tasks/{disposalTaskId}/order`', '作業日/納期登録'),
      @('作業日/納期登録', '納期確定', '`POST /disposal-task/tasks/{disposalTaskId}/delivery-date`', '完了登録'),
      @('完了登録', '完了', '`POST /disposal-task/tasks/{disposalTaskId}/complete`', '終端。画面上はSTEP③から直接STEP④へ進むため、廃棄申請では `納期確定` から完了登録を許可する'),
      @('申請見送り', '申請見送り', '`POST /disposal-task/tasks/{disposalTaskId}/cancel`', '終端')
    ) },
    @{ Type = 'Heading2'; Text = '基本エラーレスポンス' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('code', 'string', '✓', 'アプリケーションエラーコード'),
      @('message', 'string', '✓', '利用者向けまたは運用者向けメッセージ'),
      @('details', 'object', '-', '入力項目別エラーなどの詳細'),
      @('traceId', 'string', '✓', 'ログ突合用ID')
    ) },

    @{ Type = 'Heading1'; Text = '第4章 データモデル' },
    @{ Type = 'Heading2'; Text = 'ApplicationAssetSummary' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $applicationAssetRows },
    @{ Type = 'Heading2'; Text = 'TransferApplicationListItem' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $transferApplicationRows },
    @{ Type = 'Heading2'; Text = 'DisposalApplicationListItem' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalApplicationRows },
    @{ Type = 'Heading2'; Text = 'DisposalGroupListItem' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalGroupRows },
    @{ Type = 'Heading2'; Text = 'DisposalTaskHeader' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalTaskHeaderRows },
    @{ Type = 'Heading2'; Text = 'DisposalOrigin' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
      @('applicationId', 'int64', '✓', '起票元を判定する申請ID'),
      @('applicationAssetId', 'int64', '-', '起票元を判定する申請明細ID'),
      @('isRemodelOrigin', 'boolean', '✓', '`rfq_applications.edit_list_id` または `edit_list_item_id` がリモデル編集リストを参照する場合 true'),
      @('editListId', 'int64', '-', 'リモデル編集リストID'),
      @('editListItemIds', 'int64[]', '✓', 'リモデル編集リスト明細ID。該当なしは空配列'),
      @('remodelCloseImpact', 'object', '✓', 'No.24のクローズ判定に使用する未終端対象・完了状況・原本登録状況')
    ) },
    @{ Type = 'Heading2'; Text = 'DisposalTaskStep' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalTaskStepRows },
    @{ Type = 'Heading2'; Text = 'DisposalVendorRequest' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalVendorRequestRows },
    @{ Type = 'Heading2'; Text = 'DisposalQuotation / DisposalQuotationItem' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalQuotationRows },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalQuotationItemRows },
    @{ Type = 'Heading2'; Text = 'DisposalOrder' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalOrderRows },
    @{ Type = 'Heading2'; Text = 'DocumentSummary / DocumentInput' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentRows },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentInputRows },
    @{ Type = 'Heading2'; Text = 'QuotationDocumentInput' },
    @{ Type = 'Table'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $quotationDocumentInputRows },

    @{ Type = 'Heading1'; Text = '第5章 API一覧' },
    @{ Type = 'Table'; Headers = @('No', 'API名', 'メソッド', 'パス', '用途', '権限'); Rows = @(
      @('1', '移動・廃棄管理一覧取得', 'GET', '/quotation-data-box/transfer-management/tasks', '移動申請受付、廃棄申請受付、廃棄RFQグループ一覧を取得する', '`transfer_disposal`'),
      @('2', '移動申請承認', 'POST', '/transfer-applications/{transferApplicationId}/approve', '移動申請を承認し資産台帳へ原本反映する', '`transfer_disposal`'),
      @('3', '廃棄RFQグループ作成', 'POST', '/quotation-data-box/transfer-management/disposal-groups', '選択した廃棄申請を廃棄申請タスクへ束ねる', '`transfer_disposal`'),
      @('4', '廃棄タスク詳細取得', 'GET', '/disposal-task/tasks/{disposalTaskId}', '廃棄申請タスク詳細を取得する', '`transfer_disposal`'),
      @('5', '廃棄申請見送り', 'POST', '/disposal-task/tasks/{disposalTaskId}/cancel', '発注前の廃棄タスクを申請見送りで終端する', '`transfer_disposal`'),
      @('6', '廃棄見積依頼書プレビュー', 'POST', '/disposal-task/tasks/{disposalTaskId}/vendor-requests/{rfqVendorId}/preview', '業者別の見積依頼書を生成し、画面表示用URLを返す。DB保存しない', '`transfer_disposal`'),
      @('7', '廃棄見積依頼先登録・送信', 'POST', '/disposal-task/tasks/{disposalTaskId}/vendor-requests', '見積依頼先を登録し、メール送信時に送信状態を保存する', '`transfer_disposal`'),
      @('8', '廃棄見積登録', 'POST', '/disposal-task/tasks/{disposalTaskId}/quotations', '廃棄見積ヘッダーと見積原本を登録する', '`transfer_disposal`'),
      @('9', '廃棄見積削除', 'DELETE', '/disposal-task/tasks/{disposalTaskId}/quotations/{quotationId}', '発注前の登録済み見積を論理削除する', '`transfer_disposal`'),
      @('10', '廃棄見積プレビュー', 'GET', '/disposal-task/tasks/{disposalTaskId}/quotations/{quotationId}/preview-url', '登録済み見積書の認可済みプレビューURLを取得する', '`transfer_disposal`'),
      @('11', '廃棄発注登録', 'POST', '/disposal-task/tasks/{disposalTaskId}/order', '採用見積から発注情報を作成する', '`transfer_disposal`'),
      @('12', '廃棄発注書プレビュー', 'POST', '/disposal-task/tasks/{disposalTaskId}/order/preview', '発注登録前の発注書を生成し、画面表示用URLを返す。DB保存しない', '`transfer_disposal`'),
      @('13', '廃棄作業日/納期登録', 'POST', '/disposal-task/tasks/{disposalTaskId}/delivery-date', '廃棄予定日を登録する', '`transfer_disposal`'),
      @('14', '廃棄完了書類登録', 'POST', '/disposal-task/tasks/{disposalTaskId}/documents', '廃棄依頼グループ単位で完了書類を追加する', '`transfer_disposal`'),
      @('15', '廃棄完了書類削除', 'DELETE', '/disposal-task/tasks/{disposalTaskId}/documents/{documentId}', '対象RFQの完了書類を論理削除する', '`transfer_disposal`'),
      @('16', '廃棄完了書類プレビュー', 'GET', '/disposal-task/tasks/{disposalTaskId}/documents/{documentId}/preview-url', '対象RFQの完了書類の認可済みプレビューURLを取得する', '`transfer_disposal`'),
      @('17', '廃棄完了登録', 'POST', '/disposal-task/tasks/{disposalTaskId}/complete', '登録済み完了書類を確認し廃棄タスクを完了する', '`transfer_disposal`')
    ) },

    @{ Type = 'Heading1'; Text = '第6章 API詳細設計' },
    @{ Type = 'EndpointBlocks'; Items = @(
      @{
        Title = '移動・廃棄管理一覧取得（/quotation-data-box/transfer-management/tasks）'
        Overview = '移動・廃棄管理タブの申請受付一覧と廃棄RFQグループ一覧を取得する。'
        Method = 'GET'
        Path = '/quotation-data-box/transfer-management/tasks'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('applicationType', 'query', 'string', '-', '`ALL` / `TRANSFER` / `DISPOSAL`'),
          @('statusTab', 'query', 'string', '-', '`ALL` / `INTAKE` / `VENDOR_SELECTION` / `QUOTE_COLLECTION` / `ORDERED` / `WORK_DATE_CONFIRMED` / `COMPLETED`'),
          @('keyword', 'query', 'string', '-', '申請番号、RFQ番号、QRラベル、品目名、申請者名の部分一致'),
          @('page', 'query', 'int32', '-', 'ページ番号。未指定時 1'),
          @('pageSize', 'query', 'int32', '-', '1ページ件数。未指定時 50')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '`applications.application_type IN (''TRANSFER'', ''DISPOSAL'')`、作業対象施設、`deleted_at IS NULL` の行を対象にする',
          '移動申請は未完了の受付行を中心に返し、承認済み/完了行は履歴表示対象としてフィルター時に返す',
          '廃棄申請受付は、未削除かつ有効な未終端 `DISPOSAL/RFQ` へ未接続の `DISPOSAL` 申請を返す。完了・申請見送り済みの過去リンクは履歴として保持し、現在割当の重複判定から除外する',
          '廃棄RFQグループは `rfqs.management_type=''DISPOSAL''`、`workflow_type=''RFQ''`、`rfqs.deleted_at IS NULL`、`rfqs.status<>''申請を見送る''` を基本条件とし、`rfq_applications` に `applications.application_type=''DISPOSAL''` が紐づく行を起点に対象申請と期限列を集約する',
          'グループ行には `managementType`、`workflowType`、`applicationType`、`isRemodelOrigin`、`editListId`、`editListItemIds`、`remodelCloseImpact` を返す。リモデル起点は `rfq_applications.edit_list_id` / `edit_list_item_id` から判定し、`rfqs.edit_list_id` や管理種別だけでは判定しない',
          '未登録資産を含む廃棄申請は `disposal_application_details.related_repair_application_id IS NOT NULL` の場合のみ受付一覧に出す',
          '表示ステータスは保存ステータス正規化表に従って返し、画面操作可否は `availableActions` で返す'
        )
        ResponseTitle = 'レスポンス（200：TransferDisposalTaskListResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('pendingTransferCount', 'int32', '✓', '未承認の移動申請件数'),
          @('pendingDisposalCount', 'int32', '✓', 'RFQグループ未作成の廃棄申請件数'),
          @('transferApplications', 'TransferApplicationListItem[]', '✓', '移動申請行'),
          @('disposalApplications', 'DisposalApplicationListItem[]', '✓', '廃棄申請受付行'),
          @('disposalGroups', 'DisposalGroupListItem[]', '✓', '廃棄RFQグループ行'),
          @('totalCount', 'int32', '✓', '総件数'),
          @('page', 'int32', '✓', 'ページ番号'),
          @('pageSize', 'int32', '✓', '1ページ件数')
        )
        ResponseSubtables = @(
          @{ Title = 'transferApplications要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $transferApplicationRows },
          @{ Title = 'disposalApplications要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalApplicationRows },
          @{ Title = 'disposalGroups要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalGroupRows }
        )
        StatusRows = @(
          @('200', '取得成功', 'TransferDisposalTaskListResponse'),
          @('400', '検索条件不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '移動申請承認（/transfer-applications/{transferApplicationId}/approve）'
        Overview = '起票済み移動申請を承認し、対象資産の設置場所を原本資産台帳へ反映する。'
        Method = 'POST'
        Path = '/transfer-applications/{transferApplicationId}/approve'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('transferApplicationId', 'path', 'int64', '✓', '`applications.application_id`。`application_type=''TRANSFER''`')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('approvedOn', 'date', '-', '承認日。未指定時は業務日付'),
          @('approvalComment', 'string', '-', '承認コメント'),
          @('expectedUpdatedAt', 'datetime', '-', '画面取得時の `applications.updated_at`。競合検出に使用する')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '`applications.application_type=''TRANSFER''`、作業対象施設、未削除であることを確認する',
          '現在ステータスが移動承認可能状態でない場合は 409 を返す',
          '`application_assets` の移動先施設/部署/部門/部屋/設置場所を検証し、対象 `asset_ledgers` を同一トランザクションで行ロックする',
          '対象 `asset_ledgers` の設置場所、部署、部門、部屋スナップショットを更新し、変更前後を `asset_ledger_histories` に登録する',
          '`applications.status=''完了''` に更新し、`application_status_histories` に承認・原本反映履歴を登録する',
          '移動承認と原本反映のどちらか一方だけが成功した状態を禁止する'
        )
        ResponseTitle = 'レスポンス（200：TransferApproveResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('transferApplicationId', 'int64', '✓', '承認した移動申請ID'),
          @('status', 'string', '✓', '`完了`'),
          @('statusLabel', 'string', '✓', '`移動完了`'),
          @('updatedAssetLedgerIds', 'int64[]', '✓', '原本反映した資産台帳ID'),
          @('updatedAt', 'datetime', '✓', '更新日時')
        )
        StatusRows = @(
          @('200', '移動承認成功', 'TransferApproveResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象移動申請または対象資産が存在しない', 'ErrorResponse'),
          @('409', '現在ステータス不整合、移動先不正、または競合更新', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄RFQグループ作成（/quotation-data-box/transfer-management/disposal-groups）'
        Overview = 'RFQ未作成の廃棄申請を選択し、廃棄申請タスクを作成する。'
        Method = 'POST'
        Path = '/quotation-data-box/transfer-management/disposal-groups'
        Auth = '要（Bearer）'
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
           @('applicationIds', 'int64[]', '✓', 'グループ化する廃棄申請ID。1件以上')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          'リクエストの `applicationIds[]` を重複排除し、対象 `applications` が `application_type=''DISPOSAL''`、作業対象施設、未削除、グループ化可能な状態であることを確認する',
          '未登録資産を含む申請は `disposal_application_details.related_repair_application_id` がある場合のみ許可する',
          '対象 `application_assets` 行を `FOR UPDATE` でロックし、同一資産に対する有効な未終端 `DISPOSAL/RFQ` の `rfq_applications` が存在する申請は `skipped[]` に `DISPOSAL_GROUP_ASSET_DUPLICATE` として返す。管理種別横断の一意制約は追加せず、完了・申請見送り済みの過去リンクは履歴として保持する',
          '作成対象が残った場合、`rfqs.management_type=''DISPOSAL''`、`workflow_type=''RFQ''`、`rfqs.status=''見積依頼''` で業務RFQグループを作成し、`rfq_no` は作成確定時に `DISP-yyyyMMdd-nnnn` 形式でサーバー採番する',
          '対象申請に紐づく廃棄対象 `application_assets` を `rfq_applications` に1明細1行で登録し、`rfq_applications.edit_list_id` / `edit_list_item_id` は起票元の行リンクから引き継ぐ。`applications.primary_rfq_no`、`applications.rfq_group_name` も更新する',
           '認証済みログインユーザーの所属部署・氏名・ユーザーIDを初回受付情報として `rfqs.reception_department`、`rfqs.reception_person`、`rfqs.reception_user_id` に保存し、`rfqs.reception_confirmed_at` を設定する。受付部署・受付担当者は申請側のスナップショットからコピーせず、受付連絡先だけは申請単位の受付情報スナップショットから `rfqs.reception_contact` へサーバー側で設定する。`rfqs.request_comment` はこのAPIでは設定せず、見積依頼完了時に保存する',
          '作成直後は `applications.status=''新規申請''`、`rfqs.status=''見積依頼''`、`application_status_histories`、`rfq_status_histories` を同一トランザクションで保存し、作成結果と除外結果を `created[]` / `skipped[]` で返す',
          '全件が除外された場合はグループを作成せず、409 (`DISPOSAL_GROUP_ASSET_DUPLICATE`) と `skipped[]` を返す。部分作成時も対象申請の一部だけが別トランザクションで成功する状態を作らない',
          '作成直後は廃棄タスク STEP1（見積依頼）を現在工程として返す'
        )
        ResponseTitle = 'レスポンス（201：DisposalGroupCreateResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('created', 'DisposalGroupCreateResult[]', '✓', '今回作成した廃棄依頼グループ。通常は1要素で、`disposalTaskId`、`rfqNo`、`groupName`、`applicationIds`、初期状態を含む'),
          @('skipped', 'DisposalGroupSkippedResult[]', '✓', '重複または対象条件不一致で今回の作成対象から除外した申請。`applicationId`、`reasonCode`、`reason` を含む')
        )
        ResponseSubtables = @(
          @{ Title = 'created要素（DisposalGroupCreateResult）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
            @('disposalTaskId', 'int64', '✓', '`rfqs.rfq_id`'),
            @('rfqNo', 'string', '✓', '確定時にサーバー採番した `DISP-yyyyMMdd-nnnn`'),
            @('groupName', 'string', '✓', '作成したグループ名'),
            @('applicationIds', 'int64[]', '✓', '紐づけた廃棄申請ID'),
            @('rfqStatus', 'string', '✓', '`見積依頼`'),
            @('applicationStatus', 'string', '✓', '`新規申請`'),
             @('statusLabel', 'string', '✓', '画面表示ステータス'),
             @('receptionDepartment', 'string', '-', '初回受付時に保存した受付部署'),
             @('receptionPerson', 'string', '-', '初回受付時に保存した受付担当者氏名'),
             @('receptionUserId', 'int64', '-', '初回受付を行ったユーザーID'),
             @('receptionConfirmedAt', 'datetime', '-', '初回受付情報を保存した日時')
          ) },
          @{ Title = 'skipped要素（DisposalGroupSkippedResult）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
            @('applicationId', 'int64', '✓', '作成対象から除外した申請ID'),
            @('reasonCode', 'string', '✓', '`DISPOSAL_GROUP_ASSET_DUPLICATE` 等の除外理由コード'),
            @('reason', 'string', '✓', '除外理由')
          ) }
        )
        StatusRows = @(
          @('201', '作成成功', 'DisposalGroupCreateResponse'),
          @('400', '入力不正、申請件数不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄申請が存在しない', 'ErrorResponse'),
          @('409', '有効な別グループへの資産重複、未登録資産条件不一致、または現在ステータス不整合。全件除外時は `DISPOSAL_GROUP_ASSET_DUPLICATE`', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄タスク詳細取得（/disposal-task/tasks/{disposalTaskId}）'
        Overview = '廃棄申請管理画面に表示する申請情報、対象資産、工程、見積依頼先、見積、発注、添付を取得する。'
        Method = 'GET'
        Path = '/disposal-task/tasks/{disposalTaskId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '`rfqs.management_type=''DISPOSAL''`、`workflow_type=''RFQ''`、対象施設、`rfqs.deleted_at IS NULL` を確認し、`workflow_type=''DISPOSAL''` の旧廃棄承認ワークフローは本タスク詳細の対象外とする',
          '`rfq_applications` から対象 `applications`、`application_assets`、`disposal_application_details` を取得する',
          '`rfq_applications.edit_list_id` / `edit_list_item_id` を起点に各申請・明細の `isRemodelOrigin`、`editListId`、`editListItemIds`、`remodelCloseImpact` を算出する。起票元は `rfqs.edit_list_id` や管理種別だけで判定しない',
          '現在STEPは `rfqs.status` をグループ正本、`applications.status` を申請単位の正本とし、有効な `rfq_vendors`、`quotations`、`orders`、`application_documents` を突合して算出する。`application_task_steps` は補助タイムラインとしてのみ返す',
          '`rfq_vendors`、`quotations`、`quotation_items`、`orders`、`application_documents` を必要に応じて結合し、`rfqs.reception_department`、`reception_person`、`reception_user_id`、`reception_confirmed_at`、`reception_contact`、`request_comment` は保存済みのグループ情報として返す。`request_comment` は `rfqs.request_comment` を正本とし、ログインユーザー情報で上書きしない',
          '`documents` は対象RFQの完了書類（`owner_type=''RFQ''`、`rfq_id=disposalTaskId`、`step_code=''COMPLETE''`、`document_category=''COMPLETE''`）だけを返す。見積書は `quotations[].documentId`、発注書は `order.documentId` で返し、同じドキュメントを `documents` に重複掲載しない',
          'URLの `groupId` を `disposalTaskId` として扱う'
        )
        ResponseTitle = 'レスポンス（200：DisposalTaskDetailResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('task', 'DisposalTaskHeader', '✓', '廃棄タスクヘッダ。保存済みのグループご依頼事項を含む'),
          @('applications', 'DisposalApplicationListItem[]', '✓', '紐づく廃棄申請'),
          @('steps', 'DisposalTaskStep[]', '✓', '工程表示情報'),
          @('vendorRequests', 'DisposalVendorRequest[]', '✓', '見積依頼先'),
          @('quotations', 'DisposalQuotation[]', '✓', '登録済み見積'),
          @('order', 'DisposalOrder', '-', '発注情報'),
          @('documents', 'DocumentSummary[]', '✓', '添付ドキュメント'),
          @('availableActions', 'string[]', '✓', '表示可能操作'),
          @('origins', 'DisposalOrigin[]', '✓', '申請・申請明細ごとの起票元とリモデルクローズ影響')
        )
        ResponseSubtables = @(
          @{ Title = 'task要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalTaskHeaderRows },
          @{ Title = 'applications要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalApplicationRows },
          @{ Title = 'steps要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalTaskStepRows },
          @{ Title = 'vendorRequests要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalVendorRequestRows },
          @{ Title = 'quotations要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalQuotationRows },
          @{ Title = 'quotations配下items要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalQuotationItemRows },
          @{ Title = 'order要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $disposalOrderRows },
          @{ Title = 'documents要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentRows }
        )
        StatusRows = @(
          @('200', '取得成功', 'DisposalTaskDetailResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクが存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄見積依頼書プレビュー（/disposal-task/tasks/{disposalTaskId}/vendor-requests/{rfqVendorId}/preview）'
        Overview = '業者別の見積依頼書を画面表示用に生成する。プレビュー表示だけでは業務DBへ保存しない。'
        Method = 'POST'
        Path = '/disposal-task/tasks/{disposalTaskId}/vendor-requests/{rfqVendorId}/preview'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`'),
          @('rfqVendorId', 'path', 'int64', '✓', '`rfq_vendors.rfq_vendor_id`')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('requestComment', 'string', '-', '`rfqs.request_comment` の保存値。未保存の画面入力がある場合だけプレビューへ一時反映し、DBへ保存しない')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象廃棄タスクと対象 `rfq_vendors` の施設スコープを確認する',
          '`rfqs.reception_department`、`rfqs.reception_person`、`rfqs.reception_user_id`、`rfqs.reception_contact`、`rfqs.request_comment` の保存値を使用する。受付部署・受付担当者はリクエスト本文から受け付けず、現在ログインしているユーザーの情報でも上書きしない。`requestComment` が指定された場合だけご依頼事項をプレビューへ一時反映し、DBへ保存しない',
          '見積依頼書を生成し、短時間有効な認可済み `previewUrl` またはPDF応答を返す。S3、`application_documents`、`rfq_vendors` は更新しない'
        )
        ResponseTitle = 'レスポンス（200：DocumentPreviewResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('previewUrl', 'string', '✓', '見積依頼書表示用の短時間有効な認可済みURL'),
          @('fileName', 'string', '✓', '表示上のファイル名'),
          @('expiresAt', 'datetime', '✓', 'URLの有効期限')
        )
        StatusRows = @(
          @('200', 'プレビュー生成成功', 'DocumentPreviewResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクまたは依頼先が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄申請見送り（/disposal-task/tasks/{disposalTaskId}/cancel）'
        Overview = '発注前の廃棄タスクを申請見送りとして終端する。'
        Method = 'POST'
        Path = '/disposal-task/tasks/{disposalTaskId}/cancel'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象廃棄タスクの `rfqs.status` が発注前（`見積依頼` / `見積依頼済` / `見積DB登録済` / `発注見積登録済`）であることを確認する。`発注済`、`納期確定`、`完了` 以降は拒否する',
          '紐づく全 `applications.status` を `申請見送り`、`rfqs.status` を `申請を見送る` に更新し、`application_status_histories` と `rfq_status_histories` を同一トランザクションで登録する',
          '`rfq_vendors` に送信済み依頼がある場合は、未回答分を `CANCELED` に更新する',
          '`rfqs.deleted_at` は設定しない。未確定の `rfq_vendors`、`quotations`、`quotation_items`、`quotation_item_application_links`、見積書の `application_documents` を同一トランザクションで論理削除し、`rfq_applications`、起票元申請、状態履歴は保持する。資産台帳は更新しない',
          '画面入力を受け付けず、見積グループ解除後に一覧（`/quotation-data-box/transfer-management`）へ戻れる結果を返す'
        )
        ResponseTitle = 'レスポンス（200：DisposalTaskActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $actionResponseRows
        StatusRows = @(
          @('200', '見送り成功', 'DisposalTaskActionResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクが存在しない', 'ErrorResponse'),
          @('409', '発注済み以降、完了済み、または現在ステータス不整合', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄見積依頼先登録・送信（/disposal-task/tasks/{disposalTaskId}/vendor-requests）'
        Overview = '廃棄申請タスクの見積依頼先を登録し、業者別メール送信と見積依頼完了を管理する。'
        Method = 'POST'
        Path = '/disposal-task/tasks/{disposalTaskId}/vendor-requests'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
           @('requestComment', 'string', '-', '`rfqs.request_comment`。廃棄依頼グループ単位のご依頼事項'),
          @('action', 'string', '✓', '`SAVE_DRAFT` / `SEND_SELECTED` / `SEND_ALL` / `COMPLETE_REQUEST`'),
          @('targetRfqVendorIds', 'int64[]', '-', '`SEND_SELECTED` の場合にメール送信対象の既存依頼先IDを指定する'),
          @('vendors', 'DisposalVendorRequestInput[]', '✓', '見積依頼先一覧。1件以上')
        )
        RequestSubtables = @(
          @{ Title = 'vendors要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
            @('vendorId', 'int64', '-', '業者マスタID'),
            @('vendorName', 'string', '✓', '依頼先業者名'),
            @('contactPerson', 'string', '-', '担当者名'),
            @('email', 'string', '-', 'メールアドレス'),
            @('phone', 'string', '-', '電話番号'),
            @('dueOn', 'date', '-', '回答期限'),
            @('requestNote', 'string', '-', '依頼先別補足')
          ) }
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象廃棄タスクの `rfqs.status` が `見積依頼` または `見積依頼済` の見積依頼操作可能状態であることを確認する。作成直後の `applications.status=''新規申請''` はグループ作成直後の申請単位状態であり、グループSTEPの代替にはしない',
           '`action=''SAVE_DRAFT''` では、`requestComment` を `rfqs.request_comment` に保存し、DRAFTの業者行と同一トランザクションで確定する。受付部署・受付担当者・受付連絡先は更新せず、初回受付時に `rfqs` へ保存した値を保持する。画面の入力途中やファイル選択だけでは保存しない',
          '`vendors` の新規行は `rfq_vendors.request_status=''DRAFT''` で作成し、既存DRAFT行のみ業者情報、期限、依頼事項を更新できる',
          '`action=''SEND_SELECTED''` は `targetRfqVendorIds` のDRAFT行を対象に、見積依頼書を生成して業者メールを送信し、送信成功後に `request_status=''SENT''`、`requested_at`、`requested_by_user_id` を保存する。画面の業者別「メール送信」の保存単位はこの操作とする',
          '`action=''SEND_ALL''` の場合は対象廃棄タスク配下のDRAFT行を一括送信し、全件の送信成功後に各行を `SENT` へ更新する。1件でも送信失敗した場合は失敗行を `DRAFT` のまま残し、502 (`EMAIL_SEND_FAILED`) を返す',
           '`action=''COMPLETE_REQUEST''` の場合、送信済み依頼先が1件以上あることを確認し、`requestComment` を `rfqs.request_comment`、最早回答期限を `disposal_application_details.quotation_due_on` に保存したうえで、対象 `applications.status` を `見積依頼済`、`rfqs.status` を `見積依頼済` に更新する。受付部署・受付担当者・受付連絡先は更新しない',
          '`disposal_application_details.quotation_due_on` には送信済み依頼先の最も早い `due_on` を一覧期限として保存する',
          '見積依頼書のプレビューは都度生成し、プレビュー表示だけでは `rfq_vendors` や `application_documents` を更新しない'
        )
        ResponseTitle = 'レスポンス（200：DisposalTaskActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $actionResponseRows
        StatusRows = @(
          @('200', '見積依頼先登録成功', 'DisposalTaskActionResponse'),
          @('400', '依頼先必須不足、メール形式不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクが存在しない', 'ErrorResponse'),
          @('409', '現在ステータスが見積依頼可能状態ではない', 'ErrorResponse'),
          @('502', 'メール送信に失敗した', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄見積登録（/disposal-task/tasks/{disposalTaskId}/quotations）'
        Overview = '画面の「見積書の登録」押下時に、見積情報と選択済み見積原本を登録済み見積一覧へ追加し、見積フェーズに応じてグループと申請の状態を更新する。'
        Method = 'POST'
        Path = '/disposal-task/tasks/{disposalTaskId}/quotations'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
        )
        RequestTitle = 'リクエストボディ（multipart/form-data）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('payload.rfqVendorId', 'int64', '✓', '`rfq_vendors.rfq_vendor_id`。STEP①で登録した業者から選択'),
          @('payload.vendorId', 'int64', '-', '業者マスタID。業者行に保持されている場合はサーバー側で補完'),
          @('payload.quotationPhase', 'string', '✓', '`ESTIMATE`（参考見積） / `ORDER_REGISTRATION`（発注登録用見積）'),
          @('payload.vendorQuotationNo', 'string', '-', '画面の見積No.。`quotations.vendor_quotation_no` に保存'),
          @('payload.quotationOn', 'date', '✓', '見積日'),
          @('payload.totalAmountExclTax', 'decimal', '-', '税抜合計金額'),
          @('payload.accountDivisionCode', 'string', '-', '画面の勘定科目。`quotations.account_division_code` に保存'),
          @('payload.items', 'DisposalQuotationItemInput[]', '-', '明細入力を行う場合のみ指定。明細なしの場合は空配列を許可する'),
          @('payload.document', 'QuotationDocumentInput', '✓', '選択した見積原本のメタデータ。`documentType=''見積書''`、`owner_type=''QUOTATION''`、`step_code=''QUOTATION''`、`document_category=''QUOTATION''` はAPIが固定し、1回の登録で1ファイル'),
          @('file', 'binary', '✓', '`payload.document.filePartName` で指定された見積原本ファイル本体')
        )
        RequestSubtables = @(
          @{ Title = 'items要素'; Headers = @('フィールド', '型', '必須', '説明'); Rows = @(
            @('itemName', 'string', '✓', '明細名'),
            @('quantity', 'int32', '✓', '数量'),
            @('unitPrice', 'decimal', '-', '単価'),
            @('amount', 'decimal', '-', '金額'),
            @('accountTitle', 'string', '-', '勘定科目。`quotation_items.account_title` に保存'),
            @('applicationAssetId', 'int64', '-', '対象申請明細ID。指定時はタスク所属を検証してリンクを保存'),
            @('editListId', 'int64', '-', 'リモデル起点の場合の編集リストID'),
            @('editListItemId', 'int64', '-', 'リモデル起点の場合の編集リスト明細ID'),
            @('linkedQuantity', 'int32', '-', '見積明細と申請明細の紐づけ数量'),
            @('linkStatus', 'string', '-', 'リンク状態')
          ) },
          @{ Title = 'document要素（QuotationDocumentInput）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $quotationDocumentInputRows }
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象廃棄タスクが `見積依頼済`、`見積DB登録済` または `発注用見積登録済` の見積登録可能状態であることを確認する',
          '画面のファイル選択だけではDB保存せず、`payload.document` と `file` が揃った「見積書の登録」押下時にだけ後続処理を行う',
          '`payload.document.filePartName` がmultipartのファイルパートに存在することを確認し、拡張子・MIME Typeは見積原本として許可された形式に限定する',
          '`payload.rfqVendorId` が対象 `rfqs` に属し、削除されていない `rfq_vendors.rfq_vendor_id` であることを検証する。業者不一致は409 (`QUOTATION_VENDOR_MISMATCH`) とする',
          '`payload.quotationPhase`、`payload.document.storageFormat`、業者、見積No.、見積日、金額、勘定科目をバリデーションし、`quotations`、必要な `quotation_items`、`quotation_item_application_links`、`application_documents` を同一トランザクションで作成する',
          '`quotations.quotation_no` はサーバー採番し、画面入力の見積No.は `quotations.vendor_quotation_no` に保存する',
          '`quotations` は `rfq_id`、`rfq_vendor_id`、業者スナップショット、見積フェーズ、金額、見積番号で作成し、`quotationId` を確定したうえで、指定された明細と対象申請明細のリンクを保存する。`quotation_items.account_title` を使用する場合は明細へ保存する',
          '見積原本の `application_documents.document_date` は `payload.quotationOn`、`document_no` は画面入力の見積No.（`payload.vendorQuotationNo`）を基準に保存し、`storage_format` は `payload.document.storageFormat` を保存する',
          '見積原本ファイル本体をAPI内でAmazon S3へPutObjectし、S3オブジェクトキーは `application-documents/facility-{facilityId}/{yyyy}/{mm}/{uploadUuid}.{ext}` 形式で発行する。keyは保存場所識別子であり、`disposalTaskId` や `quotationId` などの業務IDを含めない',
          '見積原本は `application_documents` に `owner_type=''QUOTATION''`、`quotation_id`、`step_code=''QUOTATION''`、`document_category=''QUOTATION''`、`document_type=''見積書''`、`document_date`、`document_no`、`storage_format`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`uploaded_by_user_id`、`uploaded_at` として保存する。S3バケット名やHTTPS URLはDBへ保存しない',
          'Amazon S3保存後にDBメタデータ保存または見積登録トランザクションへ失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄する。PutObjectまたは失敗時のDeleteObjectに失敗した場合は 502 (`FILE_SAVE_FAILED`) を返却し、再試行可能な運用ログを残す',
          '`payload.quotationPhase=''ESTIMATE''` の場合は `rfqs.status=''見積DB登録済''`、対象全 `applications.status=''見積DB登録済''` とし、`ORDER_REGISTRATION` の場合は `rfqs.status=''発注見積登録済''`、対象全 `applications.status=''発注用見積登録済''` とする。両方の状態履歴を同一トランザクションで登録する',
          '`disposal_application_details.order_deadline_on` に発注期限を保存する。発注期限入力が画面にない場合は既存値を維持する'
        )
        ResponseTitle = 'レスポンス（201：DisposalQuotationResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $disposalQuotationRows
        StatusRows = @(
          @('201', '見積登録成功', 'DisposalQuotationResponse'),
          @('400', '入力不正、ファイル不足、条件付き項目不足', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクが存在しない', 'ErrorResponse'),
          @('409', '現在ステータスが見積登録可能状態ではない、または見積業者が対象RFQの依頼先ではない', 'ErrorResponse'),
          @('502', 'Amazon S3 への見積原本保存またはロールバック削除に失敗した', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄見積削除（/disposal-task/tasks/{disposalTaskId}/quotations/{quotationId}）'
        Overview = '発注前の登録済み廃棄見積を論理削除する。'
        Method = 'DELETE'
        Path = '/disposal-task/tasks/{disposalTaskId}/quotations/{quotationId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`'),
          @('quotationId', 'path', 'int64', '✓', '`quotations.quotation_id`')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象見積が対象廃棄タスクの `rfq_id` に紐づき、`quotations.deleted_at IS NULL` であることを確認する',
          '発注登録済み、採用済みロック、または `rfqs.status` が `発注済` / `納期確定` / `完了` の場合は削除不可とする',
          '`quotations.deleted_at`、配下の `quotation_items.deleted_at`、`quotation_item_application_links.deleted_at`、見積原本の `application_documents.deleted_at` を論理削除する',
          '有効な `quotation_phase=''ORDER_REGISTRATION''` の見積が0件になった場合、`rfqs.status` と対象全 `applications.status` を `見積依頼済` に戻し、`disposal_application_details.order_deadline_on` をクリアする。状態履歴も同一トランザクションで保存する'
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @('レスポンスボディなし。')
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクまたは対象見積が存在しない', 'ErrorResponse'),
          @('409', '発注済み、採用済み、または現在ステータス不整合で削除不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄見積プレビュー（/disposal-task/tasks/{disposalTaskId}/quotations/{quotationId}/preview-url）'
        Overview = 'STEP②の「一覧表示」で取得した登録済み見積一覧から、選択した見積書を右ペインで表示するための認可済みURLを取得する。'
        Method = 'GET'
        Path = '/disposal-task/tasks/{disposalTaskId}/quotations/{quotationId}/preview-url'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`'),
          @('quotationId', 'path', 'int64', '✓', '`quotations.quotation_id`')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象見積が対象廃棄申請タスクに紐づき、`quotations.deleted_at IS NULL` であることを確認する',
          '見積原本に対応する `application_documents(owner_type=''QUOTATION'', quotation_id, step_code=''QUOTATION'')` を取得する',
          '短時間有効な認可済み `previewUrl` を生成して返す。S3オブジェクトキー、バケット名、直接URLは返さない。DBは更新しない'
        )
        ResponseTitle = 'レスポンス（200：DocumentPreviewResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('quotationId', 'int64', '✓', '対象見積ID'),
          @('documentId', 'int64', '✓', '見積原本ドキュメントID'),
          @('previewUrl', 'string', '✓', '右ペイン表示用の認可済みURL'),
          @('expiresAt', 'datetime', '✓', 'URLの有効期限')
        )
        StatusRows = @(
          @('200', 'プレビューURL取得成功', 'DocumentPreviewResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスク、見積、または見積原本が存在しない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄発注登録（/disposal-task/tasks/{disposalTaskId}/order）'
        Overview = 'STEP②の「発注書の発行」選択後、「発注登録」または発注登録モーダルの「確定（発注No 配番）」押下で、採用見積から発注を作成し発注済へ進める。'
        Method = 'POST'
        Path = '/disposal-task/tasks/{disposalTaskId}/order'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
        )
        RequestTitle = 'リクエストボディ（application/json）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('payload.quotationId', 'int64', '✓', '採用見積ID'),
          @('payload.settlementOn', 'date', '✓', '画面の決済日。`orders.settlement_on` に保存する'),
          @('payload.settlementNo', 'string', '-', '画面の決済No.。`orders.settlement_no` に保存する'),
          @('payload.orderDocumentDeliveryMethod', 'string', '✓', '`PRINT`（印刷） / `EMAIL`（mail送信）。発注登録モーダルの選択値'),
          @('payload.orderOn', 'date', '-', '発注日。未指定時は業務日付'),
          @('payload.paymentTerms', 'string', '-', '支払条件')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象見積が対象廃棄タスクに紐づき、削除されていないことを確認する',
          'ファイル選択・発注書プレビュー・モーダル表示だけでは `orders` / `application_documents` を保存しない。画面の「発注登録」またはモーダルの「確定（発注No 配番）」押下時にだけ後続処理を行う',
          '`orders.order_no` はサーバーで採番し、リクエストの `orderNo` は受け付けない',
          '`orders` を作成し、採用見積の `quotation_items` が存在する場合のみ `order_items` を作成する',
          '`orders.order_type=''廃棄委託''`、`orders.settlement_no`、`orders.settlement_on`、`orders.status=''ORDERED''`、`payment_terms`（未入力時 `未指定`）、`order_on`、見積合計金額を保存する。廃棄グループとの整合は `orders.rfq_id` と `rfq_applications` で検証する',
          '`orderDocumentDeliveryMethod=''PRINT''` の場合は発注書を生成し、`order_document_delivery_status=''PRINTED''`、`order_document_sent_at` を保存する。`EMAIL` の場合は発注先メールへ送信し、成功時のみ `SENT` と送信日時を保存する',
          '発注書のメタデータは `application_documents.owner_type=''RFQ''`、`rfq_id=disposalTaskId`、`step_code=''ORDER''`、`document_category=''ORDER''`、`document_type=''注文書''`、`document_no=orders.order_no`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`uploaded_by_user_id`、`uploaded_at` として、発注登録トランザクション内で保存する。発注書の実体はAPIが生成し、画面からファイルをアップロードしない',
          'Amazon S3保存後にDBメタデータ保存または発注登録トランザクションへ失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄する。PutObjectまたは失敗時のDeleteObjectに失敗した場合は 502 (`FILE_SAVE_FAILED`) を返却し、再試行可能な運用ログを残す',
          '`EMAIL` のメール送信に失敗した場合は、`orders`、`order_items`、発注書メタデータ、`rfqs.status`、`applications.status`、状態履歴を確定せず、502 (`EMAIL_SEND_FAILED`) を返す。メール送信済みでDB更新に失敗した場合は冪等キーと `traceId` で再実行・調査できる状態を残す',
          '発注登録成功時は `rfqs.status=''発注済''`、対象全 `applications.status=''発注済''` に更新し、`rfq_status_histories` と `application_status_histories` を登録する',
          '`disposal_application_details.ordered_on`、`order_no`、業者スナップショットを保存する'
        )
        ResponseTitle = 'レスポンス（200：DisposalOrderResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $disposalOrderRows
        StatusRows = @(
          @('200', '発注登録成功', 'DisposalOrderResponse'),
          @('400', '入力不正、発注書送付方法不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクまたは見積が存在しない', 'ErrorResponse'),
          @('409', '現在ステータス不整合、見積が対象廃棄タスクに紐づかない、または発注重複', 'ErrorResponse'),
          @('502', '発注書保存、メール送信、またはロールバック削除に失敗した', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄発注書プレビュー（/disposal-task/tasks/{disposalTaskId}/order/preview）'
        Overview = 'STEP②のプレビューまたは発注登録モーダルで、発注登録前の発注書を確認する。プレビュー表示だけでは発注No.採番やDB保存を行わない。'
        Method = 'POST'
        Path = '/disposal-task/tasks/{disposalTaskId}/order/preview'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
        )
        RequestTitle = 'リクエストボディ（application/json）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('quotationId', 'int64', '✓', '採用見積ID'),
          @('settlementOn', 'date', '✓', '画面入力の決済日'),
          @('settlementNo', 'string', '-', '画面入力の決済No.'),
          @('orderOn', 'date', '-', '発注日。未指定時は業務日付'),
          @('paymentTerms', 'string', '-', '支払条件')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象廃棄タスクと採用見積の紐づきを確認する',
          'リクエスト本文の未保存入力を使用して発注書を都度生成する',
          '発注No.は仮表示または未表示とし、`orders`、`application_documents`、ステータス履歴、送付状態を更新しない',
          '短時間有効な認可済み `previewUrl` を返す。S3へ保存する場合も業務ドキュメント行は作成せず、登録APIの失敗時にクリーンアップする'
        )
        ResponseTitle = 'レスポンス（200：OrderPreviewResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('previewUrl', 'string', '✓', '発注書表示用の認可済みURL'),
          @('fileName', 'string', '✓', '発注書の表示ファイル名'),
          @('expiresAt', 'datetime', '✓', 'URLの有効期限')
        )
        StatusRows = @(
          @('200', '発注書プレビュー生成成功', 'OrderPreviewResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクまたは採用見積が存在しない', 'ErrorResponse'),
          @('409', '発注可能なステータスではない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄作業日/納期登録（/disposal-task/tasks/{disposalTaskId}/delivery-date）'
        Overview = '廃棄予定日または作業日を登録し、納期確定へ進める。'
        Method = 'POST'
        Path = '/disposal-task/tasks/{disposalTaskId}/delivery-date'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
        )
        RequestTitle = 'リクエストボディ'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('disposalScheduledOn', 'date', '✓', '廃棄予定日/作業日')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象廃棄タスクが `発注済` または `納期確定` の日程更新可能状態であることを確認する',
          '`disposal_application_details.disposal_scheduled_on` を更新し、グループ内の対象申請へ必要な廃棄予定日を反映する',
          '`rfqs.status` を `納期確定`、対象全 `applications.status` を `納期確定` に更新し、`rfq_status_histories` と `application_status_histories` を同一トランザクションで登録する',
          '画面表示の `作業日確定` は保存値 `納期確定` から派生させる'
        )
        ResponseTitle = 'レスポンス（200：DisposalTaskActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $actionResponseRows
        StatusRows = @(
          @('200', '作業日/納期登録成功', 'DisposalTaskActionResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクが存在しない', 'ErrorResponse'),
          @('409', '現在ステータスが日程登録可能状態ではない', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄ドキュメント登録（/disposal-task/tasks/{disposalTaskId}/documents）'
        Overview = 'STEP④の「ドキュメント登録」押下時に、完了書類のファイル本体と画面入力項目を登録する。'
        Method = 'POST'
        Path = '/disposal-task/tasks/{disposalTaskId}/documents'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
        )
        RequestTitle = 'リクエストボディ（multipart/form-data）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('payload.document', 'DocumentInput', '✓', '登録する完了書類メタデータ。所有者と工程はAPIが廃棄タスクから確定する'),
          @('file', 'binary', '✓', '`payload.document.filePartName` で指定されたファイル本体')
        )
        RequestSubtables = @(
          @{ Title = 'document要素（DocumentInput）'; Headers = @('フィールド', '型', '必須', '説明'); Rows = $documentInputRows }
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象廃棄タスクが存在し、完了後削除済みでないことを確認する',
          'ファイル選択だけではDB保存せず、`payload.document` と `file` が揃った「ドキュメント登録」押下時にだけ後続処理を行う',
          '`payload.document.filePartName` がmultipartのファイルパートに存在することを確認し、`documentType` に応じた拡張子・MIME Typeを受け付ける',
          '`documentType=''その他''` の場合は `otherDocumentName` を必須とし、`documentType=''見積書（変更が発生した場合）''` の場合は `actualAmountExclTax` と `accountDivisionCode` を必須とする。それ以外の種別では条件付き項目をNULLとして保存する',
          '廃棄完了書類は廃棄依頼グループ単位で保存し、`owner_type=''RFQ''`、`rfq_id=disposalTaskId`、`application_id=NULL`、`application_asset_id=NULL`、`order_id=NULL`、`step_code=''COMPLETE''`、`document_category=''COMPLETE''` を設定する。`applicationId`、`ownerType`、`orderId` などの所有者指定はリクエストから受け付けない',
          '対象タスクが `rfqs.management_type=''DISPOSAL''`、`workflow_type=''RFQ''`、`rfqs.status=''納期確定''` であることを確認する。完了済み・申請見送り済み・論理削除済みのタスクへの登録は拒否する',
          '完了書類のドキュメント種別は、`院内決済書類`、`見積書（変更が発生した場合）`、`産業廃棄物処理委託契約書`、`注文書`、`注文請書`、`廃棄物証明書（処分完了報告書）`、`産業廃棄物管理票（マニフェスト）`、`請求書`、`その他` のいずれかとする',
          'ファイル本体をAPI内でAmazon S3へPutObjectし、S3オブジェクトキーは `application-documents/facility-{facilityId}/{yyyy}/{mm}/{uploadUuid}.{ext}` 形式で発行する。keyは保存場所識別子であり、`disposalTaskId` などの業務IDを含めない',
          '`application_documents` に `document_date`、`document_no`、`other_document_name`、`actual_amount_excl_tax`、`account_division_code`、`storage_format`、`title`、`file_name`、`file_path`、`mime_type`、`file_size_bytes`、`content_hash`、`uploaded_by_user_id`、`uploaded_at` を保存する',
          '`application_documents.file_path` にはS3オブジェクトキーのみ保存し、S3バケット名やHTTPS URLはDBへ保存しない',
          'Amazon S3保存後にDBメタデータ保存へ失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄する。PutObjectまたは失敗時のDeleteObjectに失敗した場合は 502 (`FILE_SAVE_FAILED`) を返却し、再試行可能な運用ログを残す'
        )
        ResponseTitle = 'レスポンス（201：DocumentSummary）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $documentRows
        StatusRows = @(
          @('201', 'ドキュメント登録成功', 'DocumentSummary'),
          @('400', '入力不正、条件付き項目不足、許可されないドキュメント種別', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクが存在しない', 'ErrorResponse'),
          @('409', '対象タスクが登録可能状態ではない、またはドキュメント所有スコープが不一致', 'ErrorResponse'),
          @('502', 'Amazon S3 へのドキュメント保存またはロールバック削除に失敗した', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄ドキュメント削除（/disposal-task/tasks/{disposalTaskId}/documents/{documentId}）'
        Overview = '廃棄申請タスクに紐づくドキュメントを論理削除する。'
        Method = 'DELETE'
        Path = '/disposal-task/tasks/{disposalTaskId}/documents/{documentId}'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`'),
          @('documentId', 'path', 'int64', '✓', '`application_documents.application_document_id`')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象ドキュメントが `owner_type=''RFQ''`、`rfq_id=disposalTaskId`、`application_id IS NULL`、`application_asset_id IS NULL`、`order_id IS NULL`、`step_code=''COMPLETE''`、`document_category=''COMPLETE''` であることを確認する。申請添付、見積書、発注書、他タスクのドキュメントは対象外とする',
          '対象タスクが完了前であることを確認する。完了済みタスクの完了書類、発注書、見積書、完了証跡は削除不可とする',
          '`application_documents.deleted_at` を設定する。S3オブジェクトは `deleted_at` 起点のS3ライフサイクルまたは後続クリーンアップで削除する'
        )
        ResponseTitle = 'レスポンス（204：No Content）'
        ResponseLines = @('レスポンスボディなし。')
        StatusRows = @(
          @('204', '削除成功', '-'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクまたは対象RFQの完了書類が存在しない', 'ErrorResponse'),
          @('409', '完了書類ではない、他タスクの書類である、または確定済み工程で削除不可', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄ドキュメントプレビュー（/disposal-task/tasks/{disposalTaskId}/documents/{documentId}/preview-url）'
        Overview = 'STEP④の一覧表示または右ペインで選択した完了書類をプレビューするための認可済みURLを取得する。'
        Method = 'GET'
        Path = '/disposal-task/tasks/{disposalTaskId}/documents/{documentId}/preview-url'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`'),
          @('documentId', 'path', 'int64', '✓', '`application_documents.application_document_id`')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象ドキュメントが `owner_type=''RFQ''`、`rfq_id=disposalTaskId`、`application_id IS NULL`、`application_asset_id IS NULL`、`order_id IS NULL`、`step_code=''COMPLETE''`、`document_category=''COMPLETE''` の完了書類であることを確認する。見積書・発注書のプレビューは各専用APIで扱う',
          '短時間有効な認可済み `previewUrl` を生成して返す。S3オブジェクトキー、バケット名、直接URLは返さず、DBも更新しない'
        )
        ResponseTitle = 'レスポンス（200：DocumentPreviewResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = @(
          @('documentId', 'int64', '✓', '対象ドキュメントID'),
          @('previewUrl', 'string', '✓', '右ペイン表示用の認可済みURL'),
          @('expiresAt', 'datetime', '✓', 'URLの有効期限')
        )
        StatusRows = @(
          @('200', 'プレビューURL取得成功', 'DocumentPreviewResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクまたは対象RFQの完了書類が存在しない', 'ErrorResponse'),
          @('409', '完了書類ではない、または他タスクの書類である', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      },
      @{
        Title = '廃棄完了登録（/disposal-task/tasks/{disposalTaskId}/complete）'
        Overview = 'STEP④で登録済み完了書類を確認し、「登録完了（タスク完了）」押下で廃棄申請タスクを完了する。'
        Method = 'POST'
        Path = '/disposal-task/tasks/{disposalTaskId}/complete'
        Auth = '要（Bearer）'
        ParametersTitle = 'リクエストパラメータ'
        ParametersHeaders = @('パラメータ', 'In', '型', '必須', '説明')
        ParametersRows = @(
          @('disposalTaskId', 'path', 'int64', '✓', '`rfqs.rfq_id`')
        )
        RequestTitle = 'リクエストボディ（application/json）'
        RequestHeaders = @('フィールド', '型', '必須', '説明')
        RequestRows = @(
          @('confirmMissingDocuments', 'boolean', '✓', '未登録ドキュメントがある場合の確認値。初回は `false`、画面確認後の再送時のみ `true`')
        )
        PermissionLines = $transferDisposalPermissionLines
        ProcessingLines = @(
          '対象廃棄タスクが `納期確定` の完了登録可能状態であることを確認する。画面上はSTEP③の作業日登録後にSTEP④へ進むため、廃棄申請では `納期確定→完了` を許可する',
          '完了書類は事前に `POST /documents` の「ドキュメント登録」押下で、対象RFQに `owner_type=''RFQ''`、`rfq_id=disposalTaskId`、`step_code=''COMPLETE''`、`document_category=''COMPLETE''` として保存済みであることを確認する。このAPIはファイルを受け取らず、完了登録時に追加アップロードを行わない',
          '未登録ドキュメントがある場合、`confirmMissingDocuments=false` では 409 (`REQUIRED_DOCUMENT_MISSING`) と不足種別を返す。画面確認後に `true` で再送された場合は、未登録のまま完了を許可する',
          '`disposal_application_details.accepted_on` は業務日付、`inspected_by_name` は認証ユーザー名をサーバー側で設定する。画面から任意の日付・担当者名は受け付けない',
          '`rfqs.status` を `完了`、対象全 `applications.status` を `完了` に更新し、`rfq_status_histories` と `application_status_histories` を登録する。登録済み資産の廃棄対象は `asset_ledgers.status=''廃棄済''` へ更新し、`asset_ledger_histories` を登録する',
          '未登録資産は `asset_ledgers` を作成せず、申請および廃棄証跡のみで完了管理する',
          '申請・グループステータス更新、完了情報、資産台帳更新、履歴登録は同一トランザクションで処理する。リモデル起点か否か、リモデルクローズの実行有無にかかわらず、登録済み資産は `廃棄済` へ更新する',
          'リモデル起点の場合は `remodelCloseImpact` を算出してNo.24へ返す。No.24のクローズ処理自体は実行しない'
        )
        ResponseTitle = 'レスポンス（200：DisposalTaskActionResponse）'
        ResponseHeaders = @('フィールド', '型', '必須', '説明')
        ResponseRows = $actionResponseRows
        StatusRows = @(
          @('200', '完了登録成功', 'DisposalTaskActionResponse'),
          @('400', '入力不正', 'ErrorResponse'),
          @('401', '未認証', 'ErrorResponse'),
          @('403', '作業対象施設に対する実効 `transfer_disposal` なし', 'ErrorResponse'),
          @('404', '対象廃棄タスクが存在しない', 'ErrorResponse'),
          @('409', '現在ステータスが完了登録可能状態ではない、または必須ドキュメント未登録', 'ErrorResponse'),
          @('500', 'サーバー内部エラー', 'ErrorResponse')
        )
      }
    ) },

    @{ Type = 'Heading1'; Text = '第7章 DBマッピング・業務ルール' },
    @{ Type = 'Heading2'; Text = '移動承認の原本反映' },
    @{ Type = 'Bullets'; Items = @(
      '移動承認は `applications`、`application_assets`、対象 `asset_ledgers`、`asset_ledger_histories`、`application_status_histories` を1トランザクションで更新する',
      '移動先は申請時に保存済みの `application_assets.destination_*` と `transfer_application_details` を正本とし、承認APIで任意の移動先上書きは受け付けない',
      '資産台帳更新後のステータス保存値は `完了` とし、画面表示では `移動完了` として返す'
    ) },
    @{ Type = 'Heading2'; Text = '廃棄RFQの保存方針' },
    @{ Type = 'Bullets'; Items = @(
      '本書の廃棄申請タスクは `rfqs.management_type=''DISPOSAL''`、`workflow_type=''RFQ''` として表す。`applications.application_type=''DISPOSAL''` と `rfq_applications` の紐づきで廃棄申請を識別し、資産一覧起点とリモデル起点を同一モデルで扱う',
      '`rfqs.management_type=''REMODEL''`、`workflow_type=''DISPOSAL''` は新規廃棄タスクの検索・作成・更新条件に使用しない。旧データは移行方針に従って新モデルへ変換し、移行不能行は新APIへ混在させない',
      '`rfqs.status` はグループ全体の現在STEP・終端状態、`applications.status` はグループ内申請単位の業務状態とする。RFQ作成直後は `rfqs.status=''見積依頼''`、`applications.status=''新規申請''` とし、両方の更新と履歴登録を同一トランザクションで行う',
      '廃棄依頼グループ作成時を初回受付の確定タイミングとし、認証済みログインユーザーの所属部署・氏名・ユーザーIDを `rfqs.reception_department`、`rfqs.reception_person`、`rfqs.reception_user_id`、`rfqs.reception_confirmed_at` へ保存する。`reception_person` は表示用氏名スナップショット、`reception_user_id` は同一人物の識別用IDであり、別の担当者を表さない',
      '初回受付後のタスク取得・プレビュー・見積依頼・見積登録・発注・納期登録・完了書類登録・完了・見送りでは、現在ログインしているユーザー情報やリクエスト本文によって `rfqs` の受付情報を更新しない。受付情報は保存済みの `rfqs` を正本とする',
      '各STEPの操作ユーザーは受付担当者とは分離し、ステータス変更時は `rfq_status_histories.changed_by_user_id` / `application_status_histories.changed_by_user_id`、業者依頼送信時は `rfq_vendors.requested_by_user_id` へ保存する',
      '廃棄タスクの対象申請は `rfq_applications.application_id` と `application_asset_id` で追跡し、見積・発注・完了証跡は `rfq_id` 配下へ集約する',
      '廃棄完了書類は `application_documents` の `owner_type=''RFQ''`、`rfq_id`、`step_code=''COMPLETE''`、`document_category=''COMPLETE''` を正本とする。`application_id`、`application_asset_id`、`order_id` はNULLとし、完了書類の一覧・削除・プレビューは `rfq_id=disposalTaskId` でスコープする',
      '複数申請を1タスクに束ねる場合、グループ操作の成功条件は対象全申請の更新成功とし、`rfqs.status` と紐づく全 `applications.status` を同一保存値へ遷移させる。部分更新を成功扱いにしない',
      'リモデル起点かどうかは `rfq_applications.edit_list_id` / `edit_list_item_id` で判定し、`rfqs.edit_list_id` や `management_type` だけでは判定しない',
      '`disposal_application_details.quotation_due_on` は一覧表示用の最早回答期限、`order_deadline_on` は発注期限、`disposal_scheduled_on` は作業日/廃棄予定日の正本とする'
    ) },
    @{ Type = 'Heading2'; Text = 'No.24 リモデル管理APIとの連携' },
    @{ Type = 'Bullets'; Items = @(
      'No.24の一覧・ダッシュボード・詳細は、通常リモデルRFQ（`REMODEL/RFQ`）に加え、`rfq_applications` からリモデル編集リストへ辿れる廃棄グループ（`DISPOSAL/RFQ`）を表示対象とする。`DISPOSAL/RFQ` を `REMODEL/RFQ` へ変換して表示してはならない',
      'No.24からNo.27へ遷移する際は、`rfqGroupId`（No.27では `disposalTaskId` と同一）、`managementType=''DISPOSAL''`、`editListId`、戻り先を引き継ぐ。廃棄タスクの業者選定、見積、発注、作業日、完了登録はNo.27のAPIを呼び出す',
      'No.27の完了登録は、リモデル起点か否かにかかわらず資産台帳の対象資産を `廃棄済` に更新する。リモデル起点の場合は編集リスト明細ごとの完了状況、未終端タスク、原本登録状況を `remodelCloseImpact` として返す',
      'No.24のリモデルクローズAPIは `remodelCloseImpact` を参照してクローズ可否だけを判定し、資産を `廃棄済` に更新する処理はNo.27に重複実装しない。クローズ条件未達時は `REMODEL_CLOSE_NOT_READY` と不足対象の詳細を返す'
    ) },
    @{ Type = 'Heading2'; Text = 'トランザクション・排他・既存データ移行' },
    @{ Type = 'Bullets'; Items = @(
      '全POST/DELETE更新APIは対象タスクを `X-Acting-Facility-Id` の施設スコープ内で取得し、`If-Match` または同等の楽観ロックで画面取得後の競合を検出する。競合時は409 (`CONFLICT_UPDATED`) とし、更新を確定しない',
      '初回受付情報の設定は廃棄依頼グループ作成トランザクション内で行う。新規APIでは `reception_user_id IS NULL` の既存グループをGET時やSTEP操作時に現在ログインユーザーで自動補完しない。既存データで担当者を特定できない場合は既存の氏名スナップショットを保持し、`created_by_user_id`から機械的に補完しない',
      'グループ操作は `rfqs`、対象全 `applications`、対象 `application_assets`、関連する見積・発注・ドキュメントを必要範囲でロックし、ステータス、履歴、業務データを同一トランザクションで確定する。一部申請だけ更新された状態を成功扱いにしない',
      '既存の `owner_type=''APPLICATION''` 廃棄完了書類は、リリース前の移行処理で `rfq_applications` から対象RFQを一意に解決できる行だけRFQ所有へバックフィルする。解決不能行はエラー一覧へ出力して手動解決し、API実行時の旧方式フォールバックは設けない',
      '発注重複は対象 `rfq_id` と採用見積の有効な `orders` をロックして検証し、重複時は409 (`ORDER_ALREADY_CREATED`) とする。発注書取得は `application_documents` を `rfq_id + order_id` で検索し、組み合わせ不一致は `ORDER_RFQ_MISMATCH` とする',
      '`management_type=''REMODEL''`、`workflow_type=''DISPOSAL''` の旧廃棄ワークフローは新APIの一覧・更新対象へ自動混入させない。リリース前に `DISPOSAL/RFQ` と共通廃棄ステータスへ移行し、移行不能行はエラー一覧と対象IDを記録して新APIから除外する',
      '旧発注書の `application_documents.order_id` が未設定または `rfq_id + order_id` と不整合な行は、バックフィルまたはデータ修正が完了するまで新発注書の表示・登録対象から除外し、曖昧な `document_no` 検索を代替手段にしない'
    ) },
    @{ Type = 'Heading2'; Text = '廃棄ドキュメントのS3保存方針' },
    @{ Type = 'Bullets'; Items = @(
      '廃棄見積原本、発注書、完了報告書、廃棄証明書、マニフェスト、契約書、請求書等は、登録確定APIが受け取ったファイル本体をAmazon S3へPutObjectし、`application_documents.file_path` にはS3オブジェクトキーのみ保存する。発注書は登録API側で生成する',
      'ファイル選択・プレビュー・入力途中では業務DB保存を行わず、「見積書の登録」「ドキュメント登録」「発注登録」またはモーダルの確定操作でのみ保存する',
      '`application_documents` の `owner_type` / `rfq_id` / `quotation_id` / `application_id` / `application_asset_id` / `rfq_vendor_id` / `asset_ledger_id` は所有者の正本キーとして保持し、S3オブジェクトキーへ業務上の所有者情報を過度に重複させない',
      '画面表示やダウンロードでは `downloadUrl` を都度生成して返し、S3オブジェクトキー、S3バケット名、S3の直接URLはリクエスト/レスポンスで直接扱わない',
      '論理削除時は `application_documents.deleted_at` を設定し、S3オブジェクトは `deleted_at` 起点のS3ライフサイクルまたは後続クリーンアップ対象にする'
    ) },
    @{ Type = 'Heading2'; Text = '対象外・境界' },
    @{ Type = 'Table'; Headers = @('論点', '本書の扱い', '参照先'); Rows = @(
      @('資産一覧起点の移動/廃棄申請起票', '本書では扱わない。起票後の受付以降を扱う', 'No.13 資産申請起票 API 設計書'),
      @('棚卸しからの移動/廃棄申請作成', '棚卸しAPIが申請を作成し、本書は承認・後続工程のみ扱う', '棚卸し API 設計書'),
      @('修理不能からの未登録資産廃棄申請作成', '修理管理APIが廃棄申請を作成し、本書は作成済み申請の受付以降を扱う', '修理管理 API 設計書'),
      @('未登録資産の単独廃棄申請', 'Phase1対象外。入口UI/APIを設けない', '-'),
      @('旧廃棄管理URL', '業務APIを追加せず、画面ルートで `/quotation-data-box/transfer-management?tab=disposal` へ正規化する', '-')
    ) },

    @{ Type = 'Heading1'; Text = '第8章 エラー設計' },
    @{ Type = 'Heading2'; Text = '共通HTTPステータス' },
    @{ Type = 'Table'; Headers = @('HTTP', '説明', 'レスポンス'); Rows = $errorRows },
    @{ Type = 'Heading2'; Text = '代表エラーコード' },
    @{ Type = 'Table'; Headers = @('コード', 'HTTP', '内容'); Rows = @(
      @('VALIDATION_ERROR', '400', '必須不足、形式不正、件数不正'),
      @('UNAUTHORIZED', '401', '認証トークン未付与または無効'),
      @('FORBIDDEN', '403', '作業対象施設に対する実効 `transfer_disposal` がない'),
      @('APPLICATION_NOT_FOUND', '404', '対象申請が存在しない、または作業対象施設に属さない'),
      @('DISPOSAL_TASK_NOT_FOUND', '404', '対象廃棄タスクが存在しない'),
      @('INVALID_APPLICATION_TYPE', '409', '対象申請が `TRANSFER` / `DISPOSAL` の期待種別ではない'),
      @('UNREGISTERED_DISPOSAL_NOT_ALLOWED', '409', '修理申請経由ではない未登録資産廃棄申請が含まれている'),
      @('STATUS_TRANSITION_NOT_ALLOWED', '409', '現在ステータスから要求された操作へ遷移できない'),
      @('RFQ_ALREADY_CREATED', '409', '廃棄申請が既にRFQグループへ接続済み'),
      @('DISPOSAL_TASK_STATE_CONFLICT', '409', '現在STEPでは要求された操作を実行できない'),
      @('DISPOSAL_GROUP_ASSET_DUPLICATE', '409', '対象資産が有効な別の廃棄依頼グループへ登録済み'),
      @('QUOTATION_VENDOR_MISMATCH', '409', '見積業者が対象RFQの依頼先ではない'),
      @('ORDER_RFQ_MISMATCH', '409', '`order_id` と `rfq_id` の組み合わせが不一致'),
      @('ORDER_ALREADY_CREATED', '409', '対象RFQ・見積に対する発注が既に作成済み'),
      @('DOCUMENT_SCOPE_MISMATCH', '409', '完了書類が対象廃棄依頼グループに属していない、または完了書類以外のドキュメントが指定された'),
      @('REQUIRED_DOCUMENT_MISSING', '409', '完了登録時点で未登録の完了書類があり、確認なしではタスク完了できない'),
      @('INVALID_DOCUMENT_TYPE', '400', '廃棄申請管理で許可されないドキュメント種別、または条件付き項目の組み合わせが指定された'),
      @('INVALID_DOCUMENT_METADATA', '400', 'その他ドキュメント名、変更見積の実績金額・勘定科目、保存形式などの入力が不正'),
      @('EMAIL_SEND_FAILED', '502', '見積依頼または発注書のメール送信に失敗した'),
      @('CONFLICT_UPDATED', '409', '画面取得後に対象データが更新された'),
      @('REMODEL_CLOSE_NOT_READY', '409', 'リモデルクローズ条件未達の影響情報がある'),
      @('FILE_SAVE_FAILED', '502', '廃棄関連ドキュメントのAmazon S3 PutObject、またはDB失敗時の保存済みS3オブジェクト破棄に失敗した')
    ) },

    @{ Type = 'Heading1'; Text = '第9章 運用・監査方針' },
    @{ Type = 'Bullets'; Items = @(
      '移動承認、廃棄RFQグループ作成、見積依頼、見積登録、発注登録、作業日登録、完了登録、見送りは監査対象とし、APIログに作業対象施設、実行ユーザー、申請ID、RFQ ID、更新前後ステータス、`Idempotency-Key` を記録する',
      '添付ファイル本文、見積書本文、証明書本文はアプリケーションログへ出力しない',
      'S3オブジェクトキー、S3バケット名、認可済み `downloadUrl` は必要最小限の運用ログに限定し、利用者向けエラーメッセージや通常APIログへ直接出力しない',
      'POST API は冪等性キーを必須とし、同一キー・同一ユーザー・同一施設・同一APIパス・同一payloadの再送は初回結果を返す',
      '旧廃棄管理URLの正規化は画面ルーティング層で行い、業務APIログには正規化後の `/quotation-data-box/transfer-management` からのAPI呼び出しとして記録する',
      '移動承認および廃棄完了の資産台帳更新は、申請ステータス更新と同一トランザクションで処理し、片側だけが成功した状態を禁止する'
    ) }
  )
}
