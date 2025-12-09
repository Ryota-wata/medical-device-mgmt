'use client';

import React from 'react';
import { Application, AssetMaster } from '@/lib/types';
import { ReceivedQuotationGroup, ReceivedQuotationItem } from '@/lib/types/quotation';

interface QuotationLinkModalProps {
  show: boolean;
  onClose: () => void;
  linkingApplication: Application | null;
  quotationItems: ReceivedQuotationItem[];
  quotationGroups: ReceivedQuotationGroup[];
  assets: AssetMaster[];
  selectedQuotationItemId: number | null;
  onSelectQuotationItem: (id: number) => void;
  onSubmit: () => void;
}

export const QuotationLinkModal: React.FC<QuotationLinkModalProps> = ({
  show,
  onClose,
  linkingApplication,
  quotationItems,
  quotationGroups,
  assets,
  selectedQuotationItemId,
  onSelectQuotationItem,
  onSubmit,
}) => {
  if (!show || !linkingApplication) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '30px',
          width: '900px',
          maxWidth: '95%',
          maxHeight: '85vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>
          見積紐付け
        </h2>

        <div style={{ marginBottom: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '4px', border: '1px solid #3498db' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#2c3e50' }}>
            <strong>申請番号:</strong> {linkingApplication.applicationNo}
          </p>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#2c3e50' }}>
            <strong>品目:</strong> {linkingApplication.asset.name}
          </p>
          <p style={{ margin: '0', fontSize: '14px', color: '#2c3e50' }}>
            <strong>申請種別:</strong> {linkingApplication.applicationType}
          </p>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }}>
            見積明細を選択 <span style={{ color: '#e74c3c' }}>*</span>
          </label>
        </div>

        {quotationItems.length === 0 ? (
          <div style={{
            padding: '40px',
            background: '#f8f9fa',
            borderRadius: '4px',
            textAlign: 'center',
            color: '#7f8c8d'
          }}>
            登録された見積明細がありません
          </div>
        ) : (
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden', maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
                <tr>
                  <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: '#2c3e50', width: '50px', borderBottom: '2px solid #dee2e6' }}>
                    選択
                  </th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', borderBottom: '2px solid #dee2e6' }}>見積番号</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', borderBottom: '2px solid #dee2e6' }}>業者名</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', borderBottom: '2px solid #dee2e6' }}>品目名</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: '#2c3e50', borderBottom: '2px solid #dee2e6' }}>数量</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: '#2c3e50', borderBottom: '2px solid #dee2e6' }}>金額</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', borderBottom: '2px solid #dee2e6' }}>大分類</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', borderBottom: '2px solid #dee2e6' }}>中分類</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', borderBottom: '2px solid #dee2e6' }}>品目</th>
                </tr>
              </thead>
              <tbody>
                {quotationItems.map((item) => {
                  const group = quotationGroups.find(g => g.id === item.quotationGroupId);
                  const assetMaster = item.assetMasterId ? assets.find(a => a.id === item.assetMasterId) : null;
                  const isSelected = selectedQuotationItemId === item.id;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #dee2e6',
                        background: isSelected ? '#e3f2fd' : 'white',
                        cursor: 'pointer'
                      }}
                      onClick={() => onSelectQuotationItem(item.id)}
                    >
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <input
                          type="radio"
                          name="quotationItem"
                          checked={isSelected}
                          onChange={() => onSelectQuotationItem(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontWeight: 600 }}>
                        {item.receivedQuotationNo}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        {group?.vendorName || '-'}
                      </td>
                      <td style={{ padding: '10px 8px', fontWeight: 500 }}>
                        {item.itemName}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        {item.quantity || '-'}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600 }}>
                        ¥{item.sellingPriceTotal?.toLocaleString() || '-'}
                      </td>
                      <td style={{ padding: '10px 8px', color: '#555' }}>
                        {assetMaster?.largeClass || '-'}
                      </td>
                      <td style={{ padding: '10px 8px', color: '#555' }}>
                        {assetMaster?.mediumClass || '-'}
                      </td>
                      <td style={{ padding: '10px 8px', color: '#555' }}>
                        {assetMaster?.item || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            style={{
              padding: '10px 24px',
              background: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#7f8c8d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#95a5a6';
            }}
          >
            キャンセル
          </button>
          <button
            style={{
              padding: '10px 24px',
              background: selectedQuotationItemId !== null ? '#3498db' : '#bdc3c7',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedQuotationItemId !== null ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            onClick={onSubmit}
            disabled={selectedQuotationItemId === null}
            onMouseEnter={(e) => {
              if (selectedQuotationItemId !== null) {
                e.currentTarget.style.background = '#2980b9';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedQuotationItemId !== null) {
                e.currentTarget.style.background = '#3498db';
              }
            }}
          >
            紐付け
          </button>
        </div>
      </div>
    </div>
  );
};
