'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';

interface MatchingData {
  id: number;
  assetNo: string;
  productName: string;
  manufacturer: string;
  model: string;
  majorCategory: string;
  middleCategory: string;
  itemManagement: string;
  ai1: AIRecommendation;
  ai2: AIRecommendation;
  ai3: AIRecommendation;
  selectedAI: number;
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  const sampleData: MatchingData[] = [
    {
      id: 1,
      assetNo: 'A-001-2023',
      productName: 'MRI装置 シーメンス MAGNETOM',
      manufacturer: 'シーメンスヘルスケア',
      model: 'MAGNETOM Vida 3T',
      majorCategory: '',
      middleCategory: '',
      itemManagement: '',
      ai1: {
        major: '医療機器',
        middle: '画像診断装置',
        item: 'MRI装置',
        manufacturer: 'シーメンスヘルスケア',
        model: 'MAGNETOM Vida 3T'
      },
      ai2: {
        major: '医療機器',
        middle: '画像診断装置',
        item: 'MRI装置（汎用）',
        manufacturer: 'シーメンス',
        model: 'MAGNETOMシリーズ'
      },
      ai3: {
        major: '医療機器',
        middle: '診断機器',
        item: '磁気共鳴画像診断装置',
        manufacturer: 'その他',
        model: '不明'
      },
      selectedAI: 1,
      status: 'pending'
    },
    {
      id: 2,
      assetNo: 'A-002-2023',
      productName: 'CT装置 GE Healthcare Revolution',
      manufacturer: 'GEヘルスケア',
      model: 'Revolution CT',
      majorCategory: '',
      middleCategory: '',
      itemManagement: '',
      ai1: {
        major: '医療機器',
        middle: '画像診断装置',
        item: 'CT装置',
        manufacturer: 'GEヘルスケア',
        model: 'Revolution CT'
      },
      ai2: {
        major: '医療機器',
        middle: '画像診断装置',
        item: 'CT装置（汎用）',
        manufacturer: 'GE',
        model: 'Revolution シリーズ'
      },
      ai3: {
        major: '医療機器',
        middle: '診断機器',
        item: 'コンピュータ断層撮影装置',
        manufacturer: 'その他',
        model: '不明'
      },
      selectedAI: 1,
      status: 'pending'
    },
    {
      id: 3,
      assetNo: 'A-003-2023',
      productName: '人工呼吸器 ドレーゲル Savina',
      manufacturer: 'ドレーゲル',
      model: 'Savina 300',
      majorCategory: '',
      middleCategory: '',
      itemManagement: '',
      ai1: {
        major: '医療機器',
        middle: '生命維持装置',
        item: '人工呼吸器',
        manufacturer: 'ドレーゲル',
        model: 'Savina 300'
      },
      ai2: {
        major: '医療機器',
        middle: '生命維持装置',
        item: '人工呼吸器（汎用）',
        manufacturer: 'ドレーゲル',
        model: 'Savinaシリーズ'
      },
      ai3: {
        major: '医療機器',
        middle: '呼吸器系装置',
        item: '呼吸補助装置',
        manufacturer: 'その他',
        model: '不明'
      },
      selectedAI: 1,
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

  const handleAISelection = (rowId: number, aiIndex: number) => {
    setData(data.map(row =>
      row.id === rowId ? { ...row, selectedAI: aiIndex } : row
    ));
  };

  const toggleEditMode = (id: number) => {
    setEditingRow(editingRow === id ? null : id);
  };

  const confirmRow = (id: number) => {
    setData(data.map(row =>
      row.id === id ? { ...row, status: 'completed' } : row
    ));
    alert(`行 ${id} を確定しました`);
  };

  const bulkConfirmSelected = () => {
    if (selectedRows.size === 0) {
      alert('確定する項目を選択してください');
      return;
    }
    setData(data.map(row =>
      selectedRows.has(row.id) ? { ...row, status: 'completed' } : row
    ));
    alert(`${selectedRows.size}件を一括確定しました`);
    setSelectedRows(new Set());
    setSelectedAll(false);
  };

  const openAssetMasterWindow = () => {
    alert('資産マスタを別ウィンドウで開きます');
  };

  const completeMatching = () => {
    const pendingCount = data.filter(d => d.status === 'pending').length;
    if (pendingCount > 0) {
      if (confirm(`未処理の項目が${pendingCount}件あります。このまま完了しますか？`)) {
        router.push('/main');
      }
    } else {
      alert('突き合わせが完了しました');
      router.push('/main');
    }
  };

  const filteredData = filterStatus === 'all' ? data : data.filter(d => d.status === filterStatus);
  const completedCount = data.filter(d => d.status === 'completed').length;

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
            <span style={{ fontSize: '14px', color: '#5a6c7d', fontWeight: '600' }}>進捗:</span>
            <span style={{ fontSize: '14px', color: '#2c3e50' }}>{completedCount} / {data.length}</span>
            <span style={{ color: '#ccc' }}>|</span>
            <span style={{ fontSize: '14px', color: '#5a6c7d', fontWeight: '600' }}>完了:</span>
            <span style={{ fontSize: '14px', color: '#4caf50', fontWeight: '600' }}>{completedCount}件</span>
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
              済 <span>({completedCount})</span>
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
              onClick={openAssetMasterWindow}
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
                  <th colSpan={7} style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#e3f2fd', fontWeight: '600' }}>固定資産台帳データ</th>
                  <th colSpan={6} style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#fff3e0', fontWeight: '600' }}>AI推薦1</th>
                  <th colSpan={6} style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#fce4ec', fontWeight: '600' }}>AI推薦2</th>
                  <th colSpan={6} style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f3e5f5', fontWeight: '600' }}>AI推薦3</th>
                  <th colSpan={2} style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0', position: 'sticky', right: 0, backgroundColor: '#f5f5f5', zIndex: 3 }}>操作</th>
                </tr>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  {/* 固定資産台帳 */}
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>資産番号</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>登録品目名</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>メーカー名</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>型式</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>大分類</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>中分類</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>個体管理品目</th>
                  {/* AI推薦1 */}
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', fontSize: '11px' }}>選択</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>大分類</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>中分類</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>個体管理品目</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>メーカー名</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>型式</th>
                  {/* AI推薦2 */}
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', fontSize: '11px' }}>選択</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>大分類</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>中分類</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>個体管理品目</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>メーカー名</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>型式</th>
                  {/* AI推薦3 */}
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', fontSize: '11px' }}>選択</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>大分類</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>中分類</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>個体管理品目</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>メーカー名</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap', fontSize: '11px' }}>型式</th>
                  {/* 操作 */}
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', fontSize: '11px', position: 'sticky', right: 80, backgroundColor: '#f5f5f5', zIndex: 2 }}>編集</th>
                  <th style={{ padding: '8px 6px', borderBottom: '2px solid #e0e0e0', fontSize: '11px', position: 'sticky', right: 0, backgroundColor: '#f5f5f5', zIndex: 2 }}>確定</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => (
                  <tr key={row.id} style={{ backgroundColor: row.status === 'completed' ? '#e8f5e9' : 'white' }}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', position: 'sticky', left: 0, backgroundColor: row.status === 'completed' ? '#e8f5e9' : 'white', zIndex: 1 }}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={() => toggleRowSelection(row.id)}
                      />
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{index + 1}</td>
                    {/* 固定資産台帳データ */}
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.assetNo}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.productName}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.manufacturer}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.model}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.majorCategory}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.middleCategory}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.itemManagement}</td>
                    {/* AI推薦1 */}
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', backgroundColor: '#fff8e1' }}>
                      <input
                        type="radio"
                        name={`ai-${row.id}`}
                        checked={row.selectedAI === 1}
                        onChange={() => handleAISelection(row.id, 1)}
                      />
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#fff8e1' }}>{row.ai1.major}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#fff8e1' }}>{row.ai1.middle}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#fff8e1' }}>{row.ai1.item}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#fff8e1' }}>{row.ai1.manufacturer}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#fff8e1' }}>{row.ai1.model}</td>
                    {/* AI推薦2 */}
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', backgroundColor: '#fce4ec' }}>
                      <input
                        type="radio"
                        name={`ai-${row.id}`}
                        checked={row.selectedAI === 2}
                        onChange={() => handleAISelection(row.id, 2)}
                      />
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#fce4ec' }}>{row.ai2.major}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#fce4ec' }}>{row.ai2.middle}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#fce4ec' }}>{row.ai2.item}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#fce4ec' }}>{row.ai2.manufacturer}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#fce4ec' }}>{row.ai2.model}</td>
                    {/* AI推薦3 */}
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', backgroundColor: '#f3e5f5' }}>
                      <input
                        type="radio"
                        name={`ai-${row.id}`}
                        checked={row.selectedAI === 3}
                        onChange={() => handleAISelection(row.id, 3)}
                      />
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#f3e5f5' }}>{row.ai3.major}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#f3e5f5' }}>{row.ai3.middle}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#f3e5f5' }}>{row.ai3.item}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#f3e5f5' }}>{row.ai3.manufacturer}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', backgroundColor: '#f3e5f5' }}>{row.ai3.model}</td>
                    {/* 操作 */}
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', position: 'sticky', right: 80, backgroundColor: row.status === 'completed' ? '#e8f5e9' : 'white', zIndex: 1 }}>
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
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', position: 'sticky', right: 0, backgroundColor: row.status === 'completed' ? '#e8f5e9' : 'white', zIndex: 1 }}>
                      <button
                        onClick={() => confirmRow(row.id)}
                        disabled={row.status === 'completed'}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          backgroundColor: row.status === 'completed' ? '#4caf50' : '#c8e6c9',
                          color: row.status === 'completed' ? 'white' : '#2e7d32',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: row.status === 'completed' ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap',
                          fontWeight: '600'
                        }}
                      >
                        {row.status === 'completed' ? '確定済' : '確定'}
                      </button>
                    </td>
                  </tr>
                ))}
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
