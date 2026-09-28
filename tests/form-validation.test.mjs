import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { getUnsupportedSchemaKeywords, initializeFormValues, normalizeFormPath, validateFormData } from '../js/services/form-validation.js';
import { FormView, generateUuidV4, isUuidEligible } from '../js/views/form-view.js';
import { FORMAT_OPTIONS } from '../js/views/schema-view.js';
import { setLanguage, t } from '../js/i18n.js';

const schema={type:'object',required:['name','age'],properties:{name:{type:'string',default:'Ada',minLength:3,maxLength:8,pattern:'^[A-Z].*'},age:{type:'integer',minimum:18,maximum:120},role:{type:'string',enum:['admin','user']},active:{type:'boolean',default:true},tags:{type:'array',items:{type:'string',minLength:2}}}};

test('form initialization clones defaults without mutating schema',()=>{const values=initializeFormValues(schema);assert.deepEqual(values,{name:'Ada',active:true,tags:[]});values.name='Grace';assert.equal(schema.properties.name.default,'Ada')});
test('form validation reports required, range, length, pattern and enum paths',()=>{const errors=validateFormData(schema,{name:'a',age:12,role:'guest'});assert.deepEqual(errors.map(error=>error.keyword),['minLength','pattern','minimum','enum']);const required=validateFormData(schema,{});assert.deepEqual(required.map(error=>error.path),['name','age'])});
test('form validation accepts valid nested object and homogeneous array',()=>{assert.deepEqual(validateFormData(schema,{name:'Ada',age:37,role:'admin',tags:['js','ui']}),[])});
test('unsupported schema keywords are reported instead of silently reduced',()=>{assert.deepEqual(getUnsupportedSchemaKeywords({type:'object',properties:{x:{$ref:'#/$defs/x'}},prefixItems:[]}),['$ref','prefixItems'])});
test('form validation distinguishes null, false, zero and empty strings',()=>{const typed={type:'object',properties:{nullable:{type:'null'},flag:{type:'boolean'},count:{type:'number'},text:{type:'string',minLength:2}}};assert.deepEqual(validateFormData(typed,{nullable:null,flag:false,count:0,text:''}).map(error=>error.keyword),['minLength'])});
test('uuid format is supported while unknown formats remain rejected',()=>{assert.deepEqual(getUnsupportedSchemaKeywords({type:'string',format:'uuid'}),[]);assert.deepEqual(getUnsupportedSchemaKeywords({type:'string',format:'binary'}),['format:binary'])});
test('format Inspector exposes the 19 technical codes and descriptions',()=>{
  assert.equal(FORMAT_OPTIONS.length,19);
  assert.deepEqual(FORMAT_OPTIONS.map(option=>option.code),['email','date-time','uuid','date','time','uri','ipv4','hostname','uri-reference','duration','ipv6','regex','idn-email','idn-hostname','uri-template','json-pointer','relative-json-pointer','iri','iri-reference']);
  assert.ok(FORMAT_OPTIONS.every(option=>option.short&&option.description));
  const source=fs.readFileSync(new URL('../js/views/schema-view.js',import.meta.url),'utf8');
  assert.match(source,/type:'format'/);assert.match(source,/field-format-description/);assert.match(source,/aria-describedby/);assert.match(source,/addEventListener\('change'/);
});
test('date, date-time, IPv4 and IPv6 reject malformed values',()=>{
  const cases=[['date','2024-02-30'],['date-time','2024-13-01T25:61:61Z'],['ipv4','256.1.1.1'],['ipv6','gggg::1']];
  for(const [format,value] of cases)assert.equal(validateFormData({type:'string',format},value).at(0)?.keyword,'format');
  assert.deepEqual(validateFormData({type:'string',format:'date'},'2024-02-29'),[]);
  assert.deepEqual(validateFormData({type:'string',format:'ipv4'},'192.168.0.1'),[]);
});
test('workflow-shaped nested schema preserves object required arrays and descriptions',()=>{
  const workflow={type:'object',properties:{'wf-policies':{type:'object',description:'Políticas do workflow.',properties:{mandatory_security_for_code_changes:{type:'boolean',description:'Segurança obrigatória.'}},required:['mandatory_security_for_code_changes']},'wf-agents':{type:'array',description:'Lista de agentes.',items:{type:'object',properties:{'ag-id':{type:'string',description:'Identificador.'},'ag-skills':{type:'array',items:{type:'string'}}},required:['ag-id','ag-skills']}}},required:['wf-policies','wf-agents']};
  assert.deepEqual(getUnsupportedSchemaKeywords(workflow),[]);assert.deepEqual(initializeFormValues(workflow),{ 'wf-policies':{}, 'wf-agents':[] });
  const source=fs.readFileSync(new URL('../js/views/form-view.js',import.meta.url),'utf8');assert.doesNotMatch(source,/\.\.\.child,required:/);assert.match(source,/schema\.required/);assert.match(source,/fieldRequired/);
});

test('form rendering keeps error directly after control and describes it accessibly',()=>{
  const source=fs.readFileSync(new URL('../js/views/form-view.js',import.meta.url),'utf8');
  assert.match(source,/field\.append\(label,controlRow,error\);if\(description\)field\.append\(description\)/);
  assert.match(source,/aria-describedby/); assert.match(source,/descriptionId/); assert.match(source,/errorId/);
});

test('form empty state is one composed i18n region and booleans have dedicated layout',()=>{
  const source=fs.readFileSync(new URL('../js/views/form-view.js',import.meta.url),'utf8');
  const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const css=fs.readFileSync(new URL('../css/style.css',import.meta.url),'utf8');
  assert.match(source,/class:'form-empty-title'/); assert.match(source,/class:'form-empty-help'/);
  assert.doesNotMatch(index,/id="form-status"/); assert.match(index,/class="form-help"[^>]*hidden/);
  assert.match(source,/status\.hidden=false/); assert.match(source,/help\.hidden=false/);
  assert.match(css,/\.form-field\.boolean-field\{/); assert.match(css,/\.form-field\.boolean-field input\[type="checkbox"\]\{[^}]*appearance:auto/);
  assert.match(css,/\.form-field\.boolean-field input\[type="checkbox"\]\{[^}]*width:auto/);
});

test('array paths use one canonical dotted form across validation and focus',()=>{
  assert.equal(normalizeFormPath('tags[0]'),'tags.0');
  const errors=validateFormData({type:'object',properties:{tags:{type:'array',items:{type:'string',minLength:3}}}},{tags:['x']});
  assert.deepEqual(errors.map(error=>error.path),['tags.0']);
  const controller=fs.readFileSync(new URL('../js/controllers/app-controller.js',import.meta.url),'utf8');
  assert.match(controller,/normalizeFormPath\(value\)/);
});

test('local errors expose invalid state while global summary remains navigable support',()=>{
  const source=fs.readFileSync(new URL('../js/views/form-view.js',import.meta.url),'utf8');
  const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(source,/fieldErrors\.map\(error=>error\.message\)\.join\(' '\)/);
  assert.match(source,/toggleAttribute\('aria-invalid',invalid\)/);
  assert.match(source,/formErrorSummary/); assert.match(source,/formErrorLink/); assert.match(source,/scrollIntoView/);
  assert.doesNotMatch(source,/summary\.append\(el\('div',\{\},`\$\{error\.path\}: \$\{error\.message\}`\)\)/);
  assert.match(index,/id="form-error-summary"[^>]*role="status"[^>]*aria-live="polite"/);
});

test('global error summary is native collapsible support and form scroll chain is flexible',()=>{
  const source=fs.readFileSync(new URL('../js/views/form-view.js',import.meta.url),'utf8');
  const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const css=fs.readFileSync(new URL('../css/style.css',import.meta.url),'utf8');
  assert.match(index,/id="form-error-summary"[^>]*class="form-error-summary"[^>]*role="status"/);
  assert.match(index,/class="form-content"[\s\S]*id="form-root"/);
  assert.match(source,/const wasOpen=summary\.open/); assert.match(source,/summary\.open=wasOpen/); assert.match(source,/summary\.open=false/);
  assert.match(source,/el\('summary'/); assert.match(source,/formErrorCount/);
  assert.match(css,/\.form-panel\{display:flex;flex-direction:column;min-height:0\}/);
  assert.match(css,/\.form-content\{flex:1 1 auto;min-height:0;overflow:auto/);
  assert.match(css,/\.form-actions\{[^}]*flex:0 0 auto/);
});

test('Inspector and FormView share one native checkbox contract without glyph pseudo-elements',()=>{
  const schemaView=fs.readFileSync(new URL('../js/views/schema-view.js',import.meta.url),'utf8');
  const formView=fs.readFileSync(new URL('../js/views/form-view.js',import.meta.url),'utf8');
  const css=fs.readFileSync(new URL('../css/style.css',import.meta.url),'utf8');
  assert.match(schemaView,/type:'checkbox',class:'vison-checkbox'/);
  assert.match(formView,/type:'checkbox',class:'vison-checkbox'/);
  assert.match(css,/\.vison-checkbox\{[^}]*appearance:auto[^}]*width:auto[^}]*height:auto[^}]*accent-color:var\(--accent\)/);
  assert.match(css,/\.vison-checkbox:hover/); assert.match(css,/\.vison-checkbox:focus-visible/);
  assert.match(css,/\.vison-checkbox:active/); assert.match(css,/\.vison-checkbox:disabled/);
  assert.doesNotMatch(css,/input\[type="checkbox"\]:checked::after/);
  assert.doesNotMatch(css,/\.vison-checkbox:checked::after/);
  assert.doesNotMatch(css,/\.vison-checkbox\{[^}]*width:100%/);
  assert.match(css,/\.form-field\.boolean-field input\.vison-checkbox\{[^}]*width:auto/);
});

test('UUID eligibility depends exclusively on format uuid and string type',()=>{
  for(const name of ['id','ID','ag-id','user_id','identifier'])assert.equal(isUuidEligible(name,{type:'string',format:'uuid'}),true);
  for(const [name,schema] of [['id',{type:'string'}],['id',{type:'string',format:'email'}],['id',{type:'number',format:'uuid'}],['id',{type:'array',format:'uuid'}],['id',{type:'string',format:'uuid',enum:['a']}],['field_identifier',{type:'string',format:'hostname'}]])assert.equal(isUuidEligible(name,schema),false);
});

test('UUID v4 uses randomUUID or a correctly masked getRandomValues fallback',()=>{
  const native=generateUuidV4({randomUUID:()=> '550e8400-e29b-41d4-a716-446655440000'});assert.equal(native,'550e8400-e29b-41d4-a716-446655440000');
  const fallback=generateUuidV4({getRandomValues(bytes){bytes.fill(0xff);return bytes}});assert.match(fallback,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.throws(()=>generateUuidV4({}),/secure crypto unavailable/);
});

test('array removal has an explicit value/action anchor for nested responsive items',()=>{
  const source=fs.readFileSync(new URL('../js/views/form-view.js',import.meta.url),'utf8');
  const css=fs.readFileSync(new URL('../css/style.css',import.meta.url),'utf8');
  assert.match(source,/form-array-value/);assert.match(source,/form-array-item-actions/);assert.match(source,/form-array-complex-item/);assert.match(source,/data-form-remove/);assert.match(source,/type:'button'/);
  assert.match(css,/\.form-array-item\{[^}]*grid-template-columns:minmax\(0,1fr\) max-content/);assert.match(css,/\.form-array-value\{[^}]*min-width:0/);assert.match(css,/\.form-array-item-actions\{/);assert.match(css,/@media\(max-width:650px\)\{\.form-array-item\{grid-template-columns:minmax\(0,1fr\)/);
});

test('UUID action preserves confirmation/cancel focus and updates through FormView update',()=>{
  const source=fs.readFileSync(new URL('../js/views/form-view.js',import.meta.url),'utf8');
  const controller=fs.readFileSync(new URL('../js/controllers/app-controller.js',import.meta.url),'utf8');
  assert.match(source,/globalThis\.confirm/);assert.match(source,/control\.focus\(\)/);assert.match(source,/this\.update\(path,control\)/);assert.match(source,/formUuidUnavailable/);assert.match(source,/data-form-uuid/);assert.match(source,/\.focus\(\)/);
  assert.match(controller,/data-form-uuid/);assert.match(controller,/generateUuid\(pathOf\(uuid\.dataset\.formUuid\)\)/);
});

test('UUID and array actions expose both localized labels',()=>{
  setLanguage('en-US');assert.equal(t('formGenerateUuid'),'Generate UUID');assert.equal(t('formRemoveItemLabel',{path:'tags.0'}),'Remove item tags.0');
  setLanguage('pt-BR');assert.equal(t('formGenerateUuid'),'Gerar UUID');assert.equal(t('formRemoveItemLabel',{path:'tags.0'}),'Remover item tags.0');setLanguage('en-US');
});

test('ticket 17 preserves FormView state and uses one centralized i18n refresh mechanism',()=>{
  const source=fs.readFileSync(new URL('../js/views/form-view.js',import.meta.url),'utf8');
  const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
  const css=fs.readFileSync(new URL('../css/style.css',import.meta.url),'utf8');
  assert.match(source,/refreshLanguage\(\)/);assert.match(source,/setStatus\(this\.statusKey,this\.statusKind\)/);
  assert.match(source,/summaryWasOpen/);assert.match(source,/focusPath/);assert.match(source,/focusUuid/);
  assert.match(app,/document\.addEventListener\('languagechange',\(\)=>\{applyTranslations\(\);view\.render\(\);formView\.refreshLanguage\(\)\}\)/);
  assert.equal((app.match(/document\.addEventListener\('languagechange'/g)||[]).length,1);
  assert.match(css,/\.form-toolbar button,\.form-array-add,\.form-array-remove,\.form-submit,\.form-generate-uuid\{/);
  assert.match(css,/\.form-generate-uuid:hover/);assert.match(css,/\.form-generate-uuid:active/);assert.match(css,/\.form-generate-uuid:focus-visible/);assert.match(css,/\.form-generate-uuid:disabled/);
});

test('dynamic language refresh updates rendered action text without mixing locales',()=>{
  let rendered='';let statusKey='';let statusKind='';let renders=0;let focused=false;
  const fake={statusKey:'formLoaded',statusKind:'success',root:{querySelector(){return {focus(){focused=true}}}},render(){renders+=1;rendered=t('formGenerateUuid')+'|'+t('formAddItem')+'|'+t('formRemoveItem')},setStatus(key,kind){statusKey=key;statusKind=kind}};
  const previousDocument=globalThis.document;globalThis.document={activeElement:null,querySelector(){return null}};
  try{setLanguage('pt-BR');FormView.prototype.refreshLanguage.call(fake);assert.equal(rendered,'Gerar UUID|Adicionar item|Remover item');assert.equal(statusKey,'formLoaded');assert.equal(statusKind,'success');assert.equal(renders,1);setLanguage('en-US');FormView.prototype.refreshLanguage.call(fake);assert.equal(rendered,'Generate UUID|Add item|Remove item');assert.equal(focused,false)}finally{globalThis.document=previousDocument}
});
