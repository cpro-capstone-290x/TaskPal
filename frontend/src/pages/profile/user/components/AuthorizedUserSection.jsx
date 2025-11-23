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
      <div
        className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-700"
        aria-live="polite"
      >
        Loading authorized user...
      </div>
    );
  }

  // CASE 1: Authorized user exists
  if (authorizedUser) {
    return (
      <section
        aria-labelledby="authorized-user-title"
        className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
      >
        <h2
          id="authorized-user-title"
          className="text-2xl font-semibold text-gray-800 mb-6"
        >
          Authorized User Details
        </h2>

        {/* USER INFO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "First Name", value: authorizedUser.first_name },
            { label: "Last Name", value: authorizedUser.last_name },
            { label: "Email", value: authorizedUser.email },
            { label: "Phone", value: authorizedUser.phone || "N/A" },
            {
              label: "Relationship",
              value: authorizedUser.relationship,
              full: true,
            },
          ].map((item, index) => (
            <div
              key={index}
              className={item.full ? "md:col-span-2" : ""}
            >
              <label className="block text-sm text-gray-700 mb-1">
                {item.label}
              </label>
              <input
                type="text"
                readOnly
                value={item.value}
                aria-label={item.label}
                className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-800"
              />
            </div>
          ))}
        </div>

        {/* REMOVE BUTTON */}
        <div className="flex justify-end mt-6">
          <button
            aria-label="Remove authorized user"
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
                  alert("Failed to remove authorized user.");
                }
              }
            }}
            className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            Remove Authorized User
          </button>
        </div>
      </section>
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
        alert(res?.error || "Something went wrong");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add authorized user.");
    }
  };

  return (
    <section
      aria-labelledby="add-authorized-title"
      className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
    >
      <h2
        id="add-authorized-title"
        className="text-2xl font-semibold text-gray-800 mb-6"
      >
        Add Authorized User
      </h2>

      <p className="text-gray-700 mb-6 leading-relaxed">
        You can optionally add an <strong>Authorized User</strong> (such as a
        family member, guardian, or assistant) who can help manage your
        bookings, payments, or service tracking.
        <br />
        If you prefer not to add anyone now, you may skip this step.
      </p>

      <form
        className="space-y-4"
        onSubmit={handleSubmit}
        aria-label="Add authorized user form"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              required
              aria-required="true"
              aria-label="Authorized user first name"
              placeholder="Authorized user's first name"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-300 text-gray-800"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              required
              aria-required="true"
              aria-label="Authorized user last name"
              placeholder="Authorized user's last name"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-300 text-gray-800"
            />
          </div>
        </div>

        {/* Email + Relationship */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              aria-required="true"
              aria-label="Authorized user email"
              placeholder="authorized@example.com"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-300 text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Relationship
            </label>
            <input
              type="text"
              name="relationship"
              required
              aria-required="true"
              aria-label="Relationship to authorized user"
              placeholder="e.g., Daughter, Assistant"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-300 text-gray-800"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            name="phone"
            aria-label="Authorized user phone number"
            placeholder="+1 (555) 123-4567"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-300 text-gray-800"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            aria-label="Skip adding authorized user"
            onClick={() => setActiveTab("profile")}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium focus:ring-2 focus:ring-gray-300"
          >
            Skip
          </button>

          <button
            type="submit"
            aria-label="Add authorized user"
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium focus:ring-2 focus:ring-green-300"
          >
            Add Authorized User
          </button>
        </div>
      </form>
    </section>
  );
};

export default AuthorizedUserSection;
