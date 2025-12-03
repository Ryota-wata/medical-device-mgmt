'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useMasterStore } from '@/lib/stores/masterStore';
import { FacilityMaster } from '@/lib/types/master';
import { FacilityFormModal } from '@/components/modals/FacilityFormModal';

export default function ShipFacilityMasterPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const { facilities, setFacilities, addFacility, updateFacility, deleteFacility } = useMasterStore();

  const [filterFacilityCode, setFilterFacilityCode] = useState('');
  const [filterFacilityName, setFilterFacilityName] = useState('');
  const [filterPrefecture, setFilterPrefecture] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityMaster | null>(null);

  // サンプルデータを初期化
  useEffect(() => {
    if (facilities.length === 0) {
      const sampleFacilities: FacilityMaster[] = [
        {
          id: 'F001',
          facilityCode: 'F001',
          facilityName: '〇〇〇〇〇〇病院',
          prefecture: '東京都',
          city: '千代田区',
          address: '千代田1-1-1',
          postalCode: '100-0001',
          phoneNumber: '03-1234-5678',
          establishedDate: '1980-04-01',
          facilityType: '総合病院',
          bedCount: 500,
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'F002',
          facilityCode: 'F002',
          facilityName: '△△△△△△クリニック',
          prefecture: '神奈川県',
          city: '横浜市',
          address: '西区みなとみらい2-2-2',
          postalCode: '220-0012',
          phoneNumber: '045-1234-5678',
          establishedDate: '1995-06-15',
          facilityType: 'クリニック',
          bedCount: 0,
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'F003',
          facilityCode: 'F003',
          facilityName: '□□□□□□医療センター',
          prefecture: '大阪府',
          city: '大阪市',
          address: '北区梅田3-3-3',
          postalCode: '530-0001',
          phoneNumber: '06-1234-5678',
          establishedDate: '2005-10-01',
          facilityType: '医療センター',
          bedCount: 300,
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];
      setFacilities(sampleFacilities);
    }
  }, [facilities.length, setFacilities]);

  // フィルタリング処理
  const filteredFacilities = facilities.filter((facility) => {
    const matchFacilityCode = !filterFacilityCode || facility.facilityCode.includes(filterFacilityCode);
    const matchFacilityName = !filterFacilityName || facility.facilityName.toLowerCase().includes(filterFacilityName.toLowerCase());
    const matchPrefecture = !filterPrefecture || facility.prefecture.includes(filterPrefecture);
    const matchCity = !filterCity || facility.city.includes(filterCity);
    return matchFacilityCode && matchFacilityName && matchPrefecture && matchCity;
  });

  const handleBack = () => {
    router.back();
  };

  const handleEdit = (facility: FacilityMaster) => {
    setSelectedFacility(facility);
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('この施設マスタを削除してもよろしいですか?')) {
      deleteFacility(id);
    }
  };

  const handleNewSubmit = (data: Partial<FacilityMaster>) => {
    const newFacility: FacilityMaster = {
      id: `F${String(facilities.length + 1).padStart(3, '0')}`,
      facilityCode: data.facilityCode || '',
      facilityName: data.facilityName || '',
      building: data.building,
      floor: data.floor,
      department: data.department,
      section: data.section,
      prefecture: '',
      city: '',
      address: '',
      postalCode: '',
      phoneNumber: '',
      establishedDate: new Date().toISOString().split('T')[0],
      facilityType: '',
      bedCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addFacility(newFacility);
  };

  const handleEditSubmit = (data: Partial<FacilityMaster>) => {
    if (selectedFacility) {
      updateFacility(selectedFacility.id, data);
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
              SHIP施設マスタ
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
            {filteredFacilities.length}件
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
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: isMobile ? '12px' : '16px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>
            施設コード
          </label>
          <input
            type="text"
            value={filterFacilityCode}
            onChange={(e) => setFilterFacilityCode(e.target.value)}
            placeholder="F001"
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
            施設名
          </label>
          <input
            type="text"
            value={filterFacilityName}
            onChange={(e) => setFilterFacilityName(e.target.value)}
            placeholder="施設名で検索"
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
            都道府県
          </label>
          <input
            type="text"
            value={filterPrefecture}
            onChange={(e) => setFilterPrefecture(e.target.value)}
            placeholder="東京都"
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
            市区町村
          </label>
          <input
            type="text"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            placeholder="千代田区"
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
            {filteredFacilities.map((facility) => (
              <div key={facility.id} style={{
                background: 'white',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#2c3e50', marginBottom: '4px' }}>
                    {facility.facilityName}
                  </div>
                  <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                    {facility.facilityCode}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div><span style={{ color: '#7f8c8d' }}>種別:</span> {facility.facilityType}</div>
                  <div><span style={{ color: '#7f8c8d' }}>所在地:</span> {facility.prefecture}{facility.city}</div>
                  <div><span style={{ color: '#7f8c8d' }}>病床数:</span> {facility.bedCount}床</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleEdit(facility)}
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
                    onClick={() => handleDelete(facility.id)}
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
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap' }}>施設コード</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>施設名</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap' }}>種別</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>都道府県</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>市区町村</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'right', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap' }}>病床数</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'center', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacilities.map((facility, index) => (
                    <tr key={facility.id} style={{ borderBottom: '1px solid #f0f0f0', background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50', whiteSpace: 'nowrap' }}>{facility.facilityCode}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50' }}>{facility.facilityName}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50', whiteSpace: 'nowrap' }}>{facility.facilityType}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50' }}>{facility.prefecture}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50' }}>{facility.city}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50', textAlign: 'right', whiteSpace: 'nowrap' }}>{facility.bedCount}床</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEdit(facility)}
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
                            onClick={() => handleDelete(facility.id)}
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

        {filteredFacilities.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: isMobile ? '40px 20px' : '60px 40px',
            textAlign: 'center',
            color: '#7f8c8d',
            fontSize: isMobile ? '14px' : '16px'
          }}>
            検索条件に一致する施設マスタがありません
          </div>
        )}
      </main>

      {/* 新規作成モーダル */}
      <FacilityFormModal
        isOpen={showNewModal}
        mode="create"
        onClose={() => {
          setShowNewModal(false);
          setSelectedFacility(null);
        }}
        onSubmit={handleNewSubmit}
        isMobile={isMobile}
      />

      {/* 編集モーダル */}
      <FacilityFormModal
        isOpen={showEditModal}
        mode="edit"
        facility={selectedFacility || undefined}
        onClose={() => {
          setShowEditModal(false);
          setSelectedFacility(null);
        }}
        onSubmit={handleEditSubmit}
        isMobile={isMobile}
      />
    </div>
  );
}
