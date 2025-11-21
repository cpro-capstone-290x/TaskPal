// src/pages/Admin/AdminLoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Reusable InputField (Copied from reference to maintain style consistency)
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

const AdminLoginPage = () => {
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

    // 1. Define Admin Endpoint
    const API_ENDPOINT = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/auth/loginAdmin`
      : "https://taskpal-14oy.onrender.com/api/auth/loginAdmin";

    try {
      // 2. Switch to Fetch
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      // 3. Handle Error Response
      if (!response.ok) {
        const errorMessage = result.error || 'Admin login failed. Check credentials.';
        setStatus({ loading: false, error: errorMessage, success: false });
        return;
      }

      // 4. Extract Data (Handling the nested .data structure if your backend does that)
      // Based on your previous axios code: response.data.data contains { token, admin }
      // With fetch: result.data contains { token, admin }
      const data = result.data || result; 
      const { token, admin } = data;

      if (!token) {
        throw new Error("Token missing in response");
      }

      // 5. Store Admin Tokens Securely
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(admin));

      setStatus({ loading: false, error: null, success: true });

      // 6. Redirect to Admin Dashboard
      setTimeout(() => {
        navigate('/admin');
      }, 1000);

    } catch (error) {
      console.error("Admin Login Error:", error);
      setStatus({
        loading: false,
        error: error.message || "Could not connect to server.",
        success: false,
      });
    }
  };

  return (
    // Wrapper to center the login box on the page
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800">Admin Portal</h2>
          <p className="text-gray-500 mt-2">Please sign in to manage the system</p>
        </div>

        <div className="space-y-6">
          {/* Status Messages */}
          {status.success && (
            <div className="p-4 bg-green-50 border border-green-300 text-green-700 rounded-xl text-center font-semibold animate-pulse-once">
              ✅ Login Successful! Redirecting...
            </div>
          )}

          {status.error && (
            <div className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl text-center font-semibold">
              ❌ {status.error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField
              label="Admin Email"
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="admin@taskpal.com"
            />

            <InputField
              label="Password"
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />

            {/* Submit Button */}
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
                  Verifying...
                </div>
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;