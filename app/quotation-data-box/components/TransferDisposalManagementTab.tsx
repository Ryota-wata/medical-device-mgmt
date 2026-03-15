'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { RfqGroupModal } from '@/components/remodel/RfqGroupModal';

// ステータス体系（添付画像準拠）
type DisposalRfqStatus = '見積依頼' | '見積依頼済' | '見積登録済' | '発注済' | '作業日確定' | '完了' | '申請を見送る';

// 申請受付用データ型
interface PendingApplication {
  id: string;
  applicationNo: string;
  applicationType: '移動申請' | '廃棄申請';
  applicationDate: string;
  // 設置情報
  department: string;
  section: string;
  roomName: string;
  // 品目情報
  qrCode: string;
  itemName: string;
  maker: string;
  model: string;
  // 院内担当情報
  applicantDepartment: string;
  applicantName: string;
  applicantContact: string;
  // 移動先情報（移動申請用）
  destDepartment: string;
  destSection: string;
  destRoomName: string;
  comment: string;
}

// 見積依頼グループ用データ型
interface DisposalRfqGroup {
  id: number;
  rfqNo: string;
  groupName: string;
  vendorName: string;
  personInCharge: string;
  tel: string;
  status: DisposalRfqStatus;
  // 期限フィールド
  rfqDeadline: string | null;        // 見積提出期限
  orderDeadline: string | null;      // 発注期限
  disposalDate: string | null;       // 廃棄（移動）期日
  workDate: string | null;           // 廃棄・移動日
  rejectionDate: string | null;      // 却下日
}

// ステータスバッジ色
const STATUS_BADGE_COLORS: Record<DisposalRfqStatus, string> = {
  '見積依頼': '#95a5a6',
  '見積依頼済': '#3498db',
  '見積登録済': '#27ae60',
  '発注済': '#e67e22',
  '作業日確定': '#f1c40f',
  '完了': '#8e44ad',
  '申請を見送る': '#e74c3c',
};

// ステータス別の期限マッピング
interface DeadlineMapping {
  label: string;
  field: keyof Pick<DisposalRfqGroup, 'rfqDeadline' | 'orderDeadline' | 'disposalDate' | 'workDate' | 'rejectionDate'>;
}

const STATUS_DEADLINE_MAP: Partial<Record<DisposalRfqStatus, DeadlineMapping>> = {
  '見積依頼済': { label: '見積提出期限', field: 'rfqDeadline' },
  '見積登録済': { label: '発注期限', field: 'orderDeadline' },
  '発注済': { label: '廃棄（移動）期日', field: 'disposalDate' },
  '作業日確定': { label: '廃棄・移動日', field: 'workDate' },
  '申請を見送る': { label: '却下日', field: 'rejectionDate' },
};

// ステップタブ定義
type StepKey = 'all' | 'rfq' | 'quote' | 'order' | 'workdate' | 'complete';
// タブはActionで絞り込む（そのActionを実行できるステータスでフィルタ）
const STEP_TABS: { key: StepKey; label: string; statuses: DisposalRfqStatus[] }[] = [
  { key: 'all', label: 'すべて', statuses: [] },
  { key: 'rfq', label: '①見積依頼', statuses: ['見積依頼'] },             // Action: 見積依頼
  { key: 'quote', label: '②見積登録', statuses: ['見積依頼済'] },          // Action: 見積登録
  { key: 'order', label: '③発注登録', statuses: ['見積登録済'] },          // Action: 発注登録
  { key: 'workdate', label: '④作業日登録', statuses: ['発注済'] },         // Action: 作業日登録
  { key: 'complete', label: '⑤完了登録', statuses: ['作業日確定'] },       // Action: 完了登録
];

// 申請種別バッジスタイル
const getApplicationTypeStyle = (type: '移動申請' | '廃棄申請'): React.CSSProperties => ({
  background: type === '移動申請' ? '#fff3e0' : '#fce4ec',
  color: type === '移動申請' ? '#e65100' : '#c62828',
});

// --- モックデータ ---

const MOCK_PENDING_APPLICATIONS: PendingApplication[] = [
  {
    id: 'td-001', applicationNo: 'AP-2026-0101', applicationType: '廃棄申請',
    applicationDate: '2026-02-18',
    department: '診療技術部', section: 'ME室', roomName: 'ME機器管理室',
    qrCode: 'QR-00123', itemName: '心電計', maker: '日本光電', model: 'ECG-2550',
    applicantDepartment: 'ME室', applicantName: '山田 太郎', applicantContact: '内線1234',
    destDepartment: '', destSection: '', destRoomName: '',
    comment: '耐用年数超過のため廃棄',
  },
  {
    id: 'td-002', applicationNo: 'AP-2026-0102', applicationType: '廃棄申請',
    applicationDate: '2026-02-17',
    department: '診療技術部', section: '放射線科', roomName: '生理検査室',
    qrCode: 'QR-00456', itemName: '超音波診断装置', maker: 'GEヘルスケア', model: 'LOGIQ S8',
    applicantDepartment: '放射線科', applicantName: '佐藤 花子', applicantContact: '内線5678',
    destDepartment: '', destSection: '', destRoomName: '',
    comment: '故障頻発のため廃棄',
  },
  {
    id: 'td-003', applicationNo: 'AP-2026-0103', applicationType: '移動申請',
    applicationDate: '2026-02-16',
    department: '手術部', section: '手術室', roomName: '手術室1',
    qrCode: 'QR-00789', itemName: '電気メス', maker: 'コヴィディエン', model: 'ForceTriad',
    applicantDepartment: '手術部', applicantName: '鈴木 一郎', applicantContact: '内線9012',
    destDepartment: '内科', destSection: '検査室', destRoomName: '内科検査室1',
    comment: '4月からの部署統合に伴い移動',
  },
];

const MOCK_RFQ_GROUPS: DisposalRfqGroup[] = [
  {
    id: 1, rfqNo: 'RFQ-20260110-0001', groupName: 'ME室 心電計廃棄一式',
    vendorName: 'シーメンス・ジャパン', personInCharge: '山田太郎', tel: '03-1234-5678',
    status: '見積依頼済',
    rfqDeadline: '2026-03-20', orderDeadline: null, disposalDate: null, workDate: null, rejectionDate: null,
  },
  {
    id: 2, rfqNo: 'RFQ-20260111-0002', groupName: '放射線科 超音波装置廃棄',
    vendorName: 'GEヘルスケア', personInCharge: '鈴木一郎', tel: '03-2345-6789',
    status: '見積登録済',
    rfqDeadline: null, orderDeadline: '2026-03-25', disposalDate: null, workDate: null, rejectionDate: null,
  },
  {
    id: 3, rfqNo: 'RFQ-20260113-0003', groupName: '検査科 血液ガス分析装置廃棄',
    vendorName: 'フィリップス・ジャパン', personInCharge: '佐藤花子', tel: '03-3456-7890',
    status: '発注済',
    rfqDeadline: null, orderDeadline: null, disposalDate: '2026-04-10', workDate: null, rejectionDate: null,
  },
  {
    id: 4, rfqNo: 'RFQ-20260115-0004', groupName: '看護部 輸液ポンプ廃棄',
    vendorName: 'オリンパス', personInCharge: '田中次郎', tel: '03-4567-8901',
    status: '作業日確定',
    rfqDeadline: null, orderDeadline: null, disposalDate: null, workDate: '2026-04-15', rejectionDate: null,
  },
  {
    id: 5, rfqNo: 'RFQ-20260120-0005', groupName: '手術部 電気メス移動作業',
    vendorName: 'キヤノンメディカル', personInCharge: '高橋美咲', tel: '03-5678-9012',
    status: '完了',
    rfqDeadline: null, orderDeadline: null, disposalDate: null, workDate: null, rejectionDate: null,
  },
];

// --- ヘッダースタイル ---
const thGroupStyle: React.CSSProperties = {
  padding: '8px 6px',
  border: '1px solid #495057',
  fontWeight: 600,
  fontSize: '12px',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
};

const thSubStyle: React.CSSProperties = {
  padding: '6px 8px',
  border: '1px solid #6c757d',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '12px',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '8px',
  borderBottom: '1px solid #dee2e6',
  whiteSpace: 'nowrap',
};

export function TransferDisposalManagementTab() {
  const router = useRouter();
  const { generateRfqNo } = useRfqGroupStore();

  // --- 申請受付 ---
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<Set<string>>(new Set());

  // 移動申請承認モーダル
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<PendingApplication | null>(null);

  // 見積依頼グループ作成モーダル
  const [isRfqGroupModalOpen, setIsRfqGroupModalOpen] = useState(false);
  const [rfqGroupName, setRfqGroupName] = useState('');

  const pendingApplications = MOCK_PENDING_APPLICATIONS;
  const pendingCount = pendingApplications.length;

  const handleSelectApplication = (id: string) => {
    const newSet = new Set(selectedApplicationIds);
    if (newSet.has(id)) { newSet.delete(id); } else { newSet.add(id); }
    setSelectedApplicationIds(newSet);
  };

  const handleSelectAllApplications = (checked: boolean) => {
    if (checked) {
      setSelectedApplicationIds(new Set(pendingApplications.map(a => a.id)));
    } else {
      setSelectedApplicationIds(new Set());
    }
  };

  const handleViewDetail = (app: PendingApplication) => {
    if (app.applicationType === '移動申請') {
      setSelectedApplication(app);
      setIsApprovalModalOpen(true);
    } else {
      // 廃棄申請の詳細は見積依頼グループ操作から開く
      alert('廃棄申請の詳細は、見積依頼グループを作成後、操作ボタンから確認できます。');
    }
  };

  const handleConfirmApproval = () => {
    if (!selectedApplication) return;
    setIsApprovalModalOpen(false);
    setSelectedApplication(null);
    alert('移動申請を承認しました。原本に反映されます。');
  };

  // --- 見積依頼グループ ---
  const [activeStep, setActiveStep] = useState<StepKey>('all');
  const [rfqGroups, setRfqGroups] = useState<DisposalRfqGroup[]>(MOCK_RFQ_GROUPS);

  const EXCLUDED_STATUSES: DisposalRfqStatus[] = ['申請を見送る'];
  const activeRfqGroups = useMemo(() => {
    return rfqGroups.filter(g => !EXCLUDED_STATUSES.includes(g.status));
  }, [rfqGroups]);

  const filteredRfqGroups = useMemo(() => {
    const tab = STEP_TABS.find(t => t.key === activeStep);
    if (!tab || tab.statuses.length === 0) return activeRfqGroups;
    return activeRfqGroups.filter(g => tab.statuses.includes(g.status));
  }, [activeRfqGroups, activeStep]);

  // 見積依頼グループ作成ハンドラー
  const handleCreateRfqGroup = () => {
    const rfqNo = generateRfqNo();
    const today = new Date();
    const createdDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const newGroup: DisposalRfqGroup = {
      id: Math.max(0, ...rfqGroups.map(g => g.id)) + 1,
      rfqNo,
      groupName: rfqGroupName.trim(),
      vendorName: '',
      personInCharge: '',
      tel: '',
      status: '見積依頼',
      rfqDeadline: null,
      orderDeadline: null,
      disposalDate: null,
      workDate: null,
      rejectionDate: null,
    };

    setRfqGroups(prev => [...prev, newGroup]);
    alert(`見積依頼グループ「${rfqGroupName.trim()}」を作成しました\n\n見積依頼No.: ${rfqNo}\n選択レコード: ${selectedApplicationIds.size}件`);
    setIsRfqGroupModalOpen(false);
    setRfqGroupName('');
    setSelectedApplicationIds(new Set());
  };

  // ステータスバッジ
  const getStatusBadge = (status: DisposalRfqStatus) => {
    const bg = STATUS_BADGE_COLORS[status] || '#95a5a6';
    const textColor = status === '作業日確定' ? '#333' : 'white';
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        background: bg,
        color: textColor,
        whiteSpace: 'nowrap',
      }}>
        {status}
      </span>
    );
  };

  // アクションボタン
  const getActionButton = (group: DisposalRfqGroup) => {
    const btnBase: React.CSSProperties = {
      padding: '6px 12px',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      whiteSpace: 'nowrap',
    };

    const navigateToTask = () => router.push(`/disposal-task?groupId=${group.id}`);

    switch (group.status) {
      case '見積依頼':
        return (
          <button style={{ ...btnBase, background: '#3498db' }}
            onClick={navigateToTask}>
            見積依頼
          </button>
        );
      case '見積依頼済':
        return (
          <button style={{ ...btnBase, background: '#27ae60' }}
            onClick={navigateToTask}>
            見積登録
          </button>
        );
      case '見積登録済':
        return (
          <button style={{ ...btnBase, background: '#e67e22' }}
            onClick={navigateToTask}>
            発注登録
          </button>
        );
      case '発注済':
        return (
          <button style={{ ...btnBase, background: '#f39c12' }}
            onClick={navigateToTask}>
            作業日登録
          </button>
        );
      case '作業日確定':
        return (
          <button style={{ ...btnBase, background: '#8e44ad' }}
            onClick={navigateToTask}>
            完了登録
          </button>
        );
      case '完了':
        return (
          <button style={{ ...btnBase, background: '#e74c3c' }}
            onClick={() => alert(`削除: ${group.groupName}`)}>
            完了登録
          </button>
        );
      default:
        return <span style={{ color: '#7f8c8d', fontSize: '12px' }}>-</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflow: 'hidden' }}>

      {/* ===== セクション1: 申請受付 ===== */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #dee2e6',
        overflow: 'hidden',
      }}>
        {/* ヘッダー */}
        <div style={{
          padding: '12px 16px',
          background: '#27ae60',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>申請受付</span>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '2px 10px',
            borderRadius: '12px',
            fontSize: '12px',
          }}>
            未処理: {pendingCount}件
          </span>
        </div>

        {pendingApplications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '14px' }}>未処理の申請はありません</div>
          </div>
        ) : (
          <>
            {/* テーブル */}
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  {/* グループヘッダー行 */}
                  <tr style={{ background: '#343a40', color: 'white' }}>
                    <th rowSpan={2} style={{ ...thGroupStyle, width: '36px', verticalAlign: 'middle' }}>
                      <input
                        type="checkbox"
                        checked={pendingApplications.length > 0 && selectedApplicationIds.size === pendingApplications.length}
                        onChange={(e) => handleSelectAllApplications(e.target.checked)}
                      />
                    </th>
                    <th colSpan={2} style={{ ...thGroupStyle, textAlign: 'center' }}>申請項目</th>
                    <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center' }}>設置情報</th>
                    <th colSpan={4} style={{ ...thGroupStyle, textAlign: 'center' }}>品目情報</th>
                    <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center' }}>院内担当情報</th>
                    <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'center', verticalAlign: 'middle' }}></th>
                  </tr>
                  {/* サブカラムヘッダー行 */}
                  <tr style={{ background: '#495057', color: 'white' }}>
                    <th style={thSubStyle}>申請日</th>
                    <th style={thSubStyle}>申請No, 種別</th>
                    <th style={thSubStyle}>部門名</th>
                    <th style={thSubStyle}>部署名</th>
                    <th style={thSubStyle}>室名</th>
                    <th style={thSubStyle}>QRコード</th>
                    <th style={thSubStyle}>品目名</th>
                    <th style={thSubStyle}>メーカー名</th>
                    <th style={thSubStyle}>型式</th>
                    <th style={thSubStyle}>所属部署</th>
                    <th style={thSubStyle}>氏名</th>
                    <th style={thSubStyle}>連絡先</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApplications.map((app) => {
                    const typeStyle = getApplicationTypeStyle(app.applicationType);
                    return (
                      <tr
                        key={app.id}
                        style={{
                          borderBottom: '1px solid #dee2e6',
                          background: selectedApplicationIds.has(app.id) ? '#e3f2fd' : 'transparent',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleViewDetail(app)}
                      >
                        <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedApplicationIds.has(app.id)}
                            onChange={() => handleSelectApplication(app.id)}
                          />
                        </td>
                        {/* 申請項目: 申請日 */}
                        <td style={{ ...tdStyle, color: '#5a6c7d' }}>{app.applicationDate}</td>
                        {/* 申請項目: 申請No, 種別 */}
                        <td style={tdStyle}>
                          <span style={{ color: '#3498db', fontWeight: 'bold', cursor: 'pointer' }}>{app.applicationNo}</span>
                          <span style={{
                            ...typeStyle,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            marginLeft: '8px',
                            display: 'inline-block',
                          }}>
                            {app.applicationType}
                          </span>
                        </td>
                        {/* 設置情報: 部門名, 部署名, 室名 */}
                        <td style={{ ...tdStyle, color: '#2c3e50' }}>{app.department}</td>
                        <td style={{ ...tdStyle, color: '#5a6c7d', fontSize: '12px' }}>{app.section || '-'}</td>
                        <td style={{ ...tdStyle, color: '#5a6c7d', fontSize: '12px' }}>{app.roomName || '-'}</td>
                        {/* 品目情報: QRコード, 品目名, メーカー名, 型式 */}
                        <td style={{ ...tdStyle, color: '#5a6c7d', fontSize: '12px' }}>{app.qrCode || '-'}</td>
                        <td style={{ ...tdStyle, color: '#2c3e50' }}>{app.itemName}</td>
                        <td style={{ ...tdStyle, color: '#5a6c7d', fontSize: '12px' }}>{app.maker || '-'}</td>
                        <td style={{ ...tdStyle, color: '#5a6c7d', fontSize: '12px' }}>{app.model || '-'}</td>
                        {/* 院内担当情報: 所属部署, 氏名, 連絡先 */}
                        <td style={{ ...tdStyle, color: '#5a6c7d', fontSize: '12px' }}>{app.applicantDepartment}</td>
                        <td style={{ ...tdStyle, color: '#2c3e50' }}>{app.applicantName}</td>
                        <td style={{ ...tdStyle, color: '#5a6c7d', fontSize: '12px' }}>{app.applicantContact || '-'}</td>
                        {/* 操作 */}
                        <td style={{ ...tdStyle, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleViewDetail(app)}
                            style={{
                              padding: '6px 12px',
                              background: 'white',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              color: '#2c3e50',
                            }}
                          >
                            申請内容
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* アクションバー */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #dee2e6',
              background: '#f8f9fa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '13px', color: '#5a6c7d' }}>
                選択した申請: {selectedApplicationIds.size}件
              </span>
              <button
                onClick={() => setIsRfqGroupModalOpen(true)}
                disabled={selectedApplicationIds.size === 0}
                style={{
                  padding: '8px 16px',
                  background: selectedApplicationIds.size === 0 ? '#bdc3c7' : '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: selectedApplicationIds.size === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                見積依頼グループ作成
              </button>
            </div>
          </>
        )}
      </div>

      {/* ===== セクション2: 見積依頼グループ ===== */}
      <div style={{
        flex: 1,
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #dee2e6',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* ヘッダー */}
        <div style={{
          padding: '12px 16px',
          background: '#3498db',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>見積依頼グループ</span>
        </div>

        {/* ステップタブ */}
        <div style={{
          borderBottom: '2px solid #dee2e6',
          display: 'flex',
          background: '#fafafa',
          overflowX: 'auto',
        }}>
          {STEP_TABS.map((tab) => {
            const isActive = activeStep === tab.key;
            const count = tab.statuses.length === 0
              ? activeRfqGroups.length
              : activeRfqGroups.filter(g => tab.statuses.includes(g.status)).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveStep(tab.key)}
                style={{
                  padding: '10px 16px',
                  background: isActive ? '#3498db' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #3498db' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: isActive ? 'bold' : 'normal',
                  color: isActive ? 'white' : '#555',
                  whiteSpace: 'nowrap',
                  marginBottom: '-2px',
                }}
              >
                {tab.label}
                <span style={{
                  marginLeft: '6px',
                  background: isActive ? 'rgba(255,255,255,0.3)' : '#e0e0e0',
                  padding: '1px 6px',
                  borderRadius: '8px',
                  fontSize: '11px',
                }} className="tabular-nums">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* テーブルエリア */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filteredRfqGroups.length === 0 ? (
            <div style={{ padding: '60px 40px', textAlign: 'center', color: '#7f8c8d' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>見積依頼グループがありません</div>
              <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                申請を選択して見積依頼グループを作成すると、<br />
                ここに表示されます。
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                {/* グループヘッダー行 */}
                <tr style={{ background: '#343a40', color: 'white' }}>
                  <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'left' }}>見積依頼No,</th>
                  <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'left' }}>見積グループ名称</th>
                  <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center' }}>業者情報</th>
                  <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'center' }}>ステータス</th>
                  <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'center' }}>期限</th>
                  <th rowSpan={2} style={{ ...thGroupStyle, textAlign: 'center' }}>操作</th>
                </tr>
                {/* サブカラムヘッダー行 */}
                <tr style={{ background: '#495057', color: 'white' }}>
                  <th style={thSubStyle}>業者名</th>
                  <th style={thSubStyle}>氏名</th>
                  <th style={thSubStyle}>連絡先</th>
                </tr>
              </thead>
              <tbody>
                {filteredRfqGroups.map((group, index) => {
                  const deadlineMapping = STATUS_DEADLINE_MAP[group.status];
                  return (
                    <tr key={group.id} style={{ background: index % 2 === 0 ? 'white' : '#fafafa', verticalAlign: 'top' }}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600, border: '1px solid #ddd' }}>
                        {group.rfqNo}
                      </td>
                      <td style={{ ...tdStyle, border: '1px solid #ddd' }}>{group.groupName}</td>
                      <td style={{ ...tdStyle, border: '1px solid #ddd' }}>{group.vendorName || '-'}</td>
                      <td style={{ ...tdStyle, border: '1px solid #ddd' }}>{group.personInCharge || '-'}</td>
                      <td style={{ ...tdStyle, border: '1px solid #ddd' }}>{group.tel || '-'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', border: '1px solid #ddd' }}>
                        {getStatusBadge(group.status)}
                      </td>
                      <td style={{ ...tdStyle, verticalAlign: 'top', border: '1px solid #ddd' }}>
                        {deadlineMapping && group[deadlineMapping.field] ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '11px', color: '#5a6c7d', whiteSpace: 'nowrap' }}>
                              {deadlineMapping.label}
                            </span>
                            <span style={{ fontSize: '12px', color: '#2c3e50' }} className="tabular-nums">
                              {group[deadlineMapping.field]}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#7f8c8d', fontSize: '12px' }}>-</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', verticalAlign: 'top', border: '1px solid #ddd' }}>
                        {getActionButton(group)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ===== 移動申請 承認確認モーダル ===== */}
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
                  <span style={{ color: '#666' }}>品目名:</span>
                  <span>{selectedApplication.itemName}</span>
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
      {/* ===== 見積依頼グループ作成モーダル ===== */}
      <RfqGroupModal
        isOpen={isRfqGroupModalOpen}
        onClose={() => setIsRfqGroupModalOpen(false)}
        rfqGroupName={rfqGroupName}
        setRfqGroupName={setRfqGroupName}
        selectedCount={selectedApplicationIds.size}
        generatedRfqNo={generateRfqNo()}
        onSubmit={handleCreateRfqGroup}
      />
    </div>
  );
}
