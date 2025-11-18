import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const GlobalAnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [closed, setClosed] = useState(
    () => localStorage.getItem("bannerClosedTime") &&
          Date.now() - Number(localStorage.getItem("bannerClosedTime")) < 60000
  );
  const [animateOut, setAnimateOut] = useState(false);

  const BASE_URL =
    import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
    "http://localhost:5000/api";

  const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:5000";

  /* --------------------------------------------------------
     INITIAL FETCH
  -------------------------------------------------------- */
  useEffect(() => {
    if (closed) return;

    const fetchAnnouncement = async () => {
      try {
        const res = await fetch(`${BASE_URL}/announcements/active`);
        const raw = await res.text();

        let data;
        try {
          data = JSON.parse(raw);
        } catch {
          return;
        }

        if (data.success && data.data?.is_active) {
          setAnnouncement(data.data);
        }
      } catch {}
    };

    fetchAnnouncement();
  }, [closed]);

  /* --------------------------------------------------------
     SOCKET.IO REAL-TIME UPDATES
  -------------------------------------------------------- */
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    socket.on("announcement:activated", (data) => {
      setClosed(false);
      setAnimateOut(false);
      localStorage.removeItem("bannerClosedTime");
      setAnnouncement(data);
    });

    socket.on("announcement:completed", () => {
      setAnimateOut(true);
      setTimeout(() => setAnnouncement(null), 400);
    });

    socket.on("announcement:deleted", () => {
      setAnimateOut(true);
      setTimeout(() => setAnnouncement(null), 400);
    });

    return () => socket.disconnect();
  }, []);

  /* --------------------------------------------------------
     HANDLE CLOSE BUTTON
  -------------------------------------------------------- */
  const closeBanner = () => {
    setAnimateOut(true);
    localStorage.setItem("bannerClosedTime", Date.now().toString());
    setTimeout(() => setClosed(true), 400);
  };

  if (!announcement || closed) return null;

  return (
    <div
      className={`
        bg-yellow-400 text-black p-3 flex justify-between items-center shadow-md w-full z-50
        ${animateOut ? "animate-slideUpFade" : "animate-slideDownFade"}
      `}
    >
      <div className="font-medium">
        <strong>{announcement.title}</strong>: {announcement.message}
      </div>

      <button className="btn btn-xs btn-outline" onClick={closeBanner}>
        Close
      </button>
    </div>
  );
};

export default GlobalAnnouncementBanner;
