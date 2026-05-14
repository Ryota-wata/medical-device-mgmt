# API設計書 一覧

最終更新: 2026-05-14

ステータス件数: `Fix 15件` / `作成済み 1件` / `未着手 9件` / `不要 5件` / `旧版 1件` / `参考/作業用 1件`

本一覧は、[機能要件.md](/C:/Projects/mock/medical-device-mgmt/taniguchi/機能要件.md) の画面一覧をもとに、API設計書の作成対象を機能単位で管理するための台帳である。  
既存ファイルの羅列ではなく、「どの機能を、どの設計書で管理するか」を正として扱う。

## ステータス定義
- `Fix`: 正本要件ベースで整合確認済み
- `作成済み`: 文書は作成済み。要件整合レビューまたは追加修正余地あり
- `未着手`: 対応するAPI設計書は未作成
- `不要`: 個別API設計書を作成せず、他のAPI設計書または既存APIの組み合わせで扱う
- `旧版`: 旧成果物。参照用
- `参考/作業用`: 正式成果物ではない

## タスク管理タブのAPI設計書作成方針
- タスク管理画面（`/quotation-data-box`）配下の業務タブは、原則としてタブ単位で1つの親API設計書を作成する。
- 各タブの親API設計書には、タブ初期表示、一覧、件数、フィルター、詳細モーダル、一覧行の操作ボタン、操作ボタンから遷移するステータス別画面、完了後の戻り先、認証認可、状態遷移、DB更新境界を含める。
- タブ外から起票される申請APIは、既に独立設計書がある場合はそちらを正本とする。例: 資産一覧起点の購入/移動/廃棄申請起票はNo.16で扱い、購入管理タブや移動・廃棄管理タブでは起票後の受付以降を扱う。
- 同一APIを複数タブで共通実装する場合でも、各タブの親API設計書には、そのタブからの呼び出し条件、表示条件、権限、ステータス遷移、レスポンス差分を記載する。API本体の正本を共通化する場合は、どの設計書を正本とするかを明示する。
- タブ表示・直URLアクセス・各操作APIはロールではなく実効 `feature_code` で判定する。購入管理は `normal_purchase` / `normal_order` / `normal_acceptance` / `normal_quotation` のいずれか、リモデル管理は `remodel_purchase` / `remodel_order` / `remodel_acceptance` のいずれか、移動・廃棄管理は `transfer_disposal`、修理管理は `repair_management`、保守契約管理は `maintenance_contract`、点検管理は `inspection_management`、貸出管理は `lending_management` を入口機能の既定とし、タブ内操作は必要に応じて操作別 `feature_code` を追加判定する。
- 認証認可、マスタ管理、QR発行、資産検索など、タブ横断の基盤APIは既存の個別設計書を正本とし、タブ設計書では呼び出し前提と必要な利用条件だけを記載する。

## 認証/認可・初期選択
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 1 | 認証／認可 | `Fix/API設計書_認証／認可.docx` | 1. `/login`、2. `/password-reset`、3. `/facility-select`、4. `/main` | `Fix` | 正本要件・DB設計・APIレビュー反映済み。`ロール整理.xlsx` の `権限管理単位一覧` A列粒度へ追従済み。`normal_ship_request` / `ship_proxy_task` / `lending_in_use_used` は `config_scope='FACILITY_USER'` とし、施設提供設定とユーザー施設別設定の両方で判定する。ログイン後は担当施設数にかかわらず `/facility-select` へ遷移し、`/auth/me` はSHIP依頼一覧入口表示用の `shipProxyTaskAvailable` を返す。`lending_in_use_used` の実効判定は `lending_checkout` も必須 |
| 2 | 作業対象施設選択 | 個別ファイルなし | 3. `/facility-select` | `不要` | 認証認可API設計書に統合管理。`/auth/me` の `assignedFacilities` / `defaultFacilityId` / `shipProxyTaskAvailable` と `/auth/context` を利用する。SHIPユーザーかつ `ship_proxy_task` 有効時のみ `SHIP依頼一覧へ` を表示する。押下時は施設選択欄の選択有無にかかわらずSHIP依頼一覧へ遷移し、選択欄の値はSHIP依頼一覧の表示スコープに使わない |

## ホーム/メニュー
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 3 | ホーム/メニュー | 個別ファイルなし | 4. `/main` | `不要` | ホーム画面専用APIは設けず、認証認可APIの `/auth/me` / `/auth/context` と各業務APIの結果を組み合わせて表示する |

## QR/ラベル発行
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 4 | QR発行・ラベル印刷 | `Fix/API設計書_QR発行・ラベル印刷.docx` | 5. `/qr-issue`、6. `/qr-print` | `Fix` | QR発行から印刷までを `qr_issue` 1単位で扱う方針で確定。テンプレート一覧はフロントエンド資材、プリンタ候補はテプラ連携/ローカル印刷モジュールで扱い、マスタAPIは設けない。要件・DB設計・最新認証認可レビュー反映済み。 |

## 現有品調査・資産台帳取込・突合
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 5 | 現有品調査 | `Fix/API設計書_現有品調査.docx` | 7. `/offline-prep`、11. `/registration-edit` | `Fix` | API対象は `/offline-prep` と `/registration-edit`。`/survey-location` / `/asset-survey` / `/history` はPWAのフロント実装として扱い、正本要件・DB設計・最新認証認可レビュー反映済み。 |
| 6 | 資産台帳取込・マスタ突き合わせ | `Fix/API設計書_資産台帳取込.docx` | 12. `/asset-import`、13. `/asset-matching` | `Fix` | 正本要件・DB設計・最新認証認可レビュー反映済み |
| 7 | データ突合 | `Fix/API設計書_データ突合.docx` | 14. `/data-matching`、33. `/data-matching/ledger`、34. `/data-matching/me-ledger` | `Fix` | `lock_version` による更新競合検知と一覧 snapshot 固定、`created_asset_ledger_id` / `assetLedgerId` による原本確定後の追跡、`CONFIRM_ORIGINAL` 時の QR 紐付けと現有品調査写真引継ぎの同一トランザクション化、分類マスタの `is_active` 整合修正まで反映済み。再レビューで重大課題なし |

## 資産検索・台帳・棚卸
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 8 | 資産一覧・資産詳細 | `Fix/API設計書_資産一覧・資産詳細.docx` | 15. `/asset-search-result`、16. `/asset-detail` | `Fix` | 管理部署編集の独立 `feature_code`、bookmark 永続化、管理部署正本、QR直接遷移解決、履歴API、classificationMode、cursor pagination を反映済み。申請API本体は資産申請起票で扱う |
| 9 | 棚卸し | `Fix/API設計書_棚卸し.docx` | 38. `/inventory` | `Fix` | サーバー側の `inventory_sessions` / `inventory_items` を正本とする施設内共有型へ更新。`inventory` / `inventory_complete`、明細1行単位の即時保存、明細単位の楽観ロック、一括更新時の全体ロールバック、完了時の移動/廃棄申請自動起票、完了/取消と明細更新の交差防止を反映済み。再レビューで重大課題なし |

## マスタ管理
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 10 | SHIP資産マスタ | `Fix/API設計書_SHIP資産マスタ.docx` | 17. `/ship-asset-master`、30. `/asset-master` | `Fix` | 資産マスタ選択ポップアップ含む。添付文書の安定表示、インポート必須列の明確化、資産マスタIDの `ship_asset_master_id` 統一まで反映済み |
| 11 | SHIP施設マスタ | `Fix/API設計書_SHIP施設マスタ.docx` | 18. `/ship-facility-master` | `Fix` | 正本要件・DB設計・最新認証認可レビュー反映済み。施設提供機能設定で `normal_ship_request` / `ship_proxy_task` / `lending_in_use_used` など `config_scope='FACILITY_USER'` の施設提供可否を扱う。施設提供設定では `lending_checkout` OFF 時の `lending_in_use_used` ON と、未返却の使用中/使用済データが残る状態での OFF を拒否する |
| 12 | 個別部署マスタ | `Fix/API設計書_個別部署マスタ.docx` | 19. `/hospital-facility-master` | `Fix` | 正本要件・DB設計・最新認証認可レビュー反映済み |
| 13 | SHIP部署マスタ | `Fix/API設計書_SHIP部署マスタ.docx` | 20. `/ship-department-master` | `Fix` | 正本要件・DB設計・最新認証認可レビュー反映済み |
| 14 | ユーザー管理 | `Fix/API設計書_ユーザー管理.docx` | 21. `/user-management` | `Fix` | 正本要件・DB設計・最新認証認可レビュー反映済み。ユーザー別機能設定候補は `config_scope='FACILITY_USER'` のみに限定し、`normal_ship_request` / `ship_proxy_task` / `lending_in_use_used` も候補に含める。`ship_proxy_task` は対象ユーザーの `account_type='SHIP'` の場合のみ新規作成・変更時に表示/設定可能とし、非SHIPユーザーへの保存指定は拒否する。ユーザー側でも `lending_checkout` OFF 時の `lending_in_use_used` ON を拒否する |
| 15 | 業者マスタ | `Fix/API設計書_業者マスタ.docx` | 63. `/vendor-master` | `Fix` | 正本要件・DB設計・最新認証認可レビュー反映済み |

## 申請・見積・RFQ
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 16 | 資産申請起票 | `Fix/API設計書_資産申請起票.docx` | 15. `/asset-search-result`（新規購入/増設購入/更新購入/移動/廃棄申請モーダル） | `Fix` | 資産一覧起点の新規購入・増設購入・更新購入・移動・廃棄申請の起票APIを扱う。選択資産引継ぎ、入力検証、添付、`applications` / `application_assets` / 申請種別別詳細 / `application_documents` / 初期ステータス履歴を同一トランザクションで作成する。更新購入後の廃棄/移動/継続利用、関連移動/廃棄申請の追跡、廃棄理由コード未指定時の `OTHER` 保存方針を反映済み |
| 17 | リモデル管理タブ | 未作成 | 22. `/remodel-application`、55. `/quotation-data-box/remodel-management`、55a. `/quotation-data-box/remodel-dashboard`、60. `/quotation-data-box/rfq-process`、24. `/quotation-data-box/ocr-confirm`、44. `/quotation-data-box/category-registration`、47. `/quotation-data-box/item-ai-matching`、50. `/quotation-data-box/price-allocation`、54. `/quotation-data-box/registration-confirm`、25. `/quotation-data-box/order-registration`、26. `/quotation-data-box/inspection-registration`、27. `/quotation-data-box/asset-provisional-registration`、27a. `/quotation-data-box/asset-registration` | `未着手` | リモデル管理タブの親設計書。編集リスト本体、申請明細操作、リモデル申請画面起点のRFQグループ作成、リモデル管理タブの見積（発注）グループ一覧、リモデルダッシュボード、RFQプロセス、見積登録/発注見積登録、発注登録、納品日登録、検収登録、資産登録、リモデルクローズと原本反映までを内包する。購入管理タブの申請受付一覧から行う購入申請取り込み、通常購入RFQグループ作成導線はNo.19に内包する。RFQは `management_type='REMODEL'` で購入管理タブと分離する。共通画面へ遷移するAPIは `rfqGroupId`、`quotationId`/`draftId`、`managementType='REMODEL'`、`returnTo` を保持する |
| 18 | タスク管理トップ | 個別ファイルなし | 23. `/quotation-data-box` | `不要` | 既定サブタブへのリダイレクトのみ。業務APIは各サブタブ側の設計書で管理する |
| 19 | 購入管理タブ | `作成済み/API設計書_購入管理・リモデル管理・RFQ.docx` | 51. `/quotation-data-box/purchase-management`、60. `/quotation-data-box/rfq-process`、24. `/quotation-data-box/ocr-confirm`、44. `/quotation-data-box/category-registration`、47. `/quotation-data-box/item-ai-matching`、50. `/quotation-data-box/price-allocation`、54. `/quotation-data-box/registration-confirm`、59. `/quotation-processing`、25. `/quotation-data-box/order-registration`、26. `/quotation-data-box/inspection-registration`、27. `/quotation-data-box/asset-provisional-registration`、27a. `/quotation-data-box/asset-registration` | `作成済み` | 購入管理タブの親設計書。資産一覧起点の購入申請起票はNo.16に残し、No.19は起票済み購入申請の受付一覧・詳細・却下、購入管理タブ起点の編集リスト取り込み/通常購入RFQグループ作成、見積（発注）グループ一覧、RFQプロセス、見積登録/発注見積登録、発注登録、納品日登録、検収登録、資産登録までを内包する。現行docxは購入/リモデル/RFQ中心の初版であり、このタブ別親設計書方針に基づき購入管理タブ設計書として改題・拡張改訂対象とする。現行ステップタブは `すべて/①見積依頼・登録/②発注登録/③納品日登録/④検収登録/⑤資産登録` とし、`見積登録依頼中` / `発注用見積依頼済` は独立タブではなく内部ステータスとして扱う。SHIP代理作業依頼のAPI本体はNo.19aで扱い、No.19では購入管理タブ/RFQプロセスからの導線と接続方針を記載する。RFQ正本は `rfqs` 1件 + `rfq_vendors` 複数件とし、APIレスポンスで業者行へ展開する。購入管理タブ対象RFQは `management_type='PURCHASE'` でリモデル管理タブと分離する。共通画面へ遷移するAPIは `managementType='PURCHASE'` と `returnTo` を保持し、Phase1のOCR実行/APIは対象外 |
| 19a | SHIP代理作業依頼 | `Fix/API設計書_SHIP代理作業依頼.docx` | 23a. `/quotation-data-box/ship-proxy-requests`、60. `/quotation-data-box/rfq-process` | `Fix` | 正本要件・DB設計・最新認証認可レビュー反映済み。SHIP代理作業依頼の作成・一覧・詳細・担当取得・差戻し・完了・取消APIを扱う。対象APIは `POST /quotation-data-box/rfq-groups/{rfqGroupId}/ship-proxy-request`、`GET /quotation-data-box/ship-proxy-requests`、`GET /quotation-data-box/ship-proxy-requests/{shipProxyRequestId}`、`POST /quotation-data-box/ship-proxy-requests/{shipProxyRequestId}/start`、`POST /quotation-data-box/ship-proxy-requests/{shipProxyRequestId}/return`、`POST /quotation-data-box/ship-proxy-requests/{shipProxyRequestId}/complete`、`POST /quotation-data-box/ship-proxy-requests/{shipProxyRequestId}/cancel`。病院側のSHIP依頼作成は `normal_ship_request`、SHIP側の代理作業は `ship_proxy_task` として独立判定し、いずれも `config_scope='FACILITY_USER'` で施設提供設定とユーザー施設別設定の両方を必須とする |
| 20 | 見積登録・見積管理 | 未作成 | 29. `/quotation-management` | `未着手` | 購入管理タブ起点の見積登録/発注見積登録APIはNo.19に内包する。本項は見積管理画面の横断一覧・詳細、購入管理タブ以外から利用する見積参照、Phase2のOCRジョブ管理やAI補助処理の共通化が必要になった場合の設計対象とする |
| 21 | 発注・検収・資産仮登録 | 個別ファイルなし | 25. `/quotation-data-box/order-registration`、26. `/quotation-data-box/inspection-registration`、27. `/quotation-data-box/asset-provisional-registration`、27a. `/quotation-data-box/asset-registration` | `不要` | 購入管理タブ起点はNo.19、リモデル管理タブ起点はNo.17に内包する。複数タブで共通実装する場合でも、タブごとの呼び出し条件、権限、状態遷移、戻り先は各タブ親設計書に記載する |

## 借用・貸出・移動・廃棄
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 22 | 借用管理タブ | 未作成 | 31. `/borrowing-task`、43. `/quotation-data-box/borrowing-management` | `未着手` | 借用管理タブの親設計書。現行モックではタブ実装が未確認のため、タブを復活させる場合は、借用申請起票、借用管理一覧、契約、納品、返却、添付までを1本で扱う。貸出管理へ統合する場合は本行を不要へ変更する |
| 23 | 貸出管理タブ | 未作成 | 39. `/lending-available`、40. `/lending-checkout`、48. `/quotation-data-box/lending-management` | `未着手` | 貸出管理タブの親設計書。貸出管理一覧、貸出設定、貸出可能機器参照、貸出/返却、使用開始/使用終了までを1本で扱う。貸出機器ステータスは現行モックに合わせ `待機中 / 貸出可 / 貸出中 / 使用中 / 使用済 / 返却済 / 使用不可` を正本とする。貸出グループ名、貸出種別名、返却アラート発生日数は `lending_devices` の永続項目として扱う。貸出・返却 / 使用中 & 使用済みは `lending_in_use_used` として独立判定するが、実効利用には `lending_checkout` も必須。API設計書作成時は `start-use` / `end-use` / 使用済み状態からの `return` に両方の認可条件を明記する |
| 24 | 移動・廃棄管理タブ | 未作成 | 35. `/disposal-task`、45. `/quotation-data-box/disposal-management`、58. `/quotation-data-box/transfer-management` | `未着手` | 移動・廃棄管理タブの親設計書。資産一覧起点の移動/廃棄申請起票はNo.16に残し、No.24は起票済み移動申請の受付・承認・原本反映、廃棄申請の受付、見積依頼、見積登録、発注登録、作業日/納期登録、完了登録、旧廃棄管理URLからの正規化を1本で扱う。現行モックに旧廃棄URLの実画面がない場合も互換導線として扱い、業務API本体は統合タブで扱う。一覧表示ラベルと保存ステータスを分離し、`見積登録済=発注用見積登録済`、`作業日確定=納期確定`、`申請を見送る=申請見送り` として扱う |

## 点検・保守
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 25 | 日常点検 | 未作成 | 32. `/daily-inspection`、36. `/inspection-prep`、37. `/inspection-result` | `未着手` | オフライン準備から日常点検実施・結果表示までを1本で扱う |
| 26 | 点検管理タブ | 未作成 | 32a. `/periodic-inspection`、42. `/maker-maintenance-result`、46. `/quotation-data-box/inspection-requests` | `未着手` | 点検管理タブの親設計書。点検タスク一覧、点検メニュー登録、点検管理登録、日程調整、スキップ、定期点検実施、メーカー保守結果登録、点検予定表出力までを1本で扱う。点検ステータスは `点検月超過 / 点検週 / 点検月 / 点検1ヶ月前 / 点検Nヶ月前 / 点検日調整 / 点検実施中 / 点検完了 / 再点検` を正本とする。一覧のPhase1絞り込みは点検日区分、定期点検種別、点検グループ名、貸出状況を正本とし、Category/大分類/中分類/品目は必須条件にしない。定期点検種別の表示ラベル `院内点検` / `メーカー点検` / `スポット点検` は保存値 `院内定期点検` / `メーカー保守` / `院内スポット点検` へ変換する。日常点検のオフライン準備とQR起点の日常点検実施はNo.25を正本とする |
| 27 | 保守契約管理タブ | 未作成 | 41. `/maintenance-quote-registration`、49. `/quotation-data-box/maintenance-contracts` | `未着手` | 保守契約管理タブの親設計書。保守契約一覧、契約グループ詳細、見積依頼、見積登録、契約発注、完了登録、点検管理リスト登録までを1本で扱う。保守契約ステータスは `見積依頼 / 見積依頼済 / 見積登録済 / 契約発注済 / 完了 / 申請見送り` を正本とし、画面の `currentStep` は表示値として算出する。契約グループ詳細の資産別点検設定は `maintenance_contract_assets` に保持し、点検管理リスト登録時に `inspection_tasks` へ展開する |

## リダイレクト・互換導線
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 28 | リダイレクト・互換導線 | 個別ファイルなし | 45. `/quotation-data-box/disposal-management`、52. `/quotation-data-box/purchase-quotations`、53. `/quotation-data-box/quotations`、56. `/quotation-data-box/remodel-quotations` | `不要` | 旧URLから業務本体へ正規化する導線のみ。廃棄はNo.24、購入見積明細はNo.19、リモデル見積明細はNo.17、横断見積管理はNo.20で扱う |

## 修理
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 29 | 修理管理タブ | 未作成 | 57. `/quotation-data-box/repair-requests`、61. `/repair-request`、62. `/repair-task` | `未着手` | 修理管理タブの親設計書。現場起票、修理管理タブの申請受付一覧、院内/外部依頼振り分け、修理タスク進行、見積依頼、見積登録、発注、納期・検収、完了/資産登録、廃棄申請への接続までを1本で扱う。保存ステータスは `REPAIR=新規申請/見積依頼済/見積登録済/発注済/納期確定/検収登録/完了/却下` を正本とし、一覧表示上の `発注登録済` は `発注済`、`作業日確定` は `納期確定` に対応させる。修理区分は `IN_HOUSE` / `OUTSOURCED` を保存正本とし、修理不能から廃棄申請へ接続する場合は `disposal_application_details.related_repair_application_id` に元修理申請IDを保持する。ユーザー表記の「修正管理」は現行資料上の修理管理タブとして扱う |

## 参考・管理対象外
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 30 | 認証／認可（旧版） | `旧版/旧_API設計書_認証／認可.docx` | 参照用 | `旧版` | 正本ではない |
| 31 | SHIP施設マスタ作業用 | `参考_作業用/_debug_ship_facility.docx` | 作業用 | `参考/作業用` | 正式成果物ではない |

## 更新ルール
- 新規作成時は、対象機能が属するプロセスへ追記する
- 画面単位ではなく、API設計書として管理する機能単位で記載する
- `対応する設計書` は、原則として正本ファイル名を1つだけ記載する
- 複数画面を1つのAPI設計書で扱う場合は、`対象画面` 列へ列挙する
- タスク管理画面配下の業務はタブ単位の親設計書を優先し、そのタブの一覧から遷移するステータス別画面/APIを親設計書へ内包する
- 内容レビュー完了時は `Fix` に更新する
