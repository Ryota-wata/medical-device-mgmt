'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMasterStore, useApplicationStore } from '@/lib/stores';
import { Application } from '@/lib/types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { Header } from '@/components/layouts/Header';

function RemodelApplicationListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { facilities, assets } = useMasterStore();
  const { applications } = useApplicationStore();
  const { isMobile } = useResponsive();

  // URLパラメータから施設・部署を取得
  const facility = searchParams.get('facility') || '';
  const department = searchParams.get('department') || '';

  // ページタイトル
  const pageTitle = facility && department
    ? `リモデル申請一覧 - ${facility} ${department}`
    : 'リモデル申請一覧';

  // フィルター状態
  const [filters, setFilters] = useState({
    building: '',
    floor: '',
    department: '',
    section: '',
    category: '',
    largeClass: '',
    mediumClass: '',
    applicationType: '' // 申請種別フィルター
  });

  // 選択された行
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // フィルターoptionsを生成（施設マスタから）
  const buildingOptions = useMemo(() => {
    const uniqueBuildings = Array.from(new Set(facilities.map(f => f.building)));
    return uniqueBuildings.filter(Boolean) as string[];
  }, [facilities]);

  const floorOptions = useMemo(() => {
    const uniqueFloors = Array.from(new Set(facilities.map(f => f.floor)));
    return uniqueFloors.filter(Boolean) as string[];
  }, [facilities]);

  const departmentOptions = useMemo(() => {
    const uniqueDepartments = Array.from(new Set(facilities.map(f => f.department)));
    return uniqueDepartments.filter(Boolean) as string[];
  }, [facilities]);

  const sectionOptions = useMemo(() => {
    const uniqueSections = Array.from(new Set(facilities.map(f => f.section)));
    return uniqueSections.filter(Boolean) as string[];
  }, [facilities]);

  // 資産マスタから分類オプションを生成
  const categoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(new Set(assets.map(a => a.category)));
    return uniqueCategories.filter(Boolean) as string[];
  }, [assets]);

  const largeClassOptions = useMemo(() => {
    const uniqueLargeClasses = Array.from(new Set(assets.map(a => a.largeClass)));
    return uniqueLargeClasses.filter(Boolean) as string[];
  }, [assets]);

  const mediumClassOptions = useMemo(() => {
    const uniqueMediumClasses = Array.from(new Set(assets.map(a => a.mediumClass)));
    return uniqueMediumClasses.filter(Boolean) as string[];
  }, [assets]);

  // フィルタリングされた申請データ
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    if (filters.building) {
      filtered = filtered.filter(a => a.facility.building === filters.building);
    }
    if (filters.floor) {
      filtered = filtered.filter(a => a.facility.floor === filters.floor);
    }
    if (filters.department) {
      filtered = filtered.filter(a => a.facility.department === filters.department);
    }
    if (filters.section) {
      filtered = filtered.filter(a => a.facility.section === filters.section);
    }
    if (filters.applicationType) {
      filtered = filtered.filter(a => a.applicationType === filters.applicationType);
    }
    // TODO: category, largeClass, mediumClassでもフィルタリングできるように
    // Application型に資産分類情報を追加する必要がある

    return filtered;
  }, [applications, filters]);

  // チェックボックスの全選択/全解除
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(filteredApplications.map(app => app.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  // 個別チェックボックス
  const handleRowSelect = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // 行削除
  const handleDeleteRow = (id: number) => {
    if (confirm('この申請を削除しますか？')) {
      const { deleteApplication } = useApplicationStore.getState();
      deleteApplication(id);
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // 申請種別フィルターボタンのハンドラー
  const handleApplicationTypeFilter = (type: string) => {
    if (filters.applicationType === type) {
      // 既に選択されている場合は解除
      setFilters({...filters, applicationType: ''});
    } else {
      setFilters({...filters, applicationType: type});
    }
  };

  // 行クリック
  const handleRowClick = (app: Application) => {
    handleRowSelect(app.id);
  };

  // 選択項目の切り替え
  const handleSelectItem = (id: number) => {
    handleRowSelect(id);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'white' }}>
      <Header
        title={pageTitle}
        resultCount={filteredApplications.length}
        showOriginalLabel={false}
        showBackButton={true}
        hideMenu={true}
      />

      {/* フィルターヘッダー */}
      <div style={{ background: '#f8f9fa', padding: '15px 20px', borderBottom: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="棟"
              value={filters.building}
              onChange={(value) => setFilters({...filters, building: value})}
              options={['', ...buildingOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="階"
              value={filters.floor}
              onChange={(value) => setFilters({...filters, floor: value})}
              options={['', ...floorOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="部門"
              value={filters.department}
              onChange={(value) => setFilters({...filters, department: value})}
              options={['', ...departmentOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="部署"
              value={filters.section}
              onChange={(value) => setFilters({...filters, section: value})}
              options={['', ...sectionOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="Category"
              value={filters.category}
              onChange={(value) => setFilters({...filters, category: value})}
              options={['', ...categoryOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="大分類"
              value={filters.largeClass}
              onChange={(value) => setFilters({...filters, largeClass: value})}
              options={['', ...largeClassOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="中分類"
              value={filters.mediumClass}
              onChange={(value) => setFilters({...filters, mediumClass: value})}
              options={['', ...mediumClassOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      {/* アクションバー（申請種別フィルター） */}
      <div style={{ background: '#fff', padding: '15px 20px', borderBottom: '1px solid #dee2e6', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '14px', color: '#555', marginRight: '15px' }}>
          {selectedRows.size}件選択中
        </span>
        <button
          style={{
            padding: '8px 16px',
            background: filters.applicationType === '新規申請' ? '#1e8449' : '#27ae60',
            color: 'white',
            border: filters.applicationType === '新規申請' ? '2px solid #145a32' : 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filters.applicationType === '新規申請' ? 'bold' : 'normal'
          }}
          onClick={() => handleApplicationTypeFilter('新規申請')}
        >
          新規申請
        </button>
        <button
          style={{
            padding: '8px 16px',
            background: filters.applicationType === '増設申請' ? '#21618c' : '#3498db',
            color: 'white',
            border: filters.applicationType === '増設申請' ? '2px solid #1a4971' : 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filters.applicationType === '増設申請' ? 'bold' : 'normal'
          }}
          onClick={() => handleApplicationTypeFilter('増設申請')}
        >
          増設申請
        </button>
        <button
          style={{
            padding: '8px 16px',
            background: filters.applicationType === '更新申請' ? '#ba4a00' : '#e67e22',
            color: 'white',
            border: filters.applicationType === '更新申請' ? '2px solid #873600' : 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filters.applicationType === '更新申請' ? 'bold' : 'normal'
          }}
          onClick={() => handleApplicationTypeFilter('更新申請')}
        >
          更新申請
        </button>
        <button
          style={{
            padding: '8px 16px',
            background: filters.applicationType === '移動申請' ? '#6c3483' : '#9b59b6',
            color: 'white',
            border: filters.applicationType === '移動申請' ? '2px solid #512e5f' : 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filters.applicationType === '移動申請' ? 'bold' : 'normal'
          }}
          onClick={() => handleApplicationTypeFilter('移動申請')}
        >
          移動申請
        </button>
        <button
          style={{
            padding: '8px 16px',
            background: filters.applicationType === '廃棄申請' ? '#a93226' : '#e74c3c',
            color: 'white',
            border: filters.applicationType === '廃棄申請' ? '2px solid #78281f' : 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filters.applicationType === '廃棄申請' ? 'bold' : 'normal'
          }}
          onClick={() => handleApplicationTypeFilter('廃棄申請')}
        >
          廃棄申請
        </button>
        <button
          style={{
            padding: '8px 16px',
            background: filters.applicationType === '保留' ? '#626567' : '#95a5a6',
            color: 'white',
            border: filters.applicationType === '保留' ? '2px solid #424949' : 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filters.applicationType === '保留' ? 'bold' : 'normal'
          }}
          onClick={() => handleApplicationTypeFilter('保留')}
        >
          保留
        </button>
        {filters.applicationType && (
          <button
            style={{
              padding: '8px 16px',
              background: 'white',
              color: '#e74c3c',
              border: '1px solid #e74c3c',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'normal',
              marginLeft: '10px'
            }}
            onClick={() => setFilters({...filters, applicationType: ''})}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e74c3c';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#e74c3c';
            }}
          >
            🔄 クリア
          </button>
        )}
      </div>

      {/* テーブル表示 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th
                style={{
                  padding: '12px 8px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  width: '50px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}
              >
                <input type="checkbox" onChange={(e) => handleSelectAll(e.target.checked)} />
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>申請番号</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '100px' }}>申請日</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>申請種別</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '100px' }}>棟</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '80px' }}>階</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>部門</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>部署</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>諸室名</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '200px' }}>品目</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>メーカー</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>型式</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '80px' }}>数量</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '80px' }}>単位</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>現在の接続状況</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>現在の接続先</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '140px' }}>要望機器の接続要望</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>要望機器の接続先</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '200px' }}>申請理由・コメント等</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '100px' }}>執行年度</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '100px' }}>グループ</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>見積依頼No.</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>グループ名称</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#2c3e50', width: '120px' }}>概算金額</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>編集カラム</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>編集カラム</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50', width: '150px' }}>編集カラム</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.map((app) => (
              <tr
                key={app.id}
                style={{
                  borderBottom: '1px solid #dee2e6',
                  cursor: 'pointer',
                  background: selectedRows.has(app.id) ? '#e3f2fd' : 'white'
                }}
                onClick={() => handleRowClick(app)}
                onMouseEnter={(e) => {
                  if (!selectedRows.has(app.id)) {
                    e.currentTarget.style.background = '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedRows.has(app.id)) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(app.id)}
                    onChange={() => handleSelectItem(app.id)}
                  />
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace', fontWeight: 600 }}>
                  {app.applicationNo}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap' }}>
                  {app.applicationDate}
                </td>
                <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: app.applicationType === '新規申請' ? '#e8f5e9' :
                               app.applicationType === '増設申請' ? '#e3f2fd' :
                               app.applicationType === '更新申請' ? '#fff3e0' :
                               app.applicationType === '移動申請' ? '#f3e5f5' :
                               app.applicationType === '廃棄申請' ? '#ffebee' : '#f5f5f5',
                    color: app.applicationType === '新規申請' ? '#2e7d32' :
                           app.applicationType === '増設申請' ? '#1565c0' :
                           app.applicationType === '更新申請' ? '#e65100' :
                           app.applicationType === '移動申請' ? '#6a1b9a' :
                           app.applicationType === '廃棄申請' ? '#c62828' : '#555'
                  }}>
                    {app.applicationType}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.facility.building}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap' }}>
                  {app.facility.floor}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.facility.department}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.facility.section}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.roomName || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.asset.name}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.vendor}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.asset.model}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap' }}>
                  {app.quantity || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap' }}>
                  {app.unit || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.currentConnectionStatus || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.currentConnectionDestination || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.requestConnectionStatus || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.requestConnectionDestination || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {app.applicationReason || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap' }}>
                  {app.executionYear}
                </td>
                <td style={{ padding: '12px 8px', color: '#7f8c8d', whiteSpace: 'nowrap' }}>
                  -
                </td>
                <td style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                  {app.rfqNo || '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#7f8c8d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  -
                </td>
                <td style={{ padding: '12px 8px', color: '#7f8c8d', whiteSpace: 'nowrap', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 8px', color: '#7f8c8d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  -
                </td>
                <td style={{ padding: '12px 8px', color: '#7f8c8d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  -
                </td>
                <td style={{ padding: '12px 8px', color: '#7f8c8d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  -
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredApplications.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#7f8c8d',
            fontSize: '16px'
          }}>
            申請データがありません
          </div>
        )}
      </div>
    </div>
  );
}

export default function RemodelApplicationListPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RemodelApplicationListContent />
    </Suspense>
  );
}
