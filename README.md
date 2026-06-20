# MPTech Windows Tools

Small, practical and portable Windows utilities created by MPTech Tools.

This repository is focused on simple desktop tools for advanced users, technicians, developers, sysadmins and IT professionals.

No SaaS. No accounts. No servers. No complex setup.

## Available tools

### Bulk Link Downloader

A lightweight Windows tool to process and download multiple links quickly.

Main use cases:

- Paste multiple links.
- Download files in batch.
- Keep a simple local workflow.
- Avoid browser extension dependency.

### Audio Device Switcher

A portable Windows tool to quickly switch the default audio output device.

Main use cases:

- Switch between speakers, monitors, headphones or audio interfaces.
- Change the default output device from a clean UI.
- Use a global keyboard shortcut to cycle between devices.
- Exclude devices from the shortcut cycle without disabling them in Windows.
- Keep the app running in the tray.

Current features:

- Detects active Windows output audio devices.
- Shows the current default output device.
- Sets a selected device as default.
- Cycles to the next output device.
- Configurable global shortcut.
- Device include/exclude control for shortcut cycling.
- Tray/background mode.
- Closing the window keeps the app running in the tray.
- Open/close from tray menu.
- Optional launch with Windows.
- Optional start minimized.
- English, Spanish and Portuguese UI.

Release file:

releases/audio-device-switcher/audio-device-switcher.exe

## Project structure

tools/
- audio-device-switcher/
- bulk-link-downloader/

releases/
- audio-device-switcher/

## Philosophy

Each tool should be:

- Small.
- Useful.
- Fast to build.
- Easy to sell or publish.
- Independent from servers.
- Focused on one clear problem.
- Simple enough to maintain.

## Notes

Windows SmartScreen may show a warning because these executables are not code-signed yet.

For startup features, if a portable EXE is moved after enabling "Launch with Windows", disable and enable the option again so Windows stores the new path.