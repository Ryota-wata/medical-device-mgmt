'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { useOrderStore } from '@/lib/stores/orderStore';

interface OrderPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderGroupId: number;
}

/** カラートークン（page.tsx と統一） */
const COLORS = {
  primary: '#4a6fa5',
  primaryDark: '#3d5a80',
  textPrimary: '#1f2937',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textOnColor: '#ffffff',
  border: '#d1d5db',
  borderLight: '#e5e7eb',
  surface: '#f9fafb',
  white: '#ffffff',
  accent: '#e67e22',
} as const;

const PRINT_STYLE_ID = 'order-preview-print-style';

export const OrderPreviewModal: React.FC<OrderPreviewModalProps> = ({
  isOpen,
  onClose,
  orderGroupId,
}) => {
  const { getOrderGroupById, getOrderItemsByGroupId } = useOrderStore();
  const orderGroup = getOrderGroupById(orderGroupId);
  const orderItems = getOrderItemsByGroupId(orderGroupId);

  const handlePrint = () => {
    // 印刷用スタイルを動的に追加
    let styleEl = document.getElementById(PRINT_STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = PRINT_STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      @media print {
        body > *:not([data-order-preview-root]) {
          display: none !important;
        }
        [data-order-preview-root] {
          position: fixed !important;
          inset: 0 !important;
          z-index: 99999 !important;
          display: flex !important;
          align-items: flex-start !important;
          justify-content: center !important;
          background: white !important;
          padding: 0 !important;
        }
        [data-order-preview-backdrop] {
          background: white !important;
        }
        [data-order-preview-modal-frame] {
          box-shadow: none !important;
          max-height: none !important;
          overflow: visible !important;
          border-radius: 0 !important;
        }
        [data-order-preview-header],
        [data-order-preview-footer] {
          display: none !important;
        }
        [data-order-preview-document] {
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          padding: 20mm !important;
          max-width: none !important;
        }
      }
    `;
    window.print();
  };

  if (!orderGroup) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" showCloseButton={false}>
      {/* モーダルヘッダー */}
      <div
        data-order-preview-header=""
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: COLORS.textPrimary,
            textWrap: 'balance',
          }}
        >
          発注書プレビュー
        </h3>
        <button
          onClick={onClose}
          aria-label="閉じる"
          style={{
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: COLORS.textMuted,
            fontSize: '20px',
            borderRadius: '4px',
          }}
        >
          &#x2715;
        </button>
      </div>

      {/* 発注書ドキュメント本体 */}
      <div
        data-order-preview-document=""
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.borderLight}`,
          borderRadius: '4px',
          padding: '40px',
          maxWidth: '800px',
          margin: '0 auto',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        {/* タイトル */}
        <h1
          style={{
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: COLORS.textPrimary,
            letterSpacing: '0.5em',
            marginBottom: '32px',
            textWrap: 'balance',
          }}
        >
          発 注 書
        </h1>

        {/* 発注No・発注日 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '24px',
            marginBottom: '24px',
            fontSize: '14px',
            color: COLORS.textSecondary,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>発注No: {orderGroup.orderNo}</span>
          <span>発注日: {orderGroup.orderDate}</span>
        </div>

        {/* 宛先 */}
        <div style={{ marginBottom: '24px' }}>
          <p
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: COLORS.textPrimary,
              borderBottom: `2px solid ${COLORS.textPrimary}`,
              paddingBottom: '4px',
              display: 'inline-block',
            }}
          >
            {orderGroup.vendorName || '-'}{' '}
            <span style={{ fontWeight: 400, fontSize: '14px' }}>御中</span>
          </p>
        </div>

        {/* 発注者情報 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '32px',
          }}
        >
          <div style={{ fontSize: '14px', color: COLORS.textSecondary, textAlign: 'right' }}>
            <p style={{ marginBottom: '4px' }}>
              <span style={{ color: COLORS.textMuted, marginRight: '8px' }}>発注者:</span>
              {orderGroup.applicant || '-'}
            </p>
            <p>
              <span style={{ color: COLORS.textMuted, marginRight: '8px' }}>連絡先:</span>
              {orderGroup.applicantEmail || '-'}
            </p>
          </div>
        </div>

        {/* 明細テーブル */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          <thead>
            <tr
              style={{
                background: COLORS.primary,
                color: COLORS.textOnColor,
              }}
            >
              <th
                style={{
                  padding: '8px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  border: `1px solid ${COLORS.primaryDark}`,
                  width: '40px',
                }}
              >
                No
              </th>
              <th
                style={{
                  padding: '8px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  border: `1px solid ${COLORS.primaryDark}`,
                }}
              >
                品名
              </th>
              <th
                style={{
                  padding: '8px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  border: `1px solid ${COLORS.primaryDark}`,
                  whiteSpace: 'nowrap',
                }}
              >
                メーカー / 型式
              </th>
              <th
                style={{
                  padding: '8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  border: `1px solid ${COLORS.primaryDark}`,
                  width: '50px',
                }}
              >
                数量
              </th>
              <th
                style={{
                  padding: '8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  border: `1px solid ${COLORS.primaryDark}`,
                  width: '110px',
                  whiteSpace: 'nowrap',
                }}
              >
                単価（税込）
              </th>
              <th
                style={{
                  padding: '8px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  border: `1px solid ${COLORS.primaryDark}`,
                  width: '120px',
                  whiteSpace: 'nowrap',
                }}
              >
                金額（税込）
              </th>
            </tr>
          </thead>
          <tbody>
            {orderItems.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                <td
                  style={{
                    padding: '8px',
                    textAlign: 'center',
                    border: `1px solid ${COLORS.borderLight}`,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {idx + 1}
                </td>
                <td
                  style={{
                    padding: '8px',
                    border: `1px solid ${COLORS.borderLight}`,
                  }}
                >
                  {item.itemName}
                </td>
                <td
                  style={{
                    padding: '8px',
                    border: `1px solid ${COLORS.borderLight}`,
                    fontSize: '12px',
                    color: COLORS.textSecondary,
                  }}
                >
                  {item.manufacturer}
                  {item.model ? ` / ${item.model}` : ''}
                </td>
                <td
                  style={{
                    padding: '8px',
                    textAlign: 'right',
                    border: `1px solid ${COLORS.borderLight}`,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {item.quantity}
                </td>
                <td
                  style={{
                    padding: '8px',
                    textAlign: 'right',
                    border: `1px solid ${COLORS.borderLight}`,
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ¥{item.unitPrice.toLocaleString()}
                </td>
                <td
                  style={{
                    padding: '8px',
                    textAlign: 'right',
                    border: `1px solid ${COLORS.borderLight}`,
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ¥{item.totalPrice.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 合計金額 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              borderTop: `2px solid ${COLORS.textPrimary}`,
              borderBottom: `2px solid ${COLORS.textPrimary}`,
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary }}>
              合計金額（税込）
            </span>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: COLORS.textPrimary,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ¥{orderGroup.totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 条件欄 */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
            maxWidth: '480px',
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  padding: '6px 12px',
                  fontWeight: 'bold',
                  color: COLORS.textSecondary,
                  width: '120px',
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                  whiteSpace: 'nowrap',
                }}
              >
                納期
              </td>
              <td
                style={{
                  padding: '6px 12px',
                  color: COLORS.textPrimary,
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {orderGroup.deliveryDate || '-'}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '6px 12px',
                  fontWeight: 'bold',
                  color: COLORS.textSecondary,
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                  whiteSpace: 'nowrap',
                }}
              >
                支払条件
              </td>
              <td
                style={{
                  padding: '6px 12px',
                  color: COLORS.textPrimary,
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                }}
              >
                {orderGroup.paymentTerms}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '6px 12px',
                  fontWeight: 'bold',
                  color: COLORS.textSecondary,
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                  whiteSpace: 'nowrap',
                }}
              >
                発注形態
              </td>
              <td
                style={{
                  padding: '6px 12px',
                  color: COLORS.textPrimary,
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                }}
              >
                {orderGroup.orderType}
              </td>
            </tr>
            {orderGroup.paymentDueDate && (
              <tr>
                <td
                  style={{
                    padding: '6px 12px',
                    fontWeight: 'bold',
                    color: COLORS.textSecondary,
                    borderBottom: `1px solid ${COLORS.borderLight}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  支払期日
                </td>
                <td
                  style={{
                    padding: '6px 12px',
                    color: COLORS.textPrimary,
                    borderBottom: `1px solid ${COLORS.borderLight}`,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {orderGroup.paymentDueDate}
                </td>
              </tr>
            )}
            {orderGroup.leaseCompany && (
              <tr>
                <td
                  style={{
                    padding: '6px 12px',
                    fontWeight: 'bold',
                    color: COLORS.textSecondary,
                    borderBottom: `1px solid ${COLORS.borderLight}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  リース会社
                </td>
                <td
                  style={{
                    padding: '6px 12px',
                    color: COLORS.textPrimary,
                    borderBottom: `1px solid ${COLORS.borderLight}`,
                  }}
                >
                  {orderGroup.leaseCompany}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* フッターボタン */}
      <div
        data-order-preview-footer=""
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '16px',
        }}
      >
        <button
          onClick={handlePrint}
          style={{
            padding: '12px 24px',
            background: COLORS.primary,
            color: COLORS.textOnColor,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            minWidth: '44px',
            minHeight: '44px',
          }}
        >
          印刷する
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '12px 24px',
            background: COLORS.white,
            color: COLORS.textMuted,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            minWidth: '44px',
            minHeight: '44px',
          }}
        >
          閉じる
        </button>
      </div>
    </Modal>
  );
};
