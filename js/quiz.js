/* COOL IT! — Fact or Myth? */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // a: true = fact, false = myth
  const QUESTIONS = [
    { i: "📈", q: "The 10 warmest years on record all happened in the last decade (2015–2024).", a: true,
      why: "Every year from 2015 to 2024 is in the top 10 — and 2025 joined them too. 2024 was the warmest year ever measured.",
      src: "WMO State of the Global Climate 2024; NASA GISTEMP" },
    { i: "🌡️", q: "2024 was the first calendar year more than 1.5 °C warmer than pre-industrial times.", a: true,
      why: "WMO estimates 2024 at about 1.55 °C above 1850–1900. One year doesn't break the Paris goal (that's about 20-year averages) — but it's a loud warning.",
      src: "WMO, January 2025" },
    { i: "🌋", q: "Volcanoes release more CO₂ than humans do.", a: false,
      why: "Humans emit roughly 100 times more CO₂ each year than all the world's volcanoes combined.",
      src: "USGS; Deep Carbon Observatory" },
    { i: "🔄", q: "The climate has always changed, so today's warming is probably natural.", a: false,
      why: "Natural factors (the sun, volcanoes) would have slightly cooled us recently. Scientists call human influence on warming 'unequivocal' — and today's pace is far faster than past natural swings.",
      src: "IPCC AR6, Working Group I (2021)" },
    { i: "🧊", q: "CO₂ in the air is now higher than at any time in at least 800,000 years.", a: true,
      why: "Ice cores show CO₂ stayed between ~170 and 300 ppm for 800,000 years. It's now about 427 ppm. The IPCC says it's likely the highest in at least 2 million years.",
      src: "NOAA; IPCC AR6" },
    { i: "☀️", q: "Most new solar and wind projects now make electricity cheaper than new fossil fuel plants.", a: true,
      why: "The large majority of renewable power added in recent years was cheaper than the cheapest new fossil fuel option.",
      src: "IRENA, Renewable Power Generation Costs" },
    { i: "🚗", q: "Electric cars are worse for the climate than petrol cars because of their batteries.", a: false,
      why: "Batteries do add emissions at the factory, but EVs pay that back quickly. Over their lifetime, EVs in Europe emit roughly 60–70% less than comparable petrol cars — and they get cleaner as grids do.",
      src: "ICCT lifecycle analysis (2021)" },
    { i: "🌳", q: "Planting trees alone can solve climate change.", a: false,
      why: "Forests are vital, but there isn't enough land to plant our way out of burning fossil fuels. Trees help most when we also cut emissions — and protecting existing forests matters just as much.",
      src: "IPCC AR6, Working Group III" },
    { i: "🐻‍❄️", q: "The Arctic is warming nearly four times faster than the global average.", a: true,
      why: "From 1979 to 2021 the Arctic warmed close to four times faster than the world as a whole, as melting ice exposes darker ocean that absorbs more sunlight.",
      src: "Rantanen et al., Communications Earth & Environment (2022)" },
    { i: "🌊", q: "Global sea level has risen about 20 cm since 1900.", a: true,
      why: "Seas rose about 20 cm between 1901 and 2018, and the rate has more than doubled since the early 1990s.",
      src: "IPCC AR6; NASA sea level data" },
    { i: "🕳️", q: "The hole in the ozone layer is the main cause of global warming.", a: false,
      why: "They're different problems. Warming is driven mainly by greenhouse gases like CO₂ and methane. Fun twist: the treaty that fixed the ozone hole also avoided a lot of warming, because those chemicals were greenhouse gases too.",
      src: "NASA; UNEP" },
    { i: "🛡️", q: "The ozone layer is healing thanks to a global treaty.", a: true,
      why: "The 1987 Montreal Protocol phased out ozone-destroying chemicals. The ozone layer is on track to recover to 1980 levels over Antarctica around 2066. Proof that the world can fix a sky problem together.",
      src: "WMO/UNEP Scientific Assessment of Ozone Depletion (2022)" },
    { i: "🐄", q: "Over 20 years, methane traps about 80 times more heat than the same amount of CO₂.", a: true,
      why: "Methane doesn't last as long in the air, but it's extremely potent while it's there. That makes cutting it one of the fastest ways to slow warming.",
      src: "IPCC AR6 (GWP-20 ≈ 81)" },
    { i: "❄️", q: "A cold winter where you live proves global warming isn't happening.", a: false,
      why: "Weather is a day or a season in one place; climate is the long-term average of the whole planet. Cold snaps still happen — they're just getting rarer while heat records pile up.",
      src: "NOAA; NASA" },
    { i: "🔥", q: "Global fossil fuel CO₂ emissions hit a record high in 2024.", a: true,
      why: "About 37.4 billion tonnes, up slightly on 2023. Emissions are still rising — but more slowly, and clean energy is growing fast.",
      src: "Global Carbon Project, Global Carbon Budget 2024" },
    { i: "📉", q: "No country has ever cut emissions while growing its economy.", a: false,
      why: "Dozens have. The UK, for example, has roughly halved its territorial emissions since 1990 while its economy kept growing.",
      src: "UK government statistics; Our World in Data" },
    { i: "🐦", q: "Wind turbines kill more birds than anything else humans build.", a: false,
      why: "In the US, cats kill billions of birds a year and building collisions hundreds of millions. Wind turbines kill far fewer — and climate change itself is a major threat to birds.",
      src: "US Fish & Wildlife Service; Loss et al. (2013)" },
    { i: "🥶", q: "Heat pumps work even in freezing winters.", a: true,
      why: "Modern heat pumps keep working well below zero. Norway — one of Europe's coldest countries — has more heat pumps per household than anywhere else in Europe.",
      src: "IEA, The Future of Heat Pumps (2022)" },
    { i: "🧑‍🔬", q: "Scientists are still split on whether humans are causing climate change.", a: false,
      why: "Studies of tens of thousands of peer-reviewed papers find more than 99% agreement that humans are causing the warming.",
      src: "Lynas et al., Environmental Research Letters (2021)" },
    { i: "🌊", q: "The oceans have absorbed about 90% of the extra heat trapped by greenhouse gases.", a: true,
      why: "The ocean is our giant heat sponge. That's why marine heatwaves are surging — and why ocean warming will keep raising sea levels for centuries.",
      src: "IPCC AR6" },
    { i: "🪸", q: "Most of the world's coral reefs have been hit by bleaching-level heat since 2023.", a: true,
      why: "The fourth global bleaching event, which began in 2023, has exposed about 84% of the world's reef area to bleaching-level heat stress.",
      src: "NOAA Coral Reef Watch / ICRI (2025)" },
    { i: "⏳", q: "It's too late to do anything about climate change.", a: false,
      why: "Every tenth of a degree matters. Warming roughly stops when CO₂ emissions reach net zero, so what we do this decade shapes the world for centuries.",
      src: "IPCC AR6" },
    { i: "🌱", q: "When the world reaches net-zero CO₂ emissions, global warming is expected to roughly stop.", a: true,
      why: "Scientists expect temperatures to level off within a few years of reaching net-zero CO₂. That's why net zero is the target — not just 'less'.",
      src: "IPCC AR6, Working Group I" },
    { i: "💡", q: "LED bulbs use at least 75% less energy than old incandescent bulbs.", a: true,
      why: "And they last up to 25 times longer. Small switch, real savings.",
      src: "US Department of Energy" },
    { i: "🍔", q: "What we eat has almost nothing to do with climate change.", a: false,
      why: "Food systems produce about a third of all greenhouse gas emissions — from farming, land clearing, transport and waste.",
      src: "Crippa et al., Nature Food (2021)" },
    { i: "⚡", q: "About 30% of the world's electricity came from renewable sources in 2023.", a: true,
      why: "Renewables passed 30% of global electricity for the first time in 2023, led by fast growth in solar and wind.",
      src: "Ember, Global Electricity Review 2024" },
    { i: "🏔️", q: "The world's glaciers are growing again.", a: false,
      why: "Glaciers worldwide are shrinking, and the losses have sped up. Many small glaciers are expected to vanish this century.",
      src: "World Glacier Monitoring Service; WMO" },
    { i: "🧊", q: "The last Ice Age was only about 6 °C colder than pre-industrial times, on average.", a: true,
      why: "Just ~6 °C of global cooling buried much of North America and Europe under ice kilometres thick. That's why a few degrees of warming is a very big deal.",
      src: "Tierney et al., Nature (2020)" },
  ];

  const ROUND = 10;
  let deck = [], idx = 0, right = 0, streak = 0, bestStreak = 0, score = 0, answered = false, advancing = false, card = null;

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function newRound() {
    // balance facts and myths a little
    const facts = shuffle(QUESTIONS.filter((q) => q.a)), myths = shuffle(QUESTIONS.filter((q) => !q.a));
    deck = shuffle(facts.slice(0, 5).concat(myths.slice(0, 5))).map((q) => Object.assign({}, q, { result: null }));
    idx = 0; right = 0; streak = 0; bestStreak = 0; score = 0;
    $("final").classList.remove("show");
    $("stage").style.display = "";
    $("answer-row").classList.remove("hide");
    $("swipe-tip").style.display = "";
    renderDots();
    updateScore();
    showCard();
    FX.visit("quiz");
  }

  function renderDots() {
    const d = $("dots");
    d.textContent = "";
    for (let k = 0; k < ROUND; k++) {
      const i = document.createElement("i");
      if (k === idx) i.className = "cur";
      if (deck[k] && deck[k].result != null) i.className = deck[k].result ? "ok" : "bad";
      d.appendChild(i);
    }
  }

  function updateScore() {
    const s = $("streak");
    s.textContent = "🔥 " + streak;
    s.classList.toggle("hot", streak >= 3);
    $("score").textContent = score.toLocaleString() + " pts";
  }

  function showCard() {
    answered = false;
    advancing = false;
    $("explain").classList.remove("show");
    $("answer-row").classList.remove("hide");
    const q = deck[idx];
    const el = document.createElement("div");
    el.className = "qcard";
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", "Statement " + (idx + 1) + " of " + ROUND);
    const num = document.createElement("div"); num.className = "q-num"; num.textContent = (idx + 1) + " / " + ROUND;
    const ic = document.createElement("div"); ic.className = "q-ico"; ic.textContent = q.i;
    const tx = document.createElement("div"); tx.className = "q-text"; tx.textContent = q.q;
    const sf = document.createElement("div"); sf.className = "stamp fact"; sf.textContent = "FACT";
    const sm = document.createElement("div"); sm.className = "stamp myth"; sm.textContent = "MYTH";
    el.append(num, ic, tx, sf, sm);
    const stage = $("stage");
    if (card) card.remove();
    stage.appendChild(el);
    card = el;
    attachSwipe(el);
    renderDots();
  }

  function attachSwipe(el) {
    let sx = 0, sy = 0, dx = 0, dragging = false;
    const sf = el.querySelector(".stamp.fact"), sm = el.querySelector(".stamp.myth");
    el.addEventListener("pointerdown", (e) => {
      if (answered) return;
      Sfx.unlock();
      dragging = true; sx = e.clientX; sy = e.clientY; dx = 0;
      el.setPointerCapture(e.pointerId);
      el.style.transition = "none";
      el.style.animation = "none";
    });
    el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      dx = e.clientX - sx;
      const dy = (e.clientY - sy) * 0.3;
      el.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + dx / 18 + "deg)";
      sf.style.opacity = Math.max(0, Math.min(1, dx / 90));
      sm.style.opacity = Math.max(0, Math.min(1, -dx / 90));
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (Math.abs(dx) > 90) {
        answer(dx > 0, dx > 0 ? 1 : -1);
      } else {
        el.style.transition = "transform 0.35s cubic-bezier(.2,1.6,.4,1)";
        el.style.transform = "";
        sf.style.opacity = 0; sm.style.opacity = 0;
      }
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  function answer(saysFact, dir) {
    if (answered) return;
    answered = true;
    Sfx.unlock();
    const q = deck[idx];
    const ok = saysFact === q.a;
    q.result = ok;
    const el = card;
    el.querySelector(saysFact ? ".stamp.fact" : ".stamp.myth").style.opacity = 1;
    el.querySelector(saysFact ? ".stamp.myth" : ".stamp.fact").style.opacity = 0;
    if (ok) {
      right++;
      streak++;
      bestStreak = Math.max(bestStreak, streak);
      const gain = 100 * Math.min(5, streak);
      score += gain;
      Sfx.correct();
      FX.buzz(15);
      el.classList.add("right");
      el.style.transition = "transform 0.35s cubic-bezier(.2,1.6,.4,1)";
      el.style.transform = "translateX(" + (dir || 0) * 12 + "px) scale(1.03)";
      const r = el.getBoundingClientRect();
      FX.confetti({ x: r.left + r.width / 2, y: r.top + r.height / 3, count: 30 + Math.min(streak, 6) * 15, power: 0.9 });
      const s = $("streak");
      s.classList.remove("bump"); void s.offsetWidth; s.classList.add("bump");
      if (streak === 3) FX.toast("🔥", "On fire! (the good kind)", "3 in a row — points multiply with your streak.");
      if (streak === 5) FX.award("quiz_streak");
    } else {
      streak = 0;
      Sfx.wrong();
      FX.buzz([30, 40, 30]);
      el.style.transform = "";
      el.classList.add("wrong");
    }
    updateScore();
    renderDots();
    const v = $("verdict");
    v.className = "verdict " + (ok ? "ok" : "bad");
    v.textContent = (ok ? "✅ Correct! " : "❌ Not quite. ") + "It's a " + (q.a ? "FACT." : "MYTH.");
    $("why").textContent = q.why;
    $("src").textContent = "Source: " + q.src;
    $("answer-row").classList.add("hide");
    $("explain").classList.add("show");
    $("btn-next").textContent = idx === ROUND - 1 ? "See results 🏁" : "Next →";
    $("btn-next").focus({ preventScroll: true });
  }

  function next() {
    if (!answered || advancing) return;
    advancing = true;
    Sfx.whoosh();
    const el = card;
    el.classList.add("fly");
    el.style.transform = "translateY(-60px) scale(0.85)";
    idx++;
    if (idx >= ROUND) {
      setTimeout(finish, 250);
      return;
    }
    setTimeout(showCard, 220);
  }

  function finish() {
    if (card) { card.remove(); card = null; }
    $("stage").style.display = "none";
    $("answer-row").classList.add("hide");
    $("explain").classList.remove("show");
    $("swipe-tip").style.display = "none";
    renderDots();
    const tiers = [
      [10, "🧠", "Climate Brain", "Perfect score. You could teach this. (Seriously — talking about climate with friends is one of the most useful things you can do.)"],
      [8, "🌍", "Planet Pro", "Excellent! You know your facts from your myths."],
      [6, "🌱", "Growing Strong", "Solid! A few myths slipped through — they're sneaky like that."],
      [4, "🌤️", "Warming Up", "Not bad! The myths in this quiz are believed by lots of people. Now you know better."],
      [0, "🧊", "Ice Breaker", "Everyone starts somewhere. Try another round — the facts stick fast."],
    ];
    const t = tiers.find((x) => right >= x[0]);
    $("final-emoji").textContent = t[1];
    $("final-title").textContent = t[2];
    $("final-right").textContent = right;
    $("final-msg").textContent = t[3] + " Best streak: " + bestStreak + " · " + score.toLocaleString() + " pts.";
    $("final").classList.add("show");
    Sfx.fanfare();
    if (right >= 6) FX.confetti({ count: right === 10 ? 240 : 120, power: 1.2 });
    if (right === 10) { FX.award("quiz_perfect"); setTimeout(() => FX.confetti({ count: 60, emoji: "🧠" }), 400); }
    const best = FX.getStore("coolit.quizBest", 0);
    if (score > best) { FX.setStore("coolit.quizBest", score); if (best) FX.toast("🏅", "New best quiz score!", score.toLocaleString() + " pts"); }
  }

  $("btn-fact").addEventListener("click", () => {
    if (card && !answered) { card.style.transition = "transform 0.3s"; card.style.transform = "translateX(14px) rotate(2deg)"; }
    answer(true, 1);
  });
  $("btn-myth").addEventListener("click", () => {
    if (card && !answered) { card.style.transition = "transform 0.3s"; card.style.transform = "translateX(-14px) rotate(-2deg)"; }
    answer(false, -1);
  });
  $("btn-next").addEventListener("click", next);
  $("btn-again").addEventListener("click", () => { Sfx.click(); newRound(); });
  window.addEventListener("keydown", (e) => {
    if ($("final").classList.contains("show")) return;
    if (e.key === "ArrowRight" && !answered) $("btn-fact").click();
    else if (e.key === "ArrowLeft" && !answered) $("btn-myth").click();
    else if ((e.key === "Enter" || e.key === " " || e.key === "ArrowRight") && answered) { e.preventDefault(); next(); }
  });

  const muteBtn = $("btn-mute");
  const sync = () => { muteBtn.textContent = Sfx.muted ? "🔇" : "🔊"; };
  muteBtn.addEventListener("click", () => { Sfx.unlock(); Sfx.toggleMute(); sync(); });
  sync();

  window.__quiz = { QUESTIONS };
  newRound();
})();
