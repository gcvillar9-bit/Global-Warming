/* COOL IT! — Cool Moves */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const D = window.CLIMATE_DATA;

  // t = tonnes CO₂e saved per person per year (Wynes & Nicholas 2017, developed countries)
  const BIG = [
    { id: "carfree", i: "🚲", n: "Live car-free", d: "Walk, bike, bus, train. The single biggest everyday move for most people in rich countries.", t: 2.4, ex: "ev" },
    { id: "flight", i: "✈️", n: "Skip one long-haul return flight", d: "One transatlantic round trip a year you don't take. Trains and video calls are your friends.", t: 1.6 },
    { id: "green", i: "⚡", n: "Switch to renewable electricity", d: "Choose a green tariff, join community solar, or put panels on your roof.", t: 1.5 },
    { id: "ev", i: "🔌", n: "Swap a petrol car for an electric one", d: "If you need a car, make the next one electric — it gets cleaner every year as grids do.", t: 1.15, ex: "carfree" },
    { id: "plant", i: "🥦", n: "Eat a plant-based diet", d: "Or start with a few plant-based days a week — beef and lamb are the heaviest foods by far.", t: 0.8 },
    { id: "cold", i: "🧺", n: "Wash clothes in cold water", d: "Modern detergents work great cold. Most of a washing machine's energy goes into heating water.", t: 0.25 },
    { id: "recycle", i: "♻️", n: "Recycle properly", d: "Clean, sorted recycling saves the energy of making new materials.", t: 0.21 },
    { id: "hang", i: "👕", n: "Hang-dry your laundry", d: "The sun and the breeze are free, silent, and zero-carbon.", t: 0.21 },
    { id: "led", i: "💡", n: "Switch to LED bulbs", d: "At least 75% less energy than incandescents, and they last for years.", t: 0.1 },
  ];
  const RIPPLE = [
    { id: "talk", i: "🗣️", n: "Talk about it", d: "About two-thirds of Americans rarely or never discuss global warming with friends and family (Yale Climate Opinion). Conversations shift what people think is normal.", tag: "Super-spreader of good" },
    { id: "vote", i: "🗳️", n: "Vote with climate in mind", d: "Laws and policies move the big numbers: power grids, buildings, transport. Every election is a climate election.", tag: "System change" },
    { id: "rep", i: "✉️", n: "Contact your representatives", d: "A short, personal message or call about a climate bill gets noticed far more than you'd think.", tag: "System change" },
    { id: "money", i: "🏦", n: "Move your money", d: "Choose a bank or pension that doesn't finance new fossil fuel expansion. Your savings are a vote too.", tag: "Money talks" },
    { id: "waste", i: "🍎", n: "Cut food waste", d: "Food loss and waste cause roughly 8–10% of global greenhouse emissions (UNEP). Plan meals, love leftovers.", tag: "Easy win" },
    { id: "heatpump", i: "♨️", n: "When the boiler dies, get a heat pump", d: "Heat pumps are typically 3–5× more efficient than gas boilers (IEA). Plan ahead so you're ready.", tag: "Big, varies by home" },
    { id: "nature", i: "🌳", n: "Protect local nature", d: "Join a tree-planting day, defend a local wetland or forest, or support groups that protect them.", tag: "Carbon + biodiversity" },
    { id: "share", i: "📣", n: "Share COOL IT! with a friend", d: "Let someone else slice some CO₂ and bust a few myths. Good things spread.", tag: "Ripple effect" },
  ];
  const MAX_T = BIG.filter((m) => m.id !== "ev").reduce((a, m) => a + m.t, 0);

  const STORE = "coolit.moves";
  const picked = new Set(FX.getStore(STORE, []));
  let shownT = 0, tween = 0, checks = 0;

  function build(list, host, ripple) {
    list.forEach((m) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "move" + (ripple ? " ripple" : "");
      el.dataset.id = m.id;
      el.setAttribute("aria-pressed", "false");
      const ic = document.createElement("div"); ic.className = "mv-ico"; ic.textContent = m.i;
      const body = document.createElement("div"); body.className = "mv-body";
      const b = document.createElement("b"); b.textContent = m.n;
      const d = document.createElement("div"); d.className = "mv-desc"; d.textContent = m.d;
      const t = document.createElement("span"); t.className = "mv-t"; t.textContent = ripple ? m.tag : "−" + m.t + " t / year";
      body.append(b, d, t);
      const ck = document.createElement("div"); ck.className = "check"; ck.textContent = "✓";
      el.append(ic, body, ck);
      el.addEventListener("click", () => toggle(m, el));
      host.appendChild(el);
    });
  }

  function toggle(m, el) {
    Sfx.unlock();
    const on = !picked.has(m.id);
    if (on) {
      picked.add(m.id);
      checks++;
      Sfx.pop(Math.min(picked.size + 3, 18));
      FX.buzz(12);
      const r = el.getBoundingClientRect();
      FX.confetti({ x: r.right - 30, y: r.top + 24, count: 26, power: 0.7, colors: m.t ? ["#3ef2a0", "#7fdcff", "#ffffff"] : ["#ff8fb1", "#ffd23f", "#ffffff"] });
      if (m.ex && picked.has(m.ex)) {
        picked.delete(m.ex);
        FX.toast("🔁", "Swapped!", m.id === "carfree" ? "Car-free beats an EV — no car needed at all." : "Switched from car-free to an EV.");
      }
    } else {
      picked.delete(m.id);
      Sfx.tick();
    }
    el.classList.remove("pulse"); void el.offsetWidth; el.classList.add("pulse");
    FX.setStore(STORE, Array.from(picked));
    sync();
    if ($("card-out").classList.contains("show")) refreshCard();
  }

  function total() {
    return BIG.reduce((a, m) => a + (picked.has(m.id) ? m.t : 0), 0);
  }

  let lastTier = "";
  function sync() {
    document.querySelectorAll(".move").forEach((el) => {
      const on = picked.has(el.dataset.id);
      el.classList.toggle("on", on);
      el.setAttribute("aria-pressed", String(on));
    });
    const t = total();
    const ripples = RIPPLE.filter((m) => picked.has(m.id)).length;
    $("ripples").textContent = ripples;
    $("bar").style.width = Math.min(100, (t / MAX_T) * 100).toFixed(1) + "%";
    const tier = t === 0 && !ripples ? "Pick your first move 👇"
      : t >= 5 ? "🧊 Absolute legend. The planet owes you one."
      : t >= 3 ? "🌪️ A climate tornado (the nice kind)"
      : t >= 1 ? "🌀 A gust of good"
      : t > 0 ? "🌬️ A cool breeze — keep going!"
      : "🌊 Making waves — now add a heavy hitter!";
    const tierEl = $("tier");
    if (tier !== lastTier) {
      if (lastTier && checks) { Sfx.sparkle(); }
      tierEl.textContent = tier;
      lastTier = tier;
    }
    animateTo(t);
  }

  function animateTo(target) {
    cancelAnimationFrame(tween);
    const from = shownT, start = performance.now();
    const el = $("tonnes");
    const num = el.parentElement;
    num.classList.remove("bump"); void num.offsetWidth; num.classList.add("bump");
    (function step(now) {
      const k = Math.min(1, (now - start) / 500);
      const e = 1 - Math.pow(1 - k, 3);
      shownT = from + (target - from) * e;
      el.textContent = shownT.toFixed(2);
      if (k < 1) tween = requestAnimationFrame(step);
    })(start);
  }

  /* ---------- Pledge card ---------- */
  function drawCard() {
    const cv = $("pcard");
    const c = cv.getContext("2d");
    const W = cv.width, H = cv.height;
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#0e1535");
    g.addColorStop(1, "#06261f");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    // real warming stripes band
    if (D) {
      const n = D.temps.length, sw = W / n;
      D.temps.forEach((r, i) => { c.fillStyle = D.color(r[1]); c.fillRect(Math.floor(i * sw), 0, Math.ceil(sw) + 1, 120); });
      c.fillStyle = "rgba(255,255,255,0.8)";
      c.font = "500 22px Inter, sans-serif";
      c.textAlign = "right";
      c.fillText("Global temperature 1880–2025 (NASA)", W - 30, 152);
    }
    // little happy planet
    const px = W - 170, py = 300, pr = 95;
    const pg = c.createLinearGradient(px - pr, py - pr, px + pr, py + pr);
    pg.addColorStop(0, "#3fa9ff"); pg.addColorStop(1, "#1659c7");
    c.fillStyle = pg; c.beginPath(); c.arc(px, py, pr, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#2fd07b";
    [[-40, -30, 32], [35, 35, 38], [45, -45, 20]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(px + dx, py + dy, r, 0, Math.PI * 2); c.fill(); });
    c.fillStyle = "#fff";
    c.beginPath(); c.ellipse(px - 30, py - 12, 15, 17, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(px + 30, py - 12, 15, 17, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#0b1030";
    c.beginPath(); c.arc(px - 28, py - 9, 8, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(px + 32, py - 9, 8, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#0b1030"; c.lineWidth = 7; c.lineCap = "round";
    c.beginPath(); c.arc(px, py + 18, 26, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.fillStyle = "rgba(255,120,160,0.45)";
    c.beginPath(); c.ellipse(px - 55, py + 18, 14, 9, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(px + 55, py + 18, 14, 9, 0, 0, Math.PI * 2); c.fill();

    c.textAlign = "left";
    c.fillStyle = "#3ef2a0";
    c.font = "700 34px Fredoka, sans-serif";
    c.fillText("COOL IT!", 70, 230);
    const name = $("pname").value.trim();
    c.fillStyle = "#ffffff";
    c.font = "700 76px Fredoka, sans-serif";
    const title = name ? name + "'s" : "My";
    c.fillText(fit(c, title, 700), 70, 320);
    c.fillText("Cool Moves", 70, 400);

    const t = total();
    c.fillStyle = "#3ef2a0";
    c.font = "700 64px Fredoka, sans-serif";
    c.fillText("−" + t.toFixed(1) + " t CO₂e / year", 70, 510);

    const items = BIG.concat(RIPPLE).filter((m) => picked.has(m.id));
    c.font = "500 36px Inter, sans-serif";
    let y = 600;
    const maxRows = 11;
    items.slice(0, maxRows).forEach((m) => {
      c.fillStyle = "#e8eeff";
      c.fillText(m.i + "  " + fit(c, m.n, 860), 70, y);
      y += 58;
    });
    if (items.length > maxRows) {
      c.fillStyle = "#9aa8d6";
      c.fillText("+ " + (items.length - maxRows) + " more", 70, y);
      y += 58;
    }
    if (!items.length) {
      c.fillStyle = "#9aa8d6";
      c.fillText("(Pick some moves above — then make your card!)", 70, y);
    }
    c.fillStyle = "rgba(255,255,255,0.12)";
    c.fillRect(70, H - 150, W - 140, 2);
    c.fillStyle = "#c8d3ff";
    c.font = "500 30px Inter, sans-serif";
    c.fillText("Every tenth of a degree matters. 🌍", 70, H - 90);
  }
  function fit(c, text, max) {
    let s = text;
    while (c.measureText(s).width > max && s.length > 4) s = s.slice(0, -2);
    return s === text ? s : s.trim() + "…";
  }

  function refreshCard() {
    drawCard();
    const url = $("pcard").toDataURL("image/png");
    $("btn-dl").href = url;
    $("pcard-img").src = url;
  }
  $("pname").addEventListener("input", () => { if ($("card-out").classList.contains("show")) refreshCard(); });

  $("btn-make").addEventListener("click", () => {
    Sfx.unlock();
    refreshCard();
    const out = $("card-out");
    out.classList.add("show");
    Sfx.fanfare();
    FX.confetti({ count: 140, power: 1.1 });
    if (picked.size) FX.award("pledge");
    setTimeout(() => out.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  });
  $("pname").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btn-make").click(); });
  $("btn-share").addEventListener("click", () => {
    const cv = $("pcard");
    const text = "My Cool Moves: −" + total().toFixed(1) + " t CO₂e a year. What are yours? 🌍";
    cv.toBlob((blob) => {
      const file = blob && new File([blob], "my-cool-moves.png", { type: "image/png" });
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], text, title: "COOL IT! Cool Moves" }).catch(() => {});
      } else if (navigator.share) {
        navigator.share({ text, title: "COOL IT! Cool Moves" }).catch(() => FX.toast("💾", "Save the card to share it", "Press and hold (or right-click) the card to save the image."));
      } else {
        FX.toast("💾", "Save the card to share it", "Press and hold (or right-click) the card to save the image.");
      }
    });
  });

  const muteBtn = $("btn-mute");
  const syncMute = () => { muteBtn.textContent = Sfx.muted ? "🔇" : "🔊"; };
  muteBtn.addEventListener("click", () => { Sfx.unlock(); Sfx.toggleMute(); syncMute(); });
  syncMute();

  build(BIG, $("list-big"), false);
  build(RIPPLE, $("list-ripple"), true);
  sync();
  FX.visit("act");
})();
