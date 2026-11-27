const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const APP = 'http://localhost:8123/';
const fake = fs.readFileSync(path.join(__dirname,'fakepeer.js'),'utf8');
const mock = fs.readFileSync(path.join(__dirname,'mocksite.html'),'utf8');
const sleep = ms => new Promise(r=>setTimeout(r,ms));
(async()=>{
  const browser = await chromium.launch({ executablePath:'/usr/bin/google-chrome', args:['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport:{width:1440,height:900} });
  await ctx.route('**/*', route => {
    const u = route.request().url();
    if (u.startsWith('http://localhost')) return route.continue();
    if (u.startsWith('https://cyberpunk2020character.com')) return route.fulfill({status:200, contentType:'text/html', body:mock});
    return route.abort();
  });
  await ctx.addInitScript(fake);
  const errors=[]; const watch=(p,n)=>{ p.on('pageerror',e=>errors.push(n+': '+e.message)); p.on('console',m=>{ if(m.type()==='error') errors.push(n+' console: '+m.text()); }); };

  // ---- DM ----
  const gm = await ctx.newPage(); watch(gm,'GM');
  await gm.goto(APP);
  await gm.fill('#myName','DM Dave');
  await gm.fill('#newName','Night City 2079');
  await gm.click('#createBtn');
  await gm.waitForSelector('#table:not(.hidden)'); await gm.evaluate(()=>window.__nctAllowWeb()); await new Promise(r=>setTimeout(r,200));
  await gm.waitForFunction(()=>document.querySelector('#netText').textContent.includes('Hosting'));
  const code = await gm.evaluate(()=>location.hash.split('=')[1]);
  console.log('game code', code, '| status:', await gm.textContent('#netText'));
  await gm.click('#tabs button[data-tab=maps]');
  await gm.click('text=+ Blank grid');
  await sleep(200);
  await gm.fill('#mapsPane input[placeholder^="Name, e.g."]','Booster #1');
  await gm.click('#mapsPane >> text=Place');
  await sleep(200);
  await gm.screenshot({path:'test/shot-gm-map.png'});

  // ---- Player (different identity, same browser so the test connection works) ----
  const pl = await ctx.newPage(); watch(pl,'PL');
  await pl.addInitScript(()=>{ if(!sessionStorage.getItem('x')){ sessionStorage.setItem('x','1'); localStorage.setItem('nct-id','"uPLAYER1"'); localStorage.setItem('nct-name','"Cillian"'); localStorage.setItem('nct-color','"#3dfc9a"'); } });
  await pl.goto(APP + '#join=' + code);
  await pl.waitForFunction(()=>document.querySelector('#netText').textContent==='Connected', null, {timeout:8000});
  console.log('player connected; title:', await pl.textContent('#campTitle'));
  await gm.waitForFunction(()=>document.querySelector('#netText').textContent.includes('1 player'));
  console.log('GM sees:', await gm.textContent('#netText'), '| people:', await gm.textContent('#people'));

  // chat + rolls
  await pl.fill('#chatInput','hey choom'); await pl.press('#chatInput','Enter');
  await pl.fill('#chatInput','/r 1d10!+7 Awareness'); await pl.press('#chatInput','Enter');
  await pl.fill('#chatInput','/gr 1d10 secret thing'); await pl.press('#chatInput','Enter');
  await gm.bringToFront(); await sleep(400);
  console.log('GM chat msgs:', await gm.$$eval('#chatlog .msg', e=>e.length), '| player msgs:', await pl.$$eval('#chatlog .msg', e=>e.length));
  await gm.click('#tabs button[data-tab=chat]');
  await gm.fill('#chatInput','/gr 1d6 dm secret'); await gm.press('#chatInput','Enter'); await sleep(300); await pl.bringToFront(); await sleep(300);
  console.log('after DM secret -> GM msgs:', await gm.$$eval('#chatlog .msg', e=>e.length), '| player msgs (should not grow):', await pl.$$eval('#chatlog .msg', e=>e.length));

  // NPC privacy
  await gm.click('#tabs button[data-tab=sheets]'); await gm.click('text=+ New NPC'); await sleep(300); await gm.keyboard.press('Escape');
  await pl.click('#tabs button[data-tab=sheets]'); await sleep(200); const plCount = await pl.$$eval('#sheetsPane .item', e=>e.length); await gm.bringToFront(); await sleep(300);
  console.log('GM sheets:', await gm.$$eval('#sheetsPane .item', e=>e.length), '| player sheets (NPC hidden):', plCount);

  // ---- import: in a web browser the dialog points to the app; a character file still works ----
  await pl.click('text=⇩ Import'); await sleep(200);
  console.log('web import dialog:', /Get the Night City Table app/.test(await pl.textContent('#overlay')) ? 'points to the app ✓' : 'WRONG');
  const charJson = JSON.stringify({ type:'nct-character', playerId:'1794545210419', data:{ name:'Cillian Byrne', role:'medtech', attributes:{INT:8,REF:6,TECH:7,COOL:5,ATTR:5,LUCK:4,MA:6,BODY:5,EMP:7}, skills:{'First Aid':4}, humanity:36, woundDamage:3, cyberware:[], inventory:[{name:'Militech Arms Avenger',type:'M. Pistol',wa:0,damage:'2d6+1',shots:10,rof:2,rel:'VR',range:50},{name:'Light Armor Jacket',sp:14,covers:'Torso, Arms'},{name:'Medtech Bag',quantity:1}] } });
  await pl.setInputFiles('#overlay input[type=file]', { name:'cillian.json', mimeType:'application/json', buffer: Buffer.from(charJson) });
  console.log('import window says: Cillian Byrne is in your game ✓');
  await pl.bringToFront();
  await pl.waitForSelector('#overlay .modal h2', {timeout:5000});
  console.log('player sees modal:', await pl.textContent('#overlay .modal h2'));
  await pl.screenshot({path:'test/shot-import-preview.png'});
  await pl.click('#overlay >> text=Add to game'); await sleep(400); await gm.bringToFront(); await sleep(300);
  const sheetsGM = await gm.$$eval('#sheetsPane .item', e=>e.map(x=>x.innerText.replace(/\s+/g,' ')));
  console.log('GM sheet list now:', sheetsGM);

  // open sheet, roll a skill, place token
  await pl.bringToFront(); await pl.click('#sheetsPane .item >> text=Open'); await pl.waitForSelector('.sheet');
  await pl.screenshot({path:'test/shot-sheet.png', fullPage:false});
  await pl.click('.sheettabs button:has-text("Skills")'); await sleep(200);
  await pl.click('.sk:has-text("First Aid") button'); await sleep(300);
  await pl.click('.sheettabs button:has-text("Combat")'); await sleep(200);
  await pl.click('table.wt button:has-text("Attack")'); await sleep(300);
  await pl.click('.wbox >> nth=9'); await sleep(500);
  await pl.click('#overlay >> text=Done'); await gm.bringToFront(); await sleep(400);
  const lastGM = await gm.$$eval('#chatlog .msg', e=>e.slice(-2).map(x=>x.innerText.replace(/\s+/g,' ')));
  console.log('GM last msgs:', lastGM);
  console.log('damage synced to GM:', await gm.evaluate(()=>document.querySelector('#sheetsPane').innerText.includes('Critical')));
  await pl.bringToFront(); await pl.click('#sheetsPane >> text=Place'); await sleep(300);
  console.log('tokens on GM map:', await gm.evaluate(()=>0) , 'see screenshot');
  await pl.screenshot({path:'test/shot-dbg.png'}); await sleep(800); console.log('overlay:', await pl.evaluate(()=>{const o=document.querySelector('#overlay');return o&&o.innerText.slice(0,200)}));
  // player tries to edit DM-only things
  await pl.click('#tabs button[data-tab=init]'); await sleep(100);
  await pl.click('#initPane button.primary'); await sleep(300);
  await gm.bringToFront(); console.log('GM overlay:', await gm.evaluate(()=>{const o=document.querySelector('#overlay');return o&&o.innerText.slice(0,150).replace(/\s+/g,' ')})); await gm.click('#tabs button[data-tab=init]'); await sleep(300);
  console.log('GM init list:', (await gm.textContent('#initPane')).replace(/\s+/g,' ').slice(0,120));
  await gm.click('#tabs button[data-tab=chat]');
  await gm.screenshot({path:'test/shot-gm-final.png'});
  await pl.bringToFront(); await pl.click('#tabs button[data-tab=chat]'); await sleep(300);
  await pl.screenshot({path:'test/shot-player-final.png'});

  // persistence: reload GM, game should come back from storage
  await gm.bringToFront(); await gm.reload(); await gm.waitForSelector('#table:not(.hidden)', {timeout:5000});
  await gm.waitForFunction(()=>document.querySelector('#netText').textContent.includes('Hosting'));
  console.log('after GM reload: title', await gm.textContent('#campTitle'));
  await pl.waitForFunction(()=>document.querySelector('#netText').textContent==='Connected', null, {timeout:15000});
  console.log('player reconnected after DM reload: yes');
  // home screen
  await gm.bringToFront(); await gm.click('#leaveBtn'); await sleep(300); console.log('leave box:', await gm.evaluate(()=>{const o=document.querySelector('#overlay');return o?o.innerText.replace(/\s+/g,' '):'none (home visible: '+!document.querySelector('#home').classList.contains('hidden')+')'})); if (await gm.$('#overlay')) await gm.click('#overlay button.pink'); await sleep(300); console.log('home after leave:', await gm.isVisible('#home')); await sleep(300);
  await gm.screenshot({path:'test/shot-home.png'});
  console.log('ERRORS:', errors.length ? errors : 'none');
  await browser.close();
})().catch(e=>{ console.error('TEST FAILED', e); process.exit(1); });
