// src/hooks/provider/useProviderBookings.js
import { useEffect, useState } from "react";
import { getProviderBookingsWithClientNames } from "../../../services/bookingService";

export const useProviderBookings = (providerId) => {
  const [bookings, setBookings] = useState([]);
  const [ongoingJobs, setOngoingJobs] = useState([]);
  const [historyJobs, setHistoryJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!providerId) return;

    let isMounted = true;

    const loadBookings = async () => {
      setLoading(true);

      try {
        // ⭐ REPLACED — now fetches booking **with client names**
        const data = await getProviderBookingsWithClientNames(providerId);

        if (!isMounted) return;

        // Normalize certain fields
        const normalized = data.map((b) => ({
          ...b,
          status: b.status ? String(b.status).trim() : "",
          completedclient: b.completedclient?.trim().toLowerCase() || "",
          completedprovider: b.completedprovider?.trim().toLowerCase() || "",
        }));

        setBookings(normalized);

        // ------------------------------------
        // ONGOING FILTER (not completed/cancelled)
        // ------------------------------------
        const ongoing = normalized.filter((b) => {
          const s = b.status;

          const finished =
            s === "Completed" ||
            s === "Cancelled" ||
            b.completedclient === "completed" ||
            b.completedprovider === "completed";

          if (finished) return false;

          return ["Paid", "Confirmed", "Pending", "Negotiating"].includes(s);
        });

        // ------------------------------------
        // HISTORY FILTER
        // ------------------------------------
        const history = normalized.filter((b) => {
          const s = b.status;
          return (
            s === "Completed" ||
            s === "Cancelled" ||
            b.completedclient === "completed" ||
            b.completedprovider === "completed"
          );
        });

        setOngoingJobs(ongoing);
        setHistoryJobs(history);
      } catch (err) {
        console.error("Provider booking load error:", err);
        if (isMounted) setBookings([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadBookings();

    return () => {
      isMounted = false;
    };
  }, [providerId]);

  return { bookings, ongoingJobs, historyJobs, loading };
};
