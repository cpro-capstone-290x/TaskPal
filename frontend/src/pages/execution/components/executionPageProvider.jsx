import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ExecutionPageProvider = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  // ✅ Fetch execution details
  const fetchExecution = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/execution/${bookingId}`);
      setExecution(res.data.data || res.data);
    } catch (err) {
      console.error("Error fetching execution:", err);
      setError("Failed to load execution details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecution(); // Load on mount
  }, [bookingId]);

  // ✅ Update provider-side steps (Persistent DB update)
  const handleStatusUpdate = async (field) => {
    if (!execution) return;
    setUpdating(true);
    try {
      // 1️⃣ Send update request to backend
      const res = await axios.put(
        `http://localhost:5000/api/execution/${bookingId}/update`,
        { field }
      );

      // 2️⃣ Check if DB confirms update success
      if (res.status === 200 && res.data.success) {
        // 3️⃣ Re-fetch from backend to ensure latest data (DB source of truth)
        await fetchExecution();
        alert(`${field} successfully updated in database ✅`);
      } else {
        alert("Server did not confirm update. Please try again.");
      }
    } catch (err) {
      console.error("Error updating execution:", err);
      alert("Failed to update execution status in the database.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading execution details...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  if (!execution)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        No execution record found.
      </div>
    );

  const {
    booking_id,
    client_id,
    provider_id,
    validatedcredential,
    completedprovider,
    completedclient,
    payment_id,
  } = execution;

  // ✅ Derived statuses
  const allDone =
    validatedcredential === "completed" &&
    completedprovider === "completed" &&
    completedclient === "completed";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-700">
          Provider Task Execution #{booking_id}
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium"
        >
          ← Back
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center py-10 px-4">
        <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-10">
          {/* Booking Info */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              Booking Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <p><span className="font-semibold">Booking ID:</span> {booking_id}</p>
              <p><span className="font-semibold">Payment ID:</span> {payment_id || "Not linked"}</p>
              <p><span className="font-semibold">Client ID:</span> {client_id}</p>
              <p><span className="font-semibold">Provider ID:</span> {provider_id}</p>
            </div>
          </section>

          {/* Provider Actions */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              Provider Actions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Credential Validation */}
              <div className="p-6 bg-gray-50 border rounded-xl text-center">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Credential Validation
                </h3>
                <span
                  className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium mb-3 ${
                    validatedcredential === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {validatedcredential === "completed"
                    ? "Credential Validated ✅"
                    : "Waiting for Provider Action"}
                </span>
                <button
                  onClick={() => handleStatusUpdate("validatedcredential")}
                  disabled={updating || validatedcredential === "completed"}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    validatedcredential === "completed"
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {validatedcredential === "completed"
                    ? "Completed"
                    : updating
                    ? "Updating..."
                    : "Validate Credential"}
                </button>
              </div>

              {/* Service Completion */}
              <div className="p-6 bg-gray-50 border rounded-xl text-center">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Service Completion
                </h3>
                <span
                  className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium mb-3 ${
                    completedprovider === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {completedprovider === "completed"
                    ? "Service Completed ✅"
                    : "Pending Provider Action"}
                </span>
                <button
                  onClick={() => handleStatusUpdate("completedprovider")}
                  disabled={
                    updating ||
                    completedprovider === "completed" ||
                    validatedcredential !== "completed"
                  }
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    completedprovider === "completed"
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : validatedcredential === "completed"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {completedprovider === "completed"
                    ? "Completed"
                    : validatedcredential === "completed"
                    ? updating
                      ? "Updating..."
                      : "Mark as Done"
                    : "Validate First"}
                </button>
              </div>
            </div>
          </section>

          {/* Client Confirmation */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
              Client Confirmation
            </h2>
            <div className="text-center">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  completedclient === "completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {completedclient === "completed"
                  ? "Client Confirmed ✅"
                  : "Waiting for Client Confirmation ⏳"}
              </span>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center pt-6 border-t">
            {allDone ? (
              <p className="text-green-700 font-semibold">
                ✅ Task fully completed and verified by client.
              </p>
            ) : (
              <p className="text-gray-500 text-sm">
                Waiting for all confirmations...
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExecutionPageProvider;
