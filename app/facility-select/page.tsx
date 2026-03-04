'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useMasterStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export default function FacilitySelectPage() {
  const router = useRouter();
  const { user, setSelectedFacility } = useAuthStore();
  const { facilities } = useMasterStore();
  const [selected, setSelected] = useState('');

  // 病院側ユーザー（user.hospital のみ）→ 自動設定して即リダイレクト
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // accessibleFacilities が無い＝病院側ユーザー
    if (!user.accessibleFacilities && user.hospital) {
      setSelectedFacility(user.hospital);
      router.push('/main');
    }
  }, [user, setSelectedFacility, router]);

  // 全施設管理者かどうか
  const isAllFacilityAdmin = user?.accessibleFacilities?.includes('全施設') ?? false;

  // SearchableSelect 用（全施設管理者のみ）
  const allFacilityOptions = useMemo(() => {
    return facilities.map(f => f.facilityName);
  }, [facilities]);

  // カード一覧用（コンサル・営業等）
  const facilityList = useMemo(() => {
    if (!user?.accessibleFacilities) return [];
    return user.accessibleFacilities.filter(f => f !== '全施設');
  }, [user]);

  const handleFacilitySelect = (facilityName: string) => {
    setSelectedFacility(facilityName);
    router.push('/main');
  };

  const handleSubmit = () => {
    if (!selected) return;
    setSelectedFacility(selected);
    router.push('/main');
  };

  // 病院側ユーザーはuseEffectで即リダイレクトされるので、SHIP側のみレンダリング
  if (!user || (!user.accessibleFacilities && user.hospital)) {
    return null;
  }

  return (
    <div className="min-h-dvh flex items-center justify-center fixed inset-0 bg-slate-100 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-5 p-12 my-auto">
        {/* ロゴ */}
        <div className="size-20 rounded-3xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-8 bg-emerald-500">
          SHIP
        </div>

        {/* タイトル */}
        <h1 className="text-2xl font-bold text-center mb-2 text-balance text-slate-800">
          作業対象施設の選択
        </h1>
        <p className="text-sm text-slate-500 text-center mb-8 text-pretty">
          作業を行う施設を選択してください
        </p>

        {/* ユーザー情報 */}
        <div className="mb-8 px-4 py-3 bg-slate-50 rounded-lg text-sm text-slate-600">
          <span className="font-semibold">{user.username}</span>
          <span className="mx-2 text-slate-300">|</span>
          <span>{user.email}</span>
        </div>

        {isAllFacilityAdmin ? (
          /* 全施設管理者: SearchableSelect + 決定ボタン */
          <>
            <div className="mb-8">
              <SearchableSelect
                label="施設を選択"
                value={selected}
                onChange={setSelected}
                options={['', ...allFacilityOptions]}
                placeholder="施設名を入力して検索..."
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!selected}
              className={`w-full border-0 rounded-lg text-base font-semibold py-3.5 px-6 transition-all ${
                selected
                  ? 'bg-emerald-500 text-white cursor-pointer shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/40 active:translate-y-0'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              決定
            </button>
          </>
        ) : (
          /* コンサル・営業等: カード一覧 */
          <div className="flex flex-col gap-3">
            {facilityList.map((facilityName) => (
              <button
                key={facilityName}
                onClick={() => handleFacilitySelect(facilityName)}
                className="w-full text-left px-5 py-4 bg-white border-2 border-slate-200 rounded-xl text-base font-semibold text-slate-700 cursor-pointer transition-all hover:border-emerald-500 hover:bg-emerald-50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/10"
              >
                <div className="flex items-center justify-between">
                  <span>{facilityName}</span>
                  <span className="text-emerald-500 text-xl">→</span>
                </div>
              </button>
            ))}

            {facilityList.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-pretty">
                <p>アクセス可能な施設がありません</p>
                <p className="text-sm mt-2">管理者にお問い合わせください</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
