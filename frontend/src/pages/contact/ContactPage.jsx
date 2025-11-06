import React, { useState } from "react";
import Header from "../components/Header";
import api from "../../api"; // ✅ centralized axios instance

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null); // null | 'sending' | 'success' | 'error'

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");

    try {
      // ✅ Using centralized API instead of raw axios
      const res = await api.post("/contact", form);
      if (res.data.success) {
        setStatus("success");
        setForm({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("❌ Contact form error:", err);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white text-gray-800">
      <Header />

      <section className="flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10">
          <h1 className="text-4xl font-bold text-green-700 mb-4 text-center leading-tight">
            Contact TaskPal Support
          </h1>
          <p className="text-lg text-gray-600 text-center mb-10">
            We’re here to help you with any issues, feedback, or assistance.
          </p>

          {/* ✅ Support Info Section */}
          <div className="bg-green-50 border border-green-100 rounded-2xl p-6 mb-10 shadow-sm text-center">
            <h2 className="text-xl font-semibold text-green-800 mb-3">
              Reach Us Directly
            </h2>
            <div className="text-lg space-y-2">
              <p>
                📧 <strong>Email:</strong>{" "}
                <a
                  href="mailto:support@taskpal.ca"
                  className="text-green-700 hover:underline"
                >
                  support@taskpal.ca
                </a>
              </p>
              <p>
                ☎️ <strong>Phone:</strong>{" "}
                <a
                  href="tel:+15875551234"
                  className="text-green-700 hover:underline"
                >
                  +1 (587) 555-1234
                </a>
              </p>
              <p>
                🏢 <strong>Address:</strong> 123 Innovation Drive, Red Deer, AB
              </p>
            </div>
          </div>

          {/* ✅ Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-lg font-semibold text-gray-700 mb-2"
              >
                Your Name
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-4 focus:ring-green-300 focus:outline-none"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-lg font-semibold text-gray-700 mb-2"
              >
                Your Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-4 focus:ring-green-300 focus:outline-none"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-lg font-semibold text-gray-700 mb-2"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows="5"
                value={form.message}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-4 focus:ring-green-300 focus:outline-none"
                placeholder="Write your message..."
                required
              ></textarea>
            </div>

            {/* ✅ Submit Button */}
            <button
              type="submit"
              className={`w-full text-xl font-semibold py-3 rounded-lg transition focus:ring-4 focus:ring-green-300 
                ${
                  status === "sending"
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending..." : "Send Message"}
            </button>

            {/* ✅ Status Alerts */}
            {status === "success" && (
              <p className="text-green-700 text-center mt-4 font-medium animate-fadeIn">
                ✅ Message sent successfully!
              </p>
            )}
            {status === "error" && (
              <p className="text-red-600 text-center mt-4 font-medium animate-fadeIn">
                ❌ Failed to send message. Please try again later.
              </p>
            )}
          </form>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
