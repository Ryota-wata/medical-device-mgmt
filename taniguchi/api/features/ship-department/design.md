# SHIP部署マスタ API内部設計

## 第1章 概要

### 本書の目的

本書は、SHIP部署マスタ画面（`/ship-department-master`）で利用するAPIについて、OpenAPIに記載しない権限、DB処理、トランザクションおよび運用条件を定義する。HTTPメソッド、パス、入出力、ステータスコードの正本は同一フォルダの`openapi.yaml`とする。

### 対象画面

| 画面名 | 画面パス | 主機能 |
| --- | --- | --- |
| SHIP部署マスタ | `/ship-department-master` | 部署マスタと諸室区分マスタを独立して検索・登録・更新・論理削除する |

### 用語定義

| 用語 | 説明 |
| --- | --- |
| SHIP部署マスタ | SHIPで定義する部門・部署の標準候補マスタ |
| SHIP諸室区分マスタ | SHIPで定義する諸室区分①・②の標準候補マスタ |
| 個別部署マスタ | 施設ごとの部門・部署・諸室を保持し、SHIP標準候補と紐づける機能 |

## 第2章 システム全体構成

### APIの位置づけ

本API群は、画面左側の部署マスタ領域と右側の諸室区分マスタ領域を独立して参照・保守する。登録した標準候補は個別部署マスタで利用する。

削除は既存参照を保持するため論理削除とし、削除済みレコードを通常一覧と新規の標準候補から除外する。

### 画面操作とAPIの関係

| 画面操作 | operationId | 呼出タイミング・補足 |
| --- | --- | --- |
| 部署マスタ初期表示・絞り込み | `listShipDepartments` | 初期表示および検索条件変更時 |
| 部署マスタ新規作成 | `createShipDepartment` | 左側領域の登録確定時 |
| 部署マスタ更新 | `updateShipDepartment` | 左側領域の編集確定時 |
| 部署マスタ削除 | `deleteShipDepartment` | 左側領域の削除確認後 |
| 諸室区分マスタ初期表示・絞り込み | `listShipRoomCategories` | 初期表示および検索条件変更時 |
| 諸室区分マスタ新規作成 | `createShipRoomCategory` | 右側領域の登録確定時 |
| 諸室区分マスタ更新 | `updateShipRoomCategory` | 右側領域の編集確定時 |
| 諸室区分マスタ削除 | `deleteShipRoomCategory` | 右側領域の削除確認後 |

### 使用テーブル

| テーブル | 利用種別 | 用途 |
| --- | --- | --- |
| `users` | READ | 共有システム管理者アカウント判定と実行ユーザー解決 |
| `facilities` | READ | 作業対象施設の存在・未削除判定 |
| `user_facility_assignments` | READ | 通常アカウントの有効な担当施設割当判定 |
| `facility_feature_settings` | READ | 施設単位の機能提供判定 |
| `user_facility_feature_settings` | READ | ユーザー・施設単位の機能利用判定 |
| `ship_departments` | READ / CREATE / UPDATE | 部署マスタの一覧取得・登録・更新・論理削除 |
| `ship_room_categories` | READ / CREATE / UPDATE | 諸室区分マスタの一覧取得・登録・更新・論理削除 |
| `facility_locations` | READ | 論理削除後も保持する既存参照の確認 |
| `facility_location_remodels` | READ | 論理削除後も保持する既存参照の確認 |

## 第3章 共通仕様

### API共通仕様

- 通信方式はHTTPS、データ形式はJSON、文字コードはUTF-8とする。
- 日時を追加する場合はISO 8601形式とする。
- 画面要件上ページングは定義しない。
- OpenAPIのサーバーURL`/api`と各pathを結合したURLを利用する。

### 認証方式

ログイン認証で取得したBearerトークンを`Authorization`ヘッダーへ付与する。未認証時は401を返す。

### 権限モデル

| 処理 | feature_code | 判定方針 |
| --- | --- | --- |
| 一覧取得 | `ship_dept_master_list` | 通常アカウントは施設割当・施設提供設定・ユーザー施設別設定のすべてが有効であること |
| 登録・更新・削除 | `ship_dept_master_edit` | 通常アカウントは施設割当・施設提供設定・ユーザー施設別設定のすべてが有効であること |

共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）は、作業対象施設が存在して未削除であれば、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定の判定をバイパスする。`/auth/context`は画面表示用のキャッシュであり、各業務APIでも同じ条件を再判定する。

### 共通入力規則

- 部門名、部署名、諸室区分①、諸室区分②は前後空白を除去した後に1文字以上100文字以下で検証する。
- pathのIDは1以上のint64とする。
- 定義外のJSONプロパティは受け付けない。

## 第4章 データモデル

### 部署マスタ

| API項目 | DB列 | DB型 | 制約・補足 |
| --- | --- | --- | --- |
| `shipDepartmentId` | `ship_department_id` | bigint | PK、APIでは1以上のint64 |
| `divisionName` | `division_name` | varchar(100) | 必須、1～100文字 |
| `departmentName` | `department_name` | varchar(100) | 必須、1～100文字 |
| - | `sort_order` | int | 登録時は既定値0、一覧は昇順 |
| - | `is_active` | boolean | 登録時はtrue、削除時はfalse |

### 諸室区分マスタ

| API項目 | DB列 | DB型 | 制約・補足 |
| --- | --- | --- | --- |
| `shipRoomCategoryId` | `ship_room_category_id` | bigint | PK、APIでは1以上のint64 |
| `roomCategory1` | `room_category1` | varchar(100) | 必須、1～100文字 |
| `roomCategory2` | `room_category2` | varchar(100) | 必須、1～100文字 |
| - | `sort_order` | int | 登録時は既定値0、一覧は昇順 |
| - | `is_active` | boolean | 登録時はtrue、削除時はfalse |

## 第5章 API別処理仕様

### listShipDepartments

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `ship_dept_master_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `ship_dept_master_list` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する
2. `ship_departments` のうち `is_active=true` のレコードを `sort_order ASC, ship_department_id ASC` で取得する
3. 部門名と部署名は AND 条件で絞り込む
4. 文字列検索は部分一致を基本とする
5. 画面要件上ページングは定義しない

### createShipDepartment

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `ship_dept_master_edit` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `ship_dept_master_edit` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する
2. `ship_departments` に新規レコードを追加する
3. `sort_order` は未指定時に既定値 `0` を採用する想定とする
4. `is_active` は未指定時に `true` を採用する想定とする
5. `(division_name, department_name)` の重複は登録不可とする

### updateShipDepartment

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `ship_dept_master_edit` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `ship_dept_master_edit` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する
2. 指定IDの `ship_departments` が存在し、`is_active=true` であることを確認したうえで更新する
3. `(division_name, department_name)` の重複は更新不可とする
4. `facility_locations` / `facility_location_remodels` は FK 参照を維持したまま、JOIN名称が更新後値へ切り替わる想定とする

### deleteShipDepartment

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `ship_dept_master_edit` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `ship_dept_master_edit` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する
2. 指定IDの `ship_departments` が存在し、`is_active=true` であることを確認する
3. 対象レコードの `is_active=false` とし、`updated_at` を更新する
4. `facility_locations.ship_department_id` および `facility_location_remodels.target_ship_department_id` の既存参照は変更しない
5. 論理削除後のレコードは通常一覧および個別部署マスタ画面の標準候補から除外する

### listShipRoomCategories

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `ship_dept_master_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `ship_dept_master_list` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する
2. `ship_room_categories` のうち `is_active=true` のレコードを `sort_order ASC, ship_room_category_id ASC` で取得する
3. 諸室区分①と諸室区分②は AND 条件で絞り込む
4. 文字列検索は部分一致を基本とする
5. 画面要件上ページングは定義しない

### createShipRoomCategory

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `ship_dept_master_edit` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `ship_dept_master_edit` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する
2. `ship_room_categories` に新規レコードを追加する
3. `sort_order` は未指定時に既定値 `0` を採用する想定とする
4. `is_active` は未指定時に `true` を採用する想定とする
5. `(room_category1, room_category2)` の重複は登録不可とする

### updateShipRoomCategory

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `ship_dept_master_edit` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `ship_dept_master_edit` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する
2. 指定IDの `ship_room_categories` が存在し、`is_active=true` であることを確認したうえで更新する
3. `(room_category1, room_category2)` の重複は更新不可とする
4. `facility_locations` / `facility_location_remodels` は FK 参照を維持したまま、JOIN名称が更新後値へ切り替わる想定とする

### deleteShipRoomCategory

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、Bearer トークン上の作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `ship_dept_master_edit` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `ship_dept_master_edit` が有効であること

#### 処理仕様

1. Bearer トークン上の作業対象施設が存在し、未削除であることを確認する
2. 指定IDの `ship_room_categories` が存在し、`is_active=true` であることを確認する
3. 対象レコードの `is_active=false` とし、`updated_at` を更新する
4. `facility_locations.ship_room_category_id` および `facility_location_remodels.target_ship_room_category_id` の既存参照は変更しない
5. 論理削除後のレコードは通常一覧および個別部署マスタ画面の標準候補から除外する

## 第6章 権限・業務ルール

### 一意性ルール

- `ship_departments`は`(division_name, department_name)`の組み合わせを一意に保つ。
- `ship_room_categories`は`(room_category1, room_category2)`の組み合わせを一意に保つ。
- 重複登録・重複更新は409を返す。

### 削除方針

- 両マスタとも物理削除せず`is_active=false`の論理削除とする。
- 既存の個別部署・リモデル参照は保持する。
- 論理削除済みマスタは通常一覧と新規選択候補から除外する。

### 実装前提

- モックは`DEPT001`・`ROOM001`形式のIDを用いるが、APIとDBの正本キーはbigintの内部IDとする。
- `sort_order`と`is_active`は画面入力に含めず、登録時はDB既定値を用いる。

## 第7章 エラーコード一覧

| エラーコード | HTTP | 発生条件 |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | 必須不足、文字数超過、IDまたは検索条件不正 |
| `UNAUTHORIZED` | 401 | Bearerトークン未付与または無効 |
| `AUTH_403_SHIP_DEPT_MASTER_LIST_DENIED` | 403 | 通常アカウントに実効`ship_dept_master_list`がない |
| `AUTH_403_SHIP_DEPT_MASTER_EDIT_DENIED` | 403 | 通常アカウントに実効`ship_dept_master_edit`がない |
| `FACILITY_NOT_FOUND` | 404 | 作業対象施設が存在しない、または削除済み |
| `SHIP_DEPARTMENT_NOT_FOUND` | 404 | 対象部署マスタが存在しない、または論理削除済み |
| `SHIP_ROOM_CATEGORY_NOT_FOUND` | 404 | 対象諸室区分マスタが存在しない、または論理削除済み |
| `SHIP_DEPARTMENT_DUPLICATE` | 409 | 部門名と部署名の組み合わせが重複 |
| `SHIP_ROOM_CATEGORY_DUPLICATE` | 409 | 諸室区分①と②の組み合わせが重複 |
| `INTERNAL_SERVER_ERROR` | 500 | サーバー内部エラー |

## 第8章 運用・保守方針

### マスタ保守方針

- 名称変更はFK参照を維持したまま、参照先名称として個別部署マスタへ反映する。
- 削除は論理削除とし、既存参照の追跡可能性を維持する。
- マスタ変更操作では実行ユーザー、対象ID、変更前後値、実行日時を監査ログへ記録する。

### 今後拡張時の留意点

- `sort_order`や`is_active`を画面から保守する場合は後方互換を保って項目を追加する。
- 件数増加時はページングと並び順指定の追加を検討する。
- 共通マスタの変更時は個別部署マスタの候補表示と参照整合性を回帰確認する。

### 未確定事項

なし。
