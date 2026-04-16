# 認証認可 画面表示と `feature_code` / `column_code` 対応整理

本メモは、クライアントから受領した「どの単位で権限制御したいか」という要望に対し、画面上で何を表示するか、それがどの `feature_code` / `column_code` と対応するかを整理したものである。  
実装時は、本メモをもとにフロントエンドの表示制御とバックエンドの認可判定を同じコードで揃える前提とする。

## 1. 基本ルール

### 1-1. 画面表示制御の単位

| 画面上の単位 | 何で判定するか | 補足 |
| --- | --- | --- |
| メニューグループ表示 | 配下の `feature_code` のいずれかが有効 | `menu_group_code` 自体は認可コードではない |
| 画面遷移導線 | 対応する `feature_code` | 一覧画面、管理画面、参照画面など |
| ボタン表示 | 対応する `feature_code` | 編集、申請、登録、起動ボタンなど |
| モーダル起動可否 | 対応する `feature_code` | 申請モーダル、修正モーダルなど |
| カラム表示 | 対応する `column_code` | 価格列、SHIP 列など |

### 1-2. `feature_code` が有効とみなされる条件

自施設文脈の実効権限は、次をすべて満たしたときに `有効` とみなす。

1. `user_facility_assignments` に対象ユーザーと作業対象施設の割当がある
2. `facility_feature_settings` の `is_enabled=true`
3. `user_facility_feature_settings` の `is_enabled=true`

カラムも同様に、`facility_column_settings` と `user_facility_column_settings` の両方が `true` のとき有効とみなす。

### 1-3. 他施設閲覧の追加条件

`other_*` 系は、上記に加えて次も満たす必要がある。

1. 作業対象施設と公開元施設が同じ `facility_collaboration_groups` に属する
2. 公開元施設の `facility_external_view_settings` が `true`
3. 必要な `facility_external_column_settings` が `true`

## 2. 権限管理画面での見え方

### 2-1. 施設権限管理画面

- 縦に並ぶ 1 行 1 項目が `feature_code` または `column_code`
- チェック ON/OFF は `facility_feature_settings.is_enabled` または `facility_column_settings.is_enabled` に保存する
- 施設で OFF の機能は、その施設の全ユーザーが使えない

### 2-2. ユーザー権限管理画面

- 縦に並ぶ 1 行 1 項目が `feature_code` または `column_code`
- チェック ON/OFF は `user_facility_feature_settings.is_enabled` または `user_facility_column_settings.is_enabled` に保存する
- 施設で ON の機能だけをユーザーに ON できる
- 施設で OFF の機能は、ユーザー画面では非表示またはグレーアウトのどちらでも実装可能

推奨は、施設で OFF の機能も一覧に出し、`施設未提供のため選択不可` としてグレーアウトする形である。  
この方が、クライアントとの認識合わせがしやすい。

## 3. メニュー表示の対応

| 画面上の表示 | 表示条件 | 対応コード |
| --- | --- | --- |
| ユーザー管理メニュー | `user_facility_access` または `user_management` のいずれかが有効 | `user_facility_access`, `user_management` |
| 資産閲覧申請メニュー | 配下機能のいずれかが有効 | `original_list_view`, `original_list_edit`, `original_application` |
| 保守点検／貸出／修理申請／申請ステータスメニュー | 配下機能のいずれかが有効 | `daily_inspection`, `lending_checkout`, `repair_application`, `application_status` |
| 棚卸しメニュー | 配下機能のいずれかが有効 | `inventory_field`, `inventory_office` |
| リモデルメニュー | 配下機能のいずれかが有効 | `remodel_edit_list`, `remodel_purchase`, `remodel_order`, `remodel_acceptance`, `remodel_quotation` |
| 編集リスト（通常）メニュー | 配下機能のいずれかが有効 | `normal_edit_list` |
| タスク管理メニュー | 配下機能のいずれかが有効 | `normal_purchase`, `normal_order`, `normal_acceptance`, `normal_quotation`, `transfer_disposal`, `repair_management`, `maintenance_contract`, `inspection_management`, `periodic_inspection`, `lending_management` |
| QRコード発行メニュー | `qr_issue` が有効 | `qr_issue` |
| QR読取メニュー | `qr_scan` が有効 | `qr_scan` |
| データ閲覧（自施設）メニュー | 配下機能のいずれかが有効 | `own_asset_master_view`, `own_user_master`, `own_asset_list`, `own_estimate`, `own_data_history` |
| データ閲覧（他施設）メニュー | 配下機能のいずれかが有効 | `other_asset_list`, `other_estimate`, `other_data_history` |
| マスタ管理メニュー | 配下機能のいずれかが有効 | `asset_master_list`, `facility_master_list`, `dept_vendor_master_list`, `asset_master_edit`, `facility_master_edit`, `ship_dept_master_edit`, `hospital_dept_master_edit`, `vendor_master_edit` |
| 個体管理リスト作成メニュー | 配下機能のいずれかが有効 | `existing_survey`, `survey_data_edit`, `asset_ledger_import`, `survey_ledger_matching` |

## 4. 画面・ボタン・カラムの対応

### 4-1. ユーザー管理・認証・施設選択

| クライアント記載 | 画面上の表示・利用 | 対応コード | 種別 | 備考 |
| --- | --- | --- | --- | --- |
| アクセス可能施設の選択 | ユーザー編集画面内の担当施設設定 UI を表示する | `user_facility_access` | `feature_code` | 閲覧可能施設を直接付与するのではなく、担当施設設定の入口 |
| ユーザー一覧編集画面新規作成画面 | ユーザー管理画面を表示する | `user_management` | `feature_code` | 一覧、編集、新規作成の入口 |
| ログイン画面 パスワード再設定関連 | ログイン画面、パスワード再設定画面を使う | `auth_login` | `feature_code` | `SYSTEM_FIXED`。権限設定画面には出さない |
| 施設選択画面 | 担当施設から作業対象施設を選ぶ | `facility_select` | `feature_code` | `SYSTEM_FIXED`。権限設定画面には出さない |

### 4-2. 資産閲覧申請

| クライアント記載 | 画面上の表示・利用 | 対応コード | 種別 | 備考 |
| --- | --- | --- | --- | --- |
| 原本リスト | 原本リスト画面に遷移できる | `original_list_view` | `feature_code` | `カード / カルテ` も暫定的にここへ束ねる |
| 原本リストカードカルテ画面閲覧 | カード/カルテ画面を表示する | `original_list_view` | `feature_code` | 将来分割の余地あり |
| 原本価格情報のカラム項目 | 原本リスト、カード、カルテで価格列を表示する | `original_price_column` | `column_code` | カラム制御 |
| 原本リストの修正追加 | 修正・追加ボタンを表示し実行できる | `original_list_edit` | `feature_code` | 編集系操作 |
| 新規更新増設移動廃棄申請モーダル | 申請モーダル起動ボタンを表示し実行できる | `original_application` | `feature_code` | 申請起票の入口 |

### 4-3. 保守点検／貸出／修理申請／申請ステータス

| クライアント記載 | 画面上の表示・利用 | 対応コード | 種別 | 備考 |
| --- | --- | --- | --- | --- |
| オフライン準備 | オフライン準備の導線/操作を表示する | `daily_inspection` | `feature_code` | 日常点検実施と暫定的に同一コード |
| 日常点検実施 | 日常点検実施画面/操作を表示する | `daily_inspection` | `feature_code` | 将来分割の余地あり |
| 貸出可能機器閲覧 | 貸出対象の閲覧導線を表示する | `lending_checkout` | `feature_code` | 貸出返却と暫定的に同一コード |
| 貸出返却画面 | 貸出返却画面を表示し実行できる | `lending_checkout` | `feature_code` | 将来分割の余地あり |
| 修理申請画面 | 修理申請画面を表示し実行できる | `repair_application` | `feature_code` | 修理申請起票 |
| 申請ステータスモーダル | ステータス参照モーダルを表示する | `application_status` | `feature_code` | 申請状況参照 |

### 4-4. 棚卸し

| クライアント記載 | 画面上の表示・利用 | 対応コード | 種別 | 備考 |
| --- | --- | --- | --- | --- |
| 棚卸実施画面（管理部署で絞り込み） | 現場棚卸し画面を表示する | `inventory_field` | `feature_code` | 現場利用 |
| 棚卸完了登録 | 棚卸完了登録操作を表示し実行できる | `inventory_office` | `feature_code` | Excel 出力と暫定的に同一コード |
| Excel出力 | Excel 出力ボタンを表示し実行できる | `inventory_office` | `feature_code` | 将来分割の余地あり |

### 4-5. リモデル

| クライアント記載 | 画面上の表示・利用 | 対応コード | 種別 | 備考 |
| --- | --- | --- | --- | --- |
| リモデルの編集リスト | 編集リスト画面を表示する | `remodel_edit_list` | `feature_code` | 申請登録、見積G、分析作業と暫定的に同一コード |
| 申請登録 | 申請登録導線/操作を表示する | `remodel_edit_list` | `feature_code` | 将来分割の余地あり |
| 見積G | 見積関連導線/操作を表示する | `remodel_edit_list` | `feature_code` | 将来分割の余地あり |
| 各種分析作業 | 分析作業導線/操作を表示する | `remodel_edit_list` | `feature_code` | 将来分割の余地あり |
| 申請受付～見積登録画面 | リモデル購入管理画面を表示する | `remodel_purchase` | `feature_code` | 画面利用 |
| 発注登録画面～資産登録 | 発注から資産登録までを実行できる | `remodel_order` | `feature_code` | 操作系 |
| 検収登録画面 | 検収登録画面を表示し実行できる | `remodel_acceptance` | `feature_code` | 一覧未実装を含む |
| リモデル取得見積 | 見積管理画面を表示する | `remodel_quotation` | `feature_code` | 参照・管理 |

### 4-6. 通常編集リスト・タスク管理

| クライアント記載 | 画面上の表示・利用 | 対応コード | 種別 | 備考 |
| --- | --- | --- | --- | --- |
| 通常申請の編集リスト | 編集リスト画面を表示する | `normal_edit_list` | `feature_code` | 申請登録、見積G、分析作業と暫定的に同一コード |
| 申請登録 | 申請登録導線/操作を表示する | `normal_edit_list` | `feature_code` | 将来分割の余地あり |
| 見積G | 見積関連導線/操作を表示する | `normal_edit_list` | `feature_code` | 将来分割の余地あり |
| 各種分析作業 | 分析作業導線/操作を表示する | `normal_edit_list` | `feature_code` | 将来分割の余地あり |
| DataLINKのSHIPのみカラム項目 | 通常編集リスト内で SHIP 列を表示する | `ship_column` | `column_code` | カラム制御 |
| 申請受付～見積登録画面 | 通常購入管理画面を表示する | `normal_purchase` | `feature_code` | 画面利用 |
| 発注登録画面～仮資産登録 | 発注から仮資産登録までを実行できる | `normal_order` | `feature_code` | 操作系 |
| 検収登録画面 | 検収登録画面を表示し実行できる | `normal_acceptance` | `feature_code` | 通常系検収 |
| 通常時取得見積 | 見積管理画面を表示する | `normal_quotation` | `feature_code` | 参照・管理 |
| 移動廃棄申請一覧画面 | 移動廃棄一覧を表示する | `transfer_disposal` | `feature_code` | 廃棄契約管理と暫定的に同一コード |
| 廃棄契約管理画面 | 廃棄契約管理画面を表示する | `transfer_disposal` | `feature_code` | 将来分割の余地あり |
| 修理申請一覧画面 | 修理申請一覧を表示する | `repair_management` | `feature_code` | 修理管理と同一コード |
| 修理管理画面 | 修理管理画面を表示する | `repair_management` | `feature_code` | 修理タスク管理 |
| 保守契約一覧画面 | 保守契約一覧を表示する | `maintenance_contract` | `feature_code` | 詳細登録等と暫定的に同一コード |
| 保守契約管理画面詳細登録契約見直モーダル | 詳細登録、契約見直しモーダルを表示する | `maintenance_contract` | `feature_code` | 将来分割の余地あり |
| 保守対象機器登録モーダル | 保守対象機器登録モーダルを表示する | `maintenance_contract` | `feature_code` | 将来分割の余地あり |
| 点検管理画面 | 点検管理画面を表示する | `inspection_management` | `feature_code` | 予定表出力等と暫定的に同一コード |
| メーカー日程調整結果登録モーダル | 結果登録モーダルを表示する | `inspection_management` | `feature_code` | 将来分割の余地あり |
| 点検メニュー作成 | 点検メニュー作成を表示し実行できる | `inspection_management` | `feature_code` | 将来分割の余地あり |
| 点検予定表出力 | 予定表出力ボタンを表示し実行できる | `inspection_management` | `feature_code` | 将来分割の余地あり |
| 点検対象機器登録モーダル | 対象機器登録モーダルを表示する | `inspection_management` | `feature_code` | 将来分割の余地あり |
| 定期点検実施モーダル | 定期点検実施モーダルを表示し実行できる | `periodic_inspection` | `feature_code` | 定期点検実施 |
| 貸出管理画面 | 貸出管理画面を表示する | `lending_management` | `feature_code` | エクスポート等と暫定的に同一コード |
| 貸出実績エクスポートモーダル | エクスポートモーダルを表示し実行できる | `lending_management` | `feature_code` | 将来分割の余地あり |
| 貸出対象機器登録モーダル | 対象機器登録モーダルを表示する | `lending_management` | `feature_code` | 将来分割の余地あり |

### 4-7. QRコード

| クライアント記載 | 画面上の表示・利用 | 対応コード | 種別 | 備考 |
| --- | --- | --- | --- | --- |
| QRコード発行 | QR 発行画面/ボタンを表示し実行できる | `qr_issue` | `feature_code` | QR 発行 |
| QR読取 | QR 読取画面/ボタンを表示し実行できる | `qr_scan` | `feature_code` | QR 読取 |

### 4-8. データ閲覧（自施設）

| クライアント記載 | 画面上の表示・利用 | 対応コード | 種別 | 備考 |
| --- | --- | --- | --- | --- |
| 資産マスタデータ | 自施設の資産マスタを表示する | `own_asset_master_view` | `feature_code` | データ閲覧 |
| ユーザーマスタデータ | 自施設のユーザーマスタを表示する | `own_user_master` | `feature_code` | データ閲覧 |
| 資産原本リストデータ | 自施設の資産一覧を表示する | `own_asset_list` | `feature_code` | データ閲覧 |
| 資産原本中の価格カラム項目 | 自施設の資産一覧で価格列を表示する | `own_price_column` | `column_code` | カラム制御 |
| 見積データ | 自施設の見積データを表示する | `own_estimate` | `feature_code` | データ閲覧 |
| 申請履歴 電帳法検索（ドキュメント検索） | 自施設の履歴・検索画面を表示する | `own_data_history` | `feature_code` | データ閲覧 |

### 4-9. データ閲覧（他施設）

| クライアント記載 | 画面上の表示・利用 | 対応コード | 種別 | 備考 |
| --- | --- | --- | --- | --- |
| 資産原本リストデータ | 他施設の資産一覧を表示する | `other_asset_list` | `feature_code` | 協業グループと公開設定も必要 |
| 資産原本中の価格カラム項目 | 他施設の資産一覧で価格列を表示する | `other_price_column` | `column_code` | 公開元施設のカラム公開も必要 |
| 見積データ | 他施設の見積データを表示する | `other_estimate` | `feature_code` | 協業グループと公開設定も必要 |
| 申請履歴 電帳法検索（ドキュメント検索） | 他施設の履歴・検索画面を表示する | `other_data_history` | `feature_code` | 協業グループと公開設定も必要 |

### 4-10. マスタ管理

| クライアント記載 | 画面上の表示・利用 | 対応コード | 種別 | 備考 |
| --- | --- | --- | --- | --- |
| 資産マスタ 一覧画面 | 資産マスタ一覧を表示する | `asset_master_list` | `feature_code` | 一覧参照 |
| 施設マスタ 一覧画面 | 施設マスタ一覧を表示する | `facility_master_list` | `feature_code` | 一覧参照 |
| SHIP部署マスタ / 個別部署マスタ / 業者マスタ 一覧画面 | 各一覧画面を表示する | `dept_vendor_master_list` | `feature_code` | 暫定的に束ねる |
| 資産マスタ 編集新規作成モーダル | 編集/新規作成モーダルを表示する | `asset_master_edit` | `feature_code` | 編集系 |
| 施設マスタ 編集新規作成モーダル | 編集/新規作成モーダルを表示する | `facility_master_edit` | `feature_code` | 編集系 |
| SHIP部署マスタ 編集新規作成モーダル | 編集/新規作成モーダルを表示する | `ship_dept_master_edit` | `feature_code` | 編集系 |
| 個別部署マスタ 編集新規作成モーダル | 編集/新規作成モーダルを表示する | `hospital_dept_master_edit` | `feature_code` | 編集系 |
| 業者マスタ 編集新規作成モーダル | 編集/新規作成モーダルを表示する | `vendor_master_edit` | `feature_code` | 編集系 |

### 4-11. 個体管理リスト作成

| クライアント記載 | 画面上の表示・利用 | 対応コード | 種別 | 備考 |
| --- | --- | --- | --- | --- |
| 準備 調査場所入力 現有品調査 履歴 | 現有品調査一式を表示し利用する | `existing_survey` | `feature_code` | 一連の調査導線 |
| 登録内容修正 資産マスタ選択画面 | 現調データ修正画面を表示し実行できる | `survey_data_edit` | `feature_code` | 修正系 |
| 資産台帳取込 資産マスタ登録画面 | 台帳取込画面を表示し実行できる | `asset_ledger_import` | `feature_code` | 取込系 |
| データ突合画面 固定資産台帳（未突合） | 現調台帳突合せ画面を表示し実行できる | `survey_ledger_matching` | `feature_code` | 突合系 |

## 5. 現時点で暫定対応としている箇所

以下は、クライアント記載上は複数行に分かれているが、現時点では 1 つの `feature_code` に束ねている。

- `original_list_view`
  - 原本リスト
  - カード
  - カルテ
- `daily_inspection`
  - オフライン準備
  - 日常点検実施
- `lending_checkout`
  - 貸出可能機器閲覧
  - 貸出返却
- `inventory_office`
  - 棚卸完了登録
  - Excel出力
- `remodel_edit_list`
  - 編集リスト
  - 申請登録
  - 見積G
  - 各種分析作業
- `normal_edit_list`
  - 編集リスト
  - 申請登録
  - 見積G
  - 各種分析作業
- `maintenance_contract`
  - 一覧
  - 詳細登録
  - 契約見直し
  - 保守対象機器登録
- `inspection_management`
  - 管理画面
  - 結果登録
  - 点検メニュー作成
  - 予定表出力
  - 対象機器登録
- `lending_management`
  - 管理画面
  - エクスポート
  - 対象機器登録

この単位をさらに分割するかは、別途クライアントと粒度確認が必要である。
