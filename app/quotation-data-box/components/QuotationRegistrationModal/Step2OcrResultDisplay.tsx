import React, { useMemo } from 'react';
import { OCRResult } from '@/lib/types/quotation';

interface Step2OcrResultDisplayProps {
  ocrResult: OCRResult;
  pdfFile: File | null;
  onBack: () => void;
  onNext: () => void;
}

export const Step2OcrResultDisplay: React.FC<Step2OcrResultDisplayProps> = ({
  ocrResult,
  pdfFile,
  onBack,
  onNext,
}) => {
  // 金額フォーマット
  const formatCurrency = (value: number) => `¥${value.toLocaleString()}`;

  // パーセンテージフォーマット
  const formatPercent = (value: number) => `${value}%`;

  // PDFプレビュー用のURL生成
  const pdfUrl = useMemo(() => {
    if (pdfFile) {
      return URL.createObjectURL(pdfFile);
    }
    return null;
  }, [pdfFile]);

  // コンポーネントアンマウント時にURLを解放
  React.useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      {/* 左側: PDFプレビュー */}
      <div style={{
        flex: '0 0 400px',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #e0e0e0',
        paddingRight: '20px'
      }}>
        <h3 style={{ fontSize: '14px', marginBottom: '10px', color: '#2c3e50' }}>
          見積書プレビュー
        </h3>
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            style={{
              width: '100%',
              height: '600px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: '#f5f5f5'
            }}
            title="見積書PDF"
          />
        ) : (
          <div style={{
            width: '100%',
            height: '600px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999'
          }}>
            PDFファイルがありません
          </div>
        )}
      </div>

      {/* 右側: OCR結果 */}
      <div style={{ flex: 1, minWidth: 0 }}>
      {/* 日付情報・宛先・業者情報 */}
      <div style={{ marginBottom: '20px', padding: '15px', background: '#e8f5e9', borderRadius: '4px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#2e7d32', borderBottom: '1px solid #a5d6a7', paddingBottom: '5px' }}>
              日付情報
            </h4>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
              <strong>見積日:</strong> {ocrResult.quotationDate}
            </p>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
              <strong>見積有効期限:</strong> {ocrResult.validityPeriod}ヶ月
            </p>
            <p style={{ margin: '0', fontSize: '14px' }}>
              <strong>納期:</strong> {ocrResult.deliveryPeriod}ヶ月
            </p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#2e7d32', borderBottom: '1px solid #a5d6a7', paddingBottom: '5px' }}>
              取引先情報
            </h4>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
              <strong>宛先（施設名）:</strong> {ocrResult.facilityName}
            </p>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
              <strong>業者名:</strong> {ocrResult.vendorName}
            </p>
            <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#1565c0' }}>
              <strong>総額:</strong> {formatCurrency(ocrResult.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* 明細情報テーブル */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>OCR読み取り結果 - 明細情報</h3>
        <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '1200px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap' }}>品名</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap' }}>メーカー名</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap' }}>型式</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap' }}>数量</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap', background: '#fff3e0' }}>定価単価</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap', background: '#fff3e0' }}>定価金額</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap', background: '#e3f2fd' }}>納入単価</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap', background: '#e3f2fd' }}>納入金額</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap', background: '#ffebee' }}>値引</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap' }}>消費税率</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap', background: '#e8f5e9', fontWeight: 'bold' }}>納入金額（税込）</th>
              </tr>
            </thead>
            <tbody>
              {ocrResult.items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px 8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.itemName}>
                    {item.itemName}
                  </td>
                  <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>{item.manufacturer || '-'}</td>
                  <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>{item.model || '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>{item.quantity} {item.unit}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', background: '#fffaf0' }}>{formatCurrency(item.listPriceUnit)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', background: '#fffaf0' }}>{formatCurrency(item.listPriceTotal)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', background: '#f5faff' }}>{formatCurrency(item.sellingPriceUnit)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', background: '#f5faff', fontWeight: 600 }}>{formatCurrency(item.sellingPriceTotal)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', background: '#fff8f8', color: item.discount > 0 ? '#c62828' : '#666' }}>
                    {item.discount > 0 ? `-${formatPercent(item.discount)}` : '-'}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>{formatPercent(item.taxRate)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', background: '#f1f8e9', fontWeight: 'bold', color: '#2e7d32' }}>
                    {formatCurrency(item.totalWithTax)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f5f5f5', fontWeight: 'bold' }}>
                <td colSpan={7} style={{ padding: '10px 8px', textAlign: 'right' }}>合計</td>
                <td style={{ padding: '10px 8px', textAlign: 'right', background: '#e3f2fd' }}>
                  {formatCurrency(ocrResult.items.reduce((sum, item) => sum + item.sellingPriceTotal, 0))}
                </td>
                <td style={{ padding: '10px 8px' }}></td>
                <td style={{ padding: '10px 8px' }}></td>
                <td style={{ padding: '10px 8px', textAlign: 'right', background: '#c8e6c9', color: '#1b5e20', fontSize: '14px' }}>
                  {formatCurrency(ocrResult.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 凡例 */}
      <div style={{ marginBottom: '20px', padding: '10px', background: '#fafafa', borderRadius: '4px', fontSize: '12px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '12px', height: '12px', background: '#fff3e0', border: '1px solid #ddd' }}></span>
          定価関連
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '12px', height: '12px', background: '#e3f2fd', border: '1px solid #ddd' }}></span>
          納入価格関連
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '12px', height: '12px', background: '#ffebee', border: '1px solid #ddd' }}></span>
          値引情報
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '12px', height: '12px', background: '#e8f5e9', border: '1px solid #ddd' }}></span>
          税込金額
        </span>
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
      </div>{/* 右側: OCR結果 終わり */}
    </div>
  );
};
