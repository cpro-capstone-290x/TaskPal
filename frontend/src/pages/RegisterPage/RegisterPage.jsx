import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import RegisterUser from './components/RegisterUser';
import RegisterProvider from './components/RegisterProvider';
import OTPUser from './components/OTPUser';
import OTPProvider from './components/OTPProvider';

const AuthPage = () => {
    const [searchParams] = useSearchParams();
    const urlType = searchParams.get('type'); // Get the 'type' value from the URL (?type=...)

    // State to manage the step: 'register', 'otp', or 'success'
    // Default to 'register' since the user should only land here after selecting a type
    const [currentStep, setCurrentStep] = useState('register'); 
    
    // State to distinguish between user and provider registration
    // Initialize based on the URL parameter, default to 'user' if not specified
    const [registrationType, setRegistrationType] = useState(urlType === 'provider' ? 'provider' : 'user'); 

    // State to hold user data (like email/userId) needed for the OTP step
    const [registrationData, setRegistrationData] = useState(null);

    // If a user navigates directly to /auth without a parameter, 
    // you might want to redirect them to the home page to choose.
    // For now, we'll default them to the 'user' registration form.
    
    // Handlers remain the same:
    
    // 1. Handler called by Register component upon successful submission
    const handleRegistrationSuccess = (data) => {
        setRegistrationData(data); // Save the email/ID
        if (registrationType === 'provider') {
            setCurrentStep('provider-otp'); // Switch view to OTPProvider
        } else {
            setCurrentStep('user-otp');       // Switch view to OTPUser
        }     // Switch view to OTP
    };

    // 2. Handler called by OTPUser component upon successful verification
    const handleOTPVerificationSuccess = () => {
        setCurrentStep('success'); // Switch view to final success screen
    };

    // 3. Handler to go back from OTP step to Register step
    const handleBackToRegister = () => {
        setCurrentStep('register');
        setRegistrationData(null);
    };

    const renderContent = () => {
        switch (currentStep) {
            case 'register':
                // Decide which form to show based on the registrationType state
                const RegistrationComponent = registrationType === 'provider' ? RegisterProvider : RegisterUser;
                
                // Optional: A link back to the home page for re-selection
                return (
                    <div>
                        <Link 
                            to="/" 
                            className="text-sm text-sky-800 hover:text-sky-900 mb-4 inline-block underline"
                        >
                            ← Back to Selection
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
                    <div className="w-full max-w-xl bg-white shadow-2xl rounded-3xl p-10 text-center">
                        <h1 className="text-4xl font-black text-green-600 mb-4">🎉 Account Created!</h1>
                        <p className="text-gray-700 text-lg">Your email has been verified, and you are ready to use the application.</p>
                        <button 
                        onClick ={() => window.location.href = '/login'}
                        className="mt-6 w-full py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition">
                            Proceed to Login
                        </button>
                    </div>
                );

            default:
                // This case should be rare, but we default to user registration
                return <RegisterUser onSuccess={handleRegistrationSuccess} />;
        }
    };

    return (
        <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
            <section className="w-full max-w-2xl">
                {renderContent()}
            </section>
        </main>
    );
};

export default AuthPage;