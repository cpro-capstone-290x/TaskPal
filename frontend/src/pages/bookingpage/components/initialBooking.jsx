import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../../api";

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

  // ✅ Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Step navigation
  const handleNext = () => {
    if (step === 1 && !form.notes.trim()) return alert("Please describe your task.");
    if (step === 2 && !form.scheduled_date) return alert("Please select a valid date and time.");
    if (step === 3 && !form.price) return alert("Please enter your proposed price.");
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  // ✅ Booking submission
  const handleBookNow = async () => {
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

      if (!booking?.bookingId || !booking?.provider_id) {
        console.error("❌ Invalid booking response:", res.data);
        alert("Something went wrong while creating your booking.");
        return;
      }

      // ✅ Redirect to chat after successful booking
      navigate(`/chat/${booking.bookingId}/user`);
    } catch (err) {
      console.error("❌ Error creating booking:", err);
      alert("Failed to create booking. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Step 1: Task Description
  const renderStep1 = () => (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Describe your task</h3>
      <p className="text-sm text-gray-600 mb-4">
        Tell us what you need help with. Be specific so providers know what to expect.
      </p>
      <textarea
        name="notes"
        value={form.notes}
        onChange={handleChange}
        placeholder='e.g. "Assemble my new 3-seater couch and mount a small shelf."'
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-green-600 focus:outline-none resize-none"
        rows={4}
      />
    </div>
  );

  // 🟢 Step 2: Schedule Date
  const renderStep2 = () => {
    const getCurrentDateTime = () => {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      return now.toISOString().slice(0, 16);
    };

    const handleDateChange = (e) => {
      const selectedDate = new Date(e.target.value);
      const hours = selectedDate.getHours();

      if (selectedDate < new Date()) {
        alert("Please select a future date and time.");
        return;
      }
      if (hours < 8 || hours >= 17) {
        alert("Please select a time between 8:00 AM and 5:00 PM.");
        return;
      }

      handleChange(e);
    };

    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          When would you like it done?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose your preferred date and time for this task.
        </p>

        <input
          type="datetime-local"
          name="scheduled_date"
          value={form.scheduled_date}
          onChange={handleDateChange}
          min={getCurrentDateTime()}
          className="w-full border border-gray-300 rounded-full px-4 py-3 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-green-600 focus:outline-none"
        />

        {/* Inline error display */}
        {form.scheduled_date && (() => {
          const d = new Date(form.scheduled_date);
          const h = d.getHours();
          if (d < new Date())
            return <p className="text-red-500 text-sm mt-2">Please select a future date.</p>;
          if (h < 8 || h >= 17)
            return <p className="text-red-500 text-sm mt-2">Only between 8 AM and 5 PM allowed.</p>;
          return null;
        })()}
      </div>
    );
  };

  // 🟢 Step 3: Price
  const renderStep3 = () => (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Set your price</h3>
      <p className="text-sm text-gray-600 mb-4">
        Suggest how much you’re willing to pay for this task.
      </p>
      <div className="flex items-center space-x-2">
        <span className="text-gray-700 font-semibold">$</span>
        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="80.00"
          min="0"
          step="0.01"
          className="w-full border border-gray-300 rounded-full px-4 py-3 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-green-600 focus:outline-none"
        />
      </div>
    </div>
  );

  // 🟢 Step 4: Summary
  const renderStep4 = () => (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Review your details</h3>
      <p className="text-sm text-gray-600 mb-4">Confirm before booking your provider.</p>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700 space-y-2">
        <p><strong>Task:</strong> {form.notes || "Not provided"}</p>
        <p>
          <strong>Scheduled Date:</strong>{" "}
          {form.scheduled_date
            ? new Date(form.scheduled_date).toLocaleString()
            : "Not selected"}
        </p>
        <p><strong>Price:</strong> ${form.price || "Not set"}</p>
      </div>
    </div>
  );

  // 🧩 Main Return
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Progress Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between px-6 mt-8 mb-8">
        {["Task", "Schedule", "Price", "Summary"].map((label, index) => (
          <div key={index} className="flex-1 flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                step === index + 1
                  ? "bg-green-700 text-white"
                  : step > index + 1
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {index + 1}
            </div>
            {index < 3 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  step > index + 1 ? "bg-green-500" : "bg-gray-300"
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-6 py-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              className="bg-green-700 hover:bg-green-800 text-white font-semibold rounded-full px-8 py-2 transition"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleBookNow}
              disabled={loading}
              className={`${
                loading ? "bg-gray-400" : "bg-green-700 hover:bg-green-800"
              } text-white font-semibold rounded-full px-8 py-2 transition`}
            >
              {loading ? "Booking..." : "Book Now"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingInit;
