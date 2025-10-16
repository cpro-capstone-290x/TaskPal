import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';

// ✅ Reusable InputField (same as in LoginUser for consistency)
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

const ForgotPasswordUser = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    const API_ENDPOINT = 'http://localhost:5000/api/auth/forgot-password'; // ✅ Adjust to your backend route

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      console.log("🔍 Forgot Password Response:", result);

      if (!response.ok) {
        const message = result.error || 'Email not found. Please check and try again.';
        setStatus({ loading: false, error: message, success: false });
        return;
      }

      // ✅ Success feedback
      setStatus({
        loading: false,
        error: null,
        success: true,
      });

      // Optional: redirect after few seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error("Network or unexpected error:", error);
      setStatus({
        loading: false,
        error: "Could not connect to the server. Please check your connection.",
        success: false,
      });
    }
  };

return (
  <div className="min-h-screen flex flex-col justify-center bg-gray-50">
    <div className="max-w-md w-full mx-auto p-8 bg-white shadow-2xl rounded-2xl border border-gray-100">

      {/* 🔹 Page Title */}
      <h1 className="text-2xl font-extrabold text-center text-sky-700 mt-4 mb-2">
        Forgot Your Password?
      </h1>
      <p className="text-center text-gray-500 mb-6 leading-relaxed">
        Enter your registered email address and we’ll send you instructions to reset your password.
      </p>

      {/* 🔹 Status Messages */}
      {status.success && (
        <div className="p-4 bg-green-50 border border-green-300 text-green-700 rounded-xl text-center font-semibold mb-4 animate-pulse-once">
          ✅ Password reset link sent! Please check your email.
        </div>
      )}
      {status.error && (
        <div className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl text-center font-semibold mb-4">
          ❌ {status.error}
        </div>
      )}

      {/* 🔹 Forgot Password Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField
          label="Email Address"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="john.doe@example.com"
        />

        <button
          type="submit"
          disabled={status.loading}
          className="w-full py-3 bg-sky-600 text-white font-extrabold text-lg rounded-xl shadow-md shadow-sky-300/50 hover:bg-sky-700 disabled:bg-sky-400 transition-all duration-300 ease-in-out transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-sky-500 focus:ring-opacity-70"
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
              Sending...
            </div>
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>

      {/* 🔹 Footer Navigation */}
      <div className="text-center pt-6">
        <p className="text-sm text-gray-600">
          Remember your password?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-sky-600 font-semibold hover:underline focus:outline-none"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  </div>
);

};

export default ForgotPasswordUser;
