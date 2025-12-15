'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';

type FileType = 'fixed-asset' | 'me-ledger';

interface UploadedFile {
  type: FileType;
  name: string;
  size: string;
  rows: string;
  uploadedAt: string;
}

interface MatchingProgress {
  totalRows: number;
  completedRows: number;
  pendingRows: number;
}

export default function AssetImportPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; rows: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<FileType>('fixed-asset');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [matchingProgress, setMatchingProgress] = useState<MatchingProgress | null>(null);

  // シミュレーション: 既存のアップロード状況を取得
  useEffect(() => {
    // 本番環境では、ここでAPIから既存のアップロード状況を取得
    const existingFiles: UploadedFile[] = [
      // {
      //   type: 'fixed-asset',
      //   name: '固定資産管理台帳_2024.xlsx',
      //   size: '2.5 MB',
      //   rows: '150 件',
      //   uploadedAt: '2024-12-03 14:30'
      // }
    ];

    const progress: MatchingProgress | null = null;
    // progress = {
    //   totalRows: 150,
    //   completedRows: 45,
    //   pendingRows: 105
    // };

    setUploadedFiles(existingFiles);
    setMatchingProgress(progress);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const processFile = useCallback((file: File) => {
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      alert('対応していないファイル形式です。.xlsx, .xls, .csv のファイルをアップロードしてください。');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('ファイルサイズが大きすぎます。10MB以下のファイルをアップロードしてください。');
      return;
    }

    setSelectedFile(file);
    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size),
      rows: '解析中...'
    });

    setTimeout(() => {
      setFileInfo(prev => prev ? { ...prev, rows: '150 件' } : null);
    }, 500);
  }, []);

  const handleUploadAndProceed = () => {
    if (!selectedFile || !fileInfo) {
      alert('ファイルを選択してください');
      return;
    }

    // ファイルをアップロード済みリストに追加（シミュレーション）
    const newUploadedFile: UploadedFile = {
      type: selectedFileType,
      name: fileInfo.name,
      size: fileInfo.size,
      rows: fileInfo.rows,
      uploadedAt: new Date().toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    setUploadedFiles(prev => [...prev, newUploadedFile]);
    setSelectedFile(null);
    setFileInfo(null);

    // 突き合わせ画面へ遷移
    router.push('/asset-matching');
  };

  const handleResumeMatching = () => {
    router.push('/asset-matching');
  };

  const handleRemoveUploadedFile = (index: number) => {
    if (confirm('このファイルを削除しますか？突き合わせ途中のデータも削除されます。')) {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
      if (uploadedFiles.length === 1) {
        setMatchingProgress(null);
      }
    }
  };

  const getFileTypeLabel = (type: FileType): string => {
    return type === 'fixed-asset' ? '固定資産管理台帳' : 'その他台帳';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileInfo(null);
  };

  const hasFixedAssetFile = uploadedFiles.some(f => f.type === 'fixed-asset');
  const hasMELedgerFile = uploadedFiles.some(f => f.type === 'me-ledger');

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6f8', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        color: 'white',
        padding: isMobile ? '16px 20px' : isTablet ? '20px 24px' : '24px 32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <h1 style={{ fontSize: isMobile ? '18px' : isTablet ? '22px' : '26px', fontWeight: 700, margin: 0 }}>
          固定資産管理台帳取込
        </h1>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: isMobile ? '20px' : isTablet ? '32px' : '48px',
        maxWidth: '1000px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: isMobile ? '24px' : isTablet ? '32px' : '40px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>

          {/* Matching Progress - if there's ongoing matching */}
          {matchingProgress && (
            <div style={{
              background: '#e3f2fd',
              border: '1px solid #2196f3',
              borderRadius: '8px',
              padding: isMobile ? '16px' : '20px',
              marginBottom: isMobile ? '24px' : '32px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: 700, color: '#1976d2', margin: 0 }}>
                  📊 突き合わせ作業が途中です
                </h3>
                <button
                  onClick={handleResumeMatching}
                  style={{
                    padding: '8px 20px',
                    background: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  作業を再開する
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: isMobile ? '13px' : '14px', color: '#1565c0' }}>
                <div>全体: {matchingProgress.totalRows} 件</div>
                <div>完了: {matchingProgress.completedRows} 件 / 未処理: {matchingProgress.pendingRows} 件</div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#bbdefb',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginTop: '8px'
                }}>
                  <div style={{
                    width: `${(matchingProgress.completedRows / matchingProgress.totalRows) * 100}%`,
                    height: '100%',
                    backgroundColor: '#1976d2',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            </div>
          )}

          {/* Uploaded Files Status */}
          {uploadedFiles.length > 0 && (
            <div style={{
              background: '#f1f8e9',
              border: '1px solid #8bc34a',
              borderRadius: '8px',
              padding: isMobile ? '16px' : '20px',
              marginBottom: isMobile ? '24px' : '32px'
            }}>
              <h3 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: 700, color: '#558b2f', marginBottom: '12px' }}>
                ✓ アップロード済みファイル
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {uploadedFiles.map((file, index) => (
                  <div key={index} style={{
                    background: 'white',
                    border: '1px solid #c5e1a5',
                    borderRadius: '6px',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 600, color: '#2c3e50', marginBottom: '4px' }}>
                        {getFileTypeLabel(file.type)}
                      </div>
                      <div style={{ fontSize: isMobile ? '12px' : '13px', color: '#7f8c8d' }}>
                        {file.name} ({file.size} / {file.rows})
                      </div>
                      <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#95a5a6', marginTop: '4px' }}>
                        アップロード日時: {file.uploadedAt}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveUploadedFile(index)}
                      style={{
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instruction */}
          <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
            <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: '#2c3e50', marginBottom: '12px' }}>
              {uploadedFiles.length === 0 ? 'Excelファイルをアップロードしてください' : '追加のファイルをアップロード'}
            </h2>
            <p style={{ fontSize: isMobile ? '14px' : '15px', color: '#7f8c8d', lineHeight: 1.6 }}>
              固定資産管理台帳またはその他台帳のExcelファイル（.xlsx, .xls）またはCSVファイル（.csv）をアップロードできます。
            </p>
          </div>

          {/* File Type Selection */}
          <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
            <h3 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: 700, color: '#2c3e50', marginBottom: '12px' }}>
              アップロードするファイルの種類を選択
            </h3>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : '15px',
                color: '#2c3e50'
              }}>
                <input
                  type="radio"
                  name="fileType"
                  value="fixed-asset"
                  checked={selectedFileType === 'fixed-asset'}
                  onChange={(e) => setSelectedFileType(e.target.value as FileType)}
                  style={{ cursor: 'pointer' }}
                />
                <span>固定資産管理台帳</span>
                {hasFixedAssetFile && <span style={{ color: '#4caf50', fontSize: '12px' }}>✓ 済</span>}
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : '15px',
                color: '#2c3e50'
              }}>
                <input
                  type="radio"
                  name="fileType"
                  value="me-ledger"
                  checked={selectedFileType === 'me-ledger'}
                  onChange={(e) => setSelectedFileType(e.target.value as FileType)}
                  style={{ cursor: 'pointer' }}
                />
                <span>その他台帳</span>
                {hasMELedgerFile && <span style={{ color: '#4caf50', fontSize: '12px' }}>✓ 済</span>}
              </label>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              border: `2px dashed ${isDragOver ? '#27ae60' : '#d0d0d0'}`,
              borderRadius: '12px',
              padding: isMobile ? '40px 20px' : isTablet ? '60px 40px' : '80px 40px',
              textAlign: 'center',
              background: isDragOver ? '#f0f8f4' : '#fafbfc',
              transition: 'all 0.3s',
              marginBottom: isMobile ? '24px' : '32px'
            }}
          >
            <div style={{ fontSize: isMobile ? '48px' : '64px', marginBottom: '16px' }}>📁</div>
            <p style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: 600, color: '#2c3e50', marginBottom: '8px' }}>
              ここにファイルをドラッグ&ドロップ
            </p>
            <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#95a5a6', marginBottom: '20px' }}>または</p>
            <input
              type="file"
              id="fileInput"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <button
              onClick={() => document.getElementById('fileInput')?.click()}
              style={{
                padding: isMobile ? '12px 28px' : '14px 32px',
                background: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              ファイルを選択
            </button>
            <p style={{ fontSize: isMobile ? '12px' : '13px', color: '#95a5a6' }}>
              対応形式: .xlsx, .xls, .csv （最大サイズ: 10MB）
            </p>
          </div>

          {/* File Info */}
          {fileInfo && (
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: isMobile ? '16px' : '20px',
              marginBottom: isMobile ? '24px' : '32px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: 700, color: '#2c3e50', margin: 0 }}>
                  選択済みファイル
                </h3>
                <button
                  onClick={removeFile}
                  style={{
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: isMobile ? '13px' : '14px', color: '#7f8c8d', fontWeight: 600 }}>ファイル名:</span>
                  <span style={{ fontSize: isMobile ? '13px' : '14px', color: '#2c3e50' }}>{fileInfo.name}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: isMobile ? '13px' : '14px', color: '#7f8c8d', fontWeight: 600 }}>ファイルサイズ:</span>
                  <span style={{ fontSize: isMobile ? '13px' : '14px', color: '#2c3e50' }}>{fileInfo.size}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: isMobile ? '13px' : '14px', color: '#7f8c8d', fontWeight: 600 }}>データ件数:</span>
                  <span style={{ fontSize: isMobile ? '13px' : '14px', color: '#2c3e50' }}>{fileInfo.rows}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notice */}
          <div style={{
            background: '#fff9e6',
            border: '1px solid #ffd966',
            borderRadius: '8px',
            padding: isMobile ? '16px' : '20px',
            marginBottom: isMobile ? '24px' : '32px'
          }}>
            <h3 style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: 700, color: '#d68910', marginBottom: '12px' }}>
              📌 アップロード時の注意事項
            </h3>
            <ul style={{ fontSize: isMobile ? '13px' : '14px', color: '#7f8c8d', lineHeight: 1.8, paddingLeft: '20px', margin: 0 }}>
              <li>Excelファイルの1行目はヘッダー行として認識されます</li>
              <li>データは2行目から読み込まれます</li>
              <li>空白行は自動的にスキップされます</li>
              <li>必須項目: 資産番号、品名、取得年月日</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '16px',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between'
          }}>
            <button
              onClick={() => router.back()}
              style={{
                flex: isMobile ? 'none' : 1,
                padding: '14px 24px',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>←</span>
              <span>戻る</span>
            </button>
            {selectedFile && fileInfo ? (
              <button
                onClick={handleUploadAndProceed}
                style={{
                  flex: isMobile ? 'none' : 1,
                  padding: '14px 24px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>アップロードして突き合わせへ</span>
                <span>→</span>
              </button>
            ) : uploadedFiles.length > 0 ? (
              <button
                onClick={handleResumeMatching}
                style={{
                  flex: isMobile ? 'none' : 1,
                  padding: '14px 24px',
                  background: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>突き合わせ画面へ</span>
                <span>→</span>
              </button>
            ) : (
              <button
                onClick={() => router.push('/asset-matching')}
                style={{
                  flex: isMobile ? 'none' : 1,
                  padding: '14px 24px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>次へ</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
