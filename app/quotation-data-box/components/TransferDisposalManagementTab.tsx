'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

// 廃棄・移動のステータス（新ステータス体系）
type DisposalStatus = '新規申請' | '見積依頼済' | '発注用見積登録済' | '発注済' | '納期確定' | '検収済' | '完了' | '申請見送り';

// 統合申請データ型
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
  status: DisposalStatus;
  // ステータス連動の期限フィールド
  quotationDeadline: string | null;   // 見積提出期限
  orderDeadline: string | null;       // 発注期限
  orderDate: string | null;           // 発注日
  disposalDate: string | null;        // 廃棄・移動日
  // 移動先情報（移動申請用）
  destDepartment: string;
  destSection: string;
  destRoomName: string;
}

// ステータスに応じたAction名
const getActionName = (status: DisposalStatus): string => {
  switch (status) {
    case '新規申請': return '新規受付';
    case '見積依頼済': return '見積依頼・登録';
    case '発注用見積登録済': return '見積依頼・登録';
    case '発注済': return '発注登録';
    case '納期確定': return '納期登録';
    case '検収済': return '完了登録';
    case '完了': return '除却（移動）登録';
    case '申請見送り': return '-';
  }
};

// ステータスに応じた期限表示
const getDeadlineInfo = (app: UnifiedApplication): { label: string; date: string } | null => {
  switch (app.status) {
    case '見積依頼済':
      return app.quotationDeadline ? { label: '見積提出期限', date: app.quotationDeadline } : null;
    case '発注用見積登録済':
      return app.orderDeadline ? { label: '発注期限', date: app.orderDeadline } : null;
    case '発注済':
      return app.orderDate ? { label: '発注日', date: app.orderDate } : null;
    case '納期確定':
      return app.disposalDate ? { label: '廃棄・移動日', date: app.disposalDate } : null;
    default:
      return null;
  }
};

// ステータスバッジの色
const getStatusColor = (status: DisposalStatus): string => {
  switch (status) {
    case '新規申請': return '#3498db';
    case '見積依頼済': return '#2980b9';
    case '発注用見積登録済': return '#27ae60';
    case '発注済': return '#8e44ad';
    case '納期確定': return '#e67e22';
    case '検収済': return '#d35400';
    case '完了': return '#7f8c8d';
    case '申請見送り': return '#e74c3c';
  }
};

// モックデータ
const MOCK_APPLICATIONS: UnifiedApplication[] = [
  {
    id: 101, applicationType: '廃棄申請', applicationNo: 'DSP-2026-001', applicationDate: '2026-02-10',
    applicantDepartment: 'ME室', applicantName: '山田 太郎', applicantContact: '内線1234',
    department: '診療技術部', section: 'ME室', roomName: 'ME機器管理室',
    itemName: '心電計', maker: '日本光電', model: 'ECG-2550',
    comment: '耐用年数超過のため廃棄', status: '新規申請',
    quotationDeadline: null, orderDeadline: null, orderDate: null, disposalDate: null,
    destDepartment: '', destSection: '', destRoomName: '',
  },
  {
    id: 102, applicationType: '廃棄申請', applicationNo: 'DSP-2026-002', applicationDate: '2026-02-08',
    applicantDepartment: '放射線科', applicantName: '佐藤 花子', applicantContact: '内線5678',
    department: '診療技術部', section: '放射線科', roomName: 'CT室',
    itemName: '超音波診断装置', maker: 'GEヘルスケア', model: 'LOGIQ S8',
    comment: '故障頻発のため廃棄', status: '見積依頼済',
    quotationDeadline: '2026-03-15', orderDeadline: null, orderDate: null, disposalDate: null,
    destDepartment: '', destSection: '', destRoomName: '',
  },
  {
    id: 103, applicationType: '廃棄申請', applicationNo: 'DSP-2026-003', applicationDate: '2026-02-05',
    applicantDepartment: '検査科', applicantName: '鈴木 一郎', applicantContact: '内線9012',
    department: '診療技術部', section: '検査科', roomName: '生理検査室',
    itemName: '血液ガス分析装置', maker: 'ラジオメーター', model: 'ABL90 FLEX',
    comment: '部品供給終了', status: '発注用見積登録済',
    quotationDeadline: null, orderDeadline: '2026-03-20', orderDate: null, disposalDate: null,
    destDepartment: '', destSection: '', destRoomName: '',
  },
  {
    id: 104, applicationType: '廃棄申請', applicationNo: 'DSP-2026-004', applicationDate: '2026-01-28',
    applicantDepartment: '看護部', applicantName: '田中 美咲', applicantContact: '内線3456',
    department: '看護部', section: '外来', roomName: '処置室',
    itemName: '輸液ポンプ', maker: 'テルモ', model: 'TE-LM700',
    comment: '使用不可', status: '発注済',
    quotationDeadline: null, orderDeadline: null, orderDate: '2026-02-25', disposalDate: null,
    destDepartment: '', destSection: '', destRoomName: '',
  },
  {
    id: 105, applicationType: '廃棄申請', applicationNo: 'DSP-2026-005', applicationDate: '2026-01-20',
    applicantDepartment: '医事課', applicantName: '高橋 健太', applicantContact: '内線7890',
    department: '事務部', section: '医事課', roomName: '受付',
    itemName: 'パルスオキシメータ', maker: 'コニカミノルタ', model: 'PULSOX-Neo',
    comment: '老朽化', status: '納期確定',
    quotationDeadline: null, orderDeadline: null, orderDate: null, disposalDate: '2026-03-10',
    destDepartment: '', destSection: '', destRoomName: '',
  },
  {
    id: 106, applicationType: '移動申請', applicationNo: 'TRN-2026-001', applicationDate: '2026-02-12',
    applicantDepartment: '手術部', applicantName: '手部 術太郎', applicantContact: '内線2222',
    department: '診療技術部', section: '手術部', roomName: '手術室1',
    itemName: '電気メス', maker: 'コヴィディエン', model: 'ForceTriad',
    comment: '4月からの部署統合に伴い移動', status: '新規申請',
    quotationDeadline: null, orderDeadline: null, orderDate: null, disposalDate: null,
    destDepartment: '内科', destSection: '検査室', destRoomName: '内科検査室1',
  },
  {
    id: 107, applicationType: '移動申請', applicationNo: 'TRN-2026-002', applicationDate: '2026-02-15',
    applicantDepartment: '検査科', applicantName: '山田 花子', applicantContact: '内線3456',
    department: '診療技術部', section: '検査科', roomName: '生理検査室',
    itemName: '超音波診断装置', maker: 'キヤノンメディカル', model: 'Aplio i800',
    comment: '新棟への移転', status: '新規申請',
    quotationDeadline: null, orderDeadline: null, orderDate: null, disposalDate: null,
    destDepartment: '外来', destSection: '超音波室', destRoomName: '超音波室2',
  },
];

export function TransferDisposalManagementTab() {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
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

  // ステータスオプション
  const statusOptions: DisposalStatus[] = ['新規申請', '見積依頼済', '発注用見積登録済', '発注済', '納期確定', '検収済', '完了', '申請見送り'];
  const typeOptions = ['移動申請', '廃棄申請'];

  // 部署オプション
  const departmentOptions = useMemo(() => {
    return [...new Set(MOCK_APPLICATIONS.map(a => a.applicantDepartment).filter(Boolean))];
  }, []);

  // 未処理件数
  const pendingCount = useMemo(() => {
    return MOCK_APPLICATIONS.filter(a => a.status === '新規申請').length;
  }, []);

  // フィルタリング
  const filteredApplications = useMemo(() => {
    return MOCK_APPLICATIONS.filter(app => {
      if (statusFilter && app.status !== statusFilter) return false;
      if (departmentFilter && app.applicantDepartment !== departmentFilter) return false;
      if (typeFilter && app.applicationType !== typeFilter) return false;
      return true;
    }).sort((a, b) => a.applicationDate.localeCompare(b.applicationDate));
  }, [statusFilter, departmentFilter, typeFilter]);

  // 全選択/解除
  const handleSelectAll = () => {
    if (selectedIds.size === filteredApplications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApplications.map(a => a.id)));
    }
  };

  const handleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) { newSelected.delete(id); } else { newSelected.add(id); }
    setSelectedIds(newSelected);
  };

  // 移動承認
  const handleApproveTransfer = (app: UnifiedApplication) => {
    setOpenDropdownId(null);
    setSelectedApplication(app);
    setIsApprovalModalOpen(true);
  };

  const handleConfirmApproval = () => {
    if (!selectedApplication) return;
    setIsApprovalModalOpen(false);
    setSelectedApplication(null);
    alert('移動申請を承認しました。原本に反映されます。');
  };

  // タスク画面へ遷移
  const handleOpenTask = (id: number) => {
    setOpenDropdownId(null);
    router.push(`/disposal-task?id=${id}`);
  };

  // 申請内容確認
  const handleViewDetail = (app: UnifiedApplication) => {
    setOpenDropdownId(null);
    if (app.applicationType === '移動申請') {
      handleApproveTransfer(app);
    } else {
      handleOpenTask(app.id);
    }
  };

  // テーブルスタイル
  const thStyle: React.CSSProperties = {
    padding: '8px 10px',
    border: '1px solid #ccc',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: '12px',
    whiteSpace: 'nowrap',
    background: '#2c5f2c',
    color: 'white',
  };

  const tdStyle: React.CSSProperties = {
    padding: '8px 10px',
    border: '1px solid #ddd',
    fontSize: '12px',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 申請受付ヘッダー */}
      <div style={{
        background: '#27ae60',
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white',
      }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>申請受付</span>
        <span style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          未処理: {pendingCount}件
        </span>
      </div>

      {/* フィルターエリア */}
      <div style={{ background: '#f8f9fa', padding: '12px 16px', borderBottom: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: '140px' }}>
            <SearchableSelect
              label="ステータスで絞り込む"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              placeholder="すべて"
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="申請部署"
              value={departmentFilter}
              onChange={setDepartmentFilter}
              options={departmentOptions}
              placeholder="すべて"
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="申請種別"
              value={typeFilter}
              onChange={setTypeFilter}
              options={typeOptions}
              placeholder="すべて"
            />
          </div>
          <button
            onClick={() => { setStatusFilter(''); setDepartmentFilter(''); setTypeFilter(''); }}
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
      </div>

      {/* テーブルエリア */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredApplications.length && filteredApplications.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th style={thStyle}>申請No.</th>
                <th style={thStyle}>種別</th>
                <th style={thStyle}>申請者</th>
                <th style={thStyle}>部署</th>
                <th style={thStyle}>申請日</th>
                <th style={thStyle}>対象資産</th>
                <th style={thStyle}>ステータス</th>
                <th style={thStyle}>期限</th>
                <th style={thStyle}>Action</th>
                <th style={{ ...thStyle, width: '80px', textAlign: 'center' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '40px', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
                    申請データがありません
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app, index) => {
                  const deadlineInfo = getDeadlineInfo(app);
                  const statusColor = getStatusColor(app.status);
                  const actionName = getActionName(app.status);
                  const rowBg = index % 2 === 0 ? 'white' : '#fafafa';

                  return (
                    <tr key={app.id} style={{ background: rowBg }}>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(app.id)}
                          onChange={() => handleSelect(app.id)}
                        />
                      </td>
                      <td style={{ ...tdStyle, color: '#1565c0', cursor: 'pointer' }}
                          onClick={() => handleViewDetail(app)}>
                        {app.applicationNo}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          background: app.applicationType === '移動申請' ? '#fff3e0' : '#fce4ec',
                          color: app.applicationType === '移動申請' ? '#e65100' : '#c62828',
                        }}>
                          {app.applicationType}
                        </span>
                      </td>
                      <td style={tdStyle}>{app.applicantName}</td>
                      <td style={tdStyle}>{app.applicantDepartment}</td>
                      <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums' }}>{app.applicationDate}</td>
                      <td style={tdStyle}>{app.itemName}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          background: statusColor,
                          color: 'white',
                        }}>
                          {app.status}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums' }}>
                        {deadlineInfo ? (
                          <div>
                            <div style={{ fontSize: '10px', color: '#666' }}>{deadlineInfo.label}</div>
                            <div style={{ fontWeight: 'bold' }}>{deadlineInfo.date}</div>
                          </div>
                        ) : '-'}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '11px', color: '#555' }}>{actionName}</span>
                      </td>
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
                            処理 <span style={{ fontSize: '9px' }}>&#9660;</span>
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
                              minWidth: '140px',
                            }}>
                              {app.applicationType === '移動申請' && (
                                <button
                                  onClick={() => handleApproveTransfer(app)}
                                  style={{
                                    display: 'block', width: '100%', padding: '8px 12px',
                                    background: 'none', border: 'none', textAlign: 'left',
                                    cursor: 'pointer', fontSize: '12px', color: '#2e7d32', fontWeight: 'bold',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                                >
                                  承認して原本に反映
                                </button>
                              )}
                              {app.applicationType === '廃棄申請' && (
                                <button
                                  onClick={() => handleOpenTask(app.id)}
                                  style={{
                                    display: 'block', width: '100%', padding: '8px 12px',
                                    background: 'none', border: 'none', textAlign: 'left',
                                    cursor: 'pointer', fontSize: '12px', color: '#1565c0', fontWeight: 'bold',
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

        {/* 選択件数 + 編集リストへ追加 */}
        <div style={{
          marginTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#666',
        }}>
          <span>選択した申請: {selectedIds.size}件</span>
          <button
            disabled={selectedIds.size === 0}
            style={{
              padding: '8px 20px',
              background: selectedIds.size > 0 ? '#e74c3c' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
          >
            編集リストへ追加
          </button>
        </div>
      </div>

      {/* 移動申請 承認確認モーダル */}
      {isApprovalModalOpen && selectedApplication && (
        <div
          onClick={() => setIsApprovalModalOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: '8px',
              width: '90%', maxWidth: '600px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{
              background: '#4caf50', padding: '16px',
              borderRadius: '8px 8px 0 0', color: 'white',
              fontWeight: 'bold', fontSize: '16px',
            }}>
              移動申請の承認
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ fontSize: '14px', marginBottom: '20px', color: '#333' }}>
                以下の移動申請を承認し、原本に反映してよろしいですか？
              </p>
              <div style={{
                background: '#f8f9fa', padding: '16px',
                borderRadius: '8px', marginBottom: '20px',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px 12px', fontSize: '13px' }}>
                  <span style={{ color: '#666' }}>申請No:</span>
                  <span style={{ fontWeight: 'bold' }}>{selectedApplication.applicationNo}</span>
                  <span style={{ color: '#666' }}>申請日:</span>
                  <span>{selectedApplication.applicationDate}</span>
                  <span style={{ color: '#666' }}>申請者:</span>
                  <span>{selectedApplication.applicantName}</span>
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
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => setIsApprovalModalOpen(false)}
                  style={{
                    padding: '10px 24px', background: '#6c757d', color: 'white',
                    border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px',
                  }}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirmApproval}
                  style={{
                    padding: '10px 24px', background: '#4caf50', color: 'white',
                    border: 'none', borderRadius: '4px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: 'bold',
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
