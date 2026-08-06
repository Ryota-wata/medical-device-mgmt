# 施設グループ管理 API内部設計

## 第1章 概要

### 本書の目的

本書は、施設グループ管理画面（`/facility-group-management`）で利用する API の設計内容を整理し、共有システム管理者アカウントが施設グループ、所属施設、他施設向け公開設定を管理するための実装基準を明確にすることを目的とする。

本API群は SHIP施設マスタ API から分離し、施設基本情報管理ではなく、他施設閲覧候補範囲と公開元施設の公開設定を扱う。

特に以下を明確にする。

- 施設グループの一覧取得・作成・更新・無効化 I/F
- グループ所属施設の候補取得・追加・解除 I/F
- 公開元施設単位の他施設向け公開データ・公開カラム設定 I/F
- 資産一覧・資産詳細の他施設閲覧における協業グループと公開設定の責務
- 権限・バリデーション・エラーレスポンス

### 対象システム概要

施設グループ管理は、メイン画面のマスタ管理モーダルから遷移する独立画面である。共有システム管理者アカウントが任意の施設グループを作成し、グループに所属する施設を管理する。

施設グループは他施設閲覧の候補範囲を定義する。実際に閲覧できるかどうかは、閲覧者側施設の実効権限、有効な施設グループ所属、公開元施設の公開設定、施設の契約状態を組み合わせて業務 API 側で判定する。

### 用語定義

| 用語 | 説明 |
| --- | --- |
| 施設グループ管理 | 任意の施設グループ、所属施設、他施設向け公開設定を管理する画面および API 群 |
| 施設協業グループ | 他施設閲覧候補範囲を表す `facility_collaboration_groups` の業務概念 |
| 所属施設 | 施設協業グループに所属する施設。`facility_collaboration_group_facilities` で管理する |
| 公開元施設 | 他施設へデータを公開する側の施設。`facility_external_view_settings.provider_facility_id` / `facility_external_column_settings.provider_facility_id` で管理する |
| 共有データ種別 | 施設グループ管理画面で扱う公開対象分類。`asset`、`estimate`、`history` を扱う |
| 他施設向け公開データ設定 | 公開元施設が他施設へ公開するデータ種別。`asset` / `estimate` / `history` の共有データ種別として `facility_external_view_settings` で管理する |
| 他施設向け公開カラム設定 | 公開元施設が他施設へ公開するカラム。`facility_external_column_settings` で管理する |
| 資産データ共有 | 資産一覧・資産詳細の他施設閲覧で利用する公開データ種別。`sharing_data_type='asset'` を正本とする |
| 価格カラム共有 | 資産一覧・資産詳細の他施設閲覧で価格系項目を公開する設定。`column_code='original_price_column'` を正本とする |

### 対象画面

| 項目 | 内容 |
| --- | --- |
| 画面名 | 66. 施設グループ管理画面 |
| 画面URL | /facility-group-management |
| 主機能 | 施設グループ一覧、グループ作成、グループ名更新、グループ無効化、所属施設追加・解除、共有データ種別設定 |

## 第2章 システム全体構成

### APIの位置づけ

本API群は、施設グループ管理画面の初期表示、施設グループ管理、所属施設管理、共有データ種別設定を提供する。

施設グループは `facility_collaboration_groups` と `facility_collaboration_group_facilities` で管理し、公開元施設単位の公開設定は `facility_external_view_settings` と `facility_external_column_settings` で管理する。

資産一覧・資産詳細の他施設閲覧 API は、本書で保存する施設グループと公開設定を参照して閲覧可否を再判定する。本API群自体は資産データを返却しない。

### 画面とAPIの関係

| 画面操作 | API | 補足 |
| --- | --- | --- |
| 画面初期表示 | GET /facility-group-management/groups | 施設グループ一覧、所属施設、公開設定を取得する |
| 新規グループ追加 | POST /facility-group-management/groups | 入力されたグループ名で有効な施設グループを作成する |
| グループ名保存 | PUT /facility-group-management/groups/{groupId} | グループ名および有効状態を更新する |
| グループ削除 | DELETE /facility-group-management/groups/{groupId} | 施設グループを `is_active=false` に更新する |
| 施設検索 | GET /facility-group-management/facilities | 所属施設に追加可能な施設候補を検索する |
| 所属施設追加 | POST /facility-group-management/groups/{groupId}/facilities | 対象グループへ施設を追加する |
| 所属施設解除 | DELETE /facility-group-management/groups/{groupId}/facilities/{facilityId} | 対象グループから施設を解除する |
| 共有データ種別保存 | PUT /facility-group-management/groups/{groupId}/sharing | 対象グループの所属施設を公開元施設として公開データ・公開カラム設定を保存する |

### 使用テーブル

| テーブル | 利用種別 | 用途 |
| --- | --- | --- |
| users | READ | 認証ユーザーが共有システム管理者アカウント（`account_type='SYSTEM_ADMIN'`）であることの確認 |
| facilities | READ | Bearer トークン上の作業対象施設、所属施設候補、所属施設名、契約状態、論理削除状態の確認 |
| establishments | READ | 施設候補および所属施設の設立母体名の取得 |
| column_catalogs | READ | 他施設向け公開カラム設定で利用する column_code と関連する共有データ種別の確認 |
| facility_collaboration_groups | READ / CREATE / UPDATE | 施設グループ一覧、グループ作成、グループ名更新、有効状態更新 |
| facility_collaboration_group_facilities | READ / CREATE / DELETE | グループ所属施設の取得、追加、解除 |
| facility_external_view_settings | READ / CREATE / UPDATE | 公開元施設単位の公開データ種別設定の取得・保存 |
| facility_external_column_settings | READ / CREATE / UPDATE | 公開元施設単位の公開カラム設定の取得・保存 |

## 第3章 共通仕様

### API共通仕様

- 通信方式: HTTPS
- データ形式: JSON
- 文字コード: UTF-8
- 日時形式: ISO 8601（例: `2026-05-17T00:00:00Z`）
- 論理削除済み施設（`facilities.deleted_at IS NOT NULL`）は施設候補、所属施設追加、公開元施設設定の対象外とする
- 他施設閲覧判定では、閲覧者側施設と公開元施設の双方が `deleted_at IS NULL` かつ `system_contract_status='ACTIVE'` であることを業務 API 側で再判定する
- 施設グループ削除は物理削除ではなく `facility_collaboration_groups.is_active=false` の論理無効化とする
- 所属施設解除は `facility_collaboration_group_facilities` の所属行を削除する
- 保存・更新系 API は1リクエストを1トランザクションで処理し、一部だけ保存された状態を残さない
- 作成者・更新者は Bearer トークンの認証ユーザーIDを `created_by` / `updated_by` へ設定する
- 本API群は共有システム管理者アカウント専用の特権操作として扱い、通常アカウント向けの施設割当・部署/役職別の機能割当は参照しない
- Bearer トークン上の作業対象施設が `facilities.deleted_at IS NULL` で存在することを全API共通で確認し、存在しない、または削除済みの場合は 404 を返却する

### 認証方式

ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。

### 権限モデル

本API群は共有システム管理者アカウント専用の特権操作として扱う。API 実行時は Bearer トークンが有効であること、認証コンテキストが共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）であること、および Bearer トークン上の作業対象施設が存在し未削除であることを確認する。通常アカウント向けの施設割当や部署/役職別の機能割当、作業対象施設に対する実効 `feature_code` 判定は行わない。

| 管理単位名 | 管理ラベル | 対象処理 |
| --- | --- | --- |
| 施設グループ / 一覧 | `facility_group_list`（画面・権限整理上の分類。API実行時の実効判定には使用しない） | 施設グループ一覧取得、施設候補取得 |
| 施設グループ / 新規作成・編集 | `facility_group_edit`（画面・権限整理上の分類。API実行時の実効判定には使用しない） | 施設グループ作成、更新、無効化、所属施設追加・解除、共有設定保存 |

| 処理 | 必要条件 | 判定基準 | 説明 |
| --- | --- | --- | --- |
| 施設グループ一覧取得 / 施設候補取得 | 共有システム管理者 | 認証コンテキストが共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）であり、Bearer トークン上の作業対象施設が存在し未削除であること | 参照系の処理 |
| 施設グループ作成 / 更新 / 無効化 | 共有システム管理者 | 認証コンテキストが共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）であり、Bearer トークン上の作業対象施設が存在し未削除であること | グループ本体の変更処理 |
| 所属施設追加 / 解除 / 共有設定保存 | 共有システム管理者 | 認証コンテキストが共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）であり、Bearer トークン上の作業対象施設が存在し未削除であること | グループ詳細の変更処理 |

### 他施設閲覧判定との関係

- 本API群は他施設閲覧の候補範囲と公開元施設の公開設定を保存する
- 資産一覧・資産詳細の他施設閲覧は、閲覧者側施設で `original_list_view` が実効有効、閲覧者側施設と公開元施設が同一の有効な施設グループに所属、公開元施設の `facility_external_view_settings(sharing_data_type='asset')` が有効である場合のみ許可する
- 価格系項目は、閲覧者側施設で `original_price_column` が実効有効であり、公開元施設の `facility_external_column_settings(column_code='original_price_column')` が有効である場合のみ返却する
- 他施設閲覧は施設切替候補へ展開しない

### 共有データ種別の扱い

| sharingDataType | 表示名 | 保存先 | sharing_data_type | 資産一覧・資産詳細への影響 |
| --- | --- | --- | --- | --- |
| asset | 資産データ | `facility_external_view_settings` | `asset` | 他施設閲覧可否の判定に使用する |
| estimate | 見積データ | `facility_external_view_settings` | `estimate` | 設定値の保存・返却のみ行い、資産一覧・資産詳細の他施設閲覧判定には使用しない |
| history | データ履歴 | `facility_external_view_settings` | `history` | 設定値の保存・返却のみ行い、資産一覧・資産詳細の他施設閲覧判定には使用しない |

`asset` / `estimate` / `history` は施設グループ管理の共有データ種別コードであり、認可用 `feature_code` ではない。`estimate` / `history` は現行Phaseでは設定値の保持を目的に保存し、見積系APIや履歴系APIの他施設閲覧可否を成立させるものではなく、資産一覧・資産詳細の他施設閲覧判定にも使用しない。

### エラーレスポンス仕様

#### 基本エラーレスポンス（ErrorResponse）

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| code | string | ✓ | エラーコード |
| message | string | ✓ | 利用者向けエラーメッセージ |
| details | string[] | - | 入力エラーや補足情報 |

### 共通レスポンスDTO

#### FacilityGroupSummary

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| groupId | int64 | ✓ | `facility_collaboration_groups.facility_collaboration_group_id` |
| groupName | string | ✓ | グループ名 |
| isActive | boolean | ✓ | 有効フラグ |
| memberFacilityCount | int32 | ✓ | 所属施設数 |
| memberFacilities | GroupFacilityItem[] | ✓ | 所属施設一覧 |
| sharingSettings | ExternalSharingSettingItem[] | ✓ | 公開元施設単位の公開設定 |
| createdAt | datetime | ✓ | 作成日時 |
| updatedAt | datetime | ✓ | 更新日時 |

#### GroupFacilityItem

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| facilityId | int64 | ✓ | `facilities.facility_id` |
| facilityCode | string | - | 施設コード |
| facilityName | string | ✓ | 施設名 |
| establishmentName | string | - | 設立母体名 |
| systemContractStatus | string | ✓ | `ACTIVE` または `CANCELLED` |

#### ExternalSharingSettingItem

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| providerFacilityId | int64 | ✓ | 公開元施設ID |
| sharingDataType | string | ✓ | `asset`、`estimate`、`history` |
| sharingDataTypeLabel | string | ✓ | 画面表示名。資産データ、見積データ、データ履歴 |
| isEnabled | boolean | ✓ | 公開データ種別を有効にするかどうか |
| columnSettings | ExternalColumnSharingSettingItem[] | ✓ | 公開カラム設定 |

#### ExternalColumnSharingSettingItem

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| columnCode | string | ✓ | 公開カラムを表す column_code。価格カラムは `original_price_column` |
| columnName | string | - | 公開カラム名 |
| requiredSharingDataType | string | ✓ | 当該カラムを公開するために有効化が必要な共有データ種別。価格カラムは `asset` |
| isEnabled | boolean | ✓ | 公開カラムを有効にするかどうか |

## 第4章 API一覧

### 施設グループ管理（/facility-group-management）

| 機能名 | Method | Path | 概要 | 認証 |
| --- | --- | --- | --- | --- |
| 施設グループ一覧取得 | GET | /facility-group-management/groups | 施設グループ一覧、所属施設、共有設定を取得する | 要 |
| 施設グループ新規作成 | POST | /facility-group-management/groups | 施設グループを新規作成する | 要 |
| 施設グループ更新 | PUT | /facility-group-management/groups/{groupId} | 施設グループ名と有効状態を更新する | 要 |
| 施設グループ無効化 | DELETE | /facility-group-management/groups/{groupId} | 施設グループを無効化する | 要 |
| 施設候補取得 | GET | /facility-group-management/facilities | グループへ追加可能な施設候補を検索取得する | 要 |
| 所属施設追加 | POST | /facility-group-management/groups/{groupId}/facilities | 施設グループへ施設を追加する | 要 |
| 所属施設解除 | DELETE | /facility-group-management/groups/{groupId}/facilities/{facilityId} | 施設グループから施設を解除する | 要 |
| 共有データ種別設定保存 | PUT | /facility-group-management/groups/{groupId}/sharing | 公開元施設単位の共有データ種別・共有カラム設定を保存する | 要 |

## 第5章 施設グループ管理機能設計

### getFacilityGroupManagementGroups

#### 権限

- 認可条件: Bearer トークンが有効であること
- 認可条件: 認証コンテキストが共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）であること
- 認可条件: Bearer トークン上の作業対象施設が存在し、未削除であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が `facilities.deleted_at IS NULL` で存在することを確認する
2. `facility_collaboration_groups` を取得する。`includeInactive` が false または未指定の場合は `is_active=true` のみ対象とする
3. keyword が指定された場合は `group_name` の部分一致で絞り込む
4. `facility_collaboration_group_facilities`、`facilities`、`establishments` を結合し、`facilities.deleted_at IS NULL` の所属施設を返却する
5. `facility_external_view_settings` / `facility_external_column_settings` を公開元施設単位で取得し、所属施設ごとの共有設定として返却する。設定行が存在しない共有データ種別およびカラムは `isEnabled=false` とする
6. 並び順は `facility_collaboration_groups.updated_at DESC, facility_collaboration_group_id ASC`、所属施設は `facilities.facility_name ASC, facility_id ASC` とする

### postFacilityGroupManagementGroups

#### 権限

- 認可条件: Bearer トークンが有効であること
- 認可条件: 認証コンテキストが共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）であること
- 認可条件: Bearer トークン上の作業対象施設が存在し、未削除であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が `facilities.deleted_at IS NULL` で存在することを確認する
2. groupName は trim 後に空でないこと、100文字以内であることを検証する
3. 同一名称の有効グループ（`facility_collaboration_groups.is_active=true`）が存在しないことを確認する
4. `facility_collaboration_groups` に `group_name`、`is_active=true`、`created_by`、`updated_by` を登録する
5. 作成直後のグループを FacilityGroupSummary 形式で返却する

### putFacilityGroupManagementGroupsByGroupId

#### 権限

- 認可条件: Bearer トークンが有効であること
- 認可条件: 認証コンテキストが共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）であること
- 認可条件: Bearer トークン上の作業対象施設が存在し、未削除であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が `facilities.deleted_at IS NULL` で存在することを確認する
2. 対象グループが存在することを確認する
3. groupName 指定時は trim 後に空でないこと、100文字以内であることを検証する
4. groupName 指定時は、自身以外に同一名称の有効グループが存在しないことを確認する
5. `facility_collaboration_groups.group_name`、`is_active`、`updated_by`、`updated_at` を更新する
6. 更新後のグループを FacilityGroupSummary 形式で返却する

### deleteFacilityGroupManagementGroupsByGroupId

#### 権限

- 認可条件: Bearer トークンが有効であること
- 認可条件: 認証コンテキストが共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）であること
- 認可条件: Bearer トークン上の作業対象施設が存在し、未削除であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が `facilities.deleted_at IS NULL` で存在することを確認する
2. 対象グループが存在し、`is_active=true` であることを確認する
3. `facility_collaboration_groups.is_active=false`、`updated_by`、`updated_at` を更新する
4. `facility_collaboration_group_facilities` は削除しない
5. `facility_external_view_settings` / `facility_external_column_settings` は削除しない
6. 無効化済みグループは他施設閲覧判定の候補範囲から除外する

### getFacilityGroupManagementFacilities

#### 権限

- 認可条件: Bearer トークンが有効であること
- 認可条件: 認証コンテキストが共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）であること
- 認可条件: Bearer トークン上の作業対象施設が存在し、未削除であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が `facilities.deleted_at IS NULL` で存在することを確認する
2. `facilities.deleted_at IS NULL` の施設を候補とし、`establishments` を結合して設立母体名を返却する
3. keyword が指定された場合は施設コード、施設名、設立母体名の部分一致で絞り込む
4. groupId 指定時は対象グループが存在することを確認し、既に `facility_collaboration_group_facilities` に所属している施設を除外する
5. 並び順は `facilities.facility_name ASC, facilities.facility_id ASC` とする
6. limit は 1 以上 100 以下とし、未指定時は 50 とする

### postFacilityGroupManagementGroupsByGroupIdFacilities

#### 権限

- 認可条件: Bearer トークンが有効であること
- 認可条件: 認証コンテキストが共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）であること
- 認可条件: Bearer トークン上の作業対象施設が存在し、未削除であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が `facilities.deleted_at IS NULL` で存在することを確認する
2. 対象グループが存在し、`is_active=true` であることを確認する
3. 追加対象施設が `facilities.deleted_at IS NULL` で存在することを確認する
4. 同一グループ内に同一施設が未登録であることを確認する
5. `facility_collaboration_group_facilities` に `facility_collaboration_group_id`、`facility_id`、`created_by`、`updated_by` を登録する
6. 追加後のグループを FacilityGroupSummary 形式で返却する

### deleteFacilityGroupManagementGroupsByGroupIdFacilitiesByFacilityId

#### 権限

- 認可条件: Bearer トークンが有効であること
- 認可条件: 認証コンテキストが共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）であること
- 認可条件: Bearer トークン上の作業対象施設が存在し、未削除であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が `facilities.deleted_at IS NULL` で存在することを確認する
2. 対象グループが存在し、`is_active=true` であることを確認する
3. 対象施設が当該グループに所属していることを確認する
4. `facility_collaboration_group_facilities` の該当所属行を削除する
5. 公開元施設単位の `facility_external_view_settings` / `facility_external_column_settings` は削除しない
6. 解除後は当該グループ経由の他施設閲覧候補から対象施設を除外する

### putFacilityGroupManagementGroupsByGroupIdSharing

#### 権限

- 認可条件: Bearer トークンが有効であること
- 認可条件: 認証コンテキストが共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）であること
- 認可条件: Bearer トークン上の作業対象施設が存在し、未削除であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が `facilities.deleted_at IS NULL` で存在することを確認する
2. 対象グループが存在し、`is_active=true` であることを確認する
3. providerFacilityIds 未指定時は対象グループの全所属施設を公開元施設として扱う
4. providerFacilityIds 指定時は、すべての施設が対象グループに所属し、`facilities.deleted_at IS NULL` であることを確認する
5. sharingSettings[].sharingDataType は `asset`、`estimate`、`history` のいずれかであることを確認する
6. columnSettings[].columnCode は `column_catalogs` に存在する有効な column_code であることを確認する。価格カラム共有は `original_price_column` を使用する
7. columnSettings[].columnCode に対応する共有データ種別が同一リクエストで `isEnabled=true`、または保存済み `facility_external_view_settings.is_enabled=true` である場合のみ、当該 columnCode を `isEnabled=true` にできる。現行Phaseでは `original_price_column` は `asset` の有効化を必須とする
8. 対象公開元施設ごとに `facility_external_view_settings(provider_facility_id, sharing_data_type)` を UPSERT する
9. 対象公開元施設ごとに `facility_external_column_settings(provider_facility_id, column_code)` を UPSERT する
10. 保存後のグループを FacilityGroupSummary 形式で返却する

## 第6章 権限・業務ルール

### 必要権限

| 処理 | 必要条件 | 判定基準 | 説明 |
| --- | --- | --- | --- |
| 施設グループ一覧取得 | 共有システム管理者 | 認証コンテキストが共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）であり、Bearer トークン上の作業対象施設が存在し未削除であること | 施設グループ一覧と所属施設を参照する |
| 施設候補取得 | 共有システム管理者 | 認証コンテキストが共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）であり、Bearer トークン上の作業対象施設が存在し未削除であること | 追加候補施設を参照する |
| 施設グループ作成 / 更新 / 無効化 | 共有システム管理者 | 認証コンテキストが共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）であり、Bearer トークン上の作業対象施設が存在し未削除であること | 施設グループ本体を管理する |
| 所属施設追加 / 解除 | 共有システム管理者 | 認証コンテキストが共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）であり、Bearer トークン上の作業対象施設が存在し未削除であること | グループ所属施設を管理する |
| 共有データ種別設定保存 | 共有システム管理者 | 認証コンテキストが共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）であり、Bearer トークン上の作業対象施設が存在し未削除であること | 公開元施設単位の公開設定を管理する |

### 施設グループ管理ルール

- 有効グループ内で同一 `group_name` は重複不可とする
- グループ無効化は `facility_collaboration_groups.is_active=false` とし、所属施設行と公開設定行は削除しない
- 無効化済みグループは他施設閲覧判定の候補範囲から除外する
- 同一グループ内に同一施設を重複登録できない
- 所属施設解除は中間テーブル行の削除とし、公開元施設単位の公開設定は保持する

### 共有設定ルール

- 資産データ共有は `facility_external_view_settings(provider_facility_id, sharing_data_type='asset')` を正本とする
- 見積データ共有は `facility_external_view_settings(provider_facility_id, sharing_data_type='estimate')` に設定値を保持する
- データ履歴共有は `facility_external_view_settings(provider_facility_id, sharing_data_type='history')` に設定値を保持する
- 価格カラム共有は `facility_external_column_settings(provider_facility_id, column_code='original_price_column')` を正本とする
- 共有データ種別は `asset`、`estimate`、`history` を返却単位とする
- 設定行が存在しない共有データ種別およびカラムは無効状態として扱い、一覧取得レスポンスでは `isEnabled=false` を返却する
- 公開カラムを ON にする場合は、当該カラムに対応する共有データ種別が ON であることを必須とする。現行Phaseでは `original_price_column` は `asset` が ON の場合のみ ON にできる
- 公開設定は施設グループIDを保持せず、公開元施設単位で保存する
- 複数グループに所属する施設は、同じ公開元施設設定を共有する

### 他施設閲覧成立条件

- 閲覧者側施設で `original_list_view` が実効有効であること
- 閲覧者側施設と公開元施設が、同一の有効な施設グループに所属していること
- 閲覧者側施設と公開元施設の双方が `deleted_at IS NULL` かつ `system_contract_status='ACTIVE'` であること
- 公開元施設で `facility_external_view_settings(sharing_data_type='asset')` が有効であること
- 価格系項目は、閲覧者側施設で `original_price_column` が実効有効であり、公開元施設で `facility_external_column_settings(column_code='original_price_column')` が有効である場合のみ返却する

## 第7章 エラーコード一覧

| エラーコード | HTTP | 説明 |
| --- | --- | --- |
| VALIDATION_ERROR | 400 | 入力不正、必須不足、形式不正 |
| UNAUTHORIZED | 401 | 認証トークン未付与または無効 |
| AUTH_403_FACILITY_GROUP_LIST_DENIED | 403 | 共有システム管理者アカウントではない |
| AUTH_403_FACILITY_GROUP_EDIT_DENIED | 403 | 共有システム管理者アカウントではない |
| FACILITY_GROUP_NOT_FOUND | 404 | 対象施設グループが存在しない、または無効化済み |
| FACILITY_NOT_FOUND | 404 | 作業対象施設、対象施設、または公開元施設が存在しない、または削除済み |
| FACILITY_GROUP_NAME_DUPLICATE | 409 | 有効な施設グループ名が重複している |
| FACILITY_ALREADY_IN_GROUP | 409 | 対象施設が既にグループへ所属している |
| FACILITY_NOT_IN_GROUP | 404 | 対象施設がグループへ所属していない |
| FACILITY_GROUP_HAS_NO_FACILITIES | 409 | 共有設定保存対象の所属施設が存在しない |
| SHARING_CODE_INVALID | 400 | 未知または無効な共有データ種別 / column_code が指定された |
| SHARING_COLUMN_REQUIRES_DATA_TYPE | 400 | 公開カラムに必要な共有データ種別が有効ではない |
| INTERNAL_SERVER_ERROR | 500 | サーバー内部エラー |

## 第8章 運用・保守方針

### 施設グループ保守方針

- 施設グループは他施設閲覧候補範囲を表し、資産一覧・資産詳細の閲覧可否は各業務 API で再判定する
- 施設グループ無効化後も所属施設行と公開設定行は保持し、監査可能な状態を維持する
- 施設論理削除後もグループ所属行と公開設定行は保持し、閲覧判定時に削除済み施設を除外する
- 公開設定は公開元施設単位で保存するため、同一施設が複数グループに所属している場合も公開設定は共通で扱う
