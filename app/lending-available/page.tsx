'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { useResponsive } from '@/lib/hooks/useResponsive';

// 機器カテゴリと機器の型
interface DeviceCategory {
  id: string;
  name: string;
  devices: Device[];
}

interface Device {
  id: string;
  name: string;
  availability: DepartmentAvailability[];
}

interface DepartmentAvailability {
  department: string;
  availableCount: number;
}

// モックデータ
const MOCK_CATEGORIES: DeviceCategory[] = [
  {
    id: 'pump',
    name: 'ポンプ関連',
    devices: [
      {
        id: 'infusion-pump',
        name: '輸液ポンプ',
        availability: [
          { department: 'ME室', availableCount: 5 },
          { department: '3階東病棟', availableCount: 2 },
          { department: '4階西病棟', availableCount: 1 },
        ],
      },
      {
        id: 'syringe-pump',
        name: 'シリンジポンプ',
        availability: [
          { department: 'ME室', availableCount: 8 },
          { department: 'ICU', availableCount: 3 },
          { department: '手術室', availableCount: 2 },
        ],
      },
      {
        id: 'pca-pump',
        name: 'PCAポンプ',
        availability: [
          { department: 'ME室', availableCount: 3 },
          { department: '緩和ケア病棟', availableCount: 1 },
        ],
      },
    ],
  },
  {
    id: 'inhaler',
    name: '吸入器関連',
    devices: [
      {
        id: 'nebulizer',
        name: 'ネブライザ',
        availability: [
          { department: 'ME室', availableCount: 10 },
          { department: '小児科病棟', availableCount: 4 },
          { department: '呼吸器内科', availableCount: 3 },
        ],
      },
      {
        id: 'oxygen-concentrator',
        name: '酸素濃縮器',
        availability: [
          { department: 'ME室', availableCount: 2 },
          { department: '呼吸器内科', availableCount: 1 },
        ],
      },
    ],
  },
  {
    id: 'monitor',
    name: 'モニター関連',
    devices: [
      {
        id: 'bedside-monitor',
        name: 'ベッドサイドモニター',
        availability: [
          { department: 'ME室', availableCount: 4 },
          { department: 'ICU', availableCount: 2 },
        ],
      },
      {
        id: 'ecg',
        name: '心電計',
        availability: [
          { department: 'ME室', availableCount: 6 },
          { department: '外来', availableCount: 2 },
          { department: '健診センター', availableCount: 1 },
        ],
      },
      {
        id: 'spo2-monitor',
        name: 'パルスオキシメーター',
        availability: [
          { department: 'ME室', availableCount: 15 },
          { department: '各病棟', availableCount: 20 },
        ],
      },
    ],
  },
  {
    id: 'life-support',
    name: '生命維持装置',
    devices: [
      {
        id: 'ventilator',
        name: '人工呼吸器',
        availability: [
          { department: 'ME室', availableCount: 2 },
          { department: 'ICU', availableCount: 1 },
        ],
      },
      {
        id: 'defibrillator',
        name: '除細動器',
        availability: [
          { department: 'ME室', availableCount: 3 },
          { department: '救急外来', availableCount: 2 },
        ],
      },
    ],
  },
];

export default function LendingAvailablePage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();

  // 選択状態
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  // 選択されたカテゴリ
  const selectedCategory = useMemo(() => {
    return MOCK_CATEGORIES.find(c => c.id === selectedCategoryId);
  }, [selectedCategoryId]);

  // 選択された機器
  const selectedDevice = useMemo(() => {
    return selectedCategory?.devices.find(d => d.id === selectedDeviceId);
  }, [selectedCategory, selectedDeviceId]);

  // 全部署リスト（重複排除）
  const allDepartments = useMemo(() => {
    const depts = new Set<string>();
    MOCK_CATEGORIES.forEach(cat => {
      cat.devices.forEach(device => {
        device.availability.forEach(av => {
          depts.add(av.department);
        });
      });
    });
    return Array.from(depts).sort();
  }, []);

  // フィルタされた在庫情報
  const filteredAvailability = useMemo(() => {
    if (!selectedDevice) return [];
    if (!selectedDepartment) return selectedDevice.availability;
    return selectedDevice.availability.filter(av => av.department === selectedDepartment);
  }, [selectedDevice, selectedDepartment]);

  // カテゴリ変更時
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedDeviceId('');
  };

  // レスポンシブスタイル
  const containerPadding = isMobile ? '12px' : '24px';
  const cardGap = isMobile ? '12px' : '24px';

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
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: cardGap,
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          {/* 左側: 機器選択エリア */}
          <div style={{
            flex: isMobile ? 'none' : 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            {/* 中分類選択 */}
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
                <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 'bold' }}>中分類</span>
                <span style={{ color: '#999', fontSize: '12px' }}>▽</span>
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
                      background: selectedCategoryId === category.id ? '#e3f2fd' : 'white',
                      border: selectedCategoryId === category.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: isMobile ? '13px' : '14px',
                      fontWeight: selectedCategoryId === category.id ? 'bold' : 'normal',
                      color: selectedCategoryId === category.id ? '#1976d2' : '#333',
                      transition: 'all 0.15s',
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 借用機器選択 */}
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
                <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 'bold' }}>借用機器選択</span>
                <span style={{ color: '#999', fontSize: '12px' }}>▽</span>
              </div>
              <div style={{ padding: '8px', minHeight: '120px' }}>
                {selectedCategory ? (
                  selectedCategory.devices.map(device => (
                    <button
                      key={device.id}
                      onClick={() => setSelectedDeviceId(device.id)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: isMobile ? '10px 12px' : '12px 16px',
                        background: selectedDeviceId === device.id ? '#e8f5e9' : 'white',
                        border: selectedDeviceId === device.id ? '2px solid #388e3c' : '1px solid #e0e0e0',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: isMobile ? '13px' : '14px',
                        fontWeight: selectedDeviceId === device.id ? 'bold' : 'normal',
                        color: selectedDeviceId === device.id ? '#388e3c' : '#333',
                        transition: 'all 0.15s',
                      }}
                    >
                      {device.name}
                    </button>
                  ))
                ) : (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: '#999',
                    fontSize: isMobile ? '12px' : '13px',
                  }}>
                    中分類を選択してください
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右側: 在庫情報エリア */}
          <div style={{
            flex: isMobile ? 'none' : 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            {/* 在庫部署フィルター */}
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
                <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 'bold' }}>在庫部署</span>
                <span style={{ color: '#999', fontSize: '12px' }}>▽</span>
              </div>
              <div style={{ padding: '12px 16px' }}>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '10px 12px' : '12px 16px',
                    fontSize: isMobile ? '13px' : '14px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">すべての部署</option>
                  {allDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 数量表示 */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #ddd',
              overflow: 'hidden',
              flex: 1,
            }}>
              <div style={{
                padding: '12px 16px',
                background: '#f8f9fa',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 'bold' }}>数量</span>
                {selectedDevice && (
                  <span style={{
                    fontSize: '12px',
                    color: '#666',
                    background: '#e0e0e0',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}>
                    {selectedDevice.name}
                  </span>
                )}
              </div>
              <div style={{ padding: '8px', minHeight: '200px' }}>
                {selectedDevice ? (
                  filteredAvailability.length > 0 ? (
                    filteredAvailability.map((av, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: isMobile ? '12px' : '16px',
                          background: index % 2 === 0 ? 'white' : '#fafafa',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          marginBottom: '8px',
                        }}
                      >
                        <span style={{
                          fontSize: isMobile ? '13px' : '14px',
                          color: '#333',
                        }}>
                          {av.department}
                        </span>
                        <span style={{
                          fontSize: isMobile ? '16px' : '18px',
                          fontWeight: 'bold',
                          color: av.availableCount > 0 ? '#1976d2' : '#999',
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {av.availableCount}<span style={{ fontSize: '12px', fontWeight: 'normal', marginLeft: '4px' }}>台</span>
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      padding: '24px',
                      textAlign: 'center',
                      color: '#999',
                      fontSize: isMobile ? '12px' : '13px',
                    }}>
                      選択した部署に在庫がありません
                    </div>
                  )
                ) : (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: '#999',
                    fontSize: isMobile ? '12px' : '13px',
                  }}>
                    機器を選択すると在庫数が表示されます
                  </div>
                )}
              </div>
            </div>

            {/* 合計表示 */}
            {selectedDevice && filteredAvailability.length > 0 && (
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
                  {filteredAvailability.reduce((sum, av) => sum + av.availableCount, 0)}
                  <span style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '4px' }}>台</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
