const { chromium } = require('playwright'); const fs=require('fs');
const src=fs.readFileSync('src/bookmarklet.js','utf8');
const script = src + '\n;(' + 'nctSiteHelper' + ')();';
const character={id:'1794545210419',name:'Cillian Byrne',role:'medtech',attributes:{INT:8,REF:6,TECH:7,COOL:5,ATTR:5,LUCK:4,MA:6,BODY:5,EMP:7},skills:{'First Aid':4},humanity:36,woundDamage:3,cyberware:[],inventory:[]};
// a page shaped like the real site: it fetches its data over socket.io long-polling, nothing readable in the page itself
const page=`<!DOCTYPE html><html><head><title>NCSE DATATERM v2.77</title></head><body><div id="root">CHARACTER SHEET</div>
<script>const x=new XMLHttpRequest(); x.open('GET','/socket.io/?EIO=4&transport=polling&t=1'); x.send();</script></body></html>`;
(async()=>{ const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']}); const c=await b.newContext({viewport:{width:1280,height:800}});
let sent=null;
await c.route('**/*', r=>{ const u=r.request().url();
  if (u.startsWith('https://nct-import.local/')) { sent=u; return r.fulfill({status:204,body:''}); }
  if (u.includes('/socket.io/')) return r.fulfill({status:200,contentType:'text/plain',body:'40{"sid":"x"}\x1e42["character:data",'+JSON.stringify(Object.assign({playerId:character.id},character))+']'});
  if (u.startsWith('https://cyberpunk2020character.com')) return r.fulfill({status:200,contentType:'text/html',body:page});
  return r.abort(); });
await c.addInitScript(script);
const p=await c.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('https://cyberpunk2020character.com/character/1794545210419'); await p.waitForTimeout(800);
console.log('bar shown:', await p.isVisible('#nct-bar'), '| captured:', await p.evaluate(()=>Object.keys(window.__nctCap.chars)));
await p.screenshot({path:'test/t-sitebar.png'});
await p.click('#nct-send'); await p.waitForTimeout(800);
const data = sent && JSON.parse(new URL(sent).searchParams.get('d'));
console.log('sent to app:', data ? data.type + ' / ' + data.data.name + ' / REF ' + data.data.attributes.REF : 'nothing');
console.log('errors:', errs); await b.close(); })();
