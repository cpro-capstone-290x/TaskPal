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

      <div className="App flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center">
        <div className="my-12">
          <SelectionIcons />
          <InstallQR />
        </div>

        {/* Show IntroContent if NOT logged in */}
        {!isAuthenticated && <IntroContent />}
      </div>

      {/* ✅ Added install helper (Android install button + iOS banner) */}
      <InstallPrompt />
    </>
  );
}

export default Home;
