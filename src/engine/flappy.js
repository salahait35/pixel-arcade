/**
 * Flappy Pixel — engine.
 *
 * Pure state + update functions. The renderer lives in src/ui/flappy-ui.js.
 * Units: logical pixels and seconds. The bird's x never changes; the pipes
 * scroll towards it.
 */
import { clamp } from '../shared/rng.js';

export const FLAPPY = Object.freeze({
  WIDTH: 360,
  HEIGHT: 640,
  GROUND_Y: 560,
  BIRD_X: 96,
  BIRD_SIZE: 26,
  GRAVITY: 1500,
  FLAP_VELOCITY: -420,
  MAX_FALL_SPEED: 720,
  PIPE_WIDTH: 64,
  PIPE_GAP: 150,
  PIPE_SPEED: 150,
  PIPE_SPACING: 210,
  PIPE_COUNT: 3,
  GAP_MARGIN: 60,
});

const {
  WIDTH, HEIGHT, GROUND_Y, BIRD_X, BIRD_SIZE, GRAVITY, FLAP_VELOCITY, MAX_FALL_SPEED,
  PIPE_WIDTH, PIPE_GAP, PIPE_SPEED, PIPE_SPACING, PIPE_COUNT, GAP_MARGIN,
} = FLAPPY;

export function createGame({ rng = Math.random } = {}) {
  const game = { rng };
  restart(game);
  return game;
}

export function restart(game) {
  game.status = 'ready'; // ready | playing | dead
  game.score = 0;
  game.elapsed = 0;
  game.bird = { x: BIRD_X, y: HEIGHT * 0.45, vy: 0, rotation: 0, wing: 0 };
  game.pipes = [];
  for (let i = 0; i < PIPE_COUNT; i += 1) {
    game.pipes.push(makePipe(game, WIDTH + 80 + i * PIPE_SPACING));
  }
}

function makePipe(game, x) {
  return { x, gapY: randomGapY(game.rng), passed: false };
}

function randomGapY(rng) {
  const min = GAP_MARGIN + PIPE_GAP / 2;
  const max = GROUND_Y - GAP_MARGIN - PIPE_GAP / 2;
  return Math.round(min + rng() * (max - min));
}

/** Player action: starts the run on the first flap, then pushes the bird up. */
export function flap(game) {
  if (game.status === 'dead') return;
  if (game.status === 'ready') game.status = 'playing';
  game.bird.vy = FLAP_VELOCITY;
}

export function update(game, dt) {
  game.elapsed += dt;
  const { bird } = game;

  if (game.status === 'ready') {
    bird.y = HEIGHT * 0.45 + Math.sin(game.elapsed * 4) * 8;
    bird.wing += dt;
    return;
  }
  if (game.status !== 'playing') return;

  bird.vy = Math.min(bird.vy + GRAVITY * dt, MAX_FALL_SPEED);
  bird.y += bird.vy * dt;
  bird.rotation = clamp(bird.vy / 500, -0.6, 1.3);
  bird.wing += dt;

  if (bird.y < BIRD_SIZE / 2) {
    bird.y = BIRD_SIZE / 2;
    bird.vy = 0;
  }

  for (const pipe of game.pipes) {
    pipe.x -= PIPE_SPEED * dt;
    if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
      pipe.passed = true;
      game.score += 1;
    }
    if (pipe.x + PIPE_WIDTH < 0) recyclePipe(game, pipe);
  }

  if (bird.y + BIRD_SIZE / 2 >= GROUND_Y) {
    bird.y = GROUND_Y - BIRD_SIZE / 2;
    die(game);
    return;
  }
  if (game.pipes.some((pipe) => hitsPipe(bird, pipe))) die(game);
}

/** Moves a pipe that left the screen back to the right of the furthest pipe. */
function recyclePipe(game, pipe) {
  const rightmost = Math.max(...game.pipes.map((p) => p.x));
  pipe.x = rightmost + PIPE_SPACING;
  pipe.gapY = randomGapY(game.rng);
}

/** Axis-aligned collision between the bird's box and the two pipe segments. */
export function hitsPipe(bird, pipe) {
  const half = BIRD_SIZE;
  const left = bird.x - half;
  const right = bird.x + half;
  const top = bird.y - half;
  const bottom = bird.y + half;
  if (right < pipe.x || left > pipe.x + PIPE_WIDTH) return false;
  const gapTop = pipe.gapY - PIPE_GAP / 2;
  const gapBottom = pipe.gapY + PIPE_GAP / 2;
  return top < gapTop || bottom > gapBottom;
}

function die(game) {
  game.status = 'dead';
  game.bird.vy = 0;
}
