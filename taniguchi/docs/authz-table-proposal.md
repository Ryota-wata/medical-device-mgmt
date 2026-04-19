# 認証認可 テーブル案メモ（施設機能・ユーザー機能・他施設公開）

本メモは、[authz-feature-catalog-direction.md](/C:/Projects/mock/medical-device-mgmt/taniguchi/docs/authz-feature-catalog-direction.md) と [authz-feature-column-catalog-draft.md](/C:/Projects/mock/medical-device-mgmt/taniguchi/docs/authz-feature-column-catalog-draft.md) を受けて、認証認可再設計をテーブル案へ落とし込んだものである。  
ここでは、`feature_catalogs` / `column_catalogs` を基点に、施設単位設定、ユーザー単位設定、他施設公開設定までを物理テーブル案として整理する。

## 1. 採用案サマリ

### 継続利用するテーブル

- `users`
  - ログインID、パスワード、氏名、所属情報、アカウント状態、最終ログイン管理に継続利用する。
- `facilities`
  - 契約状態 (`system_contract_status`) を含め、施設正本として継続利用する。
- `user_remember_tokens`
  - rememberMe 用として継続利用する。
- `password_reset_tokens`
  - パスワードリセット用として継続利用する。

### 役割変更して継続利用するテーブル

- `facility_collaboration_groups`
  - 現行の `facility_asset_view_groups` を、設立母体非依存の「施設協業グループ」へ改称したうえで継続利用する。
- `facility_collaboration_group_facilities`
  - 現行の `facility_asset_view_group_members` を、グループ所属対象がユーザーではなく施設であることが分かる名称へ改称したうえで継続利用する。

### 認可正本から外すテーブル

- `roles`
- `role_permissions`
- `role_facility_scopes`
- `user_accessible_facilities`

### 新設するテーブル

- `feature_catalogs`
- `column_catalogs`
- `user_facility_assignments`
- `facility_feature_settings`
- `facility_column_settings`
- `user_facility_feature_settings`
- `user_facility_column_settings`
- `facility_external_view_settings`
- `facility_external_column_settings`

## 2. 認可モデルの考え方

### 2-1. 施設内利用

- 施設ごとに「その施設の所属・担当ユーザーへ提供する機能」を `facility_feature_settings` と `facility_column_settings` で管理する。
- ユーザーごとに「その施設で利用可能な機能・カラム」を `user_facility_feature_settings` と `user_facility_column_settings` で管理する。
- ユーザー設定は、施設設定を超えられない。

### 2-2. 他施設閲覧

- 閲覧者側は、作業対象施設に対して `other_*` 系の機能・カラムが有効でなければならない。
- さらに、閲覧元施設と閲覧先施設が同一の `facility_collaboration_groups` に属し、両施設とも契約中でなければならない。
- 閲覧先施設は、自施設データを外部施設ユーザーへ公開する設定を `facility_external_view_settings` と `facility_external_column_settings` で持つ。
- 他施設閲覧は、閲覧者側の権限と、閲覧先施設側の公開設定の両方を満たした場合のみ許可する。

### 2-3. SHRCユーザー

- SHRCユーザーは `user_facility_assignments` により担当施設を複数持てる。
- 各担当施設に対する利用機能は `user_facility_feature_settings` / `user_facility_column_settings` で個別に管理する。
- SHRC専用ロールや `scope_type` ベースの施設スコープ判定は採用しない。

### 2-4. UI表示制御と実処理認可は同じ正本で管理する

- ボタン表示、メニュー表示、画面遷移可否、実処理可否は、同じ `feature_code` / `column_code` を正本として判定する。
- `menu_group_code` は画面上のグルーピング用途であり、認可判定の正本にはしない。
- UI は有効な `feature_code` / `column_code` をもとに表示を絞り込む。
- ただし、ブラウザ上の DOM は利用者が変更できるため、最終的な security boundary はバックエンド側の認可判定とする。

## 3. カタログ系テーブル

### 3-1. `feature_catalogs`（機能カタログ）

- 目的:
  - 認可で扱う機能コードの正本を持つ。
  - 施設単位設定、ユーザー単位設定、他施設公開設定の参照元にする。

| 項目 | 物理名 | 型 | 必須 | 備考 |
| --- | --- | --- | --- | --- |
| 機能コード | feature_code | varchar(64) | ○ | PK。例: `user_management`, `qr_issue`, `other_asset_list` |
| 機能名 | feature_name | varchar(200) | ○ | 表示用名称 |
| 大分類コード | category_code | varchar(50) | ○ | 例: `USER_MGMT`, `AUTH`, `TASK`, `MASTER`, `DATA_VIEW` |
| メニューグループコード | menu_group_code | varchar(50) | - | 画面側の表示グループ整理用。DB上の別マスタは持たない |
| 機能種別 | feature_kind | varchar(30) | ○ | 例: `SCREEN`, `ACTION`, `DATA_VIEW`, `AUTH` |
| 利用文脈 | usage_context | varchar(20) | ○ | 値: `COMMON`, `OWN`, `EXTERNAL` |
| 設定スコープ | config_scope | varchar(20) | ○ | 値: `SYSTEM_FIXED`, `FACILITY_USER` |
| 表示順 | sort_order | int | ○ | 一覧表示順 |
| 有効フラグ | is_active | boolean | ○ | true=有効 |
| 作成日時 | created_at | timestamp | ○ |  |
| 更新日時 | updated_at | timestamp | ○ |  |

- 主な使い方:
  - `config_scope='SYSTEM_FIXED'` は認証前提機能やシステム共通機能で、施設・ユーザー設定テーブルへは持たない。
  - `config_scope='FACILITY_USER'` は施設・ユーザー設定の対象とする。
  - `usage_context='EXTERNAL'` は、他施設閲覧用の viewer 側機能コードとしても、閲覧先施設の公開設定コードとしても使う。

### 3-2. `column_catalogs`（カラムカタログ）

- 目的:
  - 認可で ON/OFF 制御したいカラム種別の正本を持つ。

| 項目 | 物理名 | 型 | 必須 | 備考 |
| --- | --- | --- | --- | --- |
| カラムコード | column_code | varchar(64) | ○ | PK。例: `original_price_column`, `own_price_column`, `other_price_column`, `ship_column` |
| カラム名 | column_name | varchar(200) | ○ | 表示用名称 |
| 関連機能コード | related_feature_code | varchar(64) | ○ | FK: `feature_catalogs.feature_code` |
| カラム分類コード | column_group_code | varchar(50) | ○ | 例: `PRICE`, `SHIP_ONLY` |
| 利用文脈 | usage_context | varchar(20) | ○ | 値: `OWN`, `EXTERNAL`, `COMMON` |
| 表示順 | sort_order | int | ○ | 一覧表示順 |
| 有効フラグ | is_active | boolean | ○ | true=有効 |
| 作成日時 | created_at | timestamp | ○ |  |
| 更新日時 | updated_at | timestamp | ○ |  |

- 付記:
  - `original_price_column`、`own_price_column`、`other_price_column` はクライアント整理が分かれているため、文脈別の別コードとして分離維持する。

## 4. ユーザー担当施設・施設設定・ユーザー設定

### 4-1. `user_facility_assignments`（ユーザー担当施設）

- 目的:
  - ユーザーが作業対象として持つ施設を表す。
  - SHRCユーザーの担当施設付与も本テーブルで扱う。

| 項目 | 物理名 | 型 | 必須 | 備考 |
| --- | --- | --- | --- | --- |
| ユーザー施設割当ID | user_facility_assignment_id | bigint | ○ | PK |
| ユーザーID | user_id | bigint | ○ | FK: `users.user_id` |
| 施設ID | facility_id | bigint | ○ | FK: `facilities.facility_id` |
| 割当種別 | assignment_type | varchar(20) | ○ | 値: `PRIMARY`, `SECONDARY` |
| 既定選択フラグ | is_default | boolean | ○ | 施設選択画面の初期候補制御用 |
| 有効フラグ | is_active | boolean | ○ | false=失効 |
| 適用開始日 | valid_from | date | - |  |
| 適用終了日 | valid_to | date | - |  |
| 作成者ユーザーID | created_by | bigint | ○ | FK: `users.user_id` |
| 更新者ユーザーID | updated_by | bigint | ○ | FK: `users.user_id` |
| 作成日時 | created_at | timestamp | ○ |  |
| 更新日時 | updated_at | timestamp | ○ |  |

- 制約:
  - `(user_id, facility_id)` に一意制約。
- 付記:
  - 本テーブルは「直接割り当てられた作業対象施設」のみを持つ。
  - 他施設閲覧グループ経由で見える施設は本テーブルへ展開しない。
  - 施設選択は本テーブルに登録された担当施設一覧からのみ行い、`facility_select_all` は認可機能として採用しない。
  - 病院ユーザーでは `users.facility_id` と `is_default=true` の担当施設を一致させる運用を前提とする。

### 4-2. `facility_feature_settings`（施設提供機能）

- 目的:
  - 施設が、その施設の所属・担当ユーザーへ提供する機能を ON/OFF 管理する。

| 項目 | 物理名 | 型 | 必須 | 備考 |
| --- | --- | --- | --- | --- |
| 施設機能設定ID | facility_feature_setting_id | bigint | ○ | PK |
| 施設ID | facility_id | bigint | ○ | FK: `facilities.facility_id` |
| 機能コード | feature_code | varchar(64) | ○ | FK: `feature_catalogs.feature_code` |
| 有効フラグ | is_enabled | boolean | ○ | true=施設で提供する |
| 作成者ユーザーID | created_by | bigint | ○ | FK: `users.user_id` |
| 更新者ユーザーID | updated_by | bigint | ○ | FK: `users.user_id` |
| 作成日時 | created_at | timestamp | ○ |  |
| 更新日時 | updated_at | timestamp | ○ |  |

- 制約:
  - `(facility_id, feature_code)` に一意制約。
- 付記:
  - `feature_catalogs.config_scope='FACILITY_USER'` のみ登録対象とする。
  - `other_*` 系機能も、閲覧者側施設に対する利用機能として本テーブルで管理する。

### 4-3. `facility_column_settings`（施設提供カラム）

- 目的:
  - 施設が、その施設の所属・担当ユーザーへ提供するカラム種別を ON/OFF 管理する。

| 項目 | 物理名 | 型 | 必須 | 備考 |
| --- | --- | --- | --- | --- |
| 施設カラム設定ID | facility_column_setting_id | bigint | ○ | PK |
| 施設ID | facility_id | bigint | ○ | FK: `facilities.facility_id` |
| カラムコード | column_code | varchar(64) | ○ | FK: `column_catalogs.column_code` |
| 有効フラグ | is_enabled | boolean | ○ | true=施設で提供する |
| 作成者ユーザーID | created_by | bigint | ○ | FK: `users.user_id` |
| 更新者ユーザーID | updated_by | bigint | ○ | FK: `users.user_id` |
| 作成日時 | created_at | timestamp | ○ |  |
| 更新日時 | updated_at | timestamp | ○ |  |

- 制約:
  - `(facility_id, column_code)` に一意制約。
- 付記:
  - `column_catalogs.related_feature_code` に対応する `facility_feature_settings` が `is_enabled=true` の場合のみ有効化できる。

### 4-4. `user_facility_feature_settings`（ユーザー施設別機能）

- 目的:
  - ユーザーが特定施設で利用できる機能を ON/OFF 管理する。

| 項目 | 物理名 | 型 | 必須 | 備考 |
| --- | --- | --- | --- | --- |
| ユーザー施設機能設定ID | user_facility_feature_setting_id | bigint | ○ | PK |
| ユーザー施設割当ID | user_facility_assignment_id | bigint | ○ | FK: `user_facility_assignments.user_facility_assignment_id` |
| 機能コード | feature_code | varchar(64) | ○ | FK: `feature_catalogs.feature_code` |
| 有効フラグ | is_enabled | boolean | ○ | true=当該ユーザーに許可 |
| 作成者ユーザーID | created_by | bigint | ○ | FK: `users.user_id` |
| 更新者ユーザーID | updated_by | bigint | ○ | FK: `users.user_id` |
| 作成日時 | created_at | timestamp | ○ |  |
| 更新日時 | updated_at | timestamp | ○ |  |

- 制約:
  - `(user_facility_assignment_id, feature_code)` に一意制約。
- 付記:
  - `facility_feature_settings` で `is_enabled=true` の機能のみ有効化できる。

### 4-5. `user_facility_column_settings`（ユーザー施設別カラム）

- 目的:
  - ユーザーが特定施設で表示できるカラム種別を ON/OFF 管理する。

| 項目 | 物理名 | 型 | 必須 | 備考 |
| --- | --- | --- | --- | --- |
| ユーザー施設カラム設定ID | user_facility_column_setting_id | bigint | ○ | PK |
| ユーザー施設割当ID | user_facility_assignment_id | bigint | ○ | FK: `user_facility_assignments.user_facility_assignment_id` |
| カラムコード | column_code | varchar(64) | ○ | FK: `column_catalogs.column_code` |
| 有効フラグ | is_enabled | boolean | ○ | true=当該ユーザーに表示許可 |
| 作成者ユーザーID | created_by | bigint | ○ | FK: `users.user_id` |
| 更新者ユーザーID | updated_by | bigint | ○ | FK: `users.user_id` |
| 作成日時 | created_at | timestamp | ○ |  |
| 更新日時 | updated_at | timestamp | ○ |  |

- 制約:
  - `(user_facility_assignment_id, column_code)` に一意制約。
- 付記:
  - `facility_column_settings` で `is_enabled=true` のカラムのみ有効化できる。
  - `column_catalogs.related_feature_code` に対応する `user_facility_feature_settings` が `is_enabled=true` の場合のみ有効化できる。

## 5. 他施設閲覧グループ・公開設定

### 5-1. `facility_collaboration_groups`（施設協業グループ）

- 現行の `facility_asset_view_groups` を改称して継続利用する。
- 役割:
  - 設立母体を問わず、相互に閲覧連携を行う施設グループを表す。

| 項目 | 物理名 | 型 | 必須 | 備考 |
| --- | --- | --- | --- | --- |
| 協業グループID | facility_collaboration_group_id | bigint | ○ | PK |
| グループ名 | group_name | varchar(100) | ○ | 管理用名称 |
| 有効フラグ | is_active | boolean | ○ | true=有効 |
| 作成者ユーザーID | created_by | bigint | ○ | FK: `users.user_id` |
| 更新者ユーザーID | updated_by | bigint | ○ | FK: `users.user_id` |
| 作成日時 | created_at | timestamp | ○ |  |
| 更新日時 | updated_at | timestamp | ○ |  |

### 5-2. `facility_collaboration_group_facilities`（施設協業グループ所属施設）

- 現行の `facility_asset_view_group_members` を改称して継続利用する。
- 本テーブルに所属するのはユーザーではなく施設である。

| 項目 | 物理名 | 型 | 必須 | 備考 |
| --- | --- | --- | --- | --- |
| 協業グループ所属施設ID | facility_collaboration_group_facility_id | bigint | ○ | PK |
| 協業グループID | facility_collaboration_group_id | bigint | ○ | FK: `facility_collaboration_groups.facility_collaboration_group_id` |
| 施設ID | facility_id | bigint | ○ | FK: `facilities.facility_id` |
| 作成者ユーザーID | created_by | bigint | ○ | FK: `users.user_id` |
| 更新者ユーザーID | updated_by | bigint | ○ | FK: `users.user_id` |
| 作成日時 | created_at | timestamp | ○ |  |
| 更新日時 | updated_at | timestamp | ○ |  |

- 制約:
  - `(facility_collaboration_group_id, facility_id)` に一意制約。

### 5-3. `facility_external_view_settings`（他施設向け公開データ設定）

- 目的:
  - 施設が、自施設のどのデータ種別を他施設ユーザーへ公開するかを ON/OFF 管理する。

| 項目 | 物理名 | 型 | 必須 | 備考 |
| --- | --- | --- | --- | --- |
| 他施設公開データ設定ID | facility_external_view_setting_id | bigint | ○ | PK |
| 公開元施設ID | provider_facility_id | bigint | ○ | FK: `facilities.facility_id` |
| 機能コード | feature_code | varchar(64) | ○ | FK: `feature_catalogs.feature_code`。`usage_context='EXTERNAL'` の `DATA_VIEW` 系を想定 |
| 有効フラグ | is_enabled | boolean | ○ | true=他施設へ公開する |
| 作成者ユーザーID | created_by | bigint | ○ | FK: `users.user_id` |
| 更新者ユーザーID | updated_by | bigint | ○ | FK: `users.user_id` |
| 作成日時 | created_at | timestamp | ○ |  |
| 更新日時 | updated_at | timestamp | ○ |  |

- 制約:
  - `(provider_facility_id, feature_code)` に一意制約。
- 付記:
  - 例: `other_asset_list`, `other_estimate`, `other_data_history`
  - 将来、グループごとに公開可否を変えたい場合は `facility_collaboration_group_id` を追加する。

### 5-4. `facility_external_column_settings`（他施設向け公開カラム設定）

- 目的:
  - 施設が、自施設データのどのカラム種別を他施設ユーザーへ公開するかを ON/OFF 管理する。

| 項目 | 物理名 | 型 | 必須 | 備考 |
| --- | --- | --- | --- | --- |
| 他施設公開カラム設定ID | facility_external_column_setting_id | bigint | ○ | PK |
| 公開元施設ID | provider_facility_id | bigint | ○ | FK: `facilities.facility_id` |
| カラムコード | column_code | varchar(64) | ○ | FK: `column_catalogs.column_code`。`usage_context='EXTERNAL'` を想定 |
| 有効フラグ | is_enabled | boolean | ○ | true=他施設へ公開する |
| 作成者ユーザーID | created_by | bigint | ○ | FK: `users.user_id` |
| 更新者ユーザーID | updated_by | bigint | ○ | FK: `users.user_id` |
| 作成日時 | created_at | timestamp | ○ |  |
| 更新日時 | updated_at | timestamp | ○ |  |

- 制約:
  - `(provider_facility_id, column_code)` に一意制約。
- 付記:
  - 例: `other_price_column`
  - `column_catalogs.related_feature_code` に対応する `facility_external_view_settings` が `is_enabled=true` の場合のみ有効化できる。

## 6. 既存テーブルの扱い

### 6-1. `users`

- 継続利用するカラム:
  - `user_id`
  - `email_address`
  - `password_hash`
  - `name`
  - `establishment_id`
  - `facility_id`
  - `department_name`
  - `section_name`
  - `position_name`
  - `contact_person_name`
  - `phone_number`
  - `is_active`
  - `locked_at`
  - `lock_reason`
  - `last_login_at`
  - `created_at`
  - `updated_at`
  - `deleted_at`
- 見直し対象:
  - `role_id`
    - 認可判定の正本としては廃止する。
    - 移行期間の互換用途が不要なら削除候補とする。
  - `account_type`
    - 表示分類、入力制御、一覧フィルタ用途で保持する。
    - 認可判定には使わない。
- `facility_id` の扱い:
  - 病院ユーザーの主所属施設として継続利用する。
  - SHRCユーザーなど複数担当施設を持つユーザーでは NULL 許容または「既定所属」のみに用途を縮小し、実際の作業対象施設は `user_facility_assignments` を正本とする。
  - 病院ユーザーでは `users.facility_id` と `user_facility_assignments.is_default=true` の施設を一致させる。

### 6-2. `roles` / `role_permissions` / `role_facility_scopes`

- 認可正本から外す。
- 移行期間に旧画面・旧 API の互換が不要であれば削除候補とする。
- 互換期間を設ける場合でも、新設する施設機能・ユーザー機能・他施設公開設定を正本とし、旧テーブルは参照専用または移行用に限定する。

### 6-3. `user_accessible_facilities`

- 現行の意味は「閲覧可能施設」だが、新方針では以下 2 つに分解する。
  - 直接割り当てられた担当施設: `user_facility_assignments`
  - 任意グループ経由の他施設閲覧: `facility_collaboration_groups` + 公開設定
- そのため本テーブルは置換対象とする。

## 7. 判定フロー例

### 7-1. 自施設の資産原本リストを見る場合

前提:

- ユーザーが施設Aを作業対象施設として選択している
- 見たい機能は `own_asset_list`

判定:

1. `user_facility_assignments` に `(user_id, facilityA, is_active=true)` が存在する。
2. `facility_feature_settings` の `(facilityA, own_asset_list)` が `is_enabled=true` である。
3. `user_facility_feature_settings` の `(assignment_id, own_asset_list)` が `is_enabled=true` である。
4. 価格カラムを見る場合は、さらに
   - `facility_column_settings` の `(facilityA, own_price_column)` が `is_enabled=true`
   - `user_facility_column_settings` の `(assignment_id, own_price_column)` が `is_enabled=true`

### 7-2. 他施設の資産原本リストを見る場合

前提:

- ユーザーが施設Aを作業対象施設として選択している
- 見たい対象は施設Bの資産原本リスト
- 見たい機能は `other_asset_list`

判定:

1. `user_facility_assignments` に `(user_id, facilityA, is_active=true)` が存在する。
2. `facility_feature_settings` の `(facilityA, other_asset_list)` が `is_enabled=true` である。
3. `user_facility_feature_settings` の `(assignment_id, other_asset_list)` が `is_enabled=true` である。
4. `facilities` の `facilityA.system_contract_status='ACTIVE'` かつ `facilityB.system_contract_status='ACTIVE'` である。
5. `facility_collaboration_groups` / `facility_collaboration_group_facilities` 上で、施設Aと施設Bが同一有効グループに所属している。
6. `facility_external_view_settings` の `(facilityB, other_asset_list)` が `is_enabled=true` である。
7. 価格カラムを見る場合は、さらに
   - 閲覧者側: `facility_column_settings(facilityA, other_price_column)` と `user_facility_column_settings(assignment_id, other_price_column)` が `true`
   - 公開元側: `facility_external_column_settings(facilityB, other_price_column)` が `true`

## 8. APIへの影響

### `GET /auth/me`

- 返却の主語を `role` / `permissions` から以下へ変更する。
  - `user`
  - `assignedFacilities`
  - `defaultFacilityId`
  - `accountType`
- `allowedFacilities` は `user_facility_assignments` 由来の担当施設一覧へ置き換える。
- `facilityFeatures` と `facilityColumns` は `GET /auth/context` で返却する。
- 他施設閲覧グループ経由で見える施設は、`allowedFacilities` へ直接展開せず、業務APIまたは別コンテキスト情報で解決する。

### `GET /auth/context`

- 施設選択後の画面表示制御用に、`actingFacilityId` を受けて実効機能・実効カラムを一括返却する API を用意する。
- フロントエンドはこのレスポンスを使ってメニュー、ボタン、画面内導線、列表示を制御する。
- 一方で、業務APIは `GET /auth/context` の結果を信用して省略せず、毎回サーバー側で再判定する。

### `POST /authorization/check`

- 判定元を `role_permissions` から以下へ変更する。
  - `user_facility_assignments`
  - `facility_feature_settings`
  - `user_facility_feature_settings`
  - 必要に応じて `facility_column_settings` / `user_facility_column_settings`
  - 他施設閲覧時は `facility_collaboration_groups` / `facility_collaboration_group_facilities` / `facility_external_view_settings` / `facility_external_column_settings`

## 9. 実装・運用上の補足

### 9-1. 表示制御の実装方針

- メニューやボタンの表示可否は、UI専用の別マトリクスではなく、同じ `feature_code` / `column_code` から導出する。
- 画面側では `can(feature_code)` / `canColumn(column_code)` のようなヘルパーで表示制御を行う。
- 「機能を使えないならボタン自体を表示しない」を基本とするが、DOM 改変でボタンが見えても業務APIが 403 を返す前提で設計する。

### 9-2. 監査・変更履歴の方針

- 権限設定は運用中の問い合わせ対象になりやすいため、設定系テーブルには `created_at` / `updated_at` に加えて `created_by` / `updated_by` を持つ前提で設計する。
- 対象は少なくとも以下とする。
  - `user_facility_assignments`
  - `facility_feature_settings`
  - `facility_column_settings`
  - `user_facility_feature_settings`
  - `user_facility_column_settings`
  - `facility_collaboration_groups`
  - `facility_collaboration_group_facilities`
  - `facility_external_view_settings`
  - `facility_external_column_settings`
- さらに、必要に応じて設定変更履歴を別テーブルまたは監査ログで保持し、「誰が」「いつ」「何を」「どう変更したか」を追えるようにする。

### 9-3. パフォーマンスと認可境界の方針

- 画面表示のたびに機能単位・列単位で個別判定 API を多数呼ばないよう、施設選択後に `GET /auth/context` で必要情報を一括返却する。
- 一方で、`GET /auth/context` は UX 用キャッシュであり、業務APIの認可判定を代替しない。
- すべての業務APIは `user_id`、`actingFacilityId`、必要に応じて `targetFacilityId`、`feature_code` / `column_code` をもとにサーバー側で再判定する。

### 9-4. DB制約と更新API制約の分担

- DBで担保する内容:
  - 一意制約
    - `user_facility_assignments(user_id, facility_id)`
    - `facility_feature_settings(facility_id, feature_code)`
    - `facility_column_settings(facility_id, column_code)`
    - `user_facility_feature_settings(user_facility_assignment_id, feature_code)`
    - `user_facility_column_settings(user_facility_assignment_id, column_code)`
    - `facility_collaboration_group_facilities(facility_collaboration_group_id, facility_id)`
    - `facility_external_view_settings(provider_facility_id, feature_code)`
    - `facility_external_column_settings(provider_facility_id, column_code)`
  - FK制約
    - `facility_id`、`provider_facility_id`、`feature_code`、`column_code`、`user_facility_assignment_id` は必ず親テーブルに存在する
  - CHECK制約
    - `valid_to >= valid_from`
    - `assignment_type`、`usage_context`、`config_scope` は許可値のみ
  - 部分一意制約
    - 有効な担当施設のうち `is_default=true` は 1 ユーザーにつき 1 件まで
- 更新APIで担保する内容:
  - `user_facility_feature_settings` は `facility_feature_settings.is_enabled=true` の機能のみ ON にできる
  - `user_facility_column_settings` は `facility_column_settings.is_enabled=true` かつ `column_catalogs.related_feature_code` に対応する `user_facility_feature_settings.is_enabled=true` のカラムのみ ON にできる
  - `facility_feature_settings` には `feature_catalogs.config_scope='FACILITY_USER'` の機能のみ登録できる
  - `facility_column_settings` は `column_catalogs.related_feature_code` に対応する `facility_feature_settings.is_enabled=true` の場合のみ ON にできる
  - `facility_external_view_settings` には `usage_context='EXTERNAL'` の機能のみ登録できる
  - `facility_external_column_settings` には `usage_context='EXTERNAL'` かつ `column_catalogs.related_feature_code` に対応する `facility_external_view_settings.is_enabled=true` のカラムのみ登録できる
  - 病院ユーザーの `users.facility_id` 更新時は、対応する `user_facility_assignments` の既定担当施設も同時に同期する

### 9-5. 他施設公開設定の粒度

- 現時点では、他施設公開設定は `provider_facility_id` 単位で管理する案を採用する。
- つまり、公開元施設が「他施設へ何を見せるか」を施設単位で持ち、協業グループごとの差分は持たない。
- 将来、協業グループごとに公開範囲を変える必要が出た場合は、`facility_external_view_settings` / `facility_external_column_settings` に `facility_collaboration_group_id` を追加する拡張で対応する。

## 10. 未確定事項

- `inventory_office`、`inspection_management`、`lending_management` などに含まれる出力機能を独立した feature に分割するか。
- `remodel_edit_list` と `normal_edit_list` に含まれる `申請登録` `見積G` `分析作業` を独立した feature に分割するか。
- `ON/OFF` のみで足りるか、`出力` `登録` `更新` などを別 feature に分けるか。

## 11. 次の反映先

- [機能要件.md](/C:/Projects/mock/medical-device-mgmt/taniguchi/機能要件.md)
  - 認証認可の ToDo、ユーザー管理、施設選択、ホーム表示制御、他施設閲覧の説明を本テーブル案へ合わせて修正する。
- [db-schema.puml](/C:/Projects/mock/medical-device-mgmt/taniguchi/db/db-schema.puml)
  - 上記の新設テーブルと既存テーブルの役割変更を反映する。
- [API設計書_認証／認可.docx](/C:/Projects/mock/medical-device-mgmt/taniguchi/api/Fix/API設計書_認証／認可.docx)
  - `/auth/me` と `/authorization/check` のレスポンス・判定仕様を書き換える。
