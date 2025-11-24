// src/components/chat/ChatSidebar.jsx
import React from "react";
import Avatar from "../shared/Avatar";

const ChatSidebar = ({
  role,
  bookingDetails,
  counterpartDetails,
  reviews,
  isLoading,
  onBackToProfile,
  onViewProfile,
}) => {
  const isProvider = role === "provider";

  const profileImage =
    counterpartDetails?.profile_picture_url ||
    counterpartDetails?.profile_picture ||
    counterpartDetails?.photo_url ||
    counterpartDetails?.photo ||
    counterpartDetails?.photoUrl ||
    counterpartDetails?.avatar ||
    counterpartDetails?.avatar_url ||
    undefined;

  const averageRating =
    reviews && reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "5.0";

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-6 flex flex-col justify-between">
      {/* Back Button */}
      <button
        onClick={onBackToProfile}
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

      {isLoading ? (
        <p className="text-center text-gray-500 mt-10">
          {isProvider ? "Loading client info..." : "Loading provider info..."}
        </p>
      ) : counterpartDetails ? (
        <>
          <div className="flex flex-col items-center text-center mt-6">
            <Avatar
              src={profileImage}
              className="w-28 h-28 mb-4 border-4 border-gray-100 bg-gray-100"
            />

            <h3 className="text-lg font-semibold text-gray-800">
              {counterpartDetails.name ||
                (isProvider ? "Client" : "Task Provider")}
            </h3>

            {isProvider ? (
              <p className="text-sm text-gray-500 mt-1">Verified Client</p>
            ) : (
              <>
                <div className="flex items-center gap-1 mt-1 text-yellow-500 text-sm">
                  ⭐{" "}
                  <span className="text-gray-600">{averageRating}</span>
                  <span className="text-gray-600">
                    ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                  </span>
                </div>

                <button
                  onClick={onViewProfile}
                  className="mt-4 px-5 py-2 rounded-full text-sm font-medium bg-sky-800 text-white hover:bg-sky-900 transition"
                >
                  View Profile
                </button>
              </>
            )}
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4 text-sm text-gray-700 space-y-1">
            {isProvider ? (
              <>
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  {counterpartDetails.email || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">City:</span>{" "}
                  {counterpartDetails.city || "Unknown"}
                </p>
                <p>
                  <span className="font-semibold">Province:</span>{" "}
                  {counterpartDetails.province || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Joined:</span>{" "}
                  {counterpartDetails.created_at
                    ? new Date(
                        counterpartDetails.created_at
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
              </>
            ) : (
              <>
                <p>
                  <span className="font-semibold">Service:</span>{" "}
                  {counterpartDetails.service_type || "General Task"}
                </p>
                <p>
                  <span className="font-semibold">Provider Type:</span>{" "}
                  {counterpartDetails.provider_type || "Independent"}
                </p>
                <p>
                  <span className="font-semibold">Location:</span>{" "}
                  {counterpartDetails.city || "Red Deer, AB"}
                </p>
              </>
            )}
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500 mt-10">
          {isProvider ? "No client found." : "No provider found."}
        </p>
      )}

      <div className="text-xs text-gray-600 mt-6 border-t border-gray-200 pt-4">
        {isProvider
          ? "All clients are verified and validated by TaskPal."
          : "All TaskPals are background-checked and verified."}
      </div>
    </div>
  );
};

export default ChatSidebar;
