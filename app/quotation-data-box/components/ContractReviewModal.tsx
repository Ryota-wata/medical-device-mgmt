'use client';

import React, { useState, useRef } from 'react';

// 契約グループ内の資産詳細
interface ContractAsset {
  qrLabel: string;
  managementDepartment: string;
  installationDepartment: string;
  item: string;
  maker: string;
  model: string;
  maintenanceType: string;
  acceptanceDate: string;
  contractStartDate: string;
  contractEndDate: string;
  inspectionCountPerYear: number;
  partsExemption: string;
  onCall: boolean;
  hasRemote: boolean;
  comment: string;
}

// 保守契約データ型
interface MaintenanceContract {
  id: string;
  contractGroupName: string;
  managementDepartment: string;
  installationDepartment: string;
  maintenanceType: string;
  acceptanceDate: string;
  contractStartDate: string;
  contractEndDate: string;
  contractorName: string;
  contractorPerson: string;
  contractorEmail: string;
  contractorPhone: string;
  contractAmount: number;
  status: string;
  warrantyEndDate: string;
  deadlineDays: number | null;
  comment: string;
  category: string;
  largeClass: string;
  mediumClass: string;
  item: string;
  maker: string;
  hasRemoteMaintenance: boolean;
  assets: ContractAsset[];
}

// 見直し結果データ
export interface ContractReviewResult {
  removedAssetQrLabels: string[];
  newContractAmount: number;
  reviewReason: string;
  uploadedFiles: File[];
}

interface ContractReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: MaintenanceContract | null;
  onSubmit: (contractId: string, result: ContractReviewResult) => void;
}

export function ContractReviewModal({
  isOpen,
  onClose,
  contract,
  onSubmit,
}: ContractReviewModalProps) {
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [newAmount, setNewAmount] = useState('');
  const [reviewReason, setReviewReason] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // モーダルが開いたときに初期化
  React.useEffect(() => {
    if (isOpen && contract) {
      setSelectedAssets(new Set());
      setNewAmount(contract.contractAmount.toString());
      setReviewReason('');
      setUploadedFiles([]);
    }
  }, [isOpen, contract]);

  if (!isOpen || !contract) return null;

  const handleAssetToggle = (qrLabel: string) => {
    setSelectedAssets((prev) => {
      const next = new Set(prev);
      if (next.has(qrLabel)) {
        next.delete(qrLabel);
      } else {
        next.add(qrLabel);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedAssets.size === contract.assets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(contract.assets.map((a) => a.qrLabel)));
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // バリデーション
    if (selectedAssets.size === 0) {
      alert('除外する資産を1件以上選択してください');
      return;
    }

    const amount = parseInt(newAmount, 10);
    if (isNaN(amount) || amount < 0) {
      alert('見直し後契約金額を正しく入力してください');
      return;
    }

    if (amount > contract.contractAmount) {
      alert('見直し後の契約金額は現在の金額以下にしてください');
      return;
    }

    if (!reviewReason.trim()) {
      alert('見直し理由を入力してください');
      return;
    }

    // ドキュメント未アップロードの警告
    if (uploadedFiles.length === 0) {
      const proceed = confirm(
        '覚書等のドキュメントがアップロードされていません。\nこのまま登録しますか？'
      );
      if (!proceed) return;
    }

    // 確認ダイアログ
    const confirmMessage = `以下の内容で契約内容を見直します。よろしいですか？

除外資産: ${selectedAssets.size}件
見直し後金額: ¥${amount.toLocaleString()}（税別）
見直し理由: ${reviewReason}
添付ファイル: ${uploadedFiles.length}件`;

    if (!confirm(confirmMessage)) return;

    onSubmit(contract.id, {
      removedAssetQrLabels: Array.from(selectedAssets),
      newContractAmount: amount,
      reviewReason: reviewReason.trim(),
      uploadedFiles,
    });

    onClose();
  };

  const styles: Record<string, React.CSSProperties> = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      width: '95%',
      maxWidth: '800px',
      maxHeight: '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      padding: '16px 24px',
      backgroundColor: '#e74c3c',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '24px',
      cursor: 'pointer',
      padding: '0',
      width: '30px',
      height: '30px',
    },
    body: {
      padding: '24px',
      overflowY: 'auto',
      flex: 1,
    },
    section: {
      marginBottom: '24px',
    },
    sectionTitle: {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '12px',
      paddingBottom: '8px',
      borderBottom: '2px solid #3498db',
    },
    infoBox: {
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      padding: '16px',
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
    },
    infoItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    infoLabel: {
      fontSize: '12px',
      color: '#7f8c8d',
    },
    infoValue: {
      fontSize: '14px',
      color: '#2c3e50',
      fontWeight: 500,
    },
    tableContainer: {
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      overflow: 'hidden',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '13px',
    },
    th: {
      backgroundColor: '#f8f9fa',
      padding: '10px 8px',
      textAlign: 'left',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      borderBottom: '1px solid #dee2e6',
    },
    td: {
      padding: '10px 8px',
      borderBottom: '1px solid #f0f0f0',
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer',
    },
    selectedCount: {
      marginTop: '8px',
      fontSize: '13px',
      color: '#e74c3c',
      fontWeight: 500,
    },
    formGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: 600,
      color: '#2c3e50',
      marginBottom: '8px',
    },
    required: {
      color: '#e74c3c',
      marginLeft: '4px',
    },
    input: {
      width: '200px',
      padding: '10px 12px',
      border: '1px solid #d0d0d0',
      borderRadius: '6px',
      fontSize: '14px',
    },
    textarea: {
      width: '100%',
      minHeight: '80px',
      padding: '10px 12px',
      border: '1px solid #d0d0d0',
      borderRadius: '6px',
      fontSize: '14px',
      resize: 'vertical',
      boxSizing: 'border-box',
    },
    dropZone: {
      border: '2px dashed #d0d0d0',
      borderRadius: '8px',
      padding: '32px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'border-color 0.2s, background-color 0.2s',
    },
    dropZoneActive: {
      borderColor: '#3498db',
      backgroundColor: '#e3f2fd',
    },
    dropZoneIcon: {
      fontSize: '32px',
      marginBottom: '8px',
    },
    dropZoneText: {
      fontSize: '14px',
      color: '#5a6c7d',
      marginBottom: '4px',
    },
    dropZoneHint: {
      fontSize: '12px',
      color: '#95a5a6',
    },
    fileList: {
      marginTop: '12px',
    },
    fileItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      backgroundColor: '#e3f2fd',
      borderRadius: '4px',
      marginBottom: '8px',
    },
    fileName: {
      fontSize: '13px',
      color: '#1976d2',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    removeFileButton: {
      background: 'none',
      border: 'none',
      color: '#e74c3c',
      fontSize: '18px',
      cursor: 'pointer',
      padding: '0 4px',
    },
    footer: {
      padding: '16px 24px',
      borderTop: '1px solid #dee2e6',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      backgroundColor: '#f8f9fa',
    },
    cancelButton: {
      padding: '10px 20px',
      backgroundColor: '#95a5a6',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
    },
    submitButton: {
      padding: '10px 20px',
      backgroundColor: '#27ae60',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div style={styles.header}>
          <span style={styles.headerTitle}>契約内容見直し</span>
          <button
            style={styles.closeButton}
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {/* ボディ */}
        <div style={styles.body}>
          {/* 契約グループ情報 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>契約グループ情報</div>
            <div style={styles.infoBox}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>契約グループ名</span>
                <span style={styles.infoValue}>
                  {contract.contractGroupName || contract.item}
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>契約業者</span>
                <span style={styles.infoValue}>
                  {contract.contractorName || '-'}
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>契約期間</span>
                <span style={styles.infoValue}>
                  {contract.contractStartDate && contract.contractEndDate
                    ? `${contract.contractStartDate} ～ ${contract.contractEndDate}`
                    : '-'}
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>現在の契約金額</span>
                <span style={styles.infoValue}>
                  ¥{contract.contractAmount.toLocaleString()}（税別）
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>登録資産数</span>
                <span style={styles.infoValue}>{contract.assets.length}台</span>
              </div>
            </div>
          </div>

          {/* 廃棄対象資産の選択 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>廃棄対象資産の選択</div>
            <p style={{ fontSize: '13px', color: '#5a6c7d', marginBottom: '12px' }}>
              契約から除外する資産にチェックを入れてください
            </p>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        style={styles.checkbox}
                        checked={selectedAssets.size === contract.assets.length && contract.assets.length > 0}
                        onChange={handleSelectAll}
                        aria-label="全選択"
                      />
                    </th>
                    <th style={styles.th}>QRラベル</th>
                    <th style={styles.th}>品目</th>
                    <th style={styles.th}>型式</th>
                    <th style={styles.th}>設置場所</th>
                  </tr>
                </thead>
                <tbody>
                  {contract.assets.map((asset, index) => (
                    <tr
                      key={asset.qrLabel}
                      style={{
                        backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleAssetToggle(asset.qrLabel)}
                    >
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          style={styles.checkbox}
                          checked={selectedAssets.has(asset.qrLabel)}
                          onChange={() => handleAssetToggle(asset.qrLabel)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td style={styles.td}>{asset.qrLabel}</td>
                      <td style={styles.td}>{asset.item}</td>
                      <td style={styles.td}>{asset.model}</td>
                      <td style={styles.td}>{asset.installationDepartment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={styles.selectedCount}>
              選択中: {selectedAssets.size}件
            </div>
          </div>

          {/* 見直し後の契約情報 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>見直し後の契約情報</div>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                見直し後契約金額<span style={styles.required}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#2c3e50' }}>¥</span>
                <input
                  type="number"
                  style={styles.input}
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  min="0"
                  max={contract.contractAmount}
                />
                <span style={{ fontSize: '14px', color: '#7f8c8d' }}>（税別）</span>
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                見直し理由<span style={styles.required}>*</span>
              </label>
              <textarea
                style={styles.textarea}
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                placeholder="例: 機器廃棄（1台）に伴う契約内容変更"
              />
            </div>
          </div>

          {/* 関連ドキュメント */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>関連ドキュメント</div>
            <p style={{ fontSize: '13px', color: '#5a6c7d', marginBottom: '12px' }}>
              契約変更覚書等をアップロードしてください
            </p>
            <div
              style={{
                ...styles.dropZone,
                ...(isDragging ? styles.dropZoneActive : {}),
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={styles.dropZoneIcon}>📄</div>
              <div style={styles.dropZoneText}>
                ファイルをドラッグ＆ドロップ
              </div>
              <div style={styles.dropZoneText}>
                または クリックして選択
              </div>
              <div style={styles.dropZoneHint}>
                対応形式: PDF, Word, Excel
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            {uploadedFiles.length > 0 && (
              <div style={styles.fileList}>
                <div style={{ fontSize: '13px', color: '#5a6c7d', marginBottom: '8px' }}>
                  アップロード済み:
                </div>
                {uploadedFiles.map((file, index) => (
                  <div key={index} style={styles.fileItem}>
                    <span style={styles.fileName}>
                      📎 {file.name}
                    </span>
                    <button
                      style={styles.removeFileButton}
                      onClick={() => handleRemoveFile(index)}
                      aria-label="ファイルを削除"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div style={styles.footer}>
          <button style={styles.cancelButton} onClick={onClose}>
            キャンセル
          </button>
          <button style={styles.submitButton} onClick={handleSubmit}>
            確認して登録
          </button>
        </div>
      </div>
    </div>
  );
}
