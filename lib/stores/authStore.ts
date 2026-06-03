import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, LoginCredentials } from '../types';

/**
 * テスト用ユーザーデータ
 */
export interface TestUser {
  email: string;
  role: UserRole;
  roleLabel: string;
  name: string;
  hospital?: string;
  department?: string;
  section?: string;
  accessibleFacilities?: string[];
  /** テストユーザー一覧のカテゴリ表示用 */
  category: 'system' | 'org_default' | 'hospital' | 'dedicated';
}

/**
 * ロール撤廃後の TEST_USERS (4 アカウント)
 *
 * 新仕様 (2026-05-25 確定):
 * - ロールという考え方は廃止
 * - システム管理者 → コンサル/病院 へ機能権限を設定 (PU-xxx 管理単位)
 * - 病院内管理者 → 院内ユーザーへ機能権限を設定
 * - すべて system_admin で動作させ、画面側のロール分岐は撤廃 (usePermissions が全 ON 化)
 *
 * 施設識別用に複数アカウントを残す (SHIP / 病院 A / 病院 B)。
 */
export const TEST_USERS: TestUser[] = [
  {
    email: 'admin@ship.com',
    role: 'system_admin',
    roleLabel: 'システム管理者 (SHIP)',
    name: '管理者 太郎',
    accessibleFacilities: ['全施設'],
    category: 'system',
  },
  {
    email: 'admin-tokyo@hospital.com',
    role: 'system_admin',
    roleLabel: 'システム管理者 (東京中央病院)',
    name: '佐藤 美智子',
    hospital: '東京中央病院',
    department: '経営企画部',
    section: '医療機器管理課',
    accessibleFacilities: ['全施設'],
    category: 'system',
  },
  {
    email: 'admin-yokohama@hospital.com',
    role: 'system_admin',
    roleLabel: 'システム管理者 (横浜総合病院)',
    name: '田中 一郎',
    hospital: '横浜総合病院',
    department: '経営企画部',
    section: '医療機器管理課',
    accessibleFacilities: ['全施設'],
    category: 'system',
  },
  // SHIP代理見積担当者 (2026-06-03 新規): ログイン後 直接 /ship-proxy-quotation-list に遷移、他機能なし
  {
    email: 'proxy-estimate@ship.com',
    role: 'estimate_staff',
    roleLabel: 'SHIP代理見積担当者',
    name: '見積 花子',
    accessibleFacilities: ['全施設'],
    category: 'system',
  },
];

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedFacility: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setSelectedFacility: (facility: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      selectedFacility: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          // TODO: 実際のAPIコールに置き換える
          await new Promise((resolve) => setTimeout(resolve, 500));

          // メールアドレスに基づいてテストユーザーを検索
          const testUser = TEST_USERS.find(u => u.email === credentials.username);

          let mockUser: User;

          if (testUser) {
            // 登録済みテストユーザー
            mockUser = {
              id: `user-${testUser.role}-001`,
              username: testUser.name,
              email: testUser.email,
              role: testUser.role,
              hospital: testUser.hospital,
              department: testUser.department,
              section: testUser.section,
              accessibleFacilities: testUser.accessibleFacilities,
            };
          } else {
            // 未登録ユーザーはログインエラー
            set({ isLoading: false });
            throw new Error('認証に失敗しました');
          }

          set({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          selectedFacility: null,
        });
      },

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: user !== null
        });
      },

      setSelectedFacility: (facility: string) => {
        set({ selectedFacility: facility });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        selectedFacility: state.selectedFacility,
      }),
    }
  )
);
