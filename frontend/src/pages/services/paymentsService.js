// src/services/paymentsService.js
import api from '../../api';
/**
 * Get payout history for the logged-in provider.
 * Uses bearer token for /payments/my-history
 */
export const getMyPayouts = async (token) => {
  if (!token) throw new Error("Authorization token missing.");

  const res = await api.get("/payments/my-history", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data || [];
};