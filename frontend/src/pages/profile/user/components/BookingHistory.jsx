// src/pages/profile/User/components/BookingHistory.jsx
import React from "react";

const BookingHistory = ({ bookings, loading }) => {
  if (loading) {
    return (
      <div className="max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <p className="text-center text-gray-500">Loading bookings...</p>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Booking History
        </h2>
        <p className="text-center text-gray-500">
          No booking history available.
        </p>
      </div>
    );
  }

  const statusClass = (status) => {
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

  return (
    <div className="max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Booking History
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-100 text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-gray-700 font-medium">
                Booking ID
              </th>
              <th className="px-4 py-2 text-left text-gray-700 font-medium">
                Provider
              </th>
              <th className="px-4 py-2 text-left text-gray-700 font-medium">
                Scheduled Date
              </th>
              <th className="px-4 py-2 text-left text-gray-700 font-medium">
                Price
              </th>
              <th className="px-4 py-2 text-left text-gray-700 font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr
                key={b.id}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="px-4 py-2 text-gray-700 font-medium">
                  #{b.id}
                </td>
                <td className="px-4 py-2 text-gray-700">
                  {b.provider_name || "N/A"}
                </td>
                <td className="px-4 py-2 text-gray-700">
                  {b.scheduled_date
                    ? new Date(b.scheduled_date).toLocaleString()
                    : "Not set"}
                </td>
                <td className="px-4 py-2 text-gray-700">
                  {b.price ? `$${Number(b.price).toFixed(2)}` : "N/A"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass(
                      b.status
                    )}`}
                  >
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingHistory;
