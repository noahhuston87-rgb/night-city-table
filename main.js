// Night City Table — desktop app shell (Electron)
const { app, BrowserWindow, protocol, net, shell, ipcMain, clipboard, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pathToFileURL } = require('url');

const REPO = 'noahhuston87-rgb/night-city-table';
const DOWNLOAD_URL = 'https://github.com/' + REPO + '/releases/latest';
const ROOT = path.join(__dirname, 'app');

// The game runs from app://nct/ so its saved games live in a stable place on this computer.
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);

if (!app.requestSingleInstanceLock()) { app.quit(); }

let win = null;
let update = { available: false };

function createWindow() {
  win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 900, minHeight: 600,
    backgroundColor: '#070a12', title: 'Night City Table', autoHideMenuBar: true,
    icon: path.join(__dirname, 'app', 'icon-512.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.loadURL('app://nct/index.html');
  // links to websites open in the normal browser
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://nct/')) { e.preventDefault(); if (/^https?:\/\//.test(url)) shell.openExternal(url); } });
  // the DM is warned before closing while players are connected
  win.webContents.on('will-prevent-unload', e => {
    const choice = dialog.showMessageBoxSync(win, { type: 'question', buttons: ['Close anyway', 'Keep playing'], defaultId: 1, cancelId: 1, title: 'Players are connected', message: 'Players are connected to your game.', detail: 'If you close Night City Table they will be disconnected until you open the game again. Your game is saved.' });
    if (choice === 0) e.preventDefault();
  });
  win.on('closed', () => { win = null; });
}

async function checkForUpdate() {
  try {
    const res = await net.fetch('https://api.github.com/repos/' + REPO + '/releases/latest', { headers: { 'User-Agent': 'NightCityTable' } });
    if (!res.ok) return;
    const rel = await res.json();
    const latest = String(rel.tag_name || '').replace(/^v/, '');
    const newer = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) > (y[i] || 0)) return true; if ((x[i] || 0) < (y[i] || 0)) return false; } return false; };
    if (latest && newer(latest, app.getVersion())) {
      update = { available: true, version: latest, url: rel.html_url || DOWNLOAD_URL };
      if (win) win.webContents.send('nct:update', update);
    }
  } catch (e) { /* offline: try again next launch */ }
}

ipcMain.on('nct:info', e => { e.returnValue = { version: app.getVersion(), downloadUrl: DOWNLOAD_URL, update }; });
ipcMain.handle('nct:clip-read', () => clipboard.readText());
ipcMain.on('nct:clip-write', (e, t) => clipboard.writeText(String(t || '')));
ipcMain.on('nct:open-external', (e, url) => { if (/^https:\/\//.test(String(url))) shell.openExternal(url); });
ipcMain.on('nct:bookmark-page', (e, href) => {
  if (!String(href).startsWith('javascript:')) return;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const html = '<!DOCTYPE html><meta charset="utf-8"><title>Night City Table: import button</title>' +
    '<body style="background:#070a12;color:#e6f4ff;font:18px/1.5 system-ui,sans-serif;max-width:640px;margin:60px auto;padding:0 20px">' +
    '<h1 style="color:#05d9e8">Night City Table: import button</h1>' +
    '<ol><li>Show your bookmarks bar: press <b>Ctrl+Shift+B</b> (or <b>⌘+Shift+B</b> on Mac).</li>' +
    '<li><b>Drag this pink button</b> up onto the bookmarks bar:<p><a href="' + esc(href) + '" style="display:inline-block;background:#ff2a6d;color:#fff;padding:10px 16px;border-radius:6px;font-weight:700;text-decoration:none">⇩ Send to Night City Table</a></p></li>' +
    '<li>Open your character on <b>cyberpunk2020character.com</b> and click the bookmark.</li>' +
    '<li>A small window says <b>Sent</b> and your character pops up in the Night City Table app (keep the app open).</li></ol>' +
    '<p style="color:#8aa0c2">You can close this page now. You only need to do this once.</p></body>';
  const f = path.join(os.tmpdir(), 'night-city-table-import-button.html');
  fs.writeFileSync(f, html);
  shell.openPath(f);
});

// character import window (same idea as the Windows/Mac app): the helper bar sends the character by
// navigating to https://nct-import.local/#<data>, which is caught here and given to the game window
let siteWin = null, siteScript = '';
ipcMain.on('nct:site-script', e => { e.returnValue = siteScript; });
// Spotify → YouTube lookups for music (only these two sites)
ipcMain.handle('nct:fetch-text', async (e, url) => {
  const u = new URL(String(url));
  if (u.protocol !== 'https:' || !['open.spotify.com', 'www.youtube.com'].includes(u.hostname)) throw new Error('not allowed');
  const r = await net.fetch(u.href, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36', 'Accept-Language': 'en-US,en;q=0.9', 'Cookie': 'CONSENT=YES+1' } });
  return await r.text();
});
ipcMain.on('nct:site-import', (e, script) => {
  siteScript = String(script || '');
  if (siteWin && !siteWin.isDestroyed()) { siteWin.focus(); return; }
  siteWin = new BrowserWindow({ width: 1280, height: 860, title: 'Import a character: cyberpunk2020character.com', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'site-preload.js'), contextIsolation: true, sandbox: false, nodeIntegration: false } });
  const catchSend = (ev, url) => {
    try { const u = new URL(url); if (u.hostname === 'nct-import.local') { ev.preventDefault(); const d = u.searchParams.get('d') || decodeURIComponent(u.hash.slice(1)); if (win && d) { win.webContents.send('nct:site-character', d); win.focus(); } } } catch (er) { }
  };
  siteWin.webContents.on('will-navigate', catchSend);
  siteWin.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  siteWin.on('closed', () => { siteWin = null; });
  siteWin.loadURL('https://cyberpunk2020character.com/');
});

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
// The "Send to Night City Table" bookmark opens http://127.0.0.1:47820/import?d=<character>.
// This tiny server (only reachable from this computer) hands the character to the game.
function startImportServer() {
  const http = require('http');
  const done = '<!DOCTYPE html><meta charset="utf-8"><title>Sent to Night City Table</title><body style="background:#070a12;color:#39ff6a;font:18px/1.5 system-ui,sans-serif;text-align:center;padding:40px 20px"><h2>&#10003; Sent to Night City Table</h2><p style="color:#8aa0c2">Switch to the app: your character is waiting there. This window closes by itself.</p><script>setTimeout(function(){window.close()},1800)</script></body>';
  const srv = http.createServer({ maxHeaderSize: 16 * 1024 * 1024 }, (req, res) => {
    const hdr = { 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Private-Network': 'true', 'Cache-Control': 'no-store' };
    let u; try { u = new URL(req.url, 'http://127.0.0.1'); } catch (e) { res.writeHead(400, hdr); return res.end(); }
    if (u.pathname === '/ping') { res.writeHead(200, hdr); return res.end('ok'); }
    const d = u.pathname === '/import' && u.searchParams.get('d');
    if (d && win) { win.webContents.send('nct:site-character', d); if (win.isMinimized()) win.restore(); win.show(); win.focus(); res.writeHead(200, hdr); return res.end(done); }
    res.writeHead(404, hdr); res.end('Night City Table');
  });
  srv.on('error', () => { });
  srv.listen(47820, '127.0.0.1');
}

app.whenReady().then(() => {
  startImportServer();
  protocol.handle('app', req => {
    const u = new URL(req.url);
    let p = decodeURIComponent(u.pathname); if (p === '/' || p === '') p = '/index.html';
    const file = path.normalize(path.join(ROOT, p));
    if (!file.startsWith(ROOT)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
  Menu.setApplicationMenu(process.platform === 'darwin' ? Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' }]) : null);
  createWindow();
  win.webContents.once('did-finish-load', () => setTimeout(checkForUpdate, 3000));
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
