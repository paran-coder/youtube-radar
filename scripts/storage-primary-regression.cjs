const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
let ts;
try { ts = require('typescript'); } catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
class Table {
  constructor(name) { this.name = name; this.records = new Map(); this.pk = name === 'owners' ? 'channelId' : 'id'; }
  async toArray(){return [...this.records.values()].map(x=>({...x}));}
  async get(id){return this.records.get(id);}
  async put(item){this.records.set(item[this.pk],{...item});}
  async bulkPut(items){for(const x of items) await this.put(x);}
  async bulkGet(ids){return ids.map(id=>this.records.get(id));}
  async bulkDelete(ids){ids.forEach(id=>this.records.delete(id));}
  async delete(id){this.records.delete(id);}
  async clear(){this.records.clear();}
  async update(id,values){if(!this.records.has(id))return 0;Object.assign(this.records.get(id),values);return 1;}
  toCollection(){return {modify:async fn=>{for(const record of this.records.values()){if(typeof fn==='function')fn(record);else Object.assign(record,fn);}}};}
  where(key){return {equals:v=>({toArray:async()=>[...this.records.values()].filter(x=>x[key]===v),delete:async()=>{for(const [id,x] of this.records)if(x[key]===v)this.records.delete(id)},primaryKeys:async()=>[...this.records.values()].filter(x=>x[key]===v).map(x=>x[this.pk])})};}
}
class FakeDexie {
  constructor(){this.tables={};}
  version(){return {stores:definitions=>{for(const name of Object.keys(definitions)){this[name]=new Table(name);this.tables[name]=this[name];}}};}
  transaction(mode,...tablesAndCallback){return tablesAndCallback.at(-1)();}
}
const validator=new Proxy({parse:x=>x},{get(target,key){if(key in target)return target[key];return (...args)=>validator;}});
const z=new Proxy({}, {get(){return (...args)=>validator;}});
const input=fs.readFileSync(path.join(__dirname,'../src/lib/storage.ts'),'utf8');
const compiled=ts.transpileModule(input,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const backupTs=fs.readFileSync(path.join(__dirname,'../src/lib/backupIntegrity.ts'),'utf8');
const backupJs=ts.transpileModule(backupTs,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const backupMod={exports:{}};
vm.runInNewContext(backupJs,{module:backupMod,exports:backupMod.exports,require:name=>{
 if(name==='./utils')return {expired:()=>false};
 throw Error('Unexpected import in backupIntegrity '+name);
},Date,Set,Map,Number});
const mod={exports:{}};
vm.runInNewContext(compiled,{module:mod,exports:mod.exports,require:name=>{
 if(name==='./backupIntegrity')return backupMod.exports;
 if(name==='dexie')return {__esModule:true,default:FakeDexie};
 if(name==='zod')return {z};
 if(name==='./utils')return {expired:()=>false};
 throw Error('Unexpected import '+name);
},Date,Set,Map,Promise,Error},{filename:'storage.js'});
const {db,importBackup,purgeExpired,exportBackup}=mod.exports;
const t='2026-10-09T09:00:00Z';
const old={channelId:'B-SIDE',isPrimary:true,addedAt:'2026-10-07T00:00:00Z'};
const another={channelId:'HYUN',isPrimary:false,addedAt:'2026-10-08T00:00:00Z'};
const qaA={channelId:'UC_QA_BASE_ALPHA',isPrimary:true,addedAt:'2026-10-09T10:00:00Z'};
const qaB={channelId:'UC_QA_BASE_BETA',isPrimary:false,addedAt:'2026-10-09T10:00:00Z'};
const miniChannel=(id)=>({id,title:id,description:'',thumbnail:'',subscriberCount:5000,viewCount:12000,videoCount:4,uploadsId:'PL',topics:[],fetchedAt:t});
const fixture={app:'youtube-radar',schemaVersion:'1.0.0',exportedAt:t,data:{channels:[miniChannel(qaA.channelId),miniChannel(qaB.channelId)],videos:[],snapshots:[],owners:[qaA,qaB],competitors:[{id:'UC_QA_BASE_ALPHA:UC_QA_BASE_BETA',ownerId:qaA.channelId,channelId:qaB.channelId,addedAt:t}],settings:[]}};
(async()=>{
 await db.owners.bulkPut([old,another]);
 await db.channels.put(miniChannel('B-SIDE'));
 await importBackup(fixture,'merge');
 let owners=await db.owners.toArray();
 assert.equal(owners.length,4);
 assert.deepEqual(owners.filter(x=>x.isPrimary).map(x=>x.channelId),['B-SIDE']);
 assert.equal((await db.channels.toArray()).length,3);
 assert.equal((await db.competitors.toArray()).length,1);
 console.log('PASS: merging QA fixture preserves original sole primary and existing channel');
 await importBackup(fixture,'merge');
 owners=await db.owners.toArray();
 assert.equal(owners.length,4);assert.equal(owners.filter(x=>x.isPrimary).length,1);
 console.log('PASS: repeated merge is idempotent for owner registrations');
 await db.owners.update(qaA.channelId,{isPrimary:true});
 await purgeExpired();
 owners=await db.owners.toArray();
 assert.deepEqual(owners.filter(x=>x.isPrimary).map(x=>x.channelId),['B-SIDE']);
 assert.equal((await db.channels.toArray()).length,3);assert.equal((await db.competitors.toArray()).length,1);
 console.log('PASS: legacy duplicate primary repaired without deleting channels or relations');
 await db.owners.update('B-SIDE',{isPrimary:false});
 await purgeExpired();
 owners=await db.owners.toArray();
 assert.deepEqual(owners.filter(x=>x.isPrimary).map(x=>x.channelId),['B-SIDE']);
 console.log('PASS: no-primary state repaired deterministically');
 const back=await exportBackup();
 assert.equal(back.data.owners.filter(x=>x.isPrimary).length,1);
 console.log('PASS: exported backup has exactly one primary');
})().catch(err=>{console.error(err);process.exitCode=1});
