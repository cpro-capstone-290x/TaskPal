// src/pages/profile/User/components/Sidebar.jsx
import React from "react";
import ProfilePictureUploader from "../../../components/ProfilePictureUploader";

const Sidebar = ({ user, activeTab, setActiveTab, onLogout, onProfilePictureUpdate }) => {
  const menuItems = [
    { key: "profile", label: "Profile" },
    { key: "bookings", label: "Booking History" },
    { key: "ongoing", label: "Ongoing" },
    { key: "authorized", label: "Authorized User" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 shadow-sm p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-8">
          <ProfilePictureUploader user={user} onUpdate={onProfilePictureUpdate} />

          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-sm text-gray-500 capitalize">
              {user.type_of_user}
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${
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
        className="w-full mt-6 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition"
      >
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
