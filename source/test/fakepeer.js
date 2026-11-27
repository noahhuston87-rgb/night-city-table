// Test stand-in for PeerJS: routes connections between tabs via BroadcastChannel.
(function(){
  const bc = new BroadcastChannel('fakepeer'); const peers = {};
  function Emitter(){ this._h={}; }
  Emitter.prototype.on=function(e,f){(this._h[e]=this._h[e]||[]).push(f);return this;};
  Emitter.prototype.emit=function(e,...a){(this._h[e]||[]).forEach(f=>{try{f(...a)}catch(x){console.error(x)}});};
  function Conn(peer, remote, id){ Emitter.call(this); this.peer=remote; this.local=peer; this.cid=id; this.open=false; }
  Conn.prototype=Object.create(Emitter.prototype);
  Conn.prototype.send=function(d){ bc.postMessage({kind:'data',to:this.peer,from:this.local.id,cid:this.cid,payload:JSON.parse(JSON.stringify(d))}); };
  Conn.prototype.close=function(){ if(!this.open)return; this.open=false; bc.postMessage({kind:'close',to:this.peer,from:this.local.id,cid:this.cid}); this.emit('close'); };
  function Peer(id){ Emitter.call(this); if(typeof id!=='string') id='anon-'+Math.random().toString(36).slice(2); this.id=id; this.conns={}; this.destroyed=false; peers[id]=this; setTimeout(()=>this.emit('open',id),20); }
  Peer.prototype=Object.create(Emitter.prototype);
  Peer.prototype.connect=function(target){ const cid=Math.random().toString(36).slice(2); const c=new Conn(this,target,cid); this.conns[cid]=c; bc.postMessage({kind:'connect',to:target,from:this.id,cid}); setTimeout(()=>{ if(!c.open) this.emit('error',{type:'peer-unavailable'}); },1500); return c; };
  Peer.prototype.destroy=function(){ this.destroyed=true; delete peers[this.id]; Object.values(this.conns).forEach(c=>c.close()); };
  Peer.prototype.reconnect=function(){};
  bc.onmessage=e=>{ const m=e.data; const p=peers[m.to]; if(!p||p.destroyed) return;
    if(m.kind==='connect'){ const c=new Conn(p,m.from,m.cid); c.open=true; p.conns[m.cid]=c; p.emit('connection',c); bc.postMessage({kind:'accept',to:m.from,from:p.id,cid:m.cid}); setTimeout(()=>c.emit('open'),5); }
    else if(m.kind==='accept'){ const c=p.conns[m.cid]; if(c){c.open=true;c.emit('open');} }
    else if(m.kind==='data'){ const c=p.conns[m.cid]; if(c) c.emit('data',m.payload); }
    else if(m.kind==='close'){ const c=p.conns[m.cid]; if(c&&c.open){c.open=false;c.emit('close');} } };
  window.Peer=Peer;
})();
