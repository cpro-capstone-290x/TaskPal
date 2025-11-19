// src/pages/profile/User/components/AuthorizedUserSection.jsx
import React from "react";

const AuthorizedUserSection = ({
  user,
  authorizedUser,
  loading,
  registerAuthorizedUser,
  removeAuthorizedUser,
  refreshAuthorizedUser,
  navigate,
  setActiveTab,
}) => {
  if (loading) {
    return (
      <div className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
        Loading authorized user...
      </div>
    );
  }

  // CASE 1: Authorized user exists
  if (authorizedUser) {
    return (
      <div className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Authorized User Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={authorizedUser.first_name}
              readOnly
              className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={authorizedUser.last_name}
              readOnly
              className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={authorizedUser.email}
              readOnly
              className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={authorizedUser.phone || "N/A"}
              readOnly
              className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">
              Relationship
            </label>
            <input
              type="text"
              value={authorizedUser.relationship}
              readOnly
              className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={async () => {
              if (
                window.confirm(
                  "Are you sure you want to remove this authorized user?"
                )
              ) {
                try {
                  await removeAuthorizedUser(authorizedUser.id);
                  await refreshAuthorizedUser();
                  alert("Authorized user removed.");
                } catch (err) {
                  console.error("Error removing authorized user:", err);
                  alert("Failed to remove authorized user.");
                }
              }
            }}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
          >
            Remove Authorized User
          </button>
        </div>
      </div>
    );
  }

  // CASE 2: No authorized user → registration form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;

    const payload = {
      client_id: user.id,
      first_name: form.first_name.value,
      last_name: form.last_name.value,
      email: form.email.value,
      phone: form.phone.value,
      relationship: form.relationship.value,
      password: "Authorized@123",
    };

    try {
      const res = await registerAuthorizedUser(payload);

      if (res?.success) {
        alert("OTP sent to the authorized user's email!");
        navigate(`/verify-authorized?email=${payload.email}`);
      } else {
        alert(res?.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Error adding authorized user:", err);
      alert(err.response?.data?.error || "Failed to add authorized user.");
    }
  };

  return (
    <div className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Add Authorized User
      </h2>

      <p className="text-gray-600 mb-6 leading-relaxed">
        You can optionally add an <strong>Authorized User</strong> (such as a
        family member, guardian, or assistant) who can help manage your
        bookings, payments, or service tracking.
        <br />
        If you prefer to keep your account private, simply skip this step.
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              required
              placeholder="Authorized user's first name"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-200"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              required
              placeholder="Authorized user's last name"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              placeholder="authorized@example.com"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-200"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Relationship
            </label>
            <input
              type="text"
              name="relationship"
              required
              placeholder="e.g., Daughter, Assistant"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Phone</label>
          <input
            type="tel"
            name="phone"
            placeholder="+1 (555) 123-4567"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-200"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
          >
            Skip
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            Add Authorized User
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuthorizedUserSection;
