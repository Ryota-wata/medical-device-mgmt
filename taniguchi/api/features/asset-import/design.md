# 資産台帳取込 API内部設計

## 第1章 概要

### 本書の目的

本書は、12. 資産台帳取込画面（`/asset-import`）および 13. 資産台帳とマスタの突き合わせ画面（`/asset-matching`）で利用する API の設計を定義する。資産台帳ファイルのアップロード、正式取込対象29カラム（A～AC）の保持、施設ロケーションIDの解決、取込ジョブ管理、失敗ジョブの再取込、台帳原本値を入力とする PoC2 保存済み LUKE Model A によるAI分類、ABC行のみのAI推薦付きマスタ突き合わせ、突き合わせ結果Excel 出力・取込、突き合わせ完了までを対象とする。見積金額・税項目は購入金額へ変換せず、固定資産台帳取込では値引き文字列判定を行わない。

### 対象画面

| 画面 | URL | 主機能 |
| --- | --- | --- |
| 12. 資産台帳取込画面 | /asset-import | 台帳ファイルのアップロード、未完了ジョブ確認、取込開始 |
| 13. 資産台帳とマスタの突き合わせ画面 | /asset-matching | 取込行と SHIP 資産マスタの紐づけ、確定、Excel 出力・取込、完了 |

## 第2章 システム全体構成

### 利用データ

| テーブル | 利用内容 | 主な項目 |
| --- | --- | --- |
| asset_import_jobs | 取込ジョブの作成、状態管理、件数表示、再取込元ファイル参照、失敗理由保持 | asset_import_job_id, facility_id, import_type, file_name, file_path, status, error_message |
| asset_import_rows | 取込行の正本、正式29カラム原文、施設ロケーション入力値・解決ID、台帳原本値、見積金額・税項目、内部AI分類、AI推薦、確定値、確定監査情報 | raw_data_json, parsed_facility_location_id, facility_location_id, parsed_original_asset_name, parsed_original_manufacturer_name, parsed_original_model_name, parsed_quotation_price_*, parsed_tax_category, parsed_tax_rate, parsed_*, ai_line_classification, ai_recommendation_required, suggested_ship_asset_master_id, suggested_*_name/_id, suggested_score, suggested_similarity_source, suggested_source_asset_ledger_id, selected_ship_asset_master_id, selected_*_name/_id, is_confirmed, confirmed_by_user_id, confirmed_at |
| facilities | 選択施設の解決、対象ジョブ施設の整合確認、共有システム管理者アカウントの未削除施設判定 | facility_id, facility_name, deleted_at |
| facility_locations | 施設ロケーションIDの解決、突き合わせ画面の個別部署マスタ候補、対象施設整合性検証 | facility_location_id, facility_id, building, floor, department_name, section_name, room_name, deleted_at |
| users | 取込実行/確定ユーザーの記録、共有システム管理者アカウント判定 | user_id, account_type |
| asset_categories / asset_large_classes / asset_medium_classes / asset_items | Category/分類/品目候補 | 各マスタID, 名称 |
| ship_asset_masters | AI推薦候補、ユーザー選択候補 | ship_asset_master_id, category_id, large_class_id, medium_class_id, asset_item_id, manufacturer_id, model_id, jmdn_registered_item_id |
| jmdn_registered_items / jmdn_classifications | JMDN由来候補の類似度計算 | product_name, manufacturer_name, general_name |
| asset_ledgers | 全施設の原本資産台帳由来候補の類似度計算 | asset_ledger_id, ship_asset_master_id, asset_name, manufacturer_name, model_name |
| manufacturers / models | メーカー/型式候補 | manufacturer_id, model_id, name |

### ジョブ状態遷移

- `PROCESSING`: 取込ジョブ作成直後。ファイル解析中
- `READY_FOR_MATCHING`: `asset_import_rows`、AI分類結果、ABC行の `suggested_*` の初期投入完了後。`D` / `OTHER` 行は推薦関連項目 null の状態で突き合わせ待ち
- `MATCHING_COMPLETED`: `/asset-matching` 完了後
- `FAILED`: 初期取込失敗。`/asset-matching` で失敗表示し、再取込またはアップロード画面復帰を行う

## 第3章 共通仕様

### API共通仕様

- 通信方式: HTTPS
- データ形式: JSON（アップロードAPI、Excel 出力API、Excel 取込APIを除く）
- 文字コード: UTF-8
- 日時形式: ISO 8601（例: `2026-04-18T00:00:00Z`）
- 論理削除済みの `asset_import_rows` は一覧・集計・出力対象外とする

### 認証方式

ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。

### 権限モデル

本API群で使用する `feature_code` は以下の通りとする。通常アカウントでは、Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で対象 `feature_code` が `is_enabled=true` の場合に API 実行を許可する。共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）では、作業対象施設または対象ジョブの施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず API 実行を許可する。画面表示用の `/auth/context` は UX 用キャッシュであり、各業務 API でも同条件を再判定する。

| 管理単位名 | feature_code | 対象処理 |
| --- | --- | --- |
| 資産台帳取込登録 | `asset_ledger_import` | 取込画面コンテキスト取得、ジョブ状態取得、ファイルアップロード、ジョブ再取込、ジョブ削除 |
| 現調台帳突合せ | `survey_ledger_matching` | 突き合わせ画面コンテキスト取得、一覧取得、候補取得、行更新、一括確定、Excel出力、Excel取込、突き合わせ完了 |

| 処理 | 必要な実効 feature_code | 判定に使う主な情報 | 説明 |
| --- | --- | --- | --- |
| 取込画面コンテキスト取得 / ジョブ状態取得 / ファイルアップロード / ジョブ再取込 / ジョブ削除 | `asset_ledger_import` | 通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings` / 共有システム管理者: `users.account_type`, `facilities.deleted_at` | 通常アカウントは対象施設への有効割当と実効機能の両方が必要。共有システム管理者は対象施設が未削除であること |
| 突き合わせ画面コンテキスト取得 / 一覧取得 / 候補取得 / 行更新 / 一括確定 / Excel出力 / Excel取込 / 突き合わせ完了 | `survey_ledger_matching` | 通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings` / 共有システム管理者: `users.account_type`, `facilities.deleted_at` | 通常アカウントは対象ジョブまたは作業対象施設に対して実効機能を再判定する。共有システム管理者は対象施設が未削除であること |

### 永続化と非同期処理境界

- `POST /asset-import/jobs` と `POST /asset-import/jobs/{assetImportJobId}/retry` は、受付時に `asset_import_jobs` を作成したうえで、初期取込処理が `asset_import_rows` 展開、PoC2 保存済み LUKE Model A によるAI分類、ABC行のみのAI推薦初期化を進める非同期ジョブ受付APIとして扱う
- アップロード元ファイルのバイナリ本体は Amazon S3 へ保存し、DB には `asset_import_jobs.file_name` と S3 オブジェクトキーである `file_path` をメタデータとして保持する。S3 バケット名や HTTPS URL は DB に保存しない
- `asset_import_rows` は元ファイルのデータ行を 1 行 = 1 レコードで保持する。固定資産台帳取込では正式取込対象29カラムを `raw_data_json` と対応する型付き `parsed_*` の両方に保存し、施設ロケーションはExcel入力原文 `parsed_facility_location_id` と解決済み外部キー `facility_location_id` を分けて保持する。後続処理は `parsed_*` を参照する。初期取込時に `ai_line_classification`、`ai_classification_confidence`、`ai_recommendation_required`、`ai_model_version` を保存する。`ABC` 行のみマスタ側候補を `suggested_*`、`suggested_ship_asset_master_id`、`suggested_score`、`suggested_similarity_source`、`suggested_source_asset_ledger_id` に保存し、`D` / `OTHER` 行は推薦関連項目を null とする。`selected_*` は未選択、`is_confirmed=false`、`confirmed_by_user_id` / `confirmed_at=NULL` で開始する
- `PUT /asset-matching/rows/{assetImportRowId}`、`POST /asset-matching/import`、`POST /asset-matching/rows/confirm-bulk` は `asset_import_rows` のみを更新し、`POST /asset-matching/complete` は `asset_import_jobs` のみを更新する。これらのAPIは `asset_data_matching_items` / `asset_ledgers` を作成・更新しない。正式取込対象29カラムの統合と原本資産への反映はデータ突合・原本確定APIで扱う。`DELETE /asset-import/jobs/{assetImportJobId}` は `asset_import_jobs` / `asset_import_rows` と元ファイルを一括削除する
- 同期更新API（行更新、Excel取込、一括確定、完了、削除）は 1 回の呼び出しを 1 DB トランザクションで完結させる。非同期受付API（取込作成、再取込）は受付トランザクションと初期取込トランザクションを分離し、失敗時は展開途中の `asset_import_rows` を残さない

### 作業対象施設ベースの認可

- 各 API は Bearer トークン上の作業対象施設に対する実効 `feature_code` または共有システム管理者例外を都度再判定する
- 通常アカウントでは、作業対象施設に対する `user_facility_assignments` の有効割当、対象 `feature_code` の `facility_feature_settings`、`user_facility_feature_settings` のいずれかを満たさない場合は 403 を返却する
- 共有システム管理者アカウントでは、作業対象施設または対象ジョブの施設の `facilities.deleted_at IS NULL` を確認できれば通常判定をバイパスし、削除済み施設の場合は 403 を返却する
- `/asset-import` 系 API は、対象施設または対象ジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、かつ `facilities.deleted_at IS NULL` の未削除施設であることを前提とする
- `/asset-matching` 系 API は、対象ジョブまたは対象行が属する `facility_id` が Bearer トークン上の作業対象施設IDと一致し、かつ `facilities.deleted_at IS NULL` の未削除施設であることを前提とする
- 資産台帳取込・マスタ突き合わせは自施設業務として扱い、協業グループや他施設公開設定は適用しない

### ファイル入出力仕様

- アップロード対応拡張子は `.xlsx` / `.xls` / `.csv` とする
- 最大ファイルサイズは 10MB とする
- 1行目はヘッダー、データは2行目以降、空白行は自動スキップとする
- 固定資産台帳取込では正式取込対象29カラム（A～AC）を検証する。カラム名比較時はセル内改行、全角スペース、半角スペースを除去し、`税 区分` と `税区分` は同一カラムとして扱う。余剰列は無視する
- 任意項目の空欄は null とし、文字列・日付・数量・金額は第5章「型付きカラム変換ルール」に従う。変換できない値やDB桁数超過が1件でもある場合は行番号・項目名を記録してジョブ全体を `FAILED` とする
- Excel出力は現在の絞り込み結果を `突き合わせ結果` シート、有効な SHIP 資産マスタを `SHIP資産マスタ` シート、再取込検証用メタデータを `取込管理情報` シートとして返却する
- Excel取込は `/asset-matching/export` で出力した `.xlsx` のみを対象とし、`突き合わせ結果` シートの `selectedShipAssetMasterId` を `asset_import_rows.selected_ship_asset_master_id` と `selected_*` に反映する。固定資産台帳取込Excelの再取込としては扱わない

### エラーレスポンス仕様

#### 基本エラーレスポンス（ErrorResponse）

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| code | string | ✓ | エラーコード |
| message | string | ✓ | 利用者向けエラーメッセージ |
| details | string[] | - | 入力エラーや補足情報 |

## 第4章 API一覧

### 資産台帳取込 / 資産台帳とマスタの突き合わせ

| 機能名 | Method | Path | 概要 | 認証 |
| --- | --- | --- | --- | --- |
| 取込画面コンテキスト取得 | GET | /asset-import/context | 選択施設の前回ジョブとアップロード済み一覧を取得する | 要 |
| 取込ジョブ作成・ファイルアップロード | POST | /asset-import/jobs | 台帳ファイルをアップロードし取込ジョブを開始する | 要 |
| 取込ジョブ状態取得 | GET | /asset-import/jobs/{assetImportJobId} | 取込ジョブの処理状態と件数を取得する | 要 |
| 取込ジョブ再取込 | POST | /asset-import/jobs/{assetImportJobId}/retry | FAILED ジョブを参照して新しい取込ジョブを作成する | 要 |
| 取込ジョブ削除 | DELETE | /asset-import/jobs/{assetImportJobId} | READY_FOR_MATCHING / FAILED ジョブと関連行を削除する | 要 |
| 突き合わせ画面コンテキスト取得 | GET | /asset-matching/context | 突き合わせ対象ジョブの件数サマリとフィルタ候補を取得する | 要 |
| 突き合わせ一覧取得 | GET | /asset-matching/rows | 取込結果一覧、AI推薦、保存済み選択値を取得する | 要 |
| 突き合わせ候補取得 | GET | /asset-matching/master-options | Category/分類/品目/メーカー/型式/施設ロケーションの検索候補を取得する | 要 |
| 突き合わせ行更新 | PUT | /asset-matching/rows/{assetImportRowId} | 行単位で選択値や確定フラグを更新する | 要 |
| 突き合わせ一括確定 | POST | /asset-matching/rows/confirm-bulk | 選択行をまとめて確定する | 要 |
| 突き合わせ結果Excel出力 | GET | /asset-matching/export | 現在の絞り込み結果とSHIP資産マスタを Excel で出力する | 要 |
| 突き合わせ結果Excel取込 | POST | /asset-matching/import | Excelで編集したSHIP資産マスタ紐づけを取込行へ反映する | 要 |
| 突き合わせ完了 | POST | /asset-matching/complete | 対象ジョブを突き合わせ完了へ更新する | 要 |

## 第5章 資産台帳取込・突き合わせ機能設計

### getAssetImportContext

#### 権限

- 認可条件: 選択施設が未確定の場合は施設別権限判定を行わず、施設選択が必要であることを返す
- 認可条件: 選択施設が確定している場合、共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）では対象施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 選択施設が確定している通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 選択施設が確定している通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_ledger_import` が有効であること

#### 処理仕様

1. 選択施設が確定している場合は、`facilityId` 省略時に Bearer トークン上の作業対象施設IDを採用し、指定時はそれと一致することを検証する
2. 選択施設が確定している場合は、対象施設が `facilities.deleted_at IS NULL` の未削除施設であることを検証する
3. 選択施設が未確定の場合は施設判定を行わず、施設選択が必要であることを返す
4. 選択施設が確定している場合は施設単位で前回ジョブ（`PROCESSING` / `READY_FOR_MATCHING` / `FAILED`）の有無を判定する
5. `ignoreFailedJobId` が指定された場合は、同一 `FAILED` ジョブに対する今回の自動再開判定を抑止する
6. 前回ジョブがある場合は `/asset-import` を経由せず `/asset-matching` へ遷移できる情報を返す
7. アップロード済みファイル一覧は選択施設に紐づく単一ファイルジョブの一覧として返却する。複数件が存在する場合は複数ジョブの履歴を表す

### postAssetImportJobs

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象ジョブの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_ledger_import` が有効であること

#### 処理仕様

1. `facilityId` 省略時に Bearer トークン上の作業対象施設IDを採用し、指定時はそれと一致することを検証する
2. 対象施設が `facilities.deleted_at IS NULL` の未削除施設であることを検証する
3. 拡張子とファイルサイズを検証し、不正時は 400 を返却する
4. 未完了ジョブが同一施設に存在する場合は新規作成不可とする
5. アップロード元ファイルの S3 オブジェクトキーを `asset-import-jobs/facility-{facilityId}/{yyyy}/{mm}/{uploadUuid}.{拡張子}` 形式で生成し、Amazon S3 へ PutObject する。DB にはバケット名や HTTPS URL は保存しない
6. Amazon S3 への PutObject に失敗した場合は 502 を返し、`asset_import_jobs` は作成しない
7. `asset_import_jobs` を `PROCESSING` で作成し、`file_path` には S3 オブジェクトキーを保存する。受付DB作成に失敗した場合は保存済み S3 オブジェクトを破棄する
8. ファイルを行単位に分解して `asset_import_rows` を作成する
9. 固定資産台帳取込では、後掲の「固定資産台帳Excel正式取込カラム」29項目（A～AC）を必須ヘッダーとする。ヘッダー比較時はセル内改行、全角スペース、半角スペースを除去し、正規化後の名称で照合する
10. 正式取込対象29カラムが不足する場合は初期取込を失敗させ、`asset_import_jobs.status=FAILED`、`error_message=FIXED_ASSET_COLUMN_MISSING: columns={カラム名}` を保存する。29カラム以外の余剰列は無視する
11. AI分類・推薦の入力に必要な `品目名（元）` / `メーカー名（元）` / `型式（元）` が空の場合は代替カラムで補完せず、初期取込を失敗させ、`error_message=FIXED_ASSET_REQUIRED_VALUE_MISSING: row={行番号}, fields={項目名}` を保存する
12. セル値は後掲の「型付きカラム変換ルール」に従って変換する。任意項目の空欄は null とし、日付・数量・金額を変換できない場合またはDB桁数を超過する場合はジョブ全体を失敗させ、`error_message=FIXED_ASSET_VALUE_PARSE_ERROR: row={行番号}, field={項目名}, value={値}` を保存する
13. 正式取込対象29カラムはすべて `asset_import_rows.raw_data_json` と型付きの `parsed_*` に保持する。後続処理は `raw_data_json` を再解析せず、`parsed_*` をデータ突合と原本確定への引継ぎ元として参照する
14. 固定資産台帳のA列 `施設ロケーションID` は、Excel入力値を `parsed_facility_location_id` に保持したうえで、対象ジョブの `facility_id` に属する有効な `facility_locations.facility_location_id` と完全一致する場合だけ `facility_location_id` に設定する。解決できない値は取込を失敗させず `facility_location_id=NULL` とし、突き合わせ画面で未解決として修正対象にする
15. AI 分類モデルへの入力は PoC2 最終報告書の方針に従い、台帳原本値である `product_name:{parsed_original_asset_name}, spec:{parsed_original_model_name}` とする。`parsed_original_manufacturer_name` は取込元表示値および推薦候補抽出の比較元として保持するが、分類モデル入力には含めない
16. PoC2 保存済み LUKE Model A で全行を `ABC` / `D` / `OTHER` に分類し、`ai_line_classification`、`ai_classification_confidence`、`ai_recommendation_required`、`ai_model_version` を保存する。本システムでは Model B は利用しない。固定資産台帳取込では値引き文字列判定を行わず、分類結果は内部制御値として資産台帳取込画面・突き合わせ画面には表示しない
17. `selected_*_id` / `suggested_*_id` / `selected_ship_asset_master_id` / `suggested_ship_asset_master_id` に使う参照マスタは、存在し、かつ削除済みでないことを前提に保存する
18. `ABC` 判定行のみ PoC1 方針の 3-gram コサイン類似度で AI 推薦候補を算出する。台帳側は `parsed_original_asset_name` / `parsed_original_manufacturer_name` / `parsed_original_model_name` を比較元とし、別名の非「元」項目を代替入力にはしない。3項目の全順列と括弧除去有無の2パターンで最大スコアを採用する
19. JMDN由来候補は有効な `ship_asset_masters` に紐づく `jmdn_registered_items.product_name`（販売名）、`jmdn_registered_items.manufacturer_name`（製造販売業者等）、`jmdn_classifications.general_name`（一般的名称）を比較文字列に利用する。候補として提示・保存する品目、メーカー、型式は SHIP 資産マスタおよび関連マスタ側の値とする
20. 原本資産台帳由来候補は、全施設の `asset_ledgers` のうち `ship_asset_master_id` が設定され、紐づく SHIP資産マスタが有効な行を対象に、`asset_ledgers.asset_name`（原本の品目名）、`asset_ledgers.manufacturer_name`（原本のメーカー名）、`asset_ledgers.model_name`（原本の型式）を比較文字列に利用する。候補として提示・保存する品目、メーカー、型式は当該原本資産台帳行に紐づく SHIP 資産マスタ側の値とする
21. JMDN由来候補と原本資産台帳由来候補を同じ候補集合として比較し、最もスコアが高いレコードに紐づく SHIP 資産マスタを `suggested_ship_asset_master_id`、マスタ側の表示値を `suggested_*_name`、対応IDを `suggested_*_id`、類似度を `suggested_score`、採用元を `suggested_similarity_source` として保存する。原本資産台帳由来候補が採用された場合は `suggested_source_asset_ledger_id` も保存する
22. 同点時は `ship_asset_master_id` 昇順、採用元は `JMDN_MASTER` → `ASSET_LEDGER` の順で決定し、原本資産台帳由来の同一マスタ内では `asset_ledger_id` 昇順で決定する
23. `D` / `OTHER` 判定行は AI 推薦対象外とし、`suggested_ship_asset_master_id`、`suggested_*_name` / `suggested_*_id`、`suggested_score`、`suggested_similarity_source`、`suggested_source_asset_ledger_id` は null のまま保存する
24. 初期取込完了後に `asset_import_jobs.status` を `READY_FOR_MATCHING` へ更新する
25. 初期取込処理が失敗した場合は、展開中の `asset_import_rows` をロールバックしたうえで、別トランザクションで `asset_import_jobs.status=FAILED`、`error_message`、`finished_at` を更新する
26. 処理時間が長い場合に備え、本APIは 202 Accepted でジョブを返却し、完了判定は状態照会APIで行う前提とする

#### 永続化マッピング（受付時）

| テーブル | 対象カラム / 操作 | 設定値 / 反映内容 | 備考 |
| --- | --- | --- | --- |
| `asset_import_jobs` | `asset_import_job_id` | 新規採番する | レスポンス `assetImportJobId` として返却する |
| `asset_import_jobs` | `facility_id` | リクエスト `facilityId` を保存する。省略時は Bearer トークン上の作業対象施設IDを保存する | 対象施設は Bearer トークン上の作業対象施設と一致している前提 |
| `asset_import_jobs` | `import_type` | リクエスト `importType` を保存する | `FIXED_ASSET` / `OTHER_LEDGER` |
| `asset_import_jobs` | `file_name` | リクエスト `file` の元ファイル名を保存する | 画面表示と再取込参照に利用する |
| `asset_import_jobs` | `file_path` | Amazon S3 に保存した元ファイルの S3 オブジェクトキー `asset-import-jobs/facility-{facilityId}/{yyyy}/{mm}/{uploadUuid}.{拡張子}` を保存する | DB にはバケット名や HTTPS URL は保存しない |
| `asset_import_jobs` | `status` / `error_message` / `started_at` / `finished_at` | `PROCESSING` / `NULL` / 受付時点の日時 / `NULL` で作成する | 受付直後は初期取込処理中 |
| `asset_import_jobs` | `created_by_user_id` / `created_at` / `updated_at` | 実行ユーザーIDと受付時点の日時を設定する | 監査・状態遷移管理用 |
| `Amazon S3（DB外）` | 元ファイル本体 | リクエスト `file` のバイナリを PutObject する | DB には `asset_import_jobs.file_path` として S3 オブジェクトキーだけを保持する |

#### 固定資産台帳Excel正式取込カラム

| No | Excel列 | 取込カラム | 保持先 | 主な扱い |
| --- | --- | --- | --- | --- |
| 1 | A | 施設ロケーションID | `raw_data_json` + `parsed_facility_location_id` + `facility_location_id` | Excel入力値を保持し、対象施設の個別部署マスタに解決できた場合のみ `facility_location_id` を設定。未解決時はNULL |
| 2 | B | 固定資産番号 | `raw_data_json` + `parsed_ledger_no` | 識別情報として保持 |
| 3 | C | ME管理機器番号 | `raw_data_json` + `parsed_management_device_no` | 識別情報として保持 |
| 4 | D | シリアル番号 | `raw_data_json` + `parsed_serial_no` | 識別情報として保持 |
| 5 | E | 病院固有番号 予備① | `raw_data_json` + `parsed_hospital_unique_no_1` | 病院固有識別子として保持 |
| 6 | F | 病院固有番号 予備② | `raw_data_json` + `parsed_hospital_unique_no_2` | 病院固有識別子として保持 |
| 7 | G | 品目名（元） | `raw_data_json` + `parsed_original_asset_name` | 台帳原本値。画面表示、AI分類入力、推薦候補抽出の比較元に利用 |
| 8 | H | メーカー名（元） | `raw_data_json` + `parsed_original_manufacturer_name` | 台帳原本値。画面表示、推薦候補抽出の比較元に利用 |
| 9 | I | 型式（元） | `raw_data_json` + `parsed_original_model_name` | 台帳原本値。画面表示、AI分類入力、推薦候補抽出の比較元に利用 |
| 10 | J | 数量 | `raw_data_json` + `parsed_quantity` | 数量として保持 |
| 11 | K | 単位 | `raw_data_json` + `parsed_unit` | 数量単位として保持 |
| 12 | L | 契約決済No. | `raw_data_json` + `parsed_contract_settlement_no` | 契約・決済情報として保持 |
| 13 | M | 納入年月日 | `raw_data_json` + `parsed_delivery_date` | 納入日として保持 |
| 14 | N | 検収年月日 | `raw_data_json` + `parsed_inspection_date` | 検収日として保持 |
| 15 | O | 納入業者（発注先） | `raw_data_json` + `parsed_delivery_vendor_name` | 納入業者情報として保持 |
| 16 | P | リース会社 | `raw_data_json` + `parsed_lease_company_name` | リース会社情報として保持 |
| 17 | Q | リース開始日 | `raw_data_json` + `parsed_lease_start_on` | リース情報として保持 |
| 18 | R | リース終了日 | `raw_data_json` + `parsed_lease_end_on` | リース情報として保持 |
| 19 | S | 会計区分（会計準則） | `raw_data_json` + `parsed_account_category` | 会計情報として保持 |
| 20 | T | 勘定科目（会計準則） | `raw_data_json` + `parsed_account_title` | 会計情報として保持 |
| 21 | U | 耐用年数（元） | `raw_data_json` + `parsed_original_legal_service_life` | 原文値として保持 |
| 22 | V | 定価単価（税別） | `raw_data_json` + `parsed_list_price_unit_excl_tax` | 定価情報として保持 |
| 23 | W | 定価金額（税別） | `raw_data_json` + `parsed_list_price_total_excl_tax` | 定価情報として保持 |
| 24 | X | 見積単価（税別） | `raw_data_json` + `parsed_quotation_price_unit_excl_tax` | 見積情報として保持。購入金額へ変換しない |
| 25 | Y | 見積金額（税別） | `raw_data_json` + `parsed_quotation_price_total_excl_tax` | 見積情報として保持。購入金額へ変換しない |
| 26 | Z | 税区分 | `raw_data_json` + `parsed_tax_category` | 取込元の税情報として保持 |
| 27 | AA | 消費税率 | `raw_data_json` + `parsed_tax_rate` | 取込元の税率として保持。10%は10.00で保持 |
| 28 | AB | 見積金額（税込） | `raw_data_json` + `parsed_quotation_price_total_incl_tax` | 見積情報として保持。購入金額へ変換しない |
| 29 | AC | 台帳備考 | `raw_data_json` + `parsed_ledger_remarks` | 台帳固有備考として保持 |

#### 型付きカラム変換ルール

| 対象 | 変換ルール | 空欄 | 変換失敗時 |
| --- | --- | --- | --- |
| 文字列 | セル値を文字列化し、先頭・末尾の空白だけを除去する。値中の空白・改行は保持する。文字数はDB定義の上限以内とする | null。ただし `品目名（元）` / `メーカー名（元）` / `型式（元）` は `FIXED_ASSET_REQUIRED_VALUE_MISSING` | 文字数超過は `FIXED_ASSET_VALUE_PARSE_ERROR` |
| 日付 | Excelの日付型・日付シリアル値、または `yyyy/M/d` / `yyyy-MM-dd` 形式の文字列を日付へ変換する。時刻部分は保存しない | null | `FIXED_ASSET_VALUE_PARSE_ERROR` |
| 数量 | 数値セル、または全角数字を半角化して桁区切りカンマを除去した整数文字列をintへ変換する。小数は許可しない | null | `FIXED_ASSET_VALUE_PARSE_ERROR` |
| 金額 | 数値セル、または全角数字を半角化し、桁区切りカンマと通貨記号 `¥` / `￥` を除去した数値文字列をdecimal(14,2)へ変換する。小数3桁以上や整数部13桁以上は許可しない | null | `FIXED_ASSET_VALUE_PARSE_ERROR` |
| 数式セル | Excelに保存された計算済み値を上記の型別ルールで変換する。計算済み値が存在しない場合は変換失敗とする | 計算済み値が空の場合は各型の空欄規則に従う | `FIXED_ASSET_VALUE_PARSE_ERROR` |
| raw_data_json | 型変換前に抽出した29項目の値を正規化済みヘッダー名をキーとして保持する。後続処理の業務値には使用しない | null | - |

#### 永続化マッピング（初期取込成功時）

| テーブル | 対象カラム / 操作 | 設定値 / 反映内容 | 備考 |
| --- | --- | --- | --- |
| `asset_import_rows` | `asset_import_row_id` / `asset_import_job_id` / `row_no` | データ行ごとに新規採番し、親ジョブIDとヘッダー / 空白行を除いた行順を保存する | 1 取込行 = 1 レコード |
| `asset_import_rows` | `raw_data_json` | 正式取込対象29カラムを、正規化後カラム名をキーにして元ファイル 1 行分の抽出値JSONとして保存する | 監査・障害調査用。後続処理は再解析せず、型付き `parsed_*` を参照する |
| `asset_import_rows` | 正式取込対象29カラムに対応する全 `parsed_*` | 文字列、日付、数量、金額を対応する型付きカラムへ保存する。台帳原本値は `parsed_original_asset_name` / `parsed_original_manufacturer_name` / `parsed_original_model_name` として保持し、施設ロケーションは `parsed_facility_location_id` と解決済みの `facility_location_id` を分離する | 保持対象は上記「固定資産台帳Excel正式取込カラム」表を正本とする。後続処理は `raw_data_json` を再解析しない。AI分類・推薦入力は `parsed_original_*` のみを使用し、見積金額を購入金額へ変換しない |
| `asset_import_rows` | `ai_line_classification` / `ai_classification_confidence` / `ai_recommendation_required` / `ai_model_version` | PoC2 保存済み LUKE Model A による分類結果、信頼度、ABC 判定時の推薦要否、利用モデルバージョンを保存する | `ABC` / `D` / `OTHER`。固定資産台帳取込ではABCか否かの内部制御値。画面表示用レスポンスDTOおよびExcel出力列には含めない |
| `asset_import_rows` | `suggested_ship_asset_master_id` / `suggested_*_name` / `suggested_*_id` / `suggested_score` / `suggested_similarity_source` / `suggested_source_asset_ledger_id` | `ABC` 判定行のみ AI 推薦ロジックで算出した最良候補の SHIP 資産マスタID、マスタ側の表示値、対応ID、類似度、採用元、原本資産台帳由来候補の元台帳IDを保存する。`D` / `OTHER` 判定行はすべて null とする | 推薦時点のマスタ側候補スナップショットを保持する |

#### 永続化マッピング（初期取込成功時・選択初期値/ジョブ完了）

| テーブル | 対象カラム / 操作 | 設定値 / 反映内容 | 備考 |
| --- | --- | --- | --- |
| `asset_import_rows` | `selected_*` / `selected_ship_asset_master_id` / `is_confirmed` / 確定監査列 / `deleted_at` | 未選択・未確定・未削除として作成する | 初期取込時点では未選択・未確定・未削除 |
| `asset_import_rows` | `created_at` / `updated_at` | 初期取込完了時点の日時を設定する | 行監査用 |
| `asset_import_jobs` | `status` / `error_message` / `finished_at` / `updated_at` | `READY_FOR_MATCHING` / `NULL` / 初期取込完了時点の日時 / 同日時へ更新する | ポーリング結果の正本 |

#### 永続化マッピング（初期取込失敗時）

| テーブル | 対象カラム / 操作 | 設定値 / 反映内容 | 備考 |
| --- | --- | --- | --- |
| `asset_import_rows` | 対象ジョブ分の展開途中行 | ロールバックして残さない | 部分展開を許可しない |
| `asset_import_jobs` | `status` / `error_message` / `finished_at` / `updated_at` | `FAILED` / 利用者向け失敗理由 / 失敗時点の日時 / 同日時へ更新する | 元ファイルとジョブ履歴は保持する |

### getAssetImportJobsByAssetImportJobId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象ジョブの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_ledger_import` が有効であること

#### 処理仕様

1. 対象ジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する

### postAssetImportJobsByAssetImportJobIdRetry

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象ジョブの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_ledger_import` が有効であること

#### 処理仕様

1. 対象ジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する
2. 対象ジョブが `FAILED` であることを検証する
3. `asset_import_jobs.file_path` に保持した S3 オブジェクトキーから元ファイルを取得できることを確認し、新しい `asset_import_jobs` を `PROCESSING` で作成する
4. 元の FAILED ジョブとその失敗情報は監査用に保持する
5. 受付時の Amazon S3 GetObject 確認に失敗した場合は 502 を返し、新規ジョブは作成しない。非同期初期取込中に元ファイルを取得できなくなった場合は、新規ジョブ側だけ `status=FAILED`、`error_message`、`finished_at` を更新する
6. 再取込時も `POST /asset-import/jobs` と同じ正式29カラム検証、`raw_data_json` / `parsed_*` 展開、施設ロケーション解決、AI分類・AI推薦ルールを適用する。分類入力は `product_name:{parsed_original_asset_name}, spec:{parsed_original_model_name}` とし、`parsed_original_manufacturer_name` は推薦候補抽出の比較元にのみ利用する。非「元」項目を代替入力にはしない。本システムでは Model B は利用しない。固定資産台帳取込では値引き文字列判定を行わず、AI推薦は `ABC` 行のみ JMDN由来候補と全施設の原本資産台帳由来候補を同じ候補集合として比較する
7. 再取込の初期取込処理が失敗した場合は、展開中の `asset_import_rows` をロールバックしたうえで、新規ジョブ側だけ `status=FAILED`、`error_message`、`finished_at` を更新する
8. 新規ジョブ作成後の処理内容は通常の `/asset-import/jobs` と同じとする

#### 永続化マッピング（受付時）

| テーブル | 対象カラム / 操作 | 設定値 / 反映内容 | 備考 |
| --- | --- | --- | --- |
| `asset_import_jobs`（再取込元 FAILED ジョブ） | 既存行 | 変更しない | 失敗履歴として保持する |
| `asset_import_jobs`（新規ジョブ） | `asset_import_job_id` | 新規採番する | レスポンス `assetImportJobId` として返却する |
| `asset_import_jobs`（新規ジョブ） | `facility_id` / `import_type` / `file_name` / `file_path` | 再取込元 FAILED ジョブの値を引き継いで保存する | リクエスト `assetImportJobId` は再取込元ジョブ特定にのみ使う |
| `asset_import_jobs`（新規ジョブ） | `status` / `error_message` / `started_at` / `finished_at` | `PROCESSING` / `NULL` / 再取込受付時点の日時 / `NULL` で作成する | 再取込元の失敗情報は引き継がない |
| `asset_import_jobs`（新規ジョブ） | `created_by_user_id` / `created_at` / `updated_at` | 実行ユーザーIDと再取込受付時点の日時を設定する | 監査・状態遷移管理用 |
| `Amazon S3（DB外）` | 再取込元ファイル本体 | 再取込元 FAILED ジョブの `file_path` が指す S3 オブジェクトを GetObject して再利用する | 再アップロードは行わない |

#### 永続化マッピング（初期取込処理）

| テーブル | 対象カラム / 操作 | 設定値 / 反映内容 | 備考 |
| --- | --- | --- | --- |
| `asset_import_rows` | 新規ジョブ配下の `asset_import_row_id` / `asset_import_job_id` / `row_no` / `raw_data_json` / `parsed_*` / `ai_*` / `suggested_*` / `suggested_ship_asset_master_id` / `suggested_score` / `suggested_similarity_source` / `suggested_source_asset_ledger_id` / `selected_*` / `selected_ship_asset_master_id` / `is_confirmed` / `confirmed_by_user_id` / `confirmed_at` / `created_at` / `updated_at` / `deleted_at` | 元ファイルを再解析し、`POST /asset-import/jobs` の初期取込成功時と同じルールで新規作成する | 再取込元ジョブの `asset_import_rows` は再利用しない |
| `asset_import_jobs`（新規ジョブ） | `status` / `error_message` / `finished_at` / `updated_at` | 成功時は `READY_FOR_MATCHING` / `NULL` / 完了時点の日時 / 同日時、失敗時は `FAILED` / 利用者向け失敗理由 / 失敗時点の日時 / 同日時へ更新する | 結果は新規ジョブ側だけに反映する |

### deleteAssetImportJobsByAssetImportJobId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象ジョブの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `asset_ledger_import` が有効であること

#### 処理仕様

1. 対象ジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する
2. 削除対象は `READY_FOR_MATCHING` / `FAILED` のジョブに限定し、`PROCESSING` / `MATCHING_COMPLETED` は 409 とする
3. `asset_import_jobs.file_path` が指す S3 オブジェクトを DeleteObject し、削除成功後にジョブ本体と取込行を一括削除する
4. Amazon S3 の DeleteObject に失敗した場合は 502 を返し、`asset_import_jobs` / `asset_import_rows` は削除しない
5. 突き合わせ途中のデータも削除されるため、確認ダイアログの後に実行する

#### 永続化マッピング

| テーブル | 対象カラム / 操作 | 設定値 / 反映内容 | 備考 |
| --- | --- | --- | --- |
| `asset_import_rows` | 対象 `assetImportJobId` に紐づく全行 | 物理削除する | 子テーブルを先に削除する |
| `asset_import_jobs` | 対象 `assetImportJobId` の行 | 物理削除する | `READY_FOR_MATCHING` / `FAILED` の場合のみ実行する |
| `Amazon S3（DB外）` | `asset_import_jobs.file_path` が指す元ファイル | S3 オブジェクトキーを指定して DeleteObject する | S3 削除成功後に DB 行を物理削除する |

### getAssetMatchingContext

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象ジョブの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. 対象ジョブ解決後、その `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する
2. 再開対象ジョブが施設単位で 1 件である前提で、`assetImportJobId` 未指定時は施設から `PROCESSING` / `READY_FOR_MATCHING` / `FAILED` の前回ジョブを解決する
3. 全体/残り/完了件数を `asset_import_rows` から集計する
4. `PROCESSING` / `FAILED` の場合でも `job.status` と `failureReason` を返し、画面状態切替の正本とする
5. 施設ロケーションの候補は `READY_FOR_MATCHING` の場合のみ対象ジョブの `facility_id` に属する有効な `facility_locations` から取得し、それ以外は空配列とする。Excel入力値の文字列は候補生成元にせず、解決済み候補との照合に利用する

### getAssetMatchingRows

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象ジョブの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. 対象ジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する
2. 対象ジョブが `READY_FOR_MATCHING` であることを前提とし、それ以外の状態では 409 を返却する
3. 施設ロケーションID/Category/大分類/中分類/品目は AND 条件で絞り込む。施設ロケーション未解決行は `facility_location_id IS NULL` として返却し、行レスポンスで解決状態を判定できるようにする
4. 既定では未確定行のみ返却し、`includeConfirmed=true` の場合のみ確定済み行を含める
5. 台帳原本値は `parsed_original_*` として返却し、AI推薦候補・ユーザー選択結果は `suggested_*_name` / `selected_*_name` としてマスタ側の表示値を返却する。マスタ選択済みの場合のみ対応する `*_id` を返却する
6. サーバー内部では `ai_line_classification=ABC` の行のみ `suggestedMatch` に AI 推薦候補を返却する。`D` / `OTHER` 行は AI 推薦対象外のため `suggestedMatch=null` とする。`ai_line_classification`、`ai_recommendation_required`、`ai_classification_confidence`、`ai_model_version` はレスポンスDTOに含めない
7. 現在の画面 DTO では施設ロケーション、品目名（元）/メーカー名（元）/型式（元）/数量/単位の表示に必要な項目を返却する。正式取込対象29カラムのその他項目も `asset_import_rows` の型付き `parsed_*` と `raw_data_json` に保持し、データ突合・原本確定では `parsed_*` を参照する
8. 画面要件上ページングは定義しない

### getAssetMatchingMasterOptions

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象ジョブの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. 対象ジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する
2. `FACILITY_LOCATION` の候補は対象ジョブの `facility_id` に属し、`facility_locations.deleted_at IS NULL` の有効な個別部署マスタから取得する。候補の5項目（棟/階/部門名/部署名/室名）は表示用に返却する
3. その他の候補は指定した階層に応じたマスタテーブルから取得する
4. 親階層が指定された場合は整合する子候補だけを返却する
5. 検索条件は部分一致を基本とする

### putAssetMatchingRowsByAssetImportRowId

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象ジョブの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. 対象行が属するジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する
2. 対象行が属するジョブが `READY_FOR_MATCHING` であることを検証し、それ以外は 409 を返却する
3. 編集対象は未確定行のみとし、未確定行の保存競合は最終保存勝ちとする
4. `facilityLocationId` が指定された場合は、`facility_locations` に存在し、論理削除されておらず、対象ジョブの `facility_id` と一致することを検証する。検証に失敗した場合は元の `parsed_facility_location_id` を保持したまま `facility_location_id` は更新しない
5. リクエストに `facilityLocationId` が含まれない場合は既存の `facility_location_id` を維持し、明示的に null を指定した場合だけ未解決状態へ戻す
6. `facilityLocationId=null` の保存は未解決状態への変更として許可するが、`isConfirmed=true` の場合は許可しない。Excel入力値は `parsed_facility_location_id` に保持し、解決済みIDとは別管理する
7. `selectedShipAssetMasterId` を非 `null` で指定した場合は、有効な `ship_asset_masters` から Category / 大分類 / 中分類 / 品目 / メーカー / 型式を再解決し、`selected_ship_asset_master_id`、対応する `selected_*_id`、初期 `selected_*_name` を設定する
8. 同じリクエストに `selectedManufacturerName` / `selectedModelName` が含まれる場合は、資産マスタの初期表示値を設定した後に取込行固有の確定表示値として上書きする。空でない名称が資産マスタと異なっていても許可し、`selected_ship_asset_master_id`、`selected_manufacturer_id`、`selected_model_id` および他のマスタ由来IDは保持する。`null` または空白のみは取込行固有表示値のクリアとして扱い、有効表示値は紐付け先資産マスタのメーカー名 / 型式へフォールバックする。画面入力値によって `ship_asset_masters` または分類マスタを更新しない
9. `selectedShipAssetMasterId` 未送信で `selectedManufacturerName` / `selectedModelName` だけを更新する場合も、既存の `selected_ship_asset_master_id` と `selected_*_id` を維持する。資産マスタ紐付け中の `selectedAssetItemName` は紐付け先マスタの品目名と一致する場合だけ受け付け、個別値への上書きは許可しない。その他の分類IDまたは分類表示値を資産マスタ再選択なしで変更する場合は、マスタ未選択の下書きへ戻して `selected_ship_asset_master_id=NULL` とし、階層整合を再計算する
10. `selectedShipAssetMasterId` を明示的に `null` で送信した場合は、紐付け解除として `selected_ship_asset_master_id` とマスタ由来の `selected_*_id` を `NULL` にする。表示値は下書きの自由記述値として保持できるが、この状態では確定できない
11. `selectedShipAssetMasterId` と `selected_*_id` を同時送信する場合は、各IDが選択SHIP資産マスタ由来IDと一致することを検証する。不一致は `VALIDATION_ERROR` とし、メーカー名・型式の表示値相違はエラーにしない
12. マスタ未選択の下書きで個別IDを指定する場合は、対応マスタが有効であることと階層整合性を検証する。親は子を兼ねる前提で必要な親階層IDを自動補完し、上位階層変更で整合しない下位階層IDはクリアする
13. リクエストで未指定の `selected*` 項目は既存値を維持し、明示的な `null` は前記の紐付け解除・表示値保持ルールに従って処理する
14. `isConfirmed=true` の場合はAI分類にかかわらず、有効な `selected_ship_asset_master_id` が設定され、保存済み `selected_*_id` が選択SHIP資産マスタと整合することを必須とする。未選択または無効な場合は `SHIP_ASSET_MASTER_REQUIRED` または `SHIP_ASSET_MASTER_NOT_FOUND` で確定を拒否する
15. `isConfirmed=true` の場合は `facility_location_id IS NOT NULL` かつ対象施設に属することを必須とし、未解決行は `LOCATION_UNRESOLVED` として確定を拒否する
16. `isConfirmed=true` の場合は検証後に `is_confirmed` と `confirmed_by_user_id` / `confirmed_at` を更新する
17. 対象行がすでに他ユーザーにより確定済みの場合は競合エラーとする

#### 永続化マッピング

| テーブル | 対象カラム / 操作 | 設定値 / 反映内容 | 備考 |
| --- | --- | --- | --- |
| `asset_import_rows` | `selected_category_name` / `selected_category_id` | リクエスト `selectedCategoryId` がある場合は対応マスタの正規名称と ID で上書きし、`selectedCategoryId=null` の場合は `selectedCategoryName` を自由記述値として保存する。明示 `null` 時は両方クリアする | 未指定時は既存値を維持する |
| `asset_import_rows` | `selected_large_class_name` / `selected_large_class_id` | リクエスト `selectedLargeClassId` がある場合は対応マスタの正規名称と ID で上書きし、`selectedLargeClassId=null` の場合は `selectedLargeClassName` を自由記述値として保存する。明示 `null` 時は両方クリアする | 未指定時は既存値を維持する |
| `asset_import_rows` | `selected_medium_class_name` / `selected_medium_class_id` | リクエスト `selectedMediumClassId` がある場合は対応マスタの正規名称と ID で上書きし、`selectedMediumClassId=null` の場合は `selectedMediumClassName` を自由記述値として保存する。明示 `null` 時は両方クリアする | 未指定時は既存値を維持する |
| `asset_import_rows` | `selected_asset_item_name` / `selected_asset_item_id` | 資産マスタ選択時はマスタ由来IDと名称を設定し、資産マスタ紐付け中はその値を維持する | 品目名の取込行固有上書きは許可しない |
| `asset_import_rows` | `selected_manufacturer_name` / `selected_manufacturer_id` | 資産マスタ選択時はマスタ由来IDと初期名称を設定し、その後に `selectedManufacturerName` を取込行固有の表示値として上書きできる | 名称相違を許容し、名称編集だけではIDをクリアしない |
| `asset_import_rows` | `selected_model_name` / `selected_model_id` | 資産マスタ選択時はマスタ由来IDと初期名称を設定し、その後に `selectedModelName` を取込行固有の表示値として上書きできる。`null` または空白のみは表示値だけをクリアする | 名称相違を許容し、名称編集だけではIDをクリアしない |
| `asset_import_rows` | `selected_ship_asset_master_id` | リクエスト `selectedShipAssetMasterId` が非 `null` の場合は有効なSHIP資産マスタIDを保存する。メーカー名・型式だけの更新では維持し、明示 `null` またはその他の分類更新でマスタ未選択の下書きへ戻す場合だけクリアする | 表示値編集とマスタ紐付けを分離する |
| `asset_import_rows` | `facility_location_id` | リクエスト `facilityLocationId` が指定された場合は、対象ジョブの施設に属する有効な `facility_locations.facility_location_id` を保存する。明示 `null` 時は NULL にする | `parsed_facility_location_id` は変更せず、Excel入力原文を保持する。施設外ID・存在しないIDは保存しない |
| `asset_import_rows` | 分類階層整合の補正 | 下位階層IDが指定された場合は必要な親階層IDを自動補完し、上位階層変更で不整合になった下位階層IDはクリアする | Category / 大分類 / 中分類 / 品目の整合維持 |
| `asset_import_rows` | `is_confirmed` / `confirmed_by_user_id` / `confirmed_at` | リクエスト `isConfirmed=true` の場合だけ `true` / 実行ユーザーID / 更新時点の日時へ更新する | `isConfirmed` が `false` または未指定の場合は既存の未確定状態を維持する |
| `asset_import_rows` | `updated_at` | 更新時点の日時へ更新する | 最終保存勝ちの監査用 |
| `asset_import_rows` | `asset_import_job_id` / `row_no` / `raw_data_json` / `parsed_*` / `ai_*` / `suggested_*` / `suggested_ship_asset_master_id` / `suggested_score` / `suggested_similarity_source` / `suggested_source_asset_ledger_id` / `created_at` / `deleted_at` | 変更しない | 取込元データ、Excel入力原文、AI 分類・AI 推薦スナップショットは本 API の対象外 |

### postAssetMatchingRowsConfirmBulk

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象ジョブの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. 対象ジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する
2. 対象ジョブが `READY_FOR_MATCHING` であることを検証し、それ以外は 409 を返却する
3. 指定した `assetImportRowIds` の全件が対象 `assetImportJobId` に属する未削除行であることを検証し、対象外行を含む場合は 404 を返却する
4. 指定行の `facility_location_id` が NULL でないこと、および各ロケーションが対象ジョブの `facility_id` に属する有効な `facility_locations` であることを検証する。未解決行を含む場合は一括確定せず、行IDを `details` に返却する
5. AI分類および `ai_recommendation_required` の値にかかわらず、指定行ごとに有効な `selected_ship_asset_master_id` が設定され、保存済み `selected_*_id` が選択SHIP資産マスタ由来IDと整合することを検証する。`D` / `OTHER` 行は推薦候補がないため、利用者が手動で資産マスタを選択してから確定する
6. `selected_manufacturer_name` / `selected_model_name` は取込行固有の確定表示値として選択SHIP資産マスタの名称と異なっていても許可し、名称相違を理由に `selected_ship_asset_master_id` または対応IDをクリアしない。空の場合は選択SHIP資産マスタのメーカー名 / 型式を有効表示値とし、`selected_asset_item_name` は選択SHIP資産マスタ由来の品目名とする
7. 指定行の `is_confirmed` を true へ更新し、`confirmed_by_user_id` / `confirmed_at` を保存する
8. 対象は未確定行のみとし、他ユーザーが先に確定済みの行が含まれる場合は一括失敗として競合行IDを `details` で返却する
9. 有効な資産マスタ紐付け、分類ID整合、施設ロケーションのいずれかを満たさない行が含まれる場合も一括失敗とし、どの行が失敗したかを `details` で返却する

#### 永続化マッピング

| テーブル | 対象カラム / 操作 | 設定値 / 反映内容 | 備考 |
| --- | --- | --- | --- |
| `asset_import_rows` | リクエスト `assetImportRowIds[*]` に一致する各行の `is_confirmed` | `true` へ更新する | 対象ジョブはリクエスト `assetImportJobId` で特定する |
| `asset_import_rows` | リクエスト `assetImportRowIds[*]` に一致する各行の `confirmed_by_user_id` / `confirmed_at` | 実行ユーザーID / 更新時点の日時を保存する | 一括確定監査用 |
| `asset_import_rows` | リクエスト `assetImportRowIds[*]` に一致する各行の `updated_at` | 更新時点の日時へ更新する | 確定監査用 |
| `asset_import_rows` | 対象各行の `facility_location_id` | 変更しない | 一括確定前に有効な対象施設ロケーションIDが設定済みであることを検証する |
| `asset_import_rows` | 各行の `selected_*` / `selected_ship_asset_master_id` / `parsed_*` / `ai_*` / `suggested_*` / `suggested_ship_asset_master_id` / `suggested_score` / `suggested_similarity_source` / `suggested_source_asset_ledger_id` / `created_at` / `deleted_at` | 変更しない | 全行で有効な資産マスタ紐付けと分類ID整合を検証したうえで、マスタ由来の品目名と、メーカー名・型式の保存済み選択スナップショットを確定する |
| `asset_import_rows` | 対象外行 | 変更しない | 競合行または業務必須不足行を含む場合は全件ロールバックする |

### getAssetMatchingExport

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象ジョブの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. 対象ジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する
2. 対象ジョブが `READY_FOR_MATCHING` であることを前提とし、それ以外の状態では 409 を返却する
3. `includeConfirmed=true` は参照出力用途とし、Excel取込で再反映する作業用ファイルは既定の未確定行のみ出力を使用する
4. 現在の絞り込み条件に一致する取込結果を `突き合わせ結果` シートとして出力する。画面表示列には台帳原本値の `品目名（元）` / `メーカー名（元）` / `型式（元）` と解決済み施設ロケーションを含める。AI推薦にはマスタ側候補、現在の選択結果にはマスタ由来ID、マスタ由来の品目名、取込行固有のメーカー名・型式表示値を含めるため、メーカー名・型式はマスタ名称と異なる場合がある。再取込用の `assetImportJobId` / `assetImportRowId` / `rowNo` と、編集対象の `selectedShipAssetMasterId` も含める。AI分類結果は内部制御値のため出力列に含めない
5. 有効な `ship_asset_masters` を `SHIP資産マスタ` シートとして出力し、`shipAssetMasterId`、Category、大分類、中分類、品目、メーカー、型式、JMDN販売名、製造販売業者等、一般的名称を参照できるようにする
6. 再取込検証用に `取込管理情報` シートを含め、`assetImportJobId`、`facilityId`、テンプレートバージョン、出力日時を保持する。`取込管理情報` は画面表示・編集対象外の管理シートとして扱う
7. 本APIで出力したExcelだけを `/asset-matching/import` の取込対象とする。任意Excelやシート構成が異なるファイルは取込時に `EXCEL_TEMPLATE_INVALID` とする

#### 出力シート定義

| シート名 | 用途 | 主な列 | 編集可否 |
| --- | --- | --- | --- |
| `突き合わせ結果` | 画面に表示している取込行のローカル作業用シート | `assetImportJobId`, `assetImportRowId`, `rowNo`, 台帳原本値の画面表示列, AI推薦（マスタ側候補）, 現在の選択結果（マスタ由来ID + 取込行固有表示値）, `selectedShipAssetMasterId` | `selectedShipAssetMasterId` のみ編集対象。原本取込値、AI分類結果、AI推薦値、現在の選択結果表示値は更新対象外 |
| `SHIP資産マスタ` | 紐づけ候補の参照用シート | `shipAssetMasterId`, Category, 大分類, 中分類, 品目, メーカー, 型式, JMDN販売名, 製造販売業者等, 一般的名称 | 参照専用 |
| `取込管理情報` | 再取込時の整合検証用シート | `assetImportJobId`, `facilityId`, `templateVersion`, `exportedAt` | 参照専用 |

### postAssetMatchingImport

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象ジョブの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. アップロードファイルの拡張子、MIME、サイズを検証し、`.xlsx` 以外または上限超過は 400 を返却する
2. `取込管理情報`、`突き合わせ結果`、`SHIP資産マスタ` シートが存在し、テンプレートバージョンがサポート対象であることを検証する。存在しない場合や列構成が異なる場合は `EXCEL_TEMPLATE_INVALID` を返却する
3. リクエスト `assetImportJobId`、`取込管理情報.assetImportJobId`、各行の `assetImportJobId` が一致することを検証する
4. 対象ジョブの `facility_id` が `取込管理情報.facilityId` および Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する
5. 対象ジョブが `READY_FOR_MATCHING` であることを検証し、それ以外は 409 を返却する
6. `突き合わせ結果` シートの各データ行について、`assetImportRowId` が対象ジョブ配下の未削除行であり、`is_confirmed=false` であることを検証する。確定済み行または対象外行が含まれる場合は全件ロールバックする
7. `selectedShipAssetMasterId` が指定されている場合は、有効な `ship_asset_masters` に存在することを検証する。存在しない、無効、または数値形式でない場合は `EXCEL_ROW_VALIDATION_ERROR` として行番号を `details` に返す
8. `selectedShipAssetMasterId` が現在の `selected_ship_asset_master_id` と異なる行は、対応する SHIP 資産マスタから Category / 大分類 / 中分類 / 品目 / メーカー / 型式を再解決し、`selected_ship_asset_master_id` と `selected_*_id` / 初期 `selected_*_name` を更新する。同一IDの行は資産マスタの有効性と `selected_*_id` の整合を再検証し、`selected_asset_item_name` はマスタ由来値へ補正する一方、画面で編集済みの `selected_manufacturer_name` / `selected_model_name` を保持する
9. `selectedShipAssetMasterId` が空欄の行は、選択解除として `selected_ship_asset_master_id` と `selected_*_id` / `selected_*_name` を null に更新する
10. 正式取込対象29カラム、`raw_data_json`、`parsed_*`、`facility_location_id`、`ai_*`、`suggested_*`、`suggested_ship_asset_master_id`、`suggested_score`、`suggested_similarity_source`、`suggested_source_asset_ledger_id`、`is_confirmed`、`confirmed_by_user_id`、`confirmed_at` は更新しない
11. 全行検証後、1 DB トランザクションで `asset_import_rows` を更新する。1行でも検証エラーがある場合は更新せず、エラー行を `details` に返却する
12. 取込成功後、クライアントは `/asset-matching/rows` を再取得して画面へ反映する

#### 突き合わせ結果Excel列定義（突き合わせ結果シート）

| 列 | 必須 | 取込時の扱い | 説明 |
| --- | --- | --- | --- |
| `assetImportJobId` | ✓ | 検証のみ | 対象ジョブID。リクエストおよび管理情報と一致すること |
| `assetImportRowId` | ✓ | 検証キー | 更新対象の `asset_import_rows.asset_import_row_id` |
| `rowNo` | ✓ | 検証/エラー表示 | 元ファイル行番号。エラー時の利用者向け表示に利用 |
| 画面表示列 / AI推薦 / 現在の選択結果 | - | 取込更新対象外 | 利用者のローカル確認用。台帳原本値、マスタ側AI推薦値、マスタ由来IDと取込行固有表示値からなる現在の選択結果が変更されていてもDBへ反映しない。AI分類結果は出力列に含めない |
| `selectedShipAssetMasterId` | - | 更新対象 | 指定された SHIP 資産マスタIDを選択結果として反映する。空欄は選択解除 |

#### 永続化マッピング

| テーブル | 対象カラム / 操作 | 設定値 / 反映内容 | 備考 |
| --- | --- | --- | --- |
| `asset_import_rows` | `selected_ship_asset_master_id` | Excel `selectedShipAssetMasterId` を保存する。空欄の場合は null | 対象は未確定行のみ |
| `asset_import_rows` | `selected_category_id` / `selected_large_class_id` / `selected_medium_class_id` / `selected_asset_item_id` / `selected_manufacturer_id` / `selected_model_id` | `selectedShipAssetMasterId` に対応する `ship_asset_masters` から再解決した各IDを保存する。空欄の場合は null | SHIP資産マスタ選択結果を正規化して保持する |
| `asset_import_rows` | `selected_category_name` / `selected_large_class_name` / `selected_medium_class_name` / `selected_asset_item_name` / `selected_manufacturer_name` / `selected_model_name` | 現在と異なる資産マスタIDの場合は再解決した各マスタの表示名を初期値として保存する。同一IDの場合は品目名をマスタ由来値へ補正し、既存のメーカー名・型式を保持する。空欄の場合は全項目を null にする | 品目はマスタ由来、メーカー名・型式は取込行固有の画面表示用スナップショットとして保持する |
| `asset_import_rows` | `updated_at` | 取込反映時点の日時へ更新する | 一括反映監査用 |
| `asset_import_rows` | `asset_import_job_id` / `row_no` / `raw_data_json` / `parsed_*` / `ai_*` / `suggested_*` / `suggested_ship_asset_master_id` / `suggested_score` / `suggested_similarity_source` / `suggested_source_asset_ledger_id` / `is_confirmed` / `confirmed_by_user_id` / `confirmed_at` / `created_at` / `deleted_at` | 変更しない | Excel取込は選択結果の一括反映に限定する |
| `asset_import_jobs` | 対象ジョブ | 変更しない | ジョブ状態や完了日時は更新しない |

### postAssetMatchingComplete

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象ジョブの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. 対象ジョブの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを検証する
2. 対象ジョブが `READY_FOR_MATCHING` であり、未確定件数（`remainingRows`）が 0 件であることを検証する。行確定時に施設ロケーション解決済みを必須としているため、未確定件数 0 件はロケーション未解決行がないことも意味する
3. 未確定行が 1 件でも残っている場合は `JOB_STATUS_INVALID` を返し、完了させない
4. 条件を満たした場合のみ対象ジョブを `MATCHING_COMPLETED` へ更新する
5. 完了時に `asset_import_jobs.finished_at` を更新し、`remainingRows=0` を返却する
6. 本APIは取込・マスタ突き合わせジョブの完了のみを扱い、`asset_data_matching_items` または `asset_ledgers` の作成・更新は行わない。正式取込対象29カラムの統合と原本資産への反映はデータ突合・原本確定APIで行う

#### 永続化マッピング

| テーブル | 対象カラム / 操作 | 設定値 / 反映内容 | 備考 |
| --- | --- | --- | --- |
| `asset_import_jobs` | リクエスト `assetImportJobId` に一致する行の `status` | `MATCHING_COMPLETED` へ更新する | `READY_FOR_MATCHING` かつ未確定件数 0 件の場合のみ実行する |
| `asset_import_jobs` | リクエスト `assetImportJobId` に一致する行の `finished_at` / `updated_at` | 完了時点の日時へ更新する | 完了監査と最終更新日時 |
| `asset_import_jobs` | `facility_id` / `import_type` / `file_name` / `file_path` / `error_message` / `started_at` / `created_by_user_id` / `created_at` | 変更しない | ジョブ文脈は維持する |
| `asset_import_rows` | 対象ジョブ配下の全行 | 変更しない | 全行確定済みであることを前提にジョブだけを完了状態へ更新する |
| `asset_data_matching_items` / `asset_ledgers` | 全カラム | 変更しない | データ突合・原本確定APIの責務。本APIでは原本資産を生成しない |

## 第6章 権限・業務ルール

### 必要権限

| 処理 | 必要 feature_code | 判定基準 | 説明 |
| --- | --- | --- | --- |
| 取込画面コンテキスト取得 / ジョブ状態取得 / ファイルアップロード / ジョブ再取込 / ジョブ削除 | `asset_ledger_import` | 通常アカウントは作業対象施設に対して実効 `asset_ledger_import` を持つこと。共有システム管理者は対象施設が未削除であること | 資産台帳取込を実行する |
| 突き合わせ画面コンテキスト取得 / 一覧取得 / 候補取得 / 行更新 / 一括確定 / Excel出力 / Excel取込 / 突き合わせ完了 | `survey_ledger_matching` | 通常アカウントは作業対象施設に対して実効 `survey_ledger_matching` を持つこと。共有システム管理者は対象施設が未削除であること | 資産台帳突き合わせを実行する |

### 施設単位運用ルール

- 未完了ジョブ（`PROCESSING` / `READY_FOR_MATCHING`）は施設ごとに 1 件までとする
- 同一施設内では `created_by_user_id` に関係なく別ユーザーが続き作業を引き継げる前提とする
- 対象施設または対象ジョブの `facility_id` は Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設でなければならない
- 各 API は `/auth/context` の返却値だけを信用せず、対象施設に対する実効 `feature_code` または共有システム管理者例外を都度再判定する
- 資産台帳取込・マスタ突き合わせは自施設業務として扱い、協業グループや他施設公開設定は適用しない

### 突き合わせ保存ルール

- AI分類は PoC2 保存済み LUKE Model A へ `product_name:{parsed_original_asset_name}, spec:{parsed_original_model_name}` の形式で台帳原本値を連結して入力する。`parsed_original_manufacturer_name` は取込元表示値および推薦候補抽出の比較元として保持するが、分類モデル入力には含めない。非「元」項目を代替入力にはしない。本システムでは Model B は利用しない。固定資産台帳取込では値引き文字列判定を行わない
- `ai_line_classification=ABC` の行のみ `ai_recommendation_required=true` とし、JMDN由来候補と全施設の原本資産台帳由来候補を PoC1 方針の 3-gram コサイン類似度で比較して最良候補を `suggestedMatch` として提示する
- `ai_line_classification`、`ai_recommendation_required`、`ai_classification_confidence`、`ai_model_version` は内部制御・監査用として `asset_import_rows` に保持し、画面表示用レスポンスDTOおよびExcel出力列には含めない
- 類似度比較では、固定資産台帳側の `parsed_original_asset_name` / `parsed_original_manufacturer_name` / `parsed_original_model_name` を比較元とし、JMDN由来候補は有効な `ship_asset_masters` に紐づく `jmdn_registered_items.product_name` / `jmdn_registered_items.manufacturer_name` / `jmdn_classifications.general_name`、原本資産台帳由来候補は全施設の `asset_ledgers.asset_name` / `asset_ledgers.manufacturer_name` / `asset_ledgers.model_name` を比較文字列とする。原本資産台帳由来候補は `asset_ledgers.ship_asset_master_id IS NOT NULL` かつ紐づく `ship_asset_masters.is_active=true` の行を対象とする
- 3項目の全順列と括弧除去有無の2パターンで最大スコアを採用し、同点時は `ship_asset_master_id` 昇順、採用元は `JMDN_MASTER` → `ASSET_LEDGER` の順、原本資産台帳由来の同一マスタ内では `asset_ledger_id` 昇順で決定する
- AI推薦候補の品目、メーカー、型式は SHIP 資産マスタおよび関連マスタ側の値とする。ユーザー選択時はその値を初期スナップショットへ反映する。`selected_asset_item_name` は選択した資産マスタ由来の値を維持し、`selected_manufacturer_name` / `selected_model_name` は取込行固有の表示値として上書きできる。台帳原本値は比較元・確認表示・監査用であり、選択スナップショットの補完値にはしない
- `ai_line_classification=D` / `OTHER` の行は `ai_recommendation_required=false` とし、`suggestedMatch` は null のまま表示する。ただし確定条件は他の行と共通であり、利用者が有効なSHIP資産マスタを手動選択するまで確定できない
- `suggested_*_name` はAI推薦時点のマスタ表示値スナップショットとして対応する `suggested_*_id` と保持する。`selected_*_id` は選択SHIP資産マスタ由来ID、`selected_asset_item_name` は選択マスタ由来の品目名、`selected_manufacturer_name` / `selected_model_name` は選択時の初期値または取込行固有の確定表示値として保持する。メーカー名・型式がマスタ名称と異なっていてもIDと `selected_ship_asset_master_id` は維持し、空の場合はマスタ名称を有効表示値とする
- 資産マスタ未選択の自由記述は未確定の下書きに限り許可し、`selected_*_name` に入力値、対応する `selected_*_id` と `selected_ship_asset_master_id` に null を保存する。この状態では確定できない
- Excel取込では `selectedShipAssetMasterId` の指定値を有効な `ship_asset_masters` で検証する。現在と異なるIDは対応する Category / 大分類 / 中分類 / 品目 / メーカー / 型式を初期値として一括反映し、同一IDは品目名をマスタ由来値へ補正したうえで画面で編集済みのメーカー名・型式を保持する。空欄は選択解除として扱う
- Excel取込はローカルでの SHIP 資産マスタ紐づけ作業の反映に限定し、正式取込対象29カラム、`raw_data_json`、`parsed_*`、`facility_location_id`、`ai_*`、`suggested_*`、`is_confirmed`、`confirmed_by_user_id`、`confirmed_at` は更新しない
- 下位階層IDが入る場合は必要な親階層IDも同時に保持する
- 上位階層変更時は整合しない下位階層IDをクリアする
- 編集対象は未確定行のみとし、編集保存は最終保存勝ちで `asset_import_rows` へ即時反映する
- 確定時は `is_confirmed=true` と `confirmed_by_user_id` / `confirmed_at` を保存し、他ユーザーが先に確定済みの行に対する後続の確定操作は競合エラーとする
- 戻る操作では一時保存確認を行わず、各行の保存内容を保持したまま `/main` へ遷移する。専用一時保存APIは設けない
- 別途一時保存専用テーブルは設けない前提とする

### 完了・削除ルール

- 突き合わせ完了時は `asset_import_jobs.status` を `MATCHING_COMPLETED` へ更新し、`finished_at` を記録する
- 突き合わせ完了は未確定件数が 0 件の場合のみ許可し、1件でも未確定行が残る場合は画面上で完了ボタンを非活性とし、API でも 409 を返す
- `MATCHING_COMPLETED` 後のジョブは read-only とし、行更新・一括確定・再完了は受け付けない
- 再取込に備え、アップロード元ファイルの S3 オブジェクトキーは `asset_import_jobs.file_path` に記録し、ジョブ削除まで Amazon S3 上に保持する
- `status='FAILED'` の場合は `asset_import_jobs.error_message` に利用者向け失敗理由を保存し、API の `failureReason` として返す
- 再取込時は元の `FAILED` ジョブを保持したまま、新しい `asset_import_jobs` を `PROCESSING` で作成する
- ジョブ削除時は `READY_FOR_MATCHING` / `FAILED` のみ許可し、`asset_import_jobs.file_path` で管理する Amazon S3 上の保存ファイルを削除してから、関連する `asset_import_rows` と `asset_import_jobs` を一括削除する

### クライアント連携ルール

- 画面表示制御は `/auth/context` の `asset_ledger_import` / `survey_ledger_matching` を参照して行い、取込画面導線・アップロード・削除は `asset_ledger_import`、突き合わせ画面導線・編集・確定・出力・取込・完了は `survey_ledger_matching` で出し分ける
- `uploadedFiles` は施設単位のアップロード済みジョブ一覧を表す。複数エントリは複数ジョブの履歴であり、アップロードAPI自体は 1 リクエスト = 1 ファイルで扱う
- クライアント内部の fileType は `fixed-asset -> FIXED_ASSET`、`me-ledger -> OTHER_LEDGER` へ変換して API へ送信し、応答受信時は逆変換する
- `/asset-matching/rows` は現行画面で表示する列だけを返却する。施設ロケーションは `parsedFacilityLocationId`（Excel入力原文）、`facilityLocationId`（解決済みID）、`facilityLocation`（個別部署マスタ表示値）に分けて返却する。台帳原本値の `品目名（元）` / `メーカー名（元）` / `型式（元）` は `parsedOriginalAssetName` / `parsedOriginalManufacturerName` / `parsedOriginalModelName` として返却する。`suggestedMatch` はマスタ側のAI推薦値、`selectedMatch` はマスタ由来ID・品目名と取込行固有のメーカー名・型式表示値を組み合わせた選択スナップショットであり、メーカー名・型式はマスタ名称と異なる場合がある。空のメーカー名・型式はマスタ名称へフォールバックして返却する。正式取込対象29カラムのその他項目も `asset_import_rows` の型付き `parsed_*` と `raw_data_json` に保持し、後続処理では `parsed_*` を参照する。AI分類結果は画面へ返却しない
- AI分類結果（`ABC` / `D` / `OTHER`）は画面に表示しない。`suggestedMatch=null` の行では適用ボタンを表示しない、または非活性とする
- `facilityLocationId=null` の未解決行では行確定ボタンを非活性とし、誤操作時もAPIの `LOCATION_UNRESOLVED` 検証で確定を拒否する

## 第7章 エラーコード一覧

| エラーコード | HTTP | 説明 |
| --- | --- | --- |
| VALIDATION_ERROR | 400 | 入力不正、必須不足、選択SHIP資産マスタと分類IDの不整合、または親子不整合 |
| SHIP_ASSET_MASTER_REQUIRED | 400 | 資産マスタ未選択の行を確定しようとした |
| FILE_TYPE_NOT_SUPPORTED | 400 | 対応拡張子以外のファイルを指定した |
| FILE_SIZE_EXCEEDED | 400 | ファイルサイズが 10MB を超えている |
| FIXED_ASSET_COLUMN_MISSING | 非同期 | 固定資産台帳の必須ヘッダーが不足している。`failureReason` は `FIXED_ASSET_COLUMN_MISSING: columns={カラム名}` 形式 |
| FIXED_ASSET_REQUIRED_VALUE_MISSING | 非同期 | 必須の原本3項目が空。`failureReason` は `FIXED_ASSET_REQUIRED_VALUE_MISSING: row={行番号}, fields={項目名}` 形式 |
| FIXED_ASSET_VALUE_PARSE_ERROR | 非同期 | 日付・数量・金額の変換またはDB桁数検証に失敗。`failureReason` は `FIXED_ASSET_VALUE_PARSE_ERROR: row={行番号}, field={項目名}, value={値}` 形式 |
| EXCEL_TEMPLATE_INVALID | 400 | Excel取込ファイルのシート構成、管理情報、またはテンプレートバージョンが不正 |
| EXCEL_ROW_VALIDATION_ERROR | 400 | Excel取込行の `selectedShipAssetMasterId`、対象行ID、または行状態が不正 |
| FACILITY_LOCATION_INVALID | 400 | 指定された施設ロケーションIDが存在しない、論理削除済み、または対象ジョブの施設に属さない |
| LOCATION_UNRESOLVED | 400 | 施設ロケーションが未解決の行を確定しようとした |
| FACILITY_SELECTION_REQUIRED | 400 | 施設未選択で実行した |
| UNAUTHORIZED | 401 | 認証トークン未付与または無効 |
| AUTH_403_ASSET_LEDGER_IMPORT_DENIED | 403 | 通常アカウントで作業対象施設に対する実効 `asset_ledger_import` がない、共有システム管理者で作業対象施設が削除済み、または対象施設不一致 |
| AUTH_403_SURVEY_LEDGER_MATCHING_DENIED | 403 | 通常アカウントで作業対象施設に対する実効 `survey_ledger_matching` がない、共有システム管理者で作業対象施設が削除済み、または対象施設不一致 |
| FACILITY_NOT_FOUND | 404 | 対象施設が存在しない、または削除済み |
| ASSET_IMPORT_JOB_NOT_FOUND | 404 | 対象ジョブが存在しない |
| ASSET_IMPORT_ROW_NOT_FOUND | 404 | 対象行が存在しない |
| SHIP_ASSET_MASTER_NOT_FOUND | 404 | 指定された SHIP 資産マスタが存在しない、または無効 |
| UNFINISHED_JOB_ALREADY_EXISTS | 409 | 同一施設に未完了ジョブが存在する |
| JOB_STATUS_INVALID | 409 | ジョブ状態上、要求処理を実行できない |
| S3_OBJECT_WRITE_FAILED | 502 | アップロード元ファイルの Amazon S3 保存、または受付失敗時の保存済み S3 オブジェクト破棄に失敗した |
| S3_OBJECT_READ_FAILED | 502 | 再取込元ファイルを Amazon S3 から取得できない |
| S3_OBJECT_DELETE_FAILED | 502 | ジョブ削除時に Amazon S3 上の元ファイル削除に失敗した |
| AI_MODEL_NOT_AVAILABLE | 500 | AI分類モデルまたは tokenizer を読み込めない |
| AI_INFERENCE_FAILED | 500 | AI分類またはAI推薦処理に失敗した |
| INTERNAL_SERVER_ERROR | 500 | サーバー内部エラー |

## 第8章 運用・保守方針

### 取込運用方針

- アップロード前の形式/サイズ検証はフロントとサーバーの両方で実施する
- `/asset-import` 初期表示で前回ジョブが `PROCESSING` / `READY_FOR_MATCHING` / `FAILED` の場合は `/asset-matching` へ遷移し、`job.status` に応じて待機表示・失敗表示・通常表示を切り替える
- FAILED 表示から利用者が明示的にアップロード画面へ戻る操作を選んだ場合は、`/asset-import/context?ignoreFailedJobId={assetImportJobId}` を用いて同一 FAILED ジョブに対する自動再開をその画面遷移では抑止する
- AI分類モデルは保存済みモデルの `metadata.json` を基準に、モデルディレクトリからの相対パスでモデル、tokenizer、モデルバージョン、入力形式、ラベル定義を解決する
- AI分類・推薦ロジックを変更する場合は、第6章「突き合わせ保存ルール」と保存済みモデルのメタデータを同時に更新する

### 突き合わせ運用方針

- 確定値は有効な `selected_ship_asset_master_id` とマスタ由来の `selected_*_id` を保持する。`selected_asset_item_name` はマスタ由来値、`selected_manufacturer_name` / `selected_model_name` は取込行固有の表示値スナップショットとして保存し、メーカー名・型式はマスタ名称と異なっていてもよい。空の場合はマスタ名称を有効表示値とする
- 階層マスタの親子整合が崩れないよう、保存時に自動補完と下位クリアを徹底する
- 確定時は `confirmed_by_user_id` / `confirmed_at` を保存し、監査可能な状態を維持する
- Excel出力列が画面表示列と乖離しないよう、列定義変更時は同時に見直す
- Excel取込はシステム出力ブックの `取込管理情報` と `assetImportRowId` を必ず検証し、任意Excelを直接受け付けない
- SHIP資産マスタの表示列や `ship_asset_master_id` の採番・有効判定を変更する場合は、`SHIP資産マスタ` シートと Excel取込の検証ロジックを同時に見直す
