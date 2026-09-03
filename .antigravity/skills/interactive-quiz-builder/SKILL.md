---
name: interactive-quiz-builder
description: Comprehensive architecture, error-handling patterns, and code review standards for developing real-time interactive quiz and pulse-check web applications using React Vite and Node.js Socket.io.
triggers:
  - "create quiz"
  - "add pulse"
  - "socket event"
  - "build training poll"
  - "review quiz code"
---

# Interactive Quiz & Pulse Architecture Skill

## 1. Technical Stack & Boundaries
- **Frontend:** React + Vite (Single Page Application, Client-side only). Strictly **NO Next.js** and **NO Server-Side Rendering (SSR)**.
- **Backend:** Node.js + Express + `socket.io`.
- **Real-Time Communication:** Persistent WebSockets via Socket.io. Do not use HTTP polling.
- **Avatar Engine:** Use `@dicebear/core` installed via local NPM packages. Offline and bundled generation only; strictly **NO external CDN/API network requests**.
- **Project Structure:**
  - Host (projector/dashboard) components: `src/components/host/`
  - Participant (mobile UI) components: `src/components/player/`

---

## 2. Mandatory Error Handling & Resilience Patterns

### A. Socket Lifecycle & Reconnection
- **Client Side:** Enable automatic reconnections. Cache the `roomPin`, `playerId`, and session token in `sessionStorage` so refreshing the browser or momentary signal drops do not eject the participant.
- **Server Side:** When a socket disconnects unexpectedly, implement a grace period (e.g., 45–60 seconds) before removing the player record from memory.

### B. Defensive Socket Handlers (Backend)
Wrap every socket event listener in a `try/catch` block, enforce input validation, and ensure idempotency (prevent double submissions):

```javascript
// ✅ REQUIRED BACKEND SOCKET HANDLER PATTERN
socket.on("submit_pulse", ({ pin, choice }) => {
  try {
    if (!rooms[pin]) {
      return socket.emit("error_message", { 
        code: "ROOM_NOT_FOUND", 
        message: "Session does not exist or has expired." 
      });
    }

    const validChoices = ["green", "yellow", "red"];
    if (!validChoices.includes(choice)) {
      return socket.emit("error_message", { 
        code: "INVALID_CHOICE", 
        message: "Invalid response option." 
      });
    }

    // Idempotency: prevent vote spamming
    if (rooms[pin].votedUsers.has(socket.id)) {
      return socket.emit("error_message", { 
        code: "ALREADY_VOTED", 
        message: "You have already submitted a response." 
      });
    }

    rooms[pin].votedUsers.add(socket.id);
    rooms[pin].pulseVotes[choice] = (rooms[pin].pulseVotes[choice] || 0) + 1;

    // Broadcast aggregated data to the room
    io.to(pin).emit("pulse_results", rooms[pin].pulseVotes);
  } catch (err) {
    console.error(`[Socket Error] submit_pulse:`, err);
    socket.emit("error_message", { 
      code: "INTERNAL_ERROR", 
      message: "An internal error occurred. Please try again." 
    });
  }
});

C. Client-Side Error Boundaries
Wrap root routes and dynamic components with React Error Boundaries to prevent full-page crashes (white screens) caused by malformed SVG avatars or unexpected socket payloads.

3. Code Review & Verification Checklist
Before finishing any task or submitting generated code, verify against this checklist:

Listener Cleanup (Memory Leak Prevention):

Does every React useEffect containing socket.on(...) have a corresponding socket.off(...) in its cleanup function?

Server-Side Authority (Anti-Cheating & Concurrency):

For Quiz Mode, is the countdown timer and scoring window enforced on the server, rather than trusting client-side timestamps?

Connection State Indicators:

Does the player mobile UI render a distinct, non-blocking banner when the socket state is connecting, reconnecting, or disconnected?

Input Sanitization & Constraints:

Are player nicknames trimmed and constrained (e.g., max 30 characters) to avoid layout distortion on the host's projector screen?

Local Avatar Assets Verification:

Are avatars referenced strictly by local path/identifier (e.g., /avatars/avatar-1.svg or an avatar catalog array) instead of external URLs or third-party APIs?

Is there a fallback avatar displayed if the specified SVG file fails to load?