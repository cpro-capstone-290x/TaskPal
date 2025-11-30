// src/pages/Admin/AllBookingsView.jsx
import React, { useState, useEffect } from 'react';

const AllBookingsView = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    
    // Endpoint: /admin/bookings
    const API_ENDPOINT = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/admin/bookings`
      : "https://taskpal-14oy.onrender.com/api/admin/bookings";

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const result = await response.json();
      const data = result.data || result; 
      setBookings(data);
      setError(null);
    } catch (err) {
      console.error('Fetch bookings error:', err);
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Filter logic: Search by Booking ID, Client Name, or Provider Name
  const filteredBookings = bookings.filter(b => 
    b.id?.toString().includes(searchTerm) ||
    b.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.provider_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Status Badge Logic
const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || '';
    
    // ✅ SUCCESS (Green): Paid, Completed
    if (s === 'completed' || s === 'paid') {
      return <div className="badge badge-success gap-2 text-white capitalize">{status}</div>;
    }

    // ❌ FAILURE (Red): Cancelled, Rejected
    if (s === 'cancelled' || s === 'rejected') {
      return <div className="badge badge-error gap-2 text-white capitalize">{status}</div>;
    }

    // ℹ️ ACTIVE (Blue): Confirmed, Accepted
    if (s === 'confirmed' || s === 'accepted') {
        return <div className="badge badge-info gap-2 text-white capitalize">{status}</div>;
    }

    // 🟣 NEGOTIATING (Purple): distinct from pending
    if (s === 'negotiating') {
        return <div className="badge bg-purple-500 border-none gap-2 text-white capitalize">{status}</div>;
    }

    // ⚠️ DEFAULT (Yellow): Pending, or anything else
    return <div className="badge badge-warning gap-2 text-white capitalize">{status || 'Pending'}</div>;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4 bg-gray-50" data-theme="light">
      <span className="loading loading-spinner loading-lg text-indigo-600"></span>
      <p className="text-gray-500 font-medium animate-pulse">Loading booking history...</p>
    </div>
  );

  if (error) return (
    <div className="w-full max-w-2xl mx-auto mt-10 px-4" data-theme="light">
      <div className="alert alert-error bg-red-50 border-red-200 text-red-800">
        <span>{error}</span>
        <button onClick={fetchBookings} className="btn btn-xs bg-white text-red-600 border-none">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-1" data-theme="light">
      <div className="space-y-6">
        
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Bookings & Jobs</h2>
            <p className="text-sm text-gray-500 mt-1">Monitor service requests and job status.</p>
          </div>
          
          <div className="form-control w-full md:w-auto">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search bookings..." 
                className="input input-bordered w-full md:w-64 pl-10 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* --- Table --- */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-gray-600 font-semibold py-4">Booking Info</th>
                  <th className="text-gray-600 font-semibold py-4">Client</th>
                  <th className="text-gray-600 font-semibold py-4">Provider</th>
                  <th className="text-gray-600 font-semibold py-4">Status</th>
                  <th className="text-gray-600 font-semibold py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors duration-150">
                      
                      {/* Booking ID & Date */}
                      <td>
                        <div className="font-bold text-gray-900">#{booking.id}</div>
                        <div className="text-xs text-gray-500">
                           {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>

                      {/* Client Info */}
                      <td>
                        <div className="font-medium text-gray-900">{booking.client_name || 'Unknown Client'}</div>
                        <div className="text-xs text-gray-500">{booking.client_email}</div>
                      </td>

                      {/* Provider Info */}
                      <td>
                         <div className="font-medium text-gray-900">{booking.provider_name || 'Unassigned'}</div>
                         <div className="text-xs text-gray-500">{booking.provider_email}</div>
                      </td>

                      {/* Status */}
                      <td>
                        {getStatusBadge(booking.status)}
                      </td>

                      {/* Amount */}
                      <td className="text-right font-mono font-medium text-gray-700">
                        {booking.price 
                          ? `$${Number(booking.price).toFixed(2)}` 
                          : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-gray-500">
                      No bookings found matching "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="text-right text-xs text-gray-400 px-1">
          Showing {filteredBookings.length} total bookings
        </div>

      </div>
    </div>
  );
};

export default AllBookingsView;