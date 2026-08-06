# 個別部署マスタ API内部設計

## 第1章 概要

### 本書の目的

本書は、個別部署マスタ画面（`/hospital-facility-master`）で利用する API の設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。

特に以下を明確にする。

- 選択施設単位の個別部署マスタ一覧取得、登録、更新、削除 I/F
- SHIP部署・諸室区分候補、および施設候補の取得 I/F
- Excel テンプレート取得、プレビュー、追加/置換インポート I/F
- 現行ロケーション正本 `facility_locations` とリモデル先 `facility_location_remodels` の取り扱い

### 対象システム概要

個別部署マスタは、施設ごとの現行ロケーション正本 `facility_locations` と、そのリモデル先情報 `facility_location_remodels` を参照・管理する画面である。

画面表示は `facility_locations` と `facility_location_remodels` を結合した1行DTOで構成し、リモデル先が未登録の場合は新欄を空表示とする。

### 用語定義

| 用語 | 説明 |
| --- | --- |
| 現行ロケーション | `facility_locations` に保持する現状の施設ロケーション情報 |
| リモデル先ロケーション | `facility_location_remodels` に保持する新側ロケーション情報 |
| 個別部署マスタ | 選択施設ごとの部門/部署/室情報を管理する画面およびデータ |
| SHIP標準候補 | `ship_departments` と `ship_room_categories` の共通マスタ候補 |

### 対象画面

| 項目 | 内容 |
| --- | --- |
| 画面名 | 19. 個別部署マスタ画面 |
| 画面URL | /hospital-facility-master |
| 主機能 | 施設選択、一覧表示、インライン新規作成/編集、Excel入出力 |

## 第2章 システム全体構成

### APIの位置づけ

本API群は、個別部署マスタ画面における施設候補取得、SHIP標準候補取得、一覧取得、Excel入出力、新規作成、更新、削除を提供する。

現行ロケーションの正本は `facility_locations`、新側ロケーションは `facility_location_remodels` を0..1件の子テーブルとして扱う。

### 画面とAPIの関係

1. 施設選択候補表示時に対象施設候補取得 API を呼び出す
2. 共通マスタ候補表示時に SHIP部署候補取得 API / SHIP諸室区分候補取得 API を呼び出す
3. 施設選択後またはフィルタ変更時に個別部署マスタ一覧取得 API を呼び出す
4. テンプレートDL時にテンプレート取得 API、エクスポート時に一覧エクスポート API を呼び出す
5. ファイル選択後にインポートプレビュー API を呼び出し、追加または置換選択後にインポート実行 API を呼び出す
6. 新規作成・編集・削除時にそれぞれ対応する変更系 API を呼び出す

### 使用テーブル

| テーブル | 利用内容 | 主な項目 |
| --- | --- | --- |
| facilities | 施設候補の取得、施設存在確認 | facility_id, facility_name |
| users | 共有システム管理者アカウント判定、監査記録の実行ユーザー解決 | user_id, account_type |
| user_facility_assignments | 通常アカウントの対象施設割当判定 | user_id, facility_id, is_active, valid_from, valid_to |
| facility_feature_settings | 通常アカウントの対象施設における `hospital_dept_master_list` / `hospital_dept_master_edit` 提供有無判定 | facility_id, feature_code, is_enabled |
| user_facility_feature_settings | 通常アカウントのユーザー×対象施設単位の `hospital_dept_master_list` / `hospital_dept_master_edit` 利用可否判定 | user_facility_assignment_id, feature_code, is_enabled |
| ship_departments | 共通マスタ部門/部署候補の取得、名称解決 | ship_department_id, division_name, department_name |
| ship_room_categories | 共通マスタ諸室区分候補の取得、名称解決 | ship_room_category_id, room_category1, room_category2 |
| facility_locations | 現行ロケーションの正本 | facility_location_id, facility_id, division_id, department_id, room_id, building, floor, department_name, section_name, room_name, ship_department_id, ship_room_category_id, deleted_at |
| facility_location_remodels | リモデル先ロケーション | facility_location_id, target_ship_department_id, target_ship_room_category_id, target_building, target_floor, target_department_name, target_section_name, target_room_name, target_room_count, deleted_at |

## 第3章 共通仕様

### API共通仕様

- 通信方式: HTTPS
- データ形式: JSON（Excel入出力を除く）
- ファイルアップロード: multipart/form-data
- 文字コード: UTF-8
- 日時形式: ISO 8601（例: `2026-04-18T00:00:00Z`）
- 一覧取得では `deleted_at IS NULL` の未削除データのみ対象とする
- 共有システム管理者アカウントは、対象施設が未削除である限り通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による認可判定をバイパスする

### 認証方式

ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。

### 権限モデル

本API群で使用する `feature_code` は以下の通りとする。通常アカウントでは、対象施設に対する `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）では、対象施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず、`hospital_dept_master_list` / `hospital_dept_master_edit` を有効として扱う。画面表示用の `/auth/context` は UX 用キャッシュであり、各業務 API でも同条件を再判定する。

| 管理単位名 | feature_code | 対象処理 |
| --- | --- | --- |
| 個別部署マスタ / 一覧 | `hospital_dept_master_list` | 施設候補取得、SHIP候補取得、一覧取得、エクスポート、テンプレート取得 |
| 個別部署マスタ / 新規作成・編集 | `hospital_dept_master_edit` | インポートプレビュー、インポート実行、新規作成、更新、削除 |

| 処理 | 必要 feature_code | 判定テーブル | 説明 |
| --- | --- | --- | --- |
| 施設候補取得 / SHIP候補取得 / 一覧取得 / エクスポート / テンプレート取得 | `hospital_dept_master_list` | 通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`。共有システム管理者: `users`, `facilities` | 一覧参照系処理 |
| インポートプレビュー / インポート実行 / 新規作成 / 更新 / 削除 | `hospital_dept_master_edit` | 通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`。共有システム管理者: `users`, `facilities` | 変更系処理 |

### 対象施設ベースの認可

- 対象施設候補取得 API は、通常アカウントでは `user_facility_assignments` 上の有効担当施設のうち対象施設に対して実効 `hospital_dept_master_list` を持つ施設のみ返却し、共有システム管理者アカウントでは未削除の全施設を候補として返却する
- `facilityId` を受ける参照系 API は、通常アカウントでは指定施設に対する実効 `hospital_dept_master_list` を都度再判定し、共有システム管理者アカウントでは指定施設が未削除であれば通常判定をバイパスする
- `facilityId` を受ける変更系 API は、通常アカウントでは指定施設に対する実効 `hospital_dept_master_edit` を都度再判定し、共有システム管理者アカウントでは指定施設が未削除であれば通常判定をバイパスする
- 一覧取得・エクスポートで `facilityId` 未指定かつ対象施設を1件に確定できない場合は 400 を返却する
- 対象施設が `facilities.deleted_at IS NOT NULL` の場合は 404 を返却する

### ファイル入出力仕様

- インポート対象拡張子は `.xlsx` / `.xls` とする
- テンプレートとエクスポートは同一列定義を採用する
- 追加または置換の本取込は、`errorCount=0` かつ `validRowCount>0` のプレビューに対してのみ実行する
- 置換は選択施設分のみを対象とし、他施設データは変更しない

| No. | 列名 | 取込時必須 | 用途 |
| --- | --- | --- | --- |
| 1 | ID | - | 個別部署マスタ行識別子。エクスポート時に出力し、インポート時は採用しない |
| 2 | 病院ID | ✓ | 選択施設の `facilities.facility_code` |
| 3 | 病院名 | ✓ | 選択施設の `facilities.facility_name` |
| 4 | 旧_SHIP部門 | - | 旧側の共通SHIP部門名 |
| 5 | 旧_SHIP部署 | - | 旧側の共通SHIP部署名 |
| 6 | 旧_SHIP諸室区分① | - | 旧側の共通SHIP諸室区分① |
| 7 | 諸室区分② | - | 旧側の共通SHIP諸室区分② |
| 8 | 部門ID | - | 旧側の部門ID |
| 9 | 旧_部署ID | ✓ | 旧側の部署ID |
| 10 | 諸室ID | - | 旧側の諸室ID |
| 11 | 新_棟 | - | リモデル先の棟 |
| 12 | 新_フロア | - | リモデル先のフロア |
| 13 | 新_部門 | - | リモデル先の部門 |
| 14 | 新_部署 | - | リモデル先の部署 |
| 15 | 新_室名称 | - | リモデル先の室名称 |
| 16 | 新_室数 | - | リモデル先の室数 |
| 17 | 旧_棟 | - | 旧側の棟 |
| 18 | 旧_フロア | ✓ | 旧側のフロア |
| 19 | 旧_部門 | ✓ | 旧側の部門 |
| 20 | 旧_部署 | - | 旧側の部署 |
| 21 | 旧_室名称 | ✓ | 旧側の室名称 |
| 22 | 新_SHIP部門 | - | リモデル先の共通SHIP部門名 |
| 23 | 新_SHIP部署 | - | リモデル先の共通SHIP部署名 |
| 24 | 新_SHIP諸室区分 | - | リモデル先の共通SHIP諸室区分 |

### エラーレスポンス仕様

#### 基本エラーレスポンス（ErrorResponse）

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| code | string | ✓ | エラーコード |
| message | string | ✓ | 利用者向けエラーメッセージ |
| details | string[] | - | 入力エラーや補足情報 |

## 第4章 API一覧

### 個別部署マスタ（/hospital-facility-master）

| 機能名 | Method | Path | 概要 | 認証 |
| --- | --- | --- | --- | --- |
| 対象施設候補取得 | GET | /hospital-facility-master/facilities | 施設候補を取得する | 要 |
| SHIP部署候補取得 | GET | /hospital-facility-master/ship-departments | 共通マスタの部門/部署候補を取得する | 要 |
| SHIP諸室区分候補取得 | GET | /hospital-facility-master/ship-room-categories | 共通マスタの諸室区分候補を取得する | 要 |
| 個別部署マスタ一覧取得 | GET | /hospital-facility-master/departments | 選択施設の個別部署マスタ一覧を取得する | 要 |
| 個別部署マスタエクスポート | GET | /hospital-facility-master/departments/export | 絞り込み結果を Excel 出力する | 要 |
| 個別部署マスタテンプレート取得 | GET | /hospital-facility-master/departments/template | インポート用テンプレートを取得する | 要 |
| 個別部署マスタインポートプレビュー | POST | /hospital-facility-master/departments/import-preview | Excel 取込内容を検証してプレビューを返す | 要 |
| 個別部署マスタインポート実行 | POST | /hospital-facility-master/departments/import | 追加/置換インポートを実行する | 要 |
| 個別部署マスタ新規作成 | POST | /hospital-facility-master/departments | 個別部署マスタ1行を新規登録する | 要 |
| 個別部署マスタ更新 | PUT | /hospital-facility-master/departments/{facilityLocationId} | 個別部署マスタ1行を更新する | 要 |
| 個別部署マスタ削除 | DELETE | /hospital-facility-master/departments/{facilityLocationId} | 個別部署マスタ1行を削除する | 要 |

## 第5章 個別部署マスタ機能設計

### getHospitalFacilityMasterFacilities

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、未削除の全施設を候補として扱い、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `hospital_dept_master_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、`user_facility_assignments` 上の有効担当施設が1件以上あること
- 認可条件: 通常アカウントの場合、各候補施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `hospital_dept_master_list` が有効であること

#### 処理仕様

1. 共有システム管理者アカウントの場合は、`facilities.deleted_at IS NULL` の未削除施設を対象にする
2. 通常アカウントの場合は、`user_facility_assignments` の有効割当施設のみを対象にする
3. `facilities.deleted_at IS NULL` の未削除施設のみ返却する
4. 通常アカウントでは各施設について実効 `hospital_dept_master_list` を再判定し、有効な施設のみ返却する
5. キーワード指定時は施設名の部分一致で絞り込む

### getHospitalFacilityMasterShipDepartments

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、未削除施設が存在することを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `hospital_dept_master_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、`user_facility_assignments` 上の有効担当施設が1件以上あること
- 認可条件: 通常アカウントの場合、有効な担当施設のうち少なくとも1件で `hospital_dept_master_list` が有効であること

#### 処理仕様

1. `ship_departments.is_active=true` の有効レコードを返却する
2. 個別部署マスタ画面の共通マスタ候補として利用するため、対象施設ごとの差分公開設定は適用しない

### getHospitalFacilityMasterShipRoomCategories

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、未削除施設が存在することを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `hospital_dept_master_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、`user_facility_assignments` 上の有効担当施設が1件以上あること
- 認可条件: 通常アカウントの場合、有効な担当施設のうち少なくとも1件で `hospital_dept_master_list` が有効であること

#### 処理仕様

1. `ship_room_categories.is_active=true` の有効レコードを返却する
2. 個別部署マスタ画面の共通マスタ候補として利用するため、対象施設ごとの差分公開設定は適用しない

### getHospitalFacilityMasterDepartments

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、指定 `facilityId` または自動確定された対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `hospital_dept_master_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、指定 `facilityId` または自動確定された対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `hospital_dept_master_list` が有効であること

#### 処理仕様

1. `facilityId` 未指定時は、通常アカウントでは実効 `hospital_dept_master_list` を持つ対象施設、共有システム管理者アカウントでは未削除施設が1件に確定できる場合のみ自動適用する
2. 対象施設が存在し、未削除であることを確認する
3. 対象施設の `facility_locations` を取得する
4. `facility_location_remodels` を左外部結合し、1行DTOとして返却する
5. 部門・部署フィルタは SHIP標準名称ベースで絞り込む

### getHospitalFacilityMasterDepartmentsExport

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、指定 `facilityId` または自動確定された対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `hospital_dept_master_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、指定 `facilityId` または自動確定された対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `hospital_dept_master_list` が有効であること

#### 処理仕様

1. `facilityId` 未指定時は、通常アカウントでは実効 `hospital_dept_master_list` を持つ対象施設、共有システム管理者アカウントでは未削除施設が1件に確定できる場合のみ自動適用する
2. 対象施設が存在し、未削除であることを確認する
3. 一覧取得と同一条件で対象行を抽出する
4. テンプレートと同一列順で Excel を生成する

### getHospitalFacilityMasterDepartmentsTemplate

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、未削除施設が存在することを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `hospital_dept_master_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、`user_facility_assignments` 上の有効担当施設が1件以上あること
- 認可条件: 通常アカウントの場合、有効な担当施設のうち少なくとも1件で `hospital_dept_master_list` が有効であること

#### 処理仕様

1. エクスポートと同一列定義のヘッダーのみを返却する

### postHospitalFacilityMasterDepartmentsImportPreview

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、指定 `facilityId` が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `hospital_dept_master_edit` 判定をバイパスする
- 認可条件: 通常アカウントの場合、指定 `facilityId` について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、指定 `facilityId` について `facility_feature_settings` と `user_facility_feature_settings` の両方で `hospital_dept_master_edit` が有効であること

#### 処理仕様

1. 対象施設が存在し、未削除であることを確認する
2. テンプレート列定義に基づきヘッダーと各行を検証する
3. テンプレート列のうち `旧_部署ID` / `旧_フロア` / `旧_部門` / `旧_室名称` は必須とし、未入力行は取込不可行として `errors` に行番号とエラー内容を返却する
4. ファイル内の同一 `旧_部署ID` 行では `旧_部門` / `旧_部署` が一致することを確認し、不一致行は取込不可行として `errors` に返却する
5. ヘッダーを除き、テンプレート対象列のいずれかに値を持つ非空データ行が0件の場合は `IMPORT_FILE_INVALID` として 400 を返却する。空行は無視する
6. Excel の `病院ID` / `病院名` は、`facilityId` で特定した `facilities.facility_code` / `facilities.facility_name` と前後空白除去後に完全一致することを確認する
7. 病院ID / 病院名が未入力、不一致、または複数施設混在の場合はファイル単位の `IMPORT_FILE_INVALID` として 400 を返却し、`errors` と `previewToken` は返却しない
8. 非空データ行が存在し、全行が行検証エラーの場合は `validRowCount=0`、`errorCount>0`、`errors` あり、`previewToken` なしの 200 を返却する
9. `errorCount=0` かつ `validRowCount>0` の場合のみ、後続の本取込で使う `previewToken` を返却する

### postHospitalFacilityMasterDepartmentsImport

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、指定 `facilityId` が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `hospital_dept_master_edit` 判定をバイパスする
- 認可条件: 通常アカウントの場合、指定 `facilityId` について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、指定 `facilityId` について `facility_feature_settings` と `user_facility_feature_settings` の両方で `hospital_dept_master_edit` が有効であること

#### 処理仕様

1. 対象施設が存在し、未削除であることを確認する
2. `previewToken` が指定施設の `errorCount=0` かつ `validRowCount>0` の有効なプレビューに対応することを確認し、未指定または無効な場合は 400 を返却する
3. `ADD` は既存データへ追記する
4. `REPLACE` は選択施設分の `facility_locations` と関連 `facility_location_remodels` を置き換える
5. 反映後の未削除行について、同一施設・同一 `department_id` の `department_name` / `section_name` が一致しない場合は 409 を返し、取込全体を取り消す
6. 反映後、インポート結果件数を返却する

### postHospitalFacilityMasterDepartments

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、指定 `facilityId` が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `hospital_dept_master_edit` 判定をバイパスする
- 認可条件: 通常アカウントの場合、指定 `facilityId` について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、指定 `facilityId` について `facility_feature_settings` と `user_facility_feature_settings` の両方で `hospital_dept_master_edit` が有効であること

#### 処理仕様

1. 対象施設が存在し、未削除であることを確認する
2. 同一施設・同一 `departmentId` の未削除行がある場合、`departmentName` / `sectionName` が一致することを確認する
3. `facility_locations` に現行ロケーションを新規作成する
4. リモデル先項目が1つ以上入力されている場合は `facility_location_remodels` を同時作成する
5. リモデル先未入力の場合は子レコードを作成しない

### putHospitalFacilityMasterDepartmentsByFacilityLocationId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、対象 `facility_locations.facility_id` の施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `hospital_dept_master_edit` 判定をバイパスする
- 認可条件: 通常アカウントの場合、対象 `facility_locations.facility_id` について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象 `facility_locations.facility_id` について `facility_feature_settings` と `user_facility_feature_settings` の両方で `hospital_dept_master_edit` が有効であること

#### 処理仕様

1. 対象 `facility_locations` が未削除で存在することを確認する
2. 対象 `facility_locations.facility_id` の施設が未削除であることを確認する
3. 更新後に同一施設・同一 `departmentId` となる未削除行がある場合、`departmentName` / `sectionName` が一致することを確認する
4. 現行ロケーションを更新する
5. 新側項目が入力されていれば `facility_location_remodels` を作成または更新し、すべて空なら削除または論理削除する

### deleteHospitalFacilityMasterDepartmentsByFacilityLocationId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、対象 `facility_locations.facility_id` の施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `hospital_dept_master_edit` 判定をバイパスする
- 認可条件: 通常アカウントの場合、対象 `facility_locations.facility_id` について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、対象 `facility_locations.facility_id` について `facility_feature_settings` と `user_facility_feature_settings` の両方で `hospital_dept_master_edit` が有効であること

#### 処理仕様

1. 対象 `facility_locations` が未削除で存在することを確認する
2. 対象 `facility_locations.facility_id` の施設が未削除であることを確認する
3. 対象 `facility_locations` を論理削除する
4. 関連する `facility_location_remodels` も同時に論理削除する

## 第6章 権限・業務ルール

### 必要権限

| 処理 | 必要 feature_code | 判定基準 | 説明 |
| --- | --- | --- | --- |
| 対象施設候補取得 / SHIP候補取得 / 一覧取得 / エクスポート / テンプレート取得 | `hospital_dept_master_list` | 通常アカウントは対象施設または有効担当施設に対して実効 `hospital_dept_master_list` を持つこと。共有システム管理者は対象施設が未削除であれば許可 | 一覧参照と画面利用開始に必要 |
| インポートプレビュー / インポート実行 / 新規作成 / 更新 / 削除 | `hospital_dept_master_edit` | 通常アカウントは対象施設に対して実効 `hospital_dept_master_edit` を持つこと。共有システム管理者は対象施設が未削除であれば許可 | 変更系処理に必要 |

### リモデル子レコード運用ルール

- 現行ロケーションは `facility_locations` を正本とする
- 1つの現行ロケーションに対して有効な `facility_location_remodels` は 0..1 件とする
- 新側項目が全て空の場合は子レコードを作成しない、または既存子レコードを削除する

### 部署ID名称整合ルール

- 同一施設・同一 `department_id` の未削除行では `department_name` / `section_name` を一致させ、登録・更新・インポートで不一致を拒否する

### インポート運用ルール

- 追加インポートは既存データへ追記する
- 置換インポートは選択施設分のみを置き換える
- テンプレート列定義と一致しない場合はプレビュー段階でエラーとする
- `旧_部署ID` / `旧_フロア` / `旧_部門` / `旧_室名称` は必須列とし、未入力行はプレビュー段階で取込不可行として扱う
- 空行を除く非空データ行が0件のファイルはプレビューを生成しない
- ファイル内の施設情報が選択施設と一致しない場合は、ファイル単位のエラーとする
- 本取込は `errorCount=0` かつ `validRowCount>0` のプレビューのみ許可し、正常行だけの部分取込は行わない

## 第7章 エラーコード一覧

| エラーコード | HTTP | 説明 |
| --- | --- | --- |
| VALIDATION_ERROR | 400 | 入力不正、必須不足、形式不正 |
| FACILITY_SELECTION_REQUIRED | 400 | 施設未選択で一覧/出力/取込を要求した |
| IMPORT_FILE_INVALID | 400 | 取込ファイル形式不正、ヘッダー不正、非空データ行が0件、または選択施設との不一致 |
| UNAUTHORIZED | 401 | 認証トークン未付与または無効 |
| AUTH_403_HOSPITAL_DEPT_MASTER_LIST_DENIED | 403 | 通常アカウントで対象施設に対する実効 `hospital_dept_master_list` がない、または実効 `hospital_dept_master_list` を持つ担当施設がない。共有システム管理者では対象施設が未削除であれば通常権限判定をバイパスする |
| AUTH_403_HOSPITAL_DEPT_MASTER_EDIT_DENIED | 403 | 通常アカウントで対象施設に対する実効 `hospital_dept_master_edit` がない。共有システム管理者では対象施設が未削除であれば通常権限判定をバイパスする |
| FACILITY_NOT_FOUND | 404 | 対象施設が存在しない、または削除済み |
| FACILITY_LOCATION_NOT_FOUND | 404 | 対象施設ロケーションが存在しない、または削除済み |
| DEPARTMENT_ID_NAME_CONFLICT | 409 | 同一施設・同一部署IDの部門名または部署名が既存の未削除行と一致しない |
| INTERNAL_SERVER_ERROR | 500 | サーバー内部エラー |

## 第8章 運用・保守方針

### マスタ保守方針

- 個別部署マスタは施設単位で保守する
- SHIP部署・諸室区分は標準候補として利用し、現有品調査/調査登録内容修正の部門・部署正本は `facility_locations` 側とする
- 削除済みデータは一覧、エクスポート、候補表示の対象外とする
