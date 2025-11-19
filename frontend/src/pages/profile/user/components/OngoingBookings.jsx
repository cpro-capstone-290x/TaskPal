// src/pages/profile/User/components/OngoingBookings.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const OngoingBookings = ({ ongoingBookings, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <p className="text-center text-gray-500">
          Loading ongoing bookings...
        </p>
      </div>
    );
  }

  if (!ongoingBookings || ongoingBookings.length === 0) {
    return (
      <div className="max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Ongoing Bookings
        </h2>
        <p className="text-center text-gray-500">No ongoing bookings yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Ongoing Bookings
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
              <th className="px-4 py-2 text-left text-gray-700 font-medium">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {ongoingBookings.map((b) => (
              <tr
                key={b.id}
                className="border-b hover:bg-green-50 transition cursor-pointer"
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
                <td className="px-4 py-2 text-green-700 font-medium">
                  {b.price ? `$${Number(b.price).toFixed(2)}` : "N/A"}
                </td>
                <td className="px-4 py-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Paid
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => navigate(`/execution/${b.id}`)}
                    className="bg-green-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-green-700 transition"
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
