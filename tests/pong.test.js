import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PONG, createGame, hitsPaddle, setPlayerCenter, setPlayerInput, start, update } from '../src/engine/pong.js';
import { createRng } from '../src/shared/rng.js';

const DT = 1 / 60;

test('a new match is 0-0 and waits for the serve', () => {
  const game = createGame({ rng: createRng(9) });
  assert.deepEqual(game.scores, { player: 0, cpu: 0 });
  assert.equal(game.status, 'ready');
  assert.equal(game.winner, null);
});

test('the ball does not move before the serve', () => {
  const game = createGame({ rng: createRng(9) });
  const { x, y } = game.ball;
  update(game, DT);
  assert.deepEqual([game.ball.x, game.ball.y], [x, y]);
});

test('start serves the ball', () => {
  const game = createGame({ rng: createRng(9) });
  start(game);
  const { x } = game.ball;
  update(game, DT);
  assert.equal(game.status, 'playing');
  assert.notEqual(game.ball.x, x);
});

test('the player paddle stays inside the court', () => {
  const game = createGame({ rng: createRng(9) });
  setPlayerCenter(game, -500);
  assert.equal(game.player.y, 0);
  setPlayerInput(game, 1);
  update(game, 5);
  assert.equal(game.player.y, PONG.HEIGHT - game.player.h);
});

test('the ball bounces off the top wall', () => {
  const game = createGame({ rng: createRng(9) });
  start(game);
  game.ball.y = 1;
  game.ball.vy = -200;
  game.ball.vx = 0;
  update(game, DT);
  assert.ok(game.ball.vy > 0);
});

test('the house scores when the ball leaves on the left', () => {
  const game = createGame({ rng: createRng(9) });
  start(game);
  game.ball.x = -game.ball.size - 1;
  game.ball.vx = -200;
  update(game, DT);
  assert.equal(game.scores.cpu, 1);
  assert.equal(game.status, 'ready', 'a new serve is prepared');
  assert.equal(game.server, 'player', 'the loser of the point serves');
});

test('the match ends at the winning score', () => {
  const game = createGame({ rng: createRng(9) });
  start(game);
  game.scores.cpu = PONG.WIN_SCORE - 1;
  game.ball.x = -game.ball.size - 1;
  game.ball.vx = -200;
  update(game, DT);
  assert.equal(game.status, 'over');
  assert.equal(game.winner, 'cpu');
});

test('hitsPaddle is an axis-aligned overlap test', () => {
  const paddle = { x: 24, y: 100, w: 12, h: 72 };
  assert.equal(hitsPaddle({ x: 30, y: 120, size: 10 }, paddle), true);
  assert.equal(hitsPaddle({ x: 30, y: 180, size: 10 }, paddle), false);
  assert.equal(hitsPaddle({ x: 40, y: 120, size: 10 }, paddle), false);
});
