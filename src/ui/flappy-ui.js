import { FLAPPY, createGame, flap, restart, update } from '../engine/flappy.js';
import { createLoop } from '../shared/loop.js';
import { attachKeyboard, attachPointer } from '../shared/input.js';
import { overlay, roundRect, text } from '../shared/hud.js';
import { setupPage } from './page.js';

const { WIDTH, HEIGHT, GROUND_Y, BIRD_SIZE, PIPE_WIDTH, PIPE_GAP } = FLAPPY;
const page = setupPage('flappy');
const { ctx } = page;
const game = createGame();
let scoreSubmitted = false;

function action() {
  if (game.status === 'dead') {
    restart(game);
    scoreSubmitted = false;
    return;
  }
  flap(game);
}

attachKeyboard(window, {
  onPress(key) {
    if (key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') action();
    if (key === 'r' || key === 'R') {
      restart(game);
      scoreSubmitted = false;
    }
  },
});
attachPointer(page.canvas, { onDown: action });

function tick(dt) {
  update(game, dt);
  if (game.status === 'dead' && !scoreSubmitted) {
    scoreSubmitted = true;
    page.submitScore(game.score);
  }
}

// ---------- drawing ----------

const clouds = Array.from({ length: 6 }, (_, i) => ({
  x: (i * 97) % WIDTH,
  y: 60 + ((i * 53) % 220),
  w: 70 + ((i * 37) % 60),
}));

function drawSky() {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, '#4ec0ff');
  sky.addColorStop(1, '#bfeaff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, GROUND_Y);

  const drift = (game.elapsed * 12) % (WIDTH + 140);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const cloud of clouds) {
    const x = ((cloud.x - drift) % (WIDTH + 140) + WIDTH + 140) % (WIDTH + 140) - 70;
    roundRect(ctx, x, cloud.y, cloud.w, 22, 11, 'rgba(255,255,255,0.85)');
    roundRect(ctx, x + 14, cloud.y - 12, cloud.w * 0.55, 22, 11, 'rgba(255,255,255,0.85)');
  }
}

function drawPipe(pipe) {
  const gapTop = pipe.gapY - PIPE_GAP / 2;
  const gapBottom = pipe.gapY + PIPE_GAP / 2;
  const body = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
  body.addColorStop(0, '#3cb043');
  body.addColorStop(0.5, '#7ed957');
  body.addColorStop(1, '#2e8b35');
  ctx.fillStyle = body;
  ctx.fillRect(pipe.x, 0, PIPE_WIDTH, gapTop);
  ctx.fillRect(pipe.x, gapBottom, PIPE_WIDTH, GROUND_Y - gapBottom);
  // caps
  ctx.fillStyle = '#2e8b35';
  ctx.fillRect(pipe.x - 4, gapTop - 22, PIPE_WIDTH + 8, 22);
  ctx.fillRect(pipe.x - 4, gapBottom, PIPE_WIDTH + 8, 22);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(pipe.x + 8, 0, 10, gapTop - 22);
  ctx.fillRect(pipe.x + 8, gapBottom + 22, 10, GROUND_Y - gapBottom - 22);
}

function drawGround() {
  ctx.fillStyle = '#d9b36b';
  ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
  ctx.fillStyle = '#6fcf4a';
  ctx.fillRect(0, GROUND_Y, WIDTH, 10);
  ctx.fillStyle = '#c99a4e';
  const offset = (game.status === 'playing' ? game.elapsed * FLAPPY.PIPE_SPEED : 0) % 24;
  for (let x = -24 + (24 - offset); x < WIDTH; x += 24) {
    ctx.fillRect(x, GROUND_Y + 14, 12, 6);
  }
}

function drawBird() {
  const { bird } = game;
  const half = BIRD_SIZE / 2;
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);
  roundRect(ctx, -half, -half, BIRD_SIZE, BIRD_SIZE, 7, '#f5c518', '#b8860b');
  // wing
  const wingUp = Math.sin(bird.wing * 18) > 0 || game.status !== 'playing';
  roundRect(ctx, -half + 2, wingUp ? -4 : 2, 12, 8, 4, '#e0a800');
  // eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(6, -5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(7, -5, 2.2, 0, Math.PI * 2);
  ctx.fill();
  // beak
  ctx.fillStyle = '#ff7f27';
  ctx.beginPath();
  ctx.moveTo(half - 2, 0);
  ctx.lineTo(half + 9, 3);
  ctx.lineTo(half - 2, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function render() {
  drawSky();
  for (const pipe of game.pipes) drawPipe(pipe);
  drawGround();
  drawBird();

  if (game.status !== 'ready') {
    text(ctx, String(game.score), WIDTH / 2, 70, { size: 44, color: '#fff' });
  }
  if (game.status === 'ready') {
    overlay(ctx, WIDTH, HEIGHT, {
      title: 'FLAPPY PIXEL',
      subtitle: 'Tap or press Space to flap',
      hint: `Best ${page.best()}`,
    });
  } else if (game.status === 'dead') {
    overlay(ctx, WIDTH, HEIGHT, {
      title: 'GAME OVER',
      subtitle: `Score ${game.score} · Best ${page.best()}`,
      hint: 'Tap or press Space to try again',
      accent: '#ff5f5f',
    });
  }
}

createLoop({ update: tick, render }).start();
