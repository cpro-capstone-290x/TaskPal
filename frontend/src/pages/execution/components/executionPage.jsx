import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../../api";

const ExecutionPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  // ⭐ Review modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // ✅ Fetch execution details
  const fetchExecution = async () => {
    try {
      const res = await api.get(`/execution/${bookingId}`);
      setExecution(res.data.data || res.data);
    } catch (err) {
      console.error("Error fetching execution:", err);
      setError("Failed to load execution details.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Check if review already exists
  const checkExistingReview = async () => {
    try {
      const res = await api.get(`/reviews/booking/${bookingId}`);
      if (res.data?.data) setReviewSubmitted(true);
    } catch (err) {
      console.log("No review found yet (this is fine).");
    }
  };

  useEffect(() => {
    fetchExecution();
    checkExistingReview();
    const interval = setInterval(fetchExecution, 5000);
    return () => clearInterval(interval);
  }, [bookingId]);

  // ✅ Confirm completion
  const handleConfirmCompletion = async () => {
    if (!execution) return;
    setUpdating(true);
    try {
      const res = await api.put(
        `/execution/${bookingId}/update`,
        { field: "completedclient" }
      );
      setExecution(res.data.data || res.data);

      // ✅ Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error("Error updating execution:", err);
      alert("Failed to confirm completion.");
    } finally {
      setUpdating(false);
    }
  };

  // ✅ Submit review
  const handleSubmitReview = async () => {
    if (rating === 0 || comment.trim() === "") {
      alert("Please provide both a rating and a comment.");
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post("/reviews", {
        booking_id: bookingId,
        client_id: execution.client_id,
        provider_id: execution.provider_id,
        rating,
        comment,
      });
      alert("✅ Thank you! Your review has been submitted.");
      setShowReviewModal(false);
      setRating(0);
      setComment("");
      setReviewSubmitted(true);
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("❌ Failed to submit your review. Please try again later.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading execution details...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );

  if (!execution)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        No execution record found.
      </div>
    );

  const {
    booking_id,
    client_id,
    provider_id,
    validatedcredential,
    completedprovider,
    completedclient,
    payment_id,
  } = execution;

  const providerFinished =
    validatedcredential === "completed" && completedprovider === "completed";

  const taskFullyCompleted =
    completedprovider === "completed" && completedclient === "completed";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-700">
          Task Execution #{booking_id}
        </h1>
        <div className="space-x-2">
          <button
            onClick={fetchExecution}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium"
          >
            🔄 Refresh
          </button>

          {/* ✅ New Chat Button */}
          <button
            onClick={() => navigate(`/chat/${booking_id}/user`)}
            className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-medium"
          >
            💬 Chat
          </button>

          <button
            onClick={() => navigate(-1)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center py-10 px-4">
        <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-8">
          {/* Booking Info */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
              Booking Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <p><span className="font-semibold">Booking ID:</span> {booking_id}</p>
              <p><span className="font-semibold">Payment ID:</span> {payment_id || "Not linked"}</p>
              <p><span className="font-semibold">Client ID:</span> {client_id}</p>
              <p><span className="font-semibold">Provider ID:</span> {provider_id}</p>
            </div>
          </section>

          {/* Task Progress */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
              Task Progress
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Credential Validation */}
              <div className="p-5 bg-gray-50 border rounded-xl text-center">
                <h3 className="font-semibold text-gray-800 mb-2">Credential Validation</h3>
                <span
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    validatedcredential === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {validatedcredential === "completed" ? "Validated ✅" : "Waiting for Provider"}
                </span>
              </div>

              {/* Provider Completion */}
              <div className="p-5 bg-gray-50 border rounded-xl text-center">
                <h3 className="font-semibold text-gray-800 mb-2">Provider Completion</h3>
                <span
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    completedprovider === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {completedprovider === "completed" ? "Completed ✅" : "Waiting for Provider"}
                </span>
              </div>

              {/* Client Confirmation */}
              <div className="p-5 bg-gray-50 border rounded-xl text-center">
                <h3 className="font-semibold text-gray-800 mb-2">Client Confirmation</h3>

                <span
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    completedclient === "completed"
                      ? "bg-green-100 text-green-700"
                      : providerFinished
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {completedclient === "completed"
                    ? "Confirmed ✅"
                    : providerFinished
                    ? "Ready for Confirmation"
                    : "Waiting for Provider"}
                </span>

                {/* ✅ Show button only if confirmation is still pending */}
                {completedclient !== "completed" && providerFinished && (
                  <div className="mt-3">
                    <button
                      onClick={handleConfirmCompletion}
                      disabled={updating}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                        updating
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {updating ? "Confirming..." : "Confirm Completion"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center pt-6 border-t">
            {taskFullyCompleted ? (
              <>
                <p className="text-green-700 font-semibold mb-4">
                  ✅ Task fully completed! Thank you for using TaskPal.
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
                  {reviewSubmitted ? "Review Submitted ✅" : "✍️ Leave a Review"}
                </button>
              </>
            ) : (
              <p className="text-gray-500 text-sm">
                Waiting for both provider and client confirmations.
              </p>
            )}
          </div>
        </div>
      </main>

      {/* ⭐ Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-lg w-96">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Leave a Review
            </h3>

            {/* Rating */}
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
              className="w-full border rounded-md p-2 text-sm focus:ring focus:ring-blue-200"
              rows="3"
              placeholder="Write your feedback..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  submittingReview
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionPage;
