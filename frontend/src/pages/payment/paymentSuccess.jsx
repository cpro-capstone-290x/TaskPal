import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("verifying");

  // ✅ Extract booking_id from URL
  const queryParams = new URLSearchParams(location.search);
  const bookingId = queryParams.get("booking_id");

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      if (!bookingId) {
        setStatus("invalid");
        setLoading(false);
        return;
      }

      try {
        // 1️⃣ Update booking payment status
        const res = await axios.put(
          `http://localhost:5000/api/bookings/${bookingId}/paid`
        );

        console.log("✅ Booking updated:", res.data);

        // 2️⃣ Create Execution record
        const execRes = await axios.post("http://localhost:5000/api/execution", {
          booking_id: bookingId,
        });

        console.log("✅ Execution created:", execRes.data);

        // 3️⃣ Redirect to Execution page
        setStatus("success");
        setTimeout(() => {
          navigate(`/execution/${bookingId}`);
        }, 1500);
      } catch (err) {
        console.error("❌ Error handling payment success:", err);
        setStatus("error");
      } finally {
        setLoading(false);
      }
    };

    handlePaymentSuccess();
  }, [bookingId, navigate]);

  // 🌀 Loading UI
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-sky-500 mb-4"></div>
        <p>Verifying your payment...</p>
      </div>
    );

  // ❌ Invalid Booking
  if (status === "invalid")
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <h2 className="text-2xl font-bold text-red-600">Invalid Payment</h2>
        <p className="text-gray-600 mt-2">No booking ID found.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 px-6 py-2 bg-sky-600 text-white rounded-full hover:bg-sky-700 transition"
        >
          Go Home
        </button>
      </div>
    );

  // ❌ Error
  if (status === "error")
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <h2 className="text-2xl font-bold text-red-600">Payment Error</h2>
        <p className="text-gray-600 mt-2">
          Something went wrong while updating your booking or creating execution.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 px-6 py-2 bg-sky-600 text-white rounded-full hover:bg-sky-700 transition"
        >
          Go Home
        </button>
      </div>
    );

  // ✅ Success
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-green-50">
      <div className="bg-white shadow-lg rounded-2xl p-10 text-center border border-green-200">
        <div className="text-6xl text-green-600 mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-800">Payment Successful!</h2>
        <p className="text-gray-600 mt-2">
          Your payment for booking <strong>#{bookingId}</strong> has been confirmed.
        </p>
        <p className="text-gray-500 mt-1">Redirecting to execution details...</p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
