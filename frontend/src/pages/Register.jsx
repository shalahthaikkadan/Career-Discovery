import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/register/', { username, email, password });
            alert("Registration successful! You can now log in.");
            navigate('/login');
        } catch {
            alert("Registration failed. Try a different username.");
        }
    };

    return (
        <div className="pop-card max-w-[400px] mx-auto my-12 sm:my-16">
            <h1 className="text-4xl mb-8 uppercase">REGISTER</h1>
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
                    <label className="block font-black mb-2 uppercase text-sm tracking-wider">EMAIL (OPTIONAL)</label>
                    <input 
                        type="email" 
                        className="pop-input" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
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
                <button type="submit" className="pop-button w-full">Create Account</button>
            </form>
            <p className="mt-6 text-center text-base">
                Already have an account? <Link to="/login" className="font-bold underline decoration-2 underline-offset-4 hover:text-primary transition-colors">Login here</Link>
            </p>
        </div>
    );
};

export default Register;
