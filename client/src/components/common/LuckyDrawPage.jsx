import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LuckyWheel } from './LuckyWheel';
import { LuckyWaterPool } from './LuckyWaterPool';
import { SoundToggle } from './SoundToggle';
import { generateQRCodeSVG } from '../../utils/qrcode';
import { fireConfetti } from '../../utils/confetti';
import { sfx } from '../../utils/audioSFX';
import {
  Gift, Trophy, Users, QrCode, FileSpreadsheet, Download, Upload,
  RotateCcw, Sparkles, X, Check, Copy, Trash2, ArrowLeft, ShieldAlert,
  Sliders, Award, RefreshCw, ChevronRight
} from 'lucide-react';

const SAMPLE_NAMES = [
  'สมชาย ใจดี', 'สมศรี มีทรัพย์', 'วิชัย เจริญพร', 'สุดาพร รักเรียน',
  'กิตติศักดิ์ พัฒนา', 'ณัฐวุฒิ ยอดเยี่ยม', 'ปรียานุช รุ่งเรือง', 'อนันต์ บุญนำ',
  'ชลธิชา สดใส', 'ธนพล มั่งมี'
];

export const LuckyDrawPage = ({
  pin = '',
  hostToken = '',
  players = [],
  leaderboard = [],
  socket = null,
  onBack = null
}) => {
  // Tabs: 'ROOM' | 'QR' | 'MANUAL'
  const [activeTab, setActiveTab] = useState(() => (pin ? 'ROOM' : 'MANUAL'));

  // Draw Style: 'POOL' (ตักลูกบอลในอ่าง) | 'WHEEL' (วงล้อหมุน)
  const [drawStyle, setDrawStyle] = useState('POOL');

  // Prize configuration
  const [prizeName, setPrizeName] = useState('รางวัลพิเศษ 🎉');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState(-1);
  const [currentWinner, setCurrentWinner] = useState(null);
  const [winnerHistory, setWinnerHistory] = useState([]);
  const [copiedHistory, setCopiedHistory] = useState(false);

  // Exclusions (Toggleable freely)
  const [excludePreviousWinners, setExcludePreviousWinners] = useState(true);
  const [excludeTop3, setExcludeTop3] = useState(false);
  const [excludedIds, setExcludedIds] = useState(new Set());

  // Manual list state
  const [manualText, setManualText] = useState(() => {
    try {
      return localStorage.getItem('kaojai_luckydraw_manual') || '';
    } catch (e) {
      return '';
    }
  });

  const fileInputRef = useRef(null);

  // Sync tab if pin changes
  useEffect(() => {
    if (!pin && activeTab !== 'MANUAL') {
      setActiveTab('MANUAL');
    }
  }, [pin]);

  // Save manual text to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kaojai_luckydraw_manual', manualText);
    } catch (e) {}
  }, [manualText]);

  // Top 3 player IDs from leaderboard
  const top3PlayerIds = useMemo(() => {
    if (!leaderboard || leaderboard.length === 0) return new Set();
    const sorted = [...leaderboard].sort((a, b) => (b.score || 0) - (a.score || 0));
    return new Set(sorted.slice(0, 3).map(p => p.playerId));
  }, [leaderboard]);

  // Set of names/IDs who have already won
  const previousWinnerKeys = useMemo(() => {
    return new Set(winnerHistory.map(w => w.key));
  }, [winnerHistory]);

  // Calculate candidates based on active tab and filters
  const candidatePool = useMemo(() => {
    if (activeTab === 'MANUAL') {
      const rawNames = manualText
        .split(/[\r\n,，、;；|]+/)
        .map(n => n.replace(/^\s*\d+[\.\)\-:]\s*/, '').replace(/^\s*[-*•]\s*/, '').trim())
        .filter(n => n.length > 0);

      const uniqueNames = Array.from(new Set(rawNames));

      return uniqueNames
        .map((name) => ({
          id: `manual_${name.toLowerCase()}`,
          name,
          avatar: null,
          key: name.toLowerCase()
        }))
        .filter(item => {
          if (excludedIds.has(item.id)) return false;
          if (excludePreviousWinners && previousWinnerKeys.has(item.key)) return false;
          return true;
        });
    }

    // ROOM or QR tab -> use players joined in the room
    const pool = (players || []).map(p => ({
      id: p.playerId,
      name: p.name || 'Anonymous',
      avatar: p.avatar || '0291dcc0ce.svg',
      key: (p.playerId || p.name).toLowerCase()
    }));

    return pool.filter(item => {
      if (excludedIds.has(item.id)) return false;
      if (excludePreviousWinners && previousWinnerKeys.has(item.key)) return false;
      if (excludeTop3 && top3PlayerIds.has(item.id)) return false;
      return true;
    });
  }, [
    activeTab,
    manualText,
    players,
    excludedIds,
    excludePreviousWinners,
    excludeTop3,
    top3PlayerIds,
    previousWinnerKeys
  ]);

  // Wheel Spin handler
  const handleStartSpin = () => {
    if (isSpinning || candidatePool.length === 0) return;

    const chosenIdx = Math.floor(Math.random() * candidatePool.length);
    const chosenWinner = candidatePool[chosenIdx];

    setWinnerIndex(chosenIdx);
    setCurrentWinner(null);
    setIsSpinning(true);

    if (socket && pin && hostToken) {
      try {
        socket.emit('host_spin_lucky_draw', {
          pin,
          hostToken,
          prizeName: prizeName || 'รางวัลพิเศษ 🎉',
          winner: {
            id: chosenWinner.id,
            name: chosenWinner.name,
            avatar: chosenWinner.avatar
          },
          candidateNames: candidatePool.map(c => c.name),
          durationMs: 4500
        });
      } catch (err) {
        console.warn('Lucky draw spin emit warning:', err);
      }
    }
  };

  const handleSpinEnd = () => {
    setIsSpinning(false);
    if (winnerIndex >= 0 && winnerIndex < candidatePool.length) {
      const winner = candidatePool[winnerIndex];
      setCurrentWinner(winner);

      const newRecord = {
        ...winner,
        prize: prizeName || 'รางวัลพิเศษ 🎉',
        drawnAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setWinnerHistory(prev => [newRecord, ...prev]);

      sfx.playFanfare();
      fireConfetti();
    }
  };

  // Water Pool Ball Scoop handler
  const handlePoolWinner = (winnerCand) => {
    if (!winnerCand) return;
    setCurrentWinner(winnerCand);

    const newRecord = {
      ...winnerCand,
      prize: prizeName || 'รางวัลพิเศษ 🎉',
      drawnAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setWinnerHistory(prev => [newRecord, ...prev]);

    sfx.playFanfare();
    fireConfetti();

    if (socket && pin && hostToken) {
      try {
        socket.emit('host_spin_lucky_draw', {
          pin,
          hostToken,
          prizeName: prizeName || 'รางวัลพิเศษ 🎉',
          winner: {
            id: winnerCand.id,
            name: winnerCand.name,
            avatar: winnerCand.avatar
          },
          candidateNames: candidatePool.map(c => c.name),
          durationMs: 1500
        });
      } catch (err) {
        console.warn('Lucky draw pool winner emit warning:', err);
      }
    }
  };

  const handleReAddWinner = (indexToRemove) => {
    setWinnerHistory(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCopyHistory = () => {
    if (winnerHistory.length === 0) return;
    const text = winnerHistory
      .map((w, idx) => `${idx + 1}. [${w.prize}] ${w.name} (เวลา ${w.drawnAt})`)
      .join('\n');
    navigator.clipboard.writeText(`รายชื่อผู้โชคดี Lucky Draw - KaoJai:\n` + text)
      .then(() => {
        setCopiedHistory(true);
        setTimeout(() => setCopiedHistory(false), 2000);
      })
      .catch(() => {});
  };

  const handleToggleExcludeCandidate = (id) => {
    setExcludedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddSampleNames = () => {
    setManualText(SAMPLE_NAMES.join('\n'));
    setExcludedIds(new Set());
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      '\uFEFF' +
      'ชื่อ-นามสกุล,แผนก/สังกัด,หมายเหตุ\n' +
      'สมชาย ใจดี,ฝ่ายการตลาด,ตัวอย่าง\n' +
      'สมศรี มีทรัพย์,ฝ่ายบุคคล,ตัวอย่าง\n' +
      'วิชัย เจริญพร,ฝ่ายขาย,ตัวอย่าง\n' +
      'สุดาพร รักเรียน,ฝ่ายบัญชี,ตัวอย่าง\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'kaojai_luckydraw_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (!text) return;

        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        if (lines.length === 0) return;

        const startIndex = (lines[0].includes('ชื่อ') || lines[0].toLowerCase().includes('name')) ? 1 : 0;
        const importedNames = [];

        for (let i = startIndex; i < lines.length; i++) {
          const cols = lines[i].split(',');
          const name = cols[0]?.trim().replace(/^["']|["']$/g, '');
          if (name && name.length > 0) {
            importedNames.push(name);
          }
        }

        if (importedNames.length > 0) {
          const current = manualText.trim();
          const merged = current
            ? `${current}\n${importedNames.join('\n')}`
            : importedNames.join('\n');
          setManualText(merged);
        }
      } catch (err) {
        console.error('Import CSV error:', err);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleBack = () => {
    if (socket && pin && hostToken) {
      try {
        socket.emit('host_close_lucky_draw', { pin, hostToken });
      } catch (e) {}
    }
    if (onBack) onBack();
  };

  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/?pin=${pin}` : '';
  const qrSvgUrl = pin ? generateQRCodeSVG(joinUrl, 220) : '';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Bar */}
      <header
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            type="button"
            onClick={handleBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '14px',
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              color: '#334155',
              fontSize: '0.95rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <ArrowLeft size={18} /> กลับสู่หน้าหลัก
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}
            >
              <Gift size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-main, #1E293B)', letterSpacing: '0.5px' }}>
                  KAOJAI LUCKY DRAW ARENA 🎁 🌊
                </h1>
                <span
                  style={{
                    background: '#FEF3C7',
                    color: '#92400E',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    padding: '3px 12px',
                    borderRadius: '20px',
                    border: '1px solid #FDE68A'
                  }}
                >
                  ระบบสุ่มผู้โชคดีเต็มจอ
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                {pin ? `เชื่อมต่อห้องกิจกรรม PIN: ${pin} • สุ่มผู้เรียนในห้องหรือกรอกรายชื่ออิสระ` : 'โหมดอิสระ (Standalone) • สุ่มรายชื่อสำหรับงานสัมมนา ปาร์ตี้บริษัท'}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {pin && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FFF7ED',
                border: '1.5px solid #FDBA74',
                padding: '6px 16px',
                borderRadius: '24px'
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C2410C', textTransform: 'uppercase' }}>PIN:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#EA580C', letterSpacing: '2px' }}>{pin}</span>
            </div>
          )}

          <SoundToggle />
        </div>
      </header>

      {/* Main Container - Full-width 2-Column Responsive Layout */}
      <main style={{ flex: 1, padding: '24px 32px', maxWidth: '1440px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(380px, 0.75fr)', gap: '24px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: THE ARENA STAGE (Canvas, Mode Switcher, Prize Input) */}
          <div
            className="glass-card"
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '1px solid #E2E8F0'
            }}
          >
            {/* Style Switcher Pill */}
            <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: '30px', padding: '5px', marginBottom: '18px', border: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={() => setDrawStyle('POOL')}
                style={{
                  padding: '9px 24px',
                  borderRadius: '24px',
                  background: drawStyle === 'POOL' ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' : 'transparent',
                  color: drawStyle === 'POOL' ? '#FFFFFF' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: drawStyle === 'POOL' ? '0 4px 12px rgba(2, 132, 199, 0.35)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                🌊 ตักลูกบอลในอ่างน้ำ (Water Pool)
              </button>
              <button
                type="button"
                onClick={() => setDrawStyle('WHEEL')}
                style={{
                  padding: '9px 24px',
                  borderRadius: '24px',
                  background: drawStyle === 'WHEEL' ? 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)' : 'transparent',
                  color: drawStyle === 'WHEEL' ? '#FFFFFF' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: drawStyle === 'WHEEL' ? '0 4px 12px rgba(234, 88, 12, 0.35)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                🎡 วงล้อหมุน (Wheel of Fortune)
              </button>
            </div>

            {/* Prize Input */}
            <div style={{ width: '100%', maxWidth: '520px', marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                🎁 ชื่อของรางวัลรอบนี้:
              </label>
              <input
                type="text"
                value={prizeName}
                onChange={(e) => setPrizeName(e.target.value)}
                placeholder="เช่น รางวัลที่ 1 ทีวี 55 นิ้ว, Gift Voucher 500.-"
                disabled={isSpinning}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: '16px',
                  border: '2px solid #CBD5E1',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: '#1E293B',
                  outline: 'none',
                  background: '#FFFFFF',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* The Main Arena Stage Canvas */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '440px' }}>
              {drawStyle === 'POOL' ? (
                <LuckyWaterPool
                  candidates={candidatePool}
                  onSelectWinner={handlePoolWinner}
                  isLocked={isSpinning || Boolean(currentWinner)}
                  width={600}
                  height={440}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <LuckyWheel
                    candidates={candidatePool}
                    isSpinning={isSpinning}
                    winnerIndex={winnerIndex}
                    duration={4500}
                    onSpinEnd={handleSpinEnd}
                    size={420}
                  />

                  <div style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      onClick={handleStartSpin}
                      disabled={isSpinning || candidatePool.length === 0}
                      style={{
                        padding: '16px 52px',
                        borderRadius: '36px',
                        border: 'none',
                        background: candidatePool.length === 0
                          ? '#94A3B8'
                          : 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                        color: '#FFFFFF',
                        fontSize: '1.25rem',
                        fontWeight: 900,
                        cursor: (isSpinning || candidatePool.length === 0) ? 'not-allowed' : 'pointer',
                        boxShadow: candidatePool.length === 0 ? 'none' : '0 8px 24px rgba(234, 88, 12, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transform: isSpinning ? 'scale(0.98)' : 'scale(1)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Sparkles size={24} />
                      {isSpinning ? 'กำลังหมุนวงล้อ... 🎰' : `หมุนวงล้อลุ้นรางวัล! (${candidatePool.length} คน)`}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {candidatePool.length === 0 && (
              <div style={{ marginTop: '12px', fontSize: '0.9rem', color: '#DC2626', fontWeight: 700 }}>
                ⚠️ ไม่มีรายชื่อในวงล้อ กรุณาเพิ่มรายชื่อในแผงด้านขวา หรือปลดล็อกตัวกรอง
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: CONTROL PANEL, CANDIDATES & WINNER HISTORY */}
          <div
            className="glass-card"
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Candidate Source Tabs */}
            <div>
              <div style={{ display: 'flex', borderBottom: '2px solid #F1F5F9', gap: '8px', paddingBottom: '4px' }}>
                {pin && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('ROOM')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: activeTab === 'ROOM' ? '#FFF7ED' : 'transparent',
                      color: activeTab === 'ROOM' ? '#EA580C' : '#64748B',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Users size={18} /> ผู้เล่นในห้อง ({players?.length || 0})
                  </button>
                )}

                {pin && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('QR')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: activeTab === 'QR' ? '#FFF7ED' : 'transparent',
                      color: activeTab === 'QR' ? '#EA580C' : '#64748B',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <QrCode size={18} /> QR สแกนร่วมสนุก
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('MANUAL')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: activeTab === 'MANUAL' ? '#FFF7ED' : 'transparent',
                    color: activeTab === 'MANUAL' ? '#EA580C' : '#64748B',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FileSpreadsheet size={18} /> กรอกเอง / CSV
                </button>
              </div>

              {/* Source Tab Contents */}
              <div style={{ marginTop: '16px' }}>
                {/* TAB 1: ROOM PLAYERS */}
                {activeTab === 'ROOM' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155' }}>
                        รายชื่อผู้เล่นที่ Join ({players?.length || 0} คน)
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                        อยู่ในวงล้อ/อ่าง: <strong style={{ color: '#EA580C' }}>{candidatePool.length}</strong> คน
                      </span>
                    </div>

                    <div
                      style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        border: '1px solid #E2E8F0',
                        borderRadius: '16px',
                        padding: '10px',
                        background: '#F8FAFC',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      {players?.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', width: '100%', color: '#94A3B8', fontSize: '0.9rem' }}>
                          ยังไม่มีผู้เรียนเข้าร่วมห้อง
                        </div>
                      ) : (
                        players.map(p => {
                          const isExcluded = excludedIds.has(p.playerId) ||
                            (excludePreviousWinners && previousWinnerKeys.has(p.playerId.toLowerCase())) ||
                            (excludeTop3 && top3PlayerIds.has(p.playerId));

                          return (
                            <div
                              key={p.playerId}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 10px',
                                borderRadius: '20px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                background: isExcluded ? '#E2E8F0' : '#FFFFFF',
                                color: isExcluded ? '#94A3B8' : '#1E293B',
                                border: isExcluded ? '1px dashed #CBD5E1' : '1px solid #CBD5E1',
                                textDecoration: isExcluded ? 'line-through' : 'none'
                              }}
                            >
                              <img
                                src={`/avatars/${p.avatar || '0291dcc0ce.svg'}`}
                                alt={p.name}
                                style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <span>{p.name}</span>
                              <button
                                type="button"
                                onClick={() => handleToggleExcludeCandidate(p.playerId)}
                                title={isExcluded ? 'นำกลับเข้าวงล้อ' : 'คัดชื่อนี้ออก'}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 0,
                                  color: isExcluded ? '#2563EB' : '#EF4444',
                                  display: 'flex'
                                }}
                              >
                                {isExcluded ? <RotateCcw size={14} /> : <X size={14} />}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: QR LIVE REGISTRATION */}
                {activeTab === 'QR' && (
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E293B', marginBottom: '6px' }}>
                      📱 สแกน QR Code เพื่อส่งชื่อเข้าร่วมลุ้นรางวัล!
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 14px' }}>
                      เปิดจอใหญ่ให้คนในงานสแกนด้วยกล้องมือถือ พิมพ์ชื่อแล้วชื่อจะเข้ามาในอ่างน้ำ/วงล้อทันที
                    </p>

                    <div style={{ display: 'inline-block', padding: '14px', background: '#FFFFFF', borderRadius: '20px', border: '2px solid #F59E0B', boxShadow: '0 6px 16px rgba(245, 158, 11, 0.15)' }}>
                      {qrSvgUrl && (
                        <img src={qrSvgUrl} alt="Lucky Draw QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
                      )}
                    </div>

                    <div style={{ marginTop: '12px', fontSize: '1.4rem', fontWeight: 900, color: '#EA580C', letterSpacing: '3px' }}>
                      PIN: {pin}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px', color: '#059669', fontSize: '0.82rem', fontWeight: 700 }}>
                      <ShieldAlert size={16} /> ระบบป้องกันชื่อซ้ำ: 1 เครื่อง = 1 สิทธิ์อัตโนมัติ
                    </div>
                  </div>
                )}

                {/* TAB 3: MANUAL & CSV */}
                {activeTab === 'MANUAL' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155' }}>
                        รายชื่อผู้ร่วมกิจกรรม:
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={handleAddSampleNames}
                          style={{
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            color: '#1D4ED8',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          สุ่มตัวอย่าง
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setManualText('');
                            setExcludedIds(new Set());
                          }}
                          style={{
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            color: '#DC2626',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          ล้างรายชื่อ
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={5}
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder="พิมพ์ชื่อ หรือ คัดลอกวางรายชื่อ (บรรทัดละชื่อ หรือ คั่นด้วยจุลภาค , )&#10;เช่น:&#10;สมชาย ใจดี&#10;สมศรี มีทรัพย์"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '14px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />

                    {/* Candidate Preview & Counter */}
                    {candidatePool.length > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                            ตรวจพบรายชื่อ: <strong style={{ color: '#0284C7' }}>{candidatePool.length}</strong> คน
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            ลูกบอลในอ่าง: <strong style={{ color: '#EA580C' }}>{Math.min(candidatePool.length, 10)}</strong> / 10 ลูก
                          </span>
                        </div>

                        <div
                          style={{
                            maxHeight: '110px',
                            overflowY: 'auto',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            padding: '8px',
                            background: '#F8FAFC',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px'
                          }}
                        >
                          {candidatePool.map((c, i) => (
                            <span
                              key={c.id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                background: '#FFFFFF',
                                borderRadius: '12px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#1E293B',
                                border: '1px solid #CBD5E1'
                              }}
                            >
                              <span style={{ color: '#0284C7', fontSize: '0.72rem' }}>#{i + 1}</span>
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CSV Actions Toolbar */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImportCSV}
                        accept=".csv,text/csv"
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '12px',
                          background: '#F0FDF4',
                          border: '1px solid #86EFAC',
                          color: '#166534',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Upload size={16} /> นำเข้าไฟล์ CSV
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '12px',
                          background: '#F8FAFC',
                          border: '1px solid #CBD5E1',
                          color: '#475569',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Download size={16} /> โหลด Template CSV
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filter Toggles */}
            <div
              style={{
                background: '#F8FAFC',
                borderRadius: '16px',
                padding: '14px 16px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={16} /> ตัวเลือกการคัดกรอง (เปิด-ปิดได้อิสระ)
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#1E293B', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={excludePreviousWinners}
                  onChange={(e) => setExcludePreviousWinners(e.target.checked)}
                  style={{ accentColor: '#EA580C', width: '18px', height: '18px' }}
                />
                <span>
                  <strong>ตัดผู้ที่ได้รับรางวัลไปแล้ว</strong> (ป้องกันคนเดิมได้ซ้ำ)
                </span>
              </label>

              {pin && leaderboard && leaderboard.length >= 3 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#1E293B', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={excludeTop3}
                    onChange={(e) => setExcludeTop3(e.target.checked)}
                    style={{ accentColor: '#EA580C', width: '18px', height: '18px' }}
                  />
                  <span>
                    <strong>ตัด 3 อันดับแรก (Top 3) จาก Quiz</strong> (สำหรับแจกรางวัลปลอบใจ)
                  </span>
                </label>
              )}
            </div>

            {/* Winner History Log */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trophy size={18} color="#F59E0B" /> ประวัติผู้ได้รับรางวัล ({winnerHistory.length} รางวัล)
                </div>
                {winnerHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyHistory}
                    style={{
                      background: '#F1F5F9',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: copiedHistory ? '#16A34A' : '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {copiedHistory ? <Check size={14} /> : <Copy size={14} />}
                    {copiedHistory ? 'คัดลอกแล้ว!' : 'คัดลอกรายชื่อ'}
                  </button>
                )}
              </div>

              <div
                style={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  borderRadius: '14px',
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC'
                }}
              >
                {winnerHistory.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    ยังไม่มีผู้ได้รับรางวัลในรอบนี้
                  </div>
                ) : (
                  winnerHistory.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderBottom: idx < winnerHistory.length - 1 ? '1px solid #F1F5F9' : 'none',
                        background: '#FFFFFF'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, color: '#F59E0B', fontSize: '0.85rem' }}>#{winnerHistory.length - idx}</span>
                        <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.85rem' }}>{item.name}</span>
                        <span style={{ color: '#64748B', fontSize: '0.78rem' }}>({item.prize})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleReAddWinner(idx)}
                        title="คืนสิทธิ์เข้าวงล้อ"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#2563EB',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <RotateCcw size={12} /> คืนสิทธิ์
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Winner Spotlight Card Modal Popup */}
      {currentWinner && !isSpinning && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.25s ease-out'
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#FFFFFF',
              borderRadius: '28px',
              padding: '40px 32px',
              textAlign: 'center',
              boxShadow: '0 25px 60px -15px rgba(245, 158, 11, 0.4)',
              border: '3px solid #F59E0B',
              animation: 'scaleIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                color: '#D97706',
                boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)',
                marginBottom: '16px'
              }}
            >
              <Trophy size={42} />
            </div>

            <div style={{ color: '#D97706', fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
              🎉 CONGRATULATIONS 🎉
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#475569', margin: '4px 0 16px' }}>
              ขอแสดงความยินดีกับผู้โชคดี!
            </h3>

            {currentWinner.avatar && (
              <img
                src={`/avatars/${currentWinner.avatar}`}
                alt={currentWinner.name}
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  border: '4px solid #F59E0B',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                  marginBottom: '14px',
                  objectFit: 'cover'
                }}
              />
            )}

            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1E293B', marginBottom: '8px' }}>
              {currentWinner.name}
            </div>

            <div
              style={{
                display: 'inline-block',
                background: '#FFF7ED',
                border: '1.5px solid #FFEDD5',
                color: '#EA580C',
                padding: '10px 24px',
                borderRadius: '24px',
                fontWeight: 800,
                fontSize: '1.1rem',
                marginBottom: '28px'
              }}
            >
              🎁 {prizeName || 'รางวัลพิเศษ 🎉'}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setCurrentWinner(null)}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(234, 88, 12, 0.35)'
                }}
              >
                ยอดเยี่ยม! สุ่มรางวัลต่อไป ✨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
