/* Loads PeerJS (peer-to-peer connections) from a CDN, with a fallback. */
window.peerReady = new Promise(function (resolve) {
  var urls = ((location.protocol === 'app:' || location.protocol === 'tauri:' || location.hostname === 'tauri.localhost') ? ['peerjs.min.js'] : []).concat(['https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js']);
  function next(i) {
    if (window.Peer) return resolve(true);
    if (i >= urls.length) return resolve(false);
    var s = document.createElement('script'); s.src = urls[i]; s.async = true;
    s.onload = function () { resolve(!!window.Peer); };
    s.onerror = function () { s.remove(); next(i + 1); };
    document.head.appendChild(s);
  }
  next(0);
});
