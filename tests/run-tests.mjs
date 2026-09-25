import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SchemaModel } from '../js/models/schema-model.js';
import { nodesToSchema, normalizeSchema, schemaToNodes, validateSchema } from '../js/utils.js';

const fixture = JSON.parse(fs.readFileSync(new URL('./fixtures/sample-schema.json', import.meta.url)));
const store = new Map();
globalThis.localStorage = { getItem:key=>store.get(key) ?? null, setItem:(key,value)=>store.set(key,String(value)), removeItem:key=>store.delete(key) };
const { storageService } = await import('../js/services/storage-service.js');
let passed = 0;
function test(name, fn) { try { fn(); passed += 1; console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}: ${error.message}`); process.exitCode = 1; } }

test('árvore converte propriedades, required e items', () => { const root=schemaToNodes(fixture); assert.equal(root.children.length,2); assert.equal(root.children[0].required,true); assert.equal(root.children[1].children[0].type,'integer'); });
test('validação aceita fixture e rejeita regex inválida', () => { assert.deepEqual(validateSchema(fixture),[]); assert.match(validateSchema({...fixture,properties:{bad:{type:'string',pattern:'['}}})[0],/regex inválida/); });
test('import/export preserva title e description', () => { const model=new SchemaModel(fixture); const out=model.schema(); assert.equal(out.title,'Fixture'); assert.equal(out.description,'Deterministic fixture'); assert.equal(out.schemaVersion,1); assert.deepEqual(out.properties.name,{schemaVersion:1,type:'string',description:'Display name'}); });
test('adicionar, undo e redo mantêm a árvore', () => { const model=new SchemaModel(fixture); const before=model.root.children.length; model.add(); assert.equal(model.root.children.length,before+1); model.undo(); assert.equal(model.root.children.length,before); model.redo(); assert.equal(model.root.children.length,before+1); });
test('storage salva, carrega, normaliza e expõe status', () => { const saved=storageService.save(fixture); assert.equal(saved.ok,true); const loaded=storageService.load(); assert.equal(loaded.title,'Fixture'); assert.equal(storageService.getStatus().ok,true); assert.equal(normalizeSchema({title:'legacy'}).schemaVersion,1); });
test('storage reporta erro de quota', () => { const original=globalThis.localStorage; globalThis.localStorage={setItem(){throw new DOMException('full','QuotaExceededError')},getItem(){return null},removeItem(){}}; const result=storageService.save(fixture); assert.equal(result.ok,false); assert.match(result.message,/quota/i); globalThis.localStorage=original; });
test('contrato de módulo não referencia highlightJson inexistente', () => { const app=fs.readFileSync(new URL('../js/app.js', import.meta.url),'utf8'); const view=fs.readFileSync(new URL('../js/views/schema-view.js', import.meta.url),'utf8'); assert.equal(app.includes('highlightJson'),false); assert.match(view,/createTextNode/); assert.equal(view.includes('innerHTML'),false); });
console.log(`RESULT ${passed}/7 testes determinísticos aprovados`);
