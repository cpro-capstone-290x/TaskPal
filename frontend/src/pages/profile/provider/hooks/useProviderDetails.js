// src/pages/profile/Provider/hooks/useProviderDetails.js
import { useEffect, useState } from "react";
import {
  getProviderDetails,
  updateProviderProfile,
  uploadProviderProfilePicture,
} from "../../../services/providerService";

export const useProviderDetails = (id) => {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("userRole");
  const providerId = localStorage.getItem("providerId");

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const loadProvider = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getProviderDetails(id, { token, role, providerId });
        if (!isMounted) return;

        if (!data) {
          setError("Provider not found.");
          setProvider(null);
        } else {
          setProvider(data);
        }
      } catch (err) {
        console.error("Error loading provider:", err);
        if (!isMounted) return;
        setError("Failed to load provider data.");
        setProvider(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProvider();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveProvider = async (payload) => {
    const updated = await updateProviderProfile(id, payload, token);
    setProvider(updated);
    return updated;
  };

  const uploadProfilePicture = async (file) => {
    const res = await uploadProviderProfilePicture(id, file, token);
    // assuming backend returns { success, blobUrl }
    if (res?.blobUrl) {
      setProvider((prev) =>
        prev ? { ...prev, profile_picture_url: res.blobUrl } : prev
      );
    }
    return res;
  };

  return { provider, loading, error, saveProvider, uploadProfilePicture, setProvider };
};
