// src/components/Admin/DashboardHome.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Component for a simple KPI Card
const KPICard = ({ title, value, onClick, color }) => (
    <div 
        onClick={onClick}
        style={{
            padding: '20px',
            margin: '10px',
            borderRadius: '8px',
            backgroundColor: color,
            color: 'white',
            flex: 1,
            minWidth: '200px',
            cursor: onClick ? 'pointer' : 'default',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}
    >
        <h4 style={{ margin: '0 0 10px 0' }}>{title}</h4>
        <p style={{ fontSize: '2em', margin: 0 }}>{value}</p>
    </div>
);

const DashboardHome = ({ onNavigate }) => {
    const [stats, setStats] = useState({ pendingProviders: 0, totalProviders: 0, totalClients: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // This function can be expanded to fetch all necessary stats
    const fetchDashboardStats = async () => {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        
        try {
            // ⭐ 1. Fetch the PENDING count (uses your existing endpoint)
            const pendingResponse = await axios.get('/api/admin/providers/pending', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // ⭐ 2. Fetch other stats (You'll need to create new endpoints for these!)
            // Example: const totalResponse = await axios.get('/api/admin/stats/providers', { headers: { Authorization: `Bearer ${token}` } });
            
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
        // This relies on the onNavigate prop passed from AdminPage
        if (onNavigate) {
            onNavigate('pending-providers');
        } else {
            // Fallback: If not using the single-page nav system, redirect
            console.warn("Navigation prop not available. Cannot redirect.");
        }
    };

    if (loading) return <div>Loading dashboard overview...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

    return (
        <div>
            <h1>Admin Dashboard Overview</h1>
            <p>Welcome back, Admin. Here is a summary of platform activity.</p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '30px' }}>
                
                {/* 🚨 CRITICAL KPI: Pending Approvals */}
                <KPICard
                    title="Pending Provider Approvals"
                    value={stats.pendingProviders}
                    onClick={handlePendingClick}
                    color={stats.pendingProviders > 0 ? '#ff4d4f' : '#1890ff'} // Red if urgent, blue if clear
                />
                
                {/* Other standard KPIs (placeholders) */}
                <KPICard
                    title="Total Active Providers"
                    value={stats.totalProviders}
                    color="#52c41a"
                />
                <KPICard
                    title="Total Registered Clients"
                    value={stats.totalClients}
                    color="#722ed1"
                />
                <KPICard
                    title="Open Bookings Today"
                    value={12} // Placeholder
                    color="#faad14"
                />
            </div>
            
            {/* You can add charts, recent activity logs, or other components here */}
            <div style={{ marginTop: '40px' }}>
                <h3>Recent System Activity</h3>
                <p>No new critical alerts.</p>
            </div>
        </div>
    );
};

export default DashboardHome;