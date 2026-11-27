// Runs in the Linux app's import window before the character site loads: puts the helper into the page.
const { ipcRenderer, webFrame } = require('electron');
const script = ipcRenderer.sendSync('nct:site-script');
if (script) webFrame.executeJavaScript(script);
