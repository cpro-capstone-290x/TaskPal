import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ✅ Reusable InputField component
const InputField = ({ label, id, type = 'text', value, onChange, required = false, placeholder = '' }) => (
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

const LoginProvider = ({ onSuccess }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    const API_ENDPOINT = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/auth/loginProvider`
      : "https://taskpal-14oy.onrender.com/api/auth/loginProvider";

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      console.log("🔍 Full login response:", result);

      if (!response.ok) {
        const errorMessage =
          result.error || 'Login failed. Please check your email and password.';
        setStatus({ loading: false, error: errorMessage, success: false });
        return;
      }

      // ✅ Extract Provider ID and Token correctly
      const providerId = result.data?.provider?.id;
      const token = result.data?.token;

      if (!providerId || !token) {
        console.error('Unexpected server response:', result);
        setStatus({
          loading: false,
          error: 'Unexpected server response. Missing provider ID or token.',
          success: false,
        });
        return;
      }

      /* ------------------------------------------------------- */
      /* ✅ STORE TOKENS — STANDARDIZED FOR WHOLE APP            */
      /* ------------------------------------------------------- */

      // 🔥 Main token key (used by ExecutionPage, chat, bookings)
      localStorage.setItem('token', token);

      // 🔥 Backup (your older pages use these names)
      localStorage.setItem('authToken', token);
      localStorage.setItem('provider_token', token);

      // 🔥 Store providerId under a consistent key
      localStorage.setItem('providerId', providerId);

      // For compatibility with older pages using userId
      localStorage.setItem('userId', providerId);

      // 🔥 Store role so role-based routing works
      localStorage.setItem('userRole', 'provider');


      /* ------------------------------------------------------- */
      /* END STORAGE FIXES                                       */
      /* ------------------------------------------------------- */

      setStatus({ loading: false, error: null, success: true });
      console.log('✅ Provider logged in successfully:', result.data);

      // Check for redirect before login
      const pendingRedirect = localStorage.getItem("pendingRedirect");

      if (pendingRedirect) {
        localStorage.removeItem("pendingRedirect");
      }

      // Redirect logic
      setTimeout(() => {
        if (pendingRedirect) {
          navigate(pendingRedirect);
        } else {
          navigate(`/profileProvider/${providerId}`);
        }
      }, 1000);

    } catch (error) {
      console.error('Network or unexpected error:', error);
      setStatus({
        loading: false,
        error:
          'Could not connect to the server. Please check your connection or try again later.',
        success: false,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {status.success && (
        <div className="p-4 bg-green-50 border border-green-300 text-green-700 rounded-xl text-center font-semibold animate-pulse-once">
          ✅ Login Successful! Redirecting to your dashboard...
        </div>
      )}
      {status.error && (
        <div className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl text-center font-semibold">
          ❌ Error: {status.error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField
          label="Email Address"
          id="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="provider@service.com"
        />

        <InputField
          label="Password"
          id="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          placeholder="Your secure password"
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={status.loading}
          // Changed bg-sky-600 -> bg-sky-700
          // Changed hover:bg-sky-700 -> hover:bg-sky-800
          className="w-full py-3 mt-6 bg-sky-700 text-white font-extrabold text-lg rounded-xl shadow-lg shadow-sky-300/50 hover:bg-sky-800 disabled:bg-sky-400 transition-all duration-300 ease-in-out transform hover:scale-[1.01] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-sky-500 focus:ring-opacity-70"
        >
          {status.loading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Logging In...
            </div>
          ) : (
            'Log In to Provider Dashboard'
          )}
        </button>
      </form>

      {/* Forgot Password */}
      <div className="text-center pt-2">
        <a
          href="/forgot-password"
          className="text-sm text-gray-500 hover:text-sky-600 transition font-medium"
        >
          Forgot Password?
        </a>
      </div>
    </div>
  );
};

export default LoginProvider;
