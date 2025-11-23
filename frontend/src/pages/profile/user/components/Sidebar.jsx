import React from "react";
import ProfilePictureUploader from "../../../components/ProfilePictureUploader";
import { X } from "lucide-react";

const Sidebar = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onProfilePictureUpdate,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const menuItems = [
    { key: "profile", label: "Profile" },
    { key: "bookings", label: "Booking History" },
    { key: "ongoing", label: "Ongoing" },
    { key: "authorized", label: "Authorized User" },
  ];

  return (
    <>
      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* MOBILE DRAWER */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r shadow-xl z-50
          transform transition-transform duration-300 lg:hidden
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button onClick={() => setMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === item.key
                  ? "bg-green-700 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab(item.key);
                setMobileMenuOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={onLogout}
          className="m-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg"
        >
          Logout
        </button>
      </aside>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r p-6 shadow-sm">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === item.key
                  ? "bg-green-700 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={onLogout}
          className="mt-6 px-4 py-2 bg-red-100 text-red-700 rounded-lg"
        >
          Logout
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
