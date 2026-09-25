import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SchemaModel } from '../js/models/schema-model.js';
import { storageService } from '../js/services/storage-service.js';

test('invalid backups survive load and subsequent autosave byte for byte', () => {
  for (const raw of ['{', 'null', '[]', JSON.stringify({type:'object',required:{},properties:{name:{type:'string'}}}), JSON.stringify({type:'object',properties:{nested:{type:'string',enum:{}}}}), JSON.stringify({type:'array',items:{type:'string',examples:42}})]) {
    let saved = raw;
    globalThis.localStorage = {getItem:()=>saved,setItem:(_,value)=>{saved=value;}};
    assert.equal(storageService.load(),null);
    assert.equal(storageService.getStatus().ok,false);
    assert.equal(storageService.save(new SchemaModel().schema()).ok,false);
    assert.equal(saved,raw);
  }
});
test('valid backup restores and allows subsequent saves', () => {
  let saved=JSON.stringify({type:'object',properties:{name:{type:'string'}},required:['name']});
  globalThis.localStorage={getItem:()=>saved,setItem:(_,value)=>{saved=value;}};
  const model=new SchemaModel();model.importSchema(storageService.load());
  assert.equal(model.root.children[0].required,true);
  assert.equal(storageService.save(model.schema()).ok,true);
});
test('invalid import is atomic, including nested invalid required', () => {
  const model=new SchemaModel(), before=model.schema(), history=model.history.length;
  assert.throws(()=>model.importSchema({type:'object',properties:{x:{type:'object',required:{}}}}));
  assert.deepEqual(model.schema(),before);
  assert.equal(model.history.length,history);
});
