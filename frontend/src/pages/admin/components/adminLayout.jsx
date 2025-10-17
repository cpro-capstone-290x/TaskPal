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
        window.location.href = '/admin/login'; 
    };
    
    // Helper component for the navigation buttons (used in both sidebar and drawer)
    const NavMenu = ({ handleCloseDrawer }) => (
        <ul className="menu p-0 space-y-2">
            {menuItems.map(item => (
                <li key={item.key}>
                    <button
                        onClick={() => {
                            onNavigate(item.key);
                            // Close the drawer if this function is available (on mobile click)
                            if (handleCloseDrawer) handleCloseDrawer();
                        }}
                        className={`
                            btn btn-ghost w-full justify-start text-base font-medium 
                            ${currentView === item.key ? 'btn-active bg-primary text-primary-content hover:bg-primary/90' : ''}
                        `}
                    >
                        {item.label}
                    </button>
                </li>
            ))}
        </ul>
    );

    return (
        // DAISYUI DRAWER STRUCTURE
        <div className=" lg:drawer-open min-h-screen">
            <input id="admin-drawer" type="checkbox" className="drawer-toggle" />
            
            {/* --------------------------------- */}
            {/* 1. Main Content Area (drawer-content) */}
            {/* --------------------------------- */}
            <div className="drawer-content flex flex-col bg-base-100">
                {/* Header/Navbar */}
                <header className="navbar bg-base-200 shadow-md p-4 sticky top-0 z-10">
                    
                    {/* Mobile Menu Button (Hamburger) */}
                    <div className="flex-none lg:hidden">
                        <label htmlFor="admin-drawer" className="btn btn-square btn-ghost">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </label>
                    </div>

                    {/* Header Title / Current View */}
                    <div className="flex-1 px-2 mx-2">
                        <h2 className="text-xl lg:text-2xl font-semibold capitalize text-gray-700">
                            {currentView.replace('-', ' ')}
                        </h2>
                    </div>

                    {/* Logout Button */}
                    <div className="flex-none">
                        <button onClick={handleLogout} className="btn btn-sm btn-outline btn-error">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Log Out
                        </button>
                    </div>
                </header>
                
                {/* Main Content */}
                <main className="flex-1 p-6 bg-white overflow-y-auto">
                    {children} {/* Renders the current view component */}
                </main>
            </div>
            
            {/* --------------------------------- */}
            /* 2. Sidebar (drawer-side) */
            /* --------------------------------- */
            <div className="drawer-side">
                <label htmlFor="admin-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
                
                <div className="w-64 bg-base-300 text-base-content p-4 min-h-full">
                    <h3 className="text-2xl font-bold mb-6 text-primary">
                        Admin Panel
                    </h3>
                    
                    {/* Pass a function to close the drawer on button click (for mobile) */}
                    <NavMenu handleCloseDrawer={() => document.getElementById('admin-drawer').checked = false} />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;