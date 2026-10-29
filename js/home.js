/* COOL IT! — home hub */
(function () {
  "use strict";
  const D = window.CLIMATE_DATA;
  const $ = (id) => document.getElementById(id);

  /* ---------- Real warming stripes as the page background ---------- */
  const cv = $("stripes-bg");
  const ctx = cv.getContext("2d");
  let shown = 0; // how many stripes have animated in
  function drawStripes() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = innerWidth, h = innerHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#070b1f";
    ctx.fillRect(0, 0, w, h);
    const n = D.temps.length;
    const sw = w / n;
    for (let i = 0; i < Math.min(n, Math.ceil(shown)); i++) {
      ctx.fillStyle = D.color(D.temps[i][1]);
      ctx.fillRect(Math.floor(i * sw), 0, Math.ceil(sw) + 1, h);
    }
  }
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { shown = D.temps.length; drawStripes(); }
  else {
    const t0 = performance.now();
    (function grow(now) {
      shown = Math.min(D.temps.length, ((now - t0) / 2200) * D.temps.length);
      drawStripes();
      if (shown < D.temps.length) requestAnimationFrame(grow);
    })(t0);
  }
  window.addEventListener("resize", drawStripes);
  // Stripes shine in the hero, then dim so the content below stays readable.
  const onScroll = () => document.body.classList.toggle("scrolled", scrollY > innerHeight * 0.45);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Live counters ---------- */
  const CO2_PER_SEC = 37.4e9 / 31557600; // fossil CO₂, tonnes per second
  const PANELS_PER_SEC = (450e9 / 400) / 31557600; // ~450 GW a year at ~400 W per panel
  const start = performance.now();
  const co2El = $("ctr-co2"), solarEl = $("ctr-solar");
  let lastPanels = 0;
  (function tick(now) {
    const s = (now - start) / 1000;
    co2El.textContent = Math.floor(s * CO2_PER_SEC).toLocaleString();
    const panels = Math.floor(s * PANELS_PER_SEC);
    if (panels !== lastPanels) {
      solarEl.textContent = panels.toLocaleString();
      lastPanels = panels;
    }
    requestAnimationFrame(tick);
  })(start);

  /* ---------- Fact tiles from the real data ---------- */
  const y2024 = D.temps.find((r) => r[0] === 2024);
  if (y2024) $("fact-2024").textContent = "+" + D.vsPreindustrial(y2024[1]).toFixed(2) + " °C";
  const lastCo2 = D.co2[D.co2.length - 1];
  $("fact-co2").textContent = Math.round(lastCo2[1]) + " ppm";

  /* ---------- Poke the planet to cool it ---------- */
  const planet = $("hero-planet");
  planet.classList.add("hot");
  let pokes = 0, coolTimer = 0;
  planet.addEventListener("click", (e) => {
    Sfx.unlock();
    pokes++;
    planet.classList.remove("boing");
    void planet.offsetWidth;
    planet.classList.add("boing", "cool");
    planet.classList.remove("hot");
    Sfx.pop(Math.min(pokes - 1, 14));
    FX.buzz(10);
    const r = planet.getBoundingClientRect();
    FX.confetti({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 14 + Math.min(pokes, 10) * 3, emoji: pokes % 3 === 0 ? "❄️" : undefined, power: 0.8 });
    if (pokes === 5) FX.toast("🥶", "Ahh, that's better!", "Now cool the real one — hit Play.");
    clearTimeout(coolTimer);
    coolTimer = setTimeout(() => { planet.classList.remove("cool"); planet.classList.add("hot"); }, 3500);
    e.preventDefault();
  });

  /* ---------- Badge shelf ---------- */
  const got = FX.loadBadges();
  const host = $("badges");
  const ids = Object.keys(FX.BADGES);
  let count = 0;
  ids.forEach((id) => {
    const b = FX.BADGES[id];
    const el = document.createElement("div");
    const has = !!got[id];
    if (has) count++;
    el.className = "bdg " + (has ? "got" : "locked");
    const ic = document.createElement("span"); ic.className = "b-ico"; ic.textContent = b.icon;
    const nm = document.createElement("b"); nm.textContent = b.name;
    const ds = document.createElement("small"); ds.textContent = has ? b.desc : "🔒 " + b.desc;
    el.append(ic, nm, ds);
    host.appendChild(el);
  });
  $("badge-count").textContent = count + " / " + ids.length;

  /* ---------- Sound toggle ---------- */
  const muteBtn = $("btn-mute");
  const sync = () => { muteBtn.textContent = Sfx.muted ? "🔇" : "🔊"; };
  muteBtn.addEventListener("click", () => { Sfx.unlock(); Sfx.toggleMute(); sync(); if (!Sfx.muted) Sfx.click(); });
  sync();

  /* ---------- Reveal on scroll ---------- */
  const els = document.querySelectorAll(".counters, .facts, .modes, .shelf, .hope");
  if ("IntersectionObserver" in window && !reduce) {
    els.forEach((el) => el.classList.add("reveal"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
  }
})();
