'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Asset } from '@/lib/types';
import { useApplicationStore } from '@/lib/stores';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { ApplicationCompleteModal } from './ApplicationCompleteModal';
import { ApplicationCloseConfirmModal } from './ApplicationCloseConfirmModal';

interface AttachedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

interface DisposalApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];  // 複数選択対応
  onSuccess?: () => void;
  returnDestination?: string;
  returnHref?: string;
}

export const DisposalApplicationModal: React.FC<DisposalApplicationModalProps> = ({
  isOpen,
  onClose,
  assets,
  onSuccess,
  returnDestination = '資産一覧',
  returnHref = '/asset-search-result',
}) => {
  const router = useRouter();
  const { addApplication } = useApplicationStore();
  const { isMobile } = useResponsive();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 完了モーダル・閉じる確認モーダル
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [completedAppNo, setCompletedAppNo] = useState('');

  // コメント
  const [comment, setComment] = useState('');

  // 添付ファイル
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  // 申請者（モック：ログインユーザー）
  const applicantName = '手部 術太郎';

  // 申請日（今日の日付）
  const applicationDate = new Date().toISOString().split('T')[0];

  // ファイル選択ハンドラー
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: AttachedFile[] = Array.from(files).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);

    // inputをリセット（同じファイルを再選択可能に）
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ファイル削除ハンドラー
  const handleFileRemove = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ファイルサイズのフォーマット
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 申請送信
  const handleSubmit = () => {
    const appNo = `DISP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // 各資産に対して申請を作成
    assets.forEach((asset) => {
      addApplication({
        applicationNo: appNo,
        applicationDate: applicationDate,
        applicationType: '廃棄申請',
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
        applicationReason: comment,
      });
    });

    setCompletedAppNo(appNo);
    setShowCompleteModal(true);
  };

  // フォームリセット
  const resetForm = () => {
    setComment('');
    setAttachedFiles([]);
  };

  if (!isOpen || assets.length === 0) return null;

  // 最初の資産の情報を基本情報として表示（複数選択時）
  const primaryAsset = assets[0];

  return (
    <div
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
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>廃棄申請 モーダル</span>
          <button
            onClick={() => setShowCloseConfirm(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#333',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px',
            }}
            aria-label="閉じる"
          >
            ×
          </button>
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

          {/* 対象資産情報 */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '16px',
              borderBottom: '1px solid #ddd',
              paddingBottom: '8px'
            }}>
              対象資産情報
            </h3>

            {assets.length === 1 ? (
              /* 単数選択：グリッド表示 */
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr auto 1fr auto 1fr',
                gap: '12px 16px',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '13px', color: '#666' }}>QRコード</div>
                <div style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', background: '#f9f9f9' }}>
                  {primaryAsset.qrCode || '-'}
                </div>

                <div style={{ fontSize: '13px', color: '#666' }}>品目名</div>
                <div style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', background: '#f9f9f9' }}>
                  {primaryAsset.name || '-'}
                </div>

                <div style={{ fontSize: '13px', color: '#666' }}>メーカー名</div>
                <div style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', background: '#f9f9f9' }}>
                  {primaryAsset.maker || '-'}
                </div>

                <div style={{ fontSize: '13px', color: '#666' }}>型式</div>
                <div style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', background: '#f9f9f9' }}>
                  {primaryAsset.model || '-'}
                </div>

                <div style={{ fontSize: '13px', color: '#666' }}>数量</div>
                <div style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', background: '#f9f9f9' }}>
                  {primaryAsset.quantity ?? '-'}
                </div>

                <div style={{ fontSize: '13px', color: '#666' }}>シリアルNo.</div>
                <div style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', background: '#f9f9f9' }}>
                  {primaryAsset.serialNumber || '-'}
                </div>

                <div style={{ fontSize: '13px', color: '#666' }}>納入年月日</div>
                <div style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', background: '#f9f9f9' }}>
                  {primaryAsset.deliveryDate || '-'}
                </div>
              </div>
            ) : (
              /* 複数選択：テーブル表示 */
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                      {['QRコード', '品目名', 'メーカー名', '型式', '数量', 'シリアルNo.', '納入年月日'].map(label => (
                        <th key={label} style={{ padding: '8px 10px', textAlign: 'left', border: '1px solid #ddd', fontWeight: 'bold', color: '#555', whiteSpace: 'nowrap' }}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '7px 10px', border: '1px solid #ddd' }}>{asset.qrCode || '-'}</td>
                        <td style={{ padding: '7px 10px', border: '1px solid #ddd' }}>{asset.name || '-'}</td>
                        <td style={{ padding: '7px 10px', border: '1px solid #ddd' }}>{asset.maker || '-'}</td>
                        <td style={{ padding: '7px 10px', border: '1px solid #ddd' }}>{asset.model || '-'}</td>
                        <td style={{ padding: '7px 10px', border: '1px solid #ddd', textAlign: 'right' }}>{asset.quantity ?? '-'}</td>
                        <td style={{ padding: '7px 10px', border: '1px solid #ddd' }}>{asset.serialNumber || '-'}</td>
                        <td style={{ padding: '7px 10px', border: '1px solid #ddd' }}>{asset.deliveryDate || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* コメント */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '12px'
            }}>
              コメント（廃棄理由他）
            </h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="廃棄理由やコメントを入力してください"
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

          {/* 添付ファイル */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              border: '1px solid #4a6741',
              borderRadius: '4px',
              marginBottom: '8px',
            }}>
              <div style={{
                padding: '8px 16px',
                background: '#4a6741',
                color: 'white',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 'bold',
              }}>
                添付ファイル
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="disposal-file-input"
              />
              <label
                htmlFor="disposal-file-input"
                style={{
                  padding: '6px 12px',
                  background: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                ファイルの選択
              </label>
              <span style={{ fontSize: '13px', color: '#666' }}>
                {attachedFiles.length === 0 ? 'ファイルが選択されていません' : `${attachedFiles.length}件のファイルが選択されています`}
              </span>
            </div>

            {/* 選択されたファイルリスト */}
            {attachedFiles.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#f8f9fa',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📄</span>
                      <span>{file.name}</span>
                      <span style={{ color: '#666' }}>({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      onClick={() => handleFileRemove(index)}
                      style={{
                        padding: '4px 8px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
              見積書・修理不能証明など手持ちの書類を添付してください
            </p>
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

      {/* 完了モーダル */}
      <ApplicationCompleteModal
        isOpen={showCompleteModal}
        applicationName="廃棄申請"
        applicationNo={completedAppNo}
        guidanceText=""
        returnDestination={returnDestination}
        onGoToMain={() => {
          resetForm();
          setShowCompleteModal(false);
          onClose();
          router.push(returnHref);
        }}
        onContinue={() => {
          resetForm();
          setShowCompleteModal(false);
        }}
      />

      {/* 閉じる確認モーダル */}
      <ApplicationCloseConfirmModal
        isOpen={showCloseConfirm}
        returnDestination={returnDestination}
        onCancel={() => setShowCloseConfirm(false)}
        onConfirm={() => {
          setShowCloseConfirm(false);
          onClose();
        }}
      />
    </div>
  );
};
