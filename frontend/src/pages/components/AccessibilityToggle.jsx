import React, { useState, useEffect } from "react";

const AccessibilityPanel = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState({
    fontSize: 100,
    readableFont: false,
    spacing: false,
  });

  // Load saved settings
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("accessibilitySettings"));
    if (saved) setSettings(saved);
  }, []);

  // Apply settings globally
  useEffect(() => {
    localStorage.setItem("accessibilitySettings", JSON.stringify(settings));

    const root = document.documentElement;
    root.style.fontSize = `${settings.fontSize}%`;

    if (settings.readableFont) {
      root.classList.add("accessible-readable");
    } else {
      root.classList.remove("accessible-readable");
    }

    if (settings.spacing) {
      root.classList.add("accessible-spacing");
    } else {
      root.classList.remove("accessible-spacing");
    }
  }, [settings]);

  // Reset to default
  const handleReset = () =>
    setSettings({
      fontSize: 100,
      readableFont: false,
      spacing: false,
    });

  // Font size adjusters
  const increaseFont = () =>
    setSettings({
      ...settings,
      fontSize: Math.min(160, settings.fontSize + 10),
    });

  const decreaseFont = () =>
    setSettings({
      ...settings,
      fontSize: Math.max(80, settings.fontSize - 10),
    });

  return (
    <div className="fixed bottom-6 left-6 z-50 font-poppins">
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="bg-gradient-to-r from-green-700 to-green-600 text-white px-5 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-200 focus:ring-4 focus:ring-green-300 font-medium tracking-wide"
      >
        Accessibility
      </button>

      {/* Settings Panel */}
      {open && (
        <div className="mt-3 bg-white rounded-2xl border border-gray-200 shadow-2xl p-5 w-72 space-y-4 animate-fadeIn">
          <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center border-b border-gray-100 pb-2">
            Accessibility Settings
          </h2>

          {/* Font Size */}
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Font Size</span>
            <div className="space-x-2">
              <button
                onClick={decreaseFont}
                className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                A-
              </button>
              <button
                onClick={increaseFont}
                className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                A+
              </button>
            </div>
          </div>

           {/* Readable Font */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700">Readable Font</span>
            <input
              type="checkbox"
              checked={settings.readableFont}
              onChange={() =>
                setSettings({
                  ...settings,
                  readableFont: !settings.readableFont,
                })
              }
              className="accent-green-600 scale-125"
            />
          </label>

          {/* Extra Spacing */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700">Extra Spacing</span>
            <input
              type="checkbox"
              checked={settings.spacing}
              onChange={() =>
                setSettings({
                  ...settings,
                  spacing: !settings.spacing,
                })
              }
              className="accent-green-700 scale-125"
            />
          </label>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="w-full mt-3 py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition-colors"
          >
            Reset to Default
          </button>
        </div>
      )}
    </div>
  );
};

export default AccessibilityPanel;
