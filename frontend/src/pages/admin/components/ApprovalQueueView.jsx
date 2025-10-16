// src/components/Admin/ApprovalQueueView.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProviderReviewModal from './ProviderReviewModal';

const ApprovalQueueView = () => {
    const [pendingList, setPendingList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState(null); // Full data object
    const [error, setError] = useState(null);

    const fetchPendingProviders = async () => {
        setLoading(true);
        // ⭐ Fetch the list from the Admin Controller endpoint
        const token = localStorage.getItem('adminToken');
        try {
            const response = await axios.get('/api/admin/providers/pending', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingList(response.data.data);
            setError(null);
        } catch (err) {
            setError('Failed to load pending applications.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingProviders();
    }, []);

    // Function to update the list after a successful Approve/Reject action
    const handleActionSuccess = (providerId) => {
        // Remove the processed provider from the list
        setPendingList(prev => prev.filter(p => p.id !== providerId));
        setSelectedProvider(null); // Close the modal
    };

    if (loading) return <div>Loading pending providers...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

    return (
        <div>
            <h2>Provider Approval Queue ({pendingList.length} Pending)</h2>
            {pendingList.length === 0 ? (
                <p>No new applications currently awaiting review. ✅</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Service Type</th>
                            <th>Date Applied</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingList.map(provider => (
                            <tr key={provider.id}>
                                <td>{provider.name}</td>
                                <td>{provider.service_type}</td>
                                <td>{new Date(provider.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button onClick={() => setSelectedProvider(provider)}>
                                        Review/Act
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Modal/Review Component */}
            {selectedProvider && (
                <ProviderReviewModal
                    providerSummary={selectedProvider} // Pass the summary data
                    onClose={() => setSelectedProvider(null)}
                    onActionSuccess={handleActionSuccess} 
                />
            )}
        </div>
    );
};

export default ApprovalQueueView;