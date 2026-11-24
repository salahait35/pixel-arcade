/**
 * Snake — engine.
 *
 * Grid-based: the snake advances one cell per tick, and ticks get shorter as
 * the score grows. Walls are solid.
 */
export const SNAKE = Object.freeze({
  COLS: 20,
  ROWS: 20,
  CELL: 24,
  START_LENGTH: 3,
  BASE_INTERVAL: 0.16, // seconds per tick at score 0
  MIN_INTERVAL: 0.06,
  SPEEDUP_PER_FOOD: 0.004,
  FOOD_POINTS: 10,
});

export const DIRECTIONS = Object.freeze({
  up: Object.freeze({ x: 0, y: -1 }),
  down: Object.freeze({ x: 0, y: 1 }),
  left: Object.freeze({ x: -1, y: 0 }),
  right: Object.freeze({ x: 1, y: 0 }),
});

const { COLS, ROWS, START_LENGTH, BASE_INTERVAL, MIN_INTERVAL, SPEEDUP_PER_FOOD, FOOD_POINTS } = SNAKE;

export function createGame({ rng = Math.random } = {}) {
  const game = { rng };
  restart(game);
  return game;
}

export function restart(game) {
  const cx = Math.floor(COLS / 2);
  const cy = Math.floor(ROWS / 2);
  game.status = 'ready'; // ready | playing | dead | won
  game.score = 0;
  game.ticks = 0;
  game.accumulator = 0;
  game.dir = DIRECTIONS.right;
  game.pendingDir = null;
  game.snake = Array.from({ length: START_LENGTH }, (_, i) => ({ x: cx - i, y: cy }));
  game.food = spawnFood(game);
}

/**
 * Queues a direction change for the next tick. A direction opposite to the
 * one the snake is heading in is ignored, because it would fold the snake
 * onto its own neck.
 *
 * The check is made against `game.dir` — the direction the snake will actually
 * move in on the next tick — and never against a queued direction. Otherwise
 * two quick presses (↑ then ← while moving right) would validate ← against ↑
 * and let the snake reverse into itself.
 */
export function setDirection(game, dir) {
  if (game.status === 'dead' || game.status === 'won') return;
  const current = game.dir;
  if (dir.x === -current.x && dir.y === -current.y) return;
  game.pendingDir = dir.x === current.x && dir.y === current.y ? null : dir;
  if (game.status === 'ready') game.status = 'playing';
}

export function start(game) {
  if (game.status === 'ready') game.status = 'playing';
}

export function tickInterval(game) {
  const foods = game.score / FOOD_POINTS;
  return Math.max(MIN_INTERVAL, BASE_INTERVAL - foods * SPEEDUP_PER_FOOD);
}

export function update(game, dt) {
  if (game.status !== 'playing') return;
  game.accumulator += dt;
  let interval = tickInterval(game);
  while (game.accumulator >= interval && game.status === 'playing') {
    game.accumulator -= interval;
    step(game);
    interval = tickInterval(game);
  }
}

/** Advances the snake by exactly one cell. */
export function step(game) {
  if (game.pendingDir) {
    game.dir = game.pendingDir;
    game.pendingDir = null;
  }
  const head = game.snake[0];
  const next = { x: head.x + game.dir.x, y: head.y + game.dir.y };
  game.ticks += 1;

  if (next.x < 0 || next.y < 0 || next.x >= COLS || next.y >= ROWS) {
    game.status = 'dead';
    return;
  }

  const eating = game.food !== null && next.x === game.food.x && next.y === game.food.y;
  // The tail cell is vacated this tick unless the snake grows, so it does not count.
  const body = eating ? game.snake : game.snake.slice(0, -1);
  if (body.some((cell) => cell.x === next.x && cell.y === next.y)) {
    game.status = 'dead';
    return;
  }

  game.snake.unshift(next);
  if (eating) {
    game.score += FOOD_POINTS;
    game.food = spawnFood(game);
    if (game.food === null) game.status = 'won';
  } else {
    game.snake.pop();
  }
}

/** Picks a random free cell for the food, or null when the board is full. */
export function spawnFood(game) {
  const occupied = new Set(game.snake.map((cell) => `${cell.x},${cell.y}`));
  const free = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(game.rng() * free.length)];
}
