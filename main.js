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
    '<li>Switch back to the Night City Table app. Your character pops up there.</li></ol>' +
    '<h2 style="color:#05d9e8;font-size:20px">Dragging doesn\'t work?</h2>' +
    '<p>Copy the code, then add a bookmark by hand: right-click the bookmarks bar, choose <b>Add page</b> (Chrome or Edge) or <b>Add Bookmark</b> (Firefox). Name it <b>Send to Night City Table</b>, paste the code into the <b>URL</b> box, and save.</p>' +
    '<p><button id="cp" style="background:#05d9e8;color:#000;border:0;padding:10px 16px;border-radius:6px;font-weight:700;font-size:16px;cursor:pointer">Copy bookmark code</button></p>' +
    '<textarea id="code" readonly style="width:100%;height:70px;background:#000;color:#7f8;border:1px solid #334">' + esc(href) + '</textarea>' +
    '<script>document.getElementById("cp").onclick=function(){var t=document.getElementById("code");t.select();var ok=false;try{ok=document.execCommand("copy")}catch(e){}if(navigator.clipboard)navigator.clipboard.writeText(t.value).then(function(){},function(){});this.textContent=ok?"Copied!":"Copied (or press Ctrl+C)";};</script>' +
    '<p style="color:#8aa0c2">You can close this page now. You only need to do this once.</p></body>';
  const f = path.join(os.tmpdir(), 'night-city-table-import-button.html');
  fs.writeFileSync(f, html);
  shell.openPath(f);
});

// character import window (same idea as the Windows/Mac app): the helper bar sends the character by
// navigating to https://nct-import.local/#<data>, which is caught here and given to the game window
let siteWin = null, siteScript = '';
ipcMain.on('nct:site-script', e => { e.returnValue = siteScript; });
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
app.whenReady().then(() => {
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
