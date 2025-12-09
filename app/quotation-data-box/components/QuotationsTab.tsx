import React from 'react';
import { RfqGroup, AssetMaster } from '@/lib/types';
import { ReceivedQuotationGroup, ReceivedQuotationItem, QuotationFilter } from '@/lib/types/quotation';
import { MESSAGES } from '@/lib/constants/quotation';

interface QuotationsTabProps {
  quotationGroups: ReceivedQuotationGroup[];
  quotationItems: ReceivedQuotationItem[];
  rfqGroups: RfqGroup[];
  assetMasterData: AssetMaster[];
  quotationFilter: QuotationFilter;
  onFilterChange: (filter: QuotationFilter) => void;
  onRegisterQuotation: () => void;
  onDeleteQuotation: (groupId: number) => void;
}

export const QuotationsTab: React.FC<QuotationsTabProps> = ({
  quotationGroups,
  quotationItems,
  rfqGroups,
  assetMasterData,
  quotationFilter,
  onFilterChange,
  onRegisterQuotation,
  onDeleteQuotation,
}) => {
  // フィルタリングされた明細
  const filteredItems = quotationItems.filter(item => {
    const group = quotationGroups.find(g => g.id === item.quotationGroupId);
    if (!group) return false;
    if (quotationFilter.rfqGroupId && group.rfqGroupId?.toString() !== quotationFilter.rfqGroupId) {
      return false;
    }
    if (quotationFilter.phase && group.phase !== quotationFilter.phase) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
      {/* アクションバー */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', color: '#555' }}>見積依頼グループ:</label>
          <select
            value={quotationFilter.rfqGroupId}
            onChange={(e) => onFilterChange({ ...quotationFilter, rfqGroupId: e.target.value })}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="">すべて</option>
            {rfqGroups.map(g => (
              <option key={g.id} value={g.id}>{g.rfqNo} - {g.groupName}</option>
            ))}
          </select>

          <label style={{ fontSize: '14px', color: '#555', marginLeft: '20px' }}>フェーズ:</label>
          <select
            value={quotationFilter.phase}
            onChange={(e) => onFilterChange({ ...quotationFilter, phase: e.target.value })}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="">すべて</option>
            <option value="定価見積">定価見積</option>
            <option value="概算見積">概算見積</option>
            <option value="確定見積">確定見積</option>
          </select>
        </div>

        <button
          onClick={onRegisterQuotation}
          style={{
            padding: '10px 20px',
            background: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          + 見積書新規登録
        </button>
      </div>

      {/* テーブル */}
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>見積番号</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>業者名</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>見積日</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', color: '#2c3e50' }}>フェーズ</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>品目名</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>メーカー</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>型番</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#2c3e50' }}>数量</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#2c3e50' }}>金額</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>大分類</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>中分類</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>品目</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', color: '#2c3e50' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
                const group = quotationGroups.find(g => g.id === item.quotationGroupId);
                const assetMaster = item.assetMasterId
                  ? assetMasterData.find(a => a.id === item.assetMasterId)
                  : null;

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontWeight: 600 }}>{item.receivedQuotationNo}</td>
                    <td style={{ padding: '12px 8px' }}>{group?.vendorName || '-'}</td>
                    <td style={{ padding: '12px 8px' }}>{group?.quotationDate || '-'}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      {group && (
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            background: group.phase === '定価見積' ? '#e8f5e9' :
                                       group.phase === '概算見積' ? '#fff3e0' : '#e3f2fd',
                            color: group.phase === '定価見積' ? '#2e7d32' :
                                   group.phase === '概算見積' ? '#e65100' : '#1565c0'
                          }}
                        >
                          {group.phase}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: 500 }}>{item.itemName}</td>
                    <td style={{ padding: '12px 8px' }}>{item.manufacturer || '-'}</td>
                    <td style={{ padding: '12px 8px' }}>{item.model || '-'}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>
                      ¥{item.sellingPriceTotal?.toLocaleString() || '-'}
                    </td>
                    <td style={{ padding: '12px 8px', color: '#555' }}>{assetMaster?.largeClass || '-'}</td>
                    <td style={{ padding: '12px 8px', color: '#555' }}>{assetMaster?.mediumClass || '-'}</td>
                    <td style={{ padding: '12px 8px', color: '#555' }}>{assetMaster?.item || '-'}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          if (confirm(MESSAGES.CONFIRM_DELETE_ITEM)) {
                            onDeleteQuotation(item.quotationGroupId);
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {quotationItems.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
          受領見積明細がありません
        </div>
      )}
    </div>
  );
};
