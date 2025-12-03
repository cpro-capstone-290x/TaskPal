import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api"; // Ensure this path is correct for your project structure

// Moved outside to prevent re-creation on every render
const PendingBanner = ({ hasPending, existingBookingId, onNavigate }) => {
  if (!hasPending) return null;

  return (
    <div className="w-full max-w-2xl mb-6 p-4 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-xl shadow animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="font-bold text-lg">⚠️ Action Required</p>
          <p className="text-sm mt-1">
            You already have a <span className="font-semibold">Pending</span> booking. 
            Please wait for the provider to accept or decline it before making a new request.
          </p>
        </div>
        <button
          onClick={() => onNavigate(`/chat/${existingBookingId}/user`)}
          className="shrink-0 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition font-medium text-sm shadow-sm"
        >
          Go to Pending Booking
        </button>
      </div>
    </div>
  );
};

const BookingInit = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    notes: "",
    scheduled_date: "",
    price: "",
  });
  const [loading, setLoading] = useState(false);

  /* ------------------------------------------------------ */
  /* 🚨 PREVENT DUPLICATE BOOKINGS LOGIC                    */
  /* ------------------------------------------------------ */
  const [hasPending, setHasPending] = useState(false);
  const [existingBookingId, setExistingBookingId] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [checkingPending, setCheckingPending] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setCheckingPending(false);
      return;
    }

    const fetchPending = async () => {
      try {
        const res = await api.get(`/bookings/user/${userId}`);
        const bookings = Array.isArray(res.data?.data) ? res.data.data : [];

        // ❌ OLD: Finds ANY pending booking
        // const pending = bookings.find(
        //   (b) => b.status?.trim().toLowerCase() === "pending"
        // );
        
        // ✅ NEW: Finds pending booking ONLY for this provider
        // Note: Ensure providerId is a string/number match. 
        // URLs usually give strings, API might return numbers.
        const pending = bookings.find(
          (b) => 
            b.status?.trim().toLowerCase() === "pending" && 
            String(b.provider_id) === String(providerId)
        );

        if (pending) {
          setHasPending(true);
          setExistingBookingId(pending.id);
        }
      } catch (err) {
        console.error("Error checking pending bookings:", err);
      } finally {
        setCheckingPending(false);
      }
    };

    fetchPending();
  }, []);

  // Handle inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Step navigation
  const handleNext = () => {
    if (step === 1 && !form.notes.trim()) return alert("Please describe your task.");
    if (step === 2 && !form.scheduled_date) return alert("Please select a valid date and time.");
    if (step === 3 && !form.price) return alert("Please enter your proposed price.");
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  // Booking submission
  const handleBookNow = async () => {
    /* 🚨 Client-side guard */
    if (hasPending) {
      alert("You already have a pending booking. Please complete it first.");
      return navigate(`/chat/${existingBookingId}/user`);
    }

    const token = localStorage.getItem("authToken");
    const userRole = localStorage.getItem("userRole");
    const clientId = localStorage.getItem("userId");

    if (!token || userRole !== "user") {
      localStorage.setItem("pendingRedirect", window.location.pathname);
      alert("⚠️ You must log in as a client to continue booking.");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(
        "/bookings",
        {
          client_id: clientId,
          provider_id: providerId,
          notes: form.notes,
          scheduled_date: form.scheduled_date,
          price: parseFloat(form.price),
          agreement_signed_by_client: false,
          agreement_signed_by_provider: false,
          status: "Pending",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const booking = res.data;

      if (!booking?.bookingId && !booking?.id) {
        // Handle case where ID might be returned differently
        throw new Error("Invalid booking ID returned");
      }

      const newBookingId = booking.bookingId || booking.id;
      navigate(`/chat/${newBookingId}/user`);
      
    } catch (err) {
      console.error("❌ Error creating booking:", err);

      // Backend block handling (409 Conflict)
      if (err.response?.status === 409) {
        alert("⚠️ You already have a pending booking.");
        // Assuming backend returns the existing ID in the error response
        if(err.response.data?.existingBookingId) {
             return navigate(`/chat/${err.response.data.existingBookingId}/user`);
        }
      }
      alert("Failed to create booking. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------ */
  /* UI RENDERING STEPS                                     */
  /* ------------------------------------------------------ */

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Task Description</h2>
      <p className="text-gray-500 text-sm">Describe what you need help with in detail.</p>
      <textarea
        name="notes"
        value={form.notes}
        onChange={handleChange}
        disabled={hasPending}
        placeholder="E.g., I need help moving 5 boxes from my garage to the second floor..."
        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Select Date & Time</h2>
      <p className="text-gray-500 text-sm">When do you need this task done?</p>
      <input
        type="datetime-local"
        name="scheduled_date"
        value={form.scheduled_date}
        onChange={handleChange}
        disabled={hasPending}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
      />
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Propose a Price</h2>
      <p className="text-gray-500 text-sm">Enter the amount (USD) you are willing to pay.</p>
      <div className="relative">
        <span className="absolute left-3 top-3 text-gray-500">$</span>
        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          disabled={hasPending}
          placeholder="0.00"
          step="0.01"
          className="w-full p-3 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Review Summary</h2>
      <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">Date:</span>
          <span className="font-medium text-gray-800">
            {form.scheduled_date ? new Date(form.scheduled_date).toLocaleString() : "-"}
          </span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">Price:</span>
          <span className="font-medium text-green-700 text-lg">
            ${parseFloat(form.price || 0).toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-gray-600 block mb-1">Notes:</span>
          <p className="text-gray-800 bg-white p-2 rounded border border-gray-200">
            {form.notes}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-10 px-4">
      {/* Pending Banner Component */}
      <PendingBanner 
        hasPending={hasPending} 
        existingBookingId={existingBookingId} 
        onNavigate={navigate} 
      />

      {/* Progress Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8">
        {["Task", "Schedule", "Price", "Summary"].map((label, index) => (
          <div key={index} className="flex-1 flex flex-col items-center relative">
            <div className="flex items-center w-full">
               {/* Line Connector */}
               <div className={`h-1 flex-1 ${index === 0 ? 'invisible' : ''} ${step > index ? "bg-green-600" : "bg-gray-300"}`}></div>
               
               {/* Circle */}
               <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold z-10 transition-colors duration-300 ${
                  step === index + 1
                    ? "bg-green-700 text-white shadow-lg scale-110"
                    : step > index + 1
                    ? "bg-green-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {step > index + 1 ? "✓" : index + 1}
              </div>

              {/* Line Connector */}
              <div className={`h-1 flex-1 ${index === 3 ? 'invisible' : ''} ${step > index + 1 ? "bg-green-600" : "bg-gray-300"}`}></div>
            </div>
            <span className={`text-xs mt-2 font-medium ${step === index + 1 ? "text-green-700" : "text-gray-500"}`}>{label}</span>
          </div>
        ))}
      </div>

      {/* Step Card */}
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`px-6 py-2 rounded-full border border-gray-300 text-gray-600 transition ${
              step === 1 ? "opacity-0 cursor-default" : "hover:bg-gray-50"
            }`}
          >
            Back
          </button>

          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={hasPending}
              className={`font-semibold rounded-full px-8 py-2 transition shadow-md ${
                  hasPending 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                  : "bg-green-700 hover:bg-green-800 text-white"
              }`}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleBookNow}
              disabled={loading || hasPending}
              className={`${
                loading || hasPending
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-700 hover:bg-green-800 shadow-lg hover:shadow-xl"
              } text-white font-semibold rounded-full px-8 py-2 transition flex items-center gap-2`}
            >
              {loading && (
                 <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
              )}
              {loading ? "Processing..." : hasPending ? "Pending Exists" : "Confirm Booking"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingInit;