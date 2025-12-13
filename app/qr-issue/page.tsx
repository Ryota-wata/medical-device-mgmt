'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';

export default function QRIssuePage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const [tab, setTab] = useState<'new' | 'reissue'>('new');
  const [alpha, setAlpha] = useState('R');
  const [twoDigit, setTwoDigit] = useState('07');
  const [fiveDigit, setFiveDigit] = useState('00001');
  const [reissueNumber, setReissueNumber] = useState('');
  const [template, setTemplate] = useState('qr-small');
  const [footerText, setFooterText] = useState('');
  const [footerCharMax, setFooterCharMax] = useState(12);
  const [issueCount, setIssueCount] = useState(50);

  // フッター文字数制限を更新
  useEffect(() => {
    const limits: Record<string, number> = {
      'qr-small': 12,
      'qr-medium': 18,
      'qr-large': 24,
      'barcode-small': 12,
      'barcode-medium': 18,
      'barcode-large': 24,
    };
    setFooterCharMax(limits[template] || 12);
  }, [template]);

  // 発行予定番号範囲を計算
  const calculateRange = () => {
    if (tab === 'reissue') {
      return { start: reissueNumber, end: reissueNumber, count: 1 };
    }

    const startNum = parseInt(fiveDigit) || 1;
    const endNum = startNum + issueCount - 1;
    const start = `${alpha}-${twoDigit}-${String(startNum).padStart(5, '0')}`;
    const end = `${alpha}-${twoDigit}-${String(endNum).padStart(5, '0')}`;
    return { start, end, count: issueCount };
  };

  const range = calculateRange();

  const handleGoToPrintPreview = () => {
    // 印刷プレビュー画面へ遷移
    router.push(`/qr-print?template=${template}&start=${range.start}&end=${range.end}&footer=${encodeURIComponent(footerText)}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* ヘッダー */}
      <div
        style={{
          background: '#2c3e50',
          color: 'white',
          padding: isMobile ? '12px 16px' : '15px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '12px' : '20px',
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: '#34495e',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: isMobile ? '6px 12px' : '8px 16px',
            cursor: 'pointer',
            fontSize: isMobile ? '13px' : '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>←</span>
          <span>戻る</span>
        </button>
        <h1 style={{ fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px', fontWeight: 'bold', margin: 0 }}>ラベル発行</h1>
      </div>

      {/* メインコンテンツ */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '20px 12px' : isTablet ? '30px 16px' : '40px 20px' }}>
        {/* ページヘッダー */}
        <div style={{ marginBottom: isMobile ? '20px' : '30px' }}>
          <h2 style={{ fontSize: isMobile ? '20px' : isTablet ? '22px' : '24px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '8px' }}>
            ラベル発行
          </h2>
          <p style={{ color: '#5a6c7d', fontSize: isMobile ? '13px' : '14px' }}>資産管理用のQRコード・バーコードラベルを発行します</p>
        </div>

        {/* フォームコンテナ */}
        <div style={{ background: 'white', borderRadius: '8px', padding: isMobile ? '20px' : isTablet ? '24px' : '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {/* タブ切り替え */}
          <div style={{ display: 'flex', gap: isMobile ? '5px' : '10px', marginBottom: isMobile ? '20px' : '30px', borderBottom: '2px solid #dee2e6' }}>
            <button
              onClick={() => setTab('new')}
              style={{
                padding: isMobile ? '10px 16px' : isTablet ? '11px 20px' : '12px 24px',
                background: 'transparent',
                border: 'none',
                borderBottom: tab === 'new' ? '3px solid #27ae60' : '3px solid transparent',
                color: tab === 'new' ? '#27ae60' : '#5a6c7d',
                fontWeight: tab === 'new' ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
                marginBottom: '-2px',
              }}
            >
              新規発行
            </button>
            <button
              onClick={() => setTab('reissue')}
              style={{
                padding: isMobile ? '10px 16px' : isTablet ? '11px 20px' : '12px 24px',
                background: 'transparent',
                border: 'none',
                borderBottom: tab === 'reissue' ? '3px solid #27ae60' : '3px solid transparent',
                color: tab === 'reissue' ? '#27ae60' : '#5a6c7d',
                fontWeight: tab === 'reissue' ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
                marginBottom: '-2px',
              }}
            >
              再発行
            </button>
          </div>

          {/* 新規発行タブ */}
          {tab === 'new' && (
            <div style={{ marginBottom: isMobile ? '20px' : '30px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', color: '#2c3e50', marginBottom: '12px', fontSize: isMobile ? '14px' : '16px' }}>
                QRコード番号 <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'end', gap: isMobile ? '8px' : '10px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                <div style={{ flex: isMobile ? '1 0 100%' : '0 0 auto' }}>
                  <label style={{ display: 'block', fontSize: isMobile ? '11px' : '12px', color: '#5a6c7d', marginBottom: '5px' }}>
                    アルファベット
                  </label>
                  <select
                    value={alpha}
                    onChange={(e) => setAlpha(e.target.value)}
                    style={{
                      padding: isMobile ? '8px' : '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      fontSize: isMobile ? '14px' : '16px',
                      width: isMobile ? '100%' : '80px',
                    }}
                  >
                    {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => (
                      <option key={letter} value={letter}>
                        {letter}
                      </option>
                    ))}
                  </select>
                </div>
                {!isMobile && <span style={{ fontSize: '24px', color: '#5a6c7d', marginBottom: '8px' }}>-</span>}
                <div style={{ flex: isMobile ? '1 0 100%' : '0 0 auto' }}>
                  <label style={{ display: 'block', fontSize: isMobile ? '11px' : '12px', color: '#5a6c7d', marginBottom: '5px' }}>
                    2桁数字
                  </label>
                  <input
                    type="text"
                    value={twoDigit}
                    onChange={(e) => setTwoDigit(e.target.value.slice(0, 2))}
                    maxLength={2}
                    placeholder="07"
                    style={{
                      padding: isMobile ? '8px' : '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      fontSize: isMobile ? '14px' : '16px',
                      width: isMobile ? '100%' : '80px',
                    }}
                  />
                </div>
                {!isMobile && <span style={{ fontSize: '24px', color: '#5a6c7d', marginBottom: '8px' }}>-</span>}
                <div style={{ flex: isMobile ? '1 0 100%' : '0 0 auto' }}>
                  <label style={{ display: 'block', fontSize: isMobile ? '11px' : '12px', color: '#5a6c7d', marginBottom: '5px' }}>
                    5桁数字（開始番号）
                  </label>
                  <input
                    type="text"
                    value={fiveDigit}
                    onChange={(e) => setFiveDigit(e.target.value.slice(0, 5))}
                    maxLength={5}
                    placeholder="00001"
                    style={{
                      padding: isMobile ? '8px' : '10px',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      fontSize: isMobile ? '14px' : '16px',
                      width: isMobile ? '100%' : '120px',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 再発行タブ */}
          {tab === 'reissue' && (
            <div style={{ marginBottom: isMobile ? '20px' : '30px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', color: '#2c3e50', marginBottom: '12px', fontSize: isMobile ? '14px' : '16px' }}>
                再発行したい番号を入力
              </label>
              <input
                type="text"
                value={reissueNumber}
                onChange={(e) => setReissueNumber(e.target.value)}
                placeholder="R-07-00001"
                style={{
                  padding: isMobile ? '8px' : '10px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  fontSize: isMobile ? '14px' : '16px',
                  width: '100%',
                  maxWidth: isMobile ? '100%' : '400px',
                }}
              />
              <div style={{ fontSize: isMobile ? '12px' : '13px', color: '#5a6c7d', marginTop: '6px' }}>
                （社内で作成済みの番号を入力してください）
              </div>
            </div>
          )}

          {/* ラベルテンプレート選択 */}
          <div style={{ marginBottom: isMobile ? '20px' : '30px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', color: '#2c3e50', marginBottom: '12px', fontSize: isMobile ? '14px' : '16px' }}>
              ラベルテンプレートを選択 <span style={{ color: '#e74c3c' }}>*</span>
            </label>

            {/* QRコードテンプレート */}
            <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
              <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 'bold', color: '#5a6c7d', marginBottom: '10px' }}>QRコード</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? '8px' : '10px' }}>
                {['qr-small', 'qr-medium', 'qr-large'].map((value) => (
                  <label
                    key={value}
                    style={{
                      border: template === value ? '3px solid #27ae60' : '2px solid #dee2e6',
                      borderRadius: '8px',
                      padding: isMobile ? '12px' : '15px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: template === value ? '#f0f9f4' : 'white',
                    }}
                  >
                    <input
                      type="radio"
                      name="template"
                      value={value}
                      checked={template === value}
                      onChange={(e) => setTemplate(e.target.value)}
                      style={{ display: 'none' }}
                    />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: isMobile ? '28px' : '32px', marginBottom: '8px' }}>▣</div>
                      <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '4px' }}>
                        {value.includes('small') ? '小サイズ' : value.includes('medium') ? '中サイズ' : '大サイズ'}
                      </div>
                      <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#5a6c7d' }}>
                        {value.includes('small') ? '18mm幅' : value.includes('medium') ? '24mm幅' : '36mm幅'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* バーコードテンプレート */}
            <div>
              <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 'bold', color: '#5a6c7d', marginBottom: '10px' }}>
                バーコード
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? '8px' : '10px' }}>
                {['barcode-small', 'barcode-medium', 'barcode-large'].map((value) => (
                  <label
                    key={value}
                    style={{
                      border: template === value ? '3px solid #27ae60' : '2px solid #dee2e6',
                      borderRadius: '8px',
                      padding: isMobile ? '12px' : '15px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: template === value ? '#f0f9f4' : 'white',
                    }}
                  >
                    <input
                      type="radio"
                      name="template"
                      value={value}
                      checked={template === value}
                      onChange={(e) => setTemplate(e.target.value)}
                      style={{ display: 'none' }}
                    />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: isMobile ? '20px' : '24px', marginBottom: '8px' }}>||||||||</div>
                      <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '4px' }}>
                        {value.includes('small') ? '小サイズ' : value.includes('medium') ? '中サイズ' : '大サイズ'}
                      </div>
                      <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#5a6c7d' }}>
                        {value.includes('small') ? '18mm幅' : value.includes('medium') ? '24mm幅' : '36mm幅'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* フッター記入項目 */}
          <div style={{ marginBottom: isMobile ? '20px' : '30px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', color: '#2c3e50', marginBottom: '12px', fontSize: isMobile ? '14px' : '16px' }}>
              フッター記入項目
            </label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value.slice(0, footerCharMax))}
              maxLength={footerCharMax}
              placeholder="フッターテキストを入力"
              style={{
                padding: isMobile ? '8px' : '10px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: isMobile ? '14px' : '16px',
                width: '100%',
              }}
            />
            <div style={{ fontSize: isMobile ? '12px' : '13px', color: '#5a6c7d', marginTop: '6px', textAlign: 'right' }}>
              {footerText.length} / {footerCharMax} 文字
            </div>
          </div>

          {/* 発行枚数 */}
          <div style={{ marginBottom: isMobile ? '20px' : '30px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', color: '#2c3e50', marginBottom: '12px', fontSize: isMobile ? '14px' : '16px' }}>
              発行枚数 <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <input
              type="number"
              value={issueCount}
              onChange={(e) => setIssueCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
              min={1}
              max={100}
              style={{
                padding: isMobile ? '8px' : '10px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: isMobile ? '14px' : '16px',
                width: isMobile ? '100%' : '150px',
              }}
            />
            <div style={{ fontSize: isMobile ? '12px' : '13px', color: '#5a6c7d', marginTop: '6px' }}>
              ※最大100枚まで一括発行可能です
            </div>
          </div>

          {/* 発行予定番号範囲 */}
          <div
            style={{
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: isMobile ? '16px' : '20px',
              marginBottom: isMobile ? '20px' : '30px',
            }}
          >
            <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '12px' }}>
              発行予定番号範囲
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '15px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 'bold', color: '#2c3e50' }}>{range.start}</span>
              <span style={{ fontSize: isMobile ? '16px' : '18px', color: '#5a6c7d' }}>〜</span>
              <span style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 'bold', color: '#2c3e50' }}>{range.end}</span>
              <span style={{ fontSize: isMobile ? '13px' : '14px', color: '#5a6c7d' }}>({range.count}枚)</span>
            </div>
          </div>

          {/* ボタン */}
          <div style={{ display: 'flex', gap: isMobile ? '8px' : '10px', justifyContent: 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
            <button
              onClick={() => router.back()}
              style={{
                padding: isMobile ? '12px 20px' : '12px 30px',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: isMobile ? '15px' : '16px',
                fontWeight: 'bold',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              キャンセル
            </button>
            <button
              onClick={handleGoToPrintPreview}
              style={{
                padding: isMobile ? '12px 20px' : '12px 30px',
                background: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: isMobile ? '15px' : '16px',
                fontWeight: 'bold',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              印刷プレビューへ →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
