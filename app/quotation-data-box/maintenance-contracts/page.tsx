'use client';

import React, { Suspense } from 'react';
import { Header } from '@/components/layouts/Header';
import { MaintenanceContractsTab } from '../components/MaintenanceContractsTab';
import { SubTabNavigation } from '../components/SubTabNavigation';

function MaintenanceContractsContent() {
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#f5f5f5' }}>
      <Header
        title="タスク管理"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', overflow: 'hidden' }}>
          <SubTabNavigation activeTab="makerMaintenance" />

          <div style={{ flex: 1, background: 'white', overflow: 'auto' }}>
            <MaintenanceContractsTab />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MaintenanceContractsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>}>
      <MaintenanceContractsContent />
    </Suspense>
  );
}
