// src/pages/profile/User/hooks/useBookings.js
import { useEffect, useState } from "react";
import api from "../../../../api";

export const useBookings = (clientId) => {
  const [bookings, setBookings] = useState([]);
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

        let data = [];
        if (Array.isArray(res.data)) {
          data = res.data;
        } else if (Array.isArray(res.data?.data)) {
          data = res.data.data;
        }

        setBookings(data || []);
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

  return { bookings, loading, error };
};
