import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole } from '../types';
import { FeatureId } from '../utils/permissions';

/**
 * @deprecated 旧 ロール×施設×機能 オーバーライドストア。
 * ISSUE-0016（2026-05-08 解決）以降、新しい権限管理 UI は
 * `facilityFeatureStore`（施設×PU）と `userFeatureStore`（ユーザー×施設×PU）に移行済み。
 * 本ストアは `lib/hooks/usePermissions.ts` 経由で旧ロール体系の認可判定にまだ使われているため
 * 残置中。完全削除は ISSUE-0017（runtime permission gate を新ストアに切替）で追跡。
 */
export interface PermissionOverride {
  facilityName: string;
  role: UserRole;
  featureId: FeatureId;
  enabled: boolean;
}

interface PermissionOverrideState {
  overrides: PermissionOverride[];
  /** 特定の施設・ロール・機能のオーバーライドを設定 */
  setOverride: (facilityName: string, role: UserRole, featureId: FeatureId, enabled: boolean) => void;
  /** 特定の施設・ロール・機能のオーバーライド状態を取得（undefined=デフォルト適用） */
  getOverride: (facilityName: string, role: UserRole, featureId: FeatureId) => boolean | undefined;
  /** 特定の施設・ロールの全オーバーライドをリセット */
  resetFacilityRole: (facilityName: string, role: UserRole) => void;
  /** 他施設の設定を一括コピー */
  copyFromFacility: (sourceFacility: string, targetFacility: string) => void;
}

export const usePermissionOverrideStore = create<PermissionOverrideState>()(
  persist(
    (set, get) => ({
      overrides: [],

      setOverride: (facilityName, role, featureId, enabled) => {
        set((state) => {
          // 既存のオーバーライドを除外
          const filtered = state.overrides.filter(
            (o) => !(o.facilityName === facilityName && o.role === role && o.featureId === featureId)
          );
          // enabled=true（デフォルト通り）ならエントリを削除、false（強制OFF）なら追加
          if (!enabled) {
            filtered.push({ facilityName, role, featureId, enabled: false });
          }
          return { overrides: filtered };
        });
      },

      getOverride: (facilityName, role, featureId) => {
        const override = get().overrides.find(
          (o) => o.facilityName === facilityName && o.role === role && o.featureId === featureId
        );
        if (!override) return undefined;
        return override.enabled;
      },

      resetFacilityRole: (facilityName, role) => {
        set((state) => ({
          overrides: state.overrides.filter(
            (o) => !(o.facilityName === facilityName && o.role === role)
          ),
        }));
      },

      copyFromFacility: (sourceFacility, targetFacility) => {
        set((state) => {
          // ターゲット施設の既存設定を削除
          const withoutTarget = state.overrides.filter(
            (o) => o.facilityName !== targetFacility
          );
          // ソース施設の設定をコピー
          const sourceOverrides = state.overrides
            .filter((o) => o.facilityName === sourceFacility)
            .map((o) => ({ ...o, facilityName: targetFacility }));
          return { overrides: [...withoutTarget, ...sourceOverrides] };
        });
      },
    }),
    {
      name: 'permission-override-storage',
    }
  )
);
