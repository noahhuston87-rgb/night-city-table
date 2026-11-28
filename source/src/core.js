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
    { name: 'Blinded / smoke', value: '-3', applies: 'hit' }, { name: 'Large target', value: '+4', applies: 'hit' }, { name: 'Target silhouetted', value: '+2', applies: 'hit' },
    { name: 'Smartgoggles', value: '+2', applies: 'hit' }, { name: 'Targeting scope', value: '+2', applies: 'hit' }, { name: 'Turret mounted', value: '+2', applies: 'hit' },
    { name: 'Target dodging', value: '-2', applies: 'hit' }, { name: 'Turning to face', value: '-2', applies: 'hit' },
    { name: 'Melee strength bonus', value: '+0', applies: 'dmg', auto: 'str' }, { name: 'Extra damage die', value: '+1d6', applies: 'dmg' }
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
      maps: {}, activeMapId: null, chat: [], sheets: {}, init: { list: [], turn: 0, round: 1, moved: {}, rules: { limit: true, turnOnly: false } },
      journal: { folders: {}, entries: {} },
      audio: { tracks: {}, music: { playing: false, track: null, startedAt: 0, offset: 0, loop: true, volume: 0.6 } }
    };
  }
  // older saves don't have the newer sections
  function upgrade(state) {
    if (!state.init) state.init = { list: [], turn: 0 };
    if (typeof state.allowWeb !== 'boolean') state.allowWeb = false; // the DM must switch on web-browser joining
    if (!state.init.moved) state.init.moved = {};
    if (!state.init.rules) state.init.rules = { limit: true, turnOnly: false };
    if (!state.init.round) state.init.round = 1;
    if (!state.journal) state.journal = { folders: {}, entries: {} };
    if (!state.journal.folders) state.journal.folders = {};
    if (!state.journal.entries) state.journal.entries = {};
    if (!state.audio) state.audio = { tracks: {}, music: { playing: false, track: null, startedAt: 0, offset: 0, loop: true, volume: 0.6 } };
    if (!state.audio.tracks) state.audio.tracks = {};
    if (!state.audio.music) state.audio.music = { playing: false, track: null, startedAt: 0, offset: 0, loop: true, volume: 0.6 };
    return state;
  }
  function newMap(name, img, w, h) {
    return { id: uid(), name: str(name || 'Map', 80), img: img || '', w: w || 2000, h: h || 1400, grid: { size: 70, show: true, ox: 0, oy: 0, color: '', alpha: 0.25 }, tokens: {}, bg: '#0b0f1a' };
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
      case 'web.allow': state.allowWeb = !!op.on; break;
      case 'announce.add': state.announcements = state.announcements || []; state.announcements.push(op.a); if (state.announcements.length > 50) state.announcements.splice(0, state.announcements.length - 50); break;
      case 'announce.delete': state.announcements = (state.announcements || []).filter(a => a.id !== op.id); break;
      case 'rules.set': state.houseRules = state.houseRules || {}; if (op.sections) state.houseRules[op.line] = op.sections; else delete state.houseRules[op.line]; break;
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

  // conditions a token can show (key, label, badge)
  const CONDITIONS = [['stunned', 'Stunned', '💫'], ['prone', 'Prone', '⬇'], ['bleeding', 'Bleeding', '🩸'], ['unconscious', 'Unconscious', '💤'], ['dead', 'Dead', '☠'], ['fire', 'On fire', '🔥'],
    ['grappled', 'Grappled', '✊'], ['aiming', 'Aiming', '🎯'], ['hidden', 'Hidden', '🙈'], ['cover', 'In cover', '🛡'], ['poisoned', 'Poisoned', '☣'], ['blinded', 'Blinded', '🕶'],
    ['slowed', 'Slowed', '🐌'], ['shocked', 'Shocked', '⚡'], ['marked', 'Marked', '❗'], ['jacked', 'Jacked in', '🔌']];
  const COND_KEYS = CONDITIONS.map(c => c[0]);
  function cleanFaces(f) { return (Array.isArray(f) ? f : []).filter(x => x && isImg(x.img) && String(x.img).length <= 600000).slice(0, 8).map(x => ({ name: str(x.name || 'Face', 40), img: x.img })); }
  function cleanConds(c) { return [...new Set((Array.isArray(c) ? c : []).filter(k => COND_KEYS.includes(k)))]; }
  function tokenLook(t) { return { rot: ((Math.round(Number(t.rot) || 0) % 360) + 360) % 360, flip: !!t.flip, faces: cleanFaces(t.faces), face: clamp(t.face || 0, 0, 8), conds: cleanConds(t.conds) }; }
  function sanitizeToken(t, ownerId) {
    return Object.assign(tokenLook(t), {
      id: str(t.id || uid(), 20), x: clamp(t.x, -100000, 100000), y: clamp(t.y, -100000, 100000), size: clamp(t.size || 1, 0.25, 10),
      name: str(t.name, 60), color: /^#[0-9a-f]{6}$/i.test(t.color) ? t.color : '#05d9e8', img: isImg(t.img) ? t.img : '',
      sheetId: t.sheetId ? str(t.sheetId, 20) : null, hidden: !!t.hidden, ownerId: ownerId === undefined ? (t.ownerId || null) : ownerId
    });
  }
  function sanitizeSheet(s) {
    const b = blankSheet(s.ownerId);
    const out = Object.assign(b, {
      id: str(s.id || uid(), 20), ownerId: s.ownerId || null, name: str(s.name, 80) || 'Unnamed', handle: str(s.handle, 80),
      role: ROLES[s.role] ? s.role : str(s.role, 30), portrait: isImg(s.portrait) && String(s.portrait).length <= 1048576 ? s.portrait : '',
      specialAbility: clamp(s.specialAbility, 0, 10), humanity: clamp(s.humanity, -100, 200), damage: clamp(s.damage, 0, 41),
      eddies: clamp(s.eddies, -1e9, 1e12), rep: clamp(s.rep, -20, 20), notes: str(s.notes, 20000), source: s.source ? clone(s.source) : null, updatedAt: Date.now()
    });
    for (const st of STATS) { const v = (s.stats && s.stats[st]) || {}; out.stats[st] = { base: clamp(v.base, 0, 30), mod: clamp(v.mod, -20, 20), cyber: clamp(v.cyber || 0, -10, 10) }; }
    if (Array.isArray(s.skills)) out.skills = s.skills.slice(0, 300).map(k => ({ name: str(k.name, 60), stat: STATS.includes(k.stat) ? k.stat : '', value: clamp(k.value, 0, 20) }));
    for (const [k] of LOCS) out.sp[k] = clamp(s.sp && s.sp[k], 0, 100);
    out.weapons = (Array.isArray(s.weapons) ? s.weapons : []).slice(0, 60).map(w => ({ name: str(w.name, 80), type: str(w.type, 40), wa: clamp(w.wa, -10, 10), damage: str(w.damage, 30), rof: str(w.rof, 10), shots: str(w.shots, 10), range: str(w.range, 12), rel: str(w.rel, 6), skill: str(w.skill || weaponSkill(w.type), 40), notes: str(w.notes, 300),
      left: (w.left === undefined || w.left === null || w.left === '') ? (parseInt(w.shots, 10) || 0) : clamp(w.left, 0, 9999), mags: clamp(w.mags || 0, 0, 999) }));
    out.cyberware = (Array.isArray(s.cyberware) ? s.cyberware : []).slice(0, 100).map(c => ({ name: str(c.name, 80), hl: str(c.hl, 10), notes: str(c.notes, 400) }));
    out.gear = (Array.isArray(s.gear) ? s.gear : []).slice(0, 200).map(g => ({ name: str(g.name, 80), notes: str(g.notes, 400) }));
    if (Array.isArray(s.macros)) out.macros = s.macros.slice(0, 60).map(m => ({ id: str(m.id || uid(), 20), name: str(m.name || 'Macro', 40), formula: str(m.formula, 200), kind: ['hit', 'dmg'].includes(m.kind) ? m.kind : '' }));
    if (Array.isArray(s.mods)) out.mods = s.mods.slice(0, 60).map(m => ({ id: str(m.id || uid(), 20), name: str(m.name || 'Modifier', 40), value: cleanModValue(m.value) || '+0', applies: ['hit', 'dmg', 'both'].includes(m.applies) ? m.applies : 'hit', on: !!m.on, auto: m.auto === 'str' ? 'str' : undefined }));
    return out;
  }

  // ---------- movement in combat ----------
  // While anyone is on the initiative tracker, a token linked to a character can move up to its run
  // distance (MA x 3 m) per round, split across as many moves as it likes. One grid square = 2 m.
  function combatOn(state) { return !!(state.init && state.init.list && state.init.list.length); }
  function tokenRun(state, t) { const sh = t && t.sheetId && state.sheets[t.sheetId]; return sh ? derived(sh).run : null; }
  function moveMetres(m, x1, y1, x2, y2) { return Math.round(Math.hypot(x2 - x1, y2 - y1) / m.grid.size * 2 * 10) / 10; }
  function movedThisRound(state, t) { upgrade(state); return Number(state.init.moved[t.id]) || 0; }
  function isTokensTurn(state, t) { const cur = state.init.list[state.init.turn]; return !!(cur && t.sheetId && cur.sheetId === t.sheetId); }

  // ---------- attacks against a target ----------
  const RANGE_BANDS = [['Point blank', 10], ['Close', 15], ['Medium', 20], ['Long', 25], ['Extreme', 30]];
  const COVER = [['Sheetrock', 5], ['Wood door', 5], ['Concrete', 10], ['Car body', 10], ['Heavy wood', 15], ['Steel door', 20], ['Brick wall', 25], ['Mailbox', 25], ['Curb', 25], ['Stone wall', 30], ['Tree / pole', 30], ['Engine block', 35], ['Hydrant', 35]];
  const UNARMED = { punch: { name: 'Punch', dmg: '1d6', half: true }, strike: { name: 'Strike', dmg: '1d6', half: true }, kick: { name: 'Kick', dmg: '1d6', half: false } };
  const MELEE_SKILLS = ['melee', 'fencing', 'brawling', 'martial arts'];
  function isMeleeWeapon(w) { return !!w && (MELEE_SKILLS.includes(String(w.skill || '').toLowerCase()) || /melee|knife|sword|club|blade|axe|katana|baton|fist|unarmed/i.test(w.type || '')); }
  // weapon range in metres: the number on the weapon, or the usual range for its type
  function weaponRange(w, sheet) {
    const n = parseFloat(String(w && w.range || '').replace(/[^0-9.]/g, ''));
    if (n > 0) return n;
    const t = String((w && (w.type + ' ' + w.skill)) || '').toLowerCase();
    if (/thrown|grenade/.test(t)) return statVal(sheet, 'BODY') * 10;
    if (/smg|submachine/.test(t)) return 150;
    if (/shotgun/.test(t)) return 50;
    if (/rifle|sniper|assault|heavy/.test(t)) return 400;
    return 50; // pistols and anything else
  }
  function rangeBand(dist, range) {
    if (dist <= 3) return 0;                 // point blank: right next to them, diagonals included
    if (dist <= range / 4) return 1;
    if (dist <= range / 2) return 2;
    if (dist <= range) return 3;
    if (dist <= range * 2) return 4;
    return -1;                               // out of range
  }
  function tokenCentre(t, m) { const p = t.size * m.grid.size; return [t.x + p / 2, t.y + p / 2]; }
  function tokenDistance(m, a, b) { const [x1, y1] = tokenCentre(a, m), [x2, y2] = tokenCentre(b, m); return Math.round(Math.hypot(x2 - x1, y2 - y1) / m.grid.size * 2 * 10) / 10; }
  function locName(k) { const l = LOCS.find(x => x[0] === k); return l ? l[1] : k; }
  function rollLocation() { const r = rnd(10); return r === 1 ? 'head' : r <= 4 ? 'torso' : r === 5 ? 'rArm' : r === 6 ? 'lArm' : r <= 8 ? 'rLeg' : 'lLeg'; }
  function skillVal(sheet, name) { const k = (sheet.skills || []).find(x => x.name.toLowerCase() === String(name || '').toLowerCase()); return k ? Number(k.value) || 0 : 0; }
  function safeFormula(f) { f = String(f || '').replace(/\s+/g, ''); if (!f) return ''; if (!/^[+-]/.test(f)) f = '+' + f; try { roll('0' + f); return f; } catch (e) { return null; } }

  // the whole attack, rolled by the DM's app: to-hit vs range (or the target's dodge in melee), then damage
  function resolveAttack(state, req, sender) {
    upgrade(state);
    const m = state.maps[req.mapId]; if (!m) return { error: 'No map' };
    const at = m.tokens[req.attackerToken], tt = m.tokens[req.targetToken];
    if (!at || !tt) return { error: 'Pick a target on the map first' };
    if (at.id === tt.id) return { error: "You can't target yourself" };
    const ash = at.sheetId && state.sheets[at.sheetId]; if (!ash) return { error: 'Your token needs to be linked to your character' };
    if (!sender.isGM && ash.ownerId !== sender.id) return { error: "That's not your character" };
    const tsh = tt.sheetId && state.sheets[tt.sheetId];
    const attacker = clone(ash), target = tsh ? clone(tsh) : null;
    const tName = (target && target.name) || tt.name || 'the target';
    const lines = []; const dist = tokenDistance(m, at, tt);
    // the weapon (or bare hands)
    let w, wi = -1, unarmed = null;
    if (String(req.weapon).startsWith('unarmed:')) { unarmed = UNARMED[String(req.weapon).slice(8)] || UNARMED.punch; }
    else { wi = Number(req.weapon); w = attacker.weapons[wi]; if (!w) return { error: 'Pick a weapon' }; }
    const melee = !!unarmed || isMeleeWeapon(w);
    const wName = unarmed ? unarmed.name : (w.name || 'weapon');
    if (melee && dist > 3) return { error: 'Too far for a melee attack (' + dist + ' m). Move next to them first.' };
    // mode & ammo
    let mode = melee ? 'single' : (['single', 'burst', 'auto'].includes(req.mode) ? req.mode : 'single');
    const mag = w ? (parseInt(w.shots, 10) || 0) : 0;
    let rounds = mode === 'burst' ? 3 : mode === 'auto' ? clamp(req.rounds || 10, 1, 200) : 1;
    if (!melee && mag > 0) {
      const left = clamp(w.left === undefined ? mag : w.left, 0, 9999);
      if (left <= 0) return { error: '*Click* ' + wName + ' is empty. Reload first.' };
      if (rounds > left) { lines.push('Only ' + left + ' round' + (left === 1 ? '' : 's') + ' left, firing those'); rounds = left; }
      w.left = left - rounds;
    }
    // to-hit
    const ref = effStat(attacker, 'REF');
    const skillName = unarmed ? (skillVal(attacker, 'Martial Arts') > skillVal(attacker, 'Brawling') ? 'Martial Arts' : 'Brawling') : (w.skill || weaponSkill(w.type));
    const skill = skillVal(attacker, skillName);
    const wa = unarmed ? 0 : (Number(w.wa) || 0);
    const hitMod = safeFormula(req.hitMod); if (hitMod === null) return { error: 'Bad to-hit modifier' };
    const dmgMod = safeFormula(req.dmgMod); if (dmgMod === null) return { error: 'Bad damage modifier' };
    let bonus = ref + skill + wa; const parts = ['REF ' + ref, skillName + ' ' + skill]; if (wa) parts.push('WA ' + (wa > 0 ? '+' : '') + wa);
    let band = -1, dv = null, range = null;
    if (!melee) {
      range = weaponRange(w, attacker); band = rangeBand(dist, range);
      if (band < 0) return { error: tName + ' is out of range: ' + dist + ' m, ' + wName + ' reaches ' + (range * 2) + ' m at most' };
      dv = RANGE_BANDS[band][1];
      if (mode === 'burst' && (band === 1 || band === 2)) { bonus += 3; parts.push('burst +3'); }
      if (mode === 'auto') { const k = Math.floor(rounds / 10); if (k) { const v = band <= 1 ? k : -k; bonus += v; parts.push('full auto ' + (v > 0 ? '+' : '') + v); } }
    }
    const called = LOCS.some(l => l[0] === req.called) ? req.called : '';
    if (called) { bonus -= 4; parts.push('called shot −4'); }
    const atk = roll('1d10!' + (bonus >= 0 ? '+' : '') + bonus + (hitMod || ''));
    lines.push('Attack: ' + rollToText(atk) + '  (' + parts.join(' + ').replace(/\+ -/g, '− ') + (hitMod ? ' + modifiers ' + hitMod : '') + ')' + (req.hitNote ? '  [' + str(req.hitNote, 200) + ']' : ''));
    let hit, margin;
    if (melee) {
      if (target) {
        const dodge = Math.max(skillVal(target, 'Dodge & Escape'), skillVal(target, 'Dodge/Escape'));
        const def = roll('1d10!+' + (effStat(target, 'REF') + dodge));
        lines.push(tName + ' dodges: ' + rollToText(def) + ' (REF + Dodge & Escape)');
        hit = !atk.fumble && atk.total > def.total; margin = atk.total - def.total;
      } else { dv = 15; hit = !atk.fumble && atk.total >= dv; margin = atk.total - dv; lines.push('Needs ' + dv + ' (target has no sheet)'); }
    } else {
      lines.push('Range: ' + dist + ' m · ' + RANGE_BANDS[band][0] + ' (weapon range ' + range + ' m) → needs ' + dv);
      hit = !atk.fumble && atk.total >= dv; margin = atk.total - dv;
    }
    if (atk.fumble) lines.push('FUMBLE: a natural 1. The DM decides what goes wrong.');
    // how many bullets land
    let hits = 0;
    if (hit) {
      if (mode === 'burst') { const r = roll('1d6'); hits = Math.ceil(r.total / 2); lines.push('Burst: 1d6[' + r.total + '] ÷ 2 → ' + hits + ' round' + (hits === 1 ? '' : 's') + ' hit'); }
      else if (mode === 'auto') { hits = Math.min(rounds, Math.max(1, margin)); lines.push('Full auto: beat the roll by ' + margin + ' → ' + hits + ' of ' + rounds + ' rounds hit'); }
      else hits = 1;
    }
    // damage, one hit at a time
    let totalWounds = 0; const hitDetail = [];
    const cover = clamp(req.cover || 0, 0, 100); const ap = !!req.ap;
    const maBonus = unarmed && skillName === 'Martial Arts' ? skill : 0;
    for (let h = 0; h < hits; h++) {
      const loc = called || rollLocation();
      let dmgRoll; try { dmgRoll = roll((unarmed ? unarmed.dmg : String(w.damage || '1d6').replace(/D/g, 'd')) + (dmgMod || '') + (maBonus ? '+' + maBonus : '')); } catch (e) { return { error: 'The damage "' + (w && w.damage) + '" isn\'t a dice roll like 2d6+3' }; }
      let dmg = dmgRoll.total; if (unarmed && unarmed.half) dmg = Math.max(1, Math.ceil(dmg / 2));
      const d = { loc, rolled: dmg, text: rollToText(dmgRoll) + (unarmed && unarmed.half ? ' ÷ 2 = ' + dmg : '') };
      if (target) {
        let sp = (Number(target.sp[loc]) || 0) + cover; if (ap) sp = Math.floor(sp / 2);
        let through = Math.max(0, dmg - sp);
        const btm = derived(target).btm;
        const undoubled = through > 0 ? Math.max(1, through + btm) : 0; // what the hit does before the head doubling
        if (through > 0 && loc === 'head') through *= 2;
        const wounds = through > 0 ? Math.max(1, through + btm) : 0;
        if (wounds > 0 && (Number(target.sp[loc]) || 0) > 0) { target.sp[loc] -= 1; d.wear = true; }
        target.damage = Math.min(41, target.damage + wounds); totalWounds += wounds;
        Object.assign(d, { sp, through, btm, wounds });
        // 2020: a head hit doing 8+ (before doubling) kills; a limb taking more than 8 in one hit is lost (death save at Mortal 0)
        if (undoubled >= 8 && loc === 'head') { d.note = 'Head hit of 8+ (before doubling): killed outright'; target.damage = 41; }
        else if (wounds > 8 && loc !== 'torso' && loc !== 'head') d.note = 'Limb took more than 8: severed or crushed. Death save at Mortal 0';
      }
      hitDetail.push(d);
      lines.push('Hit ' + (h + 1) + ' · ' + locName(loc) + ': ' + d.text + (target ? '  − SP ' + d.sp + (ap ? ' (AP)' : '') + (d.through > 0 && loc === 'head' ? ' → ×2 head' : '') + ' − BTM ' + (-d.btm) + ' = ' + d.wounds + ' wound' + (d.wounds === 1 ? '' : 's') + (d.wear ? ' (armor −1 SP)' : '') : '') + (d.note ? '  ⚠ ' + d.note : ''));
    }
    // stun save for the target
    if (target && totalWounds > 0 && target.damage >= 41) lines.push('☠ ' + tName + ' is DEAD.');
    else if (target && totalWounds > 0) {
      const dd = derived(target); const st = roll('1d10');
      lines.push(tName + ' is now ' + woundInfo(target.damage).label + ' (' + target.damage + '/40). Stun save: 1d10[' + st.total + '] vs ' + dd.stunTarget + ' or less → ' + (st.total <= dd.stunTarget ? 'stays up' : 'STUNNED'));
      if (dd.deathTarget !== null) lines.push('Mortally wounded: ' + tName + ' must make a death save every turn (' + dd.deathTarget + ' or less on 1d10).');
    }
    const ops = [];
    if (w && mag > 0) ops.push({ type: 'sheet.upsert', sheet: sanitizeSheet(attacker) });
    if (target && totalWounds > 0) ops.push({ type: 'sheet.upsert', sheet: sanitizeSheet(target) });
    const title = attacker.name + ' → ' + tName + ' · ' + wName + (mode === 'burst' ? ' (3-round burst)' : mode === 'auto' ? ' (full auto, ' + rounds + ' rounds)' : '');
    return { ops, combat: { title, hit, hits, wounds: totalWounds, lines, attack: atk.total, dv, fumble: atk.fumble, crit: atk.crit } };
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
    const out = { id: str(t.id || uid(), 20), name: str(t.name || 'Track', 80), kind: t.kind === 'sound' ? 'sound' : 'music', url: /^https:\/\//.test(String(t.url || '')) ? str(t.url, 2000) : '', file: !!t.file, size: clamp(t.size || 0, 0, 1e9) };
    // songs found on YouTube for a Spotify link: [{ v: video id, d: seconds, n: name }]
    if (Array.isArray(t.queue)) { const q = t.queue.filter(x => x && /^[\w-]{11}$/.test(String(x.v))).slice(0, 100).map(x => ({ v: String(x.v), d: clamp(Number(x.d) || 0, 0, 36000), n: str(x.n || '', 120) })); if (q.length) out.queue = q; }
    if (/^https:\/\/open\.spotify\.com\//.test(String(t.src || ''))) out.src = str(t.src, 300);
    return out;
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
          upgrade(state); const init = clone(state.init);
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
        const m = newMap(req.name, isImg(req.img) ? req.img : '', clamp(req.w, 100, 16000), clamp(req.h, 100, 16000));
        if (req.grid) m.grid.size = clamp(req.grid, 10, 400);
        out.ops.push({ type: 'map.add', map: m }); return out;
      }
      case 'map.update': {
        if (!isGM || !state.maps[req.id]) return deny();
        const p = {}; const q = req.patch || {};
        if (q.name !== undefined) p.name = str(q.name, 80);
        if (q.bg !== undefined && /^#[0-9a-f]{6}$/i.test(q.bg)) p.bg = q.bg;
        if (q.grid) { p.grid = {}; if (q.grid.size !== undefined) p.grid.size = Math.round(clamp(q.grid.size, 10, 400) * 100) / 100; if (q.grid.show !== undefined) p.grid.show = !!q.grid.show; if (q.grid.ox !== undefined) p.grid.ox = clamp(q.grid.ox, -400, 400); if (q.grid.oy !== undefined) p.grid.oy = clamp(q.grid.oy, -400, 400); if (q.grid.alpha !== undefined) p.grid.alpha = clamp(q.grid.alpha, 0, 1); if (q.grid.color !== undefined && /^#[0-9a-f]{6}$/i.test(q.grid.color)) p.grid.color = q.grid.color; }
        if (q.w !== undefined) p.w = Math.round(clamp(q.w, 100, 16000)); if (q.h !== undefined) p.h = Math.round(clamp(q.h, 100, 16000));
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
        // facing, mirror, transformation faces and condition markers: the token's owner or the DM
        if (q.rot !== undefined) p.rot = ((Math.round(Number(q.rot) || 0) % 360) + 360) % 360;
        if (q.flip !== undefined) p.flip = !!q.flip;
        if (q.faces !== undefined) p.faces = cleanFaces(q.faces);
        if (q.face !== undefined) p.face = clamp(q.face, 0, 8);
        if (q.conds !== undefined) p.conds = cleanConds(q.conds);
        if (isGM) { if (q.hidden !== undefined) p.hidden = !!q.hidden; if (q.sheetId !== undefined) { p.sheetId = q.sheetId && state.sheets[q.sheetId] ? q.sheetId : null; p.ownerId = p.sheetId ? (state.sheets[p.sheetId].ownerId || null) : null; } }
        const moving = (p.x !== undefined && p.x !== t.x) || (p.y !== undefined && p.y !== t.y);
        if (moving && combatOn(state) && t.sheetId && state.sheets[t.sheetId]) {
          upgrade(state);
          const dist = moveMetres(m, t.x, t.y, p.x ?? t.x, p.y ?? t.y);
          const run = tokenRun(state, t); const used = movedThisRound(state, t);
          if (!isGM) {
            if (state.init.rules.turnOnly && !isTokensTurn(state, t)) return deny("It's not your turn. Wait for your turn in initiative to move.");
            if (state.init.rules.limit && run !== null && used + dist > run + 0.05) return deny('Not enough movement left this round: ' + Math.max(0, Math.round((run - used) * 10) / 10) + ' m of ' + run + ' m');
          }
          const init = clone(state.init); init.moved[t.id] = Math.round((used + dist) * 10) / 10;
          out.ops.push({ type: 'token.update', mapId: req.mapId, id: req.id, patch: p }, { type: 'init.set', init });
          return out;
        }
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
        if (!existing) clean.id = isGM && /^[\w-]{6,20}$/.test(String(s.id || '')) ? String(s.id) : uid(); // the DM may pick the id (NPC library places tokens linked to it)
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
      case 'announce.send': { // DM: a message with pictures, to everyone or chosen players
        if (!isGM) return deny('Only the DM can send announcements');
        const imgs = (Array.isArray(req.imgs) ? req.imgs : []).filter(u => isImg(u) && String(u).length <= 2000000).slice(0, 6);
        const text = str(req.text || '', 4000).trim(), title = str(req.title || '', 120).trim();
        if (!text && !imgs.length && !title) return deny('Write something or add a picture');
        const to = Array.isArray(req.to) && req.to.length ? req.to.map(x => str(x, 40)).slice(0, 50) : null;
        out.ops.push({ type: 'announce.add', a: { id: uid(), ts: Date.now(), from: str((state.players[sender.id] && state.players[sender.id].name) || 'DM', 40), title, text, imgs, to } }); return out;
      }
      case 'announce.delete': if (!isGM) return deny(); out.ops.push({ type: 'announce.delete', id: str(req.id, 20) }); return out;
      case 'rules.set': { // DM's own version of the quick rules (house rules); null = back to the original
        if (!isGM) return deny('Only the DM can change the rules');
        const line = req.line === 'red' ? 'red' : '2020';
        const sections = Array.isArray(req.sections) ? req.sections.slice(0, 80).map(x => [str(x && x[0], 80) || 'Rules', (Array.isArray(x && x[1]) ? x[1] : []).slice(0, 60).map(l => str(l, 1500)).filter(l => l.trim())]).filter(x => x[1].length) : null;
        out.ops.push({ type: 'rules.set', line, sections }); return out;
      }
      case 'web.allow': { if (!isGM) return deny('Only the DM can change this'); out.ops.push({ type: 'web.allow', on: !!req.on }); return out; }
      case 'init.set': {
        if (!isGM) return deny();
        upgrade(state);
        const i = req.init || {}; const list = (Array.isArray(i.list) ? i.list : []).slice(0, 60).map(e => ({ id: str(e.id || uid(), 20), name: str(e.name, 60), value: clamp(e.value, -99, 999), sheetId: e.sheetId || null }));
        const rules = i.rules ? { limit: i.rules.limit !== false, turnOnly: !!i.rules.turnOnly } : state.init.rules;
        let round = clamp(state.init.round || 1, 1, 9999), moved = clone(state.init.moved) || {};
        if (req.newRound) { round += 1; moved = {}; }
        if (!list.length) { round = 1; moved = {}; }
        if (i.resetToken) delete moved[i.resetToken];
        out.ops.push({ type: 'init.set', init: { list, turn: clamp(i.turn || 0, 0, Math.max(0, list.length - 1)), round, moved, rules } }); return out;
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
        out.ops.push({ type: 'music.set', music: { playing: true, track: Object.assign({ id: t.id, name: t.name, url: t.url, file: t.file }, t.queue ? { queue: t.queue } : {}), startedAt: Date.now(), offset: clamp(req.offset || 0, 0, 1e6), loop: req.loop !== false, volume: clamp(req.volume ?? state.audio.music.volume ?? 0.6, 0, 1) } }); return out;
      }
      case 'music.stop': if (!isGM) return deny(); upgrade(state); out.ops.push({ type: 'music.set', music: Object.assign({}, state.audio.music, { playing: false, paused: false }) }); return out;
      case 'music.pause': { // DM only: remember where the song is so Resume carries on from there
        if (!isGM) return deny('Only the DM can pause the music'); upgrade(state); const m = state.audio.music; if (!m.playing || !m.track) return out;
        const pos = (m.offset || 0) + Math.max(0, (Date.now() - (m.startedAt || Date.now())) / 1000);
        out.ops.push({ type: 'music.set', music: Object.assign({}, m, { playing: false, paused: true, offset: pos }) }); return out;
      }
      case 'music.resume': {
        if (!isGM) return deny('Only the DM can play the music'); upgrade(state); const m = state.audio.music; if (!m.paused || !m.track) return out;
        out.ops.push({ type: 'music.set', music: Object.assign({}, m, { playing: true, paused: false, startedAt: Date.now() }) }); return out;
      }
      case 'music.volume': if (!isGM) return deny(); upgrade(state); out.ops.push({ type: 'music.set', music: Object.assign({}, state.audio.music, { volume: clamp(req.volume, 0, 1) }) }); return out;
      case 'sound.play': {
        if (!isGM) return deny(); upgrade(state); const t = state.audio.tracks[req.id]; if (!t) return deny('No such sound');
        out.transient.push({ type: 'sound', track: { id: t.id, name: t.name, url: t.url, file: t.file }, volume: clamp(req.volume ?? 1, 0, 1) }); return out;
      }
      case 'attack': {
        const r = resolveAttack(state, req, sender); if (r.error) return deny(r.error);
        out.ops.push(...r.ops, { type: 'chat', msg: chatMsg({ combat: r.combat }) }); return out;
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
    if (playerId !== s.gmId) s.announcements = (s.announcements || []).filter(a => !a.to || a.to.includes(playerId));
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
      if (o.type === 'announce.add' && o.a.to && !o.a.to.includes(playerId)) continue;
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
    DEFAULT_MODS, CONDITIONS, strBonus, cleanModValue, RANGE_BANDS, COVER, UNARMED, isMeleeWeapon, weaponRange, rangeBand, tokenDistance, newCampaign, newMap, upgrade, apply, combatOn, tokenRun, moveMetres, movedThisRound, isTokensTurn, canSeeEntry, journalView, journalDiff, handleRequest, viewFor, canSeeMsg, opsFor, sanitizeSheet, sanitizeToken, fromCP2020Site, isImg };
})(typeof window !== 'undefined' ? window : globalThis);
