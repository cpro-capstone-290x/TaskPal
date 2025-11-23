import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import RegisterUser from './components/RegisterUser';
import RegisterProvider from './components/RegisterProvider';
import OTPUser from './components/OTPUser';
import OTPProvider from './components/OTPProvider';

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate(); // Hook for smooth navigation
  const urlType = searchParams.get('type');

  const [currentStep, setCurrentStep] = useState('register');
  
  // Default to 'user' if type is missing or invalid
  const [registrationType, setRegistrationType] = useState(
    urlType === 'provider' ? 'provider' : 'user'
  );

  const [registrationData, setRegistrationData] = useState(null);

  // 1. Success from Registration Form
  const handleRegistrationSuccess = (data) => {
    setRegistrationData(data);
    if (registrationType === 'provider') {
      setCurrentStep('provider-otp');
    } else {
      setCurrentStep('user-otp');
    }
  };

  // 2. Success from OTP Form
  const handleOTPVerificationSuccess = () => {
    setCurrentStep('success');
  };

  // 3. Back to Register
  const handleBackToRegister = () => {
    setCurrentStep('register');
    setRegistrationData(null);
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'register':
        const RegistrationComponent = registrationType === 'provider' ? RegisterProvider : RegisterUser;
        
        return (
          <div>
            <Link 
              to="/" 
              className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-sky-700 mb-6 transition-colors"
            >
              <span className="mr-1">←</span> Back to Selection
            </Link>
            <RegistrationComponent onSuccess={handleRegistrationSuccess} />
          </div>
        );

      case 'provider-otp':
        return (
          <OTPProvider
            userData={registrationData}
            onSuccess={handleOTPVerificationSuccess}
            onBack={handleBackToRegister}
          />
        );

      case 'user-otp':
        return (
          <OTPUser
            userData={registrationData}
            onSuccess={handleOTPVerificationSuccess}
            onBack={handleBackToRegister}
          />
        );

      case 'success':
        return (
          <div className="w-full max-w-xl bg-white shadow-2xl rounded-3xl p-10 text-center border border-slate-100">
            {/* Animated Checkmark Icon could go here */}
            <div className="mb-6 flex justify-center">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">🎉</span>
              </div>
            </div>
            
            {/* Darkened Green for Contrast (Accessibility) */}
            <h1 className="text-3xl font-black text-green-700 mb-4">Account Created!</h1>
            
            <p className="text-slate-600 text-lg mb-8">
              Your email has been verified, and you are ready to use the application.
            </p>
            
            <button 
              onClick={() => navigate('/login')} // ✅ SPA Navigation (No reload)
              className="w-full py-4 bg-sky-700 text-white font-bold text-lg rounded-xl hover:bg-sky-800 transition shadow-lg shadow-sky-200"
            >
              Proceed to Login
            </button>
          </div>
        );

      default:
        return <RegisterUser onSuccess={handleRegistrationSuccess} />;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      {/* Added transition wrapper for smoother step changes */}
      <section className="w-full max-w-2xl transition-all duration-300 ease-in-out">
        {renderContent()}
      </section>
    </main>
  );
};

export default AuthPage;