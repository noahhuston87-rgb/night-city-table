const { chromium } = require('playwright'); const fs=require('fs'); const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{ const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']}); const c=await b.newContext({viewport:{width:1440,height:900}});
await c.route('**/*',r=>r.request().url().startsWith('http://localhost')?r.continue():r.abort());
await c.addInitScript(fs.readFileSync('test/fakepeer.js','utf8'));
const p=await c.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8123/'); await p.fill('#myName','DM'); await p.click('#createBtn'); await p.waitForSelector('#table:not(.hidden)');
await p.click('#tabs button[data-tab=maps]'); await p.click('text=+ Blank grid'); await sleep(200);
await p.click('#tabs button[data-tab=sheets]'); await p.click('text=+ New character'); await sleep(400); await p.keyboard.press('Escape');
await p.click('#sheetsPane >> text=Place'); await sleep(300);
const box=await p.evaluate(()=>{const r=document.querySelector('#canvas').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
// find the token
let pt=null; for(let dx=-60;dx<=60&&!pt;dx+=6) for(let dy=-60;dy<=60&&!pt;dy+=6){ await p.mouse.move(box.x+box.w/2+dx,box.y+box.h/2+dy); if(await p.evaluate(()=>document.querySelector('#canvas').style.cursor==='grab')) pt={x:box.x+box.w/2+dx,y:box.y+box.h/2+dy}; }
console.log('token found:', !!pt);
await p.mouse.down(); await p.mouse.move(pt.x+150, pt.y+60, {steps:8}); await sleep(150);
await p.screenshot({path:'test/t-moveruler-short.png'});
await p.mouse.move(pt.x+420, pt.y-200, {steps:8}); await sleep(150);
await p.screenshot({path:'test/t-moveruler-far.png'});
await p.mouse.up(); await sleep(200);
console.log('errors:', errs); await b.close(); })();
