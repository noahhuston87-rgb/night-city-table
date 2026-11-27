const assert = require('assert');
require('../src/core.js'); const N = globalThis.NCT;
// dice
for (let i=0;i<500;i++){ const r=N.roll('1d10!+7'); assert(r.total>=8); }
let r=N.roll('3d6'); assert(r.total>=3&&r.total<=18);
r=N.roll('4d6kh3'); assert(r.parts[0].rolls.length===4 && r.total<=18);
r=N.roll('2d6+1d10-3'); assert(r.parts.length===3);
assert.throws(()=>N.roll('2x6')); assert.throws(()=>N.roll('1000d6'));
let crit=0,fum=0; for(let i=0;i<5000;i++){const q=N.roll('1d10!'); if(q.crit)crit++; if(q.fumble)fum++;} assert(crit>300&&fum>300);
console.log('roll text:', N.rollToText(N.roll('1d10!+12')));
// campaign + permissions
const st=N.newCampaign('Test','gm1','DM'); st.players.p1={id:'p1',name:'Ann'};
const apply=(res)=>{ assert(!res.error, res.error); res.ops.forEach(o=>N.apply(st,o)); return res; };
apply(N.handleRequest(st,{type:'map.add',name:'Bar',w:1000,h:800},{id:'gm1',isGM:true}));
assert(st.activeMapId);
assert(N.handleRequest(st,{type:'map.add',name:'x'},{id:'p1'}).error);
apply(N.handleRequest(st,{type:'sheet.upsert',sheet:N.blankSheet()},{id:'p1'}));
const sid=Object.keys(st.sheets)[0]; assert.equal(st.sheets[sid].ownerId,'p1');
apply(N.handleRequest(st,{type:'token.add',mapId:st.activeMapId,token:{x:10,y:10,sheetId:sid,name:'Ann'}},{id:'p1'}));
const tid=Object.keys(st.maps[st.activeMapId].tokens)[0];
apply(N.handleRequest(st,{type:'token.update',mapId:st.activeMapId,id:tid,patch:{x:99,hidden:true}},{id:'p1'}));
assert.equal(st.maps[st.activeMapId].tokens[tid].x,99); assert.equal(st.maps[st.activeMapId].tokens[tid].hidden,false);
st.players.p2={id:'p2'}; assert(N.handleRequest(st,{type:'token.update',mapId:st.activeMapId,id:tid,patch:{x:1}},{id:'p2'}).error);
assert(N.handleRequest(st,{type:'sheet.upsert',sheet:Object.assign({},st.sheets[sid],{name:'hax'})},{id:'p2'}).error);
// chat + private roll
apply(N.handleRequest(st,{type:'chat',text:'/gr 1d10! sneaky'},{id:'p1'}));
apply(N.handleRequest(st,{type:'chat',text:'hello <b>'},{id:'p2'}));
assert.equal(N.viewFor(st,'p2').chat.length,1); assert.equal(N.viewFor(st,'gm1').chat.length,2);
apply(N.handleRequest(st,{type:'roll',formula:'1d10!+8',label:'Init',init:{name:'Ann',sheetId:sid}},{id:'p1'}));
assert.equal(st.init.list.length,1);
// derived
const sh=st.sheets[sid]; sh.damage=10; assert.equal(N.woundInfo(10).label,'Critical'); assert.equal(N.effStat(sh,'REF'),3);
assert.equal(N.woundInfo(13).label,'Mortal 0'); assert.equal(N.woundInfo(20).label,'Mortal 1');
// import mapping using the site's field names
const site={id:'1794545210419',name:'Cillian',role:'medtech',attributes:{INT:8,REF:6,TECH:7,COOL:5,ATTR:5,LUCK:4,MA:6,BODY:5,EMP:7},tempModifiers:{REF:1},
 skills:{'First Aid':4,'Awareness/Notice':5,'Diagnose Illness':3,'Pharmaceuticals':2}, customSkills:{'Know Language: Irish':{level:6,stat:'INT'}}, specialAbility:5,
 cyberware:[{name:'Cyberoptics',hl:4,location:'eyes',desc:'Basic'}], inventory:[{name:'Militech Arms Avenger',type:'M. Pistol',wa:0,damage:'2d6+1',shots:10,rof:2,rel:'VR',range:50},{name:'Armor Jacket',sp:14,covers:'Torso, Arms'},{name:'Medkit',quantity:2}],
 humanity:36, woundDamage:3, mainEddies:1200, reputation:2, notes:'Sold to a ripperdoc', affiliations:['Trauma Team']};
const imp=N.fromCP2020Site(site,{playerId:'1794545210419'});
assert.equal(imp.role,'medtech'); assert.equal(imp.stats.REF.base,6); assert.equal(imp.stats.REF.mod,1);
assert.equal(imp.skills.find(s=>s.name==='First Aid').value,4); assert.equal(imp.skills.find(s=>s.name==='Know Language: Irish').stat,'INT');
assert.equal(imp.weapons[0].skill,'Handgun'); assert.equal(imp.sp.torso,14); assert.equal(imp.sp.lArm,14); assert.equal(imp.sp.head,0);
const cleaned=N.sanitizeSheet(imp); assert.equal(cleaned.name,'Cillian');
console.log('ALL CORE TESTS PASSED');
