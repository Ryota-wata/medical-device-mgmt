'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useEditListStore } from '@/lib/stores/editListStore';
import { RfqGroupStatus } from '@/lib/types';
import { Header } from '@/components/layouts/Header';
import { RfqGroupsTab } from '../components/RfqGroupsTab';
import { SubTabNavigation } from '../components/SubTabNavigation';

function RemodelManagementContent() {
  const router = useRouter();
  const { rfqGroups, updateRfqGroup } = useRfqGroupStore();
  const { editLists } = useEditListStore();

  // 選択中の編集リスト
  const [selectedEditListId, setSelectedEditListId] = useState<string>('');

  // 見積依頼グループタブ用のステータスフィルター
  const [rfqStatusFilter, setRfqStatusFilter] = useState<RfqGroupStatus | ''>('');
  const filteredRfqGroups = useMemo(() => {
    if (!rfqStatusFilter) return rfqGroups;
    return rfqGroups.filter(g => g.status === rfqStatusFilter);
  }, [rfqGroups, rfqStatusFilter]);

  // 見積依頼/見積登録 → STEP画面へ遷移
  const handleNavigateToRfqProcess = (rfqGroupId: number) => {
    router.push(`/quotation-data-box/rfq-process?rfqGroupId=${rfqGroupId}`);
  };

  // 発注登録開始（画面遷移）
  const handleStartOrderRegistration = (rfqGroupId: number) => {
    router.push(`/quotation-data-box/order-registration?rfqGroupId=${rfqGroupId}`);
  };

  // 検収登録開始（画面遷移）
  const handleStartInspectionRegistration = (rfqGroupId: number) => {
    router.push(`/quotation-data-box/inspection-registration?rfqGroupId=${rfqGroupId}`);
  };

  // 資産仮登録開始（モード選択）
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [pendingRfqGroupId, setPendingRfqGroupId] = useState<number | null>(null);

  const handleStartAssetProvisionalRegistration = (rfqGroupId: number) => {
    setPendingRfqGroupId(rfqGroupId);
    setShowModeSelection(true);
  };

  const handleModeSelected = (mode: 'mobile' | 'pc') => {
    if (pendingRfqGroupId !== null) {
      router.push(`/quotation-data-box/asset-provisional-registration?rfqGroupId=${pendingRfqGroupId}&mode=${mode}`);
    }
    setShowModeSelection(false);
    setPendingRfqGroupId(null);
  };

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#f5f5f5' }}>
      <Header
        title="タスク管理"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
        centerContent={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            <button
              onClick={() => {
                if (selectedEditListId) {
                  router.push(`/remodel-application?listId=${selectedEditListId}`);
                } else {
                  router.push('/remodel-application');
                }
              }}
              style={{
                padding: '6px 14px',
                background: 'transparent',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.6)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = 'white'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; }}
            >
              編集リスト &rarr;
            </button>
          </div>
        }
      />

      {/* メインコンテンツ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', overflow: 'hidden' }}>
          {/* サブタブ */}
          <SubTabNavigation activeTab="remodelManagement" />

          {/* フィルター */}
          <div style={{
            background: 'white',
            padding: '12px 16px',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: '#555' }}>見積区分</label>
              <select style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}>
                <option value="">すべて</option>
                <option value="purchase">購入</option>
                <option value="lease">リース</option>
                <option value="installment">割賦</option>
                <option value="rental">レンタル</option>
                <option value="trial">試用</option>
                <option value="borrow">借用</option>
                <option value="repair">修理</option>
                <option value="maintenance">保守</option>
                <option value="inspection">点検</option>
                <option value="other">その他</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: '#555' }}>見積フェーズ</label>
              <select style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}>
                <option value="">すべて</option>
                <option value="listPrice">定価</option>
                <option value="estimate">概算</option>
                <option value="final">最終原本登録用</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: '#555' }}>ステータス</label>
              <select style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '3px' }}>
                <option value="">すべて</option>
                <option value="見積依頼">見積依頼</option>
                <option value="見積依頼済">見積依頼済</option>
                <option value="見積DB登録済">見積DB登録済</option>
                <option value="見積登録依頼中">見積登録依頼中</option>
                <option value="発注用見積依頼済">発注用見積依頼済</option>
                <option value="発注見積登録済">発注見積登録済</option>
                <option value="発注済">発注済</option>
                <option value="納期確定">納期確定</option>
                <option value="検収済">検収済</option>
                <option value="完了">完了</option>
                <option value="申請を見送る">申請を見送る</option>
              </select>
            </div>
          </div>

          {/* テーブルエリア */}
          <div style={{ flex: 1, background: 'white', overflow: 'auto' }}>
            <RfqGroupsTab
              rfqGroups={filteredRfqGroups}
              onSendRfq={handleNavigateToRfqProcess}
              onRegisterQuotation={handleNavigateToRfqProcess}
              onRegisterOrder={handleStartOrderRegistration}
              onRegisterInspection={handleStartInspectionRegistration}
              onRegisterAssetProvisional={handleStartAssetProvisionalRegistration}
              onUpdateDeadline={(id, field, value) => updateRfqGroup(id, { [field]: value })}
            />
          </div>
        </div>
      </div>

      {/* 資産仮登録モード選択ダイアログ */}
      {showModeSelection && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 32, maxWidth: 520, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8, textWrap: 'balance' }}>資産仮登録の入力方法を選択</h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>登録作業の状況に応じて入力方法を選んでください。</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => handleModeSelected('mobile')}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16, border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 8, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 24 }}>&#128241;</span>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>モバイル（現場作業）</div>
                  <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                    現場でQRラベル貼付・写真撮影・シリアルNo.入力を行います。<br />
                    1品目ずつ登録する操作フローです。
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleModeSelected('pc')}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16, border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 24 }}>&#128187;</span>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>PC（手書き検収書から手入力）</div>
                  <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                    手書き検収書の内容をテーブル形式で一括入力します。<br />
                    全品目を一覧しながら効率的に登録できます。
                  </div>
                </div>
              </button>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowModeSelection(false); setPendingRfqGroupId(null); }}
                style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#6b7280' }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function RemodelManagementPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>}>
      <RemodelManagementContent />
    </Suspense>
  );
}
