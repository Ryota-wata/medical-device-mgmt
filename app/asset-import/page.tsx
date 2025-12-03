'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';

export default function AssetImportPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; rows: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

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

  const handleNext = () => {
    router.push('/asset-matching');
  };

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

          {/* Instruction */}
          <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
            <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: '#2c3e50', marginBottom: '12px' }}>
              Excelファイルをアップロードしてください
            </h2>
            <p style={{ fontSize: isMobile ? '14px' : '15px', color: '#7f8c8d', lineHeight: 1.6 }}>
              固定資産管理台帳のExcelファイル（.xlsx, .xls）またはCSVファイル（.csv）をアップロードできます。
            </p>
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
            <button
              onClick={handleNext}
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
          </div>
        </div>
      </main>
    </div>
  );
}
