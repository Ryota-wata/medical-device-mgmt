'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useUserStore } from '@/lib/stores/userStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { useMasterStore } from '@/lib/stores/masterStore';
import { User, UserRole, USER_ROLE_LABELS, isShipRole } from '@/lib/types/user';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

// ロールバッジカラー
const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  admin: { bg: '#e74c3c', text: 'white' },
  consultant: { bg: '#9b59b6', text: 'white' },
  sales: { bg: '#3498db', text: 'white' },
  office_admin: { bg: '#27ae60', text: 'white' },
  office_staff: { bg: '#2ecc71', text: 'white' },
  clinical_staff: { bg: '#e67e22', text: 'white' },
};

export default function UserManagementPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const { users, setUsers, addUser, updateUser, deleteUser } = useUserStore();
  const { user: currentUser } = useAuthStore();
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
    role: 'office_staff' as UserRole,
    accessibleFacilities: [] as string[],
  });

  // ログインユーザーがSHIP側（システム管理者/コンサル/営業）かどうか
  const isShipUser = currentUser ? isShipRole(currentUser.role) : false;
  // ログインユーザーの所属施設
  const currentUserHospital = currentUser?.hospital;

  // 施設マスタから施設名リストを生成
  const facilityOptions = useMemo(() => {
    return facilities.map(f => f.facilityName);
  }, [facilities]);

  // 施設検索用の一時state
  const [facilitySearchQuery, setFacilitySearchQuery] = useState('');

  // サンプルデータを初期化
  useEffect(() => {
    if (users.length === 0) {
      const sampleUsers: User[] = [
        {
          id: 'U001',
          username: '管理者太郎',
          email: 'admin@ship.com',
          hospital: undefined,
          role: 'admin',
          accessibleFacilities: ['全施設'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'U002',
          username: '山田花子',
          email: 'consultant@ship.com',
          hospital: undefined,
          role: 'consultant',
          accessibleFacilities: ['東京中央病院', '横浜総合病院', '千葉医療センター'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'U003',
          username: '鈴木一郎',
          email: 'sales@ship.com',
          hospital: undefined,
          role: 'sales',
          accessibleFacilities: ['東京中央病院', '横浜総合病院'],
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'U004',
          username: '佐藤美智子',
          email: 'office-admin@hospital.com',
          hospital: '東京中央病院',
          role: 'office_admin',
          accessibleFacilities: [],
          createdAt: '2024-02-01T00:00:00Z',
          updatedAt: '2024-02-01T00:00:00Z'
        },
        {
          id: 'U005',
          username: '高橋健二',
          email: 'office@hospital.com',
          hospital: '東京中央病院',
          role: 'office_staff',
          accessibleFacilities: [],
          createdAt: '2024-02-15T00:00:00Z',
          updatedAt: '2024-02-15T00:00:00Z'
        },
        {
          id: 'U006',
          username: '田中花子',
          email: 'user@hospital.com',
          hospital: '東京中央病院',
          role: 'clinical_staff',
          accessibleFacilities: [],
          createdAt: '2024-03-01T00:00:00Z',
          updatedAt: '2024-03-01T00:00:00Z'
        }
      ];
      setUsers(sampleUsers);
    }
  }, [users.length, setUsers]);

  // ユーザー一覧のフィルタリング
  const filteredUsers = useMemo(() => {
    let result = users;

    // 病院ユーザーの場合、同一施設のユーザーのみ表示
    if (!isShipUser && currentUserHospital) {
      result = result.filter(user => user.hospital === currentUserHospital);
    }

    // 検索フィルター適用
    return result.filter((user) => {
      const matchUsername = !filterUsername || user.username.toLowerCase().includes(filterUsername.toLowerCase());
      const matchEmail = !filterEmail || user.email.toLowerCase().includes(filterEmail.toLowerCase());
      const matchHospital = !filterHospital || (user.hospital?.toLowerCase().includes(filterHospital.toLowerCase()) ?? false);
      const matchRole = !filterRole || user.role === filterRole;
      return matchUsername && matchEmail && matchHospital && matchRole;
    });
  }, [users, isShipUser, currentUserHospital, filterUsername, filterEmail, filterHospital, filterRole]);

  // 施設オプション（ユニーク）
  const hospitalOptions = useMemo(() => {
    return Array.from(new Set(users.map(u => u.hospital).filter(Boolean))) as string[];
  }, [users]);

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
      accessibleFacilities: user.accessibleFacilities || [],
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
      hospital: isShipUser ? '' : (currentUserHospital || ''),
      role: 'office_staff',
      accessibleFacilities: [],
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
      hospital: isShipRole(formData.role) ? undefined : formData.hospital,
      role: formData.role,
      accessibleFacilities: formData.accessibleFacilities,
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
      hospital: isShipRole(formData.role) ? undefined : formData.hospital,
      role: formData.role,
      accessibleFacilities: formData.accessibleFacilities,
    });
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const addFacility = (facilityName: string) => {
    if (!facilityName) return;
    setFormData(prev => {
      const current = prev.accessibleFacilities || [];
      if (current.includes(facilityName)) {
        return prev; // 既に追加済み
      }
      return { ...prev, accessibleFacilities: [...current, facilityName] };
    });
    setFacilitySearchQuery(''); // 選択後にクリア
  };

  const removeFacility = (facilityName: string) => {
    setFormData(prev => ({
      ...prev,
      accessibleFacilities: (prev.accessibleFacilities || []).filter(f => f !== facilityName)
    }));
  };

  // アクセス可能施設の表示用テキスト
  const getAccessibleFacilitiesText = (user: User): string => {
    // SHIP側（admin/consultant/sales）: 担当施設
    if (isShipRole(user.role)) {
      const facilities = user.accessibleFacilities || [];
      return facilities.length > 0 ? facilities.join(', ') : '未設定';
    }
    // 事務管理者/事務担当者: 自施設 + 閲覧可能施設
    if (user.role === 'office_admin' || user.role === 'office_staff') {
      const ownFacility = user.hospital ? [user.hospital] : [];
      const otherFacilities = user.accessibleFacilities || [];
      const all = [...ownFacility, ...otherFacilities.filter(f => f !== user.hospital)];
      return all.length > 0 ? all.join(', ') : '-';
    }
    // 臨床スタッフ: 自施設のみ
    if (user.role === 'clinical_staff') {
      return user.hospital || '-';
    }
    return '-';
  };

  const renderModal = (isEdit: boolean) => {
    const isOpen = isEdit ? showEditModal : showNewModal;
    if (!isOpen) return null;

    const isShipRoleSelected = isShipRole(formData.role);
    const isOfficeRole = formData.role === 'office_admin' || formData.role === 'office_staff';
    const isClinicalRole = formData.role === 'clinical_staff';

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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: '20px',
              borderBottom: '1px solid #dee2e6',
              background: '#f8f9fa',
              position: 'sticky',
              top: 0,
            }}
          >
            <h2 style={{ margin: 0, fontSize: '18px', color: '#2c3e50' }}>
              {isEdit ? 'ユーザー編集' : 'ユーザー新規作成'}
            </h2>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 基本情報 */}
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
                  boxSizing: 'border-box',
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
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#2c3e50', fontSize: '13px' }}>
                ロール
              </label>
              <select
                value={formData.role}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  setFormData({
                    ...formData,
                    role: newRole,
                    // ロール変更時にアクセス可能施設をリセット
                    accessibleFacilities: [],
                    // SHIP側ロールの場合は所属施設をクリア
                    hospital: isShipRole(newRole) ? '' : formData.hospital,
                  });
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="admin">システム管理者</option>
                <option value="consultant">コンサル</option>
                <option value="sales">営業</option>
                <option value="office_admin">事務管理者</option>
                <option value="office_staff">事務担当者</option>
                <option value="clinical_staff">臨床スタッフ</option>
              </select>
            </div>

            {/* 所属施設（病院側ロールのみ） */}
            {!isShipRoleSelected && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#2c3e50', fontSize: '13px' }}>
                  所属施設 <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <SearchableSelect
                  value={formData.hospital}
                  onChange={(value) => {
                    setFormData({
                      ...formData,
                      hospital: value,
                      // 所属施設変更時、アクセス可能施設から自施設を除外
                      accessibleFacilities: formData.accessibleFacilities.filter(f => f !== value),
                    });
                  }}
                  options={facilityOptions}
                  placeholder="施設名を検索..."
                  isMobile={isMobile}
                />
              </div>
            )}

            {/* 施設アクセス設定セクション */}
            <div style={{
              marginTop: '8px',
              padding: '16px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
            }}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  background: ROLE_COLORS[formData.role].bg,
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '11px',
                  textAlign: 'center',
                  lineHeight: '20px',
                }}>
                  {formData.role === 'admin' ? 'A' : formData.role === 'consultant' ? 'C' : formData.role === 'sales' ? 'S' : formData.role === 'office_admin' ? 'M' : formData.role === 'office_staff' ? 'O' : 'L'}
                </span>
                施設アクセス設定（{USER_ROLE_LABELS[formData.role]}）
              </h3>

              {/* SHIP側ロール: 担当施設 */}
              {isShipRoleSelected && (
                <div>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                    担当施設を検索して追加してください（複数選択可）
                  </p>
                  <SearchableSelect
                    value={facilitySearchQuery}
                    onChange={setFacilitySearchQuery}
                    onSelect={(value) => addFacility(value)}
                    options={facilityOptions.filter(f => !formData.accessibleFacilities.includes(f))}
                    placeholder="施設名を検索して追加..."
                    isMobile={isMobile}
                  />
                  {/* 選択済み施設タグ */}
                  {formData.accessibleFacilities.length > 0 && (
                    <div style={{
                      marginTop: '12px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}>
                      {formData.accessibleFacilities.map((facility, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 10px',
                            background: '#e8f4fd',
                            border: '1px solid #3498db',
                            borderRadius: '16px',
                            fontSize: '13px',
                            color: '#2c3e50',
                          }}
                        >
                          <span>{facility}</span>
                          <button
                            type="button"
                            onClick={() => removeFacility(facility)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0',
                              fontSize: '14px',
                              color: '#e74c3c',
                              lineHeight: 1,
                            }}
                            aria-label={`${facility}を削除`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: '12px', color: '#27ae60', marginTop: '12px', fontWeight: 600 }}>
                    選択中: {formData.accessibleFacilities.length} 施設
                  </p>
                </div>
              )}

              {/* 事務管理者/事務担当者: 閲覧可能な他施設 */}
              {isOfficeRole && (
                <div>
                  <div style={{
                    padding: '10px 12px',
                    background: '#e8f5e9',
                    borderRadius: '4px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: '#2e7d32',
                  }}>
                    <strong>自施設（{formData.hospital || '未設定'}）</strong>の資産は自動的にアクセス可能です
                  </div>
                  {formData.hospital ? (
                    <>
                      <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                        他施設の閲覧権限を検索して追加（任意）:
                      </p>
                      <SearchableSelect
                        value={facilitySearchQuery}
                        onChange={setFacilitySearchQuery}
                        onSelect={(value) => addFacility(value)}
                        options={facilityOptions.filter(f => f !== formData.hospital && !formData.accessibleFacilities.includes(f))}
                        placeholder="施設名を検索して追加..."
                        isMobile={isMobile}
                      />
                      {/* 選択済み施設タグ */}
                      {formData.accessibleFacilities.length > 0 && (
                        <div style={{
                          marginTop: '12px',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}>
                          {formData.accessibleFacilities.map((facility, index) => (
                            <div
                              key={index}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 10px',
                                background: '#fff3e0',
                                border: '1px solid #e67e22',
                                borderRadius: '16px',
                                fontSize: '13px',
                                color: '#2c3e50',
                              }}
                            >
                              <span>{facility}</span>
                              <span style={{ fontSize: '10px', color: '#e67e22' }}>閲覧のみ</span>
                              <button
                                type="button"
                                onClick={() => removeFacility(facility)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '0',
                                  fontSize: '14px',
                                  color: '#e74c3c',
                                  lineHeight: 1,
                                }}
                                aria-label={`${facility}を削除`}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '8px' }}>
                        ※ 他施設は閲覧のみ（編集不可）
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#e74c3c' }}>
                      ※ 先に所属施設を選択してください
                    </p>
                  )}
                </div>
              )}

              {/* 臨床スタッフ: 自施設のみ */}
              {isClinicalRole && (
                <div>
                  <div style={{
                    padding: '10px 12px',
                    background: '#fff3e0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#e65100',
                  }}>
                    <strong>所属施設（{formData.hospital || '未設定'}）</strong>の資産のみアクセス可能です
                  </div>
                  <p style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '8px' }}>
                    ※ 臨床スタッフは自施設のみのアクセスに制限されています
                  </p>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              padding: '15px 20px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              position: 'sticky',
              bottom: 0,
              background: 'white',
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#f5f5f5' }}>
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
          {/* 病院ユーザーの場合、所属施設を表示 */}
          {!isShipUser && currentUserHospital && (
            <div style={{
              background: '#27ae60',
              color: 'white',
              padding: isMobile ? '4px 12px' : '6px 16px',
              borderRadius: '20px',
              fontSize: isMobile ? '11px' : '12px',
              fontWeight: 600
            }}>
              {currentUserHospital}
            </div>
          )}
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
        gridTemplateColumns: isMobile ? '1fr' : isShipUser ? 'repeat(auto-fit, minmax(180px, 1fr))' : 'repeat(auto-fit, minmax(200px, 1fr))',
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
              fontSize: isMobile ? '13px' : '14px',
              boxSizing: 'border-box',
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
              fontSize: isMobile ? '13px' : '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        {/* 施設フィルター: コンサルユーザーのみ表示 */}
        {isShipUser && (
          <div>
            <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#2c3e50' }}>
              所属施設
            </label>
            <SearchableSelect
              value={filterHospital}
              onChange={setFilterHospital}
              options={['', ...facilityOptions]}
              placeholder="施設名で検索..."
              isMobile={isMobile}
            />
          </div>
        )}
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
              fontSize: isMobile ? '13px' : '14px',
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
                        {USER_ROLE_LABELS[user.role]}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                      {user.email}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div><span style={{ color: '#7f8c8d' }}>所属施設:</span> {user.hospital || '-'}</div>
                    <div><span style={{ color: '#7f8c8d' }}>アクセス可能:</span> {getAccessibleFacilitiesText(user)}</div>
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
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <tr>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>ユーザー名</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>メールアドレス</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>所属施設</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'center', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>ロール</th>
                    <th style={{ padding: isTablet ? '12px' : '14px', textAlign: 'left', fontSize: isTablet ? '13px' : '14px', fontWeight: 600, color: '#2c3e50' }}>アクセス可能施設</th>
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
                            {USER_ROLE_LABELS[user.role]}
                          </span>
                        </td>
                        <td style={{ padding: isTablet ? '12px' : '14px', fontSize: isTablet ? '12px' : '13px', color: '#666', maxWidth: '200px' }}>
                          <div style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }} title={getAccessibleFacilitiesText(user)}>
                            {getAccessibleFacilitiesText(user)}
                          </div>
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
