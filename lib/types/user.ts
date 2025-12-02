/**
 * ユーザー・認証関連の型定義
 */

/**
 * ユーザー情報
 */
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  department?: string;
  section?: string;
}

/**
 * ユーザーロール
 */
export type UserRole = 'admin' | 'manager' | 'staff' | 'viewer';

/**
 * ログイン情報
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * 認証状態
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
