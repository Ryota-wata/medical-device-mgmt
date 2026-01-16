'use client';

import React from 'react';

interface RfqGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfqGroupName: string;
  setRfqGroupName: (name: string) => void;
  selectedCount: number;
  generatedRfqNo: string;
  onSubmit: () => void;
}

export function RfqGroupModal({
  isOpen,
  onClose,
  rfqGroupName,
  setRfqGroupName,
  selectedCount,
  generatedRfqNo,
  onSubmit,
}: RfqGroupModalProps) {
  if (!isOpen) return null;

  const handleCancel = () => {
    onClose();
    setRfqGroupName('');
  };

  const handleSubmit = () => {
    if (!rfqGroupName.trim()) {
      alert('見積依頼グループ名を入力してください');
      return;
    }
    onSubmit();
  };

  return (
    <div
      onClick={handleCancel}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* モーダルヘッダー */}
        <div
          style={{
            background: '#e74c3c',
            color: 'white',
            padding: '16px 20px',
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>見積依頼グループ作成</span>
          <button
            onClick={handleCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'white',
              padding: '0',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
            }}
          >
            ×
          </button>
        </div>

        {/* モーダルボディ */}
        <div style={{ padding: '24px' }}>
          {/* 見積依頼No */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
              見積依頼No.（自動採番）
            </label>
            <input
              type="text"
              value={generatedRfqNo}
              readOnly
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                background: '#f8f9fa',
                color: '#666',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* 見積依頼グループ名 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
              見積依頼グループ名
            </label>
            <input
              type="text"
              value={rfqGroupName}
              onChange={(e) => setRfqGroupName(e.target.value)}
              placeholder="例: 2025年度放射線科機器更新"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* 選択件数 */}
          <div style={{
            marginBottom: '20px',
            padding: '12px',
            background: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #ddd',
          }}>
            <span style={{ color: '#666' }}>選択されたレコード: </span>
            <span style={{ fontWeight: 'bold', color: '#e74c3c' }}>{selectedCount}件</span>
          </div>

          {/* ボタン */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCancel}
              style={{
                padding: '10px 20px',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmit}
              disabled={!rfqGroupName.trim()}
              style={{
                padding: '10px 20px',
                background: rfqGroupName.trim() ? '#e74c3c' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: rfqGroupName.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              作成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
