// src/pages/profile/User/components/Sidebar.jsx
import React from "react";

const Sidebar = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  isMobile,
}) => {
  const menuItems = [
    { key: "profile", label: "Profile" },
    { key: "bookings", label: "Booking History" },
    { key: "ongoing", label: "Ongoing" },
    { key: "authorized", label: "Authorized User" },
  ];

  return (
    <aside
      className={`${
        isMobile
          ? "block"
          : "hidden md:flex md:w-64"
      } bg-white border-r border-gray-200 shadow-sm p-4 sm:p-6 flex-col justify-between`}
    >
      <div>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full text-left px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition ${
                activeTab === item.key
                  ? "bg-green-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <button
        onClick={onLogout}
        className="w-full mt-6 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm sm:text-base hover:bg-red-200 transition"
      >
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
