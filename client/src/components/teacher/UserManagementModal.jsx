import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, UserPlus, Trash2, X, Shield, GraduationCap, AlertCircle, CheckCircle2, Loader2, KeyRound, UserCheck } from 'lucide-react';

export const UserManagementModal = ({ isOpen, onClose }) => {
  const { user: currentUser, authFetch, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  // Form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState('TEACHER');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/auth/users');
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
      } else {
        setError(data.message || 'ไม่สามารถโหลดรายชื่อผู้ใช้ได้');
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, isAdmin]);

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchUsers();
      setNotification('');
      setError('');
    }
  }, [isOpen, isAdmin, fetchUsers]);

  if (!isOpen) return null;

  // Safety check: only ADMIN can see this
  if (!isAdmin) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <div className="glass-card animate-pop" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
          <AlertCircle size={44} color="#DC2626" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>สิทธิ์การเข้าถึงไม่ถูกต้อง</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>หน้านี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น</p>
          <button
            type="button"
            onClick={onClose}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              borderRadius: '10px',
              background: '#1E293B',
              color: '#FFFFFF',
              fontWeight: 700
            }}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    );
  }

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้ (Username)');
      return;
    }
    if (!newPassword.trim()) {
      setError('กรุณากรอกรหัสผ่าน (Password)');
      return;
    }
    if (!newDisplayName.trim()) {
      setError('กรุณากรอกชื่อที่แสดง (Display Name)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await authFetch('/api/auth/users', {
        method: 'POST',
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          displayName: newDisplayName.trim(),
          role: newRole
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotification(`เพิ่มผู้ใช้งาน "${newDisplayName}" เรียบร้อยแล้ว! 🎉`);
        setNewUsername('');
        setNewPassword('');
        setNewDisplayName('');
        setNewRole('TEACHER');
        fetchUsers();
        setTimeout(() => setNotification(''), 3500);
      } else {
        setError(data.message || 'ไม่สามารถเพิ่มผู้ใช้งานได้');
      }
    } catch (err) {
      console.error('Create user error:', err);
      setError('เกิดข้อผิดพลาดในการสร้างผู้ใช้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.id === currentUser?.id || targetUser.username === currentUser?.username) {
      if (newRole !== 'ADMIN') {
        alert('ไม่สามารถลดสิทธิ์บัญชีของตนเองได้');
        return;
      }
    }

    setUpdatingUserId(targetUser.id);
    setError('');

    try {
      const res = await authFetch(`/api/auth/users/${targetUser.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotification(`เปลี่ยนสิทธิ์ "${targetUser.displayName || targetUser.username}" เป็น ${newRole} สำเร็จแล้ว! ✨`);
        fetchUsers();
        setTimeout(() => setNotification(''), 3000);
      } else {
        setError(data.message || 'ไม่สามารถเปลี่ยนบทบาทผู้ใช้งานได้');
      }
    } catch (err) {
      console.error('Update role error:', err);
      setError('เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์ผู้ใช้');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (userToDelete.id === currentUser?.id || userToDelete.username === currentUser?.username) {
      alert('ไม่สามารถลบบัญชีผู้ใช้งานของตนเองได้');
      return;
    }

    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ "${userToDelete.displayName || userToDelete.username}"?`)) {
      return;
    }

    try {
      const res = await authFetch(`/api/auth/users/${userToDelete.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotification(`ลบผู้ใช้ "${userToDelete.displayName || userToDelete.username}" สำเร็จ`);
        fetchUsers();
        setTimeout(() => setNotification(''), 3000);
      } else {
        setError(data.message || 'ไม่สามารถลบผู้ใช้งานได้');
      }
    } catch (err) {
      console.error('Delete user error:', err);
      setError('เกิดข้อผิดพลาดในการลบผู้ใช้งาน');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="glass-card animate-pop"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #E2E8F0'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#EFF6FF', padding: '10px', borderRadius: '12px', border: '1px solid #DBEAFE' }}>
              <Users size={24} color="#1E40AF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  จัดการผู้ใช้งาน (User Management)
                </h2>
                <span style={{ background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                  🛡️ Admin Only
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
                เพิ่ม แก้ไข และจัดการสิทธิ์ผู้ใช้งานระดับอาจารย์และผู้ดูแลระบบ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#F1F5F9',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Notification / Error alerts */}
        {notification && (
          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', padding: '10px 14px', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
            <CheckCircle2 size={18} /> {notification}
          </div>
        )}

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* Modal Body: Two Columns (Add User Form & User List) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.3fr)', gap: '20px', overflowY: 'auto', paddingRight: '4px' }}>
          
          {/* Left Column: Add New User Form */}
          <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#1E293B', fontWeight: 800, fontSize: '1rem' }}>
              <UserPlus size={18} color="#2563EB" /> เพิ่มผู้ใช้งานใหม่
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  ชื่อที่แสดง (Display Name) *
                </label>
                <input
                  type="text"
                  placeholder="เช่น อ.สมชาย ใจดี"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  ชื่อผู้ใช้งาน (Username) *
                </label>
                <input
                  type="text"
                  placeholder="เช่น teacher_somchai"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  รหัสผ่าน (Password) *
                </label>
                <input
                  type="password"
                  placeholder="อย่างน้อย 4 ตัวอักษร"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  บทบาท (Role) *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setNewRole('TEACHER')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: newRole === 'TEACHER' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                      background: newRole === 'TEACHER' ? '#EFF6FF' : '#FFFFFF',
                      color: newRole === 'TEACHER' ? '#1E40AF' : '#64748B',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <GraduationCap size={16} /> Teacher
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole('ADMIN')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: newRole === 'ADMIN' ? '2px solid #16A34A' : '1px solid #CBD5E1',
                      background: newRole === 'ADMIN' ? '#F0FDF4' : '#FFFFFF',
                      color: newRole === 'ADMIN' ? '#166534' : '#64748B',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Shield size={16} /> Admin
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: '6px',
                  padding: '11px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(30, 58, 138, 0.25)',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} /> สร้างผู้ใช้งาน
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Existing Users List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                ผู้ใช้งานในระบบ ({users.length} คน)
              </div>
              <button
                type="button"
                onClick={fetchUsers}
                disabled={isLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isLoading ? 'กำลังโหลด...' : 'รีเฟรช'}
              </button>
            </div>

            {isLoading && users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                <div>กำลังโหลดข้อมูล...</div>
              </div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', background: '#F8FAFC', borderRadius: '12px' }}>
                ไม่พบข้อมูลผู้ใช้งาน
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {users.map((u) => {
                  const isCurrent = u.id === currentUser?.id || u.username === currentUser?.username;
                  const isUserAdmin = u.role === 'ADMIN';

                  return (
                    <div
                      key={u.id}
                      style={{
                        background: '#FFFFFF',
                        border: isCurrent ? '1.5px solid #93C5FD' : '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: isUserAdmin ? '#F0FDF4' : '#EFF6FF',
                            border: isUserAdmin ? '1px solid #BBF7D0' : '1px solid #BFDBFE',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {isUserAdmin ? (
                            <Shield size={20} color="#166534" />
                          ) : (
                            <GraduationCap size={20} color="#1E40AF" />
                          )}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                              {u.displayName || u.username}
                            </span>
                            {isCurrent && (
                              <span style={{ background: '#DBEAFE', color: '#1E40AF', fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '6px' }}>
                                คุณ
                              </span>
                            )}
                            <span
                              style={{
                                background: isUserAdmin ? '#DCFCE7' : '#F1F5F9',
                                color: isUserAdmin ? '#166534' : '#475569',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '6px'
                              }}
                            >
                              {u.role}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                            @{u.username}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isCurrent ? (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                            (บัญชีของคุณ)
                          </span>
                        ) : (
                          <>
                            {/* Change Role Button */}
                            <button
                              type="button"
                              disabled={updatingUserId === u.id}
                              onClick={() => handleRoleChange(u, isUserAdmin ? 'TEACHER' : 'ADMIN')}
                              title={isUserAdmin ? 'เปลี่ยนสิทธิ์เป็นอาจารย์ผู้สอน (Teacher)' : 'เลื่อนสิทธิ์เป็นผู้ดูแลระบบ (Admin)'}
                              style={{
                                background: isUserAdmin ? '#EFF6FF' : '#F0FDF4',
                                border: isUserAdmin ? '1px solid #BFDBFE' : '1px solid #BBF7D0',
                                color: isUserAdmin ? '#1E40AF' : '#166534',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: updatingUserId === u.id ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              {updatingUserId === u.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : isUserAdmin ? (
                                <>
                                  <GraduationCap size={13} /> ปรับเป็น Teacher
                                </>
                              ) : (
                                <>
                                  <Shield size={13} /> เลื่อนเป็น Admin
                                </>
                              )}
                            </button>

                            {/* Delete User Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              title={`ลบผู้ใช้ @${u.username}`}
                              style={{
                                background: '#FEF2F2',
                                border: '1px solid #FECACA',
                                color: '#DC2626',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              <Trash2 size={13} /> ลบ
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
