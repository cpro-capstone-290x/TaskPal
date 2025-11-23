// src/pages/profile/User/components/ProfileView.jsx
import React, { useState } from "react";
import { CheckCircle } from "lucide-react";

/* Reusable read-only field */
const ProfileField = ({ label, value }) => (
  <label className="flex flex-col gap-1">
    <span className="text-gray-600 text-sm font-medium">{label}</span>
    <input
      type="text"
      readOnly
      value={value || "N/A"}
      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg"
    />
  </label>
);

/* Bulletproof image resolver */
const getUserImage = (user) => {
  return (
    user?.profile_picture_url?.url ||
    user?.profile_picture_url ||
    user?.profile_picture ||
    user?.avatar_url ||
    "/default-user.png"
  );
};

const ProfileView = ({
  user,
  newProfilePicture,
  setNewProfilePicture,
  onConfirmUpload,
  isUploading,
}) => {
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleConfirmUpload = async () => {
    await onConfirmUpload();
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 2500);
  };

  return (
    <div className="w-full flex justify-center md:justify-start">
      <div className="relative w-full max-w-3xl lg:max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-7 md:p-8">

        {/* Success popup */}
        {uploadSuccess && (
          <div className="absolute top-4 right-4 bg-green-100 text-green-700 border border-green-300 px-4 py-2 rounded-lg shadow flex items-center gap-2 z-20">
            <CheckCircle size={18} />
            <span className="text-sm">Profile picture updated!</span>
          </div>
        )}

        {/* ---------- HEADER ---------- */}
        <div className="mb-6 border-b pb-3">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            User Profile
          </h2>
        </div>

        {/* ---------- PROFILE PICTURE + NAME ---------- */}
        <div className="flex flex-col items-center text-center gap-4 mb-10">

          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-gray-200 shadow">
            <img
              src={getUserImage(user)}
              alt="User"
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800">
              {user.first_name} {user.last_name}
            </h3>
            <p className="text-gray-500 capitalize text-sm">
              {user.type_of_user || "Regular User"}
            </p>
          </div>

          {/* Upload controls */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">

            <input
              type="file"
              id="user-profile-pic"
              className="hidden"
              accept="image/*"
              onChange={(e) => setNewProfilePicture(e.target.files[0])}
            />

            <button
              type="button"
              onClick={() =>
                document.getElementById("user-profile-pic").click()
              }
              className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm shadow hover:bg-blue-800"
            >
              Choose File
            </button>

            {newProfilePicture && (
              <button
                onClick={handleConfirmUpload}
                disabled={isUploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm shadow hover:bg-indigo-700 disabled:opacity-50"
              >
                {isUploading ? "Uploading..." : "Confirm Upload"}
              </button>
            )}
          </div>
        </div>

        {/* ---------- PROFILE DETAILS GRID ---------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
          <ProfileField
            label="Assistance Level"
            value={user.assistance_level}
          />
          <ProfileField
            label="Living Situation"
            value={user.living_situation}
          />

          {/* -------- ADDRESS (Full width) -------- */}
          <label className="sm:col-span-2 flex flex-col gap-1">
            <span className="text-gray-600 text-sm font-medium">
              Address
            </span>
            <textarea
              readOnly
              rows="3"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg"
              value={`${user.unit_no || ""} ${user.street || ""}, ${user.city || ""}, ${
                user.province || ""
              }, ${user.postal_code || ""}`}
            />
          </label>
          {/* -------- EMERGENCY CONTACT -------- */}
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
            value={user.emgency_contact_phone}
          />

          {/* -------- DOCUMENTS -------- */}
          <div className="sm:col-span-2 flex flex-col gap-2">
            <label className="text-gray-600 text-sm font-medium">
              Uploaded Documents
            </label>

            <div className="space-y-1">
              {user.id_document_url && (
                <a
                  href={user.id_document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  View Senior ID
                </a>
              )}

              {user.pwd_document_url && (
                <a
                  href={user.pwd_document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  View PWD Document
                </a>
              )}

              {!user.id_document_url && !user.pwd_document_url && (
                <p className="text-gray-500 text-sm">
                  No documents uploaded.
                </p>
              )}
            </div>
          </div>

          {/* -------- VERIFICATION BADGE -------- */}
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3 pt-4 border-t">
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
    </div>
  );
};

export default ProfileView;
