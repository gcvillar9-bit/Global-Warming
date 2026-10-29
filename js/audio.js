/* COOL IT! — tiny synth. Every sound is generated live with Web Audio; no audio files. */
(function () {
  const STORE_KEY = "coolit.muted";
  let ctx = null;
  let master = null;
  let musicBus = null;
  let sfxBus = null;
  let noiseBuf = null;
  let muted = false;
  try { muted = localStorage.getItem(STORE_KEY) === "1"; } catch (e) {}

  // C major pentatonic across a few octaves — any sequence of these sounds pleasant.
  const PENTA = [0, 2, 4, 7, 9];
  function pentaFreq(step, base) {
    const octave = Math.floor(step / PENTA.length);
    const semis = PENTA[((step % PENTA.length) + PENTA.length) % PENTA.length] + octave * 12;
    return (base || 523.25) * Math.pow(2, semis / 12);
  }

  function ensure() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.8;
    master.connect(comp).connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.9;
    sfxBus.connect(master);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.32;
    musicBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function tone(freq, opts) {
    const c = ensure();
    if (!c) return;
    const o = opts || {};
    const t = c.currentTime + (o.delay || 0);
    const dur = o.dur || 0.18;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t + dur);
    const vol = o.vol == null ? 0.25 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (o.attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(o.bus || sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(opts) {
    const c = ensure();
    if (!c) return;
    const o = opts || {};
    const t = c.currentTime + (o.delay || 0);
    const dur = o.dur || 0.2;
    const src = c.createBufferSource();
    src.buffer = noiseBuf;
    const f = c.createBiquadFilter();
    f.type = o.filter || "bandpass";
    f.frequency.setValueAtTime(o.from || 800, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    f.Q.value = o.q || 1.2;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(sfxBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  const Sfx = {
    unlock() { ensure(); },
    get muted() { return muted; },
    setMuted(m) {
      muted = !!m;
      try { localStorage.setItem(STORE_KEY, muted ? "1" : "0"); } catch (e) {}
      if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.8, ctx.currentTime, 0.05);
    },
    toggleMute() { this.setMuted(!muted); return muted; },
    pentaFreq,

    /** Combo-aware pop: every step of the combo climbs the pentatonic scale. */
    pop(step) {
      const s = Math.min(step || 0, 22);
      const f = pentaFreq(s, 392);
      tone(f, { type: "triangle", dur: 0.16, vol: 0.22 });
      tone(f * 2, { type: "sine", dur: 0.1, vol: 0.08 });
      noise({ from: 3000, dur: 0.04, vol: 0.06, filter: "highpass" });
    },
    convert(step) {
      const f = pentaFreq(Math.min(step || 0, 18), 523.25);
      tone(f, { type: "square", dur: 0.08, vol: 0.07 });
      tone(f * 1.5, { type: "triangle", dur: 0.25, vol: 0.18, delay: 0.06 });
      tone(f * 2, { type: "sine", dur: 0.4, vol: 0.1, delay: 0.12 });
    },
    sparkle() {
      for (let i = 0; i < 5; i++) tone(pentaFreq(10 + i * 2, 523.25), { type: "sine", dur: 0.2, vol: 0.06, delay: i * 0.04 });
    },
    powerup() {
      [0, 2, 4, 5, 7, 9].forEach((s, i) => tone(pentaFreq(s + 5, 392), { type: "triangle", dur: 0.22, vol: 0.16, delay: i * 0.06 }));
      noise({ from: 400, to: 6000, dur: 0.5, vol: 0.06 });
    },
    fanfare() {
      const notes = [0, 2, 3, 5, 7];
      notes.forEach((s, i) => tone(pentaFreq(s + 5, 261.63), { type: "square", dur: 0.18, vol: 0.06, delay: i * 0.09 }));
      notes.forEach((s, i) => tone(pentaFreq(s + 5, 261.63), { type: "triangle", dur: 0.3, vol: 0.18, delay: i * 0.09 }));
      tone(pentaFreq(10, 261.63), { type: "triangle", dur: 0.9, vol: 0.2, delay: 0.5 });
      tone(pentaFreq(12, 261.63), { type: "sine", dur: 0.9, vol: 0.12, delay: 0.5 });
    },
    blocked() {
      tone(880, { type: "square", dur: 0.06, vol: 0.08 });
      tone(1320, { type: "square", dur: 0.12, vol: 0.08, delay: 0.07 });
      noise({ from: 2000, dur: 0.08, vol: 0.08, delay: 0.02 });
    },
    bad() {
      tone(140, { type: "sawtooth", dur: 0.3, vol: 0.12, slideTo: 70 });
      noise({ from: 300, to: 120, dur: 0.3, vol: 0.12, filter: "lowpass" });
    },
    fire() {
      noise({ from: 600, to: 200, dur: 0.6, vol: 0.12, filter: "lowpass" });
      tone(90, { type: "sawtooth", dur: 0.25, vol: 0.05 });
    },
    whoosh() { noise({ from: 300, to: 3000, dur: 0.35, vol: 0.12 }); },
    tick() { tone(1200, { type: "sine", dur: 0.04, vol: 0.08 }); },
    click() { tone(660, { type: "triangle", dur: 0.06, vol: 0.12 }); tone(990, { type: "sine", dur: 0.05, vol: 0.06, delay: 0.03 }); },
    correct() {
      tone(pentaFreq(5, 392), { type: "triangle", dur: 0.14, vol: 0.2 });
      tone(pentaFreq(7, 392), { type: "triangle", dur: 0.14, vol: 0.2, delay: 0.08 });
      tone(pentaFreq(10, 392), { type: "triangle", dur: 0.35, vol: 0.2, delay: 0.16 });
    },
    wrong() {
      tone(300, { type: "square", dur: 0.16, vol: 0.08, slideTo: 200 });
      tone(200, { type: "square", dur: 0.28, vol: 0.08, slideTo: 120, delay: 0.14 });
    },
    lose() {
      [7, 5, 3, 0].forEach((s, i) => tone(pentaFreq(s, 196), { type: "triangle", dur: 0.4, vol: 0.16, delay: i * 0.18 }));
    },
    /** A single musical note, used by the data sonification. */
    note(freq, dur, vol, type) { tone(freq, { type: type || "triangle", dur: dur || 0.2, vol: vol == null ? 0.15 : vol }); },
    now() { return ctx ? ctx.currentTime : 0; },
  };

  /* --- Generative background music: soft pads + pentatonic arpeggio. --- */
  const Music = {
    playing: false,
    timer: null,
    step: 0,
    intensity: 0, // 0..1 — drives tempo and brightness
    start() {
      const c = ensure();
      if (!c || this.playing) return;
      this.playing = true;
      this.step = 0;
      this._tick();
    },
    stop() {
      this.playing = false;
      clearTimeout(this.timer);
    },
    _tick() {
      if (!this.playing) return;
      const c = ensure();
      const chords = [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]];
      const bar = Math.floor(this.step / 8) % chords.length;
      const chord = chords[bar];
      const root = 130.81; // C3
      if (this.step % 8 === 0) {
        chord.forEach((s) => tone(root * Math.pow(2, s / 12), { type: "sine", dur: 2.6, vol: 0.05, attack: 0.4, bus: musicBus }));
        tone(root / 2 * Math.pow(2, chord[0] / 12), { type: "triangle", dur: 2.4, vol: 0.08, attack: 0.05, bus: musicBus });
      }
      const pattern = [0, 2, 1, 3, 2, 1, 3, 2];
      const s = chord[pattern[this.step % 8]] + 24;
      const v = 0.035 + this.intensity * 0.03;
      if (this.step % 2 === 0 || this.intensity > 0.4) {
        tone(root * Math.pow(2, s / 12), { type: "triangle", dur: 0.3, vol: v, bus: musicBus });
      }
      if (this.intensity > 0.6 && this.step % 4 === 2) noise({ from: 6000, dur: 0.03, vol: 0.03, filter: "highpass" });
      this.step++;
      const ms = 300 - this.intensity * 90;
      this.timer = setTimeout(() => this._tick(), ms);
      void c;
    },
  };

  window.Sfx = Sfx;
  window.Music = Music;
})();
