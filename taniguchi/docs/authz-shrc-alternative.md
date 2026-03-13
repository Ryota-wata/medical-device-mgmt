# SHRC認可 代替案メモ

本ファイルは、SHRCユーザーに施設単位の実効ロール管理が必要になった場合の未採用差分案メモである。  
現時点の正本は [機能要件.md](/C:/Projects/mock/medical-device-mgmt/taniguchi/機能要件.md) と [db-schema.puml](/C:/Projects/mock/medical-device-mgmt/taniguchi/db/db-schema.puml) とする。

## 位置づけ

- 病院ユーザーの認可モデルは変更しない。
- 契約管理は正本と同様に `facilities.system_contract_status` / `system_contract_ended_on` を利用する。
- 本代替案は、SHRCユーザーに対して「施設ごとに異なる機能権限」が必要と確定した場合のみ採用する。
- SHRCユーザーにロール権限を全施設へ一律適用してよい場合は、本代替案へ切り替えず、正本の ToDo を解消するだけでよい。

## 対象論点

- SHRCユーザーに対して、施設ごとに異なる機能権限を持たせる。
- 例:
  - 施設Aでは閲覧のみ
  - 施設Bでは購入申請可
  - 施設Cではアクセス不可

## 基本設計

- `roles` と `role_permissions` は正本と同じく継続利用する。
- SHRCユーザーの実効権限の正本は、ユーザー単位ではなく施設単位のロール割当で管理する。
- 病院ユーザーの他施設資産閲覧は引き続き `facility_asset_view_groups` / `facility_asset_view_group_members` で制御し、本代替案の対象外とする。

## 追加テーブル

### `user_facility_role_assignments`

- 目的: SHRCユーザーに対して、施設ごとの実効ロールを付与する。

| 項目 | 物理名 | 型 | 必須 | 備考 |
| --- | --- | --- | --- | --- |
| ユーザー施設ロール割当ID | user_facility_role_assignment_id | bigint | ○ | 内部キー |
| ユーザーID | user_id | bigint | ○ | `users.user_id` |
| 施設ID | facility_id | bigint | ○ | `facilities.facility_id` |
| ロールID | role_id | bigint | ○ | `roles.role_id` |
| 割当元種別 | assignment_source | varchar(20) | ○ | 例: `AUTO` / `MANUAL` |
| 有効フラグ | is_active | boolean | ○ | 失効管理 |
| 適用開始日時 | valid_from | timestamp | - | 適用開始 |
| 適用終了日時 | valid_to | timestamp | - | 適用終了 |
| 作成日時 | created_at | timestamp | ○ | 監査項目 |
| 更新日時 | updated_at | timestamp | ○ | 監査項目 |

- 制約:
  - `(user_id, facility_id)` に一意制約
  - `role_id` は `roles.role_id` を参照
- 付記:
  - SHRCユーザーに施設単位権限制御が必要な場合、本テーブルを実効権限の正本とする。
  - 全施設一律権限でよい SHRC ユーザーは、全対象施設へ同一 `role_id` を付与する運用、または別途一括割当機構で吸収する。

## 既存テーブルの役割変更

### `users.role_id`

- 正本から外す、または初期ロール/互換表示用途に縮小する。
- 認可判定の正本としては使わず、SHRCユーザーの実効権限は `user_facility_role_assignments` を参照する。

### `role_facility_scopes`

- SHRC の実効権限正本ではなく、施設候補制御または移行互換用途へ役割を縮小する可能性がある。
- 病院ユーザーの他施設資産閲覧には引き続き使わない。

### `user_accessible_facilities`

- 実効ロールの正本ではなく、施設候補管理や明示付与先の補助用途に限定する可能性がある。

## API影響

### `/auth/me`

- `allowedFacilities` の算出元が `roles.scope_type` / `role_facility_scopes` 中心から、`user_facility_role_assignments` 中心へ変わる可能性がある。

### `/authorization/check`

- `target_facility_id` に対する施設スコープ判定ロジックが変わる。
- SHRCユーザーは、対象施設に割り当てられた `role_id` の `role_permissions` を参照して判定する。

### 業務API

- `facilityId` のアクセス可否判定ロジックが変わる。
- 現有品調査系など、`role_facility_scopes` を前提に可視施設判定しているAPIは見直し対象となる。

### 施設選択画面

- SHRCユーザーの施設候補算出ロジックが変わる可能性がある。

## 切替時に確認すべきこと

- SHRCユーザーに対して、本当に施設ごとの機能差分が必要か。
- 「全施設一律権限」を特殊ケースとして同一モデルで吸収するか。
- 施設ごとのロール割当を管理UIで編集可能にするか。
- `role_facility_scopes` / `user_accessible_facilities` をどこまで残すか。

## 採用時の切替手順メモ

1. `user_facility_role_assignments` を追加する。
2. SHRCユーザーの実効権限の正本を施設単位割当へ切り替える。
3. `/auth/me`、`/authorization/check`、業務APIの `facilityId` 判定ロジックを更新する。
4. `users.role_id`、`role_facility_scopes`、`user_accessible_facilities` の役割を再整理する。
5. 必要に応じて、施設ごとのロール割当を設定する管理UIを追加する。

## 注意

- 本代替案は SHRCユーザーの施設単位権限制御が必要となった場合の案であり、現時点の正本ではない。
- 病院ユーザーの認可モデルは、本代替案でも変更しない。
