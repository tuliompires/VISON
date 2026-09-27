import { assertRestorableSchema, normalizeSchema, SCHEMA_VERSION } from '../utils.js';
import { t } from '../i18n.js';

const KEY='vison-schema-v1';
let backupProtected=false;
let status={ok:true,operation:'init',message:t('storageInit'),schemaVersion:SCHEMA_VERSION};
function report(operation,ok,message,error=null){status={ok,operation,message,error:error?.name||null,schemaVersion:SCHEMA_VERSION};return status}
export const storageService={
 load(){try{const raw=localStorage.getItem(KEY);if(!raw)return null;const parsed=JSON.parse(raw);assertRestorableSchema(parsed);const schema=normalizeSchema(parsed);backupProtected=false;report('load',true,t('storageRestored'));return schema}catch(error){backupProtected=true;report('load',false,t('storageInvalid'),error);return null}},
 save(schema){if(backupProtected)return report('save',false,t('storageBlocked'));try{assertRestorableSchema(schema);const normalized=normalizeSchema(schema);localStorage.setItem(KEY,JSON.stringify(normalized));return report('save',true,t('storageSaved'))}catch(error){return report('save',false,t('storageFailed'),error)}},
 getStatus(){return {...status}},
 clear(){try{localStorage.removeItem(KEY);return report('clear',true,t('storageCleared'))}catch(error){return report('clear',false,t('storageClearFailed'),error)}}
};
export async function copyText(text){if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);const area=document.createElement('textarea');area.value=text;document.body.append(area);area.select();document.execCommand('copy');area.remove()}
// O modelo/árvore já foi ordenado pela fonte visual; este serializer não reordena chaves.
export function serializeSchemaJson(schema){return JSON.stringify(schema,null,2)}
export function downloadJson(schema){const blob=new Blob([serializeSchemaJson(schema)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='schema.json';a.click();URL.revokeObjectURL(url)}
