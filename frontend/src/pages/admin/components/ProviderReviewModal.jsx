// src/components/Admin/ProviderReviewModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// providerSummary is the object from the list fetch (e.g., {id, name, email, etc.})
const ProviderReviewModal = ({ providerSummary, onClose, onActionSuccess }) => {
    const [fullDetails, setFullDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    // Setting initial status to 'Approved' is a good practice for the default state
    const [actionStatus, setActionStatus] = useState('Approved');
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
                console.error('Fetch error:', err);
                setSubmitError('Could not load full provider details.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();

        // Show the modal immediately after component mounts
        if (modalRef.current) {
            modalRef.current.showModal();
        }

    }, [providerSummary.id, token]);

    // 2. Handle Approve/Reject/Suspend Action
    const handleAction = async (newStatus) => {
        setSubmitError(null);
        const reason = rejectionReason.trim();
        
        // Frontend Validation: Enforce reason for Reject/Suspend (as defined in your component logic)
        if ((newStatus === 'Rejected' || newStatus === 'Suspended') && !reason) {
            return setSubmitError(`${newStatus} reason is mandatory for this action.`);
        }
        
        try {
            // Payload only includes the reason if it's available, otherwise null is sent.
            // This is safe because the backend controls whether to save it based on 'status'.
            const payload = {
                status: newStatus,
                rejection_reason: reason || null
            };

            // Uses your dedicated PATCH /api/providers/:id/status endpoint
            await axios.patch(`http://localhost:5000/api/providers/${providerSummary.id}/status`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 3. Success: Close the modal and update the main list
            // Close the DaisyUI modal first
            if (modalRef.current) {
                modalRef.current.close();
            }
            onActionSuccess(providerSummary.id); 
            
        } catch (err) {
            console.error('Action error:', err);
            setSubmitError(err.response?.data?.error || `Failed to ${newStatus.toLowerCase()} provider.`);
        }
    };

    // The component must return the DaisyUI dialog element
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

                {/* Status Selection and Reason Field */}
                <div className="mt-6 border-t pt-4">
                    <label className="label">
                        <span className="label-text text-black font-semibold text-lg">Select Action:</span>
                    </label>
                    <div className="flex gap-3 mb-4">
                        {['Approved', 'Rejected', 'Suspended'].map(status => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setActionStatus(status)}
                                className={`btn ${actionStatus === status ? 
                                    (status === 'Approved' ? 'btn-success' : status === 'Rejected' ? 'btn-error' : 'btn-warning') : 
                                    'btn-ghost'
                                }`}
                                disabled={loading}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <label className="label mt-4">
                        <span className={`label-text font-semibold ${actionStatus === 'Rejected' || actionStatus === 'Suspended' ? 'text-red-700' : 'text-gray-700'}`}>
                            Reason for {actionStatus} ({actionStatus === 'Rejected' || actionStatus === 'Suspended' ? 'Mandatory' : 'Optional'})
                        </span>
                    </label>
                    <textarea
                        placeholder="Enter detailed reason here..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="textarea textarea-bordered w-full h-24 bg-white text-black"
                    />
                </div>

                {/* Action Buttons */}
                <div className="modal-action flex flex-col sm:flex-row sm:justify-end items-center pt-4">
                    <button 
                        onClick={() => handleAction(actionStatus)} 
                        className={`btn min-w-[150px] ${actionStatus === 'Approved' ? 'btn-success' : actionStatus === 'Rejected' ? 'btn-error' : 'btn-warning'} text-white mr-4`}
                        disabled={loading || ((actionStatus === 'Rejected' || actionStatus === 'Suspended') && !rejectionReason.trim())}
                    >
                        {loading ? 'Submitting...' : `Confirm ${actionStatus}`}
                    </button>
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
