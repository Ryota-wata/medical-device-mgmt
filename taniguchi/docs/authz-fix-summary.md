# 認証認可 fix 向け整理メモ

本メモは、クライアントとの合意内容、認証認可の再設計方針、テーブル案、フロントエンド・バックエンドの責務を、fix に向けた 1 枚の整理としてまとめたものである。  
モックは画面イメージと表示要件の確認資料として参照し、本番実装は本メモを基準に別途設計・開発する前提とする。

## 1. 今回の設計で確定していること

- 事前定義ロールを認可の正本にする考え方は廃止する。
- 施設ごとに「その施設で提供する機能」を ON/OFF 管理する。
- 施設に紐づくユーザーごとに「その施設で利用可能にする機能」を ON/OFF 管理する。
- 設立母体を問わない任意の施設協業グループを持ち、同一グループ内の他施設データを閲覧できるようにする。
- 他施設閲覧は、閲覧者側の利用可否だけでなく、公開元施設側の公開設定も満たした場合のみ許可する。
- 一部の一覧カラムは、機能とは別にカラム単位で ON/OFF 管理する。
- SHRC ユーザーは、担当施設を複数割り当て可能とし、施設ごとに利用可能機能を管理する。
- UI の表示制御と実処理認可は、同じ `feature_code` / `column_code` を正本にして管理する。
- モックのコードを流用して実装する前提ではなく、モックは要件確認の根拠として扱う。
- `facilities.deleted_at` が設定された施設は施設選択・認可判定・業務データ参照の対象外とし、関連認可設定は保持したまま、再契約等で `deleted_at` を解除した時点で再利用する。

## 2. `feature` と `column` の考え方

### 2-1. `feature`

- `feature` は権限判定の単位である。
- 例:
  - `user_list_view`
  - `original_list_view`
  - `management_department_edit`
  - `inventory_complete`
  - `qr_issue`
- `feature` は DB の boolean カラムを大量に増やして管理するのではなく、機能カタログの 1 行として定義する。

### 2-2. `column`

- `column` は画面上の表示項目の制御単位である。
- 例:
  - `original_price_column`
  - `remodel_ship_column`
  - `normal_ship_column`
  - `asset_master_ship_column`
- `column` も `feature` と同様に、カラムカタログの 1 行として定義する。

### 2-3. `1行で管理する` の意味

- `feature` を 1 行で管理するとは、`feature_catalogs` において `1 feature_code = 1 行` で定義する、という意味である。
- 施設の ON/OFF やユーザーの ON/OFF までを同じ 1 行で表現する意味ではない。
- 現在値は、施設設定テーブル、ユーザー施設設定テーブルで別に持つ。

## 3. テーブルごとの役割

### 3-1. 既存継続

- `users`
  - ログイン ID
  - パスワード
  - 氏名
  - 所属
  - アカウント状態
  - `account_type` は表示分類・入力制御用に保持してよいが、認可判定には使わない。
- `facilities`
  - 施設正本。
  - 契約状態もここで管理する。
  - `deleted_at` が設定された施設は実行時に無効扱いとし、`/auth/me` や業務 API では候補から除外する。
  - 施設を復活させる場合は `deleted_at` を解除し、既存の担当施設割当・機能設定・公開設定を再利用する。
- `user_remember_tokens`
- `password_reset_tokens`

### 3-2. 機能・カラムの正本

- `feature_catalogs`
  - すべての `feature_code` の定義を持つ。
  - `config_scope='SYSTEM_FIXED'` の機能は、施設・ユーザーの ON/OFF 管理対象に含めない。
  - `auth_login` はこの扱いとする。
- `column_catalogs`
  - すべての `column_code` の定義を持つ。

### 3-3. 担当施設

- `user_facility_assignments`
  - ユーザーが作業対象として持つ施設を表す。
  - SHRC ユーザーの複数担当施設もここで表す。
  - 施設選択画面はこの一覧からのみ選択する。
  - `facility_select_all` は認可機能として採用しない。

### 3-4. 施設単位の提供設定

- `facility_feature_settings`
  - 施設ごとに、どの `feature` をその施設で提供するかを管理する。
  - 例:
    - 施設 A では `original_list_view=true`
    - 施設 A では `qr_issue=false`
- `facility_column_settings`
  - 施設ごとに、どの `column` をその施設で提供するかを管理する。
  - `related_feature_code` に対応する `feature` が施設で有効な場合のみ ON にできる。

### 3-5. ユーザー施設別の利用設定

- `user_facility_feature_settings`
  - ユーザーが特定施設で、どの `feature` を利用できるかを管理する。
  - 例:
    - ユーザー X は施設 A で `original_list_view=true`
    - ユーザー X は施設 A で `qr_issue=false`
- `user_facility_column_settings`
  - ユーザーが特定施設で、どの `column` を表示できるかを管理する。
  - `related_feature_code` に対応する `feature` がそのユーザー施設で有効な場合のみ ON にできる。

### 3-6. 他施設閲覧のためのグループと公開設定

- `facility_collaboration_groups`
  - 任意の施設協業グループ本体。
- `facility_collaboration_group_facilities`
  - そのグループに属する施設を表す。
  - 所属するのはユーザーではなく施設である。
- `facility_external_view_settings`
  - 公開元施設が、他施設へ何のデータを公開するかを管理する。
- `facility_external_column_settings`
  - 公開元施設が、他施設へどのカラムを公開するかを管理する。
  - `related_feature_code` に対応する外部公開 `feature` が有効な場合のみ ON にできる。

## 4. ON/OFF の表現方法

### 4-1. 施設単位の ON/OFF

- `facility_feature_settings` の `is_enabled` で表現する。
- 例:

```text
facility_id = 10, feature_code = 'original_list_view', is_enabled = true
facility_id = 10, feature_code = 'qr_issue', is_enabled = false
```

### 4-2. ユーザー施設別の ON/OFF

- `user_facility_feature_settings` の `is_enabled` で表現する。
- 例:

```text
user_facility_assignment_id = 100, feature_code = 'original_list_view', is_enabled = true
user_facility_assignment_id = 100, feature_code = 'qr_issue', is_enabled = false
```

### 4-3. 実効権限の考え方

- 施設 ON × ユーザー ON = 利用可能
- 施設 ON × ユーザー OFF = 利用不可
- 施設 OFF × ユーザー ON = 不整合
- 施設 OFF × ユーザー OFF = 利用不可

運用上は、ユーザー側設定が施設側設定を超えないようにする。

### 4-4. 後から ON/OFF を切り替える場合

- 施設で提供開始する場合:
  - `facility_feature_settings.is_enabled` を `false -> true` に更新する
- 施設で提供停止する場合:
  - `facility_feature_settings.is_enabled` を `true -> false` に更新する
- ユーザーに利用許可する場合:
  - `user_facility_feature_settings.is_enabled` を `false -> true` に更新する
- ユーザーの利用を停止する場合:
  - `user_facility_feature_settings.is_enabled` を `true -> false` に更新する

つまり、現在値は同じ行の `is_enabled` を更新して管理する。  
「誰がいつ変更したか」は履歴テーブルまたは監査ログで別に追跡する。

## 5. 実際に使えるかの判定方法

### 5-1. 自施設利用

自施設の機能を使える条件は次のとおり。

1. `user_facility_assignments` に、当該ユーザーと作業対象施設の割当がある
2. `facilities.deleted_at IS NULL` で、その施設が未削除である
3. `facility_feature_settings` で、その施設の当該 `feature_code` が `true`
4. `config_scope='FACILITY_USER'` の場合は `user_facility_feature_settings` で、そのユーザー施設割当の当該 `feature_code` が `true`
5. `lending_in_use_used` は子機能のため、上記に加えて親機能 `lending_checkout` の実効権限も成立している場合だけ利用可能とする

### 5-2. 他施設閲覧

他施設データを見られる条件は次のとおり。

1. 閲覧者に対して、作業対象施設で external 向け `feature_code` が有効
2. 閲覧者の作業対象施設と公開元施設が同じ `facility_collaboration_groups` に属する
3. 閲覧者側施設と公開元施設の両方が `facilities.deleted_at IS NULL` の未削除施設である
4. 両施設が契約中である
5. 公開元施設で、対象データの `facility_external_view_settings` が `true`
6. 必要な external 向け `column_code` について `facility_external_column_settings` が `true`

他施設閲覧は、閲覧者側権限と公開元施設側公開設定の両方を満たした場合のみ許可する。

## 6. フロントエンドで行うこと

- ログイン後に `GET /auth/me` で担当施設一覧と基本情報を取得する。
- `GET /auth/me` では `facilities.deleted_at IS NULL` の担当施設だけを `assignedFacilities` に表示し、削除済み施設は見せない。
- 施設選択後に `GET /auth/context?actingFacilityId=...` で、その施設における実効 `feature_code` / `column_code` を取得する。
- 論理削除済み施設は施設選択候補に含めない。再契約等で施設を復活させた場合は、保持済み設定を使って再度候補に現れる。
- フロントエンドは `can(featureCode)` / `canColumn(columnCode)` を使って次を制御する。
  - メニュー表示
  - 画面遷移導線
  - 画面内ボタン表示
  - 一覧カラム表示
- 「機能を使えない = ボタンを表示しない」を基本とする。
- ただし、フロントエンドの表示制御は UX のためであり、最終的な認可境界はバックエンドに置く。

## 7. バックエンドで行うこと

- `POST /auth/login`
  - 認証処理
- `GET /auth/me`
  - ログインユーザー基本情報
  - `accountType`
  - 未削除の担当施設一覧
  - 未削除施設に限定した既定施設
- `GET /auth/context?actingFacilityId=...`
  - 指定施設に対する実効 `feature_code` 一覧
  - 指定施設に対する実効 `column_code` 一覧

バックエンドは共通の認可サービスを持ち、すべての業務 API で毎回再判定する。

- 自施設 API
  - `user_id` と `actingFacilityId` と `feature_code` で判定する
- 他施設 API
  - `user_id`、`actingFacilityId`、`targetFacilityId`、`feature_code`、必要な `column_code` で判定する

バックエンドは、許可されていないデータやカラムをレスポンスに含めない。  
ブラウザで DOM を改変してボタンを見せても、API 側で 403 になるか、データ自体が返らない状態にする。
- 施設が論理削除されても認可設定テーブルの行は残すが、認可サービスは `facilities.deleted_at IS NULL` を前提条件に追加し、削除済み施設へのアクセスを拒否する。
- 再契約等で `facilities.deleted_at` を解除した場合は、残っている割当・機能設定・公開設定をそのまま有効化して再利用する。

## 8. DB 制約と更新 API 制約

### 8-1. DB で担保すること

- 一意制約
  - `user_facility_assignments(user_id, facility_id)`
  - `facility_feature_settings(facility_id, feature_code)`
  - `facility_column_settings(facility_id, column_code)`
  - `user_facility_feature_settings(user_facility_assignment_id, feature_code)`
  - `user_facility_column_settings(user_facility_assignment_id, column_code)`
  - `facility_collaboration_group_facilities(facility_collaboration_group_id, facility_id)`
  - `facility_external_view_settings(provider_facility_id, feature_code)`
  - `facility_external_column_settings(provider_facility_id, column_code)`
- FK 制約
  - 存在しない `facility_id`、`feature_code`、`column_code`、`user_facility_assignment_id` を登録できない
- CHECK 制約
  - `valid_to >= valid_from`
  - `assignment_type`、`usage_context`、`config_scope` は許可値のみ
- 部分一意制約
  - 有効な担当施設のうち `is_default=true` は 1 ユーザーにつき 1 件まで

### 8-2. 更新 API で担保すること

- `user_facility_feature_settings` は、`facility_feature_settings.is_enabled=true` の機能だけ ON にできる
- `user_facility_column_settings` は、`facility_column_settings.is_enabled=true` かつ `related_feature_code` に対応する `user_facility_feature_settings.is_enabled=true` のカラムだけ ON にできる
- `facility_feature_settings` には、`config_scope in ('FACILITY', 'FACILITY_USER')` の機能だけ登録できる
- `facility_column_settings` は、`related_feature_code` に対応する `facility_feature_settings.is_enabled=true` のときだけ ON にできる
- `facility_external_view_settings` には、`usage_context='EXTERNAL'` の機能だけ登録できる
- `facility_external_column_settings` には、`usage_context='EXTERNAL'` かつ `related_feature_code` に対応する `facility_external_view_settings.is_enabled=true` のカラムだけ登録できる
- 施設論理削除 API は関連認可テーブルを cascade しない。削除済み施設は実行時判定で除外し、復活時は `deleted_at` を解除して再利用する。

## 9. 監査・履歴

- 設定系テーブルには `created_at` / `updated_at` に加え、`created_by` / `updated_by` を持つ前提とする。
- さらに、監査ログまたは変更履歴テーブルで次を追えるようにする。
  - 誰が
  - いつ
  - どの設定を
  - どう変更したか
- 対象は少なくとも次とする。
  - `user_facility_assignments`
  - `facility_feature_settings`
  - `facility_column_settings`
  - `user_facility_feature_settings`
  - `user_facility_column_settings`
  - `facility_collaboration_groups`
  - `facility_collaboration_group_facilities`
  - `facility_external_view_settings`
  - `facility_external_column_settings`

## 10. fix 時の注意点

- `menu_group_code` は表示整理用であり、認可判定の正本ではない。
- `auth_login` は認証前提機能であり、施設・ユーザー権限設定の対象に含めない。
- `facility_select_all` は採用しない。
- `original_price_column`、`remodel_ship_column`、`normal_ship_column`、`asset_master_ship_column` は、`権限管理単位一覧` シート A列の最新粒度に合わせて分離維持する。
- `users.account_type` は認可判定に使わない。
- 病院ユーザーでは `users.facility_id` と `user_facility_assignments.is_default=true` の施設を一致させる。
- モックは画面イメージの根拠であり、実装ベースではない。
- 施設論理削除時は認可設定を削除せず保持し、削除済み施設だけを実行時に無効扱いする。

## 11. 具体的なコード値定義

### 11-1. `feature_catalogs` / `column_catalogs` で使う許可値

#### `category_code`

| 値 | 用途 |
| --- | --- |
| `AUTH` | 認証・施設選択などログイン前後の共通導線 |
| `USER_MGMT` | ユーザー管理、担当施設設定、施設グループ管理 |
| `ASSET_REQUEST` | 資産一覧・カルテ閲覧、資産一覧起点の各種登録 |
| `MAINTENANCE` | 日常点検、貸出返却、修理申請 |
| `INVENTORY` | 棚卸し |
| `QR` | QR 発行 |
| `SURVEY` | 現有品調査、台帳取込、データ突合 |
| `REMODEL` | リモデル系機能 |
| `TASK` | 通常購入、各種管理、タスク管理配下 |
| `MASTER` | マスタ管理 |

#### `menu_group_code`

| 値 | 対応する画面上のグループ |
| --- | --- |
| `USER_ADMIN` | ユーザー管理 |
| `ASSET_REQUEST` | 資産閲覧申請 |
| `MAINTENANCE_REQUEST` | 保守点検／貸出／修理申請 |
| `INVENTORY` | 棚卸し |
| `QR_ISSUE` | QRコード発行 |
| `SURVEY` | 個体管理リスト作成 |
| `REMODEL` | 編集リスト（リモデル） |
| `NORMAL_EDIT` | 編集リスト（通常） |
| `TASK` | タスク管理 |
| `MASTER_ADMIN` | マスタ管理 |

`auth_login` と `facility_select` はメニューに載せないため、`menu_group_code` は持たない。

#### `feature_kind`

| 値 | 意味 |
| --- | --- |
| `AUTH` | 認証やログイン前提導線 |
| `SCREEN` | 画面利用そのものを表す機能 |
| `ACTION` | 登録、編集、申請、実行などの操作 |

#### `usage_context`

| 値 | 意味 |
| --- | --- |
| `COMMON` | 認証、施設選択、ユーザー管理など共通文脈 |
| `OWN` | 自施設文脈で使う機能・カラム |
| `EXTERNAL` | 他施設公開設計の予約値。最新の `権限管理単位一覧` シートでは未使用 |

#### `config_scope`

| 値 | 意味 |
| --- | --- |
| `SYSTEM_FIXED` | 施設・ユーザー設定では ON/OFF しない固定機能 |
| `FACILITY` | 施設設定のみ対象。現行採用コードでは使用しない |
| `FACILITY_USER` | 施設設定、ユーザー施設設定の対象。固定導線を除く現行機能コードはこのスコープに統一 |

#### `column_group_code`

| 値 | 意味 |
| --- | --- |
| `PRICE` | 価格系カラム |
| `SHIP_ONLY` | DataLINK SHIP 固有カラム |

#### `assignment_type`

| 値 | 意味 |
| --- | --- |
| `PRIMARY` | 主担当施設 |
| `SECONDARY` | 副担当施設 |

### 11-2. `feature_catalogs` に登録する具体的な `feature_code`

| feature_code | feature_name | category_code | menu_group_code | feature_kind | usage_context | config_scope | 備考 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `user_list_view` | ユーザー / 一覧 | `USER_MGMT` | `USER_ADMIN` | `SCREEN` | `COMMON` | `FACILITY_USER` | ユーザー一覧画面の利用可否 |
| `user_edit` | ユーザー / 新規作成・編集 | `USER_MGMT` | `USER_ADMIN` | `ACTION` | `COMMON` | `FACILITY_USER` | ユーザー新規作成・編集モーダル |
| `user_facility_assignment_edit` | 担当施設 / 編集 | `USER_MGMT` | `USER_ADMIN` | `ACTION` | `COMMON` | `FACILITY_USER` | ユーザー編集画面の担当施設設定 UI |
| `facility_group_list` | 施設グループ / 一覧 | `USER_MGMT` | `USER_ADMIN` | `SCREEN` | `COMMON` | `FACILITY_USER` | 施設グループ一覧画面 |
| `facility_group_edit` | 施設グループ / 新規作成・編集 | `USER_MGMT` | `USER_ADMIN` | `ACTION` | `COMMON` | `FACILITY_USER` | 施設グループ編集モーダル |
| `auth_login` | ログイン・パスワード再設定（固定導線） | `AUTH` | - | `AUTH` | `COMMON` | `SYSTEM_FIXED` | 認証前提機能 |
| `facility_select` | 施設選択（固定導線） | `AUTH` | - | `SCREEN` | `COMMON` | `SYSTEM_FIXED` | 権限管理単位一覧シート外の固定導線 |
| `original_list_view` | 資産一覧・カルテ閲覧 | `ASSET_REQUEST` | `ASSET_REQUEST` | `SCREEN` | `OWN` | `FACILITY_USER` | 資産一覧とカルテ閲覧 |
| `original_application` | 資産一覧 / 新規・更新・増設・移動・廃棄 | `ASSET_REQUEST` | `ASSET_REQUEST` | `ACTION` | `OWN` | `FACILITY_USER` | 資産一覧起点の申請系ボタン |
| `management_department_edit` | 資産一覧 / 管理部署編集 | `ASSET_REQUEST` | `ASSET_REQUEST` | `ACTION` | `OWN` | `FACILITY_USER` | 資産一覧上の管理部署編集と一括保存 |
| `inspection_management` | 資産一覧 / 点検管理登録 | `TASK` | `TASK` | `SCREEN` | `OWN` | `FACILITY_USER` | 点検管理と同一コードで資産一覧起点導線を制御 |
| `maintenance_contract` | 資産一覧 / 保守契約登録 | `TASK` | `TASK` | `SCREEN` | `OWN` | `FACILITY_USER` | 保守契約管理と同一コードで資産一覧起点導線を制御 |
| `original_list_edit` | 資産カルテ / 原本編集 | `ASSET_REQUEST` | `ASSET_REQUEST` | `ACTION` | `OWN` | `FACILITY_USER` | 資産カルテからの原本編集 |
| `daily_inspection` | 日常点検・オフライン準備 | `MAINTENANCE` | `MAINTENANCE_REQUEST` | `SCREEN` | `OWN` | `FACILITY_USER` | 日常点検画面とオフライン準備導線 |
| `lending_checkout` | 貸出・返却 | `MAINTENANCE` | `MAINTENANCE_REQUEST` | `SCREEN` | `OWN` | `FACILITY_USER` | 貸出可能機器閲覧と貸出返却 |
| `lending_in_use_used` | 貸出・返却 / 使用中 & 使用済み | `MAINTENANCE` | `MAINTENANCE_REQUEST` | `ACTION` | `OWN` | `FACILITY_USER` | 貸出返却画面の使用中/使用済みモーダル・ボタン。施設提供設定とユーザー施設別設定の両方で制御。実効利用には `lending_checkout` も必須 |
| `repair_application` | 修理申請 | `MAINTENANCE` | `MAINTENANCE_REQUEST` | `SCREEN` | `OWN` | `FACILITY_USER` | 修理申請画面 |
| `inventory` | 棚卸し | `INVENTORY` | `INVENTORY` | `SCREEN` | `OWN` | `FACILITY_USER` | 棚卸し画面の利用可否 |
| `inventory_complete` | 棚卸し / 完了 | `INVENTORY` | `INVENTORY` | `ACTION` | `OWN` | `FACILITY_USER` | 棚卸し完了操作と Excel 出力を同一単位で扱う |
| `qr_issue` | QRコード発行 | `QR` | `QR_ISSUE` | `SCREEN` | `OWN` | `FACILITY_USER` | QR 発行画面、プレビュー、印刷 |
| `existing_survey` | 現有品調査 | `SURVEY` | `SURVEY` | `SCREEN` | `OWN` | `FACILITY_USER` | オフライン準備、調査場所入力、履歴を含む |
| `survey_data_edit` | 現有品調査内容修正 | `SURVEY` | `SURVEY` | `SCREEN` | `OWN` | `FACILITY_USER` | 現有品調査内容修正画面 |
| `asset_ledger_import` | 資産台帳取込登録 | `SURVEY` | `SURVEY` | `SCREEN` | `OWN` | `FACILITY_USER` | 資産台帳取込画面とマスタ突合せ画面 |
| `survey_ledger_matching` | データ突合 | `SURVEY` | `SURVEY` | `SCREEN` | `OWN` | `FACILITY_USER` | 固定資産台帳未突合画面の利用可否 |
| `remodel_edit_list` | 編集リスト（リモデル） | `REMODEL` | `REMODEL` | `SCREEN` | `OWN` | `FACILITY_USER` | リモデル編集リスト画面の利用可否 |
| `remodel_purchase` | リモデル購入管理 / 申請受付～見積登録 | `REMODEL` | `TASK` | `SCREEN` | `OWN` | `FACILITY_USER` | タスク管理画面のリモデル管理タブで見積登録行を扱う |
| `remodel_order` | リモデル購入管理 / 発注登録～資産登録 | `REMODEL` | `TASK` | `SCREEN` | `OWN` | `FACILITY_USER` | リモデル管理タブの発注登録～資産登録行 |
| `remodel_acceptance` | リモデル購入管理 / 検収登録 | `REMODEL` | `TASK` | `SCREEN` | `OWN` | `FACILITY_USER` | リモデル管理タブの検収登録行 |
| `normal_edit_list` | 編集リスト（通常） | `TASK` | `NORMAL_EDIT` | `SCREEN` | `OWN` | `FACILITY_USER` | 通常編集リスト画面の利用可否 |
| `normal_purchase` | 通常購入管理 / 申請受付～見積登録 | `TASK` | `TASK` | `SCREEN` | `OWN` | `FACILITY_USER` | 通常購入管理の入口 |
| `normal_order` | 通常購入管理 / 発注登録～仮資産登録 | `TASK` | `TASK` | `SCREEN` | `OWN` | `FACILITY_USER` | 購入管理タブの発注登録～仮資産登録行 |
| `normal_acceptance` | 通常購入管理 / 検収登録 | `TASK` | `TASK` | `SCREEN` | `OWN` | `FACILITY_USER` | 購入管理タブの検収登録行 |
| `normal_quotation` | 通常購入管理 / 見積管理 | `TASK` | `TASK` | `SCREEN` | `OWN` | `FACILITY_USER` | 購入管理タブの見積管理行 |
| `normal_ship_request` | 通常購入管理 / SHIP依頼機能 | `TASK` | `TASK` | `ACTION` | `OWN` | `FACILITY_USER` | 購入管理タブのSHIPへ一括依頼ボタン。施設提供設定とユーザー施設別設定の両方で制御 |
| `transfer_disposal` | 移動・廃棄管理 | `TASK` | `TASK` | `SCREEN` | `OWN` | `FACILITY_USER` | 移動・廃棄管理タブ |
| `repair_management` | 修理管理 | `TASK` | `TASK` | `SCREEN` | `OWN` | `FACILITY_USER` | 修理管理タブ |
| `maintenance_contract` | 保守契約管理 | `TASK` | `TASK` | `SCREEN` | `OWN` | `FACILITY_USER` | 保守管理タブ |
| `inspection_management` | 点検管理 | `TASK` | `TASK` | `SCREEN` | `OWN` | `FACILITY_USER` | 点検管理タブ |
| `lending_management` | 貸出管理（タスク管理） | `TASK` | `TASK` | `SCREEN` | `OWN` | `FACILITY_USER` | 貸出管理タブ |
| `asset_master_list` | 資産マスタ / 一覧 | `MASTER` | `MASTER_ADMIN` | `SCREEN` | `OWN` | `FACILITY_USER` | 一覧参照 |
| `asset_master_edit` | 資産マスタ / 新規作成・編集 | `MASTER` | `MASTER_ADMIN` | `ACTION` | `OWN` | `FACILITY_USER` | 編集・新規作成 |
| `facility_master_list` | 施設マスタ / 一覧 | `MASTER` | `MASTER_ADMIN` | `SCREEN` | `OWN` | `FACILITY_USER` | 一覧参照 |
| `facility_master_edit` | 施設マスタ / 新規作成・編集 | `MASTER` | `MASTER_ADMIN` | `ACTION` | `OWN` | `FACILITY_USER` | 編集・新規作成 |
| `facility_feature_edit` | 施設提供機能 / 編集 | `MASTER` | `MASTER_ADMIN` | `ACTION` | `OWN` | `FACILITY_USER` | 施設単位の機能提供設定 |
| `ship_dept_master_list` | SHIP部署マスタ / 一覧 | `MASTER` | `MASTER_ADMIN` | `SCREEN` | `OWN` | `FACILITY_USER` | 一覧参照 |
| `ship_dept_master_edit` | SHIP部署マスタ / 新規作成・編集 | `MASTER` | `MASTER_ADMIN` | `ACTION` | `OWN` | `FACILITY_USER` | 編集・新規作成 |
| `hospital_dept_master_list` | 個別部署マスタ / 一覧 | `MASTER` | `MASTER_ADMIN` | `SCREEN` | `OWN` | `FACILITY_USER` | 一覧参照 |
| `hospital_dept_master_edit` | 個別部署マスタ / 新規作成・編集 | `MASTER` | `MASTER_ADMIN` | `ACTION` | `OWN` | `FACILITY_USER` | 編集・新規作成 |
| `vendor_master_list` | 業者マスタ / 一覧 | `MASTER` | `MASTER_ADMIN` | `SCREEN` | `OWN` | `FACILITY_USER` | 一覧参照 |
| `vendor_master_edit` | 業者マスタ / 新規作成・編集 | `MASTER` | `MASTER_ADMIN` | `ACTION` | `OWN` | `FACILITY_USER` | 編集・新規作成 |

`sort_order` は画面上の表示順制御値であり、現時点ではクライアント合意に含まれていないため、本メモでは固定しない。

### 11-3. `column_catalogs` に登録する具体的な `column_code`

| column_code | column_name | related_feature_code | column_group_code | usage_context | 備考 |
| --- | --- | --- | --- | --- | --- |
| `original_price_column` | 資産一覧・カルテ / 原本価格情報 | `original_list_view` | `PRICE` | `OWN` | 原本リストと資産カルテの価格列 |
| `remodel_ship_column` | DataLINK / SHIP表示列（リモデル） | `remodel_edit_list` | `SHIP_ONLY` | `OWN` | リモデル編集リストの SHIP 列 |
| `normal_ship_column` | DataLINK / SHIP表示列（通常） | `normal_edit_list` | `SHIP_ONLY` | `OWN` | 通常編集リストの SHIP 列 |
| `asset_master_ship_column` | 資産マスタ / SHIP表示列 | `asset_master_list` | `SHIP_ONLY` | `OWN` | A列名称に合わせて資産マスタ文脈で管理。対象画面セルは通常編集リストを指しており要確認 |

### 11-4. 採用しないコード

| 値 | 扱い |
| --- | --- |
| `facility_select_all` | `feature_catalogs` には登録しない。施設選択は `user_facility_assignments` の担当施設からのみ行う |
| `application_status`, `qr_scan`, `remodel_quotation`, `periodic_inspection` | 最新の `権限管理単位一覧` シートに単位が存在しないため、今回の `feature_catalogs` から外す |
| `inventory_field`, `inventory_office` | `棚卸し` / `棚卸し / 完了` へ再編する |
| `own_asset_master_view`, `own_user_master`, `own_asset_list`, `own_estimate`, `own_data_history`, `other_asset_list`, `other_estimate`, `other_data_history`, `own_price_column`, `other_price_column` | 最新の `権限管理単位一覧` シートに単位が存在しないため、今回の `feature_catalogs` / `column_catalogs` から外す |
| `ship_column` | `remodel_ship_column`、`normal_ship_column`、`asset_master_ship_column` に再編する |

## 12. Fix 方針

- 権限管理単位は `taniguchi/docs/ロール整理.xlsx` の `権限管理単位一覧` シート A列を正本とする。
- 1つの権限管理単位には、1つの `feature_code` または `column_code` を割り当てる。
- 2026-04-27 時点の採用件数は、A列由来のユニークな `feature_code` 46件、`column_code` 4件、シート外固定導線の `feature_code` 2件である。
- `資産一覧 / 管理部署編集` は `management_department_edit` として独立管理し、`資産カルテ / 原本編集` の `original_list_edit` には束ねない。
- `通常購入管理 / SHIP依頼機能` は `normal_ship_request` として独立管理し、購入管理タブ表示や見積依頼行利用を表す `normal_purchase` には束ねない。`config_scope='FACILITY_USER'` とし、施設提供設定とユーザー施設別設定の両方で利用可否を判定する。
- `貸出・返却 / 使用中 & 使用済み` は `lending_in_use_used` として独立管理し、貸出可能機器閲覧・貸出返却画面の入口を表す `lending_checkout` には束ねない。`config_scope='FACILITY_USER'` とし、施設提供設定とユーザー施設別設定の両方で管理する。ただし実効利用には `lending_checkout` も有効であることを必須とし、施設提供設定・ユーザー施設別設定のいずれでも `lending_checkout` OFF 時は `lending_in_use_used` を ON にできない。施設提供設定で ON から OFF にする場合は、`lending_devices.asset_ledger_id` から `asset_ledgers.facility_id` を参照して対象施設の貸出機器に限定し、現在状態または `returned_on IS NULL` の未返却履歴に `使用中` / `使用済` 状態が残っていないことを保存時に検証する。ユーザー施設別設定で OFF にする場合は、そのユーザーの利用可否だけを変更し、貸出データ自体は変更しない。
- 今後さらに細かい制御が必要になった場合は、A列の粒度を崩さずに新規 `feature_code` / `column_code` を追加して対応する。

## 13. このメモの位置づけ

- 本メモは fix に向けた基準メモであり、詳細なテーブル定義は `authz-table-proposal.md`、機能一覧のたたき台は `authz-feature-column-catalog-draft.md`、実装責務は `authz-frontend-backend-implementation-outline.md` にある。
- ただし、今後の議論・反映・設計修正は、まず本メモの前提と矛盾しないことを確認しながら進める。
