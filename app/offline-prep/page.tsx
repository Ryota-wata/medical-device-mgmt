'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';

export default function OfflinePrepPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();

  const [downloadStatus, setDownloadStatus] = useState('✓ 最新');
  const [lastDownloadTime, setLastDownloadTime] = useState('2025/06/02 10:30');
  const [dataCount, setDataCount] = useState('施設:125件 / 資産:1,234件');

  const [unsyncedCount, setUnsyncedCount] = useState('25件');
  const [lastSyncTime, setLastSyncTime] = useState('2025/06/01 18:45');
  const [connectionStatus, setConnectionStatus] = useState('✓ オンライン');

  const handleDownloadMaster = () => {
    alert('マスタデータをダウンロードします（この機能は実装予定）');
  };

  const handleSyncData = () => {
    alert('データを送信します（この機能は実装予定）');
  };

  const handleBack = () => {
    router.back();
  };

  const handleStartSurvey = () => {
    router.push('/survey-location');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        color: 'white',
        padding: isMobile ? '12px 16px' : isTablet ? '14px 20px' : '16px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isMobile ? 'center' : 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '8px' : '0'
      }}>
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: isTablet ? '10px' : '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #27ae60, #229954)',
              padding: isTablet ? '6px 10px' : '8px 12px',
              borderRadius: '6px',
              fontSize: isTablet ? '12px' : '14px',
              fontWeight: 700,
              letterSpacing: '1px'
            }}>
              SHIP
            </div>
            <div style={{ fontSize: isTablet ? '14px' : '16px', fontWeight: 500 }}>
              HEALTHCARE 医療機器管理システム
            </div>
          </div>
        )}
        <div style={{ flex: isMobile ? '0' : '1', display: 'flex', justifyContent: 'center' }}>
          <h1 style={{ fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px', fontWeight: 600, margin: 0 }}>
            現有品調査 - オフライン準備
          </h1>
        </div>
        {!isMobile && <div style={{ width: isTablet ? '150px' : '200px' }}></div>}
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: isMobile ? '20px 12px 120px 12px' : isTablet ? '28px 20px 120px 20px' : '38px 40px 120px 40px',
        overflowY: 'auto'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: isMobile ? '8px' : '12px',
          padding: isMobile ? '20px 16px' : isTablet ? '28px 24px' : '36px 40px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {/* Master Data Download Section */}
          <div style={{
            marginBottom: isMobile ? '24px' : '32px',
            paddingBottom: isMobile ? '24px' : '32px',
            borderBottom: '2px solid #f0f0f0'
          }}>
            <h2 style={{
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 600,
              color: '#333333',
              marginBottom: isMobile ? '12px' : '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: isMobile ? '18px' : '20px' }}>📥</span>
              マスタデータダウンロード
            </h2>

            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: isMobile ? '12px 16px' : isTablet ? '14px 18px' : '16px 20px',
              marginBottom: isMobile ? '12px' : '16px'
            }}>
              <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#666666', lineHeight: '1.6', marginBottom: '8px' }}>
                オフライン環境で現有品調査を実施する場合は、事前にマスタデータをダウンロードしてください。
              </p>
              <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#666666', lineHeight: '1.6', margin: 0 }}>
                ダウンロード後、タブレット/スマートフォンがオフラインでも調査画面の選択肢が表示されます。
              </p>
            </div>

            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: isMobile ? '12px 16px' : isTablet ? '14px 18px' : '16px 20px',
              marginBottom: isMobile ? '12px' : '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: isMobile ? '8px 0' : '10px 0',
                fontSize: isMobile ? '13px' : '14px'
              }}>
                <span style={{ color: '#666666', fontWeight: 500 }}>ダウンロード状態:</span>
                <span style={{ color: '#27ae60', fontWeight: 600 }}>{downloadStatus}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: isMobile ? '8px 0' : '10px 0',
                fontSize: isMobile ? '13px' : '14px'
              }}>
                <span style={{ color: '#666666', fontWeight: 500 }}>最終更新:</span>
                <span style={{ color: '#333333', fontWeight: 600 }}>{lastDownloadTime}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: isMobile ? '8px 0' : '10px 0',
                fontSize: isMobile ? '13px' : '14px'
              }}>
                <span style={{ color: '#666666', fontWeight: 500 }}>データ件数:</span>
                <span style={{ color: '#333333', fontWeight: 600 }}>{dataCount}</span>
              </div>
            </div>

            <button
              onClick={handleDownloadMaster}
              style={{
                width: '100%',
                padding: isMobile ? '14px 20px' : '16px 24px',
                fontSize: isMobile ? '15px' : '16px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#27ae60',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(39, 174, 96, 0.2)'
              }}
            >
              <span style={{ fontSize: isMobile ? '16px' : '18px' }}>📥</span>
              <span>マスタデータをダウンロード</span>
            </button>
          </div>

          {/* Data Synchronization Section */}
          <div>
            <h2 style={{
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 600,
              color: '#333333',
              marginBottom: isMobile ? '12px' : '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: isMobile ? '18px' : '20px' }}>📤</span>
              オフライン調査データ送信
            </h2>

            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: isMobile ? '12px 16px' : isTablet ? '14px 18px' : '16px 20px',
              marginBottom: isMobile ? '12px' : '16px'
            }}>
              <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#666666', lineHeight: '1.6', marginBottom: '8px' }}>
                オフライン環境で登録した調査データをシステムに送信します。
              </p>
              <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#666666', lineHeight: '1.6', margin: 0 }}>
                送信前にオンライン環境に接続していることを確認してください。
              </p>
            </div>

            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: isMobile ? '12px 16px' : isTablet ? '14px 18px' : '16px 20px',
              marginBottom: isMobile ? '12px' : '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: isMobile ? '8px 0' : '10px 0',
                fontSize: isMobile ? '13px' : '14px'
              }}>
                <span style={{ color: '#666666', fontWeight: 500 }}>未送信データ:</span>
                <span style={{ color: '#f39c12', fontWeight: 600 }}>{unsyncedCount}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: isMobile ? '8px 0' : '10px 0',
                fontSize: isMobile ? '13px' : '14px'
              }}>
                <span style={{ color: '#666666', fontWeight: 500 }}>最終送信:</span>
                <span style={{ color: '#333333', fontWeight: 600 }}>{lastSyncTime}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: isMobile ? '8px 0' : '10px 0',
                fontSize: isMobile ? '13px' : '14px'
              }}>
                <span style={{ color: '#666666', fontWeight: 500 }}>接続状態:</span>
                <span style={{ color: '#27ae60', fontWeight: 600 }}>{connectionStatus}</span>
              </div>
            </div>

            <button
              onClick={handleSyncData}
              style={{
                width: '100%',
                padding: isMobile ? '14px 20px' : '16px 24px',
                fontSize: isMobile ? '15px' : '16px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#3498db',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(52, 152, 219, 0.2)'
              }}
            >
              <span style={{ fontSize: isMobile ? '16px' : '18px' }}>📤</span>
              <span>データを送信</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #dee2e6',
        padding: isMobile ? '16px 16px' : isTablet ? '18px 20px' : '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
        height: isMobile ? '90px' : isTablet ? '100px' : '110px',
        boxSizing: 'border-box'
      }}>
        <button
          onClick={handleBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isMobile ? '4px' : '5px',
            padding: isMobile ? '6px' : '8px',
            borderRadius: '8px',
            transition: 'background 0.2s'
          }}
        >
          <div style={{
            background: '#ecf0f1',
            borderRadius: '50%',
            width: isMobile ? '44px' : isTablet ? '48px' : '52px',
            height: isMobile ? '44px' : isTablet ? '48px' : '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: 0,
              height: 0,
              borderRight: isMobile ? '8px solid #34495e' : '10px solid #34495e',
              borderTop: isMobile ? '5px solid transparent' : '6px solid transparent',
              borderBottom: isMobile ? '5px solid transparent' : '6px solid transparent'
            }}></div>
          </div>
          <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#2c3e50' }}>戻る</span>
        </button>

        <button
          onClick={handleStartSurvey}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isMobile ? '4px' : '5px',
            padding: isMobile ? '6px' : '8px',
            borderRadius: '8px',
            transition: 'background 0.2s'
          }}
        >
          <div style={{
            background: '#d5f4e6',
            borderRadius: '50%',
            width: isMobile ? '44px' : isTablet ? '48px' : '52px',
            height: isMobile ? '44px' : isTablet ? '48px' : '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: 0,
              height: 0,
              borderLeft: isMobile ? '8px solid #34495e' : '10px solid #34495e',
              borderTop: isMobile ? '5px solid transparent' : '6px solid transparent',
              borderBottom: isMobile ? '5px solid transparent' : '6px solid transparent'
            }}></div>
          </div>
          <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#27ae60', fontWeight: 600 }}>調査開始</span>
        </button>
      </footer>
    </div>
  );
}
