import { assertRestorableSchema, clone, nodesToSchema, normalizeSchema, schemaToNodes, uid } from '../utils.js';
const sample = { $schema:'https://json-schema.org/draft/2020-12/schema', schemaVersion:1, title:'Perfil de usuário', description:'Exemplo inicial do Vison', type:'object', properties:{ name:{type:'string',description:'Nome completo',minLength:2}, age:{type:'integer',minimum:0}, active:{type:'boolean',default:true}, tags:{type:'array',items:{type:'string'}} }, required:['name'] };
export class SchemaModel {
  constructor(initial=sample) { this.listeners=[]; this.history=[]; this.future=[]; this.root=schemaToNodes(initial); this.selectedId=this.root.id; this.dirty=false; this.lastStorageStatus=null; }
  subscribe(fn){this.listeners.push(fn);return ()=>this.listeners=this.listeners.filter(x=>x!==fn)}
  notify(){this.listeners.forEach(fn=>fn(this))}
  snapshot(){return clone(this.root)}
  commit(mutator){this.history.push(this.snapshot());this.future=[];mutator();this.dirty=true;this.notify()}
  select(id){this.selectedId=id;this.notify()}
  selected(){let found;const walk=n=>{if(n.id===this.selectedId)found=n;n.children.forEach(walk)};walk(this.root);return found||this.root}
  add(parentId=this.selectedId,type='string',name='property'){this.commit(()=>{const p=this.find(parentId)||this.root;if(p.type==='array')name='items';const child={id:uid(),name,type,description:'',required:false,children:[]};if(p.type==='array')p.children=[child];else{if(p.type!=='object'){p.type='object';p.children=[]}p.children.push(child)}this.selectedId=child.id})}
  addChild(parentId=this.selectedId){this.add(parentId);return this.selectedId}
  remove(id=this.selectedId){if(id===this.root.id)return false;const p=this.parent(id);if(!p)return false;this.commit(()=>{p.children=p.children.filter(c=>c.id!==id);this.selectedId=p.id});return true}
  duplicate(id=this.selectedId){const n=this.find(id);if(!n||id===this.root.id)return false;let duplicateId;this.commit(()=>{const p=this.parent(id),c=clone(n);const reid=(x,parentId)=>{x.id=uid();x.parent=parentId;x.children.forEach(child=>reid(child,x.id))};reid(c,p.id);c.name=`${c.name}_copy`;p.children.splice(p.children.indexOf(n)+1,0,c);this.selectedId=c.id;duplicateId=c.id});return duplicateId}
  move(id,delta){const p=this.parent(id);if(!p)return;const i=p.children.findIndex(c=>c.id===id),j=i+delta;if(j<0||j>=p.children.length)return;this.commit(()=>{[p.children[i],p.children[j]]=[p.children[j],p.children[i]]})}
  canMoveNode(id,targetId,zone='inside'){const node=this.find(id),target=this.find(targetId);if(!node||!target||id===this.root.id||id===targetId||!['before','after','inside'].includes(zone)||this.contains(node,targetId))return false;const sourceParent=this.parent(id),targetParent=zone==='inside'?target:this.parent(targetId);return Boolean(sourceParent&&targetParent&&!(zone==='inside'&&target.type==='array'&&target.children.length))}
  moveNode(id,targetId,zone='inside'){if(!this.canMoveNode(id,targetId,zone))return false;const node=this.find(id),target=this.find(targetId),sourceParent=this.parent(id),targetParent=zone==='inside'?target:this.parent(targetId);this.commit(()=>{sourceParent.children.splice(sourceParent.children.indexOf(node),1);if(zone==='inside'){if(target.type!=='object'&&target.type!=='array'){target.type='object';target.children=[]}node.parent=target.id;target.children.push(node)}else{const index=targetParent.children.indexOf(target)+(zone==='after'?1:0);node.parent=targetParent.id;targetParent.children.splice(index,0,node)}this.selectedId=node.id});return true}
  update(id,key,value){this.commit(()=>{const n=this.find(id);if(n)n[key]=value})}
  find(id,n=this.root){if(n.id===id)return n;for(const c of n.children){const f=this.find(id,c);if(f)return f}return null}
  contains(ancestor,id){return ancestor.children.some(c=>c.id===id||this.contains(c,id))}
  parent(id,n=this.root){return n.children.some(c=>c.id===id)?n:n.children.map(c=>this.parent(id,c)).find(Boolean)}
  undo(){if(!this.history.length)return;this.future.push(this.snapshot());this.root=this.history.pop();this.selectedId=this.root.id;this.dirty=true;this.notify()}
  redo(){if(!this.future.length)return;this.history.push(this.snapshot());this.root=this.future.pop();this.selectedId=this.root.id;this.dirty=true;this.notify()}
  schema(){return nodesToSchema(this.root)} isDirty(){return this.dirty} markSaved(){this.dirty=false;this.notify()}
  importSchema(schema){assertRestorableSchema(schema);const normalized=normalizeSchema(schema);const root=schemaToNodes(normalized);this.commit(()=>{this.root=root;this.selectedId=this.root.id})}
  reset(){this.commit(()=>{this.root=schemaToNodes({$schema:'https://json-schema.org/draft/2020-12/schema',schemaVersion:1,title:'Novo schema',type:'object',properties:{}});this.selectedId=this.root.id})}
}
