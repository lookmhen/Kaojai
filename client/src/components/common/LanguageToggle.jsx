import React from 'react';
import { useI18n } from '../../context/I18nContext';
import { Globe } from 'lucide-react';

export const LanguageToggle = ({ style = {} }) => {
  const { lang, toggleLang } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleLang}
      title={lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
      style={{
        background: '#FFFFFF',
        border: '1.5px solid #CBD5E1',
        borderRadius: '20px',
        padding: '5px 12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.82rem',
        fontWeight: 800,
        color: 'var(--text-main)',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease',
        userSelect: 'none',
        ...style
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#94A3B8';
        e.currentTarget.style.background = '#F8FAFC';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#CBD5E1';
        e.currentTarget.style.background = '#FFFFFF';
      }}
    >
      <Globe size={14} color="#3B82F6" />
      <span>{lang === 'th' ? '🇹🇭 TH' : '🇬🇧 EN'}</span>
    </button>
  );
};
