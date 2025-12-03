'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Asset } from '@/lib/types';
import { useMasterStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { Header } from '@/components/layouts/Header';

// カラム定義（資産検索結果画面と同じ）
interface Column {
  key: string;
  label: string;
  width?: string;
}

const ALL_COLUMNS: Column[] = [
  { key: 'qrCode', label: 'QRコード', width: '120px' },
  { key: 'no', label: 'No.', width: '80px' },
  { key: 'facility', label: '施設', width: '150px' },
  { key: 'building', label: '建物', width: '100px' },
  { key: 'floor', label: '階', width: '80px' },
  { key: 'department', label: '部門', width: '120px' },
  { key: 'section', label: '部署', width: '120px' },
  { key: 'category', label: 'カテゴリ', width: '120px' },
  { key: 'largeClass', label: '大分類', width: '150px' },
  { key: 'mediumClass', label: '中分類', width: '150px' },
  { key: 'item', label: '品目', width: '150px' },
  { key: 'name', label: '機器名称', width: '200px' },
  { key: 'maker', label: 'メーカー', width: '150px' },
  { key: 'model', label: '型式', width: '150px' },
  { key: 'quantity', label: '数量', width: '80px' },
  { key: 'width', label: '幅(mm)', width: '100px' },
  { key: 'depth', label: '奥行(mm)', width: '100px' },
  { key: 'height', label: '高さ(mm)', width: '100px' },
];

export default function RemodelApplicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { assets: assetMasters, facilities } = useMasterStore();
  const { isMobile } = useResponsive();

  // URLパラメータから施設・部署を取得
  const facility = searchParams.get('facility') || '';
  const department = searchParams.get('department') || '';

  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [currentView, setCurrentView] = useState<'list' | 'card'>('list');
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [isApplicationMenuOpen, setIsApplicationMenuOpen] = useState(false);

  // カラム表示設定
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(ALL_COLUMNS.map(col => col.key))
  );

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
    department: department,
    section: '',
    category: '',
    largeClass: '',
    mediumClass: '',
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

  // モックデータ
  useEffect(() => {
    const mockData: Asset[] = Array.from({ length: 20 }, (_, i) => ({
      qrCode: `QR-2025-${String(i + 1).padStart(4, '0')}`,
      no: i + 1,
      facility: facility,
      building: i < 10 ? '本館' : '別館',
      floor: `${Math.floor(i / 4) + 1}F`,
      department: department,
      section: '手術',
      category: '医療機器',
      largeClass: '手術関連機器',
      mediumClass: i % 2 === 0 ? '電気メス 双極' : 'CT関連',
      item: `品目${i + 1}`,
      name: `医療機器${i + 1}`,
      maker: '医療メーカー',
      model: `MODEL-${i + 1}`,
      quantity: 1,
      width: 500 + i * 10,
      depth: 600 + i * 10,
      height: 700 + i * 10,
    }));

    setAssets(mockData);
    setFilteredAssets(mockData);
  }, [facility, department]);

  // フィルター適用
  useEffect(() => {
    let filtered = [...assets];

    if (filters.building) {
      filtered = filtered.filter((asset) => asset.building === filters.building);
    }
    if (filters.floor) {
      filtered = filtered.filter((asset) => asset.floor === filters.floor);
    }
    if (filters.department) {
      filtered = filtered.filter((asset) => asset.department === filters.department);
    }
    if (filters.section) {
      filtered = filtered.filter((asset) => asset.section === filters.section);
    }
    if (filters.category) {
      filtered = filtered.filter((asset) => asset.category === filters.category);
    }
    if (filters.largeClass) {
      filtered = filtered.filter((asset) => asset.largeClass === filters.largeClass);
    }
    if (filters.mediumClass) {
      filtered = filtered.filter((asset) => asset.mediumClass === filters.mediumClass);
    }

    setFilteredAssets(filtered);
  }, [filters, assets]);

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIndexes = new Set(filteredAssets.map((_, index) => index));
      setSelectedItems(allIndexes);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedItems(newSelected);
  };

  const handleRowClick = (asset: Asset) => {
    router.push(`/asset-detail?qrCode=${asset.qrCode}&readonly=true`);
  };

  const handleApplicationAction = (actionType: string) => {
    if (selectedItems.size === 0) {
      alert('申請する資産を選択してください');
      return;
    }
    alert(`${actionType}を実行します（${selectedItems.size}件選択中）`);
    setIsApplicationMenuOpen(false);
  };

  const handleExport = () => {
    alert('Excel/PDF出力機能（開発中）');
  };

  const handlePrint = () => {
    alert('印刷機能（開発中）');
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleFilterClear = () => {
    setFilters({
      building: '',
      floor: '',
      department: department,
      section: '',
      category: '',
      largeClass: '',
      mediumClass: '',
    });
  };

  const toggleColumnVisibility = (columnKey: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnKey)) {
      newVisible.delete(columnKey);
    } else {
      newVisible.add(columnKey);
    }
    setVisibleColumns(newVisible);
  };

  const visibleColumnsList = ALL_COLUMNS.filter(col => visibleColumns.has(col.key));

  const getCellValue = (asset: Asset, key: string): string | number => {
    return asset[key as keyof Asset] as string | number || '';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header
        title={`リモデル申請 - ${facility} ${department}`}
        showBackButton={true}
        resultCount={filteredAssets.length}
        onExport={handleExport}
        onPrint={handlePrint}
        onViewToggle={() => setCurrentView(currentView === 'list' ? 'card' : 'list')}
        onColumnSettings={() => setIsColumnPanelOpen(!isColumnPanelOpen)}
      />

      <div style={{ padding: isMobile ? '12px' : '20px', maxWidth: '100%', margin: '0 auto' }}>
        {/* フィルターセクション */}
        <div
          style={{
            background: 'white',
            padding: isMobile ? '16px' : '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', color: '#2c3e50', fontWeight: 600 }}>
              フィルター
            </h3>
            <button
              onClick={handleFilterClear}
              style={{
                padding: '6px 12px',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              クリア
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            <SearchableSelect
              label="建物"
              value={filters.building}
              onChange={(value) => handleFilterChange('building', value)}
              options={['', ...buildingOptions]}
              placeholder="選択してください"
              isMobile={isMobile}
            />
            <SearchableSelect
              label="階"
              value={filters.floor}
              onChange={(value) => handleFilterChange('floor', value)}
              options={['', ...floorOptions]}
              placeholder="選択してください"
              isMobile={isMobile}
            />
            <SearchableSelect
              label="部門"
              value={filters.department}
              onChange={(value) => handleFilterChange('department', value)}
              options={['', ...departmentOptions]}
              placeholder="選択してください"
              isMobile={isMobile}
            />
            <SearchableSelect
              label="部署"
              value={filters.section}
              onChange={(value) => handleFilterChange('section', value)}
              options={['', ...sectionOptions]}
              placeholder="選択してください"
              isMobile={isMobile}
            />
            <SearchableSelect
              label="カテゴリ"
              value={filters.category}
              onChange={(value) => handleFilterChange('category', value)}
              options={['', ...categoryOptions]}
              placeholder="選択してください"
              isMobile={isMobile}
            />
            <SearchableSelect
              label="大分類"
              value={filters.largeClass}
              onChange={(value) => handleFilterChange('largeClass', value)}
              options={['', ...largeClassOptions]}
              placeholder="選択してください"
              isMobile={isMobile}
            />
            <SearchableSelect
              label="中分類"
              value={filters.mediumClass}
              onChange={(value) => handleFilterChange('mediumClass', value)}
              options={['', ...mediumClassOptions]}
              placeholder="選択してください"
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* 申請アクションボタン */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsApplicationMenuOpen(!isApplicationMenuOpen)}
              style={{
                padding: '10px 20px',
                background: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              申請アクション
              <span style={{ fontSize: '12px' }}>▼</span>
            </button>

            {isApplicationMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  minWidth: '200px',
                }}
              >
                {['新規申請', '増設申請', '更新申請', '移動申請', '廃棄申請', '保留'].map((action) => (
                  <div
                    key={action}
                    onClick={() => handleApplicationAction(action)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#2c3e50',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    {action}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedItems.size > 0 && (
            <span style={{ color: '#2c3e50', fontSize: '14px', fontWeight: '600' }}>
              {selectedItems.size}件選択中
            </span>
          )}
        </div>

        {/* テーブル表示 */}
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
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
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.size === filteredAssets.length && filteredAssets.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  {visibleColumnsList.map((col) => (
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
                        textOverflow: 'ellipsis',
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
                {filteredAssets.map((asset, index) => (
                  <tr
                    key={index}
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <td
                      style={{
                        padding: '12px 8px',
                        color: '#2c3e50',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.has(index)}
                        onChange={(e) => handleSelectItem(index, e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    {visibleColumnsList.map((col) => (
                      <td
                        key={col.key}
                        onClick={() => handleRowClick(asset)}
                        style={{
                          padding: '12px 8px',
                          color: '#2c3e50',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {getCellValue(asset, col.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* カラム設定パネル */}
      {isColumnPanelOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: isMobile ? '80%' : '300px',
            background: 'white',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
            zIndex: 1000,
            padding: '20px',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#2c3e50' }}>表示カラム設定</h3>
            <button
              onClick={() => setIsColumnPanelOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#7f8c8d',
              }}
            >
              ×
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ALL_COLUMNS.map((col) => (
              <label
                key={col.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '4px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.has(col.key)}
                  onChange={() => toggleColumnVisibility(col.key)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: '#2c3e50' }}>{col.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* オーバーレイ（カラム設定パネルが開いているとき） */}
      {isColumnPanelOpen && (
        <div
          onClick={() => setIsColumnPanelOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
}
