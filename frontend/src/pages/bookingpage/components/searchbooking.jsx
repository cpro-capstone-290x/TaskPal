import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../api";

const FALLBACK_IMAGE = "https://placehold.co/100x100.webp?text=No+Image";

const SearchBooking = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selectedCategory = queryParams.get("category");
  const navigate = useNavigate();

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleViewProfile = (providerId) => {
    navigate(`/providers/public/${providerId}`);
  };

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        let endpoint = "/providers/service_type";
        if (selectedCategory) {
          endpoint += `/${encodeURIComponent(selectedCategory)}`;
        }

        const res = await api.get(endpoint);
        setProviders(res.data.data || []);
      } catch (error) {
        console.error("❌ Error fetching providers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [selectedCategory]);

  // Only show approved providers (no price/slider filtering anymore)
  const filteredProviders = providers.filter((p) => p.status === "Approved");

  const handleSelectProvider = (providerId) => {
    navigate(`/booking/initiate/${providerId}`);
  };

  const formatPrice = (value) =>
    value != null ? Number(value).toFixed(2) : "0.00";

  // Small helper: describe what providers usually offer per category
  const getCategoryDescription = () => {
    const cat = (selectedCategory || "").toLowerCase();

    if (cat.includes("clean")) {
      return [
        "General home cleaning (kitchen, living room, bedrooms).",
        "Bathroom and surface disinfection.",
        "Move-in/move-out or deep cleaning jobs.",
      ];
    }

    if (cat.includes("yard") || cat.includes("lawn")) {
      return [
        "Lawn mowing and basic yard maintenance.",
        "Leaf raking and seasonal clean-ups.",
        "Small outdoor tasks like watering plants or snow shoveling.",
      ];
    }

    if (cat.includes("errand") || cat.includes("run")) {
      return [
        "Grocery or pharmacy runs.",
        "Picking up deliveries or parcels.",
        "Simple drop-off and pick-up errands around town.",
      ];
    }

    // Default generic description
    return [
      "Help with day-to-day tasks related to this category.",
      "Flexible, one-time or recurring jobs depending on your needs.",
      "You can chat with your provider to customize what the job includes.",
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 flex flex-col md:flex-row gap-6">
      {/* Sidebar: What this provider can offer */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-2xl shadow-md p-6 border border-gray-100 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          What your provider can offer
          {selectedCategory && (
            <span className="block text-sm font-normal text-gray-600">
              for {selectedCategory} jobs
            </span>
          )}
        </h2>

        <p className="text-sm text-gray-700">
          All prices shown on the right are <strong>per job</strong>. You’ll be
          able to discuss details and adjust the final job scope in chat before
          confirming.
        </p>

        <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
          {getCategoryDescription().map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>

        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-sm text-gray-800">
          <span className="font-semibold">✅ Peace of Mind:</span> All Taskers
          undergo ID and background checks. Book the provider that feels right,
          then fine-tune the job together.
        </div>
      </div>

      {/* Providers List */}
      <div className="flex-1 space-y-6">
        {loading ? (
          <p className="text-center text-gray-600">Loading providers...</p>
        ) : filteredProviders.length === 0 ? (
          <p className="text-center text-gray-600">
            No providers found for this category.
          </p>
        ) : (
          filteredProviders.map((p) => (
            <div
              key={p.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start gap-6"
            >
              {/* Provider Image */}
              <div className="flex flex-col items-center w-full md:w-1/4">
                <img
                  src={p.profile_picture_url || FALLBACK_IMAGE}
                  srcSet={
                    p.profile_picture_url
                      ? `
                        ${p.profile_picture_url}?w=100 100w,
                        ${p.profile_picture_url}?w=200 200w,
                        ${p.profile_picture_url}?w=400 400w
                      `
                      : `${FALLBACK_IMAGE} 100w`
                  }
                  sizes="(max-width: 768px) 96px, 120px"
                  width={96}
                  height={96}
                  loading="lazy"
                  decoding="async"
                  alt={p.name || "Provider photo"}
                  className="w-24 h-24 rounded-full object-cover border-4 border-sky-100 mb-2"
                />

                <button
                  onClick={() => handleViewProfile(p.id)}
                  className="text-sky-800 text-sm font-semibold hover:underline"
                >
                  View Profile & Reviews
                </button>
              </div>

              {/* Provider Info */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {p.name || `${p.first_name} ${p.last_name}`}
                  </h3>
                  <span className="text-lg font-bold text-gray-900">
                    ${formatPrice(p.min_price)} – ${formatPrice(p.max_price)} per job
                  </span>
                </div>

                <p className="text-yellow-800 text-sm font-medium">
                  ⭐ {p.rating || 5.0}{" "}
                  <span className="text-gray-700 text-sm">
                    ({p.review_count || 0} reviews)
                  </span>
                </p>

                <p className="text-gray-700 text-sm mb-2">
                  {p.completed_tasks || 0} Tasks Completed
                </p>

                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-800">
                  <strong>How I can help:</strong>
                  <p className="mt-1 line-clamp-3">
                    {p.note ||
                      "I’m an experienced service provider ready to help with your job efficiently and professionally."}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center justify-center md:w-1/5 w-full mt-4 md:mt-0">
                <button
                  onClick={() => handleSelectProvider(p.id)}
                  className="px-6 py-2 rounded-full bg-sky-700 text-white font-semibold hover:bg-sky-800 transition"
                >
                  Select & Continue
                </button>
                <p className="text-xs text-gray-600 text-center mt-2">
                  Chat and adjust job details after booking.
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SearchBooking;
