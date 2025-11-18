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
import BookingInfoPanel from "../../components/booking/BookingInfoPanel";

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

      {/* RIGHT: BOOKING INFO PANEL */}
      <BookingInfoPanel
        bookingDetails={bookingDetails}
        role={role}
        onPriceChange={handlePriceChange}
        onProposePrice={handleProposePrice}
        onAgreePrice={handleAgreePrice}
        onCancelBooking={handleCancelBooking}
        onDownloadAgreement={handleDownloadAgreement}
        onProceedToPayment={handleProceedToPayment}
      />

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