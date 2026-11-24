# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.1.0] - 2026-11-24

### Added

- Hub page listing every game with its best score and a reset button.
- Flappy Pixel: endless pipes, gravity, flap, score, best score.
- Snake: 20×20 grid, growing speed, wall and self collision, swipe controls.
- Breakout: 8×6 brick wall, three lives, endless levels with increasing ball speed,
  mouse/touch and keyboard paddle control.
- 2048: four-direction slide and merge, win detection, game-over detection.
- Pong: first to seven against a computer paddle, mouse and keyboard control.
- Shared fixed-timestep loop, input helpers, canvas HUD helpers, seedable RNG and
  localStorage-backed score store.
- Zero-dependency local server (`npm start`) bound to loopback.
- Test suites on Node's built-in runner, UI smoke test, `npm run check` quality gate,
  GitHub Actions CI, issue and pull request templates.
