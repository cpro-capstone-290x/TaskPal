import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const User = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  // ✅ Fetch user details
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/${id}`);
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

  // ✅ Fetch bookings (for both History & Ongoing)
  useEffect(() => {
    if (activeTab !== "bookings" && activeTab !== "ongoing") return;

    const fetchBookings = async () => {
      setBookingLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/bookings?client_id=${id}`
        );
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

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Loading...</p>;
  if (error)
    return <p className="text-center text-red-500 mt-10">{error}</p>;
  if (!user) return null;

  // ✅ Add new "Ongoing" tab
  const menuItems = [
    { key: "profile", label: "Profile" },
    { key: "bookings", label: "Booking History" },
    { key: "ongoing", label: "Ongoing" }, // 👈 NEW TAB
  ];

  // ✅ Show only "Paid" bookings where completedClient is not "completed"
    const ongoingBookings = bookings.filter(
      (b) =>
        b.status === "Paid" &&
        (!b.completedclient || b.completedclient.toLowerCase() !== "completed")
    );


  return (
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
                      <tr key={b.id} className="border-b hover:bg-gray-50 transition">
                        <td className="px-4 py-2 text-gray-700 font-medium">#{b.id}</td>
                        <td className="px-4 py-2 text-gray-700">{b.provider_name || "N/A"}</td>
                        <td className="px-4 py-2 text-gray-700">
                          {b.scheduled_date
                            ? new Date(b.scheduled_date).toLocaleString()
                            : "Not set"}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {b.price ? `$${Number(b.price).toFixed(2)}` : "N/A"}
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
              <p className="text-center text-gray-500">Loading ongoing bookings...</p>
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
                          {b.price ? `$${Number(b.price).toFixed(2)}` : "N/A"}
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

      </main>
    </div>
  );
};

export default User;
