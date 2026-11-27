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
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};

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
<li>A small window says <b>Sent</b> and your character pops up in the Night City Table app (keep the app open).</li></ol>\
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

// ---------------- character import window ----------------
// Opens cyberpunk2020character.com in its own window. A helper script (from the game) adds a
// "SEND MY CHARACTER" bar; sending navigates to https://nct-import.local/?d=<data>, which is caught
// here, never actually loaded, and handed to the game window.

fn percent_decode(s: &str) -> String {
    let b = s.as_bytes();
    let hex = |c: u8| -> Option<u8> { (c as char).to_digit(16).map(|d| d as u8) };
    let mut out: Vec<u8> = Vec::with_capacity(b.len());
    let mut i = 0;
    while i < b.len() {
        if b[i] == b'%' && i + 2 < b.len() {
            if let (Some(h), Some(l)) = (hex(b[i + 1]), hex(b[i + 2])) { out.push(h * 16 + l); i += 3; continue; }
        }
        out.push(b[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

#[tauri::command]
fn open_site_import(app: AppHandle, script: String) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("siteimport") {
        let _ = w.set_focus();
        return Ok(());
    }
    let handle = app.clone();
    let url: tauri::Url = "https://cyberpunk2020character.com/".parse().map_err(|e: url::ParseError| e.to_string())?;
    WebviewWindowBuilder::new(&app, "siteimport", WebviewUrl::External(url))
        .title("Import a character: cyberpunk2020character.com")
        .inner_size(1280.0, 860.0)
        .initialization_script(&script)
        .on_navigation(move |u| {
            if u.host_str() == Some("nct-import.local") {
                let data = u.query_pairs().find(|(k, _)| k == "d").map(|(_, v)| v.into_owned())
                    .or_else(|| u.fragment().map(percent_decode));
                if let Some(data) = data {
                    let _ = handle.emit_to("main", "nct-site-character", data);
                    if let Some(main) = handle.get_webview_window("main") { let _ = main.set_focus(); }
                }
                return false; // never actually go there
            }
            true
        })
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn close_now(window: tauri::WebviewWindow) {
    let _ = window.destroy();
}

// ---------------- import bookmark → app ----------------
// The "Send to Night City Table" bookmark reads the character on cyberpunk2020character.com and opens
// http://127.0.0.1:47820/import?d=<character> in a small window. This tiny server (only reachable from this
// computer) hands the character to the game and answers with a page that closes itself.
const IMPORT_PORT: u16 = 47820;
fn import_server(app: AppHandle) {
    let listener = match std::net::TcpListener::bind(("127.0.0.1", IMPORT_PORT)) { Ok(l) => l, Err(_) => return };
    for stream in listener.incoming() {
        if let Ok(s) = stream { let app = app.clone(); std::thread::spawn(move || handle_import(app, s)); }
    }
}
fn handle_import(app: AppHandle, mut s: std::net::TcpStream) {
    let _ = s.set_read_timeout(Some(std::time::Duration::from_secs(10)));
    let mut buf: Vec<u8> = Vec::new();
    let mut chunk = [0u8; 65536];
    loop {
        match s.read(&mut chunk) {
            Ok(0) => break,
            Ok(n) => { buf.extend_from_slice(&chunk[..n]); if buf.windows(4).any(|w| w == b"\r\n\r\n") || buf.len() > 16_000_000 { break; } }
            Err(_) => break,
        }
    }
    let req = String::from_utf8_lossy(&buf);
    let target = req.lines().next().unwrap_or("").split_whitespace().nth(1).unwrap_or("/").to_string();
    let url = tauri::Url::parse(&format!("http://127.0.0.1{}", target)).ok();
    let mut status = "404 Not Found";
    let mut body = String::from("Night City Table");
    if let Some(u) = url {
        if u.path() == "/ping" { status = "200 OK"; body = "ok".into(); }
        if u.path() == "/import" {
            if let Some(d) = u.query_pairs().find(|(k, _)| k == "d").map(|(_, v)| v.into_owned()) {
                let _ = app.emit_to("main", "nct-site-character", d);
                if let Some(w) = app.get_webview_window("main") { let _ = w.unminimize(); let _ = w.show(); let _ = w.set_focus(); }
                status = "200 OK";
                body = "<!DOCTYPE html><meta charset=\"utf-8\"><title>Sent to Night City Table</title><body style=\"background:#070a12;color:#39ff6a;font:18px/1.5 system-ui,sans-serif;text-align:center;padding:40px 20px\"><h2>&#10003; Sent to Night City Table</h2><p style=\"color:#8aa0c2\">Switch to the app: your character is waiting there. This window closes by itself.</p><script>setTimeout(function(){window.close()},1800)</script></body>".into();
            }
        }
    }
    let resp = format!("HTTP/1.1 {}\r\nContent-Type: text/html; charset=utf-8\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Private-Network: true\r\nCache-Control: no-store\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}", status, body.len(), body);
    let _ = s.write_all(resp.as_bytes());
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![clip_read, clip_write, open_external, bookmark_page, close_now, update_install, open_site_import])
        .setup(|app| {
            { let h = app.handle().clone(); std::thread::spawn(move || import_server(h)); }
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
