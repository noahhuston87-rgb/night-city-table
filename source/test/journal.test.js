const assert=require('assert'); require('../src/core.js'); const N=globalThis.NCT;
const st=N.newCampaign('T','gm','DM'); st.players.a={id:'a',name:'Ann'}; st.players.b={id:'b',name:'Bob'};
const GM={id:'gm',isGM:true}, A={id:'a'}, B={id:'b'};
// simulate the host: apply + per-player diffs, tracking what each player holds
const held={a:N.viewFor(st,'a'),b:N.viewFor(st,'b')};
function run(req,sender){ const res=N.handleRequest(st,req,sender); if(res.error) return res;
  const j=res.ops.filter(o=>o.type.startsWith('journal.')); const before={a:N.journalView(st,'a'),b:N.journalView(st,'b')};
  const changed=new Set(j.map(o=>o.folder?'f:'+o.folder.id:o.entry?'e:'+o.entry.id:''));
  res.ops.forEach(o=>N.apply(st,o));
  for(const p of ['a','b']){ const ops=N.opsFor(res.ops,p).concat(j.length?N.journalDiff(st,before[p],p,changed):[]); ops.forEach(o=>N.apply(held[p],o)); }
  return res; }
run({type:'journal.folder.upsert',folder:{name:'Secret plot'}},GM);
const fid=Object.keys(st.journal.folders)[0];
run({type:'journal.entry.upsert',entry:{title:'Twist',body:'The fixer is a rat',folderId:fid,vis:{mode:'gm'}}},GM);
const eid=Object.keys(st.journal.entries)[0];
assert.equal(Object.keys(held.a.journal.entries).length,0,'hidden entry leaked'); assert.equal(Object.keys(held.a.journal.folders).length,0,'hidden folder name leaked');
run({type:'journal.entry.upsert',entry:{id:eid,title:'Twist',body:'The fixer is a rat',folderId:fid,vis:{mode:'some',ids:['a']}}},GM);
assert(held.a.journal.entries[eid],'chosen player should see it'); assert(held.a.journal.folders[fid]); assert(!held.b.journal.entries[eid],'other player must not see it');
run({type:'journal.folder.vis',id:fid,vis:{mode:'all'}},GM);
assert(held.b.journal.entries[eid] && held.b.journal.folders[fid],'show all');
run({type:'journal.folder.vis',id:fid,vis:{mode:'gm'}},GM);
assert(!held.a.journal.entries[eid] && !held.b.journal.entries[eid] && !held.a.journal.folders[fid],'hide all removes it again');
// player notes
run({type:'journal.entry.upsert',entry:{title:'Ann private to DM',body:'x',vis:{mode:'gm'}}},A);
const an=Object.values(st.journal.entries).find(e=>e.title==='Ann private to DM');
assert(held.a.journal.entries[an.id] && !held.b.journal.entries[an.id] && st.journal.entries[an.id],'player->DM note');
assert(N.handleRequest(st,{type:'journal.entry.upsert',entry:{id:an.id,title:'hack'}},B).error,'Bob cannot edit Ann note');
assert(N.handleRequest(st,{type:'journal.folder.upsert',folder:{name:'x'}},A).error,'players cannot make folders');
// fresh join view also filters
assert(!N.viewFor(st,'b').journal.entries[eid]);
// audio: only the DM, and players never get the library
assert(N.handleRequest(st,{type:'audio.track.add',track:{name:'x',url:'https://a/b.mp3'}},A).error);
run({type:'audio.track.add',track:{name:'Afterlife',kind:'music',url:'https://example.com/a.mp3'}},GM);
assert.equal(Object.keys(held.a.audio.tracks).length,0,'library leaked');
const tid=Object.keys(st.audio.tracks)[0];
run({type:'music.play',id:tid},GM); assert(held.a.audio.music.playing && held.a.audio.music.track.url,'player gets what is playing');
assert(N.handleRequest(st,{type:'audio.track.add',track:{name:'x',url:'javascript:alert(1)'}},GM).error,'only https links');
// theme sharing
run({type:'meta',theme:{p:'#ff0000',bg:'#000000',s:'#00ff00'}},GM); assert.equal(held.a.theme.p,'#ff0000');
// old saves get the new sections
const old=JSON.parse(JSON.stringify(st)); delete old.journal; delete old.audio; N.upgrade(old); assert(old.journal.entries && old.audio.music);
console.log('JOURNAL/AUDIO PRIVACY TESTS PASSED');
