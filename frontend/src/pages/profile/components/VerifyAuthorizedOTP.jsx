import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const VerifyAuthorizedOTP = () => {
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState({ loading: false, error: null, success: false });
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    try {
      const res = await axios.post("http://localhost:5000/api/auth/verifyAuthorize", {
        email,
        otp,
      });

      if (res.data.success) {
        setStatus({ loading: false, success: true, error: null });
        alert("✅ Authorized user verified successfully!");
        navigate("/login");
      } else {
        setStatus({ loading: false, error: "Invalid OTP.", success: false });
      }
    } catch (err) {
      console.error(err);
      setStatus({
        loading: false,
        error: "Verification failed. Please try again.",
        success: false,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold text-center text-green-700 mb-4">
          Verify Authorized User
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Please enter the 6-digit OTP sent to <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength="6"
            placeholder="Enter OTP"
            className="w-full border rounded-lg px-4 py-3 text-center tracking-widest font-mono text-lg focus:ring-2 focus:ring-green-300"
            required
          />
          <button
            type="submit"
            disabled={status.loading}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
          >
            {status.loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        {status.error && (
          <p className="text-red-600 text-center mt-4 font-medium">{status.error}</p>
        )}
        {status.success && (
          <p className="text-green-600 text-center mt-4 font-medium">
            Verification successful!
          </p>
        )}
      </div>
    </div>
  );
};

export default VerifyAuthorizedOTP;
