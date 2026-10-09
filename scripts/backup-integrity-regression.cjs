const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
let ts; try { ts=require('typescript'); } catch { ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/lib/backupIntegrity.ts'),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const moduleExports={};const now=Date.parse('2026-10-09T12:00:00Z');
const expired=(d,n)=>!Number.isFinite(Date.parse(d))||n-Date.parse(d)>30*86400000;
vm.runInNewContext(js,{exports:moduleExports,require:()=>({expired}),Map,Set,Date,Number});
const prepare=moduleExports.prepareBackupImport;
const date=days=>new Date(now-days*86400000).toISOString();
const channel=(id,days=0)=>({id,title:id,fetchedAt:date(days)});
const video=(id,channelId,days=0)=>({id,channelId,fetchedAt:date(days)});
const owner=(channelId,isPrimary)=>({channelId,isPrimary,addedAt:date(1)});
const relation=(ownerId,channelId)=>({id:`${ownerId}:${channelId}`,ownerId,channelId});
const empty=()=>({channels:[],videos:[],snapshots:[],owners:[],competitors:[],settings:[]});
let tests=0;function test(name,fn){fn();console.log('PASS '+name);tests++;}
test('missing references are excluded',()=>{const x=empty();x.channels=[channel('a')];x.videos=[video('ok','a'),video('bad','missing')];x.snapshots=[{id:'ok',videoId:'ok',collectedAt:date(0)},{id:'bad',videoId:'bad',collectedAt:date(0)}];x.owners=[owner('a',true),owner('missing')];x.competitors=[relation('a','missing')];let r=prepare(x,empty(),'replace',now);assert.equal(r.data.videos.length,1);assert.equal(r.data.snapshots.length,1);assert.equal(r.data.owners.length,1);assert.equal(r.data.competitors.length,0);assert.equal(r.report.skippedUnlinked,4)});
test('expired and future timestamps excluded',()=>{const x=empty();x.channels=[channel('a',34),channel('b',-2),channel('c')];x.videos=[video('v','c',31),video('ok','c')];const r=prepare(x,empty(),'replace',now);assert.equal(r.data.channels.length,1);assert.equal(r.data.videos.length,1);assert.equal(r.report.skippedExpired,3)});
test('existing primary and newer data preserved',()=>{const e=empty(),x=empty();e.channels=[channel('a'),channel('b')];e.owners=[owner('a',true)];e.videos=[video('v','a')];x.channels=[channel('a',2),channel('b'),channel('c')];x.owners=[owner('c',true)];x.videos=[video('v','a',3)];let r=prepare(x,e,'merge',now);assert.equal(r.data.owners.filter(o=>o.isPrimary)[0].channelId,'a');assert.equal(r.data.videos.find(v=>v.id==='v').fetchedAt,date(0));assert.equal(r.report.channelsAdded,1)});
test('repeated merge is idempotent',()=>{const x=empty();x.channels=[channel('a'),channel('b')];x.owners=[owner('a',true)];x.competitors=[relation('a','b')];const one=prepare(x,empty(),'merge',now),two=prepare(x,one.data,'merge',now);assert.equal(two.report.channelsAdded,0);assert.equal(two.report.competitorsAdded,0);assert.equal(two.data.competitors.length,1)});
test('replacement discards old collection',()=>{const e=empty(),x=empty();e.channels=[channel('old')];x.channels=[channel('new')];assert.equal(prepare(x,e,'replace',now).data.channels.map(c=>c.id).join(','),'new')});
test('no sensitive key preference restored',()=>{const x=empty();x.settings=[{id:'setting',rememberKey:true}];assert.equal(prepare(x,empty(),'replace',now).data.settings[0].rememberKey,false)});
test('storage clear is a single transaction',()=>{const s=fs.readFileSync(path.join(root,'src/lib/storage.ts'),'utf8');const m=s.match(/export async function resetAll\(\)\{([\s\S]*?)\n\}/);assert.ok(m);assert.match(m[1],/db\.transaction\('rw'/);assert.doesNotMatch(m[1],/Promise\.all/)});
console.log(`${tests} checks passed`);
