# Night City Table

A free virtual tabletop for **Cyberpunk 2020**. The DM hosts the game on their own computer, players join with a code, and nobody needs an account.

## ⬇ Download

**[Get the latest version here](https://github.com/noahhuston87-rgb/night-city-table/releases/latest)**, then pick the file for your computer under **Assets**:

| Your computer | File |
|---|---|
| Windows | `Night-City-Table-Setup-….exe` |
| Mac | `Night-City-Table-…-Mac.dmg` |
| Linux | `Night-City-Table-…-Linux.AppImage` |

**Windows:** if "Windows protected your PC" appears, click **More info → Run anyway**.
**Mac:** drag the app into Applications. The first time you open it, go to **System Settings → Privacy & Security → Open Anyway**.

These warnings show up because the app isn't signed by a paid developer account. It's the same app either way.

## How to play

- **DM:** open the app, type your name, click **Create new game**, then **Invite players** and send them the message it gives you.
- **Players:** open the app, type your name, paste the game code under **Join a game**, and click **Join**.
- The DM's app is the game server. Keep it open while you play. Games are saved on the DM's computer.
- **Import a character from cyberpunk2020character.com:** Sheets → Import, and follow the steps.

## Updating

When a new version is out, the app shows an **Update available** banner on its home screen. On Windows and Mac, click **Update now**: it downloads, installs and reopens by itself. On Linux, download the new file. Your games are kept.

## For whoever changes the game

The game is the web page in `app/`. The Windows and Mac app is written in Rust (Tauri, in `src-tauri/`). The Linux app uses Electron (`main.js`). Every push to `main` builds new installers and publishes them as the latest release, and everyone's app then offers the update.
