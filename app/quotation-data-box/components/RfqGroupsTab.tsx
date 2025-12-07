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
      {/* フィルター */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <label style={{ fontSize: '14px', color: '#555' }}>ステータス:</label>
        <select
          value={rfqStatusFilter}
          onChange={(e) => onFilterChange(e.target.value as RfqGroupStatus | '')}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="">すべて</option>
          <option value="未送信">未送信</option>
          <option value="送信済み">送信済み</option>
          <option value="回答受領">回答受領</option>
        </select>
      </div>

      {/* テーブル */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>見積依頼No.</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>グループ名称</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>作成日</th>
            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#2c3e50' }}>申請件数</th>
            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#2c3e50' }}>ステータス</th>
            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#2c3e50' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {filteredRfqGroups.map((group) => (
            <tr key={group.id} style={{ borderBottom: '1px solid #dee2e6' }}>
              <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600 }}>{group.rfqNo}</td>
              <td style={{ padding: '12px' }}>{group.groupName}</td>
              <td style={{ padding: '12px' }}>{group.createdDate}</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>{group.applicationIds.length}</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    background: group.status === '未送信' ? '#95a5a6' :
                               group.status === '送信済み' ? '#3498db' : '#27ae60',
                    color: 'white'
                  }}
                >
                  {group.status}
                </span>
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <button
                  onClick={() => onRegisterQuotation(group.id)}
                  style={{
                    padding: '6px 12px',
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold'
                  }}
                >
                  見積書登録
                </button>
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
