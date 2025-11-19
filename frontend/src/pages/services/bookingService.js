// src/services/bookingService.js
import api from '../../api';

export const getBookingById = (bookingId, config) =>
  api.get(`/bookings/${bookingId}`, config);

export const updateBookingPrice = (bookingId, price, config) =>
  api.put(`/bookings/${bookingId}/price`, { price }, config);

export const agreeToPrice = (bookingId, role, config) =>
  api.put(`/bookings/${bookingId}/agree`, { role }, config);

export const cancelBooking = (bookingId, config) =>
  api.put(`/bookings/${bookingId}/cancel`, {}, config);

export const createPaymentIntent = (bookingId, config) =>
  api.post(`/payments/create-intent/${bookingId}`, {}, config);

export const fetchAgreementJson = (bookingId, config) =>
  api.get(`/bookings/${bookingId}/agreement`, config); // expects JSON { url }

/**
 * Get bookings for a provider and enrich them with client names.
 */
export const getProviderBookingsWithClientNames = async (providerId) => {
  const res = await api.get(`/bookings?provider_id=${providerId}`);
  const raw = res.data?.data || res.data || [];

  if (!Array.isArray(raw)) return [];

  const uniqueClientIds = [...new Set(raw.map((b) => b.client_id))];

  const userResponses = await Promise.all(
    uniqueClientIds.map((cid) => api.get(`/users/${cid}`))
  );

  const idToName = userResponses.reduce((acc, r) => {
    const data = r.data?.data || r.data;
    if (data?.id) {
      acc[data.id] = `${data.first_name || ""} ${data.last_name || ""}`.trim();
    }
    return acc;
  }, {});

  return raw.map((b) => ({
    ...b,
    client_name: idToName[b.client_id] || "N/A",
  }));
};