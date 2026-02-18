/**
 * 権限チェック用カスタムフック
 */

import { useMemo } from 'react';
import { useAuthStore } from '../stores';
import {
  FeatureId,
  MainButtonId,
  PermissionLevel,
  getPermissionLevel,
  canAccess,
  canView,
  canEdit,
  canCreate,
  hasFullAccess,
  isMainButtonVisible,
  getVisibleMainButtons,
  canAccessFacility,
} from '../utils/permissions';

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
  /** admin ロールか */
  isAdmin: boolean;
  /** SHIP側ロールか（admin, consultant, sales） */
  isShipUser: boolean;
  /** 病院側ロールか（office_admin, office_staff, clinical_staff） */
  isHospitalUser: boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuthStore();
  const role = user?.role ?? null;

  return useMemo(() => {
    // ロールがない場合はすべて不可
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
      };
    }

    const isAdmin = role === 'admin';
    const isShipUser = role === 'admin' || role === 'consultant' || role === 'sales';
    const isHospitalUser = role === 'office_admin' || role === 'office_staff' || role === 'clinical_staff';

    return {
      role,
      getPermission: (featureId: FeatureId) => getPermissionLevel(featureId, role),
      canAccess: (featureId: FeatureId) => canAccess(featureId, role),
      canView: (featureId: FeatureId) => canView(featureId, role),
      canEdit: (featureId: FeatureId) => canEdit(featureId, role),
      canCreate: (featureId: FeatureId) => canCreate(featureId, role),
      hasFullAccess: (featureId: FeatureId) => hasFullAccess(featureId, role),
      isMainButtonVisible: (buttonId: MainButtonId) => isMainButtonVisible(buttonId, role),
      visibleMainButtons: getVisibleMainButtons(role),
      canAccessFacility: (facilityName: string) =>
        canAccessFacility(role, facilityName, user?.hospital, user?.accessibleFacilities),
      isAdmin,
      isShipUser,
      isHospitalUser,
    };
  }, [role, user?.hospital, user?.accessibleFacilities]);
}
