import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

// 🧩 Create socket instance once outside component to prevent duplicates
const socket = io("http://localhost:5000", { autoConnect: false });

const ChatRoom = () => {
  const { bookingId, role } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // ✅ Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Fetch booking details on load
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/bookings/${bookingId}`);
        setBookingDetails(res.data);
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

    // Listen for incoming messages
    socket.off("receive_message").on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    // Listen for booking updates (price or agreement changes)
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

  // ✅ Helper: format timestamps
  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // ✅ Provider updates price
  const handleUpdatePrice = async () => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/bookings/${bookingId}/price`,
        { price: bookingDetails.price }
      );
      setBookingDetails(res.data.booking); // optimistic update
    } catch (err) {
      console.error("Error updating price:", err);
    }
  };

  // ✅ Both user/provider agree to price
  const handleAgree = async () => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/bookings/${bookingId}/agree`,
        { role }
      );
      setBookingDetails(res.data.booking); // optimistic update
    } catch (err) {
      console.error("Error agreeing to price:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-200 text-white">
        Loading chat...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-base-200">
      {/* 💬 Chat Section */}
      <div className="flex flex-col flex-1 border-r border-base-300">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => {
            const isSender = msg.senderId === userId;
            const senderName = msg.senderId === 1 ? "User" : "Provider";
            return (
              <div key={i} className={`chat ${isSender ? "chat-end" : "chat-start"}`}>
                <div
                  className={`chat-bubble ${
                    isSender ? "bg-primary text-white" : "bg-neutral text-white"
                  }`}
                >
                  {msg.message}
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {senderName} • {formatTime(msg.timestamp || new Date())}
                  {isSender && i === messages.length - 1 && (
                    <span className="ml-2 text-info">Seen</span>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* 🧾 Input Area */}
        <div className="p-4 bg-base-300 flex items-center gap-2 border-t border-base-100">
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="input input-bordered w-full bg-base-200 text-white"
          />
          <button onClick={sendMessage} className="btn btn-primary text-white px-6">
            Send
          </button>
        </div>
      </div>

      {/* 📦 Booking Panel */}
      <div className="w-80 p-4 bg-base-300 flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Booking Details</h2>

          {bookingDetails ? (
            <div className="space-y-3 text-sm text-gray-200">
              <p><span className="font-semibold">Booking ID:</span> {bookingDetails.id}</p>
              <p><span className="font-semibold">Notes:</span> {bookingDetails.notes || "No notes"}</p>
              <p>
                <span className="font-semibold">Price:</span>{" "}
                {bookingDetails.price
                  ? `$${Number(bookingDetails.price).toFixed(2)}`
                  : "Not set"}
              </p>
              <p>
                <span className="font-semibold">Scheduled:</span>{" "}
                {bookingDetails.scheduled_date
                  ? new Date(bookingDetails.scheduled_date).toLocaleString()
                  : "Not scheduled"}
              </p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
                <span
                  className={`badge ${
                    bookingDetails.status === "Confirmed"
                      ? "badge-success"
                      : "badge-warning"
                  }`}
                >
                  {bookingDetails.status}
                </span>
              </p>

              {/* 🧾 Provider price input */}
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
                    className="input input-bordered w-full bg-base-200 text-white"
                  />
                  <button
                    onClick={handleUpdatePrice}
                    className="btn btn-sm btn-primary w-full"
                  >
                    Update Price
                  </button>
                </div>
              )}

              {/* 🤝 Agree buttons for both roles */}
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
                        ? "btn-disabled"
                        : "btn-success"
                    }`}
                  >
                    {((role === "user" && bookingDetails.agreement_signed_by_client) ||
                      (role === "provider" && bookingDetails.agreement_signed_by_provider))
                      ? "Agreed ✅"
                      : "Agree to Price"}
                  </button>
                </div>
              )}

              {/* 📄 Agreement download after confirmation */}
              {bookingDetails.status === "Confirmed" && (
                <div className="mt-4">
                  <button
                    onClick={() =>
                      window.open(
                        `http://localhost:5000/api/bookings/${bookingId}/agreement`,
                        "_blank"
                      )
                    }
                    className="btn btn-outline btn-accent w-full"
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

        <div className="border-t border-base-100 mt-4 pt-4 text-xs text-gray-400">
          Both users can negotiate task details before confirming.
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
