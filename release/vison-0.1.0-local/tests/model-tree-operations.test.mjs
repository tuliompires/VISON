import assert from 'node:assert/strict';
import test from 'node:test';
import { SchemaModel } from '../js/models/schema-model.js';

const fixture = { type:'object', properties:{ first:{type:'string'}, second:{type:'object',properties:{child:{type:'number'}}}, third:{type:'boolean'} } };
const modelWith = () => new SchemaModel(fixture);
const idOf = (model,name) => [...model.root.children, ...model.root.children.flatMap(n=>n.children)].find(n=>n.name===name)?.id;

test('remove deletes node descendants and is undoable', () => {
  const model=modelWith(), second=idOf(model,'second');
  assert.equal(model.remove(second),true);
  assert.equal(model.find(second),null);
  assert.equal(model.schema().properties.second,undefined);
  model.undo(); assert.ok(model.find(second));
  model.redo(); assert.equal(model.find(second),null);
});

test('moveNode preserves sibling order for before and after zones', () => {
  const model=modelWith(), first=idOf(model,'first'), third=idOf(model,'third');
  assert.equal(model.moveNode(first,third,'after'),true);
  assert.deepEqual(model.root.children.map(n=>n.name),['second','third','first']);
  assert.equal(model.moveNode(first,third,'before'),true);
  assert.deepEqual(model.root.children.map(n=>n.name),['second','first','third']);
});

test('moveNode inside reparents and persists in schema', () => {
  const model=modelWith(), third=idOf(model,'third'), first=idOf(model,'first');
  assert.equal(model.moveNode(third,first,'inside'),true);
  assert.equal(model.find(first).children[0].id,third);
  assert.equal(model.schema().properties.first.type,'object');
  assert.equal(model.schema().properties.first.properties.third.type,'boolean');
});

test('moveNode rejects self, descendants, root and invalid array destinations atomically', () => {
  const model=modelWith(), second=idOf(model,'second'), child=idOf(model,'child');
  const before=JSON.stringify(model.root);
  assert.equal(model.moveNode(second,second,'inside'),false);
  assert.equal(model.moveNode(second,child,'inside'),false);
  assert.equal(model.moveNode(model.root.id,second,'inside'),false);
  assert.equal(JSON.stringify(model.root),before);
});

test('addChild creates a selected child and supports undo/redo', () => {
  const model=modelWith(), second=idOf(model,'second');
  const childId=model.addChild(second);
  assert.equal(model.selectedId,childId);
  assert.equal(model.find(second).children.at(-1).id,childId);
  assert.equal(model.schema().properties.second.properties.property.type,'string');
  model.undo(); assert.equal(model.find(second).children.length,1);
  model.redo(); assert.equal(model.find(second).children.length,2);
});

test('duplicate copies descendants with unique recursive IDs and supports undo/redo', () => {
  const model=modelWith(), second=idOf(model,'second'), original=model.find(second);
  const duplicateId=model.duplicate(second), copy=model.find(duplicateId);
  assert.equal(copy.name,'second_copy');
  assert.notEqual(copy.id,original.id);
  assert.equal(copy.parent,model.root.id);
  assert.equal(copy.children.length,1);
  assert.notEqual(copy.children[0].id,original.children[0].id);
  assert.equal(copy.children[0].parent,copy.id);
  assert.deepEqual(model.root.children.map(n=>n.name),['first','second','second_copy','third']);
  model.undo(); assert.equal(model.find(duplicateId),null);
  model.redo(); assert.ok(model.find(duplicateId));
});
