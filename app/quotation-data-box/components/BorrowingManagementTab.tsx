'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useMasterStore } from '@/lib/stores';

// 借用申請データ型
interface BorrowingApplication {
  id: string;
  // 貸出元情報
  companyName: string;
  contactPerson: string;
  contactInfo: string;
  email: string;
  // 申請情報
  applicationDate: string;
  managementDepartment: string;
  applicantName: string;
  // 設置情報
  installationDivision: string;
  installationDepartment: string;
  installationRoom: string;
  // 貸出目的
  purposes: string[];
  // 期間
  desiredDeliveryDate: string;
  returnDate: string;
  casesPerMonth: string;
  // 貸出機器
  itemName: string;
  maker: string;
  model: string;
  quantity: number;
  unit: string;
  // 費用負担
  costBurdenInstallation: '貸出元' | '貸出先' | '';
  costBurdenRemoval: '貸出元' | '貸出先' | '';
  costBurdenMaintenance: '貸出元' | '貸出先' | '';
  costBurdenConsumables: '貸出元' | '貸出先' | '';
  costBurdenOther: '貸出元' | '貸出先' | '';
  // コメント
  comment: string;
  // 添付ファイル
  attachedFileCount: number;
  // ステータス
  status: '申請中' | '承認済' | '契約締結' | '日程確定' | '貸出中' | '却下';
  // 契約管理
  contractNo: string;
  contractDate: string;
  // 日程調整
  scheduledDeliveryDate: string;
  actualDeliveryDate: string;
  scheduledReturnDate: string;
  actualReturnDate: string;
}

// モックデータ
const MOCK_BORROWING_APPLICATIONS: BorrowingApplication[] = [
  {
    id: 'BR-2026-001',
    companyName: 'オリンパス株式会社',
    contactPerson: '山田太郎',
    contactInfo: '03-1234-5678',
    email: 'yamada@olympus.co.jp',
    applicationDate: '2026-02-01',
    managementDepartment: '手術部',
    applicantName: '手藤 次郎',
    installationDivision: '中央手術部門',
    installationDepartment: '手術部',
    installationRoom: '手術室B',
    purposes: ['臨床試用', 'デモ'],
    desiredDeliveryDate: '2026-03-01',
    returnDate: '2026-04-30',
    casesPerMonth: '10',
    itemName: '電気手術器',
    maker: 'オリンパス',
    model: 'ESG-400',
    quantity: 1,
    unit: '台',
    costBurdenInstallation: '貸出元',
    costBurdenRemoval: '貸出元',
    costBurdenMaintenance: '貸出先',
    costBurdenConsumables: '貸出先',
    costBurdenOther: '',
    comment: '新機種の評価目的',
    attachedFileCount: 2,
    status: '日程確定',
    contractNo: 'CT-2026-001',
    contractDate: '2026-02-10',
    scheduledDeliveryDate: '2026-03-01',
    actualDeliveryDate: '',
    scheduledReturnDate: '2026-04-30',
    actualReturnDate: '',
  },
  {
    id: 'BR-2026-002',
    companyName: 'フクダ電子株式会社',
    contactPerson: '佐藤花子',
    contactInfo: '03-9876-5432',
    email: 'sato@fukuda.co.jp',
    applicationDate: '2026-02-05',
    managementDepartment: 'ME室',
    applicantName: '鈴木 一郎',
    installationDivision: '診療技術部',
    installationDepartment: 'ME室',
    installationRoom: 'ME機器管理室',
    purposes: ['事故・故障対応'],
    desiredDeliveryDate: '2026-02-10',
    returnDate: '2026-03-10',
    casesPerMonth: '',
    itemName: '除細動器',
    maker: 'フクダ電子',
    model: 'FC-1760',
    quantity: 1,
    unit: '台',
    costBurdenInstallation: '貸出元',
    costBurdenRemoval: '貸出元',
    costBurdenMaintenance: '貸出元',
    costBurdenConsumables: '貸出先',
    costBurdenOther: '',
    comment: '故障機器の代替として緊急借用',
    attachedFileCount: 1,
    status: '貸出中',
    contractNo: 'CT-2026-002',
    contractDate: '2026-02-08',
    scheduledDeliveryDate: '2026-02-10',
    actualDeliveryDate: '2026-02-10',
    scheduledReturnDate: '2026-03-10',
    actualReturnDate: '',
  },
  {
    id: 'BR-2026-003',
    companyName: 'テルモ株式会社',
    contactPerson: '田中三郎',
    contactInfo: '03-1111-2222',
    email: 'tanaka@terumo.co.jp',
    applicationDate: '2026-02-10',
    managementDepartment: 'ICU',
    applicantName: '高橋 美咲',
    installationDivision: '看護部',
    installationDepartment: 'ICU',
    installationRoom: 'ICU-1',
    purposes: ['研修'],
    desiredDeliveryDate: '2026-03-15',
    returnDate: '2026-03-20',
    casesPerMonth: '',
    itemName: '輸液ポンプ',
    maker: 'テルモ',
    model: 'TE-LM700',
    quantity: 3,
    unit: '台',
    costBurdenInstallation: '貸出元',
    costBurdenRemoval: '貸出元',
    costBurdenMaintenance: '貸出元',
    costBurdenConsumables: '貸出元',
    costBurdenOther: '',
    comment: '新人研修用',
    attachedFileCount: 0,
    status: '申請中',
    contractNo: '',
    contractDate: '',
    scheduledDeliveryDate: '',
    actualDeliveryDate: '',
    scheduledReturnDate: '',
    actualReturnDate: '',
  },
];

// フィルター状態
interface BorrowingFilter {
  status: string;
  companyName: string;
  managementDepartment: string;
  installationDepartment: string;
  maker: string;
  itemName: string;
}

export const BorrowingManagementTab: React.FC = () => {
  const router = useRouter();
  const { departments } = useMasterStore();
  const departmentOptions = [...new Set(departments.map((d) => d.department))];

  const [applications] = useState<BorrowingApplication[]>(MOCK_BORROWING_APPLICATIONS);
  const [filter, setFilter] = useState<BorrowingFilter>({
    status: '',
    companyName: '',
    managementDepartment: '',
    installationDepartment: '',
    maker: '',
    itemName: '',
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // フィルターオプション
  const statusOptions = ['申請中', '承認済', '契約締結', '日程確定', '貸出中', '却下'];
  const companyOptions = [...new Set(applications.map((a) => a.companyName))];
  const makerOptions = [...new Set(applications.map((a) => a.maker))];
  const itemOptions = [...new Set(applications.map((a) => a.itemName))];

  // フィルタリング
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (filter.status && app.status !== filter.status) return false;
      if (filter.companyName && app.companyName !== filter.companyName) return false;
      if (filter.managementDepartment && app.managementDepartment !== filter.managementDepartment) return false;
      if (filter.installationDepartment && app.installationDepartment !== filter.installationDepartment) return false;
      if (filter.maker && app.maker !== filter.maker) return false;
      if (filter.itemName && app.itemName !== filter.itemName) return false;
      return true;
    });
  }, [applications, filter]);

  // 全選択/解除
  const handleSelectAll = () => {
    if (selectedIds.size === filteredApplications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApplications.map((a) => a.id)));
    }
  };

  // 個別選択
  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // ステータスバッジの色
  const getStatusColor = (status: string) => {
    switch (status) {
      case '申請中': return { bg: '#fff3e0', color: '#e65100' };
      case '承認済': return { bg: '#e3f2fd', color: '#1565c0' };
      case '契約締結': return { bg: '#e8f5e9', color: '#2e7d32' };
      case '日程確定': return { bg: '#f3e5f5', color: '#7b1fa2' };
      case '貸出中': return { bg: '#e0f7fa', color: '#00838f' };
      case '却下': return { bg: '#ffebee', color: '#c62828' };
      default: return { bg: '#f5f5f5', color: '#666' };
    }
  };

  // ステータスに応じた次のアクションラベル
  const getNextActionLabel = (status: string) => {
    switch (status) {
      case '申請中': return '受付';
      case '承認済': return '契約登録';
      case '契約締結': return '日程調整';
      case '日程確定': return '納品確認';
      case '貸出中': return '返却処理';
      case '却下': return '詳細';
      default: return 'タスク';
    }
  };

  // タスク画面へ遷移
  const handleOpenTask = (id: string) => {
    router.push(`/borrowing-task?id=${id}`);
  };

  // フィルタークリア
  const handleClearFilter = () => {
    setFilter({
      status: '',
      companyName: '',
      managementDepartment: '',
      installationDepartment: '',
      maker: '',
      itemName: '',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* フィルターエリア */}
      <div style={{ background: '#f8f9fa', padding: '16px', borderBottom: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="ステータス"
              value={filter.status}
              onChange={(value) => setFilter({ ...filter, status: value })}
              options={statusOptions}
              placeholder="全て"
            />
          </div>
          <div style={{ minWidth: '150px' }}>
            <SearchableSelect
              label="貸出元企業"
              value={filter.companyName}
              onChange={(value) => setFilter({ ...filter, companyName: value })}
              options={companyOptions}
              placeholder="全て"
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="管理部署"
              value={filter.managementDepartment}
              onChange={(value) => setFilter({ ...filter, managementDepartment: value })}
              options={departmentOptions}
              placeholder="全て"
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="設置部署"
              value={filter.installationDepartment}
              onChange={(value) => setFilter({ ...filter, installationDepartment: value })}
              options={departmentOptions}
              placeholder="全て"
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="メーカー"
              value={filter.maker}
              onChange={(value) => setFilter({ ...filter, maker: value })}
              options={makerOptions}
              placeholder="全て"
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="品目"
              value={filter.itemName}
              onChange={(value) => setFilter({ ...filter, itemName: value })}
              options={itemOptions}
              placeholder="全て"
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
          検索結果: {filteredApplications.length}件 / 全{applications.length}件
          {selectedIds.size > 0 && ` （${selectedIds.size}件選択中）`}
        </div>
      </div>

      {/* テーブルエリア */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '1800px' }}>
            <thead>
              {/* グループヘッダー行 */}
              <tr style={{ background: '#e8ecef' }}>
                <th rowSpan={2} style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, width: '40px', position: 'sticky', left: 0, background: '#e8ecef', zIndex: 2 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredApplications.length && filteredApplications.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th colSpan={4} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600 }}>貸出元情報</th>
                <th colSpan={4} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600 }}>申請基本情報</th>
                <th colSpan={3} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600 }}>設置情報</th>
                <th colSpan={4} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600 }}>貸出条件</th>
                <th colSpan={5} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600 }}>貸出機器</th>
                <th colSpan={5} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600 }}>費用負担</th>
                <th colSpan={2} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600 }}>その他</th>
                <th rowSpan={2} style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, width: '80px' }}>ステータス</th>
                <th rowSpan={2} style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, width: '80px' }}>操作</th>
              </tr>
              {/* カラムヘッダー行 */}
              <tr style={{ background: '#f8f9fa' }}>
                {/* 貸出元情報 */}
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>企業名</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>担当者</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>連絡先</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>メール</th>
                {/* 申請基本情報 */}
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>申請ID</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>申請日</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>管理部署</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>申請者</th>
                {/* 設置情報 */}
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>部門</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>部署</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>室名</th>
                {/* 貸出条件 */}
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>目的</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>希望納期</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>返却日</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>症例数</th>
                {/* 貸出機器 */}
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>品目</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>メーカー</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>型式</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>数量</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>単位</th>
                {/* 費用負担 */}
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>設置</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>撤去</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>保守</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>消耗品</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>その他</th>
                {/* その他 */}
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>コメント</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>添付</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={30} style={{ padding: '40px', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
                    借用申請データがありません
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app, index) => {
                  const statusColor = getStatusColor(app.status);
                  return (
                    <tr key={app.id} style={{ background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', position: 'sticky', left: 0, background: index % 2 === 0 ? 'white' : '#fafafa', zIndex: 1 }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(app.id)}
                          onChange={() => handleSelect(app.id)}
                        />
                      </td>
                      {/* 貸出元情報 */}
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.companyName}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.contactPerson}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.contactInfo}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', fontSize: '11px' }}>{app.email}</td>
                      {/* 申請基本情報 */}
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.id}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{app.applicationDate}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.managementDepartment}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.applicantName}</td>
                      {/* 設置情報 */}
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.installationDivision}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.installationDepartment}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.installationRoom}</td>
                      {/* 貸出条件 */}
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', fontSize: '11px' }}>{app.purposes.join(', ')}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{app.desiredDeliveryDate}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{app.returnDate}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{app.casesPerMonth || '-'}</td>
                      {/* 貸出機器 */}
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.itemName}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.maker}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.model}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{app.quantity}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center' }}>{app.unit}</td>
                      {/* 費用負担 */}
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontSize: '11px' }}>{app.costBurdenInstallation || '-'}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontSize: '11px' }}>{app.costBurdenRemoval || '-'}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontSize: '11px' }}>{app.costBurdenMaintenance || '-'}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontSize: '11px' }}>{app.costBurdenConsumables || '-'}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontSize: '11px' }}>{app.costBurdenOther || '-'}</td>
                      {/* その他 */}
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', fontSize: '11px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={app.comment}>{app.comment || '-'}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{app.attachedFileCount > 0 ? `${app.attachedFileCount}件` : '-'}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          background: statusColor.bg,
                          color: statusColor.color,
                        }}>
                          {app.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center' }}>
                        <button
                          onClick={() => handleOpenTask(app.id)}
                          style={{
                            padding: '4px 12px',
                            background: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 'bold',
                          }}
                        >
                          {getNextActionLabel(app.status)}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
