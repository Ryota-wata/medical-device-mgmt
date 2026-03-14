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

// 明細区分の短縮表示
const classificationLabel = (itemType?: string): string => {
  if (!itemType) return '';
  if (itemType.startsWith('C')) return '親';
  if (itemType.startsWith('D')) return '子';
  return '';
};

export const QuotationsTab: React.FC<QuotationsTabProps> = ({
  items,
}) => {
  // 表示対象: 親明細(C)・子明細(D)のみ
  const displayItems = items.filter(
    (item) => item.itemType?.startsWith('C') || item.itemType?.startsWith('D')
  );

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
      {/* テーブル */}
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', width: '60px', fontWeight: 600, whiteSpace: 'nowrap' }}>明細区分</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', width: '50px', fontWeight: 600, whiteSpace: 'nowrap' }}>SEQ</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', width: '100px', fontWeight: 600, whiteSpace: 'nowrap' }}>大分類</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', width: '100px', fontWeight: 600, whiteSpace: 'nowrap' }}>中分類</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>個体管理品目</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', width: '100px', fontWeight: 600, whiteSpace: 'nowrap' }}>メーカー</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', width: '100px', fontWeight: 600, whiteSpace: 'nowrap' }}>型式</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', width: '80px', fontWeight: 600, whiteSpace: 'nowrap' }}>数量／単位</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'right', width: '120px', fontWeight: 600, whiteSpace: 'nowrap' }}>案分金額（税別）</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', width: '100px', fontWeight: 600, whiteSpace: 'nowrap' }}>部門</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', width: '100px', fontWeight: 600, whiteSpace: 'nowrap' }}>部署</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', width: '100px', fontWeight: 600, whiteSpace: 'nowrap' }}>室名</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', width: '100px', fontWeight: 600, whiteSpace: 'nowrap' }}>管理部署</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item) => {
              const isParent = item.itemType?.startsWith('C');
              const rowBg = isParent ? '#e8f5e9' : '#fffde7';
              const labelBg = isParent ? '#4caf50' : '#ffc107';

              return (
                <tr key={item.id} style={{ background: rowBg }}>
                  {/* 明細区分 */}
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', background: labelBg, color: 'white', fontWeight: 'bold' }}>
                    {classificationLabel(item.itemType)}
                  </td>
                  {/* SEQ */}
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: isParent ? 'bold' : 'normal', fontVariantNumeric: 'tabular-nums' }}>
                    {item.seqId || '-'}
                  </td>
                  {/* 大分類 */}
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {item.largeClass || '-'}
                  </td>
                  {/* 中分類 */}
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {item.middleClass || '-'}
                  </td>
                  {/* 個体管理品目 */}
                  <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                    {item.itemName || '-'}
                  </td>
                  {/* メーカー */}
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {item.manufacturer || '-'}
                  </td>
                  {/* 型式 */}
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {item.model || '-'}
                  </td>
                  {/* 数量／単位 */}
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                    1 / {item.unit || '-'}
                  </td>
                  {/* 案分金額（税別） */}
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold', color: '#c62828', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(item.allocListPriceTotal)}
                  </td>
                  {/* 部門 */}
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    -
                  </td>
                  {/* 部署 */}
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    -
                  </td>
                  {/* 室名 */}
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    -
                  </td>
                  {/* 管理部署 */}
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    -
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {displayItems.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
          <p className="text-pretty">該当する見積明細がありません</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }} className="text-pretty">絞り込み条件を変更してください</p>
        </div>
      )}
    </div>
  );
};
