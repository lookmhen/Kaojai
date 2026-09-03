import React, { useState, useEffect } from 'react';
import { Palette, Check, X } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Royal Blue (มาตรฐาน)', hex: '#1a237e' },
  { name: 'Deep Purple (ม่วงเข้ม)', hex: '#311b92' },
  { name: 'Slate Dark (เทาเข้ม)', hex: '#121824' },
  { name: 'Midnight Teal (เขียวคราม)', hex: '#004d40' },
  { name: 'Classic Charcoal (ชาร์โคล)', hex: '#1e1e2e' },
  { name: 'Dark Indigo (ครามเข้ม)', hex: '#283593' },
  { name: 'Wine Maroon (ไวน์เข้ม)', hex: '#4a148c' }
];

export const ThemePicker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState(() => {
    return localStorage.getItem('kaojai_bg_color') || '#1a237e';
  });

  useEffect(() => {
    applyColor(currentColor);
  }, []);

  const applyColor = (hexColor) => {
    setCurrentColor(hexColor);
    localStorage.setItem('kaojai_bg_color', hexColor);
    document.documentElement.style.setProperty('--bg-solid-color', hexColor);
  };

  return (
    <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 1200 }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          borderRadius: '30px',
          padding: '8px 16px',
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          cursor: 'pointer'
        }}
      >
        <Palette size={18} color="var(--accent-yellow)" />
        <span>ปรับสีพื้นหลัง</span>
      </button>

      {/* Palette Picker Popup Modal */}
      {isOpen && (
        <div
          className="glass-card animate-pop"
          style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            width: '280px',
            padding: '16px',
            background: 'rgba(20, 20, 35, 0.95)',
            border: '1px solid rgba(255,255,255,0.3)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            borderRadius: '16px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
              🎨 เลือกสีพื้นหลังแบบเรียบ:
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', padding: '2px' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Preset Color Swatches */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {PRESET_COLORS.map(c => {
              const isSelected = currentColor.toLowerCase() === c.hex.toLowerCase();
              return (
                <div
                  key={c.hex}
                  onClick={() => applyColor(c.hex)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: c.hex,
                    border: isSelected ? '2px solid var(--accent-yellow)' : '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  <span>{c.name}</span>
                  {isSelected && <Check size={16} color="var(--accent-yellow)" />}
                </div>
              );
            })}
          </div>

          {/* Custom Color Input */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '10px' }}>
            <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              เลือกสีอิสระที่คุณชอบ (Custom Color):
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="color"
                value={currentColor}
                onChange={(e) => applyColor(e.target.value)}
                style={{ width: '40px', height: '36px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'transparent' }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-yellow)' }}>
                {currentColor}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
