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
