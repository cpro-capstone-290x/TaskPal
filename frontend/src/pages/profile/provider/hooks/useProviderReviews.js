import { useEffect, useState } from "react";
import api from "../../../../api";

export const useProviderReviews = (providerId) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!providerId) return;
    const fetchReviews = async () => {
      try {
        const res = await api.get(`/reviews/provider/${providerId}`);
        setReviews(res.data?.data || res.data || []);
      } catch (err) {
        console.error("❌ Provider Review Fetch Error:", err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [providerId]);

  return { reviews, loading };
};
