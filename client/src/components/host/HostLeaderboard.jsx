import React, { useEffect, useState } from 'react';
import { fireConfetti } from '../../utils/confetti';
import { sfx } from '../../utils/audioSFX';
import { Trophy, ArrowRight, Flag, RotateCcw, FileSpreadsheet, FileText, LogOut, TrendingUp, Award, Download } from 'lucide-react';
import { exportGameReportExcel, exportGameReportPDF } from '../../utils/exportReport';

export const HostLeaderboard = ({ pin, leaderboard, pulseVotes, quizAnalytics, pretestData, isEnded, onNextQuestion, onResetToLobby, onLeave }) => {
  const [animatedScores, setAnimatedScores] = useState({});

  useEffect(() => {
    fireConfetti();
    sfx.playFanfare();

    const initialMap = {};
    leaderboard.forEach(p => {
      initialMap[p.playerId] = p.previousScore || 0;
    });
    setAnimatedScores(initialMap);

    const timer = setTimeout(() => {
      const targetMap = {};
      leaderboard.forEach(p => {
        targetMap[p.playerId] = p.score;
      });
      setAnimatedScores(targetMap);
    }, 400);

    return () => clearTimeout(timer);
  }, [leaderboard]);

  const maxScore = Math.max(...leaderboard.map(p => p.score), 1000);

  return (
    <div style={{ maxWidth: '980px', margin: '20px auto', padding: '0 20px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ textAlign: 'center', marginBottom: '24px', padding: '24px 20px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-earth-orange)', fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>
          <Flag size={18} color="var(--accent-earth-orange)" /> {isEnded ? '🏆 FINAL PODIUM CHAMPIONS 🏆' : 'KAOJAI RACING LEADERBOARD'} <Flag size={18} color="var(--accent-earth-orange)" />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>
          {isEnded ? 'สรุปอันดับผู้ชนะการแข่งขันสิ้นสุดเกม! 🎉' : 'สรุปการอันดับและการเปลี่ยนแปลงคะแนนรอบนี้ 🏎️💨'}
        </h1>
      </div>

      {/* Racing Track Rows */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {leaderboard.map((player, idx) => {
            const currentScore = animatedScores[player.playerId] !== undefined ? animatedScores[player.playerId] : player.score;
            const pct = Math.min(100, Math.max(12, Math.round((currentScore / maxScore) * 100)));
            const pointsEarned = player.lastPointsEarned || 0;
            const rank = idx + 1;

            let rankBadge = `#${rank}`;
            let rankColor = 'var(--text-muted)';
            let barBg = 'var(--accent-earth-blue)';

            if (rank === 1) {
              rankBadge = '🥇 #1';
              rankColor = 'var(--accent-earth-orange)';
              barBg = 'var(--accent-earth-orange)';
            } else if (rank === 2) {
              rankBadge = '🥈 #2';
              rankColor = '#475569';
              barBg = '#3B82F6';
            } else if (rank === 3) {
              rankBadge = '🥉 #3';
              rankColor = '#C05621';
              barBg = 'var(--accent-earth-green)';
            }

            return (
              <div
                key={player.playerId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  position: 'relative',
                  transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                {/* Rank Badge */}
                <div
                  style={{
                    width: '60px',
                    fontSize: '1.05rem',
                    fontWeight: 900,
                    color: rankColor,
                    textAlign: 'center',
                    flexShrink: 0
                  }}
                >
                  {rankBadge}
                </div>

                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={`/avatars/${player.avatar || '0291dcc0ce.svg'}`}
                    alt={player.name}
                    onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      border: rank === 1 ? '3px solid var(--accent-earth-orange)' : '2px solid #CBD5E1',
                      background: '#F8FAFC'
                    }}
                  />
                  {pointsEarned > 0 && !isEnded && (
                    <div
                      className="animate-pop"
                      style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '-12px',
                        background: 'var(--pulse-green)',
                        color: '#FFFFFF',
                        fontWeight: 900,
                        fontSize: '0.75rem',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      +{pointsEarned}
                    </div>
                  )}
                </div>

                {/* Player Info & Animated Racing Bar */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                        {player.name}
                      </span>
                      {player.streak >= 2 && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: player.streak >= 4 ? '#EF4444' : '#F97316',
                            color: '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: 900,
                            padding: '2px 8px',
                            borderRadius: '20px',
                            boxShadow: '0 2px 6px rgba(249, 115, 22, 0.4)'
                          }}
                        >
                          🔥 {player.streak}
                        </span>
                      )}
                    </div>
                    <span style={{ fontWeight: 900, color: 'var(--accent-earth-orange)', fontSize: '1.15rem' }}>
                      {currentScore.toLocaleString()} Pts
                    </span>
                  </div>

                  {/* Track Bar */}
                  <div
                    style={{
                      height: '24px',
                      background: '#F1F5F9',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid #CBD5E1',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: barBg,
                        borderRadius: '12px',
                        transition: 'width 1.2s cubic-bezier(0.25, 1, 0.5, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: '8px'
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#FFFFFF' }}>
                        🏎️
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Learning Gain Card (Pre-test vs Post-test) */}
      {quizAnalytics?.learningGain && isEnded && (
        <div className="glass-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <TrendingUp size={22} color="#7C3AED" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#7C3AED', margin: 0 }}>
              📊 ผลสัมฤทธิ์ทางการเรียนรู้ (Pre vs Post Learning Gain)
            </h3>
          </div>

          {/* Class Accuracy Shift */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div style={{ flex: 1, minWidth: '120px', textAlign: 'center', padding: '14px', background: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
              <div style={{ fontSize: '0.8rem', color: '#1D4ED8', fontWeight: 700 }}>Pre-test</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1D4ED8' }}>{quizAnalytics.learningGain.preOverallAccuracyPct}%</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.5rem' }}>→</div>
            <div style={{ flex: 1, minWidth: '120px', textAlign: 'center', padding: '14px', background: '#F5F3FF', borderRadius: '12px', border: '1px solid #DDD6FE' }}>
              <div style={{ fontSize: '0.8rem', color: '#7C3AED', fontWeight: 700 }}>Post-test</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#7C3AED' }}>{quizAnalytics.learningGain.postOverallAccuracyPct}%</div>
            </div>
            <div style={{ flex: 1, minWidth: '120px', textAlign: 'center', padding: '14px', background: quizAnalytics.learningGain.classGainPct >= 0 ? '#DCFCE7' : '#FEF2F2', borderRadius: '12px', border: `1px solid ${quizAnalytics.learningGain.classGainPct >= 0 ? '#86EFAC' : '#FECACA'}` }}>
              <div style={{ fontSize: '0.8rem', color: quizAnalytics.learningGain.classGainPct >= 0 ? '#166534' : '#991B1B', fontWeight: 700 }}>Gain</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: quizAnalytics.learningGain.classGainPct >= 0 ? '#166534' : '#991B1B' }}>
                {quizAnalytics.learningGain.classGainPct >= 0 ? '+' : ''}{quizAnalytics.learningGain.classGainPct}%
              </div>
            </div>
          </div>

          {/* Most Improved Learner */}
          {quizAnalytics.learningGain.mostImprovedLearner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#FFFBEB', borderRadius: '12px', border: '1px solid #FDE68A', marginBottom: '12px' }}>
              <Award size={22} color="#D97706" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#92400E' }}>🌟 ผู้เรียนที่พัฒนาได้มากที่สุด</div>
                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#D97706' }}>
                  {quizAnalytics.learningGain.mostImprovedLearner.name}
                  {' '}
                  <span style={{ fontSize: '0.85rem', color: '#92400E' }}>
                    (+{quizAnalytics.learningGain.mostImprovedLearner.accuracyDiff}% ความแม่นยำ)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Top Gained Question */}
          {quizAnalytics.learningGain.topGainedQuestion && (
            <div style={{ padding: '10px 14px', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #86EFAC', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 700, color: '#166534' }}>📈 ข้อที่พัฒนาได้มากที่สุด: </span>
              <span style={{ color: '#15803D' }}>
                {quizAnalytics.learningGain.topGainedQuestion.questionText?.slice(0, 60) || `ข้อที่ ${quizAnalytics.learningGain.topGainedQuestion.questionIndex + 1}`}
                {' '} (+{quizAnalytics.learningGain.topGainedQuestion.diffPct}%)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Control Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        {/* Export Excel Button */}
        <button
          type="button"
          onClick={() => exportGameReportExcel({ pin, leaderboard, pulseVotes, quizAnalytics, pretestData })}
          style={{
            padding: '14px 28px',
            borderRadius: '50px',
            background: 'linear-gradient(135deg, #107C41 0%, #0B5A2F 100%)',
            color: '#FFFFFF',
            fontSize: '1.05rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 14px rgba(16, 124, 65, 0.35)',
            borderBottom: '3px solid #063C1E',
            cursor: 'pointer'
          }}
          title="ดาวน์โหลดรายงานสมบูรณ์เป็นไฟล์ Microsoft Excel (.xlsx) แยกชีตสวยงาม"
        >
          <FileSpreadsheet size={20} /> ดาวน์โหลดรายงาน Excel (.xlsx)
        </button>

        {/* Export PDF Button */}
        <button
          type="button"
          onClick={() => exportGameReportPDF({ pin, leaderboard, pulseVotes, quizAnalytics, pretestData })}
          style={{
            padding: '14px 28px',
            borderRadius: '50px',
            background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
            color: '#FFFFFF',
            fontSize: '1.05rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
            borderBottom: '3px solid #7F1D1D',
            cursor: 'pointer'
          }}
          title="ดาวน์โหลดรายงานสรุปผลภาพรวมเป็นไฟล์ PDF พร้อมจัดหน้าสวยงาม"
        >
          <FileText size={20} /> ดาวน์โหลดรายงาน PDF (.pdf)
        </button>

        {isEnded ? (
          <>
            <button
              type="button"
              onClick={() => onResetToLobby?.()}
              style={{
                padding: '16px 32px',
                borderRadius: '50px',
                background: 'var(--accent-earth-blue)',
                color: '#FFFFFF',
                fontSize: '1.1rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 14px rgba(30, 58, 138, 0.25)',
                borderBottom: '3px solid #172554',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={20} /> จบเกม / กลับสู่หน้า Lobby
            </button>

            {onLeave && (
              <button
                type="button"
                onClick={() => onLeave?.()}
                style={{
                  padding: '16px 32px',
                  borderRadius: '50px',
                  background: '#F1F5F9',
                  color: '#334155',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={20} color="#DC2626" /> ออกจากห้อง / กลับหน้าหลัก
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => onNextQuestion?.()}
            style={{
              padding: '16px 36px',
              borderRadius: '50px',
              background: 'var(--accent-earth-blue)',
              color: '#FFFFFF',
              fontSize: '1.1rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(30, 58, 138, 0.25)',
              borderBottom: '3px solid #172554',
              cursor: 'pointer'
            }}
          >
            ลุยคำถามถัดไป <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};
