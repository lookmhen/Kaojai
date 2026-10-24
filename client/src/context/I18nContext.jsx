import React, { createContext, useContext, useState, useEffect } from 'react';

const TRANSLATIONS = {
  th: {
    appTitle: 'KaoJai Interactive Training',
    appSubtitle: 'ระบบเกมตอบคำถามสำหรับการเรียนรู้แบบ Active Learning',
    welcome: 'ยินดีต้อนรับสู่ KaoJai',
    chooseRole: 'โปรดเลือกบทบาทของคุณเพื่อเริ่มต้นใช้งานระบบ',
    forStudent: 'สำหรับผู้เรียน / ผู้เข้าร่วม',
    studentRole: 'ผู้เรียน / ผู้ร่วมสัมมนา',
    studentRoleDesc: 'กรอก Game PIN และเริ่มตอบคำถามผ่านอุปกรณ์ของคุณ',
    studentCardDesc: 'กรอกรหัส Game PIN 6 หลัก หรือสแกน QR Code เพื่อเข้าตอบคำถามสดผ่านสมาร์ทโฟน',
    enterQuiz: 'เข้าตอบคำถาม',
    forTeacher: 'สำหรับวิทยากร / ผู้สอน',
    hostRole: 'วิทยากร / ผู้สอน (Host Game)',
    hostRoleDesc: 'เปิดห้อง จัดการการแข่งขัน และฉายขึ้นจอโปรเจกเตอร์',
    hostDashboard: 'เปิดเกมสดขึ้นจอใหญ่ (Host Dashboard)',
    hostCardDesc: 'สร้างห้องกิจกรรมใหม่ แสดง PIN & QR Code สลับโหมด Quiz & Pulse หรือเข้าคลังข้อสอบ',
    createNewRoom: 'สร้างห้องกิจกรรมใหม่',
    quizBank: 'คลังคำถาม',
    teacherBackoffice: 'จัดการคลังข้อสอบ (Backoffice)',
    luckyDraw: 'Lucky Draw (อ่างลุ้นรางวัล)',
    luckyDrawDesc: 'สุ่มจับสลากของขวัญและผู้โชคดี',
    joinGame: 'เข้าร่วมตอบคำถาม (Join Game)',
    joinGameDesc: 'กรอก Game PIN และตั้งชื่อ Nickname เพื่อเข้าเล่น',
    gamePin: 'รหัส Game PIN (6 หลัก)',
    enterPin: 'กรอกรหัส PIN 6 หลัก',
    checkPin: 'ตรวจสอบ PIN',
    nickname: 'ชื่อเล่น (Nickname)',
    enterNickname: 'กรอกชื่อของคุณ...',
    chooseAvatar: 'เลือกรูปอวาตาร์',
    startQuiz: 'เริ่มทำแบบทดสอบ',
    backToRoles: 'กลับสู่หน้าเลือกบทบาท',
    reconnectNotice: 'ตรวจพบเซสชันเดิมของคุณในห้องนี้',
    reconnectBtn: 'เข้าห้องเดิมต่อ (Rejoin)',
    newParticipant: 'ฉันเป็นผู้เรียนใหม่ (ไม่ได้ทำ Pre-test / พิมพ์ชื่อใหม่)',
    backToRoster: 'กลับไปเลือกจากรายชื่อเดิม',
    activeSessionsTitle: 'ห้องกิจกรรมที่กำลังเปิดอยู่',
    resumeSession: 'เปิดห้องต่อ',
    joiningRoom: 'กำลังเข้าห้อง...',
    loginHost: 'เข้าสู่ระบบผู้สอน/แอดมิน',
    answered: 'ตอบแล้ว ',
    signaled: 'ส่งสัญญาณแล้ว ',
    personUnit: 'คน',
    quizGame: 'Quiz Game',
    trainingPulse: 'Training Pulse',
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
    manageUsers: 'จัดการผู้ใช้'
  },
  en: {
    appTitle: 'KaoJai Interactive Training',
    appSubtitle: 'Interactive quiz & active learning platform',
    welcome: 'Welcome to KaoJai',
    chooseRole: 'Please select your role to get started',
    forStudent: 'For Students & Participants',
    studentRole: 'Student / Participant',
    studentRoleDesc: 'Enter Game PIN and answer questions on your mobile device',
    studentCardDesc: 'Enter 6-digit Game PIN or scan QR code to join live quiz from your smartphone',
    enterQuiz: 'Join & Answer',
    forTeacher: 'For Trainers & Instructors',
    hostRole: 'Trainer / Host Game',
    hostRoleDesc: 'Launch a game session and project live to the big screen',
    hostDashboard: 'Host Live Screen (Host Dashboard)',
    hostCardDesc: 'Create new session, display PIN & QR Code, toggle Quiz & Pulse, or open Quiz Bank',
    createNewRoom: 'Create New Session',
    quizBank: 'Quiz Bank',
    teacherBackoffice: 'Quiz Bank (Backoffice)',
    luckyDraw: 'Lucky Draw Basin',
    luckyDrawDesc: 'Draw prizes and lucky winners from mystery balls',
    joinGame: 'Join Game',
    joinGameDesc: 'Enter Game PIN and your nickname to participate',
    gamePin: 'Game PIN (6 digits)',
    enterPin: 'Enter 6-digit PIN',
    checkPin: 'Verify PIN',
    nickname: 'Nickname',
    enterNickname: 'Enter your name...',
    chooseAvatar: 'Choose Avatar',
    startQuiz: 'Start Quiz',
    backToRoles: 'Back to Role Selection',
    reconnectNotice: 'Your existing session was found in this room',
    reconnectBtn: 'Rejoin Room',
    newParticipant: 'I am a new participant (type new name)',
    backToRoster: 'Back to roster list',
    activeSessionsTitle: 'Active Ongoing Sessions',
    resumeSession: 'Resume Room',
    joiningRoom: 'Joining room...',
    loginHost: 'Sign in as Trainer / Admin',
    answered: 'Answered ',
    signaled: 'Signaled ',
    personUnit: 'players',
    quizGame: 'Quiz Game',
    trainingPulse: 'Training Pulse',
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
    return {
      lang: 'th',
      setLang: () => {},
      toggleLang: () => {},
      t: (key, fallback) => TRANSLATIONS.th[key] || fallback || key
    };
  }
  return context;
};
