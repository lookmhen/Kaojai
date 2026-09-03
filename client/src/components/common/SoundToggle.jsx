import React, { useState, useEffect } from 'react';
import { sfx } from '../../utils/audioSFX';
import { Volume2, VolumeX } from 'lucide-react';

export const SoundToggle = ({ size = 18, style = {} }) => {
  const [isMuted, setIsMuted] = useState(() => sfx.isMuted());

  useEffect(() => {
    return sfx.subscribe((muted) => setIsMuted(muted));
  }, []);

  const handleToggle = () => {
    sfx.toggleMute();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={isMuted ? 'เปิดเสียง (Unmute)' : 'ปิดเสียง (Mute)'}
      style={{
        background: isMuted ? '#FEE2E2' : '#F1F5F9',
        border: isMuted ? '1px solid #FCA5A5' : '1px solid #CBD5E1',
        color: isMuted ? '#DC2626' : 'var(--text-main)',
        borderRadius: '50%',
        width: '38px',
        height: '38px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ...style
      }}
    >
      {isMuted ? <VolumeX size={size} color="#DC2626" /> : <Volume2 size={size} color="var(--accent-earth-blue)" />}
    </button>
  );
};
