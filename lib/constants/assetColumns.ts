// カラム定義の型
export interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  defaultVisible?: boolean;
  group?: string;
}

// 資産テーブルのカラム定義
export const ASSET_COLUMNS: ColumnDef[] = [
  // 基本情報
  { key: 'facility', label: '施設名', width: '200px', defaultVisible: true, group: 'basic' },

  // 共通マスタ（SHIP部署マスタ連携）
  { key: 'shipDivision', label: '部門名', width: '120px', defaultVisible: true, group: 'commonMaster' },
  { key: 'shipDepartment', label: '部署名', width: '120px', defaultVisible: true, group: 'commonMaster' },
  { key: 'roomClass1', label: '諸室区分①', width: '140px', defaultVisible: true, group: 'commonMaster' },
  { key: 'roomClass2', label: '諸室区分②', width: '140px', defaultVisible: true, group: 'commonMaster' },

  // 設置情報
  { key: 'divisionId', label: '部門ID', width: '80px', defaultVisible: false, group: 'location' },
  { key: 'departmentId', label: '部署ID', width: '80px', defaultVisible: false, group: 'location' },
  { key: 'roomId', label: '諸室ID', width: '80px', defaultVisible: false, group: 'location' },
  { key: 'building', label: '棟', width: '100px', defaultVisible: true, group: 'location' },
  { key: 'floor', label: '階', width: '80px', defaultVisible: true, group: 'location' },
  { key: 'department', label: '部門', width: '120px', defaultVisible: true, group: 'location' },
  { key: 'section', label: '部署', width: '120px', defaultVisible: true, group: 'location' },
  { key: 'roomName', label: '室名', width: '150px', defaultVisible: true, group: 'location' },
  { key: 'installationLocation', label: '設置場所', width: '150px', defaultVisible: false, group: 'location' },

  // 識別情報
  { key: 'qrCode', label: 'QRコード', width: '150px', defaultVisible: true, group: 'identity' },
  { key: 'assetNo', label: '台帳番号', width: '150px', defaultVisible: true, group: 'identity' },
  { key: 'managementDept', label: '管理部署', width: '120px', defaultVisible: false, group: 'identity' },
  { key: 'managementNo', label: '管理機器番号', width: '150px', defaultVisible: false, group: 'identity' },
  { key: 'equipmentNo', label: '備品番号', width: '120px', defaultVisible: false, group: 'identity' },
  { key: 'serialNumber', label: 'シリアルNo.', width: '150px', defaultVisible: false, group: 'identity' },

  // 資産分類
  { key: 'assetMasterId', label: '資産マスタID', width: '120px', defaultVisible: false, group: 'classification' },
  { key: 'category', label: 'Category', width: '120px', defaultVisible: false, group: 'classification' },
  { key: 'largeClass', label: '大分類', width: '150px', defaultVisible: true, group: 'classification' },
  { key: 'mediumClass', label: '中分類', width: '150px', defaultVisible: true, group: 'classification' },
  { key: 'detailCategory', label: '明細区分', width: '100px', defaultVisible: false, group: 'classification' },
  { key: 'item', label: '個体管理品目', width: '180px', defaultVisible: true, group: 'classification' },

  // 機器仕様
  { key: 'name', label: '個体管理名称', width: '200px', defaultVisible: false, group: 'specification' },
  { key: 'maker', label: 'メーカー名', width: '150px', defaultVisible: true, group: 'specification' },
  { key: 'model', label: '型式', width: '150px', defaultVisible: true, group: 'specification' },
  { key: 'width', label: 'W', width: '80px', defaultVisible: false, group: 'specification' },
  { key: 'depth', label: 'D', width: '80px', defaultVisible: false, group: 'specification' },
  { key: 'height', label: 'H', width: '80px', defaultVisible: false, group: 'specification' },

  // 取得情報（現有品調査由来）
  { key: 'purchaseDate', label: '購入年月日', width: '120px', defaultVisible: false, group: 'acquisition' },
  { key: 'lease', label: 'リース', width: '80px', defaultVisible: false, group: 'acquisition' },
  { key: 'rental', label: '貸出品', width: '80px', defaultVisible: false, group: 'acquisition' },

  // その他
  { key: 'remarks', label: '備考', width: '200px', defaultVisible: false, group: 'other' },
  { key: 'photos', label: '写真', width: '80px', defaultVisible: false, group: 'other' },

  // 契約情報（編集画面用）
  { key: 'contractName', label: '契約･見積名称', width: '180px', defaultVisible: false, group: 'contract' },
  { key: 'contractNo', label: '契約番号（契約単位）', width: '180px', defaultVisible: false, group: 'contract' },
  { key: 'quotationNo', label: '見積番号', width: '120px', defaultVisible: false, group: 'contract' },
  { key: 'contractDate', label: '契約･発注日', width: '120px', defaultVisible: false, group: 'contract' },
  { key: 'deliveryDate', label: '納品日', width: '120px', defaultVisible: false, group: 'contract' },
  { key: 'inspectionDate', label: '検収日', width: '120px', defaultVisible: false, group: 'contract' },

  // リース詳細（編集画面用）
  { key: 'leaseStartDate', label: 'リース開始日', width: '120px', defaultVisible: false, group: 'leaseDetail' },
  { key: 'leaseEndDate', label: 'リース終了日', width: '120px', defaultVisible: false, group: 'leaseDetail' },

  // 財務情報（編集画面用）
  { key: 'acquisitionCost', label: '取得価格', width: '120px', defaultVisible: false, group: 'financial' },
  { key: 'assetInfo', label: '資産情報', width: '200px', defaultVisible: false, group: 'financial' },

  // 耐用年数（編集画面用）
  { key: 'legalServiceLife', label: '耐用年数（法定）', width: '140px', defaultVisible: false, group: 'lifespan' },
  { key: 'recommendedServiceLife', label: '使用年数（メーカー推奨）', width: '180px', defaultVisible: false, group: 'lifespan' },
  { key: 'endOfService', label: 'End of service：販売終了', width: '180px', defaultVisible: false, group: 'lifespan' },
  { key: 'endOfSupport', label: 'End of support：メンテ終了', width: '180px', defaultVisible: false, group: 'lifespan' },
];

// ============================
// 編集リスト（リモデル申請）用カラム定義
// ============================

export const REMODEL_COLUMNS: ColumnDef[] = [
  // 処理方針
  { key: 'purchaseCategory', label: 'リモデル区分', width: '110px', defaultVisible: true, group: 'applicationOverview' },
  { key: 'executionFiscalYear', label: '執行希望年度', width: '120px', defaultVisible: true, group: 'applicationOverview' },

  // 共通部署マスタ
  { key: 'shipDivision', label: '部門名', width: '120px', defaultVisible: true, group: 'commonMaster' },
  { key: 'shipDepartment', label: '部署名', width: '120px', defaultVisible: true, group: 'commonMaster' },

  // (新)設置情報
  { key: 'newBuilding', label: '棟', width: '100px', defaultVisible: true, group: 'newLocation' },
  { key: 'newFloor', label: '階', width: '80px', defaultVisible: true, group: 'newLocation' },
  { key: 'newDepartment', label: '部門', width: '120px', defaultVisible: true, group: 'newLocation' },
  { key: 'newSection', label: '部署', width: '120px', defaultVisible: true, group: 'newLocation' },
  { key: 'newRoomName', label: '室名', width: '150px', defaultVisible: true, group: 'newLocation' },

  // 契約情報（資産識別・分類）
  { key: 'managementDept', label: '管理部署', width: '120px', defaultVisible: true, group: 'contract' },
  { key: 'qrCode', label: 'QRコード', width: '150px', defaultVisible: true, group: 'contract' },
  { key: 'assetNo', label: '台帳番号', width: '150px', defaultVisible: true, group: 'contract' },
  { key: 'assetMasterId', label: '資産マスタID', width: '120px', defaultVisible: true, group: 'contract' },
  { key: 'category', label: 'Category', width: '120px', defaultVisible: true, group: 'contract' },
  { key: 'largeClass', label: '大分類', width: '150px', defaultVisible: true, group: 'contract' },
  { key: 'mediumClass', label: '中分類', width: '150px', defaultVisible: true, group: 'contract' },
  { key: 'detailCategory', label: '明細区分', width: '100px', defaultVisible: true, group: 'contract' },
  { key: 'parentItem', label: '明細親機', width: '150px', defaultVisible: true, group: 'contract' },
  { key: 'item', label: '個体管理品目', width: '180px', defaultVisible: true, group: 'contract' },
  { key: 'maker', label: 'メーカー名', width: '150px', defaultVisible: true, group: 'contract' },
  { key: 'model', label: '型式', width: '150px', defaultVisible: true, group: 'contract' },

  // 購入申請情報
  { key: 'serialNumber', label: 'シリアルNo.', width: '150px', defaultVisible: true, group: 'purchaseApplication' },
  { key: 'applicationCategory', label: '申請種別', width: '100px', defaultVisible: true, group: 'purchaseApplication' },
  { key: 'applicationDate', label: '申請日', width: '120px', defaultVisible: true, group: 'purchaseApplication' },
  { key: 'applicationNo', label: '申請No.', width: '120px', defaultVisible: true, group: 'purchaseApplication' },
  { key: 'desiredDeliveryDate', label: '希望納期', width: '120px', defaultVisible: true, group: 'purchaseApplication' },
  { key: 'priority', label: '優先順位', width: '80px', defaultVisible: true, group: 'purchaseApplication' },
  { key: 'applicationItem', label: '申請品目', width: '150px', defaultVisible: true, group: 'purchaseApplication' },
  { key: 'quantity', label: '数量', width: '80px', defaultVisible: true, group: 'purchaseApplication' },
  { key: 'quantityUnit', label: '単位', width: '80px', defaultVisible: true, group: 'purchaseApplication' },
  { key: 'requestItem1', label: '要望①品目', width: '150px', defaultVisible: true, group: 'purchaseApplication' },
  { key: 'requestMaker1', label: '要望①メーカー', width: '150px', defaultVisible: true, group: 'purchaseApplication' },
  { key: 'requestModel1', label: '要望①型式', width: '150px', defaultVisible: true, group: 'purchaseApplication' },
  { key: 'requestItem2', label: '要望②品目', width: '150px', defaultVisible: false, group: 'purchaseApplication' },
  { key: 'requestMaker2', label: '要望②メーカー', width: '150px', defaultVisible: false, group: 'purchaseApplication' },
  { key: 'requestModel2', label: '要望②型式', width: '150px', defaultVisible: false, group: 'purchaseApplication' },
  { key: 'requestItem3', label: '要望③品目', width: '150px', defaultVisible: false, group: 'purchaseApplication' },
  { key: 'requestMaker3', label: '要望③メーカー', width: '150px', defaultVisible: false, group: 'purchaseApplication' },
  { key: 'requestModel3', label: '要望③型式', width: '150px', defaultVisible: false, group: 'purchaseApplication' },
  { key: 'usagePurpose', label: '使用症例・用途', width: '150px', defaultVisible: true, group: 'purchaseApplication' },
  { key: 'caseCount', label: '件数', width: '80px', defaultVisible: true, group: 'purchaseApplication' },
  { key: 'caseCountUnit', label: '単位', width: '80px', defaultVisible: true, group: 'purchaseApplication' },
  { key: 'comment', label: 'コメント', width: '200px', defaultVisible: true, group: 'purchaseApplication' },
  { key: 'currentConnectionStatus', label: 'ネットワーク接続', width: '120px', defaultVisible: false, group: 'purchaseApplication' },
  { key: 'requestConnectionStatus', label: 'ネットワーク接続要望', width: '120px', defaultVisible: false, group: 'purchaseApplication' },

  // 見積・積算
  { key: 'rfqNo', label: '見積依頼No.', width: '130px', defaultVisible: true, group: 'estimate' },
  { key: 'rfqGroupName', label: '見積依頼グループ', width: '150px', defaultVisible: true, group: 'estimate' },
  { key: 'estimatedAmount', label: '積算金額（税別）', width: '130px', defaultVisible: true, group: 'estimate' },
  { key: 'estimatedBasis', label: '積算根拠', width: '150px', defaultVisible: true, group: 'estimate' },
  { key: 'annualUpdateRequest', label: '年度更新要望', width: '120px', defaultVisible: true, group: 'estimate' },

  // 廃棄申請情報
  { key: 'disposalApplicationDate', label: '申請日', width: '120px', defaultVisible: false, group: 'disposalApplication' },
  { key: 'disposalApplicationNo', label: '申請No.', width: '120px', defaultVisible: false, group: 'disposalApplication' },
  { key: 'disposalComment', label: 'コメント（廃棄）', width: '200px', defaultVisible: false, group: 'disposalApplication' },

  // 移動申請情報
  { key: 'transferApplicationDate', label: '申請日', width: '120px', defaultVisible: false, group: 'transferApplication' },
  { key: 'transferApplicationNo', label: '申請No.', width: '120px', defaultVisible: false, group: 'transferApplication' },
  { key: 'transferDivision', label: '部門名（移動先）', width: '120px', defaultVisible: false, group: 'transferApplication' },
  { key: 'transferDepartment', label: '部署名（移動先）', width: '120px', defaultVisible: false, group: 'transferApplication' },
  { key: 'transferRoomName', label: '室名（移動先）', width: '150px', defaultVisible: false, group: 'transferApplication' },
  { key: 'transferParentItem', label: '明細親機', width: '150px', defaultVisible: false, group: 'transferApplication' },
  { key: 'transferComment', label: 'コメント（移動）', width: '200px', defaultVisible: false, group: 'transferApplication' },
];

// 編集リスト用グループラベル・色定義
export const REMODEL_COLUMN_GROUPS: { id: string; label: string; color: string }[] = [
  { id: 'applicationOverview', label: '処理方針', color: '#343a40' },
  { id: 'commonMaster', label: '共通部署マスタ', color: '#6c757d' },
  { id: 'newLocation', label: '(新)設置情報', color: '#0d6efd' },
  { id: 'contract', label: '契約情報', color: '#198754' },
  { id: 'purchaseApplication', label: '購入申請情報', color: '#e67e22' },
  { id: 'estimate', label: '見積・積算', color: '#8e44ad' },
  { id: 'disposalApplication', label: '廃棄申請情報', color: '#dc3545' },
  { id: 'transferApplication', label: '移動申請情報', color: '#0dcaf0' },
];

// リモデル編集リスト用カラムプリセット
export const REMODEL_COLUMN_PRESETS: { id: string; label: string; columns: string[] }[] = [
  {
    id: 'all',
    label: '全カラム',
    columns: [], // 空 = 全て表示
  },
  {
    id: 'hearing',
    label: 'ヒアリング用',
    columns: ['purchaseCategory', 'executionFiscalYear', 'shipDivision', 'shipDepartment', 'newRoomName', 'item', 'maker', 'model', 'quantity', 'comment'],
  },
  {
    id: 'equipment',
    label: '設備条件用',
    columns: ['purchaseCategory', 'newRoomName', 'assetMasterId', 'item', 'maker', 'model', 'width', 'depth', 'height'],
  },
  {
    id: 'rfq',
    label: '見積依頼用',
    columns: ['purchaseCategory', 'rfqNo', 'rfqGroupName', 'item', 'maker', 'model', 'estimatedAmount', 'rfqVendor'],
  },
];

// ユーティリティ関数: カラムのラベルを上書き
export function overrideColumnLabels(
  columns: ColumnDef[],
  overrides: Record<string, string>
): ColumnDef[] {
  return columns.map(col =>
    overrides[col.key] ? { ...col, label: overrides[col.key] } : col
  );
}
