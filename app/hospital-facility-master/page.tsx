'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useHospitalFacilityStore } from '@/lib/stores/hospitalFacilityStore';
import { useMasterStore } from '@/lib/stores/masterStore';
import { HospitalFacilityMaster, HospitalFacilityStatus } from '@/lib/types/hospitalFacility';
import { HospitalFacilityFormModal } from './components/HospitalFacilityFormModal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

function HospitalFacilityMasterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile, isTablet } = useResponsive();
  const { facilities: masterFacilities } = useMasterStore();
  const {
    facilities,
    setFacilities,
    addFacility,
    updateFacility,
    deleteFacility,
    generateFacilityId,
  } = useHospitalFacilityStore();

  // URLパラメータから施設名を取得
  const facilityParam = searchParams.get('facility');
  const [selectedFacilityName, setSelectedFacilityName] = useState<string>(facilityParam || '');

  // 施設マスタから施設名オプションを生成
  const facilityOptions = masterFacilities.map(f => f.facilityName);

  // フィルター状態
  const [filterCurrentFloor, setFilterCurrentFloor] = useState('');
  const [filterCurrentDepartment, setFilterCurrentDepartment] = useState('');
  const [filterNewFloor, setFilterNewFloor] = useState('');
  const [filterNewDepartment, setFilterNewDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState<HospitalFacilityStatus | ''>('');

  // モーダル状態
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<HospitalFacilityMaster | null>(null);

  // サンプルデータ初期化
  useEffect(() => {
    if (facilities.length === 0 && masterFacilities.length > 0) {
      // SHIP施設マスタの施設名を使用してサンプルデータを作成
      const firstFacility = masterFacilities[0]?.facilityName || '東京中央病院';
      const secondFacility = masterFacilities[1]?.facilityName || '大阪総合医療センター';

      const sampleFacilities: HospitalFacilityMaster[] = [
        {
          id: 'HF00001',
          hospitalId: firstFacility,
          hospitalName: firstFacility,
          currentFloor: '3F',
          currentDepartment: '手術部門',
          currentRoom: '手術室1',
          newFloor: '4F',
          newDepartment: '手術部門',
          newRoom: '手術室A',
          status: 'mapped',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'HF00002',
          hospitalId: firstFacility,
          hospitalName: firstFacility,
          currentFloor: '3F',
          currentDepartment: '手術部門',
          currentRoom: '手術室2',
          newFloor: '4F',
          newDepartment: '手術部門',
          newRoom: '手術室B',
          status: 'completed',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'HF00003',
          hospitalId: firstFacility,
          hospitalName: firstFacility,
          currentFloor: '2F',
          currentDepartment: '外来',
          currentRoom: '診察室1',
          newFloor: '3F',
          newDepartment: '外来',
          newRoom: '診察室A',
          status: 'draft',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'HF00004',
          hospitalId: secondFacility,
          hospitalName: secondFacility,
          currentFloor: '1F',
          currentDepartment: '救急部門',
          currentRoom: '救急処置室',
          newFloor: '1F',
          newDepartment: '救急部門',
          newRoom: '救急処置室A',
          status: 'draft',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'HF00005',
          hospitalId: secondFacility,
          hospitalName: secondFacility,
          currentFloor: '2F',
          currentDepartment: '検査部門',
          currentRoom: '検査室1',
          newFloor: '2F',
          newDepartment: '検査部門',
          newRoom: '検査室A',
          status: 'draft',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      setFacilities(sampleFacilities);
    }
  }, [facilities.length, masterFacilities, setFacilities]);

  // 選択施設の個別施設一覧を取得
  const hospitalFacilities = selectedFacilityName
    ? facilities.filter((f) => f.hospitalName === selectedFacilityName)
    : [];

  // フィルタリング処理
  const filteredFacilities = hospitalFacilities.filter((facility) => {
    const matchCurrentFloor =
      !filterCurrentFloor ||
      facility.currentFloor.toLowerCase().includes(filterCurrentFloor.toLowerCase());
    const matchCurrentDepartment =
      !filterCurrentDepartment ||
      facility.currentDepartment.toLowerCase().includes(filterCurrentDepartment.toLowerCase());
    const matchNewFloor =
      !filterNewFloor ||
      facility.newFloor.toLowerCase().includes(filterNewFloor.toLowerCase());
    const matchNewDepartment =
      !filterNewDepartment ||
      facility.newDepartment.toLowerCase().includes(filterNewDepartment.toLowerCase());
    const matchStatus = !filterStatus || facility.status === filterStatus;

    return (
      matchCurrentFloor &&
      matchCurrentDepartment &&
      matchNewFloor &&
      matchNewDepartment &&
      matchStatus
    );
  });

  const handleBack = () => {
    router.back();
  };

  const handleEdit = (facility: HospitalFacilityMaster) => {
    setSelectedFacility(facility);
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('この施設マスタを削除してもよろしいですか？')) {
      deleteFacility(id);
    }
  };

  const handleNewSubmit = (data: Partial<HospitalFacilityMaster>) => {
    if (!selectedFacilityName) return;

    const newFacility: HospitalFacilityMaster = {
      id: generateFacilityId(),
      hospitalId: selectedFacilityName,
      hospitalName: selectedFacilityName,
      currentFloor: data.currentFloor || '',
      currentDepartment: data.currentDepartment || '',
      currentRoom: data.currentRoom || '',
      newFloor: data.newFloor || '',
      newDepartment: data.newDepartment || '',
      newRoom: data.newRoom || '',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addFacility(newFacility);
    setShowNewModal(false);
  };

  const handleEditSubmit = (data: Partial<HospitalFacilityMaster>) => {
    if (selectedFacility) {
      // ステータス判定: 新居情報が全て入力されていれば mapped に
      const hasNewLocation = data.newFloor && data.newDepartment && data.newRoom;
      const newStatus = hasNewLocation ? 'mapped' : 'draft';
      updateFacility(selectedFacility.id, { ...data, status: newStatus as HospitalFacilityStatus });
      setShowEditModal(false);
      setSelectedFacility(null);
    }
  };

  const getStatusBadge = (status: HospitalFacilityStatus) => {
    const styles: Record<HospitalFacilityStatus, { bg: string; color: string; label: string }> = {
      draft: { bg: '#fef3c7', color: '#92400e', label: '下書き' },
      mapped: { bg: '#dbeafe', color: '#1e40af', label: 'マッピング済' },
      completed: { bg: '#dcfce7', color: '#166534', label: '完了' },
    };
    const style = styles[status];
    return (
      <span
        style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
          background: style.bg,
          color: style.color,
        }}
      >
        {style.label}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header
        style={{
          background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
          color: 'white',
          padding: isMobile ? '12px 16px' : isTablet ? '14px 20px' : '16px 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: isMobile ? '12px' : '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
                padding: isMobile ? '6px 10px' : '8px 12px',
                borderRadius: '6px',
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: 700,
                letterSpacing: '1px',
              }}
            >
              施設
            </div>
            <h1
              style={{
                fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px',
                fontWeight: 600,
                margin: 0,
              }}
            >
              個別施設マスタ
            </h1>
          </div>
          {selectedFacilityName && (
            <div
              style={{
                background: '#34495e',
                color: '#ffffff',
                padding: isMobile ? '4px 12px' : '6px 16px',
                borderRadius: '20px',
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: 600,
              }}
            >
              {selectedFacilityName} - {filteredFacilities.length}件
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {selectedFacilityName && (
            <button
              onClick={() => setShowNewModal(true)}
              style={{
                padding: isMobile ? '8px 16px' : '10px 20px',
                background: '#8e44ad',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              新規作成
            </button>
          )}
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
              whiteSpace: 'nowrap',
            }}
          >
            戻る
          </button>
        </div>
      </header>

      {/* Facility Selection */}
      {!facilityParam && (
        <div
          style={{
            background: 'white',
            padding: isMobile ? '12px 16px' : '16px 24px',
            borderBottom: '2px solid #e0e0e0',
          }}
        >
          <SearchableSelect
            label="施設を選択"
            value={selectedFacilityName}
            onChange={(value) => setSelectedFacilityName(value)}
            options={['', ...facilityOptions]}
            placeholder="施設を選択してください"
            isMobile={isMobile}
          />
        </div>
      )}

      {/* Filter Header */}
      {selectedFacilityName && (
        <div
          style={{
            background: 'white',
            padding: isMobile ? '12px 16px' : isTablet ? '16px 20px' : '20px 24px',
            borderBottom: '2px solid #e0e0e0',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: isMobile ? '12px' : '16px',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: isMobile ? '12px' : '13px',
                fontWeight: 600,
                marginBottom: '6px',
                color: '#2c3e50',
              }}
            >
              現状 - 階
            </label>
            <input
              type="text"
              value={filterCurrentFloor}
              onChange={(e) => setFilterCurrentFloor(e.target.value)}
              placeholder="3F"
              style={{
                width: '100%',
                padding: isMobile ? '8px' : '10px',
                border: '1px solid #d0d0d0',
                borderRadius: '6px',
                fontSize: isMobile ? '13px' : '14px',
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: isMobile ? '12px' : '13px',
                fontWeight: 600,
                marginBottom: '6px',
                color: '#2c3e50',
              }}
            >
              現状 - 部門
            </label>
            <input
              type="text"
              value={filterCurrentDepartment}
              onChange={(e) => setFilterCurrentDepartment(e.target.value)}
              placeholder="手術部門"
              style={{
                width: '100%',
                padding: isMobile ? '8px' : '10px',
                border: '1px solid #d0d0d0',
                borderRadius: '6px',
                fontSize: isMobile ? '13px' : '14px',
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: isMobile ? '12px' : '13px',
                fontWeight: 600,
                marginBottom: '6px',
                color: '#2c3e50',
              }}
            >
              新居 - 階
            </label>
            <input
              type="text"
              value={filterNewFloor}
              onChange={(e) => setFilterNewFloor(e.target.value)}
              placeholder="4F"
              style={{
                width: '100%',
                padding: isMobile ? '8px' : '10px',
                border: '1px solid #d0d0d0',
                borderRadius: '6px',
                fontSize: isMobile ? '13px' : '14px',
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: isMobile ? '12px' : '13px',
                fontWeight: 600,
                marginBottom: '6px',
                color: '#2c3e50',
              }}
            >
              新居 - 部門
            </label>
            <input
              type="text"
              value={filterNewDepartment}
              onChange={(e) => setFilterNewDepartment(e.target.value)}
              placeholder="手術部門"
              style={{
                width: '100%',
                padding: isMobile ? '8px' : '10px',
                border: '1px solid #d0d0d0',
                borderRadius: '6px',
                fontSize: isMobile ? '13px' : '14px',
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: isMobile ? '12px' : '13px',
                fontWeight: 600,
                marginBottom: '6px',
                color: '#2c3e50',
              }}
            >
              ステータス
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as HospitalFacilityStatus | '')}
              style={{
                width: '100%',
                padding: isMobile ? '8px' : '10px',
                border: '1px solid #d0d0d0',
                borderRadius: '6px',
                fontSize: isMobile ? '13px' : '14px',
              }}
            >
              <option value="">すべて</option>
              <option value="draft">下書き</option>
              <option value="mapped">マッピング済</option>
              <option value="completed">完了</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ flex: 1, padding: isMobile ? '16px' : isTablet ? '20px' : '24px', overflowY: 'auto' }}>
        {!selectedFacilityName ? (
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: isMobile ? '40px 20px' : '60px 40px',
              textAlign: 'center',
              color: '#7f8c8d',
              fontSize: isMobile ? '14px' : '16px',
            }}
          >
            施設を選択してください
          </div>
        ) : isMobile ? (
          // カード表示 (モバイル)
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredFacilities.map((facility) => (
              <div
                key={facility.id}
                style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#2c3e50' }}>
                      {facility.id}
                    </div>
                    {getStatusBadge(facility.status)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                  <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ fontWeight: 600, color: '#7f8c8d', marginBottom: '6px' }}>現状</div>
                    <div>{facility.currentFloor} / {facility.currentDepartment} / {facility.currentRoom}</div>
                  </div>
                  <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ fontWeight: 600, color: '#7f8c8d', marginBottom: '6px' }}>新居</div>
                    <div>{facility.newFloor || '-'} / {facility.newDepartment || '-'} / {facility.newRoom || '-'}</div>
                  </div>
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
                      cursor: 'pointer',
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
                      cursor: 'pointer',
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
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap' }}>ID</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap', background: '#f8f9fa' }}>現状 - 階</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap', background: '#f8f9fa' }}>現状 - 部門</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap', background: '#f8f9fa' }}>現状 - 部屋名</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#8e44ad', whiteSpace: 'nowrap', background: '#f5f0ff' }}>新居 - 階</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#8e44ad', whiteSpace: 'nowrap', background: '#f5f0ff' }}>新居 - 部門</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#8e44ad', whiteSpace: 'nowrap', background: '#f5f0ff' }}>新居 - 部屋名</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'center', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap' }}>ステータス</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'center', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacilities.map((facility, index) => (
                    <tr key={facility.id} style={{ borderBottom: '1px solid #f0f0f0', background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50', whiteSpace: 'nowrap' }}>{facility.id}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50', whiteSpace: 'nowrap' }}>{facility.currentFloor}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50' }}>{facility.currentDepartment}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50' }}>{facility.currentRoom}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#8e44ad', background: index % 2 === 0 ? '#faf8fc' : '#f5f0ff' }}>{facility.newFloor || '-'}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#8e44ad', background: index % 2 === 0 ? '#faf8fc' : '#f5f0ff' }}>{facility.newDepartment || '-'}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#8e44ad', background: index % 2 === 0 ? '#faf8fc' : '#f5f0ff' }}>{facility.newRoom || '-'}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', textAlign: 'center' }}>{getStatusBadge(facility.status)}</td>
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
                              cursor: 'pointer',
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
                              cursor: 'pointer',
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

        {selectedFacilityName && filteredFacilities.length === 0 && (
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: isMobile ? '40px 20px' : '60px 40px',
              textAlign: 'center',
              color: '#7f8c8d',
              fontSize: isMobile ? '14px' : '16px',
            }}
          >
            検索条件に一致する施設マスタがありません
          </div>
        )}
      </main>

      {/* 新規作成モーダル */}
      <HospitalFacilityFormModal
        isOpen={showNewModal}
        mode="create"
        onClose={() => setShowNewModal(false)}
        onSubmit={handleNewSubmit}
        isMobile={isMobile}
      />

      {/* 編集モーダル */}
      <HospitalFacilityFormModal
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

export default function HospitalFacilityMasterPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>読み込み中...</div>}>
      <HospitalFacilityMasterContent />
    </Suspense>
  );
}
