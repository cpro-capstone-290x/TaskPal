// src/components/Admin/ProviderDetailsModal.jsx
import React, { useEffect, useRef, useState } from "react";
import api from "../../../api";

const ProviderDetailsModal = ({ provider, onClose }) => {
  const modalRef = useRef(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!provider) return;

    const fetchDetails = async () => {
      try {
        const res = await api.get(`/admin/providers/${provider.id}/review`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDetails(res.data.data);
      } catch (e) {
        setError("Failed to load provider details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    setTimeout(() => modalRef.current?.showModal(), 20);
  }, [provider, token]);

  return (
    <dialog ref={modalRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-2xl bg-white">
        <h3 className="text-xl font-bold border-b pb-3">
          Provider Details: {provider?.name}
        </h3>

        {/* Loading */}
        {loading && (
          <div className="py-10 flex justify-center">
            <span className="loading loading-spinner text-primary"></span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-error mt-4 text-white">
            <span>{error}</span>
          </div>
        )}

        {/* Provider Details */}
        {!loading && details && (
          <div className="mt-4 space-y-3 text-gray-800">
            <p>
              <strong>Email:</strong> {details.email}
            </p>
            <p>
              <strong>Phone:</strong> {details.phone || "N/A"}
            </p>
            <p>
              <strong>License ID:</strong> {details.license_id}
            </p>
            <p>
              <strong>Category:</strong> {details.provider_type} /{" "}
              {details.service_type}
            </p>

            {/* Documents */}
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Uploaded Documents</h4>
              <ul className="space-y-2 pl-2">
                {/* Valid ID */}
                <li>
                  <strong>Valid ID:</strong>{" "}
                  {details.valid_id_url ? (
                    <a
                      href={details.valid_id_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 underline"
                    >
                      View file
                    </a>
                  ) : (
                    <span className="text-red-500">Missing</span>
                  )}
                </li>

                {/* Background Check */}
                <li>
                  <strong>Background Check:</strong>{" "}
                  {details.background_check_url ? (
                    <a
                      href={details.background_check_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 underline"
                    >
                      View file
                    </a>
                  ) : (
                    <span className="text-red-500">Missing</span>
                  )}
                </li>

                {/* Insurance Document */}
                <li>
                  <strong>Insurance Document:</strong>{" "}
                  {details.insurance_document_url ? (
                    <a
                      href={details.insurance_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 underline"
                    >
                      View file
                    </a>
                  ) : (
                    <span className="text-red-500">Missing</span>
                  )}
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>Close</button>
      </form>
    </dialog>
  );
};

export default ProviderDetailsModal;
