'use client';

import React, { Suspense } from 'react';
import { Header } from '@/components/layouts/Header';
import { SubTabNavigation } from '../components/SubTabNavigation';

function RepairDetailsContent() {
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
          <SubTabNavigation activeTab="repairDetails" />

          <div style={{ flex: 1, background: 'white', overflow: 'auto' }}>
            <div style={{ padding: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>明細No</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>依頼No</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>修理内容</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>部品名</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>金額</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
                      データがありません
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RepairDetailsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>}>
      <RepairDetailsContent />
    </Suspense>
  );
}
