import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { buildExportFiles, normalizeExportName, normalizeFormats, readFormatPreference, serializeJson, serializeYaml, suggestExportName, writeFormatPreference } from '../js/services/form-export.js';
import { setLanguage, t } from '../js/i18n.js';

test('form export serializes a snapshot as readable JSON and safe deterministic YAML',()=>{
  const snapshot={title:'true',empty:'',date:'2026-09-26',nested:{count:3,flag:false},items:['null','#tag',null]};
  assert.match(serializeJson(snapshot),/"title": "true"/);
  const yaml=serializeYaml(snapshot);assert.match(yaml,/"title": "true"/);assert.match(yaml,/"date": "2026-09-26"/);assert.match(yaml,/"items":/);assert.doesNotMatch(yaml,/!js|!ruby|&|\*/);
  assert.equal(serializeYaml(snapshot),serializeYaml(snapshot));
});

test('form export normalizes formats with JSON fallback and persists only the preference',()=>{
  assert.deepEqual(normalizeFormats(JSON.stringify(['yaml','bad','yaml'])),['yaml']);
  assert.deepEqual(normalizeFormats('not-json'),['json']);
  const values=new Map();const storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
  assert.deepEqual(writeFormatPreference(['yaml'],storage),['yaml']);assert.deepEqual(readFormatPreference(storage),['yaml']);
  assert.equal(values.size,1);assert.equal([...values.keys()][0],'vison-form-export-formats');assert.doesNotMatch([...values.values()][0],/secret|schema|values/);
  assert.deepEqual(readFormatPreference({getItem(){throw Error('blocked')}}),['json']);
});

test('form export names use local timestamp, known extensions and reject unsafe paths',()=>{
  assert.equal(suggestExportName(new Date(2026,8,26,13,4,5)),'20260926-130405');
  assert.deepEqual(normalizeExportName('',new Date(2026,8,26,13,4,5)),{ok:true,base:'20260926-130405',suggested:true});
  assert.equal(normalizeExportName('report.json').base,'report');assert.equal(normalizeExportName('report.yaml').base,'report');
  for(const name of ['../secret','a\\b','CON','report.txt','bad?name','trailing.'])assert.equal(normalizeExportName(name).ok,false,name);
});

test('form export produces one or two local files with correct extensions and MIME',()=>{
  const files=buildExportFiles({active:true,tags:['a']},['json','yaml'],'20260926-130405');
  assert.deepEqual(files.map(file=>file.filename),['20260926-130405.json','20260926-130405.yaml']);
  assert.equal(files[0].mime,'application/json;charset=utf-8');assert.equal(files[1].mime,'application/yaml;charset=utf-8');
  assert.equal(buildExportFiles({x:1},['json'],'x').length,1);assert.match(files[0].content,/"active": true/);
});

test('form export DOM contract, focus and privacy hooks are present',()=>{
  const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const controller=fs.readFileSync(new URL('../js/controllers/app-controller.js',import.meta.url),'utf8');
  const view=fs.readFileSync(new URL('../js/views/form-view.js',import.meta.url),'utf8');
  const css=fs.readFileSync(new URL('../css/style.css',import.meta.url),'utf8');
  assert.match(index,/id="form-export-open"[^>]*disabled/);assert.match(index,/id="form-export-modal"[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(index,/aria-labelledby="form-export-title"[^>]*aria-describedby="form-export-description"/);assert.match(index,/id="form-export-json"/);assert.match(index,/id="form-export-yaml"/);assert.match(index,/id="form-export-name"/);
  assert.match(controller,/elements\.confirm\.focus\(\)/);assert.match(controller,/event\.key==='Escape'/);assert.match(controller,/this\.closeFormExport\(true\)/);assert.match(controller,/clone\(this\.formView\.values\)/);assert.match(controller,/URL\.revokeObjectURL/);assert.match(controller,/writeFormatPreference\(formats\)/);
  assert.match(view,/getExportSnapshot|exportErrorKey/);assert.match(css,/\.form-export-modal\[hidden\]\{display:none\}/);assert.match(css,/\.form-export-dialog\{[^}]*max-height:min\(100%,680px\)[^}]*overflow:auto/);
  assert.doesNotMatch(controller,/localStorage.*values|localStorage.*schema/);
});

test('form export strings are available in both languages',()=>{
  setLanguage('en-US');assert.equal(t('formExportOpen'),'Export form');assert.equal(t('formExportConfirm'),'Export');
  setLanguage('pt-BR');assert.equal(t('formExportOpen'),'Exportar formulário');assert.equal(t('formExportCancel'),'Cancelar');setLanguage('en-US');
});
