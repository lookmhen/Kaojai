# Graph Report - KaoJai  (2026-10-24)

## Corpus Check
- 131 files · ~111,955 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: (none) 8, .conf 2, .css 2)

## Summary
- 399 nodes · 1051 edges · 13 communities (11 shown, 2 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 124 edges (avg confidence: 0.85)
- Token cost: 1,250 input · 850 output

## Community Hubs (Navigation)
- React Client & Application Shell
- Room & Team Lifecycle Manager
- Security & Authentication Middleware
- Database & Auth Storage Engine
- Frontend Dependencies & Packages
- Realtime Socket Quiz Engine
- Audio & Sound Effects System
- Backend Server Runtime & Packages
- React Context & Error Handling
- Containerization & Deployment Config
- Leaderboard Podium & Export Reports
- Gemini AI Quiz Generation Service
- UI Theme & Color Picker

## God Nodes (most connected - your core abstractions)
1. `RoomManager` - 44 edges
2. `react` - 38 edges
3. `testRoomManager()` - 35 edges
4. `lucide-react` - 33 edges
5. `useI18n()` - 33 edges
6. `SoundEffects` - 26 edges
7. `AppContent()` - 22 edges
8. `getDb()` - 21 edges
9. `LanguageToggle()` - 20 edges
10. `testPretestPosttest()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `No PowerShell Direct Execution Rule` --semantically_similar_to--> `Terminal Execution Security Rule`  [EXTRACTED] [semantically similar]
  .agents/rules/no-powershell.md → GEMINI.md
- `Interactive Quiz Builder Agent Skill` --conceptually_related_to--> `Real-time Quiz Engine Architecture`  [INFERRED]
  .antigravity/skills/interactive-quiz-builder/SKILL.md → README.md
- `AppContent()` --calls--> `HostLeaderboard()`  [EXTRACTED]
  client/src/App.jsx → client/src/components/host/HostLeaderboard.jsx
- `HostLeaderboard()` --calls--> `useI18n()`  [EXTRACTED]
  client/src/components/host/HostLeaderboard.jsx → client/src/context/I18nContext.jsx
- `HostLeaderboard()` --calls--> `fireConfetti()`  [EXTRACTED]
  client/src/components/host/HostLeaderboard.jsx → client/src/utils/confetti.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Real-time Interactive Active Learning Gamification** — readme_quiz_engine, spec_training_pulse, spec_lucky_draw_pool, spec_team_battle, readme_learning_gain [INFERRED 0.85]

## Communities (13 total, 2 thin omitted)

### Community 0 - "React Client & Application Shell"
Cohesion: 0.09
Nodes (54): Player SVG Avatar Collection, App(), AppContent(), AdminLoginModal(), LanguageToggle(), LuckyDrawPage(), BALL_PALETTES, LuckyWaterPool() (+46 more)

### Community 1 - "Room & Team Lifecycle Manager"
Cohesion: 0.12
Nodes (10): RoomManager, buildReportCSVString(), testAnalyticsReport(), testDatabaseLayer(), SAMPLE_QUIZ, testPretestPosttest(), testRoomManager(), SAMPLE_FIRE_SAFETY_QUIZ (+2 more)

### Community 2 - "Security & Authentication Middleware"
Cohesion: 0.07
Nodes (33): No PowerShell Direct Execution Rule, Terminal Execution Security Rule, authenticateToken(), optionalAuthenticateToken(), requireRole(), aiGenLimiter, ALLOWED_MIME_TYPES, altClientDistDir (+25 more)

### Community 3 - "Database & Auth Storage Engine"
Cohesion: 0.14
Nodes (33): jsonwebtoken, generateToken(), router, cleanupOldRooms(), closeDb(), createUser(), DATA_DIR, deleteRoom() (+25 more)

### Community 4 - "Frontend Dependencies & Packages"
Cohesion: 0.08
Nodes (33): dependencies, canvas-confetti@^1.9.4, html2pdf.js@^0.14.0, lucide-react@^0.380.0, qrcode@^1.5.4, react@^18.3.1, react-dom@^18.3.1, socket.io-client@^4.7.5 (+25 more)

### Community 5 - "Realtime Socket Quiz Engine"
Cohesion: 0.08
Nodes (22): Interactive Quiz Builder Agent Skill, KaoJai Active Learning Platform, Pre-test & Post-test Learning Gain Metric, Real-time Quiz Engine Architecture, launchQuestion(), maskPretestResult(), triggerQuestionTransition(), afterDelete (+14 more)

### Community 7 - "Backend Server Runtime & Packages"
Cohesion: 0.11
Nodes (20): cors, dotenv, express, socket.io, dependencies, cors@^2.8.5, dotenv@^16.4.5, express@^4.19.2 (+12 more)

### Community 8 - "React Context & Error Handling"
Cohesion: 0.15
Nodes (9): Client HTML Mounting Point, ErrorBoundary, AuthProvider(), I18nProvider(), getStorageItem(), removeStorageItem(), setStorageItem(), SocketContext (+1 more)

### Community 9 - "Containerization & Deployment Config"
Cohesion: 0.12
Nodes (15): context, dockerfile, path, required, build, env_file, environment, init (+7 more)

### Community 10 - "Leaderboard Podium & Export Reports"
Cohesion: 0.26
Nodes (8): HostLeaderboard(), SportsPodium(), TeamPodium(), exportGameReportCSV(), exportGameReportExcel(), exportGameReportPDF(), prepareReportData(), Team Battle & Tug-of-War Score Aggregation

### Community 11 - "Gemini AI Quiz Generation Service"
Cohesion: 0.36
Nodes (8): buildSystemPrompt(), buildUserPrompt(), callGeminiApi(), GEMINI_MODELS, generateAiQuiz(), generateMockQuiz(), normalizeAndValidateQuiz(), QUIZ_RESPONSE_SCHEMA

## Knowledge Gaps
- **9 isolated node(s):** `No PowerShell Direct Execution Rule`, `KaoJai Active Learning Platform`, `Pre-test & Post-test Learning Gain Metric`, `Lucky Draw Pool Interactive Arena`, `Team Battle & Tug-of-War Score Aggregation` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 112 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SoundEffects` connect `Audio & Sound Effects System` to `React Client & Application Shell`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Are the 32 inferred relationships involving `testRoomManager()` (e.g. with `roomManager.test.js` and `.assignPlayerToTeam()`) actually correct?**
  _`testRoomManager()` has 32 INFERRED edges - model-reasoned connections that need verification._
- **What connects `No PowerShell Direct Execution Rule`, `KaoJai Active Learning Platform`, `Pre-test & Post-test Learning Gain Metric` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `React Client & Application Shell` be split into smaller, more focused modules?**
  _Cohesion score 0.09213483146067415 - nodes in this community are weakly interconnected._
- **Why does `react` connect `React Client & Application Shell` to `React Context & Error Handling`, `Leaderboard Podium & Export Reports`, `Frontend Dependencies & Packages`, `UI Theme & Color Picker`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `Room & Team Lifecycle Manager` be split into smaller, more focused modules?**
  _Cohesion score 0.12481857764876633 - nodes in this community are weakly interconnected._
- **Why does `RoomManager` connect `Room & Team Lifecycle Manager` to `Realtime Socket Quiz Engine`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._