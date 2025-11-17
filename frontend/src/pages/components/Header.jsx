// src/pages/components/Header.jsx
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
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const CheckIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const MessageCircleIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const CalendarClockIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M16 14.5a3.5 3.5 0 1 1-3.5 3.5" />
    <path d="M16 16v1.8l1.2.7" />
  </svg>
);

const CreditCardIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <line x1="6" y1="15" x2="7" y2="15" />
    <line x1="10" y1="15" x2="11" y2="15" />
  </svg>
);

const AlertTriangleIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.73 18.87 13.82 4.26a2 2 0 0 0-3.54 0L2.27 18.87A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3.13Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const InfoIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const AlertCircleIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ClockIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const MapPinIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const UsersIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M20 8v6" />
    <path d="M23 11h-6" />
  </svg>
);

const BadgeCheckIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7.5 4.21 12 2l4.5 2.21L20 6l.5 4L20 14l-3.5 2-4.5 2-4.5-2L4 14l-.5-4L4 6z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const CheckCircle2Icon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const UserCheckIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 7a4 4 0 1 0 4-4 4 4 0 0 0-4 4Z" />
    <path d="M2 21a6 6 0 0 1 12 0" />
    <path d="m16 11 2 2 4-4" />
  </svg>
);

const AlertOctagonIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const BadgeDollarSignIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M10 17V9a2 2 0 0 1 2-2h.5a2.5 2.5 0 0 1 0 5H8" />
  </svg>
);

const HandCoinsIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 15V5c0-1.1-.9-2-2-2h-5" />
    <path d="M6 2H4c-1.1 0-2 .9-2 2v12" />
    <path d="M2 20h4" />
    <path d="M2 15h8a2 2 0 0 1 0 4h-2" />
    <circle cx="16" cy="9" r="2" />
  </svg>
);

const BadgePercentIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="7" cy="7" r="3" />
    <path d="m13 11-4 4" />
    <circle cx="17" cy="17" r="3" />
  </svg>
);

const BadgeInfoIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const BadgeHelpIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const ReceiptTextIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 2v20l4-2 4 2 4-2 4 2V2H4Z" />
    <path d="M14 8H8" />
    <path d="M16 12H8" />
    <path d="M13 16H8" />
  </svg>
);

const ShieldCheckIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const BadgeAlertIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const BadgeXIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);

const BadgeClockIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const BadgeMessageIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 21v-4" />
    <path d="M4 5v4" />
    <path d="M20 5v4" />
    <path d="M20 17v-4" />
    <path d="M12 3v18" />
    <path d="M17 8H7" />
    <path d="M17 16H7" />
  </svg>
);

const BadgeCalendarIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01" />
    <path d="M12 14h.01" />
    <path d="M16 14h.01" />
    <path d="M8 18h.01" />
    <path d="M12 18h.01" />
    <path d="M16 18h.01" />
  </svg>
);

const BadgeUserIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M6 20a6 6 0 0 1 12 0" />
  </svg>
);

const BadgeStarIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15 8.5 22 9.5 17 14 18.5 21 12 17.5 5.5 21 7 14 2 9.5 9 8.5 12 2" />
  </svg>
);

const BadgeLocationIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="10" r="3" />
    <path d="M12 2C8 2 4 5 4 9c0 5 8 13 8 13s8-8 8-13c0-4-4-7-8-7z" />
  </svg>
);

const BadgeBookingIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M9 14h6" />
    <path d="M9 18h4" />
  </svg>
);

const BadgeSupportIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 15a4 4 0 1 0 8 0" />
    <path d="M9 9h.01" />
    <path d="M15 9h.01" />
  </svg>
);

const BadgeTaskIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M9 9h6" />
    <path d="M9 13h4" />
    <path d="M9 17h2" />
    <path d="M7 2h10" />
  </svg>
);

const BadgeAppointmentIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <circle cx="12" cy="16" r="3" />
  </svg>
);

const BadgeAccessibilityIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="4" r="2" />
    <path d="M10 22l2-6 2 6" />
    <path d="M4 10l4 1 2 3h0l2-3 4-1" />
    <path d="m2 10 4 12" />
    <path d="m22 10-4 12" />
  </svg>
);

const BadgeSettingsIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9.08 20a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
);

const BadgeSupportAgentIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="7" r="4" />
    <path d="M6 21a6 6 0 0 1 12 0" />
    <path d="M4 11h1a2 2 0 0 1 2 2v1" />
    <path d="M20 11h-1a2 2 0 0 0-2 2v1" />
  </svg>
);

const BadgeHelpCircleIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const BadgeLocationCheckIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="10" r="3" />
    <path d="M12 2C8 2 4 5 4 9c0 5 8 13 8 13s8-8 8-13c0-4-4-7-8-7z" />
    <polyline points="9 10 11 12 15 8" />
  </svg>
);

// --- Notification Helper Components ---

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

const NotificationIcon = ({ type }) => {
  switch (type) {
    case 'message':
      return (
        <span className="p-2 rounded-full bg-sky-100 text-sky-600">
          <MessageCircleIcon />
        </span>
      );
    case 'booking':
      return (
        <span className="p-2 rounded-full bg-emerald-100 text-emerald-600">
          <CalendarClockIcon />
        </span>
      );
    case 'payment':
      return (
        <span className="p-2 rounded-full bg-amber-100 text-amber-600">
          <CreditCardIcon />
        </span>
      );
    case 'warning':
      return (
        <span className="p-2 rounded-full bg-red-100 text-red-600">
          <AlertTriangleIcon />
        </span>
      );
    case 'info':
      return (
        <span className="p-2 rounded-full bg-slate-100 text-slate-600">
          <InfoIcon />
        </span>
      );
    default:
      return (
        <span className="p-2 rounded-full bg-slate-100 text-slate-600">
          <AlertCircleIcon />
        </span>
      );
  }
};

const NotificationCard = ({ notification, onClick, isRead }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 rounded-xl px-3 py-2 text-left transition ${
        isRead
          ? 'bg-white hover:bg-slate-50'
          : 'bg-sky-50 hover:bg-sky-100 border border-sky-100'
      }`}
    >
      <div className="mt-1">
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
        <div className="flex-shrink-0 mt-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
            <ClockIcon className="h-3 w-3" />
            New
          </span>
        </div>
      )}
    </button>
  );
};

const NotificationBell = ({
  notifications,
  onNotificationClick,
  onMarkAllAsRead,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadIds, setUnreadIds] = useState([]);
  const dropdownRef = useRef(null);

  const unreadCount = unreadIds.length;

  useEffect(() => {
    const ids = notifications
      .filter((n) => n && n.id && !n.read)
      .map((n) => n.id);
    setUnreadIds(ids);
  }, [notifications]);

  const handleNotificationClick = (notification) => {
    setUnreadIds((prev) => prev.filter((id) => id !== notification.id));
    onNotificationClick(notification);
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    setUnreadIds([]);
    onMarkAllAsRead();
  };

  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-sky-400 hover:text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold leading-none text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 sm:right-0 sm:left-auto sm:translate-x-0 z-50 mt-3 w-[90vw] max-w-sm sm:w-80 sm:max-w-none origin-top-right rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                <BellIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Notifications
                </p>
                <p className="text-xs text-slate-500">
                  {unreadCount > 0
                    ? `${unreadCount} unread`
                    : 'You are all caught up'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
              >
                <CheckIcon className="h-3 w-3" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                <div className="relative">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                    <BellIcon className="h-5 w-5" />
                  </span>
                  <span className="absolute -right-1 bottom-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <CheckCircle2Icon className="h-3 w-3" />
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  No notifications yet
                </p>
                <p className="text-xs text-slate-500">
                  New updates about your bookings and tasks will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    isRead={!unreadIds.includes(notification.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
            <p className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Tip: Enable notifications so you don&apos;t miss updates.</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Header Component ---

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Services', path: '/services' },
  { name: 'Contact', path: '/contact' },
];

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const socketRef = useRef(null);

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

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');

    setIsLoggedIn(false);
    setUserId(null);
    setUserRole(null);

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    navigate('/login');
  };

  useEffect(() => {
    if (isLoggedIn && userId) {
      const socket = io(import.meta.env.VITE_API_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socketRef.current = socket;

      socket.emit('register', { userId });

      socket.on('new_message', (data) => {
        setNotifications((prev) => [
          {
            id: `msg_${Date.now()}`,
            type: 'message',
            title: 'New message received',
            message: data?.message || 'You have a new message',
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
      });

      socket.on('new_booking', (data) => {
        setNotifications((prev) => [
          {
            id: `booking_${Date.now()}`,
            type: 'booking',
            title: 'New booking request',
            message:
              data?.bookingDetails ||
              'You have a new booking request (details may vary).',
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
      });

      socket.on('payment_agreed', (data) => {
        setNotifications((prev) => [
          {
            id: `payment_${Date.now()}`,
            type: 'payment',
            title: 'Payment agreed',
            message:
              data?.message ||
              'A customer has agreed to your payment terms. Please review.',
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
      });

      socket.on('booking_cancelled', (data) => {
        setNotifications((prev) => [
          {
            id: `cancel_${Date.now()}`,
            type: 'warning',
            title: 'Booking cancelled',
            message:
              data?.message ||
              'A booking has been cancelled. Check the details on your dashboard.',
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
      });

      return () => {
        socket.off('new_message');
        socket.off('new_booking');
        socket.off('payment_agreed');
        socket.off('booking_cancelled');
        socket.disconnect();
      };
    } else {
      setNotifications([]);

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }
  }, [isLoggedIn, userId]);

  const handleNotificationClick = (notification) => {
    if (!notification) return;

    switch (notification.type) {
      case 'message':
        navigate('/chat');
        break;
      case 'booking':
        if (userRole === 'provider') {
          navigate('/profileProvider');
        } else {
          navigate('/bookings');
        }
        break;
      case 'payment':
        if (userRole === 'provider') {
          navigate('/profileProvider');
        } else {
          navigate('/payments');
        }
        break;
      case 'warning':
      case 'info':
      default:
        if (userRole === 'provider') {
          navigate('/profileProvider');
        } else {
          navigate('/profile');
        }
        break;
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Responsive, mobile-friendly header layout
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-y-3">
        {/* Logo */}
        <div
          className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight cursor-pointer"
          onClick={() => navigate('/')}
        >
          <span className="text-secondary">Task</span>Pal
        </div>

        {/* Navigation */}
        <nav className="w-full sm:w-auto">
          <ul className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm sm:text-base">
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
            <li className="flex flex-wrap items-center gap-3">
              {isLoggedIn ? (
                <>
                  {/* Notification Bell */}
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
                  className="px-4 py-2 rounded-full bg-sky-600 text-white font-semibold hover:bg-sky-700 transition w-full sm:w-auto text-center"
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
