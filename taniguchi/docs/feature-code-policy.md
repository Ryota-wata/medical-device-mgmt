# feature_code 設計方針（たたき台）

## 目的
- `role_permissions.feature_code` を `permissions` テーブルなしで運用する前提で、権限コードの粒度と命名規則を揃える。
- 画面ごとの閲覧可否だけでなく、画面内の主要な業務操作ボタンの表示・活性制御にも使える粒度を定める。
- 本書は認証認可の詳細設計たたき台であり、クライアント確認後に `機能要件.md` 正本へ反映する前提とする。

## 基本方針
- `feature_code` は「利用可否を判定したい機能単位」で切る。
- 原則として、画面表示機能と主要業務操作機能を分けて定義する。
- 画面内に複数の独立した業務アクションがある場合は、ボタン単位の `feature_code` を追加する。
- 単なるフィルタ操作やモーダル開閉、タブ切替などの UI 細部には原則として `feature_code` を切らない。
- 病院ユーザーの他施設閲覧では `role_permissions` を横展開せず、資産閲覧専用ロジックを優先する。

## 設計メモ（比較検討の経緯）
- `vendor_master_view` のように `resource_action` を1カラムで持つ案と、`resource_code + action_code` の2カラムに正規化する案の両方を検討した。
- `resource_code + action_code` は概念的には整理しやすいが、本案件ではレビュー・設定・実装時にほぼ同じ組み合わせを毎回扱うことになり、現工程では抽象化の効果よりも運用負荷が大きいと判断した。
- そのため、現時点では `role_permissions.feature_code` に `resource_action` 形式の1カラム文字列を保持する案を採用する。
- ただし、将来 `feature_code` の件数増加や重複設定が保守上の問題になった場合は、`resource_code + action_code` への正規化を再検討する余地を残す。

## 命名規則
- 形式: `lower_snake_case`
- 原則: `resource_action`
- 画面表示: `*_view`
- 新規作成: `*_create`
- 更新: `*_update`
- 削除: `*_delete`
- 実行/確定/出力などの独立操作:
  - `*_execute`
  - `*_confirm`
  - `*_export`
  - `*_print`

## 粒度の考え方
### 1. 画面表示機能
- 画面を開いて一覧・詳細を参照できるかを表す。
- 例:
  - `vendor_master_view`
  - `asset_search_result_view`
  - `asset_detail_view`

### 2. 主要業務操作機能
- 画面内で独立して可否を切り分けたい操作に付与する。
- 例:
  - `vendor_master_create`
  - `vendor_master_update`
  - `vendor_master_delete`
  - `purchase_application_create`
  - `borrowing_application_create`
  - `disposal_application_create`

### 3. 独立した補助機能
- Excel出力、OCR確認、印刷開始など、画面表示とは別に制御したい機能。
- 例:
  - `asset_matching_export`
  - `quotation_ocr_confirm`
  - `qr_print_execute`

## 画面遷移系で原則 `feature_code` を切らないもの
- `login`
- `password_reset`
- `facility_select`
- `main`

上記は認証状態や `allowedFacilities`、画面内の表示ボタン制御で扱う前提とし、個別権限コードは原則不要とする。

## 初期一覧案

### 認証/認可・初期選択
- `login_execute`
- `password_reset_execute`

### QR/ラベル発行
- `qr_issue_view`
- `qr_issue_execute`
- `qr_print_view`
- `qr_print_execute`

### 現有品調査・資産台帳取込・突合
- `offline_prep_view`
- `offline_prep_execute`
- `survey_location_view`
- `asset_survey_view`
- `asset_survey_create`
- `history_view`
- `registration_edit_view`
- `registration_edit_update`
- `registration_edit_confirm`
- `asset_import_view`
- `asset_import_execute`
- `asset_matching_view`
- `asset_matching_update`
- `asset_matching_confirm`
- `asset_matching_export`
- `data_matching_view`
- `data_matching_update`
- `data_matching_confirm`

### 資産検索・台帳
- `asset_search_result_view`
- `asset_detail_view`

### 申請ボタン系
- `purchase_application_create`
- `expansion_application_create`
- `replacement_application_create`
- `borrowing_application_create`
- `transfer_application_create`
- `disposal_application_create`
- `repair_request_create`

### マスタ管理
- `ship_asset_master_view`
- `ship_asset_master_update`
- `ship_facility_master_view`
- `ship_facility_master_update`
- `hospital_facility_master_view`
- `hospital_facility_master_update`
- `ship_department_master_view`
- `ship_department_master_update`
- `user_management_view`
- `user_management_update`
- `vendor_master_view`
- `vendor_master_create`
- `vendor_master_update`
- `vendor_master_delete`

### 申請・見積・RFQ
- `remodel_application_view`
- `remodel_application_update`
- `quotation_data_box_view`
- `quotation_data_box_update`
- `ocr_confirm_view`
- `ocr_confirm_execute`
- `order_registration_view`
- `order_registration_execute`
- `inspection_registration_view`
- `inspection_registration_execute`
- `asset_provisional_registration_view`
- `asset_provisional_registration_execute`
- `quotation_management_view`
- `quotation_management_update`

### 追加導線・運用画面
- `asset_master_view`
- `borrowing_task_view`
- `borrowing_task_update`
- `daily_inspection_view`
- `daily_inspection_execute`
- `data_matching_ledger_view`
- `data_matching_ledger_update`
- `data_matching_me_ledger_view`
- `data_matching_me_ledger_update`
- `disposal_task_view`
- `disposal_task_update`
- `inspection_prep_view`
- `inspection_prep_execute`

### mobile 専用候補
- `inspection_mobile_view`
- `inspection_mobile_execute`
- `transport_mobile_view`
- `transport_mobile_execute`
- `vendor_inspection_mobile_view`
- `vendor_inspection_mobile_execute`

## 運用メモ
- 初期導入時は、画面表示系 `*_view` と主要な登録/更新/削除/確定系だけを先に定義し、細かい補助機能は必要時に追加する。
- `feature_code` を追加した場合は、少なくとも以下を更新する。
  - `role_permissions`
  - 画面要件または API設計書内の必要権限記述
  - 実装側の権限制御辞書または参照ロジック
- 同一画面で複数ロールに表示差分がある場合は、画面 `*_view` と操作 `*_create/update/delete/...` を分けて制御する。

## 未確定事項
- SHRC ユーザーに対して、上記 `feature_code` を全施設へ一律適用するか、施設単位で差分適用するかは認証認可の未確定事項とする。
- `roles.user_type` を `HOSPITAL` / `SHIP` の2区分のまま運用するか、外部ユーザー系ロール分類を拡張するかは別途要確認。
