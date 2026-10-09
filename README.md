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
- **Persistence & Session Recovery (จัดเก็บข้อมูลถาวร)**: บันทึกสถานะห้อง, ผลสอบ Pre-test, และรายชื่อผู้เรียนลง **SQLite (Node.js Built-in `node:sqlite`)** ป้องกันข้อมูลสูญหายเมื่อเซิร์ฟเวอร์รีสตาร์ตหรือพักการอบรมข้ามมื้อเที่ยง
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
│  └─────────────────────────┘    │   • Roster & Claiming   │  │
│                                 └────────────┬────────────┘  │
│                                              │               │
│  ┌─────────────────────────┐    ┌────────────▼────────────┐  │
│  │  SQLite (node:sqlite)   │◄───┤   RoomManager Engine    │  │
│  │  • rooms (Snapshot)     │    │   (In-Memory + Rehydrate│  │
│  │  • roster_players       │    └─────────────────────────┘  │
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
│   │   │   ├── common/               # คอมโพเนนต์ส่วนกลาง (PrepareCountdown, SequenceIntroGuide, SoundToggle)
│   │   │   │   ├── PrepareCountdown.jsx # ป๊อปอัปนับถอยหลัง 5 วินาทีก่อนเริ่มคำถาม
│   │   │   │   └── SequenceIntroGuide.jsx # หน้าต่างแนะนำกติกาข้อ Sequence ครั้งแรก (Animated Drag Demo)
│   │   │   ├── host/                 # หน้าจอสำหรับผู้สอน/วิทยากร (Host Views)
│   │   │   │   ├── HostHeader.jsx       # แถบหัวแสดง PIN, สลับโหมด, ยอดคนตอบ
│   │   │   │   ├── HostLobby.jsx        # ห้องรอเริ่มเกม, QR Code, จัดทีม, สุ่มทีม, โหมด Pre/Post-test
│   │   │   │   ├── HostQuiz.jsx         # จอแสดงคำถามปกติ & Sequence Race พร้อม Bar Chart
│   │   │   │   ├── HostPulse.jsx        # หน้ารับผลโหวตความเข้าใจ พร้อมปุ่มเรียกตาม (Nudge)
│   │   │   │   ├── HostLeaderboard.jsx  # สรุปคะแนนเรซซิ่ง, Learning Gain, และปุ่ม Export
│   │   │   │   └── SportsPodium.jsx     # แท่นรับรางวัลสไตล์นักกีฬาโอลิมปิก 3 อันดับ (🥇🥈🥉) พร้อม Avatar & มงกุฎลอยได้

│   │   │   ├── player/               # หน้าจอสำหรับผู้เรียนบนมือถือ (Player Views)
│   │   │   │   ├── JoinRoom.jsx         # หน้าแรก: กรอก PIN, 1-Click Roster Claim, และเลือกบทบาท
│   │   │   │   ├── AvatarPicker.jsx     # ตัวเลือกรูปโปรไฟล์ 30 แบบ (พร้อมสุ่มอัตโนมัติ)
│   │   │   │   ├── PlayerLobby.jsx      # หน้ารอวิทยากรเริ่มกิจกรรม พร้อมตัวเลือกทีม
│   │   │   │   ├── PlayerQuiz.jsx       # หน้ากดเลือกคำตอบ 4 สี
│   │   │   │   ├── PlayerSequence.jsx   # หน้าจอจัดลำดับขั้นตอน Sequence Race (Drag & Drop / Touch)
│   │   │   │   ├── PlayerPulse.jsx      # หน้ากดประเมินความเข้าใจ 3 ระดับ พร้อม Popup Nudge
│   │   │   │   ├── PlayerLeaderboardView.jsx # หน้ารอดูคะแนนและอันดับของตนเองระหว่างข้อ
│   │   │   │   └── PlayerEndedView.jsx  # หน้าสรุปผลคะแนนส่วนตัวเมื่อจบกิจกรรม
│   │   │   └── teacher/
│   │   │       └── TeacherBackoffice.jsx # จัดการชุดคำถาม (สร้าง/แก้ไข/โคลน/อัปโหลดรูป)
│   │   ├── context/                  # Socket.io Context & Session Recovery Hooks
│   │   ├── styles/                   # สไตล์หลักและตัวแปรกำหนดชุดสี
│   │   ├── utils/                    # Audio SFX, QR Generator, Export Reports
│   │   ├── App.jsx                   # Main Router & State Orchestrator
│   │   └── main.jsx
│   ├── nginx.conf                    # Nginx Configuration สำหรับ Production Container
│   ├── Dockerfile                    # Multi-stage Build สำหรับ React Client
│   └── vite.config.js                # Vite Config รองรับ allowedHosts & Proxy
│
├── server/                           # Backend (Node.js Express + Socket.io + SQLite)
│   ├── data/
│   │   ├── quizzes.json              # ฐานข้อมูลชุดคำถาม JSON
│   │   └── kaojai.sqlite             # ฐานข้อมูล SQLite เก็บ Rooms และ Roster Players
│   ├── public/
│   │   └── uploads/                  # ที่จัดเก็บรูปประกอบคำถาม (Persistent Volume)
│   ├── src/
│   │   ├── index.js                  # Entrypoint, Express API, และ Static Serving
│   │   ├── db.js                     # SQLite Engine (node:sqlite) รองรับ WAL mode
│   │   ├── roomManager.js            # Core Engine (Rooms, Scores, Teams, Rehydration, Roster)
│   │   ├── socketHandler.js          # จัดการ WebSocket Events ทั้งหมด (รวม get_roster, get_active_sessions)
│   │   └── quizData.js               # จัดการคลังชุดคำถามตัวอย่าง และฟังก์ชัน Duplicate
│   ├── tests/                        # Automated Test Suite (8 Test Suites 100% Pass)
│   │   ├── run-tests.js              # Master Test Runner
│   │   ├── roomManager.test.js       # ทดสอบ Engine, Sequence, Teams, และ Reset Lifecycle
│   │   ├── socketHandler.test.js     # ทดสอบ Real-time Socket Flows & Reconnection
│   │   ├── quizData.test.js          # ทดสอบ CRUD ชุดคำถาม
│   │   ├── api.test.js               # ทดสอบ REST Endpoints
│   │   ├── analyticsReport.test.js   # ทดสอบ Analytics และ Excel/CSV Multi-sheet
│   │   ├── pretestPosttest.test.js   # ทดสอบ Pre-test vs Post-test Learning Gain
│   │   ├── db.test.js                # ทดสอบ SQLite Persistence CRUD & Schemas
│   │   └── rosterPersistence.test.js # ทดสอบ End-to-End Server Restart & 1-Click Roster Claim
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
- **สลับสไตล์การเล่นได้ 2 รูปแบบ (Dual Draw Styles)**:
  - 🌊 **ตักลูกบอลในอ่างน้ำ (Water Pool Scooper)**: สร้างด้วย **Pure HTML5 Canvas 60fps** จำลองผิวน้ำกระเพื่อมสมจริง, ลูกบอล 3D Capsule หลากสีลอยตุ๊บป่อง, เลื่อนเมาส์กวนน้ำวน (Stirring Vortex) มีฟองอากาศผุด, เมาส์กลายเป็นกระชอนช้อนตักลูกบอลขึ้นพ้นผิวน้ำพร้อมหยดน้ำกระเซ็น (Water Splash) และเสียงน้ำสังเคราะห์แบบ Dynamic ผ่าน Web Audio API
  - 🎡 **วงล้อหมุน (Wheel of Fortune)**: วงล้อ Canvas หลากสีสัน พร้อมฟิสิกส์ชะลอความเร็ว (Deceleration), เข็มกระตุกพร้อมเสียงตึ๊กๆ, พลุ Confetti และเสียง Fanfare
- **รองรับ 3 แหล่งที่มาของรายชื่อ**:
  - 👥 **ดึงจากห้องเรียน (Room Players)**: เชื่อมโยงรายชื่อและ Avatar ผู้เรียนที่กด Join เข้ามาในห้องอัตโนมัติ
  - 📱 **สแกน QR Code สดในงาน (Live QR Registration)**: ฉาย QR Code ขึ้นจอใหญ่ ให้คนในงานสัมมนาหรือปาร์ตี้ใช้มือถือสแกนส่งชื่อเข้ามาลุ้นรางวัล พร้อมระบบป้องกันการปั๊มสิทธิ์ (1 เครื่อง = 1 สิทธิ์)
  - ✍️ **กรอกเอง / CSV Import (Manual & Standalone)**: พิมพ์/Paste รายชื่ออิสระ, ปุ่มนำเข้าไฟล์ `.csv` (UTF-8 ภาษาไทย), และปุ่ม **ดาวน์โหลด Template CSV** เพื่อเปิดกรอกใน Excel/Google Sheets
- **ตัวเลือกการคัดกรอง (Toggleable Exclusions)**:
  - 🚫 **ตัดผู้ได้รับรางวัลไปแล้ว**: ป้องกันคนเดิมได้รางวัลซ้ำ (เปิด-ปิดได้อิสระ)
  - 🥉 **ตัด 3 อันดับแรก (Top 3) จาก Quiz**: สำหรับสุ่มแจก **"รางวัลปลอบใจ"** ให้ผู้ที่ไม่ได้ขึ้นแท่น Podium
- **ประวัติผู้โชคดี (Winner History)**: แสดงรายการผู้ชนะและชื่อรางวัล พร้อมปุ่มคัดลอกลง Clipboard และปุ่มคืนสิทธิ์เข้าวงล้อ (Undo)
- **Real-time Mobile Sync**: เมื่อ Host ในห้องสั่งสุ่ม/ตักลูกบอล มือถือของผู้เรียนจะแสดงแอนิเมชันไปพร้อมกัน และขึ้นป๊อปอัปฉลองหากตนเองคือผู้โชคดี

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
| `get_roster` | `{ pin }` | ผู้เรียนดึงรายชื่อเพื่อนที่เคยทำ Pre-test ในห้องเพื่อเลือกชื่อตัวเอง (1-Click Claim) |
| `get_active_sessions` | `(ackCallback)` | วิทยากรดึงประวัติห้องที่เปิดค้างไว้หรือรอทำ Post-test จาก SQLite เพื่อเปิดห้องต่อ |
| `host_spin_lucky_draw` | `{ pin, hostToken, prizeName, winner, candidateNames, durationMs }` | วิทยากรสั่งหมุนวงล้อหรือตักลูกบอลสุ่มผู้โชคดี |
| `host_close_lucky_draw` | `{ pin, hostToken }` | วิทยากรปิดหน้าต่าง Lucky Draw |

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
| `lucky_draw_spin` | `{ prizeName, winner, candidateNames, durationMs }` | ถ่ายทอดสดแอนิเมชันสุ่มรางวัลไปยังมือถือของผู้เรียนทุกคน |
| `lucky_draw_closed` | `{ closedAt }` | แจ้งปิดหน้าจอ Lucky Draw ฝั่งผู้เรียน |

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
