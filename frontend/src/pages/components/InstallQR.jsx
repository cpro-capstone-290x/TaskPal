// src/components/InstallQR.jsx
import React from "react";
import QRCode from "react-qr-code";

const InstallQR = () => {
  const url = "https://task-pal-zeta.vercel.app/";

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
        Install TaskPal on your Phone
      </h2>

      <p className="text-sm text-gray-600 dark:text-gray-300 text-center max-w-xs">
        Scan the QR code to open TaskPal on your mobile device and add it to
        your home screen like an app.
      </p>

      <div className="bg-white p-3 rounded-xl shadow-inner">
        <QRCode value={url} size={190} />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Works on iOS & Android
      </p>
    </div>
  );
};

export default InstallQR;
