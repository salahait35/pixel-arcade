import { SNAKE, createGame, restart, setDirection, start, update } from '../engine/snake.js';
import { createLoop } from '../shared/loop.js';
import { DIRECTION_KEYS, attachKeyboard, attachPointer } from '../shared/input.js';
import { badge, overlay, roundRect } from '../shared/hud.js';
import { setupPage } from './page.js';

const { COLS, ROWS, CELL } = SNAKE;
const WIDTH = COLS * CELL;
const HEIGHT = ROWS * CELL;
const page = setupPage('snake');
const { ctx } = page;
const game = createGame();
let scoreSubmitted = false;

function reset() {
  restart(game);
  scoreSubmitted = false;
}

function steer(dir) {
  if (game.status === 'dead' || game.status === 'won') {
    reset();
    return;
  }
  setDirection(game, dir);
}

attachKeyboard(window, {
  onPress(key) {
    if (DIRECTION_KEYS[key]) steer(DIRECTION_KEYS[key]);
    else if (key === ' ' || key === 'Enter') {
      if (game.status === 'ready') start(game);
      else if (game.status !== 'playing') reset();
    } else if (key === 'r' || key === 'R') reset();
  },
});

attachPointer(page.canvas, {
  onSwipe: steer,
  onTap() {
    if (game.status === 'ready') start(game);
    else if (game.status !== 'playing') reset();
  },
});

function tick(dt) {
  update(game, dt);
  if ((game.status === 'dead' || game.status === 'won') && !scoreSubmitted) {
    scoreSubmitted = true;
    page.submitScore(game.score);
  }
}

function render() {
  // checkerboard board
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#1b2340' : '#1f2848';
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }

  // food
  if (game.food) {
    const fx = game.food.x * CELL + CELL / 2;
    const fy = game.food.y * CELL + CELL / 2;
    ctx.fillStyle = '#ff5f5f';
    ctx.beginPath();
    ctx.arc(fx, fy + 1, CELL * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4cd964';
    roundRect(ctx, fx - 1, fy - CELL * 0.46, 4, 7, 2, '#4cd964');
  }

  // snake
  game.snake.forEach((cell, index) => {
    const t = index / Math.max(1, game.snake.length - 1);
    const shade = Math.round(205 - t * 90);
    const fill = index === 0 ? '#7cff7a' : `rgb(76, ${shade}, 100)`;
    roundRect(ctx, cell.x * CELL + 2, cell.y * CELL + 2, CELL - 4, CELL - 4, 6, fill);
  });

  // eyes on the head
  const head = game.snake[0];
  const hx = head.x * CELL + CELL / 2;
  const hy = head.y * CELL + CELL / 2;
  ctx.fillStyle = '#10132a';
  const ex = game.dir.y === 0 ? 0 : 5;
  const ey = game.dir.x === 0 ? 0 : 5;
  ctx.beginPath();
  ctx.arc(hx + game.dir.x * 5 - ex, hy + game.dir.y * 5 - ey, 2.4, 0, Math.PI * 2);
  ctx.arc(hx + game.dir.x * 5 + ex, hy + game.dir.y * 5 + ey, 2.4, 0, Math.PI * 2);
  ctx.fill();

  badge(ctx, `SCORE ${game.score}`, 10, 10);
  badge(ctx, `LEN ${game.snake.length}`, WIDTH - 10, 10, { align: 'right' });

  if (game.status === 'ready') {
    overlay(ctx, WIDTH, HEIGHT, {
      title: 'SNAKE',
      subtitle: 'Arrows, WASD or swipe to move',
      hint: `Best ${page.best()}`,
      accent: '#4cd964',
    });
  } else if (game.status === 'dead') {
    overlay(ctx, WIDTH, HEIGHT, {
      title: 'GAME OVER',
      subtitle: `Score ${game.score} · Best ${page.best()}`,
      hint: 'Press any arrow to play again',
      accent: '#ff5f5f',
    });
  } else if (game.status === 'won') {
    overlay(ctx, WIDTH, HEIGHT, {
      title: 'YOU FILLED IT!',
      subtitle: `Score ${game.score}`,
      hint: 'Press any arrow to play again',
      accent: '#4cd964',
    });
  }
}

createLoop({ update: tick, render }).start();
