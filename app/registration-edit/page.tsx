'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  serialNo: string;
  quantity: number;
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
  const [modalPosition, setModalPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  // ソート状態
  type SortKey = keyof RegistrationData | null;
  type SortDirection = 'asc' | 'desc';
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // ソートハンドラ
  const handleSort = (key: keyof RegistrationData) => {
    if (sortKey === key) {
      // 同じカラムをクリックした場合は方向を切り替え
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 新しいカラムをクリックした場合は昇順でソート
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // ソートアイコン表示
  const getSortIcon = (key: keyof RegistrationData) => {
    if (sortKey !== key) return ' ↕';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

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
      serialNo: 'SN-001234',
      quantity: 1,
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
      serialNo: '',
      quantity: 1,
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
      serialNo: 'SN-003456',
      quantity: 1,
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
      serialNo: 'SN-004567',
      quantity: 2,
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
      serialNo: 'SN-005678',
      quantity: 1,
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
      serialNo: '',
      quantity: 1,
      purchaseDate: '',
      lease: 'なし',
      rental: 'なし',
      photoCount: 2,
      photos: [
        { id: '6-1', url: 'https://placehold.co/800x600/fff9c4/f57f17?text=Photo+1', filename: '血球計数器本体.jpg' },
        { id: '6-2', url: 'https://placehold.co/800x600/fff9c4/f57f17?text=Photo+2', filename: '型式プレート.jpg' }
      ],
      largeClass: '検査装置',
      mediumClass: '血液検査装置',
      item: '自動血球計数器 XYZ-2000',
      manufacturer: 'ABC医療機器',
      model: 'XYZ-2000-Pro',
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
      serialNo: 'SN-007890',
      quantity: 3,
      purchaseDate: '2023-03-20',
      lease: 'なし',
      rental: 'なし',
      photoCount: 1,
      photos: [
        { id: '7-1', url: 'https://placehold.co/800x600/e1f5fe/0277bd?text=Photo+1', filename: 'スチール書庫.jpg' }
      ],
      largeClass: 'オフィス家具',
      mediumClass: '書庫',
      item: 'スチール書庫 H1800',
      manufacturer: 'コクヨ',
      model: 'S-D36F1N',
      width: '900',
      depth: '400',
      height: '1800',
      remarks: '',
      masterId: ''
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

    // ソート処理
    if (sortKey) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];

        // null/undefined チェック
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
        if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

        // 数値の場合
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // 文字列の場合
        const aStr = String(aValue);
        const bStr = String(bValue);
        const comparison = aStr.localeCompare(bStr, 'ja');
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, filters, sortKey, sortDirection]);

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

  // マスタに存在するかチェックする関数（masterId が設定されている場合はマスタ登録済みとみなす）
  const isInMaster = (field: 'largeClass' | 'mediumClass' | 'item' | 'manufacturer' | 'model', value: string, masterId: string): boolean => {
    if (!value) return true; // 空の場合は通常表示
    if (masterId) return true; // masterId が設定されている場合はマスタ登録済み

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
  const getFreeInputCellStyle = (field: 'largeClass' | 'mediumClass' | 'item' | 'manufacturer' | 'model', value: string, masterId: string, baseStyle: React.CSSProperties): React.CSSProperties => {
    const isFreeInput = !isInMaster(field, value, masterId);
    return {
      ...baseStyle,
      backgroundColor: isFreeInput ? '#fff9c4' : (baseStyle.backgroundColor || 'white')
    };
  };

  const handleBack = () => {
    router.push('/main');
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
    setModalPosition({ x: 100, y: 100 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - modalPosition.x,
      y: e.clientY - modalPosition.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setModalPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart.x, dragStart.y]);

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

  const handleOpenAssetMaster = () => {
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    // GitHub Pages対応: basePathを付与
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    window.open(
      `${basePath}/asset-master`,
      'AssetMasterWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  // 資産マスタからのメッセージを受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // セキュリティチェック: 同じオリジンからのメッセージのみ受け入れる
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'ASSET_SELECTED' && editingData) {
        const assetMasters = event.data.assets as any[];
        const scope = event.data.scope as 'all' | 'toMaker' | 'toItem';

        // 最初の資産を適用
        if (assetMasters.length > 0) {
          const master = assetMasters[0];

          // スコープに応じて適用するフィールドを決定
          // 範囲外のフィールドは空白にする
          let updatedData: typeof editingData;

          switch (scope) {
            case 'toItem':
              // 品目まで確定: Category, 大分類, 中分類, 個体管理品目
              // メーカー、型式は空白にする
              updatedData = {
                ...editingData,
                category: master.category || editingData.category,
                largeClass: master.largeClass || editingData.largeClass,
                mediumClass: master.mediumClass || editingData.mediumClass,
                item: master.item || editingData.item,
                manufacturer: '',  // 範囲外なので空白
                model: '',         // 範囲外なので空白
                masterId: master.id
              };
              break;
            case 'toMaker':
              // メーカーまで確定: Category, 大分類, 中分類, 個体管理品目, メーカー
              // 型式は空白にする
              updatedData = {
                ...editingData,
                category: master.category || editingData.category,
                largeClass: master.largeClass || editingData.largeClass,
                mediumClass: master.mediumClass || editingData.mediumClass,
                item: master.item || editingData.item,
                manufacturer: master.maker || editingData.manufacturer,
                model: '',         // 範囲外なので空白
                masterId: master.id
              };
              break;
            case 'all':
            default:
              // 全て確定: 全カラム
              updatedData = {
                ...editingData,
                category: master.category || editingData.category,
                largeClass: master.largeClass || editingData.largeClass,
                mediumClass: master.mediumClass || editingData.mediumClass,
                item: master.item || editingData.item,
                manufacturer: master.maker || editingData.manufacturer,
                model: master.model || editingData.model,
                masterId: master.id
              };
              break;
          }

          setEditingData(updatedData);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [editingData]);

  const handleConfirm = (id: number) => {
    const row = data.find(r => r.id === id);
    if (!row) return;

    if (!row.masterId) {
      alert('マスタIDが登録されていないため確定できません');
      return;
    }

    if (confirm(`ID: ${row.id} のレコードを確定しますか？\n確定後、このレコードは画面から削除されます。`)) {
      setData(data.filter(r => r.id !== id));
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleBulkConfirm = () => {
    if (selectedRows.size === 0) {
      alert('確定する行を選択してください');
      return;
    }
    const invalidRows = data.filter(row => selectedRows.has(row.id) && !row.masterId);
    if (invalidRows.length > 0) {
      alert(`${invalidRows.length}件のマスタ未登録行があります。先にマスタ登録を完了してください。`);
      return;
    }

    if (confirm(`選択した${selectedRows.size}件のレコードを一括確定しますか？\n確定後、これらのレコードは画面から削除されます。`)) {
      setData(data.filter(row => !selectedRows.has(row.id)));
      setSelectedRows(new Set());
      setSelectedAll(false);
    }
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
          メイン画面に戻る
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
          メイン画面に戻る
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
                <th onClick={() => handleSort('sealNo')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>QRコード{getSortIcon('sealNo')}</th>
                <th onClick={() => handleSort('floor')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>階{getSortIcon('floor')}</th>
                <th onClick={() => handleSort('department')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>部門{getSortIcon('department')}</th>
                <th onClick={() => handleSort('section')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>部署{getSortIcon('section')}</th>
                <th onClick={() => handleSort('roomName')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>室名{getSortIcon('roomName')}</th>
                <th onClick={() => handleSort('category')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>Category{getSortIcon('category')}</th>
                <th onClick={() => handleSort('largeClass')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>大分類{getSortIcon('largeClass')}</th>
                <th onClick={() => handleSort('mediumClass')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>中分類{getSortIcon('mediumClass')}</th>
                <th onClick={() => handleSort('item')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>個体管理品目{getSortIcon('item')}</th>
                <th onClick={() => handleSort('manufacturer')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>メーカー{getSortIcon('manufacturer')}</th>
                <th onClick={() => handleSort('model')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>型式{getSortIcon('model')}</th>
                <th onClick={() => handleSort('quantity')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>数量{getSortIcon('quantity')}</th>
                <th onClick={() => handleSort('width')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>W{getSortIcon('width')}</th>
                <th onClick={() => handleSort('depth')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>D{getSortIcon('depth')}</th>
                <th onClick={() => handleSort('height')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>H{getSortIcon('height')}</th>
                <th onClick={() => handleSort('assetNo')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>資産番号{getSortIcon('assetNo')}</th>
                <th onClick={() => handleSort('equipmentNo')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>ME番号{getSortIcon('equipmentNo')}</th>
                <th onClick={() => handleSort('serialNo')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>シリアルNo{getSortIcon('serialNo')}</th>
                <th onClick={() => handleSort('purchaseDate')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>購入年月日{getSortIcon('purchaseDate')}</th>
                <th onClick={() => handleSort('remarks')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>備考{getSortIcon('remarks')}</th>
                <th onClick={() => handleSort('lease')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>リース・借用{getSortIcon('lease')}</th>
                <th onClick={() => handleSort('surveyDate')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>調査日付{getSortIcon('surveyDate')}</th>
                <th onClick={() => handleSort('surveyor')} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>担当者{getSortIcon('surveyor')}</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>写真</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>操作</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={selectedAll}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <tr key={row.id}>
                  {/* ① QRコード */}
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.sealNo}</td>
                  {/* ② 階 */}
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.floor}</td>
                  {/* ③ 部門 */}
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.department}</td>
                  {/* ④ 部署 */}
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.section}</td>
                  {/* ⑤ 室名 */}
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.roomName}</td>
                  {/* ⑥ Category */}
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.category}</td>
                  {/* ⑥ 大分類 */}
                  <td style={getFreeInputCellStyle('largeClass', editingRow === row.id && editingData ? editingData.largeClass : row.largeClass, row.masterId, { padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' })}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.largeClass || ''}
                        onChange={(e) => setEditingData({ ...editingData, largeClass: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.largeClass}
                  </td>
                  {/* ⑥ 中分類 */}
                  <td style={getFreeInputCellStyle('mediumClass', editingRow === row.id && editingData ? editingData.mediumClass : row.mediumClass, row.masterId, { padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' })}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.mediumClass || ''}
                        onChange={(e) => setEditingData({ ...editingData, mediumClass: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.mediumClass}
                  </td>
                  {/* ⑥ 個体管理品目 */}
                  <td style={getFreeInputCellStyle('item', editingRow === row.id && editingData ? editingData.item : row.item, row.masterId, { padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' })}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.item || ''}
                        onChange={(e) => setEditingData({ ...editingData, item: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.item}
                  </td>
                  {/* ⑦ メーカー */}
                  <td style={getFreeInputCellStyle('manufacturer', editingRow === row.id && editingData ? editingData.manufacturer : row.manufacturer, row.masterId, { padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' })}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.manufacturer || ''}
                        onChange={(e) => setEditingData({ ...editingData, manufacturer: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.manufacturer}
                  </td>
                  {/* ⑧ 型式 */}
                  <td style={getFreeInputCellStyle('model', editingRow === row.id && editingData ? editingData.model : row.model, row.masterId, { padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' })}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.model || ''}
                        onChange={(e) => setEditingData({ ...editingData, model: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.model}
                  </td>
                  {/* ⑨ 数量 */}
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="number"
                        value={editingData.quantity}
                        onChange={(e) => setEditingData({ ...editingData, quantity: parseInt(e.target.value) || 0 })}
                        style={{ width: '60px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.quantity}
                  </td>
                  {/* ⑩ W */}
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.width || ''}
                        onChange={(e) => setEditingData({ ...editingData, width: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.width}
                  </td>
                  {/* ⑩ D */}
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.depth || ''}
                        onChange={(e) => setEditingData({ ...editingData, depth: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.depth}
                  </td>
                  {/* ⑩ H */}
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.height || ''}
                        onChange={(e) => setEditingData({ ...editingData, height: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.height}
                  </td>
                  {/* ⑪ 資産番号 */}
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.assetNo || ''}
                        onChange={(e) => setEditingData({ ...editingData, assetNo: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.assetNo}
                  </td>
                  {/* ⑫ ME番号 */}
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.equipmentNo || ''}
                        onChange={(e) => setEditingData({ ...editingData, equipmentNo: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.equipmentNo}
                  </td>
                  {/* ⑬ シリアルNo */}
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.serialNo || ''}
                        onChange={(e) => setEditingData({ ...editingData, serialNo: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.serialNo}
                  </td>
                  {/* ⑭ 購入年月日 */}
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="date"
                        value={editingData.purchaseDate || ''}
                        onChange={(e) => setEditingData({ ...editingData, purchaseDate: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.purchaseDate}
                  </td>
                  {/* ⑭ 備考 */}
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    {editingRow === row.id && editingData ? (
                      <input
                        type="text"
                        value={editingData.remarks || ''}
                        onChange={(e) => setEditingData({ ...editingData, remarks: e.target.value })}
                        style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    ) : row.remarks}
                  </td>
                  {/* ⑮ リース・借用 */}
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
                  {/* ⑯ 調査日付 */}
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.surveyDate}</td>
                  {/* ⑰ 担当者 */}
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.surveyor}</td>
                  {/* 写真 */}
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
                      {row.photoCount}枚
                    </button>
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {editingRow === row.id ? (
                        <>
                          <button
                            onClick={handleOpenAssetMaster}
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              backgroundColor: '#27ae60',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            資産マスタを別ウィンドウで開く
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
                  {/* チェックボックス */}
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={() => toggleRowSelection(row.id)}
                    />
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

      {/* Photo Modal */}
      {isPhotoModalOpen && selectedRowForPhoto && (
        <div style={{
          position: 'fixed',
          top: modalPosition.y,
          left: modalPosition.x,
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '0',
          width: '600px',
          maxHeight: '80vh',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000
        }}>
          <div
            onMouseDown={handleMouseDown}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderBottom: '1px solid #e0e0e0',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              backgroundColor: '#f5f5f5',
              borderRadius: '12px 12px 0 0'
            }}
          >
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>📷 写真一覧</h2>
            <button
              onClick={handlePhotoModalClose}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: '6px 12px',
                backgroundColor: '#ffffff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ padding: '20px', overflow: 'auto', flex: 1 }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
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
                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
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
                  style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
