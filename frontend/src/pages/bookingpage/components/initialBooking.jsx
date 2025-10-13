import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const BookingInit = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1️⃣–4️⃣ progress steps
  const [form, setForm] = useState({
    notes: "",
    scheduled_date: "",
    price: "",
  });
  const [loading, setLoading] = useState(false);

  // Handle input updates
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Step navigation
  const handleNext = () => {
    if (step === 1 && !form.notes.trim()) return alert("Please describe your task.");
    if (step === 2 && !form.scheduled_date) return alert("Please select a date and time.");
    if (step === 3 && !form.price) return alert("Please enter your proposed price.");
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  // ✅ Final Submit → Create booking
  const handleBookNow = async () => {
    const token = localStorage.getItem("authToken");
    const userRole = localStorage.getItem("userRole");
    const clientId = localStorage.getItem("userId");

    if (!token || userRole !== "user") {
      // ✅ Save current route before login
      localStorage.setItem("pendingRedirect", window.location.pathname);
      alert("⚠️ You must log in as a client to continue booking.");
      navigate("/login");
      return;
    }

    // ✅ Continue booking logic if logged in
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/bookings",
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const booking = res.data;

      if (!booking?.bookingId || !booking?.provider_id) {
        console.error("❌ Invalid booking response:", res.data);
        alert("Something went wrong while creating the chat room.");
        return;
      }

      // ✅ Redirect to chat page
      navigate(`/chat/${booking.bookingId}/user`);



    } catch (err) {
      console.error("❌ Error creating booking:", err);
      alert("Failed to create booking.");
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
        className="w-full border text-white border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-600 focus:outline-none text-gray-700 resize-none"
        rows={4}
      />
    </div>
  );

  // 🟢 Step 2: Schedule Date
  const renderStep2 = () => (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">When would you like it done?</h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose your preferred date and time for this task.
      </p>
      <input
        type="datetime-local"
        name="scheduled_date"
        value={form.scheduled_date}
        onChange={handleChange}
        className="w-full border text-white border-gray-300 rounded-full px-4 py-3 focus:ring-2 focus:ring-green-600 focus:outline-none text-gray-700"
      />
    </div>
  );

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
          className="w-full border text-white border-gray-300 rounded-full px-4 py-3 focus:ring-2 focus:ring-green-600 focus:outline-none text-gray-700"
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
        <p>
          <strong>Task:</strong> {form.notes || "Not provided"}
        </p>
        <p>
          <strong>Scheduled Date:</strong>{" "}
          {form.scheduled_date
            ? new Date(form.scheduled_date).toLocaleString()
            : "Not selected"}
        </p>
        <p>
          <strong>Price:</strong> ${form.price || "Not set"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-4xl px-6 py-6">
        {/* <h1 className="text-2xl font-extrabold text-primary tracking-tight">
          <span className="text-secondary">Task</span>Pal</h1> */}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between px-6 mb-8">
        {["Task", "Schedule", "Price", "Summary"].map((label, index) => (
          <div key={index} className="flex-1 flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                step === index + 1
                  ? "bg-green-700 text-white"
                  : step > index + 1
                  ? "bg-green-400 text-white"
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

      {/* Step Card */}
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        {/* Buttons */}
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
