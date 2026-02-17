'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useApplicationStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ApplicationStatus } from '@/lib/types';

interface DisposalApplication {
  id: number;
  applicationNo: string;
  applicationDate: string;
  applicant: string;
  department: string;
  section: string;
  roomName?: string;
  comment: string;
  attachedFiles?: string[];
  status: ApplicationStatus;
  // 廃棄業者情報（タスク管理用）
  disposalVendor?: string;
  quotationDate?: string;
  orderDate?: string;
  acceptanceDate?: string;
}

export function DisposalManagementTab() {
  const { applications, updateApplication } = useApplicationStore();

  // フィルター状態
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');

  // 業者管理モーダル
  const [selectedApplication, setSelectedApplication] = useState<DisposalApplication | null>(null);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    vendor: '',
    quotationDate: '',
    orderDate: '',
    acceptanceDate: '',
  });

  // ドキュメント登録モーダル
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [documents, setDocuments] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 廃棄申請をフィルタリング
  const disposalApplications = useMemo(() => {
    return applications
      .filter(app => app.applicationType === '廃棄申請')
      .map(app => {
        // freeInputから業者情報をパース
        const freeInput = app.freeInput || '';
        const vendorMatch = freeInput.match(/廃棄業者: (.+)/);
        const quotationMatch = freeInput.match(/見積日: (\d{4}-\d{2}-\d{2})?/);
        const orderMatch = freeInput.match(/発注日: (\d{4}-\d{2}-\d{2})?/);
        const acceptanceMatch = freeInput.match(/検収日: (\d{4}-\d{2}-\d{2})?/);
        const comment = freeInput.split('\n').filter(line => !line.match(/^(廃棄業者|見積日|発注日|検収日):/)).join('\n').trim();

        return {
          id: app.id,
          applicationNo: app.applicationNo,
          applicationDate: app.applicationDate,
          applicant: '手部 術太郎', // モーダルと同じ固定値
          department: app.facility.department,
          section: app.facility.section,
          roomName: app.roomName,
          comment: comment || app.applicationReason || '',
          attachedFiles: app.attachedFiles,
          status: app.status,
          disposalVendor: vendorMatch?.[1] || '',
          quotationDate: quotationMatch?.[1] || '',
          orderDate: orderMatch?.[1] || '',
          acceptanceDate: acceptanceMatch?.[1] || '',
        };
      });
  }, [applications]);

  // フィルター適用
  const filteredApplications = useMemo(() => {
    return disposalApplications.filter(app => {
      if (filterStatus && app.status !== filterStatus) return false;
      if (filterDepartment && app.department !== filterDepartment) return false;
      return true;
    });
  }, [disposalApplications, filterStatus, filterDepartment]);

  // 部門オプション
  const departmentOptions = useMemo(() => {
    const departments = new Set(disposalApplications.map(app => app.department));
    return Array.from(departments).filter(Boolean);
  }, [disposalApplications]);

  // ステータスオプション
  const statusOptions = ['承認待ち', '承認済み', '見積依頼中', '発注済み', '検収済み', '廃棄完了'];

  // 承認
  const handleApprove = (app: DisposalApplication) => {
    if (window.confirm(`廃棄申請「${app.applicationNo}」を承認しますか？`)) {
      updateApplication(app.id, { status: '承認済み' });
      alert('廃棄申請を承認しました。');
    }
  };

  // 業者管理モーダルを開く
  const handleOpenVendorModal = (app: DisposalApplication) => {
    setSelectedApplication(app);
    setVendorForm({
      vendor: app.disposalVendor || '',
      quotationDate: app.quotationDate || '',
      orderDate: app.orderDate || '',
      acceptanceDate: app.acceptanceDate || '',
    });
    setIsVendorModalOpen(true);
  };

  // 業者情報保存
  const handleSaveVendor = () => {
    if (!selectedApplication) return;

    // ステータス決定
    let newStatus: ApplicationStatus = '承認済み';
    if (vendorForm.acceptanceDate) {
      newStatus = '検収済み';
    } else if (vendorForm.orderDate) {
      newStatus = '発注済み';
    } else if (vendorForm.quotationDate) {
      newStatus = '見積依頼中';
    }

    // freeInput更新
    const baseComment = selectedApplication.comment || '';
    const vendorInfo = `廃棄業者: ${vendorForm.vendor}\n見積日: ${vendorForm.quotationDate}\n発注日: ${vendorForm.orderDate}\n検収日: ${vendorForm.acceptanceDate}`;
    const newFreeInput = baseComment ? `${baseComment}\n${vendorInfo}` : vendorInfo;

    updateApplication(selectedApplication.id, {
      status: newStatus,
      freeInput: newFreeInput,
    });

    setIsVendorModalOpen(false);
    setSelectedApplication(null);
    alert('廃棄業者情報を保存しました。');
  };

  // ドキュメント登録モーダルを開く
  const handleOpenDocumentModal = (app: DisposalApplication) => {
    setSelectedApplication(app);
    setDocuments([]);
    setIsDocumentModalOpen(true);
  };

  // ファイル選択
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newDocs = Array.from(files).map(f => f.name);
    setDocuments(prev => [...prev, ...newDocs]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ドキュメント削除
  const handleRemoveDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  // 廃棄完了
  const handleCompleteDisposal = () => {
    if (!selectedApplication) return;

    updateApplication(selectedApplication.id, { status: '廃棄完了' });
    setIsDocumentModalOpen(false);
    setSelectedApplication(null);
    alert('廃棄処理を完了しました。');
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
      case '承認済み': return { bg: '#e3f2fd', color: '#1565c0' };
      case '見積依頼中': return { bg: '#fce4ec', color: '#c2185b' };
      case '発注済み': return { bg: '#e8f5e9', color: '#2e7d32' };
      case '検収済み': return { bg: '#e0f2f1', color: '#00695c' };
      case '廃棄完了': return { bg: '#f3e5f5', color: '#7b1fa2' };
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
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>申請No</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>申請日</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>申請者</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>設置部門</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>設置部署</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>設置室名</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>コメント</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>添付ファイル</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' }}>廃棄業者</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>ステータス</th>
              <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', whiteSpace: 'nowrap' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ padding: '40px', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
                  廃棄申請データがありません
                </td>
              </tr>
            ) : (
              filteredApplications.map((app) => {
                const statusColor = getStatusColor(app.status);
                return (
                  <tr key={app.id} style={{ background: 'white' }}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{app.applicationNo}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{app.applicationDate}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{app.applicant}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{app.department}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{app.section}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{app.roomName || '-'}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', minWidth: '200px', maxWidth: '300px' }}>
                      <span style={{ display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {app.comment || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                      {app.attachedFiles && app.attachedFiles.length > 0 ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          background: '#e3f2fd',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#1565c0',
                        }}>
                          📎 {app.attachedFiles.length}件
                        </span>
                      ) : (
                        <span style={{ color: '#999' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {app.disposalVendor || <span style={{ color: '#999' }}>未登録</span>}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
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
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {/* 承認待ち */}
                        {app.status === '承認待ち' && (
                          <button
                            onClick={() => handleApprove(app)}
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

                        {/* 承認済み〜検収済み */}
                        {['承認済み', '見積依頼中', '発注済み', '検収済み'].includes(app.status) && (
                          <button
                            onClick={() => handleOpenVendorModal(app)}
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
                        )}

                        {/* 検収済み */}
                        {app.status === '検収済み' && (
                          <button
                            onClick={() => handleOpenDocumentModal(app)}
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

                        {/* 廃棄完了 */}
                        {app.status === '廃棄完了' && (
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
        {filteredApplications.length} 件表示 / 全 {disposalApplications.length} 件
      </div>

      {/* 業者管理モーダル */}
      {isVendorModalOpen && selectedApplication && (
        <div
          onClick={() => setIsVendorModalOpen(false)}
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
              maxWidth: '550px',
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
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '4px' }}>
                <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                  対象: {selectedApplication.applicationNo}
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                  廃棄業者名 <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="text"
                  value={vendorForm.vendor}
                  onChange={(e) => setVendorForm(prev => ({ ...prev, vendor: e.target.value }))}
                  placeholder="業者名を入力"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                    見積依頼日
                  </label>
                  <input
                    type="date"
                    value={vendorForm.quotationDate}
                    onChange={(e) => setVendorForm(prev => ({ ...prev, quotationDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                    発注日
                  </label>
                  <input
                    type="date"
                    value={vendorForm.orderDate}
                    onChange={(e) => setVendorForm(prev => ({ ...prev, orderDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                    検収日
                  </label>
                  <input
                    type="date"
                    value={vendorForm.acceptanceDate}
                    onChange={(e) => setVendorForm(prev => ({ ...prev, acceptanceDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsVendorModalOpen(false)}
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
                  onClick={handleSaveVendor}
                  disabled={!vendorForm.vendor}
                  style={{
                    padding: '10px 24px',
                    background: vendorForm.vendor ? '#ff9800' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: vendorForm.vendor ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
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

      {/* 廃棄完了・ドキュメント登録モーダル */}
      {isDocumentModalOpen && selectedApplication && (
        <div
          onClick={() => setIsDocumentModalOpen(false)}
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
              maxWidth: '550px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{
              background: '#9c27b0',
              padding: '16px',
              borderRadius: '8px 8px 0 0',
              color: 'white',
              fontWeight: 'bold',
            }}>
              廃棄完了・ドキュメント登録
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '4px' }}>
                <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                  対象: {selectedApplication.applicationNo}
                </p>
              </div>

              {/* ドキュメント登録 */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                  廃棄済ドキュメント登録
                </label>
                <div style={{
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '12px',
                }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="document-input"
                  />
                  <label
                    htmlFor="document-input"
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      background: '#f5f5f5',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    ファイルを選択
                  </label>
                  <span style={{ marginLeft: '12px', fontSize: '12px', color: '#666' }}>
                    廃棄証明書、マニフェスト等
                  </span>

                  {documents.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      {documents.map((doc, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px',
                            background: '#f8f9fa',
                            borderRadius: '4px',
                            marginBottom: '4px',
                          }}
                        >
                          <span style={{ fontSize: '13px' }}>{doc}</span>
                          <button
                            onClick={() => handleRemoveDocument(index)}
                            style={{
                              padding: '2px 8px',
                              background: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                            }}
                          >
                            削除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                padding: '12px',
                background: '#fff3e0',
                borderRadius: '4px',
                marginBottom: '24px',
              }}>
                <p style={{ fontSize: '13px', color: '#e65100', margin: 0 }}>
                  「廃棄完了」をクリックすると、この資産は廃棄済みとして処理されます。
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsDocumentModalOpen(false)}
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
                  onClick={handleCompleteDisposal}
                  style={{
                    padding: '10px 24px',
                    background: '#9c27b0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  廃棄完了
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
