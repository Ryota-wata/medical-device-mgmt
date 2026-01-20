# 画面名とファイルのマッピング

## 画面一覧

| 画面名（日本語） | 画面名（英語） | ファイルパス |
|-----------------|---------------|-------------|
| ログイン | Login | `app/login/page.tsx` |
| パスワードリセット | Password Reset | `app/password-reset/page.tsx` |
| メイン | Main | `app/main/page.tsx` |
| 資産検索結果 | Asset Search Result | `app/asset-search-result/page.tsx` |
| 資産詳細 | Asset Detail | `app/asset-detail/page.tsx` |
| 資産マスタ | Asset Master | `app/asset-master/page.tsx` |
| リモデル申請 | Remodel Application | `app/remodel-application/page.tsx` |
| リモデル申請一覧 | Remodel Application List | `app/remodel-application-list/page.tsx` |
| 申請一覧 | Application List | `app/application-list/page.tsx` |
| 見積管理 | Quotation Data Box | `app/quotation-data-box/page.tsx` |
| 見積処理 | Quotation Processing | `app/quotation-processing/page.tsx` |
| QRコード発行 | QR Issue | `app/qr-issue/page.tsx` |
| QRコード印刷 | QR Print | `app/qr-print/page.tsx` |
| 現有品調査 | Offline Prep | `app/offline-prep/page.tsx` |
| 現有品調査（統合） | Asset Survey Integrated | `app/asset-survey-integrated/page.tsx` |
| 現有品調査内容修正 | Registration Edit | `app/registration-edit/page.tsx` |
| 資産台帳取込 | Asset Import | `app/asset-import/page.tsx` |
| データ突合 | Data Matching | `app/data-matching/page.tsx` |
| データ突合（台帳） | Data Matching Ledger | `app/data-matching/ledger/page.tsx` |
| 資産突合 | Asset Matching | `app/asset-matching/page.tsx` |
| 棚卸 | Inventory | `app/inventory/page.tsx` |
| 調査場所 | Survey Location | `app/survey-location/page.tsx` |
| 資産調査 | Asset Survey | `app/asset-survey/page.tsx` |
| 履歴 | History | `app/history/page.tsx` |
| ユーザー管理 | User Management | `app/user-management/page.tsx` |
| SHIP資産マスタ | SHIP Asset Master | `app/ship-asset-master/page.tsx` |
| SHIP施設マスタ | SHIP Facility Master | `app/ship-facility-master/page.tsx` |
| SHIP部署マスタ | SHIP Department Master | `app/ship-department-master/page.tsx` |
| 個別施設マスタ | Hospital Facility Master | `app/hospital-facility-master/page.tsx` |

## 見積管理画面の構成

見積管理画面 (`app/quotation-data-box/`) は以下のコンポーネントで構成：

```
app/quotation-data-box/
├── page.tsx                    # メインページ
└── components/
    ├── RfqGroupsTab.tsx        # 見積依頼グループタブ
    ├── QuotationsTab.tsx       # 受領見積タブ
    └── QuotationRegistrationModal/
        ├── index.tsx           # モーダル本体
        ├── Step1RfqGroupSelection.tsx    # STEP1: PDF取込
        ├── Step2OcrResultDisplay.tsx     # STEP2: OCR明細確認
        ├── Step3ItemTypeClassification.tsx # STEP3: 登録区分AI判定
        ├── Step4IndividualItemLinking.tsx  # STEP4: 個体管理品目AI判定
        ├── Step5PriceAllocation.tsx      # STEP5: 金額案分
        └── ApplicationCreationModal.tsx   # 申請作成モーダル
```

## 画面名の別名・表記ゆれ対応

| 別名・表記ゆれ | 正式画面名 |
|---------------|-----------|
| ホーム、トップ、ダッシュボード | メイン |
| 編集リスト、編集画面 | リモデル申請 |
| 資産一覧、検索結果 | 資産検索結果 |
| 資産情報、詳細画面 | 資産詳細 |
| 見積一覧、見積ボックス、見積・発注契約管理 | 見積管理 |
| QR発行、ラベル発行 | QRコード発行 |
| 現調、現有品、オフライン調査 | 現有品調査 |
| 修正画面、編集画面 | 現有品調査内容修正 |
| インポート、取込 | 資産台帳取込 |
| 突合、マッチング | データ突合 |
| 在庫、棚卸し | 棚卸 |
| 資産マスタ、品目マスタ | SHIP資産マスタ |
| 施設マスタ、病院マスタ | SHIP施設マスタ |
| 部署マスタ、部門マスタ | SHIP部署マスタ |
| 場所マスタ、フロアマスタ | 個別施設マスタ |
| ユーザー、アカウント | ユーザー管理 |

## 型定義ファイル

| 型 | ファイル |
|----|---------|
| 見積関連 | `lib/types/quotation.ts` |
| 共通型 | `lib/types/index.ts` |
| ストア | `lib/stores/quotationStore.ts` |
