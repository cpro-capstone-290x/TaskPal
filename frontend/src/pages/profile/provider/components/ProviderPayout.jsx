// src/pages/profile/Provider/components/ProviderPayouts.jsx
import React from "react";
import { useProviderPayouts } from "../hooks/useProviderPayouts";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount || 0);

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const PayoutSkeleton = () => (
  <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border p-4 sm:p-6 lg:p-8 mx-auto animate-pulse">
    <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div className="h-20 bg-gray-200 rounded-xl" />
      <div className="h-20 bg-gray-200 rounded-xl" />
    </div>
    <div className="h-5 w-40 bg-gray-200 rounded mb-3" />
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="h-10 bg-gray-200 rounded" />
      ))}
    </div>
  </div>
);

const ProviderPayouts = () => {
  const { payouts, loading, error } = useProviderPayouts(true);

  const totalEarned = payouts.reduce(
    (acc, payout) => acc + Number(payout.price || 0),
    0
  );

  if (loading) return <PayoutSkeleton />;

  return (
    <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border p-4 sm:p-6 lg:p-8 mx-auto">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
        Total Payout
      </h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-green-50 border border-green-200 p-4 sm:p-6 rounded-xl">
          <h3 className="text-base sm:text-lg text-green-700">Total Earned</h3>
          <p className="text-3xl sm:text-4xl font-bold text-green-900 mt-2">
            {formatCurrency(totalEarned)}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-4 sm:p-6 rounded-xl">
          <h3 className="text-base sm:text-lg text-blue-700">
            Total Completed Bookings
          </h3>
          <p className="text-3xl sm:text-4xl font-bold text-blue-900 mt-2">
            {payouts.length}
          </p>
        </div>
      </div>

      {/* Table */}
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
        Transaction History
      </h3>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left">Date</th>
                <th className="px-3 sm:px-6 py-3 text-left">Customer</th>
                <th className="px-3 sm:px-6 py-3 text-left">Description</th>
                <th className="px-3 sm:px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {payouts.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="py-8 sm:py-12 text-center text-gray-500"
                  >
                    No completed payments found.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.booking_id}>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {p.customer_first_name} {p.customer_last_name}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {p.notes || `Booking #${p.booking_id}`}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-green-700 font-semibold text-right">
                      + {formatCurrency(p.price)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProviderPayouts;
