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
  hospital?: string;
  department?: string;
  section?: string;
  /** コンサル: 担当施設 / 事務担当者: 閲覧可能な他施設 */
  accessibleFacilities?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * ユーザーロール
 */
export type UserRole = 'consultant' | 'sales' | 'medical_office' | 'medical_clinical';

/**
 * ユーザー種別（コンサル/病院）
 * メールアドレスに基づいて判定される
 */
export type UserType = 'consultant' | 'hospital';

/**
 * メールアドレスからユーザー種別を判定
 * @param email - ユーザーのメールアドレス
 * @returns 'hospital' (メールアドレスに@hospitalが含まれる場合) または 'consultant' (それ以外)
 */
export function getUserType(email: string): UserType {
  return email.includes('@hospital') ? 'hospital' : 'consultant';
}

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
