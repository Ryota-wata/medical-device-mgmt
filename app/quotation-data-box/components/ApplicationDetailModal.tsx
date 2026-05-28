'use client';

import React from 'react';
import {
  PurchaseApplication,
} from '@/lib/types/purchaseApplication';

interface ApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: PurchaseApplication | null;
  onReject: (id: string) => void;
  onAddToEditList: (id: string) => void;
}

// 希望順ラベル
const getHopeLabel = (index: number): string => {
  const labels = ['第一希望', '第二希望', '第三希望'];
  return labels[index] || `第${index + 1}希望`;
};

// 申請種別 → ヘッダータイトル
const getHeaderTitle = (type: string): string => {
  switch (type) {
    case '新規申請': return '新規購入申請 - 内容確認';
    case '更新申請': return '更新申請 - 内容確認';
    case '増設申請': return '増設申請 - 内容確認';
    default: return `${type} - 内容確認`;
  }
};

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: '#FAFAFA',
  border: '1px solid #E1E1E1',
  textAlign: 'left',
  width: '150px',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #E1E1E1',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#008C1D',
  marginBottom: '16px',
  paddingBottom: '8px',
  borderBottom: '2px solid #008C1D',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '24px',
};

export function ApplicationDetailModal({
  isOpen,
  onClose,
  application,
  onReject,
  onAddToEditList,
}: ApplicationDetailModalProps) {
  if (!isOpen || !application) return null;

  const commentText = application.comment || application.applicationReason;

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
          borderRadius: '8px',
          width: '95%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            background: '#008C1D',
            color: 'white',
            padding: '16px 24px',
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>{getHeaderTitle(application.applicationType)}</span>
            <span
              style={{
                background: 'white',
                color: '#008C1D',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 'bold',
              }}
            >
              購入申請No. {application.applicationNo}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* REQ-043: 依頼情報 */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>依頼情報</div>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <th style={thStyle}>依頼No.</th>
                  <td style={tdStyle}>{application.applicationNo || '-'}</td>
                  <th style={thStyle}>申請部署</th>
                  <td style={tdStyle}>{application.applicantDepartment || '-'}</td>
                </tr>
                <tr>
                  <th style={thStyle}>申請者</th>
                  <td style={tdStyle} colSpan={3}>{application.applicantName || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* REQ-043: 申請品目（品目名・数量・優先順位・設置部署・設置室名・希望納期） */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>申請品目</div>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <th style={thStyle}>品目名</th>
                  <td style={tdStyle}>{application.assets[0]?.name || '-'}</td>
                  <th style={thStyle}>数量</th>
                  <td style={tdStyle}>
                    {application.assets[0]
                      ? `${application.assets[0].quantity} ${application.assets[0].unit}`
                      : '-'}
                  </td>
                </tr>
                <tr>
                  <th style={thStyle}>優先順位</th>
                  <td style={tdStyle}>{application.priority || '-'}</td>
                  <th style={thStyle}>希望納期</th>
                  <td style={tdStyle}>{application.desiredDeliveryDate || '-'}</td>
                </tr>
                <tr>
                  <th style={thStyle}>設置部署</th>
                  <td style={tdStyle}>{application.section || '-'}</td>
                  <th style={thStyle}>設置室名</th>
                  <td style={tdStyle}>{application.roomName || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 要望機器 */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>要望機器</div>
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: '#FAFAFA' }}>
                  <th style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'center', width: '80px' }}>希望順</th>
                  <th style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'left' }}>品目</th>
                  <th style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'left' }}>メーカー</th>
                  <th style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'left' }}>型式</th>
                </tr>
              </thead>
              <tbody>
                {application.assets.map((asset, index) => (
                  <tr key={index}>
                    <td style={{ padding: '8px', border: '1px solid #E1E1E1', textAlign: 'center', fontWeight: 600, color: '#008C1D' }}>
                      {getHopeLabel(index)}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #E1E1E1' }}>{asset.name || '-'}</td>
                    <td style={{ padding: '8px', border: '1px solid #E1E1E1' }}>{asset.maker || '-'}</td>
                    <td style={{ padding: '8px', border: '1px solid #E1E1E1' }}>{asset.model || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* REQ-044/045: 更新・増設対象機器（既存機器の情報） */}
          {(application.applicationType === '更新申請' || application.applicationType === '増設申請') && (
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>
                {application.applicationType === '更新申請' ? '更新対象機器' : '増設対象機器'}
              </div>
              <table style={tableStyle}>
                <tbody>
                  <tr>
                    <th style={thStyle}>QRコード</th>
                    <td style={tdStyle}>{application.assets[0]?.qrCode || '-'}</td>
                    <th style={thStyle}>シリアルNo.</th>
                    <td style={tdStyle}>{application.assets[0]?.serialNo || '-'}</td>
                  </tr>
                  <tr>
                    <th style={thStyle}>品目</th>
                    <td style={tdStyle}>{application.assets[0]?.name || '-'}</td>
                    <th style={thStyle}>メーカー</th>
                    <td style={tdStyle}>{application.assets[0]?.maker || '-'}</td>
                  </tr>
                  <tr>
                    <th style={thStyle}>型式</th>
                    <td style={tdStyle}>{application.assets[0]?.model || '-'}</td>
                    <th style={thStyle}>購入年月日</th>
                    <td style={tdStyle}>{application.assets[0]?.purchaseDate || '-'}</td>
                  </tr>
                  <tr>
                    <th style={thStyle}>設置部署</th>
                    <td style={tdStyle}>{application.section || '-'}</td>
                    <th style={thStyle}>設置室名</th>
                    <td style={tdStyle}>{application.roomName || '-'}</td>
                  </tr>
                  {application.applicationType === '更新申請' && (
                    <tr>
                      <th style={thStyle}>更新対象機器の確認情報</th>
                      <td style={tdStyle} colSpan={3}>廃棄処理／他部署へ移動／継続して使用（予算執行後に原本側で申請）</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 使用用途及び件数 */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>使用用途及び件数</div>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <th style={thStyle}>用途</th>
                  <td style={tdStyle}>{application.usagePurpose || '-'}</td>
                  <th style={thStyle}>件数</th>
                  <td style={tdStyle}>{application.caseCount || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* コメント（必要理由 他） */}
          {commentText && (
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>コメント（必要理由 他）</div>
              <div style={{ padding: '12px', background: '#FAFAFA', borderRadius: '4px', border: '1px solid #E1E1E1', whiteSpace: 'pre-wrap' }}>
                {commentText}
              </div>
            </div>
          )}

          {/* 添付ファイル */}
          {application.attachedFiles && application.attachedFiles.length > 0 && (
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>添付ファイル</div>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {application.attachedFiles.map((file, index) => (
                  <li key={index} style={{ padding: '4px 0' }}>{file}</li>
                ))}
              </ul>
            </div>
          )}

          {/* システム接続要望 */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>システム接続要望</div>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <th style={thStyle}>接続要望</th>
                  <td style={tdStyle}>
                    {application.requestConnectionStatus === 'wired'
                      ? '有線接続'
                      : application.requestConnectionStatus === 'wireless'
                        ? '無線接続'
                        : application.requestConnectionStatus || '接続不要'}
                  </td>
                  <th style={thStyle}>接続先</th>
                  <td style={tdStyle}>{application.requestConnectionDestination || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* フッター */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E1E1E1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#FAFAFA',
          }}
        >
          <div>
            {application.status === '申請中' && (
              <button
                onClick={() => {
                  onReject(application.id);
                  onClose();
                }}
                style={{
                  padding: '10px 20px',
                  background: '#DA0000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                却下
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => window.print()}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#4A4A4A',
                border: '2px solid #4A4A4A',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              印刷
            </button>
            <button
              onClick={() => alert('添付ファイルダウンロード機能は今後実装予定です')}
              style={{
                padding: '10px 20px',
                background: '#4A4A4A',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              添付ファイルDL
            </button>
            <button
              onClick={() => {
                onAddToEditList(application.id);
                onClose();
              }}
              style={{
                padding: '10px 20px',
                background: '#4A4A4A',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              編集リストへ追加
            </button>
            {/* REQ-043: フッターにキャンセルを追加 */}
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#4A4A4A',
                border: '2px solid #E1E1E1',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
