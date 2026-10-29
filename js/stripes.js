/* COOL IT! — Hear the Warming: NASA temperature data as stripes and music. */
(function () {
  "use strict";
  const D = window.CLIMATE_DATA;
  const $ = (id) => document.getElementById(id);
  const cv = $("cv");
  const ctx = cv.getContext("2d");
  const N = D.temps.length;
  const co2ByYear = {};
  D.co2.forEach(([y, v]) => { co2ByYear[y] = v; });

  const CAPTIONS = {
    1880: "NASA's global record begins.",
    1912: "A newspaper in New Zealand warns that burning coal could warm the planet.",
    1945: "WWII ends. A huge post-war boom in oil, cars and coal begins.",
    1959: "Charles Keeling's Mauna Loa CO₂ record is running: 316 ppm.",
    1988: "NASA scientist James Hansen tells the US Congress global warming has begun.",
    1992: "Mount Pinatubo's 1991 eruption briefly cools the planet with sun-blocking haze.",
    1997: "The Kyoto Protocol is adopted.",
    2015: "Paris Agreement: keep warming well below 2 °C, aim for 1.5 °C.",
    2016: "A strong El Niño helps set a new heat record.",
    2023: "Record heat across land and sea. Coral reefs begin a global bleaching event.",
    2024: "The hottest year ever measured: about 1.5 °C above the late 1800s.",
    2025: "Still near record heat. The next stripes are still unwritten.",
  };

  let W = 0, H = 0;
  let shown = N; // stripes visible (animated during playback)
  let cursor = -1; // highlighted year index
  let showLine = false, showCo2 = false;
  let playing = false;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function xOf(i) { return (i / N) * W; }
  function draw() {
    ctx.fillStyle = "#050816";
    ctx.fillRect(0, 0, W, H);
    const sw = W / N;
    for (let i = 0; i < Math.min(N, Math.ceil(shown)); i++) {
      ctx.fillStyle = D.color(D.temps[i][1]);
      ctx.fillRect(Math.floor(xOf(i)), 0, Math.ceil(sw) + 1, H);
    }
    // glow on the newest stripe while playing
    if (playing && shown < N) {
      const i = Math.floor(shown);
      const g = ctx.createLinearGradient(xOf(i) - 30, 0, xOf(i) + 10, 0);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, "rgba(255,255,255,0.35)");
      ctx.fillStyle = g;
      ctx.fillRect(xOf(i) - 30, 0, 40, H);
    }
    const top = H * 0.16, bottom = H * 0.62;
    if (showLine) {
      const ys = (v) => bottom - ((v + 0.6) / 2.0) * (bottom - top);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i < Math.min(N, Math.ceil(shown)); i++) {
        const x = xOf(i) + sw / 2, y = ys(D.temps[i][1]);
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      // 1.5 °C line (vs 1880–1900)
      const y15 = ys(D.baseline + 1.5);
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath(); ctx.moveTo(0, y15); ctx.lineTo(W, y15); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#fff";
      ctx.font = "600 13px Inter, sans-serif";
      ctx.fillText("+1.5 °C (Paris goal)", 12, y15 - 6);
    }
    if (showCo2) {
      const first = D.co2[0][0];
      const yc = (v) => bottom - ((v - 300) / 140) * (bottom - top);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#ffd23f";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < Math.min(N, Math.ceil(shown)); i++) {
        const y = D.temps[i][0];
        if (y < first || co2ByYear[y] == null) continue;
        const px = xOf(i) + sw / 2, py = yc(co2ByYear[y]);
        if (started) ctx.lineTo(px, py); else { ctx.moveTo(px, py); started = true; }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffd23f";
      ctx.font = "600 13px Inter, sans-serif";
      const li = D.temps.findIndex((r) => r[0] === 1990);
      if (li >= 0 && li < shown) ctx.fillText("CO₂ (ppm, Mauna Loa)", xOf(li) + 10, yc(co2ByYear[1990]) + 24);
    }
    if (cursor >= 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 2;
      ctx.strokeRect(xOf(cursor) + 0.5, 0.5, Math.max(2, sw - 1), H - 1);
    }
  }

  function noteFor(i) {
    const v = D.temps[i][1];
    const step = Math.round(((v + 0.55) / 1.85) * 20);
    return Sfx.pentaFreq(Math.max(0, Math.min(22, step)), 130.81);
  }

  let capTimer = 0;
  function setReadout(i, withCaption) {
    const [year, anom] = D.temps[i];
    const pre = D.vsPreindustrial(anom);
    $("ro-year").textContent = year;
    const t = $("ro-temp");
    t.textContent = (pre >= 0 ? "+" : "−") + Math.abs(pre).toFixed(2) + " °C";
    t.style.color = pre < 0.4 ? "#cfe6ff" : pre < 0.9 ? "#fcbba1" : "#ff6b5b";
    $("ro-co2").textContent = co2ByYear[year] ? Math.round(co2ByYear[year]) + " ppm CO₂" : "";
    const cap = $("ro-caption");
    if (CAPTIONS[year] && withCaption !== false) {
      cap.textContent = CAPTIONS[year];
      cap.classList.remove("pop"); void cap.offsetWidth; cap.classList.add("pop");
      clearTimeout(capTimer);
      if (playing) capTimer = setTimeout(() => { if (playing) cap.textContent = ""; }, 1900);
    } else if (!playing) cap.textContent = "vs. 1880–1900 average";
  }

  /* ---------- Playback ---------- */
  const STEP = 0.095; // seconds per year
  let t0 = 0, lastIdx = -1;
  function play() {
    Sfx.unlock();
    $("intro").classList.remove("show");
    $("outro").classList.remove("show");
    $("readout").classList.add("show");
    playing = true;
    shown = 0;
    lastIdx = -1;
    cursor = -1;
    t0 = performance.now();
    requestAnimationFrame(tick);
    FX.visit("stripes");
  }
  function tick(now) {
    if (!playing) return;
    const el = (now - t0) / 1000;
    let i = Math.floor(el / STEP);
    // linger a little on captioned years so they can be read
    shown = Math.min(N, el / STEP);
    while (lastIdx < Math.min(i, N - 1)) {
      lastIdx++;
      const f = noteFor(lastIdx);
      const pre = D.vsPreindustrial(D.temps[lastIdx][1]);
      Sfx.note(f, 0.32, 0.11 + Math.max(0, pre) * 0.05, "triangle");
      if (D.temps[lastIdx][0] % 10 === 0) Sfx.note(f / 2, 0.9, 0.06, "sine");
      setReadout(lastIdx);
      if (CAPTIONS[D.temps[lastIdx][0]]) {
        // pause briefly on story beats
        t0 += 650;
      }
    }
    draw();
    if (lastIdx >= N - 1) {
      playing = false;
      shown = N;
      draw();
      finale();
      return;
    }
    requestAnimationFrame(tick);
  }
  function finale() {
    const last = N - 1;
    // final hot chord
    [0, 4, 7].forEach((s, k) => setTimeout(() => Sfx.note(noteFor(last) * Math.pow(2, s / 12), 1.4, 0.1, "triangle"), k * 60));
    setTimeout(() => {
      $("outro").classList.add("show");
      FX.award("stripes");
    }, 1400);
  }

  /* ---------- Scrubbing ---------- */
  let down = false, lastNote = 0;
  function scrub(e) {
    if (playing) return;
    const i = Math.max(0, Math.min(N - 1, Math.floor((e.clientX / W) * N)));
    if (i !== cursor) {
      cursor = i;
      setReadout(i);
      $("readout").classList.add("show");
      const now = performance.now();
      if (down && now - lastNote > 45) { Sfx.note(noteFor(i), 0.18, 0.1, "triangle"); lastNote = now; }
      draw();
    }
  }
  cv.addEventListener("pointerdown", (e) => {
    Sfx.unlock();
    if (playing) return;
    down = true;
    $("outro").classList.remove("show");
    cv.setPointerCapture(e.pointerId);
    cursor = -1;
    scrub(e);
  });
  cv.addEventListener("pointermove", (e) => { if (down || e.pointerType === "mouse") scrub(e); });
  window.addEventListener("pointerup", () => { down = false; });

  /* ---------- Controls ---------- */
  function toggle(btn, key) {
    btn.addEventListener("click", () => {
      Sfx.unlock(); Sfx.click();
      if (key === "line") showLine = !showLine; else showCo2 = !showCo2;
      btn.setAttribute("aria-pressed", String(key === "line" ? showLine : showCo2));
      draw();
    });
  }
  toggle($("btn-line"), "line");
  toggle($("btn-co2"), "co2");
  $("btn-play").addEventListener("click", play);
  $("btn-replay").addEventListener("click", play);
  const muteBtn = $("btn-mute");
  const sync = () => { muteBtn.textContent = Sfx.muted ? "🔇" : "🔊"; };
  muteBtn.addEventListener("click", () => { Sfx.unlock(); Sfx.toggleMute(); sync(); });
  sync();
  window.addEventListener("keydown", (e) => {
    if (playing) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      cursor = Math.max(0, Math.min(N - 1, (cursor < 0 ? N - 1 : cursor) + (e.key === "ArrowRight" ? 1 : -1)));
      setReadout(cursor);
      $("readout").classList.add("show");
      Sfx.note(noteFor(cursor), 0.2, 0.1, "triangle");
      draw();
    }
  });
  window.addEventListener("resize", resize);
  resize();
})();
