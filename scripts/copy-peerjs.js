// Bundles the peer-to-peer library into the app so it doesn't need to download it at startup.
const fs = require('fs'); const path = require('path');
const src = path.join(__dirname, '..', 'node_modules', 'peerjs', 'dist', 'peerjs.min.js');
const dst = path.join(__dirname, '..', 'app', 'peerjs.min.js');
if (!fs.existsSync(src)) { console.warn('peerjs not installed; the app will load it from the internet instead'); process.exit(0); }
fs.copyFileSync(src, dst);
console.log('bundled peerjs ->', dst);
