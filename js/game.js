/* COOL IT! — Planet Patrol
 * Slice CO₂ out of the sky, flip polluters into clean tech, deny fossil permits,
 * stop wildfires, and get the planet to 2050 below +1.5 °C.
 */
(function () {
  "use strict";

  const TAU = Math.PI * 2;
  const cv = document.getElementById("game");
  const ctx = cv.getContext("2d");
  const $ = (id) => document.getElementById(id);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ */
  /* Tuning                                                              */
  /* ------------------------------------------------------------------ */
  const SLOTS = 20;
  const START_YEAR = 2025;
  const END_YEAR = 2050;
  const YEAR_SECONDS = 8;
  const T_START = 1.35;
  const T_LIMIT = 2.0;
  const START_MOLECULES = 10;
  const TUNE = {
    perUnit: 0.017, // warming per CO₂-equivalent molecule in the sky
    bg: 1.4, // background emissions per second (aviation, shipping, cement, farming…)
    bgGrowth: 0.7, // extra background emissions per chapter
    spawn: 0.45, // new fossil construction per second
    spawnGrowth: 0.12,
    build: 1.7, // seconds to finish construction
    lock: 0.00018, // permanent warming per molecule-second
  };
  const tBase = () => T_START - TUNE.perUnit * START_MOLECULES;

  const POLLUTERS = {
    coal: { emit: 3.2, clean: ["wind", "solar"], label: "Coal plant" },
    oil: { emit: 4.0, clean: ["wind", "solar"], label: "Oil well" },
    car: { emit: 4.6, clean: ["ev"], label: "Gas car" },
  };
  const isPolluter = (t) => t === "coal" || t === "oil" || t === "car";
  const isClean = (t) => t === "wind" || t === "solar" || t === "ev";

  const CHAPTERS = [
    { name: "Wake-up Call", fact: "Real 2025: CO₂ reached 427 ppm — the highest in at least 800,000 years (NOAA)." },
    { name: "Turning Point", fact: "Real goal: cut global emissions ~43% by 2030 vs 2019 to keep 1.5 °C in reach (IPCC)." },
    { name: "Momentum", fact: "Real 2024: clean energy investment was about double fossil fuel investment (IEA)." },
    { name: "The Long Haul", fact: "Real goal: 1.5 °C pathways reach net-zero CO₂ around 2050 (IPCC)." },
    { name: "Home Stretch", fact: "1.5 °C instead of 2 °C could halve the number of people facing climate-driven water stress (IPCC SR1.5)." },
  ];

  /* Real-world solutions offered between chapters. Effects are game abstractions; facts are real. */
  const CARDS = [
    {
      id: "heatpumps", icon: "♨️", name: "Heat Pumps",
      effect: "New polluters appear 25% slower",
      fact: "Heat pumps are typically 3–5× more energy-efficient than gas boilers.",
      src: "IEA, The Future of Heat Pumps (2022)",
      apply: (m) => { m.spawn *= 0.75; },
    },
    {
      id: "rooftop", icon: "🏠", name: "Rooftop Solar",
      effect: "Auto-flips a polluter every 7 seconds",
      fact: "Solar PV now offers some of the cheapest electricity in history.",
      src: "IEA, World Energy Outlook 2020",
      apply: (m) => { m.autoConvert = m.autoConvert ? m.autoConvert * 0.6 : 7; },
    },
    {
      id: "rainforest", icon: "🌳", name: "Protect Rainforests",
      effect: "Wildfires 45% less likely, trees absorb faster",
      fact: "The world's forests absorb about 7.6 billion tonnes more CO₂ each year than they release.",
      src: "Harris et al., Nature Climate Change (2021)",
      apply: (m) => { m.fire *= 0.55; m.absorb *= 1.3; },
    },
    {
      id: "methane", icon: "🛢️", name: "Methane Leak Patrol",
      effect: "Clears all methane now; future methane halved",
      fact: "Methane is responsible for around 30% of the rise in global temperature since the Industrial Revolution — and fixing leaks is cheap.",
      src: "IEA Global Methane Tracker",
      apply: (m, g) => { m.methane *= 0.5; g.clearMethane(); },
    },
    {
      id: "wind", icon: "🌬️", name: "Wind Power",
      effect: "Every flip releases a gust that clears nearby CO₂",
      fact: "Wind and solar together made about 15% of the world's electricity in 2024 — and are growing fast.",
      src: "Ember, Global Electricity Review 2025",
      apply: (m) => { m.gust += 1; },
    },
    {
      id: "buses", icon: "🚌", name: "Electric Buses",
      effect: "Gas cars appear 50% less, car flips score double",
      fact: "Shenzhen, China, electrified its entire fleet of ~16,000 city buses by 2017.",
      src: "World Resources Institute",
      apply: (m) => { m.carSpawn *= 0.5; m.carBonus = 2; },
    },
    {
      id: "bikes", icon: "🚲", name: "Bike Lanes",
      effect: "Combo timer lasts 50% longer",
      fact: "In Copenhagen, around 45% of all trips to work or school are made by bike.",
      src: "City of Copenhagen",
      apply: (m) => { m.combo *= 1.5; },
    },
    {
      id: "diet", icon: "🥗", name: "Plant-Rich Diets",
      effect: "Background emissions −20%",
      fact: "Food systems produce about a third of all human-caused greenhouse gas emissions.",
      src: "Crippa et al., Nature Food (2021)",
      apply: (m) => { m.bg *= 0.8; },
    },
    {
      id: "waste", icon: "🍎", name: "Stop Food Waste",
      effect: "Background emissions −15%",
      fact: "Food loss and waste cause roughly 8–10% of global greenhouse gas emissions.",
      src: "UNEP Food Waste Index Report (2021)",
      apply: (m) => { m.bg *= 0.85; },
    },
    {
      id: "batteries", icon: "🔋", name: "Grid Batteries",
      effect: "Power-up bubbles appear 60% more often",
      fact: "Lithium-ion battery pack prices fell about 90% between 2010 and 2023.",
      src: "BloombergNEF",
      apply: (m) => { m.power *= 1.6; },
    },
    {
      id: "reforest", icon: "🌱", name: "Reforestation",
      effect: "Instantly plants trees on every empty plot",
      fact: "Brazil's Atlantic Forest Restoration Pact aims to restore 15 million hectares of forest by 2050.",
      src: "Atlantic Forest Restoration Pact",
      apply: (m, g) => { g.plantAll(); },
    },
    {
      id: "carbonprice", icon: "💰", name: "Carbon Pricing",
      effect: "Polluters emit 25% slower",
      fact: "Carbon prices now cover about a quarter of global greenhouse gas emissions.",
      src: "World Bank, State and Trends of Carbon Pricing 2024",
      apply: (m) => { m.emit *= 0.75; },
    },
    {
      id: "insulation", icon: "🧱", name: "Insulate Buildings",
      effect: "Temperature rises 25% more slowly",
      fact: "Buildings account for roughly 30% of global final energy use.",
      src: "IEA",
      apply: (m) => { m.inertia *= 0.75; },
    },
    {
      id: "mangroves", icon: "🦀", name: "Mangrove Guardians",
      effect: "Trees absorb CO₂ 50% faster",
      fact: "Mangrove forests can store up to four times more carbon per hectare than many tropical forests — mostly in their mud.",
      src: "Donato et al., Nature Geoscience (2011)",
      apply: (m) => { m.absorb *= 1.5; },
    },
    {
      id: "steel", icon: "⚙️", name: "Green Steel",
      effect: "Background emissions −15%",
      fact: "Steel makes up about 7% of energy-related CO₂. Sweden's HYBRIT made the first fossil-free steel with hydrogen in 2021.",
      src: "IEA; HYBRIT",
      apply: (m) => { m.bg *= 0.85; },
    },
  ];

  const POWERUPS = {
    sun: { icon: "☀️", name: "Solar Surge", color: "#ffd23f", fact: "Sunlight hitting Earth in about an hour and a half carries more energy than humanity uses in a year." },
    seed: { icon: "🌱", name: "Green Wave", color: "#3ef2a0", fact: "Trees, soils and oceans currently soak up about half of the CO₂ we emit each year." },
    vac: { icon: "🌀", name: "Carbon Vacuum", color: "#9b7bff", fact: "Direct air capture machines exist today — but they're tiny. Cutting emissions is far cheaper than vacuuming them later." },
    rain: { icon: "🌧️", name: "Rain Cloud", color: "#7fdcff", fact: "Hotter air dries out forests. Fire seasons have grown longer across much of the world." },
  };

  /* ------------------------------------------------------------------ */
  /* Canvas sizing                                                       */
  /* ------------------------------------------------------------------ */
  let W = 0, H = 0, DPR = 1, CX = 0, CY = 0, R = 100, ITEM = 24, MOL_R = 10, BAND_MIN = 0, BAND_MAX = 0;
  function resize() {
    const oldR = R, oldH = H;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth;
    H = innerHeight;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const portrait = H > W;
    CX = W / 2;
    CY = portrait ? H * 0.55 : H * 0.55;
    const avail = Math.min(W * (portrait ? 0.92 : 0.8), (H - 110) * 0.98);
    R = Math.max(70, avail * 0.27);
    ITEM = R * 0.3;
    MOL_R = Math.max(8, R * 0.052);
    BAND_MIN = R + ITEM * 1.7;
    BAND_MAX = Math.max(BAND_MIN + 30, Math.min(W / 2 - 18, CY - 70, H - CY - 18, R * 2.1));
    // Keep the existing sky reachable when the window changes shape.
    if (S && oldR) {
      const k = R / oldR;
      for (const m of S.mols) {
        m.dist = clamp(m.dist * k, R, BAND_MAX);
        m.target = clamp(m.target * k, BAND_MIN, BAND_MAX);
      }
      for (const p of S.pups) {
        p.y0 = clamp(oldH ? (p.y0 / oldH) * H : p.y0, H * 0.2, H * 0.85);
        p.r = Math.max(24, R * 0.14);
      }
    }
    stars = makeStars();
  }

  let stars = [];
  function makeStars() {
    const n = Math.round((W * H) / 5000);
    const out = [];
    for (let i = 0; i < n; i++) out.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.2, p: Math.random() * TAU });
    return out;
  }

  /* Static continent shapes, in disc-polar coordinates, rotate with the planet. */
  const continents = [];
  (function makeContinents() {
    const specs = [[0.3, 0.55, 0.32], [2.2, 0.5, 0.28], [3.6, 0.62, 0.25], [4.9, 0.45, 0.3], [1.3, 0.15, 0.18], [5.7, 0.7, 0.16]];
    specs.forEach(([a, d, r]) => {
      const pts = [];
      const n = 14;
      for (let i = 0; i < n; i++) pts.push(r * (0.7 + Math.random() * 0.5));
      continents.push({ a, d, r, pts });
    });
  })();

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  let S = null;
  function newMods() {
    return { spawn: 1, carSpawn: 1, emit: 1, bg: 1, fire: 1, absorb: 1, combo: 1, power: 1, inertia: 1, methane: 1, gust: 0, carBonus: 1, autoConvert: 0 };
  }

  function newState(phase) {
    const s = {
      phase: phase || "title",
      t: 0,
      year: START_YEAR,
      chapter: 0,
      temp: T_START,
      locked: 0,
      rot: 0,
      slots: [],
      mols: [],
      parts: [],
      floats: [],
      pups: [],
      score: 0,
      combo: 0,
      comboT: 0,
      bestCombo: 0,
      mods: newMods(),
      taken: [],
      spawnT: 2,
      bgT: 1,
      pupT: 12,
      autoT: 0,
      methaneT: 3,
      rainT: 0,
      shake: 0,
      joy: 0,
      ouch: 0,
      blinkT: 2,
      blink: 0,
      alarmT: 0,
      stats: { sliced: 0, flipped: 0, denied: 0, fires: 0, burned: 0, powerups: 0 },
      seen: {},
      queue: [], // delayed actions for cascades
    };
    for (let i = 0; i < SLOTS; i++) s.slots.push({ type: null, t: 0, grow: 1, emitT: 0, smokeT: 0, absorbT: 0, burnT: 0, next: null, pop: 0 });
    // Starting world: a handful of polluters and some forest.
    const order = shuffle([...Array(SLOTS).keys()]);
    const start = ["coal", "coal", "oil", "car", "car", "tree", "tree", "tree", "tree", "tree", "tree"];
    start.forEach((type, k) => {
      const sl = s.slots[order[k]];
      sl.type = type;
      sl.emitT = Math.random() * 3 + 1.5;
      sl.absorbT = Math.random() * 10;
    });
    for (let i = 0; i < START_MOLECULES; i++) {
      const m = makeMolecule(Math.random() * TAU, 0, "co2", s);
      m.dist = lerp(BAND_MIN, BAND_MAX, Math.random());
      m.target = m.dist;
      m.scale = 1;
      s.mols.push(m);
    }
    return s;
  }

  function makeMolecule(ang, dist, kind, s) {
    return {
      ang,
      dist,
      target: lerp(BAND_MIN, BAND_MAX, Math.pow(Math.random(), 0.8)),
      angV: (Math.random() < 0.5 ? -1 : 1) * (0.05 + Math.random() * 0.12),
      kind,
      weight: kind === "ch4" ? 2.2 : 1,
      spin: Math.random() * TAU,
      spinV: (Math.random() - 0.5) * 1.2,
      wob: Math.random() * TAU,
      scale: 0.2,
      state: "live",
      born: (s || S) ? (s || S).t : 0,
      x: 0,
      y: 0,
    };
  }

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function easeOutBack(t) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  function mixColor(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, t));
    const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
    const bl = Math.round(lerp(pa & 255, pb & 255, t));
    return "rgb(" + r + "," + g + "," + bl + ")";
  }
  function distToSeg(px, py, x0, y0, x1, y1) {
    const dx = x1 - x0, dy = y1 - y0;
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - x0) * dx + (py - y0) * dy) / l2 : 0;
    t = clamp(t, 0, 1);
    const qx = x0 + t * dx - px, qy = y0 + t * dy - py;
    return Math.sqrt(qx * qx + qy * qy);
  }
  function slotAngle(i) { return (i / SLOTS) * TAU + S.rot - Math.PI / 2; }
  function slotBase(i) { const a = slotAngle(i); return { a, x: CX + Math.cos(a) * R, y: CY + Math.sin(a) * R }; }
  function slotCenter(i, lift) {
    const a = slotAngle(i);
    const d = R + ITEM * (lift == null ? 0.45 : lift);
    return { x: CX + Math.cos(a) * d, y: CY + Math.sin(a) * d, a };
  }
  function molPos(m) {
    const wob = Math.sin(S.t * 1.7 + m.wob) * 4;
    m.x = CX + Math.cos(m.ang) * (m.dist + wob);
    m.y = CY + Math.sin(m.ang) * (m.dist + wob);
  }
  function sky() {
    let c = 0;
    for (const m of S.mols) if (m.state === "live") c += m.weight;
    return c;
  }
  function multiplier() { return Math.min(6, 1 + Math.floor(S.combo / 5) * 0.5); }
  function chapterOf(year) { return clamp(Math.floor((year - START_YEAR) / 5), 0, 4); }

  /* ------------------------------------------------------------------ */
  /* Particles & floating text                                           */
  /* ------------------------------------------------------------------ */
  function burst(x, y, n, opts) {
    const o = opts || {};
    if (S.parts.length > 700) n = Math.min(n, 4);
    for (let i = 0; i < n; i++) {
      const a = o.dir != null ? o.dir + (Math.random() - 0.5) * (o.spread || 1) : Math.random() * TAU;
      const sp = (o.speed || 120) * (0.4 + Math.random() * 0.8);
      S.parts.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: (o.life || 0.7) * (0.6 + Math.random() * 0.6),
        max: o.life || 0.7,
        size: (o.size || 4) * (0.6 + Math.random() * 0.8),
        color: Array.isArray(o.color) ? o.color[Math.floor(Math.random() * o.color.length)] : o.color || "#fff",
        shape: o.shape || "circle",
        grav: o.grav == null ? 0 : o.grav,
        drag: o.drag == null ? 2.2 : o.drag,
        rot: Math.random() * TAU,
        vr: (Math.random() - 0.5) * 8,
        grow: o.grow || 0,
      });
    }
  }
  function ring(x, y, color, size) {
    S.parts.push({ x, y, vx: 0, vy: 0, life: 0.45, max: 0.45, size: size || ITEM, color, shape: "ring", grav: 0, drag: 0, rot: 0, vr: 0, grow: 0 });
  }
  function floatText(x, y, text, color, size) {
    const f = { x, y, text, color: color || "#fff", size: size || 18, life: 1.1, max: 1.1 };
    S.floats.push(f);
    return f;
  }

  /* ------------------------------------------------------------------ */
  /* Scoring & combo                                                     */
  /* ------------------------------------------------------------------ */
  function addCombo() {
    S.combo = S.comboT > 0 ? S.combo + 1 : 1;
    S.comboT = 1.15 * S.mods.combo;
    if (S.combo > S.bestCombo) S.bestCombo = S.combo;
    if (S.combo === 10) { banner("COOL STREAK!", "10× combo"); FX.award("combo10"); }
    if (S.combo === 30) { banner("ICE COLD!", "30× combo"); FX.award("combo30"); Sfx.fanfare(); }
    if (S.combo === 60) { banner("ABSOLUTE ZERO!", "60× combo — legendary"); FX.award("combo60"); Sfx.fanfare(); FX.confetti({ count: 80 }); }
    if (S.combo % 5 === 0 && S.combo > 0) S.joy = 0.8;
  }
  function comboStep() {
    const c = S.combo - 1;
    return c <= 20 ? c : 15 + (c % 6);
  }
  function addScore(base, x, y, color) {
    const pts = Math.round(base * multiplier());
    S.score += pts;
    floatText(x, y, "+" + pts, color || "#fff", 15 + Math.min(10, base / 10));
    scoreDirty = true;
  }

  /* ------------------------------------------------------------------ */
  /* Player actions                                                      */
  /* ------------------------------------------------------------------ */
  function captureMolecule(m, quiet) {
    if (m.state !== "live") return;
    m.state = "dead";
    molPos(m);
    addCombo();
    S.stats.sliced++;
    const leaf = ["#3ef2a0", "#7fdcff", "#b4ffdc", "#ffffff"];
    burst(m.x, m.y, 10, { color: leaf, speed: 160, size: 4, life: 0.6, shape: Math.random() < 0.5 ? "leaf" : "circle" });
    burst(m.x, m.y, 4, { color: m.kind === "ch4" ? "#ffb35c" : "#9aa3b5", speed: 60, size: 6, life: 0.4 });
    ring(m.x, m.y, "rgba(127,220,255,0.9)", MOL_R * 2);
    addScore(m.kind === "ch4" ? 25 : 10, m.x, m.y - 10, m.kind === "ch4" ? "#ffd23f" : "#b4ffdc");
    if (!quiet) { Sfx.pop(comboStep()); FX.buzz(8); }
    if (S.stats.sliced === 100) FX.award("slicer");
  }

  function convertSlot(i, quiet) {
    const sl = S.slots[i];
    if (!isPolluter(sl.type)) return false;
    const from = sl.type;
    const opts = POLLUTERS[from].clean;
    sl.type = opts[Math.floor(Math.random() * opts.length)];
    sl.t = 0;
    sl.pop = 1;
    S.stats.flipped++;
    addCombo();
    const c = slotCenter(i);
    burst(c.x, c.y, 18, { color: ["#ffd23f", "#3ef2a0", "#ffffff", "#7fdcff"], speed: 220, size: 4, life: 0.8, shape: "star" });
    burst(c.x, c.y, 8, { color: "#6b7280", speed: 80, size: 9, life: 0.6, grow: 10 });
    ring(c.x, c.y, "rgba(62,242,160,0.95)", ITEM * 1.6);
    addScore(from === "car" ? 50 * S.mods.carBonus : 50, c.x, c.y - ITEM, "#3ef2a0");
    if (!quiet) { Sfx.convert(comboStep()); FX.buzz(15); }
    S.joy = Math.max(S.joy, 0.5);
    if (S.stats.flipped === 1) FX.award("first_turbine");
    if (S.mods.gust) gust(c.x, c.y, R * (0.9 + 0.4 * S.mods.gust));
    return true;
  }

  function gust(x, y, radius) {
    ring(x, y, "rgba(200,240,255,0.7)", radius * 0.7);
    let k = 0;
    for (const m of S.mols) {
      if (m.state !== "live") continue;
      molPos(m);
      if (Math.hypot(m.x - x, m.y - y) < radius) {
        const mm = m;
        const kk = ++k;
        later(0.05 * kk, () => captureMolecule(mm, kk > 3));
      }
    }
  }

  function denyPermit(i) {
    const sl = S.slots[i];
    if (sl.type !== "build") return false;
    sl.type = null;
    S.stats.denied++;
    addCombo();
    const c = slotCenter(i, 0.35);
    burst(c.x, c.y, 14, { color: ["#ffd23f", "#ff9b3d", "#ffffff"], speed: 200, size: 5, life: 0.6, shape: "square" });
    ring(c.x, c.y, "rgba(255,210,63,0.9)", ITEM * 1.4);
    floatText(c.x, c.y - ITEM * 1.2, "DENIED!", "#ffd23f", 20);
    addScore(75, c.x, c.y - ITEM * 0.4, "#ffd23f");
    Sfx.blocked();
    FX.buzz([10, 30, 10]);
    FX.award("permit");
    return true;
  }

  function extinguish(i, quiet) {
    const sl = S.slots[i];
    if (sl.type !== "fire") return false;
    sl.type = "tree";
    sl.grow = 0.55;
    sl.burnT = 0;
    sl.pop = 1;
    S.stats.fires++;
    addCombo();
    const c = slotCenter(i);
    burst(c.x, c.y - ITEM * 0.2, 16, { color: ["#7fdcff", "#b8ecff", "#ffffff"], speed: 170, size: 4, life: 0.7, grav: 400, dir: -Math.PI / 2, spread: 2.4, shape: "drop" });
    burst(c.x, c.y, 6, { color: "#cbd5e1", speed: 50, size: 8, life: 0.8, grow: 12 });
    addScore(40, c.x, c.y - ITEM, "#7fdcff");
    if (!quiet) { Sfx.pop(comboStep()); Sfx.whoosh(); FX.buzz(12); }
    if (S.stats.fires === 10) FX.award("firefighter");
    return true;
  }

  function popPowerup(p) {
    if (p.dead) return;
    p.dead = true;
    S.stats.powerups++;
    const def = POWERUPS[p.kind];
    burst(p.x, p.y, 30, { color: [def.color, "#ffffff"], speed: 280, size: 5, life: 0.9, shape: "star" });
    ring(p.x, p.y, def.color, R * 0.5);
    Sfx.powerup();
    FX.buzz([20, 40, 20]);
    banner(def.icon + " " + def.name, "");
    FX.toast(def.icon, def.name, def.fact, { ms: 5200 });
    addScore(100, p.x, p.y, def.color);
    S.joy = 1.2;
    if (p.kind === "sun") {
      let k = 0;
      S.slots.forEach((sl, i) => {
        if (isPolluter(sl.type)) later(0.12 * ++k, () => convertSlot(i));
        else if (sl.type === "build") later(0.12 * ++k, () => denyPermit(i));
      });
    } else if (p.kind === "seed") {
      plantAll();
    } else if (p.kind === "vac") {
      let k = 0;
      S.mols.forEach((m) => { if (m.state === "live") { const mm = m; later(0.045 * ++k, () => captureMolecule(mm)); } });
    } else if (p.kind === "rain") {
      S.rainT = 12;
      let k = 0;
      S.slots.forEach((sl, i) => { if (sl.type === "fire") later(0.1 * ++k, () => extinguish(i)); });
    }
  }

  function plantAll() {
    let k = 0;
    S.slots.forEach((sl, i) => {
      if (sl.type === null) {
        const kk = ++k;
        later(0.07 * kk, () => {
          if (sl.type !== null) return;
          sl.type = "tree";
          sl.grow = 0;
          sl.pop = 1;
          sl.absorbT = Math.random() * 6;
          const c = slotCenter(i, 0.2);
          burst(c.x, c.y, 8, { color: ["#3ef2a0", "#22c55e", "#b4ffdc"], speed: 120, size: 4, life: 0.6, shape: "leaf" });
          Sfx.pop(Math.min(kk, 18));
        });
      }
    });
  }

  function clearMethane() {
    let k = 0;
    S.mols.forEach((m) => { if (m.state === "live" && m.kind === "ch4") { const mm = m; later(0.06 * ++k, () => captureMolecule(mm)); } });
  }

  function later(delay, fn) { S.queue.push({ at: S.t + delay, fn }); }

  /* ------------------------------------------------------------------ */
  /* Input: tap + swipe slicing                                          */
  /* ------------------------------------------------------------------ */
  const trail = [];
  let pointerDown = false;
  let lookX = 0, lookY = 0;

  function sliceSegment(x0, y0, x1, y1) {
    if (!S || S.phase !== "playing") return;
    let hit = false;
    // power-ups first — they're precious
    for (const p of S.pups) {
      if (!p.dead && distToSeg(p.x, p.y, x0, y0, x1, y1) < p.r + 10) { popPowerup(p); hit = true; }
    }
    for (const m of S.mols) {
      if (m.state !== "live") continue;
      molPos(m);
      if (distToSeg(m.x, m.y, x0, y0, x1, y1) < MOL_R * 1.9 + 8) { captureMolecule(m); hit = true; swipeHits++; multiSlice(m.x, m.y); }
    }
    for (let i = 0; i < SLOTS; i++) {
      const sl = S.slots[i];
      if (!sl.type || sl.type === "tree" || isClean(sl.type)) continue;
      const c = slotCenter(i, sl.type === "build" ? 0.4 : 0.5);
      if (distToSeg(c.x, c.y, x0, y0, x1, y1) < ITEM * 0.75 + 6) {
        if (sl.type === "build") hit = denyPermit(i) || hit;
        else if (sl.type === "fire") hit = extinguish(i) || hit;
        else hit = convertSlot(i) || hit;
      }
    }
    // Poking the planet makes it giggle.
    if (!hit && x0 === x1 && y0 === y1 && Math.hypot(x0 - CX, y0 - CY) < R * 0.8) {
      S.joy = Math.max(S.joy, 0.6);
      Sfx.tick();
    }
    return hit;
  }

  // Several molecules in one swipe = a multi-slice bonus.
  let swipeHits = 0, swipeBest = 0, multiFloat = null;
  const MULTI = { 3: "TRIPLE SLICE!", 5: "MEGA SLICE!", 8: "ULTRA SLICE!", 12: "CARBON CRUSHER!" };
  function multiSlice(x, y) {
    const label = MULTI[swipeHits];
    if (!label || swipeHits <= swipeBest) return;
    swipeBest = swipeHits;
    if (multiFloat) multiFloat.life = 0;
    multiFloat = floatText(x, y - 34, label, swipeHits >= 8 ? "#d6b8ff" : "#ffd23f", 22 + Math.min(swipeHits, 12));
    addScore(25 * swipeHits, x, y - 8, "#ffd23f");
    Sfx.sparkle();
    S.joy = Math.max(S.joy, 0.9);
    if (swipeHits >= 5) S.shake = Math.max(S.shake, 4);
  }

  // Each finger slices on its own, so two-thumb play works on phones.
  const pointers = new Map();
  function onDown(e) {
    Sfx.unlock();
    if (!S || S.phase !== "playing") return;
    if (!pointers.size) {
      swipeHits = 0;
      swipeBest = 0;
      multiFloat = null;
      trail.length = 0;
    }
    pointerDown = true;
    const x = e.clientX, y = e.clientY;
    pointers.set(e.pointerId, { x, y });
    trail.push({ x, y, t: performance.now(), id: e.pointerId });
    sliceSegment(x, y, x, y);
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  }
  function onMove(e) {
    lookX = e.clientX;
    lookY = e.clientY;
    const prevPt = pointers.get(e.pointerId);
    if (!prevPt || !S || S.phase !== "playing") return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    let lastPt = prevPt;
    for (const ev of evs.length ? evs : [e]) {
      const x = ev.clientX, y = ev.clientY;
      sliceSegment(lastPt.x, lastPt.y, x, y);
      lastPt = { x, y };
      trail.push({ x, y, t: performance.now(), id: e.pointerId });
    }
    pointers.set(e.pointerId, lastPt);
    if (trail.length > 80) trail.splice(0, trail.length - 80);
  }
  function onUp(e) {
    if (e && e.pointerId != null) pointers.delete(e.pointerId);
    else pointers.clear();
    pointerDown = pointers.size > 0;
  }

  cv.addEventListener("pointerdown", onDown);
  cv.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  cv.addEventListener("contextmenu", (e) => e.preventDefault());

  /* ------------------------------------------------------------------ */
  /* Simulation                                                          */
  /* ------------------------------------------------------------------ */
  function spawnPolluter() {
    const empty = [];
    S.slots.forEach((sl, i) => { if (sl.type === null) empty.push(i); });
    if (!empty.length) return;
    const i = empty[Math.floor(Math.random() * empty.length)];
    const sl = S.slots[i];
    const wCar = 0.35 * S.mods.carSpawn;
    const r = Math.random() * (0.4 + 0.25 + wCar);
    sl.next = r < 0.4 ? "coal" : r < 0.65 ? "oil" : "car";
    sl.type = "build";
    sl.t = 0;
    sl.pop = 1;
    const c = slotCenter(i, 0.3);
    burst(c.x, c.y, 6, { color: "#a8a29e", speed: 60, size: 6, life: 0.5 });
    if (!S.seen.build) {
      S.seen.build = 1;
      FX.toast("🚧", "A new fossil plant is going up!", "Tap the construction site before it finishes to deny the permit.");
    }
  }

  function emitFrom(i, kind) {
    const c = slotCenter(i, 0.9);
    const m = makeMolecule(Math.atan2(c.y - CY, c.x - CX), Math.hypot(c.x - CX, c.y - CY), kind);
    S.mols.push(m);
    burst(c.x, c.y, 4, { color: "#9ca3af", speed: 40, size: 7, life: 0.7, grow: 10 });
  }

  function emitBackground() {
    // Aviation, shipping, cement, farming… emissions that rise from all over.
    const a = Math.random() * TAU;
    const m = makeMolecule(a, R + 4, "co2");
    S.mols.push(m);
  }

  function emitMethane() {
    // Thawing permafrost bubbles up near the poles.
    const top = Math.random() < 0.5;
    const a = (top ? -Math.PI / 2 : Math.PI / 2) + (Math.random() - 0.5) * 0.9;
    const m = makeMolecule(a, R * 0.9, "ch4");
    S.mols.push(m);
    const x = CX + Math.cos(a) * R, y = CY + Math.sin(a) * R;
    burst(x, y, 6, { color: ["#ffb35c", "#ffe0b3"], speed: 70, size: 4, life: 0.6 });
    if (!S.seen.methane) {
      S.seen.methane = 1;
      FX.toast("🧊", "Permafrost is thawing!", "Arctic soils hold about twice as much carbon as the atmosphere. Thawing releases methane (CH₄) — slice it fast, it's extra potent.", { ms: 6500 });
    }
  }

  function update(dt) {
    S.t += dt;
    S.rot += dt * 0.05;

    // delayed cascades
    if (S.queue.length) {
      const now = S.t;
      const due = S.queue.filter((q) => q.at <= now);
      if (due.length) {
        S.queue = S.queue.filter((q) => q.at > now);
        due.forEach((q) => { if (S.phase === "playing" || S.phase === "over") q.fn(); });
      }
    }

    if (S.comboT > 0) { S.comboT -= dt; if (S.comboT <= 0) { S.combo = 0; comboDirty = true; } }

    S.year += dt / YEAR_SECONDS;
    const ch = chapterOf(S.year);
    if (S.year >= END_YEAR) { S.year = END_YEAR; endGame(true); return; }
    if (ch > S.chapter) {
      S.chapter = ch;
      openUpgrade();
      return;
    }

    const m = S.mods;
    const heat = clamp((S.temp - 1.2) / 0.8, 0, 1);

    // New polluters try to move in.
    S.spawnT -= dt;
    if (S.spawnT <= 0) {
      spawnPolluter();
      const rate = (TUNE.spawn + TUNE.spawnGrowth * S.chapter) * m.spawn;
      S.spawnT = (1 / rate) * (0.6 + Math.random() * 0.8);
    }

    // Background emissions
    S.bgT -= dt;
    if (S.bgT <= 0) {
      emitBackground();
      const rate = (TUNE.bg + TUNE.bgGrowth * S.chapter) * m.bg;
      S.bgT = (1 / rate) * (0.6 + Math.random() * 0.8);
    }

    // Permafrost feedback loop above 1.55 °C
    if (S.temp > 1.55) {
      S.methaneT -= dt * (S.temp - 1.5) * 4 * m.methane;
      if (S.methaneT <= 0) { emitMethane(); S.methaneT = 1.5 + Math.random() * 1.5; }
    }

    // Power-ups
    S.pupT -= dt * m.power;
    if (S.pupT <= 0) {
      spawnPowerup();
      S.pupT = 16 + Math.random() * 10;
    }

    // Rooftop solar auto-flip
    if (m.autoConvert) {
      S.autoT -= dt;
      if (S.autoT <= 0) {
        S.autoT = m.autoConvert;
        const targets = [];
        S.slots.forEach((sl, i) => { if (isPolluter(sl.type)) targets.push(i); });
        if (targets.length) convertSlot(targets[Math.floor(Math.random() * targets.length)], true);
      }
    }
    if (S.rainT > 0) S.rainT -= dt;

    // Slots
    let trees = 0;
    for (let i = 0; i < SLOTS; i++) {
      const sl = S.slots[i];
      sl.t += dt;
      if (sl.pop > 0) sl.pop = Math.max(0, sl.pop - dt * 2.2);
      if (sl.grow < 1) sl.grow = Math.min(1, sl.grow + dt * 0.7);
      if (sl.type === "build") {
        if (sl.t > TUNE.build) {
          sl.type = sl.next;
          sl.t = 0;
          sl.pop = 1;
          sl.emitT = 0.8;
          const c = slotCenter(i);
          burst(c.x, c.y, 10, { color: ["#6b7280", "#9ca3af"], speed: 90, size: 8, life: 0.7, grow: 8 });
          Sfx.bad();
          S.ouch = 0.4;
        }
      } else if (isPolluter(sl.type)) {
        sl.emitT -= dt;
        if (sl.emitT <= 0) {
          emitFrom(i, "co2");
          sl.emitT = POLLUTERS[sl.type].emit / m.emit * (0.8 + Math.random() * 0.4);
        }
        sl.smokeT -= dt;
        if (sl.smokeT <= 0 && S.parts.length < 600) {
          sl.smokeT = 0.18;
          const c = slotCenter(i, sl.type === "coal" ? 1.05 : sl.type === "car" ? 0.2 : 0.7);
          const out = slotAngle(i);
          S.parts.push({ x: c.x, y: c.y, vx: Math.cos(out) * 18 + (Math.random() - 0.5) * 8, vy: Math.sin(out) * 18 + (Math.random() - 0.5) * 8, life: 1.2, max: 1.2, size: ITEM * 0.12, color: "#8b93a5", shape: "smoke", grav: 0, drag: 0.6, rot: 0, vr: 0, grow: ITEM * 0.5 });
        }
      } else if (sl.type === "tree") {
        trees++;
        if (sl.grow >= 1) {
          sl.absorbT -= dt * m.absorb;
          if (sl.absorbT <= 0) {
            sl.absorbT = 14 + Math.random() * 4;
            treeAbsorb(i);
          }
          // Heat makes wildfires likelier — a real feedback loop.
          const p = 0.035 * heat * heat * 4 * m.fire * dt;
          if (S.rainT <= 0 && Math.random() < p) ignite(i);
        }
      } else if (sl.type === "fire") {
        sl.burnT += dt;
        sl.emitT -= dt;
        if (sl.emitT <= 0) { emitFrom(i, "co2"); sl.emitT = 1.4; }
        if (sl.burnT > 3.5 && !sl.spread) {
          sl.spread = true;
          [i - 1, i + 1].forEach((j) => {
            const n = S.slots[(j + SLOTS) % SLOTS];
            if (n.type === "tree" && S.rainT <= 0) ignite((j + SLOTS) % SLOTS);
          });
        }
        if (sl.burnT > 7) {
          sl.type = null;
          sl.burnT = 0;
          S.stats.burned++;
          emitFrom(i, "co2");
          emitFrom(i, "co2");
          const c = slotCenter(i, 0.3);
          burst(c.x, c.y, 14, { color: ["#3f3f46", "#52525b", "#78716c"], speed: 80, size: 9, life: 1, grow: 12 });
          Sfx.bad();
          S.shake = 6;
          S.ouch = 0.8;
        }
      }
    }

    // Molecules
    for (const mo of S.mols) {
      if (mo.state === "live") {
        mo.ang += mo.angV * dt;
        mo.dist += (mo.target - mo.dist) * Math.min(1, dt * 1.6);
        mo.scale = Math.min(1, mo.scale + dt * 2.5);
        mo.spin += mo.spinV * dt;
      } else if (mo.state === "absorb") {
        const tc = slotCenter(mo.tree, 0.6);
        molPos(mo);
        const dx = tc.x - mo.x, dy = tc.y - mo.y;
        const d = Math.hypot(dx, dy);
        if (d < 8 || S.slots[mo.tree].type !== "tree") {
          mo.state = "dead";
          burst(tc.x, tc.y, 8, { color: ["#3ef2a0", "#22c55e", "#b4ffdc"], speed: 90, size: 4, life: 0.6, shape: "leaf" });
          S.slots[mo.tree].pop = 0.6;
        } else {
          // move in polar space toward the tree
          const ta = Math.atan2(tc.y - CY, tc.x - CX);
          let da = ta - mo.ang;
          while (da > Math.PI) da -= TAU;
          while (da < -Math.PI) da += TAU;
          mo.ang += da * Math.min(1, dt * 3);
          mo.dist += (Math.hypot(tc.x - CX, tc.y - CY) - mo.dist) * Math.min(1, dt * 3);
          mo.scale = Math.max(0.3, mo.scale - dt * 0.6);
        }
      }
    }
    S.mols = S.mols.filter((mo) => mo.state !== "dead");

    // Power-up movement
    for (const p of S.pups) {
      p.t += dt;
      p.x += p.vx * dt;
      p.y = p.y0 + Math.sin(p.t * 2) * 26;
      if (p.t > p.life) p.dead = true;
    }
    S.pups = S.pups.filter((p) => !p.dead);

    // Temperature physics: the sky's CO₂ sets where temperature is heading.
    // Heat also piles up in the oceans the longer CO₂ lingers — delay has a lasting cost.
    const c = sky();
    S.locked += TUNE.lock * c * dt * m.inertia;
    const teq = tBase() + S.locked + TUNE.perUnit * c;
    const rate = teq > S.temp ? 0.22 * m.inertia : 0.22;
    S.temp += (teq - S.temp) * rate * dt;

    if (S.temp >= T_LIMIT) { S.temp = T_LIMIT; endGame(false); return; }

    // Alarm when close to the edge
    if (S.temp > 1.9) {
      S.alarmT -= dt;
      if (S.alarmT <= 0) { S.alarmT = 0.9; Sfx.tick(); Sfx.note(220, 0.15, 0.08, "square"); }
    }
    if (window.Music) Music.intensity = clamp(heat * 0.7 + Math.min(S.combo, 30) / 60, 0, 1);

    tickFace(dt);
  }

  function treeAbsorb(i) {
    let best = null, bd = Infinity;
    const c = slotCenter(i, 0.6);
    for (const mo of S.mols) {
      if (mo.state !== "live" || mo.scale < 1) continue;
      molPos(mo);
      const d = Math.hypot(mo.x - c.x, mo.y - c.y);
      if (d < bd) { bd = d; best = mo; }
    }
    if (best && bd < R * 1.6) {
      best.state = "absorb";
      best.tree = i;
    }
  }

  function ignite(i) {
    const sl = S.slots[i];
    if (sl.type !== "tree") return;
    sl.type = "fire";
    sl.burnT = 0;
    sl.emitT = 0.6;
    sl.spread = false;
    sl.pop = 1;
    Sfx.fire();
    S.ouch = 0.5;
    if (!S.seen.fire) {
      S.seen.fire = 1;
      FX.toast("🔥", "Wildfire!", "Heat dries out forests, and burning trees release more CO₂ — a feedback loop. Tap the fire before it spreads.", { ms: 6000 });
    }
  }

  function spawnPowerup() {
    const kinds = Object.keys(POWERUPS);
    // Weight toward what's useful right now.
    const fires = S.slots.filter((s) => s.type === "fire").length;
    const polluters = S.slots.filter((s) => isPolluter(s.type)).length;
    const empties = S.slots.filter((s) => s.type === null).length;
    const weights = { sun: 1 + polluters * 0.3, seed: 0.5 + empties * 0.2, vac: 1 + sky() * 0.05, rain: 0.2 + fires * 1.5 };
    let tot = 0;
    kinds.forEach((k) => (tot += weights[k]));
    let r = Math.random() * tot;
    let kind = kinds[0];
    for (const k of kinds) { r -= weights[k]; if (r <= 0) { kind = k; break; } }
    const fromLeft = Math.random() < 0.5;
    const y0 = lerp(H * 0.28, H * 0.8, Math.random());
    const speed = W / 8.5;
    S.pups.push({ kind, x: fromLeft ? -40 : W + 40, y: y0, y0, vx: fromLeft ? speed : -speed, t: 0, life: (W + 80) / speed, r: Math.max(24, R * 0.14), dead: false });
    if (!S.seen.pup) {
      S.seen.pup = 1;
      FX.toast("🫧", "Power-up incoming!", "Slice the floating bubble before it drifts away.");
    }
  }

  /* ------------------------------------------------------------------ */
  /* Face (the planet has feelings)                                      */
  /* ------------------------------------------------------------------ */
  function tickFace(dt) {
    S.joy = Math.max(0, S.joy - dt);
    S.ouch = Math.max(0, S.ouch - dt);
    S.blinkT -= dt;
    if (S.blinkT <= 0) { S.blink = 0.14; S.blinkT = 2.5 + Math.random() * 3.5; }
    if (S.blink > 0) S.blink -= dt;
    S.shake = Math.max(0, S.shake - dt * 30);
  }

  /* ------------------------------------------------------------------ */
  /* Rendering                                                           */
  /* ------------------------------------------------------------------ */
  function heat01() { return clamp((S.temp - 1.25) / 0.75, 0, 1); }

  function render() {
    const h = heat01();
    ctx.save();
    if (S.shake > 0 && !reduceMotion) ctx.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);

    // Space
    const bg = ctx.createRadialGradient(CX, CY, R * 0.5, CX, CY, Math.max(W, H) * 0.8);
    bg.addColorStop(0, mixColor("#16245a", "#4a1a2e", h));
    bg.addColorStop(1, mixColor("#060a1c", "#16060c", h));
    ctx.fillStyle = bg;
    ctx.fillRect(-20, -20, W + 40, H + 40);
    for (const s of stars) {
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(S.t * 1.3 + s.p);
      ctx.fillStyle = "#fff";
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;

    // Atmosphere glow
    const atm = mixColor("#7fdcff", "#ff5a2e", h);
    const ag = ctx.createRadialGradient(CX, CY, R * 0.95, CX, CY, R * 1.55);
    ag.addColorStop(0, atm.replace("rgb", "rgba").replace(")", ",0.55)"));
    ag.addColorStop(1, atm.replace("rgb", "rgba").replace(")", ",0)"));
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(CX, CY, R * 1.55, 0, TAU);
    ctx.fill();

    drawPlanet(h);
    drawFace(h);
    for (let i = 0; i < SLOTS; i++) drawSlot(i);
    for (const m of S.mols) drawMolecule(m);
    for (const p of S.pups) drawPowerup(p);
    drawParticles();
    drawFloats();
    drawTrail();
    if (S.rainT > 0) drawRain();
    ctx.restore();
  }

  function drawPlanet(h) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, TAU);
    ctx.clip();
    const og = ctx.createLinearGradient(CX - R, CY - R, CX + R, CY + R);
    og.addColorStop(0, mixColor("#3fa9ff", "#3a8ccf", h));
    og.addColorStop(1, mixColor("#1659c7", "#1b4a8a", h));
    ctx.fillStyle = og;
    ctx.fillRect(CX - R, CY - R, R * 2, R * 2);

    // continents
    const land = mixColor("#3ddc84", "#c9a646", h);
    const land2 = mixColor("#27b56a", "#a8853a", h);
    for (const c of continents) {
      const a = c.a + S.rot;
      const x = CX + Math.cos(a) * c.d * R;
      const y = CY + Math.sin(a) * c.d * R;
      ctx.fillStyle = land;
      ctx.beginPath();
      c.pts.forEach((pr, k) => {
        const pa = (k / c.pts.length) * TAU + S.rot;
        const px = x + Math.cos(pa) * pr * R, py = y + Math.sin(pa) * pr * R;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = land2;
      ctx.beginPath();
      ctx.arc(x + c.r * R * 0.2, y + c.r * R * 0.15, c.r * R * 0.45, 0, TAU);
      ctx.fill();
    }

    // polar ice shrinks as it warms
    const ice = clamp((2.05 - S.temp) / 0.8, 0.04, 1);
    ctx.fillStyle = "rgba(240,250,255,0.95)";
    ctx.beginPath();
    ctx.ellipse(CX, CY - R, R * 0.75 * ice + R * 0.1, R * 0.32 * ice + R * 0.03, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(CX, CY + R, R * 0.7 * ice + R * 0.1, R * 0.26 * ice + R * 0.03, 0, 0, TAU);
    ctx.fill();

    // heat tint + shading
    if (h > 0) {
      ctx.fillStyle = "rgba(255,70,30," + (h * 0.32).toFixed(3) + ")";
      ctx.fillRect(CX - R, CY - R, R * 2, R * 2);
    }
    const sh = ctx.createRadialGradient(CX - R * 0.4, CY - R * 0.45, R * 0.1, CX, CY, R * 1.05);
    sh.addColorStop(0, "rgba(255,255,255,0.22)");
    sh.addColorStop(0.55, "rgba(255,255,255,0)");
    sh.addColorStop(1, "rgba(0,0,30,0.38)");
    ctx.fillStyle = sh;
    ctx.fillRect(CX - R, CY - R, R * 2, R * 2);
    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, TAU);
    ctx.stroke();
  }

  function drawFace(h) {
    const mood = S.joy > 0 ? 1.2 : clamp((1.62 - S.temp) / 0.22, -1, 1);
    const ex = R * 0.3, ey = -R * 0.1, er = R * 0.12;
    // look toward the pointer
    let lx = lookX - CX, ly = lookY - CY;
    const ll = Math.hypot(lx, ly) || 1;
    const look = Math.min(1, ll / (R * 2));
    lx = (lx / ll) * er * 0.38 * look;
    ly = (ly / ll) * er * 0.38 * look;

    ctx.save();
    ctx.translate(CX, CY);
    // cheeks
    if (mood > 0.2) {
      ctx.fillStyle = "rgba(255,120,160," + (0.35 * Math.min(1, mood)).toFixed(3) + ")";
      ctx.beginPath(); ctx.ellipse(-ex * 1.35, R * 0.12, er * 0.8, er * 0.5, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(ex * 1.35, R * 0.12, er * 0.8, er * 0.5, 0, 0, TAU); ctx.fill();
    }
    // eyes
    const happyEyes = S.joy > 0.25;
    for (const sx of [-1, 1]) {
      const x = sx * ex, y = ey;
      if (happyEyes) {
        ctx.strokeStyle = "#0b1030";
        ctx.lineWidth = Math.max(3, R * 0.035);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(x, y + er * 0.3, er * 0.7, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        continue;
      }
      const squash = S.blink > 0 ? 0.12 : S.ouch > 0 ? 0.55 : 1;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(x, y, er, er * 1.15 * squash, 0, 0, TAU);
      ctx.fill();
      if (squash > 0.2) {
        ctx.fillStyle = "#0b1030";
        ctx.beginPath();
        ctx.arc(x + lx, y + ly, er * 0.55 * Math.min(1, squash + 0.3), 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x + lx - er * 0.18, y + ly - er * 0.2, er * 0.17, 0, TAU);
        ctx.fill();
      }
      // worried brows
      if (mood < 0) {
        ctx.strokeStyle = "#0b1030";
        ctx.lineWidth = Math.max(2.5, R * 0.028);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - sx * er * 0.9, y - er * 1.45 + -mood * er * 0.0);
        ctx.lineTo(x + sx * er * 0.7, y - er * 1.45 - -mood * er * 0.45);
        ctx.stroke();
      }
    }
    // mouth
    const my = R * 0.26, mw = R * 0.24;
    ctx.strokeStyle = "#0b1030";
    ctx.fillStyle = "#3a0d1e";
    ctx.lineWidth = Math.max(3, R * 0.035);
    ctx.lineCap = "round";
    if (mood > 1) {
      ctx.beginPath();
      ctx.moveTo(-mw, my - R * 0.03);
      ctx.quadraticCurveTo(0, my + R * 0.26, mw, my - R * 0.03);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ff7b9c";
      ctx.beginPath();
      ctx.ellipse(0, my + R * 0.07, mw * 0.45, R * 0.045, 0, 0, TAU);
      ctx.fill();
    } else if (S.temp > 1.85) {
      // open, panting mouth
      ctx.beginPath();
      ctx.ellipse(0, my + R * 0.03, mw * 0.45, R * (0.06 + 0.02 * Math.sin(S.t * 10)), 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-mw, my);
      ctx.quadraticCurveTo(0, my + mood * R * 0.2, mw, my);
      ctx.stroke();
    }
    // sweat drops
    if (S.temp > 1.58) {
      const n = S.temp > 1.8 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const ph = (S.t * 0.6 + k * 0.5) % 1;
        const sx = (k ? -1 : 1) * R * 0.58;
        const sy = -R * 0.35 + ph * R * 0.35;
        ctx.globalAlpha = 1 - ph;
        ctx.fillStyle = "#9fe3ff";
        ctx.beginPath();
        ctx.moveTo(sx, sy - R * 0.08);
        ctx.quadraticCurveTo(sx + R * 0.05, sy + R * 0.01, sx, sy + R * 0.03);
        ctx.quadraticCurveTo(sx - R * 0.05, sy + R * 0.01, sx, sy - R * 0.08);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    void h;
  }

  function drawSlot(i) {
    const sl = S.slots[i];
    if (!sl.type) return;
    const b = slotBase(i);
    const s = ITEM;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.a + Math.PI / 2);
    let sc = 1;
    if (sl.pop > 0) sc = 1 + Math.sin(sl.pop * Math.PI) * 0.25;
    if (isClean(sl.type) && sl.t < 0.5) sc = Math.max(0.01, easeOutBack(sl.t / 0.5));
    ctx.scale(sc, sc);
    const t = S.t + i * 0.37;
    switch (sl.type) {
      case "coal": drawCoal(s, t); break;
      case "oil": drawOil(s, t); break;
      case "car": drawCar(s, t, "#e2553f", "#a3301f"); break;
      case "build": drawBuild(s, t, sl.t / TUNE.build); break;
      case "tree": drawTree(s, t, sl.grow); break;
      case "fire": drawFire(s, t, sl.burnT / 7); break;
      case "wind": drawWind(s, t); break;
      case "solar": drawSolar(s, t); break;
      case "ev": drawCar(s, t, "#19c98a", "#0e8f61", true); break;
    }
    ctx.restore();
  }

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCoal(s, t) {
    // chimney
    ctx.fillStyle = "#b9bec9";
    ctx.fillRect(s * 0.08, -s * 1.05, s * 0.2, s * 0.7);
    ctx.fillStyle = "#e2553f";
    ctx.fillRect(s * 0.08, -s * 1.0, s * 0.2, s * 0.08);
    ctx.fillRect(s * 0.08, -s * 0.82, s * 0.2, s * 0.08);
    // building
    ctx.fillStyle = "#5b6475";
    rr(-s * 0.42, -s * 0.48, s * 0.78, s * 0.5, s * 0.05);
    ctx.fill();
    ctx.fillStyle = "#454c5b";
    ctx.beginPath();
    ctx.moveTo(-s * 0.42, -s * 0.48);
    ctx.lineTo(-s * 0.22, -s * 0.66);
    ctx.lineTo(-s * 0.22, -s * 0.48);
    ctx.lineTo(-s * 0.02, -s * 0.66);
    ctx.lineTo(-s * 0.02, -s * 0.48);
    ctx.closePath();
    ctx.fill();
    // glowing windows
    ctx.fillStyle = 0.5 + 0.5 * Math.sin(t * 6) > 0.3 ? "#ffcf5a" : "#e0a83a";
    for (let k = 0; k < 3; k++) ctx.fillRect(-s * 0.34 + k * s * 0.22, -s * 0.3, s * 0.11, s * 0.11);
    drawGrumpy(s * -0.04, -s * 0.15, s * 0.5);
  }

  function drawOil(s, t) {
    const nod = Math.sin(t * 2.6) * 0.32;
    ctx.fillStyle = "#3a3f4b";
    rr(-s * 0.45, -s * 0.08, s * 0.9, s * 0.1, s * 0.03);
    ctx.fill();
    // A-frame
    ctx.strokeStyle = "#5b6475";
    ctx.lineWidth = s * 0.08;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-s * 0.18, -s * 0.06);
    ctx.lineTo(0, -s * 0.62);
    ctx.lineTo(s * 0.18, -s * 0.06);
    ctx.stroke();
    // beam
    ctx.save();
    ctx.translate(0, -s * 0.62);
    ctx.rotate(nod);
    ctx.fillStyle = "#f59e0b";
    rr(-s * 0.48, -s * 0.06, s * 0.8, s * 0.12, s * 0.04);
    ctx.fill();
    ctx.fillStyle = "#3a3f4b";
    ctx.beginPath();
    ctx.moveTo(-s * 0.48, -s * 0.1);
    ctx.quadraticCurveTo(-s * 0.66, s * 0.04, -s * 0.5, s * 0.2);
    ctx.lineTo(-s * 0.42, s * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // well rod
    ctx.strokeStyle = "#1f2430";
    ctx.lineWidth = s * 0.035;
    ctx.beginPath();
    const hx = -s * 0.5 * Math.cos(nod), hy = -s * 0.62 - s * 0.5 * Math.sin(nod) + s * 0.18;
    ctx.moveTo(hx, hy);
    ctx.lineTo(-s * 0.42, -s * 0.06);
    ctx.stroke();
    // oil drip
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(s * 0.32, -s * 0.03, s * 0.06, 0, TAU);
    ctx.fill();
  }

  function drawCar(s, t, body, dark, ev) {
    const bob = Math.sin(t * 9) * s * 0.012;
    ctx.translate(0, bob);
    ctx.fillStyle = body;
    rr(-s * 0.42, -s * 0.36, s * 0.84, s * 0.2, s * 0.08);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.24, -s * 0.36);
    ctx.lineTo(-s * 0.14, -s * 0.54);
    ctx.lineTo(s * 0.16, -s * 0.54);
    ctx.lineTo(s * 0.28, -s * 0.36);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#cfefff";
    ctx.beginPath();
    ctx.moveTo(-s * 0.18, -s * 0.38);
    ctx.lineTo(-s * 0.11, -s * 0.5);
    ctx.lineTo(s * 0.01, -s * 0.5);
    ctx.lineTo(s * 0.01, -s * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 0.05, -s * 0.38);
    ctx.lineTo(s * 0.05, -s * 0.5);
    ctx.lineTo(s * 0.14, -s * 0.5);
    ctx.lineTo(s * 0.22, -s * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#1a1d26";
    ctx.beginPath(); ctx.arc(-s * 0.24, -s * 0.15, s * 0.1, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.24, -s * 0.15, s * 0.1, 0, TAU); ctx.fill();
    ctx.fillStyle = "#9aa3b5";
    ctx.beginPath(); ctx.arc(-s * 0.24, -s * 0.15, s * 0.04, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.24, -s * 0.15, s * 0.04, 0, TAU); ctx.fill();
    if (ev) {
      ctx.fillStyle = "#ffd23f";
      ctx.beginPath();
      ctx.moveTo(s * 0.02, -s * 0.34);
      ctx.lineTo(-s * 0.07, -s * 0.24);
      ctx.lineTo(0, -s * 0.24);
      ctx.lineTo(-s * 0.03, -s * 0.17);
      ctx.lineTo(s * 0.07, -s * 0.28);
      ctx.lineTo(0, -s * 0.28);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = dark;
      ctx.fillRect(-s * 0.5, -s * 0.22, s * 0.09, s * 0.04);
    }
  }

  function drawBuild(s, t, prog) {
    const p = clamp(prog, 0, 1);
    // ghost of what's coming
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#5b6475";
    ctx.fillRect(-s * 0.38, -s * 0.5 * p, s * 0.7, s * 0.5 * p);
    ctx.globalAlpha = 1;
    // crane
    ctx.strokeStyle = "#ffb020";
    ctx.lineWidth = s * 0.06;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(s * 0.3, 0);
    ctx.lineTo(s * 0.3, -s * 0.95);
    ctx.lineTo(-s * 0.4, -s * 0.95);
    ctx.stroke();
    const swing = Math.sin(t * 3) * s * 0.06;
    ctx.lineWidth = s * 0.02;
    ctx.beginPath();
    ctx.moveTo(-s * 0.25, -s * 0.95);
    ctx.lineTo(-s * 0.25 + swing, -s * 0.65);
    ctx.stroke();
    ctx.fillStyle = "#ffb020";
    ctx.fillRect(-s * 0.32 + swing, -s * 0.66, s * 0.14, s * 0.08);
    // cone
    ctx.fillStyle = "#ff7a1a";
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, 0);
    ctx.lineTo(-s * 0.11, -s * 0.24);
    ctx.lineTo(-s * 0.02, 0);
    ctx.closePath();
    ctx.fill();
    // progress ring + alert
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = s * 0.07;
    ctx.beginPath();
    ctx.arc(0, -s * 1.35, s * 0.22, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "#ffd23f";
    ctx.beginPath();
    ctx.arc(0, -s * 1.35, s * 0.22, -Math.PI / 2, -Math.PI / 2 + TAU * p);
    ctx.stroke();
    ctx.fillStyle = "#ffd23f";
    ctx.font = "700 " + Math.round(s * 0.3) + "px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", 0, -s * 1.35 + 1);
  }

  function drawTree(s, t, grow) {
    const g = easeOutBack(clamp(grow, 0, 1));
    ctx.scale(g, g);
    const sway = Math.sin(t * 1.6) * 0.06;
    ctx.rotate(sway);
    ctx.fillStyle = "#8b5a2b";
    rr(-s * 0.06, -s * 0.42, s * 0.12, s * 0.44, s * 0.03);
    ctx.fill();
    ctx.fillStyle = "#1fa463";
    ctx.beginPath(); ctx.arc(0, -s * 0.62, s * 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = "#2fd07b";
    ctx.beginPath(); ctx.arc(-s * 0.16, -s * 0.52, s * 0.2, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.16, -s * 0.55, s * 0.21, 0, TAU); ctx.fill();
    ctx.fillStyle = "#5af0a2";
    ctx.beginPath(); ctx.arc(-s * 0.06, -s * 0.76, s * 0.14, 0, TAU); ctx.fill();
  }

  function drawFire(s, t, burnt) {
    // charred tree
    ctx.fillStyle = "#3b2a1e";
    rr(-s * 0.06, -s * 0.42, s * 0.12, s * 0.44, s * 0.03);
    ctx.fill();
    ctx.fillStyle = mixColor("#1fa463", "#2a2420", clamp(burnt * 1.4, 0, 1));
    ctx.beginPath(); ctx.arc(0, -s * 0.6, s * 0.26 * (1 - burnt * 0.6), 0, TAU); ctx.fill();
    // flames
    const layers = [["#ff3d1f", 1], ["#ff9b1f", 0.72], ["#ffe066", 0.45]];
    layers.forEach(([c, k], j) => {
      const f = 1 + Math.sin(t * 18 + j * 2) * 0.12;
      const hgt = s * 0.95 * k * f;
      const w = s * 0.32 * k;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.25 - hgt);
      ctx.quadraticCurveTo(w * 1.3, -s * 0.35 - hgt * 0.35, w * 0.8, -s * 0.2);
      ctx.quadraticCurveTo(0, -s * 0.02, -w * 0.8, -s * 0.2);
      ctx.quadraticCurveTo(-w * 1.3, -s * 0.35 - hgt * 0.35, 0, -s * 0.25 - hgt);
      ctx.fill();
    });
  }

  function drawWind(s, t) {
    ctx.fillStyle = "#e8eef8";
    ctx.beginPath();
    ctx.moveTo(-s * 0.05, 0);
    ctx.lineTo(-s * 0.025, -s * 1.1);
    ctx.lineTo(s * 0.025, -s * 1.1);
    ctx.lineTo(s * 0.05, 0);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.translate(0, -s * 1.1);
    ctx.rotate(t * 3.2);
    ctx.fillStyle = "#ffffff";
    for (let k = 0; k < 3; k++) {
      ctx.rotate(TAU / 3);
      ctx.beginPath();
      ctx.moveTo(-s * 0.03, 0);
      ctx.quadraticCurveTo(-s * 0.07, -s * 0.3, 0, -s * 0.55);
      ctx.quadraticCurveTo(s * 0.04, -s * 0.3, s * 0.03, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#3ef2a0";
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.06, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawSolar(s, t) {
    ctx.fillStyle = "#9aa3b5";
    ctx.fillRect(-s * 0.03, -s * 0.36, s * 0.06, s * 0.36);
    ctx.save();
    ctx.translate(0, -s * 0.4);
    ctx.rotate(-0.25);
    ctx.fillStyle = "#1d4ed8";
    rr(-s * 0.42, -s * 0.16, s * 0.84, s * 0.32, s * 0.03);
    ctx.fill();
    ctx.strokeStyle = "#7fb0ff";
    ctx.lineWidth = Math.max(1, s * 0.015);
    ctx.beginPath();
    for (let k = 1; k < 4; k++) { ctx.moveTo(-s * 0.42 + k * s * 0.21, -s * 0.16); ctx.lineTo(-s * 0.42 + k * s * 0.21, s * 0.16); }
    ctx.moveTo(-s * 0.42, 0); ctx.lineTo(s * 0.42, 0);
    ctx.stroke();
    // glint sweeping across
    const gx = ((t * 0.5) % 1.6 - 0.3) * s;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath();
    ctx.moveTo(gx - s * 0.42, -s * 0.16);
    ctx.lineTo(gx - s * 0.3, -s * 0.16);
    ctx.lineTo(gx - s * 0.42, s * 0.16);
    ctx.lineTo(gx - s * 0.54, s * 0.16);
    ctx.closePath();
    ctx.save();
    rr(-s * 0.42, -s * 0.16, s * 0.84, s * 0.32, s * 0.03);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(gx - s * 0.42, -s * 0.16);
    ctx.lineTo(gx - s * 0.3, -s * 0.16);
    ctx.lineTo(gx - s * 0.42, s * 0.16);
    ctx.lineTo(gx - s * 0.54, s * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();
    // little sun sparkle
    const tw = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.fillStyle = "rgba(255,230,120," + tw.toFixed(2) + ")";
    ctx.beginPath();
    ctx.arc(s * 0.36, -s * 0.72, s * 0.05, 0, TAU);
    ctx.fill();
  }

  function drawGrumpy(x, y, s) {
    ctx.strokeStyle = "rgba(20,22,30,0.9)";
    ctx.lineWidth = Math.max(1.5, s * 0.06);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - s * 0.22, y - s * 0.08); ctx.lineTo(x - s * 0.08, y - s * 0.02);
    ctx.moveTo(x + s * 0.22, y - s * 0.08); ctx.lineTo(x + s * 0.08, y - s * 0.02);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y + s * 0.2, s * 0.1, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }

  function drawMolecule(m) {
    molPos(m);
    const r = MOL_R * m.scale;
    ctx.save();
    ctx.translate(m.x, m.y);
    // warm halo: these trap heat
    ctx.fillStyle = m.kind === "ch4" ? "rgba(255,160,60,0.18)" : "rgba(255,90,60,0.12)";
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.4, 0, TAU);
    ctx.fill();
    ctx.rotate(m.spin);
    if (m.kind === "co2") {
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = Math.max(1.5, r * 0.22);
      ctx.beginPath();
      ctx.moveTo(-r * 1.45, 0);
      ctx.lineTo(r * 1.45, 0);
      ctx.stroke();
      ctx.fillStyle = "#ff5a5a";
      ctx.beginPath(); ctx.arc(-r * 1.45, 0, r * 0.75, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 1.45, 0, r * 0.75, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath(); ctx.arc(-r * 1.6, -r * 0.25, r * 0.22, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 1.3, -r * 0.25, r * 0.22, 0, TAU); ctx.fill();
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = Math.max(1.5, r * 0.2);
      for (let k = 0; k < 4; k++) {
        const a = k * (TAU / 4) + Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * r * 1.4, Math.sin(a) * r * 1.4);
        ctx.stroke();
        ctx.fillStyle = "#f4f4f5";
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 1.4, Math.sin(a) * r * 1.4, r * 0.5, 0, TAU);
        ctx.fill();
      }
    }
    ctx.fillStyle = m.kind === "ch4" ? "#7c5a3a" : "#3b4252";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.rotate(-m.spin);
    // grumpy face
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.1, r * 0.2, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.1, r * 0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath(); ctx.arc(-r * 0.32, -r * 0.05, r * 0.1, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.32, -r * 0.05, r * 0.1, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = Math.max(1, r * 0.12);
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -r * 0.45); ctx.lineTo(-r * 0.15, -r * 0.3);
    ctx.moveTo(r * 0.55, -r * 0.45); ctx.lineTo(r * 0.15, -r * 0.3);
    ctx.stroke();
    ctx.restore();
  }

  function drawPowerup(p) {
    const def = POWERUPS[p.kind];
    const pulse = 1 + Math.sin(p.t * 6) * 0.06;
    const r = p.r * pulse;
    ctx.save();
    ctx.translate(p.x, p.y);
    const g = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.8);
    g.addColorStop(0, def.color + "88");
    g.addColorStop(1, def.color + "00");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.ellipse(-r * 0.4, -r * 0.45, r * 0.22, r * 0.12, -0.6, 0, TAU);
    ctx.fill();
    ctx.font = Math.round(r * 1.05) + "px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(def.icon, 0, r * 0.06);
    ctx.restore();
  }

  function drawParticles() {
    const dt = frameDt;
    for (let i = S.parts.length - 1; i >= 0; i--) {
      const p = S.parts[i];
      p.life -= dt;
      if (p.life <= 0) { S.parts.splice(i, 1); continue; }
      p.vx -= p.vx * p.drag * dt;
      p.vy -= p.vy * p.drag * dt;
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.size += p.grow * dt;
      const a = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = p.shape === "smoke" ? a * 0.45 : a;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      switch (p.shape) {
        case "ring":
          ctx.lineWidth = 4 * a;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1.4 - a * 0.9), 0, TAU);
          ctx.stroke();
          break;
        case "star":
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          star(p.size * 1.3);
          ctx.restore();
          break;
        case "leaf":
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.3, p.size * 0.6, 0, 0, TAU);
          ctx.fill();
          ctx.restore();
          break;
        case "square":
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
          break;
        case "drop":
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size * 0.6, p.size, Math.atan2(p.vy, p.vx) + Math.PI / 2, 0, TAU);
          ctx.fill();
          break;
        default:
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, TAU);
          ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function star(r) {
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const rad = k % 2 ? r * 0.45 : r;
      const a = (k / 10) * TAU - Math.PI / 2;
      if (k) ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); else ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawFloats() {
    const dt = frameDt;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = S.floats.length - 1; i >= 0; i--) {
      const f = S.floats[i];
      f.life -= dt;
      if (f.life <= 0) { S.floats.splice(i, 1); continue; }
      f.y -= 40 * dt;
      const k = 1 - f.life / f.max;
      const sc = k < 0.15 ? easeOutBack(k / 0.15) : 1;
      ctx.globalAlpha = clamp(f.life / 0.4, 0, 1);
      ctx.font = "700 " + Math.round(f.size * sc) + "px Fredoka, sans-serif";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(5,8,24,0.7)";
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawTrail() {
    const now = performance.now();
    while (trail.length && now - trail[0].t > 160) trail.shift();
    if (trail.length < 2) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1], b = trail[i];
        if (a.id !== b.id) continue;
        const k = i / trail.length;
        ctx.strokeStyle = pass === 0 ? "rgba(62,242,160," + (0.35 * k).toFixed(3) + ")" : "rgba(235,255,248," + (0.95 * k).toFixed(3) + ")";
        ctx.lineWidth = pass === 0 ? 14 * k + 2 : 5 * k + 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  function drawRain() {
    ctx.strokeStyle = "rgba(160,220,255,0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let k = 0; k < 40; k++) {
      const x = ((k * 97.3 + S.t * 30) % W);
      const y = ((k * 53.1 + S.t * 600) % H);
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y + 14);
    }
    ctx.stroke();
  }

  /* ------------------------------------------------------------------ */
  /* HUD + screens                                                       */
  /* ------------------------------------------------------------------ */
  let scoreDirty = true, comboDirty = true;
  let lastHud = {};
  function updateHud() {
    const year = Math.floor(S.year);
    if (lastHud.year !== year) { $("hud-year").textContent = year; lastHud.year = year; }
    const prog = ((S.year - START_YEAR) / (END_YEAR - START_YEAR)) * 100;
    $("hud-progress").style.width = prog.toFixed(2) + "%";
    const chap = S.chapter;
    if (lastHud.chap !== chap) {
      const el = $("hud-chapter");
      el.textContent = "Chapter " + (chap + 1);
      const nm = document.createElement("span");
      nm.className = "chapter-name";
      nm.textContent = " · " + CHAPTERS[chap].name;
      el.appendChild(nm);
      lastHud.chap = chap;
    }
    const temp = "+" + S.temp.toFixed(2);
    if (lastHud.temp !== temp) { $("hud-temp").textContent = temp; lastHud.temp = temp; }
    const frac = clamp((S.temp - 1.0) / 1.1, 0, 1);
    $("thermo-fill").style.height = (frac * 100).toFixed(1) + "%";
    $("thermo").classList.toggle("danger", S.temp > 1.85);
    const ppm = Math.round(427 + (sky() - START_MOLECULES) * 3.2);
    if (lastHud.ppm !== ppm) { $("hud-ppm").textContent = ppm; lastHud.ppm = ppm; }
    $("vignette").style.opacity = clamp((S.temp - 1.8) / 0.2, 0, 1) * (0.6 + 0.4 * Math.sin(S.t * 6));
    if (scoreDirty) {
      const el = $("hud-score");
      el.textContent = S.score.toLocaleString();
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
      scoreDirty = false;
    }
    const combo = S.combo >= 3 ? S.combo : 0;
    if (lastHud.combo !== combo || comboDirty) {
      const c = $("hud-combo");
      c.textContent = "×" + multiplier().toFixed(1).replace(".0", "") + "  ·  " + S.combo + " combo";
      c.classList.toggle("on", combo > 0);
      c.classList.toggle("hot", S.combo >= 20);
      lastHud.combo = combo;
      comboDirty = false;
    }
  }

  function showHud(on) {
    ["hud", "score-box", "thermo"].forEach((id) => $(id).classList.toggle("hidden", !on));
  }
  function screen(id) {
    ["screen-title", "screen-upgrade", "screen-pause", "screen-over"].forEach((s) => $(s).classList.toggle("show", s === id));
  }

  let bannerTimer = 0;
  function banner(title, sub) {
    const b = $("banner");
    b.textContent = title;
    if (sub) {
      const sm = document.createElement("small");
      sm.textContent = sub;
      b.appendChild(sm);
    }
    b.classList.remove("show");
    void b.offsetWidth;
    b.classList.add("show");
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => b.classList.remove("show"), 2700);
  }

  function startGame() {
    Sfx.unlock();
    endTimers.forEach(clearTimeout);
    endTimers = [];
    S = newState("playing");
    document.body.classList.remove("toasts-top");
    lastHud = {};
    scoreDirty = true;
    comboDirty = true;
    showHud(true);
    screen(null);
    Sfx.fanfare();
    banner("Chapter 1 · " + CHAPTERS[0].name, CHAPTERS[0].fact);
    if (window.Music) Music.start();
    FX.visit("play");
  }

  function openUpgrade() {
    S.phase = "upgrade";
    pointers.clear();
    pointerDown = false;
    Sfx.fanfare();
    const year = START_YEAR + S.chapter * 5;
    $("up-kicker").textContent = year + " · Policy window open";
    const pool = shuffle(CARDS.filter((c) => !S.taken.includes(c.id))).slice(0, 3);
    const host = $("cards");
    host.textContent = "";
    pool.forEach((c) => {
      const el = document.createElement("button");
      el.className = "card";
      el.type = "button";
      const ico = document.createElement("div"); ico.className = "c-ico"; ico.textContent = c.icon;
      const nm = document.createElement("div"); nm.className = "c-name"; nm.textContent = c.name;
      const ef = document.createElement("div"); ef.className = "c-effect"; ef.textContent = c.effect;
      const fa = document.createElement("div"); fa.className = "c-fact"; fa.textContent = c.fact;
      const sr = document.createElement("div"); sr.className = "c-src"; sr.textContent = "Source: " + c.src;
      el.append(ico, nm, ef, fa, sr);
      el.addEventListener("click", () => pickCard(c, el));
      el.addEventListener("mouseenter", () => Sfx.tick());
      host.appendChild(el);
    });
    FX.clearToasts();
    screen("screen-upgrade");
  }

  function pickCard(c, el) {
    if (S.phase !== "upgrade") return;
    S.phase = "picking";
    S.taken.push(c.id);
    el.classList.add("picked");
    Array.from($("cards").children).forEach((o) => { if (o !== el) o.classList.add("gone"); });
    Sfx.powerup();
    const r = el.getBoundingClientRect();
    FX.confetti({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 90 });
    setTimeout(() => {
      screen(null);
      S.phase = "playing";
      c.apply(S.mods, game);
      const ch = CHAPTERS[S.chapter];
      banner("Chapter " + (S.chapter + 1) + " · " + ch.name, ch.fact);
      FX.toast(c.icon, c.name + " activated", c.effect);
    }, 650);
  }

  function pause() {
    if (!S || S.phase !== "playing") return;
    S.phase = "paused";
    const host = $("pause-upgrades");
    host.textContent = "";
    S.taken.forEach((id) => {
      const c = CARDS.find((x) => x.id === id);
      const sp = document.createElement("span");
      sp.textContent = c.icon + " " + c.name;
      host.appendChild(sp);
    });
    screen("screen-pause");
    if (window.Music) Music.stop();
  }
  function resume() {
    if (!S || S.phase !== "paused") return;
    S.phase = "playing";
    screen(null);
    if (window.Music) Music.start();
  }

  // Results-screen celebrations; cancelled if a new game starts first.
  let endTimers = [];
  function endLater(fn, ms) { endTimers.push(setTimeout(fn, ms)); }

  function endGame(won) {
    if (S.phase === "over") return;
    S.phase = "over";
    pointers.clear();
    pointerDown = false;
    S.queue.length = 0; // nothing may change the score after the results are drawn
    if (window.Music) Music.stop();
    const temp = S.temp;
    const stars = !won ? 0 : temp <= 1.5 ? 3 : temp <= 1.7 ? 2 : 1;
    $("over-kicker").textContent = won ? "2050 · Mission complete" : Math.floor(S.year) + " · Tipping point";
    $("over-title").textContent = won ? (stars === 3 ? "Paris Hero! 🏆" : stars === 2 ? "So close! 🌍" : "You made it to 2050!") : "Tipping point! 🔥";
    $("over-temp").textContent = "+" + temp.toFixed(2);
    $("over-temp").parentElement.style.color = temp <= 1.5 ? "var(--mint)" : temp <= 1.7 ? "var(--sun)" : "var(--coral)";
    const msg = won
      ? stars === 3
        ? "You held warming at or below 1.5 °C — the Paris Agreement's most ambitious goal. That's exactly the future scientists say is still possible if we move fast."
        : stars === 2
          ? "You kept the planet well below 2 °C. Every tenth of a degree you shaved off means fewer heatwaves, healthier reefs and more ice. Can you hit 1.5?"
          : "The planet made it — but with a fever. Try flipping polluters faster and denying more permits."
      : "The planet hit +2.0 °C in " + Math.floor(S.year) + ". You were " + Math.ceil(END_YEAR - S.year) + " years from 2050. Every 0.1 °C we avoid matters — try again!";
    $("over-msg").textContent = msg;
    const st = S.stats;
    const statHost = $("over-stats");
    statHost.textContent = "";
    [
      [S.score.toLocaleString(), "Cool points"],
      [st.sliced, "CO₂ sliced"],
      [st.flipped, "Polluters flipped"],
      [st.denied, "Permits denied"],
      [st.fires, "Fires put out"],
      [S.bestCombo + "×", "Best combo"],
    ].forEach(([v, l]) => {
      const d = document.createElement("div");
      d.className = "stat";
      const b = document.createElement("b"); b.textContent = v;
      const sp = document.createElement("span"); sp.textContent = l;
      d.append(b, sp);
      statHost.appendChild(d);
    });
    const starEls = $("stars").children;
    Array.from(starEls).forEach((s) => s.classList.remove("on"));
    $("stars").style.display = won ? "flex" : "none";
    FX.clearToasts();
    document.body.classList.add("toasts-top");
    screen("screen-over");
    showHud(false);

    // Persist best
    const best = FX.getStore("coolit.best", null) || { score: 0, temp: null };
    let newBest = false;
    if (S.score > best.score) { best.score = S.score; newBest = true; }
    if (won && (best.temp == null || temp < best.temp)) best.temp = temp;
    FX.setStore("coolit.best", best);

    if (won) {
      FX.award("survivor");
      if (temp <= 1.5) FX.award("paris");
      if (temp < T_START) FX.award("net_negative");
      for (let k = 0; k < stars; k++) {
        endLater(() => {
          starEls[k].classList.add("on");
          Sfx.note(Sfx.pentaFreq(5 + k * 2, 392), 0.4, 0.2, "triangle");
          FX.buzz(20);
        }, 500 + k * 380);
      }
      endLater(() => {
        if (stars >= 2) FX.confetti({ count: stars === 3 ? 220 : 120, power: 1.2 });
        if (stars === 3) endLater(() => FX.confetti({ count: 80, emoji: "🌍" }), 300);
        Sfx.fanfare();
      }, 500 + stars * 380);
    } else {
      Sfx.lose();
      S.shake = 14;
    }
    if (newBest) endLater(() => FX.toast("🏅", "New personal best!", S.score.toLocaleString() + " cool points"), 1600);
  }

  function shareScore() {
    const won = S.year >= END_YEAR;
    const text = won
      ? "I kept the planet at +" + S.temp.toFixed(2) + " °C until 2050 in COOL IT! Planet Patrol 🌍❄️ (" + S.score.toLocaleString() + " pts). Can you beat 1.5 °C?"
      : "The planet hit a tipping point in " + Math.floor(S.year) + " on my watch in COOL IT! Planet Patrol 🔥 Can you make it to 2050 under 1.5 °C?";
    const url = location.href.split("#")[0];
    if (navigator.share) {
      navigator.share({ title: "COOL IT! Planet Patrol", text, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text + " " + url).then(
        () => FX.toast("📋", "Copied to clipboard!", "Paste it anywhere to challenge a friend."),
        () => FX.toast("📋", "Couldn't copy", text)
      );
    } else {
      FX.toast("📋", "Share this:", text);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Wiring                                                              */
  /* ------------------------------------------------------------------ */
  function syncMute() { $("btn-mute").textContent = Sfx.muted ? "🔇" : "🔊"; }
  $("btn-mute").addEventListener("click", () => { Sfx.unlock(); Sfx.toggleMute(); syncMute(); });
  $("btn-pause").addEventListener("click", () => { Sfx.click(); pause(); });
  $("btn-resume").addEventListener("click", () => { Sfx.click(); resume(); });
  $("btn-start").addEventListener("click", (e) => { e.currentTarget.blur(); startGame(); });
  $("btn-again").addEventListener("click", (e) => { e.currentTarget.blur(); startGame(); });
  $("btn-share").addEventListener("click", () => shareScore());
  window.addEventListener("keydown", (e) => {
    if (e.key === "p" || e.key === "P" || e.key === "Escape") { if (S.phase === "playing") pause(); else if (S.phase === "paused") resume(); }
    if (e.key === "m" || e.key === "M") { Sfx.toggleMute(); syncMute(); }
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
  window.addEventListener("resize", resize);
  syncMute();

  const best = FX.getStore("coolit.best", null);
  if (best && best.score) {
    $("best-line").textContent = "Your best: " + best.score.toLocaleString() + " pts" + (best.temp != null ? " · coolest 2050: +" + best.temp.toFixed(2) + " °C" : "");
  }

  // Exposed for the sim tests and curious people in the console.
  const game = {
    get state() { return S; },
    plantAll: () => plantAll(),
    clearMethane: () => clearMethane(),
    start: startGame,
    sliceSegment: (a, b, c, d) => sliceSegment(a, b, c, d),
    slotCenter: (i, l) => slotCenter(i, l),
    molPos: (m) => { molPos(m); return m; },
    update: (dt) => update(dt),
    CARDS,
    TUNE,
    pick: (i) => { const el = $("cards").children[i]; if (el) el.click(); },
  };
  window.__game = game;

  /* ------------------------------------------------------------------ */
  /* Main loop                                                           */
  /* ------------------------------------------------------------------ */
  let frameDt = 0.016;
  let prev = performance.now();
  resize();
  S = newState("title");

  function frame(now) {
    frameDt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    if (S.phase === "playing") {
      update(frameDt);
      if (S.phase === "playing" || S.phase === "upgrade") updateHud();
    } else if (S.phase === "title") {
      S.t += frameDt;
      S.rot += frameDt * 0.05;
      for (const m of S.mols) { m.ang += m.angV * frameDt; m.spin += m.spinV * frameDt; }
      tickFace(frameDt);
      if (Math.random() < frameDt * 0.25) S.joy = 0.6;
    } else {
      // paused / upgrade / over: keep the world breathing a little
      S.t += frameDt * 0.25;
      tickFace(frameDt);
      if (S.phase === "picking") {
        if (S.queue.length) {
          const due = S.queue.filter((q) => q.at <= S.t);
          S.queue = S.queue.filter((q) => q.at > S.t);
          due.forEach((q) => q.fn());
        }
      }
    }
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
