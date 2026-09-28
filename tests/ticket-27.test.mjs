import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { parseFormImport, parseYaml } from '../js/services/form-import.js';
import { MAX_IMPORT_DEPTH, MAX_IMPORT_NODES } from '../js/utils.js';
import { projectValues } from '../js/views/form-view.js';

test('ticket 27: importa valores JSON e YAML exportado preservando ids conhecidos',()=>{
  assert.deepEqual(parseFormImport('{"name":"Ada","unknown":true}','.json'),{name:'Ada',unknown:true});
  assert.deepEqual(parseYaml('"name": "Ada"\n"active": false\n"tags":\n  - "one"\n  - "two"\n'),{name:'Ada',active:false,tags:['one','two']});
});

test('G6: YAML e JSON respeitam limites de complexidade antes de recursão excessiva', () => {
  const deepYaml = `${Array.from({ length: MAX_IMPORT_DEPTH + 2 }, (_, index) => `${'  '.repeat(index)}node:`).join('\n')}\ntrue`;
  assert.throws(() => parseYaml(deepYaml), /complexity|depth/i);
  const manyLines = Array.from({ length: MAX_IMPORT_NODES + 1 }, () => 'value: 1').join('\n');
  assert.throws(() => parseYaml(manyLines), /complexity|depth/i);
  const deepJson = `${'['.repeat(MAX_IMPORT_DEPTH + 2)}0${']'.repeat(MAX_IMPORT_DEPTH + 2)}`;
  assert.throws(() => parseFormImport(deepJson, '.json'), /complexity|depth/i);
});

test('G6: importações YAML/JSON rejeitam chaves inseguras, ambíguas e duplicadas', () => {
  for (const key of ['__proto__', 'prototype', 'constructor', 'a.b', '123']) {
    assert.throws(() => parseYaml(`${JSON.stringify(key)}: true`), /unsafe|ambiguous/i);
  }
  assert.throws(() => parseYaml('name: Ada\nname: Grace'), /duplicate/i);
  assert.throws(() => parseFormImport('{"__proto__":{"polluted":true}}', '.json'), /unsafe|ambiguous/i);
});

test('G6: projeção usa somente propriedades próprias previstas pelo schema', () => {
  const source = Object.create({ inherited: 'do-not-export', nested: { value: 'inherited' } });
  source.own = 'export';
  const schema = { type: 'object', properties: {
    own: { type: 'string' },
    inherited: { type: 'string' },
    nested: { type: 'object', properties: { value: { type: 'string' } } },
  } };
  assert.deepEqual(projectValues(schema, source), { own: 'export' });
});

test('ticket 27: contrato de abas, limite cinco e importação habilitada por schema',()=>{
  const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const controller=fs.readFileSync(new URL('../js/controllers/form-tabs-controller.js',import.meta.url),'utf8');
  const css=fs.readFileSync(new URL('../css/style.css',import.meta.url),'utf8');
  assert.match(index,/id="form-tabs"[^>]*role="tablist"/);assert.match(index,/id="form-load"[^>]*>＋</);assert.doesNotMatch(index,/id="form-status"/);
  assert.match(index,/id="form-import-values"[^>]*disabled/);assert.match(index,/accept="\.json,\.yaml,\.yml/);
  assert.match(controller,/this\.formTabs\.length>=5/);assert.match(controller,/closeFormTab/);assert.match(controller,/form-import-values/);assert.match(controller,/parseFormImport/);assert.match(controller,/loadValues/);
  assert.match(css,/\.form-tabs-bar/);assert.match(css,/\.form-tab-close/);
});
