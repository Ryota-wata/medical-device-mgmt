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

// 基本情報
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

// 行データ
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
  const classColor = (cls: DetailClassification) => {
    if (cls === '親明細') return '#e74c3c';
    if (cls === '子明細') return '#2196f3';
    if (cls === '孫明細') return '#9c27b0';
    if (cls === '明細代表') return '#666';
    return '#888';
  };

  const thBase: React.CSSProperties = { padding: '5px', borderBottom: '1px solid #dee2e6', fontSize: '10px', whiteSpace: 'nowrap' };
  const tdBase: React.CSSProperties = { padding: '4px 5px', fontSize: '10px', verticalAlign: 'top' };
  const borderR: React.CSSProperties = { borderRight: '1px solid #ccc' };
  const inputStyle: React.CSSProperties = { width: '100%', fontSize: '10px', padding: '3px 4px', border: '1px solid #ccc', borderRadius: '2px', boxSizing: 'border-box' as const };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f5f5f5' }}>
      <Header title="見積登録（購入）登録確認へ" stepBadge="STEP 6" hideMenu showBackButton={false} />
      <StepProgressBar currentStep={6} />

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* 確認メッセージ */}
        <div style={{ padding: '12px 16px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', color: '#856404', fontWeight: 'bold' }}>
          下記の内容で見積Databaseへ登録を実施します。
        </div>

        {/* 基本情報 */}
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '16px' }}>
          <div style={{ padding: '8px 16px', background: '#6c757d', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>基本情報</div>
          <div style={{ padding: '12px 16px' }}>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', width: '100px', border: '1px solid #dee2e6' }}>見積日付</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6', width: '120px' }}>{basicInfo.quotationDate}</td>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', width: '100px', border: '1px solid #dee2e6' }}>見積フェーズ</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6', width: '80px' }}>{basicInfo.quotationPhase}</td>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', width: '120px', border: '1px solid #dee2e6' }}>見積依頼G名称</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6' }} colSpan={3}>{basicInfo.rfqGroupName}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', border: '1px solid #dee2e6' }}>見積依頼No.</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6' }}>{basicInfo.rfqNo}</td>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', border: '1px solid #dee2e6' }}>宛先（施設名）</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6' }} colSpan={5}>{basicInfo.facilityName}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', border: '1px solid #dee2e6' }}>業者・メーカー</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6' }}>{basicInfo.vendorName}</td>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', border: '1px solid #dee2e6' }}>連絡先</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6' }}>{basicInfo.contact}</td>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', border: '1px solid #dee2e6' }}>mail</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6' }} colSpan={3}>{basicInfo.mail}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', border: '1px solid #dee2e6' }}>納期</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6' }}>{basicInfo.deliveryPeriod}</td>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', border: '1px solid #dee2e6' }}>見積有効期限</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6' }}>{basicInfo.validityPeriod}</td>
                  <td style={{ padding: '4px 8px', background: '#f8f9fa', fontWeight: 'bold', border: '1px solid #dee2e6' }}>インボイス</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #dee2e6' }} colSpan={3}>{basicInfo.invoiceNo}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 登録明細確認 */}
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '16px' }}>
          {/* 上部バー */}
          <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #ddd' }}>
            <button onClick={() => setShowOnlyIndividual(!showOnlyIndividual)}
              style={{ padding: '6px 14px', background: showOnlyIndividual ? '#27ae60' : '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', color: showOnlyIndividual ? 'white' : '#2e7d32', cursor: 'pointer' }}>
              個体管理品目のみ表示
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#666' }}>合計金額（税抜）</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#27ae60', background: '#e8f5e9', padding: '4px 12px', borderRadius: '4px', fontVariantNumeric: 'tabular-nums' }}>
                ¥{totalAmount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* テーブル */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', minWidth: '1400px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr>
                  <th colSpan={3} style={{ padding: '6px', textAlign: 'center', borderBottom: '2px solid #333', background: '#e8f4fc', fontSize: '11px', fontWeight: 'bold', ...borderR }}>STEP❸</th>
                  <th colSpan={3} style={{ padding: '6px', textAlign: 'center', borderBottom: '2px solid #333', background: '#e8f4fc', fontSize: '11px', fontWeight: 'bold', ...borderR }}>STEP❹ 個体管理品目</th>
                  <th colSpan={5} style={{ padding: '6px', textAlign: 'center', borderBottom: '2px solid #333', background: '#e8f4fc', fontSize: '11px', fontWeight: 'bold', ...borderR }}>STEP❺ 個体登録／金額案分</th>
                  <th colSpan={4} style={{ padding: '6px', textAlign: 'center', borderBottom: '2px solid #9c27b0', background: '#f3e5f5', fontSize: '11px', fontWeight: 'bold', color: '#9c27b0' }}>STEP❻ 設置情報</th>
                </tr>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ ...thBase, width: '30px', textAlign: 'center' }}>No</th>
                  <th style={{ ...thBase, width: '90px' }}>カテゴリ</th>
                  <th style={{ ...thBase, width: '55px', textAlign: 'center', ...borderR }}>明細区分</th>
                  <th style={{ ...thBase, whiteSpace: 'nowrap' }}>個体管理品目</th>
                  <th style={{ ...thBase, width: '80px' }}>メーカー</th>
                  <th style={{ ...thBase, width: '100px', ...borderR }}>型式（見積名称）</th>
                  <th style={{ ...thBase, width: '35px', textAlign: 'center' }}>数量</th>
                  <th style={{ ...thBase, width: '30px', textAlign: 'center' }}>単位</th>
                  <th style={{ ...thBase, width: '35px', textAlign: 'center' }}>親子<br />関</th>
                  <th style={{ ...thBase, width: '80px', textAlign: 'right' }}>定価金額</th>
                  <th style={{ ...thBase, width: '80px', textAlign: 'right', ...borderR }}>購入金額<br />(税別)</th>
                  <th style={{ ...thBase, width: '100px', background: '#faf5fc' }}>部門</th>
                  <th style={{ ...thBase, width: '100px', background: '#faf5fc' }}>部署</th>
                  <th style={{ ...thBase, width: '100px', background: '#faf5fc' }}>室名</th>
                  <th style={{ ...thBase, width: '100px', background: '#faf5fc' }}>管理部署</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => {
                  const showOriginal = row.isFirstOfGroup;
                  const span = row.groupRowCount;
                  const clsLabel = row.detailClassification.replace('明細', '');

                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid #eee' }}>
                      {showOriginal && (
                        <>
                          <td rowSpan={span} style={{ ...tdBase, textAlign: 'center', fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid #ddd' }}>{row.rowNo}</td>
                          <td rowSpan={span} style={{ ...tdBase, borderBottom: '1px solid #ddd' }}>{row.category}</td>
                          <td rowSpan={span} style={{ ...tdBase, textAlign: 'center', borderBottom: '1px solid #ddd', ...borderR }}>
                            {row.detailClassification && (
                              <span style={{ padding: '1px 5px', borderRadius: '3px', fontSize: '9px', fontWeight: 'bold', color: 'white', background: classColor(row.detailClassification) }}>{clsLabel}</span>
                            )}
                          </td>
                        </>
                      )}
                      <td style={{ ...tdBase, whiteSpace: 'nowrap' }}>{row.itemName}</td>
                      <td style={{ ...tdBase, color: '#555' }}>{row.manufacturer}</td>
                      <td style={{ ...tdBase, color: '#555', ...borderR }}>{row.model}</td>
                      <td style={{ ...tdBase, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.quantity || '-'}</td>
                      <td style={{ ...tdBase, textAlign: 'center' }}>{row.unit}</td>
                      <td style={{ ...tdBase, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.seqId}</td>
                      {showOriginal && (
                        <>
                          <td rowSpan={span} style={{ ...tdBase, textAlign: 'right', fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid #ddd' }}>{fmtNum(row.listPriceTotal)}</td>
                          <td rowSpan={span} style={{ ...tdBase, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 'bold', borderBottom: '1px solid #ddd', ...borderR }}>{fmtNum(row.purchasePriceTotal)}</td>
                        </>
                      )}
                      <td style={{ ...tdBase, background: '#fdfaff' }}>
                        <input type="text" value={row.department} onChange={e => handleLocationChange(row.id, 'department', e.target.value)} style={inputStyle} />
                      </td>
                      <td style={{ ...tdBase, background: '#fdfaff' }}>
                        <input type="text" value={row.section} onChange={e => handleLocationChange(row.id, 'section', e.target.value)} style={inputStyle} />
                      </td>
                      <td style={{ ...tdBase, background: '#fdfaff' }}>
                        <input type="text" value={row.roomName} onChange={e => handleLocationChange(row.id, 'roomName', e.target.value)} style={inputStyle} />
                      </td>
                      <td style={{ ...tdBase, background: '#fdfaff' }}>
                        <input type="text" value={row.managingSection} onChange={e => handleLocationChange(row.id, 'managingSection', e.target.value)} style={inputStyle} />
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
          <button onClick={() => router.push('/quotation-data-box/price-allocation')}
            style={{ padding: '12px 28px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
            一つ前のSTEPに戻る
          </button>
          <button onClick={handleRegister}
            style={{ padding: '12px 28px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
            見積情報Databaseに登録
          </button>
        </div>
      </div>
    </div>
  );
}
