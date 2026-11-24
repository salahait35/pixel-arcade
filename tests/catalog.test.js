import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAMES, GAME_IDS, findGame } from '../src/shared/catalog.js';
import { createRng } from '../src/shared/rng.js';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

test('game ids are unique', () => {
  assert.equal(new Set(GAME_IDS).size, GAME_IDS.length);
});

test('every game has the fields the hub renders', () => {
  for (const game of GAMES) {
    for (const field of ['id', 'title', 'tagline', 'controls', 'emoji', 'accent', 'href']) {
      assert.ok(game[field], `${game.id} is missing ${field}`);
    }
  }
});

test('every game page, engine and renderer exists', () => {
  for (const game of GAMES) {
    assert.ok(existsSync(resolve(ROOT, game.href)), `${game.href} is missing`);
    assert.ok(existsSync(resolve(ROOT, `src/engine/${game.id}.js`)), `engine for ${game.id} is missing`);
    assert.ok(existsSync(resolve(ROOT, `src/ui/${game.id}-ui.js`)), `renderer for ${game.id} is missing`);
  }
});

test('findGame returns null for unknown ids', () => {
  assert.equal(findGame('tetris'), null);
  assert.equal(findGame('snake').title, 'Snake');
});

test('the seeded rng is deterministic and in [0, 1)', () => {
  const a = createRng(123);
  const b = createRng(123);
  for (let i = 0; i < 100; i += 1) {
    const value = a();
    assert.equal(value, b());
    assert.ok(value >= 0 && value < 1);
  }
});
