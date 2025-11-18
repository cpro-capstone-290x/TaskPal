// src/pages/ChatRoom.jsx
import React, { useEffect, useState } from "react";
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

import { socket } from "../services/socket.js";
import {
  getBookingById,
  updateBookingPrice,
  agreeToPrice,
  cancelBooking,
  createPaymentIntent,
  fetchAgreementJson,
} from "../services/bookingService.js";
import {
  getPublicProvider,
  getPublicUser,
} from "../services/providerService.js";
import { getProviderReviews } from "../services/reviewService.js";

import ChatSidebar from "../components/chat/ChatSidebar";
import ChatMessages from "../components/chat/ChatMessages";
import MessageInput from "../components/chat/MessageInput";
import ProviderProfileModal from "../components/chat/ProviderProfileModal";
import BookingInfoPanel from "../components/booking/BookingInfoPanel";

const ChatRoom = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const role = localStorage.getItem("userRole"); // "user" or "provider"
  const storedUserId =
    role === "provider"
      ? Number(localStorage.getItem("providerId"))
      : Number(localStorage.getItem("userId"));

  const [userId] = useState(storedUserId);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [counterpartDetails, setCounterpartDetails] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("authToken");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  /* ------------------------------ Fetch Booking ------------------------------ */
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        if (!token) {
          alert("Please log in to access the chat.");
          navigate("/login");
          return;
        }

        const res = await getBookingById(bookingId, axiosConfig);
        const booking = res.data;
        setBookingDetails(booking);

        /* ------------------------------ CLIENT SIDE ------------------------------ */
        if (role === "user" && booking.provider_id) {
          const [providerRes, reviewsRes] = await Promise.all([
            getPublicProvider(booking.provider_id),
            getProviderReviews(booking.provider_id),
          ]);

          setCounterpartDetails(providerRes.data.data);
          setReviews(reviewsRes.data.data);
        }

        /* ------------------------------ PROVIDER SIDE ------------------------------ */
        else if (role === "provider" && booking.client_id) {
          try {
            const clientRes = await getPublicUser(booking.client_id);

            const clientData =
              clientRes.data?.data ||
              clientRes.data?.user ||
              clientRes.data?.[0] ||
              clientRes.data ||
              null;

            setCounterpartDetails(clientData);
          } catch (innerErr) {
            console.warn("❌ CLIENT FETCH ERROR", innerErr?.response?.data);
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
  }, [bookingId, navigate, token, role]);

  /* ------------------------------ Socket Setup ------------------------------ */
  useEffect(() => {
    if (loading || !bookingDetails) return;

    if (!socket.connected) socket.connect();

    socket.emit("join_room", { bookingId: Number(bookingId), role });

    /* ---------- Normalize incoming history ---------- */
    const handleLoadMessages = (history) => {
      const normalized = (history || []).map((msg) => {
        const sender_id = Number(msg.sender_id ?? msg.senderId);

        let sender_role = msg.sender_role || msg.senderRole;

        // Infer role only when missing
        if (!sender_role) {
          sender_role =
            sender_id === userId
              ? role.toLowerCase()
              : role === "user"
              ? "provider"
              : "user";
        } else {
          sender_role = String(sender_role).toLowerCase();
        }

        return { ...msg, sender_id, sender_role };
      });

      setMessages(normalized);
    };

    /* ---------- Live incoming messages ---------- */
    const handleReceiveMessage = (data) => {
      const senderId = Number(data.sender_id);

      // avoid echo
      if (senderId === userId) return;

      setMessages((prev) => [...prev, data]);
    };

    const handleBookingUpdated = (updatedBooking) =>
      setBookingDetails(updatedBooking);

    socket.on("load_messages", handleLoadMessages);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("booking_updated", handleBookingUpdated);

    return () => {
      socket.emit("leave_room", { bookingId: Number(bookingId), role });
      socket.off("load_messages", handleLoadMessages);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("booking_updated", handleBookingUpdated);
    };
  }, [bookingId, bookingDetails, loading, role, userId]);

  /* ------------------------------ SEND MESSAGE ------------------------------ */
  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      bookingId: Number(bookingId),
      sender_id: userId,
      sender_role: role.toLowerCase(),
      message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    socket.emit("send_message", newMessage);
    setMessage("");
  };

  /* ------------------------------ BOOKING ACTIONS ------------------------------ */
  const handlePriceChange = (val) =>
    setBookingDetails((prev) => (prev ? { ...prev, price: val } : prev));

  const handleProposePrice = async () => {
    if (!bookingDetails) return;

    const newPrice = bookingDetails.price;

    if (!newPrice || isNaN(newPrice) || Number(newPrice) <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    try {
      const res = await updateBookingPrice(bookingId, newPrice, axiosConfig);
      const updatedBooking = res.data.booking;

      setBookingDetails(updatedBooking);

      const proposalMsg = {
        bookingId,
        sender_id: userId,
        sender_role: role.toLowerCase(),
        message: `💬 ${
          role === "user" ? "Client" : "Provider"
        } proposed a new price: $${newPrice}`,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, proposalMsg]);

      socket.emit("booking_updated", updatedBooking);
      socket.emit("send_message", proposalMsg);

      alert("New price proposed successfully!");
    } catch {
      alert("Failed to propose new price.");
    }
  };

  const handleAgreePrice = async () => {
    if (!bookingDetails) return;

    try {
      const res = await agreeToPrice(bookingId, role, axiosConfig);
      const updatedBooking = res.data.booking;

      setBookingDetails(updatedBooking);

      const agreeMsg = {
        bookingId,
        sender_id: userId,
        sender_role: role.toLowerCase(),
        message: `✅ ${
          role === "user" ? "Client" : "Provider"
        } agreed to the price.`,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, agreeMsg]);

      socket.emit("booking_updated", updatedBooking);
      socket.emit("send_message", agreeMsg);

      alert("You have agreed to the price!");
    } catch {
      alert("Failed to agree to price.");
    }
  };

  const handleProceedToPayment = async () => {
    if (!bookingDetails) return;

    try {
      const res = await createPaymentIntent(bookingDetails.id, axiosConfig);
      if (res.data.url) window.location.href = res.data.url;
      else alert("Failed to create payment session.");
    } catch {
      alert("Something went wrong while initiating payment.");
    }
  };

  const handleDownloadAgreement = async () => {
    try {
      if (bookingDetails.agreement_pdf_url)
        return window.open(bookingDetails.agreement_pdf_url, "_blank");

      const response = await fetchAgreementJson(bookingDetails.id, axiosConfig);
      if (response.data?.url) window.open(response.data.url, "_blank");
      else alert("No agreement available.");
    } catch {
      alert("Failed to download agreement.");
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;

    try {
      await cancelBooking(bookingId, axiosConfig);
      alert("Booking cancelled successfully.");
      navigate("/");
    } catch {
      alert("Failed to cancel booking.");
    }
  };

  const handleBackToProfile = () => {
    const currentRole = localStorage.getItem("userRole");

    if (currentRole === "provider") {
      navigate(`/profileProvider/${localStorage.getItem("providerId")}`);
    } else {
      navigate(`/profile/${localStorage.getItem("userId")}`);
    }
  };

  /* ------------------------------ LOADING SCREEN ------------------------------ */
  if (loading && !bookingDetails)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        Loading chat...
      </div>
    );

  /* ------------------------------ RENDER ------------------------------ */
  return (
    <div className="flex h-screen bg-gray-50">
      {/* LEFT SIDEBAR */}
      <ChatSidebar
        role={role}
        bookingDetails={bookingDetails}
        counterpartDetails={counterpartDetails}
        reviews={reviews}
        isLoading={loading}
        onBackToProfile={handleBackToProfile}
        onViewProfile={() => setIsProfileModalOpen(true)}
      />

      {/* CENTER: MESSAGES */}
      <div className="flex flex-col flex-1 bg-gray-100 border-r border-gray-200">
        <div className="border-b px-6 py-4 bg-white">
          <h2 className="font-semibold text-gray-800 text-lg">Chat Room</h2>
        </div>

        <ChatMessages
          messages={messages}
          currentUserId={userId}
          currentRole={role}
        />

        <MessageInput value={message} onChange={setMessage} onSend={sendMessage} />
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