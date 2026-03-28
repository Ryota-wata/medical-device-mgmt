'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, usePermissionOverrideStore, useUserPermissionOverrideStore } from '@/lib/stores';
import { useUserStore } from '@/lib/stores/userStore';
import { USER_ROLE_LABELS } from '@/lib/types';
import { FeatureId, PermissionLevel, getDefaultPermissionLevel } from '@/lib/utils/permissions';
import { FEATURE_CONFIGS, isFixedFeature } from '@/lib/constants/featureConfig';
import { useToast } from '@/components/ui/Toast';

/** 機能カテゴリ定義 */
interface FeatureCategory {
  label: string;
  features: { id: FeatureId; label: string }[];
}

const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    label: 'ユーザー管理',
    features: [
      { id: 'user_facility_access', label: 'アクセス可能施設の選択' },
      { id: 'user_management', label: 'ユーザー一覧・編集・新規作成' },
    ],
  },
  {
    label: '認証/認可',
    features: [
      { id: 'auth_login', label: 'ログイン・パスワード再設定' },
      { id: 'facility_select', label: '施設選択' },
      { id: 'facility_select_all', label: '施設選択（全施設）' },
    ],
  },
  {
    label: '原本リスト',
    features: [
      { id: 'original_list_view', label: '原本リスト・カード・カルテ閲覧' },
      { id: 'original_price_column', label: '原本価格情報カラム' },
      { id: 'original_list_edit', label: '原本リスト修正・追加' },
      { id: 'original_application', label: '新規・更新・増設・移動・廃棄申請' },
    ],
  },
  {
    label: '保守・点検／貸出／修理申請',
    features: [
      { id: 'daily_inspection', label: 'オフライン準備・日常点検' },
      { id: 'lending_checkout', label: '貸出可能機器・貸出・返却' },
      { id: 'repair_application', label: '修理申請' },
      { id: 'application_status', label: '申請ステータス' },
    ],
  },
  {
    label: '棚卸し',
    features: [
      { id: 'inventory_field', label: '棚卸し（現場）' },
      { id: 'inventory_office', label: '棚卸し（事務）' },
    ],
  },
  {
    label: 'リモデルメニュー',
    features: [
      { id: 'remodel_edit_list', label: '編集リスト（リモデル）' },
      { id: 'remodel_purchase', label: 'リモデル購入管理' },
      { id: 'remodel_order', label: '発注登録～資産登録' },
      { id: 'remodel_acceptance', label: '検収登録' },
      { id: 'remodel_quotation', label: '見積管理（リモデル）' },
    ],
  },
  {
    label: '編集リスト（通常）',
    features: [
      { id: 'normal_edit_list', label: '通常申請の編集リスト' },
      { id: 'ship_column', label: 'DataLINK SHIPカラム' },
    ],
  },
  {
    label: 'タスク管理',
    features: [
      { id: 'normal_purchase', label: '通常購入管理' },
      { id: 'normal_order', label: '発注登録～仮資産登録' },
      { id: 'normal_acceptance', label: '検収登録' },
      { id: 'normal_quotation', label: '見積管理（通常）' },
      { id: 'transfer_disposal', label: '移動・廃棄管理' },
      { id: 'repair_management', label: '修理管理' },
      { id: 'maintenance_contract', label: '保守契約管理' },
      { id: 'inspection_management', label: '点検管理' },
      { id: 'periodic_inspection', label: '定期点検実施' },
      { id: 'lending_management', label: '貸出管理' },
    ],
  },
  {
    label: 'QRコード',
    features: [
      { id: 'qr_issue', label: 'QRコード発行' },
      { id: 'qr_scan', label: 'QR読取' },
    ],
  },
  {
    label: 'データ閲覧（自施設）',
    features: [
      { id: 'own_asset_master_view', label: '資産マスタデータ' },
      { id: 'own_user_master', label: 'ユーザーマスタ' },
      { id: 'own_asset_list', label: '資産リスト' },
      { id: 'own_price_column', label: '価格カラム' },
      { id: 'own_estimate', label: '見積データ' },
      { id: 'own_data_history', label: 'データ履歴' },
    ],
  },
  {
    label: 'データ閲覧（他施設）',
    features: [
      { id: 'other_asset_list', label: '資産リスト' },
      { id: 'other_price_column', label: '価格カラム' },
      { id: 'other_estimate', label: '見積データ' },
      { id: 'other_data_history', label: 'データ履歴' },
    ],
  },
  {
    label: 'マスタ管理',
    features: [
      { id: 'asset_master_list', label: '資産マスタ一覧' },
      { id: 'facility_master_list', label: '施設マスタ一覧' },
      { id: 'dept_vendor_master_list', label: '部署・業者マスタ一覧' },
      { id: 'asset_master_edit', label: '資産マスタ編集' },
      { id: 'facility_master_edit', label: '施設マスタ編集' },
      { id: 'ship_dept_master_edit', label: 'SHIP部署マスタ編集' },
      { id: 'hospital_dept_master_edit', label: '個別部署マスタ編集' },
      { id: 'vendor_master_edit', label: '業者マスタ編集' },
    ],
  },
  {
    label: '個体管理リスト作成',
    features: [
      { id: 'existing_survey', label: '現有品調査' },
      { id: 'survey_data_edit', label: '現調データ修正' },
      { id: 'asset_ledger_import', label: '資産台帳取込登録' },
      { id: 'survey_ledger_matching', label: '現調・台帳突合' },
    ],
  },
];

/** 権限レベルバッジ */
function PermissionBadge({ level }: { level: PermissionLevel }) {
  const styles: Record<PermissionLevel, string> = {
    F: 'bg-emerald-100 text-emerald-800',
    W: 'bg-sky-100 text-sky-800',
    R: 'bg-amber-100 text-amber-800',
    C: 'bg-purple-100 text-purple-800',
    X: 'bg-slate-100 text-slate-400',
  };
  const labels: Record<PermissionLevel, string> = {
    F: 'フル', W: '編集', R: '閲覧', C: '作成', X: '不可',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}

type PendingChanges = Record<string, boolean>;

export default function UserPermissionManagementPage() {
  const router = useRouter();
  const { user, selectedFacility } = useAuthStore();
  const { getOverride: getOrgOverride } = usePermissionOverrideStore();
  const { setOverride, getOverride, resetUserFacility } = useUserPermissionOverrideStore();
  const { users } = useUserStore();
  const { showToast } = useToast();

  const [selectedUserId, setSelectedUserId] = useState<string>('');
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

  // 自施設のユーザー一覧（自分以外）
  const facilityUsers = useMemo(() => {
    const facilityName = user?.hospital || selectedFacility;
    if (!facilityName) return [];
    return users.filter(u => u.hospital === facilityName && u.id !== user?.id);
  }, [users, user?.hospital, user?.id, selectedFacility]);

  const selectedUser = useMemo(() => {
    return facilityUsers.find(u => u.id === selectedUserId) || null;
  }, [facilityUsers, selectedUserId]);

  // hospital_sys_admin 以外はアクセス不可
  if (user?.role !== 'hospital_sys_admin') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <p className="text-lg font-semibold text-red-600 text-pretty">アクセス権限がありません</p>
          <p className="mt-2 text-sm text-slate-500 text-pretty">この画面は病院システム管理者のみ利用できます</p>
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

  const facilityName = user?.hospital || selectedFacility || '';

  /** システム管理者（レイヤー2）でOFFにされているか */
  const isOrgDisabled = (featureId: FeatureId, role: string): boolean => {
    const override = getOrgOverride(facilityName, role as import('@/lib/types').UserRole, featureId);
    return override === false;
  };

  /** ユーザーに対するデフォルト有効状態 */
  const getSavedEnabled = (featureId: FeatureId): boolean => {
    if (!selectedUser) return false;
    const defaultLevel = getDefaultPermissionLevel(featureId, selectedUser.role);
    if (defaultLevel === 'X') return false;
    // レイヤー2: システム管理者がOFFにしていたら無効
    if (isOrgDisabled(featureId, selectedUser.role)) return false;
    // レイヤー3: ユーザー単位のオーバーライド
    const userOverride = getOverride(selectedUser.id, facilityName, featureId);
    if (userOverride === false) return false;
    return true;
  };

  const getDisplayEnabled = (featureId: FeatureId): boolean => {
    if (featureId in pendingChanges) return pendingChanges[featureId];
    return getSavedEnabled(featureId);
  };

  const isPending = (featureId: FeatureId): boolean => {
    return featureId in pendingChanges;
  };

  /** 機能がロック（施設管理者がON/OFFできない）状態かどうか */
  const isLocked = (featureId: FeatureId): boolean => {
    if (!selectedUser) return true;
    const defaultLevel = getDefaultPermissionLevel(featureId, selectedUser.role);
    // デフォルトでアクセス不可
    if (defaultLevel === 'X') return true;
    // 固定機能
    if (isFixedFeature(featureId)) return true;
    // システム管理者がOFFにしている
    if (isOrgDisabled(featureId, selectedUser.role)) return true;
    return false;
  };

  const handleToggle = (featureId: FeatureId) => {
    if (isLocked(featureId)) return;
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
    if (!selectedUser) return;
    for (const [featureId, enabled] of Object.entries(pendingChanges)) {
      setOverride(selectedUser.id, facilityName, featureId as FeatureId, enabled);
    }
    setPendingChanges({});
    showToast(`${selectedUser.username} の権限設定を保存しました`, 'success');
  };

  const handleDiscard = () => {
    setPendingChanges({});
  };

  const handleUserChange = (userId: string) => {
    if (hasPendingChanges) {
      if (!window.confirm('未保存の変更があります。破棄して切り替えますか？')) {
        return;
      }
    }
    setPendingChanges({});
    setSelectedUserId(userId);
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
          <h1 className="text-lg font-bold m-0 text-balance">ユーザー権限管理</h1>
        </div>
      </header>

      <div className="flex-1 p-5 max-w-[1200px] mx-auto w-full pb-24">
        {/* コントロールバー */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">施設</span>
              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
                {facilityName}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="user-select" className="text-sm font-semibold text-slate-700">対象ユーザー</label>
              <select
                id="user-select"
                value={selectedUserId}
                onChange={(e) => handleUserChange(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm min-w-[200px]"
              >
                <option value="">-- ユーザーを選択 --</option>
                {facilityUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}（{USER_ROLE_LABELS[u.role]}）
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {!selectedUser ? (
          <div className="bg-white rounded-lg shadow p-10 text-center">
            <p className="text-slate-500 text-pretty">ユーザーを選択してください</p>
            <p className="text-sm text-slate-400 mt-2 text-pretty">
              選択したユーザーの機能別ON/OFFを設定できます
            </p>
          </div>
        ) : (
          <>
            {/* ユーザー情報バー */}
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-semibold text-sky-800">{selectedUser.username}</span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-700">
                  {USER_ROLE_LABELS[selectedUser.role]}
                </span>
                <span className="text-xs text-sky-600">{selectedUser.department || ''}</span>
              </div>
            </div>

            {/* 機能テーブル */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="py-3 px-4 text-left font-semibold text-slate-700 whitespace-nowrap border-b border-slate-200 w-[140px]">
                      カテゴリ
                    </th>
                    <th className="py-3 px-4 text-left font-semibold text-slate-700 whitespace-nowrap border-b border-slate-200">
                      機能名
                    </th>
                    <th className="py-3 px-4 text-center font-semibold text-slate-700 whitespace-nowrap border-b border-slate-200 w-[80px]">
                      デフォルト
                    </th>
                    <th className="py-3 px-4 text-center font-semibold text-slate-700 whitespace-nowrap border-b border-slate-200 w-[100px]">
                      組織設定
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
                        const defaultLevel = getDefaultPermissionLevel(feature.id, selectedUser.role);
                        const orgDisabled = isOrgDisabled(feature.id, selectedUser.role);
                        const locked = isLocked(feature.id);
                        const enabled = getDisplayEnabled(feature.id);
                        const isChanged = isPending(feature.id);
                        const configLevel = FEATURE_CONFIGS[feature.id];

                        return (
                          <tr
                            key={feature.id}
                            className={`border-b border-slate-100 ${
                              locked
                                ? 'bg-slate-50'
                                : isChanged
                                  ? 'bg-amber-50'
                                  : !enabled
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
                              {configLevel === 'fixed' && (
                                <span className="ml-2 text-xs text-slate-400">固定</span>
                              )}
                              {isChanged && (
                                <span className="ml-2 text-xs text-amber-600 font-medium">変更あり</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <PermissionBadge level={defaultLevel} />
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {defaultLevel === 'X' ? (
                                <span className="text-xs text-slate-400">-</span>
                              ) : orgDisabled ? (
                                <span className="text-xs text-red-500 font-medium">OFF</span>
                              ) : (
                                <span className="text-xs text-emerald-600 font-medium">ON</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {defaultLevel === 'X' || orgDisabled ? (
                                <span className="text-xs text-slate-400">-</span>
                              ) : locked ? (
                                <span className="text-xs text-slate-400">固定</span>
                              ) : (
                                <button
                                  onClick={() => handleToggle(feature.id)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    enabled
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

          </>
        )}
      </div>

      {/* 未保存変更バー */}
      {hasPendingChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-800 text-white px-5 py-4 shadow-lg z-40">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
            <p className="text-sm font-medium">
              {selectedUser?.username} : 未保存の変更が {pendingCount} 件あります
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
