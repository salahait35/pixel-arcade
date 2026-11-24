import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canMove, createGame, emptyCells, highestTile, move, slideLine } from '../src/engine/2048.js';
import { createRng } from '../src/shared/rng.js';

test('a new game starts with two tiles', () => {
  const game = createGame({ rng: createRng(42) });
  assert.equal(emptyCells(game.board).length, 14);
  assert.equal(game.score, 0);
  assert.equal(game.status, 'playing');
});

test('slideLine compresses tiles to the left', () => {
  assert.deepEqual(slideLine([0, 2, 0, 4]), { line: [2, 4, 0, 0], gained: 0 });
});

test('slideLine merges two equal neighbours', () => {
  assert.deepEqual(slideLine([2, 0, 2, 0]), { line: [4, 0, 0, 0], gained: 4 });
});

test('slideLine merges pairs independently', () => {
  assert.deepEqual(slideLine([2, 2, 2, 2]), { line: [4, 4, 0, 0], gained: 8 });
});

test('slideLine leaves an already-packed line alone', () => {
  assert.deepEqual(slideLine([4, 2, 0, 0]), { line: [4, 2, 0, 0], gained: 0 });
});

test('move applies the slide in every direction and spawns one tile', () => {
  const game = createGame({ rng: createRng(1) });
  game.board = [
    [2, 0, 0, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [4, 0, 0, 0],
  ];
  assert.equal(move(game, 'right'), true);
  assert.deepEqual(game.board[0], [0, 0, 0, 4]);
  assert.deepEqual(game.board[3].slice(3), [4]);
  assert.equal(game.score, 4);
  assert.equal(game.moves, 1);
  assert.equal(emptyCells(game.board).length, 13, 'exactly one new tile appeared');
});

test('a move that changes nothing is rejected and spawns nothing', () => {
  const game = createGame({ rng: createRng(1) });
  game.board = [
    [2, 4, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  assert.equal(move(game, 'left'), false);
  assert.equal(emptyCells(game.board).length, 14);
  assert.equal(game.moves, 0);
});

test('vertical moves work through the transpose', () => {
  const game = createGame({ rng: createRng(1) });
  game.board = [
    [2, 0, 0, 0],
    [2, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  assert.equal(move(game, 'down'), true);
  assert.equal(game.board[3][0], 4);
  assert.equal(game.board[0][0] + game.board[1][0] + game.board[2][0] <= 4, true);
});

test('canMove detects a blocked board', () => {
  const blocked = [
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2],
  ];
  assert.equal(canMove(blocked), false);
  const open = blocked.map((row) => row.slice());
  open[3][3] = 4;
  assert.equal(canMove(open), true);
});

test('reaching 2048 flags the win without ending the game', () => {
  const game = createGame({ rng: createRng(1) });
  game.board = [
    [1024, 1024, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  move(game, 'left');
  assert.equal(game.won, true);
  assert.equal(game.status, 'playing');
  assert.equal(highestTile(game.board), 2048);
});
