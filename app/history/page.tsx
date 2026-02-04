'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface HistoryCardData {
  id: number;
  labelNumber: string;
  item: string;
  maker: string;
  model: string;
  size: string;
}

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const facilityName = searchParams.get('facility') || '';
  const { isMobile, isTablet } = useResponsive();
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [editingCards, setEditingCards] = useState<Set<number>>(new Set());
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);

  const handleHomeClick = () => {
    if (selectedCards.size > 0) {
      setShowHomeConfirm(true);
    } else {
      router.push('/main');
    }
  };

  const historyData: HistoryCardData[] = [
    {
      id: 1,
      labelNumber: 'L-001234',
      item: '超音波診断装置',
      maker: 'ABC社',
      model: 'US-1000',
      size: '450×380×120'
    },
    {
      id: 2,
      labelNumber: 'L-001235',
      item: 'ノートPC',
      maker: 'XYZ社',
      model: 'NB-2000',
      size: '350×250×25'
    },
    {
      id: 3,
      labelNumber: 'L-001236',
      item: '人工呼吸器',
      maker: 'DEF社',
      model: 'RES-500',
      size: '300×350×280'
    },
    {
      id: 4,
      labelNumber: 'L-001237',
      item: '事務デスク',
      maker: '家具工房',
      model: 'D-1200',
      size: '1200×700×720'
    },
    {
      id: 5,
      labelNumber: 'L-001238',
      item: '血液分析装置',
      maker: 'メディカル社',
      model: 'BA-3000',
      size: '420×360×340'
    },
    {
      id: 6,
      labelNumber: 'L-001239',
      item: '業務用複合機',
      maker: 'オフィス機器',
      model: 'MFP-7000',
      size: '550×580×680'
    }
  ];

  const handleSelectCard = (id: number) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCards(newSelected);
  };

  const handleBack = () => {
    const params = facilityName ? `?facility=${encodeURIComponent(facilityName)}` : '';
    router.push(`/survey-location${params}`);
  };

  const handleEdit = () => {
    if (selectedCards.size === 0) {
      alert('修正する項目を選択してください');
      return;
    }
    alert(`${selectedCards.size}件の修正を開始します`);
  };

  const handleReuse = () => {
    if (selectedCards.size === 0) {
      alert('再利用する項目を選択してください');
      return;
    }
    const selectedData = historyData.filter(item => selectedCards.has(item.id));
    console.log('再利用データ:', selectedData);
    alert(`${selectedCards.size}件のデータを再利用します`);
    router.push('/asset-survey-integrated');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        padding: isMobile ? '12px 16px' : '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: '600'
            }}>
              <div style={{
                backgroundColor: '#1976d2',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}>
                SHIP
              </div>
              {!isMobile && <span style={{ color: '#2c3e50' }}>HEALTHCARE 医療機器管理システム</span>}
            </div>
          </div>
          <h1 style={{
            fontSize: isMobile ? '18px' : '24px',
            fontWeight: 'bold',
            color: '#2c3e50',
            margin: 0
          }}>
            登録履歴
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: isMobile ? '16px' : '24px',
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        <div style={{
          marginBottom: '20px',
          fontSize: isMobile ? '14px' : '16px',
          color: '#5a6c7d',
          fontWeight: '600'
        }}>
          {historyData.length}件の登録履歴
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? '12px' : '16px'
        }}>
          {historyData.map((card) => (
            <div
              key={card.id}
              onClick={() => handleSelectCard(card.id)}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: selectedCards.has(card.id) ? '3px solid #1976d2' : '1px solid #e0e0e0',
                padding: isMobile ? '12px' : '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selectedCards.has(card.id)
                  ? '0 4px 12px rgba(25, 118, 210, 0.3)'
                  : '0 2px 4px rgba(0,0,0,0.05)',
                position: 'relative'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div style={{ flex: 1 }}>
                  {/* Row 1 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                    gap: isMobile ? '12px' : '8px',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <label style={{
                        fontSize: '11px',
                        color: '#7a8a9a',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        ラベル番号
                      </label>
                      <span style={{
                        fontSize: isMobile ? '13px' : '14px',
                        color: '#2c3e50',
                        fontWeight: '500'
                      }}>
                        {card.labelNumber}
                      </span>
                    </div>
                    <div>
                      <label style={{
                        fontSize: '11px',
                        color: '#7a8a9a',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        品目
                      </label>
                      <span style={{
                        fontSize: isMobile ? '13px' : '14px',
                        color: '#2c3e50',
                        fontWeight: '500'
                      }}>
                        {card.item}
                      </span>
                    </div>
                    <div>
                      <label style={{
                        fontSize: '11px',
                        color: '#7a8a9a',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        メーカー
                      </label>
                      <span style={{
                        fontSize: isMobile ? '13px' : '14px',
                        color: '#2c3e50',
                        fontWeight: '500'
                      }}>
                        {card.maker}
                      </span>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                    gap: isMobile ? '12px' : '8px'
                  }}>
                    <div>
                      <label style={{
                        fontSize: '11px',
                        color: '#7a8a9a',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        型式
                      </label>
                      <span style={{
                        fontSize: isMobile ? '13px' : '14px',
                        color: '#2c3e50',
                        fontWeight: '500'
                      }}>
                        {card.model}
                      </span>
                    </div>
                    <div>
                      <label style={{
                        fontSize: '11px',
                        color: '#7a8a9a',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        サイズ (W×D×H mm)
                      </label>
                      <span style={{
                        fontSize: isMobile ? '13px' : '14px',
                        color: '#2c3e50',
                        fontWeight: '500'
                      }}>
                        {card.size}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checkbox */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: selectedCards.has(card.id) ? '2px solid #1976d2' : '2px solid #ccc',
                  backgroundColor: selectedCards.has(card.id) ? '#1976d2' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '12px',
                  flexShrink: 0
                }}>
                  {selectedCards.has(card.id) && (
                    <div style={{ color: 'white', fontSize: '14px' }}>✓</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e0e0e0',
        padding: isMobile ? '12px 16px' : '16px 24px',
        position: 'sticky',
        bottom: 0,
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: isMobile ? '12px' : '24px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <button
            onClick={handleHomeClick}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: isMobile ? '8px 16px' : '12px 24px',
              backgroundColor: '#ffffff',
              border: '1px solid #ccc',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: isMobile ? '12px' : '14px'
            }}
          >
            <div style={{
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px',
              borderRadius: '50%',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '16px' : '20px'
            }}>
              🏠
            </div>
            <span>メイン画面</span>
          </button>

          <button
            onClick={handleBack}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: isMobile ? '8px 16px' : '12px 24px',
              backgroundColor: '#ffffff',
              border: '1px solid #ccc',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: isMobile ? '12px' : '14px'
            }}
          >
            <div style={{
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px',
              borderRadius: '50%',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '16px' : '20px'
            }}>
              ←
            </div>
            <span>調査場所選択に戻る</span>
          </button>

          <button
            onClick={handleEdit}
            disabled={selectedCards.size === 0}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: isMobile ? '8px 16px' : '12px 24px',
              backgroundColor: selectedCards.size === 0 ? '#f5f5f5' : '#ffffff',
              border: '1px solid #ccc',
              borderRadius: '8px',
              cursor: selectedCards.size === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              fontSize: isMobile ? '12px' : '14px',
              opacity: selectedCards.size === 0 ? 0.5 : 1
            }}
          >
            <div style={{
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px',
              borderRadius: '50%',
              backgroundColor: '#fff3e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '16px' : '20px'
            }}>
              ✏️
            </div>
            <span>修正</span>
          </button>

          <button
            onClick={handleReuse}
            disabled={selectedCards.size === 0}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: isMobile ? '8px 16px' : '12px 24px',
              backgroundColor: selectedCards.size === 0 ? '#f5f5f5' : '#1976d2',
              border: 'none',
              borderRadius: '8px',
              cursor: selectedCards.size === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              fontSize: isMobile ? '12px' : '14px',
              color: selectedCards.size === 0 ? '#999' : '#ffffff',
              opacity: selectedCards.size === 0 ? 0.5 : 1
            }}
          >
            <div style={{
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px',
              borderRadius: '50%',
              backgroundColor: selectedCards.size === 0 ? '#e0e0e0' : '#1565c0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '16px' : '20px'
            }}>
              ↩️
            </div>
            <span>再利用</span>
          </button>
        </div>
      </footer>

      <ConfirmDialog
        isOpen={showHomeConfirm}
        onClose={() => setShowHomeConfirm(false)}
        onConfirm={() => router.push('/main')}
        title="メイン画面に戻る"
        message="選択状態が破棄されます。メイン画面に戻りますか？"
        confirmLabel="メイン画面に戻る"
        cancelLabel="選択を続ける"
        variant="warning"
      />
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <HistoryContent />
    </Suspense>
  );
}
