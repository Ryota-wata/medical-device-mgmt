import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { OCRResult, QuotationItemType, AIJudgmentResult, ConfirmedStateMap, ConfirmedAssetInfo } from '@/lib/types/quotation';

// 登録区分の表示名マッピング
const ITEM_TYPE_LABELS: Record<QuotationItemType, string> = {
  'A_表紙明細': 'A',
  'B_明細代表': 'B',
  'C_個体管理品目': 'C',
  'D_付属品': 'D',
  'E_その他役務': 'E',
};

// 登録区分の色設定
const ITEM_TYPE_COLORS: Record<QuotationItemType, { bg: string; text: string }> = {
  'A_表紙明細': { bg: '#e3f2fd', text: '#1565c0' },
  'B_明細代表': { bg: '#f3e5f5', text: '#7b1fa2' },
  'C_個体管理品目': { bg: '#e8f5e9', text: '#2e7d32' },
  'D_付属品': { bg: '#fff3e0', text: '#ef6c00' },
  'E_その他役務': { bg: '#fce4ec', text: '#c2185b' },
};

interface Step2OcrResultDisplayProps {
  ocrResult: OCRResult;
  pdfFile: File | null;
  confirmedState: ConfirmedStateMap;
  onConfirmedStateChange: (state: ConfirmedStateMap) => void;
  onBack: () => void;
  onNext: () => void;
}

// 商品明細とAI判定の1対1表示用
interface DisplayRow {
  ocrItemIndex: number;
  ocrItem: {
    rowNo?: number;
    itemType: QuotationItemType;
    itemName: string;
    manufacturer: string;
    model: string;
    quantity: number;
  };
  aiJudgment: AIJudgmentResult | null;
}

export const Step2OcrResultDisplay: React.FC<Step2OcrResultDisplayProps> = ({
  ocrResult,
  pdfFile,
  confirmedState,
  onConfirmedStateChange,
  onBack,
  onNext,
}) => {
  // 選択中の行（資産マスタ選択待ち）
  const [selectingRow, setSelectingRow] = useState<number | null>(null);

  // 別ウィンドウからの資産マスタ選択を受信
  const handleAssetMasterMessage = useCallback((event: MessageEvent) => {
    // 同一オリジンからのメッセージのみ受け付ける
    if (event.origin !== window.location.origin) return;

    if (event.data?.type === 'ASSET_MASTER_SELECTED' && selectingRow !== null) {
      const assetData: ConfirmedAssetInfo = event.data.data;
      const key = `${selectingRow}`;
      onConfirmedStateChange({
        ...confirmedState,
        [key]: {
          status: 'asset_master_selected',
          assetInfo: assetData,
        },
      });
      setSelectingRow(null);
    }
  }, [selectingRow, confirmedState, onConfirmedStateChange]);

  useEffect(() => {
    window.addEventListener('message', handleAssetMasterMessage);
    return () => {
      window.removeEventListener('message', handleAssetMasterMessage);
    };
  }, [handleAssetMasterMessage]);

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

  // 表示用の行データを生成（1対1）
  const displayRows: DisplayRow[] = useMemo(() => {
    return ocrResult.items.map((item, ocrItemIndex) => ({
      ocrItemIndex,
      ocrItem: {
        rowNo: item.rowNo,
        itemType: item.itemType,
        itemName: item.itemName,
        manufacturer: item.manufacturer,
        model: item.model,
        quantity: item.quantity,
      },
      // AI判定は最初の1件のみ使用
      aiJudgment: item.aiJudgments[0] || null,
    }));
  }, [ocrResult.items]);

  // AI判定を確定する
  const handleConfirm = (ocrItemIndex: number, aiJudgment: AIJudgmentResult) => {
    const key = `${ocrItemIndex}`;
    onConfirmedStateChange({
      ...confirmedState,
      [key]: {
        status: 'ai_confirmed',
        assetInfo: {
          category: aiJudgment.category,
          majorCategory: aiJudgment.majorCategory,
          middleCategory: aiJudgment.middleCategory,
          assetName: aiJudgment.assetName,
          manufacturer: aiJudgment.manufacturer,
          model: aiJudgment.model,
        },
      },
    });
  };

  // 確定を解除する
  const handleUnconfirm = (ocrItemIndex: number) => {
    const key = `${ocrItemIndex}`;
    const newState = { ...confirmedState };
    delete newState[key];
    onConfirmedStateChange(newState);
  };

  // 資産マスタを別ウィンドウで開いて選択させる
  const handleOpenAssetMasterForSelection = (ocrItemIndex: number) => {
    setSelectingRow(ocrItemIndex);
    // GitHub Pages対応: basePathを付与
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    window.open(`${basePath}/ship-asset-master?mode=select`, '_blank', 'width=1200,height=800');
  };

  // 確定状態を取得
  const getConfirmedInfo = (ocrItemIndex: number) => {
    const key = `${ocrItemIndex}`;
    return confirmedState[key] || null;
  };

  // 確定済みかどうか
  const isRowConfirmed = (ocrItemIndex: number): boolean => {
    return getConfirmedInfo(ocrItemIndex) !== null;
  };

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      {/* 左側: PDFプレビュー */}
      <div style={{
        flex: '0 0 350px',
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
              height: '700px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: '#f5f5f5'
            }}
            title="見積書PDF"
          />
        ) : (
          <div style={{
            width: '100%',
            height: '700px',
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
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* ヘッダー情報 */}
        <div style={{ marginBottom: '12px', padding: '10px', background: '#e8f5e9', borderRadius: '4px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '20px', fontSize: '12px', flexWrap: 'wrap' }}>
            <span><strong>見積日:</strong> {ocrResult.quotationDate}</span>
            <span><strong>業者:</strong> {ocrResult.vendorName}</span>
            <span><strong>宛先:</strong> {ocrResult.facilityName}</span>
            <span style={{ fontWeight: 'bold', color: '#1565c0' }}>
              <strong>総額:</strong> ¥{ocrResult.totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 明細テーブル */}
        <div style={{ marginBottom: '12px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexShrink: 0 }}>
            <h3 style={{ fontSize: '13px', margin: 0, color: '#2c3e50' }}>
              AI-OCR読み取り結果
            </h3>
            <span style={{ fontSize: '11px', color: '#666' }}>
              ※ 全ての明細が登録されます。資産マスタ紐付けは任意です。
            </span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', border: '1px solid #ddd', borderRadius: '4px', maxHeight: '500px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', minWidth: '1100px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                {/* 2段ヘッダー：グループ名 */}
                <tr>
                  <th colSpan={5} style={{
                    padding: '6px',
                    textAlign: 'center',
                    borderBottom: '2px solid #3498db',
                    fontWeight: 'bold',
                    color: '#3498db',
                    background: '#e8f4fc',
                    fontSize: '11px'
                  }}>
                    商品情報（原本情報）
                  </th>
                  <th style={{
                    padding: '6px',
                    textAlign: 'center',
                    borderBottom: '2px solid #dee2e6',
                    background: '#f8f9fa',
                    width: '25px'
                  }}>
                    ⇒
                  </th>
                  <th colSpan={6} style={{
                    padding: '6px',
                    textAlign: 'center',
                    borderBottom: '2px solid #9c27b0',
                    fontWeight: 'bold',
                    color: '#9c27b0',
                    background: '#f3e5f5',
                    fontSize: '11px'
                  }}>
                    AI判定（参考）
                  </th>
                  <th style={{
                    padding: '6px',
                    textAlign: 'center',
                    borderBottom: '2px solid #dee2e6',
                    background: '#f8f9fa',
                    width: '150px',
                    fontSize: '11px'
                  }}>
                    操作
                  </th>
                </tr>
                {/* 2段ヘッダー：カラム名 */}
                <tr style={{ background: '#f8f9fa' }}>
                  {/* 原本情報 */}
                  <th style={{ padding: '5px 3px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '30px', fontSize: '9px' }}>No</th>
                  <th style={{ padding: '5px 3px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '9px' }}>品名</th>
                  <th style={{ padding: '5px 3px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '70px', fontSize: '9px' }}>メーカー</th>
                  <th style={{ padding: '5px 3px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '70px', fontSize: '9px' }}>型式</th>
                  <th style={{ padding: '5px 3px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '35px', fontSize: '9px' }}>数量</th>
                  {/* 矢印 */}
                  <th style={{ padding: '5px 3px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '25px', background: '#fafafa', fontSize: '9px' }}>区分</th>
                  {/* AI判定 */}
                  <th style={{ padding: '5px 3px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '70px', fontSize: '9px', background: '#faf5fc' }}>category</th>
                  <th style={{ padding: '5px 3px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '90px', fontSize: '9px', background: '#faf5fc' }}>大分類</th>
                  <th style={{ padding: '5px 3px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '70px', fontSize: '9px', background: '#faf5fc' }}>中分類</th>
                  <th style={{ padding: '5px 3px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '9px', background: '#faf5fc' }}>個体管理品目</th>
                  <th style={{ padding: '5px 3px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '60px', fontSize: '9px', background: '#faf5fc' }}>メーカー</th>
                  <th style={{ padding: '5px 3px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '60px', fontSize: '9px', background: '#faf5fc' }}>型式</th>
                  {/* 操作 */}
                  <th style={{ padding: '5px 3px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '150px', fontSize: '9px' }}></th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, index) => {
                  const confirmedInfo = getConfirmedInfo(row.ocrItemIndex);
                  const rowIsConfirmed = confirmedInfo !== null;
                  const isSelectingThisRow = selectingRow === row.ocrItemIndex;

                  // 表示するデータを決定（確定済みの場合はassetInfoを表示）
                  const displayData = confirmedInfo?.assetInfo || row.aiJudgment;

                  const aiItemTypeColor = row.aiJudgment
                    ? ITEM_TYPE_COLORS[row.aiJudgment.itemType] || { bg: '#f5f5f5', text: '#666' }
                    : { bg: '#f5f5f5', text: '#666' };

                  return (
                    <tr key={index} style={{
                      borderBottom: '1px solid #ddd',
                      background: isSelectingThisRow ? '#fff3e0' : rowIsConfirmed ? '#e8f5e9' : 'transparent',
                    }}>
                      {/* 原本情報 */}
                      <td style={{ padding: '5px 3px', textAlign: 'center', borderRight: '1px solid #eee' }}>
                        {row.ocrItem.rowNo || '-'}
                      </td>
                      <td style={{ padding: '5px 3px', fontWeight: 'bold', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.ocrItem.itemName}>
                        {row.ocrItem.itemName}
                      </td>
                      <td style={{ padding: '5px 3px', color: '#555', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.ocrItem.manufacturer}>
                        {row.ocrItem.manufacturer || '-'}
                      </td>
                      <td style={{ padding: '5px 3px', color: '#555', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.ocrItem.model}>
                        {row.ocrItem.model || '-'}
                      </td>
                      <td style={{ padding: '5px 3px', textAlign: 'center', borderRight: '1px solid #ddd' }}>
                        {row.ocrItem.quantity}
                      </td>
                      {/* 登録区分 */}
                      <td style={{ padding: '5px 3px', textAlign: 'center', background: isSelectingThisRow ? '#ffe0b2' : rowIsConfirmed ? '#c8e6c9' : '#fafafa' }}>
                        {row.aiJudgment ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 5px',
                            borderRadius: '3px',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            background: aiItemTypeColor.bg,
                            color: aiItemTypeColor.text,
                          }}>
                            {ITEM_TYPE_LABELS[row.aiJudgment.itemType]}
                          </span>
                        ) : (
                          <span style={{ color: '#ccc' }}>-</span>
                        )}
                      </td>
                      {/* AI判定結果（または資産マスタ選択結果） */}
                      <td style={{ padding: '5px 3px', background: isSelectingThisRow ? '#ffe0b2' : rowIsConfirmed ? '#c8e6c9' : '#fdfaff', fontSize: '9px' }}>
                        {displayData && 'category' in displayData ? displayData.category : <span style={{ color: '#ccc' }}>-</span>}
                      </td>
                      <td style={{ padding: '5px 3px', background: isSelectingThisRow ? '#ffe0b2' : rowIsConfirmed ? '#c8e6c9' : '#fdfaff', fontSize: '9px', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={displayData && 'majorCategory' in displayData ? displayData.majorCategory : ''}>
                        {displayData && 'majorCategory' in displayData ? displayData.majorCategory : <span style={{ color: '#ccc' }}>-</span>}
                      </td>
                      <td style={{ padding: '5px 3px', background: isSelectingThisRow ? '#ffe0b2' : rowIsConfirmed ? '#c8e6c9' : '#fdfaff', fontSize: '9px', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={displayData && 'middleCategory' in displayData ? displayData.middleCategory : ''}>
                        {displayData && 'middleCategory' in displayData ? displayData.middleCategory : <span style={{ color: '#ccc' }}>-</span>}
                      </td>
                      <td style={{ padding: '5px 3px', background: isSelectingThisRow ? '#ffe0b2' : rowIsConfirmed ? '#c8e6c9' : '#fdfaff', fontWeight: row.aiJudgment?.itemType === 'C_個体管理品目' ? 'bold' : 'normal', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={displayData?.assetName || ''}>
                        {displayData?.assetName || <span style={{ color: '#ccc' }}>-</span>}
                      </td>
                      <td style={{ padding: '5px 3px', background: isSelectingThisRow ? '#ffe0b2' : rowIsConfirmed ? '#c8e6c9' : '#fdfaff', color: '#555', fontSize: '9px', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={displayData?.manufacturer || ''}>
                        {displayData?.manufacturer || <span style={{ color: '#ccc' }}>-</span>}
                      </td>
                      <td style={{ padding: '5px 3px', background: isSelectingThisRow ? '#ffe0b2' : rowIsConfirmed ? '#c8e6c9' : '#fdfaff', color: '#555', fontSize: '9px', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={displayData?.model || ''}>
                        {displayData?.model || <span style={{ color: '#ccc' }}>-</span>}
                      </td>
                      {/* 操作ボタン */}
                      <td style={{ padding: '5px 3px', textAlign: 'center' }}>
                        {rowIsConfirmed ? (
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 6px',
                              background: confirmedInfo?.status === 'asset_master_selected' ? '#1976d2' : '#27ae60',
                              color: 'white',
                              borderRadius: '3px',
                              fontSize: '8px',
                              fontWeight: 'bold',
                            }}>
                              {confirmedInfo?.status === 'asset_master_selected' ? '紐付済' : 'AI適用'}
                            </span>
                            <button
                              onClick={() => handleUnconfirm(row.ocrItemIndex)}
                              style={{
                                padding: '3px 5px',
                                background: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '8px',
                                fontWeight: 'bold',
                              }}
                              title="紐付けを解除"
                            >
                              解除
                            </button>
                          </div>
                        ) : isSelectingThisRow ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            background: '#ff9800',
                            color: 'white',
                            borderRadius: '3px',
                            fontSize: '8px',
                            fontWeight: 'bold',
                          }}>
                            選択中...
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {row.aiJudgment && (
                              <button
                                onClick={() => row.aiJudgment && handleConfirm(row.ocrItemIndex, row.aiJudgment)}
                                style={{
                                  padding: '3px 5px',
                                  background: '#ff9800',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '8px',
                                  fontWeight: 'bold',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                AI適用
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenAssetMasterForSelection(row.ocrItemIndex)}
                              style={{
                                padding: '3px 5px',
                                background: '#1976d2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '8px',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              マスタ選択
                            </button>
                          </div>
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
        <div style={{ marginBottom: '12px', padding: '8px', background: '#fafafa', borderRadius: '4px', fontSize: '9px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: '#555' }}>登録区分：</span>
            {Object.entries(ITEM_TYPE_COLORS).map(([type, colors]) => (
              <span key={type} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '1px 3px',
                  borderRadius: '2px',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  background: colors.bg,
                  color: colors.text,
                }}>
                  {ITEM_TYPE_LABELS[type as QuotationItemType]}
                </span>
                <span style={{ color: '#666' }}>{type}</span>
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexShrink: 0 }}>
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
            次へ（申請確認）
          </button>
        </div>
      </div>
    </div>
  );
};
