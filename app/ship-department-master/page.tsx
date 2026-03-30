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

  // --- 共通スタイル ---
  const sectionHeaderStyle = (color: string) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isMobile ? '12px 16px' : '16px 20px',
    background: color,
    borderRadius: '8px 8px 0 0',
  });

  const badgeStyle = {
    background: 'rgba(255,255,255,0.2)',
    color: '#ffffff',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600 as const,
  };

  const createBtnStyle = {
    padding: isMobile ? '6px 12px' : '8px 16px',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: '6px',
    fontSize: isMobile ? '12px' : '13px',
    fontWeight: 600 as const,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  };

  const filterStyle = {
    width: '100%',
    padding: isMobile ? '8px' : '10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: isMobile ? '13px' : '14px',
  };

  const thStyle = {
    padding: isTablet ? '12px' : '14px',
    textAlign: 'left' as const,
    fontSize: isTablet ? '13px' : '14px',
    fontWeight: 600 as const,
    color: '#1f2937',
  };

  const tdStyle = {
    padding: isTablet ? '12px' : '14px',
    fontSize: isTablet ? '13px' : '14px',
    color: '#1f2937',
  };

  const editBtnStyle = {
    padding: '6px 12px',
    background: '#374151',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: isTablet ? '12px' : '13px',
    fontWeight: 600 as const,
    cursor: 'pointer',
  };

  const deleteBtnStyle = {
    padding: '6px 12px',
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: isTablet ? '12px' : '13px',
    fontWeight: 600 as const,
    cursor: 'pointer',
  };

  // --- モーダル共通レンダラー ---
  const renderModal = (
    title: string,
    fields: { label: string; value: string; onChange: (v: string) => void; placeholder: string }[],
    onSubmit: () => void,
    onCancel: () => void,
    submitLabel: string,
    submitColor: string,
  ) => (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', padding: '24px',
        width: isMobile ? '90%' : '500px', maxHeight: '80vh', overflowY: 'auto',
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#1f2937' }}>{title}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {fields.map((f) => (
            <div key={f.label}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1f2937' }}>{f.label}</label>
              <input
                type="text"
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                placeholder={f.placeholder}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            キャンセル
          </button>
          <button
            onClick={onSubmit}
            style={{ padding: '10px 20px', background: submitColor, color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );

  // --- 左テーブル: 部署マスタ レンダリング ---
  const renderDeptTable = () => (
    <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={sectionHeaderStyle('#374151')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? '15px' : '16px', fontWeight: 600, color: 'white' }}>部署マスタ</h2>
          <span style={badgeStyle}>{filteredDepartments.length}件</span>
        </div>
        <button onClick={() => { setDeptFormData({ division: '', department: '' }); setShowNewDeptModal(true); }} style={createBtnStyle}>
          新規作成
        </button>
      </div>

      {/* フィルター */}
      <div style={{ padding: isMobile ? '12px 16px' : '16px 20px', borderBottom: '1px solid #e0e0e0', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#1f2937' }}>部門</label>
          <input type="text" value={filterDivision} onChange={(e) => setFilterDivision(e.target.value)} placeholder="診療部門" style={filterStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#1f2937' }}>部署</label>
          <input type="text" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} placeholder="外科" style={filterStyle} />
        </div>
      </div>

      {/* テーブル / カード */}
      {isMobile ? (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredDepartments.map((dept) => (
            <div key={dept.id} style={{ background: '#fafafa', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>{dept.department}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>{dept.division}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEditDept(dept)} style={{ ...editBtnStyle, flex: 1, padding: '8px' }}>編集</button>
                <button onClick={() => handleDeleteDept(dept.id)} style={{ ...deleteBtnStyle, flex: 1, padding: '8px' }}>削除</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={thStyle}>部門</th>
                <th style={thStyle}>部署</th>
                <th style={{ ...thStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.map((dept, index) => (
                <tr key={dept.id} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                  <td style={tdStyle}>{dept.division}</td>
                  <td style={tdStyle}>{dept.department}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button onClick={() => handleEditDept(dept)} style={editBtnStyle}>編集</button>
                      <button onClick={() => handleDeleteDept(dept.id)} style={deleteBtnStyle}>削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredDepartments.length === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
          検索条件に一致する部署マスタがありません
        </div>
      )}
    </div>
  );

  // --- 右テーブル: 諸室区分マスタ レンダリング ---
  const renderRoomTable = () => (
    <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={sectionHeaderStyle('#374151')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? '15px' : '16px', fontWeight: 600, color: 'white' }}>諸室区分マスタ</h2>
          <span style={badgeStyle}>{filteredRoomCategories.length}件</span>
        </div>
        <button onClick={() => { setRoomFormData({ roomCategory1: '', roomCategory2: '' }); setShowNewRoomModal(true); }} style={createBtnStyle}>
          新規作成
        </button>
      </div>

      {/* フィルター */}
      <div style={{ padding: isMobile ? '12px 16px' : '16px 20px', borderBottom: '1px solid #e0e0e0', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#1f2937' }}>諸室区分①</label>
          <input type="text" value={filterRoomCategory1} onChange={(e) => setFilterRoomCategory1(e.target.value)} placeholder="手術室" style={filterStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#1f2937' }}>諸室区分②</label>
          <input type="text" value={filterRoomCategory2} onChange={(e) => setFilterRoomCategory2(e.target.value)} placeholder="オペ室1" style={filterStyle} />
        </div>
      </div>

      {/* テーブル / カード */}
      {isMobile ? (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredRoomCategories.map((rc) => (
            <div key={rc.id} style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>{rc.roomCategory1}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>{rc.roomCategory2}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEditRoom(rc)} style={{ ...editBtnStyle, flex: 1, padding: '8px' }}>編集</button>
                <button onClick={() => handleDeleteRoom(rc.id)} style={{ ...deleteBtnStyle, flex: 1, padding: '8px' }}>削除</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ ...thStyle, color: '#1f2937' }}>諸室区分①</th>
                <th style={{ ...thStyle, color: '#1f2937' }}>諸室区分②</th>
                <th style={{ ...thStyle, textAlign: 'center', whiteSpace: 'nowrap', color: '#1f2937' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoomCategories.map((rc, index) => (
                <tr key={rc.id} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                  <td style={tdStyle}>{rc.roomCategory1}</td>
                  <td style={tdStyle}>{rc.roomCategory2}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button onClick={() => handleEditRoom(rc)} style={editBtnStyle}>編集</button>
                      <button onClick={() => handleDeleteRoom(rc.id)} style={deleteBtnStyle}>削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredRoomCategories.length === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
          検索条件に一致する諸室区分マスタがありません
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: isMobile ? '12px 16px' : isTablet ? '14px 20px' : '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: isMobile ? '12px' : '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', flex: 1 }}>
          <h1 style={{ fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
            SHIP部署マスタ
          </h1>
        </div>
        <button
          onClick={handleBack}
          style={{
            padding: isMobile ? '8px 16px' : '10px 20px',
            background: '#e5e7eb',
            color: '#374151',
            border: 'none',
            borderRadius: '6px',
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          メイン画面に戻る
        </button>
      </header>

      {/* Main Content: 2カラム */}
      <main style={{ flex: 1, padding: isMobile ? '16px' : isTablet ? '20px' : '24px', overflowY: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '16px' : '24px',
          alignItems: 'start',
        }}>
          {renderDeptTable()}
          {renderRoomTable()}
        </div>
      </main>

      <footer style={{ padding: '12px 0', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
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
