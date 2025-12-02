import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DocumentUploadField from "./DocumentUploadField";
import UserTerms from "./UserTerms";
import AddressAutoComplete from "./AddressAutoComplete";

const InputField = ({
  label,
  id,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder = "",
}) => (
  <div className="flex flex-col">
    <label
      htmlFor={id}
      className="text-sm font-semibold text-gray-600 mb-1 tracking-wide"
    >
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

const RegisterUser = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    type_of_user: "senior_citizen",
    email: "",
    password: "",
    confirm_password: "",
    unit_no: "",
    street: "",
    city: "",
    province: "Alberta",
    postal_code: "",
    date_of_birth: "",
    gender: "",
    assistance_level: "",
    living_situation: "",
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: "",
    id_document_url: "",
    pwd_document_url: "",
  });

  const [idFile, setIdFile] = useState(null);
  const [pwdFile, setPwdFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  // 🔹 Address validation state
  const [validationError, setValidationError] = useState("");
  const [addressSelection, setAddressSelection] = useState(null);

  const navigate = useNavigate();

  // 🔹 API base & endpoints
  const API_BASE = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : "https://taskpal-14oy.onrender.com/api";

  const REGISTER_ENDPOINT = `${API_BASE}/auth/registerUser`;
  const VALIDATE_ENDPOINT = `${API_BASE}/address/validate-google`;

  // 🔹 Generic field change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // 🔹 Called by AddressAutoComplete when a suggestion is chosen
  // 🔹 Called by AddressAutoComplete when a suggestion is chosen
  const handlePlaceSelected = async (place) => {
    // store minimal info if you want it later
    setAddressSelection({
      placeId: place.place_id,
      formatted: place.formatted_address,
    });
    setValidationError("");

    try {
      // 1) Call backend to validate Red Deer
      const res = await fetch(VALIDATE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: place.place_id }),
      });

      const data = await res.json();

      if (!data?.valid) {
        // Not Red Deer → show error + clear address fields
        setValidationError(
          "We currently only accept residents from Red Deer, Alberta."
        );
        setFormData((prev) => ({
          ...prev,
          street: "",
          postal_code: "",
          city: "",
          province: "Alberta",
        }));
        return;
      }

      // 2) Parse address components from the place object
      const comps = place.address_components || [];

      const getComp = (types) =>
        comps.find((c) => types.every((t) => c.types.includes(t)));

      const streetNumber = getComp(["street_number"])?.long_name || "";
      const route = getComp(["route"])?.long_name || "";
      const postalCode = getComp(["postal_code"])?.long_name || "";

      const fullStreet = `${streetNumber} ${route}`.trim();

      // 3) Auto-fill the form fields
      setFormData((prev) => ({
        ...prev,
        street: fullStreet || prev.street,
        postal_code: postalCode || prev.postal_code,
        city: "Red Deer", // we know it's valid Red Deer now
        province: "Alberta",
      }));
    } catch (err) {
      console.error("Error validating address:", err);
      setValidationError("Error validating address. Please try again.");
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    setUploading(true);

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("type", type);

    // ⛔ Requires temporary fake ID before OTP verification
    const tempUserId = "temp";

    const API = `${API_BASE}/users/${tempUserId}/user-document`;

    const res = await fetch(API, {
      method: "POST",
      body: formDataUpload,
    });

    const data = await res.json();
    setUploading(false);

    if (!data.url) {
      alert("Upload failed.");
      return;
    }

    if (type === "senior_id") {
      setFormData((prev) => ({ ...prev, id_document_url: data.url }));
      setIdFile(file);
    } else {
      setFormData((prev) => ({ ...prev, pwd_document_url: data.url }));
      setPwdFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    // 🔹 Require address selection / validation
    if (!addressSelection) {
      setStatus({
        loading: false,
        error:
          "Please search and select your address from the address box above (Red Deer only).",
        success: false,
      });
      return;
    }

    if (validationError) {
      setStatus({
        loading: false,
        error:
          "We currently only accept residents from Red Deer, Alberta. Please use a valid Red Deer address.",
        success: false,
      });
      return;
    }

    // Validate Terms
    if (!termsAccepted) {
      setStatus({
        loading: false,
        error: "You must accept the Terms & Conditions.",
        success: false,
      });
      return;
    }

    // Validate docs
    if (
      formData.type_of_user === "senior_citizen" &&
      !formData.id_document_url
    ) {
      setStatus({
        loading: false,
        error: "Please upload a valid Senior ID.",
        success: false,
      });
      return;
    }

    if (formData.type_of_user === "pwd" && !formData.pwd_document_url) {
      setStatus({
        loading: false,
        error: "Please upload a PWD document.",
        success: false,
      });
      return;
    }

    const payload = {
      ...formData,
      terms_accepted: termsAccepted,
      id_document_url: formData.id_document_url || null,
      pwd_document_url: formData.pwd_document_url || null,
    };

    try {
      const response = await fetch(REGISTER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setStatus({ loading: false, error: result.error, success: false });
        return;
      }

      setStatus({ loading: false, error: null, success: true });
      onSuccess({ email: formData.email });
    } catch (err) {
      console.error(err);
      setStatus({
        loading: false,
        error: "Network error occurred.",
        success: false,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl bg-white shadow-xl hover:shadow-2xl border border-gray-300 rounded-3xl p-8 md:p-10">
        <header className="text-center mb-10 pb-4 border-b border-sky-100">
          <h1 className="text-4xl font-black text-sky-700 mb-1 tracking-tight">
            Create Account
          </h1>
          <p className="text-gray-500 font-medium text-lg">
            Securely register your new user profile.
          </p>
        </header>

        {/* Status Messages */}
        {status.success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 text-green-700 rounded-xl text-center font-semibold animate-pulse-once">
            ✅ Registration Successful!
          </div>
        )}
        {status.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl text-center font-semibold">
            ❌ Error: {status.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 1. Personal Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <InputField
              label="First Name"
              id="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              placeholder="John"
            />
            <InputField
              label="Last Name"
              id="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              placeholder="Doe"
            />
          </div>

          {/* 2. User Type Selection */}
          <div className="flex flex-col">
            <label
              htmlFor="type_of_user"
              className="text-sm font-semibold text-gray-600 mb-1 tracking-wide"
            >
              User Role <span className="text-red-500">*</span>
            </label>
            <select
              id="type_of_user"
              name="type_of_user"
              value={formData.type_of_user}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-4 focus:ring-sky-200 focus:border-sky-500 shadow-inner transition duration-200 ease-in-out text-gray-800"
            >
              <option value="senior_citizen">Senior Citizen</option>
              <option value="pwd">PWD (Person with Disability)</option>
            </select>
          </div>

          {/* 3. Credentials */}
          <div className="space-y-6 pt-4">
            <InputField
              label="Email Address"
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="john.doe@example.com"
            />
            <div className="grid md:grid-cols-2 gap-6">
              <InputField
                label="Password"
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Min 8 characters"
              />
              <InputField
                label="Confirm Password"
                id="confirm_password"
                type="password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
                placeholder="Re-enter your password"
              />
            </div>
          </div>

          {/* Upload Section – Show only for the selected user type */}
          {formData.type_of_user === "senior_citizen" && (
            <DocumentUploadField
              label="Senior Valid ID (Date of Birth Visible)"
              description="Accepted: Government-issued ID with visible date of birth (e.g., Passport, Driver’s License, National ID)"
              id="senior_id_file"
              required
              onChange={(e) => handleFileUpload(e.target.files[0], "senior_id")}
            />
          )}

          {formData.type_of_user === "pwd" && (
            <DocumentUploadField
              label="PWD Documents"
              description="Accepted: PWD ID, medical certification, supporting disability documents."
              id="pwd_documents"
              required
              onChange={(e) =>
                handleFileUpload(e.target.files[0], "pwd_document")
              }
            />
          )}

          <hr className="my-6 border-t border-gray-200" />
          <div className="grid md:grid-cols-2 gap-6">
            <InputField
              label="Date of Birth"
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleChange}
              required
            />

            <div className="flex flex-col">
              <label
                htmlFor="gender"
                className="text-sm font-semibold text-gray-600 mb-1 tracking-wide"
              >
                Gender
              </label>

              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl bg-white shadow-inner"
                aria-label="Select your gender"
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non_binary">Non-Binary</option>
                <option value="prefer_not">Prefer Not to Say</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col mt-4">
            <label
              htmlFor="assistance_level"
              className="text-sm font-semibold text-gray-600 mb-1 tracking-wide"
            >
              Level of Assistance Required
            </label>

            <select
              id="assistance_level"
              name="assistance_level"
              value={formData.assistance_level}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl bg-white shadow-inner"
              aria-label="Select your level of assistance"
            >
              <option value="">Select...</option>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="mt-4">
            <InputField
              label="Living Situation"
              id="living_situation"
              value={formData.living_situation}
              onChange={handleChange}
              placeholder="e.g., Lives alone, with family, assisted living"
              required
            />
          </div>

          <hr className="my-6 border-t border-gray-200" />
          <p className="text-sm text-gray-600 text-center">
            Please fill in your address details below:
          </p>

          {/* 🔹 Address Autocomplete (Red Deer only) */}
          <div className="mb-2">
            <AddressAutoComplete onPlaceSelected={handlePlaceSelected} />
            {validationError && (
              <p className="text-red-500 text-sm mt-2">{validationError}</p>
            )}
          </div>

          {/* 4. Address Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <InputField
              label="Unit No."
              id="unit_no"
              type="text"
              value={formData.unit_no}
              onChange={handleChange}
              required
              placeholder="Apt, Suite, etc."
            />
            <InputField
              label="Street"
              id="street"
              type="text"
              value={formData.street}
              onChange={handleChange}
              required
              placeholder="123 Main St"
            />
            <InputField
              label="City"
              id="city"
              type="text"
              value={formData.city}
              onChange={handleChange}
              required
              placeholder="Red Deer"
            />
            <InputField
              label="Postal Code"
              id="postal_code"
              type="text"
              value={formData.postal_code}
              onChange={handleChange}
              required
              placeholder="A1B 2C3"
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="province"
              className="text-sm font-semibold text-gray-600 mb-1 tracking-wide"
            >
              Province <span className="text-red-500">*</span>
            </label>
            <select
              id="province"
              name="province"
              value={formData.province}
              onChange={handleChange}
              required
              disabled
              className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-4 focus:ring-sky-200 focus:border-sky-500 shadow-inner transition duration-200 ease-in-out text-gray-800"
            >
              <option value="Alberta">Alberta</option>
            </select>
          </div>

          <hr className="my-6 border-t border-gray-200" />
          <p className="text-sm text-gray-600 text-center">
            In Case of Emergency
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <InputField
              label="Emergency Contact Full Name"
              id="emergency_contact_name"
              value={formData.emergency_contact_name}
              onChange={handleChange}
              required
            />

            <InputField
              label="Relationship"
              id="emergency_contact_relationship"
              value={formData.emergency_contact_relationship}
              onChange={handleChange}
              required
            />
          </div>

          <InputField
            label="Emergency Contact Phone Number"
            id="emergency_contact_phone"
            type="tel"
            value={formData.emergency_contact_phone}
            onChange={handleChange}
            required
            placeholder="e.g., 587-555-1234"
          />

          <div className="flex items-center gap-3 mt-4">
            <input
              id="terms_accept"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                if (e.target.checked) setShowTerms(true);
                else setTermsAccepted(false);
              }}
              className="w-5 h-5"
              aria-required="true"
            />

            <label
              htmlFor="terms_accept"
              className="text-gray-700 font-medium cursor-pointer"
            >
              I have read and agree to the{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-sky-700 underline hover:text-sky-900"
                aria-label="Read the Terms and Conditions"
              >
                Terms & Conditions
              </button>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            aria-label={
              status.loading ? "Registering your account" : "Create My Account"
            }
            disabled={status.loading || uploading || !termsAccepted}
            className="
                            w-full py-3 mt-10
                            bg-sky-700 text-white font-extrabold text-lg
                            rounded-xl shadow-lg shadow-sky-300/50
                            hover:bg-sky-800 disabled:bg-sky-500
                            transition-all duration-300 ease-in-out
                            transform hover:scale-[1.01] hover:shadow-xl
                            focus:outline-none focus:ring-4 focus:ring-sky-900 focus:ring-opacity-70
                        "
          >
            {status.loading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Registering...
              </div>
            ) : (
              "Create My Account"
            )}
          </button>
        </form>
      </div>

      {/* ⭐ Terms & Conditions Modal */}
      <UserTerms
        open={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setShowTerms(false);
        }}
      />
    </div>
  );
};

export default RegisterUser;
