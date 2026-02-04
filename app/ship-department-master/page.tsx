'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useMasterStore } from '@/lib/stores/masterStore';
import { DepartmentMaster } from '@/lib/types/master';

export default function ShipDepartmentMasterPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const { departments, addDepartment, updateDepartment, deleteDepartment } = useMasterStore();

  const [filterDivision, setFilterDivision] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterRoomCategory1, setFilterRoomCategory1] = useState('');
  const [filterRoomCategory2, setFilterRoomCategory2] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentMaster | null>(null);
  const [formData, setFormData] = useState({
    division: '',
    department: '',
    roomCategory1: '',
    roomCategory2: '',
  });

  // フィルタリング処理
  const filteredDepartments = departments.filter((dept) => {
    const matchDivision = !filterDivision || dept.division.includes(filterDivision);
    const matchDepartment = !filterDepartment || dept.department.includes(filterDepartment);
    const matchRoomCategory1 = !filterRoomCategory1 || dept.roomCategory1.includes(filterRoomCategory1);
    const matchRoomCategory2 = !filterRoomCategory2 || dept.roomCategory2.includes(filterRoomCategory2);
    return matchDivision && matchDepartment && matchRoomCategory1 && matchRoomCategory2;
  });

  const handleBack = () => {
    router.push('/main');
  };

  const handleEdit = (dept: DepartmentMaster) => {
    setSelectedDepartment(dept);
    setFormData({
      division: dept.division,
      department: dept.department,
      roomCategory1: dept.roomCategory1,
      roomCategory2: dept.roomCategory2,
    });
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('この部署マスタを削除してもよろしいですか?')) {
      deleteDepartment(id);
    }
  };

  const handleNewSubmit = () => {
    const newDepartment: DepartmentMaster = {
      id: `DEPT${String(departments.length + 1).padStart(3, '0')}`,
      division: formData.division,
      department: formData.department,
      roomCategory1: formData.roomCategory1,
      roomCategory2: formData.roomCategory2,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addDepartment(newDepartment);
    setShowNewModal(false);
    setFormData({ division: '', department: '', roomCategory1: '', roomCategory2: '' });
  };

  const handleEditSubmit = () => {
    if (selectedDepartment) {
      updateDepartment(selectedDepartment.id, formData);
      setShowEditModal(false);
      setSelectedDepartment(null);
      setFormData({ division: '', department: '', roomCategory1: '', roomCategory2: '' });
    }
  };

  const openNewModal = () => {
    setFormData({ division: '', department: '', roomCategory1: '', roomCategory2: '' });
    setShowNewModal(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        color: 'white',
        padding: isMobile ? '12px 16px' : isTablet ? '14px 20px' : '16px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: isMobile ? '12px' : '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #27ae60, #229954)',
              padding: isMobile ? '6px 10px' : '8px 12px',
              borderRadius: '6px',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: 700,
              letterSpacing: '1px'
            }}>
              SHIP
            </div>
            <h1 style={{ fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px', fontWeight: 600, margin: 0 }}>
              SHIP部署マスタ
            </h1>
          </div>
          <div style={{
            background: '#34495e',
            color: '#ffffff',
            padding: isMobile ? '4px 12px' : '6px 16px',
            borderRadius: '20px',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: 600
          }}>
            {filteredDepartments.length}件
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={openNewModal}
            style={{
              padding: isMobile ? '8px 16px' : '10px 20px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            新規作成
          </button>
          <button
            onClick={handleBack}
            style={{
              padding: isMobile ? '8px 16px' : '10px 20px',
              background: '#7f8c8d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            メイン画面に戻る
          </button>
        </div>
      </header>

      {/* Filter Header */}
      <div style={{
        background: 'white',
        padding: isMobile ? '12px 16px' : isTablet ? '16px 20px' : '20px 24px',
        borderBottom: '2px solid #e0e0e0',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: isMobile ? '12px' : '16px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>
            部門
          </label>
          <input
            type="text"
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            placeholder="診療部門"
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>
            部署
          </label>
          <input
            type="text"
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            placeholder="外科"
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>
            諸室区分①
          </label>
          <input
            type="text"
            value={filterRoomCategory1}
            onChange={(e) => setFilterRoomCategory1(e.target.value)}
            placeholder="手術室"
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>
            諸室区分②
          </label>
          <input
            type="text"
            value={filterRoomCategory2}
            onChange={(e) => setFilterRoomCategory2(e.target.value)}
            placeholder="オペ室1"
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, padding: isMobile ? '16px' : isTablet ? '20px' : '24px', overflowY: 'auto' }}>
        {isMobile ? (
          // カード表示 (モバイル)
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredDepartments.map((dept) => (
              <div key={dept.id} style={{
                background: 'white',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#2c3e50', marginBottom: '4px' }}>
                    {dept.department}
                  </div>
                  <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                    {dept.division}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div><span style={{ color: '#7f8c8d' }}>諸室区分①:</span> {dept.roomCategory1}</div>
                  <div><span style={{ color: '#7f8c8d' }}>諸室区分②:</span> {dept.roomCategory2}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleEdit(dept)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // テーブル表示 (PC/タブレット)
          <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <tr>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>部門</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>部署</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>諸室区分①</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>諸室区分②</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'center', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.map((dept, index) => (
                    <tr key={dept.id} style={{ borderBottom: '1px solid #f0f0f0', background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50' }}>{dept.division}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50' }}>{dept.department}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50' }}>{dept.roomCategory1}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50' }}>{dept.roomCategory2}</td>
                      <td style={{ padding: isTablet ? '12px' : '14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEdit(dept)}
                            style={{
                              padding: '6px 12px',
                              background: '#3498db',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: isTablet ? '12px' : '13px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(dept.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: isTablet ? '12px' : '13px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredDepartments.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: isMobile ? '40px 20px' : '60px 40px',
            textAlign: 'center',
            color: '#7f8c8d',
            fontSize: isMobile ? '14px' : '16px'
          }}>
            検索条件に一致する部署マスタがありません
          </div>
        )}
      </main>

      {/* 新規作成モーダル */}
      {showNewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: isMobile ? '90%' : '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#2c3e50' }}>新規部署マスタ作成</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>部門</label>
                <input
                  type="text"
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  placeholder="診療部門"
                  style={{ width: '100%', padding: '10px', border: '1px solid #d0d0d0', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>部署</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="外科"
                  style={{ width: '100%', padding: '10px', border: '1px solid #d0d0d0', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>諸室区分①</label>
                <input
                  type="text"
                  value={formData.roomCategory1}
                  onChange={(e) => setFormData({ ...formData, roomCategory1: e.target.value })}
                  placeholder="手術室"
                  style={{ width: '100%', padding: '10px', border: '1px solid #d0d0d0', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>諸室区分②</label>
                <input
                  type="text"
                  value={formData.roomCategory2}
                  onChange={(e) => setFormData({ ...formData, roomCategory2: e.target.value })}
                  placeholder="オペ室1"
                  style={{ width: '100%', padding: '10px', border: '1px solid #d0d0d0', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowNewModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#7f8c8d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleNewSubmit}
                style={{
                  padding: '10px 20px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: isMobile ? '90%' : '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#2c3e50' }}>部署マスタ編集</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>部門</label>
                <input
                  type="text"
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d0d0d0', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>部署</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d0d0d0', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>諸室区分①</label>
                <input
                  type="text"
                  value={formData.roomCategory1}
                  onChange={(e) => setFormData({ ...formData, roomCategory1: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d0d0d0', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>諸室区分②</label>
                <input
                  type="text"
                  value={formData.roomCategory2}
                  onChange={(e) => setFormData({ ...formData, roomCategory2: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d0d0d0', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedDepartment(null);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#7f8c8d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleEditSubmit}
                style={{
                  padding: '10px 20px',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                更新
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
