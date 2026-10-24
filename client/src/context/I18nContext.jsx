import React, { createContext, useContext, useState, useEffect } from 'react';

const TRANSLATIONS = {
  th: {
    appTitle: 'KaoJai Interactive Training',
    appSubtitle: 'ระบบเกมตอบคำถามสำหรับการเรียนรู้แบบ Active Learning',
    studentRole: 'ผู้เรียน / ผู้ร่วมสัมมนา',
    studentRoleDesc: 'กรอก Game PIN และเริ่มตอบคำถามผ่านอุปกรณ์ของคุณ',
    hostRole: 'วิทยากร / ผู้สอน (Host Game)',
    hostRoleDesc: 'เปิดห้อง จัดการการแข่งขัน และฉายขึ้นจอโปรเจกเตอร์',
    teacherBackoffice: 'จัดการคลังข้อสอบ (Backoffice)',
    luckyDraw: 'Lucky Draw (อ่างลุ้นรางวัล)',
    luckyDrawDesc: 'สุ่มจับสลากของขวัญและผู้โชคดี',
    joinGame: 'เข้าร่วมตอบคำถาม',
    joinGameDesc: 'กรอก Game PIN และตั้งชื่อเล่นของคุณ',
    gamePin: 'รหัส Game PIN',
    enterPin: 'กรอกรหัส PIN 6 หลัก',
    nickname: 'ชื่อเล่นของคุณ',
    enterNickname: 'เช่น สมชาย หรือ John',
    chooseAvatar: 'เลือกรูปโปรไฟล์อวาตาร์',
    startQuiz: 'เริ่มทำแบบทดสอบ',
    backToRoles: 'กลับสู่หน้าเลือกบทบาท',
    answered: 'ตอบแล้ว',
    signaled: 'ส่งสัญญาณแล้ว',
    endSession: 'จบเซสชัน',
    totalScore: 'คะแนนรวม',
    teamBattle: 'คะแนนทีม Team Battle',
    leaderboard: 'สรุปอันดับ',
    nextQuestion: 'คำถามข้อถัดไป',
    kickPlayer: 'นำผู้เล่นออก',
    copyLink: 'คัดลอกลิงก์',
    linkCopied: 'คัดลอกลิงก์เรียบร้อย!',
    sessionHistory: 'ประวัติเซสชันย้อนหลัง',
    backupDb: 'สำรองฐานข้อมูล',
    switchLang: 'สลับภาษา',
    players: 'ผู้เข้าร่วม',
    question: 'คำถาม',
    seconds: 'วินาที',
    podium: 'แท่นรับรางวัล Podium',
    racingTrack: 'แทร็กคะแนนรวม Racing',
    unmute: 'เปิดเสียง',
    mute: 'ปิดเสียง',
    login: 'เข้าสู่ระบบ',
    logout: 'ออกจากระบบ',
    admin: 'ผู้ดูแลระบบ (Admin)',
    teacher: 'อาจารย์ผู้สอน (Teacher)',
    manageUsers: 'จัดการผู้ใช้งาน'
  },
  en: {
    appTitle: 'KaoJai Interactive Training',
    appSubtitle: 'Interactive quiz & active learning platform',
    studentRole: 'Student / Participant',
    studentRoleDesc: 'Enter Game PIN and answer questions on your mobile device',
    hostRole: 'Trainer / Host Game',
    hostRoleDesc: 'Launch a game session and project live to the big screen',
    teacherBackoffice: 'Quiz Bank (Backoffice)',
    luckyDraw: 'Lucky Draw Basin',
    luckyDrawDesc: 'Draw prizes and lucky winners from mystery balls',
    joinGame: 'Join Game',
    joinGameDesc: 'Enter Game PIN and your nickname to join',
    gamePin: 'Game PIN',
    enterPin: 'Enter 6-digit PIN',
    nickname: 'Your Nickname',
    enterNickname: 'e.g. John or Sarah',
    chooseAvatar: 'Choose Avatar',
    startQuiz: 'Start Quiz',
    backToRoles: 'Back to Role Selection',
    answered: 'Answered',
    signaled: 'Signaled',
    endSession: 'End Session',
    totalScore: 'Total Score',
    teamBattle: 'Team Battle Score',
    leaderboard: 'Leaderboard',
    nextQuestion: 'Next Question',
    kickPlayer: 'Kick Player',
    copyLink: 'Copy Link',
    linkCopied: 'Link copied!',
    sessionHistory: 'Session History',
    backupDb: 'Backup Database',
    switchLang: 'Switch Language',
    players: 'Players',
    question: 'Question',
    seconds: 'Seconds',
    podium: 'Podium',
    racingTrack: 'Racing Track',
    unmute: 'Unmute',
    mute: 'Mute',
    login: 'Sign In',
    logout: 'Sign Out',
    admin: 'Admin',
    teacher: 'Teacher',
    manageUsers: 'Manage Users'
  }
};

const I18nContext = createContext(null);

export const I18nProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('kaojai_lang') || 'th';
    }
    return 'th';
  });

  const setLang = (newLang) => {
    const valid = newLang === 'en' ? 'en' : 'th';
    setLangState(valid);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kaojai_lang', valid);
    }
  };

  const toggleLang = () => {
    setLang(lang === 'th' ? 'en' : 'th');
  };

  const t = (key, fallback) => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.th;
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    return fallback || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback safe implementation if used outside provider
    return {
      lang: 'th',
      setLang: () => {},
      toggleLang: () => {},
      t: (key, fallback) => TRANSLATIONS.th[key] || fallback || key
    };
  }
  return context;
};
