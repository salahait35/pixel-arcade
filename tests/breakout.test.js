import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BREAKOUT, buildBricks, circleHitsRect, createGame, launch, remainingBricks,
  setPaddleCenter, setPaddleInput, update,
} from '../src/engine/breakout.js';
import { createRng } from '../src/shared/rng.js';

const DT = 1 / 60;

test('a new game has a full wall of bricks and three lives', () => {
  const game = createGame({ rng: createRng(5) });
  assert.equal(game.status, 'ready');
  assert.equal(game.lives, BREAKOUT.LIVES);
  assert.equal(remainingBricks(game), BREAKOUT.BRICK_COLS * BREAKOUT.BRICK_ROWS);
});

test('bricks are laid out inside the playfield', () => {
  for (const brick of buildBricks()) {
    assert.ok(brick.x >= 0 && brick.x + brick.w <= BREAKOUT.WIDTH);
    assert.ok(brick.y >= 0 && brick.y + brick.h < BREAKOUT.PADDLE_Y);
  }
});

test('launching sends the ball upwards', () => {
  const game = createGame({ rng: createRng(5) });
  launch(game);
  assert.equal(game.status, 'playing');
  assert.ok(game.ball.vy < 0);
  assert.ok(Math.abs(Math.hypot(game.ball.vx, game.ball.vy) - BREAKOUT.BALL_SPEED) < 1e-6);
});

test('the ball bounces off the side walls', () => {
  const game = createGame({ rng: createRng(5) });
  launch(game);
  game.ball.x = 10;
  game.ball.y = 300;
  game.ball.vx = -300;
  game.ball.vy = 0;
  update(game, DT);
  assert.ok(game.ball.vx > 0);
});

test('hitting a brick removes it and scores its points', () => {
  const game = createGame({ rng: createRng(5) });
  launch(game);
  const target = game.bricks.find((b) => b.row === BREAKOUT.BRICK_ROWS - 1 && b.col === 3);
  game.ball.x = target.x + target.w / 2;
  game.ball.y = target.y + target.h + game.ball.r + 2;
  game.ball.vx = 0;
  game.ball.vy = -300;
  update(game, DT);
  assert.equal(target.alive, false);
  assert.equal(game.score, target.points);
  assert.ok(game.ball.vy > 0, 'the ball is reflected downwards');
});

test('letting the ball fall costs a life and re-arms the ball', () => {
  const game = createGame({ rng: createRng(5) });
  launch(game);
  game.ball.y = BREAKOUT.HEIGHT + 50;
  game.ball.vx = 0;
  game.ball.vy = 300;
  update(game, DT);
  assert.equal(game.lives, BREAKOUT.LIVES - 1);
  assert.equal(game.status, 'ready');
});

test('the game is over after the last life', () => {
  const game = createGame({ rng: createRng(5) });
  game.lives = 1;
  launch(game);
  game.ball.y = BREAKOUT.HEIGHT + 50;
  game.ball.vy = 300;
  update(game, DT);
  assert.equal(game.status, 'gameover');
  assert.equal(game.lives, 0);
});

test('the paddle cannot leave the playfield on the left', () => {
  const game = createGame({ rng: createRng(5) });
  setPaddleCenter(game, -200);
  assert.equal(game.paddle.x, 0);
  setPaddleInput(game, -1);
  update(game, 1);
  assert.equal(game.paddle.x, 0);
});

test('keyboard input moves the paddle', () => {
  const game = createGame({ rng: createRng(5) });
  const startX = game.paddle.x;
  setPaddleInput(game, 1);
  update(game, 0.1);
  assert.ok(game.paddle.x > startX);
});

test('circleHitsRect handles corners', () => {
  const rect = { x: 100, y: 100, w: 50, h: 20 };
  assert.equal(circleHitsRect({ x: 95, y: 95, r: 7 }, rect), false);
  assert.equal(circleHitsRect({ x: 97, y: 97, r: 7 }, rect), true);
  assert.equal(circleHitsRect({ x: 125, y: 90, r: 7 }, rect), false);
  assert.equal(circleHitsRect({ x: 125, y: 94, r: 7 }, rect), true);
});
