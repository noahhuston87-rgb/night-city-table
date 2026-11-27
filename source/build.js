const fs = require('fs'); const path = require('path');
const r = f => fs.readFileSync(path.join('src', f), 'utf8');
let html = r('index.html');
const parts = { '/*STYLE*/': r('style.css'), '/*BOOKMARKLET*/': r('bookmarklet.js'), '/*CORE*/': r('core.js'), '/*PEERJS*/': r('peerloader.js'), '/*APP*/': r('app.js').replace('/*FEATURES*/', () => r('features.js')) };
for (const k in parts) {
  if (/<\/script/i.test(parts[k])) throw new Error('script close tag in ' + k);
  if (!html.includes(k)) throw new Error('missing ' + k);
  html = html.replace(k, () => parts[k]);
}
const out = path.join('dist', 'night-city-table');
fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.writeFileSync(path.join(out, 'manifest.webmanifest'), r('manifest.webmanifest'));
fs.writeFileSync(path.join(out, 'sw.js'), r('sw.js').replace('__VERSION__', new Date().toISOString().replace(/\D/g, '').slice(0, 14)));
for (const f of ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']) fs.copyFileSync(path.join('src', 'icons', f), path.join(out, f));
for (const f of ['pdf.min.js', 'pdf.worker.min.js', 'pdfjs-LICENSE.txt']) fs.copyFileSync(path.join('src', 'vendor', f), path.join(out, f));
console.log('built', out, (html.length / 1024).toFixed(1) + ' KB');
