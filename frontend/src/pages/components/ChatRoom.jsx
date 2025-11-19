// src/pages/ChatRoom.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

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

const ChatRoom = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  /* ------------------------------------ */
  /* Load role + userId                   */
  /* ------------------------------------ */
  const role = localStorage.getItem("userRole"); // "user" | "provider"
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

  /* ------------------------------------ */
  /* Fetch Booking + Counterpart          */
  /* ------------------------------------ */
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await getBookingById(bookingId, axiosConfig);
        const booking = res.data;
        setBookingDetails(booking);

        // Client → Fetch Provider Info
        if (role === "user" && booking.provider_id) {
          const [pRes, rRes] = await Promise.all([
            getPublicProvider(booking.provider_id),
            getProviderReviews(booking.provider_id),
          ]);

          setCounterpartDetails(pRes.data.data);
          setReviews(rRes.data.data);
        }

        // Provider → Fetch Client Info
        if (role === "provider" && booking.client_id) {
          const clientRes = await getPublicUser(booking.client_id);

          const clientData =
            clientRes.data?.data ||
            clientRes.data?.user ||
            clientRes.data?.[0] ||
            clientRes.data ||
            null;

          setCounterpartDetails(clientData);
        }
      } catch (err) {
        console.error("Booking fetch failed:", err);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, token, role, navigate]);

  /* ------------------------------------ */
  /* Socket Setup                          */
  /* ------------------------------------ */
  useEffect(() => {
    if (loading || !bookingDetails) return;

    if (!socket.connected) socket.connect();

    socket.emit("join_room", { bookingId: Number(bookingId), role });

    const handleLoadMessages = (history) => {
      const normalized = (history || []).map((msg) => {
        const sender_id = Number(msg.sender_id ?? msg.senderId);

        let sender_role = msg.sender_role || msg.senderRole;
        if (!sender_role) {
          sender_role =
            sender_id === userId
              ? role.toLowerCase()
              : role === "user"
              ? "provider"
              : "user";
        } else sender_role = sender_role.toLowerCase();

        return { ...msg, sender_id, sender_role };
      });
      setMessages(normalized);
    };

    const handleReceiveMessage = (data) => {
      // Avoid echo messages
      if (Number(data.sender_id) === userId) return;
      setMessages((prev) => [...prev, data]);
    };

    const handleBookingUpdated = (updated) =>
      setBookingDetails(updated);

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

  /* ------------------------------------ */
  /* Send Message                          */
  /* ------------------------------------ */
  const sendMessage = () => {
    if (!message.trim()) return;

    const msg = {
      bookingId: Number(bookingId),
      sender_id: userId,
      sender_role: role.toLowerCase(),
      message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, msg]);
    socket.emit("send_message", msg);
    setMessage("");
  };

  /* ------------------------------------ */
  /* Price Negotiation                    */
  /* ------------------------------------ */
  const handleProposePrice = async () => {
    try {
      const newPrice = bookingDetails.price;
      if (!newPrice || isNaN(newPrice) || Number(newPrice) <= 0)
        return alert("Enter valid price.");

      const res = await updateBookingPrice(bookingId, newPrice, axiosConfig);
      const updated = res.data.booking;

      setBookingDetails(updated);

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
      socket.emit("booking_updated", updated);
      socket.emit("send_message", proposalMsg);

      alert("New price proposed!");
    } catch {
      alert("Failed to propose price.");
    }
  };

  const handleAgreePrice = async () => {
    try {
      const res = await agreeToPrice(bookingId, role, axiosConfig);
      const updated = res.data.booking;

      setBookingDetails(updated);

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
      socket.emit("booking_updated", updated);
      socket.emit("send_message", agreeMsg);

      alert("Price agreement successful!");
    } catch {
      alert("Failed to agree to price.");
    }
  };

  /* ------------------------------------ */
  /* Booking Actions                       */
  /* ------------------------------------ */
  const handleProceedToPayment = async () => {
    try {
      const res = await createPaymentIntent(bookingDetails.id, axiosConfig);
      if (res.data.url) window.location.href = res.data.url;
    } catch {
      alert("Payment session failed.");
    }
  };

  const handleDownloadAgreement = async () => {
    try {
      if (bookingDetails.agreement_pdf_url)
        return window.open(bookingDetails.agreement_pdf_url, "_blank");

      const response = await fetchAgreementJson(
        bookingDetails.id,
        axiosConfig
      );

      if (response.data?.url) window.open(response.data.url, "_blank");
      else alert("No agreement available.");
    } catch {
      alert("Failed to download agreement.");
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm("Cancel this booking?")) return;

    try {
      await cancelBooking(bookingId, axiosConfig);
      alert("Booking cancelled.");
      navigate("/");
    } catch {
      alert("Cancellation failed.");
    }
  };

  const handleBackToProfile = () => {
    if (role === "provider") {
      const providerId =
        localStorage.getItem("providerId") ||
        bookingDetails?.provider_id ||
        counterpartDetails?.id;

      if (!providerId) return navigate("/"); // fallback

      navigate(`/profileProvider/${providerId}`);
    } else {
      const userId =
        localStorage.getItem("userId") ||
        bookingDetails?.client_id ||
        counterpartDetails?.id;

      if (!userId) return navigate("/");

      navigate(`/profile/${userId}`);
    }
  };


  /* ------------------------------------ */
  /* Loading Screen                        */
  /* ------------------------------------ */
  if (loading && !bookingDetails)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        Loading chat...
      </div>
    );

  /* ------------------------------------ */
  /* RENDER                                */
  /* ------------------------------------ */
  return (
    <div className="flex h-screen bg-gray-50">
      {/* LEFT PANEL */}
      <ChatSidebar
        role={role}
        bookingDetails={bookingDetails}
        counterpartDetails={counterpartDetails}
        reviews={reviews}
        isLoading={loading}
        onBackToProfile={handleBackToProfile}
        onViewProfile={() => setIsProfileModalOpen(true)}
      />

      {/* CENTER CHAT */}
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

      {/* RIGHT PANEL */}
      <div className="w-80 bg-white p-6 flex flex-col justify-between border-l border-gray-200">
        {bookingDetails && (
          <div className="text-sm text-gray-700 space-y-2">

            <p><strong>Booking ID:</strong> {bookingDetails.id}</p>
            <p><strong>Notes:</strong> {bookingDetails.notes || "N/A"}</p>
            <p><strong>Price:</strong> ${Number(bookingDetails.price || 0).toFixed(2)}</p>
            <p><strong>Scheduled:</strong> {new Date(bookingDetails.scheduled_date).toLocaleString()}</p>

            {/* Status */}
            <p>
              <strong>Status:</strong>{" "}
              <span className={`px-2 py-0.5 rounded text-white ${
                bookingDetails.status === "Negotiating"
                  ? "bg-yellow-500"
                  : bookingDetails.status === "Confirmed"
                  ? "bg-green-600"
                  : bookingDetails.status === "Cancelled"
                  ? "bg-red-600"
                  : bookingDetails.status === "Completed"
                  ? "bg-blue-600"
                  : "bg-gray-600"
              }`}>
                {bookingDetails.status}
              </span>
            </p>

            {/* PRICE NEGOTIATION */}
            {["Pending", "Negotiating"].includes(bookingDetails.status) && (
              <div className="mt-3 space-y-2">

                <input
                  type="number"
                  value={bookingDetails.price || ""}
                  placeholder="Enter proposed price"
                  onChange={(e) =>
                    setBookingDetails((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />

                <button
                  onClick={handleProposePrice}
                  className="w-full bg-sky-600 text-white py-2 rounded hover:bg-sky-700"
                >
                  💬 Propose Price
                </button>

                <button
                  onClick={handleAgreePrice}
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                >
                  ✅ Agree to Price
                </button>

                <button
                  onClick={handleCancelBooking}
                  className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
                >
                  ❌ Cancel Booking
                </button>
              </div>
            )}

            {/* AGREEMENT DOWNLOAD */}
            {bookingDetails.agreement_signed_by_client &&
              bookingDetails.agreement_signed_by_provider && (
                <button
                  onClick={handleDownloadAgreement}
                  className="w-full mt-4 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
                >
                  📄 Download Agreement
                </button>
              )}

            {/* PAYMENT BUTTON (client only) */}
            {bookingDetails.status === "Confirmed" && role === "user" && (
              <button
                onClick={handleProceedToPayment}
                className="w-full mt-6 bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
              >
                💳 Proceed to Payment
              </button>
            )}
          </div>
        )}
      </div>

      {/* PROFILE MODAL */}
      <ProviderProfileModal
        isOpen={isProfileModalOpen}
        providerDetails={counterpartDetails}
        reviews={reviews}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default ChatRoom;
