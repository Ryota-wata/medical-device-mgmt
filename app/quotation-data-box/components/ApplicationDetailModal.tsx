'use client';

import React from 'react';
import {
  PurchaseApplication,
  getPurchaseApplicationTypeStyle,
  getPurchaseApplicationStatusStyle,
} from '@/lib/types/purchaseApplication';

interface ApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: PurchaseApplication | null;
  onReject: (id: string) => void;
  onAddToEditList: (id: string) => void;
}

export function ApplicationDetailModal({
  isOpen,
  onClose,
  application,
  onReject,
  onAddToEditList,
}: ApplicationDetailModalProps) {
  if (!isOpen || !application) return null;

  const typeStyle = getPurchaseApplicationTypeStyle(application.applicationType);
  const statusStyle = getPurchaseApplicationStatusStyle(application.status);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            background: '#3498db',
            color: 'white',
            padding: '16px 24px',
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
          }}
        >
          <span>申請詳細 - {application.applicationNo}</span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px',
            }}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {/* ボディ */}
        <div style={{ padding: '24px' }}>
          {/* 基本情報 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>申請種別</div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    ...typeStyle,
                  }}
                >
                  {application.applicationType}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>ステータス</div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    ...statusStyle,
                  }}
                >
                  {application.status}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>申請者</div>
                <div style={{ fontSize: '14px', color: '#2c3e50', fontWeight: 'bold' }}>
                  {application.applicantName}
                </div>
                <div style={{ fontSize: '12px', color: '#5a6c7d' }}>
                  {application.applicantDepartment}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>申請日</div>
                <div style={{ fontSize: '14px', color: '#2c3e50' }}>
                  {application.applicationDate}
                </div>
              </div>
              {application.desiredDeliveryDate && (
                <div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>希望納期</div>
                  <div style={{ fontSize: '14px', color: '#2c3e50' }}>
                    {application.desiredDeliveryDate}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 設置場所 */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#2c3e50',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '2px solid #3498db',
              }}
            >
              設置場所
            </div>
            <div style={{ fontSize: '14px', color: '#2c3e50', lineHeight: '1.8' }}>
              <div>{application.facility} {application.building} {application.floor}</div>
              <div>{application.department} / {application.section}</div>
              <div>諸室名: {application.roomName}</div>
            </div>
          </div>

          {/* 申請理由 */}
          {application.applicationReason && (
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #3498db',
                }}
              >
                申請理由
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: '#2c3e50',
                  lineHeight: '1.6',
                  background: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '6px',
                }}
              >
                {application.applicationReason}
              </div>
            </div>
          )}

          {/* 対象資産 */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#2c3e50',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '2px solid #3498db',
              }}
            >
              対象資産
            </div>
            <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' }}>
              {application.assets.map((asset, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px 16px',
                    borderBottom: index < application.assets.length - 1 ? '1px solid #f0f0f0' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  {asset.qrCode && (
                    <span
                      style={{
                        background: '#ecf0f1',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#5a6c7d',
                      }}
                    >
                      {asset.qrCode}
                    </span>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }}>
                      {asset.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      {asset.maker} / {asset.model}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: '#2c3e50' }}>
                    {asset.quantity} {asset.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 添付ファイル */}
          {application.attachedFiles && application.attachedFiles.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '2px solid #3498db',
                }}
              >
                添付資料
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {application.attachedFiles.map((file, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '6px 12px',
                      background: '#e3f2fd',
                      borderRadius: '4px',
                      fontSize: '13px',
                      color: '#1976d2',
                      cursor: 'pointer',
                    }}
                  >
                    📎 {file}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        {application.status === '申請中' && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              background: '#f8f9fa',
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px',
            }}
          >
            <button
              onClick={() => {
                onReject(application.id);
                onClose();
              }}
              style={{
                padding: '10px 20px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              却下
            </button>
            <button
              onClick={() => {
                onAddToEditList(application.id);
                onClose();
              }}
              style={{
                padding: '10px 20px',
                background: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              編集リストへ追加
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
