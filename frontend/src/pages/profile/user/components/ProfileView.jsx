// src/pages/profile/User/components/ProfileView.jsx
import React, { useState } from "react";
import { CheckCircle, Clock } from "lucide-react";

/* Reusable read-only field */
const ProfileField = ({ label, value }) => (
  <div>
    <label className="block text-gray-600 text-sm font-medium mb-1">
      {label}
    </label>
    <input
      type="text"
      readOnly
      value={value || "N/A"}
      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg"
    />
  </div>
);

/* Bulletproof image resolver */
const getUserImage = (user) => {
  return (
    user?.profile_picture_url?.url || // {url:"..."}
    user?.profile_picture_url || // direct string
    user?.profile_picture || // alt key
    user?.avatar_url || // alt key
    "/default-user.png" // fallback
  );
};

const ProfileView = ({
  user,
  newProfilePicture,
  setNewProfilePicture,
  onConfirmUpload,
  isUploading,
}) => {
  const [uploadSuccess, setUploadSuccess] = useState(false);   // ⭐ minimal state

  // ⭐ wrap original upload call
  const handleConfirmUpload = async () => {
    await onConfirmUpload();      // run your existing upload logic
    setUploadSuccess(true);       // show popup
    setTimeout(() => setUploadSuccess(false), 2500);  // auto-hide
  };
  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-2xl shadow-xl border border-gray-100">

      {/* ⭐ SUCCESS POPUP (minimal) */}
      {uploadSuccess && (
        <div className="absolute top-4 right-4 bg-green-100 text-green-700 border border-green-300 px-4 py-2 rounded-lg shadow flex items-center gap-2">
          <CheckCircle size={18} />
          <span className="text-sm">Profile picture updated!</span>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col mb-6 sm:mb-8 border-b pb-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
          User Profile
        </h2>
      </div>

      {/* ==========================
          PROFILE PICTURE + NAME + UPLOAD
      =========================== */}
      <div className="flex flex-col items-center text-center gap-4 mb-8">

        {/* Profile Picture */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-gray-200">
          <img
            src={getUserImage(user)}
            alt="User"
            className="w-full h-full object-cover"
          />
        </div>

        {/* User Name & Type */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            {user.first_name} {user.last_name}
          </h3>
          <p className="text-gray-500 capitalize">
            {user.type_of_user || "Regular User"}
          </p>
        </div>

        {/* Upload Controls */}
        <div className="flex items-center gap-3 mt-2">

          <input
            type="file"
            id="user-profile-pic"
            className="hidden"
            accept="image/*"
            onChange={(e) => setNewProfilePicture(e.target.files[0])}
          />

          <button
            type="button"
            onClick={() => document.getElementById("user-profile-pic").click()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
          >
            Choose File
          </button>

          {newProfilePicture && (
            <button
              type="button"
              onClick={handleConfirmUpload}
              disabled={isUploading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
            >
              {isUploading ? "Uploading..." : "Confirm Upload"}
            </button>
          )}
        </div>
      </div>

      {/* ==========================
          PROFILE DETAILS
      =========================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

        <ProfileField label="First Name" value={user.first_name} />
        <ProfileField label="Last Name" value={user.last_name} />
        <ProfileField label="Email" value={user.email} />

        <ProfileField
          label="Date of Birth"
          value={
            user.date_of_birth
              ? new Date(user.date_of_birth).toLocaleDateString("en-CA")
              : "N/A"
          }
        />

        <ProfileField label="Gender" value={user.gender} />
        <ProfileField label="Assistance Level" value={user.assistance_level} />
        <ProfileField label="Living Situation" value={user.living_situation} />

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Address
          </label>
          <textarea
            readOnly
            rows="3"
            value={`${user.unit_no || ""} ${user.street || ""}, ${
              user.city || ""
            }, ${user.province || ""}, ${user.postal_code || ""}`}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg"
          />
        </div>

        {/* Emergency Contact */}
        <ProfileField
          label="Emergency Contact Name"
          value={user.emergency_contact_name}
        />
        <ProfileField
          label="Relationship"
          value={user.emergency_contact_relationship}
        />
        <ProfileField
          label="Emergency Contact Phone"
          value={user.emergency_contact_phone}
        />

        {/* Documents */}
        <div className="md:col-span-2">
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Uploaded Documents
          </label>

          <div className="space-y-2">
            {user.id_document_url && (
              <a
                href={user.id_document_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline inline-block"
              >
                View Senior ID
              </a>
            )}

            {user.pwd_document_url && (
              <a
                href={user.pwd_document_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline inline-block"
              >
                View PWD Document
              </a>
            )}

            {!user.id_document_url && !user.pwd_document_url && (
              <p className="text-gray-500 text-sm">No documents uploaded.</p>
            )}
          </div>
        </div>

        {/* Verification */}
        <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-4 border-t">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              user.is_verified
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-yellow-100 text-yellow-700 border border-yellow-200"
            }`}
          >
            {user.is_verified ? "Verified" : "Not Verified"}
          </span>

          <span className="text-gray-500 text-sm">
            Joined on{" "}
            {new Date(user.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

    </div>
  );
};

export default ProfileView;
