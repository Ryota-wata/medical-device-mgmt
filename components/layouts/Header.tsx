'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';
import { useResponsive } from '@/lib/hooks/useResponsive';

interface HeaderProps {
  title?: string;
  stepBadge?: string;
  subInfo?: string;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  backButtonVariant?: 'primary' | 'secondary';
  hideHomeButton?: boolean;
  resultCount?: number;
  showOriginalLabel?: boolean;
  onExport?: () => void;
  onPrint?: () => void;
  onViewToggle?: () => void;
  onColumnSettings?: () => void;
  hideMenu?: boolean;
  showApplicationListLink?: boolean;
  facility?: string;
  department?: string;
  targetFacilities?: string[];
  createdAt?: string;
  children?: React.ReactNode;
  centerContent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = '資産リスト',
  stepBadge,
  subInfo,
  showBackButton = true,
  backHref,
  backLabel,
  backButtonVariant = 'primary',
  hideHomeButton = false,
  resultCount,
  showOriginalLabel = true,
  onExport,
  onPrint,
  onViewToggle,
  onColumnSettings,
  hideMenu = false,
  showApplicationListLink = false,
  facility = '',
  department = '',
  targetFacilities,
  createdAt,
  children,
  centerContent
}) => {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { isMobile } = useResponsive();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header
      className="text-white flex justify-between items-center"
      style={{
        background: '#2c3e50',
        padding: isMobile ? '8px 12px' : '12px 20px',
        flexWrap: 'wrap',
        gap: isMobile ? '8px' : '0'
      }}
    >
      {/* 左側: ロゴとタイトル */}
      <div className="flex items-center" style={{ gap: isMobile ? '8px' : '16px', flexWrap: 'wrap' }}>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center text-white font-bold"
            style={{
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px',
              background: '#27ae60',
              borderRadius: '8px',
              fontSize: isMobile ? '10px' : '14px'
            }}
          >
            SHIP
          </div>
          <div className="font-bold" style={{ fontSize: isMobile ? '14px' : '16px' }}>{title}</div>
          {stepBadge && (
            <span
              style={{
                background: '#e74c3c',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                marginLeft: '8px',
              }}
            >
              {stepBadge}
            </span>
          )}
        </div>
        {subInfo && (
          <div
            style={{
              background: '#fff3cd',
              color: '#856404',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '11px',
              marginLeft: '12px',
            }}
          >
            {subInfo}
          </div>
        )}
        {resultCount !== undefined && (
          <span style={{ color: '#ecf0f1', fontSize: isMobile ? '12px' : '14px' }}>
            {resultCount}件{showOriginalLabel && '（原本）'}
          </span>
        )}
        {/* 対象施設と作成日 */}
        {targetFacilities && targetFacilities.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#95a5a6' }}>対象施設:</span>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {targetFacilities.map((f, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '2px 8px',
                      background: 'rgba(39, 174, 96, 0.3)',
                      borderRadius: '10px',
                      fontSize: '12px',
                      color: '#ecf0f1',
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
            {createdAt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: '#95a5a6' }}>作成日:</span>
                <span style={{ fontSize: '12px', color: '#ecf0f1' }}>
                  {new Date(createdAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 中央: カスタムコンテンツ */}
      {centerContent && (
        <div className="flex items-center justify-center" style={{ flex: 1 }}>
          {centerContent}
        </div>
      )}

      {/* 右側: アクションボタン */}
      <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
        {/* カスタムアクションボタン */}
        {children}

        {/* ナビゲーションメニュー */}
        {!hideMenu && (
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 border-0 rounded cursor-pointer transition-all text-white"
              style={{
                background: '#34495e',
                padding: isMobile ? '6px 12px' : '8px 16px',
                fontSize: isMobile ? '12px' : '14px',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2c3e50';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#34495e';
              }}
            >
              <span>📑 {isMobile ? '' : 'メニュー'}</span>
              {!isMobile && (
                <span className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              )}
            </button>
            {isMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg z-50"
                style={{
                  border: '1px solid #ddd'
                }}
              >
                <div
                  onClick={() => {
                    router.push('/main');
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 cursor-pointer transition-colors"
                  style={{ color: '#2c3e50' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8f8f8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <span>📝</span>
                  <span>申請一覧</span>
                </div>
                <div
                  onClick={() => {
                    router.push('/quotation-data-box');
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 cursor-pointer transition-colors"
                  style={{ color: '#2c3e50' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8f8f8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <span>📦</span>
                  <span>見積書管理</span>
                </div>
                <div
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-3 cursor-pointer transition-colors"
                  style={{ color: '#2c3e50', borderTop: '1px solid #ddd' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8f8f8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <span>🚪</span>
                  <span>ログアウト</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* アイコンボタン群 */}
        {onColumnSettings && (
          <button
            onClick={onColumnSettings}
            className="flex items-center justify-center text-white border-0 rounded cursor-pointer transition-all"
            style={{
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px',
              background: '#34495e',
              fontSize: isMobile ? '16px' : '20px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2c3e50';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#34495e';
            }}
            title="表示カラム設定"
          >
            ⚙️
          </button>
        )}
        {onViewToggle && (
          <button
            onClick={onViewToggle}
            className="flex items-center justify-center text-white border-0 rounded cursor-pointer transition-all"
            style={{
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px',
              background: '#34495e',
              fontSize: isMobile ? '16px' : '20px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2c3e50';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#34495e';
            }}
            title="表示切替"
          >
            📋
          </button>
        )}
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center justify-center text-white border-0 rounded cursor-pointer transition-all"
            style={{
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px',
              background: '#34495e',
              fontSize: isMobile ? '16px' : '20px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2c3e50';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#34495e';
            }}
            title="Excel/PDF出力"
          >
            📊
          </button>
        )}
        {onPrint && (
          <button
            onClick={onPrint}
            className="flex items-center justify-center text-white border-0 rounded cursor-pointer transition-all"
            style={{
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px',
              background: '#34495e',
              fontSize: isMobile ? '16px' : '20px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2c3e50';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#34495e';
            }}
            title="印刷"
          >
            🖨️
          </button>
        )}

        {/* メイン画面に戻るボタン（backHrefが/main以外の場合のみ表示） */}
        {showBackButton && backHref && backHref !== '/main' && !hideHomeButton && (
          <button
            onClick={() => router.push('/main')}
            className="text-white border-0 rounded cursor-pointer transition-all whitespace-nowrap"
            style={{
              background: '#34495e',
              padding: isMobile ? '6px 12px' : '8px 16px',
              fontSize: isMobile ? '12px' : '14px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2c3e50';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#34495e';
            }}
          >
            メイン画面に戻る
          </button>
        )}

        {/* 戻るボタン */}
        {showBackButton && (
          <button
            onClick={handleBack}
            className="text-white border-0 rounded cursor-pointer transition-all whitespace-nowrap"
            style={{
              background: backButtonVariant === 'secondary' ? '#34495e' : '#27ae60',
              padding: isMobile ? '6px 12px' : '8px 16px',
              fontSize: isMobile ? '12px' : '14px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = backButtonVariant === 'secondary' ? '#2c3e50' : '#229954';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = backButtonVariant === 'secondary' ? '#34495e' : '#27ae60';
            }}
          >
            {backLabel || '戻る'}
          </button>
        )}
      </div>
    </header>
  );
};
