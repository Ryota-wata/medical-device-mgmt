'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Individual, getIndividualStatusBadgeStyle } from '@/lib/types/individual';

// カラム定義
interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  defaultVisible?: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'facilityName', label: '施設名', width: '120px', defaultVisible: false },
  { key: 'qrCode', label: 'QRコード', width: '150px', defaultVisible: true },
  { key: 'assetNo', label: '固定資産番号', width: '150px', defaultVisible: false },
  { key: 'managementNo', label: '管理機器番号', width: '150px', defaultVisible: false },
  { key: 'building', label: '棟', width: '80px', defaultVisible: true },
  { key: 'floor', label: '階', width: '60px', defaultVisible: true },
  { key: 'department', label: '部門名', width: '120px', defaultVisible: true },
  { key: 'section', label: '部署名（設置部署）', width: '150px', defaultVisible: true },
  { key: 'roomClass1', label: '諸室区分①', width: '120px', defaultVisible: false },
  { key: 'roomClass2', label: '諸室区分②', width: '120px', defaultVisible: false },
  { key: 'roomName', label: '諸室名称', width: '150px', defaultVisible: false },
  { key: 'category', label: 'category', width: '100px', defaultVisible: false },
  { key: 'largeClass', label: '大分類', width: '100px', defaultVisible: false },
  { key: 'mediumClass', label: '中分類', width: '100px', defaultVisible: false },
  { key: 'assetName', label: '個体管理名称', width: '200px', defaultVisible: true },
  { key: 'maker', label: 'メーカー名', width: '150px', defaultVisible: false },
  { key: 'model', label: '型式', width: '150px', defaultVisible: true },
  { key: 'quantity', label: '数量／単位', width: '100px', defaultVisible: false },
  { key: 'inspectionDate', label: '検収日', width: '120px', defaultVisible: false },
  { key: 'width', label: 'W', width: '80px', defaultVisible: false },
  { key: 'depth', label: 'D', width: '80px', defaultVisible: false },
  { key: 'height', label: 'H', width: '80px', defaultVisible: false },
  { key: 'lease', label: 'リース', width: '80px', defaultVisible: false },
  { key: 'rental', label: '借用', width: '80px', defaultVisible: false },
  { key: 'contractName', label: '契約･見積名称', width: '150px', defaultVisible: false },
  { key: 'contractNo', label: '契約番号（契約単位）', width: '180px', defaultVisible: false },
  { key: 'quotationNo', label: '見積番号', width: '120px', defaultVisible: false },
  { key: 'installationLocation', label: '設置場所', width: '150px', defaultVisible: false },
  { key: 'assetInfo', label: '資産情報', width: '200px', defaultVisible: false },
  { key: 'quantityNum', label: '数量', width: '80px', defaultVisible: false },
  { key: 'serialNumber', label: 'シリアル番号', width: '150px', defaultVisible: false },
  { key: 'contractDate', label: '契約･発注日', width: '120px', defaultVisible: false },
  { key: 'deliveryDate', label: '納品日', width: '120px', defaultVisible: false },
  { key: 'leaseStartDate', label: 'リース開始日', width: '120px', defaultVisible: false },
  { key: 'leaseEndDate', label: 'リース終了日', width: '120px', defaultVisible: false },
  { key: 'acquisitionCost', label: '取得価格', width: '120px', defaultVisible: false },
  { key: 'legalServiceLife', label: '耐用年数（法定）', width: '140px', defaultVisible: false },
  { key: 'recommendedServiceLife', label: '使用年数（メーカー推奨）', width: '180px', defaultVisible: false },
  { key: 'endOfService', label: 'End of service：販売終了', width: '180px', defaultVisible: false },
  { key: 'endOfSupport', label: 'End of support：メンテ終了', width: '180px', defaultVisible: false },
  { key: 'registrationDate', label: '登録日', width: '120px', defaultVisible: true },
  { key: 'applicationNo', label: '申請番号', width: '150px', defaultVisible: true },
  { key: 'status', label: 'ステータス', width: '100px', defaultVisible: true },
];

// サンプルデータ
const mockIndividualData: Individual[] = [
  {
    id: 1,
    qrCode: 'QR-2024-0001',
    assetName: '超音波診断装置',
    model: 'ProSound Alpha 7',
    location: {
      building: '本館',
      floor: '2F',
      department: '手術部門',
      section: '手術',
    },
    registrationDate: '2024-01-15',
    applicationNo: 'REQ-2024-0100',
    applicationType: '新規購入申請',
    status: '使用中',
    vendor: 'メディカルサプライ株式会社',
    serialNumber: 'SN-12345678',
    acquisitionCost: 15000000,
    documents: [
      {
        type: '契約書',
        filename: '超音波診断装置_契約書_2024-01-10.pdf',
        uploadDate: '2024-01-15',
        size: 2456789,
      },
      {
        type: '納品書',
        filename: '超音波診断装置_納品書_2024-01-15.pdf',
        uploadDate: '2024-01-15',
        size: 1234567,
      },
      {
        type: '保証書',
        filename: '超音波診断装置_保証書.pdf',
        uploadDate: '2024-01-15',
        size: 987654,
      },
    ],
  },
  {
    id: 2,
    qrCode: 'QR-2024-0002',
    assetName: '電気手術用電源装置',
    model: 'EW11',
    location: {
      building: '本館',
      floor: '2F',
      department: '手術部門',
      section: '手術',
    },
    registrationDate: '2024-02-20',
    applicationNo: 'REQ-2024-0105',
    applicationType: '新規購入申請',
    status: '使用中',
    vendor: '◯◯メディカル 東京支店',
    serialNumber: 'SN-87654321',
    acquisitionCost: 8500000,
  },
  {
    id: 3,
    qrCode: 'QR-2023-0150',
    assetName: 'X線撮影装置',
    model: 'X-R100',
    location: {
      building: '南館',
      floor: '1F',
      department: '放射線科',
      section: 'X線室',
    },
    registrationDate: '2023-06-10',
    applicationNo: 'REQ-2023-0055',
    applicationType: '更新購入申請',
    status: '廃棄済',
    vendor: '放射線機器株式会社',
    serialNumber: 'SN-OLD123',
    acquisitionCost: 12000000,
    disposalDate: '2024-06-10',
    disposalApplicationNo: 'REQ-2024-0200',
  },
];

export default function IndividualManagementListPage() {
  const router = useRouter();
  const [individualData, setIndividualData] = useState<Individual[]>(mockIndividualData);
  const [filteredData, setFilteredData] = useState<Individual[]>(mockIndividualData);
  const [filters, setFilters] = useState({
    qrCode: '',
    assetName: '',
    location: '',
    status: '',
  });
  const [selectedIndividual, setSelectedIndividual] = useState<Individual | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ALL_COLUMNS.forEach((col) => {
      initial[col.key] = col.defaultVisible ?? false;
    });
    return initial;
  });

  // フィルター適用
  const applyFilter = () => {
    let filtered = [...individualData];

    if (filters.qrCode) {
      filtered = filtered.filter((item) =>
        item.qrCode.toLowerCase().includes(filters.qrCode.toLowerCase())
      );
    }

    if (filters.assetName) {
      filtered = filtered.filter((item) =>
        item.assetName.toLowerCase().includes(filters.assetName.toLowerCase())
      );
    }

    if (filters.location) {
      filtered = filtered.filter((item) => {
        const locationText =
          `${item.location.building} ${item.location.floor} ${item.location.department} ${item.location.section}`;
        return locationText.toLowerCase().includes(filters.location.toLowerCase());
      });
    }

    if (filters.status) {
      filtered = filtered.filter((item) => item.status === filters.status);
    }

    setFilteredData(filtered);
  };

  // フィルタークリア
  const clearFilter = () => {
    setFilters({
      qrCode: '',
      assetName: '',
      location: '',
      status: '',
    });
    setFilteredData(individualData);
  };

  // 個体詳細を表示
  const handleViewDetail = (individual: Individual) => {
    setSelectedIndividual(individual);
    setIsDetailModalOpen(true);
  };

  // Excel出力
  const handleExportExcel = () => {
    alert('個体管理リストをExcel形式で出力します（実装予定）');
  };

  // カラム表示切り替え
  const toggleColumnVisibility = (key: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 全選択/全解除
  const handleSelectAll = () => {
    const newState: Record<string, boolean> = {};
    ALL_COLUMNS.forEach((col) => {
      newState[col.key] = true;
    });
    setVisibleColumns(newState);
  };

  const handleDeselectAll = () => {
    const newState: Record<string, boolean> = {};
    ALL_COLUMNS.forEach((col) => {
      newState[col.key] = false;
    });
    setVisibleColumns(newState);
  };

  // セルの値を取得
  const getCellValue = (item: Individual, key: string): any => {
    switch (key) {
      case 'building':
        return item.location.building;
      case 'floor':
        return item.location.floor;
      case 'department':
        return item.location.department;
      case 'section':
        return item.location.section;
      case 'acquisitionCost':
        return item.acquisitionCost ? `¥${item.acquisitionCost.toLocaleString()}` : '-';
      default:
        return (item as any)[key] || '-';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* ヘッダー */}
      <header
        style={{
          background: '#2c3e50',
          color: 'white',
          padding: '15px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                width: '50px',
                height: '50px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              SHIP
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>個体管理リスト原本</h1>
          </div>
          <span
            style={{
              background: '#34495e',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {filteredData.length}件
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsColumnSettingsOpen(true)}
            style={{
              background: '#9b59b6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚙️</span>
            <span>表示カラム設定</span>
          </button>
          <button
            onClick={handleExportExcel}
            style={{
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>📥</span>
            <span>Excel出力</span>
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
              style={{
                background: '#34495e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>📑</span>
              <span>メニュー</span>
              <span>▼</span>
            </button>
            {isNavMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '5px',
                  background: 'white',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  minWidth: '200px',
                  zIndex: 1000,
                }}
              >
                <div
                  onClick={() => {
                    router.push('/application-list');
                    setIsNavMenuOpen(false);
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    color: '#2c3e50',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    borderBottom: '1px solid #dee2e6',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <span>📝</span>
                  <span>申請一覧</span>
                </div>
                <div
                  onClick={() => {
                    router.push('/quotation-data-box');
                    setIsNavMenuOpen(false);
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    color: '#2c3e50',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    borderBottom: '1px solid #dee2e6',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <span>📦</span>
                  <span>見積書管理</span>
                </div>
                <div
                  onClick={() => {
                    router.push('/individual-management-list');
                    setIsNavMenuOpen(false);
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    color: '#2c3e50',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <span>📋</span>
                  <span>個体管理リスト</span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => router.back()}
            style={{
              background: '#34495e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            戻る
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div style={{ padding: '20px' }}>
        {/* フィルターセクション */}
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: '15px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#5a6c7d', marginBottom: '5px' }}>
                QRコード
              </label>
              <input
                type="text"
                value={filters.qrCode}
                onChange={(e) => setFilters({ ...filters, qrCode: e.target.value })}
                placeholder="QRコードで検索"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#5a6c7d', marginBottom: '5px' }}>
                資産名称
              </label>
              <input
                type="text"
                value={filters.assetName}
                onChange={(e) => setFilters({ ...filters, assetName: e.target.value })}
                placeholder="資産名称で検索"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#5a6c7d', marginBottom: '5px' }}>
                設置場所
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                placeholder="設置場所で検索"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#5a6c7d', marginBottom: '5px' }}>
                ステータス
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="">全て</option>
                <option value="使用中">使用中</option>
                <option value="廃棄済">廃棄済</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={applyFilter}
                style={{
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                検索
              </button>
              <button
                onClick={clearFilter}
                style={{
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                クリア
              </button>
            </div>
          </div>
        </div>

        {/* テーブル */}
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                minWidth: '1200px',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  {ALL_COLUMNS.filter((col) => visibleColumns[col.key]).map((col) => (
                    <th
                      key={col.key}
                      style={{
                        padding: '15px',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        color: '#2c3e50',
                        fontSize: '14px',
                        width: col.width,
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th
                    style={{
                      padding: '15px',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: '#2c3e50',
                      fontSize: '14px',
                      width: '150px',
                    }}
                  >
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={ALL_COLUMNS.filter((col) => visibleColumns[col.key]).length + 1} style={{ padding: '60px 20px', textAlign: 'center', color: '#5a6c7d' }}>
                      個体データがありません
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => {
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                        {ALL_COLUMNS.filter((col) => visibleColumns[col.key]).map((col) => {
                          if (col.key === 'status') {
                            const statusStyle = getIndividualStatusBadgeStyle(item.status);
                            return (
                              <td key={col.key} style={{ padding: '15px' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    background: statusStyle.background,
                                    color: statusStyle.color,
                                  }}
                                >
                                  {item.status}
                                </span>
                              </td>
                            );
                          }
                          if (col.key === 'applicationNo') {
                            return (
                              <td key={col.key} style={{ padding: '15px' }}>
                                <span
                                  onClick={() => alert(`申請詳細を表示: ${item.applicationNo}`)}
                                  style={{
                                    color: '#3498db',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {item.applicationNo}
                                </span>
                              </td>
                            );
                          }
                          if (col.key === 'qrCode') {
                            return (
                              <td key={col.key} style={{ padding: '15px' }}>
                                <strong style={{ color: '#2c3e50' }}>{getCellValue(item, col.key)}</strong>
                              </td>
                            );
                          }
                          return (
                            <td key={col.key} style={{ padding: '15px', color: '#5a6c7d' }}>
                              {getCellValue(item, col.key)}
                            </td>
                          );
                        })}
                        <td style={{ padding: '15px' }}>
                          <button
                            onClick={() => handleViewDetail(item)}
                            style={{
                              background: '#3498db',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '6px 16px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600',
                            }}
                          >
                            詳細
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

      {/* カラム設定モーダル */}
      {isColumnSettingsOpen && (
        <div
          onClick={() => setIsColumnSettingsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
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
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '20px', borderBottom: '1px solid #dee2e6' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
                表示カラム設定
              </h2>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleSelectAll}
                  style={{
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  全て選択
                </button>
                <button
                  onClick={handleDeselectAll}
                  style={{
                    background: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  全て解除
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {ALL_COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: visibleColumns[col.key] ? '#e3f2fd' : 'white',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[col.key]}
                      onChange={() => toggleColumnVisibility(col.key)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: '#2c3e50' }}>{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ padding: '20px', borderTop: '1px solid #dee2e6', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setIsColumnSettingsOpen(false)}
                style={{
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 30px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 詳細モーダル */}
      {isDetailModalOpen && selectedIndividual && (
        <div
          onClick={() => setIsDetailModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
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
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '30px',
            }}
          >
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '20px' }}>
              個体詳細
            </h2>

            {/* 基本情報 */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '6px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '15px' }}>
                基本情報
              </h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <span style={{ fontWeight: 'bold', color: '#5a6c7d', width: '120px' }}>QRコード:</span>
                  <span style={{ color: '#2c3e50' }}>
                    <strong>{selectedIndividual.qrCode}</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <span style={{ fontWeight: 'bold', color: '#5a6c7d', width: '120px' }}>資産名称:</span>
                  <span style={{ color: '#2c3e50' }}>{selectedIndividual.assetName}</span>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <span style={{ fontWeight: 'bold', color: '#5a6c7d', width: '120px' }}>型式:</span>
                  <span style={{ color: '#2c3e50' }}>{selectedIndividual.model || '-'}</span>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <span style={{ fontWeight: 'bold', color: '#5a6c7d', width: '120px' }}>製造番号:</span>
                  <span style={{ color: '#2c3e50' }}>{selectedIndividual.serialNumber || '-'}</span>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <span style={{ fontWeight: 'bold', color: '#5a6c7d', width: '120px' }}>ステータス:</span>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: getIndividualStatusBadgeStyle(selectedIndividual.status).background,
                      color: getIndividualStatusBadgeStyle(selectedIndividual.status).color,
                    }}
                  >
                    {selectedIndividual.status}
                  </span>
                </div>
              </div>
            </div>

            {/* 設置情報 */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '6px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '15px' }}>
                設置情報
              </h3>
              <div style={{ display: 'flex', gap: '20px' }}>
                <span style={{ fontWeight: 'bold', color: '#5a6c7d', width: '120px' }}>設置場所:</span>
                <span style={{ color: '#2c3e50' }}>
                  {selectedIndividual.location.building} {selectedIndividual.location.floor}{' '}
                  {selectedIndividual.location.department} {selectedIndividual.location.section}
                </span>
              </div>
            </div>

            {/* 申請・登録情報 */}
            <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '6px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '15px' }}>
                申請・登録情報
              </h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <span style={{ fontWeight: 'bold', color: '#5a6c7d', width: '120px' }}>申請番号:</span>
                  <span style={{ color: '#2c3e50' }}>{selectedIndividual.applicationNo}</span>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <span style={{ fontWeight: 'bold', color: '#5a6c7d', width: '120px' }}>申請種別:</span>
                  <span style={{ color: '#2c3e50' }}>{selectedIndividual.applicationType}</span>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <span style={{ fontWeight: 'bold', color: '#5a6c7d', width: '120px' }}>登録日:</span>
                  <span style={{ color: '#2c3e50' }}>{selectedIndividual.registrationDate}</span>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <span style={{ fontWeight: 'bold', color: '#5a6c7d', width: '120px' }}>購入先:</span>
                  <span style={{ color: '#2c3e50' }}>{selectedIndividual.vendor || '-'}</span>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <span style={{ fontWeight: 'bold', color: '#5a6c7d', width: '120px' }}>取得価格:</span>
                  <span style={{ color: '#2c3e50' }}>
                    ¥{(selectedIndividual.acquisitionCost || 0).toLocaleString()}
                  </span>
                </div>
                {selectedIndividual.status === '廃棄済' && (
                  <>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <span style={{ fontWeight: 'bold', color: '#5a6c7d', width: '120px' }}>廃棄日:</span>
                      <span style={{ color: '#2c3e50' }}>{selectedIndividual.disposalDate || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <span style={{ fontWeight: 'bold', color: '#5a6c7d', width: '120px' }}>廃棄申請番号:</span>
                      <span style={{ color: '#2c3e50' }}>{selectedIndividual.disposalApplicationNo || '-'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 関連ドキュメント */}
            {((selectedIndividual.documents && selectedIndividual.documents.length > 0) ||
              (selectedIndividual.disposalDocuments && selectedIndividual.disposalDocuments.length > 0)) && (
              <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '6px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '15px' }}>
                  📎 関連ドキュメント
                </h3>
                {selectedIndividual.documents && selectedIndividual.documents.length > 0 && (
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#5a6c7d', marginBottom: '10px' }}>
                      登録時のドキュメント:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedIndividual.documents.map((doc, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            padding: '12px',
                            background: 'white',
                            borderRadius: '4px',
                          }}
                        >
                          <span style={{ fontSize: '24px' }}>📄</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50' }}>
                              {doc.type}
                            </div>
                            <div style={{ fontSize: '12px', color: '#5a6c7d' }}>{doc.filename}</div>
                            <div style={{ fontSize: '11px', color: '#95a5a6' }}>
                              アップロード日: {doc.uploadDate}
                            </div>
                          </div>
                          <button
                            onClick={() => alert(`ダウンロードします: ${doc.filename}`)}
                            style={{
                              background: '#3498db',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '6px 12px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            ダウンロード
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ボタン */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 30px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
