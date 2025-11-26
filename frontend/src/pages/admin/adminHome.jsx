// src/pages/Admin/AdminHome.jsx
import React, { useState } from 'react';
import AdminLayout from './components/adminLayout'; 
import DashboardHome from './components/DashboardHome';
import ApprovalQueueView from './components/ApprovalQueueView'; 
import AllProvidersView from './components/AllProvidersView';
import AllClientsView from './components/AllClientsView';
import ScheduledAnnouncement from './components/ScheduledAnnouncement';
import AllBookingsView from './components/AllBookingsView';

const AdminHome = () => {
    const [currentView, setCurrentView] = useState('dashboard');

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                // ⬇️ FIX: Pass the function so the cards can click through
                return <DashboardHome onNavigate={setCurrentView} />;

            case 'pending-providers':
                return <ApprovalQueueView />;

            case 'all-providers':
                return <AllProvidersView />;

            case 'clients':
                return <AllClientsView />;

            case 'bookings':
                return <AllBookingsView />;

            case 'scheduled-announcement':
                return <ScheduledAnnouncement />;

            default:
                // ⬇️ FIX: Pass it here too just in case
                return <DashboardHome onNavigate={setCurrentView} />;
        }
    };

    return (
        <AdminLayout 
            currentView={currentView}
            onNavigate={setCurrentView}
        >
            {renderView()}
        </AdminLayout>
    );
};

export default AdminHome;