import React, { useMemo } from 'react';
import { RfqGroup, RfqGroupStatus } from '@/lib/types';

interface RfqGroupsTabProps {
  rfqGroups: RfqGroup[];
  rfqStatusFilter: RfqGroupStatus | '';
  onFilterChange: (filter: RfqGroupStatus | '') => void;
  onRegisterQuotation: (rfqGroupId: number) => void;
}

export const RfqGroupsTab: React.FC<RfqGroupsTabProps> = ({
  rfqGroups,
  rfqStatusFilter,
  onFilterChange,
  onRegisterQuotation,
}) => {
  const filteredRfqGroups = useMemo(() => {
    if (!rfqStatusFilter) return rfqGroups;
    return rfqGroups.filter(group => group.status === rfqStatusFilter);
  }, [rfqGroups, rfqStatusFilter]);

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
      {/* テーブル */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', tableLayout: 'auto' }}>
        <thead>
          <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', whiteSpace: 'nowrap' }}>見積依頼No.</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', whiteSpace: 'nowrap' }}>見積グループ名称</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', whiteSpace: 'nowrap' }}>見積依頼先</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', whiteSpace: 'nowrap' }}>担当</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', whiteSpace: 'nowrap' }}>mail</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', whiteSpace: 'nowrap' }}>連絡先(TEL)</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', whiteSpace: 'nowrap' }}>依頼日</th>
            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#2c3e50', whiteSpace: 'nowrap' }}>ステータス</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', whiteSpace: 'nowrap' }}>提出期限</th>
            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#2c3e50', whiteSpace: 'nowrap' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {filteredRfqGroups.map((group) => (
            <tr key={group.id} style={{ borderBottom: '1px solid #dee2e6' }}>
              <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600, whiteSpace: 'nowrap' }}>{group.rfqNo}</td>
              <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{group.groupName}</td>
              <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{group.vendorName || '-'}</td>
              <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{group.personInCharge || '-'}</td>
              <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{group.email || '-'}</td>
              <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{group.tel || '-'}</td>
              <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{group.createdDate}</td>
              <td style={{ padding: '12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    background: group.status === '見積依頼' ? '#3498db' :
                               group.status === '見積依頼済' ? '#f39c12' :
                               group.status === '登録依頼' ? '#9b59b6' :
                               group.status === '見積登録済' ? '#27ae60' : '#2ecc71',
                    color: 'white',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {group.status}
                </span>
              </td>
              <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{group.deadline || '-'}</td>
              <td style={{ padding: '12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                {group.status === '見積依頼' && (
                  <button
                    onClick={() => {/* 見積依頼処理 */}}
                    style={{
                      padding: '6px 12px',
                      background: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    見積依頼
                  </button>
                )}
                {group.status === '見積依頼済' && (
                  <button
                    onClick={() => onRegisterQuotation(group.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    見積登録
                  </button>
                )}
                {group.status === '登録依頼' && (
                  <button
                    onClick={() => {/* 登録依頼処理 */}}
                    style={{
                      padding: '6px 12px',
                      background: '#9b59b6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    登録依頼
                  </button>
                )}
                {(group.status === '見積登録済' || group.status === '原本登録用最終見積登録') && (
                  <span style={{ color: '#7f8c8d', fontSize: '12px' }}>-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredRfqGroups.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
          見積依頼グループがありません
        </div>
      )}
    </div>
  );
};
