// src/pages/Admin/DashboardHome.jsx
import React, { useState, useEffect } from 'react';

// Helper Component: KPI Card
// Uses specific color logic to remain readable in forced light mode
const KPICard = ({ title, value, icon, colorClass, onClick }) => (
  <div 
    onClick={onClick}
    className={`
      relative overflow-hidden rounded-2xl p-6 shadow-sm border border-gray-100 bg-white
      transition-all duration-300 transform
      ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md' : ''}
    `}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
        {/* Render the icon passed as a prop, applying the text color from colorClass */}
        {React.cloneElement(icon, { className: `w-6 h-6 ${colorClass.replace('bg-', 'text-')}` })}
      </div>
    </div>
    {/* Decorative background circle */}
    <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-5 ${colorClass}`}></div>
  </div>
);

const DashboardHome = ({ onNavigate }) => {
  const [stats, setStats] = useState({ 
    pendingProviders: 0, 
    totalProviders: 0, 
    totalClients: 0 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardStats = async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    
    // Dynamic Endpoint Logic
    const API_BASE = import.meta.env.VITE_API_URL || "https://taskpal-14oy.onrender.com/api";

    try {
      // 1. Fetch Pending Count
      const pendingResponse = await fetch(`${API_BASE}/admin/providers/pending`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!pendingResponse.ok) throw new Error("Failed to fetch stats");

      const result = await pendingResponse.json();
      // Handle nested data structure common in your API
      const pendingData = result.data || result;

      setStats({
        pendingProviders: Array.isArray(pendingData) ? pendingData.length : 0,
        totalProviders: 150, // Placeholder
        totalClients: 450,   // Placeholder
      });
      setError(null);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // -- Loading State --
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 bg-gray-50" data-theme="light">
      <span className="loading loading-spinner loading-lg text-indigo-600"></span>
      <p className="text-gray-500 mt-4 font-medium">Loading overview...</p>
    </div>
  );

  // -- Error State --
  if (error) return (
    <div className="p-6 bg-gray-50" data-theme="light">
      <div className="alert alert-error shadow-sm bg-red-50 border-red-200 text-red-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>Error: {error}</span>
      </div>
    </div>
  );

  return (
    // ⭐ Force Light Theme & consistency
    <div className="p-1 min-h-screen bg-gray-50 text-gray-800" data-theme="light">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-gray-500 mt-2">Welcome back. Here is the activity summary for today.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* 1. Pending Approvals (Actionable) */}
        <KPICard
          title="Pending Approvals"
          value={stats.pendingProviders}
          // Use Amber for 'warning/action needed'
          colorClass={stats.pendingProviders > 0 ? "bg-amber-500" : "bg-emerald-500"}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          onClick={() => onNavigate && onNavigate('pending-providers')}
        />

        {/* 2. Active Providers */}
        <KPICard
          title="Active Providers"
          value={stats.totalProviders}
          colorClass="bg-indigo-500"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />

        {/* 3. Total Clients */}
        <KPICard
          title="Total Clients"
          value={stats.totalClients}
          colorClass="bg-sky-500"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />

        {/* 4. Bookings (Placeholder) */}
        <KPICard
          title="Active Bookings"
          value="12"
          colorClass="bg-purple-500"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Activity Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">System Activity</h3>
          <button className="btn btn-xs btn-ghost">View All</button>
        </div>
        
        <div className="p-6">
          {/* Activity Timeline / Empty State */}
          <div className="flex flex-col gap-4">
             {/* Placeholder Item 1 */}
            <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">System Backup Completed</p>
                <p className="text-xs text-gray-500">Database backup successful at 03:00 AM</p>
              </div>
              <span className="text-xs text-gray-400">2h ago</span>
            </div>
            
            {/* Placeholder Item 2 */}
            <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">New Provider Application</p>
                <p className="text-xs text-gray-500">John Doe applied for Plumbing services</p>
              </div>
              <span className="text-xs text-gray-400">5h ago</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardHome;