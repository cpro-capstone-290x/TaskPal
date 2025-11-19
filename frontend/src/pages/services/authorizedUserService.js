// src/services/authorizedUserService.js
import api from "../../api";

// Get authorized user for a client
export const fetchAuthorizedUserForClient = async (clientId) => {
  const res = await api.get(`/auth/authorized-users/${clientId}`);
  return res.data;
};

// Register a new authorized user (OTP flow)
export const registerAuthorizedUser = async (payload) => {
  const res = await api.post("/auth/registerAuthorizedUser", payload);
  return res.data;
};

// Remove authorized user by ID
export const removeAuthorizedUser = async (authorizedUserId) => {
  const res = await api.delete(`/auth/authorized-user/${authorizedUserId}`);
  return res.data;
};
