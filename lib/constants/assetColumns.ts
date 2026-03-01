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

// リモデル申請画面用のカラム定義（不要なカラムを除外）
const EXCLUDED_COLUMNS = ['managementNo', 'roomName', 'installationLocation', 'quantityUnit', 'item'];

// 作業用カラム（見積依頼関連）
const WORK_COLUMNS: ColumnDef[] = [
  { key: 'rfqNo', label: '見積依頼No.', width: '130px', defaultVisible: true, group: 'work' },
  { key: 'rfqGroupName', label: 'グループ名称', width: '150px', defaultVisible: true, group: 'work' },
  { key: 'rfqVendor', label: '見積業者', width: '150px', defaultVisible: true, group: 'work' },
  { key: 'rfqAmount', label: '見積金額', width: '120px', defaultVisible: true, group: 'work' },
];

// 申請関連カラム（入力項目ごと）
const APPLICATION_COLUMNS: ColumnDef[] = [
  // 基本申請情報
  { key: 'applicationCategory', label: '要望区分', width: '100px', defaultVisible: true, group: 'application' },
  { key: 'applicationNo', label: '申請No.', width: '120px', defaultVisible: true, group: 'application' },
  { key: 'applicantName', label: '申請者', width: '100px', defaultVisible: false, group: 'application' },
  { key: 'applicantDepartment', label: '申請部署', width: '120px', defaultVisible: false, group: 'application' },
  { key: 'applicationDate', label: '申請日', width: '120px', defaultVisible: false, group: 'application' },
  { key: 'priority', label: '優先順位', width: '80px', defaultVisible: false, group: 'application' },
  { key: 'desiredDeliveryDate', label: '希望納期', width: '120px', defaultVisible: true, group: 'application' },
  // 使用用途及び件数
  { key: 'usagePurpose', label: '用途', width: '150px', defaultVisible: true, group: 'applicationDetail' },
  { key: 'caseCount', label: '症例数', width: '100px', defaultVisible: false, group: 'applicationDetail' },
  // コメント・添付ファイル
  { key: 'comment', label: 'コメント', width: '200px', defaultVisible: true, group: 'applicationDetail' },
  { key: 'attachedFiles', label: '添付ファイル', width: '150px', defaultVisible: false, group: 'applicationDetail' },
  // システム接続要望
  { key: 'currentConnectionStatus', label: '現在の接続状況', width: '120px', defaultVisible: false, group: 'connection' },
  { key: 'currentConnectionDestination', label: '現在の接続先', width: '150px', defaultVisible: false, group: 'connection' },
  { key: 'requestConnectionStatus', label: '接続要望', width: '100px', defaultVisible: false, group: 'connection' },
  { key: 'requestConnectionDestination', label: '要望接続先', width: '150px', defaultVisible: false, group: 'connection' },
];

export const REMODEL_COLUMNS: ColumnDef[] = [
  ...APPLICATION_COLUMNS,
  ...ASSET_COLUMNS
    .filter(col => !EXCLUDED_COLUMNS.includes(col.key))
    .map(col => col.key === 'name' ? { ...col, label: '品目' } : col)
    .flatMap(col => col.key === 'model' ? [col, ...WORK_COLUMNS] : [col])
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
