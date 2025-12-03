'use client';

import React, { useState, useMemo } from 'react';
import { AssetMaster } from '@/lib/types/master';
import { useMasterStore } from '@/lib/stores';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export default function AssetMasterPage() {
  const { assets: assetMasters, facilities } = useMasterStore();
  const { isMobile } = useResponsive();
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

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

  // フィルターoptionsを生成（施設マスタから）
  const buildingOptions = useMemo(() => {
    const uniqueBuildings = Array.from(new Set(facilities.map(f => f.building)));
    return uniqueBuildings.filter(Boolean);
  }, [facilities]);

  const floorOptions = useMemo(() => {
    const uniqueFloors = Array.from(new Set(facilities.map(f => f.floor)));
    return uniqueFloors.filter(Boolean);
  }, [facilities]);

  const departmentOptions = useMemo(() => {
    const uniqueDepartments = Array.from(new Set(facilities.map(f => f.department)));
    return uniqueDepartments.filter(Boolean);
  }, [facilities]);

  const sectionOptions = useMemo(() => {
    const uniqueSections = Array.from(new Set(facilities.map(f => f.section)));
    return uniqueSections.filter(Boolean);
  }, [facilities]);

  // マスタデータからフィルターoptionsを生成（資産マスタから）
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

  // フィルタリングされた資産
  const filteredAssets = useMemo(() => {
    let filtered = assetMasters;

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

    return filtered;
  }, [assetMasters, filters]);

  // チェックボックスの全選択/全解除
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== Select All onChange ===');
    console.log('e.target.checked:', e.target.checked);
    console.log('filteredAssets count:', filteredAssets.length);

    if (e.target.checked) {
      const allAssetIds = filteredAssets.map(asset => asset.id);
      console.log('Selecting all assets:', allAssetIds);
      setSelectedAssets(new Set(allAssetIds));
    } else {
      console.log('Deselecting all assets');
      setSelectedAssets(new Set());
    }
    console.log('======================');
  };

  // 選択した資産を親ウィンドウに渡す
  const handleConfirmSelection = () => {
    const selected = assetMasters.filter(asset => selectedAssets.has(asset.id));

    if (selected.length === 0) {
      alert('資産を選択してください');
      return;
    }

    // 親ウィンドウに選択した資産を渡す
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'ASSET_SELECTED',
        assets: selected
      }, window.location.origin);
      window.close();
    } else {
      alert('親ウィンドウが見つかりません');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* ヘッダー */}
      <div style={{
        background: '#2c3e50',
        color: 'white',
        padding: isMobile ? '12px' : '16px 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: isMobile ? '18px' : '20px',
          fontWeight: 'bold',
          margin: 0
        }}>
          資産マスタ選択
        </h1>
      </div>

      {/* フィルターヘッダー */}
      <div style={{ background: '#f8f9fa', padding: '15px 20px', borderBottom: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
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
          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="Category"
              value={filters.category}
              onChange={(value) => setFilters({...filters, category: value})}
              options={categoryOptions}
              placeholder="全て"
              isMobile={isMobile}
            />
          </div>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <SearchableSelect
              label="大分類"
              value={filters.largeClass}
              onChange={(value) => setFilters({...filters, largeClass: value})}
              options={largeClassOptions}
              placeholder="全て"
              isMobile={isMobile}
            />
          </div>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <SearchableSelect
              label="中分類"
              value={filters.mediumClass}
              onChange={(value) => setFilters({...filters, mediumClass: value})}
              options={mediumClassOptions}
              placeholder="全て"
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      {/* アクションバー */}
      <div style={{
        background: 'white',
        padding: '16px 20px',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{
          fontSize: isMobile ? '13px' : '14px',
          color: '#2c3e50',
          fontWeight: 'bold'
        }}>
          {selectedAssets.size}件選択中 / 全{filteredAssets.length}件
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleConfirmSelection}
            disabled={selectedAssets.size === 0}
            style={{
              padding: isMobile ? '10px 20px' : '12px 24px',
              background: selectedAssets.size === 0 ? '#bdc3c7' : '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: 'bold',
              cursor: selectedAssets.size === 0 ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (selectedAssets.size > 0) {
                e.currentTarget.style.background = '#229954';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedAssets.size > 0) {
                e.currentTarget.style.background = '#27ae60';
              }
            }}
          >
            選択を確定
          </button>
          <button
            onClick={() => window.close()}
            style={{
              padding: isMobile ? '10px 20px' : '12px 24px',
              background: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#7f8c8d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#95a5a6';
            }}
          >
            キャンセル
          </button>
        </div>
      </div>

      {/* 資産テーブル */}
      <div style={{
        flex: 1,
        background: 'white',
        margin: '20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: isMobile ? '12px' : '14px'
          }}>
            <thead style={{
              background: '#34495e',
              color: 'white',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <tr>
                <th style={{
                  padding: isMobile ? '10px 8px' : '12px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  width: '50px',
                  borderRight: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedAssets.size === filteredAssets.length && filteredAssets.length > 0}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </th>
                <th style={{
                  padding: isMobile ? '10px 8px' : '12px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  borderRight: '1px solid rgba(255,255,255,0.1)',
                  minWidth: '60px'
                }}>
                  No.
                </th>
                <th style={{
                  padding: isMobile ? '10px 8px' : '12px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  borderRight: '1px solid rgba(255,255,255,0.1)',
                  minWidth: '100px'
                }}>
                  Category
                </th>
                <th style={{
                  padding: isMobile ? '10px 8px' : '12px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  borderRight: '1px solid rgba(255,255,255,0.1)',
                  minWidth: '150px'
                }}>
                  大分類
                </th>
                <th style={{
                  padding: isMobile ? '10px 8px' : '12px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  borderRight: '1px solid rgba(255,255,255,0.1)',
                  minWidth: '150px'
                }}>
                  中分類
                </th>
                <th style={{
                  padding: isMobile ? '10px 8px' : '12px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  borderRight: '1px solid rgba(255,255,255,0.1)',
                  minWidth: '200px'
                }}>
                  品目
                </th>
                <th style={{
                  padding: isMobile ? '10px 8px' : '12px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  borderRight: '1px solid rgba(255,255,255,0.1)',
                  minWidth: '150px'
                }}>
                  メーカー
                </th>
                <th style={{
                  padding: isMobile ? '10px 8px' : '12px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  minWidth: '150px'
                }}>
                  型式
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset, index) => (
                <tr
                  key={asset.no}
                  style={{
                    background: index % 2 === 0 ? 'white' : '#f8f9fa',
                    borderBottom: '1px solid #ecf0f1'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e8f4f8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#f8f9fa';
                  }}
                >
                  <td
                    style={{
                      padding: isMobile ? '10px 8px' : '12px',
                      textAlign: 'center',
                      borderRight: '1px solid #ecf0f1'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssets.has(asset.id)}
                      onChange={(e) => {
                        console.log('=== Checkbox onChange ===');
                        console.log('Asset ID:', asset.id);
                        console.log('e.target.checked:', e.target.checked);
                        console.log('Before selectedAssets:', Array.from(selectedAssets));

                        const newSelected = new Set(selectedAssets);
                        if (e.target.checked) {
                          newSelected.add(asset.id);
                          console.log('Adding asset:', asset.id);
                        } else {
                          newSelected.delete(asset.id);
                          console.log('Removing asset:', asset.id);
                        }

                        console.log('After selectedAssets:', Array.from(newSelected));
                        console.log('======================');
                        setSelectedAssets(newSelected);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </td>
                  <td style={{
                    padding: isMobile ? '10px 8px' : '12px',
                    color: '#2c3e50',
                    borderRight: '1px solid #ecf0f1'
                  }}>
                    {index + 1}
                  </td>
                  <td style={{
                    padding: isMobile ? '10px 8px' : '12px',
                    color: '#2c3e50',
                    borderRight: '1px solid #ecf0f1'
                  }}>
                    {asset.category}
                  </td>
                  <td style={{
                    padding: isMobile ? '10px 8px' : '12px',
                    color: '#2c3e50',
                    borderRight: '1px solid #ecf0f1'
                  }}>
                    {asset.largeClass}
                  </td>
                  <td style={{
                    padding: isMobile ? '10px 8px' : '12px',
                    color: '#2c3e50',
                    borderRight: '1px solid #ecf0f1'
                  }}>
                    {asset.mediumClass}
                  </td>
                  <td style={{
                    padding: isMobile ? '10px 8px' : '12px',
                    color: '#2c3e50',
                    borderRight: '1px solid #ecf0f1'
                  }}>
                    {asset.item}
                  </td>
                  <td style={{
                    padding: isMobile ? '10px 8px' : '12px',
                    color: '#2c3e50',
                    borderRight: '1px solid #ecf0f1'
                  }}>
                    {asset.maker}
                  </td>
                  <td style={{
                    padding: isMobile ? '10px 8px' : '12px',
                    color: '#2c3e50'
                  }}>
                    {asset.model}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAssets.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#7f8c8d',
            fontSize: isMobile ? '14px' : '16px'
          }}>
            該当する資産がありません
          </div>
        )}
      </div>
    </div>
  );
}
