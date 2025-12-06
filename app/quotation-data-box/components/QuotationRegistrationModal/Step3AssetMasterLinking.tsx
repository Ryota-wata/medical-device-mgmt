import React from 'react';
import { AssetMaster } from '@/lib/types';
import { OCRResult } from '@/lib/types/quotation';

interface Step3AssetMasterLinkingProps {
  ocrResult: OCRResult;
  assetMasterData: AssetMaster[];
  itemAssetLinks: Record<number, string>;
  onOpenAssetMasterWindow: (itemId: number) => void;
  onAdoptRecommendation: (itemIndex: number, assetId: string) => void;
  onRemoveLink: (itemIndex: number) => void;
  getAIRecommendation: (item: { itemName: string; manufacturer?: string; model?: string }) => AssetMaster | undefined;
  onBack: () => void;
  onSubmit: () => void;
}

export const Step3AssetMasterLinking: React.FC<Step3AssetMasterLinkingProps> = ({
  ocrResult,
  assetMasterData,
  itemAssetLinks,
  onOpenAssetMasterWindow,
  onAdoptRecommendation,
  onRemoveLink,
  getAIRecommendation,
  onBack,
  onSubmit,
}) => {
  return (
    <div>
      <div style={{ marginBottom: '20px', padding: '15px', background: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: '#856404' }}>
          各明細項目に資産マスタを紐付けてください
        </p>
        <p style={{ margin: '0', fontSize: '13px', color: '#856404' }}>
          資産マスタを紐付けることで、申請との連携がスムーズになります。後からでも紐付け可能です。
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
              <tr>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>品目名</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>メーカー</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>型番</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>金額</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>資産マスタ</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {ocrResult.items.map((item, index) => {
                const recommendation = getAIRecommendation({
                  itemName: item.itemName,
                  manufacturer: item.manufacturer,
                  model: item.model
                });
                const selectedAssetId = itemAssetLinks[index];
                const selectedAsset = selectedAssetId ? assetMasterData.find(a => a.id === selectedAssetId) : null;

                return (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 8px' }}>{item.itemName}</td>
                    <td style={{ padding: '12px 8px', color: '#555' }}>{item.manufacturer || '-'}</td>
                    <td style={{ padding: '12px 8px', color: '#555' }}>{item.model || '-'}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>¥{item.sellingPriceTotal.toLocaleString()}</td>
                    <td style={{ padding: '12px 8px' }}>
                      {selectedAsset ? (
                        <div style={{ fontSize: '12px' }}>
                          <div style={{ fontWeight: 'bold', color: '#27ae60' }}>{selectedAsset.item}</div>
                          <div style={{ color: '#7f8c8d' }}>{selectedAsset.largeClass} / {selectedAsset.mediumClass}</div>
                        </div>
                      ) : recommendation ? (
                        <div style={{ fontSize: '12px', padding: '8px', background: '#e8f5e9', borderRadius: '4px', border: '1px dashed #27ae60' }}>
                          <div style={{ fontWeight: 'bold', color: '#27ae60', marginBottom: '4px' }}>AI推薦</div>
                          <div style={{ color: '#555' }}>{recommendation.item}</div>
                          <div style={{ color: '#7f8c8d', fontSize: '11px' }}>{recommendation.largeClass} / {recommendation.mediumClass}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#95a5a6' }}>未設定</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        {recommendation && !selectedAsset && (
                          <button
                            onClick={() => onAdoptRecommendation(index, recommendation.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#27ae60',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            推薦を採用
                          </button>
                        )}
                        <button
                          onClick={() => onOpenAssetMasterWindow(index)}
                          style={{
                            padding: '6px 12px',
                            background: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          選択
                        </button>
                        {selectedAsset && (
                          <button
                            onClick={() => onRemoveLink(index)}
                            style={{
                              padding: '6px 12px',
                              background: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            解除
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
          onClick={onSubmit}
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
        >
          登録確定
        </button>
      </div>
    </div>
  );
};
