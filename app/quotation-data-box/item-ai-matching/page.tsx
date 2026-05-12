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
    <div className="flex flex-col h-dvh bg-surface-screen">
      <Header
        title="見積登録（購入）個体品目AI判定"
        stepBadge="STEP 4"
        hideMenu={true}
        showBackButton={false}
      />
      <StepProgressBar currentStep={4} />

      <div className="flex-1 overflow-auto p-4">
        <section className="bg-surface-card border border-stroke-input rounded mb-4">
          <div className="flex items-center justify-between px-4 py-3 bg-content-primary text-white">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold">個体品目AI判定</span>
            </div>
          </div>

          <div className="px-4 py-3 bg-surface-select text-xs text-cta-primary-dark border-b border-cta-primary">
            <p className="font-bold mb-1">個体管理品目のAI判定を実施し確認・修正を実施してください</p>
            <p className="text-[11px] text-content-primary">
              ・不適格な場合は資産マスタを別ウィンドウで開いて選択が可能です<br />
              ・IDの登録により耐用年数、推奨使用年数、添付文書などの情報が登録できます
            </p>
          </div>

          <div className="px-4 py-3 flex gap-4 items-center border-b border-stroke-input">
            <button
              onClick={() => setShowOnlyIndividual(!showOnlyIndividual)}
              className={`px-3.5 py-1.5 border rounded text-xs font-bold cursor-pointer transition-colors ${
                showOnlyIndividual
                  ? 'bg-cta-primary text-white border-cta-primary hover:bg-cta-primary-dark'
                  : 'bg-surface-select text-cta-primary-dark border-cta-primary hover:bg-stroke-card'
              }`}
            >
              個体管理品目のみ表示
            </button>
            <div
              className={`px-3.5 py-1.5 border rounded text-xs font-bold ${
                confirmedCount === individualItems.length
                  ? 'bg-surface-select border-cta-primary text-cta-primary-dark'
                  : 'bg-surface-select border-content-alert text-content-alert'
              }`}
            >
              紐付け済み: <span className="tabular-nums">{confirmedCount}/{individualItems.length}</span>件
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px] min-w-[1400px]">
              <thead className="sticky top-0 z-[2]">
                <tr>
                  <th colSpan={5} className="px-1.5 py-1.5 text-center border-b-2 border-content-primary font-bold bg-stroke-card text-[11px] text-content-primary">
                    商品情報（原本情報）
                  </th>
                  <th colSpan={2} className="px-1.5 py-1.5 text-center border-b-2 border-content-primary border-r border-stroke-input font-bold bg-stroke-card text-[11px] text-content-primary">
                    STEP❸
                  </th>
                  <th colSpan={7} className="px-1.5 py-1.5 text-center border-b-2 border-content-primary font-bold text-cta-primary-dark bg-surface-select text-[11px]">
                    STEP❹ 資産マスタ登録
                  </th>
                </tr>
                <tr className="bg-surface-screen">
                  <th className="px-1.5 py-1 text-center border-b border-stroke-input w-[30px] font-normal text-content-primary">No</th>
                  <th className="px-1.5 py-1 text-left border-b border-stroke-input min-w-[140px] font-normal text-content-primary">品名（見積名称）</th>
                  <th className="px-1.5 py-1 text-left border-b border-stroke-input w-20 font-normal text-content-primary">メーカー</th>
                  <th className="px-1.5 py-1 text-left border-b border-stroke-input w-[100px] font-normal text-content-primary">型式（見積名称）</th>
                  <th className="px-1.5 py-1 text-center border-b border-stroke-input w-10 font-normal text-content-primary">数量</th>
                  <th className="px-1.5 py-1 text-center border-b border-stroke-input w-[60px] font-normal text-content-primary">明細区分</th>
                  <th className="px-1.5 py-1 text-left border-b border-stroke-input border-r border-stroke-input w-[90px] font-normal text-content-primary">カテゴリ</th>
                  <th className="px-1.5 py-1 text-left border-b border-stroke-input w-[130px] bg-surface-select font-normal text-cta-primary-dark">大分類</th>
                  <th className="px-1.5 py-1 text-left border-b border-stroke-input w-[90px] bg-surface-select font-normal text-cta-primary-dark">中分類</th>
                  <th className="px-1.5 py-1 text-left border-b border-stroke-input min-w-[140px] bg-surface-select font-normal text-cta-primary-dark">個体管理品目</th>
                  <th className="px-1.5 py-1 text-left border-b border-stroke-input w-20 bg-surface-select font-normal text-cta-primary-dark">メーカー</th>
                  <th className="px-1.5 py-1 text-left border-b border-stroke-input w-[100px] bg-surface-select font-normal text-cta-primary-dark">型式</th>
                  <th className="px-1.5 py-1 text-center border-b border-stroke-input w-[180px] bg-surface-select font-normal text-cta-primary-dark">操作</th>
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
                  const classBgCls = item.detailClassification === '親明細' ? 'bg-content-alert'
                    : item.detailClassification === '子明細' ? 'bg-content-link'
                    : item.detailClassification === '孫明細' ? 'bg-content-primary'
                    : 'bg-content-sub';
                  const rowBgCls = isSelectingThisRow ? 'bg-surface-select' : rowIsConfirmed ? 'bg-surface-select' : 'bg-surface-card';
                  const cellIndividualBgCls = isIndividual ? 'bg-surface-select' : '';

                  return (
                    <tr key={item.id} className={`border-b border-stroke-input ${rowBgCls}`}>
                      <td className="px-1.5 py-1 text-center tabular-nums text-content-primary">{item.rowNo}</td>
                      <td className="px-1.5 py-1 text-content-primary" title={item.itemName}>{item.itemName}</td>
                      <td className="px-1.5 py-1 text-content-primary">{item.manufacturer || ''}</td>
                      <td className="px-1.5 py-1 text-content-primary">{item.model || ''}</td>
                      <td className="px-1.5 py-1 text-center tabular-nums text-content-primary">{item.quantity ?? '-'}</td>
                      <td className="px-1.5 py-1 text-center">
                        {item.detailClassification && (
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${classBgCls}`}>
                            {item.detailClassification.replace('明細', '')}
                          </span>
                        )}
                      </td>
                      <td className="px-1.5 py-1 text-[10px] border-r border-stroke-input text-content-primary">
                        {item.category || ''}
                      </td>
                      <td className={`px-1.5 py-1 text-[10px] text-content-primary ${cellIndividualBgCls}`}>
                        {displayData?.majorCategory || ''}
                      </td>
                      <td className={`px-1.5 py-1 text-[10px] text-content-primary ${cellIndividualBgCls}`}>
                        {displayData?.middleCategory || ''}
                      </td>
                      <td className={`px-1.5 py-1 text-content-primary ${cellIndividualBgCls} ${isIndividual ? 'font-bold' : ''}`}>
                        {displayData?.assetName || item.itemName || ''}
                      </td>
                      <td className={`px-1.5 py-1 text-[10px] text-content-primary ${cellIndividualBgCls}`}>
                        {displayData?.manufacturer || ''}
                      </td>
                      <td className={`px-1.5 py-1 text-[10px] text-content-primary ${cellIndividualBgCls}`}>
                        {displayData?.model || ''}
                      </td>
                      <td className="px-1.5 py-1 text-center">
                        {isIndividual ? (
                          rowIsConfirmed ? (
                            <div className="flex gap-1 justify-center items-center flex-wrap">
                              <span className="px-1.5 py-0.5 bg-cta-primary text-white rounded text-[9px] font-bold">
                                AI適用
                              </span>
                              <span className="px-1.5 py-0.5 bg-cta-primary-dark text-white rounded text-[9px] font-bold">
                                資産マスタ
                              </span>
                              <span className="px-1.5 py-0.5 bg-content-link text-white rounded text-[9px] font-bold">
                                紐付済
                              </span>
                              <button
                                onClick={() => handleUnconfirm(item.id)}
                                className="px-1.5 py-0.5 bg-content-alert text-white border-0 rounded text-[9px] font-bold cursor-pointer hover:opacity-90 transition-colors"
                              >
                                解除
                              </button>
                            </div>
                          ) : isSelectingThisRow ? (
                            <span className="inline-block px-2 py-1 bg-cta-primary text-white rounded text-[9px] font-bold">
                              選択中...
                            </span>
                          ) : (
                            <div className="flex gap-1 justify-center flex-wrap">
                              {aiJudgment && (
                                <button onClick={() => handleApplyAI(item.id, aiJudgment)} className="px-1.5 py-0.5 bg-cta-primary text-white border-0 rounded text-[9px] font-bold cursor-pointer hover:bg-cta-primary-dark transition-colors">
                                  AI適用
                                </button>
                              )}
                              <button onClick={() => handleOpenAssetMaster(item.id)} className="px-1.5 py-0.5 bg-cta-primary-dark text-white border-0 rounded text-[9px] font-bold cursor-pointer whitespace-nowrap hover:opacity-90 transition-colors">
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
        </section>

        <div className="flex gap-3 justify-between mt-4">
          <button
            onClick={handleBack}
            className="h-12 px-7 bg-surface-negative text-content-primary border-0 rounded cursor-pointer text-sm font-bold hover:bg-stroke-input transition-colors"
          >
            一つ前のSTEPに戻る
          </button>
          <button
            onClick={handleNext}
            className="h-12 px-7 bg-cta-primary text-white border-0 rounded cursor-pointer text-sm font-bold hover:bg-cta-primary-dark transition-colors"
          >
            個体登録/価格按分へ
          </button>
        </div>
      </div>
    </div>
  );
}
