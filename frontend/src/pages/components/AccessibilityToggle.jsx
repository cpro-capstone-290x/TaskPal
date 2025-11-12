// src/components/AccessibilityToggle.jsx
import React, { useEffect, useState } from "react";
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

function applyToRoot(s) {
  const root = document.documentElement;
  root.style.fontSize = `${s.fontSize}%`;
  root.classList.toggle("accessible-readable", !!s.readableFont);
  root.classList.toggle("accessible-spacing", !!s.spacing);
}

const AccessibilityToggle = () => {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [settings, setSettings] = useState({ fontSize: 100, readableFont: false, spacing: false });

  const token = getToken();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // 1) Load once after login, then apply exactly once
  useEffect(() => {
    if (!token) {
      setLoaded(true);
      applyToRoot({ fontSize: 100, readableFont: false, spacing: false });
      return;
    }
    (async () => {
      try {
        const { data } = await API.get("/accessibility/me", { headers: authHeaders });
        const s = data ?? { fontSize: 100, readableFont: false, spacing: false };
        setSettings(s);
        applyToRoot(s);
      } catch {
        const s = { fontSize: 100, readableFont: false, spacing: false };
        setSettings(s);
        applyToRoot(s);
      } finally {
        setLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Controls (apply immediately locally + mark dirty; save happens on button)
  const increaseFont = () => setLocals({ fontSize: Math.min(160, settings.fontSize + 10) });
  const decreaseFont = () => setLocals({ fontSize: Math.max(80, settings.fontSize - 10) });
  const toggleReadable = () => setLocals({ readableFont: !settings.readableFont });
  const toggleSpacing  = () => setLocals({ spacing: !settings.spacing });

  function setLocals(patch) {
    const next = { ...settings, ...patch };
    setSettings(next);
    applyToRoot(next); // reflect immediately
    setDirty(true);
  }

  async function handleSave() {
    if (!token) return;
    try {
      const body = {
        fontSize: settings.fontSize,
        readableFont: settings.readableFont,
        spacing: settings.spacing,
      };
      await API.patch("/accessibility", body, { headers: authHeaders });
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
        <div id="accessibility-panel" className="mt-3 bg-white rounded-2xl border border-gray-200 shadow-2xl p-5 w-72 space-y-4 animate-fadeIn">
          <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center border-b border-gray-100 pb-2">
            Accessibility Settings
          </h2>

          {/* Font Size */}
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Font Size</span>
            <div className="space-x-2">
              <button onClick={decreaseFont} className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">A-</button>
              <button onClick={increaseFont} className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">A+</button>
            </div>
          </div>

          {/* Readable Font */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700">Readable Font</span>
            <input type="checkbox" checked={settings.readableFont} onChange={toggleReadable} className="accent-green-600 scale-125" />
          </label>

          {/* Extra Spacing */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700">Extra Spacing</span>
            <input type="checkbox" checked={settings.spacing} onChange={toggleSpacing} className="accent-green-700 scale-125" />
          </label>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!dirty || !token}
            className={`w-full mt-4 py-2 rounded-lg font-medium transition-colors ${
              dirty ? "bg-green-700 text-white hover:bg-green-800" : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Save changes
          </button>
        </div>
      )}
    </div>
  );
};

export default AccessibilityToggle;
