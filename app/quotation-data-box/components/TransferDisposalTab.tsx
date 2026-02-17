'use client';

import React, { useState, useMemo } from 'react';
import { useApplicationStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ApplicationStatus } from '@/lib/types';

interface TransferDisposalApplication {
  id: number;
  applicationNo: string;
  applicationDate: string;
  applicationType: '移動申請' | '廃棄申請';
  assetName: string;
  model: string;
  department: string;
  section: string;
  roomName?: string;
  status: ApplicationStatus;
  // 移動申請用
  transferDestination?: {
    department: string;
    section: string;
    roomName: string;
  };
  // 廃棄申請用
  disposalVendor?: string;
  disposalQuotationDate?: string;
  disposalOrderDate?: string;
  disposalAcceptanceDate?: string;
  disposalDocuments?: string[];
  comment?: string;
}

export function TransferDisposalTab() {
  const { applications, updateApplication } = useApplicationStore();

  // フィルター状態
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');

  // 詳細モーダル
  const [selectedApplication, setSelectedApplication] = useState<TransferDisposalApplication | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 廃棄業者登録モーダル
  const [isDisposalVendorModalOpen, setIsDisposalVendorModalOpen] = useState(false);
  const [disposalVendorForm, setDisposalVendorForm] = useState({
    vendor: '',
    quotationDate: '',
    orderDate: '',
    acceptanceDate: '',
  });

  // 移動申請と廃棄申請をフィルタリング
  const transferDisposalApplications = useMemo(() => {
    return applications
      .filter(app => app.applicationType === '移動申請' || app.applicationType === '廃棄申請')
      .map(app => ({
        id: app.id,
        applicationNo: app.applicationNo,
        applicationDate: app.applicationDate,
        applicationType: app.applicationType as '移動申請' | '廃棄申請',
        assetName: app.asset.name,
        model: app.asset.model,
        department: app.facility.department,
        section: app.facility.section,
        roomName: app.roomName,
        status: (app.status || '承認待ち') as ApplicationStatus,
        transferDestination: app.transferDestination,
        comment: app.freeInput,
      }));
  }, [applications]);

  // フィルター適用
  const filteredApplications = useMemo(() => {
    return transferDisposalApplications.filter(app => {
      if (filterType && app.applicationType !== filterType) return false;
      if (filterStatus && app.status !== filterStatus) return false;
      if (filterDepartment && app.department !== filterDepartment) return false;
      return true;
    });
  }, [transferDisposalApplications, filterType, filterStatus, filterDepartment]);

  // 部門オプション
  const departmentOptions = useMemo(() => {
    const departments = new Set(transferDisposalApplications.map(app => app.department));
    return Array.from(departments).filter(Boolean);
  }, [transferDisposalApplications]);

  // ステータスオプション
  const statusOptions = ['承認待ち', '承認済み', '見積依頼中', '発注済み', '検収済み', '廃棄完了', '移動完了'];

  // 移動承認
  const handleApproveTransfer = (app: TransferDisposalApplication) => {
    if (window.confirm(`移動申請「${app.applicationNo}」を承認し、原本に反映しますか？\n\n移動先：${app.transferDestination?.department} / ${app.transferDestination?.section} / ${app.transferDestination?.roomName}`)) {
      updateApplication(app.id, { status: '移動完了' });
      alert('移動申請を承認し、原本に反映しました。');
    }
  };

  // 廃棄業者見積依頼
  const handleDisposalQuotationRequest = (app: TransferDisposalApplication) => {
    setSelectedApplication(app);
    setIsDisposalVendorModalOpen(true);
  };

  // 廃棄業者情報保存
  const handleSaveDisposalVendor = () => {
    if (!selectedApplication) return;

    // ステータス更新ロジック
    let newStatus: ApplicationStatus = '見積依頼中';
    if (disposalVendorForm.acceptanceDate) {
      newStatus = '検収済み';
    } else if (disposalVendorForm.orderDate) {
      newStatus = '発注済み';
    } else if (disposalVendorForm.quotationDate) {
      newStatus = '見積依頼中';
    }

    updateApplication(selectedApplication.id, {
      status: newStatus,
      freeInput: `廃棄業者: ${disposalVendorForm.vendor}\n見積日: ${disposalVendorForm.quotationDate}\n発注日: ${disposalVendorForm.orderDate}\n検収日: ${disposalVendorForm.acceptanceDate}`,
    });

    setIsDisposalVendorModalOpen(false);
    setDisposalVendorForm({ vendor: '', quotationDate: '', orderDate: '', acceptanceDate: '' });
    alert('廃棄業者情報を保存しました。');
  };

  // 廃棄完了
  const handleCompleteDisposal = (app: TransferDisposalApplication) => {
    if (window.confirm(`廃棄申請「${app.applicationNo}」を完了にしますか？\n廃棄済ドキュメントを登録できます。`)) {
      updateApplication(app.id, { status: '廃棄完了' });
      alert('廃棄を完了しました。');
    }
  };

  // フィルタークリア
  const handleClearFilters = () => {
    setFilterType('');
    setFilterStatus('');
    setFilterDepartment('');
  };

  // ステータスバッジの色
  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case '承認待ち': return { bg: '#fff3e0', color: '#e65100' };
      case '承認済み': return { bg: '#e3f2fd', color: '#1565c0' };
      case '見積依頼中': return { bg: '#fce4ec', color: '#c2185b' };
      case '発注済み': return { bg: '#e8f5e9', color: '#2e7d32' };
      case '検収済み': return { bg: '#e0f2f1', color: '#00695c' };
      case '廃棄完了': return { bg: '#f3e5f5', color: '#7b1fa2' };
      case '移動完了': return { bg: '#e8eaf6', color: '#3f51b5' };
      default: return { bg: '#f5f5f5', color: '#666' };
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* フィルターエリア */}
      <div style={{
        background: '#f8f9fa',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px',
        border: '1px solid #e0e0e0',
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              申請種別
            </label>
            <SearchableSelect
              value={filterType}
              onChange={setFilterType}
              options={['移動申請', '廃棄申請']}
              placeholder="すべて"
            />
          </div>

          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              ステータス
            </label>
            <SearchableSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={statusOptions}
              placeholder="すべて"
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              部門
            </label>
            <SearchableSelect
              value={filterDepartment}
              onChange={setFilterDepartment}
              options={departmentOptions}
              placeholder="すべて"
            />
          </div>

          <button
            onClick={handleClearFilters}
            style={{
              padding: '8px 16px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            クリア
          </button>
        </div>
      </div>

      {/* テーブルエリア */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>申請No</th>
              <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>申請種別</th>
              <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>申請日</th>
              <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>資産名</th>
              <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>型式</th>
              <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>現設置場所</th>
              <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>移動先/備考</th>
              <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>ステータス</th>
              <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
                  データがありません
                </td>
              </tr>
            ) : (
              filteredApplications.map((app) => {
                const statusColor = getStatusColor(app.status);
                return (
                  <tr key={app.id} style={{ background: 'white' }}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{app.applicationNo}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: app.applicationType === '移動申請' ? '#e3f2fd' : '#ffebee',
                        color: app.applicationType === '移動申請' ? '#1565c0' : '#c62828',
                      }}>
                        {app.applicationType}
                      </span>
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{app.applicationDate}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{app.assetName}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{app.model}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {app.department} / {app.section} / {app.roomName}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {app.applicationType === '移動申請' && app.transferDestination ? (
                        <span style={{ color: '#1565c0' }}>
                          {app.transferDestination.department} / {app.transferDestination.section} / {app.transferDestination.roomName}
                        </span>
                      ) : (
                        <span style={{ color: '#666', fontSize: '12px' }}>{app.comment || '-'}</span>
                      )}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        background: statusColor.bg,
                        color: statusColor.color,
                        fontWeight: 'bold',
                      }}>
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {/* 移動申請：承認待ちの場合 */}
                        {app.applicationType === '移動申請' && app.status === '承認待ち' && (
                          <button
                            onClick={() => handleApproveTransfer(app)}
                            style={{
                              padding: '4px 10px',
                              background: '#4caf50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            承認
                          </button>
                        )}

                        {/* 廃棄申請：承認待ちの場合 */}
                        {app.applicationType === '廃棄申請' && app.status === '承認待ち' && (
                          <button
                            onClick={() => {
                              updateApplication(app.id, { status: '承認済み' });
                            }}
                            style={{
                              padding: '4px 10px',
                              background: '#2196f3',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            承認
                          </button>
                        )}

                        {/* 廃棄申請：承認済み～検収済みの場合 */}
                        {app.applicationType === '廃棄申請' && ['承認済み', '見積依頼中', '発注済み', '検収済み'].includes(app.status) && (
                          <>
                            <button
                              onClick={() => handleDisposalQuotationRequest(app)}
                              style={{
                                padding: '4px 10px',
                                background: '#ff9800',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                              }}
                            >
                              業者管理
                            </button>
                            {app.status === '検収済み' && (
                              <button
                                onClick={() => handleCompleteDisposal(app)}
                                style={{
                                  padding: '4px 10px',
                                  background: '#9c27b0',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                }}
                              >
                                廃棄完了
                              </button>
                            )}
                          </>
                        )}

                        {/* 完了ステータスの場合 */}
                        {(app.status === '移動完了' || app.status === '廃棄完了') && (
                          <span style={{ fontSize: '12px', color: '#666' }}>完了</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 件数表示 */}
      <div style={{ marginTop: '16px', fontSize: '13px', color: '#666' }}>
        {filteredApplications.length} 件表示 / 全 {transferDisposalApplications.length} 件
      </div>

      {/* 廃棄業者登録モーダル */}
      {isDisposalVendorModalOpen && selectedApplication && (
        <div
          onClick={() => setIsDisposalVendorModalOpen(false)}
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
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{
              background: '#ff9800',
              padding: '16px',
              borderRadius: '8px 8px 0 0',
              color: 'white',
              fontWeight: 'bold',
            }}>
              廃棄業者管理
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                  対象資産: {selectedApplication.assetName} ({selectedApplication.model})
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                  廃棄業者名
                </label>
                <input
                  type="text"
                  value={disposalVendorForm.vendor}
                  onChange={(e) => setDisposalVendorForm(prev => ({ ...prev, vendor: e.target.value }))}
                  placeholder="業者名を入力"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                  見積依頼日
                </label>
                <input
                  type="date"
                  value={disposalVendorForm.quotationDate}
                  onChange={(e) => setDisposalVendorForm(prev => ({ ...prev, quotationDate: e.target.value }))}
                  style={{
                    width: '180px',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                  発注日
                </label>
                <input
                  type="date"
                  value={disposalVendorForm.orderDate}
                  onChange={(e) => setDisposalVendorForm(prev => ({ ...prev, orderDate: e.target.value }))}
                  style={{
                    width: '180px',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                  検収日
                </label>
                <input
                  type="date"
                  value={disposalVendorForm.acceptanceDate}
                  onChange={(e) => setDisposalVendorForm(prev => ({ ...prev, acceptanceDate: e.target.value }))}
                  style={{
                    width: '180px',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsDisposalVendorModalOpen(false)}
                  style={{
                    padding: '8px 24px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveDisposalVendor}
                  style={{
                    padding: '8px 24px',
                    background: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
