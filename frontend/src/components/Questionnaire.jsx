import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';

const Questionnaire = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [logs, setLogs] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();

    const handleSubmit = useCallback(async (finalAnswers) => {
        setSubmitting(true);
        try {
            const res = await api.post('/api/submit/', { answers: finalAnswers });
            navigate('/roadmap', { state: { data: res.data } });
        } catch (error) {
            console.error("Submission failed", error);
            alert("Failed to analyze. Please ensure the AI service is available and try again.");
            setSubmitting(false);
        }
    }, [navigate]);

    useEffect(() => {
        const customExplore = location.state?.customExplore;
        if (customExplore) {
            setQuestions([]);
            setLoading(false);
            handleSubmit({ custom_explore: customExplore });
        } else {
            api.get('/api/questions/')
                .then(res => {
                    setQuestions(res.data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [location.state, handleSubmit]);

    useEffect(() => {
        if (!submitting) {
            setLogs([]);
            return;
        }

        const logMessages = [
            "[INFO] Launching CareerSea Discovery Engine...",
            "[INFO] Analyzing interest patterns...",
            "[INFO] Formulating mainstream and adjacent pathways...",
            "[INFO] Injecting wildcard possibilities...",
            "[INFO] Curating top-tier learning resources...",
            "[INFO] Polishing neubrutalist blueprints...",
            "[SUCCESS] Roadmap compiled successfully!"
        ];

        let currentLogIndex = 0;
        setLogs([logMessages[0]]);

        const interval = setInterval(() => {
            currentLogIndex++;
            if (currentLogIndex < logMessages.length) {
                setLogs(prev => [...prev, logMessages[currentLogIndex]]);
            } else {
                clearInterval(interval);
            }
        }, 1200);

        return () => clearInterval(interval);
    }, [submitting]);

    const handleNext = () => {
        if (!currentAnswer.trim()) return;

        const question = questions[currentIndex];
        const newAnswers = { ...answers, [question.text]: currentAnswer };
        setAnswers(newAnswers);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setCurrentAnswer('');
        } else {
            handleSubmit(newAnswers);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[50vh] font-black text-2xl tracking-widest animate-pulse">
            LOADING...
        </div>
    );

    if (submitting) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-left px-4">
                <div className="pop-card w-full max-w-[600px] bg-[#121212] text-[#00ff00] border-pop border-text shadow-pop p-6 font-mono rounded-pop select-none">
                    {/* Console Header */}
                    <div className="flex justify-between items-center border-b-2 border-[#333] pb-4 mb-4">
                        <div className="flex gap-2">
                            <span className="w-3 h-3 rounded-full bg-accent border border-text"></span>
                            <span className="w-3 h-3 rounded-full bg-secondary border border-text"></span>
                            <span className="w-3 h-3 rounded-full bg-primary border border-text"></span>
                        </div>
                        <span className="text-xs uppercase font-bold tracking-widest text-[#666]">discovery_console.log</span>
                    </div>
                    {/* Console Body */}
                    <div className="flex flex-col gap-2 min-h-[180px] text-sm overflow-y-auto">
                        <AnimatePresence>
                            {logs.map((log, index) => (
                                <Motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={log.includes("[SUCCESS]") ? "text-[#00ff00] font-black" : "text-[#888]"}
                                >
                                    {log}
                                </Motion.div>
                            ))}
                        </AnimatePresence>
                        {logs.length < 7 && (
                            <Motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                className="inline-block w-2 h-4 bg-[#888] mt-1"
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (questions.length === 0 && !location.state?.customExplore) return <div className="text-center font-bold p-20">No questions found.</div>;

    const question = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;

    return (
        <div className="max-w-[800px] mx-auto w-full px-4 py-8">
            {/* Progress Bar */}
            <div className="w-full h-4 border-pop border-text rounded-full mb-12 bg-surface overflow-hidden relative">
                <Motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-secondary"
                />
            </div>

            <AnimatePresence mode='wait'>
                <Motion.div
                    key={currentIndex}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="pop-card mb-8">
                        <h2 className="text-sm font-black text-text-light uppercase mb-4 tracking-widest">
                            Step {currentIndex + 1} of {questions.length}
                        </h2>
                        <h1 className="text-2xl sm:text-4xl mb-10 leading-tight">
                            {question.text}
                        </h1>

                        <div className="grid gap-4">
                            {question.choices && question.choices.length > 0 ? (
                                question.choices.map((choice) => (
                                    <button
                                        key={choice}
                                        onClick={() => setCurrentAnswer(choice)}
                                        className={`w-full text-left p-6 font-bold text-lg border-pop border-text rounded-pop transition-all ${
                                            currentAnswer === choice 
                                            ? 'bg-tertiary shadow-pop -translate-x-[2px] -translate-y-[2px]' 
                                            : 'bg-bg hover:bg-surface'
                                        }`}
                                    >
                                        {choice}
                                    </button>
                                ))
                            ) : (
                                <textarea
                                    value={currentAnswer}
                                    onChange={(e) => setCurrentAnswer(e.target.value)}
                                    placeholder="Type your answer here..."
                                    className="pop-input min-h-[200px] text-xl resize-none"
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleNext}
                            disabled={!currentAnswer}
                            className={`pop-button px-12 ${!currentAnswer ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
                        >
                            {currentIndex === questions.length - 1 ? 'Finish' : 'Next Step'}
                        </button>
                    </div>
                </Motion.div>
            </AnimatePresence>
        </div>
    );
};

export default Questionnaire;
