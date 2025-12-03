import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import AccessibilityToggle from './AccessibilityToggle';

/* ---------------------------------------------------------- */
/* ICONS (UNCHANGED)                                           */
/* ---------------------------------------------------------- */
const BellIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const CheckIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const MessageCircleIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const CalendarClockIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M16 14.5a3.5 3.5 0 1 1-3.5 3.5" />
    <path d="M16 16v1.8l1.2.7" />
  </svg>
);

const CreditCardIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <line x1="6" y1="15" x2="7" y2="15" />
    <line x1="10" y1="15" x2="11" y2="15" />
  </svg>
);

const AlertTriangleIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.73 18.87 13.82 4.26a2 2 0 0 0-3.54 0L2.27 18.87A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3.13Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const InfoIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const ClockIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);


/* ---------------------------------------------------------- */
/* UTILITIES                                                   */
/* ---------------------------------------------------------- */
function formatTimeAgo(isoDate) {
  const now = new Date();
  const date = new Date(isoDate);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
}


/* ---------------------------------------------------------- */
/* NOTIFICATION ICON RENDERING                                 */
/* ---------------------------------------------------------- */
const NotificationIcon = ({ type }) => {
  switch (type) {
    case 'message': return <span className="p-2 rounded-full bg-sky-100 text-sky-700"><MessageCircleIcon /></span>;
    case 'booking': return <span className="p-2 rounded-full bg-emerald-100 text-emerald-700"><CalendarClockIcon /></span>;
    case 'payment': return <span className="p-2 rounded-full bg-amber-100 text-amber-700"><CreditCardIcon /></span>;
    case 'warning': return <span className="p-2 rounded-full bg-red-100 text-red-700"><AlertTriangleIcon /></span>;
    default:        return <span className="p-2 rounded-full bg-slate-100 text-slate-700"><InfoIcon /></span>;
  }
};


/* ---------------------------------------------------------- */
/* NOTIFICATION CARD                                           */
/* ---------------------------------------------------------- */
const NotificationCard = ({ notification, onClick, isRead }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-start gap-3 rounded-xl px-3 py-2 text-left transition ${
      isRead ? 'bg-white hover:bg-slate-50'
            : 'bg-sky-50 hover:bg-sky-100 border border-sky-100'
    }`}
  >
    <div className="mt-1">
      <NotificationIcon type={notification.type} />
    </div>

    <div className="flex-1 overflow-hidden">
      <p className="text-sm font-semibold text-gray-900 truncate">{notification.title}</p>
      <p className="text-sm text-gray-700 truncate">{notification.message}</p>
      <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(notification.timestamp)}</p>
    </div>

    {!isRead && (
      <div className="flex-shrink-0 mt-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
          <ClockIcon className="h-3 w-3" /> New
        </span>
      </div>
    )}
  </button>
);


/* ---------------------------------------------------------- */
/* NOTIFICATION BELL                                            */
/* ---------------------------------------------------------- */
const NotificationBell = ({
  notifications,
  onNotificationClick,
  onMarkAllAsRead,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadIds, setUnreadIds] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const ids = notifications.filter(n => !n.read).map(n => n.id);
    setUnreadIds(ids);
  }, [notifications]);

  const unreadCount = unreadIds.length;

  const handleNotificationClick = (n) => {
    onNotificationClick(n);
    setIsOpen(false);
  };

  const handleClickOutside = useCallback((e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, handleClickOutside]);


  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-900 shadow-sm transition hover:border-sky-400 hover:text-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6" />

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold leading-none text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-80 origin-top-right rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                <BellIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                <p className="text-xs text-slate-500">
                  {unreadCount > 0 ? `${unreadCount} unread` : "You are all caught up"}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
              >
                <CheckIcon className="h-3 w-3" /> Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                  <BellIcon className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-slate-900">No notifications yet</p>
                <p className="text-xs text-slate-500">
                  Updates about your bookings and tasks will appear here.
                </p>
              </div>
            ) : (
              notifications.map(n => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  onClick={() => handleNotificationClick(n)}
                  isRead={n.read}
                />
              ))
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
            <p className="text-[11px] text-slate-500">
              Tip: Enable notifications so you don't miss updates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};


/* ---------------------------------------------------------- */
/* HEADER MAIN COMPONENT                                       */
/* ---------------------------------------------------------- */
const navLinks = [
  { name: "Home", path: "/" },
  { name: "Services", path: "/services" },
  { name: "Contact", path: "/contact" }
];

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const socketRef = useRef(null);

  // Detect provider login view, e.g. /login?type=provider
  const isProviderLoginView =
    pathname === "/login" && (search || "").includes("type=provider");

  // Provider mode: logged-in provider OR provider login page
  const isProvider = userRole === "provider" || isProviderLoginView;

  // Only treat as "provider logged in" when actually authenticated as provider
  const isProviderLoggedIn = isLoggedIn && userRole === "provider";

  // Accessibility is hidden for admin + provider modes
  const showAccessibility = !pathname.startsWith("/admin") && !isProvider;


  /* ---------------------------------------------------------- */
  /* LOAD USER SESSION                                          */
  /* ---------------------------------------------------------- */
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const uid = localStorage.getItem("userId");
    const role = localStorage.getItem("userRole");

    setIsLoggedIn(!!token);
    if (token) {
      setUserId(uid);
      setUserRole(role);
    } else {
      setUserId(null);
      setUserRole(null);
    }
  }, []);


  /* ---------------------------------------------------------- */
  /* FETCH NOTIFICATIONS FROM BACKEND (PERSISTENT)              */
  /* ---------------------------------------------------------- */
  const fetchNotifications = async () => {
    const token = localStorage.getItem("authToken");
    if (!token || !userId) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/notifications/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json();

      if (data?.data) {
        const formatted = data.data.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          booking_id: n.booking_id,
          read: n.is_read,
          timestamp: n.created_at
        }));

        setNotifications(formatted);
      }
    } catch (err) {
      console.error("❌ Failed to load notifications", err);
    }
  };


  /* ---------------------------------------------------------- */
  /* INITIAL NOTIFICATION LOAD                                  */
  /* ---------------------------------------------------------- */
  useEffect(() => {
    if (isLoggedIn && userId) fetchNotifications();
  }, [isLoggedIn, userId]);


  /* ---------------------------------------------------------- */
  /* SOCKET CONNECTION (REAL-TIME UPDATES)                      */
  /* ---------------------------------------------------------- */
  useEffect(() => {
    if (isLoggedIn && userId) {
      const socketUrl =
        import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

      socketRef.current = io(socketUrl, { transports: ["websocket", "polling"] });
      const socket = socketRef.current;

      socket.on("connect", () => {
        console.log("🔔 Connected:", socket.id);
        socket.emit("join_notification_room", { userId });
      });

      socket.on("new_message", fetchNotifications);
      socket.on("new_booking", fetchNotifications);
      socket.on("payment_agreed", fetchNotifications);
      socket.on("booking_cancelled", fetchNotifications);
      socket.on("execution_update", (data) => {
        console.log("🔥 Execution Update:", data);
        fetchNotifications();
      });

      return () => {
        socket.off("new_message");
        socket.off("new_booking");
        socket.off("payment_agreed");
        socket.off("booking_cancelled");
        socket.off("execution_update");
        socket.disconnect();
      };
    } else {
      if (socketRef.current) socketRef.current.disconnect();
      socketRef.current = null;
      setNotifications([]);
    }
  }, [isLoggedIn, userId]);


  /* ---------------------------------------------------------- */
  /* CLICK HANDLING                                             */
  /* ---------------------------------------------------------- */
  const handleNotificationClick = (n) => {
    const id = n.booking_id;

    if (n.type === "execution" && id) {
      navigate(`/execution/${id}`);
      setMobileOpen(false);
      return;
    }

    if (id) {
      navigate(
        userRole === "provider"
          ? `/chat/${id}/provider`
          : `/chat/${id}/user`
      );
      setMobileOpen(false);
      return;
    }

    if (n.type === "message") {
      navigate("/chat");
      setMobileOpen(false);
      return;
    }

    navigate(userRole === "provider" ? "/provider" : "/user");
    setMobileOpen(false);
  };


  /* ---------------------------------------------------------- */
  /* MARK ALL READ                                              */
  /* ---------------------------------------------------------- */
  const markAllAsRead = async () => {
    const token = localStorage.getItem("authToken");
    if (!token || !userId) return;

    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/notifications/${userId}/mark-all`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (err) {
      console.error("❌ Failed to mark all as read", err);
    }

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };


  /* ---------------------------------------------------------- */
  /* PROFILE PATH                                                */
  /* ---------------------------------------------------------- */
  const profilePath = isLoggedIn
    ? userRole === "provider"
      ? `/profileProvider/${userId}`
      : `/profile/${userId}`
    : "/login";


  /* ---------------------------------------------------------- */
  /* LOGOUT                                                     */
  /* ---------------------------------------------------------- */
  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserId(null);
    setUserRole(null);

    if (socketRef.current) socketRef.current.disconnect();

    navigate("/login");
    setMobileOpen(false);
  };


  /* ---------------------------------------------------------- */
  /* RENDER UI                                                  */
  /* ---------------------------------------------------------- */
  return (
    <header className="bg-slate-50/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        
        {/* TOP BAR */}
        <div className="h-20 flex items-center justify-between gap-6">
          
          {/* Logo */}
          {isProviderLoggedIn ? (
            // 🔒 Logged-in providers: logo is NOT clickable
            <div
              className="inline-flex items-center gap-2 text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 select-none"
              aria-label="TaskPal"
            >
              <span className="px-1 rounded-md bg-transparent">
                <span className="text-pink-600">Task</span>
                <span className="text-sky-700">Pal</span>
              </span>
            </div>
          ) : (
            // Everyone else (users, guests): logo navigates to home
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900"
              aria-label="TaskPal Home"
            >
              <span className="px-1 rounded-md bg-transparent">
                <span className="text-pink-600">Task</span>
                <span className="text-sky-700">Pal</span>
              </span>
            </button>
          )}

          {/* Desktop Nav (center) */}
          <nav className="hidden md:flex items-center justify-center flex-1">
            <ul className="flex items-center gap-8 lg:gap-12">
              {/* Hide nav links for providers */}
              {!isProvider && navLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="inline-flex items-center h-12 px-3 text-lg lg:text-xl font-semibold text-gray-900 hover:text-sky-700"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}

              {showAccessibility && (
                <li className="hidden md:block">
                  <AccessibilityToggle variant="nav" />
                </li>
              )}

              {/* Profile in center ONLY for non-providers */}
              {!isProvider && (
                <li>
                  <Link
                    to={profilePath}
                    className="inline-flex items-center h-12 px-3 text-lg lg:text-xl font-semibold text-gray-900 hover:text-sky-700"
                  >
                    Profile
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {/* For providers: show Profile label on the right, next to bell */}
            {isLoggedIn && isProvider && (
              <Link
                to={profilePath}
                className="text-lg lg:text-xl font-semibold text-gray-900 hover:text-sky-700"
              >
                Profile
              </Link>
            )}

            {isLoggedIn && (
              <NotificationBell
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                onMarkAllAsRead={markAllAsRead}
                className="mr-1"
              />
            )}

            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="h-12 px-6 rounded-full bg-red-600 text-white text-lg lg:text-xl font-semibold hover:bg-red-700"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="h-12 px-6 rounded-full bg-sky-700 text-white text-lg lg:text-xl font-semibold hover:bg-sky-800 flex items-center justify-center"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Right */}
          <div className="md:hidden flex items-center gap-2">
            {isLoggedIn && (
              <NotificationBell
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                onMarkAllAsRead={markAllAsRead}
              />
            )}

            {/* Hamburger (unchanged) */}
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 text-slate-900 hover:bg-white/60"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close main menu" : "Open main menu"}
            >
              <svg width="22" height="22" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 animate-in fade-in slide-in-from-top-2">
            <div className="rounded-xl border border-slate-200 shadow-sm bg-white p-3">

              <nav className="flex flex-col">
                {/* Hide nav links for providers in mobile as well */}
                {!isProvider && navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-3 rounded-lg text-[15px] font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    {link.name}
                  </Link>
                ))}

                {showAccessibility && (
                  <div className="px-0 py-0">
                    <AccessibilityToggle variant="menu" />
                  </div>
                )}

                <Link
                  to={profilePath}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-3 rounded-lg text-[15px] font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Profile
                </Link>
              </nav>

              <div className="my-2 h-px bg-slate-200" />

              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="w-full h-11 px-4 rounded-full bg-red-600 text-white text-[15px] font-semibold hover:bg-red-700"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full h-11 px-4 rounded-full bg-sky-700 text-white text-[15px] font-semibold hover:bg-sky-800 flex items-center justify-center"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
