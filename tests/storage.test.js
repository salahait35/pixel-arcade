import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScoreStore, memoryStorage } from '../src/shared/storage.js';

test('best is 0 for a game that was never played', () => {
  const store = createScoreStore(memoryStorage());
  assert.equal(store.best('snake'), 0);
});

test('submit records a first score', () => {
  const store = createScoreStore(memoryStorage());
  assert.equal(store.submit('snake', 5), true);
  assert.equal(store.best('snake'), 5);
});

test('submit keeps the higher score', () => {
  const store = createScoreStore(memoryStorage());
  store.submit('snake', 5);
  assert.equal(store.submit('snake', 3), false);
  assert.equal(store.best('snake'), 5);
  assert.equal(store.submit('snake', 7), true);
  assert.equal(store.best('snake'), 7);
});

test('scores are kept per game', () => {
  const store = createScoreStore(memoryStorage());
  store.submit('snake', 5);
  store.submit('pong', 3);
  assert.equal(store.best('snake'), 5);
  assert.equal(store.best('pong'), 3);
});

test('reset and resetAll clear scores', () => {
  const store = createScoreStore(memoryStorage());
  store.submit('snake', 5);
  store.submit('pong', 3);
  store.reset('snake');
  assert.equal(store.best('snake'), 0);
  store.resetAll(['pong']);
  assert.equal(store.best('pong'), 0);
});

test('corrupted values read as 0', () => {
  const storage = memoryStorage();
  storage.setItem('pixel-arcade:best:snake', 'not-a-number');
  const store = createScoreStore(storage);
  assert.equal(store.best('snake'), 0);
});
