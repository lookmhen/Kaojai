import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, Download, FileSpreadsheet, FileText, Trash2, X, RefreshCw, Trophy, Users, CheckCircle2, ChevronRight, Award } from 'lucide-react';
import { exportGameReportExcel, exportGameReportPDF } from '../../utils/exportReport';

export const SessionHistoryModal = ({ isOpen, onClose }) => {
  const { authFetch } = useAuth();
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [error, setError] = useState('');

  const fetchHistory = () => {
    setIsLoading(true);
    setError('');
    authFetch('/api/history')
      .then(res => res.json())
      .then(data => {
        setIsLoading(false);
        if (data.success) {
          setHistoryList(data.history || []);
        } else {
          setError(data.message || 'ไม่สามารถโหลดประวัติเซสชันได้');
        }
      })
      .catch(err => {
        setIsLoading(false);
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      });
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedSession(null);
      fetchHistory();
    }
  }, [isOpen]);

  const handleViewDetail = (item) => {
    authFetch(`/api/history/${item.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSelectedSession(data.session);
        } else {
          alert(data.message || 'ไม่สามารถเปิดดูรายละเอียดได้');
        }
      })
      .catch(err => alert('เกิดข้อผิดพลาดในการโหลดรายละเอียด'));
  };

  const handleDelete = (id, title, e) => {
    e.stopPropagation();
    if (!window.confirm(`ยืนยันการลบประวัติเซสชัน "${title}" หรือไม่?`)) return;

    authFetch(`/api/history/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (selectedSession?.id === id) setSelectedSession(null);
          fetchHistory();
        } else {
          alert(data.message || 'ไม่สามารถลบประวัติได้');
        }
      })
      .catch(err => alert('เกิดข้อผิดพลาดในการลบ'));
  };

  const handleDownloadExcel = (sess, e) => {
    e?.stopPropagation();
    const analytics = sess.analytics || {};
    exportGameReportExcel({
      pin: sess.pin,
      leaderboard: analytics.leaderboard || [],
      pulseVotes: analytics.pulseVotes,
      totalPlayers: sess.totalPlayers || analytics.totalPlayers || 0,
      quizAnalytics: analytics,
      pretestData: analytics.pretestData
    });
  };

  const handleDownloadPDF = (sess, e) => {
    e?.stopPropagation();
    const analytics = sess.analytics || {};
    exportGameReportPDF({
      pin: sess.pin,
      leaderboard: analytics.leaderboard || [],
      pulseVotes: analytics.pulseVotes,
      totalPlayers: sess.totalPlayers || analytics.totalPlayers || 0,
      quizAnalytics: analytics,
      pretestData: analytics.pretestData
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        maxWidth: '920px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: '#E0F2FE', color: '#0284C7',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Clock size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1E293B', margin: 0 }}>
                คลังประวัติเซสชันย้อนหลัง (Session History Archive)
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                บันทึกสถิติผลการอบรมและแบบทดสอบที่จบเกมแล้วโดยอัตโนมัติ ย้อนดูและดาวน์โหลดรายงานได้ตลอดเวลา
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={fetchHistory}
              title="รีเฟรชประวัติ"
              style={{
                background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px',
                padding: '8px', cursor: 'pointer', color: '#64748B', display: 'flex'
              }}
            >
              <RefreshCw size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px',
                padding: '8px', cursor: 'pointer', color: '#64748B', display: 'flex'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 16px', borderRadius: '12px', marginBottom: '16px', fontSize: '0.88rem' }}>
              {error}
            </div>
          )}

          {selectedSession ? (
            /* Detailed View of Single Session */
            <div>
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                style={{
                  background: '#F1F5F9', border: 'none', borderRadius: '8px',
                  padding: '6px 14px', fontSize: '0.85rem', fontWeight: 700,
                  color: '#475569', cursor: 'pointer', marginBottom: '16px'
                }}
              >
                ← ย้อนกลับไปหน้ารวมประวัติ
              </button>

              <div style={{
                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '18px',
                padding: '20px', marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span style={{ background: '#FEF3C7', color: '#B45309', padding: '2px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800 }}>
                      PIN: {selectedSession.pin} • โหมด {selectedSession.quizMode}
                    </span>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1E293B', margin: '8px 0 4px' }}>
                      {selectedSession.title}
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      บันทึกเมื่อ: {new Date(selectedSession.finishedAt).toLocaleString('th-TH')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={(e) => handleDownloadExcel(selectedSession, e)}
                      style={{
                        padding: '9px 16px', borderRadius: '12px', border: '1px solid #86EFAC',
                        background: '#F0FDF4', color: '#166534', fontWeight: 800, fontSize: '0.85rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <FileSpreadsheet size={16} /> Excel (.xlsx)
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDownloadPDF(selectedSession, e)}
                      style={{
                        padding: '9px 16px', borderRadius: '12px', border: '1px solid #CBD5E1',
                        background: '#FFFFFF', color: '#334155', fontWeight: 800, fontSize: '0.85rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <FileText size={16} /> PDF (.pdf)
                    </button>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>ผู้เรียนทั้งหมด</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1E293B' }}>{selectedSession.totalPlayers} คน</div>
                  </div>
                  <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>คะแนนเฉลี่ย</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#EA580C' }}>{selectedSession.averageScore} Pts</div>
                  </div>
                  <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>ความแม่นยำเฉลี่ย</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#16A34A' }}>{selectedSession.overallAccuracyPct}%</div>
                  </div>
                </div>
              </div>

              {/* Leaderboard Table in Detail */}
              {selectedSession.analytics?.leaderboard?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#334155', marginBottom: '10px' }}>
                    🏆 ผลคะแนนรายบุคคล (Leaderboard)
                  </h4>
                  <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '14px' }}>
                    {selectedSession.analytics.leaderboard.map((p, idx) => (
                      <div key={p.playerId || idx} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 16px', borderBottom: '1px solid #F1F5F9',
                        background: idx === 0 ? '#FEFCE8' : '#FFFFFF'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 800, color: idx < 3 ? '#EA580C' : '#94A3B8', width: '28px' }}>
                            #{idx + 1}
                          </span>
                          <img
                            src={`/avatars/${p.avatar || '0291dcc0ce.svg'}`}
                            alt={p.name}
                            style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                          />
                          <span style={{ fontWeight: 700, color: '#1E293B' }}>{p.name}</span>
                        </div>
                        <div style={{ fontWeight: 800, color: '#0369A1' }}>
                          {(p.score || 0).toLocaleString()} Pts
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* History List */
            <div>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                  กำลังโหลดข้อมูลประวัติเซสชัน...
                </div>
              ) : historyList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
                  <Clock size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#64748B' }}>ยังไม่มีประวัติเซสชันที่บันทึกไว้</div>
                  <p style={{ fontSize: '0.85rem', margin: '4px 0 0' }}>
                    เมื่อวิทยากรจัดกิจกรรมตอบคำถามจนจบเกม ระบบจะจัดเก็บสถิติและรายงานไว้ที่นี่โดยอัตโนมัติ ✨
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {historyList.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleViewDetail(item)}
                      style={{
                        border: '1.5px solid #E2E8F0',
                        borderRadius: '16px',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        background: '#FFFFFF'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#93C5FD'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ flex: 1, minWidth: 0, marginRight: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ background: '#FFF7ED', color: '#EA580C', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                            PIN: {item.pin}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                            {new Date(item.finishedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </h4>
                        <div style={{ display: 'flex', gap: '14px', marginTop: '6px', fontSize: '0.8rem', color: '#64748B' }}>
                          <span>👥 ผู้เรียน: <strong>{item.totalPlayers}</strong> คน</span>
                          <span>🎯 ความแม่นยำ: <strong>{item.overallAccuracyPct}%</strong></span>
                          <span>⭐ คะแนนเฉลี่ย: <strong>{item.averageScore}</strong> Pts</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleViewDetail(item)}
                          style={{
                            padding: '8px 14px', borderRadius: '10px',
                            background: '#EFF6FF', border: '1px solid #BFDBFE',
                            color: '#1D4ED8', fontSize: '0.82rem', fontWeight: 700,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          ดูสรุป <ChevronRight size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(item.id, item.title, e)}
                          title="ลบประวัตินี้"
                          style={{
                            padding: '8px', borderRadius: '10px',
                            background: '#FEE2E2', border: 'none',
                            color: '#DC2626', cursor: 'pointer', display: 'flex'
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
