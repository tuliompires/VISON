import {
  isSafePropertyName,
  MAX_IMPORT_BYTES,
  MAX_IMPORT_DEPTH,
  MAX_IMPORT_NODES,
} from '../utils.js';

const complexityError = () => { throw new Error('Import complexity or depth limit exceeded.'); };
const unsafeKeyError = key => { throw new Error(`Unsafe or ambiguous import property name: ${key}`); };
const assertImportKey = key => { if (!isSafePropertyName(key)) unsafeKeyError(key); return key; };
const countNode = state => { state.nodes += 1; if (state.nodes > MAX_IMPORT_NODES) complexityError(); };

const linesOf = text => {
  const rawLines = String(text).replace(/^\uFEFF/, '').split(/\r?\n/);
  if (rawLines.length > MAX_IMPORT_NODES) complexityError();
  return rawLines.map((raw, index) => ({ raw, index, indent: raw.match(/^\s*/)[0].length, text: raw.trim() }))
    .filter(line => line.text && !line.text.startsWith('#'));
};

const scalar = (value, state) => {
  countNode(state);
  const text = value.trim();
  if (!text || text === 'null') return null;
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (text === '[]') return [];
  if (text === '{}') return {};
  if (/^[-+]?\d+(?:\.\d+)?$/.test(text)) return Number(text);
  try { return JSON.parse(text); } catch { return text.replace(/^['"]|['"]$/g, ''); }
};

const pair = text => {
  let quote = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && text[i - 1] !== '\\') quote = !quote;
    if (char === ':' && !quote) return [text.slice(0, i).trim(), text.slice(i + 1).trim()];
  }
  return [text, ''];
};

const decodeKey = key => {
  let decoded;
  try { decoded = JSON.parse(key); } catch { decoded = key.replace(/^['"]|['"]$/g, ''); }
  return assertImportKey(decoded);
};
const addKey = (target, keys, key, value) => {
  const safeKey = decodeKey(key);
  if (keys.has(safeKey)) throw new Error(`Duplicate import property name: ${safeKey}`);
  keys.add(safeKey);
  target[safeKey] = value;
};

function parseBlock(lines, index, indent, depth, state) {
  if (depth > MAX_IMPORT_DEPTH) complexityError();
  countNode(state);
  const array = lines[index]?.indent === indent && lines[index].text.startsWith('- ');
  const value = array ? [] : {};
  const keys = new Set();
  while (index < lines.length && lines[index].indent === indent) {
    const line = lines[index];
    if (array) {
      if (!line.text.startsWith('- ')) break;
      const rest = line.text.slice(2).trim();
      if (!rest) {
        const nested = lines[index + 1]?.indent > indent ? parseBlock(lines, index + 1, lines[index + 1].indent, depth + 1, state) : [null, index + 1];
        value.push(nested[0]); countNode(state); index = nested[1]; continue;
      }
      const [key, raw] = pair(rest);
      if (raw !== '' && rest.includes(':')) {
        const object = {}; const objectKeys = new Set();
        addKey(object, objectKeys, key, scalar(raw, state)); index += 1;
        if (lines[index]?.indent > indent) {
          const nested = parseBlock(lines, index, lines[index].indent, depth + 1, state);
          if (nested[0] && typeof nested[0] === 'object' && !Array.isArray(nested[0])) Object.entries(nested[0]).forEach(([nestedKey, nestedValue]) => addKey(object, objectKeys, nestedKey, nestedValue));
          index = nested[1];
        }
        value.push(object); countNode(state);
      } else { value.push(scalar(rest, state)); index += 1; }
    } else {
      const [key, raw] = pair(line.text);
      if (!line.text.includes(':')) throw new Error(`Invalid YAML at line ${line.index + 1}`);
      if (raw !== '') { addKey(value, keys, key, scalar(raw, state)); index += 1; }
      else if (lines[index + 1]?.indent > indent) { const nested = parseBlock(lines, index + 1, lines[index + 1].indent, depth + 1, state); addKey(value, keys, key, nested[0]); index = nested[1]; }
      else { addKey(value, keys, key, null); index += 1; countNode(state); }
    }
  }
  return [value, index];
}

const validateImportedValue = (value, depth = 0, state = { nodes: 0 }) => {
  if (depth > MAX_IMPORT_DEPTH) complexityError();
  countNode(state);
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) value.forEach(child => validateImportedValue(child, depth + 1, state));
    else Object.keys(value).forEach(key => { assertImportKey(key); validateImportedValue(value[key], depth + 1, state); });
  }
  return value;
};

export function parseYaml(text) {
  if (typeof text !== 'string' || text.length > MAX_IMPORT_BYTES) throw new Error('Import size limit exceeded.');
  const lines = linesOf(text); if (!lines.length) return null;
  const state = { nodes: 0 }; const value = parseBlock(lines, 0, lines[0].indent, 0, state)[0];
  return validateImportedValue(value, 0, state);
}

export function parseFormImport(text, extension = '') {
  const raw = String(text); if (raw.length > MAX_IMPORT_BYTES) throw new Error('Import size limit exceeded.');
  if (extension.toLowerCase() === '.json' || raw.trimStart().startsWith('{') || raw.trimStart().startsWith('[')) {
    let value; try { value = JSON.parse(raw); } catch { throw new Error('Invalid JSON.'); }
    return validateImportedValue(value);
  }
  return parseYaml(raw);
}
