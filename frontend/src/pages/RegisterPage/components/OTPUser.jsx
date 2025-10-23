import React, { useState } from 'react';

const OTPUser = ({ userData, onSuccess, onBack }) => {
    // Use the email passed from the registration step
    const email = userData?.email; 
    
    // NOTE: Use your actual API endpoint for OTP verification
    // const API_ENDPOINT = 'http://localhost:5000/api/auth/verifyUser'; 
    const API_ENDPOINT = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/auth/verifyUser`
        : "https://taskpal-14oy.onrender.com/api/auth/verifyUser";

    // State for the 6 individual inputs (easier for focus/backspace logic)
    const [otp, setOtp] = useState(Array(6).fill('')); 

    const [status, setStatus] = useState({
        loading: false,
        error: null,
        success: false,
        message: `A 6-digit OTP has been sent to ${email}.`,
    });

    // Helper array for mapping inputs
    const otpFields = Array(6).fill(null); 

    const handleOtpChange = (e, index) => {
        const value = e.target.value.slice(-1); // Only take the last character typed
        
        // Create a new OTP array to update state immutably
        const newOtp = [...otp];
        newOtp[index] = value;
        
        setOtp(newOtp);

        // Auto-focus next input field
        if (value && index < otpFields.length - 1) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            // Move focus to previous input on backspace if current field is empty
            document.getElementById(`otp-${index - 1}`).focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const otpCode = otp.join(''); // Join the array into a 6-digit string

        if (otpCode.length !== 6) {
            setStatus({ loading: false, error: 'Please enter the complete 6-digit code.', success: false });
            return;
        }

        setStatus({ loading: true, error: null, success: false, message: 'Verifying OTP...' });

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email, otp: otpCode, role: 'user' }), 
            });

            const result = await response.json();

            if (!response.ok) {
                const errorMessage = result.error || 'OTP verification failed. Please check your code.';
                setStatus({ loading: false, error: errorMessage, success: false });
                return;
            }

            // SUCCESS: Call the parent prop function to notify the AuthPage
            setStatus({ loading: false, error: null, success: true, message: '✅ OTP verified successfully! Redirecting...' });
            
            // Wait a moment for the user to see the success message, then transition
            setTimeout(() => {
                onSuccess(result.data); // Pass any useful data up to the parent
            }, 500);


        } catch (error) {
            console.error('Network or unexpected error:', error);
            setStatus({
                loading: false,
                error: 'Could not connect to the server. Please check your connection.',
                success: false
            });
        }
    };

    // Placeholder for Resend OTP logic
    const handleResendOtp = async () => {
        console.log('Resending OTP to:', email);
        // Implement your API call to trigger a new OTP here
        setStatus({ loading: true, error: null, success: false, message: 'Requesting new OTP...' });
        
        // MOCK resend success
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStatus({ 
            loading: false, 
            error: null, 
            success: false, 
            message: 'A new OTP has been sent. Check your inbox!' 
        });
    };

    // Determine the main message state for the blue box
    let displayMessage = status.message;
    if (status.loading) {
        displayMessage = 'Please wait...';
    }

    return (
        <div className="w-full max-w-xl bg-white shadow-2xl hover:shadow-3xl border border-gray-100 rounded-3xl p-8 md:p-10 transition-all duration-500">
            <header className="text-center mb-10 pb-4 border-b border-green-100">
                <h1 className="text-4xl font-black text-green-700 mb-1 tracking-tight">
                    Verify Your Account
                </h1>
                <p className="text-gray-500 font-medium text-lg">
                    A 6-digit verification code has been sent to <span className="font-semibold text-sky-600">{email || 'your email'}</span>.
                </p>
                <button 
                    onClick={onBack} 
                    className="text-sky-500 hover:text-sky-700 text-sm mt-2 transition duration-200 underline"
                    disabled={status.loading || status.success}
                >
                    &larr; Go back and check information
                </button>
            </header>
            
            {/* 🔹 Status Messages */}
            {status.success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-300 text-green-700 rounded-xl text-center font-semibold animate-pulse-once">
                    {displayMessage}
                </div>
            )}
            {status.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl text-center font-semibold">
                    ❌ Error: {status.error}
                </div>
            )}
            {!status.success && !status.error && displayMessage && (
                 <div className="mb-6 p-4 bg-blue-50 border border-blue-300 text-blue-700 rounded-xl text-center font-semibold">
                    🔔 {displayMessage}
                </div>
            )}


            <form onSubmit={handleVerify} className="space-y-6">
                <div className="flex justify-center space-x-3">
                    {otpFields.map((_, index) => (
                        <input
                            key={index}
                            id={`otp-${index}`}
                            type="tel"
                            maxLength="1"
                            inputMode="numeric"
                            autoComplete={index === 0 ? "one-time-code" : "off"}
                            // Value is read from the state array
                            value={otp[index] || ''} 
                            onChange={(e) => handleOtpChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className="w-10 h-14 md:w-12 md:h-16 text-center text-2xl md:text-3xl font-bold border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-green-500 transition duration-150 shadow-md bg-gray-50 text-black"
                            required
                            disabled={status.loading || status.success}
                        />
                    ))}
                </div>

                <button
                    type="submit"
                    disabled={status.loading || otp.join('').length < 6 || status.success}
                    className="w-full py-3 mt-10 bg-green-600 text-white font-extrabold text-lg rounded-xl shadow-lg shadow-green-300/50 hover:bg-green-700 disabled:bg-gray-400 transition-all duration-300 ease-in-out transform hover:scale-[1.01] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-70"
                >
                    {status.loading ? (
                        <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Verifying...
                        </div>
                    ) : (
                        'Verify Code'
                    )}
                </button>
            </form>
            <div className="text-center mt-6">
                Didn't receive the code?{' '}
                <button 
                    onClick={handleResendOtp} 
                    className="text-sm text-sky-600 font-semibold hover:text-sky-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={status.loading || status.success}
                >
                    Resend Code
                </button>
            </div>
        </div>
    );
};

export default OTPUser;