'use client';

import React from 'react';
import { ApplicationType } from '@/lib/types/application';

// 申請種別の色設定
const APPLICATION_TYPE_COLORS: Record<ApplicationType, { base: string; active: string; border: string }> = {
  '新規申請': { base: '#27ae60', active: '#1e8449', border: '#145a32' },
  '増設申請': { base: '#3498db', active: '#21618c', border: '#1a4971' },
  '更新申請': { base: '#e67e22', active: '#ba4a00', border: '#873600' },
  '移動申請': { base: '#9b59b6', active: '#6c3483', border: '#512e5f' },
  '廃棄申請': { base: '#e74c3c', active: '#a93226', border: '#78281f' },
  '保留': { base: '#95a5a6', active: '#626567', border: '#424949' },
};

const APPLICATION_TYPES: ApplicationType[] = [
  '新規申請',
  '増設申請',
  '更新申請',
  '移動申請',
  '廃棄申請',
  '保留',
];

interface ApplicationTypeFilterBarProps {
  selectedCount: number;
  currentFilter: string;
  onFilterChange: (type: string) => void;
  onClearFilter: () => void;
}

export const ApplicationTypeFilterBar: React.FC<ApplicationTypeFilterBarProps> = ({
  selectedCount,
  currentFilter,
  onFilterChange,
  onClearFilter,
}) => {
  return (
    <div style={{ background: '#fff', padding: '15px 20px', borderBottom: '1px solid #dee2e6', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '14px', color: '#555', marginRight: '15px' }}>
        {selectedCount}件選択中
      </span>

      {APPLICATION_TYPES.map((type) => {
        const colors = APPLICATION_TYPE_COLORS[type];
        const isActive = currentFilter === type;

        return (
          <button
            key={type}
            style={{
              padding: '8px 16px',
              background: isActive ? colors.active : colors.base,
              color: 'white',
              border: isActive ? `2px solid ${colors.border}` : 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: isActive ? 'bold' : 'normal'
            }}
            onClick={() => onFilterChange(type)}
          >
            {type}
          </button>
        );
      })}

      {currentFilter && (
        <button
          style={{
            padding: '8px 16px',
            background: 'white',
            color: '#e74c3c',
            border: '1px solid #e74c3c',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'normal',
            marginLeft: '10px'
          }}
          onClick={onClearFilter}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e74c3c';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.color = '#e74c3c';
          }}
        >
          クリア
        </button>
      )}
    </div>
  );
};
