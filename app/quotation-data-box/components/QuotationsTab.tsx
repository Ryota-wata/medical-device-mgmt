import React, { useState } from 'react';
import { RfqGroup } from '@/lib/types';
import { ReceivedQuotationGroup, ReceivedQuotationItem, QuotationFilter, AccountTitle } from '@/lib/types/quotation';

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

// パーセンテージフォーマット
const formatPercent = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return `${value}%`;
};

// 勘定科目のオプション
const accountTitleOptions: AccountTitle[] = [
  '器械備品',
  '医療機器',
  '什器備品',
  '建物付属設備',
  '消耗品費',
  '修繕費',
  '委託費'
];

export const QuotationsTab: React.FC<QuotationsTabProps> = ({
  quotationGroups,
  quotationItems,
  rfqGroups,
  quotationFilter,
  onFilterChange,
  onUpdateItem,
}) => {
  // 編集中のセル
  const [editingCell, setEditingCell] = useState<{ itemId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // フィルタリングされた明細
  const filteredItems = quotationItems.filter(item => {
    const group = quotationGroups.find(g => g.id === item.quotationGroupId);
    if (!group) return false;
    if (quotationFilter.rfqGroupId && group.rfqGroupId?.toString() !== quotationFilter.rfqGroupId) {
      return false;
    }
    return true;
  });

  // 編集開始
  const startEditing = (itemId: number, field: string, currentValue: string | number | undefined) => {
    setEditingCell({ itemId, field });
    setEditValue(currentValue?.toString() || '');
  };

  // 編集確定
  const commitEdit = () => {
    if (!editingCell || !onUpdateItem) return;

    const { itemId, field } = editingCell;
    let value: string | number | undefined = editValue;

    // 数値フィールドの場合は数値に変換
    if (['allocListPriceUnit', 'allocListPriceTotal', 'allocPriceUnit', 'allocDiscount', 'allocTaxRate', 'allocTaxTotal'].includes(field)) {
      value = parseFloat(editValue) || 0;
    }

    onUpdateItem(itemId, { [field]: value });
    setEditingCell(null);
    setEditValue('');
  };

  // 編集キャンセル
  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // キーハンドラ
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // ヘッダースタイル
  const thStyle: React.CSSProperties = {
    padding: '6px 4px',
    textAlign: 'left',
    fontWeight: 'bold',
    color: '#2c3e50',
    whiteSpace: 'nowrap',
    fontSize: '10px',
    background: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
  };

  const thStyleRight: React.CSSProperties = {
    ...thStyle,
    textAlign: 'right',
  };

  const thStyleCenter: React.CSSProperties = {
    ...thStyle,
    textAlign: 'center',
  };

  // セルスタイル
  const tdStyle: React.CSSProperties = {
    padding: '6px 4px',
    fontSize: '10px',
    borderBottom: '1px solid #eee',
  };

  const tdStyleRight: React.CSSProperties = {
    ...tdStyle,
    textAlign: 'right',
  };

  const tdStyleCenter: React.CSSProperties = {
    ...tdStyle,
    textAlign: 'center',
  };

  // 編集可能なセルのスタイル
  const editableCellStyle: React.CSSProperties = {
    ...tdStyleRight,
    cursor: 'pointer',
    background: '#fffbf0',
  };

  // 見積依頼No・枝番の表示
  const formatRfqNoBranch = (item: ReceivedQuotationItem) => {
    if (!item.rfqNo) return '-';
    if (item.branchNo) {
      return `${item.rfqNo}-${item.branchNo}`;
    }
    return item.rfqNo;
  };

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
          黄色背景のセルは編集可能です
        </div>
      </div>

      {/* テーブル */}
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', minWidth: '2400px' }}>
          {/* エリアヘッダー */}
          <thead>
            <tr>
              <th colSpan={5} style={{ padding: '4px', background: '#fff3e0', color: '#e65100', fontWeight: 'bold', fontSize: '11px', textAlign: 'center', border: '1px solid #ffcc80' }}>
                商品情報（原本情報）
              </th>
              <th colSpan={7} style={{ padding: '4px', background: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold', fontSize: '11px', textAlign: 'center', border: '1px solid #a5d6a7' }}>
                AI判定・資産マスタ情報
              </th>
              <th style={{ padding: '4px', background: '#f3e5f5', color: '#7b1fa2', fontWeight: 'bold', fontSize: '11px', textAlign: 'center', border: '1px solid #ce93d8' }}>
                見積依頼
              </th>
              <th colSpan={5} style={{ padding: '4px', background: '#e3f2fd', color: '#1565c0', fontWeight: 'bold', fontSize: '11px', textAlign: 'center', border: '1px solid #90caf9' }}>
                価格情報（原本情報）
              </th>
              <th colSpan={7} style={{ padding: '4px', background: '#fce4ec', color: '#c62828', fontWeight: 'bold', fontSize: '11px', textAlign: 'center', border: '1px solid #f48fb1' }}>
                価格情報（按分登録）★編集可能
              </th>
            </tr>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              {/* 商品情報（原本情報） */}
              <th style={thStyleCenter}>No</th>
              <th style={thStyle}>品名</th>
              <th style={thStyle}>メーカー</th>
              <th style={thStyle}>型式</th>
              <th style={thStyleRight}>数量</th>
              {/* AI判定・資産マスタ情報 */}
              <th style={thStyleCenter}>登録区分</th>
              <th style={thStyle}>category</th>
              <th style={thStyle}>大分類</th>
              <th style={thStyle}>中分類</th>
              <th style={thStyle}>個体管理品目</th>
              <th style={thStyle}>メーカー</th>
              <th style={thStyle}>型式</th>
              {/* 見積依頼No・枝番 */}
              <th style={thStyleCenter}>No・枝番</th>
              {/* 価格情報（原本情報） */}
              <th style={thStyleRight}>定価単価</th>
              <th style={thStyleRight}>定価金額</th>
              <th style={thStyleRight}>購入単価</th>
              <th style={thStyleRight}>購入金額</th>
              <th style={thStyle}>備考</th>
              {/* 価格情報（按分登録） */}
              <th style={thStyleRight}>定価単価</th>
              <th style={thStyleRight}>定価金額</th>
              <th style={thStyleRight}>登録単価<br/>(税別)</th>
              <th style={thStyleRight}>値引率</th>
              <th style={thStyleRight}>消費税率</th>
              <th style={thStyleRight}>税込金額</th>
              <th style={thStyleCenter}>勘定科目</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const isEditing = (field: string) =>
                editingCell?.itemId === item.id && editingCell?.field === field;

              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  {/* 商品情報（原本情報） */}
                  <td style={tdStyleCenter}>{item.rowNo || '-'}</td>
                  <td style={{ ...tdStyle, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.originalItemName}>
                    {item.originalItemName || '-'}
                  </td>
                  <td style={tdStyle}>{item.originalManufacturer || '-'}</td>
                  <td style={tdStyle}>{item.originalModel || '-'}</td>
                  <td style={tdStyleRight}>{item.originalQuantity}</td>

                  {/* AI判定・資産マスタ情報 */}
                  <td style={{ ...tdStyleCenter, fontSize: '9px' }}>{item.itemType}</td>
                  <td style={tdStyle}>{item.category || '-'}</td>
                  <td style={tdStyle}>{item.largeClass || '-'}</td>
                  <td style={tdStyle}>{item.middleClass || '-'}</td>
                  <td style={{ ...tdStyle, fontWeight: 500, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.itemName}>
                    {item.itemName || '-'}
                  </td>
                  <td style={tdStyle}>{item.manufacturer || '-'}</td>
                  <td style={tdStyle}>{item.model || '-'}</td>

                  {/* 見積依頼No・枝番 */}
                  <td style={{ ...tdStyleCenter, fontSize: '9px' }}>{formatRfqNoBranch(item)}</td>

                  {/* 価格情報（原本情報） */}
                  <td style={tdStyleRight}>{formatCurrency(item.listPriceUnit)}</td>
                  <td style={tdStyleRight}>{formatCurrency(item.listPriceTotal)}</td>
                  <td style={tdStyleRight}>{formatCurrency(item.purchasePriceUnit)}</td>
                  <td style={{ ...tdStyleRight, fontWeight: 600 }}>{formatCurrency(item.purchasePriceTotal)}</td>
                  <td style={{ ...tdStyle, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.remarks}>
                    {item.remarks || '-'}
                  </td>

                  {/* 価格情報（按分登録）- 編集可能 */}
                  <td
                    style={editableCellStyle}
                    onClick={() => !isEditing('allocListPriceUnit') && startEditing(item.id, 'allocListPriceUnit', item.allocListPriceUnit)}
                  >
                    {isEditing('allocListPriceUnit') ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        style={{ width: '80px', fontSize: '10px', padding: '2px' }}
                      />
                    ) : (
                      formatCurrency(item.allocListPriceUnit)
                    )}
                  </td>
                  <td
                    style={editableCellStyle}
                    onClick={() => !isEditing('allocListPriceTotal') && startEditing(item.id, 'allocListPriceTotal', item.allocListPriceTotal)}
                  >
                    {isEditing('allocListPriceTotal') ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        style={{ width: '80px', fontSize: '10px', padding: '2px' }}
                      />
                    ) : (
                      formatCurrency(item.allocListPriceTotal)
                    )}
                  </td>
                  <td
                    style={editableCellStyle}
                    onClick={() => !isEditing('allocPriceUnit') && startEditing(item.id, 'allocPriceUnit', item.allocPriceUnit)}
                  >
                    {isEditing('allocPriceUnit') ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        style={{ width: '80px', fontSize: '10px', padding: '2px' }}
                      />
                    ) : (
                      formatCurrency(item.allocPriceUnit)
                    )}
                  </td>
                  <td
                    style={{ ...editableCellStyle, color: item.allocDiscount && item.allocDiscount > 0 ? '#c62828' : '#666' }}
                    onClick={() => !isEditing('allocDiscount') && startEditing(item.id, 'allocDiscount', item.allocDiscount)}
                  >
                    {isEditing('allocDiscount') ? (
                      <input
                        type="number"
                        step="0.1"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        style={{ width: '50px', fontSize: '10px', padding: '2px' }}
                      />
                    ) : (
                      item.allocDiscount && item.allocDiscount > 0 ? `-${formatPercent(item.allocDiscount)}` : '-'
                    )}
                  </td>
                  <td
                    style={editableCellStyle}
                    onClick={() => !isEditing('allocTaxRate') && startEditing(item.id, 'allocTaxRate', item.allocTaxRate)}
                  >
                    {isEditing('allocTaxRate') ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        style={{ width: '50px', fontSize: '10px', padding: '2px' }}
                      />
                    ) : (
                      formatPercent(item.allocTaxRate)
                    )}
                  </td>
                  <td
                    style={{ ...editableCellStyle, fontWeight: 'bold', color: '#c62828' }}
                    onClick={() => !isEditing('allocTaxTotal') && startEditing(item.id, 'allocTaxTotal', item.allocTaxTotal)}
                  >
                    {isEditing('allocTaxTotal') ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        style={{ width: '80px', fontSize: '10px', padding: '2px' }}
                      />
                    ) : (
                      formatCurrency(item.allocTaxTotal)
                    )}
                  </td>
                  <td
                    style={{ ...tdStyleCenter, background: '#fffbf0', cursor: 'pointer' }}
                    onClick={() => !isEditing('accountTitle') && startEditing(item.id, 'accountTitle', item.accountTitle)}
                  >
                    {isEditing('accountTitle') ? (
                      <select
                        value={editValue}
                        onChange={(e) => {
                          setEditValue(e.target.value);
                          if (onUpdateItem) {
                            onUpdateItem(item.id, { accountTitle: e.target.value as AccountTitle });
                          }
                          setEditingCell(null);
                        }}
                        onBlur={cancelEdit}
                        autoFocus
                        style={{ fontSize: '10px', padding: '2px' }}
                      >
                        <option value="">-</option>
                        {accountTitleOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      item.accountTitle || '-'
                    )}
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
