/**
 * スタイル定数
 * アプリケーション全体で使用する共通のスタイル定数を定義
 */

/**
 * カラーパレット
 * 使用頻度の高い色を定数化
 */
export const colors = {
  // Primary Colors
  primary: '#27ae60',
  primaryHover: '#229954',
  primaryDark: '#1e8449',

  // Background Colors
  background: {
    primary: '#2c3e50',
    secondary: '#34495e',
    hover: '#2c3e50',
    light: '#ecf0f1',
    white: '#fff',
    gray: '#f8f8f8',
  },

  // Text Colors
  text: {
    primary: '#2c3e50',
    secondary: '#7f8c8d',
    light: '#ecf0f1',
    white: '#fff',
    muted: '#95a5a6',
  },

  // Border Colors
  border: {
    light: '#ddd',
    medium: '#ccc',
    dark: '#2c3e50',
  },

  // Status Colors
  status: {
    success: '#27ae60',
    warning: '#f39c12',
    error: '#e74c3c',
    info: '#3498db',
  },

  // Accent Colors
  accent: {
    blue: '#3498db',
    blueHover: '#2980b9',
    orange: '#e67e22',
    red: '#e74c3c',
  },
} as const;

/**
 * スペーシングスケール
 * padding, margin, gap などで使用
 */
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
  xxxl: '32px',
} as const;

/**
 * フォントサイズスケール
 */
export const fontSize = {
  xs: '11px',
  sm: '12px',
  base: '13px',
  md: '14px',
  lg: '16px',
  xl: '18px',
  xxl: '20px',
  xxxl: '24px',
} as const;

/**
 * フォントウェイト
 */
export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/**
 * ボーダーラディウス
 */
export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;

/**
 * シャドウ
 */
export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
} as const;

/**
 * Z-index レイヤー
 */
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
} as const;

/**
 * ブレークポイント
 * レスポンシブデザインで使用
 */
export const breakpoints = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1280px',
} as const;

/**
 * トランジション
 */
export const transitions = {
  fast: '0.1s ease',
  base: '0.2s ease',
  slow: '0.3s ease',
} as const;

/**
 * アイコンサイズ
 */
export const iconSize = {
  sm: { mobile: '16px', desktop: '20px' },
  md: { mobile: '20px', desktop: '24px' },
  lg: { mobile: '24px', desktop: '28px' },
} as const;

/**
 * ボタンサイズ
 */
export const buttonSize = {
  sm: {
    mobile: { width: '32px', height: '32px', padding: '6px 12px' },
    desktop: { width: '40px', height: '40px', padding: '8px 16px' },
  },
  md: {
    mobile: { width: '40px', height: '40px', padding: '8px 16px' },
    desktop: { width: '48px', height: '48px', padding: '10px 20px' },
  },
  lg: {
    mobile: { width: '48px', height: '48px', padding: '10px 20px' },
    desktop: { width: '56px', height: '56px', padding: '12px 24px' },
  },
} as const;
