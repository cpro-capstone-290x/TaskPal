// src/pages/profile/User/ExecutionPage.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api";

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const getStatusClass = (status) => {
  switch (status) {
    case "Paid":
      return "bg-emerald-100 text-emerald-700";
    case "Confirmed":
      return "bg-green-100 text-green-700";
    case "Negotiating":
      return "bg-orange-100 text-orange-700";
    case "Pending":
      return "bg-yellow-100 text-yellow-700";
    case "Completed":
      return "bg-blue-100 text-blue-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const StatusBadge = ({ label, className = "" }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-medium ${className}`}>
    {label}
  </span>
);

const InfoRow = ({ label, value }) => (
  <p className="text-sm text-gray-700">
    <span className="font-semibold">{label}: </span>
    {value ?? "N/A"}
  </p>
);

const DocumentLink = ({ label, url }) =>
  url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-blue-600 underline text-sm"
    >
      {label}
    </a>
  ) : (
    <p className="text-xs text-gray-400">{label} not uploaded</p>
  );

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

const ExecutionPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const token =
    localStorage.getItem("authToken") ||
    localStorage.getItem("userToken") ||
    localStorage.getItem("providerToken");

  const [loading, setLoading] = useState(true);
  const [execution, setExecution] = useState(null);
  const [booking, setBooking] = useState(null);
  const [provider, setProvider] = useState(null);

  const [updating, setUpdating] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  /* ---------------------------------------------------------------------- */
  /* FETCH EXECUTION                                                        */
  /* ---------------------------------------------------------------------- */

  const fetchExecution = useCallback(async () => {
    try {
      const res = await api.get(`/execution/${bookingId}`);
      const data = res.data?.data || res.data;
      setExecution(data);
      return data;
    } catch (err) {
      console.error("Execution fetch error:", err);
      return null;
    }
  }, [bookingId]);

  /* ---------------------------------------------------------------------- */
  /* FETCH BOOKING + NORMALIZE                                              */
  /* ---------------------------------------------------------------------- */

  const fetchBooking = useCallback(async (id) => {
    try {
      const res = await api.get(`/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let raw = res.data?.data ?? res.data;
      if (Array.isArray(raw)) raw = raw[0];
      if (!raw || typeof raw !== "object") raw = {};

      const normalized = {
        ...raw,
        status: raw.status ? String(raw.status).trim() : "",
        completedclient: raw.completedclient
          ? raw.completedclient.trim().toLowerCase()
          : "",
        completedprovider: raw.completedprovider
          ? raw.completedprovider.trim().toLowerCase()
          : "",
      };

      setBooking(normalized);
      return normalized;
    } catch (err) {
      console.error("Booking fetch error:", err);
      return null;
    }
  }, [token]);

  /* ---------------------------------------------------------------------- */
  /* FETCH PROVIDER                                                          */
  /* ---------------------------------------------------------------------- */

  const fetchProvider = useCallback(async (providerId) => {
    try {
      const res = await api.get(`/providers/public/${providerId}`);
      const data = res.data?.data || res.data;
      setProvider(data);
      return data;
    } catch (err) {
      console.error("Provider fetch error:", err);
      return null;
    }
  }, []);

  /* ---------------------------------------------------------------------- */
  /* INITIAL LOAD                                                            */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      const exec = await fetchExecution();
      if (!mounted || !exec) return setLoading(false);

      await Promise.all([
        fetchBooking(exec.booking_id),
        fetchProvider(exec.provider_id),
      ]);

      setLoading(false);
    };

    load();

    return () => (mounted = false);
  }, [fetchExecution, fetchBooking, fetchProvider]);

  /* ---------------------------------------------------------------------- */
  /* REVIEW CHECK (ALREADY EXISTS?)                                          */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const checkExistingReview = async () => {
      try {
        const res = await api.get(`/reviews/booking/${bookingId}`);
        if (res.data?.data) setReviewSubmitted(true);
      } catch {}
    };

    checkExistingReview();
  }, [bookingId]);

  /* ---------------------------------------------------------------------- */
  /* CONFIRM COMPLETION (CLIENT SIDE)                                       */
  /* ---------------------------------------------------------------------- */

  const confirmCompletion = async () => {
    setUpdating(true);
    try {
      const res = await api.put(
        `/execution/${bookingId}/update`,
        { field: "completedclient" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExecution(res.data?.data || res.data);
    } catch (err) {
      console.error("Client confirmation error:", err);
      alert("Failed to confirm completion.");
    } finally {
      setUpdating(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* REVIEW SUBMISSION                                                      */
  /* ---------------------------------------------------------------------- */

  const submitReview = async () => {
    if (!rating || !comment.trim())
      return alert("Please provide both rating and comment.");

    setSubmittingReview(true);

    try {
      await api.post(
        "/reviews",
        {
          booking_id: bookingId,
          provider_id: provider.provider_id || execution.provider_id,
          rating,
          comment,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setReviewSubmitted(true);
      setShowReviewModal(false);
    } catch (err) {
      alert("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* SAFE STATES                                                             */
  /* ---------------------------------------------------------------------- */

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Loading execution details...
      </div>
    );

  if (!execution)
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Execution not found.
      </div>
    );

  /* ---------------------------------------------------------------------- */
  /* DERIVED FLAGS                                                           */
  /* ---------------------------------------------------------------------- */

  const {
    validatedcredential,
    completedprovider,
    completedclient,
    booking_id,
    payment_id,
  } = execution;

  const providerCompleted =
    validatedcredential === "completed" &&
    completedprovider === "completed";

  const allDone =
    completedprovider === "completed" &&
    completedclient === "completed";

  /* ---------------------------------------------------------------------- */
  /* UI START                                                                */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* HEADER */}
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-green-700">
          Task Execution #{booking_id}
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg"
          >
            🔄 Refresh
          </button>

          <button
            onClick={() => navigate(`/chat/${bookingId}/user`)}
            className="bg-green-100 text-green-700 px-3 py-2 rounded-lg"
          >
            💬 Chat
          </button>

          <button
            onClick={() => navigate(-1)}
            className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex justify-center py-10 px-4">
        <div className="w-full max-w-5xl bg-white rounded-2xl border shadow-sm p-8 space-y-10">

          {/* PROVIDER INFO */}
          {provider && (
            <section className="flex gap-6 border-b pb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border shadow">
                <img
                  src={
                    provider?.profile_picture_url ||
                    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  alt="Provider"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Provider Information</h2>

                <InfoRow label="Name" value={provider.name} />
                <InfoRow label="Email" value={provider.email} />
                <InfoRow
                  label="Location"
                  value={`${provider.city || "N/A"}, ${provider.province || ""}`}
                />
              </div>
            </section>
          )}

          {/* BOOKING INFO */}
          <section>
            <h2 className="text-xl font-semibold mb-3 border-b pb-2">
              Booking Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Booking ID" value={booking_id} />
              <InfoRow label="Payment ID" value={payment_id || "None"} />

              <InfoRow
                label="Scheduled Date"
                value={
                  booking?.scheduled_date
                    ? new Date(booking.scheduled_date).toLocaleString()
                    : "Not set"
                }
              />

              <InfoRow
                label="Price"
                value={
                  booking?.price
                    ? `$${Number(booking.price).toFixed(2)}`
                    : "N/A"
                }
              />

              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span className="font-semibold">Status:</span>
                <StatusBadge
                  label={booking?.status}
                  className={getStatusClass(booking?.status)}
                />
              </div>
            </div>
          </section>

          {/* TASK PROGRESS */}
          <section>
            <h2 className="text-xl font-semibold mb-3 border-b pb-2">
              Task Progress
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Credential Validation */}
              <div className="p-6 bg-gray-50 border rounded-xl text-center">
                <h3 className="font-semibold mb-2">Credential Validation</h3>

                <StatusBadge
                  label={
                    validatedcredential === "completed"
                      ? "Validated"
                      : "Waiting for Provider"
                  }
                  className={
                    validatedcredential === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }
                />
              </div>

              {/* Provider Completion */}
              <div className="p-6 bg-gray-50 border rounded-xl text-center">
                <h3 className="font-semibold mb-2">Provider Completion</h3>

                <StatusBadge
                  label={
                    completedprovider === "completed"
                      ? "Completed"
                      : "Waiting for Provider"
                  }
                  className={
                    completedprovider === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }
                />
              </div>

              {/* Client Confirmation */}
              <div className="p-6 bg-gray-50 border rounded-xl text-center">
                <h3 className="font-semibold mb-2">Client Confirmation</h3>

                <StatusBadge
                  label={
                    completedclient === "completed"
                      ? "Client Confirmed"
                      : providerCompleted
                      ? "Ready for Confirmation"
                      : "Pending Provider Steps"
                  }
                  className={
                    completedclient === "completed"
                      ? "bg-green-100 text-green-700"
                      : providerCompleted
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-200 text-gray-600"
                  }
                />

                {/* CONFIRM BUTTON */}
                {providerCompleted && completedclient !== "completed" && (
                  <button
                    onClick={confirmCompletion}
                    disabled={updating}
                    className={`w-full mt-3 py-2 rounded-full ${
                      updating
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {updating ? "Confirming..." : "Confirm Completion"}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <div className="border-t pt-4 text-center">
            {allDone ? (
              <>
                <p className="text-green-700 font-semibold mb-3">
                  ✅ Task fully completed!
                </p>

                <button
                  onClick={() => setShowReviewModal(true)}
                  disabled={reviewSubmitted}
                  className={`px-6 py-2 rounded-full font-medium transition ${
                    reviewSubmitted
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {reviewSubmitted
                    ? "Review Submitted ✓"
                    : "✍️ Leave a Review"}
                </button>
              </>
            ) : (
              <p className="text-gray-500 text-sm">
                Waiting for provider and client completion.
              </p>
            )}
          </div>

        </div>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* REVIEW MODAL                                                      */}
      {/* ------------------------------------------------------------------ */}

      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Leave a Review
            </h3>

            {/* Rating Stars */}
            <div className="flex justify-center mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl ${
                    rating >= star ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Comment */}
            <textarea
              rows="3"
              className="w-full border p-2 rounded-md text-sm focus:ring focus:ring-blue-200"
              placeholder="Write your feedback..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={submitReview}
                disabled={submittingReview}
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  submittingReview
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {submittingReview ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExecutionPage;
