import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { AppController } from '../js/controllers/app-controller.js';
import { SchemaModel } from '../js/models/schema-model.js';
import { serializeSchemaJson } from '../js/services/storage-service.js';
import { nodesToSchema, schemaToNodes, validateSchema } from '../js/utils.js';

const draft = 'https://json-schema.org/draft/2020-12/schema';

const exportSchema = schema => nodesToSchema(schemaToNodes(schema));

test('ticket 26 G4: download e cÃ³pia usam o mesmo serializer JSON', () => {
  const schema = exportSchema({ type: 'object', properties: { zeta: { type: 'string' }, alpha: { type: 'number' } } });
  const expected = serializeSchemaJson(schema);
  const storage = fs.readFileSync(new URL('../js/services/storage-service.js', import.meta.url), 'utf8');
  const controller = fs.readFileSync(new URL('../js/controllers/app-controller.js', import.meta.url), 'utf8');
  assert.equal(JSON.stringify(JSON.parse(expected)), JSON.stringify(schema));
  assert.match(storage, /new Blob\(\[serializeSchemaJson\(schema\)\]/);
  assert.match(controller, /copyText\(serializeSchemaJson\(this\.model\.schema\(\)\)\)/);
});

test('ticket 26: default-parameters preserva as irmãs ai-model e ai-effort em items', () => {
  const input = { $schema: draft, schemaVersion: 1, title: 'default-parameters', type: 'array', items: {
    type: 'object', properties: {
      'ai-model': { type: 'string' },
      'ai-effort': { type: 'string' }
    }, required: ['ai-model', 'ai-effort']
  } };
  const output = exportSchema(input);
  assert.deepEqual(Object.keys(output.items.properties), ['ai-model', 'ai-effort']);
  assert.deepEqual(output.items.required, ['ai-model', 'ai-effort']);
  assert.equal(output.items.properties['ai-model'].type, 'string');
  assert.equal(output.items.properties['ai-effort'].type, 'string');
});

test('ticket 26: propriedades irmãs são determinísticas em qualquer ordem e items é uma propriedade válida', () => {
  const make = properties => ({ type: 'object', properties });
  const first = exportSchema(make({ zebra: { type: 'number' }, items: { type: 'string' }, alpha: { type: 'boolean' } }));
  const second = exportSchema(make({ alpha: { type: 'boolean' }, zebra: { type: 'number' }, items: { type: 'string' } }));
  assert.deepEqual(Object.keys(first.properties), ['zebra', 'items', 'alpha']);
  assert.deepEqual(Object.keys(second.properties), ['alpha', 'zebra', 'items']);
});

test('ticket 26: objetos, arrays e aninhamento profundo preservam metadados e restrições', () => {
  const input = { $schema: draft, schemaVersion: 1, title: 'Root', type: 'object', properties: {
    config: { title: 'Config', type: 'object', required: ['entries'], properties: {
      entries: { title: 'Entries', type: 'array', items: { title: 'Entry', type: 'object', properties: {
        name: { title: 'Name', type: 'string', minLength: 2, pattern: '^[A-Z]' },
        count: { type: 'integer', minimum: 0, maximum: 10 }
      }, required: ['name'] } }
    } }
  } };
  const output = exportSchema(input);
  assert.equal(output.title, 'Root');
  assert.equal(output.properties.config.title, 'Config');
  assert.equal(output.properties.config.properties.entries.title, 'Entries');
  assert.equal(output.properties.config.properties.entries.items.title, 'Entry');
  assert.equal(output.properties.config.properties.entries.items.properties.name.title, 'Name');
  assert.equal(output.properties.config.properties.entries.items.properties.name.minLength, 2);
  assert.equal(output.properties.config.properties.entries.items.properties.name.pattern, '^[A-Z]');
  assert.equal(output.properties.config.properties.entries.items.properties.count.maximum, 10);
  assert.deepEqual(output.properties.config.required, ['entries']);
  assert.deepEqual(validateSchema(output), []);
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(output)));
});

test('ticket 26: title ausente não é inferido e metadados existentes são preservados', () => {
  const output = exportSchema({ type: 'object', properties: {
    plain: { type: 'string', description: 'kept', default: 'x', enum: ['x'], examples: ['x'], format: 'email', maxLength: 20 }
  } });
  assert.equal(Object.hasOwn(output, 'title'), false);
  assert.equal(Object.hasOwn(output.properties.plain, 'title'), false);
  assert.deepEqual(output.properties.plain, {
    schemaVersion: 1, description: 'kept', default: 'x', enum: ['x'], examples: ['x'], format: 'email', maxLength: 20, type: 'string'
  });
});

test('ticket 26: arrays com múltiplos filhos diretos não são serializados silenciosamente', () => {
  const root = schemaToNodes({ type: 'array', items: { type: 'string' } });
  root.children.push({ type: 'string', name: 'unexpected', children: [], required: false });
  assert.throws(() => nodesToSchema(root), /exactly one item schema/);
});

test('ticket 26: propriedades duplicadas falham antes de sobrescrever uma irmã', () => {
  const root = schemaToNodes({ type: 'object', properties: { original: { type: 'string' } } });
  root.children.push({ type: 'number', name: 'original', children: [], required: false });
  assert.throws(() => nodesToSchema(root), /Duplicate object property name: original/);
});

test('ticket 26 rework: nomes de propriedades inseguros falham antes de qualquer escrita', () => {
  for (const name of ['__proto__', 'constructor', 'prototype', 'a.b', '123']) {
    const root = schemaToNodes({ type: 'object', properties: { safe: { type: 'string' } } });
    root.children.push({ type: 'string', name, children: [], required: false });
    const before = JSON.stringify(root);
    assert.throws(() => nodesToSchema(root), new RegExp(`Unsafe object property name: ${name.replace('.', '\\.')}`));
    assert.equal(JSON.stringify(root), before);
  }
});

test('ticket 26 G4: exportação acompanha reordenação antes, depois e dentro', () => {
  const model = new SchemaModel({ type: 'object', properties: {
    zeta: { type: 'string' }, alpha: { type: 'object', properties: {} }, middle: { type: 'number' }
  } });
  const alpha = model.root.children.find(node => node.name === 'alpha');
  const middle = model.root.children.find(node => node.name === 'middle');
  const zeta = model.root.children.find(node => node.name === 'zeta');
  model.move(alpha.id, -1);
  assert.deepEqual(Object.keys(model.schema().properties), ['alpha', 'zeta', 'middle']);
  assert.equal(model.moveNode(middle.id, zeta.id, 'before'), true);
  assert.deepEqual(Object.keys(model.schema().properties), ['alpha', 'middle', 'zeta']);
  assert.equal(model.moveNode(zeta.id, alpha.id, 'inside'), true);
  const output = model.schema();
  assert.deepEqual(Object.keys(output.properties), ['alpha', 'middle']);
  assert.deepEqual(Object.keys(output.properties.alpha.properties), ['zeta']);
});

test('format selecionado no modelo é preservado no JSON Schema exportado',()=>{
  for(const format of ['uuid','email']){
    const output=exportSchema({type:'object',properties:{identifier:{type:'string',format}}});
    assert.equal(output.properties.identifier.format,format);
  }
});

test('ticket 26: Inspector expõe title e controller atualiza node.title sem renomear name', () => {
  const view = fs.readFileSync(new URL('../js/views/schema-view.js', import.meta.url), 'utf8');
  assert.match(view, /field\(t\('title'\),'title',this\.model\.selected\(\)\.title/);
  const model = new SchemaModel({ type: 'object', properties: { customer: { type: 'string' } } });
  const node = model.root.children[0];
  model.select(node.id);
  const controller = Object.create(AppController.prototype);
  controller.model = model;
  controller.editingField = false;
  controller.field({ target: { dataset: { field: 'title' }, type: 'text', value: 'Customer name' } });
  assert.equal(node.name, 'customer');
  assert.equal(node.title, 'Customer name');
  assert.equal(model.schema().properties.customer.title, 'Customer name');
});

test('ticket 26: object recebe dois irmãos sem substituição e preserva undo/redo', () => {
  const model = new SchemaModel({ type: 'object', properties: {} });
  assert.equal(model.add(model.root.id, 'string', 'first'), true);
  assert.equal(model.add(model.root.id, 'number', 'second'), true);
  assert.deepEqual(model.root.children.map(node => node.name), ['first', 'second']);
  model.undo();
  assert.deepEqual(model.root.children.map(node => node.name), ['first']);
  model.redo();
  assert.deepEqual(model.root.children.map(node => node.name), ['first', 'second']);
  assert.deepEqual(Object.keys(model.schema().properties), ['first', 'second']);
});

test('ticket 26: array vazio recebe único item e array ocupado não sobrescreve', () => {
  const empty = new SchemaModel({ type: 'array' });
  assert.equal(empty.add(empty.root.id, 'string', 'ignored-name'), true);
  assert.equal(empty.root.children.length, 1);
  assert.equal(empty.root.children[0].name, 'items');
  assert.equal(empty.schema().items.type, 'string');

  const occupied = new SchemaModel({ type: 'array', items: { type: 'integer' } });
  const before = JSON.stringify(occupied.root);
  const history = occupied.history.length;
  assert.equal(occupied.add(occupied.root.id, 'string', 'ignored-name'), false);
  assert.equal(occupied.addChild(occupied.root.id), false);
  assert.equal(JSON.stringify(occupied.root), before);
  assert.equal(occupied.history.length, history);
  assert.equal(occupied.schema().items.type, 'integer');
});

test('ticket 26: duplicate rejeita array ocupado sem mutação nem histórico', () => {
  const model = new SchemaModel({ type: 'array', items: { type: 'string' } });
  const item = model.root.children[0];
  const before = JSON.stringify(model.root);
  const history = model.history.length;
  assert.equal(model.duplicate(item.id), false);
  assert.equal(JSON.stringify(model.root), before);
  assert.equal(model.history.length, history);
  assert.doesNotThrow(() => model.schema());
  assert.equal(model.schema().items.type, 'string');
});

test('ticket 26: moveNode rejeita destino array ocupado sem mutação nem histórico', () => {
  const model = new SchemaModel({ type: 'object', properties: {
    list: { type: 'array', items: { type: 'string' } },
    other: { type: 'number' }
  } });
  const list = model.root.children.find(node => node.name === 'list');
  const other = model.root.children.find(node => node.name === 'other');
  const item = list.children[0];
  const before = JSON.stringify(model.root);
  const history = model.history.length;
  assert.equal(model.moveNode(other.id, item.id, 'before'), false);
  assert.equal(JSON.stringify(model.root), before);
  assert.equal(model.history.length, history);
  assert.doesNotThrow(() => model.schema());
  assert.equal(model.schema().properties.list.items.type, 'string');
});
