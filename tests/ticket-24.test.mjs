import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');

function declarations(selector) {
  const patterns = {
    dark: /:root,\[data-theme="dark"\]\{([^}]*)\}/,
    light: /\[data-theme="light"\]\{(?=[^}]*--surface-page)([^}]*)\}/,
  };
  const match = css.match(patterns[selector]);
  assert.ok(match, `missing token block ${selector}`);
  return Object.fromEntries([...match[1].matchAll(/(--[\w-]+):([^;]+)/g)].map(([, key, value]) => [key, value]));
}

function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrast(foreground, background) {
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test('semantic dark and light tokens provide readable text and states', () => {
  for (const selector of ['dark', 'light']) {
    const tokens = declarations(selector);
    for (const [foreground, background] of [
      ['--text-primary', '--surface-panel'],
      ['--text-secondary', '--surface-panel'],
      ['--text-muted', '--surface-panel'],
      ['--state-danger-text', '--surface-panel'],
      ['--state-success-text', '--surface-panel'],
    ]) {
      assert.ok(tokens[foreground], `${selector} missing ${foreground}`);
      assert.ok(tokens[background], `${selector} missing ${background}`);
      assert.ok(contrast(tokens[foreground], tokens[background]) >= 4.5, `${selector}: ${foreground} on ${background}`);
    }
  }
});

test('final cascade covers dynamic FormView, export, state and focus selectors', () => {
  for (const selector of [
    '.form-field input,.form-field select', '.form-group fieldset', '.form-array-add',
    '.form-array-remove', '.form-generate-uuid', '.form-error', '.form-error-summary',
    '.form-status.error', '.form-status.success', '.form-load-button', '.form-export-dialog',
    '.form-export-name', '.form-submit:disabled', '.form-error-link:focus-visible',
  ]) assert.match(css, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(css, /::placeholder\{color:var\(--text-muted\);opacity:1\}/);
  assert.match(css, /:focus-visible[^}]*outline:2px solid var\(--focus-ring\)/);
});

test('visualization context uses an intrinsic row and preserves content flex', () => {
  assert.match(css, /\.assembly-layout,\.visualization-layout\{grid-template-rows:max-content minmax\(0,1fr\)\}/);
  assert.match(css, /\.visualization-layout>\.document-context\{min-height:0;padding-block:8px\}/);
  assert.match(css, /\.visualization-layout\{grid-template-columns:minmax\(0,3fr\) minmax\(0,7fr\)/);
  assert.match(css, /\.document-actions\{display:flex[^}]*flex-wrap:wrap/);
});

test('theme styles remain token based instead of schema-specific', () => {
  assert.match(css, /\[data-theme="light"\]\{--surface-page:/);
  assert.doesNotMatch(css, /data-form-path|data-form-uuid|wf-policies[^}]*color/);
  assert.match(css, /--surface-control/);
  assert.match(css, /--state-danger-border/);
});
