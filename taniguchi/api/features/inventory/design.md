# 棚卸し API内部設計

## 第1章 概要

### 本書の目的

本書は、棚卸し画面（`/inventory`）で利用する API の仕様を定義する。棚卸し開始、施設内共有、明細1行単位の即時保存、一括更新、完了時の移動/廃棄申請自動起票までを対象とする。

棚卸し作業状態はサーバー側の `inventory_sessions` / `inventory_items` を正本とし、同一施設で権限を持つユーザーが同じ進行中セッションを共有して作業できる設計とする。

### 対象システム概要

対象システムは医療機器管理システムである。棚卸し機能は、作業対象施設の資産台帳登録済み資産を現地確認し、未確認、確認済、移動予定、廃棄予定、要対応へ分類し、移動予定および廃棄予定の資産を棚卸し完了時に後続申請へ連携する業務で利用する。

完了後に作成された移動申請および廃棄申請は、移動・廃棄管理 API 側で承認、タスク進行、原本反映を扱う。本 API は棚卸しプロセス管理、明細作業状態保存、申請起票までを責務範囲とする。

### 用語定義

| 用語 | 説明 |
| --- | --- |
| 棚卸しセッション | `inventory_sessions` の1行。施設単位の棚卸しプロセスヘッダ。IN_PROGRESS は施設ごとに1件のみ許可する |
| 棚卸し明細 | `inventory_items` の1行。棚卸し対象資産1件に対する作業状態。ユーザー操作時に1行単位で即時保存する |
| 棚卸し状態 | UNCHECKED / CONFIRMED / TRANSFER_PLANNED / DISPOSAL_PLANNED / ACTION_REQUIRED。移動予定・廃棄予定は確認済とは別ステータスとして保持する |
| 楽観ロック | `lock_version` と `expectedLockVersion` を比較して、他ユーザー更新を上書きしないための競合検知方式 |
| 確認済 | 現地で資産の存在が確認され、現状維持と判断した状態 |
| 移動予定 | 現地確認の結果、設置場所変更が必要と判断した状態。棚卸し完了までは申請を作成せず `inventory_items` に保持する |
| 廃棄予定 | 現地確認の結果、廃棄・除却が必要と判断した状態。棚卸し完了までは申請を作成せず `inventory_items` に保持する |
| 要対応 | 現地確認では判断できず、後続確認が必要な保留状態。要対応が残る場合は棚卸し完了不可 |

### 対象画面

| 画面名 | 画面URL | 利用目的 |
| --- | --- | --- |
| 38. 棚卸し画面 | /inventory | 施設単位の進行中棚卸しを共有表示し、資産ごとの確認済/移動予定/廃棄予定/要対応を保存して完了する |

## 第2章 システム全体構成

### APIの位置づけ

本 API 群は、資産検索・台帳系の棚卸しプロセス管理 API である。棚卸し開始時に `asset_ledgers` から対象資産を抽出して `inventory_items` を生成し、以降の作業状態は `inventory_items` を正本として保存する。

同一施設の権限ユーザーは、進行中の `inventory_sessions` を共有して参照・更新する。画面を開いているユーザー単位の排他ロックは持たず、明細単位の `lock_version` で競合を検知する。

### 画面とAPIの関係

| 画面操作 | API | 補足 |
| --- | --- | --- |
| 棚卸し画面初期表示 | GET /inventory/sessions/current | 作業対象施設の進行中セッションを取得する。存在しない場合は開始可能状態を返す |
| 棚卸し開始 | POST /inventory/sessions | セッションを作成し、対象資産を未確認明細として生成する。同一施設で進行中セッションがあれば開始不可 |
| 棚卸し明細一覧表示/再読込 | GET /inventory/sessions/{inventorySessionId} | セッション、明細、進捗、フィルター候補、移動先候補を取得する |
| 個別の確認済/移動予定/廃棄予定/要対応保存 | PATCH /inventory/items/{inventoryItemId} | 明細1行を `expectedLockVersion` 付きで即時保存する |
| 選択明細の一括確認済/移動予定/廃棄予定/要対応 | POST /inventory/sessions/{inventorySessionId}/items/bulk-update | 複数明細を同一状態へ更新する。競合があれば全体をロールバックする |
| 棚卸し明細添付登録/削除 | POST / DELETE /inventory/items/{inventoryItemId}/documents | 廃棄予定登録時の添付ファイルを棚卸し明細に紐づけ、必要に応じて論理削除する |
| 棚卸し完了確認 | GET /inventory/sessions/{inventorySessionId}/completion-preview | 棚卸し完了モーダル表示時に、完了可否と自動作成予定の申請件数を最新状態で取得する |
| 棚卸し完了 | POST /inventory/sessions/{inventorySessionId}/complete | 未確認・要対応がないことを検証し、最終棚卸情報更新と移動/廃棄申請起票を行う |
| 棚卸し結果Excel出力 | GET /inventory/sessions/{inventorySessionId}/export | 棚卸し完了確認モーダルから棚卸し結果をExcel出力する |
| 棚卸し取消 | POST /inventory/sessions/{inventorySessionId}/cancel | 進行中セッションを CANCELLED にし、監査情報を残す |

### 使用テーブル

| テーブル/VIEW | 利用種別 | 用途 |
| --- | --- | --- |
| inventory_sessions | CREATE / READ / UPDATE | 施設単位の棚卸しプロセス、進捗キャッシュ、完了/取消、セッション排他制御版を保持する |
| inventory_items | CREATE / READ / UPDATE | 棚卸し対象資産ごとの作業状態、移動予定/廃棄予定/要対応情報、明細排他制御版、自動起票結果を保持する |
| inventory_item_status_histories | CREATE / READ | 明細状態変更、変更前後の値JSON、更新者、変更日時、変更理由を監査履歴として保持する |
| asset_ledgers | READ / UPDATE | 棚卸し対象資産の抽出、最終棚卸日/最終棚卸ユーザー更新 |
| facility_locations | READ | 現設置場所スナップショット、移動先候補、移動先整合性確認 |
| asset_photos / application_documents | READ | 資産カードの画像URLを取得する。資産写真は `owner_type='ASSET_LEDGER'` / `document_category='PHOTO'` の代表写真を優先し、`application_documents.file_path` のS3オブジェクトキーから認可済み表示URLを発行する。S3オブジェクトキーはレスポンスへ返さない |
| applications | CREATE / READ | 移動予定から移動申請、廃棄予定から廃棄申請ヘッダーを作成する |
| application_assets | CREATE / READ | 移動/廃棄申請の対象資産明細を作成し、`inventory_items` へ紐づける |
| transfer_application_details | CREATE | 移動予定の移動元/移動先、移動理由を保存する |
| disposal_application_details | CREATE | 廃棄理由コード、廃棄理由詳細を保存する |
| application_documents | CREATE / READ / UPDATE | 廃棄予定登録時の添付メタデータを `owner_type='INVENTORY_ITEM'` で保持する。添付ファイル本体はAmazon S3に保存し、`file_path` にはS3オブジェクトキーのみを保持する。削除時はS3実ファイル削除と `deleted_at` 更新を行い、完了時に作成申請へ同一S3オブジェクトキーを含むメタデータを複製する |
| application_status_definitions | READ | TRANSFER / DISPOSAL の初期ステータスを解決する |
| application_status_histories | CREATE | 自動起票した申請の初期ステータス履歴を保存する |
| users / facilities / user_facility_assignments / facility_feature_settings / user_facility_feature_settings | READ | 実行ユーザー、作業対象施設の未削除確認、通常アカウントの棚卸し閲覧/更新/完了/申請起票権限を判定する |

### 責務境界

- 資産一覧・資産詳細 API は資産検索、詳細表示、履歴表示、管理部署更新を扱う。棚卸しプロセスと作業状態は本 API で扱う
- 資産申請起票 API は資産一覧起点の移動/廃棄申請作成モデルを定義する。本 API は棚卸し完了をトリガとして同じ永続化ルールで移動/廃棄申請を作成する
- 移動・廃棄管理 API は起票済み移動/廃棄申請の承認、廃棄契約タスク、移動原本反映を扱う。本 API は承認後の原本反映を行わない
- 棚卸しセッションの取消は物理削除ではなく CANCELLED への状態更新とし、明細と履歴を監査用に残す

## 第3章 共通仕様

### API共通仕様

- 通信方式: HTTPS
- データ形式: JSON
- 文字コード: UTF-8
- 日時形式: ISO 8601。日付のみの項目は `YYYY-MM-DD` とする
- 更新系 API は `Idempotency-Key` ヘッダーを必須とし、同一ユーザー、同一施設、同一 API パス、同一 payload の再送は初回応答を返す
- 一覧取得は cursor pagination を基本とし、`limit` 未指定時100、最大500とする
- 楽観ロック対象の更新レスポンスには、更新後の `lockVersion` と更新日時を返す

### 認証方式

ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。

### 権限モデル

棚卸しはロール整理上の棚卸し専用権限を使用する。画面表示、開始、明細更新、一括更新、添付登録・削除は `inventory`、棚卸し完了確認、棚卸し完了、取消、Excel出力は `inventory_complete` を使用する。通常アカウントでは、業務 API は `/auth/context` の表示用結果だけを信頼せず、Bearer トークン上の作業対象施設について `user_facility_assignments`、`facility_feature_settings`、`user_facility_feature_settings` を毎回再判定する。共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）では、作業対象施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず API 実行を許可する。ただし、棚卸しセッション、明細、対象資産、移動先ロケーションが作業対象施設に属することはアカウント種別にかかわらず必ず確認する。

| 処理 | 必要 feature_code | 説明 |
| --- | --- | --- |
| 進行中セッション取得 / セッション詳細取得 | `inventory` | 通常アカウントは作業対象施設で `inventory` が実効有効であること。共有システム管理者は作業対象施設が未削除であること |
| 棚卸し開始 / 明細更新 / 一括更新 / 添付登録・削除 | `inventory` | 通常アカウントは作業対象施設で `inventory` が実効有効であること。共有システム管理者は作業対象施設が未削除であること |
| 棚卸し完了確認 / 棚卸し完了 / 取消 / Excel出力 | `inventory_complete` | 通常アカウントは作業対象施設で `inventory_complete` が実効有効であること。共有システム管理者は作業対象施設が未削除であること |

### 施設スコープ

- 全 API は Bearer トークン上の作業対象施設を `targetFacilityId` として扱う。共有システム管理者アカウントを含め、リクエストに `targetFacilityId` がある場合は作業対象施設と一致することを必須とする
- 棚卸しセッション、明細、対象資産、移動先ロケーションはすべて作業対象施設に属することを必須とする
- 協業グループ経由の他施設閲覧資産は棚卸し対象外とする
- 同一施設で `inventory_sessions.session_status='IN_PROGRESS'` のセッションは1件のみ許可する

### 競合制御

- 明細更新 API は `inventory_items.lock_version` とリクエストの `expectedLockVersion` を比較し、一致時のみ更新する
- 一括更新 API は対象全明細の `expectedLockVersion` を検証し、1件でも不一致なら全体をロールバックして 409 と競合明細一覧を返す
- 明細更新 API と一括更新 API は親 `inventory_sessions` の `IN_PROGRESS` 状態をトランザクション内で再確認し、完了/取消処理と交差した場合は更新を成立させない
- 完了/取消 API は `inventory_sessions.lock_version` と `expectedSessionLockVersion` を比較し、不一致なら 409 を返す
- 完了 API はトランザクション内で対象 session と items を排他取得し、未確認、要対応、競合、完了済み、取消済みを再検証する

### 申請番号・初期ステータス

- 移動予定は `applications.application_type='TRANSFER'`、廃棄予定は `applications.application_type='DISPOSAL'` として作成する
- `application_no` はサーバー側で生成し、資産申請起票 API の採番方針に合わせる
- `applications.status` は `application_status_definitions` から `application_type` ごとに `is_initial_status=true` の1件を取得して設定する
- 起票時は `application_status_histories.from_status=null`、`to_status=初期ステータス`、`changed_by_user_id=棚卸し完了実行者`、`changed_at=サーバー時刻` の履歴を必ず1件作成する
- 自動作成件数は申請ヘッダー件数とし、APIレスポンスでは申請ヘッダー件数と対象明細件数の両方を返す
- 移動申請は移動先ロケーション/移動先スナップショット/移動理由が同一の明細を1申請に集約し、廃棄申請は廃棄理由コード/廃棄理由詳細が同一の明細を1申請に集約する
- 初期ステータス定義が存在しない、または複数存在する場合は 409 (`APPLICATION_INITIAL_STATUS_INVALID`) を返す

### エラーレスポンス仕様

#### 基本エラーレスポンス（ErrorResponse）

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| code | string | ✓ | エラーコード |
| message | string | ✓ | 利用者向けエラーメッセージ |
| details | string[] | - | 入力項目別の補足 |
| conflicts | InventoryConflict[] | - | 競合明細一覧。409 の場合に返す |
| correlationId | string | - | 問い合わせ用トレースID |

#### conflicts要素（InventoryConflict）

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| inventoryItemId | int64 | - | 競合した棚卸し明細ID |
| assetLedgerId | int64 | - | 競合した資産台帳ID |
| currentInventoryStatus | string | - | サーバー上の最新状態 |
| currentLockVersion | int64 | - | サーバー上の最新 lockVersion |
| updatedByUserId | int64 | - | 最後に更新したユーザーID |
| updatedAt | datetime | - | 最後に更新された日時 |

## 第4章 API一覧

| No | API名 | Method | Path | 用途 | 権限 |
| --- | --- | --- | --- | --- | --- |
| 1 | 進行中セッション取得 | GET | /inventory/sessions/current | 作業対象施設の進行中棚卸しを取得する | `inventory` |
| 2 | 棚卸し開始 | POST | /inventory/sessions | 棚卸しセッションを開始し、未確認明細を生成する | `inventory` |
| 3 | 棚卸しセッション詳細取得 | GET | /inventory/sessions/{inventorySessionId} | 明細、進捗、フィルター候補、移動先候補を取得する | `inventory` |
| 4 | 棚卸し明細更新 | PATCH | /inventory/items/{inventoryItemId} | 明細1行の状態を即時保存する | `inventory` |
| 5 | 棚卸し明細一括更新 | POST | /inventory/sessions/{inventorySessionId}/items/bulk-update | 選択明細を一括で確認済/移動予定/廃棄予定/要対応へ更新する | `inventory` |
| 6 | 棚卸し明細添付登録 | POST | /inventory/items/{inventoryItemId}/documents | 廃棄予定登録時の添付ファイルを登録する | `inventory` |
| 7 | 棚卸し明細添付削除 | DELETE | /inventory/items/{inventoryItemId}/documents/{applicationDocumentId} | 棚卸し明細に紐づく添付ファイルを論理削除する | `inventory` |
| 8 | 棚卸し完了確認 | GET | /inventory/sessions/{inventorySessionId}/completion-preview | 完了可否と自動作成予定の申請件数を取得する | `inventory_complete` |
| 9 | 棚卸し完了 | POST | /inventory/sessions/{inventorySessionId}/complete | 棚卸し完了と移動/廃棄申請自動起票を行う | `inventory_complete` |
| 10 | 棚卸し結果Excel出力 | GET | /inventory/sessions/{inventorySessionId}/export | 棚卸し結果をExcel形式で出力する | `inventory_complete` |
| 11 | 棚卸し取消 | POST | /inventory/sessions/{inventorySessionId}/cancel | 進行中棚卸しを取消する | `inventory_complete` |

## 第5章 棚卸し機能設計

### getInventorySessionsCurrent

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `inventory` が有効であること

#### 処理仕様

1. `targetFacilityId` が指定された場合は Bearer トークン上の作業対象施設と一致することを確認する
2. `inventory_sessions` から作業対象施設の `session_status='IN_PROGRESS'` を1件取得する
3. 進行中セッションが存在しない場合は `hasActiveSession=false` と開始可能情報を返す

### postInventorySessions

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `inventory` が有効であること

#### 処理仕様

1. `Idempotency-Key` と正規化 payload の組み合わせを検証する
2. 作業対象施設に `IN_PROGRESS` セッションが存在しないことを確認する。存在する場合は 409 (`INVENTORY_SESSION_ALREADY_ACTIVE`) を返す
3. `asset_ledgers` から作業対象施設の棚卸し対象資産を抽出し、RETIRED / LOST など棚卸し対象外状態を除外する
4. `inventory_sessions` を `session_status='IN_PROGRESS'`、`lock_version=0` で作成する
5. 抽出した資産ごとに `inventory_items` を `inventory_status='UNCHECKED'`、`lock_version=0` で作成し、開始時点の設置場所スナップショットを保存する
6. 対象件数を `inventory_sessions.total_item_count` に保存する
7. セッション作成と明細生成は同一トランザクションとする

### getInventorySessionsByInventorySessionId

#### 権限

- 認可条件: 対象棚卸しセッションの `facility_id` が Bearer トークン上の作業対象施設と一致すること
- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `inventory` が有効であること

#### 処理仕様

1. `inventory_sessions` を取得し、作業対象施設との一致を確認する
2. `inventory_items` を条件で絞り込み、`line_no ASC, inventory_item_id ASC` で返す
3. `facility_locations.deleted_at IS NULL` から移動先候補を返す
4. フィルター候補は `inventory_items` と開始時点スナップショットから生成する
5. 完了確認サマリは現在の明細状態から再計算し、未確認または要対応が残る場合は完了不可理由を返す
6. 各明細には `lockVersion`、`updatedByUserId`、`updatedAt` を含め、画面が競合検知に利用できるようにする
7. 資産カード画像は代表写真の `application_documents.file_path` に保持したS3オブジェクトキーから認可済み表示URLを発行し、`assetImageUrl` として返す。バケット名とS3オブジェクトキーは返却しない

### patchInventoryItemsByInventoryItemId

#### 権限

- 認可条件: 対象棚卸し明細の親セッション `facility_id` が Bearer トークン上の作業対象施設と一致すること
- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `inventory` が有効であること

#### 処理仕様

1. 対象 `inventory_items` と親 `inventory_sessions` を同一トランザクションで取得し、親セッションが `IN_PROGRESS` であることを確認する
2. 親 `inventory_sessions` は排他取得または `session_status='IN_PROGRESS'` 条件付き更新で検証し、完了/取消処理と交差した場合は 409 (`INVENTORY_SESSION_CONFLICT`) を返す
3. `expectedLockVersion` と現行 `inventory_items.lock_version` を比較し、不一致なら 409 (`INVENTORY_ITEM_CONFLICT`) を返す
4. `inventoryStatus='TRANSFER_PLANNED'` の場合は `destinationFacilityLocationId` を必須とし、移動先は作業対象施設の `facility_locations.deleted_at IS NULL` に限定する。移動先スナップショットは指定値またはロケーション正本から保存する
5. `inventoryStatus='DISPOSAL_PLANNED'` の場合は廃棄理由コードを必須とし、OTHER の場合は廃棄理由詳細も必須とする
6. `inventoryStatus='CONFIRMED'` の場合は移動先、移動理由、廃棄理由、要対応コメントを NULL として現状維持を表す
7. `inventoryStatus='UNCHECKED'` へ戻す場合は移動先、移動理由、廃棄理由、要対応コメント、確定日時を NULL とする
8. `inventory_items` を更新し、`updated_by_user_id`、`confirmed_at`、`lock_version+1` を保存する
9. `inventory_item_status_histories` に変更前後の状態、変更前後値JSON、変更者、変更理由を保存する
10. 親 `inventory_sessions` の進捗キャッシュを同一トランザクションで再計算する

### postInventorySessionsByInventorySessionIdItemsBulkUpdate

#### 権限

- 認可条件: 対象棚卸しセッションの `facility_id` が Bearer トークン上の作業対象施設と一致すること
- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `inventory` が有効であること

#### 処理仕様

1. 親 `inventory_sessions` を同一トランザクションで取得し、`IN_PROGRESS` であることを確認する
2. 親 `inventory_sessions` は排他取得または `session_status='IN_PROGRESS'` 条件付き更新で検証し、完了/取消処理と交差した場合は 409 (`INVENTORY_SESSION_CONFLICT`) を返す
3. 対象明細がすべて親セッションに属すること、重複がないことを確認する
4. 対象全明細の `lock_version` を `expectedLockVersion` と比較し、1件でも不一致なら 409 と競合明細一覧を返す
5. TRANSFER_PLANNED の場合は共通の移動先と移動理由を選択明細へ保存する。`destinationFacilityLocationId` は必須とし、移動先スナップショットは指定値またはロケーション正本から保存する
6. DISPOSAL_PLANNED の場合は共通の廃棄理由を選択明細へ保存する。添付ファイルは本APIでは受け付けず、棚卸し明細添付登録APIで `application_documents.owner_type='INVENTORY_ITEM'` として登録する
7. CONFIRMED の場合は移動先、移動理由、廃棄理由、要対応コメントを NULL として現状維持を表す
8. 全明細更新、履歴作成、親進捗キャッシュ更新を同一トランザクションで行う

### postInventoryItemsByInventoryItemIdDocuments

#### 権限

- 認可条件: 対象棚卸し明細の親セッション `facility_id` が Bearer トークン上の作業対象施設と一致すること
- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `inventory` が有効であること

#### 処理仕様

1. 対象 `inventory_items` と親 `inventory_sessions` を取得し、作業対象施設との一致と親セッションが `IN_PROGRESS` であることを確認する
2. 添付ファイル本体をAmazon S3へPutObjectし、S3オブジェクトキーは `application-documents/facility-{facilityId}/{yyyy}/{mm}/{uploadUuid}.{拡張子}` 形式で生成する。keyは保存場所識別子であり、`inventory_session_id` や `inventory_item_id` などの業務IDを含めない
3. `application_documents.file_path` にはS3オブジェクトキーのみを保存し、バケット名やHTTPS URLはDBへ保存しない
4. `application_documents.owner_type='INVENTORY_ITEM'`、`inventory_item_id=対象明細ID`、`document_category='REQUEST_ATTACHMENT'`、ファイル名、MIMEタイプ、サイズ、content hash をメタデータとして作成する
5. DBメタデータ作成に失敗した場合は、保存済みS3オブジェクトをAmazon S3 DeleteObjectで破棄する。破棄失敗時は 502 (`INVENTORY_502_S3_WRITE_FAILED`) を返し、失敗内容を運用ログへ記録する
6. 棚卸し完了時は、対象明細から自動作成した DISPOSAL 申請側へ同一S3オブジェクトキーを含むドキュメントメタデータを複製し、棚卸し明細側の行は監査用に残す
7. 同一 `Idempotency-Key` の再送は初回登録結果を返し、異なるファイルでのキー再利用は 409 を返す

### deleteInventoryItemsByInventoryItemIdDocumentsByApplicationDocumentId

#### 権限

- 認可条件: 対象棚卸し明細の親セッション `facility_id` が Bearer トークン上の作業対象施設と一致すること
- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `inventory` が有効であること

#### 処理仕様

1. 対象 `inventory_items` と親 `inventory_sessions` を取得し、作業対象施設との一致と親セッションが `IN_PROGRESS` であることを確認する
2. `application_documents` が `owner_type='INVENTORY_ITEM'`、`inventory_item_id=対象明細ID`、未削除であることを確認し、`file_path` のS3オブジェクトキーを取得する
3. Amazon S3 DeleteObjectを実行する。NoSuchKey は既に削除済みとして成功扱いにする
4. DeleteObject成功後に `application_documents.deleted_at` をサーバー時刻で更新する
5. DB更新またはcommitに失敗した場合は再実行時のNoSuchKeyを成功扱いにして復旧可能とし、DeleteObject失敗時は 502 (`INVENTORY_502_S3_DELETE_FAILED`) を返す

### getInventorySessionsByInventorySessionIdCompletionPreview

#### 権限

- 認可条件: 対象棚卸しセッションの `facility_id` が Bearer トークン上の作業対象施設と一致すること
- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `inventory_complete` が有効であること

#### 処理仕様

1. 対象 `inventory_sessions` を取得し、作業対象施設との一致と `IN_PROGRESS` であることを確認する
2. 対象 `inventory_items` を集計し、UNCHECKED、CONFIRMED、TRANSFER_PLANNED、DISPOSAL_PLANNED、ACTION_REQUIRED の件数を算出する
3. 未確認が0件、要対応が0件、かつ全明細が CONFIRMED / TRANSFER_PLANNED / DISPOSAL_PLANNED のいずれかに分類済みの場合のみ `canComplete=true` とする
4. TRANSFER_PLANNED 明細は移動先ロケーション/移動先スナップショット/移動理由単位で自動作成予定の移動申請ヘッダー件数を算出する
5. DISPOSAL_PLANNED 明細は廃棄理由コード/廃棄理由詳細単位で自動作成予定の廃棄申請ヘッダー件数を算出する

### postInventorySessionsByInventorySessionIdComplete

#### 権限

- 認可条件: 対象棚卸しセッションの `facility_id` が Bearer トークン上の作業対象施設と一致すること
- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `inventory_complete` が有効であること

#### 処理仕様

1. `Idempotency-Key` と正規化 payload の組み合わせを検証する
2. 対象 `inventory_sessions` を排他取得し、`IN_PROGRESS` かつ `expectedSessionLockVersion` 一致を確認する
3. 対象 `inventory_items` を排他取得し、`UNCHECKED` が0件であることを確認する。未確認が残る場合は 409 (`INVENTORY_UNCHECKED_ITEMS_REMAIN`) を返す
4. `ACTION_REQUIRED` が0件であることを確認する。要対応が残る場合は 409 (`INVENTORY_ACTION_REQUIRED_ITEMS_REMAIN`) を返す
5. 全明細が CONFIRMED / TRANSFER_PLANNED / DISPOSAL_PLANNED のいずれかに分類済みであることを確認する
6. `asset_ledgers.last_inventory_date` と `last_inventory_user_id` を対象明細の資産へ更新する
7. `inventory_status='TRANSFER_PLANNED'` の明細は移動先ロケーション/移動先スナップショット/移動理由単位で TRANSFER 申請を作成し、`application_assets` と `transfer_application_details` を保存する
8. `inventory_status='DISPOSAL_PLANNED'` の明細は廃棄理由コード/廃棄理由詳細単位で DISPOSAL 申請を作成し、`application_assets` と `disposal_application_details` を保存する
9. 廃棄予定登録時に `application_documents.owner_type='INVENTORY_ITEM'` で保持した添付ファイルは、S3オブジェクト自体を再アップロードせず、作成した `APPLICATION` または `APPLICATION_ASSET` 所有のドキュメントとして `file_path` のS3オブジェクトキー、`file_name`、`mime_type`、`file_size_bytes`、`content_hash` を含むメタデータを複製し、元の棚卸し明細添付は監査用に残す
10. 自動起票した申請ID/申請明細IDを `inventory_items.generated_application_id` / `generated_application_asset_id` に保存する
11. 自動起票した各申請について `application_status_histories` と `inventory_item_status_histories` を作成する
12. `inventory_sessions` を `COMPLETED`、完了者、完了日時、`lock_version+1` で更新する
13. 最終棚卸情報更新、申請作成、履歴作成、セッション完了は同一トランザクションとし、一部だけが残る状態を禁止する

### getInventorySessionsByInventorySessionIdExport

#### 権限

- 認可条件: 対象棚卸しセッションの `facility_id` が Bearer トークン上の作業対象施設と一致すること
- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `inventory_complete` が有効であること

#### 処理仕様

1. 対象 `inventory_sessions` を取得し、作業対象施設との一致を確認する
2. `inventory_items` と資産表示項目、開始時点設置場所、移動予定/廃棄予定/要対応情報を取得する
3. 出力列は画面カードの主要表示項目、棚卸し状態、確認日時、移動先、廃棄理由、要対応コメント、自動起票申請番号を含める
4. 出力は読み取り専用処理とし、棚卸し状態、進捗、申請作成、履歴は更新しない
5. レスポンスは `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` とし、ファイル名に棚卸しセッションIDと出力日を含める
6. 現行APIは即時binaryレスポンスのみとし、生成ファイルはAmazon S3へ保存しない

### postInventorySessionsByInventorySessionIdCancel

#### 権限

- 認可条件: 対象棚卸しセッションの `facility_id` が Bearer トークン上の作業対象施設と一致すること
- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `inventory_complete` が有効であること

#### 処理仕様

1. 対象 `inventory_sessions` を排他取得し、`IN_PROGRESS` かつ `expectedSessionLockVersion` 一致を確認する
2. `inventory_sessions` を `CANCELLED`、取消者、取消日時、取消理由、`lock_version+1` で更新する
3. `inventory_items` は物理削除せず、取消時点の状態を保持する
4. 取消済みセッションに対する明細更新/完了は 409 を返す

## 第6章 権限・業務ルール

### 権限対応表

| API/処理 | 必要 feature_code | 判定内容 |
| --- | --- | --- |
| セッション取得 / 詳細取得 | `inventory` | 通常アカウントは作業対象施設で棚卸し状態を参照できること。共有システム管理者は作業対象施設が未削除であること |
| 棚卸し開始 / 明細更新 / 一括更新 / 添付登録・削除 | `inventory` | 通常アカウントは作業対象施設で棚卸し作業を行えること。共有システム管理者は作業対象施設が未削除であること |
| 棚卸し完了確認 / 棚卸し完了 / Excel出力 / 取消 | `inventory_complete` | 通常アカウントは棚卸し結果確認、結果出力、結果確定、移動/廃棄申請起票、棚卸し取消ができること。共有システム管理者は作業対象施設が未削除であること |

### 業務ルール

- 同一施設で進行中棚卸しセッションは1件のみ許可する
- 同施設の権限ユーザーは進行中セッションを共有して作業する。画面を開いているユーザー単位の排他ロックは採用しない
- 作業状態は明細1行単位で即時保存する。最後に保存した人が黙って上書きすることを防ぐため、`lock_version` による楽観ロックを必須とする
- 一括更新は全件成功または全件失敗とし、競合明細が1件でもあればロールバックする
- 棚卸し完了前に `UNCHECKED` または `ACTION_REQUIRED` が残っている場合は完了不可とする
- `TRANSFER_PLANNED` は棚卸し完了時に移動申請を作成するだけで、`asset_ledgers.facility_location_id` は更新しない。原本反映は移動・廃棄管理 API の承認処理で扱う
- `DISPOSAL_PLANNED` は棚卸し完了時に廃棄申請を作成するだけで、`asset_ledgers.status` は更新しない。廃棄完了や除却状態への変更は廃棄管理側で扱う
- `ACTION_REQUIRED` は棚卸し明細にコメントを保存し、完了時の申請起票対象にはしない
- 取消は物理削除ではなく `CANCELLED` への状態更新とし、後続監査のため明細・履歴を保持する

### 設計判断・将来拡張事項

| 項目 | 設計判断 | 補足 |
| --- | --- | --- |
| 棚卸し専用 feature_code | `inventory` / `inventory_complete` で制御する | ロール整理.xlsx の棚卸し / 棚卸し完了に合わせる |
| 年度/キャンペーン管理 | 単一施設の進行中セッション1件を正本とする | 年度棚卸し、部門別棚卸し、複数期間同時実行が必要になった場合は進行中一意制約の粒度を見直す |
| 自動作成申請の件数 | 申請ヘッダー件数を申請件数とし、対象明細件数も別項目で返す | 完了確認モーダルの「移動申請」「廃棄申請」はヘッダー件数として扱う |
| 自動作成申請の集約 | 同一種別かつ同一申請内容の予定明細を1申請に集約する | 移動は移動先/移動理由、廃棄は廃棄理由で集約し、申請明細は複数行を許容する |
| 棚卸し中の添付 | `application_documents.owner_type='INVENTORY_ITEM'` で一時保持し、ファイル本体はAmazon S3、DBはS3オブジェクトキーを保持する。完了時は作成申請へ同一S3オブジェクトキーを含むメタデータを複製する | 棚卸し明細側の添付は監査用に残し、申請側は通常の `APPLICATION` / `APPLICATION_ASSET` 文書として参照する。S3オブジェクト自体は再アップロードしない |
| リアルタイム同期 | 再取得または画面側ポーリングで最新化する | WebSocket / SSE による presence 表示や即時反映は将来拡張とし、正本更新は明細単位の楽観ロックを維持する |

## 第7章 エラーコード一覧

| エラーコード | HTTPステータス | 内容 | 発生条件 |
| --- | --- | --- | --- |
| VALIDATION_ERROR | 400 | 入力値不正 | 必須項目不足、型不正、状態と詳細項目の組み合わせ不正 |
| UNAUTHORIZED | 401 | 未認証 | Bearer トークンがない、または無効 |
| FORBIDDEN | 403 | 権限不足 | 通常アカウントで作業対象施設への割当または必要 feature_code が不足、共有システム管理者で作業対象施設が削除済み、または対象施設不一致 |
| INVENTORY_SESSION_NOT_FOUND | 404 | 棚卸しセッションなし | 指定セッションが存在しない、または作業対象施設に属さない |
| INVENTORY_ITEM_NOT_FOUND | 404 | 棚卸し明細なし | 指定明細が存在しない、または対象セッションに属さない |
| LOCATION_NOT_FOUND | 404 | 移動先なし | 指定移動先が作業対象施設の未削除ロケーションとして存在しない |
| INVENTORY_SESSION_ALREADY_ACTIVE | 409 | 進行中棚卸しあり | 同一施設に IN_PROGRESS セッションが既に存在する |
| INVENTORY_ITEM_CONFLICT | 409 | 明細更新競合 | expectedLockVersion と現行 inventory_items.lock_version が一致しない |
| INVENTORY_SESSION_CONFLICT | 409 | セッション更新競合 | expectedSessionLockVersion と現行 inventory_sessions.lock_version が一致しない |
| INVENTORY_SESSION_NOT_IN_PROGRESS | 409 | 進行中でない | 完了済みまたは取消済みセッションを更新しようとした |
| INVENTORY_UNCHECKED_ITEMS_REMAIN | 409 | 未確認明細あり | 棚卸し完了時に UNCHECKED 明細が残っている |
| INVENTORY_ACTION_REQUIRED_ITEMS_REMAIN | 409 | 要対応明細あり | 棚卸し完了時に ACTION_REQUIRED 明細が残っている |
| APPLICATION_INITIAL_STATUS_INVALID | 409 | 申請初期ステータス設定不備 | TRANSFER / DISPOSAL の初期ステータスが未定義または複数定義 |
| IDEMPOTENCY_KEY_REUSED | 409 | 冪等キー再利用不正 | 同一 Idempotency-Key が異なる payload で再利用された |
| INVENTORY_502_S3_WRITE_FAILED | 502 | S3保存失敗 | 棚卸し明細添付のAmazon S3 PutObject、またはDB失敗時のS3オブジェクト破棄に失敗した |
| INVENTORY_502_S3_DELETE_FAILED | 502 | S3削除失敗 | 棚卸し明細添付のAmazon S3 DeleteObjectに失敗した |
| INVENTORY_502_S3_URL_SIGN_FAILED | 502 | S3 URL発行失敗 | 資産カード画像の認可済み表示URL発行に失敗した |
| INTERNAL_SERVER_ERROR | 500 | サーバー内部エラー | 想定外エラー |

## 第8章 運用・保守方針

### 正本データ保守方針

- 棚卸しプロセスの正本は `inventory_sessions`、明細作業状態の正本は `inventory_items` とする
- 棚卸し対象資産の資産正本は `asset_ledgers` とし、棚卸し開始時点の表示値は `inventory_items` にスナップショットとして保持する
- 設置場所候補の正本は `facility_locations` とし、移動予定の移動先は作業対象施設の未削除行に限定する
- 移動/廃棄申請の保存モデルは資産申請起票 API 設計書に合わせ、`applications` を親、`application_assets` と申請種別別詳細を子として扱う
- 棚卸し完了後の承認、原本反映、廃棄タスク進行は移動・廃棄管理側の運用で扱う

### 今後拡張時の留意点

- 年度棚卸し、部門別棚卸し、複数棚卸し同時進行が必要になった場合は、`inventory_sessions` に棚卸し種別、期間、対象範囲を追加し、進行中一意制約の粒度を見直す
- リアルタイム共同作業の UX を強化する場合は、更新通知、presence、明細単位の一時担当者表示を追加する。ただし正本競合制御は `lock_version` を維持する
- 要対応を後続ワークフロー化する場合は、専用タスクまたは申請種別を追加し、`inventory_items.action_required_comment` を起点に連携する
- 棚卸し結果の Excel 出力を保存帳票化する場合は、現行の即時binaryレスポンスとは別に、生成ファイルをAmazon S3へ保存し、DBには帳票メタデータとS3オブジェクトキーを保持するAPIとして再ダウンロード、監査ログを追加定義する
