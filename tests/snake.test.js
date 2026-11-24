import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIRECTIONS, SNAKE, createGame, setDirection, spawnFood, start, step, tickInterval, update } from '../src/engine/snake.js';
import { createRng } from '../src/shared/rng.js';

test('a new snake has three segments and heads right', () => {
  const game = createGame({ rng: createRng(3) });
  assert.equal(game.status, 'ready');
  assert.equal(game.snake.length, SNAKE.START_LENGTH);
  assert.deepEqual(game.dir, DIRECTIONS.right);
  assert.ok(game.food, 'food is placed');
});

test('one step moves the head one cell in the current direction', () => {
  const game = createGame({ rng: createRng(3) });
  start(game);
  const [head] = game.snake;
  step(game);
  assert.deepEqual(game.snake[0], { x: head.x + 1, y: head.y });
  assert.equal(game.snake.length, SNAKE.START_LENGTH, 'length is unchanged without food');
});

test('eating food grows the snake and scores', () => {
  const game = createGame({ rng: createRng(3) });
  start(game);
  const [head] = game.snake;
  game.food = { x: head.x + 1, y: head.y };
  step(game);
  assert.equal(game.score, SNAKE.FOOD_POINTS);
  assert.equal(game.snake.length, SNAKE.START_LENGTH + 1);
  assert.notDeepEqual(game.food, { x: head.x + 1, y: head.y }, 'new food is spawned elsewhere');
});

test('food never spawns on the snake', () => {
  const game = createGame({ rng: createRng(11) });
  for (let i = 0; i < 200; i += 1) {
    const food = spawnFood(game);
    assert.ok(!game.snake.some((cell) => cell.x === food.x && cell.y === food.y));
  }
});

test('hitting a wall ends the game', () => {
  const game = createGame({ rng: createRng(3) });
  start(game);
  for (let i = 0; i < SNAKE.COLS; i += 1) step(game);
  assert.equal(game.status, 'dead');
});

test('a direct reversal is ignored', () => {
  const game = createGame({ rng: createRng(3) });
  start(game);
  setDirection(game, DIRECTIONS.left);
  step(game);
  assert.equal(game.status, 'playing');
  assert.deepEqual(game.dir, DIRECTIONS.right);
});

test('two quick presses cannot reverse the snake into itself', () => {
  const game = createGame({ rng: createRng(3) });
  start(game);
  const [head] = game.snake;
  // Both presses land before the next tick: ↑ then ← while moving right.
  setDirection(game, DIRECTIONS.up);
  setDirection(game, DIRECTIONS.left);
  step(game);
  assert.equal(game.status, 'playing', 'the snake must not die');
  assert.deepEqual(game.snake[0], { x: head.x, y: head.y - 1 }, 'the ← press is ignored, ↑ is kept');
});

test('a quick press back to the current direction clears the queued turn', () => {
  const game = createGame({ rng: createRng(3) });
  start(game);
  const [head] = game.snake;
  setDirection(game, DIRECTIONS.up);
  setDirection(game, DIRECTIONS.right);
  step(game);
  assert.deepEqual(game.snake[0], { x: head.x + 1, y: head.y });
});

test('turning takes effect on the next tick', () => {
  const game = createGame({ rng: createRng(3) });
  start(game);
  const [head] = game.snake;
  setDirection(game, DIRECTIONS.up);
  step(game);
  assert.deepEqual(game.snake[0], { x: head.x, y: head.y - 1 });
});

test('the snake speeds up as the score grows', () => {
  const game = createGame({ rng: createRng(3) });
  const slow = tickInterval(game);
  game.score = SNAKE.FOOD_POINTS * 10;
  assert.ok(tickInterval(game) < slow);
  game.score = SNAKE.FOOD_POINTS * 1000;
  assert.equal(tickInterval(game), SNAKE.MIN_INTERVAL, 'speed is capped');
});

test('update advances by whole ticks only', () => {
  const game = createGame({ rng: createRng(3) });
  start(game);
  const [head] = game.snake;
  update(game, tickInterval(game) * 0.5);
  assert.deepEqual(game.snake[0], head, 'half a tick does not move the snake');
  update(game, tickInterval(game) * 0.5);
  assert.deepEqual(game.snake[0], { x: head.x + 1, y: head.y });
});
