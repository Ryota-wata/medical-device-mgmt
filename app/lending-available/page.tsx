'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { useResponsive } from '@/lib/hooks/useResponsive';

// 貸出種別と対象機種の型
interface LendingCategory {
  id: string;
  name: string;
  devices: LendingDevice[];
}

interface LendingDevice {
  id: string;
  item: string;
  maker: string;
  model: string;
  availableCount: number;
}

// モックデータ
const MOCK_CATEGORIES: LendingCategory[] = [
  {
    id: 'infusion-pump',
    name: '輸液ポンプ（病棟貸出機）',
    devices: [
      { id: 'fp-n17a', item: '輸液ポンプ', maker: 'ニプロ', model: 'FP-N17a-NS', availableCount: 5 },
      { id: 'te-161s', item: '輸液ポンプ', maker: 'テルモ', model: 'TE-161S', availableCount: 3 },
      { id: 'pca-pump', item: 'PCAポンプ', maker: 'テルモ', model: 'TE-PCA2', availableCount: 4 },
    ],
  },
  {
    id: 'inhaler',
    name: '吸入器関連',
    devices: [
      { id: 'nebulizer-1', item: 'ネブライザ', maker: 'オムロン', model: 'NE-C803', availableCount: 10 },
      { id: 'oxygen', item: '酸素濃縮器', maker: 'フクダ電子', model: 'OC-3', availableCount: 2 },
    ],
  },
  {
    id: 'monitor',
    name: 'モニター関連',
    devices: [
      { id: 'bedside', item: 'ベッドサイドモニター', maker: '日本光電', model: 'BSM-6701', availableCount: 4 },
      { id: 'ecg', item: '心電計', maker: 'フクダ電子', model: 'FX-8322', availableCount: 6 },
      { id: 'spo2', item: 'パルスオキシメーター', maker: 'コニカミノルタ', model: 'PULSOX-Neo', availableCount: 15 },
    ],
  },
  {
    id: 'life-support',
    name: '生命維持装置',
    devices: [
      { id: 'ventilator', item: '人工呼吸器', maker: 'フィリップス', model: 'V60', availableCount: 2 },
      { id: 'defibrillator', item: '除細動器', maker: '日本光電', model: 'TEC-5631', availableCount: 3 },
    ],
  },
];

export default function LendingAvailablePage() {
  const router = useRouter();
  const { isMobile } = useResponsive();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // 選択されたカテゴリ
  const selectedCategory = useMemo(() => {
    return MOCK_CATEGORIES.find(c => c.id === selectedCategoryId);
  }, [selectedCategoryId]);

  // カテゴリの貸出可能合計
  const categoryTotal = useMemo(() => {
    if (!selectedCategory) return 0;
    return selectedCategory.devices.reduce((sum, d) => sum + d.availableCount, 0);
  }, [selectedCategory]);

  // カテゴリ変更時
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedDeviceId('');
  };

  const containerPadding = isMobile ? '12px' : '24px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#f5f5f5' }}>
      <Header
        title="貸出可能機器閲覧"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
      />

      <div style={{
        flex: 1,
        padding: containerPadding,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '640px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}>
        {/* 貸出種別名 */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #ddd',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px',
            background: '#f8f9fa',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 'bold' }}>貸出種別名</span>
            <span style={{ color: '#999', fontSize: '12px' }}>▼</span>
          </div>
          <div style={{ padding: '8px' }}>
            {MOCK_CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: isMobile ? '10px 12px' : '12px 16px',
                  background: selectedCategoryId === category.id ? '#fffde7' : 'white',
                  border: selectedCategoryId === category.id ? '2px solid #fdd835' : '1px solid #e0e0e0',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: selectedCategoryId === category.id ? 'bold' : 'normal',
                  color: '#333',
                  transition: 'all 0.15s',
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 貸出可能対象機種 */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #ddd',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px',
            background: '#f8f9fa',
            borderBottom: '1px solid #ddd',
          }}>
            <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 'bold' }}>貸出可能対象機種</span>
          </div>
          <div style={{ padding: '8px', minHeight: '120px' }}>
            {selectedCategory ? (
              selectedCategory.devices.map(device => {
                const isSelected = selectedDeviceId === device.id;
                return (
                  <button
                    key={device.id}
                    onClick={() => setSelectedDeviceId(device.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      padding: '0',
                      background: 'none',
                      border: 'none',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                      overflow: 'hidden',
                    }}
                  >
                    {/* 機種情報 */}
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? '12px' : '16px',
                      padding: isMobile ? '10px 12px' : '12px 16px',
                      background: isSelected ? '#fffde7' : 'white',
                      border: isSelected ? '2px solid #fdd835' : '1px solid #e0e0e0',
                      borderRadius: '6px 0 0 6px',
                      borderRight: 'none',
                      minWidth: 0,
                    }}>
                      <span style={{
                        fontSize: isMobile ? '13px' : '14px',
                        fontWeight: isSelected ? 'bold' : 'normal',
                        color: '#333',
                        whiteSpace: 'nowrap',
                      }}>
                        {device.item}
                      </span>
                      <span style={{
                        fontSize: isMobile ? '12px' : '13px',
                        color: '#666',
                        whiteSpace: 'nowrap',
                      }}>
                        {device.maker}
                      </span>
                      <span style={{
                        fontSize: isMobile ? '12px' : '13px',
                        color: '#666',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {device.model}
                      </span>
                    </div>
                    {/* 数量バッジ */}
                    <div style={{
                      padding: isMobile ? '10px 12px' : '12px 16px',
                      background: isSelected ? '#fdd835' : '#e0e0e0',
                      borderRadius: '0 6px 6px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      whiteSpace: 'nowrap',
                      fontVariantNumeric: 'tabular-nums',
                      alignSelf: 'stretch',
                    }}>
                      <span style={{
                        fontSize: isMobile ? '16px' : '18px',
                        fontWeight: 'bold',
                        color: '#333',
                      }}>
                        {device.availableCount}
                      </span>
                      <span style={{ fontSize: '12px', color: '#555' }}>台</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                color: '#999',
                fontSize: isMobile ? '12px' : '13px',
              }}>
                貸出種別名を選択してください
              </div>
            )}
          </div>
        </div>

        {/* 貸出可能合計 */}
        {selectedCategory && (
          <div style={{
            background: '#1976d2',
            borderRadius: '8px',
            padding: isMobile ? '16px' : '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'white',
          }}>
            <span style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 'bold' }}>
              貸出可能合計
            </span>
            <span style={{
              fontSize: isMobile ? '24px' : '28px',
              fontWeight: 'bold',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {categoryTotal}
              <span style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '4px' }}>台</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
