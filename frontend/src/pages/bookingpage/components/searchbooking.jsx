import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../api";



const SearchBooking = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selectedCategory = queryParams.get("category"); // ✅ "Cleaning", "Moving", etc.
  const navigate = useNavigate();

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    priceRange: [10, 150],
    eliteOnly: false,
  });

  
  const handleViewProfile = (providerId) => {
    navigate(`/providers/public/${providerId}`);
  };

  // ✅ Fetch providers from backend (filtered by category)
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
        console.error("Error fetching providers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [selectedCategory]);


  // ✅ Apply frontend filters (price, elite, etc.)
  const filteredProviders = providers.filter((p) => {
    if (p.status !== "Approved") return false;
    if (filters.eliteOnly && !p.is_elite) return false;
    if (p.price < filters.priceRange[0] || p.price > filters.priceRange[1])
      return false;
    return true;
  });

  const handlePriceChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setFilters((prev) => ({
      ...prev,
      priceRange: [10, value],
    }));
  };

  const handleSelectProvider = (providerId) => {
    // Navigate to the chat room for the selected provider
    navigate(`/booking/initiate/${providerId}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 flex flex-col md:flex-row gap-6">
      {/* Sidebar Filters */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-2xl shadow-md p-6 border border-gray-100 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Filters {selectedCategory && <span>for {selectedCategory}</span>}
        </h2>

        {/* Price Range */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Price</h3>
          <input
            type="range"
            min="10"
            max="150"
            value={filters.priceRange[1]}
            onChange={handlePriceChange}
            className="w-full accent-sky-600"
          />
          <div className="flex justify-between text-gray-600 text-sm">
            <span>${filters.priceRange[0]}</span>
            <span>${filters.priceRange[1]}+</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            The average hourly rate is <strong>$42.81/hr</strong>
          </p>
        </div>

        {/* Elite Only */}
        <div>
          <label className="flex items-center space-x-2 text-gray-700 font-medium">
            <input
              type="checkbox"
              checked={filters.eliteOnly}
              onChange={() =>
                setFilters((prev) => ({
                  ...prev,
                  eliteOnly: !prev.eliteOnly,
                }))
              }
              className="accent-sky-600"
            />
            <span>Elite Tasker</span>
          </label>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-sm text-gray-700">
          <span className="font-semibold">✅ Peace of Mind:</span> All Taskers
          undergo ID and background checks.
        </div>
      </div>

      {/* Right Side - Providers */}
      <div className="flex-1 space-y-6">
        {loading ? (
          <p className="text-center text-gray-500">Loading providers...</p>
        ) : filteredProviders.length === 0 ? (
          <p className="text-center text-gray-500">
            No providers found for this category.
          </p>
        ) : (
          filteredProviders.map((p) => (
            <div
              key={p.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start gap-6"
            >
              {/* Profile Image */}
              <div className="flex flex-col items-center w-full md:w-1/4">
                <img
                  src={p.image || "https://via.placeholder.com/100"}
                  alt={p.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-sky-100 mb-2"
                />
                <button
                  onClick={() => handleViewProfile(p.id)}
                  className="text-sky-700 text-sm font-semibold hover:underline"
                >
                  View Profile & Reviews
                </button>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {p.name || `${p.first_name} ${p.last_name}`}
                  </h3>
                  <span className="text-lg font-bold text-gray-800">
                    ${p.price}/hr
                  </span>
                </div>

                <p className="text-yellow-500 text-sm">
                  ⭐ {p.rating || 5.0}{" "}
                  <span className="text-gray-500 text-sm">
                    ({p.review_count || 0} reviews)
                  </span>
                </p>
                <p className="text-gray-600 text-sm mb-2">
                  {p.completed_tasks || 0} Tasks Completed
                </p>

                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-700">
                  <strong>How I can help:</strong>
                  <p className="mt-1 line-clamp-3">
                    {p.bio ||
                      "I’m an experienced service provider ready to help with your project efficiently and professionally."}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center justify-center md:w-1/5 w-full mt-4 md:mt-0">
                <button onClick={() => handleSelectProvider(p.id)} className="px-6 py-2 rounded-full bg-sky-600 text-white font-semibold hover:bg-sky-700 transition">
                  
                  Select & Continue
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Chat and adjust details after booking.
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
