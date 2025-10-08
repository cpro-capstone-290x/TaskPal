import React, { useState } from 'react';

// Reuse the InputField component for consistency
const InputField = ({ label, id, type = 'text', value, onChange, required = false, placeholder = '' }) => (
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


const LoginProvider = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    // State for handling API status
    const [status, setStatus] = useState({
        loading: false,
        error: null,
    });

    // Function to handle changes in input fields
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Function to handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, error: null, success: false });

        const API_ENDPOINT = 'http://localhost:5000/api/auth/loginProvider'; // <-- **Update Endpoint**

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                // Handle errors like Invalid Credentials (401) or general errors
                const errorMessage = result.error || 'Login failed. Please check your email and password.';
                setStatus({ loading: false, error: errorMessage, success: false });
                return;
            }

            // Success handling: The backend should return a token or user info
            setStatus({ loading: false, error: null, success: true });
            console.log('Provider logged in successfully:', result.data);

            // Clear password field for security
            setFormData(prevData => ({
                ...prevData,
                password: '',
            }));

            // Call the success handler passed from LoginPage.jsx
            onSuccess({ 
                email: formData.email, 
                token: result.token // Assuming your API returns a JWT token
            }); 

        } catch (error) {
            console.error('Network or unexpected error:', error);
            setStatus({
                loading: false,
                error: 'Could not connect to the server. Please check your connection.',
                success: false
            });
        }
    };

    return (
        <div className="space-y-6">
            
            {/* Status Messages */}
            {status.success && (
                <div className="p-4 bg-green-50 border border-green-300 text-green-700 rounded-xl text-center font-semibold animate-pulse-once">
                    ✅ Login Successful!
                </div>
            )}
            {status.error && (
                <div className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl text-center font-semibold">
                    ❌ Error: {status.error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                
                <InputField
                    label="Email Address"
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="provider@service.com"
                />
                <InputField
                    label="Password"
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Your secure password"
                />
                
                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={status.loading}
                    className="w-full py-3 mt-6 bg-sky-600 text-white font-extrabold text-lg rounded-xl shadow-lg shadow-sky-300/50 hover:bg-sky-700 disabled:bg-sky-400 transition-all duration-300 ease-in-out transform hover:scale-[1.01] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-sky-500 focus:ring-opacity-70"
                >
                    {status.loading ? (
                        <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Logging In...
                        </div>
                    ) : (
                        'Log In to Provider Dashboard'
                    )}
                </button>
            </form>

            <div className="text-center pt-2">
                <a href="/forgot-password" className="text-sm text-gray-500 hover:text-sky-600 transition font-medium">
                    Forgot Password?
                </a>
            </div>
        </div>
    );
};

export default LoginProvider;