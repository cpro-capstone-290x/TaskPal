// src/components/booking/BookingInfoPanel.jsx
import React from "react";

const BookingInfoPanel = ({
  bookingDetails,
  role,
  onPriceChange,
  onProposePrice,
  onAgreePrice,
  onCancelBooking,
  onDownloadAgreement,
  onProceedToPayment,
}) => {
  if (!bookingDetails) return null;

  const isNegotiating = ["Pending", "Negotiating"].includes(
    bookingDetails.status
  );
  const isAgreementSigned =
    bookingDetails.agreement_signed_by_client &&
    bookingDetails.agreement_signed_by_provider;

  const displayPrice = bookingDetails.price
    ? `$${Number(bookingDetails.price).toFixed(2)}`
    : "$0.00";

  return (
    <div className="w-80 bg-white p-6 flex flex-col justify-between border-l border-gray-200">
      <div className="text-sm text-gray-700 space-y-2">
        <p>
          <strong>Booking ID:</strong> {bookingDetails.id}
        </p>
        <p>
          <strong>Notes:</strong> {bookingDetails.notes || "N/A"}
        </p>
        <p>
          <strong>Proposed Price:</strong> {displayPrice}
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

        {/* Negotiation section */}
        {isNegotiating && (
          <div className="mt-3 space-y-2">
            <input
              type="number"
              placeholder={`Enter your proposed price (${
                role === "user" ? "client" : "provider"
              })`}
              value={bookingDetails.price || ""}
              onChange={(e) => onPriceChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-sky-400"
              disabled={isAgreementSigned}
            />

            <button
              onClick={onProposePrice}
              disabled={isAgreementSigned}
              className={`w-full py-2 rounded text-white font-medium transition ${
                isAgreementSigned
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-sky-600 hover:bg-sky-700"
              }`}
            >
              💬 Propose New Price
            </button>

            <button
              onClick={onAgreePrice}
              disabled={isAgreementSigned}
              className={`w-full py-2 rounded text-white font-medium transition ${
                isAgreementSigned
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              ✅ Agree to Price
            </button>

            <button
              onClick={onCancelBooking}
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
            >
              ❌ Cancel Booking
            </button>
          </div>
        )}

        {/* Download Agreement */}
        {isAgreementSigned && (
          <div className="mt-4">
            <button
              onClick={onDownloadAgreement}
              className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
            >
              📄 Download Agreement
            </button>
          </div>
        )}

        {/* Payment (client only) */}
        {bookingDetails.status === "Confirmed" && role === "user" && (
          <div className="mt-6">
            <button
              onClick={onProceedToPayment}
              className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
            >
              💳 Proceed to Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingInfoPanel;
