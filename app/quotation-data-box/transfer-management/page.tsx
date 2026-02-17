'use client';

import React, { Suspense } from 'react';
import { Header } from '@/components/layouts/Header';
import { TransferManagementTab } from '../components/TransferManagementTab';
import { SubTabNavigation } from '../components/SubTabNavigation';

function TransferManagementContent() {
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
          <SubTabNavigation activeTab="transferManagement" />

          <div style={{ flex: 1, background: 'white', overflow: 'auto' }}>
            <TransferManagementTab />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransferManagementPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>}>
      <TransferManagementContent />
    </Suspense>
  );
}
