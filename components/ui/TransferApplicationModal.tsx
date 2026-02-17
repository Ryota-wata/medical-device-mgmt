'use client';

import React, { useState, useMemo } from 'react';
import { Asset } from '@/lib/types';
import { useMasterStore, useApplicationStore } from '@/lib/stores';
import { SearchableSelect } from './SearchableSelect';
import { useResponsive } from '@/lib/hooks/useResponsive';

interface TransferApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];  // 複数選択対応
  onSuccess?: () => void;
}

export const TransferApplicationModal: React.FC<TransferApplicationModalProps> = ({
  isOpen,
  onClose,
  assets,
  onSuccess,
}) => {
  const { facilities } = useMasterStore();
  const { addApplication } = useApplicationStore();
  const { isMobile } = useResponsive();

  // 移動先の状態
  const [destDepartment, setDestDepartment] = useState('');
  const [destSection, setDestSection] = useState('');
  const [destRoomName, setDestRoomName] = useState('');
  const [comment, setComment] = useState('');

  // 申請者（モック：ログインユーザー）
  const applicantName = '手部 術太郎';

  // 申請日（今日の日付）
  const applicationDate = new Date().toISOString().split('T')[0];

  // 部門オプション
  const departmentOptions = useMemo(() => {
    const uniqueDepartments = Array.from(new Set(facilities.map(f => f.department)));
    return uniqueDepartments.filter(Boolean) as string[];
  }, [facilities]);

  // 部署オプション（選択された部門に基づく）
  const sectionOptions = useMemo(() => {
    if (destDepartment) {
      const filtered = facilities.filter(f => f.department === destDepartment);
      const uniqueSections = Array.from(new Set(filtered.map(f => f.section)));
      return uniqueSections.filter(Boolean) as string[];
    }
    const uniqueSections = Array.from(new Set(facilities.map(f => f.section)));
    return uniqueSections.filter(Boolean) as string[];
  }, [facilities, destDepartment]);

  // 部門変更時のハンドラー
  const handleDepartmentChange = (value: string) => {
    setDestDepartment(value);
    // 部署が新しい部門に属さない場合はクリア
    if (destSection) {
      const validSection = facilities.find(f =>
        f.department === value && f.section === destSection
      );
      if (!validSection) {
        setDestSection('');
      }
    }
  };

  // 部署変更時のハンドラー（親自動選択）
  const handleSectionChange = (value: string) => {
    setDestSection(value);
    // 部門が未選択の場合、自動選択
    if (value && !destDepartment) {
      const facility = facilities.find(f => f.section === value);
      if (facility && facility.department) {
        setDestDepartment(facility.department);
      }
    }
  };

  // 申請送信
  const handleSubmit = () => {
    if (!destDepartment || !destSection || !destRoomName) {
      alert('移動先の設置部門、設置部署、設置室名を入力してください');
      return;
    }

    // 各資産に対して申請を作成
    assets.forEach((asset) => {
      addApplication({
        applicationNo: `TRAN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        applicationDate: applicationDate,
        applicationType: '移動申請',
        asset: {
          name: asset.name,
          model: asset.model,
        },
        vendor: asset.maker,
        quantity: String(asset.quantity || 1),
        unit: '台',
        status: '承認待ち',
        approvalProgress: {
          current: 0,
          total: 3,
        },
        facility: {
          building: asset.building,
          floor: asset.floor,
          department: asset.department,
          section: asset.section,
        },
        roomName: asset.roomName || '',
        freeInput: comment,
        executionYear: new Date().getFullYear().toString(),
        // 移動先情報
        transferDestination: {
          department: destDepartment,
          section: destSection,
          roomName: destRoomName,
        },
      });
    });

    alert(`移動申請を送信しました\n申請件数: ${assets.length}件`);

    // フォームリセット
    setDestDepartment('');
    setDestSection('');
    setDestRoomName('');
    setComment('');

    onClose();
    onSuccess?.();
  };

  // モーダルを閉じる際のリセット
  const handleClose = () => {
    setDestDepartment('');
    setDestSection('');
    setDestRoomName('');
    setComment('');
    onClose();
  };

  if (!isOpen || assets.length === 0) return null;

  // 最初の資産の情報を基本情報として表示（複数選択時）
  const primaryAsset = assets[0];

  return (
    <div
      onClick={handleClose}
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
          borderRadius: '12px',
          width: '90%',
          maxWidth: '900px',
          maxHeight: '90vh',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* モーダルヘッダー */}
        <div
          style={{
            background: '#e0e0e0',
            padding: '16px 24px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#333',
            textAlign: 'center',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
          }}
        >
          移動申請 モーダル
        </div>

        {/* モーダルボディ */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          {/* 申請基本情報 */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '16px',
              borderBottom: '1px solid #ddd',
              paddingBottom: '8px'
            }}>
              申請基本情報
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr auto 1fr auto 1fr',
              gap: '12px 16px',
              alignItems: 'center'
            }}>
              {/* 1行目 */}
              <div style={{ fontSize: '13px', color: '#666' }}>管理部署</div>
              <div style={{
                padding: '8px 12px',
                border: '1px solid #4a6741',
                borderRadius: '4px',
                fontSize: '13px',
                background: '#f9f9f9'
              }}>
                {primaryAsset.department || '-'}
              </div>

              <div style={{ fontSize: '13px', color: '#666' }}>申請者</div>
              <div style={{
                padding: '8px 12px',
                border: '1px solid #4a6741',
                borderRadius: '4px',
                fontSize: '13px',
                background: '#f9f9f9'
              }}>
                {applicantName}
              </div>

              <div style={{ fontSize: '13px', color: '#666' }}>申請日</div>
              <div style={{
                padding: '8px 12px',
                border: '1px solid #4a6741',
                borderRadius: '4px',
                fontSize: '13px',
                background: '#f9f9f9'
              }}>
                {applicationDate}
              </div>

              {/* 2行目 */}
              <div style={{ fontSize: '13px', color: '#666' }}>設置部門</div>
              <div style={{
                padding: '8px 12px',
                border: '1px solid #4a6741',
                borderRadius: '4px',
                fontSize: '13px',
                background: '#f9f9f9'
              }}>
                {primaryAsset.department || '-'}
              </div>

              <div style={{ fontSize: '13px', color: '#666' }}>設置部署</div>
              <div style={{
                padding: '8px 12px',
                border: '1px solid #4a6741',
                borderRadius: '4px',
                fontSize: '13px',
                background: '#f9f9f9'
              }}>
                {primaryAsset.section || '-'}
              </div>

              <div style={{ fontSize: '13px', color: '#666' }}>設置室名</div>
              <div style={{
                padding: '8px 12px',
                border: '1px solid #4a6741',
                borderRadius: '4px',
                fontSize: '13px',
                background: '#f9f9f9'
              }}>
                {primaryAsset.roomName || '-'}
              </div>
            </div>

            {/* 複数選択時の表示 */}
            {assets.length > 1 && (
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: '#fff3e0',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#e65100'
              }}>
                ※ {assets.length}件の資産が選択されています
              </div>
            )}
          </div>

          {/* 移動先 */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '16px',
              borderBottom: '1px solid #ddd',
              paddingBottom: '8px'
            }}>
              移動先
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr auto 1fr auto 1fr',
              gap: '12px 16px',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '13px', color: '#666' }}>設置部門</div>
              <div style={{ position: 'relative', zIndex: 12 }}>
                <SearchableSelect
                  value={destDepartment}
                  onChange={handleDepartmentChange}
                  options={departmentOptions}
                  placeholder="選択してください"
                  isMobile={isMobile}
                />
              </div>

              <div style={{ fontSize: '13px', color: '#666' }}>設置部署</div>
              <div style={{ position: 'relative', zIndex: 11 }}>
                <SearchableSelect
                  value={destSection}
                  onChange={handleSectionChange}
                  options={sectionOptions}
                  placeholder="選択してください"
                  isMobile={isMobile}
                />
              </div>

              <div style={{ fontSize: '13px', color: '#666' }}>設置室名</div>
              <input
                type="text"
                value={destRoomName}
                onChange={(e) => setDestRoomName(e.target.value)}
                placeholder="入力してください"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #4a6741',
                  borderRadius: '4px',
                  fontSize: '13px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* コメント */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '12px'
            }}>
              コメント（移動理由他）
            </h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="移動理由やコメントを入力してください"
              rows={5}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #4a6741',
                borderRadius: '4px',
                fontSize: '13px',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          {/* 申請ボタン */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={handleSubmit}
              style={{
                padding: '12px 48px',
                background: '#4a6741',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3d5636';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#4a6741';
              }}
            >
              上記内容で申請する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
