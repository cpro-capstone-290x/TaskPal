import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // ✅ Check login status on load
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token);
  }, []);

  // ✅ Handle logout
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("pendingRedirect");
    setIsLoggedIn(false);
    alert("👋 You have been logged out successfully.");
    navigate("/");
  };

  const userId = localStorage.getItem("userId");

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <div
          className="text-2xl font-extrabold text-primary tracking-tight cursor-pointer"
          onClick={() => navigate("/")}
        >
          <span className="text-secondary">Task</span>Pal
        </div>

        {/* Navigation */}
        <nav>
          <ul className="flex space-x-6 items-center">
            {/* Static links */}
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className="text-gray-600 hover:text-sky-600 font-medium transition"
                >
                  {link.name}
                </Link>
              </li>
            ))}

            {/* Auth-based actions */}
            <li className="flex items-center space-x-4">
              {isLoggedIn ? (
                <>
                  {/* Profile Link */}
                  <Link
                    to={`/profile/${userId}`}
                    className="text-gray-600 hover:text-sky-600 font-medium transition"
                  >
                    Profile
                  </Link>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full bg-sky-600 text-white font-semibold hover:bg-sky-700 transition"
                >
                  Login
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
