/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private ambientInterval: any = null;
  private windNode: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;

  init() {
    if (this.ctx) return;
    try {
      // Create audio context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  setMute(mute: boolean) {
    this.muted = mute;
    if (mute) {
      this.stopAmbient();
    } else {
      this.startAmbient();
    }
  }

  isMuted() {
    return this.muted;
  }

  private createNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  playJump() {
    this.init();
    if (this.muted || !this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(650, this.ctx.currentTime + 0.16);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  playLand() {
    this.init();
    if (this.muted || !this.ctx) return;

    const noise = this.ctx.createBufferSource();
    const buffer = this.createNoiseBuffer();
    if (!buffer) return;
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + 0.12);
  }

  playCollect() {
    this.init();
    if (this.muted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C, E, G arpeggio

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = now + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, t + 0.1);

      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    });

    // Bubble secondary splash sound
    setTimeout(() => {
      this.playWaterSplashEffect();
    }, 50);
  }

  private playWaterSplashEffect() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.15);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  playDeliver() {
    this.init();
    if (this.muted || !this.ctx) return;

    const now = this.ctx.currentTime;
    // Pentatonic scale rising beautifully (C5, D5, E5, G5, A5, C6)
    const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1318.51];

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = now + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq * 1.02, t + 0.25);

      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  playHurt() {
    this.init();
    if (this.muted || !this.ctx) return;

    const now = this.ctx.currentTime;

    // Heavy low noise crash
    const noise = this.ctx.createBufferSource();
    const buffer = this.createNoiseBuffer();
    if (buffer) {
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, now);
      filter.Q.setValueAtTime(1.0, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.28);
    }

    // Gritty synth slide down
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.25);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  playSplash() {
    this.init();
    if (this.muted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    const buffer = this.createNoiseBuffer();
    if (!buffer) return;
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.linearRampToValueAtTime(100, now + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.19);
  }

  playGrowl() {
    this.init();
    if (this.muted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.35);

    // aggressive vibrato
    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    vibrato.frequency.setValueAtTime(25, now);
    vibratoGain.gain.setValueAtTime(30, now);

    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    vibrato.start(now);
    osc.start(now);

    vibrato.stop(now + 0.36);
    osc.stop(now + 0.36);
  }

  playClick() {
    this.init();
    if (this.muted || !this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1100, this.ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.07);
  }

  playVictory() {
    this.init();
    if (this.muted || !this.ctx) return;

    const now = this.ctx.currentTime;
    // Upbeat chords/notes (fanfare)
    const melody = [
      { f: 261.63, d: 0.1 }, // C4
      { f: 329.63, d: 0.1 }, // E4
      { f: 392.00, d: 0.1 }, // G4
      { f: 523.25, d: 0.2 }, // C5
      { f: 392.00, d: 0.1 }, // G4
      { f: 523.25, d: 0.4 }, // C5
    ];

    let accum = 0;
    melody.forEach((note) => {
      if (!this.ctx) return;
      const t = now + accum;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.01);
      gain.gain.linearRampToValueAtTime(0.05, t + note.d - 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d + 0.05);

      accum += note.d + 0.02;
    });
  }

  playGameOver() {
    this.init();
    if (this.muted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const melody = [
      { f: 293.66, d: 0.2 }, // D4
      { f: 277.18, d: 0.2 }, // C#4
      { f: 261.63, d: 0.2 }, // C4
      { f: 196.00, d: 0.6 }, // G3
    ];

    let accum = 0;
    melody.forEach((note) => {
      if (!this.ctx) return;
      const t = now + accum;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d + 0.05);

      accum += note.d + 0.05;
    });
  }

  startAmbient() {
    this.init();
    if (this.muted || !this.ctx) return;
    if (this.ambientInterval) return;

    try {
      const now = this.ctx.currentTime;

      // Synthesize soft wind
      const noise = this.ctx.createBufferSource();
      const buffer = this.createNoiseBuffer();
      if (buffer) {
        noise.buffer = buffer;
        noise.loop = true;

        this.windNode = this.ctx.createBiquadFilter();
        this.windNode.type = 'lowpass';
        this.windNode.frequency.setValueAtTime(150, now);
        this.windNode.Q.setValueAtTime(2.0, now);

        this.windGain = this.ctx.createGain();
        this.windGain.gain.setValueAtTime(0.015, now);

        noise.connect(this.windNode);
        this.windNode.connect(this.windGain);
        this.windGain.connect(this.ctx.destination);

        noise.start(now);
      }

      // Periodically change wind frequency and trigger birds chirping
      this.ambientInterval = setInterval(() => {
        if (!this.ctx || this.muted) return;

        // Modulate wind
        if (this.windNode) {
          const targetFreq = 100 + Math.random() * 200;
          this.windNode.frequency.exponentialRampToValueAtTime(targetFreq, this.ctx.currentTime + 3);
        }

        // Random bird chirp (10% chance every 4 seconds)
        if (Math.random() < 0.4) {
          this.playBirdChirp();
        }
      }, 4000);
    } catch (e) {
      console.warn("Could not start ambient synthesizer", e);
    }
  }

  stopAmbient() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    if (this.windGain) {
      try {
        this.windGain.disconnect();
      } catch (e) {}
      this.windGain = null;
    }
    this.windNode = null;
  }

  private playBirdChirp() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Classic high-pitched twin-chirp
    const triggerChirp = (delay: number) => {
      if (!this.ctx) return;
      const t = now + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800 + Math.random() * 300, t);
      osc.frequency.exponentialRampToValueAtTime(2800 + Math.random() * 300, t + 0.08);

      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.015, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.12);
    };

    triggerChirp(0);
    triggerChirp(0.12);
  }
}

export const gameAudio = new RetroAudioEngine();
