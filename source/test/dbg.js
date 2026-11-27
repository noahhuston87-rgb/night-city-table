const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']}); const c=await b.newContext();
await c.route('**/*',r=>r.request().url().startsWith('http://localhost')?r.continue():r.abort());
await c.addInitScript(fs.readFileSync('test/fakepeer.js','utf8'));
const p=await c.newPage(); p.on('pageerror',e=>console.log('ERR',e.message)); p.on('console',m=>console.log('CONSOLE',m.type(),m.text()));
await p.goto('http://localhost:8123/night-city-table.html'); await p.fill('#myName','D'); await p.click('#createBtn'); await new Promise(r=>setTimeout(r,1500));
console.log(await p.evaluate(()=>({home:document.querySelector('#home').className, table:document.querySelector('#table').className})));
await b.close(); })();
