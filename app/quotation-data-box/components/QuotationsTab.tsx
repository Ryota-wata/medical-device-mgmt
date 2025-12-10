import React from 'react';
import { RfqGroup, AssetMaster } from '@/lib/types';
import { ReceivedQuotationGroup, ReceivedQuotationItem, QuotationFilter, QuotationItemType } from '@/lib/types/quotation';
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

// 登録区分の色設定
const ITEM_TYPE_COLORS: Record<QuotationItemType, { bg: string; text: string }> = {
  'A_表紙明細': { bg: '#e3f2fd', text: '#1565c0' },
  'B_明細代表': { bg: '#f3e5f5', text: '#7b1fa2' },
  'C_個体管理品目': { bg: '#e8f5e9', text: '#2e7d32' },
  'D_付属品': { bg: '#fff3e0', text: '#ef6c00' },
  'E_その他役務': { bg: '#fce4ec', text: '#c2185b' },
};

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

  // ヘッダースタイル
  const thStyle: React.CSSProperties = {
    padding: '8px 6px',
    textAlign: 'left',
    fontWeight: 'bold',
    color: '#2c3e50',
    whiteSpace: 'nowrap',
    fontSize: '11px',
    background: '#f8f9fa',
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
    padding: '8px 6px',
    fontSize: '11px',
  };

  const tdStyleRight: React.CSSProperties = {
    ...tdStyle,
    textAlign: 'right',
  };

  const tdStyleCenter: React.CSSProperties = {
    ...tdStyle,
    textAlign: 'center',
  };

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
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '2400px' }}>
          {/* エリアヘッダー */}
          <thead>
            <tr>
              <th colSpan={11} style={{ padding: '6px', background: '#fff3e0', color: '#e65100', fontWeight: 'bold', fontSize: '12px', textAlign: 'center', border: '1px solid #ffcc80' }}>
                見積書情報
              </th>
              <th colSpan={7} style={{ padding: '6px', background: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold', fontSize: '12px', textAlign: 'center', border: '1px solid #a5d6a7' }}>
                資産情報
              </th>
              <th colSpan={7} style={{ padding: '6px', background: '#e3f2fd', color: '#1565c0', fontWeight: 'bold', fontSize: '12px', textAlign: 'center', border: '1px solid #90caf9' }}>
                価格按分登録
              </th>
              <th style={{ padding: '6px', background: '#f8f9fa' }}></th>
            </tr>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              {/* 見積書情報エリア */}
              <th style={thStyle}>品名</th>
              <th style={thStyle}>メーカー名</th>
              <th style={thStyle}>型式</th>
              <th style={thStyleRight}>数量</th>
              <th style={thStyleRight}>定価単価</th>
              <th style={thStyleRight}>定価金額</th>
              <th style={thStyleRight}>納入単価</th>
              <th style={thStyleRight}>納入金額</th>
              <th style={thStyleRight}>値引</th>
              <th style={thStyleRight}>消費税率</th>
              <th style={thStyleRight}>納入金額（税込）</th>
              {/* 資産情報エリア */}
              <th style={thStyleCenter}>登録区分</th>
              <th style={thStyle}>category</th>
              <th style={thStyle}>大分類</th>
              <th style={thStyle}>中分類</th>
              <th style={thStyle}>個体管理品目</th>
              <th style={thStyle}>メーカー</th>
              <th style={thStyle}>型式</th>
              {/* 価格按分登録エリア */}
              <th style={thStyleRight}>定価単価</th>
              <th style={thStyleRight}>定価金額</th>
              <th style={thStyleRight}>登録単価<br/>(税別)</th>
              <th style={thStyleRight}>値引率</th>
              <th style={thStyleRight}>消費税率</th>
              <th style={thStyleRight}>税込金額</th>
              <th style={thStyleCenter}>勘定<br/>科目</th>
              {/* 操作 */}
              <th style={thStyleCenter}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const group = quotationGroups.find(g => g.id === item.quotationGroupId);
              const assetMaster = item.assetMasterId
                ? assetMasterData.find(a => a.id === item.assetMasterId)
                : null;
              const itemTypeColor = ITEM_TYPE_COLORS[item.itemType] || { bg: '#f5f5f5', text: '#666' };

              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  {/* 見積書情報エリア */}
                  <td style={{ ...tdStyle, fontWeight: 500, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.itemName}>{item.itemName}</td>
                  <td style={tdStyle}>{item.manufacturer || '-'}</td>
                  <td style={tdStyle}>{item.model || '-'}</td>
                  <td style={tdStyleRight}>{item.quantity}</td>
                  <td style={tdStyleRight}>{formatCurrency(item.listPriceUnit)}</td>
                  <td style={tdStyleRight}>{formatCurrency(item.listPriceTotal)}</td>
                  <td style={tdStyleRight}>{formatCurrency(item.sellingPriceUnit)}</td>
                  <td style={{ ...tdStyleRight, fontWeight: 600 }}>{formatCurrency(item.sellingPriceTotal)}</td>
                  <td style={{ ...tdStyleRight, color: item.discount && item.discount > 0 ? '#c62828' : '#666' }}>
                    {item.discount && item.discount > 0 ? `-${formatPercent(item.discount)}` : '-'}
                  </td>
                  <td style={tdStyleRight}>{formatPercent(item.taxRate)}</td>
                  <td style={{ ...tdStyleRight, fontWeight: 'bold', color: '#e65100' }}>{formatCurrency(item.totalWithTax)}</td>
                  {/* 資産情報エリア */}
                  <td style={tdStyleCenter}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      background: itemTypeColor.bg,
                      color: itemTypeColor.text,
                    }}>
                      {item.itemType}
                    </span>
                  </td>
                  <td style={tdStyle}>{assetMaster?.category || '-'}</td>
                  <td style={tdStyle}>{assetMaster?.largeClass || '-'}</td>
                  <td style={tdStyle}>{assetMaster?.mediumClass || '-'}</td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{assetMaster?.item || '-'}</td>
                  <td style={tdStyle}>{assetMaster?.maker || '-'}</td>
                  <td style={tdStyle}>{assetMaster?.model || '-'}</td>
                  {/* 価格按分登録エリア（データなし） */}
                  <td style={tdStyleRight}>-</td>
                  <td style={tdStyleRight}>-</td>
                  <td style={tdStyleRight}>-</td>
                  <td style={tdStyleRight}>-</td>
                  <td style={tdStyleRight}>-</td>
                  <td style={tdStyleRight}>-</td>
                  <td style={tdStyleCenter}>-</td>
                  {/* 操作 */}
                  <td style={tdStyleCenter}>
                    <button
                      onClick={() => {
                        if (confirm(MESSAGES.CONFIRM_DELETE_ITEM)) {
                          onDeleteQuotation(item.quotationGroupId);
                        }
                      }}
                      style={{
                        padding: '4px 8px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '10px',
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
