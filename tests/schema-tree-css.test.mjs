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

test('schema tree reserves one non-interactive toggle slot for every node', () => {
  const view=fs.readFileSync(new URL('../js/views/schema-view.js', import.meta.url),'utf8');
  assert.match(view,/const toggle=hasChildren\?el\('button'/);
  assert.match(view,/:el\('span',\{class:'tree-toggle-placeholder','aria-hidden':'true'\}\)/);
  assert.match(view,/main\.append\(toggle,el\('span',\{class:`type-dot/);
  assert.doesNotMatch(view,/tree-toggle-placeholder[^\n]*tabIndex/);
  assert.match(css,/\.tree-row-main\{[^}]*--tree-toggle-slot:18px[^}]*grid-template-columns:var\(--tree-toggle-slot\) var\(--tree-marker-slot\) minmax\(0,1fr\) minmax\(0,max-content\)/);
  assert.match(css,/\.tree-toggle,\.tree-toggle-placeholder\{[^}]*width:var\(--tree-toggle-slot\)[^}]*min-width:var\(--tree-toggle-slot\)/);
  assert.match(css,/\.tree-toggle-placeholder\{[^}]*pointer-events:none/);
});

test('tree row actions remain bounded and responsive without changing hierarchy indent', () => {
  const view=fs.readFileSync(new URL('../js/views/schema-view.js', import.meta.url),'utf8');
  assert.match(view,/row\.append\(actions\)/); assert.match(view,/role:'group'/); assert.match(view,/hidden:!expanded/);
  assert.match(css,/\.tree-row-actions\{[^}]*flex-wrap:wrap[^}]*min-width:0[^}]*max-width:100%[^}]*overflow:hidden/);
  assert.match(css,/\.tree-children\{padding-left:17px;border-left:1px solid #2d3a4e;margin-left:15px\}/);
  assert.match(css,/@media\(max-width:650px\)\{\.tree-row-main\{[^}]*grid-template-columns:var\(--tree-toggle-slot\)/);
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

test('tree toggle contract covers CA-01 through CA-04 and CA-07', () => {
  const view=fs.readFileSync(new URL('../js/views/schema-view.js', import.meta.url),'utf8');
  const controller=fs.readFileSync(new URL('../js/controllers/app-controller.js', import.meta.url),'utf8');
  assert.match(view,/hasChildren=n\.children\.length>0/);
  assert.match(view,/class:'tree-toggle'/); assert.match(view,/type:'button'/);
  assert.match(view,/action:'tree-toggle'/); assert.match(view,/aria-expanded/); assert.match(view,/aria-label/);
  assert.match(view,/role:'group'/); assert.match(view,/hidden:!expanded/);
  assert.match(view,/collapsedNodeIds=new Set\(\)/); assert.match(view,/toggleNode\(id\)/); assert.match(view,/toggle\?\.focus\(\)/);
  assert.match(controller,/const toggle=e\.target\.closest\('\.tree-toggle'\)/); assert.match(controller,/e\.stopPropagation\(\)/); assert.match(controller,/this\.view\.toggleNode\(toggle\.dataset\.nodeId\)/);
  assert.doesNotMatch(view,/expanded:/); assert.doesNotMatch(view,/model\.notify/);
});

test('tree toggle styles provide visible keyboard focus and compact layout for CA-07', () => {
  assert.match(css,/\.tree-toggle\{[^}]*display:inline-grid[^}]*width:18px[^}]*height:18px/);
  assert.match(css,/\.tree-toggle:hover/); assert.match(css,/\.tree-toggle:focus-visible/); assert.match(css,/\.tree-toggle:active/);
});

test('tree expansion remains presentation-only for CA-05 and CA-06', () => {
  const view=fs.readFileSync(new URL('../js/views/schema-view.js', import.meta.url),'utf8');
  const controller=fs.readFileSync(new URL('../js/controllers/app-controller.js', import.meta.url),'utf8');
  assert.match(view,/this\.collapsedNodeIds/); assert.match(view,/this\.model\.find\(id\)/);
  assert.match(view,/this\.renderTree\(\)/); assert.match(view,/this\.model\.schema\(\)/);
  assert.match(controller,/this\.view\.toggleNode\(toggle\.dataset\.nodeId\);return\}/);
  assert.doesNotMatch(view,/localStorage|storageService|history|dirty/);
});

test('main tabs provide the approved CA-01 through CA-08 hierarchy', () => {
  const index=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');
  assert.equal((index.match(/role="tablist"/g)||[]).length,1);
  assert.equal((index.match(/role="tab"/g)||[]).length,3);
  assert.match(index,/id="main-content"[\s\S]*class="main-tabs"/);
  assert.match(index,/class="main-shell"[\s\S]*class="main-tabs"[\s\S]*class="tab-panels"/);
  assert.match(index,/class="main-tabs"[^>]*aria-orientation="vertical"/);
  assert.match(index,/id="assembly-panel"[\s\S]*tree-panel[\s\S]*inspector-panel/);
  assert.match(index,/id="visualization-panel"[\s\S]*output-panel[\s\S]*code-panel/);
  assert.match(index,/id="assembly-tab"[^>]*aria-selected="true"[^>]*aria-controls="assembly-panel"[^>]*tabindex="0"/);
  assert.match(index,/id="visualization-tab"[^>]*aria-selected="false"[^>]*aria-controls="visualization-panel"[^>]*tabindex="-1"/);
  assert.match(index,/id="visualization-panel"[^>]*hidden/);
  assert.match(index,/id="form-panel"[^>]*hidden/);
});

test('main tabs remove the legacy Preview/Code controls and preserve unique output IDs', () => {
  const index=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');
  const controller=fs.readFileSync(new URL('../js/controllers/app-controller.js', import.meta.url),'utf8');
  for(const id of ['preview','code','messages'])assert.equal((index.match(new RegExp(`id="${id}"`,'g'))||[]).length,1);
  assert.doesNotMatch(index,/data-tab|class="segmented"/); assert.doesNotMatch(controller,/querySelectorAll\('\[data-tab\]'/);
  assert.match(controller,/bindMainTabs\(\)/); assert.match(controller,/aria-selected/); assert.match(controller,/aria-controls/);
});

test('main tabs implement CA-09 through CA-13 keyboard and focus semantics', () => {
  const controller=fs.readFileSync(new URL('../js/controllers/app-controller.js', import.meta.url),'utf8');
  assert.match(controller,/e\.key==='ArrowDown'/); assert.match(controller,/e\.key==='ArrowUp'/);
  assert.match(controller,/isMobile\(\)&&e\.key==='ArrowRight'/); assert.match(controller,/isMobile\(\)&&e\.key==='ArrowLeft'/);
  assert.match(controller,/e\.key==='Home'/); assert.match(controller,/e\.key==='End'/);
  assert.match(controller,/e\.key==='Enter'\|\|e\.key===' '/); assert.match(controller,/tab\.tabIndex=selected\?0:-1/);
  assert.match(controller,/panel\.hidden=!selected/); assert.match(controller,/active\.focus\(\)/);
});

test('main tab CSS covers CA-14 and CA-15 responsive layout and visible focus', () => {
  assert.match(css,/\.main-tabs\{/); assert.match(css,/\.main-tab:focus-visible/);
  assert.match(css,/\.main-shell\{display:grid;grid-template-columns:minmax\(150px,190px\)/);
  assert.match(css,/\.main-tabs\{display:flex;flex-direction:column/);
  assert.match(css,/\.tab-panels\{display:flex;flex:1 1 0%/);
  assert.match(css,/@media\(max-width:650px\)\{\s*\.main-shell\{display:flex;flex-direction:column\}/);
  assert.match(css,/\.assembly-layout\{grid-template-columns:minmax\(0,3fr\)/);
  assert.match(css,/\.visualization-layout\{grid-template-columns:minmax\(0,3fr\) minmax\(0,7fr\)/);
  assert.match(css,/@media\(max-width:950px\)\{\.assembly-layout,\.visualization-layout\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css,/@media\(max-width:650px\)/);
});

test('assembly and visualization panel pairs use equal desktop columns', () => {
  assert.match(css,/\.assembly-layout\{grid-template-columns:minmax\(0,3fr\) minmax\(0,7fr\)/);
  assert.match(css,/\.visualization-layout\{grid-template-columns:minmax\(0,3fr\) minmax\(0,7fr\)/);
});

test('form layout uses one full-width panel and keeps responsive padding', () => {
  assert.match(css,/\.form-layout\{grid-template-columns:minmax\(0,1fr\);width:100%;max-width:none;margin:0;\}/);
  assert.match(css,/\.form-layout \.form-panel\{width:100%;\}/);
  assert.match(css,/\.assembly-layout,\.visualization-layout,\.form-layout\{padding:10px\}/);
  const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(index,/id="form-panel"[\s\S]*class="workspace form-layout"[\s\S]*class="panel form-panel"/);
});

test('output rows group name and type, then wrap the description safely', () => {
  const view=fs.readFileSync(new URL('../js/views/schema-view.js',import.meta.url),'utf8');
  assert.match(view,/class:'preview-row-main'/);
  assert.match(view,/class:'preview-row-description'/);
  assert.match(view,/typeLabel\(node\.type\)/);
  assert.match(view,/node\.description\|\|'—'/);
  assert.doesNotMatch(view,/innerHTML/);
  assert.match(css,/\.preview-row\{[^}]*min-width:0/);
  assert.match(css,/\.preview-row-main\{[^}]*min-width:0/);
  assert.match(css,/\.preview-row-description\{[^}]*overflow-wrap:anywhere/);
});

test('form tab and panel expose the required accessible structure', () => {
  const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(index,/id="form-tab"[^>]*role="tab"[^>]*aria-controls="form-panel"/);
  assert.match(index,/id="form-panel"[^>]*role="tabpanel"[^>]*aria-labelledby="form-tab"[^>]*hidden/);
  assert.match(index,/id="form-file-input"/); assert.match(index,/id="form-root"/);
  const controller=fs.readFileSync(new URL('../js/controllers/app-controller.js',import.meta.url),'utf8');
  assert.match(controller,/form-tab|bindForm/); assert.match(controller,/form-file-input|formView/);
});

test('preview recursively carries structural depth', () => {
  const view=fs.readFileSync(new URL('../js/views/schema-view.js',import.meta.url),'utf8');
  assert.match(view,/dataset:\{depth/); assert.match(view,/renderPreviewRows|walk/);
  assert.match(css,/\.preview-row\[data-depth\]/);
});

test('desktop shell keeps document fixed and panel scrolling internal', () => {
  assert.match(css,/html,body\{height:100%;overflow:hidden\}/);
  assert.match(css,/#main-content\{display:flex;flex:1 1 0%/);
  assert.match(css,/\.tab-panel\{display:flex;flex:1 1 0%/);
  assert.match(css,/\.tab-panel\[hidden\]\{display:none\}/);
  assert.match(css,/\.workspace\{height:auto;min-height:0;flex:1 1 auto;width:100%\}/);
});

test('form schema loader is unique, translated and placed in the panel heading', () => {
  const index=fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal((index.match(/data-action="form-load"/g)||[]).length,1);
  assert.equal((index.match(/id="form-file-input"/g)||[]).length,1);
  assert.match(index,/class="panel-heading form-heading"[\s\S]*data-action="form-load"[\s\S]*id="form-file-input"/);
  assert.doesNotMatch(index,/class="form-toolbar"/);
  assert.match(index,/data-i18n="formLoad"/);
  assert.match(index,/data-i18n-title="formLoad"/);
  assert.match(index,/data-i18n-aria-label="formLoad"/);
  assert.match(css,/\.form-load-button\{[^}]*width:max-content[^}]*cursor:pointer/);
  assert.match(css,/\.form-load-button:hover/); assert.match(css,/\.form-load-button:focus-visible/);
});
