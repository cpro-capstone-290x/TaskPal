import React, { useState } from "react";
import Header from "../components/Header";
import axios from "axios";

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await axios.post("http://localhost:5000/api/contact", form);
      if (res.data.success) {
        setStatus("success");
        setForm({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Header />

      <section className="flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full bg-white rounded-3xl shadow-lg border border-gray-200 p-8 sm:p-10">
          <h1 className="text-4xl font-bold text-green-700 mb-4 text-center leading-tight">
            Contact TaskPal Support
          </h1>
          <p className="text-lg text-gray-600 text-center mb-10">
            We’re here to help you with any issues, feedback, or assistance.
          </p>

          <div className="bg-green-50 border border-green-100 rounded-2xl p-6 mb-10 shadow-sm">
            <h2 className="text-xl font-semibold text-green-800 mb-3 text-center">
              Reach Us Directly
            </h2>
            <div className="text-lg text-center space-y-2">
              <p>
                📧 <strong>Email:</strong>{" "}
                <a
                  href="mailto:support_placeholder@taskpal.ca"
                  className="text-green-700 hover:underline"
                >
                  support_placeholder@taskpal.ca
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Your Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-4 focus:ring-green-300 focus:outline-none"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Your Email
              </label>
              <input
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
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Message
              </label>
              <textarea
                name="message"
                rows="5"
                value={form.message}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-4 focus:ring-green-300 focus:outline-none"
                placeholder="Write your message..."
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white text-xl font-semibold py-3 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition"
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending..." : "Send Message"}
            </button>

            {status === "success" && (
              <p className="text-green-700 text-center mt-4 font-medium">
                ✅ Message sent successfully!
              </p>
            )}
            {status === "error" && (
              <p className="text-red-600 text-center mt-4 font-medium">
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
