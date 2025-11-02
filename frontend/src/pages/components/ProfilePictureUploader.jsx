import React, { useState } from "react";
import api from "../../api";

const ProfilePictureUploader = ({ user, onUpdate }) => {
  const [preview, setPreview] = useState(user.profile_picture || "");
  const [uploading, setUploading] = useState(false);

const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploading(true);

  try {
    // ✅ Preview locally
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // ✅ Prepare FormData
    const formData = new FormData();
    formData.append("file", file);

    // ✅ Send directly to backend
    const res = await api.post(`/users/${user.id}/profile-picture`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data.success) {
      onUpdate(res.data.blobUrl);
      alert("Profile picture uploaded successfully!");
    } else {
      alert("Upload failed. Please try again.");
    }
  } catch (err) {
    console.error("❌ Upload error:", err);
    alert("Upload failed. Please try again.");
  } finally {
    setUploading(false);
  }
};


  return (
    <div className="flex flex-col items-center relative group">
      <img
        src={
          preview || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
        }
        alt="Profile"
        className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover"
      />

      {/* Upload Button */}
      <label
        htmlFor="file-upload"
        className="absolute bottom-0 right-0 bg-green-600 text-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 cursor-pointer transition"
        title="Change Profile Picture"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.232 5.232l3.536 3.536M9 13l6.768-6.768a2.121 2.121 0 013 3L12 16H9v-3z"
          />
        </svg>
      </label>

      <input
        id="file-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {uploading && (
        <p className="text-sm text-gray-500 mt-2">Uploading...</p>
      )}
    </div>
  );
};

export default ProfilePictureUploader;
