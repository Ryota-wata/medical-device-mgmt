# 資産申請起票 API内部設計

## 第1章 概要

### 本書の目的

本書は、資産一覧画面（`/asset-search-result`）から起票する新規購入、増設購入、更新購入、移動、廃棄申請の API 仕様を定義する。

資産一覧・資産詳細 API は申請ボタン表示可否と選択資産の参照までを扱い、本書は申請ヘッダ、申請明細、申請種別別詳細、添付、初期ステータス履歴を作成する責務を扱う。

資産一覧画面の「貸出登録」ボタンは申請起票ではなく `lending_devices` への貸出管理対象登録であるため、本書では定義しない。貸出機器登録モーダルで利用する API は「貸出管理 API 設計書」を参照する。

### 対象システム概要

対象システムは医療機器管理システムである。資産申請起票は、病院ユーザーが資産一覧で対象資産を選択し、購入、移動、廃棄などの後続業務へ渡す申請レコードを作成する入口機能である。

起票後の購入申請一覧、編集リスト連携、RFQ、発注、検収は購入管理・リモデル管理・RFQ以降で扱い、移動/廃棄の承認、タスク進行、原本反映は移動・廃棄管理で扱う。

### 用語定義

| 用語 | 説明 |
| --- | --- |
| 資産申請起票 | 資産一覧から申請を作成し、`applications` を親とする申請レコード群を初期状態で保存する処理 |
| 購入申請 | `applications.application_type='PURCHASE'` の申請。`purchase_application_details.purchase_type` で NEW / EXPANSION / REPLACEMENT を区別する |
| 移動申請 | `applications.application_type='TRANSFER'` の申請。選択資産と移動先を保存し、移動・廃棄管理側で承認・原本反映する |
| 廃棄申請 | `applications.application_type='DISPOSAL'` の申請。選択資産と廃棄理由、添付を保存し、廃棄管理側で後続タスクを進める |
| 更新購入後処理 | 更新購入対象の現行資産について、廃棄、移動、継続利用のいずれにするかを起票時点で保持する処理 |

### 対象画面

| 画面名 | 画面URL | 利用目的 |
| --- | --- | --- |
| 15. 資産一覧画面 | /asset-search-result | 新規購入/増設購入/更新購入/移動/廃棄申請モーダルを開き、申請を起票する |

## 第2章 システム全体構成

### APIの位置づけ

本 API 群は、資産一覧画面からの申請作成入口である。資産一覧・資産詳細 API が返す `canOpenOriginalApplications` と選択資産を前提に、起票時は本 API が `original_application` の実効権限を再判定する。

申請作成は 1 API 呼び出しを 1 トランザクションで扱う。`applications`、`application_assets`、申請種別別詳細、`application_documents`、`application_status_histories` のいずれかに失敗した場合は全体をロールバックする。添付ファイルをAmazon S3へ保存済みの場合は、保存済みS3オブジェクトをDeleteObjectで破棄してからエラー応答する。

### 画面とAPIの関係

| 画面操作 | API | 補足 |
| --- | --- | --- |
| 申請モーダルを開く | GET /asset-applications/context | 申請者、設置場所候補、選択資産スナップショット、初期ステータスを取得する |
| 新規購入/増設購入/更新購入申請を送信する | POST /asset-applications/purchase | 購入申請を作成する。更新購入で廃棄/移動を選んだ場合は関連申請も同一トランザクションで作成する |
| 移動申請を送信する | POST /asset-applications/transfer | 選択資産と移動先を保存し、移動申請を作成する |
| 廃棄申請を送信する | POST /asset-applications/disposal | 選択資産、廃棄理由、添付を保存し、廃棄申請を作成する |
| 申請完了後または申請状況から内容を確認する | GET /asset-applications/{applicationId} | 申請共通ヘッダ、対象資産、添付、ステータス履歴、申請種別別詳細、関連申請を取得する |

### 使用テーブル

| テーブル/VIEW | 利用種別 | 用途 |
| --- | --- | --- |
| applications | CREATE / READ | 申請共通ヘッダ、申請番号、申請者・設置場所スナップショット、初期ステータスを保持する |
| application_assets | CREATE / READ | 既存資産、要望機器、移動/廃棄対象資産、更新購入後処理を明細として保持する |
| purchase_application_details | CREATE / READ | 購入申請区分、優先順位、希望納期、用途、症例数、接続要望を保持する |
| transfer_application_details | CREATE / READ | 移動元/移動先、移動理由、関連購入申請IDを保持する |
| disposal_application_details | CREATE / READ | 廃棄理由、関連購入申請ID、後続廃棄タスク用の詳細を保持する |
| application_documents | CREATE / READ | 購入/廃棄申請の添付ファイルメタデータを `owner_type='APPLICATION'` として保存する。ファイル実体はAmazon S3に保存し、`file_path` にはS3オブジェクトキーのみを保持する。詳細取得レスポンスではS3オブジェクトキー、S3バケット名、HTTPS URLを返さない |
| application_status_definitions | READ | 申請種別ごとの初期ステータスを解決する |
| application_status_histories | CREATE / READ | 申請作成時の初期ステータス履歴を保存し、詳細取得で履歴として返却する |
| asset_ledgers | READ | 選択済み既存資産の施設所属、状態、分類、設置場所、数量を確認する |
| facility_locations | READ | 設置先、移動先、部署/室名候補を確認し、スナップショットを取得する |
| facilities | READ | 作業対象施設の存在確認、論理削除判定、共有システム管理者アカウントの未削除施設判定に使用する |
| users | READ | 申請者スナップショット、共有システム管理者アカウント判定、監査記録の実行ユーザー解決に使用する |
| user_facility_assignments / facility_feature_settings / user_facility_feature_settings | READ | 通常アカウントの担当施設割当、施設提供設定、ユーザー施設別設定から `original_list_view` / `original_application` の実効権限を判定する |
| purchase_applications | READ | 購入管理側の互換VIEW。起票 API は直接 DML しない |

### 責務境界

- 資産一覧・資産詳細 API は、一覧取得、詳細取得、申請導線の表示可否、選択資産の参照までを扱う
- 本 API は、申請レコードの作成、入力検証、添付保存、初期ステータス履歴作成までを扱う
- 購入管理・リモデル管理・RFQ API は、起票済み購入申請の一覧、編集リスト連携、RFQ 作成、見積依頼進行を扱う
- 移動・廃棄管理 API は、起票済み移動/廃棄申請の承認、タスク進行、原本反映、廃棄契約タスクを扱う
- 資産一覧画面の貸出登録ボタンおよび貸出機器登録モーダルは、申請起票ではなく貸出管理対象機器の登録であるため、本書の対象外とし、「貸出管理 API 設計書」を参照する
- 棚卸し完了時の自動起票は棚卸し API 側のトリガで行うが、payload と永続化ルールは本書の移動/廃棄起票モデルに合わせる

## 第3章 共通仕様

### API共通仕様

- 通信方式: HTTPS
- データ形式: JSON（購入申請作成・廃棄申請作成の添付を含む multipart/form-data を除く）
- 文字コード: UTF-8
- 日時形式: ISO 8601。日付のみの項目は `YYYY-MM-DD` とする
- 更新系 API は `Idempotency-Key` ヘッダーを必須とし、同一ユーザー、同一施設、同一 API パス、同一 payload と添付ファイルメタデータ/ハッシュの再送は初回応答を返す
- 添付ファイルの実体はAPI内でAmazon S3へPutObjectし、DB には `application_documents` のメタデータを保存する。`application_documents.file_path` にはS3オブジェクトキーのみを保存し、レスポンスにS3オブジェクトキー、S3バケット名、HTTPS URLは返さない
- 共有システム管理者アカウントは、作業対象施設が未削除である限り通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による認可判定をバイパスする。ただし、選択資産、設置先、移動先、添付保存先などの業務データは作業対象施設に属することを必ず確認する

### 認証方式

ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。

### 権限モデル

本 API 群は `original_application` を起票実行権限として使用する。既存資産スナップショットを取得する処理では、同じ作業対象施設に対する `original_list_view` も前提とする。業務 API は `/auth/context` の表示用結果だけを信頼せず、Bearer トークン上の作業対象施設について通常アカウントでは `user_facility_assignments`、`facility_feature_settings`、`user_facility_feature_settings` を毎回再判定する。共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）では、作業対象施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず、`original_application` および必要な参照系 `feature_code` を有効として扱う。

| 処理 | 必要 feature_code | 説明 |
| --- | --- | --- |
| 申請モーダルコンテキスト取得 | `original_list_view` + `original_application` | 通常アカウントは両 feature の実効有効を判定する。共有システム管理者は作業対象施設が未削除であれば許可する。選択資産スナップショットと申請可否を返す |
| 購入申請作成 | `original_application` | 通常アカウントは実効 `original_application` を判定する。共有システム管理者は作業対象施設が未削除であれば許可する。新規購入/増設購入/更新購入申請を作成する |
| 移動申請作成 | `original_application` | 通常アカウントは実効 `original_application` を判定する。共有システム管理者は作業対象施設が未削除であれば許可する。選択資産の移動申請を作成する |
| 廃棄申請作成 | `original_application` | 通常アカウントは実効 `original_application` を判定する。共有システム管理者は作業対象施設が未削除であれば許可する。選択資産の廃棄申請を作成する |
| 申請詳細取得 | `original_application` | 通常アカウントは実効 `original_application` を判定し、申請が作業対象施設に属することを確認する。共有システム管理者は作業対象施設が未削除であれば許可する |

### 施設スコープ

- 全 API は Bearer トークン上の作業対象施設を `targetFacilityId` として扱う。リクエストに `targetFacilityId` がある場合は作業対象施設と一致することを必須とする。共有システム管理者アカウントでも、起票対象施設は現在選択中の作業対象施設に限定する
- 作業対象施設が存在しない、または `facilities.deleted_at IS NOT NULL` の場合は 404 とする。通常アカウントで作業対象施設に対する実効権限がない場合は 403 とする
- 既存資産を対象にする場合は、`asset_ledgers.facility_id` が作業対象施設と一致する資産だけを許可する
- 病院ユーザーが協業グループ経由で他施設資産を閲覧できる場合でも、申請起票は作業対象施設の自施設資産に限定する。共有システム管理者が別施設の資産を起票対象にする場合は、その施設を作業対象施設として選択してから本 API を呼び出す
- 設置先/移動先は同一施設の `facility_locations.deleted_at IS NULL` の候補から選択する

### 申請番号・初期ステータス

- `application_no` はサーバー側で生成する。採番は `application_type` 別プレフィックス（PUR / TRF / DSP）と `application_id` を組み合わせ、同一申請を一意に識別できる値とする
- `applications.status` は `application_status_definitions` から `application_type` ごとに `is_initial_status=true` の1件を取得して設定する
- 起票時は `application_status_histories.from_status=null`、`to_status=初期ステータス`、`changed_by_user_id=申請者`、`changed_at=サーバー時刻` の履歴を必ず1件作成する
- 初期ステータス定義が存在しない、または複数存在する場合は 500 ではなく設定不備として 409 (`APPLICATION_INITIAL_STATUS_INVALID`) を返す

### エラーレスポンス仕様

#### 基本エラーレスポンス（ErrorResponse）

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| code | string | ✓ | エラーコード |
| message | string | ✓ | 利用者向けエラーメッセージ |
| details | string[] | - | 入力項目別の補足 |
| correlationId | string | - | 問い合わせ用トレースID |

## 第4章 API一覧

| No | API名 | Method | Path | 用途 | 権限 |
| --- | --- | --- | --- | --- | --- |
| 1 | 申請モーダルコンテキスト取得 | GET | /asset-applications/context | 起票モーダルの初期表示情報を取得する | `original_list_view` + `original_application` |
| 2 | 購入申請作成 | POST | /asset-applications/purchase | 新規購入/増設購入/更新購入申請を作成する | `original_application` |
| 3 | 移動申請作成 | POST | /asset-applications/transfer | 資産一覧選択資産の移動申請を作成する | `original_application` |
| 4 | 廃棄申請作成 | POST | /asset-applications/disposal | 資産一覧選択資産の廃棄申請を作成する | `original_application` |
| 5 | 申請詳細取得 | GET | /asset-applications/{applicationId} | 申請内容、対象資産、添付、履歴、関連申請を取得する | `original_application` |

## 第5章 資産申請起票機能設計

### getAssetApplicationsContext

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `original_list_view` / `original_application` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `original_list_view` と `original_application` が有効であること
- 業務条件: 選択資産、設置先、移動先は作業対象施設に属すること。協業グループ経由の他施設閲覧資産は、共有システム管理者であっても対象施設を作業対象施設として選択し直すまで起票対象にしない

#### 処理仕様

1. `applicationKind` を検証し、購入系は `PURCHASE`、移動は `TRANSFER`、廃棄は `DISPOSAL` の初期ステータスを `application_status_definitions` から取得する
2. `assetLedgerIds` がある場合は `asset_ledgers` を作業対象施設で絞り、指定件数と一致することを確認する
3. `facility_locations.deleted_at IS NULL` の設置場所候補を取得し、部署/室名候補として返却する
4. ログインユーザーの表示名、所属、連絡先を申請者スナップショット初期値として返却する

### postAssetApplicationsPurchase

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `original_application` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `original_application` が有効であること
- 業務条件: 既存資産を指定する場合は、対象資産が作業対象施設に属すること。通常アカウントで既存資産スナップショットを取得する文脈では `original_list_view` も満たすこと

#### 処理仕様

1. `Idempotency-Key` と正規化 payload、添付ファイルメタデータ/ハッシュの組み合わせを検証し、同一内容の再送は初回応答を返す。異なる内容の再送は 409 (`IDEMPOTENCY_KEY_REUSED`) とする
2. `purchaseType` ごとの必須条件を検証する。NEW は `requestedAssets` 1..3 件、EXPANSION は `currentAssets` 1件以上かつ `additionalQuantity>=1`、REPLACEMENT は `currentAssets` 1件以上、`requestedAssets` 1..3件、全 `currentAssets` に対応する `replacementActions` を必須とする
3. 対象既存資産を `asset_ledgers` から作業対象施設で排他取得し、存在件数、施設、更新競合を検証する
4. 設置先/移動先が指定された場合は `facility_locations.deleted_at IS NULL` かつ作業対象施設に属することを検証し、名称スナップショットを取得する
5. `applications` に `application_type='PURCHASE'`、初期ステータス、申請者/設置場所/管理部署/コメントを保存し、`application_no` をサーバー生成する
6. `purchase_application_details` に `purchase_type`、`priority`、希望納期、用途、症例数、接続情報、コメントを保存する
7. `application_assets` へ既存資産は `asset_role='CURRENT'`、要望機器は `asset_role='REQUEST'` として保存する。増設購入では対象既存資産ごとに追加数量を `REQUEST` 行として作成する
8. 更新購入の `replacementActions` は `application_assets.replacement_action` / `continue_reason` として CURRENT 行へ保存する
9. `replacementActions.action='DISPOSAL'` の対象は、関連する `DISPOSAL` 申請、`application_assets(asset_role='DISPOSAL')`、`disposal_application_details.related_purchase_application_id` を同一トランザクションで作成する
10. `replacementActions.action='TRANSFER'` の対象は、関連する `TRANSFER` 申請、`application_assets(asset_role='TRANSFER')`、`transfer_application_details.related_purchase_application_id` を同一トランザクションで作成する
11. `payload.attachments[].filePartName` が multipart のファイルパートに存在することを確認し、ファイルサイズ、MIME Type、拡張子を検証する
12. 添付ファイル本体をAPI内でAmazon S3へPutObjectし、S3オブジェクトキーは `application-documents/facility-{targetFacilityId}/{yyyy}/{mm}/{uploadUuid}.{ext}` 形式で発行する。keyは保存場所識別子であり、`applicationId` などの業務IDを含めない
13. 添付は `application_documents` に `owner_type='APPLICATION'`、`application_id`、`document_category='ATTACHMENT'`、`document_type='APPLICATION_ATTACHMENT'`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`uploaded_by_user_id`、`uploaded_at` として保存する。S3バケット名やHTTPS URLはDBへ保存しない
14. S3保存後にDB登録または申請作成トランザクションへ失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄する。破棄に失敗した場合は 502 (`APPLICATION_ATTACHMENT_502_S3_WRITE_FAILED`) を返却し、再試行可能な運用ログを残す
15. 作成した各 `applications` に対し、`application_status_histories` の初期履歴を作成する

### postAssetApplicationsTransfer

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `original_application` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `original_application` が有効であること
- 業務条件: 既存資産を指定する場合は、対象資産が作業対象施設に属すること

#### 処理仕様

1. `Idempotency-Key` と正規化 payload の組み合わせを検証する
2. `assetLedgerIds` は1件以上必須とし、重複を禁止する
3. 対象資産を `asset_ledgers` から作業対象施設で排他取得し、指定件数と一致することを確認する
4. 移動先 `facility_locations` が作業対象施設に属し、`deleted_at IS NULL` であることを確認する
5. `applications` に `application_type='TRANSFER'`、初期ステータス、申請者、移動先スナップショット、コメントを保存し、`application_no` をサーバー生成する
6. `application_assets` に対象資産を `asset_role='TRANSFER'` として保存し、現設置場所と移動先のスナップショットを保持する
7. `transfer_application_details` に移動元/移動先、移動理由を保存する
8. `application_status_histories` に初期履歴を作成する

### postAssetApplicationsDisposal

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `original_application` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `original_application` が有効であること
- 業務条件: 既存資産を指定する場合は、対象資産が作業対象施設に属すること

#### 処理仕様

1. `Idempotency-Key` と正規化 payload、添付ファイルメタデータ/ハッシュの組み合わせを検証する
2. `assetLedgerIds` は1件以上必須とし、重複を禁止する
3. 対象資産を `asset_ledgers` から作業対象施設で排他取得し、指定件数と一致することを確認する
4. `disposalReasonCode` 未指定時は、資産一覧の廃棄申請モーダルがコメント入力のみであるため `OTHER` を採用し、コメントを `disposalReasonText` として保存する
5. `applications` に `application_type='DISPOSAL'`、初期ステータス、申請者、コメントを保存し、`application_no` をサーバー生成する
6. `application_assets` に対象資産を `asset_role='DISPOSAL'` として保存する
7. `disposal_application_details` に廃棄理由を保存する。廃棄業者、受付、期限、発注、検収に関する項目は後続の廃棄管理 API で更新するため起票時は未設定とする
8. `payload.attachments[].filePartName` が multipart のファイルパートに存在することを確認し、ファイルサイズ、MIME Type、拡張子を検証する
9. 添付ファイル本体をAPI内でAmazon S3へPutObjectし、S3オブジェクトキーは `application-documents/facility-{targetFacilityId}/{yyyy}/{mm}/{uploadUuid}.{ext}` 形式で発行する。keyは保存場所識別子であり、`applicationId` などの業務IDを含めない
10. 添付は `application_documents` に `owner_type='APPLICATION'`、`application_id`、`document_category='ATTACHMENT'`、`document_type='APPLICATION_ATTACHMENT'`、`file_name`、`file_path=S3オブジェクトキー`、`mime_type`、`file_size_bytes`、`content_hash`、`uploaded_by_user_id`、`uploaded_at` として保存する。S3バケット名やHTTPS URLはDBへ保存しない
11. S3保存後にDB登録または申請作成トランザクションへ失敗した場合は、保存済みS3オブジェクトをDeleteObjectで破棄する。破棄に失敗した場合は 502 (`APPLICATION_ATTACHMENT_502_S3_WRITE_FAILED`) を返却し、再試行可能な運用ログを残す
12. `application_status_histories` に初期履歴を作成する

### getAssetApplicationsByApplicationId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `original_application` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `original_application` が有効であること
- 業務条件: 取得対象申請の `applications.facility_id` が作業対象施設と一致し、`applications.deleted_at IS NULL` であること

#### 処理仕様

1. `applicationId` と作業対象施設で `applications` を取得し、存在しない、削除済み、または施設不一致の場合は 404 とする
2. `applications.application_type` に応じて `purchase_application_details`、`transfer_application_details`、`disposal_application_details` のいずれかを取得する。該当詳細が存在しない場合は 409 (`APPLICATION_DETAIL_INCONSISTENT`) とする
3. `application_assets` を `line_no` 昇順で取得し、既存資産、要望機器、移動/廃棄対象、更新購入後処理のスナップショットを返却する
4. `application_documents` は `deleted_at IS NULL` のメタデータだけを返却する。`file_path`、S3オブジェクトキー、S3バケット名、HTTPS URLはレスポンスへ含めない
5. `application_status_histories` を `changed_at` 昇順で取得し、ステータス履歴として返却する
6. 更新購入に伴って作成された関連移動/廃棄申請は、`transfer_application_details.related_purchase_application_id` と `disposal_application_details.related_purchase_application_id` から取得して `linkedApplications` に返却する
7. 移動/廃棄申請が更新購入から作成された場合は、自身の詳細テーブルの `related_purchase_application_id` を `sourceApplication` として返却する

## 第6章 業務ルール・バリデーション

### 申請種別別必須条件

| 申請種別 | 必須条件 | 保存方針 |
| --- | --- | --- |
| 新規購入 | `purchaseType=NEW`、`requestedAssets` 1..3件。既存資産は指定しない | `applications.application_type=PURCHASE`、`purchase_application_details.purchase_type=NEW`、要望機器を `application_assets.asset_role=REQUEST` で保存 |
| 増設購入 | `purchaseType=EXPANSION`、`currentAssets` 1件以上、各 `additionalQuantity>=1` | 既存資産を `CURRENT`、追加希望を `REQUEST` として保存 |
| 更新購入 | `purchaseType=REPLACEMENT`、`currentAssets` 1件以上、`requestedAssets` 1..3件、各対象資産の `replacementActions` 必須 | 既存資産を `CURRENT`、要望機器を `REQUEST` として保存し、廃棄/移動指定は関連申請を作成 |
| 移動 | `assetLedgerIds` 1件以上、`destinationFacilityLocationId` 必須 | `applications.application_type=TRANSFER`、対象資産を `application_assets.asset_role=TRANSFER` で保存 |
| 廃棄 | `assetLedgerIds` 1件以上。画面入力がコメントのみの場合は `disposalReasonCode=OTHER` | `applications.application_type=DISPOSAL`、対象資産を `application_assets.asset_role=DISPOSAL` で保存 |

### 添付ファイルルール

- 購入申請と廃棄申請の添付は `application_documents.owner_type='APPLICATION'` として申請ヘッダに紐づける
- 添付は写真ではないため `document_category='ATTACHMENT'` とし、`is_primary` は設定しない
- 添付ファイル本体はAPI内でAmazon S3へPutObjectし、`application_documents.file_path` にはS3オブジェクトキーのみを保存する。`storage_format` は保存先ではなく電子取引/スキャナ保存/未指定などの保存形式を表す列として扱い、S3保存有無の表現には使用しない
- `owner_key`、`file_path`、`storage_format` は内部項目として扱い、リクエスト/レスポンスでは直接指定・返却しない。S3オブジェクトキー、S3バケット名、HTTPS URLもレスポンスへ含めない
- Amazon S3保存に成功し、DBメタデータ保存または申請作成トランザクションに失敗した場合は保存済みS3オブジェクトをDeleteObjectで破棄してエラー応答とする
- DB確定後の添付削除が後続APIで発生する場合は、`application_documents.deleted_at` の論理削除を正本とし、S3実体は同一S3オブジェクトキーを参照する有効メタデータがなくなったことと保存期間を確認するストレージ削除処理で扱う

### 同時実行・冪等性

- POST API は `Idempotency-Key` を必須とし、キー未指定は 400 (`IDEMPOTENCY_KEY_REQUIRED`) とする
- 同一キー、同一ユーザー、同一施設、同一 API パス、同一 payload と添付ファイルメタデータ/ハッシュの再送は初回レスポンスを返す
- 同一キーで payload または添付ファイルメタデータ/ハッシュが異なる場合は 409 (`IDEMPOTENCY_KEY_REUSED`) とする
- 既存資産を対象にする作成処理では、対象 `asset_ledgers` を同一トランザクション内で検証し、施設違い、存在なし、更新競合を拒否する

## 第7章 エラーコード一覧

| コード | HTTP | 内容 |
| --- | --- | --- |
| VALIDATION_ERROR | 400 | 必須不足、形式不正、件数上限超過 |
| IDEMPOTENCY_KEY_REQUIRED | 400 | POST API に `Idempotency-Key` が指定されていない |
| UNAUTHORIZED | 401 | 認証トークン未付与または無効 |
| FORBIDDEN | 403 | 通常アカウントで作業対象施設に対する実効 `original_application` がない。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする |
| TARGET_FACILITY_NOT_SUPPORTED | 400 | 指定施設が Bearer トークン上の作業対象施設と一致しない |
| APPLICATION_NOT_FOUND | 404 | 指定申請が存在しない、削除済み、または作業対象施設に属さない |
| ASSET_NOT_FOUND | 404 | 指定資産が存在しない、または作業対象施設に属さない |
| LOCATION_NOT_FOUND | 404 | 指定した設置場所/移動先が存在しない、または削除済み |
| APPLICATION_INITIAL_STATUS_INVALID | 409 | 申請種別に対する初期ステータス定義が存在しない、または複数存在する |
| APPLICATION_DETAIL_INCONSISTENT | 409 | `applications.application_type` と申請種別別詳細テーブルの整合が崩れている |
| ASSET_CONFLICT | 409 | 画面取得後に対象資産が更新され、起票条件が変化した |
| IDEMPOTENCY_KEY_REUSED | 409 | 同一 `Idempotency-Key` で異なる payload または添付ファイルメタデータ/ハッシュが送信された |
| APPLICATION_ATTACHMENT_502_S3_WRITE_FAILED | 502 | 添付ファイルのAmazon S3 PutObject、またはDB失敗時の保存済みS3オブジェクト破棄に失敗した |

## 第8章 運用・監査方針

- 申請作成、関連申請作成、添付保存、初期履歴作成は監査対象とし、APIログには申請ID、申請番号、申請種別、対象施設、実行ユーザー、`Idempotency-Key` を記録する
- 添付ファイル本文はアプリケーションログへ出力しない
- APIログにはS3オブジェクトキーを利用者向け情報として出力せず、障害追跡が必要な場合も権限管理された運用ログに限定して記録する
- 起票後のステータス変更は本 API では行わず、購入管理、移動・廃棄管理、廃棄契約タスク側の API で `application_status_transitions` に従って更新する
- 申請作成に伴う関連移動/廃棄申請は同一トランザクションで作成し、どちらか一方だけが残る状態を禁止する

## 第9章 補足・設計方針

| 論点 | 本書の設計方針 | 連携時の扱い |
| --- | --- | --- |
| 廃棄理由コード | 資産一覧の廃棄モーダルはコメントのみのため、未指定時は `OTHER` として保存する | 画面に理由選択を追加する場合は `disposalReasonCode` を必須入力へ変更する |
| 更新購入に伴う廃棄/移動 | 更新購入送信時に関連 `DISPOSAL` / `TRANSFER` 申請を同一トランザクションで作成する | 後続工程では `related_purchase_application_id` と申請履歴から起点購入申請を追跡する |
| 貸出登録 | 資産一覧画面の貸出登録は申請起票ではなく `lending_devices` への貸出管理対象登録として扱う | 貸出機器登録モーダルの API は「貸出管理 API 設計書」を参照する |
| 借用申請 | 資産一覧起点の現行対象外とし、借用管理で扱う | 資産一覧から借用申請を起票する要件が追加された場合は本書へ追加する |
| 棚卸し自動起票 | 棚卸し API が呼び出し元になるが、保存モデルは本書の移動/廃棄起票に合わせる | 棚卸し API 設計書では本書の移動/廃棄起票 payload と永続化ルールを参照する |
