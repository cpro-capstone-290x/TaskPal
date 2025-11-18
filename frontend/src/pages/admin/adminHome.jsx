// src/pages/Admin/AdminHome.jsx
import React, { useState } from 'react';
import AdminLayout from './components/adminLayout'; 
import DashboardHome from './components/DashboardHome';
import ApprovalQueueView from './components/ApprovalQueueView'; 
import ScheduledAnnouncement from './components/ScheduledAnnouncement';

const AdminHome = () => {
    const [currentView, setCurrentView] = useState('dashboard');

    const renderView = () => {
        const PlaceholderView = ({ title }) => (
            <div className="p-6">
                <h3 className="text-2xl font-semibold mb-4 text-black">{title}</h3>
                <div className="alert alert-info shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
                        viewBox="0 0 24 24" 
                        className="stroke-current shrink-0 w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>This view is currently a placeholder.</span>
                </div>
            </div>
        );

        switch (currentView) {
            case 'dashboard':
                return <DashboardHome />;

            case 'pending-providers':
                return <ApprovalQueueView />;

            case 'all-providers':
                return <PlaceholderView title="All Providers List/Management" />;

            case 'clients':
                return <PlaceholderView title="Client Management" />;

            case 'scheduled-announcement':
                return <ScheduledAnnouncement />; // ✅ FIXED HERE

            default:
                return <DashboardHome />;
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
