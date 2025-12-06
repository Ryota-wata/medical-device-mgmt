'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMasterStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { Header } from '@/components/layouts/Header';

// 申請データの型定義
interface ApplicationData {
  id: string;
  building: string;
  floor: string;
  department: string;
  section: string;
  roomName: string;
  itemName: string;
  maker: string;
  model: string;
  applicationType: string;
  groupingNo: string;
  grouping: string;
  rfqNo: string;
  listPrice: number;
  purchasePrice: number;
  editField1: string;
  editField2: string;
  editField3: string;
}

function RemodelApplicationListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { facilities } = useMasterStore();
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
    section: ''
  });

  // 選択された行
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // ダミーデータ（実際にはAPIから取得）
  const [applications, setApplications] = useState<ApplicationData[]>([
    {
      id: '1',
      building: '本館',
      floor: '2F',
      department: '内科',
      section: '循環器内科',
      roomName: '診察室1',
      itemName: 'CTスキャナ',
      maker: 'GEヘルスケア',
      model: 'Revolution CT',
      applicationType: '更新',
      groupingNo: 'G001',
      grouping: 'グループA',
      rfqNo: 'RFQ-2024-001',
      listPrice: 50000000,
      purchasePrice: 45000000,
      editField1: '',
      editField2: '',
      editField3: ''
    },
    {
      id: '2',
      building: '本館',
      floor: '3F',
      department: '外科',
      section: '一般外科',
      roomName: '手術室1',
      itemName: 'MRI装置',
      maker: 'シーメンス',
      model: 'MAGNETOM Vida',
      applicationType: '新規',
      groupingNo: 'G002',
      grouping: 'グループB',
      rfqNo: 'RFQ-2024-002',
      listPrice: 80000000,
      purchasePrice: 75000000,
      editField1: '',
      editField2: '',
      editField3: ''
    }
  ]);

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

  // フィルタリングされた申請データ
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    if (filters.building) {
      filtered = filtered.filter(a => a.building === filters.building);
    }
    if (filters.floor) {
      filtered = filtered.filter(a => a.floor === filters.floor);
    }
    if (filters.department) {
      filtered = filtered.filter(a => a.department === filters.department);
    }
    if (filters.section) {
      filtered = filtered.filter(a => a.section === filters.section);
    }

    return filtered;
  }, [applications, filters]);

  // チェックボックスの全選択/全解除
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(new Set(filteredApplications.map(app => app.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  // 個別チェックボックス
  const handleRowSelect = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // フィールド更新
  const handleFieldUpdate = (id: string, field: keyof ApplicationData, value: string | number) => {
    setApplications(prev => prev.map(app =>
      app.id === id ? { ...app, [field]: value } : app
    ));
  };

  // 行削除
  const handleDeleteRow = (id: string) => {
    if (confirm('この申請を削除しますか？')) {
      setApplications(prev => prev.filter(app => app.id !== id));
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // 見積databoxを別ウィンドウで開く
  const handleOpenQuotationDataBox = () => {
    window.open('/quotation-data-box', '_blank', 'width=1400,height=900');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Header
        title={pageTitle}
        showBackButton={true}
        hideMenu={true}
      />

      {/* フィルターヘッダー */}
      <div style={{ background: '#f8f9fa', padding: '15px 20px', borderBottom: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="棟"
              value={filters.building}
              onChange={(value) => setFilters({...filters, building: value})}
              options={buildingOptions}
              placeholder="全て"
              isMobile={isMobile}
            />
          </div>
          <div style={{ flex: '1', minWidth: '100px' }}>
            <SearchableSelect
              label="階"
              value={filters.floor}
              onChange={(value) => setFilters({...filters, floor: value})}
              options={floorOptions}
              placeholder="全て"
              isMobile={isMobile}
            />
          </div>
          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="部門"
              value={filters.department}
              onChange={(value) => setFilters({...filters, department: value})}
              options={departmentOptions}
              placeholder="全て"
              isMobile={isMobile}
            />
          </div>
          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="部署"
              value={filters.section}
              onChange={(value) => setFilters({...filters, section: value})}
              options={sectionOptions}
              placeholder="全て"
              isMobile={isMobile}
            />
          </div>
          <div>
            <button
              onClick={handleOpenQuotationDataBox}
              style={{
                padding: isMobile ? '10px 16px' : '11px 20px',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2980b9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#3498db';
              }}
            >
              📦 見積databoxを別ウィンドウで開く
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div style={{ flex: 1, padding: isMobile ? '10px' : '20px' }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: isMobile ? '12px' : '14px',
              minWidth: '2000px'
            }}>
              <thead style={{
                background: '#f8f9fa',
                color: '#2c3e50',
                position: 'sticky',
                top: 0,
                zIndex: 10
              }}>
                {/* エリア区分ヘッダー */}
                <tr>
                  <th rowSpan={2} style={{
                    padding: isMobile ? '10px 8px' : '12px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    width: '50px',
                    borderRight: '2px solid #bdc3c7',
                    borderBottom: '1px solid #dee2e6',
                    background: '#f8f9fa'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.size === filteredApplications.length && filteredApplications.length > 0}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </th>
                  <th colSpan={5} style={{
                    padding: isMobile ? '8px' : '10px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    background: '#c8e6c9',
                    color: '#2e7d32',
                    borderRight: '2px solid #bdc3c7',
                    borderBottom: '1px solid #dee2e6',
                    fontSize: isMobile ? '13px' : '15px'
                  }}>
                    設置情報
                  </th>
                  <th colSpan={3} style={{
                    padding: isMobile ? '8px' : '10px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    background: '#bbdefb',
                    color: '#1565c0',
                    borderRight: '2px solid #bdc3c7',
                    borderBottom: '1px solid #dee2e6',
                    fontSize: isMobile ? '13px' : '15px'
                  }}>
                    申請資産情報
                  </th>
                  <th colSpan={10} style={{
                    padding: isMobile ? '8px' : '10px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    background: '#ffe0b2',
                    color: '#e65100',
                    borderBottom: '1px solid #dee2e6',
                    fontSize: isMobile ? '13px' : '15px'
                  }}>
                    申請編集
                  </th>
                </tr>
                {/* カラム名ヘッダー */}
                <tr>
                  <th style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', minWidth: '100px' }}>棟</th>
                  <th style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', minWidth: '80px' }}>階</th>
                  <th style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', minWidth: '120px' }}>部門</th>
                  <th style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', minWidth: '120px' }}>部署</th>
                  <th style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '2px solid #bdc3c7', minWidth: '150px' }}>諸室名</th>
                  <th style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', minWidth: '200px' }}>品目</th>
                  <th style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', minWidth: '150px' }}>メーカー</th>
                  <th style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '2px solid #bdc3c7', minWidth: '150px' }}>型式</th>
                  <th style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', minWidth: '120px' }}>申請区分</th>
                  <th style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', minWidth: '120px' }}>グルーピングNo</th>
                  <th style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', minWidth: '150px' }}>グルーピング</th>
                  <th style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', minWidth: '150px' }}>見積依頼No.</th>
                  <th style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'right', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', minWidth: '120px' }}>定価金額</th>
                  <th style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'right', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', minWidth: '120px' }}>購入金額</th>
                  <th style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', minWidth: '150px' }}>編集カラム1</th>
                  <th style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', minWidth: '150px' }}>編集カラム2</th>
                  <th style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'left', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', minWidth: '150px' }}>編集カラム3</th>
                  <th style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', width: '80px' }}>削除</th>
                </tr>
              </thead>
            <tbody>
              {filteredApplications.map((app, index) => {
                const isSelected = selectedRows.has(app.id);
                return (
                  <tr
                    key={app.id}
                    style={{
                      background: index % 2 === 0 ? 'white' : '#f8f9fa',
                      borderBottom: '1px solid #ecf0f1'
                    }}
                  >
                    {/* チェックボックス */}
                    <td style={{ padding: isMobile ? '10px 8px' : '12px', textAlign: 'center', borderRight: '2px solid #bdc3c7' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleRowSelect(app.id)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </td>
                    {/* 設置情報（読み取り専用） */}
                    <td style={{ padding: isMobile ? '10px 8px' : '12px', color: '#2c3e50', borderRight: '1px solid #ecf0f1' }}>{app.building}</td>
                    <td style={{ padding: isMobile ? '10px 8px' : '12px', color: '#2c3e50', borderRight: '1px solid #ecf0f1' }}>{app.floor}</td>
                    <td style={{ padding: isMobile ? '10px 8px' : '12px', color: '#2c3e50', borderRight: '1px solid #ecf0f1' }}>{app.department}</td>
                    <td style={{ padding: isMobile ? '10px 8px' : '12px', color: '#2c3e50', borderRight: '1px solid #ecf0f1' }}>{app.section}</td>
                    <td style={{ padding: isMobile ? '10px 8px' : '12px', color: '#2c3e50', borderRight: '2px solid #bdc3c7' }}>{app.roomName}</td>
                    {/* 資産情報（読み取り専用） */}
                    <td style={{ padding: isMobile ? '10px 8px' : '12px', color: '#2c3e50', borderRight: '1px solid #ecf0f1' }}>{app.itemName}</td>
                    <td style={{ padding: isMobile ? '10px 8px' : '12px', color: '#2c3e50', borderRight: '1px solid #ecf0f1' }}>{app.maker}</td>
                    <td style={{ padding: isMobile ? '10px 8px' : '12px', color: '#2c3e50', borderRight: '2px solid #bdc3c7' }}>{app.model}</td>
                    {/* 編集可能カラム */}
                    <td style={{ padding: isMobile ? '6px 4px' : '8px', borderRight: '1px solid #ecf0f1' }}>
                      <select
                        value={app.applicationType}
                        onChange={(e) => handleFieldUpdate(app.id, 'applicationType', e.target.value)}
                        disabled={!isSelected}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d0d0d0',
                          borderRadius: '4px',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                          background: isSelected ? 'white' : '#f8f9fa',
                          cursor: isSelected ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <option value="">選択してください</option>
                        <option value="新規">新規</option>
                        <option value="更新">更新</option>
                        <option value="増設">増設</option>
                        <option value="移動">移動</option>
                        <option value="廃棄">廃棄</option>
                      </select>
                    </td>
                    <td style={{ padding: isMobile ? '6px 4px' : '8px', borderRight: '1px solid #ecf0f1' }}>
                      <input
                        type="text"
                        value={app.groupingNo}
                        onChange={(e) => handleFieldUpdate(app.id, 'groupingNo', e.target.value)}
                        disabled={!isSelected}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d0d0d0',
                          borderRadius: '4px',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                          background: isSelected ? 'white' : '#f8f9fa',
                          cursor: isSelected ? 'text' : 'not-allowed'
                        }}
                      />
                    </td>
                    <td style={{ padding: isMobile ? '6px 4px' : '8px', borderRight: '1px solid #ecf0f1' }}>
                      <input
                        type="text"
                        value={app.grouping}
                        onChange={(e) => handleFieldUpdate(app.id, 'grouping', e.target.value)}
                        disabled={!isSelected}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d0d0d0',
                          borderRadius: '4px',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                          background: isSelected ? 'white' : '#f8f9fa',
                          cursor: isSelected ? 'text' : 'not-allowed'
                        }}
                      />
                    </td>
                    <td style={{ padding: isMobile ? '6px 4px' : '8px', borderRight: '1px solid #ecf0f1' }}>
                      <input
                        type="text"
                        value={app.rfqNo}
                        onChange={(e) => handleFieldUpdate(app.id, 'rfqNo', e.target.value)}
                        disabled={!isSelected}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d0d0d0',
                          borderRadius: '4px',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                          background: isSelected ? 'white' : '#f8f9fa',
                          cursor: isSelected ? 'text' : 'not-allowed'
                        }}
                      />
                    </td>
                    <td style={{ padding: isMobile ? '6px 4px' : '8px', borderRight: '1px solid #ecf0f1' }}>
                      <input
                        type="number"
                        value={app.listPrice}
                        onChange={(e) => handleFieldUpdate(app.id, 'listPrice', Number(e.target.value))}
                        disabled={!isSelected}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d0d0d0',
                          borderRadius: '4px',
                          fontSize: '13px',
                          textAlign: 'right',
                          boxSizing: 'border-box',
                          background: isSelected ? 'white' : '#f8f9fa',
                          cursor: isSelected ? 'text' : 'not-allowed'
                        }}
                      />
                    </td>
                    <td style={{ padding: isMobile ? '6px 4px' : '8px', borderRight: '1px solid #ecf0f1' }}>
                      <input
                        type="number"
                        value={app.purchasePrice}
                        onChange={(e) => handleFieldUpdate(app.id, 'purchasePrice', Number(e.target.value))}
                        disabled={!isSelected}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d0d0d0',
                          borderRadius: '4px',
                          fontSize: '13px',
                          textAlign: 'right',
                          boxSizing: 'border-box',
                          background: isSelected ? 'white' : '#f8f9fa',
                          cursor: isSelected ? 'text' : 'not-allowed'
                        }}
                      />
                    </td>
                    <td style={{ padding: isMobile ? '6px 4px' : '8px', borderRight: '1px solid #ecf0f1' }}>
                      <input
                        type="text"
                        value={app.editField1}
                        onChange={(e) => handleFieldUpdate(app.id, 'editField1', e.target.value)}
                        disabled={!isSelected}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d0d0d0',
                          borderRadius: '4px',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                          background: isSelected ? 'white' : '#f8f9fa',
                          cursor: isSelected ? 'text' : 'not-allowed'
                        }}
                      />
                    </td>
                    <td style={{ padding: isMobile ? '6px 4px' : '8px', borderRight: '1px solid #ecf0f1' }}>
                      <input
                        type="text"
                        value={app.editField2}
                        onChange={(e) => handleFieldUpdate(app.id, 'editField2', e.target.value)}
                        disabled={!isSelected}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d0d0d0',
                          borderRadius: '4px',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                          background: isSelected ? 'white' : '#f8f9fa',
                          cursor: isSelected ? 'text' : 'not-allowed'
                        }}
                      />
                    </td>
                    <td style={{ padding: isMobile ? '6px 4px' : '8px', borderRight: '1px solid #ecf0f1' }}>
                      <input
                        type="text"
                        value={app.editField3}
                        onChange={(e) => handleFieldUpdate(app.id, 'editField3', e.target.value)}
                        disabled={!isSelected}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d0d0d0',
                          borderRadius: '4px',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                          background: isSelected ? 'white' : '#f8f9fa',
                          cursor: isSelected ? 'text' : 'not-allowed'
                        }}
                      />
                    </td>
                    {/* 削除ボタン */}
                    <td style={{ padding: isMobile ? '6px 4px' : '8px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteRow(app.id)}
                        disabled={!isSelected}
                        style={{
                          padding: '6px 12px',
                          background: isSelected ? '#e74c3c' : '#bdc3c7',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: isSelected ? 'pointer' : 'not-allowed',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (isSelected) {
                            e.currentTarget.style.background = '#c0392b';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isSelected) {
                            e.currentTarget.style.background = '#e74c3c';
                          }
                        }}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredApplications.length === 0 && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#7f8c8d',
              fontSize: isMobile ? '14px' : '16px'
            }}>
              申請データがありません
            </div>
          )}
          </div>
        </div>
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
