/* COOL IT! — shared feel-good effects: confetti, toasts, haptics, badges. */
(function () {
  /* ---------- Confetti (one overlay canvas, shared) ---------- */
  let cv = null, cx = null, bits = [], raf = 0;
  const COLORS = ["#3ef2a0", "#7fdcff", "#ffd23f", "#9b7bff", "#ff8fb1", "#ffffff"];

  function ensureCanvas() {
    if (cv) return;
    cv = document.createElement("canvas");
    cv.setAttribute("aria-hidden", "true");
    Object.assign(cv.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: 300 });
    document.body.appendChild(cv);
    cx = cv.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
  }
  function resize() {
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function confetti(opts) {
    const o = opts || {};
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ensureCanvas();
    const n = o.count || 120;
    const x = o.x == null ? innerWidth / 2 : o.x;
    const y = o.y == null ? innerHeight * 0.35 : o.y;
    const spread = o.spread || 1;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * spread;
      const sp = 6 + Math.random() * 10 * (o.power || 1);
      bits.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        c: (o.colors || COLORS)[Math.floor(Math.random() * (o.colors || COLORS).length)],
        life: 1,
        shape: o.emoji ? "emoji" : Math.random() < 0.3 ? "circle" : "rect",
        emoji: o.emoji,
      });
    }
    if (!raf) raf = requestAnimationFrame(step);
  }

  function step() {
    cx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i];
      b.vy += 0.32;
      b.vx *= 0.985;
      b.vy *= 0.985;
      b.x += b.vx;
      b.y += b.vy;
      b.r += b.vr;
      if (b.y > innerHeight + 40) b.life -= 0.2;
      b.life -= 0.004;
      if (b.life <= 0) { bits.splice(i, 1); continue; }
      cx.save();
      cx.globalAlpha = Math.min(1, b.life * 2);
      cx.translate(b.x, b.y);
      cx.rotate(b.r);
      if (b.shape === "emoji") {
        cx.font = "22px serif";
        cx.textAlign = "center";
        cx.fillText(b.emoji, 0, 0);
      } else {
        cx.fillStyle = b.c;
        if (b.shape === "circle") { cx.beginPath(); cx.arc(0, 0, b.w / 2, 0, Math.PI * 2); cx.fill(); }
        else { cx.scale(1, Math.cos(b.r * 3)); cx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); }
      }
      cx.restore();
    }
    if (bits.length) raf = requestAnimationFrame(step);
    else { raf = 0; cx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  /* ---------- Toasts ---------- */
  let host = null;
  function toast(icon, title, sub, opts) {
    const o = opts || {};
    if (!host) {
      host = document.createElement("div");
      host.className = "toasts";
      host.setAttribute("role", "status");
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }
    const el = document.createElement("div");
    el.className = "toast" + (o.cls ? " " + o.cls : "");
    const ic = document.createElement("div");
    ic.className = "t-icon";
    ic.textContent = icon;
    const body = document.createElement("div");
    const b = document.createElement("b");
    b.textContent = title;
    body.appendChild(b);
    if (sub) {
      const s = document.createElement("small");
      s.textContent = sub;
      body.appendChild(s);
    }
    el.append(ic, body);
    host.appendChild(el);
    const maxToasts = innerWidth < 560 ? 2 : 3;
    while (host.children.length > maxToasts) host.firstChild.remove();
    const ms = o.ms || 4200;
    setTimeout(() => {
      el.classList.add("out");
      setTimeout(() => el.remove(), 400);
    }, ms);
    return el;
  }

  function clearToasts() {
    if (host) host.textContent = "";
  }

  /* ---------- Haptics ---------- */
  function buzz(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
  }

  /* ---------- Badges (saved per browser) ---------- */
  const BADGE_KEY = "coolit.badges";
  const BADGES = {
    first_turbine: { icon: "🌬️", name: "First Turbine", desc: "Turned your first polluter clean." },
    slicer: { icon: "🔪", name: "Molecule Slicer", desc: "Sliced 100 CO₂ molecules in one game." },
    combo10: { icon: "🔥", name: "Cool Streak", desc: "Hit a 10× combo." },
    combo30: { icon: "🧊", name: "Ice Cold", desc: "Hit a 30× combo." },
    combo60: { icon: "🥶", name: "Absolute Zero", desc: "Hit a 60× combo." },
    permit: { icon: "🚫", name: "Permit Denied", desc: "Blocked a polluter before it was built." },
    firefighter: { icon: "🚒", name: "Firefighter", desc: "Put out 10 wildfires in one game." },
    survivor: { icon: "📅", name: "Made It to 2050", desc: "Survived until 2050." },
    paris: { icon: "🏆", name: "Paris Hero", desc: "Finished 2050 at or below +1.5 °C." },
    net_negative: { icon: "🌿", name: "Net Negative", desc: "Brought the planet below where you started." },
    quiz_perfect: { icon: "🧠", name: "Climate Brain", desc: "10/10 in Fact or Myth." },
    quiz_streak: { icon: "⚡", name: "On a Roll", desc: "5 correct answers in a row." },
    stripes: { icon: "🎼", name: "Data DJ", desc: "Listened to 146 years of warming." },
    pledge: { icon: "💚", name: "Cool Mover", desc: "Made your Cool Moves pledge card." },
    all_modes: { icon: "🌍", name: "Planet Explorer", desc: "Tried every part of COOL IT!" },
  };
  function loadBadges() {
    try { return JSON.parse(localStorage.getItem(BADGE_KEY) || "{}") || {}; } catch (e) { return {}; }
  }
  function award(id) {
    const b = BADGES[id];
    if (!b) return false;
    const got = loadBadges();
    if (got[id]) return false;
    got[id] = Date.now();
    try { localStorage.setItem(BADGE_KEY, JSON.stringify(got)); } catch (e) {}
    toast(b.icon, "Badge unlocked: " + b.name, b.desc, { cls: "badge", ms: 4800 });
    if (window.Sfx) window.Sfx.sparkle();
    return true;
  }

  /* Track which parts of the site have been visited, for the explorer badge. */
  const VISIT_KEY = "coolit.visited";
  function visit(page) {
    let v = {};
    try { v = JSON.parse(localStorage.getItem(VISIT_KEY) || "{}") || {}; } catch (e) {}
    v[page] = 1;
    try { localStorage.setItem(VISIT_KEY, JSON.stringify(v)); } catch (e) {}
    if (v.play && v.quiz && v.stripes && v.act) setTimeout(() => award("all_modes"), 1500);
  }

  function getStore(key, fallback) {
    try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  }
  function setStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  /* ---------- Offline support (only works when served over http/https) ---------- */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol) && location.hostname !== "localhost") {
    window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
  }

  window.FX = { confetti, toast, clearToasts, buzz, award, BADGES, loadBadges, visit, getStore, setStore };
})();
