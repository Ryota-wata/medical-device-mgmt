import React from 'react';
import { RfqGroup } from '@/lib/types';
import { ReceivedQuotationGroup, ReceivedQuotationItem, QuotationFilter } from '@/lib/types/quotation';

interface QuotationsTabProps {
  quotationGroups: ReceivedQuotationGroup[];
  quotationItems: ReceivedQuotationItem[];
  rfqGroups: RfqGroup[];
  quotationFilter: QuotationFilter;
  onFilterChange: (filter: QuotationFilter) => void;
  onUpdateItem?: (itemId: number, updates: Partial<ReceivedQuotationItem>) => void;
}

// 金額フォーマット
const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return `¥${value.toLocaleString()}`;
};

export const QuotationsTab: React.FC<QuotationsTabProps> = ({
  quotationGroups,
  quotationItems,
  rfqGroups,
  quotationFilter,
  onFilterChange,
}) => {
  // フィルタリングされた明細
  const filteredItems = quotationItems.filter(item => {
    const group = quotationGroups.find(g => g.id === item.quotationGroupId);
    if (!group) return false;
    if (quotationFilter.rfqGroupId && group.rfqGroupId?.toString() !== quotationFilter.rfqGroupId) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
      {/* アクションバー */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
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
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
          登録済み: {filteredItems.length}件
        </div>
      </div>

      {/* テーブル */}
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#4a6fa5', color: 'white' }}>
              <th style={{ padding: '8px 6px', textAlign: 'center', width: '60px', fontSize: '11px', fontWeight: 'bold' }}>登録区分</th>
              <th style={{ padding: '8px 6px', textAlign: 'left', width: '100px', fontSize: '11px', fontWeight: 'bold' }}>大分類</th>
              <th style={{ padding: '8px 6px', textAlign: 'left', width: '100px', fontSize: '11px', fontWeight: 'bold' }}>中分類</th>
              <th style={{ padding: '8px 6px', textAlign: 'left', fontSize: '11px', fontWeight: 'bold' }}>個体管理品目</th>
              <th style={{ padding: '8px 6px', textAlign: 'left', width: '100px', fontSize: '11px', fontWeight: 'bold' }}>メーカー</th>
              <th style={{ padding: '8px 6px', textAlign: 'left', width: '120px', fontSize: '11px', fontWeight: 'bold' }}>型式</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', width: '50px', fontSize: '11px', fontWeight: 'bold' }}>単位</th>
              <th style={{ padding: '8px 6px', textAlign: 'right', width: '90px', fontSize: '11px', fontWeight: 'bold' }}>定価単価</th>
              <th style={{ padding: '8px 6px', textAlign: 'right', width: '90px', fontSize: '11px', fontWeight: 'bold' }}>按分単価</th>
              <th style={{ padding: '8px 6px', textAlign: 'right', width: '90px', fontSize: '11px', fontWeight: 'bold' }}>按分金額</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', width: '60px', fontSize: '11px', fontWeight: 'bold' }}>SEQ_ID</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', width: '80px', fontSize: '11px', fontWeight: 'bold' }}>親と紐付け</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              // Categoryの背景色
              const getCategoryBgColor = (itemType?: string) => {
                if (!itemType) return 'white';
                if (itemType.startsWith('C')) return '#e8f5e9';
                if (itemType.startsWith('D')) return '#fffde7';
                if (itemType.startsWith('B')) return '#e3f2fd';
                return 'white';
              };

              const getCategoryLabelBg = (itemType?: string) => {
                if (!itemType) return '#9e9e9e';
                if (itemType.startsWith('C')) return '#4caf50';
                if (itemType.startsWith('D')) return '#ffc107';
                if (itemType.startsWith('B')) return '#2196f3';
                return '#9e9e9e';
              };

              const rowBg = getCategoryBgColor(item.itemType);
              const categoryLabelBg = getCategoryLabelBg(item.itemType);
              const isIndividualItem = item.itemType?.startsWith('C');

              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #ddd', background: rowBg }}>
                  <td style={{ padding: '8px 6px', textAlign: 'center', background: categoryLabelBg, color: 'white', fontWeight: 'bold', fontSize: '12px' }}>
                    {item.itemType?.charAt(0) || '-'}
                  </td>
                  <td style={{ padding: '8px 6px', fontSize: '11px' }}>
                    {item.largeClass || '-'}
                  </td>
                  <td style={{ padding: '8px 6px', fontSize: '11px' }}>
                    {item.middleClass || '-'}
                  </td>
                  <td style={{ padding: '8px 6px', fontWeight: isIndividualItem ? 'bold' : 'normal', fontSize: '12px' }}>
                    {item.itemName || '-'}
                  </td>
                  <td style={{ padding: '8px 6px', fontSize: '11px' }}>
                    {item.manufacturer || '-'}
                  </td>
                  <td style={{ padding: '8px 6px', fontSize: '11px' }}>
                    {item.model || '-'}
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'center', fontSize: '11px' }}>
                    {item.unit || '-'}
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontSize: '11px' }}>
                    {formatCurrency(item.listPriceUnit)}
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontSize: '11px' }}>
                    {formatCurrency(item.allocPriceUnit)}
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 'bold', fontSize: '12px', color: '#c62828' }}>
                    {formatCurrency(item.allocListPriceTotal)}
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'center', fontSize: '11px', fontWeight: isIndividualItem ? 'bold' : 'normal' }}>
                    {item.seqId || '-'}
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'center', fontSize: '11px' }}>
                    {item.parentSeqId || '-'}
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
