import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { Calendar, ChevronRight, History, Ship } from 'lucide-react';

const Dashboard = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleExplore = (e) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;
        navigate('/assessment', { state: { customExplore: searchQuery.trim() } });
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/api/history/');
                setHistory(res.data);
            } catch (error) {
                console.error("Failed to fetch history", error);
                // 401 handling (redirect to /login) is done by the api interceptor
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [navigate]);

    const handleViewRoadmap = (assessment) => {
        // Pass the assessment data exactly as Questionnaire.jsx does
        navigate('/roadmap', { state: { data: assessment } });
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[50vh] font-black text-2xl animate-pulse">
            RETRIEVING YOUR LOGS...
        </div>
    );

    return (
        <div className="max-w-[800px] mx-auto w-full px-4 py-8">
            <div className="flex items-center gap-4 mb-12">
                <div className="p-3 bg-accent border-2 border-text shadow-pop-sm">
                    <History size={32} />
                </div>
                <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter">Your Sea Logs</h1>
            </div>

            {/* Neubrutalist Direct Search Exploration Bar */}
            <form onSubmit={handleExplore} className="w-full mb-12 flex border-pop border-text rounded-pop overflow-hidden bg-surface shadow-pop transition-transform hover:-translate-x-[2px] hover:-translate-y-[2px]">
                <input 
                    type="text" 
                    placeholder="Embark on a new exploration directly (e.g. Space Architect)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow px-5 py-4 bg-transparent font-bold text-lg outline-none placeholder:text-text-light"
                />
                <button 
                    type="submit"
                    disabled={!searchQuery.trim()}
                    className="bg-primary hover:bg-primary-dark text-text border-l-4 border-text font-black px-8 uppercase tracking-wider text-sm transition-colors cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                >
                    Explore
                </button>
            </form>

            {history.length === 0 ? (
                <div className="pop-card text-center py-20">
                    <Ship size={64} className="mx-auto mb-6 opacity-20" />
                    <h2 className="text-2xl font-bold mb-4 uppercase">No voyages found</h2>
                    <p className="text-text-light mb-8 max-w-xs mx-auto">You haven't generated any career roadmaps yet.</p>
                    <button onClick={() => navigate('/assessment')} className="pop-button">Set Sail Now</button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {history.map((assessment, index) => (
                        <Motion.div
                            key={assessment.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleViewRoadmap(assessment)}
                            className="pop-card cursor-pointer group hover:bg-bg flex items-center justify-between p-6 sm:p-8"
                        >
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-xs font-black uppercase text-text-light tracking-widest">
                                    <Calendar size={14} />
                                    {new Date(assessment.created_at).toLocaleDateString(undefined, { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black uppercase group-hover:text-primary transition-colors">
                                    {assessment.suggestions?.[0]?.title || 'Unknown Path'}
                                </h2>
                                <p className="text-sm font-bold text-text-light line-clamp-1">
                                    {assessment.suggestions?.[0]?.description || 'Click to view details'}
                                </p>
                            </div>
                            <div className="bg-surface border-2 border-text p-2 group-hover:bg-primary transition-colors">
                                <ChevronRight size={24} />
                            </div>
                        </Motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
