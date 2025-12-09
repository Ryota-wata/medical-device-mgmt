'use client';

import React from 'react';

interface RfqGroupModalProps {
  show: boolean;
  onClose: () => void;
  selectedCount: number;
  rfqNo: string;
  rfqGroupName: string;
  onRfqGroupNameChange: (value: string) => void;
  onSubmit: () => void;
}

export const RfqGroupModal: React.FC<RfqGroupModalProps> = ({
  show,
  onClose,
  selectedCount,
  rfqNo,
  rfqGroupName,
  onRfqGroupNameChange,
  onSubmit,
}) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '30px',
          minWidth: '500px',
          maxWidth: '90%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>
          見積依頼グループ登録
        </h2>

        <div style={{ marginBottom: '20px', padding: '15px', background: '#e8f5e9', borderRadius: '4px', border: '1px solid #27ae60' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#2c3e50' }}>
            <strong>選択された申請:</strong> {selectedCount}件
          </p>
          <p style={{ margin: '0', fontSize: '13px', color: '#555' }}>
            これらの申請をまとめて見積依頼グループとして登録します
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#2c3e50'
          }}>
            見積依頼No.
          </label>
          <input
            type="text"
            value={rfqNo}
            readOnly
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: '#f5f5f5',
              color: '#555',
              fontFamily: 'monospace',
              fontWeight: 'bold'
            }}
          />
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#7f8c8d' }}>
            ※自動採番されます
          </p>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#2c3e50'
          }}>
            見積依頼グループ名称 <span style={{ color: '#e74c3c' }}>*</span>
          </label>
          <input
            type="text"
            value={rfqGroupName}
            onChange={(e) => onRfqGroupNameChange(e.target.value)}
            placeholder="例: 2025年度リモデル第1期"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            style={{
              padding: '10px 24px',
              background: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#7f8c8d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#95a5a6';
            }}
          >
            キャンセル
          </button>
          <button
            style={{
              padding: '10px 24px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            onClick={onSubmit}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#229954';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#27ae60';
            }}
          >
            登録
          </button>
        </div>
      </div>
    </div>
  );
};
