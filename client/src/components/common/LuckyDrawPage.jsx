import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LuckyWaterPool } from './LuckyWaterPool';
import { SoundToggle } from './SoundToggle';
import { LanguageToggle } from './LanguageToggle';
import { useI18n } from '../../context/I18nContext';
import { generateQRCodeSVG } from '../../utils/qrcode';
import { fireConfetti } from '../../utils/confetti';
import { sfx } from '../../utils/audioSFX';
import {
  Gift, Trophy, Users, QrCode, FileSpreadsheet, Download, Upload,
  RotateCcw, Sparkles, X, Check, Copy, Trash2, ArrowLeft, ShieldAlert,
  Sliders, Award, RefreshCw, ChevronRight, Maximize2, Lock, Unlock, Link2, Plus, Minus, Music
} from 'lucide-react';

export const LuckyDrawPage = ({
  pin = '',
  hostToken = '',
  players = [],
  leaderboard = [],
  socket = null,
  onBack = null
}) => {
  const { t } = useI18n();
  // Real-time Room & QR session state
  const [activePin, setActivePin] = useState(pin);
  const [activeHostToken, setActiveHostToken] = useState(hostToken);
  const [livePlayers, setLivePlayers] = useState(players || []);
  const [isQrFullscreen, setIsQrFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRegistrationLocked, setIsRegistrationLocked] = useState(false);
  const [autoLockOnDraw, setAutoLockOnDraw] = useState(true);
  const [serverHost, setServerHost] = useState(null);
  const [isBgmPlaying, setIsBgmPlaying] = useState(() => sfx.isLuckyDrawBGMPlaying());

  const handleToggleBgm = () => {
    sfx.unlock();
    const playing = sfx.toggleLuckyDrawBGM();
    setIsBgmPlaying(playing);
  };

  useEffect(() => {
    const unsub = sfx.subscribe((isMuted) => {
      if (isMuted) {
        setIsBgmPlaying(false);
      }
    });
    return () => {
      unsub();
      sfx.stopLuckyDrawBGM();
    };
  }, []);

  // Tabs: 'QR' | 'MANUAL' | 'ROOM'
  const [activeTab, setActiveTab] = useState(() => (players && players.length > 0 ? 'ROOM' : 'QR'));

  // Prize configuration: 'MANUAL' | 'PRESET'
  const [prizeMode, setPrizeMode] = useState('MANUAL');
  const [manualPrizeEnabled, setManualPrizeEnabled] = useState(true);
  const [prizeName, setPrizeName] = useState('รางวัลพิเศษ 🎉');

  // Preset Prizes Inventory
  const [presetPrizes, setPresetPrizes] = useState(() => {
    try {
      const saved = localStorage.getItem('kaojai_lucky_presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      { id: 'prize_1', name: 'รางวัลที่ 1: แท็บเล็ต iPad 10th Gen', totalCount: 1, remainingCount: 1 },
      { id: 'prize_2', name: 'รางวัลที่ 2: หูฟังไร้สาย Wireless Earbuds', totalCount: 2, remainingCount: 2 },
      { id: 'prize_3', name: 'รางวัลที่ 3: กระบอกน้ำเก็บความเย็น', totalCount: 5, remainingCount: 5 }
    ];
  });
  const [activePresetPrizeId, setActivePresetPrizeId] = useState(() => {
    try {
      const saved = localStorage.getItem('kaojai_lucky_presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
      }
    } catch (e) {}
    return 'prize_1';
  });
  const [isPrizeManagerOpen, setIsPrizeManagerOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetCount, setNewPresetCount] = useState(1);

  useEffect(() => {
    try {
      localStorage.setItem('kaojai_lucky_presets', JSON.stringify(presetPrizes));
    } catch (e) {}
  }, [presetPrizes]);

  const currentWinnerRef = useRef(null);
  const [currentWinner, setCurrentWinner] = useState(null);
  const [winnerHistory, setWinnerHistory] = useState([]);
  const [copiedHistory, setCopiedHistory] = useState(false);

  const currentActivePreset = useMemo(() => {
    return presetPrizes.find(p => p.id === activePresetPrizeId) || presetPrizes[0] || null;
  }, [presetPrizes, activePresetPrizeId]);

  const handleAddPreset = (e) => {
    e?.preventDefault();
    if (!newPresetName.trim()) return;
    const count = Math.max(1, parseInt(newPresetCount, 10) || 1);
    const newPrize = {
      id: `prize_${Date.now()}`,
      name: newPresetName.trim(),
      totalCount: count,
      remainingCount: count
    };
    setPresetPrizes(prev => [...prev, newPrize]);
    setActivePresetPrizeId(newPrize.id);
    setNewPresetName('');
    setNewPresetCount(1);
  };

  const handleRemovePreset = (id) => {
    setPresetPrizes(prev => {
      const filtered = prev.filter(p => p.id !== id);
      if (activePresetPrizeId === id && filtered.length > 0) {
        setActivePresetPrizeId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleAdjustRemaining = (id, delta) => {
    setPresetPrizes(prev => prev.map(p => {
      if (p.id === id) {
        const next = Math.max(0, Math.min(p.totalCount, p.remainingCount + delta));
        return { ...p, remainingCount: next };
      }
      return p;
    }));
  };

  const handleResetAllStock = () => {
    setPresetPrizes(prev => prev.map(p => ({ ...p, remainingCount: p.totalCount })));
  };

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

  // Sync activePin / activeHostToken with props
  useEffect(() => {
    if (pin) setActivePin(pin);
  }, [pin]);

  useEffect(() => {
    if (hostToken) setActiveHostToken(hostToken);
  }, [hostToken]);

  useEffect(() => {
    if (players && players.length > 0) {
      setLivePlayers(players);
    }
  }, [players]);

  const isCreatingRoomRef = useRef(false);

  useEffect(() => {
    if (activePin) {
      isCreatingRoomRef.current = true;
    }
  }, [activePin]);

  // If activeTab is QR and no activePin yet, auto-create a room via socket
  useEffect(() => {
    if (activeTab === 'QR' && !activePin && socket && !isCreatingRoomRef.current) {
      isCreatingRoomRef.current = true;
      socket.emit('create_room', {
        title: 'KaoJai Lucky Draw Event',
        questions: [],
        mode: 'LUCKY_DRAW',
        isLuckyDraw: true
      }, (res) => {
        if (res && res.success) {
          setActivePin(res.pin);
          setActiveHostToken(res.hostToken);
        } else {
          isCreatingRoomRef.current = false;
        }
      });
    }
  }, [activeTab, activePin, socket]);

  // Fetch actual LAN IP or domain from server for mobile QR scanning
  useEffect(() => {
    fetch('/api/server-info')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          const clientPort = window.location.port ? `:${window.location.port}` : '';
          if (data.configuredHost) {
            setServerHost(data.configuredHost);
          } else if (data.localIp && data.localIp !== 'localhost' && data.localIp !== '127.0.0.1') {
            setServerHost(`${data.localIp}${clientPort}`);
          }
        }
      })
      .catch(err => console.error('LuckyDraw fetch server info error:', err));
  }, []);

  // Real-time socket listener for attendees joining room via QR
  useEffect(() => {
    if (!socket || !activePin) return;

    const handleRoomUpdated = (data) => {
      if (data && Array.isArray(data.players)) {
        setLivePlayers(data.players);
      }
    };

    socket.on('room_updated', handleRoomUpdated);
    return () => {
      socket.off('room_updated', handleRoomUpdated);
    };
  }, [socket, activePin]);

  // Real-time registration lock listener and initial status fetch
  useEffect(() => {
    if (!socket || !activePin) return;

    socket.emit('get_luckydraw_status', { pin: activePin }, (res) => {
      if (res && typeof res.isLocked === 'boolean') {
        setIsRegistrationLocked(res.isLocked);
      }
    });

    const handleLockUpdated = (data) => {
      if (data && typeof data.isLocked === 'boolean') {
        setIsRegistrationLocked(data.isLocked);
      }
    };

    socket.on('luckydraw_lock_updated', handleLockUpdated);
    return () => {
      socket.off('luckydraw_lock_updated', handleLockUpdated);
    };
  }, [socket, activePin]);

  const handleToggleRegistrationLock = (newLockedState) => {
    const nextVal = (typeof newLockedState === 'boolean') ? newLockedState : !isRegistrationLocked;
    setIsRegistrationLocked(nextVal);
    if (socket && activePin && activeHostToken) {
      socket.emit('host_toggle_luckydraw_lock', {
        pin: activePin,
        hostToken: activeHostToken,
        isLocked: nextVal
      });
    }
  };

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

    // QR or ROOM tab -> use live players joined/scanned into the room
    const pool = (livePlayers || []).map(p => ({
      id: p.playerId,
      name: p.name || 'Anonymous',
      avatar: p.avatar || '0291dcc0ce.svg',
      key: (p.playerId || p.name).toLowerCase()
    }));

    return pool.filter(item => {
      if (excludedIds.has(item.id)) return false;
      if (excludePreviousWinners && previousWinnerKeys.has(item.key)) return false;
      if (activeTab === 'ROOM' && excludeTop3 && top3PlayerIds.has(item.id)) return false;
      return true;
    });
  }, [
    activeTab,
    manualText,
    livePlayers,
    excludedIds,
    excludePreviousWinners,
    excludeTop3,
    top3PlayerIds,
    previousWinnerKeys
  ]);


  // Water Pool Ball Scoop handler
  const handlePoolWinner = (winnerCand) => {
    if (!winnerCand) return;

    let effectivePrize = '';
    if (prizeMode === 'PRESET') {
      const currentPreset = currentActivePreset;
      effectivePrize = currentPreset ? currentPreset.name : (prizeName || 'รางวัลพิเศษ 🎉');

      // Auto-decrement stock for preset prize
      if (currentPreset && currentPreset.remainingCount > 0) {
        setPresetPrizes(prev => {
          const nextStock = Math.max(0, currentPreset.remainingCount - 1);
          const updated = prev.map(p => p.id === currentPreset.id ? { ...p, remainingCount: nextStock } : p);
          // If this prize just ran out, auto-advance to next prize that still has stock
          if (nextStock === 0) {
            const nextAvailable = updated.find(p => p.id !== currentPreset.id && p.remainingCount > 0);
            if (nextAvailable) {
              setActivePresetPrizeId(nextAvailable.id);
            }
          }
          return updated;
        });
      }
    } else {
      effectivePrize = manualPrizeEnabled
        ? (prizeName.trim() || 'รางวัลพิเศษ 🎉')
        : 'ผู้โชคดี (ไม่ระบุของรางวัล)';
    }

    const winnerWithPrize = {
      ...winnerCand,
      prize: effectivePrize
    };

    setCurrentWinner(winnerWithPrize);

    const newRecord = {
      ...winnerWithPrize,
      drawnAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setWinnerHistory(prev => [newRecord, ...prev]);

    sfx.playFanfare();
    fireConfetti();

    if (autoLockOnDraw && !isRegistrationLocked) {
      handleToggleRegistrationLock(true);
    }

    if (socket && activePin && activeHostToken) {
      try {
        socket.emit('host_spin_lucky_draw', {
          pin: activePin,
          hostToken: activeHostToken,
          prizeName: effectivePrize,
          winner: {
            id: winnerCand.id,
            name: winnerCand.name,
            avatar: winnerCand.avatar
          },
          candidateNames: candidatePool.map(c => c.name),
          durationMs: 2400,
          drawStyle: 'POOL'
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
    sfx.stopLuckyDrawBGM();
    if (socket && activePin && activeHostToken) {
      try {
        socket.emit('host_close_lucky_draw', { pin: activePin, hostToken: activeHostToken });
      } catch (e) {}
    }
    if (onBack) onBack();
  };

  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const effectiveHost = (!isLocalhost || !serverHost) ? (typeof window !== 'undefined' ? window.location.host : '') : serverHost;
  const joinUrl = typeof window !== 'undefined' && activePin ? `${window.location.protocol}//${effectiveHost}/?pin=${activePin}&luckydraw=1` : '';
  const qrSvgUrl = activePin ? generateQRCodeSVG(joinUrl, 260) : '';

  const handleCopyJoinLink = () => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(() => {});
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Bar */}
      <header className="luckydraw-header">
        <div className="luckydraw-header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', flex: '1 1 auto', minWidth: 0 }}>
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
              transition: 'all 0.2s',
              flexShrink: 0
            }}
          >
            <ArrowLeft size={18} /> {t('backToRoles', 'กลับสู่หน้าหลัก')}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 auto' }}>
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
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                flexShrink: 0
              }}
            >
              <Gift size={24} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 2.5vw, 1.45rem)', fontWeight: 900, color: 'var(--text-main, #1E293B)', letterSpacing: '0.5px', wordBreak: 'break-word' }}>
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
                    border: '1px solid #FDE68A',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ระบบสุ่มผู้โชคดีเต็มจอ
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748B', wordBreak: 'break-word' }}>
                {activePin ? `เชื่อมต่อห้องกิจกรรม PIN: ${activePin} • สแกน QR หรือกรอกรายชื่อเพื่อร่วมลุ้น` : 'โหมดอิสระ (Standalone) • สุ่มรายชื่อสำหรับงานสัมมนา ปาร์ตี้บริษัท'}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flexShrink: 0 }}>
          {activePin && (
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
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#EA580C', letterSpacing: '2px' }}>{activePin}</span>
            </div>
          )}

          {/* Lucky Draw BGM Toggle Button */}
          <button
            type="button"
            onClick={handleToggleBgm}
            title={isBgmPlaying ? 'ปิดเสียงดนตรีประกอบ Lucky Draw' : 'เปิดเสียงดนตรีประกอบ Lucky Draw'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '24px',
              background: isBgmPlaying ? '#FFF7ED' : '#F1F5F9',
              border: `1.5px solid ${isBgmPlaying ? '#FDBA74' : '#CBD5E1'}`,
              color: isBgmPlaying ? '#C2410C' : '#64748B',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: isBgmPlaying ? '0 2px 8px rgba(245, 158, 11, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Music size={15} color={isBgmPlaying ? '#EA580C' : '#64748B'} />
            <span>{isBgmPlaying ? '🎵 ดนตรี: กำลังเล่น' : '🔇 ดนตรี: ปิดอยู่'}</span>
          </button>

          <LanguageToggle />
          <SoundToggle />
        </div>
      </header>

      {/* Main Container - Full-width 2-Column Responsive Layout */}
      <main style={{ flex: 1, padding: 'clamp(16px, 2.5vw, 24px)', maxWidth: '1440px', width: '100%', margin: '0 auto', boxSizing: 'border-box', overflowX: 'hidden' }}>
        <div className="luckydraw-arena-grid">
          
          {/* LEFT COLUMN: THE ARENA STAGE (Water Pool Stage & Prize Input) */}
          <div
            className="glass-card"
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: 'clamp(16px, 3vw, 28px)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '1px solid #E2E8F0',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              minWidth: 0,
              overflow: 'hidden'
            }}
          >
            {/* Dual Prize Mode Selector: Manual vs Preset */}
            <div style={{ width: '100%', maxWidth: '600px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '3px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <button
                    type="button"
                    onClick={() => setPrizeMode('MANUAL')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '9px',
                      border: 'none',
                      background: prizeMode === 'MANUAL' ? '#FFFFFF' : 'transparent',
                      color: prizeMode === 'MANUAL' ? '#EA580C' : '#64748B',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      boxShadow: prizeMode === 'MANUAL' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Gift size={14} /> ใส่ชื่อรางวัลเอง / ไม่ระบุ
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrizeMode('PRESET')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '9px',
                      border: 'none',
                      background: prizeMode === 'PRESET' ? '#FFFFFF' : 'transparent',
                      color: prizeMode === 'PRESET' ? '#EA580C' : '#64748B',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      boxShadow: prizeMode === 'PRESET' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Sliders size={14} /> ตั้งค่ารางวัลล่วงหน้า ({presetPrizes.length})
                  </button>
                </div>

                {prizeMode === 'PRESET' && (
                  <button
                    type="button"
                    onClick={() => setIsPrizeManagerOpen(true)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '10px',
                      background: '#FFF7ED',
                      border: '1px solid #FDBA74',
                      color: '#C2410C',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Sliders size={13} /> จัดการคลังรางวัล
                  </button>
                )}
              </div>

              {/* Mode 1: MANUAL (Optional Name or Custom Input) */}
              {prizeMode === 'MANUAL' && (
                <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🎁 ชื่อของรางวัลรอบนี้:
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748B', cursor: 'pointer', fontWeight: 700 }}>
                      <input
                        type="checkbox"
                        checked={manualPrizeEnabled}
                        onChange={(e) => setManualPrizeEnabled(e.target.checked)}
                        style={{ accentColor: '#EA580C', cursor: 'pointer' }}
                      />
                      ระบุชื่อของรางวัล
                    </label>
                  </div>

                  {manualPrizeEnabled ? (
                    <input
                      type="text"
                      value={prizeName}
                      onChange={(e) => setPrizeName(e.target.value)}
                      placeholder="เช่น รางวัลที่ 1 ทีวี 55 นิ้ว, Gift Voucher 500.- (หรือเว้นว่างได้)"
                      disabled={Boolean(currentWinner)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#1E293B',
                        outline: 'none',
                        background: '#F8FAFC',
                        boxSizing: 'border-box'
                      }}
                    />
                  ) : (
                    <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: '12px', fontSize: '0.86rem', color: '#64748B', fontStyle: 'italic', border: '1px dashed #CBD5E1' }}>
                      ✨ ไม่ระบุชื่อของรางวัล (สุ่มเฉพาะผู้โชคดี)
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: PRESET (Advance Inventory & Stock) */}
              {prizeMode === 'PRESET' && (
                <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: '16px', border: '1.5px solid #FDBA74', boxShadow: '0 2px 10px rgba(234, 88, 12, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#C2410C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🎁 รางวัลที่กำลังสุ่มในรอบนี้:
                    </span>
                    {currentActivePreset && (
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '10px',
                        background: currentActivePreset.remainingCount > 0 ? '#DCFCE7' : '#FEE2E2',
                        color: currentActivePreset.remainingCount > 0 ? '#15803D' : '#B91C1C',
                        border: currentActivePreset.remainingCount > 0 ? '1px solid #BBF7D0' : '1px solid #FECACA'
                      }}>
                        {currentActivePreset.remainingCount > 0
                          ? `คงเหลือ ${currentActivePreset.remainingCount} / ${currentActivePreset.totalCount} ชิ้น`
                          : '❌ รางวัลหมดแล้ว (0 ชิ้น)'}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={activePresetPrizeId}
                      onChange={(e) => setActivePresetPrizeId(e.target.value)}
                      disabled={Boolean(currentWinner)}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1.5px solid #FDBA74',
                        fontSize: '0.96rem',
                        fontWeight: 800,
                        color: '#1E293B',
                        background: '#FFF7ED',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {presetPrizes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.remainingCount > 0 ? `(เหลือ ${p.remainingCount}/${p.totalCount})` : '— หมดแล้ว'}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setIsPrizeManagerOpen(true)}
                      title="แก้ไข / เพิ่มของรางวัล"
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        color: '#475569',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0
                      }}
                    >
                      <Plus size={15} /> เพิ่ม/จัดการ
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* The Main Arena Stage Canvas */}
            <div style={{ width: '100%', maxWidth: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '380px', overflow: 'hidden' }}>
              <LuckyWaterPool
                candidates={candidatePool}
                onSelectWinner={handlePoolWinner}
                isLocked={Boolean(currentWinner)}
                width={600}
                height={440}
              />
            </div>

            {candidatePool.length === 0 && (
              <div style={{ marginTop: '12px', fontSize: '0.9rem', color: '#DC2626', fontWeight: 700 }}>
                ⚠️ ไม่มีรายชื่อผู้มีสิทธิ์ลุ้นรางวัล กรุณาเพิ่มรายชื่อในแผงด้านขวา หรือปลดล็อกตัวกรอง
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: CONTROL PANEL, CANDIDATES & WINNER HISTORY */}
          <div
            className="glass-card"
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: 'clamp(16px, 2.5vw, 24px)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              minWidth: 0,
              overflow: 'hidden'
            }}
          >
            {/* Candidate Source Tabs */}
            <div>
              <div
                style={{
                  display: 'flex',
                  borderBottom: '2px solid #F1F5F9',
                  gap: '6px',
                  paddingBottom: '4px',
                  alignItems: 'stretch',
                  flexWrap: 'wrap'
                }}
              >
                {/* TAB 1: QR LIVE REGISTRATION (Always Available) */}
                <button
                  type="button"
                  onClick={() => setActiveTab('QR')}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '8px 8px',
                    borderRadius: '12px',
                    border: 'none',
                    background: activeTab === 'QR' ? '#FFF7ED' : 'transparent',
                    color: activeTab === 'QR' ? '#EA580C' : '#64748B',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease'
                  }}
                  title="ลงทะเบียนผ่าน QR Code"
                >
                  <QrCode size={16} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    QR สแกน ({activeTab === 'QR' ? candidatePool.length : livePlayers.length})
                  </span>
                </button>

                {/* TAB 2: MANUAL & CSV */}
                <button
                  type="button"
                  onClick={() => setActiveTab('MANUAL')}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '8px 8px',
                    borderRadius: '12px',
                    border: 'none',
                    background: activeTab === 'MANUAL' ? '#FFF7ED' : 'transparent',
                    color: activeTab === 'MANUAL' ? '#EA580C' : '#64748B',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease'
                  }}
                  title="กรอกรายชื่อเอง หรือนำเข้าไฟล์ CSV"
                >
                  <FileSpreadsheet size={16} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    กรอกเอง / CSV
                  </span>
                </button>

                {/* TAB 3: QUIZ ROOM PLAYERS (if opened from Quiz Room) */}
                {pin && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('ROOM')}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '8px 8px',
                      borderRadius: '12px',
                      border: 'none',
                      background: activeTab === 'ROOM' ? '#FFF7ED' : 'transparent',
                      color: activeTab === 'ROOM' ? '#EA580C' : '#64748B',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease'
                    }}
                    title="ผู้เรียนจากห้องสอบปัจจุบัน"
                  >
                    <Users size={16} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      ห้องสอบ ({players?.length || 0})
                    </span>
                  </button>
                )}
              </div>

              {/* Source Tab Contents */}
              <div style={{ marginTop: '16px' }}>
                {/* TAB: QR LIVE REGISTRATION */}
                {activeTab === 'QR' && (
                  <div>
                    <div style={{ textAlign: 'center', padding: '6px 0 14px' }}>
                      <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#1E293B', marginBottom: '4px' }}>
                        📱 สแกน QR เพื่อลงทะเบียนลุ้นรางวัล Lucky Draw!
                      </div>
                      <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 12px' }}>
                        เปิดจอใหญ่ให้คนในงานสแกนด้วยกล้องมือถือ พิมพ์ชื่อแล้วชื่อจะเข้ามาในอ่างลุ้นรางวัลทันที
                      </p>

                      {/* QR Display Card */}
                      <div style={{
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '16px',
                        background: '#FFFFFF',
                        borderRadius: '24px',
                        border: '2px solid #F59E0B',
                        boxShadow: '0 8px 24px rgba(245, 158, 11, 0.16)'
                      }}>
                        {qrSvgUrl ? (
                          <img src={qrSvgUrl} alt="Lucky Draw QR Code" style={{ width: '190px', height: '190px', display: 'block' }} />
                        ) : (
                          <div style={{ width: '190px', height: '190px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                            กำลังสร้าง QR Code...
                          </div>
                        )}

                        <div style={{ marginTop: '10px', fontSize: '1.45rem', fontWeight: 900, color: '#EA580C', letterSpacing: '3px' }}>
                          PIN: {activePin || '...'}
                        </div>

                        {/* Direct clickable join link */}
                        {joinUrl && (
                          <div
                            onClick={handleCopyJoinLink}
                            title="คลิกเพื่อคัดลอกลิงก์"
                            style={{
                              marginTop: '8px',
                              padding: '5px 10px',
                              borderRadius: '8px',
                              background: copiedLink ? '#DCFCE7' : '#F8FAFC',
                              border: `1px solid ${copiedLink ? '#86EFAC' : '#E2E8F0'}`,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              maxWidth: '210px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Link2 size={12} color={copiedLink ? '#15803D' : '#64748B'} />
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: copiedLink ? '#15803D' : '#2563EB',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {joinUrl}
                            </span>
                            {copiedLink ? <Check size={12} color="#15803D" /> : <Copy size={12} color="#64748B" />}
                          </div>
                        )}
                      </div>

                      {/* Action buttons: Projector Fullscreen & Copy Link */}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setIsQrFullscreen(true)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '12px',
                            background: '#FFF7ED',
                            border: '1.5px solid #FDBA74',
                            color: '#C2410C',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Maximize2 size={15} /> ฉาย QR เต็มจอ (โปรเจกเตอร์)
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyJoinLink}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '12px',
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            color: copiedLink ? '#16A34A' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {copiedLink ? <Check size={15} /> : <Copy size={15} />}
                          {copiedLink ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px', color: '#059669', fontSize: '0.8rem', fontWeight: 700 }}>
                        <ShieldAlert size={15} /> ป้องกันชื่อซ้ำ: 1 เครื่อง = 1 สิทธิ์ลงทะเบียน
                      </div>

                      {/* Registration Status Toggle Bar */}
                      <div style={{
                        marginTop: '14px',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        background: isRegistrationLocked ? '#FEF2F2' : '#F0FDF4',
                        border: `1.5px solid ${isRegistrationLocked ? '#FECACA' : '#BBF7D0'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              background: isRegistrationLocked ? '#EF4444' : '#22C55E',
                              boxShadow: isRegistrationLocked ? '0 0 8px #EF4444' : '0 0 8px #22C55E'
                            }} />
                            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: isRegistrationLocked ? '#991B1B' : '#166534' }}>
                              {isRegistrationLocked ? '🔒 ปิดรับลงทะเบียนแล้ว' : '🟢 กำลังเปิดรับลงทะเบียน'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleRegistrationLock(!isRegistrationLocked)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '10px',
                              border: 'none',
                              background: isRegistrationLocked ? '#DC2626' : '#16A34A',
                              color: '#FFFFFF',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                            }}
                          >
                            {isRegistrationLocked ? <Unlock size={14} /> : <Lock size={14} />}
                            {isRegistrationLocked ? 'เปิดรับใหม่' : 'ปิดรับลงทะเบียน'}
                          </button>
                        </div>

                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.78rem',
                          color: '#64748B',
                          cursor: 'pointer',
                          width: '100%',
                          justifyContent: 'flex-start'
                        }}>
                          <input
                            type="checkbox"
                            checked={autoLockOnDraw}
                            onChange={(e) => setAutoLockOnDraw(e.target.checked)}
                            style={{ accentColor: '#EA580C', width: '15px', height: '15px' }}
                          />
                          <span>ปิดรับลงทะเบียนอัตโนมัติเมื่อเริ่มจับรางวัล (Auto-Lock)</span>
                        </label>
                      </div>
                    </div>

                    {/* Live Registered Attendees List */}
                    <div style={{ marginTop: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155' }}>
                          รายชื่อผู้ลงทะเบียน ({candidatePool.length} คน)
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} /> Live อัปเดตสด
                        </span>
                      </div>

                      <div
                        style={{
                          maxHeight: '180px',
                          overflowY: 'auto',
                          border: '1px solid #E2E8F0',
                          borderRadius: '14px',
                          padding: '8px',
                          background: '#F8FAFC',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px'
                        }}
                      >
                        {livePlayers.length === 0 ? (
                          <div style={{ padding: '16px', textAlign: 'center', width: '100%', color: '#94A3B8', fontSize: '0.85rem' }}>
                            ยังไม่มีผู้ลงทะเบียนผ่าน QR (เปิดให้ผู้ร่วมงานสแกน QR ได้เลย!)
                          </div>
                        ) : (
                          livePlayers.map(p => {
                            const isExcluded = excludedIds.has(p.playerId) ||
                              (excludePreviousWinners && previousWinnerKeys.has((p.playerId || p.name).toLowerCase()));

                            return (
                              <div
                                key={p.playerId}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  fontSize: '0.8rem',
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
                                  title={isExcluded ? 'นำกลับเข้าอ่างลุ้นรางวัล' : 'คัดชื่อนี้ออกจากอ่าง'}
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
                  </div>
                )}

                {/* TAB 1: ROOM PLAYERS */}
                {activeTab === 'ROOM' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155' }}>
                        รายชื่อผู้เล่นที่ Join ({players?.length || 0} คน)
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                        อยู่ในอ่างลุ้นรางวัล: <strong style={{ color: '#EA580C' }}>{candidatePool.length}</strong> คน
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
                                title={isExcluded ? 'นำกลับเข้าอ่างลุ้นรางวัล' : 'คัดชื่อนี้ออกจากอ่าง'}
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

                {/* TAB 3: MANUAL & CSV */}
                {activeTab === 'MANUAL' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155' }}>
                        รายชื่อผู้ร่วมกิจกรรม ({candidatePool.length} คน):
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setManualText('');
                            setExcludedIds(new Set());
                            setWinnerHistory([]);
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
                          title="ล้างรายชื่อและรีเซ็ตประวัติผู้ได้รับรางวัล"
                        >
                          ล้างรายชื่อ & ประวัติ
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
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setWinnerHistory([])}
                      style={{
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#DC2626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="ล้างประวัติผู้ได้รับรางวัลทั้งหมด"
                    >
                      <Trash2 size={13} />
                      ล้างประวัติ
                    </button>
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
                  </div>
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
                        title="คืนสิทธิ์เข้าอ่างลุ้นรางวัล"
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
      {currentWinner && (
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
          onClick={(e) => {
            if (e.target === e.currentTarget) setCurrentWinner(null);
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
              animation: 'scaleIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              position: 'relative'
            }}
          >
            {/* Close button X in top-right */}
            <button
              type="button"
              onClick={() => setCurrentWinner(null)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B'
              }}
              title="ปิด"
            >
              <X size={18} />
            </button>
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

            <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', fontWeight: 900, color: '#1E293B', marginBottom: '8px', wordBreak: 'break-word' }}>
              {currentWinner.name}
            </div>

            {currentWinner.prize && currentWinner.prize !== 'ผู้โชคดี (ไม่ระบุของรางวัล)' ? (
              <div
                style={{
                  display: 'inline-block',
                  background: '#FFF7ED',
                  border: '1.5px solid #FFEDD5',
                  color: '#EA580C',
                  padding: '10px 24px',
                  borderRadius: '24px',
                  fontWeight: 800,
                  fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
                  marginBottom: '28px',
                  maxWidth: '100%',
                  wordBreak: 'break-word'
                }}
              >
                🎁 {currentWinner.prize}
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-block',
                  background: '#F0FDF4',
                  border: '1.5px solid #BBF7D0',
                  color: '#166534',
                  padding: '8px 20px',
                  borderRadius: '24px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  marginBottom: '28px'
                }}
              >
                ✨ ผู้โชคดีประจำรอบนี้
              </div>
            )}

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

      {/* Fullscreen QR Projector Modal */}
      {isQrFullscreen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: 'fadeIn 0.25s ease-out'
          }}
          onClick={() => setIsQrFullscreen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '32px',
              padding: '40px',
              maxWidth: '520px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
              position: 'relative',
              animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <button
              type="button"
              onClick={() => setIsQrFullscreen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FEF3C7', padding: '6px 16px', borderRadius: '20px', color: '#D97706', fontWeight: 800, fontSize: '0.9rem', marginBottom: '16px' }}>
              <Sparkles size={16} /> สแกนลงทะเบียน Lucky Draw
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1E293B', marginBottom: '8px' }}>
              สแกน QR Code เพื่อร่วมลุ้นรางวัล!
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: '24px' }}>
              เปิดกล้องมือถือแล้วสแกนเพื่อกรอกชื่อลุ้นรับของรางวัลทันที
            </p>

            <div
              style={{
                display: 'inline-block',
                padding: '20px',
                background: '#FFFFFF',
                borderRadius: '24px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                border: '2px solid #E2E8F0',
                marginBottom: '20px'
              }}
            >
              {qrSvgUrl ? (
                <img
                  src={qrSvgUrl}
                  alt="Lucky Draw QR Code"
                  style={{ width: '240px', height: '240px', display: 'block', borderRadius: '12px' }}
                />
              ) : (
                <div style={{ width: '240px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                  กำลังสร้าง QR Code...
                </div>
              )}
            </div>

            <div
              onClick={handleCopyJoinLink}
              title="คลิกเพื่อคัดลอกลิงก์"
              style={{
                background: copiedLink ? '#DCFCE7' : '#F8FAFC',
                borderRadius: '16px',
                padding: '14px 20px',
                border: `1.5px solid ${copiedLink ? '#86EFAC' : '#E2E8F0'}`,
                marginBottom: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', color: copiedLink ? '#15803D' : '#64748B', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Link2 size={14} /> {copiedLink ? 'คัดลอกลิงก์เรียบร้อย!' : 'หรือเข้าผ่านลิงก์ (คลิกเพื่อคัดลอก)'}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: copiedLink ? '#15803D' : '#2563EB', wordBreak: 'break-all' }}>
                  {joinUrl}
                </div>
              </div>
              <div style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: copiedLink ? '#16A34A' : '#EFF6FF',
                color: copiedLink ? '#FFFFFF' : '#2563EB',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: 700,
                flexShrink: 0
              }}>
                {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedLink ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.05rem', fontWeight: 800, color: '#059669' }}>
                <Users size={20} /> ลงทะเบียนแล้ว {livePlayers.length} คน
              </div>

              <button
                type="button"
                onClick={() => handleToggleRegistrationLock(!isRegistrationLocked)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  background: isRegistrationLocked ? '#FEE2E2' : '#DCFCE7',
                  color: isRegistrationLocked ? '#B91C1C' : '#15803D',
                  transition: 'all 0.2s ease'
                }}
              >
                {isRegistrationLocked ? <Lock size={15} /> : <Unlock size={15} />}
                {isRegistrationLocked ? '🔒 ปิดรับลงทะเบียนแล้ว' : '🟢 เปิดรับลงทะเบียน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prize Manager Modal */}
      {isPrizeManagerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPrizeManagerOpen(false);
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
              border: '2px solid #E2E8F0',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#FFF7ED', padding: '10px', borderRadius: '12px', border: '1px solid #FFEDD5', color: '#EA580C' }}>
                  <Gift size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1E293B' }}>
                    ตั้งค่าของรางวัลล่วงหน้า (Prize Presets)
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                    กำหนดรายการของรางวัลและจำนวนชิ้น ระบบจะตัดสต็อกอัตโนมัติเมื่อลูกบอลแตก
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrizeManagerOpen(false)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Add New Prize Form */}
            <form onSubmit={handleAddPreset} style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={15} color="#EA580C" /> เพิ่มของรางวัลใหม่
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="เช่น รางวัลที่ 1: แท็บเล็ต iPad 10th Gen"
                  style={{
                    flex: '1 1 240px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={newPresetCount}
                    onChange={(e) => setNewPresetCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{
                      width: '65px',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      textAlign: 'center',
                      outline: 'none',
                      background: '#FFFFFF'
                    }}
                  />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B' }}>ชิ้น</span>
                </div>
                <button
                  type="submit"
                  disabled={!newPresetName.trim()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: newPresetName.trim() ? '#EA580C' : '#CBD5E1',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: newPresetName.trim() ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={15} /> เพิ่ม
                </button>
              </div>
            </form>

            {/* Prize Inventory List */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569' }}>
                  รายการรางวัล ({presetPrizes.length})
                </span>
                <button
                  type="button"
                  onClick={handleResetAllStock}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#2563EB',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={12} /> รีเซ็ตสต็อกทั้งหมด
                </button>
              </div>

              {presetPrizes.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem', background: '#F8FAFC', borderRadius: '14px', border: '1px dashed #CBD5E1' }}>
                  ยังไม่มีของรางวัลในคลัง กรุณาเพิ่มรางวัลด้านบน
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {presetPrizes.map((prize) => {
                    const isSelected = activePresetPrizeId === prize.id;
                    const isOutOfStock = prize.remainingCount === 0;

                    return (
                      <div
                        key={prize.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          padding: '10px 14px',
                          borderRadius: '14px',
                          background: isSelected ? '#FFF7ED' : '#F8FAFC',
                          border: isSelected ? '1.5px solid #FDBA74' : '1px solid #E2E8F0',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <button
                            type="button"
                            onClick={() => setActivePresetPrizeId(prize.id)}
                            title={isSelected ? 'กำลังสุ่มรางวัลนี้' : 'เลือกเป็นรางวัลที่จะสุ่ม'}
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: isSelected ? '5px solid #EA580C' : '2px solid #94A3B8',
                              background: '#FFFFFF',
                              cursor: 'pointer',
                              padding: 0,
                              flexShrink: 0
                            }}
                          />
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{
                              fontSize: '0.92rem',
                              fontWeight: 800,
                              color: isOutOfStock ? '#94A3B8' : '#1E293B',
                              textDecoration: isOutOfStock ? 'line-through' : 'none',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden'
                            }}>
                              {prize.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: isOutOfStock ? '#DC2626' : '#64748B', fontWeight: 600 }}>
                              {isOutOfStock ? '❌ รางวัลหมดแล้ว' : `คงเหลือ ${prize.remainingCount} จาก ${prize.totalCount} ชิ้น`}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Adjusters */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleAdjustRemaining(prize.id, -1)}
                            disabled={prize.remainingCount <= 0}
                            title="ลดจำนวนคงเหลือ 1"
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              background: '#FFFFFF',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: prize.remainingCount <= 0 ? 'default' : 'pointer',
                              opacity: prize.remainingCount <= 0 ? 0.35 : 1
                            }}
                          >
                            <Minus size={13} />
                          </button>

                          <span style={{ fontSize: '0.88rem', fontWeight: 800, minWidth: '32px', textAlign: 'center', color: isOutOfStock ? '#DC2626' : '#1E293B' }}>
                            {prize.remainingCount}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleAdjustRemaining(prize.id, 1)}
                            disabled={prize.remainingCount >= prize.totalCount}
                            title="เพิ่มจำนวนคงเหลือ 1"
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              background: '#FFFFFF',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: prize.remainingCount >= prize.totalCount ? 'default' : 'pointer',
                              opacity: prize.remainingCount >= prize.totalCount ? 0.35 : 1
                            }}
                          >
                            <Plus size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemovePreset(prize.id)}
                            title="ลบรางวัลนี้"
                            style={{
                              marginLeft: '6px',
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              border: 'none',
                              background: '#FEE2E2',
                              color: '#DC2626',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Done Button */}
            <button
              type="button"
              onClick={() => setIsPrizeManagerOpen(false)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                background: '#EA580C',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.95rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)'
              }}
            >
              บันทึกและปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
