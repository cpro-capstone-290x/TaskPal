import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import axios from "axios";

// ✅ Create a reliable API base URL that adapts to environment
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://taskpal-14oy.onrender.com/api";

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

const ForgotPasswordUser = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({ loading: false, error: null, success: false });

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus({ loading: false, error: "Passwords do not match.", success: false });
      return;
    }

    setStatus({ loading: true, error: null, success: false });

    try {
      // ✅ Always hit the correct backend URL
      const res = await axios.post(`${API_BASE_URL}/auth/send-reset-otp`, { email });

      if (res.data?.success) {
        // ✅ Store for next step
        localStorage.setItem("resetEmail", email);
        localStorage.setItem("resetPassword", newPassword);

        setStatus({
          loading: false,
          error: null,
          success: true,
        });

        // ⏳ Redirect after 1.5s
        setTimeout(() => navigate("/otp-reset"), 1500);
      } else {
        throw new Error(res.data?.error || "Failed to send OTP");
      }
    } catch (err) {
      console.error("❌ Send reset OTP error:", err);
      setStatus({
        loading: false,
        success: false,
        error:
          err.response?.data?.error ||
          err.message ||
          "Failed to send OTP. Please try again later.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50">
      <Header />
      <div className="max-w-md w-full mx-auto p-8 bg-white shadow-2xl rounded-2xl border border-gray-100">
        <h1 className="text-2xl font-extrabold text-center text-sky-700 mt-4 mb-2">
          Forgot Your Password?
        </h1>
        <p className="text-center text-gray-500 mb-6 leading-relaxed">
          Enter your registered email and your new password. We’ll send a one-time code to verify your identity.
        </p>

        {/* ⚠️ Error Message */}
        {status.error && (
          <div className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl text-center font-semibold mb-4">
            ❌ {status.error}
          </div>
        )}

        {/* ✅ Success Message */}
        {status.success && (
          <div className="p-4 bg-green-50 border border-green-300 text-green-700 rounded-xl text-center font-semibold mb-4 animate-pulse-once">
            ✅ OTP sent successfully! Redirecting...
          </div>
        )}

        {/* 🧾 Form */}
        <form onSubmit={handleSendOTP} className="space-y-6">
          <InputField
            label="Registered Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="john.doe@example.com"
          />
          <InputField
            label="New Password"
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Enter new password"
          />
          <InputField
            label="Confirm Password"
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Re-enter password"
          />

          <button
            type="submit"
            disabled={status.loading}
            className="w-full py-3 bg-sky-600 text-white font-extrabold text-lg rounded-xl shadow-md hover:bg-sky-700 disabled:bg-sky-400 transition"
          >
            {status.loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordUser;
