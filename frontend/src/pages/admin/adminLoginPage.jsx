// src/pages/Admin/AdminLoginPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminLoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            // ⭐ Assumes you implement a POST /api/auth/admin-login endpoint
            const response = await axios.post('/api/auth/admin-login', { email, password });
            const { token, admin } = response.data.data;
            
            // ⭐ Store the JWT securely (e.g., in localStorage or secure cookie)
            localStorage.setItem('adminToken', token); 
            // Optional: store basic admin info
            localStorage.setItem('adminUser', JSON.stringify(admin));

            // Navigate to the main dashboard page
            navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Check credentials.');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc' }}>
            <h2>Admin Login</h2>
            <form onSubmit={handleSubmit}>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <input 
                    type="email" 
                    placeholder="Admin Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
                <button type="submit">Log In</button>
            </form>
        </div>
    );
};

export default AdminLoginPage;