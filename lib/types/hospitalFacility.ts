/**
 * 病院別個別施設マスタの型定義
 *
 * リモデル（病院移転新築）時に使用する施設マッピング情報
 * - 現状の設置場所と新居の設置場所を管理
 * - リモデル完了後、新居の設置場所が現状の設置場所となる
 */

/**
 * 個別施設マスタレコード
 */
export interface HospitalFacilityMaster {
  id: string;
  hospitalId: string;           // 病院ID
  hospitalName: string;         // 病院名（表示用）

  // 現状の設置場所
  currentBuilding: string;      // 現状の棟
  currentFloor: string;         // 現状の階
  currentDepartment: string;    // 現状の部門・部署
  currentSection: string;       // 現状の部署

  // 新居の設置場所
  newBuilding: string;          // 新居の棟
  newFloor: string;             // 新居の階
  newDepartment: string;        // 新居の部門・部署
  newSection: string;           // 新居の部署

  // 管理情報
  status: HospitalFacilityStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * 個別施設マスタのステータス
 */
export type HospitalFacilityStatus =
  | 'draft'       // 下書き（マッピング未完了）
  | 'mapped'      // マッピング完了（リモデル申請可能）
  | 'completed';  // リモデル完了（新居が現状になった）

/**
 * 病院情報（個別施設マスタの親）
 */
export interface HospitalInfo {
  id: string;
  name: string;
  remodelStatus: RemodelProjectStatus;
  facilityCount: number;        // 施設マスタ件数
  completedCount: number;       // 完了件数
  createdAt: string;
  updatedAt: string;
}

/**
 * リモデルプロジェクトのステータス
 */
export type RemodelProjectStatus =
  | 'preparing'     // 準備中（施設マスタ作成中）
  | 'in_progress'   // 進行中（申請受付中）
  | 'completed';    // 完了（全申請完了）

/**
 * 施設マッピング検索結果
 */
export interface FacilityMapping {
  currentLocation: {
    building: string;
    floor: string;
    department: string;
    section: string;
  };
  newLocation: {
    building: string;
    floor: string;
    department: string;
    section: string;
  };
}

/**
 * 個別施設マスタのフィルター
 */
export interface HospitalFacilityFilter {
  hospitalId?: string;
  currentFloor?: string;
  currentDepartment?: string;
  newFloor?: string;
  newDepartment?: string;
  status?: HospitalFacilityStatus;
}

/**
 * 現状から新居の設置場所を取得するためのキー
 */
export interface CurrentLocationKey {
  hospitalId: string;
  building: string;
  floor: string;
  department: string;
  section: string;
}

/**
 * リモデル完了処理（新居→現状への切り替え）
 */
export interface RemodelCompletionData {
  hospitalId: string;
  facilityIds: string[];        // 完了対象の施設マスタID
  completedAt: string;
  completedBy: string;
}
