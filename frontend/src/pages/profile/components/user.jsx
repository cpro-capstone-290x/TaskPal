import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api";

const User = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  

  // Added for Edit Profile Feature
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    unit_no: "",
    street: "",
    city: "",
    province: "",
    postal_code: "",
    password: "",
  });

  // ✅ Fetch user details
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        if (res.data && res.data.success) {
          setUser(res.data.data);
        } else {
          setError("User not found.");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  //  Sync form data when user is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        unit_no: user.unit_no || "",
        street: user.street || "",
        city: user.city || "",
        province: user.province || "",
        postal_code: user.postal_code || "",
      });
    }
  }, [user]);

  // ✅ Fetch bookings (for both History & Ongoing)
  useEffect(() => {
    if (activeTab !== "bookings" && activeTab !== "ongoing") return;

    const fetchBookings = async () => {
      setBookingLoading(true);
      try {
        const res = await api.get(`/bookings?client_id=${id}`);
        if (res.data && Array.isArray(res.data)) {
          setBookings(res.data);
        } else if (res.data.data) {
          setBookings(res.data.data);
        } else {
          setBookings([]);
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setBookingLoading(false);
      }
    };
    fetchBookings();
  }, [activeTab, id]);

  // 🧩 Edit Profile Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const res = await api.put(`/users/${id}`, formData);
      const updated = res.data?.data || res.data;
      setUser(updated);
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Failed to update profile.");
    }
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Loading...</p>;
  if (error)
    return <p className="text-center text-red-500 mt-10">{error}</p>;
  if (!user) return null;

  // ✅ Add new "Ongoing" tab
  const menuItems = [
    { key: "profile", label: "Profile" },
    { key: "bookings", label: "Booking History" },
    { key: "ongoing", label: "Ongoing" },
    { key: "authorized", label: "Authorized User" }
  ];

  // ✅ Show only "Paid" bookings where completedClient is not "completed"
  const ongoingBookings = bookings.filter(
    (b) =>
      b.status === "Paid" &&
      (!b.completedclient || b.completedclient.toLowerCase() !== "completed")
  );

  return (
    <>
      {/*  Floating Edit Button */}
      {activeTab === "profile" && !editMode && (
        <button
          onClick={() => setEditMode(true)}
          className="fixed bottom-6 right-6 px-4 py-2 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Edit Profile
        </button>
      )}

            {/*  Edit Profile Modal */}
      {editMode && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "First Name", name: "first_name" },
                { label: "Last Name", name: "last_name" },
                { label: "Email", name: "email", type: "email" },
                { label: "Unit #", name: "unit_no" },
                { label: "Street", name: "street" },
                { label: "City", name: "city" },
                { label: "Province", name: "province" },
                { label: "Postal Code", name: "postal_code" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm text-gray-600 mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type || "text"}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              ))}

              {/* 🆕 Only show password input if the email was changed */}
              {formData.email !== user.email && (
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password to confirm email change"
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Main Dashboard Layout */}
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <img
                src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                alt="Profile Avatar"
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="text-sm text-gray-500 capitalize">
                  {user.type_of_user}
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
                      ? "bg-green-600 text-white"
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
              navigate("/login");
            }}
            className="w-full mt-6 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition"
          >
            Logout
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-10">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                User Profile
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={user.first_name || ""}
                    readOnly
                    className="w-full px-4 py-2 bg-gray-50 border text-gray-700 border-gray-200 rounded-lg"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={user.last_name || ""}
                    readOnly
                    className="w-full px-4 py-2 bg-gray-50 border text-gray-700 border-gray-200 rounded-lg"
                  />
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label className="block text-gray-600 text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="text"
                    value={user.email || ""}
                    readOnly
                    className="w-full px-4 py-2 bg-gray-50 border text-gray-700 border-gray-200 rounded-lg"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-gray-600 text-sm font-medium mb-1">
                    Address
                  </label>
                  <textarea
                    value={`${user.unit_no || ""} ${user.street || ""}, ${
                      user.city || ""
                    }, ${user.province || ""}, ${user.postal_code || ""}`}
                    readOnly
                    rows="3"
                    className="w-full px-4 py-2 bg-gray-50 border text-gray-700 border-gray-200 rounded-lg"
                  ></textarea>
                </div>

                {/* Verification */}
                <div className="md:col-span-2 flex items-center gap-3 mt-2">
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                      user.is_verified
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                    }`}
                  >
                    {user.is_verified ? "Verified" : "Not Verified"}
                  </span>
                  <span className="text-gray-500 text-sm">
                    Joined on{" "}
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Booking History Tab */}
          {activeTab === "bookings" && (
            <div className="max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Booking History
              </h2>

              {bookingLoading ? (
                <p className="text-center text-gray-500">Loading bookings...</p>
              ) : bookings.length === 0 ? (
                <p className="text-center text-gray-500">
                  No booking history available.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-100 text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-700 font-medium">
                          Booking ID
                        </th>
                        <th className="px-4 py-2 text-left text-gray-700 font-medium">
                          Provider
                        </th>
                        <th className="px-4 py-2 text-left text-gray-700 font-medium">
                          Scheduled Date
                        </th>
                        <th className="px-4 py-2 text-left text-gray-700 font-medium">
                          Price
                        </th>
                        <th className="px-4 py-2 text-left text-gray-700 font-medium">
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
                          <td className="px-4 py-2 text-gray-700 font-medium">
                            #{b.id}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {b.provider_name || "N/A"}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {b.scheduled_date
                              ? new Date(b.scheduled_date).toLocaleString()
                              : "Not set"}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {b.price
                              ? `$${Number(b.price).toFixed(2)}`
                              : "N/A"}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                b.status === "Paid"
                                  ? "bg-green-100 text-green-700"
                                  : b.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-blue-100 text-blue-700"
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

          {/* ✅ Ongoing Tab */}
          {activeTab === "ongoing" && (
            <div className="max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Ongoing Bookings
              </h2>

              {bookingLoading ? (
                <p className="text-center text-gray-500">
                  Loading ongoing bookings...
                </p>
              ) : ongoingBookings.length === 0 ? (
                <p className="text-center text-gray-500">
                  No ongoing bookings yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-100 text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-700 font-medium">
                          Booking ID
                        </th>
                        <th className="px-4 py-2 text-left text-gray-700 font-medium">
                          Provider
                        </th>
                        <th className="px-4 py-2 text-left text-gray-700 font-medium">
                          Scheduled Date
                        </th>
                        <th className="px-4 py-2 text-left text-gray-700 font-medium">
                          Price
                        </th>
                        <th className="px-4 py-2 text-left text-gray-700 font-medium">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left text-gray-700 font-medium">
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
                          <td className="px-4 py-2 text-gray-700 font-medium">
                            #{b.id}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {b.provider_name || "N/A"}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {b.scheduled_date
                              ? new Date(b.scheduled_date).toLocaleString()
                              : "Not set"}
                          </td>
                          <td className="px-4 py-2 text-green-700 font-medium">
                            {b.price
                              ? `$${Number(b.price).toFixed(2)}`
                              : "N/A"}
                          </td>
                          <td className="px-4 py-2">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Paid
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              onClick={() => navigate(`/execution/${b.id}`)}
                              className="bg-green-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-green-700 transition"
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
          {/* ✅ Authorized User Tab */}
          {activeTab === "authorized" && (
            <AuthorizedUserSection
              user={user}
              navigate={navigate}
              setActiveTab={setActiveTab}
            />
          )}
        </main>
      </div>
    </>
  );
};

export default User;

const AuthorizedUserSection = ({ user, navigate, setActiveTab }) => {
  const [authUser, setAuthUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // ✅ Fetch authorized user details
  useEffect(() => {
    if (!user?.id) return;

    const fetchAuthorizedUser = async () => {
      try {
        const res = await api.get(`/auth/authorized-users/${user.id}`);
        setAuthUser(res.data?.data || null);
      } catch (err) {
        console.error("Error fetching authorized user:", err);
      } finally {
        setLoadingAuth(false);
      }
    };

    fetchAuthorizedUser();
  }, [user]);

  if (loadingAuth)
    return (
      <div className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
        Loading authorized user...
      </div>
    );

  // ✅ CASE 1: Authorized User exists
  if (authUser) {
    return (
      <div className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Authorized User Details
        </h2>

        {/* ✅ Display Authorized User Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">First Name</label>
            <input
              type="text"
              value={authUser.first_name}
              readOnly
              className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Last Name</label>
            <input
              type="text"
              value={authUser.last_name}
              readOnly
              className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={authUser.email}
              readOnly
              className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Phone</label>
            <input
              type="tel"
              value={authUser.phone || "N/A"}
              readOnly
              className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Relationship</label>
            <input
              type="text"
              value={authUser.relationship}
              readOnly
              className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={async () => {
              if (
                window.confirm(
                  "Are you sure you want to remove this authorized user?"
                )
              ) {
                try {
                  await api.delete(`/auth/authorized-user/${authUser.id}`);
                  alert("Authorized user removed.");
                  setAuthUser(null);
                } catch (err) {
                  console.error("Error removing authorized user:", err);
                  alert("Failed to remove authorized user.");
                }
              }
            }}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
          >
            Remove Authorized User
          </button>
        </div>
      </div>
    );
  }

  // ✅ CASE 2: No Authorized User → Registration Form
  return (
    <div className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Add Authorized User
      </h2>

      <p className="text-gray-600 mb-6 leading-relaxed">
        You can optionally add an <strong>Authorized User</strong> (such as a
        family member, guardian, or assistant) who can help manage your
        bookings, payments, or service tracking.
        <br />
        If you prefer to keep your account private, simply skip this step.
      </p>

      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();

          const payload = {
            client_id: user.id,
            first_name: e.target.first_name.value,
            last_name: e.target.last_name.value,
            email: e.target.email.value,
            phone: e.target.phone.value,
            relationship: e.target.relationship.value,
            password: "Authorized@123",
          };

          try {
            const res = await api.post(
              "/auth/registerAuthorizedUser",
              payload
            );

            if (res.data.success) {
              alert("OTP sent to the authorized user's email!");
              navigate(`/verify-authorized?email=${payload.email}`);
            } else {
              alert(res.data.error || "Something went wrong. Please try again.");
            }
          } catch (err) {
            console.error("Error adding authorized user:", err);
            alert(err.response?.data?.error || "Failed to add authorized user.");
          }
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">First Name</label>
            <input
              type="text"
              name="first_name"
              required
              placeholder="Authorized user's first name"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-200"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Last Name</label>
            <input
              type="text"
              name="last_name"
              required
              placeholder="Authorized user's last name"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              placeholder="authorized@example.com"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-200"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Relationship</label>
            <input
              type="text"
              name="relationship"
              required
              placeholder="e.g., Daughter, Assistant"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Phone</label>
          <input
            type="tel"
            name="phone"
            placeholder="+1 (555) 123-4567"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-200"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
          >
            Skip
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            Add Authorized User
          </button>
        </div>
      </form>
    </div>
  );
};
