const assert=require('assert'); require('../src/core.js'); const N=globalThis.NCT;
const st=N.newCampaign('T','gm','DM'); st.players.a={id:'a',name:'Ann'}; st.players.b={id:'b',name:'Bob'};
const GM={id:'gm',isGM:true}, A={id:'a'};
const run=(r,s)=>{ const res=N.handleRequest(st,r,s); if(!res.error) res.ops.forEach(o=>N.apply(st,o)); return res; };
run({type:'map.add',name:'M',w:2000,h:2000,grid:70},GM); const mid=st.activeMapId;
run({type:'sheet.upsert',sheet:N.blankSheet()},A); const sid=Object.keys(st.sheets)[0]; // MA 5 -> run 15 m = 7.5 squares
run({type:'token.add',mapId:mid,token:{x:0,y:0,sheetId:sid}},A); const tid=Object.keys(st.maps[mid].tokens)[0];
// no combat: free movement
assert(!run({type:'token.update',mapId:mid,id:tid,patch:{x:700,y:0}},A).error,'free move out of combat');
// start combat
run({type:'roll',formula:'1d10!+5',init:{name:'Ann',sheetId:sid}},A);
run({type:'init.add'},GM);
assert(N.combatOn(st));
assert(!run({type:'token.update',mapId:mid,id:tid,patch:{x:700+70*3,y:0}},A).error,'6 m ok'); assert.equal(st.init.moved[tid],6);
assert(!run({type:'token.update',mapId:mid,id:tid,patch:{x:700+70*7,y:0}},A).error,'split: 8 m more ok'); assert.equal(st.init.moved[tid],14);
const r=run({type:'token.update',mapId:mid,id:tid,patch:{x:700+70*9,y:0}},A); assert(r.error && /movement left/.test(r.error),'over the limit is blocked: '+r.error);
assert(!run({type:'token.update',mapId:mid,id:tid,patch:{x:700+70*9,y:0}},GM).error,'DM can always move');
// new round resets
run({type:'init.set',init:{list:st.init.list,turn:0},newRound:true},GM); assert.equal(Object.keys(st.init.moved).length,0); assert.equal(st.init.round,2);
assert(!run({type:'token.update',mapId:mid,id:tid,patch:{x:700+70*12,y:0}},A).error,'fresh movement next round');
// turn-only rule
run({type:'sheet.upsert',sheet:Object.assign(N.blankSheet(),{name:'Bob'})},{id:'b'}); const bs=Object.values(st.sheets).find(x=>x.name==='Bob').id;
run({type:'roll',formula:'1d10+20',init:{name:'Bob',sheetId:bs}},{id:'b'}); // Bob goes first
run({type:'init.set',init:{list:st.init.list,turn:0,rules:{limit:true,turnOnly:true}}},GM);
const r2=run({type:'token.update',mapId:mid,id:tid,patch:{x:700+70*13,y:0}},A); assert(r2.error && /not your turn/.test(r2.error),'turn-only blocks');
run({type:'init.set',init:{list:st.init.list,turn:1}},GM);
assert(!run({type:'token.update',mapId:mid,id:tid,patch:{x:700+70*13,y:0}},A).error,'on your turn you can move');
// clearing combat frees movement
run({type:'init.set',init:{list:[],turn:0}},GM); assert(!N.combatOn(st));
assert(!run({type:'token.update',mapId:mid,id:tid,patch:{x:0,y:0}},A).error,'free again');
console.log('MOVEMENT TESTS PASSED');
