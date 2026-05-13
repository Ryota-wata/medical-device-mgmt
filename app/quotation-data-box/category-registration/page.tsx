'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Undo2 } from 'lucide-react';
import { Header } from '@/components/layouts/Header';
import { StepProgressBar } from '../components/StepProgressBar';
import { ACCOUNT_DIVISIONS as CATEGORY_OPTIONS } from '@/lib/data/account-divisions';
import { customerStep3Items } from '@/lib/data/customer/step3-category';

type DetailClassification =
  | '明細代表' | '内訳代表' | '親明細' | '子明細' | '孫明細' | 'その他' | '値引き' | '';

const DETAIL_CLASSIFICATION_OPTIONS: { value: DetailClassification; label: string }[] = [
  { value: '明細代表', label: '明細代表' },
  { value: '内訳代表', label: '内訳代表' },
  { value: '親明細', label: '親明細' },
  { value: '子明細', label: '子明細' },
  { value: '孫明細', label: '孫明細' },
  { value: 'その他', label: 'その他' },
  { value: '値引き', label: '値引き' },
];

interface DetailItem {
  id: number;
  itemName: string;
  manufacturer: string;
  model: string;
  quantity: number | null;
  listUnitPrice: number | null;
  listPrice: number | null;
  purchaseUnitPrice: number | null;
  purchaseAmount: number | null;
  category: string;
  detailClassification: DetailClassification;
  isRegistered: boolean;
}

const classificationMap: Record<string, DetailClassification> = {
  '代表明細': '明細代表', '親': '親明細', '子': '子明細', '孫': '孫明細',
  'その他': 'その他', '文字列': 'その他', '値引き': '値引き',
};

const testDetailItems: DetailItem[] = customerStep3Items.map((item, i) => ({
  id: i + 1,
  itemName: item.itemName,
  manufacturer: item.manufacturer,
  model: item.model,
  quantity: item.quantity || null,
  listUnitPrice: item.listPriceUnit || null,
  listPrice: item.listPriceTotal || null,
  purchaseUnitPrice: item.purchasePriceUnit || null,
  purchaseAmount: item.purchasePriceTotal || null,
  category: item.category?.match(/^\d+/)?.[0] || '01',
  detailClassification: classificationMap[item.itemType] || '' as DetailClassification,
  isRegistered: false,
}));

export default function CategoryRegistrationPage() {
  const router = useRouter();
  const [detailItems, setDetailItems] = useState<DetailItem[]>(testDetailItems);

  const registeredCount = useMemo(
    () => detailItems.filter(item => item.isRegistered).length,
    [detailItems]
  );

  const handleCategoryChange = (index: number, value: string) => {
    setDetailItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], category: value };
      return updated;
    });
  };

  const handleClassificationChange = (index: number, value: DetailClassification) => {
    setDetailItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], detailClassification: value };
      return updated;
    });
  };

  const handleRegister = (index: number) => {
    setDetailItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isRegistered: true };
      return updated;
    });
  };

  const handleUnregister = (index: number) => {
    setDetailItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isRegistered: false };
      return updated;
    });
  };

  const handleBack = () => router.push('/quotation-data-box/ocr-confirm');

  const handleNext = () => {
    const allRegistered = detailItems.every(item => item.isRegistered);
    if (!allRegistered) {
      if (!confirm('未登録の明細があります。続行しますか？')) return;
    }
    router.push('/quotation-data-box/item-ai-matching');
  };

  const selectCls = 'w-full px-2 py-1.5 text-xs border border-stroke-input rounded-sm bg-surface-card focus:outline-none focus:border-cta-primary';

  return (
    <div className="flex flex-col h-dvh bg-surface-screen">
      <Header title="見積登録（購入）AI判定確認" stepBadge="STEP 3" hideMenu showBackButton={false} />
      <StepProgressBar currentStep={3} />

      <div className="flex-1 overflow-auto p-4">
        {/* 単一カード (Figma 338:48871 構造) */}
        <section className="bg-surface-card border border-stroke-card rounded-2xl mb-4">
          <div className="p-4 flex flex-col gap-6">
            {/* 説明エリア (Figma 338:48874 構造: ラベル列 200px + 入力 flex-1) */}
            <div className="flex items-stretch border border-stroke-input rounded">
              <div className="flex items-center justify-center px-4 w-[200px] shrink-0 bg-stroke-card text-base text-content-primary text-center gap-2">
                <span>登録区分の登録</span>
                <span className="text-xs text-content-sub tabular-nums">{registeredCount}/{detailItems.length}</span>
              </div>
              <div className="flex-1 flex flex-col justify-center px-4 py-3 bg-surface-select gap-1">
                <p className="text-sm font-semibold text-cta-primary-dark">
                  登録区分をチェック・修正してください
                </p>
                <p className="text-xs text-content-primary leading-relaxed">
                  ※QRラベルを発行・除却が可能な単位にて登録を行います
                </p>
              </div>
            </div>

            {/* テーブル (Figma 338:48880 構造: 9 列) */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs min-w-[1559px]">
                <thead className="sticky top-0 z-[2] bg-stroke-card">
                  <tr>
                    <th className="px-2 py-2 text-center border border-stroke-input w-[56px] font-normal text-content-primary">No</th>
                    <th className="px-2 py-2 text-left border border-stroke-input w-[300px] font-normal text-content-primary">品名（見積名称）</th>
                    <th className="px-2 py-2 text-left border border-stroke-input w-[232px] font-normal text-content-primary">メーカー</th>
                    <th className="px-2 py-2 text-left border border-stroke-input w-[144px] font-normal text-content-primary">型式（見積名称）</th>
                    <th className="px-2 py-2 text-center border border-stroke-input w-[65px] font-normal text-content-primary">数量</th>
                    <th className="px-2 py-2 text-center border border-stroke-input w-[300px] font-normal text-content-primary">カテゴリ</th>
                    <th className="px-2 py-2 text-center border border-stroke-input w-[300px] font-normal text-content-primary">明細区分</th>
                    <th className="px-2 py-2 text-center border border-stroke-input w-[102px] font-normal text-content-primary">ステータス</th>
                    <th className="px-2 py-2 text-center border border-stroke-input w-[60px] font-normal text-content-primary">アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {detailItems.map((item, index) => (
                    <tr key={item.id} className={item.isRegistered ? 'bg-surface-select' : 'bg-surface-card'}>
                      <td className="px-2 py-2 text-center tabular-nums border border-stroke-input text-content-primary">{item.id}</td>
                      <td className="px-2 py-2 border border-stroke-input text-content-primary">{item.itemName}</td>
                      <td className="px-2 py-2 border border-stroke-input text-content-primary">{item.manufacturer}</td>
                      <td className="px-2 py-2 border border-stroke-input text-content-primary">{item.model}</td>
                      <td className="px-2 py-2 text-center tabular-nums border border-stroke-input text-content-primary">{item.quantity ?? '-'}</td>
                      <td className="px-2 py-1.5 border border-stroke-input">
                        <select
                          value={item.category}
                          onChange={e => handleCategoryChange(index, e.target.value)}
                          className={selectCls}
                          aria-label="カテゴリ"
                        >
                          {CATEGORY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5 border border-stroke-input">
                        <select
                          value={item.detailClassification}
                          onChange={e => handleClassificationChange(index, e.target.value as DetailClassification)}
                          className={selectCls}
                          aria-label="明細区分"
                        >
                          <option value="">選択...</option>
                          {DETAIL_CLASSIFICATION_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2 border border-stroke-input text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${item.isRegistered ? 'bg-cta-primary text-white' : 'bg-stroke-card text-content-sub'}`}>
                          {item.isRegistered ? '登録済' : '未登録'}
                        </span>
                      </td>
                      <td className="px-2 py-2 border border-stroke-input text-center">
                        {item.isRegistered ? (
                          <button
                            onClick={() => handleUnregister(index)}
                            className="inline-flex items-center justify-center size-8 text-content-primary border-0 bg-transparent rounded cursor-pointer hover:bg-stroke-card transition-colors"
                            aria-label="登録解除"
                          >
                            <Undo2 size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRegister(index)}
                            disabled={!item.detailClassification}
                            className={`px-3 py-1 text-white border-0 rounded text-[10px] font-bold transition-colors ${
                              item.detailClassification
                                ? 'bg-cta-primary cursor-pointer hover:bg-cta-primary-dark'
                                : 'bg-surface-disabled cursor-not-allowed'
                            }`}
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
        </section>

        {/* フッターボタン (Figma 338:48048: 左寄せ 239+239) */}
        <div className="flex gap-12 mt-4 px-4">
          <button
            onClick={handleBack}
            className="h-12 w-[239px] bg-surface-negative text-content-primary border-0 rounded-lg cursor-pointer text-base font-normal hover:bg-stroke-input transition-colors"
          >
            戻る
          </button>
          <button
            onClick={handleNext}
            className="h-12 w-[239px] bg-cta-primary text-white border-0 rounded-lg cursor-pointer text-base font-normal hover:bg-cta-primary-dark transition-colors"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}
