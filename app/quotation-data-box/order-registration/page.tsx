'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useQuotationStore } from '@/lib/stores/quotationStore';
import { useOrderStore } from '@/lib/stores/orderStore';
import {
  OrderType,
  PaymentMethod,
} from '@/lib/types/order';
import { OrderPreviewModal, OrderPreviewData } from '@/components/modals/OrderPreviewModal';

/** カラートークン */
const COLORS = {
  primary: '#27ae60',
  primaryDark: '#3d5a80',
  accent: '#e67e22',
  textOnAccent: '#1f2937',
  textPrimary: '#1f2937',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textOnColor: '#ffffff',
  border: '#d1d5db',
  borderLight: '#e5e7eb',
  surface: '#f9fafb',
  surfaceAlt: '#f3f4f6',
  sectionHeader: '#4b5563',
  white: '#ffffff',
  error: '#dc2626',
  warningBg: '#fffbeb',
  warningBorder: '#f59e0b',
  warningText: '#92400e',
} as const;

/** 発注形態の選択肢 */
const ORDER_TYPES: OrderType[] = [
  '購入',
  '割賦',
  'リース（オペレーティング）',
  'リース（ファイナンス）',
];

/** 支払方法の選択肢 */
const PAYMENT_METHODS: PaymentMethod[] = [
  'でんさい',
  '銀行振込',
  'クレジット',
  '現金',
];

/** z-index スケール */
const Z_STICKY_HEADER = 10;

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: `1px solid ${COLORS.border}`,
  borderRadius: '4px',
  fontSize: '14px',
};

const truncateStyle: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

/** SearchParams 読み取り */
function RfqGroupIdReader({ onRead }: { onRead: (id: number | null) => void }) {
  const searchParams = useSearchParams();
  const rfqGroupIdParam = searchParams.get('rfqGroupId');
  React.useEffect(() => {
    onRead(rfqGroupIdParam ? Number(rfqGroupIdParam) : null);
  }, [rfqGroupIdParam, onRead]);
  return null;
}

export default function OrderRegistrationPage() {
  const router = useRouter();
  const { rfqGroups, updateRfqGroup } = useRfqGroupStore();
  const { quotationGroups, quotationItems } = useQuotationStore();
  const { addOrderGroup, addOrderItems, generateOrderNo } = useOrderStore();

  const [rfqGroupId, setRfqGroupId] = useState<number | null>(null);
  const handleRfqGroupIdRead = useCallback((id: number | null) => setRfqGroupId(id), []);

  // --- フォーム項目 ---
  const [inHouseSettlementNo, setInHouseSettlementNo] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('購入');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [paymentClosingDate, setPaymentClosingDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [paymentSiteDays, setPaymentSiteDays] = useState('');
  const [leaseStartDate, setLeaseStartDate] = useState('');
  const [leaseEndDate, setLeaseEndDate] = useState('');
  const [comment, setComment] = useState('');

  // --- バリデーション ---
  const [deliveryDateError, setDeliveryDateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- プレビュー・登録完了状態 ---
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<OrderPreviewData | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState<{
    orderNo: string;
    itemCount: number;
    totalAmount: number;
    orderGroupId: number;
  } | null>(null);
  const [showOrderPreview, setShowOrderPreview] = useState(false);

  const isLeaseType = orderType === 'リース（ファイナンス）' || orderType === 'リース（オペレーティング）';

  // データ取得
  const rfqGroup = useMemo(() => {
    if (!rfqGroupId) return undefined;
    return rfqGroups.find(g => g.id === rfqGroupId);
  }, [rfqGroupId, rfqGroups]);

  const targetQuotationItems = useMemo(() => {
    if (!rfqGroup) return [];
    const targetGroups = quotationGroups.filter(qg => qg.rfqGroupId === rfqGroup.id);
    return quotationItems.filter(qi =>
      targetGroups.some(qg => qg.id === qi.quotationGroupId)
    );
  }, [rfqGroup, quotationGroups, quotationItems]);

  // サンプル明細データ（ストアにデータがない場合のフォールバック）
  const sampleItems = useMemo(() => [
    { _expandKey: 'sample-1', itemName: '超音波診断装置 EPIQ Elite', originalItemName: '', manufacturer: 'フィリップス・ジャパン', originalManufacturer: '', model: 'EPIQ Elite 7500', originalModel: '', allocPriceUnit: 32000000 },
    { _expandKey: 'sample-2', itemName: '超音波プローブ S5-1', originalItemName: '', manufacturer: 'フィリップス・ジャパン', originalManufacturer: '', model: 'S5-1 PureWave', originalModel: '', allocPriceUnit: 2200000 },
    { _expandKey: 'sample-3', itemName: '超音波プローブ S5-1', originalItemName: '', manufacturer: 'フィリップス・ジャパン', originalManufacturer: '', model: 'S5-1 PureWave', originalModel: '', allocPriceUnit: 2200000 },
    { _expandKey: 'sample-4', itemName: '超音波プローブ C5-1', originalItemName: '', manufacturer: 'フィリップス・ジャパン', originalManufacturer: '', model: 'C5-1 PureWave', originalModel: '', allocPriceUnit: 2200000 },
    { _expandKey: 'sample-5', itemName: '設置・据付工事費', originalItemName: '', manufacturer: '-', originalManufacturer: '', model: '-', originalModel: '', allocPriceUnit: 4000000 },
  ], []);

  // 個体管理: 数量分の行に展開した表示用データ
  const expandedItems = useMemo(() => {
    const storeItems = targetQuotationItems.flatMap(qi => {
      const qty = qi.aiQuantity || qi.originalQuantity || 1;
      return Array.from({ length: qty }, (_, i) => ({ ...qi, _expandKey: `${qi.id}-${i}` }));
    });
    // ストアにデータがなければサンプルを使用
    return storeItems.length > 0 ? storeItems : sampleItems;
  }, [targetQuotationItems, sampleItems]);

  const totalAmount = useMemo(() => {
    if (targetQuotationItems.length > 0) {
      return targetQuotationItems.reduce((sum, item) => sum + (item.allocTaxTotal || 0), 0);
    }
    // サンプルデータの合計
    return sampleItems.reduce((sum, item) => sum + (item.allocPriceUnit || 0), 0);
  }, [targetQuotationItems, sampleItems]);

  // プレビュー表示（バリデーション → プレビューモーダルを開く）
  const handleShowPreview = () => {
    if (!rfqGroup) return;
    if (!deliveryDeadline) {
      setDeliveryDateError('納期を設定してください');
      return;
    }
    setDeliveryDateError('');

    const orderNo = generateOrderNo();
    const today = new Date().toISOString().split('T')[0];

    // プレビュー用の明細データを構築
    const previewItems = expandedItems.map((item) => ({
      itemName: (item.itemName || item.originalItemName || '') as string,
      manufacturer: (item.manufacturer || item.originalManufacturer || '-') as string,
      model: (item.model || item.originalModel || '-') as string,
      quantity: 1,
      unitPrice: (item.allocPriceUnit || 0) as number,
      totalPrice: (item.allocPriceUnit || 0) as number,
    }));

    setPreviewData({
      orderNo,
      orderDate: today,
      vendorName: rfqGroup.vendorName || '',
      applicant: rfqGroup.personInCharge || '',
      applicantEmail: rfqGroup.email || '',
      orderType,
      deliveryDate: deliveryDeadline,
      paymentClosingDate: paymentClosingDate || undefined,
      paymentDate: paymentDate || undefined,
      paymentMethod: paymentMethod || undefined,
      paymentSiteDays: paymentSiteDays ? Number(paymentSiteDays) : undefined,
      leaseStartDate: isLeaseType ? leaseStartDate || undefined : undefined,
      leaseEndDate: isLeaseType ? leaseEndDate || undefined : undefined,
      comment: comment || undefined,
      totalAmount,
      items: previewItems,
    });
    setShowPreview(true);
  };

  // 登録実行（プレビューから「登録して出力」押下時）
  const handleRegisterFromPreview = () => {
    if (!rfqGroup || !previewData) return;
    setIsSubmitting(true);

    const orderGroupId = addOrderGroup({
      orderNo: previewData.orderNo,
      rfqGroupId: rfqGroup.id,
      rfqNo: rfqGroup.rfqNo,
      groupName: rfqGroup.groupName,
      vendorName: previewData.vendorName,
      applicant: previewData.applicant,
      applicantEmail: previewData.applicantEmail,
      inHouseSettlementNo: inHouseSettlementNo || undefined,
      orderType,
      deliveryDate: deliveryDeadline,
      paymentTerms: 'その他',
      paymentDueDate: paymentClosingDate || undefined,
      paymentMethod: paymentMethod || undefined,
      paymentSiteDays: paymentSiteDays ? Number(paymentSiteDays) : undefined,
      leaseStartDate: isLeaseType ? leaseStartDate || undefined : undefined,
      leaseEndDate: isLeaseType ? leaseEndDate || undefined : undefined,
      comment: comment || undefined,
      inspectionCertType: '本体のみ',
      storageFormat: '未指定',
      totalAmount,
      orderDate: previewData.orderDate,
    });

    // 個体管理: 数量分の行に展開（1行1個体）
    const orderItems = targetQuotationItems.length > 0
      ? targetQuotationItems.flatMap(qi => {
          const qty = qi.aiQuantity || qi.originalQuantity || 1;
          const unitPrice = qi.allocPriceUnit || 0;
          const itemBase = {
            orderGroupId,
            quotationItemId: qi.id,
            itemName: qi.itemName || qi.originalItemName,
            manufacturer: qi.manufacturer || qi.originalManufacturer || '',
            model: qi.model || qi.originalModel || '',
            registrationType: '本体' as const,
            quantity: 1,
            unitPrice,
            totalPrice: unitPrice,
          };
          return Array.from({ length: qty }, () => ({ ...itemBase }));
        })
      : previewData.items.map((item) => ({
          orderGroupId,
          quotationItemId: 0,
          itemName: item.itemName,
          manufacturer: item.manufacturer,
          model: item.model,
          registrationType: '本体' as const,
          quantity: 1,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        }));
    addOrderItems(orderItems);

    updateRfqGroup(rfqGroup.id, {
      status: '発注済',
      deliveryDeadline: deliveryDeadline,
    });

    setShowPreview(false);
    setRegistrationComplete({
      orderNo: previewData.orderNo,
      itemCount: expandedItems.length,
      totalAmount,
      orderGroupId,
    });
    setIsSubmitting(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
      {/* ホバー・フォーカス状態 */}
      <style>{`
        .order-btn { transition: filter 150ms ease-out; }
        .order-btn:hover:not(:disabled) { filter: brightness(0.9); }
        .order-btn:focus-visible { outline: 2px solid #27ae60; outline-offset: 2px; }
        .order-btn-secondary { transition: background 150ms ease-out; }
        .order-btn-secondary:hover { background: #e5e7eb !important; }
        .order-btn-secondary:focus-visible { outline: 2px solid #d1d5db; outline-offset: 2px; }
      `}</style>

      <Suspense fallback={null}>
        <RfqGroupIdReader onRead={handleRfqGroupIdRead} />
      </Suspense>

      {/* ヘッダー */}
      <Header
        title={registrationComplete ? '発注登録完了' : '発注登録'}
        hideMenu={true}
        showBackButton={false}
      />

      {/* ページ全体スクロール */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* 登録完了画面 */}
        {registrationComplete ? (
          <div style={{ maxWidth: '560px', margin: '40px auto', textAlign: 'center' }}>
            <div style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.borderLight}`,
              borderRadius: '8px',
              padding: '32px',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#10003;</div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: '8px', textWrap: 'balance' }}>
                発注を登録しました
              </h2>
              <p style={{ fontSize: '14px', color: COLORS.textSecondary, marginBottom: '24px', fontVariantNumeric: 'tabular-nums' }}>
                発注No. {registrationComplete.orderNo}（{registrationComplete.itemCount}品目 / ¥{registrationComplete.totalAmount.toLocaleString()}）
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <button
                  className="order-btn"
                  onClick={() => setShowOrderPreview(true)}
                  style={{ padding: '12px 24px', background: COLORS.accent, color: COLORS.textOnAccent, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', width: '240px' }}
                >
                  印刷する
                </button>
                <button
                  className="order-btn"
                  onClick={() => {
                    alert('mail送付機能は今後実装予定です');
                  }}
                  style={{ padding: '12px 24px', background: COLORS.primary, color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', width: '240px' }}
                >
                  mail送付
                </button>
                <button
                  className="order-btn-secondary"
                  onClick={() => router.push('/quotation-data-box')}
                  style={{ padding: '12px 24px', background: COLORS.white, color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', width: '240px' }}
                >
                  一覧画面に戻る
                </button>
              </div>
            </div>
          </div>
        ) : !rfqGroup ? (
          <div style={{ maxWidth: '480px', margin: '40px auto', textAlign: 'center', color: COLORS.textMuted }}>
            <p style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold', color: COLORS.textSecondary }}>対象の見積依頼グループが見つかりません</p>
            <p style={{ fontSize: '12px', marginBottom: '16px' }}>URLのパラメータが正しいか確認するか、一覧画面から対象を選択してください。</p>
            <button
              className="order-btn"
              onClick={() => router.push('/quotation-data-box')}
              style={{ padding: '8px 24px', background: COLORS.primary, color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              ← 一覧画面に戻る
            </button>
          </div>
        ) : (
          <>
            {/* 確認メッセージ */}
            <div style={{
              padding: '12px 16px',
              background: COLORS.warningBg,
              border: `1px solid ${COLORS.warningBorder}`,
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px',
              color: COLORS.warningText,
              fontWeight: 'bold',
              textWrap: 'balance',
            }}>
              下記の内容で発注登録を実施します。
            </div>

            {/* 基本情報セクション */}
            <div style={{
              background: COLORS.white,
              borderRadius: '4px',
              marginBottom: '16px',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '8px 16px', background: COLORS.sectionHeader, color: COLORS.textOnColor, fontSize: '12px', fontWeight: 'bold', textWrap: 'balance' }}>
                基本情報
              </div>
              <div style={{ padding: '12px 16px' }}>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 8px', background: COLORS.surfaceAlt, fontWeight: 'bold', width: '120px', border: `1px solid ${COLORS.borderLight}` }}>見積依頼No.</td>
                      <td style={{ padding: '4px 8px', border: `1px solid ${COLORS.borderLight}`, width: '150px' }}>{rfqGroup.rfqNo}</td>
                      <td style={{ padding: '4px 8px', background: COLORS.surfaceAlt, fontWeight: 'bold', width: '120px', border: `1px solid ${COLORS.borderLight}` }}>見積G名称</td>
                      <td style={{ padding: '4px 8px', border: `1px solid ${COLORS.borderLight}` }}>{rfqGroup.groupName}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', background: COLORS.surfaceAlt, fontWeight: 'bold', border: `1px solid ${COLORS.borderLight}` }}>発注先</td>
                      <td style={{ padding: '4px 8px', border: `1px solid ${COLORS.borderLight}` }}>{rfqGroup.vendorName || '-'}</td>
                      <td style={{ padding: '4px 8px', background: COLORS.surfaceAlt, fontWeight: 'bold', border: `1px solid ${COLORS.borderLight}` }}>担当</td>
                      <td style={{ padding: '4px 8px', border: `1px solid ${COLORS.borderLight}` }}>{rfqGroup.personInCharge || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', background: COLORS.surfaceAlt, fontWeight: 'bold', border: `1px solid ${COLORS.borderLight}` }}>連絡先(TEL)</td>
                      <td style={{ padding: '4px 8px', border: `1px solid ${COLORS.borderLight}` }}>{rfqGroup.tel || '-'}</td>
                      <td style={{ padding: '4px 8px', background: COLORS.surfaceAlt, fontWeight: 'bold', border: `1px solid ${COLORS.borderLight}` }}>mail</td>
                      <td style={{ padding: '4px 8px', border: `1px solid ${COLORS.borderLight}` }}>{rfqGroup.email || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 発注基本登録セクション */}
            <div style={{ border: `2px solid ${COLORS.accent}`, borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ background: COLORS.accent, color: COLORS.textOnAccent, padding: '8px 16px', fontSize: '14px', fontWeight: 'bold', textWrap: 'balance' }}>
                発注基本登録
              </div>
              <div style={{ padding: '16px' }}>
                {/* 1行目: 院内決済No. / 発注形態 / 納期 / リース開始日・終了日 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
                  {/* 院内決済No. */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>院内決済No.</label>
                    <input
                      type="text"
                      value={inHouseSettlementNo}
                      onChange={(e) => setInHouseSettlementNo(e.target.value)}
                      style={{ ...inputStyle, width: '160px' }}
                    />
                  </div>

                  {/* 発注形態 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>発注形態</label>
                    <select value={orderType} onChange={(e) => setOrderType(e.target.value as OrderType)} style={{ ...inputStyle, width: '220px' }}>
                      {ORDER_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
                    </select>
                  </div>

                  {/* 納期 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>
                      納期 <span style={{ color: COLORS.error }}>*</span>
                    </label>
                    <div>
                      <input
                        type="date"
                        value={deliveryDeadline}
                        onChange={(e) => {
                          setDeliveryDeadline(e.target.value);
                          if (e.target.value) setDeliveryDateError('');
                        }}
                        style={{
                          ...inputStyle,
                          width: '160px',
                          borderColor: deliveryDateError ? COLORS.error : COLORS.border,
                        }}
                      />
                      {deliveryDateError && (
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: COLORS.error }}>
                          {deliveryDateError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* リース開始日・終了日（リース選択時のみ） */}
                  {isLeaseType && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '4px',
                      background: COLORS.white,
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>リース</span>
                      <label style={{ fontSize: '13px', color: COLORS.textSecondary, whiteSpace: 'nowrap' }}>開始日</label>
                      <input type="date" value={leaseStartDate} onChange={(e) => setLeaseStartDate(e.target.value)} style={{ ...inputStyle, width: '150px', fontSize: '13px' }} />
                      <label style={{ fontSize: '13px', color: COLORS.textSecondary, whiteSpace: 'nowrap' }}>終了日</label>
                      <input type="date" value={leaseEndDate} onChange={(e) => setLeaseEndDate(e.target.value)} style={{ ...inputStyle, width: '150px', fontSize: '13px' }} />
                    </div>
                  )}

                  {/* リース非選択時のプレースホルダー */}
                  {!isLeaseType && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 16px',
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: '4px',
                      background: COLORS.surfaceAlt,
                      color: COLORS.textMuted,
                      fontSize: '13px',
                    }}>
                      リースの場合：開始日・終了日
                    </div>
                  )}

                </div>

                {/* 2行目: 支払条件 / 支払方法 / 支払期日 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {/* 支払条件 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>支払条件</label>
                    <input
                      type="date"
                      value={paymentClosingDate}
                      onChange={(e) => setPaymentClosingDate(e.target.value)}
                      style={{ ...inputStyle, width: '160px' }}
                    />
                    <span style={{ fontSize: '14px', color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>締め</span>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      style={{ ...inputStyle, width: '160px' }}
                    />
                    <span style={{ fontSize: '14px', color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>支払</span>
                  </div>

                  {/* 支払方法 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>支払方法</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      style={{ ...inputStyle, width: '140px' }}
                    >
                      <option value="">選択してください</option>
                      {PAYMENT_METHODS.map((m) => (<option key={m} value={m}>{m}</option>))}
                    </select>
                  </div>

                  {/* 支払期日 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>支払期日</label>
                    <input
                      type="text"
                      value={paymentSiteDays}
                      onChange={(e) => setPaymentSiteDays(e.target.value)}
                      placeholder=""
                      style={{ ...inputStyle, width: '60px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '14px', color: COLORS.textPrimary }}>日サイト</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 発注明細テーブル（登録済み見積明細より自動取得） */}
            <div style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '4px',
              marginBottom: '16px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                background: COLORS.primary,
                color: COLORS.textOnColor,
              }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', textWrap: 'balance' }}>発注明細（登録済み見積明細より自動取得）</span>
                <span style={{ fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>
                  合計金額（税込）:
                  <span style={{ fontWeight: 'bold', fontSize: '16px', marginLeft: '8px' }}>
                    ¥{totalAmount.toLocaleString()}
                  </span>
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: Z_STICKY_HEADER }}>
                    <tr style={{ background: COLORS.primary, color: COLORS.textOnColor }}>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold', width: '40px' }}>No</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold' }}>品名</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold', width: '140px' }}>メーカー</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold', width: '120px' }}>型式</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold', width: '60px' }}>数量</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold', width: '120px' }}>金額（税込）</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expandedItems.map((item, idx) => (
                      <tr key={item._expandKey} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                        <td style={{ padding: '8px', fontVariantNumeric: 'tabular-nums' }}>{idx + 1}</td>
                        <td style={{ padding: '8px', maxWidth: '200px', ...truncateStyle }}>{item.itemName || item.originalItemName}</td>
                        <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{item.manufacturer || item.originalManufacturer || '-'}</td>
                        <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{item.model || item.originalModel || '-'}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>1</td>
                        <td style={{ padding: '8px', textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>¥{(item.allocPriceUnit || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {expandedItems.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted }}>
                          <p style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: '8px' }}>発注対象の見積明細がありません</p>
                          <p style={{ fontSize: '12px', marginBottom: '16px' }}>見積登録を完了すると、明細が自動的に表示されます。</p>
                          <button
                            className="order-btn"
                            onClick={() => router.push('/quotation-data-box')}
                            style={{ padding: '8px 16px', background: COLORS.primary, color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          >
                            ← 一覧画面に戻る
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* フッターボタン */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <button
                className="order-btn-secondary"
                onClick={() => router.push('/quotation-data-box')}
                style={{ padding: '12px 24px', background: COLORS.white, color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
              >
                ← 一覧画面に戻る
              </button>
              <button
                className="order-btn"
                onClick={handleShowPreview}
                disabled={isSubmitting}
                style={{ padding: '12px 24px', background: COLORS.accent, color: COLORS.textOnAccent, border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold', opacity: isSubmitting ? 0.7 : 1 }}
              >
                発注書プレビュー
              </button>
            </div>
          </>
        )}
      </div>

      {/* 登録前プレビューモーダル */}
      {previewData && (
        <OrderPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          previewData={previewData}
          onRegister={handleRegisterFromPreview}
        />
      )}

      {/* 登録後プレビューモーダル（印刷用） */}
      {registrationComplete && (
        <OrderPreviewModal
          isOpen={showOrderPreview}
          onClose={() => setShowOrderPreview(false)}
          orderGroupId={registrationComplete.orderGroupId}
        />
      )}
    </div>
  );
}
