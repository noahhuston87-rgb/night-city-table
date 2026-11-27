const { chromium } = require('playwright'); const fs=require('fs'); const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{ const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']}); const ctx=await b.newContext({viewport:{width:1440,height:900}});
await ctx.route('**/*',r=>r.request().url().startsWith('http://localhost')?r.continue():r.abort());
await ctx.addInitScript(fs.readFileSync('test/fakepeer.js','utf8'));
const errs=[];
const gm=await ctx.newPage(); gm.on('pageerror',e=>errs.push('GM '+e.message));
await gm.goto('http://localhost:8123/'); await gm.fill('#myName','DM'); await gm.click('#createBtn'); await gm.waitForSelector('#table:not(.hidden)'); await gm.evaluate(()=>window.__nctAllowWeb()); await new Promise(r=>setTimeout(r,200));
await gm.click('#tabs button[data-tab=maps]'); await gm.click('text=+ Blank grid'); await sleep(200);
const code=await gm.evaluate(()=>location.hash.split('=')[1]);
const pl=await ctx.newPage(); pl.on('pageerror',e=>errs.push('PL '+e.message));
await pl.addInitScript(()=>{ if(!sessionStorage.getItem('x')){ sessionStorage.setItem('x','1'); localStorage.setItem('nct-id','"uP1"'); localStorage.setItem('nct-name','"Ann"'); } });
await pl.goto('http://localhost:8123/#join='+code); await pl.waitForFunction(()=>document.querySelector('#netText').textContent==='Connected');
await pl.click('#tabs button[data-tab=sheets]'); await pl.click('text=+ New character'); await sleep(900); await pl.keyboard.press('Escape');
await pl.click('#sheetsPane >> text=Place'); await sleep(500);
await pl.click('#tabs button[data-tab=init]'); await pl.click('#initPane button.primary'); await sleep(500);
// find the player's token on screen and where 1 square is
const info=await pl.evaluate(()=>{ const r=document.querySelector('#canvas').getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; });
let pt=null; for(let dx=-80;dx<=80&&!pt;dx+=5) for(let dy=-80;dy<=80&&!pt;dy+=5){ await pl.mouse.move(info.x+info.w/2+dx,info.y+info.h/2+dy); if(await pl.evaluate(()=>document.querySelector('#canvas').style.cursor==='grab')) pt={x:info.x+info.w/2+dx,y:info.y+info.h/2+dy}; }
// grid square size on screen: blank grid 30x20 squares fitted into canvas
const sqpx = await pl.evaluate(()=>{ const r=document.querySelector('#canvas').getBoundingClientRect(); return Math.min(r.width/(30*70), r.height/(20*70))*0.95*70; });
const drag=async(from,dxSq)=>{ await pl.mouse.move(from.x,from.y); await pl.mouse.down(); await pl.mouse.move(from.x+dxSq*sqpx, from.y,{steps:6}); await sleep(100); await pl.mouse.up(); await sleep(500); return {x:from.x+dxSq*sqpx,y:from.y}; };
let pos=await drag(pt,3); // 6 m
console.log('after 6 m:', (await pl.textContent('#initPane')).match(/moved [^·]*?m/)[0]);
pos=await drag(pos,4); // +8 m = 14
console.log('after +8 m:', (await pl.textContent('#initPane')).match(/moved [^·]*?m/)[0]);
await pl.mouse.move(pos.x,pos.y); await pl.mouse.down(); await pl.mouse.move(pos.x+3*sqpx,pos.y,{steps:6}); await sleep(150);
await pl.screenshot({path:'test/t-movebudget.png'});
await pl.mouse.up(); await sleep(500);
console.log('too far blocked:', (await pl.textContent('#toast')).toLowerCase().includes('not enough movement'), '| still', (await pl.textContent('#initPane')).match(/moved [^·]*?m/)[0]);
await gm.bringToFront(); await gm.click('#tabs button[data-tab=init]'); await sleep(200); await gm.click('#initPane >> text=New round'); await sleep(500);
await pl.bringToFront(); await sleep(400);
console.log('new round:', (await pl.textContent('#initPane')).match(/Round \d+/)[0], '|', (await pl.textContent('#initPane')).match(/moved [^·]*?m/)[0]);
await gm.bringToFront(); await gm.screenshot({path:'test/t-initpane.png'});
console.log('errors:', errs); await b.close(); })();
