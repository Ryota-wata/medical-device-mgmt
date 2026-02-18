import { create } from 'zustand';
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
}

export const TEST_USERS: TestUser[] = [
  {
    email: 'admin@ship.com',
    role: 'admin',
    roleLabel: 'システム管理者',
    name: '管理者 太郎',
    accessibleFacilities: ['全施設'],
  },
  {
    email: 'consultant@ship.com',
    role: 'consultant',
    roleLabel: 'SHRCコンサル',
    name: '山田 花子',
    accessibleFacilities: ['東京中央病院', '横浜総合病院', '千葉医療センター'],
  },
  {
    email: 'sales@ship.com',
    role: 'sales',
    roleLabel: 'GHS営業',
    name: '鈴木 一郎',
    accessibleFacilities: ['東京中央病院', '横浜総合病院'],
  },
  {
    email: 'office-admin@hospital.com',
    role: 'office_admin',
    roleLabel: '事務管理者',
    name: '佐藤 美智子',
    hospital: '東京中央病院',
    department: '経営企画部',
    section: '医療機器管理課',
  },
  {
    email: 'office@hospital.com',
    role: 'office_staff',
    roleLabel: '事務担当者',
    name: '高橋 健二',
    hospital: '東京中央病院',
    department: '経営企画部',
    section: '医療機器管理課',
  },
  {
    email: 'user@hospital.com',
    role: 'clinical_staff',
    roleLabel: '臨床スタッフ',
    name: '田中 花子',
    hospital: '東京中央病院',
    department: '手術部門',
    section: '手術室',
  },
];

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

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
        // 未登録メールアドレスの場合はデフォルトで臨床スタッフとして扱う
        const isHospitalUser = credentials.username.includes('@hospital');
        mockUser = {
          id: 'user-unknown-001',
          username: credentials.username.split('@')[0],
          email: credentials.username,
          role: isHospitalUser ? 'clinical_staff' : 'consultant',
          hospital: isHospitalUser ? '東京中央病院' : undefined,
          department: isHospitalUser ? '未設定' : undefined,
          section: isHospitalUser ? '未設定' : undefined,
        };
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
      isAuthenticated: false
    });
  },

  setUser: (user: User | null) => {
    set({
      user,
      isAuthenticated: user !== null
    });
  }
}));
