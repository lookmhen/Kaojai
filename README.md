# 💖 KaoJai (เข้าใจ) - Real-time Interactive Quiz & Training Pulse Platform

<img width="902" height="619" alt="image" src="https://github.com/user-attachments/assets/f54c9d5a-4c0b-464e-ac2e-745f5647d651" />


> **KaoJai** เป็นเว็บแอปพลิเคชันสำหรับการถาม-ตอบและสำรวจความเข้าใจแบบเรียลไทม์ (Interactive Response System) ที่ผสมผสานระหว่าง **เกมตอบคำถาม (Gamified Quiz สไตล์ Kahoot)** และ **การประเมินความเข้าใจระหว่างอบรม (Training Pulse 3 ระดับ 🟢 🟡 🔴)** ออกแบบตามหลัก Earth Tone UI, Cognitive Ergonomics และรองรับการใช้งานบนทุกอุปกรณ์

---

## 📑 สารบัญ (Table of Contents)
1. [สถาปัตยกรรมของระบบ (Architecture Overview)](#-สถาปัตยกรรมของระบบ-architecture-overview)
2. [โครงสร้างไดเรกทอรี (Directory Structure)](#-โครงสร้างไดเรกทอรี-directory-structure)
3. [เทคโนโลยีที่เลือกใช้ (Tech Stack)](#-เทคโนโลยีที่เลือกใช้-tech-stack)
4. [คู่มือการติดตั้งและเริ่มต้นใช้งาน (Getting Started)](#-คู่มือการติดตั้งและเริ่มต้นใช้งาน-getting-started)
5. [ฟีเจอร์หลักของระบบ (Key Features)](#-ฟีเจอร์หลักของระบบ-key-features)
6. [สารบบ Socket Events (Socket.io API Reference)](#-สารบบ-socket-events-socketio-api-reference)
7. [การทดสอบระบบ (Automated Testing)](#-การทดสอบระบบ-automated-testing)
8. [แนวทางการพัฒนาต่อยอด (Future Roadmap)](#-แนวทางการพัฒนาต่อยอด-future-roadmap)

---

## 🏛️ สถาปัตยกรรมของระบบ (Architecture Overview)

ระบบใช้สถาปัตยกรรมแบบ **Hybrid Real-time Architecture**:
- **Live Game State (ระหว่างเล่นกิจกรรม)**: จัดการผ่าน **Node.js + Socket.io (In-Memory Engine)** ภายในคลาส `RoomManager` เพื่อให้ได้ความเร็วสูงสุดระดับมิลลิวินาที (Sub-second Latency) ทั้งการส่งคำตอบ, จับเวลา, และคำนวณคะแนนตามความเร็ว
- **Management & Assets (การจัดการและสื่อประกอบ)**: ทำงานผ่าน Express REST API สำหรับสร้าง/แก้ไข/คัดลอกชุดคำถาม และให้บริการ Static Uploads สำหรับรูปภาพประกอบคำถาม

```
               ┌───────────────────────────────┐
               │    จอใหญ่ของผู้สอน (Host)      │
               │   และมือถือผู้เรียน (Players)  │
               └───────────────┬───────────────┘
                               │ (WebSockets & REST API)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    KaoJai Backend Server                     │
│                                                              │
│  ┌─────────────────────────┐    ┌─────────────────────────┐  │
│  │    Express REST API     │    │   Socket.io Handler     │  │
│  │   • /api/quizzes (CRUD) │    │   • Room Management     │  │
│  │   • /api/upload (Image) │    │   • Real-time Timers    │  │
│  │   • /uploads (Static)   │    │   • Score & Pulse Votes │  │
│  └─────────────────────────┘    └────────────┬────────────┘  │
│                                              │               │
│                                 ┌────────────▼────────────┐  │
│                                 │   RoomManager Engine    │  │
│                                 │   (In-Memory State)     │  │
│                                 └─────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 โครงสร้างไดเรกทอรี (Directory Structure)

```
KaoJai/
├── client/                           # Frontend (React 18 + Vite)
│   ├── public/
│   │   └── avatars/                  # ไฟล์ไอคอน Avatar ผู้เรียน 30 รูปแบบ (.svg)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/               # คอมโพเนนต์ส่วนกลาง
│   │   │   │   ├── PrepareCountdown.jsx # หน้าต่างนับถอยหลัง 5 วินาทีก่อนเริ่มคำถาม
│   │   │   │   └── SoundToggle.jsx      # ปุ่มเปิด/ปิดเสียง SFX ประจำเซสชัน
│   │   │   ├── host/                 # หน้าจอสำหรับผู้สอน/วิทยากร (Host Views)
│   │   │   │   ├── HostHeader.jsx       # แถบหัวแสดง PIN, สลับโหมด, ยอดคนตอบ
│   │   │   │   ├── HostLobby.jsx        # ห้องรอเริ่มเกม พร้อมแสดง Avatar ผู้เข้าร่วม
│   │   │   │   ├── HostQuiz.jsx         # จอแสดงคำถามและกราฟแท่งแนวตั้ง (Bar Chart)
│   │   │   │   ├── HostPulse.jsx        # หน้ารับผลโหวตความเข้าใจ พร้อมปุ่มเรียกตาม (Nudge)
│   │   │   │   └── HostLeaderboard.jsx  # สรุปคะแนนเรซซิ่ง และปุ่ม Export CSV
│   │   │   ├── player/               # หน้าจอสำหรับผู้เรียนบนมือถือ (Player Views)
│   │   │   │   ├── JoinRoom.jsx         # หน้าแรกสำหรับกรอก PIN และเลือกบทบาท
│   │   │   │   ├── AvatarPicker.jsx     # ตัวเลือกรูปโปรไฟล์ 30 แบบ
│   │   │   │   ├── PlayerLobby.jsx      # หน้ารอวิทยากรเริ่มกิจกรรม
│   │   │   │   ├── PlayerQuiz.jsx       # หน้ากดเลือกคำตอบ 4 สี พร้อมกราฟผลตอบรับ
│   │   │   │   ├── PlayerPulse.jsx      # หน้ากดประเมินความเข้าใจ 3 ระดับ พร้อม Popup Nudge
│   │   │   │   └── PlayerEndedView.jsx  # หน้าสรุปผลคะแนนส่วนตัวเมื่อจบกิจกรรม
│   │   │   └── teacher/
│   │   │       └── TeacherBackoffice.jsx # จัดการชุดคำถาม (สร้าง/แก้ไข/โคลน/อัปโหลดรูป)
│   │   ├── context/                  # Socket.io Context & Custom Hooks
│   │   │   ├── SocketContext.jsx
│   │   │   ├── SocketContextObject.js
│   │   │   └── useSocket.js
│   │   ├── styles/                   # สไตล์หลักและตัวแปรกำหนดชุดสี
│   │   │   ├── variables.css         # CSS Variables (Earth Tone & Action Colors)
│   │   │   └── global.css            # Global Reset & Glassmorphism Utilities
│   │   ├── utils/                    # ยูทิลิตี้และเอฟเฟกต์
│   │   │   ├── audioSFX.js           # Web Audio API Sound Synthesizer & SFX
│   │   │   ├── confetti.js           # เอฟเฟกต์เปเปอร์ชูตเฉลิมฉลอง
│   │   │   └── exportReport.js       # ส่งออกรายงานผลคะแนน UTF-8 BOM (.csv)
│   │   ├── App.jsx                   # Main Router & State Orchestrator
│   │   └── main.jsx
│   ├── vite.config.js                # Vite Config พร้อมตัวดัก Proxy Disconnect
│   └── package.json
│
└── server/                           # Backend (Node.js Express + Socket.io)
    ├── public/
    │   └── uploads/                  # ที่จัดเก็บรูปประกอบคำถาม (Git-ignored)
    ├── src/
    │   ├── index.js                  # Entrypoint, Express API, และ ClientError Filter
    │   ├── roomManager.js            # Core In-Memory Engine (Rooms, Scores, States)
    │   ├── socketHandler.js          # จัดการ WebSocket Events ทั้งหมด
    │   └── quizData.js               # จัดการคลังชุดคำถามตัวอย่าง และฟังก์ชัน Duplicate
    ├── tests/                        # Automated Test Suite (100% Native Node Assertion)
    │   ├── run-tests.js              # Test Runner
    │   ├── roomManager.test.js       # ทดสอบ Engine และสูตรคำนวณคะแนน
    │   ├── socketHandler.test.js     # ทดสอบ Real-time Socket Flows
    │   ├── quizData.test.js          # ทดสอบ CRUD ชุดคำถาม
    │   └── api.test.js               # ทดสอบ REST Endpoints
    └── package.json
```

---

## ⚡ เทคโนโลยีที่เลือกใช้ (Tech Stack)

### ฝั่ง Frontend (Client)
- **Framework**: React 18
- **Build Tool**: Vite 5 (เปิดใช้งาน HMR & React Fast Refresh)
- **Icons**: Lucide React
- **Audio**: Web Audio API Synthesizer (สร้างเสียงสด ไม่ต้องพึ่งพาไฟล์เสียงขนาดใหญ่)
- **Effects**: Canvas Confetti
- **Styling**: Pure CSS3 Variables & Responsive Flex/Grid (Earth Tone Palette)

### ฝั่ง Backend (Server)
- **Runtime**: Node.js (v18+)
- **HTTP Server**: Express.js
- **Real-time Gateway**: Socket.io 4
- **Testing Framework**: Node.js Native Assertion (`node:assert/strict`)

---

## 🚀 คู่มือการติดตั้งและเริ่มต้นใช้งาน (Getting Started)

### ความต้องการของระบบ (Prerequisites)
- [Node.js](https://nodejs.org/) เวอร์ชัน 18.0 ขึ้นไป
- Git

### 1. ติดตั้ง Dependencies
```bash
# ติดตั้งฝั่ง Backend Server
cd server
npm install

# ติดตั้งฝั่ง Frontend Client
cd ../client
npm install
```

### 2. รันระบบในโหมดพัฒนา (Development Mode)
เปิด Terminal 2 หน้าต่าง:

**Terminal 1: รัน Backend Server (Port 4000)**
```bash
cd server
npm start
# หรือรันแบบ auto-reload: npm run dev
```

**Terminal 2: รัน Frontend Client (Port 3000)**
```bash
cd client
npm run dev
```
เปิดเบราว์เซอร์ไปที่: **`http://localhost:3000`**

---

## 🎯 ฟีเจอร์หลักของระบบ (Key Features)

### 1. 🎮 Gamified Quiz Mode (เกมตอบคำถามชิงรางวัล)
- **สุ่ม Game PIN 6 หลัก** โดยไม่ซ้ำกับห้องที่กำลังเปิดใช้งาน
- **Get Ready 5s Countdown**: ป๊อปอัปนับถอยหลัง 5 วินาทีกลางจอพร้อมเสียง Beep ให้เตรียมตัวก่อนเริ่มคำถาม
- **Speed Scoring Logic**: คำนวณคะแนนตามความเร็วในการตอบ (คะแนนเต็ม 1,000 คะแนน ยิ่งตอบไวยิ่งได้คะแนนสูง)
- **Vertical Bar Chart Result**: กราฟแท่งแนวตั้งสรุปสถิติจำนวนคนตอบแต่ละช้อยส์อย่างชัดเจน พร้อมแบดจ์ `✓ ถูกต้อง`
- **Podium & Racing Leaderboard**: อันดับผู้เล่นแบบ Racing Bar Animation พร้อมเอฟเฟกต์เปเปอร์ชูตเมื่อจบเกม

### 2. 💚💛❤️ Training Pulse Mode (สำรวจความเข้าใจเรียลไทม์)
- **3-Level Understanding**:
  - 🟢 **เข้าใจดีเยี่ยม** (Clear & Confident)
  - 🟡 **ขอตัวอย่างเพิ่มเติม** (Need Example)
  - 🔴 **ขอให้อธิบายซ้ำอีกครั้ง** (Need Recap)
- **Targeted Pulse Nudge**: ปุ่มกดตามผู้เรียนที่ยังไม่ส่งสัญญาณเตือน โดยระบบจะส่ง Popup กึ่งกลางหน้าจอเฉพาะคนที่ยังไม่กดส่งเท่านั้น

### 3. 📋 Teacher Backoffice (ระบบจัดการชุดคำถาม)
- สร้าง, แก้ไข, ลบชุดคำถาม และอัปโหลดรูปภาพประกอบ
- **Duplicate Quiz**: ปุ่มคัดลอกชุดคำถาม (โคลนชุดคำถามพร้อมสร้าง ID คำถามย่อยใหม่อัตโนมัติ)
- แถบบันทึกลอยตัวคงที่ (Floating Sticky Save Bar) ป้องกันการสับสนขนาดปุ่ม

### 4. 📊 Export Report (ส่งออกผลคะแนนเป็น CSV/Excel)
- ปุ่มดาวน์โหลดรายงานผลคะแนนและสถิติ Pulse บนหน้า Leaderboard
- เข้ารหัสด้วย **UTF-8 with BOM (`\uFEFF`)** ทำให้เปิดบน **Microsoft Excel และ Google Sheets ได้ทันทีโดยภาษาไทยไม่เพี้ยน**

### 5. 🔊/🔇 Mute Toggle Settings (ระบบเปิด/ปิดเสียง)
- ปุ่มสลับเสียงรองรับทั้งฝั่งผู้สอนและผู้เรียน บันทึกการตั้งค่าลงใน `localStorage` ข้ามการรีเฟรชหน้าจอ

---

## 📡 สารบบ Socket Events (Socket.io API Reference)

### ฝั่ง Client ส่งหา Server (`socket.emit`)
| Event Name | Payloads | คำอธิบาย |
| :--- | :--- | :--- |
| `create_room` | `{ customQuizId? }` | วิทยากรสร้างห้องใหม่ |
| `join_room` | `{ pin, name, avatar, playerId? }` | ผู้เรียนขอเข้าร่วมห้อง |
| `start_quiz` | `{ pin }` | วิทยากรเริ่มนับถอยหลัง 5 วินาทีก่อนเข้าข้อแรก |
| `next_question` | `{ pin }` | วิทยากรเริ่มนับถอยหลัง 5 วินาทีไปยังคำถามถัดไป |
| `submit_answer` | `{ pin, playerId, optionId }` | ผู้เรียนส่งคำตอบของข้อปัจจุบัน |
| `switch_mode` | `{ pin, mode: 'QUIZ' \| 'PULSE' }` | วิทยากรสลับโหมดระหว่าง Quiz และ Pulse |
| `submit_pulse` | `{ pin, playerId, choice: 'green' \| 'yellow' \| 'red' }` | ผู้เรียนส่งระดับความเข้าใจ |
| `send_pulse_nudge` | `{ pin }` | วิทยากรกดส่งสัญญาณเตือนคนที่ยังไม่ส่งผลประเมิน |
| `show_leaderboard` | `{ pin }` | วิทยากรเรียกดูอันดับคะแนน |
| `reconnect_host` | `{ pin }` | วิทยากรเชื่อมต่อกลับเข้าห้องเดิมหลังรีเฟรช |

### ฝั่ง Server ส่งหา Client (`io.to(pin).emit` หรือ `socket.emit`)
| Event Name | Payloads | คำอธิบาย |
| :--- | :--- | :--- |
| `room_created` | `{ pin, mode, status, players, counts }` | ส่งกลับหาวิทยากรเมื่อสร้างห้องเสร็จ |
| `join_success` | `{ pin, player, mode, status, counts }` | ส่งกลับหาผู้เรียนเมื่อเข้าร่วมสำเร็จ |
| `room_updated` | `{ players, counts }` | แจ้งอัปเดตรายชื่อและยอดผู้เล่นในห้อง |
| `question_prepare` | `{ nextQuestionIndex, totalQuestions, countdownSeconds: 5 }` | แจ้งเริ่มนับถอยหลัง 5 วินาทีกลางจอ |
| `question_start` | `{ question, currentQuestionIndex, totalQuestions, totalPlayers }` | เริ่มแสดงคำถามและเปิดรับคำตอบ |
| `answered_count_update` | `{ answeredCount, totalPlayers }` | อัปเดตจำนวนผู้ตอบคำถามแบบสด |
| `answer_feedback` | `{ isCorrect, pointsEarned, totalScore }` | ส่งผลคำตอบเฉพาะตัวผู้เรียน |
| `question_result` | `{ correctOptionId, optionCounts, answeredCount, totalPlayers }` | สรุปผลคำตอบและสถิติช้อยส์ (สำหรับ Bar Chart) |
| `pulse_nudge_alert` | `{ message, timestamp }` | ส่งป๊อปอัปเตือนกึ่งกลางหน้าจอเฉพาะผู้ที่ยังไม่ส่งผลตอบรับ |
| `pulse_updated` | `{ pulseVotes, pulseAnsweredCount, totalPlayers }` | สรุปคะแนนโหวตความเข้าใจ |
| `show_leaderboard` | `{ leaderboard, status }` | แสดงอันดับคะแนนผู้เรียน |
| `quiz_ended` | `{ leaderboard, isEnded: true }` | สิ้นสุดเกมและประกาศผล Podium |

---

## 🧪 การทดสอบระบบ (Automated Testing)

โปรเจกต์มีชุดทดสอบอัตโนมัติครบถ้วนทั้ง Unit Tests, Integration Tests และ API Tests:

```bash
# รันชุดทดสอบ Backend Server ทั้งหมด (4 Test Suites)
cd server
npm test
```

ผลการทดสอบครอบคลุม:
1. `quizData.test.js`: การดึง/บันทึก/ลบ/คัดลอกชุดคำถาม
2. `roomManager.test.js`: การสร้างห้อง, คำนวณคะแนนความเร็ว, Disconnect Grace Period, การรวมคะแนน Pulse
3. `socketHandler.test.js`: จำลอง Socket Connection, การนับถอยหลัง 5 วินาที, การส่ง Nudge เฉพาะคนที่ยังไม่ตอบ, การแสดงกราฟ Bar Chart
4. `api.test.js`: ทดสอบ REST Endpoints `/api/health`, `/api/quizzes`, `/api/upload`

```bash
# ทดสอบการ Compile และ Bundle ฝั่ง Frontend Client
cd client
npm run build
```

---

## 🔮 แนวทางการพัฒนาต่อยอด (Future Roadmap)

1. **เชื่อมต่อฐานข้อมูลถาวร (Persistent Database with Supabase)**:
   - ใช้ **Supabase PostgreSQL** เก็บชุดคำถามและประวัติผลคะแนนกิจกรรมย้อนหลัง
   - ใช้ **Supabase Storage Bucket** จัดเก็บรูปภาพประกอบคำถามแทนโฟลเดอร์ในเครื่อง (รองรับการ Deploy ขึ้น Cloud แบบ Serverless / Containers ได้อย่างราบรื่น)
2. **ระบบจัดการสิทธิ์ผู้สอน (Authentication)**:
   - ล็อกอินด้วย Email/Google ผ่าน Supabase Auth เพื่อแยกคลังชุดคำถามของอาจารย์แต่ละท่าน
3. **ระบบสุ่มคำถามและสลับตัวเลือก (Shuffle Questions & Options)**:
   - ตัวเลือกสุ่มลำดับคำถามและลำดับตัวเลือกเพื่อป้องกันผู้เรียนมองจอกัน
4. **โหมดแบ่งกลุ่มแข่งขัน (Team Mode)**:
   - ให้ผู้เรียนรวมกลุ่มและคำนวณคะแนนเฉลี่ยเป็นทีม

---

## 📄 ใบอนุญาต (License)
MIT License - สามารถนำไปปรับใช้ พัฒนาต่อยอด และประยุกต์ใช้งานในองค์กรหรือสถาบันการศึกษาได้อย่างอิสระครับ!
