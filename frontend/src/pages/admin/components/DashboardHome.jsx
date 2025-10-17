// src/components/Admin/DashboardHome.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Component for a simple KPI Card - Refactored with DaisyUI/Tailwind
const KPICard = ({ title, value, onClick, className }) => (
    <div 
        onClick={onClick}
        // Use DaisyUI card classes and dynamic background/hover colors
        className={`
            card shadow-lg w-full transform transition duration-300 
            ${onClick ? 'cursor-pointer hover:shadow-2xl hover:-translate-y-1' : ''} 
            ${className}
        `}
    >
        <div className="card-body p-5">
            <h4 className="card-title text-base opacity-90">{title}</h4>
            <p className="text-4xl font-bold">{value}</p>
        </div>
    </div>
);

const DashboardHome = ({ onNavigate }) => {
    const [stats, setStats] = useState({ pendingProviders: 0, totalProviders: 0, totalClients: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardStats = async () => {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        
        try {
            // ⭐ 1. Fetch the PENDING count (uses your existing endpoint)
            const pendingResponse = await axios.get('http://localhost:5000/api/admin/providers/pending', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // ⭐ 2. Fetch other stats (Placeholders are kept for now)
            
            setStats({
                pendingProviders: pendingResponse.data.data.length,
                totalProviders: 150, // Placeholder
                totalClients: 450, // Placeholder
            });
            setError(null);
        } catch (err) {
            console.error("Failed to fetch dashboard stats:", err);
            setError('Failed to load dashboard data. Check API status.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const handlePendingClick = () => {
        if (onNavigate) {
            onNavigate('pending-providers');
        } else {
            console.warn("Navigation prop not available. Cannot redirect.");
        }
    };

    // Use Tailwind/DaisyUI for loading state
    if (loading) return <div className="p-6 text-center text-lg font-semibold text-black bg-white">
        <span className="loading loading-spinner loading-lg mr-2"></span>
        Loading dashboard overview...
    </div>;

    // Use DaisyUI alert for error state
    if (error) return (
        <div role="alert" className="alert alert-error m-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-bold">Error:</span> {error}
        </div>
    );

    // Determine the class name for the Pending Approvals card
    const pendingCardClass = stats.pendingProviders > 0 
        ? 'bg-error text-error-content' // Red (error) if urgent
        : 'bg-primary text-primary-content'; // Blue (primary) if clear

    return (
        <div className="p-6 bg-white text-black">
            <h1 className="text-4xl font-extrabold mb-2 text-black">Admin Dashboard</h1>
            <p className="text-gray-600 mb-8">Welcome back, Admin. Here is a summary of platform activity.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 🚨 CRITICAL KPI: Pending Approvals */}
                <KPICard
                    title="Pending Provider Approvals"
                    value={stats.pendingProviders}
                    onClick={handlePendingClick}
                    className={pendingCardClass}
                />
                
                {/* Other standard KPIs */}
                <KPICard
                    title="Total Active Providers"
                    value={stats.totalProviders}
                    className="bg-success text-success-content" // Green
                />
                <KPICard
                    title="Total Registered Clients"
                    value={stats.totalClients}
                    className="bg-info text-info-content" // Cyan/Blue
                />
                <KPICard
                    title="Open Bookings Today"
                    value={12} // Placeholder
                    className="bg-warning text-warning-content" // Yellow
                />
            </div>
            
            {/* Recent System Activity Section */}
            <div className="mt-10 p-6 bg-base-100 rounded-lg shadow-md border border-gray-100">
                <h3 className="text-2xl font-semibold mb-4 text-black">Recent System Activity</h3>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-700">No new critical alerts.</p>
                </div>
                {/* Placeholder for an activity list or chart */}
            </div>
        </div>
    );
};

export default DashboardHome;