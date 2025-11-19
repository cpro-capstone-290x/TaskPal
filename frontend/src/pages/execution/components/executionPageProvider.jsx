// src/pages/provider/ExecutionPageProvider.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api";

const ExecutionPageProvider = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  /* ------------------------ Fetch Execution ------------------------ */
  const fetchExecution = async () => {
    try {
      const res = await api.get(`/execution/${bookingId}`);
      setExecution(res.data.data || res.data);
    } catch (err) {
      console.error("Error fetching execution:", err);
      setError("Failed to load execution details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecution();
    const interval = setInterval(fetchExecution, 5000);
    return () => clearInterval(interval);
  }, [bookingId]);

  /* ------------------------ Update Status ------------------------ */
  const handleStatusUpdate = async (field) => {
    setUpdating(true);

    try {
      const res = await api.put(`/execution/${bookingId}/update`, { field });
      setExecution(res.data.data || res.data);

      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err) {
      console.error("Update error:", err);
      alert("Refresh the page and try again.");
      setUpdating(false);
    }
  };

  /* ------------------------ Early UI States ------------------------ */
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

  /* ------------------------ Data Extraction ------------------------ */
  const {
    booking_id,
    client_id,
    provider_id,
    validatedcredential,
    completedprovider,
    completedclient,
    payment_id,
  } = execution;

  const providerCompleted =
    validatedcredential === "completed" && completedprovider === "completed";

  const allDone =
    validatedcredential === "completed" &&
    completedprovider === "completed" &&
    completedclient === "completed";

  /* ------------------------ UI ------------------------ */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ------------------------ Header ------------------------ */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-700">
          Provider Task Execution #{booking_id}
        </h1>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={fetchExecution}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium"
          >
            🔄 Refresh
          </button>

          {/* Chat button */}
          <button
            onClick={() => navigate(`/chat/${booking_id}/provider`)}
            className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-medium"
          >
            💬 Chat
          </button>

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* ------------------------ Main Content ------------------------ */}
      <main className="flex-1 flex flex-col items-center py-10 px-4">
        <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-10">

          {/* ------------------------ Booking Info ------------------------ */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
              Booking Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <p><span className="font-semibold">Booking ID:</span> {booking_id}</p>
              <p><span className="font-semibold">Payment ID:</span> {payment_id || "Not linked"}</p>
              <p><span className="font-semibold">Client ID:</span> {client_id}</p>
              <p><span className="font-semibold">Provider ID:</span> {provider_id}</p>
            </div>
          </section>

          {/* ------------------------ Provider Progress ------------------------ */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
              Provider Task Progress
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Credential Validation */}
              <div className="p-6 bg-gray-50 border rounded-xl text-center">
                <h3 className="font-semibold text-gray-800 mb-2">Credential Validation</h3>

                <span
                  className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    validatedcredential === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {validatedcredential === "completed"
                    ? "Validated ✅"
                    : "Pending Provider"}
                </span>

                {validatedcredential !== "completed" && (
                  <button
                    onClick={() => handleStatusUpdate("validatedcredential")}
                    disabled={updating}
                    className={`w-full mt-3 py-2 rounded-full text-sm font-medium ${
                      updating
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {updating ? "Updating..." : "Validate"}
                  </button>
                )}
              </div>

              {/* Service Completion */}
              <div className="p-6 bg-gray-50 border rounded-xl text-center">
                <h3 className="font-semibold text-gray-800 mb-2">Service Completion</h3>

                <span
                  className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    completedprovider === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {completedprovider === "completed"
                    ? "Completed ✅"
                    : "Waiting for Provider"}
                </span>

                {completedprovider !== "completed" && (
                  <button
                    onClick={() => handleStatusUpdate("completedprovider")}
                    disabled={validatedcredential !== "completed" || updating}
                    className={`w-full mt-3 py-2 rounded-full text-sm font-medium ${
                      validatedcredential !== "completed"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {updating ? "Updating..." : "Mark Complete"}
                  </button>
                )}
              </div>

              {/* Client Confirmation */}
              <div className="p-6 bg-gray-50 border rounded-xl text-center">
                <h3 className="font-semibold text-gray-800 mb-2">Client Confirmation</h3>

                <span
                  className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    completedclient === "completed"
                      ? "bg-green-100 text-green-700"
                      : providerCompleted
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {completedclient === "completed"
                    ? "Client Confirmed ✅"
                    : providerCompleted
                    ? "Waiting for Client"
                    : "Pending Provider Steps"}
                </span>
              </div>

            </div>
          </section>

          {/* ------------------------ Footer ------------------------ */}
          <div className="text-center pt-6 border-t">
            {allDone ? (
              <p className="text-green-700 font-semibold">
                ✅ Task fully completed.
              </p>
            ) : (
              <p className="text-gray-500 text-sm">
                Waiting for remaining confirmations...
              </p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default ExecutionPageProvider;
