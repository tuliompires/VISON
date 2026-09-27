export const TYPES = ['object','array','string','number','integer','boolean','null'];
export const SCHEMA_VERSION = 1;
export const MAX_IMPORT_BYTES = 1024 * 1024;
export const MAX_IMPORT_DEPTH = 100;
export const MAX_IMPORT_NODES = 10000;
export const uid = () => `n_${Math.random().toString(36).slice(2,9)}${Date.now().toString(36).slice(-3)}`;
export const clone = value => JSON.parse(JSON.stringify(value));
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const prettyJson = value => JSON.stringify(value, null, 2);
export const isSafePropertyName = name => typeof name === 'string' && name.length > 0 && !name.includes('.') && !/^\d+$/.test(name) && !['__proto__','prototype','constructor'].includes(name);
export function scalarFromInput(value, type) { if (value === '') return undefined; if (type === 'boolean') return value === 'true'; if (type === 'number' || type === 'integer') return Number(value); if (type === 'null') return null; try { return JSON.parse(value); } catch { return value; } }
export function inferType(schema) { if (schema.properties) return 'object'; if (schema.items) return 'array'; if (schema.enum) return typeof schema.enum[0] === 'number' ? 'number' : 'string'; return 'string'; }
export function normalizeSchema(input) { const source = input && typeof input === 'object' && !Array.isArray(input) ? clone(input) : {}; const normalized = { ...source, schemaVersion: Number(source.schemaVersion) || SCHEMA_VERSION, type: TYPES.includes(source.type) ? source.type : inferType(source) }; if (normalized.type === 'object') normalized.properties = normalized.properties && typeof normalized.properties === 'object' && !Array.isArray(normalized.properties) ? normalized.properties : {}; if (normalized.type === 'array' && normalized.items && typeof normalized.items !== 'object') delete normalized.items; return normalized; }
export function schemaToNodes(schema, name = 'root', parent = null) { schema = normalizeSchema(schema); const node = { id: uid(), name, parent, type: schema.type, description: schema.description || '', required: false, ...schema, children: [] }; delete node.properties; delete node.items; if (node.type === 'object') Object.entries(schema.properties || {}).forEach(([key, child]) => { const c = schemaToNodes(child, key, node.id); c.required = (schema.required || []).includes(key); node.children.push(c); }); else if (node.type === 'array' && schema.items) node.children.push(schemaToNodes(schema.items, 'items', node.id)); return node; }
export function nodesToSchema(node) {
  const result = { schemaVersion: SCHEMA_VERSION };
  const allowed = ['$schema','title','description','default','enum','examples','format','minimum','maximum','minLength','maxLength','pattern'];
  allowed.forEach(k => {
    if (node[k] !== undefined && node[k] !== '' && !(Array.isArray(node[k]) && !node[k].length)) result[k] = node[k];
  });
  result.type = node.type;
  const children = Array.isArray(node.children) ? node.children : [];

  if (node.type === 'object') {
    result.properties = {};
    const required = [];
    // A ordem visual da árvore é a ordem atual de children.
    const properties = children;
    const names = new Set();
    properties.forEach(c => {
      const name = c.name || 'property';
      if (!isSafePropertyName(name)) throw new Error(`Unsafe object property name: ${name}`);
      if (names.has(name)) throw new Error(`Duplicate object property name: ${name}`);
      names.add(name);
    });
    result.properties = {};
    properties.forEach(c => {
      const name = c.name || 'property';
      result.properties[name] = nodesToSchema(c);
      if (c.required) required.push(name);
    });
    if (required.length) result.required = required;
  }

  if (node.type === 'array') {
    const itemChildren = children.filter(c => c.name === 'items');
    if (children.length > 1 || itemChildren.length > 1) {
      throw new Error('Array node must contain exactly one item schema.');
    }
    const item = itemChildren[0] || children[0];
    if (item) result.items = nodesToSchema(item);
  }
  return result;
}
export function flatten(root, out = []) { out.push(root); root.children.forEach(c => flatten(c,out)); return out; }
export function validateSchema(schema) { const errors = []; if (!schema || typeof schema !== 'object' || Array.isArray(schema)) errors.push('O documento precisa ser um objeto JSON.'); if (!schema?.type) errors.push('O schema raiz precisa declarar um tipo.'); const walk = (n,path='root') => { if (!TYPES.includes(n.type)) errors.push(`${path}: tipo inválido.`); if (n.type === 'object') Object.keys(n.properties || {}).forEach(k => { if (!isSafePropertyName(k)) errors.push(`${path}: nome de propriedade não seguro ou ambíguo: ${k}.`); walk(n.properties[k], `${path}.${k}`); }); if (n.type === 'array' && n.items) walk(n.items, `${path}.items`); if (n.type === 'integer' && n.minimum !== undefined && !Number.isInteger(n.minimum)) errors.push(`${path}: minimum deve ser inteiro.`); if (n.pattern) { try { new RegExp(n.pattern); } catch { errors.push(`${path}: regex inválida.`); } } }; if (!errors.length) walk(schema); return errors; }

export function parseImportedSchema(text) {
  if (typeof text !== 'string' || text.length > MAX_IMPORT_BYTES) throw new Error('Import size limit exceeded.');
  let schema;
  try { schema = JSON.parse(text); } catch { throw new Error('Invalid JSON.'); }
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) throw new Error('Imported schema must be an object.');
  let nodes = 0;
  const inspect = (value, depth = 0) => {
    if (++nodes > MAX_IMPORT_NODES || depth > MAX_IMPORT_DEPTH) throw new Error('Import complexity or depth limit exceeded.');
    if (value && typeof value === 'object') Object.values(value).forEach(child => inspect(child, depth + 1));
  };
  inspect(schema);
  return schema;
}

export function assertRestorableSchema(input, depth = 0) {
  if (depth > 100 || !input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Schema inválido ou profundo demais.');
  if (input.type !== undefined && !TYPES.includes(input.type)) throw new Error('Tipo de schema não suportado.');
  for (const key of ['required','enum','examples']) {
    if (input[key] !== undefined && !Array.isArray(input[key])) throw new Error(key + ' precisa ser uma lista.');
  }
  if (input.required?.some(value => typeof value !== 'string')) throw new Error('required precisa conter nomes.');
  for (const key of ['title','description','$schema','format','pattern']) {
    if (input[key] !== undefined && typeof input[key] !== 'string') throw new Error(key + ' precisa ser texto.');
  }
  if (input.properties !== undefined) {
    if (!input.properties || typeof input.properties !== 'object' || Array.isArray(input.properties)) throw new Error('properties inválido.');
    Object.entries(input.properties).forEach(([name,child]) => { if (!isSafePropertyName(name)) throw new Error('Nome de propriedade não seguro ou ambíguo.'); assertRestorableSchema(child, depth + 1); });
  }
  if (input.items !== undefined) assertRestorableSchema(input.items, depth + 1);
}
