# データ突合 API内部設計

## 第1章 概要

### 本書の目的

本書は、データ突合画面（`/data-matching`）、固定資産台帳（対応中）画面（`/data-matching/ledger`）、ME管理台帳（対応中）画面（`/data-matching/me-ledger`）で利用する API の設計内容を整理し、クライアント、開発者、運用担当者が共通認識を持つことを目的とする。

特に以下を明確にする。

- 現有品調査を基底としたデータ突合セッション開始 / 再開 I/F
- 統合リスト、固定資産台帳、ME管理台帳の一覧取得と一致検索 I/F
- 完全一致 / 部分一致 / 数量不一致 / 再確認 / 未登録 / 未確認の判定登録ルール
- 原本直前スナップショット、更新競合制御、`asset_ledgers` 生成、現有品調査写真引継ぎ、`qr_codes` 紐付けルール

### 対象システム概要

データ突合は、現有品調査リストを起点に整形済み台帳リスト（固定資産台帳 / ME管理台帳 / その他）を 1 リストずつ統合し、最終的な原本リストを確定する機能である。

現行主導線は `/data-matching` のセッション型 API を正本とし、`/data-matching/ledger` と `/data-matching/me-ledger` は同一セッションの参考表示画面として扱う。個別対応補助テーブル `asset_import_survey_mappings` は参照補助であり、主導線の正本は `asset_data_matching_sessions` / `asset_data_matching_session_lists` / `asset_data_matching_items` / `asset_data_matching_item_sources` / `asset_data_matching_item_list_results` とする。

### 用語定義

| 用語 | 説明 |
| --- | --- |
| データ突合セッション | 施設単位で進行する統合作業ヘッダ。`asset_data_matching_sessions` に保持する |
| 統合対象リスト | 現有品調査を基底として順次統合する整形済み台帳リスト。`asset_data_matching_session_lists` に保持する |
| 統合リスト | 現在の原本候補一覧。原本確定直前のスナップショット正本を `asset_data_matching_items` に保持する |
| 統合元レコード | 統合リスト行の元になった現有品調査レコード / 台帳行。`asset_data_matching_item_sources` に保持する |
| 対象リスト判定結果 | 統合対象リストごとの判定結果、進捗、台帳行消費判定。`asset_data_matching_item_list_results` に保持する |
| 未登録 | 現有品側に存在し、現在の台帳リストに対応行がない状態。API 上は `UNREGISTERED` |
| 未確認 | 台帳側に存在し、現有品側に対応行がない状態。API 上は `UNCONFIRMED` |

### 対象画面

| 画面名 | 画面パス | 利用目的 |
| --- | --- | --- |
| 14. データ突合画面 | /data-matching | リスト選択、統合リストと台帳リストの突合、原本リスト確定 |
| 33. 固定資産台帳（対応中）画面 | /data-matching/ledger | 固定資産台帳側の候補確認と未確認確定の参考表示 |
| 34. ME管理台帳（対応中）画面 | /data-matching/me-ledger | ME管理台帳側の候補確認と未確認確定の参考表示 |

## 第2章 システム全体構成

### APIの位置づけ

本 API 群は、現有品調査・資産台帳取込の後段で、複数リストを統合して原本台帳を生成するための I/F を提供する。`/data-matching` が主導線であり、セッション開始、一覧取得、判定登録、原本確定、現有品調査写真の資産写真引継ぎ、および QR 遷移用の資産紐付け確定までを一連で扱う。

参考画面 `/data-matching/ledger` と `/data-matching/me-ledger` は、選択中セッションの台帳側候補を補助的に表示する位置づけであり、独立した正本 API 群は設けない。

### 画面とAPIの関係

1. データ突合画面初期表示時に画面コンテキスト取得 API を呼び出す
2. 初回利用または再開時にデータ突合セッション開始 API を呼び出す
3. リスト選択後の上パネル表示で統合リスト一覧取得 API、下パネル表示で固定資産台帳 / ME管理台帳一覧取得 API を呼び出す
4. 完全一致 / 部分一致 / 数量不一致 / 再確認押下時に突合結果登録 API を呼び出す
5. 未登録 / 未確認押下時に未登録確定 API または未確認確定 API を呼び出す
6. 誤判定を戻す場合は判定差し戻し API を呼び出す
7. このリストとの突合完了、および原本リストとして確定押下時に突合完了 / 原本確定 API を呼び出す
8. 原本リストモーダル表示時に統合結果一覧取得 API を呼び出す

### 使用テーブル

| テーブル | 利用内容 | 主な項目 |
| --- | --- | --- |
| asset_data_matching_sessions | セッション開始 / 再開 / 原本確定 | asset_data_matching_session_id, facility_id, session_status, lock_version, created_by_user_id, confirmed_by_user_id, confirmed_at |
| asset_data_matching_session_lists | 統合対象リスト確定、完了状態管理 | asset_data_matching_session_list_id, asset_import_job_id, source_label, source_order, merge_status, completed_at |
| asset_data_matching_items | 統合リスト一覧取得、原本直前スナップショット更新、論理統合保持、原本確定時の元データ | asset_data_matching_item_id, creation_type, item_status, matching_status, qr_identifier, qr_resolution_status, created_asset_ledger_id, ship_asset_master_id, facility_location_id, asset_no, management_no, equipment_no, hospital_unique_no_1/2, asset_name, department_name, section_name, room_name, category_id, large_class_id, medium_class_id, asset_item_id, manufacturer_id, model_id, category_name, large_class_name, medium_class_name, asset_item_name, manufacturer_name, model_name, original_asset_name, original_manufacturer_name, original_model_name, serial_no, detail_type, parent_asset_data_matching_item_id, quantity, unit, purchased_on, contract_settlement_no, delivery_date, inspection_date, delivery_vendor_name, lease_company_name, lease_start_on, lease_end_on, account_category, account_title, original_legal_service_life, price/tax fields, ledger_remarks, source_summary |
| asset_data_matching_item_sources | 現在代表元レコード紐付けと再集約、および有効代表元の一意制御 | asset_data_matching_item_source_id, asset_data_matching_item_id, source_type, asset_survey_record_id, asset_import_row_id, source_label, source_relation_type, active_import_row_key, active_survey_record_key |
| asset_data_matching_item_list_results | 統合対象リストごとの判定結果、進捗、台帳行消費判定の正本 | asset_data_matching_item_list_result_id, asset_data_matching_session_list_id, asset_data_matching_item_id, asset_import_row_id, matching_status, result_status, decision_note, decided_by_user_id, decided_at, reverted_by_user_id, reverted_at |
| asset_survey_sessions / asset_survey_records | 基底現有品調査の選定と統合リスト初期生成 | asset_survey_session_id, asset_survey_record_id, qr_identifier, ship_asset_master_id, department_name, section_name, room_name, asset_item_id |
| asset_import_jobs / asset_import_rows | 統合候補リスト選定、台帳側一覧取得、表示スナップショット反映 | asset_import_job_id, status, import_type, asset_import_row_id, facility_location_id, parsed_facility_location_id, parsed_ledger_no, parsed_management_device_no, parsed_serial_no, parsed_hospital_unique_no_1/2, parsed_original_asset_name, parsed_original_manufacturer_name, parsed_original_model_name, parsed_quantity, parsed_unit, parsed_contract_settlement_no, parsed_delivery_date, parsed_inspection_date, parsed_delivery_vendor_name, parsed_lease_company_name, parsed_lease_start_on, parsed_lease_end_on, parsed_account_category, parsed_account_title, parsed_original_legal_service_life, parsed_list_price_*, parsed_quotation_price_*, parsed_tax_category, parsed_tax_rate, parsed_ledger_remarks, selected_*, suggested_* |
| asset_ledgers | 原本リスト確定時の作成先、確定後参照 | asset_ledger_id, facility_id, facility_location_id, ship_asset_master_id, asset_no, management_no, equipment_no, hospital_unique_no_1/2, category_id, large_class_name, medium_class_name, asset_item_name, manufacturer_name, model_name, asset_name, ledger_original_asset_name, ledger_original_manufacturer_name, ledger_original_model_name, detail_type, parent_asset_ledger_id, quantity, unit, purchased_on, contract_settlement_no, delivery_date, inspection_date, delivery_vendor_name, lease_company_name, lease_start_on, lease_end_on, account_category, account_title, legal_service_life, list_price_*, quotation_price_*, tax_category, tax_rate, quotation_price_total_incl_tax, ledger_remarks |
| application_documents / asset_survey_photos / asset_photos | 現有品調査写真の参照と原本確定時の資産写真引継ぎ。`file_path` はAmazon S3オブジェクトキーであり、バケット名やHTTPS URLは保持しない | application_document_id, owner_type, asset_survey_record_id, asset_ledger_id, document_category, file_name, file_path, content_hash, taken_at, taken_by_user_id, is_primary, deleted_at |
| qr_codes | 原本確定時の QR 紐付け更新と QR 遷移有効化 | qr_code_id, facility_id, qr_identifier, asset_ledger_id, updated_at, deleted_at |
| asset_import_survey_mappings | 参考画面での個別対応補助管理。主導線の正本ではない | asset_import_survey_mapping_id, mapping_type, matching_status, confirm_status, decision_note |
| facilities / facility_locations | 施設整合検証、共有システム管理者アカウントの未削除施設判定、部門 / 部署 / 室表示 | facility_id, facility_name, deleted_at, department_name, section_name, room_name |
| users | 判定登録者 / 確定者の監査、共有システム管理者アカウント判定 | user_id, account_type |
| asset_categories / asset_large_classes / asset_medium_classes / asset_items / manufacturers / models | フィルタ候補、正規分類 / 表示スナップショット整合 | 各マスタID, 表示名, is_active |

## 第3章 共通仕様

### API共通仕様

- 通信方式: HTTPS
- データ形式: JSON
- 文字コード: UTF-8
- 日時形式: ISO 8601（例: `2026-04-20T00:00:00Z`）
- 一覧系 API は `cursor` / `pageSize` による cursor pagination を採用し、対象施設 / セッション単位の全件一括返却を前提にしない

### 一覧ページング仕様

- 一覧系 API の既定 `pageSize` は `100`、最大 `500` とする
- `cursor` は既定ソート順の最終行キーと `lockVersion` を符号化した continuation token とし、クライアントは `nextCursor` が返る間だけ続きを取得する
- 更新可能な `IN_PROGRESS` セッションでは、初回一覧取得時点の `lockVersion` を一覧 snapshot version として固定し、2ページ目以降は同じ `lockVersion` を付与する。不一致時は 409 (`LIST_SNAPSHOT_EXPIRED`) を返却する
- `totalCount` は条件一致総件数または対象リスト総件数、`returnedCount` は今回返却した件数を表す
- レビューや帳票で全件が必要な場合も、UI 用一覧 API ではなく別途 export / バッチ導線を設ける方針とする

### 認証方式

ログイン認証で取得した Bearer トークンを `Authorization` ヘッダーに付与して呼び出す。未認証時は 401 を返却する。

### 権限モデル

認可判定は `feature_code` を正本とし、データ突合の各 API は `survey_ledger_matching` を用いる。通常アカウントでは、Bearer トークン上の作業対象施設について `user_facility_assignments` の有効割当があり、`facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が `is_enabled=true` の場合に API 実行を許可する。共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）では、作業対象施設または対象セッションの施設が未削除であることを確認できれば、担当施設割当、施設提供設定、ユーザー施設別設定による通常判定を行わず API 実行を許可する。画面表示用の `/auth/context` は UX 用キャッシュであり、各業務 API でも同条件を再判定する。

| 処理 | 必要 feature_code | 判定テーブル | 説明 |
| --- | --- | --- | --- |
| 画面コンテキスト取得 / セッション開始 / 一覧取得 / 判定登録 / 完了 / 原本確定 / 結果一覧取得 | `survey_ledger_matching` | 通常アカウント: `user_facility_assignments`, `facility_feature_settings`, `user_facility_feature_settings` / 共有システム管理者: `users.account_type`, `facilities.deleted_at` | 通常アカウントは作業対象施設で `survey_ledger_matching` が実効有効であること。共有システム管理者は対象施設が未削除であること。データ突合業務を実行する |

### 作業対象施設ベースの認可

- 各 API は Bearer トークン上の作業対象施設に対する実効 `survey_ledger_matching` または共有システム管理者例外を都度再判定する
- 通常アカウントでは、作業対象施設に対する `user_facility_assignments` の有効割当、`survey_ledger_matching` の `facility_feature_settings`、`user_facility_feature_settings` のいずれかを満たさない場合は 403 を返却する
- 共有システム管理者アカウントでは、作業対象施設または対象セッションの施設の `facilities.deleted_at IS NULL` を確認できれば通常判定をバイパスし、削除済み施設の場合は 403 を返却する
- `facilityId` を受け付ける API は、指定施設が Bearer トークン上の作業対象施設IDと一致し、`facilities.deleted_at IS NULL` の未削除施設であることを前提とする
- `sessionId` / `sessionListId` を受け付ける API は、対象セッション / リストの `facility_id` が Bearer トークン上の作業対象施設IDと一致し、かつ `facilities.deleted_at IS NULL` の未削除施設であることを前提とする
- データ突合は自施設業務として扱い、協業グループや他施設公開設定は適用しない

### 突合ステータスコード

| コード | 画面表示 | 説明 |
| --- | --- | --- |
| FULL_MATCH | 完全一致 | 選択した台帳行と統合リスト行群が整合している状態 |
| PARTIAL_MATCH | 部分一致 | 一部属性が異なるが同一資産と判断した状態 |
| QUANTITY_MISMATCH | 数量不一致 | 同一資産と判断するが数量が一致しない状態 |
| RECHECK | 再確認 | 判断保留として次回確認対象に残す状態 |
| UNCONFIRMED | 未確認 | 台帳側のみ存在する行として原本候補へ追加した状態 |
| UNREGISTERED | 未登録 | 現有品側のみ存在する行として原本候補へ残した状態 |

### 更新競合 / 冪等性仕様

- 競合検知トークンは `asset_data_matching_sessions.lock_version` を用いる。更新系 API は `lockVersion` を受け取り、取得時点の値と一致しない場合は 409 (`SESSION_CONFLICT`) を返却する
- 更新系 API 成功時は `asset_data_matching_sessions.lock_version` を +1 し、その値をレスポンスへ返却する。`updated_at` は監査用の最終更新日時として保持する
- `POST /data-matching/sessions/{sessionId}/matches`、`mark-unregistered`、`mark-unconfirmed`、`revert-decision`、`complete` は `Idempotency-Key` ヘッダーを必須とし、同一 `sessionId` + 実行ユーザー + API パス + 同一 payload の再送は初回応答を再返却する
- 同一 `Idempotency-Key` に対して payload が異なる場合は 409 (`IDEMPOTENCY_KEY_REUSED`) を返却する
- 更新系 API は `asset_data_matching_sessions`、対象 `asset_data_matching_session_lists`、対象 `asset_data_matching_items` / `asset_data_matching_item_sources` / `asset_import_rows` / `asset_data_matching_item_list_results` を1トランザクションで更新し、失敗時は部分反映しない
- `POST /data-matching/sessions` は施設単位の `IN_PROGRESS` 一意制約により業務的に冪等化し、同時開始競合時も既存セッション再開結果を返却する

### 代表値と正本の責務

- `asset_data_matching_item_list_results` は対象リスト単位の判定正本であり、`result_status='ACTIVE'` の行を用いて `対応中` / `対応済み`、進捗件数、台帳行消費判定を決定する
- 現在処理対象リストは `source_type='IMPORT_JOB' AND merge_status='PENDING'` のうち `source_order` 最小の 1 件とし、`matches` / `mark-unregistered` / `mark-unconfirmed` / `COMPLETE_LIST` は当該リストに対してのみ実行する
- `decisionNote` の保存先は `asset_data_matching_item_list_results.decision_note` に統一し、結果確認画面では `listResults[].decisionNote` を判定メモの正本として返す
- `asset_data_matching_items.creation_type` / `item_status` は統合リスト行の生成起点と有効状態を表し、上パネル一覧 / 原本候補一覧 / 原本確定では `merged_into_item_id IS NULL AND item_status='ACTIVE'` の行のみを対象とする
- `asset_data_matching_items.matching_status` は最新確定判定の代表値を保持する denormalized snapshot とし、更新系 API は判定履歴または論理統合状態保存後に共通 snapshot 再構築サービスを呼び出し、`result_status='ACTIVE'` の判定履歴を `source_order ASC` で再適用して同一トランザクションで更新する
- `asset_data_matching_items.qr_identifier` / `qr_resolution_status` は `SURVEY_RECORD` 集合の QR 代表値を保持する denormalized snapshot とし、共通 snapshot 再構築サービスが非NULL distinct QR を集約して 0 件なら `NONE`、1 件ならその値を採用して `RESOLVED`、2 件以上なら `qr_identifier=NULL` / `CONFLICT` とする
- `asset_data_matching_items.created_asset_ledger_id` は原本確定後に作成された `asset_ledgers.asset_ledger_id` を保持する監査・遷移用キーであり、`GET /result` で返却して確定後の資産カルテ参照に利用する
- `asset_data_matching_item_sources` は現在代表元の provenance を保持し、`source_type='IMPORT_ROW'` は現在代表台帳行、`source_type='SURVEY_RECORD'` は統合済み現有品調査レコード集合を表す。`active_import_row_key` / `active_survey_record_key` は共通 snapshot 再構築サービスが同一トランザクション内に更新し、同一セッション内の有効代表元重複を一意制約で禁止する
- `asset_data_matching_items.source_summary` は画面表示用のサマリ列であり、完了判定や重複消費判定には用いない

### 一致検索 / フィルタ仕様

- 共通フィルタは部門 / 部署 / カテゴリ / 大分類 / 中分類 / 品目 / メーカー / 型式 / キーワードをAND条件で適用する
- `keyword` は `asset_no` / `equipment_no` / `asset_item_name` / `manufacturer_name` / `model_name` の表示列にのみ部分一致し、`decisionNote` など判定履歴メモは共通 keyword 検索に含めない
- 一致検索は選択中リストの未完了台帳行と比較し、`CATEGORY` / `ASSET_NO` / `LARGE_CLASS` / `ASSET_ITEM` / `MANUFACTURER` のいずれか 1 種類を適用する
- 統合リスト側の `tab=PENDING` は当該 `sessionListId` に対する `asset_data_matching_item_list_results.result_status='ACTIVE'` が存在しない行、`tab=COMPLETED` は有効判定結果行が存在する行を返す
- 固定資産台帳（対応中）画面とME管理台帳（対応中）画面は、主導線の session API と同一条件でフィルタリングする

### エラーレスポンス仕様

#### 基本エラーレスポンス（ErrorResponse）

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| code | string | ✓ | エラーコード |
| message | string | ✓ | 利用者向けエラーメッセージ |
| details | string[] | - | 入力エラーや補足情報 |
| conflictItems | QrBindingConflictItem[] | - | `ORIGINAL_QR_BINDING_CONFLICT` 時の競合明細 |

#### conflictItems要素（QrBindingConflictItem）

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| assetDataMatchingItemId | int64 | ✓ | 競合した統合リスト行ID |
| qrIdentifier | string\|null | ✓ | 対象 QR 識別子。未解決時は null |
| conflictType | string | ✓ | 競合種別。`UNRESOLVED` / `DUPLICATED_IN_SESSION` / `NOT_ISSUED` / `DELETED` / `BOUND_OTHER_ASSET` / `FACILITY_MISMATCH` |
| conflictingAssetDataMatchingItemId | int64\|null | ✓ | `DUPLICATED_IN_SESSION` 時に衝突している相手側統合リスト行ID |
| sourceSurveyRecordIds | int64[] | ✓ | 競合判定の根拠となった現有品調査レコードID一覧 |
| conflictingQrCodeId | int64\|null | ✓ | 競合した `qr_codes.qr_code_id`。未発行時は null |
| conflictingAssetLedgerId | int64\|null | ✓ | 既に紐づいていた `asset_ledgers.asset_ledger_id`。未紐付時は null |

## 第4章 API一覧

### データ突合（/data-matching）

| 機能名 | Method | Path | 概要 | 認証 |
| --- | --- | --- | --- | --- |
| 画面コンテキスト取得 | GET | /data-matching/context | 対象施設、進行中セッション、統合対象一覧、件数サマリ、フィルタ候補を取得する | 要 |
| データ突合セッション開始 | POST | /data-matching/sessions | 進行中セッションを再開または新規開始し、統合対象リストを確定する | 要 |
| 統合リスト一覧取得 | GET | /data-matching/sessions/{sessionId}/merged-items | 上パネルの統合リスト一覧、進捗、タブ別件数を取得する | 要 |
| 固定資産台帳（対応中）一覧取得 | GET | /data-matching/sessions/{sessionId}/fixed-asset-ledger-items | 固定資産台帳側の対応中一覧と件数サマリを取得する | 要 |
| ME管理台帳（対応中）一覧取得 | GET | /data-matching/sessions/{sessionId}/me-ledger-items | ME管理台帳側の対応中一覧と件数サマリを取得する | 要 |
| 突合結果登録 | POST | /data-matching/sessions/{sessionId}/matches | 完全一致 / 部分一致 / 数量不一致 / 再確認を登録する | 要 |
| 未登録確定 | POST | /data-matching/sessions/{sessionId}/mark-unregistered | 現有品側のみ存在する項目を未登録として確定する | 要 |
| 未確認確定 | POST | /data-matching/sessions/{sessionId}/mark-unconfirmed | 台帳側のみ存在する項目を未確認として確定する | 要 |
| 判定差し戻し | POST | /data-matching/sessions/{sessionId}/revert-decision | 現在リストに対する判定を差し戻し、必要に応じて論理統合を復元する | 要 |
| 突合完了 / 原本確定 | POST | /data-matching/sessions/{sessionId}/complete | 現在リスト完了または原本リスト確定を実行する | 要 |
| 統合結果一覧取得 | GET | /data-matching/sessions/{sessionId}/result | 原本リストモーダル用の統合結果一覧を取得する | 要 |

## 第5章 データ突合機能設計

### getDataMatchingContext

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象セッションの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. `facilityId` 省略時は Bearer トークン上の作業対象施設IDを採用し、指定時はそれと一致することを検証する
2. 対象施設が `facilities.deleted_at IS NULL` の未削除施設であることを検証する
3. 同一施設に `asset_data_matching_sessions.session_status='IN_PROGRESS'` のセッションが存在する場合は、そのセッションと配下 `asset_data_matching_session_lists` / `asset_data_matching_items` / `asset_data_matching_item_list_results` を返却する
4. 進行中セッションがある場合は、`source_type='IMPORT_JOB' AND merge_status='PENDING'` のうち `source_order` 最小の 1 件を現在処理対象リストとし、判定登録 / `COMPLETE_LIST` は当該リストに対してのみ許可する
5. 進行中セッションが存在しない場合は、最新の確定済み現有品調査セッションを基底候補とし、`asset_import_jobs.status='MATCHING_COMPLETED'` の整形済み台帳リストを統合候補として返却する
6. フィルタ候補は、進行中セッションがある場合は現在の統合リストと未完了対象リストから、未開始の場合は基底調査データと統合候補リストから算出する
7. `canConfirmOriginal` は進行中セッションがあり、かつ現在の `asset_data_matching_items` 全件が有効なSHIP資産マスタ紐付け、マスタ由来IDの整合、原本確定必須項目、QR 解決・紐付け可否を満たす場合に true を返し、途中確定ボタン活性判定に利用する

### postDataMatchingSessions

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象セッションの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. `facilityId` 省略時は Bearer トークン上の作業対象施設IDを採用し、指定時はそれと一致することを検証する
2. 同一施設に `session_status='IN_PROGRESS'` の `asset_data_matching_sessions` が存在する場合は新規作成せず、その既存セッションを再開結果として返却する
3. 進行中セッションがない場合は、最新の確定済み現有品調査セッションを基底 `asset_data_matching_session_lists.source_type='SURVEY_BASE'` として登録する
4. `asset_import_jobs.status='MATCHING_COMPLETED'` の整形済み台帳リストを取得し、固定資産台帳 -> ME管理台帳 -> その他の表示順優先度と `created_at ASC` で `asset_data_matching_session_lists` に初期登録する
5. `source_type='IMPORT_JOB' AND merge_status='PENDING'` のうち `source_order` 最小の 1 件を現在処理対象リストとし、以後の判定登録はこの順序でのみ許可する
6. 基底調査レコードごとに `asset_data_matching_items` を作成し、`creation_type='SURVEY_BASE'`、`item_status='ACTIVE'` を設定する。元レコードは `asset_data_matching_item_sources` に `source_type='SURVEY_RECORD'` として登録し、`active_survey_record_key` を設定して有効統合リスト行の代表元重複を禁止する
7. 初期生成時の `qr_identifier` / `qr_resolution_status` は基底調査レコードの `asset_survey_records.qr_identifier` から設定し、QRありなら `RESOLVED`、QRなしなら `NONE` とする
8. 新規作成は 1 トランザクションで実行し、施設単位の `IN_PROGRESS` 一意制約で同時開始競合を吸収する
9. 新規作成時は `currentMergedSummary.sourceListLabels` に基底調査リストのみを設定し、`asset_data_matching_sessions.lock_version=0` と `updated_at` を返却する。以後の競合検知は `lockVersion`、`updated_at` は監査用の最終更新日時として扱う

### getDataMatchingSessionsBySessionIdMergedItems

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象セッションの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. 対象 `sessionId` が Bearer トークン上の作業対象施設と同一施設に属する `IN_PROGRESS` セッションであることを検証する
2. `sessionListId` が当該セッション配下の `source_type='IMPORT_JOB'` であり、`merge_status='PENDING'` または `'COMPLETED'` であることを検証する
3. 初回要求で `lockVersion` 省略時は現在の `asset_data_matching_sessions.lock_version` を当該一覧の snapshot version として採用する。指定時は `cursor` に埋め込まれた `lockVersion` と一致し、かつ `session_status='IN_PROGRESS'` の間は現在の `lock_version` と一致することを検証する。不一致時は 409 (`LIST_SNAPSHOT_EXPIRED`) を返却する
4. `asset_data_matching_items` のうち `merged_into_item_id IS NULL AND item_status='ACTIVE'` の有効行を対象に、`asset_data_matching_item_list_results.result_status='ACTIVE'` を `sessionListId` で突合し、選択中リストに対する `matchingStatus`・`decisionNote`・完了済み判定・進捗件数を算出する
5. `tab='PENDING'` では `result_status='ACTIVE'` の判定結果が存在しない統合リスト行のみ、`tab='COMPLETED'` では当該リストに対する有効判定結果行が存在する統合リスト行のみを返却する
6. 共通フィルタは `department_name` / `section_name` と各種マスタID列に対して適用する
7. 一致検索は選択中リストの未完了台帳行と比較し、カテゴリ / 資産番号 / 大分類 / 品目 / メーカーの一致候補のみを残す
8. `cursor` 指定時は既定ソート順と `lockVersion` を固定した snapshot の続き位置から取得し、`pageSize` 件を上限に返却する
9. 返却順は `department_name ASC, section_name ASC, asset_item_name ASC, asset_data_matching_item_id ASC` を既定とする

### getDataMatchingSessionsBySessionIdFixedAssetLedgerItems

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象セッションの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. 対象セッションと `sessionListId` の施設整合を検証し、対象 list が固定資産台帳系の整形済みリストであることを検証する
2. 初回要求で `lockVersion` 省略時は現在の `asset_data_matching_sessions.lock_version` を当該一覧の snapshot version として採用する。指定時は `cursor` に埋め込まれた `lockVersion` と一致し、かつ `session_status='IN_PROGRESS'` の間は現在の `lock_version` と一致することを検証する。不一致時は 409 (`LIST_SNAPSHOT_EXPIRED`) を返却する
3. 対象 `asset_import_job_id` 配下の `asset_import_rows` から、当該 `sessionListId` の `asset_data_matching_item_list_results.result_status='ACTIVE'` に未登録の未処理行のみを `items` として返却する。突合済行は件数サマリには含めるが `items` には含めない
4. 対応中一覧の列構成をモックと共通化するため `matchingStatus` / `qrIdentifier` をレスポンス項目として保持するが、未処理行のみを返却するため値はいずれも null とする
5. `managementNo` は `asset_import_rows.parsed_management_device_no` を返却する。備品番号・既存機器番号を表す `equipmentNo` とは区別する
6. 分類名は取込突き合わせで確定済みの `selected_category_name` / `selected_large_class_name` / `selected_medium_class_name` を返却する。`suggested_*_name` は推薦候補のため、利用者が適用して `selected_*` へ保存するまでデータ突合の確定表示値にはしない
7. `matchedCount` は当該 `sessionListId` の有効 `asset_data_matching_item_list_results.asset_import_row_id` 件数、`pendingCount` は未処理行数として算出する
8. 共通フィルタおよび一致検索条件は上パネルと同じ条件を適用し、下パネル候補を同期表示する
9. `cursor` 指定時は既定ソート順と `lockVersion` を固定した snapshot の続き位置から取得し、`pageSize` 件を上限に返却する
10. 返却順は `parsed_ledger_no ASC, asset_import_row_id ASC` を既定とする

### getDataMatchingSessionsBySessionIdMeLedgerItems

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象セッションの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. 対象セッションと `sessionListId` の施設整合を検証し、対象 list がME管理台帳系の整形済みリストであることを検証する
2. 初回要求で `lockVersion` 省略時は現在の `asset_data_matching_sessions.lock_version` を当該一覧の snapshot version として採用する。指定時は `cursor` に埋め込まれた `lockVersion` と一致し、かつ `session_status='IN_PROGRESS'` の間は現在の `lock_version` と一致することを検証する。不一致時は 409 (`LIST_SNAPSHOT_EXPIRED`) を返却する
3. 対象 `asset_import_job_id` 配下の `asset_import_rows` から、当該 `sessionListId` の `asset_data_matching_item_list_results.result_status='ACTIVE'` に未登録の未処理行のみを `items` として返却する。突合済行は件数サマリには含めるが `items` には含めない
4. 対応中一覧の列構成をモックと共通化するため `matchingStatus` / `qrIdentifier` をレスポンス項目として保持するが、未処理行のみを返却するため値はいずれも null とする
5. `managementNo` は `asset_import_rows.parsed_management_device_no` を返却する。備品番号・既存機器番号を表す `equipmentNo` とは区別する
6. 分類名は取込突き合わせで確定済みの `selected_category_name` / `selected_large_class_name` / `selected_medium_class_name` を返却する。`suggested_*_name` は推薦候補のため、利用者が適用して `selected_*` へ保存するまでデータ突合の確定表示値にはしない
7. `purchasedOn` の取得元は要件保留中とする。現時点では null を返却し、`parsed_inspection_date` を購入日へ代用しない
8. `matchedCount` は当該 `sessionListId` の有効 `asset_data_matching_item_list_results.asset_import_row_id` 件数、`pendingCount` は未処理行数として算出する
9. 共通フィルタおよび一致検索条件は上パネルと同じ条件を適用し、ME台帳候補を同期表示する
10. `cursor` 指定時は既定ソート順と `lockVersion` を固定した snapshot の続き位置から取得し、`pageSize` 件を上限に返却する
11. 返却順は `parsed_management_device_no ASC, asset_import_row_id ASC` を既定とする

### postDataMatchingSessionsBySessionIdMatches

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象セッションの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. 対象セッションが `IN_PROGRESS` であり、`sessionListId` が未完了の統合対象リストであることを検証する
2. `sessionListId` が `source_type='IMPORT_JOB' AND merge_status='PENDING'` のうち `source_order` 最小の現在処理対象リストであることを検証し、異なる場合は 409 (`SESSION_LIST_SEQUENCE_INVALID`) を返却する
3. 要求 `lockVersion` と `asset_data_matching_sessions.lock_version` を比較し、不一致時は 409 (`SESSION_CONFLICT`) を返却する
4. `Idempotency-Key` の再送時は、同一 `sessionId` + 実行ユーザー + API パス + 同一 payload であれば初回応答を再返却し、異なる payload なら 409 (`IDEMPOTENCY_KEY_REUSED`) を返却する
5. `asset_data_matching_sessions` / `asset_data_matching_session_lists` / 対象 `asset_data_matching_items` / 対象 `asset_import_rows` を 1 トランザクション内で排他取得する
6. `mergedItemIds` はすべて同一セッション配下の `merged_into_item_id IS NULL AND item_status='ACTIVE'` な有効行であり、かつ当該リストに対する `asset_data_matching_item_list_results.result_status='ACTIVE'` が未作成であることを検証する
7. `representativeItemId` が `mergedItemIds` に含まれ、かつ同一セッション配下の有効統合リスト行であることを検証する
8. `mergedItemIds` のうち代表行以外は、他 `asset_data_matching_session_list_id` 向けの `result_status='ACTIVE'` 判定履歴を持たず、かつ他行から `parent_asset_data_matching_item_id` で参照されていないことを検証する。満たさない場合は 409 (`MERGED_ITEM_NOT_MERGEABLE`) を返却する
9. `ledgerItemId` が当該 `sessionListId` 配下の `asset_import_rows` に属し、同一 `sessionListId` の有効 `asset_data_matching_item_list_results` で未消費であることを検証する。あわせて `is_confirmed=true`、`selected_ship_asset_master_id IS NOT NULL`、紐づく `ship_asset_masters.is_active=true`、保存済み `selected_*_id` が選択SHIP資産マスタ由来IDと整合することを検証し、不整合は 409 (`DATA_MATCHING_SOURCE_MASTER_INVALID`) とする
10. 同一 `sessionListId` 内で1回の登録に利用できる下パネル行は 1 件のみとする
11. 選択上パネル行の `detail_type` および `parent_asset_data_matching_item_id` を比較し、`representativeItemId` の値と整合しない組み合わせや、非NULL値どうしの矛盾がある選択は 409 (`MERGE_HIERARCHY_CONFLICT`) を返却する
12. 選択上パネル行に含まれる既存 `IMPORT_ROW` 元レコードを source label 単位で重複検査し、`台帳1 : 現有品調査n` 制約を崩す選択は 409 (`MATCH_RULE_VIOLATION`) とする
13. 代表行以外の選択行は物理削除せず、`merged_into_item_id=代表行ID`、`merged_by_session_list_id=sessionListId` を設定して論理統合状態へ更新する
14. 代表行に対する `asset_data_matching_item_list_results` を `result_status='ACTIVE'` で1件作成し、`decision_note` に要求 `decisionNote` を保存する
15. 更新した判定履歴と論理統合状態を入力として、共通 snapshot 再構築サービスが影響 item を `asset_data_matching_session_lists.source_order ASC` の `result_status='ACTIVE'` 判定履歴順に再計算する
16. 同サービスは current list の確定済み台帳行を原本直前 snapshot へ反映する際、正式取込対象29カラムに対応する型付き `parsed_*` を現在代表の `IMPORT_ROW` から参照し、`raw_data_json` は再解釈しない。マスタ紐付けと分類IDは `selected_ship_asset_master_id` / `selected_*_id` を確定値として反映し、`suggested_*` は推薦候補のため直接採用しない。`asset_item_name` は選択SHIP資産マスタ由来の品目名、`manufacturer_name` / `model_name` は空でない `selected_manufacturer_name` / `selected_model_name` を優先し、空の場合は選択SHIP資産マスタのメーカー名 / 型式を反映する。メーカー名・型式がマスタ名称と異なっていてもマスタIDと分類IDは保持する。Excelの原文3項目はマスタ側確定値の補完に使わない。`asset_name` は台帳由来行では `parsed_original_asset_name`、現有品調査のみ行では既存 snapshot を採用する。`unit` は `parsed_unit -> 既存 unit` の優先順で更新する。固定資産台帳取込では明細区分・明細親機を取り込まないため、台帳行から `detail_type` / `parent_asset_data_matching_item_id` を生成せず、現有品調査由来の既存階層を保持する
17. 同サービスは `matching_status` を要求 `matchingStatus` に更新し、`asset_data_matching_item_sources` / `source_summary` を再計算する。`source_type='IMPORT_ROW'` は `ledgerItemId`、`source_type='SURVEY_RECORD'` は代表行と論理統合対象行に紐づく調査レコードの和集合とし、`active_import_row_key` / `active_survey_record_key` を同一トランザクションで再設定する。一意制約違反時は 409 (`MATCH_RULE_VIOLATION`) を返却する
18. 同サービスは再集約後の `SURVEY_RECORD` 集合に含まれる `asset_survey_records.qr_identifier` の非NULL distinct 値から、`qr_identifier` / `qr_resolution_status` を再計算する。0 件なら `NONE`、1 件ならその値を採用して `RESOLVED`、2 件以上なら `qr_identifier=NULL` / `CONFLICT` とする
19. 更新成功時は `asset_data_matching_sessions.lock_version` を +1 し、`updated_at` も更新した上で、新しい `lockVersion` と `sessionUpdatedAt` を返却する

### postDataMatchingSessionsBySessionIdMarkUnregistered

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象セッションの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. 対象セッションが `IN_PROGRESS` であり、`sessionListId` が未完了の統合対象リストであることを検証する
2. `sessionListId` が `source_type='IMPORT_JOB' AND merge_status='PENDING'` のうち `source_order` 最小の現在処理対象リストであることを検証し、異なる場合は 409 (`SESSION_LIST_SEQUENCE_INVALID`) を返却する
3. 要求 `lockVersion` と `asset_data_matching_sessions.lock_version` を比較し、不一致時は 409 (`SESSION_CONFLICT`) を返却する
4. `Idempotency-Key` の再送時は、同一 payload であれば初回応答を再返却し、異なる payload なら 409 (`IDEMPOTENCY_KEY_REUSED`) を返却する
5. `asset_data_matching_sessions` / `asset_data_matching_session_lists` / 対象 `asset_data_matching_items` を 1 トランザクション内で排他取得する
6. `mergedItemIds` はすべて同一セッション配下の `merged_into_item_id IS NULL AND item_status='ACTIVE'` な有効行であり、かつ当該リストに対する `asset_data_matching_item_list_results.result_status='ACTIVE'` が未作成であることを検証する
7. 選択行ごとに `asset_data_matching_item_list_results` を `matching_status='UNREGISTERED'`、`result_status='ACTIVE'`、`asset_import_row_id=NULL` で作成し、`decision_note` を保存する
8. 更新した判定履歴を入力として、共通 snapshot 再構築サービスが対象 item を `asset_data_matching_session_lists.source_order ASC` の `result_status='ACTIVE'` 判定履歴順に再計算する。current list は `IMPORT_ROW` を持たない `UNREGISTERED` 判定として扱い、`matching_status` / `asset_data_matching_item_sources` / `source_summary` / `qr_identifier` / `qr_resolution_status` を同一トランザクションで再更新する
9. 更新成功時は `asset_data_matching_sessions.lock_version` を +1 し、`updated_at` も更新した上で、新しい `lockVersion` と `sessionUpdatedAt` を返却する
10. 新たな `asset_ledgers` は作成せず、原本確定時まで統合リスト行として保持する

### postDataMatchingSessionsBySessionIdMarkUnconfirmed

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象セッションの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. 対象セッションが `IN_PROGRESS` であり、`sessionListId` が未完了の統合対象リストであることを検証する
2. `sessionListId` が `source_type='IMPORT_JOB' AND merge_status='PENDING'` のうち `source_order` 最小の現在処理対象リストであることを検証し、異なる場合は 409 (`SESSION_LIST_SEQUENCE_INVALID`) を返却する
3. 要求 `lockVersion` と `asset_data_matching_sessions.lock_version` を比較し、不一致時は 409 (`SESSION_CONFLICT`) を返却する
4. `Idempotency-Key` の再送時は、同一 payload であれば初回応答を再返却し、異なる payload なら 409 (`IDEMPOTENCY_KEY_REUSED`) を返却する
5. `asset_data_matching_sessions` / `asset_data_matching_session_lists` / 対象 `asset_import_rows` を 1 トランザクション内で排他取得する
6. `ledgerItemIds` はすべて当該リスト配下の未処理 `asset_import_rows` であり、同一 `sessionListId` の有効 `asset_data_matching_item_list_results` で未消費であることを検証する。あわせて `is_confirmed=true`、`selected_ship_asset_master_id IS NOT NULL`、紐づく `ship_asset_masters.is_active=true`、保存済み `selected_*_id` が選択SHIP資産マスタ由来IDと整合することを検証し、不整合は 409 (`DATA_MATCHING_SOURCE_MASTER_INVALID`) とする
7. 選択した台帳行ごとに `asset_data_matching_items` を新規作成し、正式取込対象29カラムに対応する型付き `parsed_*` を、原本直前スナップショットの共通項目と台帳取込スナップショットへ複写する。マスタ紐付けと分類IDは `selected_ship_asset_master_id` / `selected_*_id` を確定値として設定し、`suggested_*` は直接採用しない。`asset_item_name` は選択SHIP資産マスタ由来の品目名、`manufacturer_name` / `model_name` は空でない `selected_manufacturer_name` / `selected_model_name`、それぞれが空の場合は選択SHIP資産マスタのメーカー名 / 型式を設定する。メーカー名・型式がマスタ名称と異なっていてもそのまま複写し、Excelの原文3項目を補完値にはしない
8. 新規統合リスト行の `creation_type` を `UNCONFIRMED_IMPORT`、`item_status` を `ACTIVE`、`matching_status` を `UNCONFIRMED`、`qr_identifier` を NULL、`qr_resolution_status` を `NONE`、`detail_type` / `parent_detail_name` / `parent_asset_data_matching_item_id` / `merged_into_item_id` / `merged_by_session_list_id` を NULL とし、元レコードは `asset_data_matching_item_sources` に `source_type='IMPORT_ROW'` で紐づける。固定資産台帳取込では明細区分・明細親機を取り込まず、台帳行から親子関係を生成しない。`active_import_row_key` は後続の共通 snapshot 再構築サービスが設定し、一意制約違反時は 409 (`MATCH_RULE_VIOLATION`) を返却する
9. 同時に `asset_data_matching_item_list_results` を `matching_status='UNCONFIRMED'`、`result_status='ACTIVE'` で作成し、`asset_import_row_id` に消費した台帳行IDと `decision_note` を保存する
10. 作成した item と判定履歴を入力として、共通 snapshot 再構築サービスが対象 item を `asset_data_matching_session_lists.source_order ASC` の `result_status='ACTIVE'` 判定履歴順に正規化し、`matching_status` / `source_summary` / `active_import_row_key` を確定する
11. 更新成功時は `asset_data_matching_sessions.lock_version` を +1 し、`updated_at` も更新した上で、新しい `lockVersion` と `sessionUpdatedAt` を返却する

### postDataMatchingSessionsBySessionIdRevertDecision

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象セッションの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. 対象セッションが `IN_PROGRESS` であり、`sessionListId` が当該セッション配下の対象リストであることを検証する
2. 要求 `lockVersion` と `asset_data_matching_sessions.lock_version` を比較し、不一致時は 409 (`SESSION_CONFLICT`) を返却する
3. `Idempotency-Key` の再送時は、同一 payload であれば初回応答を再返却し、異なる payload なら 409 (`IDEMPOTENCY_KEY_REUSED`) を返却する
4. `asset_data_matching_sessions` / `asset_data_matching_session_lists` / 対象 `asset_data_matching_items` / 有効 `asset_data_matching_item_list_results` を 1 トランザクション内で排他取得する
5. `assetDataMatchingItemIds` はすべて `merged_into_item_id IS NULL AND item_status='ACTIVE'` な有効統合リスト行であり、当該 `sessionListId` に対する `result_status='ACTIVE'` 判定結果が存在することを検証する。存在しない場合は 404 (`DATA_MATCHING_DECISION_RESULT_NOT_FOUND`) を返却する
6. 対象 `assetDataMatchingItemIds` について、`sessionListId` より大きい `source_order` を持つ `asset_data_matching_session_lists` に `result_status='ACTIVE'` 判定履歴が残る場合は、後続リスト依存が解消されていないため 409 (`RESULT_REVERT_NOT_ALLOWED`) を返却する。差し戻しは後ろから順にのみ許可する
7. 対象有効判定結果を `result_status='REVERTED'` へ更新し、`revert_note`、`reverted_by_user_id`、`reverted_at` を保存する。対応する `asset_import_row_id` は未消費状態へ戻す
8. `merged_by_session_list_id=sessionListId` かつ `merged_into_item_id=代表行ID` の論理統合行を復元し、`merged_into_item_id` / `merged_by_session_list_id` を NULL へ戻す
9. 復元後の影響 item は、共通 snapshot 再構築サービスが残存する `result_status='ACTIVE'` 判定履歴を `asset_data_matching_session_lists.source_order ASC` で再適用して `asset_data_matching_items` / `asset_data_matching_item_sources` / `source_summary` / `active_import_row_key` / `active_survey_record_key` を再計算する。一意制約違反時は 409 (`MATCH_RULE_VIOLATION`) を返却する。有効判定が残らない場合、`matching_status` は NULL に戻す
10. 再計算後の `SURVEY_RECORD` 集合に含まれる `asset_survey_records.qr_identifier` の非NULL distinct 値から、`qr_identifier` / `qr_resolution_status` も再計算する。0 件なら `NONE`、1 件ならその値を採用して `RESOLVED`、2 件以上なら `qr_identifier=NULL` / `CONFLICT` とする
11. `creation_type='UNCONFIRMED_IMPORT'` の行について、差し戻し後に `result_status='ACTIVE'` 判定履歴が0件となる場合は `item_status='INVALIDATED'` に更新し、以後の上パネル一覧 / 原本候補一覧 / 原本確定対象から除外する
12. 対象 `sessionListId` が `merge_status='COMPLETED'` の場合は `PENDING` へ戻し、`completed_at` を NULL として再作業可能にする
13. 更新成功時は `asset_data_matching_sessions.lock_version` を +1 し、`updated_at` も更新した上で、新しい `lockVersion` と `sessionUpdatedAt` を返却する

### postDataMatchingSessionsBySessionIdComplete

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象セッションの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. 対象セッションが `IN_PROGRESS` であり、Bearer トークン上の作業対象施設と一致することを検証する
2. 要求 `lockVersion` と `asset_data_matching_sessions.lock_version` を比較し、不一致時は 409 (`SESSION_CONFLICT`) を返却する
3. `Idempotency-Key` の再送時は、同一 payload であれば初回応答を再返却し、異なる payload なら 409 (`IDEMPOTENCY_KEY_REUSED`) を返却する
4. `asset_data_matching_sessions` と対象 `asset_data_matching_session_lists` を 1 トランザクション内で排他取得する
5. `completionType='COMPLETE_LIST'` の場合は、`sessionListId` が当該セッション配下の未完了リストであり、かつ `source_type='IMPORT_JOB' AND merge_status='PENDING'` のうち `source_order` 最小の現在処理対象リストであることを検証し、異なる場合は 409 (`SESSION_LIST_SEQUENCE_INVALID`) を返却する。当該リストに対する `asset_data_matching_item_list_results.result_status='ACTIVE'` 未作成の有効統合リスト行（`merged_into_item_id IS NULL AND item_status='ACTIVE'`）と未処理台帳行が 0 件であることもあわせて検証する
6. `COMPLETE_LIST` では `asset_data_matching_session_lists.merge_status` を `COMPLETED` に更新し、`completed_at` を記録する
7. `completionType='CONFIRM_ORIGINAL'` の場合は、未完了リストが残るとき `skipRemaining=true` を必須とし、残存 `PENDING` リストを `SKIPPED` へ更新する
8. 原本確定時は、現在の `asset_data_matching_items` のうち `merged_into_item_id IS NULL AND item_status='ACTIVE'` の有効行について、`ship_asset_master_id` が非NULLかつ有効な `ship_asset_masters` を参照し、`category_id` / `large_class_id` / `medium_class_id` / `asset_item_id` が当該資産マスタ由来IDと整合することを検証する。さらに `category_id`、`large_class_name`、`medium_class_name`、`asset_item_name`、`asset_name`、`quantity` の必須項目が全件で解決済みであることを検証し、不足・無効・ID不整合があれば 409 (`ORIGINAL_LEDGER_SNAPSHOT_INCOMPLETE`) を返却する。メーカー名・型式の表示値が資産マスタ名称と異なることは許可し、空の場合は資産マスタ名称を有効表示値とする。品目名は資産マスタ由来の値とする
9. 原本確定時は、`qr_resolution_status='CONFLICT'` の有効行（`item_status='ACTIVE'`）が存在しないことを検証する。存在する場合は 409 (`ORIGINAL_QR_BINDING_CONFLICT`) を返却し、`ErrorResponse.conflictItems[]` に `conflictType='UNRESOLVED'` を返す
10. 原本確定時は、`qr_resolution_status='RESOLVED'` かつ `qr_identifier IS NOT NULL` の有効行（`item_status='ACTIVE'`）について同一セッション内で重複がないことを検証し、`(facility_id, qr_identifier)` で `qr_codes` を排他取得する。未発行、論理削除済み、別資産へ紐付済み、または施設不整合がある場合は 409 (`ORIGINAL_QR_BINDING_CONFLICT`) を返却し、`ErrorResponse.conflictItems[]` に競合行ごとの詳細を返す
11. 原本確定時は `parent_asset_data_matching_item_id` を考慮した親優先順で `asset_ledgers` を作成し、`parent_asset_ledger_id` へ変換する。作成する `asset_ledgers.ship_asset_master_id` には検証済みの `asset_data_matching_items.ship_asset_master_id` を必ず引き継ぐ。`asset_item_name` は紐付け先資産マスタ由来の品目名、`manufacturer_name` / `model_name` は原本直前スナップショットの空でない資産固有表示値を優先し、空の場合は紐付け先資産マスタのメーカー名 / 型式を複写する。同時に対応する `asset_data_matching_items.created_asset_ledger_id` へ採番済み `asset_ledger_id` を保存し、結果確認画面や資産カルテ遷移の追跡キーとして保持する
12. 原本確定時は、各有効統合リスト行の `SURVEY_RECORD` 元レコードに紐づく非削除の調査写真（`application_documents.owner_type='ASSET_SURVEY_RECORD' AND document_category='PHOTO' AND deleted_at IS NULL`）を取得し、作成した `asset_ledgers.asset_ledger_id` に対する資産写真メタデータとして `application_documents.owner_type='ASSET_LEDGER'` 行を作成する。元ファイルの `file_path`（Amazon S3オブジェクトキー）/ `content_hash` / ファイル属性 / 撮影日時 / 撮影者を再利用し、Amazon S3上のファイル実体は `CopyObject` / `PutObject` で複製しない。バケット名やHTTPS URLはDBへ保存せず、レスポンスにも返さない
13. 写真引継ぎでは、元調査写真の `asset_survey_record_id` を引継ぎ先 `application_documents.asset_survey_record_id` に保持して provenance とし、`asset_ledger_id` には今回作成した原本資産IDを設定する。写真が1件以上ある原本資産では、元調査写真の代表写真を優先し、`asset_survey_record_id ASC, sort_order ASC, application_document_id ASC` の順で `is_primary=true` を1件だけ設定する。台帳のみの `UNCONFIRMED_IMPORT` 行では写真引継ぎは行わない
14. `qr_identifier` が設定された行は、対応する `qr_codes.asset_ledger_id` に今回作成した `asset_ledgers.asset_ledger_id` を設定し、更新は原本生成、`created_asset_ledger_id` 保存と同一トランザクションで完了させる
15. 生成値の具体的なマッピングは第6章の `asset_data_matching_items -> asset_ledgers` ルール、写真引継ぎルール、QR 紐付け更新ルールに従う
16. 原本生成、写真引継ぎ、QR 紐付け更新の完了後に、実行ユーザーを `asset_data_matching_sessions.confirmed_by_user_id`、サーバ時刻を `confirmed_at` へ保存した上でセッションを `CONFIRMED` に更新する
17. 更新成功時は `asset_data_matching_sessions.lock_version` を +1 し、`updated_at` も更新した上で、新しい `lockVersion` と `sessionUpdatedAt` を返却する
18. `CONFIRMED` となったセッションは read-only とし、以後の一覧更新・突合登録・再確定は受け付けない

### getDataMatchingSessionsBySessionIdResult

#### 権限

- 認可条件: 共有システム管理者アカウント（`users.account_type='SYSTEM_ADMIN'`）の場合は、作業対象施設または対象セッションの施設が未削除であることを確認し、通常アカウント向けの担当施設割当・施設提供設定・ユーザー施設別設定による判定をバイパスする
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `user_facility_assignments` に有効割当があること
- 認可条件: 通常アカウントの場合、Bearer トークン上の作業対象施設について `facility_feature_settings` と `user_facility_feature_settings` の両方で `survey_ledger_matching` が有効であること

#### 処理仕様

1. 対象セッションが Bearer トークン上の作業対象施設に属することを検証する
2. 初回要求で `lockVersion` 省略時は現在の `asset_data_matching_sessions.lock_version` を当該一覧の snapshot version として採用する。指定時は `cursor` に埋め込まれた `lockVersion` と一致し、かつ `session_status='IN_PROGRESS'` の間は現在の `lock_version` と一致することを検証する。不一致時は 409 (`LIST_SNAPSHOT_EXPIRED`) を返却する
3. `asset_data_matching_items` のうち `merged_into_item_id IS NULL AND item_status='ACTIVE'` の有効行を現在の原本候補一覧として取得し、`source_summary`、現在代表台帳行、統合済み調査レコード一覧、原本直前スナップショット項目、原本確定必須項目の充足可否、`qrResolutionStatus`、`qrBindingCheckStatus`、写真引継ぎ候補数、原本確定後の資産写真件数、代表資産写真ID、`blockingReasons` を返却する
4. 各統合リスト行について、`asset_data_matching_item_sources` から現在代表元の `sourceDetails`、`asset_data_matching_item_list_results` から対象リストごとの `listResults` を `source_order ASC` で返却する。`sourceDetails` の `SURVEY_RECORD` には元調査レコードごとの `qrIdentifier` と非削除調査写真ドキュメントID一覧を含め、`listResults` には `result_status='ACTIVE'` / `'REVERTED'` の両方を含める。`created_asset_ledger_id` が設定済みの場合は `assetLedgerId` として返却し、同資産に紐づく `application_documents.owner_type='ASSET_LEDGER' AND document_category='PHOTO'` の件数と代表写真IDも返却する
5. セッションが `CONFIRMED` の場合も、当該セッション確定時点の統合結果として同じ形式で返却する
6. `canConfirmOriginal` は全件に有効なSHIP資産マスタ紐付けがあり、マスタ由来IDの整合、原本確定必須項目、QR 解決・紐付け可否のすべてを満たす場合のみ true とする。`blockingReasons` には不足時の `MISSING_SHIP_ASSET_MASTER_ID` または無効・不整合時の `INVALID_SHIP_ASSET_MASTER_ID` を含め、阻害件数を `unreadyItemCount` と `qrBlockingItemCount` で返却する
7. `cursor` 指定時は既定ソート順と `lockVersion` を固定した snapshot の続き位置から取得し、`pageSize` 件を上限に返却する
8. 返却順は `department_name ASC, section_name ASC, asset_item_name ASC, asset_data_matching_item_id ASC` を既定とする

## 第6章 原本生成マッピングルール

### 台帳行 -> 原本直前スナップショット優先順位

| asset_data_matching_items | 更新元 | 優先順位 / ルール |
| --- | --- | --- |
| category_id / category_name | `asset_import_rows` または既存調査 snapshot | 現在代表台帳行がある場合は確定済み `selected_category_*` を採用する。代表台帳行がない現有品調査のみの行では既存調査 snapshot を維持する。`suggested_category_*` は利用者が適用して `selected_*` へ保存されるまで確定値にしない |
| ship_asset_master_id | `asset_import_rows` または `asset_survey_records` | 現在代表台帳行がある場合は確定済み `selected_ship_asset_master_id`、代表台帳行がない現有品調査のみの行では `asset_survey_records.ship_asset_master_id` を採用する。どちらも有効な `ship_asset_masters` を参照することを必須とし、`suggested_ship_asset_master_id` は直接採用しない |
| large_class_id / large_class_name | `asset_import_rows` または既存調査 snapshot | 現在代表台帳行がある場合は確定済み `selected_large_class_*`、現有品調査のみの行では既存調査 snapshot を採用する。`suggested_large_class_*` は直接採用しない |

| asset_data_matching_items | 更新元 | 優先順位 / ルール |
| --- | --- | --- |
| medium_class_id / medium_class_name | `asset_import_rows` または既存調査 snapshot | 現在代表台帳行がある場合は確定済み `selected_medium_class_*`、現有品調査のみの行では既存調査 snapshot を採用する。`suggested_medium_class_*` は直接採用しない |
| asset_item_id / asset_item_name | `asset_import_rows` または既存調査 snapshot | 現在代表台帳行がある場合はマスタ由来の `selected_asset_item_id` と選択SHIP資産マスタの品目名を採用する。現有品調査のみの行でも紐付け先SHIP資産マスタ由来のID / 品目名を採用する。`suggested_asset_item_*` は直接採用しない |
| manufacturer_id / manufacturer_name | `asset_import_rows` または既存調査 snapshot | 現在代表台帳行がある場合はマスタ由来の `selected_manufacturer_id` と空でない `selected_manufacturer_name` を採用し、名称が空なら選択SHIP資産マスタのメーカー名を採用する。現有品調査のみの行では空でない `asset_survey_records.manufacturer_name` を優先し、空なら紐付け先資産マスタの名称を採用する。メーカー名とマスタ名称の相違を許可し、`suggested_manufacturer_*` は直接採用しない |
| model_id / model_name | `asset_import_rows` または既存調査 snapshot | 現在代表台帳行がある場合はマスタ由来の `selected_model_id` と空でない `selected_model_name` を採用し、名称が空なら選択SHIP資産マスタの型式を採用する。現有品調査のみの行では空でない `asset_survey_records.model_name` を優先し、空なら紐付け先資産マスタの名称を採用する。型式とマスタ名称の相違を許可し、`suggested_model_*` は直接採用しない |

| asset_data_matching_items | 更新元 | 優先順位 / ルール |
| --- | --- | --- |
| asset_name | `asset_import_rows` と既存 snapshot | 固定資産台帳由来行では必須入力された `parsed_original_asset_name` を設定し、マスタ側 `asset_item_name` へのフォールバックは行わない。現有品調査のみ行では既存 snapshot を利用する |
| unit | `asset_import_rows` と既存 snapshot | `parsed_unit` → 既存 `unit`。未確認追加行で値がなければ NULL を許容する |
| quantity | `asset_import_rows` と既存 snapshot | `parsed_quantity` がある場合はそれを採用し、ない場合は既存代表行値を保持する。未確認追加行で未入力なら 1 を既定値とする |
| creation_type / item_status | system managed | 初期生成行は `SURVEY_BASE / ACTIVE`、未確認追加行は `UNCONFIRMED_IMPORT / ACTIVE`。差し戻しで根拠を失った未確認追加行は `INVALIDATED` とする |

| asset_data_matching_items | 更新元 | 優先順位 / ルール |
| --- | --- | --- |
| matching_status | mutation payload | `matches` は要求 `matchingStatus`、`mark-unregistered` は `UNREGISTERED`、`mark-unconfirmed` は `UNCONFIRMED` を保存し、`revert-decision` は残存する有効判定履歴から再計算して最新確定判定代表値とする |
| detail_type / parent_asset_data_matching_item_id | `asset_survey_records` と representative item | 固定資産台帳取込では明細区分・明細親機を取り込まず、台帳行から親子関係を生成しない。現有品調査由来の既存階層を保持し、台帳のみの未確認追加行ではいずれも NULL とする。矛盾する階層構造の選択は 409 (`MERGE_HIERARCHY_CONFLICT`) とする |

| asset_data_matching_items | 更新元 | 優先順位 / ルール |
| --- | --- | --- |
| facility_location_id / department_name / section_name / room_name | `asset_survey_records`、`asset_import_rows.facility_location_id`、`facility_locations` | 現有品調査と台帳の両方を元にする行は現有品調査側の位置を優先する。台帳のみ行は解決済み `facility_location_id` から `facility_locations` を参照して部門・部署・室名を設定し、未解決の台帳行は原本確定対象に進めない |

| asset_data_matching_items | 更新元 | 優先順位 / ルール |
| --- | --- | --- |
| original_asset_name / original_manufacturer_name / original_model_name | `asset_import_rows` | `parsed_original_asset_name` / `parsed_original_manufacturer_name` / `parsed_original_model_name` を固定資産台帳の原文値として保持する。非(原)列やマスタ側確定値へのフォールバックは行わない |
| asset_no / management_no / hospital_unique_no_1 / hospital_unique_no_2 | `asset_import_rows` | `parsed_ledger_no` を `asset_no`、`parsed_management_device_no` を `management_no`、病院固有番号予備を専用項目へ反映する。`equipment_no` は備品番号・既存機器番号として維持し、ME管理機器番号で上書きしない |

台帳行 -> 原本直前スナップショット優先順位（続き）

| asset_data_matching_items | 更新元 | 優先順位 / ルール |
| --- | --- | --- |
| delivery and contract fields / price and tax fields / ledger_remarks | `asset_import_rows` | 契約決済No.、納入・検収日、納入業者、リース会社・期間、会計区分、勘定科目、耐用年数(原)、定価・見積価格、税区分、台帳備考を型付き `parsed_*` から保持する。`raw_data_json` は再解釈しない |

| asset_data_matching_items | 更新元 | 優先順位 / ルール |
| --- | --- | --- |
| qr_identifier / qr_resolution_status | `asset_survey_records` | 現在代表元 `SURVEY_RECORD` 集合の `qr_identifier` 非NULL distinct 値を集約し、0 件なら `NONE`、1 件ならその値を採用して `RESOLVED`、2 件以上なら `qr_identifier=NULL` / `CONFLICT` とする |

### 共通 snapshot 再構築ルール

- 更新系 API は、判定履歴または論理統合状態を保存した後に共通 snapshot 再構築サービスを呼び出し、影響 item の `asset_data_matching_items` / `asset_data_matching_item_sources` / `source_summary` / QR snapshot を `result_status='ACTIVE'` の判定履歴と現在の論理統合状態から再計算する
- 共通 snapshot 再構築サービスは、`asset_data_matching_item_list_results` を `asset_data_matching_session_lists.source_order ASC` の順で再適用し、操作順ではなく統合順を正とする
- 差し戻し対象リストの判定履歴は `asset_data_matching_item_list_results.result_status='REVERTED'` へ更新し、進捗・台帳行消費判定には以後利用しない
- 対象 `sessionListId` によって論理統合された行は `merged_into_item_id` / `merged_by_session_list_id` を NULL に戻して復元する
- 代表行の原本直前スナップショットと現在代表元は、残存する `result_status='ACTIVE'` の判定履歴を `asset_data_matching_session_lists.source_order ASC` の順で再適用して再計算する
- 有効判定履歴が1件も残らない代表行は、`matching_status` を NULL に戻し、`source_type='IMPORT_ROW'` の現在代表元を持たない survey-only 行として扱う
- `creation_type='UNCONFIRMED_IMPORT'` の行で有効判定履歴が1件も残らない場合は `item_status='INVALIDATED'` とし、上パネル一覧 / 原本候補一覧 / 原本確定対象から除外する
- 再計算時は `SURVEY_RECORD` 集合の QR も同時に見直し、`qr_identifier` / `qr_resolution_status` を同一トランザクションで再計算する

### asset_data_matching_items -> asset_ledgers 主要マッピング

| asset_ledgers | 値の決定元 | ルール |
| --- | --- | --- |
| facility_id | `asset_data_matching_items.facility_id` | 必須。対象セッション施設と一致させる |
| facility_location_id | `asset_data_matching_items.facility_location_id` | 解決済みの場合に設定。未解決時は NULL |
| ship_asset_master_id | `asset_data_matching_items.ship_asset_master_id` | 必須。原本確定前に有効なSHIP資産マスタ参照と分類ID整合を検証し、そのIDを必ず複写する |
| category_id | `asset_data_matching_items.category_id` | 必須。未解決なら原本確定不可 |
| large_class_name | `asset_data_matching_items.large_class_name` | 必須。未解決なら原本確定不可 |
| medium_class_name | `asset_data_matching_items.medium_class_name` | 必須。未解決なら原本確定不可 |
| asset_item_id | `asset_data_matching_items.asset_item_id` | 必須。選択SHIP資産マスタ由来IDを複写する |
| asset_item_name | `asset_data_matching_items.asset_item_name` | 必須。紐付け先SHIP資産マスタ由来の品目名を複写する |
| manufacturer_id / model_id | `asset_data_matching_items.manufacturer_id` / `model_id` | 解決済みの場合に設定。未解決時は NULL 可 |
| manufacturer_name / model_name | `asset_data_matching_items.manufacturer_name` / `model_name`、紐付け先SHIP資産マスタ | 空でない資産固有表示スナップショットを優先し、空の場合は紐付け先SHIP資産マスタのメーカー名 / 型式を設定する。メーカー名・型式はマスタ名称と異なる値を許可する |
| asset_name | `asset_data_matching_items.asset_name` | 必須。固定資産台帳由来行では `parsed_original_asset_name` 由来の値を設定し、非(原)列やマスタ側 `asset_item_name` へフォールバックしない。現有品調査のみ行では既存 snapshot を利用する |
| asset_no / management_no / hospital_unique_no_1 / hospital_unique_no_2 | `asset_data_matching_items.asset_no` / `management_no` / `hospital_unique_no_1` / `hospital_unique_no_2` | 保持しているスナップショットをそのまま複写する。固定資産番号は `asset_no`、ME管理機器番号は `management_no` とし、`equipment_no` は備品番号・既存機器番号として別に保持する |
| equipment_no / serial_no | `asset_data_matching_items.equipment_no` / `serial_no` | 保持しているスナップショットをそのまま複写する |
| detail_type | `asset_data_matching_items.detail_type` | 現有品調査由来の保持値を複写する。固定資産台帳取込では明細区分を取り込まないため、台帳のみ行では NULL とする |
| parent_asset_ledger_id | `asset_data_matching_items.parent_asset_data_matching_item_id` | 親統合リスト行から先に `asset_ledgers` を作成し、その採番結果へ変換して設定する |
| quantity | `asset_data_matching_items.quantity` | 必須。未解決なら原本確定不可 |
| unit | `asset_data_matching_items.unit` | 保持値を複写する。未解決時は NULL 可 |
| ledger_original_asset_name / ledger_original_manufacturer_name / ledger_original_model_name | `asset_data_matching_items.original_asset_name` / `original_manufacturer_name` / `original_model_name` | 固定資産台帳の (原)3項目を原文値として複写する。`ledger_original_asset_name` は `asset_name` と同じ原本表示名の根拠にもなる |
| contract_settlement_no / delivery_date / inspection_date | `asset_data_matching_items.contract_settlement_no` / `delivery_date` / `inspection_date` | 契約決済No.、納入日、検収日を複写する |
| delivery_vendor_name / lease_company_name / lease_start_on / lease_end_on | `asset_data_matching_items` の納入・リース項目 | 納入業者、リース会社、リース期間を複写する |
| account_category / account_title / legal_service_life | `asset_data_matching_items.account_category` / `account_title` / `original_legal_service_life` | 会計区分、勘定科目、耐用年数(原)を複写する。耐用年数(原)は `asset_ledgers.legal_service_life` に反映する |
| list_price_unit_excl_tax / list_price_total_excl_tax / quotation_price_unit_excl_tax / quotation_price_total_excl_tax / tax_category / tax_rate / quotation_price_total_incl_tax | `asset_data_matching_items` の価格・税項目 | 固定資産台帳の定価・見積価格・税区分・消費税率を同名の専用項目へ複写する。購入価格や `acquisition_cost` へ暗黙変換して上書きしない |
| ledger_remarks | `asset_data_matching_items.ledger_remarks` | 固定資産台帳の台帳備考を複写する |
| status | 固定値 | `ACTIVE` を設定する |
| is_leased / is_rented_out | 固定値 | いずれも `false` を設定する |
| その他 nullable 項目 | 固定値または未設定 | 本 API の確定時点で値を持たない列は NULL またはテーブル既定値で作成し、後続の台帳保守機能で更新する |

### 原本確定時の QR 紐付け更新ルール

- `merged_into_item_id IS NULL AND item_status='ACTIVE'` かつ `qr_resolution_status='RESOLVED'` かつ `qr_identifier IS NOT NULL` の統合リスト行のみを QR 紐付け更新対象とする
- `item_status='ACTIVE'` な統合リスト行のうち `qr_resolution_status='CONFLICT'` の行が1件でも残る場合は、QR 採否未解決として 409 (`ORIGINAL_QR_BINDING_CONFLICT`) とし、`ErrorResponse.conflictItems[].conflictType='UNRESOLVED'` を返す
- 対象 QR は `(facility_id, qr_identifier)` で `qr_codes` を解決し、未発行、論理削除済み、同一セッション内重複、別資産への既存紐付け、施設不整合のいずれかに該当する場合は 409 (`ORIGINAL_QR_BINDING_CONFLICT`) とする
- 対応する `asset_ledgers` 作成後に `qr_codes.asset_ledger_id` へ採番済み `asset_ledger_id` を設定し、更新は原本生成と同一トランザクションで完了させる
- 原本確定後の QR 再発行、貼替え、別資産への付替えは本 API の責務に含めず、QR発行・台帳保守側の機能で扱う

### 原本確定時の写真引継ぎルール

- 写真引継ぎ対象は、`merged_into_item_id IS NULL AND item_status='ACTIVE'` の統合リスト行に紐づく `asset_data_matching_item_sources.source_type='SURVEY_RECORD'` の元調査レコードとする
- 対象調査レコードに紐づく `application_documents.owner_type='ASSET_SURVEY_RECORD' AND document_category='PHOTO' AND deleted_at IS NULL` の写真を取得し、`application_document_id` 昇順ではなく、`asset_survey_record_id ASC, sort_order ASC, application_document_id ASC` を安定順として処理する
- 引継ぎ先は `application_documents.owner_type='ASSET_LEDGER'` / `document_category='PHOTO'` の新規行とし、`asset_ledger_id` には今回作成した `asset_ledgers.asset_ledger_id`、`asset_survey_record_id` には元調査レコードIDを設定して provenance を保持する
- ファイル実体はAmazon S3上で複製せず、元調査写真の `file_name` / `file_path`（S3オブジェクトキー）/ `mime_type` / `file_size_bytes` / `content_hash` / `storage_format` / `taken_at` / `taken_by_user_id` / `sort_order` を再利用する。データ突合APIではS3 `CopyObject` / `PutObject` / `DeleteObject` を実行せず、メタデータ行のみを同一DBトランザクションで作成する。`uploaded_by_user_id` / `uploaded_at` は原本確定実行者とサーバ時刻を設定する
- 同一原本資産へ複数調査レコードが統合される場合は、全ての非削除調査写真を引き継ぐ。ただし同一 `content_hash` と `file_path`（同一S3オブジェクトキー）の組み合わせが重複する場合は1件に正規化する
- 代表写真は、元調査写真で `is_primary=true` のものを優先する。候補が複数または存在しない場合は `asset_survey_record_id ASC, sort_order ASC, application_document_id ASC` の先頭1件を `is_primary=true` とし、同一 `asset_ledger_id` の他写真は `is_primary=false` とする
- 現有品調査レコードを含まない台帳のみ行（`creation_type='UNCONFIRMED_IMPORT'` / `source_type='IMPORT_ROW'` のみ）は写真引継ぎを行わず、写真なしでも原本確定を阻害しない
- 写真引継ぎ、`asset_ledgers` 作成、`asset_data_matching_items.created_asset_ledger_id` 保存、QR 紐付け更新は同一トランザクションで完了させ、いずれかが失敗した場合は原本確定全体をロールバックする

### 原本確定時の生成順序

- 原本確定前に、対象セッションの `asset_data_matching_items` のうち `merged_into_item_id IS NULL AND item_status='ACTIVE'` の有効行について、有効なSHIP資産マスタ紐付け、マスタ由来IDの整合、必須項目の充足を検証し、不足・無効・不整合行が1件でもあれば確定を中止する
- 生成順序は `merged_into_item_id IS NULL AND item_status='ACTIVE'` かつ `parent_asset_data_matching_item_id IS NULL` の行から開始し、親の `asset_ledger_id` が確定した後に子行の `parent_asset_ledger_id` へ設定する
- `qr_resolution_status='RESOLVED'` かつ `qr_identifier` が設定された行は、対応する `asset_ledger_id` が確定した時点で `qr_codes.asset_ledger_id` を更新し、未解決または競合があれば 409 エラーとして原本確定を失敗させる
- 各行の `asset_ledger_id` が確定した時点で、当該行の `SURVEY_RECORD` 元レコードに紐づく非削除調査写真を `application_documents.owner_type='ASSET_LEDGER'` の資産写真として引き継ぐ
- 親参照が欠落している行、循環参照、または別セッション行を参照する親子関係は 409 エラーとして原本確定を失敗させる
- 原本生成、写真引継ぎ、QR 紐付け更新が完了した後に `asset_data_matching_sessions.session_status` を `CONFIRMED` とし、同セッションを read-only 化する

## 第7章 権限・業務ルール

### 必要権限

| 処理 | 必要 feature_code | 判定基準 | 説明 |
| --- | --- | --- | --- |
| データ突合の全 API | `survey_ledger_matching` | 通常アカウントは作業対象施設に対して実効 `survey_ledger_matching` を持つこと。共有システム管理者は対象施設が未削除であること | データ突合セッション開始、一覧取得、判定登録、原本確定を行う |

### セッション運用ルール

- `asset_data_matching_sessions.session_status='IN_PROGRESS'` のセッションは施設ごとに 1 件までとし、同一施設内では別ユーザーが途中から継続できる前提とする
- 新規セッション開始時に、基底現有品調査セッションと統合対象 `asset_import_jobs` をスナップショットとして確定し、進行中に新しい台帳リストが増えても自動追加しない
- 基底現有品調査セッションが存在しない施設ではデータ突合セッションを開始できない
- `source_type='IMPORT_JOB' AND merge_status='PENDING'` のうち `source_order` 最小の 1 件を現在処理対象リストとし、判定登録と `COMPLETE_LIST` はこのリストに対してのみ許可する
- `COMPLETE_LIST` 済みリストであっても、セッションが `IN_PROGRESS` の間は `revert-decision` により `PENDING` へ再オープンできる
- `CONFIRMED` となったセッションは read-only とし、再度の判定登録や再確定は受け付けない

### 統合判定ルール

- 1 回の `matches` 実行では、下パネル 1 件に対して上パネル 1 件以上を選択し、`representativeItemId` で代表行を明示する
- 原本リスト 1 行は `現有品調査のみ`、`台帳のみ`、`台帳1 + 現有品調査n` のいずれでも成立できる
- 同一 source label に対して複数の `IMPORT_ROW` を 1 行へ集約する選択は許可せず、`台帳1 : 現有品調査n` 制約を維持する
- 複数の統合リスト行を 1 行へ再集約できるのは、代表行以外の行が他の `asset_data_matching_item_list_results` 判定履歴を持たず、かつ他行から `parent_asset_data_matching_item_id` で参照されていない場合に限る
- 選択した統合リスト行どうしで `detail_type` または `parent_asset_data_matching_item_id` が矛盾する場合はマージせず、409 (`MERGE_HIERARCHY_CONFLICT`) を返す
- 再集約時も代表行以外を物理削除せず、`merged_into_item_id` と `merged_by_session_list_id` により論理統合状態として保持する
- `mark-unregistered` は既存の統合リスト行を残したまま `UNREGISTERED` とし、`mark-unconfirmed` は台帳行から新しい統合リスト行を追加して `UNCONFIRMED` とする
- 同一セッション内で同一 `asset_import_row_id` と同一 `asset_survey_record_id` は、`asset_data_matching_item_sources.active_*_key` の一意制約により、`merged_into_item_id IS NULL AND item_status='ACTIVE'` な有効統合リスト行に対して 1 つの統合リスト行にのみ属する
- `mark-unconfirmed` で追加した `UNCONFIRMED_IMPORT` 行は、差し戻し後に有効判定根拠を失った場合 `INVALIDATED` として原本候補から除外する
- `matches` / `mark-unconfirmed` で採用できる台帳行は、取込突き合わせで確定済みかつ有効な `selected_ship_asset_master_id` と整合する `selected_*_id` を持つ行に限る。`suggested_*` は推薦候補であり、利用者が適用して `selected_*` へ保存するまでデータ突合の確定値にしない
- 資産マスタIDとマスタ由来IDは保持したまま、メーカー名・型式は資産／取込行固有の表示スナップショットとしてマスタ名称と異なる値を保持できる。名称相違だけを理由に紐付けを解除しない。品目名は紐付け先資産マスタ由来の値とし、メーカー名・型式が空の場合はマスタ名称を有効表示値とする
- 差し戻しは、対象リストより後続 `source_order` のリストに `ACTIVE` 判定履歴が残らない場合に限り許可し、後ろから順にのみ戻せる
- 同一統合リスト行に集約された `SURVEY_RECORD` 集合の QR は `asset_data_matching_items.qr_identifier` / `qr_resolution_status` へ正規化し、原本確定前に `result` / `context` で可視化する
- 現在リストに対する進捗、`対応中` / `対応済み`、台帳行消費判定の正本は `asset_data_matching_item_list_results` とし、`asset_data_matching_items.source_summary` は画面表示用途に限定する
- 誤判定差し戻し時は、対象リストの有効判定履歴を履歴化し、必要に応じて論理統合行を復元した上で代表 snapshot を再計算する

### 完了・原本確定ルール

- 現在リスト完了（`COMPLETE_LIST`）は、当該リストに対する未判定の統合リスト行と未処理台帳行が 0 件の場合のみ許可する
- 残りリストがある状態で原本確定する場合は `skipRemaining=true` を必須とし、残存 `PENDING` リストを `SKIPPED` として監査可能に残す
- 原本確定時は `asset_data_matching_items` の原本直前スナップショットを使って `asset_ledgers` を作成し、`SURVEY_RECORD` 元レコードの非削除調査写真は `application_documents.owner_type='ASSET_LEDGER'` の資産写真として引き継ぐ。`qr_resolution_status='RESOLVED'` かつ `qr_identifier` がある行は対応する `qr_codes.asset_ledger_id` も同一トランザクションで更新する。原本生成時に元の `asset_survey_records` / `asset_import_rows` を再解釈しない
- 原本確定対象の全行で有効な `ship_asset_master_id` とマスタ由来分類IDの整合を必須とする。メーカー名・型式は資産固有の表示値としてマスタ名称と異なっていても確定でき、空の場合はマスタ名称を使用する。品目名は紐付け先資産マスタ由来の値を必須とする
- 原本確定可否の正本は `result` / `context` が返す `canConfirmOriginal`、`unreadyItemCount`、`qrBlockingItemCount`、各 item の `blockingReasons` とする
- 確定後の台帳編集、QR 再発行、QR 貼替え、別資産への付替え責務は本 API 群に含めず、以後の台帳保守・QR発行機能で扱う

### 参考画面の扱い

- `/data-matching/ledger` と `/data-matching/me-ledger` は現行主導線の参考画面とし、独立した正本 API 群は設けない
- 参考画面は session API で取得した候補一覧と `mark-unconfirmed` の結果を利用する
- `asset_import_survey_mappings` は個別対応履歴や補助管理に利用できるが、主導線 `/data-matching` の正本は `asset_data_matching_items` / `asset_data_matching_item_sources` / `asset_data_matching_item_list_results` とする

## 第8章 エラーコード一覧

| エラーコード | HTTP | 説明 |
| --- | --- | --- |
| VALIDATION_ERROR | 400 | 入力不正、必須不足、フィルタ条件不正 |
| FACILITY_SELECTION_REQUIRED | 400 | 対象施設を確定できない状態で実行した |
| IDEMPOTENCY_KEY_REQUIRED | 400 | 更新系 API に `Idempotency-Key` が指定されていない |
| UNAUTHORIZED | 401 | 認証トークン未付与または無効 |
| AUTH_403_SURVEY_LEDGER_MATCHING_DENIED | 403 | 通常アカウントで作業対象施設に対する実効 `survey_ledger_matching` がない、共有システム管理者で作業対象施設が削除済み、または対象施設不一致 |
| FACILITY_NOT_FOUND | 404 | 対象施設が存在しない、または削除済み |
| DATA_MATCHING_SESSION_NOT_FOUND | 404 | 対象データ突合セッションが存在しない |
| DATA_MATCHING_SESSION_LIST_NOT_FOUND | 404 | 対象統合対象リストが存在しない |
| DATA_MATCHING_MERGED_ITEM_NOT_FOUND | 404 | 対象統合リスト行が存在しない |
| DATA_MATCHING_DECISION_RESULT_NOT_FOUND | 404 | 差し戻し対象の有効判定結果が存在しない |
| DATA_MATCHING_LEDGER_ITEM_NOT_FOUND | 404 | 対象台帳行が存在しない |
| BASE_SURVEY_SESSION_NOT_FOUND | 404 | 基底に使える現有品調査セッションが存在しない |
| DATA_MATCHING_SOURCE_MASTER_INVALID | 409 | 採用する台帳行が未確定、SHIP資産マスタ未選択・無効、または選択分類IDが資産マスタと不整合である |
| SESSION_CONFLICT | 409 | 要求 `lockVersion` と現在の `asset_data_matching_sessions.lock_version` が一致しない |
| LIST_SNAPSHOT_EXPIRED | 409 | 一覧取得に指定した `lockVersion` が現在の session snapshot と一致しない |
| SESSION_STATUS_INVALID | 409 | セッション状態上、要求処理を実行できない |
| SESSION_LIST_TYPE_MISMATCH | 409 | 指定した session list と API の期待リスト種別が一致しない |
| SESSION_LIST_SEQUENCE_INVALID | 409 | 指定した session list が現在処理対象の最小 `source_order` `PENDING` リストではない |
| IDEMPOTENCY_KEY_REUSED | 409 | 同一 `Idempotency-Key` で異なる payload が再送された |
| MERGED_ITEM_NOT_MERGEABLE | 409 | 指定した統合リスト行が他リスト判定履歴または子参照を持つため、再集約できない |
| MERGE_HIERARCHY_CONFLICT | 409 | 代表行指定と `detail_type` / `parent_asset_data_matching_item_id` の階層整合性が取れない統合リスト行の再集約を要求した |
| MATCH_SELECTION_INVALID | 409 | 選択件数や選択状態が判定ルールを満たさない |
| MATCH_RULE_VIOLATION | 409 | `台帳1 : 現有品調査n` 制約、または `asset_data_matching_item_sources.active_*_key` の一意制約に抵触した |
| LEDGER_ROW_ALREADY_CONSUMED | 409 | 対象 `sessionListId` で指定した台帳行がすでに他の判定結果で消費済みである |
| RESULT_REVERT_NOT_ALLOWED | 409 | 対象判定結果が確定済みセッションに属する、後続 `source_order` の `ACTIVE` 判定が残っている、または差し戻し不可状態である |
| CURRENT_LIST_NOT_COMPLETED | 409 | 現在リストに未判定の統合リスト行または未処理台帳行が残っている |
| ORIGINAL_LEDGER_SNAPSHOT_INCOMPLETE | 409 | 原本直前スナップショットにSHIP資産マスタ未設定・無効、マスタ由来ID不整合、必須項目不足、親子不整合、または循環参照がある |
| ORIGINAL_QR_BINDING_CONFLICT | 409 | 原本確定時の QR 解決または紐付け更新に失敗した（QR 採否未解決、未発行、論理削除済み、同一セッション内重複、別資産紐付済み、施設不整合）。`ErrorResponse.conflictItems[]` で競合明細を返す |
| ORIGINAL_CONFIRM_NOT_ALLOWED | 409 | 途中確定条件を満たさない、または確定済みセッションに対して再確定を要求した |
| INTERNAL_SERVER_ERROR | 500 | サーバー内部エラー |

## 第9章 運用・保守方針

### 運用方針

- 画面表示時は `/data-matching/context` で進行中セッション有無を確認し、既存セッションがあれば必ずそれを再開する
- 共通フィルタ候補と一致検索条件の UI 変更時は、`merged-items` / `fixed-asset-ledger-items` / `me-ledger-items` のクエリ仕様と `cursor` 継続取得仕様を同時に見直す
- 原本確定前のレビューは `/data-matching/sessions/{sessionId}/result` を正本とし、クライアント側で独自に統合結果を再計算しない
- 原本確定後の `asset_ledgers` 件数が `mergedItemCount` と一致し、`sourcePhotoCount > 0` の確定行は対応する `application_documents.owner_type='ASSET_LEDGER'` の資産写真と代表写真が作成され、`qrResolutionStatus='RESOLVED'` の確定行は対応する `qr_codes.asset_ledger_id` が設定されていることを監査対象とする
- 写真引継ぎで作成した資産写真メタデータは元調査写真と同じAmazon S3オブジェクトキーを参照する。片方の `application_documents.deleted_at` 更新だけでS3実体を即時削除せず、同一キーを参照する有効メタデータがなくなったことと保存期間を確認するストレージ削除処理で扱う

### 今後拡張時の留意点

- その他台帳リストの種類が増える場合は、`listType` と `source_order` の決定ルールを追加定義する
- 個別対応履歴を画面上で詳細表示する要件が確定した場合は、`asset_import_survey_mappings` と主導線 session API の責務分担を再整理する
- `Idempotency-Key` の保持期間、`REVERTED` 判定履歴の保管年限、一覧 export 導線は運用設計で確定する
