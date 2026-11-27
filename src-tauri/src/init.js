// Runs inside the game window before the game loads: the bridge between the game page and the Rust app.
(function () {
  if (window.nctDesktop) return;
  var REPO = '__REPO__', VERSION = '__VERSION__', AUTO_UPDATE = __AUTO_UPDATE__;
  function inv(cmd, args) { return window.__TAURI__.core.invoke(cmd, args || {}); }
  var update = { available: false }, updateListeners = [], closeHandler = null, siteListeners = [];
  function newer(a, b) {
    var x = a.split('.').map(Number), y = b.split('.').map(Number);
    for (var i = 0; i < 3; i++) { if ((x[i] || 0) > (y[i] || 0)) return true; if ((x[i] || 0) < (y[i] || 0)) return false; }
    return false;
  }
  window.nctDesktop = {
    version: VERSION,
    downloadUrl: 'https://github.com/' + REPO + '/releases/latest',
    getUpdate: function () { return update; },
    onUpdate: function (f) { if (typeof f === 'function') updateListeners.push(f); },
    readClipboard: function () { return inv('clip_read'); },
    writeClipboard: function (t) { return inv('clip_write', { text: String(t) }); },
    openExternal: function (u) { return inv('open_external', { url: String(u) }); },
    openBookmarkPage: function (h) { return inv('bookmark_page', { href: String(h) }); },
    onCloseRequested: function (f) { closeHandler = f; },
    closeNow: function () { return inv('close_now'); },
    canAutoUpdate: AUTO_UPDATE,
    openSiteImport: function (script) { return inv('open_site_import', { script: String(script) }); },
    fetchText: function (url) { return inv('fetch_text', { url: String(url) }); },
    onSiteCharacter: function (f) { if (typeof f === 'function') siteListeners.push(f); },
    // downloads and installs the new version, then the app restarts by itself
    installUpdate: function (onProgress) {
      return new Promise(function (resolve, reject) {
        var ev = window.__TAURI__.event, offs = [];
        ev.listen('nct-update-progress', function (e) { if (onProgress) onProgress(e.payload); if (e.payload >= 100) resolve(); }).then(function (u) { offs.push(u); });
        ev.listen('nct-update-error', function (e) { offs.forEach(function (u) { u(); }); reject(new Error(String(e.payload))); }).then(function (u) { offs.push(u); });
        inv('update_install', { version: update.version }).catch(reject);
      });
    }
  };
  function whenTauri(fn, tries) {
    if (window.__TAURI__ && window.__TAURI__.event) return fn();
    if ((tries || 0) > 100) return;
    setTimeout(function () { whenTauri(fn, (tries || 0) + 1); }, 50);
  }
  whenTauri(function () {
    window.__TAURI__.event.listen('nct-site-character', function (e) { siteListeners.forEach(function (f) { try { f(e.payload); } catch (er) { } }); });
    window.__TAURI__.event.listen('nct-close-requested', function () { if (closeHandler) { try { closeHandler(); } catch (e) { inv('close_now'); } } else inv('close_now'); });
  });
  // tell the game when a newer version is on GitHub
  setTimeout(function () {
    fetch('https://api.github.com/repos/' + REPO + '/releases/latest').then(function (r) { return r.ok ? r.json() : null; }).then(function (rel) {
      if (!rel) return;
      var v = String(rel.tag_name || '').replace(/^v/, '');
      if (v && newer(v, VERSION)) { update = { available: true, version: v, url: rel.html_url }; updateListeners.forEach(function (f) { try { f(update); } catch (e) { } }); }
    }).catch(function () { });
  }, 3000);
  // web links open in the normal browser, not inside the game window
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null; if (!a) return;
    var h = a.getAttribute('href') || '';
    if (/^https?:\/\//i.test(h)) { e.preventDefault(); inv('open_external', { url: h }); }
  }, true);
  var origOpen = window.open;
  window.open = function (u) { if (/^https?:\/\//i.test(String(u))) { inv('open_external', { url: String(u) }); return null; } return origOpen.apply(window, arguments); };
})();
