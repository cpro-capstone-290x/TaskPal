import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

// --- SVG Icons (Moved outside component for cleanliness) ---

const BellIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const MessageIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const CalendarIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const DollarIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" x2="12" y1="1" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

// --- Notification Helper Components ---

function formatTimeAgo(isoDate) {
  const now = new Date();
  const date = new Date(isoDate);
  const seconds = Math.floor((now - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm ago';
  return Math.floor(seconds) + 's ago';
}

function NotificationIcon({ type }) {
  const iconProps = { size: 20, className: 'flex-shrink-0 w-5 h-5' };
  switch (type) {
    case 'message':
      return <MessageIcon {...iconProps} className="text-blue-500" />;
    case 'booking':
      return <CalendarIcon {...iconProps} className="text-green-500" />;
    case 'payment':
      return <DollarIcon {...iconProps} className="text-yellow-600" />;
    default:
      return <BellIcon {...iconProps} className="text-gray-500" />;
  }
}

function NotificationItem({ notification, onNotificationClick }) {
  const isRead = notification.read;
  return (
    <li
      className={`flex gap-4 p-4 transition-colors duration-150 cursor-pointer ${
        isRead
          ? 'bg-white hover:bg-gray-50'
          : 'bg-blue-50 hover:bg-blue-100'
      }`}
      onClick={() => onNotificationClick(notification)}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
        <NotificationIcon type={notification.type} />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {notification.title}
        </p>
        <p className="text-sm text-gray-600 truncate">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {formatTimeAgo(notification.timestamp)}
        </p>
      </div>
      {!isRead && (
        <div className="flex-shrink-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
        </div>
      )}
    </li>
  );
}

function NotificationBell({
  notifications,
  onNotificationClick,
  onMarkAllAsRead,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <span className="sr-only">View notifications</span>
        <BellIcon size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <div
        className={`absolute top-12 right-0 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 transition-all duration-200 ease-out transform origin-top-right
          ${
            isOpen
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
          <button
            onClick={() => {
              onMarkAllAsRead();
              setIsOpen(false);
            }}
            disabled={unreadCount === 0}
            className="text-sm text-blue-500 hover:underline disabled:text-gray-400 disabled:no-underline"
          >
            Mark all as read
          </button>
        </div>

        {notifications.length > 0 ? (
          <ul className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {notifications
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onNotificationClick={(notif) => {
                    onNotificationClick(notif);
                    setIsOpen(false);
                  }}
                />
              ))}
          </ul>
        ) : (
          <p className="p-8 text-center text-gray-500">
            You have no new notifications.
          </p>
        )}
      </div>
    </div>
  );
}

// --- Your Header Component ---

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const socketRef = useRef(null);

  // ✅ Check login status on load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUserId = localStorage.getItem('userId');
    const storedUserRole = localStorage.getItem('userRole');
    setIsLoggedIn(!!token);
    if (token) {
      setUserId(storedUserId);
      setUserRole(storedUserRole);
    }
  }, []);

  // --- Notification Logic ---

  // Function to add a new notification (called by WebSocket)
  const addNotification = useCallback((notificationData) => {
    const newNotification = {
      id: Date.now(),
      ...notificationData,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  }, []);

// ✅ NEW Function to mark as read AND navigate
  const handleNotificationClick = useCallback((notification) => {
    // 1. Mark as read in state
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );

    // 2. (Optional) Tell backend to mark as read
    // fetch(`/api/notifications/${notification.id}/read`, { method: 'POST', ... });

    // 3. Navigate if a booking_id exists
    if (notification.booking_id) {
      navigate(`/chat/${notification.booking_id}`);
    } else {
      console.warn("Notification clicked, but no booking_id found.", notification);
    }
  }, [navigate]); // Dependency on navigate

  // Function to mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    // You should also tell your backend to mark all as read
    // fetch(`/api/notifications/mark-all-read`, { method: 'POST', ... });
  };

  // ✅ Effect to fetch notifications and listen for real-time updates
  useEffect(() => {
    if (isLoggedIn && userId) {
      // 1. FETCH EXISTING NOTIFICATIONS
      // This is where you'd call your API
      // fetch(`/api/notifications/user/${userId}`)
      //   .then(res => res.json())
      //   .then(data => setNotifications(data))
      //   .catch(err => console.error("Failed to fetch notifications:", err));

      // Making an initial load for demo purposes (remove this in production)
      // setNotifications([
      //   {
      //     id: 1,
      //     type: 'message',
      //     title: 'Welcome!',
      //     message: 'This is your notification center.',
      //     timestamp: new Date().toISOString(),
      //     read: false,
      //   },
      // ]);

      // 2. SET UP WEBSOCKET LISTENER
      // This is where you connect to Socket.IO or your WebSocket server
      const socketUrl = "http://localhost:5000"; // Or "https://taskpal-14oy.onrender.com"
      socketRef.current = io(socketUrl, {
        transports: ['websocket', 'polling']
      });
      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log("🔔 Connected to notification socket:", socket.id);
        socket.emit('join_notification_room', { userId });
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      // Listen for all our notification types
      socket.on('new_message', (data) => {
        addNotification(data);
      });

      // Listen for 'new_message' event from your server
      // socket.on('new_message', (data) => {
      //   addNotification({
      //     type: 'message',
      //     title: data.title || 'New Message',
      //     message: data.message || `From: ${data.senderName}`,
      //   });
      // });
      
      socket.on('new_booking', (data) => {
        addNotification(data);
      });
      socket.on('payment_agreed', (data) => {
        addNotification(data);
      });
      socket.on('booking_cancelled', (data) => { // <-- ADDED LISTENER
        addNotification(data);
      });

      // Clean up the listener when the component unmounts or user logs out
      return () => {
        console.log("Disconnecting notif socket...")
        socket.off('new_message');
        socket.off('new_booking');
        socket.off('payment_agreed');
        socket.off('booking_cancelled'); // <-- ADDED CLEANUP
        socket.disconnect();
      };

    } else {
      // If user logs out, clear notifications
      setNotifications([]);
      if (socketRef.current) {
         socketRef.current.disconnect();
         socketRef.current = null;
      }
    }
  }, [isLoggedIn, userId, addNotification]); // Dependencies


  // ✅ Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('pendingRedirect');
    setIsLoggedIn(false);
    setUserId(null); // Clear userId from state
    setUserRole(null); // Clear userRole from state
    console.log('👋 You have been logged out successfully.'); // Replaced alert
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <div
          className="text-2xl font-extrabold text-primary tracking-tight cursor-pointer"
          onClick={() => navigate('/')}
        >
          <span className="text-secondary">Task</span>Pal
        </div>

        {/* Navigation */}
        <nav>
          <ul className="flex space-x-6 items-center">
            {/* Static links */}
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className="text-gray-600 hover:text-sky-600 font-medium transition"
                >
                  {link.name}
                </Link>
              </li>
            ))}

            {/* Auth-based actions */}
            <li className="flex items-center space-x-4">
              {isLoggedIn ? (
                <>
                  {/* --- NOTIFICATION BELL ADDED HERE --- */}
                  <NotificationBell
                    notifications={notifications}
                    onNotificationClick={handleNotificationClick}
                    onMarkAllAsRead={markAllAsRead}
                  />

                  {/* Profile Link */}
                  <Link
                    to={
                      userRole === 'provider'
                        ? `/profileProvider/${userId}`
                        : `/profile/${userId}`
                    }
                    className="text-gray-600 hover:text-sky-600 font-medium transition"
                  >
                    Profile
                  </Link>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full bg-sky-600 text-white font-semibold hover:bg-sky-700 transition"
                >
                  Login
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
