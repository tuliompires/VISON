const SUPPORTED_FORMATS=new Set(['email','uri','date','date-time','ipv4','ipv6','uuid']);
const SUPPORTED_KEYS=new Set(['$schema','schemaVersion','title','description','type','properties','required','items','default','enum','examples','minimum','maximum','minLength','maxLength','pattern','format']);
const UNSUPPORTED_KEYS=new Set(['$ref','prefixItems','allOf','anyOf','oneOf','not','if','then','else','dependentSchemas','dependentRequired','contains','minContains','maxContains','propertyNames','unevaluatedProperties','unevaluatedItems','additionalProperties']);
const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
export const normalizeFormPath=value=>String(value??'').replace(/\[(\d+)\]/g,'.$1').replace(/^\./,'');

export function getUnsupportedSchemaKeywords(schema){
  const found=new Set();
  const walk=node=>{if(!node||typeof node!=='object'||Array.isArray(node))return;Object.keys(node).forEach(key=>{if(UNSUPPORTED_KEYS.has(key)||!SUPPORTED_KEYS.has(key))found.add(key);if(key==='format'&&!SUPPORTED_FORMATS.has(node[key]))found.add(`format:${node[key]}`)});if(node.properties&&typeof node.properties==='object')Object.values(node.properties).forEach(walk);if(node.items)walk(node.items)};
  walk(schema);return [...found].sort();
}

export function initializeFormValues(schema){
  if(!schema||typeof schema!=='object')return undefined;
  if(schema.default!==undefined)return clone(schema.default);
  if(schema.type==='object'){
    const result={};Object.entries(schema.properties||{}).forEach(([key,child])=>{const value=initializeFormValues(child);if(value!==undefined)result[key]=value});return result;
  }
  if(schema.type==='array')return Array.isArray(schema.default)?clone(schema.default):[];
  return undefined;
}

const present=value=>value!==undefined&&value!==null;
function validDate(value){const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);if(!match)return false;const date=new Date(Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3])));return date.getUTCFullYear()===Number(match[1])&&date.getUTCMonth()===Number(match[2])-1&&date.getUTCDate()===Number(match[3])}
function validDateTime(value){if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value))return false;const datePart=value.slice(0,10),time=value.slice(11);const hour=Number(time.slice(0,2)),minute=Number(time.slice(3,5)),second=Number(time.slice(6,8));return validDate(datePart)&&hour<24&&minute<60&&second<60&&!Number.isNaN(Date.parse(value))}
function validIpv4(value){const parts=value.split('.');return parts.length===4&&parts.every(part=>/^\d{1,3}$/.test(part)&&Number(part)<=255)}
function validIpv6(value){if(!/^[0-9a-f:.]+$/i.test(value)||value.includes(':::'))return false;const halves=value.split('::');if(halves.length>2)return false;const count=part=>part?part.split(':').reduce((total,group)=>total+(group.includes('.')?2:1),0):0;const left=count(halves[0]),right=halves.length===2?count(halves[1]):0;return halves.length===2?left+right<8:left+right===8}
function formatValid(value,format){if(!SUPPORTED_FORMATS.has(format))return true;const patterns={email:/^[^\s@]+@[^\s@]+\.[^\s@]+$/,uri:/^[a-z][a-z\d+.-]*:\S+$/i,uuid:/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i};if(format==='date')return validDate(String(value));if(format==='date-time')return validDateTime(String(value));if(format==='ipv4')return validIpv4(String(value));if(format==='ipv6')return validIpv6(String(value));return patterns[format].test(String(value))}
export function validateFormData(schema,values){
  const errors=[];
  const add=(path,keyword,message)=>errors.push({path,keyword,message});
  const walk=(node,value,path)=>{
    if(!node||typeof node!=='object')return;
    if(node.type==='object'){
      if(value===undefined)return;if(!value||typeof value!=='object'||Array.isArray(value)){add(path,'type',`${path||'value'} must be an object.`);return}const object=value;
      (node.required||[]).forEach(key=>{if(!Object.prototype.hasOwnProperty.call(object,key)||object[key]===undefined||object[key]==='')add(pathFor(path,key),'required',`${pathFor(path,key)} is required.`)});
      Object.entries(node.properties||{}).forEach(([key,child])=>{if(Object.prototype.hasOwnProperty.call(object,key))walk(child,object[key],pathFor(path,key))});return;
    }
    if(node.type==='array'){
      if(value===undefined)return;if(!Array.isArray(value)){add(path,'type',`${path} must be an array.`);return}value.forEach((item,index)=>walk(node.items,item,pathFor(path,index)));return;
    }
    if(value===undefined)return;
    if(value===null){if(node.type!=='null')add(path,'type',`${path} has an invalid type.`);return}
    const typeOk={string:typeof value==='string',number:typeof value==='number'&&!Number.isNaN(value),integer:Number.isInteger(value),boolean:typeof value==='boolean',null:value===null}[node.type];
    if(typeOk===false){add(path,'type',`${path} has an invalid type.`);return}
    if(node.enum&&!node.enum.some(option=>JSON.stringify(option)===JSON.stringify(value)))add(path,'enum',`${path} must match an allowed value.`);
    if((node.type==='number'||node.type==='integer')&&node.minimum!==undefined&&value<node.minimum)add(path,'minimum',`${path} must be at least ${node.minimum}.`);
    if((node.type==='number'||node.type==='integer')&&node.maximum!==undefined&&value>node.maximum)add(path,'maximum',`${path} must be at most ${node.maximum}.`);
    if(typeof value==='string'&&node.minLength!==undefined&&value.length<node.minLength)add(path,'minLength',`${path} is too short.`);
    if(typeof value==='string'&&node.maxLength!==undefined&&value.length>node.maxLength)add(path,'maxLength',`${path} is too long.`);
    if(typeof value==='string'&&node.pattern){try{if(!new RegExp(node.pattern).test(value))add(path,'pattern',`${path} has an invalid format.`)}catch{add(path,'pattern',`${path} has an invalid pattern.`)}}
    if(typeof value==='string'&&node.format&&!formatValid(value,node.format))add(path,'format',`${path} has an invalid ${node.format} format.`);
  };
  const pathFor=(base,key)=>normalizeFormPath(base?`${base}.${key}`:key);walk(schema,values,'');return errors;
}

export { SUPPORTED_FORMATS };
