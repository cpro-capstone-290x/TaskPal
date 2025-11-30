// src/components/InstallPrompt.jsx
import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsIOS(iOS);

    // Listen for Android PWA install prompt
    const handler = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("Install choice:", outcome);
    setDeferredPrompt(null);
  };

  return (
    <>
      {/* ANDROID Install Button */}
      {deferredPrompt && (
        <button
          onClick={handleInstall}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg z-50"
        >
          Install TaskPal App
        </button>
      )}

      {/* iOS Install Banner */}
      {isIOS && !deferredPrompt && (
        <div className="fixed bottom-4 left-4 right-4 bg-white border shadow-xl p-4 rounded-xl z-50">
          <p className="text-gray-700 text-sm leading-tight">
            <strong>Install TaskPal:</strong><br />
            Tap the <span className="text-blue-600">Share</span> icon →{" "}
            <strong>Add to Home Screen</strong>
          </p>
        </div>
      )}
    </>
  );
}
