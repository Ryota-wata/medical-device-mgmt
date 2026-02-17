'use client';

import { Header } from '@/components/layouts/Header';
import { SubTabNavigation } from '../components/SubTabNavigation';
import { BorrowingManagementTab } from '../components/BorrowingManagementTab';

export default function BorrowingManagementPage() {
  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      <Header
        title="タスク管理"
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <SubTabNavigation activeTab="borrowingManagement" />
        <div style={{ flex: 1, background: 'white', borderRadius: '0 0 8px 8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <BorrowingManagementTab />
        </div>
      </div>
    </div>
  );
}
