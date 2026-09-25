import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const store=new Map();
globalThis.localStorage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,String(value))};
globalThis.document={documentElement:{lang:''},dispatchEvent(){}};
const {getLanguage,setLanguage,t,typeLabel}=await import('../js/i18n.js?test');

test('EN-US is the default language and translates interface labels',()=>{assert.equal(getLanguage(),'en-US');assert.equal(t('includeChild'),'Include child');assert.equal(typeLabel('string'),'string')});
test('language switches to PT-BR and persists',()=>{setLanguage('pt-BR');assert.equal(getLanguage(),'pt-BR');assert.equal(store.get('vison-language'),'pt-BR');assert.equal(t('includeChild'),'Incluir filho');assert.equal(t('deleteTitle'),'Excluir item?')});
test('invalid language safely falls back to EN-US',()=>{assert.equal(setLanguage('fr-FR'),'en-US');assert.equal(getLanguage(),'en-US');assert.equal(t('includeChild'),'Include child')});
test('language selector exposes translated accessible label',()=>{const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(index,/data-i18n-aria-label="language"/);assert.equal(t('language'),'Language');setLanguage('pt-BR');assert.equal(t('language'),'Idioma');setLanguage('en-US');assert.equal(t('language'),'Language')});
test('Inspector actions are absent while Structure actions remain',()=>{const view=fs.readFileSync(new URL('../js/views/schema-view.js',import.meta.url),'utf8');assert.doesNotMatch(view,/class:'inspector-actions'/);assert.match(view,/tree-add-child/);assert.match(view,/tree-duplicate/);assert.match(view,/tree-delete/)});
test('main tab labels are translated in both supported languages',()=>{assert.equal(t('mainTabs'),'Main sections');assert.equal(t('assemblyTab'),'Assembly');assert.equal(t('visualizationTab'),'Visualization');assert.equal(t('codePanel'),'Code panel');setLanguage('pt-BR');assert.equal(t('mainTabs'),'Seções principais');assert.equal(t('assemblyTab'),'Montagem');assert.equal(t('visualizationTab'),'Visualização');assert.equal(t('codePanel'),'Painel de código');setLanguage('en-US')});
