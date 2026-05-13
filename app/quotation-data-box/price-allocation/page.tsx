'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { StepProgressBar } from '../components/StepProgressBar';
import { customerStep5Items } from '@/lib/data/customer/step5-individual';
import { customerStep4Items } from '@/lib/data/customer/step4-asset-master';

type DetailClassification = '明細代表' | '内訳代表' | '親明細' | '子明細' | '孫明細' | 'その他' | '値引き' | '';
const UNIT_OPTIONS = ['台', '個', '本', '枚', '組', 'セット', '式'];

const classMap: Record<string, DetailClassification> = {
  '代表明細': '明細代表', '親': '親明細', '子': '子明細', '孫': '孫明細',
  'その他': 'その他', '文字列': 'その他', '値引き': '値引き',
};

interface Row {
  id: string;
  rowNo: number;
  category: string;
  detailClassification: DetailClassification;
  itemName: string;
  manufacturer: string;
  model: string;
  quantity: number;
  listPriceUnit: number;
  listPriceTotal: number;
  purchasePriceUnit: number;
  purchasePriceTotal: number;
  unit: string;
  seqId: string;
  allocationCategory: string;
  differenceAllocation: string;
  allocListPrice: number;
  allocPurchasePrice: number;
  taxCategory: string;
  allocPurchaseTaxIncl: number;
  isFirstOfGroup: boolean;
  groupRowCount: number;
}

function buildRows(): Row[] {
  const rows: Row[] = [];
  let seqCounter = 1;
  for (const item of customerStep5Items) {
    const cls = (classMap[item.itemType] || item.itemType || '') as DetailClassification;
    const isParent = cls === '親明細';
    const step4Item = customerStep4Items.find(s4 => s4.rowNo === item.rowNo);
    const expandCount = isParent ? (step4Item?.quantity || item.quantity || 1) : 1;

    for (let i = 0; i < expandCount; i++) {
      rows.push({
        id: `r-${item.rowNo}-${i}`,
        rowNo: item.rowNo,
        category: item.category || '',
        detailClassification: cls,
        itemName: item.itemName,
        manufacturer: item.manufacturer,
        model: item.model,
        quantity: isParent ? 1 : (item.quantity || 1),
        listPriceUnit: item.listPriceUnit || 0,
        listPriceTotal: item.listPriceTotal || 0,
        purchasePriceUnit: item.purchasePriceUnit || 0,
        purchasePriceTotal: item.purchasePriceTotal || 0,
        unit: item.unit || '台',
        seqId: isParent ? String(seqCounter++) : (cls === '子明細' || cls === '孫明細') ? '-' : '',
        allocationCategory: item.allocationCategory || '対象',
        differenceAllocation: item.differenceAllocation || '',
        allocListPrice: 0,
        allocPurchasePrice: 0,
        taxCategory: item.taxCategory || '課税',
        allocPurchaseTaxIncl: 0,
        isFirstOfGroup: i === 0,
        groupRowCount: expandCount,
      });
    }
  }
  return rows;
}

function calcTotal(rows: Row[]): number {
  const seen = new Set<number>();
  let total = 0;
  for (const r of rows) {
    if (r.isFirstOfGroup && !seen.has(r.rowNo)) {
      seen.add(r.rowNo);
      total += r.purchasePriceTotal;
    }
  }
  return total;
}

const classLabelStyleMap: Record<DetailClassification, string> = {
  '親明細': 'bg-cta-primary text-white',
  '子明細': 'bg-content-link text-white',
  '孫明細': 'bg-content-primary text-white',
  '明細代表': 'bg-content-sub text-white',
  '内訳代表': 'bg-content-sub text-white',
  'その他': 'bg-content-sub text-white',
  '値引き': 'bg-content-sub text-white',
  '': '',
};

export default function PriceAllocationPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(buildRows);

  const total = useMemo(() => calcTotal(rows), [rows]);

  const handleFieldChange = useCallback((id: string, field: keyof Row, value: string | number) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  const fmtNum = (n: number) => n ? n.toLocaleString() : '';

  const cellInputCls = 'w-full text-xs px-1.5 py-1 border border-stroke-input rounded-sm bg-surface-card box-border focus:outline-none focus:border-cta-primary';

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Header title="見積登録（購入）個体登録及び金額按分" stepBadge="STEP 5" hideMenu showBackButton={false} />
      <StepProgressBar currentStep={5} />

      <div className="flex-1 overflow-auto p-4">
        {/* 単一カード (Figma 339:52825 構造) */}
        <section className="bg-surface-card border border-stroke-card rounded-2xl mb-4">
          <div className="p-4 flex flex-col gap-6">
            {/* トップバー (Figma 339:52827: ラベル列 200px + 入力行 1696px 右寄せ合計表示) */}
            <div className="flex items-center h-[65px]">
              <div className="flex items-center justify-center h-[65px] w-[200px] shrink-0 bg-stroke-card text-base text-content-primary">
                個体登録及び金額按分
              </div>
              <div className="flex-1 flex items-center justify-end pr-4 gap-3">
                <span className="text-sm text-content-primary">支払金額（税込）</span>
                <span className="text-xl font-bold text-content-alert tabular-nums">
                  ¥{total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* テーブル (Figma 339:52834 構造: 左886 商品情報 + 右1010 個体登録/金額按分) */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs min-w-[1800px]">
                <thead className="sticky top-0 z-[2] bg-stroke-card">
                  {/* グループヘッダー */}
                  <tr>
                    <th colSpan={7} className="px-2 py-2 text-center border border-stroke-input text-sm font-bold text-content-primary">
                      商品情報（原本情報）
                    </th>
                    <th colSpan={8} className="px-2 py-2 text-center border border-stroke-input text-sm font-bold text-content-primary">
                      個体管理品目及び金額按分
                    </th>
                  </tr>
                  {/* 個別ヘッダー */}
                  <tr>
                    <th className="px-2 py-2 text-center border border-stroke-input w-[50px] font-normal text-content-primary">No</th>
                    <th className="px-2 py-2 text-left border border-stroke-input min-w-[260px] font-normal text-content-primary">品名（見積名称）</th>
                    <th className="px-2 py-2 text-left border border-stroke-input w-[100px] font-normal text-content-primary">メーカー</th>
                    <th className="px-2 py-2 text-left border border-stroke-input w-[100px] font-normal text-content-primary">型式</th>
                    <th className="px-2 py-2 text-center border border-stroke-input w-[60px] font-normal text-content-primary">数量</th>
                    <th className="px-2 py-2 text-right border border-stroke-input w-[100px] font-normal text-content-primary">定価金額</th>
                    <th className="px-2 py-2 text-right border border-stroke-input w-[110px] font-normal text-content-primary">購入金額<br />(税別)</th>
                    <th className="px-2 py-2 text-center border border-stroke-input w-[60px] font-normal text-content-primary">STEP_ID</th>
                    <th className="px-2 py-2 text-left border border-stroke-input w-[160px] font-normal text-content-primary">個体管理品目</th>
                    <th className="px-2 py-2 text-center border border-stroke-input w-[70px] font-normal text-content-primary">単位</th>
                    <th className="px-2 py-2 text-center border border-stroke-input w-[80px] font-normal text-content-primary">案分区分</th>
                    <th className="px-2 py-2 text-right border border-stroke-input w-[110px] font-normal text-content-primary">定価金額</th>
                    <th className="px-2 py-2 text-right border border-stroke-input w-[110px] font-normal text-content-primary">購入金額<br />(税別)</th>
                    <th className="px-2 py-2 text-center border border-stroke-input w-[80px] font-normal text-content-primary">税区分</th>
                    <th className="px-2 py-2 text-right border border-stroke-input w-[110px] font-normal text-content-primary">購入金額<br />(税込)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const showOriginal = row.isFirstOfGroup;
                    const span = row.groupRowCount;
                    const clsLabel = row.detailClassification.replace('明細', '');

                    return (
                      <tr key={row.id} className="border-b border-stroke-card">
                        {showOriginal && (
                          <>
                            <td rowSpan={span} className="px-2 py-2 text-center tabular-nums align-middle border border-stroke-input text-content-primary">{row.rowNo}</td>
                            <td rowSpan={span} className="px-2 py-2 align-middle border border-stroke-input text-content-primary">
                              <div className="flex items-center gap-2">
                                {row.detailClassification && (
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${classLabelStyleMap[row.detailClassification]}`}>{clsLabel}</span>
                                )}
                                <span>{row.itemName}</span>
                              </div>
                            </td>
                            <td rowSpan={span} className="px-2 py-2 align-middle border border-stroke-input text-content-primary">{row.manufacturer}</td>
                            <td rowSpan={span} className="px-2 py-2 align-middle border border-stroke-input text-content-primary">{row.model}</td>
                            <td rowSpan={span} className="px-2 py-2 text-center tabular-nums align-middle border border-stroke-input text-content-primary">{row.quantity || '-'}</td>
                            <td rowSpan={span} className="px-2 py-2 text-right tabular-nums align-middle border border-stroke-input text-content-primary">{fmtNum(row.listPriceTotal)}</td>
                            <td rowSpan={span} className="px-2 py-2 text-right tabular-nums align-middle border border-stroke-input font-bold text-content-primary">{fmtNum(row.purchasePriceTotal)}</td>
                          </>
                        )}
                        {/* 個体登録/金額按分セクション (Figma Details Row) */}
                        <td className="px-1.5 py-1 text-center align-middle border border-stroke-input bg-surface-select">
                          <input
                            type="text"
                            value={row.seqId}
                            onChange={e => handleFieldChange(row.id, 'seqId', e.target.value)}
                            className={`${cellInputCls} text-center`}
                            aria-label="STEP_ID"
                          />
                        </td>
                        <td className="px-1.5 py-1 align-middle border border-stroke-input bg-surface-select text-content-primary">
                          {row.itemName}
                        </td>
                        <td className="px-1.5 py-1 align-middle border border-stroke-input bg-surface-select">
                          <select
                            value={row.unit}
                            onChange={e => handleFieldChange(row.id, 'unit', e.target.value)}
                            className={cellInputCls}
                            aria-label="単位"
                          >
                            {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td className="px-1.5 py-1 align-middle border border-stroke-input bg-surface-select">
                          <select
                            value={row.allocationCategory}
                            onChange={e => handleFieldChange(row.id, 'allocationCategory', e.target.value)}
                            className={cellInputCls}
                            aria-label="案分区分"
                          >
                            <option value="対象">対象</option>
                            <option value="-">-</option>
                          </select>
                        </td>
                        <td className="px-1.5 py-1 text-right align-middle border border-stroke-input bg-surface-select tabular-nums">
                          <input
                            type="text"
                            value={fmtNum(row.allocListPrice)}
                            onChange={e => handleFieldChange(row.id, 'allocListPrice', parseInt(e.target.value.replace(/,/g, ''), 10) || 0)}
                            className={`${cellInputCls} text-right`}
                            aria-label="按分後 定価金額"
                          />
                        </td>
                        <td className="px-1.5 py-1 text-right align-middle border border-stroke-input bg-surface-select tabular-nums">
                          <input
                            type="text"
                            value={fmtNum(row.allocPurchasePrice)}
                            onChange={e => handleFieldChange(row.id, 'allocPurchasePrice', parseInt(e.target.value.replace(/,/g, ''), 10) || 0)}
                            className={`${cellInputCls} text-right`}
                            aria-label="按分後 購入金額"
                          />
                        </td>
                        <td className="px-1.5 py-1 align-middle border border-stroke-input bg-surface-select">
                          <select
                            value={row.taxCategory}
                            onChange={e => handleFieldChange(row.id, 'taxCategory', e.target.value)}
                            className={cellInputCls}
                            aria-label="税区分"
                          >
                            <option value="課税">課税</option>
                            <option value="非課税">非課税</option>
                          </select>
                        </td>
                        <td className="px-1.5 py-1 text-right align-middle border border-stroke-input bg-surface-select tabular-nums font-bold">
                          <input
                            type="text"
                            value={fmtNum(row.allocPurchaseTaxIncl)}
                            onChange={e => handleFieldChange(row.id, 'allocPurchaseTaxIncl', parseInt(e.target.value.replace(/,/g, ''), 10) || 0)}
                            className={`${cellInputCls} text-right font-bold`}
                            aria-label="購入金額(税込)"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* フッターボタン (Figma 339:52704: 左寄せ 239+239) */}
        <div className="flex gap-12 mt-4 px-4">
          <button
            onClick={() => router.push('/quotation-data-box/item-ai-matching')}
            className="h-12 w-[239px] bg-surface-negative text-content-primary border-0 rounded-lg cursor-pointer text-base font-normal hover:bg-stroke-input transition-colors"
          >
            戻る
          </button>
          <button
            onClick={() => router.push('/quotation-data-box/registration-confirm')}
            className="h-12 w-[239px] bg-cta-primary text-white border-0 rounded-lg cursor-pointer text-base font-normal hover:bg-cta-primary-dark transition-colors"
          >
            登録確認
          </button>
        </div>
      </div>
    </div>
  );
}
