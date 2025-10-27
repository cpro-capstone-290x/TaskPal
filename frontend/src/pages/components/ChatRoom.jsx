import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import api from '../../api';

const socket = io(
  import.meta.env.VITE_SOCKET_URL || "https://taskpal-14oy.onrender.com",
  {
    transports: ["websocket", "polling"], // ✅ fallback ensures Render stays connected
    withCredentials: true,
    reconnectionAttempts: 5, // ✅ auto-retry
    reconnectionDelay: 3000,
  }
);


const ChatRoom = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const role = localStorage.getItem("userRole"); // "user" or "provider"
  const storedUserId =
    role === "provider"
      ? parseInt(localStorage.getItem("providerId"))
      : parseInt(localStorage.getItem("userId"));

  const [userId, setUserId] = useState(storedUserId);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [providerDetails, setProviderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem("authToken");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // ✅ Scroll to last message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Fetch booking info + provider info
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        if (!token) {
          alert("Please log in to access the chat.");
          navigate("/login");
          return;
        }

        const res = await api.get(`/bookings/${bookingId}`, axiosConfig);
        const booking = res.data;
        setBookingDetails(booking);

        // ✅ Fetch provider details
        if (booking.provider_id) {
          const providerRes = await api.get(
            `/providers/public/${booking.provider_id}`
          );
          setProviderDetails(providerRes.data.data);
        }
      } catch (err) {
        console.error("❌ Booking not found:", err);
        alert("This booking no longer exists or is unauthorized.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, navigate]);

  // ✅ Setup socket connection
  useEffect(() => {
    if (loading || !bookingDetails) return;

    if (!socket.connected) socket.connect();

    socket.emit("join_room", { bookingId: parseInt(bookingId), role });

    socket.on("load_messages", (history) => {
      console.log("💬 Loaded chat history:", history);
      setMessages(history || []);
    });

    socket.on("receive_message", (data) => {
      // Avoid echo
      if (
        Number(data.sender_id) === userId &&
        String(data.sender_role).toLowerCase() === String(role).toLowerCase()
      )
        return;
      setMessages((prev) => [...prev, data]);
    });

    socket.on("booking_updated", (updatedBooking) => {
      setBookingDetails(updatedBooking);
    });

    return () => {
          // ✅ Use the same object format as "join_room" to be consistent
          socket.emit("leave_room", { bookingId: parseInt(bookingId), role });
          
          // ✅ Clean up the listeners
          socket.off("load_messages");
          socket.off("receive_message");
          socket.off("booking_updated");

          // ✅ DO NOT disconnect here. Let the socket stay alive.
        };
      }, [bookingId, bookingDetails, loading, role, userId]);

  // ✅ Send message
  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      bookingId: parseInt(bookingId),
      sender_id: userId,
      sender_role: role,
      message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    socket.emit("send_message", newMessage);
    setMessage("");
  };

  // ✅ Format time
  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // ✅ Update booking price (Provider)
  const handleUpdatePrice = async () => {
    try {
      const newPrice = prompt(
        "Enter a new price:",
        bookingDetails.price || ""
      );
      if (!newPrice || isNaN(newPrice)) return alert("Invalid price.");

      const res = await api.put(
        `/bookings/${bookingId}/price`,
        { price: newPrice },
        axiosConfig
      );
      setBookingDetails(res.data.booking);

      socket.emit("send_message", {
        bookingId,
        sender_id: userId,
        sender_role: role,
        message: `💬 Provider proposed a new price: $${newPrice}`,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error updating price:", err);
    }
  };

  // ✅ Agree to price
  const handleAgree = async () => {
    try {
      const res = await api.put(
        `/bookings/${bookingId}/agree`,
        { role },
        axiosConfig
      );
      setBookingDetails(res.data.booking);

      socket.emit("send_message", {
        bookingId,
        sender_id: userId,
        sender_role: role,
        message: `✅ ${role === "user" ? "Client" : "Provider"} agreed to the price.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error agreeing to price:", err);
    }
  };

      const handleProceedToPayment = async () => {
        try {
          const id = bookingDetails.id;
          if (!id) return alert("Booking ID not found.");

          const res = await api.post(
            `/payments/create-intent/${id}`,
            {},
            axiosConfig
          );

          if (res.data.url) {
            window.location.href = res.data.url; // ✅ Redirect to Stripe checkout
          } else {
            alert("Failed to create payment session.");
          }
        } catch (err) {
          console.error("❌ Payment error:", err);
          alert("Something went wrong while initiating payment.");
        }
      };



  // ✅ Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-600">
        Loading chat...
      </div>
    );
  }

  // ✅ UI
  return (
    <div className="flex h-screen bg-gray-50">
      {/* LEFT PANEL - Provider Info */}
      <div className="w-80 bg-white border-r border-gray-200 p-6 flex flex-col justify-between">
        {providerDetails ? (
          <>
            <div className="flex flex-col items-center text-center">
              <div className="w-28 h-28 rounded-full border-4 border-gray-100 bg-gray-100 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800">
                {providerDetails.name || "Task Provider"}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-yellow-500 text-sm">
                ⭐ <span className="text-gray-600">5.0</span>
                <span className="text-gray-400">(0 reviews)</span>
              </div>
              <button className="mt-4 px-5 py-2 rounded-full text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 transition">
                View Profile
              </button>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4 text-sm text-gray-700 space-y-1">
              <p>
                <span className="font-semibold">Service:</span>{" "}
                {providerDetails.service_type || "General Task"}
              </p>
              <p>
                <span className="font-semibold">Provider Type:</span>{" "}
                {providerDetails.provider_type || "Independent"}
              </p>
              <p>
                <span className="font-semibold">Location:</span>{" "}
                {providerDetails.city || "Red Deer, AB"}
              </p>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 mt-10">Loading provider...</p>
        )}

        <div className="text-xs text-gray-400 mt-6 border-t border-gray-200 pt-4">
          All TaskPals are background-checked and verified.
        </div>
      </div>

      {/* CENTER - Chat Section */}
      <div className="flex flex-col flex-1 bg-gray-100 border-r border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 bg-white flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 text-lg">Chat Room</h2>
        </div>

        {/* ✅ Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50">
          {messages.map((msg, i) => {
            const senderId = Number(msg.sender_id ?? msg.senderId);
            const senderRole = String(msg.sender_role || "").trim().toLowerCase();
            const currentRole = String(role || "").trim().toLowerCase();
            const currentId = Number(userId);

            const isSender =
              senderRole === currentRole && senderId === currentId;

            const senderName = isSender
              ? "You"
              : senderRole === "provider"
              ? "Provider"
              : "Client";

            return (
              <div
                key={i}
                className={`flex ${isSender ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                    isSender
                      ? "bg-sky-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  <div
                    className={`text-[11px] mt-1 ${
                      isSender ? "text-gray-200 text-right" : "text-gray-500 text-left"
                    }`}
                  >
                    {senderName} • {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* ✅ Input */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-sky-400 focus:outline-none text-gray-700"
          />
          <button
            onClick={sendMessage}
            className="bg-sky-600 text-white rounded-full px-5 py-2 font-semibold hover:bg-sky-700 transition"
          >
            Send
          </button>
        </div>
      </div>

      {/* RIGHT PANEL - Booking Info */}
      <div className="w-80 bg-white p-6 flex flex-col justify-between border-l border-gray-200">
        {bookingDetails && (
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>Booking ID:</strong> {bookingDetails.id}
            </p>
            <p>
              <strong>Notes:</strong> {bookingDetails.notes || "N/A"}
            </p>
            <p>
              <strong>Proposed Price:</strong>{" "}
              {bookingDetails.price
                ? `$${Number(bookingDetails.price).toFixed(2)}`
                : "$0.00"}
            </p>
            <p>
              <strong>Scheduled:</strong>{" "}
              {new Date(bookingDetails.scheduled_date).toLocaleString()}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={`px-2 py-0.5 rounded text-white ${
                  bookingDetails.status === "Negotiating"
                    ? "bg-yellow-500"
                    : bookingDetails.status === "Confirmed"
                    ? "bg-green-600"
                    : "bg-gray-500"
                }`}
              >
                {bookingDetails.status}
              </span>
            </p>

            {/* ✅ Provider actions */}
            {["Pending", "Negotiating"].includes(bookingDetails.status) &&
              role === "provider" && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={handleUpdatePrice}
                    className="w-full bg-sky-600 text-white py-2 rounded hover:bg-sky-700"
                  >
                    💬 Propose New Price
                  </button>
                  <button
                    onClick={handleAgree}
                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                  >
                    ✅ Agree to Price
                  </button>
                </div>
              )}

            {/* ✅ Client actions */}
            {["Pending", "Negotiating"].includes(bookingDetails.status) &&
              role === "user" && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={handleAgree}
                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                  >
                    ✅ Agree to Price
                  </button>
                </div>
              )}

            {/* ✅ Payment button for client */}
            {bookingDetails.status === "Confirmed" && role === "user" && (
              <div className="mt-6">
                <button
                  onClick={handleProceedToPayment}
                  className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                >
                  💳 Proceed to Payment
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;
