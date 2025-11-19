// src/pages/profile/Provider/Provider.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ProviderSidebar from "./components/ProviderSidebar";
import ProviderProfile, {
  ProviderProfileSkeleton,
} from "./components/ProviderProfile";
import ProviderBookingHistory from "./components/ProviderBookingHistory";
import ProviderOngoingJobs from "./components/ProviderOngoingJobs";
import ProviderPayouts from "./components/ProviderPayout";

import { useProviderDetails } from "./hooks/useProviderDetails";
import { useProviderBookings } from "./hooks/useProviderBookings";

const Provider = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({});
  const [newProfilePicture, setNewProfilePicture] = useState(null);

  const {
    provider,
    loading: providerLoading,
    error: providerError,
    saveProvider,
    uploadProfilePicture,
    setProvider,
  } = useProviderDetails(id);

  const {
    bookings,
    loading: bookingsLoading,
  } = useProviderBookings(id, activeTab === "bookings" || activeTab === "ongoing");

  useEffect(() => {
    if (provider) {
      setFormData({
        ...provider,
        profile_picture_url: provider.profile_picture_url || "",
      });
    }
  }, [provider]);

  const ongoingJobs = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status === "Paid" &&
          (!b.completedprovider ||
            b.completedprovider.toLowerCase() !== "completed")
      ),
    [bookings]
  );

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!provider) return;

    setIsSaving(true);
    setSaveMessage({ type: "", message: "" });

    const payload = { ...formData };
    if (!payload.password) delete payload.password;

    try {
      const updated = await saveProvider(payload);
      setProvider(updated);
      setFormData(updated);
      setIsEditing(false);
      setSaveMessage({
        type: "success",
        message: "Profile updated successfully!",
      });
    } catch (err) {
      console.error("Error updating provider profile:", err);
      setSaveMessage({
        type: "error",
        message: "Failed to update profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!newProfilePicture) return;

    try {
      setIsUploading(true);
      const res = await uploadProfilePicture(newProfilePicture);
      if (res?.blobUrl) {
        setFormData((prev) => ({
          ...prev,
          profile_picture_url: res.blobUrl,
        }));
        setNewProfilePicture(null);
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      // optional: show message
    } finally {
      setIsUploading(false);
    }
  };

  if (providerLoading && !provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
        <main className="flex-1 w-full px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <ProviderProfileSkeleton />
        </main>
      </div>
    );
  }

  if (providerError) {
    return (
      <p className="text-center text-red-500 mt-10">{providerError}</p>
    );
  }

  if (!provider) {
    return (
      <p className="text-center text-gray-500 mt-10">
        No provider found.
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <ProviderSidebar
        provider={provider}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="flex-1 w-full px-4 py-6 sm:px-6 lg:px-10 lg:py-10 overflow-y-auto">
        {activeTab === "profile" && (
          <ProviderProfile
            provider={provider}
            formData={formData}
            isEditing={isEditing}
            isSaving={isSaving}
            isUploading={isUploading}
            saveMessage={saveMessage}
            onEditStart={() => setIsEditing(true)}
            onCancelEdit={() => {
              setIsEditing(false);
              setFormData(provider);
              setNewProfilePicture(null);
            }}
            onSaveSubmit={handleSaveSubmit}
            onFieldChange={handleFieldChange}
            newProfilePicture={newProfilePicture}
            setNewProfilePicture={setNewProfilePicture}
            onConfirmUpload={handleConfirmUpload}
          />
        )}

        {activeTab === "bookings" && (
          <ProviderBookingHistory
            bookings={bookings}
            loading={bookingsLoading}
          />
        )}

        {activeTab === "ongoing" && (
          <ProviderOngoingJobs
            ongoingJobs={ongoingJobs}
            loading={bookingsLoading}
          />
        )}

        {activeTab === "payout" && <ProviderPayouts />}
      </main>
    </div>
  );
};

export default Provider;
