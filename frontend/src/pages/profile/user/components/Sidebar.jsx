// src/pages/profile/User/components/Sidebar.jsx
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

  const getUserImage = (user) =>
    user?.profile_picture_url?.url ||
    user?.profile_picture_url ||
    user?.profile_picture ||
    user?.avatar_url ||
    "/default-user.png";

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

        {/* MOBILE PROFILE IMAGE */}
        <div className="flex justify-center mt-6">
          <div className="w-20 h-20 rounded-full overflow-hidden border shadow">
            <picture>
              <source srcSet={`${getUserImage(user)}?format=avif`} type="image/avif" />
              <source srcSet={`${getUserImage(user)}?format=webp`} type="image/webp" />

              <img
                src={getUserImage(user)}
                alt="User profile"
                width="80"
                height="80"
                className="w-full h-full object-cover"
                loading="lazy"
                srcSet={`
                  ${getUserImage(user)}?w=40 40w,
                  ${getUserImage(user)}?w=80 80w,
                  ${getUserImage(user)}?w=160 160w
                `}
                sizes="80px"
              />
            </picture>
          </div>
        </div>

        <nav className="p-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === item.key
                  ? "bg-green-600 text-white"
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
        {/* DESKTOP PROFILE IMAGE */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border shadow">
            <picture>
              <source srcSet={`${getUserImage(user)}?format=avif`} type="image/avif" />
              <source srcSet={`${getUserImage(user)}?format=webp`} type="image/webp" />

              <img
                src={getUserImage(user)}
                alt="User"
                width="96"
                height="96"
                className="w-full h-full object-cover"
                loading="lazy"
                srcSet={`
                  ${getUserImage(user)}?w=48 48w,
                  ${getUserImage(user)}?w=96 96w,
                  ${getUserImage(user)}?w=192 192w
                `}
                sizes="96px"
              />
            </picture>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === item.key
                  ? "bg-green-600 text-white"
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
