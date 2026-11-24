/**
 * Exercises scripts/serve.mjs end to end on an ephemeral loopback port:
 * loopback bind, content types, dotfile and traversal refusal, method filter.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('../scripts/serve.mjs', import.meta.url));

async function startServer(port) {
  const child = spawn(process.execPath, [SCRIPT], { env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  let banner = '';
  while (!banner.includes('running')) {
    const [chunk] = await once(child.stdout, 'data');
    banner += chunk.toString();
  }
  return { child, banner };
}

test('serve.mjs serves the arcade on loopback only', async () => {
  const port = 4300 + Math.floor(Math.random() * 500);
  const { child, banner } = await startServer(port);
  try {
    assert.match(banner, /http:\/\/127\.0\.0\.1:/, 'binds to 127.0.0.1 by default');
    const base = `http://127.0.0.1:${port}`;

    const home = await fetch(`${base}/`);
    assert.equal(home.status, 200);
    assert.match(home.headers.get('content-type'), /text\/html/);
    assert.match(await home.text(), /Pixel Arcade/);

    const module = await fetch(`${base}/src/engine/2048.js`);
    assert.equal(module.status, 200);
    assert.match(module.headers.get('content-type'), /text\/javascript/);

    const css = await fetch(`${base}/styles.css`);
    assert.match(css.headers.get('content-type'), /text\/css/);

    const dotfile = await fetch(`${base}/.gitignore`);
    assert.equal(dotfile.status, 403, 'dotfiles are not served');

    const traversal = await fetch(`${base}/..%2f..%2fetc/passwd`);
    assert.ok([400, 403, 404].includes(traversal.status), 'path traversal is refused');

    const missing = await fetch(`${base}/nope.html`);
    assert.equal(missing.status, 404);

    const post = await fetch(`${base}/`, { method: 'POST' });
    assert.equal(post.status, 405);

    const dir = await fetch(`${base}/games`, { redirect: 'manual' });
    assert.equal(dir.status, 301);
    assert.equal(dir.headers.get('location'), '/games/');
  } finally {
    child.kill();
  }
});
