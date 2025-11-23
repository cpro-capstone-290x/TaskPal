// src/pages/profile/Provider/components/ProviderProfile.jsx
import React from "react";
import { CheckCircle, Clock } from "lucide-react";

/* ---------------------- Image Optimization Helper ---------------------- */
const getOptimizedImageUrls = (url) => {
  if (!url) {
    return { avif: "", webp: "", fallback: "" };
  }

  const hasQuery = url.includes("?");
  const sep = hasQuery ? "&" : "?";

  return {
    avif: `${url}${sep}format=avif&w=300&q=70`,
    webp: `${url}${sep}format=webp&w=300&q=70`,
    fallback: `${url}${sep}w=300&q=80`,
  };
};

/* ---------------------- Reusable Field ---------------------- */
const ProfileField = ({
  label,
  id,
  value,
  readOnly = true,
  type = "text",
  onChange,
}) => (
  <div>
    <label
      htmlFor={id}
      className="block text-gray-700 text-sm font-medium mb-1"
    >
      {label}
    </label>

    <input
      id={id}
      name={id}
      type={type}
      readOnly={readOnly}
      value={value || ""}
      onChange={onChange}
      className={`w-full px-4 py-2 border rounded-lg ${
        readOnly
          ? "bg-gray-50 text-gray-800 border-gray-200"
          : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
      }`}
    />
  </div>
);

/* ---------------------- Skeleton Loader ---------------------- */
export const ProviderProfileSkeleton = () => (
  <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-100 animate-pulse">
    <div className="h-8 w-40 bg-gray-200 rounded mb-6" />
    <div className="flex flex-col items-center text-center gap-4 mb-8">
      <div className="w-28 h-28 rounded-full bg-gray-200" />
      <div className="h-4 w-48 bg-gray-200 rounded" />
      <div className="h-3 w-24 bg-gray-200 rounded" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 10 }).map((_, idx) => (
        <div key={idx} className="h-10 bg-gray-200 rounded" />
      ))}
    </div>
  </div>
);

/* ---------------------- Provider Profile Component ---------------------- */
const ProviderProfile = ({
  provider,
  formData,
  isEditing,
  isSaving,
  isUploading,
  saveMessage,
  onEditStart,
  onCancelEdit,
  onSaveSubmit,
  onFieldChange,
  newProfilePicture,
  setNewProfilePicture,
  onConfirmUpload,
}) => {
  const profileImageUrl =
    formData.profile_picture_url || provider.profile_picture_url || "";
  const optimizedImage = getOptimizedImageUrls(profileImageUrl);
  const providerName = provider.name || "Provider";

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      {/* ---------------------- Header ---------------------- */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Provider <span className="text-indigo-700">Dashboard</span>
        </h2>

        {!isEditing ? (
          <button
            onClick={onEditStart}
            className="px-4 py-2 bg-blue-700 text-white rounded-lg shadow hover:bg-blue-800 transition"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isSaving || isUploading}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm hover:bg-gray-300 transition disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="provider-profile-form"
              disabled={isSaving || isUploading}
              className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 transition disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* ---------------------- Save Message ---------------------- */}
      {saveMessage?.message && (
        <div
          className={`p-3 mb-4 rounded-lg text-sm ${
            saveMessage.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {saveMessage.message}
        </div>
      )}

      {/* ---------------------- Profile Picture + Upload ---------------------- */}
      <div className="flex flex-col items-center text-center gap-4 mb-8">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
          {profileImageUrl ? (
            <picture>
              {optimizedImage.avif && (
                <source srcSet={optimizedImage.avif} type="image/avif" />
              )}
              {optimizedImage.webp && (
                <source srcSet={optimizedImage.webp} type="image/webp" />
              )}
              <img
                src={optimizedImage.fallback || profileImageUrl}
                alt={`${providerName} profile photo`}
                loading="lazy"
                decoding="async"
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </picture>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
              No photo
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {providerName}
          </h3>
          <p className="text-gray-600 capitalize">
            {provider.provider_type || "Service Provider"}
          </p>
        </div>

        {isEditing && (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <input
              type="file"
              id="provider-profile-pic"
              className="hidden"
              accept="image/*"
              onChange={(e) => setNewProfilePicture(e.target.files[0])}
            />

            <button
              type="button"
              onClick={() =>
                document.getElementById("provider-profile-pic").click()
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
            >
              Change Profile Photo
            </button>

            {newProfilePicture && (
              <button
                type="button"
                onClick={onConfirmUpload}
                className="px-4 py-2 bg-indigo-700 text-white rounded-lg text-sm hover:bg-indigo-800 transition disabled:opacity-60"
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Confirm Upload"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ---------------------- Editable Fields ---------------------- */}
      <form id="provider-profile-form" onSubmit={onSaveSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <ProfileField
            id="business_name"
            label="Business Name"
            value={isEditing ? formData.name : provider.name}
            readOnly={!isEditing}
            onChange={(e) => onFieldChange("name", e.target.value)}
          />

          <ProfileField
            id="provider_type"
            label="Provider Type"
            value={isEditing ? formData.provider_type : provider.provider_type}
            readOnly={!isEditing}
            onChange={(e) => onFieldChange("provider_type", e.target.value)}
          />

          <ProfileField
            id="service_type"
            label="Service Type"
            value={isEditing ? formData.service_type : provider.service_type}
            readOnly={!isEditing}
            onChange={(e) => onFieldChange("service_type", e.target.value)}
          />

          {/* Pricing Section */}
          <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Service Pricing (CAD)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                {/* FIX: Added htmlFor */}
                <label 
                  htmlFor="min_price" 
                  className="block text-gray-700 text-sm font-medium mb-1"
                >
                  Minimum Price ($)
                </label>
                {/* FIX: Added id */}
                <input
                  id="min_price"
                  type={isEditing ? "number" : "text"}
                  min="0"
                  step="0.01"
                  readOnly={!isEditing}
                  value={
                    isEditing
                      ? formData.min_price || ""
                      : provider.min_price || ""
                  }
                  onChange={(e) => onFieldChange("min_price", e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-4 py-2 border rounded-lg ${
                    !isEditing
                      ? "bg-gray-50 text-gray-800 border-gray-200"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  }`}
                />
              </div>

              <div>
                {/* FIX: Added htmlFor */}
                <label 
                  htmlFor="max_price"
                  className="block text-gray-700 text-sm font-medium mb-1"
                >
                  Maximum Price ($)
                </label>
                {/* FIX: Added id */}
                <input
                  id="max_price"
                  type={isEditing ? "number" : "text"}
                  min="0"
                  step="0.01"
                  readOnly={!isEditing}
                  value={
                    isEditing
                      ? formData.max_price || ""
                      : provider.max_price || ""
                  }
                  onChange={(e) => onFieldChange("max_price", e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-4 py-2 border rounded-lg ${
                    !isEditing
                      ? "bg-gray-50 text-gray-800 border-gray-200"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  }`}
                />
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              * Set a range to give customers an idea of your costs per hour or
              per job.
            </p>
          </div>

          <div className="md:col-span-2">
            <ProfileField
              id="email" // FIX: Was missing
              label="Email"
              type="email"
              value={isEditing ? formData.email : provider.email}
              readOnly={!isEditing}
              onChange={(e) => onFieldChange("email", e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            {/* FIX: Added htmlFor */}
            <label 
              htmlFor="bio_note"
              className="block text-gray-700 text-sm font-medium mb-1"
            >
              Personal Note / Bio
            </label>
            {/* FIX: Added id */}
            <textarea
              id="bio_note"
              readOnly={!isEditing}
              rows="5"
              value={isEditing ? formData.note || "" : provider.note}
              onChange={(e) => onFieldChange("note", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg ${
                isEditing
                  ? "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  : "bg-gray-50 text-gray-800 border-gray-200"
              }`}
            />
          </div>

          <ProfileField
            id="phone_number" // FIX: Was missing
            label="Phone Number"
            type="tel"
            value={isEditing ? formData.phone : provider.phone}
            readOnly={!isEditing}
            onChange={(e) => onFieldChange("phone", e.target.value)}
          />

          <div>
            {/* FIX: Added htmlFor */}
            <label 
              htmlFor="rating_display"
              className="block mb-1 text-gray-700 text-sm font-medium"
            >
              Rating
            </label>
            {/* FIX: Added id */}
            <input
              id="rating_display"
              type="text"
              readOnly
              value={
                provider.rating ? `${provider.rating} ★` : "No ratings yet"
              }
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800"
            />
          </div>

          {/* VALID ID */}
          <div className="md:col-span-2 mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Valid Government ID
            </h3>

            <ProfileField
              id="id_type" // FIX: Was missing
              label="ID Type"
              value={isEditing ? formData.id_type : provider.id_type}
              readOnly={!isEditing}
              onChange={(e) => onFieldChange("id_type", e.target.value)}
            />

            <ProfileField
              id="id_number" // FIX: Was missing
              label="ID Number"
              value={isEditing ? formData.id_number : provider.id_number}
              readOnly={!isEditing}
              onChange={(e) => onFieldChange("id_number", e.target.value)}
            />

            <ProfileField
              id="id_expiry" // FIX: Was missing
              label="ID Expiry"
              type="date"
              value={isEditing ? formData.id_expiry : provider.id_expiry}
              readOnly={!isEditing}
              onChange={(e) => onFieldChange("id_expiry", e.target.value)}
            />

            {provider.valid_id_url && (
              <a
                href={provider.valid_id_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-800 underline text-sm inline-block mt-2"
              >
                View Uploaded Valid ID
              </a>
            )}
          </div>

          {/* BACKGROUND CHECK */}
          <div className="md:col-span-2 mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Background Check
            </h3>

            {provider.background_check_url ? (
              <a
                href={provider.background_check_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-800 underline text-sm"
              >
                View Background Check Document
              </a>
            ) : (
              <p className="text-gray-600 text-sm">
                No background check uploaded.
              </p>
            )}
          </div>

          {/* INSURANCE */}
          <div className="md:col-span-2 mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Insurance Information
            </h3>

            <ProfileField
              id="insurance_provider" // FIX: Was missing
              label="Insurance Provider"
              value={
                isEditing
                  ? formData.insurance_provider
                  : provider.insurance_provider
              }
              readOnly={!isEditing}
              onChange={(e) =>
                onFieldChange("insurance_provider", e.target.value)
              }
            />

            <ProfileField
              id="insurance_policy" // FIX: Was missing
              label="Policy Number"
              value={
                isEditing
                  ? formData.insurance_policy_number
                  : provider.insurance_policy_number
              }
              readOnly={!isEditing}
              onChange={(e) =>
                onFieldChange("insurance_policy_number", e.target.value)
              }
            />

            <ProfileField
              id="insurance_expiry" // FIX: Was missing
              label="Insurance Expiry"
              type="date"
              value={
                isEditing
                  ? formData.insurance_expiry
                  : provider.insurance_expiry
              }
              readOnly={!isEditing}
              onChange={(e) =>
                onFieldChange("insurance_expiry", e.target.value)
              }
            />

            {provider.insurance_document_url && (
              <a
                href={provider.insurance_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-800 underline text-sm mt-2 inline-block"
              >
                View Insurance Document
              </a>
            )}
          </div>

          {/* COMPANY DOCS */}
          {provider.provider_type === "company" && (
            <div className="md:col-span-2 mt-6 border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Company Documents
              </h3>

              {provider.company_documents &&
              provider.company_documents.length > 0 ? (
                <ul className="space-y-2">
                  {provider.company_documents.map((doc, idx) => (
                    <li key={idx}>
                      <a
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-800 underline text-sm"
                      >
                        Document {idx + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 text-sm">
                  No company documents uploaded.
                </p>
              )}
            </div>
          )}

          {/* STATUS + JOIN DATE */}
          <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-4 border-t">
            {provider.status === "Approved" ? (
              <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
                <CheckCircle size={16} /> Verified &amp; Approved
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-1">
                <Clock size={16} /> Status: {provider.status || "Pending"}
              </span>
            )}

            <span className="text-gray-700 text-sm">
              Joined on{" "}
              {new Date(provider.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProviderProfile;