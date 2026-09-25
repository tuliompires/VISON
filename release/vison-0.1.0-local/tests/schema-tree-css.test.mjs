import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');

test('schema tree keeps type marker circular and name truncation responsive', () => {
  assert.match(css, /\.type-dot\{[^}]*flex:0 0 7px[^}]*aspect-ratio:1/);
  assert.match(css, /\.node-name\{[^}]*min-width:0/);
  assert.match(css, /\.node-name\{[^}]*overflow:hidden[^}]*text-overflow:ellipsis/);
  assert.match(css, /\.node-type\{[^}]*flex:0 0 auto/);
});

test('schema tree exposes accessible child and duplicate actions before delete', () => {
  const view=fs.readFileSync(new URL('../js/views/schema-view.js', import.meta.url),'utf8');
  const controller=fs.readFileSync(new URL('../js/controllers/app-controller.js', import.meta.url),'utf8');
  assert.match(view,/tree-add-child/); assert.match(view,/tree-duplicate/); assert.match(view,/tree-delete/); assert.match(view,/aria-label/);
  assert.match(controller,/model\.addChild\(id\)/); assert.match(controller,/model\.duplicate\(id\)/);
});

test('schema tree action group has compact semantic interaction states', () => {
  assert.match(css,/\.tree-action,\.tree-delete\{[^}]*display:inline-grid[^}]*width:22px[^}]*height:22px/);
  assert.match(css,/\.tree-action:hover/); assert.match(css,/\.tree-action:focus-visible/);
  assert.match(css,/\.tree-action:disabled,\.tree-delete:disabled/); assert.match(css,/\.tree-delete\{[^}]*border-color:#a94f63/);
});

test('tree actions share the delete base and use semantic colors', () => {
  assert.match(css,/\.tree-action,\.tree-delete\{[^}]*width:22px[^}]*height:22px[^}]*border-radius:5px[^}]*font:inherit[^}]*transition:/);
  assert.match(css,/\.tree-action:active,\.tree-delete:active/); assert.match(css,/\.tree-action:disabled,\.tree-delete:disabled/);
  assert.match(css,/\.tree-action\[data-action="tree-add-child"\]\{[^}]*#18352f[^}]*#8ff1d5/);
  assert.match(css,/\.tree-action\[data-action="tree-duplicate"\]\{[^}]*#1b2d45[^}]*#a9ccff/);
  assert.match(css,/\.tree-delete\{[^}]*#2b1d29[^}]*#ff9cab/); assert.match(css,/\.tree-delete:focus-visible/);
});

test('schema tree separates identifiers and actions into two rows', () => {
  const view=fs.readFileSync(new URL('../js/views/schema-view.js', import.meta.url),'utf8');
  assert.match(view,/tree-row-main/); assert.match(view,/tree-row-actions/);
  assert.match(css,/\.tree-row-main\{display:flex/); assert.match(css,/\.tree-row-actions\{display:flex/);
});

test('delete confirmation dialog has safe accessible defaults', () => {
  const view=fs.readFileSync(new URL('../js/views/schema-view.js', import.meta.url),'utf8');
  const controller=fs.readFileSync(new URL('../js/controllers/app-controller.js', import.meta.url),'utf8');
  assert.match(view,/confirm-overlay/); assert.match(view,/role:'dialog'/); assert.match(view,/'aria-modal':'true'/);
  assert.match(view,/aria-labelledby/); assert.match(view,/aria-describedby/); assert.match(view,/confirm:'no'/); assert.match(view,/autofocus:true/); assert.match(view,/confirm:'yes'/);
  assert.match(view,/e\.key==='Escape'/); assert.match(view,/e\.target===backdrop/); assert.match(controller,/openDeleteDialog\(node/);
  assert.match(css,/\.confirm-overlay\{/); assert.match(css,/\.delete-dialog\{/); assert.match(css,/\.delete-dialog-actions button:focus-visible/);
});

test('drag source highlight is temporary and distinct from drop targets', () => {
  const controller=fs.readFileSync(new URL('../js/controllers/app-controller.js', import.meta.url),'utf8');
  assert.match(controller,/dragState=\{selectedId/); assert.match(controller,/drag-source/); assert.match(controller,/finishDrag\(\)/);
  assert.match(controller,/dragend.*finishDrag/); assert.match(css,/\.tree-node\.drag-source\{[^}]*background:#34305f[^}]*border:1px solid #7c6cff/);
});
