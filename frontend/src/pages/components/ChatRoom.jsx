import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import api from '../../api';
import Header from "./Header";

const socket = io(
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
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
  const [reviews, setReviews] = useState([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem("authToken");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // ✅ Scroll to last message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

// ✅ Fetch booking info + counterpart info (client ↔ provider)
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

      // ✅ If user is a client → fetch provider + reviews
      if (role === "user" && booking.provider_id) {
        const [providerRes, reviewsRes] = await Promise.all([
          api.get(`/providers/public/${booking.provider_id}`),
          api.get(`/reviews/provider/${booking.provider_id}`),
        ]);
        setProviderDetails(providerRes.data.data);
        setReviews(reviewsRes.data.data);
      }


      // ✅ If user is a provider → fetch client info (new logic)
      else if (role === "provider" && booking.client_id) {
        try {
          const clientRes = await api.get(`/users/public/${booking.client_id}`);
          setProviderDetails(clientRes.data.data);
        } catch (innerErr) {
          console.warn("⚠️ Client public info not available, skipping:", innerErr);
        }
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

      const handleViewProfile = async () => {
        try {
          const providerId = bookingDetails?.provider_id;
          if (!providerId) {
            alert("No provider found for this booking.");
            return;
          }

          const [providerRes, reviewsRes] = await Promise.all([
            api.get(`/providers/public/${providerId}`),
            api.get(`/reviews/provider/${providerId}`),
          ]);

          setProviderDetails(providerRes.data?.data || providerRes.data);
          setReviews(reviewsRes.data?.data || []);
        } catch (err) {
          console.error("❌ Provider Fetch Error:", err);
          alert(
            err.response?.data?.message ||
              "Failed to load provider profile. Please try again."
          );
        } finally {
          setLoading(false);
        }
      };

      const handleDownloadAgreement = async () => {
        try {
          const id = bookingDetails.id;
          if (!id) return alert("Booking ID not found.");

          console.log(
            "📡 Download request URL:",
            `${api.defaults.baseURL}/bookings/${id}/agreement`
          );

          // ✅ 1️⃣ If already uploaded to Blob, open directly
          if (bookingDetails.agreement_pdf_url) {
            console.log("☁️ Downloading from Blob:", bookingDetails.agreement_pdf_url);
            window.open(bookingDetails.agreement_pdf_url, "_blank");
            return;
          }

          // ✅ 2️⃣ Otherwise, request backend to generate & upload
          const response = await api.get(`/bookings/${id}/agreement`, {
            headers: { Authorization: `Bearer ${token}` },
            // ⛔ remove responseType: "arraybuffer"
          });

          // ✅ 3️⃣ Backend should respond with JSON (including the Blob URL)
          if (response.data?.url) {
            console.log("✅ Agreement uploaded to Blob:", response.data.url);
            window.open(response.data.url, "_blank");
          } else {
            alert("No agreement file URL found in server response.");
          }
        } catch (err) {
          console.error("❌ Error downloading agreement:", err);

          let errorMessage = "Failed to download agreement.";
          if (err.response?.data) {
            if (err.response.data instanceof ArrayBuffer) {
              errorMessage = new TextDecoder().decode(err.response.data);
            } else if (typeof err.response.data === "string") {
              errorMessage = err.response.data;
            } else if (typeof err.response.data === "object" && err.response.data.error) {
              errorMessage = err.response.data.error;
            }
          }

          alert(errorMessage);
        }
      };

      const handleCancelBooking = async () => {
        try {
          const confirmCancel = window.confirm(
            "Are you sure you want to cancel this booking?"
          );
          if (!confirmCancel) return;
          const res = await api.put(`/bookings/${bookingId}/cancel`, {}, axiosConfig);
          alert("Booking cancelled successfully.");
          navigate("/");
        } catch (err) {
          console.error("Error cancelling booking:", err);
          alert("Failed to cancel booking.");
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
    {/* LEFT PANEL - Adaptive Profile Info */}
    <div className="w-80 bg-white border-r border-gray-200 p-6 flex flex-col justify-between">
      {/* ✅ Back to Profile — smart role-based routing */}
      <button
        onClick={() => {
          try {
            const currentRole = localStorage.getItem("userRole");
            const providerId = localStorage.getItem("providerId");
            const userId = localStorage.getItem("userId");

            if (!currentRole) {
              console.error("❌ No user role found — session expired or invalid.");
              navigate("/login");
              return;
            }

            if (currentRole === "provider") {
              // ✅ Use localStorage providerId (authoritative)
              if (providerId) {
                navigate(`/profileProvider/${providerId}`);
              } else if (bookingDetails?.provider_id) {
                // ✅ Safe fallback
                navigate(`/profileProvider/${bookingDetails.provider_id}`);
              } else {
                console.error("❌ Missing providerId — redirecting to dashboard fallback.");
                navigate("/provider-dashboard");
              }
            } else if (currentRole === "user") {
              // ✅ Use booking details to link to the user’s own profile
              const clientId = bookingDetails?.client_id || userId;
              if (clientId) {
                navigate(`/profile/${clientId}`);
              } else {
                console.error("❌ Missing clientId — redirecting to home fallback.");
                navigate("/");
              }
            } else {
              console.error("❌ Unknown user role.");
              navigate("/");
            }
          } catch (error) {
            console.error("❌ Navigation error:", error);
            navigate("/");
          }
        }}
        className="inline-flex items-center justify-center gap-2 w-full 
                  px-4 py-2 rounded-lg 
                  bg-white border border-gray-300 
                  text-gray-700 font-medium
                  hover:bg-gray-100 hover:border-gray-400
                  transition-all duration-200 active:scale-[0.98] shadow-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Profile
      </button>



      {providerDetails ? (
        <>
          <div className="flex flex-col items-center text-center">
            <img
              src={
                providerDetails.profile_picture_url ||   // correct one from DB
                providerDetails.profile_picture ||       // also returned in API
                providerDetails.photo_url ||             // provider
                providerDetails.photo ||
                providerDetails.photoUrl ||
                providerDetails.avatar ||
                providerDetails.avatar_url ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt="Profile"
              className="w-28 h-28 rounded-full border-4 border-gray-100 bg-gray-100 mb-4 object-cover"
            />

            <h3 className="text-lg font-semibold text-gray-800">
              {providerDetails.name || (role === "provider" ? "Client" : "Task Provider")}
            </h3>

            {/* ⭐ Rating and View Profile (only for client side) */}
            {role === "provider" ? (
              <p className="text-sm text-gray-500 mt-1">Verified Client</p>
            ) : (
              <>
                <div className="flex items-center gap-1 mt-1 text-yellow-500 text-sm">
                  ⭐{" "}
                  <span className="text-gray-600">
                    {reviews.length > 0
                      ? (
                          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                        ).toFixed(1)
                      : "5.0"}
                  </span>
                  <span className="text-gray-400">
                    ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                  </span>
                </div>

                {/* ✅ “View Profile” button */}
                <button
                  onClick={async () => {
                    await handleViewProfile(); // fetch provider & reviews
                    setIsProfileModalOpen(true);
                  }}
                  className="mt-4 px-5 py-2 rounded-full text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 transition"
                >
                  View Profile
                </button>
              </>
            )}

          </div>

          {/* Dynamic Info Section */}
          <div className="mt-6 border-t border-gray-200 pt-4 text-sm text-gray-700 space-y-1">
            {role === "provider" ? (
              <>
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  {providerDetails.email || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">City:</span>{" "}
                  {providerDetails.city || "Unknown"}
                </p>
                <p>
                  <span className="font-semibold">Province:</span>{" "}
                  {providerDetails.province || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Joined:</span>{" "}
                  {providerDetails.created_at
                    ? new Date(providerDetails.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500 mt-10">
          {role === "provider" ? "Loading client info..." : "Loading provider info..."}
        </p>
      )}

      <div className="text-xs text-gray-400 mt-6 border-t border-gray-200 pt-4">
        {role === "provider"
          ? "All clients are verified and validated by TaskPal."
          : "All TaskPals are background-checked and verified."}
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
                className={`px-2 py-0.5 rounded text-white font-medium ${
                  bookingDetails.status === "Negotiating"
                    ? "bg-yellow-500"
                    : bookingDetails.status === "Confirmed"
                    ? "bg-green-600"
                    : bookingDetails.status === "Cancelled"
                    ? "bg-red-600"
                    : bookingDetails.status === "Completed"
                    ? "bg-blue-600"
                    : "bg-gray-500"
                }`}
              >
                {bookingDetails.status}
              </span>

            </p>

            {/* 💬 Negotiation Section (both can propose until both agree) */}
            {["Pending", "Negotiating"].includes(bookingDetails.status) && (
              <div className="mt-3 space-y-2">
                <input
                  type="number"
                  placeholder={`Enter your proposed price (${role === "user" ? "client" : "provider"})`}
                  value={bookingDetails.price || ""}
                  onChange={(e) =>
                    setBookingDetails((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-sky-400"
                  disabled={
                    bookingDetails.agreement_signed_by_client &&
                    bookingDetails.agreement_signed_by_provider
                  }
                />

                <button
                  onClick={async () => {
                    const newPrice = bookingDetails.price;
                    if (!newPrice || isNaN(newPrice) || Number(newPrice) <= 0) {
                      alert("Please enter a valid price.");
                      return;
                    }

                    try {
                      const res = await api.put(
                        `/bookings/${bookingId}/price`,
                        { price: newPrice },
                        axiosConfig
                      );
                      const updatedBooking = res.data.booking;
                      setBookingDetails(updatedBooking);

                      // Create message for the chat
                      const proposalMsg = {
                        bookingId,
                        sender_id: userId,
                        sender_role: role,
                        message: `💬 ${
                          role === "user" ? "Client" : "Provider"
                        } proposed a new price: $${newPrice}`,
                        timestamp: new Date().toISOString(),
                      };

                      // ✅ Show immediately in local chat
                      setMessages((prev) => [...prev, proposalMsg]);

                      // ✅ Emit to others via Socket.IO
                      socket.emit("booking_updated", updatedBooking);
                      socket.emit("send_message", proposalMsg);

                      alert("New price proposed successfully!");
                    } catch (err) {
                      console.error("Error proposing new price:", err);
                      alert("Failed to propose new price.");
                    }
                  }}
                  disabled={
                    bookingDetails.agreement_signed_by_client &&
                    bookingDetails.agreement_signed_by_provider
                  }
                  className={`w-full py-2 rounded text-white font-medium transition ${
                    bookingDetails.agreement_signed_by_client &&
                    bookingDetails.agreement_signed_by_provider
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-sky-600 hover:bg-sky-700"
                  }`}
                >
                  💬 Propose New Price
                </button>

                {/* ✅ Agree to Price */}
                <button
                  onClick={async () => {
                    try {
                      const res = await api.put(
                        `/bookings/${bookingId}/agree`,
                        { role },
                        axiosConfig
                      );
                      const updatedBooking = res.data.booking;
                      setBookingDetails(updatedBooking);

                      // Create message for agreement
                      const agreeMsg = {
                        bookingId,
                        sender_id: userId,
                        sender_role: role,
                        message: `✅ ${role === "user" ? "Client" : "Provider"} agreed to the price.`,
                        timestamp: new Date().toISOString(),
                      };

                      // ✅ Show in chat immediately
                      setMessages((prev) => [...prev, agreeMsg]);

                      // ✅ Emit to others
                      socket.emit("booking_updated", updatedBooking);
                      socket.emit("send_message", agreeMsg);

                      alert("You have agreed to the price!");
                    } catch (err) {
                      console.error("Error agreeing to price:", err);
                      alert("Failed to agree to price.");
                    }
                  }}
                  disabled={
                    bookingDetails.agreement_signed_by_client &&
                    bookingDetails.agreement_signed_by_provider
                  }
                  className={`w-full py-2 rounded text-white font-medium transition ${
                    bookingDetails.agreement_signed_by_client &&
                    bookingDetails.agreement_signed_by_provider
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  ✅ Agree to Price
                </button>
                <button
                  onClick={handleCancelBooking}
                  className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
                >
                  ❌ Cancel Booking
                </button>
              </div>
            )}

            {/* ✅ Show Download Agreement when both have agreed */}
            {bookingDetails.agreement_signed_by_client &&
            bookingDetails.agreement_signed_by_provider && (
              <div className="mt-4">
                <button
                  onClick={handleDownloadAgreement}
                  className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
                >
                  📄 Download Agreement
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
      {/* 🟦 Provider Profile Modal */}
      {isProfileModalOpen && providerDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-8 relative">
            {/* Close Button */}
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
            {/* 🟦 Provider Profile Modal (DaisyUI Version) */}
            <input
              type="checkbox"
              id="provider-profile-modal"
              className="modal-toggle"
              checked={isProfileModalOpen}
              readOnly
            />
            <div className="modal">
              <div className="modal-box w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl relative">
                {/* Close button */}
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="btn btn-sm btn-circle absolute right-4 top-4"
                >
                  ✕
                </button>

                {/* Provider Overview */}
                <section className="space-y-8">
                  <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                    {/* Photo */}
                    <img
                      src={
                        providerDetails.photo_url ||
                        providerDetails.photo ||
                        providerDetails.photoUrl ||
                        providerDetails.profile_picture ||
                        providerDetails.profile_picture_url ||
                        providerDetails.avatar ||
                        providerDetails.avatar_url ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                      }
                      alt="Provider"
                      className="w-32 h-32 rounded-full object-cover border bg-gray-50"
                    />
                    {/* Info */}
                    <div className="flex-1 space-y-2">
                      <h2 className="text-2xl font-bold text-gray-800">
                        {providerDetails.name}
                      </h2>
                      <p className="text-gray-600 capitalize">
                        {providerDetails.service_type} Services
                      </p>
                      <p className="text-gray-600">
                        {providerDetails.city || "Somewhere"},{" "}
                        {providerDetails.province || "Unknown"}
                      </p>

                      {/* Contact */}
                      <div className="text-sm text-gray-500 mt-3 space-y-1">
                        <p>
                          <strong>Email:</strong> {providerDetails.email}
                        </p>
                        {providerDetails.phone && (
                          <p>
                            <strong>Phone:</strong> {providerDetails.phone}
                          </p>
                        )}
                      </div>

                      {/* Bio */}
                      <p className="mt-4 text-gray-700 leading-relaxed">
                        {providerDetails.notes ||
                          "This provider hasn’t written a bio yet."}
                      </p>
                    </div>

                    {/* Rating Card */}
                  <div className="md:absolute md:right-20 md:top-10 md:w-64">
                    <div className="card bg-gradient-to-br from-green-50 to-white border border-green-200 shadow-md rounded-2xl text-center p-6">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="#facc15"
                            className="w-8 h-8 drop-shadow-sm"
                          >
                            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.11a.563.563 0 00.475.347l5.518.405a.563.563 0 01.32.989l-4.21 3.647a.563.563 0 00-.182.557l1.285 5.37a.563.563 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0l-4.725 2.885a.563.563 0 01-.84-.61l1.285-5.37a.563.563 0 00-.182-.557l-4.21-3.647a.563.563 0 01.32-.989l5.518-.405a.563.563 0 00.475-.347l2.125-5.11z" />
                          </svg>
                          <h3 className="text-4xl font-extrabold text-green-700 leading-none">
                            {reviews.length > 0
                              ? (
                                  reviews.reduce((a, b) => a + b.rating, 0) / reviews.length
                                ).toFixed(1)
                              : "5.0"}
                          </h3>
                        </div>

                        <p className="text-xs text-gray-600 mb-3">
                          Based on {reviews.length} review
                          {reviews.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  </div>

                  {/* Reviews */}
                  <div className="divider">Customer Reviews</div>

                  {reviews.length === 0 ? (
                    <p className="text-center text-gray-500">No reviews yet.</p>
                  ) : (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-gray-800">
                              {review.reviewer_name || "Anonymous User"}
                            </span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill={star <= review.rating ? "#facc15" : "none"}
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke={star <= review.rating ? "#facc15" : "#d1d5db"}
                                  className="w-4 h-4"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.11a.563.563 0 00.475.347l5.518.405a.563.563 0 01.32.989l-4.21 3.647a.563.563 0 00-.182.557l1.285 5.37a.563.563 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0l-4.725 2.885a.563.563 0 01-.84-.61l1.285-5.37a.563.563 0 00-.182-.557l-4.21-3.647a.563.563 0 01.32-.989l5.518-.405a.563.563 0 00.475-.347l2.125-5.11z"
                                  />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Modal Footer */}
                <div className="modal-action justify-center">
                  <button
                    onClick={() => setIsProfileModalOpen(false)}
                    className="btn btn-outline btn-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
  
  
};

export default ChatRoom;
