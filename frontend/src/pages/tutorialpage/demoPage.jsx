import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// 🔹 Role-level fallback videos
// NOTE: For best accessibility, all videos should ideally have transcripts or captions.
const roleVideos = {
  client: "/assets/IMG_4949.mov",
  provider: "/assets/demo-provider.mp4",
  admin: "/assets/demo-admin.mp4",
};

// 🔹 Client step-specific videos (index 0,1,2 = register, book, execute)
const clientStepVideos = [
  "https://itbxtmnsqomkkiw6.public.blob.vercel-storage.com/Videos/Client/UserRegistration.mp4",
  "https://itbxtmnsqomkkiw6.public.blob.vercel-storage.com/Videos/Client/Booking%20Step.mp4",
  "https://itbxtmnsqomkkiw6.public.blob.vercel-storage.com/Videos/Client/Execution%20of%20Service.mp4",
];

// 🔹 Provider step-specific videos
const providerStepVideos = [
  "https://itbxtmnsqomkkiw6.public.blob.vercel-storage.com/Videos/Provider/Provider%20Registration.mp4",
  "https://itbxtmnsqomkkiw6.public.blob.vercel-storage.com/Videos/Provider/ProviderBooking.mp4",
  "https://itbxtmnsqomkkiw6.public.blob.vercel-storage.com/Videos/Provider/ProviderPayout.mp4",
];

// 🔹 Admin step-specific videos
const adminStepVideos = [
  "https://itbxtmnsqomkkiw6.public.blob.vercel-storage.com/Videos/Admin/ProviderApproval.mp4",
  "https://itbxtmnsqomkkiw6.public.blob.vercel-storage.com/Videos/Admin/AdminMonitoring.mp4",
  "https://itbxtmnsqomkkiw6.public.blob.vercel-storage.com/Videos/Admin/AdminMaintenance.mp4",
];

const roles = {
  client: {
    label: "Client",
    color: "bg-sky-700",
    hoverColor: "hover:bg-sky-800",
    focusRing: "focus:ring-sky-500",
    flow: ["How to register", "How to book", "Service execution"],
    steps: [
      {
        title: "Create your account",
        body: "Sign up with your email, fill in your basic details, and add your emergency contact so we can keep you safe.",
      },
      {
        title: "Book your TaskPal",
        body: "Pick a category, describe your task, choose a date, and select a verified TaskPal based on reviews and price per job.",
      },
      {
        title: "Service day & support",
        body: "Your TaskPal arrives, completes the job, and you can chat, leave a review, and get support if anything doesn’t go as planned.",
      },
    ],
  },
  provider: {
    label: "Provider",
    color: "bg-emerald-600",
    hoverColor: "hover:bg-emerald-700",
    focusRing: "focus:ring-emerald-500",
    flow: ["Set up profile", "Handle bookings", "Get paid"],
    steps: [
      {
        title: "Create your service profile",
        body: "List the services you offer, set your price per job, and upload your ID and insurance.",
      },
      {
        title: "Manage your bookings",
        body: "Receive booking requests from verified users in Red Deer, accept or decline, and chat about details.",
      },
      {
        title: "Complete jobs & get paid",
        body: "Mark tasks as complete, receive payouts, and build your reputation with reviews.",
      },
    ],
  },
  admin: {
    label: "Admin",
    color: "bg-indigo-600",
    hoverColor: "hover:bg-indigo-700",
    focusRing: "focus:ring-indigo-500",
    flow: ["Review providers", "Monitor activity", "Notices for All Users"],
    steps: [
      {
        title: "Review provider applications",
        body: "Check IDs, background checks, and documents before approving TaskPals on the platform.",
      },
      {
        title: "Monitor bookings & safety",
        body: "See active jobs, resolve issues, and keep the community safe and respectful.",
      },
      {
        title: "Notify all users for an update",
        body: "Send announcements about new features, policy changes, or safety alerts to all clients and providers.",
      },
    ],
  },
};

const DemoPage = () => {
  const [currentRole, setCurrentRole] = useState("client");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const navigate = useNavigate();

  const roleData = roles[currentRole];
  const currentStep = roleData.steps[currentStepIndex];

  const handleChangeRole = (roleKey) => {
    setCurrentRole(roleKey);
    setCurrentStepIndex(0); // reset step when switching role
  };

  const handleNextStep = () => {
    setCurrentStepIndex((prev) =>
      prev + 1 < roleData.steps.length ? prev + 1 : 0
    );
  };

  const handleGetStarted = () => {
    navigate("/register");
  };

  // 🔹 Decide which video to show:
  let currentVideoSrc = "/assets/demo-client.mp4"; // Default fallback

  if (currentRole === "client") {
    currentVideoSrc =
      clientStepVideos[currentStepIndex] || roleVideos.client;
  } else if (currentRole === "provider") {
    currentVideoSrc =
      providerStepVideos[currentStepIndex] || roleVideos.provider;
  } else if (currentRole === "admin") {
    currentVideoSrc =
      adminStepVideos[currentStepIndex] || roleVideos.admin;
  }

  // Determine the descriptive text for the video's aria-label
  const videoDescription = `${roleData.label} Demo - Step ${
    currentStepIndex + 1
  }: ${currentStep.title}`;

  return (
    // Use a more accessible background color for the container
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10" id="main-content">
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-xl border border-gray-200 p-6 md:p-10 flex flex-col lg:flex-row gap-10">
        {/* Left side: explanation & steps */}
        <div className="flex-1 min-w-0 space-y-8">
          <header>
            <p className="text-xs font-semibold tracking-[0.2em] text-sky-700 uppercase mb-2">
              Demo Mode
            </p>
            {/* The main heading is clear and easy to read */}
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-2">
              See how TaskPal works <span className="text-sky-700">without</span>{" "}
              creating an account.
            </h1>
            <p className="text-gray-600 max-w-xl">
              Choose a perspective below to preview the experience. No real
              data, no sign-up — just a quick walkthrough of the main steps.
            </p>
          </header>

          {/* Role selector */}
          <section aria-label="Select User Role View">
            <h2 className="sr-only">Select a user role view</h2>
            <div className="flex gap-2">
              {Object.entries(roles).map(([key, value]) => {
                const isActive = key === currentRole;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleChangeRole(key)}
                    // Added focus ring for better keyboard navigation visibility
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ring-offset-2 focus:outline-none focus:ring-2 ${
                      isActive
                        ? `${value.color} text-white border-transparent shadow-md ${value.focusRing}`
                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 focus:ring-slate-400"
                    }`}
                    // Indicate the selected button using aria-pressed
                    aria-pressed={isActive}
                  >
                    {value.label} view
                  </button>
                );
              })}
            </div>
          </section>

          {/* Generic flow bar */}
          {roleData.flow && (
            <section aria-label={`${roleData.label} Journey Steps`} className="mt-4 bg-slate-100 rounded-2xl p-3">
              <p className="text-[11px] text-slate-500 font-medium mb-2 uppercase tracking-wide">
                {roleData.label} journey overview
              </p>
              <div className="flex items-center justify-between gap-2">
                {roleData.flow.map((label, index) => {
                  const isActive = index === currentStepIndex;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setCurrentStepIndex(index)}
                      // Added focus ring and better contrast for hover/active states
                      className={`flex-1 text-[11px] md:text-xs font-semibold px-2 py-2 rounded-full border transition-all ring-offset-2 focus:outline-none focus:ring-2 ${
                        isActive
                          ? `${roleData.color} text-white border-transparent shadow-sm ${roleData.focusRing} ${roleData.hoverColor}`
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 focus:ring-slate-400"
                      }`}
                      // Indicate current step with aria-current="step"
                      aria-current={isActive ? "step" : undefined}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Stepper with Live Region */}
          <section aria-live="polite" aria-atomic="true" className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Step {currentStepIndex + 1} of {roleData.steps.length}
                </p>
                {/* Use h2 to maintain heading hierarchy */}
                <h2 className="text-xl font-bold text-slate-900">
                  {currentStep.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="text-sm font-semibold text-sky-700 hover:text-sky-900 underline ring-offset-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                aria-label={
                  currentStepIndex + 1 < roleData.steps.length
                    ? `Go to next step: ${
                        roleData.steps[currentStepIndex + 1].title
                      }`
                    : `Restart demo from step 1: ${roleData.steps[0].title}`
                }
              >
                {currentStepIndex + 1 < roleData.steps.length
                  ? "Next step"
                  : "Restart demo"}
              </button>
            </div>

            {/* Progress bar with ARIA role for assistive tech */}
            <div
              role="progressbar"
              aria-valuenow={currentStepIndex + 1}
              aria-valuemin={1}
              aria-valuemax={roleData.steps.length}
              aria-valuetext={`Step ${currentStepIndex + 1} of ${
                roleData.steps.length
              }: ${currentStep.title}`}
              className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-sky-600 transition-all duration-300"
                style={{
                  width: `${
                    ((currentStepIndex + 1) / roleData.steps.length) * 100
                  }%`,
                }}
              />
            </div>

            <p className="text-gray-700 text-sm md:text-base">
              {currentStep.body}
            </p>
          </section>

          {/* CTA */}
          <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-4">
            <button
              type="button"
              onClick={handleGetStarted}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-sky-700 text-white font-semibold text-base shadow-md hover:bg-sky-800 transition-all ring-offset-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              I’m ready — take me to the real app
            </button>
            <p className="text-xs text-gray-500 max-w-sm">
              You won’t break anything in demo mode. When you’re comfortable,
              you can create a real account and start booking or offering tasks.
            </p>
          </div>
        </div>

        {/* Right side: video mockup */}
        <div className="w-full lg:w-[520px] flex justify-center" role="group" aria-label="TaskPal Demo Video Player">
          <figure className="relative w-full bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 p-4">
            {/* Laptop top bar - Decorative but informative */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <p className="text-[11px] text-slate-300">
                {roleData.label} demo screen
              </p>
              <span className="text-[10px] text-slate-500" aria-hidden="true">TaskPal</span>
            </div>

            {/* Screen area – using figure for semantic media grouping */}
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black">
              {/* Added aria-label for screen readers to describe the content */}
              <video
                key={currentVideoSrc} // ensures video reloads when src changes
                src={currentVideoSrc}
                controls
                className="w-full h-full max-h-[360px] md:max-h-[420px] object-cover"
                aria-label={videoDescription} // Descriptive label for the video
              >
                {/* Fallback text is good practice for older browsers */}
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="mt-3 h-1.5 bg-slate-800 rounded-b-3xl mx-12" aria-hidden="true" />
            
            {/* figcaption for the video provides context */}
            <figcaption className="mt-3 text-[11px] text-slate-400 text-center">
              This is a demo video preview for **{roleData.label}** journey: **{currentStep.title}**. In the real app, you’ll interact
              with live data and real bookings. (For the best experience, please ensure your device has a transcript or is providing captions.)
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;