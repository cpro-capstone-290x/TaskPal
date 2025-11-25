import React, { useEffect, useState } from 'react';
import SelectionIcons from './components/SelectionIcons';
import IntroContent from './components/IntroContent';
import Header from './components/Header';
import InstallQR from './components/InstallQR';
import InstallPrompt from './components/InstallPrompt';

function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <>
      <Header />

      <div className="App flex flex-col items-center min-h-screen bg-gray-50 text-center py-10">

        {/* --- Section 1: Icons --- */}
        <div className="mt-12 mb-6">
          <SelectionIcons />
        </div>

        {/* --- Section 2: QR Code --- */}
        <div className="mb-10">
          <InstallQR />
        </div>

        {/* --- Section 3: Intro Content (only for guests) --- */}
        {!isAuthenticated && (
            <IntroContent />
        )}
      </div>

      {/* --- Install Banner/Prompt --- */}
      <InstallPrompt />
    </>
  );
}

export default Home;
