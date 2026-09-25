import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_IMPORT_BYTES, MAX_IMPORT_DEPTH, MAX_IMPORT_NODES, parseImportedSchema } from '../js/utils.js';

test('import rejects oversized JSON before parsing', () => {
  assert.throws(() => parseImportedSchema(' '.repeat(MAX_IMPORT_BYTES) + '{}'), /size limit/i);
});

test('import rejects excessive nesting and node count', () => {
  let nested = '{}';
  for (let index = 0; index <= MAX_IMPORT_DEPTH; index += 1) nested = `{"type":"object","properties":{"n":${nested}}}`;
  assert.throws(() => parseImportedSchema(nested), /complexity|depth/i);

  const properties = Object.fromEntries(Array.from({ length: MAX_IMPORT_NODES + 1 }, (_, index) => [`p${index}`, { type: 'string' }]));
  assert.throws(() => parseImportedSchema(JSON.stringify({ type: 'object', properties })), /complexity|nodes/i);
});

test('import reports malformed and non-object JSON safely', () => {
  assert.throws(() => parseImportedSchema('{'), /invalid JSON/i);
  assert.throws(() => parseImportedSchema('[]'), /object/i);
});
