import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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
  });

  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  const navigate = useNavigate();

  // handle field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // handle file upload
  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, document: e.target.files[0] }));
  };

  // submit registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    // client-side validation
    const requiredFields = ["name", "email", "password", "confirm_password", "provider_type", "service_type", "license_id", "phone"];
    const missing = requiredFields.filter((field) => !formData[field]);
    if (missing.length > 0) {
      setStatus({ loading: false, error: `Please fill out all required fields: ${missing.join(", ")}`, success: false });
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setStatus({ loading: false, error: "Password and Confirm Password must match.", success: false });
      return;
    }

    const { confirm_password, ...payload } = formData;
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
        const errorMessage = result.error || "Registration failed due to an unknown error.";
        setStatus({ loading: false, error: errorMessage, success: false });
        return;
      }

      // success handling
      setStatus({ loading: false, error: null, success: true });
      console.log("✅ Provider registered successfully:", result.data);

      // clear form
      setFormData({
        name: "",
        provider_type: "individual",
        service_type: "cleaning",
        license_id: "",
        email: "",
        phone: "",
        password: "",
        confirm_password: "",
        document: null,
      });

      // ✅ redirect to OTP (same behavior as RegisterUser)
      onSuccess({ email: formData.email });

    } catch (error) {
      console.error("❌ Network error:", error);
      setStatus({
        loading: false,
        error: "Could not connect to the server. Please check your connection.",
        success: false,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl bg-white shadow-2xl hover:shadow-3xl border border-gray-100 rounded-3xl p-8 md:p-10 transition-all duration-500">
        <header className="text-center mb-10 pb-4 border-b border-sky-100">
          <h1 className="text-4xl font-black text-sky-700 mb-1 tracking-tight">Register as a Provider</h1>
          <p className="text-gray-500 font-medium text-lg">Join TaskPal and start offering your services.</p>
        </header>

        {/* status messages */}
        {status.success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 text-green-700 rounded-xl text-center font-semibold animate-pulse-once">
            ✅ Registration successful! Check your email for OTP verification.
          </div>
        )}
        {status.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl text-center font-semibold">
            ❌ Error: {status.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <InputField
              label="Full Name / Business Name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Jane Smith or ABC Cleaning Services"
            />
            <div className="flex flex-col">
              <label htmlFor="provider_type" className="text-sm font-semibold text-gray-600 mb-1">
                Provider Type <span className="text-red-500">*</span>
              </label>
              <select
                id="provider_type"
                name="provider_type"
                value={formData.provider_type}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-4 focus:ring-sky-200 focus:border-sky-500 shadow-inner text-gray-800"
              >
                <option value="individual">Individual</option>
                <option value="company">Company / Business</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label htmlFor="service_type" className="text-sm font-semibold text-gray-600 mb-1">
                Service Type <span className="text-red-500">*</span>
              </label>
              <select
                id="service_type"
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-4 focus:ring-sky-200 focus:border-sky-500 shadow-inner text-gray-800"
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
              placeholder="e.g., ABC12345"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <InputField
              label="Email Address"
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="provider@taskpal.com"
            />
            <InputField
              label="Phone Number"
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="(555) 555-5555"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <InputField
              label="Password"
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Min 8 characters"
            />
            <InputField
              label="Confirm Password"
              id="confirm_password"
              type="password"
              value={formData.confirm_password}
              onChange={handleChange}
              required
              placeholder="Re-enter password"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="document" className="text-sm font-semibold text-gray-600 mb-1 tracking-wide">
              Supporting Document (Optional)
            </label>
            <input
              type="file"
              id="document"
              name="document"
              onChange={handleFileChange}
              className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-4 focus:ring-sky-200 focus:border-sky-500 transition duration-200 ease-in-out shadow-inner file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
            />
          </div>

          <button
            type="submit"
            disabled={status.loading}
            className="w-full py-3 mt-6 bg-sky-600 text-white font-extrabold text-lg rounded-xl shadow-lg shadow-sky-300/50 hover:bg-sky-700 disabled:bg-sky-400 transition-all duration-300 ease-in-out transform hover:scale-[1.01] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-sky-500 focus:ring-opacity-70"
          >
            {status.loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Registering...
              </div>
            ) : (
              "Complete Registration"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterProvider;
