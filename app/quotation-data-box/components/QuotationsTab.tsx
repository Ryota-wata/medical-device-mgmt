import React from 'react';
import { ReceivedQuotationItem } from '@/lib/types/quotation';

interface QuotationsTabProps {
  items: ReceivedQuotationItem[];
}

// 金額フォーマット
const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return `¥${value.toLocaleString()}`;
};

export const QuotationsTab: React.FC<QuotationsTabProps> = ({
  items,
}) => {
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
      {/* テーブル */}
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', width: '60px', fontWeight: 600, whiteSpace: 'nowrap' }}>登録区分</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', width: '100px', fontWeight: 600, whiteSpace: 'nowrap' }}>大分類</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', width: '100px', fontWeight: 600, whiteSpace: 'nowrap' }}>中分類</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>個体管理品目</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', width: '100px', fontWeight: 600, whiteSpace: 'nowrap' }}>メーカー</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', width: '120px', fontWeight: 600, whiteSpace: 'nowrap' }}>型式</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', width: '50px', fontWeight: 600, whiteSpace: 'nowrap' }}>単位</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'right', width: '90px', fontWeight: 600, whiteSpace: 'nowrap' }}>定価単価</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'right', width: '90px', fontWeight: 600, whiteSpace: 'nowrap' }}>按分単価</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'right', width: '90px', fontWeight: 600, whiteSpace: 'nowrap' }}>按分金額</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', width: '60px', fontWeight: 600, whiteSpace: 'nowrap' }}>SEQ_ID</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', width: '80px', fontWeight: 600, whiteSpace: 'nowrap' }}>親と紐付け</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
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
                <tr key={item.id} style={{ background: rowBg }}>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', background: categoryLabelBg, color: 'white', fontWeight: 'bold' }}>
                    {item.itemType?.charAt(0) || '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {item.largeClass || '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {item.middleClass || '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: isIndividualItem ? 'bold' : 'normal' }}>
                    {item.itemName || '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {item.manufacturer || '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {item.model || '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {item.unit || '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(item.listPriceUnit)}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(item.allocPriceUnit)}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold', color: '#c62828', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(item.allocListPriceTotal)}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: isIndividualItem ? 'bold' : 'normal' }}>
                    {item.seqId || '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {item.parentSeqId || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
          <p className="text-pretty">該当する見積明細がありません</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }} className="text-pretty">絞り込み条件を変更してください</p>
        </div>
      )}
    </div>
  );
};
