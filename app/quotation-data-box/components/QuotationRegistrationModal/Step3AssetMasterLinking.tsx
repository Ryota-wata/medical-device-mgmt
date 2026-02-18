import React, { useState } from 'react';
import { Application, RfqGroup } from '@/lib/types';
import { OCRResult, OCRResultItem, ConfirmedStateMap } from '@/lib/types/quotation';
import { ApplicationCreationModal, ApplicationFormData } from './ApplicationCreationModal';

interface Step3AssetMasterLinkingProps {
  ocrResult: OCRResult;
  rfqGroup?: RfqGroup;
  applications: Application[];
  confirmedState: ConfirmedStateMap;
  onCreateApplication: (formData: ApplicationFormData, ocrItem: OCRResultItem) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export const Step3AssetMasterLinking: React.FC<Step3AssetMasterLinkingProps> = ({
  ocrResult,
  rfqGroup,
  applications,
  onCreateApplication,
  onBack,
  onSubmit,
}) => {
  // 申請作成モーダルの状態
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedOcrItem, setSelectedOcrItem] = useState<OCRResultItem | null>(null);

  // 見積依頼グループに紐づいた申請を取得
  const linkedApplications = rfqGroup
    ? applications.filter(app => rfqGroup.applicationIds.includes(String(app.id)))
    : [];

  // 金額フォーマット
  const formatCurrency = (value: number) => `¥${value.toLocaleString()}`;

  const handleOpenApplicationModal = (ocrItem: OCRResultItem) => {
    setSelectedOcrItem(ocrItem);
    setShowApplicationModal(true);
  };

  const handleCloseApplicationModal = () => {
    setShowApplicationModal(false);
    setSelectedOcrItem(null);
  };

  const handleSubmitApplication = (formData: ApplicationFormData) => {
    if (selectedOcrItem) {
      onCreateApplication(formData, selectedOcrItem);
    }
    handleCloseApplicationModal();
  };

  return (
    <div>
      {/* 説明 */}
      <div style={{ marginBottom: '20px', padding: '14px', background: '#e3f2fd', borderRadius: '6px', border: '1px solid #90caf9' }}>
        <p style={{ margin: '0', fontSize: '12px', color: '#1565c0', lineHeight: '1.5' }}>
          以下の全ての明細が見積明細情報画面に登録されます。
        </p>
      </div>

      {/* 申請済み資産セクション */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{
          margin: '0 0 10px 0',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#2c3e50',
          borderLeft: '4px solid #27ae60',
          paddingLeft: '10px'
        }}>
          紐づく申請（{linkedApplications.length}件）
        </h4>
        <div style={{
          maxHeight: '150px',
          overflow: 'auto',
          border: '1px solid #ddd',
          borderRadius: '6px',
          background: '#fafafa'
        }}>
          {linkedApplications.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#95a5a6', fontSize: '13px' }}>
              紐づいた申請がありません
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
                <tr>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50', width: '100px' }}>申請No</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50', width: '80px' }}>種別</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>品目</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>型式</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>設置場所</th>
                </tr>
              </thead>
              <tbody>
                {linkedApplications.map((app) => (
                  <tr key={app.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', color: '#27ae60' }}>{app.applicationNo}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        background: app.applicationType === '新規申請' ? '#27ae60' :
                                   app.applicationType === '更新申請' ? '#e67e22' :
                                   app.applicationType === '増設申請' ? '#3498db' : '#95a5a6',
                        color: 'white',
                      }}>
                        {app.applicationType}
                      </span>
                    </td>
                    <td style={{ padding: '8px' }}>{app.asset.name}</td>
                    <td style={{ padding: '8px', color: '#555' }}>{app.asset.model}</td>
                    <td style={{ padding: '8px', color: '#555', fontSize: '10px' }}>
                      {app.facility.building} {app.facility.floor} {app.facility.department}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 登録される見積明細 */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{
          margin: '0 0 10px 0',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#2c3e50',
          borderLeft: '4px solid #9c27b0',
          paddingLeft: '10px'
        }}>
          登録される見積明細（{ocrResult.items.length}件）
        </h4>
        <div style={{ border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ maxHeight: '300px', overflowX: 'auto', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '900px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50', width: '40px' }}>No</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50' }}>品名</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>メーカー</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>型式</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50', width: '60px' }}>数量</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50', width: '100px' }}>税込金額</th>
                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#2c3e50', width: '80px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {ocrResult.items.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</td>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{item.itemName}</td>
                    <td style={{ padding: '8px', color: '#555' }}>{item.manufacturer || '-'}</td>
                    <td style={{ padding: '8px', color: '#555' }}>{item.model || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{item.quantity} {item.unit || ''}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(item.totalWithTax)}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleOpenApplicationModal(item)}
                        style={{
                          padding: '4px 10px',
                          background: '#9c27b0',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          fontWeight: 'bold',
                        }}
                      >
                        申請作成
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={onBack}
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
        >
          戻る
        </button>
        <button
          onClick={onSubmit}
          style={{
            padding: '10px 24px',
            background: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          登録確定
        </button>
      </div>

      {/* 申請作成モーダル */}
      {showApplicationModal && selectedOcrItem && (
        <ApplicationCreationModal
          show={showApplicationModal}
          ocrItem={selectedOcrItem}
          assetInfo={{
            category: '',
            majorCategory: '',
            middleCategory: '',
            assetName: selectedOcrItem.itemName,
            manufacturer: selectedOcrItem.manufacturer || '',
            model: selectedOcrItem.model || '',
          }}
          onSubmit={handleSubmitApplication}
          onClose={handleCloseApplicationModal}
        />
      )}
    </div>
  );
};
