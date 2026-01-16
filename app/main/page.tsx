'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useMasterStore, useEditListStore } from '@/lib/stores';
import { getUserType } from '@/lib/types';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export default function MainPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { facilities } = useMasterStore();
  const { editLists, addEditList, deleteEditList } = useEditListStore();
  const { isMobile, isTablet } = useResponsive();
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
  const [isHospitalSelectModalOpen, setIsHospitalSelectModalOpen] = useState(false);
  const [isHospitalMasterModalOpen, setIsHospitalMasterModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedFacilityForMaster, setSelectedFacilityForMaster] = useState('');
  const [buttonsEnabled, setButtonsEnabled] = useState(false);

  // 編集リスト関連のstate
  const [editListMode, setEditListMode] = useState<'select' | 'create'>('select');
  const [newEditListName, setNewEditListName] = useState('');
  const [selectedEditListFacilities, setSelectedEditListFacilities] = useState<string[]>([]);

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

  // 編集リスト関連の関数
  const handleEditListManagement = () => {
    setIsEditListModalOpen(true);
    setEditListMode('select');
  };

  const closeEditListModal = () => {
    setIsEditListModalOpen(false);
    setEditListMode('select');
    setNewEditListName('');
    setSelectedEditListFacilities([]);
  };

  const handleFacilityToggle = (facilityName: string) => {
    setSelectedEditListFacilities(prev => {
      if (prev.includes(facilityName)) {
        return prev.filter(f => f !== facilityName);
      } else {
        return [...prev, facilityName];
      }
    });
  };

  const handleCreateEditList = () => {
    if (!newEditListName.trim()) {
      alert('編集リスト名を入力してください');
      return;
    }
    if (selectedEditListFacilities.length === 0) {
      alert('施設を1つ以上選択してください');
      return;
    }

    addEditList({
      name: newEditListName.trim(),
      facilities: selectedEditListFacilities,
    });

    alert(`編集リスト「${newEditListName.trim()}」を作成しました`);
    closeEditListModal();
  };

  const handleSelectEditList = (listId: string) => {
    const params = new URLSearchParams({
      listId: listId,
    });
    router.push(`/remodel-application?${params.toString()}`);
    closeEditListModal();
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
    const facilityParam = selectedFacility ? `?facility=${encodeURIComponent(selectedFacility)}` : '';
    closeListModal();

    switch (menuName) {
      case 'QRコード発行':
        router.push(`/qr-issue${facilityParam}`);
        break;
      case '現有品調査':
        router.push(`/offline-prep${facilityParam}`);
        break;
      case '現有品調査内容修正':
        router.push(`/registration-edit${facilityParam}`);
        break;
      case '資産台帳取込':
        router.push(`/asset-import${facilityParam}`);
        break;
      case 'データ突合':
        router.push(`/data-matching${facilityParam}`);
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
                  onClick={handleEditListManagement}
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
                  編集リスト
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
              </>
            )}

            {/* 病院ユーザー専用ボタン */}
            {isHospital && (
              <>
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
                <button
                  onClick={() => setIsHospitalMasterModalOpen(true)}
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
              </>
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
                    router.push('/ship-department-master');
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
                  <span>🏢 SHIP部署マスタ</span>
                  <span style={{ fontSize: '20px' }}>→</span>
                </button>

                <button
                  onClick={() => {
                    closeMasterModal();
                    if (isHospital && user?.hospital) {
                      // 病院ユーザーは自身の病院の施設マスタへ直接遷移
                      router.push(`/hospital-facility-master?facility=${encodeURIComponent(user.hospital)}`);
                    } else {
                      // コンサルユーザーは施設選択モーダルを表示
                      setIsHospitalSelectModalOpen(true);
                    }
                  }}
                  style={{
                    padding: '16px 24px',
                    background: 'white',
                    border: '2px solid #8e44ad',
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
                    e.currentTarget.style.background = '#8e44ad';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#2c3e50';
                  }}
                >
                  <span>🏢 個別施設マスタ</span>
                  <span style={{ fontSize: '20px' }}>→</span>
                </button>

                <button
                  onClick={() => {
                    closeMasterModal();
                    router.push('/user-management');
                  }}
                  style={{
                    padding: '16px 24px',
                    background: 'white',
                    border: '2px solid #9b59b6',
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
                    e.currentTarget.style.background = '#9b59b6';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#2c3e50';
                  }}
                >
                  <span>👤 ユーザー管理</span>
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
                マスタ管理と各種リスト管理を行えます
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 編集リストモーダル */}
      {isEditListModalOpen && (
        <div
          onClick={closeEditListModal}
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
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '600px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'visible',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* モーダルヘッダー */}
            <div
              style={{
                background: '#27ae60',
                color: 'white',
                padding: '16px 20px',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>編集リスト</span>
              <button
                onClick={closeEditListModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'white',
                  padding: '0',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                ×
              </button>
            </div>

            {/* タブ切り替え */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ddd' }}>
              <button
                onClick={() => setEditListMode('select')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: editListMode === 'select' ? '#27ae60' : 'white',
                  color: editListMode === 'select' ? 'white' : '#333',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
              >
                作成済みリストを選択
              </button>
              <button
                onClick={() => setEditListMode('create')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: editListMode === 'create' ? '#27ae60' : 'white',
                  color: editListMode === 'create' ? 'white' : '#333',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
              >
                新規リスト作成
              </button>
            </div>

            {/* モーダルボディ */}
            <div style={{ padding: '24px', overflow: 'visible' }}>
              {editListMode === 'select' ? (
                /* 作成済みリスト選択モード */
                <div>
                  {editLists.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '20px' }}>
                      作成済みの編集リストがありません
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {editLists.map((list) => (
                        <div
                          key={list.id}
                          style={{
                            display: 'flex',
                            alignItems: 'stretch',
                            gap: '8px',
                          }}
                        >
                          <button
                            onClick={() => handleSelectEditList(list.id)}
                            style={{
                              flex: 1,
                              padding: '16px',
                              background: 'white',
                              border: '2px solid #27ae60',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#27ae60';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.color = '#333';
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>
                              {list.name}
                            </div>
                            <div style={{ fontSize: '13px', opacity: 0.8 }}>
                              施設: {list.facilities.join(', ')}
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                              作成日: {new Date(list.createdAt).toLocaleDateString('ja-JP')}
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`「${list.name}」を削除しますか？`)) {
                                deleteEditList(list.id);
                              }
                            }}
                            style={{
                              padding: '12px 16px',
                              background: 'white',
                              border: '2px solid #e74c3c',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              color: '#e74c3c',
                              fontSize: '14px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#e74c3c';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.color = '#e74c3c';
                            }}
                            title="削除"
                          >
                            削除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* 新規作成モード */
                <div>
                  {/* 編集リスト名称 */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                      編集リスト名称
                    </label>
                    <input
                      type="text"
                      value={newEditListName}
                      onChange={(e) => setNewEditListName(e.target.value)}
                      placeholder="例: 2025年度リモデル計画"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* 施設選択 */}
                  <div style={{ position: 'relative', zIndex: 10 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                      取り込む原本データ（施設）を選択
                    </label>
                    <p style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '12px' }}>
                      複数選択可能です（選択後もプルダウンから追加できます）
                    </p>

                    {/* 選択済み施設タグ */}
                    {selectedEditListFacilities.length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: '12px',
                      }}>
                        {selectedEditListFacilities.map((facility) => (
                          <span
                            key={facility}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              background: '#e8f5e9',
                              border: '1px solid #27ae60',
                              borderRadius: '16px',
                              fontSize: '13px',
                              color: '#2c3e50',
                            }}
                          >
                            {facility}
                            <button
                              type="button"
                              onClick={() => handleFacilityToggle(facility)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0',
                                fontSize: '16px',
                                color: '#e74c3c',
                                lineHeight: 1,
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 施設プルダウン */}
                    <SearchableSelect
                      label=""
                      value=""
                      onChange={() => {}}
                      onSelect={(value) => {
                        if (value && !selectedEditListFacilities.includes(value)) {
                          setSelectedEditListFacilities(prev => [...prev, value]);
                        }
                      }}
                      options={['', ...facilityOptions.filter(f => !selectedEditListFacilities.includes(f))]}
                      placeholder="施設を検索して選択..."
                      isMobile={isMobile}
                    />

                    {selectedEditListFacilities.length > 0 && (
                      <p style={{ fontSize: '13px', color: '#27ae60', marginTop: '8px' }}>
                        {selectedEditListFacilities.length}件選択中
                      </p>
                    )}
                  </div>

                  {/* 作成ボタン */}
                  <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={closeEditListModal}
                      style={{
                        padding: '10px 20px',
                        background: '#95a5a6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#7f8c8d';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#95a5a6';
                      }}
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleCreateEditList}
                      disabled={!newEditListName.trim() || selectedEditListFacilities.length === 0}
                      style={{
                        padding: '10px 20px',
                        background: newEditListName.trim() && selectedEditListFacilities.length > 0 ? '#27ae60' : '#ddd',
                        color: newEditListName.trim() && selectedEditListFacilities.length > 0 ? 'white' : '#999',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: newEditListName.trim() && selectedEditListFacilities.length > 0 ? 'pointer' : 'not-allowed',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (newEditListName.trim() && selectedEditListFacilities.length > 0) {
                          e.currentTarget.style.background = '#229954';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (newEditListName.trim() && selectedEditListFacilities.length > 0) {
                          e.currentTarget.style.background = '#27ae60';
                        }
                      }}
                    >
                      作成
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 病院選択モーダル（個別施設マスタ用） */}
      {isHospitalSelectModalOpen && (
        <div
          onClick={() => {
            setIsHospitalSelectModalOpen(false);
            setSelectedFacilityForMaster('');
          }}
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
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'visible',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* モーダルヘッダー */}
            <div
              style={{
                background: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
                color: 'white',
                padding: '16px 20px',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '12px 12px 0 0',
              }}
            >
              <span>個別施設マスタ - 施設選択</span>
              <button
                onClick={() => {
                  setIsHospitalSelectModalOpen(false);
                  setSelectedFacilityForMaster('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'white',
                  padding: '0',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                ×
              </button>
            </div>

            {/* モーダルボディ */}
            <div style={{ padding: '24px', overflow: 'visible' }}>
              {/* 施設選択 */}
              <div style={{ marginBottom: '24px', position: 'relative', zIndex: 3 }}>
                <SearchableSelect
                  label="施設を選択"
                  value={selectedFacilityForMaster}
                  onChange={(facilityName) => setSelectedFacilityForMaster(facilityName)}
                  options={['', ...facilityOptions]}
                  placeholder="施設を選択してください"
                  isMobile={isMobile}
                />
              </div>

              {/* 決定ボタン */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setIsHospitalSelectModalOpen(false);
                    setSelectedFacilityForMaster('');
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#7f8c8d';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#95a5a6';
                  }}
                >
                  キャンセル
                </button>
                <button
                  onClick={() => {
                    if (selectedFacilityForMaster) {
                      router.push(`/hospital-facility-master?facility=${encodeURIComponent(selectedFacilityForMaster)}`);
                      setIsHospitalSelectModalOpen(false);
                      setSelectedFacilityForMaster('');
                    }
                  }}
                  disabled={!selectedFacilityForMaster}
                  style={{
                    padding: '10px 20px',
                    background: selectedFacilityForMaster
                      ? 'linear-gradient(135deg, #8e44ad, #9b59b6)'
                      : '#ddd',
                    color: selectedFacilityForMaster ? 'white' : '#999',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: selectedFacilityForMaster ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'background 0.2s',
                  }}
                >
                  決定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 病院ユーザー用マスタ管理モーダル */}
      {isHospitalMasterModalOpen && (
        <div
          onClick={() => setIsHospitalMasterModalOpen(false)}
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
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* モーダルヘッダー */}
            <div
              style={{
                background: '#34495e',
                color: 'white',
                padding: '16px 20px',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '12px 12px 0 0',
              }}
            >
              <span>マスタ管理</span>
              <button
                onClick={() => setIsHospitalMasterModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'white',
                  padding: '0',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                ×
              </button>
            </div>

            {/* モーダルボディ */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => {
                    setIsHospitalMasterModalOpen(false);
                    const hospitalName = user?.hospital || '東京中央病院';
                    router.push(`/hospital-facility-master?facility=${encodeURIComponent(hospitalName)}`);
                  }}
                  style={{
                    padding: '16px 20px',
                    background: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(142, 68, 173, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: '20px' }}>🏢</span>
                  <span>個別施設マスタ</span>
                </button>
              </div>

              {/* 閉じるボタン */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  onClick={() => setIsHospitalMasterModalOpen(false)}
                  style={{
                    padding: '10px 20px',
                    background: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#7f8c8d';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#95a5a6';
                  }}
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
