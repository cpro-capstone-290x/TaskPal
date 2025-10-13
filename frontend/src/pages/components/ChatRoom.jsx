import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:5000", { autoConnect: false });

const ChatRoom = () => {
  const { bookingId, role } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [providerDetails, setProviderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // ✅ Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Fetch booking + provider info
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/bookings/${bookingId}`);
        const booking = res.data;
        setBookingDetails(booking);

        // ✅ Fetch provider info (optional)
        if (booking.provider_id) {
          const providerRes = await axios.get(
            `http://localhost:5000/api/providers/${booking.provider_id}`
          );
          setProviderDetails(providerRes.data.data);
        }
      } catch (err) {
        console.error("❌ Booking not found:", err);
        alert("This booking no longer exists or was deleted.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId, navigate]);

  // ✅ Setup socket connection after booking is confirmed to exist
  useEffect(() => {
    if (loading || !bookingDetails) return;
    const id = role === "user" ? 1 : 2;
    setUserId(id);

    if (!socket.connected) socket.connect();
    const room = `chat-${bookingId}`;
    socket.emit("join_room", { bookingId: parseInt(bookingId), userId: id });

    socket.off("receive_message").on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.off("booking_updated").on("booking_updated", (updatedBooking) => {
      console.log("📡 Booking updated via socket:", updatedBooking);
      setBookingDetails(updatedBooking);
    });

    return () => {
      socket.emit("leave_room", room);
      socket.off("receive_message");
      socket.off("booking_updated");
    };
  }, [bookingId, bookingDetails, loading, role]);

  // ✅ Send chat message
  const sendMessage = () => {
    if (!message.trim()) return;
    const newMessage = {
      bookingId: parseInt(bookingId),
      senderId: userId,
      message,
      timestamp: new Date(),
    };
    socket.emit("send_message", newMessage);
    setMessage("");
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleUpdatePrice = async () => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/bookings/${bookingId}/price`,
        { price: bookingDetails.price }
      );
      setBookingDetails(res.data.booking);
    } catch (err) {
      console.error("Error updating price:", err);
    }
  };

  const handleAgree = async () => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/bookings/${bookingId}/agree`,
        { role }
      );
      setBookingDetails(res.data.booking);
    } catch (err) {
      console.error("Error agreeing to price:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-600">
        Loading chat...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 🧍‍♂️ LEFT PANEL - Task Provider Info */}
      <div className="w-80 bg-white border-r border-gray-200 p-6 flex flex-col justify-between">
        {providerDetails ? (
          <>
            <div className="flex flex-col items-center text-center">
              <img
                src={providerDetails.image || "https://via.placeholder.com/100"}
                alt={providerDetails.first_name}
                className="w-28 h-28 rounded-full object-cover border-4 border-gray-100 mb-4"
              />
              <h3 className="text-xl font-bold text-gray-800">
                {providerDetails.first_name} {providerDetails.last_name}
              </h3>
              <p className="text-gray-500 text-sm">{providerDetails.category || "Task Provider"}</p>

              {/* ⭐ Ratings */}
              <div className="flex items-center gap-1 mt-2 text-yellow-500 text-sm">
                ⭐ <span className="text-gray-600">{providerDetails.rating || "5.0"}</span>
                <span className="text-gray-400">
                  ({providerDetails.review_count || 0} reviews)
                </span>
              </div>

              <button className="mt-4 px-5 py-2 rounded-full text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 transition">
                View Profile
              </button>
            </div>

            {/* 🧾 Provider Info Summary */}
            <div className="mt-8 border-t border-gray-200 pt-4 text-gray-700 text-sm space-y-2">
              <p>
                <span className="font-semibold">Service:</span>{" "}
                {providerDetails.service_type || "General Task"}
              </p>
              <p>
                <span className="font-semibold">Experience:</span>{" "}
                {providerDetails.experience || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Hourly Rate:</span>{" "}
                ${providerDetails.price || "N/A"}/hr
              </p>
              <p>
                <span className="font-semibold">Location:</span>{" "}
                {providerDetails.city || "Red Deer, AB"}
              </p>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 mt-12">Loading provider...</p>
        )}

        <div className="text-xs text-gray-400 mt-6 border-t border-gray-200 pt-4">
          All TaskPals are background-checked and verified.
        </div>
      </div>

      {/* 💬 CENTER - Chat Section */}
      <div className="flex flex-col flex-1 border-r border-gray-200 bg-gray-100">
        <div className="border-b border-gray-200 px-6 py-4 bg-white flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 text-lg">Chat Room</h2>
          <img src="/logo.png" alt="TaskPal" className="h-6 opacity-70" />
        </div>

        {/* 💬 Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => {
            const isSender = msg.senderId === userId;
            const senderName = msg.senderId === 1 ? "Client" : "Provider";
            return (
              <div
                key={i}
                className={`flex ${isSender ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                    isSender
                      ? "bg-sky-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                  }`}
                >
                  <p>{msg.message}</p>
                  <div className="text-[11px] mt-1 text-gray-300">
                    {senderName} • {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* ✏️ Input */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 border border-gray-300 text-white rounded-full px-4 py-2 focus:ring-2 focus:ring-sky-400 focus:outline-none text-gray-700"
          />
          <button
            onClick={sendMessage}
            className="bg-sky-600 text-white rounded-full px-5 py-2 font-semibold hover:bg-sky-700 transition"
          >
            Send
          </button>
        </div>
      </div>

      {/* 📦 RIGHT PANEL - Booking Details */}
      <div className="w-80 p-5 bg-white border-l border-gray-200 flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Booking Details</h2>

          {bookingDetails ? (
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <strong>Booking ID:</strong> {bookingDetails.id}
              </p>
              <p>
                <strong>Notes:</strong> {bookingDetails.notes || "No notes provided"}
              </p>
              <p>
                <strong>Price:</strong>{" "}
                {bookingDetails.price
                  ? `$${Number(bookingDetails.price).toFixed(2)}`
                  : "Not set"}
              </p>
              <p>
                <strong>Scheduled:</strong>{" "}
                {bookingDetails.scheduled_date
                  ? new Date(bookingDetails.scheduled_date).toLocaleString()
                  : "Not scheduled"}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    bookingDetails.status === "Confirmed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {bookingDetails.status}
                </span>
              </p>

              {/* Provider price input */}
              {role === "provider" && bookingDetails.status === "Pending" && (
                <div className="mt-3 space-y-2">
                  <input
                    type="number"
                    placeholder="Enter price"
                    value={bookingDetails.price || ""}
                    onChange={(e) =>
                      setBookingDetails((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-400"
                  />
                  <button
                    onClick={handleUpdatePrice}
                    className="btn btn-sm bg-sky-600 hover:bg-sky-700 text-white w-full"
                  >
                    Update Price
                  </button>
                </div>
              )}

              {/* Agreement buttons */}
              {bookingDetails.price && bookingDetails.status !== "Confirmed" && (
                <div className="mt-3">
                  <button
                    disabled={
                      (role === "user" && bookingDetails.agreement_signed_by_client) ||
                      (role === "provider" && bookingDetails.agreement_signed_by_provider)
                    }
                    onClick={handleAgree}
                    className={`btn btn-sm w-full ${
                      (role === "user" && bookingDetails.agreement_signed_by_client) ||
                      (role === "provider" && bookingDetails.agreement_signed_by_provider)
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {((role === "user" && bookingDetails.agreement_signed_by_client) ||
                    (role === "provider" && bookingDetails.agreement_signed_by_provider))
                      ? "Agreed ✅"
                      : "Agree to Price"}
                  </button>
                </div>
              )}

              {/* ✅ Payment button for confirmed bookings */}
              {bookingDetails.status === "Confirmed" && role === "user" && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={async () => {
                      try {
                        const res = await axios.post(
                          `http://localhost:5000/api/payments/create-intent`,
                          {
                            booking_id: bookingDetails.id,
                            client_id: bookingDetails.client_id,
                            provider_id: bookingDetails.provider_id,
                            amount: bookingDetails.price,
                          }
                        );

                        if (res.data.url) {
                          window.location.href = res.data.url; // ✅ Redirect to Stripe checkout page
                        } else {
                          alert("Unable to load payment page. Please try again.");
                        }
                      } catch (err) {
                        console.error("❌ Payment error:", err);
                        alert("Error initiating payment. Please try again later.");
                      }
                    }}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 rounded-lg transition"
                  >
                    Proceed to Payment 💳
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Secure payment powered by Stripe.
                  </p>

                  {/* Optional: Show agreement download button below payment */}
                  <button
                    onClick={() =>
                      window.open(
                        `http://localhost:5000/api/bookings/${bookingDetails.id}/agreement`,
                        "_blank"
                      )
                    }
                    className="w-full border border-sky-500 text-sky-600 rounded-lg py-2 hover:bg-sky-50 transition"
                  >
                    Download Agreement 📄
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400">Loading booking details...</p>
          )}
        </div>

        <div className="border-t border-gray-200 mt-4 pt-4 text-xs text-gray-400">
          Both users can negotiate details before confirmation.
        </div>
      </div>

    </div>
  );
};

export default ChatRoom;
