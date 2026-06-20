# Audio Device Switcher - Technical Notes

## Stack

- Tauri 2
- React
- TypeScript
- Rust
- Windows Core Audio APIs
- Windows Registry for startup
- Tauri global shortcut plugin
- Tauri tray icon support

## Windows audio detection

The app uses Windows Core Audio / MMDevice API to enumerate active output devices.

Main components:

- IMMDeviceEnumerator
- EnumAudioEndpoints
- GetDefaultAudioEndpoint
- PKEY_Device_FriendlyName

Only active output devices are shown.

## Default device switching

The app uses the Windows audio policy configuration COM interface.

Default device is applied for:

- eConsole
- eMultimedia
- eCommunications

This avoids changing only one Windows audio role.

## Global shortcut

The app uses tauri-plugin-global-shortcut.

The shortcut is stored locally in browser localStorage:

mptech.audioDeviceSwitcher.hotkey

The app normalizes display text:

Control+Alt+A -> Ctrl + Alt + A

## Device exclusion

Excluded devices are stored locally:

mptech.audioDeviceSwitcher.excludedDevices

Excluded devices are only removed from the shortcut cycle.

They are not disabled in Windows.

## Tray behavior

The app uses Tauri tray support.

Window close behavior is intercepted:

- Close requested.
- Prevent real close.
- Hide window.
- Keep process alive in tray.

The tray menu can:

- Show the main window.
- Exit the app.

## Startup behavior

The app can register itself under:

HKCU\Software\Microsoft\Windows\CurrentVersion\Run

No administrator permissions are required.

Startup app name:

MPTechAudioDeviceSwitcher

If the executable path changes, the registry value must be refreshed by disabling/enabling startup again.

## Build

Frontend build:

npm run build

Tauri release build:

npm run tauri:build

Portable release target:

src-tauri/target/release/audio-device-switcher.exe

Final release copy:

releases/audio-device-switcher/audio-device-switcher.exe