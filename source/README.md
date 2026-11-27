# Game source

This is the readable source of the game page. `node build.js` turns it into `dist/night-city-table/`
(a single `index.html` plus icons and the PDF reader). Copy that folder's contents into `../app/` to ship it
(leave out `sw.js`; it's only for the web version).

| File | What it is |
|---|---|
| `src/core.js` | Game rules: dice, permissions, who-sees-what (journal privacy), character import mapping |
| `src/app.js` | Screens, map, chat, sheets, hosting/joining (peer-to-peer) |
| `src/features.js` | Themes & settings, music/sound, journal & notepad, macros & toggles, damage calculator, books library |
| `src/style.css` | The look (all colours come from the active theme) |
| `src/bookmarklet.js` | The "Send to Night City Table" import button that runs on cyberpunk2020character.com |
| `src/vendor/` | pdf.js (Apache-2.0) for the book reader |

Tests (need Node; the browser ones need Playwright + Chrome):
`node test/core.test.js`, `node test/journal.test.js`, then serve `dist/night-city-table` on port 8123 and run
`node test/e2e.js`, `node test/features.js`, `node test/desktop.js`, `node test/update.js`, `node test/books.js`.
