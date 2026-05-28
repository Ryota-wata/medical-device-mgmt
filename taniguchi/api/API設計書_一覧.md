# API設計書 一覧

最終更新: 2026-05-28

ステータス件数: `Fix 25件` / `作成済み 1件` / `未着手 2件` / `不要 3件`

Phase件数: `Phase1 30件` / `Phase2 1件`

本一覧は、[機能要件.md](../機能要件.md) の画面一覧をもとに、API設計書の作成対象を機能単位で管理するための台帳である。
既存ファイルの羅列ではなく、「どの機能を、どの設計書で管理するか」を正として扱う。

## ステータス定義
- `Fix`: 正本要件ベースで整合確認済み
- `作成済み`: 文書は作成済み。要件整合レビューまたは追加修正余地あり
- `未着手`: 対応するAPI設計書は未作成
- `不要`: 個別API設計書を作成せず、他のAPI設計書または既存APIの組み合わせで扱う

## Phase定義
- `1`: Phase1成果物として作成・管理する対象
- `2`: Phase2で再開または活用する対象

## タスク管理配下業務のAPI設計書作成方針
- タスク管理画面（`/quotation-data-box`）配下の業務機能は、原則として業務機能単位で1つの親API設計書を作成する。
- 各業務機能の親API設計書には、初期表示、一覧、件数、フィルター、詳細モーダル、一覧行の操作ボタン、操作ボタンから遷移するステータス別画面、完了後の戻り先、認証認可、状態遷移、DB更新境界を含める。
- 対象機能外から起票される申請APIは、既に独立設計書がある場合はそちらを正本とする。例: 資産一覧起点の購入/移動/廃棄申請起票はNo.13で扱い、購入管理や移動・廃棄管理では起票後の受付以降を扱う。
- 同一APIを複数業務機能で共通実装する場合でも、各業務機能の親API設計書には、その業務機能からの呼び出し条件、表示条件、権限、ステータス遷移、レスポンス差分を記載する。API本体の正本を共通化する場合は、どの設計書を正本とするかを明示する。
- 見積登録・発注・納品日登録・検収登録・資産登録など、業務機能内のステータス別画面は親API設計書へ内包し、独立した一覧行は設けない。
- 業務画面表示・直URLアクセス・各操作APIはロールではなく実効 `feature_code` で判定する。購入管理は `normal_purchase` / `normal_order` / `normal_acceptance` / `normal_quotation` のいずれか、リモデル管理は `remodel_purchase` / `remodel_order` / `remodel_acceptance` のいずれか、移動・廃棄管理は `transfer_disposal`、修理管理は `repair_management`、保守契約管理は `maintenance_contract`、点検管理は `inspection_management`、貸出管理は `lending_management` を入口機能の既定とし、機能内操作は必要に応じて操作別 `feature_code` を追加判定する。
- 認証認可、マスタ管理、QR発行、資産検索など、業務横断の基盤APIは既存の個別設計書を正本とし、業務機能設計書では呼び出し前提と必要な利用条件だけを記載する。

## 認証/認可・初期選択
| No | Phase | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | 認証／認可 | `Fix/API設計書_認証／認可.docx` | 1. `/login`、2. `/password-reset`、3. `/facility-select`、4. `/main` | `Fix` | 正本要件・DB設計・APIレビュー反映済み。`ロール整理.xlsx` の `権限管理単位一覧` A列粒度へ追従済み。Phase1では `normal_ship_request` / `lending_in_use_used` を `config_scope='FACILITY_USER'` とし、施設提供設定とユーザー施設別設定の両方で判定する。共有システム管理者アカウント（`accountType='SYSTEM_ADMIN'`）では未削除の全施設・全機能・全カラムを利用可能とし、監査ログは共有アカウントの `user_id` として記録する。ログイン後は担当施設数にかかわらず `/facility-select` へ遷移する。`lending_in_use_used` の実効判定は `lending_checkout` も必須 |
| 2 | 1 | 作業対象施設選択 | 個別ファイルなし | 3. `/facility-select` | `不要` | 認証認可API設計書に統合管理。Phase1では `/auth/me` の `assignedFacilities` / `defaultFacilityId` と `/auth/context` を利用して通常業務の作業対象施設を選択する。共有システム管理者アカウントでは `/auth/me` が未削除の全施設を候補として返す |

## ホーム/メニュー
| No | Phase | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| 3 | 1 | ホーム/メニュー | 個別ファイルなし | 4. `/main` | `不要` | ホーム画面専用APIは設けず、認証認可APIの `/auth/me` / `/auth/context` と各業務APIの結果を組み合わせて表示する |
| 4 | 1 | 日常点検 | `Fix/API設計書_日常点検.docx` | 32. `/daily-inspection`、36. `/inspection-prep`、37. `/inspection-result` | `Fix` | メニュー画面から利用できる機能として管理する。日常点検PWAの全量事前ダウンロード、端末内QR解決、未送信同期、No.30 点検管理との責務境界、DB 制約を反映 |
| 5 | 1 | 棚卸し | `Fix/API設計書_棚卸し.docx` | 38. `/inventory` | `Fix` | メニュー画面から利用できる機能として管理する。サーバー側の `inventory_sessions` / `inventory_items` を正本とする施設内共有型へ更新。`inventory` / `inventory_complete`、明細1行単位の即時保存、明細単位の楽観ロック、一括更新時の全体ロールバック、完了時の移動/廃棄申請自動起票、完了/取消と明細更新の交差防止を反映済み |
| 6 | 1 | 修理申請 | `Fix/API設計書_修理申請.docx` | 61. `/repair-request` | `Fix` | メニュー画面から利用できる修理依頼起票機能として、修理管理とは別API設計書で管理する。ログインユーザー情報から申請部署・申請者・申請者連絡先を補完し、登録済み資産/未登録資産の修理依頼を `applications.status='新規申請'` で作成する。未登録資産は資産台帳へ登録せず、修理申請と修理申請経由の廃棄申請のみ対象にする。機器写真/添付は起票時に `application_documents` へ保存する。修理区分 `repair_category` は起票時には未設定とし、修理管理STEP1で設定する。修理申請起票は `repair_request_create`、修理管理タブと修理タスク操作は `repair_management` で認可する |
| 7 | 1 | 貸出・返却 | `Fix/API設計書_貸出・返却.docx` | 39. `/lending-available`、40. `/lending-checkout` | `Fix` | メニュー画面の貸出・返却ボタンから開く貸出メニューモーダル、および同モーダルから利用できる貸出可能機器閲覧、QR/バーコード起点の貸出、返却、使用開始、使用終了を扱う。貸出管理タブとは別API設計書で管理し、貸出可能機器閲覧では No.31 貸出管理で登録された有効な `lending_devices` を貸出グループ別に確認し、貸出実行可能台数は `貸出可` を集計する。貸出対象・貸出グループ・貸出アラート設定は No.31 貸出管理の `lending_devices` 設定を参照する。QR/バーコード解決後の貸出・返却更新は `lending_device_id` を正本IDとする。`lending_checkout` を画面入口・貸出/返却の認可条件とし、`start-use` / `end-use` / 使用済み状態からの `return` は `lending_checkout` と `lending_in_use_used` の両方を必須認可条件として扱う。正本要件・DB設計・APIレビュー反映済み |

## 個体管理リスト作成
| No | Phase | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| 8 | 1 | QR発行・ラベル印刷 | `Fix/API設計書_QR発行・ラベル印刷.docx` | 5. `/qr-issue`、6. `/qr-print` | `Fix` | QR発行から印刷までを `qr_issue` 1単位で扱う方針で確定。テンプレート一覧はフロントエンド資材、プリンタ候補はテプラ連携/ローカル印刷モジュールで扱い、マスタAPIは設けない。要件・DB設計・最新認証認可レビュー反映済み。 |
| 9 | 1 | 現有品調査 | `Fix/API設計書_現有品調査.docx` | 7. `/offline-prep`、11. `/registration-edit` | `Fix` | API対象は `/offline-prep` と `/registration-edit`。`/survey-location` / `/asset-survey` / `/history` はPWAのフロント実装として扱い、正本要件・DB設計・最新認証認可レビュー反映済み。 |
| 10 | 1 | 資産台帳取込・マスタ突き合わせ | `Fix/API設計書_資産台帳取込.docx` | 12. `/asset-import`、13. `/asset-matching` | `Fix` | 正本要件・DB設計・最新認証認可レビュー反映済み |
| 11 | 1 | データ突合 | `Fix/API設計書_データ突合.docx` | 14. `/data-matching`、33. `/data-matching/ledger`、34. `/data-matching/me-ledger` | `Fix` | `lock_version` による更新競合検知と一覧 snapshot 固定、`created_asset_ledger_id` / `assetLedgerId` による原本確定後の追跡、`CONFIRM_ORIGINAL` 時の QR 紐付けと現有品調査写真引継ぎの同一トランザクション化、分類マスタの `is_active` 整合修正まで反映済み |

## 資産一覧・資産詳細
| No | Phase | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| 12 | 1 | 資産一覧・資産詳細 | `Fix/API設計書_資産一覧・資産詳細.docx` | 15. `/asset-search-result`、16. `/asset-detail` | `Fix` | 管理部署編集の独立 `feature_code`、bookmark 永続化、管理部署正本、QR直接遷移解決、履歴API、classificationMode、cursor pagination を反映済み。申請API本体は資産申請起票で扱う |
| 13 | 1 | 資産申請起票 | `Fix/API設計書_資産申請起票.docx` | 15. `/asset-search-result`（新規購入/増設購入/更新購入/移動/廃棄申請モーダル） | `Fix` | 資産一覧起点の新規購入・増設購入・更新購入・移動・廃棄申請の起票APIを扱う。選択資産引継ぎ、入力検証、添付、`applications` / `application_assets` / 申請種別別詳細 / `application_documents` / 初期ステータス履歴を同一トランザクションで作成する。更新購入後の廃棄/移動/継続利用、関連移動/廃棄申請の追跡、廃棄理由コード未指定時の `OTHER` 保存方針を反映済み |

## マスタ管理
| No | Phase | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| 14 | 1 | SHIP資産マスタ | `Fix/API設計書_SHIP資産マスタ.docx` | 17. `/ship-asset-master`、30. `/asset-master` | `Fix` | 資産マスタ選択ポップアップ含む。添付文書の安定表示、インポート必須列の明確化、資産マスタIDの `ship_asset_master_id` 統一まで反映済み |
| 15 | 1 | SHIP施設マスタ | `Fix/API設計書_SHIP施設マスタ.docx` | 18. `/ship-facility-master` | `Fix` | 施設基本情報（都道府県、設立母体、施設コード、施設名、病床数）の管理に限定する。施設提供機能・提供カラム設定はNo.16 権限管理、施設グループと他施設向け公開設定はNo.17 施設グループ管理で扱う |
| 16 | 1 | 権限管理 | `Fix/API設計書_権限管理.docx` | 64. `/permission-management` | `Fix` | メイン画面のマスタ管理モーダルから遷移する独立画面。施設単位の提供機能・提供カラム設定、設定コピー、`lending_checkout` と `lending_in_use_used` の組み合わせ検証、未返却の使用中/使用済データが残る状態での OFF 拒否を扱う |
| 17 | 1 | 施設グループ管理 | `Fix/API設計書_施設グループ管理.docx` | 66. `/facility-group-management` | `Fix` | メイン画面のマスタ管理モーダルから遷移する独立画面。`facility_collaboration_groups` / `facility_collaboration_group_facilities` による施設グルーピング、共有データ種別、`facility_external_view_settings` / `facility_external_column_settings` による他施設向け公開設定を扱う |
| 18 | 1 | 個別部署マスタ | `Fix/API設計書_個別部署マスタ.docx` | 19. `/hospital-facility-master` | `Fix` | 正本要件・DB設計・最新認証認可レビュー反映済み |
| 19 | 1 | SHIP部署マスタ | `Fix/API設計書_SHIP部署マスタ.docx` | 20. `/ship-department-master` | `Fix` | 正本要件・DB設計・最新認証認可レビュー反映済み |
| 20 | 1 | ユーザー管理 | `Fix/API設計書_ユーザー管理.docx` | 21. `/user-management` | `Fix` | 正本要件・DB設計・最新認証認可レビュー反映済み。Phase1のユーザー別機能設定候補は `config_scope='FACILITY_USER'` のみに限定し、`normal_ship_request` / `lending_in_use_used` も候補に含める。ユーザー側でも `lending_checkout` OFF 時の `lending_in_use_used` ON を拒否する |
| 21 | 1 | 業者マスタ | `Fix/API設計書_業者マスタ.docx` | 63. `/vendor-master` | `Fix` | 正本要件・DB設計・最新認証認可レビュー反映済み |

## タスク管理
| No | Phase | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| 22 | 1 | タスク管理トップ | 個別ファイルなし | 23. `/quotation-data-box` | `不要` | 既定業務画面へのリダイレクトのみ。業務APIは各業務機能側の設計書で管理する |
| 23 | 1 | 編集リスト | 未作成 | 22. `/remodel-application` | `未着手` | 通常購入/リモデルの双方で使う編集リスト本体の独立設計書。作成・選択モーダルは通常編集リスト（`list_type='PURCHASE'`）とリモデル編集リスト（`list_type='REMODEL'`）で分離し、作成後の種別切替は行わない。編集リスト一覧・作成・削除（RFQ/申請/見積/履歴は保持）、作業ロック取得/heartbeat/解除、明細取得、セル編集、一括編集、Data Link、見積DB Link、フリーカラム、表示カラム設定/ブックマーク、行順変更、行削除、廃棄/移動申請作成（`REMODEL`限定）、編集リスト起点RFQグループ作成（グループ名必須、RFQ No.はサーバー採番）を扱う。`API連携` ボタンはPhase1では開発中の将来導線として扱い、No.23では新規エンドポイントを定義しない。資産詳細参照はNo.12 `/asset-detail` 系APIを利用し、No.23では重複定義しない。明細ソースは `BASE_ASSET` / `APPLICATION` / `MANUAL` / `QUOTATION` を区分し、インライン新規要望は申請正本を作成して即 `編集中` へ取り込み、更新/増設の派生行は `MANUAL` とする。品目/メーカー/型式編集時はSHIP資産マスタを再解決し、一意に決まる場合だけ `ship_asset_master_id` を更新する。見積DB Linkは画面上のRFQ No./フェーズではなく `rfq_id` / `quotation_id` / `quotation_item_id` / `edit_list_item_id` を正本キーにし、候補と適用を `editListId` 配下の有効RFQへスコープする。廃棄/移動申請は `rfq_applications` に申請明細と編集リスト明細を両方保持し、同一明細・同一ワークフローの有効リンク重複を拒否する。廃棄表示番号は `DISP-yyyyMMdd-nnnn`、移動/移設表示番号は `TRAN-yyyyMMdd-nnnn` を `rfqs.rfq_no` としてサーバー採番する。リモデル編集リスト起点の移設申請は作成時点の移設先未入力を許容し、クローズ前に新設置場所を必須検証する。業者Master Data Link はRFQ未作成時の業者候補として `edit_list_items.vendor_id` / `vendor_name` に保持し、`rfq_vendors` はRFQ作成後の責務とする。認可は `normal_edit_list` / `remodel_edit_list` を基本とし、RFQ作成・廃棄/移動申請作成・SHIP任意カラムでは関連権限を追加判定する。画面上の `asset.no` や `90000 + index` は仮番号とし、API/DB正本キーは `edit_list_item_id` とする |
| 24 | 1 | リモデル管理 | 未作成 | 55. `/quotation-data-box/remodel-management`、55a. `/quotation-data-box/remodel-dashboard`、60. `/quotation-data-box/rfq-process`、24. `/quotation-data-box/ocr-confirm`、44. `/quotation-data-box/category-registration`、47. `/quotation-data-box/item-ai-matching`、50. `/quotation-data-box/price-allocation`、54. `/quotation-data-box/registration-confirm`、25. `/quotation-data-box/order-registration`、26. `/quotation-data-box/inspection-registration`、27. `/quotation-data-box/asset-provisional-registration`、27a. `/quotation-data-box/asset-registration` | `未着手` | リモデル管理のAPI設計書。編集リストで作成されたリモデルRFQ、廃棄/移動承認ワークフロー、リモデル管理の見積（発注）グループ一覧、リモデルダッシュボード、RFQプロセス、見積登録/発注見積登録、発注登録、納品日登録、検収登録、資産登録、リモデルクローズと原本反映までを内包する。リモデルダッシュボードとクローズはRFQ単位ではなく `editListId` 単位で扱い、クローズ時は個別部署マスタの新居→現状反映も同一トランザクションで行う。編集リスト本体操作、Data Link、見積DB Link、フリーカラム、行順変更、行削除、通常購入RFQグループ作成はNo.23で扱う。購入管理の申請受付一覧から行う購入申請取り込みと、作成済み通常購入RFQの一覧・後続進行は購入管理で扱う。リモデル管理の行は `management_type='REMODEL'` とし、通常見積は `workflow_type='RFQ'`、廃棄は `workflow_type='DISPOSAL'`、移動は `workflow_type='TRANSFER'` で区分する。`quotation_type` / `quotation_phase` は一覧絞り込み項目だが、編集リスト起点RFQ作成モーダル上の入力元または既定値はクライアント確認待ちとし、暫定では未指定を許容する。選択肢は `quotation_type` が PURCHASE=購入、LEASE=リース、INSTALLMENT=割賦、RENTAL=レンタル、TRIAL=試用、BORROW=借用、REPAIR=修理、MAINTENANCE=保守、INSPECTION=点検、OTHER=その他、`quotation_phase` が LIST_PRICE=定価/定価見積、ESTIMATE=概算/概算見積、ORDER_REGISTRATION=発注登録用見積、FINAL_ASSET_REGISTRATION=最終原本登録用。RFQプロセスの `SHIPへ一括依頼` は業者への見積依頼一括送信であり、No.26のSHIP代理作業依頼は作成しない。承認者割当、多段階承認、通知、差戻し有無はクライアント確認待ちで、現時点では単純な承認/却下/完了アクションを暫定範囲とする。リモデル管理からのSHIP依頼と `remodel_ship_request` は別設計書「SHIP代理作業依頼」で扱う。共通画面へ遷移するAPIは `rfqGroupId`、`quotationId`/`draftId`、`managementType='REMODEL'`、`returnTo` を保持する |
| 25 | 1 | 購入管理 | `Fix/API設計書_購入管理.docx` | 51. `/quotation-data-box/purchase-management`、60. `/quotation-data-box/rfq-process`、24. `/quotation-data-box/ocr-confirm`、44. `/quotation-data-box/category-registration`、47. `/quotation-data-box/item-ai-matching`、50. `/quotation-data-box/price-allocation`、54. `/quotation-data-box/registration-confirm`、59. `/quotation-processing`、29. `/quotation-management`、25. `/quotation-data-box/order-registration`、26. `/quotation-data-box/inspection-registration`、27. `/quotation-data-box/asset-provisional-registration`、27a. `/quotation-data-box/asset-registration` | `Fix` | 購入管理のAPI設計書。資産一覧起点の購入申請起票はNo.13に残し、起票済み購入申請の受付一覧・詳細・却下、購入管理起点の通常編集リスト（`list_type='PURCHASE'`）候補取得、編集リスト新規作成と購入申請取り込み、既存編集リストへの購入申請取り込み、作成済み通常購入RFQの見積（発注）グループ一覧・削除・後続進行、RFQプロセス、見積登録/見積管理、発注登録、納品日登録、検収登録、資産登録までを内包する。編集リスト本体の汎用編集、行編集、Data Link、見積DB Link、行削除、行順変更、フリーカラム、編集リスト画面で選択行から実行する通常購入RFQ作成はNo.23で扱う。見積登録・見積管理、発注・検収・資産仮登録は購入管理内の機能として扱い、個別の一覧行は設けない。RFQプロセスの `SHIPへ一括依頼` は業者への見積依頼一括送信として扱い、未送信の `rfq_vendors` を `SENT` に更新してRFQステータスを `見積依頼済` へ進める。ボタン表示権限は `normal_ship_request` で判定する。SHIP代理作業依頼の作成API、SHIP依頼一覧、担当取得、差戻し、完了、取消は別設計書「SHIP代理作業依頼」で扱う。RFQ正本は `rfqs` 1件 + `rfq_vendors` 複数件とし、APIレスポンスで業者行へ展開する。購入管理対象RFQは `management_type='PURCHASE'` でリモデル管理と分離する。共通画面へ遷移するAPIは `managementType='PURCHASE'` と `returnTo` を保持し、OCR実行/APIは対象外。正本要件・DB設計・APIレビュー反映済み |
| 26 | 2 | SHIP代理作業依頼 | `feature/API設計書_SHIP代理作業依頼.docx` | 23a. `/quotation-data-box/ship-proxy-requests`、60. `/quotation-data-box/rfq-process` | `作成済み` | Phase1のFix成果物から除外し、Phase2対象として管理する。作成済み設計書はSHIP代理作業依頼の作成・一覧・詳細・担当取得・差戻し・完了・取消APIを扱う。RFQプロセスの `SHIPへ一括依頼` はNo.24/25の業者向け見積依頼一括送信であり、本設計書のSHIP代理作業依頼とは別責務とする。依頼作成API本体、施設選択画面の `SHIP依頼一覧へ`、ユーザー管理の `ship_proxy_task` 設定、リモデル管理の `remodel_ship_request` はPhase2で再整理する |
| 27 | 1 | 移動・廃棄管理 | `Fix/API設計書_移動・廃棄管理.docx` | 35. `/disposal-task`、45. `/quotation-data-box/disposal-management`、58. `/quotation-data-box/transfer-management` | `Fix` | 移動・廃棄管理のAPI設計書。資産一覧起点の移動/廃棄申請起票はNo.13に残し、起票済み移動申請の受付・承認・原本反映、廃棄申請の受付、見積依頼、見積登録、発注登録、作業日/納期登録、完了登録、旧廃棄管理URLからの正規化を1本で扱う。未登録資産の廃棄申請は修理申請経由で作成されたもののみ後続管理対象とし、単独廃棄申請の入口UI/APIは設けない。現行モックに旧廃棄URLの実画面がない場合も互換導線として扱い、業務API本体は統合管理で扱う。一覧表示ラベルと保存ステータスを分離し、`見積登録済=発注用見積登録済`、`作業日確定=納期確定`、`申請を見送る=申請見送り` として扱う。廃棄発注時の院内決済No.は `orders.settlement_no` に保存し、正本要件・DB設計・APIレビュー反映済み |
| 28 | 1 | 修理管理 | `Fix/API設計書_修理管理.docx` | 57. `/quotation-data-box/repair-requests`、62. `/repair-task` | `Fix` | 修理管理の申請受付一覧、院内/外部依頼振り分け、修理タスク進行、見積依頼、見積依頼完了、見積登録、発注前の見積削除、発注前の修理タスク削除、発注、納期・検収、完了/資産登録、廃棄申請への接続を扱う。メニュー起点の修理申請起票（`/repair-request`、`repair_request_create`）はNo.6 修理申請へ切り出し、本設計書では起票済み修理申請の受付以降を扱う。修理管理タブと修理タスク操作は `repair_management` で認可する。修理管理API設計書では `/repair-request` 系APIを定義せず、No.6 修理申請API設計書の `POST /repair-request/requests` を起票正本として参照する。保存ステータスは `REPAIR=新規申請/見積依頼済/見積登録済/発注済/納期確定/検収登録/完了/却下` を正本とし、一覧表示上の `発注登録済` は `発注済`、`作業日確定` は `納期確定` に対応させる。修理区分は `IN_HOUSE` / `OUTSOURCED` を保存正本とし、修理不能から廃棄申請へ接続する場合は登録済み資産・未登録資産の両方を対象として `disposal_application_details.related_repair_application_id` に元修理申請IDを保持する。未登録資産の場合も資産台帳へは登録せず、修理申請内の手入力情報と申請明細スナップショットを廃棄対象物品情報として引き継ぐ。ユーザー表記の「修正管理」は現行資料上の修理管理として扱う |
| 29 | 1 | 保守契約管理 | `Fix/API設計書_保守契約管理.docx` | 15. `/asset-search-result`（保守契約登録導線）、41. `/maintenance-quote-registration`、49. `/quotation-data-box/maintenance-contracts` | `Fix` | 保守契約管理のAPI設計書。資産一覧または保守契約管理タブからの保守契約作成、保守契約一覧、契約グループ詳細、見積依頼、申請見送り、見積登録、契約登録、保守登録、契約内容見直し、契約更新、点検管理連携までを1本で扱う。保守契約は `applications` ではなく `maintenance_contracts` / `maintenance_contract_assets` を正本とし、見積依頼は `rfqs.management_type='MAINTENANCE'` と `rfq_vendors` で扱う。保守契約ステータスは `見積依頼 / 見積依頼済 / 見積登録済 / 完了 / 申請見送り` を正本とし、画面の `currentStep` は表示値として算出する。タスク管理側の一覧は進行中契約と、`完了` かつ契約終了日を過ぎていない契約中データを表示し、`申請見送り` と契約終了後の過去契約は既定一覧から除外する。契約終了後の過去契約は `期限切れも表示` 指定時だけ一覧へ含める。完了レコードの詳細モーダルは閲覧専用とし、契約更新は契約グループ名・契約種別を新規入力したうえで、部署情報・商品情報・対象資産だけを複製した後継の保守契約グループを作成して `見積依頼` から開始する。契約内容見直しは完了かつ契約中のレコードに対して既存資産の除外と新規資産追加の両方を扱い、契約ステータスは `完了` のまま、見直し後金額・理由・追加/除外資産・契約変更ドキュメントを履歴保持する。契約グループ詳細の資産別点検設定は `maintenance_contract_assets` に保持し、保守登録時に同一契約由来の `inspection_tasks` へ展開する。正本要件・DB設計・APIレビュー反映済み |
| 30 | 1 | 点検管理 | `Fix/API設計書_点検管理.docx` | 32a. `/periodic-inspection`、42. `/maker-maintenance-result`、46. `/quotation-data-box/inspection-requests` | `Fix` | 点検管理のAPI設計書。定期点検タスク一覧、日常点検設定行一覧、点検メニュー登録、資産一覧画面の選択資産から起動する点検管理登録、日常点検設定変更・設定解除、日程調整、スキップ、定期点検実施、メーカー保守結果登録、点検予定表出力までを1本で扱う。点検管理登録では対象資産の大分類・中分類・品目まで一致するメニューのみ適用でき、同分類の全資産へ自動展開しない。定期点検は1資産に複数メニューを登録可能とし、同一資産・同一定期点検メニューの有効行重複を禁止する。日常点検は `inspection_type='日常点検'` の1資産1有効行として保持し、使用前/使用中/使用後メニューを変更・一部解除できる。点検ステータスは定期点検系のみ `点検月超過 / 点検週 / 点検月 / 点検1ヶ月前 / 点検Nヶ月前 / 点検日調整 / 点検実施中 / 点検完了 / 再点検` を正本とし、日常点検行はステータス、点検周期、前回点検日、次回点検予定を `NULL` / 画面 `-` 表示とする。定期点検開始時はQR照合成功または実施開始APIで `START_INSPECTION` を実行し、`inspection_tasks.status='点検実施中'` へ更新する。一覧のPhase1絞り込みは点検日区分、点検種別、点検グループ名、貸出状況を正本とし、Category/大分類/中分類/品目は必須条件にしない。点検種別の表示ラベル `院内点検` / `メーカー点検` / `スポット点検` / `日常点検` は保存値 `院内定期点検` / `メーカー保守` / `院内スポット点検` / `日常点検` へ変換する。日常点検のオフライン準備とQR起点の日常点検実施はNo.4を正本とし、日常点検設定行はNo.4のPWAパッケージ取得で端末へ配信する |
| 31 | 1 | 貸出管理 | `Fix/API設計書_貸出管理.docx` | 15. `/asset-search-result`（貸出登録モーダル）、48. `/quotation-data-box/lending-management` | `Fix` | 貸出管理タブのAPI設計書。資産一覧で選択した資産を貸出管理対象へ登録する貸出機器登録モーダル、貸出管理対象機器の一覧、貸出設定変更、貸出機解除、日常点検日・定期点検予定・貸出回数累計・返却超過状態の表示を扱う。貸出機器ステータスは `貸出可 / 貸出中 / 使用中 / 使用済 / 返却済 / 使用不可` を正本とし、登録直後は `貸出可` とする。`返却済` は使用後日常点検メニューがある場合の点検待ち状態で、使用後日常点検がない場合は返却時に `貸出可` へ直接戻す。貸出可能台数は `貸出可` のみを集計する。貸出グループ名、貸出種別名、返却アラート発生日数は `lending_devices` の永続項目として扱い、No.7 貸出・返却の貸出可能機器閲覧・貸出返却処理から同じ値を参照する。貸出機解除は履歴を残す論理解除とし、未返却中または使用後日常点検待ちの機器は解除不可とする。正本要件・DB設計・APIレビュー反映済み |

## No.23 編集リスト補足
- No.23本体作成時は、エンドポイント別にリクエスト/レスポンス、`lock_token` 必須範囲、エラー、更新境界を明文化する。
- チェックボックス選択状態はクライアント内の一時状態とし、実行APIは `editListItemIds[]` を受け取る。
- 編集リスト固定58列の画面表示・編集値は `edit_list_items` の作業スナップショットとし、通常セル編集、Data Link、見積DB Link適用では原本を直接更新しない。
- 画面全体の保存APIは設けず、セル編集、一括編集、Data Link適用、見積DB Link適用、フリーカラム、行順変更、行削除、インライン登録の各APIを保存単位とする。
- 検索、ソート、列内フィルター、列順、列幅は画面内一時状態とし、表示/非表示とブックマークだけを `user_column_settings` 系APIで保存する。
- `更新` 方針では元行を廃棄予定へ変更して更新行を作成し、`増設` 方針では1〜99件の増設行を作成する。インライン新規要望の申請番号はサーバー採番とする。
- `MANUAL` / `QUOTATION` の生成行は、QRコード、固定資産番号、管理機器番号、シリアル番号などの個体識別子を元行から引き継がない。
- 通常Data Linkは対象 `editListItemIds[]`、データソース、照合キー、転記カラムを受け取り、プレビュー/適用の結果件数を返す。
- 資産Master Data Linkで固定列を持たないSHIP資産マスタ項目は `edit_list_item_custom_values` へ `ship_asset_custom:{column_key}` 形式で保存し、未対応転記先キーは拒否する。
- RFQ作成は `rfqGroupName` と `editListItemIds[]` を受け取り、`management_type` は `edit_lists.list_type` から確定する。リモデルRFQでは購入系行だけを対象とし、廃棄予定、移設、方針未設定、申請済み行は行単位でスキップする。レスポンスは `created`、`skipped[]`、`rfq_id`、`rfqGroupId`、`rfq_no`、`managementType`、`returnTo`、リモデル文脈の `editListId` を返す。RFQ No.は作成確定時だけ採番し、キャンセル/閉じるでは予約しない。
- 廃棄・移設申請はUIの一括操作に合わせ、`created[]` / `skipped[]` の行単位レスポンスを返す。廃棄/移設の `rfq_group_name` はサーバー側で既定生成する。
- 見積DB Linkは行選択状態に依存せず、`editListId` 配下のRFQ/見積フェーズを選んで候補を取得する。適用時は対象カラムを一括転記し、既存行リンク更新に加え、未紐付け見積明細を `source_type='QUOTATION'` の編集リスト明細として追加できる。見積番号とRFQグループ名は別項目として保持する。
- `API連携` と `Excel/PDF出力` は現行モック上アラート/ブラウザ機能であり、No.23 Phase1では新規APIを定義しない。

## No.24/25 共通ステータス補足
- 現行モック実装に残るステータス更新の揺れはAPI正本に採用しない。見積登録確定は `見積DB登録済` または `発注見積登録済`、発注登録は `発注済`、納品日登録は `納期確定`、検収登録完了は `検収済`、資産登録完了は `完了` とする。
- 通常購入RFQグループ削除は、画面上の削除ボタン表示にかかわらず発注済到達前まで可能とし、`rfqs.deleted_at` と関連見積データの論理削除で扱う。編集リスト本体・明細は削除しない。

## 更新ルール
- 新規作成時は、対象機能が属するプロセスへ追記する
- 画面単位ではなく、API設計書として管理する機能単位で記載する
- `対応する設計書` は、原則として正本ファイル名を1つだけ記載する
- 複数画面を1つのAPI設計書で扱う場合は、`対象画面` 列へ列挙する
- タスク管理画面配下の業務は業務機能単位の親設計書を優先し、その業務機能の一覧から遷移するステータス別画面/APIを親設計書へ内包する
- 内容レビュー完了時は `Fix` に更新する
