// src/services/providerService.js
import api from '../../api';

export const getPublicProvider = (providerId) =>
  api.get(`/providers/public/${providerId}`);

export const getPublicUser = (userId) =>
  api.get(`/users/public/${userId}`);
