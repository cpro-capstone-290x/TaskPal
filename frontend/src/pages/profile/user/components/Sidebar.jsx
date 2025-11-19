// src/pages/profile/User/components/Sidebar.jsx
import React from "react";
import ProfilePictureUploader from "../../../components/ProfilePictureUploader";

const Sidebar = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onProfilePictureUpdate,
}) => {
  const menuItems = [
    { key: "profile", label: "Profile" },
    { key: "bookings", label: "Booking History" },
    { key: "ongoing", label: "Ongoing" },
    { key: "authorized", label: "Authorized User" },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 shadow-sm p-4 sm:p-6 flex flex-col justify-between">
      <div>
        {/* Profile section matching ProviderSidebar formatting */}
        {/* <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2">
            <ProfilePictureUploader
              user={user}
              onUpdate={onProfilePictureUpdate}
              size={64}
            />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold text-sm sm:text-base truncate">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 capitalize">
              {user.type_of_user}
            </p>
          </div>
        </div> */}

        {/* Navigation Menu */}
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

      {/* Logout Button */}
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
