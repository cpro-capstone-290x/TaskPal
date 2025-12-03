import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SelectionIcons from "./components/SelectionIcons";
import IntroContent from "./components/IntroContent";
import Header from "./components/Header";
import InstallQR from "./components/InstallQR";
import InstallPrompt from "./components/InstallPrompt";

function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");

    setIsAuthenticated(!!token);

    // 🔒 Guard: block logged-in providers from the Home page
    // and send them to THEIR profile dashboard
    if (token && role === "provider" && userId) {
      navigate(`/profileProvider/${userId}`, { replace: true });
    }
  }, [navigate]);

  return (
    <>
      <Header />

      <div className="App flex flex-col items-center min-h-screen bg-gray-50 text-center py-10">
        {/* --- Section 1: Icons --- */}
        <div className="mt-12 mb-6">
          <SelectionIcons />
        </div>

        {/* --- Section 2: QR Code --- */}
        {/* <div className="mb-10">
          <InstallQR />
        </div> */}

        {/* --- Section 3: Intro Content (only for guests) --- */}
        {!isAuthenticated && <IntroContent />}
      </div>

      {/* --- Install Banner/Prompt --- */}
      <InstallPrompt />
    </>
  );
}

export default Home;
