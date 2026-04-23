'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { StepProgressBar } from '../components/StepProgressBar';
import { customerStep5Items, customerStep4Items } from '@/lib/data/customer';

// 明細区分の型
type DetailClassification = '明細代表' | '内訳代表' | '親明細' | '子明細' | '孫明細' | 'その他' | '値引き' | '';
const UNIT_OPTIONS = ['台', '個', '本', '枚', '組', 'セット', '式'];

// 明細区分マッピング
const classMap: Record<string, DetailClassification> = {
  '代表明細': '明細代表', '親': '親明細', '子': '子明細', '孫': '孫明細',
  'その他': 'その他', '文字列': 'その他', '値引き': '値引き',
};

// --- 行データ型（親明細は数量分展開される） ---
interface Row {
  id: string;
  rowNo: number;              // 元No
  category: string;           // STEP3: カテゴリ
  detailClassification: DetailClassification; // STEP3: 明細区分
  itemName: string;           // STEP4: 個体管理品目
  manufacturer: string;       // STEP4: メーカー
  model: string;              // STEP4: 型式(見積名称)
  quantity: number;           // STEP4: 数量（展開後は1）
  // 価格情報（原本）
  listPriceUnit: number;      // 定価単価
  listPriceTotal: number;     // 定価金額
  purchasePriceUnit: number;  // 購入単価(税別)
  purchasePriceTotal: number; // 購入金額(税別)
  // STEP5
  unit: string;
  seqId: string;              // 親子関係
  allocationCategory: string; // 価格案分区分: 対象 / -
  differenceAllocation: string; // 差額金額を案分
  allocListPrice: number;     // 定価金額（案分後）
  allocPurchasePrice: number; // 購入金額(税別)（案分後）
  taxCategory: string;        // 税区分
  allocPurchaseTaxIncl: number; // 購入金額(税込)
  isFirstOfGroup: boolean;    // 同一rowNoの最初の行か
  groupRowCount: number;      // 同一rowNoの行数
}

// --- 顧客データから行を生成 ---
// STEP4のquantityを使って親明細を数量分展開
function buildRows(): Row[] {
  const rows: Row[] = [];
  let seqCounter = 1;

  for (const item of customerStep5Items) {
    const cls = (classMap[item.itemType] || item.itemType || '') as DetailClassification;
    const isParent = cls === '親明細';
    // 親明細の展開数量はSTEP4データから取得（STEP5では1になっている）
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

// --- 金額計算 ---
function calcTotals(rows: Row[]) {
  // 元明細ベース（rowNoでユニーク）で集計
  const seen = new Set<number>();
  let total = 0;
  let allocationTarget = 0;
  let allocationExcluded = 0;

  for (const r of rows) {
    if (r.isFirstOfGroup && !seen.has(r.rowNo)) {
      seen.add(r.rowNo);
      total += r.purchasePriceTotal;
      if (r.allocationCategory === '対象') {
        allocationTarget += r.purchasePriceTotal;
      } else {
        allocationExcluded += r.purchasePriceTotal;
      }
    }
  }
  return { total, allocationTarget, allocationExcluded, difference: 0 };
}

export default function PriceAllocationPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(buildRows);
  const [showOnlyIndividual, setShowOnlyIndividual] = useState(false);

  const displayRows = useMemo(() => {
    if (showOnlyIndividual) {
      return rows.filter(r => r.detailClassification === '親明細' || r.detailClassification === '子明細');
    }
    return rows;
  }, [rows, showOnlyIndividual]);

  const totals = useMemo(() => calcTotals(rows), [rows]);

  const handleFieldChange = useCallback((id: string, field: keyof Row, value: string | number) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  const fmtNum = (n: number) => n ? n.toLocaleString() : '';

  const classColor = (cls: DetailClassification) => {
    if (cls === '親明細') return '#e74c3c';
    if (cls === '子明細') return '#2196f3';
    if (cls === '孫明細') return '#9c27b0';
    if (cls === '明細代表') return '#666';
    if (cls === 'その他') return '#888';
    return '#666';
  };

  const thBase: React.CSSProperties = { padding: '5px', borderBottom: '1px solid #dee2e6', fontSize: '10px', whiteSpace: 'nowrap' };
  const tdBase: React.CSSProperties = { padding: '4px 5px', fontSize: '10px', verticalAlign: 'top' };
  const borderR: React.CSSProperties = { borderRight: '1px solid #ccc' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f5f5f5' }}>
      <Header title="見積登録（購入）個体登録及び金額按分" stepBadge="STEP 5" hideMenu showBackButton={false} />
      <StepProgressBar currentStep={5} />

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '16px' }}>

          {/* 上部バー: フィルタ + 金額サマリ */}
          <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #ddd' }}>
            <button
              onClick={() => setShowOnlyIndividual(!showOnlyIndividual)}
              style={{
                padding: '6px 14px', background: showOnlyIndividual ? '#27ae60' : '#e8f5e9',
                border: '1px solid #a5d6a7', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                color: showOnlyIndividual ? 'white' : '#2e7d32', cursor: 'pointer',
              }}
            >
              個体管理品目のみ表示
            </button>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#666' }}>合計金額（税抜）</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#27ae60', background: '#e8f5e9', padding: '4px 12px', borderRadius: '4px', fontVariantNumeric: 'tabular-nums' }}>
                  {totals.total.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px', fontVariantNumeric: 'tabular-nums' }}>
                <div>案分対象 <strong style={{ color: '#1565c0' }}>{totals.allocationTarget.toLocaleString()}</strong></div>
                <div>案分除外 <strong style={{ color: '#1565c0' }}>{totals.allocationExcluded.toLocaleString()}</strong></div>
                <div>差額 <strong style={{ color: totals.difference !== 0 ? '#e74c3c' : '#333' }}>{totals.difference.toLocaleString()}</strong></div>
              </div>
            </div>
          </div>

          {/* テーブル */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', minWidth: '1500px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                {/* 1段目ヘッダー */}
                <tr>
                  <th colSpan={3} style={{ padding: '6px', textAlign: 'center', borderBottom: '2px solid #333', background: '#e8f4fc', fontSize: '11px', fontWeight: 'bold', ...borderR }}>
                    STEP❸
                  </th>
                  <th colSpan={4} style={{ padding: '6px', textAlign: 'center', borderBottom: '2px solid #333', background: '#e8f4fc', fontSize: '11px', fontWeight: 'bold', ...borderR }}>
                    STEP❹ 個体管理品目登録
                  </th>
                  <th colSpan={4} style={{ padding: '6px', textAlign: 'center', borderBottom: '2px solid #333', background: '#e8f4fc', fontSize: '11px', fontWeight: 'bold', ...borderR }}>
                    価格情報（原本情報）
                  </th>
                  <th colSpan={8} style={{ padding: '6px', textAlign: 'center', borderBottom: '2px solid #9c27b0', background: '#f3e5f5', fontSize: '11px', fontWeight: 'bold', color: '#9c27b0' }}>
                    STEP❺ 個体登録／金額案分
                  </th>
                </tr>
                {/* 2段目ヘッダー */}
                <tr style={{ background: '#f8f9fa' }}>
                  {/* STEP3 */}
                  <th style={{ ...thBase, width: '30px', textAlign: 'center' }}>No</th>
                  <th style={{ ...thBase, width: '90px' }}>カテゴリ</th>
                  <th style={{ ...thBase, width: '55px', textAlign: 'center', ...borderR }}>明細区分</th>
                  {/* STEP4 */}
                  <th style={{ ...thBase, whiteSpace: 'nowrap' }}>個体管理品目</th>
                  <th style={{ ...thBase, width: '80px' }}>メーカー</th>
                  <th style={{ ...thBase, width: '100px' }}>型式（見積名称）</th>
                  <th style={{ ...thBase, width: '35px', textAlign: 'center', ...borderR }}>数量</th>
                  {/* 価格情報（原本） */}
                  <th style={{ ...thBase, width: '80px', textAlign: 'right' }}>定価単価</th>
                  <th style={{ ...thBase, width: '80px', textAlign: 'right' }}>定価金額</th>
                  <th style={{ ...thBase, width: '80px', textAlign: 'right' }}>購入単価<br />(税別)</th>
                  <th style={{ ...thBase, width: '80px', textAlign: 'right', ...borderR }}>購入金額<br />(税別)</th>
                  {/* STEP5 */}
                  <th style={{ ...thBase, width: '40px', textAlign: 'center', background: '#faf5fc' }}>単位</th>
                  <th style={{ ...thBase, width: '35px', textAlign: 'center', background: '#faf5fc' }}>親子<br />関</th>
                  <th style={{ ...thBase, width: '50px', textAlign: 'center', background: '#faf5fc' }}>価格案分<br />区分</th>
                  <th style={{ ...thBase, width: '70px', textAlign: 'center', background: '#fce4ec', color: '#c62828', fontWeight: 'bold' }}>差額金額<br />を案分</th>
                  <th style={{ ...thBase, width: '80px', textAlign: 'right', background: '#faf5fc' }}>定価金額</th>
                  <th style={{ ...thBase, width: '80px', textAlign: 'right', background: '#faf5fc' }}>購入金額<br />(税別)</th>
                  <th style={{ ...thBase, width: '45px', textAlign: 'center', background: '#faf5fc' }}>税区分</th>
                  <th style={{ ...thBase, width: '80px', textAlign: 'right', background: '#faf5fc' }}>購入金額<br />(税込)</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => {
                  const showOriginal = row.isFirstOfGroup;
                  const span = row.groupRowCount;
                  const clsLabel = row.detailClassification.replace('明細', '');

                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid #eee' }}>
                      {/* STEP3 (rowSpanで結合) */}
                      {showOriginal && (
                        <>
                          <td rowSpan={span} style={{ ...tdBase, textAlign: 'center', fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid #ddd' }}>{row.rowNo}</td>
                          <td rowSpan={span} style={{ ...tdBase, borderBottom: '1px solid #ddd' }}>{row.category}</td>
                          <td rowSpan={span} style={{ ...tdBase, textAlign: 'center', borderBottom: '1px solid #ddd', ...borderR }}>
                            {row.detailClassification && (
                              <span style={{ padding: '1px 5px', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold', color: 'white', background: classColor(row.detailClassification) }}>
                                {clsLabel}
                              </span>
                            )}
                          </td>
                        </>
                      )}
                      {/* STEP4 */}
                      <td style={{ ...tdBase, whiteSpace: 'nowrap' }}>{row.itemName}</td>
                      <td style={{ ...tdBase, color: '#555' }}>{row.manufacturer}</td>
                      <td style={{ ...tdBase, color: '#555' }}>{row.model}</td>
                      <td style={{ ...tdBase, textAlign: 'center', fontVariantNumeric: 'tabular-nums', ...borderR }}>{row.quantity || '-'}</td>
                      {/* 価格情報（原本）— rowSpan */}
                      {showOriginal && (
                        <>
                          <td rowSpan={span} style={{ ...tdBase, textAlign: 'right', fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid #ddd' }}>{fmtNum(row.listPriceUnit)}</td>
                          <td rowSpan={span} style={{ ...tdBase, textAlign: 'right', fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid #ddd' }}>{fmtNum(row.listPriceTotal)}</td>
                          <td rowSpan={span} style={{ ...tdBase, textAlign: 'right', fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid #ddd' }}>{fmtNum(row.purchasePriceUnit)}</td>
                          <td rowSpan={span} style={{ ...tdBase, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', borderBottom: '1px solid #ddd', ...borderR }}>{fmtNum(row.purchasePriceTotal)}</td>
                        </>
                      )}
                      {/* STEP5 */}
                      <td style={{ ...tdBase, textAlign: 'center', background: '#fdfaff' }}>
                        <select value={row.unit} onChange={e => handleFieldChange(row.id, 'unit', e.target.value)}
                          style={{ padding: '1px 2px', fontSize: '9px', border: '1px solid #ddd', borderRadius: '2px', width: '36px' }}>
                          {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td style={{ ...tdBase, textAlign: 'center', background: '#fdfaff', fontVariantNumeric: 'tabular-nums' }}>
                        <input type="text" value={row.seqId} onChange={e => handleFieldChange(row.id, 'seqId', e.target.value)}
                          style={{ width: '28px', padding: '1px 2px', fontSize: '9px', border: '1px solid #ddd', borderRadius: '2px', textAlign: 'center' }} />
                      </td>
                      <td style={{ ...tdBase, textAlign: 'center', background: '#fdfaff', fontSize: '9px' }}>
                        <select value={row.allocationCategory} onChange={e => handleFieldChange(row.id, 'allocationCategory', e.target.value)}
                          style={{ padding: '1px 2px', fontSize: '9px', border: '1px solid #ddd', borderRadius: '2px', width: '44px' }}>
                          <option value="対象">対象</option>
                          <option value="-">-</option>
                        </select>
                      </td>
                      <td style={{ ...tdBase, textAlign: 'right', background: '#fce4ec' }}>
                        <input type="text" value={row.differenceAllocation} onChange={e => handleFieldChange(row.id, 'differenceAllocation', e.target.value)}
                          style={{ width: '60px', padding: '1px 2px', fontSize: '9px', border: '1px solid #ddd', borderRadius: '2px', textAlign: 'right' }} />
                      </td>
                      <td style={{ ...tdBase, textAlign: 'right', background: '#fdfaff', fontVariantNumeric: 'tabular-nums' }}>
                        <input type="text" value={fmtNum(row.allocListPrice)} onChange={e => handleFieldChange(row.id, 'allocListPrice', parseInt(e.target.value.replace(/,/g, ''), 10) || 0)}
                          style={{ width: '68px', padding: '1px 2px', fontSize: '9px', border: '1px solid #ddd', borderRadius: '2px', textAlign: 'right' }} />
                      </td>
                      <td style={{ ...tdBase, textAlign: 'right', background: '#fdfaff', fontVariantNumeric: 'tabular-nums' }}>
                        <input type="text" value={fmtNum(row.allocPurchasePrice)} onChange={e => handleFieldChange(row.id, 'allocPurchasePrice', parseInt(e.target.value.replace(/,/g, ''), 10) || 0)}
                          style={{ width: '68px', padding: '1px 2px', fontSize: '9px', border: '1px solid #ddd', borderRadius: '2px', textAlign: 'right' }} />
                      </td>
                      <td style={{ ...tdBase, textAlign: 'center', background: '#fdfaff' }}>
                        <select value={row.taxCategory} onChange={e => handleFieldChange(row.id, 'taxCategory', e.target.value)}
                          style={{ padding: '1px 2px', fontSize: '9px', border: '1px solid #ddd', borderRadius: '2px', width: '42px' }}>
                          <option value="課税">課税</option>
                          <option value="非課税">非課税</option>
                        </select>
                      </td>
                      <td style={{ ...tdBase, textAlign: 'right', background: '#fdfaff', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold' }}>
                        <input type="text" value={fmtNum(row.allocPurchaseTaxIncl)} onChange={e => handleFieldChange(row.id, 'allocPurchaseTaxIncl', parseInt(e.target.value.replace(/,/g, ''), 10) || 0)}
                          style={{ width: '68px', padding: '1px 2px', fontSize: '9px', border: '1px solid #ddd', borderRadius: '2px', textAlign: 'right', fontWeight: 'bold' }} />
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
          <button onClick={() => router.push('/quotation-data-box/item-ai-matching')}
            style={{ padding: '12px 28px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
            一つ前のSTEPに戻る
          </button>
          <button onClick={() => router.push('/quotation-data-box/registration-confirm')}
            style={{ padding: '12px 28px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
            登録確認
          </button>
        </div>
      </div>
    </div>
  );
}
