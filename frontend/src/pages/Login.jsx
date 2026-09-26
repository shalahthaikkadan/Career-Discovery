import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/api/token/', { username, password });
            sessionStorage.setItem('access_token', res.data.access);
            navigate('/');
        } catch {
            alert("Login failed. Please check your credentials.");
        }
    };

    return (
        <div className="pop-card max-w-[400px] mx-auto my-12 sm:my-16">
            <h1 className="text-4xl mb-8 uppercase">LOGIN</h1>
            <form onSubmit={handleSubmit} className="grid gap-6">
                <div>
                    <label className="block font-black mb-2 uppercase text-sm tracking-wider">USERNAME</label>
                    <input 
                        type="text" 
                        className="pop-input" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                    />
                </div>
                <div>
                    <label className="block font-black mb-2 uppercase text-sm tracking-wider">PASSWORD</label>
                    <input 
                        type="password" 
                        className="pop-input" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                </div>
                <button type="submit" className="pop-button w-full">Sign In</button>
            </form>
            <p className="mt-6 text-center text-base">
                Don't have an account? <Link to="/register" className="font-bold underline decoration-2 underline-offset-4 hover:text-primary transition-colors">Register here</Link>
            </p>
        </div>
    );
};

export default Login;
