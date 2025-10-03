import React, { useState } from "react";
import axios from "axios";

// Base URL for the API (replace with your actual environment config)
const API_BASE_URL = "http://localhost:5000/api";

export default function NegotiationControls({ negotiationId, providerId }) {
  // State for user input (for Counter Offer)
  const [counterPrice, setCounterPrice] = useState("");
  
  // State for API interaction
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [responseStatus, setResponseStatus] = useState(null); // 'accepted', 'rejected', or 'countered'

  /**
   * Handles the API call to respond to the negotiation.
   * @param {string} status - The negotiation status ('accepted', 'rejected', 'countered').
   * @param {number | null} price - The final price or counter price, if applicable.
   */
  const handleResponse = async (status, price = null) => {
    setError(null);
    setResponseStatus(null);
    setIsLoading(true);

    if (status === "countered" && (!price || isNaN(price) || price <= 0)) {
      setError("Please enter a valid counter price.");
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        negotiation_id: negotiationId,
        // The providerId prop is used here, assuming this is the provider's view
        provider_id: providerId, 
        status,
        // Only send final_price if it's relevant for the status
        final_price: price ? parseFloat(price) : null, 
      };

      const res = await axios.post(`${API_BASE_URL}/tasks/chat/respond`, payload);
      
      console.log("Negotiation Response Success:", res.data);
      setResponseStatus(status); // Mark the action as successful

    } catch (err) {
      console.error("Negotiation failed:", err.response || err);
      setError(err.response?.data?.message || `Failed to submit response for ${status}.`);
      setResponseStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if the component is locked after a successful action
  const isLocked = !!responseStatus;

  // --- Utility Classes ---
  const buttonBaseClasses = "px-4 py-2 font-semibold rounded-lg transition duration-200 shadow-md flex-1 min-w-0";
  const disabledClasses = "opacity-50 cursor-not-allowed";

  // --- Content ---
  if (isLocked) {
    return (
      <div className="p-3 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-center font-medium">
        Negotiation status set to <strong className="uppercase text-blue-600">{responseStatus}</strong>.
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-white">
      <h4 className="text-md font-bold mb-3 text-gray-700">Select Negotiation Action:</h4>

      {error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* --- Counter Input Group --- */}
      <div className="flex gap-2 items-center mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
        <label htmlFor="counterPrice" className="text-sm font-medium whitespace-nowrap">
          Counter Price ($)
        </label>
        <input
          type="number"
          id="counterPrice"
          value={counterPrice}
          onChange={(e) => setCounterPrice(e.target.value)}
          placeholder="e.g., 125"
          className="w-full p-2 border border-yellow-400 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
          disabled={isLoading}
        />
        <button 
          onClick={() => handleResponse("countered", counterPrice)} 
          disabled={isLoading || !counterPrice.trim()}
          className={`${buttonBaseClasses} bg-yellow-500 text-black hover:bg-yellow-600 active:bg-yellow-700 disabled:bg-yellow-300`}
        >
          {isLoading ? 'Sending...' : 'Counter'}
        </button>
      </div>

      {/* --- Accept/Reject Buttons --- */}
      <div className="flex gap-4">
        <button 
          onClick={() => handleResponse("accepted")} 
          disabled={isLoading}
          className={`${buttonBaseClasses} bg-green-600 text-white hover:bg-green-700 disabled:${disabledClasses}`}
        >
          {isLoading ? 'Processing...' : 'Accept'}
        </button>
        <button 
          onClick={() => handleResponse("rejected")} 
          disabled={isLoading}
          className={`${buttonBaseClasses} bg-red-600 text-white hover:bg-red-700 disabled:${disabledClasses}`}
        >
          {isLoading ? 'Processing...' : 'Reject'}
        </button>
      </div>
      
      {/* Optional: Debug info */}
      <div className="mt-4 text-xs text-gray-500 pt-3 border-t">
        <p>Negotiation ID: **{negotiationId}**</p>
        <p>Provider ID: **{providerId}**</p>
      </div>
    </div>
  );
}