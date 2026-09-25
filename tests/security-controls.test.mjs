import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('repository ignores local secrets, dependencies and generated artifacts', () => {
  const gitignore = fs.readFileSync(new URL('../.gitignore', import.meta.url), 'utf8');
  const entries = gitignore.split(/\r?\n/);
  for (const entry of ['node_modules/', '.env', '*.log', 'coverage/', 'dist/']) assert.ok(entries.includes(entry), `missing ${entry}`);
});

test('import path uses bounded parser and server security headers', () => {
  const utils = fs.readFileSync(new URL('../js/utils.js', import.meta.url), 'utf8');
  const controller = fs.readFileSync(new URL('../js/controllers/app-controller.js', import.meta.url), 'utf8');
  const server = fs.readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');
  assert.match(utils, /MAX_IMPORT_(BYTES|DEPTH|NODES)/);
  assert.match(controller, /parseImportedSchema/);
  assert.match(server, /Content-Security-Policy/);
  assert.match(server, /X-Frame-Options/);
});
