# SHIPユーザー管理 API内部設計

## 第1章 概要

### 本書の目的

本書は、SHIPユーザー管理画面（`/ship-user-management`）で利用する API の設計内容を整理し、SHIPユーザーの基本情報、担当施設、施設別機能設定、施設別表示カラム設定を一貫して保守するための基準を定義する。

特に以下を明確にする。

- ユーザー管理APIとの管理対象分離
- SHIPユーザー作成・更新時の `account_type='SHIP'` 固定ルール
- SHIPユーザーへ付与する担当施設と施設別機能・カラム設定の保存単位
- 未削除の全施設を担当施設候補とするルール

### 対象システム概要

SHIPユーザー管理は、医療機器管理システムの共通管理機能として、`users.account_type='SHIP'` の通常アカウントを作成・参照・更新・削除する画面である。病院ユーザーはユーザー管理画面（`/user-management`）で扱い、本 API の作成・編集・削除対象には含めない。

SHIPユーザーも通常アカウントとして、担当施設ごとに `config_scope='FACILITY_USER'` の機能・カラムを付与する。施設提供設定で有効な機能・カラムだけを候補とし、対象ユーザーへ保存する有効状態は `user_facility_feature_settings` と `user_facility_column_settings` を正本とする。

### 用語定義

| 用語 | 説明 |
| --- | --- |
| SHIPユーザー | `users.account_type='SHIP'` の通常アカウント。SHIPユーザー管理画面/APIで作成・管理する |
| 病院ユーザー | `users.account_type='HOSPITAL'` の通常アカウント。ユーザー管理画面/APIで作成・管理し、本書の対象外とする |
| 共有システム管理者アカウント | `users.account_type='SYSTEM_ADMIN'` の共有アカウント。通常ユーザーとして新規作成・編集する対象には含めない |
| 担当施設 | SHIPユーザーが作業対象として選択できる施設。`user_facility_assignments` に保持する |
| 既定施設 | 複数の担当施設のうち代表として扱う施設。`users.facility_id` と `user_facility_assignments.is_default=true` を同期し、`/auth/me` の `defaultFacilityId` の根拠にする |
| 施設別機能設定 | 担当施設ごとにユーザーへ許可する `config_scope='FACILITY_USER'` の機能設定。`user_facility_feature_settings` に保持する |
| 施設別表示カラム設定 | 担当施設ごとにユーザーへ表示許可するカラム設定。`user_facility_column_settings` に保持する |

### 対象画面

| 画面名 | 画面パス | 利用目的 |
| --- | --- | --- |
| 67. SHIPユーザー管理画面 | `/ship-user-management` | SHIPユーザー一覧参照、SHIPユーザー新規作成、基本情報編集、担当施設・権限編集、削除を行う |

## 第2章 システム全体構成

### API の位置づけ

本 API 群は、SHIPユーザー管理画面の初期表示に必要なコンテキスト取得、一覧取得、詳細取得、施設候補取得、ユーザー作成、ユーザー基本情報更新、担当施設・権限更新、削除を提供する。

ユーザー管理APIと同じ認可基盤・保存テーブルを利用するが、管理対象ユーザーは `account_type='SHIP'` に固定する。病院ユーザーは `/user-management` 側の責務とする。

APIを実行できるかの権限判定と、作成・編集対象のSHIPユーザーへ付与する施設別機能・カラム設定は別の概念として扱う。前者は実行ユーザーの `user_list_view`、`user_edit`、`user_facility_assignment_edit` で判定し、後者はリクエストの `facilityAssignments` を `user_facility_*` 系テーブルへ保存する。

### 画面と API の関係

1. 画面初期表示時に `GET /ship-user-management/context` と `GET /ship-user-management/users` を呼び出す
2. 一覧のページ切替、絞り込み、ソート変更時に `GET /ship-user-management/users` を再呼び出す
3. 編集モーダル表示時に `GET /ship-user-management/users/{userId}` と `GET /ship-user-management/users/{userId}/facility-assignments` を呼び出し、担当施設候補の検索時に `GET /ship-user-management/facilities` を呼び出す
4. 新規作成モーダル保存時に `POST /ship-user-management/users` を呼び出す
5. 編集モーダルの基本情報保存時は `PUT /ship-user-management/users/{userId}/profile`、担当施設・権限設定保存時は `PUT /ship-user-management/users/{userId}/facility-assignments` を呼び出す
6. 削除確認時は `DELETE /ship-user-management/users/{userId}` を呼び出す

### 使用テーブル

| テーブル | 利用種別 | 用途 |
| --- | --- | --- |
| users | READ / CREATE / UPDATE / DELETE | SHIPユーザー基本情報の参照、登録、更新、論理削除、集約更新トークン管理。新規作成時の `account_type` は `SHIP` 固定とし、`HOSPITAL` / `SYSTEM_ADMIN` は本APIの管理対象外 |
| user_facility_assignments | READ / CREATE / UPDATE / DELETE | 担当施設、既定施設、割当種別の参照と更新 |
| facilities | READ | 既定施設候補、担当施設候補、所属母体導出、論理削除判定 |
| feature_catalogs | READ | 担当施設ごとの利用機能設定に使う機能カタログの取得 |
| column_catalogs | READ | 担当施設ごとの表示カラム設定に使うカラムカタログの取得 |
| facility_feature_settings | READ | 施設単位で提供されている機能の取得 |
| facility_column_settings | READ | 施設単位で提供されている表示カラムの取得 |
| user_facility_feature_settings | READ / CREATE / UPDATE / DELETE | `config_scope='FACILITY_USER'` の担当施設ごとの利用機能設定の参照と保守 |
| user_facility_column_settings | READ / CREATE / UPDATE / DELETE | 担当施設ごとの表示カラム設定の参照と保守 |

## 第3章 共通仕様

### API 共通仕様

- 通信方式: HTTPS
- データ形式: JSON
- 文字コード: UTF-8
- 日時形式: ISO 8601（例: `2026-07-05T00:00:00Z`）
- 一覧 API の既定並び順は `updatedAt DESC, userId ASC` とする
- 一覧 API の既定ページサイズは `50`、上限は `200` とする
- 施設候補検索 API の既定ページサイズは `20`、上限は `100` とする
- 担当施設候補は `facilities.deleted_at IS NULL` の未削除施設全件とする
- ユーザー別機能候補は `config_scope='FACILITY_USER'` かつ施設提供中の機能に限定する

### 認証方式

ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。

### 権限モデル

本API群で使用する API 実行用の `feature_code` は、ユーザー管理APIと同じ以下の3種類とする。SHIPユーザー管理で保存する `enabledFeatureCodes` / `enabledColumnCodes` は対象SHIPユーザーへ付与する業務権限であり、API実行可否の判定コードとは分けて扱う。

| 管理単位名 | feature_code | 対象処理 |
| --- | --- | --- |
| ユーザー / 一覧 | `user_list_view` | 画面コンテキスト取得、一覧取得 |
| ユーザー / 新規作成・編集 | `user_edit` | ユーザー基本情報取得、ユーザー基本情報更新、削除、ユーザー新規作成の基本情報側 |
| 担当施設・権限 / 編集 | `user_facility_assignment_edit` | ユーザー担当施設・権限詳細取得、施設候補取得、担当施設・権限更新、ユーザー新規作成の担当施設・権限設定側 |

| 処理 | 必要 feature_code | 判定テーブル | 説明 |
| --- | --- | --- | --- |
| 画面コンテキスト取得 / 一覧取得 | `user_list_view` | `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings` | 一覧参照と新規作成導線表示の前提 |
| ユーザー基本情報取得 / ユーザー基本情報更新 / 削除 | `user_edit` | `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings` | PII を含む基本情報参照と基本情報変更系 |
| ユーザー担当施設・権限詳細取得 / 施設候補取得 / 担当施設・権限更新 | `user_facility_assignment_edit` | `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings` | 担当施設とユーザー施設別権限設定の参照・変更系 |
| ユーザー新規作成 | `user_edit` と `user_facility_assignment_edit` | `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings` | 新規ユーザーは基本情報と担当施設・権限設定を同時に持つ前提で作成する |

### 管理対象スコープ

- 管理対象ユーザーは、`users.account_type = 'SHIP'` かつ `users.deleted_at IS NULL` の通常アカウントに限る
- 病院ユーザー（`account_type='HOSPITAL'`）は一覧、詳細、更新、削除の対象外とする
- 共有システム管理者アカウント自体は、一覧、詳細、基本情報更新、担当施設・権限更新、削除の対象外とする
- 担当施設候補は `facilities.deleted_at IS NULL` の未削除施設全件とし、協業グループ経由の他施設閲覧候補は担当施設候補へ含めない
- 詳細取得、更新、削除で管理対象外ユーザーが指定された場合は、存在隠蔽のため 404 (`SHIP_USER_NOT_FOUND`) を返却する

### 担当施設・既定施設ルール

- 新規作成および担当施設・権限更新では、`defaultFacilityId` を必須とし、`facilityAssignments` に同じ施設を必ず含める
- `defaultFacilityId` は `users.facility_id` と `user_facility_assignments.is_default=true` の行に同期する
- `users.establishment_id` は `defaultFacilityId` の `facilities.establishment_id` から導出する
- `user_facility_assignments.assignment_type` は公開 API から受け取らず、既定施設を `PRIMARY`、それ以外を `SECONDARY` としてサーバー側で導出する
- 担当施設ごとの機能設定は施設提供機能の有効範囲内だけ登録できる
- 担当施設ごとのカラム設定は施設提供カラムの有効範囲内、かつ対応機能がユーザー側でも有効な場合だけ登録できる

### トランザクションと競合制御

- `POST /ship-user-management/users`、`PUT /ship-user-management/users/{userId}/profile`、`PUT /ship-user-management/users/{userId}/facility-assignments`、`DELETE /ship-user-management/users/{userId}` は、それぞれ 1 回の API 呼び出しを 1 DB トランザクションで完結させる
- 競合検知のトークンは `users.updated_at` を用いる。担当施設・権限更新 API は関連テーブル更新と同時に `users.updated_at` も更新し、ユーザー集約全体の版として扱う
- 更新系・削除系 API は `lastKnownUpdatedAt` を受け取り、取得時点の `users.updated_at` と一致しない場合は 409 (`SHIP_USER_CONFLICT`) を返却する
- 担当施設・権限更新では `user_facility_assignments` は差分更新し、`user_facility_feature_settings` と `user_facility_column_settings` は候補集合に対する現在値として再計算・総入れ替えする。失敗時は部分反映しない

### エラーレスポンス仕様

#### 基本エラーレスポンス（ErrorResponse）

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| code | string | ✓ | エラーコード |
| message | string | ✓ | 利用者向けエラーメッセージ |
| details | string[] | - | 入力エラーや補足情報 |

## 第4章 API 一覧

### SHIPユーザー管理（/ship-user-management）

| No | API名 | Method | Path | 用途 | 権限 |
| --- | --- | --- | --- | --- | --- |
| 1 | 画面コンテキスト取得 | GET | /ship-user-management/context | 施設候補、操作可否、共通選択肢を取得する | `user_list_view` |
| 2 | SHIPユーザー一覧取得 | GET | /ship-user-management/users | SHIPユーザー一覧を取得する | `user_list_view` |
| 3 | SHIPユーザー基本情報取得 | GET | /ship-user-management/users/{userId} | SHIPユーザー基本情報を取得する | `user_edit` |
| 4 | SHIPユーザー担当施設・権限取得 | GET | /ship-user-management/users/{userId}/facility-assignments | 既定施設、担当施設、施設別機能・カラム設定を取得する | `user_facility_assignment_edit` |
| 5 | 担当施設候補取得 | GET | /ship-user-management/facilities | 未削除の全施設から担当施設候補を取得する | `user_facility_assignment_edit` |
| 6 | SHIPユーザー新規作成 | POST | /ship-user-management/users | SHIPユーザー基本情報、担当施設、施設別設定を登録する | `user_edit` + `user_facility_assignment_edit` |
| 7 | SHIPユーザー基本情報更新 | PUT | /ship-user-management/users/{userId}/profile | SHIPユーザー基本情報を更新する | `user_edit` |
| 8 | SHIPユーザー担当施設・権限更新 | PUT | /ship-user-management/users/{userId}/facility-assignments | 既定施設、担当施設、施設別機能・カラム設定を更新する | `user_facility_assignment_edit` |
| 9 | SHIPユーザー削除 | DELETE | /ship-user-management/users/{userId} | SHIPユーザーを論理削除し、担当施設設定とユーザー施設別設定を削除する | `user_edit` |

## 第5章 機能設計

### getShipUserManagementContext

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について実効 `user_list_view` が有効であること
- 共有システム管理者アカウントでは作業対象施設が未削除であること

#### 処理仕様

1. `facilities.deleted_at IS NULL` の施設を候補として取得する
2. `feature_catalogs` から `config_scope=FACILITY_USER` かつ `is_active=true` の機能をユーザー別設定候補として表示順で取得する
3. `column_catalogs` から `is_active=true` のカラムを表示順で取得する
4. 各施設で提供設定が有効な `config_scope='FACILITY_USER'` の機能コードと表示カラムコードを返却する
5. `canCreate`、`canEditProfile`、`canEditFacilityAssignments`、`canDelete` は実行ユーザーの実効 feature_code から算出する
6. 共有システム管理者アカウントは未削除施設であれば操作可として扱う

### getShipUserManagementUsers

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について実効 `user_list_view` が有効であること
- 共有システム管理者アカウントでは作業対象施設が未削除であること

#### 処理仕様

1. `users.deleted_at IS NULL` かつ `users.account_type = 'SHIP'` のユーザーを対象にする
2. ユーザー名、部署、担当施設IDで AND 条件検索する
3. 担当施設IDが指定された場合は、`user_facility_assignments` に当該施設の有効割当を持つユーザーに絞り込む
4. 一覧には所属部署、役職、ユーザー名、連絡先、メールアドレス、担当施設サマリ、更新日時を返却する
5. 担当施設ごとの機能・カラム設定は担当施設・権限詳細 API で取得する

### getShipUserManagementUsersByUserId

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について実効 `user_edit` が有効であること
- 共有システム管理者アカウントでは作業対象施設が未削除であること

#### 処理仕様

1. 対象 `users` が `deleted_at IS NULL` かつ `account_type = 'SHIP'` で存在することを確認する
2. `HOSPITAL` または `SYSTEM_ADMIN` のユーザーIDが指定された場合は 404 (`SHIP_USER_NOT_FOUND`) を返却する
3. 基本情報、アカウント状態、集約更新トークンを返却する

### getShipUserManagementUsersByUserIdFacilityAssignments

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について実効 `user_facility_assignment_edit` が有効であること
- 共有システム管理者アカウントでは作業対象施設が未削除であること

#### 処理仕様

1. 対象 `users` が `deleted_at IS NULL` かつ `account_type = 'SHIP'` で存在することを確認する
2. 対象ユーザーの `user_facility_assignments` を担当施設として取得する
3. 各担当施設について、施設提供設定が有効な `config_scope='FACILITY_USER'` の機能・カラムを候補として返却する
4. 対象ユーザーの `user_facility_feature_settings` / `user_facility_column_settings` から現在の有効状態を返却する

### getShipUserManagementFacilities

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について実効 `user_facility_assignment_edit` が有効であること
- 共有システム管理者アカウントでは作業対象施設が未削除であること

#### 処理仕様

1. `facilities.deleted_at IS NULL` の施設を候補として取得する
2. 施設名または施設コードで部分一致検索する
3. 各施設について、施設提供設定が有効な `config_scope='FACILITY_USER'` の機能・カラムを返却する
4. 協業グループ経由の他施設閲覧候補という概念は担当施設候補へ適用しない

### postShipUserManagementUsers

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について実効 `user_edit` と `user_facility_assignment_edit` が有効であること
- 共有システム管理者アカウントでは作業対象施設が未削除であること

#### 処理仕様

1. `users.email_address` が未削除ユーザー間で重複しないことを確認する
2. `facilityAssignments` が1件以上で、`defaultFacilityId` が `facilityAssignments[*].facilityId` に含まれることを確認する
3. 指定施設がすべて `facilities.deleted_at IS NULL` であることを確認する
4. `users` へ `account_type='SHIP'` 固定で登録する。`facility_id` は `defaultFacilityId`、`establishment_id` は既定施設から導出する
5. `user_facility_assignments` を作成し、既定施設を `assignment_type='PRIMARY'` / `is_default=true`、その他を `SECONDARY` / `false` とする
6. 施設提供設定の候補集合に対して、`enabledFeatureCodes` / `enabledColumnCodes` の現在値を `user_facility_feature_settings` / `user_facility_column_settings` へ保存する

### putShipUserManagementUsersByUserIdProfile

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について実効 `user_edit` が有効であること
- 共有システム管理者アカウントでは作業対象施設が未削除であること

#### 処理仕様

1. 対象 `users` が `deleted_at IS NULL` かつ `account_type = 'SHIP'` で存在することを確認する
2. `lastKnownUpdatedAt` と `users.updated_at` を比較し、不一致時は 409 (`SHIP_USER_CONFLICT`) を返却する
3. メールアドレスが他の未削除ユーザーと重複しないことを確認する
4. `users` の基本情報、`is_active`、`updated_at` を更新する。`account_type`、`facility_id`、`establishment_id` は更新しない

### putShipUserManagementUsersByUserIdFacilityAssignments

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について実効 `user_facility_assignment_edit` が有効であること
- 共有システム管理者アカウントでは作業対象施設が未削除であること

#### 処理仕様

1. 対象 `users` が `deleted_at IS NULL` かつ `account_type = 'SHIP'` で存在することを確認する
2. `lastKnownUpdatedAt` と `users.updated_at` を比較し、不一致時は 409 (`SHIP_USER_CONFLICT`) を返却する
3. `facilityAssignments` が1件以上で、`defaultFacilityId` が `facilityAssignments[*].facilityId` に含まれることを確認する
4. 指定施設がすべて `facilities.deleted_at IS NULL` であることを確認する
5. `users.facility_id` を `defaultFacilityId`、`users.establishment_id` を既定施設の設立母体へ更新する
6. `user_facility_assignments` は指定施設に合わせて差分更新し、既定施設を `PRIMARY` / `is_default=true`、その他を `SECONDARY` / `false` とする
7. `user_facility_feature_settings` と `user_facility_column_settings` は候補集合に対する現在値として再計算し、施設提供設定と矛盾する指定は 409 を返却する
8. 担当施設・権限更新成功時は `users.updated_at` も更新する

### deleteShipUserManagementUsersByUserId

#### 権限

- 認可条件: Bearer トークン上の作業対象施設について実効 `user_edit` が有効であること
- 共有システム管理者アカウントでは作業対象施設が未削除であること

#### 処理仕様

1. 対象 `users` が `deleted_at IS NULL` かつ `account_type = 'SHIP'` で存在することを確認する
2. `lastKnownUpdatedAt` と `users.updated_at` を比較し、不一致時は 409 (`SHIP_USER_CONFLICT`) を返却する
3. 実行ユーザー自身を削除対象にすることはできない
4. `users.deleted_at` と `users.updated_at` を現在日時へ更新し、`is_active=false` とする
5. 対象ユーザーの `user_facility_column_settings`、`user_facility_feature_settings`、`user_facility_assignments` を削除する
6. 削除処理は 1 トランザクションで実行する

## 第6章 権限・業務ルール

### 必要権限

| 処理 | 必要 feature_code | 判定基準 | 説明 |
| --- | --- | --- | --- |
| 画面コンテキスト取得 / 一覧取得 | `user_list_view` | Bearer トークン上の作業対象施設に対して実効 `user_list_view` を持つこと | 一覧参照系 |
| ユーザー基本情報取得 / ユーザー基本情報更新 / 削除 | `user_edit` | Bearer トークン上の作業対象施設に対して実効 `user_edit` を持つこと | PII を含む基本情報参照と基本情報変更系 |
| 担当施設・権限詳細取得 / 施設候補取得 / 担当施設・権限更新 | `user_facility_assignment_edit` | Bearer トークン上の作業対象施設に対して実効 `user_facility_assignment_edit` を持つこと | 担当施設とユーザー施設別権限の変更系 |
| ユーザー新規作成 | `user_edit` と `user_facility_assignment_edit` | 同一作業対象施設に対して両 feature_code を持つこと | 新規作成は基本情報と担当施設・権限設定を同時に扱う |

### 一意性・整合性ルール

- 管理対象ユーザーは `users.account_type = 'SHIP'` の通常ユーザーに限る
- 病院ユーザーと共有システム管理者アカウントは本 API の作成・編集・削除対象に含めない
- `users.email_address` は未削除ユーザー間で一意に保つ
- `user_facility_assignments` は `(user_id, facility_id)` を一意に保つ
- 担当施設候補は未削除の全施設とする
- 既定施設は担当施設に必ず含め、`users.facility_id` と `is_default=true` の担当施設を一致させる
- 公開 API では `assignmentType` を受け取らず、既定施設を `PRIMARY`、それ以外を `SECONDARY` として内部導出する
- 担当施設ごとの機能設定は施設提供機能の有効範囲内だけ登録できる
- 担当施設ごとのカラム設定は施設提供カラムの有効範囲内、かつ対応機能がユーザー側でも有効な場合だけ登録できる
- 担当施設・権限更新成功時は `users.updated_at` も更新し、プロフィール更新との競合検知に使う

### 削除ルール

- 実行ユーザー自身の削除は認めない

### 実装前提・設計判断

- 一覧 API は要約情報のみ返し、詳細情報は `GET /ship-user-management/users/{userId}` と `GET /ship-user-management/users/{userId}/facility-assignments` に分離する
- 基本情報更新と担当施設・権限更新は API を分離し、`user_edit` と `user_facility_assignment_edit` の境界に一致させる
- SHIPユーザーの担当施設候補は未削除の全施設とし、選択中施設や設立母体による絞り込みは行わない
- 競合検知は `users.updated_at` を集約更新トークンとして扱う方式を採用し、HTTP 条件付き更新ヘッダーは採用しない

## 第7章 エラーコード一覧

| エラーコード | HTTP | 説明 |
| --- | --- | --- |
| VALIDATION_ERROR | 400 | 必須不足、形式不正、担当施設未指定、担当施設重複などの入力不正 |
| DEFAULT_FACILITY_NOT_ASSIGNED | 400 | 既定施設が担当施設に含まれていない |
| UNAUTHORIZED | 401 | 認証トークン未付与または無効 |
| AUTH_403_USER_LIST_VIEW_DENIED | 403 | 作業対象施設に対する実効 `user_list_view` がない |
| AUTH_403_USER_EDIT_DENIED | 403 | 作業対象施設に対する実効 `user_edit` がない |
| AUTH_403_USER_FACILITY_ASSIGNMENT_EDIT_DENIED | 403 | 作業対象施設に対する実効 `user_facility_assignment_edit` がない |
| SHIP_USER_NOT_FOUND | 404 | 対象SHIPユーザーが存在しない、またはSHIPユーザー管理対象外である |
| FACILITY_NOT_FOUND | 404 | 指定施設が存在しない、または論理削除済みである |
| FEATURE_OR_COLUMN_NOT_FOUND | 404 | 指定した機能コードまたはカラムコードが存在しない、または候補外である |
| SHIP_USER_EMAIL_DUPLICATE | 409 | メールアドレスが重複している |
| SHIP_USER_CONFLICT | 409 | 他ユーザー更新により `lastKnownUpdatedAt` が不一致である |
| FACILITY_PERMISSION_SCOPE_CONFLICT | 409 | 施設提供設定または親子機能条件と矛盾する機能・カラム指定である |
| SHIP_USER_SELF_DELETE_FORBIDDEN | 409 | 実行ユーザー自身は削除できない |
| INTERNAL_SERVER_ERROR | 500 | サーバー内部エラー |

## 第8章 運用・保守方針

### SHIPユーザーマスタ保守方針

- SHIPユーザー削除は `users` の論理削除で管理し、監査上必要な基本情報は保持する
- 担当施設およびユーザー施設別権限設定は削除ユーザーへ不要となるため、削除時に関連テーブルから除去する
- 施設が論理削除されても既存設定行は残り得るが、候補表示や認可判定では `facilities.deleted_at IS NULL` を前提に扱う
- 設定系テーブルの `created_by` / `updated_by` は問い合わせ調査の根拠になるため必ず保存する

### 運用上の留意点

- 編集モーダルは画面上は一体として表示するが、基本情報更新と担当施設・権限更新の API 契約は分離して維持する
