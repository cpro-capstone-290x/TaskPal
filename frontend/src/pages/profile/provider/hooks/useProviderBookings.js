import { useEffect, useState } from "react";
import api from "../../../../api";

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
        const res = await api.get(`/bookings?provider_id=${providerId}`);

        if (!isMounted) return;

        let data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        // Normalize status
        data = data.map((b) => ({
          ...b,
          status: b.status ? String(b.status).trim() : "",
          completedclient:
            b.completedclient?.trim().toLowerCase() || "",
          completedprovider:
            b.completedprovider?.trim().toLowerCase() || "",
        }));

        setBookings(data);

        // ---------------------------
        // ONGOING FILTER (IDENTICAL TO CLIENT)
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

        // HISTORY
        const history = data.filter((b) => {
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
        setBookings([]);
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
