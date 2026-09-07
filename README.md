# 💖 KaoJai (เข้าใจ) - Real-time Interactive Quiz & Training Pulse Platform

<img width="902" height="619" alt="image" src="https://github.com/user-attachments/assets/f54c9d5a-4c0b-464e-ac2e-745f5647d651" />


> **KaoJai** เป็นเว็บแอปพลิเคชันสำหรับการถาม-ตอบและสำรวจความเข้าใจแบบเรียลไทม์ (Interactive Response System) ที่ผสมผสานระหว่าง **เกมตอบคำถาม (Gamified Quiz & Sequence Race)**, **การประเมินความเข้าใจระหว่างอบรม (Training Pulse 3 ระดับ 🟢 🟡 🔴)**, และ **ระบบจัดทีมแข่งขัน (Team Mode)** ออกแบบตามหลัก Earth Tone UI, Cognitive Ergonomics และรองรับการใช้งานบนทุกอุปกรณ์

---

## 📑 สารบัญ (Table of Contents)
1. [สถาปัตยกรรมของระบบ (Architecture Overview)](#-สถาปัตยกรรมของระบบ-architecture-overview)
2. [โครงสร้างไดเรกทอรี (Directory Structure)](#-โครงสร้างไดเรกทอรี-directory-structure)
3. [เทคโนโลยีที่เลือกใช้ (Tech Stack)](#-เทคโนโลยีที่เลือกใช้-tech-stack)
4. [คู่มือการติดตั้งและเริ่มต้นใช้งาน (Getting Started)](#-คู่มือการติดตั้งและเริ่มต้นใช้งาน-getting-started)
5. [การรันผ่าน Docker (Container Deployment)](#-การรันผ่าน-docker-container-deployment)
6. [ฟีเจอร์หลักของระบบ (Key Features)](#-ฟีเจอร์หลักของระบบ-key-features)
7. [สารบบ Socket Events (Socket.io API Reference)](#-สารบบ-socket-events-socketio-api-reference)
8. [การทดสอบระบบ (Automated Testing)](#-การทดสอบระบบ-automated-testing)
9. [แนวทางการพัฒนาต่อยอด (Future Roadmap)](#-แนวทางการพัฒนาต่อยอด-future-roadmap)

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
│  └─────────────────────────┘    │   • Teams Management    │  │
│                                 └────────────┬────────────┘  │
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
│   │   │   │   ├── HostLobby.jsx        # ห้องรอเริ่มเกม, จัดทีม (Drag & Drop), สุ่มทีม
│   │   │   │   ├── HostQuiz.jsx         # จอแสดงคำถามปกติ & Sequence Race พร้อม Bar Chart
│   │   │   │   ├── HostPulse.jsx        # หน้ารับผลโหวตความเข้าใจ พร้อมปุ่มเรียกตาม (Nudge)
│   │   │   │   └── HostLeaderboard.jsx  # สรุปคะแนนเรซซิ่ง และปุ่ม Export CSV
│   │   │   ├── player/               # หน้าจอสำหรับผู้เรียนบนมือถือ (Player Views)
│   │   │   │   ├── JoinRoom.jsx         # หน้าแรกสำหรับกรอก PIN และเลือกบทบาท
│   │   │   │   ├── AvatarPicker.jsx     # ตัวเลือกรูปโปรไฟล์ 30 แบบ (พร้อมสุ่มอัตโนมัติ)
│   │   │   │   ├── PlayerLobby.jsx      # หน้ารอวิทยากรเริ่มกิจกรรม พร้อมตัวเลือกทีม
│   │   │   │   ├── PlayerQuiz.jsx       # หน้ากดเลือกคำตอบ 4 สี
│   │   │   │   ├── PlayerSequence.jsx   # หน้าจอจัดลำดับขั้นตอน Sequence Race (Drag & Drop / Touch)
│   │   │   │   ├── PlayerPulse.jsx      # หน้ากดประเมินความเข้าใจ 3 ระดับ พร้อม Popup Nudge
│   │   │   │   ├── PlayerLeaderboardView.jsx # หน้ารอดูคะแนนและอันดับของตนเองระหว่างข้อ
│   │   │   │   └── PlayerEndedView.jsx  # หน้าสรุปผลคะแนนส่วนตัวเมื่อจบกิจกรรม
│   │   │   └── teacher/
│   │   │       └── TeacherBackoffice.jsx # จัดการชุดคำถาม (สร้าง/แก้ไข/โคลน/อัปโหลดรูป)
│   │   ├── context/                  # Socket.io Context & Custom Hooks
│   │   ├── styles/                   # สไตล์หลักและตัวแปรกำหนดชุดสี
│   │   ├── utils/                    # ยูทิลิตี้และเอฟเฟกต์
│   │   │   ├── audioSFX.js           # Web Audio API Sound Synthesizer & SFX
│   │   │   ├── sequenceThemes.js     # ธีมสีแยกเฉพาะสำหรับตัวเลือก Sequence Race
│   │   │   ├── confetti.js           # เอฟเฟกต์เปเปอร์ชูตเฉลิมฉลอง
│   │   │   └── exportReport.js       # ส่งออกรายงานผลคะแนน UTF-8 BOM (.csv)
│   │   ├── App.jsx                   # Main Router & State Orchestrator
│   │   └── main.jsx
│   ├── nginx.conf                    # Nginx Configuration สำหรับ Production Container
│   ├── Dockerfile                    # Multi-stage Build สำหรับ React Client
│   └── vite.config.js                # Vite Config รองรับ allowedHosts & Proxy
│
├── server/                           # Backend (Node.js Express + Socket.io)
│   ├── public/
│   │   └── uploads/                  # ที่จัดเก็บรูปประกอบคำถาม (Persistent Volume)
│   ├── src/
│   │   ├── index.js                  # Entrypoint, Express API, และ Static Serving
│   │   ├── roomManager.js            # Core In-Memory Engine (Rooms, Scores, Teams, Shuffling)
│   │   ├── socketHandler.js          # จัดการ WebSocket Events ทั้งหมด
│   │   └── quizData.js               # จัดการคลังชุดคำถามตัวอย่าง และฟังก์ชัน Duplicate
│   ├── tests/                        # Automated Test Suite (100% Native Node Assertion)
│   │   ├── run-tests.js              # Test Runner
│   │   ├── roomManager.test.js       # ทดสอบ Engine, Sequence Evaluation, และ Team Lifecycle
│   │   ├── socketHandler.test.js     # ทดสอบ Real-time Socket Flows
│   │   ├── quizData.test.js          # ทดสอบ CRUD ชุดคำถาม
│   │   └── api.test.js               # ทดสอบ REST Endpoints
│   ├── Dockerfile                    # Node.js Alpine Container
│   └── package.json
│
├── docker-compose.yml                # Docker Compose Orchestration (Production-Ready)
└── nginx.conf                        # Root Nginx Proxy Configuration
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
- **Container**: Docker & Docker Compose with Alpine Linux

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

## 🐳 การรันผ่าน Docker (Container Deployment)

ระบบมี Docker Configuration ที่พร้อมใช้งานทันที (รองรับ Production, Nginx Reverse Proxy, และ Persistent Uploads):

```bash
# สั่ง Build และรันทั้งระบบผ่าน Docker Compose
docker compose up --build -d
```

- **Frontend Client (Nginx)**: เข้าใช้งานผ่าน `http://localhost` (Port 80)
- **Backend API & Socket**: ทำงานภายในเครือข่าย Docker และสื่อสารผ่าน Nginx Reverse Proxy อัตโนมัติ
- **Persistent Data**: โฟลเดอร์รูปภาพคำถามจะถูกจัดเก็บใน Docker Volume `server_uploads` อย่างถาวร

---

## 🎯 ฟีเจอร์หลักของระบบ (Key Features)

### 1. 🎮 Gamified Quiz Mode (เกมตอบคำถามชิงรางวัล)
- **สุ่ม Game PIN 6 หลัก** โดยไม่ซ้ำกับห้องที่กำลังเปิดใช้งาน
- **Get Ready 5s Countdown**: ป๊อปอัปนับถอยหลัง 5 วินาทีกลางจอพร้อมเสียง Beep ให้เตรียมตัวก่อนเริ่มคำถาม
- **Speed Scoring Logic**: คำนวณคะแนนตามความเร็วในการตอบ (คะแนนเต็ม 1,000 คะแนน ยิ่งตอบไวยิ่งได้คะแนนสูง)
- **Vertical Bar Chart Result**: กราฟแท่งแนวตั้งสรุปสถิติจำนวนคนตอบแต่ละช้อยส์อย่างชัดเจน พร้อมแบดจ์ `✓ ถูกต้อง`
- **Podium & Racing Leaderboard**: อันดับผู้เล่นแบบ Racing Bar Animation พร้อมเอฟเฟกต์เปเปอร์ชูตเมื่อจบเกม

### 2. 🏎️ Sequence Race Mode (เกมแข่งจัดเรียงลำดับขั้นตอน)
- **โหมดจัดเรียงลำดับ**: ให้ผู้เรียนจัดเรียงลำดับขั้นตอน (เช่น ลำดับกระบวนการทำงาน หรือขั้นตอนอัลกอริทึม)
- **Smooth Drag & Drop / Touch Reordering**: รองรับทั้งการลากวางด้วยเมาส์ และการแตะรูดสัมผัสบนสมาร์ทโฟน หรือกดปุ่มลูกศร ⬆️ ⬇️
- **Partial & Perfect Scoring Engine**: คำนวณคะแนนตามสัดส่วนตำแหน่งที่ถูกต้อง และโบนัสความเร็วเมื่อจัดถูกครบ 100%
- **Color Themes & Visual Reveal**: ดีไซน์การ์ดขั้นตอนด้วยโทนสีที่ตัดกันอย่างชัดเจน พร้อมหน้าจอเฉลยแบบแยกรายละเอียดแต่ละขั้นตอน

### 3. 👥 Team Mode (โหมดจัดทีมแข่งขัน & สลับกลุ่ม)
- **Host Control Toggle**: วิทยากรสามารถเปิด/ปิดโหมดทีมได้ตามต้องการในแต่ละเซสชัน
- **Auto-Assign Evenly**: ปุ่มสุ่มกระจายผู้เรียนเข้าแต่ละทีมอย่างเท่าเทียมกันในคลิกเดียว
- **Host Drag & Drop & Quick Select**: วิทยากรสามารถลาก Avatar ผู้เล่นหย่อนใส่กล่องทีม หรือเลือกเปลี่ยนทีมผ่านเมนู Dropdown ได้อย่างรวดเร็ว
- **Player Self-Select**: เมื่อเปิดโหมดทีม ผู้เรียนสามารถแตะเลือกเข้าทีม หรือย้ายทีมได้ด้วยตนเองจากหน้าจอมือถือ

### 4. 💚💛❤️ Training Pulse Mode (สำรวจความเข้าใจเรียลไทม์)
- **3-Level Understanding**:
  - 🟢 **เข้าใจดีเยี่ยม** (Clear & Confident)
  - 🟡 **ขอตัวอย่างเพิ่มเติม** (Need Example)
  - 🔴 **ขอให้อธิบายซ้ำอีกครั้ง** (Need Recap)
- **Targeted Pulse Nudge**: ปุ่มกดตามผู้เรียนที่ยังไม่ส่งสัญญาณเตือน โดยระบบจะส่ง Popup กึ่งกลางหน้าจอเฉพาะคนที่ยังไม่กดส่งเท่านั้น
- **Live Floating Reactions**: ส่งอีโมจิสดลอยขึ้นหน้าจอวิทยากรระหว่างบรรยาย

### 5. 📋 Teacher Backoffice (ระบบจัดการชุดคำถาม)
- สร้าง, แก้ไข, ลบชุดคำถาม รองรับทั้งแบบ Choice และ Sequence พร้อมอัปโหลดรูปภาพประกอบ
- **Duplicate Quiz**: ปุ่มคัดลอกชุดคำถาม (โคลนชุดคำถามพร้อมสร้าง ID คำถามย่อยใหม่อัตโนมัติ)
- แถบบันทึกลอยตัวคงที่ (Floating Sticky Save Bar) ป้องกันการสับสนขนาดปุ่ม

### 6. 📊 Export Report (ส่งออกผลคะแนนเป็น CSV/Excel)
- ปุ่มดาวน์โหลดรายงานผลคะแนนและสถิติ Pulse บนหน้า Leaderboard
- เข้ารหัสด้วย **UTF-8 with BOM (`\uFEFF`)** ทำให้เปิดบน **Microsoft Excel และ Google Sheets ได้ทันทีโดยภาษาไทยไม่เพี้ยน**

---

## 📡 สารบบ Socket Events (Socket.io API Reference)

### ฝั่ง Client ส่งหา Server (`socket.emit`)
| Event Name | Payloads | คำอธิบาย |
| :--- | :--- | :--- |
| `create_room` | `{ customQuizId? }` | วิทยากรสร้างห้องใหม่ |
| `join_room` | `{ pin, name, avatar, playerId? }` | ผู้เรียนขอเข้าร่วมห้อง |
| `start_quiz` | `{ pin }` | วิทยากรเริ่มนับถอยหลัง 5 วินาทีก่อนเข้าข้อแรก |
| `next_question` | `{ pin }` | วิทยากรเริ่มนับถอยหลัง 5 วินาทีไปยังคำถามถัดไป |
| `submit_answer` | `{ pin, playerId, optionId? \| orderedItemIds? }` | ผู้เรียนส่งคำตอบ (รองรับทั้งช้อยส์ปกติ และลำดับขั้นตอน Sequence) |
| `switch_mode` | `{ pin, mode: 'QUIZ' \| 'PULSE' }` | วิทยากรสลับโหมดระหว่าง Quiz และ Pulse |
| `submit_pulse` | `{ pin, playerId, choice: 'green' \| 'yellow' \| 'red' }` | ผู้เรียนส่งระดับความเข้าใจ |
| `send_pulse_nudge` | `{ pin }` | วิทยากรกดส่งสัญญาณเตือนคนที่ยังไม่ส่งผลประเมิน |
| `send_pulse_reaction` | `{ pin, emoji, playerId }` | ผู้เรียนส่งปฏิกิริยา Reaction ลอยขึ้นหน้าจอ |
| `show_leaderboard` | `{ pin }` | วิทยากรเรียกดูอันดับคะแนน |
| `reconnect_host` | `{ pin }` | วิทยากรเชื่อมต่อกลับเข้าห้องเดิมหลังรีเฟรช |
| `toggle_teams` | `{ pin, enabled }` | วิทยากรเปิด/ปิดโหมดทีมในห้องกิจกรรม |
| `create_team` | `{ pin, name, color }` | วิทยากรสร้างทีมใหม่ |
| `remove_team` | `{ pin, teamId }` | วิทยากรลบทีม |
| `assign_team` | `{ pin, playerId, teamId }` | กำหนดผู้เล่นเข้าทีม (ใช้ได้ทั้งผู้สอนและผู้เรียนเลือกเอง) |
| `auto_assign_teams` | `{ pin, teamCount? }` | วิทยากรสั่งสุ่มจัดทีมผู้เรียนอัตโนมัติ |
| `get_teams` | `{ pin }` | ดึงรายชื่อทีมและสมาชิกปัจจุบัน |

### ฝั่ง Server ส่งหา Client (`io.to(pin).emit` หรือ `socket.emit`)
| Event Name | Payloads | คำอธิบาย |
| :--- | :--- | :--- |
| `room_created` | `{ pin, mode, status, players, counts, teamsEnabled, teams }` | ส่งกลับหาวิทยากรเมื่อสร้างห้องเสร็จ |
| `join_success` | `{ pin, player, mode, status, counts, teamsEnabled, teams }` | ส่งกลับหาผู้เรียนเมื่อเข้าร่วมสำเร็จ |
| `room_updated` | `{ players, counts }` | แจ้งอัปเดตรายชื่อและยอดผู้เล่นในห้อง |
| `teams_toggled` | `{ teamsEnabled, teams, players }` | แจ้งสถานะเปิด/ปิดโหมดทีมพร้อมข้อมูลล่าสุด |
| `teams_updated` | `{ teams, players }` | แจ้งอัปเดตรายชื่อทีมและการสังกัดกลุ่มของทุกคน |
| `question_prepare` | `{ nextQuestionIndex, totalQuestions, countdownSeconds: 5 }` | แจ้งเริ่มนับถอยหลัง 5 วินาทีกลางจอ |
| `question_start` | `{ question, currentQuestionIndex, totalQuestions, totalPlayers }` | เริ่มแสดงคำถามและเปิดรับคำตอบ |
| `answered_count_update` | `{ answeredCount, totalPlayers }` | อัปเดตจำนวนผู้ตอบคำถามแบบสด |
| `answer_feedback` | `{ isCorrect, pointsEarned, totalScore, details? }` | ส่งผลคำตอบเฉพาะตัวผู้เรียน |
| `question_result` | `{ questionType, correctOptionId?, correctSequence?, optionCounts?, totalPlayers }` | สรุปผลคำตอบและสถิติช้อยส์ |
| `pulse_nudge_alert` | `{ message, timestamp }` | ส่งป๊อปอัปเตือนกึ่งกลางหน้าจอเฉพาะผู้ที่ยังไม่ส่งผลตอบรับ |
| `pulse_reaction_received` | `{ emoji, playerId }` | กระจายเอฟเฟกต์ Reaction ไปยังทุกหน้าจอ |
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
1. `quizData.test.js`: การดึง/บันทึก/ลบ/คัดลอกชุดคำถาม (ทั้ง Choice และ Sequence)
2. `roomManager.test.js`: การสร้างห้อง, คำนวณคะแนนความเร็ว, Disconnect Grace Period, การสลับโหมด, การประเมิน Sequence Race, และ Team Management Lifecycle
3. `socketHandler.test.js`: จำลอง Socket Connection, การนับถอยหลัง 5 วินาที, การส่ง Nudge, การรับส่งคำตอบแบบ Sequence, และการจัดการทีม
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
   - ใช้ **Supabase Storage Bucket** จัดเก็บรูปภาพประกอบคำถามแทนโฟลเดอร์ในเครื่อง
2. **ระบบจัดการสิทธิ์ผู้สอน (Authentication)**:
   - ล็อกอินด้วย Email/Google ผ่าน Supabase Auth เพื่อแยกคลังชุดคำถามของอาจารย์แต่ละท่าน
3. **ระบบสุ่มคำถามและสลับตัวเลือก (Shuffle Questions & Options)**:
   - ตัวเลือกสุ่มลำดับคำถามและลำดับตัวเลือกเพื่อป้องกันผู้เรียนมองจอกัน
4. **Team Leaderboard View**:
   - แสดงหน้าจอสรุปอันดับคะแนนรวมสะสมรายทีมบน Podium

---

## 📄 ใบอนุญาต (License)
MIT License - สามารถนำไปปรับใช้ พัฒนาต่อยอด และประยุกต์ใช้งานในองค์กรหรือสถาบันการศึกษาได้อย่างอิสระครับ!
