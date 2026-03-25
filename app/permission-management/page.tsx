'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, usePermissionOverrideStore } from '@/lib/stores';
import { UserRole, USER_ROLE_LABELS } from '@/lib/types';
import { FeatureId, PermissionLevel, getDefaultPermissionLevel } from '@/lib/utils/permissions';
import { useToast } from '@/components/ui/Toast';

/** 機能カテゴリ定義 */
interface FeatureCategory {
  label: string;
  features: { id: FeatureId; label: string }[];
}

const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    label: '資産関連',
    features: [
      { id: 'asset_search', label: '資産検索' },
      { id: 'asset_detail', label: '資産詳細' },
      { id: 'asset_edit', label: '資産編集' },
      { id: 'edit_list_create', label: '編集リスト作成' },
    ],
  },
  {
    label: '現有資産調査',
    features: [
      { id: 'offline_prep', label: 'オフライン準備' },
      { id: 'survey_location', label: '調査場所設定' },
      { id: 'asset_survey', label: '資産調査' },
      { id: 'survey_history', label: '調査履歴' },
    ],
  },
  {
    label: '棚卸',
    features: [
      { id: 'inventory', label: '棚卸' },
    ],
  },
  {
    label: 'QRコード',
    features: [
      { id: 'qr_issue', label: 'QRコード発行' },
      { id: 'qr_print', label: 'QR印刷' },
    ],
  },
  {
    label: '購入管理',
    features: [
      { id: 'quotation_data_box', label: 'タスク管理' },
      { id: 'quotation_processing', label: '見積処理' },
    ],
  },
  {
    label: '見積管理',
    features: [
      { id: 'quotation_management', label: '見積管理' },
    ],
  },
  {
    label: '修理',
    features: [
      { id: 'repair_request', label: '修理申請' },
      { id: 'repair_task', label: '修理タスク' },
    ],
  },
  {
    label: '貸出',
    features: [
      { id: 'lending_available', label: '貸出可能機器' },
      { id: 'lending_checkout', label: '貸出・返却' },
      { id: 'lending_task', label: '貸出タスク' },
    ],
  },
  {
    label: '点検',
    features: [
      { id: 'daily_inspection', label: '日常点検' },
      { id: 'inspection_prep', label: '点検準備' },
      { id: 'inspection_result', label: '点検結果' },
    ],
  },
  {
    label: '保守',
    features: [
      { id: 'maintenance_quote', label: '保守見積' },
      { id: 'maker_maintenance_result', label: 'メーカー保守結果' },
    ],
  },
  {
    label: '廃棄',
    features: [
      { id: 'disposal_task', label: '廃棄タスク' },
    ],
  },
  {
    label: 'マスタ管理',
    features: [
      { id: 'ship_asset_master', label: 'SHIP資産マスタ' },
      { id: 'ship_facility_master', label: 'SHIP施設マスタ' },
      { id: 'ship_department_master', label: 'SHIP部署マスタ' },
      { id: 'hospital_facility_master', label: '個別部署マスタ' },
    ],
  },
  {
    label: 'ユーザー管理',
    features: [
      { id: 'user_management', label: 'ユーザー管理' },
    ],
  },
  {
    label: 'データ管理',
    features: [
      { id: 'asset_import', label: '資産台帳取込' },
      { id: 'data_matching', label: 'データ突合' },
    ],
  },
];

const ALL_ROLES: UserRole[] = ['admin', 'consultant', 'sales', 'office_admin', 'office_staff', 'clinical_staff'];

/** 権限レベルのバッジ表示 */
function PermissionBadge({ level }: { level: PermissionLevel }) {
  const styles: Record<PermissionLevel, string> = {
    F: 'bg-emerald-100 text-emerald-800',
    W: 'bg-sky-100 text-sky-800',
    R: 'bg-amber-100 text-amber-800',
    C: 'bg-purple-100 text-purple-800',
    X: 'bg-slate-100 text-slate-400',
  };
  const labels: Record<PermissionLevel, string> = {
    F: 'フルアクセス',
    W: '閲覧+編集',
    R: '閲覧のみ',
    C: '作成のみ',
    X: 'アクセス不可',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}

/** 未保存の変更バッファ。key = featureId, value = enabled */
type PendingChanges = Record<string, boolean>;

export default function PermissionManagementPage() {
  const router = useRouter();
  const { user, selectedFacility } = useAuthStore();
  const { setOverride, getOverride } = usePermissionOverrideStore();
  const { showToast } = useToast();

  const [selectedRole, setSelectedRole] = useState<UserRole>('consultant');
  // 現在のロールの未保存変更バッファ
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});

  const pendingCount = Object.keys(pendingChanges).length;
  const hasPendingChanges = pendingCount > 0;

  // ブラウザの離脱警告
  useEffect(() => {
    if (!hasPendingChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasPendingChanges]);

  // admin以外はアクセス不可
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <p className="text-lg font-semibold text-red-600 text-pretty">アクセス権限がありません</p>
          <p className="mt-2 text-sm text-slate-500 text-pretty">この画面はシステム管理者のみ利用できます</p>
          <button
            onClick={() => router.push('/main')}
            className="mt-4 px-4 py-2 bg-slate-600 text-white rounded text-sm font-semibold transition-colors hover:bg-slate-700"
          >
            メイン画面へ戻る
          </button>
        </div>
      </div>
    );
  }

  // 施設未選択の場合
  if (!selectedFacility) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <p className="text-lg font-semibold text-slate-700 text-pretty">施設が選択されていません</p>
          <p className="mt-2 text-sm text-slate-500 text-pretty">施設選択画面から施設を選択してください</p>
          <button
            onClick={() => router.push('/facility-select')}
            className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded text-sm font-semibold transition-colors hover:bg-emerald-600"
          >
            施設選択へ
          </button>
        </div>
      </div>
    );
  }

  const isAdminRole = selectedRole === 'admin';

  /** ストア上での有効状態を取得（pending未反映） */
  const getSavedEnabled = (featureId: FeatureId): boolean => {
    const defaultLevel = getDefaultPermissionLevel(featureId, selectedRole);
    if (defaultLevel === 'X') return false;
    const override = getOverride(selectedFacility, selectedRole, featureId);
    if (override === false) return false;
    return true;
  };

  /** pending を考慮した有効状態を取得 */
  const getDisplayEnabled = (featureId: FeatureId): boolean => {
    if (featureId in pendingChanges) return pendingChanges[featureId];
    return getSavedEnabled(featureId);
  };

  /** 変更が pending にあるかどうか */
  const isPending = (featureId: FeatureId): boolean => {
    return featureId in pendingChanges;
  };

  const handleToggle = (featureId: FeatureId) => {
    if (isAdminRole) return;
    const currentDisplay = getDisplayEnabled(featureId);
    const newValue = !currentDisplay;
    const savedValue = getSavedEnabled(featureId);

    setPendingChanges((prev) => {
      const next = { ...prev };
      if (newValue === savedValue) {
        delete next[featureId];
      } else {
        next[featureId] = newValue;
      }
      return next;
    });
  };

  const handleSave = () => {
    for (const [featureId, enabled] of Object.entries(pendingChanges)) {
      setOverride(selectedFacility, selectedRole, featureId as FeatureId, enabled);
    }
    setPendingChanges({});
    showToast(`${USER_ROLE_LABELS[selectedRole]} の権限設定を保存しました`, 'success');
  };

  const handleDiscard = () => {
    setPendingChanges({});
  };

  const handleRoleChange = (role: UserRole) => {
    if (hasPendingChanges) {
      if (!window.confirm(`${USER_ROLE_LABELS[selectedRole]} の未保存の変更があります。破棄して切り替えますか？`)) {
        return;
      }
    }
    setPendingChanges({});
    setSelectedRole(role);
  };

  const handleBack = () => {
    if (hasPendingChanges) {
      if (!window.confirm('未保存の変更があります。破棄してメイン画面に戻りますか？')) {
        return;
      }
    }
    router.push('/main');
  };

  return (
    <div className="min-h-dvh flex flex-col bg-slate-100">
      {/* ヘッダー */}
      <header className="bg-slate-700 text-white px-5 py-4 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="px-3 py-1.5 bg-slate-500 text-white border-0 rounded text-sm cursor-pointer transition-colors hover:bg-slate-600"
          >
            ← 戻る
          </button>
          <h1 className="text-lg font-bold m-0 text-balance">権限管理</h1>
        </div>
      </header>

      <div className="flex-1 p-5 max-w-[1200px] mx-auto w-full pb-24">
        {/* コントロールバー */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">対象施設</span>
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
              {selectedFacility}
            </span>
          </div>
        </div>

        {/* ロールタブ */}
        <div className="bg-white rounded-lg shadow mb-4">
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {ALL_ROLES.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-0 cursor-pointer transition-colors ${
                  selectedRole === role
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {USER_ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>

        {/* admin ロール選択時の注意表示 */}
        {isAdminRole && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-800 font-semibold text-pretty">
              システム管理者（admin）の権限は変更できません。すべての機能がフルアクセスで固定されています。
            </p>
          </div>
        )}

        {/* 機能テーブル */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="py-3 px-4 text-left font-semibold text-slate-700 whitespace-nowrap border-b border-slate-200 w-[160px]">
                  カテゴリ
                </th>
                <th className="py-3 px-4 text-left font-semibold text-slate-700 whitespace-nowrap border-b border-slate-200">
                  機能名
                </th>
                <th className="py-3 px-4 text-center font-semibold text-slate-700 whitespace-nowrap border-b border-slate-200 w-[120px]">
                  デフォルト権限
                </th>
                <th className="py-3 px-4 text-center font-semibold text-slate-700 whitespace-nowrap border-b border-slate-200 w-[100px]">
                  ON/OFF
                </th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_CATEGORIES.map((category) => (
                <React.Fragment key={category.label}>
                  {category.features.map((feature, idx) => {
                    const defaultLevel = getDefaultPermissionLevel(feature.id, selectedRole);
                    const enabled = getDisplayEnabled(feature.id);
                    const isDefaultX = defaultLevel === 'X';
                    const isOverridden = !isDefaultX && !enabled;
                    const isChanged = isPending(feature.id);

                    return (
                      <tr
                        key={feature.id}
                        className={`border-b border-slate-100 ${
                          isChanged
                            ? 'bg-amber-50'
                            : isOverridden
                              ? 'bg-red-50'
                              : 'hover:bg-slate-50'
                        }`}
                      >
                        {idx === 0 ? (
                          <td
                            className="py-2.5 px-4 font-semibold text-slate-600 align-top border-r border-slate-100"
                            rowSpan={category.features.length}
                          >
                            {category.label}
                          </td>
                        ) : null}
                        <td className="py-2.5 px-4 text-slate-800">
                          {feature.label}
                          {isChanged && (
                            <span className="ml-2 text-xs text-amber-600 font-medium">変更あり</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <PermissionBadge level={defaultLevel} />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {isDefaultX ? (
                            <span className="text-xs text-slate-400">-</span>
                          ) : (
                            <button
                              onClick={() => handleToggle(feature.id)}
                              disabled={isAdminRole}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                isAdminRole
                                  ? 'bg-emerald-300 cursor-not-allowed opacity-60'
                                  : enabled
                                    ? 'bg-emerald-500 cursor-pointer'
                                    : 'bg-slate-300 cursor-pointer'
                              }`}
                              aria-label={`${feature.label}の権限を${enabled ? '無効' : '有効'}にする`}
                            >
                              <span
                                className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${
                                  enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 未保存変更バー */}
      {hasPendingChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-800 text-white px-5 py-4 shadow-lg z-40">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
            <p className="text-sm font-medium">
              {USER_ROLE_LABELS[selectedRole]} : 未保存の変更が {pendingCount} 件あります
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDiscard}
                className="px-4 py-2 bg-slate-600 text-white border-0 rounded text-sm font-semibold cursor-pointer transition-colors hover:bg-slate-500"
              >
                変更を破棄
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-500 text-white border-0 rounded text-sm font-semibold cursor-pointer transition-colors hover:bg-emerald-600"
              >
                保存する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
