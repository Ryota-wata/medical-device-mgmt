'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { StepProgressBar } from '../components/StepProgressBar';
import { useQuotationStore } from '@/lib/stores/quotationStore';
import { QuotationItemType } from '@/lib/types/quotation';
import { customerStep6Items } from '@/lib/data/customer/step6-confirm';
import { customerStep4Items } from '@/lib/data/customer/step4-asset-master';

type DetailClassification = '明細代表' | '内訳代表' | '親明細' | '子明細' | '孫明細' | 'その他' | '値引き' | '';

const classMap: Record<string, DetailClassification> = {
  '代表明細': '明細代表', '親': '親明細', '子': '子明細', '孫': '孫明細',
  'その他': 'その他', '文字列': 'その他', '値引き': '値引き',
};

interface BasicInfo {
  quotationPhase: string; rfqNo: string; rfqGroupName: string; facilityName: string;
  vendorName: string; contact: string; mail: string;
  quotationDate: string; invoiceNo: string; deliveryPeriod: string; validityPeriod: string;
}
const testBasicInfo: BasicInfo = {
  quotationPhase: '定価', rfqNo: 'RFQ-20250119-0001', rfqGroupName: '2025年度放射線科機器更新',
  facilityName: '医療法人○○会 ○○病院', vendorName: 'GEヘルスケア・ジャパン',
  contact: '03-1234-5678', mail: 'info@example.com',
  quotationDate: '2026/01/15', invoiceNo: 'T1234567890123',
  deliveryPeriod: '2026/03/31', validityPeriod: '2026/02/28',
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
  unit: string;
  seqId: string;
  listPriceTotal: number;
  purchasePriceTotal: number;
  department: string;
  section: string;
  roomName: string;
  managingSection: string;
  isFirstOfGroup: boolean;
  groupRowCount: number;
}

function buildRows(): Row[] {
  const rows: Row[] = [];
  let seqCounter = 1;
  for (const item of customerStep6Items) {
    const cls = (classMap[item.itemType] || '') as DetailClassification;
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
        unit: item.unit || '台',
        seqId: isParent ? String(seqCounter++) : (cls === '子明細' || cls === '孫明細') ? '-' : '',
        listPriceTotal: item.listPriceTotal || 0,
        purchasePriceTotal: item.purchasePriceTotal || 0,
        department: item.department || '',
        section: item.section || '',
        roomName: item.roomName || '',
        managingSection: item.managementDepartment || '',
        isFirstOfGroup: i === 0,
        groupRowCount: expandCount,
      });
    }
  }
  return rows;
}

const detailClassificationToItemType = (c: DetailClassification): QuotationItemType => {
  const m: Record<string, QuotationItemType> = { '明細代表': 'B_明細代表', '親明細': 'C_個体管理品目', '子明細': 'D_付属品', 'その他': 'E_その他役務', '値引き': 'F_値引き' };
  return m[c] || 'C_個体管理品目';
};

const classLabelStyleMap: Record<DetailClassification, string> = {
  '親明細': 'bg-content-alert text-white',
  '子明細': 'bg-content-link text-white',
  '孫明細': 'bg-content-primary text-white',
  '明細代表': 'bg-content-sub text-white',
  '内訳代表': 'bg-content-sub text-white',
  'その他': 'bg-content-sub text-white',
  '値引き': 'bg-content-sub text-white',
  '': '',
};

export default function RegistrationConfirmPage() {
  const router = useRouter();
  const { addQuotationGroup, addQuotationItems, generateReceivedQuotationNo } = useQuotationStore();
  const [basicInfo] = useState<BasicInfo>(testBasicInfo);
  const [rows, setRows] = useState<Row[]>(buildRows);
  const [showOnlyIndividual, setShowOnlyIndividual] = useState(false);

  const displayRows = useMemo(() => {
    if (showOnlyIndividual) return rows.filter(r => r.detailClassification === '親明細' || r.detailClassification === '子明細');
    return rows;
  }, [rows, showOnlyIndividual]);

  const totalAmount = useMemo(() => {
    const seen = new Set<number>();
    let total = 0;
    for (const r of rows) {
      if (r.isFirstOfGroup && !seen.has(r.rowNo)) { seen.add(r.rowNo); total += r.purchasePriceTotal; }
    }
    return total;
  }, [rows]);

  const handleLocationChange = (id: string, field: 'department' | 'section' | 'roomName' | 'managingSection', value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleRegister = () => {
    if (confirm('見積情報をDatabaseに登録します。よろしいですか？')) {
      const quotationNo = generateReceivedQuotationNo();
      const groupId = addQuotationGroup({
        receivedQuotationNo: quotationNo, rfqNo: basicInfo.rfqNo, vendorName: basicInfo.vendorName,
        vendorContact: basicInfo.contact, vendorEmail: basicInfo.mail, quotationDate: basicInfo.quotationDate,
        validityPeriod: 1, deliveryPeriod: 3, phase: basicInfo.quotationPhase === '定価' ? '定価見積' : '確定見積',
        totalAmount,
      });
      const itemsToAdd = rows.map(r => ({
        quotationGroupId: groupId, receivedQuotationNo: quotationNo, rowNo: r.rowNo,
        originalItemName: r.itemName, originalManufacturer: r.manufacturer, originalModel: r.model,
        originalQuantity: r.quantity, itemType: detailClassificationToItemType(r.detailClassification),
        category: r.category, itemName: r.itemName, manufacturer: r.manufacturer, model: r.model,
        aiQuantity: 1, unit: r.unit, seqId: r.seqId || undefined, linkedApplicationIds: [],
      }));
      addQuotationItems(itemsToAdd);
      alert(`登録が完了しました（見積番号: ${quotationNo}）`);
      router.push('/quotation-data-box/purchase-management');
    }
  };

  const fmtNum = (n: number) => n ? n.toLocaleString() : '';

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Header title="見積登録（購入）登録確認へ" stepBadge="STEP 6" hideMenu showBackButton={false} />
      <StepProgressBar currentStep={6} />

      <div className="flex-1 overflow-auto p-4">
        {/* 確認メッセージ */}
        <div className="px-4 py-3 bg-surface-select border border-cta-primary rounded-lg mb-4 text-sm text-cta-primary-dark font-bold">
          下記の内容で見積Databaseへ登録を実施します。
        </div>

        {/* 基本情報 */}
        <section className="bg-surface-card border border-stroke-input rounded-lg mb-4 overflow-hidden">
          <div className="px-4 py-2 bg-content-sub text-white text-xs font-bold">基本情報</div>
          <div className="p-4">
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr>
                  <th className="px-2 py-1 bg-surface-screen text-content-primary font-bold border border-stroke-input text-left w-[100px]">見積日付</th>
                  <td className="px-2 py-1 border border-stroke-input w-[120px] tabular-nums">{basicInfo.quotationDate}</td>
                  <th className="px-2 py-1 bg-surface-screen text-content-primary font-bold border border-stroke-input text-left w-[100px]">見積フェーズ</th>
                  <td className="px-2 py-1 border border-stroke-input w-[80px]">{basicInfo.quotationPhase}</td>
                  <th className="px-2 py-1 bg-surface-screen text-content-primary font-bold border border-stroke-input text-left w-[120px]">見積依頼G名称</th>
                  <td className="px-2 py-1 border border-stroke-input" colSpan={3}>{basicInfo.rfqGroupName}</td>
                </tr>
                <tr>
                  <th className="px-2 py-1 bg-surface-screen text-content-primary font-bold border border-stroke-input text-left">見積依頼No.</th>
                  <td className="px-2 py-1 border border-stroke-input">{basicInfo.rfqNo}</td>
                  <th className="px-2 py-1 bg-surface-screen text-content-primary font-bold border border-stroke-input text-left">宛先（施設名）</th>
                  <td className="px-2 py-1 border border-stroke-input" colSpan={5}>{basicInfo.facilityName}</td>
                </tr>
                <tr>
                  <th className="px-2 py-1 bg-surface-screen text-content-primary font-bold border border-stroke-input text-left">業者・メーカー</th>
                  <td className="px-2 py-1 border border-stroke-input">{basicInfo.vendorName}</td>
                  <th className="px-2 py-1 bg-surface-screen text-content-primary font-bold border border-stroke-input text-left">連絡先</th>
                  <td className="px-2 py-1 border border-stroke-input tabular-nums">{basicInfo.contact}</td>
                  <th className="px-2 py-1 bg-surface-screen text-content-primary font-bold border border-stroke-input text-left">mail</th>
                  <td className="px-2 py-1 border border-stroke-input" colSpan={3}>{basicInfo.mail}</td>
                </tr>
                <tr>
                  <th className="px-2 py-1 bg-surface-screen text-content-primary font-bold border border-stroke-input text-left">納期</th>
                  <td className="px-2 py-1 border border-stroke-input tabular-nums">{basicInfo.deliveryPeriod}</td>
                  <th className="px-2 py-1 bg-surface-screen text-content-primary font-bold border border-stroke-input text-left">見積有効期限</th>
                  <td className="px-2 py-1 border border-stroke-input tabular-nums">{basicInfo.validityPeriod}</td>
                  <th className="px-2 py-1 bg-surface-screen text-content-primary font-bold border border-stroke-input text-left">インボイス</th>
                  <td className="px-2 py-1 border border-stroke-input" colSpan={3}>{basicInfo.invoiceNo}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 登録明細確認 */}
        <section className="bg-surface-card border border-stroke-input rounded-lg mb-4">
          {/* 上部バー */}
          <div className="px-4 py-3 flex justify-between items-center flex-wrap gap-3 border-b border-stroke-input">
            <button
              onClick={() => setShowOnlyIndividual(!showOnlyIndividual)}
              className={`px-3.5 py-1.5 border rounded-md text-xs font-bold cursor-pointer transition-colors ${
                showOnlyIndividual
                  ? 'bg-cta-primary text-white border-cta-primary hover:bg-cta-primary-dark'
                  : 'bg-surface-select text-cta-primary-dark border-cta-primary hover:bg-stroke-card'
              }`}
            >
              個体管理品目のみ表示
            </button>
            <div className="text-center">
              <div className="text-[10px] text-content-sub">合計金額（税抜）</div>
              <div className="text-base font-bold text-cta-primary bg-surface-select px-3 py-1 rounded-md tabular-nums">
                ¥{totalAmount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* テーブル */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[10px] min-w-[1400px]">
              <thead className="sticky top-0 z-[2]">
                <tr>
                  <th colSpan={3} className="px-1.5 py-1.5 text-center border-b-2 border-content-primary bg-stroke-card text-xs font-bold text-content-primary border-r border-stroke-input">STEP❸</th>
                  <th colSpan={3} className="px-1.5 py-1.5 text-center border-b-2 border-content-primary bg-stroke-card text-xs font-bold text-content-primary border-r border-stroke-input">STEP❹ 個体管理品目</th>
                  <th colSpan={5} className="px-1.5 py-1.5 text-center border-b-2 border-content-primary bg-stroke-card text-xs font-bold text-content-primary border-r border-stroke-input">STEP❺ 個体登録／金額案分</th>
                  <th colSpan={4} className="px-1.5 py-1.5 text-center border-b-2 border-content-primary bg-surface-select text-xs font-bold text-cta-primary-dark">STEP❻ 設置情報</th>
                </tr>
                <tr className="bg-surface-screen">
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[30px] text-center font-normal text-content-primary">No</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[90px] text-left font-normal text-content-primary">カテゴリ</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[55px] text-center font-normal text-content-primary border-r border-stroke-input">明細区分</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap text-left font-normal text-content-primary">個体管理品目</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[80px] text-left font-normal text-content-primary">メーカー</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[100px] text-left font-normal text-content-primary border-r border-stroke-input">型式（見積名称）</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[35px] text-center font-normal text-content-primary">数量</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[30px] text-center font-normal text-content-primary">単位</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[35px] text-center font-normal text-content-primary">親子<br />関</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[80px] text-right font-normal text-content-primary">定価金額</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[80px] text-right font-normal text-content-primary border-r border-stroke-input">購入金額<br />(税別)</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[100px] text-left font-normal text-content-primary bg-surface-select">部門</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[100px] text-left font-normal text-content-primary bg-surface-select">部署</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[100px] text-left font-normal text-content-primary bg-surface-select">室名</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[100px] text-left font-normal text-content-primary bg-surface-select">管理部署</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => {
                  const showOriginal = row.isFirstOfGroup;
                  const span = row.groupRowCount;
                  const clsLabel = row.detailClassification.replace('明細', '');

                  return (
                    <tr key={row.id} className="border-b border-stroke-card">
                      {showOriginal && (
                        <>
                          <td rowSpan={span} className="px-1.5 py-1 text-center tabular-nums align-top border-b border-stroke-input text-content-primary">{row.rowNo}</td>
                          <td rowSpan={span} className="px-1.5 py-1 align-top border-b border-stroke-input text-content-primary">{row.category}</td>
                          <td rowSpan={span} className="px-1.5 py-1 text-center align-top border-b border-stroke-input border-r border-stroke-input">
                            {row.detailClassification && (
                              <span className={`inline-block px-1.5 py-px rounded text-[9px] font-bold ${classLabelStyleMap[row.detailClassification]}`}>{clsLabel}</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-1.5 py-1 whitespace-nowrap align-top text-content-primary">{row.itemName}</td>
                      <td className="px-1.5 py-1 align-top text-content-primary">{row.manufacturer}</td>
                      <td className="px-1.5 py-1 align-top border-r border-stroke-input text-content-primary">{row.model}</td>
                      <td className="px-1.5 py-1 text-center tabular-nums align-top text-content-primary">{row.quantity || '-'}</td>
                      <td className="px-1.5 py-1 text-center align-top text-content-primary">{row.unit}</td>
                      <td className="px-1.5 py-1 text-center tabular-nums align-top text-content-primary">{row.seqId}</td>
                      {showOriginal && (
                        <>
                          <td rowSpan={span} className="px-1.5 py-1 text-right tabular-nums align-top border-b border-stroke-input text-content-primary">{fmtNum(row.listPriceTotal)}</td>
                          <td rowSpan={span} className="px-1.5 py-1 text-right tabular-nums align-top border-b border-stroke-input border-r border-stroke-input font-bold text-content-primary">{fmtNum(row.purchasePriceTotal)}</td>
                        </>
                      )}
                      <td className="px-1.5 py-1 align-top bg-surface-select">
                        <input type="text" value={row.department} onChange={e => handleLocationChange(row.id, 'department', e.target.value)} className="w-full text-[10px] px-1 py-0.5 border border-stroke-input rounded-sm bg-surface-card box-border focus:outline-none focus:border-cta-primary" />
                      </td>
                      <td className="px-1.5 py-1 align-top bg-surface-select">
                        <input type="text" value={row.section} onChange={e => handleLocationChange(row.id, 'section', e.target.value)} className="w-full text-[10px] px-1 py-0.5 border border-stroke-input rounded-sm bg-surface-card box-border focus:outline-none focus:border-cta-primary" />
                      </td>
                      <td className="px-1.5 py-1 align-top bg-surface-select">
                        <input type="text" value={row.roomName} onChange={e => handleLocationChange(row.id, 'roomName', e.target.value)} className="w-full text-[10px] px-1 py-0.5 border border-stroke-input rounded-sm bg-surface-card box-border focus:outline-none focus:border-cta-primary" />
                      </td>
                      <td className="px-1.5 py-1 align-top bg-surface-select">
                        <input type="text" value={row.managingSection} onChange={e => handleLocationChange(row.id, 'managingSection', e.target.value)} className="w-full text-[10px] px-1 py-0.5 border border-stroke-input rounded-sm bg-surface-card box-border focus:outline-none focus:border-cta-primary" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* フッターボタン */}
        <div className="flex gap-3 justify-between mt-4">
          <button
            onClick={() => router.push('/quotation-data-box/price-allocation')}
            className="h-12 px-7 bg-surface-negative text-content-primary border-0 rounded-lg cursor-pointer text-sm font-bold hover:bg-stroke-input transition-colors"
          >
            一つ前のSTEPに戻る
          </button>
          <button
            onClick={handleRegister}
            className="h-12 px-7 bg-cta-primary text-white border-0 rounded-lg cursor-pointer text-sm font-bold hover:bg-cta-primary-dark transition-colors"
          >
            見積情報Databaseに登録
          </button>
        </div>
      </div>
    </div>
  );
}
