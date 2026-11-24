/**
 * Smoke test for the renderers: boots every game page against a stubbed DOM
 * and canvas, presses the keys a player would, and runs two seconds of frames.
 * It catches broken imports and runtime errors in the UI layer; pixels are not
 * checked.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memoryStorage } from '../src/shared/storage.js';

// ---------- minimal DOM / canvas stubs ----------

const listeners = new Map();
function listen(scope) {
  return (event, handler) => {
    const key = `${scope}:${event}`;
    if (!listeners.has(key)) listeners.set(key, []);
    listeners.get(key).push(handler);
  };
}
function fire(scope, event, payload = {}) {
  for (const handler of listeners.get(`${scope}:${event}`) ?? []) {
    handler({ preventDefault() {}, ...payload });
  }
}

const canvasContext = new Proxy({}, {
  get(_target, prop) {
    if (typeof prop !== 'string') return undefined;
    if (prop === 'measureText') return (value) => ({ width: String(value).length * 8 });
    if (/^create.*Gradient$/.test(prop)) return () => ({ addColorStop() {} });
    return () => {};
  },
  set() {
    return true;
  },
});

function element(id) {
  const el = {
    id,
    width: 480,
    height: 480,
    textContent: '',
    href: '',
    style: { setProperty() {} },
    classList: { add() {}, remove() {} },
    content: null,
    getContext: () => canvasContext,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 480, height: 480 }),
    focus() {},
    setPointerCapture() {},
    setAttribute() {},
    addEventListener: listen(id),
    removeEventListener() {},
    append() {},
    replaceChildren() {},
    querySelector: (selector) => element(selector),
    cloneNode: () => element(`${id}-clone`),
  };
  el.content = { firstElementChild: el };
  return el;
}

const elements = new Map();
globalThis.document = {
  getElementById: (id) => {
    if (!elements.has(id)) elements.set(id, element(id));
    return elements.get(id);
  },
};
globalThis.window = {
  addEventListener: listen('window'),
  removeEventListener() {},
  confirm: () => true,
  localStorage: memoryStorage(),
};

let frameQueue = [];
let clock = 0;
globalThis.requestAnimationFrame = (callback) => {
  frameQueue.push(callback);
  return frameQueue.length;
};
globalThis.cancelAnimationFrame = () => {};

function runFrames(count) {
  for (let i = 0; i < count; i += 1) {
    const callbacks = frameQueue;
    frameQueue = [];
    clock += 1000 / 60;
    for (const callback of callbacks) callback(clock);
  }
}

function press(key) {
  fire('window', 'keydown', { key });
  fire('window', 'keyup', { key });
}

// ---------- the games ----------

const PAGES = [
  { id: 'flappy', keys: [' ', ' ', ' '] },
  { id: 'snake', keys: ['ArrowUp', 'ArrowLeft'] },
  { id: 'breakout', keys: [' ', 'ArrowRight'] },
  { id: '2048', keys: ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'] },
  { id: 'pong', keys: [' ', 'ArrowUp'] },
];

for (const page of PAGES) {
  test(`${page.id} page boots, takes input and renders 2 s of frames`, async () => {
    await import(`../src/ui/${page.id}-ui.js`);
    runFrames(5);
    for (const key of page.keys) press(key);
    fire('game', 'pointerdown', { clientX: 100, clientY: 100, pointerId: 1 });
    fire('game', 'pointermove', { clientX: 140, clientY: 120, buttons: 1 });
    fire('game', 'pointerup', { clientX: 140, clientY: 120, pointerId: 1 });
    runFrames(120);
    press('r');
    runFrames(5);
    assert.ok(true);
  });
}

test('hub page renders the catalog and resets scores', async () => {
  await import('../src/ui/hub.js');
  fire('reset-scores', 'click');
  assert.ok(true);
});
