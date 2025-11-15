import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProviderTerms from "./ProviderTerms";

const InputField = ({ label, id, type = "text", value, onChange, required = false, placeholder = "" }) => (
  <div className="flex flex-col">
    <label htmlFor={id} className="text-sm font-semibold text-gray-600 mb-1 tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-sky-200 focus:border-sky-500 transition duration-200 ease-in-out shadow-inner placeholder-gray-400 text-black bg-white"
    />
  </div>
);

const RegisterProvider = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    provider_type: "individual",
    service_type: "Cleaning",
    license_id: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    document: null,

    // NEW FIELDS:
    id_type: "",
    id_number: "",
    id_expiry: "",
    valid_id_file: null,
    note: "",
    insurance_provider: "",
    insurance_policy_number: "",
    insurance_expiry: "",
    insurance_document: null,

    // 🔥 FIXED LOCATION FIELD
  service_area: "Red Deer, Alberta",
  });

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  const navigate = useNavigate();

  // handle standard inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Supporting document
  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, document: e.target.files[0] }));
  };

  // Valid ID file
  const handleValidIDFile = (e) => {
    setFormData((prev) => ({ ...prev, valid_id_file: e.target.files[0] }));
  };

  // Insurance file
const handleInsuranceFile = (e) => {
  setFormData((prev) => ({ ...prev, insurance_document: e.target.files[0] }));
};



  // Upload Valid ID through backend
const uploadValidID = async (file) => {
  if (!file) return null;

  const API = `${import.meta.env.VITE_API_URL || "https://taskpal-14oy.onrender.com/api"}/providers/valid-id`;

  // ✅ FIX: Rename this variable
  const uploadFormData = new FormData();
  uploadFormData.append("file", file);

  // ✅ FIX: Now 'formData' refers to your component's state
  uploadFormData.append("name", formData.name);
  uploadFormData.append("id_type", formData.id_type);
  uploadFormData.append("id_number", formData.id_number);

  const response = await fetch(API, {
    method: "POST",
    body: uploadFormData, // ✅ FIX: Use the renamed variable here
  });

  // You can simplify this part now that the URL is fixed
  const data = await response.json().catch(() => {
    // This catch is still good practice in case of a 500 error
    throw new Error("Upload endpoint returned invalid JSON");
  });

  if (!response.ok) {
    throw new Error(data.error || "Upload failed");
  }

  return data.url;
};

const uploadBackgroundCheck = async (file) => {
  if (!file) return null;

  const API = `${import.meta.env.VITE_API_URL || "https://taskpal-14oy.onrender.com/api"}/providers/background-check`;

  const form = new FormData();
  form.append("file", file);
  form.append("name", formData.name);
  form.append("email", formData.email);

  const res = await fetch(API, { method: "POST", body: form });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Failed to upload background check");

  return data.url;
};

const uploadInsuranceDocument = async (file) => {
  if (!file) return null;

  const API = `${import.meta.env.VITE_API_URL || "https://taskpal-14oy.onrender.com/api"}/providers/insurance`;

  const form = new FormData();
  form.append("file", file);
  form.append("name", formData.name);
  form.append("email", formData.email);

  const res = await fetch(API, { method: "POST", body: form });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Failed to upload insurance document");

  return data.url;
};





const uploadCompanyDocuments = async (files) => {
  if (!files || files.length === 0) return [];

  const API = `${import.meta.env.VITE_API_URL}/providers/company-docs`;

  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  form.append("name", formData.name);
  form.append("email", formData.email);

  const res = await fetch(API, { method: "POST", body: form });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Document upload failed");

  return data.urls; // this is an array
};


  // submit
const handleSubmit = async (e) => {
  e.preventDefault();
  setStatus({ loading: true, error: null, success: false });

  if (!termsAccepted) {
    setStatus({ loading: false, error: "You must agree to the Terms & Conditions.", success: false });
    return;
  }

  const requiredFields = [
    "name",
    "email",
    "password",
    "confirm_password",
    "provider_type",
    "service_type",
    "license_id",
    "phone",
    "postal_code",
    "id_type",
    "id_number",
    "id_expiry",
    "note",
    "background_check_file",
    "insurance_provider",
    "insurance_policy_number",
    "insurance_expiry",
    "insurance_document",
    "service_area",
  ];

  const missing = requiredFields.filter((field) => !formData[field]);
  if (missing.length > 0) {
    setStatus({
      loading: false,
      error: `Please fill out all required fields: ${missing.join(", ")}`,
      success: false,
    });
    return;
  }

  if (formData.password !== formData.confirm_password) {
    setStatus({ loading: false, error: "Password and Confirm Password must match.", success: false });
    return;
  }
  if (!formData.background_check_file) {
  setStatus({
    loading: false,
    error: "Please upload your background check document.",
    success: false,
  });
  return;
}

// 🔹 VALIDATE RED DEER POSTAL CODE
const postal = (formData.postal_code || "").toUpperCase().replace(/\s+/g, "");

if (
  !(
    postal.startsWith("T4N") ||
    postal.startsWith("T4P") ||
    postal.startsWith("T4R")
  )
) {
  setStatus({
    loading: false,
    error: "Sorry, TaskPal currently only supports Red Deer providers (Postal must start with T4N, T4P, or T4R).",
    success: false,
  });
  return;
}


  // -------------------------------------------------------
  // 🔹 STEP 1 — Upload Valid Government ID
  // -------------------------------------------------------
  let valid_id_url = null;
  try {
    valid_id_url = await uploadValidID(formData.valid_id_file);
  } catch (err) {
    console.error("❌ Failed to upload valid ID:", err);
    setStatus({ loading: false, error: "Failed to upload Valid ID. Please try again.", success: false });
    return;
  }

  let background_check_url = null;

  try {
    background_check_url = await uploadBackgroundCheck(formData.background_check_file);
  } catch (err) {
    console.error("❌ Failed to upload background check:", err);
    setStatus({ loading: false, error: "Failed to upload background check document.", success: false });
    return;
  }


  // -------------------------------------------------------
  // 🔹 STEP 2 — Upload Company Document (IF provider_type = company)
  // -------------------------------------------------------
  let company_document_url = null;

  if (formData.provider_type === "company") {
    try {
      company_document_url = await uploadCompanyDocuments(formData.documents);
    } catch (err) {
      console.error("❌ Failed to upload company document:", err);
      setStatus({
        loading: false,
        error: "Failed to upload Company Supporting Document.",
        success: false,
      });
      return;
    }
  }

    // -------------------------------------------------------
  // 🔹 STEP — Upload Insurance Document (Required)
  // -------------------------------------------------------
  let insurance_document_url = null;

  try {
    insurance_document_url = await uploadInsuranceDocument(formData.insurance_document);
  } catch (err) {
    console.error("❌ Failed to upload insurance document:", err);
    setStatus({
      loading: false,
      error: "Failed to upload insurance document. Please try again.",
      success: false,
    });
    return;
  }


  // -------------------------------------------------------
  // 🔹 STEP 3 — Build final payload
  // -------------------------------------------------------
  const { confirm_password, valid_id_file, document, background_check_file, insurance_document, ...payload } = {
    ...formData,
    valid_id_url,
    background_check_url,
    company_documents: company_document_url, // <-- Added!!
    insurance_document_url,
    terms_accepted: true,
    terms_accepted_at: new Date().toISOString(),
  };

  const API_ENDPOINT = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/auth/registerProvider`
    : "https://taskpal-14oy.onrender.com/api/auth/registerProvider";

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      setStatus({ loading: false, error: result.error || "Registration failed.", success: false });
      return;
    }

    setStatus({ loading: false, error: null, success: true });

    setFormData({
      name: "",
      provider_type: "individual",
      service_type: "Cleaning",
      license_id: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: "",
      document: null,
      id_type: "",
      id_number: "",
      id_expiry: "",
      valid_id_file: null,
    });

    onSuccess({ email: formData.email });
  } catch (error) {
    console.error("❌ Network error:", error);
    setStatus({
      loading: false,
      error: "Could not connect to server.",
      success: false,
    });
  }
};


  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl bg-white shadow-2xl border border-gray-100 rounded-3xl p-8 md:p-10">
        <header className="text-center mb-10 pb-4 border-b border-sky-100">
          <h1 className="text-4xl font-black text-sky-700">Register as a Provider</h1>
          <p className="text-gray-500 text-lg">Join TaskPal and start offering your services.</p>
        </header>

        {status.success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 text-green-700 rounded-xl text-center font-semibold">
            ✅ Registration successful! Check your email for OTP verification.
          </div>
        )}

        {status.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl text-center font-semibold">
            ❌ {status.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* name + provider type */}
          <div className="grid md:grid-cols-2 gap-6">
            <InputField
              label="Full Name / Business Name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                Provider Type <span className="text-red-500">*</span>
              </label>
              <select
                name="provider_type"
                value={formData.provider_type}
                onChange={handleChange}
                required
                className="p-3 border border-gray-300 rounded-xl bg-white"
              >
                <option value="individual">Individual</option>
                <option value="company">Company / Business</option>
              </select>
            </div>
          </div>

          {/* service type + license */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-1">Service Type *</label>
              <select
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                required
                className="p-3 border border-gray-300 rounded-xl bg-white"
              >
                <option value="Moving">Moving</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Gardening">Gardening</option>
              </select>
            </div>

            <InputField
              label="License / Certification ID"
              id="license_id"
              value={formData.license_id}
              onChange={handleChange}
              required
            />
          </div>

          {/* emails, phone and address */}
          <div className="grid md:grid-cols-2 gap-6">
          <InputField label="Email" id="email" type="email" value={formData.email} onChange={handleChange} required />

          <InputField label="Phone Number" id="phone" value={formData.phone} onChange={handleChange} required />

          <InputField
            label="Postal Code"
            id="postal_code"
            value={formData.postal_code || ""}
            onChange={handleChange}
            required
            placeholder="e.g., T4N 5E3"
          />

          <InputField
            label="Service Area (Auto-Set)"
            id="service_area"
            value={formData.service_area}
            onChange={() => {}}
          />
        </div>


          {/* password */}
          <div className="grid md:grid-cols-2 gap-6">
            <InputField label="Password" id="password" type="password" value={formData.password} onChange={handleChange} required />

            <InputField label="Confirm Password" id="confirm_password" type="password" value={formData.confirm_password} onChange={handleChange} required />
          </div>

          {/* supporting document — SHOW ONLY IF COMPANY */}
          {formData.provider_type === "company" && (
            <div className="p-4 border border-gray-300 rounded-xl bg-gray-50">
              <label className="text-sm font-semibold text-gray-600 mb-1">
                Business Supporting Document (Required for Company Providers)
              </label>

              <input
                type="file"
                multiple
                onChange={(e) => setFormData({ ...formData, documents: [...e.target.files] })}
              />

              <p className="text-xs text-gray-500 mt-2">
                Upload business permit, certification, or related legal documents.
              </p>
            </div>
          )}


          {/* VALID ID SECTION */}
          <div className="p-4 border border-gray-300 rounded-xl bg-gray-50">
            <h2 className="text-lg font-semibold mb-3 text-gray-700">Valid Government ID</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <InputField
                label="ID Type"
                id="id_type"
                value={formData.id_type}
                onChange={handleChange}
                required
                placeholder="Driver’s License, Passport, etc."
              />

              <InputField
                label="ID Number"
                id="id_number"
                value={formData.id_number}
                onChange={handleChange}
                required
                placeholder="e.g., DL-123-456-789"
              />
            </div>

            <InputField
              label="Expiry Date"
              id="id_expiry"
              type="date"
              value={formData.id_expiry}
              onChange={handleChange}
              required
            />

            <label className="text-sm font-semibold text-gray-600 mt-3 mb-1">Upload Valid ID (Image/PDF) *</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleValidIDFile}
              className="w-full p-3 border border-gray-300 rounded-xl bg-white"
              required
            />
          </div>

          {/* BACKGROUND CHECK SECTION */}
          <div className="p-4 border border-gray-300 rounded-xl bg-gray-50">
            <h2 className="text-lg font-semibold mb-3 text-gray-700">
              Background Check Document <span className="text-red-500">*</span>
            </h2>

            <p className="text-xs text-gray-500 mb-2">
              Accepted: Police clearance, vulnerable sector check, or any official background verification.
            </p>

            <input
              type="file"
              required
              accept="image/*,application/pdf"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, background_check_file: e.target.files[0] }))
              }
              className="w-full p-3 border border-gray-300 rounded-xl bg-white"
            />
          </div>

          {/* INSURANCE SECTION */}
          <div className="p-4 border border-gray-300 rounded-xl bg-gray-50">
            <h2 className="text-lg font-semibold mb-3 text-gray-700">
              Provider Insurance (Required) <span className="text-red-500">*</span>
            </h2>

            <InputField
              label="Insurance Provider"
              id="insurance_provider"
              value={formData.insurance_provider}
              onChange={handleChange}
              required
            />

            <InputField
              label="Policy Number"
              id="insurance_policy_number"
              value={formData.insurance_policy_number}
              onChange={handleChange}
              required
            />

            <InputField
              label="Insurance Expiry Date"
              id="insurance_expiry"
              type="date"
              value={formData.insurance_expiry}
              onChange={handleChange}
              required
            />

            <label className="text-sm font-semibold text-gray-600 mt-3 mb-1">
              Upload Proof of Insurance (PDF or Image) *
            </label>

            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleInsuranceFile}
              className="w-full p-3 border border-gray-300 rounded-xl bg-white"
              required
            />
          </div>



          <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-600 mb-1">
           Provider Details — help clients learn more about your services <span className="text-red-500">*</span>
          </label>
          <textarea
            id="note"
            name="note"
            value={formData.note}
            onChange={handleChange}
            required
            placeholder={`Example:
        - Services: Residential Cleaning, Deep Cleaning
        - Experience: 3 years
        - Certifications: First Aid, CPR, Cleaning Specialist Certification
        `}
            className="w-full p-3 border border-gray-300 rounded-xl h-32 focus:ring-4 focus:ring-sky-200 focus:border-sky-500 transition duration-200 ease-in-out shadow-inner placeholder-gray-400 text-black bg-white"
          />
        </div>


          {/* TERMS */}
          <div className="flex items-center gap-3 pt-4">
            <input
              type="checkbox"
              className="w-5 h-5 cursor-pointer"
              checked={termsAccepted}
              onChange={() => {
                if (!termsAccepted) setShowTermsModal(true);
                else setTermsAccepted(false);
              }}
            />
            <span className="text-gray-700 text-sm cursor-pointer" onClick={() => setShowTermsModal(true)}>
              I agree to the <span className="text-sky-600 underline">Terms & Conditions</span>
            </span>
          </div>

          <button
            type="submit"
            disabled={status.loading}
            className="w-full py-3 mt-6 bg-sky-600 text-white font-extrabold text-lg rounded-xl shadow-lg hover:bg-sky-700"
          >
            {status.loading ? "Registering..." : "Complete Registration"}
          </button>
        </form>
      </div>
      

      <ProviderTerms
        open={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAgree={() => {
          setTermsAccepted(true);
          setShowTermsModal(false);
        }}
      />
    </div>
  );
};

export default RegisterProvider;
