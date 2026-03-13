'use client';

import { useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';

function InspectionPrepContent() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();

  // ダウンロード状態
  const [downloadStatus, setDownloadStatus] = useState<'none' | 'downloading' | 'completed'>('none');
  const [lastDownloadTime, setLastDownloadTime] = useState<string | null>(null);
  const [assetCount, setAssetCount] = useState(0);
  const [menuCount, setMenuCount] = useState(0);

  // 送信状態
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const handleDownloadData = async () => {
    setDownloadStatus('downloading');

    // TODO: 実際のダウンロード処理（IndexedDBへの保存）
    // 1. 原本資産データを取得してIndexedDBに保存
    // 2. 日常点検メニューを取得してIndexedDBに保存

    // モック: 2秒後に完了
    setTimeout(() => {
      const now = new Date().toLocaleString('ja-JP');
      setDownloadStatus('completed');
      setLastDownloadTime(now);
      setAssetCount(1234);
      setMenuCount(45);
    }, 2000);
  };

  const handleSyncData = async () => {
    if (!isOnline) {
      alert('オフライン状態のため送信できません。オンラインに接続してください。');
      return;
    }

    // TODO: 実際の同期処理
    // 1. IndexedDBから未送信の点検結果を取得
    // 2. サーバーに送信
    // 3. 送信成功したらIndexedDBから削除

    alert('点検結果を送信しました');
    setUnsyncedCount(0);
    setLastSyncTime(new Date().toLocaleString('ja-JP'));
  };

  const handleBack = () => {
    router.push('/main');
  };

  const handleStartInspection = () => {
    if (downloadStatus !== 'completed' && !isOnline) {
      alert('オフライン状態でデータがダウンロードされていません。先にデータをダウンロードしてください。');
      return;
    }
    router.push('/daily-inspection');
  };

  const getDownloadStatusText = () => {
    switch (downloadStatus) {
      case 'none':
        return '未ダウンロード';
      case 'downloading':
        return 'ダウンロード中...';
      case 'completed':
        return '最新';
    }
  };

  const getDownloadStatusColor = () => {
    switch (downloadStatus) {
      case 'none':
        return '#e74c3c';
      case 'downloading':
        return '#f39c12';
      case 'completed':
        return '#27ae60';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#f5f5f5' }}>
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
            日常点検 - オフライン準備
          </h1>
        </div>
        {!isMobile && <div style={{ width: isTablet ? '150px' : '200px' }}></div>}
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: isMobile ? '20px 12px 140px 12px' : isTablet ? '28px 20px 140px 20px' : '38px 40px 140px 40px',
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
          {/* オンライン環境向けスキップ案内 */}
          <div style={{
            backgroundColor: '#e3f2fd',
            border: '1px solid #90caf9',
            borderRadius: '8px',
            padding: isMobile ? '16px' : '20px',
            marginBottom: isMobile ? '24px' : '32px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}>
            <div>
              <div style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: 600, color: '#1565c0', marginBottom: '4px' }}>
                オンライン環境で実施する場合
              </div>
              <div style={{ fontSize: isMobile ? '12px' : '13px', color: '#1976d2', lineHeight: '1.5' }}>
                ネットワーク接続がある環境ではダウンロード不要です。そのまま点検を開始できます。
              </div>
            </div>
            <button
              onClick={handleStartInspection}
              style={{
                padding: isMobile ? '12px 20px' : '10px 24px',
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#1976d2',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: '44px',
              }}
            >
              ダウンロードをスキップして点検開始
            </button>
          </div>

          {/* データダウンロードセクション */}
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
              点検メニュー　データダウンロード（オフライン用）
            </h2>

            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: isMobile ? '12px 16px' : isTablet ? '14px 18px' : '16px 20px',
              marginBottom: isMobile ? '12px' : '16px'
            }}>
              <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#666666', lineHeight: '1.6', marginBottom: '8px' }}>
                オフライン環境で日常点検を実施する場合は、事前にデータをダウンロードしてください。
              </p>
              <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#666666', lineHeight: '1.6', margin: 0 }}>
                ダウンロード後、ネットワーク接続がなくても点検を実施できます。
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
                <span style={{ color: getDownloadStatusColor(), fontWeight: 600 }}>
                  {getDownloadStatusText()}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: isMobile ? '8px 0' : '10px 0',
                fontSize: isMobile ? '13px' : '14px'
              }}>
                <span style={{ color: '#666666', fontWeight: 500 }}>最終更新:</span>
                <span style={{ color: '#333333', fontWeight: 600 }}>
                  {lastDownloadTime || '-'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: isMobile ? '8px 0' : '10px 0',
                fontSize: isMobile ? '13px' : '14px'
              }}>
                <span style={{ color: '#666666', fontWeight: 500 }}>データ件数:</span>
                <span style={{ color: '#333333', fontWeight: 600 }}>
                  {downloadStatus === 'completed'
                    ? `資産: ${assetCount.toLocaleString()}件 / 点検メニュー: ${menuCount}件`
                    : '-'
                  }
                </span>
              </div>
            </div>

            <button
              onClick={handleDownloadData}
              disabled={downloadStatus === 'downloading'}
              style={{
                width: '100%',
                padding: isMobile ? '14px 20px' : '16px 24px',
                fontSize: isMobile ? '15px' : '16px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: downloadStatus === 'downloading' ? '#95a5a6' : '#27ae60',
                border: 'none',
                borderRadius: '8px',
                cursor: downloadStatus === 'downloading' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(39, 174, 96, 0.2)'
              }}
            >
              <span style={{ fontSize: isMobile ? '16px' : '18px' }}>
                {downloadStatus === 'downloading' ? '⏳' : '📥'}
              </span>
              <span>
                {downloadStatus === 'downloading' ? 'ダウンロード中...' : 'データをダウンロード'}
              </span>
            </button>
          </div>

          {/* データ送信セクション */}
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
              点検結果送信
            </h2>

            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: isMobile ? '12px 16px' : isTablet ? '14px 18px' : '16px 20px',
              marginBottom: isMobile ? '12px' : '16px'
            }}>
              <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#666666', lineHeight: '1.6', marginBottom: '8px' }}>
                オフラインで実施した点検結果をサーバーに送信します。
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
                <span style={{
                  color: unsyncedCount > 0 ? '#f39c12' : '#27ae60',
                  fontWeight: 600
                }}>
                  {unsyncedCount}件
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: isMobile ? '8px 0' : '10px 0',
                fontSize: isMobile ? '13px' : '14px'
              }}>
                <span style={{ color: '#666666', fontWeight: 500 }}>最終送信:</span>
                <span style={{ color: '#333333', fontWeight: 600 }}>
                  {lastSyncTime || '-'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: isMobile ? '8px 0' : '10px 0',
                fontSize: isMobile ? '13px' : '14px'
              }}>
                <span style={{ color: '#666666', fontWeight: 500 }}>接続状態:</span>
                <span style={{
                  color: isOnline ? '#27ae60' : '#e74c3c',
                  fontWeight: 600
                }}>
                  {isOnline ? 'オンライン' : 'オフライン'}
                </span>
              </div>
            </div>

            <button
              onClick={handleSyncData}
              disabled={unsyncedCount === 0}
              style={{
                width: '100%',
                padding: isMobile ? '14px 20px' : '16px 24px',
                fontSize: isMobile ? '15px' : '16px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: unsyncedCount === 0 ? '#95a5a6' : '#3498db',
                border: 'none',
                borderRadius: '8px',
                cursor: unsyncedCount === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(52, 152, 219, 0.2)'
              }}
            >
              <span style={{ fontSize: isMobile ? '16px' : '18px' }}>📤</span>
              <span>点検結果を送信</span>
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
        paddingBottom: isMobile ? 'max(16px, env(safe-area-inset-bottom))' : isTablet ? 'max(18px, env(safe-area-inset-bottom))' : 'max(20px, env(safe-area-inset-bottom))',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
        boxSizing: 'border-box'
      }}>
        <button
          onClick={handleBack}
          aria-label="メイン画面に戻る"
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
            transition: 'background 0.2s',
            minWidth: '44px',
            minHeight: '44px'
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
          onClick={handleStartInspection}
          aria-label="点検開始"
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
            transition: 'background 0.2s',
            minWidth: '44px',
            minHeight: '44px'
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
              borderLeft: isMobile ? '8px solid #27ae60' : '10px solid #27ae60',
              borderTop: isMobile ? '5px solid transparent' : '6px solid transparent',
              borderBottom: isMobile ? '5px solid transparent' : '6px solid transparent'
            }}></div>
          </div>
          <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#27ae60', fontWeight: 600 }}>点検開始</span>
        </button>
      </footer>
    </div>
  );
}

export default function InspectionPrepPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>Loading...</div>}>
      <InspectionPrepContent />
    </Suspense>
  );
}
