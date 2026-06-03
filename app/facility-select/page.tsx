'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock } from 'lucide-react';
import { useAuthStore, useMasterStore } from '@/lib/stores';
import { useFacilityGroupStore } from '@/lib/stores/facilityGroupStore';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { EmptyState } from '@/components/ui/EmptyState';

export default function FacilitySelectPage() {
  const router = useRouter();
  const { user, setSelectedFacility } = useAuthStore();
  const { facilities } = useMasterStore();
  const { getGroupsForFacility } = useFacilityGroupStore();
  const [selected, setSelected] = useState('');

  // 権限のある施設を派生計算 (ロール撤廃後の仕様 2026-06-03)
  //   - SHIP 全体管理者 (hospital なし): 全施設アクセス
  //   - 病院ユーザー: 所属病院 + 施設グループ内の他施設
  const accessibleFacilities = useMemo((): string[] => {
    if (!user) return [];
    if (!user.hospital) {
      // SHIP 全体管理者
      return facilities.map((f) => f.facilityName);
    }
    const own = user.hospital;
    const others = new Set<string>();
    const groups = getGroupsForFacility(own);
    for (const g of groups) {
      for (const f of g.facilityIds) {
        if (f !== own) others.add(f);
      }
    }
    return [own, ...Array.from(others)];
  }, [user, facilities, getGroupsForFacility]);

  // 権限のある施設が 1 つしかない → モーダル/画面をスキップして即 /main
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (accessibleFacilities.length === 1) {
      setSelectedFacility(accessibleFacilities[0]);
      router.push('/main');
    }
  }, [user, accessibleFacilities, setSelectedFacility, router]);

  const handleFacilitySelect = (facilityName: string) => {
    setSelectedFacility(facilityName);
    router.push('/main');
  };

  const handleSubmit = () => {
    if (!selected) return;
    setSelectedFacility(selected);
    router.push('/main');
  };

  // user 未認証 / リダイレクト中はレンダーしない
  if (!user || accessibleFacilities.length === 1) {
    return null;
  }

  // 表示モード判定 (施設数が多いと SearchableSelect、少なめならカード)
  const usePulldown = accessibleFacilities.length >= 6;

  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface-screen overflow-y-auto py-8 font-figma">
      <div className="bg-surface-card border border-stroke-card w-full max-w-md mx-5 p-10 my-auto rounded-2xl">
        {/* タイトル */}
        <h1 className="text-[24px] font-bold text-center mb-4 text-balance text-content-primary leading-[1.3]">
          作業対象施設の選択
        </h1>
        <p className="text-base text-content-primary text-center mb-10 text-pretty leading-[1.5]">
          作業を行う施設を選択してください
        </p>

        {/* ユーザー情報 */}
        <div className="mb-6">
          <label className="block text-base font-normal mb-1 text-content-primary leading-[1.5]">
            {user.username}
          </label>
          <div className="w-full h-[42px] px-3 py-[9px] text-base text-content-sub bg-content-placeholder rounded-lg border border-stroke-input">
            {user.email}
          </div>
        </div>

        {accessibleFacilities.length === 0 ? (
          <EmptyState
            icon={<Lock size={48} strokeWidth={1.5} />}
            title="アクセス可能な施設がありません"
            description="権限のある施設が割り当てられていません。管理者にお問い合わせください"
          />
        ) : usePulldown ? (
          /* 施設数が多い場合: SearchableSelect + 決定ボタン */
          <>
            <div className="mb-8">
              <label className="block text-base font-normal mb-1 text-content-primary leading-[1.5]">
                <span className="text-content-alert">※</span>施設を選択
              </label>
              <SearchableSelect
                value={selected}
                onChange={setSelected}
                options={['', ...accessibleFacilities]}
                placeholder="施設名を入力して検索..."
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!selected}
              className={`w-full h-12 border-0 rounded-lg text-base font-normal px-6 transition-colors ${
                selected
                  ? 'bg-cta-primary hover:opacity-90 text-white cursor-pointer'
                  : 'bg-surface-disabled text-content-disabled cursor-not-allowed'
              }`}
            >
              決定
            </button>
          </>
        ) : (
          /* 施設数が少ない場合: カード一覧 */
          <div className="flex flex-col gap-3">
            {accessibleFacilities.map((facilityName) => (
              <button
                key={facilityName}
                onClick={() => handleFacilitySelect(facilityName)}
                className="w-full text-left px-5 py-4 bg-surface-card border border-stroke-input rounded-lg text-base font-normal text-content-primary cursor-pointer transition-colors hover:border-cta-primary hover:bg-surface-select"
              >
                <div className="flex items-center justify-between">
                  <span>{facilityName}</span>
                  <ArrowRight className="w-5 h-5 text-cta-primary" aria-hidden />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
