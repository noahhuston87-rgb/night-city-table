const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']}); const c=await b.newContext({viewport:{width:1440,height:900}});
await c.route('**/*',r=>r.request().url().startsWith('http://localhost')?r.continue():r.abort());
await c.addInitScript(fs.readFileSync('test/fakepeer.js','utf8'));
const p=await c.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8123/'); await p.fill('#myName','DM'); await p.click('#createBtn'); await p.waitForSelector('#table:not(.hidden)');
await p.click('#tabs button[data-tab=sheets]'); await p.click('text=+ New character'); await p.waitForTimeout(600);
await p.screenshot({path:'test/t-stats.png'});
await p.click('.sheettabs button:has-text("Combat")'); await p.waitForTimeout(200); await p.screenshot({path:'test/t-combat.png'});
for (const t of ['Skills','Cyberware','Gear','Macros','Notes']) { await p.click('.sheettabs button:has-text("'+t+'")'); await p.waitForTimeout(100); }
console.log('tab on:', await p.textContent('.sheettabs button.on'));
await p.click('.sheettabs button:has-text("Skills")'); await p.fill('#skFilter','hand'); await p.waitForTimeout(100); console.log('skill filter rows:', await p.$$eval('.sk', e=>e.length));
console.log('errors:', errs); await b.close(); })();
