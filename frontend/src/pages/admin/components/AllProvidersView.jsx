// src/pages/Admin/AllProvidersView.jsx
import React, { useState, useEffect } from 'react';
import ProviderDetailsModal from '../components/ProviderDetailsModal.jsx';

const AllProvidersView = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const openDetails = (provider) => {
  setSelectedProvider(provider);
  setShowDetailsModal(true);
  };



  // Fetch Logic
  const fetchAllProviders = async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    
    // ⬇️ CHANGED: Endpoint assumption - removing '/pending' to get all
    const API_ENDPOINT = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/admin/providers`
      : "https://taskpal-14oy.onrender.com/api/admin/providers";

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
      setProviders(data);
      setError(null);
    } catch (err) {
      console.error('Fetch providers error:', err);
      setError('Failed to load provider directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProviders();
  }, []);

  // Filter logic for search bar
  const filteredProviders = providers.filter(provider => 
    provider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.service_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper for Status Badge Colors
  const getStatusBadge = (status) => {
    // Normalize status string just in case
    const s = status?.toLowerCase() || 'pending';
    
    if (s === 'approved' || s === 'active') {
      return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
          Active
        </div>
      );
    }
    if (s === 'rejected' || s === 'suspended') {
      return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
           <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
           {status}
        </div>
      );
    }
    // Default to pending/amber
    return (
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>
        Pending
      </div>
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4 bg-gray-50" data-theme="light">
      <span className="loading loading-spinner loading-lg text-indigo-600"></span>
      <p className="text-gray-500 font-medium animate-pulse">Loading provider directory...</p>
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
        <button onClick={fetchAllProviders} className="btn btn-sm bg-white text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-1" data-theme="light">
      <div className="space-y-6">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Provider Directory</h2>
            <p className="text-sm text-gray-500 mt-1">Manage and view all registered service providers.</p>
          </div>
          
          {/* Search Bar */}
          <div className="form-control w-full md:w-auto">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search providers..." 
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

        {/* --- Main Content --- */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="table w-full">
              {/* Table Head */}
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-gray-600 font-semibold py-4">Provider Info</th>
                  <th className="text-gray-600 font-semibold py-4">Service</th>
                  <th className="text-gray-600 font-semibold py-4">Joined Date</th>
                  <th className="text-gray-600 font-semibold py-4 text-center">Status</th>
                  <th className="text-gray-600 font-semibold py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProviders.length > 0 ? (
                  filteredProviders.map((provider) => (
                    <tr key={provider.id} className="hover:bg-gray-50 transition-colors duration-150">
                      {/* Name & Email */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-gray-100 text-gray-600 rounded-xl w-10 h-10 flex items-center justify-center font-bold border border-gray-200">
                              {provider.name ? provider.name.substring(0, 2).toUpperCase() : 'NA'}
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{provider.name}</div>
                            <div className="text-xs text-gray-500 font-medium">{provider.email}</div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Service Category */}
                      <td>
                        <span className="badge badge-ghost bg-gray-100 border-gray-200 text-gray-600">
                          {provider.service_type || 'Unspecified'}
                        </span>
                      </td>

                      {/* Date */}
                      <td>
                         <span className="text-gray-600 text-sm">
                          {new Date(provider.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Dynamic Status Badge */}
                      <td className="text-center">
                        {getStatusBadge(provider.status)}
                      </td>

                      {/* Action - Simplified for Directory */}
                      <td className="text-right">
                        <button
                          className="btn btn-ghost btn-xs text-gray-500 hover:text-indigo-600"
                          onClick={() => openDetails(provider)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  /* Empty Search Result State */
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-gray-500">
                      No providers found matching "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Footer count */}
        <div className="text-right text-xs text-gray-400 px-1">
          Showing {filteredProviders.length} total providers
        </div>

      </div>
      {/* Provider Details Modal */}
      {showDetailsModal && selectedProvider && (
        <ProviderDetailsModal
          provider={selectedProvider}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
};

export default AllProvidersView;