// v1.5.0 dependency-free regression tests; run with node scripts/dashboard-ranking-regression.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
let ts; try {ts = require('typescript');} catch {ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');}
const src = fs.readFileSync(require('node:path').join(__dirname,'../src/lib/rankings.ts'),'utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};vm.runInNewContext(js,{module:mod,exports:mod.exports,require,Date,Set,Map},{filename:'rankings.js'});
const {dashboardSelection,topViewed,risingObserved}=mod.exports;
const now=Date.parse('2026-10-09T12:00:00Z');const h=3600000;const d=86400000;
function video(id,c,days=2,views=100){return {id,channelId:c,viewCount:views,publishedAt:new Date(now-days*d).toISOString()};}
function snap(id,hours,views){return {id:`${id}:${hours}`,videoId:id,collectedAt:new Date(now-hours*h).toISOString(),viewCount:views};}
const videos=[video('mine','mine'),video('other','other',50,300),video('comp','comp',5,200)];
assert.deepEqual(Array.from(dashboardSelection(videos,'all','all','mine',new Set(['comp']),now).map(x=>x.id)),['mine','other','comp']);
assert.deepEqual(Array.from(dashboardSelection(videos,'mine','all','mine',new Set(['comp']),now).map(x=>x.id)),['mine']);
assert.deepEqual(Array.from(dashboardSelection(videos,'competitors','all','mine',new Set(['comp']),now).map(x=>x.id)),['comp']);
assert.deepEqual(Array.from(dashboardSelection(videos,'all','30','mine',new Set(),now).map(x=>x.id)),['mine','comp']);
assert.deepEqual(Array.from(dashboardSelection(videos,'all','90','mine',new Set(),now).map(x=>x.id)),['mine','other','comp']);
assert.deepEqual(Array.from(topViewed([video('a','x',2,null),video('b','x',2,12),video('c','x',2,15)]).map(x=>x.id)),['c','b']);
assert.equal(risingObserved([video('a','x')],[snap('a',0,110)],now).length,0);
assert.equal(risingObserved([video('a','x')],[snap('a',0,110),snap('a',.5,100)],now).length,0);
const ranked=risingObserved([video('a','x'),video('b','x')],[snap('a',0,500),snap('a',10,100),snap('b',0,190),snap('b',1,100)],now);
assert.deepEqual(Array.from(ranked.map(x=>x.video.id)),['b','a']);
assert.equal(ranked[0].viewsPerHour,90);assert.equal(ranked[0].deltaViews,90);
assert.equal(risingObserved([video('a','x')],[snap('a',0,80),snap('a',5,100)],now).length,0);
assert.equal(risingObserved([video('a','x')],[snap('a',9*24,150),snap('a',10*24,100)],now).length,0);
assert.equal(risingObserved([video('a','x')],[snap('a',-1,150),snap('a',2,100)],now).length,0);
const choice=risingObserved([video('a','x')],[snap('a',0,200),snap('a',.2,199),snap('a',2,150),snap('b',0,1000),snap('b',2,2)],now);
assert.equal(choice.length,1);assert.equal(choice[0].hours,2);assert.equal(choice[0].deltaViews,50);
const app=fs.readFileSync(require('node:path').join(__dirname,'../src/App.tsx'),'utf8');
for(const fragment of ["useState<DashboardScope>('all')","영상 TOP","급상승 (관측)",'채널 정보 없음','dashboard-ranking-toolbar']) assert.ok(app.includes(fragment),`UI missing ${fragment}`);
console.log('PASS: dashboard scope, time periods, top views, rising observations, UI wiring (18 assertions)');
