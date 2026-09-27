import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const index = read('index.html');
const controller = read('js/controllers/app-controller.js');
const css = read('css/style.css');

test('form validation is disabled until a schema is loaded', () => {
  assert.match(index, /id="form-submit"[^>]*disabled[^>]*aria-disabled="true"/);
  assert.match(controller, /updateFormValidationAvailability/);
  assert.match(controller, /button\.disabled=!enabled/);
  assert.match(controller, /this\.formView\.clearSchema\(\)/);
});

test('Construction is an accessible collapsible group with localized child tabs', () => {
  assert.match(index, /id="construction-toggle"[^>]*aria-expanded="true"[^>]*aria-controls="construction-tabs"/);
  assert.match(index, /id="construction-tabs"[^>]*role="group"/);
  assert.match(index, /id="assembly-tab"[^>]*data-i18n="assemblyTab"/);
  assert.match(index, /id="visualization-tab"[^>]*data-i18n="visualizationTab"/);
  assert.match(controller, /group\.hidden=!expanded/);
  assert.match(controller, /event\.key==='ArrowDown'\|\|event\.key==='ArrowRight'/);
  assert.match(css, /\.construction-tabs\{[^}]*padding-left:10px/);
});

test('document actions have one DOM owner and safe source rendering', () => {
  for (const action of ['new', 'import', 'export', 'copy', 'undo', 'redo', 'clear']) {
    assert.equal((index.match(new RegExp(`data-action="${action}"`, 'g')) || []).length, 1, action);
  }
  assert.match(index, /id="document-context"/);
  assert.match(index, /id="document-source"[^>]*data-i18n="unsavedFile"/);
  assert.match(controller, /setDocumentSource\(file\.name\)/);
  assert.doesNotMatch(controller, /webkitRelativePath|input\.value.*path|FileReader[^\n]*path/);
  assert.match(controller, /workspace\?\.prepend\(context\)/);
});

test('theme control and preference are isolated, validated, and tokenized', async () => {
  assert.match(index, /id="theme-select"/);
  assert.match(index, /data-i18n="themeDark"/);
  assert.match(index, /data-i18n="themeLight"/);
  assert.match(css, /\[data-theme="light"\]/);
  const store = new Map([['vison-theme', 'invalid'], ['vison-schema-v1', 'untouched']]);
  globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)) };
  globalThis.document = { documentElement: { dataset: {} } };
  const theme = await import('../js/services/theme-service.js?ticket-23');
  assert.equal(theme.getTheme(), 'dark');
  theme.setTheme('light');
  assert.equal(store.get('vison-theme'), 'light');
  assert.equal(store.get('vison-schema-v1'), 'untouched');
  assert.equal(globalThis.document.documentElement.dataset.theme, 'light');
});
