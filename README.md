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

- **DM:** open the app, type your name, click **Create new game**, then **Invite players** and send them the message it gives you. Your app is the game server: keep it open while you play. Games are saved on your computer, and you can have as many as you like.
- **Players:** open the app, type your name, paste the game code under **Join a game**, and click **Join**.

## What's in it

- **Maps & tokens:** upload a map image or use a blank grid. Drag tokens (they snap to the grid), measure in metres, ping, and hide tokens from players.
- **Character sheets:** Cyberpunk 2020 stats, skills, wound track, armor, weapons, cyberware and gear. Click to roll. NPC sheets are DM-only.
- **Import from cyberpunk2020character.com:** a one-click bookmark button sends your character into the game.
- **Dice:** `/r 1d10!+5`, secret rolls, criticals and fumbles, initiative tracker.
- **Macros & toggles:** your own roll buttons (`1d10! + @REF + @Handgun`) and on/off modifiers (Aiming, Smartgun, Called shot…) that are added to attacks and damage automatically.
- **Damage calculator:** "Apply damage" on any damage roll handles hit location, armor, head ×2, body type, armor wear and the wound track.
- **Music & sound:** the DM plays music (link or upload) and sound effects for everyone. Each player has their own volume.
- **Journal:** handouts and notes in folders. The DM shows or hides each one for everyone or chosen players. Players can share notes, and everyone has a private notepad.
- **Books:** add your own PDF rulebooks to read, see their chapters and search them, plus a rules quick reference for 2020 and RED. Your books stay on your computer.
- **Look:** a terminal style with 22 themes, your own colours, text size and more (⚙ Settings).

## Updating

When a new version is out, the app shows an **Update available** banner on its home screen. On Windows and Mac, click **Update now**: it downloads, installs and reopens by itself. On Linux, download the new file. Your games are kept.

## For whoever changes the game

The game is the web page in `app/`. The Windows and Mac app is written in Rust (Tauri, in `src-tauri/`). The Linux app uses Electron (`main.js`). Every push to `main` builds new installers and publishes them as the latest release, and everyone's app then offers the update.
