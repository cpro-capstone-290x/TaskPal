import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const Provider = () => {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/providers/${id}`);

        // ✅ Adjust based on backend response
        if (res.data && res.data.success) {
          setProvider(res.data.data);
        } else {
          setError("Provider not found.");
        }
      } catch (err) {
        console.error("Error fetching provider:", err);
        setError("Failed to load provider data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [id]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;
  if (!provider) return null;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-semibold text-gray-800 mb-8">Provider Profile</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Provider Name */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Business Name
          </label>
          <input
            type="text"
            value={provider.name || ""}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-600 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Contact Person */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Provider Type
          </label>
          <input
            type="text"
            value={provider.provider_type || ""}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-600 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Service Type */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Service Type
          </label>
          <input
            type="text"
            value={provider.service_type || ""}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-600 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* License Id */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            License Id
          </label>
          <input
            type="text"
            value={provider.license_id || ""}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-600 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Email */}
        <div className="md:col-span-2">
          <label className="block text-gray-600 text-sm font-medium mb-1">Email</label>
          <input
            type="text"
            value={provider.email || ""}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-600 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">
            Phone Number
          </label>
          <input
            type="text"
            value={provider.phone || ""}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-600 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-gray-600 text-sm font-medium mb-1">Address</label>
          <textarea
            value={`${provider.unit_no || ""} ${provider.street || ""}, ${provider.city || ""}, ${provider.province || ""}, ${provider.postal_code || ""}`}
            readOnly
            rows="3"
            className="w-full px-4 py-2 bg-gray-50 border text-gray-600 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          ></textarea>
        </div>

        {/* Service Type */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">Service Type</label>
          <input
            type="text"
            value={provider.service_type || ""}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-600 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none capitalize"
          />
        </div>

        {/* Rating */}
        <div>
          <label className="block text-gray-600 text-sm font-medium mb-1">Rating</label>
          <input
            type="text"
            value={provider.rating ? `${provider.rating} ★` : "No ratings yet"}
            readOnly
            className="w-full px-4 py-2 bg-gray-50 border text-gray-600 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Verification Status */}
        <div className="flex items-center gap-3 md:col-span-2 mt-2">
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
              provider.is_verified
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-yellow-100 text-yellow-700 border border-yellow-200"
            }`}
          >
            {provider.is_verified ? "Verified" : "Not Verified"}
          </span>
          <span className="text-gray-500 text-sm">
            Joined on{" "}
            {new Date(provider.created_at).toLocaleDateString("en-US", {
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

export default Provider;
