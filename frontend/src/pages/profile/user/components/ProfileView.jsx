// src/pages/profile/User/components/ProfileView.jsx
import React from "react";

const ProfileView = ({ user }) => {
  return (
    <div className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        User Profile
      </h2>

      <div className="space-y-4">
        {/* First Name */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            First Name
          </label>
          <input
            type="text"
            value={user.first_name || ""}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-700 border-gray-200 rounded-lg"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Last Name
          </label>
          <input
            type="text"
            value={user.last_name || ""}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-700 border-gray-200 rounded-lg"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="text"
            value={user.email || ""}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-700 border-gray-200 rounded-lg"
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Date of Birth
          </label>
          <input
            type="text"
            value={
              user.date_of_birth
                ? new Date(user.date_of_birth).toLocaleDateString()
                : "N/A"
            }
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-700 border-gray-200 rounded-lg"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Gender
          </label>
          <input
            type="text"
            value={user.gender || "N/A"}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-700 border-gray-200 rounded-lg"
          />
        </div>

        {/* Assistance Level */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Assistance Level
          </label>
          <input
            type="text"
            value={user.assistance_level || "N/A"}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-700 border-gray-200 rounded-lg"
          />
        </div>

        {/* Living Situation */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Living Situation
          </label>
          <input
            type="text"
            value={user.living_situation || "N/A"}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-700 border-gray-200 rounded-lg"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Address
          </label>
          <textarea
            value={`${user.unit_no || ""} ${user.street || ""}, ${
              user.city || ""
            }, ${user.province || ""}, ${user.postal_code || ""}`}
            readOnly
            rows="3"
            className="w-full px-4 py-2 bg-gray-50 border text-gray-700 border-gray-200 rounded-lg"
          ></textarea>
        </div>

        {/* Emergency Contact Name */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Emergency Contact Name
          </label>
          <input
            type="text"
            value={user.emergency_contact_name || "N/A"}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-700 border-gray-200 rounded-lg"
          />
        </div>

        {/* Emergency Contact Relationship */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Relationship
          </label>
          <input
            type="text"
            value={user.emergency_contact_relationship || "N/A"}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-700 border-gray-200 rounded-lg"
          />
        </div>

        {/* Emergency Contact Phone */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Emergency Contact Phone
          </label>
          <input
            type="text"
            value={user.emergency_contact_phone || "N/A"}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-700 border-gray-200 rounded-lg"
          />
        </div>

        {/* Uploaded Documents */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Uploaded Documents
          </label>

          {user.id_document_url && (
            <a
              href={user.id_document_url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline block mb-2"
            >
              View Senior ID
            </a>
          )}

          {user.pwd_document_url && (
            <a
              href={user.pwd_document_url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline block"
            >
              View PWD Document
            </a>
          )}
        </div>

        {/* Verification */}
        <div className="flex items-center gap-3 mt-2">
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
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
