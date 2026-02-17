'use client';

import React, { useState, Suspense } from 'react';
import { useEditListStore } from '@/lib/stores/editListStore';
import { Header } from '@/components/layouts/Header';
import { TransferDisposalTab } from '../components/TransferDisposalTab';
import { SubTabNavigation } from '../components/SubTabNavigation';

function TransferDisposalContent() {
  const { editLists } = useEditListStore();
  const [selectedEditListId, setSelectedEditListId] = useState<string>('');

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#f5f5f5' }}>
      <Header
        title="タスク管理"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
        centerContent={
          <div style={{
            background: '#c0392b',
            padding: '6px 16px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>編集リスト:</span>
            <select
              value={selectedEditListId}
              onChange={(e) => setSelectedEditListId(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                border: 'none',
                borderRadius: '3px',
                background: 'white',
                minWidth: '180px',
              }}
            >
              <option value="">選択してください</option>
              {editLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', overflow: 'hidden' }}>
          <SubTabNavigation activeTab="transferDisposal" />

          <div style={{ flex: 1, background: 'white', overflow: 'auto' }}>
            <TransferDisposalTab />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransferDisposalPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>}>
      <TransferDisposalContent />
    </Suspense>
  );
}
