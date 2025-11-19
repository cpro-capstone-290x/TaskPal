// src/pages/profile/User/hooks/useBookings.js
import { useEffect, useState } from "react";
import api from "../../../../api";

export const useBookings = (clientId) => {
  const [bookings, setBookings] = useState([]);
  const [ongoingBookings, setOngoingBookings] = useState([]);
  const [historyBookings, setHistoryBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clientId) return;

    let isMounted = true;

    const loadBookings = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await api.get(`/bookings?client_id=${clientId}`);
        if (!isMounted) return;

        let data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        // ---------------------------
        // NORMALIZE STATUS + FIELD CLEANUP
        // ---------------------------
        data = data.map((b) => ({
          ...b,
          status: b.status ? String(b.status).trim() : "",
          completedclient: b.completedclient?.trim().toLowerCase() || "",
          completedprovider: b.completedprovider?.trim().toLowerCase() || "",
        }));

        setBookings(data);

        // ---------------------------
        // ONGOING FILTER (exact same logic as provider)
        // ---------------------------
        const ongoing = data.filter((b) => {
          const s = b.status;

          const finished =
            s === "Completed" ||
            s === "Cancelled" ||
            b.completedclient === "completed" ||
            b.completedprovider === "completed";

          if (finished) return false;

          return (
            s === "Paid" ||
            s === "Confirmed" ||
            s === "Pending" ||
            s === "Negotiating"
          );
        });

        // ---------------------------
        // HISTORY FILTER
        // ---------------------------
        const history = data.filter((b) => {
          const s = b.status;
          return (
            s === "Completed" ||
            s === "Cancelled" ||
            b.completedclient === "completed" ||
            b.completedprovider === "completed"
          );
        });

        setOngoingBookings(ongoing);
        setHistoryBookings(history);
      } catch (err) {
        if (!isMounted) return;
        console.error("Error fetching bookings:", err);
        setError("Failed to load bookings.");
        setBookings([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadBookings();

    return () => {
      isMounted = false;
    };
  }, [clientId]);

  return {
    bookings,
    ongoingBookings, // ⭐ NEW!
    historyBookings, // ⭐ NEW!
    loading,
    error,
  };
};
