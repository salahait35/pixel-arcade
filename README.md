# 🕹️ Pixel Arcade

[![CI](https://github.com/OWNER/pixel-arcade/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/pixel-arcade/actions/workflows/ci.yml)
![No dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

Five tiny browser games on one hub, written in plain HTML, CSS and JavaScript.
No framework, no bundler, no `node_modules`.

| Game | What it is | Controls |
| --- | --- | --- |
| 🐤 **Flappy Pixel** | Flap through an endless row of pipes | Space / ↑ / tap |
| 🐍 **Snake** | Eat, grow, do not bite your tail; speeds up as you score | Arrows / WASD / swipe |
| 🧱 **Breakout** | Clear the wall of bricks, three lives, endless levels | ← → / mouse / touch |
| 🔢 **2048** | Slide and merge tiles up to 2048 (and beyond) | Arrows / swipe |
| 🏓 **Pong** | First to seven against the house paddle | ↑ ↓ / W S / mouse |

Best scores are stored per game in the browser's `localStorage` and shown on the hub.

## Run it

Browsers refuse to load ES modules from `file://`, so the arcade needs an HTTP origin.
A tiny zero-dependency server is included:

```bash
npm start          # http://127.0.0.1:4173
PORT=8080 npm start
```

Any static server works too (`python3 -m http.server 4173`, `npx serve`, …).
The server binds to `127.0.0.1` on purpose; set `HOST` only if you really want other
machines on your network to reach it.

## Develop

```bash
npm test           # engine, storage and renderer tests (Node's built-in test runner)
npm run test:watch
npm run check      # syntax check of every module + catalog ↔ pages ↔ engines wiring
npm run ci         # what GitHub Actions runs
```

Requirements: Node.js 22 or newer. Nothing to install.

### Project layout

```
index.html            hub page (game cards, best scores, reset)
games/<id>.html       one page per game
src/
  engine/<id>.js      pure game logic: state + update(dt) + actions. No DOM, no canvas.
  ui/<id>-ui.js       canvas renderer and input wiring for one game
  ui/page.js          shared page boilerplate (best-score header, toast, score submit)
  ui/hub.js           hub renderer
  shared/
    loop.js           fixed-timestep requestAnimationFrame loop
    input.js          keyboard (no auto-repeat) and pointer/swipe helpers
    storage.js        best-score store over any localStorage-like object
    hud.js            canvas text, panels and overlays
    rng.js            seedable PRNG (mulberry32) so tests are deterministic
    catalog.js        the list of games shown on the hub
tests/                node:test suites, one per engine + storage, catalog, server, UI smoke
scripts/
  serve.mjs           local static server (loopback only)
  check.mjs           quality gate used by `npm run check`
```

The split between **engine** and **ui** is the one rule of the codebase: engines never
touch the DOM, so every rule of every game is testable in Node with a seeded RNG, and
renderers stay thin.

### Adding a game

1. Create `src/engine/<id>.js` exporting at least `createGame({ rng })`, `update(game, dt)`
   and `restart(game)`, plus the actions your game needs (`flap`, `move`, …).
2. Create `src/ui/<id>-ui.js`: call `setupPage('<id>')` from `src/ui/page.js`, wire input,
   draw the state, and call `page.submitScore(score)` when a run ends.
3. Create `games/<id>.html` from an existing page (keep the canvas `id="game"` and the
   `id="best"` span) and point its `<script type="module">` at your renderer.
4. Add the game to `src/shared/catalog.js` — the hub, `npm run check` and the tests pick
   it up from there.
5. Add `tests/<id>.test.js`. Engines take an `rng` option; use `createRng(seed)` so the
   test is deterministic.

## Contributing

Bug reports and feature requests are welcome — please use the issue templates.
See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and the definition of done.

## License

[MIT](LICENSE)
