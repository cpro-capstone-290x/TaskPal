// src/components/chat/ProviderProfileModal.jsx
import React from "react";
import Avatar from "../shared/Avatar";
import RatingStars from "../shared/RatingStars";

const ProviderProfileModal = ({ isOpen, providerDetails, reviews, onClose }) => {
  if (!isOpen || !providerDetails) return null;

  const averageRating =
    reviews && reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "5.0";

  const profileImage =
    providerDetails.photo_url ||
    providerDetails.photo ||
    providerDetails.photoUrl ||
    providerDetails.profile_picture ||
    providerDetails.profile_picture_url ||
    providerDetails.avatar ||
    providerDetails.avatar_url ||
    undefined;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"
        >
          ✕
        </button>

        {/* DaisyUI style modal semantics kept for compatibility */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
            {/* Photo */}
            <Avatar
              src={profileImage}
              className="w-32 h-32"
              alt="Provider"
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
                {providerDetails.bio || "This provider hasn’t written a bio yet."}
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
                      {averageRating}
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

          {(!reviews || reviews.length === 0) ? (
            <p className="text-center text-gray-500">No reviews yet.</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-800">
                      {review.reviewer_name || "Anonymous User"}
                    </span>
                    <RatingStars rating={review.rating} />
                  </div>
                  <p className="text-gray-600 text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="flex justify-center mt-6">
          <button onClick={onClose} className="btn btn-outline btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfileModal;
