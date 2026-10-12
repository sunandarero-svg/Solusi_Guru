// Web Audio API Synthesizer for Borneo Edu
// Zero external file dependencies - 100% reliable, zero network latency, instant sound.

class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sfxVolume: number = 0.8;
  private bgmVolume: number = 0.35;
  private bgmOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
  private bgmInterval: any = null;
  private currentWorld: number = 1;
  private isBgmPlaying: boolean = false;

  private initCtx() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopBgm();
    } else if (this.isBgmPlaying) {
      this.startBgm(this.currentWorld);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(sfx: number, bgm: number) {
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    this.bgmVolume = Math.max(0, Math.min(1, bgm));
  }

  // Coin Collect Chime (Sparkling B5 -> E6)
  public playCoin() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Jump swoop
  public playJump() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.15);

    gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Correct answer fanfare (Major Triad Chord: C5, E5, G5, C6)
  public playCorrect() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    });
  }

  // Wrong answer buzzer
  public playWrong() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.3);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Power Up chime (Ascending retro arpeggio)
  public playPowerUp() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const freqs = [330, 392, 659, 523, 587, 784];
    freqs.forEach((freq, i) => {
      const now = ctx.currentTime + i * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    });
  }

  // Shield deflection sound
  public playShieldDeflect() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.3);

    gain.gain.setValueAtTime(this.sfxVolume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Enemy defeated
  public playEnemyDefeat() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);

    gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Boss alert roar / fanfare
  public playBossAlert() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.4);

    gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  // Boss Defeated
  public playBossDefeated() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    });
  }

  // Timer Tick (normal or urgent)
  public playTick(isUrgent: boolean = false) {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isUrgent ? 880 : 440, now);

    gain.gain.setValueAtTime(this.sfxVolume * (isUrgent ? 0.35 : 0.15), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isUrgent ? 0.08 : 0.05));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + (isUrgent ? 0.08 : 0.05));
  }

  // Victory Fanfare (Game finished)
  public playVictoryFanfare() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const melody = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 523.25, d: 0.15 },
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.3 },  // E5
      { f: 587.33, d: 0.15 }, // D5
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.45 }, // G5
      { f: 1046.50, d: 0.8 }  // C6
    ];

    let t = ctx.currentTime;
    melody.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(this.sfxVolume * 0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);
      t += note.d + 0.05;
    });
  }

  // Ambient Procedural BGM
  public startBgm(world: number = 1) {
    this.currentWorld = world;
    this.isBgmPlaying = true;
    if (this.isMuted) return;

    this.stopBgm();
    const ctx = this.initCtx();
    if (!ctx) return;

    // Scale patterns for different worlds
    const scales: Record<number, number[]> = {
      1: [261.63, 293.66, 329.63, 392.00, 440.00], // Forest: C Major Pentatonic (bright & playful)
      2: [220.00, 261.63, 293.66, 329.63, 392.00], // Mountain: A Minor Pentatonic (energetic & driven)
      3: [246.94, 293.66, 329.63, 369.99, 440.00], // Ocean: B Pentatonic (fluid & serene)
      4: [220.00, 246.94, 261.63, 329.63, 349.23], // Desert: Byzantine / Phrygian mystery
      5: [196.00, 220.00, 246.94, 293.66, 329.63]  // Castle: G Epic minor
    };

    const worldScale = scales[world] || scales[1];
    let step = 0;

    this.bgmInterval = setInterval(() => {
      if (this.isMuted || !this.isBgmPlaying) return;
      if (!this.ctx || this.ctx.state === 'suspended') return;

      const freq = worldScale[step % worldScale.length];
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(this.bgmVolume * 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);

      step++;
    }, 450);
  }

  public stopBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sound = new SoundSystem();
