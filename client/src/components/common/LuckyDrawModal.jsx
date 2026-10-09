import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LuckyWheel } from './LuckyWheel';
import { LuckyWaterPool } from './LuckyWaterPool';
import { generateQRCodeSVG } from '../../utils/qrcode';
import { fireConfetti } from '../../utils/confetti';
import { sfx } from '../../utils/audioSFX';
import {
  Gift, Trophy, Users, QrCode, FileSpreadsheet, Download, Upload,
  RotateCcw, Sparkles, X, Check, Copy, Trash2, UserMinus, ShieldAlert,
  Sliders, Award, RefreshCw
} from 'lucide-react';

const SAMPLE_NAMES = [
  'สมชาย ใจดี', 'สมศรี มีทรัพย์', 'วิชัย เจริญพร', 'สุดาพร รักเรียน',
  'กิตติศักดิ์ พัฒนา', 'ณัฐวุฒิ ยอดเยี่ยม', 'ปรียานุช รุ่งเรือง', 'อนันต์ บุญนำ',
  'ชลธิชา สดใส', 'ธนพล มั่งมี'
];

export const LuckyDrawModal = ({
  isOpen = false,
  onClose = null,
  pin = '',
  hostToken = '',
  players = [],
  leaderboard = [],
  socket = null
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
  const [excludedIds, setExcludedIds] = useState(new Set()); // Specific players removed by host

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
        .split(/[\n,]+/)
        .map(n => n.trim())
        .filter(n => n.length > 0);

      // De-duplicate in manual list
      const uniqueNames = Array.from(new Set(rawNames));

      return uniqueNames
        .map((name, idx) => ({
          id: `manual_${idx}_${name}`,
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
      // Excluded manually by host
      if (excludedIds.has(item.id)) return false;
      // Excluded because won previously
      if (excludePreviousWinners && previousWinnerKeys.has(item.key)) return false;
      // Excluded top 3 from leaderboard
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

  // Spin handler
  const handleStartSpin = () => {
    if (isSpinning || candidatePool.length === 0) return;

    // Pick a random winner index from current candidates
    const chosenIdx = Math.floor(Math.random() * candidatePool.length);
    const chosenWinner = candidatePool[chosenIdx];

    setWinnerIndex(chosenIdx);
    setCurrentWinner(null);
    setIsSpinning(true);

    // Broadcast spin to players if in host mode
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

  // When wheel animation finishes
  const handleSpinEnd = () => {
    setIsSpinning(false);
    if (winnerIndex >= 0 && winnerIndex < candidatePool.length) {
      const winner = candidatePool[winnerIndex];
      setCurrentWinner(winner);

      // Record to history
      const newRecord = {
        ...winner,
        prize: prizeName || 'รางวัลพิเศษ 🎉',
        drawnAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setWinnerHistory(prev => [newRecord, ...prev]);

      // Sound & Confetti celebration
      sfx.playFanfare();
      fireConfetti();
    }
  };

  // When a ball is scooped up from the water pool
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

    // Broadcast spin to players if in host mode
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

  // Re-add winner back to pool (Undo)
  const handleReAddWinner = (indexToRemove) => {
    setWinnerHistory(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Copy winner history to clipboard
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

  // Toggle excluding a specific candidate manually
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

  // Quick sample names
  const handleAddSampleNames = () => {
    const existing = manualText.trim();
    const joined = SAMPLE_NAMES.join('\n');
    setManualText(existing ? `${existing}\n${joined}` : joined);
  };

  // Download CSV Template
  const handleDownloadTemplate = () => {
    const csvContent =
      '\uFEFF' + // UTF-8 BOM for Thai support in Excel
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

  // Import CSV file
  const handleImportCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (!text) return;

        // Parse CSV lines
        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        if (lines.length === 0) return;

        // Skip header if first line looks like header
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

  // Close modal and notify players
  const handleClose = () => {
    if (socket && pin && hostToken) {
      try {
        socket.emit('host_close_lucky_draw', { pin, hostToken });
      } catch (e) {}
    }
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  // Effective host for QR scan
  const joinUrl = `${window.location.origin}/?pin=${pin}`;
  const qrSvgUrl = pin ? generateQRCodeSVG(joinUrl, 200) : '';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '1060px',
          maxHeight: '92vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.8)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 28px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}
            >
              <Gift size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-main, #1E293B)' }}>
                  KAOJAI LUCKY DRAW 🎡
                </h2>
                <span
                  style={{
                    background: '#FEF3C7',
                    color: '#92400E',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    border: '1px solid #FDE68A'
                  }}
                >
                  วงล้อสุ่มผู้โชคดี
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                {pin ? `เซสชันห้อง PIN: ${pin} • สุ่มผู้เรียนในห้องหรือกำหนดรายชื่ออิสระ` : 'โหมดสแตนด์อโลน (Standalone) • สุ่มรายชื่อกิจกรรมทั่วไป'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '12px',
              padding: '8px',
              cursor: 'pointer',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            title="ปิดหน้าต่าง"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: 'row' }}>
          {/* Left Column: Wheel & Spinner Area */}
          <div
            style={{
              flex: '1 1 55%',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F8FAFC',
              borderRight: '1px solid #E2E8F0',
              overflowY: 'auto'
            }}
          >
            {/* Draw Style Switcher Pill */}
            <div style={{ display: 'inline-flex', background: '#E2E8F0', borderRadius: '30px', padding: '4px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setDrawStyle('POOL')}
                style={{
                  padding: '7px 18px',
                  borderRadius: '24px',
                  background: drawStyle === 'POOL' ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' : 'transparent',
                  color: drawStyle === 'POOL' ? '#FFFFFF' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: drawStyle === 'POOL' ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                🌊 ตักลูกบอลในอ่างน้ำ
              </button>
              <button
                type="button"
                onClick={() => setDrawStyle('WHEEL')}
                style={{
                  padding: '7px 18px',
                  borderRadius: '24px',
                  background: drawStyle === 'WHEEL' ? 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)' : 'transparent',
                  color: drawStyle === 'WHEEL' ? '#FFFFFF' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: drawStyle === 'WHEEL' ? '0 2px 8px rgba(234, 88, 12, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                🎡 วงล้อหมุน (Wheel)
              </button>
            </div>

            {/* Prize Input */}
            <div style={{ width: '100%', maxWidth: '440px', marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                🎁 ชื่อของรางวัลรอบนี้:
              </label>
              <input
                type="text"
                value={prizeName}
                onChange={(e) => setPrizeName(e.target.value)}
                placeholder="เช่น รางวัลที่ 1 ทีวี 55 นิ้ว, Starbucks 500.-"
                disabled={isSpinning}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '2px solid #CBD5E1',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#1E293B',
                  outline: 'none',
                  background: '#FFFFFF',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                }}
              />
            </div>

            {/* Game Canvas: Water Pool vs Wheel */}
            {drawStyle === 'POOL' ? (
              <div style={{ margin: '4px 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <LuckyWaterPool
                  candidates={candidatePool}
                  onSelectWinner={handlePoolWinner}
                  isLocked={isSpinning || Boolean(currentWinner)}
                  width={460}
                  height={350}
                />
              </div>
            ) : (
              <>
                <div style={{ margin: '8px 0' }}>
                  <LuckyWheel
                    candidates={candidatePool}
                    isSpinning={isSpinning}
                    winnerIndex={winnerIndex}
                    duration={4500}
                    onSpinEnd={handleSpinEnd}
                    size={380}
                  />
                </div>

                {/* Spin Button */}
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleStartSpin}
                    disabled={isSpinning || candidatePool.length === 0}
                    style={{
                      padding: '14px 44px',
                      borderRadius: '30px',
                      border: 'none',
                      background: candidatePool.length === 0
                        ? '#94A3B8'
                        : 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                      color: '#FFFFFF',
                      fontSize: '1.2rem',
                      fontWeight: 900,
                      cursor: (isSpinning || candidatePool.length === 0) ? 'not-allowed' : 'pointer',
                      boxShadow: candidatePool.length === 0 ? 'none' : '0 8px 20px rgba(234, 88, 12, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transform: isSpinning ? 'scale(0.98)' : 'scale(1)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Sparkles size={22} />
                    {isSpinning ? 'กำลังหมุนวงล้อ... 🎰' : `หมุนวงล้อลุ้นรางวัล! (${candidatePool.length} คน)`}
                  </button>

                  {candidatePool.length === 0 && (
                    <span style={{ fontSize: '0.85rem', color: '#DC2626', fontWeight: 600 }}>
                      ⚠️ ไม่มีรายชื่อในวงล้อ กรุณาเพิ่มรายชื่อหรือปลดล็อกตัวกรอง
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Column: Settings, Pool Management & Winner History */}
          <div
            style={{
              flex: '1 1 45%',
              display: 'flex',
              flexDirection: 'column',
              background: '#FFFFFF',
              overflowY: 'auto'
            }}
          >
            {/* Tabs Header */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid #E2E8F0',
                background: '#F8FAFC',
                padding: '8px 12px 0',
                gap: '6px'
              }}
            >
              {pin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('ROOM')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px 12px 0 0',
                    border: 'none',
                    background: activeTab === 'ROOM' ? '#FFFFFF' : 'transparent',
                    color: activeTab === 'ROOM' ? '#EA580C' : '#64748B',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderTop: activeTab === 'ROOM' ? '2px solid #EA580C' : '2px solid transparent'
                  }}
                >
                  <Users size={16} /> ผู้เล่นในห้อง ({players?.length || 0})
                </button>
              )}

              {pin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('QR')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px 12px 0 0',
                    border: 'none',
                    background: activeTab === 'QR' ? '#FFFFFF' : 'transparent',
                    color: activeTab === 'QR' ? '#EA580C' : '#64748B',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderTop: activeTab === 'QR' ? '2px solid #EA580C' : '2px solid transparent'
                  }}
                >
                  <QrCode size={16} /> QR สแกนร่วมสนุก
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('MANUAL')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px 12px 0 0',
                  border: 'none',
                  background: activeTab === 'MANUAL' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'MANUAL' ? '#EA580C' : '#64748B',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderTop: activeTab === 'MANUAL' ? '2px solid #EA580C' : '2px solid transparent'
                }}
              >
                <FileSpreadsheet size={16} /> กรอกเอง / CSV
              </button>
            </div>

            {/* Tab Contents */}
            <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* TAB 1: ROOM PLAYERS */}
              {activeTab === 'ROOM' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155' }}>
                      รายชื่อผู้เล่นที่ Join เข้ามา ({players?.length || 0} คน)
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      อยู่ในวงล้อ: <strong style={{ color: '#EA580C' }}>{candidatePool.length}</strong> คน
                    </span>
                  </div>

                  {/* Candidates Badge Grid */}
                  <div
                    style={{
                      maxHeight: '160px',
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
                    {players?.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', width: '100%', color: '#94A3B8', fontSize: '0.85rem' }}>
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
                              padding: '4px 8px',
                              borderRadius: '20px',
                              fontSize: '0.78rem',
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
                              style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }}
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
                              {isExcluded ? <RotateCcw size={13} /> : <X size={13} />}
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
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>
                    📱 สแกน QR Code เพื่อส่งชื่อเข้าร่วมลุ้นรางวัล!
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 12px' }}>
                    เปิดจอใหญ่ให้คนในงานสแกนด้วยกล้องมือถือ พิมพ์ชื่อแล้วชื่อจะเข้ามาในวงล้อทันที
                  </p>

                  <div style={{ display: 'inline-block', padding: '12px', background: '#FFFFFF', borderRadius: '16px', border: '2px solid #F59E0B', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)' }}>
                    {qrSvgUrl && (
                      <img src={qrSvgUrl} alt="Lucky Draw QR Code" style={{ width: '160px', height: '160px', display: 'block' }} />
                    )}
                  </div>

                  <div style={{ marginTop: '10px', fontSize: '1.2rem', fontWeight: 900, color: '#EA580C', letterSpacing: '2px' }}>
                    PIN: {pin}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px', color: '#059669', fontSize: '0.78rem', fontWeight: 700 }}>
                    <ShieldAlert size={14} /> ระบบป้องกันชื่อซ้ำ: 1 เครื่อง = 1 สิทธิ์อัตโนมัติ
                  </div>
                </div>
              )}

              {/* TAB 3: MANUAL & CSV */}
              {activeTab === 'MANUAL' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155' }}>
                      รายชื่อผู้ร่วมกิจกรรม (พิมพ์ หรือ วางชื่อ):
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={handleAddSampleNames}
                        style={{
                          background: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          color: '#1D4ED8',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        สุ่มตัวอย่าง
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualText('')}
                        style={{
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          color: '#DC2626',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ล้างรายชื่อ
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="พิมพ์ชื่อ หรือ คัดลอกวางรายชื่อ (บรรทัดละชื่อ หรือ คั่นด้วยจุลภาค , )&#10;เช่น:&#10;สมชาย ใจดี&#10;สมศรี มีทรัพย์"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '12px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />

                  {/* CSV Actions Toolbar */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
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
                        padding: '7px 10px',
                        borderRadius: '10px',
                        background: '#F0FDF4',
                        border: '1px solid #86EFAC',
                        color: '#166534',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Upload size={14} /> นำเข้าไฟล์ CSV
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: '10px',
                        background: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        color: '#475569',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Download size={14} /> โหลด Template CSV
                    </button>
                  </div>
                </div>
              )}

              {/* Filter Toggles (Freely Toggleable) */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: '14px',
                  padding: '12px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders size={14} /> ตัวเลือกการคัดกรอง (เปิด-ปิดได้อิสระ)
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#1E293B', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={excludePreviousWinners}
                    onChange={(e) => setExcludePreviousWinners(e.target.checked)}
                    style={{ accentColor: '#EA580C', width: '16px', height: '16px' }}
                  />
                  <span>
                    <strong>ตัดผู้ที่ได้รับรางวัลไปแล้ว</strong> (ป้องกันคนเดิมได้ซ้ำ)
                  </span>
                </label>

                {pin && leaderboard && leaderboard.length >= 3 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#1E293B', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={excludeTop3}
                      onChange={(e) => setExcludeTop3(e.target.checked)}
                      style={{ accentColor: '#EA580C', width: '16px', height: '16px' }}
                    />
                    <span>
                      <strong>ตัด 3 อันดับแรก (Top 3) จาก Quiz</strong> (สำหรับแจกรางวัลปลอบใจ)
                    </span>
                  </label>
                )}
              </div>

              {/* Winner History Section */}
              <div style={{ marginTop: 'auto', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Trophy size={16} color="#F59E0B" /> ประวัติผู้ได้รับรางวัล ({winnerHistory.length} รางวัล)
                  </div>
                  {winnerHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={handleCopyHistory}
                      style={{
                        background: '#F1F5F9',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: copiedHistory ? '#16A34A' : '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedHistory ? <Check size={12} /> : <Copy size={12} />}
                      {copiedHistory ? 'คัดลอกแล้ว!' : 'คัดลอก'}
                    </button>
                  )}
                </div>

                <div
                  style={{
                    maxHeight: '120px',
                    overflowY: 'auto',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    fontSize: '0.78rem'
                  }}
                >
                  {winnerHistory.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#94A3B8' }}>
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
                          padding: '6px 10px',
                          borderBottom: idx < winnerHistory.length - 1 ? '1px solid #F1F5F9' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, color: '#F59E0B' }}>#{winnerHistory.length - idx}</span>
                          <span style={{ fontWeight: 700, color: '#1E293B' }}>{item.name}</span>
                          <span style={{ color: '#64748B', fontSize: '0.72rem' }}>({item.prize})</span>
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
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          <RotateCcw size={11} /> คืนสิทธิ์
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Winner Spotlight Card Modal */}
      {currentWinner && !isSpinning && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
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
              maxWidth: '460px',
              backgroundColor: '#FFFFFF',
              borderRadius: '28px',
              padding: '36px 28px',
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
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                color: '#D97706',
                boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)',
                marginBottom: '16px'
              }}
            >
              <Trophy size={40} />
            </div>

            <div style={{ color: '#D97706', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>
              🎉 CONGRATULATIONS 🎉
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#475569', margin: '4px 0 16px' }}>
              ขอแสดงความยินดีกับผู้โชคดี!
            </h3>

            {currentWinner.avatar && (
              <img
                src={`/avatars/${currentWinner.avatar}`}
                alt={currentWinner.name}
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  border: '4px solid #F59E0B',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                  marginBottom: '12px',
                  objectFit: 'cover'
                }}
              />
            )}

            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1E293B', marginBottom: '8px' }}>
              {currentWinner.name}
            </div>

            <div
              style={{
                display: 'inline-block',
                background: '#FFF7ED',
                border: '1px solid #FFEDD5',
                color: '#EA580C',
                padding: '8px 20px',
                borderRadius: '20px',
                fontWeight: 800,
                fontSize: '1rem',
                marginBottom: '24px'
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
                  padding: '14px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)'
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
