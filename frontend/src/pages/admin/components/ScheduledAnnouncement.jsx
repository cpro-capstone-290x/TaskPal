import React, { useState, useEffect } from "react";

const ScheduledAnnouncement = () => {
  const [form, setForm] = useState({
    title: "",
    message: "",
    start_at: "",
    end_at: "",
  });

  const [announcements, setAnnouncements] = useState([]);

  const BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const GET_ALL_URL = `${BASE_URL}/announcements/allannouncement`;
  const CREATE_URL = `${BASE_URL}/announcements/create`;

  /* ---------------------------------------------------------
     LOAD ALL ANNOUNCEMENTS
  --------------------------------------------------------- */
  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(GET_ALL_URL, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      const data = await res.json();
      if (data.success) setAnnouncements(data.data);
    } catch (err) {
      console.error("Error loading announcements:", err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  /* ---------------------------------------------------------
     FORM CHANGE HANDLER
  --------------------------------------------------------- */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ---------------------------------------------------------
     CREATE ANNOUNCEMENT
  --------------------------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.message || !form.start_at || !form.end_at) {
      alert("All fields are required.");
      return;
    }

    try {
      const res = await fetch(CREATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        alert("Failed to create announcement");
        return;
      }

      alert("Announcement created!");

      setForm({
        title: "",
        message: "",
        start_at: "",
        end_at: "",
      });

      fetchAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------------------------------------------------------
     ACTION HANDLERS
  --------------------------------------------------------- */

  const activateAnnouncement = async (id) => {
    await fetch(`${BASE_URL}/announcements/${id}/activate`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    });
    fetchAnnouncements();
  };

  const completeAnnouncement = async (id) => {
    await fetch(`${BASE_URL}/announcements/${id}/complete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    });
    fetchAnnouncements();
  };

  const deleteAnnouncement = async (id) => {
    if (!confirm("Delete this announcement?")) return;

    await fetch(`${BASE_URL}/announcements/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    });

    fetchAnnouncements();
  };

  /* ---------------------------------------------------------
     STATUS LABEL
  --------------------------------------------------------- */
    const statusLabel = (is_active) => {
    if (is_active === true) return "Active";
    if (is_active === false) return "Completed";
    return "Pending"; // default if null or undefined
    };

  return (
    <div className="p-6 bg-white rounded-xl shadow space-y-10">

      {/* Create Announcement */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-700">
          Create System Announcement
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Title"
            value={form.title}
            className="input input-bordered w-full"
            onChange={handleChange}
          />

          <textarea
            name="message"
            placeholder="Announcement content"
            value={form.message}
            className="textarea textarea-bordered w-full"
            onChange={handleChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-sm text-gray-600">
                Start At
              </label>
              <input
                type="datetime-local"
                name="start_at"
                value={form.start_at}
                className="input input-bordered w-full"
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="font-semibold text-sm text-gray-600">
                End At
              </label>
              <input
                type="datetime-local"
                name="end_at"
                value={form.end_at}
                className="input input-bordered w-full"
                onChange={handleChange}
              />
            </div>
          </div>

          <button className="btn btn-primary w-full mt-4">
            Create Announcement
          </button>
        </form>
      </div>

      {/* Announcement History */}
      <div>
        <h2 className="text-xl font-semibold mb-3 text-gray-700">
          Announcement History
        </h2>

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Title</th>
                <th>Message</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {announcements.map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td>{a.message}</td>
                  <td>{new Date(a.start_at).toLocaleString()}</td>
                  <td>{new Date(a.end_at).toLocaleString()}</td>

                <td>
                <span
                    className={`badge ${
                    a.is_active
                        ? "badge-success"
                        : a.is_active === false
                        ? "badge-warning"
                        : "badge-neutral"
                    }`}
                >
                    {statusLabel(a.is_active)}
                </span>
                </td>


                  <td className="flex gap-2 justify-center">
                    <button
                      className="btn btn-xs btn-success"
                      onClick={() => activateAnnouncement(a.id)}
                    >
                      Activate
                    </button>

                    <button
                      className="btn btn-xs btn-warning"
                      onClick={() => completeAnnouncement(a.id)}
                    >
                      Complete
                    </button>

                    <button
                      className="btn btn-xs btn-error"
                      onClick={() => deleteAnnouncement(a.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {announcements.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No announcements yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ScheduledAnnouncement;
