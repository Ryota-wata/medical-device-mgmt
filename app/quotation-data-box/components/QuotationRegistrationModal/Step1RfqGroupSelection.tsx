import React from 'react';
import { RfqGroup } from '@/lib/types';
import { QuotationFormData } from '@/lib/types/quotation';

interface Step1RfqGroupSelectionProps {
  rfqGroups: RfqGroup[];
  formData: QuotationFormData;
  ocrProcessing: boolean;
  onFormDataChange: (formData: QuotationFormData) => void;
  onPdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateTestOCR: () => void;
  onCancel: () => void;
}

export const Step1RfqGroupSelection: React.FC<Step1RfqGroupSelectionProps> = ({
  rfqGroups,
  formData,
  ocrProcessing,
  onFormDataChange,
  onPdfUpload,
  onGenerateTestOCR,
  onCancel,
}) => {
  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }}>
          見積依頼グループ（任意）
        </label>
        <select
          value={formData.rfqGroupId}
          onChange={(e) => onFormDataChange({ ...formData, rfqGroupId: e.target.value })}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        >
          <option value="">なし</option>
          {rfqGroups.map(g => (
            <option key={g.id} value={g.id}>{g.rfqNo} - {g.groupName}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }}>
          見積書PDF
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={onPdfUpload}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '10px'
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
          <span style={{ color: '#7f8c8d', fontSize: '13px' }}>または</span>
          <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
        </div>
        <button
          onClick={onGenerateTestOCR}
          disabled={ocrProcessing}
          style={{
            width: '100%',
            padding: '10px',
            marginTop: '10px',
            background: ocrProcessing ? '#bdc3c7' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: ocrProcessing ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {ocrProcessing ? 'AI OCR処理中...' : 'テストデータで次へ'}
        </button>
        {ocrProcessing && (
          <div style={{ marginTop: '10px', color: '#3498db', fontSize: '13px', textAlign: 'center' }}>
            AI OCR処理中...
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
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
        >
          キャンセル
        </button>
      </div>
    </div>
  );
};
