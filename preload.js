// Small, safe bridge between the game page and the desktop app.
const { contextBridge, ipcRenderer } = require('electron');
const info = ipcRenderer.sendSync('nct:info');
const listeners = [];
let update = info.update;
ipcRenderer.on('nct:update', (e, u) => { update = u; listeners.forEach(f => { try { f(u); } catch (er) { } }); });
contextBridge.exposeInMainWorld('nctDesktop', {
  version: info.version,
  downloadUrl: info.downloadUrl,
  getUpdate: () => update,
  onUpdate: fn => { if (typeof fn === 'function') listeners.push(fn); },
  readClipboard: () => ipcRenderer.invoke('nct:clip-read'),
  writeClipboard: t => ipcRenderer.send('nct:clip-write', String(t)),
  openExternal: url => ipcRenderer.send('nct:open-external', String(url)),
  openBookmarkPage: href => ipcRenderer.send('nct:bookmark-page', String(href))
});
