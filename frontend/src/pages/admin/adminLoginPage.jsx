// src/pages/Admin/AdminLoginPage.jsx
import React, { useState } from 'react';
// We'll switch to 'fetch' or continue using 'axios' but with the full URL
import axios from 'axios'; 
import { useNavigate } from 'react-router-dom';

const AdminLoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false); // Add loading state
    const navigate = useNavigate();

    // ⭐ Define the full backend URL here for reliability
    //    Ensure this matches the port your Express server is running on (e.g., 5000)
    const API_ENDPOINT = 'http://localhost:5000/api/auth/loginAdmin'; 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Use the absolute API_ENDPOINT
            const response = await axios.post(API_ENDPOINT, { email, password });
            
            // NOTE: axios wraps the response data in `response.data`, 
            // and your controller nests the result in `response.data.data`
            const { token, admin } = response.data.data;
            
            // ⭐ Store the JWT securely
            localStorage.setItem('adminToken', token); 
            localStorage.setItem('adminUser', JSON.stringify(admin));

            // Navigate to the main dashboard page
            navigate('/admin');

        } catch (err) {
            // Log the detailed error from the server
            console.error("Admin Login Error:", err.response || err); 
            
            const errorMessage = err.response?.data?.error 
                                 || 'Login failed. Check email and password.';
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <h2>Admin Login</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {error && <p style={{ color: 'red', padding: '10px', border: '1px solid red', borderRadius: '4px', backgroundColor: '#fee' }}>{error}</p>}
                
                <input 
                    type="email" 
                    placeholder="Admin Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <button 
                    type="submit" 
                    disabled={loading}
                    style={{ 
                        padding: '10px', 
                        backgroundColor: loading ? '#ccc' : '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: loading ? 'not-allowed' : 'pointer' 
                    }}
                >
                    {loading ? 'Logging In...' : 'Log In'}
                </button>
            </form>
        </div>
    );
};

export default AdminLoginPage;