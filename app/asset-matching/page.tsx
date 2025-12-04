'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';

interface MatchingData {
  id: number;
  fixedAssetNo: string;
  managementDeviceNo: string;
  department: string;
  section: string;
  roomName: string;
  category: string;
  majorCategory: string;
  middleCategory: string;
  item: string;
  manufacturer: string;
  model: string;
  quantityUnit: string;
  inspectionDate: string;
  aiRecommendation: AIRecommendation;
  status: 'pending' | 'completed';
}

interface AIRecommendation {
  major: string;
  middle: string;
  item: string;
  manufacturer: string;
  model: string;
}

export default function AssetMatchingPage() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const [selectedAll, setSelectedAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<MatchingData | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  const sampleData: MatchingData[] = [
    {
      id: 1,
      fixedAssetNo: 'FA-2023-001',
      managementDeviceNo: 'MD-001-2023',
      department: '放射線科',
      section: 'X線撮影室',
      roomName: '一般撮影室',
      category: '医療機器',
      majorCategory: '',
      middleCategory: '',
      item: '',
      manufacturer: 'シーメンスヘルスケア',
      model: 'MAGNETOM Vida 3T',
      quantityUnit: '1台',
      inspectionDate: '2023-03-15',
      aiRecommendation: {
        major: '医療機器',
        middle: '画像診断装置',
        item: 'MRI装置',
        manufacturer: 'シーメンスヘルスケア',
        model: 'MAGNETOM Vida 3T'
      },
      status: 'pending'
    },
    {
      id: 2,
      fixedAssetNo: 'FA-2023-002',
      managementDeviceNo: 'MD-002-2023',
      department: '放射線科',
      section: 'CT室',
      roomName: 'CT1号機室',
      category: '医療機器',
      majorCategory: '',
      middleCategory: '',
      item: '',
      manufacturer: 'GEヘルスケア',
      model: 'Revolution CT',
      quantityUnit: '1台',
      inspectionDate: '2023-05-20',
      aiRecommendation: {
        major: '医療機器',
        middle: '画像診断装置',
        item: 'CT装置',
        manufacturer: 'GEヘルスケア',
        model: 'Revolution CT'
      },
      status: 'pending'
    },
    {
      id: 3,
      fixedAssetNo: 'FA-2023-003',
      managementDeviceNo: 'MD-003-2023',
      department: '手術部',
      section: '中央手術室',
      roomName: '手術室1',
      category: '医療機器',
      majorCategory: '',
      middleCategory: '',
      item: '',
      manufacturer: 'ドレーゲル',
      model: 'Savina 300',
      quantityUnit: '1台',
      inspectionDate: '2023-02-10',
      aiRecommendation: {
        major: '医療機器',
        middle: '生命維持装置',
        item: '人工呼吸器',
        manufacturer: 'ドレーゲル',
        model: 'Savina 300'
      },
      status: 'pending'
    },
    {
      id: 4,
      fixedAssetNo: 'FA-2023-004',
      managementDeviceNo: 'MD-004-2023',
      department: '検査科',
      section: '検体検査室',
      roomName: '生化学検査室',
      category: '医療機器',
      majorCategory: '',
      middleCategory: '',
      item: '',
      manufacturer: 'シスメックス',
      model: 'XN-3000',
      quantityUnit: '1台',
      inspectionDate: '2023-01-20',
      aiRecommendation: {
        major: '医療機器',
        middle: '検査装置',
        item: '自動血球計数器',
        manufacturer: 'シスメックス',
        model: 'XN-3000'
      },
      status: 'completed'
    },
    {
      id: 5,
      fixedAssetNo: 'FA-2023-005',
      managementDeviceNo: 'MD-005-2023',
      department: '内科',
      section: '循環器内科',
      roomName: '外来診察室',
      category: '医療機器',
      majorCategory: '',
      middleCategory: '',
      item: '',
      manufacturer: 'フクダ電子',
      model: 'FCP-8800',
      quantityUnit: '1台',
      inspectionDate: '2023-04-12',
      aiRecommendation: {
        major: '医療機器',
        middle: '生体検査装置',
        item: '心電計',
        manufacturer: 'フクダ電子',
        model: 'FCP-8800'
      },
      status: 'pending'
    },
    {
      id: 6,
      fixedAssetNo: 'FA-2023-006',
      managementDeviceNo: 'MD-006-2023',
      department: '手術部',
      section: 'ICU',
      roomName: 'ICU-1',
      category: '医療機器',
      majorCategory: '',
      middleCategory: '',
      item: '',
      manufacturer: 'フィリップス',
      model: 'IntelliVue MX800',
      quantityUnit: '1台',
      inspectionDate: '2023-06-05',
      aiRecommendation: {
        major: '医療機器',
        middle: '生命維持装置',
        item: '患者モニタ',
        manufacturer: 'フィリップス',
        model: 'IntelliVue MX800'
      },
      status: 'pending'
    },
    {
      id: 7,
      fixedAssetNo: 'FA-2023-007',
      managementDeviceNo: 'MD-007-2023',
      department: '外科',
      section: '一般外科',
      roomName: '内視鏡室',
      category: '医療機器',
      majorCategory: '',
      middleCategory: '',
      item: '',
      manufacturer: 'オリンパス',
      model: 'CV-290',
      quantityUnit: '1台',
      inspectionDate: '2023-07-18',
      aiRecommendation: {
        major: '医療機器',
        middle: '処置用機器',
        item: '内視鏡ビデオシステム',
        manufacturer: 'オリンパス',
        model: 'CV-290'
      },
      status: 'pending'
    },
    {
      id: 8,
      fixedAssetNo: 'FA-2023-008',
      managementDeviceNo: 'MD-008-2023',
      department: '放射線科',
      section: 'MRI室',
      roomName: 'MRI操作室',
      category: '医療機器',
      majorCategory: '',
      middleCategory: '',
      item: '',
      manufacturer: 'キヤノンメディカル',
      model: 'Vantage Galan 3T',
      quantityUnit: '1台',
      inspectionDate: '2023-08-22',
      aiRecommendation: {
        major: '医療機器',
        middle: '画像診断装置',
        item: 'MRI装置',
        manufacturer: 'キヤノンメディカル',
        model: 'Vantage Galan 3T'
      },
      status: 'pending'
    },
    {
      id: 9,
      fixedAssetNo: 'FA-2023-009',
      managementDeviceNo: 'MD-009-2023',
      department: '薬剤部',
      section: '調剤室',
      roomName: '無菌調剤室',
      category: '医療機器',
      majorCategory: '',
      middleCategory: '',
      item: '',
      manufacturer: 'トーショー',
      model: 'TPN-001',
      quantityUnit: '1台',
      inspectionDate: '2023-09-10',
      aiRecommendation: {
        major: '医療機器',
        middle: '調剤用機器',
        item: '自動調剤装置',
        manufacturer: 'トーショー',
        model: 'TPN-001'
      },
      status: 'completed'
    },
    {
      id: 10,
      fixedAssetNo: 'FA-2023-010',
      managementDeviceNo: 'MD-010-2023',
      department: '検査科',
      section: '生理検査室',
      roomName: '超音波検査室',
      category: '医療機器',
      majorCategory: '',
      middleCategory: '',
      item: '',
      manufacturer: 'GEヘルスケア',
      model: 'LOGIQ E10',
      quantityUnit: '1台',
      inspectionDate: '2023-10-05',
      aiRecommendation: {
        major: '医療機器',
        middle: '画像診断装置',
        item: '超音波診断装置',
        manufacturer: 'GEヘルスケア',
        model: 'LOGIQ E10'
      },
      status: 'pending'
    }
  ];

  const [data, setData] = useState(sampleData);

  const handleBack = () => {
    router.back();
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedAll(checked);
    const filteredData = filterStatus === 'all' ? data : data.filter(d => d.status === filterStatus);
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
  };

  const toggleEditMode = (id: number) => {
    if (editingRow === id) {
      setEditingRow(null);
      setEditingData(null);
    } else {
      const row = data.find(r => r.id === id);
      if (row) {
        setEditingRow(id);
        setEditingData({ ...row });
      }
    }
  };

  const handleApplyAIRecommendation = () => {
    if (!editingData) return;

    setEditingData({
      ...editingData,
      majorCategory: editingData.aiRecommendation.major,
      middleCategory: editingData.aiRecommendation.middle,
      item: editingData.aiRecommendation.item
    });
  };

  const handleOpenAssetMaster = () => {
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      '/asset-master',
      'AssetMasterWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  const saveEdit = () => {
    if (!editingData) return;

    setData(data.map(row =>
      row.id === editingData.id ? editingData : row
    ));
    setEditingRow(null);
    setEditingData(null);
  };

  // 資産マスタからのメッセージを受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // セキュリティチェック: 同じオリジンからのメッセージのみ受け入れる
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'ASSET_SELECTED' && editingData) {
        const assetMasters = event.data.assets as any[];

        // 最初の資産を適用
        if (assetMasters.length > 0) {
          const master = assetMasters[0];
          setEditingData({
            ...editingData,
            majorCategory: master.largeClass,
            middleCategory: master.mediumClass,
            item: master.item
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [editingData]);

  const confirmRow = (id: number) => {
    const row = data.find(r => r.id === id);
    if (!row) return;

    if (confirm(`No.${id} のレコードを確定しますか？\n確定後、このレコードは画面から削除されます。`)) {
      setData(data.filter(r => r.id !== id));
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const bulkConfirmSelected = () => {
    if (selectedRows.size === 0) {
      alert('確定する項目を選択してください');
      return;
    }

    if (confirm(`選択した${selectedRows.size}件のレコードを一括確定しますか？\n確定後、これらのレコードは画面から削除されます。`)) {
      setData(data.filter(row => !selectedRows.has(row.id)));
      setSelectedRows(new Set());
      setSelectedAll(false);
    }
  };

  const completeMatching = () => {
    if (data.length > 0) {
      if (confirm(`未確定の項目が${data.length}件あります。このまま完了しますか？`)) {
        router.push('/main');
      }
    } else {
      alert('突き合わせが完了しました');
      router.push('/main');
    }
  };

  const filteredData = filterStatus === 'all' ? data : data.filter(d => d.status === filterStatus);
  const totalCount = sampleData.length;
  const remainingCount = data.length;

  if (isMobile) {
    return (
      <div style={{ padding: '16px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <div style={{ marginBottom: '16px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
          資産台帳とマスタの突き合わせ
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
        padding: '16px 24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1800px',
          margin: '0 auto'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
            資産台帳とマスタの突き合わせ
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', color: '#5a6c7d', fontWeight: '600' }}>全体:</span>
            <span style={{ fontSize: '14px', color: '#2c3e50' }}>{totalCount}件</span>
            <span style={{ color: '#ccc' }}>|</span>
            <span style={{ fontSize: '14px', color: '#5a6c7d', fontWeight: '600' }}>残り:</span>
            <span style={{ fontSize: '14px', color: '#ff9800', fontWeight: '600' }}>{remainingCount}件</span>
            <span style={{ color: '#ccc' }}>|</span>
            <span style={{ fontSize: '14px', color: '#5a6c7d', fontWeight: '600' }}>完了:</span>
            <span style={{ fontSize: '14px', color: '#4caf50', fontWeight: '600' }}>{totalCount - remainingCount}件</span>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        padding: '12px 24px'
      }}>
        <div style={{
          maxWidth: '1800px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setFilterStatus('all')}
              style={{
                padding: '8px 16px',
                backgroundColor: filterStatus === 'all' ? '#1976d2' : '#f5f5f5',
                color: filterStatus === 'all' ? 'white' : '#5a6c7d',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              すべて <span>({data.length})</span>
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              style={{
                padding: '8px 16px',
                backgroundColor: filterStatus === 'pending' ? '#1976d2' : '#f5f5f5',
                color: filterStatus === 'pending' ? 'white' : '#5a6c7d',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              未処理 <span>({data.filter(d => d.status === 'pending').length})</span>
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              style={{
                padding: '8px 16px',
                backgroundColor: filterStatus === 'completed' ? '#1976d2' : '#f5f5f5',
                color: filterStatus === 'completed' ? 'white' : '#5a6c7d',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              済 <span>({data.filter(d => d.status === 'completed').length})</span>
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={bulkConfirmSelected}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>✓</span> 選択項目を一括確定
            </button>
            <button
              onClick={handleOpenAssetMaster}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>📋</span> 資産マスタを別ウィンドウで開く
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '24px' }}>
        <div style={{ maxWidth: '1800px', margin: '0 auto' }}>
          <input
            type="text"
            placeholder="資産番号、品名で検索..."
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              marginBottom: '16px',
              boxSizing: 'border-box'
            }}
          />

          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th rowSpan={2} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', position: 'sticky', left: 0, backgroundColor: '#f5f5f5', zIndex: 3 }}>
                    <input
                      type="checkbox"
                      checked={selectedAll}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th rowSpan={2} style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>No.</th>
                  <th colSpan={13} style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#e3f2fd', fontWeight: '600' }}>固定資産台帳データ</th>
                  <th colSpan={5} style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#fff3e0', fontWeight: '600' }}>AI推薦</th>
                  <th colSpan={2} style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0', position: 'sticky', right: 0, backgroundColor: '#f5f5f5', zIndex: 3 }}>操作</th>
                </tr>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  {/* 固定資産台帳 */}
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>固定資産番号</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>管理機器番号</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>部門名</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>部署名（設置部署）</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>諸室名称</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>category</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px', minWidth: '120px' }}>大分類</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px', minWidth: '120px' }}>中分類</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px', minWidth: '150px' }}>品目</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>メーカー</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>型式</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>数量／単位</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>検収日</th>
                  {/* AI推薦 */}
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px', minWidth: '120px' }}>大分類</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px', minWidth: '120px' }}>中分類</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px', minWidth: '150px' }}>品目</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>メーカー</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>型式</th>
                  {/* 操作 */}
                  <th style={{ padding: '8px 4px', borderBottom: '2px solid #e0e0e0', fontSize: '11px', position: 'sticky', right: 60, backgroundColor: '#f5f5f5', zIndex: 2, minWidth: '60px', textAlign: 'center' }}>編集</th>
                  <th style={{ padding: '8px 4px', borderBottom: '2px solid #e0e0e0', fontSize: '11px', position: 'sticky', right: 0, backgroundColor: '#f5f5f5', zIndex: 2, minWidth: '60px', textAlign: 'center' }}>確定</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => {
                  const isEditing = editingRow === row.id;
                  const displayRow = isEditing && editingData ? editingData : row;

                  return (
                    <React.Fragment key={row.id}>
                      <tr style={{ backgroundColor: 'white' }}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 1 }}>
                          <input
                            type="checkbox"
                            checked={selectedRows.has(row.id)}
                            onChange={() => toggleRowSelection(row.id)}
                          />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{index + 1}</td>
                        {/* 固定資産台帳データ */}
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{displayRow.fixedAssetNo}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{displayRow.managementDeviceNo}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{displayRow.department}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{displayRow.section}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{displayRow.roomName}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{displayRow.category}</td>

                        {/* 編集可能フィールド: 大分類 */}
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', minWidth: '120px', backgroundColor: isEditing ? '#fffde7' : 'white' }}>
                          {isEditing && editingData ? (
                            <input
                              type="text"
                              value={editingData.majorCategory}
                              onChange={(e) => setEditingData({ ...editingData, majorCategory: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '4px',
                                fontSize: '12px',
                                border: '1px solid #ccc',
                                borderRadius: '2px'
                              }}
                            />
                          ) : (
                            displayRow.majorCategory
                          )}
                        </td>

                        {/* 編集可能フィールド: 中分類 */}
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', minWidth: '120px', backgroundColor: isEditing ? '#fffde7' : 'white' }}>
                          {isEditing && editingData ? (
                            <input
                              type="text"
                              value={editingData.middleCategory}
                              onChange={(e) => setEditingData({ ...editingData, middleCategory: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '4px',
                                fontSize: '12px',
                                border: '1px solid #ccc',
                                borderRadius: '2px'
                              }}
                            />
                          ) : (
                            displayRow.middleCategory
                          )}
                        </td>

                        {/* 編集可能フィールド: 品目 */}
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', minWidth: '150px', backgroundColor: isEditing ? '#fffde7' : 'white' }}>
                          {isEditing && editingData ? (
                            <input
                              type="text"
                              value={editingData.item}
                              onChange={(e) => setEditingData({ ...editingData, item: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '4px',
                                fontSize: '12px',
                                border: '1px solid #ccc',
                                borderRadius: '2px'
                              }}
                            />
                          ) : (
                            displayRow.item
                          )}
                        </td>

                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{displayRow.manufacturer}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{displayRow.model}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{displayRow.quantityUnit}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{displayRow.inspectionDate}</td>

                        {/* AI推薦 */}
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#fff8e1', minWidth: '120px' }}>{displayRow.aiRecommendation.major}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#fff8e1', minWidth: '120px' }}>{displayRow.aiRecommendation.middle}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#fff8e1', minWidth: '150px' }}>{displayRow.aiRecommendation.item}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#fff8e1' }}>{displayRow.aiRecommendation.manufacturer}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#fff8e1' }}>{displayRow.aiRecommendation.model}</td>

                        {/* 操作 */}
                        <td style={{ padding: '8px 4px', borderBottom: '1px solid #e0e0e0', position: 'sticky', right: 60, backgroundColor: 'white', zIndex: 1, minWidth: '60px', textAlign: 'center' }}>
                          {isEditing ? (
                            <button
                              onClick={() => toggleEditMode(row.id)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                backgroundColor: '#f5f5f5',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              キャンセル
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleEditMode(row.id)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                backgroundColor: '#e3f2fd',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              編集
                            </button>
                          )}
                        </td>
                        <td style={{ padding: '8px 4px', borderBottom: '1px solid #e0e0e0', position: 'sticky', right: 0, backgroundColor: 'white', zIndex: 1, minWidth: '60px', textAlign: 'center' }}>
                          {isEditing ? (
                            <button
                              onClick={saveEdit}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                backgroundColor: '#1976d2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontWeight: '600'
                              }}
                            >
                              保存
                            </button>
                          ) : (
                            <button
                              onClick={() => confirmRow(row.id)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                backgroundColor: '#c8e6c9',
                                color: '#2e7d32',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontWeight: '600'
                              }}
                            >
                              確定
                            </button>
                          )}
                        </td>
                      </tr>
                      {isEditing && (
                        <tr style={{ backgroundColor: '#f9fbe7' }}>
                          <td colSpan={21} style={{ padding: '12px', borderBottom: '2px solid #e0e0e0' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
                              <button
                                onClick={handleApplyAIRecommendation}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: '#fff3e0',
                                  border: '1px solid #ff9800',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#e65100',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                              >
                                <span>🤖</span> AI推薦を適用
                              </button>
                              <button
                                onClick={handleOpenAssetMaster}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: '#e3f2fd',
                                  border: '1px solid #1976d2',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#0d47a1',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                              >
                                <span>📋</span> 資産マスタから選択
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            marginTop: '16px'
          }}>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              ← 前へ
            </button>
            <span style={{ fontSize: '14px', color: '#5a6c7d' }}>
              1 - {filteredData.length} / {filteredData.length}
            </span>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              次へ →
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e0e0e0',
        padding: '16px 24px',
        position: 'sticky',
        bottom: 0
      }}>
        <div style={{
          maxWidth: '1800px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={handleBack}
            style={{
              padding: '12px 32px',
              backgroundColor: '#ffffff',
              border: '1px solid #ccc',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>←</span> 戻る
          </button>
          <button
            onClick={completeMatching}
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
            突き合わせ完了
          </button>
        </div>
      </footer>
    </div>
  );
}
