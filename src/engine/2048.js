/**
 * 2048 — engine.
 *
 * The board is an array of rows; 0 means empty. Every move is normalised to a
 * leftward slide by transposing and/or reversing the rows first.
 */
export const BOARD_SIZE = 4;
export const WIN_TILE = 2048;

export function createGame({ rng = Math.random, size = BOARD_SIZE } = {}) {
  const game = { rng, size };
  restart(game);
  return game;
}

export function restart(game) {
  game.board = Array.from({ length: game.size }, () => Array(game.size).fill(0));
  game.score = 0;
  game.moves = 0;
  game.won = false;
  game.status = 'playing'; // playing | over
  game.lastSpawn = null;
  spawnTile(game);
  spawnTile(game);
}

export function emptyCells(board) {
  const cells = [];
  board.forEach((row, r) => row.forEach((value, c) => {
    if (value === 0) cells.push({ r, c });
  }));
  return cells;
}

/** Places a 2 (90 %) or a 4 (10 %) on a random empty cell. */
export function spawnTile(game) {
  const empties = emptyCells(game.board);
  if (empties.length === 0) return null;
  const cell = empties[Math.floor(game.rng() * empties.length)];
  const value = game.rng() < 0.9 ? 2 : 4;
  game.board[cell.r][cell.c] = value;
  game.lastSpawn = { ...cell, value };
  return game.lastSpawn;
}

/**
 * Slides one row to the left and merges equal neighbours.
 * Returns the new row plus the points gained.
 */
export function slideLine(line) {
  const tiles = line.filter((value) => value !== 0);
  const out = [];
  let gained = 0;
  for (const value of tiles) {
    if (out.length > 0 && out[out.length - 1] === value) {
      out[out.length - 1] = value * 2;
      gained += value * 2;
    } else {
      out.push(value);
    }
  }
  while (out.length < line.length) out.push(0);
  return { line: out, gained };
}

function transpose(rows) {
  return rows[0].map((_, c) => rows.map((row) => row[c]));
}

/**
 * Applies a move ('left' | 'right' | 'up' | 'down').
 * Returns true when the board changed (and a tile was spawned).
 */
export function move(game, direction) {
  if (game.status !== 'playing') return false;
  const before = JSON.stringify(game.board);

  let rows = game.board.map((row) => row.slice());
  const vertical = direction === 'up' || direction === 'down';
  const reversed = direction === 'right' || direction === 'down';
  if (vertical) rows = transpose(rows);
  if (reversed) rows = rows.map((row) => row.reverse());

  let gained = 0;
  rows = rows.map((row) => {
    const result = slideLine(row);
    gained += result.gained;
    return result.line;
  });

  if (reversed) rows = rows.map((row) => row.reverse());
  if (vertical) rows = transpose(rows);

  if (JSON.stringify(rows) === before) return false;

  game.board = rows;
  game.score += gained;
  game.moves += 1;
  if (!game.won && highestTile(game.board) >= WIN_TILE) game.won = true;
  spawnTile(game);
  if (!canMove(game.board)) game.status = 'over';
  return true;
}

export function canMove(board) {
  if (emptyCells(board).length > 0) return true;
  const size = board.length;
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const value = board[r][c];
      if (c + 1 < size && board[r][c + 1] === value) return true;
      if (r + 1 < size && board[r + 1][c] === value) return true;
    }
  }
  return false;
}

export function highestTile(board) {
  return Math.max(...board.flat());
}
