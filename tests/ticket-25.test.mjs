import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
const view = fs.readFileSync(new URL('../js/views/schema-view.js', import.meta.url), 'utf8');

function tokenBlock(theme) {
  const pattern = theme === 'dark'
    ? /:root,\[data-theme="dark"\]\{(?=[^}]*--tree-action-text)([^}]*)\}/
    : /\[data-theme="light"\]\{(?=[^}]*--tree-action-text)([^}]*)\}/;
  const match = css.match(pattern);
  assert.ok(match, `missing tree token block ${theme}`);
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

test('document context has one shared height contract in both workspaces', () => {
  assert.match(css, /\.assembly-layout,\.visualization-layout\{grid-template-rows:max-content minmax\(0,1fr\)\}/);
  assert.match(css, /\.assembly-layout>\.document-context,\.visualization-layout>\.document-context\{min-height:0;padding-block:8px;align-items:center\}/);
  assert.doesNotMatch(css, /\.visualization-layout>\.document-context\{min-height:0;padding-block:8px\}/);
  assert.match(css, /\.assembly-layout>\.document-context \.document-actions,\.visualization-layout>\.document-context \.document-actions\{align-self:center\}/);
  assert.match(css, /@media\(max-width:650px\)\{\.assembly-layout>\.document-context,\.visualization-layout>\.document-context\{padding-block:8px\}/);
});

test('950px regression gives stacked panels distinct real-height rows', () => {
  assert.match(css, /@media\(min-width:651px\) and \(max-width:950px\)\{\.assembly-layout,\.visualization-layout\{grid-template-rows:max-content minmax\(500px,max-content\) minmax\(500px,max-content\)\}/);
  assert.match(css, /\.assembly-layout>\.tree-panel,\.assembly-layout>\.inspector-panel,\.visualization-layout>\.output-panel,\.visualization-layout>\.code-panel\{height:500px;min-height:500px\}/);
  assert.doesNotMatch(css, /\.visualization-layout \.code-panel\{grid-row:2\}/);
  assert.match(css, /@media\(max-width:650px\)\{\.main-tabs/);
});

test('tree action tokens cover readable variants in dark and light themes', () => {
  for (const theme of ['dark', 'light']) {
    const tokens = tokenBlock(theme);
    for (const [text, surface] of [
      ['--tree-action-text', '--tree-action-surface'],
      ['--tree-add-text', '--tree-add-surface'],
      ['--tree-duplicate-text', '--tree-duplicate-surface'],
      ['--tree-delete-text', '--tree-delete-surface'],
      ['--tree-disabled-text', '--tree-disabled-surface'],
    ]) {
      assert.ok(tokens[text], `${theme} missing ${text}`);
      assert.ok(tokens[surface], `${theme} missing ${surface}`);
      assert.ok(contrast(tokens[text], tokens[surface]) >= 3, `${theme}: ${text} on ${surface}`);
    }
  }
});

test('tree controls cover all interaction states, variants and currentColor icon semantics', () => {
  for (const state of [':hover', ':active', ':focus-visible', ':disabled']) {
    assert.match(css, new RegExp(`\\.tree-action[^}]*${state.replace(':', '\\:')}`));
    assert.match(css, new RegExp(`\\.tree-delete[^}]*${state.replace(':', '\\:')}`));
    assert.match(css, new RegExp(`\\.tree-toggle[^}]*${state.replace(':', '\\:')}`));
  }
  for (const action of ['tree-add-child', 'tree-duplicate']) assert.match(css, new RegExp(`data-action="${action}"`));
  assert.match(css, /\.tree-delete\{color:var\(--tree-delete-text\)/);
  assert.match(css, /\.trash-icon\{color:currentColor;stroke:currentColor\}/);
  assert.match(view, /svg\.setAttribute\('aria-hidden','true'\)/);
  assert.match(view, /path\.setAttribute\('stroke','currentColor'\)/);
  assert.match(view, /class:'tree-toggle'/);
  assert.match(view, /'aria-expanded':expanded\?'true':'false'/);
});

test('dynamic tree rows retain responsive geometry without schema-specific selectors', () => {
  assert.match(css, /\.tree-row-actions\{display:flex;flex-wrap:wrap/);
  assert.match(css, /\.tree-row-main\{--tree-toggle-slot:18px/);
  assert.match(css, /@media\(max-width:650px\)\{\.tree-row-main\{/);
  assert.doesNotMatch(css, /wf-policies|ag-events|schema-specific/);
  assert.match(view, /this\.tree\.replaceChildren\(\)/);
  assert.match(view, /class:'tree-action'/);
  assert.match(view, /class:'tree-delete'/);
});
