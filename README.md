# 🌍 COOL IT! — global warming, but make it fun

A playful little web arcade about global warming, built to make you **feel good *and* informed**.
You get combos, confetti and badges, and every number comes from a real source.

| Mode | What it is |
| --- | --- |
| 🌍 **Planet Patrol** (`play.html`) | Fruit-Ninja-style arcade game. Swipe CO₂ molecules out of the sky, tap coal plants, oil wells and gas cars to flip them into wind, solar and EVs, deny new fossil permits, and put out heat-driven wildfires. Every five years you pick a **real-world solution card** (heat pumps, carbon pricing, mangroves…). Get the planet to **2050 under +1.5 °C**. |
| 🧠 **Fact or Myth?** (`quiz.html`) | Tinder-style swipe quiz. 28 sourced statements (volcanoes, cows, wind turbines vs. birds, EV batteries…). Streak multipliers and confetti. |
| 🎼 **Hear the Warming** (`stripes.html`) | The real [warming stripes](https://showyourstripes.info/) from NASA data, 1880 → 2025, played as music: one note per year, so hotter years sound higher. Drag to explore any year, and overlay the temperature and CO₂ lines. |
| 💚 **Cool Moves** (`act.html`) | The real-life power-ups. Check off actions to watch your tonnes of CO₂ saved add up, then generate a shareable **pledge card** (PNG). |

The home page (`index.html`) shows the real stripes as its background, plus live counters for CO₂ emitted
vs. solar panels installed since you opened the page, and your badge collection.

## Play it

There's no build step and there are no dependencies. It's plain HTML, CSS and JavaScript.

- **Quickest:** open `index.html` in a browser.
- **Local server (recommended):**

  ```bash
  python3 -m http.server 8000
  ```

  Then visit <http://localhost:8000>.
- **Put it online for free:** on GitHub, go to *Settings → Pages*, choose *Deploy from a branch*, pick this branch and `/ (root)`, and save.

Turn your sound on: all sound effects and music are synthesized live with the Web Audio API, so there are no audio files.
It works with mouse, touch and keyboard (`P` pauses the game, `M` mutes, and `←`/`→` answer the quiz and scrub the stripes).

## The science bits

- **Temperature:** [NASA GISTEMP v4](https://data.giss.nasa.gov/gistemp/), global land–ocean annual means, 1880–2025. Values are shown relative to the 1880–1900 average as a stand-in for "pre-industrial".
- **CO₂:** [NOAA GML Mauna Loa](https://gml.noaa.gov/ccgg/trends/) annual means, 1959–2025.
- Both are embedded in `js/climate-data.js`, so the site works offline.
- Every fact card, quiz answer and action shows its source (IPCC AR6, IEA, WMO, UNEP, Ember, IRENA, Global Carbon Project, Wynes & Nicholas 2017, and others).
- The game's physics is a cartoon, not a climate model. It does keep a few real ideas:
  - More CO₂ in the sky means more warming.
  - Heat builds up the longer CO₂ lingers, so delay has a lasting cost.
  - Hotter worlds burn more forests, and thawing permafrost releases methane. Both are feedback loops.

## Files

```
index.html  play.html  quiz.html  stripes.html  act.html
css/   style.css (shared) + one stylesheet per page
js/    audio.js     synthesized SFX + generative music
       fx.js        confetti, toasts, haptics, badges
       climate-data.js  NASA + NOAA data and the stripes palette
       game.js  quiz.js  stripes.js  act.js  home.js
```

Progress (badges, best scores, your chosen moves) is saved only in your own browser's `localStorage`.
