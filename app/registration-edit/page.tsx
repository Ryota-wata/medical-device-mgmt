'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useMasterStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface Photo {
  id: string;
  url: string;
  filename: string;
}

interface RegistrationData {
  id: number;
  surveyDate: string;
  surveyor: string;
  category: string;
  building: string;
  floor: string;
  department: string;
  section: string;
  sealNo: string;
  roomName: string;
  assetNo: string;
  equipmentNo: string;
  purchaseDate: string;
  lease: string;
  rental: string;
  photoCount: number;
  photos: Photo[];
  largeClass: string;
  mediumClass: string;
  item: string;
  manufacturer: string;
  model: string;
  width: string;
  depth: string;
  height: string;
  remarks: string;
  masterId: string;
}

export default function RegistrationEditPage() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { assets: assetMasters, facilities } = useMasterStore();
  const [selectedAll, setSelectedAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<RegistrationData | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedRowForPhoto, setSelectedRowForPhoto] = useState<RegistrationData | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [masterSearchKeyword, setMasterSearchKeyword] = useState('');

  // フィルター状態
  const [filters, setFilters] = useState({
    building: '',
    floor: '',
    department: '',
    section: '',
    category: '',
    largeClass: '',
    mediumClass: '',
    surveyor: ''
  });

  const sampleData: RegistrationData[] = [
    {
      id: 1,
      surveyDate: '2025-11-01',
      surveyor: '山田太郎',
      category: '医療機器',
      building: '本館',
      floor: '2F',
      department: '手術部門',
      section: '器材室',
      sealNo: '22-00474',
      roomName: '手術室A',
      assetNo: '10605379-000',
      equipmentNo: '1338',
      purchaseDate: '2022-04-15',
      lease: 'なし',
      rental: 'なし',
      photoCount: 3,
      photos: [
        { id: '1-1', url: 'https://placehold.co/800x600/e3f2fd/1976d2?text=Photo+1', filename: '装置全体.jpg' },
        { id: '1-2', url: 'https://placehold.co/800x600/e3f2fd/1976d2?text=Photo+2', filename: 'ラベル.jpg' },
        { id: '1-3', url: 'https://placehold.co/800x600/e3f2fd/1976d2?text=Photo+3', filename: '型式銘板.jpg' }
      ],
      largeClass: '医療機器',
      mediumClass: '滅菌機器',
      item: '燻蒸滅菌装置',
      manufacturer: 'VENLE GO',
      model: 'CEパルサマドライ',
      width: 'φ500',
      depth: '',
      height: '',
      remarks: '',
      masterId: 'M001'
    },
    {
      id: 2,
      surveyDate: '2025-11-02',
      surveyor: '佐藤花子',
      category: '医療機器',
      building: '本館',
      floor: '3F',
      department: '放射線科',
      section: 'CT室',
      sealNo: 'シールなし',
      roomName: 'CT室1',
      assetNo: '',
      equipmentNo: '',
      purchaseDate: '',
      lease: 'あり',
      rental: 'なし',
      photoCount: 1,
      photos: [
        { id: '2-1', url: 'https://placehold.co/800x600/fff3cd/f57c00?text=Photo+1', filename: '内視鏡本体.jpg' }
      ],
      largeClass: '医療機器',
      mediumClass: '内視鏡関連機器',
      item: '特殊内視鏡 BF-TYPE ABC',
      manufacturer: 'オリンパスメディカル',
      model: 'BF-ABC-123-XYZ',
      width: '',
      depth: '',
      height: '',
      remarks: 'リース期限近い',
      masterId: ''
    },
    {
      id: 3,
      surveyDate: '2025-11-03',
      surveyor: '田中一郎',
      category: '医療機器',
      building: '別館',
      floor: '1F',
      department: '検査科',
      section: '検査室',
      sealNo: '22-00812',
      roomName: '検査室B',
      assetNo: '10605421-000',
      equipmentNo: '2156',
      purchaseDate: '2023-01-20',
      lease: 'なし',
      rental: 'なし',
      photoCount: 2,
      photos: [
        { id: '3-1', url: 'https://placehold.co/800x600/c8e6c9/388e3c?text=Photo+1', filename: '本体正面.jpg' },
        { id: '3-2', url: 'https://placehold.co/800x600/c8e6c9/388e3c?text=Photo+2', filename: '操作パネル.jpg' }
      ],
      largeClass: '検査機器',
      mediumClass: '血液検査装置',
      item: '自動血球計数器',
      manufacturer: 'シスメックス',
      model: 'XN-3000',
      width: '600',
      depth: '550',
      height: '450',
      remarks: '',
      masterId: 'M002'
    },
    {
      id: 4,
      surveyDate: '2025-11-03',
      surveyor: '鈴木美咲',
      category: '什器備品',
      building: '新館',
      floor: '2F',
      department: '外科',
      section: '診察室',
      sealNo: '22-01035',
      roomName: '診察室3',
      assetNo: '10606523-000',
      equipmentNo: '3421',
      purchaseDate: '2024-06-10',
      lease: 'なし',
      rental: 'なし',
      photoCount: 1,
      photos: [
        { id: '4-1', url: 'https://placehold.co/800x600/ffecb3/ff9800?text=Photo+1', filename: '診察台.jpg' }
      ],
      largeClass: '什器備品',
      mediumClass: '診察台',
      item: '電動診察台',
      manufacturer: '高田ベッド製作所',
      model: 'TB-1234',
      width: '1800',
      depth: '650',
      height: '700',
      remarks: '昇降機能付き',
      masterId: 'M003'
    },
    {
      id: 5,
      surveyDate: '2025-11-04',
      surveyor: '高橋健太',
      category: '医療機器',
      building: '本館',
      floor: '4F',
      department: '整形外科',
      section: '処置室',
      sealNo: '22-01247',
      roomName: '処置室A',
      assetNo: '10607834-000',
      equipmentNo: '4892',
      purchaseDate: '2021-09-15',
      lease: 'あり',
      rental: 'なし',
      photoCount: 4,
      photos: [
        { id: '5-1', url: 'https://placehold.co/800x600/f3e5f5/9c27b0?text=Photo+1', filename: '超音波治療器全体.jpg' },
        { id: '5-2', url: 'https://placehold.co/800x600/f3e5f5/9c27b0?text=Photo+2', filename: '操作パネル.jpg' },
        { id: '5-3', url: 'https://placehold.co/800x600/f3e5f5/9c27b0?text=Photo+3', filename: 'プローブ.jpg' },
        { id: '5-4', url: 'https://placehold.co/800x600/f3e5f5/9c27b0?text=Photo+4', filename: 'メンテナンス記録.jpg' }
      ],
      largeClass: '治療機器',
      mediumClass: '物理療法機器',
      item: '超音波治療器',
      manufacturer: '伊藤超短波',
      model: 'US-750',
      width: '350',
      depth: '280',
      height: '120',
      remarks: '定期メンテナンス済',
      masterId: 'M004'
    },
    {
      id: 6,
      surveyDate: '2025-11-05',
      surveyor: '田中一郎',
      category: '医療機器',
      building: '新館',
      floor: '1F',
      department: '検査科',
      section: '検体検査室',
      sealNo: 'シールなし',
      roomName: '検体検査室B',
      assetNo: '',
      equipmentNo: '',
      purchaseDate: '',
      lease: 'なし',
      rental: 'なし',
      photoCount: 2,
      photos: [
        { id: '6-1', url: 'https://placehold.co/800x600/fff9c4/f57f17?text=Photo+1', filename: '血球計数器本体.jpg' },
        { id: '6-2', url: 'https://placehold.co/800x600/fff9c4/f57f17?text=Photo+2', filename: '型式プレート.jpg' }
      ],
      largeClass: '検査装置（フリー入力）',
      mediumClass: '血液検査装置（フリー入力）',
      item: '自動血球計数器 XYZ-2000（フリー入力）',
      manufacturer: 'ABC医療機器（フリー入力）',
      model: 'XYZ-2000-Pro（フリー入力）',
      width: '450',
      depth: '500',
      height: '400',
      remarks: 'マスタ未登録機器',
      masterId: ''
    },
    {
      id: 7,
      surveyDate: '2025-11-06',
      surveyor: '佐藤花子',
      category: '什器備品',
      building: '本館',
      floor: '1F',
      department: '事務部',
      section: '総務課',
      sealNo: '22-01500',
      roomName: '事務室',
      assetNo: '10608123-000',
      equipmentNo: '5123',
      purchaseDate: '2023-03-20',
      lease: 'なし',
      rental: 'なし',
      photoCount: 1,
      photos: [
        { id: '7-1', url: 'https://placehold.co/800x600/e1f5fe/0277bd?text=Photo+1', filename: 'スチール書庫.jpg' }
      ],
      largeClass: 'オフィス家具（フリー入力）',
      mediumClass: '書庫',
      item: 'スチール書庫 H1800（フリー入力）',
      manufacturer: 'コクヨ',
      model: 'S-D36F1N（フリー入力）',
      width: '900',
      depth: '400',
      height: '1800',
      remarks: '中分類と品目と型式がマスタ外',
      masterId: 'M005'
    }
  ];

  const [data, setData] = useState(sampleData);

  // フィルターoptionsを生成（施設マスタから）
  const buildingOptions = useMemo(() => {
    const uniqueBuildings = Array.from(new Set(facilities.map(f => f.building)));
    return uniqueBuildings.filter(Boolean) as string[];
  }, [facilities]);

  const floorOptions = useMemo(() => {
    const uniqueFloors = Array.from(new Set(facilities.map(f => f.floor)));
    return uniqueFloors.filter(Boolean) as string[];
  }, [facilities]);

  const departmentOptions = useMemo(() => {
    const uniqueDepartments = Array.from(new Set(facilities.map(f => f.department)));
    return uniqueDepartments.filter(Boolean) as string[];
  }, [facilities]);

  const sectionOptions = useMemo(() => {
    const uniqueSections = Array.from(new Set(facilities.map(f => f.section)));
    return uniqueSections.filter(Boolean) as string[];
  }, [facilities]);

  // フィルターoptionsを生成（資産マスタから）
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

  // 担当者オプションを生成（サンプルデータから）
  const surveyorOptions = useMemo(() => {
    const uniqueSurveyors = Array.from(new Set(data.map(d => d.surveyor)));
    return uniqueSurveyors.filter(Boolean);
  }, [data]);

  // フィルタリングされたデータ
  const filteredData = useMemo(() => {
    let filtered = data;

    if (filters.building) {
      filtered = filtered.filter(d => d.building === filters.building);
    }
    if (filters.floor) {
      filtered = filtered.filter(d => d.floor === filters.floor);
    }
    if (filters.department) {
      filtered = filtered.filter(d => d.department === filters.department);
    }
    if (filters.section) {
      filtered = filtered.filter(d => d.section === filters.section);
    }
    if (filters.category) {
      filtered = filtered.filter(d => d.category === filters.category);
    }
    if (filters.largeClass) {
      filtered = filtered.filter(d => d.largeClass === filters.largeClass);
    }
    if (filters.mediumClass) {
      filtered = filtered.filter(d => d.mediumClass === filters.mediumClass);
    }
    if (filters.surveyor) {
      filtered = filtered.filter(d => d.surveyor === filters.surveyor);
    }

    return filtered;
  }, [data, filters]);

  // フィルタークリア
  const handleClearFilters = () => {
    setFilters({
      building: '',
      floor: '',
      department: '',
      section: '',
      category: '',
      largeClass: '',
      mediumClass: '',
      surveyor: ''
    });
  };

  // マスタに存在するかチェックする関数
  const isInMaster = (field: 'largeClass' | 'mediumClass' | 'item' | 'manufacturer' | 'model', value: string): boolean => {
    if (!value) return true; // 空の場合は通常表示

    const fieldMap = {
      largeClass: 'largeClass',
      mediumClass: 'mediumClass',
      item: 'item',
      manufacturer: 'maker',
      model: 'model'
    };

    const masterField = fieldMap[field];
    return assetMasters.some(master => master[masterField as keyof typeof master] === value);
  };

  // フリー入力セルのスタイル
  const getFreeInputCellStyle = (field: 'largeClass' | 'mediumClass' | 'item' | 'manufacturer' | 'model', value: string, baseStyle: React.CSSProperties): React.CSSProperties => {
    const isFreeInput = !isInMaster(field, value);
    return {
      ...baseStyle,
      backgroundColor: isFreeInput ? '#fff9c4' : (baseStyle.backgroundColor || 'white')
    };
  };

  const handleBack = () => {
    router.back();
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedAll(checked);
    if (checked) {
      setSelectedRows(new Set(filteredData.map(row => row.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const toggleRowSelection = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
    setSelectedAll(newSelected.size === filteredData.length);
  };

  const handleEdit = (id: number) => {
    const row = data.find(r => r.id === id);
    if (row) {
      setEditingRow(id);
      setEditingData({ ...row });
    }
  };

  const handleSave = () => {
    if (editingData && editingRow !== null) {
      setData(data.map(row => row.id === editingRow ? editingData : row));
      setEditingRow(null);
      setEditingData(null);
    }
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditingData(null);
  };

  const handlePhotoClick = (row: RegistrationData) => {
    setSelectedRowForPhoto(row);
    setIsPhotoModalOpen(true);
    setSelectedPhoto(null);
  };

  const handlePhotoDelete = (photoId: string) => {
    if (!selectedRowForPhoto) return;

    const updatedRow = {
      ...selectedRowForPhoto,
      photos: selectedRowForPhoto.photos.filter(p => p.id !== photoId),
      photoCount: selectedRowForPhoto.photos.filter(p => p.id !== photoId).length
    };

    setData(data.map(row => row.id === selectedRowForPhoto.id ? updatedRow : row));
    setSelectedRowForPhoto(updatedRow);
    setSelectedPhoto(null);
  };

  const handlePhotoModalClose = () => {
    setIsPhotoModalOpen(false);
    setSelectedRowForPhoto(null);
    setSelectedPhoto(null);
  };

  const handleOpenMasterModal = () => {
    setIsMasterModalOpen(true);
    setMasterSearchKeyword('');
  };

  const handleCloseMasterModal = () => {
    setIsMasterModalOpen(false);
    setMasterSearchKeyword('');
  };

  const handleApplyMaster = (master: typeof assetMasters[0]) => {
    if (!editingData) return;

    setEditingData({
      ...editingData,
      largeClass: master.largeClass,
      mediumClass: master.mediumClass,
      item: master.item,
      manufacturer: master.maker,
      model: master.model,
      masterId: master.id
    });

    setIsMasterModalOpen(false);
    setMasterSearchKeyword('');
  };

  // マスタ検索フィルター
  const filteredMasters = useMemo(() => {
    if (!masterSearchKeyword) return assetMasters;

    const keyword = masterSearchKeyword.toLowerCase();
    return assetMasters.filter(master =>
      master.largeClass.toLowerCase().includes(keyword) ||
      master.mediumClass.toLowerCase().includes(keyword) ||
      master.item.toLowerCase().includes(keyword) ||
      master.maker.toLowerCase().includes(keyword) ||
      master.model.toLowerCase().includes(keyword)
    );
  }, [assetMasters, masterSearchKeyword]);

  const handleConfirm = (id: number) => {
    const row = filteredData.find(r => r.id === id);
    if (row && !row.masterId) {
      alert('マスタIDが登録されていないため確定できません');
      return;
    }
    alert(`行 ${id} を確定しました`);
  };

  const handleBulkConfirm = () => {
    if (selectedRows.size === 0) {
      alert('確定する行を選択してください');
      return;
    }
    const invalidRows = filteredData.filter(row => selectedRows.has(row.id) && !row.masterId);
    if (invalidRows.length > 0) {
      alert(`${invalidRows.length}件のマスタ未登録行があります。先にマスタ登録を完了してください。`);
      return;
    }
    alert(`${selectedRows.size}件を一括確定しました`);
  };

  if (isMobile) {
    return (
      <div style={{ padding: '16px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <div style={{ marginBottom: '16px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
          現有品調査内容修正
        </div>
        <div style={{ color: '#d32f2f', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
          この画面はデスクトップ表示に最適化されています
        </div>
        <button
          onClick={handleBack}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          戻る
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: '#1976d2',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}>
            SHIP
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
            現有品調査内容修正
          </h1>
        </div>
        <button
          onClick={handleBack}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ffffff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          戻る
        </button>
      </header>

      {/* Filter Header */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '16px 24px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="棟"
              value={filters.building}
              onChange={(value) => setFilters({...filters, building: value})}
              options={buildingOptions}
              placeholder="全て"
              isMobile={false}
            />
          </div>

          <div style={{ flex: '1', minWidth: '100px' }}>
            <SearchableSelect
              label="階"
              value={filters.floor}
              onChange={(value) => setFilters({...filters, floor: value})}
              options={floorOptions}
              placeholder="全て"
              isMobile={false}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="部門"
              value={filters.department}
              onChange={(value) => setFilters({...filters, department: value})}
              options={departmentOptions}
              placeholder="全て"
              isMobile={false}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="部署"
              value={filters.section}
              onChange={(value) => setFilters({...filters, section: value})}
              options={sectionOptions}
              placeholder="全て"
              isMobile={false}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="担当者"
              value={filters.surveyor}
              onChange={(value) => setFilters({...filters, surveyor: value})}
              options={surveyorOptions}
              placeholder="全て"
              isMobile={false}
            />
          </div>

          <div style={{ flex: '1', minWidth: '120px' }}>
            <SearchableSelect
              label="Category"
              value={filters.category}
              onChange={(value) => setFilters({...filters, category: value})}
              options={categoryOptions}
              placeholder="全て"
              isMobile={false}
            />
          </div>

          <div style={{ flex: '1', minWidth: '150px' }}>
            <SearchableSelect
              label="大分類"
              value={filters.largeClass}
              onChange={(value) => setFilters({...filters, largeClass: value})}
              options={largeClassOptions}
              placeholder="全て"
              isMobile={false}
            />
          </div>

          <div style={{ flex: '1', minWidth: '150px' }}>
            <SearchableSelect
              label="中分類"
              value={filters.mediumClass}
              onChange={(value) => setFilters({...filters, mediumClass: value})}
              options={mediumClassOptions}
              placeholder="全て"
              isMobile={false}
            />
          </div>

          <button
            onClick={handleClearFilters}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              color: '#666',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            クリア
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', position: 'sticky', left: 0, backgroundColor: '#f5f5f5', zIndex: 2 }}>
                  <input
                    type="checkbox"
                    checked={selectedAll}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>調査日</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>調査担当者</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>Category</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>棟</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>階</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>部門</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>部署</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>ラベル番号</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>室名</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>資産番号</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>備品番号</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>購入年月日</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>リース</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>貸出品</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>写真</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>大分類</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>中分類</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>品目</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>メーカー</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>型式</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>W</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>D</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>H</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>備考</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', position: 'sticky', right: 0, backgroundColor: '#f5f5f5', zIndex: 2 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <tr key={row.id} style={{ backgroundColor: !row.masterId ? '#fff3cd' : 'white' }}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', position: 'sticky', left: 0, backgroundColor: !row.masterId ? '#fff3cd' : 'white', zIndex: 1 }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={() => toggleRowSelection(row.id)}
                    />
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.surveyDate}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.surveyor}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.category}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.building}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.floor}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.department}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.section}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.sealNo}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.roomName}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.assetNo}
                        onChange={(e) => setEditingData({ ...editingData, assetNo: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.assetNo}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.equipmentNo}
                        onChange={(e) => setEditingData({ ...editingData, equipmentNo: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.equipmentNo}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="date"
                        value={editingData.purchaseDate}
                        onChange={(e) => setEditingData({ ...editingData, purchaseDate: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.purchaseDate}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    {editingRow === row.id && editingData ? (
                      <select
                        value={editingData.lease}
                        onChange={(e) => setEditingData({ ...editingData, lease: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      >
                        <option value="あり">あり</option>
                        <option value="なし">なし</option>
                      </select>
                    ) : row.lease}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    {editingRow === row.id && editingData ? (
                      <select
                        value={editingData.rental}
                        onChange={(e) => setEditingData({ ...editingData, rental: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      >
                        <option value="あり">あり</option>
                        <option value="なし">なし</option>
                      </select>
                    ) : row.rental}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => handlePhotoClick(row)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        backgroundColor: '#e3f2fd',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      📷 {row.photoCount}枚
                    </button>
                  </td>
                  <td style={getFreeInputCellStyle('largeClass', editingRow === row.id && editingData ? editingData.largeClass : row.largeClass, { padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' })}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.largeClass}
                        onChange={(e) => setEditingData({ ...editingData, largeClass: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.largeClass}
                  </td>
                  <td style={getFreeInputCellStyle('mediumClass', editingRow === row.id && editingData ? editingData.mediumClass : row.mediumClass, { padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' })}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.mediumClass}
                        onChange={(e) => setEditingData({ ...editingData, mediumClass: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.mediumClass}
                  </td>
                  <td style={getFreeInputCellStyle('item', editingRow === row.id && editingData ? editingData.item : row.item, { padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' })}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.item}
                        onChange={(e) => setEditingData({ ...editingData, item: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.item}
                  </td>
                  <td style={getFreeInputCellStyle('manufacturer', editingRow === row.id && editingData ? editingData.manufacturer : row.manufacturer, { padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' })}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.manufacturer}
                        onChange={(e) => setEditingData({ ...editingData, manufacturer: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.manufacturer}
                  </td>
                  <td style={getFreeInputCellStyle('model', editingRow === row.id && editingData ? editingData.model : row.model, { padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' })}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.model}
                        onChange={(e) => setEditingData({ ...editingData, model: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.model}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.width}
                        onChange={(e) => setEditingData({ ...editingData, width: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.width}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.depth}
                        onChange={(e) => setEditingData({ ...editingData, depth: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.depth}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.height}
                        onChange={(e) => setEditingData({ ...editingData, height: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.height}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.remarks}
                        onChange={(e) => setEditingData({ ...editingData, remarks: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.remarks}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', position: 'sticky', right: 0, backgroundColor: !row.masterId ? '#fff3cd' : 'white', zIndex: 1 }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {editingRow === row.id ? (
                        <>
                          <button
                            onClick={handleOpenMasterModal}
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              backgroundColor: '#fff9c4',
                              border: '1px solid #f57f17',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            マスタから選択
                          </button>
                          <button
                            onClick={handleSave}
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              backgroundColor: '#c8e6c9',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            保存
                          </button>
                          <button
                            onClick={handleCancel}
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              backgroundColor: '#ffcdd2',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            キャンセル
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(row.id)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              backgroundColor: '#e3f2fd',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleConfirm(row.id)}
                            disabled={!row.masterId}
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              backgroundColor: row.masterId ? '#c8e6c9' : '#f5f5f5',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: row.masterId ? 'pointer' : 'not-allowed',
                              opacity: row.masterId ? 1 : 0.5
                            }}
                          >
                            確定
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e0e0e0',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <button
          onClick={handleBulkConfirm}
          style={{
            padding: '12px 32px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          一括確定
        </button>
      </footer>

      {/* Asset Master Modal */}
      {isMasterModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '1200px',
            maxHeight: '90%',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>資産マスタから選択</h2>
              <button
                onClick={handleCloseMasterModal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f5f5f5',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                閉じる
              </button>
            </div>

            <div>
              <input
                type="text"
                value={masterSearchKeyword}
                onChange={(e) => setMasterSearchKeyword(e.target.value)}
                placeholder="検索キーワード（大分類、中分類、品目、メーカー、型式）"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ overflow: 'auto', flex: 1 }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>Category</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>大分類</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>中分類</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>品目</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>メーカー</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>型式</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMasters.slice(0, 50).map((master) => (
                    <tr key={master.id} style={{ backgroundColor: 'white' }}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{master.category}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{master.largeClass}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{master.mediumClass}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{master.item}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{master.maker}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{master.model}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => handleApplyMaster(master)}
                          style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          適用
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMasters.length > 50 && (
                <div style={{ textAlign: 'center', padding: '16px', color: '#666' }}>
                  表示: 上位50件 / 全{filteredMasters.length}件
                </div>
              )}
              {filteredMasters.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: '#999' }}>
                  該当する資産マスタが見つかりません
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {isPhotoModalOpen && selectedRowForPhoto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '90%',
            maxHeight: '90%',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>写真一覧</h2>
              <button
                onClick={handlePhotoModalClose}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f5f5f5',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                閉じる
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {selectedRowForPhoto.photos.map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    border: selectedPhoto === photo.id ? '3px solid #1976d2' : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setSelectedPhoto(selectedPhoto === photo.id ? null : photo.id)}
                >
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>{photo.filename}</div>
                    {selectedPhoto === photo.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`「${photo.filename}」を削除しますか?`)) {
                            handlePhotoDelete(photo.id);
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '4px 8px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedPhoto && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>拡大表示</h3>
                <img
                  src={selectedRowForPhoto.photos.find(p => p.id === selectedPhoto)?.url}
                  alt="拡大写真"
                  style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
