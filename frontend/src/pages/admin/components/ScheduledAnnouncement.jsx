// src/pages/Admin/ScheduledAnnouncement.jsx
import React, { useState, useEffect } from 'react';

const ScheduledAnnouncement = () => {
  // -- State Management --
  const [form, setForm] = useState({
    title: "",
    message: "",
    start_at: "",
    end_at: "",
  });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: '' }

  // -- API Configuration --
  const BASE_URL = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/announcements` 
    : "https://taskpal-14oy.onrender.com/api/announcements";

  const getToken = () => localStorage.getItem("adminToken");

  // -- Helper: Show temporary notification --
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // -- 1. Fetch Announcements --
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/allannouncement`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.data);
      }
    } catch (err) {
      console.error("Error loading announcements:", err);
      showNotification("error", "Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // -- 2. Form Handling --
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message || !form.start_at || !form.end_at) {
      showNotification("error", "Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Creation failed");

      showNotification("success", "Announcement scheduled successfully!");
      setForm({ title: "", message: "", start_at: "", end_at: "" });
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      showNotification("error", "Failed to create announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  // -- 3. Action Handlers --
  const handleAction = async (id, actionType) => {
    const endpointMap = {
      activate: `${BASE_URL}/${id}/activate`,
      complete: `${BASE_URL}/${id}/complete`,
      delete: `${BASE_URL}/${id}`
    };

    const methodMap = {
      activate: "PATCH",
      complete: "PATCH",
      delete: "DELETE"
    };

    if (actionType === 'delete' && !window.confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const res = await fetch(endpointMap[actionType], {
        method: methodMap[actionType],
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res.ok) throw new Error("Action failed");
      
      showNotification("success", `Announcement ${actionType}d successfully.`);
      fetchAnnouncements();
    } catch (err) {
      showNotification("error", `Failed to ${actionType} announcement.`);
    }
  };

  // -- Render Helpers --
  const getStatusBadge = (isActive) => {
    if (isActive === true) return <div className="badge badge-success text-white gap-1">Active</div>;
    if (isActive === false) return <div className="badge badge-neutral text-gray-400 gap-1">Completed</div>;
    return <div className="badge badge-warning text-white gap-1">Pending</div>;
  };

  return (
    // ⭐ Force Light Theme Wrapper
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-1" data-theme="light">
      
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Notices</h1>
          <p className="text-gray-500 mt-2">Schedule maintenance alerts and important updates for users.</p>
        </div>
      </div>

      {/* Notification Toast (Top Center) */}
      {notification && (
        <div className="toast toast-top toast-center z-50">
          <div className={`alert shadow-lg ${notification.type === 'success' ? 'alert-success text-white' : 'alert-error text-white'}`}>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* --- Left Column: Create Form --- */}
        <div className="xl:col-span-1">
          <div className="card bg-white border border-gray-200 shadow-sm sticky top-6">
            <div className="card-body">
              <h2 className="card-title text-gray-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.795 23.91 23.91 0 01-1.014 5.795m0-11.59a23.877 23.877 0 010 11.59" />
                </svg>
                New Announcement
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Title</span></label>
                  <input
                    name="title"
                    placeholder="e.g., Scheduled Maintenance"
                    value={form.title}
                    onChange={handleChange}
                    className="input input-bordered focus:input-primary w-full bg-gray-50"
                  />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Message</span></label>
                  <textarea
                    name="message"
                    placeholder="Details about the update..."
                    value={form.message}
                    onChange={handleChange}
                    className="textarea textarea-bordered focus:textarea-primary w-full h-24 bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                  <div className="form-control">
                    <label className="label"><span className="label-text font-semibold text-xs uppercase text-gray-500">Start Date</span></label>
                    <input
                      type="datetime-local"
                      name="start_at"
                      value={form.start_at}
                      onChange={handleChange}
                      className="input input-bordered input-sm w-full text-gray-600"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-semibold text-xs uppercase text-gray-500">End Date</span></label>
                    <input
                      type="datetime-local"
                      name="end_at"
                      value={form.end_at}
                      onChange={handleChange}
                      className="input input-bordered input-sm w-full text-gray-600"
                    />
                  </div>
                </div>

                <div className="card-actions justify-end mt-6">
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="btn btn-primary w-full shadow-md text-white"
                  >
                    {submitting ? <span className="loading loading-spinner"></span> : 'Schedule Broadcast'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* --- Right Column: History Table --- */}
        <div className="xl:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700">History Log</h3>
              <span className="text-xs text-gray-500">Sorted by creation date</span>
            </div>
            
            {loading ? (
               <div className="p-12 flex flex-col items-center justify-center text-gray-400">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                  <span className="mt-2 text-sm">Loading history...</span>
               </div>
            ) : announcements.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <p>No announcements found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-white text-gray-500 border-b border-gray-200">
                    <tr>
                      <th>Info</th>
                      <th>Timing</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {announcements.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                        {/* Info */}
                        <td className="max-w-xs">
                          <div className="font-bold text-gray-900">{a.title}</div>
                          <div className="text-xs text-gray-500 truncate">{a.message}</div>
                        </td>

                        {/* Timing */}
                        <td className="text-xs text-gray-500">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-gray-700">Start: {new Date(a.start_at).toLocaleDateString()}</span>
                            <span>End: {new Date(a.end_at).toLocaleDateString()}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          {getStatusBadge(a.is_active)}
                        </td>

                        {/* Actions */}
                        <td className="text-right">
                          <div className="join">
                            {/* Activate Button */}
                            <button 
                              className="btn btn-sm btn-square btn-ghost join-item text-emerald-600 hover:bg-emerald-50 tooltip" 
                              data-tip="Activate"
                              onClick={() => handleAction(a.id, 'activate')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                              </svg>
                            </button>
                            
                            {/* Complete Button */}
                            <button 
                              className="btn btn-sm btn-square btn-ghost join-item text-amber-600 hover:bg-amber-50 tooltip" 
                              data-tip="Complete"
                              onClick={() => handleAction(a.id, 'complete')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>

                            {/* Delete Button */}
                            <button 
                              className="btn btn-sm btn-square btn-ghost join-item text-red-500 hover:bg-red-50 tooltip" 
                              data-tip="Delete"
                              onClick={() => handleAction(a.id, 'delete')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledAnnouncement;