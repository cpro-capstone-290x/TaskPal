// src/pages/Admin/ApprovalQueueView.jsx
import React, { useState, useEffect } from 'react';
import ProviderReviewModal from './ProviderReviewModal.jsx';

const ApprovalQueueView = () => {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [error, setError] = useState(null);

  // Fetch logic remains the same
  const fetchPendingProviders = async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    
    const API_ENDPOINT = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/admin/providers/pending`
      : "https://taskpal-14oy.onrender.com/api/admin/providers/pending";

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
      setPendingList(data);
      setError(null);
    } catch (err) {
      console.error('Fetch pending providers error:', err);
      setError('Failed to load pending applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProviders();
  }, []);

  const handleActionSuccess = (providerId) => {
    setPendingList((prev) => prev.filter((p) => p.id !== providerId));
    setSelectedProvider(null);
  };

  // =========================================================
  // RENDER HELPERS
  // =========================================================

  if (loading) return (
    // Wrapper forces light theme for loading state too
    <div className="flex flex-col items-center justify-center h-96 space-y-4 bg-gray-50" data-theme="light">
      <span className="loading loading-spinner loading-lg text-indigo-600"></span>
      <p className="text-gray-500 font-medium animate-pulse">Fetching applications...</p>
    </div>
  );

  if (error) return (
    <div className="w-full max-w-2xl mx-auto mt-10 px-4" data-theme="light">
      <div className="alert alert-error bg-red-50 border-red-200 text-red-800 shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <div>
          <h3 className="font-bold">Connection Error</h3>
          <div className="text-sm">{error}</div>
        </div>
        <button onClick={fetchPendingProviders} className="btn btn-sm bg-white text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300">Retry</button>
      </div>
    </div>
  );

  return (
    // ⭐ data-theme="light" forces DaisyUI components to ignore system dark mode preferences
    // ⭐ bg-gray-50 ensures the background is always light gray, never black
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-1" data-theme="light">
      
      <div className="space-y-6">
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Provider Approvals</h2>
            <p className="text-sm text-gray-500 mt-1">Review credentials and verify incoming provider applications.</p>
          </div>
          
          {/* Stats Badge */}
          <div className="stats shadow-sm bg-white border border-gray-200 rounded-xl">
            <div className="stat place-items-center py-2 px-6">
              <div className="stat-title text-xs uppercase tracking-wide font-bold text-gray-400">Queue Status</div>
              <div className={`stat-value text-2xl ${pendingList.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {pendingList.length} Pending
              </div>
            </div>
          </div>
        </div>

        {/* --- Main Content Area --- */}
        {pendingList.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <span className="text-4xl">🎉</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">All Caught Up!</h1>
            <p className="text-gray-500 mt-2 mb-6 max-w-sm text-center">
              There are no pending provider applications waiting for review at this moment.
            </p>
            <button onClick={fetchPendingProviders} className="btn btn-ghost btn-sm text-indigo-600 hover:bg-indigo-50">
              Refresh List
            </button>
          </div>
        ) : (
          // Table Card
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="table w-full">
                {/* Table Head: Explicit light gray background */}
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-gray-600 font-semibold py-4">Applicant</th>
                    <th className="text-gray-600 font-semibold py-4">Service Category</th>
                    <th className="text-gray-600 font-semibold py-4">Applied Date</th>
                    <th className="text-gray-600 font-semibold py-4 text-center">Queue Status</th>
                    <th className="text-gray-600 font-semibold py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingList.map((provider) => (
                    <tr key={provider.id} className="hover:bg-gray-50 transition-colors duration-150">
                      
                      {/* Applicant Info */}
                      <td>
                        <div className="flex items-center gap-3">
                          {/* Avatar Placeholder */}
                          <div className="avatar">
                            {provider.profile_picture_url ? (
                              <div className="w-10 h-10 rounded-xl overflow-hidden border border-indigo-200">
                                <img
                                  src={provider.profile_picture_url}
                                  alt="Profile Picture"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none"; // hide broken img
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="bg-indigo-100 text-indigo-700 rounded-xl w-10 h-10 flex items-center justify-center font-bold border border-indigo-200">
                                {provider.name ? provider.name.substring(0, 2).toUpperCase() : "NA"}
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="font-bold text-gray-900">{provider.name}</div>
                            <div className="text-xs text-gray-500 font-medium">{provider.email || 'No email provided'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Service Type */}
                      <td>
                        <div className="badge bg-gray-100 text-gray-600 border-gray-200 p-3 font-medium">
                          {provider.service_type}
                        </div>
                      </td>

                      {/* Date */}
                      <td>
                        <span className="text-gray-600 text-sm font-medium">
                          {new Date(provider.created_at).toLocaleDateString(undefined, { 
                            year: 'numeric', month: 'short', day: 'numeric' 
                          })}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="text-center">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>
                          Needs Review
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="text-right">
                        <button
                          onClick={() => setSelectedProvider(provider)}
                          className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-sm px-4"
                        >
                          Review Application
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal rendering */}
      {selectedProvider && (
        <div data-theme="light"> 
          {/* Wrapping modal in theme provider just in case it uses portals */}
          <ProviderReviewModal
            providerSummary={selectedProvider}
            onClose={() => setSelectedProvider(null)}
            onActionSuccess={handleActionSuccess}
          />
        </div>
      )}
    </div>
  );
};

export default ApprovalQueueView;