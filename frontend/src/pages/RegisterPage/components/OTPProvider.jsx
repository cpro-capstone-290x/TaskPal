import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OTPProvider = ({ userData, onSuccess, onBack }) => {
  const navigate = useNavigate();

  // ✅ Fallback if email is lost on refresh
  const savedEmail =
    userData?.email || new URLSearchParams(window.location.search).get("email");
  const email = savedEmail?.trim();

  // ✅ Endpoint for provider verification
  const API_ENDPOINT = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/auth/verifyProvider`
    : "https://taskpal-14oy.onrender.com/api/auth/verifyProvider";

  // ✅ OTP + Status state
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
    message: `A 6-digit OTP has been sent to ${email}.`,
  });

  const otpFields = Array(6).fill(null);

  useEffect(() => {
    console.log("📩 OTP Verification Initialized for Provider:");
    console.log("➡️ API Endpoint:", API_ENDPOINT);
    console.log("➡️ Email:", email);
  }, [email]);

  const handleOtpChange = (e, index) => {
    const value = e.target.value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input field
    if (value && index < otpFields.length - 1) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");

    console.log("📨 Attempting OTP verification...");
    console.log("➡️ API Endpoint:", API_ENDPOINT);
    console.log("➡️ Email:", email);
    console.log("➡️ OTP Code:", otpCode);
    console.log("➡️ Role: provider");

    if (otpCode.length !== 6) {
      setStatus({
        loading: false,
        error: "Please enter the complete 6-digit code.",
        success: false,
      });
      return;
    }

    setStatus({
      loading: true,
      error: null,
      success: false,
      message: "Verifying OTP...",
    });

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp: otpCode, role: "provider" }),
      });

      console.log("📡 Server response status:", response.status);
      const result = await response.json();
      console.log("📩 Server response body:", result);

      if (!response.ok) {
        const errorMessage =
          result.error || "OTP verification failed. Please check your code.";
        console.warn("⚠️ OTP verification failed:", errorMessage);
        setStatus({ loading: false, error: errorMessage, success: false });
        return;
      }

      console.log("✅ OTP verified successfully! Provider data:", result.data);
      setStatus({
        loading: false,
        error: null,
        success: true,
        message: "✅ OTP verified successfully! Redirecting...",
      });

      // ✅ Allow the success message to display briefly before redirecting
      setTimeout(() => {
        onSuccess(result.data);
        navigate("/login");
      }, 800);
    } catch (error) {
      console.error("❌ Network or unexpected error:", error);
      setStatus({
        loading: false,
        error: "Could not connect to the server. Please check your connection.",
        success: false,
      });
    }
  };

  const handleResendOtp = async () => {
    console.log("🔁 Resending OTP to:", email);
    setStatus({
      loading: true,
      error: null,
      success: false,
      message: "Requesting new OTP...",
    });

    // Mock resend success
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus({
      loading: false,
      error: null,
      success: false,
      message: "A new OTP has been sent. Check your inbox!",
    });
  };

  let displayMessage = status.message;
  if (status.loading) displayMessage = "Please wait...";

  return (
    <div className="w-full max-w-xl bg-white shadow-2xl hover:shadow-3xl border border-gray-100 rounded-3xl p-8 md:p-10 transition-all duration-500">
      <header className="text-center mb-10 pb-4 border-b border-green-100">
        <h1 className="text-4xl font-black text-green-700 mb-1 tracking-tight">
          Verify Your Account
        </h1>
        <p className="text-gray-500 font-medium text-lg">
          A 6-digit verification code has been sent to{" "}
          <span className="font-semibold text-sky-600">
            {email || "your email"}
          </span>
          .
        </p>
        <button
          onClick={onBack}
          className="text-sky-500 hover:text-sky-700 text-sm mt-2 transition duration-200 underline"
          disabled={status.loading || status.success}
        >
          &larr; Go back and check information
        </button>
      </header>

      {/* 🔹 Status Messages */}
      {status.success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-300 text-green-700 rounded-xl text-center font-semibold animate-pulse-once">
          {displayMessage}
        </div>
      )}
      {status.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl text-center font-semibold">
          ❌ Error: {status.error}
        </div>
      )}
      {!status.success && !status.error && displayMessage && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-300 text-blue-700 rounded-xl text-center font-semibold">
          🔔 {displayMessage}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="flex justify-center space-x-3">
          {otpFields.map((_, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="tel"
              maxLength="1"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              value={otp[index] || ""}
              onChange={(e) => handleOtpChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-10 h-14 md:w-12 md:h-16 text-center text-2xl md:text-3xl font-bold border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-green-500 transition duration-150 shadow-md bg-gray-50 text-black"
              required
              disabled={status.loading || status.success}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={status.loading || otp.join("").length < 6 || status.success}
          className="w-full py-3 mt-10 bg-green-600 text-white font-extrabold text-lg rounded-xl shadow-lg shadow-green-300/50 hover:bg-green-700 disabled:bg-gray-400 transition-all duration-300 ease-in-out transform hover:scale-[1.01] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-70"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
                      5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 
                      3 7.938l3-2.647z"
                ></path>
              </svg>
              Verifying...
            </div>
          ) : (
            "Verify Code"
          )}
        </button>
      </form>

      <div className="text-center mt-6">
        Didn't receive the code?{" "}
        <button
          onClick={handleResendOtp}
          className="text-sm text-sky-600 font-semibold hover:text-sky-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={status.loading || status.success}
        >
          Resend Code
        </button>
      </div>
    </div>
  );
};

export default OTPProvider;
