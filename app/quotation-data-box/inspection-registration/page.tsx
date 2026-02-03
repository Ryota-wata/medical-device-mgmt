'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useOrderStore } from '@/lib/stores/orderStore';
import { InspectionCertType } from '@/lib/types/order';
import { InspectionCertPreviewModal } from '@/components/modals/InspectionCertPreviewModal';

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
  infoBg: '#eff6ff',
  infoBorder: '#93c5fd',
  infoText: '#1e40af',
  disabled: '#9ca3af',
} as const;

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: `1px solid ${COLORS.border}`,
  borderRadius: '4px',
  fontSize: '14px',
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

export default function InspectionRegistrationPage() {
  const router = useRouter();
  const { rfqGroups, updateRfqGroup } = useRfqGroupStore();
  const { getOrderGroupByRfqGroupId, getOrderItemsByGroupId, updateOrderGroup } = useOrderStore();

  const [rfqGroupId, setRfqGroupId] = useState<number | null>(null);
  const handleRfqGroupIdRead = useCallback((id: number | null) => setRfqGroupId(id), []);

  // --- フォーム項目 ---
  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionCertType, setInspectionCertType] = useState<InspectionCertType>('本体のみ');

  // --- ダイアログ・バリデーション ---
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [inspectionDateError, setInspectionDateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 登録完了状態 ---
  const [registrationComplete, setRegistrationComplete] = useState<{
    itemCount: number;
    totalAmount: number;
    orderGroupId: number;
    inspectionDate: string;
    inspectionCertType: InspectionCertType;
  } | null>(null);
  const [showCertPreview, setShowCertPreview] = useState(false);

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

  // データ取得
  const rfqGroup = useMemo(() => {
    if (!rfqGroupId) return undefined;
    return rfqGroups.find(g => g.id === rfqGroupId);
  }, [rfqGroupId, rfqGroups]);

  const orderGroup = useMemo(() => {
    if (!rfqGroupId) return undefined;
    return getOrderGroupByRfqGroupId(rfqGroupId);
  }, [rfqGroupId, getOrderGroupByRfqGroupId]);

  const orderItems = useMemo(() => {
    if (!orderGroup) return [];
    return getOrderItemsByGroupId(orderGroup.id);
  }, [orderGroup, getOrderItemsByGroupId]);

  const totalAmount = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [orderItems]);

  // 登録処理
  const handleSubmitInspection = () => {
    if (!rfqGroup || !orderGroup) return;
    if (!inspectionDate) {
      setInspectionDateError('検収日を設定してください');
      return;
    }
    setInspectionDateError('');

    showDialog({
      title: '検収登録確認',
      message: `検収を登録します。品目数: ${orderItems.length}件 / 合計金額: ¥${totalAmount.toLocaleString()}`,
      confirmLabel: '検収を登録する',
      onConfirm: () => {
        setIsSubmitting(true);

        updateOrderGroup(orderGroup.id, {
          inspectionDate,
          inspectionCertType,
        });

        updateRfqGroup(rfqGroupId!, {
          status: '検収登録済',
        });

        setRegistrationComplete({
          itemCount: orderItems.length,
          totalAmount,
          orderGroupId: orderGroup.id,
          inspectionDate,
          inspectionCertType,
        });
        setIsSubmitting(false);
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
      {/* ホバー・フォーカス状態 */}
      <style>{`
        .insp-btn { transition: filter 150ms ease-out; }
        .insp-btn:hover:not(:disabled) { filter: brightness(0.9); }
        .insp-btn:focus-visible { outline: 2px solid #4a6fa5; outline-offset: 2px; }
        .insp-btn-secondary { transition: background 150ms ease-out; }
        .insp-btn-secondary:hover { background: #e5e7eb !important; }
        .insp-btn-secondary:focus-visible { outline: 2px solid #d1d5db; outline-offset: 2px; }
        .insp-radio { cursor: pointer; }
        .insp-radio-label { cursor: pointer; user-select: none; }
      `}</style>

      <Suspense fallback={null}>
        <RfqGroupIdReader onRead={handleRfqGroupIdRead} />
      </Suspense>

      {/* ヘッダー */}
      <Header
        title={registrationComplete ? '検収登録完了' : '検収登録'}
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
                検収を登録しました
              </h2>
              <p style={{ fontSize: '14px', color: COLORS.textSecondary, marginBottom: '24px', fontVariantNumeric: 'tabular-nums', textWrap: 'pretty' }}>
                {registrationComplete.itemCount}品目 / ¥{registrationComplete.totalAmount.toLocaleString()}
                <br />
                検収日: {registrationComplete.inspectionDate}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                <button
                  className="insp-btn"
                  onClick={() => setShowCertPreview(true)}
                  style={{ padding: '12px 24px', background: COLORS.primary, color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', width: '240px', minHeight: '44px' }}
                >
                  検収書をExcel出力する
                </button>
                <button
                  className="insp-btn-secondary"
                  onClick={() => router.push('/qr-issue')}
                  style={{ padding: '12px 24px', background: COLORS.white, color: COLORS.primary, border: `1px solid ${COLORS.primary}`, borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', width: '240px', minHeight: '44px' }}
                >
                  QRラベルを発行する
                </button>
                <button
                  className="insp-btn-secondary"
                  onClick={() => router.push('/quotation-data-box')}
                  style={{ padding: '12px 24px', background: 'transparent', color: COLORS.textMuted, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', width: '240px', minHeight: '44px', textDecoration: 'underline' }}
                >
                  一覧画面に戻る
                </button>
              </div>
            </div>
          </div>
        ) : !rfqGroup || !orderGroup ? (
          <div style={{ maxWidth: '480px', margin: '40px auto', textAlign: 'center', color: COLORS.textMuted }}>
            <p style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold', color: COLORS.textSecondary }}>対象の発注データが見つかりません</p>
            <p style={{ fontSize: '12px', marginBottom: '16px', textWrap: 'pretty' }}>URLのパラメータが正しいか確認するか、一覧画面から対象を選択してください。</p>
            <button
              className="insp-btn"
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
              background: COLORS.infoBg,
              border: `1px solid ${COLORS.infoBorder}`,
              borderRadius: '4px',
              marginBottom: '24px',
              fontSize: '14px',
              color: COLORS.infoText,
              textWrap: 'pretty',
            }}>
              検収日を入力し「検収を登録する」を押してください。
            </div>

            {/* 基本情報セクション */}
            <div style={{
              background: COLORS.white,
              borderRadius: '4px',
              marginBottom: '24px',
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
                      <td style={{ padding: '4px 8px', border: `1px solid ${COLORS.borderLight}` }}>{orderGroup.vendorName || '-'}</td>
                      <td style={{ padding: '4px 8px', background: COLORS.surfaceAlt, fontWeight: 'bold', border: `1px solid ${COLORS.borderLight}` }}>申請者</td>
                      <td style={{ padding: '4px 8px', border: `1px solid ${COLORS.borderLight}` }}>{orderGroup.applicant || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', background: COLORS.surfaceAlt, fontWeight: 'bold', border: `1px solid ${COLORS.borderLight}` }}>納品日</td>
                      <td colSpan={3} style={{ padding: '4px 8px', border: `1px solid ${COLORS.borderLight}`, fontVariantNumeric: 'tabular-nums' }}>{rfqGroup.deadline || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 検収登録セクション */}
            <div style={{ border: `2px solid ${COLORS.accent}`, borderRadius: '8px', marginBottom: '24px' }}>
              <div style={{ background: COLORS.accent, color: COLORS.textOnAccent, padding: '8px 16px', fontSize: '14px', fontWeight: 'bold', textWrap: 'balance' }}>
                検収登録
              </div>
              <div style={{ padding: '16px' }}>
                {/* 検収日 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap', width: '120px', flexShrink: 0 }}>
                    検収日 <span style={{ color: COLORS.error }}>*</span>
                  </label>
                  <div>
                    <input
                      type="date"
                      value={inspectionDate}
                      onChange={(e) => {
                        setInspectionDate(e.target.value);
                        if (e.target.value) setInspectionDateError('');
                      }}
                      style={{
                        ...inputStyle,
                        width: '180px',
                        borderColor: inspectionDateError ? COLORS.error : COLORS.border,
                      }}
                    />
                    {inspectionDateError && (
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: COLORS.error }}>
                        {inspectionDateError}
                      </p>
                    )}
                  </div>
                </div>

                {/* 検収書の発行 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary, whiteSpace: 'nowrap', width: '120px', flexShrink: 0 }}>
                    検収書の発行
                  </label>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    {(['本体のみ', '付属品含む'] as InspectionCertType[]).map((type) => (
                      <label key={type} className="insp-radio-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: COLORS.textPrimary }}>
                        <input
                          type="radio"
                          name="inspectionCertType"
                          className="insp-radio"
                          checked={inspectionCertType === type}
                          onChange={() => setInspectionCertType(type)}
                          style={{ width: '16px', height: '16px', accentColor: COLORS.accent }}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 発注明細テーブル（読取専用） */}
            <div style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '4px',
              marginBottom: '24px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                background: COLORS.primary,
                color: COLORS.textOnColor,
              }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', textWrap: 'balance' }}>発注明細</span>
                <span style={{ fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>
                  合計金額（税込）:
                  <span style={{ fontWeight: 'bold', fontSize: '16px', marginLeft: '8px' }}>
                    ¥{totalAmount.toLocaleString()}
                  </span>
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: COLORS.primary, color: COLORS.textOnColor }}>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold' }}>No</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold' }}>品名</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold' }}>メーカー</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold' }}>型式</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold' }}>数量</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap', fontWeight: 'bold' }}>金額（税込）</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                        <td style={{ padding: '8px', fontVariantNumeric: 'tabular-nums' }}>{idx + 1}</td>
                        <td style={{ padding: '8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.itemName}</td>
                        <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{item.manufacturer || '-'}</td>
                        <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{item.model || '-'}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</td>
                        <td style={{ padding: '8px', textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>¥{item.totalPrice.toLocaleString()}</td>
                      </tr>
                    ))}
                    {orderItems.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted }}>
                          <p style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: '8px', textWrap: 'balance' }}>発注明細がありません</p>
                          <p style={{ fontSize: '12px', textWrap: 'pretty' }}>発注登録を完了すると、明細が自動的に表示されます。</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* フッターボタン */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
              <button
                className="insp-btn-secondary"
                onClick={() => router.push('/quotation-data-box')}
                style={{ padding: '12px 24px', background: COLORS.white, color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
              >
                ← 一覧画面に戻る
              </button>
              <button
                className="insp-btn"
                onClick={handleSubmitInspection}
                disabled={isSubmitting}
                style={{ padding: '12px 24px', background: COLORS.accent, color: COLORS.textOnAccent, border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? '登録中...' : '検収を登録する'}
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

      {/* 検収書プレビューモーダル */}
      {registrationComplete && (
        <InspectionCertPreviewModal
          isOpen={showCertPreview}
          onClose={() => setShowCertPreview(false)}
          orderGroupId={registrationComplete.orderGroupId}
          inspectionCertType={registrationComplete.inspectionCertType}
        />
      )}
    </div>
  );
}
