// src/components/Admin/ProviderReviewModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../../api.js';

const STATUS_STYLES = {
  Approved: 'btn-success',
  Rejected: 'btn-error',
  Suspended: 'btn-warning'
};

const ProviderReviewModal = ({ providerSummary, onClose, onActionSuccess }) => {
  const modalRef = useRef(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState('Approved');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const token = localStorage.getItem('adminToken');

  // ✅ Fetch full details & open modal
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(
          `/admin/providers/${providerSummary.id}/review`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setDetails(res.data.data);
      } catch (err) {
        setErrorMsg('Unable to load provider details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    setTimeout(() => modalRef.current?.showModal(), 20);
  }, [providerSummary.id, token]);

  // ✅ Submit update
  const handleSubmit = async () => {
    setErrorMsg(null);

    if ((actionStatus === 'Rejected' || actionStatus === 'Suspended') && !reason.trim()) {
      return setErrorMsg(`Please provide a reason for ${actionStatus}.`);
    }

    try {
      await api.patch(
        `/providers/${providerSummary.id}/status`,
        { status: actionStatus, rejection_reason: reason.trim() || null },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      modalRef.current?.close();
      onActionSuccess(providerSummary.id);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || `Failed to update provider.`);
    }
  };

  return (
    <dialog ref={modalRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-2xl bg-white">
        
        {/* Modal header */}
        <h3 className="text-xl font-bold border-b pb-3">
          Reviewing: {providerSummary.name}
        </h3>

        {/* Provider Details */}
        {loading ? (
          <div className="py-8 flex justify-center items-center">
            <span className="loading loading-spinner text-primary"></span>
          </div>
        ) : (
          details && (
            <div className="mt-4 bg-gray-50 border rounded-lg p-4">
              <p><strong>Email:</strong> {details.email}</p>
              <p><strong>License ID:</strong> {details.license_id}</p>
              <p>
                <strong>Document:</strong>
                <a
                  href={details.document}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 underline"
                >
                  View file
                </a>
              </p>
              <p><strong>Category:</strong> {details.provider_type} / {details.service_type}</p>
            </div>
          )
        )}

        {/* Error */}
        {errorMsg && (
          <div className="alert alert-error mt-4 text-white">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Status & Reason Field */}
        <div className="mt-6">
          <label className="font-semibold">Set Status</label>
          <div className="flex gap-3 mt-2">
            {Object.keys(STATUS_STYLES).map((s) => (
              <button
                key={s}
                className={`btn ${actionStatus === s ? STATUS_STYLES[s] : 'btn-outline'}`}
                onClick={() => setActionStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="font-semibold">
            Reason {actionStatus === 'Approved' ? '(optional)' : '(required)'}
          </label>
          <textarea
            className="textarea textarea-bordered w-full"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide more details here..."
          />
        </div>

        {/* Actions */}
        <div className="modal-action">
          <button
            className={`btn ${STATUS_STYLES[actionStatus]}`}
            onClick={handleSubmit}
            disabled={loading || ((actionStatus !== 'Approved') && !reason.trim())}
          >
            Confirm {actionStatus}
          </button>

          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>

      {/* Close on backdrop click */}
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>Close</button>
      </form>
    </dialog>
  );
};

export default ProviderReviewModal;
