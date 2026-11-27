const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']}); const c=await b.newContext({viewport:{width:1440,height:900}});
await c.route('**/*',r=>r.request().url().startsWith('http://localhost')?r.continue():r.abort());
const p=await c.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8123/'); await p.waitForTimeout(1500);
await p.reload(); await p.waitForTimeout(1000);
console.log('service worker controlling page:', await p.evaluate(()=>!!navigator.serviceWorker.controller));
const cdp=await c.newCDPSession(p);
const inst=await cdp.send('Page.getInstallabilityErrors'); console.log('installability errors:', JSON.stringify(inst.installabilityErrors));
const man=await cdp.send('Page.getAppManifest'); console.log('manifest errors:', JSON.stringify(man.errors), '| parsed name:', man.parsed && man.parsed.name);
console.log('install bar visible:', await p.isVisible('#installBar'), '| button:', await p.textContent('#installBtn'));
await p.screenshot({path:'test/shot-home-install.png'});
// offline: app still opens from the saved copy
await c.setOffline(true); await p.reload(); await p.waitForTimeout(800);
console.log('opens offline:', await p.isVisible('#home'));
console.log('errors:', errs); await b.close(); })();
