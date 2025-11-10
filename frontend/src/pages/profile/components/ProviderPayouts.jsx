import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Edit2, Save, X, CheckCircle, Clock, Upload, User as UserIcon } from 'lucide-react'; 
import api from "../../../api";

// --- Helper Component for Input Fields (Same as before) ---
const ProfileField = ({ label, name, value, onChange, readOnly = false, type = 'text', className = '' }) => {
  const baseClasses = "w-full px-4 py-2 border text-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none";
  const editClasses = "bg-white border-gray-300 shadow-sm";
  const viewClasses = "bg-gray-50 text-gray-600 border-gray-200";

  const inputClasses = `${baseClasses} ${readOnly ? viewClasses : editClasses} ${className}`;
  
  return (
    <div>
      <label className="block text-gray-600 text-sm font-medium mb-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        readOnly={readOnly}
        className={inputClasses}
      />
    </div>
  );
};

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Helper to format dates
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const ProviderPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        setLoading(true);
        // ✅ FIX 1: Use 'authToken' to match your other code
        const token = localStorage.getItem("authToken");

        if (!token) {
          throw new Error("Authorization token not found. Please log in.");
        }

        // ✅ FIX 2: Use your 'api' (axios) instance for the request
        const response = await api.get("/payments/my-history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // ✅ FIX 3: Axios puts the data in 'response.data'
        setPayouts(response.data);
      } catch (err) {
        console.error("Payout fetch error:", err);
        setError(err.message || "Failed to fetch payout history.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayouts();
  }, []); // Runs once on component mount

  // Calculate total earnings
  const totalEarned = payouts.reduce(
    (acc, payout) => acc + Number(payout.price),
    0
  );

  if (loading) {
    return <p className="text-gray-600">Loading payout history...</p>;
  }

  if (error) {
    return (
      <p className="text-red-600">Error: {error} Please try again later.</p>
    );
  }

  // ✅ FIX 4: The component now returns all the JSX
  return (
    <div className="max-w-4xl w-full">
      {/* --- Summary Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
          <h3 className="text-lg font-medium text-green-700">Total Earned</h3>
          <p className="text-4xl font-bold text-green-900 mt-2">
            {formatCurrency(totalEarned)}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
          <h3 className="text-lg font-medium text-blue-700">
            Total Completed Bookings
          </h3>
          <p className="text-4xl font-bold text-blue-900 mt-2">
            {payouts.length}
          </p>
        </div>
      </div>

      {/* --- Payout History Table --- */}
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Transaction History
      </h3>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Customer
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payouts.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No completed payments found.
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.booking_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(payout.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {payout.customer_first_name} {payout.customer_last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 truncate max-w-xs">
                      {payout.notes || `Booking #${payout.booking_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold text-right">
                      + {formatCurrency(payout.price)}
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
