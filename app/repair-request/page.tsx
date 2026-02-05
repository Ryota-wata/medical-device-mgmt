'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useAuthStore } from '@/lib/stores/authStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface DeviceInfo {
  qrCode: string;
  itemName: string;
  maker: string;
  model: string;
  serialNo: string;
  department: string;
  roomName: string;
  photoUrl?: string;
}

function RepairRequestContent() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { user } = useAuthStore();

  // 自動生成項目
  const [requestNo] = useState(() => `REP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);
  const [requestDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [requestTime] = useState(() => new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));

  // 申請者情報
  const [applicantDepartment, setApplicantDepartment] = useState(user?.hospital || '');
  const [applicantName, setApplicantName] = useState(user?.username || '');

  // 機器情報
  const [isRegisteredAsset, setIsRegisteredAsset] = useState(true);
  const [qrCode, setQrCode] = useState('');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isQrScanning, setIsQrScanning] = useState(false);

  // 未登録資産用の手入力フィールド
  const [manualItemName, setManualItemName] = useState('');
  const [manualMaker, setManualMaker] = useState('');
  const [manualModel, setManualModel] = useState('');
  const [manualSerialNo, setManualSerialNo] = useState('');
  const [manualDepartment, setManualDepartment] = useState('');
  const [manualRoomName, setManualRoomName] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // 症状・代替機
  const [symptoms, setSymptoms] = useState('');
  const [alternativeDevice, setAlternativeDevice] = useState<'needed' | 'not_needed' | 'requested'>('not_needed');

  // UI状態
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ダミーの機器データ（QRコード読み取り時に使用）
  const mockDeviceData: Record<string, DeviceInfo> = {
    'QR-001': {
      qrCode: 'QR-001',
      itemName: '人工呼吸器',
      maker: 'フクダ電子',
      model: 'RES-500',
      serialNo: 'SN-2024-001',
      department: '集中治療室',
      roomName: 'ICU-1',
      photoUrl: '/images/device-placeholder.png'
    },
    'QR-002': {
      qrCode: 'QR-002',
      itemName: '輸液ポンプ',
      maker: 'テルモ',
      model: 'TE-361',
      serialNo: 'SN-2024-002',
      department: '外科病棟',
      roomName: '301号室',
      photoUrl: '/images/device-placeholder.png'
    }
  };

  // QRコード読み取りシミュレーション
  const handleQrScan = () => {
    setIsQrScanning(true);
    // 実際のアプリではカメラAPIを使用
    setTimeout(() => {
      const mockQr = 'QR-001';
      setQrCode(mockQr);
      setDeviceInfo(mockDeviceData[mockQr] || null);
      setIsQrScanning(false);
    }, 1500);
  };

  // QRコード手入力
  const handleQrInput = (value: string) => {
    setQrCode(value);
    if (mockDeviceData[value]) {
      setDeviceInfo(mockDeviceData[value]);
    } else {
      setDeviceInfo(null);
    }
  };

  // 写真撮影（モバイル用）
  const handlePhotoCapture = () => {
    // 実際のアプリではカメラAPIを使用
    setCapturedPhoto('/images/captured-placeholder.png');
  };

  // フォームの入力状態チェック
  const isFormDirty = qrCode !== '' || symptoms !== '' || manualItemName !== '' || capturedPhoto !== null;

  const handleHomeClick = () => {
    if (isFormDirty) {
      setShowHomeConfirm(true);
    } else {
      router.push('/main');
    }
  };

  // 申請送信
  const handleSubmit = async () => {
    if (!symptoms.trim()) {
      alert('症状を入力してください');
      return;
    }

    if (isRegisteredAsset && !deviceInfo) {
      alert('機器情報を読み込んでください');
      return;
    }

    setIsSubmitting(true);

    // 送信データ作成
    const requestData = {
      requestNo,
      requestDate,
      requestTime,
      applicantDepartment,
      applicantName,
      isRegisteredAsset,
      device: isRegisteredAsset ? deviceInfo : {
        itemName: manualItemName,
        maker: manualMaker,
        model: manualModel,
        serialNo: manualSerialNo,
        department: manualDepartment,
        roomName: manualRoomName,
        photoUrl: capturedPhoto
      },
      symptoms,
      alternativeDevice,
      status: '依頼受付'
    };

    console.log('修理依頼データ:', requestData);

    // 送信シミュレーション
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setSubmitSuccess(true);
  };

  // 送信成功後の表示
  if (submitSuccess) {
    return (
      <div style={{
        minHeight: '100dvh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: isMobile ? '32px 24px' : '48px',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#d4edda',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '40px'
          }}>
            ✓
          </div>
          <h2 style={{
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: 'bold',
            color: '#2c3e50',
            marginBottom: '16px'
          }}>
            修理依頼を送信しました
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#5a6c7d',
            marginBottom: '8px'
          }}>
            依頼番号: <strong>{requestNo}</strong>
          </p>
          <p style={{
            fontSize: '13px',
            color: '#7a8a9a',
            marginBottom: '32px'
          }}>
            担当者より折り返しご連絡いたします。<br />
            修理ステータス画面で進捗を確認できます。
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => router.push('/main')}
              style={{
                padding: '14px 24px',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              メイン画面に戻る
            </button>
            <button
              onClick={() => {
                setSubmitSuccess(false);
                setQrCode('');
                setDeviceInfo(null);
                setSymptoms('');
                setAlternativeDevice('not_needed');
                setManualItemName('');
                setManualMaker('');
                setManualModel('');
                setManualSerialNo('');
                setManualDepartment('');
                setManualRoomName('');
                setCapturedPhoto(null);
              }}
              style={{
                padding: '14px 24px',
                backgroundColor: 'white',
                color: '#34495e',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              続けて依頼する
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* ヘッダー */}
      <header style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: isMobile ? '12px 16px' : '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <button
            onClick={handleHomeClick}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← 戻る
          </button>
          <h1 style={{
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: 'bold',
            margin: 0
          }}>
            修理依頼
          </h1>
          <div style={{ width: '80px' }} />
        </div>
      </header>

      {/* メインコンテンツ */}
      <main style={{
        flex: 1,
        padding: isMobile ? '16px' : '24px',
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        {/* ① 依頼情報（自動生成） */}
        <section style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: isMobile ? '16px' : '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#7a8a9a',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              backgroundColor: '#3498db',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}>1</span>
            依頼情報
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '12px'
          }}>
            <div>
              <label style={{ fontSize: '12px', color: '#7a8a9a', display: 'block', marginBottom: '4px' }}>
                修理依頼No.
              </label>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#2c3e50',
                padding: '8px 12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px'
              }}>
                {requestNo}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#7a8a9a', display: 'block', marginBottom: '4px' }}>
                依頼日
              </label>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#2c3e50',
                padding: '8px 12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px'
              }}>
                {requestDate}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#7a8a9a', display: 'block', marginBottom: '4px' }}>
                依頼時間
              </label>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#2c3e50',
                padding: '8px 12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px'
              }}>
                {requestTime}
              </div>
            </div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '12px',
            marginTop: '12px'
          }}>
            <div>
              <label style={{ fontSize: '12px', color: '#7a8a9a', display: 'block', marginBottom: '4px' }}>
                申請部署 <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="text"
                value={applicantDepartment}
                onChange={(e) => setApplicantDepartment(e.target.value)}
                placeholder="例: 外科病棟"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#7a8a9a', display: 'block', marginBottom: '4px' }}>
                申請者 <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="例: 山田太郎"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </section>

        {/* ② 機器情報 */}
        <section style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: isMobile ? '16px' : '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#7a8a9a',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              backgroundColor: '#3498db',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}>2</span>
            機器情報
          </h2>

          {/* 登録済み/未登録切り替え */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <button
              onClick={() => setIsRegisteredAsset(true)}
              style={{
                flex: 1,
                padding: '10px',
                border: isRegisteredAsset ? '2px solid #3498db' : '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: isRegisteredAsset ? '#ebf5fb' : 'white',
                color: isRegisteredAsset ? '#3498db' : '#7a8a9a',
                fontWeight: isRegisteredAsset ? '600' : '400',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              登録済み資産
            </button>
            <button
              onClick={() => setIsRegisteredAsset(false)}
              style={{
                flex: 1,
                padding: '10px',
                border: !isRegisteredAsset ? '2px solid #e67e22' : '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: !isRegisteredAsset ? '#fef5e7' : 'white',
                color: !isRegisteredAsset ? '#e67e22' : '#7a8a9a',
                fontWeight: !isRegisteredAsset ? '600' : '400',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              未登録資産
            </button>
          </div>

          {isRegisteredAsset ? (
            /* 登録済み資産の場合 */
            <>
              {/* QRコード読み取り */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#7a8a9a', display: 'block', marginBottom: '8px' }}>
                  QRラベル
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={qrCode}
                    onChange={(e) => handleQrInput(e.target.value)}
                    placeholder="QRコードを入力"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    onClick={handleQrScan}
                    disabled={isQrScanning}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      opacity: isQrScanning ? 0.7 : 1
                    }}
                  >
                    {isQrScanning ? '読取中...' : '📷 読取'}
                  </button>
                </div>
              </div>

              {/* 読み取った機器情報 */}
              {deviceInfo && (
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #e0e0e0'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr',
                    gap: '16px'
                  }}>
                    {/* 機器写真 */}
                    <div style={{
                      width: isMobile ? '100%' : '120px',
                      height: isMobile ? '150px' : '120px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#7a8a9a',
                      fontSize: '40px'
                    }}>
                      📷
                    </div>
                    {/* 機器詳細 */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(2, 1fr)',
                      gap: '8px'
                    }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#7a8a9a' }}>品目</span>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>{deviceInfo.itemName}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#7a8a9a' }}>メーカー</span>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>{deviceInfo.maker}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#7a8a9a' }}>型式</span>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>{deviceInfo.model}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#7a8a9a' }}>シリアルNo.</span>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>{deviceInfo.serialNo}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#7a8a9a' }}>設置部署</span>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>{deviceInfo.department}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#7a8a9a' }}>室名</span>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#2c3e50' }}>{deviceInfo.roomName}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* 未登録資産の場合 */
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: '12px'
              }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#7a8a9a', display: 'block', marginBottom: '4px' }}>
                    品目
                  </label>
                  <input
                    type="text"
                    value={manualItemName}
                    onChange={(e) => setManualItemName(e.target.value)}
                    placeholder="例: 人工呼吸器"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#7a8a9a', display: 'block', marginBottom: '4px' }}>
                    メーカー
                  </label>
                  <input
                    type="text"
                    value={manualMaker}
                    onChange={(e) => setManualMaker(e.target.value)}
                    placeholder="例: フクダ電子"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#7a8a9a', display: 'block', marginBottom: '4px' }}>
                    型式
                  </label>
                  <input
                    type="text"
                    value={manualModel}
                    onChange={(e) => setManualModel(e.target.value)}
                    placeholder="例: RES-500"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#7a8a9a', display: 'block', marginBottom: '4px' }}>
                    シリアルNo.
                  </label>
                  <input
                    type="text"
                    value={manualSerialNo}
                    onChange={(e) => setManualSerialNo(e.target.value)}
                    placeholder="例: SN-2024-001"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#7a8a9a', display: 'block', marginBottom: '4px' }}>
                    設置部署
                  </label>
                  <input
                    type="text"
                    value={manualDepartment}
                    onChange={(e) => setManualDepartment(e.target.value)}
                    placeholder="例: 外科病棟"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#7a8a9a', display: 'block', marginBottom: '4px' }}>
                    室名
                  </label>
                  <input
                    type="text"
                    value={manualRoomName}
                    onChange={(e) => setManualRoomName(e.target.value)}
                    placeholder="例: 301号室"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* 写真撮影（モバイル用） */}
              {isMobile && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '12px', color: '#7a8a9a', display: 'block', marginBottom: '8px' }}>
                    機器写真
                  </label>
                  {capturedPhoto ? (
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '200px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '48px' }}>📷</span>
                      <button
                        onClick={() => setCapturedPhoto(null)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          padding: '4px 8px',
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        削除
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handlePhotoCapture}
                      style={{
                        width: '100%',
                        padding: '24px',
                        backgroundColor: '#f8f9fa',
                        border: '2px dashed #ddd',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span style={{ fontSize: '32px' }}>📷</span>
                      <span style={{ fontSize: '14px', color: '#7a8a9a' }}>タップして写真を撮影</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* ③ 症状 */}
        <section style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: isMobile ? '16px' : '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#7a8a9a',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              backgroundColor: '#3498db',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}>3</span>
            症状 <span style={{ color: '#e74c3c' }}>*</span>
          </h2>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="機器の症状や不具合の詳細を入力してください"
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </section>

        {/* ④ 代替機 */}
        <section style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: isMobile ? '16px' : '20px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#7a8a9a',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              backgroundColor: '#3498db',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}>4</span>
            代替機
          </h2>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {[
              { value: 'not_needed', label: '不要' },
              { value: 'needed', label: '必要' },
              { value: 'requested', label: '依頼済' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setAlternativeDevice(option.value as typeof alternativeDevice)}
                style={{
                  flex: isMobile ? '1' : 'none',
                  padding: '12px 24px',
                  border: alternativeDevice === option.value ? '2px solid #27ae60' : '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: alternativeDevice === option.value ? '#e8f8f0' : 'white',
                  color: alternativeDevice === option.value ? '#27ae60' : '#5a6c7d',
                  fontWeight: alternativeDevice === option.value ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* 送信ボタン */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: isSubmitting ? '#95a5a6' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            marginBottom: '32px'
          }}
        >
          {isSubmitting ? '送信中...' : '修理依頼を送信'}
        </button>
      </main>

      {/* 確認ダイアログ */}
      <ConfirmDialog
        isOpen={showHomeConfirm}
        onClose={() => setShowHomeConfirm(false)}
        onConfirm={() => router.push('/main')}
        title="メイン画面に戻る"
        message="入力内容が破棄されます。メイン画面に戻りますか？"
        confirmLabel="メイン画面に戻る"
        cancelLabel="入力を続ける"
        variant="warning"
      />
    </div>
  );
}

export default function RepairRequestPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <RepairRequestContent />
    </Suspense>
  );
}
