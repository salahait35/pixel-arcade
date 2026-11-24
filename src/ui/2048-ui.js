import { BOARD_SIZE, createGame, move, restart } from '../engine/2048.js';
import { createLoop } from '../shared/loop.js';
import { DIRECTION_KEYS, attachKeyboard, attachPointer } from '../shared/input.js';
import { badge, overlay, roundRect, text } from '../shared/hud.js';
import { setupPage } from './page.js';

const WIDTH = 480;
const HEIGHT = 560;
const BOARD_TOP = 80;
const PADDING = 12;
const BOARD_PX = WIDTH - PADDING * 2;
const TILE = (BOARD_PX - PADDING * (BOARD_SIZE + 1)) / BOARD_SIZE;

const TILE_COLORS = {
  2: ['#eee4da', '#776e65'],
  4: ['#ede0c8', '#776e65'],
  8: ['#f2b179', '#f9f6f2'],
  16: ['#f59563', '#f9f6f2'],
  32: ['#f67c5f', '#f9f6f2'],
  64: ['#f65e3b', '#f9f6f2'],
  128: ['#edcf72', '#f9f6f2'],
  256: ['#edcc61', '#f9f6f2'],
  512: ['#edc850', '#f9f6f2'],
  1024: ['#edc53f', '#f9f6f2'],
  2048: ['#edc22e', '#f9f6f2'],
};

const page = setupPage('2048');
const { ctx } = page;
const game = createGame();
let announcedWin = false;
let spawnPulse = 0;

const DIRECTION_NAMES = { '0,-1': 'up', '0,1': 'down', '-1,0': 'left', '1,0': 'right' };

function slide(dir) {
  if (game.status === 'over') return;
  const moved = move(game, DIRECTION_NAMES[`${dir.x},${dir.y}`]);
  if (moved) {
    spawnPulse = 0.18;
    page.submitScore(game.score);
  }
  if (game.won && !announcedWin) {
    announcedWin = true;
    page.showToast('2048 reached — keep going!');
  }
}

function reset() {
  restart(game);
  announcedWin = false;
  page.refreshBest();
}

attachKeyboard(window, {
  onPress(key) {
    if (DIRECTION_KEYS[key]) slide(DIRECTION_KEYS[key]);
    if (key === 'r' || key === 'R') reset();
  },
});

attachPointer(page.canvas, {
  onSwipe: slide,
  onTap() {
    if (game.status === 'over') reset();
  },
});

function tick(dt) {
  spawnPulse = Math.max(0, spawnPulse - dt);
}

function render() {
  ctx.fillStyle = '#faf8ef';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  text(ctx, '2048', PADDING, 40, { size: 30, color: '#776e65', align: 'left', shadow: false });
  badge(ctx, `SCORE ${game.score}`, WIDTH - PADDING, 20, { align: 'right' });
  badge(ctx, `BEST ${page.best()}`, WIDTH - PADDING - 150, 20, { align: 'right' });

  roundRect(ctx, PADDING, BOARD_TOP, BOARD_PX, BOARD_PX, 10, '#bbada0');

  game.board.forEach((row, r) => {
    row.forEach((value, c) => {
      const x = PADDING * 2 + c * (TILE + PADDING);
      const y = BOARD_TOP + PADDING + r * (TILE + PADDING);
      roundRect(ctx, x, y, TILE, TILE, 6, 'rgba(238, 228, 218, 0.35)');
      if (value === 0) return;
      const [fill, color] = TILE_COLORS[value] ?? ['#3c3a32', '#f9f6f2'];
      const isNew = game.lastSpawn && game.lastSpawn.r === r && game.lastSpawn.c === c && spawnPulse > 0;
      const grow = isNew ? (1 - spawnPulse / 0.18) : 1;
      const size = TILE * (0.6 + 0.4 * grow);
      const offset = (TILE - size) / 2;
      roundRect(ctx, x + offset, y + offset, size, size, 6, fill);
      const fontSize = value < 100 ? 40 : value < 1000 ? 32 : 26;
      text(ctx, String(value), x + TILE / 2, y + TILE / 2 + 2, { size: fontSize, color, shadow: false });
    });
  });

  text(ctx, 'Join the tiles, get to 2048!', PADDING, HEIGHT - 20, {
    size: 13,
    color: '#776e65',
    align: 'left',
    weight: 'normal',
    shadow: false,
  });

  if (game.status === 'over') {
    overlay(ctx, WIDTH, HEIGHT, {
      title: 'GAME OVER',
      subtitle: `Score ${game.score} · Best ${page.best()}`,
      hint: 'Press R or tap to play again',
      accent: '#ff5f5f',
    });
  }
}

createLoop({ update: tick, render }).start();
