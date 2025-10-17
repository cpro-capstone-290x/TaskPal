import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


const OTPResetPage = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState({ loading: false, error: null, success: false });

  const email = localStorage.getItem("resetEmail");
  const newPassword = localStorage.getItem("resetPassword");

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!email || !newPassword) {
      setStatus({ loading: false, error: "Missing email or password info.", success: false });
      return;
    }

    setStatus({ loading: true, error: null, success: false });

    try {
      // Step 1: Verify OTP
      const verifyRes = await fetch("http://localhost:5000/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Invalid OTP");

      // Step 2: Update password
      const updateRes = await fetch("http://localhost:5000/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) throw new Error(updateData.error || "Failed to update password");

      // ✅ Success
      setStatus({ loading: false, success: true, error: null });
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("resetPassword");

      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setStatus({ loading: false, success: false, error: err.message });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8 bg-white shadow-2xl rounded-2xl border border-gray-100">
        <h1 className="text-2xl font-extrabold text-center text-sky-700 mt-4 mb-2">
          Verify OTP
        </h1>
        <p className="text-center text-gray-500 mb-6 leading-relaxed">
          Enter the 6-digit OTP sent to your registered email.
        </p>

        {status.error && (
          <div className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl text-center font-semibold mb-4">
            ❌ {status.error}
          </div>
        )}
        {status.success && (
          <div className="p-4 bg-green-50 border border-green-300 text-green-700 rounded-xl text-center font-semibold mb-4 animate-pulse-once">
            ✅ Password updated successfully! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-600 mb-1 tracking-wide">
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
              required
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-sky-200 focus:border-sky-500 text-black bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={status.loading}
            className="w-full py-3 bg-sky-600 text-white font-extrabold text-lg rounded-xl shadow-md hover:bg-sky-700 disabled:bg-sky-400 transition"
          >
            {status.loading ? "Verifying..." : "Verify & Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OTPResetPage;
