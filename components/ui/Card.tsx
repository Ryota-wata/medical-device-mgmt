'use client';

/**
 * 共通カードコンポーネント
 * Phase 1-2で作成したスタイル定数とフックを活用
 */

import React from 'react';
import { cardStyle } from '@/lib/styles/helpers';
import { useCardHover } from '@/lib/hooks/useHover';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/styles/constants';

interface CardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'sm' | 'base' | 'md' | 'lg';
  background?: 'white' | 'light' | 'gray';
  hoverable?: boolean;
  onClick?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * 汎用カードコンポーネント
 *
 * 使用例:
 * ```tsx
 * <Card padding="lg" shadow="md" hoverable onClick={() => router.push('/detail')}>
 *   <h3>カードタイトル</h3>
 *   <p>カード本文</p>
 * </Card>
 *
 * <Card
 *   header={<h3>ヘッダー</h3>}
 *   footer={<Button>アクション</Button>}
 * >
 *   本文
 * </Card>
 * ```
 */
export const Card: React.FC<CardProps> = ({
  children,
  padding = 'lg',
  shadow = 'base',
  background = 'white',
  hoverable = false,
  onClick,
  header,
  footer,
  style: customStyle,
  className,
}) => {
  const baseStyle = cardStyle({ padding, shadow, background });
  const { style: hoverStyle, hoverProps } = hoverable ? useCardHover() : { style: {}, hoverProps: {} };

  const finalStyle: React.CSSProperties = {
    ...(hoverable ? hoverStyle : baseStyle),
    ...customStyle,
    cursor: onClick ? 'pointer' : 'default',
  };

  const paddingMap = {
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
  };

  return (
    <div
      {...(hoverable ? hoverProps : {})}
      onClick={onClick}
      style={finalStyle}
      className={className}
    >
      {header && (
        <div
          style={{
            marginBottom: spacing.md,
            paddingBottom: spacing.md,
            borderBottom: `1px solid ${colors.border.light}`,
            fontWeight: fontWeight.semibold,
            fontSize: fontSize.lg,
            color: colors.text.primary,
          }}
        >
          {header}
        </div>
      )}
      <div>{children}</div>
      {footer && (
        <div
          style={{
            marginTop: spacing.md,
            paddingTop: spacing.md,
            borderTop: `1px solid ${colors.border.light}`,
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/**
 * カードヘッダーコンポーネント
 *
 * 使用例:
 * ```tsx
 * <Card header={<CardHeader title="タイトル" subtitle="サブタイトル" action={<Button>編集</Button>} />}>
 *   本文
 * </Card>
 * ```
 */
export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h3 style={{ margin: 0, fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text.primary }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ margin: `${spacing.xs} 0 0 0`, fontSize: fontSize.sm, color: colors.text.secondary }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

interface CardSectionProps {
  title?: string;
  children: React.ReactNode;
  divider?: boolean;
}

/**
 * カードセクションコンポーネント
 *
 * 使用例:
 * ```tsx
 * <Card>
 *   <CardSection title="基本情報" divider>
 *     <p>内容1</p>
 *   </CardSection>
 *   <CardSection title="詳細情報">
 *     <p>内容2</p>
 *   </CardSection>
 * </Card>
 * ```
 */
export const CardSection: React.FC<CardSectionProps> = ({ title, children, divider = false }) => {
  return (
    <div
      style={{
        paddingTop: divider ? spacing.md : '0',
        marginTop: divider ? spacing.md : '0',
        borderTop: divider ? `1px solid ${colors.border.light}` : 'none',
      }}
    >
      {title && (
        <h4
          style={{
            margin: `0 0 ${spacing.sm} 0`,
            fontSize: fontSize.md,
            fontWeight: fontWeight.medium,
            color: colors.text.primary,
          }}
        >
          {title}
        </h4>
      )}
      {children}
    </div>
  );
};

interface CardGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: keyof typeof spacing;
}

/**
 * カードグリッドレイアウトコンポーネント
 *
 * 使用例:
 * ```tsx
 * <CardGrid columns={3} gap="md">
 *   <Card>カード1</Card>
 *   <Card>カード2</Card>
 *   <Card>カード3</Card>
 * </CardGrid>
 * ```
 */
export const CardGrid: React.FC<CardGridProps> = ({ children, columns = 3, gap = 'md' }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: spacing[gap],
      }}
    >
      {children}
    </div>
  );
};
