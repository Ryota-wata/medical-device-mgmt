# 認証認可 機能カタログ・カラムカタログ整理メモ（たたき台）

本メモは、クライアントから提示された機能一覧をもとに、認証認可で扱う「機能カタログ」と「カラムカタログ」を正規化するためのたたき台である。  
現在の正本は [authz-fix-summary.md](/C:/Projects/mock/medical-device-mgmt/taniguchi/docs/authz-fix-summary.md) であり、権限管理単位は `ロール整理.xlsx` の `権限管理単位一覧` シート A列粒度を `Fix` として採用している。  
全体方針は [authz-feature-catalog-direction.md](/C:/Projects/mock/medical-device-mgmt/taniguchi/docs/authz-feature-catalog-direction.md) を参照し、本メモを受けたテーブル案は [authz-table-proposal.md](/C:/Projects/mock/medical-device-mgmt/taniguchi/docs/authz-table-proposal.md) を参照する。

## 整理ルール

- クライアント記載のうち、独立して ON/OFF したい対象を 1 行 1 カタログ項目として扱う。
- 既存モックに同等の `FeatureId` があるものは、原則としてそのコードを再利用する。
- クライアント記載の `メニュー（表示）` は、現時点ではグループ見出しとして扱い、`menu_group_code` で整理する。独立した `menu_*` コードは付与しない。
- `ロール権限付与` という表現は、現方針では `施設で提供されている機能のうち、そのユーザーに許可する機能の付与` と読み替える。
- 本メモに残る粗い束ね方は historical な検討記録であり、Fix 後の採用単位は `authz-fix-summary.md` を参照する。

## 機能カタログ

### 1. ユーザー管理・認証認可・施設選択

| コード | 名称 | クライアント記載 | 備考 |
| --- | --- | --- | --- |
| `user_facility_access` | アクセス可能施設の選択 | アクセス可能施設の選択（作業可能施設選択＋閲覧可能施設） | ユーザーに対する担当施設設定の入口。閲覧可能施設は直接付与ではなく、協業グループと公開設定の組み合わせで成立する前提。 |
| `user_management` | ユーザー一覧・編集・新規作成 | ユーザー一覧編集画面新規作成画面 | 備考欄の `ロール権限付与` は現方針では機能付与へ読み替える。 |
| `auth_login` | ログイン・パスワード再設定関連 | ログイン画面 パスワード再設定関連 | 認証前提機能として `feature_catalogs.config_scope='SYSTEM_FIXED'` で保持し、施設単位・ユーザー単位の権限設定対象には含めない。 |
| `facility_select` | 施設選択 | 施設選択画面 | 担当施設の中から作業対象施設を選ぶ機能。 |
| `facility_select_all` | 施設選択（全施設） | 施設選択画面（全施設選択） | 認可機能としては採用しない。施設選択は `user_facility_assignments` で割り当てられた担当施設一覧からの選択に統一する。 |

### 2. 資産閲覧・申請、保守・点検、貸出、修理、棚卸し

| コード | 名称 | クライアント記載 | 備考 |
| --- | --- | --- | --- |
| `original_list_view` | 原本リスト・カード・カルテ閲覧 | 原本リスト / 原本リストカードカルテ画面閲覧 | 原本リスト本体とカード・カルテ閲覧を 1 機能として束ねる。 |
| `original_list_edit` | 原本リストの修正追加 | 原本リストの修正追加 | 原本リストに対する編集系操作。 |
| `original_application` | 各種申請モーダル | 新規更新増設移動廃棄申請モーダル | 各種申請起票の入口。 |
| `daily_inspection` | オフライン準備・日常点検実施 | オフライン準備 日常点検実施 | 点検実施の事前準備を含む。 |
| `lending_checkout` | 貸出可能機器閲覧・貸出返却 | 貸出可能機器閲覧 貸出返却画面 | 貸出と返却の実務画面。 |
| `repair_application` | 修理申請 | 修理申請画面 | 修理申請起票。 |
| `application_status` | 申請ステータス | 申請ステータスモーダル | 申請状況参照。 |
| `inventory_field` | 棚卸し（現場） | 棚卸実施画面（管理部署で絞り込み） | 現場での棚卸し実施。 |
| `inventory_office` | 棚卸し（事務） | 棚卸完了登録 Excel出力 | Excel出力を含むため、将来分割余地あり。 |

### 3. リモデル、通常編集リスト、タスク管理、QR

| コード | 名称 | クライアント記載 | 備考 |
| --- | --- | --- | --- |
| `remodel_edit_list` | 編集リスト（リモデル） | リモデルの編集リスト、申請登録、見積G、各種分析作業などが実施可能 | 範囲が広いため、将来は分割候補。 |
| `remodel_purchase` | リモデル購入管理 | 申請受付～見積登録画面 | リモデル系の申請受付から見積登録まで。 |
| `remodel_order` | 発注登録～資産登録 | 発注登録画面～資産登録 | 発注から資産登録まで。 |
| `remodel_acceptance` | 検収登録 | 検収登録一覧（今は無し）検収登録画面 | 一覧未実装を含む。 |
| `remodel_quotation` | 見積管理（リモデル） | リモデル取得見積 | リモデル系見積参照・管理。 |
| `normal_edit_list` | 編集リスト（通常） | 通常申請の編集リスト、申請登録、見積G、各種分析作業などが実施可能 | 通常系の編集リスト入口。 |
| `normal_purchase` | 通常購入管理 | 申請受付～見積登録画面 | 通常購入系。 |
| `normal_order` | 発注登録～仮資産登録 | 発注登録画面～仮資産登録 | 仮資産登録まで含む。 |
| `normal_acceptance` | 検収登録 | 検収登録一覧（今は無し）検収登録画面 | 通常系検収。 |
| `normal_quotation` | 見積管理（通常） | 通常時取得見積 | 通常系見積参照・管理。 |
| `transfer_disposal` | 移動廃棄管理 | 移動廃棄申請一覧画面 / 廃棄契約管理画面 | 移動と廃棄を 1 機能で扱う。 |
| `repair_management` | 修理管理 | 修理申請一覧画面 / 修理管理画面 | 修理タスク管理系。 |
| `maintenance_contract` | 保守契約管理 | 保守契約一覧画面 / 保守契約管理画面詳細登録契約見直モーダル / 保守対象機器登録モーダル | 実務上は機能範囲が広い。 |
| `inspection_management` | 点検管理 | 点検管理画面 メーカー日程調整結果登録モーダル / 点検メニュー作成 点検予定表出力 / 点検対象機器登録モーダル | 予定表出力は将来分割候補。 |
| `periodic_inspection` | 定期点検実施 | 点検機器一覧（今は無し）定期点検実施モーダル | 現行はモーダル起点。 |
| `lending_management` | 貸出管理 | 貸出管理画面 / 貸出実績エクスポートモーダル / 貸出対象機器登録モーダル | エクスポートは第2フェーズ記載あり。 |
| `qr_issue` | QRコード発行 | QRコード発行 | QR発行画面の利用。 |
| `qr_scan` | QR読取 | QR読取 | QR読取の利用。 |

### 4. データ閲覧（自施設 / 他施設）

| コード | 名称 | クライアント記載 | 備考 |
| --- | --- | --- | --- |
| `own_asset_master_view` | 資産マスタデータ | 資産マスタデータ | 編集権限がある自施設向けの閲覧機能。 |
| `own_user_master` | ユーザーマスタデータ | ユーザーマスタデータ | 自施設のユーザーデータ閲覧。 |
| `own_asset_list` | 資産原本リストデータ | 資産原本リストデータ | 自施設データ閲覧。 |
| `own_estimate` | 見積データ | 見積データ | 自施設の見積データ閲覧。 |
| `own_data_history` | データ履歴一覧 | 申請履歴 電帳法検索（ドキュメント検索） | 自施設の履歴・文書検索。 |
| `other_asset_list` | 資産原本リストデータ（他施設） | 資産原本リストデータ | 閲覧権限がある他施設のデータ閲覧。 |
| `other_estimate` | 見積データ（他施設） | 見積データ | 他施設の見積データ閲覧。 |
| `other_data_history` | データ履歴一覧（他施設） | 申請履歴 電帳法検索（ドキュメント検索） | 他施設の履歴・文書検索。 |

### 5. マスタ管理・個体管理リスト作成

| コード | 名称 | クライアント記載 | 備考 |
| --- | --- | --- | --- |
| `asset_master_list` | 資産マスタ一覧 | 資産マスタ 一覧画面 | 一覧参照。 |
| `facility_master_list` | 施設マスタ一覧 | 施設マスタ 一覧画面 | 一覧参照。 |
| `dept_vendor_master_list` | SHIP部署 / 個別部署 / 業者マスタ一覧 | SHIP部署マスタ / 個別部署マスタ / 業者マスタ 一覧画面 | 現行モックの束ね方を踏襲。 |
| `asset_master_edit` | 資産マスタ編集 | 資産マスタ 編集新規作成モーダル | 編集・新規作成をまとめる。 |
| `facility_master_edit` | 施設マスタ編集 | 施設マスタ 編集新規作成モーダル | 編集・新規作成をまとめる。 |
| `ship_dept_master_edit` | SHIP部署マスタ編集 | SHIP部署マスタ 編集新規作成モーダル | 編集・新規作成をまとめる。 |
| `hospital_dept_master_edit` | 個別部署マスタ編集 | 個別部署マスタ 編集新規作成モーダル | 編集・新規作成をまとめる。 |
| `vendor_master_edit` | 業者マスタ編集 | 業者マスタ 編集新規作成モーダル | 編集・新規作成をまとめる。 |
| `existing_survey` | 現有品調査 | 準備 調査場所入力 現有品調査 履歴 | 現有品調査の実施一式。 |
| `survey_data_edit` | 現調データ修正 | 登録内容修正 資産マスタ選択画面 | 修正系。 |
| `asset_ledger_import` | 資産台帳取込登録 | 資産台帳取込 資産マスタ登録画面 | 台帳取込と登録。 |
| `survey_ledger_matching` | 現調台帳突合せ | データ突合画面 固定資産台帳（未突合） | 突合せ系。 |

## カラムカタログ

| コード | 名称 | クライアント記載 | 適用想定 | 備考 |
| --- | --- | --- | --- | --- |
| `original_price_column` | 原本価格情報カラム | 原本価格情報のカラム項目 | 原本リスト・カード・カルテ系 | 申請起点の原本閲覧文脈。 |
| `own_price_column` | 価格カラム（自施設データ閲覧） | 資産原本中の価格カラム項目 | データ閲覧（自施設） | クライアント整理が分かれているため `original_price_column` とは分離維持する。 |
| `other_price_column` | 価格カラム（他施設データ閲覧） | 資産原本中の価格カラム項目 | データ閲覧（他施設） | 他施設公開ポリシーと組み合わせて判定する前提。 |
| `ship_column` | DataLINK SHIPのみカラム | DataLINKのSHIPのみカラム項目 | 編集リスト（通常） | SHIP固有列の表示制御。 |

## メニュー表示グループ

本節の項目は、クライアント記載にある `メニュー（表示）` をそのままグループ名として整理したものである。  
独立コードは付与せず、配下機能のいずれかが利用可能な場合に表示候補とする。

| グループ名 | 配下機能候補 | 暫定扱い |
| --- | --- | --- |
| 資産閲覧申請 | `original_list_view` / `original_list_edit` / `original_application` / `original_price_column` | 独立コードなし |
| 保守点検／貸出／修理申請／申請ステータス | `daily_inspection` / `lending_checkout` / `repair_application` / `application_status` | 独立コードなし |
| 棚卸し | `inventory_field` / `inventory_office` | 独立コードなし |
| リモデルメニュー | `remodel_edit_list` / `remodel_purchase` / `remodel_order` / `remodel_acceptance` / `remodel_quotation` | 独立コードなし |
| 編集リスト（通常） | `normal_edit_list` / `ship_column` | 独立コードなし |
| タスク管理 | `normal_purchase` / `normal_order` / `normal_acceptance` / `normal_quotation` / `transfer_disposal` / `repair_management` / `maintenance_contract` / `inspection_management` / `periodic_inspection` / `lending_management` | 独立コードなし |
| QRコード発行 | `qr_issue` | 独立コードなし |
| QR読取 | `qr_scan` | 独立コードなし |
| データ閲覧（編集権限がある自施設） | `own_asset_master_view` / `own_user_master` / `own_asset_list` / `own_estimate` / `own_data_history` / `own_price_column` | 独立コードなし |
| データ閲覧（閲覧権限がある他施設） | `other_asset_list` / `other_estimate` / `other_data_history` / `other_price_column` | 独立コードなし |
| マスタ管理 | `asset_master_list` / `facility_master_list` / `dept_vendor_master_list` / `asset_master_edit` / `facility_master_edit` / `ship_dept_master_edit` / `hospital_dept_master_edit` / `vendor_master_edit` | 独立コードなし |
| 個体管理リスト作成 | `existing_survey` / `survey_data_edit` / `asset_ledger_import` / `survey_ledger_matching` | 独立コードなし |

## 既存モックとの差分メモ

- 既存モックの `FeatureId` は、クライアント提示一覧の大半をそのまま再利用できる。
- ただし、既存モックはロール前提で `PermissionLevel` を持っているため、今後は `コード再利用 / 権限制御モデル再設計` の切り分けが必要である。
- `user_management` の説明に残っている `ロール権限付与` は、認可方針変更に合わせて UI 文言・説明文の見直しが必要である。

## Fix 後の扱い

- 権限管理単位の正本は `ロール整理.xlsx` の `権限管理単位一覧` シート A列とする。
- Fix 後の `feature_code` / `column_code` 一覧は `authz-fix-summary.md` を参照する。

## 次の整理候補

- 本カタログを、`施設提供機能`、`ユーザー施設機能`、`他施設公開データ`、`他施設公開カラム` のどこで使うかにマッピングする。
- `機能要件.md` と `db-schema.puml` に反映するためのテーブル案へ落とし込む。
