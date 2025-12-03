'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';

function AssetSurveyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile, isTablet } = useResponsive();

  // Get location data from URL params
  const category = searchParams.get('category') || '';
  const building = searchParams.get('building') || '';
  const floor = searchParams.get('floor') || '';
  const department = searchParams.get('department') || '';
  const section = searchParams.get('section') || '';

  // Sticky header fields
  const [sealNo, setSealNo] = useState('');
  const [roomName, setRoomName] = useState('');

  // Registration mode
  const [bulkMode, setBulkMode] = useState(false);

  // Asset fields
  const [assetNo, setAssetNo] = useState('');
  const [equipmentNo, setEquipmentNo] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [isLease, setIsLease] = useState(false);
  const [isLoan, setIsLoan] = useState(false);

  // Classification fields
  const [largeClass, setLargeClass] = useState('');
  const [mediumClass, setMediumClass] = useState('');
  const [item, setItem] = useState('');
  const [maker, setMaker] = useState('');
  const [model, setModel] = useState('');

  // Size fields
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [height, setHeight] = useState('');

  // Remarks
  const [remarks, setRemarks] = useState('');

  // End seal no (for bulk mode)
  const [endSealNo, setEndSealNo] = useState('');

  const handleBack = () => {
    router.back();
  };

  const handleShowHistory = () => {
    alert('履歴を表示します（この機能は実装予定）');
  };

  const handleQRScan = () => {
    alert('QRコードを読み取ります（この機能は実装予定）');
  };

  const handlePhotoCapture = () => {
    alert('写真を撮影します（この機能は実装予定）');
  };

  const handleRegister = () => {
    if (!sealNo || !roomName) {
      alert('シールNo.と室名は必須です');
      return;
    }
    alert('商品を登録します（この機能は実装予定）');
  };

  const handleEndQRScan = () => {
    alert('終了QRを読み取ります（この機能は実装予定）');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Sticky Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        background: '#3498db',
        padding: isMobile ? '10px 12px' : isTablet ? '11px 16px' : '12px 20px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{
          display: 'flex',
          gap: isMobile ? '10px' : isTablet ? '15px' : '20px',
          maxWidth: '1200px',
          margin: '0 auto',
          alignItems: isMobile ? 'stretch' : 'center',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px', flex: 1 }}>
            <label style={{
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 600,
              color: 'white',
              whiteSpace: 'nowrap'
            }}>
              シールNo.
            </label>
            <input
              type="text"
              value={sealNo}
              onChange={(e) => setSealNo(e.target.value)}
              placeholder="シール番号を入力"
              style={{
                flex: 1,
                padding: isMobile ? '8px 10px' : '10px 12px',
                border: 'none',
                borderRadius: '6px',
                fontSize: isMobile ? '13px' : '14px',
                background: 'white'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px', flex: 1 }}>
            <label style={{
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 600,
              color: 'white',
              whiteSpace: 'nowrap'
            }}>
              室名
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="室名を入力または検索"
              style={{
                flex: 1,
                padding: isMobile ? '8px 10px' : '10px 12px',
                border: 'none',
                borderRadius: '6px',
                fontSize: isMobile ? '13px' : '14px',
                background: 'white'
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: isMobile ? '12px' : isTablet ? '16px' : '20px',
        paddingBottom: isMobile ? '100px' : '120px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <section style={{
            background: 'white',
            borderRadius: isMobile ? '6px' : '8px',
            padding: isMobile ? '16px' : isTablet ? '18px' : '20px',
            marginBottom: isMobile ? '16px' : '20px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Registration Mode */}
            <div style={{ marginBottom: isMobile ? '12px' : '15px' }}>
              <label style={{
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: 600,
                color: '#2c3e50',
                marginBottom: isMobile ? '6px' : '8px',
                display: 'block'
              }}>
                登録モード
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
                <input
                  type="checkbox"
                  id="bulkMode"
                  checked={bulkMode}
                  onChange={(e) => setBulkMode(e.target.checked)}
                  style={{ width: isMobile ? '16px' : '18px', height: isMobile ? '16px' : '18px', cursor: 'pointer' }}
                />
                <label htmlFor="bulkMode" style={{ fontSize: isMobile ? '13px' : '14px', cursor: 'pointer' }}>
                  一括登録モード
                </label>
              </div>
              <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#7f8c8d', marginTop: '4px', display: 'block' }}>
                同じ機器を複数個登録する場合にチェック
              </span>
            </div>

            {/* QR Code Display Area */}
            <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
              <div style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 600, color: '#34495e', marginBottom: isMobile ? '6px' : '8px' }}>
                読み取ったQRコード
              </div>
              <div style={{
                background: '#f8f9fa',
                border: '2px dashed #dee2e6',
                borderRadius: isMobile ? '6px' : '8px',
                padding: isMobile ? '20px' : isTablet ? '25px' : '30px',
                textAlign: 'center',
                minHeight: isMobile ? '100px' : '120px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: isMobile ? '6px' : '8px' }}>📷</div>
                <div style={{ fontSize: isMobile ? '12px' : '14px', color: '#7f8c8d' }}>QRコードを読み取ってください</div>
              </div>
            </div>

            {/* Blue Section Bar */}
            <div style={{
              height: isMobile ? '3px' : '4px',
              background: '#3498db',
              borderRadius: '2px',
              marginTop: isMobile ? '20px' : '30px',
              marginBottom: isMobile ? '16px' : '20px'
            }}></div>

            {/* Asset Number, Equipment Number, Serial Number */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: isMobile ? '12px' : '15px',
              marginBottom: isMobile ? '12px' : '15px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 600,
                  color: '#2c3e50',
                  marginBottom: isMobile ? '6px' : '8px'
                }}>
                  資産番号
                </label>
                <input
                  type="text"
                  value={assetNo}
                  onChange={(e) => setAssetNo(e.target.value)}
                  placeholder="資産番号を入力"
                  style={{
                    padding: isMobile ? '10px' : '10px 12px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '6px',
                    fontSize: isMobile ? '14px' : '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 600,
                  color: '#2c3e50',
                  marginBottom: isMobile ? '6px' : '8px'
                }}>
                  備品番号
                </label>
                <input
                  type="text"
                  value={equipmentNo}
                  onChange={(e) => setEquipmentNo(e.target.value)}
                  placeholder="備品番号を入力"
                  style={{
                    padding: isMobile ? '10px' : '10px 12px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '6px',
                    fontSize: isMobile ? '14px' : '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 600,
                  color: '#2c3e50',
                  marginBottom: isMobile ? '6px' : '8px'
                }}>
                  シリアルNo.
                </label>
                <input
                  type="text"
                  value={serialNo}
                  onChange={(e) => setSerialNo(e.target.value)}
                  placeholder="シリアルNo.を入力"
                  style={{
                    padding: isMobile ? '10px' : '10px 12px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '6px',
                    fontSize: isMobile ? '14px' : '14px'
                  }}
                />
              </div>
            </div>

            {/* Purchase Date and Other */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: isMobile ? '12px' : '15px',
              marginBottom: isMobile ? '12px' : '15px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 600,
                  color: '#2c3e50',
                  marginBottom: isMobile ? '6px' : '8px'
                }}>
                  購入年月日
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  style={{
                    padding: isMobile ? '10px' : '10px 12px',
                    border: '1px solid #d0d0d0',
                    borderRadius: '6px',
                    fontSize: isMobile ? '14px' : '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 600,
                  color: '#2c3e50',
                  marginBottom: isMobile ? '6px' : '8px'
                }}>
                  その他
                </label>
                <div style={{ display: 'flex', gap: isMobile ? '16px' : '20px', alignItems: 'center', paddingTop: '4px', flexWrap: 'wrap' }}>
                  {/* Lease Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
                    <label style={{ fontSize: isMobile ? '12px' : '13px', color: '#2c3e50', whiteSpace: 'nowrap' }}>リース</label>
                    <button
                      type="button"
                      onClick={() => setIsLease(!isLease)}
                      style={{
                        width: isMobile ? '40px' : '44px',
                        height: isMobile ? '22px' : '24px',
                        borderRadius: isMobile ? '11px' : '12px',
                        border: 'none',
                        background: isLease ? '#27ae60' : '#bdc3c7',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.3s',
                        padding: 0
                      }}
                    >
                      <div style={{
                        width: isMobile ? '18px' : '20px',
                        height: isMobile ? '18px' : '20px',
                        borderRadius: '50%',
                        background: 'white',
                        position: 'absolute',
                        top: '2px',
                        left: isLease ? (isMobile ? '20px' : '22px') : '2px',
                        transition: 'left 0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}></div>
                    </button>
                    <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#7f8c8d' }}>{isLease ? 'オン' : 'オフ'}</span>
                  </div>

                  {/* Loan Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
                    <label style={{ fontSize: isMobile ? '12px' : '13px', color: '#2c3e50', whiteSpace: 'nowrap' }}>貸出品</label>
                    <button
                      type="button"
                      onClick={() => setIsLoan(!isLoan)}
                      style={{
                        width: isMobile ? '40px' : '44px',
                        height: isMobile ? '22px' : '24px',
                        borderRadius: isMobile ? '11px' : '12px',
                        border: 'none',
                        background: isLoan ? '#27ae60' : '#bdc3c7',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.3s',
                        padding: 0
                      }}
                    >
                      <div style={{
                        width: isMobile ? '18px' : '20px',
                        height: isMobile ? '18px' : '20px',
                        borderRadius: '50%',
                        background: 'white',
                        position: 'absolute',
                        top: '2px',
                        left: isLoan ? (isMobile ? '20px' : '22px') : '2px',
                        transition: 'left 0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}></div>
                    </button>
                    <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#7f8c8d' }}>{isLoan ? 'オン' : 'オフ'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Display Area */}
            <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
              <div style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 600, color: '#34495e', marginBottom: isMobile ? '6px' : '8px' }}>
                写真
              </div>
              <div style={{
                background: '#f8f9fa',
                border: '2px dashed #dee2e6',
                borderRadius: isMobile ? '6px' : '8px',
                padding: isMobile ? '20px' : isTablet ? '25px' : '30px',
                textAlign: 'center',
                minHeight: isMobile ? '100px' : '120px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: isMobile ? '6px' : '8px' }}>📷</div>
                <div style={{ fontSize: isMobile ? '12px' : '14px', color: '#7f8c8d' }}>写真を撮影してください</div>
              </div>
            </div>

            {/* Blue Section Bar */}
            <div style={{
              height: isMobile ? '3px' : '4px',
              background: '#3498db',
              borderRadius: '2px',
              marginTop: isMobile ? '20px' : '30px',
              marginBottom: isMobile ? '16px' : '20px'
            }}></div>

            {/* Classification Information */}
            <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
              <h3 style={{
                margin: isMobile ? '0 0 12px 0' : '0 0 15px 0',
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 600,
                color: '#34495e'
              }}>
                分類情報
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: isMobile ? '12px' : '15px',
                marginBottom: isMobile ? '12px' : '15px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 600,
                    color: '#2c3e50',
                    marginBottom: isMobile ? '6px' : '8px'
                  }}>
                    大分類
                  </label>
                  <select
                    value={largeClass}
                    onChange={(e) => setLargeClass(e.target.value)}
                    style={{
                      padding: isMobile ? '10px' : '10px 12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '6px',
                      fontSize: isMobile ? '14px' : '14px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">選択してください</option>
                    <option value="医療機器">医療機器</option>
                    <option value="事務機器">事務機器</option>
                    <option value="什器・備品">什器・備品</option>
                  </select>
                  <span style={{ fontSize: isMobile ? '10px' : '11px', color: '#7f8c8d', marginTop: '4px' }}>
                    フリー入力・一覧選択・あいまい検索可
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 600,
                    color: '#2c3e50',
                    marginBottom: isMobile ? '6px' : '8px'
                  }}>
                    中分類
                  </label>
                  <select
                    value={mediumClass}
                    onChange={(e) => setMediumClass(e.target.value)}
                    style={{
                      padding: isMobile ? '10px' : '10px 12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '6px',
                      fontSize: isMobile ? '14px' : '14px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">選択してください</option>
                  </select>
                  <span style={{ fontSize: isMobile ? '10px' : '11px', color: '#7f8c8d', marginTop: '4px' }}>
                    フリー入力・一覧選択・あいまい検索可
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 600,
                    color: '#2c3e50',
                    marginBottom: isMobile ? '6px' : '8px'
                  }}>
                    品目
                  </label>
                  <select
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    style={{
                      padding: isMobile ? '10px' : '10px 12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '6px',
                      fontSize: isMobile ? '14px' : '14px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">選択してください</option>
                  </select>
                  <span style={{ fontSize: isMobile ? '10px' : '11px', color: '#7f8c8d', marginTop: '4px' }}>
                    フリー入力・一覧選択・あいまい検索可
                  </span>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: isMobile ? '12px' : '15px',
                marginBottom: isMobile ? '12px' : '15px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 600,
                    color: '#2c3e50',
                    marginBottom: isMobile ? '6px' : '8px'
                  }}>
                    メーカー
                  </label>
                  <select
                    value={maker}
                    onChange={(e) => setMaker(e.target.value)}
                    style={{
                      padding: isMobile ? '10px' : '10px 12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '6px',
                      fontSize: isMobile ? '14px' : '14px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">選択してください</option>
                  </select>
                  <span style={{ fontSize: isMobile ? '10px' : '11px', color: '#7f8c8d', marginTop: '4px' }}>
                    フリー入力・一覧選択・あいまい検索可
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 600,
                    color: '#2c3e50',
                    marginBottom: isMobile ? '6px' : '8px'
                  }}>
                    型式
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    style={{
                      padding: isMobile ? '10px' : '10px 12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '6px',
                      fontSize: isMobile ? '14px' : '14px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">選択してください</option>
                  </select>
                  <span style={{ fontSize: isMobile ? '10px' : '11px', color: '#7f8c8d', marginTop: '4px' }}>
                    フリー入力・一覧選択・あいまい検索可
                  </span>
                </div>
              </div>
            </div>

            {/* Size Information */}
            <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
              <h3 style={{
                margin: isMobile ? '0 0 12px 0' : '0 0 15px 0',
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 600,
                color: '#34495e'
              }}>
                サイズ情報
              </h3>

              <div style={{ display: 'flex', gap: isMobile ? '10px' : '15px', marginBottom: isMobile ? '6px' : '8px', flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 600,
                    color: '#2c3e50',
                    marginBottom: isMobile ? '6px' : '8px'
                  }}>
                    W (幅)
                  </label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="1"
                    style={{
                      padding: isMobile ? '10px' : '10px 12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '6px',
                      fontSize: isMobile ? '14px' : '14px'
                    }}
                  />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 600,
                    color: '#2c3e50',
                    marginBottom: isMobile ? '6px' : '8px'
                  }}>
                    D (奥行)
                  </label>
                  <input
                    type="number"
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="1"
                    style={{
                      padding: isMobile ? '10px' : '10px 12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '6px',
                      fontSize: isMobile ? '14px' : '14px'
                    }}
                  />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 600,
                    color: '#2c3e50',
                    marginBottom: isMobile ? '6px' : '8px'
                  }}>
                    H (高さ)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="1"
                    style={{
                      padding: isMobile ? '10px' : '10px 12px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '6px',
                      fontSize: isMobile ? '14px' : '14px'
                    }}
                  />
                </div>
              </div>
              <span style={{ fontSize: isMobile ? '10px' : '11px', color: '#7f8c8d' }}>単位: mm</span>
            </div>

            {/* Remarks */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: 600,
                color: '#2c3e50',
                marginBottom: isMobile ? '6px' : '8px'
              }}>
                備考
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="備考を入力してください"
                rows={isMobile ? 3 : 4}
                style={{
                  padding: isMobile ? '10px' : '10px 12px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '6px',
                  fontSize: isMobile ? '14px' : '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* End Seal No Section (for bulk mode) */}
            {bulkMode && (
              <>
                <div style={{
                  height: isMobile ? '3px' : '4px',
                  background: '#3498db',
                  borderRadius: '2px',
                  marginTop: isMobile ? '20px' : '30px',
                  marginBottom: isMobile ? '16px' : '20px'
                }}></div>

                <div style={{ display: 'flex', gap: isMobile ? '10px' : '15px', alignItems: 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: isMobile ? '100%' : 'auto' }}>
                    <label style={{
                      fontSize: isMobile ? '13px' : '14px',
                      fontWeight: 600,
                      color: '#2c3e50',
                      marginBottom: isMobile ? '6px' : '8px'
                    }}>
                      終了シールNo.
                    </label>
                    <input
                      type="text"
                      value={endSealNo}
                      onChange={(e) => setEndSealNo(e.target.value)}
                      placeholder="終了シール番号を入力"
                      readOnly
                      style={{
                        padding: isMobile ? '10px' : '10px 12px',
                        border: '1px solid #d0d0d0',
                        borderRadius: '6px',
                        fontSize: isMobile ? '14px' : '14px',
                        background: '#f8f9fa'
                      }}
                    />
                    <span style={{ fontSize: isMobile ? '10px' : '11px', color: '#7f8c8d', marginTop: '4px' }}>
                      一括登録の終了シール番号
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleEndQRScan}
                    style={{
                      padding: isMobile ? '12px 16px' : '12px 20px',
                      background: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: isMobile ? '13px' : '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: isMobile ? '6px' : '8px',
                      whiteSpace: 'nowrap',
                      width: isMobile ? '100%' : 'auto'
                    }}
                  >
                    <span style={{ fontSize: isMobile ? '16px' : '18px' }}>📷</span>
                    <span>終了QR読取</span>
                  </button>
                </div>
              </>
            )}
          </section>
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
        padding: isMobile ? '8px' : '10px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        flexWrap: 'wrap',
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}>
        {/* Back Button */}
        <button
          onClick={handleBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            padding: isMobile ? '5px' : '8px',
            borderRadius: '8px',
            transition: 'background 0.3s',
            minWidth: isMobile ? '60px' : '70px'
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
            width: isMobile ? '35px' : '40px',
            height: isMobile ? '35px' : '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: 0,
              height: 0,
              borderRight: '10px solid #34495e',
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent'
            }}></div>
          </div>
          <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#2c3e50' }}>戻る</span>
        </button>

        {/* History Button */}
        <button
          onClick={handleShowHistory}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            padding: isMobile ? '5px' : '8px',
            borderRadius: '8px',
            transition: 'background 0.3s',
            minWidth: isMobile ? '60px' : '70px'
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
            width: isMobile ? '35px' : '40px',
            height: isMobile ? '35px' : '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            📋
          </div>
          <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#2c3e50' }}>履歴表示</span>
        </button>

        {/* QR Scan Button */}
        <button
          onClick={handleQRScan}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            padding: isMobile ? '5px' : '8px',
            borderRadius: '8px',
            transition: 'background 0.3s',
            minWidth: isMobile ? '60px' : '70px'
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
            width: isMobile ? '35px' : '40px',
            height: isMobile ? '35px' : '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            📷
          </div>
          <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#2c3e50' }}>QR読取</span>
        </button>

        {/* Photo Capture Button */}
        <button
          onClick={handlePhotoCapture}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            padding: isMobile ? '5px' : '8px',
            borderRadius: '8px',
            transition: 'background 0.3s',
            minWidth: isMobile ? '60px' : '70px'
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
            width: isMobile ? '35px' : '40px',
            height: isMobile ? '35px' : '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            📷
          </div>
          <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#2c3e50' }}>写真撮影</span>
        </button>

        {/* Register Button */}
        <button
          onClick={handleRegister}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            padding: isMobile ? '5px' : '8px',
            borderRadius: '8px',
            transition: 'background 0.3s',
            minWidth: isMobile ? '60px' : '70px',
            color: '#27ae60'
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
            width: isMobile ? '35px' : '40px',
            height: isMobile ? '35px' : '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: '#27ae60'
          }}>
            ✓
          </div>
          <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#27ae60' }}>商品登録</span>
        </button>
      </footer>
    </div>
  );
}


export default function AssetSurveyPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <AssetSurveyContent />
    </Suspense>
  );
}
