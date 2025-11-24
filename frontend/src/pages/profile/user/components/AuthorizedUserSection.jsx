// src/pages/profile/User/components/AuthorizedUserSection.jsx
import React, { useState, useEffect } from "react";
import TermsOfAuthorization   from "../../user/components/legal/TermsOfAuthorization";

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
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [permissions, setPermissions] = useState({
    viewProviders: true,
    sendMessages: true,
    makeBookings: false,
    manageBookings: false,
    confirmOrCancel: false,
  });

  const togglePermission = (key) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* ----------------------------------------
   * LOADING STATE
   * ---------------------------------------- */
  if (loading) {
    return (
      <div className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-700">
        Loading authorized user...
      </div>
    );
  }

  // Treat empty object/array/null as NO authorized user
  const normalizedAuthorizedUser =
    authorizedUser &&
    typeof authorizedUser === "object" &&
    Object.keys(authorizedUser).length > 0 &&
    authorizedUser.first_name &&
    authorizedUser.last_name &&
    authorizedUser.email
      ? authorizedUser
      : null;

    


  /* ----------------------------------------
   * CASE 1: AUTHORIZED USER EXISTS
   * ---------------------------------------- */
  if (normalizedAuthorizedUser) {
    return (
      <section
        aria-labelledby="authorized-user-title"
        className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
      >
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
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
            <div key={index} className={item.full ? "md:col-span-2" : ""}>
              <label className="block text-sm text-gray-700 mb-1">
                {item.label}
              </label>
              <input
                type="text"
                readOnly
                value={item.value}
                className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-800"
              />
            </div>
          ))}
        </div>

        {/* REMOVE BUTTON */}
        <div className="flex justify-end mt-6">
          <button
            onClick={async () => {
              if (window.confirm("Remove this authorized user?")) {
                try {
                  await removeAuthorizedUser(authorizedUser.id);
                  await refreshAuthorizedUser();
                  alert("Authorized user removed.");
                } catch (err) {
                  alert("Failed to remove authorized user.");
                }
              }
            }}
            className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition"
          >
            Remove Authorized User
          </button>
        </div>
      </section>
    );
  }

  /* ----------------------------------------
   * CASE 2: AUTHORIZED USER REGISTRATION
   * ---------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!acceptedTerms) {
      alert("You must accept the Terms of Authorization.");
      return;
    }

    const form = e.target;

    const payload = {
      client_id: user.id,
      first_name: form.first_name.value,
      last_name: form.last_name.value,
      email: form.email.value,
      phone: form.phone.value,
      relationship: form.relationship.value,
      password: "Authorized@123",

      // NEW: store permissions from UI
      permissions,
    };

    try {
      const res = await registerAuthorizedUser(payload);

      if (res?.success) {
        alert("OTP sent to authorized user's email.");
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
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Add Authorized User
      </h2>

      <p className="text-gray-700 mb-6 leading-relaxed">
        Add an <strong>Authorized User</strong> who can help manage your TaskPal
        account (bookings, messaging, service tracking).
      </p>


      {/* AUTO-EXPIRATION NOTICE (Section 5) */}
      <p className="text-sm text-gray-600 mb-6">
        <strong>Note:</strong> Authorizations expire automatically in{" "}
        <strong>30 days</strong> unless renewed.
      </p>

      {/* FORM */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              required
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-300"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              required
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-300"
            />
          </div>
        </div>

        {/* EMAIL + RELATIONSHIP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-300"
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
              placeholder="e.g., Daughter, Assistant"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-300"
            />
          </div>
        </div>

        {/* PHONE */}
        <div>
          <label className="block text-sm text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            name="phone"
            placeholder="+1 (555) 123-4567"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-300"
          />
        </div>

              {/* ----------------------------------------
       * TERMS OF AUTHORIZATION (CHECKBOX)
       * ---------------------------------------- */}
      <div className="mb-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={() => setAcceptedTerms(!acceptedTerms)}
          />
          <span className="text-gray-700">
            I have read and accept the{" "}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="text-green-700 underline"
            >
              Terms of Authorization
            </button>
          </span>
        </label>
      </div>

        {/* BUTTONS */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Skip
          </button>

          <button
            type="submit"
            disabled={!acceptedTerms}
            className={`px-4 py-2 rounded-lg text-white font-medium transition ${
              acceptedTerms
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Add Authorized User
          </button>
        </div>
      </form>

      {/* ----------------------------------------
       * TERMS MODAL (FULL TEXT)
       * ---------------------------------------- */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6 relative">
            <h3 className="text-xl font-semibold mb-4">
              Terms of Authorization
            </h3>

            {/* Modular Terms Component */}
            <div className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
              <TermsOfAuthorization />
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTerms(false)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};

export default AuthorizedUserSection;
