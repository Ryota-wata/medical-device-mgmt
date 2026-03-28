/**
 * 機能ごとの制御可能レベル定義
 *
 * - fixed: 固定（どのレイヤーでも変更不可）
 * - org_configurable: 組織レベルでON/OFF可能（システム管理者が設定）
 * - facility_configurable: 施設レベルでON/OFF可能（施設管理者が設定）
 */

import { FeatureId } from '../utils/permissions';

export type FeatureConfigLevel = 'fixed' | 'org_configurable' | 'facility_configurable';

export interface FeatureConfig {
  featureId: FeatureId;
  level: FeatureConfigLevel;
  label: string;
}

/**
 * 各機能の制御レベル（Excelマッピング表のON・OFF単位列準拠）
 * - ON・OFF単位=ー → fixed
 * - ON・OFF単位=ON・OFF → org_configurable
 * - 上記以外で病院側にON/OFF値がある → facility_configurable
 */
export const FEATURE_CONFIGS: Record<FeatureId, FeatureConfigLevel> = {
  // ── ユーザー管理 ── 固定
  user_facility_access: 'fixed',
  user_management: 'fixed',

  // ── 認証/認可 ── 固定
  auth_login: 'fixed',
  facility_select: 'fixed',
  facility_select_all: 'fixed',

  // ── 原本リスト ──
  original_list_view: 'fixed',
  original_price_column: 'facility_configurable',
  original_list_edit: 'facility_configurable',
  original_application: 'facility_configurable',

  // ── 保守・点検／貸出／修理申請 ──
  daily_inspection: 'org_configurable',
  lending_checkout: 'facility_configurable',
  repair_application: 'fixed',
  application_status: 'fixed',

  // ── 棚卸し ──
  inventory_field: 'org_configurable',
  inventory_office: 'facility_configurable',

  // ── リモデルメニュー ──
  remodel_edit_list: 'org_configurable',
  remodel_purchase: 'org_configurable',
  remodel_order: 'org_configurable',
  remodel_acceptance: 'facility_configurable',
  remodel_quotation: 'org_configurable',

  // ── 編集リスト（通常） ──
  normal_edit_list: 'org_configurable',
  ship_column: 'org_configurable',

  // ── タスク管理 ──
  normal_purchase: 'org_configurable',
  normal_order: 'org_configurable',
  normal_acceptance: 'fixed',
  normal_quotation: 'org_configurable',
  transfer_disposal: 'org_configurable',
  repair_management: 'fixed',
  maintenance_contract: 'fixed',
  inspection_management: 'fixed',
  periodic_inspection: 'fixed',
  lending_management: 'fixed',

  // ── QRコード ──
  qr_issue: 'org_configurable',
  qr_scan: 'fixed',

  // ── データ閲覧（自施設） ──
  own_asset_master_view: 'fixed',
  own_user_master: 'org_configurable',
  own_asset_list: 'fixed',
  own_price_column: 'org_configurable',
  own_estimate: 'facility_configurable',
  own_data_history: 'org_configurable',

  // ── データ閲覧（他施設） ──
  other_asset_list: 'fixed',
  other_price_column: 'org_configurable',
  other_estimate: 'facility_configurable',
  other_data_history: 'org_configurable',

  // ── マスタ管理 ──
  asset_master_list: 'org_configurable',
  facility_master_list: 'fixed',
  dept_vendor_master_list: 'org_configurable',
  asset_master_edit: 'org_configurable',
  facility_master_edit: 'fixed',
  ship_dept_master_edit: 'fixed',
  hospital_dept_master_edit: 'org_configurable',
  vendor_master_edit: 'org_configurable',

  // ── 個体管理リスト作成 ──
  existing_survey: 'fixed',
  survey_data_edit: 'fixed',
  asset_ledger_import: 'fixed',
  survey_ledger_matching: 'fixed',
};

/**
 * 機能が固定（変更不可）かどうか
 */
export function isFixedFeature(featureId: FeatureId): boolean {
  return FEATURE_CONFIGS[featureId] === 'fixed';
}

/**
 * 施設管理者がON/OFF可能な機能かどうか
 */
export function isFacilityConfigurable(featureId: FeatureId): boolean {
  return FEATURE_CONFIGS[featureId] === 'facility_configurable';
}
