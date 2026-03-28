import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FeatureId } from '../utils/permissions';

/**
 * ユーザー単位の権限オーバーライド（レイヤー3: 施設管理者 → ユーザー）
 */
export interface UserPermissionOverride {
  userId: string;
  facilityName: string;
  featureId: FeatureId;
  enabled: boolean;
}

interface UserPermissionOverrideState {
  overrides: UserPermissionOverride[];
  /** ユーザー単位のオーバーライドを設定 */
  setOverride: (userId: string, facilityName: string, featureId: FeatureId, enabled: boolean) => void;
  /** ユーザー単位のオーバーライドを取得 */
  getOverride: (userId: string, facilityName: string, featureId: FeatureId) => boolean | undefined;
  /** 特定ユーザー×施設の全オーバーライドをリセット */
  resetUserFacility: (userId: string, facilityName: string) => void;
  /** 特定ユーザー×施設の全オーバーライドを取得 */
  getUserOverrides: (userId: string, facilityName: string) => UserPermissionOverride[];
}

export const useUserPermissionOverrideStore = create<UserPermissionOverrideState>()(
  persist(
    (set, get) => ({
      overrides: [],

      setOverride: (userId, facilityName, featureId, enabled) => {
        set((state) => {
          const filtered = state.overrides.filter(
            (o) => !(o.userId === userId && o.facilityName === facilityName && o.featureId === featureId)
          );
          if (!enabled) {
            filtered.push({ userId, facilityName, featureId, enabled: false });
          }
          return { overrides: filtered };
        });
      },

      getOverride: (userId, facilityName, featureId) => {
        const override = get().overrides.find(
          (o) => o.userId === userId && o.facilityName === facilityName && o.featureId === featureId
        );
        if (!override) return undefined;
        return override.enabled;
      },

      resetUserFacility: (userId, facilityName) => {
        set((state) => ({
          overrides: state.overrides.filter(
            (o) => !(o.userId === userId && o.facilityName === facilityName)
          ),
        }));
      },

      getUserOverrides: (userId, facilityName) => {
        return get().overrides.filter(
          (o) => o.userId === userId && o.facilityName === facilityName
        );
      },
    }),
    {
      name: 'user-permission-override-storage',
    }
  )
);
