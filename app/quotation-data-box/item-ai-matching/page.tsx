'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { StepProgressBar } from '../components/StepProgressBar';

// 登録区分の型
type RegistrationCategory =
  | 'A' // 表紙明細
  | 'B' // 明細代表
  | 'C' // 個体管理品目
  | 'D' // 付属品
  | 'E' // その他役務など
  | 'F' // 値引き
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
  registrationCategory: RegistrationCategory; // 登録区分（STEP2から引継ぎ）
  aiJudgment: AIJudgmentResult | null; // AI判定結果
}

// テスト用明細データ（STEP2から引き継いだデータ + AI判定結果）
const testDetailItems: DetailItem[] = [
  {
    id: 1,
    rowNo: 1,
    itemName: '具象眼科用ユニット',
    manufacturer: '第一医科',
    model: 'さららEFUS01',
    quantity: 4,
    registrationCategory: 'B',
    aiJudgment: {
      category: '有形資産',
      majorCategory: '医療用機器備品',
      middleCategory: '眼科用機器',
      assetName: '眼科用ユニット さらら',
      manufacturer: '第一医科株式会社',
      model: 'EFUS01',
    },
  },
  {
    id: 2,
    rowNo: 2,
    itemName: '仕様',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    registrationCategory: 'E',
    aiJudgment: null,
  },
  {
    id: 3,
    rowNo: 3,
    itemName: '具象眼科用ユニット',
    manufacturer: '第一医科',
    model: 'さらら',
    quantity: 4,
    registrationCategory: 'C',
    aiJudgment: {
      category: '有形資産',
      majorCategory: '医療用機器備品',
      middleCategory: '眼科用機器',
      assetName: '眼科用ユニット さらら',
      manufacturer: '第一医科株式会社',
      model: 'さらら',
    },
  },
  {
    id: 4,
    rowNo: 4,
    itemName: 'ホース付きスプレー2本',
    manufacturer: '第一',
    model: '',
    quantity: null,
    registrationCategory: 'D',
    aiJudgment: null,
  },
  {
    id: 5,
    rowNo: 5,
    itemName: '吸引清掃式　ロック枠掛付',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    registrationCategory: 'D',
    aiJudgment: null,
  },
  {
    id: 6,
    rowNo: 6,
    itemName: '通気清掃式　ロック枠掛付',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    registrationCategory: 'D',
    aiJudgment: null,
  },
  {
    id: 7,
    rowNo: 7,
    itemName: 'ツインボール',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    registrationCategory: 'C',
    aiJudgment: {
      category: '有形資産',
      majorCategory: '医療用機器備品',
      middleCategory: '眼科用機器',
      assetName: 'ツインボール（眼科用）',
      manufacturer: '第一医科株式会社',
      model: 'TB-100',
    },
  },
  {
    id: 8,
    rowNo: 8,
    itemName: '照明灯あり',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    registrationCategory: 'D',
    aiJudgment: null,
  },
  {
    id: 9,
    rowNo: 9,
    itemName: '吸引便ディスポ',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    registrationCategory: 'D',
    aiJudgment: null,
  },
  {
    id: 10,
    rowNo: 10,
    itemName: 'キャスターあり',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    registrationCategory: 'D',
    aiJudgment: null,
  },
  {
    id: 11,
    rowNo: 11,
    itemName: '天板フラット',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    registrationCategory: 'D',
    aiJudgment: null,
  },
  {
    id: 12,
    rowNo: 12,
    itemName: 'さらら用ツインボール用棚　壁付タイプ',
    manufacturer: '第一医科',
    model: '',
    quantity: 4,
    registrationCategory: 'C',
    aiJudgment: {
      category: '有形資産',
      majorCategory: '医療用機器備品',
      middleCategory: '眼科用機器',
      assetName: 'ツインボール用棚 壁付',
      manufacturer: '第一医科株式会社',
      model: 'TBS-W01',
    },
  },
];

export default function ItemAiMatchingPage() {
  const router = useRouter();

  // 明細データ
  const [detailItems] = useState<DetailItem[]>(testDetailItems);

  // 確定状態の管理
  const [confirmedState, setConfirmedState] = useState<Record<string, ConfirmedState>>({});

  // 選択中の行（資産マスタ選択待ち）
  const [selectingRow, setSelectingRow] = useState<number | null>(null);

  // C_個体管理品目のみをフィルタ
  const individualItems = useMemo(() => {
    return detailItems.filter(item => item.registrationCategory === 'C');
  }, [detailItems]);

  // 確定状態を取得
  const getConfirmedInfo = (id: number): ConfirmedState | null => {
    const key = `${id}`;
    return confirmedState[key] || null;
  };

  // 確定済み件数
  const confirmedCount = useMemo(() => {
    return individualItems.filter(item => getConfirmedInfo(item.id) !== null).length;
  }, [individualItems, confirmedState]);

  // 別ウィンドウからの資産マスタ選択を受信
  const handleAssetMasterMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;

    if (event.data?.type === 'ASSET_MASTER_SELECTED' && selectingRow !== null) {
      const assetData: ConfirmedAssetInfo = event.data.data;
      const key = `${selectingRow}`;
      setConfirmedState(prev => ({
        ...prev,
        [key]: {
          status: 'asset_master_selected',
          assetInfo: assetData,
        },
      }));
      setSelectingRow(null);
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

  // 資産マスタを別ウィンドウで開いて選択させる
  const handleOpenAssetMasterForSelection = (id: number) => {
    setSelectingRow(id);
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    window.open(`${basePath}/ship-asset-master?mode=select`, '_blank', 'width=1200,height=800');
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
            background: '#4a6fa5',
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
              ・不適格な場合は資産Masterから選択が可能です<br />
              ・IDの登録により耐用年数、推奨使用年数、添付文書などの情報が登録できます
            </div>
          </div>

          {/* 進捗状況 */}
          <div style={{ padding: '12px 16px', display: 'flex', gap: '16px', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
            <div style={{
              padding: '6px 14px',
              background: '#e8f5e9',
              border: '1px solid #a5d6a7',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#2e7d32',
            }}>
              個体管理品目: {individualItems.length}件
            </div>
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
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', minWidth: '1100px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                {/* 2段ヘッダー */}
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
                    元明細（原本情報）
                  </th>
                  <th style={{ padding: '6px', background: '#f8f9fa', width: '25px' }}>⇒</th>
                  <th colSpan={6} style={{
                    padding: '6px',
                    textAlign: 'center',
                    borderBottom: '2px solid #9c27b0',
                    fontWeight: 'bold',
                    color: '#9c27b0',
                    background: '#f3e5f5',
                    fontSize: '11px'
                  }}>
                    個体品目のAI判定
                  </th>
                  <th style={{ padding: '6px', background: '#f8f9fa', width: '150px', fontSize: '11px' }}>操作</th>
                </tr>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '5px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '30px', fontSize: '9px' }}>No</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '9px' }}>品名</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '80px', fontSize: '9px' }}>メーカー</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '80px', fontSize: '9px' }}>型式</th>
                  <th style={{ padding: '5px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '40px', fontSize: '9px' }}>数量</th>
                  <th style={{ padding: '5px', background: '#fafafa' }}></th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '70px', fontSize: '9px', background: '#faf5fc' }}>category</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '90px', fontSize: '9px', background: '#faf5fc' }}>大分類</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '80px', fontSize: '9px', background: '#faf5fc' }}>中分類</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '9px', background: '#faf5fc' }}>個体管理品目</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '70px', fontSize: '9px', background: '#faf5fc' }}>メーカー</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '70px', fontSize: '9px', background: '#faf5fc' }}>型式</th>
                  <th style={{ padding: '5px', borderBottom: '1px solid #dee2e6' }}></th>
                </tr>
              </thead>
              <tbody>
                {individualItems.map((item) => {
                  const confirmedInfo = getConfirmedInfo(item.id);
                  const rowIsConfirmed = confirmedInfo !== null;
                  const isSelectingThisRow = selectingRow === item.id;
                  const aiJudgment = item.aiJudgment;
                  const displayData = confirmedInfo?.assetInfo || aiJudgment;

                  return (
                    <tr key={item.id} style={{
                      borderBottom: '1px solid #ddd',
                      background: isSelectingThisRow ? '#fff3e0' : rowIsConfirmed ? '#e8f5e9' : 'transparent',
                    }}>
                      <td style={{ padding: '5px', textAlign: 'center' }}>{item.rowNo}</td>
                      <td style={{ padding: '5px', fontWeight: 'bold' }} title={item.itemName}>{item.itemName}</td>
                      <td style={{ padding: '5px', color: '#555' }}>{item.manufacturer || '-'}</td>
                      <td style={{ padding: '5px', color: '#555' }}>{item.model || '-'}</td>
                      <td style={{ padding: '5px', textAlign: 'center' }}>{item.quantity ?? '-'}</td>
                      <td style={{ padding: '5px', textAlign: 'center', background: '#fafafa' }}>⇒</td>
                      <td style={{ padding: '5px', background: rowIsConfirmed ? '#c8e6c9' : '#fdfaff', fontSize: '9px' }}>
                        {displayData && 'category' in displayData ? displayData.category : '-'}
                      </td>
                      <td style={{ padding: '5px', background: rowIsConfirmed ? '#c8e6c9' : '#fdfaff', fontSize: '9px' }}>
                        {displayData && 'majorCategory' in displayData ? displayData.majorCategory : '-'}
                      </td>
                      <td style={{ padding: '5px', background: rowIsConfirmed ? '#c8e6c9' : '#fdfaff', fontSize: '9px' }}>
                        {displayData && 'middleCategory' in displayData ? displayData.middleCategory : '-'}
                      </td>
                      <td style={{ padding: '5px', background: rowIsConfirmed ? '#c8e6c9' : '#fdfaff', fontWeight: 'bold' }}>
                        {displayData?.assetName || '-'}
                      </td>
                      <td style={{ padding: '5px', background: rowIsConfirmed ? '#c8e6c9' : '#fdfaff', color: '#555', fontSize: '9px' }}>
                        {displayData?.manufacturer || '-'}
                      </td>
                      <td style={{ padding: '5px', background: rowIsConfirmed ? '#c8e6c9' : '#fdfaff', color: '#555', fontSize: '9px' }}>
                        {displayData?.model || '-'}
                      </td>
                      <td style={{ padding: '5px', textAlign: 'center' }}>
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
                              onClick={() => handleUnconfirm(item.id)}
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
                          <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
                            {aiJudgment && (
                              <button
                                onClick={() => handleApplyAI(item.id, aiJudgment)}
                                style={{
                                  padding: '3px 5px',
                                  background: '#ff9800',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '8px',
                                  fontWeight: 'bold',
                                }}
                              >
                                AI適用
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenAssetMasterForSelection(item.id)}
                              style={{
                                padding: '3px 5px',
                                background: '#1976d2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '8px',
                                fontWeight: 'bold',
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

          {individualItems.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', background: '#f5f5f5', color: '#666' }}>
              個体管理品目がありません。次のステップへ進んでください。
            </div>
          )}

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
