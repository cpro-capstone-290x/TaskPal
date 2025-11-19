// src/pages/profile/User/components/OngoingBookings.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

// 🔵 Skeleton loader (same as provider)
export const UserOngoingBookingsSkeleton = () => (
  <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border p-4 sm:p-6 lg:p-8 animate-pulse">
    <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="h-10 bg-gray-200 rounded" />
      ))}
    </div>
  </div>
);

// ⭐ SAME COLOR LOGIC AS PROVIDER
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

const OngoingBookings = ({ ongoingBookings, loading }) => {
  const navigate = useNavigate();

  if (loading) return <UserOngoingBookingsSkeleton />;

  // 🟦 Filter only active jobs (same exact logic as provider)

  const activeBookings = ongoingBookings.filter((b) => {
    const rawStatus = b.status || "";
    const status = String(rawStatus).trim().toLowerCase();

    const done =
      status === "completed" ||
      status === "cancelled" ||
      b.completedclient === "completed" ||
      b.completedprovider === "completed";

    if (done) return false;

    return (
      status === "paid" ||
      status === "confirmed" ||
      status === "pending" ||
      status === "negotiating"
    );
  });


  // ❌ No ongoing tasks
  if (activeBookings.length === 0) {
    return (
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
          Ongoing Bookings
        </h2>
        <p className="text-gray-500">No ongoing bookings.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border p-4 sm:p-6 lg:p-8">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
        Ongoing Bookings
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-4 py-2 text-left">Booking ID</th>
              <th className="px-3 sm:px-4 py-2 text-left">Provider</th>
              <th className="px-3 sm:px-4 py-2 text-left">Scheduled Date</th>
              <th className="px-3 sm:px-4 py-2 text-left">Price</th>
              <th className="px-3 sm:px-4 py-2 text-left">Status</th>
              <th className="px-3 sm:px-4 py-2 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {activeBookings.map((b) => (
              <tr
                key={b.id}
                className="border-b hover:bg-green-50 cursor-pointer"
              >
                <td className="px-3 sm:px-4 py-2 font-medium">#{b.id}</td>

                <td className="px-3 sm:px-4 py-2">{b.provider_name}</td>

                <td className="px-3 sm:px-4 py-2">
                  {b.scheduled_date
                    ? new Date(b.scheduled_date).toLocaleDateString()
                    : "Not set"}
                </td>

                <td className="px-3 sm:px-4 py-2 text-green-700 font-medium">
                  {b.price ? "$" + Number(b.price).toFixed(2) : "N/A"}
                </td>

                <td className="px-3 sm:px-4 py-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium ${statusClass(
                      b.status
                    )}`}
                  >
                    {b.status}
                  </span>
                </td>

                <td className="px-3 sm:px-4 py-2 text-right">
                  <button
                    onClick={() => navigate(`/execution/${b.id}`)}
                    className="bg-green-600 text-white px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm hover:bg-green-700"
                  >
                    View Execution
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default OngoingBookings;
