import { PONG, createGame, restart, setPlayerCenter, setPlayerInput, start, update } from '../engine/pong.js';
import { createLoop } from '../shared/loop.js';
import { attachKeyboard, attachPointer } from '../shared/input.js';
import { overlay, roundRect, text } from '../shared/hud.js';
import { setupPage } from './page.js';

const { WIDTH, HEIGHT, WIN_SCORE } = PONG;
const page = setupPage('pong');
const { ctx } = page;
const game = createGame();
let scoreSubmitted = false;

function reset() {
  restart(game);
  scoreSubmitted = false;
}

function primary() {
  if (game.status === 'over') reset();
  else start(game);
}

const keyboard = attachKeyboard(window, {
  onPress(key) {
    if (key === ' ' || key === 'Enter') primary();
    if (key === 'r' || key === 'R') reset();
  },
});

attachPointer(page.canvas, {
  onMove(point) {
    setPlayerCenter(game, point.y);
  },
  onTap: primary,
});

function tick(dt) {
  setPlayerInput(game, keyboard.axisY());
  update(game, dt);
  if (game.status === 'over' && !scoreSubmitted) {
    scoreSubmitted = true;
    // The score that counts is how many points you took off the house.
    page.submitScore(game.scores.player);
  }
}

function render() {
  ctx.fillStyle = '#0d1326';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // centre line
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let y = 8; y < HEIGHT; y += 24) ctx.fillRect(WIDTH / 2 - 2, y, 4, 12);

  text(ctx, String(game.scores.player), WIDTH / 2 - 60, 48, { size: 40, color: '#3fa7ff' });
  text(ctx, String(game.scores.cpu), WIDTH / 2 + 60, 48, { size: 40, color: '#ff5f5f' });

  const { player, cpu, ball } = game;
  roundRect(ctx, player.x, player.y, player.w, player.h, 4, '#3fa7ff');
  roundRect(ctx, cpu.x, cpu.y, cpu.w, cpu.h, 4, '#ff5f5f');
  roundRect(ctx, ball.x, ball.y, ball.size, ball.size, 2, '#f5c518');

  if (game.status === 'ready') {
    const serving = game.server === 'player' ? 'You serve' : 'House serves';
    overlay(ctx, WIDTH, HEIGHT, {
      title: game.scores.player + game.scores.cpu === 0 ? 'PONG' : serving.toUpperCase(),
      subtitle: `First to ${WIN_SCORE} · Space or tap`,
      hint: 'Move with ↑ ↓, W S or the mouse',
      accent: '#3fa7ff',
    });
  } else if (game.status === 'over') {
    const won = game.winner === 'player';
    overlay(ctx, WIDTH, HEIGHT, {
      title: won ? 'YOU WIN' : 'HOUSE WINS',
      subtitle: `${game.scores.player} – ${game.scores.cpu}`,
      hint: 'Space or tap to play again',
      accent: won ? '#4cd964' : '#ff5f5f',
    });
  }
}

createLoop({ update: tick, render }).start();
