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
  async function applyMusic() {
    if (!S || !S.audio) return;
    const m = S.audio.music;
    musicEl.volume = vol.mute ? 0 : Math.max(0, Math.min(1, (m.volume ?? 0.6) * vol.music));
    if (!m.playing || !m.track) { musicEl.pause(); renderNowPlaying(); return; }
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
  function stopAllAudio() { musicEl.pause(); musicEl.removeAttribute('src'); musicEl.dataset.key = ''; renderNowPlaying(); }
  function renderNowPlaying(msg) {
    const box = $('#nowplaying'); box.textContent = '';
    const m = S && S.audio && S.audio.music;
    if (audioBlocked && m && m.playing) { box.classList.remove('hidden'); box.append(el('button', { class: 'small primary', text: '🔊 Click to turn on sound', onclick: () => { audioBlocked = false; tryPlay(musicEl); renderNowPlaying(); } })); return; }
    if (!m || !m.playing || !m.track) { box.classList.add('hidden'); return; }
    box.classList.remove('hidden'); box.append('♪ ' + (msg || m.track.name));
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
    const addLink = kind => { const u = fixAudioLink(url.value); if (/youtube\.com|youtu\.be|spotify\.com|soundcloud\.com/.test(u)) { toast('That link is a web page, not an audio file. Use a direct link to an .mp3 (a Dropbox or Google Drive share link works) or upload the file.', true); return; } request({ type: 'audio.track.add', track: { name: nm.value.trim() || u.split('/').pop().split('?')[0] || 'Track', kind, url: u } }); nm.value = ''; url.value = ''; };
    box.append(el('div', { class: 'section-h', text: 'Music (plays for everyone, loops)' }),
      el('div', { class: 'col' }, nm, url, el('div', { class: 'row' }, el('button', { class: 'primary grow', text: '+ Add music link', onclick: () => addLink('music') }), el('button', { class: 'grow', text: '⬆ Upload music', onclick: () => addAudioFiles('music') }))),
      el('div', { class: 'setrow' }, el('span', { text: 'Music volume for everyone' }), el('input', { type: 'range', min: 0, max: 1, step: 0.05, value: m.volume ?? 0.6, onchange: e => request({ type: 'music.volume', volume: Number(e.target.value) }) })));
    if (m.playing && m.track) box.append(el('div', { class: 'row' }, el('span', { class: 'grow', text: '♪ Now playing: ' + m.track.name }), el('button', { class: 'danger', text: '■ Stop', onclick: () => request({ type: 'music.stop' }) })));
    if (!music.length) box.append(el('div', { class: 'dim', text: 'No music yet. Paste a link to an mp3 (Dropbox and Google Drive share links work) or upload files.' }));
    for (const t of music) box.append(el('div', { class: 'track' + (m.playing && m.track && m.track.id === t.id ? ' playing' : '') },
      el('span', { class: 'nm', text: (t.url ? '🔗 ' : '♪ ') + t.name, title: t.url || 'uploaded file' }),
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
      ['Damage, step by step', ['1. Roll weapon damage.', '2. Subtract the armor SP at the hit location.', '3. Head hit: double what got through.', '4. Subtract the Body Type Modifier (BTM). If anything got past the armor, at least 1 point still lands.', '5. Mark it on the wound track. Armor that was beaten loses 1 SP.', '8+ points to a limb after armor: the limb is severed or crushed (Mortal 0). 8+ to the head kills outright.']],
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
      ['Hit Points & wounds', ['HP = 10 + 5 × (BODY + WILL ÷ 2, rounded up).', 'Seriously Wounded (under half HP): −2 to all actions.', 'Mortally Wounded (under 1 HP): −4 to all actions and a death save every turn. Roll 1d10 and you must get under your BODY. Each save makes the next one harder.']],
      ['Humanity & cyberware', ['Humanity = EMP × 10. Installing cyberware costs Humanity Loss.', 'EMP drops 1 for every full 10 Humanity lost. Run out and you are a cyberpsycho.']]
    ]
  };
  function openQuickRef(line) {
    const m = modal((line === 'red' ? 'Cyberpunk RED' : 'Cyberpunk 2020') + ': rules quick reference', true);
    const q = el('input', { class: 'grow', placeholder: 'Filter, e.g. head, autofire, death' });
    const body = el('div', { class: 'col', style: 'gap:12px' });
    const draw = () => { body.textContent = ''; const t = q.value.trim().toLowerCase();
      for (const [title, lines] of QUICK_REF[line]) { const ls = t ? lines.filter(x => (title + ' ' + x).toLowerCase().includes(t)) : lines; if (!ls.length) continue;
        body.append(el('div', { class: 'box', style: 'border:1px solid var(--line);padding:10px' }, el('div', { class: 'section-h', style: 'margin:0 0 6px', text: title }), ...ls.map(x => el('div', { style: 'margin:3px 0;line-height:1.45', text: x })))); }
      if (!body.children.length) body.append(el('div', { class: 'dim', text: 'Nothing matches.' })); };
    q.oninput = draw; draw();
    m.append(el('div', { class: 'row', style: 'margin-bottom:10px' }, q, el('button', { class: 'small', text: line === 'red' ? 'Switch to 2020' : 'Switch to RED', onclick: () => openQuickRef(line === 'red' ? '2020' : 'red') })), body,
      el('p', { class: 'dim', style: 'font-size:.78rem;margin-top:12px', text: 'A short summary written for Night City Table. For full rules, open your rulebook in the Books tab. Your DM\'s ruling always wins.' }));
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
