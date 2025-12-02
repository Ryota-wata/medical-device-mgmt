import { create } from 'zustand';
import { User, LoginCredentials } from '../types';

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
      // 現在はモックデータ
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockUser: User = {
        id: '1',
        username: credentials.username,
        email: `${credentials.username}@example.com`,
        role: 'staff',
        department: '手術部門',
        section: '手術'
      };

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
