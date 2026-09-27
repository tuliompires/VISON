import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const files = ['index.html', 'css/style.css', 'js/app.js', 'js/i18n.js', 'js/controllers/app-controller.js', 'js/views/form-view.js'];
const source = file => fs.readFileSync(new URL(`../${file}`, import.meta.url));

test('runtime text files are valid UTF-8 and contain no mojibake markers', () => {
  for (const file of files) {
    const bytes = source(file);
    assert.doesNotThrow(() => new TextDecoder('utf-8', { fatal: true }).decode(bytes), file);
    const text = bytes.toString('utf8');
    assert.doesNotMatch(text, /[ÃÂâ�]/, file);
  }
});

test('validation summary keeps localized accents and placeholders', async () => {
  const store = new Map();
  globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)) };
  globalThis.document = { documentElement: { lang: '' }, dispatchEvent() {} };
  const { setLanguage, t } = await import('../js/i18n.js?encoding-test');
  setLanguage('pt-BR');
  assert.equal(t('formErrorCount', { count: 1 }), '1 erro(s) de validação');
  assert.match(t('formErrorSummary', { count: 1 }), /validação/);
  assert.match(t('formErrorSummary', { count: 1 }), /\{count\}|1/);
  setLanguage('en-US');
  assert.match(t('formErrorCount', { count: 1 }), /validation/);
});
