// src/pages/Admin/AllClientsView.jsx
import React, { useState, useEffect } from 'react';

const AllClientsView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAllUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    
    // Endpoint: /admin/users
    const API_ENDPOINT = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/admin/users`
      : "https://taskpal-14oy.onrender.com/api/admin/users";

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
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error('Fetch users error:', err);
      setError('Failed to load client directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Filter logic
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4 bg-gray-50" data-theme="light">
      <span className="loading loading-spinner loading-lg text-indigo-600"></span>
      <p className="text-gray-500 font-medium animate-pulse">Loading client directory...</p>
    </div>
  );

  if (error) return (
    <div className="w-full max-w-2xl mx-auto mt-10 px-4" data-theme="light">
      <div className="alert alert-error bg-red-50 border-red-200 text-red-800">
        <span>{error}</span>
        <button onClick={fetchAllUsers} className="btn btn-xs bg-white text-red-600 border-none">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-1" data-theme="light">
      <div className="space-y-6">
        
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Client Directory</h2>
            <p className="text-sm text-gray-500 mt-1">View and manage registered platform users.</p>
          </div>
          
          <div className="form-control w-full md:w-auto">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search clients..." 
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
                  <th className="text-gray-600 font-semibold py-4">Client Name</th>
                  <th className="text-gray-600 font-semibold py-4">Contact Info</th>
                  <th className="text-gray-600 font-semibold py-4">Role</th>
                  <th className="text-gray-600 font-semibold py-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                      
                      {/* Name + Avatar */}
                      <td>
                        <div className="flex items-center gap-3">
                            <div className="font-bold text-gray-900">
                              {user.name || `${user.first_name || ''} ${user.last_name || ''}`}
                            </div>
                          <div className="font-bold text-gray-900">{user.name}</div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td>
                        <div className="flex flex-col text-sm">
                          <span className="text-gray-700">{user.email}</span>
                          <span className="text-gray-400 text-xs">{user.phone || 'No phone'}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td>
                        <span className="badge badge-sm badge-ghost uppercase text-xs font-bold tracking-wide">
                          {user.role || 'User'}
                        </span>
                      </td>

                      {/* Date */}
                      <td>
                         <span className="text-gray-600 text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-gray-500">
                      No clients found matching "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-right text-xs text-gray-400 px-1">
          Showing {filteredUsers.length} total clients
        </div>

      </div>
    </div>
  );
};

export default AllClientsView;