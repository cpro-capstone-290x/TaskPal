import React from "react";
import { X } from "lucide-react";

const Sidebar = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const menuItems = [
    { key: "profile", label: "Profile" },
    { key: "bookings", label: "Booking History" },
    { key: "ongoing", label: "Ongoing" },
    { key: "authorized", label: "Authorized User" },
  ];

  const getUserImage = (user) =>
    user?.profile_picture_url?.url ||
    user?.profile_picture_url ||
    user?.profile_picture ||
    user?.avatar_url ||
    "/default-user.png";

  // Reusable Profile Image Component to keep code DRY
  const UserAvatar = () => (
    <div className="flex justify-center mb-6">
      <div className="w-24 h-24 rounded-full overflow-hidden border shadow-sm">
        <picture>
          <source
            srcSet={`${getUserImage(user)}?format=avif`}
            type="image/avif"
          />
          <source
            srcSet={`${getUserImage(user)}?format=webp`}
            type="image/webp"
          />
          <img
            src={getUserImage(user)}
            alt="User profile"
            width="96"
            height="96"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </picture>
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* MOBILE DRAWER */}
      <aside
        aria-label="Mobile navigation menu"
        className={`
          fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50
          transform transition-transform duration-300 md:hidden
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close mobile menu"
            className="text-gray-600 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <UserAvatar />

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.key}
                aria-label={`Go to ${item.label}`}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === item.key
                    ? "bg-indigo-600 text-white"
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
            aria-label="Log out"
            className="mt-2 w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r p-6 shadow-sm min-h-screen">
        <UserAvatar />

        {/* Removed flex-1 so items don't push logout to bottom */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.key}
              aria-label={`Open ${item.label}`}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === item.key
                  ? "bg-indigo-600 text-white"
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
          aria-label="Log out of user account"
          className="mt-2 w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition"
        >
          Logout
        </button>
      </aside>
    </>
  );
};

export default Sidebar;