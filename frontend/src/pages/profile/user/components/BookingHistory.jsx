import React from "react";
import { useNavigate } from "react-router-dom";

export const UserBookingHistorySkeleton = () => (
  <div
    aria-busy="true"
    aria-label="Loading booking history"
    className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border p-6 animate-pulse"
  >
    <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="h-10 bg-gray-200 rounded" />
      ))}
    </div>
  </div>
);

const BookingHistory = ({ bookings, loading }) => {
  const navigate = useNavigate();

  if (loading) return <UserBookingHistorySkeleton />;

  const historyJobs = bookings.filter((b) => {
    const status = String(b.status).toLowerCase();
    return (
      status === "completed" ||
      status === "cancelled" ||
      b.completedprovider === "completed" ||
      b.completedclient === "completed"
    );
  });

  const statusClass = (status) => {
    const s = String(status).toLowerCase();
    // Using specific bg/text colors that work well on white
    if (s === "completed") return "bg-blue-100 text-blue-900";
    if (s === "cancelled") return "bg-red-100 text-red-900";
    return "bg-gray-200 text-gray-900";
  };

  // Empty State
  if (historyJobs.length === 0) {
    return (
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Booking History
        </h2>
        <p className="text-gray-900">No booking history.</p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="booking-history-title"
      // ⭐ FORCED COLORS: bg-white and text-gray-900 ensure high contrast
      className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
    >
      <h2
        id="booking-history-title"
        className="text-xl sm:text-2xl font-semibold mb-4 text-gray-900"
      >
        Booking History
      </h2>

      <div className="overflow-x-auto" role="region" aria-label="Booking history table">
        <table className="min-w-full border border-gray-200 text-xs sm:text-sm">
          {/* ⭐ HEADER: Explicit light gray background with dark text */}
          <thead className="bg-gray-100">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-900">Booking ID</th>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-900">Provider</th>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-900">Scheduled Date</th>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-900">Price</th>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-900">Status</th>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-900">Action</th>
            </tr>
          </thead>

          {/* ⭐ BODY: Force white background on rows to prevent dark mode bleed-through */}
          <tbody className="bg-white divide-y divide-gray-200">
            {historyJobs.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 transition bg-white">
                <td className="px-4 py-3 font-semibold text-gray-900">#{b.id}</td>
                <td className="px-4 py-3 text-gray-800">{b.provider_name}</td>
                <td className="px-4 py-3 text-gray-800">
                  {b.scheduled_date
                    ? new Date(b.scheduled_date).toLocaleDateString()
                    : "Not set"}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {b.price ? "$" + Number(b.price).toFixed(2) : "N/A"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold ${statusClass(
                      b.status
                    )}`}
                  >
                    {b.status === "Completed" ||
                    b.completedprovider === "completed" ||
                    b.completedclient === "completed"
                      ? "Completed"
                      : "Cancelled"}
                  </span>
                </td>
                
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(`/booking/initiate/${b.provider_id}`)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs hover:bg-blue-700 transition shadow-sm whitespace-nowrap font-medium"
                  >
                    Book Again
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default BookingHistory;