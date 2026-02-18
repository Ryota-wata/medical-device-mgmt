'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useApplicationStore } from '@/lib/stores';
import { ApplicationStatus } from '@/lib/types/application';

// フィルター状態
interface DisposalFilter {
  status: string;
  department: string;
  section: string;
  maker: string;
  itemName: string;
}

export function DisposalManagementTab() {
  const router = useRouter();
  const { applications: allApplications } = useApplicationStore();

  // 廃棄申請のみをフィルタリング
  const disposalApplications = useMemo(() => {
    return allApplications.filter((app) => app.applicationType === '廃棄申請');
  }, [allApplications]);

  const [filter, setFilter] = useState<DisposalFilter>({
    status: '',
    department: '',
    section: '',
    maker: '',
    itemName: '',
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // フィルターオプション（廃棄申請のステータスはApplicationStatusを使用）
  const statusOptions: ApplicationStatus[] = ['承認待ち', '承認済み', '却下'];
  const departmentOptions = [...new Set(disposalApplications.map((a) => a.facility.department).filter(Boolean))];
  const sectionOptions = [...new Set(disposalApplications.map((a) => a.facility.section).filter(Boolean))];
  const makerOptions = [...new Set(disposalApplications.map((a) => a.vendor).filter(Boolean))];
  const itemOptions = [...new Set(disposalApplications.map((a) => a.asset.name).filter(Boolean))];

  // フィルタリング
  const filteredApplications = useMemo(() => {
    return disposalApplications.filter((app) => {
      if (filter.status && app.status !== filter.status) return false;
      if (filter.department && app.facility.department !== filter.department) return false;
      if (filter.section && app.facility.section !== filter.section) return false;
      if (filter.maker && app.vendor !== filter.maker) return false;
      if (filter.itemName && app.asset.name !== filter.itemName) return false;
      return true;
    });
  }, [disposalApplications, filter]);

  // 全選択/解除
  const handleSelectAll = () => {
    if (selectedIds.size === filteredApplications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApplications.map((a) => a.id)));
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

  // ステータスバッジの色
  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case '承認待ち': return { bg: '#fff3e0', color: '#e65100' };
      case '承認済み': return { bg: '#e8f5e9', color: '#2e7d32' };
      case '却下': return { bg: '#ffebee', color: '#c62828' };
      default: return { bg: '#f5f5f5', color: '#666' };
    }
  };

  // ステータスに応じた次のアクションラベル
  const getNextActionLabel = (status: ApplicationStatus) => {
    switch (status) {
      case '承認待ち': return '承認';
      case '承認済み': return '詳細';
      case '却下': return '詳細';
      default: return 'タスク';
    }
  };

  // タスク画面へ遷移
  const handleOpenTask = (id: number) => {
    router.push(`/disposal-task?id=${id}`);
  };

  // フィルタークリア
  const handleClearFilter = () => {
    setFilter({
      status: '',
      department: '',
      section: '',
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
              label="設置部門"
              value={filter.department}
              onChange={(value) => setFilter({ ...filter, department: value })}
              options={departmentOptions}
              placeholder="全て"
            />
          </div>
          <div style={{ minWidth: '120px' }}>
            <SearchableSelect
              label="設置部署"
              value={filter.section}
              onChange={(value) => setFilter({ ...filter, section: value })}
              options={sectionOptions}
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
          検索結果: {filteredApplications.length}件 / 全{disposalApplications.length}件
          {selectedIds.size > 0 && ` （${selectedIds.size}件選択中）`}
        </div>
      </div>

      {/* テーブルエリア */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '1000px' }}>
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
                <th colSpan={2} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600 }}>申請情報</th>
                <th colSpan={3} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600 }}>設置情報</th>
                <th colSpan={3} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600 }}>廃棄対象機器</th>
                <th colSpan={1} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600 }}>廃棄理由</th>
                <th rowSpan={2} style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, width: '100px' }}>ステータス</th>
                <th rowSpan={2} style={{ padding: '8px 6px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, width: '100px' }}>操作</th>
              </tr>
              {/* カラムヘッダー行 */}
              <tr style={{ background: '#f8f9fa' }}>
                {/* 申請情報 */}
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>申請No</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>申請日</th>
                {/* 設置情報 */}
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>部門</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>部署</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>室名</th>
                {/* 廃棄対象機器 */}
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>品目</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>メーカー</th>
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>型式</th>
                {/* 廃棄理由 */}
                <th style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>コメント</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: '40px', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
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
                      {/* 設置情報 */}
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.facility.department || '-'}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.facility.section || '-'}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.roomName || '-'}</td>
                      {/* 廃棄対象機器 */}
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.asset.name}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.vendor || '-'}</td>
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd' }}>{app.asset.model || '-'}</td>
                      {/* 廃棄理由 */}
                      <td style={{ padding: '8px 6px', border: '1px solid #ddd', fontSize: '11px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={app.freeInput}>{app.freeInput || '-'}</td>
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
