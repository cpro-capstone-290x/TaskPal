// src/components/Admin/AdminLayout.jsx
import React from 'react';

// Destructure props: currentView is the active key, onNavigate handles changing the view
const AdminLayout = ({ currentView, onNavigate, children }) => {
    const menuItems = [
        { key: 'dashboard', label: 'Dashboard Home' },
        { key: 'pending-providers', label: 'Provider Approvals' },
        { key: 'all-providers', label: 'All Providers' },
        { key: 'clients', label: 'Client Management' },
        // ... other sections
    ];

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login'; // Force full refresh/redirect
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <div style={{ width: '250px', backgroundColor: '#333', color: 'white', padding: '20px' }}>
                <h3>Admin Panel</h3>
                <nav>
                    {menuItems.map(item => (
                        <button
                            key={item.key}
                            onClick={() => onNavigate(item.key)}
                            style={{ 
                                display: 'block', 
                                margin: '10px 0', 
                                padding: '10px',
                                backgroundColor: currentView === item.key ? '#555' : 'transparent',
                                color: 'white',
                                border: 'none',
                                width: '100%',
                                textAlign: 'left',
                                cursor: 'pointer'
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            {/* Main Content Area */}
            <div style={{ flexGrow: 1, padding: '20px', backgroundColor: '#f4f4f4' }}>
                <header style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '20px', borderBottom: '1px solid #ccc' }}>
                    <button onClick={handleLogout}>Log Out</button>
                </header>
                
                <main style={{ marginTop: '20px' }}>
                    {children} {/* This is where the specific view component (e.g., ApprovalQueueView) will render */}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;