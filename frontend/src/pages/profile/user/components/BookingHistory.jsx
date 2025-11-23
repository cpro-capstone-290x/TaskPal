// src/pages/profile/User/components/BookingHistory.jsx
import React from "react";

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

    if (s === "completed") return "bg-blue-100 text-blue-800";
    if (s === "cancelled") return "bg-red-100 text-red-800";

    return "bg-gray-100 text-gray-800";
  };

  if (historyJobs.length === 0) {
    return (
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Booking History
        </h2>
        <p className="text-gray-700">No booking history.</p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="booking-history-title"
      className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border p-6"
    >
      <h2
        id="booking-history-title"
        className="text-xl sm:text-2xl font-semibold mb-4 text-gray-800"
      >
        Booking History
      </h2>

      <div className="overflow-x-auto" role="region" aria-label="Booking history table">
        <table className="min-w-full border text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-2 text-left">Booking ID</th>
              <th scope="col" className="px-4 py-2 text-left">Provider</th>
              <th scope="col" className="px-4 py-2 text-left">Scheduled Date</th>
              <th scope="col" className="px-4 py-2 text-left">Price</th>
              <th scope="col" className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {historyJobs.map((b) => (
              <tr key={b.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-4 py-2 font-medium text-gray-800">#{b.id}</td>
                <td className="px-4 py-2 text-gray-700">{b.provider_name}</td>
                <td className="px-4 py-2 text-gray-700">
                  {b.scheduled_date
                    ? new Date(b.scheduled_date).toLocaleDateString()
                    : "Not set"}
                </td>
                <td className="px-4 py-2 text-gray-800">
                  {b.price ? "$" + Number(b.price).toFixed(2) : "N/A"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium ${statusClass(
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
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </section>
  );
};

export default BookingHistory;
