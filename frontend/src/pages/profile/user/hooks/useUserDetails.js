// src/pages/profile/User/hooks/useUserDetails.js
import { useEffect, useState } from "react";
import {
  fetchUserById,
  updateUserProfile,
} from "../../../services/userService";

export const useUserDetails = (id) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const loadUser = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchUserById(id);

        if (!isMounted) return;

        if (!data) {
          setError("User not found.");
          setUser(null);
        } else {
          setUser(data);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Error fetching user:", err);
        setError("Failed to load user data.");
        setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const saveUser = async (payload) => {
    const updated = await updateUserProfile(id, payload);
    setUser(updated);
    return updated;
  };

  return { user, loading, error, saveUser, setUser };
};
