'use client';

// 資産一覧画面「管理部署 一括設定」モーダル (新規要求 2026-06-01)
// 関連権限単位: PU-005「資産一覧 / 管理部署編集」

import React, { useState, useMemo, useEffect } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { useMasterStore } from '@/lib/stores';
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';

export interface BulkManagingDeptModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  /** 確定時に呼ばれる。実際の更新処理はここで実行する */
  onConfirm: (newDept: string) => void;
}

export function BulkManagingDeptModal({
  isOpen,
  onClose,
  selectedCount,
  onConfirm,
}: BulkManagingDeptModalProps) {
  const { departments } = useMasterStore();
  const [newDept, setNewDept] = useState<string>('');
  const [showAlert, setShowAlert] = useState(false);

  useBodyScrollLock(isOpen);

  // ESC で閉じる
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAlert) setShowAlert(false);
        else handleClose();
      }
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, showAlert]);

  // 部署マスタから「部署」候補を抽出 (重複排除)
  const departmentOptions = useMemo(
    () => Array.from(new Set(departments.map((d) => d.department))).filter(Boolean),
    [departments],
  );

  const handleClose = () => {
    setNewDept('');
    setShowAlert(false);
    onClose();
  };

  const handleApplyClick = () => {
    if (!newDept) return;
    setShowAlert(true);
  };

  const handleConfirmExecute = () => {
    onConfirm(newDept);
    setShowAlert(false);
    setNewDept('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {!showAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          {/* overflow-visible でドロップダウンがモーダル下まで突き抜けて表示可能に */}
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col"
            style={{ overflow: 'visible' }}
          >
            <div className="flex items-center justify-between p-4 border-b border-stroke-input">
              <h2 className="text-xl font-semibold text-content-primary">管理部署 一括設定</h2>
              <button
                onClick={handleClose}
                aria-label="閉じる"
                className="bg-transparent border-0 text-content-sub hover:text-content-primary p-1 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div className="text-sm text-content-primary">
                選択中: <span className="font-semibold tabular-nums">{selectedCount}件</span>
              </div>
              <div className="flex flex-col gap-2 relative">
                <label htmlFor="bulk-dept-select" className="text-sm font-semibold text-content-primary">
                  新しい管理部署 <span className="text-content-alert">*</span>
                </label>
                <SearchableSelect
                  value={newDept}
                  onChange={setNewDept}
                  options={['', ...departmentOptions]}
                  placeholder="部署マスタから選択"
                  isMobile={false}
                  dropdownMinWidth="100%"
                />
              </div>
              <p className="text-xs text-content-sub text-pretty">
                ※ 選択した全件の管理部署が、指定の部署に上書きされます。
              </p>

              <div className="flex justify-end gap-3 pt-2 border-t border-stroke-input">
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-10 min-w-[100px] px-4 rounded-md bg-surface-card border border-stroke-input text-content-primary text-sm font-medium cursor-pointer hover:bg-stroke-card transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleApplyClick}
                  disabled={!newDept || selectedCount === 0}
                  className={`h-10 min-w-[140px] px-4 rounded-md text-white text-sm font-semibold transition-colors ${
                    !newDept || selectedCount === 0
                      ? 'bg-content-sub cursor-not-allowed'
                      : 'bg-cta-primary hover:bg-cta-primary-dark cursor-pointer'
                  }`}
                >
                  {selectedCount}件に適用
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 確認 AlertDialog (CLAUDE.md §4 破壊的アクションには AlertDialog) */}
      {isOpen && showAlert && (
        <div
          role="alertdialog"
          aria-labelledby="bulk-dept-alert-title"
          aria-describedby="bulk-dept-alert-desc"
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowAlert(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-card rounded-xl shadow-2xl max-w-[480px] w-full p-6"
          >
            <h2 id="bulk-dept-alert-title" className="text-lg font-bold text-content-primary mb-2 text-balance">
              管理部署の一括変更
            </h2>
            <p id="bulk-dept-alert-desc" className="text-sm text-content-primary mb-2 text-pretty">
              <span className="tabular-nums font-semibold">{selectedCount}件</span> の管理部署を「
              <span className="font-semibold text-cta-primary-dark">{newDept}</span>
              」に変更します。
            </p>
            <p className="text-xs text-content-sub mb-5">この操作は取り消せません。</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAlert(false)}
                className="h-10 min-w-[100px] px-4 rounded-md bg-surface-card border border-stroke-input text-content-primary text-sm font-medium cursor-pointer hover:bg-stroke-card transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirmExecute}
                className="h-10 min-w-[140px] px-4 rounded-md bg-cta-primary text-white text-sm font-semibold cursor-pointer hover:bg-cta-primary-dark transition-colors"
              >
                変更を実行
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
