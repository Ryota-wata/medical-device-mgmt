# 編集リスト API内部設計

## 第1章 概要

### 本書の目的

本書は、通常購入およびリモデルで利用する編集リスト画面（`/remodel-application`）の API 仕様を定義する。

対象範囲は、編集リスト一覧・作成・削除、作業ロック、明細取得、セル編集、一括編集、明細追加/削除、行順変更、Data Link、見積DB Link、フリーカラム、表示カラム設定/ブックマーク、編集リスト起点RFQ作成、リモデル編集リスト起点の廃棄・移設申請作成である。

資産詳細参照は No.12 資産一覧・資産詳細 API、購入管理タブからの購入申請取り込みは No.25 購入管理 API、リモデルダッシュボードとクローズは No.24 リモデル管理 API を正本とし、本書では重複定義しない。

### 対象システム概要

編集リストは、原本資産台帳を編集用スナップショットとして複製し、通常購入またはリモデルの見積依頼・申請・原本反映に向けた編集値を保持する中核画面である。

通常編集リストは `list_type='PURCHASE'`、リモデル編集リストは `list_type='REMODEL'` として作成し、作成後に種別を切り替えない。通常購入RFQ、リモデルRFQ、廃棄/移設ワークフローを1つの編集リスト内で混在させない。

### 用語定義

| 用語 | 説明 |
| --- | --- |
| 編集リスト | `edit_lists` を親に `edit_list_items` で明細を保持する編集用一覧 |
| 通常編集リスト | `edit_lists.list_type='PURCHASE'` の編集リスト。通常購入管理へRFQを渡す |
| リモデル編集リスト | `edit_lists.list_type='REMODEL'` の編集リスト。リモデルRFQ、廃棄、移設、リモデルクローズへ渡す |
| 作業ロック | `edit_list_work_locks` で管理する編集リスト単位の排他制御。他ユーザー作業中は画面入場不可 |
| 明細ソース種別 | `BASE_ASSET` / `APPLICATION` / `MANUAL` / `QUOTATION`。画面上の仮番号ではなく `edit_list_item_id` を正本キーにする |
| Data Link | 資産Master、業者Master、原本リストから選択カラムを編集リストの作業値へ転記する機能 |
| 見積DB Link | RFQ配下の見積明細を編集リスト明細へ1対1で紐づけ、見積情報を転記する機能 |

### 対象画面

| 画面名 | 画面パス | 利用目的 |
| --- | --- | --- |
| 編集リスト画面 | /remodel-application | 通常購入/リモデルの編集リスト本体操作、Data Link、見積DB Link、RFQ作成、廃棄・移設申請作成を行う |
| 通常編集リスト選択モーダル | /quotation-data-box/purchase-management から起動 | 通常編集リスト候補表示・作成。購入申請取り込み自体は購入管理APIを利用する |
| リモデル編集リスト選択モーダル | /quotation-data-box/remodel-management から起動 | リモデル編集リスト候補表示・作成 |

## 第2章 システム全体構成

### API の位置づけ

本API群は、編集リスト画面内の作業値を保存・参照する。セル編集、Data Link、見積DB Link、フリーカラム、行順、RFQ作成、廃棄/移設申請作成の保存単位を個別APIとして扱い、画面全体の一括保存APIは提供しない。

編集リストの通常操作では原本 `asset_ledgers`、申請正本、見積正本を直接更新しない。原本反映は通常購入の資産登録完了、またはリモデル管理のクローズ時に後続APIで行う。

### 画面と API の関係

| 画面操作 | API | 補足 |
| --- | --- | --- |
| 編集リスト候補表示 | `GET /edit-lists` | `listType=PURCHASE` / `REMODEL` で導線ごとに分離する |
| 編集リスト新規作成 | `POST /edit-lists` | 対象施設の原本資産を `BASE_ASSET` としてコピーする |
| 既存編集リスト入場 | `POST /edit-lists/{editListId}/lock` | 他ユーザー作業中は入場不可 |
| 画面初期表示 | `GET /edit-lists/{editListId}/items` | ヘッダー、ロック、固定列、フリーカラム、明細を取得する |
| セル編集 | `PATCH /edit-lists/{editListId}/items/{editListItemId}` | 固定列、フリーカラムへ保存する |
| 一括編集 | `PATCH /edit-lists/{editListId}/items/bulk` | 選択明細の同一カラムを一括保存する |
| 更新/増設/新規要望 | `POST /edit-lists/{editListId}/items` | 専用APIを増やさず明細追加APIの業務ケースとして扱う |
| 行順変更 | `PATCH /edit-lists/{editListId}/items/reorder` | `row_no` を再採番する |
| 行削除 | `DELETE /edit-lists/{editListId}/items/{editListItemId}` | 論理削除。元データは削除しない |
| フリーカラム操作 | `GET/POST/PATCH/DELETE /edit-lists/{editListId}/free-columns` | 列定義と値を編集リスト内限定で管理する |
| Data Link | `POST /data-link/preview` / `POST /data-link/apply` | プレビュー後に作業値へ転記する |
| 見積DB Link | `GET /quotation-link/candidates` / `POST /quotation-link/apply` / `DELETE /quotation-link/{editListItemId}` | RFQ/見積/明細IDを正本キーにする |
| 廃棄・移設申請 | `POST /applications/disposal-transfer` | リモデル編集リスト限定で申請とREMODELワークフローを作成する |
| 見積依頼グループ作成 | `POST /rfq-groups` | RFQ No.は作成確定時に採番する |
| 表示カラム設定/ブックマーク | `/user-column-settings` / `/user-column-setting-presets` | 表示/非表示だけを保存し、列幅・列順・ソートは保存しない |

### 使用テーブル

| テーブル/VIEW | 利用種別 | 用途 |
| --- | --- | --- |
| `users` | READ | 共有システム管理者アカウント判定、作業ロック保持者名・作成者名の解決 |
| `facilities` | READ | Bearer トークン上の作業対象施設、編集リスト対象施設、主施設の存在確認・未削除判定 |
| `user_facility_assignments` | READ | 通常アカウントの作業対象施設割当判定 |
| `facility_feature_settings` | READ | 通常アカウントの作業対象施設における編集リスト、RFQ、廃棄・移設機能の提供有無判定 |
| `user_facility_feature_settings` | READ | 通常アカウントのユーザー×作業対象施設単位の編集リスト、RFQ、廃棄・移設機能の利用可否判定 |
| `edit_lists` | READ / CREATE / UPDATE / DELETE | 編集リストヘッダー、種別、ステータス、削除、クローズ状態 |
| `edit_list_work_locks` | READ / CREATE / UPDATE | 作業ロック取得、heartbeat、通常解除、更新系API検証 |
| `edit_list_facilities` | READ / CREATE | 編集リスト対象施設 |
| `edit_list_items` | READ / CREATE / UPDATE / DELETE | 固定58列の作業スナップショット、行順、ソース種別、RFQ現在表示 |
| `edit_list_free_columns` | READ / CREATE / UPDATE / DELETE | 編集リスト内限定のフリーカラム定義 |
| `edit_list_free_column_values` | READ / CREATE / UPDATE / DELETE | フリーカラム行別値 |
| `asset_ledgers` | READ | 編集リスト作成時の原本コピー元、原本リストData Linkの転記元 |
| `qr_codes` | READ | 編集リスト作成時に原本資産へ紐づくQR情報を作業スナップショットへ取り込む |
| `ship_asset_masters` / `ship_asset_master_details` | READ | 資産Master Data Link、品目/メーカー/型式編集時の再解決 |
| `vendors` | READ | 業者Master Data Link |
| `applications` / `purchase_application_details` / `application_assets` | CREATE / READ / UPDATE | インライン新規要望、廃棄・移設申請、申請由来明細 |
| `application_status_histories` | CREATE | インライン新規要望、廃棄・移設申請の状態履歴 |
| `rfqs` | CREATE / READ / UPDATE | 通常RFQグループと見積DB Link候補。廃棄/移設申請起票APIでは作成しない |
| `rfq_applications` | CREATE / READ | 通常RFQ作成時の採用明細リンク。廃棄/移設申請起票では作成せず、廃棄はNo.27のグループ作成時に作成する |
| `quotations` / `quotation_items` | READ | 見積DB Linkの候補、転記元 |
| `quotation_item_application_links` | READ / CREATE / DELETE | 見積明細と編集リスト明細の1対1リンク |
| `user_column_settings` | READ / CREATE / UPDATE | ユーザー別表示カラム設定 |
| `user_column_setting_presets` / `user_column_setting_preset_items` | READ / CREATE / UPDATE / DELETE | 表示カラムブックマーク |

## 第3章 共通仕様

### API 共通仕様

- 通信方式: HTTPS
- データ形式: JSON
- 文字コード: UTF-8
- 日時形式: ISO 8601（例: `2026-05-28T10:00:00+09:00`）
- 日付形式: `YYYY-MM-DD`
- 認証済みAPIは Bearer トークンを `Authorization` ヘッダーに付与する
- 変更系APIは `lockToken` を必須とし、必要に応じて `Idempotency-Key` または `expectedUpdatedAt` で二重送信・競合更新を検出する
- 論理削除は `deleted_at` または対象テーブルの状態列で扱い、監査・履歴参照に必要なリンクは保持する

### 認証・認可

本API群はロール固定ではなく、対象施設に対する実効 `feature_code` で認可する。通常アカウントでは、Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）では、作業対象施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず、編集リスト、RFQ作成、廃棄・移設申請の対象 `feature_code` を有効として扱う。

| 機能コード | 対象操作 | 説明 |
| --- | --- | --- |
| `normal_edit_list` | 通常編集リスト一覧・作成・入場・編集 | 通常購入用編集リストの基本権限 |
| `remodel_edit_list` | リモデル編集リスト一覧・作成・入場・編集 | リモデル用編集リストの基本権限 |
| `normal_purchase` | 通常編集リスト起点RFQ作成 | 通常購入RFQを作成する追加権限 |
| `remodel_purchase` | リモデル編集リスト起点RFQ作成 | リモデルRFQを作成する追加権限 |
| `transfer_disposal` | リモデル編集リスト起点の廃棄・移設申請作成 | 廃棄/移設の申請正本作成の追加権限。後続グループ・ワークフロー操作は各管理APIへ委譲 |

### 作業対象施設ベースの認可

- 各 API は Bearer トークン上の作業対象施設が存在し、未削除であることを確認する
- 通常アカウントでは、作業対象施設に対する有効担当施設割当と実効 `feature_code` を都度再判定する
- 共有システム管理者アカウントでは、作業対象施設が未削除であれば通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による認可判定をバイパスする
- 編集リストの `list_type`、対象編集リストの未削除、クローズ済み更新不可、有効な作業ロック、廃棄・移設申請は `REMODEL` 限定といった業務制約は共有システム管理者でもバイパスしない
- 通常アカウントで作業対象施設に対して必要な実効 `feature_code` がない場合は 403 を返却する
- 作業対象施設が存在しない、または削除済みの場合は 404 を返却する

### 作業ロック共通仕様

- 既存編集リストを開く時点で `POST /edit-lists/{editListId}/lock` を呼び出し、作業ロックを取得する
- 有効な他ユーザーロックがある場合、編集リスト画面へ入場できない。APIは作業中ユーザー名、開始時刻、有効期限を返す
- 明細取得APIと編集リスト更新系APIは有効な `lockToken` を必須とする
- heartbeatまたは編集系API成功時に `last_heartbeat_at` と `lock_expires_at` を更新し、有効期限を60分後へ延長する
- 強制解除APIは提供しない。通信断やブラウザ放置は期限切れで解除扱いとする
- タスク管理側で既存RFQを進行・削除するAPIは編集リスト作業ロックの対象外とする

### 共通エラーレスポンス

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| code | string | ✓ | エラーコード |
| message | string | ✓ | 利用者向けメッセージ |
| details | string[] | - | 入力項目単位のエラーや補足情報 |
| traceId | string | - | 調査用トレースID |

## 第4章 API一覧

| No | API名 | Method | Path | 用途 | 主権限 |
| --- | --- | --- | --- | --- | --- |
| 23-01 | 編集リスト一覧取得 | GET | /edit-lists | 通常/リモデル編集リスト候補表示 | normal_edit_list / remodel_edit_list |
| 23-02 | 編集リスト新規作成 | POST | /edit-lists | 編集リスト作成と原本コピー | normal_edit_list / remodel_edit_list |
| 23-03 | 編集リスト削除 | DELETE | /edit-lists/{editListId} | 編集リスト論理削除 | normal_edit_list / remodel_edit_list |
| 23-04 | 作業ロック取得 | POST | /edit-lists/{editListId}/lock | 既存編集リスト入場ロック | normal_edit_list / remodel_edit_list |
| 23-05 | 作業ロックheartbeat | POST | /edit-lists/{editListId}/lock/heartbeat | 作業ロック延長 | normal_edit_list / remodel_edit_list |
| 23-06 | 作業ロック解除 | DELETE | /edit-lists/{editListId}/lock | 画面離脱/ログアウト時解除 | normal_edit_list / remodel_edit_list |
| 23-07 | 編集リスト明細取得 | GET | /edit-lists/{editListId}/items | ヘッダー、列、明細、リンク状態取得 | normal_edit_list / remodel_edit_list |
| 23-08 | 編集リスト明細追加 | POST | /edit-lists/{editListId}/items | 新規要望、更新、増設、手動/見積由来行追加 | normal_edit_list / remodel_edit_list |
| 23-09 | セル編集保存 | PATCH | /edit-lists/{editListId}/items/{editListItemId} | 単一明細更新 | normal_edit_list / remodel_edit_list |
| 23-10 | 一括編集保存 | PATCH | /edit-lists/{editListId}/items/bulk | 選択明細一括更新 | normal_edit_list / remodel_edit_list |
| 23-11 | 行順変更 | PATCH | /edit-lists/{editListId}/items/reorder | row_no保存 | normal_edit_list / remodel_edit_list |
| 23-12 | 編集リスト明細削除 | DELETE | /edit-lists/{editListId}/items/{editListItemId} | 明細論理削除 | normal_edit_list / remodel_edit_list |
| 23-13 | フリーカラム一覧取得 | GET | /edit-lists/{editListId}/free-columns | フリーカラム定義取得 | normal_edit_list / remodel_edit_list |
| 23-14 | フリーカラム追加 | POST | /edit-lists/{editListId}/free-columns | フリーカラム定義追加 | normal_edit_list / remodel_edit_list |
| 23-15 | フリーカラム名更新 | PATCH | /edit-lists/{editListId}/free-columns/{freeColumnId} | フリーカラム表示名更新 | normal_edit_list / remodel_edit_list |
| 23-16 | フリーカラム削除 | DELETE | /edit-lists/{editListId}/free-columns/{freeColumnId} | フリーカラムと値の論理削除 | normal_edit_list / remodel_edit_list |
| 23-17 | Data Linkプレビュー | POST | /edit-lists/{editListId}/data-link/preview | 転記差分プレビュー | normal_edit_list / remodel_edit_list |
| 23-18 | Data Link適用 | POST | /edit-lists/{editListId}/data-link/apply | 作業値への転記反映 | normal_edit_list / remodel_edit_list |
| 23-19 | 見積DB Link候補取得 | GET | /edit-lists/{editListId}/quotation-link/candidates | RFQ/見積明細候補取得 | normal_edit_list / remodel_edit_list |
| 23-20 | 見積DB Link適用 | POST | /edit-lists/{editListId}/quotation-link/apply | 1対1紐付け、転記、新規行追加 | normal_edit_list / remodel_edit_list |
| 23-21 | 見積DB Link解除 | DELETE | /edit-lists/{editListId}/quotation-link/{editListItemId} | 見積明細リンク解除 | normal_edit_list / remodel_edit_list |
| 23-22 | 廃棄・移設申請一括作成 | POST | /edit-lists/{editListId}/applications/disposal-transfer | リモデル廃棄/移設の申請正本作成。廃棄依頼グループはNo.27へ委譲 | remodel_edit_list + transfer_disposal |
| 23-23 | 廃棄申請個別作成 | POST | /edit-lists/{editListId}/applications/disposal | 廃棄対象だけの互換/個別作成 | remodel_edit_list + transfer_disposal |
| 23-24 | 移設申請個別作成 | POST | /edit-lists/{editListId}/applications/transfer | 移設対象だけの互換/個別作成 | remodel_edit_list + transfer_disposal |
| 23-25 | RFQグループ作成 | POST | /edit-lists/{editListId}/rfq-groups | 編集リスト選択行からRFQ作成 | normal_purchase / remodel_purchase |
| 23-26 | 表示カラム設定取得 | GET | /user-column-settings?screenId=edit_list | 表示/非表示とブックマーク取得 | 編集リスト入口権限 |
| 23-27 | 表示カラム設定保存 | PUT | /user-column-settings?screenId=edit_list | 現在の表示/非表示保存 | 編集リスト入口権限 |
| 23-28 | 表示カラムブックマーク保存 | POST | /user-column-setting-presets | 表示カラムブックマーク作成 | 編集リスト入口権限 |
| 23-29 | 表示カラムブックマーク適用 | POST | /user-column-setting-presets/{presetId}/apply | ブックマーク適用 | 編集リスト入口権限 |
| 23-30 | 表示カラムブックマーク削除 | DELETE | /user-column-setting-presets/{presetId} | ブックマーク論理削除 | 編集リスト入口権限 |

## 第5章 機能設計

### getEditLists

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントで `listType=PURCHASE` または対象 `edit_lists.list_type='PURCHASE'` の場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_edit_list` が有効であること
- 認可条件: 通常アカウントで `listType=REMODEL` または対象 `edit_lists.list_type='REMODEL'` の場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `remodel_edit_list` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `edit_lists.deleted_at IS NULL` かつ `edit_lists.list_type = listType` の編集リストだけを返す。
3. 対象施設は `edit_list_facilities` の施設または `edit_lists.primary_facility_id` で絞り込む。
4. 通常編集リスト導線で `REMODEL`、リモデル導線で `PURCHASE` を取得しない。
5. `last_accessed_at DESC, edit_list_id DESC` で並び替え、候補モーダル用にリスト名、対象施設、作成者、ステータスを返す。

### postEditLists

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントで `listType=PURCHASE` または対象 `edit_lists.list_type='PURCHASE'` の場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_edit_list` が有効であること
- 認可条件: 通常アカウントで `listType=REMODEL` または対象 `edit_lists.list_type='REMODEL'` の場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `remodel_edit_list` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `edit_lists` を作成し、`list_type` は作成導線で確定する。作成後の種別変更APIは提供しない。
3. `edit_list_facilities` に主施設と対象施設を登録する。
4. 作成時点で対象施設に紐づく有効な `asset_ledgers` を `edit_list_items.source_type='BASE_ASSET'` として必ず全件コピーする。
5. コピー時は分類、設置場所、契約、取得、見積、申請関連の表示値を `edit_list_items` の作業スナップショットとして保持する。
6. 同一原本資産の重複コピーは `(edit_list_id, source_type, source_asset_ledger_id)` で防止する。
7. 作成APIは作業ロックを取得しない。既存リストを開く場合は別途ロック取得APIを呼ぶ。

### deleteEditListsByEditListId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントで `listType=PURCHASE` または対象 `edit_lists.list_type='PURCHASE'` の場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_edit_list` が有効であること
- 認可条件: 通常アカウントで `listType=REMODEL` または対象 `edit_lists.list_type='REMODEL'` の場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `remodel_edit_list` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `edit_lists.deleted_at` を設定する論理削除とし、`rfqs`、`applications`、`quotations`、履歴は削除しない。
3. RFQ割当済み、申請作成済み、見積作成済み、クローズ済みであることを理由に削除不可とはしない。
4. 有効な作業ロックが存在する場合は、ロック保持者本人かつ `lockToken` 一致時だけ削除を許可する。
5. 削除済み編集リストは新規選択候補と編集対象から除外する。

### postEditListsByEditListIdLock

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントで `listType=PURCHASE` または対象 `edit_lists.list_type='PURCHASE'` の場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `normal_edit_list` が有効であること
- 認可条件: 通常アカウントで `listType=REMODEL` または対象 `edit_lists.list_type='REMODEL'` の場合、作業対象施設の `facility_feature_settings` と `user_facility_feature_settings` の両方で `remodel_edit_list` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象編集リストの存在、施設スコープ、導線と `list_type` の一致、削除済みでないことを検証する。
3. 有効ロックは `released_at IS NULL AND lock_expires_at > CURRENT_TIMESTAMP` とする。
4. 有効な他ユーザーロックがある場合は新規ロックを作成せず、作業中ユーザー名、開始時刻、有効期限を返して入場を拒否する。
5. 同一ユーザーが有効ロックを保持している場合は既存ロックを延長し、同じ `lock_token` または再発行した `lock_token` と有効期限を返す。
6. 取得成功時は `edit_list_work_locks` にDB管理のロック行を作成または延長し、有効期限は最終操作から60分とする。
7. ロック取得または同一ユーザー延長に成功した時点で `edit_lists.last_accessed_at` をサーバー時刻で更新する。

### postEditListsByEditListIdLockHeartbeat

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること
- 認可条件: 対象編集リストが `deleted_at IS NULL` であること
- 認可条件: `edit_lists.status='CLOSED'` の編集リストは参照専用とし、更新系APIを拒否すること
- 認可条件: 更新系APIはログインユーザー、`editListId`、`lock_token` が有効な `edit_list_work_locks` と一致すること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. ログインユーザー、`editListId`、`lockToken` が有効ロックと一致することを検証する。
3. `last_heartbeat_at` と `lock_expires_at` をサーバー時刻基準で更新し、有効期限を60分後へ延長する。
4. 期限切れ、解除済み、他ユーザー保持、トークン不一致の場合は延長せずエラーを返す。

### deleteEditListsByEditListIdLock

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること
- 認可条件: 対象編集リストが `deleted_at IS NULL` であること
- 認可条件: `edit_lists.status='CLOSED'` の編集リストは参照専用とし、更新系APIを拒否すること
- 認可条件: 更新系APIはログインユーザー、`editListId`、`lock_token` が有効な `edit_list_work_locks` と一致すること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. ログインユーザー、`editListId`、`lockToken` が有効ロックと一致することを検証する。
3. `released_at` と `release_reason` を設定する。
4. 他ユーザーのロックを解除する強制解除は提供しない。通信断やブラウザ放置は60分の期限切れで解除扱いとする。

### getEditListsByEditListIdItems

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること
- 認可条件: 対象編集リストが `deleted_at IS NULL` であること
- 認可条件: `edit_lists.status='CLOSED'` の編集リストは参照専用とし、更新系APIを拒否すること
- 認可条件: 更新系APIはログインユーザー、`editListId`、`lock_token` が有効な `edit_list_work_locks` と一致すること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 明細取得は編集リスト画面への入場後に呼び出すAPIであるため、有効な `lockToken` を必須とする。
3. ヘッダー表示に必要なリスト名、対象施設、作成日、`listType`、`status`、作業ロック検証結果を同一レスポンスで返す。
4. チェックボックスの選択状態はレスポンスに含めない。RFQ作成、Data Link、見積DB Link、廃棄/移設申請では実行時の `editListItemIds[]` を受け取る。
5. 固定58列の表示値は `edit_list_items` の作業スナップショットを正とし、原本、申請、見積を直接参照して上書きしない。
6. レスポンスの明細値は固定58列の `fixedValues` と編集リスト内限定の `freeColumnValues` に分けて返す。
7. 検索、ソート、列内フィルター、列順、列幅は画面内一時状態であり本APIの保存対象外とする。

### postEditListsByEditListIdItems

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること
- 認可条件: 対象編集リストが `deleted_at IS NULL` であること
- 認可条件: `edit_lists.status='CLOSED'` の編集リストは参照専用とし、更新系APIを拒否すること
- 認可条件: 更新系APIはログインユーザー、`editListId`、`lock_token` が有効な `edit_list_work_locks` と一致すること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `INLINE_NEW` は `applications` / `purchase_application_details` / `application_assets` を同一トランザクションで作成し、申請番号をサーバー採番する。
3. インライン新規要望で作成した申請は `applications.status='編集中'`、`applications.edit_list_id=editListId` とし、購入管理タブの未処理申請受付一覧には出さない。
4. `application_status_histories` には申請作成から `編集中` 取り込みまでの状態履歴を同一トランザクションで記録する。
5. `INLINE_NEW` の編集リスト明細は `source_type='APPLICATION'`、`purchase_application_details.purchase_type='NEW'` とする。
6. `REPLACE` は元行の `remodel_decision` を `DISPOSAL` に更新し、`source_type='MANUAL'` の更新行を元行直下へ作成する。同一トランザクションで扱う。
7. `ADDITION` は1〜99件の `source_type='MANUAL'` 行を元行直下へ作成する。
8. `MANUAL` / `QUOTATION` の生成行はQRコード、固定資産番号、管理機器番号、シリアル番号などの個体識別子を元行・見積明細から引き継がない。
9. 行追加後は同一編集リスト内の `row_no` を必要に応じて再採番する。

### patchEditListsByEditListIdItemsByEditListItemId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること
- 認可条件: 対象編集リストが `deleted_at IS NULL` であること
- 認可条件: `edit_lists.status='CLOSED'` の編集リストは参照専用とし、更新系APIを拒否すること
- 認可条件: 更新系APIはログインユーザー、`editListId`、`lock_token` が有効な `edit_list_work_locks` と一致すること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 固定項目は `edit_list_items`、フリーカラムは `edit_list_free_column_values` へ保存する。
3. 品目、メーカー、型式の更新時は `ship_asset_masters` を `品目 + メーカー + 型式`、`品目 + メーカー`、`品目` の順で再解決し、一意に解決できた場合だけ `ship_asset_master_id` を更新する。
4. 候補なしまたは複数候補で一意に決まらない場合は `ship_asset_master_id=NULL` とし、入力された表示値スナップショットを保持する。
5. リモデル方針の `NEW` / `DISPOSAL` / `TRANSFER` への単純変更は本APIで保存できる。`REPLACE` / `ADDITION` の派生行作成は明細追加APIの業務ケースで扱う。
6. 編集成功時は作業ロックの `last_heartbeat_at` と `lock_expires_at` を更新する。

### patchEditListsByEditListIdItemsBulk

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること
- 認可条件: 対象編集リストが `deleted_at IS NULL` であること
- 認可条件: `edit_lists.status='CLOSED'` の編集リストは参照専用とし、更新系APIを拒否すること
- 認可条件: 更新系APIはログインユーザー、`editListId`、`lock_token` が有効な `edit_list_work_locks` と一致すること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象明細はすべて同一 `editListId` 配下、`deleted_at IS NULL`、クローズ済みでないことを検証する。
3. 固定列またはフリーカラムの保存先をカラムキーから解決する。
4. 対象明細の一部でも権限、ロック、存在、競合、カラム不正に該当する場合は全体をロールバックする。
5. 品目、メーカー、型式の一括更新時も各行ごとに資産マスタ再解決を行う。

### patchEditListsByEditListIdItemsReorder

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること
- 認可条件: 対象編集リストが `deleted_at IS NULL` であること
- 認可条件: `edit_lists.status='CLOSED'` の編集リストは参照専用とし、更新系APIを拒否すること
- 認可条件: 更新系APIはログインユーザー、`editListId`、`lock_token` が有効な `edit_list_work_locks` と一致すること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象配列は同一編集リストの有効明細を過不足なく、または移動対象を含む再採番範囲として受け付ける。
3. `row_no` は同一 `edit_list_id` 内で重複しないように同一トランザクションで更新する。
4. 画面上の仮番号や `sourceType` の区分に依存せず、`edit_list_item_id` と `row_no` を正本とする。

### deleteEditListsByEditListIdItemsByEditListItemId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること
- 認可条件: 対象編集リストが `deleted_at IS NULL` であること
- 認可条件: `edit_lists.status='CLOSED'` の編集リストは参照専用とし、更新系APIを拒否すること
- 認可条件: 更新系APIはログインユーザー、`editListId`、`lock_token` が有効な `edit_list_work_locks` と一致すること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `edit_list_items.deleted_at` と `record_status='DELETED'` を設定する論理削除とする。
3. 紐づく `edit_list_free_column_values.deleted_at` を同一トランザクションで設定する。
4. RFQ紐づき済み明細も削除可能とし、既存RFQは `rfq_applications` 経由で削除済み明細を参照できるようにする。
5. 原本 `asset_ledgers`、元申請 `applications` / `application_assets`、元見積 `quotation_items` は削除しない。

### getEditListsByEditListIdFreeColumns

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること
- 認可条件: 対象編集リストが `deleted_at IS NULL` であること
- 認可条件: `edit_lists.status='CLOSED'` の編集リストは参照専用とし、更新系APIを拒否すること
- 認可条件: 更新系APIはログインユーザー、`editListId`、`lock_token` が有効な `edit_list_work_locks` と一致すること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `edit_list_free_columns.deleted_at IS NULL` の列を `created_at ASC` で返す。
3. フリーカラムは編集リスト内限定の作業列として管理する。

### postEditListsByEditListIdFreeColumns

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること
- 認可条件: 対象編集リストが `deleted_at IS NULL` であること
- 認可条件: `edit_lists.status='CLOSED'` の編集リストは参照専用とし、更新系APIを拒否すること
- 認可条件: 更新系APIはログインユーザー、`editListId`、`lock_token` が有効な `edit_list_work_locks` と一致すること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `columnName` は前後空白を除去し、空文字を拒否する。
3. `column_key` はサーバー側で生成する不変キーとする。
4. 同一編集リスト内の表示名重複は許容し、識別は `edit_list_free_column_id` / `column_key` で行う。
5. 作成した列は `edit_list_free_columns` に保存し、既存明細の値は未設定として扱う。

### patchEditListsByEditListIdFreeColumnsByFreeColumnId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること
- 認可条件: 対象編集リストが `deleted_at IS NULL` であること
- 認可条件: `edit_lists.status='CLOSED'` の編集リストは参照専用とし、更新系APIを拒否すること
- 認可条件: 更新系APIはログインユーザー、`editListId`、`lock_token` が有効な `edit_list_work_locks` と一致すること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象列が同一編集リスト配下かつ `deleted_at IS NULL` であることを検証する。
3. `column_name` だけを更新し、`column_key` と既存値は変更しない。

### deleteEditListsByEditListIdFreeColumnsByFreeColumnId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること
- 認可条件: 対象編集リストが `deleted_at IS NULL` であること
- 認可条件: `edit_lists.status='CLOSED'` の編集リストは参照専用とし、更新系APIを拒否すること
- 認可条件: 更新系APIはログインユーザー、`editListId`、`lock_token` が有効な `edit_list_work_locks` と一致すること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `edit_list_free_columns.deleted_at` を設定し、紐づく `edit_list_free_column_values.deleted_at` も同一トランザクションで設定する。
3. 原本資産、SHIP資産マスタ、購入申請明細、見積明細へは反映しない。

### postEditListsByEditListIdDataLinkPreview

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること
- 認可条件: 対象編集リストが `deleted_at IS NULL` であること
- 認可条件: `edit_lists.status='CLOSED'` の編集リストは参照専用とし、更新系APIを拒否すること
- 認可条件: 更新系APIはログインユーザー、`editListId`、`lock_token` が有効な `edit_list_work_locks` と一致すること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 転記可能カラムと転記先はサーバー定義マッピングで管理し、クライアントから任意の物理カラム名を指定させない。
3. 原本リスト由来は `source_asset_ledger_id` を持つ `BASE_ASSET` 明細だけ対象とし、実行時点の最新 `asset_ledgers` 値を参照する。
4. 資産Master由来は `edit_list_items.ship_asset_master_id` または元資産行の `asset_ledgers.ship_asset_master_id` で `ship_asset_masters` / `ship_asset_master_details` を参照し、サーバー定義マッピングに存在する固定列だけを転記対象とする。
5. 業者Master由来は `vendor_id` または一意な `vendor_name` で `vendors` を参照し、曖昧一致は紐づけなしとして扱う。
6. 転記元に存在する空値はクリア差分としてプレビューに含める。転記元項目自体が存在しない場合は更新しない。
7. 最大20行の差分サンプル、`totalRows`、残件有無を返す。

### postEditListsByEditListIdDataLinkApply

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること
- 認可条件: 対象編集リストが `deleted_at IS NULL` であること
- 認可条件: `edit_lists.status='CLOSED'` の編集リストは参照専用とし、更新系APIを拒否すること
- 認可条件: 更新系APIはログインユーザー、`editListId`、`lock_token` が有効な `edit_list_work_locks` と一致すること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. プレビュー時と同じ条件で再照合し、照合できない行はスキップして結果件数を返す。
3. 固定列は `edit_list_items`、フリーカラムは `edit_list_free_column_values` へ反映する。
4. 転記先固定列を持たない資産Master項目は対象外とし、暗黙に新しい物理列や値保持領域を作らない。
5. 未対応の転記先キーは拒否し、暗黙に新しい物理列を作らない。
6. 転記元に存在する空値はクリア差分として上書きできる。
7. 原本 `asset_ledgers`、SHIP資産マスタ、業者マスタは更新しない。

### getEditListsByEditListIdQuotationLinkCandidates

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること
- 認可条件: 対象編集リストが `deleted_at IS NULL` であること
- 認可条件: `edit_lists.status='CLOSED'` の編集リストは参照専用とし、更新系APIを拒否すること
- 認可条件: 更新系APIはログインユーザー、`editListId`、`lock_token` が有効な `edit_list_work_locks` と一致すること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 画面上は行選択なしでも起動できるため、候補取得はチェックボックス選択状態に依存しない。
3. 文字列のRFQ No. + フェーズを正本キーにせず、`rfq_id`、`quotation_id`、`quotation_item_id`、`edit_list_item_id` を正本キーとして返す。
4. 候補RFQは `rfqs.edit_list_id=editListId`、`deleted_at IS NULL` の範囲に限定する。
5. 有効な `quotation_item_application_links` を参照し、1対1紐付け済み状態を返す。
6. 見積番号とRFQグループ名は別項目として返し、見積番号をRFQグループ名へ転記しない。

### postEditListsByEditListIdQuotationLinkApply

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること
- 認可条件: 対象編集リストが `deleted_at IS NULL` であること
- 認可条件: `edit_lists.status='CLOSED'` の編集リストは参照専用とし、更新系APIを拒否すること
- 認可条件: 更新系APIはログインユーザー、`editListId`、`lock_token` が有効な `edit_list_work_locks` と一致すること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `pairings` と `additions` がどちらも空の場合は拒否する。
3. 有効なリンクは見積明細1件につき編集リスト明細1件、編集リスト明細1件につき見積明細1件までとする。
4. 差し替え時は旧 `quotation_item_application_links.deleted_at` を設定してから新リンクを作成する。
5. 見積ヘッダー/明細分類/価格情報の対象カラムをサーバー定義マッピングで一括転記する。手動カラム選択は行わない。
6. 未紐付け見積明細から追加する行は `source_type='QUOTATION'` とし、`source_quotation_item_id` と `quotation_item_application_links` で出所を追跡する。
7. 追加行へ継承できるのは選択元行の新設置場所情報（棟、階、部門、部署、室名）と執行年度に限る。物理識別子はコピーしない。
8. `rfqs.quotation_type` / `quotation_phase` が未指定のRFQは、有効見積ヘッダ紐付け後に一覧用スナップショットへ同期する。

#### 見積DB Link source→target主要マッピング

| source | target | 説明 |
| --- | --- | --- |
| `quotations.quotation_no` | `edit_list_items.quotation_no` | 見積番号 |
| `rfqs.rfq_group_name` | `edit_list_items.rfq_group_name` | RFQグループ名。見積番号とは別項目 |
| `quotations.vendor_id` / `vendor_name` | `edit_list_items.vendor_id` / `vendor_name` | 見積業者 |
| `quotations.quotation_on` | `edit_list_items.quotation_date` | 見積日付 |
| `quotation_items.item_type` | `edit_list_items.item_type` | 明細区分 |
| `quotation_items.category_name` | `edit_list_items.category_name` | Category |
| `quotation_items.large_class_name` | `edit_list_items.large_class_name` | 大分類 |
| `quotation_items.medium_class_name` | `edit_list_items.medium_class_name` | 中分類 |
| `quotation_items.item_name` | `edit_list_items.item_name` | 品目 |
| `quotation_items.maker_name` | `edit_list_items.maker_name` | メーカー |
| `quotation_items.model_name` | `edit_list_items.model_name` | 型式 |
| `quotation_items.list_price_unit` | `edit_list_items.list_price_unit` | 定価単価 |
| `quotation_items.list_price_total` | `edit_list_items.list_price_total` | 定価金額 |
| `quotation_items.purchase_price_unit` | `edit_list_items.quotation_price_unit` | 見積単価 |
| `quotation_items.purchase_price_total` | `edit_list_items.quotation_price_ex_tax` | 見積金額（税別） |
| `quotation_items.alloc_tax_total` | `edit_list_items.quotation_price_in_tax` | 見積金額（税込） |

### deleteEditListsByEditListIdQuotationLinkByEditListItemId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること
- 認可条件: 対象編集リストが `deleted_at IS NULL` であること
- 認可条件: `edit_lists.status='CLOSED'` の編集リストは参照専用とし、更新系APIを拒否すること
- 認可条件: 更新系APIはログインユーザー、`editListId`、`lock_token` が有効な `edit_list_work_locks` と一致すること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 対象明細の有効な `quotation_item_application_links` に `deleted_at` を設定する。
3. `source_type='QUOTATION'` の追加行自体を削除する場合は本APIではなく明細削除APIを使用する。
4. リンク解除後も編集リストの転記済み作業値は原則保持する。

### postEditListsByEditListIdApplicationsDisposalTransfer

#### 権限

- 認可条件: 対象編集リストは `list_type='REMODEL'` であること
- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `remodel_edit_list` / `transfer_disposal` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、`remodel_edit_list` と `transfer_disposal` の両方が作業対象施設で実効有効であること
- 認可条件: 有効な作業ロック `lock_token` を保持していること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. 通常編集リスト（`PURCHASE`）からの作成は拒否する。
3. 選択行のうち `remodel_decision='DISPOSAL'` または `TRANSFER` の未申請行だけを作成対象とする。
4. 購入系行、方針未設定行、申請済み行が混在する場合は行単位でスキップし、`skipped[]` に理由を返す。
5. `applications` / `application_assets` を作成し、廃棄は `application_type='DISPOSAL'` / `asset_role='DISPOSAL'`、移設は `application_type='TRANSFER'` / `asset_role='TRANSFER'` として保存する。リモデル起点の廃棄申請では `applications.edit_list_id`、`application_assets.edit_list_item_id` を必須とする。
6. 申請作成直後の保存値は廃棄・移設とも申請単位の `新規申請` とし、`application_status_histories` に作成履歴を登録する。
7. 本APIは `rfqs`、`rfq_applications`、廃棄依頼グループ、廃棄承認ワークフロー行を作成しない。廃棄申請は作成後、移動・廃棄管理の受付一覧で選択され、No.27のグループ作成APIへ引き渡す。
8. レスポンスの `created[]` は `applicationId`、`applicationAssetIds`、`applicationType`、`editListItemIds`、次の遷移先コンテキストを返し、RFQ No.や廃棄タスクIDは返さない。
9. 同一 `edit_list_item_id` に対する未削除・未終端の有効申請がある場合は重複申請を作成せず `skipped[]` に理由を返す。廃棄グループ間の資産重複は本APIではなくNo.27のグループ作成トランザクションで検証する。
10. リモデル編集リスト起点の移設申請は作成時点の移設先未入力を許容し、リモデルクローズ前に新設置場所を必須検証する。

### postEditListsByEditListIdApplicationsDisposal

#### 権限

- 認可条件: 対象編集リストは `list_type='REMODEL'` であること
- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `remodel_edit_list` / `transfer_disposal` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、`remodel_edit_list` と `transfer_disposal` の両方が作業対象施設で実効有効であること
- 認可条件: 有効な作業ロック `lock_token` を保持していること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `remodel_decision='DISPOSAL'` の明細だけを対象とし、廃棄申請正本を作成する。
3. RFQ No.、廃棄タスクID、`rfqs`、`rfq_applications` は作成せず、レスポンス形式と申請重複判定は一括APIと同じとする。

### postEditListsByEditListIdApplicationsTransfer

#### 権限

- 認可条件: 対象編集リストは `list_type='REMODEL'` であること
- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `remodel_edit_list` / `transfer_disposal` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、`remodel_edit_list` と `transfer_disposal` の両方が作業対象施設で実効有効であること
- 認可条件: 有効な作業ロック `lock_token` を保持していること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `remodel_decision='TRANSFER'` の明細だけを対象とし、採番形式は `TRAN-yyyyMMdd-nnnn` とする。
3. 申請作成時点の移設先未入力を許容し、リモデルクローズ前に新設置場所を必須検証する。
4. レスポンス形式と申請重複判定は一括APIと同じとする。`rfq_applications` は作成せず、移設後続は移動管理側へ委譲する。

### postEditListsByEditListIdRfqGroups

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` / `normal_purchase` / `remodel_purchase` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象編集リストの `list_type` に応じて `normal_edit_list` または `remodel_edit_list` の実効有効を再判定すること
- 認可条件: 通常アカウントで `list_type='PURCHASE'` のRFQ作成では `normal_purchase` も実効有効であること
- 認可条件: 通常アカウントで `list_type='REMODEL'` のRFQ作成では `remodel_purchase` も実効有効であること
- 認可条件: 有効な作業ロック `lock_token` を保持していること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `rfqs.rfq_no` は `RFQ-yyyyMMdd-nnnn` 形式でサーバー採番する。モーダル事前表示のRFQ No.は採番予約ではなく参考値である。
3. `edit_lists.list_type='PURCHASE'` の場合は `rfqs.management_type='PURCHASE'`、`list_type='REMODEL'` の場合は `REMODEL` とする。
4. 通常の見積依頼では `workflow_type='RFQ'` とする。
5. リモデルRFQでは購入系の `NEW` / `REPLACE` / `ADDITION` 行だけを対象とし、廃棄予定、移設、方針未設定、申請済み行は行単位でスキップする。
6. 対象行が1件もない場合はRFQを作成しない。
7. `rfqs.quotation_type` / `quotation_phase` は作成時点で未指定を許容する。有効見積ヘッダ紐付け後に一覧用スナップショットへ同期する。
8. `rfq_applications` に採用した `editListItemId` を登録する。RFQ詳細・依頼書プレビューはこのリンクだけを対象とし、同一編集リスト内の未選択明細を含めない。
9. 選択された明細の `rfq_no` / `rfq_group_name` / `rfq_assignment_status` は現在表示用として新規作成分で上書きする。
10. 同じ編集リスト明細を複数RFQへ紐づけることは許容し、過去リンクは `rfq_applications` で追跡する。

### getUserColumnSettings

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、`screenId=edit_list` の表示カラム設定は、通常編集リストまたはリモデル編集リストのいずれかの入口権限が有効なユーザーだけ参照・更新できること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `user_column_settings` からログインユーザー、`screen_id='edit_list'` の表示/非表示設定を取得する。
3. `user_column_setting_presets` と `user_column_setting_preset_items` からブックマーク一覧を取得する。
4. 固定列の `column_key` は画面契約として固定する。
5. 列幅、列順、ソート、列内フィルター、全体検索条件はDB保存対象外とし返さない。

### putUserColumnSettings

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、`screenId=edit_list` の表示カラム設定は、通常編集リストまたはリモデル編集リストのいずれかの入口権限が有効なユーザーだけ参照・更新できること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. ログインユーザー、`screen_id='edit_list'` 単位で `user_column_settings` を置換保存する。
3. 未知の固定列キーは拒否する。
4. 列幅、列順、ソート、列内フィルターは保存しない。

### postUserColumnSettingPresets

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、`screenId=edit_list` の表示カラム設定は、通常編集リストまたはリモデル編集リストのいずれかの入口権限が有効なユーザーだけ参照・更新できること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. `user_column_setting_presets` と `user_column_setting_preset_items` を同一トランザクションで作成する。
3. 同一ユーザー、同一 `screen_id`、同一 `preset_name` の有効ブックマーク重複は拒否する。
4. 列幅、列順、ソート、列内フィルターはブックマーク保存対象外とする。

### postUserColumnSettingPresetsByPresetIdApply

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、`screenId=edit_list` の表示カラム設定は、通常編集リストまたはリモデル編集リストのいずれかの入口権限が有効なユーザーだけ参照・更新できること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. ログインユーザー所有の有効ブックマークであることを検証する。
3. `user_column_setting_preset_items` の内容で `user_column_settings` を置換更新する。
4. 適用時点で未知または廃止された固定列キーが含まれる場合は拒否し、利用者に再保存を促す。

### deleteUserColumnSettingPresetsByPresetId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `normal_edit_list` / `remodel_edit_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、`screenId=edit_list` の表示カラム設定は、通常編集リストまたはリモデル編集リストのいずれかの入口権限が有効なユーザーだけ参照・更新できること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する。
2. ログインユーザー所有の有効ブックマークであることを検証する。
3. `user_column_setting_presets.deleted_at` を設定する。明細は親の論理削除に従い通常取得対象外とする。
4. 削除しても `user_column_settings` の現在設定は変更しない。

## 第6章 権限・業務ルール

### 責務境界

- 資産詳細/資産カルテ参照は No.12 資産一覧・資産詳細 API を利用し、本書では新規APIを定義しない
- 購入管理タブの申請受付一覧から行う通常編集リスト新規作成・購入申請取り込み、および既存通常編集リストへの購入申請取り込みは No.25 購入管理 API を正本とする。ただし既存編集リストへの取り込みは編集リスト作業ロックの `lockToken` 検証対象とする
- リモデルダッシュボード、リモデル管理一覧、リモデルクローズと原本反映は No.24 リモデル管理 API を正本とする。廃棄申請の見積・発注・作業日・完了はNo.27、移動後続は移動・廃棄管理の正本とする
- タスク管理側で既存RFQを進行・削除するAPIは編集リスト作業ロックの対象外とし、作業ロック中でも実行できる
- `API連携` は本書の対象外とし、新規エンドポイントを定義しない。連携仕様を定義する場合は、連携先、同期方向、認証方式、更新対象カラム、監査要否を確定する
- `Excel/PDF出力` と `印刷` は本書の対象外とし、帳票/ファイル生成APIを新設しない。帳票出力をAPI化する場合は、出力形式、対象範囲、列設定反映有無、監査要否を定義する

### 保存境界

- 画面全体の一括保存APIは設けない。セル編集、一括編集、Data Link適用、見積DB Link適用、フリーカラム、行順変更、行削除、インライン登録の各API成功を保存点とする
- チェックボックスの選択状態はクライアント内一時状態であり、DB保存しない。実行APIは `editListItemIds[]` を受け取る
- 検索、ソート、列内フィルター、列順、列幅は画面内一時状態であり保存しない。表示/非表示とブックマークだけを `user_column_settings` 系APIで保存する
- 通常セル編集、Data Link、見積DB Linkでは原本 `asset_ledgers`、申請正本、見積正本を直接更新しない

### 明細ソースと生成行

- `BASE_ASSET` は編集リスト作成時に対象施設の原本資産をコピーした明細で、`source_asset_ledger_id` を必須とする
- `APPLICATION` は購入申請由来の明細で、`source_application_id` と `source_application_asset_id` を必須とする。インライン新規要望も登録時に申請正本を作成するため `APPLICATION` として扱う
- `MANUAL` は更新/増設など編集リスト内で生成した明細で、外部参照元IDを必須にしない
- `QUOTATION` は見積DB Linkの未紐付け見積明細から追加した明細で、`source_quotation_item_id` と `quotation_item_application_links` で出所を追跡する
- `MANUAL` / `QUOTATION` の生成行は、QRコード、固定資産番号、管理機器番号、シリアル番号などの個体識別子を引き継がない
- 画面上の `asset.no` や `90000 + index` は表示・選択用の一時識別子であり、API/DB正本キーは `edit_list_item_id` とする

### RFQ・廃棄・移設ルール

- RFQ No.は通常RFQグループ作成確定時だけサーバー採番する。廃棄/移設申請の起票では採番予約やRFQヘッダ作成を行わない
- リモデルRFQでは購入系の `NEW` / `REPLACE` / `ADDITION` 行だけを対象とし、廃棄予定、移設、方針未設定、申請済み行は行単位でスキップする
- 同じ編集リスト明細に複数RFQを紐づけることは許容し、編集リスト上のRFQ No./グループ名は最新作成分で上書き表示する
- 廃棄/移設申請はリモデル編集リスト限定とし、通常編集リストからの作成を拒否する
- 廃棄/移設申請の起票レスポンスには `applicationId` / `applicationAssetId` を返し、廃棄依頼グループNo.はNo.27のグループ作成確定時に `DISP-yyyyMMdd-nnnn` として採番する
- 同一編集リスト明細に対する未削除・未終端の有効申請が既に存在する場合は、行単位でスキップする。廃棄依頼グループ間の資産重複はNo.27で検証する

## 第7章 エラーコード一覧

| エラーコード | HTTPステータス | 内容 | 発生条件 |
| --- | --- | --- | --- |
| AUTH_401_UNAUTHORIZED | 401 | 認証情報が存在しない、または無効 | Bearer トークン未指定、期限切れ、署名不正 |
| AUTH_403_EDIT_LIST_DENIED | 403 | 編集リスト権限がない | 通常アカウントで対象 listType に対応する `normal_edit_list` / `remodel_edit_list` が実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする |
| AUTH_403_PURCHASE_DENIED | 403 | RFQ作成権限がない | 通常アカウントで通常購入またはリモデル購入の追加権限が実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする |
| AUTH_403_TRANSFER_DISPOSAL_DENIED | 403 | 廃棄・移設申請作成権限がない | 通常アカウントで `transfer_disposal` が実効無効。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする |
| FACILITY_NOT_FOUND | 404 | 作業対象施設を参照できない | Bearer トークン上の作業対象施設が存在しない、または削除済み |
| EDIT_LIST_NOT_FOUND | 404 | 編集リストを参照できない | ID不存在、施設不一致、削除済み、または導線と listType 不一致 |
| EDIT_LIST_CLOSED | 409 | 編集リストがクローズ済み | `edit_lists.status='CLOSED'` の編集リストへ更新系APIを実行した |
| EDIT_LIST_LOCKED | 423 | 他ユーザーが作業中 | 有効な他ユーザーロックが存在する |
| LOCK_TOKEN_REQUIRED | 400 | 作業ロックトークン未指定 | 明細取得または更新系APIで `lockToken` が未指定 |
| LOCK_TOKEN_INVALID | 409 | 作業ロックトークンが不正 | ユーザー、editListId、lockToken が有効ロックと一致しない |
| LOCK_EXPIRED | 409 | 作業ロック期限切れ | `lock_expires_at <= CURRENT_TIMESTAMP` または解除済み |
| EDIT_LIST_ITEM_NOT_FOUND | 404 | 編集リスト明細を参照できない | ID不存在、編集リスト不一致、削除済み |
| INVALID_SOURCE_TYPE | 400 | 明細ソース種別が不正 | `BASE_ASSET` / `APPLICATION` / `MANUAL` / `QUOTATION` 以外を指定した |
| DATA_LINK_NO_TARGET | 400 | Data Link対象不足 | 対象明細または転記カラムが空配列 |
| QUOTATION_LINK_NO_OPERATION | 400 | 見積DB Linkの適用対象がない | 紐付け指定と追加指定がどちらも空 |
| RFQ_NO_TARGET_ITEMS | 409 | RFQ作成対象明細がない | 選択明細が全てスキップ対象 |
| DUPLICATE_WORKFLOW_LINK | 409 | 同一明細の同一ワークフローが作成済み | 未削除RFQの同一 workflow_type が同じ editListItemId に存在する |
| VALIDATION_ERROR | 400 | 入力値不正 | 必須不足、列挙値不正、文字数超過、件数範囲外 |
| CONFLICT | 409 | 競合更新 | `expectedUpdatedAt` または `Idempotency-Key` の競合 |
| INTERNAL_SERVER_ERROR | 500 | サーバー内部エラー | 想定外例外 |

## 第8章 運用・保守方針

### データ保守方針

- 編集リスト作成時点の原本コピーは作業スナップショットとして保持し、後続の通常編集では原本へ自動反映しない
- 編集リスト明細の過剰なセル単位変更履歴テーブルは設けず、通常編集は `updated_by_user_id` / `updated_at`、削除は `deleted_at`、業務結果に影響する操作は各業務テーブル・状態履歴で追跡する
- 作業ロックの取得、heartbeat、自動解除は監査テーブル化せず、アプリケーションログで扱う
- 解除済みまたは期限切れの `edit_list_work_locks` は長期保管せず、定期削除対象とする
- 削除済み編集リストは選択候補・編集対象から除外するが、既存RFQ、申請、見積、履歴からの参照は保持する

### 拡張時の留意点

- API連携を実装する場合は、連携先、同期方向、認証方式、更新対象カラム、監査要否を確定してから別APIとして追加する
- 帳票/ファイル生成を実装する場合は、出力形式、対象範囲、表示カラム設定反映有無、ジョブ管理、再出力条件を運用設計と合わせて定義する
- 作業ロックの強制解除を追加する場合は、クライアント合意済みの排他方針に反するため、権限、監査、通知、編集中データの扱いを再合意する
- Data Linkの転記元を増やす場合は、source→targetマッピング、空値上書き可否、曖昧一致時の扱いをサーバー定義として追加する
- 見積DB Linkの自動マッチング精度を上げる場合でも、有効リンクの1対1制約と `quotation_item_application_links` の差し替えルールは維持する
