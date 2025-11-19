// src/pages/profile/Provider/components/ProviderSidebar.jsx
import React from "react";
import { User as UserIcon } from "lucide-react";

const ProviderSidebar = ({
  provider,
  activeTab,
  setActiveTab,
  onLogout,
}) => {
  const menuItems = [
    { key: "profile", label: "Profile" },
    { key: "bookings", label: "Booking History" },
    { key: "ongoing", label: "Ongoing Job" },
    { key: "payout", label: "Total Payout" },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 shadow-sm p-4 sm:p-6 flex flex-col justify-between">
      <div>
        {/* <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2">
            {provider.profile_picture_url ? (
              <img
                src={provider.profile_picture_url}
                className="w-full h-full object-cover"
                alt="profile"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <UserIcon size={24} className="text-gray-400" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm sm:text-base truncate">
              {provider.name}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 capitalize">
              {provider.provider_type}
            </p>
          </div>
        </div> */}

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full text-left px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition ${
                activeTab === item.key
                  ? "bg-indigo-600 text-white"
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
        className="w-full mt-6 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm sm:text-base"
      >
        Logout
      </button>
    </aside>
  );
};

export default ProviderSidebar;
