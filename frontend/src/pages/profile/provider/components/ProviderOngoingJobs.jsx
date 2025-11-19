// src/pages/profile/Provider/components/ProviderOngoingJobs.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export const ProviderOngoingJobsSkeleton = () => (
  <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border p-4 sm:p-6 lg:p-8 animate-pulse">
    <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="h-10 bg-gray-200 rounded" />
      ))}
    </div>
  </div>
);

const ProviderOngoingJobs = ({ ongoingJobs, loading }) => {
  const navigate = useNavigate();

  if (loading) return <ProviderOngoingJobsSkeleton />;

  if (!ongoingJobs || ongoingJobs.length === 0) {
    return (
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
          Ongoing Jobs
        </h2>
        <p className="text-gray-500">No ongoing jobs.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border p-4 sm:p-6 lg:p-8">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
        Ongoing Jobs
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-4 py-2 text-left">Booking ID</th>
              <th className="px-3 sm:px-4 py-2 text-left">Client</th>
              <th className="px-3 sm:px-4 py-2 text-left">Scheduled Date</th>
              <th className="px-3 sm:px-4 py-2 text-left">Price</th>
              <th className="px-3 sm:px-4 py-2 text-left">Status</th>
              <th className="px-3 sm:px-4 py-2 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {ongoingJobs.map((b) => (
              <tr
                key={b.id}
                className="border-b hover:bg-green-50 cursor-pointer"
              >
                <td className="px-3 sm:px-4 py-2 font-medium">#{b.id}</td>
                <td className="px-3 sm:px-4 py-2">{b.client_name}</td>
                <td className="px-3 sm:px-4 py-2">
                  {b.scheduled_date
                    ? new Date(b.scheduled_date).toLocaleDateString()
                    : "Not set"}
                </td>
                <td className="px-3 sm:px-4 py-2 text-green-700">
                  {b.price ? "$" + Number(b.price).toFixed(2) : "N/A"}
                </td>
                <td className="px-3 sm:px-4 py-2">
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] sm:text-xs">
                    Paid
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

export default ProviderOngoingJobs;
