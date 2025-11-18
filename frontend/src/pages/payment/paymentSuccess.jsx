import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useLocation } from "react-router-dom";
import api from "../../api.js"; 

  // const token = localStorage.getItem("authToken");
  // const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

const PaymentSuccess = () => {
  const location = useLocation();
  const sessionId = new URLSearchParams(location.search).get("session_id");
  const navigate = useNavigate();
  // const { bookingId } = useParams(); // ✅ read from /payment-success/:bookingId
  const [confirmedBookingId, setConfirmedBookingId] = useState(null);
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

        if (!bookingId) {
          throw new Error("Booking ID not returned from verification");
        }
        
        console.log("✅ Verified booking:", bookingId);
        
        // ✅ Save the ID for the UI
        setConfirmedBookingId(bookingId);

        // 2. ❌ DELETE the redundant api.put call
        //    await api.put(`/bookings/${bookingId}/paid`);

        // 3. Create execution record
        await api.post(`/execution`, { booking_id: bookingId });

        setStatus("success");
        setTimeout(() => {
          navigate(`/execution/${bookingId}`);
        }, 1500);

      } catch (err) {
        console.error("❌ Payment verify error:", err.response?.data || err);
        setStatus("error");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, navigate]);

  // ... (Loading UI and Invalid UI are the same) ...

  // ❌ Error
  if (status === "error")
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <h2 className="text-2xl font-bold text-red-600">Payment Error</h2>
        <p className="text-gray-600 mt-2">
          Something went wrong while verifying your payment.
        </p>
        <p className="text-gray-500 text-sm mt-1">Please contact support if this issue persists.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 px-6 py-2 bg-sky-600 text-white rounded-full hover:bg-sky-700 transition"
        >
          Go Home
        </button>
      </div>
    );

  // ✅ Success (Updated to use state)
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-green-50">
      <div className="bg-white shadow-lg rounded-2xl p-10 text-center border border-green-200">
        <div className="text-6xl text-green-600 mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-800">Payment Successful!</h2>
        <p className="text-gray-600 mt-2">
          Your payment for booking{" "}
          {/* ✅ Use the booking ID from state */}
          <strong>#{confirmedBookingId}</strong> has been confirmed.
        </p>
        <p className="text-gray-500 mt-1">Redirecting to execution details...</p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
