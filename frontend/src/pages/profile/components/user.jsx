import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const User = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/${id}`);

        // ✅ Fix: extract actual user object
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

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
    <h2 className="text-2xl font-semibold text-gray-800 mb-8">User Profile</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div>
        <label className="block text-gray-600 text-sm font-medium mb-1">First Name</label>
        <input
            type="text"
            value={user.first_name || ""}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-600 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        </div>

        {/* Last Name */}
        <div>
        <label className="block text-gray-600 text-sm font-medium mb-1">Last Name</label>
        <input
            type="text"
            value={user.last_name || ""}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-600 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        </div>

        {/* Email */}
        <div className="md:col-span-2">
        <label className="block text-gray-600 text-sm font-medium mb-1">Email</label>
        <input
            type="text"
            value={user.email || ""}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-600 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
        <label className="block text-gray-600 text-sm font-medium mb-1">Address</label>
        <textarea
            value={`${user.unit_no || ""} ${user.street || ""}, ${user.city || ""}, ${user.province || ""}, ${user.postal_code || ""}`}
            readOnly
            rows="3"
            className="w-full px-4 py-2 bg-gray-50 border text-gray-600 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        ></textarea>
        </div>

        {/* Type of User */}
        <div>
        <label className="block text-gray-600 text-sm font-medium mb-1">Type of User</label>
        <input
            type="text"
            value={user.type_of_user || ""}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-600 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none capitalize"
        />
        </div>

        {/* Verification Status */}
        <div className="flex items-center gap-3 md:col-span-2 mt-2">
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
            Joined on {new Date(user.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            })}
        </span>
        </div>
    </div>
    </div>

  );
};

export default User;
