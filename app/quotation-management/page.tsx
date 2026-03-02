'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useQuotationStore } from '@/lib/stores/quotationStore';
import { useEditListStore } from '@/lib/stores/editListStore';
import { usePermissions } from '@/lib/hooks';
import { Header } from '@/components/layouts/Header';
import { QuotationsTab } from '../quotation-data-box/components/QuotationsTab';

type QuotationTabType = 'remodel' | 'purchase';

// 金額フォーマット
const formatCurrency = (value: number) => {
  return `¥${value.toLocaleString()}`;
};

function QuotationManagementContent() {
  const { rfqGroups } = useRfqGroupStore();
  const { quotationGroups, quotationItems } = useQuotationStore();
  const { editLists } = useEditListStore();
  const { role } = usePermissions();

  // consultant はリモデルのみ、office系は購入のみ
  const canViewRemodel = role === 'admin' || role === 'consultant' || role === 'sales';
  const canViewPurchase = role === 'admin' || role === 'office_admin' || role === 'office_staff' || role === 'sales';

  const defaultTab: QuotationTabType = canViewRemodel ? 'remodel' : 'purchase';
  const [activeTab, setActiveTab] = useState<QuotationTabType>(defaultTab);

  // フィルターstate
  const [selectedEditListId, setSelectedEditListId] = useState<string>('');
  const [selectedRfqGroupId, setSelectedRfqGroupId] = useState<string>('');

  // タブ切り替え時にフィルターをリセット
  const handleTabChange = (tab: QuotationTabType) => {
    setActiveTab(tab);
    setSelectedEditListId('');
    setSelectedRfqGroupId('');
  };

  // 編集リスト変更時：見積依頼グループをリセット
  const handleEditListChange = (editListId: string) => {
    setSelectedEditListId(editListId);
    setSelectedRfqGroupId('');
  };

  // 編集リストに紐づく見積依頼グループ
  const availableRfqGroups = useMemo(() => {
    if (!selectedEditListId) return rfqGroups;
    return rfqGroups.filter(g => g.editListId === selectedEditListId);
  }, [rfqGroups, selectedEditListId]);

  // フィルター後の見積明細
  const filteredItems = useMemo(() => {
    // 対象のrfqGroupIdsを決定
    let targetRfqGroupIds: Set<number>;

    if (selectedRfqGroupId) {
      // 特定の見積依頼グループが選択されている
      targetRfqGroupIds = new Set([Number(selectedRfqGroupId)]);
    } else if (selectedEditListId) {
      // 編集リストが選択されている → 紐づくRfqGroupすべて
      targetRfqGroupIds = new Set(availableRfqGroups.map(g => g.id));
    } else {
      // フィルターなし → 全件
      return quotationItems;
    }

    return quotationItems.filter(item => {
      const group = quotationGroups.find(g => g.id === item.quotationGroupId);
      if (!group) return false;
      if (group.rfqGroupId === undefined) return false;
      return targetRfqGroupIds.has(group.rfqGroupId);
    });
  }, [quotationItems, quotationGroups, selectedEditListId, selectedRfqGroupId, availableRfqGroups]);

  // 合計金額
  const totalAmount = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + (item.allocListPriceTotal || 0), 0);
  }, [filteredItems]);

  // タブ定義
  const tabs = useMemo(() => {
    const items: { key: QuotationTabType; label: string; color: string }[] = [];
    if (canViewRemodel) {
      items.push({ key: 'remodel', label: 'リモデル見積明細', color: '#c0392b' });
    }
    if (canViewPurchase) {
      items.push({ key: 'purchase', label: '購入見積明細', color: '#27ae60' });
    }
    return items;
  }, [canViewRemodel, canViewPurchase]);

  const activeColor = tabs.find(t => t.key === activeTab)?.color || '#3498db';

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#f5f5f5' }}>
      <Header
        title="見積管理"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', overflow: 'hidden' }}>
        {/* タブ */}
        <div style={{
          background: 'white',
          borderBottom: '2px solid #dee2e6',
          display: 'flex',
          borderRadius: '4px 4px 0 0',
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                padding: '10px 24px',
                background: activeTab === tab.key ? tab.color : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                color: activeTab === tab.key ? 'white' : '#555',
                borderRadius: '4px 4px 0 0',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 絞り込みエリア */}
        <div style={{
          background: 'white',
          borderBottom: '1px solid #dee2e6',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
        }}>
          {/* 編集リスト */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#555', whiteSpace: 'nowrap' }}>
              編集リスト
            </label>
            <select
              value={selectedEditListId}
              onChange={(e) => handleEditListChange(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '13px',
                minWidth: '200px',
                background: 'white',
              }}
            >
              <option value="">すべて</option>
              {editLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>

          {/* 見積依頼グループ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#555', whiteSpace: 'nowrap' }}>
              見積依頼グループ
            </label>
            <select
              value={selectedRfqGroupId}
              onChange={(e) => setSelectedRfqGroupId(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '13px',
                minWidth: '320px',
                background: 'white',
              }}
            >
              <option value="">すべて</option>
              {availableRfqGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.rfqNo} - {g.groupName}
                </option>
              ))}
            </select>
          </div>

          {/* 件数・合計 */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ color: '#555' }}>
              表示: <strong style={{ color: activeColor }} className="tabular-nums">{filteredItems.length}</strong>件
            </span>
            <span style={{ color: '#555' }}>
              合計金額: <strong style={{ color: '#c62828' }} className="tabular-nums">{formatCurrency(totalAmount)}</strong>
            </span>
          </div>
        </div>

        {/* コンテンツ */}
        <div style={{ flex: 1, background: 'white', overflow: 'auto' }}>
          <QuotationsTab items={filteredItems} />
        </div>
      </div>
    </div>
  );
}

export default function QuotationManagementPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>}>
      <QuotationManagementContent />
    </Suspense>
  );
}
