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

test('file flows reject oversized files before FileReader.readAsText', () => {
  const controller = fs.readFileSync(new URL('../js/controllers/app-controller.js', import.meta.url), 'utf8');
  assert.match(controller, /MAX_IMPORT_BYTES/);
  assert.match(controller, /file\.size\s*>\s*MAX_IMPORT_BYTES/);
  assert.match(controller, /form-file-input/);
});

test('property names reject ambiguous and prototype-sensitive paths', async () => {
  const { validateSchema } = await import('../js/utils.js?security-names');
  for (const name of ['a.b', '0', '__proto__', 'constructor']) {
    const errors=validateSchema({type:'object',properties:{[name]:{type:'string'}}});
    assert.ok(errors.some(error=>/propriedade|nome|seguro|suport/i.test(error)), `expected rejection for ${name}`);
  }
});
