'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { StepProgressBar } from '../components/StepProgressBar';

// 明細区分の型（STEP3/4と統一）
type DetailClassification =
  | '明細代表'
  | '内訳代表'
  | '親明細'
  | '子明細'
  | '孫明細'
  | 'その他'
  | '値引き'
  | '';

// 単位の選択肢（台をデフォルト）
const UNIT_OPTIONS = ['台', '個', '本', '枚', '組', 'セット', '式'];

// ---------------------------------------------------------------------------
// 元明細データの型（STEP2 原本 + STEP3 分類 + STEP4 確定情報）
// ---------------------------------------------------------------------------
interface OriginalItem {
  id: number;
  rowNo: number;
  itemName: string;
  manufacturer: string;
  model: string;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
  category: string;
  detailClassification: DetailClassification;
  // STEP4 確定情報（親明細/子明細のみ）
  confirmedAssetName?: string;
  confirmedManufacturer?: string;
  confirmedModel?: string;
  confirmedMajorCategory?: string;
  confirmedMiddleCategory?: string;
}

// ---------------------------------------------------------------------------
// 個体登録データの型
// ---------------------------------------------------------------------------
interface IndividualRecord {
  id: string;
  originalItemId: number;
  seqId: string;
  assetName: string;
  unit: string;
  listUnitPrice: number | null;
  allocatedUnitPrice: number | null;
  allocatedAmount: number | null;
  groupNo: string;
  category: string;
  detailClassification: DetailClassification;
  // STEP4 資産マスタ確定情報
  majorCategory: string;
  middleCategory: string;
  assetManufacturer: string;
  assetModel: string;
}

// ---------------------------------------------------------------------------
// テスト用元明細データ（全12件 — STEP2→3→4 通過済み）
// ---------------------------------------------------------------------------
const testOriginalItems: OriginalItem[] = [
  {
    id: 1, rowNo: 1,
    itemName: '具象眼科用ユニット', manufacturer: '第一医科', model: 'さららEFUS01',
    quantity: 4, unitPrice: 3300000, totalPrice: 13200000,
    category: '01', detailClassification: '明細代表',
  },
  {
    id: 2, rowNo: 2,
    itemName: '仕様', manufacturer: '第一医科', model: '',
    quantity: null, unitPrice: null, totalPrice: null,
    category: '01', detailClassification: 'その他',
  },
  {
    id: 3, rowNo: 3,
    itemName: '具象眼科用ユニット', manufacturer: '第一医科', model: 'さらら',
    quantity: 4, unitPrice: null, totalPrice: null,
    category: '01', detailClassification: '親明細',
    confirmedAssetName: '眼科用ユニット さらら',
    confirmedManufacturer: '第一医科株式会社',
    confirmedModel: 'EFUS01',
    confirmedMajorCategory: '医療用機器備品',
    confirmedMiddleCategory: '眼科用機器',
  },
  {
    id: 4, rowNo: 4,
    itemName: 'ホース付きスプレー2本', manufacturer: '第一', model: '',
    quantity: null, unitPrice: null, totalPrice: null,
    category: '01', detailClassification: '子明細',
  },
  {
    id: 5, rowNo: 5,
    itemName: '吸引清掃式　ロック枠掛付', manufacturer: '第一医科', model: '',
    quantity: null, unitPrice: null, totalPrice: null,
    category: '01', detailClassification: '子明細',
  },
  {
    id: 6, rowNo: 6,
    itemName: '通気清掃式　ロック枠掛付', manufacturer: '第一医科', model: '',
    quantity: null, unitPrice: null, totalPrice: null,
    category: '01', detailClassification: '子明細',
  },
  {
    id: 7, rowNo: 7,
    itemName: 'ツインボール', manufacturer: '第一医科', model: '',
    quantity: null, unitPrice: null, totalPrice: null,
    category: '01', detailClassification: '親明細',
    confirmedAssetName: 'ツインボール（眼科用）',
    confirmedManufacturer: '第一医科株式会社',
    confirmedModel: 'TB-100',
    confirmedMajorCategory: '医療用機器備品',
    confirmedMiddleCategory: '眼科用機器',
  },
  {
    id: 8, rowNo: 8,
    itemName: '照明灯あり', manufacturer: '第一医科', model: '',
    quantity: null, unitPrice: null, totalPrice: null,
    category: '01', detailClassification: '子明細',
  },
  {
    id: 9, rowNo: 9,
    itemName: '吸引便ディスポ', manufacturer: '第一医科', model: '',
    quantity: null, unitPrice: null, totalPrice: null,
    category: '01', detailClassification: '子明細',
  },
  {
    id: 10, rowNo: 10,
    itemName: 'キャスターあり', manufacturer: '第一医科', model: '',
    quantity: null, unitPrice: null, totalPrice: null,
    category: '01', detailClassification: '子明細',
  },
  {
    id: 11, rowNo: 11,
    itemName: '天板フラット', manufacturer: '第一医科', model: '',
    quantity: null, unitPrice: null, totalPrice: null,
    category: '01', detailClassification: '子明細',
  },
  {
    id: 12, rowNo: 12,
    itemName: 'さらら用ツインボール用棚　壁付タイプ', manufacturer: '第一医科', model: '',
    quantity: 4, unitPrice: 162000, totalPrice: 648000,
    category: '01', detailClassification: '親明細',
    confirmedAssetName: 'ツインボール用棚 壁付',
    confirmedManufacturer: '第一医科株式会社',
    confirmedModel: 'TBS-W01',
    confirmedMajorCategory: '医療用機器備品',
    confirmedMiddleCategory: '眼科用機器',
  },
];

// ---------------------------------------------------------------------------
// 表示フィルタ
// ---------------------------------------------------------------------------
const isDisplayTarget = (item: OriginalItem): boolean => {
  if (item.category === '01') {
    return item.detailClassification === '親明細' || item.detailClassification === '子明細';
  }
  return true;
};

// ---------------------------------------------------------------------------
// 全レコード生成（STEP6 に渡すため全件。表示は別途フィルタ）
// ---------------------------------------------------------------------------
const generateInitialRecords = (): IndividualRecord[] => {
  const records: IndividualRecord[] = [];
  let seqCounter = 1;
  let groupCounter = 0;
  let currentGroupNo = '';

  testOriginalItems.forEach((item) => {
    const recordCount = item.quantity ?? 1;

    if (item.detailClassification === '親明細') {
      groupCounter++;
      currentGroupNo = String(groupCounter);
    }

    for (let i = 1; i <= recordCount; i++) {
      let seqId = '';
      if (item.detailClassification === '親明細') {
        seqId = String(seqCounter);
        seqCounter++;
      }

      const isParentOrChild =
        item.detailClassification === '親明細' || item.detailClassification === '子明細';

      records.push({
        id: `item-${item.id}-${i}`,
        originalItemId: item.id,
        seqId,
        assetName: item.confirmedAssetName || item.itemName,
        unit: '台',
        listUnitPrice: item.unitPrice,
        allocatedUnitPrice: null,
        allocatedAmount: null,
        groupNo: isParentOrChild ? currentGroupNo : '',
        category: item.category,
        detailClassification: item.detailClassification,
        majorCategory: item.confirmedMajorCategory || '',
        middleCategory: item.confirmedMiddleCategory || '',
        assetManufacturer: item.confirmedManufacturer || item.manufacturer,
        assetModel: item.confirmedModel || item.model,
      });
    }
  });

  return records;
};

// ---------------------------------------------------------------------------
// メインコンポーネント
// ---------------------------------------------------------------------------
export default function PriceAllocationPage() {
  const router = useRouter();

  const [individualRecords, setIndividualRecords] = useState<IndividualRecord[]>(
    generateInitialRecords(),
  );

  // テーブルに表示するレコード
  const displayRecords = useMemo(() => {
    return individualRecords.filter((r) => {
      const orig = testOriginalItems.find((o) => o.id === r.originalItemId);
      return orig ? isDisplayTarget(orig) : false;
    });
  }, [individualRecords]);

  const displayOriginalItems = useMemo(
    () => testOriginalItems.filter(isDisplayTarget),
    [],
  );

  const quotationTotal = useMemo(
    () => testOriginalItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0),
    [],
  );

  const allocatedTotal = useMemo(
    () => individualRecords.reduce((sum, r) => sum + (r.allocatedAmount || 0), 0),
    [individualRecords],
  );

  const remainingAmount = quotationTotal - allocatedTotal;

  // -----------------------------------------------------------------------
  // ハンドラー
  // -----------------------------------------------------------------------
  const handleUnitChange = useCallback((recordId: string, value: string) => {
    setIndividualRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, unit: value } : r)),
    );
  }, []);

  const handleAllocatedAmountChange = useCallback((recordId: string, value: number | null) => {
    setIndividualRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, allocatedAmount: value } : r)),
    );
  }, []);

  const handleGroupNoChange = useCallback((recordId: string, groupNo: string) => {
    setIndividualRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, groupNo } : r)),
    );
  }, []);

  // 按分実行: 元明細ごとに totalPrice をレコード数で均等割
  const handleAllocate = useCallback(() => {
    setIndividualRecords((prev) => {
      const countByOriginal = new Map<number, number>();
      prev.forEach((r) => {
        countByOriginal.set(r.originalItemId, (countByOriginal.get(r.originalItemId) || 0) + 1);
      });

      return prev.map((record) => {
        const orig = testOriginalItems.find((o) => o.id === record.originalItemId);
        if (!orig?.totalPrice) return record;

        const count = countByOriginal.get(record.originalItemId) || 1;
        const perRecord = Math.floor(orig.totalPrice / count);
        return { ...record, allocatedAmount: perRecord, allocatedUnitPrice: perRecord };
      });
    });
  }, []);

  const handleAddRecord = useCallback(
    (originalItemId: number) => {
      const originalItem = testOriginalItems.find((item) => item.id === originalItemId);
      if (!originalItem) return;
      const newId = `new-${Date.now()}`;

      let newSeqId = '';
      if (originalItem.detailClassification === '親明細') {
        const maxSeq = individualRecords
          .filter((r) => r.detailClassification === '親明細' && r.seqId !== '')
          .map((r) => parseInt(r.seqId, 10))
          .filter((n) => !isNaN(n))
          .reduce((max, n) => Math.max(max, n), 0);
        newSeqId = String(maxSeq + 1);
      }

      const sameOriginal = individualRecords.find((r) => r.originalItemId === originalItemId);
      const newGroupNo = sameOriginal?.groupNo || '';

      setIndividualRecords((prev) => [
        ...prev,
        {
          id: newId,
          originalItemId,
          seqId: newSeqId,
          assetName: originalItem.confirmedAssetName || originalItem.itemName,
          unit: '台',
          listUnitPrice: originalItem.unitPrice,
          allocatedUnitPrice: null,
          allocatedAmount: null,
          groupNo: newGroupNo,
          category: originalItem.category,
          detailClassification: originalItem.detailClassification,
          majorCategory: originalItem.confirmedMajorCategory || '',
          middleCategory: originalItem.confirmedMiddleCategory || '',
          assetManufacturer: originalItem.confirmedManufacturer || originalItem.manufacturer,
          assetModel: originalItem.confirmedModel || originalItem.model,
        },
      ]);
    },
    [individualRecords],
  );

  const handleDeleteRecord = useCallback((recordId: string) => {
    setIndividualRecords((prev) => prev.filter((r) => r.id !== recordId));
  }, []);

  const handleBack = () => router.push('/quotation-data-box/item-ai-matching');
  const handleRegister = () => router.push('/quotation-data-box/registration-confirm');

  // -----------------------------------------------------------------------
  // JSX
  // -----------------------------------------------------------------------
  const rightCellBg = '#fef5f7';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f5f5f5' }}>
      <Header
        title="見積登録（購入）個体登録及び金額按分"
        stepBadge="STEP 5"
        hideMenu={true}
        showBackButton={false}
      />
      <StepProgressBar currentStep={5} />

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* メインコンテンツ */}
        <div
          style={{
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '16px',
          }}
        >
          {/* セクションヘッダー */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: '#4a6fa5',
              color: 'white',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>個体登録及び金額按分</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px' }}>
                見積合計（税抜）:
                <span style={{ fontWeight: 'bold', fontSize: '14px', marginLeft: '4px' }}>
                  ¥{quotationTotal.toLocaleString()}
                </span>
              </span>
              <span style={{ fontSize: '11px' }}>
                按分済:
                <span style={{ fontWeight: 'bold', fontSize: '14px', marginLeft: '4px' }}>
                  ¥{allocatedTotal.toLocaleString()}
                </span>
              </span>
              <span style={{ fontSize: '11px' }}>
                残額:
                <span
                  style={{
                    fontWeight: 'bold',
                    fontSize: '14px',
                    marginLeft: '4px',
                    color: remainingAmount !== 0 ? '#ffeb3b' : '#a5d6a7',
                  }}
                >
                  ¥{remainingAmount.toLocaleString()}
                </span>
              </span>
              <button
                onClick={handleAllocate}
                style={{
                  padding: '6px 16px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                按分実行
              </button>
            </div>
          </div>

          {/* 明細テーブル */}
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '10px',
                minWidth: '1200px',
              }}
            >
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr>
                  <th
                    colSpan={7}
                    style={{
                      padding: '6px',
                      textAlign: 'center',
                      borderBottom: '2px solid #3498db',
                      fontWeight: 'bold',
                      color: '#3498db',
                      background: '#e8f4fc',
                      fontSize: '11px',
                    }}
                  >
                    元明細（原本情報）
                  </th>
                  <th style={{ padding: '6px', background: '#f8f9fa', width: '25px' }} />
                  <th
                    colSpan={7}
                    style={{
                      padding: '6px',
                      textAlign: 'center',
                      borderBottom: '2px solid #e91e63',
                      fontWeight: 'bold',
                      color: '#e91e63',
                      background: '#fce4ec',
                      fontSize: '11px',
                    }}
                  >
                    個体登録及び金額按分
                  </th>
                  <th style={{ padding: '6px', background: '#f8f9fa', width: '50px', fontSize: '11px' }}>
                    操作
                  </th>
                </tr>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '5px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '30px', fontSize: '9px' }}>No</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '9px' }}>品名</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '70px', fontSize: '9px' }}>メーカー</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '70px', fontSize: '9px' }}>型式</th>
                  <th style={{ padding: '5px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '35px', fontSize: '9px' }}>数量</th>
                  <th style={{ padding: '5px', textAlign: 'right', borderBottom: '1px solid #dee2e6', width: '80px', fontSize: '9px' }}>単価</th>
                  <th style={{ padding: '5px', textAlign: 'right', borderBottom: '1px solid #dee2e6', width: '80px', fontSize: '9px' }}>金額</th>
                  <th style={{ padding: '5px', background: '#fafafa' }} />
                  <th style={{ padding: '5px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '50px', fontSize: '9px', background: rightCellBg }}>SEQ_ID</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '9px', background: rightCellBg }}>個体品目</th>
                  <th style={{ padding: '5px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '55px', fontSize: '9px', background: rightCellBg }}>単位</th>
                  <th style={{ padding: '5px', textAlign: 'right', borderBottom: '1px solid #dee2e6', width: '80px', fontSize: '9px', background: rightCellBg }}>定価単価</th>
                  <th style={{ padding: '5px', textAlign: 'right', borderBottom: '1px solid #dee2e6', width: '80px', fontSize: '9px', background: rightCellBg }}>按分単価</th>
                  <th style={{ padding: '5px', textAlign: 'right', borderBottom: '1px solid #dee2e6', width: '80px', fontSize: '9px', background: rightCellBg }}>按分金額</th>
                  <th style={{ padding: '5px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '60px', fontSize: '9px', background: rightCellBg }}>親子No.</th>
                  <th style={{ padding: '5px', borderBottom: '1px solid #dee2e6' }} />
                </tr>
              </thead>
              <tbody>
                {displayRecords.map((record) => {
                  const originalItem = displayOriginalItems.find(
                    (item) => item.id === record.originalItemId,
                  );
                  const isFirstOfOriginal =
                    displayRecords.findIndex((r) => r.originalItemId === record.originalItemId) ===
                    displayRecords.indexOf(record);
                  const recordsOfSameOriginal = displayRecords.filter(
                    (r) => r.originalItemId === record.originalItemId,
                  );

                  const leftCellBase: React.CSSProperties = {
                    padding: '5px',
                    borderRight: '1px solid #ddd',
                    verticalAlign: 'top',
                  };

                  return (
                    <tr
                      key={record.id}
                      style={{ borderBottom: '1px solid #eee', background: 'white' }}
                    >
                      {isFirstOfOriginal ? (
                        <>
                          <td rowSpan={recordsOfSameOriginal.length} style={{ ...leftCellBase, textAlign: 'center' }}>
                            {originalItem?.rowNo || '-'}
                          </td>
                          <td rowSpan={recordsOfSameOriginal.length} style={{ ...leftCellBase, fontWeight: 'bold' }}>
                            {originalItem?.itemName || '-'}
                          </td>
                          <td rowSpan={recordsOfSameOriginal.length} style={{ ...leftCellBase, color: '#555' }}>
                            {originalItem?.manufacturer || '-'}
                          </td>
                          <td rowSpan={recordsOfSameOriginal.length} style={{ ...leftCellBase, color: '#555' }}>
                            {originalItem?.model || '-'}
                          </td>
                          <td rowSpan={recordsOfSameOriginal.length} style={{ ...leftCellBase, textAlign: 'center' }}>
                            {originalItem?.quantity ?? '-'}
                          </td>
                          <td rowSpan={recordsOfSameOriginal.length} style={{ ...leftCellBase, textAlign: 'right' }}>
                            {originalItem?.unitPrice?.toLocaleString() || '-'}
                          </td>
                          <td rowSpan={recordsOfSameOriginal.length} style={{ ...leftCellBase, textAlign: 'right', fontWeight: 'bold' }}>
                            {originalItem?.totalPrice?.toLocaleString() || '-'}
                          </td>
                        </>
                      ) : null}

                      <td style={{ padding: '5px', textAlign: 'center', background: '#fafafa' }}>⇒</td>

                      <td style={{ padding: '5px', textAlign: 'center', background: rightCellBg }}>
                        <input
                          type="text"
                          value={record.seqId}
                          onChange={(e) => {
                            const v = e.target.value;
                            setIndividualRecords((prev) =>
                              prev.map((r) => (r.id === record.id ? { ...r, seqId: v } : r)),
                            );
                          }}
                          style={{ width: '40px', padding: '2px 4px', fontSize: '9px', border: '1px solid #ddd', borderRadius: '2px', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '5px', background: rightCellBg, fontWeight: 'bold' }}>
                        {record.assetName}
                      </td>
                      <td style={{ padding: '5px', textAlign: 'center', background: rightCellBg }}>
                        <select
                          value={record.unit}
                          onChange={(e) => handleUnitChange(record.id, e.target.value)}
                          style={{ padding: '2px 4px', fontSize: '9px', border: '1px solid #ddd', borderRadius: '2px' }}
                        >
                          <option value="">-</option>
                          {UNIT_OPTIONS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '5px', textAlign: 'right', background: rightCellBg }}>
                        {record.listUnitPrice?.toLocaleString() || '-'}
                      </td>
                      <td style={{ padding: '5px', textAlign: 'right', background: rightCellBg }}>
                        <input
                          type="text"
                          value={record.allocatedUnitPrice?.toLocaleString() || ''}
                          onChange={(e) => {
                            const v = e.target.value === '' ? null : parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
                            setIndividualRecords((prev) =>
                              prev.map((r) => (r.id === record.id ? { ...r, allocatedUnitPrice: v } : r)),
                            );
                          }}
                          style={{ width: '70px', padding: '2px 4px', fontSize: '9px', border: '1px solid #ddd', borderRadius: '2px', textAlign: 'right' }}
                        />
                      </td>
                      <td style={{ padding: '5px', textAlign: 'right', background: rightCellBg }}>
                        <input
                          type="text"
                          value={record.allocatedAmount?.toLocaleString() || ''}
                          onChange={(e) => {
                            const v = e.target.value === '' ? null : parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
                            handleAllocatedAmountChange(record.id, v);
                          }}
                          style={{ width: '70px', padding: '2px 4px', fontSize: '9px', border: '1px solid #ddd', borderRadius: '2px', textAlign: 'right', fontWeight: 'bold' }}
                        />
                      </td>
                      <td style={{ padding: '5px', textAlign: 'center', background: rightCellBg }}>
                        <input
                          type="text"
                          value={record.groupNo}
                          onChange={(e) => handleGroupNoChange(record.id, e.target.value)}
                          style={{ width: '40px', padding: '2px 4px', fontSize: '9px', border: '1px solid #ddd', borderRadius: '2px', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '5px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          style={{
                            padding: '2px 6px',
                            background: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontSize: '8px',
                          }}
                        >
                          削除
                        </button>
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
              fontWeight: 'bold',
            }}
          >
            一つ前のSTEPに戻る
          </button>
          <button
            onClick={handleRegister}
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
            登録確認
          </button>
        </div>
      </div>
    </div>
  );
}
