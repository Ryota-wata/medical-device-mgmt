'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useUserStore } from '@/lib/stores/userStore';
import { useMasterStore } from '@/lib/stores/masterStore';
import { User, UserRole } from '@/lib/types/user';

// ロール表示名
const ROLE_LABELS: Record<UserRole, string> = {
  consultant: 'コンサル',
  sales: '営業',
  medical_office: '医療事務',
  medical_clinical: '医療臨床',
};

// ロールバッジカラー
const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  consultant: { bg: '#9b59b6', text: 'white' },
  sales: { bg: '#3498db', text: 'white' },
  medical_office: { bg: '#27ae60', text: 'white' },
  medical_clinical: { bg: '#e67e22', text: 'white' },
};

export default function UserManagementPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const { users, setUsers, addUser, updateUser, deleteUser } = useUserStore();
  const { facilities } = useMasterStore();

  const [filterUsername, setFilterUsername] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterHospital, setFilterHospital] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // フォーム状態
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    hospital: '',
    role: 'medical_office' as UserRole,
  });

  // サンプルデータを初期化
  useEffect(() => {
    if (users.length === 0) {
      const sampleUsers: User[] = [
        {
          id: 'U001',
          username: '山田太郎',
          email: 'yamada@example.com',
          hospital: 'サンプル病院',
          role: 'consultant',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'U002',
          username: '鈴木花子',
          email: 'suzuki@hospital.example.com',
          hospital: '中央医療センター',
          role: 'sales',
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'U003',
          username: '田中一郎',
          email: 'tanaka@example.com',
          hospital: 'サンプル病院',
          role: 'medical_office',
          createdAt: '2024-02-01T00:00:00Z',
          updatedAt: '2024-02-01T00:00:00Z'
        },
        {
          id: 'U004',
          username: '佐藤美咲',
          email: 'sato@hospital.example.com',
          hospital: '東京総合病院',
          role: 'medical_clinical',
          createdAt: '2024-02-15T00:00:00Z',
          updatedAt: '2024-02-15T00:00:00Z'
        },
        {
          id: 'U005',
          username: '高橋健二',
          email: 'takahashi@example.com',
          hospital: '中央医療センター',
          role: 'medical_office',
          createdAt: '2024-03-01T00:00:00Z',
          updatedAt: '2024-03-01T00:00:00Z'
        }
      ];
      setUsers(sampleUsers);
    }
  }, [users.length, setUsers]);

  // フィルタリング処理
  const filteredUsers = users.filter((user) => {
    const matchUsername = !filterUsername || user.username.toLowerCase().includes(filterUsername.toLowerCase());
    const matchEmail = !filterEmail || user.email.toLowerCase().includes(filterEmail.toLowerCase());
    const matchHospital = !filterHospital || (user.hospital?.toLowerCase().includes(filterHospital.toLowerCase()) ?? false);
    const matchRole = !filterRole || user.role === filterRole;
    return matchUsername && matchEmail && matchHospital && matchRole;
  });

  // 病院オプション（ユニーク）
  const hospitalOptions = Array.from(new Set(users.map(u => u.hospital).filter(Boolean))) as string[];

  const handleBack = () => {
    router.push('/main');
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      hospital: user.hospital || '',
      role: user.role,
    });
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('このユーザーを削除してもよろしいですか?')) {
      deleteUser(id);
    }
  };

  const handleOpenNewModal = () => {
    setFormData({
      username: '',
      email: '',
      hospital: '',
      role: 'medical_office',
    });
    setShowNewModal(true);
  };

  const handleNewSubmit = () => {
    if (!formData.username || !formData.email) {
      alert('ユーザー名とメールアドレスは必須です');
      return;
    }

    const newUser: User = {
      id: `U${String(users.length + 1).padStart(3, '0')}`,
      username: formData.username,
      email: formData.email,
      hospital: formData.hospital,
      role: formData.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addUser(newUser);
    setShowNewModal(false);
  };

  const handleEditSubmit = () => {
    if (!selectedUser) return;
    if (!formData.username || !formData.email) {
      alert('ユーザー名とメールアドレスは必須です');
      return;
    }

    updateUser(selectedUser.id, {
      username: formData.username,
      email: formData.email,
      hospital: formData.hospital,
      role: formData.role,
    });
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const renderModal = (isEdit: boolean) => {
    const isOpen = isEdit ? showEditModal : showNewModal;
    if (!isOpen) return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={() => isEdit ? setShowEditModal(false) : setShowNewModal(false)}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: '20px',
              borderBottom: '1px solid #dee2e6',
              background: '#f8f9fa',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '18px', color: '#2c3e50' }}>
              {isEdit ? 'ユーザー編集' : 'ユーザー新規作成'}
            </h2>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#2c3e50', fontSize: '13px' }}>
                ユーザー名 <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#2c3e50', fontSize: '13px' }}>
                メールアドレス <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#2c3e50', fontSize: '13px' }}>
                所属病院
              </label>
              <input
                type="text"
                value={formData.hospital}
                onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                placeholder="所属病院を入力"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#2c3e50', fontSize: '13px' }}>
                ロール
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="consultant">コンサル</option>
                <option value="sales">営業</option>
                <option value="medical_office">医療事務</option>
                <option value="medical_clinical">医療臨床</option>
              </select>
            </div>
          </div>

          <div
            style={{
              padding: '15px 20px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              onClick={() => isEdit ? setShowEditModal(false) : setShowNewModal(false)}
              style={{
                padding: '10px 20px',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              キャンセル
            </button>
            <button
              onClick={isEdit ? handleEditSubmit : handleNewSubmit}
              style={{
                padding: '10px 20px',
                background: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {isEdit ? '更新' : '作成'}
            </button>
          </div>
        </div>
      </div>
    );
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
              ユーザー管理
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
            {filteredUsers.length}件
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleOpenNewModal}
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
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: isMobile ? '12px' : '16px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>
            ユーザー名
          </label>
          <input
            type="text"
            value={filterUsername}
            onChange={(e) => setFilterUsername(e.target.value)}
            placeholder="ユーザー名で検索"
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
            メールアドレス
          </label>
          <input
            type="text"
            value={filterEmail}
            onChange={(e) => setFilterEmail(e.target.value)}
            placeholder="メールで検索"
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
            所属病院
          </label>
          <input
            type="text"
            value={filterHospital}
            onChange={(e) => setFilterHospital(e.target.value)}
            placeholder="病院名で検索"
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
            ロール
          </label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px'
            }}
          >
            <option value="">すべて</option>
            <option value="consultant">コンサル</option>
            <option value="sales">営業</option>
            <option value="medical_office">医療事務</option>
            <option value="medical_clinical">医療臨床</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, padding: isMobile ? '16px' : isTablet ? '20px' : '24px', overflowY: 'auto' }}>
        {isMobile ? (
          // カード表示 (モバイル)
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredUsers.map((user) => {
              const roleColor = ROLE_COLORS[user.role];
              return (
                <div key={user.id} style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#2c3e50' }}>
                        {user.username}
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: roleColor.bg,
                        color: roleColor.text,
                      }}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                      {user.email}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div><span style={{ color: '#7f8c8d' }}>所属病院:</span> {user.hospital || '-'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      onClick={() => handleEdit(user)}
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
                      onClick={() => handleDelete(user.id)}
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
              );
            })}
          </div>
        ) : (
          // テーブル表示 (PC/タブレット)
          <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <tr>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>ユーザー名</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>メールアドレス</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>所属病院</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'center', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>ロール</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'center', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => {
                    const roleColor = ROLE_COLORS[user.role];
                    return (
                      <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0', background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50', fontWeight: 500 }}>{user.username}</td>
                        <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50' }}>{user.email}</td>
                        <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '13px' : '14px', color: '#2c3e50' }}>{user.hospital || '-'}</td>
                        <td style={{ padding: isTablet ? '12px' : '14px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: roleColor.bg,
                            color: roleColor.text,
                          }}>
                            {ROLE_LABELS[user.role]}
                          </span>
                        </td>
                        <td style={{ padding: isTablet ? '12px' : '14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEdit(user)}
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
                              onClick={() => handleDelete(user.id)}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredUsers.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: isMobile ? '40px 20px' : '60px 40px',
            textAlign: 'center',
            color: '#7f8c8d',
            fontSize: isMobile ? '14px' : '16px'
          }}>
            検索条件に一致するユーザーがいません
          </div>
        )}
      </main>

      {/* モーダル */}
      {renderModal(false)}
      {renderModal(true)}
    </div>
  );
}
