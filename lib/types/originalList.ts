/**
 * 原本リスト関連の型定義
 *
 * 原本リストは、リモデル前の資産台帳データを管理し、
 * 個別施設マスタのマッピング情報と連携して新居への移動を支援する
 */

/**
 * 原本リストのステータス
 */
export type OriginalListStatus =
  | 'pending'      // 未処理（マッピング待ち）
  | 'mapped'       // マッピング済（新居情報設定済み）
  | 'approved'     // 承認済（リモデル申請承認）
  | 'completed'    // 完了（移動完了）
  | 'cancelled';   // キャンセル

/**
 * 原本リストアイテム
 */
export interface OriginalListItem {
  id: string;
  hospitalId: string;       // 病院ID（施設名）
  hospitalName: string;     // 病院名

  // 資産識別情報
  qrCode?: string;          // QRコード
  assetNo?: string;         // 固定資産番号
  managementNo?: string;    // 管理機器番号

  // 資産基本情報
  assetName: string;        // 資産名称
  category?: string;        // カテゴリ
  largeClass?: string;      // 大分類
  mediumClass?: string;     // 中分類
  maker?: string;           // メーカー
  model?: string;           // 型式
  serialNumber?: string;    // シリアル番号
  quantity: number;         // 数量
  quantityUnit?: string;    // 単位

  // 現状の設置場所（リモデル前）
  currentFloor: string;     // 階
  currentDepartment: string; // 部門・部署
  currentRoom: string;      // 部屋名
  currentBuilding?: string; // 建物
  currentSection?: string;  // 区画

  // 新居の設置場所（リモデル後）- 個別施設マスタから自動マッピングまたは手動設定
  newFloor?: string;        // 新居 - 階
  newDepartment?: string;   // 新居 - 部門・部署
  newRoom?: string;         // 新居 - 部屋名
  newBuilding?: string;     // 新居 - 建物
  newSection?: string;      // 新居 - 区画

  // 契約・取得情報
  acquisitionCost?: number;   // 取得価格
  acquisitionDate?: string;   // 取得日
  contractNo?: string;        // 契約番号
  leaseInfo?: string;         // リース情報
  leaseStartDate?: string;    // リース開始日
  leaseEndDate?: string;      // リース終了日

  // 寸法
  width?: number | string;
  depth?: number | string;
  height?: number | string;

  // ステータス・管理情報
  status: OriginalListStatus;
  mappedAt?: string;          // マッピング日時
  mappedBy?: string;          // マッピング実施者
  approvedAt?: string;        // 承認日時
  approvedBy?: string;        // 承認者
  completedAt?: string;       // 完了日時

  // リモデル申請との紐付け
  remodelApplicationId?: string;  // リモデル申請ID

  // メタ情報
  notes?: string;             // 備考
  createdAt: string;
  updatedAt: string;
}

/**
 * 原本リストインポートデータ（CSV取込用）
 */
export interface OriginalListImportData {
  assetNo?: string;
  managementNo?: string;
  assetName: string;
  category?: string;
  largeClass?: string;
  mediumClass?: string;
  maker?: string;
  model?: string;
  serialNumber?: string;
  quantity?: number;
  quantityUnit?: string;
  floor: string;
  department: string;
  room: string;
  building?: string;
  section?: string;
  acquisitionCost?: number;
  acquisitionDate?: string;
  contractNo?: string;
  leaseInfo?: string;
  width?: number | string;
  depth?: number | string;
  height?: number | string;
  notes?: string;
}

/**
 * 原本リストフィルター
 */
export interface OriginalListFilter {
  hospitalId?: string;
  status?: OriginalListStatus | '';
  floor?: string;
  department?: string;
  searchQuery?: string;
  hasMappingOnly?: boolean;  // マッピング済のみ表示
}

/**
 * 原本リスト統計
 */
export interface OriginalListStats {
  total: number;
  pending: number;
  mapped: number;
  approved: number;
  completed: number;
  cancelled: number;
  mappingRate: number;  // マッピング率（%）
}

/**
 * ステータスバッジのスタイルを返す
 */
export function getOriginalListStatusBadgeStyle(status: OriginalListStatus): {
  background: string;
  color: string;
  label: string;
} {
  switch (status) {
    case 'pending':
      return { background: '#fef3c7', color: '#92400e', label: '未処理' };
    case 'mapped':
      return { background: '#dbeafe', color: '#1e40af', label: 'マッピング済' };
    case 'approved':
      return { background: '#d1fae5', color: '#065f46', label: '承認済' };
    case 'completed':
      return { background: '#dcfce7', color: '#166534', label: '完了' };
    case 'cancelled':
      return { background: '#f3f4f6', color: '#6b7280', label: 'キャンセル' };
    default:
      return { background: '#f3f4f6', color: '#6b7280', label: '不明' };
  }
}

/**
 * 原本リストアイテムの新居情報が完全かどうかチェック
 */
export function hasCompleteNewLocation(item: OriginalListItem): boolean {
  return !!(item.newFloor && item.newDepartment && item.newRoom);
}
