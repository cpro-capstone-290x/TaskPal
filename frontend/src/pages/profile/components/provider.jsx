import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  Edit2,
  Save,
  X,
  CheckCircle,
  Clock,
  Upload,
  User as UserIcon,
} from "lucide-react";
import api from "../../../api";

// --- Helper Component for Input Fields (Same as before) ---
const ProfileField = ({
  label,
  name,
  value,
  onChange,
  readOnly = false,
  type = "text",
  className = "",
}) => {
  const baseClasses =
    "w-full px-4 py-2 border text-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none";
  const editClasses = "bg-white border-gray-300 shadow-sm";
  const viewClasses = "bg-gray-50 text-gray-600 border-gray-200";

  const inputClasses = `${baseClasses} ${
    readOnly ? viewClasses : editClasses
  } ${className}`;

  return (
    <div>
      <label className="block text-gray-600 text-sm font-medium mb-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        readOnly={readOnly}
        className={inputClasses}
      />
    </div>
  );
};

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
};

// Helper to format dates
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const ProviderPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        setLoading(true);
        // ✅ FIX 1: Use 'authToken' to match your other code
        const token = localStorage.getItem("authToken");

        if (!token) {
          throw new Error("Authorization token not found. Please log in.");
        }

        // ✅ FIX 2: Use your 'api' (axios) instance for the request
        const response = await api.get("/payments/my-history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // ✅ FIX 3: Axios puts the data in 'response.data'
        setPayouts(response.data);
      } catch (err) {
        console.error("Payout fetch error:", err);
        setError(err.message || "Failed to fetch payout history.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayouts();
  }, []); // Runs once on component mount

  // Calculate total earnings
  const totalEarned = payouts.reduce(
    (acc, payout) => acc + Number(payout.price),
    0
  );

  if (loading) {
    return <p className="text-gray-600">Loading payout history...</p>;
  }

  if (error) {
    return (
      <p className="text-red-600">Error: {error} Please try again later.</p>
    );
  }

  // ✅ FIX 4: The component now returns all the JSX
  return (
    <div className="w-full max-w-4xl">
      {/* --- Summary Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
          <h3 className="text-lg font-medium text-green-700">Total Earned</h3>
          <p className="text-3xl sm:text-4xl font-bold text-green-900 mt-2">
            {formatCurrency(totalEarned)}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
          <h3 className="text-lg font-medium text-blue-700">
            Total Completed Bookings
          </h3>
          <p className="text-3xl sm:text-4xl font-bold text-blue-900 mt-2">
            {payouts.length}
          </p>
        </div>
      </div>

      {/* --- Payout History Table --- */}
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Transaction History
      </h3>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-3 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-3 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Customer
                </th>
                <th
                  scope="col"
                  className="px-3 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-3 sm:px-6 py-3 text-right text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payouts.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-3 sm:px-6 py-12 text-center text-gray-500"
                  >
                    No completed payments found.
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.booking_id}>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                      {formatDate(payout.created_at)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-medium">
                      {payout.customer_first_name} {payout.customer_last_name}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 truncate max-w-xs">
                      {payout.notes || `Booking #${payout.booking_id}`}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-green-600 font-semibold text-right">
                      + {formatCurrency(payout.price)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Provider = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [formData, setFormData] = useState({ profile_picture_url: "" });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", message: "" });
  const [newProfilePicture, setNewProfilePicture] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [activeTab, setActiveTab] = useState("profile");

  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchProvider = async () => {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");
      const role = localStorage.getItem("userRole");
      const providerId = localStorage.getItem("providerId");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (!id) {
        setError("No provider ID found in URL.");
        setLoading(false);
        return;
      }

      try {
        let url = "";

        if (role === "provider" && parseInt(providerId) === parseInt(id)) {
          url = `/providers/${id}`;
        } else {
          url = `/providers/public/${id}`;
          // url = `/providers/${id}`;
        }

        const res = await api.get(url, { headers });

        if (res.data && res.data.data) {
          const fetchedData = res.data.data;
          setProvider(fetchedData);
          setFormData({
            ...fetchedData,
            profile_picture_url: fetchedData.profile_picture_url || "",
          });
        } else {
          setError("Provider not found.");
        }
      } catch (err) {
        console.error("Error fetching provider:", err);
        if (err.response && err.response.status === 403) {
          setError("You are not authorized to view this profile.");
        } else {
          setError("Failed to load provider data. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [id]);

  // ✅ NEW: Fetch bookings (for both History & Ongoing)
  useEffect(() => {
    // Only run if the active tab needs booking data
    if (activeTab !== "bookings" && activeTab !== "ongoing") return;

    const fetchBookingsAndClients = async () => {
      setBookingLoading(true);
      try {
        // --- 1. Fetch all bookings for the provider ---
        const bookingRes = await api.get(`/bookings?provider_id=${id}`);

        let bookingsData = [];
        if (bookingRes.data && Array.isArray(bookingRes.data)) {
          bookingsData = bookingRes.data;
        } else if (bookingRes.data.data) {
          bookingsData = bookingRes.data.data;
        }

        if (bookingsData.length === 0) {
          setBookings([]);
          setBookingLoading(false);
          return;
        }

        // --- 2. Get all unique client IDs from the bookings ---
        const clientIds = [...new Set(bookingsData.map((b) => b.client_id))];

        // --- 3. Fetch all client user details in parallel ---
        const userPromises = clientIds.map((clientId) =>
          api.get(`/users/${clientId}`)
        );
        const userResponses = await Promise.all(userPromises);

        // --- 4. Create a client name lookup map ---
        const clientMap = userResponses.reduce((acc, userRes) => {
          if (userRes.data && userRes.data.success) {
            const user = userRes.data.data;
            acc[user.id] = `${user.first_name} ${user.last_name}`;
          }
          return acc;
        }, {});

        // --- 5. Map bookings to include the new client_name ---
        const enrichedBookings = bookingsData.map((booking) => ({
          ...booking,
          client_name: clientMap[booking.client_id] || "N/A",
        }));

        setBookings(enrichedBookings);
      } catch (err) {
        console.error("Error fetching bookings or client data:", err);
      } finally {
        setBookingLoading(false);
      }
    };

    fetchBookingsAndClients();
  }, [activeTab, id]); // This effect re-runs if the tab or provider ID changes

  // --- Form Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const formatAddress = (data) => {
    const parts = [
      data.unit_no,
      data.street,
      data.city,
      data.province,
      data.postal_code,
    ]
      .filter(Boolean)
      .join(", ");
    return parts;
  };

  // 🚨 FIXED: Include Authorization token for secured upload route
  const handlePictureUpload = async (file) => {
    if (!file) return;

    const data = new FormData();
    data.append("file", file);

    const token = localStorage.getItem("authToken"); // ✅ Get token
    const headers = {
      "Content-Type": "multipart/form-data",
    };

    if (token) headers["Authorization"] = `Bearer ${token}`; // ✅ Add token if available

    setIsUploading(true);
    setSaveMessage({ type: "", message: "Uploading picture..." });

    try {
      const uploadRes = await api.post(
        `/providers/${id}/profile-picture`, // Backend endpoint
        data,
        { headers }
      );

      if (uploadRes.data && uploadRes.data.success) {
        const newUrl = uploadRes.data.blobUrl;

        setFormData((prevData) => ({
          ...prevData,
          profile_picture_url: newUrl,
        }));

        setNewProfilePicture(null);
        setSaveMessage({
          type: "success",
          message:
            "Picture uploaded successfully. Click Save Changes to finalize profile.",
        });
      } else {
        setSaveMessage({
          type: "error",
          message: "Upload failed. Please try again.",
        });
      }
    } catch (err) {
      console.error("❌ Error uploading picture:", err);
      setSaveMessage({
        type: "error",
        message:
          err.response?.data?.error === "No token, authorization denied"
            ? "Session expired or unauthorized. Please log in again."
            : "Failed to upload picture. Try again later.",
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setSaveMessage({ type: "", message: "" }), 7000);
    }
  };

  // --- Save/Update Function ---
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage({ type: "", message: "Saving profile..." });

    const token = localStorage.getItem("authToken");
    const providerId = localStorage.getItem("providerId");

    if (!token) {
      setSaveMessage({
        type: "error",
        message: "Session expired. Please log in again.",
      });
      setIsSaving(false);
      return;
    }

    // ✅ 1️⃣ Define config first
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    // ✅ 2️⃣ Prepare payload safely
    const payload = { ...formData };
    if (!payload.password || payload.password.trim() === "") {
      delete payload.password; // prevent overwriting hash
    }

    try {
      // ✅ 3️⃣ Then use config here
      const res = await api.put(`/providers/${id}`, payload, config);

      console.log("SERVER RESPONSE:", res.data);

      if (res.data?.success && res.data.data) {
        setProvider(res.data.data);
        setFormData(res.data.data);
        setIsEditing(false);
        setSaveMessage({
          type: "success",
          message: "Profile updated successfully! ✅",
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setSaveMessage({
          type: "error",
          message: res.data?.error || "Update failed. Try again later.",
        });
      }
    } catch (err) {
      console.error("❌ Error saving provider:", err.response?.data || err.message);
      setSaveMessage({
        type: "error",
        message:
          err.response?.status === 403
            ? "You are not authorized to edit this profile."
            : "Failed to save profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage({ type: "", message: "" }), 5000);
    }
  };

  // --- Cancel Function ---
  const handleCancel = () => {
    // Revert formData back to the original provider state
    setFormData(provider);
    setNewProfilePicture(null); // Clear preview file
    setIsEditing(false);
    setSaveMessage({ type: "", message: "" });
  };

  // --- Initial Loading/Error/Null Checks ---
  if (loading)
    return (
      <p className="text-center mt-10 text-xl font-medium flex items-center justify-center gap-2">
        <Clock className="animate-spin" size={20} /> Loading Profile...
      </p>
    );
  if (error)
    return (
      <p className="text-center text-red-600 mt-10 text-xl font-medium">
        🚨 {error}
      </p>
    );
  if (!provider)
    return (
      <p className="text-center mt-10 text-gray-500">
        No provider data available.
      </p>
    );

  const menuItems = [
    { key: "profile", label: "Profile" },
    { key: "bookings", label: "Booking History" },
    { key: "ongoing", label: "Ongoing Job" },
    { key: "payout", label: "Total Payout" },
  ];

  const ongoingBookings = bookings.filter(
    (b) =>
      b.status === "Paid" &&
      (!b.completedprovider || b.completedprovider.toLowerCase() !== "completed")
  );

  // --- JSX Rendering ---
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 bg-white border border-gray-200 shadow-sm p-4 sm:p-6 flex flex-col justify-between rounded-2xl">
            <div>
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                {/* Provider Picture Display */}
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                  {provider.profile_picture_url ? (
                    <img
                      src={provider.profile_picture_url}
                      alt={`${provider.name} Profile`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <UserIcon size={24} />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                    {provider.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 capitalize">
                    {provider.provider_type}
                  </p>
                </div>
              </div>

              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`w-full text-left px-4 py-2 rounded-lg font-medium transition text-sm sm:text-base ${
                      activeTab === item.key
                        ? "bg-indigo-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("authToken");
                localStorage.removeItem("userRole");
                localStorage.removeItem("providerId");
                navigate("/login");
              }}
              className="w-full mt-6 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition text-sm sm:text-base"
            >
              Logout
            </button>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            {activeTab === "profile" && (
              <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8 mx-auto">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 border-b pb-4">
                  <h2 className="text-xl sm:text-3xl font-bold text-gray-800">
                    Provider Profile
                  </h2>

                  {/* Edit Button / Control */}
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md"
                    >
                      <Edit2 size={18} /> Edit Profile
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-800 text-sm sm:text-base font-semibold rounded-lg hover:bg-gray-400 transition duration-150"
                        disabled={isSaving || isUploading}
                      >
                        <X size={18} /> Cancel
                      </button>
                      <button
                        type="submit"
                        form="provider-profile-form"
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-green-700 transition duration-150 shadow-md disabled:opacity-50"
                        disabled={isSaving || isUploading}
                      >
                        {isSaving ? (
                          <>
                            <Clock className="animate-spin" size={18} /> Saving...
                          </>
                        ) : (
                          <>
                            <Save size={18} /> Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Save Message Display */}
                {saveMessage.message && (
                  <div
                    className={`p-3 mb-4 rounded-lg text-sm font-medium ${
                      saveMessage.type === "success"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {saveMessage.message}
                  </div>
                )}

                {/* Profile Picture Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-4 border-b">
                  {/* Profile Image Display */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-gray-200">
                    {provider.profile_picture_url || formData.profile_picture_url ? (
                      <img
                        src={
                          formData.profile_picture_url ||
                          provider.profile_picture_url
                        }
                        alt={`${provider.name} Profile`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                        <UserIcon size={40} />
                      </div>
                    )}
                  </div>

                  {/* Upload Button (Only in Edit Mode) */}
                  {isEditing && (
                    <div className="flex flex-col items-start w-full">
                      <label className="block text-gray-600 text-sm font-medium mb-2">
                        Update Profile Photo
                      </label>
                      <input
                        type="file"
                        id="profile-picture-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          setNewProfilePicture(e.target.files[0])
                        }
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            document
                              .getElementById("profile-picture-upload")
                              .click()
                          }
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                          disabled={isUploading}
                        >
                          <Upload size={16} /> Choose File
                        </button>

                        {newProfilePicture && (
                          <button
                            type="button"
                            onClick={() =>
                              handlePictureUpload(newProfilePicture)
                            }
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                            disabled={isUploading}
                          >
                            {isUploading ? "Uploading..." : "Confirm Upload"}
                          </button>
                        )}
                      </div>
                      {newProfilePicture && (
                        <p className="text-xs text-gray-500 mt-1">
                          File selected: {newProfilePicture.name}. Click
                          &apos;Confirm Upload&apos; or Cancel.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile Form/View */}
                <form id="provider-profile-form" onSubmit={handleSave}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Business Name */}
                    <ProfileField
                      label="Business Name"
                      name="name"
                      value={isEditing ? formData.name : provider.name}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                    />

                    {/* Provider Type */}
                    <ProfileField
                      label="Provider Type"
                      name="provider_type"
                      value={
                        isEditing
                          ? formData.provider_type
                          : provider.provider_type
                      }
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                    />

                    {/* Service Type */}
                    <ProfileField
                      label="Service Type"
                      name="service_type"
                      value={
                        isEditing
                          ? formData.service_type
                          : provider.service_type
                      }
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                    />

                    {/* License Id (Read Only) */}
                    <ProfileField
                      label="License ID"
                      name="license_id"
                      value={provider.license_id}
                      readOnly={true}
                      className="opacity-70"
                    />

                    {/* Email (Full Width) */}
                    <div className="md:col-span-2">
                      <ProfileField
                        label="Email"
                        name="email"
                        type="email"
                        value={isEditing ? formData.email : provider.email}
                        onChange={handleInputChange}
                        readOnly={!isEditing}
                      />
                    </div>

                    {/* Personal Note / Bio (Full Width) */}
                    <div className="md:col-span-2">
                      <label className="block text-gray-600 text-sm font-medium mb-1">
                        Personal Note / Bio
                      </label>
                      <textarea
                        name="note"
                        value={isEditing ? formData.note || "" : provider.note || ""}
                        onChange={handleInputChange}
                        readOnly={!isEditing}
                        rows="5"
                        className={`
                          w-full px-4 py-2 border text-gray-800 rounded-lg 
                          focus:ring-2 focus:ring-indigo-500 focus:outline-none 
                          ${
                            isEditing
                              ? "bg-white border-gray-300 shadow-sm"
                              : "bg-gray-50 text-gray-600 border-gray-200 resize-none"
                          }
                        `}
                        placeholder={
                          isEditing
                            ? "Write a short introduction... (e.g., years of experience, what you love about your job, etc.)"
                            : "No personal note provided."
                        }
                      />
                      {isEditing && (
                        <p className="text-xs text-gray-500 mt-1">
                          This will be shown on your public profile to help
                          build trust.
                        </p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <ProfileField
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      value={isEditing ? formData.phone : provider.phone}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                    />

                    {/* Rating (Read Only) */}
                    <div className="md:col-span-1">
                      <label className="block text-gray-600 text-sm font-medium mb-1">
                        Rating
                      </label>
                      <input
                        type="text"
                        value={
                          provider.rating
                            ? `${provider.rating} ★`
                            : "No ratings yet"
                        }
                        readOnly
                        className="w-full px-4 py-2 bg-gray-50 border text-gray-600 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none opacity-70"
                      />
                    </div>

                    {/* (Address block is commented out in your code) */}

                    {/* Verification Status & Join Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 md:col-span-2 mt-2 pt-4 border-t">
                      {provider.status === "Approved" ? (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-green-100 text-green-700 border border-green-200">
                          <CheckCircle size={16} className="mr-1" /> Verified &
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
                          <Clock size={16} className="mr-1" /> Status:{" "}
                          {provider.status || "Pending"}
                        </span>
                      )}

                      <span className="text-gray-500 text-xs sm:text-sm">
                        Joined on{" "}
                        {new Date(provider.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                </form>

                {/* Save and Cancel buttons at the bottom too, for long forms */}
                {isEditing && (
                  <div className="flex justify-end gap-3 mt-6 sm:mt-8 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-800 text-sm sm:text-base font-semibold rounded-lg hover:bg-gray-400 transition duration-150"
                      disabled={isSaving || isUploading}
                    >
                      <X size={18} /> Cancel
                    </button>
                    <button
                      type="submit"
                      form="provider-profile-form"
                      onClick={handleSave}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-green-700 transition duration-150 shadow-md disabled:opacity-50"
                      disabled={isSaving || isUploading}
                    >
                      {isSaving ? (
                        <>
                          <Clock className="animate-spin" size={18} /> Saving...
                        </>
                      ) : (
                        <>
                          <Save size={18} /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Booking History Tab */}
            {activeTab === "bookings" && (
              <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8 mx-auto">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">
                  Booking History
                </h2>

                {bookingLoading ? (
                  <p className="text-center text-gray-500">
                    Loading bookings...
                  </p>
                ) : bookings.length === 0 ? (
                  <p className="text-center text-gray-500">
                    No booking history available.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-100 text-xs sm:text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 text-left text-gray-700 font-medium">
                            Booking ID
                          </th>
                          <th className="px-3 sm:px-4 py-2 text-left text-gray-700 font-medium">
                            Client
                          </th>
                          <th className="px-3 sm:px-4 py-2 text-left text-gray-700 font-medium">
                            Scheduled Date
                          </th>
                          <th className="px-3 sm:px-4 py-2 text-left text-gray-700 font-medium">
                            Price
                          </th>
                          <th className="px-3 sm:px-4 py-2 text-left text-gray-700 font-medium">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((b) => (
                          <tr
                            key={b.id}
                            className="border-b hover:bg-gray-50 transition"
                          >
                            <td className="px-3 sm:px-4 py-2 text-gray-700 font-medium">
                              #{b.id}
                            </td>
                            <td className="px-3 sm:px-4 py-2 text-gray-700">
                              {b.client_name || "N/A"}
                            </td>
                            <td className="px-3 sm:px-4 py-2 text-gray-700">
                              {b.scheduled_date
                                ? new Date(
                                    b.scheduled_date
                                  ).toLocaleString()
                                : "Not set"}
                            </td>
                            <td className="px-3 sm:px-4 py-2 text-gray-700">
                              {b.price
                                ? `$${Number(b.price).toFixed(2)}`
                                : "N/A"}
                            </td>
                            <td className="px-3 sm:px-4 py-2">
                              <span
                                className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium ${
                                  b.status === "Paid"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : b.status === "Confirmed"
                                    ? "bg-green-100 text-green-700"
                                    : b.status === "Negotiating"
                                    ? "bg-orange-100 text-orange-700"
                                    : b.status === "Pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : b.status === "Completed"
                                    ? "bg-blue-100 text-blue-700"
                                    : b.status === "Cancelled"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Ongoing Tab */}
            {activeTab === "ongoing" && (
              <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8 mx-auto">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">
                  Ongoing Jobs
                </h2>

                {bookingLoading ? (
                  <p className="text-center text-gray-500">
                    Loading ongoing jobs...
                  </p>
                ) : ongoingBookings.length === 0 ? (
                  <p className="text-center text-gray-500">No ongoing jobs.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-100 text-xs sm:text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 text-left text-gray-700 font-medium">
                            Booking ID
                          </th>
                          <th className="px-3 sm:px-4 py-2 text-left text-gray-700 font-medium">
                            Client
                          </th>
                          <th className="px-3 sm:px-4 py-2 text-left text-gray-700 font-medium">
                            Scheduled Date
                          </th>
                          <th className="px-3 sm:px-4 py-2 text-left text-gray-700 font-medium">
                            Price
                          </th>
                          <th className="px-3 sm:px-4 py-2 text-left text-gray-700 font-medium">
                            Status
                          </th>
                          <th className="px-3 sm:px-4 py-2 text-left text-gray-700 font-medium">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ongoingBookings.map((b) => (
                          <tr
                            key={b.id}
                            className="border-b hover:bg-green-50 transition cursor-pointer"
                          >
                            <td className="px-3 sm:px-4 py-2 text-gray-700 font-medium">
                              #{b.id}
                            </td>
                            <td className="px-3 sm:px-4 py-2 text-gray-700">
                              {b.client_name || "N/A"}
                            </td>
                            <td className="px-3 sm:px-4 py-2 text-gray-700">
                              {b.scheduled_date
                                ? new Date(
                                    b.scheduled_date
                                  ).toLocaleString()
                                : "Not set"}
                            </td>
                            <td className="px-3 sm:px-4 py-2 text-green-700 font-medium">
                              {b.price
                                ? `$${Number(b.price).toFixed(2)}`
                                : "N/A"}
                            </td>
                            <td className="px-3 sm:px-4 py-2">
                              <span className="px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-green-100 text-green-700">
                                Paid
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-2 text-right">
                              <button
                                onClick={() => navigate(`/execution/${b.id}`)}
                                className="bg-green-600 text-white px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium hover:bg-green-700 transition"
                              >
                                View Execution
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Total Payout Tab */}
            {activeTab === "payout" && (
              <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8 mx-auto">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">
                  Total Payout
                </h2>

                <ProviderPayouts />
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default Provider;
