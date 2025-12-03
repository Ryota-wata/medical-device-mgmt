'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Asset } from '@/lib/types';
import { useMasterStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useResponsive } from '@/lib/hooks/useResponsive';

export default function RemodelApplicationPage() {
  const router = useRouter();
  const { assets: assetMasters, facilities } = useMasterStore();
  const { isMobile } = useResponsive();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [currentView, setCurrentView] = useState<'list' | 'card'>('list');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  const facilityName = '〇〇〇〇〇〇病院';

  // フィルター状態
  const [filters, setFilters] = useState({
    building: '',
    floor: '',
    department: '',
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
      facility: '〇〇〇〇〇〇病院',
      building: i < 10 ? '本館' : '別館',
      floor: `${Math.floor(i / 4) + 1}F`,
      department: '手術部門',
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
  }, []);

  // フィルター適用
  useEffect(() => {
    let filtered = [...assets];

    if (filters.building) {
      filtered = filtered.filter((a) => a.building === filters.building);
    }
    if (filters.floor) {
      filtered = filtered.filter((a) => a.floor === filters.floor);
    }
    if (filters.department) {
      filtered = filtered.filter((a) => a.department === filters.department);
    }
    if (filters.section) {
      filtered = filtered.filter((a) => a.section === filters.section);
    }
    if (filters.category) {
      filtered = filtered.filter((a) => a.category === filters.category);
    }
    if (filters.largeClass) {
      filtered = filtered.filter((a) => a.largeClass === filters.largeClass);
    }
    if (filters.mediumClass) {
      filtered = filtered.filter((a) => a.mediumClass === filters.mediumClass);
    }

    setFilteredAssets(filtered);
  }, [filters, assets]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredAssets.map((a) => a.no)));
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

  const handleNewPurchaseApplication = () => {
    if (selectedItems.size === 0) {
      alert('資産を選択してください');
      return;
    }
    alert('新規購入申請画面へ遷移します');
  };

  const handleExpansionApplication = () => {
    if (selectedItems.size === 0) {
      alert('資産を選択してください');
      return;
    }
    alert('増設購入申請画面へ遷移します');
  };

  const handleRenewalApplication = () => {
    if (selectedItems.size === 0) {
      alert('資産を選択してください');
      return;
    }
    alert('更新購入申請画面へ遷移します');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'white' }}>
      {/* ヘッダー */}
      <header
        style={{
          background: '#2c3e50',
          color: 'white',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: '#27ae60',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              SHIP
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{facilityName}</span>
              <span style={{ color: '#95a5a6' }}>|</span>
              <span>資産管理リスト【リモデル申請】</span>
            </div>
          </div>
          <span style={{ fontSize: '14px', color: '#ecf0f1' }}>{filteredAssets.length}件（原本）</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* ナビゲーションメニュー */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                padding: '8px 16px',
                background: '#34495e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>📑 メニュー</span>
              <span style={{ fontSize: '10px' }}>▼</span>
            </button>
            {isMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  minWidth: '200px',
                  zIndex: 2000,
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push('/application-list');
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#2c3e50',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
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
                    setIsMenuOpen(false);
                    router.push('/quotation-data-box');
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#2c3e50',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
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
              </div>
            )}
          </div>

          <button
            onClick={() => setCurrentView(currentView === 'list' ? 'card' : 'list')}
            style={{
              width: '40px',
              height: '40px',
              background: '#34495e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="表示切替"
          >
            📋
          </button>
          <button
            onClick={() => setIsColumnPanelOpen(!isColumnPanelOpen)}
            style={{
              width: '40px',
              height: '40px',
              background: '#34495e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="表示カラム選択"
          >
            ⚙️
          </button>
          <button
            onClick={() => alert('Excel/PDF出力')}
            style={{
              width: '40px',
              height: '40px',
              background: '#34495e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Excel/PDF出力"
          >
            📊
          </button>
          <button
            onClick={() => window.print()}
            style={{
              width: '40px',
              height: '40px',
              background: '#34495e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="印刷"
          >
            🖨️
          </button>
          <button
            onClick={() => router.push('/main')}
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
            メニューに戻る
          </button>
        </div>
      </header>

      {/* フィルターヘッダー */}
      <div style={{ background: '#f8f9fa', padding: '15px 20px', borderBottom: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="棟"
              value={filters.building}
              onChange={(value) => setFilters({ ...filters, building: value })}
              options={['', ...buildingOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="階"
              value={filters.floor}
              onChange={(value) => setFilters({ ...filters, floor: value })}
              options={['', ...floorOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="部門"
              value={filters.department}
              onChange={(value) => setFilters({ ...filters, department: value })}
              options={['', ...departmentOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="Category"
              value={filters.category}
              onChange={(value) => setFilters({ ...filters, category: value })}
              options={['', ...categoryOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="大分類"
              value={filters.largeClass}
              onChange={(value) => setFilters({ ...filters, largeClass: value })}
              options={['', ...largeClassOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="中分類"
              value={filters.mediumClass}
              onChange={(value) => setFilters({ ...filters, mediumClass: value })}
              options={['', ...mediumClassOptions]}
              placeholder="すべて"
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      {/* アクションバー */}
      <div
        style={{
          background: '#fff',
          padding: '15px 20px',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '14px', color: '#555', marginRight: '15px' }}>{selectedItems.size}件選択中</span>
        <button
          onClick={handleNewPurchaseApplication}
          disabled={selectedItems.size === 0}
          style={{
            padding: '8px 16px',
            background: selectedItems.size === 0 ? '#ccc' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          新規購入申請
        </button>
        <button
          onClick={handleExpansionApplication}
          disabled={selectedItems.size === 0}
          style={{
            padding: '8px 16px',
            background: selectedItems.size === 0 ? '#ccc' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          増設購入申請
        </button>
        <button
          onClick={handleRenewalApplication}
          disabled={selectedItems.size === 0}
          style={{
            padding: '8px 16px',
            background: selectedItems.size === 0 ? '#ccc' : '#e67e22',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          更新購入申請
        </button>
      </div>

      {/* テーブル表示 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {currentView === 'list' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>
                  <input type="checkbox" onChange={(e) => handleSelectAll(e.target.checked)} />
                </th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>No.</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>施設名</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>棟</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>階</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>部門</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>品名</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>メーカー</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>型式</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr
                  key={asset.no}
                  style={{
                    borderBottom: '1px solid #dee2e6',
                    background: selectedItems.has(asset.no) ? '#e3f2fd' : 'white',
                  }}
                >
                  <td style={{ padding: '12px 8px' }}>
                    <input type="checkbox" checked={selectedItems.has(asset.no)} onChange={() => handleSelectItem(asset.no)} />
                  </td>
                  <td style={{ padding: '12px 8px', color: '#2c3e50' }}>{asset.no}</td>
                  <td style={{ padding: '12px 8px', color: '#2c3e50' }}>{asset.facility}</td>
                  <td style={{ padding: '12px 8px', color: '#2c3e50' }}>{asset.building}</td>
                  <td style={{ padding: '12px 8px', color: '#2c3e50' }}>{asset.floor}</td>
                  <td style={{ padding: '12px 8px', color: '#2c3e50' }}>{asset.department}</td>
                  <td style={{ padding: '12px 8px', color: '#2c3e50' }}>{asset.name}</td>
                  <td style={{ padding: '12px 8px', color: '#2c3e50' }}>{asset.maker}</td>
                  <td style={{ padding: '12px 8px', color: '#2c3e50' }}>{asset.model}</td>
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
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" checked={selectedItems.has(asset.no)} onChange={() => handleSelectItem(asset.no)} />
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
    </div>
  );
}
