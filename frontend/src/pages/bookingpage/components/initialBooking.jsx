import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BookingInit = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    street: "",
    unit: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinue = () => {
    if (!form.street.trim()) {
      alert("Please enter a valid address.");
      return;
    }
    // ✅ Navigate to next step (e.g., select time/date)
    navigate(`/booking/details/${providerId}?street=${encodeURIComponent(form.street)}&unit=${encodeURIComponent(form.unit)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* 🔹 Header / Logo */}
      <div className="w-full max-w-4xl px-6 py-6">
        <h1 className="text-2xl font-bold text-green-700">TaskPal</h1>
      </div>

      {/* 🔹 Progress Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between px-6 mb-8">
        {["Describe your task", "Select your Tasker", "Confirm details", "Payment"].map(
          (label, index) => (
            <div key={index} className="flex-1 flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                  index === 0
                    ? "bg-green-700 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {index + 1}
              </div>
              {index < 3 && (
                <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
              )}
            </div>
          )
        )}
      </div>

      {/* 🔹 Step Title */}
      <div className="w-full max-w-2xl px-4 mb-3">
        <h2 className="text-lg font-semibold text-gray-800">
          1: Describe your task
        </h2>
        <p className="text-sm text-gray-600">
          Tell us about your task. We’ll use these details to show providers in
          your area who fit your needs.
        </p>
      </div>

      {/* 🔹 Form Card */}
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Your Task Location
        </h3>

        <div className="space-y-4">
          <input
            type="text"
            name="street"
            value={form.street}
            onChange={handleChange}
            placeholder="Street address"
            className="w-full border border-gray-300 rounded-full px-5 py-3 focus:ring-2 focus:ring-green-600 focus:outline-none text-gray-700"
          />
          <input
            type="text"
            name="unit"
            value={form.unit}
            onChange={handleChange}
            placeholder="Unit or Apt #"
            className="w-full border border-gray-300 rounded-full px-5 py-3 focus:ring-2 focus:ring-green-600 focus:outline-none text-gray-700"
          />
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={handleContinue}
            className="bg-green-700 hover:bg-green-800 text-white font-semibold rounded-full px-8 py-2 transition"
          >
            Continue
          </button>
        </div>
      </div>

      {/* 🔹 Items Section (placeholder) */}
      <div className="w-full max-w-2xl bg-white rounded-xl border border-gray-200 p-4 mb-10">
        <h3 className="font-semibold text-gray-800 mb-2">Your Items</h3>
        <p className="text-gray-500 text-sm">
          You can describe what you need help with (e.g., "Assemble a 3-seater
          couch" or "Mount a TV").
        </p>
      </div>
    </div>
  );
};

export default BookingInit;
