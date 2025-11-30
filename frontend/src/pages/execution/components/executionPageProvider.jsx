// src/pages/provider/ExecutionPageProvider.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api";

/* -------------------------------------------------------------------------- */
/* HELPERS (SRP)                                                              */
/* -------------------------------------------------------------------------- */

const getBookingStatusClasses = (status) => {
  switch (status) {
    case "Paid":
      return "bg-emerald-100 text-emerald-700";
    case "Confirmed":
      return "bg-green-100 text-green-700";
    case "Negotiating":
      return "bg-orange-100 text-orange-700";
    case "Pending":
      return "bg-yellow-100 text-yellow-700";
    case "Completed":
      return "bg-blue-100 text-blue-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const StatusBadge = ({ label, className = "" }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-medium ${className}`}>
    {label}
  </span>
);

const InfoRow = ({ label, value }) => (
  <p className="text-sm text-gray-700">
    <span className="font-semibold">{label}: </span>
    {value ?? "N/A"}
  </p>
);

const DocumentLink = ({ label, url }) =>
  url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-blue-600 underline text-sm"
    >
      {label}
    </a>
  ) : (
    <p className="text-xs text-gray-400">{label} not uploaded</p>
  );

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

const ExecutionPageProvider = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [execution, setExecution] = useState(null);
  const [booking, setBooking] = useState(null);
  const [client, setClient] = useState(null);

  const [error, setError] = useState("");

  /* ---------------------------------------------------------------------- */
  /* FETCH FUNCTIONS                                                         */
  /* ---------------------------------------------------------------------- */

  const fetchExecution = useCallback(async () => {
    try {
      const res = await api.get(`/execution/${bookingId}`);
      const data = res.data?.data || res.data;
      setExecution(data);
      return data;
    } catch (err) {
      console.error("❌ Execution fetch error:", err);
      setError("Unable to load execution record.");
      return null;
    }
  }, [bookingId]);

const fetchBooking = useCallback(async (id) => {
  try {
    const res = await api.get(`/bookings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 🔥 UNIVERSAL EXTRACTION FIX
    let raw = res.data?.data ?? res.data;
    if (Array.isArray(raw)) raw = raw[0];
    if (!raw || typeof raw !== "object") raw = {};

    // 🔥 APPLY EXACT SAME NORMALIZATION
    const normalized = {
      ...raw,
      status: raw.status ? String(raw.status).trim() : "",
      completedclient: raw.completedclient
        ? raw.completedclient.trim().toLowerCase()
        : "",
      completedprovider: raw.completedprovider
        ? raw.completedprovider.trim().toLowerCase()
        : "",
    };

    setBooking(normalized);
    return normalized;

  } catch (err) {
    console.error("❌ Booking fetch error:", err);
    return null;
  }
}, [token]);




  const fetchClient = useCallback(async (clientId) => {
    try {
      const res = await api.get(`/users/public/${clientId}`);
      const data = res.data?.data || res.data;
      setClient(data);
      return data;
    } catch (err) {
      console.error("❌ Client fetch error:", err);
      return null;
    }
  }, []);

  const updateExecutionField = async (field) => {
    try {
      setUpdating(true);

      const res = await api.put(
        `/execution/${bookingId}/update`,
        { field },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = res.data?.data || res.data;
      setExecution(updated);
    } catch (err) {
      console.error("❌ Execution update error:", err);
    } finally {
      setUpdating(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* INITIAL LOAD                                                            */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      const exec = await fetchExecution();
      if (!mounted || !exec) return setLoading(false);

      await Promise.all([
        fetchBooking(exec.booking_id),
        fetchClient(exec.client_id),
      ]);

      if (mounted) setLoading(false);
    };

    load();
    return () => (mounted = false);
  }, [bookingId, fetchExecution, fetchBooking, fetchClient]);

  /* ---------------------------------------------------------------------- */
  /* EARLY UI STATES                                                         */
  /* ---------------------------------------------------------------------- */

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Loading execution details...
      </div>
    );

  if (!execution)
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Execution record not found.
      </div>
    );

  /* ---------------------------------------------------------------------- */
  /* DERIVED FLAGS                                                           */
  /* ---------------------------------------------------------------------- */

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

  const allDone = providerCompleted && completedclient === "completed";
  const bookingStatus = booking?.status || "N/A";

  /* ---------------------------------------------------------------------- */
  /* UI                                                                      */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* HEADER */}
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-green-700">
          Provider Execution #{booking_id}
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg"
          >
            🔄 Refresh
          </button>

          <button
            onClick={() => navigate(`/chat/${bookingId}/provider`)}
            className="bg-green-100 text-green-700 px-3 py-2 rounded-lg"
          >
            💬 Chat
          </button>

          <button
            onClick={() => navigate(-1)}
            className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* BODY */}
      <main className="flex-1 flex justify-center py-10 px-4">
        <div className="w-full max-w-5xl bg-white rounded-2xl border shadow-sm p-8 space-y-10">

          {/* CLIENT INFO */}
          <section className="flex gap-6 border-b pb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border shadow">
              <img
                src={
                  client?.profile_picture_url ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt="Client"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Client Information</h2>

              <InfoRow label="Name" value={client?.name} />
              <InfoRow label="Email" value={client?.email} />
              <InfoRow
                label="Location"
                value={`${client?.city || "N/A"}, ${client?.province || ""}`}
              />

              {/* DOCUMENTS */}
              <div className="mt-3 space-y-1">

                {/* SHOW ONLY IF SENIOR ID EXISTS */}
                {client?.id_document_url && (
                  <DocumentLink
                    label="Senior Citizen ID"
                    url={client.id_document_url}
                  />
                )}

                {/* SHOW ONLY IF PWD ID EXISTS */}
                {client?.pwd_document_url && (
                  <DocumentLink
                    label="PWD ID"
                    url={client.pwd_document_url}
                  />
                )}

              </div>

            </div>
          </section>

          {/* BOOKING INFO */}
          <section>
            <h2 className="text-xl font-semibold mb-3 border-b pb-2">
              Booking Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Booking ID" value={booking_id} />
              <InfoRow label="Payment ID" value={payment_id || "None"} />
              <InfoRow label="Client ID" value={client_id} />
              <InfoRow label="Provider ID" value={provider_id} />

              <InfoRow
                label="Scheduled Date"
                value={
                  booking?.scheduled_date
                    ? new Date(booking.scheduled_date).toLocaleString()
                    : "Not set"
                }
              />

              <InfoRow
                label="Price"
                value={
                  booking?.price
                    ? `$${Number(booking.price).toFixed(2)}`
                    : "N/A"
                }
              />

              <div className="flex items-center gap-2">
                <span className="font-semibold">Status:</span>
                <StatusBadge
                  label={bookingStatus}
                  className={getBookingStatusClasses(bookingStatus)}
                />
              </div>
            </div>
          </section>

          {/* PROVIDER PROGRESS */}
          <section>
            <h2 className="text-xl font-semibold mb-3 border-b pb-2">
              Provider Task Progress
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* credential validation */}
              <div className="p-6 bg-gray-50 border rounded-xl text-center">
                <h3 className="font-semibold mb-2">Credential Validation</h3>

                <StatusBadge
                  label={
                    validatedcredential === "completed"
                      ? "Validated"
                      : "Pending Provider"
                  }
                  className={
                    validatedcredential === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }
                />

                {validatedcredential !== "completed" && (
                  <button
                    onClick={() => updateExecutionField("validatedcredential")}
                    disabled={updating}
                    className="w-full mt-3 py-2 text-white rounded-full bg-green-600 hover:bg-green-700"
                  >
                    {updating ? "Updating..." : "Validate"}
                  </button>
                )}
              </div>

              {/* service completion */}
              <div className="p-6 bg-gray-50 border rounded-xl text-center">
                <h3 className="font-semibold mb-2">Service Completion</h3>

                <StatusBadge
                  label={
                    completedprovider === "completed"
                      ? "Completed"
                      : "Waiting for Provider"
                  }
                  className={
                    completedprovider === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }
                />

                {completedprovider !== "completed" && (
                  <button
                    onClick={() => updateExecutionField("completedprovider")}
                    disabled={validatedcredential !== "completed" || updating}
                    className={`w-full mt-3 py-2 rounded-full ${
                      validatedcredential !== "completed"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {updating ? "Updating..." : "Mark Complete"}
                  </button>
                )}
              </div>

              {/* client confirmation */}
              <div className="p-6 bg-gray-50 border rounded-xl text-center">
                <h3 className="font-semibold mb-2">Client Confirmation</h3>

                <StatusBadge
                  label={
                    completedclient === "completed"
                      ? "Client Confirmed"
                      : providerCompleted
                      ? "Waiting for Client"
                      : "Pending Provider Steps"
                  }
                  className={
                    completedclient === "completed"
                      ? "bg-green-100 text-green-700"
                      : providerCompleted
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-200 text-gray-600"
                  }
                />
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <div className="border-t pt-4 text-center">
            {allDone ? (
              <p className="text-green-700 font-semibold">
                ✅ Task fully completed!
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
