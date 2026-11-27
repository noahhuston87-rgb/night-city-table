const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const svg=fs.readFileSync('src/icons/icon.svg','utf8');
for (const [name,size,pad] of [['icon-192.png',192,0],['icon-512.png',512,0],['icon-maskable-512.png',512,0.12],['apple-touch-icon.png',180,0]]) {
  const p=await b.newPage({viewport:{width:size,height:size}});
  const inner=Math.round(size*(1-2*pad));
  await p.setContent(`<html><body style="margin:0;background:#070a12;display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px">${svg.replace('<svg ','<svg width="'+inner+'" height="'+inner+'" ')}</body></html>`);
  await p.screenshot({path:'src/icons/'+name}); await p.close(); }
await b.close(); console.log('icons done'); })();
