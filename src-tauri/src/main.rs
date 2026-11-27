// Night City Table — desktop app (Rust / Tauri).
// The game itself is the web page in ../app; this program gives it a window, an installer,
// clipboard access (for the character import button) and opens web links in the normal browser.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{Read, Write};
use std::path::Path;
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, WebviewUrl, WebviewWindowBuilder, WindowEvent};

const REPO: &str = "noahhuston87-rgb/night-city-table";
const INIT_JS: &str = include_str!("init.js");

fn now_ms() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as u64).unwrap_or(0)
}

#[tauri::command]
fn clip_read() -> String {
    arboard::Clipboard::new().and_then(|mut c| c.get_text()).unwrap_or_default()
}

#[tauri::command]
fn clip_write(text: String) {
    if let Ok(mut c) = arboard::Clipboard::new() {
        let _ = c.set_text(text);
    }
}

#[tauri::command]
fn open_external(url: String) {
    if url.starts_with("https://") || url.starts_with("http://") {
        let _ = open::that_detached(url);
    }
}

/// Writes a small page with the "Send to Night City Table" bookmark button and opens it in the
/// person's normal browser, where they drag the button onto their bookmarks bar.
#[tauri::command]
fn bookmark_page(href: String) -> Result<(), String> {
    if !href.starts_with("javascript:") {
        return Err("not a bookmark button".into());
    }
    let esc = href.replace('&', "&amp;").replace('"', "&quot;").replace('<', "&lt;");
    let html = format!(
        "<!DOCTYPE html><meta charset=\"utf-8\"><title>Night City Table: import button</title>\
<body style=\"background:#070a12;color:#e6f4ff;font:18px/1.5 system-ui,sans-serif;max-width:640px;margin:60px auto;padding:0 20px\">\
<h1 style=\"color:#05d9e8\">Night City Table: import button</h1>\
<ol><li>Show your bookmarks bar: press <b>Ctrl+Shift+B</b> (or <b>&#8984;+Shift+B</b> on Mac).</li>\
<li><b>Drag this pink button</b> up onto the bookmarks bar:<p><a href=\"{esc}\" style=\"display:inline-block;background:#ff2a6d;color:#fff;padding:10px 16px;border-radius:6px;font-weight:700;text-decoration:none\">&#8681; Send to Night City Table</a></p></li>\
<li>Open your character on <b>cyberpunk2020character.com</b> and click the bookmark.</li>\
<li>Switch back to the Night City Table app. Your character pops up there.</li></ol>\
<p style=\"color:#8aa0c2\">You can close this page now. You only need to do this once.</p></body>"
    );
    let path = std::env::temp_dir().join("night-city-table-import-button.html");
    std::fs::write(&path, html).map_err(|e| e.to_string())?;
    open::that_detached(&path).map_err(|e| e.to_string())
}

// ---------------- auto-update ----------------
// Downloads the new installer from this project's GitHub release, closes the app, installs it
// quietly and opens the app again. Saved games are kept (they live outside the app).

const CAN_AUTO_UPDATE: bool = cfg!(any(target_os = "windows", target_os = "macos"));

fn valid_version(v: &str) -> bool {
    let parts: Vec<&str> = v.split('.').collect();
    parts.len() == 3 && parts.iter().all(|p| !p.is_empty() && p.len() < 8 && p.chars().all(|c| c.is_ascii_digit()))
}

fn download(app: &AppHandle, url: &str, path: &Path) -> Result<(), String> {
    let resp = ureq::get(url).timeout(std::time::Duration::from_secs(600)).call().map_err(|e| format!("download failed: {e}"))?;
    let total: u64 = resp.header("Content-Length").and_then(|v| v.parse().ok()).unwrap_or(0);
    let mut reader = resp.into_reader();
    let mut file = std::fs::File::create(path).map_err(|e| e.to_string())?;
    let mut buf = vec![0u8; 256 * 1024];
    let (mut got, mut last) = (0u64, 0u64);
    loop {
        let n = reader.read(&mut buf).map_err(|e| format!("download failed: {e}"))?;
        if n == 0 { break; }
        file.write_all(&buf[..n]).map_err(|e| e.to_string())?;
        got += n as u64;
        if total > 0 {
            let pct = got * 100 / total;
            if pct != last { last = pct; let _ = app.emit("nct-update-progress", pct); }
        }
    }
    file.flush().map_err(|e| e.to_string())?;
    if got < 1_000_000 || (total > 0 && got != total) {
        return Err("the download was incomplete".into());
    }
    Ok(())
}

#[cfg(target_os = "windows")]
fn launch_installer(installer: &Path) -> Result<(), String> {
    use std::os::windows::process::CommandExt;
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    // wait for this app to close, install silently, then start the new version
    let script = format!(
        "ping -n 3 127.0.0.1 >nul & \"{}\" /S & start \"\" \"{}\"",
        installer.display(),
        exe.display()
    );
    Command::new("cmd")
        .raw_arg(format!("/S /C \"{script}\""))
        .creation_flags(0x0800_0000) // no console window
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(target_os = "macos")]
fn launch_installer(dmg: &Path) -> Result<(), String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let app_path = exe.ancestors().nth(3).ok_or("can't find the app")?.to_path_buf();
    if app_path.extension().map(|e| e != "app").unwrap_or(true) {
        return Err("can't find the app".into());
    }
    // swap in the new app, keeping the old one until the copy has worked; if anything fails,
    // open the downloaded file so the person can drag it into Applications themselves
    let script = r#"sleep 2
MP="$(mktemp -d)"
if hdiutil attach -nobrowse -noautoopen -mountpoint "$MP" "$1"; then
  NEW="$(ls -d "$MP"/*.app | head -1)"
  if [ -n "$NEW" ] && rm -rf "$2.old" && mv "$2" "$2.old" && ditto "$NEW" "$2"; then
    rm -rf "$2.old"; hdiutil detach "$MP" -quiet; open "$2"; exit 0
  fi
  if [ -d "$2.old" ] && [ ! -d "$2" ]; then mv "$2.old" "$2"; fi
  hdiutil detach "$MP" -quiet
fi
open "$1""#;
    Command::new("/bin/sh")
        .arg("-c").arg(script).arg("sh").arg(dmg).arg(&app_path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn launch_installer(_: &Path) -> Result<(), String> {
    Err("automatic updates aren't available on this system".into())
}

#[tauri::command]
fn update_install(app: AppHandle, version: String) -> Result<(), String> {
    if !CAN_AUTO_UPDATE { return Err("automatic updates aren't available on this system".into()); }
    if !valid_version(&version) { return Err("unexpected version number".into()); }
    let name = if cfg!(target_os = "windows") {
        format!("Night-City-Table-Setup-{version}.exe")
    } else {
        format!("Night-City-Table-{version}-Mac.dmg")
    };
    let url = format!("https://github.com/{REPO}/releases/download/v{version}/{name}");
    std::thread::spawn(move || {
        let path = std::env::temp_dir().join(&name);
        let result = download(&app, &url, &path).and_then(|_| launch_installer(&path));
        match result {
            Ok(()) => { let _ = app.emit("nct-update-progress", 100u64); std::thread::sleep(std::time::Duration::from_millis(400)); app.exit(0); }
            Err(e) => { let _ = app.emit("nct-update-error", e); }
        }
    });
    Ok(())
}

#[tauri::command]
fn close_now(window: tauri::WebviewWindow) {
    let _ = window.destroy();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![clip_read, clip_write, open_external, bookmark_page, close_now, update_install])
        .setup(|app| {
            let version = app.package_info().version.to_string();
            let init = INIT_JS.replace("__VERSION__", &version).replace("__REPO__", REPO).replace("__AUTO_UPDATE__", if CAN_AUTO_UPDATE { "true" } else { "false" });
            let win = WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                .title("Night City Table")
                .inner_size(1400.0, 900.0)
                .min_inner_size(900.0, 600.0)
                .initialization_script(&init)
                .build()?;
            // Closing the window asks the game first (so a DM with players connected gets a warning and
            // the game is saved). If the game doesn't answer, a second click within 5 seconds closes anyway.
            let last_ask = Arc::new(AtomicU64::new(0));
            let w = win.clone();
            win.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    let now = now_ms();
                    let prev = last_ask.swap(now, Ordering::SeqCst);
                    if prev != 0 && now.saturating_sub(prev) < 5000 {
                        return; // second click: let it close
                    }
                    api.prevent_close();
                    let _ = w.emit("nct-close-requested", ());
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Night City Table");
}
