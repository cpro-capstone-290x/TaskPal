import React from "react";

const DocumentUploadField = ({
  label,
  description,
  id,
  required = false,
  onChange,
}) => {
  return (
    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
      <label
        htmlFor={id}
        className="block text-lg font-semibold text-gray-800 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {description && (
        <p className="text-sm text-gray-600 mb-3">
          {description}
        </p>
      )}

      <input
        id={id}
        name={id}
        type="file"
        onChange={onChange}
        className="
          block w-full text-gray-700 file:mr-4 file:py-2 file:px-4 
          file:rounded-lg file:border-0 file:text-sm file:font-semibold 
          file:bg-sky-800 file:text-white hover:file:bg-sky-900 
          cursor-pointer bg-white border border-gray-300 rounded-xl p-2
        "
      />
    </div>
  );
};

export default DocumentUploadField;
