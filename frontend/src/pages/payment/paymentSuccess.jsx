import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("verifying");

  // ✅ Extract booking_id from the query params
  const queryParams = new URLSearchParams(location.search);
  const bookingId = queryParams.get("booking_id");

  useEffect(() => {
    const updatePaymentStatus = async () => {
      if (!bookingId) {
        setStatus("invalid");
        return;
      }

      try {
        // ✅ Update booking status in the backend
        const res = await axios.put(`http://localhost:5000/api/bookings/${bookingId}/paid`);
        console.log("✅ Booking updated:", res.data);
        setStatus("success");
      } catch (err) {
        console.error("❌ Error updating booking:", err);
        setStatus("error");
      } finally {
        setLoading(false);
      }
    };

    updatePaymentStatus();
  }, [bookingId]);

  // ✅ UI States
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-sky-500 mb-4"></div>
        <p>Verifying your payment...</p>
      </div>
    );

  if (status === "invalid")
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <h2 className="text-2xl font-bold text-red-600">Invalid Payment</h2>
        <p className="text-gray-600 mt-2">No booking ID was found.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 px-6 py-2 bg-sky-600 text-white rounded-full hover:bg-sky-700 transition"
        >
          Go Home
        </button>
      </div>
    );

  if (status === "error")
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <h2 className="text-2xl font-bold text-red-600">Payment Error</h2>
        <p className="text-gray-600 mt-2">
          Something went wrong while updating your booking. Please contact support.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 px-6 py-2 bg-sky-600 text-white rounded-full hover:bg-sky-700 transition"
        >
          Go Home
        </button>
      </div>
    );

  // ✅ Success UI
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-green-50">
      <div className="bg-white shadow-lg rounded-2xl p-10 text-center border border-green-200">
        <div className="text-6xl text-green-600 mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-800">Payment Successful!</h2>
        <p className="text-gray-600 mt-2">
          Your payment for booking <strong>#{bookingId}</strong> has been confirmed.
        </p>
        <button
          onClick={() => navigate(`/chat/${bookingId}`)}
          className="mt-6 px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
        >
          Go to Chat
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
