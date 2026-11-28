require('../src/core.js'); const N = globalThis.NCT;
const assert=require('assert');
let S=N.newCampaign('T','gm','DM'); const gm={id:'gm',isGM:true}, pl={id:'p1',isGM:false};
const run=(req,who)=>{ const r=N.handleRequest(S,req,who); for(const o of r.ops) N.apply(S,o); return r; };
run({type:'audio.track.add',track:{name:'Mix',url:'https://www.youtube.com/watch?v=3BFTio5296w',queue:[{v:'3BFTio5296w',d:214,n:'a'},{v:'akiAh12Vt-U',d:179,n:'b'},{v:'bad',d:1}],src:'https://open.spotify.com/playlist/x'}},gm);
const t=Object.values(S.audio.tracks)[0]; assert.equal(t.queue.length,2); assert.equal(t.src,'https://open.spotify.com/playlist/x');
run({type:'music.play',id:t.id},gm); assert.equal(S.audio.music.track.queue.length,2);
assert.ok(N.handleRequest(S,{type:'music.pause'},pl).error, 'player cannot pause');
S.audio.music.startedAt-=30000; run({type:'music.pause'},gm); assert.equal(S.audio.music.playing,false); assert.ok(S.audio.music.paused); assert.ok(Math.abs(S.audio.music.offset-30)<1);
assert.ok(N.handleRequest(S,{type:'music.resume'},pl).error, 'player cannot resume');
run({type:'music.resume'},gm); assert.ok(S.audio.music.playing && !S.audio.music.paused && Math.abs(S.audio.music.offset-30)<1);
assert.ok(N.handleRequest(S,{type:'music.volume',volume:.2},pl).error, 'player cannot change everyone volume');
console.log('PAUSE/QUEUE TESTS PASSED');

// ---- announcements: DM only, and only the chosen players get them ----
{
  let S2 = N.newCampaign('T', 'gm', 'DM'); const gm2 = { id: 'gm', isGM: true };
  const run2 = (req, who) => { const r = N.handleRequest(S2, req, who); for (const o of r.ops) N.apply(S2, o); return r; };
  S2.players.a = { name: 'Ann' }; S2.players.b = { name: 'Bob' };
  assert.ok(N.handleRequest(S2, { type: 'announce.send', text: 'hi' }, { id: 'a', isGM: false }).error, 'players cannot announce');
  const pic = 'data:image/png;base64,iVBORw0KGgo=';
  run2({ type: 'announce.send', title: 'Session 5', text: 'Saturday 7pm', imgs: [pic] }, gm2);
  const r = N.handleRequest(S2, { type: 'announce.send', text: 'Secret for Ann', to: ['a'] }, gm2); for (const o of r.ops) N.apply(S2, o);
  assert.equal(S2.announcements.length, 2);
  assert.equal(N.viewFor(S2, 'a').announcements.length, 2);
  assert.equal(N.viewFor(S2, 'b').announcements.length, 1);
  assert.equal(N.opsFor(r.ops, 'b').length, 0); assert.equal(N.opsFor(r.ops, 'a').length, 1);
  run2({ type: 'announce.delete', id: S2.announcements[0].id }, gm2); assert.equal(S2.announcements.length, 1);
  console.log('ANNOUNCEMENT TESTS PASSED');
}
