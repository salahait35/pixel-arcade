import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FLAPPY, createGame, flap, hitsPipe, restart, update } from '../src/engine/flappy.js';
import { createRng } from '../src/shared/rng.js';

const DT = 1 / 60;

function run(game, seconds) {
  for (let t = 0; t < seconds; t += DT) update(game, DT);
}

test('a new game waits for the first flap', () => {
  const game = createGame({ rng: createRng(7) });
  assert.equal(game.status, 'ready');
  assert.equal(game.score, 0);
  assert.equal(game.pipes.length, FLAPPY.PIPE_COUNT);
  assert.ok(game.pipes.every((pipe) => pipe.x > FLAPPY.WIDTH), 'pipes start off-screen to the right');
});

test('the first flap starts the run and pushes the bird up', () => {
  const game = createGame({ rng: createRng(7) });
  flap(game);
  assert.equal(game.status, 'playing');
  assert.equal(game.bird.vy, FLAPPY.FLAP_VELOCITY);
});

test('gravity pulls the bird down while playing', () => {
  const game = createGame({ rng: createRng(7) });
  flap(game);
  const startY = game.bird.y;
  run(game, 0.6);
  assert.ok(game.bird.vy > 0, 'velocity turns positive (downwards)');
  assert.ok(game.bird.y > startY, 'the bird ends lower than where it started');
});

test('touching the ground ends the run', () => {
  const game = createGame({ rng: createRng(7) });
  flap(game);
  // Push every pipe far away so only the ground can kill the bird.
  for (const pipe of game.pipes) pipe.x += 5000;
  run(game, 3);
  assert.equal(game.status, 'dead');
  assert.ok(game.bird.y <= FLAPPY.GROUND_Y - FLAPPY.BIRD_SIZE / 2 + 0.001);
});

test('passing a pipe scores one point', () => {
  const game = createGame({ rng: createRng(7) });
  flap(game);
  const [first] = game.pipes;
  // Place the pipe just ahead of the bird, with the bird aligned on the gap.
  first.x = game.bird.x - FLAPPY.PIPE_WIDTH + 2;
  game.bird.y = first.gapY;
  game.bird.vy = 0;
  update(game, DT);
  assert.equal(game.score, 1);
  assert.equal(first.passed, true);
  update(game, DT);
  assert.equal(game.score, 1, 'the same pipe is not counted twice');
});

test('flying into a pipe body ends the run', () => {
  const game = createGame({ rng: createRng(7) });
  flap(game);
  const [first] = game.pipes;
  first.x = game.bird.x;
  game.bird.y = 20; // deep inside the top segment
  update(game, DT);
  assert.equal(game.status, 'dead');
});

test('hitsPipe is false when the bird is far from the pipe', () => {
  const pipe = { x: 300, gapY: 300, passed: false };
  assert.equal(hitsPipe({ x: 96, y: 300 }, pipe), false);
});

test('restart resets score, status and bird', () => {
  const game = createGame({ rng: createRng(7) });
  flap(game);
  game.score = 12;
  game.status = 'dead';
  restart(game);
  assert.equal(game.status, 'ready');
  assert.equal(game.score, 0);
  assert.equal(game.bird.vy, 0);
});
