'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';

interface SurveyData {
  id: number;
  status: 'pending' | 'completed' | 'review' | 'mismatch';
  sealNo: string;
  assetNo: string;
  department: string;
  item: string;
  maker: string;
  model: string;
  quantity: number;
  purchaseDate: string;
}

interface LedgerData {
  id: number;
  assetNo: string;
  department: string;
  item: string;
  maker: string;
  model: string;
  purchaseDate: string;
  matched: boolean;
}

export default function DataMatchingPage() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const [selectedAll, setSelectedAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [currentMatchingId, setCurrentMatchingId] = useState<number | null>(null);
  const [selectedLedger, setSelectedLedger] = useState<number | null>(null);

  const surveyData: SurveyData[] = [
    {
      id: 1,
      status: 'pending',
      sealNo: '22-00474',
      assetNo: '10605379-000',
      department: '手術部門',
      item: '燻蒸滅菌装置',
      maker: 'VENLE GO',
      model: 'CEパルサマドライ',
      quantity: 1,
      purchaseDate: '2022-04-15'
    },
    {
      id: 2,
      status: 'pending',
      sealNo: 'シールなし',
      assetNo: '',
      department: '放射線科',
      item: '特殊内視鏡 BF-TYPE ABC',
      maker: 'オリンパスメディカル',
      model: 'BF-ABC-123-XYZ',
      quantity: 1,
      purchaseDate: ''
    },
    {
      id: 3,
      status: 'completed',
      sealNo: '22-00812',
      assetNo: '10605421-000',
      department: '検査科',
      item: '自動血球計数器',
      maker: 'シスメックス',
      model: 'XN-3000',
      quantity: 1,
      purchaseDate: '2023-01-20'
    }
  ];

  const ledgerData: LedgerData[] = [
    {
      id: 1,
      assetNo: 'A-001-2023',
      department: '手術部門',
      item: 'MRI装置',
      maker: 'シーメンスヘルスケア',
      model: 'MAGNETOM Vida 3T',
      purchaseDate: '2023-03-15',
      matched: false
    },
    {
      id: 2,
      assetNo: 'A-002-2023',
      department: '放射線科',
      item: 'CT装置',
      maker: 'GEヘルスケア',
      model: 'Revolution CT',
      purchaseDate: '2023-05-20',
      matched: false
    },
    {
      id: 3,
      assetNo: 'A-003-2023',
      department: '手術部門',
      item: '人工呼吸器',
      maker: 'ドレーゲル',
      model: 'Savina 300',
      purchaseDate: '2023-02-10',
      matched: false
    }
  ];

  const [data, setData] = useState(surveyData);
  const [ledger, setLedger] = useState(ledgerData);

  const handleBack = () => {
    router.back();
  };

  const openLedgerWindow = () => {
    alert('資産台帳を別ウィンドウで開きます');
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

  const handleSelectLedger = (id: number) => {
    setCurrentMatchingId(id);
    setShowModal(true);
  };

  const confirmLedgerSelection = () => {
    if (selectedLedger && currentMatchingId) {
      alert(`資産台帳ID ${selectedLedger} と調査ID ${currentMatchingId} を紐付けました`);
      setShowModal(false);
      setSelectedLedger(null);
      setCurrentMatchingId(null);
    } else {
      alert('資産台帳を選択してください');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLedger(null);
    setCurrentMatchingId(null);
  };

  const bulkConfirm = () => {
    if (selectedRows.size === 0) {
      alert('確定する項目を選択してください');
      return;
    }
    alert(`${selectedRows.size}件を一括確定しました`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'review': return '#2196f3';
      case 'mismatch': return '#f44336';
      default: return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '確定済';
      case 'pending': return '未処理';
      case 'review': return '要確認';
      case 'mismatch': return '不一致';
      default: return status;
    }
  };

  if (isMobile) {
    return (
      <div style={{ padding: '16px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <div style={{ marginBottom: '16px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
          データ突合
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
          maxWidth: '1600px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={handleBack}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>←</span> 戻る
            </button>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
              データ突合
            </h1>
          </div>
          <button
            onClick={openLedgerWindow}
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
            <span>🗗</span> 資産台帳を別窓で開く
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        padding: '12px 24px'
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '14px', color: '#5a6c7d', fontWeight: '600' }}>進捗状況:</span>
          <span style={{ fontSize: '14px', color: '#2c3e50' }}>
            確定済 1/3件 | 未処理 2件
          </span>
        </div>
      </div>

      {/* Filter Panel */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        padding: '16px 24px'
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '12px'
          }}>
            <select style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <option value="all">全て</option>
              <option value="pending">未処理</option>
              <option value="completed">確定済</option>
            </select>

            <select style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <option value="">部署: 全て</option>
              <option value="手術部門">手術部門</option>
              <option value="放射線科">放射線科</option>
              <option value="検査科">検査科</option>
            </select>

            <select style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <option value="">品目: 全て</option>
              <option value="滅菌装置">滅菌装置</option>
              <option value="内視鏡">内視鏡</option>
            </select>

            <select style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <option value="">メーカー: 全て</option>
            </select>

            <input
              type="text"
              placeholder="キーワード検索..."
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                minWidth: '200px'
              }}
            />

            <button style={{
              padding: '8px 16px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              フィルター解除
            </button>
          </div>

          <button
            onClick={bulkConfirm}
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
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '16px',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#2c3e50', margin: 0 }}>
                現有品調査リスト
              </h2>
              <span style={{ fontSize: '14px', color: '#5a6c7d' }}>
                表示: {data.length}件
              </span>
            </div>

            <div style={{ overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedAll}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>突合状態</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>シールNo</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>資産番号</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>部署</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>品目</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>メーカー</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>型式</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>数量</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>購入日</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.id}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(row.id)}
                          onChange={() => toggleRowSelection(row.id)}
                        />
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: getStatusColor(row.status) + '20',
                          color: getStatusColor(row.status),
                          fontWeight: '600'
                        }}>
                          {getStatusText(row.status)}
                        </span>
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.sealNo}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.assetNo}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.department}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.item}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.maker}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.model}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>{row.quantity}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{row.purchaseDate}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => handleSelectLedger(row.id)}
                          style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            backgroundColor: '#e3f2fd',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          台帳選択
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '1000px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
                資産台帳から選択
              </h3>
              <button
                onClick={closeModal}
                style={{
                  fontSize: '24px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', flex: 1, overflow: 'auto' }}>
              <input
                type="text"
                placeholder="資産番号、品目、メーカーで検索..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginBottom: '16px',
                  boxSizing: 'border-box'
                }}
              />
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', textAlign: 'center' }}>選択</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>突合</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>資産番号</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>部署</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>品目</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>メーカー</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>型式</th>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }}>購入日</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>
                        <input
                          type="radio"
                          name="ledger-select"
                          checked={selectedLedger === item.id}
                          onChange={() => setSelectedLedger(item.id)}
                        />
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          backgroundColor: item.matched ? '#ffebee' : '#e8f5e9',
                          color: item.matched ? '#c62828' : '#2e7d32',
                          fontWeight: '600'
                        }}>
                          {item.matched ? '済' : '未'}
                        </span>
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{item.assetNo}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{item.department}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{item.item}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{item.maker}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{item.model}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>{item.purchaseDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={closeModal}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={confirmLedgerSelection}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                この資産と紐付ける
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
