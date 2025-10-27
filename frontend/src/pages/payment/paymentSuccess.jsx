import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useLocation } from "react-router-dom";
import api from "../../api.js"; 

const PaymentSuccess = () => {
  const location = useLocation();
  const sessionId = new URLSearchParams(location.search).get("session_id");
  const navigate = useNavigate();
  const { bookingId } = useParams(); // ✅ read from /payment-success/:bookingId
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("verifying");

useEffect(() => {
  const verifyPayment = async () => {
    if (!sessionId) {
      setStatus("invalid");
      setLoading(false);
      return;
    }

    try {
      // ✅ Confirm from backend & get bookingId
      const res = await api.get(`/payments/verify/${sessionId}`);
      const bookingId = res.data.bookingId;
      console.log("✅ Verified booking:", bookingId);

      // ✅ Update booking → Paid
      await api.put(`/bookings/${bookingId}/paid`);

      // ✅ Create execution record
      await api.post(`/execution`, { booking_id: bookingId });

      setStatus("success");
      setTimeout(() => {
        navigate(`/execution/${bookingId}`);
      }, 1500);

    } catch (err) {
      console.error("❌ Payment verify error:", err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  verifyPayment();
}, [sessionId, navigate]);


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
