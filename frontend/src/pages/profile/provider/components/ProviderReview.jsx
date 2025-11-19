import React from "react";
import { Star } from "lucide-react";

const ProviderReview = ({ reviews }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-100">

      {/* Title */}
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Customer <span className="text-indigo-600">Reviews</span>
      </h2>

      {/* No reviews */}
      {(!reviews || reviews.length === 0) && (
        <p className="text-gray-500 text-sm">No reviews yet.</p>
      )}

      {/* Review List */}
      <div className="space-y-6">
        {reviews.map((review, idx) => (
          <div key={idx} className="border-b pb-4">

            {/* Name + Rating */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-lg">
                {review.reviewer_name || "Anonymous"}
              </h3>

              {/* Stars */}
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={
                      i < review.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
            </div>

            {/* Service Type */}
            <p className="text-sm text-gray-500">
              {review.service_type || "General Service"}
            </p>

            {/* Review Comment */}
            <p className="mt-1 text-gray-700">
              {review.comment || "No comment provided."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProviderReview;
