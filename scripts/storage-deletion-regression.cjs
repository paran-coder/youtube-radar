const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'src/lib/storage.ts'),'utf8');
const parsed=ts.createSourceFile('storage.ts',src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const fn=parsed.statements.find(x=>ts.isFunctionDeclaration(x)&&x.name?.text==='deleteStoredChannel');
assert.ok(fn,'Shared deletion function exists');
const isolated=ts.transpileModule(fn.getText(parsed),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function mock(initial){
 const data=Object.fromEntries(Object.entries(initial).map(([t,list])=>[t,new Map(list.map(x=>[x.id??x.channelId,x]))]));
 const calls=[];
 const tables={};
 for(const name of Object.keys(data)){
  const map=data[name];
  const table={
   delete:async id=>{map.delete(id);calls.push(`delete:${name}:${id}`)},
   get:async id=>map.get(id),
   toArray:async()=>Array.from(map.values()),
   update:async(id,patch)=>{const old=map.get(id);if(old)Object.assign(old,patch)},
   toCollection:()=>({modify:async patch=>{for(const x of map.values())Object.assign(x,patch)}}),
   where:index=>({
    equals:value=>({
     primaryKeys:async()=>Array.from(map.values()).filter(x=>x[index]===value).map(x=>x.id??x.channelId),
     delete:async()=>{for(const [k,v] of map)if(v[index]===value)map.delete(k)},
    }),
    anyOf:values=>({delete:async()=>{for(const [k,v] of map)if(values.includes(v[index]))map.delete(k)}}),
   }),
  }; tables[name]=table;
 }
 const db={...tables,transaction:async(mode,...args)=>{assert.equal(mode,'rw');assert.equal(args.length,6);calls.push('tx-start');await args.pop()();calls.push('tx-complete')}};
 const m={exports:{}};vm.runInNewContext(isolated,{module:m,exports:m.exports,db,Error,Date});
 return {fn:m.exports.deleteStoredChannel,data,calls};
}
const initial={
 channels:[{id:'base',title:'실제 기준 채널'},{id:'qa',title:'[QA] 테스트'},{id:'other',title:'다른 채널'}],
 videos:[{id:'va',channelId:'qa'},{id:'vb',channelId:'base'},{id:'vc',channelId:'qa'}],
 snapshots:[{id:'sa',videoId:'va'},{id:'sb',videoId:'vb'},{id:'sc',videoId:'vc'}],
 owners:[{channelId:'base',isPrimary:true,addedAt:'2026-01-01'},{channelId:'other',isPrimary:false,addedAt:'2026-01-02'}],
 competitors:[{id:'base:qa',ownerId:'base',channelId:'qa'},{id:'other:qa',ownerId:'other',channelId:'qa'},{id:'base:other',ownerId:'base',channelId:'other'}],
};
(async()=>{
 const m=mock(initial);await m.fn('qa');
 assert.equal(m.data.channels.has('qa'),false,'test channel deleted');
 assert.equal(m.data.channels.has('base'),true,'real channel preserved');
 assert.deepEqual([...m.data.videos.keys()],['vb'],'only QA videos removed');
 assert.deepEqual([...m.data.snapshots.keys()],['sb'],'only QA snapshots removed');
 assert.deepEqual([...m.data.competitors.keys()],['base:other'],'all references removed, unrelated relation retained');
 assert.equal(m.data.owners.get('base').isPrimary,true,'existing primary preserved');
 assert.ok(m.calls.includes('tx-complete'),'atomic transaction finished');
 console.log('PASS: competitor-only QA channel deletion preserves real channels, videos and unrelated links (7 checks)');
 const withPrimary=mock({
  channels:[{id:'qa'},{id:'base'}],videos:[{id:'v1',channelId:'qa'}],snapshots:[{id:'s1',videoId:'v1'}],
  owners:[{channelId:'qa',isPrimary:true,addedAt:'2026-01-01'},{channelId:'base',isPrimary:false,addedAt:'2026-01-02'}],
  competitors:[{id:'qa:base',ownerId:'qa',channelId:'base'}]
 });
 await withPrimary.fn('qa');
 assert.equal(withPrimary.data.owners.size,1);
 assert.equal(withPrimary.data.owners.get('base').isPrimary,true);
 assert.equal(withPrimary.data.competitors.size,0);
 console.log('PASS: deleting current primary reassigns next owner and removes originating competitor links (3 checks)');
 const invalid=mock(initial);await assert.rejects(()=>invalid.fn(' '),/삭제할 채널/);
 assert.equal(invalid.data.channels.size,3);
 console.log('PASS: missing channel ID rejected without data loss (2 checks)');
 const app=fs.readFileSync(path.join(root,'src/App.tsx'),'utf8');
 const guide=fs.readFileSync(path.join(root,'src/components/UserGuide.tsx'),'utf8');
 const types=fs.readFileSync(path.join(root,'src/lib/types.ts'),'utf8');
 assert.match(app,/page==='user-guide'/);assert.match(app,/deleteStoredChannel\(id\)/);
 assert.match(app,/저장 데이터 완전 삭제/);assert.match(app,/경쟁 연결 해제/);
 assert.match(types,/'user-guide'/);
 assert.match(guide,/export const USER_GUIDE_STEPS/);
 assert.match(guide,/\[QA\]/);
 assert.match(guide,/API 키 발급/);
 console.log('PASS: route, navigation, guide and distinct deletion copy present (8 checks)');
})().catch(e=>{console.error(e);process.exitCode=1});
