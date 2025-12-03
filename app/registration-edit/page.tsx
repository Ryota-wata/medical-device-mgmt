'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';

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
  const [selectedAll, setSelectedAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editingRow, setEditingRow] = useState<number | null>(null);

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
    }
  ];

  const [data, setData] = useState(sampleData);

  const handleBack = () => {
    router.back();
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedAll(checked);
    if (checked) {
      setSelectedRows(new Set(data.map(row => row.id)));
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
    setSelectedAll(newSelected.size === data.length);
  };

  const handleEdit = (id: number) => {
    setEditingRow(editingRow === id ? null : id);
    alert(`行 ${id} の編集モードを切り替えました`);
  };

  const handleConfirm = (id: number) => {
    const row = data.find(r => r.id === id);
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
    const invalidRows = data.filter(row => selectedRows.has(row.id) && !row.masterId);
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#5a6c7d' }}>棟</label>
            <select style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <option value="">棟</option>
              <option value="本館">本館</option>
              <option value="別館">別館</option>
              <option value="新館">新館</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#5a6c7d' }}>階</label>
            <select style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <option value="">階</option>
              <option value="1F">1F</option>
              <option value="2F">2F</option>
              <option value="3F">3F</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#5a6c7d' }}>部門</label>
            <select style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <option value="">部門</option>
              <option value="手術部門">手術部門</option>
              <option value="放射線科">放射線科</option>
              <option value="検査科">検査科</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#5a6c7d' }}>部署</label>
            <select style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <option value="">部署</option>
              <option value="手術">手術</option>
              <option value="CT室">CT室</option>
              <option value="検査室">検査室</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#5a6c7d' }}>Category</label>
            <select style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <option value="">Category</option>
              <option value="医療機器">医療機器</option>
              <option value="什器備品">什器備品</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#5a6c7d' }}>大分類</label>
            <select style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <option value="">大分類</option>
              <option value="医療機器">医療機器</option>
              <option value="検査機器">検査機器</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#5a6c7d' }}>中分類</label>
            <select style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <option value="">中分類</option>
              <option value="滅菌機器">滅菌機器</option>
              <option value="内視鏡関連">内視鏡関連</option>
            </select>
          </div>

          <button style={{
            padding: '8px 16px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            絞り込み
          </button>

          <button style={{
            padding: '8px 16px',
            backgroundColor: '#ffffff',
            color: '#666',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
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
              {data.map((row) => (
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
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.assetNo}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.equipmentNo}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.purchaseDate}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.lease}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.rental}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                    <button style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      backgroundColor: '#e3f2fd',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}>
                      📷 {row.photoCount}枚
                    </button>
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.largeClass}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.mediumClass}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.item}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.manufacturer}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.model}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.width}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.depth}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.height}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.remarks}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap', position: 'sticky', right: 0, backgroundColor: !row.masterId ? '#fff3cd' : 'white', zIndex: 1 }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
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
    </div>
  );
}
