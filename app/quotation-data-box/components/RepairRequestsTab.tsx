import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// 修理依頼のステータス
type RepairStatus = '新規申請' | '受付済' | '依頼済' | '修理中' | '完了';

// 修理区分
type RepairCategory = '院内修理' | '外部修理';

// 修理依頼データ型（モーダルと共有）
export interface RepairRequest {
  id: number;
  requestNo: string;
  requestDate: string;
  qrLabel: string;
  itemName: string;
  maker: string;
  model: string;
  serialNo: string;
  installDepartment: string;
  roomName: string;
  applicantDepartment: string;
  applicantName: string;
  applicantContact: string;
  vendorName: string;
  vendorPerson: string;
  vendorEmail: string;
  vendorTel: string;
  approvedDate: string | null;
  status: RepairStatus;
  deadline: string | null;
  deadlineLabel: string | null;
  category: RepairCategory;
  symptoms: string;
  // STEP1
  quotationDeadline: string | null;
  quotationRequestDate: string | null;
  // STEP2
  quotationItems: { content: string; quantity: number; amount: number }[];
  quotationTotal: number | null;
  // STEP3
  orderAmount: number | null;
  orderDate: string | null;
  // STEP4
  pickupDate: string | null;
  deliveryDate: string | null;
  // STEP5
  reportNo: string | null;
  reportDate: string | null;
  alternativeDevice: string | null;
  alternativeReturnDate: string | null;
}

// 初期モックデータ
const INITIAL_MOCK_DATA: RepairRequest[] = [
  {
    id: 1,
    requestNo: 'REP-20260205-001',
    requestDate: '2026-02-05',
    qrLabel: 'QR-001',
    itemName: '人工呼吸器',
    maker: 'フクダ電子',
    model: 'FV-500',
    serialNo: 'SN-001234',
    installDepartment: '集中治療室',
    roomName: 'ICU-1',
    applicantDepartment: '集中治療室',
    applicantName: '田中花子',
    applicantContact: '03-1234-5678',
    vendorName: 'フクダ電子',
    vendorPerson: '山田太郎',
    vendorEmail: 'yamada@fukuda.co.jp',
    vendorTel: '03-9876-5432',
    approvedDate: '2026-02-05',
    status: '修理中',
    deadline: '2026-02-12',
    deadlineLabel: '納品日',
    category: '外部修理',
    symptoms: '電源が入らない',
    quotationDeadline: '2026-02-07',
    quotationRequestDate: '2026-02-05',
    quotationItems: [{ content: '電源ユニット交換', quantity: 1, amount: 50000 }],
    quotationTotal: 50000,
    orderAmount: 50000,
    orderDate: '2026-02-08',
    pickupDate: '2026-02-09',
    deliveryDate: '2026-02-12',
    reportNo: null,
    reportDate: null,
    alternativeDevice: '代替人工呼吸器 FV-300',
    alternativeReturnDate: '2026-02-12',
  },
  {
    id: 2,
    requestNo: 'REP-20260204-001',
    requestDate: '2026-02-04',
    qrLabel: 'QR-002',
    itemName: '輸液ポンプ',
    maker: 'テルモ',
    model: 'TE-LM700',
    serialNo: 'SN-002345',
    installDepartment: '外科病棟',
    roomName: '501号室',
    applicantDepartment: '外科病棟',
    applicantName: '佐藤一郎',
    applicantContact: '03-1111-2222',
    vendorName: '',
    vendorPerson: '',
    vendorEmail: '',
    vendorTel: '',
    approvedDate: '2026-02-04',
    status: '受付済',
    deadline: '2026-02-10',
    deadlineLabel: '提出期限',
    category: '外部修理',
    symptoms: '流量が不安定',
    quotationDeadline: '2026-02-10',
    quotationRequestDate: null,
    quotationItems: [],
    quotationTotal: null,
    orderAmount: null,
    orderDate: null,
    pickupDate: null,
    deliveryDate: null,
    reportNo: null,
    reportDate: null,
    alternativeDevice: null,
    alternativeReturnDate: null,
  },
  {
    id: 3,
    requestNo: 'REP-20260203-001',
    requestDate: '2026-02-03',
    qrLabel: 'QR-003',
    itemName: '心電図モニター',
    maker: '日本光電',
    model: 'BSM-2301',
    serialNo: 'SN-003456',
    installDepartment: '内科病棟',
    roomName: '302号室',
    applicantDepartment: '内科病棟',
    applicantName: '高橋三郎',
    applicantContact: '03-5555-6666',
    vendorName: '',
    vendorPerson: '',
    vendorEmail: '',
    vendorTel: '',
    approvedDate: null,
    status: '新規申請',
    deadline: null,
    deadlineLabel: null,
    category: '院内修理',
    symptoms: '画面表示に乱れ',
    quotationDeadline: null,
    quotationRequestDate: null,
    quotationItems: [],
    quotationTotal: null,
    orderAmount: null,
    orderDate: null,
    pickupDate: null,
    deliveryDate: null,
    reportNo: null,
    reportDate: null,
    alternativeDevice: null,
    alternativeReturnDate: null,
  },
  {
    id: 4,
    requestNo: 'REP-20260201-001',
    requestDate: '2026-02-01',
    qrLabel: 'QR-004',
    itemName: '超音波診断装置',
    maker: '日立製作所',
    model: 'ARIETTA 850',
    serialNo: 'SN-004567',
    installDepartment: '検査部',
    roomName: '超音波室1',
    applicantDepartment: '検査部',
    applicantName: '伊藤四郎',
    applicantContact: '03-7777-8888',
    vendorName: '日立製作所',
    vendorPerson: '中村五郎',
    vendorEmail: 'nakamura@hitachi.co.jp',
    vendorTel: '03-9999-0000',
    approvedDate: '2026-02-02',
    status: '依頼済',
    deadline: '2026-02-08',
    deadlineLabel: '引取日',
    category: '外部修理',
    symptoms: 'プローブ異常',
    quotationDeadline: '2026-02-05',
    quotationRequestDate: '2026-02-02',
    quotationItems: [{ content: 'プローブ交換', quantity: 1, amount: 150000 }],
    quotationTotal: 150000,
    orderAmount: 150000,
    orderDate: '2026-02-06',
    pickupDate: null,
    deliveryDate: null,
    reportNo: null,
    reportDate: null,
    alternativeDevice: null,
    alternativeReturnDate: null,
  },
];

interface RepairRequestsTabProps {
  // 将来的にstoreからデータを受け取る場合に使用
}

export const RepairRequestsTab: React.FC<RepairRequestsTabProps> = () => {
  const router = useRouter();

  // 修理依頼データ（ローカル状態）
  const [repairRequests] = useState<RepairRequest[]>(INITIAL_MOCK_DATA);

  // フィルター状態
  const [categoryFilter, setCategoryFilter] = useState<RepairCategory | ''>('');
  const [statusFilter, setStatusFilter] = useState<RepairStatus | ''>('');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');

  // フィルタリング（完了は除外 - タスク管理のため）
  const filteredRequests = useMemo(() => {
    return repairRequests.filter(req => {
      // 完了ステータスは除外
      if (req.status === '完了') return false;
      if (categoryFilter && req.category !== categoryFilter) return false;
      if (statusFilter && req.status !== statusFilter) return false;
      if (monthFilter && !req.requestDate.startsWith(monthFilter)) return false;
      if (departmentFilter && req.applicantDepartment !== departmentFilter) return false;
      return true;
    });
  }, [repairRequests, categoryFilter, statusFilter, monthFilter, departmentFilter]);

  // 申請部署一覧（重複除去）
  const departments = useMemo(() => {
    const depts = new Set(repairRequests.map(r => r.applicantDepartment));
    return Array.from(depts);
  }, [repairRequests]);

  // ステータスに応じた色
  const getStatusColor = (status: RepairStatus) => {
    switch (status) {
      case '新規申請': return '#3498db';
      case '受付済': return '#f39c12';
      case '依頼済': return '#9b59b6';
      case '修理中': return '#e67e22';
      default: return '#95a5a6';
    }
  };

  // タスク操作ボタンのラベル
  const getActionLabel = (request: RepairRequest) => {
    switch (request.status) {
      case '新規申請': return '受付';
      case '受付済': return '見積登録';
      case '依頼済': return '引取登録';
      case '修理中': return request.deliveryDate ? '完了登録' : '納期登録';
      default: return '-';
    }
  };

  // タスク操作ボタンの色
  const getActionColor = (request: RepairRequest) => {
    switch (request.status) {
      case '新規申請': return '#3498db';
      case '受付済': return '#f39c12';
      case '依頼済': return '#9b59b6';
      case '修理中': return request.deliveryDate ? '#27ae60' : '#e67e22';
      default: return '#95a5a6';
    }
  };

  // 修理タスク画面へ遷移
  const handleOpenTask = (request: RepairRequest) => {
    router.push(`/repair-task?id=${request.id}`);
  };

  const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    textAlign: 'left',
    fontWeight: 'bold',
    color: '#2c3e50',
    whiteSpace: 'nowrap',
    borderBottom: '2px solid #dee2e6',
    background: '#f8f9fa',
    position: 'sticky',
    top: 0
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid #dee2e6'
  };

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* フィルター */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e0e0e0',
        background: '#fafafa',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* 修理区分 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#5a6c7d', whiteSpace: 'nowrap' }}>修理区分</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as RepairCategory | '')}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '13px',
              minWidth: '120px'
            }}
          >
            <option value="">すべて</option>
            <option value="院内修理">院内修理</option>
            <option value="外部修理">外部修理</option>
          </select>
        </div>

        {/* ステータス */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#5a6c7d', whiteSpace: 'nowrap' }}>ステータス</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RepairStatus | '')}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '13px',
              minWidth: '120px'
            }}
          >
            <option value="">すべて</option>
            <option value="新規申請">新規申請</option>
            <option value="受付済">受付済</option>
            <option value="依頼済">依頼済</option>
            <option value="修理中">修理中</option>
          </select>
        </div>

        {/* 申請月 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#5a6c7d', whiteSpace: 'nowrap' }}>申請月</label>
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '13px'
            }}
          />
        </div>

        {/* 申請部署 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#5a6c7d', whiteSpace: 'nowrap' }}>申請部署</label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '13px',
              minWidth: '140px'
            }}
          >
            <option value="">すべて</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* クリアボタン */}
        <button
          onClick={() => {
            setCategoryFilter('');
            setStatusFilter('');
            setMonthFilter('');
            setDepartmentFilter('');
          }}
          style={{
            padding: '6px 12px',
            background: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          クリア
        </button>
      </div>

      {/* テーブル（横スクロール対応） */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: '13px', minWidth: '1600px' }}>
          <thead>
            <tr>
              <th style={thStyle}>申請年月日</th>
              <th style={thStyle}>修理依頼No.</th>
              <th style={thStyle}>修理区分</th>
              <th style={thStyle}>QRラベル</th>
              <th style={thStyle}>品目</th>
              <th style={thStyle}>申請部署</th>
              <th style={thStyle}>申請担当者</th>
              <th style={thStyle}>担当連絡先</th>
              <th style={thStyle}>依頼先</th>
              <th style={thStyle}>担当</th>
              <th style={thStyle}>mail</th>
              <th style={thStyle}>連絡先</th>
              <th style={thStyle}>管理者承認日</th>
              <th style={thStyle}>ステータス</th>
              <th style={thStyle}>期限</th>
              <th style={thStyle}>タスク操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={16} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  該当するデータがありません
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => (
                <tr key={req.id} style={{ background: 'white' }}>
                  <td style={tdStyle}>{req.requestDate}</td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600 }}>{req.requestNo}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      background: req.category === '院内修理' ? '#e3f2fd' : '#fff3e0',
                      color: req.category === '院内修理' ? '#1565c0' : '#e65100'
                    }}>
                      {req.category}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#3498db' }}>{req.qrLabel}</td>
                  <td style={tdStyle}>{req.itemName}</td>
                  <td style={tdStyle}>{req.applicantDepartment}</td>
                  <td style={tdStyle}>{req.applicantName}</td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px' }}>{req.applicantContact}</td>
                  <td style={tdStyle}>{req.vendorName || <span style={{ color: '#999' }}>-</span>}</td>
                  <td style={tdStyle}>{req.vendorPerson || <span style={{ color: '#999' }}>-</span>}</td>
                  <td style={{ ...tdStyle, fontSize: '12px' }}>{req.vendorEmail || <span style={{ color: '#999' }}>-</span>}</td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px' }}>{req.vendorTel || <span style={{ color: '#999' }}>-</span>}</td>
                  <td style={tdStyle}>
                    {req.approvedDate ? (
                      <span style={{
                        padding: '2px 8px',
                        background: '#d4edda',
                        color: '#155724',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}>
                        {req.approvedDate}
                      </span>
                    ) : (
                      <span style={{
                        padding: '2px 8px',
                        background: '#fff3cd',
                        color: '#856404',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}>
                        未承認
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      background: getStatusColor(req.status),
                      color: 'white'
                    }}>
                      {req.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {req.deadline ? (
                      <div>
                        <div style={{ fontSize: '10px', color: '#7a8a9a' }}>{req.deadlineLabel}</div>
                        <div style={{ fontWeight: 500 }}>{req.deadline}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button
                      onClick={() => handleOpenTask(req)}
                      style={{
                        padding: '4px 12px',
                        background: getActionColor(req),
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {getActionLabel(req)}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
