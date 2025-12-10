import React from 'react';
import { AssetMaster } from '@/lib/types';
import { OCRResult, QuotationItemType } from '@/lib/types/quotation';

// 登録区分の表示名マッピング
const ITEM_TYPE_LABELS: Record<QuotationItemType, string> = {
  'A_表紙明細': 'A_表紙明細',
  'B_明細代表': 'B_明細代表',
  'C_個体管理品目': 'C_個体管理品目',
  'D_付属品': 'D_付属品',
  'E_その他役務': 'E_その他役務',
};

// 登録区分の色設定
const ITEM_TYPE_COLORS: Record<QuotationItemType, { bg: string; text: string }> = {
  'A_表紙明細': { bg: '#e3f2fd', text: '#1565c0' },
  'B_明細代表': { bg: '#f3e5f5', text: '#7b1fa2' },
  'C_個体管理品目': { bg: '#e8f5e9', text: '#2e7d32' },
  'D_付属品': { bg: '#fff3e0', text: '#ef6c00' },
  'E_その他役務': { bg: '#fce4ec', text: '#c2185b' },
};

// AI推薦結果の型
export interface AIRecommendation {
  asset: AssetMaster;
}

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

// 類似度計算関数（内部用）
const calculateSimilarity = (
  ocrItem: { itemName: string; manufacturer?: string; model?: string },
  asset: AssetMaster
): number => {
  let score = 0;
  let maxScore = 0;

  // 品名 vs 品目（重み: 40）
  maxScore += 40;
  const itemNameLower = ocrItem.itemName.toLowerCase();
  const assetItemLower = asset.item.toLowerCase();
  if (itemNameLower === assetItemLower) {
    score += 40;
  } else if (itemNameLower.includes(assetItemLower) || assetItemLower.includes(itemNameLower)) {
    score += 30;
  } else {
    // キーワードマッチ
    const itemWords = itemNameLower.split(/[\s　・]+/);
    const assetWords = assetItemLower.split(/[\s　・]+/);
    const matchCount = itemWords.filter(w => assetWords.some(aw => aw.includes(w) || w.includes(aw))).length;
    if (matchCount > 0) {
      score += Math.min(20, matchCount * 10);
    }
  }

  // メーカー（重み: 30）
  if (ocrItem.manufacturer) {
    maxScore += 30;
    const makerLower = ocrItem.manufacturer.toLowerCase();
    const assetMakerLower = asset.maker.toLowerCase();
    if (makerLower === assetMakerLower) {
      score += 30;
    } else if (makerLower.includes(assetMakerLower) || assetMakerLower.includes(makerLower)) {
      score += 20;
    }
  }

  // 型式（重み: 30）
  if (ocrItem.model) {
    maxScore += 30;
    const modelLower = ocrItem.model.toLowerCase();
    const assetModelLower = asset.model.toLowerCase();
    if (modelLower === assetModelLower) {
      score += 30;
    } else if (modelLower.includes(assetModelLower) || assetModelLower.includes(modelLower)) {
      score += 20;
    }
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
};

// 最良の推薦を取得
const getBestRecommendation = (
  ocrItem: { itemName: string; manufacturer?: string; model?: string },
  assets: AssetMaster[]
): AIRecommendation | null => {
  let bestMatch: AIRecommendation | null = null;
  let bestSimilarity = 0;

  for (const asset of assets) {
    const similarity = calculateSimilarity(ocrItem, asset);
    if (similarity >= 30 && similarity > bestSimilarity) {
      bestMatch = { asset };
      bestSimilarity = similarity;
    }
  }

  return bestMatch;
};

export const Step3AssetMasterLinking: React.FC<Step3AssetMasterLinkingProps> = ({
  ocrResult,
  assetMasterData,
  itemAssetLinks,
  onOpenAssetMasterWindow,
  onAdoptRecommendation,
  onRemoveLink,
  onBack,
  onSubmit,
}) => {
  return (
    <div>
      <div style={{ marginBottom: '20px', padding: '15px', background: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: '#856404' }}>
          各明細項目にSHIP資産マスタを紐付けてください
        </p>
        <p style={{ margin: '0', fontSize: '13px', color: '#856404' }}>
          AIが類似度の高い資産マスタを推薦します。推薦を採用するか、別ウィンドウで資産マスタを検索して選択できます。
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ maxHeight: '500px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '900px' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
              <tr>
                <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50', whiteSpace: 'nowrap' }}>登録区分</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50', whiteSpace: 'nowrap' }}>品名</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50', whiteSpace: 'nowrap' }}>メーカー</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50', whiteSpace: 'nowrap' }}>型式</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50', background: '#e8f5e9', whiteSpace: 'nowrap' }}>AI推薦 / 紐付け済み資産マスタ</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50', whiteSpace: 'nowrap' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {ocrResult.items.map((item, index) => {
                const recommendation = getBestRecommendation(
                  { itemName: item.itemName, manufacturer: item.manufacturer, model: item.model },
                  assetMasterData
                );
                const selectedAssetId = itemAssetLinks[index];
                const selectedAsset = selectedAssetId ? assetMasterData.find(a => a.id === selectedAssetId) : null;
                const itemTypeColor = ITEM_TYPE_COLORS[item.itemType] || { bg: '#f5f5f5', text: '#666' };

                return (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    {/* 登録区分 */}
                    <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background: itemTypeColor.bg,
                        color: itemTypeColor.text,
                      }}>
                        {ITEM_TYPE_LABELS[item.itemType] || item.itemType}
                      </span>
                    </td>

                    {/* 品名 */}
                    <td style={{ padding: '10px 8px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.itemName}>
                      {item.itemName}
                    </td>

                    {/* メーカー */}
                    <td style={{ padding: '10px 8px', color: '#555', whiteSpace: 'nowrap' }}>{item.manufacturer || '-'}</td>

                    {/* 型式 */}
                    <td style={{ padding: '10px 8px', color: '#555', whiteSpace: 'nowrap' }}>{item.model || '-'}</td>

                    {/* AI推薦 / 紐付け済み */}
                    <td style={{ padding: '10px 8px', background: '#fafffe' }}>
                      {item.itemType !== 'C_個体管理品目' ? (
                        // 紐付け不要
                        <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>紐付け不要</span>
                      ) : selectedAsset ? (
                        // 紐付け済みの表示
                        <div style={{ fontSize: '11px', padding: '8px', background: '#e8f5e9', borderRadius: '4px', border: '1px solid #a5d6a7' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>紐付け済み</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 8px', color: '#333' }}>
                            <span style={{ color: '#888' }}>大分類:</span>
                            <span>{selectedAsset.largeClass}</span>
                            <span style={{ color: '#888' }}>中分類:</span>
                            <span>{selectedAsset.mediumClass}</span>
                            <span style={{ color: '#888' }}>品目:</span>
                            <span style={{ fontWeight: 'bold' }}>{selectedAsset.item}</span>
                            <span style={{ color: '#888' }}>メーカー:</span>
                            <span>{selectedAsset.maker}</span>
                            <span style={{ color: '#888' }}>型式:</span>
                            <span>{selectedAsset.model}</span>
                          </div>
                        </div>
                      ) : recommendation ? (
                        // AI推薦の表示
                        <div style={{ fontSize: '11px', padding: '8px', background: '#fff8e1', borderRadius: '4px', border: '1px dashed #ffc107' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 'bold', color: '#f57c00' }}>AI推薦</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 8px', color: '#333' }}>
                            <span style={{ color: '#888' }}>大分類:</span>
                            <span>{recommendation.asset.largeClass}</span>
                            <span style={{ color: '#888' }}>中分類:</span>
                            <span>{recommendation.asset.mediumClass}</span>
                            <span style={{ color: '#888' }}>品目:</span>
                            <span style={{ fontWeight: 'bold' }}>{recommendation.asset.item}</span>
                            <span style={{ color: '#888' }}>メーカー:</span>
                            <span>{recommendation.asset.maker}</span>
                            <span style={{ color: '#888' }}>型式:</span>
                            <span>{recommendation.asset.model}</span>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>推薦なし（手動選択が必要）</span>
                      )}
                    </td>

                    {/* 操作 */}
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      {item.itemType === 'C_個体管理品目' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          {recommendation && !selectedAsset && (
                            <button
                              onClick={() => onAdoptRecommendation(index, recommendation.asset.id)}
                              style={{
                                padding: '6px 12px',
                                background: '#ff9800',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                width: '100%',
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
                              fontSize: '11px',
                              width: '100%',
                            }}
                          >
                            別ウィンドウで選択
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
                                fontSize: '11px',
                                width: '100%',
                              }}
                            >
                              紐付け解除
                            </button>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#ccc' }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 凡例 */}
      <div style={{ marginBottom: '20px', padding: '10px', background: '#fafafa', borderRadius: '4px', fontSize: '11px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>登録区分の説明：</div>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {Object.entries(ITEM_TYPE_COLORS).map(([type, colors]) => (
            <span key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', background: colors.bg, border: `1px solid ${colors.text}`, borderRadius: '2px' }}></span>
              <span style={{ color: '#666' }}>{ITEM_TYPE_LABELS[type as QuotationItemType]}</span>
            </span>
          ))}
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
