import React from 'react';
import { RfqGroup } from '@/lib/types';

interface RfqGroupsTabProps {
  rfqGroups: RfqGroup[];
  onSendRfq?: (rfqGroupId: number) => void;
  onRegisterQuotation: (rfqGroupId: number) => void;
  onRegisterOrder: (rfqGroupId: number) => void;
  onRegisterInspection: (rfqGroupId: number) => void;
  onRegisterAssetProvisional: (rfqGroupId: number) => void;
  onUpdateDeadline: (rfqGroupId: number, deadline: string | undefined) => void;
}

const thGroupStyle: React.CSSProperties = {
  padding: '8px 6px',
  border: '1px solid #495057',
  fontWeight: 600,
  fontSize: '12px',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
};

const thSubStyle: React.CSSProperties = {
  padding: '6px 8px',
  border: '1px solid #6c757d',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '12px',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '8px',
  border: '1px solid #ddd',
  whiteSpace: 'nowrap',
};

export const RfqGroupsTab: React.FC<RfqGroupsTabProps> = ({
  rfqGroups,
  onSendRfq,
  onRegisterQuotation,
  onRegisterOrder,
  onRegisterInspection,
  onRegisterAssetProvisional,
  onUpdateDeadline,
}) => {
  const getStatusBadge = (status: string) => {
    const bg =
      status === '見積依頼' ? '#3498db' :
      status === '見積依頼済' ? '#f39c12' :
      status === '見積登録済' ? '#27ae60' :
      status === '発注登録済' ? '#8e44ad' :
      status === '検収登録済' ? '#e67e22' :
      status === '資産仮登録済' ? '#16a085' :
      status === '資産登録済' ? '#7f8c8d' : '#95a5a6';

    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        background: bg,
        color: 'white',
        whiteSpace: 'nowrap',
      }}>
        {status}
      </span>
    );
  };

  const getActionButton = (group: RfqGroup) => {
    const btnBase: React.CSSProperties = {
      padding: '6px 12px',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    };

    if (group.status === '見積依頼') {
      return (
        <button onClick={() => onSendRfq?.(group.id)} style={{ ...btnBase, background: '#3498db' }}>
          見積依頼
        </button>
      );
    }
    if (group.status === '見積依頼済') {
      return (
        <button onClick={() => onRegisterQuotation(group.id)} style={{ ...btnBase, background: '#27ae60' }}>
          見積登録
        </button>
      );
    }
    if (group.status === '見積登録済') {
      return (
        <button onClick={() => onRegisterOrder(group.id)} style={{ ...btnBase, background: '#8e44ad' }}>
          発注登録
        </button>
      );
    }
    if (group.status === '発注登録済') {
      return (
        <button onClick={() => onRegisterInspection(group.id)} style={{ ...btnBase, background: '#e67e22' }}>
          検収登録
        </button>
      );
    }
    if (group.status === '検収登録済') {
      return (
        <button onClick={() => onRegisterAssetProvisional(group.id)} style={{ ...btnBase, background: '#16a085' }}>
          資産仮登録
        </button>
      );
    }
    if (group.status === '資産仮登録済') {
      return (
        <button onClick={() => {}} style={{ ...btnBase, background: '#2c3e50' }}>
          資産登録
        </button>
      );
    }
    return <span style={{ color: '#7f8c8d', fontSize: '12px' }}>-</span>;
  };

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
          {/* グループヘッダー行 */}
          <tr style={{ background: '#343a40', color: 'white' }}>
            <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'left' }}>見積依頼No.</th>
            <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'left' }}>見積グループ名称</th>
            <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center' }}>業者情報</th>
            <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'center' }}>ステータス</th>
            <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'center' }}>期限</th>
            <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'center' }}>操作</th>
          </tr>
          {/* サブカラムヘッダー行 */}
          <tr style={{ background: '#495057', color: 'white' }}>
            <th style={thSubStyle}>業者名</th>
            <th style={thSubStyle}>氏名</th>
            <th style={thSubStyle}>連絡先</th>
          </tr>
        </thead>
        <tbody>
          {rfqGroups.map((group, index) => (
            <tr key={group.id} style={{ background: index % 2 === 0 ? 'white' : '#fafafa' }}>
              <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600 }}>{group.rfqNo}</td>
              <td style={tdStyle}>{group.groupName}</td>
              <td style={tdStyle}>{group.vendorName || '-'}</td>
              <td style={tdStyle}>{group.personInCharge || '-'}</td>
              <td style={tdStyle}>{group.tel || '-'}</td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                {getStatusBadge(group.status)}
              </td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                <input
                  type="date"
                  value={group.deadline || ''}
                  onChange={(e) => onUpdateDeadline(group.id, e.target.value || undefined)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    color: group.deadline ? '#2c3e50' : '#aaa',
                    background: 'white',
                    cursor: 'pointer',
                    width: '130px',
                  }}
                />
              </td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                {getActionButton(group)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rfqGroups.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
          該当する見積依頼グループがありません
        </div>
      )}
    </div>
  );
};
