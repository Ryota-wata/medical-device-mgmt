/**
 * 病院別個別施設マスタの型定義
 *
 * リモデル（病院移転新築）時に使用する施設マッピング情報
 * - 現状の設置場所と新居の設置場所を管理
 * - SHIP部署マスタ（DepartmentMaster）と連携し、SHIP体系の対応付けを行う
 * - リモデル完了後、新居の設置場所が現状の設置場所となる
 */

/**
 * 個別施設マスタレコード
 */
export interface HospitalFacilityMaster {
  id: string;
  hospitalId: string;           // 病院ID
  hospitalName: string;         // 病院名（表示用）

  // 旧（現状の設置場所 + SHIPマッピング）
  oldShipDivision: string;      // SHIP部門
  oldShipDepartment: string;    // SHIP部署
  oldShipRoomCategory: string;  // SHIP諸室区分
  oldFloor: string;             // フロア
  oldDepartment: string;        // 部門
  oldSection: string;           // 部署
  oldRoomName: string;          // 室名称

  // 新（新居の設置場所 + SHIPマッピング）
  newShipDivision: string;      // SHIP部門
  newShipDepartment: string;    // SHIP部署
  newShipRoomCategory: string;  // SHIP諸室区分
  newFloor: string;             // フロア
  newDepartment: string;        // 部門
  newSection: string;           // 部署
  newRoomName: string;          // 室名称

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
    shipDivision: string;
    shipDepartment: string;
    shipRoomCategory: string;
    floor: string;
    department: string;
    section: string;
    roomName: string;
  };
  newLocation: {
    shipDivision: string;
    shipDepartment: string;
    shipRoomCategory: string;
    floor: string;
    department: string;
    section: string;
    roomName: string;
  };
}

/**
 * 個別施設マスタのフィルター
 */
export interface HospitalFacilityFilter {
  hospitalId?: string;
  oldFloor?: string;
  oldDepartment?: string;
  newFloor?: string;
  newDepartment?: string;
  status?: HospitalFacilityStatus;
}

/**
 * 現状から新居の設置場所を取得するためのキー
 */
export interface CurrentLocationKey {
  hospitalId: string;
  floor: string;
  department: string;
  section: string;
  roomName: string;
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
