'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useMasterStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export default function AssetSurveyIntegratedPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const { assets: assetMasters } = useMasterStore();
  const [bulkMode, setBulkMode] = useState(false);
  const [leaseToggle, setLeaseToggle] = useState(false);
  const [rentalToggle, setRentalToggle] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [largeClass, setLargeClass] = useState('');
  const [mediumClass, setMediumClass] = useState('');
  const [item, setItem] = useState('');
  const [maker, setMaker] = useState('');
  const [model, setModel] = useState('');

  // 購入年月日（年、月、日を個別に管理）
  const [purchaseYear, setPurchaseYear] = useState('');
  const [purchaseMonth, setPurchaseMonth] = useState('');
  const [purchaseDay, setPurchaseDay] = useState('');

  // 日付ピッカーモーダル
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempYear, setTempYear] = useState('');
  const [tempMonth, setTempMonth] = useState('');
  const [tempDay, setTempDay] = useState('');

  // ドラムロールのスクロール参照
  const yearScrollRef = useRef<HTMLDivElement>(null);
  const monthScrollRef = useRef<HTMLDivElement>(null);
  const dayScrollRef = useRef<HTMLDivElement>(null);

  // 和暦変換関数
  const toWareki = (year: number): string => {
    if (year >= 2019) return `令和${year - 2018}`;
    if (year >= 1989) return `平成${year - 1988}`;
    if (year >= 1926) return `昭和${year - 1925}`;
    if (year >= 1912) return `大正${year - 1911}`;
    return `明治${year - 1867}`;
  };

  // 年の選択肢（1950年〜現在+1年）
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let y = currentYear + 1; y >= 1950; y--) {
      years.push(y.toString());
    }
    return years;
  }, []);

  // 月の選択肢（未選択可）
  const monthOptions = useMemo(() => {
    const months: string[] = [];
    for (let m = 1; m <= 12; m++) {
      months.push(m.toString());
    }
    return months;
  }, []);

  // 日の選択肢（未選択可、選択された年月に応じて変動）
  const dayOptions = useMemo(() => {
    const days: string[] = [];
    const year = tempYear ? parseInt(tempYear, 10) : null;
    const month = tempMonth ? parseInt(tempMonth, 10) : null;
    if (!year || !month) {
      for (let d = 1; d <= 31; d++) {
        days.push(d.toString());
      }
    } else {
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        days.push(d.toString());
      }
    }
    return days;
  }, [tempYear, tempMonth]);

  // モーダルを開く際に現在の値をセット
  const openDatePicker = () => {
    setTempYear(purchaseYear);
    setTempMonth(purchaseMonth);
    setTempDay(purchaseDay);
    setShowDatePicker(true);
  };

  // モーダルでの選択を確定
  const confirmDatePicker = () => {
    setPurchaseYear(tempYear);
    setPurchaseMonth(tempMonth);
    setPurchaseDay(tempDay);
    setShowDatePicker(false);
  };

  // モーダルをキャンセル
  const cancelDatePicker = () => {
    setShowDatePicker(false);
  };

  // 日付表示用のフォーマット
  const formatDisplayDate = () => {
    if (!purchaseYear) return '選択してください';
    let display = `${purchaseYear}（${toWareki(parseInt(purchaseYear, 10))}）年`;
    if (purchaseMonth) {
      display += ` ${purchaseMonth}月`;
      if (purchaseDay) {
        display += ` ${purchaseDay}日`;
      }
    }
    return display;
  };

  // ドラムロール内の項目の高さ
  const ITEM_HEIGHT = 44;

  // スクロール位置を選択値に基づいて設定
  useEffect(() => {
    if (showDatePicker) {
      setTimeout(() => {
        if (yearScrollRef.current && tempYear) {
          const index = yearOptions.indexOf(tempYear);
          if (index >= 0) {
            yearScrollRef.current.scrollTop = index * ITEM_HEIGHT;
          }
        }
        if (monthScrollRef.current && tempMonth) {
          const index = monthOptions.indexOf(tempMonth);
          if (index >= 0) {
            monthScrollRef.current.scrollTop = index * ITEM_HEIGHT;
          }
        }
        if (dayScrollRef.current && tempDay) {
          const index = dayOptions.indexOf(tempDay);
          if (index >= 0) {
            dayScrollRef.current.scrollTop = index * ITEM_HEIGHT;
          }
        }
      }, 100);
    }
  }, [showDatePicker, tempYear, tempMonth, tempDay, yearOptions, monthOptions, dayOptions]);

  const largeClassOptions = useMemo(() => {
    const uniqueClasses = Array.from(new Set(assetMasters.map(a => a.largeClass).filter(Boolean)));
    return uniqueClasses;
  }, [assetMasters]);

  const mediumClassOptions = useMemo(() => {
    const uniqueClasses = Array.from(new Set(assetMasters.map(a => a.mediumClass).filter(Boolean)));
    return uniqueClasses;
  }, [assetMasters]);

  const itemOptions = useMemo(() => {
    const uniqueItems = Array.from(new Set(assetMasters.map(a => a.item).filter(Boolean)));
    return uniqueItems;
  }, [assetMasters]);

  const makerOptions = useMemo(() => {
    const uniqueMakers = Array.from(new Set(assetMasters.map(a => a.maker).filter(Boolean)));
    return uniqueMakers;
  }, [assetMasters]);

  const modelOptions = useMemo(() => {
    const uniqueModels = Array.from(new Set(assetMasters.map(a => a.model).filter(Boolean)));
    return uniqueModels;
  }, [assetMasters]);

  const handleBack = () => {
    router.back();
  };

  const handleShowHistory = () => {
    router.push('/history');
  };

  const handleQRScan = () => {
    setQrScanned(true);
    alert('QRコードを読み取りました');
  };

  const handlePhotoCapture = () => {
    setPhotoTaken(true);
    alert('写真を撮影しました');
  };

  const handleEndQRScan = () => {
    alert('終了QRコードを読み取りました');
  };

  const handleAssetRegistration = () => {
    alert('商品を登録しました');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Sticky Header */}
      <div style={{
        backgroundColor: '#1976d2',
        color: 'white',
        padding: isMobile ? '12px 16px' : '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          display: 'flex',
          gap: isMobile ? '12px' : '24px',
          maxWidth: '1200px',
          margin: '0 auto',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{
              fontSize: '12px',
              display: 'block',
              marginBottom: '4px',
              fontWeight: '600'
            }}>
              ラベル番号
            </label>
            <input
              type="text"
              placeholder="ラベル番号を入力"
              style={{
                width: '100%',
                padding: '10px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{
              fontSize: '12px',
              display: 'block',
              marginBottom: '4px',
              fontWeight: '600'
            }}>
              室名
            </label>
            <input
              type="text"
              placeholder="室名を入力または検索"
              style={{
                width: '100%',
                padding: '10px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: isMobile ? '16px' : '24px',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        {/* Bulk Registration Mode */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: isMobile ? '16px' : '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
              登録モード
            </label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="bulkMode"
              checked={bulkMode}
              onChange={(e) => setBulkMode(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="bulkMode" style={{ fontSize: '14px', color: '#2c3e50', cursor: 'pointer' }}>
              一括登録モード
            </label>
          </div>
          <div style={{ fontSize: '12px', color: '#5a6c7d', marginTop: '4px', marginLeft: '26px' }}>
            同じ機器を複数個登録する場合にチェック
          </div>
        </div>

        {/* QR Display */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: isMobile ? '16px' : '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50', marginBottom: '12px' }}>
            読み取ったQRコード
          </div>
          <div style={{
            border: '2px dashed #ccc',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: qrScanned ? '#e8f5e9' : '#f9f9f9'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>📷</div>
            <div style={{ fontSize: '14px', color: '#5a6c7d' }}>
              {qrScanned ? 'QRコード読み取り済み' : 'QRコードを読み取ってください'}
            </div>
          </div>
        </div>

        {/* Blue Bar */}
        <div style={{
          height: '4px',
          backgroundColor: '#1976d2',
          margin: '24px 0',
          borderRadius: '2px'
        }} />

        {/* Asset Info */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: isMobile ? '16px' : '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div>
              <label style={{ fontSize: '12px', color: '#5a6c7d', display: 'block', marginBottom: '4px' }}>
                資産番号
              </label>
              <input
                type="text"
                placeholder="資産番号を入力"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#5a6c7d', display: 'block', marginBottom: '4px' }}>
                備品番号
              </label>
              <input
                type="text"
                placeholder="備品番号を入力"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#5a6c7d', display: 'block', marginBottom: '4px' }}>
                シリアルNo.
              </label>
              <input
                type="text"
                placeholder="シリアルNo.を入力"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr',
            gap: '16px'
          }}>
            <div>
              <label style={{ fontSize: '12px', color: '#5a6c7d', display: 'block', marginBottom: '4px' }}>
                購入年月日
              </label>
              <div
                onClick={openDatePicker}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: '42px',
                  color: purchaseYear ? '#2c3e50' : '#999'
                }}
              >
                <span>{formatDisplayDate()}</span>
                <span style={{ color: '#999', fontSize: '18px' }}>▼</span>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#5a6c7d', display: 'block', marginBottom: '4px' }}>
                その他
              </label>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#2c3e50' }}>リース</span>
                  <div
                    onClick={() => setLeaseToggle(!leaseToggle)}
                    style={{
                      width: '48px',
                      height: '24px',
                      backgroundColor: leaseToggle ? '#4caf50' : '#ccc',
                      borderRadius: '12px',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '2px',
                      left: leaseToggle ? '26px' : '2px',
                      transition: 'left 0.3s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#5a6c7d' }}>
                    {leaseToggle ? 'オン' : 'オフ'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#2c3e50' }}>貸出品</span>
                  <div
                    onClick={() => setRentalToggle(!rentalToggle)}
                    style={{
                      width: '48px',
                      height: '24px',
                      backgroundColor: rentalToggle ? '#4caf50' : '#ccc',
                      borderRadius: '12px',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '2px',
                      left: rentalToggle ? '26px' : '2px',
                      transition: 'left 0.3s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#5a6c7d' }}>
                    {rentalToggle ? 'オン' : 'オフ'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Display */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: isMobile ? '16px' : '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50', marginBottom: '12px' }}>
            写真
          </div>
          <div style={{
            border: '2px dashed #ccc',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: photoTaken ? '#e8f5e9' : '#f9f9f9'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>📷</div>
            <div style={{ fontSize: '14px', color: '#5a6c7d' }}>
              {photoTaken ? '写真撮影済み' : '写真を撮影してください'}
            </div>
          </div>
        </div>

        {/* Blue Bar */}
        <div style={{
          height: '4px',
          backgroundColor: '#1976d2',
          margin: '24px 0',
          borderRadius: '2px'
        }} />

        {/* Classification */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: isMobile ? '16px' : '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50', marginBottom: '16px' }}>
            分類情報
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <SearchableSelect
              label="大分類"
              value={largeClass}
              onChange={setLargeClass}
              options={['', ...largeClassOptions]}
              placeholder="選択してください"
              isMobile={isMobile}
            />
            <SearchableSelect
              label="中分類"
              value={mediumClass}
              onChange={setMediumClass}
              options={['', ...mediumClassOptions]}
              placeholder="選択してください"
              isMobile={isMobile}
            />
            <SearchableSelect
              label="品目"
              value={item}
              onChange={setItem}
              options={['', ...itemOptions]}
              placeholder="選択してください"
              isMobile={isMobile}
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '16px'
          }}>
            <SearchableSelect
              label="メーカー"
              value={maker}
              onChange={setMaker}
              options={['', ...makerOptions]}
              placeholder="選択してください"
              isMobile={isMobile}
            />
            <SearchableSelect
              label="型式"
              value={model}
              onChange={setModel}
              options={['', ...modelOptions]}
              placeholder="選択してください"
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* Size */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: isMobile ? '16px' : '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50', marginBottom: '16px' }}>
            サイズ情報
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '16px'
          }}>
            <div>
              <label style={{ fontSize: '12px', color: '#5a6c7d', display: 'block', marginBottom: '4px' }}>
                W (幅)
              </label>
              <input
                type="number"
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#5a6c7d', display: 'block', marginBottom: '4px' }}>
                D (奥行)
              </label>
              <input
                type="number"
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#5a6c7d', display: 'block', marginBottom: '4px' }}>
                H (高さ)
              </label>
              <input
                type="number"
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#5a6c7d', marginTop: '8px' }}>
            単位: mm
          </div>
        </div>

        {/* Remarks */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: isMobile ? '16px' : '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <label style={{ fontSize: '12px', color: '#5a6c7d', display: 'block', marginBottom: '4px' }}>
            備考
          </label>
          <textarea
            placeholder="備考を入力してください"
            rows={4}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
          />
        </div>

        {/* End Seal Section (Bulk Mode) */}
        {bulkMode && (
          <>
            <div style={{
              height: '4px',
              backgroundColor: '#1976d2',
              margin: '24px 0',
              borderRadius: '2px'
            }} />
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: isMobile ? '16px' : '20px',
              marginBottom: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex: 1, width: isMobile ? '100%' : 'auto' }}>
                  <label style={{ fontSize: '12px', color: '#5a6c7d', display: 'block', marginBottom: '4px' }}>
                    終了ラベル番号
                  </label>
                  <input
                    type="text"
                    placeholder="終了ラベル番号を入力"
                    readOnly
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#f5f5f5',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                    一括登録の終了ラベル番号
                  </div>
                </div>
                <button
                  onClick={handleEndQRScan}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>📷</span>
                  <span>終了QR読取</span>
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderTop: '1px solid #ddd',
        padding: isMobile ? '8px' : '10px',
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
        zIndex: 100
      }}>
        <button
          onClick={handleBack}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
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
            width: isMobile ? '35px' : '40px',
            height: isMobile ? '35px' : '40px',
            borderRadius: '50%',
            background: '#ecf0f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderRight: '10px solid #34495e'
            }}></div>
          </div>
          <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#2c3e50' }}>戻る</span>
        </button>

        <button
          onClick={handleShowHistory}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
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
            width: isMobile ? '35px' : '40px',
            height: isMobile ? '35px' : '40px',
            borderRadius: '50%',
            background: '#ecf0f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            📋
          </div>
          <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#2c3e50' }}>履歴表示</span>
        </button>

        <button
          onClick={handleQRScan}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: isMobile ? '5px' : '8px',
            borderRadius: '8px',
            transition: 'background 0.3s',
            minWidth: isMobile ? '60px' : '70px',
            color: '#e74c3c'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fadbd8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
        >
          <div style={{
            width: isMobile ? '35px' : '40px',
            height: isMobile ? '35px' : '40px',
            borderRadius: '50%',
            background: '#fadbd8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            📷
          </div>
          <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#e74c3c' }}>QR読取</span>
        </button>

        <button
          onClick={handlePhotoCapture}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: isMobile ? '5px' : '8px',
            borderRadius: '8px',
            transition: 'background 0.3s',
            minWidth: isMobile ? '60px' : '70px',
            color: '#e74c3c'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fadbd8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
        >
          <div style={{
            width: isMobile ? '35px' : '40px',
            height: isMobile ? '35px' : '40px',
            borderRadius: '50%',
            background: '#fadbd8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            📷
          </div>
          <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#e74c3c' }}>写真撮影</span>
        </button>

        <button
          onClick={handleAssetRegistration}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
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
            width: isMobile ? '35px' : '40px',
            height: isMobile ? '35px' : '40px',
            borderRadius: '50%',
            background: '#d5f4e6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            ✓
          </div>
          <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#27ae60' }}>商品登録</span>
        </button>
      </footer>

      {/* 日付ピッカーモーダル */}
      {showDatePicker && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={cancelDatePicker}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '400px',
              padding: '0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid #eee'
            }}>
              <button
                onClick={cancelDatePicker}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                キャンセル
              </button>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>
                購入年月日
              </span>
              <button
                onClick={confirmDatePicker}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  color: '#1976d2',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                完了
              </button>
            </div>

            {/* ドラムロール部分 */}
            <div style={{
              display: 'flex',
              height: '220px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* 選択インジケーター */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '10px',
                right: '10px',
                height: `${ITEM_HEIGHT}px`,
                transform: 'translateY(-50%)',
                background: '#f0f7ff',
                borderRadius: '8px',
                pointerEvents: 'none',
                zIndex: 1
              }} />

              {/* 年ドラムロール */}
              <div style={{ flex: 2, position: 'relative' }}>
                <div
                  ref={yearScrollRef}
                  style={{
                    height: '100%',
                    overflowY: 'auto',
                    scrollSnapType: 'y mandatory',
                    WebkitOverflowScrolling: 'touch',
                    paddingTop: `${(220 - ITEM_HEIGHT) / 2}px`,
                    paddingBottom: `${(220 - ITEM_HEIGHT) / 2}px`
                  }}
                >
                  <div
                    style={{
                      height: `${ITEM_HEIGHT}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      scrollSnapAlign: 'center',
                      fontSize: '16px',
                      color: !tempYear ? '#1976d2' : '#999',
                      fontWeight: !tempYear ? 'bold' : 'normal',
                      cursor: 'pointer',
                      position: 'relative',
                      zIndex: 2
                    }}
                    onClick={() => setTempYear('')}
                  >
                    未選択
                  </div>
                  {yearOptions.map(year => (
                    <div
                      key={year}
                      style={{
                        height: `${ITEM_HEIGHT}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        scrollSnapAlign: 'center',
                        fontSize: '16px',
                        color: tempYear === year ? '#1976d2' : '#2c3e50',
                        fontWeight: tempYear === year ? 'bold' : 'normal',
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 2
                      }}
                      onClick={() => setTempYear(year)}
                    >
                      {year}（{toWareki(parseInt(year, 10))}）
                    </div>
                  ))}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '12px',
                  color: '#999'
                }}>
                  年
                </div>
              </div>

              {/* 月ドラムロール */}
              <div style={{ flex: 1, position: 'relative' }}>
                <div
                  ref={monthScrollRef}
                  style={{
                    height: '100%',
                    overflowY: 'auto',
                    scrollSnapType: 'y mandatory',
                    WebkitOverflowScrolling: 'touch',
                    paddingTop: `${(220 - ITEM_HEIGHT) / 2}px`,
                    paddingBottom: `${(220 - ITEM_HEIGHT) / 2}px`
                  }}
                >
                  <div
                    style={{
                      height: `${ITEM_HEIGHT}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      scrollSnapAlign: 'center',
                      fontSize: '18px',
                      color: !tempMonth ? '#1976d2' : '#999',
                      fontWeight: !tempMonth ? 'bold' : 'normal',
                      cursor: 'pointer',
                      position: 'relative',
                      zIndex: 2
                    }}
                    onClick={() => setTempMonth('')}
                  >
                    --
                  </div>
                  {monthOptions.map(month => (
                    <div
                      key={month}
                      style={{
                        height: `${ITEM_HEIGHT}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        scrollSnapAlign: 'center',
                        fontSize: '18px',
                        color: tempMonth === month ? '#1976d2' : '#2c3e50',
                        fontWeight: tempMonth === month ? 'bold' : 'normal',
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 2
                      }}
                      onClick={() => setTempMonth(month)}
                    >
                      {month}
                    </div>
                  ))}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '12px',
                  color: '#999'
                }}>
                  月
                </div>
              </div>

              {/* 日ドラムロール */}
              <div style={{ flex: 1, position: 'relative' }}>
                <div
                  ref={dayScrollRef}
                  style={{
                    height: '100%',
                    overflowY: 'auto',
                    scrollSnapType: 'y mandatory',
                    WebkitOverflowScrolling: 'touch',
                    paddingTop: `${(220 - ITEM_HEIGHT) / 2}px`,
                    paddingBottom: `${(220 - ITEM_HEIGHT) / 2}px`
                  }}
                >
                  <div
                    style={{
                      height: `${ITEM_HEIGHT}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      scrollSnapAlign: 'center',
                      fontSize: '18px',
                      color: !tempDay ? '#1976d2' : '#999',
                      fontWeight: !tempDay ? 'bold' : 'normal',
                      cursor: 'pointer',
                      position: 'relative',
                      zIndex: 2
                    }}
                    onClick={() => setTempDay('')}
                  >
                    --
                  </div>
                  {dayOptions.map(day => (
                    <div
                      key={day}
                      style={{
                        height: `${ITEM_HEIGHT}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        scrollSnapAlign: 'center',
                        fontSize: '18px',
                        color: tempDay === day ? '#1976d2' : '#2c3e50',
                        fontWeight: tempDay === day ? 'bold' : 'normal',
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 2
                      }}
                      onClick={() => setTempDay(day)}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '12px',
                  color: '#999'
                }}>
                  日
                </div>
              </div>
            </div>

            {/* クリアボタン */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #eee' }}>
              <button
                onClick={() => {
                  setTempYear('');
                  setTempMonth('');
                  setTempDay('');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#666',
                  cursor: 'pointer'
                }}
              >
                クリア
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
