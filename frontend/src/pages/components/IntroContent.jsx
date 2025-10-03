import React from 'react';
import { Link } from 'react-router-dom'; // <-- Import Link

const IntroContent = () => {
    return (
        <div className="w-full max-w-xl bg-white shadow-2xl rounded-3xl p-10 text-center">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Welcome! Join as...</h1>
            <p className="text-gray-600 mb-8">Choose the type of account you'd like to create.</p>

            <div className="space-y-4">
                {/* Link to AuthPage with type=user query parameter */}
                <Link
                    to="/auth?type=user" // <-- Key change: Add the query string
                    className="block w-full py-4 bg-sky-500 text-white font-bold text-lg rounded-xl hover:bg-sky-600 transition shadow-lg"
                >
                    Sign up as a **User**
                </Link>

                <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative bg-white px-4 text-sm text-gray-500">
                        OR
                    </div>
                </div>

                {/* Link to AuthPage with type=provider query parameter */}
                <Link
                    to="/auth?type=provider" // <-- Key change: Add the query string
                    className="block w-full py-4 bg-lime-500 text-white font-bold text-lg rounded-xl hover:bg-lime-600 transition shadow-lg"
                >
                    Sign up as a **Provider**
                </Link>
            </div>

            <p className="mt-8 text-sm text-gray-500">
                Already have an account? <a href="/login" className="text-sky-500 hover:underline font-medium">Log In</a>
            </p>
        </div>
    );
}

export default IntroContent;