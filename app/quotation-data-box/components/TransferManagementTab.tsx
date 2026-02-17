'use client';

import React, { useState, useMemo } from 'react';
import { useApplicationStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ApplicationStatus } from '@/lib/types';

interface TransferApplication {
  id: number;
  applicationNo: string;
  applicationDate: string;
  assetName: string;
  model: string;
  // 現設置場所
  currentDepartment: string;
  currentSection: string;
  currentRoomName?: string;
  // 移動先
  destDepartment: string;
  destSection: string;
  destRoomName: string;
  // その他
  status: ApplicationStatus;
  comment?: string;
}

export function TransferManagementTab() {
  const { applications, updateApplication } = useApplicationStore();

  // フィルター状態
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');

  // 詳細モーダル
  const [selectedApplication, setSelectedApplication] = useState<TransferApplication | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 移動申請をフィルタリング
  const transferApplications = useMemo(() => {
    return applications
      .filter(app => app.applicationType === '移動申請')
      .map(app => ({
        id: app.id,
        applicationNo: app.applicationNo,
        applicationDate: app.applicationDate,
        assetName: app.asset.name,
        model: app.asset.model,
        currentDepartment: app.facility.department,
        currentSection: app.facility.section,
        currentRoomName: app.roomName,
        destDepartment: app.transferDestination?.department || '',
        destSection: app.transferDestination?.section || '',
        destRoomName: app.transferDestination?.roomName || '',
        status: app.status,
        comment: app.freeInput,
      }));
  }, [applications]);

  // フィルター適用
  const filteredApplications = useMemo(() => {
    return transferApplications.filter(app => {
      if (filterStatus && app.status !== filterStatus) return false;
      if (filterDepartment && app.currentDepartment !== filterDepartment) return false;
      return true;
    });
  }, [transferApplications, filterStatus, filterDepartment]);

  // 部門オプション
  const departmentOptions = useMemo(() => {
    const departments = new Set(transferApplications.map(app => app.currentDepartment));
    return Array.from(departments).filter(Boolean);
  }, [transferApplications]);

  // ステータスオプション
  const statusOptions = ['承認待ち', '移動完了'];

  // 移動承認
  const handleApproveTransfer = (app: TransferApplication) => {
    setSelectedApplication(app);
    setIsDetailModalOpen(true);
  };

  // 承認確定
  const handleConfirmApproval = () => {
    if (!selectedApplication) return;

    updateApplication(selectedApplication.id, { status: '移動完了' });
    setIsDetailModalOpen(false);
    setSelectedApplication(null);
    alert('移動申請を承認しました。原本に反映されます。');
  };

  // フィルタークリア
  const handleClearFilters = () => {
    setFilterStatus('');
    setFilterDepartment('');
  };

  // ステータスバッジの色
  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case '承認待ち': return { bg: '#fff3e0', color: '#e65100' };
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
              現設置部門
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
              <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>申請日</th>
              <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>資産名</th>
              <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>型式</th>
              <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>現設置場所</th>
              <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>移動先</th>
              <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>ステータス</th>
              <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
                  移動申請データがありません
                </td>
              </tr>
            ) : (
              filteredApplications.map((app) => {
                const statusColor = getStatusColor(app.status);
                return (
                  <tr key={app.id} style={{ background: 'white' }}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{app.applicationNo}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{app.applicationDate}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{app.assetName}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{app.model}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {app.currentDepartment} / {app.currentSection}
                      {app.currentRoomName && ` / ${app.currentRoomName}`}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd', color: '#1565c0' }}>
                      {app.destDepartment} / {app.destSection} / {app.destRoomName}
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
                      {app.status === '承認待ち' ? (
                        <button
                          onClick={() => handleApproveTransfer(app)}
                          style={{
                            padding: '6px 16px',
                            background: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        >
                          承認
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#666' }}>完了</span>
                      )}
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
        {filteredApplications.length} 件表示 / 全 {transferApplications.length} 件
      </div>

      {/* 承認確認モーダル */}
      {isDetailModalOpen && selectedApplication && (
        <div
          onClick={() => setIsDetailModalOpen(false)}
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
              maxWidth: '600px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{
              background: '#4caf50',
              padding: '16px',
              borderRadius: '8px 8px 0 0',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
            }}>
              移動申請の承認
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ fontSize: '14px', marginBottom: '20px', color: '#333' }}>
                以下の移動申請を承認し、原本に反映してよろしいですか？
              </p>

              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>申請No:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', marginLeft: '8px' }}>{selectedApplication.applicationNo}</span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>資産:</span>
                  <span style={{ fontSize: '14px', marginLeft: '8px' }}>{selectedApplication.assetName} ({selectedApplication.model})</span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>現設置場所:</span>
                  <span style={{ fontSize: '14px', marginLeft: '8px' }}>
                    {selectedApplication.currentDepartment} / {selectedApplication.currentSection}
                    {selectedApplication.currentRoomName && ` / ${selectedApplication.currentRoomName}`}
                  </span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>移動先:</span>
                  <span style={{ fontSize: '14px', marginLeft: '8px', color: '#1565c0', fontWeight: 'bold' }}>
                    {selectedApplication.destDepartment} / {selectedApplication.destSection} / {selectedApplication.destRoomName}
                  </span>
                </div>
                {selectedApplication.comment && (
                  <div>
                    <span style={{ fontSize: '12px', color: '#666' }}>コメント:</span>
                    <p style={{ fontSize: '13px', marginTop: '4px', marginBottom: 0, color: '#555' }}>{selectedApplication.comment}</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  style={{
                    padding: '10px 24px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirmApproval}
                  style={{
                    padding: '10px 24px',
                    background: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  承認して原本に反映
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
