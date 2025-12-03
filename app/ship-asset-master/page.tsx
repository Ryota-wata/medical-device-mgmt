'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useMasterStore } from '@/lib/stores/masterStore';
import { AssetMaster } from '@/lib/types/master';
import { AssetFormModal } from '@/components/modals/AssetFormModal';

export default function ShipAssetMasterPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const { assets, setAssets, addAsset, updateAsset, deleteAsset } = useMasterStore();

  const [filterCategory, setFilterCategory] = useState('');
  const [filterLargeClass, setFilterLargeClass] = useState('');
  const [filterMediumClass, setFilterMediumClass] = useState('');
  const [filterItem, setFilterItem] = useState('');
  const [filterMaker, setFilterMaker] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetMaster | null>(null);

  // サンプルデータを初期化
  useEffect(() => {
    if (assets.length === 0) {
      const sampleAssets: AssetMaster[] = [
        {
          id: 'A001',
          category: '医療機器',
          largeClass: '手術関連機器',
          mediumClass: '電気メス',
          item: '電気手術用電源装置',
          maker: 'オリンパス',
          model: 'ESG-400',
          specification: '双極対応, 出力400W',
          unitPrice: 2500000,
          depreciationYears: 8,
          maintenanceCycle: 12,
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'A002',
          category: '医療機器',
          largeClass: '画像診断機器',
          mediumClass: '超音波診断装置',
          item: '超音波診断装置',
          maker: 'GE Healthcare',
          model: 'LOGIQ E10',
          specification: '4D対応, カラードプラ',
          unitPrice: 15000000,
          depreciationYears: 6,
          maintenanceCycle: 6,
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'A003',
          category: '医療機器',
          largeClass: '生体情報モニタ',
          mediumClass: 'ベッドサイドモニタ',
          item: 'ベッドサイドモニタ',
          maker: '日本光電',
          model: 'BSM-6000',
          specification: '心電図, SpO2, 血圧対応',
          unitPrice: 800000,
          depreciationYears: 6,
          maintenanceCycle: 12,
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'A004',
          category: '事務機器',
          largeClass: 'PC・タブレット',
          mediumClass: 'ノートPC',
          item: 'ノートパソコン',
          maker: 'Dell',
          model: 'Latitude 7420',
          specification: 'Core i7, メモリ16GB, SSD512GB',
          unitPrice: 180000,
          depreciationYears: 4,
          maintenanceCycle: 24,
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'A005',
          category: '什器・備品',
          largeClass: '家具',
          mediumClass: 'デスク',
          item: '事務用デスク',
          maker: 'オカムラ',
          model: 'Swift-W1600',
          specification: 'W1600×D700×H720',
          unitPrice: 85000,
          depreciationYears: 5,
          maintenanceCycle: 0,
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];
      setAssets(sampleAssets);
    }
  }, [assets.length, setAssets]);

  // フィルタリング処理
  const filteredAssets = assets.filter((asset) => {
    const matchCategory = !filterCategory || asset.category.toLowerCase().includes(filterCategory.toLowerCase());
    const matchLargeClass = !filterLargeClass || asset.largeClass.toLowerCase().includes(filterLargeClass.toLowerCase());
    const matchMediumClass = !filterMediumClass || asset.mediumClass.toLowerCase().includes(filterMediumClass.toLowerCase());
    const matchItem = !filterItem || asset.item.toLowerCase().includes(filterItem.toLowerCase());
    const matchMaker = !filterMaker || asset.maker.toLowerCase().includes(filterMaker.toLowerCase());
    return matchCategory && matchLargeClass && matchMediumClass && matchItem && matchMaker;
  });

  const handleBack = () => {
    router.back();
  };

  const handleEdit = (asset: AssetMaster) => {
    setSelectedAsset(asset);
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('この資産マスタを削除してもよろしいですか?')) {
      deleteAsset(id);
    }
  };

  const handleNewSubmit = (data: Partial<AssetMaster>) => {
    const newAsset: AssetMaster = {
      id: `A${String(assets.length + 1).padStart(3, '0')}`,
      category: data.category || '',
      largeClass: data.largeClass || '',
      mediumClass: data.mediumClass || '',
      item: data.item || '',
      maker: data.maker || '',
      model: data.model || '',
      specification: '',
      unitPrice: 0,
      depreciationYears: 0,
      maintenanceCycle: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addAsset(newAsset);
  };

  const handleEditSubmit = (data: Partial<AssetMaster>) => {
    if (selectedAsset) {
      updateAsset(selectedAsset.id, data);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        color: 'white',
        padding: isMobile ? '12px 16px' : isTablet ? '14px 20px' : '16px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: isMobile ? '12px' : '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #27ae60, #229954)',
              padding: isMobile ? '6px 10px' : '8px 12px',
              borderRadius: '6px',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: 700,
              letterSpacing: '1px'
            }}>
              SHIP
            </div>
            <h1 style={{ fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px', fontWeight: 600, margin: 0 }}>
              SHIP資産マスタ
            </h1>
          </div>
          <div style={{
            background: '#34495e',
            color: '#ffffff',
            padding: isMobile ? '4px 12px' : '6px 16px',
            borderRadius: '20px',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: 600
          }}>
            {filteredAssets.length}件
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowNewModal(true)}
            style={{
              padding: isMobile ? '8px 16px' : '10px 20px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            新規作成
          </button>
          <button
            onClick={handleBack}
            style={{
              padding: isMobile ? '8px 16px' : '10px 20px',
              background: '#7f8c8d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            戻る
          </button>
        </div>
      </header>

      {/* Filter Header */}
      <div style={{
        background: 'white',
        padding: isMobile ? '12px 16px' : isTablet ? '16px 20px' : '20px 24px',
        borderBottom: '2px solid #e0e0e0',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: isMobile ? '12px' : '16px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>
            Category
          </label>
          <input
            type="text"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            placeholder="医療機器"
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>
            大分類
          </label>
          <input
            type="text"
            value={filterLargeClass}
            onChange={(e) => setFilterLargeClass(e.target.value)}
            placeholder="大分類で検索"
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>
            中分類
          </label>
          <input
            type="text"
            value={filterMediumClass}
            onChange={(e) => setFilterMediumClass(e.target.value)}
            placeholder="中分類で検索"
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>
            品目
          </label>
          <input
            type="text"
            value={filterItem}
            onChange={(e) => setFilterItem(e.target.value)}
            placeholder="品目で検索"
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>
            メーカー
          </label>
          <input
            type="text"
            value={filterMaker}
            onChange={(e) => setFilterMaker(e.target.value)}
            placeholder="メーカーで検索"
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, padding: isMobile ? '16px' : isTablet ? '20px' : '24px', overflowY: 'auto' }}>
        {isMobile ? (
          // カード表示 (モバイル)
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredAssets.map((asset) => (
              <div key={asset.id} style={{
                background: 'white',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#2c3e50', marginBottom: '4px' }}>
                    {asset.item}
                  </div>
                  <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                    {asset.category} / {asset.largeClass}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div><span style={{ color: '#7f8c8d' }}>中分類:</span> {asset.mediumClass}</div>
                  <div><span style={{ color: '#7f8c8d' }}>メーカー:</span> {asset.maker}</div>
                  <div><span style={{ color: '#7f8c8d' }}>型式:</span> {asset.model}</div>
                  <div><span style={{ color: '#7f8c8d' }}>単価:</span> ¥{asset.unitPrice.toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleEdit(asset)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // テーブル表示 (PC/タブレット)
          <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <tr>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap' }}>Category</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap' }}>大分類</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap' }}>中分類</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>品目</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>メーカー</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>型式</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'right', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap' }}>単価</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'center', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset, index) => (
                    <tr key={asset.id} style={{ borderBottom: '1px solid #f0f0f0', background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50', whiteSpace: 'nowrap' }}>{asset.category}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50', whiteSpace: 'nowrap' }}>{asset.largeClass}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50', whiteSpace: 'nowrap' }}>{asset.mediumClass}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50' }}>{asset.item}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50' }}>{asset.maker}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50' }}>{asset.model}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50', textAlign: 'right', whiteSpace: 'nowrap' }}>¥{asset.unitPrice.toLocaleString()}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEdit(asset)}
                            style={{
                              padding: '6px 12px',
                              background: '#3498db',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: isTablet ? '12px' : '13px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: isTablet ? '12px' : '13px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredAssets.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: isMobile ? '40px 20px' : '60px 40px',
            textAlign: 'center',
            color: '#7f8c8d',
            fontSize: isMobile ? '14px' : '16px'
          }}>
            検索条件に一致する資産マスタがありません
          </div>
        )}
      </main>

      {/* 新規作成モーダル */}
      <AssetFormModal
        isOpen={showNewModal}
        mode="create"
        onClose={() => {
          setShowNewModal(false);
          setSelectedAsset(null);
        }}
        onSubmit={handleNewSubmit}
        isMobile={isMobile}
      />

      {/* 編集モーダル */}
      <AssetFormModal
        isOpen={showEditModal}
        mode="edit"
        asset={selectedAsset || undefined}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAsset(null);
        }}
        onSubmit={handleEditSubmit}
        isMobile={isMobile}
      />
    </div>
  );
}
