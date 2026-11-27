const { chromium } = require('playwright'); const fs=require('fs');
const mock=fs.readFileSync('test/mocksite.html','utf8'); const fake=fs.readFileSync('test/fakepeer.js','utf8');
(async()=>{ const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:1440,height:900},permissions:['clipboard-read','clipboard-write']});
await c.route('**/*',r=>{const u=r.request().url(); if(u.startsWith('http://localhost'))return r.continue(); if(u.startsWith('https://cyberpunk2020character.com'))return r.fulfill({status:200,contentType:'text/html',body:mock}); return r.abort();});
// 1) the bookmark in desktop mode (no app address): copies the character to the clipboard
const site=await c.newPage(); await site.goto('https://cyberpunk2020character.com/character/1794545210419');
const bmSrc=fs.readFileSync('src/bookmarklet.js','utf8');
await site.evaluate(src=>{ (0,eval)(src+';nctGrab("")'); }, bmSrc);
await site.waitForTimeout(800);
const clip=await site.evaluate(()=>navigator.clipboard.readText());
console.log('bookmark copied character:', clip.startsWith('NCT1:'), '| message:', (await site.textContent('#nct-grab-ui')).replace(/\s+/g,' ').slice(0,90));
// 2) the app with a stand-in desktop bridge
await c.addInitScript(fake);
await c.addInitScript(()=>{ let upd={available:true,version:'1.0.9',url:'https://github.com/x/releases/latest'}; window.__opened=[];
  window.nctDesktop={version:'1.0.3',downloadUrl:'https://github.com/noahhuston87-rgb/night-city-table/releases/latest',getUpdate:()=>upd,onUpdate:()=>{},
   readClipboard:()=>navigator.clipboard.readText(),writeClipboard:t=>navigator.clipboard.writeText(t),openExternal:u=>window.__opened.push(u),openBookmarkPage:h=>window.__opened.push(h.slice(0,11))}; });
const p=await c.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8123/'); await p.waitForTimeout(500);
console.log('update banner:', await p.textContent('#installBar b'), '|', await p.textContent('#installBtn'));
await p.click('#installBtn'); console.log('opened:', await p.evaluate(()=>window.__opened));
await p.screenshot({path:'test/shot-desktop-home.png'});
await p.fill('#myName','DM Dave'); await p.click('#createBtn'); await p.waitForSelector('#table:not(.hidden)');
await p.click('#inviteBtn'); await p.waitForTimeout(200);
console.log('invite message:\n'+await p.inputValue('#overlay textarea'));
await p.screenshot({path:'test/shot-desktop-invite.png'}); await p.keyboard.press('Escape');
// clipboard still holds the character from step 1 → switching to the app offers it
await p.evaluate(()=>window.dispatchEvent(new Event('focus'))); await p.waitForTimeout(500);
console.log('import offered on focus:', await p.textContent('#overlay h2'));
await p.click('#overlay >> text=Add to game'); await p.waitForTimeout(300);
await p.evaluate(()=>window.dispatchEvent(new Event('focus'))); await p.waitForTimeout(400);
console.log('not offered twice:', !(await p.$('#overlay')));
// rename uses the in-app box (desktop apps have no prompt())
await p.click('#tabs button[data-tab=maps]'); await p.click('text=+ Blank grid'); await p.waitForTimeout(200);
await p.click('#tabs button[data-tab=sheets]'); await p.click('#sheetsPane >> text=Place'); await p.waitForTimeout(200);
const box=await p.evaluate(()=>{ const r=document.querySelector('#canvas').getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; });
// find token on screen via app internals: right-click center area until menu appears
let found=false; for(let dx=-140;dx<=140 && !found;dx+=10) for(let dy=-140;dy<=140 && !found;dy+=10){ await p.mouse.click(box.x+box.w/2+dx, box.y+box.h/2+dy,{button:'right'}); if(await p.$('#ctx')) found=true; }
console.log('token menu found:', found);
if(found){ await p.click('#ctx >> text=Rename…'); await p.fill('#overlay input','Doc Byrne'); await p.keyboard.press('Enter'); await p.waitForTimeout(300); console.log('renamed via in-app box:', await p.evaluate(()=>!document.querySelector('#overlay'))); }
await p.click('text=⇩ Import'); await p.click('#overlay >> text=Open the button in my web browser'); console.log('bookmark page requested:', (await p.evaluate(()=>window.__opened)).includes('javascript:'));
console.log('page errors:', errs); await b.close(); })();
