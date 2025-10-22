import React, { useState, useEffect } from 'react';
import axios from 'axios';
// FIX: Explicitly specify the file extension for the local component import
import ProviderReviewModal from './ProviderReviewModal.jsx'; 

const ApprovalQueueView = () => {
    // State for data, loading, selection, and errors
    const [pendingList, setPendingList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState(null); 
    const [error, setError] = useState(null);

    // Function to fetch pending provider applications
    const fetchPendingProviders = async () => {
        setLoading(true);
        // NOTE: In a production environment, avoid storing tokens in localStorage for security.
        const token = localStorage.getItem('adminToken');
        try {
            const response = await axios.get('http://localhost:5000/api/admin/providers/pending', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Assuming response.data.data holds the array of pending providers
            setPendingList(response.data.data);
            setError(null);
        } catch (err) {
            console.error('Fetch pending providers error:', err);
            // Provide a user-friendly error message
            setError('Failed to load pending applications. Please check the network connection and backend status.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        fetchPendingProviders();
    }, []);

    // Handler to remove the provider from the list after successful approval/rejection
    const handleActionSuccess = (providerId) => {
        setPendingList(prev => prev.filter(p => p.id !== providerId));
        setSelectedProvider(null); 
    };

    // --- Loading State ---
    if (loading) return (
        // Clean loading state with centered spinner
        <div className="p-12 flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg shadow-inner text-gray-700">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg font-semibold">Loading pending providers...</p>
        </div>
    );

    // --- Error State ---
    if (error) return (
        <div role="alert" className="p-4 m-6 max-w-7xl mx-auto rounded-lg bg-red-100 border border-red-400 text-red-700">
            <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="font-bold">Error:</span> {error}
            </div>
        </div>
    );

    // --- Main View ---
    return (
        // Ensure light background and dark text for clarity in the admin panel
        <div className="p-6 max-w-7xl mx-auto bg-white text-gray-900 min-h-screen">
            <h2 className="text-4xl font-extrabold mb-8 text-gray-900 border-b pb-2">
                Provider Approval Queue 
                <span className={`ml-4 text-2xl font-semibold ${pendingList.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    ({pendingList.length} Pending)
                </span>
            </h2>

            {pendingList.length === 0 ? (
                // Success alert when queue is empty
                <div className="p-4 rounded-lg bg-green-100 border border-green-400 text-green-700">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-lg font-medium">No new applications currently awaiting review. The queue is clear! ✅</span>
                    </div>
                </div>
            ) : (
                // Table of pending providers
                <div className="overflow-x-auto shadow-2xl rounded-xl border border-gray-100">
                    <table className="min-w-full table-auto divide-y divide-gray-200">
                        {/* Table head: Clean, slightly contrasting header */}
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                                    Service Type
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                                    Date Applied
                                </th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-600">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {pendingList.map(provider => (
                                <tr key={provider.id} className="hover:bg-indigo-50 transition duration-150 ease-in-out cursor-pointer">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {provider.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                            {provider.service_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(provider.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button 
                                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out shadow-lg"
                                            onClick={() => setSelectedProvider(provider)}
                                        >
                                            Review/Act
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal for reviewing a single provider */}
            {selectedProvider && (
                <ProviderReviewModal
                    providerSummary={selectedProvider} 
                    onClose={() => setSelectedProvider(null)}
                    onActionSuccess={handleActionSuccess} 
                />
            )}
        </div>
    );
};

export default ApprovalQueueView;
