// src/components/AccessibilityToggle.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g., http://localhost:5000/api
  withCredentials: false,                // your auth uses Bearer header
});

// Read a JWT from common keys; change if yours is different.
function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("accessToken") ||
    null
  );
}

function clampFontSize(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 100;
  return Math.max(80, Math.min(200, n));
}

function applyToRoot(s) {
  const root = document.documentElement;
  const fs = clampFontSize(s.fontSize);
  root.style.fontSize = `${fs}%`;
  root.classList.toggle("accessible-readable", !!s.readableFont);
  root.classList.toggle("accessible-spacing", !!s.spacing);
}

const DEFAULTS = { fontSize: 100, readableFont: false, spacing: false };

const AccessibilityToggle = () => {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [settings, setSettings] = useState(DEFAULTS);

  // Track the last-seen token so we can detect changes
  const tokenRef = useRef(getToken());

  // Fetch from API and apply to DOM
  const loadAndApply = async () => {
    const token = getToken();
    tokenRef.current = token;

    if (!token) {
      applyToRoot(DEFAULTS);
      setSettings(DEFAULTS);
      setLoaded(true);
      return;
    }

    try {
      // RELATIVE path (baseURL already includes /api) → /api/accessibility/me
      const { data } = await API.get("accessibility/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // be tolerant of camelCase / snake_case
      const payload = data?.data ?? data ?? {};
      const s = {
        fontSize: clampFontSize(payload.fontSize ?? payload.font_size ?? 100),
        readableFont: !!(payload.readableFont ?? payload.readable_font),
        spacing: !!payload.spacing,
      };

      setSettings(s);
      applyToRoot(s);
    } catch {
      setSettings(DEFAULTS);
      applyToRoot(DEFAULTS);
    } finally {
      setLoaded(true);
    }
  };

  // 1) Run on mount (covers refresh), and
  // 2) Re-run immediately after login via an event we dispatch
  // 3) Also re-check on storage/focus to be robust without changing other files
  useEffect(() => {
    loadAndApply();

    const onAuthLogin = () => loadAndApply();
    const onStorage = (e) => {
      if (!e.key) return;
      if (["token", "authToken", "jwt", "accessToken"].includes(e.key)) {
        loadAndApply();
      }
    };
    const onFocus = () => {
      const current = getToken();
      if (current !== tokenRef.current) loadAndApply();
    };

    window.addEventListener("auth:login", onAuthLogin);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("auth:login", onAuthLogin);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Helpers to update local state + mark dirty
  function setLocals(patch) {
    const next = { ...settings, ...patch };
    setSettings(next);
    applyToRoot(next); // reflect immediately
    setDirty(true);
  }

  // New: Restore to default (does NOT auto-save; lets user confirm via Save)
  function handleRestoreDefaults() {
    setLocals({ ...DEFAULTS });
  }

  async function handleSave() {
    const token = tokenRef.current;
    if (!token) return;
    try {
      const body = {
        fontSize: clampFontSize(settings.fontSize),
        readableFont: settings.readableFont,
        spacing: settings.spacing,
      };
      // keep your original PATCH endpoint if that’s what your backend expects
      await API.patch("/accessibility", body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDirty(false);
    } catch {
      // ignore; user keeps seeing local effect; can retry save
    }
  }

  if (!loaded) return null; // avoid initial flash

  return (
    <div className="fixed bottom-6 left-6 z-50 font-poppins">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="accessibility-panel"
        className="bg-gradient-to-r from-green-700 to-green-600 text-white px-5 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-200 focus:ring-4 focus:ring-green-300 font-medium tracking-wide"
      >
        Accessibility
      </button>

      {open && (
        <div
          id="accessibility-panel"
          className="mt-3 bg-white rounded-2xl border border-gray-200 shadow-2xl p-5 w-72 space-y-4 animate-fadeIn"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center border-b border-gray-100 pb-2">
            Accessibility Settings
          </h2>

          {/* Font Size (Slider) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Font Size</span>
              <span className="text-xs text-gray-500">{clampFontSize(settings.fontSize)}%</span>
            </div>
            <input
              type="range"
              min={80}
              max={200}
              step={2.5}
              value={clampFontSize(settings.fontSize)}
              onChange={(e) => setLocals({ fontSize: clampFontSize(e.target.value) })}
              aria-label="Font size"
              className="w-full accent-green-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Smaller</span>
              <span>Default</span>
              <span>Larger</span>
            </div>
          </div>

          {/* Readable Font */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700">Readable Font</span>
            <input
              type="checkbox"
              checked={settings.readableFont}
              onChange={() => setLocals({ readableFont: !settings.readableFont })}
              className="accent-green-600 scale-125"
            />
          </label>

          {/* Extra Spacing */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700">Extra Spacing</span>
            <input
              type="checkbox"
              checked={settings.spacing}
              onChange={() => setLocals({ spacing: !settings.spacing })}
              className="accent-green-700 scale-125"
            />
          </label>

          {/* Actions: Save + Restore (side-by-side) */}
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!dirty || !tokenRef.current}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                dirty && tokenRef.current
                  ? "bg-green-700 text-white hover:bg-green-800"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              Save changes
            </button>

            <button
              onClick={handleRestoreDefaults}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
              title="Restore font, readable font, and spacing to defaults"
            >
              Restore to Default
            </button>
          </div>

          {!tokenRef.current && (
            <p className="text-[11px] text-gray-500 mt-1">
              Tip: Log in to sync settings to your account (otherwise they’re kept in this browser).
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AccessibilityToggle;
