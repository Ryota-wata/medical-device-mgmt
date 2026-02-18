/**
 * ロール別権限定義
 *
 * 権限レベル:
 * - F: フルアクセス（全操作可能）
 * - W: 閲覧 + 編集
 * - R: 閲覧のみ
 * - C: 作成 + 自分の申請の閲覧
 * - X: アクセス不可
 */

import { UserRole } from '../types';

export type PermissionLevel = 'F' | 'W' | 'R' | 'C' | 'X';

/**
 * 機能ID一覧
 */
export type FeatureId =
  // メイン画面
  | 'main'
  // 資産関連
  | 'asset_search'
  | 'asset_detail'
  | 'asset_edit'
  | 'edit_list_create'
  // 現有資産調査
  | 'offline_prep'
  | 'survey_location'
  | 'asset_survey'
  | 'survey_history'
  // 棚卸
  | 'inventory'
  // QRコード
  | 'qr_issue'
  | 'qr_print'
  // 購入管理
  | 'quotation_data_box'
  | 'quotation_processing'
  // 修理
  | 'repair_request'
  | 'repair_task'
  // 貸出
  | 'lending_available'
  | 'lending_checkout'
  | 'lending_task'
  // 点検
  | 'daily_inspection'
  | 'inspection_prep'
  | 'inspection_result'
  // 保守
  | 'maintenance_quote'
  | 'maker_maintenance_result'
  // 廃棄
  | 'disposal_task'
  // マスタ管理
  | 'ship_asset_master'
  | 'ship_facility_master'
  | 'ship_department_master'
  | 'hospital_facility_master'
  // ユーザー管理
  | 'user_management'
  // データ管理
  | 'asset_import'
  | 'data_matching';

/**
 * メイン画面ボタンID
 */
export type MainButtonId =
  | 'asset_list'
  | 'edit_list'
  | 'purchase_management'
  | 'maintenance_inspection'
  | 'lending_management'
  | 'repair_request'
  | 'asset_survey'
  | 'master_management'
  | 'user_management';

/**
 * 権限マトリクス
 */
const PERMISSION_MATRIX: Record<FeatureId, Record<UserRole, PermissionLevel>> = {
  // メイン画面
  main: { admin: 'F', consultant: 'W', sales: 'R', office_admin: 'W', office_staff: 'W', clinical_staff: 'R' },

  // 資産関連
  asset_search: { admin: 'F', consultant: 'R', sales: 'R', office_admin: 'W', office_staff: 'R', clinical_staff: 'R' },
  asset_detail: { admin: 'F', consultant: 'R', sales: 'R', office_admin: 'W', office_staff: 'W', clinical_staff: 'R' },
  asset_edit: { admin: 'F', consultant: 'X', sales: 'X', office_admin: 'W', office_staff: 'W', clinical_staff: 'X' },
  edit_list_create: { admin: 'F', consultant: 'W', sales: 'X', office_admin: 'X', office_staff: 'X', clinical_staff: 'X' },

  // 現有資産調査
  offline_prep: { admin: 'F', consultant: 'W', sales: 'X', office_admin: 'W', office_staff: 'W', clinical_staff: 'W' },
  survey_location: { admin: 'F', consultant: 'W', sales: 'X', office_admin: 'W', office_staff: 'W', clinical_staff: 'W' },
  asset_survey: { admin: 'F', consultant: 'W', sales: 'X', office_admin: 'W', office_staff: 'W', clinical_staff: 'W' },
  survey_history: { admin: 'F', consultant: 'W', sales: 'X', office_admin: 'W', office_staff: 'W', clinical_staff: 'W' },

  // 棚卸
  inventory: { admin: 'F', consultant: 'W', sales: 'X', office_admin: 'W', office_staff: 'W', clinical_staff: 'R' },

  // QRコード
  qr_issue: { admin: 'F', consultant: 'W', sales: 'X', office_admin: 'W', office_staff: 'W', clinical_staff: 'X' },
  qr_print: { admin: 'F', consultant: 'W', sales: 'X', office_admin: 'W', office_staff: 'W', clinical_staff: 'X' },

  // タスク管理（quotation_data_box）
  quotation_data_box: { admin: 'F', consultant: 'W', sales: 'R', office_admin: 'W', office_staff: 'W', clinical_staff: 'X' },
  quotation_processing: { admin: 'F', consultant: 'X', sales: 'R', office_admin: 'W', office_staff: 'W', clinical_staff: 'X' },

  // 修理
  repair_request: { admin: 'F', consultant: 'X', sales: 'X', office_admin: 'W', office_staff: 'W', clinical_staff: 'C' },
  repair_task: { admin: 'F', consultant: 'W', sales: 'R', office_admin: 'W', office_staff: 'W', clinical_staff: 'X' },

  // 貸出
  lending_available: { admin: 'F', consultant: 'X', sales: 'R', office_admin: 'W', office_staff: 'W', clinical_staff: 'R' },
  lending_checkout: { admin: 'F', consultant: 'X', sales: 'X', office_admin: 'W', office_staff: 'W', clinical_staff: 'W' },
  lending_task: { admin: 'F', consultant: 'W', sales: 'R', office_admin: 'W', office_staff: 'W', clinical_staff: 'X' },

  // 点検
  daily_inspection: { admin: 'F', consultant: 'X', sales: 'X', office_admin: 'W', office_staff: 'W', clinical_staff: 'W' },
  inspection_prep: { admin: 'F', consultant: 'W', sales: 'X', office_admin: 'W', office_staff: 'W', clinical_staff: 'X' },
  inspection_result: { admin: 'F', consultant: 'W', sales: 'X', office_admin: 'W', office_staff: 'W', clinical_staff: 'R' },

  // 保守
  maintenance_quote: { admin: 'F', consultant: 'X', sales: 'R', office_admin: 'W', office_staff: 'W', clinical_staff: 'X' },
  maker_maintenance_result: { admin: 'F', consultant: 'W', sales: 'R', office_admin: 'W', office_staff: 'W', clinical_staff: 'X' },

  // 廃棄
  disposal_task: { admin: 'F', consultant: 'W', sales: 'X', office_admin: 'W', office_staff: 'W', clinical_staff: 'X' },

  // マスタ管理
  ship_asset_master: { admin: 'F', consultant: 'R', sales: 'X', office_admin: 'X', office_staff: 'X', clinical_staff: 'X' },
  ship_facility_master: { admin: 'F', consultant: 'R', sales: 'X', office_admin: 'X', office_staff: 'X', clinical_staff: 'X' },
  ship_department_master: { admin: 'F', consultant: 'R', sales: 'X', office_admin: 'X', office_staff: 'X', clinical_staff: 'X' },
  hospital_facility_master: { admin: 'F', consultant: 'R', sales: 'X', office_admin: 'W', office_staff: 'R', clinical_staff: 'X' },

  // ユーザー管理
  user_management: { admin: 'F', consultant: 'X', sales: 'X', office_admin: 'W', office_staff: 'X', clinical_staff: 'X' },

  // データ管理
  asset_import: { admin: 'F', consultant: 'W', sales: 'X', office_admin: 'W', office_staff: 'X', clinical_staff: 'X' },
  data_matching: { admin: 'F', consultant: 'W', sales: 'X', office_admin: 'W', office_staff: 'X', clinical_staff: 'X' },
};

/**
 * メイン画面ボタン表示マトリクス
 */
const MAIN_BUTTON_VISIBILITY: Record<MainButtonId, Record<UserRole, boolean>> = {
  asset_list: { admin: true, consultant: true, sales: true, office_admin: true, office_staff: true, clinical_staff: true },
  edit_list: { admin: true, consultant: true, sales: false, office_admin: false, office_staff: false, clinical_staff: false },
  purchase_management: { admin: true, consultant: true, sales: true, office_admin: true, office_staff: true, clinical_staff: false },
  maintenance_inspection: { admin: true, consultant: false, sales: false, office_admin: true, office_staff: true, clinical_staff: true },
  lending_management: { admin: true, consultant: false, sales: false, office_admin: true, office_staff: true, clinical_staff: true },
  repair_request: { admin: true, consultant: false, sales: false, office_admin: true, office_staff: true, clinical_staff: true },
  asset_survey: { admin: true, consultant: true, sales: false, office_admin: true, office_staff: true, clinical_staff: true },
  master_management: { admin: true, consultant: true, sales: false, office_admin: true, office_staff: false, clinical_staff: false },
  user_management: { admin: true, consultant: false, sales: false, office_admin: true, office_staff: false, clinical_staff: false },
};

/**
 * 機能に対する権限レベルを取得
 */
export function getPermissionLevel(featureId: FeatureId, role: UserRole): PermissionLevel {
  return PERMISSION_MATRIX[featureId]?.[role] ?? 'X';
}

/**
 * 機能にアクセス可能かどうか（X以外ならアクセス可能）
 */
export function canAccess(featureId: FeatureId, role: UserRole): boolean {
  return getPermissionLevel(featureId, role) !== 'X';
}

/**
 * 機能を閲覧可能かどうか（R, C, W, F のいずれか）
 */
export function canView(featureId: FeatureId, role: UserRole): boolean {
  const level = getPermissionLevel(featureId, role);
  return ['R', 'C', 'W', 'F'].includes(level);
}

/**
 * 機能を編集可能かどうか（W, F のいずれか）
 */
export function canEdit(featureId: FeatureId, role: UserRole): boolean {
  const level = getPermissionLevel(featureId, role);
  return ['W', 'F'].includes(level);
}

/**
 * 機能で作成可能かどうか（C, W, F のいずれか）
 */
export function canCreate(featureId: FeatureId, role: UserRole): boolean {
  const level = getPermissionLevel(featureId, role);
  return ['C', 'W', 'F'].includes(level);
}

/**
 * フルアクセス権限があるかどうか
 */
export function hasFullAccess(featureId: FeatureId, role: UserRole): boolean {
  return getPermissionLevel(featureId, role) === 'F';
}

/**
 * メイン画面のボタンが表示可能かどうか
 */
export function isMainButtonVisible(buttonId: MainButtonId, role: UserRole): boolean {
  return MAIN_BUTTON_VISIBILITY[buttonId]?.[role] ?? false;
}

/**
 * 表示可能なメイン画面ボタンの一覧を取得
 */
export function getVisibleMainButtons(role: UserRole): MainButtonId[] {
  return (Object.keys(MAIN_BUTTON_VISIBILITY) as MainButtonId[]).filter(
    (buttonId) => isMainButtonVisible(buttonId, role)
  );
}

/**
 * ユーザーが施設にアクセス可能かどうか
 * consultant は accessibleFacilities に含まれる施設のみアクセス可能
 * office_admin/office_staff/clinical_staff は所属施設のみアクセス可能
 */
export function canAccessFacility(
  role: UserRole,
  facilityName: string,
  userHospital?: string,
  accessibleFacilities?: string[]
): boolean {
  // admin は全施設アクセス可能
  if (role === 'admin') return true;

  // consultant は担当施設のみ
  if (role === 'consultant') {
    if (!accessibleFacilities || accessibleFacilities.length === 0) return false;
    if (accessibleFacilities.includes('全施設')) return true;
    return accessibleFacilities.includes(facilityName);
  }

  // sales は閲覧のみなので施設制限なし
  if (role === 'sales') return true;

  // 病院側ロールは所属施設のみ
  if (role === 'office_admin' || role === 'office_staff' || role === 'clinical_staff') {
    return userHospital === facilityName;
  }

  return false;
}
