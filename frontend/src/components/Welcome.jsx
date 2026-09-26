import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';

const Welcome = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [showDisclaimer, setShowDisclaimer] = useState(!localStorage.getItem('hide_welcome_disclaimer'));

    const handleExplore = (e) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;
        navigate('/assessment', { state: { customExplore: searchQuery.trim() } });
    };

    const handleDismiss = () => {
        localStorage.setItem('hide_welcome_disclaimer', 'true');
        setShowDisclaimer(false);
    };

    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[75vh] px-4 py-8">
            <Motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.5, ease: "backOut" }}
                className="relative w-full max-w-[800px]"
            >
                {/* Decorative Background Elements */}
                <div className="absolute -top-12 -left-10 w-20 h-20 bg-primary border-4 border-text rounded-full -z-10 hidden md:block animate-bounce" />
                <div className="absolute -bottom-10 -right-10 w-16 h-16 bg-accent border-4 border-text -z-10 hidden md:block rotate-12" />

                <h1 className="text-5xl sm:text-7xl md:text-8xl mb-6 leading-[0.85] tracking-tightest font-black uppercase">
                    NAVIGATE<br />
                    <div className="inline-block relative my-3 px-6 py-2 bg-tertiary border-pop border-text shadow-pop rotate-2 transform-gpu">
                        <span className="relative z-10 text-text">YOUR</span>
                    </div><br />
                    FUTURE
                </h1>

                <p className="max-w-[600px] mx-auto mb-10 text-lg sm:text-xl font-black text-text-light leading-snug">
                    Get a custom-built blueprint for the career journey you actually want. 
                    <span className="text-text block mt-1 underline decoration-accent decoration-4 underline-offset-4">No bias. No pre-packaged answers. Just pure exploration.</span>
                </p>

                {/* Neubrutalist Direct Search Exploration Bar */}
                <form onSubmit={handleExplore} className="max-w-[550px] mx-auto w-full mb-8 flex border-pop border-text rounded-pop overflow-hidden bg-surface shadow-pop transition-transform hover:-translate-x-[2px] hover:-translate-y-[2px]">
                    <input 
                        type="text" 
                        placeholder="Explore a career directly (e.g. Space Architect)..."
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

                {/* Alternative Assessment Entry */}
                <div className="flex flex-col items-center gap-2 mb-12">
                    <span className="text-xs font-black uppercase tracking-widest text-text-light">Or find your path from scratch</span>
                    <Motion.button
                        className="pop-button text-xl px-8 py-4 bg-secondary"
                        onClick={() => navigate('/assessment')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Take Reflective Assessment
                    </Motion.button>
                </div>
                {/* Neubrutalist Disclaimer Note Popup Modal */}
                <AnimatePresence>
                    {showDisclaimer && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <Motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                                className="pop-card text-left bg-surface border-pop border-text shadow-pop p-8 relative w-full max-w-[600px] select-none"
                            >
                                <button 
                                    onClick={handleDismiss} 
                                    className="absolute top-4 right-4 font-black text-xs uppercase hover:text-accent cursor-pointer border-2 border-text bg-bg px-2 py-1 shadow-pop-sm active:translate-x-[1px] active:translate-y-[1px]"
                                >
                                    ✕ Close
                                </button>
                                <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                                    <span>⚓</span> Charting Your Own Course
                                </h3>
                                <p className="text-sm font-bold text-text-light leading-relaxed mb-4">
                                    Welcome to CareerSea! We're here to help you explore. Before you set sail, please note:
                                </p>
                                <ul className="text-xs font-bold text-text-light list-disc pl-5 space-y-3 mb-6">
                                    <li><strong>AI Limitations:</strong> AI models can be biased, might carry outdated info, and cannot capture the full nuance of newly emerging or highly localized roles.</li>
                                    <li><strong>Beyond a Screen:</strong> A career is a dynamic, lifelong voyage. It cannot be decided by an algorithm analyzing a few questions and answers.</li>
                                    <li><strong>Trust Your Judgment:</strong> Use these roadmaps as inspiration and starting points. Always talk to real professionals, seek hands-on experience, and trust your own intuition.</li>
                                </ul>
                                <div className="flex justify-end">
                                    <button 
                                        onClick={handleDismiss}
                                        className="pop-button bg-primary text-sm px-6 py-3 cursor-pointer"
                                    >
                                        I Understand, Let's Go!
                                    </button>
                                </div>
                            </Motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </Motion.div>
        </div>
    );
};

export default Welcome;
