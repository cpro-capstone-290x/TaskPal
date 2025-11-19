// ✨ Provider.jsx — FIXED VERSION A (Clean + Valid JSX)

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

/* -----------------  ProfileField ----------------- */
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

/* ----------------- Helper Formatters ----------------- */
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

/* ---------------------- ProviderPayouts ---------------------- */
const ProviderPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("Authorization token missing.");

        const res = await api.get("/payments/my-history", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setPayouts(res.data);
      } catch (err) {
        setError(err.message || "Failed to fetch payout history.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayouts();
  }, []);

  const totalEarned = payouts.reduce(
    (acc, payout) => acc + Number(payout.price),
    0
  );

  if (loading) return <p>Loading payout history...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="w-full max-w-4xl">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
          <h3 className="text-lg text-green-700">Total Earned</h3>
          <p className="text-4xl font-bold text-green-900 mt-2">
            {formatCurrency(totalEarned)}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
          <h3 className="text-lg text-blue-700">Total Completed Bookings</h3>
          <p className="text-4xl font-bold text-blue-900 mt-2">
            {payouts.length}
          </p>
        </div>
      </div>

      {/* Table */}
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Transaction History
      </h3>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-left">Customer</th>
              <th className="px-6 py-3 text-left">Description</th>
              <th className="px-6 py-3 text-right">Amount</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {payouts.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-12 text-center text-gray-500">
                  No completed payments found.
                </td>
              </tr>
            ) : (
              payouts.map((p) => (
                <tr key={p.booking_id}>
                  <td className="px-6 py-4">{formatDate(p.created_at)}</td>
                  <td className="px-6 py-4">
                    {p.customer_first_name} {p.customer_last_name}
                  </td>
                  <td className="px-6 py-4">
                    {p.notes || `Booking #${p.booking_id}`}
                  </td>
                  <td className="px-6 py-4 text-green-700 font-semibold text-right">
                    + {formatCurrency(p.price)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------------------- PROVIDER PAGE ---------------------- */
const Provider = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState("profile");

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", message: "" });

  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [newProfilePicture, setNewProfilePicture] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  /* --------------- Fetch Provider --------------- */
  useEffect(() => {
    const loadProvider = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const role = localStorage.getItem("userRole");
        const providerId = localStorage.getItem("providerId");

        let url =
          role === "provider" && parseInt(providerId) === parseInt(id)
            ? `/providers/${id}`
            : `/providers/public/${id}`;

        const res = await api.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = res.data.data;
        setProvider(data);
        setFormData({
          ...data,
          profile_picture_url: data.profile_picture_url || "",
        });
      } catch {
        setProvider(null);
      } finally {
        setLoading(false);
      }
    };

    loadProvider();
  }, [id]);

  /* --------------- Fetch Bookings --------------- */
  useEffect(() => {
    if (activeTab !== "bookings" && activeTab !== "ongoing") return;

    const loadBookings = async () => {
      try {
        setBookingLoading(true);

        const res = await api.get(`/bookings?provider_id=${id}`);
        const raw = res.data.data || res.data || [];

        const uniqueClientIds = [...new Set(raw.map((b) => b.client_id))];
        const userRes = await Promise.all(
          uniqueClientIds.map((cid) => api.get(`/users/${cid}`))
        );

        const names = userRes.reduce((acc, r) => {
          if (r.data.success) {
            const u = r.data.data;
            acc[u.id] = `${u.first_name} ${u.last_name}`;
          }
          return acc;
        }, {});

        const enriched = raw.map((b) => ({
          ...b,
          client_name: names[b.client_id] || "N/A",
        }));

        setBookings(enriched);
      } finally {
        setBookingLoading(false);
      }
    };

    loadBookings();
  }, [activeTab, id]);

  /* ---------------- Handler: SAVE PROFILE ---------------- */
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const token = localStorage.getItem("authToken");

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    const payload = { ...formData };
    if (!payload.password) delete payload.password;

    try {
      const res = await api.put(`/providers/${id}`, payload, config);

      if (res.data.success) {
        setProvider(res.data.data);
        setFormData(res.data.data);
        setIsEditing(false);
        setSaveMessage({
          type: "success",
          message: "Profile updated successfully!",
        });

        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error(res.data.error);
      }
    } catch (err) {
      setSaveMessage({
        type: "error",
        message: "Failed to update profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------------- Upload Profile Picture ---------------- */
  const handlePictureUpload = async (file) => {
    if (!file) return;

    const token = localStorage.getItem("authToken");
    const data = new FormData();
    data.append("file", file);

    try {
      setIsUploading(true);

      const res = await api.post(`/providers/${id}/profile-picture`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        setFormData((prev) => ({
          ...prev,
          profile_picture_url: res.data.blobUrl,
        }));
        setNewProfilePicture(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  /* -------------------- Tabs -------------------- */
  const menuItems = [
    { key: "profile", label: "Profile" },
    { key: "bookings", label: "Booking History" },
    { key: "ongoing", label: "Ongoing Job" },
    { key: "payout", label: "Total Payout" },
  ];

  const ongoing = bookings.filter(
    (b) =>
      b.status === "Paid" &&
      (!b.completedprovider ||
        b.completedprovider.toLowerCase() !== "completed")
  );

  /* -------------------- RENDER -------------------- */

  if (loading) return <p>Loading...</p>;
  if (!provider) return <p>No provider found</p>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ---------------- Sidebar ---------------- */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2">
              {provider.profile_picture_url ? (
                <img
                  src={provider.profile_picture_url}
                  className="w-full h-full object-cover"
                  alt="profile"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <UserIcon size={24} className="text-gray-400" />
                </div>
              )}
            </div>
            <div>
              <h2 className="font-semibold">{provider.name}</h2>
              <p className="text-sm text-gray-500 capitalize">
                {provider.provider_type}
              </p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${
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
            localStorage.clear();
            navigate("/login");
          }}
          className="w-full mt-6 px-4 py-2 bg-red-100 text-red-700 rounded-lg"
        >
          Logout
        </button>
      </aside>

      {/* ---------------- Main Content ---------------- */}
      <main className="flex-1 p-10 overflow-y-auto">
        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <h2 className="text-3xl font-bold text-gray-800">
                Provider Profile
              </h2>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2"
                >
                  <Edit2 size={18} /> Edit Profile
                </button>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(provider);
                      setNewProfilePicture(null);
                    }}
                    className="px-4 py-2 bg-gray-300 rounded-lg flex items-center gap-2"
                  >
                    <X size={18} /> Cancel
                  </button>

                  <button
                    type="submit"
                    form="provider-profile-form"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"
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

            {saveMessage.message && (
              <div
                className={`p-3 mb-4 rounded-lg text-sm ${
                  saveMessage.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {saveMessage.message}
              </div>
            )}

            {/* Profile Picture */}
            <div className="flex items-center gap-6 mb-6">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-200">
                <img
                  src={
                    formData.profile_picture_url ||
                    provider.profile_picture_url
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>

              {isEditing && (
                <div>
                  <input
                    type="file"
                    id="profile-pic"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) =>
                      setNewProfilePicture(e.target.files[0])
                    }
                  />

                  <button
                    onClick={() =>
                      document.getElementById("profile-pic").click()
                    }
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg"
                  >
                    Choose File
                  </button>

                  {newProfilePicture && (
                    <button
                      onClick={() =>
                        handlePictureUpload(newProfilePicture)
                      }
                      className="ml-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg"
                    >
                      {isUploading ? "Uploading..." : "Confirm Upload"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* FORM */}
            <form id="provider-profile-form" onSubmit={handleSave}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProfileField
                  label="Business Name"
                  name="name"
                  value={isEditing ? formData.name : provider.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  readOnly={!isEditing}
                />

                <ProfileField
                  label="Provider Type"
                  name="provider_type"
                  value={
                    isEditing ? formData.provider_type : provider.provider_type
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      provider_type: e.target.value,
                    })
                  }
                  readOnly={!isEditing}
                />

                <ProfileField
                  label="Service Type"
                  name="service_type"
                  value={
                    isEditing ? formData.service_type : provider.service_type
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      service_type: e.target.value,
                    })
                  }
                  readOnly={!isEditing}
                />

                <ProfileField
                  label="Email"
                  name="email"
                  type="email"
                  value={isEditing ? formData.email : provider.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  readOnly={!isEditing}
                  className="md:col-span-2"
                />

                {/* Bio */}
                <div className="md:col-span-2">
                  <label className="block text-gray-600 text-sm mb-1">
                    Personal Note / Bio
                  </label>
                  <textarea
                    name="note"
                    rows="5"
                    readOnly={!isEditing}
                    value={isEditing ? formData.note || "" : provider.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg ${
                      isEditing
                        ? "bg-white border-gray-300"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  />
                </div>

                <ProfileField
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={isEditing ? formData.phone : provider.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  readOnly={!isEditing}
                />

                {/* Rating */}
                <div>
                  <label className="block mb-1 text-gray-600 text-sm">
                    Rating
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={
                      provider.rating
                        ? `${provider.rating} ★`
                        : "No ratings yet"
                    }
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-3 pt-4 border-t">
                  {provider.status === "Approved" ? (
                    <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
                      <CheckCircle size={16} />
                      Verified & Approved
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700 border border-yellow-200 flex items-center gap-1">
                      <Clock size={16} />
                      Status: {provider.status || "Pending"}
                    </span>
                  )}

                  <span className="text-gray-500 text-sm">
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

              {isEditing && (
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(provider);
                      setNewProfilePicture(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg flex items-center gap-2"
                    disabled={isSaving || isUploading}
                  >
                    <X size={18} /> Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"
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
            </form>
          </div>
        )}

        {/* BOOKING HISTORY */}
        {activeTab === "bookings" && (
          <div className="max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-semibold mb-6">Booking History</h2>

            {bookingLoading ? (
              <p>Loading...</p>
            ) : bookings.length === 0 ? (
              <p>No booking history.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Booking ID</th>
                      <th className="px-4 py-2 text-left">Client</th>
                      <th className="px-4 py-2 text-left">Scheduled Date</th>
                      <th className="px-4 py-2 text-left">Price</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">#{b.id}</td>
                        <td className="px-4 py-2">{b.client_name}</td>
                        <td className="px-4 py-2">
                          {b.scheduled_date
                            ? new Date(
                                b.scheduled_date
                              ).toLocaleDateString()
                            : "Not set"}
                        </td>
                        <td className="px-4 py-2">
                          {b.price ? "$" + Number(b.price).toFixed(2) : "N/A"}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${
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

        {/* ONGOING JOBS */}
        {activeTab === "ongoing" && (
          <div className="max-w-6xl bg-white rounded-2xl shadow-sm border p-8">
            <h2 className="text-2xl font-semibold mb-6">Ongoing Jobs</h2>

            {bookingLoading ? (
              <p>Loading ongoing jobs...</p>
            ) : ongoing.length === 0 ? (
              <p>No ongoing jobs.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Booking ID</th>
                      <th className="px-4 py-2 text-left">Client</th>
                      <th className="px-4 py-2 text-left">Scheduled Date</th>
                      <th className="px-4 py-2 text-left">Price</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {ongoing.map((b) => (
                      <tr
                        key={b.id}
                        className="border-b hover:bg-green-50 cursor-pointer"
                      >
                        <td className="px-4 py-2 font-medium">#{b.id}</td>
                        <td className="px-4 py-2">{b.client_name}</td>
                        <td className="px-4 py-2">
                          {b.scheduled_date
                            ? new Date(
                                b.scheduled_date
                              ).toLocaleDateString()
                            : "Not set"}
                        </td>
                        <td className="px-4 py-2 text-green-700">
                          {b.price ? "$" + Number(b.price).toFixed(2) : "N/A"}
                        </td>
                        <td className="px-4 py-2">
                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                            Paid
                          </span>
                        </td>

                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => navigate(`/execution/${b.id}`)}
                            className="bg-green-600 text-white px-4 py-1.5 rounded-full text-sm hover:bg-green-700"
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

        {/* TOTAL PAYOUT */}
        {activeTab === "payout" && (
          <div className="max-w-4xl bg-white rounded-2xl shadow-sm border p-8 mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Total Payout</h2>
            <ProviderPayouts />
          </div>
        )}
      </main>
    </div>
  );
};

export default Provider;
