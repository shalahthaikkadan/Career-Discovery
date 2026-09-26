import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { Clock, BookOpen, Home, CheckCircle, Sparkles } from 'lucide-react';

const Roadmap = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const data = location.state?.data;

    const [activeTab, setActiveTab] = useState(0);

    if (!data || !data.suggestions || data.suggestions.length === 0) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center gap-12 text-center px-4">
                <h1 className="pop-card text-3xl font-black uppercase">NO MAP FOUND</h1>
                <button onClick={() => navigate('/')} className="pop-button text-xl">Return Home</button>
            </div>
        );
    }

    const suggestion = data.suggestions[activeTab];

    return (
        <div className="max-w-[1000px] mx-auto pb-24 px-4 sm:px-6">

            {/* Path Selector Tabs */}
            <div className="flex flex-wrap justify-center gap-4 mt-8 mb-12">
                {data.suggestions.map((sug, index) => (
                    <button
                        key={sug.id || index}
                        onClick={() => {
                            setActiveTab(index);
                        }}
                        className={`px-6 py-3 font-black uppercase transition-transform border-4 border-text ${
                            activeTab === index 
                                ? 'bg-primary shadow-pop -translate-y-2' 
                                : 'bg-surface hover:-translate-y-1 hover:shadow-pop-sm'
                        }`}
                    >
                        {sug.type || `Path ${index + 1}`}
                    </button>
                ))}
            </div>

            {/* Header Section */}
            <div className="text-center mb-20 pt-8">
                <Motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="inline-block bg-tertiary border-pop border-text px-6 py-2 mb-8 font-black text-lg -rotate-2 shadow-pop"
                >
                    RECOMMENDED CAREER
                </Motion.div>

                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-12 uppercase leading-none tracking-tighter">
                    {suggestion.title}
                </h1>

                <Motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="pop-card text-left max-w-3xl mx-auto"
                >
                    <p className="text-xl sm:text-2xl font-bold leading-relaxed mb-8">
                        {suggestion.description}
                    </p>
                    <div className="bg-primary border-pop border-text rounded-pop p-6 sm:p-8 font-bold text-lg">
                        <span className="block text-xs uppercase mb-2 tracking-[0.2em] opacity-60">Why this fits you:</span>
                        {suggestion.reasoning}
                    </div>
                </Motion.div>
            </div>

            {/* Roadmap Visualization */}
            <div className="relative pt-12">
                <div className="text-center mb-20">
                    <h2 className="text-2xl sm:text-3xl font-black inline-block bg-text text-bg px-8 py-3 rotate-1 shadow-pop">
                        YOUR ROADMAP
                    </h2>
                </div>

                {/* Central Line */}
                <div className="absolute left-8 md:left-1/2 top-32 bottom-0 w-1 md:w-2 bg-text border-l-pop border-dashed border-text -translate-x-1/2 z-0 hidden sm:block"></div>

                <div className="grid gap-12 md:gap-24 relative z-10">
                    {suggestion.roadmap_steps.map((step, index) => (
                        <Motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            key={step.id || index}
                            className={`flex flex-col md:flex-row items-center w-full ${
                                index % 2 === 0 ? 'md:justify-end' : 'md:justify-start'
                            }`}
                        >
                            <div className={`w-full md:w-[45%] relative group`}>
                                {/* Step Number Badge */}
                                <div className={`absolute -top-6 -left-6 w-12 h-12 bg-text text-bg flex items-center justify-center font-black text-xl rounded-full border-4 border-bg z-20 shadow-pop-sm group-hover:scale-110 transition-transform`}>
                                    {step.order}
                                </div>

                                <div className={`pop-card w-full !p-8 ${
                                    index % 2 === 0 ? 'bg-bg' : 'bg-primary'
                                }`}>
                                    <h3 className="text-xl sm:text-2xl font-black uppercase mb-4 leading-tight">{step.title}</h3>
                                    <p className="font-bold text-text-light mb-6 leading-relaxed text-sm sm:text-base">{step.description}</p>

                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-wrap gap-3 font-black text-xs uppercase tracking-wider">
                                            {step.duration && (
                                                <div className="flex items-center gap-2 bg-surface border-2 border-text px-4 py-1.5 rounded-full shadow-pop-sm">
                                                    <Clock size={16} /> {step.duration}
                                                </div>
                                            )}
                                        </div>

                                        {step.resources && step.resources.length > 0 && (
                                            <div className="mt-2">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-50 flex items-center gap-2">
                                                    <BookOpen size={12} /> Key Resources
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {step.resources.map((res, i) => (
                                                        <div key={i} className="bg-surface border-2 border-text px-3 py-1 rounded-md text-[11px] font-bold shadow-pop-sm">
                                                            {res}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => navigate(`/step/${step.id}`)}
                                            className="w-full mt-4 py-3 px-4 font-black uppercase tracking-wider text-xs sm:text-sm border-4 border-text shadow-pop bg-surface hover:-translate-y-1 hover:shadow-pop-hover transition-all duration-200 flex items-center justify-center gap-2"
                                        >
                                            <Sparkles size={16} />
                                            Deep Dive Into Step
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Motion.div>
                    ))}
                </div>

                {/* Finish Line */}
                <div className="relative z-20 flex justify-center mt-24">
                    <Motion.div
                        whileInView={{ scale: [1, 1.1, 1] }}
                        className="bg-secondary border-pop border-text px-8 py-4 sm:text-2xl font-black shadow-pop-hover flex items-center gap-4 uppercase tracking-tighter"
                    >
                        <CheckCircle size={32} strokeWidth={3} /> Goal Achieved
                    </Motion.div>
                </div>
            </div>



            <div className="text-center mt-24">
                <button onClick={() => navigate('/')} className="pop-button accent text-xl gap-4 group">
                    <Home size={24} className="group-hover:-translate-y-1 transition-transform" /> 
                    Start New Journey
                </button>
            </div>
        </div>
    );
};

export default Roadmap;
