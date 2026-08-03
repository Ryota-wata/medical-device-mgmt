'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  Columns3,
  Pin,
  Upload,
  X,
} from 'lucide-react';
import { Header } from '@/components/layouts/Header';

interface UploadedFile {
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

// 台帳取込テンプレートの取込対象カラム（34列）
const IMPORT_COLUMNS: string[] = [
  '棟',
  '階',
  '部門名',
  '部署名',
  '室名',
  'QRコード',
  '固定資産番号',
  'ME管理機器番号',
  'シリアル番号',
  '病院固有番号 予備①',
  '病院固有番号 予備②',
  '品目名（元）',
  'メーカー名(元)',
  '型式(元)',
  '数量',
  '単位',
  '契約決済No,',
  '納入年月日',
  '検収年月日',
  '納入業者（発注先）',
  'リース会社',
  'リース開始日',
  'リース終了日',
  '会計区分（会計準則）',
  '勘定科目（会計準則）',
  '耐用年数（元）',
  '定価単価(税別)',
  '定価金額(税別)',
  '見積単価(税別)',
  '見積金額(税別)',
  '税区分',
  '消費税率',
  '見積金額(税込)',
  '台帳備考',
];

export default function AssetImportPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; rows: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [matchingProgress, setMatchingProgress] = useState<MatchingProgress | null>(null);

  // シミュレーション: 既存のアップロード状況を取得
  useEffect(() => {
    // 本番環境では、ここでAPIから既存のアップロード状況を取得
    const existingFiles: UploadedFile[] = [];

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

  return (
    <div className="min-h-dvh bg-surface-screen flex flex-col">
      <Header
        title="台帳取込"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        backButtonVariant="secondary"
        hideMenu={true}
        hideHomeButton={true}
      />

      {/* Main Content */}
      <main className="flex-1 px-5 py-5 md:px-8 md:py-8 lg:px-12 lg:py-12 w-full max-w-[1000px] mx-auto box-border">
        <div data-element-id="ai-main-card" className="bg-surface-card rounded-xl p-6 md:p-8 lg:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">

          {/* Matching Progress - if there's ongoing matching */}
          {matchingProgress && (
            <div data-element-id="ai-progress-area" className="bg-surface-select border border-cta-primary rounded-lg p-4 md:p-5 mb-6 md:mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 data-element-id="ai-progress-title" className="inline-flex items-center gap-2 text-[15px] md:text-base font-bold text-cta-primary-dark">
                  <BarChart3 className="w-4 h-4" aria-hidden />
                  突き合わせ作業が途中です
                </h3>
                <button
                  data-element-id="ai-resume-btn"
                  onClick={handleResumeMatching}
                  className="px-5 py-2 bg-cta-primary text-white border-none rounded-md text-[13px] md:text-sm font-semibold cursor-pointer hover:bg-cta-primary-dark transition-colors min-h-[44px]"
                >
                  作業を再開する
                </button>
              </div>
              <div className="flex flex-col gap-2 text-[13px] md:text-sm text-cta-primary-dark">
                <div data-element-id="ai-progress-total">全体: {matchingProgress.totalRows} 件</div>
                <div data-element-id="ai-progress-detail">完了: {matchingProgress.completedRows} 件 / 未処理: {matchingProgress.pendingRows} 件</div>
                <div data-element-id="ai-progress-bar" className="w-full h-2 bg-stroke-card rounded mt-2 overflow-hidden">
                  <div
                    className="h-full bg-cta-primary-dark transition-[width] duration-300"
                    style={{ width: `${(matchingProgress.completedRows / matchingProgress.totalRows) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Uploaded Files Status */}
          {uploadedFiles.length > 0 && (
            <div data-element-id="ai-uploaded-area" className="bg-surface-select border border-cta-primary rounded-lg p-4 md:p-5 mb-6 md:mb-8">
              <h3 data-element-id="ai-uploaded-title" className="inline-flex items-center gap-2 text-[15px] md:text-base font-bold text-cta-primary-dark mb-3">
                <Check className="w-4 h-4" aria-hidden />
                アップロード済みファイル
              </h3>
              <div className="flex flex-col gap-3">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    {...(index === 0 ? { 'data-element-id': 'ai-uploaded-card' } : {})}
                    className="bg-surface-card border border-stroke-input rounded-md p-3 flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <div
                        {...(index === 0 ? { 'data-element-id': 'ai-uploaded-fileinfo' } : {})}
                        className="text-[13px] md:text-sm text-content-primary font-semibold"
                      >
                        {file.name} ({file.size} / {file.rows})
                      </div>
                      <div
                        {...(index === 0 ? { 'data-element-id': 'ai-uploaded-datetime' } : {})}
                        className="text-[11px] md:text-xs text-content-sub mt-1"
                      >
                        アップロード日時: {file.uploadedAt}
                      </div>
                    </div>
                    <button
                      {...(index === 0 ? { 'data-element-id': 'ai-uploaded-delete-btn' } : {})}
                      onClick={() => handleRemoveUploadedFile(index)}
                      className="bg-content-alert text-white border-none rounded px-3 py-1.5 text-xs cursor-pointer hover:opacity-90 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
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
            <h2 data-element-id="ai-upload-heading" className="text-lg md:text-xl font-bold text-content-primary mb-3 text-balance">
              {uploadedFiles.length === 0 ? 'Excelファイルをアップロードしてください' : '追加のファイルをアップロード'}
            </h2>
            <p data-element-id="ai-upload-desc" className="text-sm md:text-[15px] text-content-sub leading-relaxed text-pretty">
              台帳のExcelファイル（.xlsx, .xls）またはCSVファイル（.csv）をアップロードできます。台帳の種類は区別しません。複数の台帳を取り込む場合は、前の台帳の突き合わせを完了させてから、1ファイルずつ取り込んでください。
            </p>
          </div>

          {/* Dropzone */}
          <div
            data-element-id="ai-dropzone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl text-center transition-all duration-300 mb-6 md:mb-8 px-5 py-10 md:px-10 md:py-16 lg:px-10 lg:py-20 ${
              isDragOver
                ? 'border-cta-primary bg-surface-select'
                : 'border-stroke-input bg-surface-screen'
            }`}
          >
            <div data-element-id="ai-upload-icon" className="mb-4 flex justify-center">
              <Upload className="w-12 h-12 md:w-16 md:h-16 text-content-sub" strokeWidth={2.5} aria-hidden />
            </div>
            <p data-element-id="ai-dnd-text" className="text-[15px] md:text-[17px] font-semibold text-content-primary mb-2">
              ここにファイルをドラッグ&ドロップ
            </p>
            <p data-element-id="ai-or-text" className="text-[13px] md:text-sm text-content-sub mb-5">または</p>
            <input
              data-element-id="ai-file-input"
              type="file"
              id="fileInput"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              data-element-id="ai-select-file-btn"
              onClick={() => document.getElementById('fileInput')?.click()}
              className="px-7 py-3 md:px-8 md:py-3.5 bg-cta-primary text-white border-none rounded-lg text-sm md:text-[15px] font-semibold cursor-pointer hover:bg-cta-primary-dark transition-colors mb-4 min-h-[44px]"
            >
              ファイルを選択
            </button>
            <p data-element-id="ai-format-text" className="text-xs md:text-[13px] text-content-sub">
              対応形式: .xlsx, .xls, .csv （最大サイズ: 10MB）
            </p>
          </div>

          {/* File Info */}
          {fileInfo && (
            <div data-element-id="ai-selected-area" className="bg-surface-screen border border-stroke-input rounded-lg p-4 md:p-5 mb-6 md:mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 data-element-id="ai-selected-title" className="text-[15px] md:text-base font-bold text-content-primary">
                  選択済みファイル
                </h3>
                <button
                  data-element-id="ai-selected-clear-btn"
                  onClick={removeFile}
                  aria-label="ファイル選択を解除"
                  className="bg-content-alert text-white border-none rounded-full cursor-pointer flex items-center justify-center hover:opacity-90 transition-colors min-w-[44px] min-h-[44px]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div data-element-id="ai-selected-name" className="flex flex-wrap gap-2">
                  <span className="text-[13px] md:text-sm text-content-sub font-semibold">ファイル名:</span>
                  <span className="text-[13px] md:text-sm text-content-primary">{fileInfo.name}</span>
                </div>
                <div data-element-id="ai-selected-size" className="flex flex-wrap gap-2">
                  <span className="text-[13px] md:text-sm text-content-sub font-semibold">ファイルサイズ:</span>
                  <span className="text-[13px] md:text-sm text-content-primary">{fileInfo.size}</span>
                </div>
                <div data-element-id="ai-selected-rows" className="flex flex-wrap gap-2">
                  <span className="text-[13px] md:text-sm text-content-sub font-semibold">データ件数:</span>
                  <span className="text-[13px] md:text-sm text-content-primary">{fileInfo.rows}</span>
                </div>
              </div>
            </div>
          )}

          {/* 取込対象カラム（台帳取込テンプレート準拠） */}
          <div data-element-id="ai-columns-area" className="bg-surface-screen border border-stroke-input rounded-lg p-4 md:p-5 mb-6 md:mb-8">
            <h3 data-element-id="ai-columns-title" className="inline-flex items-center gap-2 text-[15px] md:text-base font-bold text-content-primary mb-3">
              <Columns3 className="w-4 h-4" aria-hidden />
              取込対象カラム（{IMPORT_COLUMNS.length}列）
            </h3>
            <p data-element-id="ai-columns-desc" className="text-[13px] md:text-sm text-content-sub leading-relaxed mb-4">
              台帳ファイルの1行目のヘッダーを、下記のカラム名に合わせてください。ヘッダーの改行・前後の空白は無視して照合します。値が空欄のカラムがあっても取り込めます。
            </p>
            <ol data-element-id="ai-columns-list" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1.5 list-none m-0 p-0">
              {IMPORT_COLUMNS.map((column, index) => (
                <li key={column} className="text-xs md:text-[13px] text-content-primary flex gap-1.5">
                  <span className="text-content-sub tabular-nums">{index + 1}.</span>
                  <span>{column}</span>
                </li>
              ))}
            </ol>
            <div data-element-id="ai-columns-note" className="mt-4 pt-4 border-t border-stroke-input flex flex-col gap-2 text-[13px] md:text-sm text-content-sub leading-relaxed">
              <p className="m-0">
                資産マスタID・カテゴリ・大分類・中分類・明細区分・明細親機・品目名・メーカー名・型式は台帳ファイルに含めません。台帳ファイルにこれらの列があっても取り込まず、取込後の突き合わせでシステムが資産マスタを推薦し、割り当てます。
              </p>
              <p className="m-0">
                台帳に記載されていた品目名・メーカー名・型式は「品目名（元）」「メーカー名(元)」「型式(元)」として取り込み、割り当て後も元の名称として保持します。
              </p>
            </div>
          </div>

          {/* Notice (Figma 仕様: 赤 alert スタイル) */}
          <div data-element-id="ai-notice-area" className="bg-surface-card border border-content-alert rounded-lg p-4 md:p-5 mb-6 md:mb-8">
            <h3 data-element-id="ai-notice-title" className="inline-flex items-center gap-2 text-sm md:text-[15px] font-bold text-content-alert mb-3">
              <Pin className="w-4 h-4" aria-hidden />
              アップロード時の注意事項
            </h3>
            <ul data-element-id="ai-notice-list" className="text-[13px] md:text-sm text-content-alert leading-[1.8] pl-5 m-0">
              <li>Excelファイルの1行目はヘッダー行として認識されます</li>
              <li>データは2行目から読み込まれます</li>
              <li>空白行は自動的にスキップされます</li>
              <li>取込対象カラム以外の列は画面表示・突き合わせには使用されません（原本は監査用に保持されます）</li>
            </ul>
          </div>

          {/* Action Buttons (Figma: 左寄せコンパクト幅) */}
          <div className="flex gap-3 flex-col md:flex-row">
            <button
              data-element-id="ai-back-btn"
              onClick={() => router.push('/main')}
              className="px-6 py-3 bg-surface-negative text-content-primary border-none rounded-lg text-sm md:text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-stroke-input transition-colors min-h-[44px] md:min-w-[200px]"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden />
              <span>メイン画面に戻る</span>
            </button>
            {selectedFile && fileInfo ? (
              <button
                data-element-id="ai-upload-proceed-btn"
                onClick={handleUploadAndProceed}
                className="px-6 py-3 bg-cta-primary text-white border-none rounded-lg text-sm md:text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-cta-primary-dark transition-colors min-h-[44px] md:min-w-[260px]"
              >
                <span>アップロードして突き合わせへ</span>
                <ArrowRight className="w-4 h-4" aria-hidden />
              </button>
            ) : uploadedFiles.length > 0 ? (
              <button
                data-element-id="ai-goto-matching-btn"
                onClick={handleResumeMatching}
                className="px-6 py-3 bg-cta-primary text-white border-none rounded-lg text-sm md:text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-cta-primary-dark transition-colors min-h-[44px] md:min-w-[200px]"
              >
                <span>突き合わせ画面へ</span>
                <ArrowRight className="w-4 h-4" aria-hidden />
              </button>
            ) : (
              <button
                data-element-id="ai-next-btn"
                onClick={() => router.push('/asset-matching')}
                className="px-6 py-3 bg-surface-card text-cta-primary border-2 border-cta-primary rounded-lg text-sm md:text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-surface-select transition-colors min-h-[44px] md:min-w-[200px]"
              >
                <span>次へ</span>
                <ArrowRight className="w-4 h-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
