'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, Suspense, useMemo, useEffect } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { InspectionTask } from '@/lib/types';
import { useInspectionStore, useAuthStore } from '@/lib/stores';

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

type Step = 'qr-scan' | 'inspection' | 'confirm';

function PeriodicInspectionContent() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const { menus, getMenuById, completeInspection, startInspection } = useInspectionStore();
  const { user } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);

  // タスク情報（sessionStorageから取得）
  const [task, setTask] = useState<InspectionTask | null>(null);

  // ステップ管理
  const [step, setStep] = useState<Step>('qr-scan');

  // QRスキャン状態
  const [qrCode, setQrCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // 点検実施状態
  const [inspectorName, setInspectorName] = useState('');
  const [itemResults, setItemResults] = useState<InspectionItemResult[]>(DEFAULT_ITEMS);
  const [remarks, setRemarks] = useState('');
  const [overallResult, setOverallResult] = useState<'合格' | '異常あり' | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // sessionStorageからタスク情報を取得
  useEffect(() => {
    const stored = sessionStorage.getItem('periodicInspectionTask');
    if (stored) {
      const parsed = JSON.parse(stored) as InspectionTask;
      setTask(parsed);
    }
  }, []);

  // ログインユーザー名を自動取得
  useEffect(() => {
    if (user?.username) {
      setInspectorName(user.username);
    }
  }, [user]);

  // タスクに紐付く点検メニュー
  const selectedMenu = useMemo(() => {
    if (!task || task.periodicMenuIds.length === 0) return null;
    return getMenuById(task.periodicMenuIds[0]) || null;
  }, [task, getMenuById]);

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

  // QRコード照合 → 点検実施へ
  const handleVerifyQR = () => {
    if (!task) {
      alert('タスク情報が読み込まれていません');
      return;
    }

    const inputQr = qrCode.trim();

    // 空欄の場合はそのまま進む（デモ用）
    if (!inputQr) {
      setIsVerified(true);
      handleStopCamera();
      setStep('inspection');
      return;
    }

    // QRコード照合
    if (inputQr === task.assetId) {
      setIsVerified(true);
      handleStopCamera();
      setStep('inspection');
    } else {
      alert(`QRコードが一致しません。\n期待: ${task.assetId}\n入力: ${inputQr}`);
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

  // 確認画面表示
  const handleShowConfirm = (result: '合格' | '異常あり') => {
    if (!inspectorName) {
      alert('実施者名を入力してください');
      return;
    }
    setOverallResult(result);
    setStep('confirm');
  };

  // 報告書出力
  const handleExportReport = async () => {
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsExporting(false);
    alert('点検結果報告書を出力しました');
  };

  // 完了
  const handleFinish = () => {
    if (!task) return;

    // 点検実績を登録
    completeInspection(task.id, {
      taskId: task.id,
      assetId: task.assetId,
      menuId: selectedMenu?.id || '',
      plannedDate: task.nextInspectionDate,
      actualDate: new Date().toISOString().split('T')[0],
      result: '合格',
      staffName: inspectorName,
      resultDetails: itemResults.map((item) => ({
        itemId: item.itemName,
        itemName: item.itemName,
        result: item.result || '-',
        note: item.unit ? `${item.result} ${item.unit}` : undefined,
      })),
      memo: remarks || undefined,
    });

    sessionStorage.removeItem('periodicInspectionTask');
    alert('点検記録を登録しました');
    router.push('/quotation-data-box/inspection-requests');
  };

  // 修理申請へ
  const handleRepairRequest = () => {
    if (!task) return;
    sessionStorage.setItem('repairRequestData', JSON.stringify({
      qrCode: task.assetId,
      largeClass: task.largeClass,
      mediumClass: task.mediumClass,
      item: task.assetName,
      maker: task.maker,
      model: task.model,
      inspectionRemarks: remarks,
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectorName,
    }));
    sessionStorage.removeItem('periodicInspectionTask');
    router.push('/repair-request');
  };

  // 戻る
  const handleBack = () => {
    if (step === 'confirm') {
      setStep('inspection');
    } else if (step === 'inspection') {
      setStep('qr-scan');
      setIsVerified(false);
    } else {
      handleStopCamera();
      sessionStorage.removeItem('periodicInspectionTask');
      router.push('/quotation-data-box/inspection-requests');
    }
  };

  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');

  if (!task) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#f5f5f5' }}>
        <header style={{
          background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
          color: 'white',
          padding: '16px 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>定期点検</h1>
        </header>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>タスク情報を読み込み中...</p>
        </div>
      </div>
    );
  }

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
          定期点検 - {step === 'qr-scan' ? 'QRコード読み取り' : step === 'confirm' ? '確認' : '点検実施'}
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
            {/* 対象機器情報 */}
            <div style={{
              backgroundColor: '#f0f7ff',
              border: '1px solid #c8ddf5',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#1f2937',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px', color: '#27ae60' }}>点検対象機器</div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span><span style={{ color: '#7f8c8d' }}>QRコード:</span> {task.assetId}</span>
                <span><span style={{ color: '#7f8c8d' }}>品目:</span> {task.assetName}</span>
                <span><span style={{ color: '#7f8c8d' }}>メーカー:</span> {task.maker}</span>
                <span><span style={{ color: '#7f8c8d' }}>型式:</span> {task.model}</span>
              </div>
            </div>

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
                backgroundColor: isCameraActive ? '#e74c3c' : '#27ae60',
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
                placeholder={`例: ${task.assetId}（空欄可）`}
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
              onClick={handleVerifyQR}
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
              照合して点検開始
            </button>
          </div>
        ) : step === 'inspection' ? (
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
                  <span style={{ ...styles.infoValue, fontVariantNumeric: 'tabular-nums' }}>{task.assetId}</span>
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
                  <span style={styles.infoLabel}>対象機器</span>
                  <span style={styles.infoValue}>{task.assetName}　{task.maker}　{task.model}</span>
                </div>
              </div>

              {/* 点検種別 */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>点検種別</span>
                  <span style={{ ...styles.infoValue, color: '#27ae60' }}>定期点検</span>
                </div>
              </div>

              {/* 点検メニュー */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={styles.infoLabel}>点検メニュー</span>
                <div style={styles.infoItem}>
                  <span style={styles.infoValue}>
                    {selectedMenu?.name || '（メニュー未設定）'}
                  </span>
                </div>
              </div>
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
                  onClick={() => handleShowConfirm('合格')}
                  style={styles.passButton}
                >
                  合格（使用可）
                </button>
                <button
                  onClick={() => handleShowConfirm('異常あり')}
                  style={styles.repairButton}
                >
                  異常あり（使用停止へ）
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 確認画面 */
          <div style={{
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {/* 案内バナー */}
            <div style={{
              background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              textAlign: 'center',
            }}>
              <span style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#ffffff',
              }}>
                下記内容で問題がなければ完了してください
              </span>
            </div>

            {/* 総合評価バッジ */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: isMobile ? '20px 16px' : '28px 32px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>総合評価</div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 32px',
                borderRadius: '12px',
                border: '2px solid',
                ...(overallResult === '合格'
                  ? { backgroundColor: '#e8f5e9', color: '#27ae60', borderColor: '#27ae60' }
                  : { backgroundColor: '#ffebee', color: '#e74c3c', borderColor: '#e74c3c' }
                )
              }}>
                <span style={{ fontSize: '32px', fontWeight: 700 }}>
                  {overallResult === '合格' ? '✓' : '⚠'}
                </span>
                <span style={{ fontSize: '24px', fontWeight: 700 }}>
                  {overallResult}
                </span>
              </div>
            </div>

            {/* 点検対象機器 */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: isMobile ? '16px' : '20px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginBottom: '16px'
            }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#333', marginBottom: '12px' }}>
                点検対象機器
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <ConfirmInfoItem label="QRコード" value={task.assetId} />
                <ConfirmInfoItem label="大分類" value={task.largeClass} />
                <ConfirmInfoItem label="中分類" value={task.mediumClass} />
                <ConfirmInfoItem label="品目" value={task.assetName} />
                <ConfirmInfoItem label="メーカー" value={task.maker} />
                <ConfirmInfoItem label="型式" value={task.model} />
              </div>
            </div>

            {/* 点検情報 */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: isMobile ? '16px' : '20px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginBottom: '16px'
            }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#333', marginBottom: '12px' }}>
                点検情報
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: '8px' }}>
                <ConfirmInfoItem label="点検種別" value="定期点検" />
                <ConfirmInfoItem label="点検メニュー" value={selectedMenu?.name || '（メニュー未設定）'} />
                <ConfirmInfoItem label="実施者" value={inspectorName} />
                <ConfirmInfoItem label="実施日" value={today} />
              </div>
            </div>

            {/* 点検項目結果テーブル */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: isMobile ? '16px' : '20px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginBottom: '16px'
            }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#333', marginBottom: '12px' }}>
                点検項目結果
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '400px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #e0e0e0' }}>項目</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #e0e0e0' }}>点検内容</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, borderBottom: '2px solid #e0e0e0', width: '80px' }}>評価</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemResults.map((item, index) => (
                      <tr key={index}>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee' }}>{item.itemName}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee' }}>{item.content}</td>
                        <td style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid #eee',
                          textAlign: 'center',
                          fontWeight: 600,
                          color: item.result === '合' ? '#27ae60' : item.result === '否' ? '#e74c3c' : '#333'
                        }}>
                          {item.unit ? `${item.result} ${item.unit}` : item.result || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 備考 */}
            {remarks && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: isMobile ? '16px' : '20px 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                marginBottom: '16px'
              }}>
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
                  備考
                </h2>
                <p style={{ fontSize: '14px', color: '#555', margin: 0, lineHeight: '1.6' }}>
                  {remarks}
                </p>
              </div>
            )}

            {/* 報告書出力 */}
            <button
              onClick={handleExportReport}
              disabled={isExporting}
              style={{
                width: '100%',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 24px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: isExporting ? 'not-allowed' : 'pointer',
                opacity: isExporting ? 0.7 : 1,
                minHeight: '48px',
              }}
            >
              {isExporting ? '出力中...' : '報告書出力'}
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      {step === 'confirm' ? (
        <footer style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e0e0e0',
          padding: isMobile ? '16px' : '20px 24px',
          paddingBottom: isMobile ? 'max(16px, env(safe-area-inset-bottom))' : 'max(20px, env(safe-area-inset-bottom))',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button
              onClick={handleBack}
              aria-label="戻る"
              style={{
                flex: 1,
                backgroundColor: '#ecf0f1',
                color: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 16px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '48px',
              }}
            >
              戻る
            </button>
            {overallResult === '合格' ? (
              <button
                onClick={handleFinish}
                aria-label="完了"
                style={{
                  flex: 1,
                  backgroundColor: '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: '48px',
                }}
              >
                完了
              </button>
            ) : (
              <button
                onClick={handleRepairRequest}
                aria-label="修理申請へ"
                style={{
                  flex: 1,
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: '48px',
                }}
              >
                修理申請へ
              </button>
            )}
          </div>
        </footer>
      ) : (
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
                borderRight: '8px solid #374151',
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent'
              }}></div>
            </div>
            <span style={{ fontSize: '11px', color: '#1f2937' }}>
              {step === 'inspection' ? 'QR読取に戻る' : '戻る'}
            </span>
          </button>
        </footer>
      )}
    </div>
  );
}

function ConfirmInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      borderRadius: '6px',
      padding: '8px 12px'
    }}>
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>{label}</div>
      <div style={{
        fontSize: '13px',
        color: '#333',
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {value || '-'}
      </div>
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
    color: '#1f2937',
    fontWeight: 500,
  },
  input: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '14px',
    width: '100px',
  },
  dateDisplay: {
    backgroundColor: '#e8f5e9',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#27ae60',
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
    color: '#1f2937',
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
  repairButton: {
    width: '100%',
    padding: '14px 24px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 600,
    minHeight: '50px',
  },
};

export default function PeriodicInspectionPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>Loading...</div>}>
      <PeriodicInspectionContent />
    </Suspense>
  );
}
