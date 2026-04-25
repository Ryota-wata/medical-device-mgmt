'use client';

import React, { useMemo, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { StepProgressBar } from '../components/StepProgressBar';
// 会計区分の型
type AccountingCategoryType = '医療機器' | '什器備品' | '情報システム' | '消耗品' | '保守' | '';

// 前画面からの入力データ（入力済み - 固定表示）
interface PreviousInputData {
  quotationPhase: string;       // 見積フェーズ
  rfqNo: string;                // 見積依頼No.
  rfqGroupName: string;         // 見積依頼G名称
  facilityName: string;         // 宛先（施設名）
  vendorName: string;           // 業者・メーカー（業者名）
}

// OCR読み取り結果データ（編集可能）
interface OcrResultData {
  quotationDate: string;        // 見積日付
  deliveryPeriod: string;       // 納期
  validityPeriod: string;       // 見積有効期限
}

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
  accountingCategory: AccountingCategoryType; // 会計区分(category) - 次STEPで使用
  categoryType?: string;      // フィルター用カテゴリ - 次STEPで使用
}

import { customerStep2Items } from '@/lib/data/customer/step2-ocr';

// 顧客サンプルデータから変換（再取り込み: node docs/customer-sample-data/convert.mjs）
const testDetailItems: DetailItem[] = customerStep2Items.map((item, i) => ({
  id: i + 1,
  itemName: item.itemName,
  manufacturer: item.manufacturer,
  model: item.model,
  quantity: item.quantity || null,
  listUnitPrice: item.listPriceUnit || null,
  listPrice: item.listPriceTotal || null,
  purchaseUnitPrice: item.purchasePriceUnit || null,
  purchaseAmount: item.purchasePriceTotal || null,
  accountingCategory: '医療機器' as AccountingCategoryType,
  categoryType: '有形資産',
}));

export default function OcrConfirmPage() {
  const router = useRouter();

  // 前画面からの入力データ（入力済み - 固定表示）
  const [previousInput] = useState<PreviousInputData>({
    quotationPhase: '定価',
    rfqNo: 'RFQ-20250119-0001',
    rfqGroupName: '2025年度放射線科機器更新',
    facilityName: '医療法人○○会 ○○病院',
    vendorName: 'GEヘルスケア・ジャパン',
  });

  // OCR読み取り結果データ（編集可能）
  const [ocrResult, setOcrResult] = useState<OcrResultData>({
    quotationDate: '2025/01/15',
    deliveryPeriod: '3',
    validityPeriod: '1',
  });

  // 明細データ
  const [detailItems, setDetailItems] = useState<DetailItem[]>(testDetailItems);

  // 合計金額（税抜）- 編集可能
  const [totalAmountInput, setTotalAmountInput] = useState<string>(() => {
    const total = testDetailItems.reduce((sum, item) => sum + (item.purchaseAmount || 0), 0);
    return total.toLocaleString();
  });

  // パネル幅の状態（左パネルの幅をパーセントで管理）
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(55);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  // ドラッグハンドラ
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    // 最小20%、最大80%に制限
    setLeftPanelWidth(Math.min(80, Math.max(20, newWidth)));
  }, []);

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  }, [handleDragMove]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  }, [handleDragMove, handleDragEnd]);

  // 合計金額計算（税抜）
  const totalAmount = useMemo(() => {
    return detailItems.reduce((sum, item) => sum + (item.purchaseAmount || 0), 0);
  }, [detailItems]);

  // OCR結果の更新
  const handleOcrResultChange = (field: keyof OcrResultData, value: string) => {
    setOcrResult(prev => ({ ...prev, [field]: value }));
  };

  // 明細の更新
  const handleDetailChange = (index: number, field: keyof DetailItem, value: string | number) => {
    setDetailItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Excel取込（モック）
  const handleExcelImport = () => {
    alert('Excel取込機能は今後実装予定です。\nOCR結果の明細データをExcelファイルで差し替えます。');
  };

  // 戻るボタン
  const handleBack = () => {
    router.push('/quotation-data-box');
  };

  // 登録区分のAI判定へ
  const handleAiJudgment = () => {
    router.push('/quotation-data-box/category-registration');
  };

  // セルスタイル
  const cellStyle: React.CSSProperties = {
    padding: '8px 10px',
    border: '1px solid #ddd',
    fontSize: '12px',
    verticalAlign: 'middle',
  };

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    background: '#4a6fa5',
    color: 'white',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    width: '100px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    fontSize: '12px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f5f5f5' }}>
      <Header
        title="見積登録（購入）OCR明細確認"
        stepBadge="STEP 2"
        hideMenu={true}
        showBackButton={false}
      />
      <StepProgressBar currentStep={2} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px' }}>
        {/* メインコンテンツ */}
        <div ref={containerRef} style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
          {/* 左側: 情報入力エリア（基本情報 + 見積明細チェック） */}
          <div style={{
            width: `${leftPanelWidth}%`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}>
            {/* 基本情報セクション */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              borderBottom: '1px solid #ddd',
            }}>
              {/* 基本情報ヘッダー */}
              <div style={{ display: 'flex', borderBottom: '1px solid #ddd' }}>
                <div
                  style={{
                    padding: '12px 28px',
                    background: '#4a6fa5',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  基本情報
                </div>
              </div>

              {/* 基本情報コンテンツ */}
              <div style={{ padding: '16px' }}>
                {/* 基本情報テーブル */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {/* 行1: 見積日付 / 見積フェーズ */}
                    <tr>
                      <th style={headerCellStyle}>見積日付</th>
                      <td style={cellStyle}>
                        <input
                          type="text"
                          placeholder="yyyy/mm/dd"
                          value={ocrResult.quotationDate}
                          onChange={(e) => handleOcrResultChange('quotationDate', e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                      <th style={headerCellStyle}>見積フェーズ</th>
                      <td style={cellStyle} colSpan={2}>
                        <span style={{ padding: '6px 8px', display: 'inline-block' }}>{previousInput.quotationPhase}</span>
                      </td>
                    </tr>
                    {/* 行2: 宛先 */}
                    <tr>
                      <th style={headerCellStyle}>宛先</th>
                      <td style={cellStyle} colSpan={4}>
                        <span style={{ padding: '6px 8px', display: 'inline-block' }}>{previousInput.facilityName}</span>
                      </td>
                    </tr>
                    {/* 行3: 見積依頼No. / 見積依頼G名称 */}
                    <tr>
                      <th style={headerCellStyle}>見積依頼No.</th>
                      <td style={cellStyle}>
                        <span style={{ padding: '6px 8px', display: 'inline-block' }}>{previousInput.rfqNo}</span>
                      </td>
                      <th style={headerCellStyle}>見積依頼G名称</th>
                      <td style={cellStyle} colSpan={2}>
                        <span style={{ padding: '6px 8px', display: 'inline-block' }}>{previousInput.rfqGroupName}</span>
                      </td>
                    </tr>
                    {/* 行4: 業者・メーカー */}
                    <tr>
                      <th style={headerCellStyle}>業者・メーカー</th>
                      <td style={cellStyle} colSpan={4}>
                        <span style={{ padding: '6px 8px', display: 'inline-block' }}>{previousInput.vendorName}</span>
                      </td>
                    </tr>
                    {/* 行5: 納期 / 見積有効期限 */}
                    <tr>
                      <th style={headerCellStyle}>納期</th>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="text"
                            value={ocrResult.deliveryPeriod}
                            onChange={(e) => handleOcrResultChange('deliveryPeriod', e.target.value)}
                            style={{ ...inputStyle, width: '60px' }}
                          />
                          <span>ヶ月</span>
                        </div>
                      </td>
                      <th style={headerCellStyle}>見積有効期限</th>
                      <td style={cellStyle} colSpan={2}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="text"
                            value={ocrResult.validityPeriod}
                            onChange={(e) => handleOcrResultChange('validityPeriod', e.target.value)}
                            style={{ ...inputStyle, width: '60px' }}
                          />
                          <span>ヶ月</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 見積明細チェックセクション */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            }}>
            {/* 見積明細チェックヘッダー */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ddd', alignItems: 'center' }}>
              <div
                style={{
                  padding: '12px 28px',
                  background: '#4a6fa5',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                見積明細チェック
              </div>
              <div style={{ flex: 1 }}></div>
              {/* 合計金額（税抜）- 編集可能 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>合計金額（税抜）</span>
                <input
                  type="text"
                  value={totalAmountInput}
                  onChange={(e) => setTotalAmountInput(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    width: '150px',
                    textAlign: 'right',
                    background: '#fff9c4',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                />
              </div>
            </div>

            {/* 明細テーブル */}
            <div style={{ padding: '16px' }}>
              <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '900px' }}>
                  <thead style={{ position: 'sticky', top: 0 }}>
                    {/* グループヘッダー行 */}
                    <tr>
                      <th rowSpan={2} style={{ padding: '6px', textAlign: 'center', background: '#4a6fa5', color: 'white', border: '1px solid #3d5a80', width: '40px' }}>No.</th>
                      <th colSpan={4} style={{ padding: '6px', textAlign: 'center', background: '#4a6fa5', color: 'white', border: '1px solid #3d5a80' }}>商品情報（原本情報）</th>
                      <th colSpan={4} style={{ padding: '6px', textAlign: 'center', background: '#6b8cae', color: 'white', border: '1px solid #3d5a80' }}>価格情報（原本情報）</th>
                    </tr>
                    {/* カラムヘッダー行 */}
                    <tr>
                      <th style={{ padding: '6px', textAlign: 'left', background: '#5a7a9a', color: 'white', border: '1px solid #3d5a80', whiteSpace: 'nowrap' }}>品名（見積名称）</th>
                      <th style={{ padding: '6px', textAlign: 'left', background: '#5a7a9a', color: 'white', border: '1px solid #3d5a80', whiteSpace: 'nowrap' }}>メーカー</th>
                      <th style={{ padding: '6px', textAlign: 'left', background: '#5a7a9a', color: 'white', border: '1px solid #3d5a80', whiteSpace: 'nowrap' }}>型式（見積名称）</th>
                      <th style={{ padding: '6px', textAlign: 'center', background: '#5a7a9a', color: 'white', border: '1px solid #3d5a80', whiteSpace: 'nowrap', width: '50px' }}>数量</th>
                      <th style={{ padding: '6px', textAlign: 'right', background: '#7a9cb8', color: 'white', border: '1px solid #3d5a80', whiteSpace: 'nowrap' }}>定価単価</th>
                      <th style={{ padding: '6px', textAlign: 'right', background: '#7a9cb8', color: 'white', border: '1px solid #3d5a80', whiteSpace: 'nowrap' }}>定価金額</th>
                      <th style={{ padding: '6px', textAlign: 'right', background: '#7a9cb8', color: 'white', border: '1px solid #3d5a80', whiteSpace: 'nowrap' }}>購入単価</th>
                      <th style={{ padding: '6px', textAlign: 'right', background: '#7a9cb8', color: 'white', border: '1px solid #3d5a80', whiteSpace: 'nowrap' }}>購入金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailItems.map((item, index) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '4px 6px', textAlign: 'center', background: '#f8f9fa', border: '1px solid #ddd' }}>{item.id}</td>
                        <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}>
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) => handleDetailChange(index, 'itemName', e.target.value)}
                            style={{ width: '100%', padding: '3px 5px', border: '1px solid #ddd', borderRadius: '2px', fontSize: '11px' }}
                          />
                        </td>
                        <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}>
                          <input
                            type="text"
                            value={item.manufacturer}
                            onChange={(e) => handleDetailChange(index, 'manufacturer', e.target.value)}
                            style={{ width: '100%', padding: '3px 5px', border: '1px solid #ddd', borderRadius: '2px', fontSize: '11px' }}
                          />
                        </td>
                        <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}>
                          <input
                            type="text"
                            value={item.model}
                            onChange={(e) => handleDetailChange(index, 'model', e.target.value)}
                            style={{ width: '100%', padding: '3px 5px', border: '1px solid #ddd', borderRadius: '2px', fontSize: '11px' }}
                          />
                        </td>
                        <td style={{ padding: '4px 6px', border: '1px solid #ddd', textAlign: 'center' }}>
                          <input
                            type="text"
                            value={item.quantity ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value, 10) || 0;
                              handleDetailChange(index, 'quantity', value as number);
                            }}
                            style={{ width: '40px', padding: '3px 5px', border: '1px solid #ddd', borderRadius: '2px', fontSize: '11px', textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}>
                          <input
                            type="text"
                            value={item.listUnitPrice?.toLocaleString() ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
                              handleDetailChange(index, 'listUnitPrice', value as number);
                            }}
                            style={{ width: '100%', padding: '3px 5px', border: '1px solid #ddd', borderRadius: '2px', fontSize: '11px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                          />
                        </td>
                        <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}>
                          <input
                            type="text"
                            value={item.listPrice?.toLocaleString() ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
                              handleDetailChange(index, 'listPrice', value as number);
                            }}
                            style={{ width: '100%', padding: '3px 5px', border: '1px solid #ddd', borderRadius: '2px', fontSize: '11px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                          />
                        </td>
                        <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}>
                          <input
                            type="text"
                            value={item.purchaseUnitPrice?.toLocaleString() ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
                              handleDetailChange(index, 'purchaseUnitPrice', value as number);
                            }}
                            style={{ width: '100%', padding: '3px 5px', border: '1px solid #ddd', borderRadius: '2px', fontSize: '11px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                          />
                        </td>
                        <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}>
                          <input
                            type="text"
                            value={item.purchaseAmount?.toLocaleString() ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
                              handleDetailChange(index, 'purchaseAmount', value as number);
                            }}
                            style={{ width: '100%', padding: '3px 5px', border: '1px solid #ddd', borderRadius: '2px', fontSize: '11px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 注記 + Excel取込 */}
            <div style={{ padding: '14px 16px', borderTop: '1px solid #ddd', background: '#fafafa', display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
              <div style={{ flex: 1, fontSize: '12px', color: '#666', lineHeight: 2 }}>
                <div>① 読み込んだお見積もりと相違ないか確認・修正を行って下さい</div>
                <div>② 金額は単価×数量にて登録されています</div>
              </div>
              <button
                onClick={handleExcelImport}
                style={{
                  padding: '12px 32px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Excel取込
              </button>
            </div>

          </div>
          {/* 見積明細チェックセクション 終了 */}
        </div>
        {/* 左側コンテナ 終了 */}

          {/* ドラッグハンドル */}
          <div
            onMouseDown={handleDragStart}
            style={{
              width: '8px',
              cursor: 'col-resize',
              background: '#e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: '4px',
              height: '40px',
              background: '#bdbdbd',
              borderRadius: '2px',
            }} />
          </div>

          {/* 右側: PDFプレビュー */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #ddd',
            borderRadius: '4px',
            overflow: 'auto',
            background: 'white',
          }}>
            {/* 見積書プレビュー */}
            <div style={{ minHeight: '100%', position: 'relative', background: '#f5f5f5', padding: '8px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/quotation-sample.png"
                alt="見積書サンプル"
                style={{ width: '100%', height: 'auto', border: '1px solid #ddd', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              />
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
            onClick={handleAiJudgment}
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
            登録区分のAI判定へ
          </button>
        </div>
      </div>
    </div>
  );
}
