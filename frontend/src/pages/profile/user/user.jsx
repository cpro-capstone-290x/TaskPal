// src/pages/profile/User/User.jsx
import React, { useState } from "react";
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

import api from "../../../api";

// ⭐ UTILITY: Compress and resize image before upload
// This converts images to WebP and resizes them to max 500px width
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 500; // 500px is plenty for a profile picture
        
        // Calculate new height to maintain aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP at 80% quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas is empty"));
              return;
            }
            // Create a new file with .webp extension
            const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const compressedFile = new File([blob], newName, {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/webp",
          0.8
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const User = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [newProfilePicture, setNewProfilePicture] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const {
    user,
    loading: userLoading,
    error: userError,
    saveUser,
    setUser,
  } = useUserDetails(id);

  const {
    ongoingBookings,
    historyBookings,
    loading: bookingLoading,
  } = useBookings(id);

  const {
    authorizedUser,
    loading: loadingAuth,
    registerAuthorizedUser,
    removeAuthorizedUser,
    refreshAuthorizedUser,
  } = useAuthorizedUser(id);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  // ✅ UPDATED: PROFILE PICTURE UPLOAD WITH COMPRESSION
  const onConfirmUpload = async () => {
    if (!newProfilePicture) return;

    try {
      setIsUploading(true);
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("Not authenticated.");
        return;
      }

      // 1. Compress the image before sending
      // This solves the "Resource Size" warning in your report
      const compressedFile = await compressImage(newProfilePicture);

      const formData = new FormData();
      formData.append("file", compressedFile);

      const res = await api.post(`/users/${id}/profile-picture`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.blobUrl) {
        setUser((prev) => ({
          ...prev,
          profile_picture_url: res.data.blobUrl,
        }));
      }

      setUploadSuccess(true);
      setNewProfilePicture(null); // Clear the selection after upload
      setTimeout(() => setUploadSuccess(false), 2500);
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("Failed to upload profile image.");
    } finally {
      setIsUploading(false);
    }
  };

  if (userLoading) {
    return <p className="text-center mt-10 text-gray-500">Loading...</p>;
  }

  if (userError) {
    return <p className="text-center text-red-500 mt-10">{userError}</p>;
  }

  if (!user) {
    return <p className="text-center mt-10">User not found.</p>;
  }

  return (
    <>
      {uploadSuccess && (
        <div className="fixed top-4 right-4 bg-green-100 text-green-700 border border-green-300 px-4 py-2 rounded-lg shadow flex items-center gap-2 z-50">
          ✓ Profile picture updated!
        </div>
      )}

      {activeTab === "profile" && !editMode && (
        <button
          onClick={() => setEditMode(true)}
          className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Edit Profile
        </button>
      )}

      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b shadow-sm">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 bg-gray-100 border rounded-lg"
        >
          ☰
        </button>

        <h2 className="text-2xl font-semibold text-gray-800">
          Profile <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
            Dashboard
          </span>
        </h2>
      </div>

      {/* PAGE LAYOUT */}
      <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          onProfilePictureUpdate={(newPhoto) =>
            setUser((prev) => ({ ...prev, profile_picture_url: newPhoto }))
          }
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <main className="flex-1 w-full px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {activeTab === "profile" && (
            <ProfileView
              user={user}
              newProfilePicture={newProfilePicture}
              setNewProfilePicture={setNewProfilePicture}
              onConfirmUpload={onConfirmUpload}
              isUploading={isUploading}
            />
          )}

          {activeTab === "bookings" && (
            <BookingHistory bookings={historyBookings} loading={bookingLoading} />
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