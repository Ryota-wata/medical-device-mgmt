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
 * - admin: システム管理者
 * - consultant: コンサル
 * - office_admin: 事務管理者
 * - office_staff: 事務担当者
 * - clinical_staff: 臨床スタッフ
 * - sales: 営業
 */
export type UserRole = 'admin' | 'consultant' | 'office_admin' | 'office_staff' | 'clinical_staff' | 'sales';

/**
 * ロールの日本語ラベル
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'システム管理者',
  consultant: 'コンサル',
  office_admin: '事務管理者',
  office_staff: '事務担当者',
  clinical_staff: '臨床スタッフ',
  sales: '営業',
};

/**
 * ユーザー種別（SHIP/病院）
 * メールアドレスに基づいて判定される
 */
export type UserType = 'ship' | 'hospital';

/**
 * メールアドレスからユーザー種別を判定
 * @param email - ユーザーのメールアドレス
 * @returns 'hospital' (メールアドレスに@hospitalが含まれる場合) または 'ship' (それ以外)
 */
export function getUserType(email: string): UserType {
  return email.includes('@hospital') ? 'hospital' : 'ship';
}

/**
 * ロールがSHIP側（コンサル・営業・システム管理者）かどうか
 */
export function isShipRole(role: UserRole): boolean {
  return role === 'admin' || role === 'consultant' || role === 'sales';
}

/**
 * ロールが病院側（事務管理者・事務担当者・臨床スタッフ）かどうか
 */
export function isHospitalRole(role: UserRole): boolean {
  return role === 'office_admin' || role === 'office_staff' || role === 'clinical_staff';
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
