import React, { useState, useRef, useEffect } from "react";

const UserTerms = ({ open, onClose, onAccept }) => {
  const [canAccept, setCanAccept] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setCanAccept(false); // Reset when modal closes
      return;
    }

    const div = scrollRef.current;

    const handleScroll = () => {
      const bottom =
        div.scrollTop + div.clientHeight >= div.scrollHeight - 5;

      if (bottom) setCanAccept(true);
    };

    div.addEventListener("scroll", handleScroll);
    return () => div.removeEventListener("scroll", handleScroll);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6 relative animate-fadeIn">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-sky-700 mb-4 text-center">
          Client Verification Terms & Conditions
        </h2>

        {/* Scrollable Terms */}
        <div
          ref={scrollRef}
          className="h-72 overflow-y-auto border p-4 rounded-lg bg-gray-50 shadow-inner text-gray-700 text-sm space-y-3"
        >
          <p>
            <strong>1. Purpose of Collecting Information</strong><br />
            Your personal information is collected solely for providing safe, appropriate, and accessible services through the TaskPal platform.
          </p>

          <p>
            <strong>2. Information You Provide</strong><br />
            You agree that all information you submit—including personal details, emergency contact information, and any optional accessibility needs—is true and accurate to the best of your knowledge.
          </p>

          <p>
            <strong>3. Misrepresentation & Abuse of Privilege</strong><br />
            Any false information, misleading statements, or misuse of Senior or PWD privileges may result in immediate account suspension or permanent deactivation <strong>without prior notice</strong>.
          </p>

          <p>
            <strong>4. Document Uploads (If You Choose to Provide Them)</strong><br />
            Documents are used solely to better match services to your needs. Uploading documents does not constitute a verification.
          </p>

          <p>
            <strong>5. Data Protection</strong><br />
            Your information is securely stored, encrypted, and accessible only to authorized staff.
          </p>

          <p>
            <strong>6. Limited Information Shared With Providers</strong><br />
            Providers only receive practical information necessary for service delivery. They will NOT see uploaded documents.
          </p>

          <p>
            <strong>7. Your Rights Under PIPEDA</strong><br />
            You may request access to your data, ask for corrections, or withdraw consent at any time.
          </p>

          <p>
            <strong>8. Retention & Deletion</strong><br />
            Data is stored only as long as necessary. You may request permanent deletion anytime.
          </p>

          <p>
            <strong>9. Consent</strong><br />
            By clicking “I Agree,” you confirm that you understand these terms and consent to the collection and use of your information.
          </p>
        </div>

        {/* Accept Button */}
        <button
          disabled={!canAccept}
          onClick={onAccept}
          className={`w-full mt-6 py-3 font-bold rounded-xl shadow transition 
            ${canAccept 
                ? "bg-sky-600 text-white hover:bg-sky-700 cursor-pointer" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
        >
          {canAccept ? "I Agree" : "Scroll to Bottom to Enable"}
        </button>
      </div>
    </div>
  );
};

export default UserTerms;
