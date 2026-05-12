'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useAuthStore,
  useUserStore,
  useFacilityFeatureStore,
  useUserFeatureStore,
} from '@/lib/stores';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import {
  PERMISSION_UNITS,
  PERMISSION_CATEGORY_ORDER,
  getPermissionUnitsByCategory,
  PermissionUnit,
} from '@/lib/data/permission-units';

type PendingChanges = Record<string, boolean>;

export default function UserPermissionManagementPage() {
  const router = useRouter();
  const { user, selectedFacility } = useAuthStore();
  const { users } = useUserStore();
  const { getSetting: getFacilitySetting } = useFacilityFeatureStore();
  const { setSetting, getSetting } = useUserFeatureStore();
  const { showToast } = useToast();

  const [selectedUserId, setSelectedUserId] = useState('');
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const pendingCount = Object.keys(pendingChanges).length;
  const hasPendingChanges = pendingCount > 0;

  const facilityName = user?.hospital || selectedFacility || '';

  const facilityUsers = useMemo(() => {
    if (!facilityName) return [];
    return users.filter((u) => u.hospital === facilityName && u.id !== user?.id);
  }, [users, facilityName, user?.id]);

  /** 表示用ラベル: username が同名で衝突しないよう email/id を併記 */
  const buildLabel = (u: { id: string; username: string; email?: string }) =>
    u.email ? `${u.username} (${u.email})` : `${u.username} (${u.id})`;

  const userOptions = useMemo(
    () => facilityUsers.map(buildLabel),
    [facilityUsers]
  );

  const selectedUser = useMemo(
    () => facilityUsers.find((u) => u.id === selectedUserId) || null,
    [facilityUsers, selectedUserId]
  );

  const selectedLabel = selectedUser ? buildLabel(selectedUser) : '';

  useEffect(() => {
    if (!hasPendingChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasPendingChanges]);

  if (user?.role !== 'hospital_sys_admin') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white p-6">
        <div className="text-center">
          <p className="text-base font-semibold text-[#DA0000] mb-2">アクセス権限がありません</p>
          <p className="text-sm text-[#8A8A8A] mb-4">この画面は施設管理者のみ利用できます</p>
          <button
            onClick={() => router.push('/main')}
            className="px-4 py-2 bg-[#8A8A8A] text-white rounded text-sm hover:bg-[#4b5563] transition-colors"
          >
            メイン画面へ戻る
          </button>
        </div>
      </div>
    );
  }

  /** ロック条件: 管理単位='施設' or 施設レベルOFF のとき変更不可 */
  const isLocked = (unit: PermissionUnit): boolean => {
    if (unit.managementLevel === '施設') return true;
    return !getFacilitySetting(facilityName, unit.id);
  };

  /** 保存済 + 1段目反映後の有効状態 */
  const getSavedEnabled = (unit: PermissionUnit): boolean => {
    if (!getFacilitySetting(facilityName, unit.id)) return false;
    if (unit.managementLevel === '施設') return true;
    if (!selectedUser) return true;
    const userOverride = getSetting(selectedUser.id, facilityName, unit.id);
    if (userOverride === false) return false;
    return true;
  };

  const getDisplayEnabled = (unit: PermissionUnit): boolean => {
    if (unit.id in pendingChanges) return pendingChanges[unit.id];
    return getSavedEnabled(unit);
  };

  const isPending = (unitId: string): boolean => unitId in pendingChanges;

  const handleToggle = (unit: PermissionUnit) => {
    if (!facilityName || isLocked(unit) || !selectedUser) return;
    const currentDisplay = getDisplayEnabled(unit);
    const savedValue = getSavedEnabled(unit);
    const newValue = !currentDisplay;

    setPendingChanges((prev) => {
      const next = { ...prev };
      if (newValue === savedValue) {
        delete next[unit.id];
      } else {
        next[unit.id] = newValue;
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!selectedUser || !facilityName) return;
    for (const [unitId, enabled] of Object.entries(pendingChanges)) {
      setSetting(selectedUser.id, facilityName, unitId, enabled);
    }
    setPendingChanges({});
    showToast(`${selectedUser.username} の権限設定を保存しました`, 'success');
  };

  const handleDiscard = () => {
    setPendingChanges({});
  };

  const handleUserChange = (newLabel: string) => {
    const target = facilityUsers.find((u) => buildLabel(u) === newLabel);
    if (!target) return;
    if (hasPendingChanges) {
      setPendingUserId(target.id);
      return;
    }
    setPendingChanges({});
    setSelectedUserId(target.id);
  };

  const confirmUserSwitch = () => {
    if (!pendingUserId) return;
    setPendingChanges({});
    setSelectedUserId(pendingUserId);
    setPendingUserId(null);
  };

  const cancelUserSwitch = () => setPendingUserId(null);

  const handleHomeClick = () => {
    if (hasPendingChanges) {
      setShowHomeConfirm(true);
    } else {
      router.push('/main');
    }
  };

  const grouped = getPermissionUnitsByCategory();
  const visibleCategories = PERMISSION_CATEGORY_ORDER.filter((c) => grouped[c] && grouped[c].length > 0);
  const totalCount = PERMISSION_UNITS.length;

  return (
    <div className="min-h-dvh bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#E1E1E1] px-5 py-4 flex justify-between items-center flex-wrap gap-3 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-[#0073B8] text-white rounded text-xs font-bold tracking-wider">病院</span>
          <h1 className="text-base font-bold text-[#4A4A4A] m-0">ユーザー権限管理</h1>
          <span className="px-2 py-0.5 bg-[#F1F1F1] text-[#8A8A8A] rounded text-xs">{totalCount}件</span>
        </div>
        <button
          onClick={handleHomeClick}
          className="px-4 py-2 bg-[#8A8A8A] text-white border-0 rounded text-sm font-semibold hover:bg-[#4b5563] transition-colors"
        >
          メイン画面に戻る
        </button>
      </header>

      <div className="max-w-[1100px] mx-auto w-full px-5 py-6 pb-24">
        <div className="bg-white border border-[#E1E1E1] rounded-md p-4 mb-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#4A4A4A]">施設</label>
              <span className="px-3 py-1.5 bg-[#F1F1F1] text-[#4A4A4A] rounded text-sm">{facilityName || '-'}</span>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[260px]">
              <label className="text-xs font-semibold text-[#4A4A4A]">対象ユーザー</label>
              <SearchableSelect
                options={userOptions}
                value={selectedLabel}
                onChange={handleUserChange}
                placeholder="ユーザーを選択..."
              />
            </div>
            <p className="text-xs text-[#8A8A8A] flex-1 min-w-[200px]">
              施設の管理者として、自施設ユーザーの機能ごとの利用可否を設定します。施設レベルでOFFの機能は変更できません。
            </p>
          </div>
        </div>

        {!selectedUser ? (
          <div className="bg-white border border-[#E1E1E1] rounded-md p-10 text-center">
            <p className="text-sm text-[#8A8A8A] m-0">対象ユーザーを選択してください。</p>
          </div>
        ) : (
          <>
            <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-md px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-[#075985]">{selectedUser.username}</span>
              {selectedUser.department && (
                <span className="text-xs text-[#0c4a6e]">{selectedUser.department}</span>
              )}
              {selectedUser.email && (
                <span className="text-xs text-[#0c4a6e]">{selectedUser.email}</span>
              )}
            </div>

            <div className="bg-white border border-[#E1E1E1] rounded-md overflow-hidden">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E1E1E1]">
                    <th className="text-left font-semibold text-[#8A8A8A] py-3 px-4 whitespace-nowrap">機能</th>
                    <th className="text-left font-semibold text-[#8A8A8A] py-3 px-4">切替内容</th>
                    <th className="text-center font-semibold text-[#8A8A8A] py-3 px-4 w-[90px]">施設設定</th>
                    <th className="text-center font-semibold text-[#8A8A8A] py-3 px-4 w-[100px]">ユーザー</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCategories.map((category) => {
                    const units = grouped[category];
                    return (
                      <React.Fragment key={category}>
                        <tr className="bg-[#F1F1F1] border-b border-[#E1E1E1]">
                          <td colSpan={4} className="py-2 px-4 text-xs font-semibold text-[#4b5563] tracking-wide">
                            {category}
                          </td>
                        </tr>
                        {units.map((unit) => {
                          const facilityEnabled = getFacilitySetting(facilityName, unit.id);
                          const enabled = getDisplayEnabled(unit);
                          const locked = isLocked(unit);
                          const changed = isPending(unit.id);
                          return (
                            <tr
                              key={unit.id}
                              className={`border-b border-[#F1F1F1] last:border-b-0 ${
                                locked
                                  ? 'bg-[#FAFAFA]'
                                  : changed
                                    ? 'bg-[#fef3c7]'
                                    : !enabled
                                      ? 'bg-[#fef2f2]'
                                      : 'hover:bg-[#FAFAFA]'
                              }`}
                            >
                              <td className="py-2.5 px-4 text-[#4A4A4A] align-top whitespace-nowrap">
                                <div>{unit.displayName}</div>
                                {changed && (
                                  <span className="inline-block mt-1 text-xs text-[#d97706] font-medium">変更あり</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-xs text-[#4b5563] align-top text-pretty leading-relaxed">
                                {unit.switchContent}
                              </td>
                              <td className="py-2.5 px-4 text-center text-xs align-top">
                                {facilityEnabled ? (
                                  <span className="text-[#008C1D] font-medium">ON</span>
                                ) : (
                                  <span className="text-[#DA0000] font-medium">OFF</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center align-top">
                                {locked ? (
                                  <span className="text-xs text-[#8A8A8A]">-</span>
                                ) : (
                                  <button
                                    onClick={() => handleToggle(unit)}
                                    aria-label={`${unit.displayName} を${enabled ? 'OFF' : 'ON'}にする`}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  enabled ? 'bg-[#008C1D]' : 'bg-[#d1d5db]'
                                }`}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {hasPendingChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#4A4A4A] text-white px-5 py-3 shadow-lg z-30">
          <div className="max-w-[1100px] mx-auto flex items-center justify-between gap-4">
            <p className="text-sm m-0">
              {selectedUser?.username} : 未保存の変更が {pendingCount} 件あります
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDiscard}
                className="px-4 py-2 bg-[#4b5563] text-white border-0 rounded text-sm font-semibold hover:bg-[#4A4A4A] transition-colors"
              >
                変更を破棄
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#008C1D] text-white border-0 rounded text-sm font-semibold hover:bg-[#0A6B17] transition-colors"
              >
                保存する
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showHomeConfirm}
        onClose={() => setShowHomeConfirm(false)}
        onConfirm={() => router.push('/main')}
        title="メイン画面に戻る"
        message="未保存の変更が破棄されます。メイン画面に戻りますか？"
        confirmLabel="メイン画面に戻る"
        cancelLabel="入力を続ける"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={pendingUserId !== null}
        onClose={cancelUserSwitch}
        onConfirm={confirmUserSwitch}
        title="ユーザーを切替"
        message="未保存の変更が破棄されます。別ユーザーに切替えますか？"
        confirmLabel="破棄して切替"
        cancelLabel="入力を続ける"
        variant="warning"
      />
    </div>
  );
}
