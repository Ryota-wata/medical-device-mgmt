# 認証認可 画面表示と `feature_code` / `column_code` 対応整理

本メモは、`taniguchi/docs/ロール整理.xlsx` の `権限管理単位一覧` シートを正本として、画面上の表示・利用要素をどの `feature_code` / `column_code` に対応づけるかを整理したものである。
最新化の基準は 2026-04-27 時点の `権限管理単位一覧` シート A列であり、`auth_login` と `facility_select` だけはシート外の固定導線として別扱いにしている。

## 1. 基本ルール

### 1-1. 画面表示制御の単位

| 画面上の単位 | 何で判定するか | 補足 |
| --- | --- | --- |
| メニューグループ表示 | 配下の `feature_code` のいずれかが有効 | `menu_group_code` 自体は認可コードではない |
| 画面遷移導線 | 対応する `feature_code` | 一覧画面、管理画面、タスク行など |
| ボタン表示 | 対応する `feature_code` | 登録、編集、申請、完了など |
| モーダル起動可否 | 対応する `feature_code` | 編集モーダル、確認モーダルなど |
| カラム表示 | 対応する `column_code` | 価格列、SHIP 列など |

### 1-2. `feature_code` / `column_code` が有効とみなされる条件

自施設文脈の実効権限は、まず `user_facility_assignments` に対象ユーザーと作業対象施設の割当があることを前提に、設定スコープ別に判定する。

- `config_scope='FACILITY_USER'` の `feature_code`: `facility_feature_settings.is_enabled=true` かつ `user_facility_feature_settings.is_enabled=true`
- `config_scope='FACILITY'` の `feature_code`: `facility_feature_settings.is_enabled=true`。ユーザー施設別設定は参照しない。現行採用コードでは固定導線を除く機能を `FACILITY_USER` に統一するため、原則として使用しない
- `column_code`: `facility_column_settings.is_enabled=true` かつ `user_facility_column_settings.is_enabled=true`。さらに `related_feature_code` の実効権限が有効

### 1-3. 今回の最新化で明示したこと

- `権限管理単位一覧` シート A列採用分は、ユニークな `feature_code` 46件、`column_code` 4件とする。シート外固定導線の `auth_login` / `facility_select` を含めた `feature_code` は48件とする。
- `資産一覧 / 管理部署編集` は `management_department_edit` として独立管理し、`資産カルテ / 原本編集` の `original_list_edit` には束ねない。
- `通常購入管理 / SHIP依頼機能` は `normal_ship_request` として独立管理し、購入管理タブ表示や見積依頼行の利用可否を表す `normal_purchase` には束ねない。`config_scope='FACILITY_USER'` とし、施設提供設定とユーザー施設別設定の両方が ON の場合のみ利用できる。
- `貸出・返却 / 使用中 & 使用済み` は `lending_in_use_used` として独立管理し、貸出可能機器閲覧・貸出返却画面の入口を表す `lending_checkout` には束ねない。`config_scope='FACILITY_USER'` とし、施設提供設定とユーザー施設別設定の両方が ON の場合のみ利用できる。ただし実効利用には親機能 `lending_checkout` も有効であることを必須とし、`lending_in_use_used` 単独ではメニュー表示・画面遷移・業務 API 実行を許可しない。
- `application_status`、`qr_scan`、`remodel_quotation`、`periodic_inspection` は最新シートに単位がないため現行採用から外す。
- `inventory_field` / `inventory_office` は `inventory` / `inventory_complete` に再編する。
- `ship_column` は `remodel_ship_column` / `normal_ship_column` / `asset_master_ship_column` に再編する。
- `資産マスタ / SHIP表示列` は、A列名称を優先して `asset_master_ship_column` として扱う。対象画面セルが通常編集リストを指しているため、元シート側の記載は別途確認余地がある。

## 2. 権限管理画面での見え方

### 2-1. 施設権限管理画面

- 縦に並ぶ 1 行 1 項目が `config_scope='FACILITY'` / `FACILITY_USER` の `feature_code` または `column_code`
- チェック ON/OFF は `facility_feature_settings.is_enabled` または `facility_column_settings.is_enabled` に保存する
- 施設で OFF の機能は、その施設の全ユーザーが使えない
- `normal_ship_request` / `lending_in_use_used` は `config_scope='FACILITY_USER'` として施設提供設定にも表示し、施設で OFF の場合はユーザー側が ON でも実効権限なしとする
- 施設提供設定で `lending_checkout` が OFF の場合、施設提供設定の `lending_in_use_used` は ON にできない。画面では非活性表示または親 OFF 時の自動 OFF とし、保存 API でも `lending_in_use_used=true` かつ `lending_checkout=false` の組み合わせを拒否する
- 施設提供設定で `lending_in_use_used` を ON から OFF へ変更する場合、`lending_devices.asset_ledger_id` から `asset_ledgers.facility_id` を参照して対象施設の貸出機器に限定し、現在状態または `returned_on IS NULL` の未返却履歴に `使用中` / `使用済` 状態が残っていれば保存を拒否する。先に該当機器を返却完了させてから OFF にする

### 2-2. ユーザー権限管理画面

- 縦に並ぶ 1 行 1 項目が `config_scope='FACILITY_USER'` の `feature_code` または `column_code`
- チェック ON/OFF は `user_facility_feature_settings.is_enabled` または `user_facility_column_settings.is_enabled` に保存する
- 施設で ON の機能だけをユーザーに ON できる
- 施設で OFF の機能は、ユーザー画面では非表示またはグレーアウトのどちらでも実装可能
- `normal_ship_request` / `lending_in_use_used` はユーザー別設定候補に含める。ユーザー側で `lending_in_use_used` を ON にする場合も、同一担当施設の `lending_checkout` が ON であることを必須とする

## 3. メニュー表示の対応

| 画面上の表示 | 表示条件 | 対応コード |
| --- | --- | --- |
| ユーザー管理メニュー | 配下機能のいずれかが有効 | `user_list_view`, `user_edit`, `user_facility_assignment_edit`, `facility_group_list`, `facility_group_edit` |
| 資産閲覧申請メニュー | 配下機能のいずれかが有効 | `original_list_view`, `original_application`, `management_department_edit`, `inspection_management`, `maintenance_contract`, `original_list_edit` |
| 保守点検／貸出／修理申請メニュー | 配下画面機能のいずれかが有効。`lending_in_use_used` 単独では表示条件に含めない | `daily_inspection`, `lending_checkout`, `repair_application` |
| 棚卸しメニュー | 配下機能のいずれかが有効 | `inventory`, `inventory_complete` |
| 編集リスト（リモデル）メニュー | `remodel_edit_list` が有効 | `remodel_edit_list` |
| 編集リスト（通常）メニュー | `normal_edit_list` が有効 | `normal_edit_list` |
| タスク管理メニュー | 配下機能のいずれかが有効 | `remodel_purchase`, `remodel_order`, `remodel_acceptance`, `normal_purchase`, `normal_order`, `normal_acceptance`, `normal_quotation`, `normal_ship_request`, `transfer_disposal`, `repair_management`, `maintenance_contract`, `inspection_management`, `lending_management` |
| QRコード発行メニュー | `qr_issue` が有効 | `qr_issue` |
| 個体管理リスト作成メニュー | 配下機能のいずれかが有効 | `existing_survey`, `survey_data_edit`, `asset_ledger_import`, `survey_ledger_matching` |
| マスタ管理メニュー | 配下機能のいずれかが有効 | `asset_master_list`, `asset_master_edit`, `facility_master_list`, `facility_master_edit`, `facility_feature_edit`, `ship_dept_master_list`, `ship_dept_master_edit`, `hospital_dept_master_list`, `hospital_dept_master_edit`, `vendor_master_list`, `vendor_master_edit` |

## 4. 画面・ボタン・カラムの対応

### 4-1. システム固定導線

| 管理単位 | 画面上の表示・利用 | 対応コード | 種別 | 備考 |
| --- | --- | --- | --- | --- |
| ログイン・パスワード再設定 | ログイン画面、パスワード再設定画面を使う | `auth_login` | `feature_code` | `SYSTEM_FIXED`。権限設定画面には出さない |
| 施設選択 | 担当施設から作業対象施設を選ぶ | `facility_select` | `feature_code` | `SYSTEM_FIXED`。権限設定画面には出さない |

### 4-2. ユーザー管理

| 権限管理単位一覧 A列 | 画面上の表示・利用 | 対応コード | 種別 | 備考 |
| --- | --- | --- | --- | --- |
| ユーザー 一覧 | ユーザー一覧画面を表示する | `user_list_view` | `feature_code` | 一覧参照 |
| ユーザー 新規作成・編集 | 新規作成/編集モーダルを表示し実行できる | `user_edit` | `feature_code` | 編集系 |
| 担当施設 編集 | ユーザー編集画面内の担当施設設定 UI を表示する | `user_facility_assignment_edit` | `feature_code` | 担当施設設定の入口 |
| 施設グループ 一覧 | 施設グループ一覧画面を表示する | `facility_group_list` | `feature_code` | 一覧参照 |
| 施設グループ 新規作成・編集 | 編集/新規作成モーダルを表示する | `facility_group_edit` | `feature_code` | 編集系 |

### 4-3. 資産閲覧申請

| 権限管理単位一覧 A列 | 画面上の表示・利用 | 対応コード | 種別 | 備考 |
| --- | --- | --- | --- | --- |
| 資産一覧・カルテ閲覧 | 資産一覧画面、資産カルテ画面、関連メニュー導線を表示する | `original_list_view` | `feature_code` | 閲覧系 |
| 資産一覧 / 新規・更新・増設・移動・廃棄 | 資産一覧上の申請系ボタンを表示し実行できる | `original_application` | `feature_code` | 資産一覧起点 |
| 資産一覧 / 管理部署編集 | 資産一覧上の管理部署編集ボタンを表示し一括保存できる | `management_department_edit` | `feature_code` | 資産一覧起点 |
| 資産一覧 / 点検管理登録 | 資産一覧上の点検管理登録ボタンを表示し実行できる | `inspection_management` | `feature_code` | 点検管理と同一コード |
| 資産一覧 / 保守契約登録 | 資産一覧上の保守契約登録ボタンを表示し実行できる | `maintenance_contract` | `feature_code` | 保守契約管理と同一コード |
| 資産カルテ / 原本編集 | 資産カルテ画面の原本編集ボタンを表示し実行できる | `original_list_edit` | `feature_code` | カルテ起点 |
| 資産一覧・カルテ / 原本価格情報 | 原本価格列を表示する | `original_price_column` | `column_code` | カラム制御 |

### 4-4. 保守・点検・棚卸し・QR

| 権限管理単位一覧 A列 | 画面上の表示・利用 | 対応コード | 種別 | 備考 |
| --- | --- | --- | --- | --- |
| 日常点検・オフライン準備 | 日常点検画面とオフライン準備導線を表示し利用する | `daily_inspection` | `feature_code` | 1管理単位で扱う |
| 貸出・返却 | 貸出可能機器閲覧と貸出返却画面を表示し利用する | `lending_checkout` | `feature_code` | 1管理単位で扱う |
| 貸出・返却 / 使用中 & 使用済み | 貸出返却画面の使用中モーダル・使用済みモーダルとボタンを利用できる | `lending_in_use_used` | `feature_code` | ユーザー施設別のボタン/モーダル利用。実効利用には `lending_checkout` も必須 |
| 修理申請 | 修理申請画面を表示し実行できる | `repair_application` | `feature_code` | 申請起票 |
| 棚卸し | 棚卸し画面を表示する | `inventory` | `feature_code` | 画面利用 |
| 棚卸し / 完了 | 棚卸し完了モーダル、完了ボタン、Excel出力を表示し実行できる | `inventory_complete` | `feature_code` | 1管理単位で扱う |
| QRコード発行 | QR発行画面、プレビュー画面、印刷画面を表示し利用する | `qr_issue` | `feature_code` | QR 発行 |

### 4-5. 個体管理リスト作成

| 権限管理単位一覧 A列 | 画面上の表示・利用 | 対応コード | 種別 | 備考 |
| --- | --- | --- | --- | --- |
| 現有品調査 | オフライン準備、調査場所入力、現有品調査、登録履歴表示を利用する | `existing_survey` | `feature_code` | 一連の調査導線 |
| 現有品調査内容修正 | 現有品調査内容修正画面を表示し実行できる | `survey_data_edit` | `feature_code` | 修正系 |
| 資産台帳取込登録 | 資産台帳取込画面と資産台帳・マスタ突き合わせ画面を利用する | `asset_ledger_import` | `feature_code` | 取込系 |
| データ突合 | データ突合画面 固定資産台帳（未突合）を利用する | `survey_ledger_matching` | `feature_code` | 突合系 |

### 4-6. 編集リスト・タスク管理

| 権限管理単位一覧 A列 | 画面上の表示・利用 | 対応コード | 種別 | 備考 |
| --- | --- | --- | --- | --- |
| 編集リスト（リモデル） | 編集リスト画面、関連モーダル、メニュー導線を表示する | `remodel_edit_list` | `feature_code` | 画面利用 |
| DataLINK / SHIP表示列（リモデル） | リモデル編集リスト内で SHIP 列を表示する | `remodel_ship_column` | `column_code` | カラム制御 |
| 編集リスト（通常） | 編集リスト画面、関連モーダル、メニュー導線を表示する | `normal_edit_list` | `feature_code` | 画面利用 |
| DataLINK / SHIP表示列（通常） | 通常編集リスト内で SHIP 列を表示する | `normal_ship_column` | `column_code` | カラム制御 |
| リモデル購入管理 / 申請受付～見積登録 | タスク管理画面のリモデル管理タブに表示される見積登録行を利用できる | `remodel_purchase` | `feature_code` | タスク行利用 |
| リモデル購入管理 / 発注登録～資産登録 | リモデル管理タブの発注登録～資産登録行を利用できる | `remodel_order` | `feature_code` | タスク行利用 |
| リモデル購入管理 / 検収登録 | リモデル管理タブの検収登録行を利用できる | `remodel_acceptance` | `feature_code` | タスク行利用 |
| 通常購入管理 / 申請受付～見積登録 | 購入管理タブの見積依頼行を利用できる | `normal_purchase` | `feature_code` | タスク行利用 |
| 通常購入管理 / 発注登録～仮資産登録 | 購入管理タブの発注登録～仮資産登録行を利用できる | `normal_order` | `feature_code` | タスク行利用 |
| 通常購入管理 / 検収登録 | 購入管理タブの検収登録行を利用できる | `normal_acceptance` | `feature_code` | タスク行利用 |
| 通常購入管理 / 見積管理 | 購入管理タブの見積管理行を利用できる | `normal_quotation` | `feature_code` | タスク行利用 |
| 通常購入管理 / SHIP依頼機能 | 購入管理タブのSHIPへ一括依頼ボタンを利用できる | `normal_ship_request` | `feature_code` | ユーザー施設別のボタン利用 |
| 移動・廃棄管理 | 移動・廃棄管理タブを表示する | `transfer_disposal` | `feature_code` | 画面利用 |
| 修理管理 | 修理管理タブを表示する | `repair_management` | `feature_code` | 画面利用 |
| 保守契約管理 | 保守管理タブを表示する | `maintenance_contract` | `feature_code` | 1管理単位で扱う |
| 点検管理 | 点検管理タブを表示する | `inspection_management` | `feature_code` | 1管理単位で扱う |
| 貸出管理（タスク管理） | 貸出管理タブを表示する | `lending_management` | `feature_code` | 1管理単位で扱う |

### 4-7. マスタ管理

| 権限管理単位一覧 A列 | 画面上の表示・利用 | 対応コード | 種別 | 備考 |
| --- | --- | --- | --- | --- |
| 資産マスタ / 一覧 | SHIP資産マスタ画面を表示する | `asset_master_list` | `feature_code` | 一覧参照 |
| 資産マスタ / 新規作成・編集 | 編集/新規作成モーダルを表示する | `asset_master_edit` | `feature_code` | 編集系 |
| 資産マスタ / SHIP表示列 | 資産マスタ文脈の SHIP 列を表示する | `asset_master_ship_column` | `column_code` | 元シートの対象画面セルは通常編集リストを指しているため要確認 |
| 施設マスタ / 一覧 | SHIP施設マスタ画面を表示する | `facility_master_list` | `feature_code` | 一覧参照 |
| 施設マスタ / 新規作成・編集 | 編集/新規作成モーダルを表示する | `facility_master_edit` | `feature_code` | 編集系 |
| 施設提供機能 / 編集 | 施設単位の機能提供設定 UI を表示する | `facility_feature_edit` | `feature_code` | 施設単位設定 |
| SHIP部署マスタ 一覧 | SHIP部署マスタ画面を表示する | `ship_dept_master_list` | `feature_code` | 一覧参照 |
| SHIP部署マスタ 新規作成・編集 | 編集/新規作成モーダルを表示する | `ship_dept_master_edit` | `feature_code` | 編集系 |
| 個別部署マスタ 一覧 | 個別部署マスタ画面を表示する | `hospital_dept_master_list` | `feature_code` | 一覧参照 |
| 個別部署マスタ 新規作成・編集 | 編集/新規作成モーダルを表示する | `hospital_dept_master_edit` | `feature_code` | 編集系 |
| 業者マスタ 一覧 | 業者マスタ画面を表示する | `vendor_master_list` | `feature_code` | 一覧参照 |
| 業者マスタ 新規作成・編集 | 編集/新規作成モーダルを表示する | `vendor_master_edit` | `feature_code` | 編集系 |

## 5. Fix済みの束ね単位

以下は、1つの権限管理単位で複数 UI 要素を同時に制御するコードである。

- `original_list_view`
  - 資産一覧画面
  - 資産カルテ画面
  - 関連メニュー導線
- `daily_inspection`
  - オフライン準備
  - 日常点検実施
- `lending_checkout`
  - 貸出可能機器閲覧
  - 貸出返却
- `lending_in_use_used`
  - 貸出返却画面の使用中モーダル/ボタン
  - 貸出返却画面の使用済みモーダル/ボタン
  - `config_scope='FACILITY_USER'` としてユーザー施設別設定で個別付与する
  - 実効利用には `lending_checkout` の実効権限も必須
  - `lending_checkout` OFF 時は施設提供設定・ユーザー施設別設定のどちらでも ON 不可
  - 施設提供設定で ON から OFF にする場合は、`lending_devices.asset_ledger_id` から `asset_ledgers.facility_id` を参照して対象施設の貸出機器に限定し、現在状態または `returned_on IS NULL` の未返却履歴に `使用中` / `使用済` 状態が残っていないことを保存時に検証する
  - ユーザー施設別設定で OFF にする場合は当該ユーザーの権限だけを無効化し、既存の使用中/使用済みデータは権限を持つ別ユーザーまたは再付与後の同一ユーザーが後続処理する
- `inventory_complete`
  - 棚卸し完了
  - 棚卸し結果 Excel 出力
- `qr_issue`
  - QR 発行画面
  - QR プレビュー画面
  - QR 印刷画面
- `existing_survey`
  - オフライン準備
  - 調査場所入力
  - 現有品調査
  - 登録履歴表示
- `remodel_edit_list`
  - リモデル編集リスト画面
  - 作成済みリスト/新規リスト作成モーダル
- `normal_edit_list`
  - 通常編集リスト画面
  - 作成済みリスト/新規リスト作成モーダル
- `maintenance_contract`
  - 保守管理タブ
  - 関連モーダル群
- `inspection_management`
  - 点検管理タブ
  - 関連モーダル群
- `lending_management`
  - 貸出管理タブ
  - 関連モーダル群

さらなる細分化が必要になった場合は、A列の粒度を変更せず、新規 `feature_code` / `column_code` の追加で対応する。
