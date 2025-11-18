// src/services/reviewService.js
import api from '../../api';

export const getProviderReviews = (providerId) =>
  api.get(`/reviews/provider/${providerId}`);
