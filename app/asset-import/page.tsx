'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

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
    <div className="min-h-dvh bg-[#f9fafb] flex flex-col">
      {/* Header */}
      <header className="bg-[#f5f5f5] border-b border-[#e5e7eb] px-5 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/main')}
            className="text-[#6b7280] hover:text-[#1f2937] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="戻る"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-[#1f2937] text-balance">
            台帳取込
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 py-5 md:px-8 md:py-8 lg:px-12 lg:py-12 w-full max-w-[1000px] mx-auto box-border">
        <div className="bg-white rounded-xl p-6 md:p-8 lg:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">

          {/* Matching Progress - if there's ongoing matching */}
          {matchingProgress && (
            <div className="bg-[#e3f2fd] border border-[#2196f3] rounded-lg p-4 md:p-5 mb-6 md:mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[15px] md:text-base font-bold text-[#1976d2]">
                  📊 突き合わせ作業が途中です
                </h3>
                <button
                  onClick={handleResumeMatching}
                  className="px-5 py-2 bg-[#2196f3] text-white border-none rounded-md text-[13px] md:text-sm font-semibold cursor-pointer hover:bg-[#1976d2] transition-colors min-h-[44px]"
                >
                  作業を再開する
                </button>
              </div>
              <div className="flex flex-col gap-2 text-[13px] md:text-sm text-[#1565c0]">
                <div>全体: {matchingProgress.totalRows} 件</div>
                <div>完了: {matchingProgress.completedRows} 件 / 未処理: {matchingProgress.pendingRows} 件</div>
                <div className="w-full h-2 bg-[#bbdefb] rounded mt-2 overflow-hidden">
                  <div
                    className="h-full bg-[#1976d2] transition-[width] duration-300"
                    style={{ width: `${(matchingProgress.completedRows / matchingProgress.totalRows) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Uploaded Files Status */}
          {uploadedFiles.length > 0 && (
            <div className="bg-[#f1f8e9] border border-[#8bc34a] rounded-lg p-4 md:p-5 mb-6 md:mb-8">
              <h3 className="text-[15px] md:text-base font-bold text-[#558b2f] mb-3">
                ✓ アップロード済みファイル
              </h3>
              <div className="flex flex-col gap-3">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="bg-white border border-[#c5e1a5] rounded-md p-3 flex justify-between items-center">
                    <div className="flex-1">
                      <div className="text-[13px] md:text-sm font-semibold text-[#1f2937] mb-1">
                        {getFileTypeLabel(file.type)}
                      </div>
                      <div className="text-xs md:text-[13px] text-[#6b7280]">
                        {file.name} ({file.size} / {file.rows})
                      </div>
                      <div className="text-[11px] md:text-xs text-[#9ca3af] mt-1">
                        アップロード日時: {file.uploadedAt}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveUploadedFile(index)}
                      className="bg-[#e74c3c] text-white border-none rounded px-3 py-1.5 text-xs cursor-pointer hover:bg-[#c0392b] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instruction */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-lg md:text-xl font-bold text-[#1f2937] mb-3 text-balance">
              {uploadedFiles.length === 0 ? 'Excelファイルをアップロードしてください' : '追加のファイルをアップロード'}
            </h2>
            <p className="text-sm md:text-[15px] text-[#6b7280] leading-relaxed text-pretty">
              固定資産管理台帳またはその他台帳のExcelファイル（.xlsx, .xls）またはCSVファイル（.csv）をアップロードできます。
            </p>
          </div>

          {/* File Type Selection */}
          <div className="mb-6 md:mb-8">
            <h3 className="text-[15px] md:text-base font-bold text-[#1f2937] mb-3">
              アップロードするファイルの種類を選択
            </h3>
            <div className="flex gap-6 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer text-sm md:text-[15px] text-[#1f2937]">
                <input
                  type="radio"
                  name="fileType"
                  value="fixed-asset"
                  checked={selectedFileType === 'fixed-asset'}
                  onChange={(e) => setSelectedFileType(e.target.value as FileType)}
                  className="cursor-pointer accent-[#27ae60]"
                />
                <span>固定資産管理台帳</span>
                {hasFixedAssetFile && <span className="text-[#4caf50] text-xs">✓ 済</span>}
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm md:text-[15px] text-[#1f2937]">
                <input
                  type="radio"
                  name="fileType"
                  value="me-ledger"
                  checked={selectedFileType === 'me-ledger'}
                  onChange={(e) => setSelectedFileType(e.target.value as FileType)}
                  className="cursor-pointer accent-[#27ae60]"
                />
                <span>その他台帳</span>
                {hasMELedgerFile && <span className="text-[#4caf50] text-xs">✓ 済</span>}
              </label>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl text-center transition-all duration-300 mb-6 md:mb-8 px-5 py-10 md:px-10 md:py-16 lg:px-10 lg:py-20 ${
              isDragOver
                ? 'border-[#27ae60] bg-[#f0f8f4]'
                : 'border-[#e5e7eb] bg-[#f9fafb]'
            }`}
          >
            {/* Upload SVG icon */}
            <div className="mb-4 flex justify-center">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-[#6b7280] md:w-16 md:h-16">
                <path d="M16 32L24 24L32 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M24 24V42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M40.28 36.28A10 10 0 0 0 36 18H33.48A16 16 0 1 0 8 30.78" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 32L24 24L32 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-[15px] md:text-[17px] font-semibold text-[#1f2937] mb-2">
              ここにファイルをドラッグ&ドロップ
            </p>
            <p className="text-[13px] md:text-sm text-[#9ca3af] mb-5">または</p>
            <input
              type="file"
              id="fileInput"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => document.getElementById('fileInput')?.click()}
              className="px-7 py-3 md:px-8 md:py-3.5 bg-[#27ae60] text-white border-none rounded-lg text-sm md:text-[15px] font-semibold cursor-pointer hover:bg-[#229954] transition-colors mb-4 min-h-[44px]"
            >
              ファイルを選択
            </button>
            <p className="text-xs md:text-[13px] text-[#9ca3af]">
              対応形式: .xlsx, .xls, .csv （最大サイズ: 10MB）
            </p>
          </div>

          {/* File Info */}
          {fileInfo && (
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 md:p-5 mb-6 md:mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[15px] md:text-base font-bold text-[#1f2937]">
                  選択済みファイル
                </h3>
                <button
                  onClick={removeFile}
                  className="bg-[#e74c3c] text-white border-none rounded-full w-7 h-7 text-lg cursor-pointer flex items-center justify-center hover:bg-[#c0392b] transition-colors min-w-[44px] min-h-[44px]"
                >
                  ×
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="text-[13px] md:text-sm text-[#6b7280] font-semibold">ファイル名:</span>
                  <span className="text-[13px] md:text-sm text-[#1f2937]">{fileInfo.name}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[13px] md:text-sm text-[#6b7280] font-semibold">ファイルサイズ:</span>
                  <span className="text-[13px] md:text-sm text-[#1f2937]">{fileInfo.size}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[13px] md:text-sm text-[#6b7280] font-semibold">データ件数:</span>
                  <span className="text-[13px] md:text-sm text-[#1f2937]">{fileInfo.rows}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notice */}
          <div className="bg-[#fff9e6] border border-[#ffd966] rounded-lg p-4 md:p-5 mb-6 md:mb-8">
            <h3 className="text-sm md:text-[15px] font-bold text-[#d68910] mb-3">
              📌 アップロード時の注意事項
            </h3>
            <ul className="text-[13px] md:text-sm text-[#6b7280] leading-[1.8] pl-5 m-0">
              <li>Excelファイルの1行目はヘッダー行として認識されます</li>
              <li>データは2行目から読み込まれます</li>
              <li>空白行は自動的にスキップされます</li>
              <li>必須項目: 資産番号、品名、取得年月日</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 flex-col md:flex-row justify-between">
            <button
              onClick={() => router.push('/main')}
              className="md:flex-1 px-6 py-3.5 bg-[#e5e7eb] text-[#1f2937] border-none rounded-lg text-sm md:text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-[#d1d5db] transition-colors min-h-[44px]"
            >
              <span>←</span>
              <span>メイン画面に戻る</span>
            </button>
            {selectedFile && fileInfo ? (
              <button
                onClick={handleUploadAndProceed}
                className="md:flex-1 px-6 py-3.5 bg-white text-[#27ae60] border-2 border-[#27ae60] rounded-lg text-sm md:text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-[#f0f8f4] transition-colors min-h-[44px]"
              >
                <span>アップロードして突き合わせへ</span>
                <span>→</span>
              </button>
            ) : uploadedFiles.length > 0 ? (
              <button
                onClick={handleResumeMatching}
                className="md:flex-1 px-6 py-3.5 bg-[#2196f3] text-white border-none rounded-lg text-sm md:text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-[#1976d2] transition-colors min-h-[44px]"
              >
                <span>突き合わせ画面へ</span>
                <span>→</span>
              </button>
            ) : (
              <button
                onClick={() => router.push('/asset-matching')}
                className="md:flex-1 px-6 py-3.5 bg-white text-[#27ae60] border-2 border-[#27ae60] rounded-lg text-sm md:text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-[#f0f8f4] transition-colors min-h-[44px]"
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
