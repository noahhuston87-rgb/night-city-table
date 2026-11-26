// Gives the Mac app a free "ad-hoc" signature after packaging. Without one, newer Macs (M1 and later)
// say a downloaded app "is damaged". With it, they show the normal "unverified developer"
// message, which has an Open Anyway button.
const { execSync } = require('child_process');
const path = require('path');
let Arch; try { Arch = require('builder-util').Arch; } catch (e) { Arch = { 0: 'ia32', 1: 'x64', 2: 'armv7l', 3: 'arm64', 4: 'universal', universal: 4 }; }
exports.default = async function (ctx) {
  if (ctx.electronPlatformName !== 'darwin') return;
  if (ctx.arch !== Arch.universal) { console.log('  • ad-hoc sign: waiting for the universal app (arch=' + Arch[ctx.arch] + ')'); return; }
  const app = path.join(ctx.appOutDir, ctx.packager.appInfo.productFilename + '.app');
  console.log('  • ad-hoc signing', app);
  execSync(`codesign --force --deep --sign - "${app}"`, { stdio: 'inherit' });
  execSync(`codesign --verify --deep --strict --verbose=2 "${app}"`, { stdio: 'inherit' });
};
