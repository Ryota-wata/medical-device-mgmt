'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';
import { useResponsive } from '@/lib/hooks/useResponsive';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
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
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = '資産リスト',
  showBackButton = true,
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
  children
}) => {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { isMobile } = useResponsive();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleBack = () => {
    router.back();
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
      <div className="flex items-center" style={{ gap: isMobile ? '8px' : '16px' }}>
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
        </div>
        {resultCount !== undefined && (
          <span style={{ color: '#ecf0f1', fontSize: isMobile ? '12px' : '14px' }}>
            {resultCount}件{showOriginalLabel && '（原本）'}
          </span>
        )}
      </div>

      {/* 右側: アクションボタン */}
      <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
        {/* リモデル申請一覧リンク */}
        {showApplicationListLink && (
          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (facility) params.set('facility', facility);
              if (department) params.set('department', department);
              const url = params.toString()
                ? `/remodel-application-list?${params.toString()}`
                : '/remodel-application-list';
              router.push(url);
            }}
            className="flex items-center gap-2 border-0 rounded cursor-pointer transition-all text-white"
            style={{
              background: '#3498db',
              padding: isMobile ? '6px 12px' : '8px 16px',
              fontSize: isMobile ? '12px' : '14px',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2980b9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3498db';
            }}
          >
            <span>📋</span>
            <span>リモデル申請一覧</span>
          </button>
        )}

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
                    router.push('/application-list');
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

        {/* 戻るボタン */}
        {showBackButton && (
          <button
            onClick={handleBack}
            className="text-white border-0 rounded cursor-pointer transition-all whitespace-nowrap"
            style={{
              background: '#27ae60',
              padding: isMobile ? '6px 12px' : '8px 16px',
              fontSize: isMobile ? '12px' : '14px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#229954';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#27ae60';
            }}
          >
            戻る
          </button>
        )}
      </div>
    </header>
  );
};
