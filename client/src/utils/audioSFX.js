export const BALL_SOUND_PROFILES = {
  PLASTIC: { id: 'PLASTIC', name: 'พลาสติก / ปิงปอง', desc: 'เสียงเคาะลูกพลาสติกกลวง กระชับ คมชัด' },
  MARBLE:  { id: 'MARBLE',  name: 'ลูกแก้วคริสตัล', desc: 'เสียงกิ๊งๆ ใสกังวาน ละมุนหู' },
  WOOD:    { id: 'WOOD',    name: 'ลูกปัดไม้', desc: 'เสียงต๊อกๆ ป๊อกๆ สไตล์ธรรมชาติ Earth Tone' },
  BUBBLE:  { id: 'BUBBLE',  name: 'บับเบิ้ลน้ำ', desc: 'เสียงฟองน้ำแตก ปุ๊ๆ จุ๋มๆ เข้ากับอ่างน้ำ' },
  SOFT:    { id: 'SOFT',    name: 'บอลยางนุ่ม', desc: 'เสียงตึ้บๆ ทุ้มนุ่มนวล สบายหู' }
};

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = typeof window !== 'undefined' ? localStorage.getItem('kaojai_sfx_muted') === 'true' : false;
    this.ballSoundType = typeof window !== 'undefined'
      ? (localStorage.getItem('kaojai_ball_sound') || 'PLASTIC')
      : 'PLASTIC';
    this.listeners = new Set();
    this._hasUserGesture = false;
    this._tensionTimer = null;
    this._bgmTimer = null;
    this._isBgmPlaying = false;
    this._luckyBgmTimer = null;
    this._isLuckyBgmPlaying = false;

    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this._hasUserGesture = true;
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            try { this.ctx = new AudioCtx(); } catch (e) {}
          }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      };

      ['click', 'pointerdown', 'touchstart', 'keydown'].forEach(evt => {
        window.addEventListener(evt, unlockAudio, { capture: true, passive: true });
      });
    }
  }

  unlock() {
    this._hasUserGesture = true;
    if (!this.ctx) {
      const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
      if (AudioCtx) {
        try { this.ctx = new AudioCtx(); } catch (e) {}
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  init() {
    if (this.muted) return;
    const hasGesture = this._hasUserGesture || (typeof navigator !== 'undefined' && navigator.userActivation?.hasBeenActive);
    if (!hasGesture && !this.ctx) {
      return;
    }
    if (!this.ctx) {
      const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch (e) {}
      }
    }
    if (this.ctx && this.ctx.state === 'suspended' && hasGesture) {
      this.ctx.resume().catch(() => {});
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopLobbyBGM();
      this.stopLuckyDrawBGM();
      this.stopTensionLoop();
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('kaojai_sfx_muted', String(this.muted));
    }
    this.listeners.forEach(fn => {
      try { fn(this.muted); } catch (e) {}
    });
    return this.muted;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  playTick() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playTenseTick(secondsLeft) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const pitch = 1000 + (6 - secondsLeft) * 180;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(pitch, now);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  playCountdownBeep(secondsLeft) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freq = secondsLeft === 1 ? 1046.50 : 520 + (5 - secondsLeft) * 80;
      const duration = secondsLeft === 1 ? 0.35 : 0.18;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = secondsLeft === 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  playCuteChime() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.1;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.4);
      });
    } catch (e) {}
  }

  playCorrect() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  playWrong() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.setValueAtTime(150, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  playFanfare() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
      });
    } catch (e) {}
  }

  playPop() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  playBubble() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  playStreak(streakCount) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const baseFreq = 523.25; // C5
      const notes = streakCount >= 3
        ? [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2]
        : [baseFreq, baseFreq * 1.25, baseFreq * 1.5];

      notes.forEach((freq, idx) => {
        const t = now + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = streakCount >= 3 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    } catch (e) {}
  }

  playComeback() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [659.25, 880.00].forEach((freq, idx) => {
        const t = now + idx * 0.1;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.35);
      });
    } catch (e) {}
  }

  playWaterStir(intensity = 0.5) {
    // Silenced to prevent unwanted noise interference when swirling the pickup rod in the pool
  }

  getBallSound() {
    return this.ballSoundType || 'PLASTIC';
  }

  setBallSound(type) {
    if (BALL_SOUND_PROFILES[type]) {
      this.ballSoundType = type;
      if (typeof window !== 'undefined') {
        localStorage.setItem('kaojai_ball_sound', type);
      }
    }
  }

  playBallClack(forcedType = null) {
    if (this.muted) return;
    this.init();
    if (!this.ctx || this.ctx.state !== 'running') return;
    try {
      const now = this.ctx.currentTime;
      if (!forcedType && this._lastClackTime && now - this._lastClackTime < 0.08) return;
      this._lastClackTime = now;

      const type = forcedType || this.ballSoundType || 'PLASTIC';

      if (type === 'MARBLE') {
        // 💎 Glass / Crystal Ping (Inharmonic crystalline shimmer)
        const baseF = 1900 + Math.random() * 220;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(baseF, now);
        osc1.frequency.exponentialRampToValueAtTime(baseF * 0.92, now + 0.08);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(baseF * 1.58, now);

        gain.gain.setValueAtTime(0.075, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.08);
        osc2.stop(now + 0.08);
      } else if (type === 'WOOD') {
        // 🪵 Woodblock / Bamboo Knock (Resonant Bandpass Percussion)
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        const woodFreq = 720 + Math.random() * 150;
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(woodFreq, now);
        filter.Q.setValueAtTime(3.6, now);

        osc.type = 'square';
        osc.frequency.setValueAtTime(woodFreq, now);
        osc.frequency.exponentialRampToValueAtTime(woodFreq * 0.5, now + 0.045);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.045);
      } else if (type === 'BUBBLE') {
        // 🫧 Water Bubble / Droplet Pop (Upward pitch sweep)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const startF = 380 + Math.random() * 70;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startF, now);
        osc.frequency.exponentialRampToValueAtTime(startF * 2.2, now + 0.055);

        gain.gain.setValueAtTime(0.11, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.055);
      } else if (type === 'SOFT') {
        // 🪀 Soft Muted Rubber Thud (Warm Lowpass Bump)
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(360, now);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220 + Math.random() * 40, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

        gain.gain.setValueAtTime(0.13, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
      } else {
        // 🏓 PLASTIC (Default Crisp Ping-Pong Click)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(560 + Math.random() * 140, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.038);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.038);
      }
    } catch (e) {}
  }

  playWaterSplash() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Splash noise
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.6;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.35);

      // Droplets chime
      [880, 1174, 1396].forEach((f, i) => {
        const t = now + 0.08 + i * 0.06;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
      });
    } catch (e) {}
  }

  playBallCrack() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Crisp Plastic Capsule Snap / Crack Click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.038);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.038);

      // Micro noise burst for tactile physical crack texture
      const bufSize = Math.floor(this.ctx.sampleRate * 0.02);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.45;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.15, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      noise.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.02);

      // 2. Magic Shimmering Sparkle Chimes upon Capsule Opening
      [1046.50, 1318.51, 1567.98, 2093.00].forEach((freq, idx) => {
        const t = now + 0.035 + idx * 0.055;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start(t);
        o.stop(t + 0.25);
      });
    } catch (e) {}
  }

  startTensionLoop() {
    if (this.muted) return;
    this.stopTensionLoop();
    try {
      this.init();
      if (!this.ctx) return;

      let beat = 0;
      const bpm = 126;
      const intervalMs = Math.round((60 / bpm) * 500); // 8th note heartbeat pulse (~238ms)

      this._tensionTimer = setInterval(() => {
        if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
        const now = this.ctx.currentTime;
        const isDownbeat = (beat % 4 === 0);
        const isOffbeat = (beat % 2 === 1);

        // Low bass suspense pulse
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isDownbeat ? 240 : 180, now);

        osc.type = 'triangle';
        const rootFreq = isDownbeat ? 65.4 : 55.0; // C2 / A1
        osc.frequency.setValueAtTime(rootFreq, now);
        osc.frequency.exponentialRampToValueAtTime(32.7, now + 0.18);

        const volume = isDownbeat ? 0.08 : (isOffbeat ? 0.03 : 0.05);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.19);

        // Subtle mechanical tick on offbeat
        if (isOffbeat) {
          const tickOsc = this.ctx.createOscillator();
          const tickGain = this.ctx.createGain();
          tickOsc.type = 'sine';
          tickOsc.frequency.setValueAtTime(1400, now);
          tickGain.gain.setValueAtTime(0.02, now);
          tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
          tickOsc.connect(tickGain);
          tickGain.connect(this.ctx.destination);
          tickOsc.start(now);
          tickOsc.stop(now + 0.035);
        }

        beat = (beat + 1) % 16;
      }, intervalMs);
    } catch (e) {}
  }

  stopTensionLoop() {
    if (this._tensionTimer) {
      clearInterval(this._tensionTimer);
      this._tensionTimer = null;
    }
  }

  startLobbyBGM() {
    if (this.muted) return;
    this.stopLobbyBGM();
    try {
      this.init();
      if (!this.ctx) return;

      this._isBgmPlaying = true;
      let step = 0;
      let measure = 0;
      const bpm = 110;
      const stepDuration = (60 / bpm) / 4; // 16th note ~136ms
      const intervalMs = Math.round(stepDuration * 1000);

      // 4-Bar Chord Progression (C - Am - F - G)
      const chords = [
        { name: 'C',  bass: 65.41, notes: [261.63, 329.63, 392.00, 493.88, 523.25] },
        { name: 'Am', bass: 55.00, notes: [220.00, 261.63, 329.63, 392.00, 440.00] },
        { name: 'F',  bass: 43.65, notes: [174.61, 220.00, 261.63, 329.63, 349.23] },
        { name: 'G',  bass: 48.99, notes: [196.00, 246.94, 293.66, 349.23, 392.00] }
      ];

      // Melodic rhythm triggers across 16 steps
      const rhythmPattern = {
        0: 0,
        3: 1,
        6: 2,
        8: 4,
        10: 3,
        12: 2,
        14: 1
      };

      this._bgmTimer = setInterval(() => {
        if (this.muted || !this._isBgmPlaying || !this.ctx || this.ctx.state !== 'running') return;
        const now = this.ctx.currentTime;
        const currentChord = chords[measure % 4];

        // 1. Soft Sub Bass on Beat 0 and Beat 8
        if (step === 0 || step === 8) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          const bassFilter = this.ctx.createBiquadFilter();

          bassFilter.type = 'lowpass';
          bassFilter.frequency.setValueAtTime(160, now);

          bassOsc.type = 'sine';
          bassOsc.frequency.setValueAtTime(currentChord.bass, now);

          const bassVol = step === 0 ? 0.065 : 0.04;
          bassGain.gain.setValueAtTime(bassVol, now);
          bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

          bassOsc.connect(bassFilter);
          bassFilter.connect(bassGain);
          bassGain.connect(this.ctx.destination);

          bassOsc.start(now);
          bassOsc.stop(now + 0.36);
        }

        // 2. Playful Kalimba / Pluck Melodic Note
        if (rhythmPattern[step] !== undefined) {
          const noteIdx = rhythmPattern[step];
          const freq = currentChord.notes[noteIdx % currentChord.notes.length];

          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);

          const noteVol = step === 0 ? 0.045 : 0.03;
          gain.gain.setValueAtTime(noteVol, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.19);
        }

        // 3. Gentle Shaker Groove on Offbeats
        if (step % 2 === 1) {
          const noiseBuffer = this.ctx.createBuffer(1, Math.round(this.ctx.sampleRate * 0.025), this.ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < noiseBuffer.length; i++) {
            output[i] = Math.random() * 2 - 1;
          }

          const whiteNoise = this.ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(7000, now);
          filter.Q.setValueAtTime(3, now);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.012, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.024);

          whiteNoise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          whiteNoise.start(now);
          whiteNoise.stop(now + 0.025);
        }

        step++;
        if (step >= 16) {
          step = 0;
          measure = (measure + 1) % 4;
        }
      }, intervalMs);
    } catch (e) {
      console.warn('Lobby BGM start error:', e);
    }
  }

  stopLobbyBGM() {
    this._isBgmPlaying = false;
    if (this._bgmTimer) {
      clearInterval(this._bgmTimer);
      this._bgmTimer = null;
    }
  }

  toggleLobbyBGM() {
    if (this._isBgmPlaying) {
      this.stopLobbyBGM();
      return false;
    } else {
      this.startLobbyBGM();
      return true;
    }
  }

  isLobbyBGMPlaying() {
    return Boolean(this._isBgmPlaying && !this.muted);
  }

  startLuckyDrawBGM() {
    if (this.muted) return;
    this.stopLuckyDrawBGM();
    try {
      this.init();
      if (!this.ctx) return;

      this._isLuckyBgmPlaying = true;
      let step = 0;
      let measure = 0;
      const bpm = 118;
      const stepDuration = (60 / bpm) / 4; // 16th note ~127ms
      const intervalMs = Math.round(stepDuration * 1000);

      // Festive Lucky Game-Show Progression (G - Em - C - D)
      const chords = [
        { name: 'G',  bass: 48.99, notes: [392.00, 493.88, 587.33, 783.99, 987.77] },
        { name: 'Em', bass: 41.20, notes: [329.63, 392.00, 493.88, 659.25, 783.99] },
        { name: 'C',  bass: 65.41, notes: [261.63, 329.63, 392.00, 523.25, 659.25] },
        { name: 'D',  bass: 73.42, notes: [293.66, 369.99, 440.00, 587.33, 739.99] }
      ];

      // Playful sparkling arpeggio pattern
      const arpPattern = {
        0: 0,
        2: 2,
        4: 1,
        6: 3,
        8: 4,
        10: 2,
        12: 3,
        14: 1
      };

      this._luckyBgmTimer = setInterval(() => {
        if (this.muted || !this._isLuckyBgmPlaying || !this.ctx || this.ctx.state !== 'running') return;
        const now = this.ctx.currentTime;
        const currentChord = chords[measure % 4];

        // 1. Bouncy Sub Bass on Beats 0, 6, 8
        if (step === 0 || step === 6 || step === 8) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          const bassFilter = this.ctx.createBiquadFilter();

          bassFilter.type = 'lowpass';
          bassFilter.frequency.setValueAtTime(200, now);

          bassOsc.type = 'sine';
          bassOsc.frequency.setValueAtTime(currentChord.bass, now);

          const bassVol = step === 0 ? 0.055 : 0.035;
          bassGain.gain.setValueAtTime(bassVol, now);
          bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

          bassOsc.connect(bassFilter);
          bassFilter.connect(bassGain);
          bassGain.connect(this.ctx.destination);

          bassOsc.start(now);
          bassOsc.stop(now + 0.29);
        }

        // 2. Music Box / Celesta Pluck Note (Chime vibe)
        if (arpPattern[step] !== undefined) {
          const noteIdx = arpPattern[step];
          const freq = currentChord.notes[noteIdx % currentChord.notes.length];

          const osc = this.ctx.createOscillator();
          const oscOvertone = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          oscOvertone.type = 'triangle';
          oscOvertone.frequency.setValueAtTime(freq * 2, now);

          const noteVol = step === 0 || step === 8 ? 0.035 : 0.022;
          gain.gain.setValueAtTime(noteVol, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

          osc.connect(gain);
          oscOvertone.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          oscOvertone.start(now);
          osc.stop(now + 0.17);
          oscOvertone.stop(now + 0.17);
        }

        // 3. Crisp Carnival Shaker on every 2nd step
        if (step % 2 === 1) {
          const noiseBuffer = this.ctx.createBuffer(1, Math.round(this.ctx.sampleRate * 0.022), this.ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < noiseBuffer.length; i++) {
            output[i] = Math.random() * 2 - 1;
          }

          const whiteNoise = this.ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(8500, now);
          filter.Q.setValueAtTime(3.5, now);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.01, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.021);

          whiteNoise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          whiteNoise.start(now);
          whiteNoise.stop(now + 0.022);
        }

        step++;
        if (step >= 16) {
          step = 0;
          measure = (measure + 1) % 4;
        }
      }, intervalMs);
    } catch (e) {
      console.warn('Lucky Draw BGM start error:', e);
    }
  }

  stopLuckyDrawBGM() {
    this._isLuckyBgmPlaying = false;
    if (this._luckyBgmTimer) {
      clearInterval(this._luckyBgmTimer);
      this._luckyBgmTimer = null;
    }
  }

  toggleLuckyDrawBGM() {
    if (this._isLuckyBgmPlaying) {
      this.stopLuckyDrawBGM();
      return false;
    } else {
      this.startLuckyDrawBGM();
      return true;
    }
  }

  isLuckyDrawBGMPlaying() {
    return Boolean(this._isLuckyBgmPlaying && !this.muted);
  }
}

export const sfx = new SoundEffects();
