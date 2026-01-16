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
  { key: 'qrCode', label: 'QRコード', width: '150px', defaultVisible: true, group: 'basic' },
  { key: 'assetNo', label: '固定資産番号', width: '150px', defaultVisible: false, group: 'basic' },
  { key: 'managementNo', label: '管理機器番号', width: '150px', defaultVisible: false, group: 'basic' },

  // 設置場所
  { key: 'building', label: '棟', width: '100px', defaultVisible: true, group: 'location' },
  { key: 'floor', label: '階', width: '80px', defaultVisible: true, group: 'location' },
  { key: 'department', label: '部門', width: '120px', defaultVisible: true, group: 'location' },
  { key: 'section', label: '部署名', width: '120px', defaultVisible: false, group: 'location' },
  { key: 'roomClass1', label: '諸室区分①', width: '120px', defaultVisible: false, group: 'location' },
  { key: 'roomClass2', label: '諸室区分②', width: '120px', defaultVisible: false, group: 'location' },
  { key: 'roomName', label: '諸室名称', width: '150px', defaultVisible: false, group: 'location' },
  { key: 'installationLocation', label: '設置場所', width: '150px', defaultVisible: false, group: 'location' },

  // 機器分類
  { key: 'category', label: 'Category', width: '120px', defaultVisible: false, group: 'classification' },
  { key: 'largeClass', label: '大分類', width: '150px', defaultVisible: false, group: 'classification' },
  { key: 'mediumClass', label: '中分類', width: '150px', defaultVisible: false, group: 'classification' },
  { key: 'item', label: '品目', width: '150px', defaultVisible: false, group: 'classification' },

  // 機器仕様
  { key: 'name', label: '個体管理名称', width: '200px', defaultVisible: true, group: 'specification' },
  { key: 'maker', label: 'メーカー名', width: '150px', defaultVisible: true, group: 'specification' },
  { key: 'model', label: '型式', width: '150px', defaultVisible: true, group: 'specification' },
  { key: 'quantityUnit', label: '数量／単位', width: '120px', defaultVisible: false, group: 'specification' },
  { key: 'quantity', label: '数量', width: '80px', defaultVisible: false, group: 'specification' },
  { key: 'serialNumber', label: 'シリアル番号', width: '150px', defaultVisible: false, group: 'specification' },

  // サイズ
  { key: 'width', label: 'W', width: '80px', defaultVisible: false, group: 'size' },
  { key: 'depth', label: 'D', width: '80px', defaultVisible: false, group: 'size' },
  { key: 'height', label: 'H', width: '80px', defaultVisible: false, group: 'size' },

  // 契約情報
  { key: 'contractName', label: '契約･見積名称', width: '180px', defaultVisible: false, group: 'contract' },
  { key: 'contractNo', label: '契約番号（契約単位）', width: '180px', defaultVisible: false, group: 'contract' },
  { key: 'quotationNo', label: '見積番号', width: '120px', defaultVisible: false, group: 'contract' },
  { key: 'contractDate', label: '契約･発注日', width: '120px', defaultVisible: false, group: 'contract' },
  { key: 'deliveryDate', label: '納品日', width: '120px', defaultVisible: false, group: 'contract' },
  { key: 'inspectionDate', label: '検収日', width: '120px', defaultVisible: false, group: 'contract' },

  // リース情報
  { key: 'lease', label: 'リース', width: '80px', defaultVisible: false, group: 'lease' },
  { key: 'rental', label: '借用', width: '80px', defaultVisible: false, group: 'lease' },
  { key: 'leaseStartDate', label: 'リース開始日', width: '120px', defaultVisible: false, group: 'lease' },
  { key: 'leaseEndDate', label: 'リース終了日', width: '120px', defaultVisible: false, group: 'lease' },

  // 財務情報
  { key: 'acquisitionCost', label: '取得価格', width: '120px', defaultVisible: false, group: 'financial' },
  { key: 'assetInfo', label: '資産情報', width: '200px', defaultVisible: false, group: 'financial' },

  // 耐用年数
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

export const REMODEL_COLUMNS: ColumnDef[] = [
  { key: 'applicationStatus', label: '要望区分', width: '150px', defaultVisible: true, group: 'status' },
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
