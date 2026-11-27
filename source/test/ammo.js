const { chromium } = require('playwright'); const fs=require('fs'); const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{ const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']}); const c=await b.newContext({viewport:{width:1440,height:900}});
await c.route('**/*',r=>r.request().url().startsWith('http://localhost')?r.continue():r.abort());
await c.addInitScript(fs.readFileSync('test/fakepeer.js','utf8'));
const p=await c.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8123/'); await p.fill('#myName','DM'); await p.click('#createBtn'); await p.waitForSelector('#table:not(.hidden)');
await p.click('#tabs button[data-tab=maps]'); await p.click('text=+ Blank grid'); await sleep(200);
await p.click('#tabs button[data-tab=sheets]'); await p.click('text=+ New character'); await sleep(500);
await p.click('.sheettabs button:has-text("Combat")'); await p.click('.sheet >> text=+ Add weapon'); await sleep(500);
await p.click('table.wt button:has-text("Attack")'); await sleep(400);
console.log('left after attack:', await p.inputValue('table.wt tr:nth-child(2) td:nth-child(7) input'));
await p.keyboard.press('Escape'); await p.click('#tabs button[data-tab=chat]'); await sleep(300);
console.log('ammo bar:', (await p.textContent('#ammobar')).replace(/\s+/g,' ').slice(0,60));
await p.click('#ammobar button:has-text("−3")'); await sleep(300);
await p.click('#ammobar button:has-text("−10")'); await sleep(300);
console.log('after −3 and −10:', (await p.textContent('#ammobar .ac')).trim(), '| toast:', (await p.textContent('#toast')).trim().slice(0,60));
await p.click('#ammobar button:has-text("−1")'); await sleep(300); console.log('empty warning:', (await p.textContent('#toast')).includes('empty'));
await p.click('#ammobar button:has-text("mags +")'); await sleep(300); await p.click('#ammobar button:has-text("Reload")'); await sleep(300);
console.log('after reload:', (await p.textContent('#ammobar .ac')).trim());
await p.screenshot({path:'test/t-ammo.png'});
// token size
await p.click('#tabs button[data-tab=sheets]'); await p.click('#sheetsPane >> text=Place'); await sleep(300);
const box=await p.evaluate(()=>{const r=document.querySelector('#canvas').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
let hit=false; for(let dx=-140;dx<=140&&!hit;dx+=10) for(let dy=-140;dy<=140&&!hit;dy+=10){ await p.mouse.click(box.x+box.w/2+dx,box.y+box.h/2+dy); hit=await p.isVisible('#tokenhud'); }
console.log('size bar shown on select:', hit);
await p.click('#tokenhud button:has-text("3")'); await sleep(300);
console.log('size now:', (await p.textContent('#tokenhud .sz')).trim());
await p.screenshot({path:'test/t-tokensize.png'});
console.log('errors:', errs); await b.close(); })();
