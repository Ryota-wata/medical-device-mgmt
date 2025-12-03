'use client';

/**
 * 共通ボタンコンポーネント
 * Phase 1-2で作成したスタイル定数とフックを活用
 */

import React from 'react';
import { buttonStyle, iconButtonStyle, type ButtonVariant, type ButtonSize } from '@/lib/styles/helpers';
import { useButtonHover } from '@/lib/hooks/useHover';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * 汎用ボタンコンポーネント
 *
 * 使用例:
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   保存
 * </Button>
 *
 * <Button variant="secondary" size="sm" leftIcon="🔍">
 *   検索
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  children,
  style: customStyle,
  ...props
}) => {
  // ホバーエフェクトは手動で実装（variantに応じて）
  const [isHovered, setIsHovered] = React.useState(false);

  const baseStyle = buttonStyle({
    variant,
    size,
    fullWidth,
    disabled: disabled || isLoading,
  });

  // ホバー時の背景色
  const hoverBackgrounds = {
    primary: '#229954',
    secondary: '#2c3e50',
    danger: '#c0392b',
    ghost: '#f8f8f8',
  };

  const finalStyle: React.CSSProperties = {
    ...baseStyle,
    ...(isHovered && !disabled && !isLoading ? { background: hoverBackgrounds[variant] } : {}),
    ...customStyle,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      style={finalStyle}
      onMouseEnter={(e) => {
        setIsHovered(true);
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        props.onMouseLeave?.(e);
      }}
    >
      {isLoading ? (
        <>⏳ 処理中...</>
      ) : (
        <>
          {leftIcon && <span>{leftIcon}</span>}
          {children}
          {rightIcon && <span>{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon: React.ReactNode;
  ariaLabel: string;
}

/**
 * アイコンボタンコンポーネント
 *
 * 使用例:
 * ```tsx
 * <IconButton
 *   variant="secondary"
 *   size="md"
 *   icon="⚙️"
 *   ariaLabel="設定"
 *   onClick={handleSettings}
 * />
 * ```
 */
export const IconButton: React.FC<IconButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  ariaLabel,
  disabled = false,
  style: customStyle,
  ...props
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const baseStyle = iconButtonStyle({ variant, size });

  const hoverBackgrounds = {
    primary: '#229954',
    secondary: '#2c3e50',
    danger: '#c0392b',
    ghost: '#f8f8f8',
  };

  const finalStyle: React.CSSProperties = {
    ...baseStyle,
    ...(isHovered && !disabled ? { background: hoverBackgrounds[variant] } : {}),
    ...customStyle,
  };

  return (
    <button
      {...props}
      disabled={disabled}
      aria-label={ariaLabel}
      title={ariaLabel}
      style={finalStyle}
      onMouseEnter={(e) => {
        setIsHovered(true);
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        props.onMouseLeave?.(e);
      }}
    >
      {icon}
    </button>
  );
};
