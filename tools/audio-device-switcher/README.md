# Audio Device Switcher

Portable Windows tool by MPTech Tools to quickly switch the default audio output device.

## What it does

Audio Device Switcher helps you switch between Windows audio output devices without opening Windows sound settings.

It is designed for users who frequently move between speakers, monitors, headphones, Bluetooth devices or audio interfaces.

## Features

- Detect active Windows output audio devices.
- Show the current default output device.
- Set any detected output device as default.
- Cycle to the next output device.
- Configurable global keyboard shortcut.
- Exclude devices from the shortcut cycle.
- Tray/background mode.
- Closing the window keeps the app running in the tray.
- Tray menu with Open app and Close app.
- Optional launch with Windows.
- Optional start minimized.
- English, Spanish and Portuguese interface.

## Release

Portable executable:

../../releases/audio-device-switcher/audio-device-switcher.exe

Checksum:

../../releases/audio-device-switcher/checksums.txt

## Usage

1. Open audio-device-switcher.exe.
2. Select the audio output device you want.
3. Click Set default / Predeterminar.
4. Configure a global shortcut if needed.
5. Close the window to keep the app running in the tray.
6. Use the tray icon to open or fully close the app.

## Shortcut behavior

The shortcut cycles through included devices.

Devices marked as excluded are ignored by the shortcut, but they are not disabled in Windows.

This means you can keep a device available manually while preventing the shortcut from switching to it.

## Startup behavior

The app can launch with Windows without administrator permissions.

It writes a registry entry under the current user:

HKCU\Software\Microsoft\Windows\CurrentVersion\Run

If you move the portable executable after enabling startup, disable and enable startup again so Windows stores the new path.

## Notes

Windows SmartScreen may show a warning because the executable is not code-signed yet.

This tool does not use accounts, cloud services, tracking, servers or external APIs.