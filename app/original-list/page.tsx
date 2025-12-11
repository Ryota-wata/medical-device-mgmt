'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useOriginalListStore, useHospitalFacilityStore, useMasterStore } from '@/lib/stores';
import { OriginalListItem, OriginalListStatus, getOriginalListStatusBadgeStyle } from '@/lib/types/originalList';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

function OriginalListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile, isTablet } = useResponsive();
  const { facilities: masterFacilities } = useMasterStore();
  const {
    items,
    setItems,
    addItem,
    updateItem,
    deleteItem,
    getItemsByHospitalId,
    applyMappingToAll,
    setNewLocation,
    getStats,
    generateItemId,
  } = useOriginalListStore();
  const { getNewLocationByCurrentLocation } = useHospitalFacilityStore();

  // URLパラメータから施設名を取得
  const facilityParam = searchParams.get('facility');
  const [selectedFacilityName, setSelectedFacilityName] = useState<string>(facilityParam || '');

  // 施設マスタから施設名オプションを生成
  const facilityOptions = masterFacilities.map(f => f.facilityName);

  // フィルター状態
  const [filterFloor, setFilterFloor] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState<OriginalListStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  // 選択状態
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // サンプルデータ初期化
  useEffect(() => {
    if (items.length === 0 && masterFacilities.length > 0) {
      const firstFacility = masterFacilities[0]?.facilityName || '東京中央病院';
      const now = new Date().toISOString();

      const sampleItems: OriginalListItem[] = [
        {
          id: 'OL000001',
          hospitalId: firstFacility,
          hospitalName: firstFacility,
          assetName: '電気メス装置',
          assetNo: '10605379-001',
          managementNo: '1339',
          category: '医療機器',
          largeClass: '手術関連機器',
          mediumClass: '電気メス',
          maker: '医療機器メーカーA',
          model: 'ESU-2000',
          serialNumber: 'SN-2024-001',
          quantity: 1,
          currentFloor: '3F',
          currentDepartment: '手術部門',
          currentRoom: '手術室1',
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'OL000002',
          hospitalId: firstFacility,
          hospitalName: firstFacility,
          assetName: '患者モニター',
          assetNo: '10605379-002',
          managementNo: '1340',
          category: '医療機器',
          largeClass: 'モニタリング機器',
          mediumClass: '生体情報モニター',
          maker: '医療機器メーカーB',
          model: 'PM-5000',
          serialNumber: 'SN-2024-002',
          quantity: 1,
          currentFloor: '3F',
          currentDepartment: '手術部門',
          currentRoom: '手術室2',
          newFloor: '4F',
          newDepartment: '手術部門',
          newRoom: '手術室B',
          status: 'mapped',
          mappedAt: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'OL000003',
          hospitalId: firstFacility,
          hospitalName: firstFacility,
          assetName: '麻酔器',
          assetNo: '10605379-003',
          managementNo: '1341',
          category: '医療機器',
          largeClass: '麻酔関連機器',
          mediumClass: '麻酔器',
          maker: '医療機器メーカーC',
          model: 'ANE-3000',
          serialNumber: 'SN-2024-003',
          quantity: 1,
          currentFloor: '2F',
          currentDepartment: '外来',
          currentRoom: '診察室1',
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        },
      ];
      setItems(sampleItems);
    }
  }, [items.length, masterFacilities, setItems]);

  // 選択施設のアイテム一覧を取得
  const hospitalItems = selectedFacilityName
    ? getItemsByHospitalId(selectedFacilityName)
    : [];

  // フィルタリング処理
  const filteredItems = hospitalItems.filter((item) => {
    const matchFloor =
      !filterFloor ||
      item.currentFloor.toLowerCase().includes(filterFloor.toLowerCase());
    const matchDepartment =
      !filterDepartment ||
      item.currentDepartment.toLowerCase().includes(filterDepartment.toLowerCase());
    const matchStatus = !filterStatus || item.status === filterStatus;
    const matchSearch =
      !searchQuery ||
      item.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.assetNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.managementNo?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchFloor && matchDepartment && matchStatus && matchSearch;
  });

  // 統計情報
  const stats = selectedFacilityName ? getStats(selectedFacilityName) : null;

  const handleBack = () => {
    router.back();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleApplyMappingToSelected = () => {
    if (selectedIds.size === 0) {
      alert('マッピングを適用するアイテムを選択してください');
      return;
    }

    let mappedCount = 0;
    selectedIds.forEach((id) => {
      const item = items.find((i) => i.id === id);
      if (item && item.status === 'pending') {
        const newLocation = getNewLocationByCurrentLocation({
          hospitalId: item.hospitalId,
          floor: item.currentFloor,
          department: item.currentDepartment,
          room: item.currentRoom,
        });
        if (newLocation && newLocation.floor) {
          setNewLocation(id, newLocation);
          mappedCount++;
        }
      }
    });

    if (mappedCount > 0) {
      alert(`${mappedCount}件のアイテムに新居情報を適用しました`);
    } else {
      alert('マッピング可能なアイテムがありませんでした。\n個別施設マスタでマッピング情報を登録してください。');
    }
    setSelectedIds(new Set());
  };

  const handleApplyMappingToAll = () => {
    if (!selectedFacilityName) return;

    const mappedCount = applyMappingToAll(selectedFacilityName);
    if (mappedCount > 0) {
      alert(`${mappedCount}件のアイテムに新居情報を一括適用しました`);
    } else {
      alert('マッピング可能なアイテムがありませんでした。\n個別施設マスタでマッピング情報を登録してください。');
    }
  };

  const getStatusBadge = (status: OriginalListStatus) => {
    const style = getOriginalListStatusBadgeStyle(status);
    return (
      <span
        style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
          background: style.background,
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
                background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                padding: isMobile ? '6px 10px' : '8px 12px',
                borderRadius: '6px',
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: 700,
                letterSpacing: '1px',
              }}
            >
              原本
            </div>
            <h1
              style={{
                fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px',
                fontWeight: 600,
                margin: 0,
              }}
            >
              原本リスト管理
            </h1>
          </div>
          {stats && (
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
              {stats.total}件 / マッピング率: {stats.mappingRate}%
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {selectedFacilityName && (
            <button
              onClick={handleApplyMappingToAll}
              style={{
                padding: isMobile ? '8px 16px' : '10px 20px',
                background: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              一括マッピング
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

      {/* Filter Bar */}
      {selectedFacilityName && (
        <div
          style={{
            background: 'white',
            padding: isMobile ? '12px 16px' : '16px 24px',
            borderBottom: '2px solid #e0e0e0',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: isMobile ? '12px' : '16px',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>
              検索
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="資産名、資産番号..."
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d0d0d0',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>
              階
            </label>
            <input
              type="text"
              value={filterFloor}
              onChange={(e) => setFilterFloor(e.target.value)}
              placeholder="3F"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d0d0d0',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>
              部門
            </label>
            <input
              type="text"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              placeholder="手術部門"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d0d0d0',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>
              ステータス
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as OriginalListStatus | '')}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d0d0d0',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="">すべて</option>
              <option value="pending">未処理</option>
              <option value="mapped">マッピング済</option>
              <option value="approved">承認済</option>
              <option value="completed">完了</option>
            </select>
          </div>
        </div>
      )}

      {/* Selection Actions */}
      {selectedIds.size > 0 && (
        <div
          style={{
            background: '#e8f4fd',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #b8daff',
          }}
        >
          <span style={{ fontWeight: 600, color: '#2c3e50' }}>
            {selectedIds.size}件選択中
          </span>
          <button
            onClick={handleApplyMappingToSelected}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            選択アイテムにマッピング適用
          </button>
        </div>
      )}

      {/* Main Content */}
      <main style={{ flex: 1, padding: isMobile ? '16px' : '24px', overflowY: 'auto' }}>
        {!selectedFacilityName ? (
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '60px 40px',
              textAlign: 'center',
              color: '#7f8c8d',
              fontSize: '16px',
            }}
          >
            施設を選択してください
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <tr>
                    <th style={{ padding: '14px', textAlign: 'center', width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap' }}>資産番号</th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#2c3e50' }}>資産名</th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap', background: '#f8f9fa' }}>現状 - 階</th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#2c3e50', background: '#f8f9fa' }}>現状 - 部門</th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#2c3e50', background: '#f8f9fa' }}>現状 - 部屋</th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#8e44ad', whiteSpace: 'nowrap', background: '#f5f0ff' }}>新居 - 階</th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#8e44ad', background: '#f5f0ff' }}>新居 - 部門</th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: '#8e44ad', background: '#f5f0ff' }}>新居 - 部屋</th>
                    <th style={{ padding: '14px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#2c3e50' }}>ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0', background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                        />
                      </td>
                      <td style={{ padding: '14px', fontSize: '14px', color: '#2c3e50', whiteSpace: 'nowrap' }}>{item.assetNo || '-'}</td>
                      <td style={{ padding: '14px', fontSize: '14px', color: '#2c3e50' }}>{item.assetName}</td>
                      <td style={{ padding: '14px', fontSize: '14px', color: '#2c3e50', whiteSpace: 'nowrap' }}>{item.currentFloor}</td>
                      <td style={{ padding: '14px', fontSize: '14px', color: '#2c3e50' }}>{item.currentDepartment}</td>
                      <td style={{ padding: '14px', fontSize: '14px', color: '#2c3e50' }}>{item.currentRoom}</td>
                      <td style={{ padding: '14px', fontSize: '14px', color: '#8e44ad', background: index % 2 === 0 ? '#faf8fc' : '#f5f0ff' }}>{item.newFloor || '-'}</td>
                      <td style={{ padding: '14px', fontSize: '14px', color: '#8e44ad', background: index % 2 === 0 ? '#faf8fc' : '#f5f0ff' }}>{item.newDepartment || '-'}</td>
                      <td style={{ padding: '14px', fontSize: '14px', color: '#8e44ad', background: index % 2 === 0 ? '#faf8fc' : '#f5f0ff' }}>{item.newRoom || '-'}</td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>{getStatusBadge(item.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedFacilityName && filteredItems.length === 0 && (
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '60px 40px',
              textAlign: 'center',
              color: '#7f8c8d',
              fontSize: '16px',
            }}
          >
            検索条件に一致するアイテムがありません
          </div>
        )}
      </main>
    </div>
  );
}

export default function OriginalListPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>読み込み中...</div>}>
      <OriginalListContent />
    </Suspense>
  );
}
