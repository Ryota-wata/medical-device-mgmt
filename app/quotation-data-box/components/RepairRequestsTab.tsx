import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// 修理依頼のステータス（新ステータス体系）
type RepairStatus = '新規申請' | '見積依頼済' | '見積登録済' | '発注済' | '納期確定' | '検収登録' | '完了' | '却下';

// 修理依頼データ型
export interface RepairRequest {
  id: number;
  requestNo: string;
  requestDate: string;
  qrLabel: string;
  itemName: string;
  maker: string;
  model: string;
  serialNo: string;
  applicantDepartment: string;
  applicantName: string;
  applicantContact: string;
  vendorName: string;
  vendorPerson: string;
  vendorContact: string;
  status: RepairStatus;
  // ステータス連動の期限フィールド
  quotationDeadline: string | null;    // 見積提出期限
  orderDeadline: string | null;        // 発注期限
  orderDate: string | null;            // 発注日
  deliveryDate: string | null;         // 納品日
  rejectedDate: string | null;         // 却下日
  // 代替機
  alternativeDevice: string | null;
  alternativeDeliveryDate: string | null;
  alternativeReturnDate: string | null;
  alternativeUnreturned: boolean;      // 代替え機未返却フラグ
  // 商品引取日
  pickupDate: string | null;
}

// ステータスに応じた絞込みAction名
const getActionName = (status: RepairStatus): string => {
  switch (status) {
    case '新規申請': return '新規受付';
    case '見積依頼済': return '申請受付・依頼';
    case '見積登録済': return '見積登録';
    case '発注済': return '発注登録';
    case '納期確定': return '納期登録';
    case '検収登録': return '検収登録';
    case '完了': return '資産登録（経理部）';
    case '却下': return '-';
  }
};

// ステータスに応じた期限表示
const getDeadlineInfo = (req: RepairRequest): { label: string; date: string } | null => {
  switch (req.status) {
    case '見積依頼済':
      return req.quotationDeadline ? { label: '見積提出期限', date: req.quotationDeadline } : null;
    case '見積登録済':
      return req.orderDeadline ? { label: '発注期限', date: req.orderDeadline } : null;
    case '発注済':
      return req.orderDate ? { label: '発注日', date: req.orderDate } : null;
    case '納期確定':
      return req.deliveryDate ? { label: '納品日', date: req.deliveryDate } : null;
    default:
      return null;
  }
};

// ステータスバッジの色
const getStatusColor = (status: RepairStatus): string => {
  switch (status) {
    case '新規申請': return '#3498db';
    case '見積依頼済': return '#2980b9';
    case '見積登録済': return '#27ae60';
    case '発注済': return '#8e44ad';
    case '納期確定': return '#e67e22';
    case '検収登録': return '#d35400';
    case '完了': return '#7f8c8d';
    case '却下': return '#e74c3c';
  }
};

// タスク操作ボタンの色
const getActionColor = (status: RepairStatus): string => {
  switch (status) {
    case '新規申請': return '#3498db';
    case '見積依頼済': return '#2980b9';
    case '見積登録済': return '#27ae60';
    case '発注済': return '#8e44ad';
    case '納期確定': return '#e67e22';
    case '検収登録': return '#d35400';
    case '完了': return '#34495e';
    case '却下': return '#95a5a6';
  }
};

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
    applicantDepartment: '集中治療室',
    applicantName: '田中花子',
    applicantContact: '03-1234-5678',
    vendorName: 'フクダ電子',
    vendorPerson: '山田太郎',
    vendorContact: '03-9876-5432',
    status: '納期確定',
    quotationDeadline: '2026-02-07',
    orderDeadline: '2026-02-10',
    orderDate: '2026-02-08',
    deliveryDate: '2026-02-15',
    rejectedDate: null,
    alternativeDevice: '代替人工呼吸器 FV-300',
    alternativeDeliveryDate: '2026-02-06',
    alternativeReturnDate: null,
    alternativeUnreturned: true,
    pickupDate: '2026-02-09',
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
    applicantDepartment: '外科病棟',
    applicantName: '佐藤一郎',
    applicantContact: '03-1111-2222',
    vendorName: '',
    vendorPerson: '',
    vendorContact: '',
    status: '見積依頼済',
    quotationDeadline: '2026-02-10',
    orderDeadline: null,
    orderDate: null,
    deliveryDate: null,
    rejectedDate: null,
    alternativeDevice: null,
    alternativeDeliveryDate: null,
    alternativeReturnDate: null,
    alternativeUnreturned: false,
    pickupDate: null,
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
    applicantDepartment: '内科病棟',
    applicantName: '高橋三郎',
    applicantContact: '03-5555-6666',
    vendorName: '',
    vendorPerson: '',
    vendorContact: '',
    status: '新規申請',
    quotationDeadline: null,
    orderDeadline: null,
    orderDate: null,
    deliveryDate: null,
    rejectedDate: null,
    alternativeDevice: null,
    alternativeDeliveryDate: null,
    alternativeReturnDate: null,
    alternativeUnreturned: false,
    pickupDate: null,
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
    applicantDepartment: '検査部',
    applicantName: '伊藤四郎',
    applicantContact: '03-7777-8888',
    vendorName: '日立製作所',
    vendorPerson: '中村五郎',
    vendorContact: '03-9999-0000',
    status: '見積登録済',
    quotationDeadline: '2026-02-05',
    orderDeadline: '2026-02-08',
    orderDate: null,
    deliveryDate: null,
    rejectedDate: null,
    alternativeDevice: null,
    alternativeDeliveryDate: null,
    alternativeReturnDate: null,
    alternativeUnreturned: false,
    pickupDate: null,
  },
  {
    id: 5,
    requestNo: 'REP-20260130-001',
    requestDate: '2026-01-30',
    qrLabel: 'QR-005',
    itemName: '除細動器',
    maker: '日本光電',
    model: 'TEC-5600',
    serialNo: 'SN-005678',
    applicantDepartment: '救急部',
    applicantName: '渡辺六郎',
    applicantContact: '03-3333-4444',
    vendorName: '日本光電',
    vendorPerson: '鈴木七郎',
    vendorContact: '03-2222-3333',
    status: '発注済',
    quotationDeadline: '2026-02-03',
    orderDeadline: '2026-02-06',
    orderDate: '2026-02-05',
    deliveryDate: null,
    rejectedDate: null,
    alternativeDevice: '代替除細動器 TEC-5500',
    alternativeDeliveryDate: '2026-02-01',
    alternativeReturnDate: null,
    alternativeUnreturned: false,
    pickupDate: '2026-02-02',
  },
  {
    id: 6,
    requestNo: 'REP-20260128-001',
    requestDate: '2026-01-28',
    qrLabel: 'QR-006',
    itemName: '電気メス',
    maker: 'コヴィディエン',
    model: 'ForceTriad',
    serialNo: 'SN-006789',
    applicantDepartment: '手術室',
    applicantName: '山本八郎',
    applicantContact: '03-4444-5555',
    vendorName: 'コヴィディエン',
    vendorPerson: '加藤九郎',
    vendorContact: '03-6666-7777',
    status: '検収登録',
    quotationDeadline: '2026-01-31',
    orderDeadline: '2026-02-03',
    orderDate: '2026-02-02',
    deliveryDate: '2026-02-10',
    rejectedDate: null,
    alternativeDevice: null,
    alternativeDeliveryDate: null,
    alternativeReturnDate: null,
    alternativeUnreturned: false,
    pickupDate: '2026-01-30',
  },
  {
    id: 7,
    requestNo: 'REP-20260125-001',
    requestDate: '2026-01-25',
    qrLabel: 'QR-007',
    itemName: 'シリンジポンプ',
    maker: 'テルモ',
    model: 'TE-SS800',
    serialNo: 'SN-007890',
    applicantDepartment: '内科病棟',
    applicantName: '松本十郎',
    applicantContact: '03-8888-9999',
    vendorName: 'テルモ',
    vendorPerson: '木村一男',
    vendorContact: '03-0000-1111',
    status: '完了',
    quotationDeadline: '2026-01-28',
    orderDeadline: '2026-01-31',
    orderDate: '2026-01-30',
    deliveryDate: '2026-02-05',
    rejectedDate: null,
    alternativeDevice: '代替シリンジポンプ TE-SS700',
    alternativeDeliveryDate: '2026-01-26',
    alternativeReturnDate: null,
    alternativeUnreturned: true,
    pickupDate: '2026-01-27',
  },
];

// フィルター用ステータス一覧（却下を除く通常フロー）
const FILTER_STATUSES: RepairStatus[] = [
  '新規申請', '見積依頼済', '見積登録済', '発注済', '納期確定', '検収登録', '完了', '却下',
];

interface RepairRequestsTabProps {
  // 将来的にstoreからデータを受け取る場合に使用
}

export const RepairRequestsTab: React.FC<RepairRequestsTabProps> = () => {
  const router = useRouter();

  // 修理依頼データ（ローカル状態）
  const [repairRequests] = useState<RepairRequest[]>(INITIAL_MOCK_DATA);

  // フィルター状態
  const [statusFilter, setStatusFilter] = useState<RepairStatus | ''>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [alternativeUnreturnedOnly, setAlternativeUnreturnedOnly] = useState(false);

  // フィルタリング + 申請日昇順ソート
  const filteredRequests = useMemo(() => {
    return repairRequests
      .filter(req => {
        if (statusFilter && req.status !== statusFilter) return false;
        if (departmentFilter && req.applicantDepartment !== departmentFilter) return false;
        if (alternativeUnreturnedOnly && !req.alternativeUnreturned) return false;
        return true;
      })
      .sort((a, b) => a.requestDate.localeCompare(b.requestDate));
  }, [repairRequests, statusFilter, departmentFilter, alternativeUnreturnedOnly]);

  // 申請部署一覧（重複除去）
  const departments = useMemo(() => {
    const depts = new Set(repairRequests.map(r => r.applicantDepartment));
    return Array.from(depts);
  }, [repairRequests]);

  // 修理タスク画面へ遷移
  const handleOpenTask = (request: RepairRequest) => {
    router.push(`/repair-task?id=${request.id}`);
  };

  const thStyle: React.CSSProperties = {
    padding: '10px 8px',
    textAlign: 'left',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    border: '1px solid #ddd',
    background: '#f8f9fa',
    position: 'sticky',
    top: 0,
  };

  const tdStyle: React.CSSProperties = {
    padding: '8px',
    whiteSpace: 'nowrap',
    border: '1px solid #ddd',
  };

  const thGroupStyle: React.CSSProperties = {
    ...thStyle,
    textAlign: 'center',
    fontSize: '11px',
    background: '#e8edf2',
    color: '#4a6074',
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
        alignItems: 'center',
      }}>
        {/* ステータスで絞り込む */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#5a6c7d', whiteSpace: 'nowrap' }}>ステータスで絞り込む</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RepairStatus | '')}
            style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', minWidth: '140px' }}
          >
            <option value="">すべて</option>
            {FILTER_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* 申請部署 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#5a6c7d', whiteSpace: 'nowrap' }}>申請部署</label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', minWidth: '140px' }}
          >
            <option value="">すべて</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* 代替品未返却 */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#5a6c7d', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={alternativeUnreturnedOnly}
            onChange={(e) => setAlternativeUnreturnedOnly(e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          代替品未返却で絞り込む
        </label>

        {/* クリアボタン */}
        <button
          onClick={() => { setStatusFilter(''); setDepartmentFilter(''); setAlternativeUnreturnedOnly(false); }}
          style={{ padding: '6px 12px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', color: '#666' }}
        >
          クリア
        </button>
      </div>

      {/* テーブル */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '1300px' }}>
          <thead>
            <tr>
              <th colSpan={2} style={thGroupStyle}>申請項目</th>
              <th colSpan={3} style={thGroupStyle}>品目情報</th>
              <th colSpan={3} style={thGroupStyle}>担当情報</th>
              <th colSpan={3} style={thGroupStyle}>業者情報</th>
              <th style={thGroupStyle}>ステータス</th>
              <th style={thGroupStyle}>期限</th>
              <th style={thGroupStyle}>操作</th>
            </tr>
            <tr>
              <th style={thStyle}>申請No.</th>
              <th style={thStyle}>申請日</th>
              <th style={thStyle}>QRラベル</th>
              <th style={thStyle}>品目名</th>
              <th style={thStyle}>メーカー名</th>
              <th style={thStyle}>所属部署</th>
              <th style={thStyle}>氏名</th>
              <th style={thStyle}>連絡先</th>
              <th style={thStyle}>業者名</th>
              <th style={thStyle}>氏名</th>
              <th style={thStyle}>連絡先</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>ステータス</th>
              <th style={thStyle}>期限</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>タスク名</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={14} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  該当するデータがありません
                </td>
              </tr>
            ) : (
              filteredRequests.map((req, index) => {
                const deadlineInfo = getDeadlineInfo(req);
                return (
                  <tr key={req.id} style={{ background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600 }}>{req.requestNo}</td>
                    <td style={tdStyle}>{req.requestDate}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#3498db' }}>{req.qrLabel}</td>
                    <td style={tdStyle}>{req.itemName}</td>
                    <td style={tdStyle}>{req.maker}</td>
                    <td style={tdStyle}>{req.applicantDepartment}</td>
                    <td style={tdStyle}>{req.applicantName}</td>
                    <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', fontSize: '12px' }}>{req.applicantContact}</td>
                    <td style={tdStyle}>{req.vendorName || <span style={{ color: '#999' }}>-</span>}</td>
                    <td style={tdStyle}>{req.vendorPerson || <span style={{ color: '#999' }}>-</span>}</td>
                    <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', fontSize: '12px' }}>
                      {req.vendorContact || <span style={{ color: '#999' }}>-</span>}
                    </td>
                    {/* ステータス */}
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          background: getStatusColor(req.status),
                          color: 'white',
                          whiteSpace: 'nowrap',
                        }}>
                          {req.status}
                        </span>
                        {req.alternativeUnreturned && (
                          <span style={{
                            display: 'inline-block',
                            padding: '1px 6px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            background: '#ffebee',
                            color: '#c62828',
                            border: '1px solid #ef9a9a',
                            whiteSpace: 'nowrap',
                          }}>
                            代替機未返却
                          </span>
                        )}
                      </div>
                    </td>
                    {/* 期限 */}
                    <td style={tdStyle}>
                      {deadlineInfo ? (
                        <div>
                          <div style={{ fontSize: '10px', color: '#999', marginBottom: '2px' }}>{deadlineInfo.label}</div>
                          <div style={{ fontVariantNumeric: 'tabular-nums' }}>{deadlineInfo.date}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#999' }}>-</span>
                      )}
                    </td>
                    {/* タスク操作 */}
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {req.status !== '却下' ? (
                        <button
                          onClick={() => handleOpenTask(req)}
                          style={{
                            padding: '4px 12px',
                            background: getActionColor(req.status),
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {getActionName(req.status)}
                        </button>
                      ) : (
                        <span style={{ color: '#999', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
