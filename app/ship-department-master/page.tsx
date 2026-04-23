'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useMasterStore } from '@/lib/stores/masterStore';
import { DepartmentMaster, RoomCategoryMaster } from '@/lib/types/master';

export default function ShipDepartmentMasterPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const {
    departments, addDepartment, updateDepartment, deleteDepartment,
    roomCategories, addRoomCategory, updateRoomCategory, deleteRoomCategory,
  } = useMasterStore();

  // 左テーブル: 部署マスタ フィルター
  const [filterDivision, setFilterDivision] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  // 右テーブル: 諸室区分マスタ フィルター
  const [filterRoomCategory1, setFilterRoomCategory1] = useState('');
  const [filterRoomCategory2, setFilterRoomCategory2] = useState('');

  // 左テーブル: モーダル状態
  const [showNewDeptModal, setShowNewDeptModal] = useState(false);
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentMaster | null>(null);
  const [deptFormData, setDeptFormData] = useState({ division: '', department: '' });

  // 右テーブル: モーダル状態
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [selectedRoomCategory, setSelectedRoomCategory] = useState<RoomCategoryMaster | null>(null);
  const [roomFormData, setRoomFormData] = useState({ roomCategory1: '', roomCategory2: '' });

  // 左テーブル: フィルタリング
  const filteredDepartments = departments.filter((dept) => {
    const matchDivision = !filterDivision || dept.division.includes(filterDivision);
    const matchDepartment = !filterDepartment || dept.department.includes(filterDepartment);
    return matchDivision && matchDepartment;
  });

  // 右テーブル: フィルタリング
  const filteredRoomCategories = roomCategories.filter((rc) => {
    const matchRC1 = !filterRoomCategory1 || rc.roomCategory1.includes(filterRoomCategory1);
    const matchRC2 = !filterRoomCategory2 || rc.roomCategory2.includes(filterRoomCategory2);
    return matchRC1 && matchRC2;
  });

  const handleBack = () => router.push('/main');

  // --- 左テーブル: 部署マスタ ハンドラ ---
  const handleEditDept = (dept: DepartmentMaster) => {
    setSelectedDepartment(dept);
    setDeptFormData({ division: dept.division, department: dept.department });
    setShowEditDeptModal(true);
  };

  const handleDeleteDept = (id: string) => {
    if (confirm('この部署マスタを削除してもよろしいですか?')) {
      deleteDepartment(id);
    }
  };

  const handleNewDeptSubmit = () => {
    const newDept: DepartmentMaster = {
      id: `DEPT${String(departments.length + 1).padStart(3, '0')}`,
      division: deptFormData.division,
      department: deptFormData.department,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addDepartment(newDept);
    setShowNewDeptModal(false);
    setDeptFormData({ division: '', department: '' });
  };

  const handleEditDeptSubmit = () => {
    if (selectedDepartment) {
      updateDepartment(selectedDepartment.id, deptFormData);
      setShowEditDeptModal(false);
      setSelectedDepartment(null);
      setDeptFormData({ division: '', department: '' });
    }
  };

  // --- 右テーブル: 諸室区分マスタ ハンドラ ---
  const handleEditRoom = (rc: RoomCategoryMaster) => {
    setSelectedRoomCategory(rc);
    setRoomFormData({ roomCategory1: rc.roomCategory1, roomCategory2: rc.roomCategory2 });
    setShowEditRoomModal(true);
  };

  const handleDeleteRoom = (id: string) => {
    if (confirm('この諸室区分マスタを削除してもよろしいですか?')) {
      deleteRoomCategory(id);
    }
  };

  const handleNewRoomSubmit = () => {
    const newRoom: RoomCategoryMaster = {
      id: `ROOM${String(roomCategories.length + 1).padStart(3, '0')}`,
      roomCategory1: roomFormData.roomCategory1,
      roomCategory2: roomFormData.roomCategory2,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addRoomCategory(newRoom);
    setShowNewRoomModal(false);
    setRoomFormData({ roomCategory1: '', roomCategory2: '' });
  };

  const handleEditRoomSubmit = () => {
    if (selectedRoomCategory) {
      updateRoomCategory(selectedRoomCategory.id, roomFormData);
      setShowEditRoomModal(false);
      setSelectedRoomCategory(null);
      setRoomFormData({ roomCategory1: '', roomCategory2: '' });
    }
  };

  // --- モーダル共通レンダラー ---
  const renderModal = (
    title: string,
    fields: { label: string; value: string; onChange: (v: string) => void; placeholder: string }[],
    onSubmit: () => void,
    onCancel: () => void,
    submitLabel: string,
    submitColor: string,
  ) => {
    const submitColorClass =
      submitColor === '#27ae60' ? 'bg-[#27ae60] hover:bg-[#219a52]' :
      submitColor === '#e74c3c' ? 'bg-[#e74c3c] hover:bg-[#c0392b]' :
      submitColor === '#8e44ad' ? 'bg-[#8e44ad] hover:bg-[#7d3c98]' :
      'bg-[#374151] hover:bg-[#1f2937]';

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
        <div className={`bg-white rounded-lg ${isMobile ? 'w-[90%]' : 'max-w-[700px] w-[90%]'} max-h-[90vh] overflow-auto`}>
          <div className="px-6 py-4 border-b border-[#e0e0e0]">
            <h2 className="text-lg font-semibold text-[#2c3e50] text-balance">{title}</h2>
          </div>
          <div className="p-6 flex flex-col gap-5">
            {fields.map((f) => (
              <div key={f.label}>
                <label className="text-sm font-semibold text-[#2c3e50] block mb-2">{f.label}</label>
                <input
                  type="text"
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 border border-[#ddd] rounded text-sm"
                />
              </div>
            ))}
          </div>
          <div className="px-6 pb-6 flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 bg-[#95a5a6] text-white rounded-md text-sm font-semibold cursor-pointer hover:bg-[#7f8c8d]"
            >
              キャンセル
            </button>
            <button
              onClick={onSubmit}
              className={`px-5 py-2.5 text-white rounded-md text-sm font-semibold cursor-pointer ${submitColorClass}`}
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- 左テーブル: 部署マスタ レンダリング ---
  const renderDeptTable = () => (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm">
      <div className={`flex items-center justify-between ${isMobile ? 'px-4 py-3' : 'px-5 py-4'} bg-[#2c3e50] rounded-t-lg`}>
        <div className="flex items-center gap-3">
          <h2 className={`${isMobile ? 'text-[15px]' : 'text-base'} font-semibold text-white text-balance`}>部署マスタ</h2>
          <span className="bg-white/20 text-white px-3 py-0.5 rounded-full text-[13px] font-semibold tabular-nums">{filteredDepartments.length}件</span>
        </div>
        <button
          onClick={() => { setDeptFormData({ division: '', department: '' }); setShowNewDeptModal(true); }}
          className={`${isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-[13px]'} bg-[#27ae60] hover:bg-[#219a52] text-white rounded-md font-semibold cursor-pointer whitespace-nowrap`}
        >
          新規作成
        </button>
      </div>

      {/* フィルター */}
      <div className={`${isMobile ? 'px-4 py-3' : 'px-5 py-4'} border-b border-[#e0e0e0] grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
        <div>
          <label className="text-sm font-semibold text-[#2c3e50] block mb-2">部門</label>
          <input type="text" value={filterDivision} onChange={(e) => setFilterDivision(e.target.value)} placeholder="診療部門" className="px-3 py-2 border border-[#ddd] rounded text-sm w-full" />
        </div>
        <div>
          <label className="text-sm font-semibold text-[#2c3e50] block mb-2">部署</label>
          <input type="text" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} placeholder="外科" className="px-3 py-2 border border-[#ddd] rounded text-sm w-full" />
        </div>
      </div>

      {/* テーブル / カード */}
      {isMobile ? (
        <div className="p-3 flex flex-col gap-3">
          {filteredDepartments.map((dept) => (
            <div key={dept.id} className="bg-[#fafafa] rounded-lg p-4 border border-[#e5e7eb]">
              <div className="text-base font-semibold text-[#1f2937] mb-1">{dept.department}</div>
              <div className="text-[13px] text-[#6b7280] mb-3">{dept.division}</div>
              <div className="flex gap-2">
                <button onClick={() => handleEditDept(dept)} className="flex-1 py-2 bg-[#374151] text-white rounded text-xs font-semibold cursor-pointer hover:bg-[#1f2937]">編集</button>
                <button onClick={() => handleDeleteDept(dept.id)} className="flex-1 py-2 bg-[#e74c3c] text-white rounded text-xs font-semibold cursor-pointer hover:bg-[#c0392b]">削除</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#2c3e50] text-white">
                <th className={`${isTablet ? 'p-3' : 'p-3.5'} text-left ${isTablet ? 'text-[13px]' : 'text-sm'} font-semibold`}>部門</th>
                <th className={`${isTablet ? 'p-3' : 'p-3.5'} text-left ${isTablet ? 'text-[13px]' : 'text-sm'} font-semibold`}>部署</th>
                <th className={`${isTablet ? 'p-3' : 'p-3.5'} text-center ${isTablet ? 'text-[13px]' : 'text-sm'} font-semibold whitespace-nowrap`}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.map((dept) => (
                <tr key={dept.id} className="border-b border-[#eee] bg-white hover:bg-[#f8f9fa]">
                  <td className={`${isTablet ? 'p-3' : 'p-3.5'} ${isTablet ? 'text-[13px]' : 'text-sm'} text-[#1f2937]`}>{dept.division}</td>
                  <td className={`${isTablet ? 'p-3' : 'p-3.5'} ${isTablet ? 'text-[13px]' : 'text-sm'} text-[#1f2937]`}>{dept.department}</td>
                  <td className={`${isTablet ? 'p-3' : 'p-3.5'} text-center whitespace-nowrap`}>
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleEditDept(dept)} className={`px-3 py-1.5 bg-[#374151] text-white rounded text-[13px] font-semibold cursor-pointer hover:bg-[#1f2937]`}>編集</button>
                      <button onClick={() => handleDeleteDept(dept.id)} className={`px-3 py-1.5 bg-[#e74c3c] text-white rounded text-[13px] font-semibold cursor-pointer hover:bg-[#c0392b]`}>削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredDepartments.length === 0 && (
        <div className="py-10 px-5 text-center text-[#6b7280] text-sm">
          検索条件に一致する部署マスタがありません
        </div>
      )}
    </div>
  );

  // --- 右テーブル: 諸室区分マスタ レンダリング ---
  const renderRoomTable = () => (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm">
      <div className={`flex items-center justify-between ${isMobile ? 'px-4 py-3' : 'px-5 py-4'} bg-[#2c3e50] rounded-t-lg`}>
        <div className="flex items-center gap-3">
          <h2 className={`${isMobile ? 'text-[15px]' : 'text-base'} font-semibold text-white text-balance`}>諸室区分マスタ</h2>
          <span className="bg-white/20 text-white px-3 py-0.5 rounded-full text-[13px] font-semibold tabular-nums">{filteredRoomCategories.length}件</span>
        </div>
        <button
          onClick={() => { setRoomFormData({ roomCategory1: '', roomCategory2: '' }); setShowNewRoomModal(true); }}
          className={`${isMobile ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-[13px]'} bg-[#27ae60] hover:bg-[#219a52] text-white rounded-md font-semibold cursor-pointer whitespace-nowrap`}
        >
          新規作成
        </button>
      </div>

      {/* フィルター */}
      <div className={`${isMobile ? 'px-4 py-3' : 'px-5 py-4'} border-b border-[#e0e0e0] grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
        <div>
          <label className="text-sm font-semibold text-[#2c3e50] block mb-2">諸室区分①</label>
          <input type="text" value={filterRoomCategory1} onChange={(e) => setFilterRoomCategory1(e.target.value)} placeholder="手術室" className="px-3 py-2 border border-[#ddd] rounded text-sm w-full" />
        </div>
        <div>
          <label className="text-sm font-semibold text-[#2c3e50] block mb-2">諸室区分②</label>
          <input type="text" value={filterRoomCategory2} onChange={(e) => setFilterRoomCategory2(e.target.value)} placeholder="オペ室1" className="px-3 py-2 border border-[#ddd] rounded text-sm w-full" />
        </div>
      </div>

      {/* テーブル / カード */}
      {isMobile ? (
        <div className="p-3 flex flex-col gap-3">
          {filteredRoomCategories.map((rc) => (
            <div key={rc.id} className="bg-[#f9fafb] rounded-lg p-4 border border-[#e5e7eb]">
              <div className="text-base font-semibold text-[#1f2937] mb-1">{rc.roomCategory1}</div>
              <div className="text-[13px] text-[#6b7280] mb-3">{rc.roomCategory2}</div>
              <div className="flex gap-2">
                <button onClick={() => handleEditRoom(rc)} className="flex-1 py-2 bg-[#374151] text-white rounded text-xs font-semibold cursor-pointer hover:bg-[#1f2937]">編集</button>
                <button onClick={() => handleDeleteRoom(rc.id)} className="flex-1 py-2 bg-[#e74c3c] text-white rounded text-xs font-semibold cursor-pointer hover:bg-[#c0392b]">削除</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#2c3e50] text-white">
                <th className={`${isTablet ? 'p-3' : 'p-3.5'} text-left ${isTablet ? 'text-[13px]' : 'text-sm'} font-semibold`}>諸室区分①</th>
                <th className={`${isTablet ? 'p-3' : 'p-3.5'} text-left ${isTablet ? 'text-[13px]' : 'text-sm'} font-semibold`}>諸室区分②</th>
                <th className={`${isTablet ? 'p-3' : 'p-3.5'} text-center ${isTablet ? 'text-[13px]' : 'text-sm'} font-semibold whitespace-nowrap`}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoomCategories.map((rc) => (
                <tr key={rc.id} className="border-b border-[#eee] bg-white hover:bg-[#f8f9fa]">
                  <td className={`${isTablet ? 'p-3' : 'p-3.5'} ${isTablet ? 'text-[13px]' : 'text-sm'} text-[#1f2937]`}>{rc.roomCategory1}</td>
                  <td className={`${isTablet ? 'p-3' : 'p-3.5'} ${isTablet ? 'text-[13px]' : 'text-sm'} text-[#1f2937]`}>{rc.roomCategory2}</td>
                  <td className={`${isTablet ? 'p-3' : 'p-3.5'} text-center whitespace-nowrap`}>
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleEditRoom(rc)} className={`px-3 py-1.5 bg-[#374151] text-white rounded text-[13px] font-semibold cursor-pointer hover:bg-[#1f2937]`}>編集</button>
                      <button onClick={() => handleDeleteRoom(rc.id)} className={`px-3 py-1.5 bg-[#e74c3c] text-white rounded text-[13px] font-semibold cursor-pointer hover:bg-[#c0392b]`}>削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredRoomCategories.length === 0 && (
        <div className="py-10 px-5 text-center text-[#6b7280] text-sm">
          検索条件に一致する諸室区分マスタがありません
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-dvh bg-[#f9fafb]">
      {/* Header */}
      <header className={`bg-white border-b border-[#e5e7eb] ${isMobile ? 'px-4 py-3' : isTablet ? 'px-5 py-3.5' : 'px-6 py-4'} flex items-center justify-between flex-wrap ${isMobile ? 'gap-3' : 'gap-4'} sticky top-0 z-20`}>
        <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'} flex-1`}>
          <h1 className={`${isMobile ? 'text-base' : isTablet ? 'text-lg' : 'text-xl'} font-bold text-[#1f2937] text-balance`}>
            SHIP部署マスタ
          </h1>
        </div>
        <button
          onClick={handleBack}
          className={`${isMobile ? 'px-4 py-2 text-[13px]' : 'px-5 py-2.5 text-sm'} bg-[#95a5a6] text-white rounded-md font-semibold cursor-pointer whitespace-nowrap hover:bg-[#7f8c8d]`}
        >
          メイン画面に戻る
        </button>
      </header>

      {/* Main Content: 2カラム */}
      <main className={`flex-1 ${isMobile ? 'p-4' : isTablet ? 'p-5' : 'p-6'} overflow-y-auto`}>
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-6'} items-start`}>
          {renderDeptTable()}
          {renderRoomTable()}
        </div>
      </main>

      <footer className="py-3 text-center text-xs text-[#9ca3af]">
        &copy;Copyright 2024 SHIP HEALTHCARE HOLDINGS, INC.
      </footer>

      {/* 部署マスタ: 新規作成モーダル */}
      {showNewDeptModal && renderModal(
        '新規部署マスタ作成',
        [
          { label: '部門', value: deptFormData.division, onChange: (v) => setDeptFormData({ ...deptFormData, division: v }), placeholder: '診療部門' },
          { label: '部署', value: deptFormData.department, onChange: (v) => setDeptFormData({ ...deptFormData, department: v }), placeholder: '外科' },
        ],
        handleNewDeptSubmit,
        () => setShowNewDeptModal(false),
        '作成',
        '#27ae60',
      )}

      {/* 部署マスタ: 編集モーダル */}
      {showEditDeptModal && renderModal(
        '部署マスタ編集',
        [
          { label: '部門', value: deptFormData.division, onChange: (v) => setDeptFormData({ ...deptFormData, division: v }), placeholder: '診療部門' },
          { label: '部署', value: deptFormData.department, onChange: (v) => setDeptFormData({ ...deptFormData, department: v }), placeholder: '外科' },
        ],
        handleEditDeptSubmit,
        () => { setShowEditDeptModal(false); setSelectedDepartment(null); },
        '更新',
        '#374151',
      )}

      {/* 諸室区分マスタ: 新規作成モーダル */}
      {showNewRoomModal && renderModal(
        '新規諸室区分マスタ作成',
        [
          { label: '諸室区分①', value: roomFormData.roomCategory1, onChange: (v) => setRoomFormData({ ...roomFormData, roomCategory1: v }), placeholder: '手術室' },
          { label: '諸室区分②', value: roomFormData.roomCategory2, onChange: (v) => setRoomFormData({ ...roomFormData, roomCategory2: v }), placeholder: 'オペ室1' },
        ],
        handleNewRoomSubmit,
        () => setShowNewRoomModal(false),
        '作成',
        '#8e44ad',
      )}

      {/* 諸室区分マスタ: 編集モーダル */}
      {showEditRoomModal && renderModal(
        '諸室区分マスタ編集',
        [
          { label: '諸室区分①', value: roomFormData.roomCategory1, onChange: (v) => setRoomFormData({ ...roomFormData, roomCategory1: v }), placeholder: '手術室' },
          { label: '諸室区分②', value: roomFormData.roomCategory2, onChange: (v) => setRoomFormData({ ...roomFormData, roomCategory2: v }), placeholder: 'オペ室1' },
        ],
        handleEditRoomSubmit,
        () => { setShowEditRoomModal(false); setSelectedRoomCategory(null); },
        '更新',
        '#374151',
      )}
    </div>
  );
}
