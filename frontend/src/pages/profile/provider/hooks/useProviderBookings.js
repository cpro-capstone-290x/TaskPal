// src/pages/profile/Provider/hooks/useProviderBookings.js
import { useEffect, useState } from "react";
import { getProviderBookingsWithClientNames } from "../../../services/bookingService";

export const useProviderBookings = (providerId, shouldFetch) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!providerId || !shouldFetch) return;
    let isMounted = true;

    const loadBookings = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getProviderBookingsWithClientNames(providerId);
        if (!isMounted) return;
        setBookings(data || []);
      } catch (err) {
        console.error("Error loading provider bookings:", err);
        if (!isMounted) return;
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
  }, [providerId, shouldFetch]);

  return { bookings, loading, error };
};
