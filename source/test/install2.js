const { chromium } = require('playwright');
(async()=>{ const c=await chromium.launchPersistentContext('/tmp/nct-profile-'+Date.now(),{executablePath:'/usr/bin/google-chrome',args:['--no-sandbox'],viewport:{width:1440,height:900}});
await c.route('**/*',r=>r.request().url().startsWith('http://localhost')?r.continue():r.abort());
const p=await c.newPage(); await p.goto('http://localhost:8123/'); await p.waitForTimeout(1500); await p.reload(); await p.waitForTimeout(1500);
const cdp=await c.newCDPSession(p);
console.log('installability errors:', JSON.stringify((await cdp.send('Page.getInstallabilityErrors')).installabilityErrors));
console.log('install button:', await p.textContent('#installBtn'));
await p.screenshot({path:'test/shot-home-install.png'}); await c.close(); })();
