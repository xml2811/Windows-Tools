import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  register,
  unregister,
  unregisterAll
} from "@tauri-apps/plugin-global-shortcut";
import { languageNames, translations } from "./i18n";
import type { LanguageCode } from "./i18n/types";

type AudioDevice = {
  id: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
};

const DEFAULT_HOTKEY = "Control+Alt+A";
const HOTKEY_STORAGE_KEY = "mptech.audioDeviceSwitcher.hotkey";
const EXCLUDED_DEVICES_STORAGE_KEY = "mptech.audioDeviceSwitcher.excludedDevices";
const START_MINIMIZED_STORAGE_KEY = "mptech.audioDeviceSwitcher.startMinimized";

function displayShortcut(shortcut: string): string {
  return shortcut
    .split("Control")
    .join("Ctrl")
    .split("+")
    .join(" + ");
}

function normalizeKey(key: string): string {
  if (key === " ") return "Space";
  if (key === "Control") return "Control";
  if (key === "Escape") return "Escape";
  if (key === "ArrowUp") return "Up";
  if (key === "ArrowDown") return "Down";
  if (key === "ArrowLeft") return "Left";
  if (key === "ArrowRight") return "Right";
  if (key.length === 1) return key.toUpperCase();
  return key;
}

function eventToShortcut(event: KeyboardEvent): string | null {
  const parts: string[] = [];

  if (event.ctrlKey) parts.push("Control");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  if (event.metaKey) parts.push("Super");

  const key = normalizeKey(event.key);

  if (["Control", "Alt", "Shift", "Super", "Escape"].includes(key)) {
    return null;
  }

  parts.push(key);

  if (parts.length < 2) {
    return null;
  }

  return parts.join("+");
}

function loadExcludedDevices(): string[] {
  try {
    const rawValue = localStorage.getItem(EXCLUDED_DEVICES_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);

    if (Array.isArray(parsedValue)) {
      return parsedValue.filter((item) => typeof item === "string");
    }

    return [];
  } catch {
    return [];
  }
}

function saveExcludedDevices(deviceIds: string[]) {
  localStorage.setItem(EXCLUDED_DEVICES_STORAGE_KEY, JSON.stringify(deviceIds));
}

export default function App() {
  const [language, setLanguage] = useState<LanguageCode>("es");
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [excludedDeviceIds, setExcludedDeviceIds] = useState<string[]>(loadExcludedDevices);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isCapturingHotkey, setIsCapturingHotkey] = useState(false);
  const [hotkey, setHotkey] = useState(() => localStorage.getItem(HOTKEY_STORAGE_KEY) || DEFAULT_HOTKEY);
  const [startupEnabled, setStartupEnabledState] = useState(false);
  const [startMinimized, setStartMinimizedState] = useState(() => localStorage.getItem(START_MINIMIZED_STORAGE_KEY) === "true");
  const [registeredHotkey, setRegisteredHotkey] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const devicesRef = useRef<AudioDevice[]>([]);
  const excludedDeviceIdsRef = useRef<string[]>(excludedDeviceIds);
  const switchingRef = useRef(false);
  const registeredHotkeyRef = useRef("");

  const t = useMemo(() => translations[language], [language]);
  const currentDevice = devices.find((device) => device.is_default) ?? null;

  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  useEffect(() => {
    excludedDeviceIdsRef.current = excludedDeviceIds;
    saveExcludedDevices(excludedDeviceIds);
  }, [excludedDeviceIds]);

  useEffect(() => {
    switchingRef.current = isSwitching;
  }, [isSwitching]);

  useEffect(() => {
    registeredHotkeyRef.current = registeredHotkey;
  }, [registeredHotkey]);

  async function setStartupEnabled(enabled: boolean) {
    try {
      setError("");
      await invoke("set_startup_enabled", { enabled });
      setStartupEnabledState(enabled);
      setStatus(enabled ? t.startupEnabledStatus : t.startupDisabledStatus);
    } catch (startupError) {
      setError(t.startupError);
      setStatus(String(startupError));
    }
  }

  function setStartMinimized(enabled: boolean) {
    setStartMinimizedState(enabled);
    localStorage.setItem(START_MINIMIZED_STORAGE_KEY, String(enabled));
    setStatus(enabled ? t.startMinimizedEnabledStatus : t.startMinimizedDisabledStatus);
  }

  async function loadStartupSettings() {
    try {
      const enabled = await invoke<boolean>("get_startup_enabled");
      setStartupEnabledState(enabled);
    } catch {
      setStartupEnabledState(false);
    }
  }

  async function maybeStartMinimized() {
    const shouldStartMinimized = localStorage.getItem(START_MINIMIZED_STORAGE_KEY) === "true";

    if (shouldStartMinimized) {
      setTimeout(() => {
        invoke("hide_main_window").catch(() => {});
      }, 450);
    }
  }

  async function loadDevices() {
    try {
      setIsLoadingDevices(true);
      setError("");

      const result = await invoke<AudioDevice[]>("list_audio_output_devices");

      setDevices(result);
      setStatus(`${result.length} ${t.devicesFound}`);
    } catch (audioError) {
      setDevices([]);
      setError(t.audioDetectionError);
      setStatus(String(audioError));
    } finally {
      setIsLoadingDevices(false);
    }
  }

  async function setDefaultDevice(device: AudioDevice) {
    try {
      switchingRef.current = true;
      setIsSwitching(true);
      setError("");
      setStatus(`${t.switchingTo} ${device.name}...`);

      await invoke("set_default_output_device", {
        deviceId: device.id
      });

      await loadDevices();
      setStatus(`${t.defaultChanged}: ${device.name}`);
    } catch (switchError) {
      setError(t.audioSwitchError);
      setStatus(String(switchError));
    } finally {
      switchingRef.current = false;
      setIsSwitching(false);
    }
  }

  const cycleNextDevice = useCallback(async () => {
    const currentDevices = devicesRef.current;
    const excludedIds = excludedDeviceIdsRef.current;
    const shortcutDevices = currentDevices.filter((device) => !excludedIds.includes(device.id));

    if (switchingRef.current || shortcutDevices.length < 2) {
      return;
    }

    const currentIndex = shortcutDevices.findIndex((device) => device.is_default);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % shortcutDevices.length : 0;
    const nextDevice = shortcutDevices[nextIndex];

    await setDefaultDevice(nextDevice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registerHotkey = useCallback(async (shortcut: string) => {
    try {
      setError("");

      await unregisterAll();

      await register(shortcut, async (event) => {
        if (event.state === "Pressed") {
          await cycleNextDevice();
        }
      });

      setRegisteredHotkey(shortcut);
      setStatus(`${t.hotkeyActive}: ${displayShortcut(shortcut)}`);
    } catch (hotkeyError) {
      const errorText = String(hotkeyError);
      const readableShortcut = displayShortcut(shortcut);

      /*
        In Tauri dev mode, the plugin can sometimes report "already registered"
        after the shortcut has actually been registered by the same app instance.
        If the current shortcut is already the one we expect, do not show a false error.
      */
      if (
        errorText.toLowerCase().includes("already registered") ||
        errorText.toLowerCase().includes("hotkey already")
      ) {
        setRegisteredHotkey(shortcut);
        setError("");
        setStatus(`${t.hotkeyActive}: ${readableShortcut}`);
        return;
      }

      setRegisteredHotkey("");
      setError(`${t.hotkeyRegisterError} ${readableShortcut}`);
      setStatus(t.hotkeyRegisterHelp);
      console.warn("Global shortcut registration failed:", hotkeyError);
    }
  }, [cycleNextDevice, t]);

  async function saveHotkey(shortcut: string) {
    setHotkey(shortcut);
    localStorage.setItem(HOTKEY_STORAGE_KEY, shortcut);
    /*
      Do not call registerHotkey() here directly.
      The hotkey useEffect will register it once after state updates.
      This avoids duplicate registration and false error messages.
    */
  }

  function toggleDeviceForShortcut(deviceId: string) {
    setExcludedDeviceIds((currentIds) => {
      if (currentIds.includes(deviceId)) {
        return currentIds.filter((id) => id !== deviceId);
      }

      return [...currentIds, deviceId];
    });
  }

  useEffect(() => {
    loadDevices();
    loadStartupSettings();
    maybeStartMinimized();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    registerHotkey(hotkey);

    return () => {
      unregister(hotkey).catch(() => {});
    };
  }, [hotkey, registerHotkey]);

  useEffect(() => {
    if (!isCapturingHotkey) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      event.preventDefault();
      event.stopPropagation();

      if (event.key === "Escape") {
        setIsCapturingHotkey(false);
        setStatus(t.hotkeyChangeCancelled);
        return;
      }

      const shortcut = eventToShortcut(event);

      if (!shortcut) {
        setStatus(t.hotkeyPressCombination);
        return;
      }

      setIsCapturingHotkey(false);
      saveHotkey(shortcut);
    }

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCapturingHotkey, t]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <section className="title-block">
          <p className="brand-kicker">{t.appLabel}</p>
          <h1>{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </section>

        <section className="language-box">
          <label htmlFor="language">{t.language}</label>
          <select
            id="language"
            value={language}
            onChange={(event) => setLanguage(event.target.value as LanguageCode)}
          >
            {Object.entries(languageNames).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </section>
      </header>

      <section className="grid">
        <article className="panel current-panel">
          <div className="panel-text">
            <p className="panel-kicker">{t.currentDevice}</p>
            <h2>{currentDevice?.name ?? t.noCurrentDevice}</h2>
            <p>{t.currentDeviceDescription}</p>
          </div>

          <div className="device-badge">
            <strong>{currentDevice ? t.defaultDevice : "â€”"}</strong>
            <span>{currentDevice ? t.active : t.notDetected}</span>
          </div>
        </article>

        <article className="panel settings-panel">
          <div className="panel-heading compact-heading">
            <div>
              <p className="panel-kicker">{t.settings}</p>
              <h2>{t.hotkey}</h2>
            </div>
            <span className={registeredHotkey ? "hotkey" : "hotkey warning"}>
              {displayShortcut(hotkey)}
            </span>
          </div>

          {isCapturingHotkey ? (
            <div className="capture-box">
              {t.hotkeyCaptureHelp}
            </div>
          ) : null}

          <button
            type="button"
            className="full-button"
            onClick={() => {
              setIsCapturingHotkey(true);
              setStatus(t.hotkeyPressCombination);
            }}
          >
            {isCapturingHotkey ? t.listeningHotkey : t.changeHotkey}
          </button>

          <p className="tray-hint">{t.closeToTrayHint}</p>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={startupEnabled}
              onChange={(event) => setStartupEnabled(event.target.checked)}
            />
            <span>{t.startup}</span>
          </label>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={startMinimized}
              onChange={(event) => setStartMinimized(event.target.checked)}
            />
            <span>{t.startMinimized}</span>
          </label>
        </article>
      </section>

      <section className="panel devices-panel">
        <div className="panel-heading devices-heading">
          <div className="panel-text">
            <p className="panel-kicker">{t.devices}</p>
            <h2>{t.devices}</h2>
            <p>{t.devicesDescription}</p>
          </div>

          <div className="actions">
            <button
              type="button"
              className="secondary"
              onClick={loadDevices}
              disabled={isLoadingDevices || isSwitching}
            >
              {isLoadingDevices ? t.loading : t.refresh}
            </button>

            <button
              type="button"
              className="primary"
              onClick={cycleNextDevice}
              disabled={devices.length < 2 || isSwitching}
            >
              {isSwitching ? t.switching : t.cycleNext}
            </button>
          </div>
        </div>

        <div className="device-list">
          {devices.length > 0 ? (
            devices.map((device) => {
              const isExcluded = excludedDeviceIds.includes(device.id);

              return (
                <div className={device.is_default ? "device-row is-default" : "device-row"} key={device.id}>
                  <div className="device-info">
                    <strong>{device.name}</strong>

                    <div className="device-meta">
                      <span className={device.is_default ? "status-pill default-pill" : "status-pill"}>
                        {device.is_default ? t.defaultDevice : t.available}
                      </span>

                      <span className={isExcluded ? "status-pill excluded-pill" : "status-pill shortcut-pill"}>
                        {isExcluded ? t.outOfShortcut : t.inShortcut}
                      </span>
                    </div>
                  </div>

                  <div className="device-actions">
                    <button
                      type="button"
                      className="small-button secondary"
                      onClick={() => toggleDeviceForShortcut(device.id)}
                    >
                      {isExcluded ? t.includeInShortcut : t.excludeFromShortcut}
                    </button>

                    <button
                      type="button"
                      disabled={device.is_default || isSwitching}
                      onClick={() => setDefaultDevice(device)}
                    >
                      {device.is_default ? t.current : t.setDefault}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-note">
              {isLoadingDevices ? t.loadingDevices : t.noDevices}
            </div>
          )}
        </div>

        {error ? <div className="error-note">{error}</div> : null}
      </section>

      <footer>
        <span>{t.portableFooter}</span>
        <span>{status || t.readyStatus}</span>
      </footer>
    </main>
  );
}