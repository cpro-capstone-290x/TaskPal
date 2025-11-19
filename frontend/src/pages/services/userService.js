// src/services/userService.js
import api from "../../api";

// Get a single user by ID
export const fetchUserById = async (id) => {
  const res = await api.get(`/users/${id}`);

  if (res.data?.success && res.data.data) {
    return res.data.data;
  }

  return res.data; // fallback if backend doesn't wrap in { success, data }
};

// Update user profile
export const updateUserProfile = async (id, payload) => {
  const res = await api.put(`/users/${id}`, payload);
  return res.data?.data || res.data;
};
