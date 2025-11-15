import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProviderTerms from "./ProviderTerms";

const InputField = ({ label, id, type = "text", value, onChange, required = false, placeholder = "" }) => (
  <div className="flex flex-col">
    <label htmlFor={id} className="text-sm font-semibold text-gray-600 mb-1 tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-sky-200 focus:border-sky-500 transition duration-200 ease-in-out shadow-inner placeholder-gray-400 text-black bg-white"
    />
  </div>
);

const RegisterProvider = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    provider_type: "individual",
    service_type: "Cleaning",
    license_id: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    document: null,

    // NEW FIELDS:
    id_type: "",
    id_number: "",
    id_expiry: "",
    valid_id_file: null,
  });

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  const navigate = useNavigate();

  // handle standard inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Supporting document
  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, document: e.target.files[0] }));
  };

  // Valid ID file
  const handleValidIDFile = (e) => {
    setFormData((prev) => ({ ...prev, valid_id_file: e.target.files[0] }));
  };

  // Upload Valid ID through backend
const uploadValidID = async (file) => {
  if (!file) return null;

  const API = `${import.meta.env.VITE_API_URL || "https://taskpal-14oy.onrender.com/api"}/providers/valid-id`;

  // ✅ FIX: Rename this variable
  const uploadFormData = new FormData();
  uploadFormData.append("file", file);

  // ✅ FIX: Now 'formData' refers to your component's state
  uploadFormData.append("name", formData.name);
  uploadFormData.append("id_type", formData.id_type);
  uploadFormData.append("id_number", formData.id_number);

  const response = await fetch(API, {
    method: "POST",
    body: uploadFormData, // ✅ FIX: Use the renamed variable here
  });

  // You can simplify this part now that the URL is fixed
  const data = await response.json().catch(() => {
    // This catch is still good practice in case of a 500 error
    throw new Error("Upload endpoint returned invalid JSON");
  });

  if (!response.ok) {
    throw new Error(data.error || "Upload failed");
  }

  return data.url;
};

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    if (!termsAccepted) {
      setStatus({ loading: false, error: "You must agree to the Terms & Conditions.", success: false });
      return;
    }

    const requiredFields = [
      "name",
      "email",
      "password",
      "confirm_password",
      "provider_type",
      "service_type",
      "license_id",
      "phone",
      "id_type",
      "id_number",
      "id_expiry",
    ];

    const missing = requiredFields.filter((field) => !formData[field]);
    if (missing.length > 0) {
      setStatus({
        loading: false,
        error: `Please fill out all required fields: ${missing.join(", ")}`,
        success: false,
      });
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setStatus({ loading: false, error: "Password and Confirm Password must match.", success: false });
      return;
    }

    // Upload valid ID file first
    let valid_id_url = null;
    try {
      valid_id_url = await uploadValidID(formData.valid_id_file);
    } catch (err) {
      console.error("❌ Failed to upload valid ID:", err);
      setStatus({ loading: false, error: "Failed to upload Valid ID. Please try again.", success: false });
      return;
    }

    const { confirm_password, valid_id_file, ...payload } = {
      ...formData,
      valid_id_url,
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
    };

    const API_ENDPOINT = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/auth/registerProvider`
      : "https://taskpal-14oy.onrender.com/api/auth/registerProvider";

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        setStatus({ loading: false, error: result.error || "Registration failed.", success: false });
        return;
      }

      setStatus({ loading: false, error: null, success: true });

      setFormData({
        name: "",
        provider_type: "individual",
        service_type: "Cleaning",
        license_id: "",
        email: "",
        phone: "",
        password: "",
        confirm_password: "",
        document: null,
        id_type: "",
        id_number: "",
        id_expiry: "",
        valid_id_file: null,
      });

      onSuccess({ email: formData.email });
    } catch (error) {
      console.error("❌ Network error:", error);
      setStatus({
        loading: false,
        error: "Could not connect to server.",
        success: false,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl bg-white shadow-2xl border border-gray-100 rounded-3xl p-8 md:p-10">
        <header className="text-center mb-10 pb-4 border-b border-sky-100">
          <h1 className="text-4xl font-black text-sky-700">Register as a Provider</h1>
          <p className="text-gray-500 text-lg">Join TaskPal and start offering your services.</p>
        </header>

        {status.success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 text-green-700 rounded-xl text-center font-semibold">
            ✅ Registration successful! Check your email for OTP verification.
          </div>
        )}

        {status.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl text-center font-semibold">
            ❌ {status.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* name + provider type */}
          <div className="grid md:grid-cols-2 gap-6">
            <InputField
              label="Full Name / Business Name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                Provider Type <span className="text-red-500">*</span>
              </label>
              <select
                name="provider_type"
                value={formData.provider_type}
                onChange={handleChange}
                required
                className="p-3 border border-gray-300 rounded-xl bg-white"
              >
                <option value="individual">Individual</option>
                <option value="company">Company / Business</option>
              </select>
            </div>
          </div>

          {/* service type + license */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">Service Type *</label>
              <select
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                required
                className="p-3 border border-gray-300 rounded-xl bg-white"
              >
                <option value="Moving">Moving</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Gardening">Gardening</option>
              </select>
            </div>

            <InputField
              label="License / Certification ID"
              id="license_id"
              value={formData.license_id}
              onChange={handleChange}
              required
            />
          </div>

          {/* emails and phone */}
          <div className="grid md:grid-cols-2 gap-6">
            <InputField label="Email" id="email" type="email" value={formData.email} onChange={handleChange} required />

            <InputField label="Phone Number" id="phone" value={formData.phone} onChange={handleChange} required />
          </div>

          {/* password */}
          <div className="grid md:grid-cols-2 gap-6">
            <InputField label="Password" id="password" type="password" value={formData.password} onChange={handleChange} required />

            <InputField label="Confirm Password" id="confirm_password" type="password" value={formData.confirm_password} onChange={handleChange} required />
          </div>

          {/* supporting document */}
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-1">Supporting Document (Optional)</label>
            <input type="file" onChange={handleFileChange} className="w-full p-3 border rounded-xl bg-white" />
          </div>

          {/* VALID ID SECTION */}
          <div className="p-4 border border-gray-300 rounded-xl bg-gray-50">
            <h2 className="text-lg font-semibold mb-3 text-gray-700">Valid Government ID</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <InputField
                label="ID Type"
                id="id_type"
                value={formData.id_type}
                onChange={handleChange}
                required
                placeholder="Driver’s License, Passport, etc."
              />

              <InputField
                label="ID Number"
                id="id_number"
                value={formData.id_number}
                onChange={handleChange}
                required
                placeholder="e.g., DL-123-456-789"
              />
            </div>

            <InputField
              label="Expiry Date"
              id="id_expiry"
              type="date"
              value={formData.id_expiry}
              onChange={handleChange}
              required
            />

            <label className="text-sm font-semibold text-gray-600 mt-3 mb-1">Upload Valid ID (Image/PDF) *</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleValidIDFile}
              className="w-full p-3 border border-gray-300 rounded-xl bg-white"
              required
            />
          </div>

          {/* TERMS */}
          <div className="flex items-center gap-3 pt-4">
            <input
              type="checkbox"
              className="w-5 h-5 cursor-pointer"
              checked={termsAccepted}
              onChange={() => {
                if (!termsAccepted) setShowTermsModal(true);
                else setTermsAccepted(false);
              }}
            />
            <span className="text-gray-700 text-sm cursor-pointer" onClick={() => setShowTermsModal(true)}>
              I agree to the <span className="text-sky-600 underline">Terms & Conditions</span>
            </span>
          </div>

          <button
            type="submit"
            disabled={status.loading}
            className="w-full py-3 mt-6 bg-sky-600 text-white font-extrabold text-lg rounded-xl shadow-lg hover:bg-sky-700"
          >
            {status.loading ? "Registering..." : "Complete Registration"}
          </button>
        </form>
      </div>

      <ProviderTerms
        open={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAgree={() => {
          setTermsAccepted(true);
          setShowTermsModal(false);
        }}
      />
    </div>
  );
};

export default RegisterProvider;
