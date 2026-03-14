'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useOrderStore } from '@/lib/stores/orderStore';
import { useIndividualStore } from '@/lib/stores/individualStore';

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
  green: '#27ae60',
} as const;

/** SearchParams 読み取り */
function RfqGroupIdReader({ onRead }: { onRead: (id: number | null) => void }) {
  const searchParams = useSearchParams();
  const rfqGroupIdParam = searchParams.get('rfqGroupId');
  React.useEffect(() => {
    onRead(rfqGroupIdParam ? Number(rfqGroupIdParam) : null);
  }, [rfqGroupIdParam, onRead]);
  return null;
}

export default function AssetRegistrationPage() {
  const router = useRouter();
  const { rfqGroups, updateRfqGroup } = useRfqGroupStore();
  const { getOrderGroupByRfqGroupId, getOrderItemsByGroupId } = useOrderStore();
  const { individuals } = useIndividualStore();

  const [rfqGroupId, setRfqGroupId] = useState<number | null>(null);
  const handleRfqGroupIdRead = useCallback((id: number | null) => setRfqGroupId(id), []);

  // 固定資産番号の入力状態
  const [fixedAssetNos, setFixedAssetNos] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 登録完了状態
  const [registrationComplete, setRegistrationComplete] = useState<{
    groupName: string;
    itemCount: number;
  } | null>(null);

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

  // 検収登録で登録された個体データを取得
  const getIndividualForItem = useCallback((orderItemId: number) => {
    return individuals.find(ind => ind.orderItemId === orderItemId);
  }, [individuals]);

  // 登録処理
  const handleRegister = () => {
    if (!rfqGroup || !orderGroup || !rfqGroupId) return;
    setIsSubmitting(true);

    updateRfqGroup(rfqGroupId, { status: '完了' });

    setRegistrationComplete({
      groupName: rfqGroup.groupName,
      itemCount: orderItems.length,
    });
    setIsSubmitting(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: COLORS.surface }}>
      <style>{`
        .asset-reg-btn { transition: filter 150ms ease-out; }
        .asset-reg-btn:hover:not(:disabled) { filter: brightness(0.9); }
        .asset-reg-btn:focus-visible { outline: 2px solid ${COLORS.primary}; outline-offset: 2px; }
        .asset-reg-btn-secondary { transition: background 150ms ease-out; }
        .asset-reg-btn-secondary:hover { background: ${COLORS.borderLight} !important; }
        .asset-reg-btn-secondary:focus-visible { outline: 2px solid ${COLORS.border}; outline-offset: 2px; }
        .asset-reg-cell-input { transition: border-color 150ms ease-out; }
        .asset-reg-cell-input:focus { border-color: ${COLORS.primary} !important; outline: none; }
      `}</style>

      <Suspense fallback={null}>
        <RfqGroupIdReader onRead={handleRfqGroupIdRead} />
      </Suspense>

      <Header
        title={registrationComplete ? '資産登録完了' : '資産登録'}
        hideMenu={true}
        showBackButton={false}
      />

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
                原本リストへ登録しました
              </h2>
              <p style={{ fontSize: '14px', color: COLORS.textSecondary, marginBottom: '24px', textWrap: 'pretty' }}>
                {registrationComplete.groupName}（{registrationComplete.itemCount}品目）
              </p>
              <button
                className="asset-reg-btn"
                onClick={() => router.push('/quotation-data-box')}
                style={{ padding: '12px 24px', background: COLORS.accent, color: COLORS.textOnAccent, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', width: '240px' }}
              >
                一覧画面に戻る
              </button>
            </div>
          </div>

        ) : !rfqGroup || !orderGroup ? (
          <div style={{ maxWidth: '480px', margin: '40px auto', textAlign: 'center', color: COLORS.textMuted }}>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: '8px' }}>対象の発注データが見つかりません</p>
            <p style={{ fontSize: '12px', marginBottom: '16px', textWrap: 'pretty' }}>URLのパラメータが正しいか確認するか、一覧画面から対象を選択してください。</p>
            <button
              className="asset-reg-btn"
              onClick={() => router.push('/quotation-data-box')}
              style={{ padding: '8px 24px', background: COLORS.primary, color: COLORS.textOnColor, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              ← 一覧画面に戻る
            </button>
          </div>

        ) : (
          <>
            {/* 基本情報セクション */}
            <div style={{ background: COLORS.white, borderRadius: '4px', marginBottom: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '8px 16px', background: COLORS.sectionHeader, color: COLORS.textOnColor, fontSize: '12px', fontWeight: 'bold', textWrap: 'balance' }}>
                基本情報
              </div>
              <div style={{ padding: '12px 16px' }}>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={thStyle}>見積依頼No.</td>
                      <td style={tdStyle}>{rfqGroup.rfqNo}</td>
                      <td style={thStyle}>見積依頼G名称</td>
                      <td style={tdStyle}>{rfqGroup.groupName}</td>
                    </tr>
                    <tr>
                      <td style={thStyle}>発注先</td>
                      <td style={tdStyle}>{orderGroup.vendorName}</td>
                      <td style={thStyle}>担当</td>
                      <td style={tdStyle}>{rfqGroup.personInCharge || '-'}</td>
                    </tr>
                    <tr>
                      <td style={thStyle}>発注形態</td>
                      <td style={tdStyle}>{orderGroup.orderType}</td>
                      <td style={thStyle}>見積日付</td>
                      <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums' }}>{rfqGroup.createdDate || '-'}</td>
                    </tr>
                    <tr>
                      <td style={thStyle}>発注日</td>
                      <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums' }}>{orderGroup.orderDate || '-'}</td>
                      <td style={thStyle}>納品日</td>
                      <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums' }}>{orderGroup.deliveryDate || '-'}</td>
                    </tr>
                    <tr>
                      <td style={thStyle}>検収日</td>
                      <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums' }}>{orderGroup.inspectionDate || '-'}</td>
                      <td style={thStyle}>合計金額</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>¥{totalAmount.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td style={thStyle}>院内決済No.</td>
                      <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums' }}>{orderGroup.inHouseSettlementNo || '-'}</td>
                      <td style={thStyle} />
                      <td style={tdStyle} />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 明細テーブル */}
            <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: '4px', marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                background: COLORS.primary,
                color: COLORS.textOnColor,
              }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', textWrap: 'balance' }}>
                  明細に対する基本情報
                  <span style={{ fontSize: '11px', fontWeight: 400, marginLeft: '12px', opacity: 0.9 }}>
                    【オレンジ列 = 入力項目】
                  </span>
                </span>
                <span style={{ fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>
                  合計金額（税別）:
                  <span style={{ fontWeight: 'bold', fontSize: '16px', marginLeft: '8px' }}>
                    ¥{totalAmount.toLocaleString()}
                  </span>
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: 1200 }}>
                  <thead>
                    {/* グループヘッダー行 */}
                    <tr style={{ background: COLORS.sectionHeader, color: COLORS.textOnColor }}>
                      <th style={{ ...tableThStyle, textAlign: 'center' }} rowSpan={2}>No</th>
                      <th style={tableThStyle} colSpan={10}>商品分類</th>
                      <th style={{ ...tableThStyle, background: '#fff7ed', color: '#c2410c' }} colSpan={1}>入力項目</th>
                    </tr>
                    {/* 個別ヘッダー行 */}
                    <tr style={{ background: COLORS.primary, color: COLORS.textOnColor }}>
                      <th style={tableThStyle}>QRコード</th>
                      <th style={tableThStyle}>階</th>
                      <th style={tableThStyle}>部門</th>
                      <th style={tableThStyle}>部署</th>
                      <th style={tableThStyle}>室名</th>
                      <th style={tableThStyle}>品目</th>
                      <th style={tableThStyle}>メーカー</th>
                      <th style={tableThStyle}>型式</th>
                      <th style={{ ...tableThStyle, textAlign: 'right' }}>案分金額（税別）</th>
                      <th style={tableThStyle}>仮勘定科目</th>
                      <th style={{ ...tableThStyle, background: '#fff7ed', color: '#c2410c' }}>固定資産番号</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item, index) => {
                      const ind = getIndividualForItem(item.id);
                      return (
                        <tr key={item.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                          <td style={{ ...tableTdStyle, textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{index + 1}</td>
                          <td style={{ ...tableTdStyle, fontFamily: 'monospace', fontSize: '10px' }}>{ind?.qrCode || '-'}</td>
                          <td style={tableTdStyle}>{ind?.location?.floor || '-'}</td>
                          <td style={tableTdStyle}>{ind?.location?.department || '-'}</td>
                          <td style={tableTdStyle}>{ind?.location?.section || '-'}</td>
                          <td style={tableTdStyle}>-</td>
                          <td style={{ ...tableTdStyle, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{item.itemName}</td>
                          <td style={{ ...tableTdStyle, whiteSpace: 'nowrap' }}>{item.manufacturer}</td>
                          <td style={{ ...tableTdStyle, fontFamily: 'monospace', fontSize: '10px' }}>{item.model}</td>
                          <td style={{ ...tableTdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, whiteSpace: 'nowrap' }}>¥{item.totalPrice.toLocaleString()}</td>
                          <td style={tableTdStyle}>-</td>
                          <td style={editCellStyle}>
                            <input
                              className="asset-reg-cell-input"
                              type="text"
                              value={fixedAssetNos[item.id] || ''}
                              onChange={(e) => setFixedAssetNos(prev => ({ ...prev, [item.id]: e.target.value }))}
                              placeholder="入力"
                              style={cellInputStyle}
                            />
                          </td>
                        </tr>
                      );
                    })}
                    {orderItems.length === 0 && (
                      <tr>
                        <td colSpan={12} style={{ padding: '32px', textAlign: 'center', color: COLORS.textMuted }}>
                          <p style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: '8px', textWrap: 'balance' }}>明細がありません</p>
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
                className="asset-reg-btn-secondary"
                onClick={() => router.push('/quotation-data-box')}
                style={{ padding: '12px 24px', background: COLORS.white, color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
              >
                ← 一覧画面に戻る
              </button>
              <button
                className="asset-reg-btn"
                onClick={handleRegister}
                disabled={isSubmitting}
                style={{ padding: '12px 24px', background: COLORS.accent, color: COLORS.textOnAccent, border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold', minHeight: '44px', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? '登録中...' : '原本リストへ登録'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Style constants
// ============================================================

const thStyle: React.CSSProperties = {
  padding: '4px 8px',
  background: '#f3f4f6',
  fontWeight: 'bold',
  width: '120px',
  border: '1px solid #e5e7eb',
  fontSize: '12px',
};

const tdStyle: React.CSSProperties = {
  padding: '4px 8px',
  border: '1px solid #e5e7eb',
  fontSize: '12px',
};

const tableThStyle: React.CSSProperties = {
  padding: '8px',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  fontWeight: 'bold',
  fontSize: '11px',
  borderBottom: '1px solid #3d5a80',
};

const tableTdStyle: React.CSSProperties = {
  padding: '6px 8px',
  fontSize: '12px',
  color: '#1f2937',
  verticalAlign: 'middle',
};

const editCellStyle: React.CSSProperties = {
  ...tableTdStyle,
  background: '#fff7ed',
};

const cellInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '4px 6px',
  fontSize: '12px',
  border: '1px solid #fdba74',
  borderRadius: '3px',
  fontFamily: 'inherit',
  background: '#ffffff',
  boxSizing: 'border-box' as const,
};
