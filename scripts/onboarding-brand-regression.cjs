// Dependency-free regression suite for uploaded assets and dashboard intro preference.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname,'..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(),'radar-intro-'));
let passed=0;
function test(name,fn){fn();passed++;console.log(`PASS ${name}`);}
try {
 cp.execFileSync('tsc',['src/lib/dashboardIntro.ts','--target','ES2022','--module','commonjs','--lib','ES2022,DOM','--strict','--noUnusedLocals','--outDir',temp],{cwd:root,stdio:'pipe'});
 const {introHasBeenSeen,recordIntroSeen,DASHBOARD_INTRO_SEEN_KEY,browserIntroStorage}=require(path.join(temp,'dashboardIntro.js'));
 test('First visit expands, later visit collapses',()=>{
   const data=new Map();const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
   assert.equal(introHasBeenSeen(storage),false);
   assert.equal(data.has(DASHBOARD_INTRO_SEEN_KEY),false,'Initializer must not write (StrictMode double-render)');
   assert.equal(introHasBeenSeen(storage),false);
   recordIntroSeen(storage);
   assert.equal(introHasBeenSeen(storage),true);
 });
 test('Storage failures do not block navigation',()=>{
   const blocked={getItem(){throw Error('SecurityError')},setItem(){throw Error('SecurityError')}};
   assert.equal(introHasBeenSeen(blocked),false);
   assert.doesNotThrow(()=>recordIntroSeen(blocked));
   assert.equal(introHasBeenSeen(null),false);
   assert.doesNotThrow(()=>recordIntroSeen(null));
   assert.equal(browserIntroStorage(),null,'Node has no window');
 });
 test('Recognition only of explicit seen marker',()=>{
   const storage={getItem:()=> 'false',setItem(){}};
   assert.equal(introHasBeenSeen(storage),false);
   storage.getItem=()=> '1';
   assert.equal(introHasBeenSeen(storage),true);
 });
 const app=fs.readFileSync(path.join(root,'src/App.tsx'),'utf8');
 const css=fs.readFileSync(path.join(root,'src/ui-polish.css'),'utf8');
 test('Dashboard mounts and stores after initial state',()=>{
   const p=app.indexOf('const [introExpanded,setIntroExpanded]');const effect=app.indexOf('useEffect(()=>{recordIntroSeen(');
   assert(p>=0&&effect>p,'First rendering must not write storage');
   assert(app.includes("aria-controls=\"dashboard-intro-panel\""));
   assert(app.includes('aria-expanded={introExpanded}'));
   assert(app.includes('hidden={!introExpanded}'));
   assert(app.includes("setIntroExpanded(v=>!v)"));
 });
 test('Collapsed content does not occupy hero space',()=>{
   assert(css.includes('.dashboard-intro #dashboard-intro-panel[hidden] {display:none;}'));
   assert(css.includes('.dashboard-intro-bar'));
   assert(css.includes('@media(max-width:760px)'));
 });
 test('Supplied logo displayed in sidebar and topbar',()=>{
   assert(app.includes('<img src="/logo.png" alt="" width={40} height={40}/>'));
   assert(app.includes('<img src="/logo.png" alt="" width={30} height={30}/>'));
 });
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 function size(file){const buf=fs.readFileSync(path.join(root,'public',file));assert.equal(buf.toString('hex',0,8),'89504e470d0a1a0a');return [buf.readUInt32BE(16),buf.readUInt32BE(20)];}
 test('Open Graph file is real PNG with matching metadata dimensions',()=>{
   assert.deepEqual(size('og-image.png'),[1200,630]);
   assert(html.includes('property="og:image" content="https://youtube-radar-six.vercel.app/og-image.png"'));
   assert(html.includes('name="twitter:image" content="https://youtube-radar-six.vercel.app/og-image.png"'));
   assert(html.includes('property="og:image:width" content="1200"'));
   assert(html.includes('property="og:image:height" content="630"'));
 });
 test('Brand favicon and Apple touch icon point to actual PNGs',()=>{
   assert.deepEqual(size('logo.png'),[1254,1254]);
   assert.deepEqual(size('favicon.png'),[64,64]);
   assert.deepEqual(size('apple-touch-icon.png'),[180,180]);
   assert(html.includes('href="/favicon.png"'));
   assert(html.includes('href="/apple-touch-icon.png"'));
 });
 console.log(`Onboarding & brand regressions: ${passed}/${passed} PASS`);
}finally{fs.rmSync(temp,{recursive:true,force:true});}
