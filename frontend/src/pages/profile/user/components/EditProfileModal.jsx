// src/pages/profile/User/components/EditProfileModal.jsx
import React, { useEffect, useState } from "react";

const EditProfileModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    unit_no: "",
    street: "",
    city: "",
    province: "",
    postal_code: "",
    password: "",
  });

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      unit_no: user.unit_no || "",
      street: user.street || "",
      city: user.city || "",
      province: user.province || "",
      postal_code: user.postal_code || "",
      password: "",
    }));
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = async () => {
    try {
      await onSave(formData);
      alert("Profile updated successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Failed to update profile.");
    }
  };

  const emailChanged = formData.email !== user.email;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl">
        <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "First Name", name: "first_name" },
            { label: "Last Name", name: "last_name" },
            { label: "Email", name: "email", type: "email" },
            { label: "Unit #", name: "unit_no" },
            { label: "Street", name: "street" },
            { label: "City", name: "city" },
            { label: "Province", name: "province" },
            { label: "Postal Code", name: "postal_code" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm text-gray-600 mb-1">
                {field.label}
              </label>
              <input
                type={field.type || "text"}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          ))}

          {emailChanged && (
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password to confirm email change"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
