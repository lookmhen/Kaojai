import React, { useState, useEffect } from 'react';
import { Palette, Check, X } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Warm Cream / งาช้าง (มาตรฐาน)', hex: '#FBF9F5' },
  { name: 'Off-White / เทาอ่อนสบายตา', hex: '#F8F9FA' },
  { name: 'Soft Sage / เขียวเซจอ่อน', hex: '#F3F5F2' },
  { name: 'Soft Slate / ฟ้าเทาอ่อน', hex: '#F1F5F9' },
  { name: 'Warm Beige / ทรายเบจสบายตา', hex: '#F7F4EB' }
];

export const ThemePicker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState(() => {
    return localStorage.getItem('kaojai_bg_color') || '#FBF9F5';
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
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '30px',
          padding: '8px 16px',
          color: '#1E293B',
          fontWeight: 700,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
          cursor: 'pointer'
        }}
      >
        <Palette size={18} color="var(--accent-earth-orange)" />
        <span>โทนสีพื้นหลัง</span>
      </button>

      {/* Palette Picker Popup Modal */}
      {isOpen && (
        <div
          className="glass-card animate-pop"
          style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            width: '290px',
            padding: '16px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 8px 30px rgba(15, 23, 42, 0.1)',
            borderRadius: '16px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E293B' }}>
              🎨 โทนสีพื้นหลังสบายตา (60% Base):
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', color: '#64748B', padding: '2px' }}
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
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: c.hex,
                    border: isSelected ? '2px solid var(--accent-earth-blue)' : '1px solid #E2E8F0',
                    cursor: 'pointer',
                    color: '#1E293B',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  <span>{c.name}</span>
                  {isSelected && <Check size={16} color="var(--accent-earth-blue)" />}
                </div>
              );
            })}
          </div>

          {/* Custom Color Input */}
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
            <label style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              เลือกสีอิสระเพิ่มเติม (Custom Color):
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="color"
                value={currentColor}
                onChange={(e) => applyColor(e.target.value)}
                style={{ width: '40px', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', cursor: 'pointer', background: 'transparent' }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>
                {currentColor}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
