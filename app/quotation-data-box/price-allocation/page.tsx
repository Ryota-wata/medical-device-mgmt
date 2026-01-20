'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { StepProgressBar } from '../components/StepProgressBar';

// 単位の選択肢
const UNIT_OPTIONS = ['式', '台', '個', '本', '枚', 'セット'];

// 登録区分の型
type RegistrationCategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | '';

// 元明細データの型
interface OriginalItem {
  id: number;
  rowNo: number;
  itemName: string;
  manufacturer: string;
  model: string;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
  registrationCategory: RegistrationCategory;
}

// 個体登録データの型
interface IndividualRecord {
  id: string;
  originalItemId: number;
  seqId: string;              // SEQ_ID（個体管理品目のみ連番）
  assetName: string;          // 個体品目名
  unit: string;               // 単位
  listUnitPrice: number | null;   // 定価単価
  allocatedUnitPrice: number | null; // 按分単価
  allocatedAmount: number | null;    // 按分金額
  parentSeqId: string;        // 親と紐付け（数字入力）
  registrationCategory: RegistrationCategory; // 登録区分
}

// テスト用元明細データ（全12件）
const testOriginalItems: OriginalItem[] = [
  {
    id: 1,
    rowNo: 1,
    itemName: '具象眼科用ユニット',
    manufacturer: '第一医科',
    model: 'さららEFUS01',
    quantity: 4,
    unitPrice: 3300000,
    totalPrice: 13200000,
    registrationCategory: 'B',
  },
  {
    id: 2,
    rowNo: 2,
    itemName: '仕様',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    registrationCategory: 'E',
  },
  {
    id: 3,
    rowNo: 3,
    itemName: '具象眼科用ユニット',
    manufacturer: '第一医科',
    model: 'さらら',
    quantity: 4,
    unitPrice: null,
    totalPrice: null,
    registrationCategory: 'C',
  },
  {
    id: 4,
    rowNo: 4,
    itemName: 'ホース付きスプレー2本',
    manufacturer: '第一',
    model: '',
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    registrationCategory: 'D',
  },
  {
    id: 5,
    rowNo: 5,
    itemName: '吸引清掃式　ロック枠掛付',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    registrationCategory: 'D',
  },
  {
    id: 6,
    rowNo: 6,
    itemName: '通気清掃式　ロック枠掛付',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    registrationCategory: 'D',
  },
  {
    id: 7,
    rowNo: 7,
    itemName: 'ツインボール',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    registrationCategory: 'C',
  },
  {
    id: 8,
    rowNo: 8,
    itemName: '照明灯あり',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    registrationCategory: 'D',
  },
  {
    id: 9,
    rowNo: 9,
    itemName: '吸引便ディスポ',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    registrationCategory: 'D',
  },
  {
    id: 10,
    rowNo: 10,
    itemName: 'キャスターあり',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    registrationCategory: 'D',
  },
  {
    id: 11,
    rowNo: 11,
    itemName: '天板フラット',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    unitPrice: null,
    totalPrice: null,
    registrationCategory: 'D',
  },
  {
    id: 12,
    rowNo: 12,
    itemName: 'さらら用ツインボール用棚　壁付タイプ',
    manufacturer: '第一医科',
    model: '',
    quantity: 4,
    unitPrice: 162000,
    totalPrice: 648000,
    registrationCategory: 'C',
  },
];

// テスト用個体登録データ（元明細の数量に基づいて生成）
const generateInitialRecords = (): IndividualRecord[] => {
  const records: IndividualRecord[] = [];
  let seqCounter = 1; // 個体管理品目（C）用の連番カウンター

  testOriginalItems.forEach((item) => {
    // 数量がnullの場合は1レコード、それ以外は数量分のレコードを生成
    const recordCount = item.quantity ?? 1;

    for (let i = 1; i <= recordCount; i++) {
      // 個体管理品目（C）の場合のみ連番を採番
      let seqId = '';
      let parentSeqId = '';
      if (item.registrationCategory === 'C') {
        seqId = String(seqCounter);
        parentSeqId = '本体';
        seqCounter++;
      }

      records.push({
        id: `item-${item.id}-${i}`,
        originalItemId: item.id,
        seqId,
        assetName: item.itemName,
        unit: '台',
        listUnitPrice: item.unitPrice,
        allocatedUnitPrice: null,
        allocatedAmount: null,
        parentSeqId,
        registrationCategory: item.registrationCategory,
      });
    }
  });

  return records;
};

export default function PriceAllocationPage() {
  const router = useRouter();

  // 元明細データ
  const [originalItems] = useState<OriginalItem[]>(testOriginalItems);

  // 個体登録データ
  const [individualRecords, setIndividualRecords] = useState<IndividualRecord[]>(generateInitialRecords());

  // 合計金額（税抜）
  const totalAmount = useMemo(() => {
    return individualRecords.reduce((sum, record) => sum + (record.allocatedAmount || 0), 0);
  }, [individualRecords]);

  // 単位の変更
  const handleUnitChange = (recordId: string, value: string) => {
    setIndividualRecords(prev => prev.map(record =>
      record.id === recordId ? { ...record, unit: value } : record
    ));
  };

  // 按分金額の変更
  const handleAllocatedAmountChange = (recordId: string, value: number | null) => {
    setIndividualRecords(prev => prev.map(record =>
      record.id === recordId ? { ...record, allocatedAmount: value } : record
    ));
  };

  // 親SEQ_IDの変更
  const handleParentSeqIdChange = (recordId: string, parentSeqId: string) => {
    setIndividualRecords(prev => prev.map(record =>
      record.id === recordId ? { ...record, parentSeqId } : record
    ));
  };

  // レコード追加
  const handleAddRecord = (originalItemId: number) => {
    const newId = `new-${Date.now()}`;
    const originalItem = originalItems.find(item => item.id === originalItemId);
    if (!originalItem) return;

    // 個体管理品目（C）の場合、次のSEQ_IDを計算し、親と紐付けを「本体」に設定
    let newSeqId = '';
    let newParentSeqId = '';
    if (originalItem.registrationCategory === 'C') {
      const maxSeqId = individualRecords
        .filter(r => r.registrationCategory === 'C' && r.seqId !== '')
        .map(r => parseInt(r.seqId, 10))
        .filter(n => !isNaN(n))
        .reduce((max, n) => Math.max(max, n), 0);
      newSeqId = String(maxSeqId + 1);
      newParentSeqId = '本体';
    }

    setIndividualRecords(prev => [...prev, {
      id: newId,
      originalItemId,
      seqId: newSeqId,
      assetName: originalItem.itemName,
      unit: '台',
      listUnitPrice: originalItem.unitPrice,
      allocatedUnitPrice: null,
      allocatedAmount: null,
      parentSeqId: newParentSeqId,
      registrationCategory: originalItem.registrationCategory,
    }]);
  };

  // レコード削除
  const handleDeleteRecord = (recordId: string) => {
    setIndividualRecords(prev => prev.filter(record => record.id !== recordId));
  };

  // 戻るボタン
  const handleBack = () => {
    router.push('/quotation-data-box/item-ai-matching');
  };

  // 登録確認ボタン
  const handleRegister = () => {
    router.push('/quotation-data-box/registration-confirm');
  };

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
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>個体登録及び金額按分</span>
              <span style={{ fontSize: '12px' }}>
                合計金額（税抜）:
                <span style={{
                  fontWeight: 'bold',
                  fontSize: '16px',
                  marginLeft: '8px',
                }}>
                  ¥{totalAmount.toLocaleString()}
                </span>
              </span>
            </div>

            {/* 明細テーブル */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', minWidth: '1200px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  {/* 2段ヘッダー */}
                  <tr>
                    <th colSpan={7} style={{
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
                    <th colSpan={7} style={{
                      padding: '6px',
                      textAlign: 'center',
                      borderBottom: '2px solid #e91e63',
                      fontWeight: 'bold',
                      color: '#e91e63',
                      background: '#fce4ec',
                      fontSize: '11px'
                    }}>
                      個体登録及び金額按分
                    </th>
                    <th style={{ padding: '6px', background: '#f8f9fa', width: '60px', fontSize: '11px' }}>操作</th>
                  </tr>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '5px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '30px', fontSize: '9px' }}>No</th>
                    <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '9px' }}>品名</th>
                    <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '70px', fontSize: '9px' }}>メーカー</th>
                    <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '70px', fontSize: '9px' }}>型式</th>
                    <th style={{ padding: '5px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '40px', fontSize: '9px' }}>数量</th>
                    <th style={{ padding: '5px', textAlign: 'right', borderBottom: '1px solid #dee2e6', width: '80px', fontSize: '9px' }}>単価</th>
                    <th style={{ padding: '5px', textAlign: 'right', borderBottom: '1px solid #dee2e6', width: '80px', fontSize: '9px' }}>金額</th>
                    <th style={{ padding: '5px', background: '#fafafa' }}></th>
                    <th style={{ padding: '5px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '60px', fontSize: '9px', background: '#fef5f7' }}>SEQ_ID</th>
                    <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '9px', background: '#fef5f7' }}>個体品目</th>
                    <th style={{ padding: '5px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '60px', fontSize: '9px', background: '#fef5f7' }}>単位</th>
                    <th style={{ padding: '5px', textAlign: 'right', borderBottom: '1px solid #dee2e6', width: '80px', fontSize: '9px', background: '#fef5f7' }}>定価単価</th>
                    <th style={{ padding: '5px', textAlign: 'right', borderBottom: '1px solid #dee2e6', width: '80px', fontSize: '9px', background: '#fef5f7' }}>按分単価</th>
                    <th style={{ padding: '5px', textAlign: 'right', borderBottom: '1px solid #dee2e6', width: '80px', fontSize: '9px', background: '#fef5f7' }}>按分金額</th>
                    <th style={{ padding: '5px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '80px', fontSize: '9px', background: '#fef5f7' }}>親と紐付け</th>
                    <th style={{ padding: '5px', borderBottom: '1px solid #dee2e6' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {individualRecords.map((record) => {
                    const originalItem = originalItems.find(item => item.id === record.originalItemId);
                    const isFirstOfOriginal = individualRecords.findIndex(r => r.originalItemId === record.originalItemId) === individualRecords.indexOf(record);
                    const recordsOfSameOriginal = individualRecords.filter(r => r.originalItemId === record.originalItemId);

                    return (
                      <tr key={record.id} style={{
                        borderBottom: '1px solid #eee',
                        background: 'white',
                      }}>
                        {/* 元明細情報（最初のレコードのみ表示、rowSpan使用） */}
                        {isFirstOfOriginal ? (
                          <>
                            <td rowSpan={recordsOfSameOriginal.length} style={{ padding: '5px', textAlign: 'center', borderRight: '1px solid #ddd', verticalAlign: 'top' }}>
                              {originalItem?.rowNo || '-'}
                            </td>
                            <td rowSpan={recordsOfSameOriginal.length} style={{ padding: '5px', borderRight: '1px solid #ddd', verticalAlign: 'top', fontWeight: 'bold' }}>
                              {originalItem?.itemName || '-'}
                            </td>
                            <td rowSpan={recordsOfSameOriginal.length} style={{ padding: '5px', borderRight: '1px solid #ddd', verticalAlign: 'top', color: '#555' }}>
                              {originalItem?.manufacturer || '-'}
                            </td>
                            <td rowSpan={recordsOfSameOriginal.length} style={{ padding: '5px', borderRight: '1px solid #ddd', verticalAlign: 'top', color: '#555' }}>
                              {originalItem?.model || '-'}
                            </td>
                            <td rowSpan={recordsOfSameOriginal.length} style={{ padding: '5px', textAlign: 'center', borderRight: '1px solid #ddd', verticalAlign: 'top' }}>
                              {originalItem?.quantity ?? '-'}
                            </td>
                            <td rowSpan={recordsOfSameOriginal.length} style={{ padding: '5px', textAlign: 'right', borderRight: '1px solid #ddd', verticalAlign: 'top' }}>
                              {originalItem?.unitPrice?.toLocaleString() || '-'}
                            </td>
                            <td rowSpan={recordsOfSameOriginal.length} style={{ padding: '5px', textAlign: 'right', borderRight: '1px solid #ddd', verticalAlign: 'top', fontWeight: 'bold' }}>
                              {originalItem?.totalPrice?.toLocaleString() || '-'}
                            </td>
                          </>
                        ) : null}

                        <td style={{ padding: '5px', textAlign: 'center', background: '#fafafa' }}>⇒</td>

                        {/* 個体登録情報 */}
                        <td style={{ padding: '5px', textAlign: 'center', background: '#fef5f7' }}>
                          <input
                            type="text"
                            value={record.seqId}
                            onChange={(e) => {
                              const newSeqId = e.target.value;
                              setIndividualRecords(prev => prev.map(r =>
                                r.id === record.id ? { ...r, seqId: newSeqId } : r
                              ));
                            }}
                            style={{ width: '50px', padding: '2px 4px', fontSize: '9px', border: '1px solid #ddd', borderRadius: '2px', textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ padding: '5px', background: '#fef5f7', fontWeight: 'bold' }}>
                          {record.assetName}
                        </td>
                        <td style={{ padding: '5px', textAlign: 'center', background: '#fef5f7' }}>
                          <select
                            value={record.unit}
                            onChange={(e) => handleUnitChange(record.id, e.target.value)}
                            style={{ padding: '2px 4px', fontSize: '9px', border: '1px solid #ddd', borderRadius: '2px' }}
                          >
                            <option value="">-</option>
                            {UNIT_OPTIONS.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '5px', textAlign: 'right', background: '#fef5f7' }}>
                          {record.listUnitPrice?.toLocaleString() || '-'}
                        </td>
                        <td style={{ padding: '5px', textAlign: 'right', background: '#fef5f7' }}>
                          <input
                            type="text"
                            value={record.allocatedUnitPrice?.toLocaleString() || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
                              setIndividualRecords(prev => prev.map(r =>
                                r.id === record.id ? { ...r, allocatedUnitPrice: value } : r
                              ));
                            }}
                            style={{ width: '70px', padding: '2px 4px', fontSize: '9px', border: '1px solid #ddd', borderRadius: '2px', textAlign: 'right' }}
                          />
                        </td>
                        <td style={{ padding: '5px', textAlign: 'right', background: '#fef5f7' }}>
                          <input
                            type="text"
                            value={record.allocatedAmount?.toLocaleString() || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
                              handleAllocatedAmountChange(record.id, value);
                            }}
                            style={{ width: '70px', padding: '2px 4px', fontSize: '9px', border: '1px solid #ddd', borderRadius: '2px', textAlign: 'right', fontWeight: 'bold' }}
                          />
                        </td>
                        <td style={{ padding: '5px', textAlign: 'center', background: '#fef5f7' }}>
                          <input
                            type="text"
                            value={record.parentSeqId}
                            onChange={(e) => handleParentSeqIdChange(record.id, e.target.value)}
                            placeholder=""
                            style={{ width: '50px', padding: '2px 4px', fontSize: '9px', border: '1px solid #ddd', borderRadius: '2px', textAlign: 'center' }}
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
              fontWeight: 'bold'
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
