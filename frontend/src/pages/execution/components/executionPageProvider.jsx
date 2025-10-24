import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../../api";

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
    fetchExecution(); // Load on mount
  }, [bookingId]);

  // ✅ Update provider-side steps (Persistent DB update)
    const handleStatusUpdate = async (field) => {
    setUpdating(true);
    try {
        await api.put(`/execution/${bookingId}/update`, { field });

        // ✅ Optional: short delay for UX, then reload the page
        setTimeout(() => {
        window.location.reload();
        }, 800);
    } catch (err) {
        // console.error("Error updating execution:", err);
        alert("Refresh the Page");
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
                onClick={() => handleStatusUpdate("validatedcredential", setTimeout(() => {
                        window.location.reload();
                        }, 800))}
                disabled={updating || validatedcredential === "completed"}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    validatedcredential === "completed"
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : updating
                    ? "bg-gray-300 text-gray-600 cursor-wait"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
                >
                {validatedcredential === "completed"
                    ? "Completed"
                    : updating
                    ? (
                        <span className="flex items-center justify-center gap-2">
                        <svg
                            className="animate-spin h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            ></circle>
                            <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                            ></path>
                        </svg>
                        Updating...
                        </span>
                    )
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
                  onClick={() => handleStatusUpdate("completedprovider", setTimeout(() => {
                        window.location.reload();
                        }, 800))}
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
