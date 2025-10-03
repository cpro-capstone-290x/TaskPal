import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

// Base URL for the API (replace with your actual environment config)
const API_BASE_URL = "http://localhost:5000/api";

const BookTask = () => {
  const { taskId } = useParams();
  
  // State for form inputs
  const [formData, setFormData] = useState({
    // Use the URL param as the default taskId, or null if not present
    task_id: taskId || '', 
    client_id: 2, // Hardcoded: Should come from context/auth
    provider_id: 3, // Hardcoded: Should be selected or context-based
    notes: "",
    // Initialize date to a standard format for a datetime-local input
    scheduled_date: new Date().toISOString().slice(0, 16), 
  });

  // State for API interaction
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Set task_id from URL once the component mounts or taskId changes
  useEffect(() => {
    if (taskId) {
      setFormData(prev => ({ ...prev, task_id: taskId }));
    }
  }, [taskId]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle API call for booking
  const handleBooking = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSuccess(false);
    setIsLoading(true);

    // Basic form validation
    if (!formData.task_id || !formData.scheduled_date) {
      setError("Task ID and Scheduled Date are required.");
      setIsLoading(false);
      return;
    }
    
    // Prepare the payload (convert date to ISO string for the backend)
    const payload = {
        ...formData,
        task_id: parseInt(formData.task_id, 10), // Ensure ID is a number
        // Convert local date/time input to ISO string expected by backend
        scheduled_date: new Date(formData.scheduled_date).toISOString(), 
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/tasks/chat/book`, payload);
      
      setResponse(res.data);
      setIsSuccess(true);
      
    } catch (err) {
      console.error("Booking failed:", err.response || err);
      // Display a user-friendly error message
      setError(err.response?.data?.message || `Booking failed. Please check the console for details.`);
      setResponse(null);
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Utility function for input styling
  const inputClass = "w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-xl mx-auto my-10 p-6 bg-white shadow-xl rounded-lg border border-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-3">
        Book Task Confirmation 
        {taskId && <span className="text-blue-600 ml-2">#{taskId}</span>}
      </h1>

      {/* --- Booking Form --- */}
      <form onSubmit={handleBooking} className="space-y-4">
        
        {/* Task ID Input */}
        <div>
          <label htmlFor="task_id" className={labelClass}>Task ID (Service)</label>
          <input
            type="number"
            id="task_id"
            name="task_id"
            value={formData.task_id}
            onChange={handleChange}
            placeholder="e.g., 101"
            required
            className={inputClass}
            // If taskId is from URL, user probably shouldn't edit it
            disabled={!!taskId} 
          />
        </div>

        {/* Scheduled Date Input */}
        <div>
          <label htmlFor="scheduled_date" className={labelClass}>Scheduled Date & Time</label>
          <input
            type="datetime-local"
            id="scheduled_date"
            name="scheduled_date"
            value={formData.scheduled_date}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>

        {/* Notes Textarea */}
        <div>
          <label htmlFor="notes" className={labelClass}>Notes for Provider</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="e.g., Please bring extra equipment."
            className={inputClass}
          ></textarea>
        </div>
        
        {/* Hidden/Contextual Fields (for display only) */}
        <div className="text-xs text-gray-500 pt-2 border-t mt-6">
            <p><strong>Client ID:</strong> {formData.client_id} (Your ID)</p>
            <p><strong>Provider ID:</strong> {formData.provider_id} (Assigned Provider)</p>
        </div>

        {/* --- Submit Button --- */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full px-4 py-3 text-lg font-semibold rounded-md transition duration-200 
            ${isLoading 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">...</svg>
              Processing Booking...
            </span>
          ) : (
            "Confirm Booking"
          )}
        </button>
      </form>

      {/* --- Status Messages --- */}
      {isSuccess && (
        <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md" role="alert">
          <p className="font-bold">Booking Successful! 🎉</p>
          <p className="text-sm">The task has been successfully booked with the provider.</p>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md" role="alert">
          <p className="font-bold">Booking Failed! 😞</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* --- Response Display (for development/debugging) --- */}
      {response && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">API Response (Debug)</h3>
          <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto border border-gray-300">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default BookTask;