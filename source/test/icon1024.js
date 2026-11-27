const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']}); const p=await b.newPage({viewport:{width:1024,height:1024}});
const svg=fs.readFileSync('src/icons/icon.svg','utf8').replace('<svg ','<svg width="1024" height="1024" ');
await p.setContent('<html><body style="margin:0">'+svg+'</body></html>'); await p.screenshot({path:'/home/claude/nct-desktop/build/icon.png'}); await b.close(); })();
