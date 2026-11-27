const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']}); const c=await b.newContext({viewport:{width:1440,height:900}});
await c.route('**/*',r=>r.request().url().startsWith('http://localhost')?r.continue():r.abort());
await c.addInitScript(fs.readFileSync('test/fakepeer.js','utf8'));
await c.addInitScript(()=>{ const upd={available:true,version:'1.0.9',url:'https://github.com/x/releases/tag/v1.0.9'};
  window.nctDesktop={version:'1.0.3',downloadUrl:'x',getUpdate:()=>upd,onUpdate:()=>{},canAutoUpdate:true,readClipboard:async()=>'',writeClipboard:()=>{},openExternal:()=>{},openBookmarkPage:()=>{},onCloseRequested:()=>{},closeNow:()=>{},
   installUpdate:(onP)=>new Promise(res=>{ let p=0; const t=setInterval(()=>{p+=25; onP(p); if(p>=100){clearInterval(t); res(); window.__updated=true;}},100); }) }; });
const p=await c.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8123/'); await p.fill('#myName','DM Dave'); await p.click('#createBtn'); await p.waitForSelector('#table:not(.hidden)');
const id=await p.evaluate(()=>location.hash.split('=')[1]);
await p.click('#leaveBtn'); await p.waitForTimeout(200);
console.log('button:', await p.textContent('#installBtn'), '|', await p.textContent('#installSub'));
await p.goto('http://localhost:8123/'); // fresh start, then host again and update from inside? update lives on home screen
await p.click('#myGames >> text=Open'); await p.waitForSelector('#table:not(.hidden)');
await p.evaluate(()=>{}); await p.click('#leaveBtn'); await p.waitForTimeout(100);
// simulate: DM was hosting when they pressed update (set role by opening game then pressing update via home is not possible) -> call through UI: open game, go home, press Update now
await p.click('#installBtn'); await p.waitForTimeout(150); await p.screenshot({path:'test/shot-updating.png'});
await p.waitForFunction(()=>window.__updated===true); console.log('progress text:', await p.textContent('#overlay p'));
// resume-after-update: set the flag as an update from inside a hosted game would, then "restart"
await p.evaluate(id=>localStorage.setItem('nct-resume-host', JSON.stringify({id, at:Date.now()})), id);
await p.goto('http://localhost:8123/'); await p.waitForTimeout(800);
console.log('reopened game after update:', await p.isVisible('#table'), '| code matches:', (await p.evaluate(()=>location.hash)).includes(id));
console.log('errors:', errs); await b.close(); })();
