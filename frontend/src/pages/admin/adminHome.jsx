// src/pages/Admin/AdminHome.jsx
import React, { useState } from 'react';
import AdminLayout from './components/adminLayout';
import DashboardHome from './components/DashboardHome';
import ApprovalQueueView from './components/ApprovalQueueView'; 
// Import other components here

const AdminHome = () => {
    const [currentView, setCurrentView] = useState('dashboard'); // Start on dashboard

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardHome />;
            case 'pending-providers':
                // ⭐ This is the component handling the core approval logic
                return <ApprovalQueueView />; 
            case 'all-providers':
                return <div>All Providers List/Management</div>;
            case 'clients':
                return <div>Client Management</div>;
            default:
                return <DashboardHome />;
        }
    };

    return (
        <AdminLayout 
            currentView={currentView}
            onNavigate={setCurrentView} // Use setCurrentView directly
        >
            {renderView()}
        </AdminLayout>
    );
};

export default AdminHome;