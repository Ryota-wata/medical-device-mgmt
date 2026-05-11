'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { StepProgressBar } from '../components/StepProgressBar';

// 明細区分の型（STEP3と統一）
type DetailClassification =
  | '明細代表'
  | '内訳代表'
  | '親明細'
  | '子明細'
  | '孫明細'
  | 'その他'
  | '値引き'
  | '';

// AI判定結果の型
interface AIJudgmentResult {
  category: string;         // category
  majorCategory: string;    // 大分類
  middleCategory: string;   // 中分類
  assetName: string;        // 個体管理品目名
  manufacturer: string;     // メーカー
  model: string;            // 型式
}

// 確定済み資産情報の型
interface ConfirmedAssetInfo {
  category?: string;
  majorCategory?: string;
  middleCategory?: string;
  assetName: string;
  manufacturer: string;
  model: string;
}

// 確定状態の型
interface ConfirmedState {
  status: 'ai_confirmed' | 'asset_master_selected';
  assetInfo: ConfirmedAssetInfo;
}

// 明細データの型
interface DetailItem {
  id: number;
  rowNo: number;
  itemName: string;           // 品名（見積名称）
  manufacturer: string;       // メーカー
  model: string;              // 型式（見積名称）
  quantity: number | null;    // 数量
  detailClassification: DetailClassification; // 明細区分（STEP3から引継ぎ）
  category: string;           // カテゴリ（STEP3から引継ぎ）
  aiJudgment: AIJudgmentResult | null; // AI判定結果
}

import { customerStep4Items } from '@/lib/data/customer/step4-asset-master';

// 明細区分マッピング
const step4ClassMap: Record<string, DetailClassification> = {
  '代表明細': '明細代表', '親': '親明細', '子': '子明細', '孫': '孫明細',
  'その他': 'その他', '文字列': 'その他', '値引き': '値引き',
};

// 顧客サンプルデータから変換（再取り込み: node docs/customer-sample-data/convert.mjs）
// 親明細・明細代表にはAI判定結果を設定、子・孫・その他にはnull
const testDetailItems: DetailItem[] = customerStep4Items.map((item, i) => {
  const classification = step4ClassMap[item.itemType] || '' as DetailClassification;
  const hasAI = classification === '親明細' || classification === '明細代表';
  return {
    id: i + 1,
    rowNo: item.rowNo,
    itemName: item.originalItemName,
    manufacturer: item.originalManufacturer,
    model: item.originalModel,
    quantity: item.quantity || null,
    detailClassification: classification,
    category: item.category || '',
    aiJudgment: hasAI && item.itemName ? {
      category: item.category || '',
      majorCategory: item.largeClass || '',
      middleCategory: item.middleClass || '',
      assetName: item.itemName,
      manufacturer: item.manufacturer || item.originalManufacturer,
      model: item.model || item.originalModel,
    } : null,
  };
});

export default function ItemAiMatchingPage() {
  const router = useRouter();

  // 明細データ
  const [detailItems] = useState<DetailItem[]>(testDetailItems);

  // 確定状態の管理
  const [confirmedState, setConfirmedState] = useState<Record<string, ConfirmedState>>({});

  // 選択中の行（資産マスタ選択待ち）
  const [selectingRow, setSelectingRow] = useState<number | null>(null);

  // 個体管理品目のみ表示フィルタ
  const [showOnlyIndividual, setShowOnlyIndividual] = useState(false);

  // 個体管理品目（親明細・子明細）
  const individualItems = useMemo(() => {
    return detailItems.filter(
      item => item.detailClassification === '親明細' || item.detailClassification === '子明細'
    );
  }, [detailItems]);

  // 表示対象
  const displayItems = useMemo(() => {
    if (showOnlyIndividual) return individualItems;
    return detailItems;
  }, [detailItems, individualItems, showOnlyIndividual]);

  // 確定状態を取得
  const getConfirmedInfo = (id: number): ConfirmedState | null => {
    const key = `${id}`;
    return confirmedState[key] || null;
  };

  // 確定済み件数
  const confirmedCount = useMemo(() => {
    return individualItems.filter(item => getConfirmedInfo(item.id) !== null).length;
  }, [individualItems, confirmedState]);

  // 別ウィンドウからの資産マスタ選択を受信（registration-editと同じパターン）
  const handleAssetMasterMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;

    if (event.data?.type === 'ASSET_SELECTED' && selectingRow !== null) {
      const assetMasters = event.data.assets as Record<string, string>[];
      const scope = (event.data.scope as 'all' | 'toMaker' | 'toItem') || 'all';

      if (assetMasters && assetMasters.length > 0) {
        const master = assetMasters[0];
        let assetInfo: ConfirmedAssetInfo;

        switch (scope) {
          case 'toItem':
            assetInfo = {
              category: master.category || '',
              majorCategory: master.largeClass || '',
              middleCategory: master.mediumClass || '',
              assetName: master.item || '',
              manufacturer: '',
              model: '',
            };
            break;
          case 'toMaker':
            assetInfo = {
              category: master.category || '',
              majorCategory: master.largeClass || '',
              middleCategory: master.mediumClass || '',
              assetName: master.item || '',
              manufacturer: master.maker || '',
              model: '',
            };
            break;
          case 'all':
          default:
            assetInfo = {
              category: master.category || '',
              majorCategory: master.largeClass || '',
              middleCategory: master.mediumClass || '',
              assetName: master.item || '',
              manufacturer: master.maker || '',
              model: master.model || '',
            };
            break;
        }

        const key = `${selectingRow}`;
        setConfirmedState(prev => ({
          ...prev,
          [key]: {
            status: 'asset_master_selected',
            assetInfo,
          },
        }));
        setSelectingRow(null);
      }
    }
  }, [selectingRow]);

  useEffect(() => {
    window.addEventListener('message', handleAssetMasterMessage);
    return () => {
      window.removeEventListener('message', handleAssetMasterMessage);
    };
  }, [handleAssetMasterMessage]);

  // AI判定を適用する
  const handleApplyAI = (id: number, aiJudgment: AIJudgmentResult) => {
    const key = `${id}`;
    setConfirmedState(prev => ({
      ...prev,
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
    }));
  };

  // 確定を解除する
  const handleUnconfirm = (id: number) => {
    const key = `${id}`;
    setConfirmedState(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  };

  // 資産マスタを別ウィンドウで開く（registration-editと同じパターン）
  const handleOpenAssetMaster = (id: number) => {
    setSelectingRow(id);
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    window.open(
      `${basePath}/asset-master`,
      'AssetMasterWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  // 戻るボタン
  const handleBack = () => {
    router.push('/quotation-data-box/category-registration');
  };

  // 次へボタン
  const handleNext = () => {
    const allConfirmed = individualItems.every(item => getConfirmedInfo(item.id) !== null);
    if (!allConfirmed) {
      if (!confirm('未登録の個体品目があります。続行しますか？')) {
        return;
      }
    }
    router.push('/quotation-data-box/price-allocation');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f5f5f5' }}>
      <Header
        title="見積登録（購入）個体品目AI判定"
        stepBadge="STEP 4"
        hideMenu={true}
        showBackButton={false}
      />
      <StepProgressBar currentStep={4} />

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* メインコンテンツ */}
        <div style={{
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          marginBottom: '16px',
        }}>
          {/* セクションヘッダー */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: '#374151',
            color: 'white',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>個体品目AI判定</span>
            </div>
          </div>

          {/* 説明文 */}
          <div style={{ padding: '12px 16px', background: '#f3e5f5', fontSize: '12px', color: '#7b1fa2', borderBottom: '1px solid #ce93d8' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              個体管理品目のAI判定を実施し確認・修正を実施してください
            </div>
            <div style={{ fontSize: '11px', color: '#555' }}>
              ・不適格な場合は資産マスタを別ウィンドウで開いて選択が可能です<br />
              ・IDの登録により耐用年数、推奨使用年数、添付文書などの情報が登録できます
            </div>
          </div>

          {/* 進捗状況 + フィルタ */}
          <div style={{ padding: '12px 16px', display: 'flex', gap: '16px', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
            <button
              onClick={() => setShowOnlyIndividual(!showOnlyIndividual)}
              style={{
                padding: '6px 14px',
                background: showOnlyIndividual ? '#27ae60' : '#e8f5e9',
                border: '1px solid #a5d6a7',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: showOnlyIndividual ? 'white' : '#2e7d32',
                cursor: 'pointer',
              }}
            >
              個体管理品目のみ表示
            </button>
            <div style={{
              padding: '6px 14px',
              background: confirmedCount === individualItems.length ? '#c8e6c9' : '#fff3e0',
              border: `1px solid ${confirmedCount === individualItems.length ? '#a5d6a7' : '#ffcc80'}`,
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: confirmedCount === individualItems.length ? '#2e7d32' : '#ef6c00',
            }}>
              紐付け済み: {confirmedCount}/{individualItems.length}件
            </div>
          </div>

          {/* 明細テーブル */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '1400px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                {/* 2段ヘッダー */}
                <tr>
                  <th colSpan={5} style={{
                    padding: '6px', textAlign: 'center', borderBottom: '2px solid #333',
                    fontWeight: 'bold', background: '#e8f4fc', fontSize: '11px'
                  }}>
                    商品情報（原本情報）
                  </th>
                  <th colSpan={2} style={{
                    padding: '6px', textAlign: 'center', borderBottom: '2px solid #333',
                    borderRight: '1px solid #ccc',
                    fontWeight: 'bold', background: '#e8f4fc', fontSize: '11px'
                  }}>
                    STEP❸
                  </th>
                  <th colSpan={7} style={{
                    padding: '6px', textAlign: 'center', borderBottom: '2px solid #9c27b0',
                    fontWeight: 'bold', color: '#9c27b0', background: '#f3e5f5', fontSize: '11px'
                  }}>
                    STEP❹ 個体管理品目登録
                  </th>
                </tr>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '5px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '30px' }}>No</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', minWidth: '140px' }}>品名（見積名称）</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '80px' }}>メーカー</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '100px' }}>型式（見積名称）</th>
                  <th style={{ padding: '5px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '40px' }}>数量</th>
                  <th style={{ padding: '5px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '60px' }}>明細区分</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #ccc', width: '90px' }}>カテゴリ</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '130px', background: '#faf5fc' }}>大分類</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '90px', background: '#faf5fc' }}>中分類</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', minWidth: '140px', background: '#faf5fc' }}>個体管理品目</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '80px', background: '#faf5fc' }}>メーカー</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '100px', background: '#faf5fc' }}>型式</th>
                  <th style={{ padding: '5px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '180px', background: '#faf5fc' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item) => {
                  const confirmedInfo = getConfirmedInfo(item.id);
                  const rowIsConfirmed = confirmedInfo !== null;
                  const isSelectingThisRow = selectingRow === item.id;
                  const aiJudgment = item.aiJudgment;
                  const displayData = confirmedInfo?.assetInfo || aiJudgment;
                  const isIndividual = item.detailClassification === '親明細' || item.detailClassification === '子明細';
                  const classColor = item.detailClassification === '親明細' ? '#e74c3c'
                    : item.detailClassification === '子明細' ? '#2196f3'
                    : item.detailClassification === '孫明細' ? '#9c27b0'
                    : '#666';

                  return (
                    <tr key={item.id} style={{
                      borderBottom: '1px solid #ddd',
                      background: isSelectingThisRow ? '#fff3e0' : rowIsConfirmed ? '#e8f5e9' : 'transparent',
                    }}>
                      <td style={{ padding: '5px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{item.rowNo}</td>
                      <td style={{ padding: '5px' }} title={item.itemName}>{item.itemName}</td>
                      <td style={{ padding: '5px', color: '#555' }}>{item.manufacturer || ''}</td>
                      <td style={{ padding: '5px', color: '#555' }}>{item.model || ''}</td>
                      <td style={{ padding: '5px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{item.quantity ?? '-'}</td>
                      <td style={{ padding: '5px', textAlign: 'center' }}>
                        {item.detailClassification && (
                          <span style={{
                            padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 'bold',
                            color: 'white', background: classColor,
                          }}>
                            {item.detailClassification.replace('明細', '')}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '5px', fontSize: '10px', borderRight: '1px solid #ccc' }}>
                        {item.category || ''}
                      </td>
                      {/* STEP4 columns */}
                      <td style={{ padding: '5px', background: isIndividual ? (rowIsConfirmed ? '#c8e6c9' : '#fdfaff') : 'transparent', fontSize: '10px' }}>
                        {displayData?.majorCategory || ''}
                      </td>
                      <td style={{ padding: '5px', background: isIndividual ? (rowIsConfirmed ? '#c8e6c9' : '#fdfaff') : 'transparent', fontSize: '10px' }}>
                        {displayData?.middleCategory || ''}
                      </td>
                      <td style={{ padding: '5px', background: isIndividual ? (rowIsConfirmed ? '#c8e6c9' : '#fdfaff') : 'transparent', fontWeight: isIndividual ? 'bold' : 'normal' }}>
                        {displayData?.assetName || item.itemName || ''}
                      </td>
                      <td style={{ padding: '5px', background: isIndividual ? (rowIsConfirmed ? '#c8e6c9' : '#fdfaff') : 'transparent', color: '#555', fontSize: '10px' }}>
                        {displayData?.manufacturer || ''}
                      </td>
                      <td style={{ padding: '5px', background: isIndividual ? (rowIsConfirmed ? '#c8e6c9' : '#fdfaff') : 'transparent', color: '#555', fontSize: '10px' }}>
                        {displayData?.model || ''}
                      </td>
                      <td style={{ padding: '5px', textAlign: 'center' }}>
                        {isIndividual ? (
                          rowIsConfirmed ? (
                            <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ padding: '2px 5px', background: '#ff9800', color: 'white', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold' }}>
                                {confirmedInfo?.status === 'asset_master_selected' ? 'AI適用' : 'AI適用'}
                              </span>
                              <span style={{ padding: '2px 5px', background: '#27ae60', color: 'white', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold' }}>
                                資産マスタ
                              </span>
                              <span style={{ padding: '2px 5px', background: '#2196f3', color: 'white', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold' }}>
                                紐付済
                              </span>
                              <span style={{ padding: '2px 5px', background: '#e74c3c', color: 'white', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => handleUnconfirm(item.id)}>
                                解除
                              </span>
                            </div>
                          ) : isSelectingThisRow ? (
                            <span style={{ padding: '3px 8px', background: '#ff9800', color: 'white', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold' }}>
                              選択中...
                            </span>
                          ) : (
                            <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', flexWrap: 'wrap' }}>
                              {aiJudgment && (
                                <button onClick={() => handleApplyAI(item.id, aiJudgment)} style={{ padding: '2px 5px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>
                                  AI適用
                                </button>
                              )}
                              <button onClick={() => handleOpenAssetMaster(item.id)} style={{ padding: '2px 5px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                資産マスタ
                              </button>
                            </div>
                          )
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

        {/* フッターボタン */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '16px' }}>
          <button
            onClick={handleBack}
            style={{
              padding: '12px 28px',
              background: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            一つ前のSTEPに戻る
          </button>
          <button
            onClick={handleNext}
            style={{
              padding: '12px 28px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            個体登録/価格按分へ
          </button>
        </div>
      </div>
    </div>
  );
}
