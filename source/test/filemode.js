const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']}); const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/nct/dist/night-city-table.html'); await p.waitForTimeout(800);
console.log('file notice visible:', await p.isVisible('#fileNotice'));
await p.fill('#myName','Solo DM'); await p.click('#createBtn'); await p.waitForTimeout(2500);
console.log('file-mode table shown:', await p.isVisible('#table'), '| status:', await p.textContent('#netText'));
await p.click('#tabs button[data-tab=maps]'); await p.waitForTimeout(200); await p.screenshot({path:'test/shot-maps.png'});
console.log('page errors:', errs); await b.close(); })();
