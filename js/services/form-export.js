export const FORM_EXPORT_FORMATS=['json','yaml'];
export const FORM_EXPORT_PREFERENCE_KEY='vison-form-export-formats';

const reservedNames=new Set(['CON','PRN','AUX','NUL',...Array.from({length:9},(_,i)=>`COM${i+1}`),...Array.from({length:9},(_,i)=>`LPT${i+1}`)]);
const pad=value=>String(value).padStart(2,'0');

export function normalizeFormats(value){
  let formats=value;
  if(typeof value==='string'){try{formats=JSON.parse(value)}catch{formats=[]}}
  if(!Array.isArray(formats))formats=[];
  const valid=[...new Set(formats.filter(format=>FORM_EXPORT_FORMATS.includes(format)))];
  return valid.length?valid:['json'];
}

export function readFormatPreference(storage=globalThis.localStorage){
  try{return normalizeFormats(storage?.getItem(FORM_EXPORT_PREFERENCE_KEY))}catch{return ['json']}
}

export function writeFormatPreference(formats,storage=globalThis.localStorage){
  const valid=normalizeFormats(formats);
  try{storage?.setItem(FORM_EXPORT_PREFERENCE_KEY,JSON.stringify(valid))}catch{}
  return valid;
}

export function suggestExportName(date=new Date()){
  return `${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export function normalizeExportName(value,date=new Date()){
  const raw=String(value??'').trim();
  const suggested=!raw;
  let base=raw||suggestExportName(date);
  if(/\.(json|ya?ml)$/i.test(base))base=base.replace(/\.(json|ya?ml)$/i,'');
  if(!base||base.length>120||/[\\/\u0000-\u001f<>:"|?*]/.test(base)||/[. ]$/.test(base))return {ok:false,error:'invalid'};
  if(/\.[^.]+$/.test(base))return {ok:false,error:'extension'};
  if(reservedNames.has(base.replace(/[. ]+$/,'').toUpperCase()))return {ok:false,error:'reserved'};
  return {ok:true,base,suggested};
}

const yamlScalar=value=>{
  if(value===null)return'null';
  if(typeof value==='boolean')return value?'true':'false';
  if(typeof value==='number')return Number.isFinite(value)?String(value):'null';
  return JSON.stringify(String(value));
};

function yamlLines(value,level=0){
  const indent=' '.repeat(level);
  if(value===null||typeof value!=='object')return [indent+yamlScalar(value)];
  if(Array.isArray(value)){
    if(!value.length)return [indent+'[]'];
    const lines=[];
    for(const item of value){
      if(item===null||typeof item!=='object')lines.push(indent+'- '+yamlScalar(item));
      else{const child=yamlLines(item,level+2);lines.push(indent+'- '+child[0].trimStart());lines.push(...child.slice(1))}
    }
    return lines;
  }
  const entries=Object.entries(value);
  if(!entries.length)return [indent+'{}'];
  const lines=[];
  for(const [key,item] of entries){
    const keyText=JSON.stringify(String(key));
    if(item===null||typeof item!=='object')lines.push(`${indent}${keyText}: ${yamlScalar(item)}`);
    else{const child=yamlLines(item,level+2);if(child.length===1&&(child[0].trim()==='[]'||child[0].trim()==='{}'))lines.push(`${indent}${keyText}: ${child[0].trim()}`);else{lines.push(`${indent}${keyText}:`);lines.push(...child)}}
  }
  return lines;
}

export function serializeJson(snapshot){return `${JSON.stringify(snapshot??null,null,2)}\n`}
export function serializeYaml(snapshot){return `${yamlLines(snapshot??null).join('\n')}\n`}

export function buildExportFiles(snapshot,formats,name){
  const valid=normalizeFormats(formats),files=[];
  if(valid.includes('json'))files.push({format:'json',filename:`${name}.json`,mime:'application/json;charset=utf-8',content:serializeJson(snapshot)});
  if(valid.includes('yaml'))files.push({format:'yaml',filename:`${name}.yaml`,mime:'application/yaml;charset=utf-8',content:serializeYaml(snapshot)});
  return files;
}
