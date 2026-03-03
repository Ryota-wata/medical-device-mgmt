'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useApplicationStore } from '@/lib/stores';
import { ApplicationStatus, getApplicationTypeBadgeStyle } from '@/lib/types/application';

// モック院内担当情報
const MOCK_APPLICANTS = [
  { department: '医事課', name: '佐藤花子', contact: '内線1234' },
  { department: '看護部', name: '鈴木一郎', contact: '内線5678' },
  { department: '放射線科', name: '田中太郎', contact: '内線9012' },
  { department: '検査科', name: '山田花子', contact: '内線3456' },
];

interface UnifiedApplication {
  id: number;
  applicationType: '移動申請' | '廃棄申請';
  applicationNo: string;
  applicationDate: string;
  // 院内担当情報
  applicantDepartment: string;
  applicantName: string;
  applicantContact: string;
  // 設置情報
  department: string;
  section: string;
  roomName: string;
  // 品目情報
  itemName: string;
  maker: string;
  model: string;
  // コメント
  comment: string;
  status: ApplicationStatus;
  // 移動先情報（承認モーダル用）
  destDepartment: string;
  destSection: string;
  destRoomName: string;
}

interface UnifiedFilter {
  applicationType: string;
  status: string;
  department: string;
  section: string;
  maker: string;
  itemName: string;
}

export function TransferDisposalManagementTab() {
  const router = useRouter();
  const { applications, updateApplication } = useApplicationStore();

  const [filter, setFilter] = useState<UnifiedFilter>({
    applicationType: '',
    status: '',
    department: '',
    section: '',
    maker: '',
    itemName: '',
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedApplication, setSelectedApplication] = useState<UnifiedApplication | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    if (openDropdownId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  // 移動申請・廃棄申請を統一的なデータ型にマッピング
  const unifiedApplications = useMemo(() => {
    return applications
      .filter(app => app.applicationType === '移動申請' || app.applicationType === '廃棄申請')
      .map((app, index): UnifiedApplication => {
        const mockApplicant = MOCK_APPLICANTS[index % MOCK_APPLICANTS.length];
        return {
          id: app.id,
          applicationType: app.applicationType as '移動申請' | '廃棄申請',
          applicationNo: app.applicationNo,
          applicationDate: app.applicationDate,
          applicantDepartment: mockApplicant.department,
          applicantName: mockApplicant.name,
          applicantContact: mockApplicant.contact,
          department: app.facility.department,
          section: app.facility.section,
          roomName: app.roomName || '',
          itemName: app.asset.name,
          maker: app.vendor,
          model: app.asset.model,
          comment: app.freeInput,
          status: app.status,
          destDepartment: app.transferDestination?.department || '',
          destSection: app.transferDestination?.section || '',
          destRoomName: app.transferDestination?.roomName || '',
        };
      });
  }, [applications]);

  // フィルターオプション
  const applicationTypeOptions = ['移動申請', '廃棄申請'];
  const statusOptions: ApplicationStatus[] = ['承認待ち', '承認済み', '却下', '移動完了', '廃棄完了'];
  const departmentOptions = [...new Set(unifiedApplications.map(a => a.department).filter(Boolean))];
  const sectionOptions = [...new Set(unifiedApplications.map(a => a.section).filter(Boolean))];
  const makerOptions = [...new Set(unifiedApplications.map(a => a.maker).filter(Boolean))];
  const itemOptions = [...new Set(unifiedApplications.map(a => a.itemName).filter(Boolean))];

  // フィルタリング
  const filteredApplications = useMemo(() => {
    return unifiedApplications.filter(app => {
      if (filter.applicationType && app.applicationType !== filter.applicationType) return false;
      if (filter.status && app.status !== filter.status) return false;
      if (filter.department && app.department !== filter.department) return false;
      if (filter.section && app.section !== filter.section) return false;
      if (filter.maker && app.maker !== filter.maker) return false;
      if (filter.itemName && app.itemName !== filter.itemName) return false;
      return true;
    });
  }, [unifiedApplications, filter]);

  // 全選択/解除
  const handleSelectAll = () => {
    if (selectedIds.size === filteredApplications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApplications.map(a => a.id)));
    }
  };

  // 個別選択
  const handleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 移動承認モーダル表示
  const handleApproveTransfer = (app: UnifiedApplication) => {
    setOpenDropdownId(null);
    setSelectedApplication(app);
    setIsApprovalModalOpen(true);
  };

  // 承認確定
  const handleConfirmApproval = () => {
    if (!selectedApplication) return;
    updateApplication(selectedApplication.id, { status: '移動完了' });
    setIsApprovalModalOpen(false);
    setSelectedApplication(null);
    alert('移動申請を承認しました。原本に反映されます。');
  };

  // タスク画面へ遷移
  const handleOpenTask = (id: number) => {
    setOpenDropdownId(null);
    router.push(`/disposal-task?id=${id}`);
  };

  // フィルタークリア
  const handleClearFilter = () => {
    setFilter({
      applicationType: '',
      status: '',
      department: '',
      section: '',
      maker: '',
      itemName: '',
    });
  };

  // グループヘッダースタイル
  const groupThStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #4a6741',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '12px',
    color: 'white',
    background: '#2c5f2c',
    whiteSpace: 'nowrap',
  };

  // カラムヘッダースタイル
  const colThStyle: React.CSSProperties = {
    padding: '8px 6px',
    border: '1px solid #ccc',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: '12px',
    whiteSpace: 'nowrap',
    background: '#f0f0f0',
    color: '#333',
  };

  // データセルスタイル
  const tdStyle: React.CSSProperties = {
    padding: '8px 6px',
    border: '1px solid #ddd',
    fontSize: '12px',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* フィルターエリア */}
      <div style={{ background: '#f8f9fa', padding: '16px', borderBottom: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="申請種別"
              value={filter.applicationType}
              onChange={(value) => setFilter({ ...filter, applicationType: value })}
              options={applicationTypeOptions}
              placeholder="すべて"
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="ステータス"
              value={filter.status}
              onChange={(value) => setFilter({ ...filter, status: value })}
              options={statusOptions}
              placeholder="すべて"
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="設置部門"
              value={filter.department}
              onChange={(value) => setFilter({ ...filter, department: value })}
              options={departmentOptions}
              placeholder="すべて"
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="設置部署"
              value={filter.section}
              onChange={(value) => setFilter({ ...filter, section: value })}
              options={sectionOptions}
              placeholder="すべて"
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="メーカー"
              value={filter.maker}
              onChange={(value) => setFilter({ ...filter, maker: value })}
              options={makerOptions}
              placeholder="すべて"
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="品目"
              value={filter.itemName}
              onChange={(value) => setFilter({ ...filter, itemName: value })}
              options={itemOptions}
              placeholder="すべて"
            />
          </div>
          <button
            onClick={handleClearFilter}
            style={{
              padding: '8px 16px',
              background: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            クリア
          </button>
        </div>
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
          検索結果: {filteredApplications.length}件 / 全{unifiedApplications.length}件
          {selectedIds.size > 0 && ` （${selectedIds.size}件選択中）`}
        </div>
      </div>

      {/* テーブルエリア */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
            <thead>
              {/* グループヘッダー行 */}
              <tr>
                <th rowSpan={2} style={{ ...groupThStyle, width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredApplications.length && filteredApplications.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th colSpan={3} style={groupThStyle}>申請項目</th>
                <th colSpan={3} style={groupThStyle}>院内担当情報</th>
                <th colSpan={3} style={groupThStyle}>設置情報</th>
                <th colSpan={3} style={groupThStyle}>品目情報</th>
                <th colSpan={1} style={{ ...groupThStyle, minWidth: '200px' }}>コメント</th>
                <th rowSpan={2} style={{ ...groupThStyle, width: '80px' }}>操作</th>
              </tr>
              {/* カラムヘッダー行 */}
              <tr>
                {/* 申請項目 */}
                <th style={colThStyle}>申請No.</th>
                <th style={colThStyle}>申請日</th>
                <th style={colThStyle}>申請種別</th>
                {/* 院内担当情報 */}
                <th style={colThStyle}>所属部署</th>
                <th style={colThStyle}>氏名</th>
                <th style={colThStyle}>連絡先</th>
                {/* 設置情報 */}
                <th style={colThStyle}>部門名</th>
                <th style={colThStyle}>部署名</th>
                <th style={colThStyle}>室名</th>
                {/* 品目情報 */}
                <th style={colThStyle}>品目名</th>
                <th style={colThStyle}>メーカー名</th>
                <th style={colThStyle}>型式</th>
                {/* コメント */}
                <th style={colThStyle}>申請内容</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={15} style={{ padding: '40px', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
                    申請データがありません
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app, index) => {
                  const typeBadgeStyle = getApplicationTypeBadgeStyle(app.applicationType);
                  const rowBg = index % 2 === 0 ? 'white' : '#fafafa';

                  return (
                    <tr key={app.id} style={{ background: rowBg }}>
                      {/* チェックボックス */}
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(app.id)}
                          onChange={() => handleSelect(app.id)}
                        />
                      </td>
                      {/* 申請項目 */}
                      <td style={tdStyle}>{app.applicationNo}</td>
                      <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums' }}>{app.applicationDate}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          ...typeBadgeStyle,
                        }}>
                          {app.applicationType}
                        </span>
                      </td>
                      {/* 院内担当情報 */}
                      <td style={tdStyle}>{app.applicantDepartment}</td>
                      <td style={tdStyle}>{app.applicantName}</td>
                      <td style={tdStyle}>{app.applicantContact}</td>
                      {/* 設置情報 */}
                      <td style={tdStyle}>{app.department || '-'}</td>
                      <td style={tdStyle}>{app.section || '-'}</td>
                      <td style={tdStyle}>{app.roomName || '-'}</td>
                      {/* 品目情報 */}
                      <td style={tdStyle}>{app.itemName || '-'}</td>
                      <td style={tdStyle}>{app.maker || '-'}</td>
                      <td style={tdStyle}>{app.model || '-'}</td>
                      {/* コメント */}
                      <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={app.comment}>
                        {app.comment || '-'}
                      </td>
                      {/* 操作 */}
                      <td style={{ ...tdStyle, textAlign: 'center', position: 'relative' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }} ref={openDropdownId === app.id ? dropdownRef : undefined}>
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === app.id ? null : app.id)}
                            style={{
                              padding: '4px 10px',
                              background: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            処理
                            <span style={{ fontSize: '9px' }}>&#9660;</span>
                          </button>
                          {openDropdownId === app.id && (
                            <div style={{
                              position: 'absolute',
                              right: 0,
                              top: '100%',
                              marginTop: '2px',
                              background: 'white',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                              zIndex: 100,
                              minWidth: '120px',
                            }}>
                              {app.applicationType === '移動申請' && app.status === '承認待ち' && (
                                <button
                                  onClick={() => handleApproveTransfer(app)}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '8px 12px',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    color: '#2e7d32',
                                    fontWeight: 'bold',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                                >
                                  承認
                                </button>
                              )}
                              {app.applicationType === '廃棄申請' && (
                                <button
                                  onClick={() => handleOpenTask(app.id)}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '8px 12px',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    color: '#1565c0',
                                    fontWeight: 'bold',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                                >
                                  タスク表示
                                </button>
                              )}
                            </div>
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
      </div>

      {/* 承認確認モーダル */}
      {isApprovalModalOpen && selectedApplication && (
        <div
          onClick={() => setIsApprovalModalOpen(false)}
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

                  <span style={{ color: '#666' }}>設置部門:</span>
                  <span>{selectedApplication.department}</span>

                  <span style={{ color: '#666' }}>設置部署:</span>
                  <span>{selectedApplication.section}</span>

                  <span style={{ color: '#666' }}>設置室名:</span>
                  <span>{selectedApplication.roomName || '-'}</span>

                  <span style={{ color: '#666' }}>対象機器:</span>
                  <span>{selectedApplication.itemName} / {selectedApplication.maker} / {selectedApplication.model}</span>

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
                  onClick={() => setIsApprovalModalOpen(false)}
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
