# SHIP施設マスタ API内部設計

## 第1章 概要

### 本書の目的

本書は、SHIP施設マスタ画面（`/ship-facility-master`）で利用する API の設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。

特に以下を明確にする。

- 一覧表示および絞り込み条件の I/F
- 経営主体候補取得と新規経営主体登録ルール
- 施設マスタの新規作成・更新・削除 I/F
- エクスポート処理の I/F
- 権限・バリデーション・エラーレスポンス

### 対象システム概要

SHIP施設マスタは、医療機関コード、施設名、経営主体、所在地、認定情報、諸室情報、病床情報を固定カラムとして参照・管理する画面である。ヘッダーの表示件数、一覧絞り込み、エクスポート、新規作成、編集、削除を提供する。

経営主体は `establishments.establishment_name` を画面表示名として扱う。既存候補から選択でき、新規名称が入力された場合は `establishments` 登録後に施設へ紐づける。

### 用語定義

| 用語 | 説明 |
| --- | --- |
| SHIP施設マスタ | SHIP側で参照・管理する施設マスタ画面およびその対象データ |
| 経営主体 | 施設の上位組織。保存元は `establishments` であり、画面・API上は経営主体として扱う |
| 施設マスタ | 医療機関コード、施設名、都道府県、総病床数などを保持する `facilities` と、認定情報・諸室情報・病床内訳を保持する `facility_details` の業務概念 |
| 施設詳細 | SHIP施設マスタ画面の固定カラムのうち `facilities` に含まれない詳細属性を1施設1行で保持する `facility_details` |
| 作業対象施設 | 認可判定の基準となる選択中施設。Bearer トークン上のコンテキストとして扱う |

### 対象画面

| 項目 | 内容 |
| --- | --- |
| 画面名 | 18. SHIP施設マスタ画面 |
| 画面URL | /ship-facility-master |
| 主機能 | 施設一覧の検索、経営主体候補取得、エクスポート、施設作成、更新、削除 |

## 第2章 システム全体構成

### APIの位置づけ

本API群は、SHIP施設マスタ画面の一覧参照、経営主体候補取得、エクスポート、施設登録、施設更新、施設削除を提供する。権限管理画面のAPIは権限管理 API 設計書で扱い、本書の対象外とする。

画面は `facilities`、`facility_details`、`establishments` を参照する。登録・更新では `facilities` と `facility_details` を同一トランザクションで保存し、経営主体の新規入力時のみ `establishments` の作成を伴う。

### 画面とAPIの関係

1. 画面初期表示およびフィルタ変更時に施設マスタ一覧取得 API を呼び出す
2. 経営主体コンボボックス表示時に経営主体候補取得 API を呼び出す
3. エクスポート押下時にエクスポート API を呼び出す
4. 新規作成モーダルの登録押下時に施設マスタ新規作成 API を呼び出す
5. 編集モーダルの更新押下時に施設マスタ更新 API を呼び出す
6. 削除確認モーダルの OK 押下時に施設マスタ削除 API を呼び出す

### 使用テーブル

| テーブル | 用途 | 主な利用カラム |
| --- | --- | --- |
| establishments | 経営主体候補表示、新規経営主体登録 | establishment_id, establishment_name |
| facilities | 一覧表示、施設登録、施設更新、施設削除、作業対象施設の存在確認と論理削除判定 | facility_id, establishment_id, facility_code（医療機関コード）, facility_name, prefecture, bed_count（総病床数）, system_contract_status, deleted_at |
| facility_details | 一覧表示、施設詳細登録、施設詳細更新 | facility_id, city, secondary_medical_area_name, rebuild_fiscal_year, building_area, 認定情報, 諸室情報, 病床内訳, created_at, updated_at |
| users | 共有システム管理者アカウント判定、監査記録の実行ユーザー解決 | user_id, account_type |
| user_facility_assignments | 通常アカウントの作業対象施設割当判定 | user_id, facility_id, is_active, valid_from, valid_to |
| facility_feature_settings | 通常アカウントの作業対象施設における `facility_master_list` / `facility_master_edit` 提供有無判定 | facility_id, feature_code, is_enabled |
| user_facility_feature_settings | 通常アカウントのユーザー×作業対象施設単位の `facility_master_list` / `facility_master_edit` 利用可否判定 | user_facility_assignment_id, feature_code, is_enabled |

## 第3章 共通仕様

### API共通仕様

- 通信方式: HTTPS
- データ形式: JSON（エクスポートAPIを除く）
- 文字コード: UTF-8
- 日時形式: ISO 8601（例: `2026-04-17T00:00:00Z`）
- 論理削除済みデータは対象外とする。`facilities.deleted_at` が設定済みの施設は一覧・エクスポート・施設認可判定対象外とし、`establishments.deleted_at` が設定済みの経営主体は経営主体候補対象外とする
- 施設論理削除時も関連する担当施設割当・認可・他施設公開設定は保持し、施設復活時は既存設定を再利用する
- 共有システム管理者アカウントは、作業対象施設が未削除である限り通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による認可判定をバイパスする
- 医療機関コードは `facilities.facility_code` に保持し、論理削除済み施設を含む `facilities` 全件で一意とし、再利用しない
- SHIP施設マスタ画面の一覧固定カラムはすべて必須値として扱い、登録・更新リクエストで未指定または空値の場合は `VALIDATION_ERROR` を返却する
- `facility_details` は `facilities.facility_id` と同値の `facility_id` をPK兼FKとして1施設1行で保持する
- 本API稼働時点では未削除 `facilities` 全件に対応する `facility_details` が存在する前提とする。欠落を検知した場合はデータ不整合として 500 `INTERNAL_SERVER_ERROR` を返却し、一覧・エクスポートから当該施設だけを除外して正常応答しない

### 認証方式

ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。

### 権限モデル

本API群で使用する `feature_code` は以下の通りとする。通常アカウントでは、Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）では、作業対象施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず、`facility_master_list` / `facility_master_edit` を有効として扱う。削除済み施設は `/auth/me`、`/auth/context`、業務 API の対象外とする。

| 管理単位名 | feature_code | 対象処理 |
| --- | --- | --- |
| 施設マスタ / 一覧 | `facility_master_list` | 一覧表示、経営主体候補取得、エクスポート |
| 施設マスタ / 新規作成・編集 | `facility_master_edit` | 新規作成、更新、削除 |

| 処理 | 必要 feature_code | 判定テーブル | 説明 |
| --- | --- | --- | --- |
| 一覧表示 / 経営主体候補取得 / エクスポート | `facility_master_list` | 通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`。共有システム管理者: `users`, `facilities` | 一覧参照系の処理 |
| 新規作成 / 更新 / 削除 | `facility_master_edit` | 通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings`。共有システム管理者: `users`, `facilities` | 施設マスタ管理処理 |

### 作業対象施設ベースの認可

- 各 API は Bearer トークン上の作業対象施設を認可コンテキストとして扱い、作業対象施設が存在しない、または `facilities.deleted_at IS NOT NULL` の場合は 404 とする
- 通常アカウントでは、作業対象施設に対する実効 `feature_code` を都度再判定する。共有システム管理者アカウントでは、作業対象施設が未削除であれば通常判定をバイパスする
- 一覧・エクスポートの返却対象は施設マスタ全件とし、個票データ閲覧で用いる他施設公開設定は適用しない
- 新規作成・更新・削除の対象施設は作業対象施設と一致している必要はない。作業対象施設は認可基準、`facilityId` は施設マスタ上の更新対象として扱う
- 通常アカウントで作業対象施設に対して必要な実効 `feature_code` がない場合は 403 を返却する

### 検索・絞り込み仕様

- 都道府県、経営主体、医療機関コード、施設名は AND 条件で絞り込む
- 文字列検索は部分一致とする
- 表示件数は絞り込み後件数をそのまま返却する
- 画面要件上ページングは定義しない

### エラーレスポンス仕様

#### 基本エラーレスポンス（ErrorResponse）

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| code | string | ✓ | エラーコード |
| message | string | ✓ | 利用者向けエラーメッセージ |
| details | string[] | - | 入力エラーや補足情報 |

## 第4章 API一覧

### SHIP施設マスタ（/ship-facility-master）

| 機能名 | Method | Path | 概要 | 認証 |
| --- | --- | --- | --- | --- |
| 施設マスタ一覧取得 | GET | /ship-facility-master/facilities | 施設一覧と表示件数を取得する | 要 |
| 経営主体候補取得 | GET | /ship-facility-master/establishments | 経営主体コンボボックス用の候補を取得する | 要 |
| 施設マスタエクスポート | GET | /ship-facility-master/facilities/export | 現在の絞り込み条件で Excel を出力する | 要 |
| 施設マスタ新規作成 | POST | /ship-facility-master/facilities | 施設マスタを新規登録する | 要 |
| 施設マスタ更新 | PUT | /ship-facility-master/facilities/{facilityId} | 施設マスタを更新する | 要 |
| 施設マスタ削除 | DELETE | /ship-facility-master/facilities/{facilityId} | 施設マスタを削除する | 要 |

## 第5章 SHIP施設マスタ機能設計

### getShipFacilityMasterFacilities

#### 権限

- 認可条件: Bearer トークンが有効であること
- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `facility_master_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `facility_master_list` が有効であること

#### 処理仕様

1. 作業対象施設が存在し、未削除であることを確認する
2. `facilities.deleted_at IS NULL` のみを対象にする
3. `establishments` を結合して経営主体名を取得する
4. `facility_details` を `facilities.facility_id = facility_details.facility_id` で結合し、固定カラムの詳細属性を取得する
5. 未削除施設に対応する `facility_details` が存在しない場合は、データ不整合として 500 `INTERNAL_SERVER_ERROR` を返却する
6. 都道府県・経営主体・医療機関コード・施設名は AND 条件で絞り込む
7. 画面要件上ページングは定義しない

### getShipFacilityMasterEstablishments

#### 権限

- 認可条件: Bearer トークンが有効であること
- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `facility_master_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `facility_master_list` が有効であること

#### 処理仕様

1. 作業対象施設が存在し、未削除であることを確認する
2. `establishments.deleted_at IS NULL` のみを対象にする
3. keyword 指定時は経営主体名を部分一致で絞り込む

### getShipFacilityMasterFacilitiesExport

#### 権限

- 認可条件: Bearer トークンが有効であること
- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `facility_master_list` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `facility_master_list` が有効であること

#### 処理仕様

1. 作業対象施設が存在し、未削除であることを確認する
2. 一覧取得と同じ絞り込み条件を適用する
3. 出力対象は `facilities.deleted_at IS NULL` の未削除施設のみとする
4. `establishments` と `facility_details` を結合し、SHIP施設マスタ画面の固定カラムを一覧表示順で出力する
5. 未削除施設に対応する `facility_details` が存在しない場合は、データ不整合として 500 `INTERNAL_SERVER_ERROR` を返却する

### postShipFacilityMasterFacilities

#### 権限

- 認可条件: Bearer トークンが有効であること
- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `facility_master_edit` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `facility_master_edit` が有効であること

#### 処理仕様

1. 作業対象施設が存在し、未削除であることを確認する
2. `establishmentId` と `newEstablishmentName` はどちらか一方を必須とし、両方指定・両方未指定は入力エラーとする
3. 既存の経営主体が選択された場合は、`establishments.deleted_at IS NULL` の未削除経営主体だけを有効とし、存在しないまたは削除済みなら 404 `ESTABLISHMENT_NOT_FOUND` とする
4. 既存の経営主体が選択された場合は、その経営主体IDを `facilities.establishment_id` に設定して施設を登録する
5. 新規の経営主体名が入力され、未削除の `establishments` に同一名称（完全一致）が存在する場合は既存の `establishment_id` を利用し、新規登録しない
6. 新規の経営主体名が入力され、未削除の同一名称（完全一致）が存在しない場合のみ `establishments` に新規登録後、そのIDを施設へ紐づける
7. `medicalInstitutionCode` は `facilities.facility_code` として保持し、論理削除済み施設を含む `facilities` 全件で一意とする。重複する場合は登録エラーとする
8. 一覧固定カラムの入力項目はすべて必須とし、未指定、空文字、数値項目の負数、区分値の不正値は 400 `VALIDATION_ERROR` とする
9. boolean 認定項目は true/false の明示指定を必須とし、未認定は false とする
10. 2次救急・3次救急病院認定区分は `NONE` / `SECONDARY` / `TERTIARY` / `SECONDARY_TERTIARY` のいずれかを必須とする
11. 周産期母子医療センター認定区分は `NONE` / `GENERAL` / `REGIONAL` のいずれかを必須とする
12. 諸室数・病床数は0以上の整数を必須とし、0は明示的になしとして扱う。NULLは許可しない
13. `facilities` と `facility_details` を同一トランザクションで登録する。`facility_details.facility_id` は登録した `facilities.facility_id` と同値のPK兼FKとする
14. `facilities.deleted_at` は `NULL` で登録する

### putShipFacilityMasterFacilitiesByFacilityId

#### 権限

- 認可条件: Bearer トークンが有効であること
- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `facility_master_edit` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `facility_master_edit` が有効であること

#### 処理仕様

1. 作業対象施設が存在し、未削除であることを確認する
2. 対象施設が存在し、未削除であることを確認する
3. `establishmentId` と `newEstablishmentName` はどちらか一方を必須とし、両方指定・両方未指定は入力エラーとする
4. 経営主体が既存候補へ変更された場合は、`establishments.deleted_at IS NULL` の未削除経営主体だけを有効とし、存在しないまたは削除済みなら 404 `ESTABLISHMENT_NOT_FOUND` とする
5. 経営主体が既存候補へ変更された場合は、施設の紐づけ先のみ更新する
6. 経営主体が新規名称へ変更され、未削除の `establishments` に同一名称（完全一致）が存在する場合は既存の `establishment_id` へ紐づけ先を更新し、新規登録しない
7. 経営主体が新規名称へ変更され、未削除の同一名称（完全一致）が存在しない場合のみ `establishments` 登録後に施設の紐づけ先を更新する
8. `medicalInstitutionCode` は `facilities.facility_code` として保持し、論理削除済み施設を含む `facilities` 全件で一意とする。自身以外の他レコードと重複する場合は更新エラーとする
9. 一覧固定カラムの入力項目はすべて必須とし、未指定、空文字、数値項目の負数、区分値の不正値は 400 `VALIDATION_ERROR` とする
10. boolean 認定項目は true/false の明示指定を必須とし、未認定は false とする
11. 2次救急・3次救急病院認定区分は `NONE` / `SECONDARY` / `TERTIARY` / `SECONDARY_TERTIARY` のいずれかを必須とする
12. 周産期母子医療センター認定区分は `NONE` / `GENERAL` / `REGIONAL` のいずれかを必須とする
13. 諸室数・病床数は0以上の整数を必須とし、0は明示的になしとして扱う。NULLは許可しない
14. `facilities` と `facility_details` を同一トランザクションで更新する。既存施設に `facility_details` が存在しない場合は、必須入力値を用いて同一 `facility_id` の詳細行を作成する
15. `facilities.updated_at` と `facility_details.updated_at` を更新する

### deleteShipFacilityMasterFacilitiesByFacilityId

#### 権限

- 認可条件: Bearer トークンが有効であること
- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による `facility_master_edit` 判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `facility_master_edit` が有効であること

#### 処理仕様

1. 作業対象施設が存在し、未削除であることを確認する
2. 対象施設が存在し、未削除であることを確認する
3. `facilities.deleted_at` に削除日時を設定する
4. `facility_details` は削除せず、施設削除状態は `facilities.deleted_at` で一元管理する
5. 関連する担当施設割当・認可・他施設公開設定は本APIで更新・削除しない
6. `establishments` は削除対象としない
7. 削除済み施設は施設一覧・施設エクスポート・施設認可判定・業務データ参照の対象外とする。経営主体候補の除外条件は `establishments.deleted_at IS NOT NULL` とする
8. 再契約等で施設を復活させる場合は、既存施設レコードの `deleted_at` を解除して再利用する

## 第6章 権限・業務ルール

### 必要権限

| 処理 | 必要 feature_code | 判定基準 | 説明 |
| --- | --- | --- | --- |
| 一覧表示 | `facility_master_list` | 通常アカウントは作業対象施設に対して実効 `facility_master_list` を持つこと。共有システム管理者は作業対象施設が未削除であれば許可 | 施設一覧と表示件数を参照する |
| 経営主体候補取得 | `facility_master_list` | 通常アカウントは作業対象施設に対して実効 `facility_master_list` を持つこと。共有システム管理者は作業対象施設が未削除であれば許可 | 既存経営主体候補を取得する |
| エクスポート | `facility_master_list` | 通常アカウントは作業対象施設に対して実効 `facility_master_list` を持つこと。共有システム管理者は作業対象施設が未削除であれば許可 | 絞り込み結果を Excel で取得する |
| 新規作成 / 更新 / 削除 | `facility_master_edit` | 通常アカウントは作業対象施設に対して実効 `facility_master_edit` を持つこと。共有システム管理者は作業対象施設が未削除であれば許可 | 施設マスタを管理する |

### 経営主体登録ルール

- `establishmentId` と `newEstablishmentName` は排他的必須とし、両方指定・両方未指定は `VALIDATION_ERROR` とする
- 既存経営主体ID指定時は `establishments.deleted_at IS NULL` の未削除経営主体のみ有効とし、存在しないまたは削除済みの場合は `ESTABLISHMENT_NOT_FOUND` を返す
- 既存経営主体を選択した場合は、選択した `establishments.establishment_id` を施設へ紐づける
- 新規名称が入力された場合、未削除の `establishments` に同一名称（完全一致）が存在すれば既存レコードを利用し、存在しない場合のみ `establishments` を登録して施設へ紐づける
- 更新時に経営主体が変更された場合も同じルールを適用する

### 医療機関コード管理ルール

- 医療機関コードは `facilities.facility_code` として保持し、論理削除済み施設を含む `facilities` 全件で一意とする
- 施設論理削除後も医療機関コードは再利用しない
- 再契約等で施設を復活させる場合は、既存施設レコードの `deleted_at` を解除して再利用する

### 削除ルール

- 削除対象は `facilities` のみとし、`establishments` は削除しない
- 削除は論理削除（`deleted_at` 更新）とする
- 関連する担当施設割当・認可・他施設公開設定は削除・無効化しない
- 論理削除済み施設は施設一覧、施設エクスポート、施設認可判定、業務データ参照の対象外とする。経営主体候補の除外条件は `establishments.deleted_at IS NOT NULL` とする
- 再契約等で施設を復活させる場合は既存施設レコードの `deleted_at` を解除し、保持済み設定を再利用する

### エクスポート出力ルール

- エクスポート API の出力列はSHIP施設マスタ画面の一覧固定カラムと同一とし、基本情報、認定情報、諸室情報、病床情報の順とする
- 検索条件、認可条件、論理削除済み施設の除外条件は一覧取得 API と同一とする

## 第7章 エラーコード一覧

| エラーコード | HTTP | 説明 |
| --- | --- | --- |
| VALIDATION_ERROR | 400 | 入力不正、条件付き必須不足、形式不正 |
| UNAUTHORIZED | 401 | 認証トークン未付与または無効 |
| AUTH_403_FACILITY_MASTER_LIST_DENIED | 403 | 通常アカウントで作業対象施設に対する実効 `facility_master_list` がない。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする |
| AUTH_403_FACILITY_MASTER_EDIT_DENIED | 403 | 通常アカウントで作業対象施設に対する実効 `facility_master_edit` がない。共有システム管理者では作業対象施設が未削除であれば通常権限判定をバイパスする |
| FACILITY_NOT_FOUND | 404 | 作業対象施設または対象施設が存在しない、または削除済み |
| ESTABLISHMENT_NOT_FOUND | 404 | 指定した経営主体が存在しない、または削除済み |
| MEDICAL_INSTITUTION_CODE_DUPLICATE | 409 | 論理削除済み施設を含めて医療機関コードが重複している |
| INTERNAL_SERVER_ERROR | 500 | サーバー内部エラー |

## 第8章 運用・保守方針

### マスタ保守方針

- 医療機関コードの一意性を維持し、論理削除後も再利用しない
- 新規経営主体名が未削除の既存経営主体名と完全一致する場合は既存レコードを利用し、重複行を作成しない
- 施設更新・削除後は一覧 API の返却結果に即時反映する

### エクスポート運用

- エクスポート対象は呼び出し時点の絞り込み結果とする
- ファイル名は `SHIP施設マスタ_YYYYMMDD.xlsx` とする
- エクスポートは同期応答で生成し、一覧取得 API と同一の検索条件・認可条件・論理削除除外条件を適用する
