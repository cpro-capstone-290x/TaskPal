// src/components/Admin/ProviderReviewModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// providerSummary is the object from the list fetch (e.g., {id, name, email, etc.})
const ProviderReviewModal = ({ providerSummary, onClose, onActionSuccess }) => {
    const [fullDetails, setFullDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rejectionReason, setRejectionReason] = useState('');
    const [submitError, setSubmitError] = useState(null);
    const token = localStorage.getItem('adminToken');

    // 1. Fetch ALL data for review using the dedicated Admin route
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // ⭐ Uses your dedicated GET /api/admin/providers/:id/review endpoint
                const response = await axios.get(`/api/admin/providers/${providerSummary.id}/review`, {
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
    }, [providerSummary.id, token]);

    // 2. Handle Approve/Reject/Suspend Action
    const handleAction = async (newStatus) => {
        setSubmitError(null);
        if (newStatus === 'Rejected' && !rejectionReason.trim()) {
            return setSubmitError("Rejection reason is mandatory.");
        }
        
        try {
            // ⭐ Uses your dedicated PATCH /api/providers/:id/status endpoint
            await axios.patch(`/api/providers/${providerSummary.id}/status`, {
                status: newStatus,
                rejection_reason: newStatus === 'Rejected' ? rejectionReason.trim() : null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 3. Success: Close the modal and update the main list
            onActionSuccess(providerSummary.id); 
        } catch (err) {
            setSubmitError(err.response?.data?.error || `Failed to ${newStatus.toLowerCase()} provider.`);
        }
    };

    if (!fullDetails) return null; // Modal will not show until data is ready

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '700px', width: '90%' }}>
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Review: {fullDetails.name}</h3>
                
                {/* Display Full Details */}
                {loading ? (
                    <p>Loading details...</p>
                ) : (
                    <div>
                        <p><strong>Email:</strong> {fullDetails.email}</p>
                        <p><strong>License ID:</strong> {fullDetails.license_id}</p>
                        <p><strong>Documents:</strong> <a href={fullDetails.document} target="_blank" rel="noopener noreferrer">View Submitted File</a></p>
                        <p><strong>Type:</strong> {fullDetails.provider_type} ({fullDetails.service_type})</p>
                    </div>
                )}
                
                {submitError && <p style={{ color: 'red' }}>{submitError}</p>}

                {/* Rejection Field */}
                <textarea
                    placeholder="Enter reason for REJECTION or SUSPENSION"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{ width: '100%', minHeight: '80px', margin: '15px 0' }}
                />

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleAction('Approved')} style={{ backgroundColor: 'green', color: 'white' }}>
                        ✅ Approve
                    </button>
                    <button onClick={() => handleAction('Rejected')} style={{ backgroundColor: 'red', color: 'white' }}>
                        ❌ Reject
                    </button>
                    <button onClick={() => handleAction('Suspended')} style={{ backgroundColor: 'orange', color: 'white' }}>
                        ⏸️ Suspend
                    </button>
                    <button onClick={onClose} style={{ marginLeft: 'auto' }}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ProviderReviewModal;