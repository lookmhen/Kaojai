# 💖 KaoJai (เข้าใจ) - Real-time Interactive Quiz & Training Pulse Platform

<img width="902" height="619" alt="image" src="https://github.com/user-attachments/assets/f54c9d5a-4c0b-464e-ac2e-745f5647d651" />


> **KaoJai** เป็นเว็บแอปพลิเคชันสำหรับการถาม-ตอบและสำรวจความเข้าใจแบบเรียลไทม์ (Interactive Response System) ที่ผสมผสานระหว่าง **เกมตอบคำถาม (Gamified Quiz & Sequence Race)**, **การประเมินความเข้าใจระหว่างอบรม (Training Pulse 3 ระดับ 🟢 🟡 🔴)**, และ **ระบบจัดทีมแข่งขัน (Team Mode)** ออกแบบตามหลัก Earth Tone UI, Cognitive Ergonomics และรองรับการใช้งานบนทุกอุปกรณ์

---

### 📑 สารบัญ (Table of Contents)
1. [สถาปัตยกรรมของระบบ (Architecture Overview)](#-สถาปัตยกรรมของระบบ-architecture-overview)
2. [โครงสร้างไดเรกทอรี (Directory Structure)](#-โครงสร้างไดเรกทอรี-directory-structure)
3. [เทคโนโลยีที่เลือกใช้ (Tech Stack)](#-เทคโนโลยีที่เลือกใช้-tech-stack)
4. [คู่มือการติดตั้งและเริ่มต้นใช้งาน (Getting Started)](#-คู่มือการติดตั้งและเริ่มต้นใช้งาน-getting-started)
5. [การรันผ่าน Docker (Container Deployment)](#-การรันผ่าน-docker-container-deployment)
6. [ฟีเจอร์หลักของระบบ (Key Features)](#-ฟีเจอร์หลักของระบบ-key-features)
7. [ระบบยืนยันตัวตนและการจัดการสิทธิ์ (Authentication & Roles)](#-ระบบยืนยันตัวตนและการจัดการสิทธิ์-authentication--roles)
8. [ความมั่นคงปลอดภัยระดับ Production (Security Hardening)](#-ความมั่นคงปลอดภัยระดับ-production-security-hardening)
9. [สารบบ Socket Events (Socket.io API Reference)](#-สารบบ-socket-events-socketio-api-reference)
10. [คู่มือสำหรับนักพัฒนาในการเพิ่มหรือปรับแต่งโหมด (Developer Guidelines)](#-คู่มือสำหรับนักพัฒนาในการเพิ่มหรือปรับแต่งโหมด-developer-guidelines)
11. [การทดสอบระบบ (Automated Testing)](#-การทดสอบระบบ-automated-testing)
12. [แนวทางการพัฒนาต่อยอด (Future Roadmap)](#-แนวทางการพัฒนาต่อยอด-future-roadmap)

---

## 🏛️ สถาปัตยกรรมของระบบ (Architecture Overview)

ระบบใช้สถาปัตยกรรมแบบ **Hybrid Real-time Architecture**:
- **Live Game State (ระหว่างเล่นกิจกรรม)**: จัดการผ่าน **Node.js + Socket.io (In-Memory Engine)** ภายในคลาส `RoomManager` เพื่อให้ได้ความเร็วสูงสุดระดับมิลลิวินาที (Sub-second Latency) ทั้งการส่งคำตอบ, จับเวลา, และคำนวณคะแนนตามความเร็ว
- **Persistence & Session Recovery (จัดเก็บข้อมูลถาวร)**: บันทึกสถานะห้อง, ผลสอบ Pre-test, รายชื่อผู้เรียน และบัญชีผู้ใช้ลง **SQLite (Node.js Built-in `node:sqlite`)** ป้องกันข้อมูลสูญหายเมื่อเซิร์ฟเวอร์รีสตาร์ตหรือพักการอบรมข้ามมื้อเที่ยง
- **Authentication & Authorization**: ตรวจสอบสิทธิ์ด้วย JWT Token (HMAC SHA-256) และ Hash รหัสผ่านด้วย Node.js Built-in `crypto.scryptSync` รองรับ 2 บทบาท (ADMIN และ TEACHER)
- **Management & Assets (การจัดการและสื่อประกอบ)**: ทำงานผ่าน Express REST API สำหรับจัดการบัญชีผู้ใช้, สร้าง/แก้ไข/คัดลอก/สร้างด้วย AI ชุดคำถาม และให้บริการ Static Uploads พร้อม Magic Bytes Validation

```
               ┌───────────────────────────────┐
               │    จอใหญ่ของผู้สอน (Host)      │
               │   และมือถือผู้เรียน (Players)  │
               └───────────────┬───────────────┘
                               │ (WebSockets & REST API + JWT)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    KaoJai Backend Server                     │
│                                                              │
│  ┌─────────────────────────┐    ┌─────────────────────────┐  │
│  │    Express REST API     │    │   Socket.io Handler     │  │
│  │   • /api/auth (JWT)     │    │   • Room Management     │  │
│  │   • /api/quizzes (CRUD) │    │   • Real-time Timers    │  │
│  │   • /api/upload (Image) │    │   • Score & Pulse Votes │  │
│  │   • /uploads (Static)   │    │   • Roster & Claiming   │  │
│  └─────────────────────────┘    │   • Security Ownership  │  │
│                                 └────────────┬────────────┘  │
│                                              │               │
│  ┌─────────────────────────┐    ┌────────────▼────────────┐  │
│  │  SQLite (node:sqlite)   │◄───┤   RoomManager Engine    │  │
│  │  • rooms (Snapshot)     │    │   (In-Memory + Rehydrate│  │
│  │  • roster_players       │    └─────────────────────────┘  │
│  │  • users (Auth)         │                                 │
│  └─────────────────────────┘                                 │
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
│   │   │   ├── auth/                 # ระบบยืนยันตัวตน (Authentication)
│   │   │   │   └── AdminLoginModal.jsx # หน้าต่างเข้าสู่ระบบ Admin และ Teacher (Earth Tone)
│   │   │   ├── common/               # คอมโพเนนต์ส่วนกลาง (PrepareCountdown, SequenceIntroGuide, LuckyDraw)
│   │   │   │   ├── PrepareCountdown.jsx # ป๊อปอัปนับถอยหลัง 5 วินาทีก่อนเริ่มคำถาม
│   │   │   │   ├── SequenceIntroGuide.jsx # หน้าต่างแนะนำกติกาข้อ Sequence ครั้งแรก (Animated Drag Demo)
│   │   │   │   ├── LuckyDrawPage.jsx    # หน้าจอเต็มสุ่มผู้โชคดี (Full-screen Dedicated Page)
│   │   │   │   ├── LuckyWaterPool.jsx   # ระบบจำลองอ่างน้ำตักลูกบอลฟิสิกส์ 60fps (Web Audio & Realistic Scooping)
│   │   │   │   └── LuckyDrawWheel.jsx   # ระบบวงล้อหมุนสุ่มรางวัล (Wheel of Fortune Canvas)
│   │   │   ├── host/                 # หน้าจอสำหรับผู้สอน/วิทยากร (Host Views)
│   │   │   │   ├── HostHeader.jsx       # แถบหัวแสดง PIN, สลับโหมด, ยอดคนตอบ
│   │   │   │   ├── HostLobby.jsx        # ห้องรอเริ่มเกม, QR Code, จัดทีม, สุ่มทีม, โหมด Pre/Post-test
│   │   │   │   ├── HostQuiz.jsx         # จอแสดงคำถามปกติ & Sequence Race พร้อม Bar Chart
│   │   │   │   ├── HostPulse.jsx        # หน้ารับผลโหวตความเข้าใจ พร้อมปุ่มเรียกตาม (Nudge)
│   │   │   │   ├── HostLeaderboard.jsx  # สรุปคะแนนเรซซิ่ง, Learning Gain, และปุ่ม Export
│   │   │   │   └── SportsPodium.jsx     # แท่นรับรางวัลสไตล์นักกีฬาโอลิมปิก 3 อันดับ (🥇🥈🥉) พร้อม Avatar & มงกุฎลอยได้
│   │   │   ├── player/               # หน้าจอสำหรับผู้เรียนบนมือถือ (Player Views)
│   │   │   │   ├── JoinRoom.jsx         # หน้าแรก: กรอก PIN, 1-Click Roster Claim, และปุ่มเข้าสู่ระบบ
│   │   │   │   ├── AvatarPicker.jsx     # ตัวเลือกรูปโปรไฟล์ 30 แบบ (พร้อมสุ่มอัตโนมัติ)
│   │   │   │   ├── PlayerLobby.jsx      # หน้ารอวิทยากรเริ่มกิจกรรม พร้อมตัวเลือกทีม
│   │   │   │   ├── PlayerQuiz.jsx       # หน้ากดเลือกคำตอบ 4 สี
│   │   │   │   ├── PlayerSequence.jsx   # หน้าจอจัดลำดับขั้นตอน Sequence Race (Drag & Drop / Touch)
│   │   │   │   ├── PlayerPulse.jsx      # หน้ากดประเมินความเข้าใจ 3 ระดับ พร้อม Popup Nudge
│   │   │   │   ├── PlayerLeaderboardView.jsx # หน้ารอดูคะแนนและอันดับของตนเองระหว่างข้อ
│   │   │   │   └── PlayerEndedView.jsx  # หน้าสรุปผลคะแนนส่วนตัวเมื่อจบกิจกรรม
│   │   │   └── teacher/
│   │   │       ├── TeacherBackoffice.jsx # จัดการชุดคำถาม (สร้าง/แก้ไข/โคลน/อัปโหลดรูป)
│   │   │       ├── UserManagementModal.jsx # จัดการผู้ใช้งาน (เพิ่ม/ลบ/เปลี่ยน Role สำหรับ Admin)
│   │   │       └── AiQuizGeneratorModal.jsx # หน้าต่างสร้างชุดข้อสอบอัตโนมัติด้วย AI
│   │   ├── context/                  # Socket.io Context, Session Recovery & AuthContext (JWT)
│   │   │   ├── AuthContext.jsx       # State จัดการ JWT Token, User Profile, Roles, และ authFetch
│   │   │   └── SocketContext.jsx     # Real-time WebSocket Context & Session Persistence
│   │   ├── styles/                   # สไตล์หลักและตัวแปรกำหนดชุดสี
│   │   ├── utils/                    # Audio SFX, QR Generator, Export Reports
│   │   ├── App.jsx                   # Main Router, Role Guards & State Orchestrator
│   │   └── main.jsx
│   ├── index.html                    # HTML Shell พร้อม Content Security Policy (CSP Meta Tag)
│   ├── nginx.conf                    # Nginx Configuration สำหรับ Production Container
│   ├── Dockerfile                    # Multi-stage Build สำหรับ React Client
│   └── vite.config.js                # Vite Config รองรับ allowedHosts & Proxy
│
├── server/                           # Backend (Node.js Express + Socket.io + SQLite)
│   ├── data/
│   │   ├── quizzes.json              # ฐานข้อมูลชุดคำถาม JSON
│   │   └── kaojai.sqlite             # ฐานข้อมูล SQLite เก็บ Rooms, Roster Players และ Users
│   ├── public/
│   │   └── uploads/                  # ที่จัดเก็บรูปประกอบคำถาม (Persistent Volume)
│   ├── src/
│   │   ├── index.js                  # Entrypoint, Express API, Rate Limiters, Static Serving
│   │   ├── auth.js                   # JWT Authentication, Password Policies, Role Middleware
│   │   ├── db.js                     # SQLite Engine (node:sqlite) รองรับ Rooms, Rosters, Users
│   │   ├── roomManager.js            # Core Engine (Rooms, Scores, Teams, Rehydration, Roster)
│   │   ├── socketHandler.js          # จัดการ WebSocket Events ทั้งหมด (พร้อม Security Ownership)
│   │   ├── quizData.js               # จัดการคลังชุดคำถามตัวอย่าง และฟังก์ชัน Duplicate
│   │   └── aiService.js              # บริการสร้างข้อสอบด้วย Google Gemini AI
│   ├── tests/                        # Automated Test Suite (9 Test Suites 100% Pass)
│   │   ├── run-tests.js              # Master Test Runner
│   │   ├── roomManager.test.js       # ทดสอบ Engine, Sequence, Teams, และ Reset Lifecycle
│   │   ├── socketHandler.test.js     # ทดสอบ Real-time Socket Flows, Security & Reconnection
│   │   ├── quizData.test.js          # ทดสอบ CRUD ชุดคำถาม
│   │   ├── api.test.js               # ทดสอบ REST Endpoints & Frontend Serving
│   │   ├── analyticsReport.test.js   # ทดสอบ Analytics และ Excel/CSV Multi-sheet
│   │   ├── pretestPosttest.test.js   # ทดสอบ Pre-test vs Post-test Learning Gain
│   │   ├── db.test.js                # ทดสอบ SQLite Persistence CRUD & Schemas
│   │   ├── rosterPersistence.test.js # ทดสอบ End-to-End Server Restart & 1-Click Roster Claim
│   │   └── auth.test.js              # ทดสอบ JWT Authentication, User Roles & API Security
│   ├── Dockerfile                    # Node.js Alpine Container
│   └── package.json
│
├── design-system.html                # Google Stitch UX/UI Design System & Prototype (No CDN)
├── docker-compose.yml                # Docker Compose Orchestration (Production-Ready)
└── nginx.conf                        # Root Nginx Proxy Configuration
```

---

## ⚡ เทคโนโลยีที่เลือกใช้ (Tech Stack)

### ฝั่ง Frontend (Client)
- **Framework**: React 18
- **Build Tool**: Vite 7
- **Icons**: Lucide React
- **Audio**: Web Audio API Synthesizer (สร้างเสียงสด ไม่ต้องพึ่งพาไฟล์เสียงขนาดใหญ่)
- **QR Code**: Native Inline SVG QR Code Generator
- **Styling**: Pure CSS3 Variables & Responsive Flex/Grid (Earth Tone Palette & Google Stitch Standard)

### ฝั่ง Backend (Server)
- **Runtime**: Node.js (v22+ LTS แนะนำ Node 22.5+ สำหรับ Built-in `node:sqlite`)
- **Database / Persistence**: Built-in SQLite (`node:sqlite` DatabaseSync with WAL Mode)
- **HTTP Server**: Express.js
- **Real-time Gateway**: Socket.io 4
- **Testing Framework**: Node.js Native Assertion (`node:assert/strict`)
- **Container**: Docker & Docker Compose with Alpine Linux (Node 22 Alpine)

---

## 🚀 คู่มือการติดตั้งและเริ่มต้นใช้งาน (Getting Started)

### ความต้องการของระบบ (Prerequisites)
- [Node.js](https://nodejs.org/) เวอร์ชัน 22.5.0 ขึ้นไป (เนื่องจากใช้ `node:sqlite` ในตัว)
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

ระบบมี All-in-One Multi-Stage Dockerfile (Node 22 Alpine) รองรับ Production รวมทั้ง Client (React Static Build) และ Server (Socket.io + SQLite):

```bash
# 1. (ทางเลือก) สร้างไฟล์ .env หากต้องการระบุ GEMINI_API_KEY หรือ HOST_PORT
cp server/.env.example server/.env

# 2. สั่ง Build และรันทั้งระบบผ่าน Docker Compose
docker compose up --build -d
```

- **เข้าใช้งานเว็บแอปพลิเคชัน**: เข้าผ่าน `http://<IP-เครื่องเซิร์ฟเวอร์>` หรือ `http://localhost` (Port 80 หรือตามที่ระบุใน `HOST_PORT`)
- **Persistent Data**:
  - ฐานข้อมูลห้องและผลสอบ SQLite จะถูก Map ลงโฟลเดอร์ `./server/data/kaojai.sqlite`
  - ไฟล์ภาพที่อัปโหลดจะถูกเก็บใน Docker Volume `server_uploads`
- **ตรวจสอบสถานะคอนเทนเนอร์**:
```bash
docker compose ps
docker compose logs -f kaojai
```

---

## 🎯 ฟีเจอร์หลักของระบบ (Key Features)

### 1. 🎮 Gamified Quiz Mode (เกมตอบคำถามชิงรางวัล)
- **สุ่ม Game PIN 6 หลัก** โดยไม่ซ้ำกับห้องที่กำลังเปิดใช้งาน
- **Get Ready 5s Countdown**: ป๊อปอัปนับถอยหลัง 5 วินาทีกลางจอพร้อมเสียง Beep ให้เตรียมตัวก่อนเริ่มคำถาม
- **Speed Scoring Logic**: คำนวณคะแนนตามความเร็วในการตอบ (คะแนนเต็ม 1,000 คะแนน ยิ่งตอบไวยิ่งได้คะแนนสูง)
- **3-Tier Athletic Sports Podium (แท่นรับรางวัลนักกีฬา 3 อันดับ)**: เมื่อจบเกม แสดงแท่นรับรางวัลสไตล์โอลิมปิก 3D (อันดับ 1 ตรงกลางสูงเด่นพร้อมมงกุฎลอยได้ 👑, อันดับ 2 ซ้าย, อันดับ 3 ขวา) แสดงรูป Avatar ขนาดใหญ่, ชื่อผู้เล่น, คะแนนสะสม, พร้อมสวิตช์สลับดูแทร็กคะแนนรวม Racing Bar ได้ตามต้องการ
- **Runners-up Showcase**: แสดงรายชื่อผู้เข้าแข่งขันอันดับที่ 4 เป็นต้นไปในกล่องเกียรติยศ เพื่อให้ผู้เรียนทุกคนได้รับการเชิดชูคะแนน

### 2. 🏎️ Sequence Race Mode (เกมแข่งจัดเรียงลำดับขั้นตอน)
- **โหมดจัดเรียงลำดับ**: ให้ผู้เรียนจัดเรียงลำดับขั้นตอน (เช่น ลำดับกระบวนการทำงาน หรือขั้นตอนอัลกอริทึม)
- **First-Look Sequence Intro (ระบบแนะนำกติกาก่อนเจอข้อแรก ไม่จำกัดเวลา)**: เมื่อเจอกลุ่มคำถาม Sequence เป็นข้อแรกของเซสชัน ระบบจะพักเข้าสู่หน้า Intro พิเศษ (ไม่จับเวลา 5 วิ) เพื่อให้วิทยากรมีเวลาพูดอธิบายกติกาในห้อง พร้อมแสดง **CSS Animation นิ้วมือลากการ์ดสลับตำแหน่ง (Card Drag Gesture Demo)** และขั้นตอนสั้นๆ 2 สเต็ป (`1. 👆 ลากสลับลำดับ` ➔ `2. 🚀 กดยืนยันคำตอบ`) เมื่อทุกคนเข้าใจแล้ว วิทยากรกดปุ่ม *"ผู้เรียนพร้อมแล้ว เริ่มทำข้อสอบเลย!"* เพื่อเริ่มเกมพร้อมกันอย่างยุติธรรม ส่วนข้อ Sequence ถัดๆ ไป ระบบจะข้ามหน้านี้อัตโนมัติ
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

### 7. 🎁 Lucky Draw (ระบบสุ่มผู้โชคดี & สอยดาวตักลูกบอลในอ่างน้ำ)
- **แยกเป็นหน้าจอเต็ม (Dedicated Full-Screen Page - `LuckyDrawPage.jsx`)**: ขยายพื้นที่ใช้งานกว้างขวาง หมดปัญหาป๊อปอัป Modal ล้นจอ (Overflow) บนจอโปรเจกเตอร์หรือแล็ปท็อป พร้อมปุ่มย้อนกลับคงสถานะเดิมครบถ้วน 100%
- **ระบบสุ่มปริศนา 100% (Mystery Lucky Draw Experience)**:
  - นำรายชื่อออกจากภายนอกลูกบอลและช่องวงล้อโดยสมบูรณ์ เพื่อความสมจริงเหมือนงานวัด/งานสอยดาว และแก้ปัญหาตัวหนังสือเบียดทับกันเมื่อมีผู้เข้าร่วมจำนวนมาก (รองรับตั้งแต่ 1 ถึง 1,000+ คนอย่างสวยงามคมชัด 60fps)
  - ทุกคนลุ้นผลระทึกพร้อมกันในวินาทีที่สอยลูกบอลขึ้นมาหรือวงล้อหยุดหมุน ก่อนเปิดเผยการ์ดผู้โชคดีพร้อม Confetti
- **สลับสไตล์การเล่นได้ 2 รูปแบบ แยก Engine ขาดจากกัน (Dual Visual Models)**:
  - 🌊 **อ่างน้ำทรงกระบอก 2.5D & ลูกบอลปริศนา (`drawStyle: 'POOL'`)**:
    - **ดีไซน์อ่างน้ำทรงกระบอก 2.5D Perspective**: บ่อน้ำวงรีสมจริงพร้อมเงาตกกระทบพื้น, ห่วงคาดถังน้ำเมทัลลิก, ขอบปากอ่าง 3D, ผิวน้ำใสและคลื่น Concentric Ripples
    - **ลูกบอลสอยดาวปริศนา (Mystery Lucky Balls)**: ลูกบอลแคปซูล 3 มิติสีสันสดใส 28 ลูกลอยตุ๊บป่อง ประดับไอคอนสัญลักษณ์นำโชค (⭐️, 🎁, 💎, 🍀, ✨, 👑, 🎯, 🌟, 🔮, 🎉, ⚡️, ❤️) ลื่นไหล 60fps
    - **ก้านไม้สอย Pickup Rod**: ไม้สอยด้ามยาวสีดำเมทัลลิกคาดปลอกทองเหลือง ปลายไม้ติดหัวจับ **Pickup Rod Head** (กล่องจับทรงสี่เหลี่ยมพร้อม Crosshair และไฟสถานะ LED ตรงตามรูปสเก็ตช์)
    - **Realistic Scooping & Splash**: เมื่อคลิกสอย หัว Pickup Rod จะล็อคเข้ากับลูกบอล ยกตัวช้อนลอยขึ้นพ้นผิวน้ำ เกิดคลื่นน้ำกระเพื่อม ละอองน้ำพุ่งกระจาย (Radial Water Splash) หยดน้ำหยดกลับลงอ่าง และลูกบอลเปล่งแสงสีทองพร้อมประกายระยิบระยับ (Wet Glisten Sparkles) ก่อนเปิดเผยชื่อผู้ชนะ
    - **Auto State Release**: เมื่อปิดหน้าต่างประกาศผู้โชคดี (Dismiss Modal) ด้ามไม้ Pickup Rod จะปลดล็อกคืนสู่ผิวน้ำ และรีเฟรชลูกบอลที่เหลืออยู่ในอ่างทันที พร้อมสำหรับการตักรอบถัดไป
  - 🎡 **วงล้อปริศนาคาร์นิวัล (`drawStyle: 'WHEEL'`)**: วงล้อ 16 ช่องสีสันสดใส ลวดลายไอคอนนำโชคและหมุดไฟนีออนสีทอง พร้อมฟิสิกส์ชะลอความเร็ว (Deceleration), เข็มกระตุกพร้อมเสียงตึ๊กๆ, พลุ Confetti และเสียง Fanfare
- **Host vs Player Visual Isolation (แยกโมเดลหน้าจอโฮสต์และผู้เล่นอย่างเด็ดขาด)**:
  - **Host Arena**: จอผู้สอนไม่แสดง Overlay ชนหรือทับซ้อนหน้าจอตัวเอง
  - **Player View**: เมื่อโฮสต์สุ่มด้วย `POOL` หน้าจอมือถือผู้เรียนแสดงการ์ดลุ้นตักลูกบอลในน้ำ 🌊 ส่วนเมื่อสุ่มด้วย `WHEEL` แสดงวงล้อหมุน 🎡 ไม่มีการรันชนกันทั้งสองโมเดล
- **รองรับ 3 แหล่งที่มาของรายชื่อ**:
  - 👥 **ดึงจากห้องเรียน (Room Players)**: เชื่อมโยงรายชื่อและ Avatar ผู้เรียนที่กด Join เข้ามาในห้องอัตโนมัติ
  - 📱 **สแกน QR Code สดในงาน (Live QR Registration)**: ฉาย QR Code ขึ้นจอใหญ่ ให้คนในงานสัมมนาหรือปาร์ตี้ใช้มือถือสแกนส่งชื่อเข้ามาลุ้นรางวัล (`/?pin=XXXXXX&luckydraw=1`) พร้อมระบบป้องกันการปั๊มสิทธิ์ (1 เครื่อง = 1 สิทธิ์)
  - ✍️ **กรอกเอง / CSV Import (Manual & Standalone)**: พิมพ์/Paste รายชื่ออิสระ, ปุ่มนำเข้าไฟล์ `.csv` (UTF-8 ภาษาไทย), และปุ่ม **ดาวน์โหลด Template CSV** เพื่อเปิดกรอกใน Excel/Google Sheets
- **ระบบล็อกการลงทะเบียน (Attendance Lock)**:
  - ปุ่มเปิด/ปิดรับรายชื่อแบบเรียลไทม์ (`host_toggle_luckydraw_lock`) ป้องกันคนส่งชื่อแทรก
  - ตัวเลือกปิดรับรายชื่ออัตโนมัติทันทีเมื่อเริ่มหมุนหรือตักรางวัล (Auto-lock on Draw)
- **ตัวเลือกการคัดกรอง (Toggleable Exclusions)**:
  - 🚫 **ตัดผู้ได้รับรางวัลไปแล้ว**: ป้องกันคนเดิมได้รางวัลซ้ำ (เปิด-ปิดได้อิสระ)
  - 🥉 **ตัด 3 อันดับแรก (Top 3) จาก Quiz**: สำหรับสุ่มแจก **"รางวัลปลอบใจ"** ให้ผู้ที่ไม่ได้ขึ้นแท่น Podium
- **ประวัติผู้โชคดี (Winner History)**: แสดงรายการผู้ชนะและชื่อรางวัล พร้อมปุ่มคัดลอกลง Clipboard และปุ่มคืนสิทธิ์เข้าวงล้อ (Undo)
- **Strict Mode Isolation (การแยกห้องเฉพาะกิจ)**:
  - ห้อง Lucky Draw ถูกกำหนดเป็น `mode: 'LUCKY_DRAW'` และจะไม่ปรากฏในรายการ Active Sessions สำหรับ Resume โหมดข้อสอบที่หน้าแรก

---

## 🔐 ระบบยืนยันตัวตนและการจัดการสิทธิ์ (Authentication & Roles)

ระบบใช้สถาปัตยกรรมยืนยันตัวตนแบบ **Model 2 ระบบ (ADMIN & TEACHER)** ด้วย **JSON Web Token (JWT)** และฐานข้อมูล SQLite:

### 1. บทบาทของผู้ใช้งาน (User Roles)
| บทบาท (Role) | สิทธิ์การเข้าถึง | การจัดการผู้ใช้ | การจัดการข้อสอบ |
| :--- | :--- | :---: | :---: |
| **`ADMIN`** (ผู้ดูแลระบบ) | เข้าถึงทุกเมนู, สร้างห้อง, สุ่ม Lucky Draw | สร้าง / ลบ / เปลี่ยน Role ผู้ใช้อื่น | จัดการคลังข้อสอบทั้งหมด, Import แบบ `replaceAll: true` |
| **`TEACHER`** (อาจารย์ผู้สอน) | สร้างห้อง, คลังคำถาม, สุ่ม Lucky Draw | เปลี่ยนรหัสผ่านของตนเอง | สร้าง / แก้ไข / โคลน / Import แบบ Append |
| **`PARTICIPANT`** (ผู้เรียน) | ไม่ต้องล็อกอิน เข้าร่วมผ่าน Room PIN หรือ QR Code | - | ร่วมกิจกรรม Quiz / Pulse / Lucky Draw |

### 2. มาตรการรหัสผ่านและความปลอดภัย
- **Password Hashing**: เข้ารหัสด้วย Node.js Built-in `crypto.scryptSync` พร้อม Random Salt 16 ไบต์ ปลอดภัยสูงโดยไม่ต้องพึ่งพา Native Binary ภายนอก
- **Password Length Enforcement**: บังคับความยาวรหัสผ่านขั้นต่ำอย่างน้อย 6 ตัวอักษร
- **Auto-seeded Accounts** (สำหรับการเริ่มต้นใช้งานครั้งแรก):
  - บัญชี Admin: `admin` / `admin1234`
  - บัญชี Teacher: `teacher` / `teacher1234`
  *(ระบบแนะนำให้เปลี่ยนรหัสผ่านทันทีเมื่อนำขึ้น Production)*
- **REST Endpoints (`/api/auth`)**:
  - `POST /api/auth/login`: เข้าสู่ระบบ (มี Rate Limiter ป้องกัน Brute-force)
  - `GET /api/auth/me`: ตรวจสอบสถานะ Token และโปรไฟล์ปัจจุบัน
  - `POST /api/auth/change-password`: เปลี่ยนรหัสผ่านของผู้ใช้ที่ล็อกอินอยู่
  - `GET /api/auth/users`: รายชื่อผู้ใช้ทั้งหมด (เฉพาะ ADMIN)
  - `POST /api/auth/users`: สร้างผู้ใช้ใหม่ (เฉพาะ ADMIN)
  - `DELETE /api/auth/users/:id`: ลบผู้ใช้ (เฉพาะ ADMIN, ห้ามลบบัญชีตัวเอง)
  - `PATCH /api/auth/users/:id/role`: เปลี่ยนบทบาท ADMIN ↔ TEACHER (เฉพาะ ADMIN)

---

## 🛡️ ความมั่นคงปลอดภัยระดับ Production (Security Hardening)

ระบบได้รับการ Audit และทำ Security Hardening ครบถ้วนทุกเลเยอร์ก่อนการ Deploy:

1. **Content Security Policy (CSP)**:
   - ป้องกัน XSS และ Data Injection ผ่าน `<meta http-equiv="Content-Security-Policy">`
   - อนุญาตเฉพาะ WebSocket (`ws:`, `wss:`), Vite Assets, Google Fonts, Web Audio และ Canvas/SVG Data URLs
2. **API Rate Limiting (In-Memory Zero-Dependency)**:
   - `POST /api/auth/login`: จำกัด 15 ครั้ง/นาที ต่อ IP
   - `POST /api/quizzes/generate-ai`: จำกัด 10 ครั้ง/นาที ต่อ IP
   - `POST /api/upload`: จำกัด 30 ครั้ง/นาที ต่อ IP
   - มีระบบเคลียร์ IP ที่หมดเวลาทุก 2 นาที ป้องกัน Memory Leak
3. **Public Quiz Data Sanitization (`GET /api/quizzes`)**:
   - เมื่อเข้าดูคลังข้อสอบโดยไม่มีสิทธิ์ครู/แอดมิน ฟิลด์เฉลย `options.isCorrect` จะถูกคัดกรองออก 100% ป้องกันผู้เรียนแอบ Inspect คำตอบ
4. **File Upload Magic Bytes Validation (`POST /api/upload`)**:
   - ตรวจสอบ Binary Header จริงของไฟล์ภาพ (PNG `0x89504E47`, JPG `0xFFD8FF`, GIF `GIF`, WEBP `RIFF...WEBP`) ป้องกันการปลอมแปลงนามสกุลไฟล์
5. **Real-time Socket Ownership & Impersonation Defense**:
   - `submit_answer`, `submit_pulse`, `leave_room` ตรวจสอบ `socket.id === player.socketId` เพื่อป้องกันการส่งคำตอบหรือเตะผู้อื่นออกจากห้อง
   - ทุกคำสั่งควบคุมห้อง (`toggle_teams`, `create_team`, `get_quiz_analytics` ฯลฯ) ตรวจสอบ `verifyHost(pin, hostToken)` อย่างเคร่งครัด
   - การ Reconnect ของ Host ตรวจสอบ `hostToken` ตรงกับ Snapshot ในห้อง ป้องกันการแอบยึดห้อง
6. **Denial of Service (DoS) Protections**:
   - จำกัดจำนวนผู้เรียนสูงสุด 500 คนต่อห้อง
   - จำกัดความถี่การส่งอีโมจิ (`send_pulse_reaction`) ไม่เกิน 4 ครั้ง/วินาทีต่อคน

---

## 📡 สารบบ Socket Events (Socket.io API Reference)

### ฝั่ง Client ส่งหา Server (`socket.emit`)
| Event Name | Payloads | คำอธิบาย |
| :--- | :--- | :--- |
| `create_room` | `{ customQuizId?, mode?, isLuckyDraw? }` | วิทยากรสร้างห้องใหม่ (ระบุ `mode: 'LUCKY_DRAW'` เมื่อเริ่มสุ่มรางวัล) |
| `join_room` | `{ pin, name, avatar, playerId? }` | ผู้เรียนขอเข้าร่วมห้อง |
| `start_quiz` | `{ pin, hostToken, quizId?, quizMode? }` | วิทยากรเริ่มนับถอยหลัง 5 วินาทีก่อนเข้าข้อแรก |
| `next_question` | `{ pin, hostToken }` | วิทยากรเริ่มนับถอยหลัง 5 วินาทีไปยังคำถามถัดไป |
| `submit_answer` | `{ pin, playerId, optionId? \| orderedItemIds? }` | ผู้เรียนส่งคำตอบ (รองรับทั้งช้อยส์ปกติ และลำดับขั้นตอน Sequence) |
| `switch_mode` | `{ pin, hostToken, mode: 'QUIZ' \| 'PULSE' }` | วิทยากรสลับโหมดระหว่าง Quiz และ Pulse |
| `submit_pulse` | `{ pin, playerId, choice: 'green' \| 'yellow' \| 'red' }` | ผู้เรียนส่งระดับความเข้าใจ |
| `send_pulse_nudge` | `{ pin, hostToken }` | วิทยากรกดส่งสัญญาณเตือนคนที่ยังไม่ส่งผลประเมิน |
| `send_pulse_reaction` | `{ pin, emoji, playerId }` | ผู้เรียนส่งปฏิกิริยา Reaction ลอยขึ้นหน้าจอ |
| `show_leaderboard` | `{ pin, hostToken }` | วิทยากรเรียกดูอันดับคะแนน |
| `reconnect_host` | `{ pin, hostToken }` | วิทยากรเชื่อมต่อกลับเข้าห้องเดิมหลังรีเฟรช |
| `toggle_teams` | `{ pin, hostToken, enabled }` | วิทยากรเปิด/ปิดโหมดทีมในห้องกิจกรรม |
| `create_team` | `{ pin, hostToken, name, color }` | วิทยากรสร้างทีมใหม่ |
| `remove_team` | `{ pin, hostToken, teamId }` | วิทยากรลบทีม |
| `assign_team` | `{ pin, playerId, teamId }` | กำหนดผู้เล่นเข้าทีม (ใช้ได้ทั้งผู้สอนและผู้เรียนเลือกเอง) |
| `auto_assign_teams` | `{ pin, hostToken, teamCount? }` | วิทยากรสั่งสุ่มจัดทีมผู้เรียนอัตโนมัติ |
| `get_teams` | `{ pin }` | ดึงรายชื่อทีมและสมาชิกปัจจุบัน |
| `get_roster` | `{ pin }` | ผู้เรียนดึงรายชื่อเพื่อนที่เคยทำ Pre-test ในห้องเพื่อเลือกชื่อตัวเอง (1-Click Claim) |
| `get_active_sessions` | `(ackCallback)` | วิทยากรดึงประวัติห้องที่เปิดค้างไว้จาก SQLite (ไม่รวม Lucky Draw) |
| `host_spin_lucky_draw` | `{ pin, hostToken, prizeName, winner, candidateNames, durationMs, drawStyle }` | วิทยากรสั่งสุ่มรางวัล (ระบุ `drawStyle: 'POOL' \| 'WHEEL'`) |
| `host_close_lucky_draw` | `{ pin, hostToken }` | วิทยากรปิดหน้าต่าง Lucky Draw |
| `host_toggle_luckydraw_lock` | `{ pin, hostToken, isLocked }` | วิทยากรเปิด/ปิดรับรายชื่อผู้ลงทะเบียน Lucky Draw |
| `get_luckydraw_status` | `{ pin }` | ดึงสถานะล็อกการลงทะเบียนของห้อง Lucky Draw |
| `close_room` | `{ pin, hostToken }` | ปิดห้องและล้างข้อมูลห้องทิ้งทันที |

### ฝั่ง Server ส่งหา Client (`io.to(pin).emit` หรือ `socket.emit`)
| Event Name | Payloads | คำอธิบาย |
| :--- | :--- | :--- |
| `room_created` | `{ pin, mode, status, quizSet, players, counts, hostToken }` | ส่งกลับหาวิทยากรเมื่อสร้างห้องเสร็จ |
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
| `lucky_draw_spin` | `{ prizeName, winner, candidateNames, durationMs, drawStyle }` | ถ่ายทอดสดแอนิเมชันสุ่มรางวัลไปยังมือถือของผู้เรียนทุกคน |
| `lucky_draw_closed` | `{ closedAt }` | แจ้งปิดหน้าจอ Lucky Draw ฝั่งผู้เรียน |
| `luckydraw_lock_updated` | `{ isLocked }` | แจ้งสถานะเปิด/ปิดรับรายชื่อผู้เข้าร่วม Lucky Draw แบบเรียลไทม์ |

---

## 🛠️ คู่มือสำหรับนักพัฒนาในการเพิ่มหรือปรับแต่งโหมด (Developer Guidelines)

เพื่อให้ผู้พัฒนาที่เข้ามาดูแลระบบต่อสามารถเพิ่มโหมดกิจกรรมใหม่ (เช่น Mini-Game, Word Cloud, Q&A Board) หรือปรับปรุงโหมดเดิม (Quiz, Pulse, Lucky Draw) ได้อย่างราบรื่น ไม่เกิดข้อผิดพลาด ให้ปฏิบัติตามกฎสถาปัตยกรรม 3 ข้อหลัก:

### 1. กฎการแยกโหมดฝั่ง Backend (`server/src/roomManager.js` & `socketHandler.js`):
- **กำหนด `room.mode` ให้ชัดเจน**: เมื่อสร้างห้องด้วย `createRoom(hostSocketId, customQuizSetOrId)` ให้กำหนด `mode` เป็นค่าเฉพาะของโหมดนั้น (เช่น `'QUIZ'`, `'PULSE'`, `'LUCKY_DRAW'`)
- **Dummy Quiz Prevention**: หากโหมดใหม่ไม่มีข้อสอบ Choice/Sequence ให้ระบุ Dummy Quiz Object เสมอ (`{ id: 'mode_name', questions: [] }`) เพื่อป้องกันไม่ให้ระบบ In-Memory ดึงข้อสอบชุดแรกจาก `quizzes.json` มาผูกทับ
- **Active Sessions Resume Filtering**: ใน `getAllActiveSessions()` ให้ตรวจสอบว่าหากห้องไม่ใช่โหมดการเรียนการสอน (เช่น `r.mode === 'LUCKY_DRAW'`) ต้องทำการ `continue;` ข้ามไป เพื่อไม่ให้ห้องไปแสดงปะปนในรายการ "ห้องที่เปิดค้างไว้ / รอทำ Post-test" บนหน้าแรกของวิทยากร

### 2. กฎการควบคุมมุมมองและ Overlay ฝั่ง Frontend (`client/src/App.jsx`):
- **Exclusive View Routing**: กำหนดค่า `viewMode` ให้ชัดเจน และใน `onRoomCreated` หรือ `onHostReconnected` ให้ตรวจสอบ `data.mode` ก่อนเปลี่ยนหน้าเสมอ ป้องกันการเด้งผิดหน้าจอ
- **Strict Player Overlay Guard**: ป๊อปอัปหรือโมดอลของผู้เข้าร่วม (เช่น `PlayerLuckyDrawOverlay`) **จะต้องครอบด้วยเงื่อนไขตรวจสอบผู้เรียนเสมอ**:
  ```jsx
  {viewMode === 'PLAYER_GAME' && !session?.isHost && (
    <PlayerLuckyDrawOverlay ... />
  )}
  ```
  เพื่อป้องกันไม่ให้หน้าต่างของผู้เรียนเด้งขึ้นมาซ้อนทับบนหน้าจอของโฮสต์
- **Clean Room Teardown**: เมื่อผู้ใช้ออกจากโหมดเฉพาะกิจ ให้ส่ง `socket.emit('close_room')` เพื่อล้างข้อมูลห้องทั้งใน Memory และ SQLite ไม่ให้มีห้องขยะค้างในระบบ

### 3. กฎความปลอดภัยด้าน Terminal (Terminal Execution Security):
- **ห้ามรันคำสั่งผ่าน PowerShell โดยตรงเด็ดขาด**: เครื่องผู้ใช้มีการติดตั้ง EDR / Antivirus ที่จะแจ้งเตือนความปลอดภัยทันทีหากใช้ PowerShell ดิบ
- **ต้องรันผ่าน `cmd.exe /c "..."` เสมอ**: ทุกคำสั่งทดสอบหรือบิลด์ เช่น `cmd.exe /c "npm test"` หรือ `cmd.exe /c "npm run build"`

---

## 🧪 การทดสอบระบบ (Automated Testing)

โปรเจกต์มีชุดทดสอบอัตโนมัติครบถ้วนทั้ง Unit Tests, Integration Tests, Database Persistence, API Tests, และ Security Tests รวมทั้งหมด **9 Test Suites (100% Pass)**:

```bash
# รันชุดทดสอบ Backend Server ทั้งหมด
cd server
npm test
```

ผลการทดสอบครอบคลุม:
1. `quizData.test.js`: การดึง/บันทึก/ลบ/คัดลอกชุดคำถาม (ทั้ง Choice และ Sequence)
2. `roomManager.test.js`: การสร้างห้อง, คำนวณคะแนนความเร็ว, Disconnect Grace Period, การสลับโหมด, การประเมิน Sequence Race, และ Team Management Lifecycle
3. `socketHandler.test.js`: จำลอง Socket Connection, การนับถอยหลัง 5 วินาที, การส่ง Nudge, การรับส่งคำตอบแบบ Sequence, Lucky Draw Events, การจัดการทีม, และ Socket Ownership/Impersonation Defenses
4. `api.test.js`: ทดสอบ REST Endpoints `/api/health`, `/api/quizzes`, `/api/upload`, และ Frontend Static Serving
5. `analyticsReport.test.js`: ทดสอบ Analytics และ Excel/CSV Multi-sheet Reports
6. `pretestPosttest.test.js`: ทดสอบ Pre-test vs Post-test Learning Gain และ Roster Matching
7. `db.test.js`: ทดสอบ SQLite Persistence CRUD, Room Snapshots, และ Schemas
8. `rosterPersistence.test.js`: ทดสอบ End-to-End Server Restart & 1-Click Roster Claim
9. `auth.test.js`: ทดสอบระบบ JWT Authentication, Role Authorization (ADMIN vs TEACHER), Password Policy และ Security Hardening

```bash
# ทดสอบการ Compile และ Bundle ฝั่ง Frontend Client
cd client
npm run build
```

---

## 🔮 แนวทางการพัฒนาต่อยอด (Future Roadmap)

1. **ระบบสลับตัวเลือกคำถาม (Shuffle Questions & Options)**:
   - ตัวเลือกสุ่มลำดับคำถามและสลับตำแหน่งตัวเลือกบนหน้าจอมือถือผู้เรียน เพื่อป้องกันการมองจอกันในห้องอบรม
2. **Team Leaderboard Podium View**:
   - แสดงหน้าจอสรุปอันดับคะแนนรวมสะสมรายทีมบน Podium สำหรับการแข่งขันแบบกลุ่ม
3. **Cloud Storage & Sync (Supabase / S3 Integration)**:
   - ตัวเลือกเชื่อมต่อ External Storage (S3 / Supabase Bucket) สำหรับองค์กรที่ต้องการจัดเก็บภาพสื่อการสอนบน Cloud
4. **Live Audio Host Announcements (ระบบประกาศเสียงสด)**:
   - สตรีมเสียงวิทยากรความหน่วงต่ำผ่าน WebRTC / Audio Stream ตรงสู่มือถือผู้เรียน

---

## 📄 ใบอนุญาต (License)
MIT License - สามารถนำไปปรับใช้ พัฒนาต่อยอด และประยุกต์ใช้งานในองค์กรหรือสถาบันการศึกษาได้อย่างอิสระครับ!
