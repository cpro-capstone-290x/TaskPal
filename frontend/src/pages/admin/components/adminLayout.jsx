// src/components/Admin/AdminLayout.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLayout = ({ currentView, onNavigate, children }) => {
  const navigate = useNavigate();

  // Menu Configuration with SVG Icons
  const menuItems = [
    { 
      key: 'dashboard', 
      label: 'Overview', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> 
    },
    { 
      key: 'pending-providers', 
      label: 'Approvals', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> 
    },
    { 
      key: 'all-providers', 
      label: 'Providers', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /> 
    },
    { 
      key: 'clients', 
      label: 'Clients', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> 
    },
    { 
      key: 'bookings', 
      label: 'Bookings', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> 
    },
    { 
      key: 'scheduled-announcement', 
      label: 'Notices', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /> 
    }
  ];

  const handleLogout = () => {
    if(window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      navigate('/admin/login');
    }
  };

  return (
    <div className="drawer lg:drawer-open bg-gray-50 min-h-screen font-sans">
      <input id="admin-drawer" type="checkbox" className="drawer-toggle" />
      
      {/* =========================================== */}
      {/* MAIN CONTENT AREA                           */}
      {/* =========================================== */}
      <div className="drawer-content flex flex-col transition-all duration-300">
        
        {/* --- Top Navigation Bar --- */}
        <div className="navbar bg-white border-b border-gray-200 px-4 sticky top-0 z-30 h-16">
          <div className="flex-none lg:hidden">
            <label htmlFor="admin-drawer" aria-label="open sidebar" className="btn btn-square btn-ghost text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </label>
          </div>
          
          <div className="flex-1 px-2">
            <h1 className="text-xl font-bold text-gray-800 capitalize tracking-tight">
              {menuItems.find(i => i.key === currentView)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex-none gap-3">
            {/* Profile Dropdown */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-10">
                  <span className="text-xs">AD</span>
                </div>
              </div>
              <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow-lg menu menu-sm dropdown-content bg-base-100 rounded-box w-52 border border-gray-100">
                <li className="menu-title text-gray-400">Admin Account</li>
                <li><a onClick={() => navigate('/admin/settings')}>Settings</a></li>
                <div className="divider my-0"></div>
                <li><a onClick={handleLogout} className="text-red-500 hover:bg-red-50">Logout</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* --- Dynamic Page Content --- */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-300">
             {children}
          </div>
        </main>
      </div>

      {/* =========================================== */}
      {/* SIDEBAR DRAWER                              */}
      {/* =========================================== */}
      <div className="drawer-side z-40">
        <label htmlFor="admin-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        
        <aside className="w-72 min-h-full bg-white border-r border-gray-200 flex flex-col text-base-content">
          
          {/* Sidebar Header / Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
            <div className="flex items-center gap-2 font-extrabold text-2xl tracking-tighter text-primary">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-lg shadow-md">
                T
              </div>
              TaskPal<span className="text-gray-400 font-normal text-sm self-end mb-1 ml-1">Admin</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 py-6 px-3 overflow-y-auto">
            <ul className="menu gap-2">
              {menuItems.map((item) => {
                const isActive = currentView === item.key;
                return (
                  <li key={item.key}>
                    <button
                      onClick={() => {
                        onNavigate(item.key);
                        // Close mobile drawer if open
                        const drawer = document.getElementById('admin-drawer');
                        if (drawer) drawer.checked = false;
                      }}
                      className={`
                        group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                        ${isActive 
                          ? 'bg-primary text-white shadow-lg shadow-primary/30 font-semibold' 
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {item.icon}
                      </svg>
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Sidebar Footer (Optional Info) */}
          <div className="p-4 border-t border-gray-100">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 font-medium">v2.0.1 Admin Portal</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminLayout;