import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Edit2, Save, X, CheckCircle, Clock, Upload, User as UserIcon } from 'lucide-react'; 

// --- Helper Component for Input Fields (Same as before) ---
const ProfileField = ({ label, name, value, onChange, readOnly = false, type = 'text', className = '' }) => {
  const baseClasses = "w-full px-4 py-2 border text-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none";
  const editClasses = "bg-white border-gray-300 shadow-sm";
  const viewClasses = "bg-gray-50 text-gray-600 border-gray-200";

  const inputClasses = `${baseClasses} ${readOnly ? viewClasses : editClasses} ${className}`;
  
  return (
    <div>
      <label className="block text-gray-600 text-sm font-medium mb-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        readOnly={readOnly}
        className={inputClasses}
      />
    </div>
  );
};

const Provider = () => {
  const { id } = useParams();
  
  const [provider, setProvider] = useState(null); 
  // 🚨 ADDED: profile_picture_url to formData
  const [formData, setFormData] = useState({ profile_picture_url: '' }); 
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', message: '' });
  // 🚨 NEW: State for file upload preview
  const [newProfilePicture, setNewProfilePicture] = useState(null); 
  const [isUploading, setIsUploading] = useState(false);

  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchProvider = async () => {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("authToken");
      const role = localStorage.getItem("userRole");
      const providerId = localStorage.getItem("providerId");

      if (!id) {
        setError("No provider ID found in URL.");
        setLoading(false);
        return;
      }

      try {
        let url;

        // ✅ Provider views their own profile
        if (role === "provider" && parseInt(providerId) === parseInt(id)) {
          url = `http://localhost:5000/api/providers/${id}`;
        } else {
          // ✅ Public route for clients or viewing another provider
          url = `http://localhost:5000/api/providers/public/${id}`;
        }

        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(url, { headers });

        if (res.data && res.data.data) {
          const fetchedData = res.data.data;
          setProvider(fetchedData);
          setFormData({
            ...fetchedData,
            profile_picture_url: fetchedData.profile_picture_url || "",
          });
        } else {
          setError("Provider not found.");
        }
      } catch (err) {
        console.error("Error fetching provider:", err);
        if (err.response && err.response.status === 403) {
          setError("You are not authorized to view this profile.");
        } else {
          setError("Failed to load provider data. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [id]);

  // --- Form Handlers ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const formatAddress = (data) => {
    const parts = [
      data.unit_no, 
      data.street, 
      data.city, 
      data.province, 
      data.postal_code
    ].filter(Boolean).join(", ");
    return parts;
  };

  // 🚨 NEW: Picture Upload Handler
  const handlePictureUpload = async (file) => {
    if (!file) return;

    const data = new FormData();
    data.append('profilePicture', file);
    data.append('providerId', id); // Pass ID for backend lookup

    setIsUploading(true);
    setSaveMessage({ type: '', message: 'Uploading picture...' });
    
    try {
      // 🚨 REPLACE WITH ACTUAL IMAGE UPLOAD API ENDPOINT
      const uploadRes = await axios.post(
        `http://localhost:5000/api/providers/upload-picture/${id}`, 
        data, 
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Assuming the backend returns the new picture URL
      const newUrl = uploadRes.data.url;
      
      setFormData(prevData => ({
        ...prevData,
        profile_picture_url: newUrl
      }));
      setNewProfilePicture(null); // Clear file input
      setSaveMessage({ type: 'success', message: 'Picture uploaded successfully. Click Save Changes to finalize profile.' });
      
    } catch (err) {
      console.error("Error uploading picture:", err);
      setSaveMessage({ type: 'error', message: 'Failed to upload picture. Max size 2MB allowed.' });
    } finally {
      setIsUploading(false);
      setTimeout(() => setSaveMessage({ type: '', message: '' }), 7000);
    }
  };

  // --- Save/Update Function ---
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage({ type: '', message: 'Saving profile...' });

    const token = localStorage.getItem('authToken');

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      // Send the entire formData, which includes the potentially new profile_picture_url
      const res = await axios.put(`http://localhost:5000/api/providers/${id}`, formData, config);

      if (res.data && res.data.data) {
        setProvider(res.data.data); 
        setFormData(res.data.data);
        setIsEditing(false); // Exit edit mode on successful save
        setSaveMessage({ type: 'success', message: 'Profile updated successfully! ✅' });
      } else {
        setSaveMessage({ type: 'error', message: 'Update failed: ' + (res.data.message || 'Server error.') });
      }
    } catch (err) {
      console.error("Error saving provider:", err);
      setSaveMessage({ type: 'error', message: 'Failed to save profile. Check console for details.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage({ type: '', message: '' }), 5000);
    }
  };

  // --- Cancel Function ---
  const handleCancel = () => {
    // Revert formData back to the original provider state
    setFormData(provider);
    setNewProfilePicture(null); // Clear preview file
    setIsEditing(false);
    setSaveMessage({ type: '', message: '' });
  };

  // --- Initial Loading/Error/Null Checks ---
  if (loading) return <p className="text-center mt-10 text-xl font-medium flex items-center justify-center gap-2"><Clock className="animate-spin" size={20} /> Loading Profile...</p>;
  if (error) return <p className="text-center text-red-600 mt-10 text-xl font-medium">🚨 {error}</p>;
  if (!provider) return <p className="text-center mt-10 text-gray-500">No provider data available.</p>;

  // --- JSX Rendering ---
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h2 className="text-3xl font-bold text-gray-800">
          Provider Profile
        </h2>
        
        {/* Edit Button / Control */}
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md"
          >
            <Edit2 size={18} /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition duration-150"
              disabled={isSaving || isUploading}
            >
              <X size={18} /> Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 shadow-md disabled:opacity-50"
              disabled={isSaving || isUploading}
            >
              {isSaving ? (
                <>
                  <Clock className="animate-spin" size={18} /> Saving...
                </>
              ) : (
                <>
                  <Save size={18} /> Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Save Message Display */}
      {saveMessage.message && (
        <div className={`p-3 mb-4 rounded-lg text-sm font-medium ${
          saveMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {saveMessage.message}
        </div>
      )}

      {/* Profile Picture Section */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-4 border-b">
        
        {/* Profile Image Display */}
        <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-gray-200">
          {provider.profile_picture_url || formData.profile_picture_url ? (
            <img 
              src={formData.profile_picture_url || provider.profile_picture_url} 
              alt={`${provider.name} Profile`} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              <UserIcon size={40} />
            </div>
          )}
        </div>

        {/* Upload Button (Only in Edit Mode) */}
        {isEditing && (
          <div className="flex flex-col items-start">
            <label className="block text-gray-600 text-sm font-medium mb-2">
              Update Profile Photo
            </label>
            <input
              type="file"
              id="profile-picture-upload"
              accept="image/*"
              className="hidden"
              onChange={(e) => setNewProfilePicture(e.target.files[0])}
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => document.getElementById('profile-picture-upload').click()}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                disabled={isUploading}
              >
                <Upload size={16} /> Choose File
              </button>

              {newProfilePicture && (
                <button
                  type="button"
                  onClick={() => handlePictureUpload(newProfilePicture)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Confirm Upload'}
                </button>
              )}
            </div>
            {newProfilePicture && (
                <p className="text-xs text-gray-500 mt-1">
                    File selected: {newProfilePicture.name}. Click 'Confirm Upload' or Cancel.
                </p>
            )}
          </div>
        )}
        
      </div>

      {/* Profile Form/View */}
      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Business Name */}
          <ProfileField 
            label="Business Name"
            name="name"
            value={isEditing ? formData.name : provider.name}
            onChange={handleInputChange}
            readOnly={!isEditing}
          />

          {/* Provider Type */}
          <ProfileField 
            label="Provider Type"
            name="provider_type"
            value={isEditing ? formData.provider_type : provider.provider_type}
            onChange={handleInputChange}
            readOnly={!isEditing}
          />

          {/* Service Type */}
          <ProfileField 
            label="Service Type"
            name="service_type"
            value={isEditing ? formData.service_type : provider.service_type}
            onChange={handleInputChange}
            readOnly={!isEditing}
          />

          {/* License Id (Read Only) */}
          <ProfileField 
            label="License ID"
            name="license_id"
            value={provider.license_id}
            readOnly={true}
            className="opacity-70"
          />

          {/* Email (Full Width) */}
          <div className="md:col-span-2">
            <ProfileField 
              label="Email"
              name="email"
              type="email"
              value={isEditing ? formData.email : provider.email}
              onChange={handleInputChange}
              readOnly={!isEditing}
            />
          </div>

          {/* Phone Number */}
          <ProfileField 
            label="Phone Number"
            name="phone"
            type="tel"
            value={isEditing ? formData.phone : provider.phone}
            onChange={handleInputChange}
            readOnly={!isEditing}
          />
          
          {/* Rating (Read Only) */}
          <div className="md:col-span-1">
            <label className="block text-gray-600 text-sm font-medium mb-1">Rating</label>
            <input
              type="text"
              value={provider.rating ? `${provider.rating} ★` : "No ratings yet"}
              readOnly
              className="w-full px-4 py-2 bg-gray-50 border text-gray-600 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none opacity-70"
            />
          </div>

          {/* Address (Full Width) */}
          <div className="md:col-span-2">
            <label className="block text-gray-600 text-sm font-medium mb-1">Address</label>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Note: In a real app, you might want to combine these into one field for simple forms */}
                <ProfileField label="Unit/Apt #" name="unit_no" value={formData.unit_no} onChange={handleAddressChange} />
                <ProfileField label="Street" name="street" value={formData.street} onChange={handleAddressChange} />
                <ProfileField label="City" name="city" value={formData.city} onChange={handleAddressChange} />
                <ProfileField label="Province/State" name="province" value={formData.province} onChange={handleAddressChange} />
                <div className="col-span-2">
                  <ProfileField label="Postal/Zip Code" name="postal_code" value={formData.postal_code} onChange={handleAddressChange} />
                </div>
              </div>
            ) : (
              <textarea
                value={formatAddress(provider)}
                readOnly
                rows="3"
                className="w-full px-4 py-2 bg-gray-50 border text-gray-600 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              ></textarea>
            )}
          </div>
          
          {/* Verification Status & Join Date */}
          <div className="flex items-center gap-3 md:col-span-2 mt-2 pt-4 border-t">
            
            {/* Logic checks if provider.status is 'Approved' */}
            {provider.status === 'Approved' ? (
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-700 border border-green-200"
              >
                <CheckCircle size={16} className="mr-1" /> Verified & Approved
              </span>
            ) : (
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200"
              >
                <Clock size={16} className="mr-1" /> Status: {provider.status || 'Pending'}
              </span>
            )}
            
            <span className="text-gray-500 text-sm">
              Joined on{" "}
              {new Date(provider.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

        </div>
      </form>
      
      {/* Save and Cancel buttons at the bottom too, for long forms */}
      {isEditing && (
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition duration-150"
            disabled={isSaving || isUploading}
          >
            <X size={18} /> Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 shadow-md disabled:opacity-50"
            disabled={isSaving || isUploading}
          >
            {isSaving ? (
              <>
                <Clock className="animate-spin" size={18} /> Saving...
              </>
            ) : (
              <>
                <Save size={18} /> Save Changes
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
};

export default Provider;