import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Star } from "lucide-react";
import Header from "../../components/Header";

const ProviderProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Navigate to booking
  const handleSelectProvider = (providerId) => {
    navigate(`/booking/initiate/${providerId}`);
  };

  // Fetch provider + reviews
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [providerRes, reviewRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/providers/${id}`),
          axios.get(`http://localhost:5000/api/reviews/provider/${id}`),
        ]);

        setProvider(providerRes.data?.data || providerRes.data);
        setReviews(reviewRes.data?.data || []);
      } catch (err) {
        console.error("Error fetching provider data:", err);
        setError("Failed to load provider profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Compute average rating
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
        ).toFixed(1)
      : 0;

  // Loading / error / not found states
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading provider profile...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  if (!provider)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Provider not found.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Global Header */}
      <Header />

      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center mt-2">
        <h1 className="text-2xl font-bold text-green-700">
          {provider.first_name} {provider.last_name}
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium"
        >
          ← Back
        </button>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto py-10 px-4 flex-1 w-full">
        {/* Provider Overview */}
        <section className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 mb-10">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* Profile Photo */}
            <img
              src={
                provider.photo_url ||
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              }
              alt="Provider"
              className="w-32 h-32 rounded-full object-cover border"
            />

            {/* Provider Info */}
            <div className="flex-1 space-y-2">
              <h2 className="text-2xl font-semibold text-gray-800">
                {provider.name}
              </h2>
              <p className="text-gray-600">
                {provider.service_type + " Services"}
              </p>
              <p className="text-gray-600">
                {provider.city || "Red Deer"}, {provider.province || "AB"}
              </p>

              {/* Contact Info */}
              <div className="text-sm text-gray-500 mt-3">
                <p>
                  <strong>Email:</strong> {provider.email}
                </p>
                {provider.phone && (
                  <p>
                    <strong>Phone:</strong> {provider.phone}
                  </p>
                )}
              </div>

              {/* Bio */}
              {provider.bio && (
                <p className="mt-4 text-gray-700 leading-relaxed">
                  {provider.bio}
                </p>
              )}
            </div>

            {/* Rating + Book Now */}
            <div className="text-center bg-green-50 border border-green-200 rounded-xl p-5 w-full md:w-60 flex flex-col items-center">
              <h3 className="text-lg font-semibold text-green-700 mb-1">
                ⭐ {avgRating} / 5
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {reviews.length} reviews
              </p>
              <button
                onClick={() => handleSelectProvider(provider.id)}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full transition"
              >
                Book Now
              </button>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-2">
            User Reviews
          </h2>

          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center">No reviews yet.</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-100 pb-4 last:border-0"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-800">
                      {review.reviewer_name || "Anonymous"}
                    </span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={
                            star <= review.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ProviderProfile;
