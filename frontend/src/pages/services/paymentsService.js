// src/services/paymentsService.js
import api from "../../api";

/**
 * Get payout history for the logged-in provider.
 * Automatically selects the correct provider token.
 */
export const getMyPayouts = async (token) => {
  // Auto-detect provider token if not passed
  const finalToken =
    token ||
    localStorage.getItem("providerToken") ||
    localStorage.getItem("authToken");

  if (!finalToken) {
    throw new Error("Authorization token missing.");
  }

  try {
    const res = await api.get("/payments/my-history", {
      headers: {
        Authorization: `Bearer ${finalToken}`,
      },
    });

    return res.data || [];
  } catch (err) {
    console.error("❌ Error loading payouts:", err);
    throw err;
  }
};
