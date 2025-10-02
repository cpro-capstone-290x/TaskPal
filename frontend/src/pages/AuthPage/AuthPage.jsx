import React, { useState } from 'react';
import Register from './components/Register';
import OTPVerification from './components/OTPVerification';

const AuthPage = () => {
    // State to manage the step: 'register', 'otp', or 'success'
    const [currentStep, setCurrentStep] = useState('register');
    
    // State to hold user data (like email/userId) needed for the OTP step
    const [registrationData, setRegistrationData] = useState(null);

    // 1. Handler called by Register component upon successful submission
    const handleRegistrationSuccess = (data) => {
        setRegistrationData(data); // Save the email/ID
        setCurrentStep('otp');     // Switch view to OTP
    };

    // 2. Handler called by OTPVerification component upon successful verification
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
                // Pass the handler down to Register
                return <Register onSuccess={handleRegistrationSuccess} />;
            case 'otp':
                // Render OTP component, passing user data and handlers
                return (
                    <OTPVerification
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
                        <button className="mt-6 w-full py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition">
                            Proceed to Dashboard
                        </button>
                    </div>
                );
            default:
                return <Register onSuccess={handleRegistrationSuccess} />;
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