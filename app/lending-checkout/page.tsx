'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useToast } from '@/components/ui/Toast';

// 4段階ステータス
type DeviceStatus = 'available' | 'lending' | 'in_use' | 'used';

// 処理種別
type ProcessedAction = 'lend' | 'return' | 'start_use' | 'end_use';

// 担当者マスタモック
const MOCK_USERS: { [id: string]: { name: string; department: string } } = {
  '12345': { name: '山田太郎', department: '3階東病棟' },
  '12346': { name: '佐藤花子', department: 'ICU' },
  '12347': { name: '鈴木一郎', department: 'ME室' },
  '12348': { name: '田中美咲', department: '手術室' },
};

// 機器マスタモック（状態付き）
interface DeviceInfo {
  name: string;
  manufacturer: string;
  model: string;
  meNo: string;
  status: DeviceStatus;
  lendingInfo?: {
    department: string;
    lendingDate: string;
    returnDueDate: string;
  };
}

// 機器モックデータ（4ステータスを網羅）
const MOCK_DEVICES: { [qrCode: string]: DeviceInfo } = {
  'QR001': {
    name: '輸液ポンプ',
    manufacturer: 'テルモ',
    model: 'TE-161S',
    meNo: 'ME-0001',
    status: 'available',
  },
  'QR002': {
    name: 'シリンジポンプ',
    manufacturer: 'テルモ',
    model: 'TE-331S',
    meNo: 'ME-0002',
    status: 'lending',
    lendingInfo: {
      department: 'ICU',
      lendingDate: '2026/2/28',
      returnDueDate: '2026/3/6',
    },
  },
  'QR003': {
    name: 'ベッドサイドモニター',
    manufacturer: 'フクダ電子',
    model: 'DS-8500',
    meNo: 'ME-0003',
    status: 'in_use',
    lendingInfo: {
      department: '手術室',
      lendingDate: '2026/3/1',
      returnDueDate: '2026/3/14',
    },
  },
  'QR004': {
    name: 'パルスオキシメーター',
    manufacturer: 'コニカミノルタ',
    model: 'PULSOX-Neo',
    meNo: 'ME-0004',
    status: 'used',
    lendingInfo: {
      department: '3階東病棟',
      lendingDate: '2026/2/1',
      returnDueDate: '2026/2/15',
    },
  },
};

// ステータスラベル
const STATUS_LABELS: Record<DeviceStatus, string> = {
  available: '貸出可',
  lending: '貸出中',
  in_use: '使用中',
  used: '使用済',
};

export default function LendingCheckoutPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const { showToast } = useToast();

  // 入力状態
  const [qrLabel, setQrLabel] = useState('');
  const [userId, setUserId] = useState('');
  const [isReturnDateModalOpen, setIsReturnDateModalOpen] = useState(false);
  const [returnDate, setReturnDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date;
  });

  // 処理完了状態
  const [isProcessed, setIsProcessed] = useState(false);
  const [processedAction, setProcessedAction] = useState<ProcessedAction | null>(null);

  // ドラムロール用の一時状態
  const [tempYear, setTempYear] = useState('');
  const [tempMonth, setTempMonth] = useState('');
  const [tempDay, setTempDay] = useState('');

  // ドラムロールのスクロール参照
  const yearScrollRef = useRef<HTMLDivElement>(null);
  const monthScrollRef = useRef<HTMLDivElement>(null);
  const dayScrollRef = useRef<HTMLDivElement>(null);

  const ITEM_HEIGHT = 44;

  // 担当者情報（IDから自動取得）
  const userInfo = useMemo(() => {
    return MOCK_USERS[userId] || null;
  }, [userId]);

  // 機器情報（QRから取得）
  const deviceInfo = useMemo(() => {
    return MOCK_DEVICES[qrLabel] || null;
  }, [qrLabel]);

  // 年の選択肢（今年〜来年）
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let y = currentYear; y <= currentYear + 1; y++) {
      years.push(y.toString());
    }
    return years;
  }, []);

  // 月の選択肢
  const monthOptions = useMemo(() => {
    const months: string[] = [];
    for (let m = 1; m <= 12; m++) {
      months.push(m.toString());
    }
    return months;
  }, []);

  // 日の選択肢（選択された年月に応じて変動）
  const dayOptions = useMemo(() => {
    const days: string[] = [];
    const year = tempYear ? parseInt(tempYear, 10) : new Date().getFullYear();
    const month = tempMonth ? parseInt(tempMonth, 10) : new Date().getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d.toString());
    }
    return days;
  }, [tempYear, tempMonth]);

  // 日付フォーマット
  const formatDate = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const formatShortDate = (date: Date) => {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // モーダルを開く際に現在の値をセット
  const openDatePicker = () => {
    setTempYear(returnDate.getFullYear().toString());
    setTempMonth((returnDate.getMonth() + 1).toString());
    setTempDay(returnDate.getDate().toString());
    setIsReturnDateModalOpen(true);
  };

  // モーダルでの選択を確定
  const confirmDatePicker = () => {
    const year = parseInt(tempYear, 10);
    const month = parseInt(tempMonth, 10);
    const day = parseInt(tempDay, 10);
    const newDate = new Date(year, month - 1, day);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (newDate < tomorrow) {
      showToast('明日以降の日付を選択してください', 'warning');
      return;
    }

    setReturnDate(newDate);
    setIsReturnDateModalOpen(false);
    showToast(`返却予定日を${formatShortDate(newDate)}に変更しました`, 'success');
  };

  const cancelDatePicker = () => {
    setIsReturnDateModalOpen(false);
  };

  // スクロール位置を選択値に基づいて設定
  useEffect(() => {
    if (isReturnDateModalOpen) {
      setTimeout(() => {
        if (yearScrollRef.current) {
          const index = yearOptions.indexOf(tempYear);
          if (index >= 0) {
            yearScrollRef.current.scrollTop = index * ITEM_HEIGHT;
          }
        }
        if (monthScrollRef.current) {
          const index = monthOptions.indexOf(tempMonth);
          if (index >= 0) {
            monthScrollRef.current.scrollTop = index * ITEM_HEIGHT;
          }
        }
        if (dayScrollRef.current) {
          const index = dayOptions.indexOf(tempDay);
          if (index >= 0) {
            dayScrollRef.current.scrollTop = index * ITEM_HEIGHT;
          }
        }
      }, 100);
    }
  }, [isReturnDateModalOpen, tempYear, tempMonth, tempDay, yearOptions, monthOptions, dayOptions]);

  const handleYearScroll = () => {
    if (!yearScrollRef.current) return;
    const scrollTop = yearScrollRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    if (index >= 0 && index < yearOptions.length) {
      setTempYear(yearOptions[index]);
    }
  };

  const handleMonthScroll = () => {
    if (!monthScrollRef.current) return;
    const scrollTop = monthScrollRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    if (index >= 0 && index < monthOptions.length) {
      setTempMonth(monthOptions[index]);
    }
  };

  const handleDayScroll = () => {
    if (!dayScrollRef.current) return;
    const scrollTop = dayScrollRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    if (index >= 0 && index < dayOptions.length) {
      setTempDay(dayOptions[index]);
    }
  };

  // QR読取ハンドラー
  const handleQRScan = () => {
    showToast('QR読取機能を起動中...', 'info');
    setTimeout(() => {
      const codes = ['QR001', 'QR002', 'QR003', 'QR004'];
      const randomCode = codes[Math.floor(Math.random() * codes.length)];
      setQrLabel(randomCode);
      setIsProcessed(false);
      setProcessedAction(null);
      showToast('QRコードを読み取りました', 'success');
    }, 500);
  };

  // バーコード読取ハンドラー
  const handleBarcodeScan = () => {
    showToast('バーコード読取機能を起動中...', 'info');
    setTimeout(() => {
      setUserId('12345');
      showToast('バーコードを読み取りました', 'success');
    }, 500);
  };

  // 貸出処理（事務）
  const handleLending = () => {
    if (!userInfo) {
      showToast('担当者IDを入力してください', 'warning');
      return;
    }
    setIsProcessed(true);
    setProcessedAction('lend');
    showToast(`${deviceInfo?.name}を${userInfo.department}へ貸出しました`, 'success');
  };

  // 返却処理（事務）
  const handleReturn = () => {
    if (!userInfo) {
      showToast('担当者IDを入力してください', 'warning');
      return;
    }
    setIsProcessed(true);
    setProcessedAction('return');
    showToast(`${deviceInfo?.name}の返却を受け付けました`, 'success');
  };

  // 使用開始（臨床）
  const handleStartUse = () => {
    if (!userInfo) {
      showToast('担当者IDを入力してください', 'warning');
      return;
    }
    setIsProcessed(true);
    setProcessedAction('start_use');
    showToast(`${deviceInfo?.name}の使用を開始しました`, 'success');
  };

  // 使用終了（臨床）
  const handleEndUse = () => {
    if (!userInfo) {
      showToast('担当者IDを入力してください', 'warning');
      return;
    }
    setIsProcessed(true);
    setProcessedAction('end_use');
    showToast(`${deviceInfo?.name}の使用を終了しました`, 'success');
  };

  // 次の機器へ
  const handleNextDevice = () => {
    setQrLabel('');
    setIsProcessed(false);
    setProcessedAction(null);
  };

  // カード枠色（開始系=緑、完了系=オレンジ）
  const getCardBorderColor = (status: DeviceStatus): string => {
    if (status === 'available' || status === 'lending') return '#4caf50';
    return '#ff9800';
  };

  // カード背景色
  const getCardBgColor = (status: DeviceStatus): string => {
    if (status === 'available' || status === 'lending') return '#e3f2fd';
    return '#fff3e0';
  };

  // QRリンクのラベル
  const QR_LINKS = [
    { code: 'QR001', label: 'QR001（貸出可）', color: '#1976d2' },
    { code: 'QR002', label: 'QR002（貸出中）', color: '#4caf50' },
    { code: 'QR003', label: 'QR003（使用中）', color: '#ff9800' },
    { code: 'QR004', label: 'QR004（使用済）', color: '#e65100' },
  ];

  // 完了メッセージ
  const getCompletionTitle = (): string => {
    switch (processedAction) {
      case 'lend': return '貸出完了';
      case 'return': return '返却完了';
      case 'start_use': return '使用開始登録完了';
      case 'end_use': return '使用終了登録完了';
      default: return '完了';
    }
  };

  const getCompletionDescription = (): string => {
    if (!deviceInfo) return '';
    switch (processedAction) {
      case 'lend': return `${deviceInfo.name}${userInfo ? ` → ${userInfo.department}` : ''}`;
      case 'return': return `${deviceInfo.name}の返却を受け付けました`;
      case 'start_use': return `${deviceInfo.name}の使用を開始しました`;
      case 'end_use': return `${deviceInfo.name}の使用を終了しました`;
      default: return '';
    }
  };

  // 返却予定日を設定可能か（貸出可: 新規設定、貸出中: 表示+変更可）
  const showReturnDate = deviceInfo && (
    deviceInfo.status === 'available' || deviceInfo.status === 'lending'
  );

  // 貸出情報を表示のみ（使用中、使用済）
  const showLendingInfoReadonly = deviceInfo && deviceInfo.lendingInfo && (
    deviceInfo.status === 'in_use' || deviceInfo.status === 'used'
  );

  const containerPadding = isMobile ? '16px' : '24px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#f5f5f5' }}>
      <Header
        title="貸出・返却"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
      />

      <div style={{
        flex: 1,
        padding: containerPadding,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>

          {/* ステップ1: QRラベル入力 */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            border: deviceInfo ? '2px solid #4caf50' : '1px solid #ddd',
            padding: '16px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}>
              <span style={{
                background: deviceInfo ? '#4caf50' : '#1976d2',
                color: 'white',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
              }}>
                {deviceInfo ? '✓' : '1'}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                機器のQRコードを読み取る
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={qrLabel}
                onChange={(e) => {
                  setQrLabel(e.target.value);
                  setIsProcessed(false);
                  setProcessedAction(null);
                }}
                placeholder="例: QR001（貸出可）/ QR002（貸出中）"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  outline: 'none',
                }}
              />
              {(isTablet || isMobile) && (
                <button
                  onClick={handleQRScan}
                  style={{
                    padding: '12px 16px',
                    background: '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>📷</span>
                  <span style={{ fontSize: '14px' }}>読取</span>
                </button>
              )}
            </div>
            {/* テスト用QRコード例 */}
            <div style={{
              marginTop: '8px',
              fontSize: '11px',
              color: '#888',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
            }}>
              {QR_LINKS.map(link => (
                <span
                  key={link.code}
                  onClick={() => { setQrLabel(link.code); setIsProcessed(false); setProcessedAction(null); }}
                  style={{ cursor: 'pointer', textDecoration: 'underline', color: link.color }}
                >
                  {link.label}
                </span>
              ))}
            </div>
          </div>

          {/* 機器情報・状態表示 */}
          {deviceInfo && !isProcessed && (
            <div style={{
              background: getCardBgColor(deviceInfo.status),
              borderRadius: '12px',
              border: `2px solid ${getCardBorderColor(deviceInfo.status)}`,
              padding: '20px',
            }}>
              {/* 機器情報 */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
                  {deviceInfo.name}
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {deviceInfo.manufacturer} / {deviceInfo.model}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  ME管理No: {deviceInfo.meNo}
                </div>
              </div>

              {/* 現在の状態 */}
              <div style={{
                background: 'white',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    background: '#fffde7',
                    border: '2px solid #fdd835',
                    color: '#333',
                  }}>
                    {STATUS_LABELS[deviceInfo.status]}
                  </span>
                </div>
                {showLendingInfoReadonly && deviceInfo.lendingInfo && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                    貸出日: {deviceInfo.lendingInfo.lendingDate} ／ 返却予定: {deviceInfo.lendingInfo.returnDueDate}
                  </div>
                )}
              </div>

              {/* 担当者ID入力 */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '8px',
                }}>
                  担当者ID
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="例: 12345"
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      fontSize: '16px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      outline: 'none',
                      background: 'white',
                    }}
                  />
                  {(isTablet || isMobile) && (
                    <button
                      onClick={handleBarcodeScan}
                      style={{
                        padding: '12px 16px',
                        background: '#ff9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      バーコード
                    </button>
                  )}
                </div>
                {userInfo ? (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    color: '#1976d2',
                    fontWeight: 'bold',
                  }}>
                    {userInfo.name}（{userInfo.department}）
                  </div>
                ) : (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    color: '#888',
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}>
                    <span
                      onClick={() => setUserId('12345')}
                      style={{ cursor: 'pointer', textDecoration: 'underline', color: '#666' }}
                    >
                      12345（山田太郎）
                    </span>
                    <span
                      onClick={() => setUserId('12346')}
                      style={{ cursor: 'pointer', textDecoration: 'underline', color: '#666' }}
                    >
                      12346（佐藤花子）
                    </span>
                    <span
                      onClick={() => setUserId('12347')}
                      style={{ cursor: 'pointer', textDecoration: 'underline', color: '#666' }}
                    >
                      12347（鈴木一郎）
                    </span>
                  </div>
                )}
              </div>

              {/* 返却予定日設定（事務:貸出時 / 臨床:使用開始時） */}
              {showReturnDate && (
                <div style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>返却予定日</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', fontVariantNumeric: 'tabular-nums' }}>
                      {deviceInfo.status === 'lending' && deviceInfo.lendingInfo
                        ? deviceInfo.lendingInfo.returnDueDate
                        : formatDate(returnDate)
                      }
                    </div>
                  </div>
                  <button
                    onClick={openDatePicker}
                    style={{
                      padding: '8px 16px',
                      background: '#e65100',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    変更
                  </button>
                </div>
              )}

              {/* アクションボタン（ステータスに応じて1つだけ表示） */}
              {deviceInfo.status === 'available' && (
                <button
                  onClick={handleLending}
                  disabled={!userInfo}
                  style={{
                    width: '100%',
                    padding: '20px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    background: userInfo ? '#1976d2' : '#bdbdbd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: userInfo ? 'pointer' : 'not-allowed',
                    boxShadow: userInfo ? '0 4px 12px rgba(25, 118, 210, 0.3)' : 'none',
                  }}
                >
                  貸出する
                </button>
              )}

              {deviceInfo.status === 'used' && (
                <button
                  onClick={handleReturn}
                  disabled={!userInfo}
                  style={{
                    width: '100%',
                    padding: '20px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    background: userInfo ? '#4caf50' : '#bdbdbd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: userInfo ? 'pointer' : 'not-allowed',
                    boxShadow: userInfo ? '0 4px 12px rgba(76, 175, 80, 0.3)' : 'none',
                  }}
                >
                  返却する
                </button>
              )}

              {deviceInfo.status === 'lending' && (
                <button
                  onClick={handleStartUse}
                  disabled={!userInfo}
                  style={{
                    width: '100%',
                    padding: '20px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    background: userInfo ? '#1976d2' : '#bdbdbd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: userInfo ? 'pointer' : 'not-allowed',
                    boxShadow: userInfo ? '0 4px 12px rgba(25, 118, 210, 0.3)' : 'none',
                  }}
                >
                  使用を開始する
                </button>
              )}

              {deviceInfo.status === 'in_use' && (
                <button
                  onClick={handleEndUse}
                  disabled={!userInfo}
                  style={{
                    width: '100%',
                    padding: '20px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    background: userInfo ? '#ff9800' : '#bdbdbd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: userInfo ? 'pointer' : 'not-allowed',
                    boxShadow: userInfo ? '0 4px 12px rgba(255, 152, 0, 0.3)' : 'none',
                  }}
                >
                  使用を終了する
                </button>
              )}
            </div>
          )}

          {/* 処理完了表示 */}
          {isProcessed && deviceInfo && (
            <div style={{
              background: '#e8f5e9',
              borderRadius: '12px',
              border: '2px solid #4caf50',
              padding: '24px',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px',
              }}>
                ✓
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#2e7d32',
                marginBottom: '8px',
              }}>
                {getCompletionTitle()}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '24px',
              }}>
                {getCompletionDescription()}
              </div>
              <button
                onClick={handleNextDevice}
                style={{
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                次の機器を処理
              </button>
            </div>
          )}

          {/* 初期状態（機器未選択） */}
          {!deviceInfo && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              border: '2px dashed #ddd',
              padding: '40px 24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📷</div>
              <div style={{ fontSize: '16px', color: '#666' }}>
                機器のQRコードを読み取ってください
              </div>
              <div style={{ fontSize: '13px', color: '#999', marginTop: '8px' }}>
                機器の状態に応じて貸出・返却・使用開始・使用終了を行います
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 返却予定日変更モーダル（ドラムロール式） */}
      {isReturnDateModalOpen && (
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
                返却予定日
              </span>
              <button
                onClick={confirmDatePicker}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  color: '#e65100',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                完了
              </button>
            </div>

            <div style={{
              display: 'flex',
              padding: '8px 10px',
              borderBottom: '1px solid #eee',
              background: '#fafafa'
            }}>
              <div style={{ flex: 1, textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: '#666' }}>年</div>
              <div style={{ flex: 1, textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: '#666' }}>月</div>
              <div style={{ flex: 1, textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: '#666' }}>日</div>
            </div>

            <div style={{
              display: 'flex',
              height: '200px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '10px',
                right: '10px',
                height: `${ITEM_HEIGHT}px`,
                transform: 'translateY(-50%)',
                background: '#fff3e0',
                borderRadius: '8px',
                pointerEvents: 'none',
                zIndex: 1
              }} />

              <div style={{ flex: 1, position: 'relative' }}>
                <div
                  ref={yearScrollRef}
                  onScroll={handleYearScroll}
                  style={{
                    height: '100%',
                    overflowY: 'auto',
                    scrollSnapType: 'y mandatory',
                    WebkitOverflowScrolling: 'touch',
                    paddingTop: `${(200 - ITEM_HEIGHT) / 2}px`,
                    paddingBottom: `${(200 - ITEM_HEIGHT) / 2}px`
                  }}
                >
                  {yearOptions.map(year => (
                    <div
                      key={year}
                      style={{
                        height: `${ITEM_HEIGHT}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        scrollSnapAlign: 'center',
                        fontSize: '18px',
                        color: tempYear === year ? '#e65100' : '#2c3e50',
                        fontWeight: tempYear === year ? 'bold' : 'normal',
                        position: 'relative',
                        zIndex: 2,
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      {year}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, position: 'relative' }}>
                <div
                  ref={monthScrollRef}
                  onScroll={handleMonthScroll}
                  style={{
                    height: '100%',
                    overflowY: 'auto',
                    scrollSnapType: 'y mandatory',
                    WebkitOverflowScrolling: 'touch',
                    paddingTop: `${(200 - ITEM_HEIGHT) / 2}px`,
                    paddingBottom: `${(200 - ITEM_HEIGHT) / 2}px`
                  }}
                >
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
                        color: tempMonth === month ? '#e65100' : '#2c3e50',
                        fontWeight: tempMonth === month ? 'bold' : 'normal',
                        position: 'relative',
                        zIndex: 2,
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      {month}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, position: 'relative' }}>
                <div
                  ref={dayScrollRef}
                  onScroll={handleDayScroll}
                  style={{
                    height: '100%',
                    overflowY: 'auto',
                    scrollSnapType: 'y mandatory',
                    WebkitOverflowScrolling: 'touch',
                    paddingTop: `${(200 - ITEM_HEIGHT) / 2}px`,
                    paddingBottom: `${(200 - ITEM_HEIGHT) / 2}px`
                  }}
                >
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
                        color: tempDay === day ? '#e65100' : '#2c3e50',
                        fontWeight: tempDay === day ? 'bold' : 'normal',
                        position: 'relative',
                        zIndex: 2,
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid #eee' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>クイック選択:</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[7, 14, 21, 30].map(days => {
                  const targetDate = new Date();
                  targetDate.setDate(targetDate.getDate() + days);
                  return (
                    <button
                      key={days}
                      onClick={() => {
                        setTempYear(targetDate.getFullYear().toString());
                        setTempMonth((targetDate.getMonth() + 1).toString());
                        setTempDay(targetDate.getDate().toString());
                      }}
                      style={{
                        padding: '8px 16px',
                        background: 'white',
                        border: '1px solid #e65100',
                        borderRadius: '20px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        color: '#e65100',
                      }}
                    >
                      {days}日後
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
