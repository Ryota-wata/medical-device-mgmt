'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts';
import { useAssetStore, useMasterStore } from '@/lib/stores';
import { Asset } from '@/lib/types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useResponsive } from '@/lib/hooks/useResponsive';

// カラム定義
interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  defaultVisible?: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'no', label: 'No.', width: '80px', defaultVisible: true },
  { key: 'facility', label: '施設名', width: '200px', defaultVisible: true },
  { key: 'qrCode', label: 'QRコード', width: '150px', defaultVisible: true },
  { key: 'assetNo', label: '固定資産番号', width: '150px', defaultVisible: false },
  { key: 'managementNo', label: '管理機器番号', width: '150px', defaultVisible: false },
  { key: 'building', label: '棟', width: '100px', defaultVisible: true },
  { key: 'floor', label: '階', width: '80px', defaultVisible: true },
  { key: 'department', label: '部門名', width: '120px', defaultVisible: true },
  { key: 'section', label: '部署名', width: '120px', defaultVisible: false },
  { key: 'roomClass1', label: '諸室区分①', width: '120px', defaultVisible: false },
  { key: 'roomClass2', label: '諸室区分②', width: '120px', defaultVisible: false },
  { key: 'roomName', label: '諸室名称', width: '150px', defaultVisible: false },
  { key: 'category', label: 'Category', width: '120px', defaultVisible: false },
  { key: 'largeClass', label: '大分類', width: '150px', defaultVisible: false },
  { key: 'mediumClass', label: '中分類', width: '150px', defaultVisible: false },
  { key: 'item', label: '品目', width: '150px', defaultVisible: false },
  { key: 'name', label: '個体管理名称', width: '200px', defaultVisible: true },
  { key: 'maker', label: 'メーカー名', width: '150px', defaultVisible: true },
  { key: 'model', label: '型式', width: '150px', defaultVisible: true },
  { key: 'quantityUnit', label: '数量／単位', width: '120px', defaultVisible: false },
  { key: 'quantity', label: '数量', width: '80px', defaultVisible: false },
  { key: 'serialNumber', label: 'シリアル番号', width: '150px', defaultVisible: false },
  { key: 'width', label: 'W', width: '80px', defaultVisible: false },
  { key: 'depth', label: 'D', width: '80px', defaultVisible: false },
  { key: 'height', label: 'H', width: '80px', defaultVisible: false },
  { key: 'installationLocation', label: '設置場所', width: '150px', defaultVisible: false },
  { key: 'assetInfo', label: '資産情報', width: '200px', defaultVisible: false },
  { key: 'contractName', label: '契約･見積名称', width: '180px', defaultVisible: false },
  { key: 'contractNo', label: '契約番号（契約単位）', width: '180px', defaultVisible: false },
  { key: 'quotationNo', label: '見積番号', width: '120px', defaultVisible: false },
  { key: 'contractDate', label: '契約･発注日', width: '120px', defaultVisible: false },
  { key: 'deliveryDate', label: '納品日', width: '120px', defaultVisible: false },
  { key: 'inspectionDate', label: '検収日', width: '120px', defaultVisible: false },
  { key: 'lease', label: 'リース', width: '80px', defaultVisible: false },
  { key: 'rental', label: '借用', width: '80px', defaultVisible: false },
  { key: 'leaseStartDate', label: 'リース開始日', width: '120px', defaultVisible: false },
  { key: 'leaseEndDate', label: 'リース終了日', width: '120px', defaultVisible: false },
  { key: 'acquisitionCost', label: '取得価格', width: '120px', defaultVisible: false },
  { key: 'legalServiceLife', label: '耐用年数（法定）', width: '140px', defaultVisible: false },
  { key: 'recommendedServiceLife', label: '使用年数（メーカー推奨）', width: '180px', defaultVisible: false },
  { key: 'endOfService', label: 'End of service：販売終了', width: '180px', defaultVisible: false },
  { key: 'endOfSupport', label: 'End of support：メンテ終了', width: '180px', defaultVisible: false },
];

export default function AssetSearchResultPage() {
  const router = useRouter();
  const { assets } = useAssetStore();
  const { assets: assetMasters, facilities } = useMasterStore();
  const { isMobile } = useResponsive();
  const [currentView, setCurrentView] = useState<'list' | 'card'>('list');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ALL_COLUMNS.forEach((col) => {
      initial[col.key] = col.defaultVisible ?? false;
    });
    return initial;
  });

  // カラム幅の状態管理
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = { checkbox: 50 };
    ALL_COLUMNS.forEach((col) => {
      initial[col.key] = parseInt(col.width || '150');
    });
    return initial;
  });

  // リサイズ中の状態管理
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  // フィルター状態
  const [filters, setFilters] = useState({
    building: '',
    floor: '',
    department: '',
    section: '',
    category: '',
    largeClass: '',
    mediumClass: ''
  });

  // マスタデータからフィルターoptionsを生成
  const categoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(new Set(assetMasters.map(a => a.category)));
    return uniqueCategories.filter(Boolean);
  }, [assetMasters]);

  const largeClassOptions = useMemo(() => {
    const uniqueLargeClasses = Array.from(new Set(assetMasters.map(a => a.largeClass)));
    return uniqueLargeClasses.filter(Boolean);
  }, [assetMasters]);

  const mediumClassOptions = useMemo(() => {
    const uniqueMediumClasses = Array.from(new Set(assetMasters.map(a => a.mediumClass)));
    return uniqueMediumClasses.filter(Boolean);
  }, [assetMasters]);

  // 施設マスタからフィルターoptionsを生成
  const buildingOptions = useMemo(() => {
    const uniqueBuildings = Array.from(new Set(facilities.map(f => f.building).filter((b): b is string => !!b)));
    return uniqueBuildings;
  }, [facilities]);

  const floorOptions = useMemo(() => {
    const uniqueFloors = Array.from(new Set(facilities.map(f => f.floor).filter((f): f is string => !!f)));
    return uniqueFloors;
  }, [facilities]);

  const departmentOptions = useMemo(() => {
    const uniqueDepartments = Array.from(new Set(facilities.map(f => f.department).filter((d): d is string => !!d)));
    return uniqueDepartments;
  }, [facilities]);

  const sectionOptions = useMemo(() => {
    const uniqueSections = Array.from(new Set(facilities.map(f => f.section).filter((s): s is string => !!s)));
    return uniqueSections;
  }, [facilities]);

  // モックデータ（実際のデータは useAssetStore から取得）
  const [mockAssets] = useState<Asset[]>([
    {
      qrCode: 'QR-2025-0001',
      no: 1,
      facility: '〇〇〇〇〇〇病院',
      building: '本館',
      floor: '2F',
      department: '手術部門',
      section: '手術',
      category: '医療機器',
      largeClass: '手術関連機器',
      mediumClass: '電気メス 双極',
      item: '手術台',
      name: '電気手術用電源装置2システム',
      maker: '医療',
      model: 'EW11 超音波吸引器',
      quantity: 1,
      width: 520,
      depth: 480,
      height: 1400,
      assetNo: '10605379-000',
      managementNo: '1338',
      roomClass1: '手術室',
      roomClass2: 'OP室',
      roomName: '手術室A',
      installationLocation: '手術室A-中央',
      assetInfo: '資産台帳登録済',
      quantityUnit: '1台',
      serialNumber: 'SN-2024-001',
      contractName: '医療機器購入契約2024-01',
      contractNo: 'C-2024-0001',
      quotationNo: 'Q-2024-0001',
      contractDate: '2024-01-10',
      deliveryDate: '2024-01-20',
      inspectionDate: '2024-01-25',
      lease: 'なし',
      rental: 'なし',
      leaseStartDate: '',
      leaseEndDate: '',
      acquisitionCost: 15000000,
      legalServiceLife: '6年',
      recommendedServiceLife: '8年',
      endOfService: '2032-12-31',
      endOfSupport: '2035-12-31',
    },
    ...Array.from({length: 19}, (_, i) => ({
      qrCode: `QR-2025-${String(i + 2).padStart(4, '0')}`,
      no: i + 2,
      facility: '〇〇〇〇〇〇病院',
      building: '本館',
      floor: '2F',
      department: '手術部門',
      section: '手術',
      category: '医療機器',
      largeClass: '手術関連機器',
      mediumClass: 'CT関連',
      item: `品目${i + 2}`,
      name: `サンプル製品${i + 2}`,
      maker: '医療機器',
      model: `MODEL-${i + 2}`,
      quantity: 1,
      width: 500 + i * 10,
      depth: 600 + i * 10,
      height: 700 + i * 10,
      assetNo: `10605379-${String(i + 1).padStart(3, '0')}`,
      managementNo: `${1338 + i + 1}`,
      roomClass1: '手術室',
      roomClass2: 'OP室',
      roomName: `手術室${String.fromCharCode(66 + i)}`,
      installationLocation: `手術室${String.fromCharCode(66 + i)}-中央`,
      assetInfo: '資産台帳登録済',
      quantityUnit: '1台',
      serialNumber: `SN-2024-${String(i + 2).padStart(3, '0')}`,
      contractName: `医療機器購入契約2024-${String(i + 2).padStart(2, '0')}`,
      contractNo: `C-2024-${String(i + 2).padStart(4, '0')}`,
      quotationNo: `Q-2024-${String(i + 2).padStart(4, '0')}`,
      contractDate: '2024-01-10',
      deliveryDate: '2024-01-20',
      inspectionDate: '2024-01-25',
      lease: i % 3 === 0 ? 'あり' : 'なし',
      rental: i % 5 === 0 ? 'あり' : 'なし',
      leaseStartDate: i % 3 === 0 ? '2024-01-01' : '',
      leaseEndDate: i % 3 === 0 ? '2029-12-31' : '',
      acquisitionCost: 1000000 * (i + 2),
      legalServiceLife: '6年',
      recommendedServiceLife: '8年',
      endOfService: '2032-12-31',
      endOfSupport: '2035-12-31',
    }))
  ]);

  useEffect(() => {
    // フィルター適用
    let filtered = mockAssets;

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
    if (filters.category) {
      filtered = filtered.filter(a => a.category === filters.category);
    }
    if (filters.largeClass) {
      filtered = filtered.filter(a => a.largeClass === filters.largeClass);
    }
    if (filters.mediumClass) {
      filtered = filtered.filter(a => a.mediumClass === filters.mediumClass);
    }

    setFilteredAssets(filtered);
  }, [filters, mockAssets]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredAssets.map(a => a.no)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (no: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(no)) {
      newSelected.delete(no);
    } else {
      newSelected.add(no);
    }
    setSelectedItems(newSelected);
  };

  const handleRowClick = (asset: Asset) => {
    router.push(`/asset-detail?qrCode=${asset.qrCode}`);
  };

  // カラム表示切り替え
  const toggleColumnVisibility = (key: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 全選択/全解除
  const handleSelectAllColumns = () => {
    const newState: Record<string, boolean> = {};
    ALL_COLUMNS.forEach((col) => {
      newState[col.key] = true;
    });
    setVisibleColumns(newState);
  };

  const handleDeselectAllColumns = () => {
    const newState: Record<string, boolean> = {};
    ALL_COLUMNS.forEach((col) => {
      newState[col.key] = false;
    });
    setVisibleColumns(newState);
  };

  // カラムリサイズのハンドラー
  const handleResizeStart = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    setResizeStartX(e.clientX);
    setResizeStartWidth(columnWidths[columnKey]);
  };

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(50, resizeStartWidth + diff);
      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  // セルの値を取得
  const getCellValue = (asset: Asset, key: string): any => {
    if (key === 'acquisitionCost' && asset.acquisitionCost) {
      return `¥${asset.acquisitionCost.toLocaleString()}`;
    }
    return (asset as any)[key] ?? '-';
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'white' }}>
      <Header
        title="資産リスト"
        resultCount={filteredAssets.length}
        onViewToggle={() => setCurrentView(currentView === 'list' ? 'card' : 'list')}
        onExport={() => alert('Excel/PDF出力')}
        onPrint={() => window.print()}
        onColumnSettings={() => setIsColumnSettingsOpen(true)}
        showBackButton={true}
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

      {/* アクションバー */}
      <div style={{ background: '#fff', padding: '15px 20px', borderBottom: '1px solid #dee2e6', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '14px', color: '#555', marginRight: '15px' }}>
          {selectedItems.size}件選択中
        </span>
        <button
          style={{
            padding: '8px 16px',
            background: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onClick={() => alert('新規購入申請')}
        >
          新規購入申請
        </button>
        <button
          disabled={selectedItems.size === 0}
          style={{
            padding: '8px 16px',
            background: selectedItems.size === 0 ? '#ccc' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
          onClick={() => alert('増設購入申請')}
        >
          増設購入申請
        </button>
        <button
          disabled={selectedItems.size === 0}
          style={{
            padding: '8px 16px',
            background: selectedItems.size === 0 ? '#ccc' : '#e67e22',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
          onClick={() => alert('更新購入申請')}
        >
          更新購入申請
        </button>
      </div>

      {/* テーブル表示 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {currentView === 'list' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th
                  style={{
                    padding: '12px 8px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    width: `${columnWidths.checkbox}px`,
                    position: 'relative',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                >
                  <input type="checkbox" onChange={(e) => handleSelectAll(e.target.checked)} />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'checkbox')}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      cursor: 'col-resize',
                      background: resizingColumn === 'checkbox' ? '#3498db' : 'transparent',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!resizingColumn) e.currentTarget.style.background = '#ddd';
                    }}
                    onMouseLeave={(e) => {
                      if (!resizingColumn) e.currentTarget.style.background = 'transparent';
                    }}
                  />
                </th>
                {ALL_COLUMNS.filter((col) => visibleColumns[col.key]).map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: '12px 8px',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: '#2c3e50',
                      width: `${columnWidths[col.key]}px`,
                      position: 'relative',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {col.label}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, col.key)}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        cursor: 'col-resize',
                        background: resizingColumn === col.key ? '#3498db' : 'transparent',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!resizingColumn) e.currentTarget.style.background = '#ddd';
                      }}
                      onMouseLeave={(e) => {
                        if (!resizingColumn) e.currentTarget.style.background = 'transparent';
                      }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr
                  key={asset.no}
                  style={{
                    borderBottom: '1px solid #dee2e6',
                    cursor: 'pointer',
                    background: selectedItems.has(asset.no) ? '#e3f2fd' : 'white'
                  }}
                  onClick={() => handleRowClick(asset)}
                  onMouseEnter={(e) => {
                    if (!selectedItems.has(asset.no)) {
                      e.currentTarget.style.background = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedItems.has(asset.no)) {
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(asset.no)}
                      onChange={() => handleSelectItem(asset.no)}
                    />
                  </td>
                  {ALL_COLUMNS.filter((col) => visibleColumns[col.key]).map((col) => (
                    <td key={col.key} style={{ padding: '12px 8px', color: '#2c3e50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getCellValue(asset, col.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {currentView === 'card' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filteredAssets.map((asset) => (
              <div
                key={asset.no}
                style={{
                  background: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onClick={() => handleRowClick(asset)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedItems.has(asset.no)}
                    onChange={() => handleSelectItem(asset.no)}
                  />
                  <strong style={{ color: '#2c3e50' }}>No. {asset.no}</strong>
                </div>
                <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#2c3e50' }}>{asset.name}</h3>
                <div style={{ fontSize: '13px', color: '#5a6c7d', lineHeight: '1.6' }}>
                  <div>施設: {asset.facility}</div>
                  <div>場所: {asset.building} {asset.floor}</div>
                  <div>部門: {asset.department}</div>
                  <div>メーカー: {asset.maker}</div>
                  <div>型式: {asset.model}</div>
                </div>
              </div>
            ))}
          </div>
        )}
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
            background: 'rgba(0, 0, 0, 0.5)',
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
              width: '90%',
              maxWidth: '700px',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* モーダルヘッダー */}
            <div
              style={{
                background: '#9b59b6',
                color: 'white',
                padding: '20px 24px',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>表示カラム設定（42カラム）</span>
              <button
                onClick={() => setIsColumnSettingsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                }}
              >
                ×
              </button>
            </div>

            {/* モーダルボディ */}
            <div style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
              <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleSelectAllColumns}
                  style={{
                    padding: '8px 16px',
                    background: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  全て選択
                </button>
                <button
                  onClick={handleDeselectAllColumns}
                  style={{
                    padding: '8px 16px',
                    background: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  全て解除
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {ALL_COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px',
                      background: visibleColumns[col.key] ? '#e8f5e9' : '#f5f5f5',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[col.key]}
                      onChange={() => toggleColumnVisibility(col.key)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '13px', color: '#2c3e50' }}>{col.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* モーダルフッター */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #dee2e6',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setIsColumnSettingsOpen(false)}
                style={{
                  padding: '10px 24px',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
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
