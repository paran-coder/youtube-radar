// Development environment fallback when npm dependencies are unavailable.
// Validates TS/TSX syntax and pure utility behavior using global TypeScript only.
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const assert=require('node:assert/strict');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const root=path.join(__dirname,'..');function recursive(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?recursive(path.join(dir,e.name)):/\.tsx?$/.test(e.name)?[path.join(dir,e.name)]:[])}
const files=recursive(path.join(root,'src'));let errors=0;
for(const file of files){const src=fs.readFileSync(file,'utf8');const parsed=ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);if(parsed.parseDiagnostics.length){errors+=parsed.parseDiagnostics.length;for(const err of parsed.parseDiagnostics)console.error(file,ts.flattenDiagnosticMessageText(err.messageText,' '));}}
if(errors)process.exitCode=1;else console.log(`PASS: TS/TSX syntax ${files.length} files`);
const appSrc=fs.readFileSync(path.join(root,'src/App.tsx'),'utf8');
const storageSrc=fs.readFileSync(path.join(root,'src/lib/storage.ts'),'utf8');
// Regression tests for v1.0.2 Vercel TypeScript build failures.
assert.equal(/run\(async\(\)\s*=>\s*\{[^\n]*?\}\)\(\)/.test(appSrc), false, 'Promise returned from run() must not be invoked');
assert.ok(storageSrc.includes("db.transaction('rw',[db.channels,db.videos,db.snapshots,db.owners,db.competitors,db.settings],async()=>{"), 'Use an array of Dexie tables for multi-table transaction');
console.log('PASS: Vercel build regression checks 2 assertions');
const source=fs.readFileSync(path.join(root,'src/lib/utils.ts'),'utf8');const out=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const fakeModule={exports:{}};vm.runInNewContext(out,{module:fakeModule,exports:fakeModule.exports,require,URL}, {filename:'utils.js'});
const u=fakeModule.exports;assert.equal(u.parseDuration('PT1H2M3S'),3723);assert.equal(u.parseDuration('PT2M30S'),150);assert.equal(u.channelIdentifier('https://www.youtube.com/@google').handle,'@google');assert.equal(u.kindOf({durationSeconds:150}),'unknown');assert.equal(u.kindOf({durationSeconds:150,kindOverride:'short'}),'short');assert.equal(u.kindOf({durationSeconds:210}),'long');assert.equal(u.median([1,4,5]),4);assert.equal(u.prettyNumber(null),'비공개');assert.equal(u.expired('2026-09-01T00:00:00Z',Date.parse('2026-10-09T00:00:00Z')),true);
console.log('PASS: pure utilities 9 assertions');
const registrySrc=fs.readFileSync(path.join(root,'src/lib/competitorRegistry.ts'),'utf8');
const registryJs=ts.transpileModule(registrySrc,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const registryModule={exports:{}};
vm.runInNewContext(registryJs,{module:registryModule,exports:registryModule.exports},{filename:'competitorRegistry.js'});
const group=registryModule.exports.competitorRegistry;
const ownerExamples=[{channelId:'mine-a',isPrimary:true},{channelId:'mine-b',isPrimary:false}];
const channelExamples=['mine-a','mine-b','linked','other'].map(id=>({id}));
const relationExamples=[{id:'mine-a:linked',ownerId:'mine-a',channelId:'linked'},{id:'mine-a:expired',ownerId:'mine-a',channelId:'expired'},{id:'mine-b:other',ownerId:'mine-b',channelId:'other'}];
assert.deepEqual(Array.from(group(ownerExamples,relationExamples,channelExamples).linkedIds),['linked','expired']);
assert.deepEqual(group(ownerExamples,relationExamples,channelExamples).available.map(c=>c.id),['mine-b','other']);
assert.deepEqual(group(ownerExamples,relationExamples,channelExamples,'mine-b').linked.map(c=>c.channelId),['other']);
assert.equal(group([],relationExamples,channelExamples).linked.length,0);
console.log('PASS: registered competitor visibility and owner switching 4 assertions');

const youtubeSrc=fs.readFileSync(path.join(root,'src/lib/youtube.ts'),'utf8');
const youtubeOut=ts.transpileModule(youtubeSrc,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const apiModule={exports:{}};
let apiCalls=[];
const fakeFetch=async(input)=>{
 const url=new URL(input);apiCalls.push(url);
 if(url.pathname.endsWith('/channels'))return {ok:true,json:async()=>({items:[{id:'UC1234567890123456789012',snippet:{title:'샘플',thumbnails:{default:{url:'https://img.example/a.jpg'}}},statistics:{subscriberCount:'12500'},contentDetails:{relatedPlaylists:{uploads:'UUsample'}}}]})};
 if(url.pathname.endsWith('/playlistItems'))return {ok:true,json:async()=>({items:[{contentDetails:{videoId:'abc'}}]})};
 if(url.pathname.endsWith('/videos'))return {ok:true,json:async()=>({items:[{id:'abc',snippet:{title:'영상',publishedAt:'2026-10-09T00:00:00Z',categoryId:'28'},statistics:{viewCount:'1200'},contentDetails:{duration:'PT2M10S'}}]})};
 return {ok:false,status:404,json:async()=>({})};
};
vm.runInNewContext(youtubeOut,{module:apiModule,exports:apiModule.exports,require:(x)=>{if(x==='./utils')return u;throw Error('not mocked '+x)},fetch:fakeFetch,URL,AbortController}, {filename:'youtube.js'});
(async()=>{
 const api=apiModule.exports;
 const c=await api.getChannel('test-key','@sample');assert.equal(c.title,'샘플');assert.equal(c.subscriberCount,12500);
 const vids=await api.fetchRecentVideos('test-key',c);assert.equal(vids.length,1);assert.equal(vids[0].durationSeconds,130);assert.equal(vids[0].likeCount,null);
 assert.equal(apiCalls.length,3);assert.equal(apiCalls[0].searchParams.get('forHandle'),'@sample');
 assert.equal(apiCalls.every(x=>x.searchParams.get('key')==='test-key'),true);
 console.log('PASS: mocked YouTube API 7 assertions (3 requests)');
})().catch(e=>{console.error(e);process.exitCode=1});
