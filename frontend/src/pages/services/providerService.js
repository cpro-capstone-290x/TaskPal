// src/services/providerService.js
import api from '../../api';

export const getPublicProvider = (providerId) =>
  api.get(`/providers/public/${providerId}`);

export const getPublicUser = (userId) =>
  api.get(`/users/public/${userId}`);

/**
 * Get provider details.
 * If the logged-in user is the same provider, hit /providers/:id
 * otherwise use public profile /providers/public/:id
 */
export const getProviderDetails = async (id, { token, role, providerId } = {}) => {
  const numericId = Number(id);
  const numericProviderId = Number(providerId);

  let url = `/providers/public/${id}`;
  if (role === "provider" && numericId === numericProviderId) {
    url = `/providers/${id}`;
  }

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await api.get(url, { headers });

  // assuming backend = { success, data }
  return res.data?.data || res.data;
};

/**
 * Update provider profile.
 */
export const updateProviderProfile = async (id, payload, token) => {
  const res = await api.put(`/providers/${id}`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res.data?.data || res.data;
};

/**
 * Upload provider profile picture.
 */
export const uploadProviderProfilePicture = async (id, file, token) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post(`/providers/${id}/profile-picture`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};