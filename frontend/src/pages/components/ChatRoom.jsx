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

  const role = localStorage.getItem("userRole");
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

  // MOBILE toggles
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [mobileRightPanel, setMobileRightPanel] = useState(false);

  const token = localStorage.getItem("authToken");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  /* -------------------------------------------------- */
  /* Fetch Booking + Counterpart                        */
  /* -------------------------------------------------- */
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        if (!token) return navigate("/login");

        const res = await getBookingById(bookingId, axiosConfig);
        const booking = res.data;
        setBookingDetails(booking);

        if (role === "user" && booking.provider_id) {
          const [pRes, rRes] = await Promise.all([
            getPublicProvider(booking.provider_id),
            getProviderReviews(booking.provider_id),
          ]);

          setCounterpartDetails(pRes.data.data);
          setReviews(rRes.data.data);
        }

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
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, role, token, navigate]);

  /* -------------------------------------------------- */
  /* SOCKET setup                                       */
  /* -------------------------------------------------- */
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
              ? role
              : role === "user"
              ? "provider"
              : "user";
        }

        return {
          ...msg,
          sender_id,
          sender_role: sender_role.toLowerCase(),
        };
      });

      setMessages(normalized);
    };

    socket.on("load_messages", handleLoadMessages);
    socket.on("receive_message", (data) => {
      if (Number(data.sender_id) === userId) return;
      setMessages((prev) => [...prev, data]);
    });

    socket.on("booking_updated", (updated) => {
      setBookingDetails(updated);
    });

    return () => {
      socket.emit("leave_room", { bookingId: Number(bookingId), role });
      socket.off("load_messages");
      socket.off("receive_message");
      socket.off("booking_updated");
    };
  }, [bookingId, bookingDetails, loading, role, userId]);

  /* -------------------------------------------------- */
  /* Send Message                                       */
  /* -------------------------------------------------- */
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

  /* -------------------------------------------------- */
  /* Price negotiation                                  */
  /* -------------------------------------------------- */
  const handleProposePrice = async () => {
    try {
      const newPrice = bookingDetails.price;

      if (!newPrice || Number(newPrice) <= 0)
        return alert("Enter valid price");

      const res = await updateBookingPrice(bookingId, newPrice, axiosConfig);
      const updated = res.data.booking;
      setBookingDetails(updated);

      const proposalMsg = {
        bookingId,
        sender_id: userId,
        sender_role: role,
        message: `💬 ${
          role === "user" ? "Client" : "Provider"
        } proposed a new price: $${newPrice}`,
        timestamp: new Date().toISOString(),
      };

      socket.emit("send_message", proposalMsg);
      socket.emit("booking_updated", updated);
      setMessages((prev) => [...prev, proposalMsg]);
    } catch {
      alert("Failed");
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
        sender_role: role,
        message: `✅ ${
          role === "user" ? "Client" : "Provider"
        } agreed to the price.`,
        timestamp: new Date().toISOString(),
      };

      socket.emit("send_message", agreeMsg);
      socket.emit("booking_updated", updated);
      setMessages((prev) => [...prev, agreeMsg]);
    } catch {
      alert("Failed");
    }
  };

  /* -------------------------------------------------- */
  /* Booking actions                                    */
  /* -------------------------------------------------- */
  const handleProceedToPayment = async () => {
    try {
      const res = await createPaymentIntent(bookingDetails.id, axiosConfig);
      if (res.data.url) window.location.href = res.data.url;
    } catch {
      alert("Payment failed");
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
    } catch {
      alert("Download failed");
    }
  };

  const handleGoToExecution = () => {
    navigate(`/execution/${bookingId}`);
  }

  const handleCancelBooking = async () => {
    if (!window.confirm("Cancel booking?")) return;

    try {
      await cancelBooking(bookingId, axiosConfig);
      navigate("/");
    } catch {
      alert("Failed");
    }
  };

  const handleBackToProfile = () => {
    if (role === "provider") {
      navigate(
        `/profileProvider/${
          localStorage.getItem("providerId") ||
          bookingDetails.provider_id
        }`
      );
    } else {
      navigate(
        `/profile/${
          localStorage.getItem("userId") || bookingDetails.client_id
        }`
      );
    }
  };

  if (loading && !bookingDetails)
    return <div className="flex items-center justify-center h-screen">Loading...</div>;

  /* -------------------------------------------------- */
  /* RENDER START                                        */
  /* -------------------------------------------------- */
  return (
    <div className="h-screen bg-gray-50 grid grid-cols-1 md:grid-cols-[300px_1fr_320px]">

      {/* ---------------------------------- */}
      {/* SIDEBAR (Desktop)                  */}
      {/* ---------------------------------- */}
      <div className="hidden md:block border-r border-gray-200 bg-white">
        <ChatSidebar
          role={role}
          bookingDetails={bookingDetails}
          counterpartDetails={counterpartDetails}
          reviews={reviews}
          onBackToProfile={handleBackToProfile}
          onViewProfile={() => setIsProfileModalOpen(true)}
        />
      </div>

      {/* ---------------------------------- */}
      {/* MOBILE SIDEBAR DRAWER (FIXED)      */}
      {/* ---------------------------------- */}
      {mobileSidebar && (
        <div className="fixed inset-0 z-50 flex bg-black/40 md:hidden">
          <div className="w-72 h-full bg-white shadow-xl p-4 overflow-y-auto">
            <ChatSidebar
              role={role}
              bookingDetails={bookingDetails}
              counterpartDetails={counterpartDetails}
              reviews={reviews}
              onBackToProfile={handleBackToProfile}
              onViewProfile={() => {
                setIsProfileModalOpen(true);
                setMobileSidebar(false); // close menu before modal
              }}
            />

            <button
              onClick={() => setMobileSidebar(false)}
              className="mt-4 w-full bg-gray-200 py-2 rounded"
            >
              Close
            </button>
          </div>

          {/* Click outside closes */}
          <div className="flex-1" onClick={() => setMobileSidebar(false)} />
        </div>
      )}

      {/* ---------------------------------- */}
      {/* CHAT COLUMN (CENTER)               */}
      {/* ---------------------------------- */}
      <div className="flex flex-col bg-gray-100 border-r border-gray-200">

        {/* MOBILE TOP BAR — inside this column */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b">
          <button
            onClick={() => {
              setIsProfileModalOpen(false); // IMPORTANT FIX
              setMobileSidebar(true);
            }}
            className="p-2 rounded-lg border bg-gray-100"
          >
            ☰ Menu
          </button>
          <h2 className="font-semibold text-gray-800 text-lg">Chat Room</h2>
        </div>

        {/* DESKTOP HEADER */}
        <div className="hidden md:block border-b px-6 py-4 bg-white">
          <h2 className="font-semibold text-gray-800 text-lg">Chat Room</h2>
        </div>

        <ChatMessages
          messages={messages}
          currentUserId={userId}
          currentRole={role}
        />

        {/* MOBILE RIGHT PANEL BUTTON */}
        {bookingDetails && (
          <button
            onClick={() => {
              setIsProfileModalOpen(false);
              setMobileRightPanel(true);
            }}
            className="md:hidden w-full bg-gray-900 text-white py-3"
          >
            Show Booking Details
          </button>
        )}

        <MessageInput
          value={message}
          onChange={setMessage}
          onSend={sendMessage}
        />
      </div>

      {/* ---------------------------------- */}
      {/* RIGHT PANEL (DESKTOP)              */}
      {/* ---------------------------------- */}
      <div className="hidden md:block w-80 bg-white p-6 border-l border-gray-200">
        <RightPanel
          bookingDetails={bookingDetails}
          role={role}
          setBookingDetails={setBookingDetails}
          handleProposePrice={handleProposePrice}
          handleAgreePrice={handleAgreePrice}
          handleCancelBooking={handleCancelBooking}
          handleDownloadAgreement={handleDownloadAgreement}
          handleProceedToPayment={handleProceedToPayment}
          handleGoToExecution={handleGoToExecution}
        />
      </div>

      {/* ---------------------------------- */}
      {/* MOBILE RIGHT PANEL (BOTTOM SHEET)  */}
      {/* ---------------------------------- */}
      {mobileRightPanel && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 md:hidden">
          <div className="bg-white w-full rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto shadow-xl">
            <RightPanel
              bookingDetails={bookingDetails}
              role={role}
              setBookingDetails={setBookingDetails}
              handleProposePrice={handleProposePrice}
              handleAgreePrice={handleAgreePrice}
              handleCancelBooking={handleCancelBooking}
              handleDownloadAgreement={handleDownloadAgreement}
              handleProceedToPayment={handleProceedToPayment}
              handleGoToExecution={handleGoToExecution}
            />

            <button
              onClick={() => setMobileRightPanel(false)}
              className="w-full mt-4 bg-gray-800 text-white py-3 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------- */}
      {/* PROFILE MODAL (Z-40 so sidebar wins) */}
      {/* ---------------------------------- */}
      <ProviderProfileModal
        isOpen={isProfileModalOpen}
        providerDetails={counterpartDetails}
        reviews={reviews}
        onClose={() => {
          setIsProfileModalOpen(false);
          setMobileSidebar(false);
          setMobileRightPanel(false);
        }}
      />

    </div>
  );
};

/* -------------------------------------------------- */
/* RIGHT PANEL Component (desktop + mobile)           */
/* -------------------------------------------------- */
const RightPanel = ({
  bookingDetails,
  role,
  setBookingDetails,
  handleProposePrice,
  handleAgreePrice,
  handleCancelBooking,
  handleDownloadAgreement,
  handleProceedToPayment,
  handleGoToExecution,
}) => (
  <div className="text-sm text-gray-700 space-y-3">
    <p><strong>Booking ID:</strong> {bookingDetails.id}</p>
    <p><strong>Notes:</strong> {bookingDetails.notes || "N/A"}</p>
    <p><strong>Price:</strong> ${Number(bookingDetails.price || 0).toFixed(2)}</p>
    <p>
      <strong>Scheduled:</strong>{" "}
      {new Date(bookingDetails.scheduled_date).toLocaleString()}
    </p>

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

    {/* Negotiation panel */}
    {["Pending", "Negotiating"].includes(bookingDetails.status) && (
      <div className="mt-3 space-y-2">

        <input
          type="number"
          value={bookingDetails.price || ""}
          placeholder="Enter new price"
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
          className="w-full bg-sky-600 text-white py-2 rounded"
        >
          💬 Propose Price
        </button>

        <button
          onClick={handleAgreePrice}
          className="w-full bg-green-600 text-white py-2 rounded"
        >
          ✅ Agree
        </button>

        <button
          onClick={handleCancelBooking}
          className="w-full bg-red-600 text-white py-2 rounded"
        >
          ❌ Cancel Booking
        </button>
      </div>
    )}

    {/* Agreement */}
    {bookingDetails.agreement_signed_by_client &&
      bookingDetails.agreement_signed_by_provider && (
        <button
          onClick={handleDownloadAgreement}
          className="w-full mt-4 bg-indigo-600 text-white py-2 rounded"
        >
          📄 Download Agreement
        </button>
      )}

    {/* Payment */}
    {bookingDetails.status === "Confirmed" && role === "user" && (
      <button
        onClick={handleProceedToPayment}
        className="w-full mt-6 bg-purple-600 text-white py-2 rounded"
      >
        💳 Proceed to Payment
      </button>
    )}

    {/* Go to Execution */}
    {bookingDetails.status === "Paid" && role === "provider" && (
      <button
        onClick={handleGoToExecution}
        className="w-full mt-6 bg-blue-600 text-white py-2 rounded"
      >
        🚀 Go to Execution
      </button>
    )}
  </div>
);

export default ChatRoom;
