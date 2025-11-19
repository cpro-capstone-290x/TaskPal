// src/pages/profile/Provider/hooks/useProviderPayouts.js
import { useEffect, useState } from "react";
import { getMyPayouts } from "../../../services/paymentsService";

export const useProviderPayouts = (enabled = false) => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) return;
    let isMounted = true;

    const loadPayouts = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("authToken");
        const data = await getMyPayouts(token);
        if (!isMounted) return;
        setPayouts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading payouts:", err);
        if (!isMounted) return;
        setError("Failed to fetch payout history.");
        setPayouts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPayouts();

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  return { payouts, loading, error };
};
