# 認証認可 機能カタログ・カラムカタログ整理メモ（最新版ドラフト）

本メモは、`taniguchi/docs/ロール整理.xlsx` の `権限管理単位一覧` シートをもとに、`feature_code` / `column_code` の採用粒度を整理した補助メモである。
現在の正本は [authz-fix-summary.md](/C:/Projects/mock/medical-device-mgmt/taniguchi/docs/authz-fix-summary.md) とし、本メモはその要点をカテゴリ別に見返すためのドラフトとして扱う。

## 整理ルール

- `権限管理単位一覧` シート A列 1行につき、`feature_code` または `column_code` を 1つ割り当てる。
- 既存コードを再利用できるものは再利用し、粒度変更が入った箇所だけ新規コードへ置き換える。
- `auth_login` と `facility_select` はシート外の固定導線として別管理する。
- 最新シートに存在しない旧候補コードは、現行カタログから外す。

## 1. 共通導線・ユーザー管理

| コード | 名称 | 元の管理単位 | 備考 |
| --- | --- | --- | --- |
| `auth_login` | ログイン・パスワード再設定（固定導線） | シート外固定導線 | `SYSTEM_FIXED` |
| `facility_select` | 施設選択（固定導線） | シート外固定導線 | `SYSTEM_FIXED` |
| `user_list_view` | ユーザー / 一覧 | ユーザー 一覧 | ユーザー一覧画面 |
| `user_edit` | ユーザー / 新規作成・編集 | ユーザー 新規作成・編集 | 編集モーダル |
| `user_facility_assignment_edit` | 担当施設 / 編集 | 担当施設 編集 | 担当施設設定 UI |
| `facility_group_list` | 施設グループ / 一覧 | 施設グループ 一覧 | 一覧画面 |
| `facility_group_edit` | 施設グループ / 新規作成・編集 | 施設グループ 新規作成・編集 | 編集モーダル |

## 2. 資産閲覧申請・保守点検・棚卸し・QR・個体管理

| コード | 名称 | 元の管理単位 | 備考 |
| --- | --- | --- | --- |
| `original_list_view` | 資産一覧・カルテ閲覧 | 資産一覧・カルテ閲覧 | 資産一覧と資産カルテを同一単位で扱う |
| `original_application` | 資産一覧 / 新規・更新・増設・移動・廃棄 | 資産一覧 / 新規・更新・増設・移動・廃棄 | 資産一覧起点の申請系ボタン |
| `management_department_edit` | 資産一覧 / 管理部署編集 | 資産一覧 / 管理部署編集 | 管理部署編集ボタンと一括保存を独立制御 |
| `original_list_edit` | 資産カルテ / 原本編集 | 資産カルテ / 原本編集 | 既存コード継続 |
| `daily_inspection` | 日常点検・オフライン準備 | 日常点検・オフライン準備 | 既存コード継続 |
| `lending_checkout` | 貸出・返却 | 貸出・返却 | 既存コード継続 |
| `lending_in_use_used` | 貸出・返却 / 使用中 & 使用済み | 貸出・返却 / 使用中 & 使用済み | `config_scope='FACILITY_USER'` とし、使用中/使用済みモーダルとボタンをユーザー施設別に独立制御。実効利用には `lending_checkout` も必須 |
| `repair_application` | 修理申請 | 修理申請 | 既存コード継続 |
| `inventory` | 棚卸し | 棚卸し | `inventory_field` から再編 |
| `inventory_complete` | 棚卸し / 完了 | 棚卸し / 完了 | `inventory_office` から再編 |
| `qr_issue` | QRコード発行 | QRコード発行 | QR読取は今回は採用外 |
| `existing_survey` | 現有品調査 | 現有品調査 | 一連の調査導線 |
| `survey_data_edit` | 現有品調査内容修正 | 現有品調査内容修正 | 名称をシートへ合わせる |
| `asset_ledger_import` | 資産台帳取込登録 | 資産台帳取込登録 | 既存コード継続 |
| `survey_ledger_matching` | データ突合 | データ突合 | コード継続、名称をシートへ合わせる |

## 3. 編集リスト・タスク管理

| コード | 名称 | 元の管理単位 | 備考 |
| --- | --- | --- | --- |
| `remodel_edit_list` | 編集リスト（リモデル） | 編集リスト（リモデル） | モーダルと導線を含む |
| `normal_edit_list` | 編集リスト（通常） | 編集リスト（通常） | モーダルと導線を含む |
| `remodel_purchase` | リモデル購入管理 / 申請受付～見積登録 | リモデル購入管理 / 申請受付～見積登録 | タスク管理配下へ再整理 |
| `remodel_order` | リモデル購入管理 / 発注登録～資産登録 | リモデル購入管理 / 発注登録～資産登録 | タスク管理配下へ再整理 |
| `remodel_acceptance` | リモデル購入管理 / 検収登録 | リモデル購入管理 / 検収登録 | タスク管理配下へ再整理 |
| `normal_purchase` | 通常購入管理 / 申請受付～見積登録 | 通常購入管理 / 申請受付～見積登録 | 既存コード継続 |
| `normal_order` | 通常購入管理 / 発注登録～仮資産登録 | 通常購入管理 / 発注登録～仮資産登録 | 既存コード継続 |
| `normal_acceptance` | 通常購入管理 / 検収登録 | 通常購入管理 / 検収登録 | 既存コード継続 |
| `normal_quotation` | 通常購入管理 / 見積管理 | 通常購入管理 / 見積管理 | 既存コード継続 |
| `normal_ship_request` | 通常購入管理 / SHIP依頼機能 | 通常購入管理 / SHIP依頼機能 | `config_scope='FACILITY_USER'` とし、SHIPへ一括依頼ボタンをユーザー施設別に独立制御 |
| `transfer_disposal` | 移動・廃棄管理 | 移動・廃棄管理 | 既存コード継続 |
| `repair_management` | 修理管理 | 修理管理 | 既存コード継続 |
| `maintenance_contract` | 保守契約管理 | 保守契約管理 | 資産一覧 / 保守契約登録導線も同一コードで制御 |
| `inspection_management` | 点検管理 | 点検管理 | 資産一覧 / 点検管理登録導線も同一コードで制御 |
| `lending_management` | 貸出管理（タスク管理） | 貸出管理（タスク管理） | 既存コード継続 |

## 4. マスタ管理

| コード | 名称 | 元の管理単位 | 備考 |
| --- | --- | --- | --- |
| `asset_master_list` | 資産マスタ / 一覧 | 資産マスタ / 一覧 | SHIP資産マスタ画面 |
| `asset_master_edit` | 資産マスタ / 新規作成・編集 | 資産マスタ / 新規作成・編集 | 編集モーダル |
| `facility_master_list` | 施設マスタ / 一覧 | 施設マスタ / 一覧 | SHIP施設マスタ画面 |
| `facility_master_edit` | 施設マスタ / 新規作成・編集 | 施設マスタ / 新規作成・編集 | 編集モーダル |
| `facility_feature_edit` | 施設提供機能 / 編集 | 施設提供機能 / 編集 | 施設提供機能付与 UI |
| `ship_dept_master_list` | SHIP部署マスタ / 一覧 | SHIP部署マスタ 一覧 | 一覧画面 |
| `ship_dept_master_edit` | SHIP部署マスタ / 新規作成・編集 | SHIP部署マスタ 新規作成・編集 | 編集モーダル |
| `hospital_dept_master_list` | 個別部署マスタ / 一覧 | 個別部署マスタ 一覧 | 一覧画面 |
| `hospital_dept_master_edit` | 個別部署マスタ / 新規作成・編集 | 個別部署マスタ 新規作成・編集 | 編集モーダル |
| `vendor_master_list` | 業者マスタ / 一覧 | 業者マスタ 一覧 | 一覧画面 |
| `vendor_master_edit` | 業者マスタ / 新規作成・編集 | 業者マスタ 新規作成・編集 | 編集モーダル |

## 5. カラムカタログ

| コード | 名称 | 元の管理単位 | 適用想定 | 備考 |
| --- | --- | --- | --- | --- |
| `original_price_column` | 資産一覧・カルテ / 原本価格情報 | 資産一覧・カルテ / 原本価格情報 | 資産一覧、資産カルテ | 既存コード継続 |
| `remodel_ship_column` | DataLINK / SHIP表示列（リモデル） | DataLINK / SHIP表示列（リモデル） | リモデル編集リスト | `ship_column` から再編 |
| `normal_ship_column` | DataLINK / SHIP表示列（通常） | DataLINK / SHIP表示列（通常） | 通常編集リスト | `ship_column` から再編 |
| `asset_master_ship_column` | 資産マスタ / SHIP表示列 | 資産マスタ / SHIP表示列 | 資産マスタ文脈 | A列名称を優先。元シートの対象画面セルは要確認 |

## 6. メニュー表示グループ

| グループ | 配下コード |
| --- | --- |
| `USER_ADMIN` | `user_list_view`, `user_edit`, `user_facility_assignment_edit`, `facility_group_list`, `facility_group_edit` |
| `ASSET_REQUEST` | `original_list_view`, `original_application`, `management_department_edit`, `inspection_management`, `maintenance_contract`, `original_list_edit` |
| `MAINTENANCE_REQUEST` | 分類上の配下コード: `daily_inspection`, `lending_checkout`, `lending_in_use_used`, `repair_application`。メニュー表示条件に使うコード: `daily_inspection`, `lending_checkout`, `repair_application` |
| `INVENTORY` | `inventory`, `inventory_complete` |
| `QR_ISSUE` | `qr_issue` |
| `SURVEY` | `existing_survey`, `survey_data_edit`, `asset_ledger_import`, `survey_ledger_matching` |
| `REMODEL` | `remodel_edit_list` |
| `NORMAL_EDIT` | `normal_edit_list` |
| `TASK` | `remodel_purchase`, `remodel_order`, `remodel_acceptance`, `normal_purchase`, `normal_order`, `normal_acceptance`, `normal_quotation`, `normal_ship_request`, `transfer_disposal`, `repair_management`, `maintenance_contract`, `inspection_management`, `lending_management` |
| `MASTER_ADMIN` | `asset_master_list`, `asset_master_edit`, `facility_master_list`, `facility_master_edit`, `facility_feature_edit`, `ship_dept_master_list`, `ship_dept_master_edit`, `hospital_dept_master_list`, `hospital_dept_master_edit`, `vendor_master_list`, `vendor_master_edit` |

付記: `lending_in_use_used` は `MAINTENANCE_REQUEST` 配下の操作機能として分類するが、メニュー表示条件には単独で使わない。実効利用には `lending_checkout` の実効権限も必須とする。

## 7. 今回外した旧候補

| 旧コード | 扱い |
| --- | --- |
| `application_status`, `qr_scan`, `remodel_quotation`, `periodic_inspection` | 最新シートに単位がないため採用外 |
| `inventory_field`, `inventory_office` | `inventory`, `inventory_complete` に再編 |
| `own_asset_master_view`, `own_user_master`, `own_asset_list`, `own_estimate`, `own_data_history`, `other_asset_list`, `other_estimate`, `other_data_history` | 最新シートに単位がないため採用外 |
| `own_price_column`, `other_price_column` | 最新シートに単位がないため採用外 |
| `ship_column` | `remodel_ship_column`, `normal_ship_column`, `asset_master_ship_column` に再編 |

## 8. Fix 後の扱い

- 権限管理単位の正本は `ロール整理.xlsx` の `権限管理単位一覧` シート A列とする。
- Fix 後の採用一覧は [authz-fix-summary.md](/C:/Projects/mock/medical-device-mgmt/taniguchi/docs/authz-fix-summary.md) を優先する。
- 追加要望が出た場合は、A列粒度を変えずに新規 `feature_code` / `column_code` を追加する。
