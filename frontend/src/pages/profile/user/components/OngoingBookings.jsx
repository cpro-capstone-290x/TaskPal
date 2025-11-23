// src/pages/profile/User/components/OngoingBookings.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

// Skeleton Loader
export const UserOngoingBookingsSkeleton = () => (
  <div
    aria-busy="true"
    aria-label="Loading ongoing bookings"
    className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border p-4 sm:p-6 lg:p-8 animate-pulse"
  >
    <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="h-10 bg-gray-200 rounded" />
      ))}
    </div>
  </div>
);

const statusClass = (status) => {
  switch (status) {
    case "Paid":
      return "bg-emerald-100 text-emerald-800";
    case "Confirmed":
      return "bg-green-100 text-green-800";
    case "Negotiating":
      return "bg-orange-100 text-orange-800";
    case "Pending":
      return "bg-yellow-100 text-yellow-800"; // improved contrast
    case "Completed":
      return "bg-blue-100 text-blue-800";
    case "Cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const OngoingBookings = ({ ongoingBookings, loading }) => {
  const navigate = useNavigate();

  if (loading) return <UserOngoingBookingsSkeleton />;

  const activeBookings = ongoingBookings.filter((b) => {
    const status = String(b.status).trim().toLowerCase();

    const done =
      status === "completed" ||
      status === "cancelled" ||
      b.completedclient === "completed" ||
      b.completedprovider === "completed";

    return !done;
  });

  if (activeBookings.length === 0) {
    return (
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Ongoing Bookings
        </h2>
        <p className="text-gray-700">No ongoing bookings.</p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="ongoing-bookings-title"
      className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border p-4 sm:p-6 lg:p-8"
    >
      <h2
        id="ongoing-bookings-title"
        className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800"
      >
        Ongoing Bookings
      </h2>

      <div className="overflow-x-auto" role="region" aria-label="Ongoing bookings table">
        <table className="min-w-full border text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-2 text-left">
                Booking ID
              </th>
              <th scope="col" className="px-4 py-2 text-left">
                Provider
              </th>
              <th scope="col" className="px-4 py-2 text-left">
                Scheduled Date
              </th>
              <th scope="col" className="px-4 py-2 text-left">
                Price
              </th>
              <th scope="col" className="px-4 py-2 text-left">
                Status
              </th>
              <th scope="col" className="px-4 py-2 text-left">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {activeBookings.map((b) => (
              <tr
                key={b.id}
                className="border-b hover:bg-green-50 cursor-pointer"
              >
                <td className="px-4 py-2 font-medium text-gray-800">
                  #{b.id}
                </td>

                <td className="px-4 py-2 text-gray-700">
                  {b.provider_name}
                </td>

                <td className="px-4 py-2 text-gray-700">
                  {b.scheduled_date
                    ? new Date(b.scheduled_date).toLocaleDateString()
                    : "Not set"}
                </td>

                <td className="px-4 py-2 text-green-800 font-medium">
                  {b.price ? "$" + Number(b.price).toFixed(2) : "N/A"}
                </td>

                <td className="px-4 py-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium ${statusClass(
                      b.status
                    )}`}
                  >
                    {b.status}
                  </span>
                </td>

                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => navigate(`/execution/${b.id}`)}
                    aria-label={`View execution details for booking ${b.id}`}
                    className="bg-green-600 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                  >
                    View Execution
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

export default OngoingBookings;
