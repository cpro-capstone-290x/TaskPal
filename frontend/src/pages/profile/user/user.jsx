// src/pages/profile/User/User.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import ProfileView from "./components/ProfileView";
import EditProfileModal from "./components/EditProfileModal";
import BookingHistory from "./components/BookingHistory";
import OngoingBookings from "./components/OngoingBookings";
import AuthorizedUserSection from "./components/AuthorizedUserSection";

import { useUserDetails } from "./hooks/useUserDetails";
import { useBookings } from "./hooks/useBookings";
import { useAuthorizedUser } from "./hooks/useAuthorizedUser";

const User = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode] = useState(false);

  const {
    user,
    loading: userLoading,
    error: userError,
    saveUser,
    setUser,
  } = useUserDetails(id);

  const {
    bookings,
    loading: bookingLoading,
  } = useBookings(id);

  const {
    authorizedUser,
    loading: loadingAuth,
    registerAuthorizedUser,
    removeAuthorizedUser,
    refreshAuthorizedUser,
  } = useAuthorizedUser(id);

  const ongoingBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status === "Paid" &&
          (!b.completedclient ||
            b.completedclient.toLowerCase() !== "completed")
      ),
    [bookings]
  );

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  if (userLoading) {
    return (
      <p className="text-center mt-10 text-gray-500">Loading...</p>
    );
  }

  if (userError) {
    return (
      <p className="text-center text-red-500 mt-10">{userError}</p>
    );
  }

  if (!user) {
    return (
      <p className="text-center text-gray-500 mt-10">User not found.</p>
    );
  }

  return (
    <>
      {/* Floating Edit Button */}
      {activeTab === "profile" && !editMode && (
        <button
          onClick={() => setEditMode(true)}
          className="fixed bottom-6 right-6 px-4 py-2 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Edit Profile
        </button>
      )}

      {/* Main Layout */}
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          onProfilePictureUpdate={(newPhoto) =>
            setUser((prev) => ({ ...prev, profile_picture: newPhoto }))
          }
        />

        <main className="flex-1 p-10">
          {activeTab === "profile" && <ProfileView user={user} />}

          {activeTab === "bookings" && (
            <BookingHistory
              bookings={bookings}
              loading={bookingLoading}
            />
          )}

          {activeTab === "ongoing" && (
            <OngoingBookings
              ongoingBookings={ongoingBookings}
              loading={bookingLoading}
            />
          )}

          {activeTab === "authorized" && (
            <AuthorizedUserSection
              user={user}
              authorizedUser={authorizedUser}
              loading={loadingAuth}
              registerAuthorizedUser={registerAuthorizedUser}
              removeAuthorizedUser={removeAuthorizedUser}
              refreshAuthorizedUser={refreshAuthorizedUser}
              navigate={navigate}
              setActiveTab={setActiveTab}
            />
          )}
        </main>
      </div>

      {editMode && (
        <EditProfileModal
          user={user}
          onClose={() => setEditMode(false)}
          onSave={saveUser}
        />
      )}
    </>
  );
};

export default User;
