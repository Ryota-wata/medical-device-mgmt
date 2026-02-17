'use client';

import { Header } from '@/components/layouts/Header';
import { SubTabNavigation } from '../components/SubTabNavigation';
import { DisposalManagementTab } from '../components/DisposalManagementTab';

export default function DisposalManagementPage() {
  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      <Header
        title="タスク管理"
        backHref="/main"
        backLabel="メイン画面に戻る"
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <SubTabNavigation activeTab="disposalManagement" />
        <div style={{ flex: 1, background: 'white', borderRadius: '0 0 8px 8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <DisposalManagementTab />
        </div>
      </div>
    </div>
  );
}
