import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import LoginUser from './components/LoginUser';
import LoginProvider from './components/LoginProvider';

// Assuming you'll have a main dashboard route after login, 
// or you can pass an onSuccess prop to redirect in the future.
// For now, we'll just show a success message.

const LoginPage = () => {
    const [searchParams] = useSearchParams();
    // Get the 'type' value from the URL (e.g., /login?type=provider)
    const urlType = searchParams.get('type'); 

    // State to distinguish between user and provider login
    // Initialize based on the URL parameter, default to 'user' if not specified
    const loginType = urlType === 'provider' ? 'provider' : 'user'; 

    // Handler called upon successful login (replace with actual redirect later)
    const handleLoginSuccess = (data) => {
        // In a real application, you would save the JWT token here
        // and redirect the user to the main application dashboard.
        console.log(`Login Successful for ${loginType}:`, data);
        alert(`Login Successful! Redirecting to dashboard (User: ${data.email})`);
        
        // For production: navigate('/dashboard');
        
    };

    const renderContent = () => {
        // Decide which login form to show based on the loginType
        const LoginComponent = loginType === 'provider' ? LoginProvider : LoginUser;
        const pageTitle = loginType === 'provider' ? 'Provider Login' : 'User Login';
        const pageSubtitle = loginType === 'provider' 
            ? "Access your provider dashboard." 
            : "Welcome back to your account.";

        return (
            <div className="w-full max-w-xl bg-white shadow-2xl hover:shadow-3xl border border-gray-100 rounded-3xl p-8 md:p-10 transition-all duration-500">
                <header className="text-center mb-10 pb-4 border-b border-sky-100">
                    <h1 className="text-4xl font-black text-sky-700 mb-1 tracking-tight">
                        {pageTitle}
                    </h1>
                    <p className="text-gray-500 font-medium text-lg">
                        {pageSubtitle}
                    </p>
                </header>
                
                {/* Optional: A link back to the main selection page or the alternative login type */}
                <div className="mb-4 text-center">
                    <Link 
                        to={loginType === 'provider' ? '/login?type=user' : '/login?type=provider'} 
                        className="text-sm text-sky-800 hover:text-sky-900 mb-4 inline-block font-medium underline"
                    >
                        {loginType === 'provider' 
                            ? '→ Log in as a Regular User' 
                            : '→ Log in as a Service Provider'}
                    </Link>
                </div>

                {/* The selected Login Component */}
                <LoginComponent onSuccess={handleLoginSuccess} />

                {/* Link to Register Page */}
                <div className="mt-8 text-center text-gray-600">
                    Don't have an account? 
                    <Link 
                        to={`/register?type=${loginType}`} 
                        className="text-sky-800 hover:text-sky-900 font-semibold ml-1 underline"
                    >
                        Sign up now
                    </Link>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-100 font-sans">
            <Header />
            <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
                <section className="w-full max-w-2xl">
                    {renderContent()}
                </section>
            </main>
        </div>
    );
};

export default LoginPage;