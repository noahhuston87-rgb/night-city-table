  // ================= THEMES & SETTINGS (look of cyberpunk2020character.com) =================
  const BASIC_THEMES = {
    'retro-green': { p: '#00ff00', s: '#00aa00', d: '#004400', bg: '#0d1a0d', label: 'TERMINAL GREEN' },
    'neon-amber': { p: '#ffaa00', s: '#aa7700', d: '#443300', bg: '#1a150d', label: 'B33H1VE' },
    'cyber-cyan': { p: '#00ffff', s: '#00aaaa', d: '#004444', bg: '#0d1a1a', label: 'CYBER CYAN' },
    'retro-red': { p: '#ff3333', s: '#aa2222', d: '#440000', bg: '#1a0d0d', label: 'BLEEDING EDGE' },
    'neon-purple': { p: '#cc66ff', s: '#9944cc', d: '#330044', bg: '#150d1a', label: 'NEON NIGHTS' },
    'retro-blue': { p: '#3399ff', s: '#2266aa', d: '#002244', bg: '#0d121a', label: 'ELECTRIC BLUE' },
    'clean-white': { p: '#ffffff', s: '#aaaaaa', d: '#444444', bg: '#1a1a1a', label: 'CLEAN WHITE' },
    'hot-pink': { p: '#ff69b4', s: '#cc5599', d: '#441133', bg: '#1a0d15', label: 'HOT PINK' },
    'toxic-yellow': { p: '#ffff00', s: '#aaaa00', d: '#444400', bg: '#1a1a0d', label: 'TOXIC YELLOW' },
    'matrix-green': { p: '#39ff14', s: '#2eb810', d: '#1a4d0a', bg: '#0a1a05', label: 'MATRIX' }
  };
  const CUSTOM_THEMES = {
    'night-city-neon': { p: '#ff00ff', s: '#00ffff', t: '#ffff00', d: '#1a0033', bg: '#0a0014', label: 'NIGHT CITY NEON' },
    'arasaka-corporate': { p: '#ff0040', s: '#ffffff', t: '#cccccc', d: '#330011', bg: '#0d0005', label: 'ARASAKA CORP' },
    'militech-tactical': { p: '#00ff00', s: '#ff6600', t: '#ffcc00', d: '#1a2200', bg: '#0a0f05', label: 'MILITECH OPS' },
    'netrunner-ice': { p: '#00ffff', s: '#0088ff', t: '#ffffff', d: '#002244', bg: '#000a14', label: 'NETRUNNER ICE' },
    'trauma-team': { p: '#ff3333', s: '#ffffff', t: '#00ff00', d: '#440000', bg: '#0f0505', label: 'TRAUMA TEAM' },
    'johnny-silverhand': { p: '#ffaa00', s: '#ff3333', t: '#ffffff', d: '#332200', bg: '#0f0a00', label: 'SILVERHAND' },
    'maelstrom-chrome': { p: '#ff3300', s: '#cccccc', t: '#ff0000', d: '#331100', bg: '#0a0500', label: 'MAELSTROM' },
    'tyger-claws': { p: '#ff66ff', s: '#00ff88', t: '#ffff00', d: '#330033', bg: '#0a000a', label: 'TYGER CLAWS' },
    'valentinos': { p: '#ff0066', s: '#ffcc00', t: '#ffffff', d: '#330022', bg: '#0f0008', label: 'VALENTINOS' },
    'voodoo-boys': { p: '#00ffaa', s: '#ff00ff', t: '#ffff00', d: '#003322', bg: '#000a08', label: 'VOODOO BOYS' },
    '6th-street': { p: '#ff6600', s: '#3366ff', t: '#ffffff', d: '#332200', bg: '#0a0500', label: '6TH STREET' },
    'synthwave-sunset': { p: '#ff6699', s: '#9933ff', t: '#ffcc00', d: '#330033', bg: '#0a0010', label: 'SYNTHWAVE' }
  };
  const SET_DEFAULT = { theme: 'retro-green', custom: { p: '#00ff00', s: '#00aa00', t: '#ffff00', d: '#004400', bg: '#0d1a0d' }, fontSize: 16, font: 'terminal', glow: true, crt: false, grid: true, round: false, side: 400, followDM: true };
  let settings = Object.assign({}, SET_DEFAULT, LS.get('nct-settings', {}));
  let TH = { p: '#00ff00', s: '#00aa00', t: '#ffff00', d: '#004400', bg: '#0d1a0d' };
  const saveSettings = () => LS.set('nct-settings', settings);
  function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function currentTheme() {
    if (S && S.theme && settings.followDM && !isGM()) return S.theme;
    if (settings.theme === 'custom') return settings.custom;
    return BASIC_THEMES[settings.theme] || CUSTOM_THEMES[settings.theme] || BASIC_THEMES['retro-green'];
  }
  function applyTheme() {
    const t = currentTheme();
    TH = { p: t.p, s: t.s || t.p, t: t.t || '#ffff00', d: t.d || '#004400', bg: t.bg || '#0d1a0d' };
    const r = document.documentElement.style;
    r.setProperty('--p', TH.p); r.setProperty('--s', TH.s); r.setProperty('--t', TH.t); r.setProperty('--d', TH.d); r.setProperty('--bg', TH.bg);
    r.setProperty('--glow', hexA(TH.p, 0.4)); r.setProperty('--fs', settings.fontSize + 'px'); r.setProperty('--side', settings.side + 'px');
    const b = document.body.classList;
    b.toggle('clean-font', settings.font === 'clean'); b.toggle('no-glow', !settings.glow); b.toggle('crt', !!settings.crt); b.toggle('gridbg', !!settings.grid); b.toggle('round', !!settings.round);
    const mc = document.querySelector('meta[name=theme-color]'); if (mc) mc.setAttribute('content', TH.bg);
    if (!$('#table').classList.contains('hidden')) resizeCanvas();
  }
  function openSettings(tab) {
    const m = modal('Customization', true); m.classList.add('frame');
    const tabs = ['Themes', 'Create your own', 'Display']; tab = tab || 'Themes';
    m.append(el('div', { class: 'stabs' }, ...tabs.map(t => el('button', { class: t === tab ? 'on' : '', text: t, onclick: () => openSettings(t) }))));
    const set = (patch, followOff) => { Object.assign(settings, patch); if (followOff) settings.followDM = false; saveSettings(); applyTheme(); openSettings(tab); };
    if (tab === 'Themes') {
      if (S && isGM()) m.append(el('div', { class: 'sharebox' }, 'Your look is saved on this computer. Share it to make it the look for everyone at the table (players can still pick their own).',
        el('div', { class: 'row', style: 'margin-top:8px' }, el('button', { class: 'primary grow', text: 'Share theme with players', onclick: () => { request({ type: 'meta', theme: currentTheme() }); toast('Theme shared with players'); } }),
          S.theme ? el('button', { text: 'Stop sharing', onclick: () => { request({ type: 'meta', theme: null }); toast('Players see their own themes again'); } }) : null)));
      if (S && !isGM() && S.theme) m.append(el('div', { class: 'sharebox' }, el('label', { class: 'row' }, el('input', { type: 'checkbox', checked: settings.followDM, onchange: e => set({ followDM: e.target.checked }) }), "Use the DM's theme for this game")));
      const active = !(S && S.theme && settings.followDM && !isGM()) ? settings.theme : null;
      m.append(el('label', { text: 'Basic colors' }), el('div', { class: 'basicthemes' }, ...Object.entries(BASIC_THEMES).map(([k, t]) =>
        el('button', { class: k === active ? 'on' : '', style: 'color:' + t.p + ';border-color:' + t.p + (k === active ? ';background:' + hexA(t.p, 0.15) : ''), text: t.label, onclick: () => set({ theme: k }, true) }))));
      m.append(el('label', { text: 'Custom themes' }), el('div', { class: 'customthemes' }, ...Object.entries(CUSTOM_THEMES).map(([k, t]) =>
        el('button', { class: 'tcard' + (k === active ? ' on' : ''), style: 'color:' + t.p + ';border-color:' + hexA(t.p, k === active ? 1 : 0.4) + ';background:' + (k === active ? hexA(t.p, 0.12) : t.bg), onclick: () => set({ theme: k }, true) },
          t.label, el('div', { class: 'sw' }, ...[t.p, t.s, t.t].map(c => el('i', { style: 'background:' + c })))))));
    } else if (tab === 'Create your own') {
      const c = Object.assign({}, settings.custom);
      const pick = (k, label) => el('div', { class: 'setrow' }, el('span', { text: label }), el('input', { type: 'color', value: c[k], oninput: e => { c[k] = e.target.value; settings.custom = Object.assign({}, c); settings.theme = 'custom'; settings.followDM = false; saveSettings(); applyTheme(); } }));
      m.append(el('p', { class: 'dim', text: 'Pick your own colours. Changes show right away.' }),
        pick('p', 'Main colour (text, borders, glow)'), pick('s', 'Second colour (buttons, highlights)'), pick('t', 'Accent (criticals, warnings)'), pick('bg', 'Background tint'), pick('d', 'Dim colour (empty bars)'),
        el('div', { class: 'row' }, el('button', { text: 'Start from current theme', onclick: () => { settings.custom = Object.assign({}, TH); set({ theme: 'custom' }, true); } })));
    } else {
      const row = (label, ctrl) => el('div', { class: 'setrow' }, el('span', { text: label }), ctrl);
      m.append(
        row('Text size: ' + settings.fontSize + 'px', el('input', { type: 'range', min: 12, max: 22, step: 1, value: settings.fontSize, onchange: e => set({ fontSize: Number(e.target.value) }) })),
        row('Font', el('select', { onchange: e => set({ font: e.target.value }) }, el('option', { value: 'terminal', text: 'Terminal (like the character site)', selected: settings.font === 'terminal' }), el('option', { value: 'clean', text: 'Clean (easier to read)', selected: settings.font === 'clean' }))),
        row('Glow effects', el('input', { type: 'checkbox', checked: settings.glow, onchange: e => set({ glow: e.target.checked }) })),
        row('CRT scanlines', el('input', { type: 'checkbox', checked: settings.crt, onchange: e => set({ crt: e.target.checked }) })),
        row('Grid background', el('input', { type: 'checkbox', checked: settings.grid, onchange: e => set({ grid: e.target.checked }) })),
        row('Rounded corners', el('input', { type: 'checkbox', checked: settings.round, onchange: e => set({ round: e.target.checked }) })),
        row('Side panel width: ' + settings.side + 'px (or drag its edge)', el('input', { type: 'range', min: 300, max: 760, step: 10, value: settings.side, onchange: e => set({ side: Number(e.target.value) }) })),
        el('div', { class: 'row', style: 'margin-top:12px' }, el('div', { class: 'grow' }), el('button', { class: 'danger', text: 'Reset everything', onclick: () => { settings = Object.assign({}, SET_DEFAULT); saveSettings(); applyTheme(); openSettings(tab); } })));
    }
  }
  $('#settingsBtn').onclick = () => openSettings();
  $('#homeSettings').onclick = () => openSettings();
  // drag the edge of the side panel to resize it
  (function () {
    const sp = $('#splitter'); let drag = null;
    sp.addEventListener('pointerdown', e => { drag = { x: e.clientX, w: settings.side }; sp.setPointerCapture(e.pointerId); });
    sp.addEventListener('pointermove', e => { if (!drag) return; settings.side = Math.max(300, Math.min(Math.round(innerWidth * 0.7), drag.w - (e.clientX - drag.x))); document.documentElement.style.setProperty('--side', settings.side + 'px'); resizeCanvas(); });
    sp.addEventListener('pointerup', () => { if (drag) { drag = null; saveSettings(); } });
  })();

  // ================= MUSIC & SOUND =================
  const vol = Object.assign({ music: 0.8, sfx: 0.9, mute: false }, LS.get('nct-vol', {}));
  const musicEl = new Audio(); musicEl.preload = 'auto';
  const srcCache = new Map(); // track id -> playable url
  let audioBlocked = false;
  function dataToBlobUrl(data) {
    const [head, b64] = String(data).split(','); const mime = (head.match(/data:([^;]+)/) || [])[1] || 'audio/mpeg';
    const bin = atob(b64); const arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([arr], { type: mime }));
  }
  async function trackSrc(track) {
    if (!track) return null;
    if (track.url) return track.url;
    if (srcCache.has(track.id)) return srcCache.get(track.id);
    let data = null;
    try { const rec = await DB.get(track.id, role === 'host' ? 'audio' : 'audiocache'); data = rec && rec.data; } catch (e) { }
    if (!data && role === 'client' && net.conn && net.conn.open) {
      data = await new Promise(res => { audioWaiters.set(track.id, res); net.conn.send({ t: 'audio.get', id: track.id }); setTimeout(() => { if (audioWaiters.has(track.id)) { audioWaiters.delete(track.id); res(null); } }, 120000); });
      if (data) DB.put({ id: track.id, data, at: Date.now() }, 'audiocache').catch(() => { });
    }
    if (!data) return null;
    const u = dataToBlobUrl(data); srcCache.set(track.id, u); return u;
  }
  function tryPlay(a) { const p = a.play(); if (p && p.catch) p.catch(() => { audioBlocked = true; renderNowPlaying(); }); }
  // ---- YouTube and Spotify links: played through their own embedded players ----
  function streamKind(u) {
    u = String(u || '');
    let x = u.match(/(?:youtube\.com\/(?:watch\?[^#]*v=|embed\/|shorts\/|live\/)|youtu\.be\/|music\.youtube\.com\/watch\?[^#]*v=)([\w-]{11})/);
    const list = (u.match(/[?&]list=([\w-]+)/) || [])[1];
    if (x || (list && /youtube\.com/.test(u))) return { type: 'youtube', id: x ? x[1] : null, list: list || null };
    x = u.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/) || u.match(/^spotify:(track|album|playlist|episode|show|artist):([A-Za-z0-9]+)/);
    if (x) return { type: 'spotify', kind: x[1], id: x[2], uri: 'spotify:' + x[1] + ':' + x[2] };
    return null;
  }
  // Spotify → YouTube, like Discord music bots: read the song names from Spotify, find each on YouTube.
  const canLookup = () => !!(window.nctDesktop && window.nctDesktop.fetchText);
  function parseLen(t) { const p = String(t || '').split(':').map(Number); if (p.some(isNaN)) return 0; return p.reduce((a, x) => a * 60 + x, 0); }
  async function spotifySongs(sk) {
    const html = await window.nctDesktop.fetchText('https://open.spotify.com/embed/' + sk.kind + '/' + sk.id);
    const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!m) throw new Error("Couldn't read that Spotify link");
    const e = JSON.parse(m[1]).props.pageProps.state.data.entity;
    if (Array.isArray(e.trackList) && e.trackList.length) return { name: e.name || e.title || 'Spotify ' + sk.kind, songs: e.trackList.map(t => ({ title: t.title, artist: t.subtitle || '', ms: t.duration || 0 })) };
    const artist = (e.artists || []).map(a => a.name).join(', ');
    return { name: (artist ? artist + ' – ' : '') + (e.title || e.name || 'Song'), songs: [{ title: e.title || e.name, artist, ms: e.duration || 0 }] };
  }
  async function youtubeFind(song) {
    const q = song.title + ' ' + song.artist + ' audio';
    const html = await window.nctDesktop.fetchText('https://www.youtube.com/results?search_query=' + encodeURIComponent(q));
    const parts = html.split('"videoRenderer":{"videoId":"').slice(1, 8);
    const found = parts.map(c => ({ v: c.slice(0, 11), d: parseLen((c.slice(0, 4000).match(/"lengthText":\{[^}]*?\}\},"simpleText":"([\d:]+)"/) || [])[1]) })).filter(x => /^[\w-]{11}$/.test(x.v));
    if (!found.length) return null;
    const want = (song.ms || 0) / 1000;
    if (want) { const close = found.find(x => x.d && Math.abs(x.d - want) <= 20); if (close) return close; }
    return found.find(x => x.d && x.d < 1200) || found[0];
  }
  async function spotifyToYouTube(sk, onProgress) {
    const info = await spotifySongs(sk);
    const songs = info.songs.slice(0, 100), queue = new Array(songs.length).fill(null);
    let next = 0, done = 0;
    const worker = async () => { while (next < songs.length) { const i = next++; try { const r = await youtubeFind(songs[i]); if (r) queue[i] = { v: r.v, d: r.d || Math.round((songs[i].ms || 0) / 1000), n: (songs[i].artist ? songs[i].artist + ' – ' : '') + songs[i].title }; } catch (e) { } onProgress && onProgress(++done, songs.length); } };
    await Promise.all([worker(), worker(), worker(), worker()]);
    return { name: info.name, queue: queue.filter(Boolean), total: songs.length };
  }
  const stream = { key: '', type: '', yt: null, sp: null, box: null, min: LS.get('nct-player-min', false) };
  function loadScriptOnce(src, readyName) {
    window.__nctScripts = window.__nctScripts || {};
    if (!window.__nctScripts[src]) window.__nctScripts[src] = new Promise(res => { const prev = window[readyName]; window[readyName] = function (a) { if (prev) try { prev(a); } catch (e) { } res(a); }; const sc = document.createElement('script'); sc.src = src; sc.async = true; sc.onerror = () => res(null); document.head.appendChild(sc); });
    return window.__nctScripts[src];
  }
  function streamBox() {
    if (stream.box) return stream.box;
    const b = el('div', { id: 'streamplayer', class: stream.min ? 'min' : '' },
      el('div', { class: 'sp-head' }, el('span', { class: 'grow', id: 'spTitle', text: '♪' }),
        isGM() ? el('button', { class: 'small', id: 'spPause', text: '⏸', title: 'Pause for everyone', onclick: () => request({ type: 'music.pause' }) }) : null,
        el('button', { class: 'small ghost', text: '–', title: 'Hide the player (music keeps playing)', onclick: () => { stream.min = true; LS.set('nct-player-min', true); b.classList.add('min'); renderNowPlaying(); } })),
      el('div', { class: 'sp-vol' }, el('span', { text: '🔊' }), el('input', { type: 'range', min: 0, max: 1, step: 0.05, value: vol.music, title: 'Your music volume (only you)', oninput: ev => { vol.music = Number(ev.target.value); LS.set('nct-vol', vol); applyMusic(); } })),
      el('div', { id: 'spSlot' }), el('div', { class: 'sp-shield', title: isGM() ? 'Use ⏸ above, or the Audio tab' : 'Only the DM can pause or change the music. Use 🔊 for your volume.' }));
    document.body.appendChild(b); stream.box = b; return b;
  }
  function showStreamPlayer() { stream.min = false; LS.set('nct-player-min', false); if (stream.box) stream.box.classList.remove('min'); renderNowPlaying(); }
  function stopStream() {
    try { stream.yt && stream.yt.destroy(); } catch (e) { } try { stream.sp && stream.sp.destroy(); } catch (e) { }
    stream.yt = stream.sp = null; stream.key = ''; stream.type = '';
    if (stream.box) { stream.box.remove(); stream.box = null; }
  }
  function streamVolume(m) { return vol.mute ? 0 : Math.round(Math.max(0, Math.min(1, (m.volume ?? 0.6) * vol.music)) * 100); }
  function streamPos(m) { return Math.max(0, (m.offset || 0) + (Date.now() + clockSkew - m.startedAt) / 1000); }
  function watchBlocked(check) { setTimeout(() => { if (!check()) { audioBlocked = true; renderNowPlaying(); } }, 3500); }
  async function playStream(m, sk) {
    const key = m.track.id + '@' + m.startedAt;
    if (stream.key === key) { if (stream.yt && stream.yt.setVolume) { stream.yt.setVolume(streamVolume(m)); vol.mute ? stream.yt.mute() : stream.yt.unMute(); } return; }
    stopStream(); musicEl.pause(); stream.key = key; stream.type = sk.type;
    const b = streamBox(); $('#spTitle', b).textContent = '♪ ' + m.track.name;
    const slot = el('div'); $('#spSlot', b).append(slot);
    b.style.setProperty('--shield-h', (sk.type === 'youtube' ? 158 : (sk.kind === 'track' || sk.kind === 'episode' ? 80 : 152)) + 'px');
    if (sk.type === 'youtube') {
      const YT = await loadScriptOnce('https://www.youtube.com/iframe_api', 'onYouTubeIframeAPIReady').then(() => window.YT);
      if (!YT || !YT.Player || stream.key !== key) { if (!YT) renderNowPlaying("Couldn't reach YouTube"); return; }
      const vars = { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, controls: 0, disablekb: 1, fs: 0, origin: location.origin.startsWith('http') ? location.origin : undefined };
      if (sk.list) { vars.listType = 'playlist'; vars.list = sk.list; vars.loop = 1; }
      const queue = (m.track.queue || []).filter(x => x && x.v);
      // where everyone is in the song list right now
      let qi = 0, qt = streamPos(m);
      if (queue.length > 1) { const total = queue.reduce((a, x) => a + (x.d || 0), 0); if (total > 0) { if (m.loop) qt = qt % total; while (qi < queue.length - 1 && qt >= (queue[qi].d || 0)) { qt -= queue[qi].d || 0; qi++; } } }
      const firstId = queue.length ? queue[qi].v : (sk.id || undefined);
      stream.yt = new YT.Player(slot, { width: 280, height: 158, videoId: firstId, playerVars: vars, events: {
        onReady: e => {
          const p = e.target; p.setVolume(streamVolume(m)); if (vol.mute) p.mute();
          if (queue.length > 1) { p.loadPlaylist(queue.map(x => x.v), qi, Math.max(0, qt)); p.setLoop(!!m.loop); }
          else { const d = p.getDuration() || 0; let t = streamPos(m); if (m.loop && d > 0) t = t % d; if (t > 1) p.seekTo(t, true); p.playVideo(); }
          watchBlocked(() => p.getPlayerState && p.getPlayerState() === 1);
        },
        onStateChange: e => { if (e.data === 2 && S && S.audio.music.playing) { try { e.target.playVideo(); } catch (er) { } }
          if (e.data === 1 && queue.length > 1) { try { const i = e.target.getPlaylistIndex(); if (queue[i]) $('#spTitle', stream.box).textContent = '♪ ' + queue[i].n; } catch (er) { } }
          if (e.data === 0 && m.loop && sk.id && !sk.list && queue.length <= 1) { e.target.seekTo(0, true); e.target.playVideo(); } if (e.data === 1 && audioBlocked) { audioBlocked = false; renderNowPlaying(); } },
        onError: () => renderNowPlaying("YouTube won't play this one here (the owner may block embedding)") } });
    } else {
      const API = await loadScriptOnce('https://open.spotify.com/embed/iframe-api/v1', 'onSpotifyIframeApiReady');
      if (!API || stream.key !== key) { if (!API) renderNowPlaying("Couldn't reach Spotify"); return; }
      let playing = false;
      API.createController(slot, { uri: sk.uri, width: 280, height: sk.kind === 'track' || sk.kind === 'episode' ? 80 : 152 }, c => {
        if (stream.key !== key) { try { c.destroy(); } catch (e) { } return; }
        stream.sp = c;
        c.addListener('playback_update', e => { const d = e.data || {}; if (d.isPaused === false) { playing = true; if (audioBlocked) { audioBlocked = false; renderNowPlaying(); } } if (m.loop && d.duration && d.position >= d.duration - 400 && !d.isPaused) { c.seek(0); } });
        c.addListener('ready', () => { c.play(); const t = streamPos(m); if (t > 2 && (sk.kind === 'track' || sk.kind === 'episode')) setTimeout(() => { try { c.seek(t); } catch (e) { } }, 800); watchBlocked(() => playing); });
      });
    }
    renderNowPlaying();
  }
  function resumeStream() {
    if (stream.yt && stream.yt.playVideo) stream.yt.playVideo();
    if (stream.sp) { try { stream.sp.resume ? stream.sp.resume() : stream.sp.play(); } catch (e) { } showStreamPlayer(); }
  }
  async function applyMusic() {
    if (!S || !S.audio) return;
    const m = S.audio.music;
    musicEl.volume = vol.mute ? 0 : Math.max(0, Math.min(1, (m.volume ?? 0.6) * vol.music));
    if (!m.playing || !m.track) { musicEl.pause(); stopStream(); renderNowPlaying(); return; }
    const sk = streamKind(m.track.url);
    if (sk) { await playStream(m, sk); return; }
    stopStream();
    const src = await trackSrc(m.track);
    if (!src) { renderNowPlaying("Couldn't load " + m.track.name); return; }
    if (S.audio.music !== m) return; // changed while loading
    musicEl.loop = !!m.loop;
    const pos = () => { let t = (m.offset || 0) + (Date.now() + clockSkew - m.startedAt) / 1000; if (m.loop && musicEl.duration > 0 && isFinite(musicEl.duration)) t = t % musicEl.duration; return Math.max(0, t); };
    if (musicEl.dataset.key !== m.track.id + '@' + m.startedAt) {
      musicEl.dataset.key = m.track.id + '@' + m.startedAt; musicEl.src = src;
      musicEl.onloadedmetadata = () => { try { const t = pos(); if (!m.loop && musicEl.duration && t >= musicEl.duration) return; musicEl.currentTime = t; } catch (e) { } tryPlay(musicEl); };
    } else if (musicEl.paused) tryPlay(musicEl);
    renderNowPlaying();
  }
  async function playSound(track, v) {
    const src = await trackSrc(track); if (!src) return;
    const a = new Audio(src); a.volume = vol.mute ? 0 : Math.max(0, Math.min(1, (v ?? 1) * vol.sfx)); tryPlay(a);
  }
  function stopAllAudio() { stopStream(); musicEl.pause(); musicEl.removeAttribute('src'); musicEl.dataset.key = ''; renderNowPlaying(); }
  function renderNowPlaying(msg) {
    const box = $('#nowplaying'); box.textContent = '';
    const m = S && S.audio && S.audio.music;
    if (audioBlocked && m && m.playing) { box.classList.remove('hidden'); box.append(el('button', { class: 'small primary', text: '🔊 Tap to turn on sound', onclick: () => { audioBlocked = false; if (stream.type) resumeStream(); else tryPlay(musicEl); renderNowPlaying(); } })); return; }
    if (m && m.paused && m.track) { box.classList.remove('hidden'); box.append('⏸ ' + m.track.name + ' (paused)'); return; }
    if (!m || !m.playing || !m.track) { box.classList.add('hidden'); return; }
    box.classList.remove('hidden'); box.append('♪ ' + (msg || m.track.name));
    if (stream.type && stream.min) box.append(el('button', { class: 'small ghost', text: 'Show player', onclick: showStreamPlayer }));
  }
  $('#audioBtn').onclick = e => {
    const old = $('.popover'); if (old) { old.remove(); return; }
    const r = e.target.getBoundingClientRect();
    const box = el('div', { class: 'popover', style: 'top:' + (r.bottom + 6) + 'px;right:' + Math.max(8, innerWidth - r.right) + 'px' });
    const slider = (k, label) => el('div', { class: 'setrow' }, el('span', { text: label }), el('input', { type: 'range', min: 0, max: 1, step: 0.05, value: vol[k], oninput: ev => { vol[k] = Number(ev.target.value); LS.set('nct-vol', vol); applyMusic(); } }));
    const m = S && S.audio && S.audio.music;
    box.append(el('div', { class: 'section-h', text: 'Your volume' }), slider('music', 'Music'), slider('sfx', 'Sound effects'),
      el('label', { class: 'row' }, el('input', { type: 'checkbox', checked: vol.mute, onchange: ev => { vol.mute = ev.target.checked; LS.set('nct-vol', vol); applyMusic(); } }), 'Mute everything'),
      el('div', { class: 'dim', style: 'font-size:.8rem;margin-top:6px', text: m && m.playing && m.track ? 'Now playing: ' + m.track.name : 'Nothing playing right now.' }));
    document.body.appendChild(box);
    setTimeout(() => document.addEventListener('pointerdown', function off(ev) { if (!box.contains(ev.target) && ev.target !== $('#audioBtn')) { box.remove(); document.removeEventListener('pointerdown', off); } }), 0);
  };
  function fixAudioLink(u) {
    u = String(u || '').trim();
    if (/dropbox\.com/.test(u)) u = u.replace(/[?&]dl=0/, '').replace(/\?$/, '') + (u.includes('?') ? '&' : '?') + 'raw=1';
    const g = u.match(/drive\.google\.com\/file\/d\/([^/]+)/); if (g) u = 'https://drive.google.com/uc?export=download&id=' + g[1];
    return u;
  }
  function addAudioFiles(kind) {
    const inp = el('input', { type: 'file', accept: 'audio/*,.mp3,.wav,.ogg,.m4a,.flac,.webm', multiple: true });
    inp.onchange = async () => {
      const max = kind === 'sound' ? 8 : 25;
      for (const f of inp.files) {
        if (f.size > max * 1048576) { toast(f.name + ' is too big (max ' + max + ' MB). For long music, use a link instead.', true); continue; }
        const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
        const id = N.uid();
        try { await DB.put({ id, data, name: f.name, size: f.size }, 'audio'); } catch (e) { toast('Not enough space to save ' + f.name, true); continue; }
        request({ type: 'audio.track.add', track: { id, name: f.name.replace(/\.[^.]+$/, ''), kind, file: true, size: f.size } });
      }
      toast('Added ' + inp.files.length + ' file' + (inp.files.length === 1 ? '' : 's'));
    };
    inp.click();
  }
  function renderAudio() {
    const box = $('#audioPane'); box.textContent = ''; if (!isGM()) return;
    const tracks = Object.values(S.audio.tracks); const m = S.audio.music;
    const music = tracks.filter(t => t.kind === 'music'), sounds = tracks.filter(t => t.kind === 'sound');
    const nm = el('input', { class: 'grow', placeholder: 'Name, e.g. Afterlife bar' }), url = el('input', { class: 'grow', placeholder: 'Link to an audio file (https://…mp3)' });
    const addLink = kind => { let u = fixAudioLink(url.value); const sk = streamKind(u);
      if (sk && kind === 'sound') { toast('YouTube and Spotify links work for music. For sound effects, upload a file or use a direct .mp3 link.', true); return; }
      if (!sk && /youtube\.com|youtu\.be|spotify\.com|soundcloud\.com/.test(u)) { toast("That link isn't a song, video or playlist. Copy the link from the Share button.", true); return; }
      if (sk && sk.type === 'spotify') u = 'https://open.spotify.com/' + sk.kind + '/' + sk.id;
      if (sk && sk.type === 'spotify' && canLookup()) {
        const typed = nm.value.trim(); nm.value = ''; url.value = '';
        toast('Reading the Spotify link…');
        spotifyToYouTube(sk, (d, n) => { if (n > 1 && (d % 5 === 0 || d === n)) toast('Finding songs on YouTube: ' + d + ' / ' + n); })
          .then(r => {
            if (!r.queue.length) return toast("Couldn't find those songs on YouTube", true);
            request({ type: 'audio.track.add', track: { name: typed || r.name, kind: 'music', url: 'https://www.youtube.com/watch?v=' + r.queue[0].v, queue: r.queue, src: u } });
            toast('Added ' + (typed || r.name) + (r.total > 1 ? ' (' + r.queue.length + ' of ' + r.total + ' songs found)' : ''));
          })
          .catch(e => toast("Couldn't read that Spotify link: " + (e && e.message || e), true));
        return;
      }
      if (sk && !nm.value.trim()) nm.value = sk.type === 'youtube' ? (sk.list && !sk.id ? 'YouTube playlist' : 'YouTube video') : 'Spotify ' + sk.kind; request({ type: 'audio.track.add', track: { name: nm.value.trim() || u.split('/').pop().split('?')[0] || 'Track', kind, url: u } }); nm.value = ''; url.value = ''; };
    box.append(el('div', { class: 'section-h', text: 'Music (plays for everyone, loops)' }),
      el('div', { class: 'col' }, nm, url, el('div', { class: 'row' }, el('button', { class: 'primary grow', text: '+ Add music link', onclick: () => addLink('music') }), el('button', { class: 'grow', text: '⬆ Upload music', onclick: () => addAudioFiles('music') }))),
      el('div', { class: 'setrow' }, el('span', { text: 'Music volume for everyone' }), el('input', { type: 'range', min: 0, max: 1, step: 0.05, value: m.volume ?? 0.6, onchange: e => request({ type: 'music.volume', volume: Number(e.target.value) }) })));
    if ((m.playing || m.paused) && m.track) box.append(el('div', { class: 'row' }, el('span', { class: 'grow', text: (m.paused ? '⏸ Paused: ' : '♪ Now playing: ') + m.track.name }),
      m.paused ? el('button', { class: 'primary', text: '▶ Play', onclick: () => request({ type: 'music.resume' }) }) : el('button', { text: '⏸ Pause', onclick: () => request({ type: 'music.pause' }) }),
      el('button', { class: 'danger', text: '■ Stop', onclick: () => request({ type: 'music.stop' }) })));
    box.append(el('div', { class: 'dim', style: 'font-size:.8rem', text: 'Links can be YouTube videos or playlists, Spotify songs, albums or playlists, or an mp3 (Dropbox and Google Drive share links work). Spotify links are played from YouTube, so everyone hears whole songs (in the web version, Spotify plays 30-second previews for people not logged in).' }));
    for (const t of music) box.append(el('div', { class: 'track' + (m.playing && m.track && m.track.id === t.id ? ' playing' : '') },
      el('span', { class: 'nm', text: (t.src ? '🟢▶️ ' : streamKind(t.url) ? (streamKind(t.url).type === 'youtube' ? '▶️ ' : '🟢 ') : t.url ? '🔗 ' : '♪ ') + t.name + (t.queue && t.queue.length > 1 ? ' · ' + t.queue.length + ' songs' : ''), title: t.src ? 'Spotify link, played from YouTube' : (t.url || 'uploaded file') }),
      el('button', { class: 'small primary', text: '▶', title: 'Play for everyone', onclick: () => request({ type: 'music.play', id: t.id, loop: true }) }),
      el('button', { class: 'small ghost', text: '✎', title: 'Rename', onclick: () => askText('Rename', t.name, n => request({ type: 'audio.track.rename', id: t.id, name: n })) }),
      el('button', { class: 'small ghost danger', text: '✕', onclick: () => askConfirm('Delete "' + t.name + '"?', '', 'Delete', () => { request({ type: 'audio.track.delete', id: t.id }); if (t.file) DB.del(t.id, 'audio').catch(() => { }); }) })));
    box.append(el('div', { class: 'section-h', text: 'Sound effects (click to play for everyone)' }),
      el('div', { class: 'row' }, el('button', { class: 'primary grow', text: '⬆ Upload sounds (mp3, wav, ogg)', onclick: () => addAudioFiles('sound') }), el('button', { class: 'grow', text: '+ From the link above', onclick: () => addLink('sound') })));
    if (!sounds.length) box.append(el('div', { class: 'dim', text: 'No sounds yet. Upload gunshots, alarms, door sounds… Right-click a sound to rename or delete it.' }));
    box.append(el('div', { class: 'soundgrid' }, ...sounds.map(t => el('button', { text: '🔊 ' + t.name, title: 'Play for everyone (right-click for options)', onclick: () => request({ type: 'sound.play', id: t.id }),
      oncontextmenu: e => { e.preventDefault(); askConfirm('Sound: ' + t.name, 'Rename or delete this sound.', 'Delete', () => { request({ type: 'audio.track.delete', id: t.id }); if (t.file) DB.del(t.id, 'audio').catch(() => { }); }); const mm = $('#overlay .modal .row'); if (mm) mm.prepend(el('button', { text: 'Rename', onclick: () => { closeModal(); askText('Rename sound', t.name, n => request({ type: 'audio.track.rename', id: t.id, name: n })); } })); } }))));
    box.append(el('p', { class: 'dim', style: 'font-size:.8rem', text: "Uploaded files are stored on your computer and sent to players the first time they're played (players keep a copy after that, so it's instant next time). Players control their own volume with the 🔊 button." }));
  }

  // ================= JOURNAL (shared, with show/hide) & PRIVATE NOTEPAD =================
  const visLabel = e => e.vis.mode === 'all' ? ['EVERYONE', 'vis-all'] : e.vis.mode === 'some' ? [(e.vis.ids || []).map(playerName).join(', ') || 'CHOSEN PLAYERS', 'vis-some'] : [e.ownerId === S.gmId ? 'DM ONLY' : (e.ownerId === me.id ? 'YOU + DM' : 'ONLY YOU'), 'vis-gm'];
  const folderOpen = LS.get('nct-folders-open', {});
  function renderJournal() {
    const box = $('#journalPane'); box.textContent = '';
    const J = S.journal; const entries = Object.values(J.entries).sort((a, b) => a.title.localeCompare(b.title));
    box.append(el('div', { class: 'row', style: 'flex-wrap:wrap' },
      el('button', { class: 'primary grow', text: '+ New entry', onclick: () => openEntry(null) }),
      isGM() ? el('button', { class: 'grow', text: '+ Folder', onclick: () => askText('New folder name', '', n => request({ type: 'journal.folder.upsert', folder: { name: n } })) }) : null,
      el('button', { class: 'pink grow', text: '📝 My notepad', onclick: openNotepad })));
    const entryRow = e => { const [vl, vc] = visLabel(e); return el('div', { class: 'entry', onclick: () => openEntry(e.id) },
      e.img ? el('span', { text: '🖼' }) : el('span', { text: '▤' }), el('span', { class: 'nm', text: e.title }),
      e.ownerId !== S.gmId ? el('span', { class: 'dim', style: 'font-size:.72rem', text: playerName(e.ownerId) }) : null,
      (isGM() || e.ownerId === me.id) ? el('span', { class: 'badge b-vis ' + vc, text: vl }) : null); };
    const folders = Object.values(J.folders).sort((a, b) => (a.order || 0) - (b.order || 0));
    for (const f of folders) {
      const inF = entries.filter(e => e.folderId === f.id); const open = folderOpen[f.id] !== false;
      const allShown = inF.length && inF.every(e => e.vis.mode === 'all');
      box.append(el('div', { class: 'folder' },
        el('div', { class: 'fh', onclick: () => { folderOpen[f.id] = !open; LS.set('nct-folders-open', folderOpen); renderJournal(); } },
          el('span', { text: (open ? '▾ ' : '▸ ') + f.name, class: 'grow' }), el('span', { class: 'dim', text: String(inF.length) }),
          isGM() ? el('button', { class: 'small', text: allShown ? 'Hide all' : 'Show all', title: allShown ? 'Hide everything in this folder from players' : 'Show everything in this folder to all players', onclick: ev => { ev.stopPropagation(); request({ type: 'journal.folder.vis', id: f.id, vis: { mode: allShown ? 'gm' : 'all' } }); } }) : null,
          isGM() ? el('button', { class: 'small ghost', text: '✎', onclick: ev => { ev.stopPropagation(); askText('Rename folder', f.name, n => request({ type: 'journal.folder.upsert', folder: { id: f.id, name: n } })); } }) : null,
          isGM() ? el('button', { class: 'small ghost danger', text: '✕', onclick: ev => { ev.stopPropagation(); askConfirm('Delete folder "' + f.name + '"?', "Entries inside aren't deleted. They move to Unsorted.", 'Delete', () => request({ type: 'journal.folder.delete', id: f.id })); } }) : null),
        open ? el('div', { class: 'fb' }, ...(inF.length ? inF.map(entryRow) : [el('div', { class: 'dim', style: 'font-size:.8rem', text: 'Empty' })])) : null));
    }
    const loose = entries.filter(e => !e.folderId || !J.folders[e.folderId]);
    const dmLoose = loose.filter(e => e.ownerId === S.gmId), plLoose = loose.filter(e => e.ownerId !== S.gmId);
    if (dmLoose.length) box.append(el('div', { class: 'section-h', text: isGM() ? 'Unsorted' : 'From the DM' }), ...dmLoose.map(entryRow));
    if (plLoose.length) box.append(el('div', { class: 'section-h', text: 'Player notes' }), ...plLoose.map(entryRow));
    if (!entries.length && !folders.length) box.append(el('p', { class: 'dim', text: isGM() ? 'Write handouts, NPC files, clues and maps here. Each one can be DM only, shown to everyone, or shown to chosen players, and you can change that any time.' : 'Handouts the DM shows you appear here. You can also write notes for everyone, or just for you and the DM.' }));
    box.append(el('p', { class: 'dim', style: 'font-size:.78rem', text: '📝 My notepad is private. It stays on this computer and nobody else can see it.' }));
  }
  function openEntry(id) {
    const ex = id && S.journal.entries[id];
    const mine = !ex || ex.ownerId === me.id || isGM();
    const e = ex ? N.clone(ex) : { title: '', body: '', img: '', folderId: null, vis: { mode: isGM() ? 'gm' : 'gm', ids: [] } };
    openEntryId = ex ? ex.id : null;
    const m = modal(ex ? e.title : 'New entry', true); m.classList.add('frame');
    if (!mine) { // read-only handout
      if (e.img) m.append(el('img', { src: e.img, style: 'max-width:100%;max-height:60vh;display:block;margin:0 auto 12px;border:2px solid var(--p)' }));
      m.append(el('div', { style: 'white-space:pre-wrap;line-height:1.5', text: e.body || '' }), el('p', { class: 'dim', style: 'font-size:.8rem;margin-top:14px', text: 'Written by ' + playerName(e.ownerId) }));
      return;
    }
    const title = el('input', { class: 'grow', value: e.title, placeholder: 'Title', style: 'font-size:1.1rem' });
    const body = el('textarea', { style: 'width:100%;min-height:260px;line-height:1.5', value: e.body, placeholder: isGM() ? 'Handout text, clue, NPC file…' : 'Your note…' });
    let img = e.img;
    const imgBox = el('div');
    const drawImg = () => { imgBox.textContent = ''; if (img) imgBox.append(el('img', { src: img, style: 'max-width:100%;max-height:300px;display:block;border:2px solid var(--p);margin-bottom:6px' }), el('button', { class: 'small danger', text: 'Remove picture', onclick: () => { img = ''; drawImg(); } })); };
    drawImg();
    const mode = el('select', null,
      el('option', { value: 'gm', text: isGM() ? 'Hidden: DM only' : 'Only me and the DM', selected: e.vis.mode === 'gm' }),
      el('option', { value: 'all', text: 'Shown to everyone', selected: e.vis.mode === 'all' }),
      el('option', { value: 'some', text: 'Shown to chosen players…', selected: e.vis.mode === 'some' }));
    const picks = el('div', { class: 'row', style: 'flex-wrap:wrap' });
    const chosen = new Set(e.vis.ids || []);
    const drawPicks = () => { picks.textContent = ''; if (mode.value !== 'some') return; const ps = Object.values(S.players).filter(p => p.id !== S.gmId && p.id !== me.id); if (!ps.length) picks.append(el('span', { class: 'dim', text: 'No players have joined yet.' })); for (const p of ps) picks.append(el('label', { class: 'row' }, el('input', { type: 'checkbox', checked: chosen.has(p.id), onchange: ev => { ev.target.checked ? chosen.add(p.id) : chosen.delete(p.id); } }), p.name)); };
    mode.onchange = drawPicks; drawPicks();
    const folder = isGM() ? el('select', null, el('option', { value: '', text: '— Unsorted —' }), ...Object.values(S.journal.folders).map(f => el('option', { value: f.id, text: f.name, selected: f.id === e.folderId }))) : null;
    const save = () => { request({ type: 'journal.entry.upsert', entry: { id: ex ? ex.id : undefined, title: title.value.trim() || 'Untitled', body: body.value, img, folderId: folder ? (folder.value || null) : e.folderId, vis: { mode: mode.value, ids: [...chosen] } } }); closeModal(); openEntryId = null; toast('Saved'); };
    m.append(el('div', { class: 'row', style: 'margin-bottom:10px' }, title),
      el('div', { class: 'row', style: 'flex-wrap:wrap;margin-bottom:6px' }, el('label', { text: 'Who can see it' }), mode, folder ? el('label', { text: 'Folder' }) : null, folder), picks,
      el('div', { style: 'margin:10px 0' }, imgBox, el('button', { class: 'small', text: '🖼 Add / change picture', onclick: () => pickImage(1600, u => { img = u; drawImg(); }) })),
      body,
      el('div', { class: 'row', style: 'margin-top:10px' },
        ex ? el('button', { class: 'danger', text: 'Delete', onclick: () => askConfirm('Delete "' + e.title + '"?', '', 'Delete', () => { request({ type: 'journal.entry.delete', id: ex.id }); openEntryId = null; }) }) : null,
        el('div', { class: 'grow' }), el('button', { class: 'ghost', text: 'Cancel', onclick: () => { closeModal(); openEntryId = null; } }), el('button', { class: 'primary', text: 'Save', onclick: save })));
    setTimeout(() => (ex ? body : title).focus(), 0);
  }
  function refreshOpenEntry() { /* another person changed the entry you are reading: show the new version if you're only reading */ const ov = $('#overlay'); if (ov && !ov.querySelector('textarea')) openEntry(openEntryId); }
  function openNotepad() {
    const key = 'nct-notepad-' + (S ? S.id : 'x');
    const m = modal('My notepad (private)', true); m.classList.add('frame');
    const ta = el('textarea', { style: 'width:100%;min-height:55vh;line-height:1.5', value: LS.get(key, ''), placeholder: 'Anything you like: plans, suspicions, names, phone numbers… Only you can see this. It stays on this computer.' });
    let t = null; ta.oninput = () => { clearTimeout(t); t = setTimeout(() => LS.set(key, ta.value), 400); };
    m.append(el('p', { class: 'dim', style: 'font-size:.8rem', text: 'Saved automatically on this computer only, for this game. Not even the ' + (isGM() ? 'players' : 'DM') + ' can see it.' }), ta);
    setTimeout(() => ta.focus(), 0);
  }
  applyTheme();

  // ================= MACROS, MODIFIER TOGGLES & DAMAGE =================
  // Macro formulas use dice plus @tokens: @REF (a stat), @Handgun or @{Dodge & Escape} (a skill), @SA (special ability), @BTM, @STR (melee strength bonus)
  function resolveFormula(sh, f) {
    let bad = null;
    const val = name => {
      const n = name.trim(); const up = n.toUpperCase();
      if (N.STATS.includes(up)) return N.effStat(sh, up);
      if (up === 'BT' || up === 'BOD') return N.effStat(sh, 'BODY');
      if (up === 'SA' || up === 'SPECIAL') return sh.specialAbility || 0;
      if (up === 'BTM') return N.derived(sh).btm;
      if (up === 'STR') return N.strBonus(N.statVal(sh, 'BODY'));
      const sk = sh.skills.find(k => k.name.toLowerCase() === n.toLowerCase()) || sh.skills.find(k => k.name.toLowerCase().startsWith(n.toLowerCase()));
      if (sk) return Number(sk.value) || 0;
      bad = n; return 0;
    };
    let out = String(f || '').replace(/@\{([^}]+)\}|@([A-Za-z][A-Za-z/]*)/g, (m, a, b) => '(' + val(a || b) + ')');
    out = out.replace(/\(\s*(-?\d+)\s*\)/g, (m, n) => n).replace(/\s+/g, '').replace(/\+\+/g, '+').replace(/\+-/g, '-').replace(/--/g, '+').replace(/-\+/g, '-');
    if (bad) throw new Error('Unknown @' + bad + '. Use a stat (@REF), a skill (@Handgun or @{Dodge & Escape}), @SA, @BTM or @STR');
    return out;
  }
  function modValue(sh, m) { return m.auto === 'str' ? sign(N.strBonus(N.statVal(sh, 'BODY'))) : m.value; }
  function activeMods(sh, kind) { return (sh.mods || []).filter(m => m.on && (m.applies === kind || m.applies === 'both') && modValue(sh, m) !== '+0'); }
  // rolls a formula with the character's switched-on modifiers added automatically
  function rollWithMods(sh, formula, label, kind, extra) {
    let f; try { f = resolveFormula(sh, formula); } catch (e) { toast(e.message, true); return; }
    const mods = kind ? activeMods(sh, kind) : [];
    for (const m of mods) f += modValue(sh, m);
    try { N.roll(f); } catch (e) { toast('"' + formula + '" isn\'t a roll like 1d10! + @REF + 2', true); return; }
    rollReq(f, label + (mods.length ? ' [' + mods.map(m => m.name + ' ' + modValue(sh, m)).join(', ') + ']' : ''), Object.assign({ kind, sheetId: sh.id }, extra || {}));
  }
  function saveSheetNow(sh) { request({ type: 'sheet.upsert', sheet: N.clone(sh) }); }
  function toggleMod(sh, id) { const m = (sh.mods || []).find(x => x.id === id); if (!m) return; m.on = !m.on; saveSheetNow(sh); }
  function modChips(sh, editable, onChange) {
    const wrap = el('div', { class: 'row', style: 'flex-wrap:wrap;gap:4px' });
    for (const m of sh.mods || []) {
      const v = modValue(sh, m);
      wrap.append(el('button', { class: 'small' + (m.on ? ' primary' : ' ghost'), title: (m.applies === 'hit' ? 'Added to to-hit rolls' : m.applies === 'dmg' ? 'Added to damage rolls' : 'Added to to-hit and damage rolls') + (editable ? ' · click to switch on/off' : ''),
        style: 'text-transform:none', disabled: !editable, onclick: () => { m.on = !m.on; onChange(); } },
        (m.on ? '● ' : '○ ') + m.name + ' ' + v + (m.applies === 'dmg' ? ' dmg' : m.applies === 'both' ? ' all' : '')));
    }
    return wrap;
  }
  function editModsDialog(sh, done) {
    const m = modal('Roll modifiers: ' + sh.name, true);
    const list = el('div', { class: 'col' });
    const draw = () => {
      list.textContent = '';
      (sh.mods || []).forEach((md, i) => list.append(el('div', { class: 'row' },
        el('input', { type: 'checkbox', checked: md.on, title: 'On', onchange: e => { md.on = e.target.checked; } }),
        el('input', { class: 'grow', value: md.name, oninput: e => { md.name = e.target.value; } }),
        md.auto === 'str' ? el('span', { class: 'mono', style: 'width:80px', text: modValue(sh, md) + ' (BODY)' }) : el('input', { value: md.value, style: 'width:80px', title: 'e.g. +2, -3, +1d6', oninput: e => { md.value = e.target.value; } }),
        el('select', { onchange: e => { md.applies = e.target.value; } }, ...[['hit', 'To-hit'], ['dmg', 'Damage'], ['both', 'Both']].map(([v, l]) => el('option', { value: v, text: l, selected: md.applies === v }))),
        el('button', { class: 'small ghost danger', text: '✕', onclick: () => { sh.mods.splice(i, 1); draw(); } }))));
    };
    draw();
    m.append(el('p', { class: 'dim', style: 'font-size:.85rem', text: "Switched-on modifiers are added to this character's rolls automatically: to-hit ones to attacks, damage ones to damage. Values can be numbers (+2, -3) or dice (+1d6)." }), list,
      el('div', { class: 'row', style: 'margin-top:10px' },
        el('button', { text: '+ Add modifier', onclick: () => { sh.mods = sh.mods || []; sh.mods.push({ id: N.uid(), name: 'New modifier', value: '+1', applies: 'hit', on: true }); draw(); } }),
        el('button', { class: 'ghost', text: 'Add the standard ones back', onclick: () => { sh.mods = sh.mods || []; for (const d of N.DEFAULT_MODS) if (!sh.mods.some(x => x.name === d.name)) sh.mods.push(Object.assign({ id: N.uid(), on: false }, d)); draw(); } }),
        el('div', { class: 'grow' }),
        el('button', { class: 'primary', text: 'Save', onclick: () => { for (const md of sh.mods) { const v = N.cleanModValue(md.value); if (v === null) { toast('"' + md.value + '" isn\'t a modifier like +2 or +1d6', true); return; } md.value = v; } saveSheetNow(sh); closeModal(); if (done) done(); } })));
  }
  function editMacroDialog(sh, macro, done) {
    const isNew = !macro; macro = macro || { id: N.uid(), name: '', formula: '1d10! + @REF + @Handgun', kind: 'hit' };
    const m = modal(isNew ? 'New macro' : 'Edit macro');
    const name = el('input', { class: 'grow', value: macro.name, placeholder: 'Button name, e.g. Shoot' });
    const f = el('input', { class: 'grow mono', value: macro.formula });
    const kind = el('select', null, ...[['hit', 'To-hit roll (adds to-hit toggles)'], ['dmg', 'Damage roll (adds damage toggles)'], ['', 'Other roll (no toggles)']].map(([v, l]) => el('option', { value: v, text: l, selected: macro.kind === v })));
    const preview = el('div', { class: 'mono dim', style: 'font-size:.85rem;min-height:1.2em' });
    const upd = () => { try { const r = resolveFormula(sh, f.value); N.roll(r); preview.textContent = '= ' + r; preview.style.color = ''; } catch (e) { preview.textContent = e.message || 'Not a valid roll yet'; preview.style.color = 'var(--red)'; } };
    f.oninput = upd; upd();
    m.append(el('div', { class: 'col' }, name, f, preview, kind,
      el('div', { class: 'dim', style: 'font-size:.8rem;line-height:1.6' }, 'Examples: ', el('span', { class: 'mono', text: '1d10! + @REF + @Handgun' }), ' · ', el('span', { class: 'mono', text: '1d10! + @INT + @{Awareness/Notice}' }), ' · ', el('span', { class: 'mono', text: '4d6 + @STR' }), ' · ', el('span', { class: 'mono', text: '1d10! + @COOL + @SA' }),
        el('br'), 'Tokens: @REF/@INT/… (stats, wound penalties included), @SkillName or @{Skill Name}, @SA (special ability), @BTM, @STR (melee strength bonus). 1d10! explodes on a 10.')),
      el('div', { class: 'row', style: 'margin-top:12px' },
        isNew ? null : el('button', { class: 'danger', text: 'Delete', onclick: () => { sh.macros = sh.macros.filter(x => x.id !== macro.id); saveSheetNow(sh); closeModal(); if (done) done(); } }),
        el('div', { class: 'grow' }),
        el('button', { class: 'primary', text: 'Save', onclick: () => { try { N.roll(resolveFormula(sh, f.value)); } catch (e) { toast(e.message || 'Not a valid roll', true); return; } macro.name = name.value.trim() || 'Roll'; macro.formula = f.value; macro.kind = kind.value; sh.macros = sh.macros || []; if (isNew) sh.macros.push(macro); saveSheetNow(sh); closeModal(); if (done) done(); } })));
    setTimeout(() => name.focus(), 0);
  }
  function runMacro(sh, mc) { rollWithMods(sh, mc.formula, sh.name + ': ' + mc.name, mc.kind); }

  // macro bar above the chat box: pick one of your characters, click its macros, flip its toggles
  let macroChipsOpen = false;
  function renderMacroBar() {
    const bar = $('#macrobar'); if (!bar) return; bar.textContent = '';
    if (!S) return;
    const mine = Object.values(S.sheets).filter(x => canEditSheet(x));
    if (!mine.length) { bar.classList.add('hidden'); return; }
    bar.classList.remove('hidden');
    const key = 'nct-active-sheet-' + S.id; let cur = S.sheets[LS.get(key, '')]; if (!cur || !canEditSheet(cur)) cur = mine[0];
    const sel = el('select', { style: 'max-width:140px;font-size:.8rem;padding:2px 4px', onchange: e => { LS.set(key, e.target.value); renderMacroBar(); } }, ...mine.map(x => el('option', { value: x.id, text: x.name, selected: x.id === cur.id })));
    const sh = N.clone(cur);
    const macros = el('div', { class: 'row', style: 'flex-wrap:wrap;gap:4px' }, ...(sh.macros || []).map(mc => el('button', { class: 'small primary', style: 'text-transform:none', title: mc.formula, text: '▶ ' + mc.name, onclick: () => runMacro(sh, mc), oncontextmenu: e => { e.preventDefault(); editMacroDialog(sh, mc, renderMacroBar); } })),
      el('button', { class: 'small ghost', text: '+ Macro', title: 'Make a roll button', onclick: () => editMacroDialog(sh, null, renderMacroBar) }),
      el('button', { class: 'small pink', text: '🎯 Attack', title: 'Attack your target (pick one with the 🎯 tool or right-click → Target)', onclick: () => openAttack() }));
    const on = (sh.mods || []).filter(m => m.on);
    bar.append(...[el('div', { class: 'row', style: 'gap:6px' }, sel, macros),
      el('div', { class: 'row', style: 'flex-wrap:wrap;gap:4px;margin-top:4px' },
        el('button', { class: 'small' + (macroChipsOpen ? ' primary' : ' ghost'), text: '⚙ Toggles' + (on.length ? ' (' + on.length + ' on)' : ''), onclick: () => { macroChipsOpen = !macroChipsOpen; renderMacroBar(); } }),
        ...(macroChipsOpen ? [] : on.map(m => el('span', { class: 'badge b-vis', style: 'color:var(--p)', text: m.name + ' ' + modValue(sh, m) })))),
      macroChipsOpen ? el('div', { style: 'margin-top:4px' }, modChips(sh, true, () => { saveSheetNow(sh); setTimeout(renderMacroBar, 30); }), el('button', { class: 'small ghost', style: 'margin-top:4px', text: 'Edit toggles…', onclick: () => editModsDialog(sh, renderMacroBar) })) : null].filter(Boolean));
  }

  // damage calculator: SP of the hit location, head ×2, BTM, armor wear, then onto the wound track
  function applyDamageDialog(msg) {
    const targets = Object.values(S.sheets).filter(x => canEditSheet(x));
    if (!targets.length) return toast('There are no characters you can apply damage to', true);
    const m = modal('Apply damage: ' + msg.roll.total);
    const dmg = el('input', { type: 'number', value: msg.roll.total, style: 'width:80px' });
    const tgt = el('select', { class: 'grow' }, ...targets.map(x => el('option', { value: x.id, text: x.name + ' (' + N.woundInfo(x.damage).label + ')' })));
    const loc = el('select', null, el('option', { value: 'roll', text: 'Roll hit location' }), ...N.LOCS.map(([k, l]) => el('option', { value: k, text: l })));
    const ap = el('input', { type: 'checkbox', checked: !!msg.ap }), wear = el('input', { type: 'checkbox', checked: true }), cover = el('input', { type: 'number', value: 0, style: 'width:60px' });
    const calc = el('div', { class: 'mono', style: 'background:var(--field);border:1px solid var(--line);padding:10px;margin:10px 0;line-height:1.7;white-space:pre-wrap' });
    let rolledLoc = null;
    const compute = () => {
      const sh = S.sheets[tgt.value]; if (!sh) return null;
      let l = loc.value; if (l === 'roll') { if (!rolledLoc) { const r = Math.floor(Math.random() * 10) + 1; rolledLoc = r === 1 ? 'head' : r <= 4 ? 'torso' : r === 5 ? 'rArm' : r === 6 ? 'lArm' : r <= 8 ? 'rLeg' : 'lLeg'; } l = rolledLoc; }
      const lname = N.LOCS.find(x => x[0] === l)[1];
      let sp = (Number(sh.sp[l]) || 0) + (Number(cover.value) || 0); if (ap.checked) sp = Math.floor(sp / 2);
      const d = Math.max(0, Number(dmg.value) || 0); let through = Math.max(0, d - sp);
      const lines = ['Damage rolled        ' + d, 'Hit location         ' + lname + (loc.value === 'roll' ? ' (rolled)' : ''), '− Armor SP           ' + sp + (ap.checked ? ' (AP: half)' : '') + (Number(cover.value) ? ' incl. cover ' + cover.value : '')];
      if (through > 0 && l === 'head') { through *= 2; lines.push('× 2 head hit         ' + through); }
      const btm = N.derived(sh).btm; let final = through > 0 ? Math.max(1, through + btm) : 0;
      lines.push('− Body type (BTM ' + btm + ')'); lines.push('= Wounds taken        ' + final);
      const after = Math.min(41, sh.damage + final); lines.push('Wound track          ' + sh.damage + ' → ' + after + ' (' + N.woundInfo(after).label + ')');
      if (final > 0 && wear.checked && (Number(sh.sp[l]) || 0) > 0) lines.push('Armor at ' + lname + ' wears down: SP ' + sh.sp[l] + ' → ' + (sh.sp[l] - 1));
      if (final > 0 && final >= 8 && l === 'head') lines.push('⚠ 8+ to the head: the target is killed outright (CP2020 rule).');
      if (final > 0 && final >= 8 && l !== 'head' && l !== 'torso') lines.push('⚠ 8+ to a limb: it is severed or crushed. Mortal 0, make a death save.');
      calc.textContent = lines.join('\n');
      return { sh, l, lname, final, after };
    };
    [dmg, tgt, loc, ap, wear, cover].forEach(x => x.addEventListener('input', () => { if (x === loc) rolledLoc = null; compute(); }));
    m.append(el('div', { class: 'col' },
      el('div', { class: 'row' }, el('label', { text: 'Damage' }), dmg, el('label', { text: 'Target' }), tgt),
      el('div', { class: 'row', style: 'flex-wrap:wrap' }, el('label', { text: 'Location' }), loc, el('label', { text: 'Cover SP' }), cover),
      el('label', { class: 'row' }, ap, 'Armor-piercing (halves armor)'), el('label', { class: 'row' }, wear, 'Armor loses 1 SP when it is beaten')), calc,
      el('div', { class: 'row' }, el('div', { class: 'grow' }), el('button', { class: 'ghost', text: 'Cancel', onclick: closeModal }),
        el('button', { class: 'pink', text: 'Apply damage', onclick: () => {
          const r = compute(); if (!r) return; const sh = N.clone(r.sh);
          sh.damage = r.after; if (r.final > 0 && wear.checked && (Number(sh.sp[r.l]) || 0) > 0) sh.sp[r.l] -= 1;
          request({ type: 'sheet.upsert', sheet: sh });
          request({ type: 'chat', text: '💥 ' + sh.name + ' takes ' + r.final + ' wound' + (r.final === 1 ? '' : 's') + ' to the ' + r.lname + ' (' + N.woundInfo(r.after).label + ')' });
          closeModal();
        } })));
    compute();
  }

  // ================= LIBRARY: your own rulebooks + quick reference =================
  // Books are the person's own PDFs, stored only on their computer. Nothing from the books ships with the app.
  const BOOK_LINES = { '2020': 'Cyberpunk 2020', red: 'Cyberpunk RED', other: 'Other / homebrew' };
  let pdfLib = null;
  function loadPdfLib() {
    if (pdfLib) return Promise.resolve(pdfLib);
    const tryLoad = (src, worker) => new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = src; sc.onload = () => window.pdfjsLib ? res(worker) : rej(); sc.onerror = rej; document.head.appendChild(sc); });
    return tryLoad('pdf.min.js', 'pdf.worker.min.js')
      .catch(() => tryLoad('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js', 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'))
      .then(worker => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = worker; pdfLib = window.pdfjsLib; return pdfLib; });
  }
  const bookList = () => LS.get('nct-books', []);
  const saveBookList = l => LS.set('nct-books', l);
  const openPdfs = new Map();
  async function getPdf(id) {
    if (openPdfs.has(id)) return openPdfs.get(id);
    const rec = await DB.get(id, 'books'); if (!rec) throw new Error('That book is no longer on this computer');
    const lib = await loadPdfLib();
    const pdf = await lib.getDocument({ data: new Uint8Array(rec.data), isEvalSupported: false, disableFontFace: false }).promise;
    openPdfs.set(id, pdf); return pdf;
  }
  async function bookText(id, onProgress) { // every page's text, worked out once and kept for searching
    const cached = await DB.get(id, 'booktext').catch(() => null); if (cached) return cached.pages;
    const pdf = await getPdf(id); const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const pg = await pdf.getPage(i); const tc = await pg.getTextContent();
      pages.push(tc.items.map(x => x.str + (x.hasEOL ? '\n' : ' ')).join('').replace(/[ \t]+/g, ' '));
      if (onProgress && i % 5 === 0) onProgress(i, pdf.numPages);
    }
    await DB.put({ id, pages }, 'booktext').catch(() => { });
    return pages;
  }
  function addBookFiles(line) {
    const inp = el('input', { type: 'file', accept: 'application/pdf,.pdf', multiple: true });
    inp.onchange = async () => {
      for (const f of inp.files) {
        const id = N.uid(); toast('Adding ' + f.name + '…');
        try { await DB.put({ id, data: await f.arrayBuffer() }, 'books'); }
        catch (e) { toast('Not enough space on this computer for ' + f.name, true); continue; }
        const l = bookList(); l.push({ id, name: f.name.replace(/\.pdf$/i, ''), line, size: f.size, added: Date.now() }); saveBookList(l);
      }
      renderBooks();
    };
    inp.click();
  }
  function renderBooks() {
    const box = $('#booksPane'); if (!box) return; box.textContent = '';
    const q = el('input', { class: 'grow', placeholder: 'Search all my books, e.g. autofire, stun save' });
    const results = el('div', { class: 'col' });
    const doSearch = async () => {
      const term = q.value.trim().toLowerCase(); results.textContent = ''; if (term.length < 3) return;
      const books = bookList(); if (!books.length) { results.append(el('div', { class: 'dim', text: 'Add a book first.' })); return; }
      const status = el('div', { class: 'dim', style: 'font-size:.8rem', text: 'Searching…' }); results.append(status);
      let hits = 0;
      for (const b of books) {
        if (b.url) continue;
        let pages; try { pages = await bookText(b.id, (i, n) => { status.textContent = 'Reading ' + b.name + ' for the first time… page ' + i + '/' + n; }); } catch (e) { continue; }
        pages.forEach((t, i) => {
          const at = t.toLowerCase().indexOf(term); if (at < 0 || hits >= 60) return; hits++;
          const snip = (at > 60 ? '…' : '') + t.slice(Math.max(0, at - 60), at + term.length + 90).replace(/\s+/g, ' ') + '…';
          results.append(el('div', { class: 'entry', style: 'flex-direction:column;align-items:flex-start', onclick: () => openReader(b.id, i + 1, term) },
            el('div', { style: 'color:var(--p);font-weight:700;font-size:.8rem', text: b.name + ' · page ' + (i + 1) }), el('div', { class: 'dim', style: 'font-size:.8rem', text: snip })));
        });
      }
      status.textContent = hits ? hits + (hits >= 60 ? '+' : '') + ' result' + (hits === 1 ? '' : 's') : 'Nothing found.';
    };
    q.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
    box.append(el('div', { class: 'section-h', text: 'Rules quick reference' }),
      el('div', { class: 'row' }, el('button', { class: 'primary grow', text: 'Cyberpunk 2020', onclick: () => openQuickRef('2020') }), el('button', { class: 'primary grow', text: 'Cyberpunk RED', onclick: () => openQuickRef('red') })),
      isGM() ? el('button', { class: 'pink', style: 'width:100%;margin-top:6px', text: '🗓 Lore timeline (DM only)', onclick: openTimeline }) : null,
      el('div', { class: 'section-h', text: 'Search' }), el('div', { class: 'row' }, q, el('button', { text: 'Go', onclick: doSearch })), results,
      el('div', { class: 'section-h', text: 'My books' }));
    const books = bookList();
    for (const [line, label] of Object.entries(BOOK_LINES)) {
      const inLine = books.filter(b => b.line === line);
      box.append(el('div', { class: 'folder' },
        el('div', { class: 'fh' }, el('span', { class: 'grow', text: label }), el('span', { class: 'dim', text: String(inLine.length) }),
          el('button', { class: 'small', text: '+ PDF', title: 'Add your own PDF copy of a ' + label + ' book', onclick: ev => { ev.stopPropagation(); addBookFiles(line); } }),
          el('button', { class: 'small ghost', text: '+ Link', title: 'Add a link (opens in your web browser)', onclick: ev => { ev.stopPropagation(); askText('Link to the book (https://…)', '', u => { if (!/^https:\/\//.test(u)) return toast('Links must start with https://', true); askText('Name for this book', '', n => { const l = bookList(); l.push({ id: N.uid(), name: n || u, line, url: u, added: Date.now() }); saveBookList(l); renderBooks(); }); }); } })),
        el('div', { class: 'fb' }, ...(inLine.length ? inLine.map(b => el('div', { class: 'entry', onclick: () => b.url ? window.open(b.url, '_blank', 'noopener') : openReader(b.id, 1) },
          el('span', { text: b.url ? '🔗' : '📕' }), el('span', { class: 'nm', text: b.name }), b.size ? el('span', { class: 'dim', style: 'font-size:.72rem', text: Math.round(b.size / 1048576) + ' MB' }) : null,
          el('button', { class: 'small ghost', text: '✎', onclick: ev => { ev.stopPropagation(); askText('Rename book', b.name, n => { const l = bookList(); const x = l.find(y => y.id === b.id); if (x) x.name = n; saveBookList(l); renderBooks(); }); } }),
          el('button', { class: 'small ghost danger', text: '✕', onclick: ev => { ev.stopPropagation(); askConfirm('Remove "' + b.name + '"?', 'It is removed from this computer only.', 'Remove', () => { saveBookList(bookList().filter(x => x.id !== b.id)); DB.del(b.id, 'books').catch(() => { }); DB.del(b.id, 'booktext').catch(() => { }); openPdfs.delete(b.id); renderBooks(); }); } })))
          : [el('div', { class: 'dim', style: 'font-size:.8rem', text: 'No books yet.' })]))));
    }
    box.append(el('p', { class: 'dim', style: 'font-size:.78rem', text: 'Your books stay on this computer. Each player adds their own copies. The quick reference is a short summary in our own words. Your rulebook and your DM have the final say.' }));
  }
  async function openReader(id, page, highlight) {
    const meta = bookList().find(b => b.id === id); if (!meta) return;
    const m = modal(meta.name, true); m.style.width = 'min(1400px,100%)';
    const toc = el('div', { style: 'width:280px;flex:none;max-height:78vh;overflow:auto;border-right:1px solid var(--line);padding-right:8px;font-size:.85rem' }, el('div', { class: 'dim', text: 'Loading…' }));
    const canvas = el('canvas', { style: 'max-width:100%;border:1px solid var(--line);background:#fff' });
    const pnum = el('input', { type: 'number', min: 1, style: 'width:70px' }); const total = el('span', { class: 'dim' });
    let pdf, cur = page || 1, zoom = LS.get('nct-reader-zoom', 1.4), rendering = null;
    const view = el('div', { style: 'flex:1;min-width:0;max-height:78vh;overflow:auto;text-align:center' }, canvas);
    const go = async n => {
      if (!pdf) return; cur = Math.max(1, Math.min(pdf.numPages, n)); pnum.value = cur;
      const pg = await pdf.getPage(cur); const vp = pg.getViewport({ scale: zoom * (window.devicePixelRatio || 1) });
      canvas.width = vp.width; canvas.height = vp.height; canvas.style.width = (vp.width / (window.devicePixelRatio || 1)) + 'px';
      if (rendering) { try { rendering.cancel(); } catch (e) { } }
      rendering = pg.render({ canvasContext: canvas.getContext('2d'), viewport: vp }); try { await rendering.promise; } catch (e) { } view.scrollTop = 0;
    };
    const findIn = el('input', { class: 'grow', placeholder: 'Search this book', value: highlight || '' });
    const findRes = el('div', { class: 'col', style: 'gap:2px;margin:6px 0' });
    const doFind = async () => {
      const term = findIn.value.trim().toLowerCase(); findRes.textContent = ''; if (term.length < 3) return;
      findRes.append(el('div', { class: 'dim', text: 'Searching…' }));
      const pages = await bookText(id, (i, n) => { findRes.firstChild.textContent = 'Reading page ' + i + '/' + n + '…'; }); findRes.textContent = '';
      let n = 0; pages.forEach((t, i) => { if (n < 80 && t.toLowerCase().includes(term)) { n++; findRes.append(el('button', { class: 'small ghost', style: 'text-align:left;text-transform:none', text: 'p.' + (i + 1) + ' ' + t.slice(Math.max(0, t.toLowerCase().indexOf(term) - 20), t.toLowerCase().indexOf(term) + 40).replace(/\s+/g, ' '), onclick: () => go(i + 1) })); } });
      if (!n) findRes.append(el('div', { class: 'dim', text: 'Not found' }));
    };
    findIn.addEventListener('keydown', e => { if (e.key === 'Enter') doFind(); });
    m.append(el('div', { class: 'row', style: 'flex-wrap:wrap;margin-bottom:8px' },
      el('button', { text: '◀', onclick: () => go(cur - 1) }), el('span', { text: 'Page' }), pnum, el('span', null, '/ ', total), el('button', { text: '▶', onclick: () => go(cur + 1) }),
      el('button', { class: 'small', text: '−', onclick: () => { zoom = Math.max(0.5, zoom - 0.2); LS.set('nct-reader-zoom', zoom); go(cur); } }), el('button', { class: 'small', text: '+', onclick: () => { zoom = Math.min(4, zoom + 0.2); LS.set('nct-reader-zoom', zoom); go(cur); } }),
      el('div', { class: 'grow' }), findIn, el('button', { text: 'Find', onclick: doFind })),
      el('div', { class: 'row', style: 'align-items:flex-start;gap:12px' }, el('div', { class: 'col', style: 'width:280px;flex:none;gap:0' }, findRes, toc), view));
    toc.previousSibling;
    pnum.onchange = () => go(Number(pnum.value));
    try { pdf = await getPdf(id); } catch (e) { toc.textContent = e.message || 'Could not open this PDF'; return; }
    total.textContent = String(pdf.numPages);
    go(cur); if (highlight) doFind();
    // the book's own table of contents, sorted into chapters
    toc.textContent = '';
    const outline = await pdf.getOutline().catch(() => null);
    if (!outline || !outline.length) { toc.append(el('div', { class: 'dim', text: "This PDF has no chapter list. Use search instead." })); return; }
    const pageOf = async dest => { try { const d = typeof dest === 'string' ? await pdf.getDestination(dest) : dest; return d ? (await pdf.getPageIndex(d[0])) + 1 : null; } catch (e) { return null; } };
    const draw = (items, depth, into) => { for (const it of items) {
      const b = el('div', { class: 'entry', style: 'padding:3px 6px;margin-left:' + (depth * 12) + 'px;border:0', text: it.title, onclick: async () => { const pg = await pageOf(it.dest); if (pg) go(pg); } });
      into.append(b); if (it.items && it.items.length && depth < 3) draw(it.items, depth + 1, into); } };
    toc.append(el('div', { class: 'section-h', text: 'Chapters' })); draw(outline, 0, toc);
  }
  // short rules summaries, written for this app (not copied from the books)
  const QUICK_REF = {
    '2020': [
      ['Skill checks', ['Roll 1d10 + STAT + SKILL. Beat the difficulty: Easy 10 · Average 15 · Difficult 20 · Very Difficult 25 · Nearly Impossible 30.', 'A natural 10 explodes: roll again and add it. A natural 1 is a fumble, and the DM decides what goes wrong.', 'Contested checks: both sides roll and the higher total wins.']],
      ['Turn order', ['Initiative: 1d10 + REF (Solos add Combat Sense). Highest goes first.', 'A turn is about 3 seconds: move, plus one action. Each extra action in a turn is −3.']],
      ['Ranged attacks', ['Roll 1d10 + REF + weapon skill + weapon accuracy (WA) against the range difficulty:', 'Point blank 10 · Close (up to ¼ range) 15 · Medium (½ range) 20 · Long (full range) 25 · Extreme (up to 2× range) 30.', 'Common modifiers: aiming +1 per turn (max +3), ambush +5, target not moving +4, running −3, fast draw −3, called shot −4, off hand −3.', 'Three-round burst: +3 at close and medium range. If it hits, half of 1d6 rounds hit (round up).', 'Full auto: each point you beat the difficulty by is one more bullet hitting (up to the rounds fired). Close range gets +1 per 10 rounds; longer ranges −1 per 10.']],
      ['Weapon ranges', ['Pistol 50 m · SMG 150 m · Shotgun 50 m · Rifle 400 m · Thrown BODY × 10 m.', 'Range bands from the weapon\'s range: Point blank (next to them) 10 · Close (¼) 15 · Medium (½) 20 · Long (full) 25 · Extreme (2×) 30.']],
      ['Attack modifiers', ['Ambush +5 · Target immobile +4 · Large target +4 · 3-round burst +3 (close/medium) · Smartgun link +2 · Smartgoggles +2 · Targeting scope +2 · Target silhouetted +2 · Turret mounted +2 · Laser sight +1 · Aiming +1 per round (max +3).', 'Target dodging −2 · Turning to face −2 · Running −3 · Fast draw −3 · Off hand −3 · Called shot −4.']],
      ['Cover SP', ['Sheetrock 5 · Wood door 5 · Concrete 10 · Car body 10 · Heavy wood 15 · Steel door 20 · Brick wall 25 · Mailbox 25 · Curb 25 · Stone wall 30 · Tree/pole 30 · Engine block 35 · Hydrant 35.']],
      ['Unarmed', ['Punch or strike 1d6 ÷ 2 · Kick 1d6. Add the strength damage bonus. Martial Arts adds its skill level to the damage.']],
      ['Melee', ['Attacker: 1d10 + REF + melee skill. Defender: 1d10 + REF + Dodge & Escape (or their melee skill). Higher wins.', 'Strength damage bonus by BODY: 2 → −2 · 3-4 → −1 · 5-7 → 0 · 8-9 → +1 · 10 → +2 · 11-12 → +4 · 13-14 → +6 · 15+ → +8.']],
      ['Hit location (1d10)', ['1 Head · 2-4 Torso · 5 Right arm · 6 Left arm · 7-8 Right leg · 9-10 Left leg.']],
      ['Damage, step by step', ['1. Roll weapon damage.', '2. Subtract the armor SP at the hit location.', '3. Head hit: double what got through.', '4. Subtract the Body Type Modifier (BTM). If anything got past the armor, at least 1 point still lands.', '5. Mark it on the wound track. Armor that was beaten loses 1 SP.', 'More than 8 points to a limb in one hit: the limb is lost, and the character makes a death save at Mortal 0. A head hit doing 8 or more before doubling kills outright.']],
      ['Wounds', ['4 boxes per level. Light (1-4): no penalty. Serious (5-8): REF −2. Critical (9-12): REF, INT and COOL halved.', 'Mortal 0-6 (13-40): REF, INT and COOL ÷3, and you make a death save every turn. 41+: dead.']],
      ['Saves', ['Stun/Shock save (whenever you take damage): roll 1d10, you need BODY or less. Subtract the wound penalty first: Serious −1, Critical −2, Mortal 0 −3, and so on. Fail and you are out of the fight.', 'Death save (when mortally wounded, every turn): 1d10, you need BODY minus your Mortal level or less. Fail and you die.']],
      ['Body type', ['BTM by BODY: 2 → 0 · 3-4 → −1 · 5-7 → −2 · 8-9 → −3 · 10 → −4 · 11+ → −5.', 'Run = MA × 3 metres per turn. Leap = Run ÷ 4. Lift = BODY × 40 kg.']],
      ['Humanity & cyberware', ['Humanity = EMP × 10. Every implant costs Humanity Loss (HL).', 'For every full 10 points of Humanity lost, EMP drops by 1. At EMP 0 the character is a cyberpsycho and becomes the DM\'s.']]
    ],
    red: [
      ['Skill checks', ['Roll 1d10 + STAT + SKILL against a Difficulty Value (DV): Simple 9 · Everyday 13 · Difficult 15 · Professional 17 · Heroic 21 · Incredible 24 · Legendary 29.', 'A natural 10: roll again and add it. A natural 1: roll again and subtract it.', 'Contested checks: both sides roll and the higher total wins. Ties go to the defender.']],
      ['Turn order', ['Initiative: 1d10 + REF.', 'On your turn: one Move Action (up to MOVE × 2 metres) and one Action.']],
      ['Ranged attacks', ['Roll 1d10 + REF + weapon skill against the DV from your weapon type\'s range table (core rulebook).', 'A target with REF 8 or more can choose to dodge with DEX + Evasion instead of using the DV.', 'Aimed shot: −8 to hit. On the head, damage that gets through armor is doubled.']],
      ['Melee', ['Attacker: 1d10 + DEX + melee skill. Defender: 1d10 + DEX + Evasion.']],
      ['Damage', ['Roll the weapon\'s dice and subtract the SP of the head or body armor. What gets through comes off Hit Points.', 'Armor that is beaten loses 1 SP (ablation).', 'Two or more 6s on the damage dice is a Critical Injury: 5 extra damage that ignores armor, plus an injury from the table.']],
      ['Weapon damage by type', ['Medium pistol 2d6 · Heavy pistol 3d6 · Very heavy pistol 4d6 · SMG 2d6 · Heavy SMG 3d6.', 'Shotgun 5d6 · Assault rifle 5d6 · Sniper rifle 5d6 · Bow or crossbow 4d6 · Grenade launcher 6d6 · Rocket launcher 8d6.', 'Melee: light 1d6 · medium 2d6 · heavy 3d6 · very heavy 4d6.']],
      ['Armor (SP)', ['Leathers 4 · Kevlar 7 · Light armorjack 11 · Bodyweight suit 11 · Medium armorjack 12 · Heavy armorjack 13 · Flak 15 · Metalgear 18.']],
      ['Hit Points & wounds', ['HP = 10 + 5 × ((BODY + WILL) ÷ 2, rounded up).', 'Seriously Wounded (under half HP): −2 to all actions.', 'Mortally Wounded (under 1 HP): −4 to all actions, −6 MOVE, and a death save at the start of every turn. Roll 1d10 and you must get under your BODY. Each save makes the next one harder.']],
      ['Humanity & cyberware', ['Humanity = EMP × 10. Installing cyberware costs Humanity Loss.', 'EMP drops 1 for every full 10 Humanity lost. Run out and you are a cyberpsycho.']]
    ]
  };
  function rulesFor(line) { return (S && S.houseRules && S.houseRules[line]) || QUICK_REF[line]; }
  function openQuickRef(line, editing) {
    const custom = !!(S && S.houseRules && S.houseRules[line]);
    const m = modal((line === 'red' ? 'Cyberpunk RED' : 'Cyberpunk 2020') + ': rules quick reference' + (custom ? ' (house rules)' : ''), true);
    if (editing && isGM()) return editQuickRef(m, line);
    const q = el('input', { class: 'grow', placeholder: 'Filter, e.g. head, autofire, death' });
    const body = el('div', { class: 'col', style: 'gap:12px' });
    const draw = () => { body.textContent = ''; const t = q.value.trim().toLowerCase();
      for (const [title, lines] of rulesFor(line)) { const ls = t ? lines.filter(x => (title + ' ' + x).toLowerCase().includes(t)) : lines; if (!ls.length) continue;
        body.append(el('div', { class: 'box', style: 'border:1px solid var(--line);padding:10px' }, el('div', { class: 'section-h', style: 'margin:0 0 6px', text: title }), ...ls.map(x => el('div', { style: 'margin:3px 0;line-height:1.45;white-space:pre-wrap', text: x })))); }
      if (!body.children.length) body.append(el('div', { class: 'dim', text: 'Nothing matches.' })); };
    q.oninput = draw; draw();
    m.append(el('div', { class: 'row', style: 'margin-bottom:10px' }, q,
        isGM() ? el('button', { class: 'small pink', text: '✏ Edit rules', title: 'Change these rules for your game (players see your version)', onclick: () => openQuickRef(line, true) }) : null,
        el('button', { class: 'small', text: line === 'red' ? 'Switch to 2020' : 'Switch to RED', onclick: () => openQuickRef(line === 'red' ? '2020' : 'red') })), body,
      el('p', { class: 'dim', style: 'font-size:.78rem;margin-top:12px', text: custom ? "These are your DM's house rules for this game." : 'A short summary written for Night City Table. For full rules, open your rulebook in the Books tab. Your DM\'s ruling always wins.' }));
  }
  function editQuickRef(m, line) {
    const work = rulesFor(line).map(([t, ls]) => [t, ls.slice()]);
    const body = el('div', { class: 'col', style: 'gap:10px' });
    const draw = () => {
      body.textContent = '';
      work.forEach((sec, i) => {
        const title = el('input', { class: 'grow', value: sec[0], placeholder: 'Section title', oninput: e => { sec[0] = e.target.value; } });
        const ta = el('textarea', { style: 'width:100%;min-height:' + Math.min(260, 40 + sec[1].length * 38) + 'px;line-height:1.45', value: sec[1].join('\n'), placeholder: 'One rule per line', oninput: e => { sec[1] = e.target.value.split('\n'); } });
        body.append(el('div', { style: 'border:1px solid var(--line);padding:8px' },
          el('div', { class: 'row', style: 'margin-bottom:6px' }, title,
            el('button', { class: 'small ghost', text: '↑', title: 'Move up', disabled: i === 0, onclick: () => { work.splice(i - 1, 0, work.splice(i, 1)[0]); draw(); } }),
            el('button', { class: 'small ghost', text: '↓', title: 'Move down', disabled: i === work.length - 1, onclick: () => { work.splice(i + 1, 0, work.splice(i, 1)[0]); draw(); } }),
            el('button', { class: 'small danger', text: '✕', title: 'Delete this section', onclick: () => askConfirm('Delete this section?', '"' + (sec[0] || 'untitled') + '" and its rules will be removed when you save.', 'Delete', () => { work.splice(i, 1); draw(); }) })),
          ta));
      });
    };
    const save = () => { request({ type: 'rules.set', line, sections: work.map(([t, ls]) => [t.trim(), ls.map(x => x.trim()).filter(Boolean)]).filter(x => x[1].length) }); toast('House rules saved. Players see your version.'); setTimeout(() => openQuickRef(line), 150); };
    m.append(el('p', { class: 'dim', text: 'Change, add or remove anything. Each line in a box is one rule. Players see your version in this game.' }), body,
      el('div', { class: 'row', style: 'margin-top:12px;flex-wrap:wrap' },
        el('button', { text: '+ Add section', onclick: () => { work.push(['New rules', ['']]); draw(); setTimeout(() => { const ins = body.querySelectorAll('input'); ins[ins.length - 1].select(); }, 0); } }),
        el('button', { class: 'ghost', text: '↺ Reset to original', onclick: () => askConfirm('Go back to the original rules?', 'Your house rules for this game will be replaced with the original quick reference.', 'Reset', () => { request({ type: 'rules.set', line, sections: null }); toast('Back to the original rules'); setTimeout(() => openQuickRef(line), 150); }) }),
        el('div', { class: 'grow' }),
        el('button', { class: 'ghost', text: 'Cancel', onclick: () => openQuickRef(line) }),
        el('button', { class: 'primary', text: '✓ Save house rules', onclick: save })));
    draw();
  }

  // ================= TOKEN SIZE & AMMO TRACKER =================
  const SIZE_PRESETS = [[0.5, '½'], [1, '1'], [2, '2'], [3, '3'], [4, '4']];
  function setTokenSize(t, size) { const m = activeMap(); if (!m) return; size = Math.max(0.25, Math.min(10, Math.round(size * 4) / 4)); t.size = size; draw(); request({ type: 'token.update', mapId: m.id, id: t.id, patch: { size } }); }
  function renderTokenHud() {
    const hud = $('#tokenhud'); if (!hud) return;
    const m = S && activeMap(); const t = m && selected && m.tokens[selected];
    if (!t || !canMoveToken(t)) { hud.classList.add('hidden'); return; }
    if (hud.contains(document.activeElement) && document.activeElement.type === 'range') return;
    hud.classList.remove('hidden'); hud.textContent = '';
    const sh = t.sheetId && S.sheets[t.sheetId];
    hud.append(el('span', { class: 'tn', text: t.name || (sh && sh.name) || 'Token' }), el('span', { class: 'dim', text: 'Size' }),
      el('button', { class: 'small', text: '−', title: 'Smaller', onclick: () => setTokenSize(t, t.size - (t.size <= 1 ? 0.25 : 1)) }),
      el('span', { class: 'sz', text: (t.size % 1 ? t.size : t.size) + (t.size === 1 ? ' sq' : ' sq') }),
      el('button', { class: 'small', text: '+', title: 'Bigger', onclick: () => setTokenSize(t, t.size + (t.size < 1 ? 0.25 : 1)) }),
      el('input', { type: 'range', min: 0.25, max: 10, step: 0.25, value: t.size, title: 'Drag to resize', oninput: e => { t.size = Number(e.target.value); draw(); hud.querySelector('.sz').textContent = t.size + ' sq'; }, onchange: e => setTokenSize(t, Number(e.target.value)) }),
      ...SIZE_PRESETS.map(([v, l]) => el('button', { class: 'small' + (t.size === v ? ' primary' : ' ghost'), text: l, title: v + ' square' + (v === 1 ? '' : 's') + ' wide', onclick: () => setTokenSize(t, v) })),
      el('button', { class: 'small ghost', text: '✕', title: 'Deselect', onclick: () => { selected = null; draw(); renderTokenHud(); } }));
  }
  function openTokenSize(t) {
    const m = modal('Token size: ' + (t.name || 'token'));
    const val = el('div', { style: 'font-family:var(--display);font-size:2rem;color:var(--p);text-align:center', text: t.size + ' squares' });
    const r = el('input', { type: 'range', min: 0.25, max: 10, step: 0.25, value: t.size, style: 'width:100%', oninput: e => { t.size = Number(e.target.value); val.textContent = t.size + ' squares'; draw(); } });
    m.append(val, r, el('div', { class: 'row', style: 'flex-wrap:wrap;margin:10px 0' }, ...[[0.5, 'Tiny ½'], [1, 'Normal 1'], [2, 'Large 2'], [3, 'Huge 3'], [4, 'Vehicle 4'], [6, 'Big vehicle 6']].map(([v, l]) => el('button', { class: 'small', text: l, onclick: () => { r.value = v; r.oninput({ target: r }); } }))),
      el('p', { class: 'dim', style: 'font-size:.8rem', text: 'Size is how many grid squares wide the token is. One square is about 2 metres.' }),
      el('div', { class: 'row' }, el('div', { class: 'grow' }), el('button', { class: 'primary', text: 'Done', onclick: () => { setTokenSize(t, t.size); closeModal(); } })));
  }

  // ammo: rounds left in each gun, shown outside the sheet for your active character
  const magSize = w => parseInt(w.shots, 10) || 0;
  function ammoSheet() {
    if (!S) return null;
    const mine = Object.values(S.sheets).filter(x => canEditSheet(x)); if (!mine.length) return null;
    let cur = S.sheets[LS.get('nct-active-sheet-' + S.id, '')]; if (!cur || !canEditSheet(cur)) cur = mine[0];
    return cur;
  }
  function useAmmo(sh, wi, n, quiet) {
    const s2 = N.clone(sh); const w = s2.weapons[wi]; if (!w || !magSize(w)) return true;
    if (w.left <= 0) { toast('*Click* ' + (w.name || 'Weapon') + ' is empty. Reload!', true); return false; }
    const used = Math.min(n, w.left); w.left -= used; request({ type: 'sheet.upsert', sheet: s2 });
    if (!quiet && used < n) toast('Only ' + used + ' round' + (used === 1 ? '' : 's') + ' left to fire');
    return true;
  }
  function reload(sh, wi) {
    const s2 = N.clone(sh); const w = s2.weapons[wi]; if (!w) return;
    if (w.mags > 0) w.mags -= 1; else toast('Reloaded (no spare magazines tracked)');
    w.left = magSize(w); request({ type: 'sheet.upsert', sheet: s2 });
  }
  let ammoOpen = LS.get('nct-ammo-open', true);
  function renderAmmoBar() {
    const bar = $('#ammobar'); if (!bar) return;
    const sh = ammoSheet(); const guns = sh ? sh.weapons.map((w, i) => [w, i]).filter(([w]) => magSize(w) > 0) : [];
    if (!guns.length) { bar.classList.add('hidden'); return; }
    if (bar.contains(document.activeElement) && document.activeElement.matches('input')) return;
    bar.classList.remove('hidden'); bar.textContent = '';
    bar.append(el('div', { class: 'row', style: 'cursor:pointer', onclick: () => { ammoOpen = !ammoOpen; LS.set('nct-ammo-open', ammoOpen); renderAmmoBar(); } },
      el('span', { class: 'section-h grow', style: 'margin:0', text: (ammoOpen ? '▾ ' : '▸ ') + 'Ammo · ' + sh.name }),
      ammoOpen ? null : el('span', { class: 'dim', style: 'font-size:.75rem', text: guns.map(([w]) => w.left + '/' + magSize(w)).join('  ') })));
    if (!ammoOpen) return;
    for (const [w, i] of guns) {
      const max = magSize(w), left = Math.max(0, Math.min(w.left, max));
      bar.append(el('div', { class: 'ammo' },
        el('span', { class: 'an', text: w.name || 'Weapon', title: w.name }),
        el('span', { class: 'ac' + (left === 0 ? ' empty' : left <= Math.ceil(max / 4) ? ' low' : ''), text: left + ' / ' + max + (w.mags ? '  +' + w.mags + ' mag' + (w.mags === 1 ? '' : 's') : '') }),
        max <= 60 ? el('div', { class: 'rounds' }, ...Array.from({ length: max }, (_, k) => el('i', { class: k < left ? '' : 'e' }))) : null,
        el('div', { class: 'ab' },
          el('button', { class: 'small pink', text: '🎯', title: 'Attack your target with this gun', onclick: () => openAttack(i) }),
          el('button', { class: 'small', text: '−1', title: 'Fire one round', onclick: () => useAmmo(sh, i, 1) }),
          el('button', { class: 'small', text: '−3', title: 'Three-round burst', onclick: () => useAmmo(sh, i, 3) }),
          el('button', { class: 'small', text: '−10', title: 'Full auto (10 rounds)', onclick: () => useAmmo(sh, i, 10) }),
          el('button', { class: 'small ghost', text: '−?', title: 'Fire a chosen number of rounds', onclick: () => askText('How many rounds?', String(Number(w.rof) || 10), v => { const n = parseInt(v, 10); if (n > 0) useAmmo(sh, i, n); }) }),
          el('button', { class: 'small primary', text: '⟳ Reload', onclick: () => reload(sh, i) }),
          el('button', { class: 'small ghost', text: 'mags −', title: 'One fewer spare magazine', onclick: () => { const s2 = N.clone(sh); s2.weapons[i].mags = Math.max(0, (s2.weapons[i].mags || 0) - 1); request({ type: 'sheet.upsert', sheet: s2 }); } }),
          el('button', { class: 'small ghost', text: 'mags +', title: 'One more spare magazine', onclick: () => { const s2 = N.clone(sh); s2.weapons[i].mags = (s2.weapons[i].mags || 0) + 1; request({ type: 'sheet.upsert', sheet: s2 }); } }))));
    }
  }

  // ================= TARGETING & ATTACKS =================
  let targetId = null;
  function myTokenOnMap() {
    const m = activeMap(); const sh = ammoSheet(); if (!m || !sh) return null;
    return Object.values(m.tokens).find(t => t.sheetId === sh.id) || null;
  }
  function setTarget(t) { targetId = t ? t.id : null; draw(); renderAmmoBar(); if (t) toast('🎯 Target: ' + (t.name || (S.sheets[t.sheetId] && S.sheets[t.sheetId].name) || 'token')); }
  function drawTargeting(m, v) {
    const t = targetId && m.tokens[targetId]; if (!t || (t.hidden && !isGM())) return;
    const g = m.grid.size, p = t.size * g, cx = t.x + p / 2, cy = t.y + p / 2, r = p / 2 + 6 / v.z;
    ctx.save(); ctx.strokeStyle = '#ff3344'; ctx.lineWidth = 2.5 / v.z; ctx.shadowColor = '#ff3344'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    for (const a of [0, 1, 2, 3]) { const ang = a * Math.PI / 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * (r - 8 / v.z), cy + Math.sin(ang) * (r - 8 / v.z)); ctx.lineTo(cx + Math.cos(ang) * (r + 10 / v.z), cy + Math.sin(ang) * (r + 10 / v.z)); ctx.stroke(); }
    const mine = myTokenOnMap();
    if (mine && mine.id !== t.id) {
      const q = mine.size * g, x1 = mine.x + q / 2, y1 = mine.y + q / 2; const dist = N.tokenDistance(m, mine, t);
      ctx.setLineDash([6 / v.z, 6 / v.z]); ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(cx, cy); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      const label = '🎯 ' + dist + ' m'; ctx.font = 'bold ' + (14 / v.z) + 'px "Share Tech Mono", monospace'; const tw = ctx.measureText(label).width;
      const lx = (x1 + cx) / 2 - tw / 2, ly = (y1 + cy) / 2 - 8 / v.z;
      ctx.fillStyle = '#000d'; ctx.fillRect(lx - 4 / v.z, ly - 14 / v.z, tw + 8 / v.z, 19 / v.z); ctx.fillStyle = '#ff3344'; ctx.fillText(label, lx, ly);
    }
    ctx.restore();
  }
  function openAttack(weaponChoice) {
    const m = activeMap(); if (!m) return toast('Put up a map first', true);
    const sh = ammoSheet(); if (!sh) return toast('Make or import a character first', true);
    const me2 = myTokenOnMap(); if (!me2) return toast('Place ' + sh.name + ' on the map first (Sheets → Place)', true);
    const tgt = targetId && m.tokens[targetId];
    if (!tgt || tgt.id === me2.id) return toast('Pick a target first: use the 🎯 tool, or right-click a token → Target', true);
    const tsh = tgt.sheetId && S.sheets[tgt.sheetId]; const tName = (tsh && tsh.name) || tgt.name || 'target';
    const dist = N.tokenDistance(m, me2, tgt);
    const mm = modal('🎯 ' + sh.name + ' attacks ' + tName, true);
    const wsel = el('select', { class: 'grow' }, ...sh.weapons.map((w, i) => el('option', { value: String(i), text: (w.name || 'Weapon') + ' · ' + (w.damage || '?') + (parseInt(w.shots, 10) ? ' · ' + (w.left ?? w.shots) + '/' + w.shots + ' rds' : '') , selected: String(weaponChoice) === String(i) })),
      el('option', { value: 'unarmed:punch', text: 'Unarmed: Punch (1d6/2)', selected: weaponChoice === 'unarmed:punch' }), el('option', { value: 'unarmed:kick', text: 'Unarmed: Kick (1d6)' }), el('option', { value: 'unarmed:strike', text: 'Unarmed: Strike (1d6/2)' }));
    if (weaponChoice === undefined && !sh.weapons.length) wsel.value = 'unarmed:punch';
    const mode = el('select', null, el('option', { value: 'single', text: 'Single shot' }), el('option', { value: 'burst', text: '3-round burst (+3 close/medium)' }), el('option', { value: 'auto', text: 'Full auto' }));
    const rounds = el('input', { type: 'number', value: 10, min: 1, max: 200, style: 'width:70px', title: 'Rounds fired' });
    const called = el('select', null, el('option', { value: '', text: 'Random (roll 1d10)' }), ...N.LOCS.map(([k, l]) => el('option', { value: k, text: 'Called shot: ' + l + ' (−4)' })));
    const cover = el('select', null, el('option', { value: '0', text: 'No cover' }), ...N.COVER.map(([n, v]) => el('option', { value: String(v), text: n + ' (SP ' + v + ')' })));
    const ap = el('input', { type: 'checkbox' });
    const extra = el('input', { value: '', placeholder: 'e.g. +2 or -3', style: 'width:110px', title: 'Anything else the DM says' });
    const draft = N.clone(sh);
    const chips = el('div');
    const preview = el('div', { class: 'mono', style: 'background:var(--field);border:1px solid var(--line);padding:10px;line-height:1.7;white-space:pre-wrap;margin-top:10px' });
    const modsStr = kind => activeMods(draft, kind).map(md => modValue(draft, md)).join('');
    const update = () => {
      const wv = wsel.value; const w = wv.startsWith('unarmed:') ? null : draft.weapons[Number(wv)];
      const melee = !w || N.isMeleeWeapon(w);
      mode.disabled = melee; rounds.style.display = mode.value === 'auto' && !melee ? '' : 'none';
      const lines = ['Distance to ' + tName + ': ' + dist + ' m'];
      if (melee) { lines.push(dist > 3 ? '⚠ Too far for melee: move next to them first' : 'Melee: your roll vs their REF + Dodge & Escape (they roll automatically)'); }
      else {
        const range = N.weaponRange(w, draft), band = N.rangeBand(dist, range);
        lines.push('Weapon range ' + range + ' m → ' + (band < 0 ? '⚠ OUT OF RANGE (max ' + range * 2 + ' m)' : N.RANGE_BANDS[band][0] + ': you need ' + N.RANGE_BANDS[band][1] + ' or more'));
        const mag = parseInt(w.shots, 10) || 0; if (mag) lines.push('Ammo: ' + (w.left ?? mag) + ' / ' + mag + (mode.value === 'burst' ? ' → uses 3' : mode.value === 'auto' ? ' → uses ' + rounds.value : ' → uses 1'));
      }
      const skillName = w ? (w.skill || N.weaponSkill(w.type)) : (((draft.skills.find(k => k.name === 'Martial Arts') || {}).value || 0) > ((draft.skills.find(k => k.name === 'Brawling') || {}).value || 0) ? 'Martial Arts' : 'Brawling');
      const sk = (draft.skills.find(k => k.name.toLowerCase() === skillName.toLowerCase()) || { value: 0 }).value;
      const tog = modsStr('hit');
      lines.push('Your roll: 1d10! + REF ' + N.effStat(draft, 'REF') + ' + ' + skillName + ' ' + sk + (w && Number(w.wa) ? ' + WA ' + w.wa : '') + (called.value ? ' − 4 called shot' : '') + (tog ? ' ' + tog + ' (toggles)' : '') + (extra.value ? ' ' + extra.value : ''));
      const dt = modsStr('dmg'); lines.push('Damage on a hit: ' + (w ? w.damage : (wv === 'unarmed:kick' ? '1d6' : '1d6 ÷ 2')) + (dt ? ' ' + dt + ' (toggles)' : '') + (Number(cover.value) ? ' · target behind SP ' + cover.value + ' cover' : '') + (ap.checked ? ' · AP (armor halved)' : ''));
      if (tsh) lines.push(tName + ': SP ' + N.LOCS.map(([k, l]) => l + ' ' + (tsh.sp[k] || 0)).join(', ') + ' · BTM ' + N.derived(tsh).btm);
      else if (tgt.sheetId) lines.push(tName + " is the DM's character: their armor and wounds are worked out by the DM's app.");
      else lines.push(tName + ' has no character sheet, so damage is only reported (not applied).');
      preview.textContent = lines.join('\n');
      chips.textContent = ''; chips.append(el('div', { class: 'dim', style: 'font-size:.75rem;margin:6px 0 3px', text: 'Toggles (click to switch on/off):' }), modChips(draft, true, () => { saveSheetNow(draft); update(); }));
    };
    [wsel, mode, rounds, called, cover, ap, extra].forEach(x => x.addEventListener('input', update));
    const go = () => {
      const x = (extra.value || '').trim(); if (x && N.cleanModValue(x) === null) return toast('"' + x + '" isn\'t a modifier like +2 or -3', true);
      const names = activeMods(draft, 'hit').map(md => md.name + ' ' + modValue(draft, md)).concat(x ? ['DM ' + N.cleanModValue(x)] : []);
      request({ type: 'attack', mapId: m.id, attackerToken: me2.id, targetToken: tgt.id, weapon: wsel.value, mode: mode.value, rounds: Number(rounds.value) || 10,
        called: called.value, cover: Number(cover.value) || 0, ap: ap.checked, hitMod: modsStr('hit') + (x ? N.cleanModValue(x) : ''), dmgMod: modsStr('dmg'), hitNote: names.join(', ') });
      closeModal(); if (curTab !== 'chat') flashChat();
    };
    mm.append(el('div', { class: 'col' },
      el('div', { class: 'row' }, el('label', { text: 'Weapon' }), wsel),
      el('div', { class: 'row', style: 'flex-wrap:wrap' }, el('label', { text: 'Fire' }), mode, rounds, el('label', { text: 'Aim' }), called),
      el('div', { class: 'row', style: 'flex-wrap:wrap' }, el('label', { text: 'Target cover' }), cover, el('label', { class: 'row' }, ap, 'Armor-piercing ammo'), el('label', { text: 'Extra' }), extra)),
      chips, preview,
      el('div', { class: 'row', style: 'margin-top:12px' }, el('div', { class: 'grow' }), el('button', { class: 'ghost', text: 'Cancel', onclick: closeModal }), el('button', { class: 'pink', style: 'padding:10px 22px', text: '🎯 ATTACK', onclick: go })));
    update();
  }
  function combatMsgEl(m) {
    const c = m.combat;
    const d = el('div', { class: 'msg combat' + (c.hit ? ' hit' : ' miss'), style: '--c:' + (c.hit ? 'var(--red)' : 'var(--dim)') },
      el('span', { class: 'when', text: timeStr(m.ts) }), el('div', { class: 'who', text: '🎯 ' + c.title }),
      el('div', { class: 'total' }, c.hit ? (c.hits > 1 ? c.hits + ' HITS' : 'HIT') : 'MISS',
        c.hit && c.wounds ? el('span', { class: 'badge b-fail', text: c.wounds + ' WOUND' + (c.wounds === 1 ? '' : 'S') }) : null,
        c.hit && !c.wounds ? el('span', { class: 'badge b-vis', text: 'ARMOR STOPPED IT' }) : null,
        c.crit ? el('span', { class: 'badge b-crit', text: 'CRITICAL!' }) : null, c.fumble ? el('span', { class: 'badge b-fum', text: 'FUMBLE' }) : null),
      el('div', { class: 'brk', style: 'white-space:pre-wrap', text: c.lines.join('\n') }));
    return d;
  }

  // ================= RIGHT-CLICK: only the game's own menus =================
  // (text boxes keep the normal copy / paste menu)
  document.addEventListener('contextmenu', e => { if (!(e.target.closest && e.target.closest('input,textarea,[contenteditable="true"]'))) e.preventDefault(); });

  // ================= TOKEN: TURN / FLIP =================
  function tokenNow(t) { const m = activeMap(); return m && m.tokens[t.id]; }
  function updTok(t, patch) { const m = activeMap(); if (m) request({ type: 'token.update', mapId: m.id, id: t.id, patch }); }
  function openTurn(t0) {
    const m = modal('Turn / flip: ' + (t0.name || 'token'));
    const dirs = [['↖', 315], ['↑', 0], ['↗', 45], ['←', 270], ['', null], ['→', 90], ['↙', 225], ['↓', 180], ['↘', 135]];
    const slider = el('input', { type: 'range', min: 0, max: 359, step: 1, value: t0.rot || 0, class: 'grow' });
    const deg = el('span', { class: 'mono', style: 'width:48px', text: (t0.rot || 0) + '°' });
    const set = rot => { slider.value = rot; deg.textContent = rot + '°'; updTok(t0, { rot }); };
    slider.oninput = () => { deg.textContent = slider.value + '°'; };
    slider.onchange = () => set(Number(slider.value));
    m.append(el('p', { class: 'dim', text: 'Point the token the way it faces. Tip: select a token and press Q / E to turn it 45° (hold Shift for 15°), F to flip.' }),
      el('div', { class: 'turngrid' }, ...dirs.map(([a, r]) => r === null ? el('div', { class: 'turnc', text: '◎' }) : el('button', { class: 'turnb', text: a, title: r + '°', onclick: () => set(r) }))),
      el('div', { class: 'row', style: 'margin-top:10px' }, el('label', { text: 'Exact' }), slider, deg),
      el('div', { class: 'row', style: 'margin-top:10px' },
        el('button', { text: '⟲ 45°', onclick: () => set((((tokenNow(t0) || t0).rot || 0) + 315) % 360) }),
        el('button', { text: '⟳ 45°', onclick: () => set((((tokenNow(t0) || t0).rot || 0) + 45) % 360) }),
        el('button', { class: 'pink', text: '⇋ Flip (mirror)', onclick: () => updTok(t0, { flip: !(tokenNow(t0) || t0).flip }) }),
        el('div', { class: 'grow' }),
        el('button', { class: 'ghost', text: 'Reset', onclick: () => { set(0); updTok(t0, { flip: false }); } })));
  }

  // ================= TOKEN: FACES (transformations) =================
  function openFaces(t0) {
    const m = modal('Faces / transform: ' + (t0.name || 'token'), true);
    const list = el('div', { class: 'faces' });
    const sh = t0.sheetId && S.sheets[t0.sheetId];
    const draw = () => {
      const t = tokenNow(t0) || t0; const faces = t.faces || []; list.textContent = '';
      const card = (img, name, idx) => el('div', { class: 'facecard' + ((t.face || 0) === idx ? ' on' : ''), title: 'Switch to ' + name, onclick: () => { updTok(t, { face: idx }); setTimeout(draw, 80); } },
        img ? el('img', { src: img }) : el('div', { class: 'faceblank', text: (t.name || '?').slice(0, 2).toUpperCase() }), el('div', { class: 'fn', text: name }),
        idx > 0 ? el('button', { class: 'small ghost fx', text: '✕', title: 'Remove this face', onclick: e => { e.stopPropagation(); const nf = faces.filter((_, i) => i !== idx - 1); updTok(t, { faces: nf, face: (t.face === idx ? 0 : t.face > idx ? t.face - 1 : t.face) }); setTimeout(draw, 80); } }) : null);
      list.append(card(t.img || (sh && sh.portrait) || '', 'Normal', 0));
      faces.forEach((f, i) => list.append(card(f.img, f.name, i + 1)));
    };
    const addFace = url => { const t = tokenNow(t0) || t0; const faces = (t.faces || []).slice(); if (faces.length >= 8) return toast('A token can have up to 8 extra faces', true);
      askText('Name this face (e.g. "Combat mode", "Wolf form")', 'Face ' + (faces.length + 1), name => { faces.push({ name: name || 'Face', img: url }); updTok(t, { faces, face: faces.length }); setTimeout(() => openFaces(t0), 120); }); };
    m.append(el('p', { class: 'dim', text: 'Give this token extra looks for transformations, disguises or cyber-modes. Click a face to switch to it; everyone sees the change.' }), list,
      el('div', { class: 'row', style: 'margin-top:12px' },
        el('button', { class: 'primary', text: '+ Add face from a picture…', onclick: () => pickImage(320, url => addFace(url)) }),
        el('button', { class: 'pink', text: '🪙 Make one in the token maker…', onclick: () => openTokenMaker(url => addFace(url)) })));
    draw();
  }

  // ================= TOKEN: CONDITIONS =================
  function openConditions(t0) {
    const m = modal('Conditions: ' + (t0.name || 'token'));
    const box = el('div', { class: 'condgrid' });
    const draw = () => {
      const t = tokenNow(t0) || t0; const on = new Set(t.conds || []); box.textContent = '';
      for (const [k, label, icon] of N.CONDITIONS) box.append(el('button', { class: 'cond' + (on.has(k) ? ' on' : ''), onclick: () => { const n = new Set((tokenNow(t0) || t0).conds || []); n.has(k) ? n.delete(k) : n.add(k); updTok(t0, { conds: [...n] }); setTimeout(draw, 80); } },
        el('span', { class: 'ci', text: icon }), label));
    };
    m.append(el('p', { class: 'dim', text: 'Markers show as badges on the token for everyone.' }), box,
      el('div', { class: 'row', style: 'margin-top:10px' }, el('div', { class: 'grow' }), el('button', { class: 'ghost', text: 'Clear all', onclick: () => { updTok(t0, { conds: [] }); setTimeout(draw, 80); } })));
    draw();
  }

  // ================= TOKEN MAKER (TokenStamp-style) =================
  function openTokenMaker(onDone, opts) {
    opts = opts || {};
    const OUT = 320, P = 400; // saved size, preview size
    const m = modal('🪙 Token maker', true);
    const cv2 = el('canvas', { width: P, height: P, class: 'tm-canvas', title: 'Drag to move the picture, scroll (or pinch) to zoom' });
    const g = cv2.getContext('2d');
    const st = Object.assign({ img: null, x: 0, y: 0, z: 1, rot: 0, shape: 'circle', border: 'neon', color: LS.get('nct-tm-color', '#05d9e8'), color2: LS.get('nct-tm-color2', '#ff2a6d'), width: 10, bg: '#0b0f1a' }, LS.get('nct-tm', {}), { img: null });
    const SHAPES = [['circle', '● Circle'], ['square', '■ Square'], ['hex', '⬢ Hex']];
    const BORDERS = [['neon', 'Neon glow'], ['solid', 'Solid'], ['double', 'Double ring'], ['tech', 'Tech segments'], ['notch', 'Corner brackets'], ['none', 'No border']];
    function path(c, cx, cy, r) {
      c.beginPath();
      if (st.shape === 'circle') c.arc(cx, cy, r, 0, Math.PI * 2);
      else if (st.shape === 'square') { const k = r * 0.12; c.roundRect ? c.roundRect(cx - r, cy - r, 2 * r, 2 * r, k) : c.rect(cx - r, cy - r, 2 * r, 2 * r); }
      else { for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; c[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r); } c.closePath(); }
    }
    function render(c, S2) {
      const k = S2 / P, cx = S2 / 2, cy = S2 / 2, bw = st.border === 'none' ? 0 : st.width * k, r = S2 / 2 - bw / 2 - (st.border === 'neon' ? 10 * k : 2 * k);
      c.clearRect(0, 0, S2, S2);
      c.save(); path(c, cx, cy, r); c.fillStyle = st.bg; c.fill(); c.clip();
      if (st.img) { c.translate(cx + st.x * k, cy + st.y * k); c.rotate(st.rot * Math.PI / 180); const base = Math.max((2 * r) / st.img.naturalWidth, (2 * r) / st.img.naturalHeight) * st.z; c.drawImage(st.img, -st.img.naturalWidth * base / 2, -st.img.naturalHeight * base / 2, st.img.naturalWidth * base, st.img.naturalHeight * base); }
      c.restore();
      if (!bw) return;
      c.save(); c.lineWidth = bw; c.strokeStyle = st.color; c.lineJoin = 'round';
      if (st.border === 'neon') { c.shadowColor = st.color; c.shadowBlur = 14 * k; path(c, cx, cy, r); c.stroke(); c.shadowBlur = 0; c.lineWidth = Math.max(1, bw * 0.3); c.strokeStyle = '#ffffffcc'; path(c, cx, cy, r); c.stroke(); }
      else if (st.border === 'solid') { path(c, cx, cy, r); c.stroke(); }
      else if (st.border === 'double') { path(c, cx, cy, r); c.stroke(); c.lineWidth = Math.max(1, bw * 0.45); c.strokeStyle = st.color2; path(c, cx, cy, r - bw * 1.1); c.stroke(); }
      else if (st.border === 'tech') { path(c, cx, cy, r); c.strokeStyle = '#000'; c.stroke(); c.strokeStyle = st.color; c.setLineDash([r * 0.42, r * 0.12]); path(c, cx, cy, r); c.stroke(); c.setLineDash([]); c.lineWidth = Math.max(1, bw * 0.3); c.strokeStyle = st.color2; path(c, cx, cy, r - bw * 0.9); c.stroke(); }
      else if (st.border === 'notch') { path(c, cx, cy, r); c.lineWidth = Math.max(1, bw * 0.35); c.stroke(); c.lineWidth = bw; c.strokeStyle = st.color2;
        for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; c.beginPath(); if (st.shape === 'circle' || st.shape === 'hex') c.arc(cx, cy, r, a - 0.28, a + 0.28); else { const sx = Math.sign(Math.cos(a)), sy = Math.sign(Math.sin(a)), L = r * 0.45; c.moveTo(cx + sx * r, cy + sy * (r - L)); c.lineTo(cx + sx * r, cy + sy * r); c.lineTo(cx + sx * (r - L), cy + sy * r); } c.stroke(); } }
      c.restore();
    }
    const draw = () => { render(g, P); if (!st.img) { g.fillStyle = '#8aa0c2'; g.font = '16px "Share Tech Mono", monospace'; g.textAlign = 'center'; g.fillText('Pick a picture (or paste one)', P / 2, P / 2); } };
    const setImg = src => { const im = new Image(); im.onload = () => { st.img = im; st.x = st.y = 0; st.z = 1; st.rot = 0; zoom.value = 1; draw(); }; im.onerror = () => toast("Couldn't open that picture", true); im.src = src; };
    const fromFile = f => { if (!f || !/^image\//.test(f.type)) return toast('That is not a picture', true); const rd = new FileReader(); rd.onload = () => setImg(rd.result); rd.readAsDataURL(f); };
    // drag & zoom
    let dragP = null;
    cv2.addEventListener('pointerdown', e => { if (!st.img) return; dragP = { x: e.clientX, y: e.clientY, ox: st.x, oy: st.y }; try { cv2.setPointerCapture(e.pointerId); } catch (er) { } });
    cv2.addEventListener('pointermove', e => { if (!dragP) return; const sc = P / cv2.getBoundingClientRect().width; st.x = dragP.ox + (e.clientX - dragP.x) * sc; st.y = dragP.oy + (e.clientY - dragP.y) * sc; draw(); });
    cv2.addEventListener('pointerup', () => { dragP = null; });
    cv2.addEventListener('wheel', e => { if (!st.img) return; e.preventDefault(); st.z = Math.max(0.2, Math.min(8, st.z * (e.deltaY < 0 ? 1.08 : 1 / 1.08))); zoom.value = st.z; draw(); }, { passive: false });
    cv2.addEventListener('dragover', e => e.preventDefault());
    cv2.addEventListener('drop', e => { e.preventDefault(); fromFile(e.dataTransfer.files[0]); });
    const onPaste = e => { const it = [...(e.clipboardData || {}).items || []].find(i => i.type.startsWith('image/')); if (it) fromFile(it.getAsFile()); };
    document.addEventListener('paste', onPaste);
    const zoom = el('input', { type: 'range', min: 0.2, max: 6, step: 0.01, value: 1, class: 'grow', oninput: e => { st.z = Number(e.target.value); draw(); } });
    const rotI = el('input', { type: 'range', min: -180, max: 180, step: 1, value: 0, class: 'grow', oninput: e => { st.rot = Number(e.target.value); draw(); } });
    const save = () => { LS.set('nct-tm', { shape: st.shape, border: st.border, color: st.color, color2: st.color2, width: st.width, bg: st.bg }); };
    const chooser = (list, key) => el('div', { class: 'row', style: 'flex-wrap:wrap;gap:4px' }, ...list.map(([k, l]) => { const b = el('button', { class: 'small' + (st[key] === k ? ' primary' : ''), text: l, onclick: () => { st[key] = k; save(); [...b.parentNode.children].forEach(x => x.classList.remove('primary')); b.classList.add('primary'); draw(); } }); return b; }));
    const color = (key, title) => el('input', { type: 'color', value: st[key], title, oninput: e => { st[key] = e.target.value; save(); draw(); } });
    const file = el('input', { type: 'file', accept: 'image/*', class: 'hidden', onchange: e => fromFile(e.target.files[0]) });
    const finish = () => {
      if (!st.img) return toast('Pick a picture first', true);
      const out = el('canvas', { width: OUT, height: OUT }); render(out.getContext('2d'), OUT);
      let url; try { url = out.toDataURL('image/png'); if (url.length > 500000) url = out.toDataURL('image/webp', 0.9); } catch (e) { return toast("That picture can't be used (the website it came from blocks it). Save it to your computer and pick the file instead.", true); }
      document.removeEventListener('paste', onPaste); closeModal(); onDone && onDone(url);
    };
    const dl = () => { if (!st.img) return toast('Pick a picture first', true); const out = el('canvas', { width: 512, height: 512 }); render(out.getContext('2d'), 512); const a = el('a', { href: out.toDataURL('image/png'), download: 'token.png' }); document.body.append(a); a.click(); a.remove(); };
    m.append(el('div', { class: 'tm' },
      el('div', { class: 'tm-left' }, cv2,
        el('div', { class: 'row' }, el('button', { class: 'primary grow', text: '🖼 Pick a picture…', onclick: () => file.click() }), file),
        el('div', { class: 'dim', style: 'font-size:.75rem;text-align:center', text: 'Drag to move · scroll to zoom · drop or paste (Ctrl+V) a picture' })),
      el('div', { class: 'tm-right col' },
        el('label', { text: 'Zoom' }), el('div', { class: 'row' }, zoom),
        el('label', { text: 'Rotate picture' }), el('div', { class: 'row' }, rotI),
        el('label', { text: 'Shape' }), chooser(SHAPES, 'shape'),
        el('label', { text: 'Border' }), chooser(BORDERS, 'border'),
        el('div', { class: 'row' }, el('label', { text: 'Colours' }), color('color', 'Main border colour'), color('color2', 'Accent colour'), el('label', { text: 'Background' }), color('bg', 'Colour behind see-through pictures')),
        el('label', { text: 'Border thickness' }), el('div', { class: 'row' }, el('input', { type: 'range', min: 2, max: 30, step: 1, value: st.width, class: 'grow', oninput: e => { st.width = Number(e.target.value); save(); draw(); } })),
        el('div', { class: 'row', style: 'margin-top:12px' }, el('button', { class: 'ghost', text: '⬇ Download PNG', onclick: dl }), el('div', { class: 'grow' }),
          el('button', { class: 'pink', style: 'padding:10px 20px', text: opts.saveLabel || '✓ Use this token', onclick: finish })))));
    const obs = new MutationObserver(() => { if (!document.body.contains(cv2)) { document.removeEventListener('paste', onPaste); obs.disconnect(); } }); obs.observe(document.body, { childList: true, subtree: true });
    draw();
    if (opts.src) setImg(opts.src);
  }

  // ================= NPC LIBRARY (DM only) =================
  // Generic Cyberpunk 2020-style opponents with ready sheets. Stats order: INT REF TECH COOL ATTR LUCK MA BODY EMP.
  // sp: [head, torso, arms, legs]. Weapons: [name, type, WA, damage, shots, ROF, reliability, range(m)].
  const W_ = {
    knife: ['Knife', 'Melee', 0, '1d6', '', '1', 'VR', '1'], club: ['Club / bat', 'Melee', 0, '1d6+2', '', '1', 'VR', '1'], chain: ['Chain', 'Melee', 0, '1d6+1', '', '1', 'VR', '2'],
    sword: ['Sword', 'Melee', 0, '2d6+2', '', '1', 'VR', '1'], mono: ['Monoknife', 'Melee', 1, '2d6', '', '1', 'VR', '1'], cyberclaws: ['Rippers (cyber claws)', 'Melee', 0, '1d6+3', '', '1', 'VR', '1'],
    lpistol: ['Light pistol', 'Pistol', 0, '1d6+1', '8', '2', 'ST', '50'], mpistol: ['Medium pistol', 'Pistol', 0, '2d6+1', '10', '2', 'ST', '50'], hpistol: ['Heavy pistol', 'Pistol', 0, '3d6', '8', '2', 'ST', '50'], vhpistol: ['Very heavy pistol', 'Pistol', -1, '4d6', '8', '1', 'ST', '50'],
    lsmg: ['Light SMG', 'SMG', 0, '1d6+2', '30', '25', 'ST', '150'], msmg: ['Medium SMG', 'SMG', 0, '2d6+1', '40', '20', 'ST', '150'], hsmg: ['Heavy SMG', 'SMG', -1, '3d6', '35', '15', 'UR', '150'],
    ar: ['Assault rifle', 'Rifle', 0, '5d6', '30', '30', 'VR', '400'], shotgun: ['Pump shotgun', 'Shotgun', 0, '4d6', '8', '1', 'ST', '50'], autoshot: ['Auto shotgun', 'Shotgun', -1, '4d6', '20', '10', 'ST', '50'],
    sniper: ['Sniper rifle', 'Rifle', 1, '6d6', '4', '1', 'VR', '800'], lmg: ['Light machine gun', 'Heavy', 0, '6d6', '100', '20', 'VR', '500'], gl: ['Grenade launcher', 'Heavy', 0, '6d6', '6', '1', 'VR', '150'],
    flame: ['Flamethrower', 'Heavy', -2, '2d10', '10', '1', 'ST', '50'], taser: ['Stun gun', 'Pistol', -1, 'Stun', '10', '1', 'ST', '10']
  };
  const NPC_LIB = [
    // ---- street ----
    { cat: 'Street', name: 'Boostergang punk', role: 'solo', st: [4, 6, 4, 5, 4, 4, 6, 6, 4], sa: 1, sk: { Brawling: 3, Handgun: 3, Melee: 3, 'Dodge & Escape': 2, Streetwise: 3, Intimidate: 2, Athletics: 2 }, sp: [0, 10, 10, 4], w: ['lpistol', 'chain'], cy: ['Cyberoptic: Times Square Marquee', 'Neural link'], note: 'Cheap chrome, loud and hopped up. Breaks and runs when half the gang is down.' },
    { cat: 'Street', name: 'Booster lieutenant', role: 'solo', st: [5, 8, 4, 7, 5, 5, 7, 7, 3], sa: 3, sk: { Brawling: 4, Submachinegun: 5, Handgun: 4, Melee: 4, 'Dodge & Escape': 3, Streetwise: 5, Intimidate: 4, Leadership: 3, 'Awareness/Notice': 3 }, sp: [10, 14, 14, 10], w: ['msmg', 'mono'], cy: ['Boosted reflexes (Kerenzikov) +1 initiative', 'Smartgun link', 'Muscle & bone lace (BODY +2)'], note: 'Runs a crew of 4–8 punks. Fights from cover and sends the punks in first.' },
    { cat: 'Street', name: 'Street thug', role: 'solo', st: [4, 5, 3, 5, 4, 4, 5, 7, 4], sa: 0, sk: { Brawling: 4, Melee: 3, Handgun: 2, Streetwise: 3, Intimidate: 3 }, sp: [0, 4, 0, 4], w: ['club', 'lpistol'], cy: [], note: 'Muscle for hire. Usually unchromed.' },
    { cat: 'Street', name: 'Chromed brawler', role: 'solo', st: [4, 7, 3, 6, 3, 4, 7, 10, 3], sa: 2, sk: { Brawling: 6, 'Martial Arts': 3, Melee: 4, 'Dodge & Escape': 4, Intimidate: 5, Athletics: 4, 'Strength Feat': 4 }, sp: [4, 14, 14, 10], w: ['cyberclaws'], cy: ['Cyberarm (x2) with rippers', 'Muscle & bone lace', 'Subdermal armor (SP 14 torso)'], note: 'Closes the distance fast. Hits hard: add the strength damage bonus.' },
    { cat: 'Street', name: 'Gang shooter', role: 'solo', st: [5, 7, 4, 6, 4, 5, 6, 6, 4], sa: 2, sk: { Handgun: 5, Rifle: 3, Submachinegun: 4, 'Dodge & Escape': 3, Stealth: 3, 'Awareness/Notice': 3, Streetwise: 3 }, sp: [0, 14, 14, 10], w: ['hpistol', 'lsmg'], cy: ['Cyberoptic: targeting scope'], note: 'The gang\'s best shot. Stays back and uses cover.' },
    { cat: 'Street', name: 'Organ legger (scav)', role: 'medtech', st: [6, 6, 7, 6, 3, 4, 6, 6, 2], sa: 2, sk: { 'First Aid': 5, Handgun: 3, Melee: 4, Stealth: 4, Pharmaceuticals: 4, 'Hide/Evade': 3, Streetwise: 4 }, sp: [0, 10, 10, 4], w: ['taser', 'knife', 'mpistol'], cy: ['Cyberoptic: IR'], note: 'Hunts the injured and helpless. Stuns first, cuts later. Flees from a real fight.' },
    // ---- corporate ----
    { cat: 'Corporate', name: 'Corp security guard', role: 'solo', st: [5, 6, 5, 6, 5, 5, 6, 7, 5], sa: 2, sk: { Handgun: 4, Submachinegun: 4, Brawling: 3, 'Awareness/Notice': 4, 'Dodge & Escape': 2, Driving: 2 }, sp: [14, 18, 14, 10], w: ['msmg', 'mpistol', 'taser'], cy: ['Neural link', 'Interface plugs', 'Radio link'], note: 'Calls for backup within a turn of trouble. Response team arrives in 1d6+2 turns.' },
    { cat: 'Corporate', name: 'Corp security elite', role: 'solo', st: [6, 9, 5, 8, 5, 5, 8, 8, 3], sa: 5, sk: { Rifle: 6, Handgun: 6, Submachinegun: 5, 'Martial Arts': 4, 'Dodge & Escape': 5, 'Awareness/Notice': 6, Athletics: 4, Stealth: 3 }, sp: [20, 20, 20, 14], w: ['ar', 'hpistol'], cy: ['Smartgun link', 'Boosted reflexes (Sandevistan) +3 initiative', 'Cyberoptic: low-light, targeting scope', 'Radio link'], note: 'Professional, works in fire teams of 3–4 with overlapping fields of fire.' },
    { cat: 'Corporate', name: 'Corporate exec', role: 'corp', st: [8, 5, 5, 8, 7, 6, 5, 5, 6], sa: 5, sk: { 'Human Perception': 5, 'Persuasion & Fast Talk': 6, Leadership: 5, Handgun: 2, Accounting: 5, 'Stock Market': 4, Social: 6, 'Wardrobe & Style': 5 }, sp: [0, 14, 14, 0], w: ['lpistol'], cy: ['Neural link', 'Cyberaudio: phone link', 'Biomonitor (calls Trauma Team)'], note: 'Never alone: has 2 guards. Trauma Team arrives 1d6 turns after the exec is hurt.' },
    { cat: 'Corporate', name: 'Corporate netrunner', role: 'netrunner', st: [9, 6, 7, 6, 4, 5, 5, 5, 4], sa: 6, sk: { Programming: 6, 'System Knowledge': 7, 'Electronic Security': 5, 'Cyberdeck Design': 3, Handgun: 2, 'Awareness/Notice': 4 }, sp: [0, 10, 10, 0], w: ['lpistol'], cy: ['Interface plugs', 'Neural link', 'Cyberdeck (5 programs)'], note: 'Usually in a secure room nearby. Can lock doors, cut lights and turn turrets on intruders.' },
    { cat: 'Corporate', name: 'Corporate assassin', role: 'solo', st: [7, 10, 5, 9, 6, 6, 8, 7, 2], sa: 7, sk: { Handgun: 7, Rifle: 6, Melee: 6, 'Martial Arts': 5, Stealth: 7, 'Dodge & Escape': 6, 'Awareness/Notice': 6, Disguise: 4, 'Shadow/Track': 5 }, sp: [10, 20, 20, 14], w: ['sniper', 'vhpistol', 'mono'], cy: ['Smartgun link', 'Boosted reflexes +3', 'Cyberoptics: thermo, low-light, targeting', 'Skinweave SP 12'], note: 'Works alone, from range first. Withdraws if spotted and tries again later.' },
    // ---- law ----
    { cat: 'Law', name: 'Beat cop', role: 'cop', st: [5, 6, 5, 6, 5, 5, 6, 6, 5], sa: 3, sk: { Handgun: 4, Rifle: 3, Brawling: 3, 'Awareness/Notice': 4, Driving: 3, Streetwise: 3, Interrogation: 2 }, sp: [0, 14, 14, 0], w: ['hpistol', 'shotgun', 'taser'], cy: ['Radio link'], note: 'Works in pairs. Calls it in and waits for backup against heavy chrome.' },
    { cat: 'Law', name: 'C-SWAT officer', role: 'cop', st: [6, 8, 5, 7, 5, 5, 7, 8, 4], sa: 5, sk: { Rifle: 6, Handgun: 5, 'Heavy Weapons': 3, Brawling: 4, 'Dodge & Escape': 4, Athletics: 4, 'Awareness/Notice': 5 }, sp: [20, 25, 20, 20], w: ['ar', 'autoshot', 'gl'], cy: ['Smartgun link', 'Radio link', 'Cyberoptic: low-light'], note: 'Arrives in a team of 4–6 with an AV. Uses gas and flashbangs before entering.' },
    { cat: 'Law', name: 'Psycho squad trooper', role: 'cop', st: [6, 9, 5, 8, 4, 5, 8, 9, 3], sa: 6, sk: { Rifle: 7, 'Heavy Weapons': 5, Handgun: 5, 'Martial Arts': 4, 'Dodge & Escape': 5, 'Awareness/Notice': 5 }, sp: [25, 25, 20, 20], w: ['lmg', 'vhpistol'], cy: ['Smartgun link', 'Boosted reflexes +2', 'Muscle & bone lace', 'Subdermal armor'], note: 'Hunts cyberpsychos. Fights to finish the target, not to arrest.' },
    { cat: 'Law', name: 'Detective', role: 'cop', st: [7, 6, 5, 7, 5, 6, 6, 6, 6], sa: 4, sk: { Handgun: 5, Interrogation: 5, 'Human Perception': 5, 'Awareness/Notice': 6, Streetwise: 5, 'Shadow/Track': 4, 'Library Search': 4 }, sp: [0, 14, 14, 0], w: ['hpistol'], cy: ['Cyberaudio: voice stress analyzer'], note: 'Asks questions first. Knows who in the area owes them favours.' },
    // ---- other ----
    { cat: 'Other', name: 'Nomad raider', role: 'nomad', st: [5, 7, 6, 6, 4, 5, 7, 7, 5], sa: 3, sk: { Rifle: 5, Driving: 6, Motorcycle: 5, Brawling: 4, Melee: 3, 'Wilderness Survival': 4, 'Basic Tech': 4 }, sp: [10, 14, 14, 10], w: ['shotgun', 'ar', 'knife'], cy: ['Cyberoptic: low-light'], note: 'Strikes from vehicles and leaves fast. Loyal to the family above all.' },
    { cat: 'Other', name: 'Mercenary veteran', role: 'solo', st: [6, 8, 5, 8, 4, 5, 7, 8, 3], sa: 5, sk: { Rifle: 6, 'Heavy Weapons': 4, Handgun: 5, Brawling: 4, 'Dodge & Escape': 4, 'Awareness/Notice': 5, 'First Aid': 3, Demolitions: 3 }, sp: [14, 20, 14, 14], w: ['ar', 'hpistol', 'knife'], cy: ['Smartgun link', 'Cyberarm with popup gun', 'Cyberoptic: targeting scope'], note: 'Fights for pay, not glory. Will take a better offer mid-fight.' },
    { cat: 'Other', name: 'Freelance netrunner', role: 'netrunner', st: [8, 6, 7, 6, 5, 6, 5, 4, 5], sa: 5, sk: { Programming: 5, 'System Knowledge': 6, 'Electronic Security': 4, Stealth: 3, Handgun: 2, Streetwise: 3 }, sp: [0, 10, 4, 0], w: ['lpistol'], cy: ['Interface plugs', 'Neural link', 'Cyberdeck'], note: 'Usually protected by a solo or two while jacked in.' },
    { cat: 'Other', name: 'Fixer', role: 'fixer', st: [7, 6, 5, 7, 6, 7, 6, 5, 6], sa: 5, sk: { Streetwise: 7, 'Persuasion & Fast Talk': 6, 'Human Perception': 5, Handgun: 4, Intimidate: 3, 'Awareness/Notice': 4 }, sp: [0, 14, 14, 0], w: ['mpistol'], cy: ['Cyberaudio: phone link, scrambler'], note: 'Has a bodyguard and a way out of every room.' },
    { cat: 'Other', name: 'Cyberpsycho', role: 'solo', st: [4, 10, 4, 10, 2, 5, 9, 11, 0], sa: 6, sk: { Brawling: 6, 'Martial Arts': 5, 'Heavy Weapons': 5, Rifle: 6, Melee: 6, 'Dodge & Escape': 5, Athletics: 5, Intimidate: 8 }, sp: [20, 25, 25, 20], w: ['lmg', 'cyberclaws', 'vhpistol'], cy: ['Two cyberarms with rippers and a popup gun', 'Boosted reflexes +3', 'Muscle & bone lace', 'Subdermal armor', 'Pain editor (ignores stun until mortal)'], note: 'Humanity gone. Attacks anything nearby. A job for the Psycho squad.' },
    { cat: 'Other', name: 'Trauma Team medic', role: 'medtech', st: [7, 7, 7, 7, 5, 5, 6, 6, 5], sa: 5, sk: { 'First Aid': 7, Pharmaceuticals: 5, Rifle: 4, Handgun: 4, 'Awareness/Notice': 4, 'Dodge & Escape': 3 }, sp: [20, 20, 20, 14], w: ['msmg'], cy: ['Biomonitor', 'Radio link'], note: 'Here to save one client, not to fight. Their gunner will shoot anyone in the way.' }
  ];
  function npcSheet(tp, name) {
    const s = N.blankSheet(null); s.name = name || tp.name; s.role = tp.role; s.specialAbility = tp.sa || 0;
    N.STATS.forEach((k, i) => { s.stats[k].base = tp.st[i]; });
    for (const [n, v] of Object.entries(tp.sk || {})) { const k = s.skills.find(x => x.name === n); if (k) k.value = v; else s.skills.push({ name: n, stat: '', value: v }); }
    s.sp = { head: tp.sp[0], torso: tp.sp[1], rArm: tp.sp[2], lArm: tp.sp[2], rLeg: tp.sp[3], lLeg: tp.sp[3] };
    s.weapons = (tp.w || []).map(k => { const [nm, type, wa, damage, shots, rof, rel, range] = W_[k]; return { name: nm, type, wa, damage, shots, rof, rel, range, skill: N.weaponSkill(type), notes: '', left: parseInt(shots, 10) || 0, mags: shots ? 2 : 0 }; });
    s.cyberware = (tp.cy || []).map(c => ({ name: c, hl: '', notes: '' }));
    s.notes = tp.note || ''; s.humanity = Math.max(0, tp.st[8] * 10 - (tp.cy || []).length * 6);
    return s;
  }
  function openNpcLibrary() {
    if (!isGM()) return;
    const m = modal('📚 NPC library (DM only)', true);
    const q = el('input', { placeholder: 'Search…', class: 'grow' });
    const count = el('input', { type: 'number', value: 1, min: 1, max: 12, style: 'width:64px', title: 'How many to add' });
    const place = el('input', { type: 'checkbox', checked: !!activeMap() });
    const hide = el('input', { type: 'checkbox', checked: false });
    const list = el('div', { class: 'npclist' });
    const add = tp => {
      const n = Math.max(1, Math.min(12, Number(count.value) || 1));
      for (let i = 1; i <= n; i++) {
        const s = npcSheet(tp, n > 1 ? tp.name + ' ' + i : tp.name);
        request({ type: 'sheet.upsert', sheet: s });
        if (place.checked && activeMap()) placeToken({ name: s.name, color: '#ff2a6d', sheetId: s.id, hidden: hide.checked });
      }
      toast('Added ' + n + ' × ' + tp.name + (place.checked && activeMap() ? ' to the map' : ' to Sheets'));
    };
    const draw = () => {
      list.textContent = ''; const f = q.value.trim().toLowerCase();
      for (const cat of ['Street', 'Corporate', 'Law', 'Other']) {
        const items = NPC_LIB.filter(t => t.cat === cat && (!f || (t.name + ' ' + t.note + ' ' + t.cy.join(' ')).toLowerCase().includes(f)));
        if (!items.length) continue;
        list.append(el('div', { class: 'section-h', text: cat }));
        for (const tp of items) {
          const sp = 'SP ' + tp.sp[0] + '/' + tp.sp[1], wpn = (tp.w || []).map(k => W_[k][0] + ' ' + W_[k][3]).join(', ');
          list.append(el('div', { class: 'npcrow' },
            el('div', { class: 'grow' }, el('b', { text: tp.name }), el('span', { class: 'dim', text: '  ' + ((N.ROLES[tp.role] || {}).label || tp.role) + ' · REF ' + tp.st[1] + ' · BODY ' + tp.st[7] + ' · ' + sp + ' head/torso' }),
              el('div', { class: 'dim', style: 'font-size:.8rem', text: wpn + (tp.cy.length ? ' · ' + tp.cy.length + ' cyberware' : '') }), el('div', { style: 'font-size:.8rem', text: tp.note })),
            el('button', { class: 'small ghost', text: 'Preview', onclick: () => { const s = npcSheet(tp); s.id = 'preview'; previewNpc(s); } }),
            el('button', { class: 'small primary', text: '+ Add', onclick: () => add(tp) })));
        }
      }
    };
    q.oninput = draw;
    m.append(el('p', { class: 'dim', text: 'Ready-made opponents with full sheets. Added NPCs are only visible to you, and you can edit them like any sheet.' }),
      el('div', { class: 'row', style: 'flex-wrap:wrap' }, q, el('label', { text: 'How many' }), count, el('label', { class: 'row' }, place, 'Place on the map'), el('label', { class: 'row' }, hide, 'Hidden from players')),
      list);
    draw();
  }
  function previewNpc(s) {
    const d = N.derived(s);
    const m = modal('Preview: ' + s.name);
    m.append(el('div', { class: 'mono', style: 'white-space:pre-wrap;line-height:1.6', text:
      N.STATS.map(k => k + ' ' + N.statVal(s, k)).join('  ') + '\nBTM ' + d.btm + ' · Save ' + d.save + ' · Run ' + d.run + ' m\n\nSkills: ' + s.skills.filter(k => k.value).map(k => k.name + ' ' + k.value).join(', ') +
      '\n\nArmor: ' + N.LOCS.map(([k, l]) => l + ' ' + s.sp[k]).join(', ') + '\n\nWeapons:\n' + s.weapons.map(w => '  ' + w.name + ' (' + w.type + ') WA ' + w.wa + ' · ' + w.damage + (w.shots ? ' · ' + w.shots + ' rds · ROF ' + w.rof : '') + ' · ' + w.range + ' m').join('\n') +
      (s.cyberware.length ? '\n\nCyberware:\n' + s.cyberware.map(c => '  ' + c.name).join('\n') : '') + '\n\n' + s.notes }));
  }

  // ================= LORE TIMELINE (DM only) =================
  // A summary of the canon Cyberpunk history (2020, RED and 2077 eras), written for Night City Table.
  const TIMELINE = [
    ['The road to the Collapse (1990s)', [
      ['Early 1990s', 'A shadow alliance of US intelligence and police agencies (the "Gang of Four") quietly takes control of the federal government.'],
      ['Early 1990s', 'Developer Richard Night lines up corporate backing for a planned, crime-free city on cheap land at Del Coronado Bay, a ghost town after a boostergang massacre.'],
      ['1994', 'The world stock market crashes after the US is caught rigging markets. Construction of Coronado City is under way and the city is incorporated.'],
      ['Mid-1990s', 'The Collapse: the US economy and government fall apart. Millions lose their homes and take to the roads as Nomads.'],
      ['1997', 'The Mideast Meltdown: a limited nuclear exchange wrecks much of the Middle East and cuts world oil supply sharply.'],
      ['20 Sept 1998', 'Richard Night is shot dead in his penthouse. The killer is never found. Coronado City is renamed Night City in his honour.'],
      ['1999', 'His widow Miriam Night turns his company into the Night foundation (later Night Corp) to keep his vision alive.']]],
    ['Mob rule and the corporations (1999–2020)', [
      ['1999–2009', 'Organised crime runs Night City. Gangs carve out turf and the streets become a war zone.'],
      ['2009–2011', 'The Mob War, the deadliest years in the city\'s history, ends when the megacorps (Arasaka at the front) send in paramilitary forces. The corps keep a firm grip on the city afterwards.'],
      ['2000s–2010s', 'A series of Corporate Wars, each more open than the last, as megacorps fight with their own armies over markets.'],
      ['2020', 'The Cyberpunk 2020 era: corporate Night City, booster gangs, cyberware everywhere, and Arasaka Tower over downtown.']]],
    ['The Fourth Corporate War (2021–2025)', [
      ['2021', 'Two ocean megacorps, CINO and OTEC, fight over a failing sea-shipping company. Arasaka backs CINO and Militech backs OTEC, and it grows into open war.'],
      ['2022', 'The war goes hot around the world and in orbit. Rache Bartmoss\'s DataKrash viruses are released and the old worldwide NET collapses.'],
      ['20 Aug 2023', 'A team including rockerboy Johnny Silverhand and solo Morgan Blackhand raids Arasaka Tower. A nuclear device destroys the tower and much of downtown: the Night City Holocaust.'],
      ['2023–2025', 'The war winds down. Arasaka is thrown out of the US and pulls back to Japan; the US government takes over Militech.']]],
    ['The Time of the Red (2025–2045)', [
      ['2025 onward', 'Smoke and fallout turn skies red for years, giving the era its name. Without a working NET, data moves on local networks and by hand.'],
      ['2025 onward', 'Night City rebuilds with Night Corp, smaller corporations and Nomad families doing the work. The bombed downtown becomes the Hot Zone.'],
      ['2045', 'The Cyberpunk RED era: a scarred city getting back on its feet, with Edgerunners doing the dirty work.']]],
    ['Toward 2077', [
      ['2045–2069', 'Night City keeps rebuilding. Arasaka slowly works its way back into the city.'],
      ['2069–2070', 'The Unification War (the "Metal Wars"): President Rosalind Myers tries to bring the Free States back under federal rule. Arasaka steps in to defend Night City, and the Treaty of Unification (the Arvin Accord) ends the war. Night City comes out of it a free, independent city.'],
      ['2077', 'The Cyberpunk 2077 era. A heist at Arasaka\'s Konpeki Plaza goes wrong: Saburo Arasaka dies at his son Yorinobu\'s hands, and mercenary V ends up with a chip holding Johnny Silverhand\'s mind. The same night, Mayor Lucius Rhyne, a hero of the Unification War, dies.'],
      ['2077', 'In Dogtown, a walled-off district run by Kurt Hansen, federal agents work to save President Myers after her plane goes down (Phantom Liberty).']]],
    ['Your campaign', [['2079', 'Two years after the events of 2077. Anything after this point is yours to decide.']]]
  ];
  function openTimeline() {
    if (!isGM()) return;
    const m = modal('🗓 Lore timeline (DM only)', true);
    const q = el('input', { class: 'grow', placeholder: 'Search, e.g. Arasaka, Night, 2023' });
    const body = el('div', { class: 'col', style: 'gap:12px' });
    const draw = () => { body.textContent = ''; const f = q.value.trim().toLowerCase();
      for (const [era, items] of TIMELINE) { const ls = items.filter(([y, t]) => !f || (era + ' ' + y + ' ' + t).toLowerCase().includes(f)); if (!ls.length) continue;
        body.append(el('div', { style: 'border:1px solid var(--line);padding:10px' }, el('div', { class: 'section-h', style: 'margin:0 0 6px', text: era }),
          ...ls.map(([y, t]) => el('div', { class: 'tl-row' }, el('b', { class: 'tl-y', text: y }), el('span', { text: t }), el('button', { class: 'small ghost', text: 'Share', title: 'Post this to the chat for everyone', onclick: () => request({ type: 'chat', text: '📜 ' + y + ': ' + t }) }))))); }
      if (!body.children.length) body.append(el('div', { class: 'dim', text: 'Nothing matches.' })); };
    q.oninput = draw; draw();
    m.append(el('div', { class: 'row', style: 'margin-bottom:10px' }, q), body,
      el('p', { class: 'dim', style: 'font-size:.78rem;margin-top:12px', text: 'A short summary of the official Cyberpunk history (2020, RED and 2077), written for Night City Table. Some early dates differ between books; your table\'s version always wins.' }));
  }
