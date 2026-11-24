import { BREAKOUT, createGame, launch, restart, setPaddleCenter, setPaddleInput, update } from '../engine/breakout.js';
import { createLoop } from '../shared/loop.js';
import { attachKeyboard, attachPointer } from '../shared/input.js';
import { badge, overlay, roundRect } from '../shared/hud.js';
import { setupPage } from './page.js';

const { WIDTH, HEIGHT } = BREAKOUT;
const page = setupPage('breakout');
const { ctx } = page;
const game = createGame();
let scoreSubmitted = false;

function reset() {
  restart(game);
  scoreSubmitted = false;
}

function primary() {
  if (game.status === 'gameover') reset();
  else launch(game);
}

const keyboard = attachKeyboard(window, {
  onPress(key) {
    if (key === ' ' || key === 'ArrowUp' || key === 'Enter') primary();
    if (key === 'r' || key === 'R') reset();
  },
});

attachPointer(page.canvas, {
  onMove(point) {
    setPaddleCenter(game, point.x);
  },
  onTap: primary,
});

function tick(dt) {
  setPaddleInput(game, keyboard.axisX());
  update(game, dt);
  if (game.status === 'gameover' && !scoreSubmitted) {
    scoreSubmitted = true;
    page.submitScore(game.score);
  }
}

function render() {
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, '#141a35');
  bg.addColorStop(1, '#0b0e1f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (const brick of game.bricks) {
    if (!brick.alive) continue;
    roundRect(ctx, brick.x, brick.y, brick.w, brick.h, 4, brick.color);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(brick.x + 3, brick.y + 3, brick.w - 6, 4);
  }

  const { paddle, ball } = game;
  roundRect(ctx, paddle.x, paddle.y, paddle.w, paddle.h, 7, '#eef1ff');
  roundRect(ctx, paddle.x + 6, paddle.y + 3, paddle.w - 12, 4, 2, '#3fa7ff');

  ctx.fillStyle = '#f5c518';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  badge(ctx, `SCORE ${game.score}`, 10, 10);
  badge(ctx, `LEVEL ${game.level}`, WIDTH / 2, 10, { align: 'center' });
  badge(ctx, `${'●'.repeat(game.lives)}${'○'.repeat(Math.max(0, BREAKOUT.LIVES - game.lives))}`, WIDTH - 10, 10, {
    align: 'right',
    color: '#ff5f5f',
  });

  if (game.status === 'ready') {
    overlay(ctx, WIDTH, HEIGHT, {
      title: game.level > 1 ? `LEVEL ${game.level}` : 'BREAKOUT',
      subtitle: 'Space or tap to launch',
      hint: `Best ${page.best()}`,
      accent: '#ff9f43',
    });
  } else if (game.status === 'gameover') {
    overlay(ctx, WIDTH, HEIGHT, {
      title: 'GAME OVER',
      subtitle: `Score ${game.score} · Best ${page.best()}`,
      hint: 'Space or tap to play again',
      accent: '#ff5f5f',
    });
  }
}

createLoop({ update: tick, render }).start();
