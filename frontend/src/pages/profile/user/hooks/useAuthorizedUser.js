// src/pages/profile/User/hooks/useAuthorizedUser.js
import { useCallback, useEffect, useState } from "react";
import {
  fetchAuthorizedUserForClient,
  registerAuthorizedUser,
  removeAuthorizedUser,
} from "../../../services/authorizedUserService";

export const useAuthorizedUser = (clientId) => {
  const [authorizedUser, setAuthorizedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAuthorizedUser = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);

    try {
      const res = await fetchAuthorizedUserForClient(clientId);
      // backend: { success, data } OR just { data }
      const data = res?.data || res;
      setAuthorizedUser(data || null);
    } catch (err) {
      console.error("Error fetching authorized user:", err);
      setAuthorizedUser(null);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadAuthorizedUser();
  }, [loadAuthorizedUser]);

  const register = async (payload) => {
    const res = await registerAuthorizedUser(payload);
    // we don't set authorizedUser yet because OTP verification may be required
    return res;
  };

  const remove = async (authorizedUserId) => {
    await removeAuthorizedUser(authorizedUserId);
    setAuthorizedUser(null);
  };

  return {
    authorizedUser,
    loading,
    registerAuthorizedUser: register,
    removeAuthorizedUser: remove,
    refreshAuthorizedUser: loadAuthorizedUser,
  };
};
