const assert=require('assert'); require('../src/core.js'); const N=globalThis.NCT;
// range bands with your table
assert.equal(N.weaponRange({type:'M. Pistol',skill:'Handgun'},N.blankSheet()),50);
assert.equal(N.weaponRange({type:'SMG',skill:'Submachinegun'},N.blankSheet()),150);
assert.equal(N.weaponRange({type:'Shotgun'},N.blankSheet()),50);
assert.equal(N.weaponRange({type:'Assault Rifle'},N.blankSheet()),400);
const b=N.blankSheet(); b.stats.BODY.base=8; assert.equal(N.weaponRange({type:'Thrown'},b),80);
assert.equal(N.weaponRange({type:'Rifle',range:'800m'},b),800);
const band=(d,r)=>N.rangeBand(d,r);
assert.equal(band(2,50),0); assert.equal(band(2.8,50),0); assert.equal(band(12,50),1); assert.equal(band(25,50),2); assert.equal(band(50,50),3); assert.equal(band(100,50),4); assert.equal(band(101,50),-1);
assert.deepEqual(N.RANGE_BANDS.map(x=>x[1]),[10,15,20,25,30]);
// a fight
const st=N.newCampaign('T','gm','DM'); st.players.a={id:'a',name:'Ann'};
const GM={id:'gm',isGM:true}, A={id:'a'};
const run=(r,s)=>{ const res=N.handleRequest(st,r,s); if(!res.error) res.ops.forEach(o=>N.apply(st,o)); return res; };
run({type:'map.add',name:'M',w:20000,h:2000,grid:70},GM); const mid=st.activeMapId;
const me=N.blankSheet(); me.name='Ann'; me.stats.REF.base=8; me.skills.find(k=>k.name==='Handgun').value=6; me.skills.find(k=>k.name==='Martial Arts').value=4;
me.weapons=[{name:'Avenger',type:'M. Pistol',wa:0,damage:'2d6+1',rof:'2',shots:'10',range:'50',rel:'VR',skill:'Handgun',left:10,mags:1},{name:'Knife',type:'Melee',damage:'1d6',skill:'Melee',shots:''}];
run({type:'sheet.upsert',sheet:me},A); const aid=Object.values(st.sheets).find(x=>x.name==='Ann').id;
const npc=N.blankSheet(); npc.name='Booster'; npc.sp.torso=10; run({type:'sheet.upsert',sheet:npc},GM); const nid=Object.values(st.sheets).find(x=>x.name==='Booster').id;
run({type:'token.add',mapId:mid,token:{x:0,y:0,sheetId:aid,name:'Ann'}},A); run({type:'token.add',mapId:mid,token:{x:70*10,y:0,sheetId:nid,name:'Booster'}},GM);
const [ta,tn]=Object.values(st.maps[mid].tokens);
const atk=(extra,who)=>run(Object.assign({type:'attack',mapId:mid,attackerToken:ta.id,targetToken:tn.id,weapon:0,mode:'single'},extra),who||A);
let r=atk({}); assert(!r.error,r.error); const msg=st.chat[st.chat.length-1].msg||st.chat[st.chat.length-1];
const c=st.chat[st.chat.length-1].combat; console.log(c.title,'|',c.hit?'HIT':'MISS'); c.lines.forEach(l=>console.log('   '+l));
assert(/20 m · Medium .* needs 20/.test(c.lines.join('\n')),'20 m with a 50 m pistol is Medium (DV 20)');
assert.equal(Object.values(st.sheets).find(x=>x.name==='Ann').weapons[0].left,9,'used a round');
// knife from 20 m away is refused
assert(/Too far for a melee/.test(atk({weapon:1}).error));
// someone else's character can't attack
assert(/not your character/.test(run({type:'attack',mapId:mid,attackerToken:tn.id,targetToken:ta.id,weapon:0},A).error));
// out of range
st.maps[mid].tokens[tn.id].x=70*60; assert(/out of range/.test(atk({}).error)); st.maps[mid].tokens[tn.id].x=70*1;
// many attacks point blank: damage lands, wounds add up, armor wears, never negative
let hits=0, wounds=0; for(let i=0;i<300;i++){ const s0=JSON.parse(JSON.stringify(st.sheets[nid])); const sw=Object.values(st.sheets).find(x=>x.name==='Ann'); sw.weapons[0].left=10; st.sheets[nid]=Object.assign(N.blankSheet(),{id:nid,name:'Booster',sp:{head:0,torso:10,rArm:0,lArm:0,rLeg:0,lLeg:0}});
  const rr=atk({}); assert(!rr.error,rr.error); const cc=st.chat[st.chat.length-1].combat; if(cc.hit){hits++; wounds+=cc.wounds; assert(st.sheets[nid].damage===Math.min(41,cc.wounds) || (st.sheets[nid].damage===41 && cc.lines.some(l=>/killed outright/.test(l))));} assert(st.sheets[nid].damage>=0 && st.sheets[nid].damage<=41); }
console.log('300 point-blank shots: hits',hits,'avg wounds per hit',(wounds/hits).toFixed(1));
assert(hits>250,'REF 8 + Handgun 6 vs DV 10 should almost always hit');
// burst + full auto use the right ammo
const sw=Object.values(st.sheets).find(x=>x.name==='Ann'); sw.weapons[0].left=10; atk({mode:'burst'}); assert.equal(st.sheets[aid].weapons[0].left,7);
atk({mode:'auto',rounds:10}); assert.equal(st.sheets[aid].weapons[0].left,0,'only 7 left so it fires 7');
assert(/empty/.test(atk({}).error),'empty gun');
// melee next to them: opposed by the target dodging; unarmed kick with martial arts adds skill to damage
st.maps[mid].tokens[tn.id].x=70; const k=atk({weapon:'unarmed:kick'}); assert(!k.error,k.error);
console.log('kick:', st.chat[st.chat.length-1].combat.lines.join(' | '));
// the DM can attack with an NPC
st.sheets[aid].damage=0; const g=run({type:'attack',mapId:mid,attackerToken:tn.id,targetToken:ta.id,weapon:'unarmed:punch'},GM); assert(!g.error,g.error);
// called shot to the head + cover + AP
st.maps[mid].tokens[tn.id].x=70*3; Object.values(st.sheets).find(x=>x.name==='Ann').weapons[0].left=10;
atk({called:'head',cover:10,ap:true,hitMod:'+20'}); const ch=st.chat[st.chat.length-1].combat; console.log('called head shot:', ch.lines.filter(l=>/Hit 1|Attack/.test(l)).join(' | '));
assert(ch.lines.some(l=>/called shot/.test(l)) && (ch.fumble || ch.lines.some(l=>/Hit 1 · Head/.test(l))));
console.log('ATTACK TESTS PASSED');
