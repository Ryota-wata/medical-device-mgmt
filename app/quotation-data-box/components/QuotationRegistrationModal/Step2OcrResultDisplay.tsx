import React from 'react';
import { OCRResult } from '@/lib/types/quotation';

interface Step2OcrResultDisplayProps {
  ocrResult: OCRResult;
  onBack: () => void;
  onNext: () => void;
}

export const Step2OcrResultDisplay: React.FC<Step2OcrResultDisplayProps> = ({
  ocrResult,
  onBack,
  onNext,
}) => {
  return (
    <div>
      <div style={{ marginBottom: '20px', padding: '15px', background: '#e8f5e9', borderRadius: '4px' }}>
        <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
          <strong>業者:</strong> {ocrResult.vendorName}
        </p>
        <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
          <strong>見積日:</strong> {ocrResult.quotationDate}
        </p>
        <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
          <strong>有効期限:</strong> {ocrResult.validityPeriod}ヶ月
        </p>
        <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
          <strong>納期:</strong> {ocrResult.deliveryPeriod}ヶ月
        </p>
        <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
          <strong>フェーズ:</strong> {ocrResult.phase}
        </p>
        <p style={{ margin: '0', fontSize: '14px' }}>
          <strong>総額:</strong> ¥{ocrResult.totalAmount.toLocaleString()}
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>OCR読み取り結果</h3>
        <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>品目名</th>
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>数量</th>
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>単価</th>
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>金額</th>
              </tr>
            </thead>
            <tbody>
              {ocrResult.items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{item.itemName}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{item.quantity}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>¥{item.sellingPriceUnit.toLocaleString()}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>¥{item.sellingPriceTotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={onBack}
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
          戻る
        </button>
        <button
          onClick={onNext}
          style={{
            padding: '10px 24px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          次へ（資産マスタ紐付け）
        </button>
      </div>
    </div>
  );
};
