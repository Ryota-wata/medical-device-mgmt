'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, Suspense, useMemo, useEffect } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { Asset } from '@/lib/types/asset';
import { useInspectionStore } from '@/lib/stores';

// モック: 原本資産データ（実際はIndexedDBまたはAPIから取得）
const MOCK_ORIGINAL_ASSETS: Asset[] = [
  {
    qrCode: 'QR001234',
    no: 1,
    facility: '本院',
    building: '本館',
    floor: '3F',
    department: '内科',
    section: '外来',
    category: 'ME機器',
    largeClass: '生体情報モニタ',
    mediumClass: 'ベッドサイドモニタ',
    item: '輸液ポンプ',
    name: '輸液ポンプ TE-161',
    maker: 'テルモ',
    model: 'TE-161',
    quantity: 1,
    width: 130,
    depth: 180,
    height: 220,
  },
  {
    qrCode: 'QR001235',
    no: 2,
    facility: '本院',
    building: '本館',
    floor: '3F',
    department: '内科',
    section: '外来',
    category: 'ME機器',
    largeClass: '生体情報モニタ',
    mediumClass: 'ベッドサイドモニタ',
    item: 'シリンジポンプ',
    name: 'シリンジポンプ TE-351',
    maker: 'テルモ',
    model: 'TE-351',
    quantity: 1,
    width: 100,
    depth: 150,
    height: 80,
  },
];

interface InspectionItemResult {
  itemName: string;
  content: string;
  result: '合' | '否' | string;
  unit?: string;
}

const DEFAULT_ITEMS: InspectionItemResult[] = [
  { itemName: '清掃', content: '本体の清掃', result: '' },
  { itemName: '外装点検', content: 'ACインレット', result: '' },
  { itemName: '外装点検', content: 'スライダー', result: '' },
  { itemName: '性能点検', content: '閉塞圧測定', result: '', unit: 'kPa' },
  { itemName: '性能点検', content: '流量測定', result: '', unit: 'ml' },
];

type Step = 'qr-scan' | 'inspection';

function DailyInspectionContent() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const { menus } = useInspectionStore();
  const videoRef = useRef<HTMLVideoElement>(null);

  // ステップ管理
  const [step, setStep] = useState<Step>('qr-scan');

  // QRスキャン状態
  const [qrCode, setQrCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // 点検実施状態
  const [inspectorName, setInspectorName] = useState('');
  const [usageTiming, setUsageTiming] = useState<'使用前' | '使用中' | '使用後'>('使用前');
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [itemResults, setItemResults] = useState<InspectionItemResult[]>(DEFAULT_ITEMS);
  const [remarks, setRemarks] = useState('');

  // 日常点検メニュー取得
  const availableMenus = useMemo(() => {
    if (!selectedAsset) return [];
    return menus.filter(
      (m) => m.menuType === '日常点検' && m.item === selectedAsset.item
    );
  }, [menus, selectedAsset]);

  const filteredMenus = useMemo(() => {
    return availableMenus.filter((m) => m.dailyTiming === usageTiming);
  }, [availableMenus, usageTiming]);

  const selectedMenu = useMemo(() => {
    return menus.find((m) => m.id === selectedMenuId) || null;
  }, [menus, selectedMenuId]);

  // メニュー変更時に点検項目を更新
  useEffect(() => {
    if (selectedMenu && selectedMenu.inspectionItems.length > 0) {
      setItemResults(
        selectedMenu.inspectionItems.map((item) => ({
          itemName: item.itemName,
          content: item.content,
          result: '',
          unit: item.evaluationType === '単位' ? item.unitValue : undefined,
        }))
      );
    } else {
      setItemResults(DEFAULT_ITEMS);
    }
  }, [selectedMenu]);

  // タイミング変更時にメニューリセット
  useEffect(() => {
    setSelectedMenuId('');
  }, [usageTiming]);

  // カメラ起動
  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch {
      alert('カメラの起動に失敗しました。カメラへのアクセスを許可してください。');
    }
  };

  // カメラ停止
  const handleStopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  // QRコード検索 → 点検実施へ
  const handleSearchByQR = () => {
    const asset = qrCode.trim()
      ? MOCK_ORIGINAL_ASSETS.find((a) => a.qrCode === qrCode.trim())
      : MOCK_ORIGINAL_ASSETS[0];

    if (asset) {
      setSelectedAsset(asset);
      handleStopCamera();
      setStep('inspection');
    } else {
      alert('該当する資産が見つかりませんでした');
    }
  };

  // 点検項目の結果変更
  const handleItemResultChange = (index: number, value: string) => {
    setItemResults((prev) => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], result: value };
      return newResults;
    });
  };

  // 点検完了
  const handleComplete = (overallResult: '合格' | '再点検' | '修理申請') => {
    if (!inspectorName) {
      alert('実施者名を入力してください');
      return;
    }
    if (!selectedMenuId) {
      alert('点検メニューを選択してください');
      return;
    }

    const result = {
      assetQrCode: selectedAsset?.qrCode,
      inspectorName,
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectionType: '日常点検',
      usageTiming,
      menuId: selectedMenuId,
      menuName: selectedMenu?.name,
      itemResults,
      remarks,
      overallResult,
    };

    // TODO: IndexedDBに保存
    console.log('点検完了:', result);
    alert('点検が完了しました');

    // リセットしてQRスキャンに戻る
    resetState();
    setStep('qr-scan');
  };

  // 状態リセット
  const resetState = () => {
    setQrCode('');
    setSelectedAsset(null);
    setInspectorName('');
    setUsageTiming('使用前');
    setSelectedMenuId('');
    setItemResults(DEFAULT_ITEMS);
    setRemarks('');
  };

  // 戻る
  const handleBack = () => {
    if (step === 'inspection') {
      setStep('qr-scan');
      setSelectedAsset(null);
    } else {
      handleStopCamera();
      router.push('/inspection-prep');
    }
  };

  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
        color: 'white',
        padding: isMobile ? '12px 16px' : isTablet ? '14px 20px' : '16px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h1 style={{ fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px', fontWeight: 600, margin: 0 }}>
          日常点検 - {step === 'qr-scan' ? 'QRコード読み取り' : '点検実施'}
        </h1>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: isMobile ? '16px 12px 100px 12px' : isTablet ? '24px 20px 100px 20px' : '32px 40px 100px 40px',
        overflowY: 'auto'
      }}>
        {step === 'qr-scan' ? (
          /* QRスキャン画面 */
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: isMobile ? '8px' : '12px',
            padding: isMobile ? '16px' : isTablet ? '24px' : '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <div style={{
              backgroundColor: '#000',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '16px',
              aspectRatio: '4/3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#888' }}>
                  <div style={{ fontSize: '48px', marginBottom: '8px' }}>📷</div>
                  <p style={{ margin: 0, fontSize: '14px' }}>カメラを起動してQRコードをスキャン</p>
                </div>
              )}
            </div>

            <button
              onClick={isCameraActive ? handleStopCamera : handleStartCamera}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: isCameraActive ? '#e74c3c' : '#3498db',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '24px',
                minHeight: '44px'
              }}
            >
              {isCameraActive ? 'カメラを停止' : 'カメラを起動'}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
              <span style={{ color: '#888', fontSize: '13px' }}>または</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                QRコードを手入力
              </label>
              <input
                type="text"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="例: QR001234（空欄可）"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              onClick={handleSearchByQR}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#27ae60',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                minHeight: '44px'
              }}
            >
              検索して点検開始
            </button>
          </div>
        ) : (
          /* 点検実施画面 */
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: isMobile ? '8px' : '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            maxWidth: '600px',
            margin: '0 auto',
            overflow: 'hidden'
          }}>
            {/* ヘッダー情報 */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa'
            }}>
              {/* 基本情報 */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>QRコード</span>
                  <span style={{ ...styles.infoValue, fontVariantNumeric: 'tabular-nums' }}>{selectedAsset?.qrCode}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>実施者名</span>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    placeholder="氏名を入力"
                    style={styles.input}
                  />
                </div>
                <div style={styles.dateDisplay}>{today}</div>
              </div>

              {/* 機器情報 */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <div style={styles.infoItem}>
                  <span style={styles.infoValue}>{selectedAsset?.largeClass}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoValue}>{selectedAsset?.mediumClass}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoValue}>{selectedAsset?.item}/{selectedAsset?.maker}/{selectedAsset?.model}</span>
                </div>
              </div>

              {/* 点検タイミング */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ ...styles.infoLabel, marginRight: '4px' }}>点検タイミング</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['使用前', '使用中', '使用後'] as const).map((timing) => (
                    <label key={timing} style={usageTiming === timing ? styles.tabActive : styles.tab}>
                      <input
                        type="radio"
                        name="usageTiming"
                        value={timing}
                        checked={usageTiming === timing}
                        onChange={() => setUsageTiming(timing)}
                        style={{ display: 'none' }}
                      />
                      {timing}
                    </label>
                  ))}
                </div>
              </div>

              {/* 点検メニュー選択 */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={styles.infoLabel}>点検メニュー</span>
                <select
                  value={selectedMenuId}
                  onChange={(e) => setSelectedMenuId(e.target.value)}
                  style={styles.select}
                >
                  <option value="">選択してください</option>
                  {filteredMenus.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {filteredMenus.length === 0 && (
                <div style={styles.warning}>
                  この品目の「{usageTiming}」点検メニューが登録されていません
                </div>
              )}
            </div>

            {/* 点検項目 */}
            <div style={{ padding: '16px' }}>
              <div style={styles.notice}>
                点検対象機器、点検メニューにまちがいがないか確認して点検を実施してください
              </div>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>項目</th>
                    <th style={styles.th}>点検内容</th>
                    <th style={styles.th}>評価</th>
                  </tr>
                </thead>
                <tbody>
                  {itemResults.map((item, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{item.itemName}</td>
                      <td style={styles.td}>{item.content}</td>
                      <td style={styles.td}>
                        {item.unit ? (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                              type="number"
                              style={styles.numericInput}
                              value={item.result}
                              onChange={(e) => handleItemResultChange(index, e.target.value)}
                            />
                            <span style={styles.unit}>{item.unit}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              style={item.result === '合' ? styles.resultButtonActive : styles.resultButton}
                              onClick={() => handleItemResultChange(index, '合')}
                            >
                              合
                            </button>
                            <button
                              style={item.result === '否' ? styles.resultButtonNg : styles.resultButton}
                              onClick={() => handleItemResultChange(index, '否')}
                            >
                              否
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 備考 */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '4px' }}>備考（交換部品等）</div>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="備考を入力"
                  style={{
                    width: '100%',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 総合評価ボタン */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '4px' }}>総合評価</div>
                <button
                  onClick={() => handleComplete('合格')}
                  style={styles.passButton}
                >
                  合格（異常なし）
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleComplete('再点検')}
                    style={{ ...styles.reinspectButton, flex: 1 }}
                  >
                    再点検
                  </button>
                  <button
                    onClick={() => handleComplete('修理申請')}
                    style={{ ...styles.repairButton, flex: 1 }}
                  >
                    修理申請
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #dee2e6',
        padding: isMobile ? '12px 16px' : '16px 24px',
        paddingBottom: isMobile ? 'max(12px, env(safe-area-inset-bottom))' : 'max(16px, env(safe-area-inset-bottom))',
        display: 'flex',
        justifyContent: 'flex-start',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
        boxSizing: 'border-box'
      }}>
        <button
          onClick={handleBack}
          aria-label="戻る"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '6px',
            borderRadius: '8px',
            minWidth: '44px',
            minHeight: '44px'
          }}
        >
          <div style={{
            background: '#ecf0f1',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: 0,
              height: 0,
              borderRight: '8px solid #34495e',
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent'
            }}></div>
          </div>
          <span style={{ fontSize: '11px', color: '#2c3e50' }}>
            {step === 'inspection' ? 'QR読取に戻る' : '戻る'}
          </span>
        </button>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#ffffff',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '13px',
    border: '1px solid #e0e0e0',
  },
  infoLabel: {
    color: '#7f8c8d',
    fontSize: '12px',
  },
  infoValue: {
    color: '#2c3e50',
    fontWeight: 500,
  },
  input: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '14px',
    width: '100px',
  },
  select: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '14px',
    minWidth: '180px',
    backgroundColor: 'white',
  },
  dateDisplay: {
    backgroundColor: '#e8f5e9',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#27ae60',
  },
  tab: {
    padding: '6px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    minHeight: '32px',
  },
  tabActive: {
    padding: '6px 12px',
    border: '1px solid #27ae60',
    borderRadius: '4px',
    backgroundColor: '#e8f5e9',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#27ae60',
    minHeight: '32px',
  },
  warning: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#856404',
    marginTop: '8px',
  },
  notice: {
    backgroundColor: '#fff3cd',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#856404',
    marginBottom: '16px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
    marginBottom: '16px',
  },
  th: {
    backgroundColor: '#e8f5e9',
    padding: '10px 8px',
    textAlign: 'left' as const,
    fontWeight: 500,
    color: '#2c3e50',
    borderBottom: '1px solid #ddd',
  },
  td: {
    padding: '10px 8px',
    borderBottom: '1px solid #eee',
    verticalAlign: 'middle' as const,
  },
  resultButton: {
    padding: '6px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    minWidth: '44px',
    minHeight: '32px',
  },
  resultButtonActive: {
    padding: '6px 12px',
    border: '1px solid #27ae60',
    borderRadius: '4px',
    backgroundColor: '#e8f5e9',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#27ae60',
    minWidth: '44px',
    minHeight: '32px',
  },
  resultButtonNg: {
    padding: '6px 12px',
    border: '1px solid #e74c3c',
    borderRadius: '4px',
    backgroundColor: '#fdecea',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#e74c3c',
    minWidth: '44px',
    minHeight: '32px',
  },
  numericInput: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '6px 8px',
    fontSize: '13px',
    width: '60px',
    textAlign: 'right' as const,
  },
  unit: {
    fontSize: '12px',
    color: '#7f8c8d',
    marginLeft: '4px',
  },
  passButton: {
    width: '100%',
    padding: '14px 24px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 600,
    minHeight: '50px',
  },
  reinspectButton: {
    padding: '12px 16px',
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    minHeight: '44px',
  },
  repairButton: {
    padding: '12px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    minHeight: '44px',
  },
};

export default function DailyInspectionPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>Loading...</div>}>
      <DailyInspectionContent />
    </Suspense>
  );
}
