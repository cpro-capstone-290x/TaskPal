// src/pages/components/AccessibilityToggle.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g. http://localhost:5000/api
  withCredentials: false,
});

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

const DEFAULTS = { fontSize: 100, readableFont: false, spacing: false };

/** First-load hard apply */
function applyToRoot(next) {
  const root = document.documentElement;
  root.style.fontSize = `${clampFontSize(next.fontSize)}%`;
  root.classList.toggle("accessible-readable", !!next.readableFont);
  root.classList.toggle("accessible-spacing", !!next.spacing);
}

/** Apply only pieces that changed */
function applyToRootPartial(prev, next) {
  const root = document.documentElement;

  // font size
  const prevFs = clampFontSize(prev.fontSize);
  const nextFs = clampFontSize(next.fontSize);
  if (prevFs !== nextFs) root.style.fontSize = `${nextFs}%`;

  // readable
  const prevReadable = !!prev.readableFont;
  const nextReadable = !!next.readableFont;
  if (prevReadable !== nextReadable) {
    root.classList.toggle("accessible-readable", nextReadable);
  }

  // spacing
  const prevSpacing = !!prev.spacing;
  const nextSpacing = !!next.spacing;
  if (prevSpacing !== nextSpacing) {
    root.classList.toggle("accessible-spacing", nextSpacing);
  }
}

const AccessibilityToggle = ({ variant = "nav" }) => {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [settings, setSettings] = useState(DEFAULTS);
  const lastAppliedRef = useRef(DEFAULTS);
  const comboRef = useRef(null); // for showing indeterminate

  const token = getToken();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Load settings and apply once
  useEffect(() => {
    if (!token) {
      setSettings(DEFAULTS);
      applyToRoot(DEFAULTS);
      lastAppliedRef.current = DEFAULTS;
      setLoaded(true);
      return;
    }
    (async () => {
      try {
        const { data } = await API.get("/accessibility/me", { headers: authHeaders });
        const s = data
          ? {
              fontSize: clampFontSize(data.fontSize ?? 100),
              readableFont: !!data.readableFont,
              spacing: !!data.spacing,
            }
          : DEFAULTS;
        setSettings(s);
        applyToRoot(s);
        lastAppliedRef.current = s;
      } catch {
        setSettings(DEFAULTS);
        applyToRoot(DEFAULTS);
        lastAppliedRef.current = DEFAULTS;
      } finally {
        setLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Accessibility open from mobile menu if you dispatch this event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-accessibility", handler);
    return () => window.removeEventListener("open-accessibility", handler);
  }, []);

  // Make the single checkbox show an indeterminate state if only one of the two is true
  useEffect(() => {
    if (!comboRef.current) return;
    const onlyOne = settings.readableFont !== settings.spacing;
    comboRef.current.indeterminate = onlyOne;
  }, [settings.readableFont, settings.spacing]);

  function setLocals(patch) {
    const next = { ...settings, ...patch };
    const prev = lastAppliedRef.current;
    setSettings(next);
    applyToRootPartial(prev, next);
    lastAppliedRef.current = next;
    setDirty(true);
  }

  function handleRestoreDefaults() {
    const prev = lastAppliedRef.current;
    const next = { ...DEFAULTS };
    setSettings(next);
    applyToRootPartial(prev, next);
    lastAppliedRef.current = next;
    setDirty(true);
  }

  async function handleSave() {
    if (!token) return;
    try {
      await API.patch(
        "/accessibility",
        {
          fontSize: clampFontSize(settings.fontSize),
          readableFont: !!settings.readableFont,
          spacing: !!settings.spacing,
        },
        { headers: authHeaders }
      );
      setDirty(false);
    } catch {
      /* keep local effect; user can retry */
    }
  }

  if (!loaded) return null;

  const triggerClass =
    variant === "nav"
      ? "inline-flex items-center h-12 px-3 text-lg lg:text-xl font-semibold text-gray-900 hover:text-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-md"
      : variant === "menu"
      ? "w-full text-left px-3 py-3 rounded-lg text-[15px] font-semibold text-slate-900 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
      : "inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-900 px-4 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600";

  const modalClass =
    variant === "menu"
      ? "fixed inset-x-4 top-24 z-[70] max-w-[calc(100%-2rem)] mx-auto rounded-2xl border border-gray-200 bg-white shadow-2xl p-5 space-y-4"
      : "absolute right-0 top-[calc(100%+12px)] w-80 max-w-[90vw] rounded-2xl border border-gray-200 bg-white shadow-2xl p-5 space-y-4";

  // ---- Combined checkbox logic ----
  // We consider it "checked" only if BOTH are true.
  const combinedChecked = !!settings.readableFont && !!settings.spacing;
  function onToggleCombined(nextChecked) {
    // When the single checkbox is toggled, we set both to the same value
    setLocals({ readableFont: nextChecked, spacing: nextChecked });
  }

  return (
    <div className="relative z-[60]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="accessibility-panel"
        className={triggerClass}
      >
        Accessibility
      </button>

      {open && (
        <>
          {/* Backdrop for mobile or when you prefer overlay */}
          {variant === "menu" && (
            <div
              className="fixed inset-0 z-[60] bg-black/20"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
          )}

          <div
            id="accessibility-panel"
            className={modalClass}
            role="dialog"
            aria-label="Accessibility settings"
          >
            {/* Font size */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-800 font-medium">Font Size</span>
                <span className="text-xs text-gray-500">
                  {clampFontSize(settings.fontSize)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">Smaller</span>
                <input
                  type="range"
                  min={80}
                  max={200}
                  step={2.5}
                  value={clampFontSize(settings.fontSize)}
                  onChange={(e) =>
                    setLocals({ fontSize: clampFontSize(e.target.value) })
                  }
                  aria-label="Font size"
                  className="w-full accent-sky-700"
                />
                <span className="text-xs text-gray-500">Larger</span>
              </div>
            </div>

            {/* Single combined checkbox (Readable Font + Extra Spacing) */}
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-800">
                Readable Font &amp; Extra Spacing
              </span>
              <input
                ref={comboRef}
                type="checkbox"
                checked={combinedChecked}
                onChange={(e) => onToggleCombined(e.target.checked)}
                className="accent-sky-700 scale-125"
                aria-describedby="acc-combined-desc"
              />
            </label>
            <p id="acc-combined-desc" className="text-xs text-gray-500">
              Enables a high-legibility font and increases line/word spacing (WCAG 1.4.12).
            </p>

            {/* Actions */}
            <div className="mt-2 grid grid-cols-3 gap-3">
              <button
                onClick={handleSave}
                disabled={!dirty || !token}
                className={`col-span-2 h-10 rounded-lg font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 ${
                  dirty && token
                    ? "bg-sky-700 text-white hover:bg-sky-800"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                Save changes
              </button>

              <button
                onClick={handleRestoreDefaults}
                className="h-10 rounded-lg border border-gray-300 text-gray-800 font-medium hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Restore
              </button>
            </div>

            {!token && (
              <p className="text-[11px] text-gray-500 mt-1">
                Tip: Log in to sync settings to your account (otherwise they’re kept in this browser).
              </p>
            )}

            {/* Close button for both desktop & mobile */}
            <div className="pt-2">
              <button
                onClick={() => setOpen(false)}
                className="w-full h-10 rounded-lg border border-slate-300 text-slate-800 font-medium hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AccessibilityToggle;
