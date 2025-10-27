import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import Header from "../../components/Header";
import api from "../../../api";

const ProviderProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Fetch provider (public route) + reviews (public route)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [providerRes, reviewsRes] = await Promise.all([
          api.get(`/providers/public/${id}`),
          api.get(`/reviews/provider/${id}`),
        ]);

        setProvider(providerRes.data?.data || providerRes.data);
        setReviews(reviewsRes.data?.data || []);
      } catch (err) {
        console.error("❌ Provider Fetch Error:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load provider profile. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ⭐ Average rating calculation
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + Number(r.rating), 0) /
          reviews.length
        ).toFixed(1)
      : "0.0";

  // ⏳ Loading state
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Fetching provider details...
      </div>
    );

  // ❌ Error state
  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );

  // 🧐 Not found
  if (!provider)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Provider not found.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Top bar */}
      <div className="bg-white shadow-sm border-b px-8 py-4 flex justify-between items-center mt-2">
        <h1 className="text-2xl font-bold text-green-700">
          {provider.name}
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
        >
          ← Back
        </button>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto py-10 px-4 flex-1 w-full">
        {/* Provider Overview */}
        <section className="bg-white shadow-sm border rounded-2xl p-8 mb-10">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">

            {/* Photo */}
            <img
              src={
                provider.photo_url ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt="Provider"
              className="w-32 h-32 rounded-full object-cover border bg-gray-50"
            />

            {/* Info */}
            <div className="flex-1 space-y-2">
              <h2 className="text-2xl font-semibold text-gray-800">
                {provider.name}
              </h2>
              <p className="text-gray-600 capitalize">
                {provider.service_type} Services
              </p>
              <p className="text-gray-600">
                {provider.city || "Somewhere"}, {provider.province || "Unknown"}
              </p>

              {/* Contact */}
              <div className="text-sm text-gray-500 mt-3 space-y-1">
                <p><strong>Email:</strong> {provider.email}</p>
                {provider.phone && (
                  <p><strong>Phone:</strong> {provider.phone}</p>
                )}
              </div>

              {/* Bio */}
              <p className="mt-4 text-gray-700 leading-relaxed">
                {provider.bio || "This provider hasn’t written a bio yet."}
              </p>
            </div>

            {/* Rating card */}
            <div className="text-center bg-green-50 border border-green-300 rounded-xl p-5 w-full md:w-60">
              <h3 className="text-3xl font-bold text-green-700">
                ⭐ {avgRating}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </p>

              <button
                onClick={() => navigate(`/booking/initiate/${provider.id}`)}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition"
              >
                Book Now
              </button>
            </div>

          </div>
        </section>

        {/* Reviews */}
        <section className="bg-white shadow-sm border rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-2">
            Customer Reviews
          </h2>

          {reviews.length === 0 ? (
            <p className="text-center text-gray-500">No reviews yet.</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-800">
                      {review.reviewer_name || "Anonymous User"}
                    </span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={18}
                          className={`${
                            star <= review.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
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
