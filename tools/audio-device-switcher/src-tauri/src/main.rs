#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use tauri::{AppHandle, Manager};

#[derive(Serialize)]
struct AppInfo {
    name: String,
    version: String,
    platform: String,
}

#[derive(Serialize, Clone)]
struct AudioDevice {
    id: String,
    name: String,
    is_default: bool,
    is_active: bool,
}

#[tauri::command]
fn get_app_info() -> AppInfo {
    AppInfo {
        name: "Audio Device Switcher".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        platform: std::env::consts::OS.to_string(),
    }
}

#[tauri::command]
fn list_audio_output_devices() -> Result<Vec<AudioDevice>, String> {
    audio::list_output_devices()
}

#[tauri::command]
fn set_default_output_device(device_id: String) -> Result<(), String> {
    audio::set_default_output_device(&device_id)
}

#[tauri::command]
fn hide_main_window(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found.".to_string())?;

    window
        .hide()
        .map_err(|error| format!("Could not hide window: {error}"))?;

    Ok(())
}

fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

const STARTUP_APP_NAME: &str = "MPTechAudioDeviceSwitcher";

#[tauri::command]
fn set_startup_enabled(enabled: bool) -> Result<(), String> {
    startup::set_startup_enabled(enabled)
}

#[tauri::command]
fn get_startup_enabled() -> Result<bool, String> {
    startup::get_startup_enabled()
}

#[cfg(windows)]
mod startup {
    use std::process::Command;

    const RUN_KEY: &str = r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run";

    pub fn set_startup_enabled(enabled: bool) -> Result<(), String> {
        if enabled {
            let exe_path = std::env::current_exe()
                .map_err(|error| format!("Could not get current exe path: {error}"))?;

            let exe_path = exe_path
                .to_str()
                .ok_or_else(|| "Current exe path is not valid UTF-8.".to_string())?;

            let quoted_path = format!("\"{}\"", exe_path);

            let output = Command::new("reg")
                .args([
                    "add",
                    RUN_KEY,
                    "/v",
                    super::STARTUP_APP_NAME,
                    "/t",
                    "REG_SZ",
                    "/d",
                    &quoted_path,
                    "/f",
                ])
                .output()
                .map_err(|error| format!("Could not write startup registry key: {error}"))?;

            if output.status.success() {
                Ok(())
            } else {
                Err(String::from_utf8_lossy(&output.stderr).to_string())
            }
        } else {
            let output = Command::new("reg")
                .args([
                    "delete",
                    RUN_KEY,
                    "/v",
                    super::STARTUP_APP_NAME,
                    "/f",
                ])
                .output()
                .map_err(|error| format!("Could not delete startup registry key: {error}"))?;

            if output.status.success() {
                Ok(())
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();

                if stderr.to_lowercase().contains("unable to find")
                    || stderr.to_lowercase().contains("no se encuentra")
                    || stderr.to_lowercase().contains("el sistema no puede encontrar")
                {
                    Ok(())
                } else {
                    Err(stderr)
                }
            }
        }
    }

    pub fn get_startup_enabled() -> Result<bool, String> {
        let output = Command::new("reg")
            .args([
                "query",
                RUN_KEY,
                "/v",
                super::STARTUP_APP_NAME,
            ])
            .output()
            .map_err(|error| format!("Could not read startup registry key: {error}"))?;

        Ok(output.status.success())
    }
}

#[cfg(not(windows))]
mod startup {
    pub fn set_startup_enabled(_enabled: bool) -> Result<(), String> {
        Err("Startup settings are only available on Windows.".to_string())
    }

    pub fn get_startup_enabled() -> Result<bool, String> {
        Ok(false)
    }
}

#[cfg(windows)]
mod audio {
    use super::AudioDevice;
    use core::ffi::c_void;
    use windows::core::{GUID, HRESULT, Interface, PCWSTR, PWSTR};
    use windows::Win32::Devices::FunctionDiscovery::PKEY_Device_FriendlyName;
    use windows::Win32::Media::Audio::{
        eCommunications, eConsole, eMultimedia, eRender, ERole, IMMDevice, IMMDeviceEnumerator,
        MMDeviceEnumerator, DEVICE_STATE_ACTIVE,
    };
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CoTaskMemFree, CoUninitialize, CLSCTX_ALL,
        COINIT_APARTMENTTHREADED, STGM_READ,
    };
    use windows::Win32::System::Com::StructuredStorage::PropVariantClear;

    #[link(name = "propsys")]
    extern "system" {
        fn PropVariantToStringAlloc(propvar: *const c_void, ppszOut: *mut PWSTR) -> HRESULT;
    }

    const RPC_E_CHANGED_MODE: HRESULT = HRESULT(0x80010106u32 as i32);

    const CLSID_POLICY_CONFIG_CLIENT: GUID = GUID::from_u128(0x870af99c_171d_4f9e_af0d_e63df40c2bc9);
    const IID_POLICY_CONFIG: GUID = GUID::from_u128(0xf8679f50_850a_41cf_9c72_430f290290c8);

    #[repr(transparent)]
    #[derive(Clone, PartialEq, Eq)]
    struct IPolicyConfig(windows::core::IUnknown);

    unsafe impl Interface for IPolicyConfig {
        type Vtable = IPolicyConfigVTable;
        const IID: GUID = IID_POLICY_CONFIG;
    }

    #[repr(C)]
    struct IPolicyConfigVTable {
        pub base__: windows::core::IUnknown_Vtbl,

        pub get_mix_format: usize,
        pub get_device_format: usize,
        pub reset_device_format: usize,
        pub set_device_format: usize,
        pub get_processing_period: usize,
        pub set_processing_period: usize,
        pub get_share_mode: usize,
        pub set_share_mode: usize,
        pub get_property_value: usize,
        pub set_property_value: usize,

        pub set_default_endpoint:
            unsafe extern "system" fn(*mut c_void, PCWSTR, ERole) -> HRESULT,

        pub set_endpoint_visibility: usize,
    }

    struct ComGuard {
        should_uninitialize: bool,
    }

    impl Drop for ComGuard {
        fn drop(&mut self) {
            if self.should_uninitialize {
                unsafe {
                    CoUninitialize();
                }
            }
        }
    }

    fn initialize_com() -> Result<ComGuard, String> {
        unsafe {
            let hr = CoInitializeEx(None, COINIT_APARTMENTTHREADED);

            if hr.is_ok() {
                Ok(ComGuard {
                    should_uninitialize: true,
                })
            } else if hr == RPC_E_CHANGED_MODE {
                Ok(ComGuard {
                    should_uninitialize: false,
                })
            } else {
                Err(format!(
                    "Could not initialize Windows COM: HRESULT 0x{:08X}",
                    hr.0 as u32
                ))
            }
        }
    }

    pub fn list_output_devices() -> Result<Vec<AudioDevice>, String> {
        let _com = initialize_com()?;

        unsafe { list_output_devices_inner() }
    }

    pub fn set_default_output_device(device_id: &str) -> Result<(), String> {
        if device_id.trim().is_empty() {
            return Err("Device id is empty.".to_string());
        }

        let _com = initialize_com()?;

        unsafe {
            let policy_config: IPolicyConfig =
                CoCreateInstance(&CLSID_POLICY_CONFIG_CLIENT, None, CLSCTX_ALL)
                    .map_err(|error| {
                        format!("Could not create Windows audio policy config: {error}")
                    })?;

            let device_id_wide: Vec<u16> = device_id
                .encode_utf16()
                .chain(std::iter::once(0))
                .collect();

            set_default_for_role(&policy_config, PCWSTR(device_id_wide.as_ptr()), eConsole)?;
            set_default_for_role(&policy_config, PCWSTR(device_id_wide.as_ptr()), eMultimedia)?;
            set_default_for_role(&policy_config, PCWSTR(device_id_wide.as_ptr()), eCommunications)?;

            Ok(())
        }
    }

    unsafe fn set_default_for_role(
        policy_config: &IPolicyConfig,
        device_id: PCWSTR,
        role: ERole,
    ) -> Result<(), String> {
        let hr = (Interface::vtable(policy_config).set_default_endpoint)(
            Interface::as_raw(policy_config),
            device_id,
            role,
        );

        if hr.is_ok() {
            Ok(())
        } else {
            Err(format!(
                "Could not set default audio device: HRESULT 0x{:08X}",
                hr.0 as u32
            ))
        }
    }

    unsafe fn list_output_devices_inner() -> Result<Vec<AudioDevice>, String> {
        let enumerator: IMMDeviceEnumerator =
            CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)
                .map_err(|error| format!("Could not create audio device enumerator: {error}"))?;

        let default_id = match enumerator.GetDefaultAudioEndpoint(eRender, eConsole) {
            Ok(default_device) => get_device_id(&default_device).ok(),
            Err(_) => None,
        };

        let collection = enumerator
            .EnumAudioEndpoints(eRender, DEVICE_STATE_ACTIVE)
            .map_err(|error| format!("Could not enumerate audio output devices: {error}"))?;

        let count = collection
            .GetCount()
            .map_err(|error| format!("Could not count audio output devices: {error}"))?;

        let mut devices = Vec::new();

        for index in 0..count {
            let device = collection
                .Item(index)
                .map_err(|error| format!("Could not read audio device {index}: {error}"))?;

            let id = get_device_id(&device).unwrap_or_else(|_| format!("unknown-device-{index}"));
            let name = get_device_name(&device).unwrap_or_else(|_| format!("Audio Device {}", index + 1));
            let is_default = default_id.as_ref().map(|value| value == &id).unwrap_or(false);

            devices.push(AudioDevice {
                id,
                name,
                is_default,
                is_active: true,
            });
        }

        devices.sort_by(|a, b| {
            b.is_default
                .cmp(&a.is_default)
                .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
        });

        Ok(devices)
    }

    unsafe fn get_device_id(device: &IMMDevice) -> Result<String, String> {
        let id = device
            .GetId()
            .map_err(|error| format!("Could not get device id: {error}"))?;

        id.to_string()
            .map_err(|error| format!("Could not convert device id: {error}"))
    }

    unsafe fn get_device_name(device: &IMMDevice) -> Result<String, String> {
        let property_store = device
            .OpenPropertyStore(STGM_READ)
            .map_err(|error| format!("Could not open property store: {error}"))?;

        let mut property_value = property_store
            .GetValue(&PKEY_Device_FriendlyName)
            .map_err(|error| format!("Could not get friendly name: {error}"))?;

        let mut output = PWSTR::null();

        let hr = PropVariantToStringAlloc(
            &property_value as *const _ as *const c_void,
            &mut output,
        );

        let _ = PropVariantClear(&mut property_value);

        if hr.is_err() {
            return Err(format!(
                "Could not convert friendly name: HRESULT 0x{:08X}",
                hr.0 as u32
            ));
        }

        if output.is_null() {
            return Err("Friendly name pointer was null".to_string());
        }

        let name = output
            .to_string()
            .map_err(|error| format!("Could not read friendly name: {error}"))?;

        CoTaskMemFree(Some(output.0 as *const c_void));

        Ok(name)
    }
}

#[cfg(not(windows))]
mod audio {
    use super::AudioDevice;

    pub fn list_output_devices() -> Result<Vec<AudioDevice>, String> {
        Ok(vec![])
    }

    pub fn set_default_output_device(_device_id: &str) -> Result<(), String> {
        Err("Audio switching is only available on Windows.".to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .setup(|app| {
            use tauri::menu::{Menu, MenuItem};
            use tauri::tray::TrayIconBuilder;

            let show_item = MenuItem::with_id(app, "show", "Abrir app", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Cerrar app", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let mut tray_builder = TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("Audio Device Switcher")
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        show_main_window(app);
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                });

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }

            tray_builder.build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_info,
            list_audio_output_devices,
            set_default_output_device,
            hide_main_window,
            set_startup_enabled,
            get_startup_enabled
        ])
        .run(tauri::generate_context!())
        .expect("error while running Audio Device Switcher");
}