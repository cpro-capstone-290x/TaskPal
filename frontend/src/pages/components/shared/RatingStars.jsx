// src/components/shared/RatingStars.jsx
import React from "react";

const RatingStars = ({ rating }) => {
  const safeRating = Number(rating) || 0;

  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          xmlns="http://www.w3.org/2000/svg"
          fill={star <= safeRating ? "#facc15" : "none"}
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke={star <= safeRating ? "#facc15" : "#d1d5db"}
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
  );
};

export default RatingStars;
