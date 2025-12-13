import React, { useState, useEffect } from 'react';

// フィールドのラベル定義
const FIELD_LABELS: Record<string, string> = {
  'applicationNo': '申請番号',
  'applicationDate': '申請日',
  'applicationType': '申請種別',
  'facility.building': '棟',
  'facility.floor': '階',
  'facility.department': '部門',
  'facility.section': '部署',
  'roomName': '諸室名',
  'asset.name': '品目',
  'vendor': 'メーカー',
  'asset.model': '型式',
  'quantity': '数量',
  'unit': '単位',
  'currentConnectionStatus': '現在の接続状況',
  'currentConnectionDestination': '現在の接続先',
  'requestConnectionStatus': '要望機器の接続要望',
  'requestConnectionDestination': '要望機器の接続先',
  'applicationReason': '申請理由・コメント等',
  'executionYear': '執行年度',
  'rfqNo': '見積依頼No.',
  'rfqGroupName': 'グループ名称',
};

// フィールドのタイプ定義
const FIELD_TYPES: Record<string, { type: 'text' | 'select'; options?: string[] }> = {
  'applicationType': {
    type: 'select',
    options: ['新規申請', '増設申請', '更新申請', '移動申請', '廃棄申請', '保留']
  },
  'currentConnectionStatus': {
    type: 'select',
    options: ['接続あり', '接続なし', 'スタンドアロン']
  },
  'requestConnectionStatus': {
    type: 'select',
    options: ['接続希望', '接続不要', 'スタンドアロン']
  },
};

interface BulkEditModalProps {
  show: boolean;
  fieldKey: string;
  currentValue: string;
  selectedCount: number;
  onClose: () => void;
  onSubmit: (value: string) => void;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  show,
  fieldKey,
  currentValue,
  selectedCount,
  onClose,
  onSubmit,
}) => {
  const [value, setValue] = useState(currentValue);

  useEffect(() => {
    setValue(currentValue);
  }, [currentValue, fieldKey]);

  if (!show) return null;

  const fieldLabel = FIELD_LABELS[fieldKey] || fieldKey;
  const fieldConfig = FIELD_TYPES[fieldKey] || { type: 'text' };

  const handleSubmit = () => {
    onSubmit(value);
    onClose();
  };

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
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '24px',
          minWidth: '400px',
          maxWidth: '500px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
          一括編集
        </h2>

        <div style={{ marginBottom: '20px', padding: '12px', background: '#e8f4fd', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#2980b9' }}>
            <strong>{selectedCount}件</strong>の申請を一括で更新します
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: '#2c3e50' }}>
            {fieldLabel}
          </label>

          {fieldConfig.type === 'select' ? (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option value="">-</option>
              {fieldConfig.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`${fieldLabel}を入力`}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              autoFocus
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '10px 20px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {selectedCount}件を更新
          </button>
        </div>
      </div>
    </div>
  );
};
