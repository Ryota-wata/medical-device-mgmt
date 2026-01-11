'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';

function QRPrintContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile, isTablet } = useResponsive();

  const [printer, setPrinter] = useState('sr5900p');
  const [qrNumbers, setQrNumbers] = useState<string[]>([]);
  const [template, setTemplate] = useState('');
  const [footerText, setFooterText] = useState('');

  useEffect(() => {
    // Get parameters from URL
    const templateParam = searchParams.get('template') || 'qr-small';
    const startParam = searchParams.get('start') || '';
    const endParam = searchParams.get('end') || '';
    const footerParam = searchParams.get('footer') || '';

    setTemplate(templateParam);
    setFooterText(footerParam);

    // Generate QR number list from start to end
    if (startParam && endParam) {
      const numbers = generateQRNumberList(startParam, endParam);
      setQrNumbers(numbers);
    }
  }, [searchParams]);

  const generateQRNumberList = (start: string, end: string): string[] => {
    // If start and end are the same (reissue), return single item
    if (start === end) {
      return [start];
    }

    // Parse start and end numbers
    // Format: AA-DD-NNNNN (e.g., R07-01-00001)
    const startParts = start.split('-');
    const endParts = end.split('-');

    if (startParts.length !== 3 || endParts.length !== 3) {
      return [start];
    }

    const alpha = startParts[0];
    const twoDigit = startParts[1];
    const startNum = parseInt(startParts[2]);
    const endNum = parseInt(endParts[2]);

    const numbers: string[] = [];
    for (let i = startNum; i <= endNum; i++) {
      const numStr = String(i).padStart(5, '0');
      numbers.push(`${alpha}-${twoDigit}-${numStr}`);
    }

    return numbers;
  };

  const getTemplateDisplayName = (templateKey: string): string => {
    const names: Record<string, string> = {
      'qr-12x12': 'QRコード 12×12mm',
      'qr-12x24': 'QRコード 12×24mm',
      'qr-18x18': 'QRコード 18×18mm',
      'qr-18x24': 'QRコード 18×24mm',
      'qr-24x24': 'QRコード 24×24mm',
      'qr-24x32': 'QRコード 24×32mm',
    };
    return names[templateKey] || templateKey;
  };

  const getSealSizeFromTemplate = (templateKey: string): string => {
    const sizes: Record<string, string> = {
      'qr-12x12': '12×12mm',
      'qr-12x24': '12×24mm',
      'qr-18x18': '18×18mm',
      'qr-18x24': '18×24mm',
      'qr-24x24': '24×24mm',
      'qr-24x32': '24×32mm',
    };
    return sizes[templateKey] || templateKey;
  };

  const handleCancel = () => {
    router.back();
  };

  const handlePrintStart = () => {
    alert('印刷を開始します（この機能は実装予定）');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#fff' }}>
      {/* Header */}
      <div style={{
        background: '#2d7f3e',
        color: 'white',
        padding: isMobile ? '12px 16px' : isTablet ? '14px 20px' : '16px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px' }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              padding: isMobile ? '8px 12px' : '10px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>←</span>
            <span>戻る</span>
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h1 style={{ fontSize: isMobile ? '16px' : isTablet ? '18px' : '22px', fontWeight: 600, margin: 0 }}>QRコード印刷</h1>
            <span style={{ fontSize: isMobile ? '12px' : '14px', opacity: 0.9 }}>東京総合病院</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        padding: isMobile ? '20px 12px' : isTablet ? '24px 16px' : '32px 40px',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto'
      }}>
        {/* Page Header */}
        <div style={{ marginBottom: isMobile ? '20px' : isTablet ? '24px' : '32px' }}>
          <h2 style={{ fontSize: isMobile ? '20px' : isTablet ? '24px' : '28px', fontWeight: 600, color: '#2c3e50', marginBottom: '8px' }}>
            QRコード印刷プレビュー
          </h2>
        </div>

        {/* Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: (isMobile || isTablet) ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : isTablet ? '20px' : '24px' }}>
          {/* Left Column: Settings */}
          <div>
            {/* Print Settings Section */}
            <div style={{
              background: 'white',
              border: '2px solid #e0e0e0',
              borderRadius: isMobile ? '8px' : '12px',
              padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
              marginBottom: isMobile ? '16px' : isTablet ? '20px' : '24px'
            }}>
              <div style={{
                marginBottom: isMobile ? '16px' : '20px',
                paddingBottom: isMobile ? '12px' : '16px',
                borderBottom: '2px solid #f0f0f0'
              }}>
                <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, color: '#2c3e50', margin: 0 }}>
                  ⚙️ 印刷設定
                </h3>
              </div>

              <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 600,
                  color: '#333',
                  marginBottom: '8px'
                }}>
                  プリンタ
                </label>
                <select
                  value={printer}
                  onChange={(e) => setPrinter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '10px 12px' : '12px 14px',
                    fontSize: isMobile ? '14px' : '15px',
                    border: '2px solid #d0d0d0',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="sr5900p">TEPRA SR5900P (USB接続)</option>
                  <option value="sr970">TEPRA SR970 (Bluetooth)</option>
                </select>
              </div>

              <div style={{ marginBottom: '0' }}>
                <label style={{
                  display: 'block',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 600,
                  color: '#333',
                  marginBottom: '8px'
                }}>
                  シールサイズ
                </label>
                <div style={{
                  width: '100%',
                  padding: isMobile ? '10px 12px' : '12px 14px',
                  fontSize: isMobile ? '14px' : '15px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  background: '#f5f5f5',
                  color: '#333'
                }}>
                  {getSealSizeFromTemplate(template)}
                </div>
                <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#666', marginTop: '6px' }}>
                  ※前の画面で設定したテンプレートに基づいて表示されます
                </div>
              </div>
            </div>

            {/* Print Target List Section */}
            <div style={{
              background: 'white',
              border: '2px solid #e0e0e0',
              borderRadius: isMobile ? '8px' : '12px',
              padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
              marginBottom: isMobile ? '16px' : isTablet ? '20px' : '24px'
            }}>
              <div style={{
                marginBottom: isMobile ? '16px' : '20px',
                paddingBottom: isMobile ? '12px' : '16px',
                borderBottom: '2px solid #f0f0f0'
              }}>
                <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, color: '#2c3e50', margin: 0 }}>
                  📋 印刷対象リスト
                </h3>
              </div>

              <div style={{
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'hidden',
                maxHeight: isMobile ? '300px' : '400px',
                overflowY: 'auto'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{
                        background: '#fafbfc',
                        padding: isMobile ? '8px 10px' : '10px 12px',
                        textAlign: 'left',
                        fontSize: isMobile ? '11px' : '12px',
                        fontWeight: 600,
                        color: '#5a6c7d',
                        borderBottom: '2px solid #e0e0e0',
                        position: 'sticky',
                        top: 0
                      }}>No.</th>
                      <th style={{
                        background: '#fafbfc',
                        padding: isMobile ? '8px 10px' : '10px 12px',
                        textAlign: 'left',
                        fontSize: isMobile ? '11px' : '12px',
                        fontWeight: 600,
                        color: '#5a6c7d',
                        borderBottom: '2px solid #e0e0e0',
                        position: 'sticky',
                        top: 0
                      }}>QR番号</th>
                      <th style={{
                        background: '#fafbfc',
                        padding: isMobile ? '8px 10px' : '10px 12px',
                        textAlign: 'left',
                        fontSize: isMobile ? '11px' : '12px',
                        fontWeight: 600,
                        color: '#5a6c7d',
                        borderBottom: '2px solid #e0e0e0',
                        position: 'sticky',
                        top: 0
                      }}>ステータス</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qrNumbers.slice(0, 10).map((number, index) => (
                      <tr key={index}>
                        <td style={{
                          padding: isMobile ? '8px 10px' : '10px 12px',
                          fontSize: isMobile ? '12px' : '13px',
                          color: '#2c3e50',
                          borderBottom: index < Math.min(qrNumbers.length, 10) - 1 ? '1px solid #f0f0f0' : 'none'
                        }}>{index + 1}</td>
                        <td style={{
                          padding: isMobile ? '8px 10px' : '10px 12px',
                          fontSize: isMobile ? '12px' : '13px',
                          color: '#2d7f3e',
                          borderBottom: index < Math.min(qrNumbers.length, 10) - 1 ? '1px solid #f0f0f0' : 'none',
                          fontFamily: "'Courier New', monospace",
                          fontWeight: 600
                        }}>{number}</td>
                        <td style={{
                          padding: isMobile ? '8px 10px' : '10px 12px',
                          fontSize: isMobile ? '12px' : '13px',
                          color: '#2c3e50',
                          borderBottom: index < Math.min(qrNumbers.length, 10) - 1 ? '1px solid #f0f0f0' : 'none'
                        }}>印刷待機中</td>
                      </tr>
                    ))}
                    {qrNumbers.length > 10 && (
                      <tr>
                        <td colSpan={3} style={{
                          padding: isMobile ? '8px 10px' : '10px 12px',
                          fontSize: isMobile ? '12px' : '13px',
                          color: '#666',
                          textAlign: 'center',
                          fontStyle: 'italic'
                        }}>
                          ... 他 {qrNumbers.length - 10} 件
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Preview */}
          <div>
            <div style={{
              background: 'white',
              border: '2px solid #e0e0e0',
              borderRadius: isMobile ? '8px' : '12px',
              padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
              marginBottom: isMobile ? '16px' : isTablet ? '20px' : '24px'
            }}>
              <div style={{
                marginBottom: isMobile ? '16px' : '20px',
                paddingBottom: isMobile ? '12px' : '16px',
                borderBottom: '2px solid #f0f0f0'
              }}>
                <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, color: '#2c3e50', margin: 0 }}>
                  👁️ 印刷プレビュー
                </h3>
              </div>

              <div style={{
                background: '#fafbfc',
                border: '2px solid #e0e0e0',
                borderRadius: isMobile ? '8px' : '12px',
                padding: isMobile ? '20px' : isTablet ? '24px' : '32px',
                textAlign: 'center',
                minHeight: isMobile ? '300px' : '400px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  fontSize: isMobile ? '12px' : '13px',
                  fontWeight: 600,
                  color: '#666',
                  marginBottom: isMobile ? '16px' : '24px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  シール印刷イメージ
                </div>

                <div style={{
                  fontSize: isMobile ? '12px' : '13px',
                  color: '#666',
                  background: '#f5f5f5',
                  padding: isMobile ? '6px 12px' : '8px 16px',
                  borderRadius: '4px',
                  marginBottom: isMobile ? '12px' : '16px'
                }}>
                  {getTemplateDisplayName(template)}
                </div>

                <div style={{
                  background: 'white',
                  border: isMobile ? '2px solid #2d7f3e' : '3px solid #2d7f3e',
                  borderRadius: '8px',
                  padding: isMobile ? '16px' : '24px',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: isMobile ? '10px' : '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {/* QR Code Placeholder */}
                  <div style={{
                    width: isMobile ? '100px' : '120px',
                    height: isMobile ? '100px' : '120px',
                    background: 'white',
                    border: isMobile ? '2px solid #333' : '3px solid #333',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? '40px' : '48px',
                    color: '#333'
                  }}>
                    ▣
                  </div>

                  {/* QR Number */}
                  <div style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: isMobile ? '16px' : '18px',
                    fontWeight: 700,
                    color: '#2d7f3e'
                  }}>
                    {qrNumbers.length > 0 ? qrNumbers[0] : ''}
                  </div>

                  {/* Footer Text */}
                  {footerText && (
                    <div style={{
                      fontSize: isMobile ? '10px' : '11px',
                      color: '#333',
                      textAlign: 'center',
                      marginTop: '8px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%'
                    }}>
                      {footerText}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Button Group */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '10px' : '12px',
          justifyContent: 'flex-end',
          marginTop: isMobile ? '20px' : isTablet ? '24px' : '32px',
          paddingTop: isMobile ? '16px' : '24px',
          borderTop: '1px solid #e0e0e0',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <button
            onClick={handleCancel}
            style={{
              padding: isMobile ? '12px 24px' : isTablet ? '13px 28px' : '14px 32px',
              fontSize: isMobile ? '15px' : '16px',
              fontWeight: 600,
              border: '2px solid #d0d0d0',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'white',
              color: '#666',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            <span>キャンセル</span>
          </button>
          <button
            onClick={handlePrintStart}
            style={{
              padding: isMobile ? '12px 24px' : isTablet ? '13px 28px' : '14px 32px',
              fontSize: isMobile ? '15px' : '16px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(39, 174, 96, 0.3)',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            <span>🖨️</span>
            <span>印刷を開始</span>
          </button>
        </div>
      </div>
    </div>
  );
}


export default function QRPrintPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <QRPrintContent />
    </Suspense>
  );
}
