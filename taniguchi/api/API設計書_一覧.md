# API設計書 一覧

最終更新: 2026-03-14

ステータス件数: `Fix 5件` / `作成済み 2件` / `未着手 17件` / `不要 4件` / `旧版 1件` / `参考/作業用 1件`

本一覧は、[機能要件.md](/C:/Projects/mock/medical-device-mgmt/taniguchi/機能要件.md) の画面一覧をもとに、API設計書の作成対象を機能単位で管理するための台帳である。  
既存ファイルの羅列ではなく、「どの機能を、どの設計書で管理するか」を正として扱う。

## ステータス定義
- `Fix`: 正本要件ベースで整合確認済み
- `作成済み`: 文書は作成済み。要件整合レビューまたは追加修正余地あり
- `未着手`: 対応するAPI設計書は未作成
- `不要`: 個別API設計書を作成せず、他のAPI設計書または既存APIの組み合わせで扱う
- `旧版`: 旧成果物。参照用
- `参考/作業用`: 正式成果物ではない

## 認証/認可・初期選択
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 1 | 認証／認可 | `Fix/API設計書_認証／認可_正本ベース.docx` | 1. `/login`、2. `/password-reset` | `Fix` | 認証・認可の正本 |
| 2 | 作業対象施設選択 | 個別ファイルなし | 3. `/facility-select` | `不要` | 認証認可API設計書に統合管理。`/auth/me` と `allowedFacilities` を施設候補として利用する |

## ホーム/メニュー
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 3 | ホーム/メニュー | 個別ファイルなし | 4. `/main` | `不要` | ホーム画面専用APIは設けず、認証認可APIと各業務APIの結果を組み合わせて表示する |

## QR/ラベル発行
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 4 | QR発行・ラベル印刷 | 未作成 | 5. `/qr-issue`、6. `/qr-print` | `未着手` | QR発行から印刷までを1本で扱う想定 |

## 現有品調査・資産台帳取込・突合
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 5 | 現有品調査 | `作成済み/API設計書_現有品調査.docx` | 7. `/offline-prep`、8. `/survey-location`、9. `/asset-survey`、10. `/history`、11. `/registration-edit` | `作成済み` | 現有品調査関連を1本で扱う。 |
| 6 | 資産台帳取込・マスタ突き合わせ | `作成済み/API設計書_資産台帳取込.docx` | 12. `/asset-import`、13. `/asset-matching` | `作成済み` | 資産台帳取込とマスタ突き合わせを1本で扱う |
| 7 | データ突合 | 未作成 | 14. `/data-matching`、33. `/data-matching/ledger`、34. `/data-matching/me-ledger` | `未着手` | データ統合・原本確定を別途定義予定 |

## 資産検索・台帳・棚卸
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 8 | 資産検索・資産詳細 | 未作成 | 15. `/asset-search-result`、16. `/asset-detail` | `未着手` | 資産検索結果と資産詳細を1本で扱う想定 |
| 9 | 棚卸し | 未作成 | 38. `/inventory` | `未着手` | 独立機能として別途定義予定 |

## マスタ管理
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 10 | SHIP資産マスタ | 未作成 | 17. `/ship-asset-master`、30. `/asset-master` | `未着手` | 資産マスタ選択ポップアップ含む |
| 11 | SHIP施設マスタ | `Fix/API設計書_SHIP施設マスタ.docx` | 18. `/ship-facility-master` | `Fix` | 正本要件・DB設計との整合確認済み |
| 12 | 個別部署マスタ | `Fix/API設計書_個別部署マスタ.docx` | 19. `/hospital-facility-master` | `Fix` | 正本要件・DB設計との整合確認済み |
| 13 | SHIP部署マスタ | `Fix/API設計書_SHIP部署マスタ.docx` | 20. `/ship-department-master` | `Fix` | 正本要件・DB設計との整合確認済み |
| 14 | SHIPユーザー管理 | 未作成 | 21. `/user-management` | `未着手` | 別途定義予定 |
| 15 | 業者マスタ | `Fix/API設計書_業者マスタ.docx` | 63. `/vendor-master` | `Fix` | 画面要件・DB設計との整合確認済み |

## 申請・見積・RFQ
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 16 | 編集リスト・リモデル申請 | 未作成 | 22. `/remodel-application` | `未着手` | 編集リスト本体と申請明細操作を1本で扱う |
| 17 | タスク管理トップ | 個別ファイルなし | 23. `/quotation-data-box` | `不要` | 既定サブタブへのリダイレクトのみ。業務APIは各サブタブ側の設計書で管理する |
| 18 | 購入管理・リモデル管理・RFQ | 未作成 | 51. `/quotation-data-box/purchase-management`、55. `/quotation-data-box/remodel-management`、60. `/quotation-data-box/rfq-process` | `未着手` | 見積依頼グループの進行管理とRFQ作成を1本で扱う |
| 19 | 見積登録・見積管理 | 未作成 | 24. `/quotation-data-box/ocr-confirm`、29. `/quotation-management`、44. `/quotation-data-box/category-registration`、47. `/quotation-data-box/item-ai-matching`、50. `/quotation-data-box/price-allocation`、54. `/quotation-data-box/registration-confirm`、59. `/quotation-processing` | `未着手` | OCR確認から見積登録、見積明細参照までを1本で扱う |
| 20 | 発注・検収・資産仮登録 | 未作成 | 25. `/quotation-data-box/order-registration`、26. `/quotation-data-box/inspection-registration`、27. `/quotation-data-box/asset-provisional-registration` | `未着手` | 見積登録後の発注・検収・仮登録工程を1本で扱う |

## 借用・貸出・移動・廃棄
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 21 | 借用管理 | 未作成 | 31. `/borrowing-task`、43. `/quotation-data-box/borrowing-management` | `未着手` | 借用申請一覧から契約・返却タスクまでを1本で扱う |
| 22 | 貸出管理・貸出返却 | 未作成 | 39. `/lending-available`、40. `/lending-checkout`、48. `/quotation-data-box/lending-management` | `未着手` | 貸出在庫参照、貸出返却、貸出管理設定を1本で扱う |
| 23 | 移動・廃棄管理 | 未作成 | 35. `/disposal-task`、58. `/quotation-data-box/transfer-management` | `未着手` | 移動承認と廃棄タスク進行を1本で扱う |

## 点検・保守
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 24 | 日常点検 | 未作成 | 32. `/daily-inspection`、36. `/inspection-prep`、37. `/inspection-result` | `未着手` | オフライン準備から日常点検実施・結果表示までを1本で扱う |
| 25 | 点検管理・メーカー保守 | 未作成 | 42. `/maker-maintenance-result`、46. `/quotation-data-box/inspection-requests` | `未着手` | 点検タスク管理、点検メニュー/登録、メーカー保守結果登録を1本で扱う |
| 26 | 保守契約管理 | 未作成 | 41. `/maintenance-quote-registration`、49. `/quotation-data-box/maintenance-contracts` | `未着手` | 保守契約一覧から見積登録・契約登録までを1本で扱う |

## リダイレクト・互換導線
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 27 | リダイレクト・互換導線 | 個別ファイルなし | 45. `/quotation-data-box/disposal-management`、52. `/quotation-data-box/purchase-quotations`、53. `/quotation-data-box/quotations`、56. `/quotation-data-box/remodel-quotations` | `不要` | 旧URLから業務本体へ正規化する導線のみ。廃棄は移動・廃棄管理、見積明細は見積登録・見積管理の設計書で扱う |

## 修理
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 28 | 修理依頼・修理管理 | 未作成 | 57. `/quotation-data-box/repair-requests`、61. `/repair-request`、62. `/repair-task` | `未着手` | 現場起票から一覧・タスク進行・完了までを1本で扱う |

## 参考・管理対象外
| No | 機能 | 対応する設計書 | 対象画面 | ステータス | 備考 |
| --- | --- | --- | --- | --- | --- |
| 29 | 認証／認可（旧版） | `旧版/旧_API設計書_認証／認可.docx` | 参照用 | `旧版` | 正本ではない |
| 30 | SHIP施設マスタ作業用 | `参考_作業用/_debug_ship_facility.docx` | 作業用 | `参考/作業用` | 正式成果物ではない |

## 更新ルール
- 新規作成時は、対象機能が属するプロセスへ追記する
- 画面単位ではなく、API設計書として管理する機能単位で記載する
- `対応する設計書` は、原則として正本ファイル名を1つだけ記載する
- 複数画面を1つのAPI設計書で扱う場合は、`対象画面` 列へ列挙する
- 内容レビュー完了時は `Fix` に更新する
