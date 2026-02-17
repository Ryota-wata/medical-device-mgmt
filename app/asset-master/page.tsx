'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AssetMaster } from '@/lib/types/master';
import { useMasterStore } from '@/lib/stores';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

function AssetMasterContent() {
  const searchParams = useSearchParams();
  const isSimpleMode = searchParams.get('mode') === 'simple';
  const { assets: assetMasters } = useMasterStore();
  const { isMobile } = useResponsive();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // フィルター状態
  const [filters, setFilters] = useState({
    globalSearch: '',
    category: '',
    largeClass: '',
    mediumClass: '',
    item: '',
    maker: '',
    model: ''
  });

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

  const itemOptions = useMemo(() => {
    const uniqueItems = Array.from(new Set(assetMasters.map(a => a.item)));
    return uniqueItems.filter(Boolean);
  }, [assetMasters]);

  const makerOptions = useMemo(() => {
    const uniqueMakers = Array.from(new Set(assetMasters.map(a => a.maker)));
    return uniqueMakers.filter(Boolean);
  }, [assetMasters]);

  const modelOptions = useMemo(() => {
    const uniqueModels = Array.from(new Set(assetMasters.map(a => a.model)));
    return uniqueModels.filter(Boolean);
  }, [assetMasters]);

  // フィルタリングされた資産
  const filteredAssets = useMemo(() => {
    let filtered = assetMasters;

    // 全体検索（曖昧検索）
    if (filters.globalSearch) {
      const searchTerm = filters.globalSearch.toLowerCase();
      filtered = filtered.filter(a =>
        (a.category?.toLowerCase() || '').includes(searchTerm) ||
        (a.largeClass?.toLowerCase() || '').includes(searchTerm) ||
        (a.mediumClass?.toLowerCase() || '').includes(searchTerm) ||
        (a.item?.toLowerCase() || '').includes(searchTerm) ||
        (a.maker?.toLowerCase() || '').includes(searchTerm) ||
        (a.model?.toLowerCase() || '').includes(searchTerm) ||
        (a.id?.toLowerCase() || '').includes(searchTerm)
      );
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
    if (filters.item) {
      filtered = filtered.filter(a => a.item === filters.item);
    }
    if (filters.maker) {
      filtered = filtered.filter(a => a.maker === filters.maker);
    }
    if (filters.model) {
      filtered = filtered.filter(a => a.model === filters.model);
    }

    return filtered;
  }, [assetMasters, filters]);

  // 選択した資産を取得
  const selectedAsset = useMemo(() => {
    return assetMasters.find(asset => asset.id === selectedAssetId) || null;
  }, [assetMasters, selectedAssetId]);

  // 選択した資産を親ウィンドウに渡す（スコープ別）
  type ConfirmScope = 'all' | 'toMaker' | 'toItem';

  const handleConfirmSelection = (scope: ConfirmScope) => {
    if (!selectedAsset) {
      alert('資産を選択してください');
      return;
    }

    // スコープに応じて送信するデータを選択
    let assetData: Partial<AssetMaster>;

    switch (scope) {
      case 'toItem':
        // 品目まで確定: Category, 大分類, 中分類, 個体管理品目
        assetData = {
          id: selectedAsset.id,
          category: selectedAsset.category,
          largeClass: selectedAsset.largeClass,
          mediumClass: selectedAsset.mediumClass,
          item: selectedAsset.item
        };
        break;
      case 'toMaker':
        // メーカーまで確定: Category, 大分類, 中分類, 個体管理品目, メーカー
        assetData = {
          id: selectedAsset.id,
          category: selectedAsset.category,
          largeClass: selectedAsset.largeClass,
          mediumClass: selectedAsset.mediumClass,
          item: selectedAsset.item,
          maker: selectedAsset.maker
        };
        break;
      case 'all':
      default:
        // 全て確定: 全カラム
        assetData = {
          id: selectedAsset.id,
          category: selectedAsset.category,
          largeClass: selectedAsset.largeClass,
          mediumClass: selectedAsset.mediumClass,
          item: selectedAsset.item,
          maker: selectedAsset.maker,
          model: selectedAsset.model
        };
        break;
    }

    // 親ウィンドウに選択した資産を渡す
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'ASSET_SELECTED',
        assets: [assetData],
        scope: scope
      }, window.location.origin);
      window.close();
    } else {
      alert('親ウィンドウが見つかりません');
    }
  };

  // シンプルモード用: 選択した資産をそのまま送信
  const handleSimpleSelection = () => {
    if (!selectedAsset) {
      alert('資産を選択してください');
      return;
    }

    const assetData = {
      id: selectedAsset.id,
      category: selectedAsset.category,
      largeClass: selectedAsset.largeClass,
      mediumClass: selectedAsset.mediumClass,
      item: selectedAsset.item,
      maker: selectedAsset.maker,
      model: selectedAsset.model
    };

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'ASSET_SELECTED',
        assets: [assetData]
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
        {/* 全体検索 */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#2c3e50',
            marginBottom: '4px'
          }}>
            全体検索
          </label>
          <input
            type="text"
            value={filters.globalSearch || ''}
            onChange={(e) => setFilters({...filters, globalSearch: e.target.value})}
            placeholder="キーワードを入力（全カラムから曖昧検索）"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        {/* 個別フィルター */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="大分類"
              value={filters.largeClass}
              onChange={(value) => setFilters({...filters, largeClass: value})}
              options={largeClassOptions}
              placeholder="全て"
              isMobile={isMobile}
            />
          </div>
          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="中分類"
              value={filters.mediumClass}
              onChange={(value) => setFilters({...filters, mediumClass: value})}
              options={mediumClassOptions}
              placeholder="全て"
              isMobile={isMobile}
            />
          </div>
          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="個体管理品目"
              value={filters.item}
              onChange={(value) => setFilters({...filters, item: value})}
              options={itemOptions}
              placeholder="全て"
              isMobile={isMobile}
            />
          </div>
          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="メーカー"
              value={filters.maker}
              onChange={(value) => setFilters({...filters, maker: value})}
              options={makerOptions}
              placeholder="全て"
              isMobile={isMobile}
            />
          </div>
          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="型式"
              value={filters.model}
              onChange={(value) => setFilters({...filters, model: value})}
              options={modelOptions}
              placeholder="全て"
              isMobile={isMobile}
            />
          </div>
          <button
            onClick={() => setFilters({
              globalSearch: '',
              category: '',
              largeClass: '',
              mediumClass: '',
              item: '',
              maker: '',
              model: ''
            })}
            style={{
              padding: '8px 16px',
              background: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            クリア
          </button>
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isSimpleMode ? (
            // シンプルモード: 選択ボタンのみ
            <>
              <button
                onClick={handleSimpleSelection}
                disabled={!selectedAssetId}
                style={{
                  padding: isMobile ? '8px 12px' : '10px 20px',
                  background: !selectedAssetId ? '#bdc3c7' : '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: 'bold',
                  cursor: !selectedAssetId ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedAssetId) {
                    e.currentTarget.style.background = '#229954';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedAssetId) {
                    e.currentTarget.style.background = '#27ae60';
                  }
                }}
              >
                選択
              </button>
              <button
                onClick={() => window.close()}
                style={{
                  padding: isMobile ? '8px 12px' : '10px 20px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: isMobile ? '12px' : '14px',
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
            </>
          ) : (
            // 通常モード: 全て確定、メーカーまで確定、品目まで確定
            <>
              <button
                onClick={() => handleConfirmSelection('all')}
                disabled={!selectedAssetId}
                style={{
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  background: !selectedAssetId ? '#bdc3c7' : '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: 'bold',
                  cursor: !selectedAssetId ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedAssetId) {
                    e.currentTarget.style.background = '#229954';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedAssetId) {
                    e.currentTarget.style.background = '#27ae60';
                  }
                }}
              >
                全て確定
              </button>
              <button
                onClick={() => handleConfirmSelection('toMaker')}
                disabled={!selectedAssetId}
                style={{
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  background: !selectedAssetId ? '#bdc3c7' : '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: 'bold',
                  cursor: !selectedAssetId ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedAssetId) {
                    e.currentTarget.style.background = '#2980b9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedAssetId) {
                    e.currentTarget.style.background = '#3498db';
                  }
                }}
              >
                メーカーまで確定
              </button>
              <button
                onClick={() => handleConfirmSelection('toItem')}
                disabled={!selectedAssetId}
                style={{
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  background: !selectedAssetId ? '#bdc3c7' : '#9b59b6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: 'bold',
                  cursor: !selectedAssetId ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedAssetId) {
                    e.currentTarget.style.background = '#8e44ad';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedAssetId) {
                    e.currentTarget.style.background = '#9b59b6';
                  }
                }}
              >
                品目まで確定
              </button>
              <button
                onClick={() => window.close()}
                style={{
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: isMobile ? '12px' : '14px',
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
            </>
          )}
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
                  選択
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
                  個体管理品目
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
                  key={asset.id}
                  style={{
                    background: selectedAssetId === asset.id
                      ? '#d5f4e6'
                      : index % 2 === 0 ? 'white' : '#f8f9fa',
                    borderBottom: '1px solid #ecf0f1',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedAssetId(asset.id)}
                  onMouseEnter={(e) => {
                    if (selectedAssetId !== asset.id) {
                      e.currentTarget.style.background = '#e8f4f8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedAssetId !== asset.id) {
                      e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#f8f9fa';
                    }
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
                      type="radio"
                      name="assetSelection"
                      checked={selectedAssetId === asset.id}
                      onChange={() => setSelectedAssetId(asset.id)}
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

export default function AssetMasterPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <AssetMasterContent />
    </Suspense>
  );
}
