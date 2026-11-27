/* ===== Night City Table — core game logic (no DOM) ===== */
(function (root) {
  'use strict';

  // ---------- utils ----------
  function rnd(n) { // uniform 1..n
    const g = (root.crypto && root.crypto.getRandomValues) ? root.crypto : null;
    if (g) { const a = new Uint32Array(1); const lim = Math.floor(0x100000000 / n) * n; let v; do { g.getRandomValues(a); v = a[0]; } while (v >= lim); return (v % n) + 1; }
    return Math.floor(Math.random() * n) + 1;
  }
  function uid(len) { const c = 'abcdefghijkmnpqrstuvwxyz23456789'; let s = ''; for (let i = 0; i < (len || 10); i++) s += c[rnd(c.length) - 1]; return s; }
  function code(len) { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < (len || 6); i++) s += c[rnd(c.length) - 1]; return s; }
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function clamp(v, a, b) { v = Number(v); if (!isFinite(v)) v = a; return Math.max(a, Math.min(b, v)); }
  function str(v, max) { return String(v == null ? '' : v).slice(0, max || 200); }
  function isImg(u) { return typeof u === 'string' && (u.startsWith('data:image/') || u.startsWith('https://')); }

  // ---------- CP2020 rules data ----------
  const STATS = ['INT', 'REF', 'TECH', 'COOL', 'ATTR', 'LUCK', 'MA', 'BODY', 'EMP'];
  const SKILLS_BY_STAT = {
    ATTR: ['Personal Grooming', 'Wardrobe & Style'],
    BODY: ['Endurance', 'Strength Feat', 'Swimming'],
    COOL: ['Interrogation', 'Intimidate', 'Oratory', 'Resist Torture/Drugs', 'Streetwise'],
    EMP: ['Human Perception', 'Interview', 'Leadership', 'Seduction', 'Social', 'Persuasion & Fast Talk', 'Perform'],
    INT: ['Accounting', 'Anthropology', 'Awareness/Notice', 'Biology', 'Botany', 'Chemistry', 'Composition', 'Diagnose Illness', 'Education & Gen. Knowledge', 'Expert', 'Gamble', 'Geology', 'Hide/Evade', 'History', 'Know Language', 'Library Search', 'Mathematics', 'Physics', 'Programming', 'Shadow/Track', 'Stock Market', 'System Knowledge', 'Teaching', 'Wilderness Survival', 'Zoology'],
    REF: ['Archery', 'Athletics', 'Brawling', 'Dance', 'Dodge & Escape', 'Driving', 'Fencing', 'Handgun', 'Heavy Weapons', 'Martial Arts', 'Melee', 'Motorcycle', 'Operate Hvy. Machinery', 'Pilot (Gyro)', 'Pilot (Fixed Wing)', 'Pilot (Dirigible)', 'Pilot (Vec. Thrust)', 'Rifle', 'Stealth', 'Submachinegun'],
    TECH: ['Aero Tech', 'AV Tech', 'Basic Tech', 'Cryotank Operation', 'Cyberdeck Design', 'Cybertech', 'Demolitions', 'Disguise', 'Electronics', 'Electronic Security', 'First Aid', 'Forgery', 'Gyro Tech', 'Paint or Draw', 'Photo & Film', 'Pharmaceuticals', 'Pick Lock', 'Pick Pocket', 'Play Instrument', 'Weaponsmith']
  };
  const SKILL_STAT = {};
  for (const s in SKILLS_BY_STAT) for (const n of SKILLS_BY_STAT[s]) SKILL_STAT[n.toLowerCase()] = s;
  const ROLES = {
    solo: { label: 'Solo', ability: 'Combat Sense', stat: '' },
    rocker: { label: 'Rockerboy', ability: 'Charismatic Leadership', stat: 'COOL' },
    netrunner: { label: 'Netrunner', ability: 'Interface', stat: 'INT' },
    media: { label: 'Media', ability: 'Credibility', stat: 'INT' },
    nomad: { label: 'Nomad', ability: 'Family', stat: 'INT' },
    fixer: { label: 'Fixer', ability: 'Streetdeal', stat: 'COOL' },
    cop: { label: 'Cop', ability: 'Authority', stat: 'COOL' },
    corp: { label: 'Corporate', ability: 'Resources', stat: 'INT' },
    techie: { label: 'Techie', ability: 'Jury Rig', stat: 'TECH' },
    medtech: { label: 'Medtechie', ability: 'Medical Tech', stat: 'TECH' }
  };
  const LOCS = [['head', 'Head', '1'], ['torso', 'Torso', '2-4'], ['rArm', 'R. Arm', '5'], ['lArm', 'L. Arm', '6'], ['rLeg', 'R. Leg', '7-8'], ['lLeg', 'L. Leg', '9-0']];
  // weapon type -> skill
  function weaponSkill(type) {
    const t = String(type || '').toLowerCase();
    if (/pistol|handgun/.test(t)) return 'Handgun';
    if (/smg|submachine/.test(t)) return 'Submachinegun';
    if (/rifle|shotgun|carbine|assault|sniper/.test(t)) return 'Rifle';
    if (/heavy|launcher|cannon|grenade|flamethrower|lmg|mg/.test(t)) return 'Heavy Weapons';
    if (/bow|archery|crossbow/.test(t)) return 'Archery';
    if (/fenc|sword|katana/.test(t)) return 'Fencing';
    if (/melee|knife|club|blade|axe|baton|chain|monokat/.test(t)) return 'Melee';
    if (/brawl|fist|unarmed/.test(t)) return 'Brawling';
    return 'Handgun';
  }

  function blankSheet(ownerId) {
    const stats = {}; for (const s of STATS) stats[s] = { base: 5, mod: 0, cyber: 0 };
    const skills = [];
    for (const st in SKILLS_BY_STAT) for (const n of SKILLS_BY_STAT[st]) skills.push({ name: n, stat: st, value: 0 });
    skills.sort((a, b) => a.name.localeCompare(b.name));
    return {
      id: uid(), ownerId: ownerId || null, name: 'New Character', handle: '', role: 'solo', portrait: '',
      stats, skills, specialAbility: 0, humanity: 50, damage: 0,
      sp: { head: 0, torso: 0, rArm: 0, lArm: 0, rLeg: 0, lLeg: 0 },
      weapons: [], cyberware: [], gear: [], eddies: 0, rep: 0, notes: '', source: null, updatedAt: Date.now(),
      macros: [], mods: DEFAULT_MODS.map(m => Object.assign({ id: uid() }, m, { on: false }))
    };
  }

  // ready-made roll modifiers (Cyberpunk 2020 combat), switched on/off per character
  const DEFAULT_MODS = [
    { name: 'Aiming', value: '+1', applies: 'hit' }, { name: 'Smartgun link', value: '+2', applies: 'hit' }, { name: 'Laser sight', value: '+1', applies: 'hit' },
    { name: 'Target immobile', value: '+4', applies: 'hit' }, { name: 'Ambush', value: '+5', applies: 'hit' }, { name: 'Running', value: '-3', applies: 'hit' },
    { name: 'Fast draw', value: '-3', applies: 'hit' }, { name: 'Called shot', value: '-4', applies: 'hit' }, { name: 'Off hand', value: '-3', applies: 'hit' },
    { name: 'Blinded / smoke', value: '-3', applies: 'hit' }, { name: 'Melee strength bonus', value: '+0', applies: 'dmg', auto: 'str' }, { name: 'Extra damage die', value: '+1d6', applies: 'dmg' }
  ];
  function strBonus(body) { return body <= 2 ? -2 : body <= 4 ? -1 : body <= 7 ? 0 : body <= 9 ? 1 : body === 10 ? 2 : body <= 12 ? 4 : body <= 14 ? 6 : 8; }
  function cleanModValue(v) {
    v = String(v == null ? '' : v).replace(/\s+/g, '').toLowerCase(); if (!v) return '+0';
    if (!/^[+-]/.test(v)) v = '+' + v;
    try { roll('0' + v); } catch (e) { return null; }
    return v.slice(0, 20);
  }
  function statVal(sheet, s) { const v = sheet.stats && sheet.stats[s]; return v ? (Number(v.base) || 0) + (Number(v.mod) || 0) + (Number(v.cyber) || 0) : 0; }
  function woundInfo(dmg) {
    dmg = Number(dmg) || 0;
    if (dmg <= 0) return { label: 'Uninjured', level: -1 };
    if (dmg <= 4) return { label: 'Light', level: 0 };
    if (dmg <= 8) return { label: 'Serious', level: 1 };
    if (dmg <= 12) return { label: 'Critical', level: 2 };
    if (dmg >= 41) return { label: 'Dead', level: 99 };
    const m = Math.floor((dmg - 13) / 4);
    return { label: 'Mortal ' + m, level: 3 + m, mortal: m };
  }
  // effective stat after wound penalties
  function effStat(sheet, s) {
    let v = statVal(sheet, s);
    const w = woundInfo(sheet.damage);
    if (w.level === 1 && s === 'REF') v -= 2;
    if (w.level === 2 && (s === 'REF' || s === 'INT' || s === 'COOL')) v = Math.ceil(v / 2);
    if (w.level >= 3 && (s === 'REF' || s === 'INT' || s === 'COOL')) v = Math.ceil(v / 3);
    return v;
  }
  function derived(sheet) {
    const body = statVal(sheet, 'BODY'), ma = statVal(sheet, 'MA');
    const btm = body <= 2 ? 0 : body <= 4 ? -1 : body <= 7 ? -2 : body <= 9 ? -3 : body === 10 ? -4 : -5;
    const w = woundInfo(sheet.damage);
    const stunTarget = body - Math.max(0, w.level);
    const deathTarget = w.mortal != null ? body - w.mortal : null;
    return { run: ma * 3, leap: Math.floor(ma * 3 / 4), lift: body * 40, carry: body * 10, btm, save: body, wound: w, stunTarget, deathTarget };
  }
  function skillTotal(sheet, sk) { return (Number(sk.value) || 0) + (sk.stat ? effStat(sheet, sk.stat) : 0); }

  // ---------- dice ----------
  // supports: NdM, NdM! (CP2020 exploding: 10s add another die), d10!, kh/kl, + - integers
  function roll(expr) {
    const src = String(expr || '').replace(/\s+/g, '').toLowerCase();
    if (!src) throw new Error('empty roll');
    if (src.length > 80) throw new Error('roll too long');
    const re = /([+-]?)(?:(\d*)d(\d+)(!|kh\d+|kl\d+)?|(\d+))/gy;
    const parts = []; let total = 0; let m; let pos = 0; let fumble = false; let crit = false;
    re.lastIndex = 0;
    while (pos < src.length) {
      re.lastIndex = pos; m = re.exec(src);
      if (!m || m.index !== pos || m[0] === '' ) throw new Error('bad roll: ' + expr);
      pos = re.lastIndex;
      const sign = m[1] === '-' ? -1 : 1;
      if (m[5] !== undefined) { const n = Number(m[5]); total += sign * n; parts.push({ kind: 'num', sign, value: n }); continue; }
      const count = m[2] === '' ? 1 : Number(m[2]); const sides = Number(m[3]); const flag = m[4] || '';
      if (count < 1 || count > 100 || sides < 2 || sides > 1000) throw new Error('dice out of range');
      let rolls = [];
      if (flag === '!') {
        for (let i = 0; i < count; i++) {
          let r = rnd(sides); const chain = [r];
          if (count === 1 && r === 1) fumble = true;
          let guard = 0; while (r === sides && guard++ < 20) { crit = true; r = rnd(sides); chain.push(r); }
          rolls.push(chain);
        }
      } else { for (let i = 0; i < count; i++) rolls.push([rnd(sides)]); }
      let kept = rolls.map(c => c.reduce((a, b) => a + b, 0));
      let dropped = [];
      if (flag.startsWith('kh') || flag.startsWith('kl')) {
        const k = Math.max(1, Math.min(count, Number(flag.slice(2))));
        const idx = kept.map((v, i) => [v, i]).sort((a, b) => flag.startsWith('kh') ? b[0] - a[0] : a[0] - b[0]);
        const keep = new Set(idx.slice(0, k).map(x => x[1]));
        dropped = kept.map((v, i) => !keep.has(i));
        kept = kept.filter((v, i) => keep.has(i));
      }
      const sum = kept.reduce((a, b) => a + b, 0);
      total += sign * sum;
      parts.push({ kind: 'dice', sign, label: count + 'd' + sides + flag, rolls, dropped, sum, sides });
    }
    return { expr: src, total, parts, fumble, crit };
  }
  function rollToText(r) {
    return r.parts.map((p, i) => {
      const s = (i === 0 && p.sign > 0) ? '' : (p.sign < 0 ? ' - ' : ' + ');
      if (p.kind === 'num') return s + p.value;
      return s + p.label + '[' + p.rolls.map((c, j) => (p.dropped[j] ? '~' : '') + c.join('+')).join(', ') + ']';
    }).join('') + ' = ' + r.total;
  }

  // ---------- state ----------
  function newCampaign(name, gmId, gmName) {
    return {
      v: 1, id: code(6), name: str(name || 'New Campaign', 80), createdAt: Date.now(), gmId,
      players: { [gmId]: { id: gmId, name: str(gmName || 'GM', 40), color: '#ff2a6d', isGM: true } },
      maps: {}, activeMapId: null, chat: [], sheets: {}, init: { list: [], turn: 0 },
      journal: { folders: {}, entries: {} },
      audio: { tracks: {}, music: { playing: false, track: null, startedAt: 0, offset: 0, loop: true, volume: 0.6 } }
    };
  }
  // older saves don't have the newer sections
  function upgrade(state) {
    if (!state.journal) state.journal = { folders: {}, entries: {} };
    if (!state.journal.folders) state.journal.folders = {};
    if (!state.journal.entries) state.journal.entries = {};
    if (!state.audio) state.audio = { tracks: {}, music: { playing: false, track: null, startedAt: 0, offset: 0, loop: true, volume: 0.6 } };
    if (!state.audio.tracks) state.audio.tracks = {};
    if (!state.audio.music) state.audio.music = { playing: false, track: null, startedAt: 0, offset: 0, loop: true, volume: 0.6 };
    return state;
  }
  function newMap(name, img, w, h) {
    return { id: uid(), name: str(name || 'Map', 80), img: img || '', w: w || 2000, h: h || 1400, grid: { size: 70, show: true, ox: 0, oy: 0, color: '#00f0ff', alpha: 0.25 }, tokens: {}, bg: '#0b0f1a' };
  }

  const MAX_CHAT = 400;
  // apply a committed op (host and clients run the same thing)
  function apply(state, op) {
    switch (op.type) {
      case 'chat': state.chat.push(op.msg); if (state.chat.length > MAX_CHAT) state.chat.splice(0, state.chat.length - MAX_CHAT); break;
      case 'player.upsert': state.players[op.player.id] = Object.assign(state.players[op.player.id] || {}, op.player); break;
      case 'meta': if (op.name) state.name = op.name; if (op.theme !== undefined) state.theme = op.theme; break;
      case 'map.add': state.maps[op.map.id] = op.map; if (!state.activeMapId) state.activeMapId = op.map.id; break;
      case 'map.update': if (state.maps[op.id]) { const m = state.maps[op.id]; if (op.patch.grid) m.grid = Object.assign({}, m.grid, op.patch.grid); for (const k of ['name', 'bg', 'img', 'w', 'h']) if (op.patch[k] !== undefined) m[k] = op.patch[k]; } break;
      case 'map.delete': delete state.maps[op.id]; if (state.activeMapId === op.id) state.activeMapId = Object.keys(state.maps)[0] || null; break;
      case 'map.activate': if (state.maps[op.id]) state.activeMapId = op.id; break;
      case 'token.add': if (state.maps[op.mapId]) state.maps[op.mapId].tokens[op.token.id] = op.token; break;
      case 'token.update': { const m = state.maps[op.mapId]; if (m && m.tokens[op.id]) Object.assign(m.tokens[op.id], op.patch); break; }
      case 'token.delete': { const m = state.maps[op.mapId]; if (m) delete m.tokens[op.id]; break; }
      case 'sheet.upsert': state.sheets[op.sheet.id] = op.sheet; break;
      case 'sheet.delete': delete state.sheets[op.id]; for (const mid in state.maps) for (const tid in state.maps[mid].tokens) if (state.maps[mid].tokens[tid].sheetId === op.id) state.maps[mid].tokens[tid].sheetId = null; break;
      case 'init.set': state.init = op.init; break;
      case 'journal.folder.upsert': upgrade(state); state.journal.folders[op.folder.id] = op.folder; break;
      case 'journal.folder.delete': upgrade(state); delete state.journal.folders[op.id]; for (const id in state.journal.entries) if (state.journal.entries[id].folderId === op.id) state.journal.entries[id].folderId = null; break;
      case 'journal.entry.upsert': upgrade(state); state.journal.entries[op.entry.id] = op.entry; break;
      case 'journal.entry.delete': upgrade(state); delete state.journal.entries[op.id]; break;
      case 'audio.track.upsert': upgrade(state); state.audio.tracks[op.track.id] = op.track; break;
      case 'audio.track.delete': upgrade(state); delete state.audio.tracks[op.id]; break;
      case 'music.set': upgrade(state); state.audio.music = op.music; break;
    }
    return state;
  }

  function sanitizeToken(t, ownerId) {
    return {
      id: str(t.id || uid(), 20), x: clamp(t.x, -100000, 100000), y: clamp(t.y, -100000, 100000), size: clamp(t.size || 1, 0.25, 10),
      name: str(t.name, 60), color: /^#[0-9a-f]{6}$/i.test(t.color) ? t.color : '#05d9e8', img: isImg(t.img) ? t.img : '',
      sheetId: t.sheetId ? str(t.sheetId, 20) : null, hidden: !!t.hidden, ownerId: ownerId === undefined ? (t.ownerId || null) : ownerId
    };
  }
  function sanitizeSheet(s) {
    const b = blankSheet(s.ownerId);
    const out = Object.assign(b, {
      id: str(s.id || uid(), 20), ownerId: s.ownerId || null, name: str(s.name, 80) || 'Unnamed', handle: str(s.handle, 80),
      role: ROLES[s.role] ? s.role : str(s.role, 30), portrait: isImg(s.portrait) && String(s.portrait).length < 600000 ? s.portrait : '',
      specialAbility: clamp(s.specialAbility, 0, 10), humanity: clamp(s.humanity, -100, 200), damage: clamp(s.damage, 0, 41),
      eddies: clamp(s.eddies, -1e9, 1e12), rep: clamp(s.rep, -20, 20), notes: str(s.notes, 20000), source: s.source ? clone(s.source) : null, updatedAt: Date.now()
    });
    for (const st of STATS) { const v = (s.stats && s.stats[st]) || {}; out.stats[st] = { base: clamp(v.base, 0, 30), mod: clamp(v.mod, -20, 20), cyber: clamp(v.cyber || 0, -10, 10) }; }
    if (Array.isArray(s.skills)) out.skills = s.skills.slice(0, 300).map(k => ({ name: str(k.name, 60), stat: STATS.includes(k.stat) ? k.stat : '', value: clamp(k.value, 0, 20) }));
    for (const [k] of LOCS) out.sp[k] = clamp(s.sp && s.sp[k], 0, 100);
    out.weapons = (Array.isArray(s.weapons) ? s.weapons : []).slice(0, 60).map(w => ({ name: str(w.name, 80), type: str(w.type, 40), wa: clamp(w.wa, -10, 10), damage: str(w.damage, 30), rof: str(w.rof, 10), shots: str(w.shots, 10), range: str(w.range, 12), rel: str(w.rel, 6), skill: str(w.skill || weaponSkill(w.type), 40), notes: str(w.notes, 300) }));
    out.cyberware = (Array.isArray(s.cyberware) ? s.cyberware : []).slice(0, 100).map(c => ({ name: str(c.name, 80), hl: str(c.hl, 10), notes: str(c.notes, 400) }));
    out.gear = (Array.isArray(s.gear) ? s.gear : []).slice(0, 200).map(g => ({ name: str(g.name, 80), notes: str(g.notes, 400) }));
    if (Array.isArray(s.macros)) out.macros = s.macros.slice(0, 60).map(m => ({ id: str(m.id || uid(), 20), name: str(m.name || 'Macro', 40), formula: str(m.formula, 200), kind: ['hit', 'dmg'].includes(m.kind) ? m.kind : '' }));
    if (Array.isArray(s.mods)) out.mods = s.mods.slice(0, 60).map(m => ({ id: str(m.id || uid(), 20), name: str(m.name || 'Modifier', 40), value: cleanModValue(m.value) || '+0', applies: ['hit', 'dmg', 'both'].includes(m.applies) ? m.applies : 'hit', on: !!m.on, auto: m.auto === 'str' ? 'str' : undefined }));
    return out;
  }

  // ---------- journal visibility ----------
  // vis.mode: 'gm' (DM only), 'all' (everyone), 'some' (DM + the players in vis.ids). Owners always see their own.
  function canSeeEntry(state, e, pid) {
    if (!e) return false;
    if (pid === state.gmId || e.ownerId === pid) return true;
    const v = e.vis || {};
    return v.mode === 'all' || (v.mode === 'some' && Array.isArray(v.ids) && v.ids.includes(pid));
  }
  function journalView(state, pid) {
    upgrade(state);
    const entries = new Set(), folders = new Set();
    for (const id in state.journal.entries) { const e = state.journal.entries[id]; if (canSeeEntry(state, e, pid)) { entries.add(id); if (e.folderId && state.journal.folders[e.folderId]) folders.add(e.folderId); } }
    if (pid === state.gmId) for (const id in state.journal.folders) folders.add(id);
    return { entries, folders };
  }
  // what to send one player after journal changes: only what they're allowed to see, and removals for what they lost
  function journalDiff(state, before, pid, changed) {
    const after = journalView(state, pid); const out = [];
    for (const id of after.folders) if (!before.folders.has(id) || changed.has('f:' + id)) out.push({ type: 'journal.folder.upsert', folder: state.journal.folders[id] });
    for (const id of after.entries) if (!before.entries.has(id) || changed.has('e:' + id)) out.push({ type: 'journal.entry.upsert', entry: state.journal.entries[id] });
    for (const id of before.entries) if (!after.entries.has(id)) out.push({ type: 'journal.entry.delete', id });
    for (const id of before.folders) if (!after.folders.has(id)) out.push({ type: 'journal.folder.delete', id });
    return out;
  }
  function cleanVis(v, state) {
    v = v || {}; const mode = ['gm', 'all', 'some'].includes(v.mode) ? v.mode : 'gm';
    return { mode, ids: mode === 'some' ? (Array.isArray(v.ids) ? v.ids : []).filter(id => state.players[id]).slice(0, 50) : [] };
  }
  function cleanTrack(t) {
    return { id: str(t.id || uid(), 20), name: str(t.name || 'Track', 80), kind: t.kind === 'sound' ? 'sound' : 'music', url: /^https:\/\//.test(String(t.url || '')) ? str(t.url, 2000) : '', file: !!t.file, size: clamp(t.size || 0, 0, 1e9) };
  }

  // ---------- host: turn a request into committed ops ----------
  // sender = { id, isGM, name }
  function handleRequest(state, req, sender) {
    const out = { ops: [], transient: [], error: null };
    const isGM = !!sender.isGM;
    const deny = (why) => { out.error = why || 'Not allowed'; return out; };
    const chatMsg = (extra) => Object.assign({ id: uid(), ts: Date.now(), from: sender.id, name: (state.players[sender.id] && state.players[sender.id].name) || sender.name || '?' }, extra);
    switch (req.type) {
      case 'chat': {
        const text = str(req.text, 2000).trim(); if (!text) return out;
        const m = text.match(/^\/(r|roll|gr|gmroll)\s+(\S+)\s*(.*)$/i);
        if (m) return handleRequest(state, { type: 'roll', formula: m[2], label: m[3], private: /^g/i.test(m[1]) }, sender);
        out.ops.push({ type: 'chat', msg: chatMsg({ text }) }); return out;
      }
      case 'roll': {
        let r; try { r = roll(req.formula); } catch (e) { return deny(e.message); }
        const priv = !!req.private;
        const msg = chatMsg({ label: str(req.label, 200), roll: r, private: priv, to: priv ? [sender.id, state.gmId] : null, kind: ['hit', 'dmg'].includes(req.kind) ? req.kind : '', ap: !!req.ap,
          target: (req.target !== undefined && req.target !== null && isFinite(Number(req.target))) ? clamp(req.target, -99, 999) : null });
        out.ops.push({ type: 'chat', msg });
        if (req.init && req.init.name) {
          const init = clone(state.init) || { list: [], turn: 0 };
          const key = req.init.sheetId || req.init.name;
          init.list = init.list.filter(e => (e.sheetId || e.name) !== key);
          init.list.push({ id: uid(), name: str(req.init.name, 60), value: r.total, sheetId: req.init.sheetId || null });
          init.list.sort((a, b) => b.value - a.value);
          out.ops.push({ type: 'init.set', init });
        }
        return out;
      }
      case 'player.upsert': {
        const p = state.players[sender.id] || {};
        out.ops.push({ type: 'player.upsert', player: { id: sender.id, name: str(req.name || p.name || 'Player', 40), color: /^#[0-9a-f]{6}$/i.test(req.color) ? req.color : (p.color || '#05d9e8'), isGM: sender.id === state.gmId } });
        return out;
      }
      case 'meta': {
        if (!isGM) return deny(); const op = { type: 'meta' };
        if (req.name) op.name = str(req.name, 80);
        if (req.theme === null) op.theme = null;
        else if (req.theme) { const t = {}; for (const k of ['p', 's', 't', 'd', 'bg']) if (/^#[0-9a-f]{6}$/i.test(req.theme[k])) t[k] = req.theme[k]; if (t.p && t.bg) op.theme = t; }
        out.ops.push(op); return out;
      }
      case 'map.add': {
        if (!isGM) return deny();
        const m = newMap(req.name, isImg(req.img) ? req.img : '', clamp(req.w, 100, 12000), clamp(req.h, 100, 12000));
        if (req.grid) m.grid.size = clamp(req.grid, 10, 400);
        out.ops.push({ type: 'map.add', map: m }); return out;
      }
      case 'map.update': {
        if (!isGM || !state.maps[req.id]) return deny();
        const p = {}; const q = req.patch || {};
        if (q.name !== undefined) p.name = str(q.name, 80);
        if (q.bg !== undefined && /^#[0-9a-f]{6}$/i.test(q.bg)) p.bg = q.bg;
        if (q.grid) { p.grid = {}; if (q.grid.size !== undefined) p.grid.size = clamp(q.grid.size, 10, 400); if (q.grid.show !== undefined) p.grid.show = !!q.grid.show; if (q.grid.ox !== undefined) p.grid.ox = clamp(q.grid.ox, -400, 400); if (q.grid.oy !== undefined) p.grid.oy = clamp(q.grid.oy, -400, 400); if (q.grid.alpha !== undefined) p.grid.alpha = clamp(q.grid.alpha, 0, 1); if (q.grid.color !== undefined && /^#[0-9a-f]{6}$/i.test(q.grid.color)) p.grid.color = q.grid.color; }
        if (q.w !== undefined) p.w = clamp(q.w, 100, 12000); if (q.h !== undefined) p.h = clamp(q.h, 100, 12000);
        out.ops.push({ type: 'map.update', id: req.id, patch: p }); return out;
      }
      case 'map.delete': if (!isGM) return deny(); out.ops.push({ type: 'map.delete', id: str(req.id, 20) }); return out;
      case 'map.activate': if (!isGM) return deny(); out.ops.push({ type: 'map.activate', id: str(req.id, 20) }); return out;
      case 'token.add': {
        const m = state.maps[req.mapId]; if (!m) return deny('No such map');
        const t = req.token || {};
        let ownerId = null;
        if (t.sheetId && state.sheets[t.sheetId]) ownerId = state.sheets[t.sheetId].ownerId || null;
        if (!isGM) { if (!t.sheetId || !state.sheets[t.sheetId] || state.sheets[t.sheetId].ownerId !== sender.id) return deny('You can only place your own character'); if (req.mapId !== state.activeMapId) return deny(); }
        const tok = sanitizeToken(Object.assign({}, t, { id: uid() }), ownerId);
        if (!isGM) tok.hidden = false;
        out.ops.push({ type: 'token.add', mapId: req.mapId, token: tok }); return out;
      }
      case 'token.update': {
        const m = state.maps[req.mapId]; const t = m && m.tokens[req.id]; if (!t) return deny();
        const owner = t.ownerId === sender.id;
        if (!isGM && !owner) return deny();
        const q = req.patch || {}; const p = {};
        if (q.x !== undefined) p.x = clamp(q.x, -100000, 100000); if (q.y !== undefined) p.y = clamp(q.y, -100000, 100000);
        if (q.size !== undefined) p.size = clamp(q.size, 0.25, 10);
        if (q.name !== undefined) p.name = str(q.name, 60);
        if (q.color !== undefined && /^#[0-9a-f]{6}$/i.test(q.color)) p.color = q.color;
        if (q.img !== undefined) p.img = isImg(q.img) ? q.img : '';
        if (isGM) { if (q.hidden !== undefined) p.hidden = !!q.hidden; if (q.sheetId !== undefined) { p.sheetId = q.sheetId && state.sheets[q.sheetId] ? q.sheetId : null; p.ownerId = p.sheetId ? (state.sheets[p.sheetId].ownerId || null) : null; } }
        out.ops.push({ type: 'token.update', mapId: req.mapId, id: req.id, patch: p }); return out;
      }
      case 'token.delete': {
        const m = state.maps[req.mapId]; const t = m && m.tokens[req.id]; if (!t) return out;
        if (!isGM && t.ownerId !== sender.id) return deny();
        out.ops.push({ type: 'token.delete', mapId: req.mapId, id: req.id }); return out;
      }
      case 'sheet.upsert': {
        const s = req.sheet || {}; const existing = s.id && state.sheets[s.id];
        if (existing && !isGM && existing.ownerId !== sender.id) return deny('Not your character');
        const clean = sanitizeSheet(s);
        if (!existing) clean.id = uid();
        if (!isGM) clean.ownerId = sender.id;
        else if (s.ownerId !== undefined) clean.ownerId = s.ownerId && state.players[s.ownerId] ? s.ownerId : null;
        else if (existing) clean.ownerId = existing.ownerId;
        out.ops.push({ type: 'sheet.upsert', sheet: clean });
        // keep linked tokens' owner in sync
        if (existing && existing.ownerId !== clean.ownerId) for (const mid in state.maps) for (const tid in state.maps[mid].tokens) if (state.maps[mid].tokens[tid].sheetId === clean.id) out.ops.push({ type: 'token.update', mapId: mid, id: tid, patch: { ownerId: clean.ownerId } });
        return out;
      }
      case 'sheet.delete': {
        const s = state.sheets[req.id]; if (!s) return out;
        if (!isGM && s.ownerId !== sender.id) return deny();
        out.ops.push({ type: 'sheet.delete', id: req.id }); return out;
      }
      case 'init.set': {
        if (!isGM) return deny();
        const i = req.init || {}; const list = (Array.isArray(i.list) ? i.list : []).slice(0, 60).map(e => ({ id: str(e.id || uid(), 20), name: str(e.name, 60), value: clamp(e.value, -99, 999), sheetId: e.sheetId || null }));
        out.ops.push({ type: 'init.set', init: { list, turn: clamp(i.turn || 0, 0, Math.max(0, list.length - 1)) } }); return out;
      }
      case 'journal.folder.upsert': {
        if (!isGM) return deny(); upgrade(state);
        const f = req.folder || {}; const ex = f.id && state.journal.folders[f.id];
        out.ops.push({ type: 'journal.folder.upsert', folder: { id: ex ? ex.id : uid(), name: str(f.name || 'Folder', 80), order: clamp(f.order ?? (ex ? ex.order : Date.now()), 0, 1e15) } }); return out;
      }
      case 'journal.folder.delete': if (!isGM) return deny(); out.ops.push({ type: 'journal.folder.delete', id: str(req.id, 20) }); return out;
      case 'journal.folder.vis': { // show/hide everything in a folder at once
        if (!isGM) return deny(); upgrade(state);
        const vis = cleanVis(req.vis, state);
        for (const id in state.journal.entries) { const e = state.journal.entries[id]; if (e.folderId === req.id && e.ownerId === state.gmId) out.ops.push({ type: 'journal.entry.upsert', entry: Object.assign({}, e, { vis, updatedAt: Date.now() }) }); }
        return out;
      }
      case 'journal.entry.upsert': {
        upgrade(state);
        const e = req.entry || {}; const ex = e.id && state.journal.entries[e.id];
        if (ex && !isGM && ex.ownerId !== sender.id) return deny('Only the person who wrote this (or the DM) can change it');
        if (!ex && e.id && !isGM) { /* new entry: id is assigned below */ }
        const folderId = e.folderId && state.journal.folders[e.folderId] ? e.folderId : null;
        const entry = {
          id: ex ? ex.id : uid(), title: str(e.title || 'Untitled', 120), body: str(e.body, 50000),
          img: isImg(e.img) && String(e.img).length < 2000000 ? e.img : '', folderId: isGM ? folderId : (ex ? ex.folderId : null),
          ownerId: ex ? ex.ownerId : sender.id, vis: cleanVis(e.vis, state), updatedAt: Date.now(), createdAt: ex ? ex.createdAt : Date.now()
        };
        out.ops.push({ type: 'journal.entry.upsert', entry }); return out;
      }
      case 'journal.entry.delete': {
        upgrade(state); const ex = state.journal.entries[req.id]; if (!ex) return out;
        if (!isGM && ex.ownerId !== sender.id) return deny();
        out.ops.push({ type: 'journal.entry.delete', id: ex.id }); return out;
      }
      case 'audio.track.add': if (!isGM) return deny(); { const t = cleanTrack(req.track || {}); if (!t.url && !t.file) return deny('Paste a link that starts with https://'); out.ops.push({ type: 'audio.track.upsert', track: t }); } return out;
      case 'audio.track.rename': if (!isGM || !state.audio || !state.audio.tracks[req.id]) return deny(); out.ops.push({ type: 'audio.track.upsert', track: Object.assign({}, state.audio.tracks[req.id], { name: str(req.name, 80) }) }); return out;
      case 'audio.track.delete': if (!isGM) return deny(); upgrade(state); out.ops.push({ type: 'audio.track.delete', id: str(req.id, 20) });
        if (state.audio.music.track && state.audio.music.track.id === req.id) out.ops.push({ type: 'music.set', music: Object.assign({}, state.audio.music, { playing: false, track: null }) });
        return out;
      case 'music.play': {
        if (!isGM) return deny(); upgrade(state); const t = state.audio.tracks[req.id]; if (!t) return deny('No such track');
        out.ops.push({ type: 'music.set', music: { playing: true, track: { id: t.id, name: t.name, url: t.url, file: t.file }, startedAt: Date.now(), offset: clamp(req.offset || 0, 0, 1e6), loop: req.loop !== false, volume: clamp(req.volume ?? state.audio.music.volume ?? 0.6, 0, 1) } }); return out;
      }
      case 'music.stop': if (!isGM) return deny(); upgrade(state); out.ops.push({ type: 'music.set', music: Object.assign({}, state.audio.music, { playing: false }) }); return out;
      case 'music.volume': if (!isGM) return deny(); upgrade(state); out.ops.push({ type: 'music.set', music: Object.assign({}, state.audio.music, { volume: clamp(req.volume, 0, 1) }) }); return out;
      case 'sound.play': {
        if (!isGM) return deny(); upgrade(state); const t = state.audio.tracks[req.id]; if (!t) return deny('No such sound');
        out.transient.push({ type: 'sound', track: { id: t.id, name: t.name, url: t.url, file: t.file }, volume: clamp(req.volume ?? 1, 0, 1) }); return out;
      }
      case 'ping': out.transient.push({ type: 'ping', x: clamp(req.x, -1e5, 1e5), y: clamp(req.y, -1e5, 1e5), mapId: str(req.mapId, 20), by: sender.id }); return out;
      default: return deny('Unknown action');
    }
  }

  // what a given player may see in a snapshot
  // players never receive secret rolls meant for others, or the DM's NPC sheets
  function viewFor(state, playerId) {
    const s = clone(state);
    s.chat = s.chat.filter(m => !m.to || m.to.includes(playerId));
    for (const id in s.sheets) if (!s.sheets[id].ownerId) delete s.sheets[id];
    upgrade(s);
    if (playerId !== s.gmId) {
      const v = journalView(state, playerId);
      for (const id in s.journal.entries) if (!v.entries.has(id)) delete s.journal.entries[id];
      for (const id in s.journal.folders) if (!v.folders.has(id)) delete s.journal.folders[id];
      s.audio.tracks = {}; // players don't get the DM's sound library, only what's playing
    }
    return s;
  }
  function canSeeMsg(msg, playerId) { return !msg.to || msg.to.includes(playerId); }
  function opsFor(ops, playerId) {
    const out = [];
    for (const o of ops) {
      if (o.type === 'chat' && !canSeeMsg(o.msg, playerId)) continue;
      if (o.type === 'sheet.upsert' && !o.sheet.ownerId) { out.push({ type: 'sheet.delete', id: o.sheet.id }); continue; }
      if (o.type.startsWith('journal.') || o.type.startsWith('audio.track.')) continue; // journal goes out through journalDiff; the library stays with the DM
      out.push(o);
    }
    return out;
  }

  // ---------- import from cyberpunk2020character.com ----------
  const STAT_ALIASES = { BT: 'BODY', BOD: 'BODY', BODY: 'BODY', ATT: 'ATTR', ATTR: 'ATTR', INT: 'INT', REF: 'REF', TECH: 'TECH', TEC: 'TECH', COOL: 'COOL', CL: 'COOL', LUCK: 'LUCK', LK: 'LUCK', MA: 'MA', EMP: 'EMP' };
  function num(v, d) { const n = Number(v); return isFinite(n) ? n : (d || 0); }
  function guessRole(r) {
    const t = String(r || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!t) return 'solo';
    if (t.startsWith('med')) return 'medtech';
    if (t.startsWith('rock')) return 'rocker';
    if (t.startsWith('net')) return 'netrunner';
    if (t.startsWith('corp')) return 'corp';
    if (t.startsWith('tech')) return 'techie';
    if (ROLES[t]) return t;
    return String(r).slice(0, 30);
  }
  function fromCP2020Site(c, meta) {
    if (!c || typeof c !== 'object') throw new Error('No character data found');
    const s = blankSheet(null);
    s.name = str(c.name || c.handle || 'Imported Character', 80);
    s.handle = str(c.handle || c.alias || '', 80);
    s.role = guessRole(c.role);
    const attrs = c.attributes || c.stats || {};
    const temps = c.tempModifiers || {};
    for (const k in attrs) { const st = STAT_ALIASES[String(k).toUpperCase()]; if (!st) continue; const v = attrs[k]; s.stats[st].base = num(v && typeof v === 'object' ? (v.base ?? v.value) : v, 5); }
    for (const k in temps) { const st = STAT_ALIASES[String(k).toUpperCase()]; if (st) s.stats[st].mod = num(temps[k], 0); }
    // skills: start from full list, then overlay
    const byName = {}; for (const sk of s.skills) byName[sk.name.toLowerCase()] = sk;
    const addSkill = (name, value, stat) => {
      name = str(name, 60); if (!name) return;
      const key = name.toLowerCase();
      if (byName[key]) { byName[key].value = num(value, 0); if (stat && STATS.includes(stat)) byName[key].stat = stat; return; }
      const sk = { name, stat: STATS.includes(stat) ? stat : (SKILL_STAT[key] || ''), value: num(value, 0) };
      s.skills.push(sk); byName[key] = sk;
    };
    const skills = c.skills || {};
    if (Array.isArray(skills)) skills.forEach(k => addSkill(k.name, k.value ?? k.level, k.stat && STAT_ALIASES[String(k.stat).toUpperCase()]));
    else for (const n in skills) { const v = skills[n]; if (v && typeof v === 'object') addSkill(n, v.value ?? v.level, v.stat && STAT_ALIASES[String(v.stat).toUpperCase()]); else addSkill(n, v); }
    const cs = c.customSkills || {};
    if (Array.isArray(cs)) cs.forEach(k => addSkill(k.name, k.value ?? k.level, k.stat && STAT_ALIASES[String(k.stat).toUpperCase()]));
    else for (const n in cs) { const v = cs[n]; if (v && typeof v === 'object') addSkill(v.name || n, v.value ?? v.level, v.stat && STAT_ALIASES[String(v.stat).toUpperCase()]); else addSkill(n, v); }
    s.skills.sort((a, b) => a.name.localeCompare(b.name));
    s.specialAbility = num(c.specialAbility, 0);
    if (c.humanity !== undefined) s.humanity = num(c.humanity, 50);
    s.damage = num(c.woundDamage ?? c.damage, 0);
    s.eddies = num(c.mainEddies ?? c.eddies ?? c.tradingEddies, 0);
    s.rep = num(c.reputation, 0);
    // cyberware
    (Array.isArray(c.cyberware) ? c.cyberware : []).forEach(cw => {
      if (!cw) return; if (typeof cw === 'string') { s.cyberware.push({ name: cw, hl: '', notes: '' }); return; }
      s.cyberware.push({ name: str(cw.name, 80), hl: str(cw.hl ?? cw.humanityLoss ?? '', 10), notes: str([cw.location, cw.desc || cw.notes].filter(Boolean).join(' — '), 400) });
    });
    // inventory: weapons / armor / gear
    const spLoc = (covers) => {
      const t = String(covers || '').toLowerCase(); const out = [];
      if (/all|full|whole|body/.test(t)) return ['head', 'torso', 'rArm', 'lArm', 'rLeg', 'lLeg'];
      if (/head|helmet/.test(t)) out.push('head');
      if (/torso|chest|vest|jacket/.test(t)) out.push('torso');
      if (/arm/.test(t)) out.push('rArm', 'lArm');
      if (/leg/.test(t)) out.push('rLeg', 'lLeg');
      return out;
    };
    const items = [].concat(Array.isArray(c.inventory) ? c.inventory : [], Array.isArray(c.weapons) ? c.weapons : [], Array.isArray(c.gear) ? c.gear : []);
    items.forEach(it => {
      if (!it) return;
      if (typeof it === 'string') { s.gear.push({ name: it, notes: '' }); return; }
      const name = str(it.name || it.item || 'Item', 80);
      const qty = it.quantity || it.qty;
      if (it.damage) {
        s.weapons.push({ name, type: str(it.type || it.category, 40), wa: num(it.wa ?? it.accuracy, 0), damage: str(it.damage, 30), rof: str(it.rof ?? '', 10), shots: str(it.shots ?? '', 10), range: str(it.range ?? '', 12), rel: str(it.rel ?? it.reliability ?? '', 6), skill: weaponSkill(it.type || it.category), notes: str([it.ammo, it.con && ('Conc ' + it.con)].filter(Boolean).join(', '), 300) });
      } else if (num(it.sp, 0) > 0) {
        const worn = it.equipped !== false && it.worn !== false && !it.storage && !it.location;
        const locs = spLoc(it.covers || it.type);
        if (worn) locs.forEach(l => { s.sp[l] = Math.max(s.sp[l], num(it.sp, 0)); });
        s.gear.push({ name: name + ' (SP ' + num(it.sp, 0) + (it.covers ? ', ' + it.covers : '') + ')', notes: str(it.notes || '', 400) });
      } else {
        s.gear.push({ name: name + (qty > 1 ? ' ×' + qty : ''), notes: str(it.notes || it.desc || '', 400) });
      }
    });
    if (c.tempSP && typeof c.tempSP === 'object') {
      const map = { head: 'head', torso: 'torso', rarm: 'rArm', larm: 'lArm', rleg: 'rLeg', lleg: 'lLeg', right_arm: 'rArm', left_arm: 'lArm', right_leg: 'rLeg', left_leg: 'lLeg' };
      for (const k in c.tempSP) { const l = map[String(k).toLowerCase()]; if (l) s.sp[l] += num(c.tempSP[k], 0); }
    }
    const noteBits = [];
    if (c.notes) noteBits.push(String(c.notes));
    if (Array.isArray(c.affiliations) && c.affiliations.length) noteBits.push('Affiliations: ' + c.affiliations.map(a => typeof a === 'string' ? a : (a.name || JSON.stringify(a))).join(', '));
    if (Array.isArray(c.enemies) && c.enemies.length) noteBits.push('Enemies: ' + c.enemies.map(a => typeof a === 'string' ? a : (a.name || JSON.stringify(a))).join(', '));
    s.notes = str(noteBits.join('\n\n'), 20000);
    if (isImg(c.profilePic)) s.portrait = c.profilePic;
    s.source = { site: 'cyberpunk2020character.com', playerId: (meta && meta.playerId) || c.id || null, importedAt: Date.now() };
    return s;
  }

  root.NCT = { uid, code, clone, roll, rollToText, STATS, SKILLS_BY_STAT, SKILL_STAT, ROLES, LOCS, weaponSkill, blankSheet, statVal, effStat, derived, woundInfo, skillTotal,
    DEFAULT_MODS, strBonus, cleanModValue, newCampaign, newMap, upgrade, apply, canSeeEntry, journalView, journalDiff, handleRequest, viewFor, canSeeMsg, opsFor, sanitizeSheet, sanitizeToken, fromCP2020Site, isImg };
})(typeof window !== 'undefined' ? window : globalThis);
