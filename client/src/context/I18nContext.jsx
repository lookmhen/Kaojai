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
    luckyDraw: 'Lucky Draw',
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
    scanToJoin: 'สแกนเข้าห้องได้เลย',
    enterPinDesc: 'หรือเข้าเว็บกรอก GAME PIN:',
    joinLink: 'ลิงก์เข้าร่วม',
    clickToCopy: 'คลิกเพื่อคัดลอก',
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
    manageUsers: 'จัดการผู้ใช้',

    // Common & Actions
    home: 'หน้าหลัก',
    cancel: 'ยกเลิก',
    confirm: 'ยืนยัน',
    save: 'บันทึก',
    close: 'ปิด',
    delete: 'ลบ',
    loading: 'กำลังโหลด...',
    success: 'สำเร็จ',
    error: 'เกิดข้อผิดพลาด',
    pts: 'คะแนน',

    // Player Lobby & Teams
    roomJoinedSuccess: 'คุณเข้าสู่ห้องสำเร็จแล้ว! 🎉',
    yourTeam: 'สังกัด:',
    noTeamWarning: '⚠️ คุณยังไม่ได้เลือกทีม',
    selectTeam: 'แตะเลือกทีมของคุณ:',
    leaveTeam: 'ออกจากทีม',
    membersUnit: 'คน',
    myTeamBadge: 'ทีมคุณ',
    joinThisTeam: 'เข้าทีมนี้',
    noTeamsCreated: 'วิทยากรยังไม่ได้สร้างทีม กรุณารอสักครู่...',
    totalParticipants: 'ผู้เข้าร่วมทั้งหมด:',
    waitingForHost: 'รอวิทยากรเริ่มเกม (Waiting for Host...)',
    autoUpdateNotice: 'หน้าจอจะอัปเดตอัตโนมัติเมื่อ Host เริ่มกิจกรรม ✨',
    leaveRoomBtn: 'ออกจากห้อง / กลับหน้าหลัก',

    // Player Quiz & Sequence
    pretestRecorded: 'บันทึกคำตอบแล้ว ✨',
    pretestNotice: '(โหมด Pre-test — ผลจะเปิดเผยตอน Post-test)',
    correctAnswer: 'ถูกต้องที่สุด! 🎉',
    wrongAnswer: 'ยังไม่ถูกต้อง 😅',
    wrongEncourage: 'ไม่ต้องเสียใจ สะสมความเข้าใจในข้อถัดไปกันนะ!',
    timeOut: 'หมดเวลาตอบคำถาม ⏳',
    timeOutEncourage: 'ไม่ได้ส่งคำตอบทันในรอบนี้ ลุยต่อในข้อถัดไปนะ!',
    answerRecordedWait: 'ส่งคำตอบเรียบร้อยแล้ว กำลังประมวลผลคะแนน...',
    lastQuestionNotice: '🏁 คำถามข้อสุดท้ายเสร็จสิ้นแล้ว! เตรียมดูสรุปผลคะแนนและผู้ชนะบนหน้าจอใหญ่...',
    getReadyNextQuestion: 'เตรียมตัวให้พร้อมสำหรับคำถามถัดไป!',
    loadingQuestionData: 'ระบบกำลังโหลดข้อมูลคำถาม กรุณารอสักครู่ ✨',
    classResultsNotice: 'สรุปผลคำตอบของเพื่อนๆ ทุกคนในข้อนี้:',
    waitingHostSummary: 'รอการสรุปผลคำตอบจากวิทยากร...',
    optionNumber: 'ข้อ',
    trueChoice: '✓ ถูก (True)',
    falseChoice: '✕ ผิด (False)',
    dragToReorder: 'ลากหรือกดลูกศรเพื่อเรียงลำดับ',
    submitSequenceBtn: 'ยืนยันการจัดลำดับ',
    submittingBtn: 'กำลังส่ง...',
    sequenceSubmittedNotice: 'บันทึกคำตอบเรียบร้อย รอเฉลยจากวิทยากร',
    correctSequenceOrder: 'เฉลยลำดับที่ถูกต้อง:',
    yourSequenceOrder: 'ลำดับคำตอบของคุณ:',
    speedBasePoints: 'ฐานความเร็ว',
    streakBonusNotice: 'โบนัสคอมโบ',
    comebackBonusNotice: 'สู้กลับ',

    // Player Pulse
    pulseTitle: 'ส่งสัญญาณระดับความเข้าใจของคุณแบบ Real-time',
    pulseDesc: 'คลิกเลือกสัญญาณเพื่อแจ้งวิทยากรว่าคุณตามทันหรือไม่',
    pulseGreat: 'เข้าใจดีมาก / ไปต่อได้สบาย',
    pulseOkay: 'พอเข้าใจ / ไปต่อได้เรื่อยๆ',
    pulseConfused: 'เริ่มตามไม่ทัน / ขอคำอธิบายเพิ่ม',
    sendPulseSuccess: 'ส่งสัญญาณแล้ว! คุณสามารถกดเปลี่ยนได้ตลอดเวลา',
    quickReactions: 'ส่งปฏิกิริยา Reaction สด',
    nudgeDefault: '🔔 วิทยากรกำลังรอสัญญาณตอบรับจากคุณอยู่นะครับ! ✨',
    pulseRoundStart: 'เริ่มรอบประเมินใหม่แล้ว! ส่งผลความเข้าใจรอบนี้ได้เลย',

    // Player Leaderboard & Ended
    pretestFinishedTitle: 'บันทึกผล Pre-test เรียบร้อยแล้ว! ✨',
    pretestFinishedDesc: 'ระบบได้บันทึกคำตอบของคุณไว้เรียบร้อยแล้ว เพื่อนำไปวัดพัฒนาการการเรียนรู้ (Learning Gain) ร่วมกับ Post-test หลังเรียน',
    pretestNoScoreNotice: 'บันทึกสถิติคำตอบครบถ้วน (ไม่แสดงคะแนน)',
    waitingHostNextStep: '🌟 รอวิทยากรนำเข้าสู่บทเรียนและขั้นตอนถัดไป...',
    quizFinishedTitle: 'จบกิจกรรมตอบคำถามแล้ว!',
    thankYouParticipation: 'ขอบคุณสำหรับการมีส่วนร่วม ✨',
    yourRank: 'อันดับของคุณ',
    waitingHostSummaryScreen: '🌟 รอวิทยากรสรุปกิจกรรมบนหน้าจอใหญ่...',
    roundLeaderboardTitle: 'สรุปอันดับและการแข่งขันรอบนี้! 🏎️',
    roundLeaderboardDesc: 'สังเกตการวิ่งแซงของรถแข่งบนหน้าจอใหญ่ของวิทยากร',
    pointsEarnedThisRound: 'คะแนนในรอบนี้! ✨',
    waitingNextQuestion: 'รอวิทยากรเปิดคำถามข้อถัดไป...',

    // Host Lobby & Quiz
    joinWithPin: 'เข้าเว็บแล้วใส่ PIN หรือสแกน QR Code เพื่อร่วมสนุก',
    waitingParticipants: 'กำลังรอผู้เข้าร่วมเข้าห้อง...',
    startGame: 'เริ่มเกม (Start Game)',
    teamsSystem: 'ระบบแบ่งทีม (Team Mode)',
    teamsOn: 'เปิดแบ่งทีม',
    teamsOff: 'ปิดแบ่งทีม',
    autoShuffleTeams: 'สุ่มจัดทีมอัตโนมัติ',
    addTeam: 'เพิ่มทีมใหม่',
    teamName: 'ชื่อทีม',
    selectQuizSet: 'เลือกชุดข้อสอบ:',
    kickPlayerConfirm: 'ต้องการนำผู้เล่นนี้ออกจากห้องหรือไม่?',
    revealAnswer: 'เฉลยคำตอบ (Show Answer)',
    showLeaderboardBtn: 'ดูสรุปอันดับ (Leaderboard)',
    showTeamBattleBtn: 'ดูคะแนนทีม (Team Battle)',
    questionCountdown: 'เวลาที่เหลือ',
    answeredCount: 'คนตอบแล้ว',
    showResultsNow: 'เฉลยคำตอบทันที',

    // Host Leaderboard & Podium
    podiumIndividual: 'แท่นรับรางวัลเดี่ยว (Podium)',
    racingTrackView: 'แทร็กรถแข่ง (Racing Track)',
    teamBattleView: 'คะแนนทีม (Team Battle)',
    exportExcel: 'ส่งออกรายงาน Excel',
    exportPdf: 'ส่งออก PDF',
    resetToLobby: 'กลับสู่ห้องรอ (Reset to Lobby)',
    playAgain: 'เล่นรอบถัดไป (Retest)',
    viewLearningGain: 'วิเคราะห์พัฒนาการ (Learning Gain)',
    finalPodiumTitle: 'สรุปอันดับผู้ชนะการแข่งขันสิ้นสุดเกม! 🎉',
    roundRacingTitle: 'สรุปการอันดับและการเปลี่ยนแปลงคะแนนรอบนี้ 🏎️💨',

    // Modals & Backoffice
    username: 'ชื่อผู้ใช้',
    password: 'รหัสผ่าน',
    loginSuccess: 'เข้าสู่ระบบสำเร็จ',
    loginFailed: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
    role: 'บทบาท',
    createdDate: 'วันที่สร้าง',
    actions: 'การดำเนินการ',
    downloadExcel: 'ดาวน์โหลด Excel',
    restoreDb: 'กู้คืนฐานข้อมูล',
    backupSuccess: 'สำรองข้อมูลสำเร็จ',
    deleteConfirm: 'ยืนยันการลบ?'
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
    luckyDraw: 'Lucky Draw',
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
    scanToJoin: 'Scan to join room',
    enterPinDesc: 'Or join at website with GAME PIN:',
    joinLink: 'Join Link',
    clickToCopy: 'Click to copy',
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
    manageUsers: 'Manage Users',

    // Common & Actions
    home: 'Home',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    close: 'Close',
    delete: 'Delete',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    pts: 'Pts',

    // Player Lobby & Teams
    roomJoinedSuccess: 'Joined the room successfully! 🎉',
    yourTeam: 'Team:',
    noTeamWarning: '⚠️ You have not joined a team yet',
    selectTeam: 'Tap to choose your team:',
    leaveTeam: 'Leave Team',
    membersUnit: 'members',
    myTeamBadge: 'Your Team',
    joinThisTeam: 'Join Team',
    noTeamsCreated: 'Host has not created teams yet. Please wait...',
    totalParticipants: 'Total Participants:',
    waitingForHost: 'Waiting for Host to start...',
    autoUpdateNotice: 'Screen will update automatically when the game begins ✨',
    leaveRoomBtn: 'Leave Room / Back to Home',

    // Player Quiz & Sequence
    pretestRecorded: 'Answer Recorded ✨',
    pretestNotice: '(Pre-test Mode — results revealed during Post-test)',
    correctAnswer: 'Correct! 🎉',
    wrongAnswer: 'Incorrect 😅',
    wrongEncourage: 'Keep going! You will get the next one!',
    timeOut: 'Time is up! ⏳',
    timeOutEncourage: 'You did not submit in time. Ready for the next question!',
    answerRecordedWait: 'Answer submitted! Processing results...',
    lastQuestionNotice: '🏁 Final question finished! Check the big screen for podium & winners...',
    getReadyNextQuestion: 'Get ready for the next question!',
    loadingQuestionData: 'Loading question data, please wait ✨',
    classResultsNotice: 'Class answer distribution for this question:',
    waitingHostSummary: 'Waiting for host to reveal results...',
    optionNumber: 'Option',
    trueChoice: '✓ True',
    falseChoice: '✕ False',
    dragToReorder: 'Drag or use arrows to reorder',
    submitSequenceBtn: 'Submit Order',
    submittingBtn: 'Submitting...',
    sequenceSubmittedNotice: 'Sequence submitted! Waiting for host reveal',
    correctSequenceOrder: 'Correct sequence order:',
    yourSequenceOrder: 'Your submitted order:',
    speedBasePoints: 'Speed base',
    streakBonusNotice: 'Streak bonus',
    comebackBonusNotice: 'Comeback boost',

    // Player Pulse
    pulseTitle: 'Send Real-time Training Pulse',
    pulseDesc: 'Signal the trainer how well you understand the topic',
    pulseGreat: 'Understand clearly / Ready to move on',
    pulseOkay: 'Somewhat clear / Keep going',
    pulseConfused: 'Need clarification / A bit confused',
    sendPulseSuccess: 'Pulse sent! You can change it anytime',
    quickReactions: 'Send Live Reactions',
    nudgeDefault: '🔔 Host is waiting for your training pulse! ✨',
    pulseRoundStart: 'New evaluation round started! Send your understanding pulse now',

    // Player Leaderboard & Ended
    pretestFinishedTitle: 'Pre-test Recorded Successfully! ✨',
    pretestFinishedDesc: 'Your responses have been recorded to measure Learning Gain against the Post-test.',
    pretestNoScoreNotice: 'Responses recorded (Scores hidden for Pre-test)',
    waitingHostNextStep: '🌟 Waiting for host to proceed...',
    quizFinishedTitle: 'Quiz Activity Finished!',
    thankYouParticipation: 'Thank you for participating! ✨',
    yourRank: 'Your Rank',
    waitingHostSummaryScreen: '🌟 Waiting for host to wrap up on big screen...',
    roundLeaderboardTitle: 'Round Standings & Race Update! 🏎️',
    roundLeaderboardDesc: 'Watch the racecars overtake each other on the host screen',
    pointsEarnedThisRound: 'pts this round! ✨',
    waitingNextQuestion: 'Waiting for host to start next question...',

    // Host Lobby & Quiz
    joinWithPin: 'Join at web with PIN or scan QR code',
    waitingParticipants: 'Waiting for players to join...',
    startGame: 'Start Game',
    teamsSystem: 'Team Mode',
    teamsOn: 'Teams ON',
    teamsOff: 'Teams OFF',
    autoShuffleTeams: 'Auto Shuffle Teams',
    addTeam: 'Add New Team',
    teamName: 'Team Name',
    selectQuizSet: 'Select Quiz Set:',
    kickPlayerConfirm: 'Remove this player from the room?',
    revealAnswer: 'Show Answer',
    showLeaderboardBtn: 'Show Leaderboard',
    showTeamBattleBtn: 'Team Battle',
    questionCountdown: 'Time Left',
    answeredCount: 'Answered',
    showResultsNow: 'Reveal Results',

    // Host Leaderboard & Podium
    podiumIndividual: 'Solo Podium',
    racingTrackView: 'Racing Track',
    teamBattleView: 'Team Battle',
    exportExcel: 'Export Excel',
    exportPdf: 'Export PDF',
    resetToLobby: 'Reset to Lobby',
    playAgain: 'Play Again (Retest)',
    viewLearningGain: 'Learning Gain Analytics',
    finalPodiumTitle: 'Final Podium Champions! 🎉',
    roundRacingTitle: 'Round Standings & Score Updates 🏎️💨',

    // Modals & Backoffice
    username: 'Username',
    password: 'Password',
    loginSuccess: 'Signed in successfully',
    loginFailed: 'Invalid username or password',
    role: 'Role',
    createdDate: 'Created Date',
    actions: 'Actions',
    downloadExcel: 'Download Excel',
    restoreDb: 'Restore Database',
    backupSuccess: 'Backup completed successfully',
    deleteConfirm: 'Are you sure you want to delete?'
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
