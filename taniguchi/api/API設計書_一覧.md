# API設計書 一覧

最終更新: 2026-05-18

ステータス件数: `Fix 18件` / `作成済み 2件` / `未着手 6件` / `不要 3件`

Phase件数: `Phase1 28件` / `Phase2 1件`

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
- 対象機能外から起票される申請APIは、既に独立設計書がある場合はそちらを正本とする。例: 資産一覧起点の購入/移動/廃棄申請起票はNo.10で扱い、購入管理や移動・廃棄管理では起票後の受付以降を扱う。
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
| 4 | 1 | 日常点検 | `Fix/API設計書_日常点検.docx` | 32. `/daily-inspection`、36. `/inspection-prep`、37. `/inspection-result` | `Fix` | メニュー画面から利用できる機能として管理する。日常点検PWAの全量事前ダウンロード、端末内QR解決、未送信同期、No.28 点検管理との責務境界、DB 制約を反映 |

## 個体管理リスト作成
| No | Phase | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| 5 | 1 | QR発行・ラベル印刷 | `Fix/API設計書_QR発行・ラベル印刷.docx` | 5. `/qr-issue`、6. `/qr-print` | `Fix` | QR発行から印刷までを `qr_issue` 1単位で扱う方針で確定。テンプレート一覧はフロントエンド資材、プリンタ候補はテプラ連携/ローカル印刷モジュールで扱い、マスタAPIは設けない。要件・DB設計・最新認証認可レビュー反映済み。 |
| 6 | 1 | 現有品調査 | `Fix/API設計書_現有品調査.docx` | 7. `/offline-prep`、11. `/registration-edit` | `Fix` | API対象は `/offline-prep` と `/registration-edit`。`/survey-location` / `/asset-survey` / `/history` はPWAのフロント実装として扱い、正本要件・DB設計・最新認証認可レビュー反映済み。 |
| 7 | 1 | 資産台帳取込・マスタ突き合わせ | `Fix/API設計書_資産台帳取込.docx` | 12. `/asset-import`、13. `/asset-matching` | `Fix` | 正本要件・DB設計・最新認証認可レビュー反映済み |
| 8 | 1 | データ突合 | `Fix/API設計書_データ突合.docx` | 14. `/data-matching`、33. `/data-matching/ledger`、34. `/data-matching/me-ledger` | `Fix` | `lock_version` による更新競合検知と一覧 snapshot 固定、`created_asset_ledger_id` / `assetLedgerId` による原本確定後の追跡、`CONFIRM_ORIGINAL` 時の QR 紐付けと現有品調査写真引継ぎの同一トランザクション化、分類マスタの `is_active` 整合修正まで反映済み |

## 資産一覧・資産詳細
| No | Phase | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| 9 | 1 | 資産一覧・資産詳細 | `Fix/API設計書_資産一覧・資産詳細.docx` | 15. `/asset-search-result`、16. `/asset-detail` | `Fix` | 管理部署編集の独立 `feature_code`、bookmark 永続化、管理部署正本、QR直接遷移解決、履歴API、classificationMode、cursor pagination を反映済み。申請API本体は資産申請起票で扱う |
| 10 | 1 | 資産申請起票 | `Fix/API設計書_資産申請起票.docx` | 15. `/asset-search-result`（新規購入/増設購入/更新購入/移動/廃棄申請モーダル） | `Fix` | 資産一覧起点の新規購入・増設購入・更新購入・移動・廃棄申請の起票APIを扱う。選択資産引継ぎ、入力検証、添付、`applications` / `application_assets` / 申請種別別詳細 / `application_documents` / 初期ステータス履歴を同一トランザクションで作成する。更新購入後の廃棄/移動/継続利用、関連移動/廃棄申請の追跡、廃棄理由コード未指定時の `OTHER` 保存方針を反映済み |
| 11 | 1 | 棚卸し | `Fix/API設計書_棚卸し.docx` | 38. `/inventory` | `Fix` | サーバー側の `inventory_sessions` / `inventory_items` を正本とする施設内共有型へ更新。`inventory` / `inventory_complete`、明細1行単位の即時保存、明細単位の楽観ロック、一括更新時の全体ロールバック、完了時の移動/廃棄申請自動起票、完了/取消と明細更新の交差防止を反映済み |

## マスタ管理
| No | Phase | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| 12 | 1 | SHIP資産マスタ | `Fix/API設計書_SHIP資産マスタ.docx` | 17. `/ship-asset-master`、30. `/asset-master` | `Fix` | 資産マスタ選択ポップアップ含む。添付文書の安定表示、インポート必須列の明確化、資産マスタIDの `ship_asset_master_id` 統一まで反映済み |
| 13 | 1 | SHIP施設マスタ | `Fix/API設計書_SHIP施設マスタ.docx` | 18. `/ship-facility-master` | `Fix` | 施設基本情報（都道府県、設立母体、施設コード、施設名、病床数）の管理に限定する。施設提供機能・提供カラム設定はNo.14 権限管理、施設グループと他施設向け公開設定はNo.15 施設グループ管理で扱う |
| 14 | 1 | 権限管理 | `Fix/API設計書_権限管理.docx` | 64. `/permission-management` | `Fix` | メイン画面のマスタ管理モーダルから遷移する独立画面。施設単位の提供機能・提供カラム設定、設定コピー、`lending_checkout` と `lending_in_use_used` の組み合わせ検証、未返却の使用中/使用済データが残る状態での OFF 拒否を扱う |
| 15 | 1 | 施設グループ管理 | `Fix/API設計書_施設グループ管理.docx` | 66. `/facility-group-management` | `Fix` | メイン画面のマスタ管理モーダルから遷移する独立画面。`facility_collaboration_groups` / `facility_collaboration_group_facilities` による施設グルーピング、共有データ種別、`facility_external_view_settings` / `facility_external_column_settings` による他施設向け公開設定を扱う |
| 16 | 1 | 個別部署マスタ | `Fix/API設計書_個別部署マスタ.docx` | 19. `/hospital-facility-master` | `Fix` | 正本要件・DB設計・最新認証認可レビュー反映済み |
| 17 | 1 | SHIP部署マスタ | `Fix/API設計書_SHIP部署マスタ.docx` | 20. `/ship-department-master` | `Fix` | 正本要件・DB設計・最新認証認可レビュー反映済み |
| 18 | 1 | ユーザー管理 | `Fix/API設計書_ユーザー管理.docx` | 21. `/user-management` | `Fix` | 正本要件・DB設計・最新認証認可レビュー反映済み。Phase1のユーザー別機能設定候補は `config_scope='FACILITY_USER'` のみに限定し、`normal_ship_request` / `lending_in_use_used` も候補に含める。ユーザー側でも `lending_checkout` OFF 時の `lending_in_use_used` ON を拒否する |
| 19 | 1 | 業者マスタ | `Fix/API設計書_業者マスタ.docx` | 63. `/vendor-master` | `Fix` | 正本要件・DB設計・最新認証認可レビュー反映済み |

## タスク管理
| No | Phase | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| 20 | 1 | タスク管理トップ | 個別ファイルなし | 23. `/quotation-data-box` | `不要` | 既定業務画面へのリダイレクトのみ。業務APIは各業務機能側の設計書で管理する |
| 21 | 1 | 編集リスト | 未作成 | 22. `/remodel-application` | `未着手` | 通常購入/リモデルの双方で使う編集リスト本体の独立設計書。作成・選択モーダルは通常編集リスト（`list_type='PURCHASE'`）とリモデル編集リスト（`list_type='REMODEL'`）で分離し、作成後の種別切替は行わない。編集リスト一覧・作成・削除（RFQ/申請/見積/履歴は保持）、作業ロック取得/heartbeat/解除、明細取得、セル編集、一括編集、Data Link、見積DB Link、フリーカラム、行順変更、行削除、廃棄/移動申請作成、編集リスト起点RFQグループ作成を扱う。画面上の `asset.no` や `90000 + index` は仮番号とし、API/DB正本キーは `edit_list_item_id` とする |
| 22 | 1 | リモデル管理 | 未作成 | 55. `/quotation-data-box/remodel-management`、55a. `/quotation-data-box/remodel-dashboard`、60. `/quotation-data-box/rfq-process`、24. `/quotation-data-box/ocr-confirm`、44. `/quotation-data-box/category-registration`、47. `/quotation-data-box/item-ai-matching`、50. `/quotation-data-box/price-allocation`、54. `/quotation-data-box/registration-confirm`、25. `/quotation-data-box/order-registration`、26. `/quotation-data-box/inspection-registration`、27. `/quotation-data-box/asset-provisional-registration`、27a. `/quotation-data-box/asset-registration` | `未着手` | リモデル管理のAPI設計書。編集リストで作成されたリモデルRFQ、廃棄/移動承認ワークフロー、リモデル管理の見積（発注）グループ一覧、リモデルダッシュボード、RFQプロセス、見積登録/発注見積登録、発注登録、納品日登録、検収登録、資産登録、リモデルクローズと原本反映までを内包する。編集リスト本体操作、Data Link、見積DB Link、フリーカラム、行順変更、行削除はNo.21で扱う。購入管理の申請受付一覧から行う購入申請取り込み、通常購入RFQグループ作成導線は購入管理に内包する。リモデル管理の行は `management_type='REMODEL'` とし、通常見積は `workflow_type='RFQ'`、廃棄は `workflow_type='DISPOSAL'`、移動は `workflow_type='TRANSFER'` で区分する。リモデル管理からのSHIP依頼と `remodel_ship_request` はPhase2対象としてSHIP代理作業依頼で扱う。共通画面へ遷移するAPIは `rfqGroupId`、`quotationId`/`draftId`、`managementType='REMODEL'`、`returnTo` を保持する |
| 23 | 1 | 購入管理 | `作成済み/API設計書_購入管理.docx` | 51. `/quotation-data-box/purchase-management`、60. `/quotation-data-box/rfq-process`、24. `/quotation-data-box/ocr-confirm`、44. `/quotation-data-box/category-registration`、47. `/quotation-data-box/item-ai-matching`、50. `/quotation-data-box/price-allocation`、54. `/quotation-data-box/registration-confirm`、59. `/quotation-processing`、29. `/quotation-management`、25. `/quotation-data-box/order-registration`、26. `/quotation-data-box/inspection-registration`、27. `/quotation-data-box/asset-provisional-registration`、27a. `/quotation-data-box/asset-registration` | `作成済み` | 購入管理のAPI設計書。資産一覧起点の購入申請起票はNo.10に残し、起票済み購入申請の受付一覧・詳細・却下、購入管理起点の通常編集リスト（`list_type='PURCHASE'`）候補取得、編集リスト新規作成と購入申請取り込み、既存編集リストへの購入申請取り込み、通常購入RFQグループ作成、見積（発注）グループ一覧、RFQプロセス、見積登録/見積管理、発注登録、納品日登録、検収登録、資産登録までを内包する。編集リスト本体の汎用編集、行編集、Data Link、見積DB Link、行削除、行順変更、フリーカラムはNo.21で扱う。見積登録・見積管理、発注・検収・資産仮登録は購入管理内の機能として扱い、個別の一覧行は設けない。Phase1で残すSHIP関連は購入管理/RFQプロセスの `SHIPへ依頼` ボタン表示までとし、ボタン表示権限は `normal_ship_request` で判定する。SHIP代理作業依頼の作成API、SHIP依頼一覧、担当取得、差戻し、完了、取消はPhase2対象としてSHIP代理作業依頼で扱う。RFQ正本は `rfqs` 1件 + `rfq_vendors` 複数件とし、APIレスポンスで業者行へ展開する。購入管理対象RFQは `management_type='PURCHASE'` でリモデル管理と分離する。共通画面へ遷移するAPIは `managementType='PURCHASE'` と `returnTo` を保持し、Phase1のOCR実行/APIは対象外 |
| 24 | 2 | SHIP代理作業依頼 | `feature/API設計書_SHIP代理作業依頼.docx` | 23a. `/quotation-data-box/ship-proxy-requests`、60. `/quotation-data-box/rfq-process` | `作成済み` | Phase1のFix成果物から除外し、Phase2対象として管理する。作成済み設計書はSHIP代理作業依頼の作成・一覧・詳細・担当取得・差戻し・完了・取消APIを扱う。Phase1では購入管理/RFQプロセスの `SHIPへ依頼` ボタン表示のみを残し、依頼作成API本体、施設選択画面の `SHIP依頼一覧へ`、ユーザー管理の `ship_proxy_task` 設定、リモデル管理の `remodel_ship_request` はPhase2で再整理する |
| 25 | 1 | 移動・廃棄管理 | 未作成 | 35. `/disposal-task`、45. `/quotation-data-box/disposal-management`、58. `/quotation-data-box/transfer-management` | `未着手` | 移動・廃棄管理のAPI設計書。資産一覧起点の移動/廃棄申請起票はNo.10に残し、起票済み移動申請の受付・承認・原本反映、廃棄申請の受付、見積依頼、見積登録、発注登録、作業日/納期登録、完了登録、旧廃棄管理URLからの正規化を1本で扱う。現行モックに旧廃棄URLの実画面がない場合も互換導線として扱い、業務API本体は統合管理で扱う。一覧表示ラベルと保存ステータスを分離し、`見積登録済=発注用見積登録済`、`作業日確定=納期確定`、`申請を見送る=申請見送り` として扱う |
| 26 | 1 | 修理管理 | 未作成 | 57. `/quotation-data-box/repair-requests`、61. `/repair-request`、62. `/repair-task` | `未着手` | 修理管理のAPI設計書。現場起票、修理管理の申請受付一覧、院内/外部依頼振り分け、修理タスク進行、見積依頼、見積登録、発注、納期・検収、完了/資産登録、廃棄申請への接続までを1本で扱う。修理依頼起票時は `applications.status='新規申請'` を保存正本とし、画面表示文言 `依頼受付` は保存値にしない。詳細画面の初期ステップはURL IDやモック固定mapではなくDB正本ステータスから算出する。保存ステータスは `REPAIR=新規申請/見積依頼済/見積登録済/発注済/納期確定/検収登録/完了/却下` を正本とし、一覧表示上の `発注登録済` は `発注済`、`作業日確定` は `納期確定` に対応させる。修理区分は `IN_HOUSE` / `OUTSOURCED` を保存正本とし、修理不能から廃棄申請へ接続する場合は `disposal_application_details.related_repair_application_id` に元修理申請IDを保持する。ユーザー表記の「修正管理」は現行資料上の修理管理として扱う |
| 27 | 1 | 保守契約管理 | 未作成 | 41. `/maintenance-quote-registration`、49. `/quotation-data-box/maintenance-contracts` | `未着手` | 保守契約管理のAPI設計書。保守契約一覧、契約グループ詳細、見積依頼、見積登録、契約発注、完了登録、点検管理リスト登録までを1本で扱う。保守契約ステータスは `見積依頼 / 見積依頼済 / 見積登録済 / 契約発注済 / 完了 / 申請見送り` を正本とし、画面の `currentStep` は表示値として算出する。契約グループ詳細の資産別点検設定は `maintenance_contract_assets` に保持し、点検管理リスト登録時に `inspection_tasks` へ展開する |
| 28 | 1 | 点検管理 | `Fix/API設計書_点検管理.docx` | 32a. `/periodic-inspection`、42. `/maker-maintenance-result`、46. `/quotation-data-box/inspection-requests` | `Fix` | 点検管理のAPI設計書。定期点検タスク一覧、日常点検設定行一覧、点検メニュー登録、資産一覧画面の選択資産から起動する点検管理登録、日常点検設定変更・設定解除、日程調整、スキップ、定期点検実施、メーカー保守結果登録、点検予定表出力までを1本で扱う。点検管理登録では対象資産の大分類・中分類・品目まで一致するメニューのみ適用でき、同分類の全資産へ自動展開しない。定期点検は1資産に複数メニューを登録可能とし、同一資産・同一定期点検メニューの有効行重複を禁止する。日常点検は `inspection_type='日常点検'` の1資産1有効行として保持し、使用前/使用中/使用後メニューを変更・一部解除できる。点検ステータスは定期点検系のみ `点検月超過 / 点検週 / 点検月 / 点検1ヶ月前 / 点検Nヶ月前 / 点検日調整 / 点検実施中 / 点検完了 / 再点検` を正本とし、日常点検行はステータス、点検周期、前回点検日、次回点検予定を `NULL` / 画面 `-` 表示とする。定期点検開始時はQR照合成功または実施開始APIで `START_INSPECTION` を実行し、`inspection_tasks.status='点検実施中'` へ更新する。一覧のPhase1絞り込みは点検日区分、点検種別、点検グループ名、貸出状況を正本とし、Category/大分類/中分類/品目は必須条件にしない。点検種別の表示ラベル `院内点検` / `メーカー点検` / `スポット点検` / `日常点検` は保存値 `院内定期点検` / `メーカー保守` / `院内スポット点検` / `日常点検` へ変換する。日常点検のオフライン準備とQR起点の日常点検実施はNo.4を正本とし、日常点検設定行はNo.4のPWAパッケージ取得で端末へ配信する |
| 29 | 1 | 貸出管理 | 未作成 | 39. `/lending-available`、40. `/lending-checkout`、48. `/quotation-data-box/lending-management` | `未着手` | 貸出管理のAPI設計書。貸出管理一覧、貸出設定、貸出可能機器参照、貸出/返却、使用開始/使用終了までを1本で扱う。貸出機器ステータスは現行モックに合わせ `待機中 / 貸出可 / 貸出中 / 使用中 / 使用済 / 返却済 / 使用不可` を正本とする。貸出可能台数は `貸出可` のみを集計し、`待機中` は準備状態として別返却する。貸出グループ名、貸出種別名、返却アラート発生日数は `lending_devices` の永続項目として扱う。貸出・返却 / 使用中 & 使用済みは `lending_in_use_used` として独立判定するが、実効利用には `lending_checkout` も必須。API設計書作成時は `start-use` / `end-use` / 使用済み状態からの `return` に両方の認可条件を明記する |

## 更新ルール
- 新規作成時は、対象機能が属するプロセスへ追記する
- 画面単位ではなく、API設計書として管理する機能単位で記載する
- `対応する設計書` は、原則として正本ファイル名を1つだけ記載する
- 複数画面を1つのAPI設計書で扱う場合は、`対象画面` 列へ列挙する
- タスク管理画面配下の業務は業務機能単位の親設計書を優先し、その業務機能の一覧から遷移するステータス別画面/APIを親設計書へ内包する
- 内容レビュー完了時は `Fix` に更新する
