import React from 'react';
import { useI18n } from '../../context/I18nContext';

export const LanguageToggle = ({ style = {} }) => {
  const { lang, setLang } = useI18n();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: '#F1F5F9',
        border: '1.5px solid #CBD5E1',
        borderRadius: '24px',
        padding: '2px',
        gap: '2px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        userSelect: 'none',
        ...style
      }}
    >
      <button
        type="button"
        onClick={() => setLang('th')}
        title="ภาษาไทย (TH)"
        style={{
          padding: '4px 10px',
          borderRadius: '20px',
          border: 'none',
          background: lang === 'th' ? '#2563EB' : 'transparent',
          color: lang === 'th' ? '#FFFFFF' : '#64748B',
          fontWeight: 800,
          fontSize: '0.8rem',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        TH
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        title="English (EN)"
        style={{
          padding: '4px 10px',
          borderRadius: '20px',
          border: 'none',
          background: lang === 'en' ? '#2563EB' : 'transparent',
          color: lang === 'en' ? '#FFFFFF' : '#64748B',
          fontWeight: 800,
          fontSize: '0.8rem',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        EN
      </button>
    </div>
  );
};
