/* ===== Night City Table — app ===== */
(function () {
  'use strict';
  const N = window.NCT;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  function el(tag, props, ...kids) {
    const e = document.createElement(tag);
    if (props) for (const k in props) {
      const v = props[k]; if (v === undefined || v === null || v === false) continue;
      if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k === 'style') e.setAttribute('style', v);
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'value') e.value = v; else if (k === 'checked') e.checked = !!v; else if (k === 'disabled') e.disabled = !!v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) { if (c === null || c === undefined || c === false) continue; e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c); }
    return e;
  }
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { } }
  };
  function toast(msg, err) { const t = el('div', { class: err ? 'err' : '', text: msg }); $('#toast').appendChild(t); setTimeout(() => t.remove(), err ? 5000 : 3000); }
  const sign = n => (n >= 0 ? '+' + n : '-' + (-n));
  const timeStr = ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const ago = ts => { const s = (Date.now() - ts) / 1000; if (s < 90) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; return Math.round(s / 86400) + ' days ago'; };

  // ---------- identity ----------
  const me = { id: LS.get('nct-id', null), name: LS.get('nct-name', ''), color: LS.get('nct-color', '#00ff00') };
  if (!me.id) { me.id = 'u' + N.uid(12); LS.set('nct-id', me.id); }
  const DESKTOP = !!window.nctDesktop; // running inside the installed desktop app
  const ONLINE = !DESKTOP && /^https?:$/.test(location.protocol);
  const APP_URL = ONLINE ? location.origin + location.pathname : '';
  const PEER_PREFIX = 'nctable-v1-';

  // ---------- IndexedDB (games are stored on the DM's computer) ----------
  const DB = {
    _db: null,
    open() {
      if (this._db) return Promise.resolve(this._db);
      return new Promise((res, rej) => {
        const r = indexedDB.open('night-city-table', 3);
        r.onupgradeneeded = () => { const db = r.result; for (const n of ['games', 'audio', 'audiocache', 'books', 'booktext']) if (!db.objectStoreNames.contains(n)) db.createObjectStore(n, { keyPath: 'id' }); };
        r.onsuccess = () => { this._db = r.result; res(this._db); };
        r.onerror = () => rej(r.error);
      });
    },
    tx(store, mode, fn) { return this.open().then(db => new Promise((res, rej) => { const t = db.transaction(store, mode); const out = fn(t.objectStore(store)); t.oncomplete = () => res(out instanceof IDBRequest ? out.result : out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('Storage is full')); })); },
    all(store) { return this.tx(store || 'games', 'readonly', s => s.getAll()); },
    get(id, store) { return this.tx(store || 'games', 'readonly', s => s.get(id)); },
    put(g, store) { return this.tx(store || 'games', 'readwrite', s => s.put(g)); },
    del(id, store) { return this.tx(store || 'games', 'readwrite', s => s.delete(id)); }
  };

  // ---------- runtime state ----------
  let clockSkew = 0;       // DM's clock minus ours, for keeping music in sync
  const audioWaiters = new Map();
  let openEntryId = null;
  let S = null;            // the campaign (host: full truth; player: their view)
  let role = null;         // 'host' | 'client'
  let joinCode = null;
  const net = { peer: null, conns: new Map(), conn: null, online: new Set(), retry: null, closing: false };
  const isGM = () => role === 'host';
  const activeMap = () => S && S.activeMapId ? S.maps[S.activeMapId] : null;
  const playerName = id => (S && S.players[id] && S.players[id].name) || 'Someone';
  const playerColor = id => (S && S.players[id] && S.players[id].color) || '#8aa0c2';
  const canEditSheet = s => isGM() || (s && s.ownerId === me.id);
  const canMoveToken = t => isGM() || (t && t.ownerId === me.id);

  function setNet(kind, text) { $('#netDot').className = 'dot ' + kind; $('#netText').textContent = text; }

  // ================= HOSTING (DM) =================
  async function hostGame(game) {
    S = N.upgrade(game); role = 'host'; joinCode = S.id; clockSkew = 0;
    if (S.gmId !== me.id) { // opened on a different computer (e.g. from a backup): this browser becomes the DM
      const old = S.players[S.gmId]; if (old) old.isGM = false; S.gmId = me.id;
    }
    S.players[me.id] = Object.assign(S.players[me.id] || {}, { id: me.id, name: me.name || 'DM', color: me.color, isGM: true });
    S.lastPlayed = Date.now(); saveNow();
    history.replaceState(null, '', '#host=' + S.id);
    showTable();
    startHostPeer();
  }
  async function startHostPeer() {
    clearTimeout(net.retry);
    setNet('warn', 'Starting…');
    const ok = await window.peerReady;
    if (role !== 'host') return;
    if (!ok) { setNet('off', 'Offline (no internet), solo only'); return; }
    const peer = new window.Peer(PEER_PREFIX + S.id, { debug: 0 });
    net.peer = peer;
    peer.on('open', () => { updateHostStatus(); });
    peer.on('connection', conn => hostAccept(conn));
    peer.on('disconnected', () => { if (net.closing || net.peer !== peer) return; setNet('warn', 'Reconnecting…'); setTimeout(() => { try { if (!peer.destroyed) peer.reconnect(); } catch (e) { } }, 2000); });
    peer.on('error', e => {
      if (net.peer !== peer || net.closing) return;
      if (e.type === 'unavailable-id') { setNet('warn', 'Game busy, retrying. Is it open in another tab?'); peer.destroy(); net.retry = setTimeout(startHostPeer, 5000); }
      else if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(e.type)) { setNet('warn', 'Connection problem, retrying…'); peer.destroy(); net.retry = setTimeout(startHostPeer, 5000); }
    });
  }
  function updateHostStatus() {
    const n = new Set([...net.conns.values()].map(c => c.pid).filter(Boolean)).size;
    setNet('on', 'Hosting · ' + n + ' player' + (n === 1 ? '' : 's') + ' connected');
  }
  function hostAccept(conn) {
    conn.on('data', d => hostRecv(conn, d));
    const gone = () => { net.conns.delete(conn.peer); broadcastPresence(); updateHostStatus(); };
    conn.on('close', gone); conn.on('error', gone);
  }
  function hostRecv(conn, d) {
    if (!d || typeof d !== 'object') return;
    if (d.t === 'hello') {
      const pid = String(d.id || '').slice(0, 40);
      if (!pid) return;
      if (pid === S.gmId) { conn.send({ t: 'err', fatal: true, msg: "You're the DM of this game. Open it from the home screen under 'Your games' instead." }); setTimeout(() => conn.close(), 500); return; }
      conn.pid = pid; net.conns.set(conn.peer, conn);
      hostCommit(N.handleRequest(S, { type: 'player.upsert', name: d.name, color: d.color }, { id: pid }));
      conn.send({ t: 'welcome', you: pid, state: N.viewFor(S, pid), hostNow: Date.now() });
      broadcastPresence(); updateHostStatus();
      return;
    }
    if (d.t === 'audio.get' && conn.pid) { // a player needs an uploaded music/sound file
      DB.get(String(d.id), 'audio').then(rec => conn.send({ t: 'audio.data', id: d.id, data: rec ? rec.data : null })).catch(() => conn.send({ t: 'audio.data', id: d.id, data: null }));
      return;
    }
    if (d.t === 'req' && conn.pid) {
      const res = N.handleRequest(S, d.req || {}, { id: conn.pid, isGM: false });
      if (res.error) conn.send({ t: 'err', msg: res.error });
      hostCommit(res);
    }
  }
  function hostCommit(res) {
    if (!res || (!res.ops.length && !res.transient.length)) return;
    // journal: each player only gets what they're allowed to see (and loses what was hidden again)
    const jOps = res.ops.filter(o => o.type.startsWith('journal.'));
    const before = new Map();
    if (jOps.length) for (const conn of net.conns.values()) if (conn.pid && !before.has(conn.pid)) before.set(conn.pid, N.journalView(S, conn.pid));
    const changed = new Set(jOps.map(o => o.folder ? 'f:' + o.folder.id : o.entry ? 'e:' + o.entry.id : ''));
    for (const op of res.ops) N.apply(S, op);
    for (const conn of net.conns.values()) {
      if (!conn.open || !conn.pid) continue;
      const ops = N.opsFor(res.ops, conn.pid).concat(jOps.length ? N.journalDiff(S, before.get(conn.pid), conn.pid, changed) : []);
      try { if (ops.length) conn.send({ t: 'ops', ops }); if (res.transient.length) conn.send({ t: 'fx', fx: res.transient }); } catch (e) { }
    }
    onOps(res.ops); onFx(res.transient);
    if (res.ops.length) saveSoon();
  }
  function broadcastPresence() {
    net.online = new Set([S.gmId, ...[...net.conns.values()].map(c => c.pid).filter(Boolean)]);
    for (const c of net.conns.values()) if (c.open) try { c.send({ t: 'presence', online: [...net.online] }); } catch (e) { }
    renderPeople();
  }
  let saveTimer = null;
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 700); }
  function saveNow() { if (role !== 'host' || !S) return Promise.resolve(); clearTimeout(saveTimer); S.updatedAt = Date.now(); return DB.put(N.clone(S)).catch(e => toast('Could not save the game: ' + e.message, true)); }

  // ================= JOINING (players) =================
  async function joinGame(code) {
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    if (!code) return toast('Paste the invite link or game code first', true);
    role = 'client'; joinCode = code; S = null;
    history.replaceState(null, '', '#join=' + code);
    showTable();
    setNet('warn', 'Connecting…');
    const ok = await window.peerReady;
    if (role !== 'client') return;
    if (!ok) { setNet('off', 'No internet connection service'); hint('Could not load the connection service. Check your internet connection and reload.'); return; }
    const peer = new window.Peer({ debug: 0 });
    net.peer = peer;
    peer.on('open', () => clientConnect());
    peer.on('error', e => {
      if (net.peer !== peer || net.closing) return;
      if (e.type === 'peer-unavailable') { setNet('off', "DM isn't online, waiting…"); if (!S) hint("The DM's game isn't running right now.\nAsk your DM to open the game. This page will connect by itself when they do."); scheduleRejoin(); }
      else if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(e.type)) { setNet('warn', 'Connection problem, retrying…'); scheduleRejoin(true); }
    });
    peer.on('disconnected', () => { if (net.closing || net.peer !== peer) return; try { peer.reconnect(); } catch (e) { } });
  }
  function scheduleRejoin(fullRestart) {
    clearTimeout(net.retry);
    net.retry = setTimeout(() => {
      if (role !== 'client' || net.closing) return;
      if (fullRestart || !net.peer || net.peer.destroyed) { try { net.peer && net.peer.destroy(); } catch (e) { } joinGame(joinCode); }
      else clientConnect();
    }, 4000);
  }
  function clientConnect() {
    if (!net.peer || net.peer.destroyed) return;
    try { net.conn && net.conn.close(); } catch (e) { }
    const conn = net.peer.connect(PEER_PREFIX + joinCode, { reliable: true });
    net.conn = conn;
    const t = setTimeout(() => { if (!conn.open && net.conn === conn) { setNet('off', "DM isn't online, waiting…"); scheduleRejoin(); } }, 9000);
    conn.on('open', () => { clearTimeout(t); conn.send({ t: 'hello', id: me.id, name: me.name, color: me.color }); });
    conn.on('data', clientRecv);
    conn.on('close', () => { if (net.conn !== conn || net.closing) return; setNet('warn', 'Lost the DM, reconnecting…'); scheduleRejoin(); });
  }
  function clientRecv(d) {
    if (!d || typeof d !== 'object') return;
    if (d.t === 'welcome') {
      S = N.upgrade(d.state); me.id = d.you; setNet('on', 'Connected'); clockSkew = (d.hostNow || Date.now()) - Date.now();
      const joins = LS.get('nct-joins', []).filter(j => j.code !== joinCode); joins.unshift({ code: joinCode, name: S.name, at: Date.now() }); LS.set('nct-joins', joins.slice(0, 12));
      fitView(true); renderAll(true); checkPendingImport(); applyTheme(); applyMusic();
    } else if (d.t === 'ops' && S) { for (const op of d.ops) N.apply(S, op); onOps(d.ops); }
    else if (d.t === 'audio.data') { const w = audioWaiters.get(d.id); if (w) { audioWaiters.delete(d.id); w(d.data); } }
    else if (d.t === 'fx') onFx(d.fx);
    else if (d.t === 'presence') { net.online = new Set(d.online || []); renderPeople(); }
    else if (d.t === 'err') { toast(d.msg || 'Not allowed', true); if (d.fatal) leave(); }
  }

  // one function for every action, host or player
  function request(req) {
    if (!S) return;
    if (role === 'host') { const res = N.handleRequest(S, req, { id: me.id, isGM: true }); if (res.error) toast(res.error, true); hostCommit(res); }
    else if (net.conn && net.conn.open) net.conn.send({ t: 'req', req });
    else toast('Not connected to the DM right now', true);
  }

  function leave() {
    if (role === 'host') saveNow();
    net.closing = true; clearTimeout(net.retry);
    try { net.conn && net.conn.close(); } catch (e) { }
    for (const c of net.conns.values()) try { c.close(); } catch (e) { }
    try { net.peer && net.peer.destroy(); } catch (e) { }
    net.peer = null; net.conn = null; net.conns.clear(); net.online.clear();
    setTimeout(() => { net.closing = false; }, 50);
    S = null; role = null; joinCode = null; closeModal(); stopAllAudio(); applyTheme();
    history.replaceState(null, '', location.pathname + location.search);
    showHome();
  }
  window.addEventListener('beforeunload', e => { if (role === 'host') { saveNow(); if (net.conns.size) { e.preventDefault(); e.returnValue = ''; } } });

  // ================= HOME =================
  function showHome() {
    $('#home').classList.remove('hidden'); $('#table').classList.add('hidden'); $('#importscreen').classList.add('hidden');
    $('#myName').value = me.name; $('#myColor').value = me.color;
    $('#fileNotice').classList.toggle('hidden', ONLINE || DESKTOP);
    renderMyGames(); renderRecentJoins();
  }
  function saveIdentity() {
    me.name = $('#myName').value.trim().slice(0, 40); me.color = $('#myColor').value;
    LS.set('nct-name', me.name); LS.set('nct-color', me.color);
  }
  function needName() { saveIdentity(); if (!me.name) { toast('Type your name first', true); $('#myName').focus(); return true; } return false; }
  async function renderMyGames() {
    const box = $('#myGames'); box.textContent = '';
    let games = []; try { games = await DB.all(); } catch (e) { box.appendChild(el('div', { class: 'dim', text: 'This browser blocks saving (private mode?). Games will not be kept.' })); return; }
    games.sort((a, b) => (b.lastPlayed || b.updatedAt || 0) - (a.lastPlayed || a.updatedAt || 0));
    if (!games.length) box.appendChild(el('div', { class: 'dim', text: 'No games yet.' }));
    for (const g of games) {
      box.appendChild(el('div', { class: 'gameitem' },
        el('div', { class: 'grow' }, el('div', { class: 'name', text: g.name }), el('div', { class: 'meta', text: 'Code ' + g.id + ' · ' + Object.keys(g.players || {}).length + ' people · ' + ago(g.lastPlayed || g.updatedAt || g.createdAt) })),
        el('button', { class: 'small primary', text: 'Open', onclick: () => { if (!needName()) hostGame(g); } }),
        el('button', { class: 'small ghost', title: 'Download backup', text: '⤓', onclick: () => downloadJSON(g, 'night-city-table-' + g.name.replace(/[^\w-]+/g, '_') + '.json') }),
        el('button', { class: 'small ghost danger', title: 'Delete', text: '✕', onclick: () => askConfirm('Delete "' + g.name + '" forever?', 'Download a backup first if you\'re not sure. This can\'t be undone.', 'Delete', async () => { await DB.del(g.id); renderMyGames(); }) })
      ));
    }
  }
  function renderRecentJoins() {
    const box = $('#recentJoins'); box.textContent = '';
    const joins = LS.get('nct-joins', []);
    for (const j of joins.slice(0, 6)) box.appendChild(el('div', { class: 'gameitem' },
      el('div', { class: 'grow' }, el('div', { class: 'name', text: j.name || j.code }), el('div', { class: 'meta', text: 'Code ' + j.code + ' · ' + ago(j.at) })),
      el('button', { class: 'small pink', text: 'Rejoin', onclick: () => { if (!needName()) joinGame(j.code); } }),
      el('button', { class: 'small ghost', text: '✕', title: 'Forget', onclick: () => { LS.set('nct-joins', LS.get('nct-joins', []).filter(x => x.code !== j.code)); renderRecentJoins(); } })));
  }
  function parseJoin(v) { v = String(v || '').trim(); const m = v.match(/join=([A-Za-z0-9]+)/); return m ? m[1] : v; }
  function downloadJSON(obj, name) { const b = new Blob([JSON.stringify(obj)], { type: 'application/json' }); const a = el('a', { href: URL.createObjectURL(b), download: name }); document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }

  $('#myName').addEventListener('change', saveIdentity); $('#myColor').addEventListener('change', saveIdentity);
  $('#createBtn').onclick = async () => {
    if (needName()) return;
    const g = N.newCampaign($('#newName').value.trim() || 'Night City', me.id, me.name);
    g.players[me.id].color = me.color;
    try { for (let i = 0; i < 5 && await DB.get(g.id); i++) g.id = N.code(6); } catch (e) { }
    hostGame(g);
  };
  $('#joinBtn').onclick = () => { if (!needName()) joinGame(parseJoin($('#joinCode').value)); };
  $('#joinCode').addEventListener('keydown', e => { if (e.key === 'Enter') $('#joinBtn').click(); });
  $('#importGameBtn').onclick = () => $('#importGameFile').click();
  $('#importGameFile').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { const g = JSON.parse(await f.text()); if (!g || !g.id || !g.maps || !g.players) throw new Error('Not a Night City Table backup'); await DB.put(g); toast('Loaded "' + g.name + '"'); renderMyGames(); }
    catch (err) { toast('Could not load that file: ' + err.message, true); }
  };
  $('#howHost').onclick = e => { e.preventDefault(); $('#helpBox').open = true; $('#hostSteps').scrollIntoView({ behavior: 'smooth' }); };

  // ================= TABLE =================
  function showTable() {
    $('#home').classList.add('hidden'); $('#importscreen').classList.add('hidden'); $('#table').classList.remove('hidden');
    $('#chatlog').textContent = ''; renderedMsgs.clear();
    selectTab('chat');
    resizeCanvas(); fitView(true); renderAll(true);
    if (role === 'host') checkPendingImport();
  }
  function hint(text) { const h = $('#maphint'); h.textContent = text || ''; h.style.whiteSpace = 'pre-line'; }

  let rafPending = false, fullPending = false;
  function renderAll(full) { if (full) fullPending = true; if (rafPending) return; rafPending = true; requestAnimationFrame(() => { rafPending = false; const f = fullPending; fullPending = false; doRender(f); }); }
  function doRender(full) {
    if (!S) { $('#campTitle').textContent = 'Connecting to game ' + (joinCode || ''); draw(); return; }
    $('#campTitle').textContent = S.name;
    $('#inviteBtn').classList.toggle('hidden', !isGM());
    $('#backupBtn').classList.toggle('hidden', !isGM());
    $$('.gmonly').forEach(b => b.classList.toggle('hidden', !isGM()));
    renderPeople();
    renderChat(full);
    renderMacroBar();
    renderAmmoBar();
    renderTokenHud();
    renderPane();
    draw();
  }
  function onOps(ops) {
    let mapChanged = false;
    for (const op of ops) {
      if (op.type === 'map.activate' || op.type === 'map.add' || op.type === 'map.delete') mapChanged = true;
      if (op.type === 'sheet.upsert' && openSheet && openSheet.id === op.sheet.id) refreshOpenSheet(op.sheet);
      if (op.type === 'sheet.delete' && openSheet && openSheet.id === op.id) closeModal();
      if (op.type === 'music.set') applyMusic();
      if (op.type === 'meta' && op.theme !== undefined) applyTheme();
      if (op.type === 'journal.entry.upsert' && openEntryId === op.entry.id) refreshOpenEntry();
    }
    if (mapChanged) fitView(false);
    renderAll(false);
  }
  function renderPeople() {
    const box = $('#people'); box.textContent = ''; if (!S) return;
    const ids = Object.keys(S.players).sort((a, b) => (b === S.gmId) - (a === S.gmId));
    for (const id of ids) {
      const p = S.players[id]; const on = net.online.has(id) || (role === 'host' && id === me.id) || id === me.id;
      if (!on && id !== S.gmId) continue;
      box.appendChild(el('span', { class: 'chip', style: 'border-color:' + p.color }, el('span', { class: 'dot ' + (on ? 'on' : 'off') }), (id === S.gmId ? '★ ' : '') + p.name + (id === me.id ? ' (you)' : '')));
    }
  }
  $('#leaveBtn').onclick = () => { if (role === 'host' && net.conns.size) askConfirm('Leave the game?', 'Your players will be disconnected until you open the game again. Your game is saved.', 'Leave', leave); else leave(); };
  $('#backupBtn').onclick = () => { saveNow(); downloadJSON(S, 'night-city-table-' + S.name.replace(/[^\w-]+/g, '_') + '.json'); };
  $('#inviteBtn').onclick = () => {
    const link = APP_URL ? APP_URL + '#join=' + S.id : '';
    const m = modal('Invite players');
    if (DESKTOP) {
      const dl = window.nctDesktop.downloadUrl;
      const msg = 'Join my Cyberpunk game on Night City Table!\nGame code: ' + S.id + (dl ? '\nGet the app (free): ' + dl : '') + '\nOpen the app, type your name, paste the code under "Join a game" and press Join.';
      m.append(el('p', { text: 'Players need the Night City Table app too. Copy this message and send it to them (Discord, text, anything):' }),
        el('textarea', { readonly: true, style: 'width:100%;height:110px', value: msg }),
        el('div', { class: 'row', style: 'margin:6px 0 12px' }, el('div', { class: 'grow' }), el('button', { class: 'primary', text: 'Copy message', onclick: () => copyText(msg) })),
        el('div', { style: 'text-align:center;font-family:var(--display);font-size:42px;letter-spacing:.2em;color:var(--cyan);text-shadow:0 0 14px var(--cyan)', text: S.id }));
    } else if (link) {
      const inp = el('input', { value: link, readonly: true, class: 'grow mono', onclick: e => e.target.select() });
      m.append(el('p', { text: 'Send this link to your players (Discord, text, anything). They open it, type a name, and join.' }),
        el('div', { class: 'row' }, inp, el('button', { class: 'primary', text: 'Copy', onclick: () => copyText(link) })));
    } else {
      m.append(el('p', { class: 'notice', text: "This copy is running from a file on your computer, so there's no link to share yet. Put it online first (see 'How does this work?' on the home screen). Until then players can't join over the internet." }));
    }
    m.append(el('p', { class: 'dim' }, 'Game code: ', el('b', { class: 'mono', text: S.id }), '. Players can also type this code on the home screen. Keep this tab open while you play. If you close it, players wait until you open the game again.'));
  };
  function copyText(t) {
    if (DESKTOP) { window.nctDesktop.writeClipboard(t); toast('Copied!'); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Copied!'), () => { const m = modal('Copy this'); const ta = el('textarea', { style: 'width:100%;height:90px', value: t, readonly: true }); m.append(ta); ta.select(); });
  }
  function askConfirm(title, detail, yesLabel, onYes) {
    const m = modal(title);
    m.append(el('p', { class: 'dim', text: detail || '' }), el('div', { class: 'row' }, el('div', { class: 'grow' }),
      el('button', { class: 'ghost', text: 'Cancel', onclick: closeModal }),
      el('button', { class: 'pink', text: yesLabel || 'OK', onclick: () => { closeModal(); onYes(); } })));
  }
  function askText(title, value, cb) {
    const m = modal(title); const inp = el('input', { class: 'grow', value: value || '' });
    const ok = () => { const v = inp.value; closeModal(); cb(v); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
    m.append(el('div', { class: 'row' }, inp, el('button', { class: 'primary', text: 'OK', onclick: ok }))); setTimeout(() => { inp.focus(); inp.select(); }, 0);
  }

  // tabs
  let curTab = 'chat';
  function selectTab(t) { curTab = t; $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); $$('.pane').forEach(p => p.classList.toggle('hidden', p.id !== 'pane-' + t)); renderPane(); }
  $$('#tabs button').forEach(b => b.onclick = () => selectTab(b.dataset.tab));
  function renderPane() { if (!S) return; const pn = $('#pane-' + curTab); if (pn && pn.contains(document.activeElement) && document.activeElement.matches('input,textarea,select')) return; if (curTab === 'sheets') renderSheets(); else if (curTab === 'init') renderInit(); else if (curTab === 'maps') renderMaps(); else if (curTab === 'journal') renderJournal(); else if (curTab === 'audio') renderAudio(); else if (curTab === 'books') renderBooks(); }

  // ================= CHAT =================
  const renderedMsgs = new Set();
  function renderChat(full) {
    const log = $('#chatlog');
    if (full) { log.textContent = ''; renderedMsgs.clear(); }
    const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
    for (const m of S.chat) { if (renderedMsgs.has(m.id)) continue; renderedMsgs.add(m.id); log.appendChild(msgEl(m)); }
    while (log.children.length > 400) log.firstChild.remove();
    if (nearBottom || full) log.scrollTop = log.scrollHeight;
  }
  function msgEl(m) {
    if (m.combat) return combatMsgEl(m);
    const d = el('div', { class: 'msg' + (m.private ? ' priv' : ''), style: '--c:' + playerColor(m.from) },
      el('span', { class: 'when', text: timeStr(m.ts) }), el('div', { class: 'who', text: m.name || playerName(m.from) }));
    if (m.roll) {
      const r = m.roll; const badges = [];
      if (m.private) badges.push(el('span', { class: 'badge b-priv', text: 'SECRET' }));
      if (r.crit) badges.push(el('span', { class: 'badge b-crit', text: 'CRITICAL!' }));
      if (r.fumble) badges.push(el('span', { class: 'badge b-fum', text: 'FUMBLE' }));
      if (m.target !== null && m.target !== undefined) badges.push(el('span', { class: 'badge ' + (r.total <= m.target ? 'b-ok' : 'b-fail'), text: r.total <= m.target ? 'SUCCESS' : 'FAILED' }));
      if (m.kind === 'hit') badges.unshift(el('span', { class: 'badge b-vis', style: 'color:var(--p)', text: 'TO-HIT' }));
      if (m.kind === 'dmg') badges.unshift(el('span', { class: 'badge b-vis', style: 'color:var(--red)', text: 'DAMAGE' }));
      if (m.label) d.appendChild(el('div', { class: 'lbl', text: m.label }));
      d.appendChild(el('div', { class: 'total' }, String(r.total), ...badges));
      d.appendChild(el('div', { class: 'brk', text: N.rollToText(r) }));
      if (m.kind === 'dmg') d.appendChild(el('button', { class: 'small pink', style: 'margin-top:5px', text: '💥 Apply damage…', title: 'Subtract armor and body type, then add it to a wound track', onclick: () => applyDamageDialog(m) }));
    } else d.appendChild(el('div', { text: m.text }));
    return d;
  }
  function sendChat() {
    const inp = $('#chatInput'); let t = inp.value.trim(); if (!t) return;
    if ($('#privRoll').checked) t = t.replace(/^\/(r|roll)\s/i, '/gr ');
    request({ type: 'chat', text: t }); inp.value = '';
  }
  $('#sendBtn').onclick = sendChat;
  $('#chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });
  $$('#quickdice button[data-roll]').forEach(b => b.onclick = () => request({ type: 'roll', formula: b.dataset.roll, private: $('#privRoll').checked }));
  function rollReq(formula, label, extra) { request(Object.assign({ type: 'roll', formula, label, private: $('#privRoll').checked }, extra || {})); if (curTab !== 'chat' && window.innerWidth > 900) flashChat(); }
  function flashChat() { const b = $('#tabs button[data-tab=chat]'); b.style.color = 'var(--yellow)'; setTimeout(() => { b.style.color = ''; }, 900); }

  // ================= MAP CANVAS =================
  const cv = $('#canvas'), ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1;
  const views = {};
  let tool = 'move', drag = null, pan = null, ruler = null, selected = null, pings = [];
  const imgCache = new Map();
  function getImg(src) {
    if (!src) return null; let im = imgCache.get(src);
    if (!im) { im = new Image(); im.onload = () => draw(); im.src = src; imgCache.set(src, im); if (imgCache.size > 80) imgCache.delete(imgCache.keys().next().value); }
    return im.complete && im.naturalWidth ? im : null;
  }
  function resizeCanvas() { const r = $('#stage').getBoundingClientRect(); DPR = window.devicePixelRatio || 1; W = r.width; H = r.height; cv.width = Math.max(1, W * DPR); cv.height = Math.max(1, H * DPR); draw(); }
  window.addEventListener('resize', () => { if (!$('#table').classList.contains('hidden')) resizeCanvas(); });
  function view() { const m = activeMap(); if (!m) return { x: 0, y: 0, z: 1 }; if (!views[m.id]) views[m.id] = fitFor(m); return views[m.id]; }
  function fitFor(m) { const z = Math.min((W || 800) / m.w, (H || 600) / m.h) * 0.95 || 1; return { z, x: ((W || 800) - m.w * z) / 2, y: ((H || 600) - m.h * z) / 2 }; }
  function fitView(force) { const m = activeMap(); if (!m) return; if (force || !views[m.id]) views[m.id] = fitFor(m); draw(); }
  const toWorld = (sx, sy) => { const v = view(); return { x: (sx - v.x) / v.z, y: (sy - v.y) / v.z }; };
  function tokenPx(t, m) { return t.size * m.grid.size; }
  function visibleTokens(m) { return Object.values(m.tokens).filter(t => !t.hidden || isGM()); }
  function hitToken(wx, wy) {
    const m = activeMap(); if (!m) return null; const list = visibleTokens(m);
    for (let i = list.length - 1; i >= 0; i--) { const t = list[i]; const p = tokenPx(t, m); const cx = t.x + p / 2, cy = t.y + p / 2; if ((wx - cx) ** 2 + (wy - cy) ** 2 <= (p / 2) ** 2) return t; }
    return null;
  }
  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
    const m = S && activeMap();
    if (!S) { hint(role === 'client' ? 'Connecting to the DM…' : ''); return; }
    if (!m) { hint(isGM() ? 'No map yet.\nOpen the MAPS tab on the right to upload a map image or make a blank grid.' : 'Waiting for the DM to put up a map…'); return; }
    hint('');
    const v = view();
    ctx.setTransform(DPR * v.z, 0, 0, DPR * v.z, DPR * v.x, DPR * v.y);
    ctx.fillStyle = m.bg || '#0b0f1a'; ctx.fillRect(0, 0, m.w, m.h);
    const im = getImg(m.img); if (im) ctx.drawImage(im, 0, 0, m.w, m.h);
    const g = m.grid;
    if (g.show && g.size >= 4) {
      ctx.save(); ctx.globalAlpha = g.alpha; ctx.strokeStyle = g.color || TH.p; ctx.lineWidth = 1 / v.z; ctx.beginPath();
      const ox = ((g.ox % g.size) + g.size) % g.size, oy = ((g.oy % g.size) + g.size) % g.size;
      for (let x = ox; x <= m.w; x += g.size) { ctx.moveTo(x, 0); ctx.lineTo(x, m.h); }
      for (let y = oy; y <= m.h; y += g.size) { ctx.moveTo(0, y); ctx.lineTo(m.w, y); }
      ctx.stroke(); ctx.restore();
    }
    ctx.strokeStyle = TH.p; ctx.globalAlpha = 0.5; ctx.lineWidth = 2 / v.z; ctx.strokeRect(0, 0, m.w, m.h); ctx.globalAlpha = 1;
    if (drag && m.tokens[drag.id]) drawMoveRuler(m.tokens[drag.id], m, v, 'under');
    for (const t of visibleTokens(m)) drawToken(t, m, v);
    if (drag && m.tokens[drag.id]) drawMoveRuler(m.tokens[drag.id], m, v, 'over');
    drawTargeting(m, v);
    if (ruler) {
      ctx.save(); ctx.strokeStyle = TH.t; ctx.lineWidth = 3 / v.z; ctx.setLineDash([10 / v.z, 6 / v.z]);
      ctx.beginPath(); ctx.moveTo(ruler.x1, ruler.y1); ctx.lineTo(ruler.x2, ruler.y2); ctx.stroke(); ctx.setLineDash([]);
      const sq = Math.hypot(ruler.x2 - ruler.x1, ruler.y2 - ruler.y1) / g.size;
      const label = sq.toFixed(1) + ' sq ≈ ' + Math.round(sq * 2) + ' m';
      ctx.font = 'bold ' + (16 / v.z) + 'px "Share Tech Mono", monospace'; const tw = ctx.measureText(label).width;
      ctx.fillStyle = '#000c'; ctx.fillRect(ruler.x2 + 10 / v.z, ruler.y2 - 22 / v.z, tw + 12 / v.z, 24 / v.z);
      ctx.fillStyle = TH.t; ctx.fillText(label, ruler.x2 + 16 / v.z, ruler.y2 - 5 / v.z); ctx.restore();
    }
    const now = performance.now(); pings = pings.filter(p => now - p.t0 < 1600 && p.mapId === m.id);
    for (const p of pings) {
      const k = (now - p.t0) / 1600; ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = p.color; ctx.lineWidth = 4 / v.z;
      ctx.beginPath(); ctx.arc(p.x, p.y, (10 + k * 60) / v.z * Math.max(1, v.z), 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x, p.y, (4 + k * 30) / v.z * Math.max(1, v.z), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    if (pings.length) requestAnimationFrame(draw);
  }
  // while dragging a token: line from where it started, distance in squares and metres, and its run range
  // how far this token may still move: its run distance, minus what it already moved this round in combat
  function moveBudget(t) {
    if (!S || !t || !t.sheetId || !S.sheets[t.sheetId]) return null;
    const run = N.tokenRun(S, t); if (run === null) return null;
    if (!N.combatOn(S)) return { run, left: run, combat: false, limit: false };
    const used = N.movedThisRound(S, t);
    return { run, used, left: Math.max(0, Math.round((run - used) * 10) / 10), combat: true, limit: N.upgrade(S).init.rules.limit };
  }
  function drawMoveRuler(t, m, v, layer) {
    const g = m.grid.size, p = tokenPx(t, m);
    let nx = drag.x, ny = drag.y; if (g >= 4) { nx = snap(nx, g, m.grid.ox); ny = snap(ny, g, m.grid.oy); }
    const x1 = t.x + p / 2, y1 = t.y + p / 2, x2 = nx + p / 2, y2 = ny + p / 2;
    const sq = Math.hypot(x2 - x1, y2 - y1) / g, metres = Math.round(sq * 2);
    const b = moveBudget(t); const run = b ? b.left : null;
    const over = run !== null && metres > run + 0.05;
    ctx.save();
    if (layer === 'under') {
      if (run) { ctx.setLineDash([8 / v.z, 6 / v.z]); ctx.strokeStyle = b && b.combat && over ? '#ff3344' : TH.s; ctx.globalAlpha = 0.6; ctx.lineWidth = 2 / v.z; ctx.beginPath(); ctx.arc(x1, y1, run / 2 * g, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 0.08; ctx.fillStyle = TH.s; ctx.fill(); ctx.globalAlpha = 1; }
      ctx.globalAlpha = 0.35; ctx.strokeStyle = TH.p; ctx.lineWidth = 2 / v.z; ctx.setLineDash([4 / v.z, 4 / v.z]); ctx.strokeRect(nx, ny, p, p); // where it will land
      ctx.restore(); return;
    }
    if (sq < 0.05) { ctx.restore(); return; }
    const col = over ? '#ff3344' : TH.t;
    ctx.strokeStyle = col; ctx.lineWidth = 3 / v.z; ctx.setLineDash([10 / v.z, 6 / v.z]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x1, y1, 4 / v.z, 0, Math.PI * 2); ctx.fill();
    const label = sq.toFixed(1) + ' sq · ' + metres + ' m' + (b ? (b.combat ? (over ? '  TOO FAR · ' + b.left + ' m left this round' : '  · ' + Math.round((b.left - metres) * 10) / 10 + ' m left after') : (over ? '  OVER RUN (' + b.run + ' m)' : '  / run ' + b.run + ' m')) : '');
    ctx.font = 'bold ' + (15 / v.z) + 'px "Share Tech Mono", monospace'; const tw = ctx.measureText(label).width;
    let lx = x2 + p / 2 + 8 / v.z, ly = y2 - 10 / v.z;
    if ((lx + tw + 8 / v.z) * v.z + v.x > W) lx = x2 - p / 2 - 12 / v.z - tw; // keep it on screen
    if ((ly - 15 / v.z) * v.z + v.y < 0) ly = y2 + p / 2 + 22 / v.z;
    ctx.fillStyle = '#000d'; ctx.fillRect(lx - 4 / v.z, ly - 15 / v.z, tw + 8 / v.z, 21 / v.z);
    ctx.strokeStyle = col; ctx.lineWidth = 1 / v.z; ctx.strokeRect(lx - 4 / v.z, ly - 15 / v.z, tw + 8 / v.z, 21 / v.z);
    ctx.fillStyle = col; ctx.fillText(label, lx, ly);
    ctx.restore();
  }
  function drawToken(t, m, v) {
    const p = tokenPx(t, m); let x = t.x, y = t.y;
    if (drag && drag.id === t.id) { x = drag.x; y = drag.y; }
    const cx = x + p / 2, cy = y + p / 2, r = p / 2 - 2 / v.z;
    const sh = t.sheetId && S.sheets[t.sheetId];
    const img = getImg(t.img || (sh && sh.portrait));
    ctx.save(); if (t.hidden) ctx.globalAlpha = 0.45;
    ctx.shadowColor = t.color; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = '#0b0f1a'; ctx.fill(); ctx.shadowBlur = 0;
    if (img) { ctx.save(); ctx.clip(); const s = Math.max(p / img.naturalWidth, p / img.naturalHeight); const iw = img.naturalWidth * s, ih = img.naturalHeight * s; ctx.drawImage(img, cx - iw / 2, cy - ih / 2, iw, ih); ctx.restore(); }
    else {
      ctx.fillStyle = t.color + '55'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 ' + (p * 0.38) + 'px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText((t.name || (sh && sh.name) || '?').replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '?', cx, cy + 1);
    }
    ctx.lineWidth = Math.max(2 / v.z, p * 0.05); ctx.strokeStyle = t.color; if (t.hidden) ctx.setLineDash([6 / v.z, 4 / v.z]);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    if (selected === t.id) { ctx.strokeStyle = TH.t; ctx.lineWidth = 2 / v.z; ctx.beginPath(); ctx.arc(cx, cy, r + 5 / v.z, 0, Math.PI * 2); ctx.stroke(); }
    if (sh && sh.damage > 0) {
      const bw = p * 0.9, bh = Math.max(4 / v.z, p * 0.08), k = Math.min(1, sh.damage / 40);
      ctx.fillStyle = '#000a'; ctx.fillRect(cx - bw / 2, y + p + 1 / v.z, bw, bh);
      ctx.fillStyle = sh.damage >= 13 ? '#ff4d4d' : sh.damage >= 5 ? '#ff9f1c' : '#f5e663'; ctx.fillRect(cx - bw / 2, y + p + 1 / v.z, bw * k, bh);
    }
    const label = t.name || (sh && sh.name) || '';
    if (label) {
      const fs = Math.max(11 / v.z, Math.min(p * 0.24, 22 / v.z)); ctx.font = '700 ' + fs + 'px "Share Tech Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const tw = ctx.measureText(label).width; const ly = y + p + (sh && sh.damage > 0 ? p * 0.1 + 3 / v.z : 3 / v.z);
      ctx.fillStyle = '#000b'; ctx.fillRect(cx - tw / 2 - 4 / v.z, ly, tw + 8 / v.z, fs * 1.15);
      ctx.fillStyle = TH.p; ctx.fillText(label, cx, ly + fs * 0.05);
    }
    ctx.restore();
  }
  function onFx(list) {
    for (const f of list || []) if (f.type === 'sound') playSound(f.track, f.volume); else if (f.type === 'ping') { pings.push({ x: f.x, y: f.y, mapId: f.mapId, t0: performance.now(), color: playerColor(f.by) }); draw(); }
  }
  function snap(v, size, off) { return Math.round((v - off) / size) * size + off; }

  // pointer handling
  let ctxDown = null;
  cv.addEventListener('pointerdown', e => {
    closeCtx(); if (!S) return; const m = activeMap(); if (!m) return;
    cv.setPointerCapture(e.pointerId);
    const w = toWorld(e.offsetX, e.offsetY);
    if (e.button === 1 || e.button === 2) { pan = { sx: e.offsetX, sy: e.offsetY, moved: false, button: e.button }; if (e.button === 2) ctxDown = { x: e.clientX, y: e.clientY, w }; return; }
    if (e.altKey || tool === 'ping') { request({ type: 'ping', x: w.x, y: w.y, mapId: m.id }); return; }
    if (tool === 'ruler') { ruler = { x1: w.x, y1: w.y, x2: w.x, y2: w.y, active: true }; draw(); return; }
    if (tool === 'target') { const tt = hitToken(w.x, w.y); setTarget(tt && (!myTokenOnMap() || tt.id !== myTokenOnMap().id) ? tt : null); return; }
    const t = hitToken(w.x, w.y);
    if (t) {
      selected = t.id;
      if (canMoveToken(t)) {
        if (!isGM() && N.combatOn(S) && t.sheetId && N.upgrade(S).init.rules.turnOnly && !N.isTokensTurn(S, t)) toast("It's not your turn yet. You can move when initiative reaches you.", true);
        else drag = { id: t.id, dx: w.x - t.x, dy: w.y - t.y, x: t.x, y: t.y };
      }
      draw(); renderTokenHud(); return;
    }
    selected = null; pan = { sx: e.offsetX, sy: e.offsetY, moved: false, button: 0 }; draw(); renderTokenHud();
  });
  cv.addEventListener('pointermove', e => {
    if (pan) { const v = view(); const dx = e.offsetX - pan.sx, dy = e.offsetY - pan.sy; if (Math.abs(dx) + Math.abs(dy) > 3) pan.moved = true; v.x += dx; v.y += dy; pan.sx = e.offsetX; pan.sy = e.offsetY; draw(); return; }
    const w = toWorld(e.offsetX, e.offsetY);
    if (drag) { drag.x = w.x - drag.dx; drag.y = w.y - drag.dy; draw(); return; }
    if (ruler && ruler.active) { ruler.x2 = w.x; ruler.y2 = w.y; draw(); }
    const t = hitToken(w.x, w.y); cv.style.cursor = tool === 'ruler' || tool === 'target' ? 'crosshair' : tool === 'ping' ? 'cell' : t && canMoveToken(t) ? 'grab' : 'default';
  });
  cv.addEventListener('pointerup', e => {
    const m = activeMap();
    if (pan) { const wasRight = pan.button === 2 && !pan.moved; pan = null; if (wasRight && ctxDown) { const t = hitToken(ctxDown.w.x, ctxDown.w.y); if (t) openCtx(t, ctxDown.x, ctxDown.y); } ctxDown = null; return; }
    if (drag && m) {
      const t = m.tokens[drag.id]; let x = drag.x, y = drag.y;
      if (m.grid.size >= 4) { x = snap(x, m.grid.size, m.grid.ox); y = snap(y, m.grid.size, m.grid.oy); }
      if (t && (x !== t.x || y !== t.y)) {
        const b = moveBudget(t);
        if (b && !isGM() && b.limit && N.moveMetres(m, t.x, t.y, x, y) > b.left + 0.05) toast("Not enough movement left this round (" + b.left + ' m). It resets next round.', true);
        else { if (isGM()) { t.x = x; t.y = y; } request({ type: 'token.update', mapId: m.id, id: drag.id, patch: { x, y } }); }
      }
      drag = null; draw(); return;
    }
    if (ruler && ruler.active) { ruler.active = false; const r = ruler; setTimeout(() => { if (ruler === r) { ruler = null; draw(); } }, 2500); }
  });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('wheel', e => {
    e.preventDefault(); if (!activeMap()) return; const v = view();
    const k = Math.exp(-e.deltaY * 0.0015); const nz = Math.max(0.05, Math.min(8, v.z * k));
    v.x = e.offsetX - (e.offsetX - v.x) * (nz / v.z); v.y = e.offsetY - (e.offsetY - v.y) * (nz / v.z); v.z = nz; draw();
  }, { passive: false });
  cv.addEventListener('dblclick', e => { const w = toWorld(e.offsetX, e.offsetY); const t = hitToken(w.x, w.y); if (t && t.sheetId && S.sheets[t.sheetId]) openSheetModal(t.sheetId); });
  function zoomBy(k) { const v = view(); const cx = W / 2, cy = H / 2; const nz = Math.max(0.05, Math.min(8, v.z * k)); v.x = cx - (cx - v.x) * (nz / v.z); v.y = cy - (cy - v.y) * (nz / v.z); v.z = nz; draw(); }
  $('#zoomIn').onclick = () => zoomBy(1.25); $('#zoomOut').onclick = () => zoomBy(0.8); $('#centerBtn').onclick = () => fitView(true);
  $$('#tools button[data-tool]').forEach(b => b.onclick = () => { tool = b.dataset.tool; $$('#tools button[data-tool]').forEach(x => x.classList.toggle('on', x === b)); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); closeModal(); closeCtx(); $$('.popover').forEach(p => p.remove()); return; }
    if (e.target.matches('input,textarea,select')) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && selected && activeMap()) { const t = activeMap().tokens[selected]; if (t && canMoveToken(t)) { request({ type: 'token.delete', mapId: activeMap().id, id: t.id }); selected = null; } }
  });

  // token context menu
  function closeCtx() { const c = $('#ctx'); if (c) c.remove(); }
  function openCtx(t, x, y) {
    closeCtx();
    const m = activeMap(); const upd = patch => request({ type: 'token.update', mapId: m.id, id: t.id, patch });
    const items = [];
    const mine = myTokenOnMap();
    if (!mine || mine.id !== t.id) { items.push([targetId === t.id ? '🎯 Clear target' : '🎯 Target', () => setTarget(targetId === t.id ? null : t)]); if (mine) items.push(['🎯 Attack this…', () => { setTarget(t); openAttack(); }]); }
    if (t.sheetId && S.sheets[t.sheetId]) items.push(['Open character sheet', () => openSheetModal(t.sheetId)]);
    if (canMoveToken(t)) {
      items.push(['Rename…', () => askText('Token name', t.name, n => upd({ name: n }))]);
      items.push(['Size… (now ' + t.size + ')', () => openTokenSize(t)]);
      items.push(['Bigger', () => upd({ size: Math.min(10, t.size + (t.size < 1 ? 0.25 : 1)) })]);
      items.push(['Smaller', () => upd({ size: Math.max(0.25, t.size - (t.size <= 1 ? 0.25 : 1)) })]);
      items.push(['Change picture…', () => pickImage(256, url => upd({ img: url }))]);
      items.push(['Change colour…', () => { const i = el('input', { type: 'color', value: t.color }); i.onchange = () => upd({ color: i.value }); i.click(); }]);
    }
    if (isGM()) {
      items.push([t.hidden ? 'Show to players' : 'Hide from players', () => upd({ hidden: !t.hidden })]);
      items.push(['Link to a character…', () => linkTokenDialog(t)]);
    }
    if (canMoveToken(t)) items.push(['Delete token', () => request({ type: 'token.delete', mapId: m.id, id: t.id })]);
    if (!items.length) return;
    const box = el('div', { id: 'ctx', style: 'left:' + Math.min(x, innerWidth - 190) + 'px;top:' + Math.min(y, innerHeight - items.length * 34 - 10) + 'px' });
    for (const [label, fn] of items) box.appendChild(el('button', { text: label, onclick: () => { closeCtx(); fn(); } }));
    document.body.appendChild(box);
  }
  document.addEventListener('pointerdown', e => { if (!e.target.closest('#ctx') && e.target !== cv) closeCtx(); });
  function linkTokenDialog(t) {
    const m = modal('Link token to a character');
    const sel = el('select', { class: 'grow' }, el('option', { value: '', text: '— none —' }), ...Object.values(S.sheets).map(s => el('option', { value: s.id, text: s.name + (s.ownerId ? ' (' + playerName(s.ownerId) + ')' : ' (NPC)'), selected: s.id === t.sheetId })));
    m.append(el('p', { class: 'dim', text: "A linked token shows the character's picture and damage, and the character's owner can move it." }), el('div', { class: 'row' }, sel,
      el('button', { class: 'primary', text: 'Save', onclick: () => { request({ type: 'token.update', mapId: activeMap().id, id: t.id, patch: { sheetId: sel.value || null } }); closeModal(); } })));
  }

  // ================= IMAGES =================
  function pickImage(maxDim, cb) {
    const inp = el('input', { type: 'file', accept: 'image/*' });
    inp.onchange = async () => { const f = inp.files[0]; if (!f) return; try { const r = await loadImage(f, maxDim); cb(r.url, r.w, r.h, f.name); } catch (e) { toast('Could not read that image', true); } };
    inp.click();
  }
  function loadImage(file, maxDim) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file); const im = new Image();
      im.onload = () => {
        let w = im.naturalWidth, h = im.naturalHeight; const k = Math.min(1, maxDim / Math.max(w, h)); w = Math.round(w * k); h = Math.round(h * k);
        const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h); URL.revokeObjectURL(url);
        let out = c.toDataURL('image/webp', maxDim <= 512 ? 0.9 : 0.82);
        if (!out.startsWith('data:image/webp')) out = c.toDataURL('image/jpeg', 0.85);
        res({ url: out, w, h });
      };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad image')); };
      im.src = url;
    });
  }

  // ================= MAPS PANE (DM) =================
  function renderMaps() {
    const box = $('#mapsPane'); box.textContent = ''; if (!isGM()) return;
    box.append(el('div', { class: 'row' },
      el('button', { class: 'primary grow', text: '⬆ Upload map image', onclick: () => pickImage(4096, (url, w, h, name) => { request({ type: 'map.add', name: name.replace(/\.[^.]+$/, ''), img: url, w, h, grid: Math.max(30, Math.round(Math.max(w, h) / 30)) }); toast('Map added'); }) }),
      el('button', { class: 'grow', text: '+ Blank grid', onclick: () => request({ type: 'map.add', name: 'Blank grid', w: 30 * 70, h: 20 * 70, grid: 70 }) })));
    const maps = Object.values(S.maps);
    if (maps.length) box.append(el('div', { class: 'section-h', text: 'MAPS (THE HIGHLIGHTED ONE IS WHAT PLAYERS SEE)' }));
    for (const m of maps) {
      const act = m.id === S.activeMapId;
      box.append(el('div', { class: 'item' + (act ? ' active' : '') },
        el('div', { class: 'grow' }, el('div', { text: m.name, style: 'font-weight:700' }), el('div', { class: 'dim', style: 'font-size:13px', text: Object.keys(m.tokens).length + ' tokens' })),
        act ? el('span', { class: 'badge b-ok', text: 'LIVE' }) : el('button', { class: 'small', text: 'Show to players', onclick: () => request({ type: 'map.activate', id: m.id }) }),
        el('button', { class: 'small ghost danger', text: '✕', title: 'Delete map', onclick: () => askConfirm('Delete map "' + m.name + '"?', 'Its tokens are deleted too.', 'Delete', () => request({ type: 'map.delete', id: m.id })) })));
    }
    const m = activeMap(); if (!m) return;
    const up = patch => request({ type: 'map.update', id: m.id, patch });
    const num = (label, val, min, max, fn) => el('label', { class: 'row' }, el('span', { class: 'grow', text: label }), el('input', { type: 'number', value: val, min, max, onchange: e => fn(Number(e.target.value)) }));
    box.append(el('div', { class: 'section-h', text: 'CURRENT MAP' }),
      el('label', { class: 'row' }, el('span', { text: 'Name' }), el('input', { class: 'grow', value: m.name, onchange: e => up({ name: e.target.value }) })),
      el('label', { class: 'row' }, el('span', { class: 'grow', text: 'Grid square size (px)' }), el('input', { type: 'range', min: 10, max: 300, value: m.grid.size, oninput: e => { m.grid.size = Number(e.target.value); draw(); }, onchange: e => up({ grid: { size: Number(e.target.value) } }) }), el('span', { class: 'mono', text: String(m.grid.size) })),
      num('Grid shift left/right', m.grid.ox, -300, 300, v => up({ grid: { ox: v } })),
      num('Grid shift up/down', m.grid.oy, -300, 300, v => up({ grid: { oy: v } })),
      el('label', { class: 'row' }, el('input', { type: 'checkbox', checked: m.grid.show, onchange: e => up({ grid: { show: e.target.checked } }) }), 'Show grid',
        el('input', { type: 'color', value: m.grid.color || TH.p, title: 'Grid colour', onchange: e => up({ grid: { color: e.target.value } }), style: 'width:40px;height:26px;padding:0;margin-left:auto' }),
        el('input', { type: 'range', min: 0.05, max: 1, step: 0.05, value: m.grid.alpha, onchange: e => up({ grid: { alpha: Number(e.target.value) } }), title: 'Grid opacity' })),
      m.img ? null : el('div', { class: 'row' }, num('Width (squares)', Math.round(m.w / m.grid.size), 2, 200, v => up({ w: v * m.grid.size })), num('Height', Math.round(m.h / m.grid.size), 2, 200, v => up({ h: v * m.grid.size }))),
      el('label', { class: 'row' }, el('span', { class: 'grow', text: 'Background colour' }), el('input', { type: 'color', value: m.bg || '#0b0f1a', onchange: e => up({ bg: e.target.value }), style: 'width:40px;height:26px;padding:0' })));
    box.append(el('div', { class: 'section-h', text: 'ADD A TOKEN (NPC, ENEMY, OBJECT)' }));
    const tn = el('input', { class: 'grow', placeholder: 'Name, e.g. Booster #1' });
    const tc = el('input', { type: 'color', value: '#ff2a6d', style: 'width:40px;height:32px;padding:0' });
    let timg = '';
    const pic = el('button', { class: 'small', text: 'Picture…', onclick: () => pickImage(256, u => { timg = u; pic.textContent = 'Picture ✓'; }) });
    const hid = el('input', { type: 'checkbox' });
    box.append(el('div', { class: 'row' }, tn, tc), el('div', { class: 'row' }, pic, el('label', { class: 'row' }, hid, 'hidden'), el('div', { class: 'grow' }),
      el('button', { class: 'primary', text: 'Place', onclick: () => { placeToken({ name: tn.value.trim() || 'NPC', color: tc.value, img: timg, hidden: hid.checked }); tn.value = ''; timg = ''; pic.textContent = 'Picture…'; } })));
    box.append(el('p', { class: 'dim', style: 'font-size:14px', text: 'Tips: drag tokens to move them (they snap to the grid). Right-click a token for options, double-click to open its sheet. Hidden tokens are only visible to you. Drag empty space to pan, scroll to zoom.' }));
  }
  function placeToken(t) {
    const m = activeMap(); if (!m) return toast('Show a map first', true);
    const w = toWorld(W / 2, H / 2); const p = (t.size || 1) * m.grid.size;
    const g = m.grid.size;
    let bx = snap(Math.max(0, Math.min(m.w - p, w.x - p / 2)), g, m.grid.ox), by = snap(Math.max(0, Math.min(m.h - p, w.y - p / 2)), g, m.grid.oy);
    const taken = (x, y) => Object.values(m.tokens).some(o => Math.abs(o.x - x) < g / 2 && Math.abs(o.y - y) < g / 2);
    t.x = bx; t.y = by;
    outer: for (let r = 1; r < 8 && taken(t.x, t.y); r++) for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = bx + dx * g, y = by + dy * g; if (x < 0 || y < 0 || x > m.w - p || y > m.h - p) continue;
      if (!taken(x, y)) { t.x = x; t.y = y; break outer; }
    }
    request({ type: 'token.add', mapId: m.id, token: t });
  }

  // ================= INITIATIVE =================
  function renderInit() {
    const box = $('#initPane'); box.textContent = '';
    const init = N.upgrade(S).init;
    const set = (list, turn, extra) => request(Object.assign({ type: 'init.set', init: { list, turn: turn === undefined ? init.turn : turn } }, extra || {}));
    const mine = Object.values(S.sheets).filter(s => s.ownerId === me.id || (isGM() && !s.ownerId));
    if (mine.length) box.append(el('div', { class: 'row', style: 'flex-wrap:wrap' }, ...mine.map(s => el('button', { class: 'small primary', text: '🎲 ' + s.name, title: 'Roll initiative (1d10! + REF' + (s.role === 'solo' ? ' + Combat Sense' : '') + ')', onclick: () => rollInit(s) }))));
    if (!init.list.length) { box.append(el('div', { class: 'dim', text: 'Nobody has rolled initiative yet. Roll from the buttons above or from a character sheet. Once someone is on the list, combat movement rules switch on.' })); }
    else box.append(el('div', { class: 'row' }, el('span', { class: 'section-h grow', style: 'margin:0', text: 'Round ' + init.round }),
      el('span', { class: 'dim', style: 'font-size:.75rem', text: init.rules.limit ? 'Movement: run distance per round' + (init.rules.turnOnly ? ', on your turn only' : '') : 'Movement: unlimited' })));
    const m = activeMap();
    const tokFor = e => m && e.sheetId ? Object.values(m.tokens).find(t => t.sheetId === e.sheetId) : null;
    init.list.forEach((e, i) => {
      const t = tokFor(e); const b = t ? moveBudget(t) : null;
      box.append(el('div', { class: 'init-row' + (i === init.turn ? ' cur' : '') },
        el('span', { class: 'v', text: String(e.value) }),
        el('div', { class: 'grow' }, el('div', { text: e.name }),
          b ? el('div', { class: 'dim', style: 'font-size:.72rem', text: 'moved ' + (b.used || 0) + ' / ' + b.run + ' m' + (b.left <= 0 ? ' · no movement left' : '') }) : null),
        i === init.turn ? el('span', { class: 'badge b-crit', text: 'NOW' }) : null,
        isGM() && t && b && b.used ? el('button', { class: 'small ghost', text: '↺', title: 'Give back this round\'s movement', onclick: () => set(init.list, init.turn, { init: { list: init.list, turn: init.turn, resetToken: t.id } }) }) : null,
        isGM() ? el('button', { class: 'small ghost', text: '✕', onclick: () => { const l = init.list.filter(x => x.id !== e.id); set(l, Math.min(init.turn, Math.max(0, l.length - 1))); } }) : null));
    });
    if (isGM()) {
      const n = el('input', { class: 'grow', placeholder: 'Name' }), v = el('input', { type: 'number', value: 10 });
      const next = () => { const len = Math.max(1, init.list.length); const t = (init.turn + 1) % len; set(init.list, t, t === 0 ? { newRound: true } : null); if (t === 0) toast('Round ' + (init.round + 1) + ': movement resets'); };
      const rules = (patch) => request({ type: 'init.set', init: { list: init.list, turn: init.turn, rules: Object.assign({}, init.rules, patch) } });
      box.append(el('div', { class: 'row' },
        el('button', { class: 'primary grow', text: 'Next turn ▶', disabled: !init.list.length, onclick: next }),
        el('button', { text: '◀', disabled: !init.list.length, onclick: () => set(init.list, (init.turn - 1 + init.list.length) % Math.max(1, init.list.length)) }),
        el('button', { text: 'New round', title: 'Back to the top of the order and reset everyone\'s movement', disabled: !init.list.length, onclick: () => { set(init.list, 0, { newRound: true }); toast('Round ' + (init.round + 1) + ': movement resets'); } }),
        el('button', { class: 'danger', text: 'End combat', onclick: () => set([], 0) })),
        el('div', { class: 'section-h', text: 'COMBAT MOVEMENT RULES' }),
        el('label', { class: 'row' }, el('input', { type: 'checkbox', checked: init.rules.limit, onchange: e => rules({ limit: e.target.checked }) }), 'Limit movement to run distance (MA × 3 m) per round, split across moves'),
        el('label', { class: 'row' }, el('input', { type: 'checkbox', checked: init.rules.turnOnly, onchange: e => rules({ turnOnly: e.target.checked }) }), 'Players can only move on their own turn'),
        el('div', { class: 'dim', style: 'font-size:.75rem', text: 'You (the DM) can always move any token. Movement only counts for tokens linked to a character.' }),
        el('div', { class: 'section-h', text: 'ADD BY HAND' }),
        el('div', { class: 'row' }, n, v, el('button', { text: 'Add', onclick: () => { if (!n.value.trim()) return; const l = init.list.concat([{ id: N.uid(), name: n.value.trim(), value: Number(v.value) || 0 }]).sort((a, b) => b.value - a.value); set(l); } })));
    }
  }
  function rollInit(s) {
    let mod = N.effStat(s, 'REF'); let lbl = 'Initiative (REF ' + mod;
    if (s.role === 'solo' && s.specialAbility) { mod += s.specialAbility; lbl += ' + Combat Sense ' + s.specialAbility; }
    rollReq('1d10!' + sign(mod), s.name + ': ' + lbl + ')', { init: { name: s.name, sheetId: s.id } });
  }

  // ================= SHEETS PANE =================
  function renderSheets() {
    const box = $('#sheetsPane'); box.textContent = '';
    box.append(el('div', { class: 'row' },
      el('button', { class: 'primary grow', text: '+ New character', onclick: () => newSheet(false) }),
      el('button', { class: 'pink grow', text: '⇩ Import', title: 'Import from cyberpunk2020character.com', onclick: openImportHelp })));
    if (isGM()) box.append(el('button', { text: '+ New NPC (only you can edit)', onclick: () => newSheet(true) }));
    const list = Object.values(S.sheets).sort((a, b) => ((b.ownerId === me.id) - (a.ownerId === me.id)) || a.name.localeCompare(b.name));
    if (!list.length) box.append(el('p', { class: 'dim', text: "No characters yet. Make one, or click Import to bring yours over from cyberpunk2020character.com." }));
    for (const s of list) {
      const w = N.woundInfo(s.damage);
      const av = el('div', { class: 'avatar', style: (s.portrait ? 'background-image:url("' + s.portrait.replace(/"/g, '%22') + '");' : '') + 'border-color:' + (s.ownerId ? playerColor(s.ownerId) : '#ff2a6d') }, s.portrait ? '' : (s.name[0] || '?').toUpperCase());
      box.append(el('div', { class: 'item' }, av,
        el('div', { class: 'grow', style: 'min-width:0' }, el('div', { style: 'font-weight:700', text: s.name + (s.handle ? ' "' + s.handle + '"' : '') }),
          el('div', { class: 'dim', style: 'font-size:13px', text: ((N.ROLES[s.role] && N.ROLES[s.role].label) || s.role) + ' · ' + (s.ownerId ? playerName(s.ownerId) : 'NPC') + ' · ' + w.label })),
        el('button', { class: 'small', text: 'Open', onclick: () => openSheetModal(s.id) }),
        (canEditSheet(s) && activeMap()) ? el('button', { class: 'small ghost', text: 'Place', title: 'Put a token for this character on the map', onclick: () => placeToken({ name: s.name, color: s.ownerId ? playerColor(s.ownerId) : '#ff2a6d', sheetId: s.id }) }) : null));
    }
  }
  function newSheet(npc) {
    const s = N.blankSheet(npc ? null : me.id); s.name = npc ? 'New NPC' : (me.name ? me.name + "'s character" : 'New Character');
    if (isGM()) s.ownerId = npc ? null : me.id;
    pendingOpen = s.name; request({ type: 'sheet.upsert', sheet: s });
    setTimeout(() => { const f = Object.values(S.sheets).filter(x => x.name === s.name).sort((a, b) => b.updatedAt - a.updatedAt)[0]; if (f) openSheetModal(f.id); }, role === 'host' ? 30 : 700);
  }
  let pendingOpen = null;

  // ================= MODAL =================
  function modal(title, wide) {
    closeModal();
    const ov = el('div', { class: 'overlay', id: 'overlay', onclick: e => { if (e.target.id === 'overlay') closeModal(); } });
    const m = el('div', { class: 'modal frame' + (wide ? ' wide' : '') }, el('button', { class: 'small ghost x', text: '✕', onclick: closeModal }), el('h2', { text: title }));
    ov.appendChild(m); document.body.appendChild(ov); return m;
  }
  function closeModal() { const o = $('#overlay'); if (o) o.remove(); openSheet = null; }

  // ================= CHARACTER SHEET =================
  let openSheet = null; // draft being edited
  let sheetSaveTimer = null;
  function openSheetModal(id) {
    const s = S.sheets[id]; if (!s) return;
    openSheet = N.clone(s);
    renderSheetModal(true);
  }
  function refreshOpenSheet(fresh) {
    const ov = $('#overlay'); if (!ov || !openSheet) return;
    if (ov.contains(document.activeElement) && document.activeElement.matches('input,textarea,select')) return; // they're typing
    openSheet = N.clone(fresh); renderSheetModal(false);
  }
  function saveSheetSoon() { clearTimeout(sheetSaveTimer); const snap = N.clone(openSheet); sheetSaveTimer = setTimeout(() => request({ type: 'sheet.upsert', sheet: snap }), 400); }
  let sheetTab = 'stats';
  const STAT_DESC = { INT: 'Intelligence: problem solving, memory', REF: 'Reflexes: speed, aim, reactions', TECH: 'Technical ability: building, fixing', COOL: 'Cool: calm under pressure', ATTR: 'Attractiveness: looks, charisma', LUCK: 'Luck: fortune when it counts', MA: 'Movement: running speed', BODY: 'Body: strength, toughness', EMP: 'Empathy: relating to people' };
  function renderSheetModal(first) {
    const s = openSheet; if (!s) return;
    const ed = canEditSheet(S.sheets[s.id] || s);
    const prev = $('#overlay'); const scroll = prev ? prev.scrollTop : 0; const skScroll = prev && $('.skills', prev) ? $('.skills', prev).scrollTop : 0;
    const keepFilter = prev && $('#skFilter', prev) ? $('#skFilter', prev).value : '';
    const keepTrained = prev && $('#skTrained', prev) ? $('#skTrained', prev).checked : !ed;
    const m = modal((ed ? '' : '👁 ') + s.name, true); const ov = $('#overlay');
    const change = (fn, rerender) => e => { fn(e.target.type === 'number' ? Number(e.target.value) : (e.target.type === 'checkbox' ? e.target.checked : e.target.value)); saveSheetSoon(); if (rerender !== false) renderSheetModal(false); };
    const inp = (val, fn, attrs) => el('input', Object.assign({ value: val, disabled: !ed, onchange: change(fn) }, attrs || {}));
    const d = N.derived(s);

    // header
    const portrait = el('div', { class: 'portrait', title: ed ? 'Click to change picture' : '', style: s.portrait ? 'background-image:url("' + s.portrait.replace(/"/g, '%22') + '")' : '', onclick: () => { if (ed) pickImage(400, u => { s.portrait = u; saveSheetSoon(); renderSheetModal(false); }); } }, s.portrait ? '' : (ed ? 'Click to add picture' : ''));
    const roleSel = el('select', { disabled: !ed, onchange: change(v => { s.role = v; }) }, ...Object.entries(N.ROLES).map(([k, r]) => el('option', { value: k, text: r.label, selected: k === s.role })), N.ROLES[s.role] ? null : el('option', { value: s.role, text: s.role, selected: true }));
    const wound = N.woundInfo(s.damage);
    const wallet = (label, body, color, sub) => el('div', { class: 'wallet', style: '--wc:' + color }, el('div', { class: 'wl', text: label }), body, sub ? el('div', { class: 'ws', text: sub }) : null);
    const head = el('div', { class: 'dossier full' }, portrait,
      el('div', { class: 'col grow', style: 'min-width:240px' },
        el('div', { class: 'dlabel', text: '▮▮ CHARACTER DOSSIER ▮▮' }),
        inp(s.name, v => { s.name = v; }, { class: 'dname', placeholder: 'Name' }),
        el('div', { class: 'row', style: 'flex-wrap:wrap' }, el('label', { text: 'Handle' }), inp(s.handle, v => { s.handle = v; }, { class: 'grow', style: 'min-width:120px' }), el('label', { text: 'Role' }), roleSel),
        el('div', { class: 'row', style: 'flex-wrap:wrap' },
          isGM() ? el('label', { text: 'Owner' }) : null,
          isGM() ? el('select', { onchange: e => { s.ownerId = e.target.value || null; request({ type: 'sheet.upsert', sheet: N.clone(s) }); } }, el('option', { value: '', text: 'NPC (DM only)' }), ...Object.values(S.players).map(p => el('option', { value: p.id, text: p.name, selected: p.id === s.ownerId }))) : el('span', { class: 'dim', text: 'Player: ' + (s.ownerId ? playerName(s.ownerId) : 'NPC') }),
          s.source ? el('span', { class: 'dim', style: 'font-size:.75rem', text: 'Imported from ' + s.source.site + ' ' + ago(s.source.importedAt) }) : null)),
      el('div', { class: 'wallets' },
        wallet('Eddies €$', inp(s.eddies, v => { s.eddies = v; }, { type: 'number', class: 'wv' }), 'var(--green)'),
        wallet('Humanity', inp(s.humanity, v => { s.humanity = v; }, { type: 'number', class: 'wv' }), '#c77dff', 'EMP ' + N.effStat(s, 'EMP')),
        wallet('Reputation', inp(s.rep, v => { s.rep = v; }, { type: 'number', class: 'wv' }), 'var(--t)'),
        wallet('Status', el('div', { class: 'wv', text: wound.label.toUpperCase() }), s.damage >= 13 ? 'var(--red)' : s.damage >= 5 ? '#ff9f1c' : 'var(--p)', 'Damage ' + s.damage + ' / 40')));

    // stats
    const stats = el('div', { class: 'statgrid' }, ...N.STATS.map(st => {
      const v = s.stats[st]; v.cyber = v.cyber || 0;
      const eff = N.effStat(s, st), raw = N.statVal(s, st), natural = Math.max(0, (Number(v.base) || 0) + (Number(v.mod) || 0));
      const step = (k, dlt, lo, hi) => () => { if (!ed) return; v[k] = Math.max(lo, Math.min(hi, (Number(v[k]) || 0) + dlt)); saveSheetSoon(); renderSheetModal(false); };
      const adj = (label, k, lo, hi, cls) => el('div', { class: 'adj ' + (cls || '') }, el('span', { class: 'al', text: label }),
        ed ? el('button', { class: 'small minus', text: '−', onclick: step(k, -1, lo, hi) }) : null,
        el('input', { type: 'number', value: v[k], min: lo, max: hi, disabled: !ed, onchange: e => { v[k] = Math.max(lo, Math.min(hi, Number(e.target.value) || 0)); saveSheetSoon(); renderSheetModal(false); } }),
        ed ? el('button', { class: 'small plus', text: '+', onclick: step(k, 1, lo, hi) }) : null);
      const segs = Math.max(10, Math.min(20, raw));
      return el('div', { class: 'stat' + (v.cyber ? ' hascyber' : '') },
        el('div', { class: 'top' }, el('div', { class: 'k', title: 'Click to roll 1d10! + ' + st, text: st, onclick: () => rollReq('1d10!' + sign(eff), s.name + ': ' + st + ' check (' + eff + ')') }),
          el('div', { class: 'v' + (eff < raw ? ' pen' : '') + (v.cyber > 0 ? ' cy' : ''), text: String(eff) })),
        el('div', { class: 'sd', text: STAT_DESC[st] }),
        el('div', { class: 'bar', style: 'grid-template-columns:repeat(' + segs + ',1fr)' }, ...Array.from({ length: segs }, (_, i) => el('i', { class: i < Math.min(natural, raw) ? 'f' : i < raw ? 'f c' : '' }))),
        adj('BASE', 'base', 0, 10), adj('TEMP', 'mod', -10, 10, 'temp'), adj('CYBER', 'cyber', -10, 10, 'cyb'),
        el('div', { class: 'stot' }, 'TOTAL ', el('b', { text: String(raw) }), eff < raw ? el('span', { style: 'color:var(--red)', text: ' (' + eff + ' while wounded)' }) : null));
    }));
    const statBox = el('div', { class: 'box full' }, el('h3', { text: 'MAIN STATISTICS · CLICK A STAT TO ROLL' }), stats);
    const tile = (k, v, sub) => el('div', { class: 'tile' }, el('div', { class: 'tk', text: k }), el('div', { class: 'tv', text: v }), el('div', { class: 'ts', text: sub }));
    const derivedBox = el('div', { class: 'box full' }, el('h3', { text: 'DERIVED STATISTICS' }), el('div', { class: 'tiles' },
      tile('RUN', d.run + 'm', 'MA × 3 per turn'), tile('LEAP', d.leap + 'm', 'RUN ÷ 4'), tile('LIFT', d.lift + 'kg', 'BODY × 40'), tile('CARRY', d.carry + 'kg', 'BODY × 10'),
      tile('BTM', String(d.btm), 'body type modifier'), tile('SAVE', String(d.save), 'stun / death save')));

    // derived + wounds
    const ra = N.ROLES[s.role];
    const deriv = el('div', { class: 'box' }, el('h3', { text: 'BODY & COMBAT' }),
      el('div', { class: 'derived' },
        el('div', null, 'Run ', el('b', { text: d.run + 'm' })), el('div', null, 'Leap ', el('b', { text: d.leap + 'm' })), el('div', null, 'Lift ', el('b', { text: d.lift + 'kg' })),
        el('div', null, 'BTM ', el('b', { text: String(d.btm) })), el('div', null, 'Save ', el('b', { text: String(d.save) })), el('div', null, 'Wound ', el('b', { text: d.wound.label }))),
      el('div', { class: 'row', style: 'flex-wrap:wrap;margin-top:8px' },
        el('button', { class: 'small primary', text: '🎲 Initiative', onclick: () => rollInit(s) }),
        el('button', { class: 'small', text: 'Stun save (≤' + d.stunTarget + ')', onclick: () => rollReq('1d10', s.name + ': Stun/Shock save, need ' + d.stunTarget + ' or less', { target: d.stunTarget }) }),
        d.deathTarget !== null ? el('button', { class: 'small pink', text: 'Death save (≤' + d.deathTarget + ')', onclick: () => rollReq('1d10', s.name + ': Death save, need ' + d.deathTarget + ' or less', { target: d.deathTarget }) }) : null,
        el('button', { class: 'small', text: (ra ? ra.ability : 'Special ability') + ' +' + s.specialAbility, onclick: () => { const st = ra && ra.stat; const mod = s.specialAbility + (st ? N.effStat(s, st) : 0); rollReq('1d10!' + sign(mod), s.name + ': ' + (ra ? ra.ability : 'Special ability') + ' (' + s.specialAbility + (st ? ' + ' + st + ' ' + N.effStat(s, st) : '') + ')'); } }),
        ed ? inp(s.specialAbility, v => { s.specialAbility = v; }, { type: 'number', title: 'Special ability level', min: 0, max: 10 }) : null),
      el('div', { class: 'row', style: 'margin-top:8px' }, el('span', { class: 'grow', style: 'font-size:13px;color:var(--dim)', text: 'DAMAGE ' + s.damage + ' / 40' + (ed ? ' · click a box' : '') }),
        ed ? el('button', { class: 'small ghost', text: '−', onclick: () => { s.damage = Math.max(0, s.damage - 1); saveSheetSoon(); renderSheetModal(false); } }) : null,
        ed ? el('button', { class: 'small ghost', text: '+', onclick: () => { s.damage = Math.min(41, s.damage + 1); saveSheetSoon(); renderSheetModal(false); } }) : null),
      el('div', { class: 'wounds' }, ...['LIGHT', 'SERIOUS', 'CRITICAL', 'MORT 0', 'MORT 1', 'MORT 2', 'MORT 3', 'MORT 4', 'MORT 5', 'MORT 6'].map((lab, gi) => el('div', { class: 'wgrp' },
        el('div', { class: 'wl', text: lab }),
        el('div', { class: 'wb' }, ...[0, 1, 2, 3].map(j => { const i = gi * 4 + j; return el('div', { class: 'wbox' + (s.damage > i ? ' f' : ''), title: 'Damage ' + (i + 1), onclick: () => { if (!ed) return; s.damage = s.damage === i + 1 ? i : i + 1; saveSheetSoon(); renderSheetModal(false); } }); }))))),
      el('h3', { text: 'ARMOR (SP)', style: 'margin-top:10px' }),
      el('div', { class: 'spgrid' }, ...N.LOCS.map(([k, lab, rollN]) => el('div', null, el('div', { class: 'dim', text: lab + ' ' + rollN }), inp(s.sp[k], v => { s.sp[k] = v; }, { type: 'number' })))),
      el('div', { class: 'row', style: 'margin-top:6px' }, el('button', { class: 'small', text: 'Roll hit location', onclick: () => rollReq('1d10', s.name + ': hit location (1 Head, 2-4 Torso, 5 R.Arm, 6 L.Arm, 7-8 R.Leg, 9-10 L.Leg)') })));

    // skills
    const skillRows = el('div', { class: 'skills' });
    const filter = el('input', { id: 'skFilter', placeholder: 'Find skill…', class: 'grow', value: keepFilter });
    const trained = el('input', { id: 'skTrained', type: 'checkbox', checked: keepTrained });
    const fillSkills = () => {
      skillRows.textContent = ''; const q = filter.value.trim().toLowerCase();
      s.skills.forEach((sk, idx) => {
        if (q && !sk.name.toLowerCase().includes(q)) return;
        if (trained.checked && !sk.value) return;
        const tot = N.skillTotal(s, sk);
        skillRows.appendChild(el('div', { class: 'sk' + (sk.value ? ' trained' : '') },
          el('span', { class: 'n', text: sk.name, title: sk.name }),
          ed ? el('select', { onchange: change(v => { sk.stat = v; }), style: 'padding:1px;font-size:12px' }, el('option', { value: '', text: '—' }), ...N.STATS.map(st => el('option', { value: st, text: st, selected: st === sk.stat }))) : el('span', { class: 's', text: sk.stat || '—' }),
          el('input', { type: 'number', value: sk.value, min: 0, max: 20, disabled: !ed, onchange: change(v => { sk.value = v; }) }),
          el('span', { class: 't', text: String(tot), title: 'Skill + stat' }),
          el('button', { class: 'small', text: '🎲', title: 'Roll 1d10! + ' + tot, onclick: () => rollReq('1d10!' + sign(tot), s.name + ': ' + sk.name + ' (' + (sk.stat ? sk.stat + ' ' + N.effStat(s, sk.stat) + ' + ' : '') + sk.value + ')') })));
      });
      if (!skillRows.children.length) skillRows.appendChild(el('div', { class: 'dim', text: trained.checked ? 'No trained skills match. Untick "trained only" to see all.' : 'No skills match.' }));
    };
    filter.oninput = fillSkills; trained.onchange = fillSkills; fillSkills();
    const newSk = el('input', { placeholder: 'Custom skill name, e.g. Expert: Ripperdoc' , class: 'grow' });
    const skillBox = el('div', { class: 'box' }, el('h3', { text: 'SKILLS · 🎲 ROLLS 1D10! + SKILL + STAT' }),
      el('div', { class: 'row', style: 'margin-bottom:6px' }, filter, el('label', { class: 'row' }, trained, 'trained only')), skillRows,
      ed ? el('div', { class: 'row', style: 'margin-top:6px' }, newSk, el('button', { class: 'small', text: '+ Add', onclick: () => { const n = newSk.value.trim(); if (!n) return; s.skills.push({ name: n, stat: N.SKILL_STAT[n.toLowerCase()] || 'INT', value: 1 }); s.skills.sort((a, b) => a.name.localeCompare(b.name)); saveSheetSoon(); renderSheetModal(false); } })) : null);

    // weapons
    const wt = el('table', { class: 'wt' }, el('tr', null, ...['Weapon', 'Type', 'WA', 'Damage', 'ROF', 'Mag', 'Left', 'Spare mags', 'Range', 'Skill', ''].map(h => el('th', { text: h }))));
    s.weapons.forEach((w, i) => {
      const skv = (s.skills.find(k => k.name.toLowerCase() === String(w.skill).toLowerCase()) || { value: 0 }).value;
      const atk = N.effStat(s, 'REF') + skv + (Number(w.wa) || 0);
      const cell = (k, attrs) => el('td', null, inp(w[k], v => { w[k] = v; }, attrs));
      wt.appendChild(el('tr', null, cell('name'), cell('type'), cell('wa', { type: 'number', style: 'width:46px' }), cell('damage'), cell('rof', { style: 'width:40px' }), cell('shots', { style: 'width:44px', title: 'Rounds per magazine' }), cell('left', { type: 'number', style: 'width:50px', title: 'Rounds left' }), cell('mags', { type: 'number', style: 'width:50px', title: 'Spare magazines' }), cell('range', { style: 'width:54px' }),
        el('td', null, el('select', { disabled: !ed, onchange: change(v => { w.skill = v; }) }, ...['Handgun', 'Submachinegun', 'Rifle', 'Heavy Weapons', 'Melee', 'Fencing', 'Brawling', 'Martial Arts', 'Archery', 'Athletics'].map(k => el('option', { value: k, text: k, selected: k === w.skill })))),
        el('td', { style: 'white-space:nowrap' },
          el('button', { class: 'small primary', text: 'Attack ' + sign(atk), title: '1d10! + REF + ' + w.skill + ' + WA, plus your switched-on to-hit toggles. Uses 1 round.', onclick: () => useAmmo(s, i, 1, true) && rollWithMods(s, '1d10!' + sign(atk), s.name + ' attacks with ' + (w.name || 'weapon') + ' (REF ' + N.effStat(s, 'REF') + ' + ' + w.skill + ' ' + skv + ' + WA ' + (Number(w.wa) || 0) + ')', 'hit') }), ' ',
          el('button', { class: 'small pink', text: 'Dmg', title: 'Roll damage ' + w.damage + ', plus your switched-on damage toggles', onclick: () => rollWithMods(s, String(w.damage || '').replace(/D/g, 'd'), (w.name || 'Weapon') + ' damage', 'dmg', { ap: /\bAP\b/i.test(w.notes || '') }) }), ' ',
          el('button', { class: 'small pink', text: '🎯', title: 'Attack your target with this weapon (range, hit and damage worked out for you)', onclick: () => { closeModal(); openAttack(i); } }), ' ',
          el('button', { class: 'small', text: 'Both', title: 'Roll the attack and the damage together. Uses 1 round.', onclick: () => { if (!useAmmo(s, i, 1, true)) return; rollWithMods(s, '1d10!' + sign(atk), s.name + ' attacks with ' + (w.name || 'weapon'), 'hit'); setTimeout(() => rollWithMods(s, String(w.damage || '').replace(/D/g, 'd'), (w.name || 'Weapon') + ' damage', 'dmg'), 150); } }),
          ed ? el('button', { class: 'small ghost', text: '✕', onclick: () => { s.weapons.splice(i, 1); saveSheetSoon(); renderSheetModal(false); } }) : null)));
    });
    const weapBox = el('div', { class: 'box full' }, el('h3', { text: 'WEAPONS' }), s.weapons.length ? wt : el('div', { class: 'dim', text: 'No weapons.' }),
      ed ? el('button', { class: 'small', style: 'margin-top:6px', text: '+ Add weapon', onclick: () => { s.weapons.push({ name: 'New weapon', type: 'Pistol', wa: 0, damage: '2d6+1', rof: '2', shots: '10', range: '50m', rel: 'ST', skill: 'Handgun', notes: '' }); saveSheetSoon(); renderSheetModal(false); } }) : null);

    // macros & toggles
    const macBox = el('div', { class: 'box full' }, el('h3', { text: 'MACROS & ROLL TOGGLES' }),
      el('div', { class: 'row', style: 'flex-wrap:wrap;gap:4px' }, ...(s.macros || []).map(mc => el('button', { class: 'small primary', style: 'text-transform:none', title: mc.formula + (ed ? ' (right-click to edit)' : ''), text: '▶ ' + mc.name, onclick: () => runMacro(s, mc), oncontextmenu: e => { e.preventDefault(); if (ed) editMacroDialog(s, mc, () => openSheetModal(s.id)); } })),
        ed ? el('button', { class: 'small ghost', text: '+ New macro', onclick: () => editMacroDialog(s, null, () => openSheetModal(s.id)) }) : null),
      el('div', { class: 'dim', style: 'font-size:.78rem;margin:8px 0 4px', text: 'Toggles: switched-on ones (●) are added to attacks and damage rolls automatically.' }),
      modChips(s, ed, () => { saveSheetSoon(); renderSheetModal(false); }),
      ed ? el('button', { class: 'small ghost', style: 'margin-top:6px', text: 'Edit toggles…', onclick: () => editModsDialog(s, () => openSheetModal(s.id)) }) : null);
    // cyberware & gear
    const listBox = (title, arr, cols, add) => el('div', { class: 'box' }, el('h3', { text: title }),
      el('div', { class: 'list-ed' }, ...(arr.length ? arr.map((it, i) => el('div', { class: 'r' + (cols.length === 3 ? ' cw' : '') }, ...cols.map(([k, ph, w]) => inp(it[k], v => { it[k] = v; }, { placeholder: ph, style: w ? 'width:' + w : '' })),
        ed ? el('button', { class: 'small ghost', text: '✕', onclick: () => { arr.splice(i, 1); saveSheetSoon(); renderSheetModal(false); } }) : el('span'))) : [el('div', { class: 'dim', text: 'Nothing yet.' })])),
      ed ? el('button', { class: 'small', style: 'margin-top:6px', text: '+ Add', onclick: () => { arr.push(add()); saveSheetSoon(); renderSheetModal(false); } }) : null);
    const cyberBox = listBox('CYBERWARE (NAME / HL / NOTES)', s.cyberware, [['name', 'Name'], ['hl', 'HL', '50px'], ['notes', 'Notes']], () => ({ name: '', hl: '', notes: '' }));
    const gearBox = listBox('GEAR', s.gear, [['name', 'Item'], ['notes', 'Notes']], () => ({ name: '', notes: '' }));
    const notes = el('div', { class: 'box full' }, el('h3', { text: 'NOTES · LIFEPATH · CONTACTS' }), el('textarea', { disabled: !ed, style: 'width:100%;min-height:120px', value: s.notes, onchange: change(v => { s.notes = v; }, false) }));
    const foot = el('div', { class: 'row full' }, el('div', { class: 'grow' }),
      ed ? el('button', { class: 'ghost', text: 'Download sheet', onclick: () => downloadJSON(s, s.name.replace(/[^\w-]+/g, '_') + '.nct-character.json') }) : null,
      ed ? el('button', { class: 'ghost danger', text: 'Delete character', onclick: () => askConfirm('Delete ' + s.name + '?', 'This character sheet is removed for everyone.', 'Delete', () => request({ type: 'sheet.delete', id: s.id })) }) : null,
      el('button', { class: 'primary', text: 'Done', onclick: closeModal }));
    const tabs = [['stats', 'Statistics'], ['skills', 'Skills'], ['combat', 'Combat'], ['cyber', 'Cyberware'], ['gear', 'Gear'], ['macros', 'Macros'], ['notes', 'Notes']];
    const tabBar = el('div', { class: 'sheettabs full' }, ...tabs.map(([k, l]) => el('button', { class: sheetTab === k ? 'on' : '', text: l, onclick: () => { sheetTab = k; renderSheetModal(false); } })));
    const body = sheetTab === 'skills' ? [skillBox] : sheetTab === 'combat' ? [deriv, el('div', { class: 'box' }, el('h3', { text: 'ROLL TOGGLES' }), modChips(s, ed, () => { saveSheetSoon(); renderSheetModal(false); }), el('div', { class: 'dim', style: 'font-size:.75rem;margin-top:8px', text: 'Switched-on toggles (●) are added to attacks and damage automatically.' })), weapBox]
      : sheetTab === 'cyber' ? [cyberBox] : sheetTab === 'gear' ? [gearBox] : sheetTab === 'macros' ? [macBox] : sheetTab === 'notes' ? [notes] : [statBox, derivedBox];
    body.forEach(b => b.classList.add('full'));
    m.appendChild(el('div', { class: 'sheet' }, head, tabBar, ...body, foot));
    openSheet = s;
    ov.scrollTop = scroll; const sk = $('.skills', ov); if (sk) sk.scrollTop = skScroll;
    if (!ed && first) toast("You can view this character but only its owner or the DM can change it.");
  }

  // ================= IMPORT (cyberpunk2020character.com) =================
  function bookmarkletHref() {
    return 'javascript:' + encodeURIComponent('(function(){(' + window.nctGrab.toString() + ')(' + JSON.stringify(APP_URL) + ');})();void 0');
  }
  function siteImportScript() { return window.nctGrab.toString() + ';\n(' + window.nctSiteHelper.toString() + ')();'; }
  function openImportHelp() {
    const m = modal('Import from cyberpunk2020character.com');
    if (DESKTOP && window.nctDesktop.openSiteImport) {
      m.append(el('p', { text: 'The app opens the character site in its own window with a pink bar at the top.' }),
        el('ol', { class: 'steps' },
          el('li', null, 'Click the button below.'),
          el('li', null, 'In that window, open your character the way you normally do. If you use a join or character link, paste it into the bar at the top and press GO.'),
          el('li', null, 'Once you can see your stats, click ', el('b', { text: 'SEND MY CHARACTER' }), ' in the pink bar. Your character pops up here, ready to add.')),
        el('button', { class: 'primary', style: 'width:100%;padding:12px', text: 'Open cyberpunk2020character.com', onclick: () => { window.nctDesktop.openSiteImport(siteImportScript()); closeModal(); toast('Opening the character site…'); } }),
        el('div', { class: 'section-h', style: 'margin-top:18px', text: 'Other ways' }));
    }
    const bm = DESKTOP ? el('button', { class: 'pink', text: 'Open the button in my web browser', onclick: () => window.nctDesktop.openBookmarkPage(bookmarkletHref()) })
      : el('a', { class: 'bm', href: bookmarkletHref(), onclick: e => { e.preventDefault(); toast("Drag this button to your bookmarks bar (don't click it here)"); } }, '⇩ Send to Night City Table');
    m.append(
      el('p', { class: 'dim', text: "Character links on that site are private, so the import has to run from a browser that's logged in to your character. A bookmark button does it in one click." }),
      el('ol', { class: 'steps' },
        el('li', null, 'Show your bookmarks bar (press ', el('b', { text: 'Ctrl+Shift+B' }), ', or ', el('b', { text: '⌘+Shift+B' }), ' on Mac).'),
        DESKTOP ? el('li', null, 'Click this. It opens a page in your normal web browser (Chrome, Edge…). There, ', el('b', { text: 'drag the pink button onto your bookmarks bar' }), '. You only do this once:', el('div', { style: 'margin:10px 0' }, bm))
          : el('li', null, el('b', { text: 'Drag this pink button' }), ' up onto the bookmarks bar. You only do this once:', el('div', { style: 'margin:10px 0' }, bm)),
        el('li', null, 'Open your character on ', el('a', { href: 'https://cyberpunk2020character.com', target: '_blank', rel: 'noopener', text: 'cyberpunk2020character.com' }), ' the way you normally do, so you can see your stats.'),
        el('li', null, 'Click the ', el('b', { text: 'Send to Night City Table' }), ' bookmark. ', DESKTOP ? 'It copies your character. Switch back to this app and it pops up by itself, ready to add.' : 'Your character pops up here, ready to add.')),
      (ONLINE || DESKTOP) ? null : el('p', { class: 'notice', text: "Because this file is running from your computer, the button will copy your character instead of sending it. After clicking it, paste below." }),
      el('div', { class: 'section-h', text: 'OR PASTE A CHARACTER' }),
      el('p', { class: 'dim', style: 'font-size:14px', text: 'The button also copies your character, so if the pop-up gets blocked, paste it here (Ctrl+V). A downloaded Night City Table sheet file also works.' }));
    const ta = el('textarea', { style: 'width:100%;height:80px', placeholder: 'Paste here…' });
    const file = el('input', { type: 'file', accept: '.json', class: 'hidden', onchange: async e => { const f = e.target.files[0]; if (f) { ta.value = await f.text(); go(); } } });
    const go = () => { try { const v = ta.value.trim(); const obj = JSON.parse(v.startsWith('NCT1:') ? v.slice(5) : v); handleIncomingCharacter(obj); } catch (e) { toast("That doesn't look like a character. Try the button again.", true); } };
    m.append(ta, file, el('div', { class: 'row', style: 'margin-top:6px' }, el('button', { class: 'ghost', text: 'Open sheet file…', onclick: () => file.click() }), el('div', { class: 'grow' }),
      el('button', { class: 'small ghost', text: 'Copy button code', title: 'For browsers where dragging does not work: make a new bookmark and paste this as its address', onclick: () => copyText(bookmarkletHref()) }),
      el('button', { class: 'primary', text: 'Import', onclick: go })));
  }
  function toSheet(obj) {
    if (obj && obj.type === 'nct-character') return N.fromCP2020Site(obj.data, { playerId: obj.playerId });
    if (obj && obj.stats && obj.skills && Array.isArray(obj.skills)) return N.sanitizeSheet(obj); // our own format
    return N.fromCP2020Site(obj, {});
  }
  function handleIncomingCharacter(obj) {
    if (!S) { LS.set('nct-pending-import', { obj, at: Date.now() }); return; }
    let sh; try { sh = toSheet(obj); } catch (e) { toast(e.message, true); return; }
    LS.del('nct-pending-import');
    const m = modal('Add ' + sh.name + '?');
    const trainedSk = sh.skills.filter(k => k.value > 0);
    m.append(el('div', { class: 'row' }, sh.portrait ? el('div', { class: 'avatar', style: 'width:64px;height:64px;background-image:url("' + sh.portrait.replace(/"/g, '%22') + '")' }) : null,
      el('div', null, el('div', { style: 'font-size:20px;font-weight:700', text: sh.name }), el('div', { class: 'dim', text: ((N.ROLES[sh.role] && N.ROLES[sh.role].label) || sh.role) + ' · Humanity ' + sh.humanity + ' · ' + N.woundInfo(sh.damage).label }))),
      el('p', { class: 'mono', style: 'font-size:14px', text: N.STATS.map(st => st + ' ' + N.statVal(sh, st)).join('  ') }),
      el('p', { class: 'dim', text: trainedSk.length + ' trained skills · ' + sh.weapons.length + ' weapons · ' + sh.cyberware.length + ' cyberware · ' + sh.gear.length + ' gear items' }),
      el('p', { class: 'dim', style: 'font-size:14px', text: "Check the armor SP and weapon numbers after importing. Different sites store those differently." }));
    const existing = Object.values(S.sheets).find(x => x.source && sh.source && x.source.playerId && x.source.playerId === sh.source.playerId && canEditSheet(x));
    const add = (replaceId) => {
      if (replaceId) { const ex = S.sheets[replaceId]; sh.id = replaceId; sh.ownerId = ex.ownerId; if (!sh.portrait) sh.portrait = ex.portrait; }
      else { sh.id = undefined; sh.ownerId = me.id; }
      request({ type: 'sheet.upsert', sheet: sh }); closeModal(); toast(sh.name + (replaceId ? ' updated' : ' added') + '!'); selectTab('sheets');
    };
    m.append(el('div', { class: 'row' }, el('div', { class: 'grow' }),
      existing ? el('button', { class: 'primary', text: 'Update ' + existing.name, onclick: () => add(existing.id) }) : null,
      el('button', { class: existing ? '' : 'primary', text: existing ? 'Add as a new character' : 'Add to game', onclick: () => add(null) })));
  }
  function checkPendingImport() {
    const p = LS.get('nct-pending-import', null);
    if (p && Date.now() - p.at < 3 * 3600e3 && S) handleIncomingCharacter(p.obj); else if (p) LS.del('nct-pending-import');
  }
  // other tabs (the import window) talk to this one
  let bc = null; try { bc = new BroadcastChannel('nct-import'); } catch (e) { }
  const TAB_ID = N.uid(8); let offeredImport = null;
  if (bc) bc.onmessage = e => {
    const d = e.data; if (!d) return;
    if (d.kind === 'character' && S) { // offer to take it; the tab the person is looking at answers first
      setTimeout(() => bc.postMessage({ kind: 'offer', importId: d.importId, tab: TAB_ID }), document.visibilityState === 'visible' ? 0 : 300);
      offeredImport = d;
    } else if (d.kind === 'taken' && offeredImport && d.importId === offeredImport.importId) {
      const mine = d.tab === TAB_ID; const obj = offeredImport.obj; offeredImport = null;
      if (mine) { handleIncomingCharacter(obj); window.focus(); }
    }
  };
  window.addEventListener('storage', e => { if (e.key === 'nct-pending-import' && e.newValue && S && !bc) checkPendingImport(); });

  // the little window the bookmark opens
  function runImportReceiver() {
    $('#home').classList.add('hidden'); $('#table').classList.add('hidden'); $('#importscreen').classList.remove('hidden');
    $('#impText').textContent = 'If nothing happens, go back to cyberpunk2020character.com and click the bookmark again.';
    let done = false;
    window.addEventListener('message', e => {
      const d = e.data; if (!d || d.type !== 'nct-character') return;
      try { e.source && e.source.postMessage({ type: 'nct-ack' }, e.origin === 'null' ? '*' : e.origin); } catch (er) { }
      if (done) return; done = true;
      let name = 'your character'; try { name = N.fromCP2020Site(d.data, {}).name; } catch (er) { }
      LS.set('nct-pending-import', { obj: d, at: Date.now() });
      $('#impTitle').textContent = 'Got ' + name + '!';
      $('#impText').textContent = 'Sending to your game…';
      let acked = false;
      const importId = N.uid(10);
      if (bc) { bc.onmessage = ev => { if (ev.data && ev.data.kind === 'offer' && ev.data.importId === importId && !acked) { bc.postMessage({ kind: 'taken', importId, tab: ev.data.tab }); acked = true; LS.del('nct-pending-import'); $('#impTitle').textContent = name + ' is in your game ✓'; $('#impText').textContent = 'Switch back to your Night City Table tab. You can close this one.'; setTimeout(() => { try { window.close(); } catch (er) { } }, 2500); } }; bc.postMessage({ kind: 'character', obj: d, importId }); }
      setTimeout(() => {
        if (acked) return;
        $('#impText').textContent = '';
        $('#impText').append("Your game isn't open in another tab, so it's saved for later. It will pop up as soon as you open or join your game. ",
          el('button', { class: 'primary', text: 'Open Night City Table', onclick: () => { location.href = location.pathname; } }));
      }, 1500);
    });
  }

/*FEATURES*/
  // ================= INSTALL AS AN APP =================
  let installEvt = null;
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  function updateInstallBar() {
    const bar = $('#installBar'); if (!bar) return;
    if (DESKTOP) {
      const u = window.nctDesktop.getUpdate();
      if (u && u.available) { bar.classList.remove('hidden'); $('#installBar b').textContent = 'Update available: version ' + u.version; $('#installSub').textContent = "You have version " + window.nctDesktop.version + ". Download the new one and install it over this one. Your games are kept."; $('#installBtn').textContent = window.nctDesktop.canAutoUpdate ? 'Update now' : 'Download update'; if (window.nctDesktop.canAutoUpdate) $('#installSub').textContent = 'You have version ' + window.nctDesktop.version + '. One click and it updates and reopens. Your games are kept.'; }
      else bar.classList.add('hidden');
      return;
    }
    if (!ONLINE || standalone() || LS.get('nct-installed', false)) { bar.classList.add('hidden'); return; }
    bar.classList.remove('hidden');
    $('#installBtn').textContent = installEvt ? 'Install app' : 'How to install';
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; updateInstallBar(); });
  window.addEventListener('appinstalled', () => { installEvt = null; LS.set('nct-installed', true); updateInstallBar(); toast('Installed! Open Night City Table from your desktop or Start menu / Applications.'); });
  $('#installBtn').onclick = async () => {
    if (DESKTOP) { if (window.nctDesktop.canAutoUpdate) startUpdate(); else window.nctDesktop.openExternal(window.nctDesktop.getUpdate().url); return; }
    if (installEvt) { installEvt.prompt(); const r = await installEvt.userChoice; if (r && r.outcome === 'accepted') { LS.set('nct-installed', true); } installEvt = null; updateInstallBar(); return; }
    const ua = navigator.userAgent; const m = modal('Install Night City Table');
    const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua);
    const isFirefox = /Firefox/.test(ua);
    const steps = isIOS ? ['Tap the Share button (the square with an arrow).', "Tap 'Add to Home Screen', then 'Add'."]
      : isSafari ? ["In the menu bar, choose File → 'Add to Dock…'.", "Click 'Add'. Night City Table now has its own icon in your Dock."]
      : isFirefox ? ["Firefox can't install web apps on computers. Open this same page in Chrome or Microsoft Edge (Edge comes with Windows) and click 'Install app' there."]
      : ['Look for the install icon (a small screen with a down-arrow) at the right end of the address bar, and click it.', "Or open the browser menu (⋮) → 'Cast, save and share' → 'Install page as app' (Chrome), or '…' → Apps → 'Install this site as an app' (Edge)."];
    m.append(el('ol', { class: 'steps' }, ...steps.map(t => el('li', { text: t }))),
      el('p', { class: 'dim', text: "Once it's installed, open it like any other app. Your games are kept, and it updates itself whenever the online version changes." }),
      el('div', { class: 'row' }, el('div', { class: 'grow' }), el('button', { class: 'ghost', text: 'Already installed, hide this', onclick: () => { LS.set('nct-installed', true); updateInstallBar(); closeModal(); } })));
  };
  function startUpdate() {
    const go = () => saveNow().then(() => {
      if (role === 'host' && S) LS.set('nct-resume-host', { id: S.id, at: Date.now() });
      const m = modal('Updating Night City Table');
      const bar = el('div', { style: 'height:10px;background:var(--cyan);width:0%;box-shadow:0 0 10px var(--cyan);transition:width .2s' });
      const txt = el('p', { class: 'dim', text: 'Downloading the new version…' });
      m.append(txt, el('div', { style: 'background:#0a0f1c;border:1px solid var(--line);border-radius:4px;overflow:hidden' }, bar),
        el('p', { class: 'dim', style: 'font-size:14px', text: 'The app closes, installs the update and opens again by itself. Your games are kept.' }));
      $('#overlay .x').remove();
      window.nctDesktop.installUpdate(p => { bar.style.width = p + '%'; txt.textContent = p >= 100 ? 'Installing… the app will reopen in a moment.' : 'Downloading the new version… ' + p + '%'; })
        .catch(err => {
          closeModal();
          const f = modal("The update didn't finish");
          f.append(el('p', { class: 'dim', text: (err && err.message ? err.message + '. ' : '') + 'You can download it yourself instead. Your games are safe.' }),
            el('div', { class: 'row' }, el('div', { class: 'grow' }), el('button', { class: 'primary', text: 'Open download page', onclick: () => { window.nctDesktop.openExternal(window.nctDesktop.getUpdate().url); closeModal(); } })));
        });
    });
    if (role === 'host' && net.conns.size) askConfirm('Update now?', 'The app restarts to update, so your players will be disconnected for about a minute. Your game reopens by itself and they reconnect automatically.', 'Update now', go);
    else go();
  }
  if (DESKTOP) {
    window.nctDesktop.onUpdate(() => { updateInstallBar(); if (S) toast('A new version of Night City Table is available. Update from the home screen.'); });
    if (window.nctDesktop.onCloseRequested) window.nctDesktop.onCloseRequested(() => { // the window's close button (Rust app)
      const close = () => saveNow().then(() => window.nctDesktop.closeNow());
      if (role === 'host' && net.conns.size) askConfirm('Close Night City Table?', 'Players are connected to your game. They will be disconnected until you open it again. Your game is saved.', 'Close anyway', close);
      else close();
    });
    let lastClip = '';
    window.addEventListener('focus', async () => { // character copied by the bookmark button → offer it
      try { const t = await window.nctDesktop.readClipboard(); if (!t || !t.startsWith('NCT1:')) return; let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; h = String(h) + ':' + t.length; if (h === lastClip || h === LS.get('nct-last-clip', '')) return; lastClip = h; LS.set('nct-last-clip', h); handleIncomingCharacter(JSON.parse(t.slice(5))); } catch (e) { }
    });
  }
  if (ONLINE && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });

  if (DESKTOP && window.nctDesktop.onSiteCharacter) window.nctDesktop.onSiteCharacter(txt => { try { handleIncomingCharacter(JSON.parse(txt)); } catch (e) { toast("That character couldn't be read", true); } });

  // ================= START =================
  function start() {
    updateInstallBar();
    const h = location.hash;
    if (h.startsWith('#import')) return runImportReceiver();
    showHome();
    const j = h.match(/join=([A-Za-z0-9]+)/), ho = h.match(/host=([A-Za-z0-9]+)/);
    if (j) { $('#joinCode').value = j[1]; if (me.name) joinGame(j[1]); else { toast("Type your name, then press 'Join game'"); $('#myName').focus(); } }
    else if (ho) DB.get(ho[1]).then(g => { if (g && me.name) hostGame(g); }).catch(() => { });
    else { const r = LS.get('nct-resume-host', null); LS.del('nct-resume-host'); if (r && Date.now() - r.at < 15 * 60e3) DB.get(r.id).then(g => { if (g && me.name) { hostGame(g); toast('Updated! Your game is open again.'); } }).catch(() => { }); }
  }
  start();
})();
