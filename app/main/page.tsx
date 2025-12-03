'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useMasterStore } from '@/lib/stores';
import { getUserType } from '@/lib/types';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export default function MainPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { facilities } = useMasterStore();
  const { isMobile, isTablet } = useResponsive();
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [buttonsEnabled, setButtonsEnabled] = useState(false);

  // 施設マスタから施設名オプションを生成
  const facilityOptions = useMemo(() => {
    return facilities.map(f => f.facilityName);
  }, [facilities]);

  // メールアドレスからユーザー種別を判定
  const userType = user ? getUserType(user.email) : 'consultant';
  const isConsultant = userType === 'consultant';
  const isHospital = userType === 'hospital';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleQRRead = () => {
    alert('QR読取機能（開発中）');
  };

  const handleRemodelManagement = () => {
    router.push('/application-list');
  };

  const handleQuotationManagement = () => {
    router.push('/quotation-data-box');
  };

  const showMasterModal = () => {
    setIsMasterModalOpen(true);
  };

  const closeMasterModal = () => {
    setIsMasterModalOpen(false);
  };

  const showListModal = () => {
    setIsListModalOpen(true);
  };

  const closeListModal = () => {
    setIsListModalOpen(false);
    setSelectedFacility('');
    setButtonsEnabled(false);
  };

  const handleFacilityChange = (facilityName: string) => {
    setSelectedFacility(facilityName);
    setButtonsEnabled(!!facilityName);
  };

  const handleMenuSelect = (menuName: string) => {
    closeListModal();

    switch (menuName) {
      case 'QRコード発行':
        router.push('/qr-issue');
        break;
      case '現有品調査':
        router.push('/offline-prep');
        break;
      case '現有品調査内容修正':
        router.push('/registration-edit');
        break;
      case '資産台帳取込':
        router.push('/asset-import');
        break;
      case 'データ突合':
        router.push('/data-matching');
        break;
    }
  };

  const handleQRIssueFromModal = () => {
    router.push('/qr-issue');
  };

  const handleAssetBrowseAndApplication = () => {
    router.push('/asset-search-result');
  };

  const handleMaintenanceInspection = () => {
    alert('保守・点検機能（開発中）');
  };

  const handleLendingManagement = () => {
    alert('貸出管理機能（開発中）');
  };

  const handleRepairApplication = () => {
    alert('修理申請機能（開発中）');
  };

  const handleAllDataView = () => {
    alert('全データ閲覧機能（開発中）');
  };

  const handleHistory = () => {
    router.push('/history');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f5f5f5', padding: '20px' }}>
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          width: '100%'
        }}
      >
        {/* ヘッダー */}
        <header
          style={{
            background: '#2c3e50',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '8px 8px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  background: '#27ae60',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                SHIP
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                HEALTHCARE 医療機器管理システム
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* コンサルタント専用ボタン */}
            {isConsultant && (
              <>
                <button
                  onClick={handleQRRead}
                  style={{
                    padding: '8px 16px',
                    background: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'background 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#229954';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#27ae60';
                  }}
                >
                  QR読取
                </button>
                <button
                  onClick={handleRemodelManagement}
                  style={{
                    padding: '8px 16px',
                    background: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'background 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#229954';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#27ae60';
                  }}
                >
                  リモデル管理
                </button>
                <button
                  onClick={handleQuotationManagement}
                  style={{
                    padding: '8px 16px',
                    background: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'background 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#229954';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#27ae60';
                  }}
                >
                  見積管理
                </button>
                <button
                  onClick={showMasterModal}
                  style={{
                    padding: '8px 16px',
                    background: '#34495e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'background 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#2c3e50';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#34495e';
                  }}
                >
                  マスタ管理
                </button>
                <button
                  onClick={showListModal}
                  style={{
                    padding: '8px 16px',
                    background: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'background 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#229954';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#27ae60';
                  }}
                >
                  個体管理リスト作成
                </button>
              </>
            )}

            {/* 病院ユーザー専用ボタン */}
            {isHospital && (
              <button
                onClick={handleQRIssueFromModal}
                style={{
                  padding: '8px 16px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#229954';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#27ae60';
                }}
              >
                QRコード発行
              </button>
            )}

            {/* ログアウトボタン（全ユーザー共通） */}
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#c0392b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#e74c3c';
              }}
            >
              ログアウト
            </button>
          </div>
        </header>

        {/* メニューセクション */}
        <div style={{ padding: isMobile ? '15px 10px' : isTablet ? '20px 10px' : '30px 20px', background: '#f8f9fa' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: isMobile || isTablet ? 'wrap' : 'nowrap',
              gap: isMobile ? '6px' : isTablet ? '8px' : '12px',
              maxWidth: '1400px',
              margin: '0 auto',
              justifyContent: 'center'
            }}
          >
            <button
              onClick={handleAssetBrowseAndApplication}
              style={{
                background: 'white',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                padding: isMobile ? '8px 10px' : isTablet ? '9px 12px' : '14px 20px',
                fontSize: isMobile ? '11px' : isTablet ? '12px' : '15px',
                fontWeight: '600',
                color: '#2c3e50',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                flex: '0 0 auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#27ae60';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = '#27ae60';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(39, 174, 96, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#2c3e50';
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              資産閲覧・申請
            </button>
            <button
              onClick={handleMaintenanceInspection}
              style={{
                background: 'white',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                padding: isMobile ? '8px 10px' : isTablet ? '9px 12px' : '14px 20px',
                fontSize: isMobile ? '11px' : isTablet ? '12px' : '15px',
                fontWeight: '600',
                color: '#2c3e50',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                flex: '0 0 auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#27ae60';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = '#27ae60';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(39, 174, 96, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#2c3e50';
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              保守・点検
            </button>
            <button
              onClick={handleLendingManagement}
              style={{
                background: 'white',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                padding: isMobile ? '8px 10px' : isTablet ? '9px 12px' : '14px 20px',
                fontSize: isMobile ? '11px' : isTablet ? '12px' : '15px',
                fontWeight: '600',
                color: '#2c3e50',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                flex: '0 0 auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#27ae60';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = '#27ae60';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(39, 174, 96, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#2c3e50';
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              貸出管理
            </button>
            <button
              onClick={handleRepairApplication}
              style={{
                background: 'white',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                padding: isMobile ? '8px 10px' : isTablet ? '9px 12px' : '14px 20px',
                fontSize: isMobile ? '11px' : isTablet ? '12px' : '15px',
                fontWeight: '600',
                color: '#2c3e50',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                flex: '0 0 auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#27ae60';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = '#27ae60';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(39, 174, 96, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#2c3e50';
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              修理申請
            </button>
            <button
              onClick={handleAllDataView}
              style={{
                background: 'white',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                padding: isMobile ? '8px 10px' : isTablet ? '9px 12px' : '14px 20px',
                fontSize: isMobile ? '11px' : isTablet ? '12px' : '15px',
                fontWeight: '600',
                color: '#2c3e50',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                flex: '0 0 auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#27ae60';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = '#27ae60';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(39, 174, 96, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#2c3e50';
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              全データ閲覧（閲覧・出力）
            </button>
            <button
              onClick={handleHistory}
              style={{
                background: 'white',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                padding: isMobile ? '8px 10px' : isTablet ? '9px 12px' : '14px 20px',
                fontSize: isMobile ? '11px' : isTablet ? '12px' : '15px',
                fontWeight: '600',
                color: '#2c3e50',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                flex: '0 0 auto'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#27ae60';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = '#27ae60';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(39, 174, 96, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#2c3e50';
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              登録履歴
            </button>
          </div>
        </div>

        {/* ダッシュボードボディ（次スコープ用） */}
        <div
          style={{
            padding: '40px 20px',
            minHeight: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              textAlign: 'center',
              color: '#7f8c8d',
              fontSize: '16px',
              padding: '40px',
              background: 'white',
              border: '2px dashed #ddd',
              borderRadius: '8px',
              maxWidth: '600px',
              margin: '0 auto'
            }}
          >
            <p>※ ダッシュボード機能は次スコープで実装予定です</p>
          </div>
        </div>
      </div>

      {/* 個体管理リスト作成モーダル */}
      {isListModalOpen && (
        <div
          onClick={closeListModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '600px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}
          >
            {/* モーダルヘッダー */}
            <div
              style={{
                background: '#27ae60',
                color: 'white',
                padding: '20px 24px',
                fontSize: '20px',
                fontWeight: 'bold',
              }}
            >
              個体管理リスト作成
            </div>

            {/* モーダルボディ */}
            <div style={{ padding: '24px' }}>
              {/* 施設選択 */}
              <div style={{ marginBottom: '32px' }}>
                <SearchableSelect
                  label="施設を選択"
                  value={selectedFacility}
                  onChange={handleFacilityChange}
                  options={['', ...facilityOptions]}
                  placeholder="施設を選択してください"
                  isMobile={isMobile}
                />
              </div>

              {/* メニューボタン */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '16px',
                }}
              >
                <button
                  onClick={() => handleMenuSelect('QRコード発行')}
                  disabled={!buttonsEnabled}
                  style={{
                    padding: '14px 18px',
                    background: buttonsEnabled ? 'white' : '#f5f5f5',
                    color: buttonsEnabled ? '#2c3e50' : '#999',
                    border: buttonsEnabled ? '2px solid #27ae60' : '2px solid #ddd',
                    borderRadius: '6px',
                    cursor: buttonsEnabled ? 'pointer' : 'not-allowed',
                    fontSize: '15px',
                    fontWeight: 600,
                    transition: 'all 0.3s',
                    minHeight: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: buttonsEnabled ? 1 : 0.6,
                  }}
                  onMouseEnter={(e) => {
                    if (buttonsEnabled) {
                      e.currentTarget.style.background = '#27ae60';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (buttonsEnabled) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#2c3e50';
                    }
                  }}
                >
                  QRコード発行
                </button>

                <button
                  onClick={() => handleMenuSelect('現有品調査')}
                  disabled={!buttonsEnabled}
                  style={{
                    padding: '14px 18px',
                    background: buttonsEnabled ? 'white' : '#f5f5f5',
                    color: buttonsEnabled ? '#2c3e50' : '#999',
                    border: buttonsEnabled ? '2px solid #27ae60' : '2px solid #ddd',
                    borderRadius: '6px',
                    cursor: buttonsEnabled ? 'pointer' : 'not-allowed',
                    fontSize: '15px',
                    fontWeight: 600,
                    transition: 'all 0.3s',
                    minHeight: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: buttonsEnabled ? 1 : 0.6,
                  }}
                  onMouseEnter={(e) => {
                    if (buttonsEnabled) {
                      e.currentTarget.style.background = '#27ae60';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (buttonsEnabled) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#2c3e50';
                    }
                  }}
                >
                  現有品調査
                </button>

                <button
                  onClick={() => handleMenuSelect('現有品調査内容修正')}
                  disabled={!buttonsEnabled}
                  style={{
                    padding: '14px 18px',
                    background: buttonsEnabled ? 'white' : '#f5f5f5',
                    color: buttonsEnabled ? '#2c3e50' : '#999',
                    border: buttonsEnabled ? '2px solid #27ae60' : '2px solid #ddd',
                    borderRadius: '6px',
                    cursor: buttonsEnabled ? 'pointer' : 'not-allowed',
                    fontSize: '15px',
                    fontWeight: 600,
                    transition: 'all 0.3s',
                    minHeight: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: buttonsEnabled ? 1 : 0.6,
                  }}
                  onMouseEnter={(e) => {
                    if (buttonsEnabled) {
                      e.currentTarget.style.background = '#27ae60';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (buttonsEnabled) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#2c3e50';
                    }
                  }}
                >
                  現有品調査内容修正
                </button>

                <button
                  onClick={() => handleMenuSelect('資産台帳取込')}
                  disabled={!buttonsEnabled}
                  style={{
                    padding: '14px 18px',
                    background: buttonsEnabled ? 'white' : '#f5f5f5',
                    color: buttonsEnabled ? '#2c3e50' : '#999',
                    border: buttonsEnabled ? '2px solid #27ae60' : '2px solid #ddd',
                    borderRadius: '6px',
                    cursor: buttonsEnabled ? 'pointer' : 'not-allowed',
                    fontSize: '15px',
                    fontWeight: 600,
                    transition: 'all 0.3s',
                    minHeight: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: buttonsEnabled ? 1 : 0.6,
                  }}
                  onMouseEnter={(e) => {
                    if (buttonsEnabled) {
                      e.currentTarget.style.background = '#27ae60';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (buttonsEnabled) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#2c3e50';
                    }
                  }}
                >
                  資産台帳取込
                </button>

                <button
                  onClick={() => handleMenuSelect('データ突合')}
                  disabled={!buttonsEnabled}
                  style={{
                    padding: '14px 18px',
                    background: buttonsEnabled ? 'white' : '#f5f5f5',
                    color: buttonsEnabled ? '#2c3e50' : '#999',
                    border: buttonsEnabled ? '2px solid #27ae60' : '2px solid #ddd',
                    borderRadius: '6px',
                    cursor: buttonsEnabled ? 'pointer' : 'not-allowed',
                    fontSize: '15px',
                    fontWeight: 600,
                    transition: 'all 0.3s',
                    minHeight: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: buttonsEnabled ? 1 : 0.6,
                  }}
                  onMouseEnter={(e) => {
                    if (buttonsEnabled) {
                      e.currentTarget.style.background = '#27ae60';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (buttonsEnabled) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#2c3e50';
                    }
                  }}
                >
                  データ突合
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* マスタ管理モーダル */}
      {isMasterModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={closeMasterModal}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* モーダルヘッダー */}
            <div
              style={{
                padding: '24px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#2c3e50' }}>
                マスタ管理
              </h2>
              <button
                onClick={closeMasterModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#7f8c8d',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                ×
              </button>
            </div>

            {/* モーダルコンテンツ */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => {
                    closeMasterModal();
                    router.push('/ship-facility-master');
                  }}
                  style={{
                    padding: '16px 24px',
                    background: 'white',
                    border: '2px solid #27ae60',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#2c3e50',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#27ae60';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#2c3e50';
                  }}
                >
                  <span>🏥 SHIP施設マスタ</span>
                  <span style={{ fontSize: '20px' }}>→</span>
                </button>

                <button
                  onClick={() => {
                    closeMasterModal();
                    router.push('/ship-asset-master');
                  }}
                  style={{
                    padding: '16px 24px',
                    background: 'white',
                    border: '2px solid #3498db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#2c3e50',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#3498db';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#2c3e50';
                  }}
                >
                  <span>🏥 SHIP資産マスタ</span>
                  <span style={{ fontSize: '20px' }}>→</span>
                </button>

                <button
                  onClick={() => {
                    closeMasterModal();
                    showListModal();
                  }}
                  style={{
                    padding: '16px 24px',
                    background: 'white',
                    border: '2px solid #e74c3c',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#2c3e50',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e74c3c';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#2c3e50';
                  }}
                >
                  <span>📋 個体管理リスト作成</span>
                  <span style={{ fontSize: '20px' }}>→</span>
                </button>
              </div>

              <p style={{ marginTop: '20px', fontSize: '13px', color: '#7f8c8d', textAlign: 'center' }}>
                マスタ管理と個体管理リスト作成を行えます
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
