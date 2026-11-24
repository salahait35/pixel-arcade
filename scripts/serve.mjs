#!/usr/bin/env node
/**
 * Tiny static file server for local development — no dependencies.
 *
 * Browsers refuse to load ES modules from file:// URLs, so the games need an
 * HTTP origin. This serves the repository root on loopback only.
 *
 *   npm start                 → http://127.0.0.1:4173
 *   PORT=8080 npm start       → http://127.0.0.1:8080
 *
 * HOST defaults to 127.0.0.1 on purpose. Only override it if you know you want
 * other machines on your network to reach the server.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const HOST = process.env.HOST ?? '127.0.0.1';
const PORT = Number.parseInt(process.env.PORT ?? '4173', 10);

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function send(res, status, body = '', headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(body);
}

/** Resolves a URL path to a file under ROOT, or null when it escapes ROOT or targets a dotfile. */
function resolveSafe(pathname) {
  const target = resolve(ROOT, `.${pathname}`);
  const rel = relative(ROOT, target);
  if (rel.startsWith('..') || rel.split(sep).some((segment) => segment.startsWith('.'))) {
    return null;
  }
  return target;
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, `http://${HOST}`).pathname);
  } catch {
    return send(res, 400, 'Bad Request');
  }

  if (pathname.endsWith('/')) pathname += 'index.html';
  const filePath = resolveSafe(pathname);
  if (!filePath) return send(res, 403, 'Forbidden');

  const info = await stat(filePath).catch(() => null);
  if (!info) return send(res, 404, 'Not Found');
  if (info.isDirectory()) return send(res, 301, '', { Location: `${pathname}/` });

  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': CONTENT_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    send(res, 500, 'Internal Server Error');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Pixel Arcade is running at http://${HOST}:${PORT}  (Ctrl+C to stop)`);
});
