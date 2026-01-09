'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useMasterStore } from '@/lib/stores';
import { useHospitalFacilityStore } from '@/lib/stores/hospitalFacilityStore';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

function SurveyLocationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const facilityName = searchParams.get('facility') || '';
  const { isMobile, isTablet } = useResponsive();
  const { assets: assetMasters } = useMasterStore();
  const { facilities: hospitalFacilities } = useHospitalFacilityStore();

  // 選択された施設の個別施設マスタデータをフィルター
  const facilityMasterData = useMemo(() => {
    if (!facilityName) return [];
    return hospitalFacilities.filter(f => f.hospitalName === facilityName);
  }, [hospitalFacilities, facilityName]);

  const [surveyDate, setSurveyDate] = useState('');
  const [category, setCategory] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');

  // 資産マスタからカテゴリーオプションを生成
  const categoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(new Set(assetMasters.map(a => a.category)));
    return uniqueCategories.filter(Boolean);
  }, [assetMasters]);

  // 個別施設マスタ（HospitalFacilityMaster）から現状の設置場所オプションを生成
  const buildingOptions = useMemo(() => {
    const uniqueBuildings = Array.from(new Set(facilityMasterData.map(f => f.currentBuilding).filter((b): b is string => !!b)));
    return uniqueBuildings;
  }, [facilityMasterData]);

  const floorOptions = useMemo(() => {
    const uniqueFloors = Array.from(new Set(facilityMasterData.map(f => f.currentFloor).filter((f): f is string => !!f)));
    return uniqueFloors;
  }, [facilityMasterData]);

  const departmentOptions = useMemo(() => {
    const uniqueDepartments = Array.from(new Set(facilityMasterData.map(f => f.currentDepartment).filter((d): d is string => !!d)));
    return uniqueDepartments;
  }, [facilityMasterData]);

  const sectionOptions = useMemo(() => {
    const uniqueSections = Array.from(new Set(facilityMasterData.map(f => f.currentSection).filter((s): s is string => !!s)));
    return uniqueSections;
  }, [facilityMasterData]);

  useEffect(() => {
    // Set current date in Japanese format
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    setSurveyDate(`${year}年${month}月${day}日`);
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    // Validate that all fields are selected
    if (!category || !building || !floor || !department || !section) {
      alert('すべての項目を選択してください');
      return;
    }

    // Navigate to asset input screen with location data
    const queryParams = new URLSearchParams({
      category,
      building,
      floor,
      department,
      section,
      surveyDate
    });
    router.push(`/asset-survey-integrated?${queryParams.toString()}`);
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
        justifyContent: isMobile ? 'center' : 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '8px' : '0'
      }}>
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: isTablet ? '10px' : '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #27ae60, #229954)',
              padding: isTablet ? '6px 10px' : '8px 12px',
              borderRadius: '6px',
              fontSize: isTablet ? '12px' : '14px',
              fontWeight: 700,
              letterSpacing: '1px'
            }}>
              SHIP
            </div>
            <div style={{ fontSize: isTablet ? '14px' : '16px', fontWeight: 500 }}>
              HEALTHCARE 医療機器管理システム
            </div>
          </div>
        )}
        <div style={{ flex: isMobile ? '0' : '1', display: 'flex', justifyContent: 'center' }}>
          <h1 style={{ fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px', fontWeight: 600, margin: 0 }}>
            現有資産調査
          </h1>
        </div>
        {!isMobile && <div style={{ width: isTablet ? '150px' : '200px' }}></div>}
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: isMobile ? '20px 12px 120px 12px' : isTablet ? '28px 20px 120px 20px' : '38px 40px 120px 40px',
        overflowY: 'auto'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: isMobile ? '8px' : '12px',
          padding: isMobile ? '20px 16px' : isTablet ? '28px 24px' : '36px 40px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          maxWidth: '600px',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Survey Date */}
          <div style={{ marginBottom: isMobile ? '20px' : '26px' }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '14px' : '15px',
              fontWeight: 600,
              color: '#333333',
              marginBottom: '10px'
            }}>
              調査日
            </label>
            <div style={{
              backgroundColor: '#f8f8f8',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: isMobile ? '12px 14px' : '14px 18px',
              fontSize: isMobile ? '15px' : '16px',
              color: '#666666',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {surveyDate}
            </div>
          </div>

          {/* Category */}
          <div style={{ marginBottom: isMobile ? '20px' : '26px' }}>
            <SearchableSelect
              label="Category"
              value={category}
              onChange={setCategory}
              options={['', ...categoryOptions]}
              placeholder="選択してください"
              isMobile={isMobile}
            />
          </div>

          {/* Building (棟) */}
          <div style={{ marginBottom: isMobile ? '20px' : '26px' }}>
            <SearchableSelect
              label="棟"
              value={building}
              onChange={setBuilding}
              options={['', ...buildingOptions]}
              placeholder="選択してください"
              isMobile={isMobile}
            />
          </div>

          {/* Floor (階) */}
          <div style={{ marginBottom: isMobile ? '20px' : '26px' }}>
            <SearchableSelect
              label="階"
              value={floor}
              onChange={setFloor}
              options={['', ...floorOptions]}
              placeholder="選択してください"
              isMobile={isMobile}
            />
          </div>

          {/* Department (部門) */}
          <div style={{ marginBottom: isMobile ? '20px' : '26px' }}>
            <SearchableSelect
              label="部門"
              value={department}
              onChange={setDepartment}
              options={['', ...departmentOptions]}
              placeholder="選択してください"
              isMobile={isMobile}
            />
          </div>

          {/* Section (部署) */}
          <div style={{ marginBottom: 0 }}>
            <SearchableSelect
              label="部署"
              value={section}
              onChange={setSection}
              options={['', ...sectionOptions]}
              placeholder="選択してください"
              isMobile={isMobile}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #ddd',
        padding: isMobile ? '16px 20px' : isTablet ? '18px 30px' : '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
        height: isMobile ? '90px' : '100px',
        boxSizing: 'border-box',
        zIndex: 1000
      }}>
        <button
          onClick={handleBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isMobile ? '6px' : '5px',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background 0.3s',
            minWidth: isMobile ? undefined : '70px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ecf0f1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
        >
          <div style={{
            background: '#ecf0f1',
            borderRadius: '50%',
            width: isMobile ? '48px' : '52px',
            height: isMobile ? '48px' : '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: 0,
              height: 0,
              borderRight: isMobile ? '9px solid #34495e' : '10px solid #34495e',
              borderTop: isMobile ? '5px solid transparent' : '6px solid transparent',
              borderBottom: isMobile ? '5px solid transparent' : '6px solid transparent'
            }}></div>
          </div>
          <span style={{ fontSize: '12px', color: '#2c3e50' }}>戻る</span>
        </button>

        <button
          onClick={handleNext}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isMobile ? '6px' : '5px',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background 0.3s',
            minWidth: isMobile ? undefined : '70px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#d5f4e6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
        >
          <div style={{
            background: '#d5f4e6',
            borderRadius: '50%',
            width: isMobile ? '48px' : '52px',
            height: isMobile ? '48px' : '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: 0,
              height: 0,
              borderLeft: isMobile ? '9px solid #34495e' : '10px solid #34495e',
              borderTop: isMobile ? '5px solid transparent' : '6px solid transparent',
              borderBottom: isMobile ? '5px solid transparent' : '6px solid transparent'
            }}></div>
          </div>
          <span style={{ fontSize: '12px', color: '#27ae60', fontWeight: 600 }}>次へ</span>
        </button>
      </footer>
    </div>
  );
}

export default function SurveyLocationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SurveyLocationContent />
    </Suspense>
  );
}
