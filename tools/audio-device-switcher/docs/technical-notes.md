# Technical Notes

## Stack

- Tauri
- React
- TypeScript
- Rust

## Windows audio

Device enumeration should use Windows Core Audio / MMDevice API.

Changing the default audio output device will likely require the undocumented COM interface commonly known as IPolicyConfig.

## Risk

The default device switch feature depends on Windows internals that are widely used in similar tools but are not officially documented as a public stable API.
