'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useQuotationStore } from '@/lib/stores/quotationStore';
import { useOrderStore } from '@/lib/stores/orderStore';
import {
  OrderType,
  PaymentTerms,
} from '@/lib/types/order';
import { OrderPreviewModal } from '@/components/modals/OrderPreviewModal';

/** カラートークン */
const COLORS = {
  primary: '#4a6fa5',
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
  disabled: '#9ca3af',
  disabledBg: '#f3f4f6',
} as const;

/** 発注形態の選択肢 */
const ORDER_TYPES: OrderType[] = [
  '購入',
  '割賦',
  'リース（ファイナンス）',
  'リース（オペレーティング）',
  'レンタル',
];

/** 支払い条件の選択肢 */
const PAYMENT_TERMS: PaymentTerms[] = [
  '納品時一括',
  '検収後一括',
  '分割払い',
  '月末締め翌月末払い',
  'その他',
];

/** z-index スケール */
const Z_STICKY_HEADER = 10;

// 共通スタイル
const thStyle: React.CSSProperties = {
  background: COLORS.primary,
  color: COLORS.textOnColor,
  padding: '8px 12px',
  fontSize: '14px',
  fontWeight: 'bold',
  textAlign: 'left',
  width: '120px',
  border: `1px solid ${COLORS.primary}`,
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  background: COLORS.white,
  padding: '8px 12px',
  border: `1px solid ${COLORS.primary}`,
};

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
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('購入');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('検収後一括');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [leaseCompany, setLeaseCompany] = useState('');
  const [leaseStartDate, setLeaseStartDate] = useState('');
  const [leaseYears, setLeaseYears] = useState('');
  const [itemDeliveryDates, setItemDeliveryDates] = useState<Record<string, string>>({});

  // --- ダイアログ・バリデーション ---
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [deliveryDateError, setDeliveryDateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 登録完了状態 ---
  const [registrationComplete, setRegistrationComplete] = useState<{
    orderNo: string;
    itemCount: number;
    totalAmount: number;
    orderGroupId: number;
  } | null>(null);
  const [showOrderPreview, setShowOrderPreview] = useState(false);

  const showDialog = useCallback((opts: {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel?: string;
  }) => {
    setConfirmDialog({ isOpen: true, ...opts });
  }, []);

  const closeDialog = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    setIsSubmitting(false);
  }, []);

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

  // 個体管理: 数量分の行に展開した表示用データ
  const expandedItems = useMemo(() => {
    return targetQuotationItems.flatMap(qi => {
      const qty = qi.aiQuantity || qi.originalQuantity || 1;
      return Array.from({ length: qty }, (_, i) => ({ ...qi, _expandKey: `${qi.id}-${i}` }));
    });
  }, [targetQuotationItems]);

  const totalAmount = useMemo(() => {
    return targetQuotationItems.reduce((sum, item) => sum + (item.allocTaxTotal || 0), 0);
  }, [targetQuotationItems]);

  // 登録処理
  const handleSubmitOrder = () => {
    if (!rfqGroup) return;
    if (!deliveryDate) {
      setDeliveryDateError('納品日を設定してください');
      return;
    }
    setDeliveryDateError('');

    showDialog({
      title: '発注登録確認',
      message: `発注を登録します。品目数: ${expandedItems.length}件 / 合計金額: ¥${totalAmount.toLocaleString()}`,
      confirmLabel: '発注を登録する',
      onConfirm: () => {
        setIsSubmitting(true);
        const orderNo = generateOrderNo();
        const today = new Date().toISOString().split('T')[0];

        const orderGroupId = addOrderGroup({
          orderNo,
          rfqGroupId: rfqGroup.id,
          rfqNo: rfqGroup.rfqNo,
          groupName: rfqGroup.groupName,
          vendorName: rfqGroup.vendorName || '',
          applicant: rfqGroup.personInCharge || '',
          applicantEmail: rfqGroup.email || '',
          orderType,
          deliveryDate,
          paymentTerms,
          paymentDueDate,
          inspectionCertType: '本体のみ',
          storageFormat: '未指定',
          leaseCompany: isLeaseType ? leaseCompany : undefined,
          leaseStartDate: isLeaseType ? leaseStartDate : undefined,
          leaseYears: isLeaseType && leaseYears ? Number(leaseYears) : undefined,
          totalAmount,
          orderDate: today,
        });

        // 個体管理: 数量分の行に展開（1行1個体）
        const orderItems = targetQuotationItems.flatMap(qi => {
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
        });
        addOrderItems(orderItems);

        updateRfqGroup(rfqGroup.id, {
          status: '発注登録済',
          deadline: deliveryDate,
        });

        setRegistrationComplete({
          orderNo,
          itemCount: expandedItems.length,
          totalAmount,
          orderGroupId,
        });
        setIsSubmitting(false);
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
      {/* ホバー・フォーカス状態 */}
      <style>{`
        .order-btn { transition: filter 150ms ease-out; }
        .order-btn:hover:not(:disabled) { filter: brightness(0.9); }
        .order-btn:focus-visible { outline: 2px solid #4a6fa5; outline-offset: 2px; }
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
                  発注書を出力する
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
                <div style={{ display: 'grid', gridTemplateColumns: '100px 220px 100px 180px', gap: '8px 16px', alignItems: 'center' }}>
                  {/* 発注形態 */}
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>発注形態</label>
                  <select value={orderType} onChange={(e) => setOrderType(e.target.value as OrderType)} style={{ ...inputStyle, width: '220px' }}>
                    {ORDER_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
                  </select>

                  {/* 納期 */}
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>
                    納期 <span style={{ color: COLORS.error }}>*</span>
                  </label>
                  <div>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => {
                        setDeliveryDate(e.target.value);
                        if (e.target.value) setDeliveryDateError('');
                      }}
                      style={{
                        ...inputStyle,
                        width: '180px',
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

                {/* 支払条件 + 支払期日（独立行） */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap', width: '100px', flexShrink: 0 }}>支払条件</label>
                  <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)} style={{ ...inputStyle, width: '200px' }}>
                    {PAYMENT_TERMS.map((t) => (<option key={t} value={t}>{t}</option>))}
                  </select>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>支払期日</label>
                  <input type="date" value={paymentDueDate} onChange={(e) => setPaymentDueDate(e.target.value)} style={{ ...inputStyle, width: '180px' }} />
                </div>

                {/* リース関連（リース選択時のみ表示） */}
                {isLeaseType && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap', width: '100px', flexShrink: 0 }}>リース会社</label>
                    <input type="text" value={leaseCompany} onChange={(e) => setLeaseCompany(e.target.value)} placeholder="リース会社名" style={{ ...inputStyle, width: '220px', color: COLORS.textSecondary }} />
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>開始日</label>
                    <input type="month" value={leaseStartDate} onChange={(e) => setLeaseStartDate(e.target.value)} style={{ ...inputStyle, width: '150px', color: COLORS.textSecondary }} />
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap' }}>年数</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input type="number" value={leaseYears} onChange={(e) => setLeaseYears(e.target.value)} min="1" max="20" style={{ ...inputStyle, width: '60px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: COLORS.textSecondary }} />
                      <span style={{ fontSize: '14px', color: COLORS.textSecondary }}>年</span>
                    </div>
                  </div>
                )}
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
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold' }}>No</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold' }}>品名</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold' }}>メーカー</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold' }}>型式</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold' }}>数量</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold' }}>金額（税込）</th>
                      <th style={{ padding: '8px', textAlign: 'center', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold' }}>個別納品日</th>
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
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <input
                            type="date"
                            value={itemDeliveryDates[item._expandKey] || ''}
                            onChange={(e) => setItemDeliveryDates((prev) => ({ ...prev, [item._expandKey]: e.target.value }))}
                            style={{ ...inputStyle, width: '140px', fontSize: '12px', padding: '4px 8px', color: itemDeliveryDates[item._expandKey] ? COLORS.textPrimary : COLORS.disabled }}
                          />
                        </td>
                      </tr>
                    ))}
                    {expandedItems.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted }}>
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
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                style={{ padding: '12px 24px', background: COLORS.accent, color: COLORS.textOnAccent, border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? '登録中...' : '発注を登録する'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* 確認ダイアログ */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
      />

      {/* 発注書プレビューモーダル */}
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
