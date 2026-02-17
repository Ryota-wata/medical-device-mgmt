'use client';

import React, { useState, useMemo } from 'react';
import { useApplicationStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface TransferApplication {
  id: number;
  applicationNo: string;
  applicationDate: string;
  applicant: string;
  // 設置場所（管理部署と同じ）
  department: string;
  section: string;
  roomName?: string;
  // 移動先
  destDepartment: string;
  destSection: string;
  destRoomName: string;
  // コメント
  comment?: string;
}

export function TransferManagementTab() {
  const { applications, updateApplication } = useApplicationStore();

  // フィルター状態
  const [filterDepartment, setFilterDepartment] = useState<string>('');

  // 詳細モーダル
  const [selectedApplication, setSelectedApplication] = useState<TransferApplication | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 移動申請をフィルタリング（承認待ちのみ表示）
  const transferApplications = useMemo(() => {
    return applications
      .filter(app => app.applicationType === '移動申請' && app.status === '承認待ち')
      .map(app => ({
        id: app.id,
        applicationNo: app.applicationNo,
        applicationDate: app.applicationDate,
        applicant: '手部 術太郎', // モーダルと同じ固定値
        department: app.facility.department,
        section: app.facility.section,
        roomName: app.roomName,
        destDepartment: app.transferDestination?.department || '',
        destSection: app.transferDestination?.section || '',
        destRoomName: app.transferDestination?.roomName || '',
        comment: app.freeInput,
      }));
  }, [applications]);

  // フィルター適用
  const filteredApplications = useMemo(() => {
    return transferApplications.filter(app => {
      if (filterDepartment && app.department !== filterDepartment) return false;
      return true;
    });
  }, [transferApplications, filterDepartment]);

  // 部門オプション
  const departmentOptions = useMemo(() => {
    const departments = new Set(transferApplications.map(app => app.department));
    return Array.from(departments).filter(Boolean);
  }, [transferApplications]);

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
    setFilterDepartment('');
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
          <div style={{ minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              設置部門
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
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>申請No</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>申請日</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>申請者</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>設置部門</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>設置部署</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>設置室名</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>移動先部門</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>移動先部署</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>移動先室名</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>コメント</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ padding: '40px', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
                  移動申請データがありません
                </td>
              </tr>
            ) : (
              filteredApplications.map((app, index) => (
                <tr key={app.id} style={{ background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{app.applicationNo}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{app.applicationDate}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{app.applicant}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{app.department}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{app.section}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{app.roomName || '-'}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', color: '#1565c0' }}>{app.destDepartment}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', color: '#1565c0' }}>{app.destSection}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', color: '#1565c0' }}>{app.destRoomName}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', minWidth: '200px', maxWidth: '300px' }}>
                    <span style={{ display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {app.comment || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
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
                  </td>
                </tr>
              ))
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
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px 12px', fontSize: '13px' }}>
                  <span style={{ color: '#666' }}>申請No:</span>
                  <span style={{ fontWeight: 'bold' }}>{selectedApplication.applicationNo}</span>

                  <span style={{ color: '#666' }}>申請日:</span>
                  <span>{selectedApplication.applicationDate}</span>

                  <span style={{ color: '#666' }}>申請者:</span>
                  <span>{selectedApplication.applicant}</span>

                  <span style={{ color: '#666' }}>設置部門:</span>
                  <span>{selectedApplication.department}</span>

                  <span style={{ color: '#666' }}>設置部署:</span>
                  <span>{selectedApplication.section}</span>

                  <span style={{ color: '#666' }}>設置室名:</span>
                  <span>{selectedApplication.roomName || '-'}</span>

                  <span style={{ color: '#666' }}>移動先部門:</span>
                  <span style={{ color: '#1565c0', fontWeight: 'bold' }}>{selectedApplication.destDepartment}</span>

                  <span style={{ color: '#666' }}>移動先部署:</span>
                  <span style={{ color: '#1565c0', fontWeight: 'bold' }}>{selectedApplication.destSection}</span>

                  <span style={{ color: '#666' }}>移動先室名:</span>
                  <span style={{ color: '#1565c0', fontWeight: 'bold' }}>{selectedApplication.destRoomName}</span>

                  {selectedApplication.comment && (
                    <>
                      <span style={{ color: '#666' }}>コメント:</span>
                      <span>{selectedApplication.comment}</span>
                    </>
                  )}
                </div>
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
