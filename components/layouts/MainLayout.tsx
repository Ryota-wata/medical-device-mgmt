'use client';

import React from 'react';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  resultCount?: number;
  onExport?: () => void;
  onPrint?: () => void;
  onViewToggle?: () => void;
  showHeader?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  showBackButton,
  resultCount,
  onExport,
  onPrint,
  onViewToggle,
  showHeader = true
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && (
        <Header
          title={title}
          showBackButton={showBackButton}
          resultCount={resultCount}
          onExport={onExport}
          onPrint={onPrint}
          onViewToggle={onViewToggle}
        />
      )}
      <main className="container mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
};
