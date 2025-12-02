'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  resultCount?: number;
  onExport?: () => void;
  onPrint?: () => void;
  onViewToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = '資産リスト',
  showBackButton = true,
  resultCount,
  onExport,
  onPrint,
  onViewToggle
}) => {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 左側: ロゴとタイトル */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white px-3 py-2 rounded font-bold text-lg">
              SHIP
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
          {resultCount !== undefined && (
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
              {resultCount}件（原本）
            </span>
          )}
        </div>

        {/* 右側: アクションボタン */}
        <div className="flex items-center gap-2">
          {/* ナビゲーションメニュー */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <span>📑 メニュー</span>
              <span className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div
                  onClick={() => {
                    router.push('/application-list');
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <span>📝</span>
                  <span>申請一覧</span>
                </div>
                <div
                  onClick={() => {
                    router.push('/quotation-data-box');
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <span>📦</span>
                  <span>見積書管理</span>
                </div>
                <div
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-t border-gray-200"
                >
                  <span>🚪</span>
                  <span>ログアウト</span>
                </div>
              </div>
            )}
          </div>

          {/* アイコンボタン群 */}
          {onViewToggle && (
            <button
              onClick={onViewToggle}
              className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="表示切替"
            >
              📋
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Excel/PDF出力"
            >
              📊
            </button>
          )}
          {onPrint && (
            <button
              onClick={onPrint}
              className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="印刷"
            >
              🖨️
            </button>
          )}

          {/* 戻るボタン */}
          {showBackButton && (
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-200 text-gray-900 hover:bg-gray-300 rounded transition-colors"
            >
              戻る
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
