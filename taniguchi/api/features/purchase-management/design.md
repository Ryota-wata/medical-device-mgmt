# 購入管理 API内部設計

## 第1章 概要

### 本書の目的

本書は、購入管理タブ画面および購入管理タブから遷移する通常購入フローの画面で利用する API の設計内容を整理し、画面要件、DB設計、編集リストAPI、資産申請起票APIとの責務境界を一致させることを目的とする。

対象範囲は、起票済み購入申請の受付一覧・詳細・却下、購入管理タブ起点の通常編集リスト新規作成と購入申請取り込み、既存通常編集リストへの購入申請取り込み、作成済み通常購入RFQの一覧・詳細、取得済み見積書アップロード、見積登録、見積管理、発注登録、納品日登録、検収登録、資産登録、RFQ削除である。業者への見積依頼送信はPhase1の本書では扱わない。

資産一覧起点の新規購入・増設購入・更新購入申請の起票は No.13「資産申請起票」API設計書を正本とし、本書では起票後の受付以降を扱う。編集リスト本体の汎用編集、セル編集、Data Link、見積DB Link、行削除、行順変更、フリーカラム、編集リスト画面で選択行から実行する通常購入RFQ作成は No.23「編集リスト」API設計書を正本とする。

### 対象システム概要

購入管理は、タスク管理配下で通常購入の申請受付と見積（発注）グループ進行を管理する業務機能である。申請受付一覧では未処理の購入申請を通常編集リストへ取り込み、見積（発注）グループ一覧では `rfqs.management_type='PURCHASE'` のRFQを見積依頼、見積登録、発注、納品日登録、検収、資産登録まで進行する。

本書ではOCR抽出、OCRジョブ制御、OCR結果取込APIは扱わない。OCR明細確認やOCR処理中の表示は、見積原本PDF/画像を参照しながら手動入力した見積明細の確認画面として扱う。

### 用語定義

| 用語 | 説明 |
| --- | --- |
| 購入申請 | `applications.application_type='PURCHASE'` の申請。新規購入、増設購入、更新購入を `purchase_application_details.purchase_type` で区分する |
| 申請受付一覧 | `applications.status='申請中'` かつ編集リスト未取り込みの購入申請を表示する未処理キュー |
| 通常編集リスト | `edit_lists.list_type='PURCHASE'` の編集リスト。購入管理タブから作成・選択できる編集リストはこの種別に限定する |
| RFQグループ | `rfqs` の1レコード。購入管理対象は `management_type='PURCHASE'`、`workflow_type='RFQ'` とする |
| 見積業者行 | `rfq_vendors` の1レコード。Phase1のNo.25では取得済み見積書の登録先業者または見積取得済み業者として扱い、業者への依頼送信完了の正本にはしない |
| 発注登録用見積 | 発注登録へ進める見積。見積確定時にRFQステータスを `発注見積登録済` へ進める |
| 参考系見積 | `定価見積` / `概算見積` など。見積DB登録後は `見積DB登録済` とし、発注登録用見積へ進む場合は別RFQグループを作成する |
| SHIPへ依頼 | Phase2対象の機能候補。見積書アップロード後にOCR〜見積DB登録をSHIPへ代理依頼するものであり、業者への見積依頼送信や `rfq_vendors.request_status='SENT'` 更新とは分離する。Phase1の本書ではAPIを定義しない |

### 対象画面

| 画面名 | 画面パス | 利用目的 |
| --- | --- | --- |
| 購入管理タブ画面 | /quotation-data-box/purchase-management | 購入申請受付、通常購入RFQ一覧、ステップ別進行、申請詳細・却下・編集リスト取り込みを行う |
| 見積登録STEP画面 | /quotation-data-box/rfq-process | RFQ詳細、見積業者行、取得済み見積書アップロード、見積ドラフト作成を行う |
| 見積登録（購入）OCR明細確認画面 | /quotation-data-box/ocr-confirm | 見積原本を見ながら手動入力した見積明細を確認・編集する |
| 見積登録（購入）登録区分登録画面 | /quotation-data-box/category-registration | category、明細区分、登録済み状態を確定する |
| 見積登録（購入）個体品目AI判定画面 | /quotation-data-box/item-ai-matching | AI推薦または資産マスタ選択で個体品目候補を確定する |
| 見積登録（購入）個体登録及び金額按分画面 | /quotation-data-box/price-allocation | 個体登録レコード、SEQ、親子No、按分金額を確定する |
| 見積登録（購入）登録確認画面 | /quotation-data-box/registration-confirm | 見積ヘッダーと明細を最終確認し、見積DB登録または発注見積登録を確定する |
| 見積管理画面 | /quotation-management | 登録済み購入見積明細を編集リスト・RFQ単位で参照する |
| 発注登録画面 | /quotation-data-box/order-registration | 発注ヘッダーと発注明細を作成する |
| 検収登録画面 | /quotation-data-box/inspection-registration | 納品検収予定日と検収書種別を登録する |
| 資産仮登録画面 | /quotation-data-box/asset-provisional-registration | 個体単位の検収入力、分類候補、設置場所、写真を保存し、検収登録を完了する |
| 資産登録画面 | /quotation-data-box/asset-registration | 検収登録済み個体を原本資産台帳へ登録する |

## 第2章 システム全体構成

### API の位置づけ

本API群は、購入申請起票後のタスク管理機能である。起票処理は資産申請起票API、編集リスト本体操作と編集リスト画面からのRFQ作成は編集リストAPIに委譲し、本書では購入管理タブの受付・取り込みと、作成済み `PURCHASE` RFQの後続進行だけを定義する。

RFQは `rfqs` をグループ正本、`rfq_vendors` を見積業者行、`rfq_applications` を採用明細リンクとして扱う。一覧レスポンスでは業者行へ展開するが、同一 `rfq_no` のRFQヘッダ複製は行わない。Phase1のNo.25では業者への見積依頼送信をシステム上で管理せず、取得済み見積書の登録から扱う。

### 画面と API の関係

| 画面操作 | API | 補足 |
| --- | --- | --- |
| 購入管理タブ初期表示 | `GET /quotation-data-box/purchase-management/context` | 申請受付、編集リスト候補、RFQ一覧、権限、既定条件を取得する |
| 申請受付一覧表示/検索 | `GET /quotation-data-box/purchase-management/applications` | 未処理の購入申請を取得する |
| 申請詳細表示 | `GET /quotation-data-box/purchase-management/applications/{applicationId}` | 申請内容、明細、添付、履歴を取得する |
| 購入申請却下 | `POST /quotation-data-box/purchase-management/applications/{applicationId}/reject` | `申請中` の購入申請だけを却下する |
| 編集リスト候補表示 | `GET /quotation-data-box/purchase-management/edit-list-candidates` | `list_type='PURCHASE'` の候補だけを返す |
| 新規編集リストへ追加 | `POST /quotation-data-box/purchase-management/edit-lists` | 通常編集リストを新規作成し、購入申請を取り込む |
| 既存編集リストへ追加 | `POST /quotation-data-box/purchase-management/edit-lists/{editListId}/import-applications` | 作業ロック検証後に購入申請明細を追加する |
| RFQ一覧表示/ステップタブ切替 | `GET /quotation-data-box/rfq-groups?managementType=PURCHASE` | 購入管理対象RFQのみを取得し、`tabCounts` を返す |
| RFQ詳細表示/共通画面表示 | `GET /quotation-data-box/rfq-groups/{rfqGroupId}` | RFQ、業者、対象明細、見積、発注、個体、ドキュメントを取得する |
| 見積登録先業者の追加/更新/未確定削除 | `POST /quotation-data-box/rfq-groups/{rfqGroupId}/vendor-requests` | DRAFT行だけ更新・削除可能。業者依頼送信は行わない |
| 見積ドラフト保存 | `POST /quotation-data-box/quotations` | 見積ヘッダー、原本メタデータ、明細、分類/AI/按分結果を保存する |
| 見積登録確定 | `POST /quotation-data-box/quotations/{quotationId}/confirm` | 見積DB登録済または発注見積登録済へ進める |
| 見積管理一覧 | `GET /quotation-management/quotation-items` | 登録済み購入見積明細を参照する |
| 発注登録 | `POST /quotation-data-box/order-registration/orders` | 発注ヘッダーと発注明細を作成し、RFQを発注済へ進める |
| 納品日登録 | `POST /quotation-data-box/inspection-registration/records` | 検収日と検収書種別を保存し、RFQを納期確定へ進める |
| 検収登録初期表示 | `GET /quotation-data-box/asset-provisional-registration/context` | 対象発注明細、保存済み個体、分類初期候補、大分類/中分類/品目候補、設置場所候補を取得する |
| 検収登録明細保存 | `PATCH /quotation-data-box/asset-provisional-registration/items/{orderItemId}` | QR、シリアル、写真、設置場所、W/D/H、分類選択を発注明細単位で保存する |
| 検収登録完了 | `POST /quotation-data-box/asset-provisional-registration/complete` | 個体検収情報を保存し、全件登録時にRFQを検収済へ進める |
| 資産登録 | `POST /quotation-data-box/asset-registration/register-bulk` | 検収済み個体を原本資産へ登録し、RFQを完了へ進める |
| RFQ削除 | `DELETE /quotation-data-box/rfq-groups/{rfqGroupId}` | 発注済到達前だけ論理削除する |

### 使用テーブル

| テーブル名 | 利用種別 | 用途 |
| --- | --- | --- |
| `purchase_applications` VIEW | READ | 購入申請受付一覧・詳細の投影。`applications`、`purchase_application_details`、`application_assets`、`edit_lists`、`rfq_applications`、`rfqs` から構成する |
| `applications` | READ / UPDATE | 購入申請ヘッダー、ステータス、編集リスト取り込み、却下情報、申請履歴の起点 |
| `purchase_application_details` | READ | 購入申請区分、優先順位、希望納期、使用用途、症例数 |
| `application_assets` | READ | 購入申請明細、更新購入後処理区分、既存資産/要望資産の区分 |
| `application_status_histories` | CREATE / READ | 購入申請の却下、編集リスト取り込み、状態遷移履歴 |
| `application_documents` | READ / CREATE / UPDATE / DELETE | 申請添付、見積原本、依頼書、発注書、検収書、機器写真などのファイルメタデータ。ファイル実体はAmazon S3に保存し、`file_path` にはS3オブジェクトキーのみを保持する |
| `application_document_order_item_links` | READ / CREATE / UPDATE | 検収写真ドキュメントと発注明細の対応。`relation_type='ACCEPTANCE_PHOTO'` で、S3オブジェクトキーのprefixに依存せず `photoDocumentIds` を検証する |
| `edit_lists` | READ / CREATE / UPDATE | 通常編集リスト候補、新規作成、購入申請取り込み先。`list_type='PURCHASE'` に限定する |
| `edit_list_facilities` | READ / CREATE | 編集リスト対象施設、主施設/追加施設 |
| `edit_list_work_locks` | READ / UPDATE | 既存編集リスト取り込み時の作業ロック検証とheartbeat更新 |
| `edit_list_items` | READ / CREATE / UPDATE | 原本資産コピー、購入申請由来明細、RFQ現在表示用のNo/グループ名更新 |
| `asset_ledgers` | READ / CREATE | 編集リスト作成時の原本コピー元、資産登録完了時の原本資産作成先 |
| `rfqs` | READ / UPDATE / DELETE | 購入管理対象RFQグループ、ステータス、削除、完了日 |
| `rfq_applications` | READ | RFQに採用した編集リスト明細・申請明細のリンク。購入管理では作成済みリンクを参照する |
| `rfq_vendors` | READ / CREATE / UPDATE / DELETE | 見積業者行、取得済み見積の業者、提出期限、補足メモ。Phase1のNo.25では送信完了の正本として `SENT` を更新しない |
| `quotations` | READ / CREATE / UPDATE / DELETE | 見積ヘッダー、発注登録用見積/参考系見積、見積確定状態 |
| `quotation_items` | READ / CREATE / UPDATE / DELETE | 見積明細、分類、AI判定、個体登録、金額按分、見積管理一覧 |
| `quotation_item_application_links` | READ / DELETE | 見積DB Link由来の対応関係。RFQ削除時は論理削除する |
| `orders` | READ / CREATE / UPDATE | 発注ヘッダー、決済No、納期、検収日、検収書種別 |
| `order_items` | READ / CREATE / UPDATE | 発注明細、個体登録対象、納品日 |
| `individuals` | READ / CREATE / UPDATE | 検収登録済み個体の中間正本。分類、品目名、メーカー、型式、設置場所、W/D/H、QR、シリアル、写真リンクを保持し、資産登録時に原本資産へ引き継ぐ |
| `asset_categories` / `asset_large_classes` / `asset_medium_classes` / `asset_items` | READ | 検収登録のCategory、大分類、中分類、品目候補と親子関係の検証 |
| `ship_asset_masters` | READ | 検収登録の分類候補を有効な資産マスタ組み合わせへ限定するための母集団 |
| `vendors` | READ | 依頼先業者・見積業者のマスタ参照 |
| `users` | READ | ログインユーザー、依頼送信者、申請者表示、共有システム管理者判定 |
| `facilities` | READ | Bearer トークン上の作業対象施設、申請対象施設、編集リスト対象施設、RFQ対象施設の存在確認・未削除判定 |
| `user_facility_assignments` | READ | 通常アカウントの作業対象施設割当判定 |
| `facility_feature_settings` | READ | 通常アカウントの作業対象施設における購入、見積、発注、検収機能の提供有無判定 |
| `user_facility_feature_settings` | READ | 通常アカウントのユーザー×作業対象施設単位の購入、見積、発注、検収機能の利用可否判定 |

## 第3章 共通仕様

### API 共通仕様

- 通信方式: HTTPS
- データ形式: JSON（見積ドラフト保存・検収登録明細保存・検収登録完了のファイル実体を含む multipart/form-data を除く）。ファイル実体はAPI内でAmazon S3へPutObjectし、DBには `application_documents` のメタデータを保存する
- 文字コード: UTF-8
- 日時形式: ISO 8601（例: `2026-05-27T10:00:00+09:00`）
- 日付形式: `YYYY-MM-DD`
- 認証済みAPIは Bearer トークンを `Authorization` ヘッダーに付与する
- 一覧APIは cursor 方式のページングを基本とし、`limit` の既定値は50、最大値は200とする。ただし見積明細一覧は既定100、最大500とする
- 変更系APIは `Idempotency-Key` または `expectedUpdatedAt` を受け付け、二重送信または競合更新を検出する
- 論理削除は各テーブルの `deleted_at` を設定する。削除済み行は通常一覧から除外し、監査・履歴参照では必要に応じて保持する

### 認証・認可

本API群は、ロール固定ではなく対象施設に対する実効 `feature_code` で認可する。通常アカウントでは、Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）では、作業対象施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず、通常購入、通常購入見積、通常購入発注、通常購入検収・原本登録の対象 `feature_code` を有効として扱う。`normal_ship_request` はPhase2のSHIP依頼機能候補であり、Phase1の本書では認可判定・レスポンス返却に使用しない。

| 機能コード | 対象操作 | 説明 |
| --- | --- | --- |
| `normal_purchase` | 購入申請受付、申請却下、編集リスト取り込み、RFQ一覧・詳細、見積登録先業者保存、RFQ削除 | 購入管理タブの基礎操作 |
| `normal_quotation` | 見積ドラフト保存、見積確定、見積管理一覧 | 通常購入の見積登録・見積参照 |
| `normal_order` | 発注登録 | 通常購入の発注工程 |
| `normal_acceptance` | 納品日登録、検収登録、資産登録 | 通常購入の検収・原本登録工程 |

### 作業対象施設ベースの認可

- 各 API は Bearer トークン上の作業対象施設が存在し、未削除であることを確認する
- 通常アカウントでは、作業対象施設に対する有効担当施設割当と実効 `feature_code` を都度再判定する
- 共有システム管理者アカウントでは、作業対象施設が未削除であれば通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による認可判定をバイパスする
- `applications.application_type='PURCHASE'`、`rfqs.management_type='PURCHASE'`、`workflow_type='RFQ'`、対象申請・RFQ・編集リストの未削除、ステータス遷移順序、発注登録用見積確定、検収済み個体不足、有効な編集リスト作業ロックといった業務制約は共有システム管理者でもバイパスしない
- 通常アカウントで作業対象施設に対して必要な実効 `feature_code` がない場合は 403 を返却する
- 作業対象施設が存在しない、または削除済みの場合は 404 を返却する

### 共通エラーレスポンス

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| code | string | ✓ | エラーコード |
| message | string | ✓ | 利用者向けメッセージ |
| details | string[] | - | 入力項目単位のエラーや補足情報 |
| traceId | string | - | 調査用トレースID |

### 共通DTO

`DocumentInput` は multipart/form-data のファイルパートに対応するメタデータであり、`filePartName` で対象ファイルを指定する。APIはファイル実体をAmazon S3へPutObjectし、生成したS3オブジェクトキーを `application_documents.file_path` に保存する。S3オブジェクトキー、S3バケット名、S3の直接URLはリクエスト/レスポンスで直接扱わない。`storageFormat` はS3保存先ではなく、電子取引/スキャナ保存/未指定などの保存形式を表す列として扱う。

#### DocumentInput

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| documentType | string | ✓ | `application_documents.document_type`。例: 見積原本 / 検収写真 |
| filePartName | string | ✓ | multipart/form-data 内のファイルパート名。ファイル実体とメタデータを対応付ける |
| fileName | string | - | 画面表示用ファイル名。未指定時はアップロードファイル名 |
| contentType | string | - | MIME Type。未指定時はアップロードファイルまたはサーバー判定値を使用する |
| fileSizeBytes | int64 | - | 画面側検証用ファイルサイズ。保存時はサーバーがファイル実体から算出した値を正本にする |
| contentHash | string | - | クライアント計算ハッシュ。サーバー側でも再計算する |
| title | string | - | 表示タイトル |
| documentDate | date | - | 文書日付 |
| takenAt | datetime | - | 写真撮影日時。見積原本では使用しない |
| isPrimary | boolean | - | 検収写真を代表写真として扱う場合 true |

### ステータス遷移の前提

| 工程 | 開始ステータス | 成功後ステータス | 主API |
| --- | --- | --- | --- |
| 購入申請取り込み | `申請中` | `編集中` | `POST /quotation-data-box/purchase-management/edit-lists` / `POST /quotation-data-box/purchase-management/edit-lists/{editListId}/import-applications` |
| 購入申請却下 | `申請中` | `却下` | `POST /quotation-data-box/purchase-management/applications/{applicationId}/reject` |
| 通常購入RFQ作成 | `編集中` | 購入申請=`見積中` | No.23「編集リスト」APIでRFQを作成し、購入申請へロールアップする |
| 参考系見積確定 | `見積依頼` / `見積DB登録済` など | `見積DB登録済` | `POST /quotation-data-box/quotations/{quotationId}/confirm` |
| 発注登録用見積確定 | `見積依頼` / `発注用見積依頼済` など | `発注見積登録済` | `POST /quotation-data-box/quotations/{quotationId}/confirm` |
| 発注登録 | `発注見積登録済` | RFQ=`発注済` / 購入申請=`発注済` | `POST /quotation-data-box/order-registration/orders` |
| 納品日登録 | `発注済` | RFQ=`納期確定` / 購入申請=`納品済` | `POST /quotation-data-box/inspection-registration/records` |
| 検収登録 | `納期確定` | RFQ=`検収済` / 購入申請=`検収済` | `GET /quotation-data-box/asset-provisional-registration/context`、`PATCH /quotation-data-box/asset-provisional-registration/items/{orderItemId}`、`POST /quotation-data-box/asset-provisional-registration/complete` |
| 資産登録 | `検収済` | RFQ=`完了` / 購入申請=`完了` | `POST /quotation-data-box/asset-registration/register-bulk` |

## 第4章 API一覧

| No | API名 | Method | Path | 用途 | 主権限 |
| --- | --- | --- | --- | --- | --- |
| 25-01 | 購入管理コンテキスト取得 | GET | /quotation-data-box/purchase-management/context | 購入管理タブ初期表示 | 入口権限いずれか |
| 25-02 | 購入申請受付一覧取得 | GET | /quotation-data-box/purchase-management/applications | 未処理購入申請一覧 | normal_purchase |
| 25-03 | 購入申請詳細取得 | GET | /quotation-data-box/purchase-management/applications/{applicationId} | 申請詳細モーダル | normal_purchase |
| 25-04 | 購入申請却下 | POST | /quotation-data-box/purchase-management/applications/{applicationId}/reject | 購入申請却下 | normal_purchase |
| 25-05 | 編集リスト候補取得 | GET | /quotation-data-box/purchase-management/edit-list-candidates | 通常編集リスト候補 | normal_purchase |
| 25-06 | 編集リスト新規作成・購入申請取り込み | POST | /quotation-data-box/purchase-management/edit-lists | 新規通常編集リスト作成と申請取り込み | normal_purchase |
| 25-07 | 既存編集リストへの購入申請取り込み | POST | /quotation-data-box/purchase-management/edit-lists/{editListId}/import-applications | 既存通常編集リストへ申請追加 | normal_purchase |
| 25-08 | 購入管理RFQ一覧取得 | GET | /quotation-data-box/rfq-groups | 購入管理RFQ一覧とタブ件数 | 入口権限いずれか |
| 25-09 | RFQグループ詳細取得 | GET | /quotation-data-box/rfq-groups/{rfqGroupId} | RFQ詳細・共通画面表示 | 入口権限いずれか |
| 25-10 | 見積登録先業者保存 | POST | /quotation-data-box/rfq-groups/{rfqGroupId}/vendor-requests | 見積業者行の追加・更新・未確定削除。業者依頼送信は行わない | normal_purchase |
| 25-11 | 見積ドラフト保存 | POST | /quotation-data-box/quotations | 見積ヘッダー・明細・原本メタデータ保存 | normal_quotation |
| 25-12 | 見積確定 | POST | /quotation-data-box/quotations/{quotationId}/confirm | 見積DB登録/発注見積登録の確定 | normal_quotation |
| 25-13 | 見積管理明細一覧取得 | GET | /quotation-management/quotation-items | 購入見積明細一覧参照 | normal_quotation |
| 25-14 | 発注登録 | POST | /quotation-data-box/order-registration/orders | 発注ヘッダー・明細作成 | normal_order |
| 25-15 | 納品検収予定日登録 | POST | /quotation-data-box/inspection-registration/records | 検収日・検収書種別登録 | normal_acceptance |
| 25-16 | 検収登録コンテキスト取得 | GET | /quotation-data-box/asset-provisional-registration/context | 検収登録対象、保存済み個体、分類候補、設置場所候補取得 | normal_acceptance |
| 25-17 | 検収登録明細保存 | PATCH | /quotation-data-box/asset-provisional-registration/items/{orderItemId} | QR、シリアル、写真、設置場所、分類選択の明細保存 | normal_acceptance |
| 25-18 | 検収登録完了 | POST | /quotation-data-box/asset-provisional-registration/complete | 検収登録済み個体保存と全件確定 | normal_acceptance |
| 25-19 | 原本資産登録 | POST | /quotation-data-box/asset-registration/register-bulk | 検収済み個体の原本資産登録 | normal_acceptance |
| 25-20 | RFQグループ削除 | DELETE | /quotation-data-box/rfq-groups/{rfqGroupId} | 発注済到達前RFQの論理削除 | normal_purchase |

## 第5章 機能設計

### purchaseManagementGetQuotationDataBoxPurchaseManagementContext

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_purchase` / `normal_order` / `normal_acceptance` / `normal_quotation` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、購入管理タブ入口は作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_purchase` / `normal_order` / `normal_acceptance` / `normal_quotation` のいずれかが有効であれば参照可能とする
- 認可条件: 個別操作APIでは、各操作に対応する `feature_code` をサーバー側で再判定する

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 作業対象施設に対する購入管理タブ入口権限を判定する。
3. `GET /quotation-data-box/purchase-management/applications`、`GET /quotation-data-box/purchase-management/edit-list-candidates`、`GET /quotation-data-box/rfq-groups?managementType=PURCHASE` と同じ条件で初期データを取得する。
4. Phase1のNo.25では `SHIPへ依頼` / `SHIPへ一括依頼` のボタン表示可否および代理作業依頼作成可否を返さない。`normal_ship_request` はPhase2のSHIP依頼機能候補として扱う。
5. 個別操作の可否は `normal_purchase` / `normal_quotation` / `normal_order` / `normal_acceptance` ごとに返し、各操作APIでも再判定する。
6. 実効権限がないセクションの一覧は空配列または操作不可として返し、画面側で該当CTAを非表示または非活性にできるようにする。

### purchaseManagementGetQuotationDataBoxPurchaseManagementApplications

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_purchase` / `normal_order` / `normal_acceptance` / `normal_quotation` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、購入管理タブ入口は作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_purchase` / `normal_order` / `normal_acceptance` / `normal_quotation` のいずれかが有効であれば参照可能とする
- 認可条件: 個別操作APIでは、各操作に対応する `feature_code` をサーバー側で再判定する

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `purchase_applications` VIEWを施設スコープ、ステータス、検索条件で絞り込む。
3. 既定では `applications.status='申請中'` かつ `applications.edit_list_id IS NULL` の購入申請を未処理キューとして返す。
4. `requested_on DESC, application_no DESC` で並び替え、`limit + 1` 件で次ページ有無を判定する。
5. `assets_json`、`attached_files_json`、`rfq_group_ids_json` はAPIレスポンス用の配列へ整形する。

### purchaseManagementGetQuotationDataBoxPurchaseManagementApplicationsByApplicationId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_purchase` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_purchase` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `applications.application_type='PURCHASE'`、施設スコープ内、`deleted_at IS NULL` を検証する。
3. `purchase_applications` VIEW、`application_assets`、`application_documents`、`application_status_histories`、`rfq_applications` / `rfqs` を取得する。
4. 更新購入の場合は `application_assets.replacement_action` を返し、資産登録完了時の後処理方針を確認できるようにする。

### purchaseManagementPostQuotationDataBoxPurchaseManagementApplicationsByApplicationIdReject

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_purchase` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_purchase` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `applications.application_type='PURCHASE'`、`status='申請中'`、`edit_list_id IS NULL` を検証する。
3. `applications.status` を `却下` に更新し、`rejected_by_user_id`、`rejected_by_name`、`rejected_at` を設定する。
4. `application_status_histories` に `申請中 -> 却下` の履歴を登録する。
5. 却下後の再受付APIは定義しない。再申請は資産申請起票APIから新規起票する。

### purchaseManagementGetQuotationDataBoxPurchaseManagementEditListCandidates

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_purchase` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_purchase` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `edit_lists.list_type='PURCHASE'`、`deleted_at IS NULL`、`closed_at IS NULL` の編集リストだけを候補にする。
3. 対象施設は `edit_list_facilities` に作業対象施設を含むリストに限定する。
4. `includeLocked=false` の場合は、有効な `edit_list_work_locks` が存在するリストを候補から除外する。
5. 既存編集リストへの購入申請取り込みAPIでは、候補表示とは別に有効な作業ロックと `lock_token` を必ず検証する。

### purchaseManagementPostQuotationDataBoxPurchaseManagementEditLists

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_purchase` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_purchase` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象施設すべてに対する担当施設権限と `normal_purchase` 実効権限を検証する。
3. `edit_lists` を `list_type='PURCHASE'`、`primary_facility_id`、`created_by_user_id` 付きで作成する。作成後の `list_type` 変更APIは提供しない。
4. `edit_list_facilities` に対象施設を登録し、主施設は `facility_role='PRIMARY'`、その他は `ADDITIONAL` とする。
5. 対象施設の有効な `asset_ledgers` を `edit_list_items.source_type='BASE_ASSET'` としてコピーする。
6. 選択した購入申請は `application_type='PURCHASE'` かつ `status='申請中'` のみ許可し、申請明細を `edit_list_items.source_type='APPLICATION'` として取り込む。
7. 取り込み後は `applications.edit_list_id` と `edit_list_name` を設定し、`applications.status='編集中'`、`application_status_histories` を登録する。
8. 同一申請明細の重複は `(edit_list_id, source_type, source_application_id, source_application_asset_id)` で防止し、同一 `idempotencyKey` の再送は冪等成功とする。

### purchaseManagementPostQuotationDataBoxPurchaseManagementEditListsByEditListIdImportApplications

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_purchase` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_purchase` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `edit_lists.list_type='PURCHASE'`、`deleted_at IS NULL`、対象施設スコープ内であることを検証する。
3. 有効な `edit_list_work_locks` が存在し、ログインユーザー、`editListId`、`lockToken`、有効期限が一致することを検証する。
4. 選択した購入申請は `application_type='PURCHASE'` かつ `status='申請中'` のみ許可する。
5. 申請明細を `edit_list_items.source_type='APPLICATION'` として追加し、重複取り込みを拒否または同一 `idempotencyKey` の再送として冪等成功にする。
6. 取り込み後は `applications.edit_list_id` と `edit_list_name` を設定し、`applications.status='編集中'`、`application_status_histories` を登録する。
7. 取り込み成功時は作業ロックの `last_heartbeat_at` と `lock_expires_at` を更新する。

### purchaseManagementGetQuotationDataBoxRfqGroups

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_purchase` / `normal_order` / `normal_acceptance` / `normal_quotation` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、購入管理タブ入口は作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_purchase` / `normal_order` / `normal_acceptance` / `normal_quotation` のいずれかが有効であれば参照可能とする
- 認可条件: 個別操作APIでは、各操作に対応する `feature_code` をサーバー側で再判定する

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `rfqs.management_type='PURCHASE'`、`workflow_type='RFQ'`、`deleted_at IS NULL` のRFQを対象とする。
3. ステップタブの状態集合は、ALL=完了/申請を見送るを除外、QUOTE=見積依頼/見積依頼済/見積DB登録済、ORDER=発注見積登録済、DELIVERY=発注済、ACCEPTANCE=納期確定、ASSET_REGISTRATION=検収済とする。
4. `見積登録依頼中` / `発注用見積依頼済` は内部ステータスとして扱い、独立タブは設けない。
5. `rfq_vendors` は業者行へ展開して返す。同一 `rfq_no` のRFQヘッダ複製はDB/API正本として扱わない。
6. 同じ施設・検索条件で `tabCounts` を算出して返す。

### purchaseManagementGetQuotationDataBoxRfqGroupsByRfqGroupId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_purchase` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_purchase` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `rfqs.management_type='PURCHASE'`、施設スコープ内、`deleted_at IS NULL` を検証する。
3. `rfq_applications` に紐づく `edit_list_items` だけを対象明細として返す。同一編集リスト内の未選択明細はRFQ詳細・依頼書プレビューへ含めない。
4. `rfq_vendors`、`quotations`、`quotation_items`、`orders`、`order_items`、`individuals`、`application_documents` を必要に応じて取得する。
5. レスポンスの `context.managementType` は `PURCHASE`、`context.returnTo` は購入管理タブを返し、共通画面の戻り先を固定する。

### purchaseManagementPostQuotationDataBoxRfqGroupsByRfqGroupIdVendorRequests

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_purchase` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_purchase` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象RFQが `management_type='PURCHASE'`、ステータスが `見積依頼` / `見積DB登録済` の範囲であることを検証する。`見積依頼済` はPhase2のOutlook連携または送信管理を持つ他業務用の状態であり、Phase1のNo.25では通常発生しない。
3. 新規行は `rfq_vendors.request_status='DRAFT'` として作成する。
4. `DRAFT` 行のみ業者情報、提出期限、補足メモを更新可能とする。`SENT` / `REPLIED` 行の業者情報更新は拒否する。
5. `deleteRequested=true` は `DRAFT` 行だけ許可し、`deleted_at` を設定する。`SENT` / `REPLIED` 行は送信履歴または取得済み見積の記録として保持する。
6. 本APIは `rfq_vendors.request_status='SENT'`、`requested_at`、`requested_by_user_id` を更新しない。
7. `vendorId` 指定時は `vendors.facility_id` が対象施設と一致し、削除済みでないことを確認する。

### purchaseManagementPostQuotationDataBoxQuotations

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_quotation` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_quotation` が有効であること
- 認可条件: 対象RFQは `rfqs.management_type='PURCHASE'` かつ `workflow_type='RFQ'` かつ `deleted_at IS NULL` であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 本書ではOCR実行、OCRジョブ制御、OCR結果取込を行わない。OCR明細確認画面は、見積原本を見ながら手動入力した明細の確認画面として扱う。
3. 対象RFQが `management_type='PURCHASE'`、ステータスが `見積依頼` / `見積DB登録済` / `発注用見積依頼済` の範囲であることを検証する。`見積依頼済` はPhase2のOutlook連携または送信管理を持つ他業務用の状態であり、Phase1のNo.25では通常経由しない。
4. `payload.document` を指定した場合は、`filePartName` が multipart のファイルパートに存在することを確認し、`.pdf`、`.xlsx`、`.xls` の拡張子とMIME Typeを受け付ける。
5. `quotations` を `status='DRAFT'` として作成または更新し、`quotationId` を確定する。
6. 見積原本ファイル本体をAPI内でAmazon S3へPutObjectし、S3オブジェクトキーは `application-documents/facility-{facilityId}/{yyyy}/{mm}/{uploadUuid}.{ext}` 形式で発行する。keyは保存場所識別子であり、`rfqGroupId` や `quotationId` などの業務IDを含めない。
7. 見積原本は `application_documents` に `owner_type='QUOTATION'`、`quotation_id`、`document_category='QUOTATION'`、`document_type`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`storage_format=payload.storageFormat`、`uploaded_by_user_id`、`uploaded_at` として保存する。S3バケット名やHTTPS URLはDBへ保存しない。
8. `storageFormat` は保存先ではなく電子取引/スキャナ保存/未指定などの保存形式を表す列として扱い、S3保存有無の表現には使用しない。
9. Amazon S3保存後にDBメタデータ保存またはドラフト保存トランザクションへ失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄する。破棄に失敗した場合は 502 (`PURCHASE_FILE_502_S3_WRITE_FAILED`) を返却し、再試行可能な運用ログを残す。
10. 登録区分登録では Model A の `ABC` / `D` / `OTHER` 判定結果を初期値として扱い、`OTHER` 行に限り値引き系キーワード判定を行って `値引き` に置換できる。
11. 個体品目AI判定は `その他` / `値引き` 行を推薦対象外とし、AI適用または資産マスタ選択結果を `quotation_items` の確定列へ保存する。
12. 個体登録・金額按分では `seq_id`、`parent_seq_id`、按分金額、勘定科目を `quotation_items` に保持する。

### purchaseManagementPostQuotationDataBoxQuotationsByQuotationIdConfirm

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_quotation` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_quotation` が有効であること
- 認可条件: 対象RFQは `rfqs.management_type='PURCHASE'` かつ `workflow_type='RFQ'` かつ `deleted_at IS NULL` であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象見積が `DRAFT` または確定前状態で、親RFQが `management_type='PURCHASE'` であることを検証する。
3. 見積番号未指定の場合は受領見積番号を採番し、`quotations.status='REGISTERED'` に更新する。
4. `quotation_phase='発注登録用見積'` の場合は `rfqs.status='発注見積登録済'` に進める。
5. `定価見積` / `概算見積` など参考系見積の場合は `rfqs.status='見積DB登録済'` に進める。
6. Phase1のNo.25では業者依頼送信をシステム上で管理しないため、`rfqs.status='見積依頼'` から `見積DB登録済` または `発注見積登録済` へ直接遷移できる。
7. 確定対象見積が `rfq_vendor_id` を保持する場合は、対象 `rfq_vendors.request_status` を取得済み見積として `REPLIED` に更新できる。ただし `SENT`、`requested_at`、`requested_by_user_id` は更新しない。
8. 関連する購入申請の `applications.status` は `見積中` を維持し、発注登録までは `発注済` へ進めない。
9. 登録完了後の戻り先は `managementType='PURCHASE'` と `returnTo` に従い購入管理タブとする。

### purchaseManagementGetQuotationManagementQuotationItems

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_quotation` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_quotation` が有効であること
- 認可条件: 対象RFQは `rfqs.management_type='PURCHASE'` かつ `workflow_type='RFQ'` かつ `deleted_at IS NULL` であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `rfqs.management_type='PURCHASE'` に紐づく `quotations` / `quotation_items` を取得する。
3. 既定では親明細・子明細を一覧表示し、`その他` / `値引き` は明示条件がある場合のみ返す。
4. 編集リスト候補、見積依頼グループ候補は対象施設と `managementType` に応じて絞り込む。
5. 案分金額合計は検索条件に一致する返却対象明細から集計する。

### purchaseManagementPostQuotationDataBoxOrderRegistrationOrders

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_order` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_order` が有効であること
- 認可条件: 対象RFQは `rfqs.management_type='PURCHASE'` かつ `workflow_type='RFQ'` かつ `deleted_at IS NULL` であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象RFQが `management_type='PURCHASE'`、`status='発注見積登録済'` であることを検証する。
3. 対象見積が同一RFQに属し、`quotation_phase='発注登録用見積'` かつ確定済みであることを検証する。
4. `orders` を作成し、見積業者・申請者・発注形態・決済No・納期・支払条件・合計金額を保存する。
5. `quotation_items` から `order_items` を作成する。画面要件に合わせ、個体登録対象は数量分を後続の `individuals` 候補へ展開できる粒度で保持する。
6. `rfqs.status='発注済'`、`last_status_changed_at` を更新する。
7. 対象RFQに紐づく購入申請のうち、同一申請配下の有効な購入申請明細がすべて発注済以降へ到達した申請は `applications.status='発注済'` へ更新し、`application_status_histories` を登録する。

### purchaseManagementPostQuotationDataBoxInspectionRegistrationRecords

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_acceptance` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_acceptance` が有効であること
- 認可条件: 対象RFQは `rfqs.management_type='PURCHASE'` かつ `workflow_type='RFQ'` かつ `deleted_at IS NULL` であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象RFQが `management_type='PURCHASE'`、`status='発注済'` であることを検証する。
3. 対象発注が同一RFQに属することを検証する。
4. `orders.inspection_on` と `orders.inspection_cert_type` を更新する。明細ごとの納品日は本APIの保存対象外とする。
5. `rfqs.status='納期確定'`、`last_status_changed_at` を更新する。
6. 対象RFQに紐づく購入申請のうち、同一申請配下の有効な購入申請明細がすべて納品日登録済以降へ到達した申請は `applications.status='納品済'` へ更新し、`application_status_histories` を登録する。
7. 資産仮登録画面の初期表示は `GET /quotation-data-box/asset-provisional-registration/context`、明細単位保存は `PATCH /quotation-data-box/asset-provisional-registration/items/{orderItemId}`、全件確定は `POST /quotation-data-box/asset-provisional-registration/complete` で扱う。

### purchaseManagementGetQuotationDataBoxAssetProvisionalRegistrationContext

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_acceptance` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_acceptance` が有効であること
- 認可条件: 対象RFQは `rfqs.management_type='PURCHASE'` かつ `workflow_type='RFQ'` かつ `deleted_at IS NULL` であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象RFQが `management_type='PURCHASE'`、`workflow_type='RFQ'`、`status='納期確定'`、`deleted_at IS NULL` であることを検証する。
3. 対象RFQまたは対象発注データを画面表示に使えない場合は、HTTP 200 で `screenState='NOT_FOUND'`、`items=[]`、戻り先を返す。画面は未検出状態を表示する。
4. 対象発注、発注明細、発注明細に紐づく保存済み `individuals`、検収写真リンクを取得し、数量分の登録状況を算出する。保存済み `individuals` がある場合はQR、シリアル、品目名、メーカー、型式、購入年月日、取得金額、分類、棟、階、部門、部署、室名、W/D/H、写真を優先して返す。
5. 大分類 / 中分類 / 品目ドロップダウン候補は No.14a「資産マスタ選択」の `GET /asset-master/filter-options` と同一の有効マスタ母集団から生成する。具体的には `ship_asset_masters.is_active=true` かつ JOIN 先の `asset_categories`、`asset_large_classes`、`asset_medium_classes`、`asset_items` が有効な組み合わせだけを対象とする。
6. レスポンスの `classificationFilterOptions` は `categories` / `largeClasses` / `mediumClasses` / `assetItems` をまとめて返す。画面は `parentId` により、Category変更時は大分類以下、大分類変更時は中分類以下、中分類変更時は品目を連動絞り込みする。
7. 分類初期候補は、まず `quotation_items.asset_item_id` と確定分類名を優先し、未確定の場合は発注明細の品目名または型式を `asset_items.item_name` / `models.model_name` と照合して算出する。一意に `ship_asset_masters` まで解決できる場合は `shipAssetMasterId` を返す。
8. 設置場所初期値は同一RFQに紐づく購入申請明細から、資産名または型式と発注明細を照合して決定する。付属品行は親明細の候補を継承し、一致しない場合は同一RFQ申請の先頭明細をフォールバック候補とする。
9. 本APIは表示用候補と保存済み入力を返すだけで、RFQステータスおよび個体データは更新しない。

#### classificationFilterOptions要素と参照元

| レスポンス項目 | 参照元 | 親項目 |
| --- | --- | --- |
| categories | `asset_categories` + 有効 `ship_asset_masters` | なし |
| largeClasses | `asset_large_classes` + 有効 `ship_asset_masters` | categoryId |
| mediumClasses | `asset_medium_classes` + 有効 `ship_asset_masters` | largeClassId |
| assetItems | `asset_items` + 有効 `ship_asset_masters` | mediumClassId |

### purchaseManagementPatchQuotationDataBoxAssetProvisionalRegistrationItemsByOrderItemId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_acceptance` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_acceptance` が有効であること
- 認可条件: 対象RFQは `rfqs.management_type='PURCHASE'` かつ `workflow_type='RFQ'` かつ `deleted_at IS NULL` であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象RFQが `management_type='PURCHASE'`、`workflow_type='RFQ'`、`status='納期確定'`、`deleted_at IS NULL` であることを検証する。
3. 対象発注明細が指定RFQの発注に属し、削除済みではないことを検証する。
4. `payload.shipAssetMasterId` が指定された場合は、有効な `ship_asset_masters.is_active=true` と JOIN 先の有効マスタから Category / 大分類 / 中分類 / 品目 / メーカー / 型式を再解決する。
5. `payload.shipAssetMasterId` 未指定で分類IDを保存する場合は、`payload.categoryId`、`payload.largeClassId`、`payload.mediumClassId`、`payload.assetItemId` の親子関係を `asset_categories`、`asset_large_classes`、`asset_medium_classes`、`asset_items` で検証する。品目まで指定された場合は、同じ組み合わせを持つ有効な `ship_asset_masters.is_active=true` が存在することを確認する。
6. 分類選択を保存する場合、APIはマスタから表示名を再解決し、`individuals.ship_asset_master_id`、`category_id`、`category_name`、`large_class_id`、`large_class_name`、`medium_class_id`、`medium_class_name`、`asset_item_id`、`asset_item_name` に検収時点の分類スナップショットとして保存する。
7. `individuals` には検収個体として必要な `item_name`、`maker_name`、`model_name`、`acquired_on`、`acquisition_amount`、`building_name`、`floor_name`、`department_name`、`section_name`、`room_name`、`width_mm`、`depth_mm`、`height_mm`、`qr_code_value`、`serial_no` を保持する。
8. `quotation_items` は見積登録時点の明細・AI判定・分類結果の正本として扱い、検収登録の個体単位入力では上書きしない。
9. `payload.widthMm`、`payload.depthMm`、`payload.heightMm` は各50文字以内とし、入力された場合はmm単位の数値文字列として解釈できることを検証する。
10. `payload.remarks` は受領時メモとして `order_items.remarks` に保存する。
11. `payload.photoDocuments[].filePartName` が multipart の写真ファイルパートに存在することを確認し、拡張子・MIME Type は画像として許可された形式に限定する。
12. 新規検収写真ファイル本体をAPI内でAmazon S3へPutObjectし、S3オブジェクトキーは `application-documents/facility-{facilityId}/{yyyy}/{mm}/{uploadUuid}.{ext}` 形式で発行する。keyは保存場所識別子であり、`rfqGroupId` や `orderItemId` などの業務IDを含めない。
13. 検収登録中の写真は資産登録前の工程ドキュメントとして `application_documents` に `owner_type='RFQ'`、`rfq_id`、`step_code='ACCEPTANCE'`、`document_category='PHOTO'`、`document_type`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`taken_at`、`is_primary`、`uploaded_by_user_id`、`uploaded_at` を保存する。S3バケット名やHTTPS URLはDBへ保存しない。
14. `payload.photoDocumentIds` は同一RFQの未削除 `application_documents(owner_type='RFQ', document_category='PHOTO')` であり、`application_document_order_item_links(relation_type='ACCEPTANCE_PHOTO', order_item_id=対象発注明細ID, deleted_at IS NULL)` に有効リンクがあるIDのみ受け付ける。
15. 保存対象の発注明細IDと写真ドキュメントIDの対応は `application_document_order_item_links` に `relation_type='ACCEPTANCE_PHOTO'` として保存する。S3オブジェクトキーの接頭辞から `orderItemId` を再解決しない。
16. Amazon S3保存後にDBメタデータ保存または明細保存へ失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄する。破棄に失敗した場合は 502 (`PURCHASE_FILE_502_S3_WRITE_FAILED`) を返却し、再試行可能な運用ログを残す。
17. 明細単位保存ではRFQステータスを変更しない。RFQの `検収済` への遷移は `POST /quotation-data-box/asset-provisional-registration/complete` で全件条件を満たした場合だけ行う。

### purchaseManagementPostQuotationDataBoxAssetProvisionalRegistrationComplete

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_acceptance` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_acceptance` が有効であること
- 認可条件: 対象RFQは `rfqs.management_type='PURCHASE'` かつ `workflow_type='RFQ'` かつ `deleted_at IS NULL` であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象RFQが `management_type='PURCHASE'`、`status='納期確定'` であることを検証する。
3. 対象発注・発注明細が同一RFQに属することを検証する。
4. PCモードでは `payload.individuals` による全対象明細分の個体情報を一括登録する。モバイルモードでは `PATCH /quotation-data-box/asset-provisional-registration/items/{orderItemId}` で保存済みの明細入力を集約して全件登録条件を確認する。
5. SHIP資産マスタIDまたは大分類 / 中分類 / 品目の選択値が含まれる場合は、No.14a「資産マスタ選択」の `GET /asset-master/filter-options` と同じ有効マスタ母集団で親子関係と有効性を検証する。
6. 分類選択を保存する場合、APIはマスタから表示名を再解決し、`individuals.ship_asset_master_id`、`category_id`、`category_name`、`large_class_id`、`large_class_name`、`medium_class_id`、`medium_class_name`、`asset_item_id`、`asset_item_name` に検収時点の分類スナップショットとして保存する。
7. 保存した分類スナップショットは資産登録時に `asset_ledgers` の分類項目へ反映する。
8. `individuals` は検収済み個体の中間正本としてQR、シリアル、品目名、メーカー、型式、購入年月日、取得金額、分類、設置場所、W/D/H、写真リンクを保持する。
9. `payload.individuals[].photoDocuments` を指定した場合は、各 `filePartName` が multipart の写真ファイルパートに存在することを確認し、拡張子・MIME Type は画像として許可された形式に限定する。
10. 新規検収写真ファイル本体をAPI内でAmazon S3へPutObjectし、S3オブジェクトキーは `application-documents/facility-{facilityId}/{yyyy}/{mm}/{uploadUuid}.{ext}` 形式で発行する。keyは保存場所識別子であり、`rfqGroupId` や `orderItemId` などの業務IDを含めない。
11. 検収登録中の写真は資産登録前の工程ドキュメントとして `application_documents` に `owner_type='RFQ'`、`rfq_id`、`step_code='ACCEPTANCE'`、`document_category='PHOTO'`、`document_type`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`taken_at`、`is_primary`、`uploaded_by_user_id`、`uploaded_at` を保存する。S3バケット名やHTTPS URLはDBへ保存しない。
12. `payload.individuals[].photoDocumentIds` は同一RFQの未削除 `application_documents(owner_type='RFQ', document_category='PHOTO')` であり、`application_document_order_item_links(relation_type='ACCEPTANCE_PHOTO', order_item_id=当該個体のorderItemId, deleted_at IS NULL)` に有効リンクがあるIDのみ受け付ける。
13. 保存対象の発注明細IDと写真ドキュメントIDの対応は `application_document_order_item_links` に `relation_type='ACCEPTANCE_PHOTO'` として保存する。S3オブジェクトキーの接頭辞から `orderItemId` を再解決しない。
14. Amazon S3保存後にDBメタデータ保存または検収登録トランザクションへ失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄する。破棄に失敗した場合は 502 (`PURCHASE_FILE_502_S3_WRITE_FAILED`) を返却し、再試行可能な運用ログを残す。
15. `individuals` を作成または更新し、`registration_status='PROVISIONAL'`、検収日、品目名、メーカー、型式、購入年月日、取得金額、分類、設置場所、W/D/H、QR、シリアル、仮勘定科目を保持する。
16. 全対象数量分の個体が登録済みになった場合だけ `rfqs.status='検収済'` に更新する。
17. 対象RFQに紐づく購入申請のうち、同一申請配下の有効な購入申請明細がすべて検収登録済以降へ到達した申請は `applications.status='検収済'` へ更新し、`application_status_histories` を登録する。

### purchaseManagementPostQuotationDataBoxAssetRegistrationRegisterBulk

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_acceptance` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_acceptance` が有効であること
- 認可条件: 対象RFQは `rfqs.management_type='PURCHASE'` かつ `workflow_type='RFQ'` かつ `deleted_at IS NULL` であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象RFQが `management_type='PURCHASE'`、`status='検収済'` であることを検証する。
3. 対象発注に属する `individuals.registration_status='PROVISIONAL'` の個体が必要数量分揃っていることを確認する。
4. 各個体から `asset_ledgers` を作成し、検収登録で確定した `category_id`、大分類名、中分類名、品目ID・品目名、`ship_asset_master_id`、メーカー、型式、QR、シリアル、`facility_location_id`、室名、W/D/H、取得金額、契約・見積情報、発注日、納品日、検収日、固定資産番号、`source_order_item_id` を反映する。棟/階/部門/部署の入力値は `individuals` の検収時点履歴として保持し、原本資産の表示では `asset_ledgers.facility_location_id` からロケーションを解決する。`individuals.ship_asset_master_id` が有効マスタとして確認できる場合は優先し、未設定の場合だけ分類・品目・メーカー・型式から一意に再解決できる場合に設定する。
5. `individuals.asset_ledger_id` と `registration_status='REGISTERED'` を更新する。
6. `assets[].photoDocumentIds` 未指定時は、当該個体の `orderItemId` に対応する `application_document_order_item_links(relation_type='ACCEPTANCE_PHOTO', deleted_at IS NULL)` から有効な未削除RFQ写真をAPIが再解決する。
7. `assets[].photoDocumentIds` 指定時は、各IDが同一RFQ、未削除 `application_documents(owner_type='RFQ', document_category='PHOTO')`、かつ当該個体の `orderItemId` に対応する有効な `application_document_order_item_links(relation_type='ACCEPTANCE_PHOTO', deleted_at IS NULL)` を持つことを検証する。不一致は 400 (`VALIDATION_ERROR`) とする。
8. 原本資産へ反映する検収写真は上記のリンクテーブル検証を通過した写真に限定し、S3オブジェクトキーの接頭辞から `orderItemId` を判定しない。
9. 検収写真はS3オブジェクト自体を再アップロードせず、作成した原本資産の `application_documents.owner_type='ASSET_LEDGER'`、`asset_ledger_id`、`document_category='PHOTO'`、`document_type`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`taken_at`、`is_primary`、`uploaded_by_user_id`、`uploaded_at` としてメタデータを複製する。
10. `purchase_application_details.purchase_type` に応じ、`NEW` は新規原本資産作成、`EXPANSION` は既存資産を維持した増設分作成、`REPLACEMENT` は新規原本資産作成と既存資産の `replacement_action` による後処理追跡を行う。
11. `replacement_action='DISPOSAL'` は `disposal_application_details.related_purchase_application_id`、`replacement_action='TRANSFER'` は `transfer_application_details.related_purchase_application_id` で起点購入申請を追跡する。
12. 更新購入の廃棄/移動後処理は、資産申請起票APIで作成済みの関連廃棄/移動申請を後続管理側で進める。購入管理APIは関連申請を新規起票しない。
13. 全件成功時に `rfqs.status='完了'`、`completed_on`、`last_status_changed_at` を更新する。
14. 対象RFQに紐づく購入申請のうち、同一申請配下の有効な購入申請明細がすべて原本登録済になった申請は `applications.status='完了'` へ更新し、`application_status_histories` を登録する。

### purchaseManagementDeleteQuotationDataBoxRfqGroupsByRfqGroupId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_purchase` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_purchase` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象RFQが `management_type='PURCHASE'`、`deleted_at IS NULL` であることを検証する。
3. 削除可能ステータスは `見積依頼` / `見積依頼済` / `見積DB登録済` / `見積登録依頼中` / `発注用見積依頼済` / `発注見積登録済` とする。
4. `発注済` / `納期確定` / `検収済` / `完了` 以降は削除不可とし、409を返す。
5. `rfqs.deleted_at` を設定し、関連する `rfq_vendors`、`quotations`、`quotation_items`、`quotation_item_application_links` も同一トランザクションで論理削除する。
6. `rfq_applications` は採用履歴として保持し、通常一覧・現在割当判定では `rfqs.deleted_at IS NULL` のRFQだけを有効扱いにする。
7. 編集リスト上の現在表示用 `rfq_no` / `rfq_group_name` は、削除したRFQが最新表示中の場合に未割当状態へ戻す。過去グループの再表示は行わない。

## 第6章 権限・業務ルール

### 責務境界

- 資産一覧からの購入申請起票は No.13 資産申請起票API設計書を正本とし、本書では起票済み購入申請の受付以降を扱う
- 編集リスト本体操作、Data Link、見積DB Link、行削除、行順変更、フリーカラム、編集リスト画面で選択行から実行する通常購入RFQ作成は No.23 編集リストAPI設計書を正本とする
- 購入管理タブの申請受付一覧から行う通常編集リスト新規作成・購入申請取り込み、および既存通常編集リストへの購入申請取り込みは本書で扱う
- 購入管理タブでは作成済み `rfqs.management_type='PURCHASE'` のRFQ一覧表示と後続進行を扱い、リモデル管理のRFQとは混在させない
- 業者への見積依頼送信、Outlook連携、個別送信API、`send-bulk`、`rfq_vendors.request_status='SENT'` 更新はPhase1の本書では扱わない
- SHIP代理作業依頼の作成・一覧・担当取得・差戻し・完了・取消APIはPhase2対象であり、本書では扱わない。`SHIPへ依頼` は見積書アップロード後のOCR〜見積DB登録代理依頼であり、業者への見積依頼送信とは別責務とする
- OCR抽出、OCRジョブ制御、OCR結果取込・補正APIは本書の対象外とし、見積登録APIは手動入力された見積明細を保存する
- 検収登録モバイルの大分類 / 中分類 / 品目ドロップダウン候補は No.14a 資産マスタ選択APIの有効マスタ母集団を正本とする

### 購入申請受付ルール

- 申請受付一覧は `applications.application_type='PURCHASE'`、`status='申請中'`、`edit_list_id IS NULL` の購入申請を未処理キューとして扱う
- 編集リスト取り込み後は `applications.edit_list_id` を設定し、`applications.status='編集中'` へ更新する。`受付済` のような中間ステータスは設けない
- 購入申請却下は `status='申請中'` の間だけ許可する。編集リスト取り込み後の却下は行わない
- 却下理由は画面に入力欄がないため任意とし、指定された場合のみ `application_status_histories.comment` へ保存する
- 同一購入申請明細の同一編集リストへの重複取り込みは、`edit_list_items.source_type='APPLICATION'` と `(edit_list_id, source_application_id, source_application_asset_id)` の一意性で防止する
- 通常購入RFQ作成後の購入申請ステータスは、`rfq_applications.edit_list_item_id` から `edit_list_items.source_application_id` / `source_application_asset_id` を辿ってロールアップする。複数RFQに分割された申請は、同一申請配下の有効な購入申請明細のうち最も遅れている工程を `applications.status` とし、完了は全明細の原本登録後とする

### RFQ・見積ルール

- `rfqs` は見積依頼グループの正本であり、複数業者への相見積もりは `rfq_vendors` 複数行で表現する
- RFQ詳細・依頼書プレビュー・見積登録対象明細は `rfq_applications` に紐づく編集リスト明細だけを返し、同一編集リスト内の未選択明細を含めない
- `rfq_vendors.request_status='DRAFT'` の行のみ業者情報、提出期限、補足メモを更新または削除できる
- Phase1のNo.25では業者への見積依頼送信をシステム上で管理しない。`SENT` はPhase2のOutlook連携または送信管理を持つ他業務で利用し、No.25の見積登録確定時は対象業者を取得済みとして扱う場合に `REPLIED` を利用できる
- 通常見積登録確定時は `rfqs.status='見積依頼'` から `見積DB登録済` へ、発注登録用見積の確定時は `見積依頼` から `発注見積登録済` へ直接遷移できる。`見積依頼済` はPhase1の通常購入では主に未使用とする
- 参考系見積から発注登録用見積へ進む場合、同一RFQのフェーズ更新ではなく、編集リスト側で発注登録用見積として別RFQグループを作成する。購入管理では作成済みRFQの後続進行を扱う
- 登録区分登録では `ABC` / `D` / `OTHER` 判定を初期値として使い、値引き系キーワードに該当する `OTHER` 行だけ `値引き` として扱う
- 個体品目AI判定では `その他` / `値引き` 行をAI推薦対象外とする

### 発注・検収・資産登録ルール

- 発注登録は `rfqs.status='発注見積登録済'` のRFQに限り許可し、登録成功時に `発注済` へ進める
- 納品検収予定日登録は `rfqs.status='発注済'` のRFQに限り許可し、登録成功時に `納期確定` へ進める
- 資産仮登録の初期表示では、対象発注明細、保存済み個体、分類候補、設置場所候補を取得する。保存済み個体がある場合はW/D/Hも返す。大分類 / 中分類 / 品目は `asset_categories`、`asset_large_classes`、`asset_medium_classes`、`asset_items` と有効な `ship_asset_masters` の組み合わせから生成する
- 検収登録明細保存では、選択された分類階層の親子関係と有効マスタ組み合わせを検証し、分類表示名をマスタから再解決して `individuals` へ保存する
- 資産仮登録は `rfqs.status='納期確定'` のRFQに限り許可し、対象数量分の `individuals` が揃った場合だけ `検収済` へ進める
- 資産登録は `rfqs.status='検収済'` のRFQに限り許可し、`individuals` の分類、施設ロケーション、室名、W/D/H、QR、シリアルなどを `asset_ledgers` へ反映して `完了` へ進める
- 更新購入の後処理は申請時の `application_assets.replacement_action` に従い、廃棄管理、移動管理、または継続利用として扱う。`DISPOSAL` は `disposal_application_details.related_purchase_application_id`、`TRANSFER` は `transfer_application_details.related_purchase_application_id` で起点購入申請を追跡し、購入管理APIは関連廃棄/移動申請を新規起票しない

### 削除・競合ルール

- RFQ削除は `発注済` 到達前のステータスだけ許可する。`発注済` / `納期確定` / `検収済` / `完了` 以降は削除不可とする
- RFQ削除時は `rfqs`、`rfq_vendors`、`quotations`、`quotation_items`、`quotation_item_application_links` を同一トランザクションで論理削除する
- `rfq_applications` は採用履歴として保持し、通常一覧・現在割当判定では `rfqs.deleted_at IS NULL` のRFQだけを有効扱いとする
- 既存編集リストへの購入申請取り込みは編集リスト明細を追加するため、有効な `edit_list_work_locks.lock_token` を必須とする
- 変更系APIは `expectedUpdatedAt` または `Idempotency-Key` により競合更新と二重送信を検出する

### ファイル保存ルール

- 見積原本と検収写真のファイル実体はAPI内でAmazon S3へPutObjectし、`application_documents.file_path` にはS3オブジェクトキーのみを保存する
- S3バケット名、S3の直接URL、S3オブジェクトキーはリクエスト/レスポンスで直接扱わない。表示・ダウンロードが必要な場合は、認可済みURLをAPI側で発行して返す
- `storageFormat` / `application_documents.storage_format` / `orders.storage_format` は保存先ではなく電子取引/スキャナ保存/未指定などの保存形式を表す列として扱い、S3保存有無の表現には使用しない
- S3保存に成功し、DBメタデータ保存または業務トランザクションに失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄してからエラー応答する
- 検収写真を原本資産へ反映する場合は、`application_document_order_item_links(relation_type='ACCEPTANCE_PHOTO')` で当該 `orderItemId` との対応を検証したうえで、S3オブジェクト自体を再アップロードせず、同一S3オブジェクトキーを含む `application_documents` メタデータを `owner_type='ASSET_LEDGER'` 側へ複製する
- DB確定後に文書や写真を削除する後続APIを追加する場合は、`application_documents.deleted_at` の論理削除を正本とし、S3実体は同一S3オブジェクトキーを参照する有効メタデータがなくなったことと保存期間を確認するストレージ削除処理で扱う

## 第7章 エラーコード一覧

| エラーコード | HTTPステータス | 内容 | 発生条件 |
| --- | --- | --- | --- |
| AUTH_401_UNAUTHORIZED | 401 | 認証情報が存在しない、または無効 | Bearer トークン未指定、期限切れ、署名不正 |
| FACILITY_NOT_FOUND | 404 | 作業対象施設を参照できない | Bearer トークン上の作業対象施設が存在しない、または削除済み |
| AUTH_403_PURCHASE_DENIED | 403 | 購入管理の実効権限がない | 通常アカウントで `normal_purchase` が実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする |
| AUTH_403_QUOTATION_DENIED | 403 | 通常購入の見積登録・見積参照権限がない | 通常アカウントで `normal_quotation` が実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする |
| AUTH_403_ORDER_DENIED | 403 | 通常購入の発注権限がない | 通常アカウントで `normal_order` が実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする |
| AUTH_403_ACCEPTANCE_DENIED | 403 | 通常購入の検収・原本登録権限がない | 通常アカウントで `normal_acceptance` が実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする |
| PURCHASE_APPLICATION_NOT_FOUND | 404 | 購入申請を参照できない | ID不存在、施設不一致、削除済み、購入申請以外、または権限外 |
| PURCHASE_APPLICATION_STATUS_CONFLICT | 409 | 購入申請の状態が操作条件を満たさない | 申請中以外の却下または編集リスト取り込み、既に取り込み済みの申請を処理した |
| EDIT_LIST_NOT_FOUND | 404 | 編集リストを参照できない | ID不存在、施設不一致、削除済み、または `list_type='PURCHASE'` ではない |
| EDIT_LIST_LOCK_CONFLICT | 409 | 編集リスト作業ロックが無効 | 既存編集リストへの取り込み時に `lock_token` が未指定、期限切れ、または保持者不一致 |
| RFQ_GROUP_NOT_FOUND | 404 | RFQグループを参照できない | ID不存在、施設不一致、削除済み、または `management_type='PURCHASE'` ではない |
| RFQ_STATUS_CONFLICT | 409 | RFQステータスが操作条件を満たさない | 発注済以降の削除、見積登録条件不一致、ステータス遷移順序不一致 |
| RFQ_VENDOR_NOT_FOUND | 404 | 見積依頼先を参照できない | ID不存在、RFQ不一致、削除済み |
| QUOTATION_NOT_FOUND | 404 | 見積を参照できない | ID不存在、RFQ不一致、削除済み |
| ORDER_NOT_FOUND | 404 | 発注を参照できない | ID不存在、RFQ不一致 |
| ORDER_QUOTATION_REQUIRED | 409 | 発注登録用見積が確定済みでない | 発注登録時に `発注見積登録済` のRFQまたは採用見積が存在しない |
| INDIVIDUAL_REGISTRATION_INCOMPLETE | 409 | 検収登録済み個体が不足している | 資産登録時に対象発注明細分の `individuals` が未作成 |
| PURCHASE_FILE_502_S3_WRITE_FAILED | 502 | Amazon S3 へのファイル保存またはロールバック削除に失敗した | 見積原本または検収写真のAmazon S3 PutObject、またはDB失敗時の保存済みS3オブジェクト破棄に失敗した |
| VALIDATION_ERROR | 400 | 入力値不正 | 必須不足、列挙値不正、文字数超過、日付前後関係不正 |
| CONFLICT | 409 | 競合更新 | `expectedUpdatedAt` または `Idempotency-Key` の競合 |
| INTERNAL_SERVER_ERROR | 500 | サーバー内部エラー | 想定外例外 |

## 第8章 運用・保守方針

### データ保守方針

- 購入申請の正本は `applications` / `purchase_application_details` / `application_assets` とし、購入管理タブでは起票済み申請の状態更新と編集リスト取り込みを行う
- 通常購入RFQの正本は `rfqs.management_type='PURCHASE'` とし、リモデル、廃棄、修理、保守契約のRFQと混在させない
- 見積明細の分類、AI判定、按分結果は `quotation_items` に保持し、原本資産へは資産登録完了時に必要項目だけ反映する
- 検収登録で利用する大分類 / 中分類 / 品目候補は No.14a 資産マスタ選択APIと同じ有効 `ship_asset_masters` 母集団から生成し、保存時は `individuals` の分類ID・分類名・`ship_asset_master_id` を更新する
- 検収登録済み個体の中間正本は `individuals` とし、資産登録完了時に `asset_ledgers` を作成して `registration_status='REGISTERED'` へ更新する
- ファイル実体はAmazon S3に保存し、本APIでは `application_documents` にS3オブジェクトキー、ファイルメタデータ、工程上の所有者を保持する。APIレスポンスではS3オブジェクトキーやS3バケット名を直接返さない

### 拡張時の留意点

- OCR連携を追加する場合は、OCRジョブ、抽出結果、補正結果、手動入力との差分を別APIとして設計し、本書の手動入力APIと責務を混在させない
- SHIP代理作業依頼を実装する場合は、見積書アップロード後のOCR〜見積DB登録代理依頼として別APIで設計し、業者への見積依頼送信や `rfq_vendors.request_status='SENT'` 更新と混在させない
- 承認フローや見積承認が追加される場合は、`application_approval_steps` または別承認APIとの責務境界を再定義する
- 帳票出力やメール送信を本実装化する場合は、出力ジョブ、送信ログ、再送条件、SES設定を運用設計と合わせて追加する
- 固定資産番号の必須性や採番ルールは施設運用差があるため、施設設定で必須化する場合は資産登録APIのバリデーション条件として追加する
