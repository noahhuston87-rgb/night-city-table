/* Runs ON cyberpunk2020character.com when the player clicks the bookmark.
   Must be self-contained: it is serialized with Function.prototype.toString. */
function nctGrab(APP) {
  var UI_ID = 'nct-grab-ui';
  function ui(html, keep) {
    var d = document.getElementById(UI_ID);
    if (!d) { d = document.createElement('div'); d.id = UI_ID; document.body.appendChild(d); }
    d.setAttribute('style', 'position:fixed;z-index:2147483647;right:16px;bottom:16px;max-width:420px;background:#0b0f1a;color:#e8f9ff;border:2px solid #05d9e8;box-shadow:0 0 24px #05d9e8;padding:14px 16px;font:14px/1.4 system-ui,sans-serif;border-radius:6px');
    d.innerHTML = '<div style="font-weight:700;color:#ff2a6d;margin-bottom:6px">NIGHT CITY TABLE</div>' + html + '<div style="text-align:right;margin-top:8px"><button id="nct-x" style="background:#05d9e8;color:#000;border:0;padding:4px 10px;border-radius:3px;cursor:pointer">Close</button></div>';
    document.getElementById('nct-x').onclick = function () { d.remove(); };
    if (!keep) setTimeout(function () { if (d.parentNode) d.remove(); }, 9000);
    return d;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  if (!/cyberpunk2020character\.com$/.test(location.hostname)) {
    ui('Open your character on <b>cyberpunk2020character.com</b> first, then click this bookmark again.', true); return;
  }
  var m = location.pathname.match(/\/(?:character|player)\/([^\/?#]+)/);
  var playerId = m ? m[1] : (sessionStorage.getItem('playerId') || '');

  function score(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return 0;
    var a = o.attributes; if (!a || typeof a !== 'object' || !('REF' in a || 'BODY' in a || 'INT' in a)) return 0;
    var s = 5; if (o.skills) s += 2; if ('humanity' in o) s++; if (o.cyberware) s++; if (o.name) s++; if ('woundDamage' in o) s++; if (o.inventory) s++;
    return s;
  }
  function fromReact() {
    var els = [document.getElementById('root')].concat([].slice.call(document.querySelectorAll('body *'), 0, 400));
    var fiber = null;
    for (var i = 0; i < els.length && !fiber; i++) {
      var el = els[i]; if (!el) continue;
      var ks = Object.keys(el);
      for (var j = 0; j < ks.length; j++) if (ks[j].indexOf('__reactContainer$') === 0 || ks[j].indexOf('__reactFiber$') === 0) { fiber = el[ks[j]]; break; }
    }
    if (!fiber) return null;
    if (fiber.stateNode && fiber.stateNode.current) fiber = fiber.stateNode.current;
    var top = fiber, g = 0; while (top.return && g++ < 5000) top = top.return;
    var best = null, bestS = 0, stack = [top], n = 0;
    while (stack.length && n++ < 80000) {
      var f = stack.pop(); var c = [];
      if (f.memoizedProps) { c.push(f.memoizedProps.character, f.memoizedProps.player); }
      var h = f.memoizedState, k = 0;
      while (h && typeof h === 'object' && k++ < 300) { c.push(h.memoizedState); if (h.memoizedState && typeof h.memoizedState === 'object') c.push(h.memoizedState.current); if (!('next' in h)) { c.push(h); break; } h = h.next; }
      for (var q = 0; q < c.length; q++) { var sc = score(c[q]); if (sc > bestS) { bestS = sc; best = c[q]; } }
      if (f.sibling) stack.push(f.sibling); if (f.child) stack.push(f.child);
    }
    return best;
  }
  // Fallback: ask the site's own server, using this browser's session (socket.io long-polling)
  function fromServer() {
    var sessionId = sessionStorage.getItem('sessionId'), tok = sessionStorage.getItem('playerToken'), gm = sessionStorage.getItem('gmToken'), isGM = sessionStorage.getItem('isGM') === 'true';
    if (!sessionId) { try { var L = JSON.parse(localStorage.getItem('lastPlayerSession') || 'null'); if (L) { sessionId = L.sessionId; tok = L.playerToken; playerId = playerId || L.playerId; } } catch (e) { } }
    if (!sessionId || !(tok || gm)) return Promise.resolve(null);
    var base = '/socket.io/?EIO=4&transport=polling', url;
    var get = function () { return fetch(url + '&t=' + Date.now()).then(function (r) { return r.text(); }); };
    var post = function (b) { return fetch(url + '&t=' + Date.now(), { method: 'POST', body: b, headers: { 'Content-Type': 'text/plain;charset=UTF-8' } }); };
    var found = null, merged = {};
    function take(ev, d) {
      if (!d) return;
      if (ev === 'character:data' && (d.playerId == playerId || d.id == playerId)) { for (var k in d) merged[k] = d[k]; if (score(merged)) found = merged; }
      var list = d.players || (d.gameState && d.gameState.players) || (Array.isArray(d) ? d : null);
      if (list) for (var i = 0; i < list.length; i++) if (list[i] && list[i].id == playerId) { for (var k2 in list[i]) if (!(k2 in merged)) merged[k2] = list[i][k2]; if (score(merged)) found = merged; }
    }
    function poll(left) {
      if (found || left <= 0) return Promise.resolve(found);
      return get().then(function (txt) {
        var pk = txt.split('\x1e'), pong = false;
        for (var i = 0; i < pk.length; i++) {
          var p = pk[i];
          if (p === '2') pong = true;
          else if (p.indexOf('42') === 0) { try { var a = JSON.parse(p.slice(2).replace(/^\d+/, '')); take(a[0], a[1]); } catch (e) { } }
        }
        return (pong ? post('3') : Promise.resolve()).then(function () { return poll(left - 1); });
      });
    }
    return fetch(base + '&t=' + Date.now()).then(function (r) { return r.text(); }).then(function (t) {
      var sid = JSON.parse(t.slice(t.indexOf('{'))).sid; url = base + '&sid=' + encodeURIComponent(sid);
      return post('40');
    }).then(get).then(function () {
      return post('420' + JSON.stringify(['session:join', { sessionId: sessionId, token: isGM ? gm : tok, isGM: isGM }]));
    }).then(function () {
      return post('42' + JSON.stringify(['character:request', { sessionId: sessionId, playerId: playerId }]));
    }).then(function () { return poll(12); }).catch(function () { return null; });
  }

  ui('Reading your character…', true);
  function fromCapture() {
    var cap = window.__nctCap; if (!cap || !cap.chars) return null;
    if (playerId && cap.chars[playerId] && score(cap.chars[playerId])) return cap.chars[playerId];
    var best = null, bs = 0; for (var k in cap.chars) { var sc = score(cap.chars[k]); if (sc > bs) { bs = sc; best = cap.chars[k]; } }
    return best;
  }
  var ch = fromCapture() || fromReact();
  (ch ? Promise.resolve(ch) : fromServer()).then(function (c) {
    if (!c) { ui('Couldn\'t find a character on this page. Open your character sheet on this site (so you can see your stats), then click the bookmark again.', true); return; }
    var data = JSON.parse(JSON.stringify(c, function (k, v) { return (typeof v === 'string' && v.length > 1048576) ? undefined : v; }));
    if (!data.id && playerId) data.id = playerId;
    var payload = { type: 'nct-character', v: 1, playerId: playerId || data.id || null, data: data, from: location.href };
    var text = 'NCT1:' + JSON.stringify(payload);
    var copied = false;
    try { navigator.clipboard.writeText(text).then(function () { copied = true; }, function () { }); } catch (e) { }
    var name = esc(data.name || 'your character');
    if (APP === '@desktop') { // the Night City Table app's own import window picks this up
      location.href = 'https://nct-import.local/?d=' + encodeURIComponent(JSON.stringify(payload));
      ui('<b>' + name + '</b> sent to Night City Table ✓ You can close this window, or send another character.', true); return;
    }
    if (/^http:\/\/127\.0\.0\.1:/.test(APP)) { // the Night City Table app on this computer receives it directly
      var target = APP + 'import?d=' + encodeURIComponent(JSON.stringify(payload));
      if (target.length > 2000000 && data.portrait) { delete data.portrait; payload.data = data; target = APP + 'import?d=' + encodeURIComponent(JSON.stringify(payload)); } // browsers cap links near 2 MB
      var send = function () { var ww = null; try { ww = window.open(target, 'nct_import', 'width=480,height=320'); } catch (e) { } return ww; };
      if (send()) { ui('<b>' + name + '</b> sent to Night City Table ✓ Switch to the app: it pops up there.<br><span style="color:#8aa0c2">Nothing there? Make sure the Night City Table app is open, then click the bookmark again.</span>', true); return; }
      var dd = ui('Found <b>' + name + '</b>.<br><button id="nct-go" style="margin-top:8px;width:100%;background:#ff2a6d;color:#fff;border:0;padding:10px;border-radius:4px;font-weight:700;cursor:pointer">SEND TO NIGHT CITY TABLE</button><div style="color:#8aa0c2;margin-top:6px">The Night City Table app must be open.</div>', true);
      dd.querySelector('#nct-go').onclick = function () { send(); ui('<b>' + name + '</b> sent to Night City Table ✓ Switch to the app: it pops up there.', true); };
      return;
    }
    if (!APP) { ui('<b>' + name + '</b> copied! Switch to the Night City Table app and it pops up by itself. (If it doesn\'t: Sheets → Import → <b>Paste</b>.)', true); return; }
    var w = null; try { w = window.open(APP + '#import', 'nct_import'); } catch (e) { }
    if (!w) {
      var d = ui('Pop-up was blocked. <b>' + name + '</b> was copied instead — in Night City Table go to Sheets → Import → <b>Paste</b>.<br><textarea style="width:100%;height:60px;margin-top:6px;background:#000;color:#0f0" readonly></textarea>', true);
      d.querySelector('textarea').value = text; return;
    }
    var origin = '*'; try { origin = new URL(APP).origin; } catch (e) { }
    var tries = 0, iv = setInterval(function () { try { w.postMessage(payload, origin); } catch (e) { } if (++tries > 80) clearInterval(iv); }, 250);
    window.addEventListener('message', function (e) { if (e.data && e.data.type === 'nct-ack') { clearInterval(iv); ui('<b>' + name + '</b> sent to Night City Table ✓'); } });
    ui('Sending <b>' + name + '</b> to Night City Table…');
  });
}

/* Runs in the desktop app's import window before the site loads: records character data the site receives
   from its own server, and adds a bar with a button to send the character to Night City Table. */
function nctSiteHelper() {
  if (window.__nctCap) return;
  var cap = window.__nctCap = { chars: {} };
  function add(o) { if (o && o.id != null && (o.attributes || o.skills)) cap.chars[o.id] = Object.assign(cap.chars[o.id] || {}, o); }
  function take(ev, d) {
    try {
      if (!d) return;
      if (ev === 'character:data') { var id = d.playerId != null ? d.playerId : d.id; if (id != null) cap.chars[id] = Object.assign(cap.chars[id] || {}, d, { id: id }); }
      if (ev === 'player:field_update' && d.playerId != null && d.fields) { cap.chars[d.playerId] = Object.assign(cap.chars[d.playerId] || { id: d.playerId }, d.fields); }
      var list = d.players || (d.gameState && d.gameState.players) || (d.newState && d.newState.players) || (Array.isArray(d) ? d : null);
      if (list) for (var i = 0; i < list.length; i++) add(list[i]);
    } catch (e) { }
  }
  function parse(txt) { if (typeof txt !== 'string') return; var ps = txt.split('\x1e'); for (var i = 0; i < ps.length; i++) { var p = ps[i]; if (p.indexOf('42') === 0) { try { var a = JSON.parse(p.slice(2).replace(/^\d+/, '')); take(a[0], a[1]); } catch (e) { } } } }
  var WS = window.WebSocket;
  var Wrapped = function (u, pr) { var ws = pr !== undefined ? new WS(u, pr) : new WS(u); ws.addEventListener('message', function (e) { parse(e.data); }); return ws; };
  Wrapped.prototype = WS.prototype; Wrapped.CONNECTING = 0; Wrapped.OPEN = 1; Wrapped.CLOSING = 2; Wrapped.CLOSED = 3; window.WebSocket = Wrapped;
  var open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u) { var x = this; if (String(u).indexOf('/socket.io/') >= 0) x.addEventListener('load', function () { try { parse(x.responseText); } catch (e) { } }); return open.apply(this, arguments); };
  var f = window.fetch;
  window.fetch = function (input) { var u = String(input && input.url || input); return f.apply(this, arguments).then(function (r) { if (u.indexOf('/socket.io/') >= 0) { try { r.clone().text().then(parse); } catch (e) { } } return r; }); };
  function bar() {
    if (document.getElementById('nct-bar')) return;
    var b = document.createElement('div'); b.id = 'nct-bar';
    b.setAttribute('style', 'position:fixed;left:0;right:0;top:0;z-index:2147483646;display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:8px 12px;background:#000;border-bottom:2px solid #ff2a6d;box-shadow:0 0 18px #ff2a6d;font:14px system-ui,sans-serif;color:#e6f4ff');
    b.innerHTML = '<b style="color:#ff2a6d">NIGHT CITY TABLE IMPORT</b><span style="opacity:.8">Open your character on this site (use your normal link), then:</span>' +
      '<button id="nct-send" style="background:#ff2a6d;color:#fff;border:0;padding:7px 14px;font-weight:700;cursor:pointer">SEND MY CHARACTER</button>' +
      '<span style="flex:1"></span><input id="nct-url" placeholder="Paste a link from the site (join / character link)" style="width:300px;background:#111;color:#fff;border:1px solid #555;padding:5px"><button id="nct-go" style="background:#222;color:#fff;border:1px solid #555;padding:6px 10px;cursor:pointer">GO</button>';
    document.body.appendChild(b); document.body.style.marginTop = (b.offsetHeight + 4) + 'px';
    document.getElementById('nct-send').onclick = function () { nctGrab('@desktop'); };
    document.getElementById('nct-go').onclick = function () { var u = document.getElementById('nct-url').value.trim(); if (/^https:\/\/(www\.)?cyberpunk2020character\.com\//.test(u)) location.href = u; else alert('Paste a link that starts with https://cyberpunk2020character.com/'); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bar); else bar();
  setInterval(bar, 1500);
}
