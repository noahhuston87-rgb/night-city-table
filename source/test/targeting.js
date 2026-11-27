const { chromium } = require('playwright'); const fs=require('fs'); const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{ const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']}); const ctx=await b.newContext({viewport:{width:1440,height:900}});
await ctx.route('**/*',r=>r.request().url().startsWith('http://localhost')?r.continue():r.abort());
await ctx.addInitScript(fs.readFileSync('test/fakepeer.js','utf8'));
const errs=[];
const gm=await ctx.newPage(); gm.on('pageerror',e=>errs.push('GM '+e.message));
await gm.goto('http://localhost:8123/'); await gm.fill('#myName','DM'); await gm.click('#createBtn'); await gm.waitForSelector('#table:not(.hidden)'); await gm.evaluate(()=>window.__nctAllowWeb()); await new Promise(r=>setTimeout(r,200));
await gm.click('#tabs button[data-tab=maps]'); await gm.click('text=+ Blank grid'); await sleep(200);
// DM makes an NPC with armor and puts it on the map
await gm.click('#tabs button[data-tab=sheets]'); await gm.click('text=+ New NPC'); await sleep(500);
await gm.fill('.dname','Booster'); await gm.press('.dname','Tab'); await sleep(300);
await gm.click('.sheettabs button:has-text("Combat")'); await gm.fill('.spgrid input >> nth=1','10'); await gm.press('.spgrid input >> nth=1','Tab'); await sleep(500); await gm.keyboard.press('Escape'); await sleep(300);
const code=await gm.evaluate(()=>location.hash.split('=')[1]);
const pl=await ctx.newPage(); pl.on('pageerror',e=>errs.push('PL '+e.message));
await pl.addInitScript(()=>{ if(!sessionStorage.getItem('x')){ sessionStorage.setItem('x','1'); localStorage.setItem('nct-id','"uP1"'); localStorage.setItem('nct-name','"Ann"'); } });
await pl.goto('http://localhost:8123/#join='+code); await pl.waitForFunction(()=>document.querySelector('#netText').textContent==='Connected');
await pl.click('#tabs button[data-tab=sheets]'); await pl.click('text=+ New character'); await sleep(900);
await pl.click('.sheettabs button:has-text("Combat")'); await pl.click('.sheet >> text=+ Add weapon'); await sleep(500); await pl.keyboard.press('Escape');
await pl.click('#sheetsPane >> text=Place'); await sleep(400);
await gm.bringToFront(); await gm.click('#sheetsPane .item:has-text("Booster") >> text=Place'); await sleep(400);
await pl.bringToFront(); await sleep(300);
// find the NPC token (the one that isn't ours) and right-click it
const tokScreen = await pl.evaluate(()=>{ const r=document.querySelector('#canvas').getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; });
let found=false;
for(let dx=-120;dx<=120&&!found;dx+=8) for(let dy=-120;dy<=120&&!found;dy+=8){ await pl.mouse.click(tokScreen.x+tokScreen.w/2+dx,tokScreen.y+tokScreen.h/2+dy,{button:'right'}); const t=await pl.$('#ctx'); if(t){ const txt=await t.textContent(); if(/Attack this/.test(txt)) found=true; else await pl.keyboard.press('Escape'); } }
console.log('target menu on NPC:', found);
await pl.click('#ctx >> text=Attack this'); await sleep(300);
console.log('preview:\n' + await pl.textContent('#overlay .mono'));
await pl.screenshot({path:'test/t-attackdialog.png'});
await pl.fill('#overlay input[placeholder^="e.g."]','+20'); await sleep(100);
await pl.click('#overlay button:has-text("ATTACK")'); await sleep(600);
await pl.click('#tabs button[data-tab=chat]'); await sleep(300);
const res=(await pl.$$eval('#chatlog .msg.combat', e=>e.map(x=>x.innerText.replace(/\n+/g,' | '))))[0];
console.log('player sees:', res);
await pl.screenshot({path:'test/t-attackresult.png'});
await gm.bringToFront(); await sleep(300);
console.log('DM sees NPC damage:', await gm.$$eval('#sheetsPane .item', e=>e.map(x=>x.innerText.replace(/\s+/g,' ')).find(t=>/Booster/.test(t))));
console.log('errors:', errs); await b.close(); })();
