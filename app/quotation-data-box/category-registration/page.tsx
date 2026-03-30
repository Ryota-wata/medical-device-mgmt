'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { StepProgressBar } from '../components/StepProgressBar';

// 明細区分の型
type DetailClassification =
  | '明細代表'
  | '内訳代表'
  | '親明細'
  | '子明細'
  | '孫明細'
  | 'その他'
  | '値引き'
  | '';

// 明細区分の選択肢
const DETAIL_CLASSIFICATION_OPTIONS: { value: DetailClassification; label: string }[] = [
  { value: '明細代表', label: '明細代表' },
  { value: '内訳代表', label: '内訳代表' },
  { value: '親明細', label: '親明細' },
  { value: '子明細', label: '子明細' },
  { value: '孫明細', label: '孫明細' },
  { value: 'その他', label: 'その他' },
  { value: '値引き', label: '値引き' },
];

// category（会計区分）の選択肢
const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: '01', label: '01 医療機器' },
  { value: '02', label: '02 医療用具' },
  { value: '03', label: '03 鋼製小物' },
  { value: '04', label: '04 什器備品' },
  { value: '05', label: '05 家電製品' },
  { value: '06', label: '06 その他器械備品' },
  { value: '07', label: '07 情報機器' },
  { value: '08', label: '08 ソフトウェア' },
  { value: '09', label: '09 車両他' },
  { value: '10', label: '10 放射線同位元素' },
  { value: '11', label: '11 建物' },
  { value: '12', label: '12 建物付帯設備' },
  { value: '13', label: '13 その他' },
  { value: '14', label: '14 器械保守料' },
  { value: '15', label: '15 修繕費' },
  { value: '16', label: '16 器械賃借料' },
  { value: '17', label: '17 材料費' },
];

// 明細データの型
interface DetailItem {
  id: number;
  itemName: string;           // 品名（見積名称）
  manufacturer: string;       // メーカー
  model: string;              // 型式（見積名称）
  quantity: number | null;    // 数量
  listUnitPrice: number | null;   // 定価単価
  listPrice: number | null;       // 定価金額
  purchaseUnitPrice: number | null; // 購入単価
  purchaseAmount: number | null;    // 購入金額
  category: string;                // category（会計区分）
  detailClassification: DetailClassification; // 明細区分（AI判定結果）
  isRegistered: boolean;       // 登録済みかどうか
}

// テスト用明細データ（AI判定結果を含む）
const testDetailItems: DetailItem[] = [
  {
    id: 1,
    itemName: '具象眼科用ユニット',
    manufacturer: '第一医科',
    model: 'さららEFUS01',
    quantity: 4,
    listUnitPrice: 3300000,
    listPrice: 13200000,
    purchaseUnitPrice: 1650000,
    purchaseAmount: 6600000,
    category: '01',
    detailClassification: '明細代表',
    isRegistered: false,
  },
  {
    id: 2,
    itemName: '仕様',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    listUnitPrice: null,
    listPrice: null,
    purchaseUnitPrice: null,
    purchaseAmount: null,
    category: '01',
    detailClassification: 'その他',
    isRegistered: false,
  },
  {
    id: 3,
    itemName: '具象眼科用ユニット',
    manufacturer: '第一医科',
    model: 'さらら',
    quantity: 4,
    listUnitPrice: null,
    listPrice: null,
    purchaseUnitPrice: null,
    purchaseAmount: null,
    category: '01',
    detailClassification: '親明細',
    isRegistered: false,
  },
  {
    id: 4,
    itemName: 'ホース付きスプレー2本',
    manufacturer: '第一',
    model: '',
    quantity: null,
    listUnitPrice: null,
    listPrice: null,
    purchaseUnitPrice: null,
    purchaseAmount: null,
    category: '01',
    detailClassification: '子明細',
    isRegistered: false,
  },
  {
    id: 5,
    itemName: '吸引清掃式　ロック枠掛付',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    listUnitPrice: null,
    listPrice: null,
    purchaseUnitPrice: null,
    purchaseAmount: null,
    category: '01',
    detailClassification: '子明細',
    isRegistered: false,
  },
  {
    id: 6,
    itemName: '通気清掃式　ロック枠掛付',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    listUnitPrice: null,
    listPrice: null,
    purchaseUnitPrice: null,
    purchaseAmount: null,
    category: '01',
    detailClassification: '子明細',
    isRegistered: false,
  },
  {
    id: 7,
    itemName: 'ツインボール',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    listUnitPrice: null,
    listPrice: null,
    purchaseUnitPrice: null,
    purchaseAmount: null,
    category: '01',
    detailClassification: '親明細',
    isRegistered: false,
  },
  {
    id: 8,
    itemName: '照明灯あり',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    listUnitPrice: null,
    listPrice: null,
    purchaseUnitPrice: null,
    purchaseAmount: null,
    category: '01',
    detailClassification: '子明細',
    isRegistered: false,
  },
  {
    id: 9,
    itemName: '吸引便ディスポ',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    listUnitPrice: null,
    listPrice: null,
    purchaseUnitPrice: null,
    purchaseAmount: null,
    category: '01',
    detailClassification: '子明細',
    isRegistered: false,
  },
  {
    id: 10,
    itemName: 'キャスターあり',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    listUnitPrice: null,
    listPrice: null,
    purchaseUnitPrice: null,
    purchaseAmount: null,
    category: '01',
    detailClassification: '子明細',
    isRegistered: false,
  },
  {
    id: 11,
    itemName: '天板フラット',
    manufacturer: '第一医科',
    model: '',
    quantity: null,
    listUnitPrice: null,
    listPrice: null,
    purchaseUnitPrice: null,
    purchaseAmount: null,
    category: '01',
    detailClassification: '子明細',
    isRegistered: false,
  },
  {
    id: 12,
    itemName: 'さらら用ツインボール用棚　壁付タイプ',
    manufacturer: '第一医科',
    model: '',
    quantity: 4,
    listUnitPrice: 162000,
    listPrice: null,
    purchaseUnitPrice: null,
    purchaseAmount: 648000,
    category: '01',
    detailClassification: '親明細',
    isRegistered: false,
  },
];

export default function CategoryRegistrationPage() {
  const router = useRouter();

  // 明細データ
  const [detailItems, setDetailItems] = useState<DetailItem[]>(testDetailItems);

  // 登録済み件数
  const registeredCount = useMemo(() => {
    return detailItems.filter(item => item.isRegistered).length;
  }, [detailItems]);

  // category の更新
  const handleCategoryChange = (index: number, value: string) => {
    setDetailItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], category: value };
      return updated;
    });
  };

  // 明細区分の更新
  const handleClassificationChange = (index: number, value: DetailClassification) => {
    setDetailItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], detailClassification: value };
      return updated;
    });
  };

  // 登録処理
  const handleRegister = (index: number) => {
    setDetailItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isRegistered: true };
      return updated;
    });
  };

  // 登録解除処理
  const handleUnregister = (index: number) => {
    setDetailItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isRegistered: false };
      return updated;
    });
  };

  // 戻るボタン
  const handleBack = () => {
    router.push('/quotation-data-box/ocr-confirm');
  };

  // 次へボタン（個体品目AI判定へ）
  const handleNext = () => {
    // 全件登録済みかチェック
    const allRegistered = detailItems.every(item => item.isRegistered);
    if (!allRegistered) {
      if (!confirm('未登録の明細があります。続行しますか？')) {
        return;
      }
    }
    router.push('/quotation-data-box/item-ai-matching');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f5f5f5' }}>
      <Header
        title="見積登録（購入）AI判定確認"
        stepBadge="STEP 3"
        hideMenu={true}
        showBackButton={false}
      />
      <StepProgressBar currentStep={3} />

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
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>登録区分登録</span>
              <span style={{ fontSize: '12px', opacity: 0.9 }}>
                登録: {registeredCount} / {detailItems.length}件
              </span>
            </div>
          </div>

          {/* 説明文 */}
          <div style={{ padding: '12px 16px', background: '#e3f2fd', fontSize: '12px', color: '#1565c0' }}>
            登録区分をチェック・修正してください　※QRラベルを発行・除却が可能な単位にて登録を行います
          </div>

          {/* 明細テーブル */}
          <div style={{ padding: '16px' }}>
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead style={{ position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '8px 6px', textAlign: 'center', background: '#374151', color: 'white', border: '1px solid #374151', width: '40px' }}>No.</th>
                    <th style={{ padding: '8px 6px', textAlign: 'left', background: '#374151', color: 'white', border: '1px solid #374151' }}>品名（見積名称）</th>
                    <th style={{ padding: '8px 6px', textAlign: 'left', background: '#374151', color: 'white', border: '1px solid #374151', width: '100px' }}>メーカー</th>
                    <th style={{ padding: '8px 6px', textAlign: 'left', background: '#374151', color: 'white', border: '1px solid #374151', width: '120px' }}>型式（見積名称）</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center', background: '#374151', color: 'white', border: '1px solid #374151', width: '50px' }}>数量</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center', background: '#f39c12', color: 'white', border: '1px solid #e08e0b', width: '160px', fontWeight: 'bold' }}>category</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center', background: '#1f2937', color: 'white', border: '1px solid #1f2937', width: '200px', fontWeight: 'bold' }}>明細区分</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center', background: '#374151', color: 'white', border: '1px solid #374151', width: '80px' }}>ステータス</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center', background: '#374151', color: 'white', border: '1px solid #374151', width: '80px' }}>アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {detailItems.map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee', background: item.isRegistered ? '#e8f5e9' : 'white' }}>
                      <td style={{ padding: '6px', textAlign: 'center', background: '#f8f9fa', border: '1px solid #ddd' }}>{item.id}</td>
                      <td style={{ padding: '6px', border: '1px solid #ddd' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{item.itemName}</div>
                      </td>
                      <td style={{ padding: '6px', border: '1px solid #ddd', fontSize: '11px' }}>{item.manufacturer}</td>
                      <td style={{ padding: '6px', border: '1px solid #ddd', fontSize: '11px' }}>{item.model}</td>
                      <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center', fontSize: '11px' }}>{item.quantity ?? '-'}</td>
                      <td style={{ padding: '6px', background: '#fff8e1', border: '1px solid #ddd' }}>
                        <select
                          value={item.category}
                          onChange={(e) => handleCategoryChange(index, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: '11px',
                            border: '1px solid #ddd',
                            borderRadius: '3px',
                            background: 'white',
                          }}
                        >
                          {CATEGORY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '6px', background: '#fce4ec', border: '1px solid #ddd' }}>
                        <select
                          value={item.detailClassification}
                          onChange={(e) => handleClassificationChange(index, e.target.value as DetailClassification)}
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: '11px',
                            border: '1px solid #ddd',
                            borderRadius: '3px',
                            background: 'white',
                          }}
                        >
                          <option value="">選択...</option>
                          {DETAIL_CLASSIFICATION_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          background: item.isRegistered ? '#27ae60' : '#f39c12',
                          color: 'white',
                        }}>
                          {item.isRegistered ? '登録済' : '未登録'}
                        </span>
                      </td>
                      <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>
                        {item.isRegistered ? (
                          <button
                            onClick={() => handleUnregister(index)}
                            style={{
                              padding: '4px 12px',
                              background: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '10px',
                              fontWeight: 'bold',
                            }}
                          >
                            解除
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRegister(index)}
                            disabled={!item.detailClassification}
                            style={{
                              padding: '4px 12px',
                              background: item.detailClassification ? '#27ae60' : '#bdc3c7',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: item.detailClassification ? 'pointer' : 'not-allowed',
                              fontSize: '10px',
                              fontWeight: 'bold',
                            }}
                          >
                            登録
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            個体品目AI判定へ
          </button>
        </div>
      </div>
    </div>
  );
}
