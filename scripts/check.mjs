#!/usr/bin/env node
/**
 * Lightweight quality gate, used by `npm run check` and CI:
 *   1. every JavaScript file under src/ and scripts/ parses (`node --check`);
 *   2. every game page listed in the catalog exists and loads its UI module;
 *   3. every UI module has a matching engine module.
 * Exits non-zero on the first category of failure.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const problems = [];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(m?js)$/.test(entry)) out.push(full);
  }
  return out;
}

// 1. Syntax check
const files = [...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'scripts')), ...walk(join(ROOT, 'tests'))];
for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (error) {
    problems.push(`syntax: ${relative(ROOT, file)}\n${error.stderr?.toString() ?? error.message}`);
  }
}

// 2. Catalog pages
const { GAMES } = await import(join(ROOT, 'src/shared/catalog.js'));
for (const game of GAMES) {
  const page = join(ROOT, game.href);
  if (!existsSync(page)) {
    problems.push(`catalog: ${game.id} points to a missing page (${game.href})`);
    continue;
  }
  const html = readFileSync(page, 'utf8');
  if (!html.includes(`src/ui/${game.id}-ui.js`)) {
    problems.push(`catalog: ${game.href} does not load src/ui/${game.id}-ui.js`);
  }
  // 3. Engine present
  if (!existsSync(join(ROOT, `src/engine/${game.id}.js`))) {
    problems.push(`engine: src/engine/${game.id}.js is missing`);
  }
}

if (problems.length) {
  console.error(`check: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error(`- ${p}`);
  process.exit(1);
}
console.log(`check: ${files.length} files parsed, ${GAMES.length} games wired. OK`);
