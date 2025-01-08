// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use std::fs;
use std::path::Path;
#[tauri::command]
async fn delete_path(path: String, is_directory: bool) -> Result<(), String> {
    // 在新线程中执行删除操作
    std::thread::spawn(move || {
        if is_directory {
            fs::remove_dir_all(Path::new(&path))
        } else {
            fs::remove_file(Path::new(&path))
        }
    })
    .join()
    .map_err(|_| "Thread panic during deletion".to_string())?
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![delete_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
