'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useMasterStore } from '@/lib/stores/masterStore';
import { FacilityMaster } from '@/lib/types/master';
import { FacilityFormModal } from '@/components/modals/FacilityFormModal';
import { exportFacilitiesToExcel } from '@/lib/utils/excel-facility-master';

// Excelフルカラム定義（44列）
const FACILITY_COLUMNS: { key: string; label: string }[] = [
  // 基本情報
  { key: 'facilityCode', label: '医療機関コード' },
  { key: 'facilityName', label: '施設名' },
  { key: 'foundingBody', label: '経営主体' },
  { key: 'prefecture', label: '都道府県' },
  { key: 'city', label: '市区町村' },
  { key: 'secondaryMedicalArea', label: '二次医療圏名' },
  { key: 'rebuildYear', label: '建替年度' },
  { key: 'buildingArea', label: '建物面積' },
  // 認定情報
  { key: 'emergencyCenter', label: '救命救急センター' },
  { key: 'secondaryEmergency', label: '2次/3次救急' },
  { key: 'perinatalCenter', label: '周産期母子医療' },
  { key: 'disasterHospital', label: '災害拠点病院' },
  { key: 'cancerHospital', label: 'がん診療拠点' },
  { key: 'regionalSupport', label: '地域医療支援' },
  // 諸室情報
  { key: 'erRooms', label: '救急初療室数' },
  { key: 'centralTreatmentBeds', label: '中央処置ベッド数' },
  { key: 'chemotherapyBeds', label: '化学療法ベッド数' },
  { key: 'deliveryRooms', label: '分娩室数' },
  { key: 'endoscopyRooms', label: '内視鏡室数' },
  { key: 'dialysisBeds', label: '人工透析ベッド数' },
  { key: 'operatingRooms', label: '手術室数' },
  { key: 'bloodCollectionUnits', label: '中央採血台数' },
  // 病床情報
  { key: 'totalBeds', label: '総病床数' },
  { key: 'emergencyWard', label: '救急病棟' },
  { key: 'eICU', label: 'E-ICU' },
  { key: 'icu', label: 'ICU' },
  { key: 'hcu', label: 'HCU' },
  { key: 'gICU', label: 'G-ICU' },
  { key: 'ccu', label: 'CCU' },
  { key: 'scu', label: 'SCU' },
  { key: 'nicu', label: 'NICU' },
  { key: 'gcu', label: 'GCU' },
  { key: 'mficu', label: 'MFICU' },
  { key: 'generalBeds', label: '一般病床' },
  { key: 'cleanRoomBeds', label: '無菌病棟' },
  { key: 'palliativeBeds', label: '緩和ケア' },
  { key: 'rehabilitationBeds', label: '回復期リハ' },
  { key: 'communityCareBeds', label: '地域包括ケア' },
  { key: 'chronicBeds', label: '療養病床' },
  { key: 'psychiatricBeds', label: '精神病床' },
  { key: 'infectiousBeds', label: '感染症・結核' },
];

export default function ShipFacilityMasterPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const { facilities, setFacilities, addFacility, updateFacility, deleteFacility } = useMasterStore();

  const [filterFacilityCode, setFilterFacilityCode] = useState('');
  const [filterFacilityName, setFilterFacilityName] = useState('');
  const [filterPrefecture, setFilterPrefecture] = useState('');
  const [filterFoundingBody, setFilterFoundingBody] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityMaster | null>(null);

  // 顧客施設マスタを遅延ロード
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (facilities.length < 1000) {
      setIsLoading(true);
      import('@/lib/data/customer/facility-master').then(({ customerFacilities }) => {
        const mapped = customerFacilities.map((item, i) => ({
          ...item,
          id: `FAC-${i}`,
          address: '',
          postalCode: '',
          phoneNumber: '',
          establishedDate: '',
          facilityType: '',
          bedCount: parseInt(item.totalBeds || '0', 10) || 0,
          status: 'active' as const,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        })) as FacilityMaster[];
        setFacilities(mapped);
        setIsLoading(false);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  // フィルタリング処理
  const filteredFacilities = facilities.filter((facility) => {
    const matchFacilityCode = !filterFacilityCode || facility.facilityCode.includes(filterFacilityCode);
    const matchFacilityName = !filterFacilityName || facility.facilityName.toLowerCase().includes(filterFacilityName.toLowerCase());
    const matchPrefecture = !filterPrefecture || facility.prefecture.includes(filterPrefecture);
    const matchFoundingBody = !filterFoundingBody || (facility.foundingBody && facility.foundingBody.includes(filterFoundingBody));
    return matchFacilityCode && matchFacilityName && matchPrefecture && matchFoundingBody;
  });

  const handleBack = () => {
    router.push('/main');
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
      foundingBody: '',
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: isMobile ? '12px 16px' : isTablet ? '14px 20px' : '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: isMobile ? '12px' : '16px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', flex: 1 }}>
          <h1 style={{ fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
            SHIP施設マスタ
          </h1>
          <div style={{
            background: '#f3f4f6',
            color: '#6b7280',
            padding: isMobile ? '4px 12px' : '6px 16px',
            borderRadius: '20px',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: 600
          }}>
            {filteredFacilities.length}件
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => exportFacilitiesToExcel(filteredFacilities)}
            style={{
              padding: isMobile ? '8px 16px' : '10px 20px',
              background: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            エクスポート
          </button>
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
              background: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            メイン画面に戻る
          </button>
        </div>
      </header>

      {/* Filter Header */}
      <div style={{
        background: 'white',
        padding: isMobile ? '12px 16px' : isTablet ? '16px 20px' : '20px 24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: isMobile ? '12px' : '16px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#1f2937' }}>
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
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#1f2937' }}>
            設立母体
          </label>
          <input
            type="text"
            value={filterFoundingBody}
            onChange={(e) => setFilterFoundingBody(e.target.value)}
            placeholder="国立、公立、医療法人"
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#1f2937' }}>
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
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#1f2937' }}>
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
              border: '1px solid #d1d5db',
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
                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                    {facility.facilityName}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    {facility.facilityCode}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div><span style={{ color: '#6b7280' }}>都道府県:</span> {facility.prefecture}</div>
                  <div><span style={{ color: '#6b7280' }}>設立母体:</span> {facility.foundingBody}</div>
                  <div><span style={{ color: '#6b7280' }}>病床数:</span> {facility.bedCount}床</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleEdit(facility)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#374151',
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
          <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr>
                    {([
                      { label: '基本情報', span: 8, color: '#495057' },
                      { label: '認定情報', span: 6, color: '#0d6efd' },
                      { label: '諸室情報', span: 8, color: '#198754' },
                      { label: '病床情報', span: 19, color: '#6f42c1' },
                      { label: '', span: 1, color: '#374151' },
                    ] as const).map((g, i) => (
                      <th key={i} colSpan={g.span} style={{ padding: '4px 6px', textAlign: 'center', fontSize: '10px', fontWeight: 700, color: 'white', background: g.color, borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>{g.label}</th>
                    ))}
                  </tr>
                  <tr>
                    {FACILITY_COLUMNS.map(col => (
                      <th key={col.key} style={{ padding: '4px 6px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'white', background: '#374151', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap' }}>{col.label}</th>
                    ))}
                    <th style={{ padding: '4px 6px', textAlign: 'center', fontSize: '10px', fontWeight: 600, color: 'white', background: '#374151', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacilities.map((facility, index) => (
                    <tr key={facility.id} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                      {FACILITY_COLUMNS.map(col => (
                        <td key={col.key} style={{ padding: '4px 6px', fontSize: '11px', color: '#1f2937', whiteSpace: 'nowrap' }}>
                          {String((facility as unknown as Record<string, unknown>)[col.key] || '')}
                        </td>
                      ))}
                      <td style={{ padding: '4px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button onClick={() => handleEdit(facility)} style={{ padding: '3px 8px', background: '#374151', color: 'white', border: 'none', borderRadius: '3px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>編集</button>
                          <button onClick={() => handleDelete(facility.id)} style={{ padding: '3px 8px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>削除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        )}

        {filteredFacilities.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: isMobile ? '40px 20px' : '60px 40px',
            textAlign: 'center',
            color: '#6b7280',
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

      <footer style={{ padding: '12px 0', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
        &copy;Copyright 2024 SHIP HEALTHCARE HOLDINGS, INC.
      </footer>
    </div>
  );
}
