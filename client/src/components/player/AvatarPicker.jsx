import React, { useState } from 'react';
import { Shuffle } from 'lucide-react';

const AVATAR_FILES = [
  "0291dcc0ce.svg", "06f3612482.svg", "0adc20e92f.svg", "0edec8cc96.svg",
  "1b9deba696.svg", "3094e5a2c3.svg", "39d6a77f5a.svg", "3c19656c71.svg",
  "3fcf70a78d.svg", "4b725f1ca0.svg", "502e86048c.svg", "55d297f826.svg",
  "5de34e74ca.svg", "83ed32245e.svg", "959d259fee.svg", "9971ab5aa8.svg",
  "9db2377ce4.svg", "a1f39ae191.svg", "a48b05339e.svg", "aa0241c41a.svg",
  "adc6c80d90.svg", "b2b060fc43.svg", "b93f39c7c2.svg", "bed76411f6.svg",
  "c4fa578eb1.svg", "dbf352502e.svg", "e8cdd7416c.svg", "f2bcc2c96e.svg",
  "f5934d163b.svg", "f8a959b165.svg"
];

export const AvatarPicker = ({ selectedAvatar, onSelectAvatar }) => {
  const [avatars] = useState(AVATAR_FILES);

  const handleRandomize = () => {
    const randomIdx = Math.floor(Math.random() * avatars.length);
    onSelectAvatar(avatars[randomIdx]);
  };

  return (
    <div className="avatar-picker-container" style={{ margin: '16px 0' }}>
      {/* Top Header & Active Avatar Preview */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src={`/avatars/${selectedAvatar || '0291dcc0ce.svg'}`}
            alt="Selected Avatar Preview"
            onError={(e) => { e.target.src = '/avatars/0291dcc0ce.svg'; }}
            style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--accent-yellow)' }}
          />
          <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
            เลือก Avatar (30 แบบ):
          </label>
        </div>

        <button
          type="button"
          onClick={handleRandomize}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '20px',
            padding: '4px 12px',
            color: '#fff',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer'
          }}
        >
          <Shuffle size={14} /> สุ่มรูป
        </button>
      </div>

      {/* Avatar Grid Wrapper with Responsive Columns & Sleek Custom Scrollbar */}
      <div className="avatar-grid-wrapper">
        <div className="avatar-grid">
          {avatars.map((fileName) => {
            const isSelected = selectedAvatar === fileName;
            return (
              <div
                key={fileName}
                onClick={() => onSelectAvatar(fileName)}
                className={`avatar-item ${isSelected ? 'selected' : ''}`}
              >
                <img
                  src={`/avatars/${fileName}`}
                  alt="Avatar option"
                  onError={(e) => {
                    e.target.src = '/avatars/0291dcc0ce.svg';
                  }}
                  style={{ width: '38px', height: '38px', borderRadius: '50%' }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
