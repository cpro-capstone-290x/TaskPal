// src/components/Admin/ProviderReviewModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// providerSummary is the object from the list fetch (e.g., {id, name, email, etc.})
const ProviderReviewModal = ({ providerSummary, onClose, onActionSuccess }) => {
    const [fullDetails, setFullDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rejectionReason, setRejectionReason] = useState('');
    const [submitError, setSubmitError] = useState(null);
    const token = localStorage.getItem('adminToken');
    
    // Ref for the DaisyUI modal element
    const modalRef = useRef(null);

    // 1. Fetch ALL data for review using the dedicated Admin route
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Uses your dedicated GET /api/admin/providers/:id/review endpoint
                const response = await axios.get(`http://localhost:5000/api/admin/providers/${providerSummary.id}/review`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFullDetails(response.data.data);
            } catch (err) {
                setSubmitError('Could not load full provider details.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();

        // Optional: Show the modal immediately after component mounts
        // This simulates a programmatic modal open
        if (modalRef.current) {
            modalRef.current.showModal();
        }

    }, [providerSummary.id, token]);

    // 2. Handle Approve/Reject/Suspend Action
    const handleAction = async (newStatus) => {
        setSubmitError(null);
        if ((newStatus === 'Rejected' || newStatus === 'Suspended') && !rejectionReason.trim()) {
            return setSubmitError(`${newStatus} reason is mandatory.`);
        }
        
        try {
            // Uses your dedicated PATCH /api/providers/:id/status endpoint
            await axios.patch(`http://localhost:5000/api/providers/${providerSummary.id}/status`, {
                status: newStatus,
                rejection_reason: rejectionReason.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 3. Success: Close the modal and update the main list
            onActionSuccess(providerSummary.id); 
            // Close the DaisyUI modal
            if (modalRef.current) {
                modalRef.current.close();
            }
        } catch (err) {
            setSubmitError(err.response?.data?.error || `Failed to ${newStatus.toLowerCase()} provider.`);
        }
    };

    // The component must return the DaisyUI dialog element
    // The conditional rendering logic is handled by the outer component
    if (!fullDetails && !loading) return null;

    return (
        // DAISYUI MODAL STRUCTURE
        <dialog ref={modalRef} className="modal" onClose={onClose}>
            <div className="modal-box w-11/12 max-w-2xl p-6 bg-white text-black shadow-2xl">
                
                <h3 className="text-2xl font-bold border-b pb-3 mb-4 text-black">
                    Review Provider: {providerSummary.name}
                </h3>
                
                <h4 className="text-lg font-semibold mb-2 text-gray-700">Full Details</h4>

                {/* Display Full Details */}
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <span className="loading loading-dots loading-lg text-primary"></span>
                        <p className="ml-3 text-gray-600">Loading full details...</p>
                    </div>
                ) : (
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200 text-black">
                        <p><strong>Email:</strong> <span className="text-gray-700">{fullDetails.email}</span></p>
                        <p><strong>License ID:</strong> <span className="text-gray-700">{fullDetails.license_id}</span></p>
                        <p>
                            <strong>Documents:</strong> 
                            <a 
                                href={fullDetails.document} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="link link-primary ml-2 font-medium"
                            >
                                View Submitted File (Click to Open)
                            </a>
                        </p>
                        <p><strong>Type:</strong> <span className="badge badge-lg badge-outline badge-info">{fullDetails.provider_type} / {fullDetails.service_type}</span></p>
                    </div>
                )}
                
                {submitError && (
                    <div role="alert" className="alert alert-error mt-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{submitError}</span>
                    </div>
                )}

                {/* Rejection Field */}
                <label className="label mt-4">
                    <span className="label-text text-black font-semibold">Reason for REJECTION or SUSPENSION (Mandatory for rejection)</span>
                </label>
                <textarea
                    placeholder="Enter detailed reason here..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="textarea textarea-bordered w-full h-24 bg-white text-black"
                />

                {/* Action Buttons */}
                <div className="modal-action flex flex-col sm:flex-row sm:justify-between items-center pt-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={() => handleAction('Approved')} 
                            className="btn btn-success text-white min-w-[120px]"
                            disabled={loading}
                        >
                            ✅ Approve
                        </button>
                        <button 
                            onClick={() => handleAction('Rejected')} 
                            className="btn btn-error text-white min-w-[120px]"
                            disabled={loading}
                        >
                            ❌ Reject
                        </button>
                        <button 
                            onClick={() => handleAction('Suspended')} 
                            className="btn btn-warning text-white min-w-[120px]"
                            disabled={loading}
                        >
                            ⏸️ Suspend
                        </button>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="btn btn-ghost mt-4 sm:mt-0"
                    >
                        Close Review
                    </button>
                </div>
            </div>
            {/* Background click handler to close the modal */}
            <form method="dialog" className="modal-backdrop" onClick={onClose}>
                <button>close</button>
            </form>
        </dialog>
    );
};

export default ProviderReviewModal;