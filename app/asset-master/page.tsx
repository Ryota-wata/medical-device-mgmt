'use client';

import React, { useState, useMemo } from 'react';
import { Asset } from '@/lib/types';
import { useMasterStore } from '@/lib/stores';
import { useResponsive } from '@/lib/hooks/useResponsive';

export default function AssetMasterPage() {
  const { assets: assetMasters } = useMasterStore();
  const { isMobile } = useResponsive();
  const [selectedAssets, setSelectedAssets] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // 検索フィルタリング
  const filteredAssets = useMemo(() => {
    if (!searchQuery) return assetMasters;

    const query = searchQuery.toLowerCase();
    return assetMasters.filter(asset =>
      asset.name.toLowerCase().includes(query) ||
      asset.maker.toLowerCase().includes(query) ||
      asset.model.toLowerCase().includes(query) ||
      asset.qrCode.toLowerCase().includes(query)
    );
  }, [assetMasters, searchQuery]);

  // チェックボックスの全選択/全解除
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAssets(new Set(filteredAssets.map(asset => asset.no)));
    } else {
      setSelectedAssets(new Set());
    }
  };

  // 個別チェックボックスの処理
  const handleCheckboxChange = (assetNo: number) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetNo)) {
      newSelected.delete(assetNo);
    } else {
      newSelected.add(assetNo);
    }
    setSelectedAssets(newSelected);
  };

  // 選択した資産を親ウィンドウに渡す
  const handleConfirmSelection = () => {
    const selected = assetMasters.filter(asset => selectedAssets.has(asset.no));

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
      padding: isMobile ? '12px' : '20px'
    }}>
      {/* ヘッダー */}
      <div style={{
        background: 'white',
        padding: isMobile ? '16px' : '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: isMobile ? '18px' : '24px',
          fontWeight: 'bold',
          color: '#2c3e50',
          marginBottom: '16px'
        }}>
          資産マスタ選択
        </h1>

        {/* 検索バー */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="資産名、メーカー、型式、QRコードで検索..."
            style={{
              width: '100%',
              padding: isMobile ? '10px' : '12px',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: isMobile ? '14px' : '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* 選択数表示 */}
        <div style={{
          fontSize: isMobile ? '13px' : '14px',
          color: '#7f8c8d',
          marginBottom: '12px'
        }}>
          {selectedAssets.size}件選択中 / 全{filteredAssets.length}件
        </div>

        {/* アクションボタン */}
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
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          overflowX: 'auto',
          maxHeight: 'calc(100vh - 300px)'
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
                  borderRight: '1px solid rgba(255,255,255,0.1)'
                }}>
                  QRコード
                </th>
                <th style={{
                  padding: isMobile ? '10px 8px' : '12px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  borderRight: '1px solid rgba(255,255,255,0.1)'
                }}>
                  個体管理名称
                </th>
                <th style={{
                  padding: isMobile ? '10px 8px' : '12px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  borderRight: '1px solid rgba(255,255,255,0.1)'
                }}>
                  メーカー名
                </th>
                <th style={{
                  padding: isMobile ? '10px 8px' : '12px',
                  textAlign: 'left',
                  fontWeight: 'bold'
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
                    borderBottom: '1px solid #ecf0f1',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleCheckboxChange(asset.no)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e8f4f8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#f8f9fa';
                  }}
                >
                  <td style={{
                    padding: isMobile ? '10px 8px' : '12px',
                    textAlign: 'center',
                    borderRight: '1px solid #ecf0f1'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedAssets.has(asset.no)}
                      onChange={() => handleCheckboxChange(asset.no)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </td>
                  <td style={{
                    padding: isMobile ? '10px 8px' : '12px',
                    color: '#2c3e50',
                    borderRight: '1px solid #ecf0f1'
                  }}>
                    {asset.qrCode}
                  </td>
                  <td style={{
                    padding: isMobile ? '10px 8px' : '12px',
                    color: '#2c3e50',
                    borderRight: '1px solid #ecf0f1'
                  }}>
                    {asset.name}
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
            {searchQuery ? '検索結果がありません' : '資産がありません'}
          </div>
        )}
      </div>
    </div>
  );
}
