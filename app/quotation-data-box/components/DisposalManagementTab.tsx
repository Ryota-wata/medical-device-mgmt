'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

// ステータス型
type DisposalStatus = '申請中' | '受付済' | '見積取得済' | '発注済' | '検収済';

interface DisposalApplication {
  id: string;
  applicationNo: string;
  applicationDate: string;
  applicantName: string;
  applicantDepartment: string;
  // 設置情報
  installationDivision: string;
  installationDepartment: string;
  installationRoom: string;
  // 廃棄対象機器
  itemName: string;
  maker: string;
  model: string;
  qrLabel: string;
  // 廃棄理由
  disposalReason: string;
  comment: string;
  // ステータス
  status: DisposalStatus;
}

// モックデータ
const MOCK_DISPOSAL_APPLICATIONS: DisposalApplication[] = [
  {
    id: '1',
    applicationNo: 'DSP-2026-001',
    applicationDate: '2026-02-01',
    applicantName: '山田 太郎',
    applicantDepartment: 'ME室',
    installationDivision: '診療技術部',
    installationDepartment: 'ME室',
    installationRoom: 'ME機器管理室',
    itemName: '心電計',
    maker: '日本光電',
    model: 'ECG-2550',
    qrLabel: 'QR-001234',
    disposalReason: '耐用年数超過',
    comment: '10年以上使用、部品供給終了',
    status: '発注済',
  },
  {
    id: '2',
    applicationNo: 'DSP-2026-002',
    applicationDate: '2026-02-05',
    applicantName: '佐藤 花子',
    applicantDepartment: '手術部',
    installationDivision: '中央手術部門',
    installationDepartment: '手術部',
    installationRoom: '手術室A',
    itemName: '電気メス',
    maker: 'コヴィディエン',
    model: 'Force FX',
    qrLabel: 'QR-002345',
    disposalReason: '故障（修理不能）',
    comment: '修理見積が新品購入価格を超過',
    status: '受付済',
  },
  {
    id: '3',
    applicationNo: 'DSP-2026-003',
    applicationDate: '2026-02-10',
    applicantName: '田中 一郎',
    applicantDepartment: 'ICU',
    installationDivision: '看護部',
    installationDepartment: 'ICU',
    installationRoom: 'ICU-1',
    itemName: '輸液ポンプ',
    maker: 'テルモ',
    model: 'TE-LM700',
    qrLabel: 'QR-003456',
    disposalReason: '耐用年数超過',
    comment: '新機種へ更新のため廃棄',
    status: '申請中',
  },
  {
    id: '4',
    applicationNo: 'DSP-2026-004',
    applicationDate: '2026-02-08',
    applicantName: '鈴木 次郎',
    applicantDepartment: '放射線科',
    installationDivision: '診療部',
    installationDepartment: '放射線科',
    installationRoom: 'CT室',
    itemName: 'モニター',
    maker: 'EIZO',
    model: 'RadiForce RX250',
    qrLabel: 'QR-004567',
    disposalReason: '故障（修理不能）',
    comment: '液晶パネル不具合、交換部品なし',
    status: '見積取得済',
  },
  {
    id: '5',
    applicationNo: 'DSP-2026-005',
    applicationDate: '2026-02-03',
    applicantName: '高橋 美咲',
    applicantDepartment: '検査部',
    installationDivision: '診療技術部',
    installationDepartment: '検査部',
    installationRoom: '生理検査室',
    itemName: '超音波診断装置',
    maker: 'GEヘルスケア',
    model: 'LOGIQ E9',
    qrLabel: 'QR-005678',
    disposalReason: '耐用年数超過',
    comment: '後継機導入に伴う廃棄',
    status: '検収済',
  },
];

// フィルター状態
interface DisposalFilter {
  status: string;
  applicantDepartment: string;
  installationDepartment: string;
  maker: string;
  itemName: string;
}

export function DisposalManagementTab() {
  const router = useRouter();
  const [applications] = useState<DisposalApplication[]>(MOCK_DISPOSAL_APPLICATIONS);
  const [filter, setFilter] = useState<DisposalFilter>({
    status: '',
    applicantDepartment: '',
    installationDepartment: '',
    maker: '',
    itemName: '',
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // フィルターオプション
  const statusOptions = ['申請中', '受付済', '見積取得済', '発注済', '検収済'];
  const departmentOptions = [...new Set(applications.map((a) => a.applicantDepartment))];
  const installDeptOptions = [...new Set(applications.map((a) => a.installationDepartment))];
  const makerOptions = [...new Set(applications.map((a) => a.maker))];
  const itemOptions = [...new Set(applications.map((a) => a.itemName))];

  // フィルタリング
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (filter.status && app.status !== filter.status) return false;
      if (filter.applicantDepartment && app.applicantDepartment !== filter.applicantDepartment) return false;
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
  const getStatusColor = (status: DisposalStatus) => {
    switch (status) {
      case '申請中': return { bg: '#fff3e0', color: '#e65100' };
      case '受付済': return { bg: '#e3f2fd', color: '#1565c0' };
      case '見積取得済': return { bg: '#e8f5e9', color: '#2e7d32' };
      case '発注済': return { bg: '#f3e5f5', color: '#7b1fa2' };
      case '検収済': return { bg: '#e0f7fa', color: '#00838f' };
      default: return { bg: '#f5f5f5', color: '#666' };
    }
  };

  // ステータスに応じた次のアクションラベル
  const getNextActionLabel = (status: DisposalStatus) => {
    switch (status) {
      case '申請中': return '受付';
      case '受付済': return '見積登録';
      case '見積取得済': return '発注';
      case '発注済': return '検収';
      case '検収済': return '完了処理';
      default: return 'タスク';
    }
  };

  // タスク画面へ遷移
  const handleOpenTask = (id: string) => {
    router.push(`/disposal-task?id=${id}`);
  };

  // フィルタークリア
  const handleClearFilter = () => {
    setFilter({
      status: '',
      applicantDepartment: '',
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
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="申請部署"
              value={filter.applicantDepartment}
              onChange={(value) => setFilter({ ...filter, applicantDepartment: value })}
              options={departmentOptions}
              placeholder="全て"
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="設置部署"
              value={filter.installationDepartment}
              onChange={(value) => setFilter({ ...filter, installationDepartment: value })}
              options={installDeptOptions}
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
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '1200px' }}>
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
                <th colSpan={4} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600 }}>申請情報</th>
                <th colSpan={3} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600 }}>設置情報</th>
                <th colSpan={4} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600 }}>廃棄対象機器</th>
                <th colSpan={2} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600 }}>廃棄理由</th>
                <th rowSpan={2} style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, width: '100px' }}>ステータス</th>
                <th rowSpan={2} style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, width: '100px' }}>操作</th>
              </tr>
              {/* カラムヘッダー行 */}
              <tr style={{ background: '#f8f9fa' }}>
                {/* 申請情報 */}
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>申請No</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>申請日</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>申請者</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>申請部署</th>
                {/* 設置情報 */}
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>部門</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>部署</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>室名</th>
                {/* 廃棄対象機器 */}
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>品目</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>メーカー</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>型式</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>QRラベル</th>
                {/* 廃棄理由 */}
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>理由</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>コメント</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={16} style={{ padding: '40px', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
                    廃棄申請データがありません
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
                      {/* 申請情報 */}
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.applicationNo}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{app.applicationDate}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.applicantName}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.applicantDepartment}</td>
                      {/* 設置情報 */}
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.installationDivision}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.installationDepartment}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.installationRoom}</td>
                      {/* 廃棄対象機器 */}
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.itemName}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.maker}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.model}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.qrLabel}</td>
                      {/* 廃棄理由 */}
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.disposalReason}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', fontSize: '11px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={app.comment}>{app.comment || '-'}</td>
                      {/* ステータス */}
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
                      {/* 操作 */}
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
}
