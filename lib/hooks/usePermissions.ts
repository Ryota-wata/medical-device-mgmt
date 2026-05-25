/**
 * 権限チェック用カスタムフック
 */

import { useMemo } from 'react';
import {
  useAuthStore,
  useFacilityGroupStore,
} from '../stores';
import { getRoleCategory } from '../types/user';
import type { SharingDataType } from '../types/facilityGroup';
import type { RoleCategory } from '../types/user';
import {
  FeatureId,
  MainButtonId,
  PermissionLevel,
} from '../utils/permissions';

// メイン画面ボタン全 ID (ロール撤廃で全表示)
const ALL_MAIN_BUTTONS: MainButtonId[] = [
  'asset_list',
  'edit_list',
  'purchase_management',
  'maintenance_inspection',
  'lending_management',
  'repair_request',
  'asset_survey',
  'inventory',
  'master_management',
  'quotation_management',
  'user_management',
];

export interface UsePermissionsReturn {
  /** ユーザーのロール */
  role: string | null;
  /** 機能に対する権限レベルを取得 */
  getPermission: (featureId: FeatureId) => PermissionLevel;
  /** 機能にアクセス可能か */
  canAccess: (featureId: FeatureId) => boolean;
  /** 機能を閲覧可能か */
  canView: (featureId: FeatureId) => boolean;
  /** 機能を編集可能か */
  canEdit: (featureId: FeatureId) => boolean;
  /** 機能で作成可能か */
  canCreate: (featureId: FeatureId) => boolean;
  /** フルアクセス権限があるか */
  hasFullAccess: (featureId: FeatureId) => boolean;
  /** メイン画面ボタンが表示可能か */
  isMainButtonVisible: (buttonId: MainButtonId) => boolean;
  /** 表示可能なメイン画面ボタン一覧 */
  visibleMainButtons: MainButtonId[];
  /** 施設にアクセス可能か */
  canAccessFacility: (facilityName: string) => boolean;
  /** system_admin ロールか */
  isAdmin: boolean;
  /** SHIP側ロールか（system_admin, org_default_*） */
  isShipUser: boolean;
  /** 病院側ロールか（hospital_*, dedicated_*） */
  isHospitalUser: boolean;
  /** 施設管理者か（hospital_sys_admin） */
  isFacilityAdmin: boolean;
  /** ロールカテゴリ */
  roleCategory: RoleCategory | null;
  /** 他施設の共有データにアクセスできるか */
  canAccessSharedData: (facilityName: string, dataType: SharingDataType) => boolean;
}

export function usePermissions(): UsePermissionsReturn {
  // ロール撤廃: 全ユーザーをシステム管理者として扱い、すべての機能/画面を許可する。
  // 機能権限は別途「機能権限管理 (PU-xxx)」画面で施設/ユーザー単位の ON/OFF を制御する設計に移行したが、
  // mock 動作および画面設計書作成のため、ここでは全機能を可視化する。
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? null;
  const roleCategory = role ? getRoleCategory(role) : null;

  return useMemo(() => {
    // 未ログイン時のみすべて不可 (ログインガード維持)
    if (!role) {
      return {
        role: null,
        getPermission: () => 'X' as PermissionLevel,
        canAccess: () => false,
        canView: () => false,
        canEdit: () => false,
        canCreate: () => false,
        hasFullAccess: () => false,
        isMainButtonVisible: () => false,
        visibleMainButtons: [],
        canAccessFacility: () => false,
        isAdmin: false,
        isShipUser: false,
        isHospitalUser: false,
        isFacilityAdmin: false,
        roleCategory: null,
        canAccessSharedData: () => false,
      };
    }

    return {
      role,
      getPermission: () => 'F' as PermissionLevel,
      canAccess: () => true,
      canView: () => true,
      canEdit: () => true,
      canCreate: () => true,
      hasFullAccess: () => true,
      isMainButtonVisible: () => true,
      visibleMainButtons: ALL_MAIN_BUTTONS,
      canAccessFacility: () => true,
      isAdmin: true,
      isShipUser: true,
      isHospitalUser: true,
      isFacilityAdmin: true,
      roleCategory,
      canAccessSharedData: () => true,
    };
  }, [role, roleCategory]);
}
