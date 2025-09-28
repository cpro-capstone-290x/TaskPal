import React, { useState } from 'react';

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

const Register = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        type_of_user: 'senior_citizen', // default value
        email: '',
        password: '',
        confirm_password: '',
    });

    // State for handling API status
    const [status, setStatus] = useState({
        loading: false,
        error: null,
        success: false,
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

        // Basic client-side validation for mandatory fields
        const requiredFields = ['first_name', 'last_name', 'email', 'password', 'confirm_password', 'type_of_user'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            setStatus({
                loading: false,
                error: `Please fill out all required fields: ${missingFields.join(', ')}`,
                success: false
            });
            return;
        }
        
        if (formData.password !== formData.confirm_password) {
            setStatus({
                loading: false,
                error: "Password and Confirm Password must match.",
                success: false
            });
            return;
        }


        const { confirm_password, ...restFormData } = formData;
        
        // Empty fields for now because backend expects them, since we have not made the address page yet
        const submissionData = {
            ...restFormData,
            unit_no: '',
            street: '',
            city: '',
            province: '',
            postal_code: '',
        };

        const API_ENDPOINT = 'http://localhost:5000/api/users';

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData),
            });

            const result = await response.json();

            if (!response.ok) {
                // Handle the specific 'Email already exists' error (400) or general errors (500)
                const errorMessage = result.error || 'Registration failed due to an unknown error.';
                setStatus({ loading: false, error: errorMessage, success: false });
                return;
            }

            // Success handling
            setStatus({ loading: false, error: null, success: true });
            console.log('User registered successfully:', result.data);

            // Clear form (keeping default user type)
            setFormData({
                first_name: '', last_name: '', type_of_user: 'senior_citizen', email: '', password: '', confirm_password: '',
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
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-2xl bg-white shadow-2xl hover:shadow-3xl border border-gray-100 rounded-3xl p-8 md:p-10 transition-all duration-500">
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
                        ✅ Registration Successful! Please proceed to add your address details.
                    </div>
                )}
                {status.error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl text-center font-semibold">
                        ❌ Error: {status.error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    
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
                        <label htmlFor="type_of_user" className="text-sm font-semibold text-gray-600 mb-1 tracking-wide">
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

                    {/* 3. Credentials (Email, Password, Confirm Password) */}
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
                                className=""
                                required
                                placeholder="Re-enter your password"
                            />
                        </div>
                    </div>
                    
                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={status.loading}
                        className="w-full py-3 mt-10 bg-sky-600 text-white font-extrabold text-lg rounded-xl shadow-lg shadow-sky-300/50 hover:bg-sky-700 disabled:bg-sky-400 transition-all duration-300 ease-in-out transform hover:scale-[1.01] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-sky-500 focus:ring-opacity-70"
                    >
                        {status.loading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Registering...
                            </div>
                        ) : (
                            'Create My Account'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Register;
