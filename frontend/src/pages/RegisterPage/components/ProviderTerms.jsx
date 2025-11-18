import React, { useRef, useState, useEffect } from "react";

const ProviderTerms = ({ open, onClose, onAgree }) => {
  const contentRef = useRef(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  useEffect(() => {
    if (open) {
      setScrolledToBottom(false);
      if (contentRef.current) {
        contentRef.current.scrollTop = 0; // Reset scroll to top when opened
      }
    }
  }, [open]);

  const handleScroll = () => {
    const el = contentRef.current;
    if (!el) return;

    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
    setScrolledToBottom(atBottom);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl max-h-[95vh] rounded-2xl shadow-xl flex flex-col">

        <div className="p-5 border-b">
          <h2 className="text-2xl font-bold text-sky-700">
            TaskPal – Provider Terms & Conditions
          </h2>
          <p className="text-sm text-gray-500">
            Please review the full eligibility rules and provider requirements.
          </p>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="px-5 py-4 overflow-y-scroll text-gray-700 leading-relaxed text-sm"
          style={{ maxHeight: "70vh" }}
        >

          {/* ===================== TERMS & CONDITIONS ===================== */}
          <h3 className="text-xl font-bold text-gray-800 mb-2">1. Eligibility Rules</h3>

          <p className="font-semibold">BR-PRV-001 — Age & Legal Status</p>
          <ul className="list-disc ml-5 mb-3">
            <li>Provider must be 18 years or older.</li>
            <li>Must be legally permitted to work in Canada.</li>
            <li>During registration, providers must confirm Date of Birth and Legal Work Status (Citizen / PR / Work Permit).</li>
          </ul>

          <p className="font-semibold">BR-PRV-002 — Service Area</p>
          <ul className="list-disc ml-5 mb-3">
            <li>Provider must be able to deliver services within Red Deer, Alberta.</li>
            <li>Must select the neighbourhood(s)/zones they serve.</li>
          </ul>

          <p className="font-semibold">BR-PRV-003 — Professional & Ethical Standards</p>
          <ul className="list-disc ml-5 mb-6">
            <li>Respectful behaviour; no discrimination or harassment.</li>
            <li>Safe interactions with seniors/PWD; no abuse, neglect, exploitation.</li>
            <li>Confidentiality of client information.</li>
          </ul>

          {/* SECTION 2 */}
          <h3 className="text-xl font-bold text-gray-800 mb-2">2. Required Information & Documentation</h3>

          <p className="font-semibold">BR-PRV-010 — Legal Identity</p>
          <ul className="list-disc ml-5 mb-3">
            <li>Full legal name (first, middle, last).</li>
            <li>Government-issued ID (type, number, expiry).</li>
            <li>Upload clear image/scan of ID.</li>
          </ul>

          <p className="font-semibold">BR-PRV-011 — Contact Information</p>
          <ul className="list-disc ml-5 mb-3">
            <li>Valid mobile number.</li>
            <li>Unique email address (verified via OTP).</li>
          </ul>

          <p className="font-semibold">BR-PRV-020 — Provider Type Selection</p>
          <ul className="list-disc ml-5 mb-3">
            <li>Individual Provider</li>
            <li>Business / Agency</li>
          </ul>

          <p className="font-semibold">BR-PRV-021 — Business Providers (Extra Requirements)</p>
          <ul className="list-disc ml-5 mb-3">
            <li>Business legal name & operating name.</li>
            <li>Business registration/license number.</li>
            <li>Business address.</li>
            <li>Upload business license documentation.</li>
          </ul>

          <p className="font-semibold">BR-PRV-030 — Service Categories</p>
          <ul className="list-disc ml-5 mb-3">
            <li>Providers must select at least one category.</li>
            <li>Provide short description, experience years, certifications.</li>
          </ul>

          <p className="font-semibold">BR-PRV-031 — Skills & Experience Summary</p>
          <ul className="list-disc ml-5 mb-4">
            <li>Background overview.</li>
            <li>Experience working with seniors/PWD.</li>
            <li>Languages spoken.</li>
          </ul>

          {/* SECTION 2.4 */}
          <p className="font-semibold">BR-PRV-040 — Background Check</p>
          <ul className="list-disc ml-5 mb-3">
            <li>Upload recent criminal record check if available.</li>
            <li>If not available, must obtain one before approval OR be limited to low-risk services.</li>
          </ul>

          <p className="font-semibold">BR-PRV-041 — Insurance (Higher-Risk Services)</p>
          <ul className="list-disc ml-5 mb-4">
            <li>Declare whether they hold liability insurance.</li>
            <li>Upload proof of insurance.</li>
            <li>Provide policy number & expiry date.</li>
          </ul>

          <p className="font-semibold">BR-PRV-050 — Accessibility Awareness</p>
          <ul className="list-disc ml-5 mb-4">
            <li>Provider must communicate clearly, respectfully, and patiently.</li>
            <li>Acknowledge and respect the physical/cognitive limits of seniors/PWD.</li>
          </ul>

          <p className="font-semibold">BR-PRV-060 — Banking / Payout Details</p>
          <ul className="list-disc ml-5 mb-10">
            <li>Provider must complete Stripe payout onboarding before receiving bookings.</li>
            <li>Must submit the required payout information.</li>
          </ul>

          {/* END OF TERMS */}
          <p className="text-center text-gray-500 italic pb-10">
            Scroll to the bottom to enable the "I Agree" button.
          </p>
        </div>

        {/* BUTTONS */}
        <div className="p-5 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Cancel
          </button>

          <button
            onClick={onAgree}
            disabled={!scrolledToBottom}
            className={`px-5 py-2 rounded-xl text-white font-semibold ${
              scrolledToBottom
                ? "bg-sky-600 hover:bg-sky-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderTerms;
